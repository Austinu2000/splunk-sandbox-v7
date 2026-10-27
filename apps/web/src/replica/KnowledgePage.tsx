import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react';
import type { ResultValue } from '@sandbox/shared';
import { api } from '../api';
import { searchHash } from '../links';
import { usePoll } from '../usePoll';
import { Chart } from '../components/Chart';
import { StatsTable } from '../components/SearchResults';
import { AnalyticsPage } from './AnalyticsPage';
import { StudioPage } from './StudioPage';
import {
  addKnowledgeObject,
  deleteKnowledgeObject,
  knowledgeId,
  readKnowledge,
  recordKnowledgeVisit,
  recordSearchJob,
  REFERENCE_DATASETS,
  saveKnowledge,
  updateKnowledgeObject,
  useKnowledge,
  type DashboardPanel,
  type KnowledgeKind,
  type KnowledgeObject,
  type PanelType,
} from './knowledgeStore';
import './knowledge.css';

const TITLES: Record<string, string> = {
  reports: 'Reports',
  alerts: 'Alerts',
  dashboards: 'Dashboards',
  datasets: 'Datasets',
  jobs: 'Jobs',
  'triggered-alerts': 'Triggered Alerts',
};
const DESCRIPTIONS: Record<string, string> = {
  reports:
    'Reports are based on single searches and can include visualizations, statistics and/or events. Click the name to view the report. Open the report in Pivot or Search to refine the parameters or further explore the data.',
  alerts:
    'Alerts set a condition that triggers an action, such as sending an email that contains the results of the triggering search to a list of people. Click the name to view the alert. Open the alert in Search to refine the parameters.',
  dashboards:
    'Dashboards include searches, visualizations, and input controls that capture and present available data.',
  datasets:
    'Use the Datasets listing page to view and manage your existing datasets. Click a dataset name to view its contents. Select Explore > Visualize in Pivot to design a visualization-rich report based on the dataset. Select Explore > Investigate in Search to extend a dataset in Search and save it as a new report, alert, or dashboard panel.',
};
const ORIGINAL_DASHBOARDS: Record<string, string> = {
  integrity_check_of_installed_files: 'integrity_check_of_installed_files',
  job_details_dashboard: 'job_details_dashboard',
  jquery_upgrade: 'jquery_upgrade',
  orphaned_scheduled_searches_reports_and_alerts: 'orphaned_scheduled_searches',
};
export function knowledgeHref(item: KnowledgeObject): string {
  if (item.kind === 'dashboard')
    return ORIGINAL_DASHBOARDS[item.id] && !item.panels.length
      ? `#/view/search/${ORIGINAL_DASHBOARDS[item.id]}`
      : `#/dashboard/${item.id}`;
  return searchHash(item.search, item.earliest, item.latest);
}

export function KnowledgeModal({
  title,
  children,
  onClose,
  footer,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  footer?: ReactNode;
}) {
  const el = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    el.current?.querySelector<HTMLElement>('input, button, select, textarea')?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeRef.current();
      if (e.key === 'Tab') {
        const fields = [
          ...(el.current?.querySelectorAll<HTMLElement>(
            'button:not(:disabled), input, select, textarea, a[href]',
          ) ?? []),
        ];
        if (e.shiftKey && document.activeElement === fields[0]) {
          e.preventDefault();
          fields.at(-1)?.focus();
        } else if (!e.shiftKey && document.activeElement === fields.at(-1)) {
          e.preventDefault();
          fields[0]?.focus();
        }
      }
    };
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('keydown', key);
      previous?.focus();
    };
  }, []);
  return (
    <div
      className="kn-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="kn-modal" role="dialog" aria-modal="true" aria-label={title} ref={el}>
        <div className="kn-modal-head">
          <h2>{title}</h2>
          <button className="kn-close" onClick={onClose} aria-label="Close dialog">
            ×
          </button>
        </div>
        <div className="kn-modal-body">{children}</div>
        {footer && <div className="kn-modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

export function CreateDashboardDialog({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState('');
  const [id, setId] = useState('');
  const [editId, setEditId] = useState(false);
  const [description, setDescription] = useState('');
  const [sharing, setSharing] = useState<KnowledgeObject['sharing']>('Private');
  const [type, setType] = useState<KnowledgeObject['type']>('Classic');
  const [help, setHelp] = useState(false);
  const [error, setError] = useState('');
  const create = () => {
    const chosen = id || knowledgeId(title);
    if (!title.trim()) {
      setError('A dashboard title is required.');
      return;
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(chosen)) {
      setError('The ID may contain letters, numbers, underscores and hyphens.');
      return;
    }
    if (readKnowledge().objects.some((o) => o.id === chosen)) {
      setError('A dashboard with this ID already exists. Choose a different ID.');
      return;
    }
    const item = addKnowledgeObject({
      kind: 'dashboard',
      title: title.trim(),
      id: chosen,
      description,
      sharing,
      type,
    });
    onClose();
    window.location.hash = `#/dashboard/${item.id}?edit=1`;
  };
  return (
    <KnowledgeModal
      title="Create New Dashboard"
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose}>Cancel</button>
          <button className="kn-primary" onClick={create}>
            Create
          </button>
        </>
      }
    >
      <div className="kn-form-row">
        <label htmlFor="dashboard-title">Dashboard Title</label>
        <div>
          <input
            id="dashboard-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Required"
          />
          <button className="kn-link kn-edit-id" onClick={() => setEditId(!editId)}>
            ✎ Edit ID
          </button>
          {editId && (
            <input
              aria-label="Dashboard ID"
              value={id || knowledgeId(title)}
              onChange={(e) => setId(e.target.value)}
            />
          )}
        </div>
      </div>
      <div className="kn-form-row">
        <label htmlFor="dashboard-description">Description</label>
        <textarea
          id="dashboard-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional"
        />
      </div>
      <div className="kn-form-row">
        <label htmlFor="dashboard-permission">Permissions</label>
        <select
          id="dashboard-permission"
          value={sharing}
          onChange={(e) => setSharing(e.target.value as KnowledgeObject['sharing'])}
        >
          <option>Private</option>
          <option>App</option>
          <option>Global</option>
        </select>
      </div>
      <div className="kn-builder-question">
        How do you want to build your dashboard?<button onClick={() => setHelp(!help)}>What's this?</button>
      </div>
      {help && (
        <div className="kn-info">
          Classic dashboards arrange panels in rows. Dashboard Studio offers a visual layout and JSON source.
          Both editors here run searches against the sandbox and save locally.
        </div>
      )}
      <div className="kn-builders">
        {(['Classic', 'Dashboard Studio'] as const).map((t) => (
          <button
            key={t}
            aria-pressed={type === t}
            className={type === t ? 'selected' : ''}
            onClick={() => setType(t)}
          >
            <strong>{t === 'Classic' ? 'Classic Dashboards' : t}</strong>
            <span>
              {t === 'Classic'
                ? 'The traditional Splunk dashboard builder'
                : 'A new builder to create visually-rich, customizable dashboards'}
            </span>
          </button>
        ))}
      </div>
      {error && (
        <p className="kn-error" role="alert">
          {error}
        </p>
      )}
    </KnowledgeModal>
  );
}

type EditMode = 'details' | 'permissions' | 'clone' | 'delete' | 'schedule';
function EditObjectDialog({
  item,
  mode,
  onClose,
}: {
  item: KnowledgeObject;
  mode: EditMode;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState({
    ...item,
    title: mode === 'clone' ? `${item.title} Clone` : item.title,
  });
  const [error, setError] = useState('');
  const save = () => {
    if (!draft.title.trim()) {
      setError('A title is required.');
      return;
    }
    if (mode === 'delete') deleteKnowledgeObject(item.id);
    else if (mode === 'clone') addKnowledgeObject({ ...draft, id: knowledgeId(draft.title), owner: 'admin' });
    else updateKnowledgeObject(draft);
    onClose();
  };
  const title =
    mode === 'delete'
      ? 'Delete'
      : mode === 'permissions'
        ? 'Edit Permissions'
        : mode === 'clone'
          ? 'Clone'
          : mode === 'schedule'
            ? 'Edit Schedule'
            : 'Edit';
  return (
    <KnowledgeModal
      title={`${title}: ${item.title}`}
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose}>Cancel</button>
          <button className={mode === 'delete' ? 'kn-danger' : 'kn-primary'} onClick={save}>
            {mode === 'delete' ? 'Delete' : mode === 'clone' ? 'Clone' : 'Save'}
          </button>
        </>
      }
    >
      {mode === 'delete' ? (
        <p>Delete this {item.kind}? It will be removed from your local sandbox.</p>
      ) : mode === 'permissions' ? (
        <>
          <div className="kn-form-row">
            <label>Owner</label>
            <span>{draft.owner}</span>
          </div>
          <div className="kn-form-row">
            <label htmlFor="object-sharing">Display for</label>
            <select
              id="object-sharing"
              value={draft.sharing}
              onChange={(e) => setDraft({ ...draft, sharing: e.target.value as KnowledgeObject['sharing'] })}
            >
              <option>Private</option>
              <option>App</option>
              <option>Global</option>
            </select>
          </div>
          <p className="kn-muted">
            Visibility is stored for this local, single-user sandbox. It does not change access to the
            installed Splunk instance.
          </p>
        </>
      ) : mode === 'schedule' ? (
        <>
          <label className="kn-block-label">
            Cron Schedule
            <input
              value={draft.schedule ?? ''}
              placeholder="*/5 * * * *"
              onChange={(e) => setDraft({ ...draft, schedule: e.target.value })}
            />
          </label>
          <p className="kn-info">
            The schedule is saved as metadata. Automatic execution and external alert delivery are not
            available in this sandbox. Use Open in Search to run the query.
          </p>
        </>
      ) : (
        <>
          <label className="kn-block-label">
            Title
            <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
          </label>
          <label className="kn-block-label">
            Description
            <textarea
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            />
          </label>
          {item.kind !== 'dashboard' && (
            <label className="kn-block-label">
              Search
              <textarea
                className="kn-code"
                value={draft.search}
                onChange={(e) => setDraft({ ...draft, search: e.target.value })}
              />
            </label>
          )}
        </>
      )}
      {error && (
        <p className="kn-error" role="alert">
          {error}
        </p>
      )}
    </KnowledgeModal>
  );
}

function Listing({ section }: { section: string }) {
  const state = useKnowledge();
  const [filter, setFilter] = useState('');
  const [scope, setScope] = useState('All');
  const [sort, setSort] = useState('title');
  const [ascending, setAscending] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [menu, setMenu] = useState<string | null>(null);
  const [edit, setEdit] = useState<{ item: KnowledgeObject; mode: EditMode } | null>(null);
  const [create, setCreate] = useState(false);
  const [help, setHelp] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const kind = section.slice(0, -1) as KnowledgeKind;
  const items = state.objects
    .filter(
      (o) =>
        o.kind === kind &&
        (scope !== 'Yours' || o.owner === 'admin') &&
        (scope !== "This App's" || o.app === 'search') &&
        `${o.title} ${o.description}`.toLowerCase().includes(filter.toLowerCase()),
    )
    .sort(
      (a, b) =>
        String(a[sort as keyof KnowledgeObject]).localeCompare(String(b[sort as keyof KnowledgeObject])) *
        (ascending ? 1 : -1),
    );
  const columns = [
    'Title',
    'Actions',
    ...(section === 'reports' ? ['Next Scheduled Time'] : []),
    'Owner',
    'App',
    'Sharing',
    ...(section === 'dashboards' ? ['Type'] : section === 'alerts' ? ['Status'] : []),
  ];
  return (
    <section className="kn-page">
      <div className="kn-title-row">
        <h1>{TITLES[section]}</h1>
        {section === 'dashboards' && (
          <button className="kn-primary" onClick={() => setCreate(true)}>
            Create New Dashboard
          </button>
        )}
      </div>
      <p className="kn-description">{DESCRIPTIONS[section]}</p>
      {section === 'dashboards' && (
        <div className="kn-resources">
          <strong>Latest Resources</strong>
          <div>
            {[
              [
                '☆',
                'Examples for Dashboard Studio',
                'Browse examples of dashboards & visualizations.',
                'Visit Example Hub',
              ],
              [
                '▥',
                'Intro to Dashboard Studio',
                'Learn how to build dashboards with Dashboard Studio.',
                'Learn More',
              ],
              [
                '▥',
                'Intro to Classic Dashboards',
                'Learn how to build traditional Simple XML dashboards.',
                'Learn More',
              ],
            ].map(([icon, title, desc, link], i) => (
              <article key={title}>
                <strong>
                  <span>{icon}</span>
                  {title}
                </strong>
                <p>
                  {desc}{' '}
                  {i === 0 ? (
                    <a href="#/studio">{link} ↗</a>
                  ) : (
                    <button
                      className="kn-link"
                      onClick={() => setHelp(i === 1 ? 'Dashboard Studio' : 'Classic Dashboards')}
                    >
                      {link} ↗
                    </button>
                  )}
                </p>
              </article>
            ))}
          </div>
        </div>
      )}
      <div className="kn-list-toolbar">
        <span>
          {items.length} {TITLES[section]}
        </span>
        <div className="kn-scope" role="group" aria-label="Object scope">
          {['All', 'Yours', "This App's"].map((s) => (
            <button
              key={s}
              aria-pressed={scope === s}
              className={scope === s ? 'selected' : ''}
              onClick={() => {
                setScope(s);
                setPage(0);
              }}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="kn-filter">
          <input
            aria-label="Filter"
            placeholder="filter"
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setPage(0);
            }}
          />
          <span>⌕</span>
        </div>
      </div>
      <div className="kn-table-wrap">
        <table className="kn-table">
          <thead>
            <tr>
              <th className="kn-expand">i</th>
              {columns.map((c) => (
                <th key={c}>
                  {c === 'Actions' ? (
                    c
                  ) : (
                    <button
                      onClick={() => {
                        const field = c === 'Title' ? 'title' : c.toLowerCase();
                        setAscending(sort === field ? !ascending : true);
                        setSort(field);
                      }}
                    >
                      {c}{' '}
                      <span className="kn-sort">{sort === c.toLowerCase() && !ascending ? '▾' : '▴'}</span>
                    </button>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.slice(page * 20, page * 20 + 20).map((item) => (
              <Fragment key={item.id}>
                <tr>
                  <td>
                    <button
                      className="kn-expand-button"
                      aria-label={`Expand ${item.title}`}
                      aria-expanded={expanded === item.id}
                      onClick={() => setExpanded(expanded === item.id ? null : item.id)}
                    >
                      {expanded === item.id ? '⌄' : '›'}
                    </button>
                  </td>
                  <td className="kn-title-cell">
                    <a href={knowledgeHref(item)} onClick={() => recordKnowledgeVisit(item.id)}>
                      {item.title}
                    </a>
                  </td>
                  <td className="kn-actions">
                    {item.kind !== 'dashboard' && (
                      <a href={searchHash(item.search, item.earliest, item.latest)}>Open in Search</a>
                    )}
                    <span className="kn-menu-holder">
                      <button
                        className="kn-link"
                        aria-expanded={menu === item.id}
                        onClick={() => setMenu(menu === item.id ? null : item.id)}
                      >
                        Edit ▾
                      </button>
                      {menu === item.id && (
                        <div className="kn-menu" role="menu">
                          {item.kind === 'dashboard' && (
                            <a href={`#/dashboard/${item.id}?edit=1`} role="menuitem">
                              Edit dashboard
                            </a>
                          )}
                          {(['details', 'permissions', 'schedule', 'clone', 'delete'] as EditMode[])
                            .filter((m) => item.kind !== 'dashboard' || m !== 'schedule')
                            .map((m) => (
                              <button
                                role="menuitem"
                                key={m}
                                onClick={() => {
                                  setEdit({ item, mode: m });
                                  setMenu(null);
                                }}
                              >
                                {
                                  {
                                    details: 'Edit Title and Description',
                                    permissions: 'Edit Permissions',
                                    schedule: 'Edit Schedule',
                                    clone: 'Clone',
                                    delete: 'Delete',
                                  }[m]
                                }
                              </button>
                            ))}
                          {item.kind === 'alert' && (
                            <button
                              role="menuitem"
                              onClick={() => {
                                updateKnowledgeObject({ ...item, enabled: !item.enabled });
                                setMenu(null);
                              }}
                            >
                              {item.enabled ? 'Disable' : 'Enable'}
                            </button>
                          )}
                        </div>
                      )}
                    </span>
                  </td>
                  {section === 'reports' && <td>{item.schedule ? 'Manual execution only' : 'None'}</td>}
                  <td>{item.owner}</td>
                  <td>{item.app}</td>
                  <td>{item.sharing}</td>
                  {section === 'dashboards' && <td>{item.type}</td>}
                  {section === 'alerts' && <td>{item.enabled ? 'Enabled' : 'Disabled'}</td>}
                </tr>
                {expanded === item.id && (
                  <tr className="kn-expanded">
                    <td />
                    <td colSpan={columns.length}>
                      <dl>
                        <dt>Description</dt>
                        <dd>{item.description || 'None'}</dd>
                        <dt>ID</dt>
                        <dd>{item.id}</dd>
                        {item.search && (
                          <>
                            <dt>Search</dt>
                            <dd>
                              <code>{item.search}</code>
                            </dd>
                          </>
                        )}
                        <dt>Last updated</dt>
                        <dd>{new Date(item.updated).toLocaleString()}</dd>
                      </dl>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
      {items.length > 20 && (
        <div className="kn-pagination">
          <button disabled={!page} onClick={() => setPage(page - 1)}>
            ‹ Prev
          </button>
          <span>
            {page + 1} of {Math.ceil(items.length / 20)}
          </span>
          <button disabled={(page + 1) * 20 >= items.length} onClick={() => setPage(page + 1)}>
            Next ›
          </button>
        </div>
      )}
      {filter && !items.length && <p className="kn-empty">No results found. Try adjusting your filter.</p>}
      {create && <CreateDashboardDialog onClose={() => setCreate(false)} />}{' '}
      {edit && <EditObjectDialog {...edit} onClose={() => setEdit(null)} />}
      {help && (
        <KnowledgeModal
          title={help}
          onClose={() => setHelp(null)}
          footer={
            <button className="kn-primary" onClick={() => setHelp(null)}>
              Done
            </button>
          }
        >
          <p>
            Create a dashboard, then select Edit and Add Panel. Choose a visualization and enter an SPL
            search. The editor saves your dashboard locally and runs its searches against the same simulated
            world as Search & Reporting.
          </p>
          <p>
            Use Source to inspect and edit the dashboard definition. Save commits your draft; Cancel discards
            it.
          </p>
          <a href="#/studio" onClick={() => setHelp(null)}>
            Explore Dashboard Studio examples
          </a>
        </KnowledgeModal>
      )}
    </section>
  );
}

export function QueryPanel({
  panel,
  refresh = 0,
  earliest = '-15m',
  latest = 'now',
  stackMode,
}: {
  panel: DashboardPanel;
  refresh?: number;
  earliest?: string;
  latest?: string;
  stackMode?: 'stacked' | 'stacked100';
}) {
  const [result, setResult] = useState<Awaited<ReturnType<typeof api.search>> | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    api
      .search({ search: panel.search, earliest, latest })
      .then((r) => {
        if (!cancelled) {
          setResult(r);
          recordSearchJob(r.job);
        }
      })
      .catch((e) => {
        if (!cancelled) setError(String(e.message));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [panel.search, earliest, latest, refresh]);
  if (loading) return <div className="kn-panel-empty">Searching…</div>;
  if (error)
    return (
      <div className="kn-panel-empty kn-error" role="alert">
        {error}
      </div>
    );
  if (!result) return null;
  const rows = result.results.items;
  const columns = result.job.columns;
  const messages = result.job.messages.filter((m) => m.type !== 'info');
  if (result.job.status === 'failed')
    return (
      <div className="kn-panel-empty kn-error">
        {messages.map((m) => m.text).join(' ') || 'The search could not be completed.'}
      </div>
    );
  if (!rows.length)
    return (
      <div className="kn-panel-empty">
        No results found.<a href={searchHash(panel.search, earliest, latest)}>Open in Search ↗</a>
      </div>
    );
  if (panel.type === 'table') return <StatsTable columns={columns} page={result.results} />;
  const numeric = columns.filter((c) => c !== '_time' && rows.some((r) => typeof r[c] === 'number'));
  if (!numeric.length)
    return (
      <div className="kn-panel-empty">
        This visualization requires a numeric field.
        <a href={searchHash(panel.search, earliest, latest)}>Open in Search ↗</a>
      </div>
    );
  if (panel.type === 'single')
    return (
      <div className="kn-single">
        {Number(rows[0]?.[numeric[0]] ?? 0).toLocaleString()}
        <small>{numeric[0]}</small>
      </div>
    );
  const label = columns.includes('_time') ? '_time' : columns.find((c) => !numeric.includes(c));
  const labels = rows.map((r) =>
    label === '_time'
      ? new Date(Number(r._time) * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : label
        ? String(r[label] ?? '')
        : '',
  );
  const value = (r: Record<string, ResultValue>, c: string) =>
    stackMode === 'stacked100'
      ? (Number(r[c] ?? 0) /
          Math.max(
            1,
            numeric.reduce((sum, k) => sum + Number(r[k] ?? 0), 0),
          )) *
        100
      : Number(r[c] ?? 0);
  const category = {
    type: 'category',
    data: labels,
    axisLabel: { color: '#aab4bc', fontSize: 11 },
    axisLine: { lineStyle: { color: '#59616a' } },
  };
  const number = {
    type: 'value',
    max: stackMode === 'stacked100' ? 100 : undefined,
    axisLabel: { color: '#aab4bc', fontSize: 11 },
    splitLine: { lineStyle: { color: '#323940' } },
  };
  const option =
    panel.type === 'pie'
      ? {
          color: ['#1e93c6', '#f2b827', '#d6563c', '#6a5c9e', '#31a35f'],
          tooltip: { trigger: 'item' },
          series: [
            {
              type: 'pie',
              radius: ['25%', '70%'],
              data: rows.map((r, i) => ({ name: labels[i], value: value(r, numeric[0]) })),
            },
          ],
        }
      : {
          color: ['#1e93c6', '#f2b827', '#d6563c', '#6a5c9e', '#31a35f'],
          tooltip: { trigger: 'axis' },
          legend: { bottom: 0, textStyle: { color: '#b6c0c6' } },
          grid: { left: 48, right: 24, top: 16, bottom: 55 },
          xAxis: panel.type === 'bar' ? number : category,
          yAxis: panel.type === 'bar' ? category : number,
          series: numeric.map((c) => ({
            name: c,
            type: panel.type === 'line' || panel.type === 'area' ? 'line' : 'bar',
            areaStyle: panel.type === 'area' ? {} : undefined,
            stack: stackMode ? 'total' : undefined,
            data: rows.map((r) => value(r, c)),
          })),
        };
  return (
    <>
      <Chart option={option} height={300} />
      {result.job.truncated && (
        <p className="kn-muted">Search results were limited by the sandbox scan budget.</p>
      )}
    </>
  );
}

function Dashboard({ id }: { id: string }) {
  const state = useKnowledge();
  const saved = state.objects.find((o) => o.id === id && o.kind === 'dashboard');
  const [draft, setDraft] = useState<KnowledgeObject | undefined>(saved);
  const [editing, setEditing] = useState(window.location.hash.includes('edit=1'));
  const [source, setSource] = useState(false);
  const [sourceText, setSourceText] = useState('');
  const [error, setError] = useState('');
  const [panel, setPanel] = useState<DashboardPanel | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [range, setRange] = useState('-15m');
  const [exported, setExported] = useState(false);
  useEffect(() => {
    setDraft(saved);
    recordKnowledgeVisit(id);
  }, [id]); // Keep unsaved drafts stable while searches update job history.
  if (!saved || !draft)
    return (
      <section className="kn-page">
        <h1>Dashboard not found</h1>
        <a href="#/dashboards">Return to Dashboards</a>
      </section>
    );
  const current = editing ? draft : saved;
  const save = () => {
    let candidate = draft;
    if (source) {
      try {
        const parsed = JSON.parse(sourceText) as unknown;
        if (!parsed || typeof parsed !== 'object') throw new Error();
        const v = parsed as KnowledgeObject;
        if (
          typeof v.title !== 'string' ||
          !Array.isArray(v.panels) ||
          !v.panels.every(
            (p) =>
              typeof p.title === 'string' &&
              typeof p.search === 'string' &&
              ['column', 'bar', 'line', 'area', 'pie', 'single', 'table'].includes(p.type),
          )
        )
          throw new Error();
        candidate = {
          ...draft,
          title: v.title,
          description: v.description ?? '',
          panels: v.panels.map((p, i) => ({ ...p, id: p.id || `panel_${i + 1}` })),
        };
      } catch {
        setError('Invalid dashboard source. Use a title and panels with title, search and a supported type.');
        return;
      }
    }
    updateKnowledgeObject(candidate);
    setDraft(candidate);
    setEditing(false);
    setSource(false);
    setError('');
  };
  const addPanel = () =>
    setPanel({
      id: `panel_${current.panels.length + 1}`,
      title: 'New Panel',
      search: '| inputlookup forwarder_inventory | stats count by health',
      type: 'column',
    });
  const exportDashboard = () => {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(current, null, 2)], { type: 'application/json' }),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = `${current.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExported(true);
  };
  return (
    <section
      className={`kn-page kn-dashboard ${current.type === 'Dashboard Studio' ? 'kn-studio-editor' : ''}`}
    >
      <div className="kn-title-row">
        <div>
          <a className="kn-back-link" href="#/dashboards">
            ‹ Dashboards
          </a>
          <h1>{current.title}</h1>
        </div>
        <div className="kn-button-row">
          {editing ? (
            <>
              <button
                onClick={() => {
                  if (!source) setSourceText(JSON.stringify(draft, null, 2));
                  setSource(!source);
                }}
              >
                {source ? 'Visual Editor' : 'Source'}
              </button>
              <button onClick={addPanel}>＋ Add Panel</button>
              <button
                onClick={() => {
                  setDraft(saved);
                  setEditing(false);
                  setSource(false);
                }}
              >
                Cancel
              </button>
              <button className="kn-primary" onClick={save}>
                Save
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setRefresh(refresh + 1)}>↻ Refresh</button>
              <button onClick={exportDashboard}>Export</button>
              <button
                onClick={() => {
                  setDraft(saved);
                  setEditing(true);
                }}
              >
                Edit
              </button>
            </>
          )}
        </div>
      </div>
      <p>{current.description}</p>
      {exported && (
        <p className="kn-info" role="status">
          Dashboard definition downloaded.
        </p>
      )}
      <div className="kn-dashboard-toolbar">
        <label>
          Time range{' '}
          <select value={range} onChange={(e) => setRange(e.target.value)}>
            <option value="-15m">Last 15 minutes</option>
            <option value="-60m">Last 60 minutes</option>
            <option value="-4h">Last 4 hours</option>
            <option value="-24h">Last 24 hours</option>
          </select>
        </label>
      </div>
      {error && (
        <p className="kn-error" role="alert">
          {error}
        </p>
      )}
      {source ? (
        <label className="kn-source-label">
          Dashboard source
          <textarea
            aria-label="Dashboard source"
            className="kn-source"
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
          />
        </label>
      ) : (
        <div className="kn-dashboard-grid">
          {current.panels.map((p, i) => (
            <article className="kn-dashboard-panel" key={p.id}>
              <header>
                <h2>{p.title}</h2>
                <div>
                  {editing ? (
                    <>
                      <button
                        aria-label={`Move ${p.title} left`}
                        disabled={i === 0}
                        onClick={() => {
                          const panels = [...draft.panels];
                          [panels[i - 1], panels[i]] = [panels[i], panels[i - 1]];
                          setDraft({ ...draft, panels });
                        }}
                      >
                        ←
                      </button>
                      <button onClick={() => setPanel(p)}>Edit</button>
                      <button
                        aria-label={`Remove ${p.title}`}
                        onClick={() =>
                          setDraft({ ...draft, panels: draft.panels.filter((x) => x.id !== p.id) })
                        }
                      >
                        ×
                      </button>
                    </>
                  ) : (
                    <a href={searchHash(p.search, range)}>Open in Search ↗</a>
                  )}
                </div>
              </header>
              <QueryPanel panel={p} refresh={refresh} earliest={range} />
            </article>
          ))}
        </div>
      )}
      {!source && !current.panels.length && (
        <div className="kn-dashboard-empty">
          <div>▥</div>
          <h2>This dashboard has no panels.</h2>
          <p>Add a panel to visualize your data.</p>
          <button
            className="kn-primary"
            onClick={() => {
              setEditing(true);
              addPanel();
            }}
          >
            Add Panel
          </button>
        </div>
      )}
      {panel && (
        <KnowledgeModal
          title="Edit Panel"
          onClose={() => setPanel(null)}
          footer={
            <>
              <button onClick={() => setPanel(null)}>Cancel</button>
              <button
                className="kn-primary"
                disabled={!panel.title.trim() || !panel.search.trim()}
                onClick={() => {
                  setDraft({
                    ...draft,
                    panels: draft.panels.some((p) => p.id === panel.id)
                      ? draft.panels.map((p) => (p.id === panel.id ? panel : p))
                      : [...draft.panels, panel],
                  });
                  setPanel(null);
                }}
              >
                Apply
              </button>
            </>
          }
        >
          <label className="kn-block-label">
            Panel title
            <input value={panel.title} onChange={(e) => setPanel({ ...panel, title: e.target.value })} />
          </label>
          <label className="kn-block-label">
            Visualization
            <select
              value={panel.type}
              onChange={(e) => setPanel({ ...panel, type: e.target.value as PanelType })}
            >
              {['column', 'bar', 'line', 'area', 'pie', 'single', 'table'].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <label className="kn-block-label">
            Search
            <textarea
              className="kn-code"
              rows={5}
              value={panel.search}
              onChange={(e) => setPanel({ ...panel, search: e.target.value })}
            />
          </label>
        </KnowledgeModal>
      )}
    </section>
  );
}

function datasetSearch(id: string): string {
  if (id.includes('Audit')) return 'index=_audit | table _time host action info';
  if (id.includes('scheduler'))
    return 'index=_internal sourcetype=scheduler | table _time host savedsearch_name status';
  if (id.includes('metrics'))
    return 'index=_internal source=*metrics.log | table _time host group name current_size';
  if (id.includes('licens')) return 'index=_internal source=*license_usage.log | table _time host st b';
  if (id.startsWith('geo_')) return `| inputlookup ${id}`;
  return 'index=_internal | table _time host sourcetype component _raw';
}
function Datasets() {
  const state = useKnowledge();
  const [filter, setFilter] = useState('');
  const [scope, setScope] = useState("This App's");
  const [descending, setDescending] = useState(false);
  const [menu, setMenu] = useState<string | null>(null);
  const [help, setHelp] = useState(false);
  const [create, setCreate] = useState(window.location.hash.includes('create=1'));
  const [title, setTitle] = useState('');
  const [query, setQuery] = useState('| inputlookup forwarder_inventory | table hostname site health');
  const rows = [
    ...REFERENCE_DATASETS.map((d) => ({
      ...d,
      owner: 'nobody',
      sharing: 'App',
      search: datasetSearch(d.id),
    })),
    ...state.objects.filter((o) => o.kind === 'dataset').map((o) => ({ ...o, type: 'Table' })),
  ]
    .filter(
      (d) =>
        d.title.toLowerCase().includes(filter.toLowerCase()) && (scope !== 'Yours' || d.owner === 'admin'),
    )
    .sort((a, b) => a.title.localeCompare(b.title) * (descending ? -1 : 1));
  return (
    <section className="kn-page">
      <div className="kn-title-row">
        <h1>Datasets</h1>
        <button className="kn-primary" onClick={() => setCreate(true)}>
          Create Table View
        </button>
      </div>
      <p className="kn-description kn-wide">
        {DESCRIPTIONS.datasets}{' '}
        <button className="kn-link" onClick={() => setHelp(true)}>
          Learn more about Datasets. ↗
        </button>
      </p>
      <div className="kn-list-toolbar kn-dataset-toolbar">
        <input
          aria-label="Filter datasets"
          placeholder="Filter"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <select value={scope} onChange={(e) => setScope(e.target.value)}>
          <option>This App's</option>
          <option>All</option>
          <option>Yours</option>
        </select>
        <span>{rows.length} Datasets</span>
      </div>
      <table className="kn-table">
        <thead>
          <tr>
            {['i', 'Title', 'Dataset Type', 'Accelerated', 'Owner', 'App', 'Sharing', 'Actions'].map((c) => (
              <th key={c}>
                {c === 'Title' ? (
                  <button onClick={() => setDescending(!descending)}>Title {descending ? '▾' : '▴'}</button>
                ) : (
                  c
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((d) => (
            <tr key={d.id}>
              <td>›</td>
              <td>
                <a href={searchHash(d.search)}>{d.title}</a>
              </td>
              <td>{d.type}</td>
              <td>No</td>
              <td>{d.owner}</td>
              <td>search</td>
              <td>{d.sharing}</td>
              <td className="kn-menu-holder">
                <button className="kn-link" onClick={() => setMenu(menu === d.id ? null : d.id)}>
                  Explore ▾
                </button>
                {menu === d.id && (
                  <div className="kn-menu">
                    <a href={searchHash(d.search)}>Investigate in Search</a>
                    <a href="#/analytics">Visualize in Analytics</a>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {create && (
        <KnowledgeModal
          title="Create Table View"
          onClose={() => setCreate(false)}
          footer={
            <>
              <button onClick={() => setCreate(false)}>Cancel</button>
              <button
                className="kn-primary"
                disabled={!title.trim() || !query.trim()}
                onClick={() => {
                  addKnowledgeObject({ kind: 'dataset', title: title.trim(), search: query });
                  setCreate(false);
                  setTitle('');
                }}
              >
                Save
              </button>
            </>
          }
        >
          <label className="kn-block-label">
            Title
            <input value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label className="kn-block-label">
            Search
            <textarea className="kn-code" rows={5} value={query} onChange={(e) => setQuery(e.target.value)} />
          </label>
          <p className="kn-muted">
            Table views save an SPL query. Open the saved dataset to inspect its results.
          </p>
        </KnowledgeModal>
      )}
      {help && (
        <KnowledgeModal title="About Datasets" onClose={() => setHelp(false)}>
          <p>
            The reference catalog contains the 28 datasets visible in the installed app. Internal-log datasets
            open related searches against the simulated world. Geographic lookup files and full data-model
            Pivot are not available in the simulator; their searches show an unsupported lookup error instead
            of fabricated results.
          </p>
        </KnowledgeModal>
      )}
    </section>
  );
}

function Jobs() {
  const state = useKnowledge();
  const [filter, setFilter] = useState('');
  const [status, setStatus] = useState('All');
  const [owner, setOwner] = useState('All');
  const [app, setApp] = useState('All');
  const [size, setSize] = useState(10);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const rows = state.jobs.filter(
    (j) =>
      j.search.toLowerCase().includes(filter.toLowerCase()) &&
      (status === 'All' || j.status === status) &&
      (owner === 'All' || owner === 'admin') &&
      (app === 'All' || app === 'search'),
  );
  const remove = () => {
    saveKnowledge({ ...state, jobs: state.jobs.filter((j) => !selected.includes(j.sid)) });
    setSelected([]);
  };
  return (
    <section className="kn-page">
      <h1>Jobs</h1>
      <p>Manage your jobs.</p>
      <div className="kn-jobs-toolbar">
        <span>{rows.length} Jobs</span>
        <select
          aria-label="Application"
          value={app}
          onChange={(e) => {
            setApp(e.target.value);
            setPage(0);
          }}
        >
          <option value="All">App: All</option>
          <option value="search">Search & Reporting (search)</option>
          <option value="splunk-dashboard-studio">Splunk Dashboard Studio</option>
        </select>
        <select aria-label="Owner" value={owner} onChange={(e) => setOwner(e.target.value)}>
          <option>All</option>
          <option>admin</option>
        </select>
        <select aria-label="Job status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option>All</option>
          <option value="done">Done</option>
          <option value="failed">Failed</option>
        </select>
        <input
          aria-label="Filter jobs"
          placeholder="filter"
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value);
            setPage(0);
          }}
        />
        <select
          aria-label="Jobs per page"
          value={size}
          onChange={(e) => {
            setSize(Number(e.target.value));
            setPage(0);
          }}
        >
          {[10, 20, 50].map((n) => (
            <option key={n} value={n}>
              {n} Per Page
            </option>
          ))}
        </select>
        <button disabled={!selected.length} onClick={remove}>
          Delete Selected
        </button>
      </div>
      <table className="kn-table">
        <thead>
          <tr>
            <th>i</th>
            <th>
              <input
                type="checkbox"
                aria-label="Select all jobs"
                checked={rows.length > 0 && rows.every((j) => selected.includes(j.sid))}
                onChange={(e) => setSelected(e.target.checked ? rows.map((j) => j.sid) : [])}
              />
            </th>
            {[
              'Owner',
              'Application',
              'Events',
              'Size',
              'Created at',
              'Expires',
              'Runtime',
              'Status',
              'Actions',
            ].map((c) => (
              <th key={c}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(page * size, page * size + size).map((j) => (
            <Fragment key={j.sid}>
              <tr>
                <td>
                  <button
                    className="kn-expand-button"
                    aria-label="Expand job"
                    onClick={() => setExpanded(expanded === j.sid ? null : j.sid)}
                  >
                    {expanded === j.sid ? '⌄' : '›'}
                  </button>
                </td>
                <td>
                  <input
                    type="checkbox"
                    aria-label={`Select job ${j.sid}`}
                    checked={selected.includes(j.sid)}
                    onChange={(e) =>
                      setSelected(
                        e.target.checked ? [...selected, j.sid] : selected.filter((s) => s !== j.sid),
                      )
                    }
                  />
                </td>
                <td>admin</td>
                <td>search</td>
                <td>{j.eventCount.toLocaleString()}</td>
                <td>—</td>
                <td>{new Date(j.latest).toLocaleString()}</td>
                <td>Session</td>
                <td>{(j.runMs / 1000).toFixed(3)}s</td>
                <td>{j.status === 'done' ? 'Done' : 'Failed'}</td>
                <td>
                  <a href={searchHash(j.search, String(j.earliest / 1000), String(j.latest / 1000))}>
                    Open in Search
                  </a>
                </td>
              </tr>
              {expanded === j.sid && (
                <tr className="kn-expanded">
                  <td />
                  <td colSpan={10}>
                    <code>{j.search}</code>
                    <p>
                      Job ID: {j.sid} · {j.scanCount.toLocaleString()} events scanned
                    </p>
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
      {!rows.length && (
        <div className="kn-empty">
          <h2>There are no results that match the specified criteria.</h2>
          <button
            className="kn-link"
            onClick={() => {
              setFilter('');
              setStatus('All');
              setApp('All');
              setOwner('All');
            }}
          >
            Reload Page
          </button>
        </div>
      )}
      {rows.length > size && (
        <div className="kn-pagination">
          <button disabled={!page} onClick={() => setPage(page - 1)}>
            ‹ Prev
          </button>
          <span>{page + 1}</span>
          <button disabled={(page + 1) * size >= rows.length} onClick={() => setPage(page + 1)}>
            Next ›
          </button>
        </div>
      )}
    </section>
  );
}

function TriggeredAlerts() {
  const tickets = usePoll(() => api.tickets(), [], 5000);
  const [filter, setFilter] = useState('');
  const [severity, setSeverity] = useState('All');
  const [app, setApp] = useState('All');
  const [owner, setOwner] = useState('All');
  const [alertName, setAlertName] = useState('All');
  const rows = (tickets.data ?? []).filter(
    (t) =>
      t.symptomSeen &&
      t.title.toLowerCase().includes(filter.toLowerCase()) &&
      (severity === 'All' || t.urgency === severity) &&
      (alertName === 'All' || t.title === alertName) &&
      (app === 'All' || app === 'search') &&
      (owner === 'All' || owner === 'admin'),
  );
  return (
    <section className="kn-page">
      <h1>Triggered Alerts</h1>
      <div className="kn-alert-filters">
        <input
          aria-label="Filter triggered alerts"
          placeholder="Filter"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <label>
          App
          <select value={app} onChange={(e) => setApp(e.target.value)}>
            <option value="All">All apps</option>
            <option value="search">Search & Reporting (search)</option>
            <option value="studio">Splunk Dashboard Studio</option>
          </select>
        </label>
        <label>
          Owner
          <select value={owner} onChange={(e) => setOwner(e.target.value)}>
            <option value="All">All owners</option>
            <option>admin</option>
          </select>
        </label>
        <label>
          Severity
          <select value={severity} onChange={(e) => setSeverity(e.target.value)}>
            <option value="All">All severity</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </label>
        <label>
          Alert name
          <select value={alertName} onChange={(e) => setAlertName(e.target.value)}>
            <option value="All">All alerts</option>
            {[...new Set((tickets.data ?? []).map((t) => t.title))].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
      </div>
      <table className="kn-table">
        <thead>
          <tr>
            {['Time', 'Alert name', 'App', 'Type', 'Severity', 'Mode', 'Actions'].map((c) => (
              <th key={c}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((t) => (
            <tr key={t.id}>
              <td>{new Date(t.openedAt).toLocaleString()}</td>
              <td>
                <a href="#/tickets">{t.title}</a>
              </td>
              <td>search</td>
              <td>Incident</td>
              <td>{t.urgency}</td>
              <td>{t.status}</td>
              <td>
                <a href="#/tickets">View incident</a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {tickets.error && (
        <p role="alert" className="kn-error">
          {tickets.error}
        </p>
      )}
      {!rows.length && <p className="kn-empty">No triggered alerts found. Try adjusting your search.</p>}
    </section>
  );
}

export function KnowledgePage({ section, id }: { section: string; id?: string }) {
  if (section === 'studio') return <StudioPage id={id} />;
  if (section === 'analytics') return <AnalyticsPage />;
  if (section === 'dashboard') return <Dashboard key={id} id={id ?? ''} />;
  if (section === 'datasets') return <Datasets />;
  if (section === 'jobs') return <Jobs />;
  if (section === 'triggered-alerts') return <TriggeredAlerts />;
  return <Listing key={section} section={section} />;
}
