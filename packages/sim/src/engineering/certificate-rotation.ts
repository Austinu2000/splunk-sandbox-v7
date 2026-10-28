import { confBool } from '../conf/parse';
import type { World } from '../world';
import { resolveHost } from '../hosts/profile';
import { runtimeHooks } from '../hosts/runtime-hooks';
import { runningConf, runningVfs } from '../hosts/running';
import { setting } from '../conf/merge';
import { forwarderConnection } from './forwarder-tls';
import { maintenanceState, persistMaintenance, sha256Text } from './maintenance-state';
/** Actual active metadata relationship; never a TLS socket or real PEM parser. */
export function certificateRelationship(w: World, host: string, server: string) {
  const source = resolveHost(w, host),
    receiver = resolveHost(w, server.split(':')[0]!);
  if (!source?.splunk || !receiver?.splunk) throw new Error('Choose a known virtual TLS source and receiver');
  const output = runningConf(w, source, 'outputs'),
    group = [...output.stanzas.keys()].find(
      (n) => n.startsWith('tcpout:') && (setting(output, n, 'server') ?? '').split(',').includes(server),
    );
  const value = (key: string) => setting(output, group ?? '', key) ?? setting(output, 'tcpout', key) ?? '',
    inputs = runningConf(w, receiver, 'inputs');
  const certPath =
      setting(inputs, 'splunktcp-ssl://' + server.split(':')[1], 'serverCert') ??
      setting(inputs, 'SSL', 'serverCert') ??
      '',
    caPath =
      value('sslRootCAPath') || setting(runningConf(w, source, 'server'), 'sslConfig', 'sslRootCAPath') || '';
  let cert: Record<string, unknown> = {},
    ca: Record<string, unknown> = {},
    error = '';
  const cred = { user: 'splunk', groups: ['splunk'] },
    read = (text: string) => {
      const value: unknown = JSON.parse(text);
      if (!value || typeof value !== 'object' || Array.isArray(value))
        throw new Error('Invalid teaching certificate or CA metadata');
      return value as Record<string, unknown>;
    };
  try {
    cert = read(
      runningVfs(w, receiver).readFile(certPath.replaceAll('$SPLUNK_HOME', receiver.splunk.home), cred),
    );
    ca = read(runningVfs(w, source).readFile(caPath.replaceAll('$SPLUNK_HOME', source.splunk.home), cred));
  } catch (e) {
    error = (e as Error).message;
  }
  const connection = forwarderConnection(w, source, server),
    names = Array.isArray(ca.names) ? ca.names : [ca.name],
    caIssuers = names.filter((n): n is string => typeof n === 'string'),
    issuer = typeof cert.issuer === 'string' ? cert.issuer : '';
  return {
    host,
    server,
    reachable: connection.reachable && !connection.error,
    verified: confBool(value('sslVerifyServerCert')),
    issuer,
    caIssuers,
    sourceRevision: sha256Text(
      JSON.stringify({
        output: group ? [...output.stanzas.get(group)!.settings].map(([k, v]) => [k, v.value]) : [],
        cert,
        ca,
        reachable: connection.reachable,
        error: connection.error,
      }),
    ),
    error: connection.error || error,
  };
}
export function watchCertificateRotation(w: World, host: string, server: string) {
  const state = maintenanceState(w);
  state.tlsWatches ??= [];
  if (!state.tlsWatches.some((x) => x.host === host && x.server === server)) {
    if (state.tlsWatches.length >= 10) throw new Error('Certificate relationship watch limit: 10');
    state.tlsWatches.push({ host, server });
  }
  capture(w, host, server);
}
function capture(w: World, host: string, server: string) {
  const state = maintenanceState(w),
    relationship = certificateRelationship(w, host, server),
    previous = state.tlsProbes?.filter((x) => x.host === host && x.server === server).at(-1);
  if (previous?.sourceRevision === relationship.sourceRevision) return;
  state.tlsProbes ??= [];
  state.tlsProbes.push({ tick: w.clock.tick, ...relationship });
  state.tlsProbes = state.tlsProbes.slice(-150);
  persistMaintenance(w);
}
runtimeHooks.changed.push((w, p) => {
  for (const watch of w.maintenance?.tlsWatches ?? [])
    if (watch.host === p.hostname || resolveHost(w, watch.server.split(':')[0]!)?.hostname === p.hostname)
      capture(w, watch.host, watch.server);
});
