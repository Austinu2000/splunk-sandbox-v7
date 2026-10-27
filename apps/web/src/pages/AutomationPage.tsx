import { useState } from 'react';
import type { AutomationRun } from '@sandbox/shared';
import { usePoll } from '../usePoll';
import { request } from './TrainingPage';

interface AutomationView {
  context?: string;
  starters?: { revision: string; files: { path: string; status: 'missing' | 'present' | 'conflict' }[] };
  enabled: boolean;
  host?: string;
  root?: string;
  branch?: string;
  committedBranches?: Record<string, string>;
  source?: string;
  settings?: Record<string, string>;
  inventory?: {
    source: string;
    graph: string;
    groups: Record<string, { hosts: string[]; children: string[]; vars: Record<string, unknown> }>;
    hostvars: Record<string, Record<string, unknown>>;
    drift: { missing: string[]; unknown: string[]; unreachable: string[] };
  } | null;
  error?: string;
  playbooks?: { path: string; text: string }[];
  roles?: string[];
  runs?: AutomationRun[];
  deployments?: { id: number; title: string; revision: string }[];
}
const tabs = [
  'Inventory',
  'Playbooks & Roles',
  'Deployment Center',
  'Run History',
  'Troubleshooting',
] as const;
export function AutomationPage() {
  const data = usePoll(() => request<AutomationView>('automation'), [], 4000);
  const [tab, setTab] = useState<(typeof tabs)[number]>('Inventory');
  const [host, setHost] = useState('');
  const [pattern, setPattern] = useState('indexers');
  const [limit, setLimit] = useState('all');
  const [targets, setTargets] = useState<string[] | null>(null);
  const [playbook, setPlaybook] = useState('playbooks/deploy_apps.yml');
  const [branch, setBranch] = useState('main');
  const [preview, setPreview] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const view = data.data;
  const inventory = view?.inventory;
  const act = async (run: () => Promise<unknown>) => {
    setError('');
    setBusy(true);
    try {
      await run();
      await data.refresh();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <main className="v5">
      <header className="v5-heading">
        <div>
          <span className="v5-eyebrow">V7 · AUTOMATION OPERATIONS</span>
          <h1>Automation Operations</h1>
          <p>Inspect inventory, target hosts and verify virtual deployments.</p>
        </div>
        <a href="#/code">Code & reviews →</a>
      </header>
      {(error || data.error || view?.error) && (
        <p role="alert" className="error">
          {error || data.error || view?.error}
        </p>
      )}
      {!view ? (
        <p>Loading automation…</p>
      ) : !view.enabled ? (
        <p>
          Select Practice Lab or APL in <a href="#/environments">Environments</a> to use the automation
          workspace.
        </p>
      ) : (
        <>
          <p className="v5-banner">
            Inventory reads the current working files on {view.host} at {view.root}. Deployment runs use the
            selected committed branch. Review and commit changes in Code or the terminal before deploying.
          </p>
          <div role="tablist" aria-label="Automation sections" className="v5-tabs">
            {tabs.map((name) => (
              <button key={name} role="tab" aria-selected={tab === name} onClick={() => setTab(name)}>
                {name}
              </button>
            ))}
          </div>
          {tab === 'Inventory' && (
            <section className="v5-card">
              <h2>Inventory & configuration</h2>
              <p>
                Source: <code>{inventory?.source}</code> · {Object.keys(inventory?.hostvars ?? {}).length}{' '}
                managed hosts
              </p>
              <div className="v5-toolbar">
                <label>
                  Host pattern <input value={pattern} onChange={(e) => setPattern(e.target.value)} />
                </label>
                <label>
                  Limit <input value={limit} onChange={(e) => setLimit(e.target.value)} />
                </label>
                <button
                  disabled={busy}
                  onClick={() =>
                    void act(async () => {
                      const result = await request<{ hosts: string[] }>(
                        'automation/targets?pattern=' +
                          encodeURIComponent(pattern) +
                          '&limit=' +
                          encodeURIComponent(limit),
                      );
                      setTargets(result.hosts);
                    })
                  }
                >
                  Preview targets
                </button>
              </div>
              {targets && (
                <p role="status">
                  {targets.length} targets: {targets.slice(0, 200).join(', ')}
                  {targets.length > 200 ? ' …' : ''}
                </p>
              )}
              <details>
                <summary>Inventory graph</summary>
                <pre>{inventory?.graph}</pre>
              </details>
              <label>
                Inspect host{' '}
                <select value={host} onChange={(e) => setHost(e.target.value)}>
                  <option value="">Choose a host</option>
                  {Object.keys(inventory?.hostvars ?? {})
                    .slice(0, 1000)
                    .map((name) => (
                      <option key={name}>{name}</option>
                    ))}
                </select>
              </label>
              {host && <pre>{JSON.stringify(inventory?.hostvars[host], null, 2)}</pre>}
              <details>
                <summary>Repository ansible.cfg settings</summary>
                <pre>{JSON.stringify(view.settings, null, 2)}</pre>
              </details>
            </section>
          )}
          {tab === 'Playbooks & Roles' && (
            <section className="v5-card">
              <h2>Playbooks & Roles</h2>
              {view.starters && (
                <details open={view.starters.files.some((f) => f.status === 'missing')}>
                  <summary>V7 operational starter files</summary>
                  <p>
                    Add the input role, connectivity and validation playbooks to the working tree. Review and
                    commit them before running a committed deployment. Adding files does not deploy them.
                  </p>
                  <ul>
                    {view.starters.files.map((f) => (
                      <li key={f.path}>
                        <code>{f.path}</code> · {f.status}
                      </li>
                    ))}
                  </ul>
                  <button
                    disabled={
                      busy ||
                      !view.starters.files.some((f) => f.status === 'missing') ||
                      view.starters.files.some((f) => f.status === 'conflict')
                    }
                    onClick={() =>
                      void act(() =>
                        request('automation/starters', {
                          context: view.context,
                          revision: view.starters!.revision,
                        }),
                      )
                    }
                  >
                    Add missing starter files
                  </button>
                </details>
              )}
              <p>Roles: {view.roles?.join(', ') || 'None'}</p>
              {view.playbooks?.map((file) => (
                <details key={file.path}>
                  <summary>{file.path}</summary>
                  <pre>{file.text}</pre>
                </details>
              ))}
              <p>
                Edit files and review diffs in <a href="#/code">Code & Ansible</a> or the{' '}
                <a href="#/terminal">terminal</a>.
              </p>
            </section>
          )}
          {tab === 'Deployment Center' && (
            <section className="v5-card">
              <h2>Scoped playbook execution</h2>
              <div className="v5-toolbar">
                <label>
                  Committed branch <input value={branch} onChange={(e) => setBranch(e.target.value)} />
                </label>
                <label>
                  Playbook{' '}
                  <select value={playbook} onChange={(e) => setPlaybook(e.target.value)}>
                    {view.playbooks?.map((p) => (
                      <option key={p.path}>{p.path}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Limit <input value={limit} onChange={(e) => setLimit(e.target.value)} />
                </label>
                <label>
                  <input type="checkbox" checked={preview} onChange={(e) => setPreview(e.target.checked)} />{' '}
                  Check mode with diff
                </label>
                <button
                  disabled={busy}
                  onClick={() =>
                    void act(async () => {
                      await request('code/run', {
                        repo: 'splunk-automation',
                        context: view.context,
                        expectedCommit: view.committedBranches?.[branch],
                        branch,
                        path: playbook,
                        options: { check: preview, diff: true, limit },
                      });
                      setTab('Run History');
                    })
                  }
                >
                  {preview ? 'Preview deployment' : 'Run deployment'}
                </button>
              </div>
              <h3>Reviewed app deployments</h3>
              {view.deployments?.length ? (
                view.deployments.map((d) => (
                  <p key={d.id}>
                    {d.title} · {d.revision.slice(0, 12)}
                  </p>
                ))
              ) : (
                <p>No reviewed apps deployed.</p>
              )}
            </section>
          )}
          {tab === 'Run History' && (
            <section className="v5-card">
              <h2>Run History</h2>
              {view.runs?.length ? (
                view.runs.map((run, n) => (
                  <details key={run.id + ':' + n}>
                    <summary>
                      {run.id} · {run.syntax ? 'Syntax' : run.check ? 'Check' : 'Apply'} · changed{' '}
                      {run.changed}, failed {run.failed}, unreachable {run.unreachable}
                    </summary>
                    <p>
                      <code>{run.playbook ?? 'Legacy playbook run'}</code> · Source {run.revision}
                      {run.commit && <> · Commit {run.commit.slice(0, 12)}</>}
                    </p>
                    <pre>
                      {[...run.logs, ...run.hosts.flatMap((h) => [h.host, ...h.messages])].join('\n')}
                    </pre>
                  </details>
                ))
              ) : (
                <p>No playbook runs recorded.</p>
              )}
            </section>
          )}
          {tab === 'Troubleshooting' && (
            <section className="v5-card">
              <h2>Inventory drift</h2>
              {inventory ? (
                <>
                  <p>Missing from inventory: {inventory.drift.missing.length}</p>
                  <pre>{inventory.drift.missing.slice(0, 200).join('\n')}</pre>
                  <p>Unknown/retired targets: {inventory.drift.unknown.length}</p>
                  <pre>{inventory.drift.unknown.slice(0, 200).join('\n')}</pre>
                  <p>Unreachable targets: {inventory.drift.unreachable.length}</p>
                  <pre>{inventory.drift.unreachable.slice(0, 200).join('\n')}</pre>
                </>
              ) : (
                <p>Repair the inventory syntax before comparing targets.</p>
              )}
              <p>
                Compare <code>ansible-inventory --graph</code>, <code>ansible-config dump</code> and the
                fleet. Inventory edits do not automatically deploy configurations.
              </p>
            </section>
          )}
        </>
      )}
    </main>
  );
}
