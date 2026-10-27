import type { LogSource } from '../logs/sources';
import { basename, dirname, normalize, segments } from './path';

export interface NodeMeta {
  owner: string;
  group: string;
  mode: number;
  mtime: number;
}

export interface FsFile extends NodeMeta {
  type: 'file';
  content?: string;
  /** Generated log: content is source.lines(now - window, now). */
  source?: LogSource;
  /** Reported size for binaries whose content isn't meaningful. */
  size?: number;
  /** Name of a simulated program this file runs as (e.g. "splunk"). */
  exec?: string;
}

export interface FsDir extends NodeMeta {
  type: 'dir';
  children: Map<string, FsNode>;
}

export type FsNode = FsFile | FsDir;

/** A user change on top of the generated tree. Stored in the world so it survives re-login. */
export type OverlayEntry =
  | ({ kind: 'file'; content: string } & NodeMeta)
  | ({ kind: 'dir' } & NodeMeta)
  | ({ kind: 'meta' } & Pick<NodeMeta, 'owner' | 'group' | 'mode'>)
  | { kind: 'deleted' };

export type FsErrorCode =
  'ENOENT' | 'EACCES' | 'ENOTDIR' | 'EISDIR' | 'EEXIST' | 'ENOTEMPTY' | 'EPERM' | 'EINVAL';

const MESSAGES: Record<FsErrorCode, string> = {
  ENOENT: 'No such file or directory',
  EACCES: 'Permission denied',
  ENOTDIR: 'Not a directory',
  EISDIR: 'Is a directory',
  EEXIST: 'File exists',
  ENOTEMPTY: 'Directory not empty',
  EPERM: 'Operation not permitted',
  EINVAL: 'Invalid argument',
};

export class FsError extends Error {
  constructor(
    readonly code: FsErrorCode,
    readonly path: string,
  ) {
    super(MESSAGES[code]);
  }
}

export interface Cred {
  user: string;
  groups: string[];
}

export const ROOT: Cred = { user: 'root', groups: ['root'] };

const utf8 = new TextEncoder();
const R = 4,
  W = 2,
  X = 1;

export function can(node: NodeMeta, cred: Cred, bit: number): boolean {
  if (cred.user === 'root') {
    if (bit !== X || (node as FsNode).type === 'dir') return true;
    return (node.mode & 0o111) !== 0;
  }
  if (node.owner === cred.user) return ((node.mode >> 6) & bit) !== 0;
  if (cred.groups.includes(node.group)) return ((node.mode >> 3) & bit) !== 0;
  return (node.mode & bit) !== 0;
}

/**
 * One host's filesystem: a generated base tree plus the user's overlay.
 * Every mutating call updates the live tree and records the change in the overlay.
 */
export class Vfs {
  constructor(
    readonly root: FsDir,
    private readonly overlay: Map<string, OverlayEntry>,
    private readonly now: () => number,
    /** Told about every recorded change (the world journal listens here). */
    private readonly onChange?: (path: string, entry: OverlayEntry) => void,
  ) {
    for (const [path, entry] of [...overlay.entries()].sort((a, b) => a[0].length - b[0].length))
      this.applyOverlay(path, entry);
  }

  private applyOverlay(path: string, e: OverlayEntry): void {
    const parent = this.findNode(dirname(path));
    if (!parent || parent.type !== 'dir') return;
    const name = basename(path);
    if (e.kind === 'deleted') parent.children.delete(name);
    else if (e.kind === 'file') {
      const { kind: _k, ...rest } = e;
      void _k;
      parent.children.set(name, { type: 'file', ...rest });
    } else if (e.kind === 'dir') {
      const existing = parent.children.get(name);
      const { kind: _k, ...meta } = e;
      void _k;
      if (existing?.type === 'dir') Object.assign(existing, meta);
      else parent.children.set(name, { type: 'dir', ...meta, children: new Map() });
    } else {
      const n = parent.children.get(name);
      if (n) Object.assign(n, { owner: e.owner, group: e.group, mode: e.mode });
    }
  }

  private record(path: string, entry: OverlayEntry): void {
    this.overlay.set(normalize(path), entry);
    this.onChange?.(normalize(path), structuredClone(entry));
  }

  /** Lookup without permission checks. */
  findNode(path: string): FsNode | null {
    let node: FsNode = this.root;
    for (const seg of segments(path)) {
      if (node.type !== 'dir') return null;
      const next = node.children.get(seg);
      if (!next) return null;
      node = next;
    }
    return node;
  }

  /** Lookup with search (x) permission on every ancestor directory. */
  lookup(path: string, cred: Cred): FsNode {
    let node: FsNode = this.root;
    for (const seg of segments(path)) {
      if (node.type !== 'dir') throw new FsError('ENOTDIR', path);
      if (!can(node, cred, X)) throw new FsError('EACCES', path);
      const next = node.children.get(seg);
      if (!next) throw new FsError('ENOENT', path);
      node = next;
    }
    return node;
  }

  exists(path: string): boolean {
    return this.findNode(path) !== null;
  }

  readFile(path: string, cred: Cred): string {
    const node = this.lookup(path, cred);
    if (node.type === 'dir') throw new FsError('EISDIR', path);
    if (!can(node, cred, R)) throw new FsError('EACCES', path);
    return fileContent(node, this.now());
  }

  /** Directory entries sorted by name. */
  readdir(path: string, cred: Cred): [string, FsNode][] {
    const node = this.lookup(path, cred);
    if (node.type !== 'dir') throw new FsError('ENOTDIR', path);
    if (!can(node, cred, R)) throw new FsError('EACCES', path);
    return [...node.children.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }

  private parentDir(path: string, cred: Cred): FsDir {
    const parent = this.lookup(dirname(path), cred);
    if (parent.type !== 'dir') throw new FsError('ENOTDIR', path);
    return parent;
  }

  writeFile(path: string, content: string, cred: Cred, opts: { append?: boolean } = {}): void {
    const p = normalize(path);
    const parent = this.parentDir(p, cred);
    const existing = parent.children.get(basename(p));
    if (existing?.type === 'dir') throw new FsError('EISDIR', p);
    const now = this.now();
    if (existing) {
      if (!can(existing, cred, W)) throw new FsError('EACCES', p);
      const next = opts.append ? fileContent(existing, now) + content : content;
      const updated: FsFile = {
        type: 'file',
        owner: existing.owner,
        group: existing.group,
        mode: existing.mode,
        mtime: now,
        content: next,
      };
      parent.children.set(basename(p), updated);
      this.record(p, {
        kind: 'file',
        content: next,
        owner: updated.owner,
        group: updated.group,
        mode: updated.mode,
        mtime: now,
      });
    } else {
      if (!can(parent, cred, W)) throw new FsError('EACCES', p);
      const group = cred.groups[0] ?? cred.user;
      parent.children.set(basename(p), {
        type: 'file',
        owner: cred.user,
        group,
        mode: 0o644,
        mtime: now,
        content,
      });
      this.record(p, { kind: 'file', content, owner: cred.user, group, mode: 0o644, mtime: now });
    }
  }

  mkdir(path: string, cred: Cred, opts: { parents?: boolean } = {}): void {
    const p = normalize(path);
    if (opts.parents) {
      let cur = '';
      for (const seg of segments(p)) {
        cur += '/' + seg;
        const n = this.findNode(cur);
        if (n && n.type !== 'dir') throw new FsError('ENOTDIR', cur);
        if (!n) this.mkdir(cur, cred);
      }
      return;
    }
    const parent = this.parentDir(p, cred);
    if (parent.children.has(basename(p))) throw new FsError('EEXIST', p);
    if (!can(parent, cred, W)) throw new FsError('EACCES', p);
    const meta = { owner: cred.user, group: cred.groups[0] ?? cred.user, mode: 0o755, mtime: this.now() };
    parent.children.set(basename(p), { type: 'dir', ...meta, children: new Map() });
    this.record(p, { kind: 'dir', ...meta });
  }

  remove(path: string, cred: Cred, opts: { recursive?: boolean } = {}): void {
    const p = normalize(path);
    if (p === '/') throw new FsError('EPERM', p);
    const parent = this.parentDir(p, cred);
    const node = parent.children.get(basename(p));
    if (!node) throw new FsError('ENOENT', p);
    if (node.type === 'dir' && !opts.recursive) throw new FsError('EISDIR', p);
    if (!can(parent, cred, W)) throw new FsError('EACCES', p);
    parent.children.delete(basename(p));
    for (const key of [...this.overlay.keys()]) if (key.startsWith(p + '/')) this.overlay.delete(key);
    this.record(p, { kind: 'deleted' });
  }

  setMeta(path: string, patch: Partial<Pick<NodeMeta, 'owner' | 'group' | 'mode'>>, cred: Cred): void {
    const p = normalize(path);
    const node = this.lookup(p, cred);
    const changingOwner =
      (patch.owner && patch.owner !== node.owner) || (patch.group && patch.group !== node.group);
    if (cred.user !== 'root' && (changingOwner || node.owner !== cred.user)) throw new FsError('EPERM', p);
    Object.assign(node, patch);
    const existing = this.overlay.get(p);
    if (existing && (existing.kind === 'file' || existing.kind === 'dir')) Object.assign(existing, patch);
    else this.record(p, { kind: 'meta', owner: node.owner, group: node.group, mode: node.mode });
  }

  /** Depth-first walk, skipping directories the user can't read. */
  walk(
    path: string,
    cred: Cred,
    fn: (path: string, node: FsNode, depth: number) => void,
    maxDepth = Infinity,
  ): string[] {
    const errors: string[] = [];
    const visit = (p: string, node: FsNode, depth: number) => {
      fn(p, node, depth);
      if (node.type !== 'dir' || depth >= maxDepth) return;
      if (!can(node, cred, R) || !can(node, cred, X)) {
        errors.push(p);
        return;
      }
      for (const [name, child] of [...node.children.entries()].sort((a, b) => a[0].localeCompare(b[0])))
        visit(p === '/' ? `/${name}` : `${p}/${name}`, child, depth + 1);
    };
    visit(normalize(path), this.lookup(path, cred), 0);
    return errors;
  }

  size(node: FsNode): number {
    if (node.type === 'dir') return 4096;
    if (node.size !== undefined) return node.size;
    return utf8.encode(fileContent(node, this.now())).length;
  }

  mtime(node: FsNode): number {
    return node.type === 'file' && node.source ? this.now() : node.mtime;
  }

  get clock(): number {
    return this.now();
  }
}

export function fileContent(node: FsFile, now: number): string {
  if (node.content !== undefined) return node.content;
  if (node.source) {
    const lines = node.source.lines(now - node.source.windowMs, now);
    return lines.length ? lines.join('\n') + '\n' : '';
  }
  return '';
}
