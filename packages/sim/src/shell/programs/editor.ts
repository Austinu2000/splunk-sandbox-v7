import { basename } from '../../vfs/path';
import { can, FsError } from '../../vfs/vfs';
import { ALT_SCREEN_OFF, ALT_SCREEN_ON, CLEAR_LINE, CLEAR_SCREEN, INVERSE, RESET, moveTo } from '../ansi';
import { lines as splitLines } from '../commands/util';
import type { Key } from '../keys';
import type { Shell } from '../shell';
import type { Program, ProgramHost } from '../types';

/**
 * Text buffer shared by the vi and nano front ends. Saving writes through the virtual filesystem,
 * so permissions apply and the change lands in the host's overlay (config edits only take effect
 * after the right reload/restart, from milestone 3).
 */
class Buffer {
  lines: string[];
  row = 0;
  col = 0;
  top = 0;
  dirty = false;
  readonly existed: boolean;
  readonly readError: string | null;
  get writable(): boolean {
    const n = this.path ? this.sh.fs.findNode(this.path) : null;
    return !n || can(n, this.sh.cred, 2);
  }

  constructor(
    readonly sh: Shell,
    public path: string | null,
  ) {
    let text = '';
    let readError: string | null = null;
    let existed = false;
    if (path) {
      const node = sh.fs.findNode(path);
      existed = !!node;
      if (node) {
        try {
          text = sh.fs.readFile(path, sh.cred);
        } catch (e) {
          if (!(e instanceof FsError)) throw e;
          readError = e.message;
        }
      }
    }
    this.lines = splitLines(text);
    if (!this.lines.length) this.lines = [''];
    this.existed = existed;
    this.readError = readError;
  }

  get line(): string {
    return this.lines[this.row]!;
  }

  clampCol(insert: boolean): void {
    const max = insert ? this.line.length : Math.max(0, this.line.length - 1);
    this.col = Math.max(0, Math.min(this.col, max));
  }

  insert(text: string): void {
    this.lines[this.row] = this.line.slice(0, this.col) + text + this.line.slice(this.col);
    this.col += text.length;
    this.dirty = true;
  }

  newline(): void {
    const rest = this.line.slice(this.col);
    this.lines[this.row] = this.line.slice(0, this.col);
    this.lines.splice(this.row + 1, 0, rest);
    this.row++;
    this.col = 0;
    this.dirty = true;
  }

  backspace(): void {
    if (this.col > 0) {
      this.lines[this.row] = this.line.slice(0, this.col - 1) + this.line.slice(this.col);
      this.col--;
      this.dirty = true;
    } else if (this.row > 0) {
      const prev = this.lines[this.row - 1]!;
      this.lines[this.row - 1] = prev + this.line;
      this.lines.splice(this.row, 1);
      this.row--;
      this.col = prev.length;
      this.dirty = true;
    }
  }

  deleteChar(): void {
    if (this.col < this.line.length) {
      this.lines[this.row] = this.line.slice(0, this.col) + this.line.slice(this.col + 1);
      this.dirty = true;
    } else if (this.row < this.lines.length - 1) {
      this.lines[this.row] = this.line + this.lines[this.row + 1];
      this.lines.splice(this.row + 1, 1);
      this.dirty = true;
    }
  }

  move(dr: number, dc: number, insert: boolean): void {
    this.row = Math.max(0, Math.min(this.lines.length - 1, this.row + dr));
    this.col += dc;
    this.clampCol(insert);
  }

  scroll(height: number): void {
    if (this.row < this.top) this.top = this.row;
    if (this.row >= this.top + height) this.top = this.row - height + 1;
  }

  find(query: string, dir: 1 | -1): boolean {
    const n = this.lines.length;
    for (let step = 1; step <= n; step++) {
      const r = (((this.row + dir * step) % n) + n) % n;
      const c = this.lines[r]!.indexOf(query);
      if (c >= 0) {
        this.row = r;
        this.col = c;
        return true;
      }
    }
    const c = this.line.indexOf(query, this.col + 1);
    if (c >= 0) {
      this.col = c;
      return true;
    }
    return false;
  }

  /** Writes the buffer; returns an error message or null. */
  save(force = false): string | null {
    if (!this.path) return 'No file name';
    if (!this.writable && !force) return 'readonly';
    try {
      this.sh.fs.writeFile(this.path, this.lines.join('\n') + '\n', this.sh.cred);
      this.dirty = false;
      return null;
    } catch (e) {
      if (!(e instanceof FsError)) throw e;
      return e.message;
    }
  }

  get bytes(): number {
    return new TextEncoder().encode(this.lines.join('\n') + '\n').length;
  }
}

const visible = (s: string, cols: number) => s.replace(/\t/g, '    ').slice(0, cols);

// ---------------------------------------------------------------- vi

export function viProgram(sh: Shell, file: string | undefined): Program {
  const path = file ? sh.resolve(file) : null;
  const buf = new Buffer(sh, path);
  const shown = file ?? '[No Name]';
  let host: ProgramHost;
  let mode: 'normal' | 'insert' | 'command' | 'search' = 'normal';
  let cmdline = '';
  let message = '';
  let count = '';
  let pending = '';
  let yank: string[] = [];
  let lastSearch = '';
  let undo: { lines: string[]; row: number; col: number } | null = null;
  let numbers = false;

  if (buf.readError) message = `"${shown}" [Permission Denied]`;
  else if (!buf.existed) message = `"${shown}" [New]`;
  else message = `"${shown}"${buf.writable ? '' : ' [readonly]'} ${buf.lines.length}L, ${buf.bytes}B`;

  const height = () => Math.max(1, host.term.rows - 1);
  const gutter = () => (numbers ? 8 : 0);
  const snapshot = () => (undo = { lines: [...buf.lines], row: buf.row, col: buf.col });

  const render = () => {
    buf.scroll(height());
    let out = CLEAR_SCREEN;
    for (let r = 0; r < height(); r++) {
      const i = buf.top + r;
      const line = buf.lines[i];
      out += moveTo(r + 1, 1);
      if (line === undefined) out += '\x1b[34m~\x1b[0m';
      else
        out +=
          (numbers ? `\x1b[33m${String(i + 1).padStart(6)} \x1b[0m ` : '') +
          visible(line, host.term.cols - gutter());
    }
    const status =
      mode === 'command'
        ? `:${cmdline}`
        : mode === 'search'
          ? `/${cmdline}`
          : mode === 'insert'
            ? `\x1b[1m-- INSERT --\x1b[0m`
            : message;
    out += moveTo(height() + 1, 1) + CLEAR_LINE + status;
    if (mode === 'command' || mode === 'search') out += moveTo(height() + 1, cmdline.length + 2);
    else
      out += moveTo(buf.row - buf.top + 1, Math.min(buf.col, host.term.cols - 1 - gutter()) + 1 + gutter());
    host.write(out);
  };

  const quit = () => {
    host.write(ALT_SCREEN_OFF);
    host.exit(0);
  };

  const runCommand = (c: string) => {
    const cmd = c.trim();
    if (/^\d+$/.test(cmd)) {
      buf.row = Math.min(buf.lines.length - 1, Math.max(0, Number(cmd) - 1));
      buf.col = 0;
      return;
    }
    const m = /^(w|q|wq|x|q!|w!|wq!|x!)$/.exec(cmd);
    if (cmd === 'set nu' || cmd === 'set number') return void (numbers = true);
    if (cmd === 'set nonu' || cmd === 'set nonumber') return void (numbers = false);
    if (!m) {
      message = `\x1b[37;41mE492: Not an editor command: ${cmd}\x1b[0m`;
      return;
    }
    const force = cmd.endsWith('!');
    const write = cmd.startsWith('w') || cmd.startsWith('x');
    const exit = cmd.includes('q') || cmd.startsWith('x');
    if (write && (buf.dirty || cmd.startsWith('w') || !buf.existed)) {
      if (!buf.writable && !force) {
        message = `\x1b[37;41mE45: 'readonly' option is set (add ! to override)\x1b[0m`;
        return;
      }
      const err = buf.save(force);
      if (err) {
        message = `\x1b[37;41m"${shown}" E212: Can't open file for writing\x1b[0m`;
        return;
      }
      message = `"${shown}" ${buf.existed ? '' : '[New] '}${buf.lines.length}L, ${buf.bytes}B written`;
    }
    if (exit) {
      if (buf.dirty && !force) {
        message = `\x1b[37;41mE37: No write since last change (add ! to override)\x1b[0m`;
        return;
      }
      quit();
    }
  };

  const normal = (k: Key) => {
    const ch = k.name === 'char' ? k.ch! : '';
    if (/[1-9]/.test(ch) || (ch === '0' && count)) {
      count += ch;
      return;
    }
    const n = Math.max(1, Number(count || '1'));
    count = '';
    if (pending) {
      const p = pending + ch;
      pending = '';
      if (p === 'dd') {
        snapshot();
        yank = buf.lines.splice(buf.row, n);
        if (!buf.lines.length) buf.lines = [''];
        buf.row = Math.min(buf.row, buf.lines.length - 1);
        buf.col = 0;
        buf.dirty = true;
      } else if (p === 'yy') yank = buf.lines.slice(buf.row, buf.row + n);
      else if (p === 'gg') {
        buf.row = 0;
        buf.col = 0;
      } else if (p === 'ZZ') runCommand('x');
      else if (p === 'ZQ') runCommand('q!');
      return;
    }
    if (k.name === 'left' || ch === 'h' || k.name === 'backspace') buf.move(0, -n, false);
    else if (k.name === 'right' || ch === 'l' || ch === ' ') buf.move(0, n, false);
    else if (k.name === 'up' || ch === 'k') buf.move(-n, 0, false);
    else if (k.name === 'down' || ch === 'j' || k.name === 'enter') buf.move(n, 0, false);
    else if (k.name === 'pagedown' || (k.name === 'ctrl' && k.ch === 'f')) buf.move(height(), 0, false);
    else if (k.name === 'pageup' || (k.name === 'ctrl' && k.ch === 'b')) buf.move(-height(), 0, false);
    else if (ch === '0' || k.name === 'home') buf.col = 0;
    else if (ch === '^') buf.col = buf.line.search(/\S|$/);
    else if (ch === '$' || k.name === 'end') buf.col = Math.max(0, buf.line.length - 1);
    else if (ch === 'w') {
      const m = /\s+\S/.exec(buf.line.slice(buf.col));
      if (m) buf.col += m.index + m[0].length - 1;
      else buf.move(1, -buf.col, false);
    } else if (ch === 'b') {
      const before = buf.line.slice(0, buf.col);
      const m = /\S+\s*$/.exec(before);
      buf.col = m ? m.index : 0;
    } else if (ch === 'G') {
      buf.row = count ? n - 1 : buf.lines.length - 1;
      buf.row = Math.min(buf.row, buf.lines.length - 1);
      buf.col = 0;
    } else if (ch === 'g' || ch === 'd' || ch === 'y' || ch === 'Z') pending = ch;
    else if (ch === 'x' || k.name === 'delete') {
      snapshot();
      for (let i = 0; i < n; i++) if (buf.line.length) buf.deleteChar();
      buf.clampCol(false);
    } else if (ch === 'p' || ch === 'P') {
      if (!yank.length) return;
      snapshot();
      buf.lines.splice(buf.row + (ch === 'p' ? 1 : 0), 0, ...yank);
      buf.row += ch === 'p' ? 1 : 0;
      buf.col = 0;
      buf.dirty = true;
    } else if (ch === 'u') {
      if (!undo) message = 'Already at oldest change';
      else {
        buf.lines = undo.lines;
        buf.row = undo.row;
        buf.col = undo.col;
        undo = null;
        buf.dirty = true;
        message = '1 change; before #1';
      }
    } else if ('iaAIoO'.includes(ch) && ch) {
      snapshot();
      if (ch === 'a') buf.col = Math.min(buf.col + 1, buf.line.length);
      if (ch === 'A') buf.col = buf.line.length;
      if (ch === 'I') buf.col = buf.line.search(/\S|$/);
      if (ch === 'o') {
        buf.lines.splice(buf.row + 1, 0, '');
        buf.row++;
        buf.col = 0;
        buf.dirty = true;
      }
      if (ch === 'O') {
        buf.lines.splice(buf.row, 0, '');
        buf.col = 0;
        buf.dirty = true;
      }
      mode = 'insert';
      message = '';
    } else if (ch === ':') {
      mode = 'command';
      cmdline = '';
    } else if (ch === '/') {
      mode = 'search';
      cmdline = '';
    } else if (ch === 'n' || ch === 'N') {
      if (lastSearch && !buf.find(lastSearch, ch === 'n' ? 1 : -1))
        message = `\x1b[37;41mE486: Pattern not found: ${lastSearch}\x1b[0m`;
    } else if (k.name === 'escape') {
      // Real vi beeps here.
    } else if (k.name === 'ctrl' && k.ch === 'c') {
      message = 'Type  :qa!  and press <Enter> to abandon all changes and exit Vim';
    }
  };

  return {
    fullscreen: true,
    start(h) {
      host = h;
      host.write(ALT_SCREEN_ON);
      render();
    },
    resize: () => render(),
    key(k) {
      if (mode === 'insert') {
        if (k.name === 'escape' || (k.name === 'ctrl' && k.ch === 'c')) {
          mode = 'normal';
          buf.move(0, -1, false);
        } else if (k.name === 'char') buf.insert(k.ch!);
        else if (k.name === 'tab') buf.insert('\t');
        else if (k.name === 'enter') buf.newline();
        else if (k.name === 'backspace') buf.backspace();
        else if (k.name === 'delete') buf.deleteChar();
        else if (k.name === 'left') buf.move(0, -1, true);
        else if (k.name === 'right') buf.move(0, 1, true);
        else if (k.name === 'up') buf.move(-1, 0, true);
        else if (k.name === 'down') buf.move(1, 0, true);
        else if (k.name === 'home') buf.col = 0;
        else if (k.name === 'end') buf.col = buf.line.length;
      } else if (mode === 'command' || mode === 'search') {
        if (k.name === 'enter') {
          const isSearch = mode === 'search';
          mode = 'normal';
          if (isSearch) {
            lastSearch = cmdline;
            if (cmdline && !buf.find(cmdline, 1))
              message = `\x1b[37;41mE486: Pattern not found: ${cmdline}\x1b[0m`;
          } else {
            message = '';
            runCommand(cmdline);
            if (!host || mode !== 'normal') return;
          }
        } else if (k.name === 'escape' || (k.name === 'ctrl' && k.ch === 'c')) mode = 'normal';
        else if (k.name === 'backspace') {
          if (!cmdline) mode = 'normal';
          cmdline = cmdline.slice(0, -1);
        } else if (k.name === 'char') cmdline += k.ch;
      } else normal(k);
      render();
    },
  };
}

// ---------------------------------------------------------------- nano

export function nanoProgram(sh: Shell, file: string | undefined): Program {
  const path = file ? sh.resolve(file) : null;
  const buf = new Buffer(sh, path);
  let host: ProgramHost;
  let message = '';
  let prompt: null | { kind: 'save-exit' | 'write' | 'search'; text: string } = null;
  let cut: string[] = [];
  let lastSearch = '';
  let searchText = '';
  let exited = false;

  if (buf.readError) message = `[ Error reading ${file}: ${buf.readError} ]`;
  else if (!buf.existed) message = '[ New File ]';
  else message = `[ Read ${buf.lines.length} line${buf.lines.length === 1 ? '' : 's'} ]`;
  if (buf.existed && !buf.readError && !buf.writable) message = `[ ${file} is meant to be read-only ]`;

  const height = () => Math.max(1, host.term.rows - 4);
  const bar = (s: string) => `${INVERSE}${s.padEnd(host.term.cols).slice(0, host.term.cols)}${RESET}`;
  const shortcut = (pairs: [string, string][]) =>
    pairs.map(([k, l]) => `${INVERSE}${k}${RESET} ${l.padEnd(12)}`).join(' ');

  const render = () => {
    buf.scroll(height());
    const cols = host.term.cols;
    const title = `  GNU nano 5.6.1`;
    const name = buf.path ? basename(buf.path) : 'New Buffer';
    const mid = Math.max(title.length + 2, Math.floor((cols - name.length) / 2));
    let header = title.padEnd(mid) + name;
    header = header.padEnd(cols - 10) + (buf.dirty ? 'Modified  ' : '');
    let out = CLEAR_SCREEN + moveTo(1, 1) + bar(header);
    for (let r = 0; r < height(); r++) {
      const line = buf.lines[buf.top + r];
      out += moveTo(r + 2, 1) + (line === undefined ? '' : visible(line, cols));
    }
    out += moveTo(height() + 2, 1) + CLEAR_LINE;
    if (prompt) {
      const labels = {
        'save-exit': 'Save modified buffer?',
        write: 'File Name to Write: ',
        search: 'Search: ',
      };
      out += bar(labels[prompt.kind] + prompt.text);
    } else if (message) {
      const m = message;
      out += ' '.repeat(Math.max(0, Math.floor((cols - m.length) / 2))) + `${INVERSE}${m}${RESET}`;
    }
    if (prompt?.kind === 'save-exit') {
      out += moveTo(height() + 3, 1) + shortcut([[' Y', 'Yes']]);
      out +=
        moveTo(height() + 4, 1) +
        shortcut([
          [' N', 'No'],
          ['^C', 'Cancel'],
        ]);
    } else {
      out +=
        moveTo(height() + 3, 1) +
        shortcut([
          ['^G', 'Help'],
          ['^O', 'Write Out'],
          ['^W', 'Where Is'],
          ['^K', 'Cut'],
          ['^U', 'Paste'],
        ]);
      out +=
        moveTo(height() + 4, 1) +
        shortcut([
          ['^X', 'Exit'],
          ['^C', 'Location'],
        ]);
    }
    if (prompt) {
      const labels = {
        'save-exit': 'Save modified buffer? ',
        write: 'File Name to Write: ',
        search: 'Search: ',
      };
      out += moveTo(height() + 2, labels[prompt.kind].length + prompt.text.length + 1);
    } else out += moveTo(buf.row - buf.top + 2, Math.min(buf.col, cols - 1) + 1);
    message = '';
    host.write(out);
  };

  const finish = () => {
    exited = true;
    host.write(ALT_SCREEN_OFF);
    host.exit(0);
  };

  const write = (): boolean => {
    const err = buf.save(true);
    if (err) {
      message = `[ Error writing ${file ?? ''}: ${err} ]`;
      return false;
    }
    message = `[ Wrote ${buf.lines.length} line${buf.lines.length === 1 ? '' : 's'} ]`;
    return true;
  };

  return {
    fullscreen: true,
    start(h) {
      host = h;
      host.write(ALT_SCREEN_ON);
      render();
    },
    resize: () => render(),
    key(k) {
      if (prompt) {
        const kind = prompt.kind;
        const value = prompt.text;
        if (k.name === 'ctrl' && k.ch === 'c') {
          prompt = null;
          message = '[ Cancelled ]';
        } else if (kind === 'save-exit' && k.name === 'char') {
          const c = k.ch!.toLowerCase();
          if (c === 'y') {
            prompt = null;
            if (write()) return finish();
          } else if (c === 'n') return finish();
        } else if (k.name === 'enter') {
          prompt = null;
          if (kind === 'write') {
            if (value.trim()) {
              buf.path = sh.resolve(value);
              write();
            } else message = '[ Cancelled: no filename ]';
          } else if (kind === 'search') {
            const q = searchText || lastSearch;
            lastSearch = q;
            if (!buf.find(q, 1)) message = `[ "${q}" not found ]`;
          }
          searchText = '';
        } else if (k.name === 'backspace' && kind === 'write') {
          prompt.text = prompt.text.slice(0, -1);
        } else if (k.name === 'char' && kind === 'write') {
          prompt.text += k.ch;
        } else if (k.name === 'ctrl' && k.ch === 'u' && kind === 'write') {
          prompt.text = '';
        } else if (k.name === 'backspace' && kind === 'search') {
          searchText = searchText.slice(0, -1);
          prompt.text = searchText;
        } else if (k.name === 'char' && kind === 'search') {
          searchText += k.ch;
          prompt.text = searchText;
        }
        if (!exited) render();
        return;
      }
      if (k.name === 'ctrl') {
        switch (k.ch) {
          case 'x':
            if (!buf.dirty) return finish();
            prompt = { kind: 'save-exit', text: '' };
            break;
          case 'o':
            prompt = { kind: 'write', text: buf.path ?? '' };
            break;
          case 'w':
            prompt = { kind: 'search', text: '' };
            searchText = '';
            break;
          case 'k':
            cut = buf.lines.splice(buf.row, 1);
            if (!buf.lines.length) buf.lines = [''];
            buf.row = Math.min(buf.row, buf.lines.length - 1);
            buf.col = 0;
            buf.dirty = true;
            break;
          case 'u':
            if (cut.length) {
              buf.lines.splice(buf.row, 0, ...cut);
              buf.row += cut.length;
              buf.dirty = true;
            }
            break;
          case 'g':
            message = '[ ^O save  ^X exit  ^W search  ^K cut line  ^U paste ]';
            break;
          case 'c':
            message = `[ line ${buf.row + 1}/${buf.lines.length} (${Math.round(((buf.row + 1) / buf.lines.length) * 100)}%), col ${buf.col + 1}/${buf.line.length + 1} ]`;
            break;
          default:
            break;
        }
      } else if (k.name === 'char') buf.insert(k.ch!);
      else if (k.name === 'tab') buf.insert('\t');
      else if (k.name === 'enter') buf.newline();
      else if (k.name === 'backspace') buf.backspace();
      else if (k.name === 'delete') buf.deleteChar();
      else if (k.name === 'left') {
        if (buf.col === 0 && buf.row > 0) buf.move(-1, Infinity, true);
        else buf.move(0, -1, true);
      } else if (k.name === 'right') {
        if (buf.col >= buf.line.length && buf.row < buf.lines.length - 1) {
          buf.row++;
          buf.col = 0;
        } else buf.move(0, 1, true);
      } else if (k.name === 'up') buf.move(-1, 0, true);
      else if (k.name === 'down') buf.move(1, 0, true);
      else if (k.name === 'home') buf.col = 0;
      else if (k.name === 'end') buf.col = buf.line.length;
      else if (k.name === 'pageup') buf.move(-height(), 0, true);
      else if (k.name === 'pagedown') buf.move(height(), 0, true);
      render();
    },
  };
}
