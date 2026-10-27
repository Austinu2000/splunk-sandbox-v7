import type { World } from '../world';
import type { HostProfile } from '../hosts/profile';
import { runningConf, runningVfs } from '../hosts/running';
import { setting } from '../conf/merge';
import { confBool } from '../conf/parse';
import { hostOutputs, targetStatus } from '../derive/state';
export function teachingCertificate(
  commonName: string,
  issuer = 'training-ca',
  notAfter = Date.UTC(2027, 9, 23),
) {
  return JSON.stringify({ format: 'sandbox-certificate-v1', commonName, issuer, notAfter }) + '\n';
}
export function teachingCA(name = 'training-ca') {
  return JSON.stringify({ format: 'sandbox-ca-v1', name }) + '\n';
}
function fixture(world: World, p: HostProfile, path: string, format: string) {
  if (!path) throw new Error('Certificate or CA path is missing');
  const text = runningVfs(world, p).readFile(path.replaceAll('$SPLUNK_HOME', p.splunk!.home), {
    user: 'splunk',
    groups: ['splunk'],
  });
  let value: Record<string, unknown>;
  try {
    value = JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new Error(
      'Use the explicit teaching certificate/CA artifact; native PEM parsing is outside this bounded simulation',
    );
  }
  if (value.format !== format) throw new Error('Invalid teaching certificate/CA format');
  return value;
}
function verify(
  world: World,
  verifier: HostProfile,
  peer: HostProfile,
  certificate: string,
  ca: string,
  expected: string,
) {
  const cert = fixture(world, peer, certificate, 'sandbox-certificate-v1'),
    root = fixture(world, verifier, ca, 'sandbox-ca-v1');
  if (typeof cert.notAfter !== 'number' || cert.notAfter <= world.clock.now)
    throw new Error('TLS certificate is expired or has no valid expiry');
  if (typeof root.name !== 'string' || cert.issuer !== root.name)
    throw new Error('TLS issuer does not match the configured CA');
  if (
    expected &&
    !expected
      .split(',')
      .map((s) => s.trim())
      .includes(String(cert.commonName))
  )
    throw new Error('TLS peer name does not match sslCommonNameToCheck');
}
function protocols(raw: string) {
  const values = new Set<string>();
  for (const token of raw.split(',').map((s) => s.trim())) {
    if (token === '*' || token === 'tls') {
      values.add('tls1.2');
      values.add('tls1.3');
    } else if (token.startsWith('-')) values.delete(token.slice(1));
    else values.add(token);
  }
  return values;
}
/** Validates relationships in explicit metadata fixtures. No TLS sockets or cryptography. */
export function forwarderConnection(world: World, source: HostProfile, server: string) {
  const target = targetStatus(world, server);
  if (!target.reachable || !target.host)
    return { ...target, error: 'Receiver is stopped, unreachable or not listening' };
  const receiver = target.host,
    inputs = runningConf(world, receiver, 'inputs'),
    output = runningConf(world, source, 'outputs'),
    group =
      hostOutputs(world, source).groups.find((g) =>
        (setting(output, 'tcpout:' + g, 'server') ?? '')
          .split(',')
          .map((s) => s.trim().toLowerCase())
          .includes(server.toLowerCase()),
      ) ??
      hostOutputs(world, source).groups[0] ??
      '';
  const value = (key: string) =>
    setting(output, 'tcpout:' + group, key) ?? setting(output, 'tcpout', key) ?? '';
  const tlsStanza = [...inputs.stanzas].find(
    ([name, s]) =>
      new RegExp('^splunktcp-ssl://(?:[^:]*:)?' + target.port + '$').test(name) &&
      !confBool(s.settings.get('disabled')?.value),
  );
  const encrypted = confBool(value('useSSL')) || !!value('sslCertPath');
  if (encrypted !== Boolean(tlsStanza))
    return {
      ...target,
      reachable: false,
      error: 'TLS transport mismatch between outputs.conf and receiving input',
    };
  if (!encrypted) return { ...target, error: '' };
  try {
    const receive = (key: string) =>
      tlsStanza?.[1].settings.get(key)?.value ?? setting(inputs, 'SSL', key) ?? '';
    const outgoing = protocols(value('sslVersions') || 'tls1.2'),
      incoming = protocols(receive('sslVersions') || 'tls1.2');
    if (![...outgoing].some((v) => incoming.has(v))) throw new Error('No mutually supported TLS protocol');
    if (confBool(value('sslVerifyServerCert')))
      verify(
        world,
        source,
        receiver,
        receive('serverCert'),
        value('sslRootCAPath') ||
          setting(runningConf(world, source, 'server'), 'sslConfig', 'sslRootCAPath') ||
          '',
        value('sslCommonNameToCheck'),
      );
    if (confBool(receive('requireClientCert')))
      verify(
        world,
        receiver,
        source,
        value('sslCertPath'),
        setting(runningConf(world, receiver, 'server'), 'sslConfig', 'sslRootCAPath') ||
          receive('sslRootCAPath'),
        receive('sslCommonNameToCheck'),
      );
    return { ...target, error: '' };
  } catch (e) {
    return { ...target, reachable: false, error: (e as Error).message };
  }
}
