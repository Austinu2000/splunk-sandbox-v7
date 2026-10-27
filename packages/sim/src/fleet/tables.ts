import { HEALTH_STATES, type HealthState } from '@sandbox/shared';

/** Numeric code for each health state: its index in HEALTH_STATES. */
export const HEALTH_CODE = Object.fromEntries(HEALTH_STATES.map((s, i) => [s, i])) as Record<
  HealthState,
  number
>;
export const HEALTHY = 0;
export const STALE = HEALTH_CODE.stale_phonehome;
export const BLOCKED = HEALTH_CODE.blocked_queue;
export const OFFLINE = HEALTH_CODE.offline;
export const DRIFT = HEALTH_CODE.version_drift;
export const WRONG_CLASS = HEALTH_CODE.wrong_serverclass;

/**
 * The forwarder fleet, stored column-wise. Row i is one forwarder.
 * Anything derivable (hostname, IP, OS, output group, live phone-home time, queue fill, throughput)
 * is computed on read instead of stored.
 */
export interface FleetTables {
  size: number;
  site: Uint8Array;
  serverClass: Uint8Array;
  /** Server class the deployment server maps this client to; differs only for wrong_serverclass. */
  assignedClass: Uint8Array;
  /** Per (site, class) sequence number used in the hostname. */
  hostNum: Uint32Array;
  /** Index into [...approvedVersions, ...driftVersions]. */
  version: Uint8Array;
  health: Uint8Array;
  healthSince: Float64Array;
  /** Last phone-home for rows that stopped phoning home; NaN while live. */
  phoneHomeFrozenAt: Float64Array;
}

export function allocFleet(size: number): FleetTables {
  return {
    size,
    site: new Uint8Array(size),
    serverClass: new Uint8Array(size),
    assignedClass: new Uint8Array(size),
    hostNum: new Uint32Array(size),
    version: new Uint8Array(size),
    health: new Uint8Array(size),
    healthSince: new Float64Array(size),
    phoneHomeFrozenAt: new Float64Array(size).fill(NaN),
  };
}
