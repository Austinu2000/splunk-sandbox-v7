import type { RecordedEvent } from '@sandbox/shared';
import type { World } from '../world';
import { resolveHost, splunkdRunning } from '../hosts/profile';
import { runningConf } from '../hosts/running';
import { setting } from '../conf/merge';
import { appendRecordedEvents, deliveryPath, eventMetadata } from './ingestion';
import { journal } from '../journal';
import { OperationsError } from './access';
type Pending = Omit<RecordedEvent, 'id' | 'bytes'>;
const bytes = (event: Pending) => new TextEncoder().encode(event.raw).length;
export function registerIngestionBuffer(world: World, host: string, source: string) {
  const p = resolveHost(world, host);
  if (!p?.splunk) throw new OperationsError('Choose a virtual Splunk input host');
  if (!source.startsWith('/var/log/practice/') || source.includes('..') || /[\r\n]/.test(source))
    throw new OperationsError('Buffered practice inputs use a path under /var/log/practice');
  const state = (world.ingestionBuffers ??= { version: 1, nextId: 1, buffers: [] }),
    old = state.buffers.find((b) => b.host === host && b.source === source);
  if (old) return old;
  if (state.buffers.length >= 20) throw new OperationsError('Practice buffer limit: 20 input paths');
  const buffer = {
    id: 'recorded-buffer-' + state.nextId++,
    host,
    source,
    pending: [],
    byteCredit: 0,
    accepted: 0,
    delivered: 0,
    highWaterBytes: 0,
    receipts: [],
  };
  state.buffers.push(buffer);
  persistBuffers(world);
  return buffer;
}
function persistBuffers(world: World) {
  journal(world, { k: 'ingestion.buffers', state: structuredClone(world.ingestionBuffers!) });
}
/** Explicit opt-in gateway. Unregistered input paths retain their existing behavior. */
export function bufferParsedInput(world: World, events: Pending[]): boolean {
  if (!events.length) return false;
  const first = events[0]!,
    buffer = world.ingestionBuffers?.buffers.find((b) => b.host === first.host && b.source === first.source);
  if (!buffer) return false;
  if (
    events.some(
      (e) =>
        e.host !== buffer.host ||
        e.source !== buffer.source ||
        e.provenance !== 'input' ||
        e.raw.length > 65536 ||
        !Number.isFinite(e.time) ||
        !Number.isFinite(e.indexTime) ||
        Object.keys(e.fields).some(
          (k) => eventMetadata.has(k) || ['__proto__', 'constructor', 'prototype'].includes(k),
        ),
    )
  )
    throw new OperationsError('Invalid buffered input batch');
  const size = buffer.pending.reduce((n, e) => n + bytes(e), 0) + events.reduce((n, e) => n + bytes(e), 0);
  if (size > 2000000 || buffer.pending.length + events.length > 2000)
    throw new OperationsError(
      'Input backpressure: bounded queue is full; source checkpoint is retained for retry',
    );
  buffer.pending.push(...structuredClone(events));
  buffer.accepted += events.length;
  buffer.highWaterBytes = Math.max(buffer.highWaterBytes, size);
  persistBuffers(world);
  return true;
}
export function tickIngestionBuffers(world: World) {
  for (const buffer of world.ingestionBuffers?.buffers ?? []) {
    const p = resolveHost(world, buffer.host)!;
    if (!buffer.pending.length) {
      buffer.byteCredit = 0;
      continue;
    }
    if (!splunkdRunning(world, p)) continue;
    try {
      const raw = setting(runningConf(world, p, 'limits'), 'thruput', 'maxKBps') ?? '0',
        rate = Number(raw);
      if (!Number.isFinite(rate) || rate < 0 || rate > 1000000)
        throw new OperationsError('Use a nonnegative maxKBps; zero means no configured throttle');
      buffer.byteCredit = Math.min(
        2000000,
        buffer.byteCredit + (rate === 0 ? 2000000 : (rate * 1024 * world.config.tickMs) / 1000),
      );
      const target = deliveryPath(world, p),
        batch: Pending[] = [];
      let size = 0;
      for (const event of buffer.pending) {
        const n = bytes(event);
        if (batch.length >= 1000 || size + n > buffer.byteCredit) break;
        batch.push({ ...event, receiver: target.receiver.hostname, indexTime: world.clock.now });
        size += n;
      }
      if (!batch.length) continue;
      const written = appendRecordedEvents(world, batch);
      buffer.pending.splice(0, batch.length);
      buffer.byteCredit -= size;
      buffer.delivered += written.length;
      delete buffer.lastError;
      buffer.receipts.push({
        tick: world.clock.tick,
        events: written.length,
        bytes: size,
        receiver: target.receiver.hostname,
      });
      buffer.receipts = buffer.receipts.slice(-100);
    } catch (e) {
      buffer.lastError = (e as Error).message;
    }
  }
}
export function ingestionBufferView(world: World) {
  return (world.ingestionBuffers?.buffers ?? []).map((b) => ({
    id: b.id,
    host: b.host,
    source: b.source,
    accepted: b.accepted,
    delivered: b.delivered,
    pending: b.pending.length,
    pendingBytes: b.pending.reduce((n, e) => n + bytes(e), 0),
    highWaterBytes: b.highWaterBytes,
    byteCredit: b.byteCredit,
    lastError: b.lastError,
    receipts: b.receipts,
  }));
}
