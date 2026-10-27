# V7 forwarder and Deployment Server operations

AU-28–AU-35 and SP-026–SP-034 add 17 executable exercises: **81 new / 108 total**.
The original 27 lessons and saved attempts remain. Individual AU objectives refine
the accepted track ranges; they are not claimed as a recovered original AU manual.

## One operational path

Forwarder Management now stages app configuration and server classes, publishes
Deployment Server changes, and inspects individual client delivery and lifecycle.
The same source files, reloads, services and events back Web and simulated CLI.

1. Stage an app under the DS deployment-apps directory and assign a server class.
2. Publish/reload the DS. This creates a versioned shared catalog.
3. A client must successfully phone home before downloading that catalog.
4. Changed apps with restartSplunkd=true activate after delivery. Other changes
   remain downloaded until an explicit client restart.
5. Inspect configuration/forwarding independently and search actual recorded data.

Web writes require the active world context and the reviewed source revision.
Forms keep their revision across background polls and require review after a world
or source change. The limited class editor preserves other classes and rejects
unsupported attributes in an existing class instead of dropping them.

A source publication is not proof that all clients applied it. The Apps view now
says published; client details distinguish downloaded and running catalog IDs.
Offline/stale clients retain prior packages. Existing fixtures/reference delivery
remain intact until the first new V7 deployment operation. Activation is journaled
before new service operations, so replaying an old journal does not silently change
its historical semantics. Save schema 7 accepts versions 1–6.

## Packages and automation

Linux UF package fixtures are explicitly named `*-simulated.x86_64.rpm` under
/opt/staging. rpm -K validates the teaching artifact identity, not a vendor signature.
rpm -q/-ivh/-Uvh, service stop/start, the teaching acceptance flag and boot-start
change actual virtual installation/version/service state. Upgrades require a stopped
service, retain configuration/instance identity and refuse unsupported downgrades.
No installer, shell, SSH, Python, Ansible process or network request runs on the OS.

New explicit source additions include UF install, deployment-client bootstrap,
outputs, controlled upgrade, DS app publication and HF routing playbooks. UF roles
use the UF installation home, not the Enterprise home. Read-only URI preflight can
inspect the original world in check mode; predicted mutations stay in a disposable
world. Both install and upgrade repeat with changed=0. Windows configuration uses
the DS; native Windows package/remote execution remains unsupported.

## Data, trust and verification

- Monitored teaching files use active input/output/receiver/parsing/index state.
  HF transforms run on the actual first parsing tier. Failed transport retains
  the unread offset so data can arrive after recovery.
- A bounded Windows XML queue under `/__teaching__/WinEventLog/` represents supplied
  events, not an operating-system Event Log API. An enabled WinEventLog channel and
  comma-separated EventID allow/deny lists determine which supplied events persist.
- TLS transport, protocol overlap, peer name, expiry and configured CA relationships
  are checked against explicitly labeled JSON teaching certificate artifacts. This
  is a relationship model, not native PEM parsing or cryptographic validation.
  Disabling verification cannot satisfy the TLS repair lesson.
- Recovery does not rewrite already indexed data. The rollback exercise verifies a
  reviewed inverse Git commit, a separate app deployment, client activation and
  fresh canary records. Earlier events keep the prior sourcetype.
- The Windows canary app has an early ASCII name because it must override another
  app's local inputs. Tests verify actual data classification rather than assuming
  that a later app name wins configuration precedence.

## Bounds and retained limitations

Catalogs share their app content; row-to-cohort selection uses typed arrays and
merged configuration caches. A 35,000-forwarder world does not acquire 35,000 app
or lifecycle objects. Detailed package/service history is sparse, limited to 1,000
explicit clients. Catalog history is limited to 32 revisions, 100 apps and 2 MB per
catalog. The Web app editor accepts bounded local/default .conf files and hostname/IP
wildcard class filters. More complex native class attributes require configuration
editing and may exceed the modeled subset.

This does not implement an arbitrary native package manager, a remote upgrader,
all serverclass filters, all TLS/certificate formats, Windows transport or unlimited
fleet-wide Ansible execution. Generated baseline log streams keep inherited
historical-model limits; explicit queued/monitored teaching records retain actual
index time and ingestion results. App unassignment/removal and restart policy are
bounded to the documented catalog/activation model.

## Validation

All 17 exercises have solution, incorrect action, false-completion prevention,
reset, resume and isolation cases (102 cases). Seven focused engine cases cover
package lifecycle, identity/config retention, delivery/activation, failed phone-home,
35,000-row sharing, certificate relationships and Windows filtering. The API test
covers source/context/permission checks and delivery through the same state.
The combined focused gate initially passed **109 tests**; an additional restart
preflight regression also passes. Full regression passes **822 tests / 49 files**.
Browser proof and build results are recorded in V7-IMPLEMENTATION-STATUS.md.
