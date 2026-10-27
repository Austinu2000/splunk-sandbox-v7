# V5 implementation and scope

Created October 26, 2026 from the local v4 source, in an independent directory and database. V4 was left unchanged. The original interview roadmap is preserved for traceability; this document describes the delivered runtime.

## Start, stop and persistence

```sh
cd /Users/austinu/projectsv5/splunk-sandbox
nvm use 22
npm ci                 # first setup only
npm run dev
```

Open http://127.0.0.1:5673; API: 127.0.0.1:5674. Stop with Ctrl+C in the running terminal. Starting again resumes saved progress. Both services bind to localhost. No native Splunk processes are modified, and no simulator commands execute real shell commands or outbound requests.

V5 uses `data/sandbox.db`. Training edits and Code operations checkpoint immediately. General terminal practice autosaves every two minutes, on environment switches and on graceful shutdown; use Sessions to save explicitly before a forced shutdown. Browser-only reports and dashboard artifacts remain in this origin's local storage. Lesson sessions have separate slots per learner and lesson; reset retains a backup and Return to free practice restores the profile session. Answer notes are namespaced per learner, but normal operational practice is shared within the selected environment. Save format 4 accepts earlier supported save formats; the copy did not import v4's database.

## Roadmap coverage

| Item | Delivered behavior | Boundaries |
| --- | --- | --- |
| INT-01 | Question IDs, evidence requests and follow-ups across 24 existing cases; 14 new practice incidents; separate recovery/process/explanation checklist | Explanation completeness is a transparent checklist, not a claim to assess expertise. New packs are in Interview workbench; existing cases remain under Tickets. |
| INT-02 | Monotonic action IDs, successful-outcome filtering, revision-bound pre/post inspection; maintenance must end before cluster completion | Terminal compound commands record aggregate success. |
| INT-03 | Code editor, commit graph, PR diff/comments/checks/approval/merge/deploy; protected main; isolated CI previews; Ansible execution, dry-run, handlers, serial batches, scheduled runs and training Vault | Only the documented module/expression subset executes. No real GitHub, subprocess, SSH or Ansible process. CI uses `.sandbox-ci.yml` for optional expected-diff validation. |
| INT-04 | `employee_lookup.csv`, generic `outputlookup`, overwrite/append, persisted CSV-style tables | Simulated lookup tables, not disk CSV export. |
| INT-05 | S3/SQS-style event IDs, permissions, backlog, checkpoints/deduplication, HEC request outcomes, migration cutover/rollback exercises | Synthetic IDs/configuration checks, not complete AWS object APIs or a real cloud migration. |
| INT-06 | Bounded Cribl queues, destination failure, drain, retained replay and critical-event loss guards | A small event queue model, not Cribl's full routing or storage implementation. |
| INT-07 | Bucket copies drive RF/SF; maintenance, retirement and discovery; SHC/KV sync, monitor and storage incidents; status CLI | Twelve representative buckets; SHC/KV/remote-store internals are bounded practice state. |
| INT-08 | eventstats/streamstats/chart, bounded join/append/transaction/tstats, collect summaries, macros, persisted lookups and work/result comparison | Summary snapshots do not automatically refresh. General search subqueries are rejected except supported join/append. Dashboard incident has a simplified cost model; query comparison executes real sandbox SPL. |
| INT-09 | OTel receiver/processor/exporter and resource-attribute controls, trace diagnostics; ITSI dependencies, KPI/noise exercises | Fixed synthetic topology and trace metadata, not OTLP ingestion or a full observability platform. |
| INT-10 | Enrichment, scoped detections, permissions and handoff outcome exercise alongside existing ES/SOAR cases | Synthetic events and action outcomes. |
| INT-11 | All 235 source questions, source wording flags, local answer notes, work/sandbox basis, timer and environment topology link | No personal employment answers inferred; no automatic factual evaluation. |

## Code and automation

Browser and terminal use the same repository state. Reviews and checks bind to the current head; checks also bind to the base revision. A change invalidates stale approval/checks. Deployment is a separate action and applies only the changed deployment scopes. A profile without an SHC deployer cannot deploy SHC changes. Ansible runs execute the chosen branch, and previews use a disposable world.

Optional `.sandbox-ci.yml`:

```yaml
playbook: playbooks/deploy_apps.yml
limit: idx01
expectedChangedPaths:
  - idx01:/opt/splunk/etc/system/local/outputs.conf
```

Checks run this preview in a fresh Practice Lab and reject failure or unexpected changed paths. Without this file, checks cover YAML syntax, configuration form, merge conflicts and fixture secret patterns. This is not complete Ansible semantic linting or a production secret scanner.

Supported playbook behavior includes inventory/groups, basic variables/defaults/host overrides, bounded literal loops, simple conditions, includes/roles, handlers, copy/template/file/lineinfile/blockinfile/ini_file, service/systemd, assertions, ping/debug/set_fact, wait_for/uri and explicitly allowed Splunk commands. Unsupported expressions/modules fail explicitly. Concurrent restarts are evaluated as overlapping batch unavailability against bucket copies. Large fleets are evaluated per host, so broad runs may be expensive.

The Vault fixture format is explicitly **TRAINING-ONLY reversible encoding**, not production encryption or compatible Ansible Vault. Never enter real credentials. Private-task output and failures are redacted. Native credential files are never read by simulated commands.

## Lessons

G1–G7, A1–A10 and X1–X6 retain their IDs. G/A instructions were extracted from the supplied tutorial; X entries summarize its challenge criteria. The original PDF remains authoritative. New sessions for G4/G6/G7/A7/A9/A10 seed the faults described by those exercises. They survive save/replay and resets create backups. Existing lesson slots require Reset with backup to adopt newer fixtures.

Lessons expose workflow checks, not comprehensive grading of every manual success criterion. A8's full certificate/TLS reconnect semantics and the X challenges' full custom setup/outcome checks are not implemented. Their terminal exercises use the supported simulator primitives and require manual review. The interface labels this distinction rather than marking the original Git/Ansible milestones fully complete.

## Validation

Automated coverage includes all 14 incident recovery paths with ordered evidence and save/replay; wrong/drop-all fixes; stale PR checks; dry-run nonmutation and repeat-run idempotence; unsafe commands and concurrent restarts; expected-diff CI; scheduled execution after replay; Vault roundtrip/private-error redaction; arbitrary SHC app deployment; seeded lesson faults; and independent learner/session persistence.

Final regression: **245 tests passed in 25 files**, using `npm test -- --maxWorkers=2`. TypeScript and ESLint passed. The production web build passed, retaining the pre-existing large-bundle warning. One earlier concurrent run hit the search time budget during CPU contention; the final run passed without changing search limits. Browser verification covered the incident library, successful Ansible preview, equivalent-search comparison, a seeded failing PR, lesson startup and return to free practice. [Workbench screenshot](v5-workbench.png).

## Behavior references

Model choices were checked against [Cribl persistent queue documentation](https://docs.cribl.io/stream/persistent-queues/), [AWS SQS at-least-once delivery](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/standard-queues-at-least-once-delivery.html), [OpenTelemetry Collector configuration](https://opentelemetry.io/docs/collector/configuration/) and [Ansible check-mode documentation](https://github.com/ansible/ansible-documentation/blob/devel/docs/docsite/rst/playbook_guide/playbooks_checkmode.rst). The simplified behavior above is an intentional sandbox boundary, not a claim of vendor implementation equivalence.
