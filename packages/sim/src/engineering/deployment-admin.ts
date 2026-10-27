import { parseConf } from '../conf/parse';
import type { PracticePrincipal } from '@sandbox/shared';
import type { World } from '../world';
import { deploymentServer, reloadDeployServer } from '../hosts/running';
import { hostFs } from '../vfs/build';
import { ROOT } from '../vfs/vfs';
import { filesUnder, checksum } from '../hosts/cluster';
import { patchConf } from '../scenario/engine';
import { checkTree } from '../git/code';
import { requireCapability, OperationsError } from './access';
import { enableForwarderOperations } from './forwarders';
const confPath = '/opt/splunk/etc/system/local/serverclass.conf';
export function deploymentDraft(world: World) {
  const host = deploymentServer(world),
    fs = hostFs(world, host),
    root = host.splunk!.home + '/etc/deployment-apps',
    files = filesUnder(fs, root);
  return {
    host: host.hostname,
    revision: checksum({ serverclass: fs.exists(confPath) ? fs.readFile(confPath, ROOT) : '', ...files }),
    serverclass: fs.exists(confPath) ? fs.readFile(confPath, ROOT) : '',
    files,
  };
}
function verify(world: World, revision: string, principal: PracticePrincipal) {
  requireCapability(world, deploymentServer(world).hostname, principal, 'edit_deployment_server');
  if (deploymentDraft(world).revision !== revision)
    throw new OperationsError('Deployment source changed; reload and review the new revision');
}
const safeName = (name: string) =>
  /^[A-Za-z0-9_][A-Za-z0-9_.-]{0,79}$/.test(name) &&
  !['constructor', 'prototype', '__proto__'].includes(name);
export function stageDeploymentApp(
  world: World,
  input: { name: string; files: Record<string, string>; revision: string; principal?: PracticePrincipal },
) {
  verify(world, input.revision, input.principal ?? 'admin');
  if (!safeName(input.name))
    throw new OperationsError('Use an app name with letters, numbers, underscore, dot or dash');
  const entries = Object.entries(input.files);
  if (!entries.length || entries.length > 20 || JSON.stringify(input.files).length > 250000)
    throw new OperationsError('Provide 1–20 configuration files, at most 250 KB');
  for (const [path, text] of entries)
    if (!/^(?:local|default)\/[a-zA-Z][a-zA-Z0-9_-]*\.conf$/.test(path) || text.length > 100000)
      throw new OperationsError('App editor accepts bounded local/default .conf files');
  const errors = checkTree(Object.fromEntries(entries.map(([path, text]) => [path, { text, mode: 0o644 }])));
  if (errors.length) throw new OperationsError(errors.join('\n'));
  const draft = deploymentDraft(world);
  if (new Set([...Object.keys(draft.files).map((p) => p.split('/')[0]!), input.name]).size > 100)
    throw new OperationsError('Deployment app limit: 100');
  enableForwarderOperations(world);
  const p = deploymentServer(world),
    fs = hostFs(world, p),
    root = p.splunk!.home + '/etc/deployment-apps/' + input.name;
  for (const [file, text] of entries) {
    const path = root + '/' + file;
    fs.mkdir(path.slice(0, path.lastIndexOf('/')), { user: 'splunk', groups: ['splunk'] }, { parents: true });
    fs.writeFile(path, text, ROOT);
    fs.setMeta(path, { owner: 'splunk', group: 'splunk', mode: 0o644 }, ROOT);
  }
  return deploymentDraft(world);
}
export function stageServerClass(
  world: World,
  input: {
    name: string;
    whitelist: string[];
    blacklist: string[];
    apps: string[];
    restart: boolean;
    revision: string;
    principal?: PracticePrincipal;
  },
) {
  verify(world, input.revision, input.principal ?? 'admin');
  if (
    !safeName(input.name) ||
    !input.whitelist.length ||
    input.whitelist.length > 20 ||
    input.blacklist.length > 20 ||
    !input.apps.length ||
    input.apps.length > 30
  )
    throw new OperationsError('Supply a class name, 1–20 allow patterns and 1–30 apps');
  for (const p of [...input.whitelist, ...input.blacklist])
    if (!/^[A-Za-z0-9_*?.:-]{1,128}$/.test(p))
      throw new OperationsError('This editor supports bounded hostname/IP wildcard patterns');
  const draft = deploymentDraft(world),
    available = new Set(Object.keys(draft.files).map((p) => p.split('/')[0]));
  if (input.apps.some((app) => !safeName(app) || !available.has(app)))
    throw new OperationsError('Stage each selected app before assigning it');
  const existing = parseConf(draft.serverclass);
  for (const [name, stanza] of existing.stanzas)
    if (name === 'serverClass:' + input.name || name.startsWith('serverClass:' + input.name + ':app:')) {
      const allowed = name.includes(':app:')
        ? /^(?:restartSplunkd|stateOnClient)$/
        : /^(?:filterType|restartSplunkd|disabled|(?:whitelist|blacklist)\.\d+)$/;
      if ([...stanza.settings.keys()].some((key) => !allowed.test(key)))
        throw new OperationsError(
          'This class has attributes outside the editor subset; use configuration editing to preserve them',
        );
    }
  let next = draft.serverclass;
  const stanza = 'serverClass:' + input.name,
    lines = next.split('\n');
  let removing = false;
  const kept: string[] = [];
  for (const line of lines) {
    const m = /^\[([^\]]+)\]$/.exec(line.trim());
    if (m) removing = m[1] === stanza || m[1]!.startsWith(stanza + ':app:');
    if (!removing) kept.push(line);
  }
  next = kept.join('\n');
  next = patchConf(next, stanza, {
    filterType: 'whitelist',
    ...Object.fromEntries(input.whitelist.map((p, i) => ['whitelist.' + i, p])),
    ...Object.fromEntries(input.blacklist.map((p, i) => ['blacklist.' + i, p])),
  });
  for (const app of [...new Set(input.apps)])
    next = patchConf(next, stanza + ':app:' + app, {
      restartSplunkd: String(input.restart),
      stateOnClient: 'enabled',
    });
  enableForwarderOperations(world);
  hostFs(world, deploymentServer(world)).writeFile(confPath, next, ROOT);
  return deploymentDraft(world);
}
export function publishDeployment(world: World, revision: string, principal: PracticePrincipal = 'admin') {
  verify(world, revision, principal);
  enableForwarderOperations(world);
  reloadDeployServer(world, deploymentServer(world));
  return {
    revision: world.forwarders!.catalogs.at(-1)!.revision,
    catalog: world.forwarders!.catalogs.at(-1)!.id,
  };
}
