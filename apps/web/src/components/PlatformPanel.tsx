import { useState } from 'react';
import type { PlatformObservation } from '@sandbox/shared';
import { usePoll } from '../usePoll';
import { request } from '../pages/TrainingPage';
interface Snapshot {
  context: string;
  tick: number;
  services: { host: string; role: string; site: string; running: boolean }[];
  inputStatus: {
    host: string;
    source: string;
    index: string;
    read: number;
    written: number;
    error?: string;
  }[];
  recorded: {
    events: number;
    bytes: number;
    indexes: {
      host: string;
      index: string;
      events: number;
      activeBytes: number;
      frozenBytes: number;
      archivedBuckets: number;
    }[];
  };
  scheduler: { succeeded: number; failed: number; skipped: number };
  observations: PlatformObservation[];
}
export function PlatformPanel() {
  const poll = usePoll(() => request<Snapshot>('platform'), [], 4000),
    v = poll.data,
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  const inspect = async () => {
    if (!v) return;
    setBusy(true);
    setError('');
    try {
      await request('platform/inspect', { context: v.context });
      await poll.refresh();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="v5">
      <header className="v5-heading">
        <div>
          <span className="v5-eyebrow">V7 OPERATIONAL EVIDENCE</span>
          <h2>Recorded data and current services</h2>
          <p>
            These observations read the same services, input checkpoints, bucket lifecycle and report receipts
            used by the terminal and searches. Generated baseline graphs remain above.
          </p>
        </div>
        <button disabled={!v || busy} onClick={() => void inspect()}>
          Capture current platform evidence
        </button>
      </header>
      {(error || poll.error) && (
        <p role="alert" className="error">
          {error || poll.error}
        </p>
      )}
      {v && (
        <>
          <p>
            Recorded events: {v.recorded.events} · raw bytes: {v.recorded.bytes} · actual report runs:{' '}
            {v.scheduler.succeeded} succeeded, {v.scheduler.failed} failed, {v.scheduler.skipped} skipped.
          </p>
          <details open>
            <summary>Infrastructure services</summary>
            <div className="v5-table">
              <table>
                <thead>
                  <tr>
                    <th>Host</th>
                    <th>Role / site</th>
                    <th>Service</th>
                  </tr>
                </thead>
                <tbody>
                  {v.services.map((s) => (
                    <tr key={s.host}>
                      <td>{s.host}</td>
                      <td>
                        {s.role} / {s.site}
                      </td>
                      <td>{s.running ? 'Running' : 'Stopped'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
          <details>
            <summary>Actual recorded-input status</summary>
            <div className="v5-table">
              <table>
                <thead>
                  <tr>
                    <th>Host / source</th>
                    <th>Destination</th>
                    <th>Read / written</th>
                    <th>Last outcome</th>
                  </tr>
                </thead>
                <tbody>
                  {v.inputStatus.map((s, i) => (
                    <tr key={i}>
                      <td>
                        {s.host}
                        <br />
                        {s.source}
                      </td>
                      <td>{s.index}</td>
                      <td>
                        {s.read} bytes / {s.written} events
                      </td>
                      <td>{s.error ?? 'Accepted'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
          <details>
            <summary>Recorded storage and retention</summary>
            <div className="v5-table">
              <table>
                <thead>
                  <tr>
                    <th>Host / index</th>
                    <th>Events</th>
                    <th>Active / frozen bytes</th>
                    <th>Archived buckets</th>
                  </tr>
                </thead>
                <tbody>
                  {v.recorded.indexes.map((i) => (
                    <tr key={i.host + '|' + i.index}>
                      <td>
                        {i.host} / {i.index}
                      </td>
                      <td>{i.events}</td>
                      <td>
                        {i.activeBytes} / {i.frozenBytes}
                      </td>
                      <td>{i.archivedBuckets}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
          <details>
            <summary>Retained inspections</summary>
            <pre>{JSON.stringify(v.observations.slice(-10), null, 2)}</pre>
          </details>
        </>
      )}
    </section>
  );
}
