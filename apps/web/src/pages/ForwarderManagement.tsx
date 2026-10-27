import { useState } from 'react';
import { HEALTH_LABELS } from '@sandbox/shared';
import { api } from '../api';
import { fmtAgo, fmtInt, HEALTH_COLORS } from '../format';
import { searchHash } from '../links';
import { usePoll } from '../usePoll';

export type DsTab = 'clients' | 'serverclasses' | 'apps';
export const DS_TABS: { tab: DsTab; label: string }[] = [
  { tab: 'clients', label: 'Clients' },
  { tab: 'serverclasses', label: 'Server classes' },
  { tab: 'apps', label: 'Apps' },
];
const PAGE = 50;

function Clients({
  now,
  serverClass,
  setServerClass,
  classes,
}: {
  now: number;
  serverClass: string;
  setServerClass: (s: string) => void;
  classes: string[];
}) {
  const [q, setQ] = useState('');
  const [offset, setOffset] = useState(0);
  const filter = serverClass === '(none)' ? { unmatched: true } : { serverClass: serverClass || undefined };
  const page = usePoll(
    () => api.dsClients({ offset, limit: PAGE, q, ...filter }),
    [offset, q, serverClass],
    5000,
  );
  const p = page.data;
  const pages = p ? Math.max(1, Math.ceil(p.total / PAGE)) : 1;
  const current = Math.floor(offset / PAGE) + 1;
  return (
    <section className="panel">
      <div className="panel-head">
        <div className="inputs compact">
          <label>
            Server class
            <select
              value={serverClass}
              onChange={(e) => {
                setOffset(0);
                setServerClass(e.target.value);
              }}
            >
              <option value="">All</option>
              {classes.map((c) => (
                <option key={c}>{c}</option>
              ))}
              <option value="(none)">(no server class)</option>
            </select>
          </label>
        </div>
        <input
          className="search"
          type="search"
          placeholder="Filter by hostname"
          value={q}
          onChange={(e) => {
            setOffset(0);
            setQ(e.target.value);
          }}
        />
      </div>
      {page.error && <div className="error">Could not load clients: {page.error}</div>}
      {p && (
        <>
          <div className="table-meta">
            <span>
              {p.total === 0
                ? 'No clients'
                : `${fmtInt(offset + 1)}–${fmtInt(Math.min(offset + PAGE, p.total))} of ${fmtInt(p.total)} clients`}
            </span>
            <span className="pager">
              <button disabled={current <= 1} onClick={() => setOffset(0)}>
                « First
              </button>
              <button disabled={current <= 1} onClick={() => setOffset(offset - PAGE)}>
                ‹ Prev
              </button>
              <span>
                Page {fmtInt(current)} of {fmtInt(pages)}
              </span>
              <button disabled={current >= pages} onClick={() => setOffset(offset + PAGE)}>
                Next ›
              </button>
            </span>
          </div>
          <div className="table-scroll">
            <table className="results">
              <thead>
                <tr>
                  <th>Host name</th>
                  <th>IP address</th>
                  <th>OS</th>
                  <th>Version</th>
                  <th>Phoned home</th>
                  <th>Server classes</th>
                  <th>Apps</th>
                </tr>
              </thead>
              <tbody>
                {p.items.map((c) => (
                  <tr key={c.hostname}>
                    <td title={HEALTH_LABELS[c.health]}>
                      <span className="dot" style={{ background: HEALTH_COLORS[c.health] }} />
                      {c.hostname}
                    </td>
                    <td className="mono">{c.ip}</td>
                    <td>{c.os}</td>
                    <td>{c.build}</td>
                    <td className={now - c.lastPhoneHome > 5 * 60_000 ? 'warn' : undefined}>
                      {fmtAgo(c.lastPhoneHome, now)}
                    </td>
                    <td className="wrap">
                      {c.serverClasses.join(', ') || <span className="warn">none</span>}
                    </td>
                    <td className="wrap">{c.apps.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}

export function ForwarderManagement({ tab, now }: { tab: DsTab; now: number }) {
  const overview = usePoll(() => api.dsOverview(), [], 5000);
  const [serverClass, setServerClass] = useState('');
  const o = overview.data;
  const showClients = (name: string) => {
    setServerClass(name);
    window.location.hash = '#/forwarders/clients';
  };
  return (
    <main className="dashboard">
      <div className="dash-header">
        <h1>Forwarder Management</h1>
        <p className="subtitle">
          Deployment server {o?.server ?? 'ds01'} · what it is running now. Edits to serverclass.conf or
          deployment-apps show here after <code>splunk reload deploy-server</code>.
        </p>
      </div>
      <nav className="tabs" aria-label="Forwarder Management views">
        {DS_TABS.map((t) => (
          <a
            key={t.tab}
            href={`#/forwarders/${t.tab}`}
            className={`tab-link ${t.tab === tab ? 'active' : ''}`}
          >
            {t.label}
          </a>
        ))}
      </nav>
      {overview.error && <div className="error">Could not load the deployment server: {overview.error}</div>}
      {o && (
        <div className="tiles">
          <div className="tile static">
            <div className="tile-value">{fmtInt(o.totalClients)}</div>
            <div className="tile-label">Clients</div>
          </div>
          <div className="tile static">
            <div className="tile-value">{o.serverClasses.length}</div>
            <div className="tile-label">Server classes</div>
          </div>
          <div className="tile static">
            <div className="tile-value">{o.apps.length}</div>
            <div className="tile-label">Deployment apps</div>
          </div>
          <div className="tile static" style={{ borderTopColor: o.unmatchedClients ? '#dc4e41' : '#53a051' }}>
            <div className="tile-value">{fmtInt(o.unmatchedClients)}</div>
            <div className="tile-label">Clients in no server class</div>
          </div>
          <div className="tile static">
            <div className="tile-value">{o.phoneHomeIntervalSeconds}s</div>
            <div className="tile-label">Phone-home interval</div>
          </div>
        </div>
      )}
      {tab === 'clients' && o && (
        <Clients
          now={now}
          serverClass={serverClass}
          setServerClass={setServerClass}
          classes={o.serverClasses.map((c) => c.name)}
        />
      )}
      {tab === 'serverclasses' && o && (
        <section className="panel">
          <div className="table-scroll">
            <table className="results">
              <thead>
                <tr>
                  <th>Server class</th>
                  <th>Whitelist</th>
                  <th>Blacklist</th>
                  <th>Apps</th>
                  <th className="num">Clients</th>
                </tr>
              </thead>
              <tbody>
                {o.serverClasses.map((c) => (
                  <tr key={c.name}>
                    <td>{c.name}</td>
                    <td className="mono wrap">{c.whitelist.join(', ')}</td>
                    <td className="mono wrap">{c.blacklist.join(', ') || '—'}</td>
                    <td className="wrap">{c.apps.join(', ')}</td>
                    <td className="num">
                      <button className="link-btn" onClick={() => showClients(c.name)}>
                        {fmtInt(c.clients)}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
      {tab === 'apps' && o && (
        <section className="panel">
          <div className="table-scroll">
            <table className="results">
              <thead>
                <tr>
                  <th>App</th>
                  <th>Server classes</th>
                  <th className="num">Clients</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {o.apps.map((a) => (
                  <tr key={a.name}>
                    <td>{a.name}</td>
                    <td className="wrap">
                      {a.serverClasses.join(', ') || <span className="warn">not in any server class</span>}
                    </td>
                    <td className="num">{fmtInt(a.clients)}</td>
                    <td>
                      {a.pendingReload ? (
                        <span
                          className="warn"
                          title="The files on disk differ from what the deployment server is serving"
                        >
                          Changed on disk; reload pending
                        </span>
                      ) : (
                        'Deployed'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mc-updated">
            <a
              href={searchHash(
                '| rest /services/deployment/server/clients splunk_server=ds01 | stats count by applications',
                '-15m',
                'now',
              )}
            >
              Open the clients REST endpoint in Search ↗
            </a>
          </p>
        </section>
      )}
    </main>
  );
}
