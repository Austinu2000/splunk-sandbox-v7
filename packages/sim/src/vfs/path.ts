/** POSIX path helpers for the virtual filesystem. Paths are always absolute after resolve(). */

export function normalize(path: string): string {
  const parts: string[] = [];
  for (const seg of path.split('/')) {
    if (seg === '' || seg === '.') continue;
    if (seg === '..') parts.pop();
    else parts.push(seg);
  }
  return '/' + parts.join('/');
}

export function resolvePath(cwd: string, path: string, home: string): string {
  if (path === '~') return normalize(home);
  if (path.startsWith('~/')) return normalize(home + path.slice(1));
  return normalize(path.startsWith('/') ? path : `${cwd}/${path}`);
}

export function dirname(path: string): string {
  const p = normalize(path);
  const i = p.lastIndexOf('/');
  return i <= 0 ? '/' : p.slice(0, i);
}

export function basename(path: string): string {
  const p = normalize(path);
  return p === '/' ? '/' : p.slice(p.lastIndexOf('/') + 1);
}

export function segments(path: string): string[] {
  return normalize(path).split('/').filter(Boolean);
}

/** Shell glob (*, ?, [abc]) for a single path segment, as a RegExp. */
export function globToRegExp(glob: string): RegExp {
  let re = '^';
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i]!;
    if (c === '*') re += '[^/]*';
    else if (c === '?') re += '[^/]';
    else if (c === '[') {
      const end = glob.indexOf(']', i + 1);
      if (end < 0) re += '\\[';
      else {
        let cls = glob.slice(i + 1, end);
        if (cls.startsWith('!')) cls = '^' + cls.slice(1);
        re += `[${cls.replace(/\\/g, '\\\\')}]`;
        i = end;
      }
    } else re += c.replace(/[.+^${}()|\\]/g, '\\$&');
  }
  return new RegExp(re + '$');
}

export function hasGlob(s: string): boolean {
  return /[*?[]/.test(s);
}
