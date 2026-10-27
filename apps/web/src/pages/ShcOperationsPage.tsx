import { useState } from 'react';
import type { ClusterManagementState } from '@sandbox/shared';
import { usePoll } from '../usePoll';
import { request } from './TrainingPage';
import { Modal } from '../replica/Modal';

interface View {
  context: string;
  enabled: boolean;
  deployer?: string;
  revisions: Record<string, string>;
  health: {
    configured: boolean;
    majority: boolean;
    captain: string | null;
    term: number;
    available: number;
    quorumRequired: number;
    issues?: string[];
    members: { host: string; available: boolean; reason?: string }[];
  };
  sourceFiles: Record<string, string>;
  bundle?: { checksum: string; files: Record<string, string> };
  bundleError: string;
  bundleState: { members: { host: string; available: boolean; inSync: boolean }[] } | null;
  settings: Record<string, { running: Record<string, string>; declared: Record<string, string> }>;
  kv: { host: string; primary: string | null; status: string }[];
  objects: {
    kind: string;
    title: string;
    app: string;
    owner: string;
    sharing: string;
    consistent: boolean;
    members: { host: string; sourcePath: string; search?: string }[];
  }[];
  state: ClusterManagementState['shc'] | null;
  jobs: ClusterManagementState['jobs'];
}
interface Draft {
  context: string;
  host: string;
  revision: string;
  kind: 'source' | 'member';
  path: string;
  text: string;
  settings: Record<string, string>;
}
export function ShcOperationsPage() {
  const poll = usePoll(() => request<View>('shc'), [], 4000),
    view = poll.data;
  const [principal, setPrincipal] = useState('admin'),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [notice, setNotice] = useState(''),
    [draft, setDraft] = useState<Draft | null>(null);
  const write = async (action: string, fields: Record<string, unknown> = {}, context = view?.context) => {
    setBusy(true);
    setError('');
    try {
      const result = await request('shc/action', { context, principal, action, ...fields });
      setNotice(JSON.stringify(result, null, 2));
      await poll.refresh();
      return true;
    } catch (e) {
      setError(String(e));
      return false;
    } finally {
      setBusy(false);
    }
  };
  const locked = busy || principal !== 'admin',
    active = view?.jobs.some((j) => ['running', 'paused'].includes(j.status));
  const memberDraft = (host: string) =>
    setDraft({
      context: view!.context,
      host,
      revision: view!.revisions[host]!,
      kind: 'member',
      path: '',
      text: '',
      settings: { ...view!.settings[host]!.declared },
    });
  const sourceDraft = () => {
    const path = Object.keys(view!.sourceFiles)[0] ?? 'v7_status/local/savedsearches.conf';
    setDraft({
      context: view!.context,
      host: view!.deployer!,
      revision: view!.revisions[view!.deployer!]!,
      kind: 'source',
      path,
      text: view!.sourceFiles[path] ?? '',
      settings: {},
    });
  };
  return (
    <div className="v5">
      <header className="v5-heading">
        <div>
          <span className="v5-eyebrow">DISTRIBUTED ENVIRONMENT</span>
          <h1>Search head cluster operations</h1>
          <p>V7 operational practice · actual member services, Deployer source and replicated knowledge.</p>
        </div>
        <a href="#/kvstore">KV Store →</a>
      </header>
      {(error || poll.error) && (
        <p className="error" role="alert">
          {error || poll.error}
        </p>
      )}
      <div className="v5-toolbar">
        <label>
          Practice principal
          <select value={principal} onChange={(e) => setPrincipal(e.target.value)}>
            {['admin', 'analyst', 'operator'].map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </label>
        {view && !view.enabled ? (
          <button disabled={locked} onClick={() => void write('enable')}>
            Enable V7 operational practice
          </button>
        ) : (
          <button disabled={!view || locked} onClick={() => void write('advance')}>
            Advance one operation tick
          </button>
        )}
      </div>
      {view && (
        <>
          <section className="v5-card">
            <h2>Captain and majority</h2>
            <p>
              {view.health.configured
                ? 'Configured cluster'
                : 'This profile has no configured search head cluster'}{' '}
              · {view.health.available} available · majority requires {view.health.quorumRequired}
            </p>
            <p>
              SHC captain: <strong>{view.health.captain ?? 'Unavailable'}</strong> · election term{' '}
              {view.health.term}. KV Store primary: <strong>{view.kv[0]?.primary ?? 'Unavailable'}</strong>.
            </p>
            <p>
              SHC captain and KV Store primary are separate responsibilities. Elections here use a
              deterministic teaching model; they do not run real consensus software.
            </p>
            {view.health.issues?.map((i) => (
              <p key={i} role="alert">
                {i}
              </p>
            ))}
            <button
              disabled={locked || !view.enabled || !view.health.captain || active}
              onClick={() =>
                void write('rolling-restart', {
                  host: view.health.captain,
                  revision: view.revisions[view.health.captain!],
                })
              }
            >
              Start member rolling restart
            </button>
            <p>
              Each member must rejoin before the next stops; the captain restarts last. Pending membership
              settings require a separate coordinated configuration procedure.
            </p>
          </section>
          <section className="v5-card">
            <h2>Members</h2>
            <div className="v5-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Availability</th>
                    <th>Deployer defaults</th>
                    <th>Configuration and service</th>
                  </tr>
                </thead>
                <tbody>
                  {view.health.members.map((m) => (
                    <tr key={m.host}>
                      <td>
                        {m.host}
                        {m.host === view.health.captain ? ' · captain' : ''}
                      </td>
                      <td>{m.available ? 'Available' : (m.reason ?? 'Unavailable')}</td>
                      <td>
                        {view.bundleState?.members.find((s) => s.host === m.host)?.inSync
                          ? 'Matches current source'
                          : 'Review source or publish'}
                      </td>
                      <td>
                        <details>
                          <summary>Running and disk settings</summary>
                          <pre>{JSON.stringify(view.settings[m.host], null, 2)}</pre>
                        </details>
                        <button disabled={locked || !view.enabled} onClick={() => memberDraft(m.host)}>
                          Stage member settings
                        </button>
                        {(['stop', 'start', 'restart'] as const).map((operation) => (
                          <button
                            key={operation}
                            disabled={locked || !view.enabled || active}
                            onClick={() =>
                              void write('service', {
                                host: m.host,
                                revision: view.revisions[m.host],
                                operation,
                              })
                            }
                          >
                            {operation} {m.host}
                          </button>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <section className="v5-card">
            <h2>Deployer · {view.deployer ?? 'Not present'}</h2>
            <p>
              Source: $SPLUNK_HOME/etc/shcluster/apps · merge_to_default. A push preserves member local
              overrides and existing lookup data. It does not make inconsistent local definitions identical.
            </p>
            {view.bundleError && <p role="alert">{view.bundleError}</p>}
            <p>Reviewed source checksum: {view.bundle?.checksum ?? 'Unavailable'}</p>
            <div className="v5-toolbar">
              <button disabled={locked || !view.enabled || !view.deployer} onClick={sourceDraft}>
                Edit Deployer source
              </button>
              <button
                disabled={locked || !view.enabled || !view.deployer || !!view.bundleError || active}
                onClick={() =>
                  void write('publish', { host: view.deployer, revision: view.revisions[view.deployer!] })
                }
              >
                Publish reviewed SHC bundle
              </button>
            </div>
            <details>
              <summary>Inspect source and compiled defaults</summary>
              <pre>{JSON.stringify({ source: view.sourceFiles, compiled: view.bundle?.files }, null, 2)}</pre>
            </details>
          </section>
          <section className="v5-card">
            <h2>Knowledge object comparison</h2>
            <p>
              Comparison includes scope and effective definitions. Missing objects and local overrides remain
              visible. Runtime saves replicate on subsequent operation ticks while a majority is available.
            </p>
            <div className="v5-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Object / scope</th>
                    <th>Consistency</th>
                    <th>Member definitions</th>
                  </tr>
                </thead>
                <tbody>
                  {view.objects.map((o, i) => (
                    <tr key={i}>
                      <td>
                        {o.title} · {o.kind}
                        <br />
                        {o.app} / {o.owner} / {o.sharing}
                      </td>
                      <td>{o.consistent ? 'Consistent' : 'Different or missing'}</td>
                      <td>
                        {o.members.map((m) => (
                          <details key={m.host}>
                            <summary>{m.host}</summary>
                            <p>{m.sourcePath}</p>
                            {m.search && <pre>{m.search}</pre>}
                          </details>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p>
              Pending runtime updates:{' '}
              {view.state?.replication.filter((r) => r.completed.length < r.targets.length).length ?? 0}
            </p>
          </section>
          <section className="v5-card">
            <h2>Operation history</h2>
            {!view.jobs.length && <p>No coordinated SHC operations yet.</p>}
            {view.jobs
              .slice()
              .reverse()
              .map((j) => (
                <details key={j.id} open={['running', 'paused'].includes(j.status)}>
                  <summary>
                    {j.id} · {j.kind} · {j.status} · {j.completed.length}/{j.targets.length}
                  </summary>
                  <p>
                    {j.targets[j.cursor] ?? 'All members'} · {j.phase}
                  </p>
                  {j.error && <p role="alert">{j.error}</p>}
                  {j.status === 'paused' && (
                    <button disabled={locked} onClick={() => void write('resume', { jobId: j.id })}>
                      Resume after repair
                    </button>
                  )}
                  {['running', 'paused'].includes(j.status) && j.kind === 'shc-restart' && (
                    <button disabled={locked} onClick={() => void write('abort', { jobId: j.id })}>
                      Abort remaining restart
                    </button>
                  )}
                  <pre>{JSON.stringify(j.events, null, 2)}</pre>
                </details>
              ))}
            <details>
              <summary>Captain election evidence</summary>
              <pre>{JSON.stringify(view.state?.elections ?? [], null, 2)}</pre>
            </details>
          </section>
        </>
      )}
      {notice && (
        <details className="v5-card">
          <summary>Last operation</summary>
          <pre>{notice}</pre>
        </details>
      )}
      {draft && (
        <Modal
          title={draft.kind === 'source' ? 'Stage Deployer source' : 'Stage member settings: ' + draft.host}
          onClose={() => setDraft(null)}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void (async () => {
                const ok = await write(
                  draft.kind === 'source' ? 'stage' : 'stage-member',
                  {
                    host: draft.host,
                    revision: draft.revision,
                    ...(draft.kind === 'source'
                      ? { path: draft.path, text: draft.text }
                      : { settings: draft.settings }),
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
            {draft.kind === 'source' ? (
              <>
                <label className="v5-note">
                  Existing source
                  <select
                    value={draft.path}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        path: e.target.value,
                        text: view?.sourceFiles[e.target.value] ?? '',
                      })
                    }
                  >
                    {Object.keys(view?.sourceFiles ?? {}).map((p) => (
                      <option key={p}>{p}</option>
                    ))}
                  </select>
                </label>
                <label className="v5-note">
                  App-relative path
                  <input value={draft.path} onChange={(e) => setDraft({ ...draft, path: e.target.value })} />
                </label>
                <label className="v5-note">
                  Configuration source
                  <textarea
                    style={{ minHeight: 280, fontFamily: 'monospace' }}
                    value={draft.text}
                    onChange={(e) => setDraft({ ...draft, text: e.target.value })}
                  />
                </label>
              </>
            ) : (
              <>
                {Object.entries(draft.settings).map(([key, value]) => (
                  <label key={key} className="v5-note">
                    {key}
                    <input
                      value={value}
                      onChange={(e) =>
                        setDraft({ ...draft, settings: { ...draft.settings, [key]: e.target.value } })
                      }
                    />
                  </label>
                ))}
                <p>
                  Changes stay on disk until a member restart. Membership changes are not applied through an
                  ordinary rolling restart.
                </p>
              </>
            )}
            <button type="submit" disabled={locked}>
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
