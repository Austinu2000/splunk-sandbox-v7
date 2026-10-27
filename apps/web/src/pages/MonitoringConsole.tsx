import { useMemo } from 'react';
import type { McPanelDto, McStatDto, McView, ResultValue } from '@sandbox/shared';
import { api } from '../api';
import { Chart } from '../components/Chart';
import { fmtClock } from '../format';
import { searchHash } from '../links';
import { usePoll } from '../usePoll';

export const MC_TABS: { view: McView; label: string; blurb: string }[] = [
  {
    view: 'indexing',
    label: 'Indexing performance',
    blurb: 'Parsing queue fill and indexing rate across the indexer cluster.',
  },
  {
    view: 'forwarders',
    label: 'Forwarders',
    blurb: 'Which universal forwarders are delivering data, and which are not.',
  },
  {
    view: 'license',
    label: 'License usage',
    blurb: 'Daily ingest against the license quota, by sourcetype.',
  },
  {
    view: 'scheduler',
    label: 'Scheduler activity',
    blurb: 'Scheduled search runs and skips on the search heads.',
  },
];

const TONE: Record<NonNullable<McStatDto['tone']>, string> = {
  ok: '#53a051',
  warn: '#f8be34',
  bad: '#dc4e41',
};
const SERIES = [
  '#1e93c6',
  '#f2b827',
  '#d6563c',
  '#6a5c9e',
  '#31a35f',
  '#ed8440',
  '#3863a0',
  '#a2cc3e',
  '#cc5068',
  '#73427f',
  '#11a88b',
  '#ea9600',
];

/** Seconds-since-epoch columns rendered as times. */
const TIME_COLUMNS = new Set(['_time', 'since', 'recentTime', 'lastTime']);

function fmtBytes(v: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  while (Math.abs(v) >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(v >= 100 || i === 0 ? 0 : 1)} ${units[i]}`;
}

function fmtCell(col: string, v: ResultValue): string {
  if (v === null || v === undefined) return '';
  if (Array.isArray(v)) return v.join(', ');
  if (TIME_COLUMNS.has(col) && typeof v === 'number') return fmtClock(v * 1000);
  if (typeof v === 'number') return v.toLocaleString('en-US', { maximumFractionDigits: 2 });
  return v;
}

function timechartOption(p: McPanelDto) {
  const series = p.columns.filter((c) => c !== '_time');
  const fmt = (v: number) =>
    p.unit === 'bytes'
      ? fmtBytes(v)
      : `${v.toLocaleString('en-US', { maximumFractionDigits: 1 })}${p.unit && p.unit !== 'bytes' ? ` ${p.unit}` : ''}`;
  return {
    animation: false,
    color: SERIES,
    tooltip: {
      trigger: 'axis',
      valueFormatter: (v: number) => (v === null || v === undefined ? '—' : fmt(v)),
    },
    legend: { bottom: 0, type: 'scroll', itemWidth: 12, itemHeight: 8, textStyle: { fontSize: 11 } },
    grid: { left: 8, right: 16, top: 12, bottom: 40, containLabel: true },
    xAxis: {
      type: 'time',
      axisLabel: {
        fontSize: 11,
        formatter: (ms: number) => {
          const d = new Date(ms);
          return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
        },
      },
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        fontSize: 11,
        formatter: (v: number) => (p.unit === 'bytes' ? fmtBytes(v) : v.toLocaleString('en-US')),
      },
    },
    series: series.map((s) => ({
      name: s,
      type: 'line',
      showSymbol: false,
      stack: p.chart === 'area' ? 'total' : undefined,
      areaStyle: p.chart === 'area' ? { opacity: 0.6 } : undefined,
      lineStyle: { width: p.chart === 'area' ? 0 : 1.5 },
      data: p.rows.map((r) => [
        Number(r._time) * 1000,
        r[s] === null || r[s] === undefined ? null : Number(r[s]),
      ]),
    })),
  };
}

function Panel({ p }: { p: McPanelDto }) {
  const option = useMemo(() => (p.chart === 'table' ? null : timechartOption(p)), [p]);
  return (
    <section className="panel">
      <div className="panel-head">
        <h2>{p.title}</h2>
        <a className="open-search" href={searchHash(p.search, p.earliest, p.latest)} title={p.search}>
          Open in Search ↗
        </a>
      </div>
      {p.messages.map((m, i) => (
        <div key={i} className={`notice ${m.type === 'warn' || m.type === 'error' ? 'warn' : ''}`}>
          {m.text}
        </div>
      ))}
      {p.rows.length === 0 ? (
        <div className="mc-empty">{p.empty ?? 'No results in this time range.'}</div>
      ) : option ? (
        <Chart option={option} height={240} />
      ) : (
        <div className="table-scroll mc-table">
          <table className="results">
            <thead>
              <tr>
                {p.columns.map((c) => (
                  <th key={c}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {p.rows.map((r, i) => (
                <tr key={i}>
                  {p.columns.map((c) => (
                    <td
                      key={c}
                      className={typeof r[c] === 'number' && !TIME_COLUMNS.has(c) ? 'num' : undefined}
                    >
                      {fmtCell(c, r[c] ?? null)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export function MonitoringConsole({ view }: { view: McView }) {
  const data = usePoll(() => api.monitoring(view), [view], 5000);
  const tab = MC_TABS.find((t) => t.view === view)!;
  const d = data.data?.view === view ? data.data : null;
  return (
    <main className="dashboard">
      <div className="dash-header">
        <h1>Monitoring Console</h1>
        <p className="subtitle">
          {tab.blurb} Panels are searches over the same data as Search &amp; Reporting.
        </p>
      </div>
      <nav className="tabs" aria-label="Monitoring Console views">
        {MC_TABS.map((t) => (
          <a
            key={t.view}
            href={`#/monitoring/${t.view}`}
            className={`tab-link ${t.view === view ? 'active' : ''}`}
          >
            {t.label}
          </a>
        ))}
      </nav>
      {data.error && <div className="error">Could not load this view: {data.error}</div>}
      {!d && !data.error && <div className="mc-empty">Running searches…</div>}
      {d && (
        <>
          <div className="tiles">
            {d.stats.map((s) => (
              <div
                key={s.label}
                className="tile static"
                style={{ borderTopColor: s.tone ? TONE[s.tone] : undefined }}
                title={s.hint}
              >
                <div className="tile-value mc-value">{s.value}</div>
                <div className="tile-label">{s.label}</div>
              </div>
            ))}
          </div>
          <div className="panel-row">
            {d.panels.map((p) => (
              <Panel key={p.id} p={p} />
            ))}
          </div>
          <p className="mc-updated">As of {fmtClock(d.generatedAt)} · refreshes every 5 seconds</p>
        </>
      )}
    </main>
  );
}
