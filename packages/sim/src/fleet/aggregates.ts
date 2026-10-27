import { HEALTH_STATES } from '@sandbox/shared';
import type { FleetTables } from './tables';

const H = HEALTH_STATES.length;

/** Counts by (site, server class, health), maintained incrementally on every transition. */
export class FleetAggregates {
  readonly counts: Int32Array;

  constructor(
    readonly sites: number,
    readonly classes: number,
  ) {
    this.counts = new Int32Array(sites * classes * H);
  }

  static fromScan(fleet: FleetTables, sites: number, classes: number): FleetAggregates {
    const agg = new FleetAggregates(sites, classes);
    for (let i = 0; i < fleet.size; i++) agg.add(fleet.site[i]!, fleet.serverClass[i]!, fleet.health[i]!, 1);
    return agg;
  }

  add(site: number, cls: number, health: number, delta: number): void {
    this.counts[(site * this.classes + cls) * H + health]! += delta;
  }

  get(site: number, cls: number, health: number): number {
    return this.counts[(site * this.classes + cls) * H + health]!;
  }

  equals(other: FleetAggregates): boolean {
    if (other.counts.length !== this.counts.length) return false;
    for (let i = 0; i < this.counts.length; i++) if (this.counts[i] !== other.counts[i]) return false;
    return true;
  }
}
