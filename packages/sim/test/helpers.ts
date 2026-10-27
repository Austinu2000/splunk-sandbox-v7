import { createWorld, stripAnsi, TerminalSession, type SessionOptions, type World } from '../src';

export interface TestTerm {
  world: World;
  session: TerminalSession;
  /** Sends raw input and returns everything printed in response (ANSI stripped). */
  send(data: string): string;
  /** Runs a command line and returns its output without the echoed line and the next prompt. */
  run(line: string): string;
  /** Fires the fake wall-clock timers (for ping). */
  fireTimers(): void;
}

export function testTerm(
  world: World = createWorld({ seed: 'shell-test', fleetSize: 6_000 }),
  size = { cols: 120, rows: 30 },
  onCommand?: SessionOptions['onCommand'],
): TestTerm {
  const timers: (() => void)[] = [];
  const session = new TerminalSession({
    world,
    ...size,
    onCommand,
    schedule: (_ms, fn) => {
      timers.push(fn);
      return () => {
        const i = timers.indexOf(fn);
        if (i >= 0) timers.splice(i, 1);
      };
    },
  });
  let out = '';
  session.onOutput((d) => (out += d));
  session.start();
  const send = (data: string) => {
    out = '';
    session.input(data);
    return stripAnsi(out).replace(/\r/g, '');
  };
  return {
    world,
    session,
    send,
    run(line) {
      const text = send(line + '\r');
      const body = text.startsWith(line + '\n') ? text.slice(line.length + 1) : text;
      return body.replace(/\[[^\]\n]+@[^\]\n]+ [^\]\n]+\][$#] $/, '');
    },
    fireTimers() {
      const due = timers.splice(0);
      due.forEach((f) => f());
    },
  };
}
