You are working in my Splunk sandbox repo (v3). Add two simulated tools: an **Ansible control node** and a **simulated GitHub** (local git in the terminal plus a web "Code" app with pull requests and CI). The goal is to practice infrastructure-as-code Splunk administration: change code, open a PR, pass checks, merge, and roll the change out with Ansible.

It must work for two audiences:
- **A complete beginner** (for example, my brother) who has never used Git, Ansible, Linux or Splunk. They need a guided Learn mode with step-by-step lessons, plain-English explanations, hints and a reset button.
- **An experienced engineer** (me) who wants realistic, hard, scored challenges with no hand-holding.

A tutorial manual already exists: "Git and Ansible in the Splunk Sandbox: Tutorial Manual". I will export it to `docs/TUTORIAL.md`. Its lesson IDs (G1–G7, A1–A10, X1–X6), hostnames, file paths and commands are the contract: the in-app lessons must match it exactly, so a learner can follow the manual and the app side by side. If something in the manual can't be built as written, tell me and propose the closest change.

Read CLAUDE.md first. Hard rule 1 applies with extra force: nothing here executes real Ansible, git, YAML tags or shell commands. Playbooks and git operations are parsed and interpreted against the simulated world. No child_process, no real filesystem or network access, no eval.

Do not write code yet. First give me a plan with data models and a milestone breakdown, and flag conflicts with the current engine (and with the profiles work in docs/PROFILES-SPEC.md, if it exists). After I approve, build one milestone at a time with tests, and stop after each milestone for review.

## 0. Lab environment (for beginners)

- Add a third profile, `lab`: a small fictional company with 1 site, 3 indexers (`idx01`–`idx03`) in a cluster with `cm01`, 1 search head (`sh01`), 1 deployment server (`ds01`), 1 heavy forwarder, `ansible01`, and 50 universal forwarders. One forwarder is always offline (lesson A2 relies on it). No background incidents unless a lesson creates them.
- Levels 1–2 lessons run on `lab`. Level 3 runs on `lab` or `apl`. Level 4 challenges run on `apl`. The APL profile also gets `ansible01` and both repos.
- Inventory path per profile: `inventories/lab/hosts.yml`, `inventories/prod/hosts.yml` (APL).

## 1. Ansible control node

- New infra host `ansible01` (role `automation`) in the `lab` and `apl` profiles, reachable by SSH from the bastion. User `svc_ansible` with `sudo`.
- Repo checked out at `/home/svc_ansible/splunk-automation` (it lives in the simulated git server, section 2):
  - `ansible.cfg`, `inventories/prod/hosts.yml`, `group_vars/`, `host_vars/`
  - `playbooks/`: `uf_install.yml`, `deploy_apps.yml`, `rolling_restart.yml`, `cluster_bundle.yml`, `shc_bundle.yml`, `cert_rotate.yml`, `serverclass_update.yml`
  - `roles/` behind those playbooks, with `tasks/`, `handlers/`, `templates/` (Jinja2), `defaults/`
- **Inventory comes from world state.** Groups: `indexers`, `search_heads`, `shc_members`, `deployer`, `cluster_manager`, `deployment_server`, `license_manager`, `heavy_forwarders`, `universal_forwarders` (the fleet, addressable by site and server class, for example `uf_lau_win_servers`). New indexers added by a scenario appear only if the inventory file is updated, so inventory drift is a real failure mode.
- **Commands:** `ansible`, `ansible-playbook` (with `-i`, `-l/--limit`, `--check`, `--diff`, `-t/--tags`, `--skip-tags`, `-e`, `-v`), `ansible-inventory --list/--graph`, `ansible-lint`, `ansible-vault view/edit/encrypt` (simulated vault, password from a file on ansible01). Add `ansible-galaxy collection list` showing installed collections (read-only).
- Roles referenced by the manual must exist: `splunk_indexes` (with `templates/indexes.conf.j2` driven by a `max_total_data_size` variable in `group_vars/indexers.yml`), `splunk_outputs` (with `notify: restart splunk` and a handler), plus roles behind every playbook. Vault file `group_vars/all/vault.yml`, password file `~/.vault_pass`. `ansible.cfg` sets `retry_files_enabled = True` so `--limit @<playbook>.retry` works (lesson X4).
- **Supported modules (interpreted):** `ping`, `copy`, `template`, `file`, `lineinfile`, `blockinfile`, `ini_file`, `unarchive` (from local files only), `service`/`systemd`, `command`/`shell` restricted to the simulated `splunk` CLI, `wait_for`, `uri` against simulated Splunk REST only, `debug`, `assert`, `set_fact`, `include_role`/`import_tasks`. Anything else fails with Ansible's real "couldn't resolve module/action" error.
- **Semantics to get right:** `become`, `serial` (rolling batches), `max_fail_percentage`, `run_once`, `delegate_to`, handlers (notify, flush at end of play), `when`, loops, `register`, `changed_when`/`failed_when`, `check_mode`, idempotency (a second run reports `ok`, not `changed`), Jinja undefined-variable errors, YAML syntax errors with line numbers.
- **Output** matches real Ansible: `PLAY [...]`, `TASK [...]`, per-host `ok/changed/failed/skipping/unreachable`, `--diff` blocks, and `PLAY RECAP`. Offline or unhealthy hosts show `UNREACHABLE!` with a realistic SSH message.
- **Effects go through the engine.** Config writes become journal mutations exactly like hand edits, so btool, searches and dashboards reflect them. Restarts and reloads use the existing primitives. Large fleet runs (thousands of UFs) are aggregated: interpret the play once per distinct host group and summarize, never loop 6,000 full host objects.

## 2. Simulated GitHub

- **Terminal git** on ansible01 and on the deployer: `git status`, `diff` (and `--staged`), `add`, `commit -m`, `log --oneline` (and `-n`), `branch`, `checkout -b`, `switch` (and `-c`), `fetch`, `pull` (and `pull origin main`), `push` (and `-u origin <branch>`), `stash`/`stash pop`, `restore`, `revert`, `reset`, `blame`, `show`, `config user.name/user.email`. Real Git messages and conflict markers. Force-pushing to `main` is blocked with the message `force-push to main is blocked` and recorded as an unsafe action. `~/splunk-automation` and `~/splunk-apps` are both cloned on ansible01. Editors: `nano` and `vi` must work well enough for beginners (nano shortcuts shown in a footer). Remote is the simulated server (`git@github.apl.sim:splunk/<repo>.git`). Merge conflicts are possible when a scenario changes the remote.
- **Repos:** `splunk-automation` (Ansible) and `splunk-apps` (deployment apps, `manager-apps`, SHC apps, `props.conf`/`transforms.conf`/`inputs.conf`/`savedsearches.conf`).
- **Web app "Code"** under Apps → Engineer Sandbox, styled like GitHub's dark theme but with its own name and logo (no GitHub branding): repo list, file browser, commit history, branches, **pull requests** (description, diff view, review comments, approve/request changes from simulated teammates, required approvals), and **CI checks** per PR:
  - `yamllint` and `ansible-lint` for the automation repo
  - `btool-check` (runs the engine's conf validator against the changed files), a simple AppInspect-style check (no `local/` in packaged apps, valid `app.conf`), and an SPL syntax check for `savedsearches.conf`
- **Merge to main triggers a pipeline** (simulated GitHub Actions log): for `splunk-apps`, sync to the deployer, cluster manager `manager-apps` or deployment server `deployment-apps`, then show the bundle push or `reload deploy-server` step. Pushes take effect only through those steps, the same as real Splunk.
- Simulated teammates leave review comments driven by scenario data (for example "did you test with --check?").
- All repo state is part of the world journal, so it saves, loads, and continues with the profile.

## 3. Learn mode (beginner friendly)

- **Learn app** under Apps → Engineer Sandbox → Learn. A lesson list grouped by level (1 Beginner, 2 Intermediate, 3 Advanced, 4 Expert) with progress ticks and estimated minutes.
- **Learners:** a learner picker (name only, no password) so several people on one machine keep separate progress, saves and scores. Store learner progress in SQLite next to sessions.
- **Lessons are data files**, `lessons/<id>.yaml`, one per manual lesson: `id`, `level`, `title`, `minutes`, `profile`, `setup` (world changes and repo state the lesson starts from), `steps` (text shown in the panel, matching the manual), `checks` (predicates on terminal commands, pages visited, repo state and world state, reusing the interview `expectedPath` matchers), `hints` (ordered, from a nudge to the full answer), `trap` (unsafe action to detect), `doneWhen`.
- **Lesson panel** on the right; terminal and Code app on the left. Each step ticks when its check passes. Level 1 shows the exact command with a copy button and a one-line explanation. Level 2 shows the goal and key commands. Level 3 shows the goal, one hint, then the answer. Level 4 shows only the ticket, time limit and success criteria, and scores at the end.
- **Reset lesson** snapshots world and repo state at lesson start and restores it in one click.
- **Explain:** typing `explain <command>` (for example `explain git rebase` or `explain ansible-playbook --check`) prints a plain-English description without running anything. Covers every supported git and Ansible command and flag.
- **Coaching on errors (Levels 1–2 only):** after the real error message, print a short dimmed line in plain English saying what it means and what to try. The real message always comes first, so learners also learn to read real errors. Levels 3–4 show real errors only.
- **Glossary tooltips:** in Learn mode, terms like *commit*, *branch*, *playbook*, *handler*, *idempotent* in lesson text are underlined; hovering shows the manual's glossary definition.
- **Scoring (Level 4 and interview mode):** correctness plus process: dry run before a real run, canary before fleet, PR instead of direct push, checks green before merge, no plaintext secrets, maintenance mode disabled at the end.

## 4. Practice drills (scenario YAML, `profiles: [apl]`)

These are the Level 3–4 scenarios behind manual lessons G6, G7, A7–A10 and X1–X6. The table below gives the hidden causes the manual doesn't reveal.

| ID | Ticket symptom | Hidden cause | Fix check |
|---|---|---|---|
| apl-ansible-rolling-restart | Whole indexer cluster went down during patch night | `rolling_restart.yml` lacks `serial` and never enables maintenance mode on the cluster manager | Playbook uses `serial: 1`, enables and disables maintenance mode, waits for SF met; rerun shows no outage |
| apl-ansible-inventory-drift | Two new indexers never received the latest config | `inventories/prod/hosts.yml` missing idx21/idx22 | Inventory updated, playbook run, btool matches on all peers |
| apl-ansible-overwrote-hotfix | A props.conf hotfix disappeared overnight | Someone hand-edited the server; the nightly Ansible run reverted it | Hotfix committed to git and merged; next run keeps it |
| apl-pr-bad-props | PR merged and FortiGate events broke | Typo in `LINE_BREAKER` regex passed review because CI was skipped | Fix PR with CI green, bundle pushed, events correct |
| apl-pr-merge-conflict | Your PR can't merge | Teammate changed the same `indexes.conf` stanza | Conflict resolved, both changes kept, CI green |
| apl-vault-cert-rotate | Forwarders failing TLS after cert rotation | Vaulted cert password updated in only one group_vars file | Vault vars fixed, `cert_rotate.yml` run with `--limit`, forwarders reconnect |
| apl-ansible-check-mode | Change advisory board asks what the playbook will change | Practice task | `--check --diff` output saved to the ticket before the real run |

Each drill needs a solution-run test and interview `expectedPath` steps (for example "ran --check before applying", "used --limit on a canary host first"). Penalize unsafe actions: running a playbook against all hosts without `--check` or `--limit` first, force-pushing to main, and merging with failing checks.

Expert challenges X1–X6 (manual Level 4) also need scenario files with these hidden setups:

| ID | Hidden setup | Scored on |
|---|---|---|
| X1 | No `splunk_hec` role exists; HEC disabled on heavy forwarders | Role structure, lint clean, idempotent second run, merged via PR |
| X2 | Forwarders on 3 versions across sites; 1 site has a host that fails the upgrade | `serial` batches, `max_fail_percentage`, canary batch, play halts on the bad batch, no site quiet |
| X3 | CI has no dry-run job | New CI check runs `--check --diff` on lab inventory, posts diff to PR, fails on unexpected change |
| X4 | 6 of 20 indexers have a stale `splunk_home` host var | Root cause from `-vvv` and facts, fix in code, rerun only failed hosts |
| X5 | A merged commit set a bad `LINE_BREAKER` for FortiGate | Revert via PR, bundle redeployed, events parse, five-line postmortem in the ticket |
| X6 | 12 settings hand-edited on servers over time | Final `--check` across all hosts reports zero changes; real differences captured in repo |

## 5. Milestones

1. `lab` profile; simulated git core (repo objects, commits, branches, diff, conflicts) in `packages/sim`, journaled; terminal git commands; nano/vi usable.
2. Web "Code" app: repos, files, commits, PRs, reviews, CI checks, merge pipeline.
3. Ansible parser and interpreter: inventory, plays, tasks, supported modules, handlers, check/diff, recap output.
4. Learn mode: learners, lesson engine, panel, checks, hints, reset, `explain`, error coaching, glossary; lessons G1–G5 and A1–A6 with tests that run each lesson's solution.
5. Rolling semantics (`serial`, `max_fail_percentage`, `run_once`, `delegate_to`), vault, lint, retry files, fleet-scale aggregation; lessons G6–G7 and A7–A10.
6. Level 4 challenges X1–X6 and the APL drills, each with a solution-run test and scoring.

Keep all existing tests passing.
