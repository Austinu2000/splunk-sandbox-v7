import { useState } from 'react';
import { api } from '../api';
import { usePoll } from '../usePoll';
import { KnowledgeModal, QueryPanel } from './KnowledgePage';
import { addKnowledgeObject, type DashboardPanel } from './knowledgeStore';

const SOURCES = [
  {
    id: 'health',
    name: 'Forwarder health',
    search: '| inputlookup forwarder_inventory | stats count by health',
    type: 'column',
  },
  {
    id: 'site',
    name: 'Forwarders by site',
    search: '| inputlookup forwarder_inventory | stats count by site',
    type: 'column',
  },
  {
    id: 'queue',
    name: 'Blocked queues',
    search: 'index=_internal source=*metrics.log group=queue blocked=true | timechart count',
    type: 'line',
  },
  {
    id: 'events',
    name: 'Events by log level',
    search: 'index=_internal sourcetype=splunkd | timechart count by log_level',
    type: 'line',
  },
  {
    id: 'requests',
    name: 'Application requests',
    search: 'index=app sourcetype=access_combined | timechart count by status',
    type: 'line',
  },
] as const;

export function AnalyticsPage() {
  const world = usePoll(() => api.world(), [], 10000);
  const [filter, setFilter] = useState('');
  const [tab, setTab] = useState('Metrics');
  const [panels, setPanels] = useState<DashboardPanel[]>([]);
  const [collapsed, setCollapsed] = useState(false);
  const [analysis, setAnalysis] = useState(true);
  const [grid, setGrid] = useState(false);
  const [range, setRange] = useState('-60m');
  const [refresh, setRefresh] = useState(0);
  const [split, setSplit] = useState(false);
  const [splitBy, setSplitBy] = useState('');
  const [save, setSave] = useState(false);
  const [title, setTitle] = useState('Analytics Dashboard');
  const [kind, setKind] = useState<'dashboard' | 'alert'>('dashboard');
  const [message, setMessage] = useState('');
  const [filterDialog, setFilterDialog] = useState(false);
  const [site, setSite] = useState('');
  const [discoveryRange, setDiscoveryRange] = useState('-15m');
  const add = (id: string) => {
    const s = SOURCES.find((s) => s.id === id);
    if (s && !panels.some((p) => p.id === id))
      setPanels([...panels, { id: s.id, title: s.name, search: s.search, type: s.type }]);
  };
  const splitQuery = (p: DashboardPanel) => {
    const query =
      splitBy && p.id === 'health'
        ? `| inputlookup forwarder_inventory | stats count by ${splitBy}, health`
        : p.search;
    return site && query.includes('inputlookup forwarder_inventory')
      ? query.replace(
          'inputlookup forwarder_inventory',
          `inputlookup forwarder_inventory | search site=${JSON.stringify(site)}`,
        )
      : query;
  };
  return (
    <section
      className={`kn-analytics ${collapsed ? 'kn-data-collapsed' : ''} ${!analysis ? 'kn-analysis-collapsed' : ''}`}
    >
      <aside className="kn-analytics-data">
        <header>
          <strong>Data</strong>
          <button
            aria-label={collapsed ? 'Expand Data' : 'Collapse Data'}
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? '»' : '«'}
          </button>
        </header>
        {!collapsed && (
          <>
            <input
              aria-label="Find Data to Analyze"
              placeholder="Find Data to Analyze"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
            <div className="kn-data-options">
              {['Metrics', 'Datasets', 'Alerts'].map((t) => (
                <div key={t}>
                  <button
                    className={`kn-data-tab ${tab === t ? 'active' : ''}`}
                    aria-expanded={tab === t}
                    onClick={() => setTab(tab === t ? '' : t)}
                  >
                    {tab === t ? '⌄' : '›'} {t}
                  </button>
                  {tab === t && (
                    <div className="kn-data-items">
                      {t === 'Metrics' ? (
                        <>
                          <button className="kn-link" onClick={() => setFilterDialog(true)}>
                            ＋ Add new filter
                          </button>
                          {site && (
                            <button className="kn-link" onClick={() => setSite('')}>
                              Site: {site} ×
                            </button>
                          )}
                          {SOURCES.filter((s) => s.name.toLowerCase().includes(filter.toLowerCase())).map(
                            (s) => (
                              <button className="kn-metric" key={s.id} onClick={() => add(s.id)}>
                                {s.name}
                                <span>＋</span>
                              </button>
                            ),
                          )}
                        </>
                      ) : t === 'Datasets' ? (
                        <>
                          <button className="kn-metric" onClick={() => add('health')}>
                            Forwarder inventory <span>＋</span>
                          </button>
                          <a href="#/datasets">View all datasets</a>
                        </>
                      ) : (
                        <a href="#/alerts">View saved alerts</a>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <footer>
              ⓘ Data ingested from{' '}
              <select
                aria-label="Data discovery time range"
                value={discoveryRange}
                onChange={(e) => {
                  setDiscoveryRange(e.target.value);
                  setRange(e.target.value);
                }}
              >
                <option value="-15m">Last 15 minutes</option>
                <option value="-60m">Last 60 minutes</option>
                <option value="-24h">Last 24 hours</option>
              </select>
              <p>Changing this time setting will affect performance</p>
            </footer>
          </>
        )}
      </aside>
      <main className="kn-analytics-main">
        <div className="kn-analytics-toolbar">
          <button
            aria-label="Zoom out"
            disabled={!panels.length}
            onClick={() => setRange(range === '-60m' ? '-4h' : '-24h')}
          >
            ↶
          </button>
          <select aria-label="Chart time range" value={range} onChange={(e) => setRange(e.target.value)}>
            <option value="-15m">Last 15 minutes</option>
            <option value="-60m">Last 1 hour</option>
            <option value="-4h">Last 4 hours</option>
            <option value="-24h">Last 24 hours</option>
          </select>
          <button disabled={!panels.length} onClick={() => setRefresh(refresh + 1)}>
            ↻ Refresh
          </button>
          <button onClick={() => setSplit(!split)}>⌘ Split By</button>
          <span className="kn-toolbar-space" />
          <button disabled={!panels.length} onClick={() => setPanels([])}>
            Clear all
          </button>
          <button aria-label="Grid Layout" aria-pressed={grid} onClick={() => setGrid(true)}>
            ▦
          </button>
          <button aria-label="Stack Layout" aria-pressed={!grid} onClick={() => setGrid(false)}>
            ☰
          </button>
          <button disabled={!panels.length} onClick={() => setSave(true)} aria-label="Global Actions">
            •••
          </button>
        </div>
        {split && (
          <div className="kn-split-bar">
            <label>
              Split forwarder data by{' '}
              <select value={splitBy} onChange={(e) => setSplitBy(e.target.value)}>
                <option value="">None</option>
                <option value="site">Site</option>
                <option value="os">Operating system</option>
                <option value="serverClass">Server class</option>
              </select>
            </label>
            <button onClick={() => setSplit(false)}>Done</button>
          </div>
        )}
        {!panels.length ? (
          <div className="kn-analytics-empty">
            <h2>Start by selecting data.</h2>
            <p>Find something interesting? Save it to a dashboard, or create an alert.</p>
          </div>
        ) : (
          <div className={`kn-analytics-charts ${grid ? 'grid' : ''}`}>
            {panels.map((p) => (
              <article key={p.id}>
                <header>
                  <h2>{p.title}</h2>
                  <button
                    aria-label={`Remove ${p.title}`}
                    onClick={() => setPanels(panels.filter((x) => x.id !== p.id))}
                  >
                    ×
                  </button>
                </header>
                <QueryPanel panel={{ ...p, search: splitQuery(p) }} refresh={refresh} earliest={range} />
              </article>
            ))}
          </div>
        )}
        {message && (
          <div className="kn-info" role="status">
            {message}
          </div>
        )}
      </main>
      <aside className="kn-analytics-analysis">
        <header>
          <strong>Analysis</strong>
          <button
            aria-label={analysis ? 'Collapse Analysis' : 'Expand Analysis'}
            onClick={() => setAnalysis(!analysis)}
          >
            {analysis ? '»' : '«'}
          </button>
        </header>
        {analysis && panels.length > 0 && (
          <div className="kn-analysis-tools">
            <h3>
              {panels.length} chart{panels.length === 1 ? '' : 's'} selected
            </h3>
            <p>Analyze the active simulated world with SPL.</p>
            <button
              onClick={() => {
                setKind('dashboard');
                setSave(true);
              }}
            >
              Save to dashboard
            </button>
            <button
              onClick={() => {
                setKind('alert');
                setSave(true);
              }}
            >
              Create alert
            </button>
          </div>
        )}
      </aside>
      {filterDialog && (
        <KnowledgeModal
          title="Add new filter"
          onClose={() => setFilterDialog(false)}
          footer={
            <button className="kn-primary" onClick={() => setFilterDialog(false)}>
              Apply
            </button>
          }
        >
          <label className="kn-block-label">
            Forwarder site
            <select value={site} onChange={(e) => setSite(e.target.value)}>
              <option value="">All sites</option>
              {world.data?.sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <p className="kn-muted">
            Applies to forwarder inventory charts. Event searches retain their own SPL filters.
          </p>
        </KnowledgeModal>
      )}
      {save && (
        <KnowledgeModal
          title={kind === 'dashboard' ? 'Save to Dashboard' : 'Create Alert'}
          onClose={() => setSave(false)}
          footer={
            <>
              <button onClick={() => setSave(false)}>Cancel</button>
              <button
                className="kn-primary"
                disabled={!title.trim()}
                onClick={() => {
                  const item = addKnowledgeObject({
                    kind,
                    title,
                    panels: panels.map((p) => ({ ...p, search: splitQuery(p) })),
                    search: panels[0] ? splitQuery(panels[0]) : '',
                    earliest: range,
                    type: 'Dashboard Studio',
                  });
                  setSave(false);
                  if (kind === 'dashboard') window.location.hash = `#/dashboard/${item.id}`;
                  else
                    setMessage(
                      'Alert saved. Automatic scheduling and external delivery are not enabled in the sandbox.',
                    );
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
            Save as
            <select value={kind} onChange={(e) => setKind(e.target.value as 'dashboard' | 'alert')}>
              <option value="dashboard">Dashboard</option>
              <option value="alert">Alert</option>
            </select>
          </label>
        </KnowledgeModal>
      )}
    </section>
  );
}
