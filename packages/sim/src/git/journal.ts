import type { GitState } from './state';
export interface GitPatch {
  path: string[];
  value?: unknown;
  remove?: true;
}
/** Small state deltas keep a long practice session from copying its whole history on every add/push. */
export function gitPatches(before: GitState, after: GitState): GitPatch[] {
  const out: GitPatch[] = [];
  function visit(a: unknown, b: unknown, path: string[]) {
    if (a === b) return;
    if (
      a &&
      b &&
      typeof a === 'object' &&
      typeof b === 'object' &&
      Array.isArray(a) === Array.isArray(b) &&
      (!Array.isArray(a) || a.length === (b as unknown[]).length)
    ) {
      const x = a as Record<string, unknown>,
        y = b as Record<string, unknown>;
      for (const key of new Set([...Object.keys(x), ...Object.keys(y)])) {
        if (!Object.hasOwn(y, key)) out.push({ path: [...path, key], remove: true });
        else if (!Object.hasOwn(x, key)) out.push({ path: [...path, key], value: structuredClone(y[key]) });
        else visit(x[key], y[key], [...path, key]);
      }
    } else out.push({ path, value: structuredClone(b) });
  }
  visit(before, after, []);
  return out;
}
export function applyGitPatches(state: GitState, patches: GitPatch[]): void {
  for (const p of patches) {
    if (!p.path.length || p.path.some((k) => ['__proto__', 'prototype', 'constructor'].includes(k)))
      throw new Error('Invalid Git state patch');
    let target = state as unknown as Record<string, unknown>;
    for (const key of p.path.slice(0, -1)) {
      if (!Object.hasOwn(target, key) || !target[key] || typeof target[key] !== 'object')
        throw new Error('Invalid Git state patch path');
      target = target[key] as Record<string, unknown>;
    }
    const key = p.path.at(-1)!;
    if (p.remove) delete target[key];
    else target[key] = structuredClone(p.value);
  }
}
