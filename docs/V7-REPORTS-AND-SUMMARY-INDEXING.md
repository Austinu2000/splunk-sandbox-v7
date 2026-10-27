# V7 reports and summary indexing

Status: planned for Milestone 3, SP-035–SP-046. Milestone 0 does not activate saved
report schedules or migrate UI reports into effective configuration.

The V6 knowledge UI saves reports and schedule strings in profile UI JSON. Its
existing automation scheduler executes Ansible, not arbitrary saved reports.
Existing `collect`/`tstats summariesonly` exercises store bounded training snapshots;
that does not satisfy the new operational summary-index workflow.

The shared engine must preserve app/owner/sharing, stored SPL/time range, revision,
enabled state and source configuration. Web, supported configuration and simulated
REST must use one service. Do not invent `splunk add report`.

The scheduler will evaluate supported schedule semantics against simulation time,
run the stored query, and retain success/failure/skipped history, exact collection
windows, results and summary-write references. Advancing the clock must execute
the same deterministic behavior during save replay. Report creation alone writes
no summary events.

Summary destinations must exist in the effective index catalog. Enforce permissions
and distinguish summary indexing from report acceleration and data-model
acceleration. Preserve provenance and diagnose missing destinations, bad windows,
duplicate/overlapping writes and failed runs. New summary events are actual
persisted rows within documented limits, not canned results for a lesson string.

Acceptance requires a report created through Web to be inspectable through config
or REST, scheduled execution to write traceable events, a search of those events
to match the source aggregation, and failure/reset/resume/profile-isolation tests.
Document the supported subset of `collect`, `addinfo`, `sistats`, `sitimechart` and
`savedsearches.conf` only after implementing and testing their semantics.
