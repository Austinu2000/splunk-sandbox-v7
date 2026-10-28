# V7 recorded security operations

Milestone 8 remains in progress. SP-069–080 are available after 72 acceptance
checks. This checkpoint adds a bounded record-driven detection/response path;
it does not install Splunk Enterprise Security, SOAR or ServiceNow.

## Shared operational behavior

Native savedsearches.conf alerts can enable `action.notable=1` (or include
`notable` in `actions`). The common alert executor first executes the real scoped
SPL, evaluates its completed rows and applies existing per-result/digest suppression.
An eligible notable action writes an actual derived event to the active `notable`
events index and retains the result rows, report source revision, dispatch/run and
notification identifiers. Metadata fields cannot replace the event's provenance.
The derived stash event does not bill input-license bytes.

Supported native parameters are `action.notable.param.rule_title`,
`rule_description`, `security_domain` and `severity`. The limited domains/severities
are validated. Alerts also expose the notable action in Web. A missing or
unavailable destination fails the action; suppression is committed only after the
notable succeeds. Failed or unmatched searches do not manufacture detection data.
Repeated successful suppression does not duplicate a notable.

The new view is Interview workbench → Recorded security operations, also at
`#/settings/security-operations`. It shows actual notables and allows investigation
assignment/status and retained notes. Current index access and the existing
practice `edit_monitor` capability gate writes. That capability is a teaching
reuse, not a claim of native ES capability parity. Search now exposes an explicit
practice principal as well as dispatch host; Save As uses that principal/owner.

## Offline response adapter

The separate teaching source `/etc/v7-adapters/response.yaml` accepts exactly:

```yaml
version: 1
endpoint: https://servicenow.practice.invalid
credentialAlias: training_valid
allowed: true
```

`training_expired` and `missing` simulate authentication failure; `allowed: false`
simulates authorization denial. Only the fixed fictional endpoint and training
aliases are accepted. Real secrets, arbitrary URLs and unknown fields are rejected.
This schema is not native SOAR asset or ServiceNow configuration, and no request
leaves the simulation.

Each actual attempt retains its source revision, error or ticket reference.
Idempotency is bound to the notable: retry creates an `existing` receipt referencing
the same fictional `INC-PRACTICE-*` ticket. Failed attempts remain available after
repair. Histories are bounded; notables/tickets reject further writes at 500 rather
than silently dropping investigation evidence. Save schema 11 retains all new
security records while loading versions 1–10.

## Monitoring exercises and limits

SP-069–076 use actual service/observation state, an opt-in input buffer, native
monitor checkpoints, actual input-license bytes, recorded bucket archive/thaw,
canonical scheduler receipts and measured query work. The selected recorded queue
uses native running `limits.conf [thruput] maxKBps`; this is not every native Splunk
queue. Generated baseline graphs and logs remain for scale practice. New grading
requires the specific recorded outcomes rather than a changed health toggle.

SP-077 normalizes actual events with native aliases/evaluations/eventtypes/tags.
SP-078 builds a native root event-model row snapshot and searches it through tstats.
SP-079 uses actual alert results and suppression; SP-080 repairs and retries a real
retained offline response. Every new lesson has solution, incorrect-action,
no-false-completion, reset, resume and isolation cases. Grading does not create
observations, build summaries, run actions or create tickets.

Browser verification completed SP-080's workflow checks on a separate V7 verification
learner. It preserved the authentication failure, created one ticket, reused it on
retry and saved the investigation note. [UI proof](v7-security-response.png).
The previously saved Lab free-practice world is restored afterwards.

## Primary references

- [Native security saved-search notable parameters](https://help.splunk.com/en/splunk-enterprise-security-7/splunk-app-for-pci-compliance/installation-and-configuration-manual/6.3/configure-correlation-searches/configure-correlation-searches).
- [Splunk Enterprise 9.4 model acceleration](https://help.splunk.com/en/splunk-enterprise/manage-knowledge-objects/knowledge-management-manual/9.4/use-data-summaries-to-accelerate-searches/accelerate-data-models).
- [CIM Authentication model 6.1](https://help.splunk.com/en/splunk-enterprise/common-information-model/6.1/data-models/authentication).

Product/add-on versions are separate from the simulated Enterprise release. Full
ES risk-based alerting, adaptive response apps, native Incident Review/ES8 findings,
external ticket lifecycle and production identity providers remain outside this
checkpoint. SP-081–088 and all later milestones are still outstanding.
