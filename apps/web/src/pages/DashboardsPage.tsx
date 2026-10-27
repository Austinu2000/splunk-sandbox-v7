import { useState } from 'react';
import type {
  SavedDashboard,
  DashboardRender,
  DashboardInput,
  OperationalDashboardPanel,
  PracticePrincipal,
} from '@sandbox/shared';
import { classicSource, studioSource } from '@sandbox/shared';
import { usePoll } from '../usePoll';
import { request } from './TrainingPage';
import { Modal } from '../replica/Modal';
import { Chart } from '../components/Chart';
import { searchHash } from '../links';
interface View {
  context: string;
  host: string;
  hosts: string[];
  dashboards: SavedDashboard[];
  declared: SavedDashboard[];
  renders: DashboardRender[];
  legacy: {
    sourceId: string;
    title: string;
    app: string;
    owner: string;
    sharing: SavedDashboard['sharing'];
    status: string;
    imported: boolean;
  }[];
}
interface Draft {
  context: string;
  host: string;
  app: string;
  owner: string;
  sharing: SavedDashboard['sharing'];
  name: string;
  format: SavedDashboard['format'];
  source: string;
  title: string;
  description: string;
  panels: OperationalDashboardPanel[];
  inputs: DashboardInput[];
  id?: string;
  revision?: string;
  create: boolean;
  mode: 'builder' | 'source';
  inputsText: string;
}
const blankPanel = (n = 0): OperationalDashboardPanel => ({
  id: 'panel_' + n,
  title: 'Events by status',
  type: 'column',
  search: 'index=source_logs | stats count by status',
  earliest: '-15m',
  latest: 'now',
});
export function DashboardsPage() {
  const [host, setHost] = useState(''),
    [principal, setPrincipal] = useState<PracticePrincipal>('admin'),
    [selected, setSelected] = useState(''),
    [draft, setDraft] = useState<Draft | null>(null),
    [tokens, setTokens] = useState<Record<string, string>>({}),
    [render, setRender] = useState<DashboardRender | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [notice, setNotice] = useState('');
  const data = usePoll(
      () => request<View>('dashboards?host=' + encodeURIComponent(host) + '&principal=' + principal),
      [host, principal],
      5000,
    ),
    view = data.data,
    dashboard = view?.dashboards.find((d) => d.id === selected);
  const act = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError('');
    try {
      await fn();
      await data.refresh();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };
  const start = () =>
    setDraft({
      context: view!.context,
      host: view!.host,
      app: 'search',
      owner: principal,
      sharing: 'Private',
      name: '',
      format: 'classic',
      source: '',
      title: '',
      description: '',
      panels: [blankPanel()],
      inputs: [],
      create: true,
      mode: 'builder',
      inputsText: '[]',
    });
  const edit = (d: SavedDashboard, source = false) =>
    setDraft({
      ...d,
      context: view!.context,
      create: false,
      mode: source ? 'source' : 'builder',
      inputsText: JSON.stringify(d.inputs, null, 2),
    });
  const sourceFor = (d: Draft) =>
    d.mode === 'source'
      ? d.source
      : d.format === 'classic'
        ? classicSource(d.title, d.description, JSON.parse(d.inputsText), d.panels)
        : studioSource(d.title, d.description, JSON.parse(d.inputsText), d.panels);
  const effectiveRender =
    render?.dashboardId === dashboard?.id &&
    render?.revision === dashboard?.revision &&
    render?.principal === principal
      ? render
      : undefined;
  return (
    <main className="v5">
      <header className="v5-heading">
        <div>
          <span className="v5-eyebrow">SEARCH & REPORTING</span>
          <h1>Dashboards</h1>
          <p>Build panels from searches and reports, then verify their actual results.</p>
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
          Search head
          <select
            value={view?.host ?? host}
            onChange={(e) => {
              setHost(e.target.value);
              setSelected('');
              setRender(null);
            }}
          >
            {view?.hosts.map((h) => (
              <option key={h}>{h}</option>
            ))}
          </select>
        </label>
        <label>
          Practice principal
          <select
            value={principal}
            onChange={(e) => {
              setPrincipal(e.target.value as PracticePrincipal);
              setRender(null);
            }}
          >
            {['admin', 'analyst', 'operator'].map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </label>
        <button disabled={!view || busy} onClick={start}>
          Create Dashboard
        </button>
        <button
          disabled={!view || busy || principal !== 'admin'}
          onClick={() =>
            void act(async () => {
              await request('dashboards/reload', { context: view!.context, host: view!.host, principal });
              setNotice('View configuration reloaded. Review any source issues.');
            })
          }
        >
          Reload views
        </button>
      </div>
      <p>
        Classic XML and Studio JSON are saved as native view files. File edits need reload or restart. Panels
        run with the viewing principal’s index permissions. Supported source is bounded to search panels and
        text/dropdown inputs; unsupported elements are reported.
      </p>
      <div className="v5-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Dashboard</th>
              <th>Scope</th>
              <th>Source</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {view?.dashboards.map((d) => (
              <tr key={d.id}>
                <td>
                  <button
                    onClick={() => {
                      setSelected(d.id);
                      setTokens(Object.fromEntries(d.inputs.map((i) => [i.token, i.defaultValue])));
                      setRender(null);
                    }}
                  >
                    {d.title}
                  </button>
                  <p>{d.description}</p>
                </td>
                <td>
                  {d.host} · {d.app}
                  <br />
                  {d.owner} · {d.sharing}
                </td>
                <td>
                  {d.format === 'classic' ? 'Classic' : 'Dashboard Studio'}
                  <details>
                    <summary>Inspect definition</summary>
                    <p>{d.sourcePath}</p>
                    <p>Revision: {d.revision}</p>
                    <pre>{d.source}</pre>
                  </details>
                  {d.issues.map((i) => (
                    <p role="alert" key={i}>
                      {i}
                    </p>
                  ))}
                </td>
                <td>
                  <button disabled={busy || !!d.issues.length} onClick={() => edit(d)}>
                    Edit panels
                  </button>
                  <button disabled={busy} onClick={() => edit(d, true)}>
                    Edit source / permissions
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {view?.declared.some(
        (d) => !view.dashboards.some((active) => active.id === d.id && active.revision === d.revision),
      ) && (
        <p className="v5-banner">
          Disk views differ from active dashboards. Review files and reload to activate them.
        </p>
      )}
      {dashboard && (
        <section className="v5-card">
          <h2>{dashboard.title}</h2>
          <p>{dashboard.description}</p>
          <div className="v5-toolbar">
            {dashboard.inputs.map((i) => (
              <label key={i.token}>
                {i.label}
                {i.type === 'dropdown' ? (
                  <select
                    value={tokens[i.token] ?? i.defaultValue}
                    onChange={(e) => {
                      setTokens({ ...tokens, [i.token]: e.target.value });
                      setRender(null);
                    }}
                  >
                    {i.choices.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    value={tokens[i.token] ?? i.defaultValue}
                    onChange={(e) => {
                      setTokens({ ...tokens, [i.token]: e.target.value });
                      setRender(null);
                    }}
                  />
                )}
              </label>
            ))}
            <button
              disabled={busy || !!dashboard.issues.length}
              onClick={() =>
                void act(async () =>
                  setRender(
                    await request<DashboardRender>('dashboards/render', {
                      context: view!.context,
                      id: dashboard.id,
                      revision: dashboard.revision,
                      tokens,
                      principal,
                    }),
                  ),
                )
              }
            >
              Run dashboard searches
            </button>
          </div>
          {effectiveRender && (
            <p>Results from tick {effectiveRender.tick}; refresh after changing inputs or source.</p>
          )}
          <div className="v7-dashboard-panels">
            {dashboard.panels.map((p) => {
              const result = effectiveRender?.panels.find((r) => r.id === p.id);
              return (
                <article className="v5-card" key={p.id}>
                  <h3>{p.title}</h3>
                  {!result ? (
                    <p>Run searches to view results.</p>
                  ) : result.status === 'failed' ? (
                    <p role="alert">{result.error}</p>
                  ) : (
                    <DashboardVisualization type={p.type} rows={result.rows} />
                  )}
                  <details>
                    <summary>Search and results evidence</summary>
                    <pre>{result?.search ?? p.search ?? 'Report: ' + p.report}</pre>
                    {result && (
                      <>
                        <a href={searchHash(result.search, p.earliest, p.latest)}>Verify in Search ↗</a>
                        <pre>
                          {JSON.stringify(
                            {
                              revision: effectiveRender?.revision,
                              principal,
                              rows: result.rows,
                              workUnits: result.workUnits,
                            },
                            null,
                            2,
                          )}
                        </pre>
                      </>
                    )}
                  </details>
                </article>
              );
            })}
          </div>
        </section>
      )}
      <section className="v5-card">
        <h2>Legacy dashboard drafts</h2>
        <p>
          Review an import into the selected search head. Original records are archived; unsupported or empty
          panels need source repair first.
        </p>
        {view?.legacy.map((old) => (
          <p key={old.sourceId}>
            {old.title} · {old.app} · {old.sharing}{' '}
            <button
              disabled={busy || principal !== 'admin' || old.imported || old.status === 'conflict'}
              onClick={() =>
                void act(async () => {
                  await request('dashboards/import', {
                    context: view!.context,
                    sourceId: old.sourceId,
                    host: view!.host,
                    app: old.app,
                    owner: ['admin', 'analyst', 'operator', 'nobody'].includes(old.owner)
                      ? old.owner
                      : 'admin',
                    sharing: old.sharing,
                    principal,
                  });
                  setNotice('Dashboard imported; original source retained.');
                })
              }
            >
              {old.imported ? 'Imported' : 'Import reviewed scope'}
            </button>
          </p>
        ))}
      </section>
      {draft && (
        <Modal title={draft.create ? 'Create Dashboard' : 'Edit Dashboard'} onClose={() => setDraft(null)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void act(async () => {
                await request('dashboards', {
                  context: draft.context,
                  host: draft.host,
                  app: draft.app,
                  owner: draft.owner,
                  sharing: draft.sharing,
                  name: draft.name,
                  format: draft.format,
                  source: sourceFor(draft),
                  id: draft.id,
                  revision: draft.revision,
                  create: draft.create,
                  principal,
                });
                setDraft(null);
                setNotice('Dashboard saved and activated. Run its searches to verify results.');
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
                View ID
                <input
                  required
                  disabled={!draft.create}
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                />
              </label>
              <label>
                App
                <input
                  required
                  value={draft.app}
                  onChange={(e) => setDraft({ ...draft, app: e.target.value })}
                />
              </label>
              <label>
                Owner
                <select value={draft.owner} onChange={(e) => setDraft({ ...draft, owner: e.target.value })}>
                  {['admin', 'analyst', 'operator', 'nobody'].map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </label>
              <label>
                Sharing
                <select
                  value={draft.sharing}
                  onChange={(e) =>
                    setDraft({ ...draft, sharing: e.target.value as SavedDashboard['sharing'] })
                  }
                >
                  {['Private', 'App', 'Global'].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
              <label>
                Dashboard type
                <select
                  disabled={!draft.create}
                  value={draft.format}
                  onChange={(e) => setDraft({ ...draft, format: e.target.value as SavedDashboard['format'] })}
                >
                  <option value="classic">Classic</option>
                  <option value="studio">Dashboard Studio</option>
                </select>
              </label>
            </div>
            <button
              type="button"
              onClick={() => {
                try {
                  setDraft({ ...draft, source: sourceFor(draft), mode: 'source' });
                } catch (e) {
                  setError(String(e));
                }
              }}
            >
              Source editor
            </button>
            {draft.mode === 'source' ? (
              <label className="v5-note">
                {draft.format === 'classic' ? 'Simple XML source' : 'Studio JSON source'}
                <textarea
                  required
                  style={{ minHeight: 350, fontFamily: 'monospace' }}
                  value={draft.source}
                  onChange={(e) => setDraft({ ...draft, source: e.target.value })}
                />
              </label>
            ) : (
              <>
                <label>
                  Title
                  <input
                    required
                    value={draft.title}
                    onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                  />
                </label>
                <label>
                  Description
                  <input
                    value={draft.description}
                    onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  />
                </label>
                {draft.panels.map((p, n) => (
                  <fieldset key={p.id}>
                    <legend>Panel {n + 1}</legend>
                    <div className="v5-fields">
                      <label>
                        Panel title
                        <input
                          value={p.title}
                          onChange={(e) =>
                            setDraft({
                              ...draft,
                              panels: draft.panels.map((q, i) =>
                                i === n ? { ...q, title: e.target.value } : q,
                              ),
                            })
                          }
                        />
                      </label>
                      <label>
                        Visualization
                        <select
                          value={p.type}
                          onChange={(e) =>
                            setDraft({
                              ...draft,
                              panels: draft.panels.map((q, i) =>
                                i === n
                                  ? { ...q, type: e.target.value as OperationalDashboardPanel['type'] }
                                  : q,
                              ),
                            })
                          }
                        >
                          {['column', 'bar', 'line', 'area', 'pie', 'single', 'table'].map((t) => (
                            <option key={t}>{t}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Earliest
                        <input
                          value={p.earliest}
                          onChange={(e) =>
                            setDraft({
                              ...draft,
                              panels: draft.panels.map((q, i) =>
                                i === n ? { ...q, earliest: e.target.value } : q,
                              ),
                            })
                          }
                        />
                      </label>
                      <label>
                        Latest
                        <input
                          value={p.latest}
                          onChange={(e) =>
                            setDraft({
                              ...draft,
                              panels: draft.panels.map((q, i) =>
                                i === n ? { ...q, latest: e.target.value } : q,
                              ),
                            })
                          }
                        />
                      </label>
                    </div>
                    <label className="v5-note">
                      SPL search
                      <textarea
                        value={p.search ?? ''}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            panels: draft.panels.map((q, i) =>
                              i === n ? { ...q, search: e.target.value, report: undefined } : q,
                            ),
                          })
                        }
                      />
                    </label>
                    {draft.format === 'classic' && (
                      <label>
                        Or saved report title
                        <input
                          value={p.report ?? ''}
                          onChange={(e) =>
                            setDraft({
                              ...draft,
                              panels: draft.panels.map((q, i) =>
                                i === n
                                  ? {
                                      ...q,
                                      report: e.target.value || undefined,
                                      search: e.target.value ? undefined : p.search,
                                    }
                                  : q,
                              ),
                            })
                          }
                        />
                      </label>
                    )}
                    <button
                      type="button"
                      disabled={draft.panels.length === 1}
                      onClick={() => setDraft({ ...draft, panels: draft.panels.filter((_, i) => i !== n) })}
                    >
                      Remove panel
                    </button>
                  </fieldset>
                ))}
                <button
                  type="button"
                  disabled={draft.panels.length >= 8}
                  onClick={() =>
                    setDraft({
                      ...draft,
                      panels: [
                        ...draft.panels,
                        blankPanel(
                          Math.max(-1, ...draft.panels.map((p) => Number(p.id.split('_').at(-1)) || 0)) + 1,
                        ),
                      ],
                    })
                  }
                >
                  Add panel
                </button>
                <DashboardInputEditor
                  value={draft.inputsText}
                  onChange={(inputsText) => setDraft({ ...draft, inputsText })}
                />
              </>
            )}
            <button type="submit" disabled={busy}>
              Save Dashboard
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
export function DashboardVisualization({
  type,
  rows,
}: {
  type: OperationalDashboardPanel['type'];
  rows: DashboardRender['panels'][number]['rows'];
}) {
  if (!rows.length) return <p>No results in this window.</p>;
  const columns = [...new Set(rows.flatMap((r) => Object.keys(r)))],
    numeric = columns.filter((k) => k !== '_time' && rows.some((r) => typeof r[k] === 'number'));
  if (type === 'table')
    return (
      <div className="v5-table-wrap">
        <table>
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 100).map((r, i) => (
              <tr key={i}>
                {columns.map((c) => (
                  <td key={c}>{String(r[c] ?? '')}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length > 100 && <p>Showing 100 of {rows.length} rows; inspect full evidence below.</p>}
      </div>
    );
  if (!numeric.length) return <p>No numeric result field; choose a table or a transforming search.</p>;
  if (type === 'single')
    return (
      <div className="kn-single">
        {Number(rows[0][numeric[0]]).toLocaleString()}
        <small>{numeric[0]}</small>
      </div>
    );
  const label = columns.find((k) => !numeric.includes(k)),
    labels = rows.map((r, i) => String(label ? (r[label] ?? '') : i + 1));
  const option =
    type === 'pie'
      ? {
          tooltip: { trigger: 'item', renderMode: 'richText' },
          series: [
            {
              type: 'pie',
              data: rows.map((r, i) => ({ name: labels[i], value: Number(r[numeric[0]] ?? 0) })),
            },
          ],
        }
      : {
          tooltip: { trigger: 'axis', renderMode: 'richText' },
          legend: { bottom: 0 },
          grid: { left: 60, right: 20, bottom: 50 },
          xAxis: { type: type === 'bar' ? 'value' : 'category', data: type === 'bar' ? undefined : labels },
          yAxis: { type: type === 'bar' ? 'category' : 'value', data: type === 'bar' ? labels : undefined },
          series: numeric.map((k) => ({
            name: k,
            type: type === 'line' || type === 'area' ? 'line' : 'bar',
            areaStyle: type === 'area' ? {} : undefined,
            data: rows.map((r) => Number(r[k] ?? 0)),
          })),
        };
  return <Chart option={option} height={260} />;
}

function DashboardInputEditor({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  let inputs: DashboardInput[] = [];
  try {
    const parsed = JSON.parse(value);
    if (
      Array.isArray(parsed) &&
      parsed.every(
        (i) =>
          i &&
          typeof i.token === 'string' &&
          typeof i.label === 'string' &&
          ['text', 'dropdown'].includes(i.type) &&
          typeof i.defaultValue === 'string' &&
          Array.isArray(i.choices) &&
          i.choices.every(
            (c: { label?: unknown; value?: unknown }) =>
              c && typeof c.label === 'string' && typeof c.value === 'string',
          ),
      )
    )
      inputs = parsed;
  } catch {
    /* Keep incomplete source editable. */
  }
  const update = (n: number, patch: Partial<DashboardInput>) =>
    onChange(
      JSON.stringify(
        inputs.map((i, index) => (index === n ? { ...i, ...patch } : i)),
        null,
        2,
      ),
    );
  return (
    <fieldset>
      <legend>Dashboard inputs</legend>
      {inputs.map((i, n) => (
        <fieldset key={n}>
          <legend>Input {n + 1}</legend>
          <div className="v5-fields">
            <label>
              Token
              <input value={i.token} onChange={(e) => update(n, { token: e.target.value })} />
            </label>
            <label>
              Label
              <input value={i.label} onChange={(e) => update(n, { label: e.target.value })} />
            </label>
            <label>
              Input type
              <select
                value={i.type}
                onChange={(e) => update(n, { type: e.target.value as DashboardInput['type'] })}
              >
                <option value="text">Text</option>
                <option value="dropdown">Dropdown</option>
              </select>
            </label>
            <label>
              Default value
              <input value={i.defaultValue} onChange={(e) => update(n, { defaultValue: e.target.value })} />
            </label>
          </div>
          {i.type === 'dropdown' && (
            <>
              <p>Dropdown choices</p>
              {i.choices.map((c, j) => (
                <div className="v5-fields" key={j}>
                  <label>
                    Choice label
                    <input
                      value={c.label}
                      onChange={(e) =>
                        update(n, {
                          choices: i.choices.map((v, k) => (k === j ? { ...v, label: e.target.value } : v)),
                        })
                      }
                    />
                  </label>
                  <label>
                    Choice value
                    <input
                      value={c.value}
                      onChange={(e) =>
                        update(n, {
                          choices: i.choices.map((v, k) => (k === j ? { ...v, value: e.target.value } : v)),
                        })
                      }
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => update(n, { choices: i.choices.filter((_, k) => k !== j) })}
                  >
                    Remove choice
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => update(n, { choices: [...i.choices, { label: '', value: '' }] })}
              >
                Add choice
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() =>
              onChange(
                JSON.stringify(
                  inputs.filter((_, k) => k !== n),
                  null,
                  2,
                ),
              )
            }
          >
            Remove input
          </button>
        </fieldset>
      ))}
      <button
        type="button"
        disabled={inputs.length >= 8}
        onClick={() =>
          onChange(
            JSON.stringify(
              [
                ...inputs,
                {
                  token: 'filter_' + inputs.length,
                  label: 'Filter',
                  type: 'text',
                  defaultValue: '',
                  choices: [],
                },
              ],
              null,
              2,
            ),
          )
        }
      >
        Add input
      </button>
      <p>
        Use $token|s$ in panel SPL to quote a text or dropdown value. Time ranges can be set on each panel.
      </p>
      <details>
        <summary>Edit input source</summary>
        <label className="v5-note">
          Input JSON
          <textarea value={value} onChange={(e) => onChange(e.target.value)} />
        </label>
      </details>
    </fieldset>
  );
}
