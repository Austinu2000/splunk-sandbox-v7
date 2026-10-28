# Milestone 8 working record

M8 remains in progress. SP-069–082 passed 84 acceptance cases and are now available.
Learn contains 125 new + 27 inherited = **152/177 lessons**. SP-083–088 and
Milestones 9–11 remain; **25 new lessons** and the final audit are outstanding.
The user authorized continuing without approval gates.

## Foundation currently implemented

- Platform observations read actual services, input status/checkpoints, recorded
  bucket bytes/stages and canonical scheduler receipts. Evidence persists separately
  from health; there are no independent health toggle values in this new view.
- Monitoring Console cache also keys on mutation revision, so a paused clock does
  not hide a service/configuration change. A panel is added to the existing MC home.
- Actual input/HEC bytes participate in license status and native usage-log minute
  rows; summary-derived records are exempt. The generated baseline remains intact.
- Explicitly registered recorded input paths can buffer parsed records. Native
  active limits.conf [thruput] maxKBps drains a real bounded queue; staged changes
  require activation. Source checkpoints advance only when the buffer accepts the
  batch. Full queues reject atomically and retain unread source for retry. Pending
  records, byte credit, high-water values and delivery receipts survive replay.
- Search-time FIELDALIAS, EVAL, eventtypes and tags apply to actual recorded data.
  Canonical report/dashboard searches use their dispatch host's running knowledge.
- Native JSON root event datasets and datamodels.conf acceleration produce actual
  stored row snapshots. tstats reads compatible snapshots, filters by coverage and
  current index permissions, or scans the actual source when necessary. Work counts
  include nested source work. Native cron and bounded auto_summary_perc capacity
  produce completed/failed/skipped build receipts. This does not create .tsidx files.
- Settings → Data models stages source; restart activates it. Rebuild and a scoped
  Search link are provided. Only one BaseEvent root dataset per model is supported;
  arbitrary model calculations/hierarchies and full CIM parity are not claimed.
- Search exposes dispatch host and pins a world context. Legacy API reads remain
  available, but write-capable SPL requires a current context. Retained drafts cannot
  write after an environment/lesson swap. Existing legacy tstats datasets remain.
- Save schema 10 adds platform, buffer and model runtime, retaining versions 1–9.
- Service runtime hooks have an independent registration module to prevent module
  initialization cycles when automatic acceleration calls the shared search engine.

Focused tests cover these behaviors and malformed source rejection. The initial
foundation full regression passed **1,045 tests across 62 files**, with TypeScript
ESLint and the production web build passing. Browser QA verified native staging,
restart activation, a three-row acceleration snapshot and a scoped tstats search
returning count=3. The separate verification attempt was saved and the existing
Lab free-practice world restored. Proof: [snapshot](v7-data-model-snapshot.png) and
[search](v7-data-model-search.png). The inherited bundle-size advisory remains.
This is a foundation checkpoint, not an M8 completion claim.

## Remaining M8 implementation

1. Continue source/context edge cases as additional M8 features are integrated.
2. Completed at this checkpoint: actual record-driven detection/notable and response/ticket receipts.
   Do not count the inherited security toggle resource or canned baseline notable
   log as a new ES detection. Drive outcomes from completed canonical searches.
   Preserve suppression/action-failure semantics and scoped access.
3. Bridge bounded AWS/SQS/S3, OpenTelemetry, Cribl and DB Connect practice to actual
   recorded events and retained delivery/checkpoint evidence. Keep all network,
   credentials, queries and external programs simulated. Reuse the old simplified
   resources where useful, but do not grade a checkbox as actual data delivery.
4. Derive ITSI practice KPIs/dependencies/health from actual queries and evidence.
5. Add strict setup/check contracts and six acceptance cases per SP-069–088. Keep
   drafts outside Learn until they pass. Use the original titles/ranges in the spec.
6. Finish M8 documentation, regression and browser proof; continue to M9–M11.

Likely lesson reuse: SP-069 services/MC, SP-070 actual buffer/throttle, SP-071 input
path/checkpoint, SP-072 actual license bytes, SP-073 lifecycle/storage, SP-074 real
scheduler skips/cron staggering, SP-075 actual logs/audit receipts, SP-076 measured
query/dashboard work. SP-077/078 use recorded CIM fields and acceleration above.
SP-079/080 now use actual detection and response receipts; SP-081–088 still need identity/security and integration/KPI work.

## Research already checked

Agent Reach Exa supplied primary references; web search supplemented exact native
settings and release-specific details. Only official vendor sources are used.

- [Splunk 9.4 data-model acceleration](https://help.splunk.com/en/splunk-enterprise/manage-knowledge-objects/knowledge-management-manual/9.4/use-data-summaries-to-accelerate-searches/accelerate-data-models)
- [Splunk knowledge REST endpoints, 9.4](https://help.splunk.com/en/splunk-enterprise/rest-api-reference/9.4/knowledge-endpoints/knowledge-endpoint-descriptions)
- [CIM Authentication fields, add-on 6.1](https://help.splunk.com/en/splunk-enterprise/common-information-model/6.1/data-models/authentication)
- [AWS SQS-based S3 native settings](https://splunk.github.io/splunk-add-on-for-amazon-web-services/SQS-basedS3/)
- [OpenTelemetry Collector configuration](https://opentelemetry.io/docs/collector/configuration/)
- [Cribl routes](https://docs.cribl.io/stream/routes/)
- [DB Connect 4.1 rising inputs](https://help.splunk.com/en/data-management/connect-relational-databases/deploy-and-use-db-connect/4.1/configure-and-manage-splunk-db-connect/create-and-manage-database-inputs)

Important verified distinctions: Collector components must be enabled in service
pipelines; Cribl final routes stop further routing; S3 ingestion needs notifications
and queue/object permissions. DB Connect rising inputs use a checkpoint placeholder
and ordered query; since 3.10.0 DB Connect stores checkpoints in KV collection
`dbx_db_input`. These add-on/product versions are separate from Enterprise 9.4.1.
No add-on installation, native JDBC execution, cloud connection or real secret is
implied. Any new adapter-only settings must be clearly labeled teaching controls.

## Recorded security and first M8 lesson gate

See [recorded operations](V7-RECORDED-SECURITY-OPERATIONS.md). Five focused engine/API
checks passed alongside existing report/context tests. Browser verified SP-080
workflow outcomes with one ticket across response retries. Save schema 11 retains
security state and loads versions 1–10. The full regression passed **1,122 tests / 65 files**, plus TypeScript,
ESLint and the production web build after the 12-lesson promotion; no M8 completion claim is made.

## Identity checkpoint

SP-081/082 and a passive stale-proof check pass. Native source and fictional
identity probes share the role engine and actual bucket visibility. Combined
focused gate: 97 tests; TypeScript and ESLint pass. Browser SP-081 verified both
methods and inspected analyst count=3. [Details](V7-IDENTITY-PRACTICE.md).
