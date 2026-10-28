# V7 offline integrations and service health

Milestone 8 adds record-driven AWS, Collector, Cribl, DB Connect and ITSI concept
practice. SP-083–088 passed 36 acceptance cases plus passive-grading validation.
Engine/API checks additionally cover scoped deny, transport failures, source guards,
checkpoint repair and unknown data. Full M8 regression: **1,186 tests / 73 files pass**, plus TypeScript, ESLint and
the production build (inherited bundle-size advisory only). The complete V7
expansion is still unfinished.

All endpoints, identities, objects, messages, database rows, spans and HEC tokens
are fictional and local to this simulation. Nothing opens a cloud/directory/network
connection, executes SQL/JDBC, evaluates JavaScript, starts a Collector/Cribl process
or installs an add-on. Native fields are used within the following explicit bounds.

## Shared administration and delivery

Interview workbench → Recorded integration operations opens
`#/settings/integration-operations`. An optional fixture can be added in Lab (or
Enterprise Automation Lab where supported). Initialization is idempotent and refuses
an occupied source path, including an empty existing file. It preserves other
native sources and existing adapter state. New indexes use the manager bundle.

Staging and polling pin the active environment and the reviewed source/pending
state. Unknown action fields and unauthorized principals are rejected before writes.
AWS and database inputs read native running configuration; restart the virtual
host to activate source changes. Collector/Cribl adapter activation is explicit.
Actual delivery uses the same recorded ingestion or virtual HEC service used by
other Web/CLI workflows. Event IDs and failures are retained with the source state.
AWS/database numeric polling intervals also run on simulated ticks. Collector and
Cribl use an explicit offline poll/flush, not autonomous real daemons.

## AWS SQS-based S3

The input uses `aws_sqs_based_s3://v7_vpcflow`, `aws_account`, queue URL/region,
batch size, `s3_file_decoder=CloudWatchLogs`, interval, index and sourcetype. The
fictional account alias represents an already-configured training account; no real
AWS credential file or add-on account configuration is created.

Two explicit plain JSON objects contain three CloudWatch logEvents messages with
14-field VPC records. Native search-time extraction exposes actual VPC fields.
A separate resource file accepts a bounded native IAM JSON document: Version,
Statement, Sid, Effect, Action and Resource. Only the supplied SQS operations and
S3 GetObject on the fixed fictional resources are supported. Explicit Deny wins;
scoped object-resource wildcards are checked per object. Conditions, cross-account
policies and full IAM evaluation are outside scope.

Queue messages are acknowledged only after accepted delivery or an existing
object-version checkpoint. A partially delivered queue retains unaccepted objects;
repair continues without replaying prior versions. Compression, real AWS/SQS/S3,
CloudWatch envelope variations and arbitrary add-on inputs are not implemented.

## OpenTelemetry to virtual HEC

Collector YAML requires defined OTLP receiver, optional batch processor and HEC
exporter components referenced by `service.pipelines.logs`/`traces`. Each signal
uses one defined matching exporter and a supplied virtual HEC token. The canonical
fictional endpoint is `https://hec.practice.invalid:8088/services/collector`.

Two explicit normalized root/child spans and a log share real recorded trace/span
IDs. A missing signal pipeline keeps that signal pending. Effective HEC availability,
token, index allow-list and delivery path still gate acceptance. Successful records
leave pending state, so retry does not duplicate them. Trace/log correlation is
queryable in the recorded `traces` and `app_logs` event indexes.

This does not emulate OTLP/protobuf, batch timers, exporter retry timing, arbitrary
processors, metrics, profiling or an APM backend. Normalized fixture fields are a
teaching representation, not a claim of full native span wire-format parity.

## Cribl routes and persisted backpressure

A bounded native `routes.yml` subset supports id/name, disabled, filter, output,
final and `pipeline=passthru`. Predicates are true/false or one quoted scalar
`===`/`!==` comparison. They are parsed, never evaluated as JavaScript. Final routes
stop following routes; nonfinal routes can continue. Supported outputs are the
explicit `devnull` and fictional `splunk_out` HEC destination.

The separate destination availability/token file and pending queue are teaching
controls, not native Cribl destination/PQ configuration files. Failed output retains
pending records. Successful deliveries are deduplicated per source/destination;
this is an explicit teaching guarantee rather than every native cloning scenario.
The exercise drops only debug noise and verifies that both operational records
actually reach Search. Pending records, drops and failures survive save/replay.

## DB Connect rising input

Native `db_inputs.conf` uses `mode=rising`, a supplied fictional connection, query,
`tail_rising_column_name/number`, checkpoint_key, interval, index and sourcetype.
The bounded query accepts only the supplied id/service/status table projection,
a numeric `id > ?` checkpoint predicate and ascending id order. Arbitrary SQL,
JDBC drivers, real database connections, cron intervals and timestamp checkpoints
are not implemented.

The actual checkpoint lives in KV collection
`splunk_app_db_connect/dbx_db_input` on the selected search head. DB Connect has
used the dbx_db_input collection since 3.10; the practice document's checkpoint
field is an explicit teaching payload, not a vendor-internal serialization claim.
Unavailable/read-only/stale KV state blocks a poll. An accepted batch is retained
before a checkpoint update: a schema/write failure can be repaired and retried
without duplicating the accepted events. New uniquely rising source rows are then
read and advance the real virtual KV checkpoint. Fixture rows are capped at 1,000.

## Service KPIs and dependencies

Interview workbench → Recorded service health opens `#/settings/service-health`.
Its JSON schema is a teaching service model, not a native ITSI service export.
Actual read-only source searches and virtual service availability determine KPI
values. Queries have a deterministic scan budget; missing/failed/truncated data
stays unknown rather than becoming healthy zero.

The model uses three contribution levels: healthy 100, warning/medium 50 and
critical 0. It applies weighted own and impacting KPI contributions, importance 0
exclusion and importance 11 critical override. A listed dependency selects all
KPIs from that service; full per-KPI dependency selection, entity splits and native
threshold-label ranges are outside this bounded format. The child's aggregate
health score is not directly substituted for selected KPI contributions. Cycles
and missing dependencies are rejected.

Evaluations retain actual values, scanned source counts, active model revision,
configuration/input revision, own score and dependency impact. New lesson checks
require fresh current-source evidence and retain the original actual failure.
Recovery uses accepted healthy source records after the old error window, or an
actual virtual service restart. No independent healthy/unhealthy toggle is used.

Save schema 14 retains adapters and health evidence while loading versions 1–13.
Passive grading does not poll sources, build KPIs, acknowledge messages, change KV
checkpoints or create indexed events.

## Primary references

- [AWS add-on SQS-based S3](https://splunk.github.io/splunk-add-on-for-amazon-web-services/SQS-basedS3/).
- [AWS IAM policy elements](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements.html).
- [Collector configuration](https://opentelemetry.io/docs/collector/configuration/).
- [Official HEC exporter](https://github.com/open-telemetry/opentelemetry-collector-contrib/blob/main/exporter/splunkhecexporter/README.md).
- [Cribl routes](https://docs.cribl.io/stream/routes/).
- [DB Connect 4.3 native input spec](https://help.splunk.com/en/data-management/connect-relational-databases/deploy-and-use-db-connect/4.3/reference/db_inputs.conf.spec).
- [DB Connect rising inputs and KV checkpoint storage](https://help.splunk.com/en/data-management/connect-relational-databases/deploy-and-use-db-connect/4.1/configure-and-manage-splunk-db-connect/create-and-manage-database-inputs).
- [ITSI 4.20 KPI importance](https://help.splunk.com/en/splunk-it-service-intelligence/splunk-it-service-intelligence/visualize-and-assess-service-health/4.20/create-kpis/set-kpi-importance-values-in-itsi).

These component/add-on versions are separate from the simulated Enterprise release.
Research used Agent Reach Exa and direct official references after Exa's quota was
reached; no new API key or account configuration was requested or changed.

## Browser evidence

SP-085 met its workflow checks with actual critical-event deliveries, debug-only
discard, safe repeat poll and independent inspected count=2:
[delivery receipts](v7-integration-recovery.png). SP-088 showed checkout’s own KPI
score 100 reduced to 80 by a real stopped indexer’s contribution, then returned to
100 after that virtual service started: [impact](v7-service-impact.png),
[recovery](v7-service-recovery.png). Independent inspection confirmed three source
records. Verification attempts are separate and saved; prior free practice is
restored.
