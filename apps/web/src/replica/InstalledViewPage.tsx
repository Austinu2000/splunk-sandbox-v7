import { useEffect, useMemo, useState } from 'react';
import type { ResultValue } from '@sandbox/shared';
import { api } from '../api';
import { Chart } from '../components/Chart';
import { searchHash } from '../links';
import { installedViews, type InstalledPanel } from './viewCatalog';
import { viewHref } from './navigation';

type Result = Awaited<ReturnType<typeof api.search>>;
function Panel({
  panel,
  tokens,
  revision,
}: {
  panel: InstalledPanel;
  tokens: Record<string, string>;
  revision: number;
}) {
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const query = useMemo(
    () => panel.query.replace(/\$([^$]+)\$/g, (_, key: string) => tokens[key] ?? `$${key}$`),
    [panel.query, tokens],
  );
  useEffect(() => {
    let active = true;
    setResult(null);
    setError('');
    if (!query || panel.base || /\$[\w.]+\$/.test(query)) return;
    setBusy(true);
    void api
      .search({ search: query, earliest: tokens['earliest'] || '-15m', latest: tokens['latest'] || 'now' })
      .then((r) => {
        if (active) setResult(r);
      })
      .catch((e) => {
        if (active) setError(String(e.message));
      })
      .finally(() => {
        if (active) setBusy(false);
      });
    return () => {
      active = false;
    };
  }, [query, panel.base, revision, tokens]);
  const columns = result?.results.items[0] ? Object.keys(result.results.items[0]) : [];
  const values: Record<string, ResultValue>[] = result?.results.items ?? [];
  const jobError = result?.job.messages
    ?.filter((m) => m.type === 'error')
    .map((m) => m.text)
    .join(' ');
  const chartType = panel.options['charting.chart'] ?? 'column';
  const option = useMemo(
    () => ({
      animation: false,
      backgroundColor: 'transparent',
      color: ['#1e93c6', '#f2b827', '#d6563c', '#6a5c9e'],
      tooltip: { trigger: 'axis' },
      grid: { left: 40, right: 15, bottom: 35, top: 15 },
      xAxis: {
        type: 'category',
        data: values.map((r) => String(r[columns[0]!] ?? '')),
        axisLabel: { color: '#b6bec6' },
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: '#b6bec6' },
        splitLine: { lineStyle: { color: '#30373d' } },
      },
      series: columns
        .slice(1)
        .map((c) => ({
          name: c,
          type: ['line', 'area'].includes(chartType) ? 'line' : 'bar',
          areaStyle: chartType === 'area' ? {} : undefined,
          data: values.map((r) => Number(r[c])),
        })),
    }),
    [columns, values, chartType],
  );
  return (
    <section className="installed-panel">
      <h2>{panel.title || 'Search results'}</h2>
      {panel.kind === 'html' ? (
        <div className="installed-empty">{panel.text.replace(/\s+/g, ' ').slice(0, 1500)}</div>
      ) : (
        <div className="panel-result">
          {busy ? (
            <div className="installed-empty">Running search…</div>
          ) : error || jobError ? (
            <div className="installed-empty">
              <span>ⓘ {error || jobError}</span>
              <small>This panel uses a search feature outside the sandbox engine.</small>
            </div>
          ) : panel.base ? (
            <div className="installed-empty">This panel depends on a base search from the installed app.</div>
          ) : /\$[\w.]+\$/.test(query) ? (
            <div className="installed-empty">Select values above to populate this panel.</div>
          ) : !query ? (
            <div className="installed-empty">No inline search is defined for this panel.</div>
          ) : !values.length && !result?.events.total ? (
            <div className="installed-empty">ⓘ No results found.</div>
          ) : panel.kind === 'single' ? (
            <div className="installed-single">
              {String(values[0]?.[columns[0]!] ?? result?.events.total ?? 'N/A')}
            </div>
          ) : panel.kind === 'chart' && columns.length > 1 ? (
            <Chart option={option} height={230} />
          ) : (
            <div style={{ overflow: 'auto', maxHeight: 300 }}>
              <table className="replica-table">
                <thead>
                  <tr>
                    {(columns.length ? columns : ['_time', 'host', '_raw']).map((c) => (
                      <th key={c}>{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(columns.length
                    ? values
                    : (result?.events.items.map((e) => ({
                        ...e.fields,
                        _time: e.time,
                        host: e.host,
                        _raw: e.raw,
                      })) ?? [])
                  )
                    .slice(0, 20)
                    .map((r, i) => (
                      <tr key={i}>
                        {(columns.length ? columns : ['_time', 'host', '_raw']).map((c) => (
                          <td key={c}>{String((r as Record<string, unknown>)[c] ?? '')}</td>
                        ))}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      {query && (
        <details>
          <summary>Search</summary>
          <pre>{query}</pre>
          <a href={searchHash(query, tokens.earliest || '-15m', tokens.latest || 'now')}>Open in Search ↗</a>
        </details>
      )}
    </section>
  );
}
export function InstalledViewPage({ app, id }: { app: string; id: string }) {
  const view = installedViews.find((v) => v.app === app && v.id === id);
  const [draft, setDraft] = useState<Record<string, string>>(() =>
    Object.fromEntries(view?.inputs.map((i) => [i.token, i.default]) ?? []),
  );
  const [tokens, setTokens] = useState(draft);
  const [revision, setRevision] = useState(0);
  const rows = Array.from(new Set(view?.panels.map((p) => p.row) ?? []));
  if (!view)
    return (
      <main className="replica-page" tabIndex={-1}>
        <h1>Page not found</h1>
        <p>This page is not present in the installed UI inventory.</p>
        <a href="#/catalog">Browse available views</a>
      </main>
    );
  return (
    <main className="replica-page installed-view" tabIndex={-1}>
      <div className="replica-toolbar" style={{ marginTop: 0 }}>
        <h1>{view.label}</h1>
        <span className="spacer" />
        <button onClick={() => setRevision(revision + 1)}>Refresh</button>
      </div>
      {view.description && <p className="page-lead">{view.description}</p>}
      {view.inputs.length > 0 && (
        <form
          className="installed-inputs"
          onSubmit={(e) => {
            e.preventDefault();
            setTokens({ ...draft });
            setRevision(revision + 1);
          }}
        >
          {view.inputs.map((i) => (
            <label key={i.token}>
              {i.label}
              {i.choices.length ? (
                <select
                  aria-label={i.label}
                  value={draft[i.token] ?? ''}
                  onChange={(e) => setDraft({ ...draft, [i.token]: e.target.value })}
                >
                  {i.choices.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              ) : i.type === 'time' ? (
                <select
                  aria-label={i.label}
                  value={draft.earliest || '-15m'}
                  onChange={(e) => setDraft({ ...draft, earliest: e.target.value, latest: 'now' })}
                >
                  <option value="-15m">Last 15 minutes</option>
                  <option value="-60m">Last 60 minutes</option>
                  <option value="-24h">Last 24 hours</option>
                </select>
              ) : (
                <input
                  aria-label={i.label}
                  value={draft[i.token] ?? ''}
                  placeholder={i.type === 'dropdown' ? 'Instance or group' : undefined}
                  onChange={(e) => setDraft({ ...draft, [i.token]: e.target.value })}
                />
              )}
            </label>
          ))}
          <button type="submit" className="replica-primary" style={{ alignSelf: 'end' }}>
            Submit
          </button>
        </form>
      )}
      {view.panels.length ? (
        rows.map((row) => (
          <div className="installed-row" key={row}>
            {view.panels
              .filter((p) => p.row === row)
              .map((p, i) => (
                <Panel key={i} panel={p} tokens={tokens} revision={revision} />
              ))}
          </div>
        ))
      ) : (
        <>
          <div className="replica-notice">
            This page’s content is supplied by its installed app. Its XML entry was inventoried, but its full
            interactive screen was not captured in the REA analysis.
          </div>
          <h2>Explore {app.replaceAll('_', ' ')}</h2>
          <div className="replica-catalog-group">
            {installedViews
              .filter((v) => v.app === app && v.id !== id)
              .map((v) => (
                <a key={v.id} href={viewHref(v.app, v.id)}>
                  {v.label}
                  <small>{v.id}</small>
                </a>
              ))}
          </div>
        </>
      )}
    </main>
  );
}
export function ViewCatalog() {
  const [q, setQ] = useState('');
  const [app, setApp] = useState(
    () => new URLSearchParams(window.location.hash.split('?')[1] ?? '').get('app') ?? '',
  );
  const views = installedViews.filter(
    (v) => (!app || v.app === app) && `${v.label} ${v.id}`.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <main className="replica-page" tabIndex={-1}>
      <h1>UI coverage</h1>
      <p className="page-lead">
        The reference contains 57 live captured states, 34 Settings destinations and 260 installed view
        definitions. Captured pages have dedicated interfaces. XML dashboards preserve their declared panels
        and inputs; searches use the local simulator. Compiled app screens and unsupported SPL remain
        explicitly identified.
      </p>
      <div className="replica-toolbar">
        <input
          aria-label="Filter views"
          type="search"
          placeholder="Filter views"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select aria-label="Filter by app" value={app} onChange={(e) => setApp(e.target.value)}>
          <option value="">All apps</option>
          {Array.from(new Set(installedViews.map((v) => v.app))).map((a) => (
            <option key={a}>{a}</option>
          ))}
        </select>
        <span>{views.length} views</span>
      </div>
      <div className="replica-catalog-group">
        {views.map((v) => (
          <a key={`${v.app}/${v.id}`} href={viewHref(v.app, v.id)}>
            {v.label}
            <small>
              {v.app} · {v.panels.length ? `${v.panels.length} declared panels` : 'App view'}
            </small>
          </a>
        ))}
      </div>
    </main>
  );
}
