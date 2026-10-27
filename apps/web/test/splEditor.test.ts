import { describe, it, expect } from 'vitest';
import { highlightSpl, toggleSplComment } from '../src/components/splEditorSyntax';
import { tokenizeSpl } from '@sandbox/shared';
describe('SPL editor syntax', () => {
  it('colors function calls, commands, strings and comments without changing text', () => {
    const text =
      '| makeresults | eval x=round(3.14, 1), label="stats count" ```note\n| eval``` | stats count AS total';
    const tokens = highlightSpl(text);
    expect(tokens.map((t) => t.text).join('')).toBe(text);
    expect(tokens.find((t) => t.text === 'round')?.style).toBe('function');
    expect(tokens.find((t) => t.text === 'eval')?.style).toBe('command');
    expect(tokens.find((t) => t.text === 'count')?.style).toBe('function');
    expect(tokens.find((t) => t.text === '"stats count"')?.style).toBe('string');
    expect(tokens.filter((t) => t.style === 'comment')).toHaveLength(1);
  });
  it('keeps incomplete comments highlighted while typing', () => {
    expect(tokenizeSpl('| stats count ```note').at(-1)).toMatchObject({ kind: 'comment', closed: false });
  });
  it('inserts an empty note at the cursor and restores a selected stage', () => {
    const text = '| makeresults | stats count';
    const inserted = toggleSplComment(text, text.length, text.length);
    expect(inserted.value).toBe(text + '``````');
    expect(inserted.start).toBe(text.length + 3);
    const wrapped = toggleSplComment(text, 14, text.length);
    const restored = toggleSplComment(wrapped.value, wrapped.start, wrapped.end);
    expect(restored.value).toBe(text);
  });
  it('unwraps from inside a note and avoids nesting delimiters', () => {
    expect(toggleSplComment('a ```note``` b', 6, 6).value).toBe('a note b');
    const text = '| stats count ```note```';
    expect(toggleSplComment(text, 0, text.length).value).toBe(text);
  });
});
