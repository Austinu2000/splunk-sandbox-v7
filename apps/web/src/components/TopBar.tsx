import { useEffect, useRef, useState } from 'react';
import { CLOCK_SPEEDS, type ClockSpeed, type WorldInfo } from '@sandbox/shared';
import { fmtClock } from '../format';
import { settingsGroups } from '../replica/settingsCatalog';
import { appLinks, findDestinations, practiceNavigation, searchNavigation } from '../replica/navigation';
import { installedViews } from '../replica/viewCatalog';
import { Modal } from '../replica/Modal';
import { useApps } from '../replica/appRegistry';

export type Route =
  | 'kvstore'
  | 'learn'
  | 'training'
  | 'code'
  | 'operations'
  | 'environments'
  | 'home'
  | 'fleet'
  | 'terminal'
  | 'search'
  | 'tickets'
  | 'monitoring'
  | 'forwarders'
  | 'interview'
  | 'sessions'
  | 'reports'
  | 'alerts'
  | 'dashboards'
  | 'dashboard'
  | 'datasets'
  | 'jobs'
  | 'triggered-alerts'
  | 'analytics'
  | 'studio'
  | 'settings'
  | 'apps'
  | 'find-apps'
  | 'upgrade'
  | 'view'
  | 'login'
  | 'preferences'
  | 'account'
  | 'help'
  | 'catalog';
const searchRoutes: Route[] = [
  'search',
  'reports',
  'alerts',
  'dashboards',
  'dashboard',
  'datasets',
  'analytics',
];
const practiceRoutes: Route[] = [
  'training', 'code', 'learn', 'kvstore',
  'fleet',
  'terminal',
  'tickets',
  'interview',
  'sessions',
  'environments',
  'operations',
];
const monitoringGroups: Record<string, string[]> = {
  Indexing: ['indexing', 'indexes', 'volume', 'license', 'data_quality'],
  Search: ['search', 'scheduler', 'audit'],
  'Resource Usage': ['resource', 'introspection', 'kv_store'],
  Forwarders: ['forwarder'],
  Settings: ['setup', 'health_check'],
};
export function TopBar({
  world,
  route,
  onClock,
}: {
  world: WorldInfo | null;
  route: Route;
  onClock: (patch: { paused?: boolean; speed?: ClockSpeed }) => void;
}) {
  const apps = useApps();
  const [menu, setMenu] = useState('');
  const [modal, setModal] = useState('');
  const [find, setFind] = useState('');
  const [appMenu, setAppMenu] = useState('');
  const header = useRef<HTMLElement>(null);
  const monitoring =
    route === 'monitoring' ||
    (route === 'view' && window.location.hash.includes('splunk_monitoring_console'));
  const studio = route === 'studio';
  const showSearch = searchRoutes.includes(route);
  const showPractice = practiceRoutes.includes(route);
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!header.current?.contains(e.target as Node)) {
        setMenu('');
        setAppMenu('');
      }
    };
    const escape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenu('');
        setAppMenu('');
        setFind('');
      }
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', escape);
    };
  }, []);
  useEffect(() => {
    setMenu('');
    setAppMenu('');
    setFind('');
  }, [route]);
  const toggle = (name: string) => {
    setMenu(menu === name ? '' : name);
    setAppMenu('');
  };
  const groups = settingsGroups.filter((g) => g.title !== 'Shortcuts');
  const menuLink = (label: string, href: string) => (
    <a key={label} role="menuitem" href={href} onClick={() => setMenu('')}>
      {label}
    </a>
  );
  const matched = find.trim()
    ? findDestinations
        .filter((d) => d.label.toLowerCase().includes(find.toLowerCase()))
        .filter((d, i, a) => a.findIndex((x) => x.href === d.href) === i)
        .slice(0, 12)
    : [];
  return (
    <>
      <a
        className="skip-navigation"
        href="#main-content"
        onClick={(e) => {
          e.preventDefault();
          const content = Array.from(document.querySelectorAll<HTMLElement>('main,[role=main]')).find(
            (e) => e.offsetParent !== null,
          );
          if (content) {
            content.tabIndex = -1;
            content.focus();
          }
        }}
      >
        Click here to skip the navigation bar
      </a>
      <header ref={header} className="splunk-header">
        <div className="splunk-global">
          <a className="splunk-wordmark" href="#/home" aria-label="splunk logo home">
            splunk<span>&gt;enterprise</span>
          </a>
          <div className="nav-pop-wrap">
            <button
              className={menu === 'apps' ? 'open' : ''}
              aria-haspopup="menu"
              aria-expanded={menu === 'apps'}
              onClick={() => toggle('apps')}
            >
              Apps <span className="caret">▾</span>
            </button>
            {menu === 'apps' && (
              <div className="global-dropdown apps-dropdown" role="menu">
                {appLinks
                  .filter((a) => apps.some((x) => x.id === a.icon && x.enabled && x.visible))
                  .map((a) => menuLink(a.label, a.href))}
                <hr />
                {menuLink('Monitoring Console', '#/monitoring')}
                {menuLink('Splunk Dashboard Studio', '#/studio')}
                {menuLink('Engineer Sandbox', '#/fleet')}
                {menuLink('Environments', '#/environments')}
                {apps
                  .filter((a) => a.enabled && a.id === 'SplunkEnterpriseSecuritySuite')
                  .map((a) => menuLink(a.label, '#/operations'))}
                <hr />
                {apps
                  .filter(
                    (a) =>
                      a.enabled &&
                      a.visible &&
                      !appLinks.some((l) => l.icon === a.id) &&
                      a.version === 'Profile' &&
                      a.id !== 'SplunkEnterpriseSecuritySuite',
                  )
                  .map((a) => menuLink(a.label, `#/catalog?app=${a.id}`))}
                {menuLink('Manage Apps', '#/apps')}
                {menuLink('Find More Apps', '#/find-apps')}
              </div>
            )}
          </div>
          <div className="global-spacer" />
          <a href="#/environments" style={{ fontSize: 12, marginRight: 12 }}>
            {world?.profileName}
          </a>
          <div className="nav-pop-wrap">
            <button
              className="health-status"
              aria-label="View health report"
              title="Health report"
              onClick={() => toggle('health')}
            >
              ●<span>✓</span>
            </button>
            {menu === 'health' && (
              <div className="global-dropdown" role="menu">
                <strong>Splunk health report</strong>
                <p>View the simulated deployment’s health and active incidents.</p>
                {menuLink('Monitoring Console', '#/monitoring')}
                {menuLink('Health report manager', '#/settings/health-report-manager')}
                {menuLink('Incidents & Tickets', '#/tickets')}
              </div>
            )}
          </div>
          <div className="nav-pop-wrap">
            <button aria-haspopup="menu" aria-expanded={menu === 'account'} onClick={() => toggle('account')}>
              Administrator <span className="caret">▾</span>
            </button>
            {menu === 'account' && (
              <div className="global-dropdown" role="menu">
                {menuLink('Account Settings', '#/account')}
                {menuLink('Preferences', '#/preferences')}
                {menuLink('Logout', '#/login')}
              </div>
            )}
          </div>
          <div className="nav-pop-wrap">
            <button
              aria-haspopup="menu"
              aria-expanded={menu === 'messages'}
              onClick={() => toggle('messages')}
            >
              <span className="message-badge">2</span> Messages <span className="caret">▾</span>
            </button>
            {menu === 'messages' && (
              <div className="global-dropdown message-dropdown" role="menu">
                <strong>Messages</strong>
                <p>V3 runs independently on your computer.</p>
                <p>Searches use your simulated fleet and incident data.</p>
                {menuLink('View triggered alerts', '#/triggered-alerts')}
                {menuLink('Open incidents', '#/tickets')}
              </div>
            )}
          </div>
          <div className="nav-pop-wrap">
            <button
              aria-haspopup="menu"
              aria-expanded={menu === 'settings'}
              onClick={() => toggle('settings')}
            >
              Settings <span className="caret">▾</span>
            </button>
            {menu === 'settings' && (
              <div className="settings-dropdown" role="menu" aria-label="Settings">
                <div className="settings-shortcuts">
                  <a role="menuitem" href="#/settings/add-data" onClick={() => setMenu('')}>
                    <span>
                      ▤<small>⊕</small>
                    </span>
                    Add Data
                  </a>
                  <a role="menuitem" href="#/monitoring" onClick={() => setMenu('')}>
                    <span>☷</span>Monitoring
                    <br />
                    Console
                  </a>
                </div>
                <div>
                  {groups.slice(0, 2).map((g) => (
                    <section key={g.title}>
                      <h3>{g.title}</h3>
                      {g.items.map((s) => menuLink(s.label, s.href))}
                    </section>
                  ))}
                </div>
                <div>
                  {groups.slice(2).map((g) => (
                    <section key={g.title}>
                      <h3>{g.title}</h3>
                      {g.items.map((s) => menuLink(s.label, s.href))}
                    </section>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="nav-pop-wrap">
            <button
              aria-haspopup="menu"
              aria-expanded={menu === 'activity'}
              onClick={() => toggle('activity')}
            >
              Activity <span className="caret">▾</span>
            </button>
            {menu === 'activity' && (
              <div className="global-dropdown" role="menu">
                {menuLink('Jobs', '#/jobs')}
                {menuLink('Triggered Alerts', '#/triggered-alerts')}
              </div>
            )}
          </div>
          <div className="nav-pop-wrap">
            <button aria-haspopup="menu" aria-expanded={menu === 'help'} onClick={() => toggle('help')}>
              Help <span className="caret">▾</span>
            </button>
            {menu === 'help' && (
              <div className="global-dropdown" role="menu">
                {[
                  'What’s New',
                  'Tutorials',
                  'Splunk Answers',
                  'Contact Support',
                  'File a Bug',
                  'Help for this page',
                  'Privacy Policy',
                ].map((t) => (
                  <button
                    role="menuitem"
                    key={t}
                    onClick={() => {
                      setModal(t);
                      setMenu('');
                    }}
                  >
                    {t}
                  </button>
                ))}
                <hr />
                {menuLink('About', '#/help')}
                {menuLink('UI coverage', '#/catalog')}
                <label className="docs-search">
                  Search documentation
                  <input
                    type="search"
                    placeholder="Find a page"
                    onChange={(e) => setFind(e.target.value)}
                    value={find}
                  />
                </label>
              </div>
            )}
          </div>
          <div className="global-find">
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              placeholder="Find"
              aria-label="Find"
              value={find}
              onFocus={() => setMenu('')}
              onChange={(e) => setFind(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && matched[0]) {
                  window.location.hash = matched[0].href;
                  setFind('');
                }
              }}
            />
            {find && (
              <div className="global-dropdown find-dropdown" role="listbox" aria-label="Find results">
                {matched.length ? (
                  matched.map((d) => (
                    <a key={d.href} href={d.href} onClick={() => setFind('')}>
                      <span>{d.label}</span>
                      <small>{d.group}</small>
                    </a>
                  ))
                ) : (
                  <p>No matching pages.</p>
                )}
              </div>
            )}
          </div>
        </div>
        {(showSearch || showPractice || studio || monitoring) && (
          <nav className="splunk-appbar" aria-label="Application navigation">
            {showSearch &&
              searchNavigation.map(([label, id]) => (
                <a
                  key={id}
                  href={'#/' + id}
                  className={route === id || (route === 'dashboard' && id === 'dashboards') ? 'active' : ''}
                >
                  {label}
                </a>
              ))}
            {showPractice &&
              practiceNavigation.map(([label, id]) => (
                <a key={id} href={'#/' + id} className={route === id ? 'active' : ''}>
                  {label}
                </a>
              ))}
            {studio && (
              <a href="#/studio" className="active">
                Home
              </a>
            )}
            {monitoring && (
              <>
                <a href="#/monitoring" className={window.location.hash === '#/monitoring' ? 'active' : ''}>
                  Overview
                </a>
                <a href="#/fleet">Summary</a>
                <a href="#/view/splunk_monitoring_console/assist">Assist</a>
                <a href="#/view/splunk_monitoring_console/health_check">Health Check</a>
                {Object.entries(monitoringGroups).map(([label, prefixes]) => (
                  <div className="app-nav-group" key={label}>
                    <button
                      onClick={() => setAppMenu(appMenu === label ? '' : label)}
                      aria-expanded={appMenu === label}
                    >
                      {label} ▾
                    </button>
                    {appMenu === label && (
                      <div className="global-dropdown mc-nav-dropdown">
                        {label === 'Indexing' && (
                          <a href="#/monitoring/indexing" onClick={() => setAppMenu('')}>
                            Indexing Performance
                          </a>
                        )}
                        {label === 'Search' && (
                          <a href="#/monitoring/scheduler" onClick={() => setAppMenu('')}>
                            Scheduler Activity
                          </a>
                        )}
                        {label === 'Forwarders' && (
                          <a href="#/monitoring/forwarders" onClick={() => setAppMenu('')}>
                            Forwarders Overview
                          </a>
                        )}
                        {installedViews
                          .filter(
                            (v) =>
                              v.app === 'splunk_monitoring_console' && prefixes.some((p) => v.id.includes(p)),
                          )
                          .map((v) => (
                            <a key={v.id} href={`#/view/${v.app}/${v.id}`} onClick={() => setAppMenu('')}>
                              {v.label}
                            </a>
                          ))}
                      </div>
                    )}
                  </div>
                ))}
                <a href="#/search">Run a Search</a>
              </>
            )}
            <div className="appbar-title">
              {showSearch && (
                <>
                  <img src="/assets/splunk/search-icon.png" alt="" />
                  Search &amp; Reporting
                </>
              )}
              {showPractice && <>Engineer Sandbox</>}
              {studio && <>Splunk Dashboard Studio</>}
              {monitoring && (
                <>
                  <span className="round-app">App</span>Monitoring Console
                </>
              )}
            </div>
          </nav>
        )}
      </header>
      {showPractice && world && (
        <div className="practice-clock">
          <span>{fmtClock(world.now)}</span>
          <button onClick={() => onClock({ paused: !world.paused })}>
            {world.paused ? '▶ Resume' : 'Ⅱ Pause'}
          </button>
          {CLOCK_SPEEDS.map((s) => (
            <button
              key={s}
              className={world.speed === s ? 'active' : ''}
              onClick={() => onClock({ speed: s })}
            >
              {s}×
            </button>
          ))}
          <span>seed: {world.seed}</span>
          <span>
            Local simulation · v6 · <a href="#/environments">{world?.profileName ?? 'Default environment'}</a>
          </span>
        </div>
      )}
      {modal && (
        <Modal title={modal} onClose={() => setModal('')}>
          <div className="replica-dialog-body">
            <p>
              {modal === 'Tutorials'
                ? 'Start with a search, inspect your fleet, then practice resolving an incident.'
                : 'This local training environment reproduces the installed Splunk interface. Product support and community content are external resources.'}
            </p>
            <div className="help-actions">
              <a href="#/search" onClick={() => setModal('')}>
                Search your data
              </a>
              <a href="#/interview" onClick={() => setModal('')}>
                Start a guided scenario
              </a>
              <a href="https://docs.splunk.com/Documentation/Splunk/9.2.2" target="_blank" rel="noreferrer">
                Splunk documentation ↗
              </a>
            </div>
          </div>
          <div className="replica-dialog-footer">
            <button onClick={() => setModal('')}>Close</button>
          </div>
        </Modal>
      )}
    </>
  );
}
