import type { PracticePrincipal, ResultValue } from '@sandbox/shared';
import type { World } from '../world';
import { resolveHost, splunkdRunning } from '../hosts/profile';
import { runningConf, activateInputConf } from '../hosts/running';
import { hostFs } from '../vfs/build';
import { ROOT } from '../vfs/vfs';
import { patchConf } from '../scenario/engine';
import { confBool } from '../conf/parse';
import { hashString } from '../rng';
import { OperationsError, requireCapability } from './access';
import { appendRecordedEvents, deliveryPath } from './ingestion';

/** Training-only HEC credentials, deterministic and confined to the virtual filesystem. */
export function configureHec(
  world: World,
  hostName: string,
  name: string,
  values: { index: string; indexes?: string; sourcetype: string; disabled?: boolean },
  principal: PracticePrincipal = 'admin',
) {
  const host = resolveHost(world, hostName);
  if (!host?.splunk || !['indexer', 'heavy_forwarder'].includes(host.role))
    throw new OperationsError('HEC requires a full Splunk indexer or heavy forwarder');
  requireCapability(world, hostName, principal, 'edit_monitor');
  if (!/^[A-Za-z][A-Za-z0-9_-]{0,63}$/.test(name)) throw new OperationsError('Invalid HEC input name');
  for (const value of [values.index, values.indexes ?? '', values.sourcetype])
    if (value.length > 300 || /[\r\n[\]]/.test(value)) throw new OperationsError('Invalid HEC setting');
  const fs = hostFs(world, host),
    dir = host.splunk.home + '/etc/apps/splunk_httpinput/local',
    file = dir + '/inputs.conf';
  const existing = runningConf(world, host, 'inputs')
    .stanzas.get('http://' + name)
    ?.settings.get('token')?.value;
  const hex = hashString(hostName + ':' + name)
    .toString(16)
    .padStart(8, '0');
  const token =
    existing ?? `${hex}-${hex.slice(0, 4)}-4${hex.slice(1, 4)}-a${hex.slice(1, 4)}-${hex}${hex.slice(0, 4)}`;
  fs.mkdir(dir, ROOT, { parents: true });
  let text = patchConf(fs.exists(file) ? fs.readFile(file, ROOT) : '', 'http', {
    disabled: '0',
    enableSSL: '1',
    port: '8088',
  });
  text = patchConf(text, 'http://' + name, {
    token,
    index: values.index,
    indexes: values.indexes ?? values.index,
    sourcetype: values.sourcetype,
    disabled: values.disabled ? '1' : '0',
  });
  fs.writeFile(file, text, ROOT);
  fs.setMeta(file, { owner: 'splunk', group: 'splunk', mode: 0o600 }, ROOT);
  activateInputConf(world, host);
  return { name, token, index: values.index, trainingOnly: true };
}
export function receiveHec(
  world: World,
  hostName: string,
  url: string,
  authorization: string,
  body: unknown,
) {
  const host = resolveHost(world, hostName);
  if (!host?.splunk || !['indexer', 'heavy_forwarder'].includes(host.role) || !splunkdRunning(world, host))
    throw new OperationsError('HEC receiver is unavailable');
  const conf = runningConf(world, host, 'inputs'),
    global = conf.stanzas.get('http');
  const get = (key: string, fallback: string) => global?.settings.get(key)?.value ?? fallback;
  if (confBool(get('disabled', '1'))) throw new OperationsError('HEC is globally disabled');
  const target = new URL(url),
    port = get('port', '8088');
  if (target.port !== port || target.protocol !== (confBool(get('enableSSL', '1')) ? 'https:' : 'http:'))
    throw new OperationsError('HEC protocol or port does not match effective inputs.conf');
  if (!['/services/collector', '/services/collector/event'].includes(target.pathname.replace(/\/$/, '')))
    throw new OperationsError('Supported HEC endpoint: /services/collector/event');
  const token = /^Splunk\s+(\S+)$/i.exec(authorization)?.[1];
  const input = [...conf.stanzas].find(
    ([name, value]) =>
      name.startsWith('http://') &&
      token &&
      value.settings.get('token')?.value.toLowerCase() === token.toLowerCase(),
  );
  if (!input) throw new OperationsError('HEC invalid token');
  const [name, stanza] = input;
  if (confBool(stanza.settings.get('disabled')?.value)) throw new OperationsError('HEC token is disabled');
  if (!body || typeof body !== 'object' || Array.isArray(body))
    throw new OperationsError('HEC expects one JSON event envelope per request');
  const data = body as Record<string, unknown>;
  const unsupported = Object.keys(data).filter(
    (key) => !['event', 'time', 'host', 'source', 'sourcetype', 'index', 'fields'].includes(key),
  );
  if (unsupported.length)
    throw new OperationsError('Unsupported HEC envelope fields: ' + unsupported.join(', '));
  if (data.event === undefined || data.event === null || !['string', 'object'].includes(typeof data.event))
    throw new OperationsError('HEC event must be a string or JSON object');
  const metadata = (key: string, fallback: string) => {
    const value = data[key] ?? fallback;
    if (typeof value !== 'string' || !value.length || value.length > 300)
      throw new OperationsError('Invalid HEC ' + key);
    return value;
  };
  const index = metadata('index', stanza.settings.get('index')?.value ?? 'main');
  const allowed = (stanza.settings.get('indexes')?.value ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (allowed.length && !allowed.includes(index))
    throw new OperationsError('HEC index is not allowed by this token');
  const path = deliveryPath(world, host);
  const time = data.time === undefined ? world.clock.now : Number(data.time) * 1000;
  if (!Number.isFinite(time)) throw new OperationsError('Invalid HEC time');
  const fields = data.fields ?? {};
  if (
    !fields ||
    typeof fields !== 'object' ||
    Array.isArray(fields) ||
    Object.values(fields).some((v) => v !== null && !['string', 'number', 'boolean'].includes(typeof v))
  )
    throw new OperationsError('HEC indexed fields must be scalar values');
  // HEC /event accepts a complete event; monitor line-breaking and timestamp rules do not split it.
  const records = appendRecordedEvents(world, [
    {
      time,
      indexTime: world.clock.now,
      raw: typeof data.event === 'string' ? data.event : JSON.stringify(data.event),
      host: metadata('host', hostName),
      source: metadata('source', 'http:' + name.slice(7)),
      sourcetype: metadata('sourcetype', stanza.settings.get('sourcetype')?.value ?? 'httpevent'),
      index,
      receiver: path.receiver.hostname,
      fields: fields as Record<string, ResultValue>,
      provenance: 'hec',
      operationId: `hec:${name}:${world.clock.tick}:${world.ingestion?.nextId ?? 1}`,
    },
  ]);
  return { text: 'Success', code: 0, eventIds: records.map((e) => e.id) };
}
