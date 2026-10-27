import type { Profile } from './profile';
import type { OsFamily, UnhealthyState } from '@sandbox/shared';

export interface SiteDef {
  id: string;
  name: string;
  weight: number;
  /** Second octet of this site's 10.x.0.0/16 range. */
  subnet: number;
}

export interface ServerClassDef {
  id: string;
  /** Hostname tag, e.g. "win" in dal-win-0412. */
  short: string;
  os: OsFamily;
  weight: number;
  baseThroughputKBps: number;
  /** Where this class sends data: the site's indexers, or the site's heavy forwarder. */
  outputs: 'indexers' | 'hf';
}

export interface WorldConfig {
  profileId: string;
  automationVersion?: 0 | 1;
  permanentOfflineRows?: number[];
  profile?: Profile;
  seed: string;
  fleetSize: number;
  /** Sim epoch ms at tick 0. */
  startTime: number;
  /** Sim time advanced per tick. */
  tickMs: number;
  phoneHomeIntervalMs: number;
  sites: SiteDef[];
  serverClasses: ServerClassDef[];
  approvedVersions: { version: string; weight: number }[];
  driftVersions: string[];
  background: {
    /** Long-run fraction of the fleet that is unhealthy at any moment. */
    unhealthyRate: number;
    meanUnhealthyMinutes: number;
    stateWeights: Record<UnhealthyState, number>;
  };
  historyRetentionMs: number;
}

export function defaultWorldConfig(overrides: Partial<WorldConfig> = {}): WorldConfig {
  return {
    profileId: 'default',
    seed: 'sandbox',
    fleetSize: 35_000,
    startTime: Date.UTC(2026, 9, 23, 8, 0, 0),
    tickMs: 10_000,
    phoneHomeIntervalMs: 60_000,
    sites: [
      { id: 'dal', name: 'Dallas', weight: 0.45, subnet: 10 },
      { id: 'ash', name: 'Ashburn', weight: 0.35, subnet: 20 },
      { id: 'fra', name: 'Frankfurt', weight: 0.2, subnet: 30 },
    ],
    serverClasses: [
      {
        id: 'win_servers',
        short: 'win',
        os: 'windows',
        weight: 0.41,
        baseThroughputKBps: 12,
        outputs: 'indexers',
      },
      { id: 'win_dc', short: 'dc', os: 'windows', weight: 0.04, baseThroughputKBps: 25, outputs: 'indexers' },
      {
        id: 'linux_app',
        short: 'app',
        os: 'linux',
        weight: 0.3,
        baseThroughputKBps: 18,
        outputs: 'indexers',
      },
      {
        id: 'linux_web',
        short: 'web',
        os: 'linux',
        weight: 0.16,
        baseThroughputKBps: 30,
        outputs: 'indexers',
      },
      { id: 'linux_db', short: 'db', os: 'linux', weight: 0.08, baseThroughputKBps: 22, outputs: 'indexers' },
      {
        id: 'syslog_relay',
        short: 'syslog',
        os: 'linux',
        weight: 0.01,
        baseThroughputKBps: 400,
        outputs: 'hf',
      },
    ],
    approvedVersions: [
      { version: '9.4.1', weight: 0.55 },
      { version: '9.3.2', weight: 0.3 },
      { version: '9.2.4', weight: 0.15 },
    ],
    driftVersions: ['8.2.12', '9.0.9'],
    background: {
      unhealthyRate: 0.015,
      meanUnhealthyMinutes: 45,
      stateWeights: {
        stale_phonehome: 0.3,
        blocked_queue: 0.15,
        offline: 0.3,
        version_drift: 0.15,
        wrong_serverclass: 0.1,
      },
    },
    historyRetentionMs: 24 * 60 * 60 * 1000,
    ...overrides,
  };
}

export function validateConfig(cfg: WorldConfig): void {
  const fail = (msg: string) => {
    throw new Error(`Invalid world config: ${msg}`);
  };
  if (!Number.isInteger(cfg.fleetSize) || cfg.fleetSize < 1 || cfg.fleetSize > 250_000)
    fail('fleetSize must be an integer between 1 and 250000');
  if (cfg.sites.length < 1 || cfg.sites.length > 255) fail('need 1-255 sites');
  if (cfg.serverClasses.length < 2 || cfg.serverClasses.length > 255) fail('need 2-255 server classes');
  if (cfg.approvedVersions.length + cfg.driftVersions.length > 255) fail('too many versions');
  if (cfg.driftVersions.length < 1) fail('need at least one drift version');
  const rate = cfg.background.unhealthyRate;
  if (!(rate >= 0 && rate < 1)) fail('background.unhealthyRate must be in [0, 1)');
  if (!(cfg.tickMs > 0)) fail('tickMs must be positive');
}
