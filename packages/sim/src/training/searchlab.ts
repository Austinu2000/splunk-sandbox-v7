import type { World } from '../world';
import { runSearch } from '../spl/run';
import { training, persistTraining, TrainingError, recordEvidence } from './engine';
import type { SearchRequest } from '../spl/run';
function canonical(rows: Record<string, unknown>[]): string {
  return JSON.stringify(
    rows
      .map((row) => Object.fromEntries(Object.entries(row).sort(([a], [b]) => a.localeCompare(b))))
      .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))),
  );
}
export function compareSearches(world: World, left: string, right: string) {
  if (/\b(outputlookup|collect)\b/i.test(left + ' ' + right))
    throw new TrainingError('Comparison queries must be read-only');
  const req = (search: string): SearchRequest => ({ search });
  const a = runSearch(world, req(left)),
    b = runSearch(world, req(right));
  const rows = (o: typeof a) => (o.kind === 'events' ? o.events : o.results).map((r) => r.toObject());
  const complete = (o: typeof a) =>
    o.status === 'done' && !o.scan?.truncated && (o.kind !== 'events' || o.events.length === o.eventCount);
  const equivalent = complete(a) && complete(b) && canonical(rows(a)) === canonical(rows(b));
  const result = {
    equivalent,
    baseline: { status: a.status, workUnits: a.workUnits, rows: rows(a), messages: a.messages },
    candidate: { status: b.status, workUnits: b.workUnits, rows: rows(b), messages: b.messages },
    improved: equivalent && b.workUnits < a.workUnits,
  };
  recordEvidence(
    world,
    'search.compare',
    'dashboard',
    getResourceRevision(world),
    a.status === 'done' && b.status === 'done',
    JSON.stringify({ equivalent, leftWork: a.workUnits, rightWork: b.workUnits }),
  );
  persistTraining(world);
  return result;
}
function getResourceRevision(world: World) {
  return training(world).resources.find((r) => r.id === 'dashboard')!.appliedRevision;
}
export const SEARCH_EXERCISES = [
  {
    id: 'lookup',
    questionIds: ['IQ054'],
    title: 'Save IT employees without losing existing lookup rows',
    start: '| inputlookup employee_lookup.csv | search department=IT | outputlookup it_employees.csv',
    followup: 'Read the output. Then repeat with append=true and explain the difference.',
    verify: '| inputlookup it_employees.csv | stats count by department',
  },
  {
    id: 'aggregate',
    questionIds: ['IQ046'],
    title: 'Compare eventstats and streamstats',
    start:
      '| inputlookup employee_lookup.csv | eventstats count as total by department | streamstats count as position',
    followup: 'Why does eventstats preserve each event while stats collapses rows?',
    verify: '| inputlookup employee_lookup.csv | stats count by department',
  },
  {
    id: 'summary',
    questionIds: ['IQ048', 'IQ057'],
    title: 'Build and query a summary dataset',
    start: '| inputlookup employee_lookup.csv | collect index=employee_summary',
    followup: 'A summary is a snapshot. Change the source and explain when the summary becomes stale.',
    verify: '| tstats summariesonly=true count where index=employee_summary by department',
  },
  {
    id: 'join',
    questionIds: ['IQ049', 'IQ056'],
    title: 'Compare join, append and grouped events',
    start: '| inputlookup employee_lookup.csv | join employee_id [ | inputlookup employee_lookup.csv ]',
    followup: 'Compare this with append: does the row count change? What is the join key?',
    verify: '| inputlookup employee_lookup.csv | append [ | inputlookup employee_lookup.csv ] | stats count',
  },
];
