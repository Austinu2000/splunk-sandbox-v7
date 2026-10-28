import { splunkdRunning } from '../src/hosts/profile';
import { configurationFingerprint } from '../src/engineering/config-backup';
import { parse, stringify } from 'yaml';
import { readFileSync, existsSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import {
  createWorld,
  parseProfile,
  profileWorldConfig,
  engineeringLessonSchema,
  setupFoundation,
  foundationCheck,
  saveWorld,
  loadWorld,
  stageEnterprisePackage,
  createConfigurationBackup,
  verifyConfigurationBackup,
  captureUpgradePreflight,
  kvBackup,
  tickWorld,
  resolveHost,
  runSearch,
  recordSearchEvidence,
  codeCommit,
  reviewAction,
  executePlaybook,
  V7_STARTER_FILES,
  V7_UPGRADE_STARTER_FILES,
  resumeEnterpriseUpgrade,
  saveReport,
  executeReport,
  checkTree,
} from '../src';
import type { FoundationCheck } from '../src/engineering/foundations';
import { hostFs } from '../src/vfs/build';
import { ROOT } from '../src/vfs/vfs';
import { testTerm } from './helpers';
const profile = parseProfile(readFileSync(new URL('../../../profiles/lab.yaml', import.meta.url), 'utf8')),
  root = '/home/svc_ansible/splunk-automation/';
const definition = (id: string) => {
  const live = new URL('../../../lessons/v7/' + id + '.json', import.meta.url),
    draft = new URL('../../../lessons/v7-drafts/' + id + '.json', import.meta.url);
  return engineeringLessonSchema.parse(JSON.parse(readFileSync(existsSync(live) ? live : draft, 'utf8')));
};
const edit = (w: ReturnType<typeof createWorld>, path: string, text: string) =>
  hostFs(w, resolveHost(w, 'ansible01')!).writeFile(root + path, text, ROOT);
function run(w: ReturnType<typeof createWorld>, path: string, flags = '') {
  const t = testTerm(w),
    before = w.code?.runs.length ?? 0;
  t.run('ssh svc_ansible@ansible01');
  t.run('cd ~/splunk-automation');
  const output = t.run('ansible-playbook ' + path + flags);
  expect(output).not.toContain('outside the simulated allowlist');
  expect(w.code!.runs.length).toBe(before + 1);
  return w.code!.runs.at(-1)!;
}
const prepare = (w: ReturnType<typeof createWorld>, host: string) => {
  stageEnterprisePackage(w, host);
  const b = createConfigurationBackup(w, host, 'reviewed_upgrade');
  verifyConfigurationBackup(w, host, b.id);
};
function review(w: ReturnType<typeof createWorld>, path: string, text: string) {
  codeCommit(
    w,
    'splunk-automation',
    'change/enterprise-release',
    path,
    text,
    'Review the scoped enterprise source change',
  );
  const pr = reviewAction(w, 'open', undefined, {
    repo: 'splunk-automation',
    branch: 'change/enterprise-release',
    title: 'Enterprise change request',
  });
  reviewAction(w, 'check', pr.id);
  expect(pr.check?.passed, JSON.stringify(pr.check?.messages)).toBe(true);
  reviewAction(w, 'approve', pr.id);
  reviewAction(w, 'merge', pr.id);
}
function search(w: ReturnType<typeof createWorld>, q: string) {
  const r = runSearch(w, { search: q });
  expect(r.status).toBe('done');
  recordSearchEvidence(w, {
    id: 'advanced-automation-verification',
    search: q,
    earliest: r.earliest,
    latest: r.latest,
    status: r.status,
    scanCount: r.scan?.scanned ?? 0,
    workUnits: r.workUnits,
    resultCount: r.results.length,
    inspected: true,
  });
}
function solve(w: ReturnType<typeof createWorld>, id: string) {
  if (id === 'AU-44') {
    expect(run(w, 'playbooks/v7_enterprise_transport.yml').unreachable).toBe(1);
    const fs = hostFs(w, resolveHost(w, 'ansible01')!);
    const inventory = parse(
      fs.readFile(root + 'inventories/lab/hosts.yml', ROOT).replace('idx02_missing', 'idx02'),
    );
    inventory.all.children.monitoring_console = { hosts: { mc01: {} } };
    edit(w, 'inventories/lab/hosts.yml', stringify(inventory));
    expect(run(w, 'playbooks/v7_enterprise_transport.yml').failed).toBe(0);
  }
  if (id === 'AU-45') {
    run(w, 'playbooks/v7_upgrade_policy.yml', ' --check --diff');
    expect(run(w, 'playbooks/v7_upgrade_policy.yml').failed).toBe(0);
    expect(run(w, 'playbooks/v7_upgrade_policy.yml').changed).toBe(0);
  }
  if (id === 'AU-46') {
    const failed = run(w, 'playbooks/v7_upgrade_policy.yml');
    expect(failed.failed).toBe(1);
    expect(failed.hosts.map((h) => h.host)).toEqual(['ds01']);
    edit(
      w,
      'roles/v7_upgrade_checks/handlers/main.yml',
      V7_UPGRADE_STARTER_FILES['roles/v7_upgrade_checks/handlers/main.yml']!,
    );
    expect(run(w, 'playbooks/v7_upgrade_policy.yml').failed).toBe(0);
    expect(run(w, 'playbooks/v7_upgrade_activate.yml', ' --limit ds01').failed).toBe(0);
    expect(run(w, 'playbooks/v7_upgrade_policy.yml').changed).toBe(0);
  }
  if (id === 'AU-47') {
    const hosts = ['lm01', 'cm01', 'sh01', 'idx01', 'idx02', 'idx03'];
    for (const h of hosts) prepare(w, h);
    kvBackup(w, 'sh01', 'data_before_upgrade');
    expect(run(w, 'playbooks/v7_enterprise_preflight.yml').failed).toBe(0);
    expect(captureUpgradePreflight(w, hosts).issues).toEqual([]);
  }
  if (id === 'AU-48') {
    expect(w.maintenance!.jobs.at(-1)!.status).toBe('paused');
    expect(run(w, 'playbooks/v7_enterprise_repair.yml', ' --limit idx02').failed).toBe(0);
    resumeEnterpriseUpgrade(w, w.maintenance!.jobs.at(-1)!.id);
    tickWorld(w, 15);
    search(w, 'index=source_logs | stats count');
  }
  if (id === 'AU-49') {
    review(w, 'roles/v7_cluster_indexes/defaults/main.yml', 'managed_index: engineering_release\n');
    expect(
      executePlaybook(w, 'splunk-automation', 'main', 'playbooks/v7_cluster_indexes.yml', { limit: 'cm01' })
        .failed,
    ).toBe(0);
    tickWorld(w, 20);
    search(w, 'index=source_logs | stats count');
  }
  if (id === 'AU-50') {
    review(
      w,
      'roles/v7_inputs/templates/inputs.conf.j2',
      V7_STARTER_FILES['roles/v7_inputs/templates/inputs.conf.j2']!.replace(
        '{{ practice_sourcetype }}',
        'v7_enterprise',
      ),
    );
    expect(
      executePlaybook(w, 'splunk-automation', 'main', 'playbooks/v7_inputs.yml', { limit: 'ds01' }).failed,
    ).toBe(0);
    tickWorld(w, 1);
    prepare(w, 'hf01');
    expect(captureUpgradePreflight(w, ['hf01']).issues).toEqual([]);
    const applied = executePlaybook(w, 'splunk-automation', 'main', 'playbooks/v7_enterprise_upgrade.yml', {
      limit: 'hf01',
    });
    expect(applied.logs).not.toContain('outside the simulated allowlist');
    expect(applied.hosts.flatMap((h) => h.messages).filter((m) => m.includes('FAILED'))).toEqual([]);
    expect(applied.failed).toBe(0);
    const repeated = executePlaybook(w, 'splunk-automation', 'main', 'playbooks/v7_enterprise_upgrade.yml', {
      limit: 'hf01',
    });
    expect(repeated.failed).toBe(0);
    expect(repeated.changed).toBe(0);
    const report = saveReport(w, {
      host: 'sh01',
      app: 'search',
      owner: 'admin',
      sharing: 'App',
      title: 'Engineering release verification',
      search: 'index=os sourcetype=v7_enterprise | stats count',
      scheduled: false,
    });
    executeReport(w, report.id);
    search(w, 'index=os sourcetype=v7_enterprise | stats count');
  }
}
for (let n = 44; n <= 50; n++) {
  const id = 'AU-' + n,
    d = definition(id),
    checks = d.checks as FoundationCheck[],
    fresh = () => {
      const w = createWorld({ ...profileWorldConfig(profile), fleetSize: 50 });
      setupFoundation(w, d.setup ?? []);
      w.lesson = {
        id,
        learner: 'Advanced automation regression',
        startedTick: w.clock.tick,
        hints: 0,
        notes: '',
      };
      return w;
    },
    passed = (w: ReturnType<typeof fresh>) => checks.every((c) => foundationCheck(w, c));
  describe(id, () => {
    it(id + ':solution', () => {
      const w = fresh();
      expect(passed(w)).toBe(false);
      solve(w, id);
      expect(checks.map((c) => ({ label: c.label, passed: foundationCheck(w, c) }))).toEqual(
        checks.map((c) => ({ label: c.label, passed: true })),
      );
    });
    it(id + ':incorrect-action', () => {
      const w = fresh();
      run(w, 'playbooks/v7_enterprise_transport.yml', ' --check');
      expect(passed(w)).toBe(false);
    });
    it(id + ':no-false-completion', () => {
      const w = fresh();
      solve(w, id);
      expect(passed(w)).toBe(true);
      w.code!.runs = [];
      expect(passed(w)).toBe(false);
    });
    it(id + ':reset', () => {
      const w = fresh(),
        before = saveWorld(w);
      solve(w, id);
      expect(passed(w)).toBe(true);
      const reset = loadWorld(before, []);
      expect(passed(reset)).toBe(false);
      expect(saveWorld(reset).journal).toEqual(before.journal);
    });
    it(id + ':resume', () => {
      const w = fresh();
      solve(w, id);
      const resumed = loadWorld(saveWorld(w), []);
      if (id === 'AU-50') {
        expect(resumed.maintenance, 'maintenance replay').toEqual(w.maintenance);
        expect(splunkdRunning(resumed, resolveHost(resumed, 'hf01')!), 'service replay').toBe(true);
        expect(configurationFingerprint(resumed, 'hf01'), 'native configuration replay').toBe(
          configurationFingerprint(w, 'hf01'),
        );
      }
      expect(checks.map((c) => ({ label: c.label, passed: foundationCheck(resumed, c) }))).toEqual(
        checks.map((c) => ({ label: c.label, passed: true })),
      );
      expect(resumed.code?.runs).toEqual(w.code?.runs);
      expect(resumed.maintenance).toEqual(w.maintenance);
    });
    it(id + ':isolation', () => {
      const a = fresh(),
        b = fresh(),
        before = saveWorld(b);
      solve(a, id);
      expect(saveWorld(b)).toEqual(before);
      expect(passed(b)).toBe(false);
    });
    it(id + ':passive-grading', () => {
      const w = fresh(),
        before = saveWorld(w);
      for (const c of checks) foundationCheck(w, c);
      expect(saveWorld(w)).toEqual(before);
    });
  });
}

it('does not reuse earlier probe evidence when the latest playbook only pings the same targets', () => {
  const d = definition('AU-47'),
    w = createWorld({ ...profileWorldConfig(profile), fleetSize: 50 });
  setupFoundation(w, d.setup ?? []);
  solve(w, 'AU-47');
  const c = d.checks.find((c) => c.kind === 'automation-run') as FoundationCheck;
  expect(foundationCheck(w, c)).toBe(true);
  edit(
    w,
    'playbooks/v7_enterprise_preflight.yml',
    '- hosts: license_manager:cluster_manager:search_heads:indexers\n  tasks:\n    - ping: {}\n',
  );
  expect(run(w, 'playbooks/v7_enterprise_preflight.yml').failed).toBe(0);
  expect(foundationCheck(w, c)).toBe(false);
});
it('stops later batches and later plays on an explicitly fatal native task failure', () => {
  const d = definition('AU-45'),
    w = createWorld({ ...profileWorldConfig(profile), fleetSize: 50 });
  setupFoundation(w, d.setup ?? []);
  edit(
    w,
    'playbooks/v7_fatal_guard.yml',
    '- hosts: deployment_server:heavy_forwarders:license_manager\n  become: true\n  serial: 1\n  any_errors_fatal: true\n  tasks:\n    - service: {name: Spunkd, state: restarted}\n- hosts: heavy_forwarders\n  become: true\n  tasks:\n    - copy: {content: unsafe-continuation, dest: /var/log/practice/continued-after-fatal.txt}\n',
  );
  const r = run(w, 'playbooks/v7_fatal_guard.yml');
  expect(r.failed).toBe(1);
  expect(r.hosts.map((h) => h.host)).toEqual(['ds01']);
  expect(hostFs(w, resolveHost(w, 'hf01')!).exists('/var/log/practice/continued-after-fatal.txt')).toBe(
    false,
  );
});
it('accepts only the built-in fictional URI password without hiding another plaintext credential', () => {
  const tree = (text: string) => ({ 'tasks.yml': { text, mode: 0o644 } });
  expect(checkTree(tree('url_password: training-only\n'))).toEqual([]);
  expect(
    checkTree(tree('url_password: training-only\napi_key: real-looking-private-value\n')).join(),
  ).toContain('possible plaintext credential');
});
