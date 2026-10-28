import type { World } from '../world';
import { resolveHost } from '../hosts/profile';
import { hostFs } from '../vfs/build';
import { ROOT } from '../vfs/vfs';
import { patchConf } from '../scenario/engine';
import { applyClusterBundle } from '../hosts/cluster';
import { stopSplunk } from '../hosts/running';
import { tickWorld, setClock } from '../world';
import { configureMonitor, uploadPracticeFile } from './ingestion';
import {
  serviceHealthSource,
  SERVICE_HEALTH_PATH,
  activateServiceHealth,
  evaluateServiceHealth,
} from './service-health';
import { integrationSourceExists, writeIntegrationSource } from './integration-state';
import { OperationsError } from './access';
export const HEALTH_INPUT = '/var/log/practice/service-health.log';
export const HEALTH_RECOVERY =
  'service=checkout status=200 latency_ms=25\nservice=checkout status=200 latency_ms=20\nservice=auth status=200 latency_ms=10\n';
export function initializeServiceHealth(w: World, infrastructure = false) {
  if (w.serviceHealth) return w.serviceHealth;
  if (w.config.profileId !== 'lab')
    throw new OperationsError('Use the separate Lab profile for this offline service-health fixture');
  if (
    integrationSourceExists(w, 'sh01', SERVICE_HEALTH_PATH) ||
    integrationSourceExists(w, 'idx01', HEALTH_INPUT)
  )
    throw new OperationsError('An existing service model or source input has been preserved');
  const cm = resolveHost(w, 'cm01')!,
    fs = hostFs(w, cm),
    bundle = '/opt/splunk/etc/manager-apps/_cluster/local/indexes.conf';
  fs.writeFile(bundle, patchConf(fs.readFile(bundle, ROOT), 'service_logs', { repFactor: 'auto' }), ROOT);
  applyClusterBundle(w, cm);
  uploadPracticeFile(
    w,
    'idx01',
    HEALTH_INPUT,
    infrastructure
      ? HEALTH_RECOVERY
      : 'service=checkout status=500 latency_ms=400\nservice=checkout status=500 latency_ms=300\nservice=auth status=200 latency_ms=25\n',
  );
  writeIntegrationSource(w, 'idx01', '/opt/staging/v7-healthy-service-records.log', HEALTH_RECOVERY);
  configureMonitor(w, 'idx01', HEALTH_INPUT, { index: 'service_logs', sourcetype: 'v7_service' });
  tickWorld(w, 1);
  w.serviceHealth = { version: 1, nextId: 1, host: 'sh01', evaluations: [] };
  const source = serviceHealthSource(infrastructure),
    initial = infrastructure
      ? source
      : JSON.stringify(
          {
            ...JSON.parse(source),
            services: JSON.parse(source).services.map(
              (s: { id: string; dependencies: string[]; kpis: Record<string, unknown>[] }) =>
                s.id === 'checkout'
                  ? { ...s, dependencies: [], kpis: s.kpis.map((k) => ({ ...k, critical: 101 })) }
                  : s,
            ),
          },
          null,
          2,
        ) + '\n';
  writeIntegrationSource(w, 'sh01', SERVICE_HEALTH_PATH, initial);
  activateServiceHealth(w);
  if (infrastructure) stopSplunk(w, resolveHost(w, 'idx02')!);
  evaluateServiceHealth(w);
  setClock(w, { paused: true });
  return w.serviceHealth;
}
