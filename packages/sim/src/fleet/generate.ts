import type { World } from '../world';
import { enterState, pickUnhealthyState } from './health';
import { allocFleet, HEALTHY, OFFLINE } from './tables';

/**
 * Builds the fleet from the seed. Health starts at the background steady state,
 * so the fleet is never perfectly clean, even at tick 0.
 */
export function generateFleet(world: World): void {
  const cfg = world.config;
  const fleet = allocFleet(cfg.fleetSize);
  world.fleet = fleet;

  const rng = world.rng.fork('fleet', 'generate');
  const siteWeights = cfg.sites.map((s) => s.weight);
  const classWeights = cfg.serverClasses.map((c) => c.weight);
  const versionWeights = cfg.approvedVersions.map((v) => v.weight);
  const counters = new Uint32Array(cfg.sites.length * cfg.serverClasses.length);

  for (let row = 0; row < fleet.size; row++) {
    const site = rng.weighted(siteWeights);
    const cls = rng.weighted(classWeights);
    fleet.site[row] = site;
    fleet.serverClass[row] = cls;
    fleet.assignedClass[row] = cls;
    fleet.hostNum[row] = ++counters[site * cfg.serverClasses.length + cls]!;
    fleet.version[row] = rng.weighted(versionWeights);
    fleet.health[row] = HEALTHY;
    fleet.healthSince[row] = cfg.startTime - (1 + rng.int(90)) * 24 * 60 * 60 * 1000;
  }

  const healthRng = world.rng.fork('fleet', 'initial-health');
  const meanMs = cfg.background.meanUnhealthyMinutes * 60_000;
  for (let row = 0; row < fleet.size; row++) {
    if (!healthRng.chance(cfg.background.unhealthyRate)) continue;
    const since = cfg.startTime - Math.floor(healthRng.next() * 2 * meanMs);
    enterState(world, row, pickUnhealthyState(world, healthRng), since, healthRng);
  }
  for (const row of cfg.permanentOfflineRows ?? []) {
    if (row >= 0 && row < fleet.size) enterState(world, row, OFFLINE, cfg.startTime, healthRng);
  }
}
