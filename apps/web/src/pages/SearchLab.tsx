import { useState } from 'react';
import { request } from './TrainingPage';
export function SearchLab() {
  const [left, setLeft] = useState('| inputlookup employee_lookup.csv | search department=IT | stats count'),
    [right, setRight] = useState('| inputlookup employee_lookup.csv | where department="IT" | stats count'),
    [result, setResult] = useState(''),
    [macro, setMacro] = useState('employee_it'),
    [definition, setDefinition] = useState('| inputlookup employee_lookup.csv | search department=IT');
  const exercises = [
    [
      'Employee lookup',
      '| inputlookup employee_lookup.csv | search department=IT | outputlookup it_employees.csv',
      'IQ054: Verify the output, then try append=true.',
    ],
    [
      'Event and running totals',
      '| inputlookup employee_lookup.csv | eventstats count as total by department | streamstats count as position',
      'IQ046: Explain which commands preserve rows.',
    ],
    [
      'Summary indexing',
      '| inputlookup employee_lookup.csv | collect index=employee_summary',
      'IQ048/057: Query with | tstats summariesonly=true count where index=employee_summary by department',
    ],
    [
      'Join and append',
      '| inputlookup employee_lookup.csv | join employee_id [ | inputlookup employee_lookup.csv ]',
      'IQ056: Compare the row count with append.',
    ],
  ];
  return (
    <>
      <h2>SPL practice lab</h2>
      <div className="v5-grid">
        {exercises.map(([title, search, help]) => (
          <article className="v5-card" key={title}>
            <h3>{title}</h3>
            <p>{help}</p>
            <pre>{search}</pre>
            <a href={'#/search?q=' + encodeURIComponent(search!)}>Run in Search →</a>
          </article>
        ))}
      </div>
      <h2>Compare equivalent searches</h2>
      <p>
        Compare result sets and deterministic work units. Runtime milliseconds vary by machine and are not
        used for grading.
      </p>
      <div className="v5-split">
        <label>
          Baseline
          <textarea value={left} onChange={(e) => setLeft(e.target.value)} />
        </label>
        <label>
          Candidate
          <textarea value={right} onChange={(e) => setRight(e.target.value)} />
        </label>
      </div>
      <button
        onClick={async () => {
          try {
            setResult(JSON.stringify(await request('training/compare', { left, right }), null, 2));
          } catch (e) {
            setResult(String(e));
          }
        }}
      >
        Compare results and work
      </button>
      {result && <pre>{result}</pre>}
      <h2>Reusable search macros</h2>
      <label>
        Name
        <input value={macro} onChange={(e) => setMacro(e.target.value)} />
      </label>
      <label className="v5-note">
        Definition
        <textarea value={definition} onChange={(e) => setDefinition(e.target.value)} />
      </label>
      <button
        onClick={async () => {
          try {
            await request('training/macro', { name: macro, search: definition });
            setResult('Saved macro. Use `' + macro + '` in Search.');
          } catch (e) {
            setResult(String(e));
          }
        }}
      >
        Save macro
      </button>
    </>
  );
}
