# V4 Git, Ansible, and Learn implementation plan

Status: Milestone 1 approved and implemented October 26, 2026. See `V4-GIT-MILESTONE-1.md` for delivered behavior, checks and remaining scope. Milestones 2–6 remain planned. The user explicitly superseded the “do not write code” clauses and authorized Milestone 1.

Interview-driven follow-up: [V4-INTERVIEW-ROADMAP.md](V4-INTERVIEW-ROADMAP.md) maps the supplied interview questions to ticket enhancements and proposed work. Preserve the milestones and manual lesson IDs below. Apply its structured-evidence requirements to PR/Ansible grading, and correct the current maintenance/fixup completion model before advanced rolling-restart acceptance. The companion question map is planning data, not an implemented app feature.

Target: `/Users/austinu/projectsv4/splunk-sandbox`, UI port 5573 and API port 5574. V3 is outside this change. The new brief's reference to v3 is superseded by the user's request to add this to v4. This brief explicitly requests a plan before code and review after each milestone; that is the workflow proposed here. The earlier approval to implement the profiles feature has already been fulfilled.

Inputs: `ANSIBLE-GIT-SPEC.md` is an unchanged copy of the supplied brief; `TUTORIAL.pdf` is an unchanged copy of the supplied 16-page manual. Existing constraints are in `../CLAUDE.md`, `../SPEC.md`, `../PLAN.md`, and `PROFILES-SPEC.md`. The manual, including its glossary and lesson IDs, is the lesson contract. A verified Markdown transcription should be made before authoring lesson data; raw PDF line wrapping must not become part of commands.

## Outcome

Add an offline practice workflow: edit a virtual repository on `ansible01`, commit and push to the simulated Code service, open a PR, pass checks and review, merge, and deploy through simulated Splunk/Ansible operations. Beginner lessons and expert challenges share this engine. No user-entered Git, Ansible, YAML, shell, CI, or template content executes on the real machine.

The current default, APL, and Erie worlds continue to load. Lab becomes a fourth picker card, the third named profile. Lab and APL get the automation capability and two repositories. Erie and default keep their current behavior.

## Findings and proposed resolutions

| Finding in the current implementation or manual | Resolution |
| --- | --- |
| `profile.ts` allows only SOAR and Cribl extras; SSH accepts only `splunk` from the bastion. | Add the `automation` role, its host model, `svc_ansible` account, virtual home, and explicit sudo/login policy. Allow the manual's `ssh svc_ansible@ansible01`. Do not give the automation node an imaginary Splunk service. |
| APL currently has active `idx01`–`idx20` and retired `idx21`; A9 needs new active `idx21` and `idx22`. | Add generic journaled infrastructure lifecycle operations. A9's isolated setup repurposes/reactivates `idx21`, adds `idx22`, and creates a distinct retired peer for old retired-peer references. Validate unique addresses/names and re-resolve role tokens. Existing saves retain their original topology unless that setup is run. Never increase baseline APL to 22: X4 requires 20. |
| The lab must have one permanently offline UF, but A6 says all 50 receive the config and none go quiet. | Proposed manual clarification: all **49 reachable** UFs receive it, the known offline UF stays excluded, and no additional host loses delivery. Keep desired config pending for the offline host. This changes A6's literal completion condition and needs acceptance before lesson authoring. |
| The opening instructions say every selected lesson opens Lab; later sections say Level 4 uses APL. | Interpret the later, explicit level rules as authoritative: Levels 1–2 Lab; Levels 3–4 APL initially, with Lab optional for advanced lessons whose fixtures support it. Show the environment before starting. |
| A3 asks to read a `tasks:` list, while the brief requires role-based playbooks. | Starter playbooks have explicit `tasks:` entries that invoke `include_role`; both descriptions can be satisfied. Seed A3/A5 with meaningful initial drift so the first run changes something. |
| Manual adds `--syntax-check`, `-K`, `--global` identity config, `git log --oneline -5`, and `git commit` without `-m`. | Include these in the command contract. Bare commit opens the simulated editor. `-K` uses a simulated prompt/credential policy, never OS authentication. Default inventory comes from profile-specific `ansible.cfg`. |
| `explain git rebase` is requested as an example, but executable `git rebase` is not in scope. | Explain rebase without executing it; clearly label the command as unsupported when attempted. Do not imply it was run. |
| Inventory must reflect world state, but automatically regenerating it would conceal drift. | Generate a versioned inventory at repository initialization only. Later changes are ordinary editable repo files. Compare the file to the live world for diagnostics; never silently add new peers. |
| Current Windows UFs reject SSH and have a limited virtual filesystem model. | Use a declared simulated managed-host transport for Windows automation, normalized to the existing UF filesystem. Label this simplification; do not claim real Linux `service` modules can administer Windows. Select a Linux canary in introductory examples. |
| Profile YAML is stored in save snapshots; changing a catalog file does not upgrade existing saves. | Add a versioned, idempotent automation-baseline migration, applied with a backup. Preserve clock, config overlays, tickets and existing retired-host references. Add capabilities/repos without replacing the saved profile's supplied figures. |
| Sessions currently have one autosave per profile, no learner identity, and one active server world. | Add local learner IDs and attempt-scoped session slots. Keep existing free-practice slots intact. Learners take turns on one machine; this is not multi-user authentication or concurrent isolated browser sessions. |
| Current scenario changes accept conf edits and permissions only. | Extend generic changes with virtual file writes, repo seed/remote commits, infrastructure lifecycle and scheduled automation. Extend generic checks with repo/run/evidence predicates. No scenario-ID branches in engine code. |
| `expectedPath` matches command/search/page text, generally without order or success. | Keep existing matchers; add structured successful-run evidence and ordered predicates so a later dry run cannot excuse an earlier unsafe fleet rollout. |
| CI must block bad merges, yet some incidents start with bad code already merged. | Scenario setup can inject a historical bad commit/check policy. User merges enforce current required checks and approvals. Blocked unsafe attempts are still recorded and scored. |
| X3 needs an APL PR's CI to dry-run Lab. | Run that check in a disposable deterministic Lab world, never the learner's real Lab autosave. Compare predicted changes against a versioned expected-diff fixture and attach the output to the PR. |
| A10 depends on a nightly run; no such scheduler exists. | Add a journaled simulation-clock schedule and run history. Advance simulated time for verification; no OS cron or real Ansible. |
| Existing nano supports editing and save shortcuts, but its save-name prompt does not actually support alternate names; some footer shortcuts are inert. | Fix or remove advertised unsupported shortcuts and test the exact manual keystrokes. Reuse the existing vi/nano buffer with safe adapters for commit messages and vault editing. |

## State and persistence models

All operational state belongs to `World`. UI reads DTOs derived from it; browser storage is not a separate Git or Ansible database.

```ts
interface AutomationState {
  baselineVersion: number;
  repos: Record<string, Repository>;
  checkouts: Record<string, Checkout>; // key: host + normalized virtual root
  runs: AutomationRun[];
  pipelines: PipelineRun[];
  schedules: ScheduledRun[];
  evidence: ProcessEvidence[];
}

interface Repository {
  id: 'splunk-automation' | 'splunk-apps';
  blobs: Record<string, string>;
  commits: Record<string, Commit>;
  branches: Record<string, string>; // remote branch -> commit ID
  pullRequests: PullRequest[];
  policy: { protectedBranches: string[]; approvals: number; checks: string[] };
}
interface Commit {
  id: string; parents: string[];
  tree: Record<string, { blob: string; mode: number }>;
  author: { name: string; email: string };
  message: string; tick: number;
}
interface Checkout {
  host: string; root: string; repoId: string;
  head: { branch: string } | { detachedCommit: string };
  branches: Record<string, string>;
  remoteTracking: Record<string, string>;
  upstreams: Record<string, { remote: string; branch: string }>;
  index: Record<string, { blob: string; mode: number } | null>;
  conflicts: Record<string, { base?: string; ours?: string; theirs?: string }>;
  mergeParent?: string;
  stashes: StashSnapshot[];
  identity: { name?: string; email?: string };
}
```

Working-tree content stays in the existing VFS, so nano, vi, cat, grep, git diff and Ansible read the same bytes. The index is an independent staged snapshot: editing after `git add` must not silently update a commit. Deletions, permissions, untracked files, dirty branch switches, stash conflicts, merge parents and ancestry are explicit. Commit IDs are deterministic content-derived identifiers; they do not need binary compatibility with real Git's object format. Remote URLs such as `git@github.apl.sim:splunk/splunk-automation.git` are display identifiers only.

`PullRequest` stores source/target refs, pinned head/base commit IDs, description, comments, reviews, check runs and merge status. Reviews/checks are tied to a commit: pushing new content invalidates stale approvals and results. Checks validate the proposed merged tree, so a newly changed base also requires revalidation. A conflicted tree never passes.

`AutomationRun` stores a monotonically allocated ID, repo/commit and working-tree digest, inventory and target selection, parsed options, task/batch events, changed paths, host/cohort results, recap, simulated timestamps and exit status. A result is `ok`, `changed`, `failed`, `skipped`, or `unreachable`; a check run records predicted diffs, not applied writes. Small infrastructure sets retain host detail; fleet summaries retain counts and sparse exceptions.

`ProcessEvidence` records operation type, result, tick/sequence, target cohort and artifact/run IDs. This supports checks such as successful dry run before a matching real run, canary success on the same content, reviewed merge, and maintenance mode off. Merely typing a command is not evidence that it succeeded.

Extend the mutation union with versioned Git, PR/review, CI, automation-run, infra-lifecycle and lesson operations. User operations are outer journal entries; internal VFS/service effects run under the existing nested-operation mechanism to avoid duplicate replay. Preserve stable initial repo content by baseline version. Bump the save schema independently of the product's v4 label; retain v1/v2 loaders, deterministic migration, and backup/rollback tests.

SQLite additions:

- `learners(id, name, created_at)`; names are labels, not authentication.
- `lesson_attempts(id, learner_id, profile_id, lesson_id, lesson_version, baseline_save, current_session_id, status, hints_used, score, evidence_json)`.
- `lesson_progress(learner_id, lesson_id, lesson_version, completed_at, best_score)`.
- Optional `learner_id`/`attempt_id` on sessions and history queries. Existing rows remain free practice.
- Slots such as `learn:<learnerId>:<profileId>:<attemptId>` separate attempts from `autosave:<profileId>`.

Starting a lesson saves the current free-practice world, builds the deterministic lesson setup, and captures its initial save. Reset restores that save and clears the attempt's subsequent evidence without deleting another learner's progress or historical best score. Switching learners flushes UI writes and closes terminals before world swap. Returning to free practice restores its own save.

## Interpreter and deployment design

Use the existing YAML parser with source locations, strict schemas, bounded aliases/depth/size, and rejection of custom tags. Parse Jinja expressions, conditions, loops and templates into a bounded AST with an explicit supported subset. Do not use JS evaluation, Python, subprocesses, arbitrary plugin loading, shell expansion or external template lookup functions. Unknown modules, syntax and expressions fail clearly rather than report false success.

Inventory parsing supports children/groups, explicit host vars, site/class groups, union/intersection/exclusion patterns, `--limit`, and retry-file host lists. APL uses `inventories/prod/hosts.yml`; Lab uses `inventories/lab/hosts.yml`. The automation repo includes both for X3's isolated CI Lab job. Host references resolve against the selected simulated world only.

Define variable precedence and test it: role defaults, inventory/group vars, host vars, play/task vars, set facts/register, and extra vars, with documented behavior for the supported subset. Include role/task-relative paths, templates, role defaults and handlers. Undefined variables produce source-aware errors. All paths normalize inside the virtual host; real filesystem paths and remote downloads cannot be reached through an interpreter operation.

Modules are explicit handlers for the requested ping, copy, template, file, lineinfile, blockinfile, ini_file, local unarchive, service/systemd, restricted Splunk command/shell, wait_for, simulated REST uri, debug, assert, set_fact and role/task includes. Add explicit `meta: flush_handlers` support for the requested handler semantics. Restrict command/shell to parsed Splunk invocations; reject compound shell execution. Modules return results with changed/failed flags for `register`, `when`, `changed_when` and `failed_when`.

Check mode uses a disposable overlay with the same resolver and module code. It predicts sequential effects without committing changes to the live VFS, services, inventory, or simulated clock; the run report and process evidence are the only intentional live records. Respect a task's explicit check-mode override where supported and disclose any resulting mutation. `--syntax-check` runs validation only. Diff output suppresses simulated secret values.

Scheduler batches hosts deterministically, models overlapping restarts within a batch, and checks health/SF/RF between batches. This is essential: restarting every host synchronously one after another and then labeling it parallel would hide A7's outage. Implement serial counts/percentages, failure thresholds, delegated execution, run-once scope and handler flush boundaries explicitly, with tests for batches and maintenance-mode cleanup. `wait_for` and REST checks advance bounded simulation steps, never sleep on real infrastructure.

Fleet execution partitions columnar rows by task-relevant inputs: OS, site, class, version, connectivity, effective vars, config and sparse host overrides. Evaluate a plan per equivalent cohort; host-specific templates or failures split cohorts. Do not materialize thousands of full VFS objects. For inherently unique host-dependent tasks, use bounded lazy execution and report budget exhaustion rather than claiming unexecuted hosts succeeded. Compare aggregate runs to per-host reference runs on small fixtures.

CI is also an interpreter. YAML/Ansible lint, conf validation, packaged-app rules, SPL parse checks and the optional dry-run job call engine functions. No YAML CI job can run an arbitrary process. Errors include file/line where available. Pipeline steps have persisted status/logs and a pinned commit; merging a PR does not itself change running Splunk config. The apps pipeline stages deployment-apps/manager-apps/SHC apps, then invokes the existing reload/bundle primitives in order. Failures leave inspectable staged-versus-running state and allow safe retry. Automation repo merges update source; a playbook run or declared simulated schedule performs rollout.

Vault is a local training model with placeholder secrets and an unmistakable simulation boundary; do not imply real Ansible Vault cryptographic interoperability. View/edit/encrypt verify the virtual password file, avoid plaintext in diffs/logs, and round-trip the encrypted-looking representation through the simulated editor. The password file remains outside both repos. CI and scoring detect plaintext fixture secrets, without pretending to implement a general secret scanner.

## Lesson contract and UI

Code gets its own name/logo and dark interface: repository browser, file/branch/commit views, diffs, PR forms, review thread, checks and pipeline logs. Add it and Learn under Engineer Sandbox. Keep existing Splunk navigation usable and show the active profile and learner/lesson context.

Learn uses the terminal or Code view on the left and a persistent lesson panel on the right. Lessons are validated YAML with the requested setup, steps, checks, hints, trap and doneWhen fields. Step text, glossary, IDs, filenames and commands come from the manual, not invented replacement lessons. Use structured outcomes as well as existing expectedPath matchers. Copy buttons copy only commands, never prose or prompt symbols. Exact keystroke instructions for nano remain visible to beginners.

| Level | IDs and manual durations | Environment | Presentation |
| --- | --- | --- | --- |
| 1 | G1 10m, G2 15m, G3 20m; A1 10m, A2 10m, A3 15m | Lab | Exact commands, plain-English explanations, ordered hints and auto-checks |
| 2 | G4 20m, G5 10m; A4 20m, A5 15m, A6 20m | Lab | Goals, key commands, hints on request |
| 3 | G6 20m, G7 15m; A7 30m, A8 20m, A9 20m, A10 25m | APL initially | Goal, success criteria, one hint then answer |
| 4 | X1 45m, X2 45m, X3 40m, X4 30m, X5 40m, X6 60m | APL | Ticket, timer, criteria; no hints; correctness and process score |

`explain` is a read-only command catalogue covering every supported Git/Ansible subcommand and flag; it also powers the Explain UI. Beginner error coaching follows the original error, never replaces it. Tooltip definitions use the manual's glossary. Expert setup, solutions and hidden causes stay server-side until debrief.

The seven named APL practice drills and six expert challenges each get data files, successful solution runs and negative tests. Lesson mapping: G6 -> merge conflict; G7 -> safe revert variant; A7 -> rolling restart; A8 -> vault certificate rotation; A9 -> inventory drift; A10 -> overwritten hotfix. Bad-props and check-mode practice remain separately selectable drills. X1–X6 retain their manual IDs in Learn and use schema-compatible scenario IDs. Fix checks validate both final effects and required process; they must not pass on an unrelated successful PR or dry run.

## Milestones and acceptance gates

1. **Lab and journaled Git core.** Add automation role/account/repo baselines, Lab topology with exactly one persistently offline UF and no background incidents, profile capability migration, all requested terminal Git commands, three-way merge/conflicts, branch protection and usable editors. Tests: independent index/worktree state; conflicting and clean pull/stash/revert; dirty switch protection; force-main rejection and evidence; exact G1/G2 terminal sequence; old-save migration; Git replay; Lab offline count after many ticks. Code UI and Ansible are not claimed complete at this gate.
2. **Code, PRs, CI and deployment.** Add browser/API views, reviews, head/base-bound checks, protected merges and resumable pipelines. Tests: failing check blocks merge, new commit invalidates approval, base change invalidates checks, conflict markers rejected, repo files remain inert until correct deployment step, deployment failure/retry, save/reload preserves PRs. Basic Ansible lint here validates structure; executable dry-run CI arrives with the interpreter and X3.
3. **Ansible execution foundation.** Add inventory, options, syntax diagnostics, variables/templates, modules, role/task includes, handlers, check/diff and recaps. Reuse VFS/config/service primitives. Tests: module changes visible in btool/search only after proper application; permissions; idempotency; undefined vars; offline results; check-mode nonmutation; successful and rejected module/REST/Splunk inputs. No real process/network/file access from submitted content.
4. **Learners and introductory lessons.** Add SQLite migration, lesson isolation/reset/resume, Learn panel, explain/coaching/glossary and G1–G5/A1–A6. Tests run each lesson's solution and verify step evidence; two learners cannot overwrite each other; reset preserves free-practice state; exact manual commands execute, including editor shortcuts. Apply the accepted A6 clarification in a documented erratum.
5. **Advanced Ansible and lessons.** Add realistic batch timing and stop conditions, run_once/delegation, vault, deeper lint, retry files, cohort execution, nightly schedules, and G6–G7/A7–A10. Tests: bad rolling restart causes an observable outage while serial recovery does not; expected retry host set; failure threshold stops next batch; no secret leaks; alias/recursion budgets; inventory drift and nightly overwrite have real effects; cohort results match small reference runs and APL-scale allocations stay bounded.
6. **Expert challenges and scored drills.** Complete the seven named APL drills, X1–X6, process scoring and debriefs, including X3 dry-run CI and X5 five-line postmortem. Each has solution and adversarial runs, save/replay validation, and UI verification. Test that post-hoc dry runs, unrelated canaries, failing-check merge attempts and cosmetic config edits cannot earn safety/correctness credit.

At every gate run relevant focused tests, the complete existing regression suite, typecheck, lint and the web build; inspect changed browser flows. The pre-change v4 baseline last passed 190 tests. Keep its default-world fixture and profile solution runs. Report what is implemented versus still pending, and stop for the milestone review requested by this brief. Do not publish to real GitHub as part of this work.

## Proposed source layout

```text
packages/sim/src/automation/{state,baseline,evidence}.ts
packages/sim/src/git/{objects,checkout,merge,commands,prs,checks,pipeline}.ts
packages/sim/src/ansible/{ast,inventory,vars,template,modules,runner,vault,lint}.ts
packages/sim/src/learn/{schema,engine,checks,explain,glossary}.ts
apps/server/src/{code,learn}.ts
apps/web/src/pages/{CodePage,LearnPage}.tsx
apps/web/src/components/{LessonPanel,LearnerPicker}.tsx
profiles/lab.yaml
lessons/{G1..G7,A1..A10,X1..X6}.yaml
scenarios/apl-{ansible,pr,vault,...}-*.yaml
docs/TUTORIAL.md                 # verified transcription, PDF retained as source
```

Milestone 1 is implemented. The next implementation milestone is Code/PRs/CI. The proposed A6 reachable-host clarification remains relevant when introductory lessons are authored; the user approved Milestone 1 without explicitly settling that lesson's wording. No external credentials, hosting choice or real GitHub authorization is needed.
