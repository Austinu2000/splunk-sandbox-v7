# V7 Ansible and change management

AU-15–AU-27 add 13 executable lessons (64 new / 91 total). These individual AU
objectives refine the accepted track ranges; the original individual AU source was
not supplied. All original 27 lesson IDs/files remain intact.

## Shared operational workflow

Automation Operations → Playbooks & Roles previews nine versioned source additions.
Add missing starter files creates untracked files owned by the workspace account;
it never overwrites conflicts, commits source, changes seed history or deploys.
Working-tree revision and active-environment context reject stale additions.
New lesson attempts precommit those additions only in their isolated fixture.

The connectivity, input role and validation playbooks target the Deployment Server.
The role creates an explicit teaching log and monitored-input app, with splunk
ownership, quoted octal modes and an on-change restart. No generated events are
manufactured by adding a file. The ordinary ingestion engine reads the active
monitor on the next simulated tick. The role does not write directly to cluster
peers. Legacy starters remain available for the original tutorials; they are not
claimed as V7 forwarder install, upgrade or certificate coverage.

CLI executes the working tree. Deployment Center / Code executes a selected
committed branch. Runs retain playbook, inventory, content revision, exact hosts,
results and (for committed runs) commit ID. Web writes reject a supplied stale
world context or branch revision. Legacy local API callers may omit those fields;
this is a single-user loopback tool, not a remote authentication boundary.

Merging automation source never deploys it. PR validation checks source/conflicts
and, when .sandbox-ci.yml is present, runs a disposable Lab dry run with explicit
expected changed paths. Approval/checks must match current head/base. Deploy main
separately, then verify effective config. Rollback is a new non-merge git revert
commit followed by another reviewed merge and explicit deployment.

## Supported bounded interpretation

- YAML tasks, local roles/defaults/vars, scoped task variables, extra vars,
  register/set_fact, bounded loops, serial targeting, delegation and run_once.
- copy/template/file, line/block/ini edits, ping/debug/assert, service and the
  documented simulated command allowlist. Ownership/group/modes affect VFS access.
- Handlers run once in definition order at the supported flush boundaries; role
  handlers retain their role paths and vars. Unknown/cyclic notifications fail.
- Basic defined/not, booleans, equality and numeric comparisons; variable expansion
  with bounded recursive substitutions and the supported default filter.
- Check mode uses a disposable world for file/service predictions and changes no
  target state. URI/wait_for skip in check mode unless explicitly forced read-only.
- URI GET validates known virtual HTTPS management services and returns actual
  server/info, indexes or monitor data. Unknown hosts/endpoints and stopped services
  fail. No network request occurs. wait_for checks actual virtual port/path state.
- Service/reload/bundle commands require privilege and the correct component.
  Windows hosts are explicitly unsupported by this Linux practice transport.

Not a complete Ansible/Python/Jinja implementation: no arbitrary commands, network,
plugins, dynamic inventories, unrestricted filters, block/rescue/ignore_errors or
native Windows transport. Large-fleet cohort execution and forwarder lifecycle are
subsequent work; the bounded per-host budget remains. The existing training vault
is an educational fixture, not cryptographic secret storage.

## Validation

Each lesson has solution, wrong action, no false completion, reset, resume and
isolation cases (78 cases). Focused checks cover handler order/scoping, real URI
failures, dry-run isolation, permissions/idempotency and privilege/component errors.
Starter/API checks cover conflicts, unchanged Git history, stale revisions and
lesson-swapped requests. A lesson setup directory ownership defect exposed by an
actual CLI git revert was repaired; the existing Git regression also passes.

Full regression: **712 tests / 46 files passed**. TypeScript passes. Browser AU-20
applied four changes, repeated with changed=0, and completed only after the verified
evidence answer. [Run proof](v7-automation-idempotent.png).
