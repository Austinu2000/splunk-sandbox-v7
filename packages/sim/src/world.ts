import { tickDataModels } from './engineering/data-models';
import { tickIngestionBuffers } from './engineering/ingestion-buffers';
import { tickClusterManagement } from './engineering/cluster-tick';
import { tickKv } from './kvstore/engine';
import { tickSchedules } from './training/schedule';
import { tickTraining } from './training/engine';
import { initGit, type GitState } from './git/state';
import { nested, newJournal, type Journal } from './journal';
import type { ActionDto } from '@sandbox/shared';
import type { InterviewRecord } from './interview/engine';
import type { WorldInfo } from '@sandbox/shared';
import { defaultWorldConfig, validateConfig, type WorldConfig } from './config';
import { FleetAggregates } from './fleet/aggregates';
import { generateFleet } from './fleet/generate';
import { backgroundRates, evolveFleet } from './fleet/health';
import { HealthHistory } from './fleet/history';
import { allocFleet, type FleetTables } from './fleet/tables';
import { generateInfra, type InfraNode } from './infra';
import type { OverlayEntry } from './vfs/vfs';
import { updateScenarios, type ScenarioState } from './scenario/engine';
import type { ServiceState } from './hosts/running';
import { applyConstraints, initDerived, type DerivedState } from './derive/state';
import { hashString, Rng } from './rng';
import { installLicenseHooks, recordLicense } from './ingest/license';
import { tickInputs } from './engineering/ingestion';
import { tickIndexLifecycle } from './engineering/lifecycle';
import { installForwarderHooks, tickForwarders } from './engineering/forwarders';
import { tickReports } from './engineering/reports';

export interface WorldClock {
  /** Sim epoch ms. Always startTime + tick * tickMs. */
  now: number;
  tick: number;
  /** Wall-clock pacing only; never affects simulation results. */
  speed: number;
  paused: boolean;
}

export interface World {
  forwarders?: import('@sandbox/shared').ForwarderRuntime;
  searchEvidence?: import('@sandbox/shared').SearchEvidence[];
  clusterManagement?: import('@sandbox/shared').ClusterManagementState;
  dashboards?: import('@sandbox/shared').DashboardRuntime;
  reports?: import('@sandbox/shared').ReportRuntime;
  ingestion?: import('@sandbox/shared').IngestionState;
  kvstore?: import('@sandbox/shared').KvState;
  lesson?: {
    id: string;
    learner: string;
    startedTick: number;
    hints: number;
    notes: string;
    answers?: Record<string, string>;
    returnProfile?: string;
  };
  dataModels?: import('@sandbox/shared').DataModelRuntime;
  platform?: import('@sandbox/shared').PlatformRuntime;
  ingestionBuffers?: import('@sandbox/shared').IngestionBufferRuntime;
  training?: import('@sandbox/shared').TrainingState;
  actionSequence?: number;
  code?: import('@sandbox/shared').CodeState;
  git?: GitState;
  config: WorldConfig;
  uiState: Record<string, string>;
  rng: Rng;
  seedHash: number;
  clock: WorldClock;
  fleet: FleetTables;
  aggregates: FleetAggregates;
  history: HealthHistory;
  infra: InfraNode[];
  /** Version strings indexed by fleet.version: approved versions first, then drift versions. */
  versions: string[];
  hosts: HostRuntime;
  /** Fleet behaviour derived from running config (deployment server mappings, output reachability). */
  derived: DerivedState;
  scenarios: ScenarioState;
  /** Everything the user did (commands, searches, pages, hints), in order. */
  actions: ActionDto[];
  interviews: InterviewRecord[];
  /** Every user change, by tick: what save stores and load replays. */
  journal: Journal;
}

/** Per-host state created by user activity. Generated content is never stored, only changes to it. */
export interface HostRuntime {
  /** hostname → path → change on top of the generated filesystem. */
  fsOverlay: Map<string, Map<string, OverlayEntry>>;
  /** hostname → sim time of the user's last SSH login. */
  lastLogin: Map<string, number>;
  /** hostname → overlay as splunkd last loaded it (at start, or reload for the deployment server). */
  restartSnapshot: Map<string, Map<string, OverlayEntry>>;
  /** hostname → splunkd service state; hosts never touched are running. */
  services: Map<string, ServiceState>;
  /** Bumped whenever any running config changes; caches key on it. */
  confVersion: number;
  revisions: Map<string, { time: number; overlay: Map<string, OverlayEntry> }[]>;
}

export function createWorld(overrides: Partial<WorldConfig> = {}): World {
  installLicenseHooks();
  installForwarderHooks();
  const config = defaultWorldConfig(overrides);
  if (config.automationVersion === undefined && ['apl', 'lab'].includes(config.profileId))
    config.automationVersion = 1;
  validateConfig(config);
  const world: World = {
    config,
    uiState: {},
    rng: new Rng(config.seed),
    seedHash: hashString(config.seed),
    clock: { now: config.startTime, tick: 0, speed: 1, paused: false },
    fleet: allocFleet(0),
    aggregates: new FleetAggregates(config.sites.length, config.serverClasses.length),
    history: new HealthHistory(1),
    infra: generateInfra(config),
    versions: [...config.approvedVersions.map((v) => v.version), ...config.driftVersions],
    hosts: {
      fsOverlay: new Map(),
      lastLogin: new Map(),
      restartSnapshot: new Map(),
      services: new Map(),
      confVersion: 0,
      revisions: new Map(),
    },
    scenarios: { definitions: [], tickets: [], injected: [] },
    actions: [],
    interviews: [],
    journal: newJournal(),
    derived: null as unknown as DerivedState,
  };
  generateFleet(world);
  initGit(world);
  world.aggregates = FleetAggregates.fromScan(world.fleet, config.sites.length, config.serverClasses.length);
  world.history = new HealthHistory(historyCapacity(world));
  world.derived = initDerived(world);
  return world;
}

/** Room for about 4x the expected background transitions over the retention window. */
function historyCapacity(world: World): number {
  const { pRecover } = backgroundRates(world);
  const ticks = world.config.historyRetentionMs / world.config.tickMs;
  const expected = 2 * world.config.fleetSize * world.config.background.unhealthyRate * pRecover * ticks;
  return Math.ceil(expected * 4) + 4096;
}

/** Advances the simulation by `n` ticks. Results depend only on the seed and the tick number. */
export function tickWorld(world: World, n = 1): void {
  // Ticks are deterministic, so nothing they do is journaled (replay re-runs them).
  nested(world, () => {
    for (let k = 0; k < n; k++) tickOnce(world);
  });
}

function tickOnce(world: World): void {
  const tick = world.clock.tick + 1;
  const now = world.config.startTime + tick * world.config.tickMs;
  const prev = world.clock.now;
  world.clock.tick = tick;
  world.clock.now = now;
  const rng = world.rng.fork('tick', tick);
  evolveFleet(world, rng, now);
  applyConstraints(world, rng.fork('constraints'), prev, now);
  if (Math.floor(prev / 60_000) !== Math.floor(now / 60_000)) recordLicense(world);
  tickSchedules(world);
  tickKv(world);
  tickTraining(world);
  tickForwarders(world);
  tickInputs(world);
  tickIngestionBuffers(world);
  tickIndexLifecycle(world);
  tickClusterManagement(world);
  tickReports(world);
  tickDataModels(world);
  updateScenarios(world);
  world.history.prune(now - world.config.historyRetentionMs);
}

export function setClock(world: World, patch: { speed?: number; paused?: boolean }): void {
  if (patch.speed !== undefined) world.clock.speed = patch.speed;
  if (patch.paused !== undefined) world.clock.paused = patch.paused;
}

export function worldInfo(world: World): WorldInfo {
  const { config, clock } = world;
  return {
    profileId: config.profileId,
    profileName: config.profile?.name ?? 'Default environment',
    seed: config.seed,
    fleetSize: config.fleetSize,
    now: clock.now,
    tick: clock.tick,
    tickMs: config.tickMs,
    speed: clock.speed,
    paused: clock.paused,
    sites: config.sites.map((s) => ({ id: s.id, name: s.name })),
    serverClasses: config.serverClasses.map((c) => ({ id: c.id, os: c.os })),
    infra: world.infra.map(({ hostname, role, site, ip, status }) => ({ hostname, role, site, ip, status })),
  };
}
