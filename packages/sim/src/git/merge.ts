import { same, type Tree } from './state';
export interface Edit {
  start: number;
  end: number;
  lines: string[];
}
const lines = (s: string) => s.match(/[^\n]*\n|[^\n]+$/g) ?? [];
/** Bounded LCS. Larger files use a conservative whole-file edit, never unbounded allocation. */
export function edits(a: string[], b: string[]): Edit[] {
  if (a.length * b.length > 1_000_000) return same(a, b) ? [] : [{ start: 0, end: a.length, lines: b }];
  const width = b.length + 1,
    table = new Uint32Array((a.length + 1) * width);
  for (let i = a.length - 1; i >= 0; i--)
    for (let j = b.length - 1; j >= 0; j--)
      table[i * width + j] =
        a[i] === b[j]
          ? 1 + table[(i + 1) * width + j + 1]!
          : Math.max(table[(i + 1) * width + j]!, table[i * width + j + 1]!);
  const result: Edit[] = [];
  let i = 0,
    j = 0,
    e: Edit | undefined;
  const flush = () => {
    if (e) result.push(e);
    e = undefined;
  };
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && a[i] === b[j]) {
      flush();
      i++;
      j++;
    } else if (j < b.length && (i === a.length || table[i * width + j + 1]! >= table[(i + 1) * width + j]!)) {
      e ??= { start: i, end: i, lines: [] };
      e.lines.push(b[j++]!);
    } else {
      e ??= { start: i, end: i, lines: [] };
      e.end = ++i;
    }
  }
  flush();
  return result;
}
function mergeText(base: string, ours: string, theirs: string): string | undefined {
  const b = lines(base),
    left = edits(b, lines(ours)),
    right = edits(b, lines(theirs));
  const all = [...left];
  for (const r of right) {
    if (left.some((l) => same(l, r))) continue;
    if (
      left.some(
        (l) =>
          Math.max(l.start, r.start) < Math.min(l.end, r.end) ||
          l.start === r.start ||
          (l.start === l.end && l.start > r.start && l.start < r.end) ||
          (r.start === r.end && r.start > l.start && r.start < l.end),
      )
    )
      return undefined;
    all.push(r);
  }
  all.sort((a, b) => b.start - a.start);
  for (const e of all) b.splice(e.start, e.end - e.start, ...e.lines);
  return b.join('');
}
export function mergeTrees(base: Tree, ours: Tree, theirs: Tree): { tree: Tree; conflicts: string[] } {
  const tree: Tree = {},
    conflicts: string[] = [];
  for (const path of [
    ...new Set([...Object.keys(base), ...Object.keys(ours), ...Object.keys(theirs)]),
  ].sort()) {
    const b = base[path],
      o = ours[path],
      t = theirs[path];
    if (same(o, t) || same(b, t)) {
      if (o) tree[path] = o;
      continue;
    }
    if (same(b, o)) {
      if (t) tree[path] = t;
      continue;
    }
    const text = b && o && t ? mergeText(b.text, o.text, t.text) : undefined;
    const mode =
      o?.mode === t?.mode
        ? o?.mode
        : b?.mode === o?.mode
          ? t?.mode
          : b?.mode === t?.mode
            ? o?.mode
            : undefined;
    if (text !== undefined && mode !== undefined) tree[path] = { text, mode };
    else {
      conflicts.push(path);
      tree[path] = {
        text: `<<<<<<< HEAD\n${o?.text ?? ''}${o?.text && !o.text.endsWith('\n') ? '\n' : ''}=======\n${t?.text ?? ''}${t?.text && !t.text.endsWith('\n') ? '\n' : ''}>>>>>>> incoming\n`,
        mode: o?.mode ?? t?.mode ?? 0o644,
      };
    }
  }
  return { tree: structuredClone(tree), conflicts };
}
export function diff(a: Tree, b: Tree): string {
  let out = '';
  for (const p of [...new Set([...Object.keys(a), ...Object.keys(b)])].sort()) {
    if (same(a[p], b[p])) continue;
    out += `diff --git a/${p} b/${p}\n`;
    if (a[p]?.mode !== b[p]?.mode)
      out += `${!a[p] ? 'new file' : !b[p] ? 'deleted file' : 'old'} mode ${a[p] ? (0o100000 | a[p]!.mode).toString(8) : (0o100000 | b[p]!.mode).toString(8)}\n${a[p] && b[p] ? `new mode ${(0o100000 | b[p]!.mode).toString(8)}\n` : ''}`;
    const before = lines(a[p]?.text ?? ''),
      after = lines(b[p]?.text ?? '');
    out += `--- ${a[p] ? 'a/' + p : '/dev/null'}\n+++ ${b[p] ? 'b/' + p : '/dev/null'}\n@@ -${before.length ? 1 : 0},${before.length} +${after.length ? 1 : 0},${after.length} @@\n`;
    out += before.map((l) => '-' + l + (l.endsWith('\n') ? '' : '\n\\ No newline at end of file\n')).join('');
    out += after.map((l) => '+' + l + (l.endsWith('\n') ? '' : '\n\\ No newline at end of file\n')).join('');
  }
  return out;
}
export function blameLines(parent: string, current: string, ids: string[], id: string): string[] {
  const list = [...ids];
  for (const e of edits(lines(parent), lines(current)).reverse())
    list.splice(e.start, e.end - e.start, ...e.lines.map(() => id));
  return list;
}
export const lineCount = (s: string) => lines(s).length;
