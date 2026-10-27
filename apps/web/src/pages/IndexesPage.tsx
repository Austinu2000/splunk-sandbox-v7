import { useState } from 'react';
import type { IndexCatalogEntry, IndexSettings, PracticePrincipal } from '@sandbox/shared';
import { usePoll } from '../usePoll';
import { request } from './TrainingPage';
import { Modal } from '../replica/Modal';
interface IndexView {
  host: string;
  hosts: { host: string; clustered: boolean }[];
  principal: PracticePrincipal;
  revision: string;
  indexes: IndexCatalogEntry[];
  declared: IndexCatalogEntry[];
}
const defaults: IndexSettings = {
  homePath: '',
  coldPath: '',
  thawedPath: '',
  datatype: 'event',
  frozenTimePeriodInSecs: 2592000,
  maxTotalDataSizeMB: 10000,
  disabled: false,
  repFactor: '0',
};
export function IndexesPage() {
  const [host, setHost] = useState(''),
    [principal, setPrincipal] = useState<PracticePrincipal>('admin');
  const data = usePoll(
    () => request<IndexView>('indexes?host=' + encodeURIComponent(host) + '&principal=' + principal),
    [host, principal],
    4000,
  );
  const [edit, setEdit] = useState<{
    name: string;
    settings: IndexSettings;
    create: boolean;
    revision: string;
  } | null>(null);
  const [error, setError] = useState(''),
    [notice, setNotice] = useState(''),
    [busy, setBusy] = useState(false);
  const view = data.data;
  const buckets = usePoll(
    () =>
      request<{
        buckets: {
          id: string;
          host: string;
          index: string;
          state: string;
          archived: boolean;
          path: string;
          eventCount: number;
        }[];
        scope: string;
      }>('indexes/buckets?host=' + encodeURIComponent(view?.host ?? host)),
    [view?.host, host],
    4000,
  );
  const clustered = view?.hosts.find((h) => h.host === view.host)?.clustered;
  const act = async (fn: () => Promise<unknown>) => {
    setError('');
    setBusy(true);
    try {
      await fn();
      await data.refresh();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };
  const rows = view?.declared ?? [];
  return (
    <main className="v5">
      <header className="v5-heading">
        <div>
          <span className="v5-eyebrow">SETTINGS · INDEX ADMINISTRATION</span>
          <h1>Indexes</h1>
          <p>Inspect effective configuration and manage standalone indexes.</p>
        </div>
        <a href="#/settings">Settings →</a>
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
      <div className="v5-toolbar">
        <label>
          Indexer{' '}
          <select
            value={view?.host ?? host}
            onChange={(e) => {
              setHost(e.target.value);
              setNotice('');
            }}
          >
            {view?.hosts.map((h) => (
              <option key={h.host} value={h.host}>
                {h.host} · {h.clustered ? 'Cluster peer' : 'Standalone'}
              </option>
            ))}
          </select>
        </label>
        <label>
          Practice principal{' '}
          <select value={principal} onChange={(e) => setPrincipal(e.target.value as PracticePrincipal)}>
            <option>admin</option>
            <option>analyst</option>
            <option>operator</option>
          </select>
        </label>
        <button
          disabled={!view || clustered || busy}
          onClick={() =>
            setEdit({ name: '', settings: { ...defaults }, create: true, revision: view!.revision })
          }
        >
          New Index
        </button>
      </div>
      <p className="v5-banner">
        Practice principals model capabilities and index access; this local app does not authenticate real
        users. Disk edits and running settings can differ.
      </p>
      {clustered && (
        <section className="v5-card">
          <h2>Cluster-managed indexes</h2>
          <p>
            Create or edit definitions on the Cluster Manager under{' '}
            <code>$SPLUNK_HOME/etc/manager-apps/_cluster/local/indexes.conf</code>. New clustered indexes
            require <code>repFactor = auto</code>. Validate and apply the bundle from the manager; direct peer
            creation is rejected.
          </p>
          <a href="#/terminal">Open Terminal →</a>
        </section>
      )}
      <div className="v5-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Retention</th>
              <th>Max size</th>
              <th>Status</th>
              <th>Configuration</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((index) => (
              <tr key={index.name}>
                <td>{index.name}</td>
                <td>{index.settings.datatype === 'metric' ? 'Metrics' : 'Events'}</td>
                <td>{index.settings.frozenTimePeriodInSecs.toLocaleString()} seconds</td>
                <td>{index.settings.maxTotalDataSizeMB.toLocaleString()} MB</td>
                <td>
                  {index.settings.disabled ? 'Disabled' : 'Enabled'}
                  {index.pending ? ' · Staged' : ''}
                </td>
                <td>
                  <details>
                    <summary>
                      {index.app} · {index.owner}
                    </summary>
                    <p>{index.sourcePath}</p>
                    <pre>{JSON.stringify(index.settings, null, 2)}</pre>
                    {index.issues.map((issue) => (
                      <p key={issue}>{issue}</p>
                    ))}
                  </details>
                </td>
                <td>
                  <button
                    disabled={clustered || busy}
                    onClick={() =>
                      setEdit({
                        name: index.name,
                        settings: { ...index.settings },
                        create: false,
                        revision: view!.revision,
                      })
                    }
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!rows.length && <p>No indexes available to this principal.</p>}
      {!clustered && rows.some((i) => i.pending) && (
        <button
          disabled={busy}
          onClick={() =>
            void act(async () => {
              await request('indexes/apply', { host: view!.host, principal });
              setNotice('Standalone indexer restarted; inspect the effective configuration.');
            })
          }
        >
          Restart standalone indexer to apply staged changes
        </button>
      )}
      <section className="v5-card">
        <h2>Recorded-data buckets</h2>
        <p>
          {buckets.data?.scope} Idle buckets roll to warm according to maxHotIdleSecs; maxWarmDBCount moves
          older warm buckets to cold. Time and size limits freeze whole buckets. Archive configuration
          preserves a frozen copy for an explicit restore.
        </p>
        <div className="v5-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Index / bucket</th>
                <th>State</th>
                <th>Events</th>
                <th>Storage path</th>
                <th>Recovery</th>
              </tr>
            </thead>
            <tbody>
              {buckets.data?.buckets.map((b) => (
                <tr key={b.id}>
                  <td>
                    {b.index}
                    <br />
                    {b.id}
                  </td>
                  <td>{b.state}</td>
                  <td>{b.eventCount}</td>
                  <td>{b.path}</td>
                  <td>
                    {b.state === 'frozen' && b.archived ? (
                      <button
                        disabled={busy}
                        onClick={() =>
                          void act(async () => {
                            await request('indexes/thaw', { id: b.id, principal });
                            setNotice(
                              'Archived bucket restored into thawed storage. Verify its events in Search.',
                            );
                            await buckets.refresh();
                          })
                        }
                      >
                        Restore archived bucket to thawed
                      </button>
                    ) : b.state === 'frozen' ? (
                      'No archive'
                    ) : b.state === 'thawed' ? (
                      'Restored'
                    ) : (
                      ''
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!buckets.data?.buckets.length && <p>No explicitly ingested data on this indexer yet.</p>}
      </section>
      {edit && (
        <Modal title={edit.create ? 'New Index' : 'Edit Index'} onClose={() => setEdit(null)}>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void act(async () => {
                const settings = { ...edit.settings };
                if (edit.create) {
                  settings.homePath ||= `$SPLUNK_DB/${edit.name}/db`;
                  settings.coldPath ||= `$SPLUNK_DB/${edit.name}/colddb`;
                  settings.thawedPath ||= `$SPLUNK_DB/${edit.name}/thaweddb`;
                }
                const result = await request<{ restartRequired: boolean }>('indexes', {
                  host: view!.host,
                  name: edit.name,
                  settings,
                  create: edit.create,
                  principal,
                  revision: edit.revision,
                });
                setNotice(
                  result.restartRequired
                    ? 'Changes saved on disk. Restart the standalone indexer to activate them.'
                    : 'Index configuration is active. Creating an index does not create events.',
                );
                setEdit(null);
              });
            }}
          >
            <div className="v5-fields">
              <label>
                Index name
                <input
                  required
                  disabled={!edit.create}
                  value={edit.name}
                  onChange={(e) => setEdit({ ...edit, name: e.target.value })}
                />
              </label>
              <label>
                Index type
                <select
                  value={edit.settings.datatype}
                  onChange={(e) =>
                    setEdit({
                      ...edit,
                      settings: { ...edit.settings, datatype: e.target.value as 'event' | 'metric' },
                    })
                  }
                >
                  <option value="event">Events</option>
                  <option value="metric">Metrics</option>
                </select>
              </label>
              <label>
                Retention in seconds
                <input
                  required
                  type="number"
                  min="1"
                  max="4294967295"
                  value={edit.settings.frozenTimePeriodInSecs}
                  onChange={(e) =>
                    setEdit({
                      ...edit,
                      settings: { ...edit.settings, frozenTimePeriodInSecs: Number(e.target.value) },
                    })
                  }
                />
              </label>
              <label>
                Maximum index size in MB
                <input
                  required
                  type="number"
                  min="1"
                  max="4294967295"
                  value={edit.settings.maxTotalDataSizeMB}
                  onChange={(e) =>
                    setEdit({
                      ...edit,
                      settings: { ...edit.settings, maxTotalDataSizeMB: Number(e.target.value) },
                    })
                  }
                />
              </label>
              {(['homePath', 'coldPath', 'thawedPath'] as const).map((key) => (
                <label key={key}>
                  {key}
                  <input
                    placeholder="Use default $SPLUNK_DB location"
                    value={edit.settings[key]}
                    onChange={(e) =>
                      setEdit({ ...edit, settings: { ...edit.settings, [key]: e.target.value } })
                    }
                  />
                </label>
              ))}
              {(['maxHotIdleSecs', 'maxWarmDBCount'] as const).map((key) => (
                <label key={key}>
                  {key}
                  <input
                    type="number"
                    min="0"
                    value={edit.settings[key] ?? (key === 'maxWarmDBCount' ? 300 : 0)}
                    onChange={(e) =>
                      setEdit({ ...edit, settings: { ...edit.settings, [key]: Number(e.target.value) } })
                    }
                  />
                </label>
              ))}
              <label>
                Frozen archive directory
                <input
                  value={edit.settings.coldToFrozenDir ?? ''}
                  onChange={(e) =>
                    setEdit({ ...edit, settings: { ...edit.settings, coldToFrozenDir: e.target.value } })
                  }
                />
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={edit.settings.disabled}
                  onChange={(e) =>
                    setEdit({ ...edit, settings: { ...edit.settings, disabled: e.target.checked } })
                  }
                />{' '}
                Disabled
              </label>
            </div>
            <button type="submit" disabled={busy}>
              {busy ? 'Saving…' : 'Save Index'}
            </button>
            <button type="button" onClick={() => setEdit(null)}>
              Cancel
            </button>
          </form>
        </Modal>
      )}
    </main>
  );
}
