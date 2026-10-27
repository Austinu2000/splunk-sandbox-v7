import { tickWorld } from '@sandbox/sim';
import type { LiveWorld } from './live';

/**
 * Advances the world in wall-clock time. At speed 1 one tick (10 s of sim time by default) runs every
 * 10 real seconds. Speed and pause only change pacing; the tick sequence is the same either way.
 */
export class SimTicker {
  private timer: NodeJS.Timeout | null = null;

  constructor(
    private readonly live: LiveWorld,
    private readonly onTick: () => void = () => {},
  ) {}

  start(): void {
    if (this.timer) return;
    const loop = () => {
      if (!this.live.world.clock.paused) {
        tickWorld(this.live.world);
        this.onTick();
      }
      this.timer = setTimeout(loop, this.live.world.config.tickMs / this.live.world.clock.speed);
    };
    this.timer = setTimeout(loop, this.live.world.config.tickMs / this.live.world.clock.speed);
  }

  stop(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
  }
}
