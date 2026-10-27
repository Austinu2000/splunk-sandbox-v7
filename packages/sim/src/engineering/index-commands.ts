import type { CommandFn } from '../shell/types';
import { ok, fail } from '../shell/types';
import { changeIndex, indexCatalog, validateClusterIndexes, removeIndex } from './indexes';
import { practicePrincipal, OperationsError } from './access';
import { managerBundle } from '../hosts/cluster';
import type { World } from '../world';
import type { PracticePrincipal } from '@sandbox/shared';

export function fixturePrincipal(auth?: string): PracticePrincipal {
  if (!auth) return 'admin';
  const [name, ...password] = auth.split(':');
  if (password.join(':') !== 'training-only')
    throw new OperationsError(
      'Use a simulated admin, analyst or operator account with the training-only fixture password',
    );
  return practicePrincipal(name);
}
export const indexCli: CommandFn = ({ world, sh, argv }) => {
  try {
    const [verb, subject, name, ...args] = argv.slice(1);
    if (verb === 'validate' && subject === 'cluster-bundle') {
      if (sh.host.role !== 'cluster_manager')
        throw new OperationsError('Validate bundles on the Cluster Manager');
      if (name || args.length) throw new OperationsError('Unsupported cluster validation flag');
      validateClusterIndexes(managerBundle(world, sh.host));
      return ok('Bundle validation succeeded.\n');
    }
    if (subject !== 'index') throw new OperationsError('Unsupported index command');
    if (verb === 'list') {
      const listArgs = argv.slice(3);
      let wanted: string | undefined,
        principal: PracticePrincipal = 'admin';
      for (let n = 0; n < listArgs.length; n++) {
        const value = listArgs[n]!;
        if (value === '-auth') principal = fixturePrincipal(listArgs[++n]);
        else if (!value.startsWith('-') && !wanted) wanted = value;
        else throw new OperationsError('Supported: splunk list index [NAME] [-auth PRINCIPAL:training-only]');
      }
      const entries = indexCatalog(world, sh.host.hostname, principal);
      return ok(
        entries
          .filter((i) => !wanted || i.name === wanted)
          .map(
            (i) =>
              `[${i.name}]\n${Object.entries(i.settings)
                .map(([k, v]) => `${k} = ${v}`)
                .join('\n')}\nsource = ${i.sourcePath}\n`,
          )
          .join('\n'),
      );
    }
    if (!name || !['add', 'edit'].includes(verb ?? ''))
      throw new OperationsError('Use splunk add index NAME or splunk edit index NAME -SETTING VALUE');
    const values: Record<string, string> = {};
    let principal: PracticePrincipal = 'admin';
    for (let n = 0; n < args.length; n++) {
      const flag = args[n]!;
      if (!flag.startsWith('-') || !args[n + 1])
        throw new OperationsError('Index options require -SETTING VALUE');
      const value = args[++n]!;
      if (flag === '-auth') principal = fixturePrincipal(value);
      else values[flag.slice(1)] = value;
    }
    const result = changeIndex(world, sh.host.hostname, name, values, { create: verb === 'add', principal });
    return ok(
      `Index ${name} ${verb === 'add' ? 'created' : 'updated'}.${result.restartRequired ? ' Restart this standalone indexer to activate the staged changes.' : ' Configuration is active.'}\n`,
    );
  } catch (e) {
    return fail((e as Error).message);
  }
};
export function indexRest(
  world: World,
  host: string,
  method: string,
  path: string,
  body: unknown,
  principal: PracticePrincipal = 'admin',
) {
  const target = new URL(path, 'https://localhost:8089');
  const match = /^\/services\/data\/indexes(?:\/([^/]+))?\/?$/.exec(target.pathname);
  if (!match) throw new OperationsError('Unsupported index REST endpoint');
  const name = match[1] ? decodeURIComponent(match[1]) : undefined;
  if (method === 'GET')
    return {
      entry: indexCatalog(world, host, principal)
        .filter((i) => !name || i.name === name)
        .map((i) => ({
          name: i.name,
          content: { ...i.settings, currentDBSizeMB: i.currentDBSizeMB, sourcePath: i.sourcePath },
        })),
    };
  if (method === 'DELETE' && name) {
    removeIndex(world, host, name, principal);
    return { ok: true };
  }
  if (method !== 'POST' || !body || typeof body !== 'object' || Array.isArray(body))
    throw new OperationsError('Supported index REST operations: GET, POST create/edit');
  const { name: inputName, ...settings } = body as Record<string, unknown>;
  return changeIndex(world, host, name ?? String(inputName ?? ''), settings, { create: !name, principal });
}
