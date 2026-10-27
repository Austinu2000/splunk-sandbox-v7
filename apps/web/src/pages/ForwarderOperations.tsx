import './forwarder-operations.css';
import { useState, useEffect } from 'react';
import { usePoll } from '../usePoll';
import { request } from './TrainingPage';
interface Draft {
  context: string;
  revision: string;
  host: string;
  serverclass: string;
  files: Record<string, string>;
  catalog: number | null;
}
export function DeploymentEditor({ mode }: { mode: 'apps' | 'serverclasses' }) {
  const view = usePoll(() => request<Draft>('ds/config'), [], 5000),
    [name, setName] = useState('v7_practice'),
    [path, setPath] = useState('local/inputs.conf'),
    [text, setText] = useState(
      '[monitor:///var/log/practice/source.log]\nindex = os\nsourcetype = v7_practice\ndisabled = false\n',
    ),
    [allow, setAllow] = useState('lab-lnx-0001'),
    [deny, setDeny] = useState(''),
    [apps, setApps] = useState('v7_practice'),
    [restart, setRestart] = useState(false),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  const data = view.data,
    parts = (v: string) =>
      v
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
  const [context, setContext] = useState('');
  const [revision, setRevision] = useState('');
  useEffect(() => {
    if (!context && data) {
      setContext(data.context);
      setRevision(data.revision);
    }
  }, [context, data?.context]);
  const stale = !!data && context !== data.context;
  const sourceChanged = !!data && revision !== data.revision;
  const act = async (route: string, body: object) => {
    if (!data) return;
    setBusy(true);
    setError('');
    try {
      const result = await request<{ revision: string }>(route, { ...body, context, revision });
      if (route !== 'ds/publish') setRevision(result.revision);
      await view.refresh();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="panel forwarder-operations">
      <h2>{mode === 'apps' ? 'Stage a deployment app file' : 'Stage a server class'}</h2>
      <p>
        Save source on the Deployment Server, then publish it. Clients download at their next successful
        phone-home. Changed apps activate after a restart when required.
      </p>
      {stale && (
        <p role="alert">
          Environment changed. Review its source before applying this form.{' '}
          <button
            onClick={() => {
              setContext(data!.context);
              setRevision(data!.revision);
            }}
          >
            Use current environment
          </button>
        </p>
      )}
      {!stale && sourceChanged && (
        <p role="alert">
          Staged source changed. Inspect the current files before continuing.{' '}
          <button onClick={() => setRevision(data!.revision)}>Use reviewed source revision</button>
        </p>
      )}
      {(error || view.error) && (
        <p className="error" role="alert">
          {error || view.error}
        </p>
      )}
      <div className="v5-toolbar">
        <label>
          {mode === 'apps' ? 'App' : 'Server class'} name{' '}
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        {mode === 'apps' ? (
          <>
            <label>
              Configuration file <input value={path} onChange={(e) => setPath(e.target.value)} />
            </label>
            <button
              disabled={busy || stale || !data?.files[name + '/' + path]}
              onClick={() => {
                setText(data!.files[name + '/' + path]!);
                setRevision(data!.revision);
              }}
            >
              Load current file
            </button>
          </>
        ) : (
          <>
            <label>
              Allow patterns, comma separated{' '}
              <input value={allow} onChange={(e) => setAllow(e.target.value)} />
            </label>
            <label>
              Exclude patterns, comma separated{' '}
              <input value={deny} onChange={(e) => setDeny(e.target.value)} />
            </label>
            <label>
              Apps, comma separated <input value={apps} onChange={(e) => setApps(e.target.value)} />
            </label>
            <label>
              <input type="checkbox" checked={restart} onChange={(e) => setRestart(e.target.checked)} />{' '}
              Restart clients when a selected app changes
            </label>
          </>
        )}
      </div>
      {mode === 'apps' && (
        <label className="v5-note">
          Configuration content
          <textarea rows={7} value={text} onChange={(e) => setText(e.target.value)} />
        </label>
      )}
      <div className="v5-actions">
        <button
          disabled={busy || stale || sourceChanged || !data}
          onClick={() =>
            void act(
              mode === 'apps' ? 'ds/apps' : 'ds/serverclasses',
              mode === 'apps'
                ? { name, files: { [path]: text } }
                : { name, whitelist: parts(allow), blacklist: parts(deny), apps: parts(apps), restart },
            )
          }
        >
          Stage {mode === 'apps' ? 'file' : 'server class'}
        </button>
        <button disabled={busy || stale || sourceChanged || !data} onClick={() => void act('ds/publish', {})}>
          Publish Deployment Server changes
        </button>
      </div>
      <p>
        Published catalog: {data?.catalog ?? 'reference fleet'}. Staging does not change client files. Package
        installation and service controls are available by selecting a client.
      </p>
      <details>
        <summary>Inspect staged serverclass.conf and available app files</summary>
        <pre>{data?.serverclass}</pre>
        <pre>
          {Object.keys(data?.files ?? {})
            .sort()
            .join('\n')}
        </pre>
      </details>
    </section>
  );
}
interface Client {
  context: string;
  host: string;
  os: string;
  installed: boolean;
  version: string | null;
  running: boolean;
  bootStart: boolean;
  owner: string;
  lastPhoneHome: number;
  error: string;
  downloadedCatalog: number | string;
  runningCatalog: number | string;
  apps: string[];
  changes: { time: number; kind: string; detail: string }[];
}
export function ForwarderOperations({ host }: { host: string }) {
  const view = usePoll(
      () => request<Client>('forwarders/detail?host=' + encodeURIComponent(host)),
      [host],
      4000,
    ),
    [pkg, setPackage] = useState('9.4.1'),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    d = view.data;
  const [context, setContext] = useState('');
  useEffect(() => {
    if (!context && d) setContext(d.context);
  }, [context, d?.context]);
  const stale = !!d && context !== d.context;
  const act = async (action: string) => {
    if (!d) return;
    setError('');
    setBusy(true);
    try {
      await request(action === 'advance' ? 'forwarders/advance' : 'forwarders/action', {
        context,
        ...(action === 'advance'
          ? {}
          : {
              host: d.host,
              action,
              package: '/opt/staging/splunkforwarder-' + pkg + '-simulated.x86_64.rpm',
            }),
      });
      await view.refresh();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="panel forwarder-operations">
      <h2>Client operations · {host}</h2>
      {stale && (
        <p role="alert">
          Environment changed. Inspect this client again before modifying it.{' '}
          <button onClick={() => setContext(d!.context)}>Use current environment</button>
        </p>
      )}
      {(error || view.error) && (
        <p className="error" role="alert">
          {error || view.error}
        </p>
      )}
      {d && (
        <>
          <p>
            Package: {d.installed ? d.version : 'not installed'} · Service:{' '}
            {d.running ? 'running' : 'stopped'} · Boot start: {d.bootStart ? 'enabled' : 'disabled'} · Owner:{' '}
            {d.owner}
          </p>
          <p>
            Downloaded catalog: {d.downloadedCatalog} · Running catalog: {d.runningCatalog} · Last phone-home:{' '}
            {new Date(d.lastPhoneHome).toISOString()}
          </p>
          <p role="status">{d.error || 'Deployment management endpoint is available.'}</p>
          <p>Downloaded apps: {d.apps.join(', ') || 'none'}</p>
          <div className="v5-toolbar">
            <button disabled={busy || stale} onClick={() => void act('track')}>
              Track client delivery
            </button>
            <button disabled={busy || stale} onClick={() => void act('advance')}>
              Advance simulation 60 seconds
            </button>
          </div>
          {d.os === 'linux' ? (
            <>
              <label>
                Local teaching package{' '}
                <select value={pkg} onChange={(e) => setPackage(e.target.value)}>
                  <option>9.3.2</option>
                  <option>9.4.1</option>
                </select>
              </label>
              <div className="v5-actions">
                <button disabled={busy || stale || !d.running} onClick={() => void act('stop')}>
                  Stop forwarder
                </button>
                <button
                  disabled={busy || stale || d.running}
                  onClick={() => void act(d.installed ? 'upgrade' : 'install')}
                >
                  {d.installed ? 'Upgrade' : 'Install'} package
                </button>
                <button
                  disabled={busy || stale || !d.installed || d.running}
                  onClick={() => void act('accept-start')}
                >
                  Accept training flag and start
                </button>
                <button
                  disabled={busy || stale || !d.installed || d.bootStart}
                  onClick={() => void act('enable-boot')}
                >
                  Enable boot start
                </button>
                <button disabled={busy || stale || !d.installed} onClick={() => void act('restart')}>
                  Restart to activate downloaded apps
                </button>
              </div>
              <p>
                Packages are bounded virtual teaching artifacts. No native installer or network download runs.
              </p>
            </>
          ) : (
            <p>
              Manage Windows configuration through deployment apps. Native Windows package installation and
              remote execution are not implemented.
            </p>
          )}
          <details>
            <summary>Lifecycle history</summary>
            <pre>
              {d.changes
                .map((c) => new Date(c.time).toISOString() + ' ' + c.kind + ': ' + c.detail)
                .join('\n') || 'No package or boot-start changes recorded.'}
            </pre>
          </details>
        </>
      )}
    </section>
  );
}
