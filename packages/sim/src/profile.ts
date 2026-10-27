import { isMap, isScalar, isSeq, parseDocument } from 'yaml';
import { z } from 'zod';
import { defaultWorldConfig, type WorldConfig } from './config';

const id = z.string().regex(/^[A-Za-z0-9_][A-Za-z0-9_.-]*$/);
const positive = z.number().finite().positive();
const count = positive.int();
const schema = z.object({
  id,
  name: z.string().min(1),
  description: z.string(),
  role: z.string(),
  seed: z.string().min(1),
  scale: z.object({ targetDailyIngestTB: positive.nullable(), fleetSize: count.max(250_000), users: count }),
  sites: z
    .array(z.object({ id, name: z.string(), weight: positive, subnet: z.number().int().min(1).max(254) }))
    .min(1)
    .max(255),
  infra: z.object({
    indexerCluster: z.object({
      indexers: count.max(200),
      multisite: z.boolean(),
      sitePlacement: z.record(z.number().int().nonnegative()).optional(),
      replicationFactor: count,
      searchFactor: count,
    }),
    searchHeadCluster: z.object({ members: count.max(100), deployer: z.boolean() }),
    esSearchHead: z.boolean(),
    deploymentServers: count.max(100),
    licenseManager: z.boolean(),
    monitoringConsole: z.boolean(),
    heavyForwarders: z.array(z.object({ name: id, site: id, role: id })),
    extras: z
      .array(
        z.object({
          name: id,
          role: z.enum(['soar', 'cribl_poc', 'automation']),
          enabled: z.boolean().optional(),
        }),
      )
      .default([]),
  }),
  auth: z.object({
    method: z.enum(['saml', 'ldap', 'native']),
    roleMappings: z.array(z.object({ group: z.string().min(1), roles: z.array(id).min(1) })),
  }),
  apps: z.array(id),
  serverClasses: z
    .array(
      z.object({
        id,
        short: id,
        os: z.enum(['windows', 'linux']),
        weight: positive,
        baseThroughputKBps: positive,
        outputs: z.enum(['indexers', 'hf']),
      }),
    )
    .min(2)
    .max(255),
  indexes: z.array(z.object({ name: id, retentionDays: count })),
  dataSources: z.array(
    z.object({
      id,
      sourcetypes: z.array(z.string().min(1)).min(1),
      index: id,
      via: id,
      transport: id.optional(),
      shareOfIngest: positive.max(1),
    }),
  ),
  scenarios: z.object({ core: z.array(id), profile: z.array(id) }),
});
export type Profile = z.infer<typeof schema> & {
  confirmations: { path: string; note: string }[];
  warnings: string[];
};
export class ProfileError extends Error {}

export function validateProfile(input: unknown): Profile {
  const parsed = schema.safeParse(input);
  if (!parsed.success)
    throw new ProfileError(parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '));
  const p = parsed.data;
  const fail = (path: string, message: string): never => {
    throw new ProfileError(`${p.id}.${path}: ${message}`);
  };
  const unique = (values: (string | number)[], path: string) => {
    if (new Set(values).size !== values.length) fail(path, 'values must be unique');
  };
  unique(
    p.sites.map((s) => s.id),
    'sites',
  );
  unique(
    p.sites.map((s) => s.subnet),
    'sites.subnet',
  );
  unique(
    p.serverClasses.map((c) => c.id),
    'serverClasses',
  );
  unique(
    p.serverClasses.map((c) => c.short),
    'serverClasses.short',
  );
  unique(
    p.indexes.map((i) => i.name),
    'indexes',
  );
  unique(p.apps, 'apps');
  unique(
    p.dataSources.map((d) => d.id),
    'dataSources',
  );
  unique([...p.scenarios.core, ...p.scenarios.profile], 'scenarios');
  const cluster = p.infra.indexerCluster;
  if (cluster.searchFactor > cluster.replicationFactor || cluster.replicationFactor > cluster.indexers)
    fail('infra.indexerCluster', 'require searchFactor ≤ replicationFactor ≤ indexers');
  if (cluster.multisite && !cluster.sitePlacement)
    fail('infra.indexerCluster.sitePlacement', 'required for multisite');
  if (cluster.sitePlacement) {
    if (Object.keys(cluster.sitePlacement).some((s) => !p.sites.some((x) => x.id === s)))
      fail('infra.indexerCluster.sitePlacement', 'unknown site');
    if (Object.values(cluster.sitePlacement).reduce((a, b) => a + b, 0) !== cluster.indexers)
      fail('infra.indexerCluster.sitePlacement', 'counts must total indexers');
  }
  const totalNodes =
    cluster.indexers +
    1 +
    p.infra.searchHeadCluster.members +
    Number(p.infra.esSearchHead) +
    Number(p.infra.searchHeadCluster.deployer) +
    p.infra.deploymentServers +
    1 +
    Number(p.infra.licenseManager) +
    Number(p.infra.monitoringConsole) +
    p.infra.heavyForwarders.length +
    p.infra.extras.length;
  if (totalNodes > 235)
    fail('infra', 'maximum 235 infrastructure nodes per profile to preserve reserved address space');
  const reserved = [
    'cm01',
    'lm01',
    'mc01',
    'es01',
    'deployer01',
    'bastion01',
    ...Array.from({ length: cluster.indexers + 1 }, (_, i) => `idx${String(i + 1).padStart(2, '0')}`),
    ...Array.from(
      { length: p.infra.searchHeadCluster.members },
      (_, i) => `sh${String(i + 1).padStart(2, '0')}`,
    ),
    ...Array.from({ length: p.infra.deploymentServers }, (_, i) => `ds${String(i + 1).padStart(2, '0')}`),
  ];
  unique(
    [...reserved, ...p.infra.heavyForwarders.map((h) => h.name), ...p.infra.extras.map((h) => h.name)],
    'infra.hostnames',
  );
  for (const h of p.infra.heavyForwarders)
    if (!p.sites.some((s) => s.id === h.site)) fail(`infra.heavyForwarders.${h.name}.site`, 'unknown site');
  for (const d of p.dataSources) {
    if (!p.indexes.some((i) => i.name === d.index)) fail(`dataSources.${d.id}.index`, 'unknown index');
    if (d.via !== 'forwarders' && !p.infra.heavyForwarders.some((h) => h.name === d.via))
      fail(`dataSources.${d.id}.via`, 'unknown heavy forwarder');
  }
  if (p.id !== 'default' && Math.abs(p.dataSources.reduce((s, d) => s + d.shareOfIngest, 0) - 1) > 1e-8)
    fail('dataSources.shareOfIngest', 'shares must total 1');
  if (p.id !== 'default' && p.scale.targetDailyIngestTB === null)
    fail('scale.targetDailyIngestTB', 'required for custom profiles');
  const warnings: string[] = [];
  const weight = p.serverClasses.reduce((s, c) => s + c.weight, 0);
  if (Math.abs(weight - 1) > 1e-8)
    warnings.push(
      `Server-class weights total ${Number(weight.toFixed(6))}; preserved as supplied and allocated as relative weights.`,
    );
  const metadata = input as Partial<Profile>;
  const confirmations = z
    .array(z.object({ path: z.string(), note: z.string() }))
    .parse(metadata.confirmations ?? []);
  return { ...p, confirmations, warnings };
}

export function parseProfile(text: string): Profile {
  const doc = parseDocument(text, { uniqueKeys: true });
  if (doc.errors.length) throw new ProfileError(doc.errors.map((e) => e.message).join('; '));
  const confirmations: Profile['confirmations'] = [];
  function walk(node: unknown, path: string): void {
    if (!node || typeof node !== 'object') return;
    const n = node as { comment?: string; commentBefore?: string };
    const note = [n.commentBefore, n.comment].filter(Boolean).join('\n').trim();
    if (/\bconfirm\b/i.test(note) && path && path !== 'id') confirmations.push({ path, note });
    if (isMap(node))
      for (const pair of node.items) {
        const key = isScalar(pair.key) ? String(pair.key.value) : String(pair.key);
        walk(pair.key, path ? `${path}.${key}` : key);
        walk(pair.value, path ? `${path}.${key}` : key);
      }
    if (isSeq(node)) node.items.forEach((v, i) => walk(v, `${path}.${i}`));
  }
  walk(doc.contents, '');
  return validateProfile({ ...doc.toJS({ maxAliasCount: 0 }), confirmations });
}

export function defaultProfile(): Profile {
  const c = defaultWorldConfig();
  return validateProfile({
    id: 'default',
    name: 'Default environment',
    description: 'Original v3 practice environment.',
    role: 'Splunk Engineer',
    seed: c.seed,
    scale: { targetDailyIngestTB: null, fleetSize: c.fleetSize, users: 1 },
    sites: c.sites,
    serverClasses: c.serverClasses,
    infra: {
      indexerCluster: {
        indexers: 6,
        multisite: true,
        sitePlacement: { dal: 2, ash: 2, fra: 2 },
        replicationFactor: 3,
        searchFactor: 2,
      },
      searchHeadCluster: { members: 3, deployer: false },
      esSearchHead: false,
      deploymentServers: 1,
      licenseManager: true,
      monitoringConsole: false,
      heavyForwarders: c.sites.map((s, i) => ({ name: `hf0${i + 1}`, site: s.id, role: 'syslog' })),
    },
    auth: { method: 'native', roleMappings: [] },
    apps: [],
    indexes: [
      { name: 'os', retentionDays: 365 },
      { name: 'app', retentionDays: 365 },
      { name: 'network', retentionDays: 90 },
    ],
    dataSources: [],
    scenarios: { core: [], profile: [] },
  });
}
export function loadProfile(id: string, catalog: readonly Profile[] = []): Profile {
  if (id === 'default') return defaultProfile();
  const p = catalog.find((p) => p.id === id);
  if (!p) throw new ProfileError(`Unknown environment: ${id}`);
  return validateProfile(p);
}
export function profileWorldConfig(profile: Profile): Partial<WorldConfig> {
  const p = validateProfile(profile);
  if (p.id === 'default') return {};
  return {
    profileId: p.id,
    ...(['apl', 'lab'].includes(p.id) ? { automationVersion: 1 as const } : {}),
    ...(p.id === 'lab'
      ? { permanentOfflineRows: [0], background: { ...defaultWorldConfig().background, unhealthyRate: 0 } }
      : {}),
    profile: p,
    seed: p.seed,
    fleetSize: p.scale.fleetSize,
    sites: p.sites,
    serverClasses: p.serverClasses,
  };
}
