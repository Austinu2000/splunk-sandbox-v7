import {
  HEALTH_LABELS,
  type McPanelDto,
  type McStatDto,
  type McView,
  type McViewDto,
  type ResultValue,
} from '@sandbox/shared';
import { parsingQueueBlocked } from '../derive/state';
import { listHosts, summarizeFleet } from '../fleet/query';
import { clusterPeers } from '../hosts/cluster';
import { resolveHost, splunkdRunning } from '../hosts/profile';
import { licenseStatus } from '../ingest/license';
import { simulateScheduler } from '../scheduler';
import { rowToPlain, runSearch } from '../spl/run';
import type { World } from '../world';

/**
 * Monitoring Console views. Each panel is an SPL search run against the same simulated data the
 * Search page sees (so "Open in Search" shows the same numbers), except where Splunk's own console
 * reads REST state; those panels use the equivalent world query and still offer a search.
 */

type PanelSpec = Omit<McPanelDto, 'columns' | 'rows' | 'messages'>;

function splPanel(world: World, spec: PanelSpec): McPanelDto {
  const r = runSearch(world, { search: spec.search, earliest: spec.earliest, latest: spec.latest });
  return {
    ...spec,
    columns: r.columns,
    rows: r.results.map((row) => rowToPlain(row, r.columns)),
    messages: r.messages,
  };
}

function tablePanel(spec: PanelSpec, columns: string[], rows: Record<string, ResultValue>[]): McPanelDto {
  return { ...spec, columns, rows, messages: [] };
}

const pct = (n: number) => `${n.toFixed(n < 10 ? 1 : 0)}%`;
const gb = (bytes: number) =>
  `${(bytes / 1024 ** 3).toLocaleString('en-US', { maximumFractionDigits: 1 })} GB`;

function indexing(world: World): McViewDto {
  const peers = clusterPeers(world);
  const up = peers.filter((p) => splunkdRunning(world, p));
  const blocked = up.filter((p) => parsingQueueBlocked(world, p, world.clock.now));
  const fill = splPanel(world, {
    id: 'queue-fill',
    title: 'Parsing queue fill by indexer (max %)',
    chart: 'line',
    unit: '%',
    search:
      'index=_internal source=*metrics.log group=queue name=parsingqueue host=idx* | eval fill_pct=round(current_size_kb/max_size_kb*100,1) | timechart span=1m max(fill_pct) by host',
    earliest: '-60m',
    latest: 'now',
  });
  const thruput = splPanel(world, {
    id: 'index-thruput',
    title: 'Indexing rate by indexer (KB/s)',
    chart: 'line',
    unit: 'KB/s',
    search:
      'index=_internal source=*metrics.log group=thruput name=index_thruput host=idx* | timechart span=1m avg(instantaneous_kbps) by host',
    earliest: '-60m',
    latest: 'now',
  });
  // The newest bucket is the minute in progress; the one before it is complete.
  const last = thruput.rows.at(-2) ?? thruput.rows.at(-1) ?? {};
  const total = Object.entries(last)
    .filter(([k]) => k !== '_time')
    .reduce((s, [, v]) => s + (Number(v) || 0), 0);
  const stats: McStatDto[] = [
    {
      label: 'Indexers up',
      value: `${up.length} / ${peers.length}`,
      tone: up.length === peers.length ? 'ok' : 'bad',
    },
    {
      label: 'Blocked parsing queues',
      value: String(blocked.length),
      tone: blocked.length ? 'bad' : 'ok',
      hint: blocked.map((p) => p.hostname).join(', ') || undefined,
    },
    { label: 'Indexing rate (last minute)', value: `${Math.round(total).toLocaleString('en-US')} KB/s` },
  ];
  return { view: 'indexing', generatedAt: world.clock.now, stats, panels: [fill, thruput] };
}

function forwarders(world: World): McViewDto {
  const s = summarizeFleet(world, {});
  const missing = s.byHealth.offline + s.byHealth.blocked_queue;
  const stats: McStatDto[] = [
    { label: 'Forwarders', value: s.total.toLocaleString('en-US') },
    {
      label: 'Sending data',
      value: (s.total - missing).toLocaleString('en-US'),
      tone: missing / s.total > 0.05 ? 'warn' : 'ok',
    },
    {
      label: 'Blocked',
      value: s.byHealth.blocked_queue.toLocaleString('en-US'),
      tone: s.byHealth.blocked_queue ? 'warn' : 'ok',
    },
    {
      label: 'Missing (offline)',
      value: s.byHealth.offline.toLocaleString('en-US'),
      tone: s.byHealth.offline ? 'warn' : 'ok',
    },
  ];
  const notSending = ['blocked_queue', 'offline'] as const;
  const rows = notSending
    .flatMap((health) => listHosts(world, { health }, { limit: 50, sort: 'lastPhoneHome', dir: 'asc' }).rows)
    .slice(0, 50)
    .map((r) => ({
      hostname: r.hostname,
      site: r.site,
      server_class: r.serverClass,
      status: HEALTH_LABELS[r.health],
      since: Math.floor(r.healthSince / 1000),
      output_group: r.outputGroup,
    }));
  const bySite = s.bySite.map((g) => ({
    site: g.name,
    forwarders: g.total,
    sending: g.total - g.byHealth.offline - g.byHealth.blocked_queue,
    blocked: g.byHealth.blocked_queue,
    missing: g.byHealth.offline,
  }));
  return {
    view: 'forwarders',
    generatedAt: world.clock.now,
    stats,
    panels: [
      tablePanel(
        {
          id: 'by-site',
          title: 'Forwarder status by site',
          chart: 'table',
          search:
            '| metadata type=hosts index=_internal | eval status=if(now()-recentTime>600,"missing","active") | stats count by status',
          earliest: '-24h',
          latest: 'now',
        },
        ['site', 'forwarders', 'sending', 'blocked', 'missing'],
        bySite,
      ),
      tablePanel(
        {
          id: 'not-sending',
          title: 'Forwarders not sending data (oldest first, up to 50)',
          chart: 'table',
          search:
            '| metadata type=hosts index=_internal | eval age=now()-recentTime | where age>300 | sort - age | table host recentTime age',
          earliest: '-24h',
          latest: 'now',
          empty: 'Every forwarder is delivering data.',
        },
        ['hostname', 'site', 'server_class', 'status', 'since', 'output_group'],
        rows,
      ),
    ],
  };
}

function license(world: World): McViewDto {
  const l = licenseStatus(world);
  const tone = (p: number) => (p >= 100 ? 'bad' : p >= 90 ? 'warn' : 'ok');
  const stats: McStatDto[] = [
    { label: 'Daily quota', value: gb(l.quotaBytes) },
    { label: 'Used today', value: `${gb(l.todayBytes)} (${pct(l.todayPct)})`, tone: tone(l.todayPct) },
    {
      label: 'Projected for today',
      value: pct(l.projectedPct),
      tone: tone(l.projectedPct),
      hint: 'A full day at the current rate',
    },
    { label: 'Top sourcetype', value: l.bySourcetype[0]?.sourcetype ?? '—' },
  ];
  const usage = splPanel(world, {
    id: 'usage',
    title: 'License usage by sourcetype (bytes per 5 minutes)',
    chart: 'area',
    unit: 'bytes',
    search: 'index=_internal source=*license_usage.log type=Usage | timechart span=5m sum(b) by st',
    earliest: '-4h',
    latest: 'now',
  });
  if (world.config.profile)
    return {
      view: 'license',
      generatedAt: world.clock.now,
      stats,
      panels: [
        usage,
        splPanel(world, {
          id: 'by-sourcetype',
          title: 'Volume by index and sourcetype (last hour)',
          chart: 'table',
          search:
            'index=_internal source=*license_usage.log type=Usage | stats sum(b) as bytes by idx, st | eval GB=round(bytes/1024/1024/1024,2) | sort - bytes',
          earliest: '-60m',
          latest: 'now',
        }),
      ],
    };
  const rows = l.bySourcetype.map((x) => ({
    index: x.index,
    sourcetype: x.sourcetype,
    gb_per_day: Math.round((x.bytesPerDay / 1024 ** 3) * 10) / 10,
    pct_of_quota: Math.round((x.bytesPerDay / l.quotaBytes) * 1000) / 10,
  }));
  return {
    view: 'license',
    generatedAt: world.clock.now,
    stats,
    panels: [
      usage,
      tablePanel(
        {
          id: 'by-sourcetype',
          title: 'Projected daily volume by index and sourcetype (current rate)',
          chart: 'table',
          search:
            'index=_internal source=*license_usage.log type=Usage | stats sum(b) as bytes by idx, st | eval GB=round(bytes/1024/1024/1024,2) | sort - bytes',
          earliest: '-60m',
          latest: 'now',
        },
        ['index', 'sourcetype', 'gb_per_day', 'pct_of_quota'],
        rows,
      ),
    ],
  };
}

function scheduler(world: World): McViewDto {
  const now = world.clock.now;
  const heads = world.infra
    .filter((n) => n.role === 'search_head')
    .map((n) => resolveHost(world, n.hostname)!);
  const stats: McStatDto[] = heads.map((sh) => {
    if (!splunkdRunning(world, sh))
      return { label: `${sh.hostname} (last hour)`, value: 'splunkd stopped', tone: 'bad' };
    const recs = simulateScheduler(world, sh, now - 3_600_000, now);
    const skipped = recs.filter((r) => r.status === 'skipped').length;
    const ratio = recs.length ? (skipped / recs.length) * 100 : 0;
    return {
      label: `${sh.hostname} skipped (last hour)`,
      value: `${skipped} of ${recs.length} (${pct(ratio)})`,
      tone: ratio > 5 ? 'bad' : skipped ? 'warn' : 'ok',
      hint: recs.length ? `Concurrency limit ${recs.at(-1)!.concurrencyLimit}` : undefined,
    };
  });
  return {
    view: 'scheduler',
    generatedAt: now,
    stats,
    panels: [
      splPanel(world, {
        id: 'activity',
        title: 'Scheduled search runs by status (per 5 minutes)',
        chart: 'line',
        search: 'index=_internal sourcetype=scheduler | timechart span=5m count by status',
        earliest: '-4h',
        latest: 'now',
      }),
      splPanel(world, {
        id: 'skipped',
        title: 'Skipped searches and reasons',
        chart: 'table',
        search:
          'index=_internal sourcetype=scheduler status=skipped | stats count by host, savedsearch_name, reason | sort - count',
        earliest: '-4h',
        latest: 'now',
        empty: 'No skipped searches in the last 4 hours.',
      }),
    ],
  };
}

export function monitoringConsole(world: World, view: McView): McViewDto {
  if (view === 'indexing') return indexing(world);
  if (view === 'forwarders') return forwarders(world);
  if (view === 'license') return license(world);
  return scheduler(world);
}
