import { useState } from 'react';
import type { SavedReport, ReportRun, PracticePrincipal } from '@sandbox/shared';
import { usePoll } from '../usePoll';
import { request } from './TrainingPage';
import { Modal } from '../replica/Modal';
import { searchHash } from '../links';
interface ReportView {
  context: string;
  now: number;
  host: string;
  hosts: string[];
  reports: SavedReport[];
  declared: SavedReport[];
  runs: ReportRun[];
}
interface LegacyView {
  context: string;
  reports: {
    sourceId: string;
    title: string;
    app: string;
    owner: string;
    sharing: SavedReport['sharing'];
    search: string;
    status: string;
    imported: boolean;
  }[];
  issues: { message: string }[];
}
type Draft = Pick<
  SavedReport,
  | 'host'
  | 'app'
  | 'owner'
  | 'sharing'
  | 'title'
  | 'description'
  | 'search'
  | 'earliest'
  | 'latest'
  | 'enabled'
  | 'scheduled'
  | 'cron'
  | 'summaryIndex'
> & { context: string; revision?: string; create: boolean; sourceId?: string };
export function ReportsPage() {
  const [filter, setFilter] = useState('');
  const [host, setHost] = useState(''),
    [principal, setPrincipal] = useState<PracticePrincipal>('admin'),
    [draft, setDraft] = useState<Draft | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [notice, setNotice] = useState('');
  const data = usePoll(
    () => request<ReportView>('reports?host=' + encodeURIComponent(host) + '&principal=' + principal),
    [host, principal],
    4000,
  );
  const legacy = usePoll(() => request<LegacyView>('reports/legacy'), [], 10000),
    view = data.data;
  const act = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError('');
    try {
      await fn();
      await data.refresh();
      await legacy.refresh();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };
  const blank = (): Draft => ({
    context: view!.context,
    host: view!.host,
    app: 'search',
    owner: principal,
    sharing: 'Private',
    title: '',
    description: '',
    search: 'index=_internal | stats count by sourcetype',
    earliest: '-15m',
    latest: 'now',
    enabled: true,
    scheduled: false,
    cron: '*/5 * * * *',
    create: true,
  });
  const fromReport = (report: SavedReport): Draft => ({ ...report, context: view!.context, create: false });
  const payload = (d: Draft) => ({
    context: d.context,
    host: d.host,
    app: d.app,
    owner: d.owner,
    sharing: d.sharing,
    title: d.title,
    description: d.description,
    search: d.search,
    earliest: d.earliest,
    latest: d.latest,
    enabled: d.enabled,
    scheduled: d.scheduled,
    cron: d.cron,
    summaryIndex: d.summaryIndex || undefined,
    create: d.create,
    revision: d.revision,
    principal,
  });
  return (
    <main className="v5">
      <header className="v5-heading">
        <div>
          <span className="v5-eyebrow">SEARCH & REPORTING</span>
          <h1>Reports</h1>
          <p>Saved searches, schedules and traceable results from the active environment.</p>
        </div>
        <a href="#/search">Open Search →</a>
      </header>
      {(error || data.error) && (
        <p role="alert" className="error">
          {error || data.error}
        </p>
      )}
      {notice && (
        <p role="status" className="v5-banner">
          {notice}
        </p>
      )}
      <div className="v5-toolbar">
        <label>
          Find report
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Title, app or owner"
          />
        </label>
        <label>
          Search head
          <select value={view?.host ?? host} onChange={(e) => setHost(e.target.value)}>
            {view?.hosts.map((h) => (
              <option key={h}>{h}</option>
            ))}
          </select>
        </label>
        <label>
          Practice principal
          <select value={principal} onChange={(e) => setPrincipal(e.target.value as PracticePrincipal)}>
            <option>admin</option>
            <option>analyst</option>
            <option>operator</option>
          </select>
        </label>
        <button disabled={!view || busy} onClick={() => setDraft(blank())}>
          New Report
        </button>
        <button
          disabled={!view || busy || principal !== 'admin'}
          onClick={() =>
            void act(async () => {
              await request('reports/reload', { context: view!.context, host: view!.host, principal });
              setNotice(
                'Saved-report configuration reloaded. Inspect active definitions and any validation issues.',
              );
            })
          }
        >
          Reload saved-report configuration
        </button>
        <button
          disabled={!view || busy}
          onClick={() =>
            void act(async () => {
              await request('reports/advance', { context: view!.context });
              setNotice(
                'Simulation advanced to the next minute boundary. Inspect scheduled execution history.',
              );
            })
          }
        >
          Advance to next minute
        </button>
      </div>
      {view && Number.isFinite(view.now) && <p>Simulation time: {new Date(view.now).toISOString()} UTC</p>}
      <p>
        Web, simulated REST and savedsearches.conf share these definitions. File edits need reload or restart.
        Schedules use the simulation clock in UTC. Summary destinations must already exist; saving a report
        alone writes no events.
      </p>
      <div className="v5-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Scope</th>
              <th>Execution</th>
              <th>Source</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {view?.reports
              .filter((r) =>
                [r.title, r.app, r.owner].some((value) => value.toLowerCase().includes(filter.toLowerCase())),
              )
              .map((r) => (
                <tr key={r.id}>
                  <td>
                    <a href={searchHash(r.search, r.earliest, r.latest)}>{r.title}</a>
                    <p>{r.description}</p>
                  </td>
                  <td>
                    {r.host} · {r.app}
                    <br />
                    {r.owner} · {r.sharing}
                  </td>
                  <td>
                    {r.enabled ? 'Enabled' : 'Disabled'}
                    <br />
                    {r.scheduled ? r.cron + ' UTC' : 'On demand'}
                    {r.summaryIndex && (
                      <p>
                        Summary →{' '}
                        <a href={searchHash('index=' + r.summaryIndex, '-24h', 'now')}>{r.summaryIndex}</a>
                      </p>
                    )}
                    {!r.managed && (
                      <p>
                        Inherited reference; save an explicit configuration to include it in the bounded
                        report executor.
                      </p>
                    )}
                    {r.issues.map((issue) => (
                      <p key={issue}>{issue}</p>
                    ))}
                  </td>
                  <td>
                    <details>
                      <summary>Inspect definition</summary>
                      <p>{r.sourcePath}</p>
                      <pre>{r.search}</pre>
                      <p>
                        Time: {r.earliest} to {r.latest}
                      </p>
                      <p>Revision: {r.revision}</p>
                    </details>
                  </td>
                  <td>
                    <button
                      disabled={busy}
                      onClick={() =>
                        void act(async () => {
                          const run = await request<ReportRun>('reports/run', {
                            context: view!.context,
                            id: r.id,
                            principal,
                          });
                          setNotice(
                            run.status === 'succeeded'
                              ? `Report ran successfully: ${run.resultCount} rows; ${run.summaryEventIds.length} summary events written.`
                              : `Report ${run.status}: ${run.error}`,
                          );
                        })
                      }
                    >
                      Run once{r.summaryIndex ? ' and collect summary' : ''}
                    </button>
                    <button disabled={busy} onClick={() => setDraft(fromReport(r))}>
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      {view?.declared.some(
        (r) => !view.reports.some((active) => active.id === r.id && active.revision === r.revision),
      ) && (
        <p className="v5-banner">
          Disk definitions differ from active reports. Review the files and reload to activate changes.
        </p>
      )}
      <section className="v5-card">
        <h2>Execution history</h2>
        <p>
          Up to 200 actual runs are retained per environment. Summary rows retain the report identity and
          exact source window.
        </p>
        {view?.runs.length ? (
          <div className="v5-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Report</th>
                  <th>Status</th>
                  <th>Window</th>
                  <th>Rows / writes</th>
                  <th>Evidence</th>
                </tr>
              </thead>
              <tbody>
                {[...view.runs].reverse().map((run) => (
                  <tr key={run.id}>
                    <td>
                      {run.title}
                      <br />
                      tick {run.tick}
                    </td>
                    <td>
                      {run.status}
                      {run.error && <p>{run.error}</p>}
                    </td>
                    <td>
                      {new Date(run.earliest).toISOString()}
                      <br />
                      {new Date(run.latest).toISOString()}
                    </td>
                    <td>
                      {run.resultCount} rows
                      <br />
                      {run.summaryEventIds.length} summary writes
                    </td>
                    <td>
                      <details>
                        <summary>Results and provenance</summary>
                        <pre>
                          {JSON.stringify(
                            {
                              revision: run.revision,
                              sourcePath: run.sourcePath,
                              principal: run.principal,
                              summaryEventIds: run.summaryEventIds,
                              rows: run.rows,
                            },
                            null,
                            2,
                          )}
                        </pre>
                      </details>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No report executions in this environment yet.</p>
        )}
      </section>
      <section className="v5-card">
        <h2>Legacy report drafts</h2>
        <p>
          Original V6 records remain recoverable. Review the target scope before importing a report. Imported
          schedules start off; enable them after checking the query and destination.
        </p>
        {[...new Set(legacy.data?.issues.map((issue) => issue.message) ?? [])].map((message) => (
          <p key={message}>{message}</p>
        ))}
        {legacy.data?.reports.map((old) => (
          <p key={old.sourceId}>
            {old.title} · {old.app} · {old.owner}{' '}
            <button
              disabled={busy || !view || old.imported || old.status === 'conflict' || principal !== 'admin'}
              onClick={() =>
                setDraft({
                  ...blank(),
                  sourceId: old.sourceId,
                  title: old.title,
                  app: old.app,
                  owner: ['admin', 'analyst', 'operator', 'nobody'].includes(old.owner) ? old.owner : 'admin',
                  sharing: old.sharing,
                  search: old.search,
                })
              }
            >
              {old.imported ? 'Imported' : old.status === 'conflict' ? 'Resolve conflict' : 'Review import'}
            </button>
          </p>
        ))}
        {!legacy.data?.reports.length && <p>No saved legacy report candidates.</p>}
      </section>
      {draft && (
        <Modal
          title={draft.sourceId ? 'Review report import' : draft.create ? 'New Report' : 'Edit Report'}
          onClose={() => setDraft(null)}
        >
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void act(async () => {
                if (draft.sourceId)
                  await request('reports/import', {
                    context: draft.context,
                    sourceId: draft.sourceId,
                    host: draft.host,
                    app: draft.app,
                    owner: draft.owner,
                    sharing: draft.sharing,
                  });
                else await request('reports', payload(draft));
                setNotice(
                  draft.sourceId
                    ? 'Report imported with scheduling off. Original data retained.'
                    : 'Report configuration saved and activated.',
                );
                setDraft(null);
              });
            }}
          >
            {error && (
              <p role="alert" className="error">
                {error}
              </p>
            )}
            <div className="v5-fields">
              <label>
                Title
                <input
                  required
                  disabled={!draft.create || !!draft.sourceId}
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                />
              </label>
              <label>
                Host
                <input disabled value={draft.host} />
              </label>
              <label>
                App
                <input
                  required
                  disabled={!draft.create}
                  value={draft.app}
                  onChange={(e) => setDraft({ ...draft, app: e.target.value })}
                />
              </label>
              <label>
                Owner
                <select
                  disabled={!draft.create}
                  value={draft.owner}
                  onChange={(e) => setDraft({ ...draft, owner: e.target.value })}
                >
                  <option>admin</option>
                  <option>analyst</option>
                  <option>operator</option>
                  <option>nobody</option>
                </select>
              </label>
              <label>
                Sharing
                <select
                  disabled={!draft.create}
                  value={draft.sharing}
                  onChange={(e) => setDraft({ ...draft, sharing: e.target.value as SavedReport['sharing'] })}
                >
                  <option>Private</option>
                  <option>App</option>
                  <option>Global</option>
                </select>
              </label>
            </div>
            <label className="v5-note">
              Search
              <textarea
                required
                readOnly={!!draft.sourceId}
                value={draft.search}
                onChange={(e) => setDraft({ ...draft, search: e.target.value })}
              />
            </label>
            {!draft.sourceId && (
              <>
                <label>
                  Description
                  <input
                    value={draft.description}
                    onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  />
                </label>
                <div className="v5-fields">
                  <label>
                    Earliest
                    <input
                      value={draft.earliest}
                      onChange={(e) => setDraft({ ...draft, earliest: e.target.value })}
                    />
                  </label>
                  <label>
                    Latest
                    <input
                      value={draft.latest}
                      onChange={(e) => setDraft({ ...draft, latest: e.target.value })}
                    />
                  </label>
                  <label>
                    UTC cron
                    <input
                      value={draft.cron}
                      onChange={(e) => setDraft({ ...draft, cron: e.target.value })}
                    />
                  </label>
                  <label>
                    Summary destination index (optional)
                    <input
                      value={draft.summaryIndex ?? ''}
                      onChange={(e) => setDraft({ ...draft, summaryIndex: e.target.value })}
                    />
                  </label>
                </div>
                <label>
                  <input
                    type="checkbox"
                    checked={draft.enabled}
                    onChange={(e) => setDraft({ ...draft, enabled: e.target.checked })}
                  />{' '}
                  Enabled
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={draft.scheduled}
                    onChange={(e) => setDraft({ ...draft, scheduled: e.target.checked })}
                  />{' '}
                  Run on this schedule
                </label>
                <p>
                  Use non-overlapping windows such as -5m@m to @m with */5 * * * *. The bounded executor
                  refuses overlapping summary writes for the same report.
                </p>
              </>
            )}
            <button type="submit" disabled={busy}>
              {busy ? 'Saving…' : draft.sourceId ? 'Import reviewed report' : 'Save Report'}
            </button>
            <button type="button" onClick={() => setDraft(null)}>
              Cancel
            </button>
          </form>
        </Modal>
      )}
    </main>
  );
}
