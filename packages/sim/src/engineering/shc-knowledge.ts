import type { World } from '../world';
import { resolveHost } from '../hosts/profile';
import { hostFs } from '../vfs/build';
import { ROOT } from '../vfs/vfs';
import { activateReportConf, activateDashboardConf } from '../hosts/running';
import { parseConf } from '../conf/parse';
import { patchConf } from '../scenario/engine';
import { requireShcWritable, shcHealth } from './shc-health';
import { persistClusterManagement, clusterReceipt } from './cluster-state';
import { OperationsError } from './access';
export interface ReplicatedKnowledgeFile {
  path: string;
  text: string;
  stanza?: string;
  deleted?: boolean;
}
export function queueKnowledgeReplication(world: World, source: string, files: ReplicatedKnowledgeFile[]) {
  if (!world.clusterManagement) return;
  const h = shcHealth(world);
  if (!h.configured || !h.members.some((m) => m.host === source)) return;
  requireShcWritable(world, source);
  const state = world.clusterManagement;
  if (state.shc.replication.filter((r) => r.completed.length < r.targets.length).length >= 30)
    throw new OperationsError(
      'SHC knowledge replication backlog is full; advance or repair members before another edit',
    );
  files = files.map((f) => {
    if (!f.stanza) return f;
    const stanza = parseConf(f.text).stanzas.get(f.stanza);
    return {
      ...f,
      text: stanza
        ? '[' +
          f.stanza +
          ']\n' +
          [...stanza.settings].map(([k, v]) => k + ' = ' + v.value.replace(/\n/g, '\\\n')).join('\n') +
          '\n'
        : '',
    };
  });
  if (
    files.length > 6 ||
    JSON.stringify(files).length > 500000 ||
    files.some((f) => !/^\/opt\/splunk\/etc\/(apps|users)\//.test(f.path) || f.path.split('/').includes('..'))
  )
    throw new OperationsError('Replicated knowledge source is outside the bounded namespace');
  state.shc.replication.push({
    id: 'shc-replication-' + state.nextId++,
    source,
    targets: h.members.filter((m) => m.host !== source).map((m) => m.host),
    files: structuredClone(files),
    completed: [],
  });
  state.shc.replication = state.shc.replication
    .filter((r) => r.completed.length < r.targets.length)
    .concat(state.shc.replication.filter((r) => r.completed.length === r.targets.length).slice(-20));
  clusterReceipt(world, 'shc.knowledge.queued', source, 'Canonical object update queued for other members');
  persistClusterManagement(world);
}
function removeStanza(text: string, name: string) {
  let remove = false;
  return text
    .split('\n')
    .filter((line) => {
      const m = /^\s*\[([^\]]+)\]/.exec(line);
      if (m) remove = m[1] === name;
      return !remove;
    })
    .join('\n');
}
export function tickKnowledgeReplication(world: World) {
  if (!world.clusterManagement) return;
  const h = shcHealth(world);
  if (!h.majority || !h.captain) return;
  const available = new Set(h.members.filter((m) => m.available).map((m) => m.host));
  for (const update of world.clusterManagement.shc.replication) {
    const target = update.targets.find((n) => !update.completed.includes(n) && available.has(n));
    if (!target) continue;
    try {
      const p = resolveHost(world, target)!,
        fs = hostFs(world, p);
      for (const file of update.files) {
        if (file.stanza) {
          const source = parseConf(file.text).stanzas.get(file.stanza),
            existing = fs.exists(file.path) ? fs.readFile(file.path, ROOT) : '',
            text = source
              ? patchConf(
                  existing,
                  file.stanza,
                  Object.fromEntries([...source.settings].map(([k, v]) => [k, v.value])),
                )
              : removeStanza(existing, file.stanza);
          fs.mkdir(file.path.slice(0, file.path.lastIndexOf('/')), ROOT, { parents: true });
          fs.writeFile(file.path, text, ROOT);
        } else if (file.deleted) {
          if (fs.exists(file.path)) fs.remove(file.path, ROOT);
        } else {
          fs.mkdir(file.path.slice(0, file.path.lastIndexOf('/')), ROOT, { parents: true });
          fs.writeFile(file.path, file.text, ROOT);
        }
      }
      activateReportConf(world, p);
      activateDashboardConf(world, p);
      update.completed.push(target);
      delete update.error;
      clusterReceipt(world, 'shc.knowledge.applied', target, update.id);
    } catch (e) {
      update.error = (e as Error).message;
    }
    return;
  }
}
