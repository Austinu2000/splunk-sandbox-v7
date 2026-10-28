import { useEffect, useState } from 'react';
import type { ServiceHealthEvaluation } from '@sandbox/shared';
import { request } from './TrainingPage';
interface View {
  context: string;
  initialized: boolean;
  revision: string;
  source: string;
  sourcePath: string;
  host: string;
  active: boolean;
  evaluations: ServiceHealthEvaluation[];
}
export function ServiceHealthPage() {
  const [v, setV] = useState<View | null>(null),
    [source, setSource] = useState(''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [notice, setNotice] = useState('');
  const review = async () => {
    setBusy(true);
    setError('');
    try {
      const next = await request<View>('service-health');
      setV(next);
      setSource(next.source);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => {
    void review();
  }, []);
  const act = async (action: string, fields: Record<string, unknown> = {}) => {
    if (!v) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await request('service-health/action', { context: v.context, revision: v.revision, action, ...fields });
      await review();
      setNotice('Operation retained. Evaluate after active configuration or actual source records change.');
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };
  const latest = v?.evaluations.at(-1);
  return (
    <main className="v5">
      <header className="v5-heading">
        <div>
          <span className="v5-eyebrow">V7 · SERVICE HEALTH PRACTICE</span>
          <h1>KPIs, dependencies and service impact</h1>
          <p>
            Evaluate actual read-only searches and virtual services, then trace a service’s score to its
            source evidence.
          </p>
        </div>
        <a href="#/terminal">Virtual terminal →</a>
      </header>
      <p className="v5-banner">
        Bounded ITSI concepts. This teaching JSON schema, weighted scores and dependency rule are separate
        from a native ITSI service export or full ITSI installation. Missing data is unknown, never a healthy
        zero.
      </p>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {notice && <p role="status">{notice}</p>}
      <button disabled={busy} onClick={() => void review()}>
        Review current service model
      </button>
      {v && !v.initialized && (
        <div className="v5-actions">
          <button disabled={busy} onClick={() => void act('initialize', { infrastructure: false })}>
            Add offline KPI recovery fixture
          </button>
          <button disabled={busy} onClick={() => void act('initialize', { infrastructure: true })}>
            Add offline infrastructure-impact fixture
          </button>
        </div>
      )}
      {v?.initialized && (
        <>
          <h2>Service model</h2>
          <p>
            {v.host}: {v.sourcePath}. Stage then activate the teaching model; it uses a bounded -Nm/-Nh time
            range and actual event searches or virtual-service availability.
          </p>
          <textarea
            aria-label="Service health model"
            rows={16}
            value={source}
            onChange={(e) => setSource(e.target.value)}
          />
          <div className="v5-actions">
            <button disabled={busy} onClick={() => void act('stage', { source })}>
              Stage service model
            </button>
            <button disabled={busy} onClick={() => void act('activate')}>
              Activate teaching service model
            </button>
            <button disabled={busy} onClick={() => void act('evaluate')}>
              Evaluate actual KPIs
            </button>
          </div>
          <p>
            Search thresholds are higher-is-worse: healthy=100, warning=50, critical=0. Scores include
            weighted own KPIs and the selected dependency KPIs (this teaching format selects all KPIs from
            each listed service). Importance 0 excludes a KPI; importance 11 forces critical when that KPI is
            critical. Unknown included inputs remain unknown unless a minimum-health critical KPI applies.
            Native ITSI has additional threshold, entity and dependency-selection controls.
          </p>
          {latest && (
            <>
              <h2>Captured evaluation at tick {latest.tick}</h2>
              <div className="v5-grid">
                {latest.services.map((s) => (
                  <section className="v5-card" key={s.id}>
                    <h3>
                      {s.name} · {s.state}
                    </h3>
                    <p>
                      Score {s.score === null ? 'unknown' : s.score.toFixed(1)} · own KPI score{' '}
                      {s.baseScore === null ? 'unknown' : s.baseScore.toFixed(1)}
                      {s.dependencyImpact ? ' · reduced by a dependency' : ''}
                    </p>
                    <p>Dependencies: {s.dependencies.join(', ') || 'none'}</p>
                    <div className="v5-table">
                      <table>
                        <thead>
                          <tr>
                            <th>KPI</th>
                            <th>Value / state</th>
                            <th>Source events scanned</th>
                          </tr>
                        </thead>
                        <tbody>
                          {s.kpis.map((k) => (
                            <tr key={k.id}>
                              <td>{k.id}</td>
                              <td>
                                {k.value ?? 'unknown'} / {k.state}
                              </td>
                              <td>{k.sourceRows}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <details>
                      <summary>Source searches and errors</summary>
                      <pre>{JSON.stringify(s.kpis, null, 2)}</pre>
                    </details>
                  </section>
                ))}
              </div>
            </>
          )}
          <details>
            <summary>Retained evaluation history</summary>
            <pre>{JSON.stringify(v.evaluations.slice(-10), null, 2)}</pre>
          </details>
          <p>
            Fixture data enters through idx01’s actual /var/log/practice/service-health.log monitor. The
            recovery sample is /opt/staging/v7-healthy-service-records.log on idx01. Advance beyond the
            one-minute error window, append fresh healthy source records and advance an input tick before
            evaluating. Infrastructure recovery uses the actual virtual Splunk service.
          </p>
        </>
      )}
    </main>
  );
}
