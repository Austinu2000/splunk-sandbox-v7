import { ALT_SCREEN_OFF, ALT_SCREEN_ON, CLEAR_SCREEN, CLEAR_LINE, INVERSE, RESET, moveTo } from '../ansi';
import { lines } from '../commands/util';
import type { Key } from '../keys';
import type { Program, ProgramHost } from '../types';

/** `less`: full-screen pager with paging, line scrolling and / search. */
export function pagerProgram(content: string, name: string, numbers = false): Program {
  const source = lines(content);
  let host: ProgramHost;
  let wrapped: string[] = [];
  let top = 0;
  let prompt: string | null = null;
  let query = '';
  let message = name;

  const rows = () => Math.max(1, host.term.rows - 1);
  const wrap = () => {
    const width = host.term.cols;
    wrapped = [];
    source.forEach((l, i) => {
      const text = numbers ? `${String(i + 1).padStart(7)} ${l}` : l;
      if (text.length === 0) wrapped.push('');
      for (let k = 0; k < text.length; k += width) wrapped.push(text.slice(k, k + width));
    });
  };
  const maxTop = () => Math.max(0, wrapped.length - rows());
  const render = () => {
    let out = CLEAR_SCREEN;
    for (let r = 0; r < rows(); r++) {
      const line = wrapped[top + r];
      out += moveTo(r + 1, 1) + (line === undefined ? '~' : highlight(line));
    }
    const atEnd = top >= maxTop();
    const status = prompt !== null ? prompt + query : message ? message : atEnd ? '(END)' : ':';
    out +=
      moveTo(rows() + 1, 1) +
      CLEAR_LINE +
      (prompt !== null || atEnd || message ? `${INVERSE}${status}${RESET}` : status);
    message = '';
    host.write(out);
  };
  const highlight = (l: string) => (query ? l.split(query).join(`${INVERSE}${query}${RESET}`) : l);
  const search = (dir: 1 | -1) => {
    if (!query) return;
    for (let i = top + dir; i >= 0 && i < wrapped.length; i += dir) {
      if (wrapped[i]!.includes(query)) {
        top = Math.min(i, maxTop());
        return;
      }
    }
    message = 'Pattern not found';
  };

  return {
    fullscreen: true,
    start(h) {
      host = h;
      wrap();
      host.write(ALT_SCREEN_ON);
      render();
    },
    resize() {
      wrap();
      top = Math.min(top, maxTop());
      render();
    },
    key(k: Key) {
      if (prompt !== null) {
        if (k.name === 'enter') {
          prompt = null;
          search(1);
        } else if (k.name === 'escape' || (k.name === 'ctrl' && k.ch === 'c')) {
          prompt = null;
          query = '';
        } else if (k.name === 'backspace') query = query.slice(0, -1);
        else if (k.name === 'char') query += k.ch;
        return render();
      }
      const ch = k.name === 'char' ? k.ch : undefined;
      if (ch === 'q' || ch === 'Q' || (k.name === 'ctrl' && k.ch === 'c')) {
        host.write(ALT_SCREEN_OFF);
        return host.exit(0);
      }
      if (
        ch === ' ' ||
        ch === 'f' ||
        k.name === 'pagedown' ||
        (k.name === 'ctrl' && (k.ch === 'f' || k.ch === 'v'))
      )
        top = Math.min(maxTop(), top + rows());
      else if (ch === 'b' || k.name === 'pageup' || (k.name === 'ctrl' && k.ch === 'b'))
        top = Math.max(0, top - rows());
      else if (ch === 'j' || k.name === 'down' || k.name === 'enter' || ch === 'e')
        top = Math.min(maxTop(), top + 1);
      else if (ch === 'k' || k.name === 'up' || ch === 'y') top = Math.max(0, top - 1);
      else if (ch === 'd') top = Math.min(maxTop(), top + Math.floor(rows() / 2));
      else if (ch === 'u') top = Math.max(0, top - Math.floor(rows() / 2));
      else if (ch === 'g' || ch === '<' || k.name === 'home') top = 0;
      else if (ch === 'G' || ch === '>' || k.name === 'end') top = maxTop();
      else if (ch === '/') {
        prompt = '/';
        query = '';
      } else if (ch === 'n') search(1);
      else if (ch === 'N') search(-1);
      else if (ch === 'h')
        message = 'q quit  space/b page  j/k line  g/G top/bottom  /pattern search  n/N next/prev';
      render();
    },
  };
}
