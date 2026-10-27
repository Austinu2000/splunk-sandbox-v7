import type { World } from '@sandbox/sim';

/**
 * The server's current world. Load and reset replace it; routes read `live.world` on every
 * request, and long-lived things (terminals, caches) subscribe to swaps.
 */
export class LiveWorld {
  private listeners: ((next: World, prev: World) => void)[] = [];

  constructor(private current: World) {}

  get world(): World {
    return this.current;
  }

  onSwap(fn: (next: World, prev: World) => void): void {
    this.listeners.push(fn);
  }

  swap(next: World): void {
    const prev = this.current;
    this.current = next;
    for (const fn of this.listeners) fn(next, prev);
  }
}
