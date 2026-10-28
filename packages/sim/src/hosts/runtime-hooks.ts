import type { World } from '../world';
import type { HostProfile } from './profile';
/** Independent registration point so state derivation does not depend on runtime module evaluation order. */
export const runtimeHooks: {
  changed: ((world: World, host: HostProfile) => void)[];
  beforeChange: ((world: World, host: HostProfile, action: 'stop' | 'start' | 'reload') => void)[];
} = { changed: [], beforeChange: [] };
