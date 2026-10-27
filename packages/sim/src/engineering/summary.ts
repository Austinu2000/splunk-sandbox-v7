import type { PracticePrincipal, ResultValue } from '@sandbox/shared';
import type { World } from '../world';
import { appendRecordedEvents, eventMetadata } from './ingestion';
import { OperationsError, requireCapability, canSearchIndex } from './access';
import { indexExists } from './indexes';
import { hashString } from '../rng';

export function collectSummary(
  world: World,
  rows: Record<string, ResultValue>[],
  options: {
    index: string;
    host: string;
    principal: PracticePrincipal;
    earliest: number;
    latest: number;
    writer: string;
    source?: string;
    sourcetype?: string;
  },
) {
  requireCapability(world, options.host, options.principal, 'run_collect');
  if (!canSearchIndex(world, options.host, options.principal, options.index))
    throw new OperationsError('Summary destination is not allowed for this principal');
  const receiver = world.infra.find(
    (h) => h.role === 'indexer' && !h.retired && indexExists(world, options.index, h.hostname),
  )?.hostname;
  if (!receiver) throw new OperationsError('Summary destination index is missing, disabled or unavailable');
  const overlap = (world.ingestion?.events ?? []).some(
    (event) =>
      event.provenance === 'summary' &&
      event.index === options.index &&
      event.fields._summary_writer === options.writer &&
      Number(event.fields.info_min_time) * 1000 < options.latest &&
      Number(event.fields.info_max_time) * 1000 > options.earliest,
  );
  if (overlap)
    throw new OperationsError(
      'Summary write overlaps a previously collected window for this writer; inspect the schedule and time range',
    );
  const operationId =
    'summary:' + hashString(options.writer + ':' + options.earliest + ':' + options.latest).toString(16);
  const events = rows.map((row) => {
    const fields: Record<string, ResultValue> = {};
    for (const [key, value] of Object.entries(row))
      if (
        !eventMetadata.has(key) &&
        ![
          '_summary_writer',
          'info_min_time',
          'info_max_time',
          '__proto__',
          'prototype',
          'constructor',
        ].includes(key)
      )
        fields[key] = value;
    for (const [key, value] of Object.entries(row))
      if (eventMetadata.has(key) && key !== '_time') {
        const preserved = 'orig_' + key.replace(/^_+/, '');
        if (Object.hasOwn(fields, preserved))
          throw new OperationsError('Summary field collision: ' + preserved);
        fields[preserved] = value;
      }
    Object.assign(fields, {
      info_min_time: options.earliest / 1000,
      info_max_time: options.latest / 1000,
      _summary_writer: options.writer,
    });
    const time = row._time === undefined ? options.latest : Number(row._time) * 1000;
    return {
      time,
      indexTime: world.clock.now,
      raw: Object.entries(fields)
        .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
        .join(' '),
      host: options.host,
      source: options.source ?? options.writer,
      sourcetype: options.sourcetype ?? 'stash',
      index: options.index,
      receiver,
      fields,
      provenance: 'summary' as const,
      operationId,
    };
  });
  return appendRecordedEvents(world, events).map((e) => e.id);
}
