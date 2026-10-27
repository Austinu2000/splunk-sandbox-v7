import { V7_FORWARDER_STARTER_FILES, V7_FORWARDER_CONNECTION_FILES } from '../ansible/forwarder-starters';
import { enableForwarderOperations, setForwarderFixture, forwarderDetail } from './forwarders';
import { forwarderConnection } from './forwarder-tls';
import type { World } from '../world';
import { resolveHost } from '../hosts/profile';
import { hostFs } from '../vfs/build';
import { ROOT } from '../vfs/vfs';
import { restartSplunk, runningConf, vfsReader } from '../hosts/running';
import { loadConf, setting } from '../conf/merge';
import { automationView } from '../ansible/view';
import { inventoryHosts } from '../ansible/inventory';
import { indexCatalog, indexExists } from './indexes';
import { canSearchIndex, requireCapability } from './access';
import { runSearch } from '../spl/run';
import { indexBuckets } from './lifecycle';
import { listReports } from './reports';
import { tickWorld, setClock } from '../world';
import { V7_STARTER_FILES } from '../ansible/starters';
import { setupLesson, seedRepositoryFiles } from '../training/lesson-setup';
import { executePlaybook } from '../git/code';
import { ancestor } from '../git/state';
import { filesUnder, checksum } from '../hosts/cluster';
import { journal } from '../journal';
import type { PracticePrincipal } from '@sandbox/shared';

export type FoundationCheck =
  | {
      kind: 'forwarder';
      label: string;
      host: string;
      installed?: boolean;
      version?: string;
      running?: boolean;
      bootStart?: boolean;
      app?: string;
      active?: boolean;
      minimumCatalog?: number;
      phoneHome?: boolean;
      change?: string;
    }
  | { kind: 'connection'; label: string; host: string; server: string; reachable: boolean }
  | { kind: 'file-state'; label: string; host: string; path: string; exists: boolean; contains?: string }
  | {
      kind: 'automation-run';
      label: string;
      path: string;
      check?: boolean;
      syntax?: boolean;
      targets?: string[];
      minimumChanges?: number;
      maximumChanges?: number;
      handler?: string;
      afterApply?: boolean;
      priorFailure?: boolean;
      currentSource?: boolean;
    }
  | {
      kind: 'repository';
      label: string;
      repo: string;
      branch: string;
      path: string;
      contains: string;
      review?: 'open' | 'checked' | 'merged';
      deployed?: boolean;
      reverted?: boolean;
    }
  | {
      kind: 'report-state';
      label: string;
      host: string;
      app: string;
      title: string;
      owner?: string;
      sharing?: string;
      search?: string;
      scheduled?: boolean;
      summaryIndex?: string;
      cron?: string;
    }
  | {
      kind: 'report-run';
      label: string;
      host: string;
      app: string;
      title: string;
      scheduled?: boolean;
      minimumWrites?: number;
      cells?: Record<string, string | number>;
    }
  | {
      kind: 'search-job';
      label: string;
      search: string;
      inspected?: boolean;
      moreWorkThan?: string;
      minimumRows?: number;
    }
  | {
      kind: 'index-state';
      label: string;
      host: string;
      name: string;
      settings?: Record<string, string | number | boolean>;
      empty?: boolean;
    }
  | {
      kind: 'query';
      label: string;
      search: string;
      earliest?: string;
      latest?: string;
      principal?: PracticePrincipal;
      rows: number;
      cells?: Record<string, string | number>;
    }
  | {
      kind: 'access';
      label: string;
      host: string;
      principal: PracticePrincipal;
      index?: string;
      capability?: string;
      allowed: boolean;
    }
  | {
      kind: 'bucket-state';
      label: string;
      host: string;
      index: string;
      state: 'hot' | 'warm' | 'cold' | 'frozen' | 'thawed';
      minimum: number;
      archived?: boolean;
    }
  | {
      kind: 'inspection';
      label: string;
      command: string;
      host?: string;
      user?: string;
      interface?: 'cli' | 'web';
      afterChange?: boolean;
    }
  | {
      kind: 'answer';
      label: string;
      id: string;
      expected?: string;
      derive?: 'role' | 'inventory-count' | 'group-count' | 'mgmt-port';
      host?: string;
      group?: string;
    }
  | {
      kind: 'configuration';
      label: string;
      host: string;
      conf: string;
      stanza: string;
      key: string;
      equals: string;
      source?: string;
      effective: boolean;
    }
  | { kind: 'permissions'; label: string; host: string; path: string; mode: number; owner: string }
  | {
      kind: 'inventory';
      label: string;
      pattern: string;
      expected?: string[];
      noMissing?: boolean;
      variable?: { host: string; name: string; value: string };
    };

export type FoundationSetup =
  | {
      kind: 'repository-source';
      repo: string;
      path: string;
      text: string;
      branch: string;
      title: string;
      baseline?: boolean;
      review?: 'open' | 'merged' | 'deployed';
    }
  | { kind: 'forwarder-starters' }
  | { kind: 'deployment-model' }
  | {
      kind: 'forwarder';
      host: string;
      installed?: boolean;
      version?: string;
      licenseAccepted?: boolean;
      bootStart?: boolean;
    }
  | { kind: 'automation-starters' }
  | { kind: 'automation-source'; path: string; text: string; deploy?: { playbook: string; limit: string } }
  | { kind: 'advance'; ticks: number; paused?: boolean }
  | { kind: 'file'; host: string; path: string; text: string; mode?: number; owner?: string; apply?: boolean }
  | { kind: 'remove-inventory-host'; host: string; path: string; target: string };

export function setupFoundation(world: World, steps: FoundationSetup[]) {
  for (const step of steps) {
    if (step.kind === 'repository-source') {
      const { kind: _, ...source } = step;
      void _;
      setupLesson(world, [source]);
      continue;
    }
    if (step.kind === 'forwarder-starters') {
      seedRepositoryFiles(
        world,
        'splunk-automation',
        'fixture/v7-forwarders',
        { ...V7_STARTER_FILES, ...V7_FORWARDER_STARTER_FILES, ...V7_FORWARDER_CONNECTION_FILES },
        'V7 forwarder operations fixture',
      );
      continue;
    }
    if (step.kind === 'deployment-model') {
      enableForwarderOperations(world);
      continue;
    }
    if (step.kind === 'forwarder') {
      setForwarderFixture(
        world,
        step.host,
        Object.fromEntries(Object.entries(step).filter(([k]) => !['kind', 'host'].includes(k))),
      );
      continue;
    }

    if (step.kind === 'automation-starters') {
      setupLesson(
        world,
        Object.entries(V7_STARTER_FILES).map(([path, text]) => ({
          repo: 'splunk-automation',
          branch: 'fixture/v7-baseline',
          path,
          text,
          title: 'V7 operational fixture addition',
          baseline: true,
        })),
      );
      continue;
    }
    if (step.kind === 'automation-source') {
      setupLesson(world, [
        {
          repo: 'splunk-automation',
          branch: 'fixture/v7-lesson',
          path: step.path,
          text: step.text,
          title: 'V7 isolated lesson fixture',
          baseline: true,
        },
      ]);
      if (step.deploy) {
        const run = executePlaybook(world, 'splunk-automation', 'main', step.deploy.playbook, {
          limit: step.deploy.limit,
        });
        if (run.failed || run.unreachable) throw new Error('Invalid automation lesson fixture deployment');
        run.fixture = true;
        journal(world, { k: 'code.state', state: structuredClone(world.code!) });
      }
      continue;
    }

    if (step.kind === 'advance') {
      tickWorld(world, step.ticks);
      if (step.paused !== undefined) setClock(world, { paused: step.paused });
      continue;
    }
    const host = resolveHost(world, step.host);
    if (!host) throw new Error(`Unknown fixture host: ${step.host}`);
    const fs = hostFs(world, host);
    if (step.kind === 'remove-inventory-host') {
      const re = new RegExp('^\\s+' + step.target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ':.*\\n', 'gm');
      fs.writeFile(step.path, fs.readFile(step.path, ROOT).replace(re, ''), ROOT);
    } else {
      fs.mkdir(step.path.slice(0, step.path.lastIndexOf('/')), ROOT, { parents: true });
      fs.writeFile(step.path, step.text, ROOT);
      if (step.mode !== undefined || step.owner)
        fs.setMeta(
          step.path,
          {
            ...(step.mode !== undefined ? { mode: step.mode } : {}),
            ...(step.owner ? { owner: step.owner, group: step.owner } : {}),
          },
          ROOT,
        );
      if (step.apply) restartSplunk(world, host);
    }
  }
}
export function foundationAnswer(
  world: World,
  check: Extract<FoundationCheck, { kind: 'answer' }>,
): string | undefined {
  const host = check.host && resolveHost(world, check.host);
  if (check.derive === 'role') return host ? host.role : undefined;
  if (check.derive === 'mgmt-port') return host ? String(host.splunk?.mgmtPort) : undefined;
  if (check.derive === 'inventory-count' || check.derive === 'group-count') {
    const view = automationView(world);
    if (!view.enabled || !view.inventory) return undefined;
    return String(
      check.derive === 'inventory-count'
        ? Object.keys(view.inventory.hostvars).length
        : inventoryHosts(view.inventory, check.group ?? 'all').length,
    );
  }
  return check.expected;
}
export function foundationCheck(world: World, check: FoundationCheck): boolean {
  switch (check.kind) {
    case 'forwarder': {
      try {
        const detail = forwarderDetail(world, check.host),
          p = resolveHost(world, check.host)!;
        return (
          (['installed', 'version', 'running', 'bootStart'] as const).every(
            (key) => check[key] === undefined || detail[key] === check[key],
          ) &&
          (!check.app || detail.apps.includes(check.app)) &&
          (!check.active || detail.downloadedCatalog === detail.runningCatalog) &&
          (typeof detail.downloadedCatalog === 'number' ? detail.downloadedCatalog : 0) >=
            (check.minimumCatalog ?? 0) &&
          (!check.phoneHome || (!detail.error && detail.lastPhoneHome >= world.config.startTime)) &&
          (!check.change ||
            (world.forwarders?.clients[p.hostname]?.changes ?? []).some((e) => e.kind === check.change))
        );
      } catch {
        return false;
      }
    }
    case 'connection': {
      const p = resolveHost(world, check.host);
      return !!p && forwarderConnection(world, p, check.server).reachable === check.reachable;
    }

    case 'file-state': {
      const h = resolveHost(world, check.host),
        fs = h && hostFs(world, h);
      if (!fs) return false;
      const n = fs.findNode(check.path);
      return (
        Boolean(n) === check.exists &&
        (check.contains === undefined ||
          (n?.type === 'file' && fs.readFile(check.path, ROOT).includes(check.contains)))
      );
    }
    case 'automation-run': {
      const runs = (world.code?.runs ?? []).filter((r) => !r.fixture && r.playbook === check.path);
      const candidates = runs.filter(
        (r) =>
          (check.check === undefined || r.check === check.check) &&
          (check.syntax === undefined || r.syntax === check.syntax),
      );
      const run = candidates.at(-1);
      if (!run || run.failed || run.unreachable || (!run.syntax && !run.hosts.length)) return false;
      if (
        check.targets &&
        JSON.stringify([...new Set(run.hosts.map((h) => h.host))].sort()) !==
          JSON.stringify([...check.targets].sort())
      )
        return false;
      if (run.changed < (check.minimumChanges ?? 0) || run.changed > (check.maximumChanges ?? Infinity))
        return false;
      if (
        check.handler &&
        !run.hosts.some((h) => h.messages.some((m) => m === 'RUNNING HANDLER: ' + check.handler))
      )
        return false;
      const earlier = runs.slice(0, runs.indexOf(run));
      if (
        check.afterApply &&
        !earlier.some(
          (r) =>
            !r.check &&
            !r.syntax &&
            !r.failed &&
            !r.unreachable &&
            r.changed > 0 &&
            r.revision === run.revision,
        )
      )
        return false;
      if (check.priorFailure && !earlier.some((r) => r.failed || r.unreachable)) return false;
      if (check.currentSource) {
        const repo = world.git?.repos['splunk-automation'];
        if (!repo) return false;
        if (run.commit) {
          if (repo.branches.main !== run.commit) return false;
        } else {
          const c = world.git?.checkouts.find((c) => c.repo === 'splunk-automation'),
            h = c && resolveHost(world, c.host);
          if (!c || !h || checksum(filesUnder(hostFs(world, h), c.root)) !== run.revision) return false;
        }
      }
      return true;
    }
    case 'repository': {
      const repo = world.git?.repos[check.repo],
        head = repo?.branches[check.branch],
        commit = head && repo?.commits[head];
      if (!repo || !head || !commit || !commit.tree[check.path]?.text.includes(check.contains)) return false;
      if (
        check.reverted &&
        !Object.values(repo.commits).some((c) => /^Revert /m.test(c.message) && ancestor(repo, c.id, head))
      )
        return false;
      if (check.review || check.deployed) {
        const reviews = (world.code?.reviews ?? []).filter((r) => !r.fixture && r.repo === check.repo);
        if (
          !reviews.some((r) =>
            check.review === 'merged' || check.deployed
              ? r.status === 'merged' &&
                r.head === head &&
                (!check.deployed ||
                  r.deployed === head ||
                  (world.code?.runs ?? []).some(
                    (run) =>
                      !run.fixture &&
                      !run.failed &&
                      !run.unreachable &&
                      !run.check &&
                      !run.syntax &&
                      run.commit === head &&
                      run.hosts.length > 0,
                  ))
              : r.status === 'open' &&
                r.head === head &&
                repo.branches[r.branch] === r.head &&
                (check.review !== 'checked' ||
                  (r.check?.passed && r.check.head === r.head && r.check.base === repo.branches.main)),
          )
        )
          return false;
      }
      return true;
    }

    case 'report-state':
      return listReports(world, check.host).some(
        (r) =>
          r.managed &&
          r.app === check.app &&
          r.title === check.title &&
          !r.issues.length &&
          r.enabled &&
          (['owner', 'sharing', 'search', 'scheduled', 'summaryIndex', 'cron'] as const).every(
            (key) => check[key] === undefined || r[key] === check[key],
          ),
      );
    case 'report-run': {
      const reports = listReports(world, check.host).filter(
        (r) => r.app === check.app && r.title === check.title,
      );
      return (world.reports?.runs ?? []).some(
        (run) =>
          reports.some((r) => r.id === run.reportId && r.revision === run.revision) &&
          run.status === 'succeeded' &&
          (check.scheduled === undefined || (run.scheduledTime !== undefined) === check.scheduled) &&
          run.summaryEventIds.length >= (check.minimumWrites ?? 0) &&
          Object.entries(check.cells ?? {}).every(([key, value]) =>
            run.rows.some((r) => String(r[key]) === String(value)),
          ),
      );
    }
    case 'search-job': {
      const jobs = world.searchEvidence ?? [];
      return jobs.some(
        (job) =>
          job.status === 'done' &&
          new RegExp(check.search, 'i').test(job.search) &&
          (!check.inspected || job.inspected) &&
          job.resultCount >= (check.minimumRows ?? 1) &&
          (!check.moreWorkThan ||
            jobs.some(
              (other) =>
                other.status === 'done' &&
                new RegExp(check.moreWorkThan!, 'i').test(other.search) &&
                other.workUnits < job.workUnits,
            )),
      );
    }
    case 'index-state': {
      if (!indexExists(world, check.name, check.host)) return false;
      const entry = indexCatalog(world, check.host).find((i) => i.name === check.name);
      return (
        !!entry &&
        !entry.pending &&
        !entry.issues.length &&
        (!check.empty || entry.currentDBSizeMB === 0) &&
        Object.entries(check.settings ?? {}).every(
          ([key, value]) => String(entry.settings[key as keyof typeof entry.settings]) === String(value),
        )
      );
    }
    case 'query': {
      if (/\b(?:collect|outputlookup)\b/i.test(check.search)) return false;
      const result = runSearch(world, {
        search: check.search,
        earliest: check.earliest ?? '-24h',
        latest: check.latest ?? 'now',
        principal: check.principal,
        readOnly: true,
      });
      const rows = result.kind === 'events' ? result.events : result.results;
      return (
        result.status === 'done' &&
        !result.scan?.truncated &&
        rows.length === check.rows &&
        Object.entries(check.cells ?? {}).every(([key, value]) =>
          rows.some((row) => String(row.get(key)) === String(value)),
        )
      );
    }
    case 'access': {
      try {
        const allowed = check.index
          ? canSearchIndex(world, check.host, check.principal, check.index)
          : (() => {
              requireCapability(world, check.host, check.principal, check.capability ?? 'indexes_edit');
              return true;
            })();
        return allowed === check.allowed;
      } catch {
        return check.allowed === false;
      }
    }
    case 'bucket-state':
      return (
        indexBuckets(world).filter(
          (b) =>
            b.host === check.host &&
            b.index === check.index &&
            b.state === check.state &&
            (check.archived === undefined || b.archived === check.archived),
        ).length >= check.minimum
      );
    case 'inspection':
      return world.actions.some((a) => {
        if (!(
          a.kind === (check.interface === 'web' ? 'page' : 'cmd') &&
          (check.interface === 'web' ? a.success !== false : a.success === true) &&
          (!check.host || a.host === check.host) &&
          (!check.user || a.user === check.user) &&
          new RegExp(check.command, 'i').test(a.text)
        ))
          return false;
        if (!check.afterChange) return true;
        const changes = world.journal.log
          .map((m) => (m.k === 'fs' || m.k === 'svc') && (!check.host || m.host === check.host))
          .lastIndexOf(true);
        const observed = world.journal.log
          .map(
            (m) =>
              m.k === 'action' &&
              m.kind === a.kind &&
              m.host === a.host &&
              m.text === a.text &&
              m.success === a.success,
          )
          .lastIndexOf(true);
        return observed > changes;
      });
    case 'answer': {
      const expected = foundationAnswer(world, check);
      const value = world.lesson?.answers?.[check.id];
      return (
        expected !== undefined &&
        value !== undefined &&
        value.trim().toLowerCase() === expected.trim().toLowerCase()
      );
    }
    case 'configuration': {
      const host = resolveHost(world, check.host);
      if (!host?.splunk) return false;
      const conf = check.effective
        ? runningConf(world, host, check.conf)
        : loadConf(vfsReader(hostFs(world, host)), host.splunk.home, check.conf);
      const value = conf.stanzas.get(check.stanza)?.settings.get(check.key);
      return (
        setting(conf, check.stanza, check.key) === check.equals &&
        (!check.source || value?.path === check.source)
      );
    }
    case 'permissions': {
      const host = resolveHost(world, check.host);
      const node = host && hostFs(world, host).findNode(check.path);
      return !!node && node.mode === check.mode && node.owner === check.owner;
    }
    case 'inventory': {
      const view = automationView(world);
      if (!view.enabled || !view.inventory) return false;
      const names = inventoryHosts(view.inventory, check.pattern);
      if (check.expected && JSON.stringify(names) !== JSON.stringify([...check.expected].sort()))
        return false;
      if (check.noMissing && (view.inventory.drift.missing.length || view.inventory.drift.unknown.length))
        return false;
      if (
        check.variable &&
        String(view.inventory.hostvars[check.variable.host]?.[check.variable.name]) !== check.variable.value
      )
        return false;
      return names.length > 0;
    }
  }
}
