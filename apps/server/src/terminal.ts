import type { FastifyInstance } from 'fastify';
import websocket from '@fastify/websocket';
import { logAction, TerminalSession } from '@sandbox/sim';
import type { LiveWorld } from './live';

const MAX_SESSIONS = 8;
const MAX_MESSAGE = 64 * 1024;

type ClientMessage = { type: 'input'; data: string } | { type: 'resize'; cols: number; rows: number };

/** Browsers send Origin; only accept pages served from this machine (blocks cross-site WebSocket hijacking). */
export function isLocalOrigin(origin: string | undefined): boolean {
  if (!origin) return true;
  try {
    const { hostname } = new URL(origin);
    return hostname === '127.0.0.1' || hostname === 'localhost' || hostname === '[::1]';
  } catch {
    return false;
  }
}

/**
 * /ws/term: one simulated terminal per connection. Messages are parsed as data and fed to the
 * shell emulator; nothing here (or in @sandbox/sim) starts a real process.
 */
export function registerTerminal(
  app: FastifyInstance,
  live: LiveWorld,
): { tickAll(): void; count(): number } {
  const sessions = new Set<TerminalSession>();
  const sockets = new Set<{ close(code: number, reason: string): void }>();
  // A terminal belongs to one world; when it's replaced (load or reset), its terminals close.
  live.onSwap(() => {
    for (const s of sockets) s.close(4000, 'world replaced');
  });
  app.register(websocket, { options: { maxPayload: MAX_MESSAGE } });
  app.register(async (scope) => {
    scope.get('/ws/term', { websocket: true }, (socket, req) => {
      if (!isLocalOrigin(req.headers.origin)) {
        socket.close(1008, 'origin not allowed');
        return;
      }
      if (sessions.size >= MAX_SESSIONS) {
        socket.close(1013, 'too many terminals');
        return;
      }
      const q = req.query as { cols?: string; rows?: string };
      const world = live.world;
      sockets.add(socket);
      const session = new TerminalSession({
        world,
        cols: Number(q.cols) || 80,
        rows: Number(q.rows) || 24,
        schedule: (ms, fn) => {
          const t = setTimeout(fn, ms);
          return () => clearTimeout(t);
        },
        onCommand: (e) =>
          logAction(world, { kind: 'cmd', host: e.host, user: e.user, text: e.line, success: e.success }, Date.now()),
      });
      sessions.add(session);

      let lastLocation = '';
      const sendLocation = () => {
        const loc = session.location;
        const key = `${loc.user}@${loc.host}`;
        if (key !== lastLocation) {
          lastLocation = key;
          socket.send(JSON.stringify({ type: 'location', ...loc }));
        }
      };
      session.onOutput((data) => {
        if (socket.readyState === socket.OPEN) socket.send(JSON.stringify({ type: 'output', data }));
      });
      session.start();
      sendLocation();

      socket.on('message', (raw: Buffer) => {
        let msg: ClientMessage;
        try {
          msg = JSON.parse(raw.toString('utf8'));
        } catch {
          return;
        }
        if (msg.type === 'input' && typeof msg.data === 'string') {
          session.input(msg.data);
          sendLocation();
        } else if (msg.type === 'resize' && Number.isFinite(msg.cols) && Number.isFinite(msg.rows)) {
          session.resize(msg.cols, msg.rows);
        }
      });
      socket.on('close', () => {
        session.dispose();
        sessions.delete(session);
        sockets.delete(socket);
      });
    });
  });

  return {
    tickAll: () => sessions.forEach((s) => s.tick()),
    count: () => sessions.size,
  };
}
