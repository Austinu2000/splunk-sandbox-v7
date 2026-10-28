import { sha256Text } from '../../engineering/maintenance-state';
import { installEnterprisePackage } from '../../engineering/enterprise-upgrade';
import {
  installForwarderPackage,
  forwarderPackageVersion,
  packageFixture,
} from '../../engineering/forwarders';
import { splunkVersion } from '../../hosts/profile';
import type { CommandFn } from '../types';
import { ok, fail } from '../types';
export const rpm: CommandFn = ({ world, sh, argv }) => {
  try {
    const [flag, path, ...extra] = argv.slice(1);
    if (extra.length)
      throw new Error('Supported: rpm -q splunkforwarder | -K PACKAGE | -ivh PACKAGE | -Uvh PACKAGE');
    if (flag === '-q' && path === 'splunkforwarder') {
      const version = sh.host.role === 'universal_forwarder' ? splunkVersion(world, sh.host) : null;
      return version
        ? ok('splunkforwarder-' + version + '-simulated.x86_64\n')
        : fail('package splunkforwarder is not installed');
    }
    if (!path || !['-K', '-ivh', '-Uvh'].includes(flag ?? ''))
      throw new Error('Supported: rpm -q splunkforwarder | -K PACKAGE | -ivh PACKAGE | -Uvh PACKAGE');
    const full = sh.resolve(path),
      text = sh.fs.readFile(full, sh.cred),
      version = forwarderPackageVersion(full);
    if (flag === '-K')
      return version && text === packageFixture(version)
        ? ok(full + ': verified teaching fixture identity (simulation, not a vendor signature)\n')
        : fail('Unrecognized or modified teaching package');
    if (sh.user !== 'root') return fail('error: package installation requires root privileges');
    const changed = installForwarderPackage(world, sh.host.hostname, full, text, flag === '-Uvh');
    return ok(
      changed
        ? 'Preparing... splunkforwarder installed in the virtual filesystem; stopped until training license acceptance/start.\n'
        : 'package already at requested version\n',
    );
  } catch (e) {
    return fail(e instanceof Error ? e.message : String(e));
  }
};

/** Bounded native-looking commands over the virtual filesystem only. */
export const sha256sum: CommandFn = ({ sh, argv }) => {
  try {
    const args = argv.slice(1);
    if (args[0] === '-c' && args.length === 2) {
      const path = sh.resolve(args[1]!),
        lines = sh.fs.readFile(path, sh.cred).trim().split('\n');
      if (lines.length > 100) throw new Error('Checksum file limit: 100 entries');
      let failed = false;
      const out = lines.map((line) => {
        const m = /^([a-f0-9]{64}) [ *](.+)$/.exec(line);
        if (!m) throw new Error('Malformed SHA-256 checksum file');
        const actual = sha256Text(sh.fs.readFile(sh.resolve(m[2]!), sh.cred)),
          ok = actual === m[1];
        failed ||= !ok;
        return m[2] + ': ' + (ok ? 'OK' : 'FAILED');
      });
      return { stdout: out.join('\n') + '\n', code: failed ? 1 : 0 };
    }
    if (args.length !== 1 || args[0]!.startsWith('-'))
      throw new Error('Supported: sha256sum FILE | sha256sum -c MANIFEST');
    const path = sh.resolve(args[0]!);
    return ok(sha256Text(sh.fs.readFile(path, sh.cred)) + '  ' + args[0] + '\n');
  } catch (e) {
    return fail('sha256sum: ' + (e as Error).message);
  }
};
export const tar: CommandFn = ({ world, sh, argv }) => {
  try {
    const args = argv.slice(1);
    if (
      args.length !== 4 ||
      !['-xzf', '-xzvf'].includes(args[0]!) ||
      args[2] !== '-C' ||
      sh.resolve(args[3]!) !== '/opt'
    )
      throw new Error(
        'This virtual tar supports only: tar -xzf VERIFIED_TEACHING_PACKAGE -C /opt. Configuration archives use the labeled maintenance workflow.',
      );
    if (!['splunk', 'root'].includes(sh.user)) throw new Error('Permission denied');
    const path = sh.resolve(args[1]!);
    sh.fs.readFile(path, sh.cred);
    const changed = installEnterprisePackage(world, sh.host.hostname, path);
    return ok(
      changed
        ? 'Teaching package descriptor applied to virtual Enterprise installation; start with the nonbinding --accept-license flag.\n'
        : 'Virtual Enterprise is already at the verified target version.\n',
    );
  } catch (e) {
    return fail('tar: ' + (e as Error).message);
  }
};
