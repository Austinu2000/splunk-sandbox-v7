import { useMemo, useState } from 'react';
import {
  HEALTH_LABELS,
  HEALTH_STATES,
  type FleetFilter,
  type GroupSummary,
  type HealthState,
  type OsFamily,
  type WorldInfo,
} from '@sandbox/shared';
import { api } from '../api';
import { Chart, type ChartClick } from '../components/Chart';
import { HostTable, type SortState } from '../components/HostTable';
import { KpiTiles } from '../components/KpiTiles';
import { fmtInt, HEALTH_COLORS } from '../format';
import { usePoll } from '../usePoll';

const UNHEALTHY = HEALTH_STATES.filter((h) => h !== 'healthy');
const PAGE_SIZE = 50;

function unhealthyChart(groups: GroupSummary[]) {
  return {
    animationDuration: 300,
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { bottom: 0, itemWidth: 12, itemHeight: 10, textStyle: { fontSize: 11 } },
    grid: { left: 8, right: 16, top: 8, bottom: 52, containLabel: true },
    xAxis: { type: 'value', minInterval: 1 },
    yAxis: { type: 'category', data: groups.map((g) => g.id), inverse: true },
    series: UNHEALTHY.map((h) => ({
      id: h,
      name: HEALTH_LABELS[h],
      type: 'bar',
      stack: 'unhealthy',
      barMaxWidth: 22,
      itemStyle: { color: HEALTH_COLORS[h] },
      emphasis: { focus: 'series' },
      data: groups.map((g) => g.byHealth[h]),
    })),
  };
}

export function FleetOverview({ world }: { world: WorldInfo }) {
  // Dashboard inputs scope everything; health and hostname search scope only the table.
  const [scope, setScope] = useState<{ site?: string; serverClass?: string; os?: OsFamily }>({});
  const [health, setHealth] = useState<HealthState | undefined>();
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<SortState>({ sort: 'hostname', dir: 'asc' });
  const [offset, setOffset] = useState(0);

  const tableFilter: FleetFilter = { ...scope, health, q };
  const summary = usePoll(() => api.summary(scope), [scope.site, scope.serverClass, scope.os]);
  const hosts = usePoll(
    () => api.hosts(tableFilter, { offset, limit: PAGE_SIZE, ...sort }),
    [scope.site, scope.serverClass, scope.os, health, q, offset, sort.sort, sort.dir],
  );

  const resetPaging =
    <T,>(fn: (v: T) => void) =>
    (v: T) => {
      setOffset(0);
      fn(v);
    };
  const updateScope = resetPaging((patch: Partial<typeof scope>) => setScope((s) => ({ ...s, ...patch })));
  const selectHealth = resetPaging(setHealth);

  const s = summary.data;
  const siteOption = useMemo(() => (s ? unhealthyChart(s.bySite) : null), [s]);
  const classOption = useMemo(() => (s ? unhealthyChart(s.byServerClass) : null), [s]);
  const drill = (key: 'site' | 'serverClass') => (e: ChartClick) => {
    updateScope({ [key]: e.name });
    if (e.seriesId) selectHealth(e.seriesId as HealthState);
  };

  return (
    <main className="dashboard">
      <div className="dash-header">
        <div>
          <h1>Fleet Overview</h1>
          <p className="subtitle">
            {fmtInt(world.fleetSize)} universal forwarders across {world.sites.length} sites ·{' '}
            {world.infra.length} infrastructure nodes
          </p>
        </div>
      </div>

      <div className="inputs">
        <label>
          Site
          <select
            value={scope.site ?? ''}
            onChange={(e) => updateScope({ site: e.target.value || undefined })}
          >
            <option value="">All</option>
            {world.sites.map((x) => (
              <option key={x.id} value={x.id}>
                {x.id} — {x.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Server class
          <select
            value={scope.serverClass ?? ''}
            onChange={(e) => updateScope({ serverClass: e.target.value || undefined })}
          >
            <option value="">All</option>
            {world.serverClasses.map((x) => (
              <option key={x.id} value={x.id}>
                {x.id}
              </option>
            ))}
          </select>
        </label>
        <label>
          OS
          <select
            value={scope.os ?? ''}
            onChange={(e) => updateScope({ os: (e.target.value || undefined) as OsFamily | undefined })}
          >
            <option value="">All</option>
            <option value="windows">windows</option>
            <option value="linux">linux</option>
          </select>
        </label>
        {(scope.site || scope.serverClass || scope.os || health) && (
          <button
            className="link-btn"
            onClick={() => {
              setScope({});
              selectHealth(undefined);
            }}
          >
            Reset filters
          </button>
        )}
      </div>

      {summary.error && <div className="error">Could not load fleet summary: {summary.error}</div>}

      {s && (
        <>
          <KpiTiles summary={s} selected={health} onSelect={selectHealth} />
          <div className="panel-row">
            <section className="panel">
              <h2>Unhealthy forwarders by site</h2>
              {siteOption && <Chart option={siteOption} height={220} onClick={drill('site')} />}
            </section>
            <section className="panel">
              <h2>Unhealthy forwarders by server class</h2>
              {classOption && <Chart option={classOption} height={220} onClick={drill('serverClass')} />}
            </section>
          </div>
        </>
      )}

      <section className="panel">
        <div className="panel-head">
          <h2>
            Forwarders
            {health && (
              <span className="chip" style={{ borderColor: HEALTH_COLORS[health] }}>
                {HEALTH_LABELS[health]}
                <button aria-label="Clear health filter" onClick={() => selectHealth(undefined)}>
                  ×
                </button>
              </span>
            )}
          </h2>
          <input
            className="search"
            type="search"
            placeholder="Filter by hostname"
            value={q}
            onChange={(e) => resetPaging(setQ)(e.target.value)}
          />
        </div>
        {hosts.error && <div className="error">Could not load forwarders: {hosts.error}</div>}
        {hosts.data && (
          <HostTable
            page={hosts.data}
            now={s?.at ?? world.now}
            sort={sort}
            onSort={resetPaging(setSort)}
            onPage={setOffset}
          />
        )}
      </section>
    </main>
  );
}
