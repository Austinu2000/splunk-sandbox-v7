import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import {
  createWorld,
  tickWorld,
  parseProfile,
  profileWorldConfig,
  loadProfile,
  configureScenarios,
  parseScenario,
  startScenario,
  saveWorld,
  loadWorld,
  summarizeFleet,
  runSearch,
} from '../src';
import { fixed, patchConf } from '../src/scenario/engine';
import { hostFs } from '../src/vfs/build';
import { resolveHost } from '../src/hosts/profile';
import { restartSplunk, reloadDeployServer } from '../src/hosts/running';
import { ROOT } from '../src/vfs/vfs';
import { totalRate, computeLicenseRates } from '../src/ingest/license';
import { applyShcBundle, runPlaybook } from '../src/operations';
import { infraName } from '../src/infra';
import { monitoringConsole } from '../src/consoles/monitoring';
import { rowToPlain } from '../src/spl/run';
const root = new URL('../../../', import.meta.url);
const profile = (id: string) => parseProfile(readFileSync(new URL(`profiles/${id}.yaml`, root), 'utf8'));
const defs = readdirSync(new URL('scenarios/', root))
  .filter((f) => f.endsWith('.yaml'))
  .map((f) => parseScenario(readFileSync(new URL(`scenarios/${f}`, root), 'utf8')));
const fixture = JSON.parse(readFileSync(new URL('fixtures/default-v3.json', import.meta.url), 'utf8'));
const solutions = JSON.parse(
  readFileSync(new URL('fixtures/profile-solutions.json', import.meta.url), 'utf8'),
) as Record<string, { fixes: Record<string, unknown>[]; action: string | null }>;
function setup(id: string) {
  const w = createWorld(profileWorldConfig(profile(id)));
  configureScenarios(w, defs);
  return w;
}
describe('profile validation and compatibility', () => {
  it('preserves the captured v3 default fleet, infrastructure and evolution', () => {
    const w = createWorld({ seed: 'v3-compatibility', fleetSize: 2000 });
    const snap = () =>
      JSON.parse(
        JSON.stringify({
          clock: w.clock,
          fleet: Object.fromEntries(
            Object.entries(w.fleet).map(([k, v]) => [
              k,
              ArrayBuffer.isView(v)
                ? createHash('sha256')
                    .update(Buffer.from(v.buffer, v.byteOffset, v.byteLength))
                    .digest('hex')
                : v,
            ]),
          ),
          infra: w.infra,
          summary: summarizeFleet(w),
        }),
      );
    expect(snap()).toEqual(fixture.initial);
    tickWorld(w, 120);
    expect(snap()).toEqual(fixture.advanced);
  });
  it('preserves placeholders and rejects broken relationships and unknown IDs', () => {
    const apl = profile('apl');
    expect(apl.scale).toMatchObject({ fleetSize: 6000, targetDailyIngestTB: 3.5 });
    expect(apl.confirmations).toContainEqual(expect.objectContaining({ path: 'scale.fleetSize' }));
    expect(apl.warnings[0]).toContain('0.95');
    const text = readFileSync(new URL('profiles/erie.yaml', root), 'utf8');
    expect(() => parseProfile(text.replace('via: hf01', 'via: missing'))).toThrow(/unknown heavy forwarder/);
    expect(() => parseProfile(text.replace('eri: 40', 'eri: 39'))).toThrow(/total indexers/);
    expect(() => parseProfile(text.replace('shareOfIngest: 0.4', 'shareOfIngest: 0.8'))).toThrow(/shares/);
    expect(() => loadProfile('../apl', [apl])).toThrow(/Unknown/);
    const clone = loadProfile('apl', [apl]);
    clone.scale.fleetSize = 1;
    expect(apl.scale.fleetSize).toBe(6000);
  });
  for (const id of ['apl', 'erie'])
    it(`${id}: infrastructure, volume, sources and durable replay`, () => {
      const w = setup(id);
      const p = w.config.profile!;
      expect(w.infra.filter((n) => n.role === 'indexer' && !n.retired)).toHaveLength(
        p.infra.indexerCluster.indexers,
      );
      expect(new Set(w.infra.map((n) => n.hostname)).size).toBe(w.infra.length);
      expect(new Set(w.infra.map((n) => n.ip)).size).toBe(w.infra.length);
      expect(w.infra.find((n) => n.retired)!.hostname).toBe(id === 'apl' ? 'idx21' : 'idx53');
      tickWorld(w, 18);
      const rates = computeLicenseRates(w);
      const tb = (totalRate(rates) * 86400) / 1e12;
      expect(tb).toBeGreaterThan(p.scale.targetDailyIngestTB! * 0.95);
      expect(tb).toBeLessThan(p.scale.targetDailyIngestTB! * 1.05);
      for (const source of p.dataSources)
        for (const st of source.sourcetypes) expect(rates.has(`${source.index}|${st}`)).toBe(true);
      const source = p.dataSources.find((d) => d.via !== 'forwarders')!;
      const result = runSearch(w, {
        search: `index=${source.index} host=${source.via}`,
        earliest: '-2m',
        latest: 'now',
      });
      expect(result.events.length).toBeGreaterThan(0);
      w.uiState = { reports: 'profile-specific' };
      const save = saveWorld(w);
      const reloaded = loadWorld(save, defs);
      expect(saveWorld(reloaded)).toEqual(save);
      expect(reloaded.config.profileId).toBe(id);
      tickWorld(w, 6);
      tickWorld(reloaded, 6);
      expect([...reloaded.fleet.health]).toEqual([...w.fleet.health]);
    }, 30000);
  it('migrates v1 saves into default without applying current profile files', () => {
    const w = createWorld({ seed: 'old', fleetSize: 1000 });
    tickWorld(w, 7);
    const saved = saveWorld(w);
    const legacy = {
      version: 1 as const,
      seed: saved.seed,
      fleetSize: saved.fleetSize,
      tick: saved.tick,
      speed: saved.speed,
      paused: saved.paused,
      journal: saved.journal,
    };
    const loaded = loadWorld(legacy, defs);
    expect(loaded.config.profileId).toBe('default');
    expect([...loaded.fleet.health]).toEqual([...w.fleet.health]);
  });
  it('Monitoring Console license panels equal the linked SPL results', () => {
    const w = setup('apl');
    const mc = monitoringConsole(w, 'license');
    for (const panel of mc.panels) {
      const result = runSearch(w, { search: panel.search, earliest: panel.earliest, latest: panel.latest });
      expect(result.status).toBe('done');
      expect(result.results.map((r) => rowToPlain(r, result.columns))).toEqual(panel.rows);
    }
  }, 30000);
});
describe('new profile drill solution runs', () => {
  for (const [id, solution] of Object.entries(solutions))
    it(
      id,
      () => {
        const w = setup(id.startsWith('apl') ? 'apl' : 'erie');
        const s = w.scenarios.definitions.find((s) => s.id === id)!;
        expect(s).toBeDefined();
        tickWorld(w, 6);
        startScenario(w, id);
        tickWorld(w, 12);
        expect(fixed(w, s.fixChecks), 'Incident must be observable before the fix').toBe(false);
        for (const [i, change] of s.changes.entries()) {
          if (!('path' in change)) throw new Error('Expected config drill');
          const fix = solution.fixes[i]!;
          const values = (fix.set ?? fix) as Record<string, string>;
          const fs = hostFs(w, resolveHost(w, change.host)!);
          fs.writeFile(
            change.path,
            patchConf(fs.readFile(change.path, ROOT), String(fix.stanza ?? change.stanza), values),
            ROOT,
          );
        }
        if (solution.action !== 'shc')
          expect(fixed(w, s.fixChecks), 'Editing disk must not apply running config').toBe(false);
        for (const change of s.changes)
          if ('apply' in change) {
            const p = resolveHost(w, change.host)!;
            if (change.apply === 'deploy-server') reloadDeployServer(w, p);
            else if (change.apply === 'restart') restartSplunk(w, p);
          }
        if (solution.action === 'shc') applyShcBundle(w, resolveHost(w, infraName(w, 'deployer'))!);
        if (solution.action === 'soar') expect(runPlaybook(w, resolveHost(w, 'soar01')!)).toBe(true);
        tickWorld(w, 18);
        expect(fixed(w, s.fixChecks), 'Targeted repair should recover the service').toBe(true);
        expect(w.scenarios.tickets[0]!.status).toBe('resolved');
        const restored = loadWorld(saveWorld(w), defs);
        expect(fixed(restored, restored.scenarios.definitions.find((x) => x.id === id)!.fixChecks)).toBe(
          true,
        );
      },
      30000,
    );
});

describe('core incident portability', () => {
  for (const id of ['apl', 'erie'])
    for (const scenarioId of profile(id).scenarios.core)
      it(`${id}: ${scenarioId}`, () => {
        const w = setup(id);
        const scenario = w.scenarios.definitions.find((s) => s.id === scenarioId)!;
        const original = scenario.changes.map((c) => {
          const fs = hostFs(w, resolveHost(w, c.host)!);
          const path = 'path' in c ? c.path : c.file;
          const node = fs.findNode(path)!;
          return {
            path,
            text: 'path' in c && node ? fs.readFile(path, ROOT) : null,
            existed: !!node,
            owner: node?.owner,
            group: node?.group,
            mode: node?.mode,
          };
        });
        tickWorld(w, 6);
        startScenario(w, scenarioId);
        tickWorld(w, 12);
        expect(fixed(w, scenario.fixChecks), 'Injected incident must affect this profile').toBe(false);
        for (const [i, c] of scenario.changes.entries()) {
          const p = resolveHost(w, c.host)!;
          const fs = hostFs(w, p);
          const old = original[i]!;
          if (!old.existed) {
            fs.remove(old.path, ROOT);
            restartSplunk(w, p);
          } else if (old.text !== null) {
            fs.writeFile(old.path, old.text, ROOT);
            if ('apply' in c && c.apply === 'deploy-server') reloadDeployServer(w, p);
            else restartSplunk(w, p);
          } else fs.setMeta(old.path, { owner: old.owner, group: old.group, mode: old.mode }, ROOT);
        }
        tickWorld(w, 18);
        expect(fixed(w, scenario.fixChecks)).toBe(true);
        expect(w.scenarios.tickets[0]!.status).toBe('resolved');
      }, 30000);
});

describe('profile effects visible in search', () => {
  it('extracts VPC fields and Windows XML fields', () => {
    const w = setup('apl');
    const flow = runSearch(w, {
      search: 'index=aws host=hf-aws01 | table srcaddr dstaddr action interface_id',
      earliest: '-5m',
      latest: 'now',
    });
    expect(flow.results.length).toBeGreaterThan(0);
    expect(flow.results[0]!.get('action')).toBe('ACCEPT');
    expect(flow.results[0]!.get('interface_id')).toBe('eni-simulated');
    const xml = runSearch(w, {
      search: 'index=wineventlog | head 5 | table EventCode Computer TargetUserName',
      earliest: '-5m',
      latest: 'now',
    });
    expect(xml.results.length).toBeGreaterThan(0);
    expect(['4624', '4625']).toContain(String(xml.results[0]!.get('EventCode')));
    expect(xml.results[0]!.get('TargetUserName')).toBe('simulated-user');
  }, 30000);
  it('CIM mapping and ES acceleration affect searchable data', () => {
    const w = setup('apl');
    const search = (text: string) => runSearch(w, { search: text, earliest: '-15m', latest: 'now' });
    expect(search('index=symantec tag=malware').events.length).toBeGreaterThan(0);
    startScenario(w, 'apl-sep-cim');
    expect(search('index=symantec tag=malware').events).toHaveLength(0);
    expect(search('index=notable').events.length).toBeGreaterThan(0);
    startScenario(w, 'apl-es-dm-acceleration');
    expect(search('index=notable').events).toHaveLength(0);
  }, 30000);
});
