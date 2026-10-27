import { infraName } from '../infra';
import type { InfraRole, OsFamily } from '@sandbox/shared';
import { OFFLINE } from '../fleet/tables';
import { hostname as fleetHostname, ipAddress } from '../fleet/query';
import type { InfraNode } from '../infra';
import { hashString, mix32 } from '../rng';
import type { World } from '../world';

export const DOMAIN = 'corp.example';
export const BASTION = 'bastion01';
export const BASTION_IP = '10.10.0.5';
export const BASTION_USER = 'engineer';

/** Hosts emulated in full detail (extra history, app logs). Every other Linux host gets the same layout, thinner. */
export const DETAILED_HOSTS = ['ds01', 'idx01', 'dal-app-0001'] as const;

export function detailedHosts(world: World): readonly string[] {
  if (!world.config.profile) return DETAILED_HOSTS;
  let linux = '';
  for (let row = 0; row < world.fleet.size; row++)
    if (
      world.config.serverClasses[world.fleet.serverClass[row]!]!.os === 'linux' &&
      !world.config.permanentOfflineRows?.includes(row)
    ) {
      linux = fleetHostname(world, row);
      break;
    }
  return [infraName(world, 'deployment_server'), infraName(world, 'indexer'), linux];
}

export type HostRole = InfraRole | 'universal_forwarder' | 'bastion';

export interface Distro {
  id: string;
  name: string;
  versionId: string;
  prettyName: string;
  kernel: string;
}

export interface HostProfile {
  hostname: string;
  fqdn: string;
  ip: string;
  role: HostRole;
  os: OsFamily;
  site: string;
  detailed: boolean;
  fleetRow?: number;
  infra?: InfraNode;
  /** null on hosts without Splunk (the bastion). */
  splunk: null | {
    home: string;
    product: 'enterprise' | 'universal_forwarder';
    /** Version can change at runtime (version drift); read it with splunkVersion(). */
    service: string;
    pid: number;
    mgmtPort: number;
    guid: string;
  };
  distro: Distro;
  cpus: number;
  memMB: number;
  diskGB: number;
  bootTime: number;
  /** Stable per-host hash for deterministic details. */
  hash: number;
}

const RHEL9: Distro = {
  id: 'rhel',
  name: 'Red Hat Enterprise Linux',
  versionId: '9.4',
  prettyName: 'Red Hat Enterprise Linux 9.4 (Plow)',
  kernel: '5.14.0-427.13.1.el9_4.x86_64',
};
const RHEL8: Distro = {
  id: 'rhel',
  name: 'Red Hat Enterprise Linux',
  versionId: '8.10',
  prettyName: 'Red Hat Enterprise Linux 8.10 (Ootpa)',
  kernel: '4.18.0-553.el8_10.x86_64',
};

const BUILDS: Record<string, string> = {
  '9.4.1': 'e3bdab203ac8',
  '9.3.2': 'd8bb32809498',
  '9.2.4': 'c103a21bb11d',
  '9.0.9': '6315942c563f',
  '8.2.12': 'e9494146ae5c',
};
export const ENTERPRISE_VERSION = '9.4.1';
export const buildFor = (version: string) => BUILDS[version] ?? '000000000000';

/** A deterministic UUID-like id from the world seed and a label. */
export function guidFor(world: World, label: string): string {
  const h = (salt: number) => mix32(world.seedHash, hashString(label), salt).toString(16).padStart(8, '0');
  const a = h(1) + h(2) + h(3) + h(4);
  return `${a.slice(0, 8)}-${a.slice(8, 12)}-4${a.slice(13, 16)}-a${a.slice(17, 20)}-${a.slice(20, 32)}`.toUpperCase();
}

interface HostIndex {
  byName: Map<string, number>;
}
const indexCache = new WeakMap<World, HostIndex>();

function fleetIndex(world: World): HostIndex {
  let idx = indexCache.get(world);
  if (!idx) {
    const byName = new Map<string, number>();
    for (let row = 0; row < world.fleet.size; row++) byName.set(fleetHostname(world, row), row);
    idx = { byName };
    indexCache.set(world, idx);
  }
  return idx;
}

function baseProfile(
  world: World,
  hostname: string,
): Pick<HostProfile, 'hash' | 'cpus' | 'memMB' | 'diskGB' | 'bootTime' | 'distro'> {
  const hash = mix32(world.seedHash, hashString(hostname));
  const bootDays = 3 + (hash % 120);
  return {
    hash,
    distro: hash % 5 === 0 ? RHEL8 : RHEL9,
    cpus: 4,
    memMB: 8192,
    diskGB: 100,
    bootTime: world.config.startTime - bootDays * 86_400_000 - (hash % 86_400) * 1000,
  };
}

const profileCache = new WeakMap<World, Map<string, HostProfile | null>>();

export function invalidateHostProfiles(world: World): void {
  profileCache.delete(world);
}

/**
 * Resolves a short name, FQDN or IP to a host. Returns null for names that don't exist.
 * Profiles are pure functions of the seed and hostname, so they're cached.
 */
export function resolveHost(world: World, name: string): HostProfile | null {
  let cache = profileCache.get(world);
  if (!cache) profileCache.set(world, (cache = new Map()));
  const key = name.toLowerCase().replace(new RegExp(`\\.${DOMAIN.replace('.', '\\.')}$`), '');
  if (cache.has(key)) return cache.get(key)!;
  const p = buildProfile(world, key);
  cache.set(key, p);
  if (p) cache.set(p.hostname, p);
  return p;
}

function buildProfile(world: World, name: string): HostProfile | null {
  if (name === BASTION || name === BASTION_IP) {
    return {
      hostname: BASTION,
      fqdn: `${BASTION}.${DOMAIN}`,
      ip: BASTION_IP,
      role: 'bastion',
      os: 'linux',
      site: world.config.sites[0]!.id,
      detailed: true,
      splunk: null,
      ...baseProfile(world, BASTION),
      cpus: 2,
      memMB: 4096,
    };
  }

  const infra = world.infra.find((n) => n.hostname === name || n.ip === name);
  if (infra) {
    const base = baseProfile(world, infra.hostname);
    const big = infra.role === 'indexer' || infra.role === 'search_head';
    return {
      hostname: infra.hostname,
      fqdn: `${infra.hostname}.${DOMAIN}`,
      ip: infra.ip,
      role: infra.role,
      os: 'linux',
      site: infra.site,
      detailed: detailedHosts(world).includes(infra.hostname),
      infra,
      splunk:
        infra.retired || infra.role === 'automation'
          ? null
          : {
              home: '/opt/splunk',
              product: 'enterprise',
              service: 'Splunkd',
              pid: 2000 + (base.hash % 6000),
              mgmtPort: 8089,
              guid: guidFor(world, `instance:${infra.hostname}`),
            },
      ...base,
      distro: RHEL9,
      cpus: big ? 32 : 8,
      memMB: big ? 65536 : 16384,
      diskGB: infra.role === 'indexer' ? 4000 : 250,
    };
  }

  let row = fleetIndex(world).byName.get(name);
  if (row === undefined && /^10\.\d+\.\d+\.\d+$/.test(name)) {
    row = [...fleetIndex(world).byName.values()].find((r) => ipAddress(world, r) === name);
  }
  if (row === undefined) return null;
  const hostname = fleetHostname(world, row);
  const cls = world.config.serverClasses[world.fleet.serverClass[row]!]!;
  const base = baseProfile(world, hostname);
  return {
    hostname,
    fqdn: `${hostname}.${DOMAIN}`,
    ip: ipAddress(world, row),
    role: 'universal_forwarder',
    os: cls.os,
    site: world.config.sites[world.fleet.site[row]!]!.id,
    detailed: detailedHosts(world).includes(hostname),
    fleetRow: row,
    splunk: {
      home: cls.os === 'windows' ? 'C:\\Program Files\\SplunkUniversalForwarder' : '/opt/splunkforwarder',
      product: 'universal_forwarder',
      service: 'SplunkForwarder',
      pid: 2000 + (base.hash % 6000),
      mgmtPort: 8089,
      guid: guidFor(world, `instance:${hostname}`),
    },
    ...base,
    cpus: cls.id === 'linux_db' ? 16 : 4,
    memMB: cls.id === 'linux_db' ? 32768 : 8192,
  };
}

/** Whether splunkd is running on the host right now (from fleet health or infra status). */
export function splunkdRunning(world: World, p: HostProfile): boolean {
  if (!p.splunk) return false;
  if (world.hosts.services.get(p.hostname)?.running === false) return false;
  if (p.fleetRow !== undefined) return world.fleet.health[p.fleetRow] !== OFFLINE;
  return p.infra?.status === 'up';
}

/** The version actually installed now. Fleet versions change with version drift, so this is not cached. */
export function splunkVersion(world: World, p: HostProfile): string | null {
  if (!p.splunk) return null;
  if (p.fleetRow !== undefined) return world.versions[world.fleet.version[p.fleetRow]!]!;
  return ENTERPRISE_VERSION;
}

/** Sites' indexer and heavy-forwarder addresses, used by outputs.conf and the log generators. */
export function outputTargets(world: World, site: string, kind: 'indexers' | 'hf'): InfraNode[] {
  const eligible = world.infra.filter(
    (n) => !n.retired && n.role === (kind === 'hf' ? 'heavy_forwarder' : 'indexer'),
  );
  const local = eligible.filter((n) => n.site === site);
  return local.length ? local : world.config.profile ? eligible : local;
}

export interface RosterEntry {
  hostname: string;
  role: HostRole;
  site: string;
  detailed: boolean;
}

/** Hosts worth listing in the UI: the detailed ones first, then the rest of the infrastructure tier. */
export function sshRoster(world: World): RosterEntry[] {
  const out: RosterEntry[] = [];
  for (const name of detailedHosts(world)) {
    const p = resolveHost(world, name);
    if (p) out.push({ hostname: p.hostname, role: p.role, site: p.site, detailed: true });
  }
  for (const n of world.infra)
    if (!out.some((e) => e.hostname === n.hostname))
      out.push({ hostname: n.hostname, role: n.role, site: n.site, detailed: false });
  return out;
}
