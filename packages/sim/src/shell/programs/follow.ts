import { FsError, type FsFile } from '../../vfs/vfs';
import { lines } from '../commands/util';
import type { CmdCtx, Program, ProgramHost } from '../types';

/**
 * `tail -f`: prints the last lines, then on every simulation tick prints whatever the log's
 * generator produced since the previous tick. Static files simply don't grow. Ctrl-C stops it.
 */
export function followProgram(ctx: CmdCtx, files: string[], pick: (ls: string[]) => string[]): Program {
  const { sh } = ctx;
  let host: ProgramHost;
  let lastNow = sh.world.clock.now;
  let lastFile = '';
  const multi = files.length > 1;
  const nodes = files.map((f) => ({ name: f, path: sh.resolve(f) }));

  const header = (name: string) => {
    if (!multi || lastFile === name) return '';
    const h = `${lastFile ? '\n' : ''}==> ${name} <==\n`;
    lastFile = name;
    return h;
  };

  return {
    start(h) {
      host = h;
      let out = '';
      for (const n of nodes) {
        try {
          out += header(n.name);
          const content = pick(lines(sh.fs.readFile(n.path, sh.cred)));
          out += content.length ? content.join('\n') + '\n' : '';
        } catch (e) {
          if (!(e instanceof FsError)) throw e;
          out += `tail: cannot open '${n.name}' for reading: ${e.message}\n`;
        }
      }
      host.write(out);
    },
    tick() {
      const now = sh.world.clock.now;
      if (now <= lastNow) return;
      let out = '';
      for (const n of nodes) {
        const node = sh.fs.findNode(n.path);
        if (!node || node.type !== 'file' || !(node as FsFile).source) continue;
        const fresh = (node as FsFile).source!.lines(lastNow, now);
        if (fresh.length) out += header(n.name) + fresh.join('\n') + '\n';
      }
      lastNow = now;
      if (out) host.write(out);
    },
    key(k) {
      if (k.name === 'ctrl' && (k.ch === 'c' || k.ch === 'd')) {
        host.write('^C\n');
        host.exit(130);
      }
    },
  };
}
