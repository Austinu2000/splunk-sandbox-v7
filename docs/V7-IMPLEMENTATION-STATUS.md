# V7 implementation status

Started October 27, 2026 from V6 `main` at `a9d4237`.

## Current release: frozen at 169 lessons; audit complete

The user paused remaining lesson implementation. The authoritative current result
is the [frozen-release audit](V7-FROZEN-RELEASE-AUDIT.md): 142 new plus 27 inherited
lessons, eight deferred capstones, all 235 interview questions individually reviewed,
and 1,310 passing tests across 78 files. Entries below retain earlier checkpoint
history; counts and pending-work notes in those entries are historical.

## Original Milestone 0 foundation

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
| 8 | Implemented within documented scope | Monitoring/security/integrations; SP-069–088 |
| 9 | Implemented within documented scope | Upgrades/recovery; AU-44–50 and SP-089–092 |
| 10 | Deferred at user request | APL/Erie capstones; SP-093–100 |
| 11 | Complete for the user-frozen scope; original all-150 gate deferred | 169 available lessons, question audit and regression |

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

## M8 monitoring and recorded security checkpoint (12/20 lessons)

- SP-069–080 passed **72 acceptance checks** and are available: **123 new / 150
  total lessons**. All inherited lessons remain. Eight M8 lessons, 19 later new
  lessons and the final audit remain; the expansion is still incomplete.
- Notable actions consume actual canonical alert results and persist indexed
  evidence. Failed destination delivery remains retryable; suppression follows
  successful creation. Investigation notes and offline response attempts retain
  their sources, failures and one stable fictional ticket per notable.
- Search exposes a practice principal for permission testing. Monitoring Console
  now shows actual opt-in queue occupancy and accepted/delivered records.
- Full regression: **1,122 tests across 65 files passed**, with TypeScript, ESLint
  and the production web build passing. Existing bundle-size advisory remains.
- Browser verified SP-080's workflow outcomes from the original failed response
  through repair, ticket creation, idempotent retry and investigation assignment.
  The saved Lab free-practice world was restored.
- [Supported behavior and limits](V7-RECORDED-SECURITY-OPERATIONS.md);
  [UI proof](v7-security-response.png). Continuing to identity/security and the
  remaining cloud, telemetry, routing, database and service-health exercises.

## M8 identity and security checkpoint (14/20 lessons)

- SP-081/082 passed twelve acceptance cases, plus passive stale-proof validation.
  Learn now contains **125 new / 152 total lessons**. Six M8 lessons and nineteen
  later new lessons remain, along with the final audit.
- Native active SAML/LDAP source drives bounded fictional identity probes; mapped
  roles use the existing authorization engine and actual recorded-row visibility.
  No IdP, directory connection, cryptographic verification or browser login occurs.
- Search evidence retains host/principal, and TLS canary/security outcomes require
  actual delivery, active verification and restricted permissions.
- The combined focused gate passed **97 tests**; TypeScript, ESLint and the
  production web build passed (existing bundle-size advisory remains).
  The previous full regression of 1,122 tests predates this identity checkpoint;
  the next complete M8 gate will include the additional identity checks.
- Browser SP-081 met its workflow checks through actual staging, virtual restart,
  both identity probes and an inspected analyst count=3 search.
- [Scope and limits](V7-IDENTITY-PRACTICE.md); [proof](v7-identity-probes.png).

## M8 complete: monitoring, security, ingestion and service health

- SP-069–088 passed **120 lesson acceptance cases**. Learn contains **131 new /
  158 total lessons**. All 27 inherited IDs remain. Nineteen new lessons and the
  final coverage/regression audit remain; V7 as a whole is not complete.
- AWS native input/IAM subset, enabled Collector signal pipelines, bounded Cribl
  routes/backpressure and DB rising inputs/KV checkpoints deliver actual recorded
  events, retaining failures and safe retry state.
- Service KPIs use actual queries/services, weighted contributions and importance
  0/11 behavior. The explicit teaching schema selects all KPIs from listed
  dependencies; unknown data cannot silently become a healthy zero.
- Full regression passed **1,186 tests across 73 files**. TypeScript, ESLint and
  production build passed. The inherited bundle-size advisory remains.
- Browser SP-085 verified two actual deliveries, debug-only discard, no duplicate
  retry and inspected count=2. SP-088 verified own application score 100 with
  dependency-reduced checkout score 80, followed by score 100 after starting the
  actual virtual idx02 service; an independent inspected query returned count=3.
- Separate V7 verification attempts are saved; existing Lab free practice is
  restored after checks. [Delivery proof](v7-integration-recovery.png),
  [impact](v7-service-impact.png), [recovery](v7-service-recovery.png).
- Supported fields, component versions, simulation boundaries and primary sources:
  [integration operations](V7-INTEGRATION-OPERATIONS.md). Save schema 14 retains
  adapters/KPIs and loads versions 1–13.
- Continuing directly to M9 upgrades/recovery and M10 capstones, then M11's final
  lesson/question audit, dependency/security review and complete regression.

## Milestone 9 foundation in progress

Upgrade/recovery primitives and a maintenance page are under validation. They
include verified configuration archives, actual virtual package versions and
service state, ordered single-host upgrade phases, retained pause/resume/abort,
separate KV data backup prerequisites, and virtual checksum/extraction commands.
See [the implementation and its limits](V7-UPGRADE-AND-RECOVERY.md).

This foundation does **not** promote additional lessons or complete Milestone 9.
Learn remains **158/177**; AU-44–50, SP-089–092, the eight capstones and the final
question/curriculum audit remain outstanding.

Foundation validation: **1,196 tests / 75 files** passed in the full regression;
subsequent maintenance/shell/cluster/privilege refinements passed 46 focused tests.
TypeScript, ESLint and the web build pass, with the inherited bundle advisory.
The browser verified hf01 at 9.4.2 in a separate learner attempt and returned to
the original Lab free-practice session. [Upgrade proof](v7-maintenance-upgrade.png).

## Graded maintenance exercises available; Milestone 9 continues

SP-089–092 are now promoted after 24 solution/failure/reset/resume/isolation
acceptance cases, four passive-grading checks and a malformed-metadata recovery
check. Learn contains **135 new / 162 total** exercises. AU-44–50, SP-093–100 and
Milestone 11's question/curriculum audit remain outstanding.

The exercises grade the current six-host upgrade preflight, actual standalone
package completion, configuration-only recovery with a failed-change safety
archive, and ordered certificate rotation with active verification and unique
canary delivery. Related forwarder/identity/curriculum regression: **146 tests
passed**. The full regression passed **1,229 tests / 76 files**; no Milestone 9
completion claim is made.

Browser SP-092 proof: recovered old certificate, overlap trust, new issuer and
new-only trust all retained their actual activation outcomes; Search/Job Inspector
verified four distinct canaries. Learn showed all checks and **Lesson complete**,
then returned to the original free practice. See [activation evidence](v7-certificate-rotation.png)
and [completed lesson](v7-maintenance-lesson-complete.png). Verified V7 lessons
now say they are complete when all scored outcomes pass; inherited manual lessons
retain their separate workflow-only wording.


## User-requested scope freeze

The user paused remaining lesson implementation and authorized the final coverage
and regression audit of the existing build. AU-44–50 had passed acceptance tests
and were already added before this instruction. The frozen catalog contains
**142 new + 27 inherited = 169 lessons**. SP-093–100 remain planned, unregistered
and deferred; no further lesson or capstone implementation is part of this audit.

The original Milestone 11 requirement to finish all 150 new lessons is therefore
not claimed. The current audit covers the frozen 169-lesson release, all 235 source
questions (including partial, personal-experience and unsupported areas), saved
attempts/isolation, dependencies and secrets, and final regression.

## Frozen-release final validation

Milestone 9 is complete within its documented scope. AU-44–50 were already added
before the freeze; 42 acceptance cases plus passive and focused checks passed.
No further lessons were implemented after the user paused development. The browser
verified AU-48 repair, retained pause/resume history, all six target versions,
independent search/Job Inspector evidence and scored completion, then restored
free practice. Earlier SP-092 browser verification remains recorded above.

The final patched-dependency regression passed **1,310 tests / 78 files** with no
failed, skipped or pending tests. All **852** required new-lesson acceptance
assertions and **27** inherited start/resume/reset/isolation checks were matched
to actual passed results by the release evidence gate. A negative report with a
missing acceptance result was correctly rejected. The actual API also rejects all
eight deferred capstones. TypeScript, ESLint and the production web build pass;
no test budget or bundle warning limit was relaxed.

The individual question audit classifies **36 verified-practice, 87 partial,
15 conceptual-only, 15 not implemented and 82 personal-response questions**.
All 235 IDs/wordings remain intact. Reviewed does not mean functionally covered.

Known dependency advisories were fixed (Vitest 4.1.12, Zod 4.6.7, ECharts 6.1.0);
the root/workspace audit reports zero known vulnerabilities. Redacted source and
history scans have seven reviewed nonsecret matches each. Personal attribution
in inherited documents/defaults and Git metadata remains documented, not erased.

See the [full coverage and limitation report](V7-FROZEN-RELEASE-AUDIT.md),
[question review](V7-INTERVIEW-COVERAGE-AUDIT.md) and
[passed fixture evidence](V7-RELEASE-TEST-EVIDENCE.json). The complete original
150-new-lesson expansion remains unfinished under the current scope freeze;
SP-093–100 are not executable. V7 remains separate from V6 and no push occurred.

## GitHub publication — October 28, 2026

At the user's request, the audited V7 build is published to the private
[Austinu2000/splunk-sandbox-v7 repository](https://github.com/Austinu2000/splunk-sandbox-v7),
using branch `v7`. The local `origin` points to this repository and the branch tracks
`origin/v7`. The audited implementation checkpoint is `6988fee`; this publication
adds documentation of the destination without changing application code. The
169-lesson freeze and eight deferred capstones remain in effect. Saved sessions,
the local SQLite database and environment files remain ignored and are not uploaded.
V6's repository and branch are unchanged.
