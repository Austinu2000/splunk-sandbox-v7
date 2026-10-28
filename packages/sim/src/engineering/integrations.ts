import type { IntegrationKind, PracticePrincipal } from '@sandbox/shared';
import type { World } from '../world';
import { requireCapability, OperationsError } from './access';
import {
  INTEGRATION_PATHS,
  integrationHost,
  readIntegrationSource,
  writeIntegrationSource,
  persistIntegrations,
} from './integration-state';
import { parseCollector, pollTelemetry } from './telemetry-practice';
import { parseCriblRoutes, pollCribl, validateCriblDestination } from './cribl-practice';
import { pollAws, validateAwsPolicy } from './aws-practice';
import { pollDatabase } from './database-practice';
export type IntegrationSource = 'aws' | 'awsPolicy' | 'otel' | 'cribl' | 'criblAvailability' | 'database';
export function stageIntegration(
  w: World,
  kind: IntegrationKind,
  sourceName: IntegrationSource,
  source: string,
  principal: PracticePrincipal = 'admin',
) {
  const host = integrationHost(w, kind);
  requireCapability(w, host, principal, 'indexes_edit');
  const allowed =
    kind === 'aws' ? ['aws', 'awsPolicy'] : kind === 'cribl' ? ['cribl', 'criblAvailability'] : [kind];
  if (!allowed.includes(sourceName) || source.length > 50000 || source.includes('\0'))
    throw new OperationsError('Choose a bounded source belonging to this integration');
  if (sourceName === 'awsPolicy') validateAwsPolicy(source);
  if (sourceName === 'criblAvailability') validateCriblDestination(source);
  if (sourceName === 'otel') parseCollector(source);
  if (sourceName === 'cribl') parseCriblRoutes(source);
  writeIntegrationSource(w, host, INTEGRATION_PATHS[sourceName], source);
  return {
    path: INTEGRATION_PATHS[sourceName],
    activation: kind === 'aws' || kind === 'database' ? 'restart-required' : 'explicit-adapter-activation',
  };
}
export function activateIntegration(w: World, kind: IntegrationKind, principal: PracticePrincipal = 'admin') {
  const host = integrationHost(w, kind);
  requireCapability(w, host, principal, 'indexes_edit');
  if (kind !== 'otel' && kind !== 'cribl')
    throw new OperationsError('Restart the selected virtual Splunk service for native modular input changes');
  const source = readIntegrationSource(w, host, INTEGRATION_PATHS[kind]);
  if (kind === 'otel') parseCollector(source);
  else parseCriblRoutes(source);
  w.integrations![kind]!.activeSource = source;
  persistIntegrations(w);
  return { activated: true };
}
export function pollIntegration(w: World, kind: IntegrationKind, principal: PracticePrincipal = 'admin') {
  const host = integrationHost(w, kind);
  requireCapability(w, host, principal, 'edit_monitor');
  if (kind === 'aws') pollAws(w, true);
  else if (kind === 'otel') pollTelemetry(w);
  else if (kind === 'cribl') pollCribl(w);
  else pollDatabase(w, true);
  return w.integrations!.receipts.filter((r) => r.kind === kind).slice(-20);
}
/** Scheduled AWS/DB modular inputs. Other processes use explicit adapter polls, never real daemons. */
export function tickIntegrations(w: World) {
  if (w.integrations?.aws) pollAws(w);
  if (w.integrations?.database) pollDatabase(w);
}
