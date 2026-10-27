import { useState } from 'react';
import { appLinks, viewHref } from './navigation';
import { installedViews } from './viewCatalog';
import { useKnowledge, saveKnowledge, type KnowledgeObject } from './knowledgeStore';
import { Modal } from './Modal';
import { useApps } from './appRegistry';

const tabs = ['Quick links', 'Dashboard', 'Recently viewed', 'Created by you', 'Shared with you'];
const tasks = [
  ['Document', 'Interview workbench', 'Question-driven incidents, evidence and answer practice.', '#/training'],
  ['AddData', 'Code & Ansible', 'Review, validate and deploy virtual configuration.', '#/code'],
  ['AddData', 'Add data', 'Add data from a variety of common sources.', '#/settings/add-data'],
  ['SearchData', 'Search your data', 'Turn data into doing with Splunk search.', '#/search'],
  ['VisualizeData', 'Visualize your data', 'Create dashboards that work for your data.', '#/dashboards'],
  ['TeamMember', 'Add team members', 'Add your team members to Splunk platform.', '#/settings/users'],
  ['ManagePermissions', 'Manage permissions', 'Control who has access with roles.', '#/settings/roles'],
  [
    'MobileDevices',
    'Configure mobile devices',
    'Login or manage mobile devices using Splunk Secure Gateway.',
    '#/settings/mobile-settings',
  ],
];
const learning = [
  ['ProductTour', 'Product tours', 'New to Splunk? Take a tour to help you on your way.', 'tour'],
  [
    'Document',
    'Learn more with Splunk Docs',
    'Deploy, manage, and use Splunk software with comprehensive guidance.',
    'https://docs.splunk.com/Documentation',
  ],
  [
    'SplunkLantern',
    'Get help from Splunk experts',
    'Actionable guidance on the Splunk Lantern Customer Success Center.',
    'https://lantern.splunk.com/',
  ],
  [
    'Splunkbase',
    'Extend your capabilities',
    'Browse thousands of apps on Splunkbase.',
    'https://splunkbase.splunk.com/',
  ],
  [
    'SplunkCommunity',
    'Join the Splunk Community',
    'Learn, get inspired, and share knowledge.',
    'https://community.splunk.com/',
  ],
  [
    'CustomerSuccess',
    'See how others use Splunk',
    'Browse real customer stories.',
    'https://www.splunk.com/customers',
  ],
  [
    'TrainingAndCertification',
    'Training and Certification',
    'Become a certified Splunk Ninja.',
    'https://www.splunk.com/training',
  ],
];
export function AppIcon({ icon }: { icon: string }) {
  return <img className={`app-icon ${icon}-app-icon`} src={`/assets/splunk/${icon}-icon.png`} alt="" />;
}
function itemHref(o: KnowledgeObject) {
  return o.kind === 'dashboard'
    ? `#/dashboard/${o.id}`
    : o.kind === 'dataset'
      ? '#/datasets'
      : `#/search?q=${encodeURIComponent(o.search)}&earliest=${encodeURIComponent(o.earliest)}&latest=${encodeURIComponent(o.latest)}`;
}
export function HomePage() {
  const apps = useApps();
  const [tab, setTab] = useState(tabs[0]);
  const [appFilter, setAppFilter] = useState('');
  const [filter, setFilter] = useState('');
  const [kind, setKind] = useState('dashboard');
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState('Name');
  const [reverse, setReverse] = useState(false);
  const [tour, setTour] = useState(false);
  const [choose, setChoose] = useState(false);
  const state = useKnowledge();
  const home = state.objects.find((o) => o.id === state.homeDashboard);
  const native = installedViews
    .filter((v) => ['form', 'dashboard'].includes(v.kind))
    .map((v) => ({
      id: `${v.app}/${v.id}`,
      title: v.label,
      owner: 'nobody',
      app: v.app,
      sharing: 'App',
      updated: 'Unknown',
      href: viewHref(v.app, v.id),
    }));
  const personal = state.objects.filter((o) => o.kind === kind).map((o) => ({ ...o, href: itemHref(o) }));
  let rows =
    tab === 'Shared with you'
      ? [
          ...personal.filter((o) => o.sharing !== 'Private'),
          ...(kind === 'dashboard' ? native.filter((n) => !personal.some((o) => o.title === n.title)) : []),
        ]
      : tab === 'Recently viewed'
        ? personal.filter((o) => state.recent.includes(o.id))
        : personal.filter((o) => o.owner === 'admin');
  rows = rows
    .filter((o) => `${o.title} ${o.app} ${o.owner}`.toLowerCase().includes(filter.toLowerCase()))
    .sort((a, b) => {
      const key = sort === 'Name' ? 'title' : (sort.toLowerCase() as 'owner' | 'app' | 'sharing' | 'updated');
      return (reverse ? -1 : 1) * a[key].localeCompare(b[key]);
    });
  const visible = rows.slice(page * 20, page * 20 + 20);
  const pager = (
    <div className="home-pager">
      <span>
        {rows.length ? `${page * 20 + 1}-${Math.min(page * 20 + 20, rows.length)}` : '0'} of {rows.length}{' '}
        {kind === 'dashboard' ? 'Dashboards' : kind === 'report' ? 'Reports' : 'Alerts'}
      </span>
      <button disabled={page === 0} onClick={() => setPage(page - 1)}>
        Prev
      </button>
      {Array.from({ length: Math.min(5, Math.max(1, Math.ceil(rows.length / 20))) }, (_, i) => (
        <button key={i} className={page === i ? 'selected' : ''} onClick={() => setPage(i)}>
          {i + 1}
        </button>
      ))}
      <button disabled={(page + 1) * 20 >= rows.length} onClick={() => setPage(page + 1)}>
        Next
      </button>
    </div>
  );
  return (
    <main className="splunk-home" id="main-content" tabIndex={-1}>
      <aside className="home-apps">
        <div className="home-apps-heading">
          <h2>Apps</h2>
          <a href="#/apps">⚙ Manage</a>
        </div>
        <div className="home-app-search">
          <input
            type="search"
            aria-label="Search apps by name"
            placeholder="Search apps by name..."
            value={appFilter}
            onChange={(e) => setAppFilter(e.target.value)}
          />
          <span>⌕</span>
        </div>
        <div className="home-app-list">
          {appLinks
            .filter((a) => apps.some((x) => x.id === a.icon && x.enabled && x.visible))
            .filter((a) => a.label.toLowerCase().includes(appFilter.toLowerCase()))
            .map((a) => (
              <a key={a.label} href={a.href}>
                <AppIcon icon={a.icon} />
                {a.label}
              </a>
            ))}
          {apps
            .filter(
              (a) =>
                a.version === 'Profile' &&
                a.enabled &&
                a.visible &&
                a.label.toLowerCase().includes(appFilter.toLowerCase()),
            )
            .map((a) => (
              <a
                key={a.id}
                href={a.id === 'SplunkEnterpriseSecuritySuite' ? '#/operations' : `#/catalog?app=${a.id}`}
              >
                <span className="environment-monogram" style={{ fontSize: 12, padding: 7 }}>
                  APP
                </span>
                {a.label}
              </a>
            ))}
        </div>
        <a className="find-more-apps" href="#/find-apps">
          Find more apps ↗
        </a>
      </aside>
      <div className="home-main">
        <h1>Hello, Administrator</h1>
        <div className="home-tabs" role="tablist" aria-label="Home views">
          {tabs.map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              className={tab === t ? 'active' : ''}
              onClick={() => {
                setTab(t);
                setPage(0);
                setFilter('');
              }}
            >
              {t}
            </button>
          ))}
        </div>
        {tab === 'Quick links' ? (
          <div className="home-quick">
            <h3>Common tasks</h3>
            <div className="home-card-grid">
              {tasks.map(([icon, title, desc, href]) => (
                <a className="home-card" key={title} href={href}>
                  <img className="card-icon" src={`/assets/splunk/home/${icon}.svg`} alt="" />
                  <div>
                    <strong>{title}</strong>
                    <p>{desc}</p>
                  </div>
                </a>
              ))}
            </div>
            <h3>Learning and resources</h3>
            <div className="home-card-grid">
              {learning.map(([icon, title, desc, href]) => (
                <a
                  className="home-card"
                  key={title}
                  href={href === 'tour' ? '#/home' : href}
                  target={href === 'tour' ? undefined : '_blank'}
                  rel="noreferrer"
                  onClick={(e) => {
                    if (href === 'tour') {
                      e.preventDefault();
                      setTour(true);
                    }
                  }}
                >
                  <img className="card-icon" src={`/assets/splunk/home/${icon}.svg`} alt="" />
                  <div>
                    <strong>
                      {title}
                      {href !== 'tour' && ' ↗'}
                    </strong>
                    <p>{desc}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        ) : tab === 'Dashboard' ? (
          <div className="home-dashboard">
            {home ? (
              <>
                <h2>{home.title}</h2>
                <p>{home.description}</p>
                <a className="replica-primary" href={itemHref(home)}>
                  Open dashboard
                </a>
                <button onClick={() => setChoose(true)}>Change home dashboard</button>
              </>
            ) : (
              <>
                <h2>Choose a home dashboard</h2>
                <p>Choose a dashboard to display on your home page.</p>
                <button className="replica-primary" onClick={() => setChoose(true)}>
                  Choose a dashboard
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="home-objects">
            <div className="home-object-controls">
              <input
                type="search"
                aria-label="Filter knowledge objects"
                placeholder="Filter"
                value={filter}
                onChange={(e) => {
                  setFilter(e.target.value);
                  setPage(0);
                }}
              />
              <select
                aria-label="Object type"
                value={kind}
                onChange={(e) => {
                  setKind(e.target.value);
                  setPage(0);
                }}
              >
                <option value="dashboard">Dashboards</option>
                <option value="report">Reports</option>
                <option value="alert">Alerts</option>
              </select>
              {pager}
            </div>
            <table className="replica-table">
              <thead>
                <tr>
                  {['Name', 'Owner', 'Updated', 'App', 'Sharing'].map((c) => (
                    <th key={c}>
                      <button
                        onClick={() => {
                          setReverse(sort === c ? !reverse : false);
                          setSort(c);
                        }}
                      >
                        {c} {sort === c ? (reverse ? '▾' : '▴') : '↕'}
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <a href={o.href}>{o.title}</a>
                    </td>
                    <td>{o.owner}</td>
                    <td>{o.updated === 'Unknown' ? 'Unknown' : new Date(o.updated).toLocaleDateString()}</td>
                    <td>{o.app}</td>
                    <td>{o.sharing}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!rows.length && (
              <div className="home-empty">
                No {kind === 'dashboard' ? 'dashboards' : kind === 'report' ? 'reports' : 'alerts'} found.
                {tab === 'Created by you' && (
                  <p>
                    <a href="#/dashboards">Create a dashboard</a>
                  </p>
                )}
              </div>
            )}
            {pager}
          </div>
        )}
      </div>
      {choose && (
        <Modal title="Choose a home dashboard" onClose={() => setChoose(false)}>
          <div className="replica-dialog-body">
            <label>
              Dashboard
              <select
                value={state.homeDashboard ?? ''}
                onChange={(e) => saveKnowledge({ ...state, homeDashboard: e.target.value || undefined })}
              >
                <option value="">None</option>
                {state.objects
                  .filter((o) => o.kind === 'dashboard')
                  .map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.title}
                    </option>
                  ))}
              </select>
            </label>
          </div>
          <div className="replica-dialog-footer">
            <button className="replica-primary" onClick={() => setChoose(false)}>
              Done
            </button>
          </div>
        </Modal>
      )}
      {tour && (
        <Modal title="Welcome to Splunk Enterprise" onClose={() => setTour(false)}>
          <div className="replica-dialog-body">
            <p>Search, investigate, and visualize your data.</p>
            <ol>
              <li>
                Use{' '}
                <a href="#/search" onClick={() => setTour(false)}>
                  Search &amp; Reporting
                </a>{' '}
                to query the simulated data.
              </li>
              <li>Save a search as a report or add it to a dashboard.</li>
              <li>
                Open{' '}
                <a href="#/monitoring" onClick={() => setTour(false)}>
                  Monitoring Console
                </a>{' '}
                to investigate your deployment.
              </li>
              <li>Choose Engineer Sandbox from Apps to practice real incident workflows.</li>
            </ol>
          </div>
          <div className="replica-dialog-footer">
            <button className="replica-primary" onClick={() => setTour(false)}>
              Get started
            </button>
          </div>
        </Modal>
      )}
    </main>
  );
}
