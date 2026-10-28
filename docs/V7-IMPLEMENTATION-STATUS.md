# V7 implementation status

Started October 27, 2026 from V6 `main` at `a9d4237`.

## Current work: Milestone 8 and subsequent gates

Implemented:

- Independent V7 checkout on branch `v7`, no GitHub push remote; V6 source untouched.
- Separate installed dependencies, ports 5873/5874, database and browser origin.
- Consistent SQLite online backup from a read-only V6 connection: four saved rows,
  including both existing learner attempts, copied without resetting IDs or notes.
- A separate pre-change session backup and bare Git baseline in `../backups/`.
- V7 labels in the application; inherited functionality remains available.
- Audit of UI practice settings, operational state, knowledge objects and schedules.
- Shared knowledge types and proposed operational contracts.
- Pure lossless migration preview with invalid-record and conflict reporting; no
  operational cutover or accidental activation of old drafts/schedules.
- Read-only current-world migration preflight endpoint.
- Strict versioned lesson authoring contract and capability/test readiness gate.
- Planning manifests for 100 SP and 50 AU IDs and all 235 interview question IDs.
  No candidate mapping is counted as verified functional coverage.
- Architecture, staged migration design, capability boundaries and milestone docs.

At the original Milestone 0 gate, no new exercises were executable. Subsequent
implemented work is listed below. The full expansion remains incomplete.

## Ongoing foundation implementation

- Automation Operations now exposes all five required tabs, backed by the actual
  virtual working tree, inventory resolver and committed playbook engine.
- Shared inventory supports graph/list/host, variable precedence, host targeting,
  configuration discovery and drift. Ansible playbooks use the same target resolver.
- AU-01–AU-14 and SP-001–SP-005 are executable in Learn (19 new lessons, 46 total).
  Each has solution, incorrect-action, no-false-completion, reset, resume and
  isolation tests. Answer keys and fixture details are kept out of Learn responses.
- Permissions changes on newly created virtual files now journal correctly; the
  lesson resume tests exposed and fixed a pre-existing chmod/chown replay bug.
- Foundation regression: **407 tests across 35 files passed**, along with TypeScript,
  ESLint and the web build. Browser target preview returned idx01/idx02 for
  `indexers:!idx03`; the Learn catalog shows the new exercises.
- SP-006 remains in development until Splunk role/index authorization is connected
  to the upcoming shared index administration engine. No full Milestone 1 claim yet.
- The original AU source was unavailable; the 14 individual objectives are explicit
  refinements of the accepted ranges, not claimed as verbatim original lessons.

## Review sequence

| Gate | Status | Deliverable |
| --- | --- | --- |
| 0 | Implemented; validation below | Architecture/persistence audit and safe preflight |
| 1 | Implemented | Foundations/inventory; AU-01–14 and SP-001–006 |
| 2 | Implemented | Indexes/data onboarding; SP-007–025 |
| 3 | Implemented within documented scope | Reports/searches/summary indexing; SP-035–046 |
| 4 | Implemented within documented scope | Playbooks/Git; AU-15–27 |
| 5 | Implemented within documented scope | Forwarders/DS; AU-28–35 and SP-026–034 |
| 6 | Implemented within documented scope | Dashboards/alerts; SP-047–054 |
| 7 | Implemented within documented scope | Clustering/KV; AU-36–43 and SP-055–068 |
| 8 | In progress | Monitoring/security/integrations; SP-069–088 |
| 9 | Planned | Upgrades/recovery; AU-44–50 and SP-089–092 |
| 10 | Planned | APL/Erie capstones; SP-093–100 |
| 11 | Planned | Curriculum/question audit and complete regression |

The brief reserves 150 new lessons but supplies AU titles/objectives only by track.
Reconcile the earlier individual 50-lesson source before authoring AU definitions.

## Local start

From the V7 project folder, run `nvm use 22` and `npm run dev`. Open
<http://127.0.0.1:5873>. Stop with Ctrl+C. V6 remains at
<http://127.0.0.1:5773>. The local folders are siblings under `projectsv6` and
`projectsv7`; never point V7's `SANDBOX_DB` at a V6 database.

The copy includes the last persisted V6 data at snapshot time. Changes made later
in V6 are independent. The V7 pre-change backup is not automatically overwritten.
Browser-only data on another origin is outside the database snapshot and is not
silently imported. No API keys or `.env` files were copied into V7.

## Validation

- **284 tests passed across 32 files**: the full 282-test regression plus two
  subsequently added curriculum/coverage audit tests. No test failures.
- Workspace TypeScript checks, ESLint and the production web build passed. The
  existing large-bundle advisory remains; no new build failure was introduced.
- Browser verification: V7 environment labels, copied A1 attempt and workflow
  status, return to the isolated free-practice session, virtual SSH/Git/inventory
  commands and inherited KV Store status/records. Inventory output retains its
  documented V6 YAML-only limitation until Milestone 1.
- The migration endpoint returned 14 preserved knowledge candidates in the copied
  Lab free-practice world, with no operational cutover. It did not modify records.
- SQLite backup integrity checks returned `ok` for both copies. V6 source remains
  clean at the baseline commit, and both versions' health endpoints returned 200.
- UI proof: [V7 inherited KV Store](v7-milestone0.png).

## Continuous implementation authorization

On October 27, 2026 the user explicitly revoked per-milestone review stops and
authorized continuing through the remaining build list. Keep validation gates and
honest delivered/planned status; no review pause is required between milestones.

## Indexes and onboarding implementation

- SP-006–SP-025 now execute real index, input, parsing, access and lifecycle tasks.
  Learn contains **39 new exercises / 66 total**, preserving the original 27.
- Standalone Web/CLI/simulated REST share one configuration service; cluster peers
  require the manager bundle. Recorded data follows active inputs and routing.
- HEC tokens, monitor checkpoints, timestamp/line parsing, search-time extractions,
  bucket retention/archive/thaw and practice-principal permissions are implemented
  within [documented limits](V7-INDEXES-AND-INPUTS.md).
- 120 new lesson acceptance cases pass, plus 14 focused engine checks and the
  shared API persistence/input test. The profile regression exposed and fixed
  a generated self-inheriting role; all 36 profile tests now pass.
- Browser verified Web index creation, empty-index completion, explicit two-line
  upload and the two actual search events. Proof: [search](v7-ingested-search.png).
- Full regression: **542 tests across 40 files pass**, with TypeScript and ESLint
  passing.
- Save schema 6 journals new inputs/events/lifecycle operations; older saves still
  load. Existing knowledge-object migration remains pending in Milestone 3.

The earlier foundation note about SP-006 being pending is superseded by this gate.

## Reports and summary implementation

- SP-035–SP-046 are executable: **51 new exercises / 78 total** with all 27
  inherited entries retained. Each new report lesson has six acceptance cases.
- Reports, Search Save As Report, native configuration and simulated REST share
  scoped files, ownership metadata, revisions and activation. Stale-tab context
  checks prevent writes after an environment or lesson swap.
- Scheduled execution retains actual results, windows, failures/skips and summary
  event IDs. Summary data is persisted and searchable over its index retention;
  overlapping writes and failed source searches do not create duplicate data.
- Reviewed legacy import preserves original raw data, keeps schedules off and
  records idempotent receipts and an archived source. Alert/dashboard migration
  remains for later milestones.
- Full regression: **627 tests across 43 files pass**. TypeScript, ESLint and the
  production web build pass; the inherited bundle-size advisory remains.
  No full-expansion completion claim is made.
- Browser validation completed SP-045: two summary rows representing three events,
  followed by an empty window with no duplicates; independent sum(count)=3.
- See [supported report behavior and remaining limits](V7-REPORTS-AND-SUMMARY-INDEXING.md).

## Ansible and change management implementation

- AU-15–AU-27 are executable: **64 new / 91 total lessons**. Original lesson IDs
  and seed Git commits are retained. Starter additions are explicit source changes.
- Handlers, roles, variables, permissions, check mode, URI/wait_for and component
  privileges now produce actual shared-world outcomes. Reviews, CI and rollback
  are bound to source revisions and separate deployment.
- Full regression: **712 tests / 46 files pass**, including 78 lesson acceptance
  cases. TypeScript passes. Browser AU-20 verified changed=4 followed by changed=0
  and completed. [Scope and limits](V7-ANSIBLE-AND-CHANGE-MANAGEMENT.md).
- Continuing into forwarder lifecycle and Deployment Server work without an
  approval pause, as authorized. The full expansion remains incomplete.

## Forwarder and Deployment Server implementation

- AU-28–AU-35 and SP-026–SP-034 are executable: **81 new / 108 total lessons**.
- Package/version/service state, staged DS apps, publication, phone-home, download
  and activation now share actual configuration across Web, CLI and automation.
  Windows teaching records and certificate relationships have bounded functional
  behavior documented in [scope and limits](V7-FORWARDER-OPERATIONS.md).
- Full regression: **822 tests / 49 files pass**. Fleet comparisons are cached,
  and test concurrency is bounded to three workers to keep CPU time budgets
  meaningful on a local workstation. Assertions and search budgets remain intact.
- Browser SP-028 verified publication, delayed client delivery, selected-client
  activation, an unchanged nonselected client and two actual searchable canary
  records. Proof: [delivery](v7-forwarder-delivery.png), [search](v7-forwarder-search.png).
- TypeScript, ESLint and the production web build pass; the existing bundle-size
  advisory remains.
- A failed oversized catalog is rejected before a restart stops the healthy DS.
- Continuing directly into canonical dashboard views and result-driven alerts.
  The complete V7 expansion remains unfinished.

## Dashboards and alerts implementation

- SP-047–SP-054 are executable: **89 new / 116 total lessons**. Canonical Classic
  and Studio views, actual panel searches/input filtering, metadata sharing and
  saved-search alert execution now share active configuration and persistence.
- Scheduled failures, unmatched conditions, triggers and suppression have distinct
  actual receipts. Actions create local simulation notifications/audit only.
- Full regression: **880 tests / 52 files pass**, including 48 lesson outcome
  cases and 10 engine/API checks. The browser completed Studio SP-048 with two
  filtered results and correct evidence. SP-051 also completed through Web alert
  creation, two scheduled windows, two triggers and two suppressed repeats.
- TypeScript, ESLint and the production web build pass; the existing bundle-size
  advisory remains. [Scope and limits](V7-DASHBOARDS-AND-ALERTS.md).
- Continuing directly into clustering/KV Store and automation; the full expansion
  remains unfinished.

## Cluster, SHC and KV implementation

- AU-36–43 and SP-055–068 passed **132 acceptance cases** before promotion into
  Learn: **111 new / 138 total lessons**, retaining all 27 inherited IDs.
- Running cluster membership, RF/SF, per-bucket site placement, controlled restart
  jobs, current-artifact bundle validation and actual recorded-data search failover
  now share the existing world and virtual files.
- SHC captain elections, phased Deployer default distribution and canonical runtime
  object replication are separate from KV Store primary and replica behavior.
- SmartStore remote metadata, local cache eviction/fetch and outage behavior act on
  actual recorded buckets. No cloud credentials or external services are used.
- A separate optional Enterprise Automation Lab v1 provides six indexers across
  two sites, three SHC members, a Deployer and Ansible workspace. Existing profile
  topology and saved worlds are preserved.
- Focused API tests cover stale revision/context rejection, privileges, phased save
  recovery and independent profile persistence. Full regression and browser gate
  are underway; no full-expansion completion claim is made.
- Supported behavior and explicit limits: [cluster and KV operations](V7-CLUSTER-AND-KV-OPERATIONS.md).

- The full regression passed **1,031 tests across 57 files**, with TypeScript,
  ESLint and the web production build passing. The existing bundle-size advisory
  remains. An additional passive-grading test and recorded-data inspector counter
  correction are being checked before the checkpoint.
- Browser proof: [SHC recovery with separate captain/primary](v7-shc-election.png)
  and [actual SmartStore eviction/fetch](v7-smartstore-fetch.png). SP-060 met its
  workflow checks from the actual Search/Inspector path; free practice is restored
  after verification.

- Final M7 regression including the recorded-source inspector correction: **1,032
  tests / 57 files passed**. The subsequently added launch-environment return
  check also passes, alongside the existing Learn/session isolation tests (7
  focused API checks). TypeScript and ESLint pass.
- Returning from a lesson now restores the saved environment that launched it,
  including resumed attempts and optional Enterprise Lab sessions. Older attempts
  without that field retain their prior profile-based return behavior.
- Continuing into M8 monitoring/security/integration work without a review stop.
  The 39 remaining AU/SP lessons and final coverage audit are still outstanding.

## M8 foundation checkpoint (milestone still in progress)

- Actual service/input/storage observations, persisted ingestion queues and native
  search-time aliases/evaluations/tags now support recorded-data investigations.
- Native data-model JSON and acceleration settings create stored row snapshots;
  tstats uses coverage, source revisions and index permissions. Settings provides
  staging, rebuild evidence and a dispatch-host-scoped Search link.
- Full regression: **1,045 tests / 62 files pass**. TypeScript, ESLint and the
  production build pass. Browser verified a three-event snapshot and count=3.
- Learn remains **138/177**; no M8 lesson has been promoted yet. Security response,
  integration delivery, KPI work and M8 lesson acceptance checks remain. See
  [M8 working record](V7-M8-WORKING-NOTES.md) for scope and primary references.
