# V7 reports and summary indexing

Implemented for SP-035–SP-046, within the limits below. Reports and Search → Save As
Report now use the same canonical service as simulated namespaced REST and supported
savedsearches.conf editing. The old editable saved-search Settings table opens this
same view. Report identity includes host, app, owner, sharing and title.

Shared definitions live in etc/apps/APP/local/savedsearches.conf; private definitions
live in etc/users/OWNER/APP/local/savedsearches.conf. Ownership/export metadata lives
in the corresponding metadata/local.meta. Web writes activate online; raw file edits
need a saved-search _reload or a search-head restart. The current catalog and revision
are derived from those files, not synchronized into a second writable object list.
Optimistic revisions reject conflicting edits. Server context tokens also reject a
stale tab after an environment/learner/attempt swap, including same-profile resets.

Supported properties: search, description, disabled, dispatch.earliest_time,
dispatch.latest_time, enableSched, cron_schedule, action.summary_index and
 action.summary_index._name. Multiline SPL is serialized as native conf continuation
lines and round-trips safely. Simulated REST exposes is_scheduled as the scheduling
field and supports GET/create/edit/dispatch/_reload in an explicit OWNER/APP namespace.
`trigger_actions=1` on native REST dispatch enables the summary action; default 0
runs the source without the action. Web labels its manual summary action explicitly.
No invented `splunk add report` command is provided.

Five-field numeric cron uses simulation time in UTC. Newly authored/adopted reports
execute at minute boundaries; actual history records source revision/file, principal,
exact dispatch window, result rows, failures, capacity skips and summary event IDs.
The owner determines execution permissions. Practice owners are admin, analyst,
operator and the inherited nobody/system fixture; arbitrary owner mappings fail.
The executor supports at most four dispatches per search head per minute, further
bounded by effective scheduler limits. Each source has a deterministic 250,000-scan
budget and a 1,000-result limit. It does not use wall time to decide persisted results.
The last 200 real run records are retained. Actual scheduler.log records are derived
from the same run history and suppress duplicate reference records for those titles.

Inherited generated reports keep their existing background workload model. They
are clearly labeled references in Reports. Adopt one through Edit (which supplies
explicit ownership metadata), or author a new report, to use the real result executor.
Changing a reference schedule for an inherited incident still affects the background
scheduler model. This prevents the expansion from silently running every inherited
workload against a user's saved session. SHC captain scheduling, queues spanning
multiple minutes, real mail/webhook actions and unbounded concurrent jobs remain
outside this milestone and must not be inferred from reference metrics.

Summary destinations must exist and be enabled. Creation alone writes no events.
A successful summary action appends actual recorded rows with report/window
provenance; failed or incomplete searches do not write summaries. Identical or
overlapping windows for the same writer/destination are rejected instead of silently
doubling counts. Empty windows produce no summary events. Search permission and
run_collect capability checks apply. Reserved indexed metadata dimensions are retained
as orig_host/orig_source/orig_sourcetype/orig_index/etc.; _time becomes the event time.
This explicit bounded mapping avoids losing grouping dimensions or spoofing metadata.

`collect index=NAME [source=VALUE] [sourcetype=VALUE]` uses the same persisted write
service. It commits after successful pipeline evaluation and rejects missing indexes,
unsupported options and more than one write per pipeline. `addinfo` supplies dispatch
window metadata. `sistats` and `sitimechart` remain unsupported and fail as unsupported
SPL; no incorrect partial-aggregate semantics are advertised. `auto_summarize` is
separate report acceleration and is diagnosed as unsupported by this executor.
The inherited Interview Workbench tstats/acceleration snapshots remain a labeled
bounded training model; collect no longer treats an event write as acceleration.

Persisted summary and input events can be queried beyond 24 hours according to
index retention. Generated fleet history remains limited to 24 hours. A backfilled
summary from two days ago is covered by regression tests. For hourly error counts,
use the supported equivalent query:

```spl
index=source_logs
| where status>=500
| timechart span=1h count as errors
```

Configure an events destination with suitable retention, a report window of -1h@h
to @h, a cron of 0 * * * *, and the summary action. Advance the simulation and inspect
real history, then query the destination with sum(errors) over the desired time range.
Do not use overlapping windows unless intentionally handling deduplication elsewhere.

Legacy V6 report JSON is preserved byte-for-byte and shown separately for reviewed
import. An explicit target host/app/owner/sharing is required. Import snapshots the
world, archives the source once by checksum, records an idempotent receipt and leaves
scheduling off. Invalid/conflicting records remain recoverable. Receipt identity is
bound to the source record, so reordering a legacy list cannot import the wrong item.
Alerts/dashboards/datasets retain their legacy workflow until their later milestones.

Twelve executable lessons have solution, wrong-action, false-completion, reset,
resume and isolation cases. Search job inspection now records actual bounded job
evidence, so performance exercises compare successful inspected jobs and work units.
Browser verification created a report from uploaded data, then separately created
and scheduled Minute status summary in SP-045. The first window wrote two summary
rows (counts 1 and 2); the next wrote zero. Independent SPL returned total=3, and the
lesson reached verified completion. Proof: [scheduled run](v7-scheduled-summary.png)
and [summary search](v7-summary-search.png).
