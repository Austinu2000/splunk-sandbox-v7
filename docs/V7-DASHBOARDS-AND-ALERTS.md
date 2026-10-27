# V7 dashboards, alerts and sharing

SP-047–SP-054 add eight executable exercises: **89 new / 116 total**. The original
27 lessons remain. This is operational dashboard authoring inside Search &
Reporting, not a new learning progress dashboard.

## Shared configuration

Dashboards now use scoped native view files under an app or a private user/app
namespace, with ownership/export metadata. Classic definitions use Simple XML.
Studio definitions use JSON within a version-2 XML CDATA wrapper. Web, simulated
REST, configuration inspection and lesson checks read the same active source.
Disk edits remain staged until view reload, app reload or a host restart. Dashboard
activation has its own journal entry; old report-reload journals retain their prior
scope. Save schema 8 accepts versions 1–7.

The panel builder and source editor create the same definitions. Supported panels
are table, single value, column, bar, line, area and pie; text and dropdown inputs
substitute tokens, including the SPL string quoting filter `|s`. Classic panels can
reference an available report in the same app. Source that uses unsupported XML,
Studio properties or visualization options is rejected/reported. There is no
silent HTML/JavaScript execution or invented result for an unsupported panel.

Views are bounded to eight panels/data sources/inputs and 100 KB of source. Classic
XML is limited to 512 tags and rejects DOCTYPE/entity declarations. Studio supports
the documented teaching subset of ds.search, the listed visualizations, text and
dropdown inputs, and default grid placement. Arbitrary absolute layouts, custom
visualization options, base/postprocess searches, dynamic input data sources and
native time-range widgets are outside this milestone.

Rendering executes actual read-only searches under the **viewer's** principal,
retains result rows/errors and source revisions, and shares identical panel searches
within a render. Limits are 250,000 scanned events/search, 1,000 rows/panel and a
one-million-event dashboard budget. Up to 30 render receipts persist. Panels do not
invoke outputlookup/collect or other writes. Referencing an admin-owned report does
not grant the viewer admin index access.

## Alerts and scheduling

Alerts extend the existing savedsearches.conf catalog and report scheduler. Native
configuration uses counttype/relation/quantity or alert_condition. The simulated
saved-search REST interface accepts the corresponding alert_type/comparator/
threshold fields. A custom condition is a single `search` predicate over the
completed result rows, with normal numeric comparisons; it is not a second
independent event search. A count field of two in one statistics row is different
from two result rows.

Supported triggers are result/host/source counts, always, and custom predicates.
Once-per-search and per-result triggers support simulation-clock suppression;
per-result suppression requires fields that actually exist in the results.
Suppression identity includes the alert's own search/settings, so an unrelated
saved search does not reset its suppression period. Receipts survive save/resume.

Actual scheduled results, failures and capacity skips remain in execution history.
A failed search creates no trigger. Suppressed and unmatched successful searches
remain distinguishable. Web Run once explicitly tests local actions; native REST
dispatch defaults to trigger_actions=0 unless requested. Notifications and audit
receipts are local simulation data: no email, webhook or external service is called.
Tracking controls listing in Triggered Alerts. Severity 1–6 and bounded action
receipts are supported. Real-time continuous alert execution, native email/webhook
actions and combining alert actions with summary writes in the same saved search
are explicitly unsupported here. Separate summary and alert definitions are needed.

## Permissions and preserved work

Admin can move private objects into app/global scope and change supported owners,
with reviewed revisions and collision checks. Moving a report removes only its old
stanza; moving a view removes its prior local source. Analyst/operator may manage
their own private definitions. Sharing does not grant index permissions. Source
revisions and active-world context reject stale forms and writes after lesson or
environment switches.

Legacy dashboard/alert imports require review, retain the raw source in an archive,
and use idempotent receipts. Unsupported or empty dashboard panels are not treated
as successfully imported. Imported alerts start with scheduling off, no actions and
a count > 0 condition to review; old free-form conditions remain in the archive.
Search Save As Report/Alert/Dashboard now writes canonical configuration instead of
creating another browser-only engineering object. Existing legacy records remain.

## Validation

All eight new exercises have solution, incorrect action, no-false-completion,
reset, resume and isolation checks (48 cases). Eight engine cases cover Classic
and Studio source, actual token-filtered results, staged activation, REST file
upload, viewer permissions, scoped moves, scheduling, suppression and failure
recovery. Two API cases cover SQLite receipt persistence and stale-form rejection.
The focused gate passed **58 tests**; full regression passed **880 tests / 52 files**.
The browser completed SP-048 using the panel/input builder, with count=2 for errors
and count=1 for OK, then saved its correct evidence answer. See
[V7 Studio result](v7-studio-inputs.png). The browser also completed SP-051: two status results triggered once each, then
the next minute suppressed both repeats; source/result evidence and correct answer
completed the lesson. [Suppression proof](v7-alert-suppression.png). TypeScript,
ESLint and the production web build pass (the inherited bundle-size advisory
remains). Additional gate results are recorded in V7-IMPLEMENTATION-STATUS.md.

## Primary references

- [Splunk 9.4.1 savedsearches.conf](https://help.splunk.com/en/data-management/splunk-enterprise-admin-manual/9.4/configuration-file-reference/9.4.1-configuration-file-reference/savedsearches.conf)
- [Splunk 9.4 saved-search REST](https://help.splunk.com/en/splunk-enterprise/rest-api-reference/9.4/search-endpoints/search-endpoint-descriptions)
- [Studio definition](https://help.splunk.com/en/splunk-enterprise/create-dashboards-and-reports/dashboard-studio/9.4/source-code-editor/what-is-a-dashboard-definition)
- [Studio native view wrapper](https://help.splunk.com/en/splunk-enterprise/create-dashboards-and-reports/dashboard-studio/9.4/manage-dashboards/create-a-dashboard-using-rest-api-endpoints)
