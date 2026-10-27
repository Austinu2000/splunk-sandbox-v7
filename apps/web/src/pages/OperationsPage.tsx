import { api } from '../api';
import { usePoll } from '../usePoll';
import { currentProfile } from '../environment';
export function OperationsPage() {
  const status = usePoll(() => api.operations(), [], 5000);
  return (
    <main className="dashboard">
      <div className="dash-header">
        <h1>Operations · {currentProfile()?.name}</h1>
        <p className="subtitle">
          Live service state from the active environment. Inspect a host with{' '}
          <code>splunk show profile-status</code> in the terminal.
        </p>
      </div>
      {status.error && <div className="error">{status.error}</div>}
      <div className="environment-grid">
        {status.data
          ?.filter((h) => Object.keys(h.metrics).length > 1)
          .map((h) => (
            <section className="panel" key={h.host}>
              <h2>{h.host}</h2>
              <p className="muted">{h.role.replaceAll('_', ' ')}</p>
              <table className="results">
                <tbody>
                  {Object.entries(h.metrics).map(([k, v]) => (
                    <tr key={k}>
                      <td>{k}</td>
                      <td>{String(v)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ))}
      </div>
      <p className="muted">
        SSO, add-ons, clustering, Cribl evaluation and SOAR use local simulation models. No external
        credentials or services are contacted.
      </p>
    </main>
  );
}
