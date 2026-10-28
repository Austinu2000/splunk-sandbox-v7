import { parse } from 'yaml';
import type { IntegrationRecord } from '@sandbox/shared';
import type { World } from '../world';
import { OperationsError } from './access';
import { receiveHec } from './hec';
import { PRACTICE_HEC } from './telemetry-practice';
import {
  INTEGRATION_PATHS,
  readIntegrationSource,
  parseTeachingJson,
  requireKeys,
  integrationReceipt,
  persistIntegrations,
} from './integration-state';
interface Route {
  id: string;
  name?: string;
  filter: string;
  output: 'devnull' | 'splunk_out';
  final: boolean;
  disabled?: boolean;
  pipeline?: 'passthru';
}
export function routeMatches(filter: string, record: IntegrationRecord) {
  if (filter === 'true') return true;
  if (filter === 'false') return false;
  const m = /^([A-Za-z_][\w.]*)\s*(===|!==)\s*(['"])([A-Za-z0-9_. -]{0,100})\3$/.exec(filter);
  if (!m)
    throw new OperationsError(
      'Route filters support true/false or one scalar ===/!== comparison; arbitrary JavaScript is never evaluated',
    );
  const equal = record.fields[m[1]!] === m[4];
  return m[2] === '===' ? equal : !equal;
}
export function parseCriblRoutes(source: string) {
  let raw: unknown;
  try {
    raw = parse(source, { maxAliasCount: 0 });
  } catch {
    throw new OperationsError('Invalid routes YAML');
  }
  const top = requireKeys(raw, ['routes'], 'routes source');
  if (!Array.isArray(top.routes) || !top.routes.length || top.routes.length > 20)
    throw new OperationsError('Use 1–20 bounded routes');
  const ids = new Set<string>();
  return top.routes.map((value) => {
    const r = requireKeys(
      value,
      ['id', 'name', 'filter', 'output', 'final', 'disabled', 'pipeline'],
      'route',
    );
    if (
      typeof r.id !== 'string' ||
      !/^[A-Za-z][\w-]{0,63}$/.test(r.id) ||
      ids.has(r.id) ||
      typeof r.filter !== 'string' ||
      r.filter.length > 300 ||
      !['devnull', 'splunk_out'].includes(String(r.output)) ||
      typeof r.final !== 'boolean' ||
      (r.disabled !== undefined && typeof r.disabled !== 'boolean') ||
      (r.pipeline !== undefined && r.pipeline !== 'passthru')
    )
      throw new OperationsError(
        'Use unique route IDs, a bounded predicate, passthru and a known output/final flag',
      );
    routeMatches(r.filter, { id: 'validation', fields: {} });
    ids.add(r.id);
    return r as unknown as Route;
  });
}
export function validateCriblDestination(source: string) {
  const d = parseTeachingJson(source, ['version', 'available', 'token'], 'Cribl practice destination');
  if (
    d.version !== 1 ||
    typeof d.available !== 'boolean' ||
    typeof d.token !== 'string' ||
    d.token.length > 100
  )
    throw new OperationsError('Use the fictional destination version, availability and supplied HEC token');
  return d;
}
export function pollCribl(w: World) {
  const a = w.integrations?.cribl;
  if (!a) throw new OperationsError('Cribl practice is not initialized');
  try {
    if (!a.activeSource) throw new OperationsError('Activate routes in this offline adapter');
    const routes = parseCriblRoutes(a.activeSource),
      destination = validateCriblDestination(
        readIntegrationSource(w, a.host, INTEGRATION_PATHS.criblAvailability),
      );
    for (const record of [...a.pending]) {
      let matched = false,
        waiting = false;
      for (const route of routes) {
        if (route.disabled || !routeMatches(route.filter, record)) continue;
        matched = true;
        const key = record.id + '|' + route.output;
        if (route.output === 'devnull') {
          if (!a.dropped.includes(record.id)) {
            a.dropped.push(record.id);
            integrationReceipt(w, 'cribl', record.id, 'dropped');
          }
        } else if (!a.delivered.includes(key)) {
          if (!destination.available) {
            waiting = true;
            integrationReceipt(
              w,
              'cribl',
              record.id,
              'failed',
              [],
              'Fictional Splunk destination is unavailable; the pending record is retained',
            );
          } else {
            const r = receiveHec(w, a.host, PRACTICE_HEC, 'Splunk ' + destination.token, {
              event: record.fields,
              fields: record.fields,
              index: 'routed_logs',
              sourcetype: 'v7_cribl',
              source: 'cribl:practice',
            });
            a.delivered.push(key);
            integrationReceipt(w, 'cribl', record.id, 'delivered', r.eventIds);
          }
        }
        if (route.final) break;
      }
      if (!matched) {
        waiting = true;
        integrationReceipt(w, 'cribl', record.id, 'failed', [], 'No active route matched; record retained');
      }
      if (!waiting) a.pending = a.pending.filter((r) => r.id !== record.id);
    }
  } catch (e) {
    integrationReceipt(w, 'cribl', 'router', 'failed', [], (e as Error).message);
  }
  persistIntegrations(w);
}
