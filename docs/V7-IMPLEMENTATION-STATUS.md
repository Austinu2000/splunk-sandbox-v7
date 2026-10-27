# V7 implementation status

Started October 27, 2026 from V6 `main` at `a9d4237`.

## Current work: Milestone 4 and subsequent gates

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
| 4 | In progress | Playbooks/Git; AU-15–27 |
| 5 | Planned | Forwarders/DS; AU-28–35 and SP-026–034 |
| 6 | Planned | Dashboards/alerts; SP-047–054 |
| 7 | Planned | Clustering/KV; AU-36–43 and SP-055–068 |
| 8 | Planned | Monitoring/security/integrations; SP-069–088 |
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
