import { useState } from 'react';
import type {
  SavedReport,
  ReportRun,
  PracticePrincipal,
  AlertConfiguration,
  AlertNotification,
} from '@sandbox/shared';
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
  notifications: AlertNotification[];
}
interface LegacyView {
  context: string;
  reports: {
    sourceId: string;
    kind: string;
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
  | 'alert'
> & { context: string; revision?: string; create: boolean; sourceId?: string; id?: string };
export function ReportsPage({ mode = 'reports' }: { mode?: 'reports' | 'alerts' | 'triggered' }) {
  const label = mode === 'reports' ? 'Report' : 'Alert';
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
    alert: mode === 'reports' ? undefined : defaultAlert(),
  });
  const fromReport = (report: SavedReport): Draft => ({ ...report, context: view!.context, create: false });
  const payload = (d: Draft) => ({
    context: d.context,
    id: d.id,
    alert: d.alert,
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
          <h1>{mode === 'triggered' ? 'Triggered Alerts' : mode === 'alerts' ? 'Alerts' : 'Reports'}</h1>
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
          New {label}
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
              .filter((r) => (mode === 'reports' ? !r.alert : !!r.alert))
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
                    {r.alert && (
                      <p>
                        {r.alert.type}{' '}
                        {r.alert.type === 'custom'
                          ? r.alert.condition
                          : r.alert.relation + ' ' + r.alert.threshold}
                        <br />
                        {r.alert.suppress ? 'Suppress for ' + r.alert.period : 'Suppression off'} ·{' '}
                        {r.alert.actions.join(', ') || 'Track only'}
                      </p>
                    )}
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
                              ? `Search ran successfully: ${run.resultCount} rows; ${run.alert ? `${run.alert.triggered} triggers, ${run.alert.suppressed} suppressed` : `${run.summaryEventIds.length} summary events written`}.`
                              : `Report ${run.status}: ${run.error}`,
                          );
                        })
                      }
                    >
                      {r.alert ? 'Test alert and local actions' : 'Run once'}
                      {r.summaryIndex ? ' and collect summary' : ''}
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
      {mode !== 'reports' && (
        <section className="v5-card">
          <h2>Triggered alerts</h2>
          <p>These are local simulation notifications. No email or webhook is sent.</p>
          <div className="v5-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Alert</th>
                  <th>Time</th>
                  <th>Severity</th>
                  <th>Results / actions</th>
                </tr>
              </thead>
              <tbody>
                {view?.notifications
                  .slice()
                  .reverse()
                  .map((n) => (
                    <tr key={n.id}>
                      <td>{n.title}</td>
                      <td>{new Date(n.time).toISOString()}</td>
                      <td>{n.severity}</td>
                      <td>
                        {n.resultCount} · {n.actions.join(', ') || 'Tracked'}
                        <details>
                          <summary>Provenance</summary>
                          <p>Run {n.runId}</p>
                        </details>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          {!view?.notifications.length && <p>No tracked alerts have fired in this environment.</p>}
        </section>
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
                              alert: run.alert,
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
        <h2>Legacy {label.toLowerCase()} drafts</h2>
        <p>
          Original V6 records remain recoverable. Review the target scope before importing a report. Imported
          schedules start off; enable them after checking the query and destination.
        </p>
        {[...new Set(legacy.data?.issues.map((issue) => issue.message) ?? [])].map((message) => (
          <p key={message}>{message}</p>
        ))}
        {legacy.data?.reports
          .filter((old) => (mode === 'reports' ? old.kind === 'report' : old.kind === 'alert'))
          .map((old) => (
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
                    owner: ['admin', 'analyst', 'operator', 'nobody'].includes(old.owner)
                      ? old.owner
                      : 'admin',
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
          title={draft.sourceId ? 'Review report import' : draft.create ? 'New ' + label : 'Edit ' + label}
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
                <select value={draft.owner} onChange={(e) => setDraft({ ...draft, owner: e.target.value })}>
                  <option>admin</option>
                  <option>analyst</option>
                  <option>operator</option>
                  <option>nobody</option>
                </select>
              </label>
              <label>
                Sharing
                <select
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
                {draft.alert && (
                  <AlertFields value={draft.alert} onChange={(alert) => setDraft({ ...draft, alert })} />
                )}
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
            {draft.sourceId && mode !== 'reports' && (
              <p>
                Imported alerts start with scheduling off, a count &gt; 0 condition and no actions. Review and
                configure them before enabling. Original conditions are retained in the archive.
              </p>
            )}
            <button type="submit" disabled={busy}>
              {busy ? 'Saving…' : draft.sourceId ? 'Import reviewed ' + label.toLowerCase() : 'Save ' + label}
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

function defaultAlert(): AlertConfiguration {
  return {
    type: 'number of events',
    relation: 'greater than',
    threshold: 0,
    condition: '',
    digest: true,
    suppress: false,
    period: '5m',
    fields: [],
    track: true,
    severity: 3,
    actions: ['notification'],
  };
}
function AlertFields({
  value: a,
  onChange,
}: {
  value: AlertConfiguration;
  onChange: (a: AlertConfiguration) => void;
}) {
  return (
    <fieldset>
      <legend>Alert trigger and actions</legend>
      <div className="v5-fields">
        <label>
          Trigger type
          <select
            value={a.type}
            onChange={(e) =>
              onChange({
                ...a,
                type: e.target.value as AlertConfiguration['type'],
                condition: e.target.value === 'custom' ? 'search count > 0' : '',
              })
            }
          >
            {['number of events', 'number of hosts', 'number of sources', 'custom', 'always'].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        {a.type !== 'custom' && a.type !== 'always' && (
          <>
            <label>
              Comparator
              <select
                value={a.relation}
                onChange={(e) =>
                  onChange({ ...a, relation: e.target.value as AlertConfiguration['relation'] })
                }
              >
                {['greater than', 'less than', 'equal to', 'not equal to'].map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </label>
            <label>
              Threshold
              <input
                type="number"
                min="0"
                value={a.threshold}
                onChange={(e) => onChange({ ...a, threshold: Number(e.target.value) })}
              />
            </label>
          </>
        )}
        {a.type === 'custom' && (
          <label>
            Result condition
            <input value={a.condition} onChange={(e) => onChange({ ...a, condition: e.target.value })} />
          </label>
        )}
        <label>
          Trigger mode
          <select
            value={a.digest ? 'digest' : 'result'}
            onChange={(e) => onChange({ ...a, digest: e.target.value === 'digest' })}
          >
            <option value="digest">Once per search</option>
            <option value="result">For each result</option>
          </select>
        </label>
        <label>
          Suppression period
          <input value={a.period} onChange={(e) => onChange({ ...a, period: e.target.value })} />
        </label>
        <label>
          Suppression fields (comma separated)
          <input
            value={a.fields.join(',')}
            onChange={(e) =>
              onChange({
                ...a,
                fields: e.target.value
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean),
              })
            }
          />
        </label>
        <label>
          Severity
          <input
            type="number"
            min="1"
            max="6"
            value={a.severity}
            onChange={(e) => onChange({ ...a, severity: Number(e.target.value) })}
          />
        </label>
      </div>
      <label>
        <input
          type="checkbox"
          checked={a.suppress}
          onChange={(e) => onChange({ ...a, suppress: e.target.checked })}
        />{' '}
        Suppress repeated triggers
      </label>
      <label>
        <input
          type="checkbox"
          checked={a.track}
          onChange={(e) => onChange({ ...a, track: e.target.checked })}
        />{' '}
        List in Triggered Alerts
      </label>
      {['notification', 'audit'].map((action) => (
        <label key={action}>
          <input
            type="checkbox"
            checked={a.actions.includes(action)}
            onChange={(e) =>
              onChange({
                ...a,
                actions: e.target.checked ? [...a.actions, action] : a.actions.filter((s) => s !== action),
              })
            }
          />{' '}
          Local {action}
        </label>
      ))}
      <p>
        Scheduled searches use UTC simulation time. Custom conditions filter the completed results with a
        single search predicate. Real-time continuous scheduling is a concept only here.
      </p>
    </fieldset>
  );
}
