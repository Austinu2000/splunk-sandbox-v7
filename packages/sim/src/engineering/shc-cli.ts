import type { CommandFn } from '../shell/types';
import { ok, fail } from '../shell/types';
import { shcHealth } from './shc-health';
import { queueShcBundle, queueShcRestart } from './shc-bundles';
import { fixturePrincipal } from './index-commands';
import { resolveHost } from '../hosts/profile';
import { OperationsError } from './access';
export const shcCli: CommandFn = ({ world, sh, argv }) => {
  try {
    const [verb, subject, ...args] = argv.slice(1),
      values: Record<string, string> = {};
    let auth: string | undefined;
    for (let n = 0; n < args.length; n++) {
      const key = args[n]!;
      if (['--verbose', '--answer-yes'].includes(key)) continue;
      if (!key.startsWith('-') || args[n + 1] === undefined)
        throw new OperationsError('Use explicit supported SHC options');
      const value = args[++n]!;
      if (key === '-auth') auth = value;
      else values[key.slice(1)] = value;
    }
    const principal = fixturePrincipal(auth),
      health = shcHealth(world);
    if (verb === 'show' && subject === 'shcluster-status') {
      if (!health.members.some((m) => m.host === sh.host.hostname))
        throw new OperationsError('Inspect SHC status on a member');
      if (Object.keys(values).length) throw new OperationsError('Unsupported SHC status option');
      return ok(JSON.stringify(health, null, 2) + '\n');
    }
    if (principal !== 'admin')
      throw new OperationsError('Permission denied: SHC operations require the admin practice principal');
    if (verb === 'apply' && subject === 'shcluster-bundle') {
      if (Object.keys(values).some((k) => k !== 'target'))
        throw new OperationsError(
          'Supported SHC bundle option: -target; force/preserve overrides and other push modes are not modeled',
        );
      if (!values.target) throw new OperationsError('Use -target https://MEMBER:8089');
      let target: URL;
      try {
        target = new URL(values.target);
      } catch {
        throw new OperationsError('Invalid SHC target URI');
      }
      const p = resolveHost(world, target.hostname);
      if (
        target.protocol !== 'https:' ||
        target.port !== '8089' ||
        !p ||
        !health.members.some((m) => m.host === p.hostname && m.available)
      )
        throw new OperationsError('Target an available SHC member management URI');
      const job = queueShcBundle(world, sh.host);
      return ok('SHC bundle queued: ' + job.id + ' checksum=' + job.checksum + '\n');
    }
    if (verb === 'rolling-restart' && subject === 'shcluster-members') {
      if (
        Object.keys(values).some((k) => k !== 'searchable') ||
        (values.searchable !== undefined && values.searchable !== 'true')
      )
        throw new OperationsError('Only the controlled/searchable restart workflow is supported');
      return ok('SHC restart queued: ' + queueShcRestart(world, sh.host).id + '\n');
    }
    throw new OperationsError('Unsupported SHC command');
  } catch (e) {
    return fail((e as Error).message);
  }
};
