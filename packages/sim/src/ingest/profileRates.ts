import type { World } from '../world';
import type { HostProfile } from '../hosts/profile';
import { unit } from '../rng';
const populations = new WeakMap<World, { windows: number; linux: number }>();
export function profilePopulation(world: World): { windows: number; linux: number } {
  let counts = populations.get(world);
  if (!counts) {
    counts = { windows: 0, linux: 0 };
    for (let row = 0; row < world.fleet.size; row++)
      counts[world.config.serverClasses[world.fleet.serverClass[row]!]!.os]++;
    populations.set(world, counts);
  }
  return counts;
}
/** Decimal TB, with a shared deterministic ±2% minute variance. No capacity is inferred from company data. */
export function profileInputRate(
  world: World,
  p: Pick<HostProfile, 'hostname' | 'os' | 'fleetRow'>,
  index: string,
  st: string,
  at: number,
): number {
  const profile = world.config.profile;
  if (!profile) return 0;
  const source = profile.dataSources.find(
    (d) =>
      d.index === index &&
      d.sourcetypes.includes(st) &&
      (d.via === p.hostname || (d.via === 'forwarders' && p.fleetRow !== undefined)),
  );
  if (!source) return 0;
  const n = source.via === 'forwarders' ? profilePopulation(world)[p.os] : 1;
  return (
    ((((profile.scale.targetDailyIngestTB! * 1e12) / 86400) * source.shareOfIngest) /
      source.sourcetypes.length /
      Math.max(1, n)) *
    (0.98 + 0.04 * unit(world.seedHash, Math.floor(at / 60000), 0x7614))
  );
}
