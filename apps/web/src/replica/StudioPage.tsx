import { useState } from 'react';
import { KnowledgeModal, QueryPanel } from './KnowledgePage';
import {
  addKnowledgeObject,
  STUDIO_EXAMPLES,
  STUDIO_THUMBNAILS,
  type DashboardPanel,
  type PanelType,
} from './knowledgeStore';

const GROUPS = [
  'New',
  'Chart Elements',
  'Gauges',
  'Single Value',
  'Table',
  'Spatial Elements',
  'Design Elements',
  'Trellis',
  'Datasources',
  'Defaults',
  'Inputs',
  'Interactions & Tokens',
  'Complete Dashboards',
];
const SUPPORTED: Record<string, PanelType> = {
  'example-hub-column-chart-visualization': 'column',
  'example-hub-bar-chart-visualization': 'bar',
  'example-hub-line-chart-visualization': 'line',
  'example-hub-area-chart-visualization': 'area',
  'example-hub-pie-chart-visualization': 'pie',
  'example-hub-table-chart-visualization': 'table',
  'example-hub-single-value-visualization': 'single',
};

function Example({ id }: { id: string }) {
  const item = STUDIO_EXAMPLES.find((e) => e.id === id);
  const [open, setOpen] = useState(true);
  const [source, setSource] = useState(false);
  const [copied, setCopied] = useState(false);
  if (!item)
    return (
      <section className="kn-page">
        <h1>Example not found</h1>
        <a href="#/studio">Return to Example Hub</a>
      </section>
    );
  const type = SUPPORTED[id];
  if (!type)
    return (
      <section className="kn-page kn-studio-example">
        <a href="#/studio">‹ Dashboard Examples Hub</a>
        <h1>{item.title}</h1>
        <p>{item.description}</p>
        {STUDIO_THUMBNAILS[id] && (
          <img
            className="kn-example-preview"
            src={STUDIO_THUMBNAILS[id]}
            alt={`${item.title} reference preview`}
          />
        )}
        <p>
          This example’s installed view is available in the reference catalog. Features that depend on Splunk
          services or external datasets may not execute in the sandbox.
        </p>
        <a className="kn-button" href={`#/view/splunk-dashboard-studio/${id}`}>
          Open installed view definition
        </a>
      </section>
    );
  const query =
    type === 'single'
      ? '| inputlookup forwarder_inventory | stats count'
      : type === 'line' || type === 'area'
        ? 'index=_internal sourcetype=splunkd | timechart count by log_level'
        : '| inputlookup forwarder_inventory | stats count by health';
  const multi = 'index=app sourcetype=access_combined | timechart count by status';
  const panels: DashboardPanel[] = [
    { id: 'single', title: 'Single Series', type, search: query },
    ...(type === 'column'
      ? [
          { id: 'multiple', title: 'Multiple Series', type, search: multi },
          { id: 'stacked', title: 'Multiple Series - Stacked', type, search: multi },
          { id: 'stacked100', title: 'Multiple Series - Stacked Mode 100%', type, search: multi },
        ]
      : []),
  ];
  const clone = () => {
    const saved = addKnowledgeObject({
      kind: 'dashboard',
      title: `${item.title} Example`,
      type: 'Dashboard Studio',
      description: 'Example using the sandbox’s simulated data.',
      panels,
    });
    window.location.hash = `#/dashboard/${saved.id}`;
  };
  return (
    <section className="kn-page kn-studio-example">
      <div className="kn-title-row">
        <div>
          <a href="#/studio">‹ Dashboard Examples Hub</a>
          <h1>{item.title}</h1>
        </div>
        <div className="kn-button-row">
          <button onClick={() => setOpen(!open)}>{open ? 'Show less' : 'Show more'}</button>
          <button onClick={() => setSource(!source)}>{source ? 'Visualization' : 'Source Definition'}</button>
          <button onClick={clone}>Clone to Dashboard</button>
        </div>
      </div>
      <p>{item.description}</p>
      {open && (
        <div className="kn-example-overview">
          <h2>Overview</h2>
          <p>
            {type === 'column'
              ? 'A column chart is primarily used to compare and track the development of quantitative values over a period of time. Compared to area and line charts, column charts are suitable for discrete data points. Column charts get their x-axis from the first column of a statistics table, and their y-axis values from the next columns.'
              : 'Visualizations present the results of a transforming search. Select a data series in the legend to show or hide it, or point at the chart to inspect its values.'}
          </p>
          <code>{query}</code>
          <p className="kn-muted">
            The layout follows the captured example. Chart values come from the active sandbox world.
          </p>
        </div>
      )}
      {source ? (
        <>
          <pre className="kn-source-view">
            {JSON.stringify(
              {
                title: item.title,
                visualizations: Object.fromEntries(
                  panels.map((p) => [
                    p.id,
                    {
                      type: `splunk.${p.type}`,
                      dataSources: { primary: `ds_${p.id}` },
                      options: p.id === 'stacked' || p.id === 'stacked100' ? { stackMode: p.id } : {},
                    },
                  ]),
                ),
                dataSources: Object.fromEntries(
                  panels.map((p) => [`ds_${p.id}`, { type: 'ds.search', options: { query: p.search } }]),
                ),
              },
              null,
              2,
            )}
          </pre>
          <button
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(JSON.stringify({ title: item.title, panels }, null, 2));
                setCopied(true);
              } catch {
                setCopied(false);
              }
            }}
          >
            {copied ? 'Copied' : 'Copy source'}
          </button>
        </>
      ) : (
        <div className="kn-example-grid">
          {panels.map((p) => (
            <article key={p.id}>
              <h2>{item.title}</h2>
              <h3>{p.title}</h3>
              <QueryPanel
                panel={p}
                stackMode={p.id === 'stacked' || p.id === 'stacked100' ? p.id : undefined}
              />
              <h3>SPL For {p.title}</h3>
              <pre>{p.search}</pre>
              <h3>Source Definition</h3>
              <pre>
                {JSON.stringify(
                  {
                    type: `splunk.${p.type}`,
                    dataSources: { primary: `ds_${p.id}` },
                    options: p.id === 'stacked' || p.id === 'stacked100' ? { stackMode: p.id } : {},
                  },
                  null,
                  2,
                )}
              </pre>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export function StudioPage({ id }: { id?: string }) {
  const [group, setGroup] = useState('New');
  const [filter, setFilter] = useState('');
  const [help, setHelp] = useState(false);
  if (id && id !== 'example-hub-nav-visualizations') return <Example key={id} id={id} />;
  return (
    <section className="kn-studio-hub">
      <header className="kn-studio-banner">
        <img src="/replica/studio-logo.svg" alt="" />
        <div>
          <h1>Dashboard Examples Hub</h1>
          <p>Empowering dashboard creators with a toolkit of examples</p>
          <p>Submit feedback to: dashboard-studio@splunk.com</p>
        </div>
        <button onClick={() => setHelp(true)}>Read Documentation</button>
        <a href="https://ideas.splunk.com/ideas/new" target="_blank" rel="noreferrer">
          Submit Feature Request
          <br />
          to ideas.splunk.com
        </a>
      </header>
      <div className="kn-studio-body">
        <aside>
          <h2>Examples</h2>
          {GROUPS.map((g) => (
            <button
              key={g}
              className={group === g ? 'active' : ''}
              onClick={() => {
                setGroup(g);
                document
                  .getElementById(`studio-${g}`)
                  ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            >
              {g}
            </button>
          ))}
        </aside>
        <div className="kn-studio-catalog">
          <input
            aria-label="Filter examples"
            className="kn-example-filter"
            placeholder="Find an example"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          {GROUPS.map((g) => {
            const examples = STUDIO_EXAMPLES.filter(
              (e) =>
                e.group === g && `${e.title} ${e.description}`.toLowerCase().includes(filter.toLowerCase()),
            );
            if (!examples.length) return null;
            return (
              <section id={`studio-${g}`} key={g}>
                <h2>{g}</h2>
                <div className="kn-example-cards">
                  {examples.map((e, i) => (
                    <a
                      key={`${e.id}-${i}`}
                      className="kn-example-card"
                      href={SUPPORTED[e.id] ? `#/studio/${e.id}` : `#/view/splunk-dashboard-studio/${e.id}`}
                    >
                      <strong>{e.title}</strong>
                      {STUDIO_THUMBNAILS[e.id] ? (
                        <img src={STUDIO_THUMBNAILS[e.id]} alt={`${e.title} preview`} loading="lazy" />
                      ) : (
                        <div className="kn-card-illustration">▥</div>
                      )}
                      <p>{e.description}</p>
                      <div className="kn-tags">
                        {e.tags.map((t) => (
                          <span key={t}>{t}</span>
                        ))}
                      </div>
                    </a>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
      {help && (
        <KnowledgeModal
          title="Dashboard Studio"
          onClose={() => setHelp(false)}
          footer={
            <button className="kn-primary" onClick={() => setHelp(false)}>
              Done
            </button>
          }
        >
          <p>
            Browse the examples by category. Column, bar, line, area, pie, single value and table examples
            render searches against your sandbox. The installed-view catalog provides source and extracted
            controls for the remaining reference examples.
          </p>
          <p>
            To build your own, open Dashboards → Create New Dashboard → Dashboard Studio. Add panels, choose
            their visualization, edit their queries, reorder them, and save. The Source editor accepts the
            sandbox dashboard JSON format.
          </p>
          <p>
            Free-position canvas editing, token interactions and the complete Splunk Studio schema are outside
            the currently verified editor implementation.
          </p>
        </KnowledgeModal>
      )}
    </section>
  );
}
