import type { Cred, Vfs } from '../vfs/vfs';
import { sha256Text } from './maintenance-state';
export function verifyVirtualChecksums(
  fs: Vfs,
  manifest: string,
  cred: Cred,
  resolve: (path: string) => string,
) {
  const text = fs.readFile(manifest, cred);
  if (text.length > 20000) throw new Error('Checksum manifest limit: 20,000 characters');
  const lines = text.trim().split('\n');
  if (lines.length > 100) throw new Error('Checksum file limit: 100 entries');
  const files = lines.map((line) => {
    const m = /^([a-fA-F0-9]{64}) [ *](.+)$/.exec(line);
    if (!m) throw new Error('Malformed SHA-256 checksum file');
    const path = resolve(m[2]!),
      body = fs.readFile(path, cred);
    if (new TextEncoder().encode(body).byteLength > 2000000)
      throw new Error('Virtual checksum input limit: 2 MB per file');
    const digest = sha256Text(body);
    return { path, digest, valid: digest === m[1]!.toLowerCase() };
  });
  return {
    files,
    valid: files.every((f) => f.valid),
    stdout: files.map((f) => f.path + ': ' + (f.valid ? 'OK' : 'FAILED')).join('\n') + '\n',
  };
}
