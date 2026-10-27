import type { CommandFn } from '../shell/types';
import { ok, fail } from '../shell/types';
import { kvRest } from './rest';
import { kvInspect, kvResync, kvBackup, kvRestore, KvError } from './engine';
import { reloadAppConf } from '../hosts/running';
export const kvCurl: CommandFn = ({ world, sh, argv }) => {
  try {
    let method = 'GET',
      raw = '',
      url = '',
      data = false;
    for (let i = 1; i < argv.length; i++) {
      const a = argv[i]!;
      if (['-X', '--request'].includes(a)) method = argv[++i]!;
      else if (['-d', '--data', '--data-raw', '--data-urlencode'].includes(a)) {
        const v = argv[++i] ?? '';
        raw += raw ? '&' + v : v;
        data = true;
      } else if (['-H', '--header', '-u', '--user'].includes(a)) i++;
      else if (['-k', '-s', '-S', '--insecure', '--silent', '--show-error'].includes(a)) continue;
      else if (a === '--get' || a === '-G') method = 'GET';
      else if (a.startsWith('-')) throw new KvError(`Unsupported curl flag: ${a}`);
      else url = a;
    }
    const target = new URL(url);
    if (target.protocol !== 'https:' || target.port !== '8089')
      throw new KvError('Use a simulated https://HOST:8089 KV endpoint');
    const host = ['localhost', '127.0.0.1'].includes(target.hostname) ? sh.host.hostname : target.hostname;
    let body: unknown = {};
    if (raw) {
      body =
        raw.startsWith('[') || raw.startsWith('{')
          ? JSON.parse(raw)
          : Object.fromEntries(new URLSearchParams(raw));
    }
    if (
      data &&
      !argv.includes('-X') &&
      !argv.includes('--request') &&
      !argv.includes('--get') &&
      !argv.includes('-G')
    )
      method = 'POST';
    if (method === 'GET' && raw) target.search = raw;
    return ok(
      JSON.stringify(kvRest(world, host, method, target.pathname + target.search, body), null, 2) + '\n',
    );
  } catch (e) {
    return fail('curl (simulated): ' + (e as Error).message);
  }
};
export const kvCli: CommandFn = ({ world, sh, argv }) => {
  try {
    const [verb, subject, ...args] = argv.slice(1),
      host = sh.host.hostname;
    const flag = (name: string) => args[args.indexOf(name) + 1];
    const allowed = verb === 'show' ? ['--verbose'] : verb === 'reload' ? ['-app'] : ['-archiveName'];
    for (let i = 0; i < args.length; i++) {
      if (!allowed.includes(args[i]!)) throw new KvError(`Unsupported practice option: ${args[i]}`);
      if (args[i] !== '--verbose' && (!args[++i] || args[i]!.startsWith('-')))
        throw new KvError('Missing option value');
    }
    if (verb === 'show' && subject === 'kvstore-status')
      return ok(
        Object.entries(kvInspect(world, host))
          .map(([k, v]) => `${k} : ${v}`)
          .join('\n') + '\n',
      );
    if (verb === 'resync' && subject === 'kvstore') {
      kvResync(world, host);
      return ok('KV Store member synchronized.\n');
    }
    if (verb === 'backup' && subject === 'kvstore') {
      if (!args.includes('-archiveName')) throw new KvError('Use -archiveName NAME');
      return ok('Backup created: ' + kvBackup(world, host, flag('-archiveName')!) + '\n');
    }
    if (verb === 'restore' && subject === 'kvstore') {
      if (!args.includes('-archiveName')) throw new KvError('Use -archiveName NAME');
      kvRestore(world, host, flag('-archiveName')!.replace(/\.tar\.gz$/, ''));
      return ok('KV Store restored; pre-restore data retained.\n');
    }
    if (verb === 'reload' && ['collections', 'transforms'].includes(subject!)) {
      reloadAppConf(world, sh.host, args.includes('-app') ? flag('-app')! : 'kv_training');
      return ok('App collection/lookup configuration reloaded.\n');
    }
    throw new KvError('Unsupported KV Store command');
  } catch (e) {
    return fail((e as Error).message);
  }
};
