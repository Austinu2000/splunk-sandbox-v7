import { tokenizeSpl } from '@sandbox/shared';
const commands = new Set(
  'search stats eventstats streamstats timechart chart table fields eval where rex regex sort head tail dedup top rare lookup inputlookup outputlookup rest metadata tstats makeresults append join rename bin fillnull mvexpand mvjoin makemv convert transaction collect spath return addtotals format map foreach'.split(
    ' ',
  ),
);
const keywords = new Set('as by over output outputnew and or not in true false null'.split(' '));
const aggregates = new Set(
  'count dc distinct_count sum avg min max values list first last latest earliest median mode stdev perc95'.split(
    ' ',
  ),
);
export function highlightSpl(text: string) {
  let commandPosition = true;
  return tokenizeSpl(text).map((t) => {
    let style: string = t.kind;
    if (t.kind === 'word') {
      const name = t.text.toLowerCase();
      style =
        commandPosition && commands.has(name)
          ? 'command'
          : keywords.has(name)
            ? 'keyword'
            : /^\s*\(/.test(text.slice(t.end)) || aggregates.has(name)
              ? 'function'
              : 'field';
      commandPosition = false;
    } else if (t.kind !== 'space' && t.kind !== 'comment') commandPosition = t.text === '|';
    return { ...t, style };
  });
}
/** An empty selection inserts a note; a selected/commented range toggles its delimiters. */
export function toggleSplComment(text: string, start: number, end: number) {
  const comment = tokenizeSpl(text).find(
    (t) => t.kind === 'comment' && t.closed && start >= t.start && end <= t.end,
  );
  if (comment) {
    const value = text.slice(0, comment.start) + comment.text.slice(3, -3) + text.slice(comment.end);
    return {
      value,
      start: Math.max(comment.start, start - 3),
      end: Math.max(comment.start, Math.min(comment.end - 6, end - 3)),
    };
  }
  const selected = text.slice(start, end);
  if (selected.includes('```')) return { value: text, start, end };
  return {
    value: text.slice(0, start) + '```' + selected + '```' + text.slice(end),
    start: start + 3,
    end: end + 3,
  };
}
