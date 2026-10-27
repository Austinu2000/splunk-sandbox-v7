import { profileInputRate } from '../ingest/profileRates';
import type { Rng } from '../rng';
import { unit, mix32 } from '../rng';
import type { World } from '../world';
import { BLOCKED, DRIFT, HEALTHY, OFFLINE, STALE, WRONG_CLASS } from './tables';
import { HEALTH_STATES, type UnhealthyState } from '@sandbox/shared';

const UNHEALTHY = HEALTH_STATES.slice(1) as UnhealthyState[];

/** States in which the forwarder no longer phones home to the deployment server. */
export function isPhoneHomeFrozen(health: number): boolean {
  return health === STALE || health === OFFLINE;
}

/** The phone-home time a live client would show at `now`: the latest multiple of the interval, shifted by a per-row phase. */
export function liveLastPhoneHome(world: World, row: number, now: number): number {
  const interval = world.config.phoneHomeIntervalMs;
  const phase = mix32(world.seedHash, row, 0x9407) % interval;
  return Math.floor((now - phase) / interval) * interval + phase;
}

export function lastPhoneHome(world: World, row: number, now: number): number {
  const frozen = world.fleet.phoneHomeFrozenAt[row]!;
  return Number.isNaN(frozen) ? liveLastPhoneHome(world, row, now) : frozen;
}

export function queueFillPct(world: World, row: number, now: number): number {
  const h = world.fleet.health[row]!;
  if (h === BLOCKED) return 100;
  if (h === OFFLINE) return 0;
  const minute = Math.floor(now / 60_000);
  return Math.round(4 + unit(world.seedHash, row, minute, 0x0f11) * 22);
}

export function throughputKBps(
  world: World,
  row: number,
  now: number,
  health = world.fleet.health[row]!,
): number {
  const h = health;
  if (h === BLOCKED || h === OFFLINE) return 0;
  if (world.config.profile) {
    const os = world.config.serverClasses[world.fleet.serverClass[row]!]!.os;
    return world.config.profile.dataSources
      .filter(
        (d) =>
          d.via === 'forwarders' &&
          (os === 'windows'
            ? d.sourcetypes.includes('XmlWinEventLog')
            : !d.sourcetypes.includes('XmlWinEventLog')),
      )
      .reduce(
        (sum, d) =>
          sum +
          d.sourcetypes.reduce(
            (n, st) =>
              n + profileInputRate(world, { hostname: '', os, fleetRow: row }, d.index, st, now) / 1024,
            0,
          ),
        0,
      );
  }
  const base = world.config.serverClasses[world.fleet.serverClass[row]!]!.baseThroughputKBps;
  const minute = Math.floor(now / 60_000);
  return Math.round(base * (0.6 + 0.8 * unit(world.seedHash, row, minute, 0x7410)) * 10) / 10;
}

function pickApprovedVersion(world: World, rng: Rng): number {
  return rng.weighted(world.config.approvedVersions.map((v) => v.weight));
}

/**
 * Applies the column changes for a row entering `state` at time `at`.
 * Does not touch aggregates or history; use setHealth for live transitions.
 */
export function enterState(
  world: World,
  row: number,
  state: number,
  at: number,
  rng: Rng,
  assigned?: number,
): void {
  const f = world.fleet;
  const prev = f.health[row]!;
  // Undo the previous state's side effects.
  if (prev === DRIFT && state !== DRIFT) f.version[row] = pickApprovedVersion(world, rng);
  if (prev === WRONG_CLASS && state !== WRONG_CLASS) f.assignedClass[row] = f.serverClass[row]!;
  if (isPhoneHomeFrozen(prev) && !isPhoneHomeFrozen(state)) f.phoneHomeFrozenAt[row] = NaN;

  // Apply the new state's side effects.
  if (state === DRIFT) {
    f.version[row] = world.config.approvedVersions.length + rng.int(world.config.driftVersions.length);
  } else if (state === WRONG_CLASS) {
    const classes = world.config.serverClasses.length;
    f.assignedClass[row] = assigned ?? (f.serverClass[row]! + 1 + rng.int(classes - 1)) % classes;
  } else if (isPhoneHomeFrozen(state) && !isPhoneHomeFrozen(prev)) {
    f.phoneHomeFrozenAt[row] = liveLastPhoneHome(world, row, at);
  }

  f.health[row] = state;
  f.healthSince[row] = at;
}

/** Live transition: updates columns, aggregates and history together so they never disagree. */
export function setHealth(
  world: World,
  row: number,
  state: number,
  at: number,
  rng: Rng,
  assigned?: number,
): void {
  const f = world.fleet;
  const prev = f.health[row]!;
  if (prev === state) return;
  enterState(world, row, state, at, rng, assigned);
  world.aggregates.add(f.site[row]!, f.serverClass[row]!, prev, -1);
  world.aggregates.add(f.site[row]!, f.serverClass[row]!, state, 1);
  world.history.push(at, row, prev, state);
}

export function pickUnhealthyState(world: World, rng: Rng): number {
  const w = world.config.background.stateWeights;
  return 1 + rng.weighted(UNHEALTHY.map((s) => w[s]));
}

/** Per-tick probabilities that give the configured long-run unhealthy rate and mean outage length. */
export function backgroundRates(world: World): { pFail: number; pRecover: number } {
  const { unhealthyRate, meanUnhealthyMinutes } = world.config.background;
  const pRecover = Math.min(1, world.config.tickMs / (meanUnhealthyMinutes * 60_000));
  const pFail = unhealthyRate === 0 ? 0 : (pRecover * unhealthyRate) / (1 - unhealthyRate);
  return { pFail, pRecover };
}

/** Background churn: a small random slice of the fleet fails or recovers each tick. */
export function evolveFleet(world: World, rng: Rng, at: number): void {
  const { pFail, pRecover } = backgroundRates(world);
  const health = world.fleet.health;
  const constrained = world.derived?.constrained;
  for (let row = 0; row < world.fleet.size; row++) {
    const draw = rng.next();
    // Rows held in a state by running config are not subject to background churn.
    if (constrained?.[row] || world.config.permanentOfflineRows?.includes(row)) continue;
    if (health[row] === HEALTHY) {
      if (draw < pFail) setHealth(world, row, pickUnhealthyState(world, rng), at, rng);
    } else if (draw < pRecover) {
      setHealth(world, row, HEALTHY, at, rng);
    }
  }
}
