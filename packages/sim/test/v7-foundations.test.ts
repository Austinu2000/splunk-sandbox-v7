import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  createWorld,
  parseProfile,
  profileWorldConfig,
  setupFoundation,
  foundationCheck,
  foundationAnswer,
  saveWorld,
  loadWorld,
  TerminalSession,
} from '../src/index';
import { logAction } from '../src/interview/engine';
import type { FoundationCheck } from '../src/engineering/foundations';
import { engineeringLessonSchema } from '../src/engineering/lesson-schema';
import { hostFs } from '../src/vfs/build';
import { resolveHost } from '../src/hosts/profile';
import { ROOT } from '../src/vfs/vfs';

const dir = new URL('../../../lessons/v7/', import.meta.url);
const lessons = readdirSync(dir)
  .filter((n) => n.endsWith('.json'))
  .map((n) => engineeringLessonSchema.parse(JSON.parse(readFileSync(new URL(n, dir), 'utf8'))));
const lab = parseProfile(readFileSync(new URL('../../../profiles/lab.yaml', import.meta.url), 'utf8'));
const login = ['ssh svc_ansible@ansible01', 'cd ~/splunk-automation'];
const solutions: Record<string, string[]> = {
  'SP-001': ['ssh splunk@ds01', 'hostname', 'exit', 'ssh splunk@idx01', 'splunk version'],
  'SP-002': [],
  'SP-003': ['ssh splunk@sh01', 'splunk status', 'ss -lnt'],
  'SP-004': [
    'ssh splunk@ds01',
    "echo -e '[general]\\nserverName = training_node\\n' > /opt/splunk/etc/system/local/server.conf",
    'splunk restart',
    'splunk btool server list general --debug',
  ],
  'SP-005': [
    'ssh splunk@ds01',
    'rm /opt/splunk/etc/system/local/server.conf',
    'splunk restart',
    'splunk btool server list general --debug',
  ],
  'AU-01': [...login, 'hostname', 'ansible --version'],
  'AU-02': [...login, 'whoami', 'id'],
  'AU-03': [...login, 'pwd', 'cat README.md'],
  'AU-04': [
    ...login,
    'sudo chown svc_ansible inventory_notes.txt',
    'chmod 640 inventory_notes.txt',
    'cat inventory_notes.txt',
  ],
  'AU-05': [...login, 'ansible-config dump'],
  'AU-06': [...login, 'ansible indexers -m ping --limit idx01'],
  'AU-07': [...login, 'ansible-inventory --list', 'ansible all --list-hosts'],
  'AU-08': [...login, 'ansible-inventory --graph', 'ansible indexers --list-hosts'],
  'AU-09': [...login, 'ansible "indexers:!idx03" --list-hosts'],
  'AU-10': [...login, 'ansible-inventory --host idx02'],
  'AU-11': [...login, 'ansible-inventory --host idx01'],
  'AU-12': [...login, 'ansible all --list-hosts --limit idx01', 'ansible all -m ping --limit idx01'],
  'AU-13': [...login, 'ansible all -i inventories/test/hosts.yml --list-hosts'],
  'AU-14': [...login, 'ansible indexers --list-hosts'],
};
for (const definition of lessons.filter((lesson)=>Object.hasOwn(solutions,lesson.id)))
  describe(definition.id, () => {
    const checks = definition.checks as FoundationCheck[];
    const fresh = () => {
      const world = createWorld(profileWorldConfig(lab));
      setupFoundation(world, definition.setup ?? []);
      world.lesson = { id: definition.id, learner: 'Regression', startedTick: 0, hints: 0, notes: '' };
      return world;
    };
    const passed = (world: ReturnType<typeof fresh>) =>
      checks.every((check) => foundationCheck(world, check));
    const solve = (world: ReturnType<typeof fresh>) => {
      if (definition.id === 'AU-14') {
        const host = resolveHost(world, 'ansible01')!,
          fs = hostFs(world, host);
        const path = '/home/svc_ansible/splunk-automation/inventories/lab/hosts.yml';
        fs.writeFile(
          path,
          fs.readFile(path, ROOT).replace('        idx02: {}', '        idx02: {}\n        idx03: {}'),
          ROOT,
        );
      }
      const term = new TerminalSession({
        world,
        onCommand: (event) =>
          logAction(
            world,
            { kind: 'cmd', text: event.line, host: event.host, user: event.user, success: event.success },
            0,
          ),
      });
      term.start();
      for (const command of solutions[definition.id] ?? []) term.input(command + '\r');
      term.dispose();
      if (definition.id === 'SP-002')
        for (const page of ['fleet', 'operations']) logAction(world, { kind: 'page', text: page }, 0);
      world.lesson!.answers = Object.fromEntries(
        checks.filter((c) => c.kind === 'answer').map((c) => [c.id, foundationAnswer(world, c)!]),
      );
    };
    it(`${definition.id}:solution`, () => {
      const world = fresh();
      expect(passed(world)).toBe(false);
      solve(world);
      expect(checks.map((c) => ({ label: c.label, passed: foundationCheck(world, c) }))).toEqual(
        checks.map((c) => ({ label: c.label, passed: true })),
      );
    });
    it(`${definition.id}:incorrect-action`, () => {
      const world = fresh();
      world.lesson!.answers = Object.fromEntries(
        (definition.questions ?? []).map((q) => [q.id, 'incorrect']),
      );
      expect(passed(world)).toBe(false);
    });
    it(`${definition.id}:no-false-completion`, () => {
      const world = fresh();
      solve(world);
      world.lesson!.answers = {};
      expect(passed(world)).toBe(false);
    });
    it(`${definition.id}:reset`, () => {
      const world = fresh();
      const baseline = saveWorld(world);
      solve(world);
      const reset = loadWorld(baseline, []);
      expect(passed(reset)).toBe(false);
      expect(saveWorld(reset)).toEqual(baseline);
    });
    it(`${definition.id}:resume`, () => {
      const world = fresh();
      solve(world);
      const loaded = loadWorld(saveWorld(world), []);
      expect(passed(loaded)).toBe(true);
      expect(loaded.lesson).toEqual(world.lesson);
    });
    it(`${definition.id}:isolation`, () => {
      const free = fresh(),
        other = fresh();
      const before = saveWorld(free);
      solve(other);
      expect(saveWorld(free)).toEqual(before);
    });
  });
