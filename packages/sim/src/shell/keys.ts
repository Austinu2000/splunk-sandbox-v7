/** Decodes raw terminal input (as xterm.js sends it) into key events. */

export type KeyName =
  | 'char'
  | 'enter'
  | 'backspace'
  | 'delete'
  | 'tab'
  | 'escape'
  | 'up'
  | 'down'
  | 'left'
  | 'right'
  | 'home'
  | 'end'
  | 'pageup'
  | 'pagedown'
  | 'ctrl';

export interface Key {
  name: KeyName;
  /** The character for 'char', or the lowercase letter for 'ctrl' (ctrl+c → 'c'). */
  ch?: string;
}

const CSI: Record<string, KeyName> = {
  A: 'up',
  B: 'down',
  C: 'right',
  D: 'left',
  H: 'home',
  F: 'end',
  '1~': 'home',
  '7~': 'home',
  '4~': 'end',
  '8~': 'end',
  '3~': 'delete',
  '5~': 'pageup',
  '6~': 'pagedown',
};

export function parseKeys(data: string): Key[] {
  const keys: Key[] = [];
  for (let i = 0; i < data.length; i++) {
    const c = data[i]!;
    if (c === '\x1b') {
      const next = data[i + 1];
      if (next === '[' || next === 'O') {
        const m = /^(\d*;?\d*)([A-Za-z~])/.exec(data.slice(i + 2));
        if (m) {
          const code = m[2] === '~' ? `${m[1]!.split(';')[0]}~` : m[2]!;
          const name = CSI[code];
          if (name) keys.push({ name });
          i += 1 + m[0].length;
          continue;
        }
      }
      keys.push({ name: 'escape' });
    } else if (c === '\r') {
      keys.push({ name: 'enter' });
      if (data[i + 1] === '\n') i++;
    } else if (c === '\n') keys.push({ name: 'enter' });
    else if (c === '\x7f' || c === '\b') keys.push({ name: 'backspace' });
    else if (c === '\t') keys.push({ name: 'tab' });
    else if (c.charCodeAt(0) < 32) keys.push({ name: 'ctrl', ch: String.fromCharCode(c.charCodeAt(0) + 96) });
    else keys.push({ name: 'char', ch: c });
  }
  return keys;
}
