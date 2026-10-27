import { HEALTH_LABELS, type HostPage, type HostSortKey } from '@sandbox/shared';
import { fmtAgo, fmtInt, HEALTH_COLORS } from '../format';
import { searchHash } from '../links';

export interface SortState {
  sort: HostSortKey;
  dir: 'asc' | 'desc';
}

const COLUMNS: { label: string; sort?: HostSortKey; className?: string }[] = [
  { label: 'Host', sort: 'hostname' },
  { label: 'Health', sort: 'health' },
  { label: 'Site', sort: 'site' },
  { label: 'Server class' },
  { label: 'OS' },
  { label: 'Version' },
  { label: 'Last phone-home', sort: 'lastPhoneHome' },
  { label: 'Queue fill', className: 'num' },
  { label: 'KB/s', className: 'num' },
  { label: 'Output group' },
];

export function HostTable({
  page,
  now,
  sort,
  onSort,
  onPage,
}: {
  page: HostPage;
  now: number;
  sort: SortState;
  onSort: (s: SortState) => void;
  onPage: (offset: number) => void;
}) {
  const { total, offset, limit, rows } = page;
  const last = Math.min(offset + limit, total);
  const pages = Math.max(1, Math.ceil(total / limit));
  const current = Math.floor(offset / limit) + 1;

  return (
    <div>
      <div className="table-meta">
        <span>
          {total === 0
            ? 'No results'
            : `${fmtInt(offset + 1)}–${fmtInt(last)} of ${fmtInt(total)} forwarders`}
        </span>
        <span className="pager">
          <button disabled={current <= 1} onClick={() => onPage(0)}>
            « First
          </button>
          <button disabled={current <= 1} onClick={() => onPage(offset - limit)}>
            ‹ Prev
          </button>
          <span>
            Page {fmtInt(current)} of {fmtInt(pages)}
          </span>
          <button disabled={current >= pages} onClick={() => onPage(offset + limit)}>
            Next ›
          </button>
        </span>
      </div>
      <div className="table-scroll">
        <table className="results">
          <thead>
            <tr>
              {COLUMNS.map((c) => {
                const active = c.sort && sort.sort === c.sort;
                return (
                  <th
                    key={c.label}
                    className={[c.className, c.sort ? 'sortable' : '', active ? 'sorted' : ''].join(' ')}
                    onClick={
                      c.sort
                        ? () => onSort({ sort: c.sort!, dir: active && sort.dir === 'asc' ? 'desc' : 'asc' })
                        : undefined
                    }
                  >
                    {c.label}
                    {active && <span className="sort-arrow">{sort.dir === 'asc' ? ' ▲' : ' ▼'}</span>}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.hostname}>
                <td className="mono">
                  <a
                    href={searchHash(`index=_internal host=${r.hostname}`, '-60m')}
                    title="Search this forwarder's _internal events"
                  >
                    {r.hostname}
                  </a>
                </td>
                <td>
                  <span className="dot" style={{ background: HEALTH_COLORS[r.health] }} />
                  {HEALTH_LABELS[r.health]}
                </td>
                <td>{r.site}</td>
                <td>
                  {r.serverClass}
                  {r.assignedServerClass !== r.serverClass && (
                    <span className="mismatch" title="Server class the deployment server maps this client to">
                      {' '}
                      → {r.assignedServerClass}
                    </span>
                  )}
                </td>
                <td>{r.os}</td>
                <td className={r.health === 'version_drift' ? 'warn mono' : 'mono'}>{r.version}</td>
                <td className={r.deploymentClientStatus === 'not_phoning_home' ? 'warn' : ''}>
                  {fmtAgo(r.lastPhoneHome, now)}
                </td>
                <td className="num">
                  <span className="bar">
                    <span
                      style={{
                        width: `${r.queueFillPct}%`,
                        background: r.queueFillPct >= 90 ? HEALTH_COLORS.offline : '#5c6773',
                      }}
                    />
                  </span>
                  {r.queueFillPct}%
                </td>
                <td className="num">{r.throughputKBps.toFixed(1)}</td>
                <td className="mono">{r.outputGroup}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
