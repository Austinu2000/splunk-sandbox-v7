import { PlatformPanel } from '../components/PlatformPanel';
import { api } from '../api';
import { usePoll } from '../usePoll';
import { Chart } from '../components/Chart';
import type { McPanelDto } from '@sandbox/shared';
function plot(panel: McPanelDto) {
  return {
    animation: false,
    color: ['#1e93c6', '#f2b827', '#d6563c', '#6a5c9e', '#31a35f', '#ed8440'],
    tooltip: { trigger: 'axis' },
    grid: { left: 40, right: 10, top: 15, bottom: 25 },
    xAxis: { type: 'time', axisLabel: { color: '#a9b2ba' } },
    yAxis: { type: 'value', axisLabel: { color: '#a9b2ba' }, splitLine: { lineStyle: { color: '#30343a' } } },
    series: panel.columns
      .filter((c) => c !== '_time')
      .map((c) => ({
        name: c,
        type: 'line',
        showSymbol: false,
        data: panel.rows.map((r) => [Number(r._time) * 1000, Number(r[c])]),
      })),
  };
}
export function MonitoringOverview() {
  const indexing = usePoll(() => api.monitoring('indexing'), [], 10000);
  const license = usePoll(() => api.monitoring('license'), [], 10000);
  const scheduler = usePoll(() => api.monitoring('scheduler'), [], 10000);
  const fleet = usePoll(() => api.summary({}), [], 10000);
  const i = indexing.data,
    l = license.data,
    s = scheduler.data;
  const rate = i?.stats.find((x) => x.label.startsWith('Indexing rate'))?.value;
  const licenseUsage = l?.stats.find((x) => x.label === 'Used today')?.value;
  const licensePercent = Number(/\((\d+)%\)/.exec(licenseUsage ?? '')?.[1] ?? 0);
  return (
    <main className="mc-replica-overview" tabIndex={-1}>
      <h1>Splunk Enterprise 9.4.1 · Practice environment</h1>
      <p>Simulated enterprise deployment</p>
      <p>Mode: Distributed</p>
      <div className="mc-overview-panels">
        <section className="mc-assist">
          <div className="replica-notice">
            ⓘ You don’t have Splunk Assist set up yet. To view insights,{' '}
            <a href="#/view/splunk_monitoring_console/assist">go to Splunk Assist</a> to turn it on.
          </div>
          <div className="mc-assist-head">
            <div>
              <h2>Splunk Assist</h2>
              <p>
                Brings the power of Splunk Cloud management insights to Splunk Enterprise deployments that you
                administer.
              </p>
            </div>
            <a className="replica-primary" href="#/view/splunk_monitoring_console/assist">
              Go to Splunk Assist
            </a>
          </div>
          <div className="mc-assist-stats">
            {['Critical Indicators', 'Warning Indicators', 'Conforming Indicators'].map((v, n) => (
              <div key={v}>
                {v}
                <strong>{['⚠', '◇', '✓'][n]} N/A</strong>
              </div>
            ))}
          </div>
        </section>
        <div className="mc-metric-grid">
          <section>
            <h3>Indexing rate</h3>
            <span className="big">{rate ?? 'Loading…'}</span>
            <small>Total</small>
            <p>
              <a href="#/monitoring/indexing">Indexing performance</a>
            </p>
          </section>
          <section>
            <h3>License usage</h3>
            <div className="mc-meter">
              <span>Today</span>
              <meter value={licensePercent} max="100" />
              {licensePercent}%
            </div>
            <p>{licenseUsage ?? 'Loading…'}</p>
            <h3>Daily quota</h3>
            <p>{l?.stats.find((x) => x.label === 'Daily quota')?.value ?? 'Loading…'}</p>
            <a href="#/monitoring/license">License usage details</a>
          </section>
          <section>
            <h3>Indexing rate by indexer</h3>
            {i?.panels[1] ? (
              <Chart option={plot(i.panels[1])} height={220} />
            ) : (
              <div className="empty">Waiting for data…</div>
            )}
          </section>
          <section>
            <h3>Parsing queue fill</h3>
            {i?.panels[0] ? (
              <Chart option={plot(i.panels[0])} height={220} />
            ) : (
              <div className="empty">Waiting for data…</div>
            )}
          </section>
          <section>
            <h3>Forwarder status</h3>
            <span className="big">{fleet.data?.total.toLocaleString() ?? '…'}</span>
            <p>{fleet.data?.byHealth.healthy.toLocaleString()} healthy forwarders</p>
            <a href="#/monitoring/forwarders">Forwarders overview</a>
          </section>
          <section>
            <h3>Scheduler activity</h3>
            {s?.stats.map((x) => (
              <p key={x.label}>
                {x.label}: <strong>{x.value}</strong>
              </p>
            ))}
            <a href="#/monitoring/scheduler">Scheduler activity details</a>
          </section>
        </div>
        {[indexing.error, license.error, scheduler.error, fleet.error].filter(Boolean).map((e, n) => (
          <p role="alert" key={n}>
            {e}
          </p>
        ))}
      </div>
      <PlatformPanel />
    </main>
  );
}
