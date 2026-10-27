/** Lossless SPL tokens shared by the editor and query preprocessing. */
export interface SplToken {
  kind: 'comment' | 'string' | 'macro' | 'word' | 'number' | 'space' | 'symbol';
  text: string;
  start: number;
  end: number;
  closed?: boolean;
}
export function tokenizeSpl(text: string): SplToken[] {
  const tokens: SplToken[] = [];
  for (let i = 0; i < text.length;) {
    const start = i;
    let kind: SplToken['kind'] = 'symbol',
      closed: boolean | undefined;
    if (text.startsWith('```', i)) {
      kind = 'comment';
      const end = text.indexOf('```', i + 3);
      closed = end !== -1;
      i = closed ? end + 3 : text.length;
    } else if (text[i] === '"' || text[i] === "'") {
      kind = 'string';
      const quote = text[i++];
      closed = false;
      while (i < text.length) {
        if (text[i] === '\\') {
          i = Math.min(text.length, i + 2);
          continue;
        }
        if (text[i++] === quote) {
          closed = true;
          break;
        }
      }
    } else if (text[i] === '`') {
      kind = 'macro';
      const end = text.indexOf('`', i + 1);
      closed = end !== -1;
      i = closed ? end + 1 : text.length;
    } else {
      const match = /^(\s+|[A-Za-z_][\w.]*|\d+(?:\.\d+)?)/.exec(text.slice(i));
      if (match) {
        const value = match[0];
        kind = /^\s/.test(value) ? 'space' : /^\d/.test(value) ? 'number' : 'word';
        i += value.length;
      } else i++;
    }
    tokens.push({
      kind,
      text: text.slice(start, i),
      start,
      end: i,
      ...(closed === undefined ? {} : { closed }),
    });
  }
  return tokens;
}
