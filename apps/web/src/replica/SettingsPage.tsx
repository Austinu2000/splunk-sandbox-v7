import { AddDataPage } from '../pages/AddDataPage';
import { IndexesPage } from '../pages/IndexesPage';
import { currentProfile } from '../environment';
import { profileStorage } from '../environment';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { api } from '../api';
import { usePoll } from '../usePoll';
import { searchHash } from '../links';
import { settingsGroups, settingsPages } from './settingsCatalog';
import {
  defaultDefinition,
  hubs,
  tableDefinitions,
  type SettingRow,
  type TableDefinition,
  type HubItem,
} from './settingsData';
import { useKnowledge, readKnowledge, saveKnowledge, makeKnowledgeObject } from './knowledgeStore';
import { installedViews } from './viewCatalog';
import { viewHref } from './navigation';
import './settings.css';

const STORAGE = 'splunk-v3-settings:';
function read<T>(key: string, fallback: T): T {
  try {
    const value = profileStorage.getItem(STORAGE + key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}
function save(key: string, value: unknown) {
  profileStorage.setItem(STORAGE + key, JSON.stringify(value));
}
const slug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
const localHref = (id: string, title?: string) => '#/settings/' + id + (title ? '/' + slug(title) : '');

function Dialog({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    root.current?.querySelector<HTMLElement>('input,button,select,textarea')?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close.current();
      if (event.key === 'Tab' && root.current) {
        const nodes = [
          ...root.current.querySelectorAll<HTMLElement>(
            'button:not(:disabled),a[href],input:not(:disabled),textarea:not(:disabled),select:not(:disabled)',
          ),
        ];
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('keydown', key);
      previous?.focus();
    };
  }, []);
  return (
    <div
      className="rs-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="rs-modal" role="dialog" aria-modal="true" aria-label={title} ref={root}>
        <div className="rs-modal-title">
          <h2>{title}</h2>
          <button onClick={onClose} aria-label="Close dialog">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
function Info({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return (
    <Dialog title={title} onClose={onClose}>
      <div className="rs-modal-body">{children}</div>
      <div className="rs-modal-actions">
        <button onClick={onClose}>Close</button>
      </div>
    </Dialog>
  );
}
function Header({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="rs-heading">
      <div className="rs-heading-row">
        <h1>{title}</h1>
        <div className="rs-heading-actions">{children}</div>
      </div>
      {description && <p>{description}</p>}
    </div>
  );
}
function Notice({ children }: { children: ReactNode }) {
  return (
    <div className="rs-notice" role="status">
      ⓘ {children}
    </div>
  );
}

function SettingsTable({
  id,
  definition,
  dynamicRows,
  readOnly = false,
  extraActions,
  onRowsChange,
  onRowAction,
  hideTitle = false,
}: {
  id: string;
  definition: TableDefinition;
  dynamicRows?: SettingRow[];
  readOnly?: boolean;
  extraActions?: ReactNode;
  onRowsChange?: (rows: SettingRow[]) => void;
  onRowAction?: (label: string, row: SettingRow) => void;
  hideTitle?: boolean;
}) {
  const [storedRows, setRows] = useState<SettingRow[]>(() => read<SettingRow[]>(id, definition.rows));
  const [filter, setFilter] = useState('');
  const [app, setApp] = useState('*');
  const [owner, setOwner] = useState('*');
  const [popular, setPopular] = useState(true);
  const [category, setCategory] = useState('*');
  const [count, setCount] = useState(20);
  const [offset, setOffset] = useState(0);
  const [sort, setSort] = useState({ column: definition.columns[0]!, direction: 1 });
  const [edit, setEdit] = useState<{ index: number; row: SettingRow; title: string } | null>(null);
  const [remove, setRemove] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [info, setInfo] = useState<string | null>(null);
  const closeEdit = () => {
    setEdit(null);
    const [path, query] = window.location.hash.split('?');
    const params = new URLSearchParams(query);
    if (params.has('new')) {
      params.delete('new');
      window.history.replaceState(null, '', path + (params.size ? '?' + params.toString() : ''));
    }
  };
  const rows = dynamicRows ?? storedRows;
  const allRows = rows;
  const filtered = useMemo(
    () =>
      allRows
        .map((row, index) => ({ row, index }))
        .filter(
          ({ row }) =>
            Object.values(row).join(' ').toLowerCase().includes(filter.toLowerCase()) &&
            (app === '*' || row.App === app) &&
            (owner === '*' || row.Owner === owner) &&
            (id !== 'source-types' || !popular || row._popular === 'true') &&
            (category === '*' || row.Category === category),
        )
        .sort(
          (a, b) =>
            (a.row[sort.column] ?? '').localeCompare(b.row[sort.column] ?? '', undefined, { numeric: true }) *
            sort.direction,
        ),
    [allRows, filter, app, owner, sort, popular, category, id],
  );
  const write = (next: SettingRow[]) => {
    try {
      if (onRowsChange) onRowsChange(next);
      else {
        save(id, next);
        setRows(next);
      }
      setMessage('Saved to this browser’s practice configuration.');
    } catch {
      setMessage('Could not save. Browser storage may be full or unavailable.');
    }
  };
  const create = () =>
    setEdit({
      index: -1,
      row: Object.fromEntries(
        definition.columns
          .filter((c) => c !== 'Actions')
          .map((c) => [
            c,
            c === 'App'
              ? 'search'
              : c === 'Owner'
                ? 'admin'
                : c === 'Status'
                  ? 'Enabled'
                  : c === 'Sharing'
                    ? 'Private'
                    : '',
          ]),
      ),
      title: definition.newLabel ?? 'New entry',
    });
  useEffect(() => {
    if (
      new URLSearchParams(window.location.hash.split('?')[1] ?? '').get('new') === '1' &&
      definition.newLabel
    )
      create();
  }, []);
  const action = (label: string, index: number, row: SettingRow) => {
    if (onRowAction) {
      onRowAction(label, row);
      return;
    }
    if (readOnly) {
      setInfo(
        'These values come from the running simulated world. Use the sandbox terminal to edit the relevant configuration and apply the appropriate restart or reload.',
      );
      return;
    }
    if (label === 'Delete') setRemove(index);
    else if (label === 'Clone')
      setEdit({
        index: -1,
        row: {
          ...row,
          _id: '',
          Name: row.Name + ' (copy)',
          ...(row.Title ? { Title: row.Title + ' (copy)' } : {}),
        },
        title: 'Clone ' + (row.Title ?? row.Name),
      });
    else if (label === 'Disable' || label === 'Enable') {
      const next = [...rows];
      next[index] = { ...row, Status: row.Status === 'Disabled' ? 'Enabled' : 'Disabled' };
      write(next);
    } else if (label === 'Snooze') {
      const next = [...rows];
      next[index] = { ...row, 'Alert Status': row['Alert Status'] === 'Snoozed' ? 'Enabled' : 'Snoozed' };
      write(next);
    } else if (label === 'Pivot')
      window.location.hash = searchHash(
        row.Title?.includes('Audit')
          ? 'index=_audit | stats count by host'
          : 'index=_internal | stats count by host',
      );
    else setEdit({ index, row: { ...row }, title: label + ' ' + (row.Title ?? row.Name) });
  };
  const editColumns = definition.columns.filter(
    (c) =>
      ![
        'Actions',
        'Usage',
        'Log',
        'Setup',
        'Last Login',
        'Created',
        'Native Capabilities',
        'Inherited Capabilities',
      ].includes(c),
  );
  return (
    <>
      {!hideTitle ? (
        <Header title={definition.title} description={definition.description}>
          {extraActions}
          {definition.newLabel && (
            <button
              className="rs-primary"
              onClick={() =>
                readOnly
                  ? setInfo(
                      'Create or change this configuration through the simulated terminal. This listing reads the active World configuration.',
                    )
                  : create()
              }
            >
              {definition.newLabel}
            </button>
          )}
        </Header>
      ) : (
        <div className="rs-table-top-actions">
          {extraActions}
          {definition.newLabel && (
            <button className="rs-primary" onClick={create}>
              {definition.newLabel}
            </button>
          )}
        </div>
      )}
      {message && (
        <Notice>
          {message}
          <button className="rs-dismiss" aria-label="Dismiss notification" onClick={() => setMessage('')}>
            ×
          </button>
        </Notice>
      )}
      <div className="rs-toolbar">
        <span className="rs-count">
          {filtered.length.toLocaleString()} {definition.title}
        </span>
        {id === 'source-types' && (
          <>
            <label className="rs-check-inline">
              <input
                type="checkbox"
                checked={popular}
                onChange={(e) => {
                  setPopular(e.target.checked);
                  setOffset(0);
                }}
              />
              Show only popular
            </label>
            <select
              aria-label="Category"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setOffset(0);
              }}
            >
              <option value="*">All categories</option>
              {[...new Set(rows.map((row) => row.Category))].sort().map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </>
        )}
        {definition.scoped && (
          <>
            <label className="rs-select">
              App:{' '}
              <select
                aria-label="App"
                value={app}
                onChange={(e) => {
                  setApp(e.target.value);
                  setOffset(0);
                }}
              >
                <option value="*">All apps</option>
                {[...new Set(allRows.map((r) => r.App).filter(Boolean))].map((a) => (
                  <option key={a}>{a}</option>
                ))}
              </select>
            </label>
            <label className="rs-select">
              Owner:{' '}
              <select
                aria-label="Owner"
                value={owner}
                onChange={(e) => {
                  setOwner(e.target.value);
                  setOffset(0);
                }}
              >
                <option value="*">Any</option>
                {[...new Set(allRows.map((r) => r.Owner).filter(Boolean))].map((a) => (
                  <option key={a}>{a}</option>
                ))}
              </select>
            </label>
          </>
        )}
        <div className="rs-filter">
          <input
            aria-label="Filter entries"
            placeholder="filter"
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setOffset(0);
            }}
          />
          <span>⌕</span>
        </div>
        <div className="rs-pagination">
          <select
            aria-label="Results per page"
            value={count}
            onChange={(e) => {
              setCount(Number(e.target.value));
              setOffset(0);
            }}
          >
            {[10, 20, 50, 100].map((c) => (
              <option key={c} value={c}>
                {c} per page
              </option>
            ))}
          </select>
          {filtered.length > count && (
            <>
              <button disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - count))}>
                ‹ Prev
              </button>
              <span>{Math.floor(offset / count) + 1}</span>
              <button disabled={offset + count >= filtered.length} onClick={() => setOffset(offset + count)}>
                Next ›
              </button>
            </>
          )}
        </div>
      </div>
      <div className="rs-table-wrap">
        <table className="rs-table">
          <thead>
            <tr>
              {definition.columns.map((column) => (
                <th key={column}>
                  {column === 'Actions' ? (
                    column
                  ) : (
                    <button
                      onClick={() =>
                        setSort({ column, direction: sort.column === column ? -sort.direction : 1 })
                      }
                    >
                      {column}
                      <span className="rs-sort">
                        {sort.column === column ? (sort.direction === 1 ? '▴' : '▾') : '↕'}
                      </span>
                    </button>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.slice(offset, offset + count).map(({ row, index }) => (
              <tr key={index}>
                {definition.columns.map((column, ci) => (
                  <td key={column}>
                    {column === 'Actions' ? (
                      <div className="rs-row-actions">
                        {(definition.actions ?? ['Edit']).map((label) => (
                          <button key={label} onClick={() => action(label, index, row)}>
                            {label === 'Disable' && row.Status === 'Disabled' ? 'Enable' : label}
                          </button>
                        ))}
                      </div>
                    ) : ci === 0 ? (
                      <button className="rs-link" onClick={() => action('Edit', index, row)}>
                        {row[column] ?? row.Name}
                      </button>
                    ) : ['Usage', 'Log', 'Setup'].includes(column) ? (
                      <button
                        className="rs-link"
                        onClick={() =>
                          column === 'Log'
                            ? (window.location.hash = searchHash('index=_internal sourcetype=splunkd'))
                            : setInfo(
                                column === 'Usage'
                                  ? 'No alert action has been executed by this UI. Saved configuration is available for practice only.'
                                  : 'Alert delivery is not enabled in this offline sandbox. You can inspect and edit local action definitions.',
                              )
                        }
                      >
                        {row[column]}
                      </button>
                    ) : column === 'Status' || column === 'Alert Status' ? (
                      <span
                        className={/Enabled|Active/.test(row[column] ?? '') ? 'rs-enabled' : 'rs-disabled'}
                      >
                        {/Enabled|Active/.test(row[column] ?? '') ? '✓ ' : ''}
                        {row[column] ?? 'Enabled'}
                      </span>
                    ) : (
                      (row[column] ?? '—')
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="rs-empty">
            {filter ? 'No matching results found.' : (definition.empty ?? 'No entries found.')}
          </div>
        )}
      </div>
      {definition.note && <p className="rs-footnote">{definition.note}</p>}
      {edit && (
        <Dialog title={edit.title} onClose={closeEdit}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const key = definition.columns[0]!;
              if (!edit.row[key]?.trim()) return;
              const duplicate = rows.some(
                (row, i) => i !== edit.index && (row[key] ?? row.Name) === edit.row[key],
              );
              if (duplicate) {
                setMessage('An entry with this name already exists.');
                return;
              }
              const next = [...rows];
              const row = {
                ...edit.row,
                Name: edit.row.Name || edit.row.Title || '',
                ...(id === 'source-types' && !edit.row._popular ? { _popular: 'true' } : {}),
              };
              if (edit.index < 0) next.push(row);
              else next[edit.index] = row;
              write(next);
              closeEdit();
            }}
          >
            <div className="rs-modal-body">
              <p className="rs-practice-note">
                {onRowsChange
                  ? 'Saved searches are shared with Reports and Alerts. Queries run against the sandbox data; automatic scheduling and delivery are not implemented.'
                  : 'Practice configuration is stored locally in this browser. It does not change simulated host configuration, authentication, or search execution.'}
              </p>
              {editColumns.map((column, i) => (
                <label className="rs-field" key={column}>
                  <span>
                    {column}
                    {i === 0 && ' *'}
                  </span>
                  {column === 'Status' || column === 'Sharing' ? (
                    <select
                      value={edit.row[column] ?? ''}
                      onChange={(e) => setEdit({ ...edit, row: { ...edit.row, [column]: e.target.value } })}
                    >
                      {(column === 'Status'
                        ? ['Enabled', 'Disabled', 'Active']
                        : ['Private', 'App', 'Global']
                      ).map((value) => (
                        <option key={value}>{value}</option>
                      ))}
                    </select>
                  ) : column === 'Search string' || column === 'Description' || column === 'Predicate' ? (
                    <textarea
                      value={edit.row[column] ?? ''}
                      onChange={(e) => setEdit({ ...edit, row: { ...edit.row, [column]: e.target.value } })}
                    />
                  ) : (
                    <input
                      required={i === 0}
                      type={column === 'Email address' ? 'email' : 'text'}
                      value={edit.row[column] ?? ''}
                      onChange={(e) => setEdit({ ...edit, row: { ...edit.row, [column]: e.target.value } })}
                    />
                  )}
                </label>
              ))}
            </div>
            <div className="rs-modal-actions">
              <button type="button" onClick={closeEdit}>
                Cancel
              </button>
              <button className="rs-primary" type="submit">
                Save
              </button>
            </div>
          </form>
        </Dialog>
      )}
      {remove !== null && (
        <Dialog title="Delete entry" onClose={() => setRemove(null)}>
          <div className="rs-modal-body">
            <p>
              Delete <strong>{rows[remove]?.Title ?? rows[remove]?.Name}</strong> from this browser’s practice
              configuration?
            </p>
          </div>
          <div className="rs-modal-actions">
            <button onClick={() => setRemove(null)}>Cancel</button>
            <button
              className="rs-danger"
              onClick={() => {
                write(rows.filter((_, i) => i !== remove));
                setRemove(null);
              }}
            >
              Delete
            </button>
          </div>
        </Dialog>
      )}
      {info && (
        <Info title="Configuration details" onClose={() => setInfo(null)}>
          <p>{info}</p>
          {readOnly && (
            <a href="#/terminal" onClick={() => setInfo(null)}>
              Open sandbox terminal →
            </a>
          )}
        </Info>
      )}
    </>
  );
}

function HubPage({ id }: { id: string }) {
  const hub = hubs[id]!;
  return (
    <>
      <Header title={settingsPages[id]?.label ?? id} description={hub.description} />
      <div className={'rs-hub ' + (id === 'server-settings' ? 'rs-hub-simple' : '')}>
        <table className="rs-table">
          <thead>
            {id !== 'server-settings' && (
              <tr>
                <th>Type</th>
                <th>Actions</th>
              </tr>
            )}
          </thead>
          <tbody>
            {hub.items.map((item) => (
              <tr key={item.label}>
                <td>
                  <a href={item.href ?? localHref(id, item.label)}>{item.label}</a>
                  {item.description && <p>{item.description}</p>}
                </td>
                {item.add && (
                  <td className="rs-hub-action">
                    <a href={localHref(id, item.label) + '?new=1'}>＋ Add new</a>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}


function Forwarding() {
  const groups = [
    {
      title: 'Forward data',
      description: 'Set up forwarding between two or more Splunk instances.',
      items: [{ label: 'Forwarding defaults' }, { label: 'Configure forwarding', add: true }],
    },
    {
      title: 'Receive data',
      description: 'Configure this instance to receive data forwarded from other instances.',
      items: [{ label: 'Configure receiving', add: true }],
    },
  ];
  return (
    <>
      <Header title="Forwarding and receiving" />
      <div className="rs-hub">
        {groups.map((group) => (
          <section key={group.title}>
            <h2>{group.title}</h2>
            <p>{group.description}</p>
            <table className="rs-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {group.items.map((item) => (
                  <tr key={item.label}>
                    <td>
                      <a href={localHref('forwarding-and-receiving', item.label)}>{item.label}</a>
                    </td>
                    <td>
                      {item.add && (
                        <a href={localHref('forwarding-and-receiving', item.label) + '?new=1'}>＋ Add new</a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))}
      </div>
    </>
  );
}

function Indexes() { return <IndexesPage />; }

function Licensing() {
  const state = usePoll(() => api.monitoring('license'), [], 10000);
  const [info, setInfo] = useState<string | null>(null);
  return (
    <>
      <Header title="Licensing" />
      <div className="rs-license">
        <p>
          This server is acting as a standalone license server{' '}
          <button
            className="rs-link"
            onClick={() =>
              setInfo(
                'License server relationships are represented in the sandbox infrastructure. Use the terminal to inspect lm01 and its configuration.',
              )
            }
          >
            Change to peer
          </button>
        </p>
        <section>
          <h2>Enterprise license group</h2>
          <button
            className="rs-link"
            onClick={() =>
              setInfo(
                'The sandbox uses a simulated Enterprise quota. Its volume and warnings are derived from the shared World state.',
              )
            }
          >
            Change license group
          </button>
          <p>This server is configured to use licenses from the Enterprise license group.</p>
          <div className="rs-button-row">
            <button
              onClick={() =>
                setInfo(
                  'A real license is not required. License files cannot be applied to this simulated environment.',
                )
              }
            >
              Add license
            </button>
            <a className="rs-button" href="#/monitoring/license">
              Usage report
            </a>
          </div>
        </section>
        <h3>Alerts</h3>
        <p>Licensing alerts notify you of excessive indexing warnings and licensing misconfigurations.</p>
        {state.error && <Notice>{state.error}</Notice>}
        <table className="rs-table">
          <tbody>
            {state.data?.stats
              .filter((stat) => stat.tone === 'warn' || stat.tone === 'bad')
              .map((stat) => (
                <tr key={stat.label}>
                  <td>{stat.label}</td>
                  <td>{stat.value}</td>
                </tr>
              ))}
            {state.data && !state.data.stats.some((stat) => stat.tone === 'warn' || stat.tone === 'bad') && (
              <tr>
                <td>No licensing alerts</td>
              </tr>
            )}
          </tbody>
        </table>
        <h2>Local server information</h2>
        <dl>
          <dt>Indexer name</dt>
          <dd>lm01</dd>
          <dt>License expiration</dt>
          <dd>No expiration — local simulation</dd>
          {state.data?.stats.map((stat) => (
            <div className="rs-dl-row" key={stat.label}>
              <dt>{stat.label}</dt>
              <dd>{stat.value}</dd>
            </div>
          ))}
          <dt>Debug information</dt>
          <dd>
            <a href="#/monitoring/license">All license details</a>
            <a href={searchHash('| rest /services/server/info | table splunk_server version server_roles')}>
              All indexer details
            </a>
          </dd>
        </dl>
      </div>
      {info && (
        <Info title="Licensing" onClose={() => setInfo(null)}>
          <p>{info}</p>
        </Info>
      )}
    </>
  );
}

function PasswordPolicy() {
  const defaults: Record<string, string> = {
    'Minimum characters': '8',
    Numeral: '0',
    Lowercase: '0',
    Uppercase: '0',
    'Special character': '0',
    Expiration: 'Disable',
    'Days until password expires': '90',
    'Expiration alert in days': '15',
    History: 'Disable',
    'Password history count': '24',
    'Constant login time': '0',
    'Login fail message': 'Verbose',
    'Force existing users to change weak passwords': 'false',
    Lockout: 'Enable',
    'Failed login attempts': '5',
    'Lockout threshold in minutes': '5',
    'Lockout duration in minutes': '30',
  };
  const [values, setValues] = useState(() => read('password-management', defaults));
  const [message, setMessage] = useState('');
  const field = (name: string, hint: string, disabled = false) => (
    <label className="rs-policy-field" key={name}>
      <span>{name}</span>
      <div>
        <input
          aria-label={name}
          type="number"
          step={name === 'Constant login time' ? 'any' : '1'}
          required
          min={name === 'Minimum characters' ? 1 : 0}
          max={name === 'Minimum characters' ? 256 : undefined}
          disabled={disabled}
          value={values[name] ?? ''}
          onChange={(e) => setValues({ ...values, [name]: e.target.value })}
        />
        <small>{hint}</small>
      </div>
    </label>
  );
  const toggle = (name: string, options = ['Enable', 'Disable']) => (
    <div className="rs-policy-field" key={name}>
      <span>{['Expiration', 'History', 'Lockout'].includes(name) ? '' : name}</span>
      <div className="rs-segment" role="group" aria-label={name}>
        {options.map((value) => (
          <button
            type="button"
            key={value}
            aria-pressed={values[name] === value}
            className={values[name] === value ? 'selected' : ''}
            onClick={() => setValues({ ...values, [name]: value })}
          >
            {value}
          </button>
        ))}
      </div>
    </div>
  );
  return (
    <>
      <Header
        title="Password Policy Management"
        description="ⓘ These Password Policy Management settings apply only to Internal Splunk Authentication, not to SAML or LDAP."
      />
      {message && <Notice>{message}</Notice>}
      <form
        className="rs-policy"
        onSubmit={(e) => {
          e.preventDefault();
          try {
            save('password-management', values);
            setMessage(
              'Password policy saved for practice. This single-user sandbox has no authentication enforcement.',
            );
          } catch {
            setMessage('Unable to save browser preferences.');
          }
        }}
      >
        <h3>Password Rules</h3>
        {field(
          'Minimum characters',
          'Must be a number between 1 and 256. For better security, we recommend a number between 8 and 256.',
        )}
        {field('Numeral', 'Minimum number of digits required.')}
        {field('Lowercase', 'Minimum number of lowercase letters required.')}
        {field('Uppercase', 'Minimum number of uppercase letters required.')}
        {field('Special character', 'Minimum number of printable ASCII characters.')}
        <h3>Expiration</h3>
        {toggle('Expiration')}
        {field(
          'Days until password expires',
          'Number of days until a password expires.',
          values.Expiration === 'Disable',
        )}
        {field(
          'Expiration alert in days',
          'Number of days before expiration when the warning first appears.',
          values.Expiration === 'Disable',
        )}
        <h3>History</h3>
        {toggle('History')}
        {field(
          'Password history count',
          'Number of passwords stored in history; a user cannot reuse stored passwords.',
          values.History === 'Disable',
        )}
        <h3>Login Settings</h3>
        {field(
          'Constant login time',
          'Set a time between .001 and 5 seconds. Set to 0 to disable the feature.',
        )}
        {toggle('Login fail message', ['Verbose', 'Simple'])}
        <label className="rs-check">
          <input
            type="checkbox"
            checked={values['Force existing users to change weak passwords'] === 'true'}
            onChange={(e) =>
              setValues({
                ...values,
                'Force existing users to change weak passwords': String(e.target.checked),
              })
            }
          />
          Force existing users to change weak passwords
        </label>
        <h3>Lockout</h3>
        {toggle('Lockout')}
        {field(
          'Failed login attempts',
          'Unsuccessful login attempts before a user is locked out.',
          values.Lockout === 'Disable',
        )}
        {field(
          'Lockout threshold in minutes',
          'Minutes until the failed login attempt counter resets.',
          values.Lockout === 'Disable',
        )}
        {field(
          'Lockout duration in minutes',
          'Minutes a user must wait before attempting login.',
          values.Lockout === 'Disable',
        )}
        <div className="rs-modal-actions">
          <button className="rs-primary" type="submit">
            Save
          </button>
        </div>
      </form>
    </>
  );
}

function Authentication() {
  const [state, setState] = useState(() =>
    read('authentication-methods', {
      external:
        currentProfile()?.auth.method === 'native'
          ? 'None'
          : (currentProfile()?.auth.method.toUpperCase() ?? 'None'),
      mfa: 'None',
    }),
  );
  const [message, setMessage] = useState('');
  return (
    <>
      <Header
        title="Authentication methods"
        description="Select an authentication method. Splunk supports native authentication as well as the following external methods:"
      />
      <div className="rs-auth">
        <h3>Internal</h3>
        <label>
          <input type="checkbox" checked disabled readOnly />
          Splunk Authentication (always on)
        </label>
        <h3>External</h3>
        <div className="rs-radio-list">
          {['None', 'LDAP', 'SAML'].map((label) => (
            <label key={label}>
              <input
                type="radio"
                name="external"
                checked={state.external === label}
                onChange={() => setState({ ...state, external: label })}
              />
              {label}
            </label>
          ))}
        </div>
        {state.external !== 'None' && (
          <Notice>
            {state.external} can be selected for UI practice. No external identity provider is contacted.
          </Notice>
        )}
        <h2>
          {currentProfile()?.auth.method === 'saml'
            ? 'SAML group mappings'
            : 'LDAP strategy and role mappings'}
        </h2>
        <table className="rs-table">
          <thead>
            <tr>
              <th>Group</th>
              <th>Roles</th>
            </tr>
          </thead>
          <tbody>
            {currentProfile()?.auth.roleMappings.map((m) => (
              <tr key={m.group}>
                <td>{m.group}</td>
                <td>{m.roles.join(', ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <h2>Multifactor Authentication</h2>
        <p>Not available with external authentication such as SAML.</p>
        <div className="rs-radio-list">
          {['None', 'Duo Security', 'RSA Security'].map((label) => (
            <label key={label}>
              <input
                type="radio"
                name="mfa"
                disabled={state.external === 'SAML'}
                checked={state.mfa === label}
                onChange={() => setState({ ...state, mfa: label })}
              />
              {label}
            </label>
          ))}
        </div>
        <button
          className="rs-link"
          onClick={() => {
            try {
              save('authentication-methods', state);
              setMessage('Practice selections saved. Authentication remains disabled in this local sandbox.');
            } catch {
              setMessage('Unable to save browser preferences.');
            }
          }}
        >
          Reload authentication configuration
        </button>
        {message && <Notice>{message}</Notice>}
      </div>
    </>
  );
}

function AddData() { return <AddDataPage />; }

function Instrumentation() {
  const [info, setInfo] = useState<string | null>(null);
  const world = usePoll(() => api.world(), [], 10000);
  const exportInfo = () => {
    const blob = new Blob([JSON.stringify({ kind: 'sandbox-diagnostic', world: world.data }, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sandbox-diagnostic.json';
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <>
      <Header
        title="Instrumentation"
        description="Configure automated reporting settings, view collected data, export data to file, work with diagnostic files, and send data to Splunk."
      />
      <div className="rs-instrument">
        <h2>
          Usage Data{' '}
          <button
            onClick={() =>
              setInfo(
                'Automated reporting is off. The sandbox runs offline and does not send usage data to Splunk.',
              )
            }
          >
            Usage Settings
          </button>
        </h2>
        <p>Configure automated reporting settings.</p>
        <p>
          View license usage, anonymized usage, and support usage data that has been collected (does not
          include browser session data).
        </p>
        <button onClick={exportInfo} disabled={!world.data}>
          Export
        </button>
        <table className="rs-table">
          <thead>
            <tr>
              {['Date Range', 'Actions', 'Time Sent', 'Status'].map((label) => (
                <th key={label}>{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={4}>No usage reports sent.</td>
            </tr>
          </tbody>
        </table>
        <h2>
          Diagnostic Log{' '}
          <button onClick={exportInfo} disabled={!world.data}>
            New Diag
          </button>
        </h2>
        <p>
          Diagnostic files contain information about your Splunk deployment, such as configuration files and
          logs, to help Splunk Support diagnose and resolve problems.
        </p>
        <table className="rs-table">
          <thead>
            <tr>
              {['Data', 'Nodes', 'Actions', 'Status', 'Size', 'Time Created'].map((label) => (
                <th key={label}>{label}</th>
              ))}
            </tr>
          </thead>
        </table>
        <div className="rs-empty">
          <h2>No Diags found</h2>
          <p>Create New Diags using the button above.</p>
          <small>The sandbox exports its simulated World information as JSON to your Downloads folder.</small>
        </div>
      </div>
      {info && (
        <Info title="Usage Settings" onClose={() => setInfo(null)}>
          <p>{info}</p>
        </Info>
      )}
    </>
  );
}

function Cluster() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState('Manager node');
  return (
    <>
      <Header title="Indexer Clustering" />
      <div className="rs-intro">
        <div className="rs-cluster-art" aria-hidden="true">
          ▣<span>╱ │ ╲</span>
          <span>▤ ▤ ▤</span>
        </div>
        <p>
          Indexer Clusters are groups of Splunk indexers configured to keep multiple copies of data. This
          increases data availability, data fidelity, data redundancy, and search performance.
        </p>
        <p>
          Indexer clustering is a complex feature, we recommend reading the documentation before enabling
          indexer clustering.
        </p>
        <button className="rs-primary" onClick={() => setOpen(true)}>
          Enable indexer clustering
        </button>
        <p>
          <a
            href={searchHash(
              '| rest /services/cluster/manager/peers | table label site status is_searchable bucket_count',
            )}
          >
            View simulated cluster peers
          </a>
        </p>
      </div>
      {open && (
        <Dialog title="Enable indexer clustering" onClose={() => setOpen(false)}>
          <div className="rs-modal-body">
            <p>Select the node type to explore its responsibilities.</p>
            {['Manager node', 'Peer node', 'Search head node'].map((label) => (
              <label className="rs-check" key={label}>
                <input
                  type="radio"
                  name="cluster-mode"
                  checked={mode === label}
                  onChange={() => setMode(label)}
                />
                {label}
              </label>
            ))}
            <Notice>
              {mode === 'Manager node'
                ? 'The manager coordinates replication, cluster membership, and the configuration bundle.'
                : mode === 'Peer node'
                  ? 'Peers index data and maintain searchable and replicated bucket copies.'
                  : 'Search heads distribute searches across the cluster’s searchable peers.'}
            </Notice>
            <p>
              The sandbox already models its cluster in World state. Configuration changes are made on cm01
              and indexer hosts through the simulated terminal.
            </p>
          </div>
          <div className="rs-modal-actions">
            <button onClick={() => setOpen(false)}>Cancel</button>
            <a href="#/terminal" className="rs-button rs-primary">
              Open terminal
            </a>
          </div>
        </Dialog>
      )}
    </>
  );
}

function Mobile() {
  return (
    <>
      <div className="rs-mobile-nav">
        <a href="#/settings/mobile-settings">Home</a>
        <a href="#/settings/mobile-settings">Administration</a>
        <a href="#/dashboards">Dashboards ▾</a>
      </div>
      <div className="rs-mobile">
        <div className="rs-phone" aria-hidden="true">
          <div>
            splunk<span>›</span>
          </div>
          <div className="rs-phone-bars">▂ ▅ ▃ █ ▆</div>
        </div>
        <div>
          <h1>Splunk Secure Gateway</h1>
          <p>
            Unleash the power of Splunk Mobile, TV &amp; AR. Monitor dashboards, view reports and receive
            actionable alerts anywhere at any time!
          </p>
          <p>
            By continuing, you acknowledge and accept Splunk Secure Gateway’s Specific Terms for Splunk
            Offerings.
          </p>
          <strong>To start using Splunk Secure Gateway, contact your administrator</strong>
          <p className="rs-footnote">Mobile pairing is unavailable in this offline sandbox.</p>
        </div>
      </div>
    </>
  );
}

function Controls() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Header title="Server controls" />
      <div className="rs-hub">
        <h2>Restart Splunk</h2>
        <p>Restart the Splunk server to apply configuration changes.</p>
        <button onClick={() => setOpen(true)}>Restart Splunk</button>
      </div>
      {open && (
        <Info title="Restart Splunk" onClose={() => setOpen(false)}>
          <p>
            Use the sandbox terminal to choose a simulated host and run <code>splunk restart</code>. The
            engine applies that host’s pending configuration and records the action.
          </p>
          <a href="#/terminal" onClick={() => setOpen(false)}>
            Open sandbox terminal →
          </a>
        </Info>
      )}
    </>
  );
}

function NestedSettings({ id, child }: { id: string; child: string }) {
  const item: HubItem | undefined = hubs[id]?.items.find((i) => slug(i.label) === child);
  const title =
    item?.label ??
    child
      .split('-')
      .map((word) => word[0]?.toUpperCase() + word.slice(1))
      .join(' ');
  const definition = defaultDefinition(title);
  if (id === 'server-settings')
    return (
      <>
        <Header title={title} />
        <LocalSettingsForm id={id + '/' + child} title={title} />
      </>
    );
  if (id === 'data-inputs')
    definition.columns = ['Name', 'Source Type', 'Index', 'Host', 'Status', 'Actions'];
  if (id === 'fields')
    definition.columns = ['Name', 'Source Type', 'Field', 'Expression', 'App', 'Owner', 'Sharing', 'Actions'];
  if (id === 'lookups')
    definition.columns = ['Name', 'Filename', 'Lookup fields', 'App', 'Owner', 'Sharing', 'Actions'];
  if (id === 'advanced-search')
    definition.columns = ['Name', 'Definition', 'Arguments', 'App', 'Owner', 'Sharing', 'Actions'];
  return (
    <>
      <a className="rs-breadcrumb" href={localHref(id)}>
        ‹ {settingsPages[id]?.label ?? 'Settings'}
      </a>
      <SettingsTable id={id + '/' + child} definition={definition} />
    </>
  );
}
function LocalSettingsForm({ id, title }: { id: string; title: string }) {
  const config: Record<string, Record<string, string>> = {
    'General settings': {
      'Server name': 'sh01',
      'Management port': '8089',
      'Web port': '8000',
      'Splunk database': '$SPLUNK_DB',
      'Default host name': 'sh01',
    },
    'Login background': { 'Background color': '#000000', 'Background image': '', 'Footer text': '' },
    'Global banner': { 'Banner text': '', 'Banner color': '#1e93c6', 'Banner visibility': 'Hidden' },
    'Internal Library Settings': { 'Python version': 'python3', 'Javascript library version': 'Default' },
    'Email settings': {
      'Mail server': 'localhost',
      'Email security': 'None',
      Sender: 'splunk',
      Subject: 'Splunk Alert: $name$',
    },
    'Server logging': { Logger: 'root', 'Logging level': 'INFO' },
    'Deployment client': { 'Target URI': 'ds01:8089', 'Phone home interval': '60', 'Client name': 'sh01' },
    'Search preferences': {
      'Default time range': 'Last 24 hours',
      'Search mode': 'Smart',
      'Search history limit': '1000',
    },
  };
  const [values, setValues] = useState(() => read(id, config[title] ?? { Name: '', Value: '' }));
  const [message, setMessage] = useState('');
  return (
    <form
      className="rs-local-form"
      onSubmit={(event) => {
        event.preventDefault();
        try {
          save(id, values);
          setMessage(
            'Practice preferences saved in this browser. Host configuration remains managed by the sandbox terminal.',
          );
        } catch {
          setMessage('Unable to save browser preferences.');
        }
      }}
    >
      {message && <Notice>{message}</Notice>}
      {Object.entries(values).map(([label, value]) => (
        <label className="rs-field" key={label}>
          <span>{label}</span>
          <input value={value} onChange={(e) => setValues({ ...values, [label]: e.target.value })} />
        </label>
      ))}
      <div className="rs-modal-actions">
        <a href="#/settings/server-settings" className="rs-button">
          Cancel
        </a>
        <button className="rs-primary" type="submit">
          Save
        </button>
      </div>
    </form>
  );
}
function Tabbed({ id }: { id: string }) {
  const tabs: Record<string, { label: string; key: string }[]> = {
    'federated-search': [
      { label: 'Federated Providers', key: 'federated-search' },
      { label: 'Federated Indexes', key: 'federated-indexes' },
    ],
    'workload-management': [
      { label: 'Admission Rules', key: 'workload-management' },
      { label: 'Workload Pools', key: 'workload-pools' },
      { label: 'Workload Rules', key: 'workload-rules' },
    ],
    'ingest-actions': [
      { label: 'Rulesets', key: 'ingest-actions' },
      { label: 'Destinations', key: 'ingest-destinations' },
    ],
  };
  const [selected, setSelected] = useState(id);
  const [info, setInfo] = useState(false);
  return (
    <>
      <Header title={tableDefinitions[id]!.title} description={tableDefinitions[id]!.description}>
        {id === 'ingest-actions' && <button onClick={() => setInfo(true)}>Deploy ▾</button>}
      </Header>
      <div className="rs-tabs" role="tablist" aria-label={tableDefinitions[id]!.title}>
        {tabs[id]!.map((tab) => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={selected === tab.key}
            className={selected === tab.key ? 'active' : ''}
            onClick={() => setSelected(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <SettingsTable key={selected} id={selected} hideTitle definition={tableDefinitions[selected]!} />
      {info && (
        <Info title="Deploy ingest actions" onClose={() => setInfo(false)}>
          <p>
            Rulesets are saved as browser-local practice definitions. Deployment requires a running Splunk
            ingestion service and is unavailable in this simulated environment.
          </p>
          <a href="#/terminal">Practise props.conf and transforms.conf in Terminal</a>
        </Info>
      )}
    </>
  );
}
function SettingsDirectory() {
  const [q, setQ] = useState('');
  return (
    <>
      <Header title="Settings" />
      <div className="rs-directory-search">
        <input
          aria-label="Find a setting"
          placeholder="Find a setting"
          value={q}
          onChange={(event) => setQ(event.target.value)}
        />
      </div>
      <div className="rs-directory">
        {settingsGroups.map((group) => (
          <section key={group.title}>
            <h2>{group.title}</h2>
            {group.items
              .filter((item) => item.label.toLowerCase().includes(q.toLowerCase()))
              .map((item) => (
                <a href={item.href} key={item.id}>
                  {item.label}
                </a>
              ))}
          </section>
        ))}
      </div>
    </>
  );
}

function Tokens() {
  const [open, setOpen] = useState(false);
  const [enabled, setEnabled] = useState(() => read('tokens-enabled', false));
  const [message, setMessage] = useState('');
  return (
    <>
      {message && <Notice>{message}</Notice>}
      <SettingsTable
        id="tokens"
        definition={tableDefinitions.tokens!}
        extraActions={<button onClick={() => setOpen(true)}>Token Settings</button>}
      />
      {open && (
        <Dialog title="Token Settings" onClose={() => setOpen(false)}>
          <div className="rs-modal-body">
            <label className="rs-check">
              <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
              Enable token authentication
            </label>
            <p>
              This option is a saved UI practice preference. Tokens listed here are configuration records;
              they do not grant access or authenticate requests.
            </p>
          </div>
          <div className="rs-modal-actions">
            <button onClick={() => setOpen(false)}>Cancel</button>
            <button
              className="rs-primary"
              onClick={() => {
                try {
                  save('tokens-enabled', enabled);
                  setMessage('Token setting saved for UI practice. Authentication remains disabled.');
                  setOpen(false);
                } catch {
                  setMessage('Unable to save browser preferences.');
                }
              }}
            >
              Save
            </button>
          </div>
        </Dialog>
      )}
    </>
  );
}
function HealthReport() {
  const [legend, setLegend] = useState(false);
  return (
    <>
      <SettingsTable
        id="health-report-manager"
        definition={tableDefinitions['health-report-manager']!}
        extraActions={
          <>
            <button onClick={() => setLegend(true)}>Legend</button>
            <a className="rs-button" href="#/alerts">
              Manage Alerts
            </a>
          </>
        }
      />
      {legend && (
        <Info title="Health status legend" onClose={() => setLegend(false)}>
          <p>
            <span className="rs-dot green" />
            Green: The feature is functioning properly.
          </p>
          <p>
            <span className="rs-dot yellow" />
            Yellow: The feature is experiencing a problem.
          </p>
          <p>
            <span className="rs-dot red" />
            Red: The feature has severe issues and is negatively impacting functionality of your deployment.
          </p>
          <p>
            <span className="rs-dot gray" />
            Grey: Health report is disabled or snoozed for the feature.
          </p>
          <a href="#/monitoring">View simulated deployment health</a>
        </Info>
      )}
    </>
  );
}

function SavedSearchSettings() {
  const state = useKnowledge();
  const rows: SettingRow[] = state.objects
    .filter((item) => item.kind === 'report' || item.kind === 'alert')
    .map((item) => ({
      _id: item.id,
      Name: item.title,
      Description: item.description,
      'Search string': item.search,
      Type: item.kind === 'alert' ? 'Alert' : 'Report',
      Schedule: item.schedule ?? 'none',
      Owner: item.owner,
      App: item.app,
      Sharing: item.sharing,
      Status: item.enabled ? 'Enabled' : 'Disabled',
    }));
  const onRowsChange = (next: SettingRow[]) => {
    const current = readKnowledge();
    const objects = current.objects.filter((item) => item.kind !== 'report' && item.kind !== 'alert');
    for (const row of next) {
      const existing = current.objects.find((item) => item.id === row._id);
      const item = makeKnowledgeObject({
        ...existing,
        title: row.Name ?? '',
        kind: row.Type === 'Alert' ? 'alert' : 'report',
        description: row.Description ?? '',
        search: row['Search string'] ?? '',
        schedule: row.Schedule === 'none' ? undefined : row.Schedule,
        owner: row.Owner ?? 'admin',
        app: row.App ?? 'search',
        sharing: row.Sharing === 'Global' ? 'Global' : row.Sharing === 'App' ? 'App' : 'Private',
        enabled: row.Status !== 'Disabled',
      });
      const originalId = item.id;
      let n = 2;
      while (objects.some((object) => object.id === item.id)) item.id = originalId + '_' + n++;
      objects.push(item);
    }
    saveKnowledge({ ...current, objects });
  };
  return (
    <SettingsTable
      id="searches-reports-and-alerts"
      definition={{
        title: 'Searches, Reports, and Alerts',
        description:
          'Searches, reports, and alerts are saved searches created from pivot or the search page.',
        columns: [
          'Name',
          'Actions',
          'Type',
          'Schedule',
          'Owner',
          'App',
          'Sharing',
          'Status',
          'Search string',
        ],
        newLabel: 'New Search',
        scoped: true,
        actions: ['Edit', 'Clone', 'Disable', 'Delete'],
        rows: [],
      }}
      dynamicRows={rows}
      onRowsChange={onRowsChange}
    />
  );
}
function AllConfigurations() {
  const knowledge = useKnowledge();
  const rows: SettingRow[] = [
    ...knowledge.objects.map((item) => ({
      Name: item.title,
      'Config type': item.kind === 'dashboard' ? 'view' : 'savedsearch',
      Owner: item.owner,
      App: item.app,
      Sharing: item.sharing,
      Status: item.enabled ? 'Enabled' : 'Disabled',
      _href:
        item.kind === 'dashboard'
          ? '#/dashboard/' + item.id
          : item.kind === 'alert'
            ? '#/alerts'
            : '#/reports',
    })),
    ...Object.entries(tableDefinitions).flatMap(([id, definition]) =>
      read<SettingRow[]>(id, definition.rows).map((item) => ({
        ...item,
        'Config type': id,
        _href: '#/settings/' + id,
      })),
    ),
    ...installedViews.map((view) => ({
      Name: view.label,
      'Config type': 'view',
      Owner: 'nobody',
      App: view.app,
      Sharing: 'App',
      Status: 'Enabled',
      _href: viewHref(view.app, view.id),
    })),
  ];
  return (
    <SettingsTable
      id="all-configurations"
      dynamicRows={rows}
      definition={{
        title: 'All configurations',
        columns: ['Name', 'Config type', 'Owner', 'App', 'Sharing', 'Status'],
        scoped: true,
        rows: [],
      }}
      onRowAction={(_, row) => {
        window.location.hash = row._href ?? '#/settings/home';
      }}
    />
  );
}

/** Standalone page content; the parent supplies the global Splunk navigation. */
export function SettingsPage({ id }: { id: string }) {
  const [base, child] = id.split('?')[0]!.split('/');
  let content: ReactNode;
  if (child) content = <NestedSettings key={id} id={base!} child={child} />;
  else if (!base || base === 'home') content = <SettingsDirectory />;
  else if (hubs[base]) content = <HubPage id={base} />;
  else if (base === 'roles' && currentProfile()?.id !== 'default')
    content = (
      <SettingsTable
        id="roles"
        definition={{ title: 'Roles', columns: ['Name', 'Groups'], rows: [] }}
        dynamicRows={[...new Set(currentProfile()?.auth.roleMappings.flatMap((m) => m.roles) ?? [])].map(
          (r) => ({
            Name: r,
            Groups: currentProfile()!
              .auth.roleMappings.filter((m) => m.roles.includes(r))
              .map((m) => m.group)
              .join(', '),
          }),
        )}
      />
    );
  else if (base === 'indexes') content = <Indexes />;
  else if (base === 'licensing') content = <Licensing />;
  else if (base === 'password-management') content = <PasswordPolicy />;
  else if (base === 'authentication-methods') content = <Authentication />;
  else if (base === 'add-data') content = <AddData />;
  else if (base === 'data-inputs') content = <AddDataPage />;
  else if (base === 'forwarding-and-receiving') content = <Forwarding />;
  else if (base === 'tokens') content = <Tokens />;
  else if (base === 'health-report-manager') content = <HealthReport />;
  else if (base === 'instrumentation') content = <Instrumentation />;
  else if (base === 'indexer-clustering') content = <Cluster />;
  else if (base === 'mobile-settings') content = <Mobile />;
  else if (base === 'server-controls') content = <Controls />;
  else if (['federated-search', 'workload-management', 'ingest-actions'].includes(base))
    content = <Tabbed key={base} id={base} />;
  else if (base === 'searches-reports-and-alerts') content = <SavedSearchSettings />;
  else if (base === 'all-configurations') content = <AllConfigurations />;
  else if (tableDefinitions[base])
    content = <SettingsTable key={base} id={base} definition={tableDefinitions[base]!} />;
  else
    content = (
      <>
        <Header title="Setting not found" />
        <div className="rs-hub">
          <p>This setting is not part of the captured UI catalog.</p>
          <a href="#/settings/home">Browse Settings</a>
        </div>
      </>
    );
  return (
    <main className="rea-settings" key={base}>
      {content}
    </main>
  );
}
