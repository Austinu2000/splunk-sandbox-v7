# Milestone 1: Lab and simulated Git

Implemented October 26, 2026 in v4. Choose **Practice Lab** or **Johns Hopkins APL**, then open **Engineer Sandbox → Terminal**.

## Start practicing

Type these in the sandbox's simulated terminal:

```sh
ssh svc_ansible@ansible01
cd ~/splunk-automation
git status
git log --oneline
git config --global user.name "Your Name"
git config --global user.email learner@example.test
git switch -c practice
nano README.md
```

Add a line. In nano, **Ctrl+O**, **Enter**, then **Ctrl+X** saves and exits. Then:

```sh
git diff
git add README.md
git diff --staged
git commit -m "Add a practice note"
git push -u origin practice
```

The push goes to the simulated shared repository. No GitHub account or network access is involved. The Code web app and PR review workflow are Milestone 2; Ansible execution is Milestone 3. The folders/playbooks currently provided are editable starter files, not an executable Ansible implementation. Guided Learn lessons and learner accounts are later milestones.

`~/splunk-apps` is the second repository. Both repositories are also checked out under `/home/splunk` on APL's `deployer01`; log in there as `splunk` to practice fetching changes between two working copies. Working copies have separate branches, staging areas, stashes and identities, sharing a remote per repository and environment. Lab and APL do not share their remote state.

## Lab

The fictional Lab contains 50 universal forwarders, three active indexers, a cluster manager, one search head, a deployment server, one heavy forwarder, and `ansible01`. The existing engine also supplies a license manager, Monitoring Console and one retired peer. Exactly one forwarder is deliberately powered off, including for simulated SSH. The other 49 remain healthy unless you change their configuration; background random failures and unsolicited scenarios are disabled.

APL retains 20 active indexers and its existing scale. Its added control node has the `automation` role and a `svc_ansible` account with simulated sudo. No Splunk service is installed on the control node. The existing retired `idx21` remains unchanged; the later inventory-drift scenario will manage its own topology setup.

Inventory is generated once into `inventories/lab/hosts.yml` or `inventories/prod/hosts.yml`. It includes infrastructure groups plus forwarder groups by site/server class, such as `uf_lau_win_servers`. Editing inventory does not silently alter the fleet, and future topology changes will not silently rewrite inventory.

## Git behavior

Supported commands and selected forms:

| Command | Supported behavior |
| --- | --- |
| `status`, `status --short` | Branch/tracking status, staged changes, unstaged changes, untracked files and conflicts |
| `diff`, `diff --staged` | Text and mode/deletion diffs; optional path filtering, and `diff HEAD` |
| `add <path>`, `add .`, `add -A` | Snapshot file content and executable mode into the index, including deletions |
| `commit -m <message>`, `commit` | Commit staged content; bare commit opens nano; identity required |
| `log --oneline`, `log -n N`, `log --oneline -5` | History including merge parents |
| `branch`, `branch -a`, `branch -r` | List local/remote branches; create branches, or delete with `-d`/`-D` |
| `switch [-c] <branch>`, `checkout [-b] <branch>` | Create/switch branches, track fetched remote branches, protect dirty files; checkout also accepts a detached commit |
| `fetch [origin]`, `pull [origin main]` | Fetch remote refs; fast-forward or three-way merge; conflict markers when overlapping edits cannot combine |
| `push [-u] [origin <branch>]` | Push to the simulated remote, set tracking, reject non-fast-forward updates |
| `stash`, `stash list`, `stash pop` | Store tracked work/index state, restore work, retain stash when conflicts occur |
| `restore <path>`, `restore --staged <path>` | Restore from index, or unstage back to HEAD |
| `reset [--soft|--mixed|--hard] [commit]` | Reset branch/index/worktree according to mode; protect unrelated untracked files |
| `revert <commit>` | Create an inverse commit; overlapping reverts currently fail without changing files |
| `blame <file>`, `show [commit]` | Line attribution and commit changes |
| `config [--global] user.name/user.email` | Per-working-copy or per-host/user identity |

Short commit IDs, `HEAD~N`, and `HEAD^N` resolve within known history. Mode/deletion changes are tracked. Staging is a snapshot: editing a file after `git add` does not change the staged version. Pull merges keep both parents; resolve conflicts with the editor, `git add`, and `git commit`. `git reset --hard HEAD` abandons the conflicted working tree. Successful stash pop restores changes unstaged; `stash pop --index` is not supported.

Force-pushing `main` is blocked with **force-push to main is blocked** and recorded as an unsafe action, including explicit force refspecs. Normal fast-forward pushes to main remain possible in this milestone; required PR approvals and CI policy arrive with Code. `--force-with-lease` checks the last fetched ref on other branches. Arbitrary remotes, rebase, merge-commit revert, unsupported flags and shell execution are rejected. `.gitignore` handling covers exact paths/names and extension patterns, not the complete Git pattern language. Very large text merges conservatively report conflicts instead of allocating an unbounded diff table. This is a training implementation, not a binary-compatible Git client.

## Saving and upgrading

Git operations and virtual file edits are part of the existing world journal. Small Git deltas record changed staging entries, refs, identities, conflicts and stashes; unchanged repository history is not duplicated for every operation. Autosave, profile switching, manual save/load and reset include this state. Saves still live in v4's ignored SQLite database, separate from real repository source.

Save schema **3** supports the new mutation types while loading schemas 1 and 2. Older APL saves replay their original state before the additive automation upgrade. Existing nodes/addresses, clock, tickets, overlays and UI state remain intact. The database keeps an exact **Before Git automation upgrade** backup for older APL autosave slots before replacement. Loading a backup also applies the additive upgrade; its original serialized contents stay preserved in SQLite. Default and Erie do not gain automation repositories.

Baseline version 1 fixes initial repository content for deterministic replay. Changes to future baselines require an explicit migration. The simulated `git` command operates on in-memory repository objects and the virtual filesystem only. Production host files, real Git repositories and external services cannot be targeted through it.

## Validation

The full regression suite passed **210 tests in 23 files** with two workers. Coverage includes the prior default-world fixture and profile drills, permanently offline Lab behavior, SSH/sudo, staged-versus-unstaged content, branch protection, two-checkout conflicts and resolution, non-overlapping merges, stash conflicts, file modes/deletions, revert/reset/blame, editor keystrokes, save replay, compact journal entries, profile isolation and pre-upgrade SQLite backup/reopen.

Browser checks exercised the four environment cards, Lab selection, the automation-host shortcut, SSH, repository navigation, `git status`, and `git log --oneline`. An earlier broad-worker test run passed assertions but reported a runner timeout; the two-worker rerun passed cleanly.

TypeScript, lint, and the production web build passed. The build retains its existing large-bundle warning. After the final SSH/sidebar adjustments, all 43 shell/Git tests passed again. V3 source files were not changed.
