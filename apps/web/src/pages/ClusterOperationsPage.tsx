import { useState } from 'react';
import type { ClusterManagementState, PracticePrincipal } from '@sandbox/shared';
import { usePoll } from '../usePoll';
import { request } from './TrainingPage';
import { Modal } from '../replica/Modal';
import { searchHash } from '../links';
interface Health {
  manager: string;
  managerAvailable: boolean;
  replicationFactor: number;
  searchFactor: number;
  replicationMet: boolean;
  searchFactorMet: boolean;
  allDataSearchable: boolean;
  maintenance: boolean;
  multisite: boolean;
  issues: string[];
  members: {
    host: string;
    site: string;
    nativeSite: string;
    joined: boolean;
    running: boolean;
    reason: string;
  }[];
  buckets: {
    id: string;
    sourceBucketId?: string;
    index?: string;
    originSite: string;
    stage: string;
    replicationMet: boolean;
    searchFactorMet: boolean;
    searchable: boolean;
    copies: { host: string; site: string; searchable: boolean; available: boolean }[];
  }[];
}
interface View {
  context: string;
  enabled: boolean;
  health: Health;
  managerRevision: string;
  revisions: Record<string, string>;
  configs: Record<string, { running: Record<string, string>; declared: Record<string, string> }>;
  bundle: { checksum: string; valid: boolean; issues: string[]; files: Record<string, string> };
  smartstore: {
    remoteAvailable: boolean;
    objects: { bucketId: string; key: string; bytes: number; cached: string[] }[];
    fetches: unknown[];
    evictions: unknown[];
    issues: { bucket: string; error: string }[];
  };
  state: ClusterManagementState | null;
  now: number;
}
interface Draft {
  context: string;
  host: string;
  revision: string;
  mode: 'config' | 'bundle';
  settings: Record<string, string>;
  path: string;
  text: string;
}
export function ClusterOperationsPage() {
  const data = usePoll(() => request<View>('clusters'), [], 4000),
    view = data.data,
    [principal, setPrincipal] = useState<PracticePrincipal>('admin'),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [notice, setNotice] = useState(''),
    [draft, setDraft] = useState<Draft | null>(null);
  const act = async (action: string, fields: Record<string, unknown> = {}, context = view?.context) => {
    setBusy(true);
    setError('');
    try {
      const result = await request('clusters/action', { context, principal, action, ...fields });
      setNotice(
        action === 'advance'
          ? 'Simulation advanced by one tick. Inspect service and job progress.'
          : JSON.stringify(result, null, 2),
      );
      await data.refresh();
      return true;
    } catch (e) {
      setError(String(e));
      return false;
    } finally {
      setBusy(false);
    }
  };
  const hostDraft = (host: string) =>
    setDraft({
      context: view!.context,
      host,
      revision: view!.revisions[host]!,
      mode: 'config',
      settings: Object.fromEntries(
        Object.entries(view!.configs[host]!.declared).filter(([k]) =>
          host === view!.health.manager
            ? [
                'mode',
                'replication_factor',
                'search_factor',
                'multisite',
                'site_replication_factor',
                'site_search_factor',
                'rolling_restart',
              ].includes(k)
            : ['mode', 'manager_uri', 'master_uri'].includes(k),
        ),
      ),
      path: '',
      text: '',
    });
  const editBundle = () => {
    const path = Object.keys(view!.bundle.files)[0] ?? '_cluster/local/indexes.conf';
    setDraft({
      context: view!.context,
      host: view!.health.manager,
      revision: view!.managerRevision,
      mode: 'bundle',
      settings: {},
      path,
      text: view!.bundle.files[path] ?? '',
    });
  };
  const active = view?.state?.jobs.find((j) => j.status === 'running' || j.status === 'paused'),
    readonly = principal !== 'admin' || busy;
  return (
    <div className="v5">
      <header className="v5-heading">
        <div>
          <span className="v5-eyebrow">SETTINGS</span>
          <h1>Indexer Clustering</h1>
          <p>Configuration, bucket copies and observable coordinated operations.</p>
        </div>
        <div>
          <a href="#/settings/shc-operations">SHC operations →</a> · <a href="#/kvstore">KV Store →</a>
        </div>
      </header>
      {(error || data.error) && (
        <p role="alert" className="error">
          {error || data.error}
        </p>
      )}
      <div className="v5-toolbar">
        <label>
          Practice principal
          <select value={principal} onChange={(e) => setPrincipal(e.target.value as PracticePrincipal)}>
            {['admin', 'analyst', 'operator'].map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </label>
        {!view?.enabled ? (
          <button disabled={!view || readonly} onClick={() => void act('enable')}>
            Enable V7 operational practice
          </button>
        ) : (
          <>
            <button disabled={readonly} onClick={() => void act('advance')}>
              Advance one operation tick
            </button>
            <button
              disabled={readonly || !!active}
              onClick={() => void act('maintenance', { enabled: !view.health.maintenance })}
            >
              {view.health.maintenance ? 'Disable' : 'Enable'} maintenance mode
            </button>
            <button
              disabled={readonly || !!active}
              onClick={() => void act('rolling-restart', { revision: view.managerRevision })}
            >
              Searchable rolling restart
            </button>
          </>
        )}
      </div>
      {!view?.enabled && (
        <p>
          Enable the phased model explicitly to practice delivery and service transitions. Existing source,
          events, saved attempts and reference bucket fixtures are retained.
        </p>
      )}
      {view && (
        <>
          <section className="v5-card">
            <h2>
              {view.health.manager} · {view.health.managerAvailable ? 'Available' : 'Unavailable'}
            </h2>
            <p>
              RF {view.health.replicationFactor}: {view.health.replicationMet ? 'met' : 'not met'} · SF{' '}
              {view.health.searchFactor}: {view.health.searchFactorMet ? 'met' : 'not met'} · All
              recorded/teaching buckets searchable: {view.health.allDataSearchable ? 'yes' : 'no'} ·
              Maintenance: {view.health.maintenance ? 'on' : 'off'}
            </p>
            {view.health.issues.map((i) => (
              <p key={i} role="alert">
                {i}
              </p>
            ))}
            <button disabled={readonly || !view.enabled} onClick={() => hostDraft(view.health.manager)}>
              Edit manager configuration
            </button>
            <button
              disabled={readonly || !view.enabled || !!active}
              onClick={() =>
                void act('restart-host', {
                  host: view.health.manager,
                  revision: view.revisions[view.health.manager],
                })
              }
            >
              Restart manager to apply disk configuration
            </button>
            <p>
              File edits stay staged. Searchable restarts verify other available searchable replicas before
              stopping a peer. Manager-controlled maintenance remains active during the coordinated job.
            </p>
          </section>
          <section className="v5-card">
            <h2>Peers</h2>
            <div className="v5-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Peer</th>
                    <th>Site</th>
                    <th>Membership / service</th>
                    <th>Configuration</th>
                  </tr>
                </thead>
                <tbody>
                  {view.health.members.map((m) => (
                    <tr key={m.host}>
                      <td>{m.host}</td>
                      <td>
                        {m.site} · {m.nativeSite}
                      </td>
                      <td>
                        {m.joined ? 'Joined' : m.reason}
                        <br />
                        {m.running ? 'Running' : 'Stopped'}
                      </td>
                      <td>
                        <details>
                          <summary>Running and disk settings</summary>
                          <pre>{JSON.stringify(view.configs[m.host], null, 2)}</pre>
                        </details>
                        <button disabled={readonly || !view.enabled} onClick={() => hostDraft(m.host)}>
                          Edit peer configuration
                        </button>
                        <button
                          disabled={readonly || !view.enabled || !!active}
                          onClick={() =>
                            void act('restart-host', { host: m.host, revision: view.revisions[m.host] })
                          }
                        >
                          Restart to apply
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <section className="v5-card">
            <h2>Site fault practice</h2>
            <p>
              Explicit lab control: stop the running indexers in one existing site, inspect searchable
              coverage, then restore only the peers stopped by that fault. The Cluster Manager and search
              heads stay available.
            </p>
            {[...new Set(view.health.members.map((m) => m.nativeSite))].map((site) => {
              const fault = view.state?.siteFaults?.[site],
                outage = !!fault && fault.restored === undefined;
              return (
                <button
                  key={site}
                  disabled={readonly || !view.enabled || !!active}
                  onClick={() => void act('site-outage', { site, enabled: !outage })}
                >
                  {outage ? 'Restore' : 'Simulate outage in'} {site}
                </button>
              );
            })}
          </section>
          <section className="v5-card">
            <h2>SmartStore recorded data and cache</h2>
            <p>
              Remote objects are simulated metadata for actual recorded buckets. No S3 account or network
              connection is used. Only successfully uploaded warm/cold data can be evicted; matching searches
              localize uncached objects.
            </p>
            <p>Remote transport: {view.smartstore.remoteAvailable ? 'available' : 'unavailable'}</p>
            <button
              disabled={readonly || !view.enabled}
              onClick={() => void act('remote-availability', { enabled: !view.smartstore.remoteAvailable })}
            >
              {view.smartstore.remoteAvailable ? 'Simulate remote outage' : 'Restore remote availability'}
            </button>
            {view.smartstore.issues.map((i) => (
              <p key={i.bucket} role="alert">
                {i.bucket}: {i.error}
              </p>
            ))}
            <div className="v5-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Recorded bucket / remote object</th>
                    <th>Local cache</th>
                    <th>Practice action</th>
                  </tr>
                </thead>
                <tbody>
                  {view.smartstore.objects.map((o) => (
                    <tr key={o.bucketId}>
                      <td>
                        {o.bucketId}
                        <br />
                        {o.key}
                        <br />
                        {o.bytes} bytes
                      </td>
                      <td>{o.cached.join(', ') || 'Not cached'}</td>
                      <td>
                        <button
                          disabled={readonly || !view.enabled || !o.cached.length}
                          onClick={() => void act('cache-evict', { bucketId: o.bucketId })}
                        >
                          Evict local cache
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!view.smartstore.objects.length && (
              <p>
                No uploaded recorded buckets. Configure a remote volume and remotePath through the manager
                bundle, ingest records, and let hot data roll warm.
              </p>
            )}
            <details>
              <summary>Actual fetch and eviction receipts</summary>
              <pre>
                {JSON.stringify(
                  { fetches: view.smartstore.fetches, evictions: view.smartstore.evictions },
                  null,
                  2,
                )}
              </pre>
            </details>
          </section>
          <section className="v5-card">
            <h2>Manager bundle</h2>
            <p>
              Disk checksum: {view.bundle.checksum}. Validation and publication are separate. A queued
              operation keeps its reviewed artifact even if the manager draft changes later.
            </p>
            {view.bundle.issues.map((i) => (
              <p key={i} role="alert">
                {i}
              </p>
            ))}
            <div className="v5-toolbar">
              <button disabled={readonly || !view.enabled} onClick={editBundle}>
                Edit bundle file
              </button>
              <button
                disabled={readonly || !view.enabled}
                onClick={() => void act('validate', { revision: view.managerRevision })}
              >
                Validate current bundle
              </button>
              <button
                disabled={
                  readonly ||
                  !view.enabled ||
                  !!active ||
                  !view.state?.validations.some((v) => v.valid && v.checksum === view.bundle.checksum)
                }
                onClick={() => void act('publish', { revision: view.managerRevision })}
              >
                Publish reviewed bundle
              </button>
            </div>
            <details>
              <summary>Inspect staged bundle</summary>
              <pre>{JSON.stringify(view.bundle.files, null, 2)}</pre>
            </details>
          </section>
          <section className="v5-card">
            <h2>Operation history</h2>
            {!view.state?.jobs.length && <p>No coordinated operations yet.</p>}
            {view.state?.jobs
              .slice()
              .reverse()
              .map((j) => (
                <article key={j.id}>
                  <h3>
                    {j.id} · {j.kind} · {j.status}
                  </h3>
                  <p>
                    {j.completed.length}/{j.targets.length} complete · {j.targets[j.cursor] ?? 'All targets'}{' '}
                    · {j.phase}
                  </p>
                  {j.error && <p role="alert">{j.error}</p>}
                  {j.status === 'paused' && (
                    <button disabled={readonly} onClick={() => void act('resume', { jobId: j.id })}>
                      Resume after repair
                    </button>
                  )}
                  {['running', 'paused'].includes(j.status) && !j.kind.endsWith('-bundle') && (
                    <button disabled={readonly} onClick={() => void act('abort', { jobId: j.id })}>
                      Abort remaining work
                    </button>
                  )}
                  <details>
                    <summary>Transition evidence</summary>
                    <pre>{JSON.stringify(j.events, null, 2)}</pre>
                  </details>
                </article>
              ))}
          </section>
          <section className="v5-card">
            <h2>Bucket copies</h2>
            <p>
              Recorded-data buckets are bound to their actual events. Existing reference buckets are labeled
              teaching fixtures. A bucket without any surviving copy is not recreated by fixup.
            </p>
            <div className="v5-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Bucket</th>
                    <th>Coverage</th>
                    <th>Copies</th>
                  </tr>
                </thead>
                <tbody>
                  {view.health.buckets.map((b) => (
                    <tr key={b.id}>
                      <td>
                        {b.id}
                        <br />
                        {b.sourceBucketId ? 'Recorded data · ' + b.index : 'Teaching fixture'} · {b.stage}
                      </td>
                      <td>
                        RF {b.replicationMet ? 'met' : 'not met'} · SF {b.searchFactorMet ? 'met' : 'not met'}
                        <br />
                        {b.searchable ? 'Searchable' : 'Unavailable'}
                      </td>
                      <td>
                        {b.copies.map((c) => (
                          <div key={c.host}>
                            {c.host} · {c.site} · {c.searchable ? 'searchable' : 'raw copy'} ·{' '}
                            {c.available ? 'available' : 'unavailable'}
                          </div>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <a
              href={searchHash(
                '| rest /services/cluster/manager/peers | table label site status is_searchable bucket_count',
              )}
            >
              Verify peers in Search →
            </a>
          </section>
        </>
      )}
      {notice && (
        <details open className="v5-card">
          <summary>Last operation</summary>
          <pre style={{ maxHeight: 240, overflow: 'auto' }}>{notice}</pre>
        </details>
      )}
      {draft && (
        <Modal
          title={
            draft.mode === 'config' ? 'Stage configuration for ' + draft.host : 'Stage manager bundle file'
          }
          onClose={() => setDraft(null)}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void (async () => {
                const ok = await act(
                  draft.mode === 'config' ? 'stage' : 'stage-bundle',
                  {
                    host: draft.host,
                    revision: draft.revision,
                    ...(draft.mode === 'config'
                      ? { settings: draft.settings }
                      : { path: draft.path, text: draft.text }),
                  },
                  draft.context,
                );
                if (ok) setDraft(null);
              })();
            }}
          >
            {error && (
              <p role="alert" className="error">
                {error}
              </p>
            )}
            {draft.mode === 'config' ? (
              <>
                {Object.entries(draft.settings).map(([key, value]) => (
                  <label className="v5-note" key={key}>
                    {key}
                    <input
                      value={value}
                      onChange={(e) =>
                        setDraft({ ...draft, settings: { ...draft.settings, [key]: e.target.value } })
                      }
                    />
                  </label>
                ))}
                {draft.host === view?.health.manager && (
                  <button
                    type="button"
                    onClick={() =>
                      setDraft({
                        ...draft,
                        settings: {
                          ...draft.settings,
                          multisite: 'true',
                          site_replication_factor: 'origin:1,site1:1,site2:1,total:3',
                          site_search_factor: 'origin:1,site1:1,site2:1,total:2',
                        },
                      })
                    }
                  >
                    Add multisite policy fields
                  </button>
                )}
                <p>
                  Staging does not change the running service. Review, then restart the selected component to
                  activate it.
                </p>
              </>
            ) : (
              <>
                <label>
                  Existing bundle file
                  <select
                    value={draft.path}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        path: e.target.value,
                        text: view!.bundle.files[e.target.value] ?? '',
                      })
                    }
                  >
                    {Object.keys(view?.bundle.files ?? {}).map((p) => (
                      <option key={p}>{p}</option>
                    ))}
                  </select>
                </label>
                <label className="v5-note">
                  Bundle-relative path
                  <input value={draft.path} onChange={(e) => setDraft({ ...draft, path: e.target.value })} />
                </label>
                <label className="v5-note">
                  Configuration source
                  <textarea
                    style={{ minHeight: 260, fontFamily: 'monospace' }}
                    value={draft.text}
                    onChange={(e) => setDraft({ ...draft, text: e.target.value })}
                  />
                </label>
              </>
            )}
            <button disabled={readonly} type="submit">
              Stage reviewed source
            </button>
            <button type="button" onClick={() => setDraft(null)}>
              Cancel
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
