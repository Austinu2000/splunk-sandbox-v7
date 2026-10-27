import { classicSource } from '@sandbox/shared';
import { SplEditor } from '../components/SplEditor';
import { profileStorage } from '../environment';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import type { PageDto, ResultValue, SearchEventDto, SearchJobDto } from '@sandbox/shared';
import { api } from '../api';
import {
  EventsList,
  FieldsSidebar,
  Pager,
  StatsTable,
  Timeline,
  Visualization,
} from '../components/SearchResults';
import { fmtEventTime, fmtInt } from '../format';
import { searchHash } from '../links';
import { recordSearchJob } from '../replica/knowledgeStore';
import { request } from './TrainingPage';
import '../replica/search.css';

type TimeRange = { label: string; earliest: string; latest: string; realtime?: boolean };
type HistoryEntry = { q: string; earliest: string; latest: string; time: number };
type Tab = 'events' | 'statistics' | 'visualization';
const HISTORY_KEY = 'splunk-v3-search-history';
const EVENTS_PAGE = 20;
const RESULTS_PAGE = 50;
const RECENT: TimeRange[] = [
  { label: 'Last 15 minutes', earliest: '-15m', latest: 'now' },
  { label: 'Last 60 minutes', earliest: '-60m', latest: 'now' },
  { label: 'Last 4 hours', earliest: '-4h', latest: 'now' },
  { label: 'Last 24 hours', earliest: '-24h', latest: 'now' },
  { label: 'Last 7 days', earliest: '-7d', latest: 'now' },
  { label: 'Last 30 days', earliest: '-30d', latest: 'now' },
];
const RELATIVE: TimeRange[] = [
  { label: 'Today', earliest: '@d', latest: 'now' },
  { label: 'Week to date', earliest: '@w0', latest: 'now' },
  { label: 'Business week to date', earliest: '@w1', latest: 'now' },
  { label: 'Month to date', earliest: '@mon', latest: 'now' },
  { label: 'Year to date', earliest: '@y', latest: 'now' },
  { label: 'Yesterday', earliest: '-1d@d', latest: '@d' },
  { label: 'Previous week', earliest: '-1w@w0', latest: '@w0' },
  { label: 'Previous business week', earliest: '-1w@w1', latest: '@w1-2d' },
  { label: 'Previous month', earliest: '-1mon@mon', latest: '@mon' },
  { label: 'Previous year', earliest: '-1y@y', latest: '@y' },
];
const REALTIME: TimeRange[] = [
  ['30 second window', '-30s'],
  ['1 minute window', '-1m'],
  ['5 minute window', '-5m'],
  ['30 minute window', '-30m'],
  ['1 hour window', '-1h'],
  ['All time (real-time)', '0'],
].map(([label, earliest]) => ({ label: label!, earliest: earliest!, latest: 'now', realtime: true }));
const ALL_TIME: TimeRange = { label: 'All time', earliest: '0', latest: 'now' };
const EXAMPLES = [
  'index=_internal source=*metrics.log group=queue blocked=true | stats dc(host) as blocked_forwarders by name',
  'index=_internal sourcetype=splunkd log_level=WARN | stats count by component | sort - count',
  '| metadata type=hosts index=_internal | eval minutes_silent=round((now()-lastTime)/60) | where minutes_silent > 5 | sort - minutes_silent',
  'index=app sourcetype=access_combined | timechart count by status',
  '| inputlookup forwarder_inventory | stats count by site, health',
  '| rest /services/server/info | table splunk_server version server_roles',
];

export function searchFromHash(): { q: string; earliest: string; latest: string } | null {
  const m = /^#\/search\??(.*)$/.exec(window.location.hash);
  if (!m) return null;
  const p = new URLSearchParams(m[1]);
  return { q: p.get('q') ?? '', earliest: p.get('earliest') ?? '-24h', latest: p.get('latest') ?? 'now' };
}
function rangeFor(earliest: string, latest: string): TimeRange {
  return (
    [...RECENT, ...RELATIVE, ALL_TIME].find((r) => r.earliest === earliest && r.latest === latest) ?? {
      label: 'Custom time',
      earliest,
      latest,
    }
  );
}
function quoteValue(v: string): string {
  return /^[\w.:/-]+$/.test(v) ? v : `"${v.replace(/"/g, '\\"')}"`;
}
function readHistory(): HistoryEntry[] {
  try {
    const value: unknown = JSON.parse(profileStorage.getItem(HISTORY_KEY) ?? '[]');
    return Array.isArray(value)
      ? value
          .filter(
            (v): v is HistoryEntry =>
              typeof v?.q === 'string' &&
              typeof v?.earliest === 'string' &&
              typeof v?.latest === 'string' &&
              typeof v?.time === 'number',
          )
          .slice(0, 100)
      : [];
  } catch {
    return [];
  }
}
function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  const closeButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeButton.current?.focus();
  }, []);
  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
    >
      <section
        className="modal search-modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <h2>{title}</h2>
          <button ref={closeButton} onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}

function TimePicker({
  value,
  onChange,
  onClose,
}: {
  value: TimeRange;
  onChange: (r: TimeRange) => void;
  onClose: () => void;
}) {
  const [section, setSection] = useState('Presets');
  const [earliest, setEarliest] = useState(value.earliest);
  const [latest, setLatest] = useState(value.latest);
  const [amount, setAmount] = useState('24');
  const [unit, setUnit] = useState('h');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [error, setError] = useState('');
  const picker = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const outside = (e: MouseEvent) => {
      if (
        picker.current &&
        !picker.current.contains(e.target as Node) &&
        !(e.target as Element).closest('.search-time-trigger')
      )
        onClose();
    };
    document.addEventListener('mousedown', outside);
    return () => document.removeEventListener('mousedown', outside);
  }, [onClose]);
  function apply() {
    setError('');
    if (section === 'Relative' || section === 'Real-time') {
      if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
        setError('Enter a positive time window.');
        return;
      }
      onChange({
        label: section === 'Real-time' ? `Real-time ${amount}${unit}` : `Last ${amount}${unit}`,
        earliest: `-${amount}${unit}`,
        latest: 'now',
        realtime: section === 'Real-time',
      });
    } else if (section === 'Date Range' || section === 'Date & Time Range') {
      const start = Date.parse(`${from}${section === 'Date Range' ? 'T00:00:00' : ':00'}Z`);
      const end = Date.parse(`${to}${section === 'Date Range' ? 'T00:00:00' : ':00'}Z`);
      if (!Number.isFinite(start) || !Number.isFinite(end) || start >= end) {
        setError('Choose an end time after the start time. Times are UTC.');
        return;
      }
      onChange({ label: 'Custom time', earliest: String(start / 1000), latest: String(end / 1000) });
    } else {
      if (!earliest.trim() || !latest.trim()) {
        setError('Enter both earliest and latest time.');
        return;
      }
      onChange({ label: 'Custom time', earliest: earliest.trim(), latest: latest.trim() });
    }
  }
  const links = (ranges: TimeRange[]) =>
    ranges.map((r) => (
      <button type="button" key={r.label} onClick={() => onChange(r)}>
        {r.label}
      </button>
    ));
  return (
    <div
      ref={picker}
      className="search-time-popover"
      role="dialog"
      aria-label="Select time range"
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
    >
      {['Presets', 'Relative', 'Real-time', 'Date Range', 'Date & Time Range', 'Advanced'].map((s) => (
        <div key={s}>
          <button
            type="button"
            className={`time-section ${section === s ? 'is-open' : ''}`}
            aria-expanded={section === s}
            onClick={() => {
              setSection(s);
              setError('');
            }}
          >
            <span>{section === s ? '⌄' : '›'}</span>
            {s}
          </button>
          {section === s &&
            (s === 'Presets' ? (
              <div className="time-presets">
                <div>
                  <h4>REAL-TIME</h4>
                  {links(REALTIME)}
                </div>
                <div>
                  <h4>RELATIVE</h4>
                  {links(RELATIVE)}
                </div>
                <div>
                  <h4>&nbsp;</h4>
                  {links(RECENT)}
                </div>
                <div>
                  <h4>OTHER</h4>
                  {links([ALL_TIME])}
                </div>
              </div>
            ) : (
              <div className="time-custom">
                {(s === 'Relative' || s === 'Real-time') && (
                  <>
                    <label>
                      Window
                      <input
                        type="number"
                        min="1"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                      />
                    </label>
                    <label>
                      Units
                      <select value={unit} onChange={(e) => setUnit(e.target.value)}>
                        {[
                          ['s', 'Seconds'],
                          ['m', 'Minutes'],
                          ['h', 'Hours'],
                          ['d', 'Days'],
                          ['w', 'Weeks'],
                        ].map(([v, l]) => (
                          <option value={v} key={v}>
                            {l}
                          </option>
                        ))}
                      </select>
                    </label>
                    {s === 'Real-time' && (
                      <p>Refreshes this search every 5 seconds using the simulation clock.</p>
                    )}
                  </>
                )}
                {(s === 'Date Range' || s === 'Date & Time Range') && (
                  <>
                    <label>
                      Between (UTC)
                      <input
                        type={s === 'Date Range' ? 'date' : 'datetime-local'}
                        value={from}
                        onChange={(e) => setFrom(e.target.value)}
                      />
                    </label>
                    <label>
                      And (UTC)
                      <input
                        type={s === 'Date Range' ? 'date' : 'datetime-local'}
                        value={to}
                        onChange={(e) => setTo(e.target.value)}
                      />
                    </label>
                  </>
                )}
                {s === 'Advanced' && (
                  <>
                    <label>
                      Earliest
                      <input
                        value={earliest}
                        onChange={(e) => setEarliest(e.target.value)}
                        placeholder="-24h@h"
                      />
                    </label>
                    <label>
                      Latest
                      <input value={latest} onChange={(e) => setLatest(e.target.value)} placeholder="now" />
                    </label>
                    <p>Relative modifiers, epoch seconds, or MM/DD/YYYY:HH:MM:SS. Time is UTC.</p>
                  </>
                )}
                {error && (
                  <p role="alert" className="search-error">
                    {error}
                  </p>
                )}
                <div className="time-actions">
                  <button type="button" onClick={onClose}>
                    Cancel
                  </button>
                  <button type="button" className="primary" onClick={apply}>
                    Apply
                  </button>
                </div>
              </div>
            ))}
        </div>
      ))}
    </div>
  );
}

function DataSummary({ onClose, onSearch }: { onClose: () => void; onSearch: (q: string) => void }) {
  const [kind, setKind] = useState('hosts');
  const [filter, setFilter] = useState('');
  const [data, setData] = useState<{ columns: string[]; rows: Record<string, ResultValue>[] } | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let live = true;
    setData(null);
    setError('');
    api
      .search({ search: `| metadata type=${kind}`, earliest: '0', latest: 'now' })
      .then(
        async (r) => {
          const page = await api.searchResults(r.job.sid, 0, 500);
          if (live) {
            setData({ columns: r.job.columns, rows: page.items });
            if (r.job.status === 'failed') setError(r.job.messages.map((m) => m.text).join(' '));
          }
        },
        (e: Error) => {
          if (live) setError(e.message);
        },
      )
      .catch((e: Error) => {
        if (live) setError(e.message);
      });
    return () => {
      live = false;
    };
  }, [kind]);
  const rows =
    data?.rows.filter((r) =>
      Object.values(r).some((v) => String(v).toLowerCase().includes(filter.toLowerCase())),
    ) ?? [];
  const field = kind === 'hosts' ? 'host' : kind === 'sources' ? 'source' : 'sourcetype';
  return (
    <Modal title="Data Summary" onClose={onClose}>
      <div className="tabs">
        {['hosts', 'sources', 'sourcetypes'].map((k) => (
          <button className={k === kind ? 'active' : ''} key={k} onClick={() => setKind(k)}>
            {k === 'sourcetypes' ? 'Sourcetypes' : k[0]!.toUpperCase() + k.slice(1)}
          </button>
        ))}
      </div>
      <input
        className="summary-filter"
        aria-label="Filter data summary"
        placeholder="Filter"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />
      <p className="search-muted">Metadata from the simulated world. Up to 500 entries are shown.</p>
      {error ? (
        <p role="alert" className="search-error">
          {error}
        </p>
      ) : !data ? (
        <p>Loading…</p>
      ) : (
        <div className="summary-table">
          <table className="results">
            <thead>
              <tr>
                <th>{field}</th>
                <th>Count</th>
                <th>Last event</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td>
                    <button
                      className="link-btn"
                      onClick={() => onSearch(`${field}=${quoteValue(String(r[field]))}`)}
                    >
                      {String(r[field])}
                    </button>
                  </td>
                  <td>{String(r.totalCount ?? '')}</td>
                  <td>
                    {typeof r.lastTime === 'number'
                      ? `${new Date(r.lastTime * 1000).toISOString().slice(0, 19).replace('T', ' ')} UTC`
                      : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && <p>No matching data.</p>}
        </div>
      )}
    </Modal>
  );
}

function JobInspector({ job, onClose }: { job: SearchJobDto; onClose: () => void }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-label="Search job inspector"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <h2>Search job inspector</h2>
          <button onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <p>
          This search has {job.status === 'done' ? 'completed' : 'failed'} and has returned{' '}
          <strong>{fmtInt(job.kind === 'events' ? job.eventCount : job.resultCount)}</strong>{' '}
          {job.kind === 'events' ? 'events' : 'results'} by scanning <strong>{fmtInt(job.scanCount)}</strong>{' '}
          events on <strong>{fmtInt(job.hostsScanned)}</strong> hosts in{' '}
          <strong>{(job.runMs / 1000).toFixed(3)}</strong> seconds.
        </p>
        {job.truncated && (
          <p className="warn-text">
            The scan stopped early at the sandbox's limit, so results may be incomplete.
          </p>
        )}
        <h3>Execution costs</h3>
        <table className="results">
          <thead>
            <tr>
              <th>Phase</th>
              <th className="num">Duration (s)</th>
              <th className="num">Output rows</th>
            </tr>
          </thead>
          <tbody>
            {job.phases.map((p, i) => (
              <tr key={i}>
                <td className="mono">{p.name}</td>
                <td className="num">{(p.ms / 1000).toFixed(3)}</td>
                <td className="num">{fmtInt(p.rows)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <h3>Search job properties</h3>
        <table className="results props">
          <tbody>
            {(
              [
                ['sid', job.sid],
                ['search', job.search],
                ['earliestTime', new Date(job.earliest).toISOString()],
                ['latestTime', new Date(job.latest).toISOString()],
                ['eventCount', fmtInt(job.eventCount)],
                ['resultCount', fmtInt(job.resultCount)],
                ['scanCount', fmtInt(job.scanCount)],
                ['isTransforming', String(job.kind === 'statistics')],
                ['deterministicWorkUnits', String(job.workUnits ?? 0)],
                ['runDuration', `${(job.runMs / 1000).toFixed(3)}s`],
              ] as [string, string][]
            ).map(([k, v]) => (
              <tr key={k}>
                <td className="mono">{k}</td>
                <td className="mono wrap">{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function SearchPage({ visible }: { visible: boolean }) {
  const initial = searchFromHash();
  const [query, setQuery] = useState(initial?.q ?? '');
  const [range, setRange] = useState<TimeRange>(() =>
    rangeFor(initial?.earliest ?? '-24h', initial?.latest ?? 'now'),
  );
  const [job, setJob] = useState<SearchJobDto | null>(null);
  const [events, setEvents] = useState<PageDto<SearchEventDto> | null>(null);
  const [results, setResults] = useState<PageDto<Record<string, ResultValue>> | null>(null);
  const [allResults, setAllResults] = useState<Record<string, ResultValue>[] | null>(null);
  const [tab, setTab] = useState<Tab>('events');
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inspect, setInspect] = useState(false);
  const [picker, setPicker] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>(readHistory);
  const [historyFilter, setHistoryFilter] = useState('');
  const [summary, setSummary] = useState(false);
  const [help, setHelp] = useState<'Documentation' | 'Tutorial' | 'Table Views' | null>(null);
  const [menu, setMenu] = useState<'sampling' | 'mode' | 'save' | 'job' | null>(null);
  const [sampling, setSampling] = useState(1);
  const [mode, setMode] = useState('Smart');
  const [saveType, setSaveType] = useState<'report' | 'alert' | 'dashboard' | null>(null);
  const [saveTitle, setSaveTitle] = useState('');
  const [saveDescription, setSaveDescription] = useState('');
  const [saveSharing, setSaveSharing] = useState<'Private' | 'App'>('Private');
  const [saveNotice, setSaveNotice] = useState('');
  const [reportScope, setReportScope] = useState<{ context: string; host: string } | null>(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    let active = true;
    setReportScope(null);
    if (saveType)
      void request<{ context: string; host: string }>('reports')
        .then((scope) => {
          if (active) setReportScope(scope);
        })
        .catch((e) => {
          if (active) setError(String(e));
        });
    return () => {
      active = false;
    };
  }, [saveType]);
  const [exporting, setExporting] = useState(false);
  const [notice, setNotice] = useState('');
  const [realtimePaused, setRealtimePaused] = useState(false);
  const historyPosition = useRef(-1);
  const lastHashRun = useRef<string | null>(null);
  const generation = useRef(0);
  const runningRef = useRef(false);
  const menuRoot = useRef<HTMLElement>(null);

  const run = useCallback(
    async (q: string, r: TimeRange = range, refresh = false) => {
      if (!q.trim()) return;
      const thisRun = ++generation.current;
      runningRef.current = true;
      setRunning(true);
      setError(null);
      setNotice('');
      setMenu(null);
      const hash = searchHash(q, r.earliest, r.latest);
      lastHashRun.current = hash;
      if (window.location.hash !== hash) window.history.replaceState(null, '', hash);
      try {
        const res = await api.search({ search: q, earliest: r.earliest, latest: r.latest });
        if (thisRun !== generation.current) return;
        setJob(res.job);
        setEvents({ ...res.events, items: res.events.items.slice(0, EVENTS_PAGE) });
        setResults(res.results);
        setAllResults(null);
        if (!refresh) setTab(res.job.kind === 'events' ? 'events' : 'statistics');
        recordSearchJob(res.job);
        if (!refresh) {
          const entries = [
            { q, earliest: r.earliest, latest: r.latest, time: res.job.latest },
            ...readHistory().filter((h) => h.q !== q || h.earliest !== r.earliest || h.latest !== r.latest),
          ].slice(0, 100);
          setHistory(entries);
          try {
            profileStorage.setItem(HISTORY_KEY, JSON.stringify(entries));
          } catch {
            /* History remains available in this view. */
          }
          historyPosition.current = -1;
        }
      } catch (e) {
        if (thisRun === generation.current) setError((e as Error).message);
      } finally {
        if (thisRun === generation.current) {
          setRunning(false);
          runningRef.current = false;
        }
      }
    },
    [range],
  );

  useEffect(() => {
    if (!visible) return;
    const update = () => {
      const h = searchFromHash();
      if (h?.q && window.location.hash !== lastHashRun.current) {
        const r = rangeFor(h.earliest, h.latest);
        setQuery(h.q);
        setRange(r);
        void run(h.q, r);
      } else if (h && !h.q && lastHashRun.current) {
        generation.current++;
        runningRef.current = false;
        setRunning(false);
        setQuery('');
        setJob(null);
        setError(null);
        lastHashRun.current = null;
      }
    };
    update();
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  }, [visible, run]);
  useEffect(() => {
    if (!visible || !range.realtime || realtimePaused || !query.trim() || !job) return;
    const timer = window.setInterval(() => {
      if (!runningRef.current) void run(job.search, range, true);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [visible, range, realtimePaused, query, job, run]);
  useEffect(() => {
    if (tab !== 'visualization' || !job || allResults) return;
    let active = true;
    api.searchResults(job.sid, 0, 500).then(
      (p) => {
        if (active) setAllResults(p.items);
      },
      () => {
        if (active) setAllResults([]);
      },
    );
    return () => {
      active = false;
    };
  }, [tab, job, allResults]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPicker(false);
        setMenu(null);
        setInspect(false);
        setSummary(false);
        setHelp(null);
        setSaveType(null);
      }
    };
    const onClick = (e: MouseEvent) => {
      if (!(e.target as Element).closest('.search-menu-anchor')) setMenu(null);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, []);

  const chooseRange = (r: TimeRange) => {
    setRange(r);
    setPicker(false);
    setRealtimePaused(false);
    if (query.trim()) void run(query, r);
  };
  const addTerm = (field: string, value: string) => {
    const pipe = query.indexOf('|');
    const term = `${field}=${quoteValue(value)}`;
    const next =
      pipe >= 0
        ? `${query.slice(0, pipe).trimEnd()} ${term} ${query.slice(pipe)}`
        : `${query.trimEnd()} ${term}`;
    setQuery(next);
    void run(next);
  };
  const useSearch = (q: string) => {
    setQuery(q);
    setSummary(false);
    setHelp(null);
    void run(q);
  };
  const stop = () => {
    generation.current++;
    runningRef.current = false;
    setRunning(false);
    setRealtimePaused(true);
    setNotice('Search stopped in this view. Work already submitted to the simulation may finish.');
  };
  const save = async () => {
    if (!saveType || !saveTitle.trim()) return;
    if (!reportScope) return;
    setSaving(true);
    try {
      if (saveType === 'dashboard') {
        await request('dashboards', {
          ...reportScope,
          app: 'search',
          owner: 'admin',
          sharing: saveSharing,
          name: 'dashboard_' + Date.now().toString(36),
          format: 'classic',
          source: classicSource(
            saveTitle.trim(),
            saveDescription,
            [],
            [
              {
                id: 'search_panel',
                title: saveTitle.trim(),
                search: query,
                type: tab === 'visualization' ? 'column' : 'table',
                earliest: range.earliest,
                latest: range.latest,
              },
            ],
          ),
          create: true,
        });
      } else {
        await request('reports', {
          ...reportScope,
          app: 'search',
          owner: 'admin',
          sharing: saveSharing,
          title: saveTitle.trim(),
          description: saveDescription,
          search: query,
          earliest: range.earliest,
          latest: range.latest,
          enabled: true,
          scheduled: false,
          create: true,
          ...(saveType === 'alert'
            ? {
                alert: {
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
                },
              }
            : {}),
        });
      }
      setSaveType(null);
      setSaveNotice(
        `${saveTitle.trim()} saved on ${reportScope.host}, app search. Open ${saveType === 'dashboard' ? 'Dashboards' : saveType === 'alert' ? 'Alerts' : 'Reports'} to configure and verify it.`,
      );
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  };

  async function exportResults(format: 'csv' | 'json') {
    if (!job) return;
    setExporting(true);
    setError(null);
    try {
      const page =
        job.kind === 'events'
          ? await api.searchEvents(job.sid, 0, 500)
          : await api.searchResults(job.sid, 0, 500);
      const rows: Record<string, unknown>[] = page.items.map((r) => ({ ...r }));
      const columns = job.kind === 'events' ? ['time', 'host', 'source', 'sourcetype', 'raw'] : job.columns;
      const escape = (v: unknown) =>
        `"${(typeof v === 'object' ? JSON.stringify(v) : String(v ?? '')).replace(/"/g, '""')}"`;
      const content =
        format === 'json'
          ? JSON.stringify(rows, null, 2)
          : [columns.join(','), ...rows.map((r) => columns.map((c) => escape(r[c])).join(','))].join('\r\n');
      const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `search-${job.sid}.${format}`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setNotice(
        `Exported ${rows.length} retained ${job.kind === 'events' ? 'events' : 'results'}${page.total > rows.length ? ` of ${page.total}; the export limit is 500` : ''}.`,
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setExporting(false);
      setMenu(null);
    }
  }
  const errors = job?.messages.filter((m) => m.type === 'error') ?? [];
  const notes = job?.messages.filter((m) => m.type !== 'error') ?? [];
  const [eDate, eTime] = job ? fmtEventTime(job.earliest / 1000) : ['', ''];
  const [lDate, lTime] = job ? fmtEventTime(job.latest / 1000) : ['', ''];
  const displayedEvents =
    events && sampling > 1
      ? { ...events, items: events.items.filter((_, i) => (events.offset + i) % sampling === 0) }
      : events;

  return (
    <main
      ref={menuRoot}
      className="search-page search-replica"
      style={{ display: visible ? undefined : 'none' }}
    >
      <div className="search-title-row">
        <h1 className="page-title">Search</h1>
        {job && (
          <div className="search-title-actions">
            <button
              className="link-btn"
              onClick={() => {
                window.location.hash = '#/search';
                setQuery('');
                setJob(null);
                setError(null);
              }}
            >
              New Search
            </button>
            <div className="search-menu-anchor">
              <button
                onClick={() => setMenu(menu === 'save' ? null : 'save')}
                aria-expanded={menu === 'save'}
              >
                Save As ▾
              </button>
              {menu === 'save' && (
                <div className="search-dropdown">
                  {(['report', 'alert', 'dashboard'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => {
                        setSaveType(t);
                        setSaveTitle('');
                        setSaveDescription('');
                        setMenu(null);
                      }}
                    >
                      {t === 'dashboard' ? 'Dashboard Panel' : t === 'report' ? 'Report' : 'Alert'}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <form
        className="search-bar"
        onSubmit={(e) => {
          e.preventDefault();
          void run(query);
        }}
      >
        <SplEditor
          value={query}
          onChange={setQuery}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void run(query);
            }
            if (e.ctrlKey && (e.key === 'p' || e.key === 'n')) {
              e.preventDefault();
              const next = Math.min(
                history.length - 1,
                Math.max(-1, historyPosition.current + (e.key === 'p' ? 1 : -1)),
              );
              historyPosition.current = next;
              setQuery(next < 0 ? '' : history[next]!.q);
            }
          }}
        />
        <button
          type="button"
          className="search-time-trigger"
          aria-label="Time range"
          aria-expanded={picker}
          onClick={() => setPicker(!picker)}
        >
          {range.label} ▾
        </button>
        <button className="search-go" type="submit" disabled={running} aria-label="Search Button">
          {running ? (
            '…'
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="10" cy="10" r="6.5" fill="none" stroke="currentColor" strokeWidth="2.5" />
              <path d="m15 15 6 6" stroke="currentColor" strokeWidth="2.5" />
            </svg>
          )}
        </button>
        {picker && <TimePicker value={range} onChange={chooseRange} onClose={() => setPicker(false)} />}
      </form>
      <div className="search-options">
        <div className="search-menu-anchor">
          <button
            onClick={() => setMenu(menu === 'sampling' ? null : 'sampling')}
            aria-expanded={menu === 'sampling'}
          >
            {sampling === 1 ? 'No Event Sampling' : `1 in ${sampling} Events`} ▾
          </button>
          {menu === 'sampling' && (
            <div className="search-dropdown sampling-dropdown">
              {[1, 10, 100, 1000].map((n) => (
                <button
                  key={n}
                  onClick={() => {
                    setSampling(n);
                    setMenu(null);
                  }}
                >
                  {n === 1 ? 'No Event Sampling' : `1 in ${n}`}
                  {n === sampling ? ' ✓' : ''}
                </button>
              ))}
              <p>Sampling filters displayed retained events; search statistics remain unsampled.</p>
            </div>
          )}
        </div>
        <div className="search-options-right">
          {range.realtime && job && (
            <button onClick={() => setRealtimePaused(!realtimePaused)}>
              {realtimePaused ? '▶ Resume' : 'Ⅱ Pause'}
            </button>
          )}
          <div className="search-menu-anchor">
            <button onClick={() => setMenu(menu === 'mode' ? null : 'mode')} aria-expanded={menu === 'mode'}>
              ⚲ {mode} Mode ▾
            </button>
            {menu === 'mode' && (
              <div className="search-dropdown search-mode-dropdown">
                {['Fast', 'Smart', 'Verbose'].map((m) => (
                  <button
                    key={m}
                    onClick={() => {
                      setMode(m);
                      setMenu(null);
                    }}
                  >
                    <strong>
                      {m} Mode{mode === m ? ' ✓' : ''}
                    </strong>
                    <small>
                      {m === 'Fast'
                        ? 'Show results without field discovery.'
                        : m === 'Smart'
                          ? 'Show common fields for event searches.'
                          : 'Show all fields returned by the simulation.'}
                    </small>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      {saveNotice && (
        <div className="search-notice" role="status">
          ✓ {saveNotice}
          <button aria-label="Dismiss" onClick={() => setSaveNotice('')}>
            ×
          </button>
        </div>
      )}
      {notice && (
        <div className="search-notice" role="status">
          {notice}
          <button aria-label="Dismiss" onClick={() => setNotice('')}>
            ×
          </button>
        </div>
      )}
      {error && (
        <div className="error" role="alert">
          Search failed: {error}
        </div>
      )}
      {!job && !running && !error && (
        <>
          <section className="search-history">
            <div className="search-history-heading">
              <button onClick={() => setHistoryOpen(!historyOpen)} aria-expanded={historyOpen}>
                {historyOpen ? '⌄' : '›'} &nbsp; Search History
              </button>
              <button
                className="search-history-info"
                aria-label="Search history keyboard shortcuts"
                title="Previous: CTRL + P · Next: CTRL + N"
                onClick={() =>
                  setNotice(
                    'Toggle through past searches in the search bar. Previous: CTRL + P. Next: CTRL + N.',
                  )
                }
              >
                ⓘ
              </button>
            </div>
            {historyOpen && (
              <div className="search-history-body">
                <div className="search-history-filter">
                  <input
                    aria-label="Filter search history"
                    placeholder="Filter search history"
                    value={historyFilter}
                    onChange={(e) => setHistoryFilter(e.target.value)}
                  />
                  <button
                    onClick={() => {
                      setHistory([]);
                      try {
                        profileStorage.removeItem(HISTORY_KEY);
                      } catch {
                        /* unavailable */
                      }
                    }}
                  >
                    Clear history
                  </button>
                </div>
                {history
                  .filter((h) => h.q.toLowerCase().includes(historyFilter.toLowerCase()))
                  .map((h, i) => (
                    <div className="search-history-item" key={`${h.q}-${i}`}>
                      <button
                        className="link-btn mono"
                        onClick={() => {
                          setQuery(h.q);
                          const r = rangeFor(h.earliest, h.latest);
                          setRange(r);
                          void run(h.q, r);
                        }}
                      >
                        {h.q}
                      </button>
                      <span>{rangeFor(h.earliest, h.latest).label}</span>
                    </div>
                  ))}
                {history.length === 0 && <p>No recent searches.</p>}
              </div>
            )}
          </section>
          <div className="search-welcome">
            <section>
              <h2>How to Search</h2>
              <p>
                If you are not familiar with the search features, or want to learn more, or see your available
                data, see one of the following resources.
              </p>
              <div className="search-resource-buttons">
                <button onClick={() => setHelp('Documentation')}>Documentation ↗</button>
                <button onClick={() => setHelp('Tutorial')}>Tutorial ↗</button>
                <button onClick={() => setSummary(true)}>Data Summary</button>
              </div>
            </section>
            <section>
              <h2>Analyze Your Data with Table Views</h2>
              <div className="search-table-view">
                <div>
                  <p>
                    <strong>Table Views</strong> let you prepare data without using SPL. First, use a
                    point-and-click interface to select data. Then, clean and transform it for analysis in
                    Analytics Workspace, Search, or Pivot!
                  </p>
                  <p>
                    <button className="link-btn" onClick={() => setHelp('Table Views')}>
                      Learn more ↗
                    </button>{' '}
                    about Table Views, or view and manage your Table Views with the{' '}
                    <a href="#/datasets">Datasets listing page.</a>
                  </p>
                </div>
                <a className="search-primary" href="#/datasets?create=1">
                  Create Table View
                </a>
              </div>
            </section>
          </div>
        </>
      )}
      {running && (
        <div className="job-status" role="status">
          <span className="search-spinner" /> Searching… <button onClick={stop}>Stop</button>
        </div>
      )}
      {job && !running && (
        <>
          <div className="job-status">
            <span className={job.status === 'done' ? 'ok' : 'bad'}>{job.status === 'done' ? '✓' : '✕'}</span>{' '}
            {fmtInt(job.eventCount)} events{' '}
            {job.kind === 'statistics' ? `(${fmtInt(job.resultCount)} results)` : ''} ({eDate} {eTime} to{' '}
            {lDate} {lTime})
            <div className="search-job-actions search-menu-anchor">
              <button onClick={() => setMenu(menu === 'job' ? null : 'job')}>Job ▾</button>
              {menu === 'job' && (
                <div className="search-dropdown">
                  <button
                    onClick={() => {
                      void request('search/jobs/' + encodeURIComponent(job.sid) + '/inspect', {})
                        .then(() => setInspect(true))
                        .catch((e) => setError(String(e)));
                      setMenu(null);
                    }}
                  >
                    Inspect Job
                  </button>
                  <button onClick={() => void run(query)}>Run Again</button>
                  <button onClick={() => void exportResults('csv')} disabled={exporting}>
                    Export CSV
                  </button>
                  <button onClick={() => void exportResults('json')} disabled={exporting}>
                    Export JSON
                  </button>
                </div>
              )}
            </div>
          </div>
          {errors.map((m, i) => (
            <div key={i} className="error" role="alert">
              {m.text}
            </div>
          ))}
          {notes.map((m, i) => (
            <div key={i} className={m.type === 'warn' ? 'notice warn' : 'notice'}>
              {m.text}
            </div>
          ))}
          {errors.length === 0 && (
            <>
              <div className="tabs" role="tablist" aria-label="Search results">
                {(['events', 'statistics', 'visualization'] as const).map((t) => (
                  <button
                    key={t}
                    role="tab"
                    aria-selected={tab === t}
                    className={tab === t ? 'active' : ''}
                    onClick={() => setTab(t)}
                  >
                    {t[0]!.toUpperCase() + t.slice(1)}
                    {t === 'events'
                      ? ` (${fmtInt(job.eventCount)})`
                      : t === 'statistics'
                        ? ` (${fmtInt(job.kind === 'statistics' ? job.resultCount : 0)})`
                        : ''}
                  </button>
                ))}
              </div>
              {tab === 'events' &&
                (job.kind === 'events' && events ? (
                  <div className={`events-layout ${mode === 'Fast' ? 'fast-mode' : ''}`}>
                    {mode !== 'Fast' && (
                      <FieldsSidebar job={job} onAdd={addTerm} showAll={mode === 'Verbose'} />
                    )}
                    <div className="events-main">
                      {job.timeline.length > 0 && <Timeline job={job} />}
                      <div className="table-meta">
                        <span>
                          {fmtInt(events.total)} events
                          {events.total < job.eventCount ? ` (first ${fmtInt(events.total)} kept)` : ''}
                          {sampling > 1 ? ` · Displaying 1 in ${sampling} retained events` : ''}
                        </span>
                        <Pager
                          page={events}
                          size={EVENTS_PAGE}
                          onPage={(o) =>
                            api
                              .searchEvents(job.sid, o, EVENTS_PAGE)
                              .then(setEvents)
                              .catch((e) => setError(String(e)))
                          }
                        />
                      </div>
                      {events.total === 0 ? (
                        <div className="empty-state">
                          No results found. Try a wider time range or fewer terms.
                        </div>
                      ) : (
                        <>
                          <EventsList page={displayedEvents!} onAddTerm={addTerm} />
                          {displayedEvents?.items.length === 0 && (
                            <p className="search-muted">
                              No events in this page's display sample. Choose No Event Sampling to see every
                              retained event.
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="empty-state">
                    This search uses transforming commands, so events are not shown.{' '}
                    {job.eventCount ? `It matched ${fmtInt(job.eventCount)} events.` : ''} See the Statistics
                    tab.
                  </div>
                ))}
              {tab === 'statistics' &&
                (job.kind === 'statistics' && results ? (
                  <div className="panel flat">
                    <div className="table-meta">
                      <span>{fmtInt(results.total)} results</span>
                      <Pager
                        page={results}
                        size={RESULTS_PAGE}
                        onPage={(o) =>
                          api
                            .searchResults(job.sid, o, RESULTS_PAGE)
                            .then(setResults)
                            .catch((e) => setError(String(e)))
                        }
                      />
                    </div>
                    {results.total === 0 ? (
                      <div className="empty-state">No results found.</div>
                    ) : (
                      <StatsTable columns={job.columns} page={results} />
                    )}
                  </div>
                ) : (
                  <div className="empty-state">
                    Your search isn&apos;t generating statistics. Add a transforming command such as{' '}
                    <code>| stats count by host</code> or <code>| table _time host source</code>.
                  </div>
                ))}
              {tab === 'visualization' &&
                (job.kind === 'statistics' ? (
                  <div className="panel flat">
                    {allResults ? (
                      <Visualization key={job.sid} columns={job.columns} rows={allResults} />
                    ) : (
                      'Loading…'
                    )}
                  </div>
                ) : (
                  <div className="empty-state">
                    Visualizations need a transforming search, e.g. <code>| timechart count</code>.
                  </div>
                ))}
            </>
          )}
        </>
      )}
      {inspect && job && <JobInspector job={job} onClose={() => setInspect(false)} />}
      {summary && <DataSummary onClose={() => setSummary(false)} onSearch={useSearch} />}
      {help && (
        <Modal
          title={help === 'Table Views' ? 'Table Views' : `${help}: Search`}
          onClose={() => setHelp(null)}
        >
          <p>
            Search the same simulated data used by Fleet Overview and the terminal. Enter an index and
            filters, then pipe the results into commands such as <code>stats</code>, <code>table</code>, and{' '}
            <code>timechart</code>.
          </p>
          {help === 'Table Views' ? (
            <>
              <p>Save a dataset with a search, then open it in Search or Analytics to explore its results.</p>
              <a className="search-primary" href="#/datasets" onClick={() => setHelp(null)}>
                Open Datasets
              </a>
            </>
          ) : (
            <>
              <h3>Try a search</h3>
              <div className="search-example-list">
                {EXAMPLES.map((q) => (
                  <button className="link-btn mono" key={q} onClick={() => useSearch(q)}>
                    {q}
                  </button>
                ))}
              </div>
              <p className="search-muted">
                These examples run locally. The simulation supports a subset of SPL; unsupported commands
                return a search error. Raw events are retained for 24 simulation hours and broad searches have
                a scan limit.
              </p>
            </>
          )}
        </Modal>
      )}
      {saveType && (
        <Modal
          title={
            saveType === 'report'
              ? 'Save As Report'
              : saveType === 'alert'
                ? 'Save As Alert'
                : 'Save Panel to New Dashboard'
          }
          onClose={() => setSaveType(null)}
        >
          <form
            className="search-save-form"
            onSubmit={(e) => {
              e.preventDefault();
              void save();
            }}
          >
            <label>
              Title
              <input required autoFocus value={saveTitle} onChange={(e) => setSaveTitle(e.target.value)} />
            </label>
            <label>
              Description
              <textarea value={saveDescription} onChange={(e) => setSaveDescription(e.target.value)} />
            </label>
            <label>
              Permissions
              <select
                value={saveSharing}
                onChange={(e) => setSaveSharing(e.target.value as 'Private' | 'App')}
              >
                <option>Private</option>
                <option>App</option>
              </select>
            </label>
            <p className="search-muted">
              {`Saved in this environment on ${reportScope?.host ?? 'the selected search head'}, app search, owner admin. Scheduling starts off.`}{' '}
              {saveType === 'alert'
                ? 'Configure its schedule and condition in Alerts. Actions create local simulation notifications.'
                : ''}
            </p>
            <div className="search-modal-actions">
              <button type="button" onClick={() => setSaveType(null)}>
                Cancel
              </button>
              <button className="primary" type="submit" disabled={saving || !reportScope}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </main>
  );
}
