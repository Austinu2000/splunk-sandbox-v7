import { useEffect, useState } from 'react';
import type { CodeState } from '@sandbox/shared';
import { usePoll } from '../usePoll';
import { request } from './TrainingPage';
interface CodeView {
  context?: string;
  state: CodeState;
  repos: {
    id: string;
    branches: Record<string, string>;
    commits: Record<
      string,
      { id: string; message: string; tree: Record<string, { text: string; mode: number }> }
    >;
  }[];
  diffs: Record<string, string>;
}
export function CodePage() {
  const data = usePoll(() => request<CodeView>('code'), [], 4000);
  const [repoId, setRepo] = useState('splunk-automation'),
    [branch, setBranch] = useState('main'),
    [file, setFile] = useState('README.md'),
    [text, setText] = useState(''),
    [feature, setFeature] = useState('interview-practice'),
    [message, setMessage] = useState(''),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [check, setCheck] = useState(true),
    [limit, setLimit] = useState(''),
    [playbook, setPlaybook] = useState('playbooks/deploy_apps.yml');
  const repo = data.data?.repos.find((r) => r.id === repoId),
    tree = repo?.commits[repo.branches[branch] ?? repo.branches.main!]?.tree;
  const contents = tree?.[file]?.text ?? '';
  useEffect(() => setText(contents), [contents, file, repoId, branch]);
  const act = async (path: string, body: unknown) => {
    setError('');
    setBusy(true);
    try {
      await request(path, body);
      await data.refresh();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };
  const review = (action: string, id?: number, input?: Record<string, string>) =>
    act('code/review', { action, id, input });
  return (
    <main className="v5">
      <header className="v5-heading">
        <div>
          <span className="v5-eyebrow">V7 · LOCAL CODE SERVICE</span>
          <h1>Code & Ansible</h1>
          <p>Review source, validate changes and deploy into virtual hosts.</p>
        </div>
        <a href="#/training">Interview workbench →</a>
      </header>
      <div className="v5-banner">
        All repositories, reviews, CI checks and deployments on this page are simulated and saved locally.
        Terminal Git and this page share repository state.
      </div>
      {(error || data.error) && (
        <div className="error" role="alert">
          {error || data.error}
        </div>
      )}
      {!repo ? (
        <p>
          Open <a href="#/environments">Environments</a> and choose Practice Lab or APL to access automation
          repositories.
        </p>
      ) : (
        <>
          <div className="v5-toolbar">
            <label>
              Repository{' '}
              <select
                value={repoId}
                onChange={(e) => {
                  setRepo(e.target.value);
                  setFile('README.md');
                  setBranch('main');
                }}
              >
                {data.data!.repos.map((r) => (
                  <option key={r.id}>{r.id}</option>
                ))}
              </select>
            </label>
            <label>
              Branch{' '}
              <select value={branch} onChange={(e) => setBranch(e.target.value)}>
                {Object.keys(repo.branches).map((b) => (
                  <option key={b}>{b}</option>
                ))}
              </select>
            </label>
            <label>
              File{' '}
              <select value={file} onChange={(e) => setFile(e.target.value)}>
                {Object.keys(tree ?? {})
                  .sort()
                  .map((f) => (
                    <option key={f}>{f}</option>
                  ))}
              </select>
            </label>
          </div>
          <div className="v5-split">
            <section>
              <h2>Repository editor</h2>
              <label>
                File path
                <input aria-label="File path" value={file} onChange={(e) => setFile(e.target.value)} />
              </label>
              <textarea
                className="v5-code-editor"
                aria-label="File content"
                spellCheck={false}
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
              <div className="v5-fields">
                <label>
                  Feature branch
                  <input value={feature} onChange={(e) => setFeature(e.target.value)} />
                </label>
                <label>
                  Commit message
                  <input value={message} onChange={(e) => setMessage(e.target.value)} />
                </label>
              </div>
              <button
                disabled={busy || !message.trim()}
                onClick={() =>
                  act('code/commit', { repo: repoId, branch: feature, path: file, text, message })
                }
              >
                Commit to feature branch
              </button>
              <p>
                Editing a file does not change running Splunk. Check out or pull the branch in the terminal to
                continue there.
              </p>
            </section>
            <section>
              <h2>Open a pull request</h2>
              <p>
                Feature branch: <strong>{feature}</strong>
              </p>
              <button
                disabled={busy || !repo.branches[feature]}
                onClick={() =>
                  review('open', undefined, {
                    repo: repoId,
                    branch: feature,
                    title: message || `Review ${feature}`,
                  })
                }
              >
                Open PR
              </button>
              <h2>Run a playbook</h2>
              <p>
                Uses the selected branch. Check mode predicts changes on a disposable world. Supported modules
                run entirely inside the simulator.
              </p>
              <label className="v5-note">
                Playbook
                <input value={playbook} onChange={(e) => setPlaybook(e.target.value)} />
              </label>
              <label className="v5-note">
                Limit host or group
                <input
                  placeholder="indexers, idx01, or leave blank"
                  value={limit}
                  onChange={(e) => setLimit(e.target.value)}
                />
              </label>
              <label>
                <input type="checkbox" checked={check} onChange={(e) => setCheck(e.target.checked)} /> Check
                mode
              </label>
              <div className="v5-actions">
                <button
                  disabled={busy || repoId !== 'splunk-automation'}
                  onClick={() =>
                    act('code/run', {
                      context: data.data?.context,
                      expectedCommit: repo?.branches[branch],
                      repo: repoId,
                      branch,
                      path: playbook,
                      options: { syntax: true, limit: limit || undefined },
                    })
                  }
                >
                  Syntax check
                </button>
                <button
                  disabled={busy || repoId !== 'splunk-automation'}
                  onClick={() =>
                    act('code/run', {
                      context: data.data?.context,
                      expectedCommit: repo?.branches[branch],
                      repo: repoId,
                      branch,
                      path: playbook,
                      options: { check, diff: true, limit: limit || undefined },
                    })
                  }
                >
                  {check ? 'Preview changes' : 'Run playbook'}
                </button>
              </div>
            </section>
          </div>
          <h2>Pull requests</h2>
          {data.data!.state.reviews.length === 0 && (
            <p>No reviews yet. Commit to a feature branch, then open a PR.</p>
          )}
          {[...data.data!.state.reviews].reverse().map((pr) => (
            <article className="v5-card" key={pr.id}>
              <span className="v5-eyebrow">
                #{pr.id} · {pr.repo} · {pr.branch} · {pr.status}
              </span>
              <h3>{pr.title}</h3>
              <div className="v5-actions">
                {pr.status === 'open' ? (
                  <>
                    <button disabled={busy} onClick={() => review('check', pr.id)}>
                      Run checks
                    </button>
                    <button disabled={busy} onClick={() => review('approve', pr.id)}>
                      Record reviewer approval
                    </button>
                    <button disabled={busy} onClick={() => review('merge', pr.id)}>
                      Merge
                    </button>
                  </>
                ) : (
                  pr.repo === 'splunk-apps' && (
                    <button disabled={busy} onClick={() => review('deploy', pr.id)}>
                      {pr.deployed ? 'Retry deployment' : 'Deploy merged revision'}
                    </button>
                  )
                )}
                <button
                  disabled={busy}
                  onClick={() => {
                    const text = window.prompt('Review comment');
                    if (text) void review('comment', pr.id, { text });
                  }}
                >
                  Comment
                </button>
              </div>
              <p>
                Checks:{' '}
                {pr.check
                  ? pr.check.passed
                    ? 'Passed for ' + pr.check.head.slice(0, 8)
                    : 'Failed'
                  : 'Not run'}{' '}
                · Approval: {pr.approved?.slice(0, 8) ?? 'Not recorded'} · Deployment:{' '}
                {pr.deployed?.slice(0, 8) ?? 'Not deployed'}
              </p>
              {pr.check && <pre>{pr.check.messages.join('\n')}</pre>}
              <details>
                <summary>Diff</summary>
                <pre>{data.data!.diffs[pr.id] || 'No differences'}</pre>
              </details>
              {pr.comments.map((c, i) => (
                <p key={i}>{c}</p>
              ))}
            </article>
          ))}
          <h2>Scheduled automation</h2>
          <p>
            Practice the hotfix that keeps disappearing: schedule this playbook, edit a managed host, then
            advance the simulation clock. Fix the source in Git to make the correction durable.
          </p>
          <button
            disabled={busy || repoId !== 'splunk-automation'}
            onClick={() =>
              act('code/schedule', { repo: repoId, branch, path: playbook, interval: 60, limit })
            }
          >
            Schedule selected playbook every 60 ticks
          </button>
          {data.data!.state.schedules?.map((s) => (
            <p key={s.id}>
              #{s.id} {s.path} · next tick {s.nextTick} · {s.lastResult ?? 'Not run'}
            </p>
          ))}
          <h2>Automation run history</h2>
          {[...data.data!.state.runs].reverse().map((r, i) => (
            <details className="v5-card" key={`${r.id}-${i}`}>
              <summary>
                {r.id} · {r.syntax ? 'Syntax' : r.check ? 'Dry run' : 'Applied'} · changed {r.changed} ·
                failed {r.failed} · unreachable {r.unreachable}
              </summary>
              <p>Content revision: {r.revision}</p>
              <pre>{[...r.logs, ...r.hosts.flatMap((h) => [h.host, ...h.messages])].join('\n')}</pre>
            </details>
          ))}
        </>
      )}
    </main>
  );
}
