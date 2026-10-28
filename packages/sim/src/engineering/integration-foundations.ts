import type { IntegrationKind } from '@sandbox/shared';
import type { World } from '../world';
import { setClock } from '../world';
import { initializeIntegration } from './integration-fixtures';
import { activateIntegration, pollIntegration } from './integrations';
import { parseCollector } from './telemetry-practice';
import { parseCriblRoutes, routeMatches, validateCriblDestination } from './cribl-practice';
import { readIntegrationSource, INTEGRATION_PATHS } from './integration-state';
import { DBX_APP, DBX_COLLECTION } from './database-practice';
import { kvRead } from '../kvstore/engine';
import { parseServiceHealth } from './service-health';
import { checksum } from '../hosts/cluster';
export type IntegrationFoundationCheck =
  | {
      kind: 'integration-state';
      label: string;
      adapter: IntegrationKind;
      events: number;
      pending: number;
      priorFailure: boolean;
      duplicates?: number;
      dropped?: string[];
      checkpoint?: number;
    }
  | {
      kind: 'service-health';
      label: string;
      service: string;
      score: number;
      dependencies: string[];
      search: string;
      field: string;
      warning: number;
      critical: number;
      priorCritical?: boolean;
      priorDependencyImpact?: boolean;
    };
export function setupIntegrationFixture(w: World, kind: IntegrationKind) {
  initializeIntegration(w, kind);
  if (kind === 'otel' || kind === 'cribl') activateIntegration(w, kind);
  pollIntegration(w, kind);
  setClock(w, { paused: true });
}
/** Pure inspection of actual receipt IDs, pending work, native KV checkpoint and current model output. */
export function integrationFoundationCheck(w: World, c: IntegrationFoundationCheck) {
  if (c.kind === 'service-health') {
    const s = w.serviceHealth,
      last = s?.evaluations.at(-1);
    if (!s?.activeSource || !last) return false;
    try {
      const model = parseServiceHealth(w, s.activeSource),
        service = model.services.find((v) => v.id === c.service),
        kpi = service?.kpis.find(
          (k) =>
            k.kind === 'search' &&
            k.search === c.search &&
            k.field === c.field &&
            k.warning === c.warning &&
            k.critical === c.critical,
        ),
        revision = checksum({ source: s.activeSource }),
        actual = last.services.find((v) => v.id === c.service);
      return (
        !!kpi &&
        model.earliest === '-1m' &&
        JSON.stringify([...(service?.dependencies ?? [])].sort()) ===
          JSON.stringify([...c.dependencies].sort()) &&
        last.revision === revision &&
        last.configurationRevision === w.hosts.confVersion &&
        last.inputRevision === (w.ingestion?.nextId ?? 0) &&
        last.tick === w.clock.tick &&
        actual?.score === c.score &&
        (!c.priorCritical ||
          s.evaluations.some(
            (e) =>
              e.revision === revision && e.services.some((v) => v.id === c.service && v.state === 'critical'),
          )) &&
        (!c.priorDependencyImpact ||
          s.evaluations.some(
            (e) =>
              e.revision === revision &&
              e.services.some((v) => v.id === c.service && v.dependencyImpact && v.baseScore === 100),
          ))
      );
    } catch {
      return false;
    }
  }
  const runtime = w.integrations,
    a = runtime?.[c.adapter];
  if (!runtime || !a) return false;
  const receipts = runtime.receipts.filter((r) => r.kind === c.adapter),
    ids = [
      ...new Set(
        receipts.filter((r) => ['delivered', 'duplicate'].includes(r.status)).flatMap((r) => r.eventIds),
      ),
    ];
  if (
    ids.length !== c.events ||
    ids.some((id) => !w.ingestion?.events.some((e) => e.id === id)) ||
    (c.priorFailure && !receipts.some((r) => r.status === 'failed')) ||
    (c.duplicates !== undefined && receipts.filter((r) => r.status === 'duplicate').length < c.duplicates)
  )
    return false;
  if (c.adapter === 'aws') return runtime.aws!.messages.filter((m) => !m.acknowledged).length === c.pending;
  if (c.adapter === 'otel') {
    try {
      return (
        runtime.otel!.pending.length === c.pending &&
        !!parseCollector(runtime.otel!.activeSource ?? '').pipelines.traces
      );
    } catch {
      return false;
    }
  }
  if (c.adapter === 'cribl') {
    try {
      const r = runtime.cribl!,
        routes = parseCriblRoutes(r.activeSource ?? ''),
        destination = validateCriblDestination(
          readIntegrationSource(w, r.host, INTEGRATION_PATHS.criblAvailability),
        );
      const output = (severity: string) =>
        routes.find(
          (route) => !route.disabled && routeMatches(route.filter, { id: 'grade', fields: { severity } }),
        )?.output;
      return (
        r.pending.length === c.pending &&
        JSON.stringify([...r.dropped].sort()) === JSON.stringify([...(c.dropped ?? [])].sort()) &&
        destination.available === true &&
        output('debug') === 'devnull' &&
        output('error') === 'splunk_out' &&
        output('warn') === 'splunk_out'
      );
    } catch {
      return false;
    }
  }
  if (!w.kvstore) return false;
  try {
    return (
      c.pending === 0 &&
      kvRead(w, runtime.database!.host, DBX_APP, DBX_COLLECTION, { _key: 'v7_inventory' })[0]?.checkpoint ===
        c.checkpoint
    );
  } catch {
    return false;
  }
}
