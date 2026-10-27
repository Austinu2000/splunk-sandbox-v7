/** Formats names in columns like ls / tab completion. */
export function columns(items: string[], width: number): string {
  if (!items.length) return '';
  const colWidth = Math.max(...items.map((i) => i.length)) + 2;
  const perRow = Math.max(1, Math.floor(width / colWidth));
  const rows = Math.ceil(items.length / perRow);
  const lines: string[] = [];
  for (let r = 0; r < rows; r++) {
    let line = '';
    for (let c = 0; c < perRow; c++) {
      const item = items[c * rows + r];
      if (item !== undefined) line += item.padEnd(colWidth);
    }
    lines.push(line.trimEnd());
  }
  return lines.join('\n');
}
