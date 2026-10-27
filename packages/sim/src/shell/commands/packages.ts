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
