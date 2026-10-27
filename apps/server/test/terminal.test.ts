import { afterAll, describe, expect, it } from 'vitest';
import { createWorld, stripAnsi, tickWorld } from '@sandbox/sim';
import { buildApp } from '../src/app';
import { isLocalOrigin } from '../src/terminal';

const world = createWorld({ seed: 'ws-test', fleetSize: 3_000 });
const { app, onTick, live } = buildApp(world);
afterAll(() => app.close());

type Msg = { type: string; data?: string; host?: string; user?: string };

async function connect(headers: Record<string, string> = {}) {
  await app.ready();
  const messages: Msg[] = [];
  const ws = await app.injectWS(
    '/ws/term?cols=100&rows=30',
    { headers },
    { onInit: (socket) => socket.on('message', (raw: Buffer) => messages.push(JSON.parse(raw.toString()))) },
  );
  const output = () =>
    stripAnsi(
      messages
        .filter((m) => m.type === 'output')
        .map((m) => m.data)
        .join(''),
    ).replace(/\r/g, '');
  const until = async (pred: () => boolean) => {
    for (let i = 0; i < 100 && !pred(); i++) await new Promise((r) => setTimeout(r, 10));
  };
  return {
    ws,
    messages,
    output,
    until,
    send: (data: string) => ws.send(JSON.stringify({ type: 'input', data })),
  };
}

describe('/ws/term', () => {
  it('closes terminals when the world is replaced (load or reset)', async () => {
    const c = await connect();
    await c.until(() => c.output().includes('[engineer@bastion01 ~]$'));
    const closed = new Promise<number>((resolve) => c.ws.on('close', (code: number) => resolve(code)));
    live.swap(createWorld({ seed: 'ws-test', fleetSize: 3_000 }));
    expect(await closed).toBe(4000);
    live.swap(world);
  });

  it('runs a simulated shell over the socket and reports the location', async () => {
    const c = await connect();
    await c.until(() => c.output().includes('[engineer@bastion01 ~]$'));
    expect(c.output()).toContain('Authorized uses only');
    c.send('ssh splunk@idx01\r');
    await c.until(() => c.messages.some((m) => m.type === 'location' && m.host === 'idx01'));
    expect(c.messages.find((m) => m.type === 'location' && m.host === 'idx01')).toMatchObject({
      user: 'splunk',
    });
    c.send('splunk status\r');
    await c.until(() => c.output().includes('splunkd is running'));
    expect(c.output()).toContain('splunkd is running');
    c.ws.terminate();
  });

  it('streams tail -f output on simulation ticks', async () => {
    const c = await connect();
    c.send('ssh splunk@idx01\r');
    c.send('tail -f -n 0 /opt/splunk/var/log/splunk/metrics.log\r');
    await c.until(() => c.output().includes('tail -f'));
    const before = c.output().length;
    tickWorld(world, 3);
    onTick();
    await c.until(() => c.output().length > before);
    expect(c.output().slice(before)).toContain('group=queue');
    c.ws.terminate();
  });

  it('ignores malformed messages', async () => {
    const c = await connect();
    c.ws.send('not json');
    c.ws.send(JSON.stringify({ type: 'resize', cols: 'x' }));
    c.send('whoami\r');
    await c.until(() => c.output().includes('engineer\n'));
    expect(c.output()).toContain('engineer\n');
    c.ws.terminate();
  });

  it('only accepts local browser origins', () => {
    expect(isLocalOrigin(undefined)).toBe(true);
    expect(isLocalOrigin('http://127.0.0.1:5173')).toBe(true);
    expect(isLocalOrigin('http://localhost:5173')).toBe(true);
    expect(isLocalOrigin('https://evil.example')).toBe(false);
    expect(isLocalOrigin('null')).toBe(false);
  });

  it('closes connections from other origins', async () => {
    await app.ready();
    const ws = await app.injectWS('/ws/term', { headers: { origin: 'https://evil.example' } });
    const code = await new Promise<number>((resolve) => ws.on('close', (c: number) => resolve(c)));
    expect(code).toBe(1008);
  });
});
