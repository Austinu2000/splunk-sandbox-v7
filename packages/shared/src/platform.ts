/** Bounded observations of shared operational state, never independent health controls. */
export interface PlatformObservation {
  id: string;
  tick: number;
  host?: string;
  servicesDown: string[];
  inputErrors: number;
  recordedEvents: number;
  recordedBytes: number;
  schedulerFailed: number;
  schedulerSkipped: number;
}
export interface PlatformRuntime {
  version: 1;
  nextId: number;
  observations: PlatformObservation[];
}
