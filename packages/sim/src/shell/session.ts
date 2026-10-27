import type { World } from '../world';
import { CLEAR_SCREEN, CLEAR_LINE, toCrlf } from './ansi';
import { columns } from './columns';
import { BUILTINS } from './builtins';
import { COMMANDS } from './commands';
import { runItems, runLine, type ExecResult } from './exec';
import { parseKeys, type Key } from './keys';
import { bastionBanner, bastionShell } from './login';
import type { Shell } from './shell';
import type { ListItem } from './tokenize';
import type { Program, ProgramHost, Term } from './types';

export interface SessionOptions {
  world: World;
  cols?: number;
  rows?: number;
  /** Wall-clock timer. The server passes setTimeout; tests pass a fake. */
  schedule?: (ms: number, fn: () => void) => () => void;
  /** Called with every command line the user runs (the action log hooks in here). */
  onCommand?: (entry: { host: string; user: string; line: string; success?: boolean }) => void;
}

interface Running {
  program: Program;
  pipeTail?: (chunk: string) => string;
  rest?: ListItem[];
  shell: Shell;
  cancels: (() => void)[];
}

/**
 * One browser terminal. Owns the line editor and a stack of shells (bastion → ssh → sudo -i).
 * Input is raw keystrokes; output is terminal bytes. No real process is ever started.
 */
export class TerminalSession {
  private readonly world: World;
  private stack: Shell[] = [];
  private listeners: ((data: string) => void)[] = [];
  private buf = '';
  private cursor = 0;
  private histIndex = -1;
  private savedBuf = '';
  private lastTab = false;
  private running: Running | null = null;
  private closed = false;
  readonly term: Term;
  private readonly schedule: (ms: number, fn: () => void) => () => void;

  constructor(private readonly opts: SessionOptions) {
    this.world = opts.world;
    this.term = { cols: opts.cols ?? 80, rows: opts.rows ?? 24 };
    this.schedule =
      opts.schedule ??
      (() => () => {
        /* no timers by default */
      });
  }

  onOutput(fn: (data: string) => void): void {
    this.listeners.push(fn);
  }

  private emit(data: string): void {
    if (data) for (const l of this.listeners) l(data);
  }

  private print(text: string): void {
    this.emit(toCrlf(text));
  }

  get shell(): Shell {
    return this.stack[this.stack.length - 1]!;
  }

  /** Hostname and user of the active shell, for the UI. */
  get location(): { host: string; user: string } {
    return { host: this.shell.host.hostname, user: this.shell.user };
  }

  start(): void {
    this.stack = [bastionShell(this.world)];
    this.print(bastionBanner(this.world));
    this.showPrompt();
  }

  resize(cols: number, rows: number): void {
    this.term.cols = Math.max(20, Math.min(500, Math.floor(cols)));
    this.term.rows = Math.max(5, Math.min(200, Math.floor(rows)));
    this.running?.program.resize?.();
  }

  /** Called after every simulation tick so live programs (tail -f) can emit new lines. */
  tick(): void {
    this.running?.program.tick?.();
  }

  dispose(): void {
    this.closed = true;
    if (this.running) {
      this.running.program.stop?.();
      this.running.cancels.forEach((c) => c());
      this.running = null;
    }
    this.listeners = [];
  }

  input(data: string): void {
    if (this.closed) return;
    for (const key of parseKeys(data)) {
      if (this.running) this.running.program.key(key);
      else this.editKey(key);
    }
  }

  // --- Line editor ---

  private showPrompt(): void {
    this.buf = '';
    this.cursor = 0;
    this.histIndex = -1;
    this.emit(this.shell.prompt());
  }

  private redraw(): void {
    const prompt = this.shell.prompt();
    let out = `\r${CLEAR_LINE}${prompt}${this.buf}`;
    const back = this.buf.length - this.cursor;
    if (back > 0) out += `\x1b[${back}D`;
    this.emit(out);
  }

  private setBuffer(text: string): void {
    this.buf = text;
    this.cursor = text.length;
    this.redraw();
  }

  private editKey(k: Key): void {
    const wasTab = this.lastTab;
    this.lastTab = false;
    switch (k.name) {
      case 'char':
        this.buf = this.buf.slice(0, this.cursor) + k.ch + this.buf.slice(this.cursor);
        this.cursor++;
        if (this.cursor === this.buf.length) this.emit(k.ch!);
        else this.redraw();
        return;
      case 'enter':
        this.emit('\r\n');
        this.submit(this.buf);
        return;
      case 'backspace':
        if (this.cursor === 0) return;
        this.buf = this.buf.slice(0, this.cursor - 1) + this.buf.slice(this.cursor);
        this.cursor--;
        this.redraw();
        return;
      case 'delete':
        if (this.cursor >= this.buf.length) return;
        this.buf = this.buf.slice(0, this.cursor) + this.buf.slice(this.cursor + 1);
        this.redraw();
        return;
      case 'left':
        if (this.cursor > 0) {
          this.cursor--;
          this.emit('\x1b[D');
        }
        return;
      case 'right':
        if (this.cursor < this.buf.length) {
          this.cursor++;
          this.emit('\x1b[C');
        }
        return;
      case 'home':
        this.cursor = 0;
        this.redraw();
        return;
      case 'end':
        this.cursor = this.buf.length;
        this.redraw();
        return;
      case 'up':
        return this.historyMove(1);
      case 'down':
        return this.historyMove(-1);
      case 'tab':
        this.lastTab = true;
        return this.complete(wasTab);
      case 'ctrl':
        return this.ctrlKey(k.ch!);
      default:
        return;
    }
  }

  private ctrlKey(ch: string): void {
    switch (ch) {
      case 'c':
        this.emit('^C\r\n');
        this.shell.lastExit = 130;
        this.showPrompt();
        return;
      case 'd':
        if (this.buf.length === 0) {
          this.emit('\r\n');
          this.submit('exit', false);
        }
        return;
      case 'l':
        this.emit(CLEAR_SCREEN);
        this.redraw();
        return;
      case 'a':
        this.cursor = 0;
        this.redraw();
        return;
      case 'e':
        this.cursor = this.buf.length;
        this.redraw();
        return;
      case 'u':
        this.buf = this.buf.slice(this.cursor);
        this.cursor = 0;
        this.redraw();
        return;
      case 'k':
        this.buf = this.buf.slice(0, this.cursor);
        this.redraw();
        return;
      case 'w': {
        const before = this.buf.slice(0, this.cursor).replace(/\S+\s*$/, '');
        this.buf = before + this.buf.slice(this.cursor);
        this.cursor = before.length;
        this.redraw();
        return;
      }
      default:
        return;
    }
  }

  private historyMove(dir: 1 | -1): void {
    const h = this.shell.history;
    if (!h.length) return;
    if (this.histIndex === -1) {
      if (dir === -1) return;
      this.savedBuf = this.buf;
    }
    const next = this.histIndex + dir;
    if (next < -1 || next >= h.length) return;
    this.histIndex = next;
    this.setBuffer(next === -1 ? this.savedBuf : h[h.length - 1 - next]!);
  }

  private complete(listAll: boolean): void {
    const before = this.buf.slice(0, this.cursor);
    const m = /(\S*)$/.exec(before)!;
    const word = m[1]!;
    const isCommand = before.slice(0, before.length - word.length).trim() === '' && !word.includes('/');
    let candidates: string[];
    let prefix = word;
    if (isCommand) {
      const names = new Set([
        ...Object.keys(BUILTINS),
        ...Object.keys(COMMANDS),
        ...this.shell.aliases.keys(),
      ]);
      candidates = [...names].filter((n) => n.startsWith(word) && n !== '.').sort();
    } else {
      const dirPart = word.includes('/') ? word.slice(0, word.lastIndexOf('/') + 1) : '';
      prefix = word.slice(dirPart.length);
      const dir = dirPart ? this.shell.resolve(dirPart) : this.shell.cwd;
      try {
        candidates = this.shell.fs
          .readdir(dir, this.shell.cred)
          .filter(([n]) => n.startsWith(prefix) && (prefix.startsWith('.') || !n.startsWith('.')))
          .map(([n, node]) => (node.type === 'dir' ? `${n}/` : n));
      } catch {
        candidates = [];
      }
    }
    if (!candidates.length) return;
    if (candidates.length === 1) {
      const c = candidates[0]!;
      const add = c.slice(prefix.length) + (c.endsWith('/') ? '' : ' ');
      this.buf = before + add + this.buf.slice(this.cursor);
      this.cursor += add.length;
      this.redraw();
      return;
    }
    let common = candidates[0]!;
    for (const c of candidates) while (!c.startsWith(common)) common = common.slice(0, -1);
    if (common.length > prefix.length) {
      const add = common.slice(prefix.length);
      this.buf = before + add + this.buf.slice(this.cursor);
      this.cursor += add.length;
      this.redraw();
    } else if (listAll) {
      this.print('\n' + columns(candidates, this.term.cols) + '\n');
      this.redraw();
    }
  }

  // --- Execution ---

  private submit(line: string, record = true): void {
    const sh = this.shell;
    const trimmed = line.trim();
    if (record && trimmed && sh.history[sh.history.length - 1] !== trimmed) sh.history.push(trimmed);
    if (!trimmed) return this.showPrompt();

    let result: ExecResult;
    try {
      result = runLine(sh, trimmed, this.term);
    } catch (e) {
      // A bug in a simulated command must never break the session.
      result = { output: `bash: internal sandbox error: ${(e as Error).message}\n` };
      sh.lastExit = 1;
    }
    this.opts.onCommand?.({ host: sh.host.hostname, user: sh.user, line: trimmed, success: !result.program && sh.lastExit === 0 });
    this.handle(result, sh);
  }

  private handle(result: ExecResult, sh: Shell): void {
    if (result.output) this.print(result.output);
    if (result.program) return this.startProgram(result, sh);
    if (result.push) {
      this.stack.push(result.push);
      return this.showPrompt();
    }
    if (result.exitShell) return this.exitShell();
    if (result.rest?.length) return this.handle(runItems(sh, result.rest, this.term), sh);
    this.showPrompt();
  }

  private exitShell(): void {
    const leaving = this.stack.pop()!;
    if (leaving.kind === 'ssh' || leaving.kind === 'bastion') this.print('logout\n');
    if (leaving.kind === 'ssh') this.print(`Connection to ${leaving.host.hostname} closed.\n`);
    if (this.stack.length === 0) {
      this.print('\nConnection to bastion closed. Reconnecting...\n\n');
      this.start();
      return;
    }
    this.showPrompt();
  }

  private startProgram(result: ExecResult, sh: Shell): void {
    const program = result.program!;
    const running: Running = {
      program,
      pipeTail: result.pipeTail,
      rest: result.rest,
      shell: sh,
      cancels: [],
    };
    this.running = running;
    const host: ProgramHost = {
      term: this.term,
      write: (data) => {
        if (this.running !== running) return;
        const out = running.pipeTail ? running.pipeTail(data) : data;
        this.emit(program.fullscreen ? out : toCrlf(out));
      },
      exit: (code = 0) => {
        if (this.running !== running) return;
        running.cancels.forEach((c) => c());
        this.running = null;
        sh.lastExit = code;
        if (running.rest?.length) this.handle(runItems(sh, running.rest, this.term), sh);
        else this.showPrompt();
      },
      schedule: (ms, fn) => {
        const cancel = this.schedule(ms, () => {
          if (this.running === running) fn();
        });
        running.cancels.push(cancel);
        return cancel;
      },
    };
    program.start(host);
  }
}
