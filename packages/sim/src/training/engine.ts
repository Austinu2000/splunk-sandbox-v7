import { kvState, kvStatus, kvFault, kvResync, kvDefaultHost } from '../kvstore/engine';
import { refreshClusterPractice } from './cluster';
import type { TrainingResource, TrainingState, TrainingValue, TrainingEvidence } from '@sandbox/shared';
import type { World } from '../world';
import { journal } from '../journal';
import { TRAINING_CASES } from './catalog';
export class TrainingError extends Error {}
function resource(
  id: TrainingResource['kind'],
  title: string,
  config: Record<string, TrainingValue>,
): TrainingResource {
  return {
    id,
    kind: id,
    title,
    config: { ...config },
    running: { ...config },
    revision: 1,
    appliedRevision: 1,
    metrics: {},
    queue: [],
    delivered: [],
    retained: [],
    logs: [],
  };
}
export function training(world: World): TrainingState {
  if (world.training) return world.training;
  world.training = {
    version: 1,
    nextId: 1,
    learners: ['Austin'],
    learner: 'Austin',
    evidence: [],
    attempts: [],
    answers: {},
    macros: { platform_health: 'index=_internal | stats count by host' },
    summaries: {},
    lookups: {
      employee_lookup: [
        { employee_id: 1, name: 'Alex', department: 'IT' },
        { employee_id: 2, name: 'Jordan', department: 'Finance' },
        { employee_id: 3, name: 'Taylor', department: 'IT' },
      ],
    },
    resources: [
      resource('aws', 'AWS S3 → SQS → ingestion', {
        readAllowed: true,
        deleteAllowed: true,
        deduplicate: true,
        consumeRate: 10,
      }),
      resource('hec', 'HTTP Event Collector', {
        tokenValid: true,
        index: 'network',
        allowedIndex: 'network',
        ackEnabled: true,
      }),
      resource('cribl', 'Cribl persistent queue', {
        destinationUp: true,
        queueEnabled: true,
        capacity: 100,
        drainRate: 10,
        dropAll: false,
        retainReplay: true,
      }),
      resource('cluster', 'Cluster copy and discovery lab', {
        replicationFactor: 3,
        searchFactor: 2,
        peerDown: false,
        maintenance: false,
        managerUp: true,
        discoveryCached: true,
      }),
      resource('shc', 'Search head replication', {
        captainUp: true,
        replicationPortOpen: true,
        memberRevision: 1,
        captainRevision: 1,
      }),
      resource('kvstore', 'KV Store replication', {
        captainUp: true,
        replicationPortOpen: true,
        memberRevision: 1,
        captainRevision: 1,
      }),
      resource('monitor', 'Independent platform monitoring', { webUp: true, externalProbe: true }),
      resource('storage', 'Bucket lifecycle / remote store', {
        remoteAvailable: true,
        cacheWarm: true,
        archivePreserved: true,
        retentionDays: 90,
        ageDays: 30,
      }),
      resource('migration', 'On-premises → cloud cutover', {
        sourceInventoried: true,
        dualWrite: true,
        destinationValidated: true,
        cloudActive: false,
        rollbackAvailable: true,
      }),
      resource('dashboard', 'Dashboard execution plan', {
        sharedBase: true,
        narrowTime: true,
        dropPanel: false,
      }),
      resource('otel', 'Checkout service collector', {
        receiverEnabled: true,
        tracePipeline: true,
        exporterAuthorized: true,
        serviceName: 'checkout',
        sampleRate: 1,
      }),
      resource('itsi', 'Checkout service KPIs', {
        dependencyHealthy: true,
        deduplicate: true,
        suppressCritical: false,
      }),
      resource('security', 'Privileged account detection → ServiceNow', {
        assetEnrichment: true,
        identityEnrichment: true,
        actionAllowed: true,
        adminAll: false,
      }),
    ],
  };
  refreshTraining(world);
  return world.training;
}
export function getResource(world: World, id: string): TrainingResource {
  const r = training(world).resources.find((r) => r.id === id);
  if (!r) throw new TrainingError('Unknown resource');
  return r;
}
export function recordEvidence(
  world: World,
  kind: string,
  target: string,
  revision: number,
  success: boolean,
  detail: string,
): TrainingEvidence {
  const s = training(world);
  const e = { id: s.nextId++, tick: world.clock.tick, kind, target, revision, success, detail };
  s.evidence.push(e);
  return e;
}
export function persistTraining(world: World): void {
  journal(world, { k: 'training.state', state: structuredClone(training(world)) });
}
export function refreshTraining(world: World): void {
  const s = world.training;
  if (!s) return;
  for (const r of s.resources) {
    const c = r.running,
      m = r.metrics;
    switch (r.kind) {
      case 'aws':
        Object.assign(m, {
          backlog: r.queue.length,
          delivered: r.delivered.length,
          lost: m.lost ?? 0,
          checkpoint: r.delivered.at(-1) ?? 'none',
          access: c.readAllowed ? 'allowed' : 'AccessDenied',
        });
        break;
      case 'cribl':
        Object.assign(m, {
          backlog: r.queue.length,
          delivered: r.delivered.length,
          lost: m.lost ?? 0,
          criticalPreserved: !c.dropAll && (m.lost ?? 0) === 0,
          retained: r.retained.length,
        });
        break;
      case 'hec':
        Object.assign(m, {
          accepted: r.delivered.length,
          correctIndex: c.index === c.allowedIndex,
          acknowledged: !!c.ackEnabled && r.delivered.length > 0,
        });
        break;
      case 'cluster': {
        const peers = world.infra.filter((n) => n.role === 'indexer' && !n.retired).length;
        const healthy = Math.max(0, peers - (c.peerDown ? 1 : 0));
        Object.assign(m, {
          peers,
          healthyPeers: healthy,
          replicationMet: healthy >= Number(c.replicationFactor),
          searchFactorMet: healthy >= Number(c.searchFactor),
          maintenance: c.maintenance,
          fixupComplete: !c.maintenance && healthy >= Number(c.replicationFactor),
          discoveryAvailable: !!c.managerUp || !!c.discoveryCached,
        });
        break;
      }
      case 'kvstore': {
        const host = kvState(world).nodes.at(-1)?.host ?? kvDefaultHost(world),
          status = kvStatus(world, host);
        Object.assign(m, {
          membersInSync: status.membersInSync,
          primary: status.primary ?? 'none',
          memberRevision: status.appliedRevision,
          latestRevision: status.latestRevision,
          serverVersion: status.serverVersion,
          status: status.status,
        });
        break;
      }
      case 'shc':
        Object.assign(m, {
          membersInSync: c.captainUp && c.replicationPortOpen && c.memberRevision === c.captainRevision,
          captainUp: c.captainUp,
          memberRevision: c.memberRevision,
          captainRevision: c.captainRevision,
        });
        break;
      case 'monitor':
        Object.assign(m, {
          webAvailable: c.webUp,
          monitorIndependent: c.externalProbe,
          alertFiring: !c.webUp && !!c.externalProbe,
        });
        break;
      case 'storage':
        Object.assign(m, {
          searchable: !!c.remoteAvailable || !!c.cacheWarm,
          cacheMiss: !c.cacheWarm,
          archivePreserved: c.archivePreserved,
          bucketState:
            Number(c.ageDays) >= Number(c.retentionDays) ? 'frozen' : Number(c.ageDays) > 7 ? 'cold' : 'warm',
        });
        break;
      case 'migration':
        Object.assign(m, {
          cutoverSafe:
            !!c.sourceInventoried && !!c.dualWrite && !!c.destinationValidated && !!c.rollbackAvailable,
          cloudActive: c.cloudActive,
        });
        break;
      case 'dashboard':
        Object.assign(m, {
          workUnits: (c.sharedBase ? 1000 : 6000) + (c.narrowTime ? 100 : 5000),
          optimized: !!c.sharedBase && !!c.narrowTime,
          equivalent: !c.dropPanel,
          panelResults: c.dropPanel ? 'missing panel' : '200, 20, 10',
        });
        break;
      case 'otel':
        Object.assign(m, {
          tracesAvailable:
            !!c.receiverEnabled && !!c.tracePipeline && !!c.exporterAuthorized && Number(c.sampleRate) > 0,
          serviceAttributed: String(c.serviceName).trim().length > 0,
          traceId: 'trace-checkout-001',
          rootSpan: 'checkout',
          childSpan: 'payment',
          parentSpanId: 'checkout',
          logsAvailable: true,
        });
        break;
      case 'itsi':
        Object.assign(m, {
          serviceHealthy: c.dependencyHealthy,
          actionableAlerts: !!c.deduplicate && !c.suppressCritical,
          alertCount: c.deduplicate ? (c.dependencyHealthy ? 0 : 1) : 30,
          healthScore: c.dependencyHealthy ? 100 : 25,
        });
        break;
      case 'security':
        Object.assign(m, {
          enriched: !!c.assetEnrichment && !!c.identityEnrichment,
          leastPrivilege: !c.adminAll,
          incidentCreated: r.delivered.length > 0,
        });
        break;
    }
  }
  refreshClusterPractice(world);
}
export function tickTraining(world: World): void {
  if (!world.training) return;
  for (const r of world.training.resources) {
    const c = r.running;
    if (r.kind === 'aws' && c.readAllowed) {
      for (let i = 0; i < Number(c.consumeRate) && r.queue.length; i++) {
        const id = r.queue[0]!;
        if (!c.deduplicate || !r.delivered.includes(id)) r.delivered.push(id);
        if (c.deleteAllowed) r.queue.shift();
        else break;
      }
    }
    if (r.kind === 'cribl' && c.destinationUp) {
      const batch = r.queue.splice(0, Number(c.drainRate));
      if (c.dropAll) r.metrics.lost = Number(r.metrics.lost ?? 0) + batch.length;
      else {
        r.delivered.push(...batch);
        if (c.retainReplay) r.retained.push(...batch);
      }
    }
  }
  refreshTraining(world);
}
export function trainingResolved(world: World, id: string): boolean {
  refreshTraining(world);
  const c = TRAINING_CASES.find((c) => c.id === id);
  return !!c && Object.entries(c.checks).every(([k, v]) => getResource(world, c.resource).metrics[k] === v);
}
export function trainingAction(world: World, action: string, target: string, value: unknown = {}): unknown {
  const s = training(world);
  if (action === 'answer') {
    const v = value as { text: string; basis: 'work experience' | 'sandbox practice' };
    if (
      !/^IQ\d{3}$/.test(target) ||
      typeof v.text !== 'string' ||
      v.text.length > 20000 ||
      !['work experience', 'sandbox practice'].includes(v.basis)
    )
      throw new TrainingError('Invalid practice answer');
    s.answers[`${s.learner}:${target}`] = { ...v, updated: world.clock.tick };
    persistTraining(world);
    return s.answers;
  }
  if (action === 'learner') {
    if (!/^[\w -]{1,50}$/.test(target)) throw new TrainingError('Use a short learner name');
    if (!s.learners.includes(target)) s.learners.push(target);
    s.learner = target;
    persistTraining(world);
    return target;
  }
  if (action === 'start') {
    const c = TRAINING_CASES.find((c) => c.id === target);
    if (!c) throw new TrainingError('Unknown exercise');
    const r = getResource(world, c.resource);
    if (
      s.attempts.some(
        (a) => a.closed === undefined && TRAINING_CASES.find((c) => c.id === a.scenario)?.resource === r.id,
      )
    )
      throw new TrainingError('Finish the active exercise for this resource first');
    Object.assign(r.config, c.faults);
    r.running = { ...r.config };
    r.revision++;
    r.appliedRevision = r.revision;
    r.queue = [];
    r.delivered = [];
    r.retained = [];
    r.metrics = {};
    if (['aws', 'cribl'].includes(r.kind))
      r.queue = Array.from({ length: 40 }, (_, i) => `${r.kind}-event-${i + 1}`);
    if (r.kind === 'shc') r.running.memberRevision = 0;
    if (r.kind === 'kvstore')
      kvFault(world, kvState(world).nodes.at(-1)!.host, !!r.running.replicationPortOpen);
    r.logs = [`tick ${world.clock.tick}: ${c.title}`];
    const e = recordEvidence(world, 'start', r.id, r.revision, true, c.title);
    s.attempts.push({
      id: `LAB-${s.nextId++}`,
      scenario: target,
      fromEvidence: e.id,
      started: world.clock.tick,
      notes: {},
    });
    refreshTraining(world);
    persistTraining(world);
    return s.attempts.at(-1);
  }
  if (action === 'submit') {
    const a = s.attempts.find((a) => a.id === target);
    if (!a || a.closed !== undefined) throw new TrainingError('No open attempt');
    const notes = value as Record<string, string>;
    if (!notes || Object.values(notes).some((v) => typeof v !== 'string' || v.length > 20000))
      throw new TrainingError('Invalid notes');
    const c = TRAINING_CASES.find((c) => c.id === a.scenario)!;
    const events = s.evidence.filter((e) => e.id > a.fromEvidence && e.target === c.resource && e.success);
    const change = events.find((e) => e.kind === 'apply');
    const inspected = events.some((e) => e.kind === 'inspect' && (!change || e.id < change.id));
    const verified =
      !!change &&
      events.some(
        (e) =>
          e.kind === 'inspect' &&
          e.id > change.id &&
          e.revision === getResource(world, c.resource).appliedRevision,
      );
    const recovery = trainingResolved(world, c.id) ? 50 : 0;
    const process = (inspected ? 15 : 0) + (verified ? 15 : 0);
    const fields = ['impact', 'rootCause', 'change', 'rollback', 'verification', 'prevention'];
    const completed = fields.filter((k) => (notes[k] ?? '').trim().length >= 20);
    a.notes = { ...notes };
    a.score = {
      recovery,
      process,
      communication: Math.round((completed.length / fields.length) * 20),
      feedback: [
        recovery ? 'Recovery checks passed.' : 'Recovery checks have not passed.',
        inspected ? 'Pre-change evidence captured.' : 'Missing pre-change inspection.',
        verified ? 'Current revision verified.' : 'Inspect the applied revision after changing it.',
        `Explanation checklist: ${completed.length}/6 sections have substantive notes; this checks completeness, not factual expertise.`,
        ...(!recovery ? [] : [c.solution]),
      ],
    };
    if (recovery) a.closed = world.clock.tick;
    persistTraining(world);
    return a;
  }
  const r = getResource(world, target);
  if (action === 'configure') {
    const patch = value as Record<string, TrainingValue>;
    if (!patch || typeof patch !== 'object' || Array.isArray(patch))
      throw new TrainingError('Expected configuration object');
    for (const [k, v] of Object.entries(patch)) {
      if (
        !Object.hasOwn(r.config, k) ||
        typeof v !== typeof r.config[k] ||
        (typeof v === 'number' && (!Number.isFinite(v) || v < 0 || v > 100000))
      )
        throw new TrainingError(`Invalid setting: ${k}`);
      if (typeof v === 'string' && v.length > 200) throw new TrainingError('Setting too long');
    }
    Object.assign(r.config, patch);
    r.revision++;
    recordEvidence(world, 'edit', target, r.revision, true, 'Staged configuration');
  } else if (action === 'apply') {
    r.running = { ...r.config };
    r.appliedRevision = r.revision;
    if (r.kind === 'kvstore')
      kvFault(
        world,
        kvState(world).nodes.at(-1)!.host,
        !!r.running.replicationPortOpen && !!r.running.captainUp,
      );
    recordEvidence(world, 'apply', target, r.revision, true, 'Applied configuration');
  } else if (action === 'inspect') {
    recordEvidence(world, 'inspect', target, r.appliedRevision, true, JSON.stringify(r.metrics));
  } else if (action === 'resync') {
    if (!['shc', 'kvstore'].includes(r.kind) || !r.running.captainUp || !r.running.replicationPortOpen)
      throw new TrainingError('Replication unavailable');
    if (r.kind === 'kvstore') kvResync(world, kvState(world).nodes.at(-1)!.host);
    r.running.memberRevision = r.running.captainRevision!;
    r.config.memberRevision = r.running.memberRevision;
    recordEvidence(world, 'resync', target, r.appliedRevision, true, 'Member synchronized');
  } else if (action === 'send') {
    if (r.kind === 'hec') {
      if (!r.running.tokenValid) throw new TrainingError('HEC 403: invalid token');
      if (r.running.index !== r.running.allowedIndex)
        throw new TrainingError('HEC 400: index is not allowed');
      r.delivered.push(`hec-${s.nextId}`);
    } else if (r.kind === 'security') {
      if (
        !r.running.actionAllowed ||
        !r.running.assetEnrichment ||
        !r.running.identityEnrichment ||
        r.running.adminAll
      )
        throw new TrainingError('Response requires enrichment and scoped permission');
      r.delivered.push(`INC-${s.nextId}`);
    } else throw new TrainingError('Send is supported for HEC and response actions');
    recordEvidence(world, 'send', target, r.appliedRevision, true, 'Fixture delivered');
  } else if (action === 'replay') {
    if (r.kind !== 'cribl' || !r.running.retainReplay || !r.retained.length)
      throw new TrainingError('No retained replay data');
    if (r.queue.length + r.retained.length > Number(r.running.capacity))
      throw new TrainingError('Queue capacity exceeded');
    r.queue.push(...r.retained);
    recordEvidence(
      world,
      'replay',
      target,
      r.appliedRevision,
      true,
      'Retained events queued; downstream deduplication may be required',
    );
  } else if (action === 'cutover') {
    refreshTraining(world);
    if (r.kind !== 'migration' || !r.metrics.cutoverSafe)
      throw new TrainingError('Cutover requires inventory, dual write, validated parity and rollback');
    r.running.cloudActive = true;
    r.config.cloudActive = true;
    recordEvidence(world, 'cutover', target, r.appliedRevision, true, 'Cloud active');
  } else if (action === 'rollback') {
    if (r.kind !== 'migration' || !r.running.rollbackAvailable)
      throw new TrainingError('Rollback unavailable');
    r.running.cloudActive = false;
    r.config.cloudActive = false;
    recordEvidence(world, 'rollback', target, r.appliedRevision, true, 'On-premises active');
  } else throw new TrainingError('Unsupported operation');
  refreshTraining(world);
  r.logs.push(`tick ${world.clock.tick}: ${action} revision ${r.appliedRevision}`);
  r.logs = r.logs.slice(-100);
  persistTraining(world);
  return r;
}
