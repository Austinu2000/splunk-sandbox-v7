import { describe, it, expect } from 'vitest';
import { createWorld } from '../src/world';
import { runSearch } from '../src/spl/run';
import { training } from '../src/training/engine';
const w = createWorld({ fleetSize: 50 });
describe('SPL comments and macros', () => {
  it('ignores multiline comments, pipes, quotes and macros inside comments', () => {
    const result = runSearch(w, {
      search:
        '| makeresults ```notes: " \' | unknown `missing`\nsecond line``` | eval amount=round(3.14159,2) | table amount',
    });
    expect(result.status).toBe('done');
    expect(result.results[0]?.get('amount')).toBe(3.14);
  });
  it('separates adjacent tokens and can disable a whole pipeline stage', () => {
    const result = runSearch(w, {
      search: '| makeresults | stats```count rows```count ```| unsupported command```',
    });
    expect(result.status).toBe('done');
    expect(result.results[0]?.get('count')).toBe(1);
  });
  it('retains comment and macro delimiters inside quoted strings', () => {
    const result = runSearch(w, {
      search: '| makeresults | eval note="```literal``` and `missing`" | table note',
    });
    expect(result.status).toBe('done');
    expect(result.results[0]?.get('note')).toBe('```literal``` and `missing`');
  });
  it('expands real macros with comments and still rejects recursion', () => {
    training(w).macros.commented = '| makeresults ```a note``` | eval amount=7';
    expect(runSearch(w, { search: '`commented` | table amount' }).results[0]?.get('amount')).toBe(7);
    training(w).macros.loop = '`loop`';
    expect(runSearch(w, { search: '`loop`' }).status).toBe('failed');
  });
  it('reports malformed comments before executing a search', () => {
    const r = runSearch(w, { search: '| makeresults ```unfinished' });
    expect(r.status).toBe('failed');
    expect(r.messages[0]?.text).toContain('Unclosed SPL comment');
    expect(r.phases).toHaveLength(0);
  });
  it('explains the generating-command placement restriction', () => {
    const r = runSearch(w, { search: '```note``` | makeresults' });
    expect(r.status).toBe('failed');
    expect(r.messages[0]?.text).toContain('after the first generating command');
  });
  it('does not execute outputlookup hidden in a comment', () => {
    const r = runSearch(w, { search: '| makeresults ```| outputlookup should_not_exist.csv```' });
    expect(r.status).toBe('done');
    expect(training(w).lookups.should_not_exist).toBeUndefined();
  });
});
