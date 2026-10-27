import { profileStorage } from '../environment';
import { useState } from 'react';
import { useApps, saveApps, type AppEntry } from './appRegistry';
import { Modal } from './Modal';
import { viewHref } from './navigation';

function appHref(id: string) {
  if (id === 'SplunkEnterpriseSecuritySuite') return '#/operations';
  const map: Record<string, string> = {
    search: '#/search',
    launcher: '#/home',
    'splunk-dashboard-studio': '#/studio',
    splunk_monitoring_console: '#/monitoring',
    splunk_secure_gateway: '#/settings/mobile-settings',
    python_upgrade_readiness_app: '#/upgrade',
  };
  return map[id] ?? viewHref(id, '');
}
export function AppsPage({ browse = false }: { browse?: boolean }) {
  const apps = useApps();
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState<AppEntry | null>(null);
  const [dialog, setDialog] = useState('');
  const [sharing, setSharing] = useState('System');
  const [info, setInfo] = useState('');
  const list = apps.filter((a) => `${a.label} ${a.id}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <main className="replica-page" tabIndex={-1}>
      <div className="replica-toolbar" style={{ marginTop: 0 }}>
        <h1>{browse ? 'Browse More Apps' : 'Apps'}</h1>
        <span className="spacer" />
        <button onClick={() => setDialog('Install app from file')}>Install app from file</button>
        <a className="replica-primary" href={browse ? '#/apps' : '#/find-apps'}>
          {browse ? 'Manage Apps' : 'Find more apps'}
        </a>
      </div>
      {info && (
        <div className="replica-notice" role="status">
          {info}
          <button style={{ float: 'right' }} onClick={() => setInfo('')}>
            ×
          </button>
        </div>
      )}
      {browse && (
        <p className="page-lead">
          Explore the apps included in the local reference. Online apps are available on{' '}
          <a target="_blank" rel="noreferrer" href="https://splunkbase.splunk.com/">
            Splunkbase ↗
          </a>
          .
        </p>
      )}
      <div className="replica-toolbar">
        <span>{list.length} Apps</span>
        <span className="spacer" />
        <input
          type="search"
          placeholder="Filter apps"
          aria-label="Filter apps"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      <table className="replica-table">
        <thead>
          <tr>
            {[
              'Name',
              'Folder name',
              'Version',
              'Update checking',
              'Visible',
              'Sharing',
              'Status',
              'Actions',
            ].map((c) => (
              <th key={c}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {list.map((a) => (
            <tr key={a.id}>
              <td>{a.enabled ? <a href={appHref(a.id)}>{a.label}</a> : a.label}</td>
              <td>{a.id}</td>
              <td>{a.version}</td>
              <td>
                <button
                  className="app-edit-link"
                  onClick={() =>
                    setInfo(
                      'The installed reference version is available offline. This sandbox does not check Splunkbase for updates.',
                    )
                  }
                >
                  Check for updates
                </button>
              </td>
              <td>{a.visible ? 'Yes' : 'No'}</td>
              <td>
                System{' '}
                <button
                  className="app-edit-link"
                  onClick={() => {
                    setEditing(a);
                    setDialog('Permissions');
                  }}
                >
                  Permissions
                </button>
              </td>
              <td>{a.enabled ? 'Enabled' : 'Disabled'}</td>
              <td>
                <button
                  className="app-edit-link"
                  onClick={() => {
                    setEditing(a);
                    setDialog('Edit properties');
                  }}
                >
                  Edit properties
                </button>{' '}
                |{' '}
                <button
                  className="app-edit-link"
                  onClick={() =>
                    saveApps(apps.map((x) => (x.id === a.id ? { ...x, enabled: !x.enabled } : x)))
                  }
                >
                  {a.enabled ? 'Disable' : 'Enable'}
                </button>{' '}
                | <a href={`#/catalog?app=${a.id}`}>View objects</a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {dialog && (
        <Modal
          title={dialog}
          onClose={() => {
            setDialog('');
            setEditing(null);
          }}
        >
          <div className="replica-dialog-body">
            {editing && dialog === 'Edit properties' ? (
              <>
                <label>
                  Name
                  <input
                    value={editing.label}
                    onChange={(e) => setEditing({ ...editing, label: e.target.value })}
                  />
                </label>
                <label>
                  Visible
                  <select
                    value={String(editing.visible)}
                    onChange={(e) => setEditing({ ...editing, visible: e.target.value === 'true' })}
                  >
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </label>
                <label>
                  Status
                  <select
                    value={String(editing.enabled)}
                    onChange={(e) => setEditing({ ...editing, enabled: e.target.value === 'true' })}
                  >
                    <option value="true">Enabled</option>
                    <option value="false">Disabled</option>
                  </select>
                </label>
              </>
            ) : dialog === 'Permissions' ? (
              <>
                <p>{editing?.label}</p>
                <label>
                  Sharing
                  <select value={sharing} onChange={(e) => setSharing(e.target.value)}>
                    <option>System</option>
                    <option>App</option>
                    <option>Private</option>
                  </select>
                </label>
                <p>
                  Permissions are for UI practice. This single-user sandbox does not enforce Splunk roles.
                </p>
              </>
            ) : (
              <>
                <p>Installing executable Splunk apps is not supported by the simulated environment.</p>
                <p>
                  Use the included app views, or create a dashboard in Search &amp; Reporting. No files will
                  be installed on your Splunk instance.
                </p>
                <a href="#/dashboards" onClick={() => setDialog('')}>
                  Create a dashboard
                </a>
              </>
            )}
          </div>
          <div className="replica-dialog-footer">
            <button
              onClick={() => {
                setDialog('');
                setEditing(null);
              }}
            >
              Cancel
            </button>
            {editing && dialog === 'Edit properties' && (
              <button
                className="replica-primary"
                onClick={() => {
                  if (!editing.label.trim()) return;
                  saveApps(apps.map((x) => (x.id === editing.id ? editing : x)));
                  setDialog('');
                  setEditing(null);
                }}
              >
                Save
              </button>
            )}
            {dialog === 'Permissions' && (
              <button
                onClick={() => {
                  setDialog('');
                  setEditing(null);
                  setInfo('Permission selection reviewed. This local sandbox remains single-user.');
                }}
              >
                Done
              </button>
            )}
          </div>
        </Modal>
      )}
    </main>
  );
}
export function LoginPage() {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [first, setFirst] = useState(false);
  return (
    <main className="replica-login" tabIndex={-1}>
      <div className="login-log-text" aria-hidden="true">
        {Array.from(
          { length: 85 },
          (_, i) =>
            `${i % 2 ? 'GET' : 'POST'} /category.screen?categoryId=STRATEGY&JSESSIONID=SD5SSL7F6DAF9FD HTTP 1.1 200 236 "http://buttercup-shopping.com/product.screen" "Mozilla/5.0" ${i + 100} ${i * 17}\n`,
        ).join('')}
      </div>
      <form
        className="login-form"
        onSubmit={(e) => {
          e.preventDefault();
          setPassword('');
          let route = '#/home';
          try {
            route = JSON.parse(profileStorage.getItem('splunk-v3-preferences') ?? '{}').defaultApp ?? route;
          } catch {
            /* Use the local default if storage is unavailable. */
          }
          window.location.hash = route;
        }}
      >
        <div className="splunk-wordmark">
          splunk<span>&gt;enterprise</span>
        </div>
        <div className="login-fields">
          <input
            autoComplete="off"
            aria-label="Username"
            placeholder="Username"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            autoComplete="off"
            aria-label="Password"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit" className="replica-primary">
            Sign In
          </button>
        </div>
        <div className="login-first">
          <button type="button" className="app-edit-link" onClick={() => setFirst(!first)}>
            First time signing in?
          </button>
        </div>
        <div className="login-message">
          <p>Splunk Engineer Sandbox · v3</p>
          <small>
            {first
              ? 'Enter any practice username or leave it blank. Sign In opens the sandbox as Administrator. Passwords are never stored.'
              : 'Local practice environment. No real credentials are required.'}
          </small>
        </div>
      </form>
      <div className="login-footer">Splunk UI reference · Local sandbox v3</div>
    </main>
  );
}
export function PreferencesPage({ account = false }: { account?: boolean }) {
  const read = () => {
    try {
      return JSON.parse(profileStorage.getItem('splunk-v3-preferences') ?? '{}') as {
        defaultApp?: string;
        name?: string;
        email?: string;
      };
    } catch {
      return {};
    }
  };
  const [value, setValue] = useState(read);
  const [saved, setSaved] = useState(false);
  return (
    <main className="replica-page" tabIndex={-1}>
      <h1>{account ? 'Account Settings' : 'Preferences'}</h1>
      <form
        className="replica-form"
        onSubmit={(e) => {
          e.preventDefault();
          try {
            profileStorage.setItem('splunk-v3-preferences', JSON.stringify(value));
            setSaved(true);
          } catch {
            setSaved(false);
          }
        }}
      >
        <h2>{account ? 'Administrator' : 'User preferences'}</h2>
        {account ? (
          <>
            <label>
              <span>Username</span>
              <input value="admin" readOnly />
            </label>
            <label>
              <span>Full name</span>
              <input
                value={value.name ?? 'Administrator'}
                onChange={(e) => {
                  setValue({ ...value, name: e.target.value });
                  setSaved(false);
                }}
              />
            </label>
            <label>
              <span>Email address</span>
              <input
                type="email"
                value={value.email ?? ''}
                onChange={(e) => {
                  setValue({ ...value, email: e.target.value });
                  setSaved(false);
                }}
              />
            </label>
            <label>
              <span>Roles</span>
              <span>admin</span>
            </label>
            <p className="replica-muted">
              Local profile metadata only. This sandbox has no authentication service.
            </p>
          </>
        ) : (
          <>
            <label>
              <span>Default app</span>
              <select
                value={value.defaultApp ?? '#/home'}
                onChange={(e) => {
                  setValue({ ...value, defaultApp: e.target.value });
                  setSaved(false);
                }}
              >
                <option value="#/home">Home</option>
                <option value="#/search">Search &amp; Reporting</option>
                <option value="#/monitoring">Monitoring Console</option>
                <option value="#/fleet">Engineer Sandbox</option>
              </select>
            </label>
            <label>
              <span>Theme</span>
              <span>Dark — captured Splunk Enterprise appearance</span>
            </label>
            <p className="replica-muted">
              The default app opens when you choose Sign In on the practice login screen.
            </p>
          </>
        )}
        <div className="form-actions">
          <a href="#/home">Cancel</a>
          <button type="submit" className="replica-primary">
            Save
          </button>
          {saved && <span role="status">Saved locally.</span>}
        </div>
      </form>
    </main>
  );
}
export function HelpPage() {
  return (
    <main className="replica-page" tabIndex={-1}>
      <h1>About Splunk Enterprise</h1>
      <p>UI reference: Splunk Enterprise 9.2.2, build d76edf6f0a15.</p>
      <h2>Splunk Engineer Sandbox v6</h2>
      <p>
        Operational practice target: Splunk Enterprise 9.4.1 with a simulated KV Store 7.0.0 fixture. Captured
        UI and app catalog metadata retain their original reference versions.
      </p>
      <p className="page-lead">
        This is a local reconstruction of your installed interface, powered by the sandbox’s simulated fleet,
        search engine and incidents. It is independent from the installed Splunk server.
      </p>
      <p>Use Apps → Engineer Sandbox for the terminal, fleet, tickets, interviews and saved sessions.</p>
      <p>
        <a href="#/catalog">Review captured UI and installed-view coverage</a>
      </p>
      <p>
        <a href="https://docs.splunk.com/Documentation/Splunk/9.2.2" target="_blank" rel="noreferrer">
          Open Splunk documentation ↗
        </a>
      </p>
    </main>
  );
}
export function UpgradePage() {
  const [tab, setTab] = useState('Splunk Platform Compatibility');
  return (
    <main className="replica-page" tabIndex={-1}>
      <h1>Upgrade Readiness App</h1>
      <nav className="home-tabs">
        {['Splunk Platform Compatibility', 'Python Compatibility', 'jQuery Compatibility', 'Settings'].map(
          (t) => (
            <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>
              {t}
            </button>
          ),
        )}
      </nav>
      <h2>{tab}</h2>
      <p className="page-lead">
        The app’s navigation and installed page entries were inventoried. Compatibility scanning requires the
        actual Splunk app runtime and is not performed by this simulator.
      </p>
      <div className="replica-toolbar">
        <a href="#/apps">View installed app metadata</a>
        <a href="#/catalog?app=python_upgrade_readiness_app">Browse compatibility views</a>
      </div>
    </main>
  );
}
