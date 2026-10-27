import type { World } from '../world';
import type { Key } from './keys';
import type { Shell } from './shell';

export interface Term {
  cols: number;
  rows: number;
}

export interface CmdCtx {
  world: World;
  sh: Shell;
  /** argv[0] is the command name as typed. */
  argv: string[];
  stdin: string;
  /** True when stdin comes from a pipe or redirect (commands like cat and grep read it instead of files). */
  hasStdin: boolean;
  term: Term;
  /** True when this command's stdout goes to the terminal (not a pipe or file). */
  tty: boolean;
}

export interface CmdResult {
  stdout?: string;
  stderr?: string;
  code?: number;
}

/** Interactive or long-running program that takes over the terminal (less, vi, tail -f, ping). */
export interface Program {
  /** Full-screen programs use the alternate screen and write raw escape sequences. */
  fullscreen?: boolean;
  start(host: ProgramHost): void;
  key(k: Key): void;
  /** Called after every simulation tick. */
  tick?(): void;
  resize?(): void;
  /** Called when the session closes while the program runs. */
  stop?(): void;
}

export interface ProgramHost {
  /** Line-mode programs write "\n"; it is converted for the terminal. */
  write(data: string): void;
  exit(code?: number): void;
  readonly term: Term;
  /** Wall-clock timer (e.g. ping's one-second interval). Returns a cancel function. */
  schedule(ms: number, fn: () => void): () => void;
}

/** What a command can hand back besides plain output. */
export type CmdReturn =
  CmdResult | { program: Program } | { push: Shell; output?: string } | { exitShell: true; code?: number };

export type CommandFn = (ctx: CmdCtx) => CmdReturn;

export const ok = (stdout = ''): CmdResult => ({ stdout, code: 0 });
export const fail = (stderr: string, code = 1, stdout = ''): CmdResult => ({
  stdout,
  stderr: stderr.endsWith('\n') ? stderr : stderr + '\n',
  code,
});
