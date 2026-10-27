/**
 * A small bash-like parser: quotes, escapes, $VAR expansion, ~, pipes, ;, &&, ||, and redirections.
 * Command substitution and background jobs are rejected with a bash-style error.
 */

/** Literal text, or a variable expanded when the command runs (so `false; echo $?` sees the new status). */
export type WordPart = string | { var: string };

export interface Word {
  parts: WordPart[];
  /** True when the word contains unquoted glob characters. */
  glob: boolean;
}

export function wordText(w: Word, get: (name: string) => string | undefined): string {
  return w.parts.map((p) => (typeof p === 'string' ? p : (get(p.var) ?? ''))).join('');
}

export type RedirectOp = '>' | '>>' | '<' | '2>' | '2>>' | '2>&1';

export interface Redirect {
  op: RedirectOp;
  target?: Word;
}

export interface SimpleCommand {
  words: Word[];
  redirects: Redirect[];
}

export interface ListItem {
  pipeline: SimpleCommand[];
  /** Operator joining this pipeline to the next one. */
  next: ';' | '&&' | '||' | null;
}

export class ShellSyntaxError extends Error {}

type Token = { kind: 'word'; word: Word } | { kind: 'op'; op: string };

export interface ExpandEnv {
  home: string;
}

function lex(line: string, env: ExpandEnv): Token[] {
  const tokens: Token[] = [];
  let parts: WordPart[] = [];
  let text = '';
  let glob = false;
  let inWord = false;
  let quotedSomething = false;

  const flush = () => {
    if (text) parts.push(text);
    text = '';
  };
  const endWord = () => {
    flush();
    if (inWord) tokens.push({ kind: 'word', word: { parts, glob } });
    parts = [];
    text = '';
    glob = false;
    inWord = false;
    quotedSomething = false;
  };
  const op = (o: string) => {
    endWord();
    tokens.push({ kind: 'op', op: o });
  };

  /** Reads $NAME / ${NAME} at i, records it as a deferred part, and returns the index of its last char. */
  const readVar = (i: number): number => {
    const rest = line.slice(i + 1);
    if (rest.startsWith('('))
      throw new ShellSyntaxError('bash: command substitution is not supported in this sandbox');
    const m = /^\{([A-Za-z_][A-Za-z0-9_]*)\}/.exec(rest) ?? /^([A-Za-z_][A-Za-z0-9_]*|\?|\$|#)/.exec(rest);
    if (!m) {
      text += '$';
      return i;
    }
    flush();
    parts.push({ var: m[1]! });
    return i + m[0].length;
  };

  for (let i = 0; i < line.length; i++) {
    const c = line[i]!;
    if (c === ' ' || c === '\t') {
      endWord();
    } else if (c === '#' && !inWord) {
      break;
    } else if (c === "'") {
      const end = line.indexOf("'", i + 1);
      if (end < 0) throw new ShellSyntaxError("bash: unexpected EOF while looking for matching `''");
      text += line.slice(i + 1, end);
      inWord = quotedSomething = true;
      i = end;
    } else if (c === '"') {
      inWord = quotedSomething = true;
      let j = i + 1;
      for (; j < line.length && line[j] !== '"'; j++) {
        const d = line[j]!;
        if (d === '\\' && /["\\$`]/.test(line[j + 1] ?? '')) text += line[++j];
        else if (d === '$') j = readVar(j);
        else if (d === '`')
          throw new ShellSyntaxError('bash: command substitution is not supported in this sandbox');
        else text += d;
      }
      if (j >= line.length)
        throw new ShellSyntaxError('bash: unexpected EOF while looking for matching `"\'');
      i = j;
    } else if (c === '\\') {
      if (i + 1 < line.length) text += line[++i];
      inWord = true;
    } else if (c === '$') {
      inWord = true;
      i = readVar(i);
    } else if (c === '`') {
      throw new ShellSyntaxError('bash: command substitution is not supported in this sandbox');
    } else if (c === '~' && !inWord && (i + 1 === line.length || /[/\s]/.test(line[i + 1]!))) {
      text += env.home;
      inWord = true;
    } else if (c === '|') {
      if (line[i + 1] === '|') {
        op('||');
        i++;
      } else op('|');
    } else if (c === '&') {
      if (line[i + 1] === '&') {
        op('&&');
        i++;
      } else throw new ShellSyntaxError('bash: background jobs are not supported in this sandbox');
    } else if (c === ';') {
      op(';');
    } else if (c === '>' || c === '<') {
      const fd2 = inWord && text === '2' && parts.length === 0 && !quotedSomething;
      if (fd2) {
        text = '';
        inWord = false;
      }
      if (c === '<') op('<');
      else if (line.startsWith('>&1', i) && fd2) {
        op('2>&1');
        i += 2;
      } else if (line[i + 1] === '>') {
        op(fd2 ? '2>>' : '>>');
        i++;
      } else op(fd2 ? '2>' : '>');
    } else {
      if (c === '*' || c === '?' || c === '[') glob = true;
      text += c;
      inWord = true;
    }
  }
  endWord();
  return tokens;
}

export function parseLine(line: string, env: ExpandEnv): ListItem[] {
  const tokens = lex(line, env);
  const items: ListItem[] = [];
  let pipeline: SimpleCommand[] = [];
  let cmd: SimpleCommand = { words: [], redirects: [] };

  const unexpected = (t: string) => new ShellSyntaxError(`bash: syntax error near unexpected token \`${t}'`);
  const finishCmd = (opName: string) => {
    if (cmd.words.length === 0 && cmd.redirects.length === 0) throw unexpected(opName);
    pipeline.push(cmd);
    cmd = { words: [], redirects: [] };
  };

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i]!;
    if (t.kind === 'word') {
      cmd.words.push(t.word);
      continue;
    }
    if (t.op === '|') {
      finishCmd('|');
      continue;
    }
    if (t.op === ';' || t.op === '&&' || t.op === '||') {
      finishCmd(t.op);
      items.push({ pipeline, next: t.op });
      pipeline = [];
      continue;
    }
    if (t.op === '2>&1') {
      cmd.redirects.push({ op: '2>&1' });
      continue;
    }
    const target = tokens[i + 1];
    if (!target || target.kind !== 'word') throw unexpected(target?.kind === 'op' ? target.op : 'newline');
    cmd.redirects.push({ op: t.op as RedirectOp, target: target.word });
    i++;
  }
  const last = tokens[tokens.length - 1];
  if (last?.kind === 'op' && (last.op === '|' || last.op === '&&' || last.op === '||'))
    throw unexpected('newline');
  if (cmd.words.length || cmd.redirects.length) pipeline.push(cmd);
  if (pipeline.length) items.push({ pipeline, next: null });
  else if (items.length && items[items.length - 1]!.next !== ';') throw unexpected('newline');
  return items;
}
