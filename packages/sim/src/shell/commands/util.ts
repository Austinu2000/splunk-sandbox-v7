import { FsError } from '../../vfs/vfs';
import type { CmdCtx } from '../types';

export interface Parsed {
  flags: Map<string, string | true>;
  operands: string[];
  error?: string;
}

/**
 * Minimal getopt: combined short flags (-la), short flags with values (-n 20 / -n20),
 * long flags (--color, --lines=20), "--" and lone "-" as an operand.
 */
export function getopt(args: string[], shortWithValue = '', longWithValue: string[] = []): Parsed {
  const flags = new Map<string, string | true>();
  const operands: string[] = [];
  for (let i = 0; i < args.length; i++) {
    const a = args[i]!;
    if (a === '--') {
      operands.push(...args.slice(i + 1));
      break;
    }
    if (a.startsWith('--')) {
      const eq = a.indexOf('=');
      const name = eq > 0 ? a.slice(2, eq) : a.slice(2);
      if (eq > 0) flags.set(name, a.slice(eq + 1));
      else if (longWithValue.includes(name)) {
        if (i + 1 >= args.length)
          return { flags, operands, error: `option '--${name}' requires an argument` };
        flags.set(name, args[++i]!);
      } else flags.set(name, true);
      continue;
    }
    if (a.startsWith('-') && a.length > 1) {
      for (let j = 1; j < a.length; j++) {
        const f = a[j]!;
        if (shortWithValue.includes(f)) {
          const rest = a.slice(j + 1);
          if (rest) flags.set(f, rest);
          else if (i + 1 < args.length) flags.set(f, args[++i]!);
          else return { flags, operands, error: `option requires an argument -- '${f}'` };
          break;
        }
        flags.set(f, true);
      }
      continue;
    }
    operands.push(a);
  }
  return { flags, operands };
}

export interface Input {
  name: string;
  content: string;
}

/** Reads the named files (or stdin when none are given). Errors use `cmd: name: message`. */
export function readInputs(ctx: CmdCtx, cmd: string, files: string[]): { inputs: Input[]; errors: string } {
  if (files.length === 0) return { inputs: [{ name: '(standard input)', content: ctx.stdin }], errors: '' };
  const inputs: Input[] = [];
  let errors = '';
  for (const f of files) {
    if (f === '-') {
      inputs.push({ name: '(standard input)', content: ctx.stdin });
      continue;
    }
    try {
      inputs.push({ name: f, content: ctx.sh.fs.readFile(ctx.sh.resolve(f), ctx.sh.cred) });
    } catch (e) {
      if (!(e instanceof FsError)) throw e;
      errors += `${cmd}: ${f}: ${e.message}\n`;
    }
  }
  return { inputs, errors };
}

/** Splits text into lines without a trailing empty line. */
export function lines(text: string): string[] {
  if (text === '') return [];
  const ls = text.split('\n');
  if (ls[ls.length - 1] === '') ls.pop();
  return ls;
}

export const joinLines = (ls: string[]) => (ls.length ? ls.join('\n') + '\n' : '');

export function humanSize(bytes: number): string {
  if (bytes < 1024) return String(bytes);
  const units = ['K', 'M', 'G', 'T'];
  let v = bytes;
  let u = -1;
  while (v >= 1024 && u < units.length - 1) {
    v /= 1024;
    u++;
  }
  return (v < 10 ? (Math.ceil(v * 10) / 10).toFixed(1) : String(Math.ceil(v))) + units[u];
}

/** Converts a grep basic regular expression to a JS regex source. */
export function breToJs(pattern: string): string {
  let out = '';
  for (let i = 0; i < pattern.length; i++) {
    const c = pattern[i]!;
    if (c === '\\' && i + 1 < pattern.length) {
      const n = pattern[++i]!;
      if ('|(){}+?'.includes(n)) out += n;
      else out += '\\' + n;
    } else if ('|(){}+?'.includes(c)) out += '\\' + c;
    else out += c;
  }
  return out;
}
