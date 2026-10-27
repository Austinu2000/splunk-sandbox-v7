# V7 indexes, inputs and recorded teaching data

Implemented in Milestone 2. Settings → Indexes, supported native index CLI,
simulated management REST and SPL `rest` read/write the same virtual configuration.
The active catalog comes from running `indexes.conf`; disk changes remain visible
as staged configuration. New indexes are empty until an explicit source supplies data.

Standalone creation activates online. Paths, datatype, replication, disabled state
and archive-directory changes require restart. Raw file edits require restart.
Cluster peers reject direct creation: use manager-apps definitions, validation and
an applied bundle. Clustered definitions require `repFactor=auto`. The supported
settings are paths, datatype, retention/size, disabled, repFactor, maxHotIdleSecs,
maxWarmDBCount and coldToFrozenDir. Unsupported Web/REST flags fail explicitly.
Empty custom indexes can be deleted; shipped or populated indexes are protected.
This workflow does not delete indexed data.

Practice principals simulate admin/operator/analyst roles. `authorize.conf` controls
capabilities and allowed/default/disallowed search indexes. This local application
has no real authentication. CLI `-auth`/curl `-u` use the explicit `training-only`
fixture password; do not enter real credentials.

Add Data and Data Inputs share effective monitor configuration. Explicit uploads
are confined to virtual `/var/log/practice/`. Other readable virtual files can be
monitored. Tick processing follows outputs.conf, receiver reachability and the first
full parsing tier (heavy forwarder, otherwise indexer), applies the supported
props/transforms subset, then appends durable events. Failed delivery retains the
checkpoint and reports the error; repair retries the backlog. Checkpoints prevent
repeat ingestion after ticks and save/load. Search, metadata and index usage include
these same recorded rows. Search-time named EXTRACT rules run on the search head.

HEC uses `[http]` and `[http://name]` from the same effective inputs.conf. Web and
simulated curl validate enabled state, token, allowed indexes, destination and time.
The supported data endpoint accepts one JSON event envelope per request. Its event
is already framed; monitor line breaking does not split it. Tokens are deterministic
training fixtures confined to this environment. Batch HEC, acknowledgements and
external HTTP delivery are not implemented. The older Interview Workbench HEC
resource remains an explicitly simplified separate training resource until the
integration milestone; it is not the new operational HEC input.

Recorded teaching buckets contain at most 64 events from one input operation.
Idle hot buckets become warm using maxHotIdleSecs; excess warm buckets become cold
using maxWarmDBCount. Retention and size freeze whole buckets. Frozen state is
latched on a clock tick and never resurrected by increasing retention. Configured
coldToFrozenDir retains an archive marker; the Web practice restore puts an archived
bucket in thawed storage. This is an explicit teaching restore, not an invented
native CLI command. `dbinspect index=NAME` exposes searchable recorded buckets.
Generated fleet baseline data remains lazy and is not materialized into these
buckets. Byte counts describe recorded raw bytes, not Splunk compression or tsidx
size. Filesystem bucket rebuild tools, replication recovery, metrics ingestion and
mstats are outside this bounded workflow. Metrics datatype can be configured and
inspected; event writes into metrics indexes fail explicitly.

Limits: 20,000 recorded events per world, 1,000 per write, 65,536 characters per
record, 250,000 characters per uploaded file, 100 touched files per host per tick.
The journal/save schema is now **6**; versions 1–5 still load. No SQLite schema or
existing lesson ID is replaced. Reset and learner/profile changes retain isolation.

SP-006–SP-025 each have solution, wrong-action, no-false-completion, reset, resume
and isolation checks. SP-007 was completed through the actual Web form and evidence
answer; SP-017's Web upload produced the two expected searchable records.
