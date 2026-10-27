import { hashString } from '../rng';
import type { CommandFn } from '../shell/types';
import { fail, ok } from '../shell/types';
import { Vfs, ROOT, type FsDir } from '../vfs/vfs';
import { Shell } from '../shell/shell';
import { nanoProgram } from '../shell/programs/editor';
export const VAULT_HEADER = '$ANSIBLE_VAULT;SANDBOX-1;TRAINING-ONLY';
/** Reversible fixture encoding, intentionally NOT real cryptography or Ansible Vault interoperability. */
export function encodeVault(text: string, password: string): string {
  const bytes = new TextEncoder().encode(text),
    key = hashString(password);
  return (
    VAULT_HEADER +
    '\n' +
    key.toString(16) +
    '\n' +
    [...bytes].map((b, i) => (b ^ ((key >>> ((i % 4) * 8)) & 255)).toString(16).padStart(2, '0')).join('') +
    '\n'
  );
}
export function decodeVault(text: string, password: string): string {
  const lines = text.trim().split('\n');
  if (lines[0] !== VAULT_HEADER || lines[1] !== hashString(password).toString(16))
    throw new Error('Invalid training vault password or format');
  const hex = lines[2] ?? '';
  if (!/^(?:[a-f0-9]{2})*$/.test(hex)) throw new Error('Invalid vault content');
  const key = hashString(password);
  return new TextDecoder().decode(
    Uint8Array.from(hex.match(/../g) ?? [], (v, i) => parseInt(v, 16) ^ ((key >>> ((i % 4) * 8)) & 255)),
  );
}
export const vaultCommand: CommandFn = ({ world, sh, argv }) => {
  try {
    const action = argv[1],
      file = argv[2],
      at = argv.indexOf('--vault-password-file');
    if (!file || at < 0 || !argv[at + 1])
      return fail(
        'Usage: ansible-vault encrypt|view|edit file --vault-password-file ~/.vault_pass (training encoding only)',
      );
    const path = sh.resolve(file),
      password = sh.fs.readFile(sh.resolve(argv[at + 1]!), sh.cred).trim();
    if (!password) return fail('Empty training password file');
    const raw = sh.fs.readFile(path, sh.cred);
    if (action === 'encrypt') {
      if (raw.startsWith(VAULT_HEADER)) return fail('Already encoded');
      sh.fs.writeFile(path, encodeVault(raw, password), sh.cred);
      return ok('Training vault encoded. This is not production encryption.\n');
    }
    const plain = decodeVault(raw, password);
    if (action === 'view') return ok('TRAINING VAULT — simulated encoding\n' + plain + '\n');
    if (action !== 'edit') return fail('Supported vault operations: encrypt, view, edit');
    const root: FsDir = {
      type: 'dir',
      owner: 'root',
      group: 'root',
      mode: 0o777,
      mtime: world.clock.now,
      children: new Map(),
    };
    const fs = new Vfs(root, new Map(), () => world.clock.now);
    fs.writeFile('/vault.yml', plain, ROOT);
    fs.setMeta('/vault.yml', { owner: sh.user, group: sh.user, mode: 0o600 }, ROOT);
    const shadow = new Shell(world, sh.host, fs, sh.cred, 'oneshot', sh, { cwd: '/' });
    const program = nanoProgram(shadow, '/vault.yml');
    return {
      program: {
        ...program,
        start(host) {
          program.start({
            ...host,
            exit(code) {
              if (!code) {
                sh.fs.writeFile(path, encodeVault(fs.readFile('/vault.yml', sh.cred), password), sh.cred);
                host.write('Training vault saved; plaintext was not written to the repository.\n');
              }
              host.exit(code);
            },
          });
        },
      },
    };
  } catch (e) {
    return fail((e as Error).message);
  }
};
