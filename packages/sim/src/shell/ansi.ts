export const ESC = '\x1b';
export const CLEAR_SCREEN = '\x1b[H\x1b[2J';
export const CLEAR_LINE = '\x1b[K';
export const ALT_SCREEN_ON = '\x1b[?1049h';
export const ALT_SCREEN_OFF = '\x1b[?1049l';
export const HIDE_CURSOR = '\x1b[?25l';
export const SHOW_CURSOR = '\x1b[?25h';
export const INVERSE = '\x1b[7m';
export const BOLD = '\x1b[1m';
export const RESET = '\x1b[0m';

/** 1-based row/column, as terminals expect. */
export const moveTo = (row: number, col: number) => `\x1b[${row};${col}H`;

export function stripAnsi(s: string): string {
  // eslint-disable-next-line no-control-regex
  return s.replace(/\x1b\[[0-9;?]*[A-Za-z]|\x1b[()][A-Z0-9]|\x1b[=>]/g, '');
}

/** Converts bare \n to \r\n for the terminal. */
export function toCrlf(s: string): string {
  return s.replace(/\r?\n/g, '\r\n');
}
