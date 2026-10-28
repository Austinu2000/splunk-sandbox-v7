import type { PracticePrincipal, ServiceKpiResult, ServiceHealthResult } from '@sandbox/shared';
import type { World } from '../world';
import { runSearch } from '../spl/run';
import { resolveHost, splunkdRunning } from '../hosts/profile';
import { requireCapability, OperationsError } from './access';
import { checksum } from '../hosts/cluster';
import { journal } from '../journal';
import { readIntegrationSource, writeIntegrationSource, requireKeys } from './integration-state';
export const SERVICE_HEALTH_PATH = '/etc/v7-adapters/service-health.json';
interface Kpi {
  id: string;
  kind: 'search' | 'service';
  weight: number;
  search?: string;
  field?: string;
  warning?: number;
  critical?: number;
  host?: string;
}
interface Service {
  id: string;
  name: string;
  dependencies: string[];
  kpis: Kpi[];
}
export const CHECKOUT_ERROR_SEARCH =
  'index=service_logs service=checkout | eval error=if(status>=500,100,0) | stats avg(error) as error_rate';
export const AUTH_LATENCY_SEARCH = 'index=service_logs service=auth | stats avg(latency_ms) as latency';
export function serviceHealthSource(infrastructure = false) {
  const services: Service[] = [
    {
      id: 'authentication',
      name: 'Authentication',
      dependencies: [],
      kpis: [
        {
          id: 'latency',
          kind: 'search',
          weight: 1,
          search: AUTH_LATENCY_SEARCH,
          field: 'latency',
          warning: 100,
          critical: 300,
        },
      ],
    },
    {
      id: 'checkout',
      name: 'Checkout',
      dependencies: infrastructure ? ['authentication', 'indexing'] : ['authentication'],
      kpis: [
        {
          id: 'errors',
          kind: 'search',
          weight: infrastructure ? 1 : 11,
          search: CHECKOUT_ERROR_SEARCH,
          field: 'error_rate',
          warning: 5,
          critical: 20,
        },
      ],
    },
  ];
  if (infrastructure)
    services.unshift({
      id: 'indexing',
      name: 'Indexer availability',
      dependencies: [],
      kpis: ['idx01', 'idx02', 'idx03'].map((host) => ({ id: host, kind: 'service', host, weight: 1 })),
    });
  return JSON.stringify({ version: 1, earliest: '-1m', services }, null, 2) + '\n';
}
export function parseServiceHealth(w: World, source: string) {
  let value: unknown;
  try {
    value = JSON.parse(source);
  } catch {
    throw new OperationsError('Invalid service-health teaching JSON');
  }
  const top = requireKeys(value, ['version', 'earliest', 'services'], 'service model');
  if (
    top.version !== 1 ||
    typeof top.earliest !== 'string' ||
    !/^-[1-9]\d?(?:m|h)$/.test(top.earliest) ||
    !Array.isArray(top.services) ||
    !top.services.length ||
    top.services.length > 20
  )
    throw new OperationsError('Use version 1, a bounded relative time range and 1–20 services');
  const ids = new Set<string>(),
    safe = (v: unknown) => typeof v === 'string' && /^[A-Za-z][\w-]{0,63}$/.test(v);
  const services = top.services.map((value) => {
    const s = requireKeys(value, ['id', 'name', 'dependencies', 'kpis'], 'service');
    if (
      !safe(s.id) ||
      ids.has(String(s.id)) ||
      typeof s.name !== 'string' ||
      !s.name.trim() ||
      s.name.length > 100 ||
      !Array.isArray(s.dependencies) ||
      s.dependencies.length > 10 ||
      s.dependencies.some((d) => !safe(d)) ||
      !Array.isArray(s.kpis) ||
      !s.kpis.length ||
      s.kpis.length > 10
    )
      throw new OperationsError('Use unique service IDs, dependency IDs and 1–10 actual KPIs');
    ids.add(String(s.id));
    const kpiIds = new Set<string>();
    const kpis = s.kpis.map((value) => {
      const k = requireKeys(
        value,
        ['id', 'kind', 'weight', 'search', 'field', 'warning', 'critical', 'host'],
        'KPI',
      );
      if (
        !safe(k.id) ||
        kpiIds.has(String(k.id)) ||
        !Number.isInteger(k.weight) ||
        Number(k.weight) < 0 ||
        Number(k.weight) > 11
      )
        throw new OperationsError('Use unique KPI IDs and integer importance weights 0–11');
      kpiIds.add(String(k.id));
      if (k.kind === 'search') {
        if (
          typeof k.search !== 'string' ||
          k.search.length > 5000 ||
          !/^index=/.test(k.search) ||
          /\b(?:collect|outputlookup)\b/i.test(k.search) ||
          typeof k.field !== 'string' ||
          !/^\w+$/.test(k.field) ||
          typeof k.warning !== 'number' ||
          typeof k.critical !== 'number' ||
          !Number.isFinite(k.warning) ||
          !Number.isFinite(k.critical) ||
          k.warning >= k.critical ||
          k.host !== undefined
        )
          throw new OperationsError(
            'Search KPIs require an actual index search, numeric field and increasing warning/critical thresholds',
          );
      } else if (k.kind === 'service') {
        if (
          typeof k.host !== 'string' ||
          !resolveHost(w, k.host)?.splunk ||
          ['search', 'field', 'warning', 'critical'].some((key) => k[key] !== undefined)
        )
          throw new OperationsError('Availability KPIs refer to an existing virtual Splunk service');
      } else
        throw new OperationsError(
          'Supported KPI kinds are actual read-only search or virtual service availability',
        );
      return k as unknown as Kpi;
    });
    return { ...s, kpis } as unknown as Service;
  });
  const lookup = new Map(services.map((s) => [s.id, s])),
    visiting = new Set<string>(),
    visited = new Set<string>();
  function visit(id: string) {
    if (visiting.has(id)) throw new OperationsError('Service dependencies contain a cycle');
    if (visited.has(id)) return;
    const s = lookup.get(id);
    if (!s) throw new OperationsError('A dependency refers to an undefined service');
    visiting.add(id);
    for (const d of s.dependencies) visit(d);
    visiting.delete(id);
    visited.add(id);
  }
  for (const s of services) visit(s.id);
  return { earliest: top.earliest, services };
}
export function serviceHealthRevision(w: World) {
  const s = w.serviceHealth;
  if (!s) return '';
  return checksum({
    source: readIntegrationSource(w, s.host, SERVICE_HEALTH_PATH),
    active: s.activeSource ?? '',
    state: JSON.stringify(s.evaluations),
    configuration: String(w.hosts.confVersion),
  });
}
export function stageServiceHealth(w: World, source: string, principal: PracticePrincipal = 'admin') {
  const s = w.serviceHealth;
  if (!s) throw new OperationsError('Initialize the offline service-health fixture');
  requireCapability(w, s.host, principal, 'indexes_edit');
  if (source.length > 50000) throw new OperationsError('Service model limit: 50 KB');
  parseServiceHealth(w, source);
  writeIntegrationSource(w, s.host, SERVICE_HEALTH_PATH, source);
  return { staged: true };
}
export function activateServiceHealth(w: World, principal: PracticePrincipal = 'admin') {
  const s = w.serviceHealth;
  if (!s) throw new OperationsError('Initialize the offline service-health fixture');
  requireCapability(w, s.host, principal, 'indexes_edit');
  const source = readIntegrationSource(w, s.host, SERVICE_HEALTH_PATH);
  parseServiceHealth(w, source);
  s.activeSource = source;
  journal(w, { k: 'service-health.state', state: structuredClone(s) });
  return { activated: true };
}
/** Actual read-only searches and running services; unknown/missing data can never become healthy zero. */
export function evaluateServiceHealth(w: World, principal: PracticePrincipal = 'admin') {
  const s = w.serviceHealth;
  if (!s?.activeSource) throw new OperationsError('Activate an offline service model first');
  requireCapability(w, s.host, principal, 'edit_monitor');
  const dispatchHost = s.host;
  const model = parseServiceHealth(w, s.activeSource),
    revision = checksum({ source: s.activeSource }),
    results = new Map<string, ServiceHealthResult>();
  function evaluateService(id: string): ServiceHealthResult {
    const prior = results.get(id);
    if (prior) return prior;
    const service = model.services.find((v) => v.id === id)!,
      kpis: ServiceKpiResult[] = service.kpis.map((k) => {
        if (k.kind === 'service') {
          const up = splunkdRunning(w, resolveHost(w, k.host!)!);
          return {
            id: k.id,
            value: up ? 1 : 0,
            score: up ? 100 : 0,
            state: up ? 'healthy' : 'critical',
            source: 'service:' + k.host,
            sourceRows: 1,
          };
        }
        const result = runSearch(
            w,
            {
              host: dispatchHost,
              principal,
              search: k.search!,
              earliest: model.earliest,
              latest: 'now',
              readOnly: true,
            },
            { maxScan: 10000, maxMs: Infinity },
          ),
          raw = result.results[0]?.get(k.field!),
          value = raw === null || raw === undefined ? NaN : Number(raw),
          scanned = result.scan?.scanned ?? 0;
        if (result.status !== 'done' || result.scan?.truncated || !Number.isFinite(value) || scanned === 0)
          return {
            id: k.id,
            value: null,
            score: null,
            state: 'unknown',
            source: k.search!,
            sourceRows: scanned,
            error:
              result.messages.map((m) => m.text).join('; ') || 'No usable source data in the KPI time range',
          };
        const state = value >= k.critical! ? 'critical' : value >= k.warning! ? 'warning' : 'healthy';
        return {
          id: k.id,
          value,
          score: state === 'critical' ? 0 : state === 'warning' ? 50 : 100,
          state,
          source: k.search!,
          sourceRows: scanned,
        };
      }),
      dependencies = service.dependencies.map(evaluateService);
    const own = kpis.map((k, i) => ({ score: k.score, weight: service.kpis[i]!.weight }));
    const impacting = dependencies.flatMap((d) => {
      const definition = model.services.find((s) => s.id === d.id)!;
      return d.kpis.map((k, i) => ({ score: k.score, weight: definition.kpis[i]!.weight }));
    });
    const aggregate = (items: { score: number | null; weight: number }[]) => {
      const included = items.filter((i) => i.weight > 0);
      if (included.some((i) => i.weight === 11 && i.score === 0)) return 0;
      if (!included.length || included.some((i) => i.score === null)) return null;
      return (
        included.reduce((n, i) => n + i.score! * i.weight, 0) / included.reduce((n, i) => n + i.weight, 0)
      );
    };
    const base = aggregate(own),
      score = aggregate([...own, ...impacting]);

    const result: ServiceHealthResult = {
      id,
      name: service.name,
      baseScore: base,
      score,
      state: score === null ? 'unknown' : score === 100 ? 'healthy' : score === 0 ? 'critical' : 'degraded',
      dependencies: [...service.dependencies],
      dependencyImpact: score !== null && base !== null && score < base,
      kpis,
    };
    results.set(id, result);
    return result;
  }
  for (const service of model.services) evaluateService(service.id);
  const receipt = {
    id: 'service-evaluation-' + s.nextId++,
    tick: w.clock.tick,
    revision,
    configurationRevision: w.hosts.confVersion,
    inputRevision: w.ingestion?.nextId ?? 0,
    services: model.services.map((v) => results.get(v.id)!),
  };
  s.evaluations.push(receipt);
  s.evaluations = s.evaluations.slice(-200);
  journal(w, { k: 'service-health.state', state: structuredClone(s) });
  return structuredClone(receipt);
}
