import { useState } from 'react';
import { usePoll } from '../usePoll';
import { request } from './TrainingPage';
interface InputView {
  host: string;
  hosts: string[];
  inputs: { stanza: string; sourcePath: string; settings: Record<string, string> }[];
  status: { source: string; index: string; read: number; written: number; error?: string; tick: number }[];
  recordedEvents: number;
}
export function AddDataPage() {
  const [host, setHost] = useState(''),
    [path, setPath] = useState('/var/log/practice/application.log'),
    [index, setIndex] = useState('main'),
    [sourcetype, setSourcetype] = useState('app_log'),
    [upload, setUpload] = useState(true),
    [content, setContent] = useState(
      'status=500 service=checkout message="Example application error"\nstatus=200 service=checkout message="Example request"\n',
    ),
    [notice, setNotice] = useState(''),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  const data = usePoll(() => request<InputView>('inputs?host=' + encodeURIComponent(host)), [host], 4000);
  const view = data.data;
  const [hecName, setHecName] = useState('application'),
    [token, setToken] = useState(''),
    [hecEvent, setHecEvent] = useState('{"status":200,"service":"checkout"}');
  return (
    <main className="v5">
      <header className="v5-heading">
        <div>
          <span className="v5-eyebrow">SETTINGS · DATA INPUTS</span>
          <h1>Add Data</h1>
          <p>Activate a monitor and verify the complete source-to-index path.</p>
        </div>
        <a href="#/settings/indexes">Manage indexes →</a>
      </header>
      {(error || data.error) && (
        <p role="alert" className="error">
          {error || data.error}
        </p>
      )}
      {notice && (
        <p role="status" className="v5-banner">
          {notice}
        </p>
      )}
      <section className="v5-card">
        <h2>File and directory monitoring</h2>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setError('');
            setBusy(true);
            void request<{ ingested: number }>('inputs/monitor', {
              host: view?.host,
              path,
              index,
              sourcetype,
              ...(upload ? { content } : {}),
            })
              .then(async (result) => {
                setNotice(
                  `Monitor is active. ${result.ingested} new events indexed. Inspect delivery errors and verify results in Search.`,
                );
                await data.refresh();
              })
              .catch((e) => setError(String(e)))
              .finally(() => setBusy(false));
          }}
        >
          <div className="v5-fields">
            <label>
              Source host
              <input
                list="input-hosts"
                value={host || view?.host || ''}
                onChange={(e) => setHost(e.target.value)}
              />
              <datalist id="input-hosts">
                {view?.hosts.map((h) => (
                  <option key={h} value={h} />
                ))}
              </datalist>
            </label>
            <label>
              Monitor path
              <input required value={path} onChange={(e) => setPath(e.target.value)} />
            </label>
            <label>
              Destination index
              <input required value={index} onChange={(e) => setIndex(e.target.value)} />
            </label>
            <label>
              Sourcetype
              <input required value={sourcetype} onChange={(e) => setSourcetype(e.target.value)} />
            </label>
          </div>
          <label>
            <input type="checkbox" checked={upload} onChange={(e) => setUpload(e.target.checked)} /> Create an
            uploaded training file under /var/log/practice/
          </label>
          {upload && (
            <label className="v5-note">
              Training file content
              <textarea value={content} onChange={(e) => setContent(e.target.value)} />
            </label>
          )}
          <p>
            Existing files can be monitored at other absolute virtual paths. A source needs a running service,
            readable files, a reachable receiver and an enabled destination index. Uploaded content is
            explicitly supplied data; creating an index alone adds no events.
          </p>
          <button type="submit" disabled={busy || !view}>
            {busy ? 'Activating…' : 'Activate monitor'}
          </button>
        </form>
      </section>
      <section className="v5-card">
        <h2>HTTP Event Collector</h2>
        <p>
          Create a training token on an indexer or heavy forwarder, then submit one JSON event. Tokens belong
          only to this simulated environment.
        </p>
        <div className="v5-fields">
          <label>
            Input name
            <input value={hecName} onChange={(e) => setHecName(e.target.value)} />
          </label>
          <label>
            Training token
            <input value={token} onChange={(e) => setToken(e.target.value)} />
          </label>
        </div>
        <p>
          Uses the source host, destination index and sourcetype above. The token is limited to that index.
        </p>
        <button
          disabled={busy || !view}
          onClick={() => {
            setBusy(true);
            setError('');
            void request<{ token: string }>('inputs/hec', {
              host: view!.host,
              name: hecName,
              index,
              sourcetype,
            })
              .then(async (result) => {
                setToken(result.token);
                setNotice('Training HEC input is active. Submit a test event to verify delivery.');
                await data.refresh();
              })
              .catch((e) => setError(String(e)))
              .finally(() => setBusy(false));
          }}
        >
          Save HEC input
        </button>
        <label className="v5-note">
          Event JSON
          <textarea value={hecEvent} onChange={(e) => setHecEvent(e.target.value)} />
        </label>
        <button
          disabled={busy || !token || !view}
          onClick={() => {
            setBusy(true);
            setError('');
            void Promise.resolve()
              .then(() =>
                request('inputs/hec/event', {
                  host: view!.host,
                  token,
                  index,
                  sourcetype,
                  event: JSON.parse(hecEvent),
                }),
              )
              .then(async () => {
                setNotice('HEC accepted one event. Verify the destination in Search.');
                await data.refresh();
              })
              .catch((e) => setError(String(e)))
              .finally(() => setBusy(false));
          }}
        >
          Send test event
        </button>
        <p>
          The terminal supports simulated{' '}
          <code>
            curl -k -H 'Authorization: Splunk TOKEN' https://HOST:8088/services/collector/event -d '
            {'{"event":"status=200","index":"INDEX"}'}'
          </code>
          . No real network request is sent.
        </p>
      </section>
      <section className="v5-card">
        <h2>Active inputs on {view?.host}</h2>
        {view?.inputs.map((input) => (
          <details key={input.stanza}>
            <summary>{input.stanza}</summary>
            <p>{input.sourcePath}</p>
            <pre>{JSON.stringify(input.settings, null, 2)}</pre>
          </details>
        ))}
        <p>{view?.recordedEvents ?? 0} recorded input events from this host.</p>
      </section>
      <section className="v5-card">
        <h2>Delivery verification</h2>
        {view?.status.length ? (
          view.status.map((s) => (
            <p key={s.source}>
              <code>{s.source}</code> → {s.index} · {s.written} events in last batch ·{' '}
              {s.error ? `Blocked: ${s.error}` : 'Delivered'} · tick {s.tick}
            </p>
          ))
        ) : (
          <p>No uploaded-file delivery recorded yet.</p>
        )}
        <a href={'#/search?q=' + encodeURIComponent('index=' + index + ' sourcetype=' + sourcetype)}>
          Verify in Search →
        </a>
        <p>
          Use Terminal for props.conf/transforms.conf, forwarding configuration and other supported input
          types. Editing files directly requires the appropriate restart or reload.
        </p>
      </section>
    </main>
  );
}
