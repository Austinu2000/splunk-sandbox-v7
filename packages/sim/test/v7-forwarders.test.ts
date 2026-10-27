import { readFileSync, readdirSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import {
  createWorld,
  parseProfile,
  profileWorldConfig,
  engineeringLessonSchema,
  setupFoundation,
  foundationCheck,
  foundationAnswer,
  saveWorld,
  loadWorld,
  resolveHost,
  restartSplunk,
  tickWorld,
  reviewAction,
  deploymentDraft,
  stageDeploymentApp,
  stageServerClass,
  publishDeployment,
  logAction,
} from '../src';
import type { FoundationCheck } from '../src/engineering/foundations';
import { hostFs } from '../src/vfs/build';
import { ROOT } from '../src/vfs/vfs';
import { patchConf } from '../src/scenario/engine';
import { testTerm } from './helpers';
const directory = new URL('../../../lessons/v7/', import.meta.url),
  profile = parseProfile(readFileSync(new URL('../../../profiles/lab.yaml', import.meta.url), 'utf8'));
const definitions = readdirSync(directory)
  .filter((n) => /^(?:AU-(?:2[89]|3[0-5])|SP-0(?:2[6-9]|3[0-4]))\.json$/.test(n))
  .map((n) => engineeringLessonSchema.parse(JSON.parse(readFileSync(new URL(n, directory), 'utf8'))));
const uf = 'lab-lnx-0001',
  home = '/opt/splunkforwarder',
  app = 'v7_forwarder',
  path = 'deployment-apps/v7_forwarder/local/inputs.conf';
function terminal(w: ReturnType<typeof createWorld>, host: string, lines: string[]) {
  const t = testTerm(w, undefined, (e) =>
    logAction(w, { kind: 'cmd', text: e.line, host: e.host, user: e.user, success: e.success }, 0),
  );
  expect(t.run('ssh ' + (host === 'ansible01' ? 'svc_ansible' : 'splunk') + '@' + host)).toContain(
    'Last login',
  );
  for (const line of lines) {
    const result = t.run(line);
    expect(result).not.toMatch(
      /command not found|Permission denied|did not complete|Author identity unknown|fatal:/,
    );
  }
  t.session.dispose();
}
function patch(
  w: ReturnType<typeof createWorld>,
  host: string,
  conf: string,
  stanza: string,
  values: Record<string, string>,
) {
  const p = resolveHost(w, host)!,
    fs = hostFs(w, p),
    path = p.splunk!.home + '/etc/system/local/' + conf + '.conf';
  fs.writeFile(path, patchConf(fs.exists(path) ? fs.readFile(path, ROOT) : '', stanza, values), ROOT);
  restartSplunk(w, p);
}
const input =
  '[monitor:///var/log/practice/forwarder.log]\nindex = os\nsourcetype = v7_forwarder\ndisabled = false\n';
function solve(w: ReturnType<typeof createWorld>, id: string) {
  const play = (name: string, extra = '') =>
    terminal(w, 'ansible01', [
      'cd ~/splunk-automation',
      'ansible-playbook playbooks/' +
        name +
        '.yml --limit ' +
        (name === 'v7_deployment_app' || name === 'v7_windows_inputs'
          ? 'ds01'
          : name === 'v7_hf_routing'
            ? 'hf01'
            : uf) +
        extra,
    ]);
  switch (id) {
    case 'SP-026':
      terminal(w, uf, [
        'rpm -K /opt/staging/splunkforwarder-9.4.1-simulated.x86_64.rpm',
        'sudo rpm -ivh /opt/staging/splunkforwarder-9.4.1-simulated.x86_64.rpm',
        home + '/bin/splunk start --accept-license --answer-yes --no-prompt',
        'sudo ' + home + '/bin/splunk enable boot-start -user splunk',
      ]);
      break;
    case 'SP-027':
      patch(w, uf, 'deploymentclient', 'target-broker:deploymentServer', {
        targetUri: 'ds01.corp.example:8089',
      });
      break;
    case 'SP-028': {
      stageDeploymentApp(w, {
        name: app,
        files: { 'local/inputs.conf': input },
        revision: deploymentDraft(w).revision,
      });
      stageServerClass(w, {
        name: 'v7_canary',
        whitelist: [uf],
        blacklist: [],
        apps: [app],
        restart: true,
        revision: deploymentDraft(w).revision,
      });
      publishDeployment(w, deploymentDraft(w).revision);
      break;
    }
    case 'SP-029':
      patch(w, 'hf01', 'inputs', 'splunktcp://9998', { disabled: 'false' });
      break;
    case 'SP-030':
      patch(w, 'hf01', 'props', 'v7_forwarder', { 'TRANSFORMS-routing': 'v7_index' });
      patch(w, 'hf01', 'transforms', 'v7_index', { REGEX: '.', DEST_KEY: '_MetaData:Index', FORMAT: 'os' });
      break;
    case 'SP-031': {
      const d = deploymentDraft(w);
      stageDeploymentApp(w, {
        name: 'AAA_v7_windows',
        files: {
          'local/inputs.conf': d.files['AAA_v7_windows/local/inputs.conf']!.replace(
            'disabled=true',
            'disabled=false',
          ),
        },
        revision: d.revision,
      });
      publishDeployment(w, deploymentDraft(w).revision);
      break;
    }
    case 'SP-032':
      patch(w, uf, 'deploymentclient', 'deployment-client', {
        disabled: 'false',
        phoneHomeIntervalInSecs: '60',
      });
      break;
    case 'SP-033':
      terminal(w, uf, [
        'splunk stop',
        'sudo rpm -Uvh /opt/staging/splunkforwarder-9.4.1-simulated.x86_64.rpm',
        'splunk start --accept-license --answer-yes --no-prompt',
      ]);
      break;
    case 'SP-034':
      terminal(w, uf, [
        'cp /opt/staging/v7-correct-ca.pem ' + home + '/etc/auth/v7/ca.pem',
        'splunk restart',
      ]);
      break;
    case 'AU-28':
      play('v7_uf_install', ' --check --diff');
      play('v7_uf_install');
      play('v7_uf_install');
      break;
    case 'AU-29':
      play('v7_uf_client');
      break;
    case 'AU-30':
      play('v7_uf_outputs', ' -e forward_receiver=hf01.corp.example:9997');
      break;
    case 'AU-31':
      play('v7_deployment_app');
      play('v7_deployment_app');
      break;
    case 'AU-32':
      play('v7_hf_routing');
      break;
    case 'AU-33':
      play('v7_windows_inputs');
      break;
    case 'AU-34':
      play('v7_uf_upgrade', ' --check --diff');
      play('v7_uf_upgrade');
      play('v7_uf_upgrade');
      break;
    case 'AU-35': {
      const repo = w.git!.repos['splunk-apps']!,
        bad = Object.values(repo.commits).find((c) => c.message === 'Bad canary release fixture')!;
      terminal(w, 'ansible01', [
        'cd ~/splunk-apps',
        'git config user.name Learner',
        'git config user.email learner@example.test',
        'git checkout -b recovery/forwarder',
        'git revert ' + bad.id,
        'git push -u origin recovery/forwarder',
      ]);
      const pr = reviewAction(w, 'open', undefined, {
        repo: 'splunk-apps',
        branch: 'recovery/forwarder',
        title: 'Restore healthy canary inputs',
      });
      reviewAction(w, 'check', pr.id);
      expect(pr.check?.passed).toBe(true);
      reviewAction(w, 'approve', pr.id);
      reviewAction(w, 'merge', pr.id);
      reviewAction(w, 'deploy', pr.id);
      expect(repo.commits[repo.branches.main!]!.tree[path]?.text).toContain('sourcetype = v7_forwarder');
      tickWorld(w, 7);
      terminal(w, uf, [
        "echo -e 'practice_id=v7-recovery-001 status=200\\npractice_id=v7-recovery-002 status=500' >> /var/log/practice/forwarder.log",
      ]);
      break;
    }
  }
  tickWorld(w, 7);
}
for (const d of definitions)
  describe(d.id, () => {
    const checks = d.checks as FoundationCheck[],
      fresh = () => {
        const w = createWorld(profileWorldConfig(profile));
        setupFoundation(w, d.setup ?? []);
        w.lesson = { id: d.id, learner: 'Regression', startedTick: w.clock.tick, hints: 0, notes: '' };
        return w;
      };
    const passed = (w: ReturnType<typeof fresh>) => checks.every((c) => foundationCheck(w, c));
    const complete = (w: ReturnType<typeof fresh>) => {
      solve(w, d.id);
      w.lesson!.answers = Object.fromEntries(
        checks.filter((c) => c.kind === 'answer').map((c) => [c.id, foundationAnswer(w, c)!]),
      );
    };
    it(d.id + ':solution', () => {
      const w = fresh();
      expect(passed(w)).toBe(false);
      complete(w);
      expect(checks.map((c) => ({ label: c.label, passed: foundationCheck(w, c) }))).toEqual(
        checks.map((c) => ({ label: c.label, passed: true })),
      );
    });
    it(d.id + ':incorrect-action', () => {
      const w = fresh();
      w.lesson!.answers = Object.fromEntries(
        checks.filter((c) => c.kind === 'answer').map((c) => [c.id, foundationAnswer(w, c)!]),
      );
      terminal(w, 'ansible01', ['cd ~/splunk-automation', 'ansible indexers --list-hosts']);
      expect(passed(w)).toBe(false);
    });
    it(d.id + ':no-false-completion', () => {
      const w = fresh();
      complete(w);
      if (checks.some((c) => c.kind === 'query')) w.ingestion!.events = [];
      else for (const c of Object.values(w.forwarders!.clients)) c.installed = false;
      expect(passed(w)).toBe(false);
    });
    it(d.id + ':reset', () => {
      const w = fresh(),
        baseline = saveWorld(w);
      complete(w);
      const reset = loadWorld(baseline, []);
      expect(passed(reset)).toBe(false);
      expect(saveWorld(reset)).toEqual(baseline);
    });
    it(d.id + ':resume', () => {
      const w = fresh();
      complete(w);
      expect(passed(loadWorld(saveWorld(w), []))).toBe(true);
    });
    it(d.id + ':isolation', () => {
      const free = fresh(),
        other = fresh(),
        baseline = saveWorld(free);
      complete(other);
      expect(saveWorld(free)).toEqual(baseline);
    });
  });
