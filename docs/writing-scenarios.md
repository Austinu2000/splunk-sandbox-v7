# Writing a new incident

An incident is one YAML file in `scenarios/`. You don't need to change any engine code. The server reads every file at startup and checks it with Zod. A bad file stops the server with a message that names the field.

This guide walks through one file from top to bottom. [`scenarios/input-permissions.yaml`](../scenarios/input-permissions.yaml) is a complete, short example to copy.

## 1. Pick a cause the user can find and fix

Good incidents have one root cause, a symptom that shows somewhere else, and evidence in the places a Splunk engineer would look: `_internal` searches, `btool`, `splunkd.log`, the fleet views and the Monitoring Console.

Before you write anything, try it by hand. Break the config in the sandbox, find the symptom, and fix it. If any of those steps isn't possible, see [When the engine can't express it](#when-the-engine-cant-express-it).

## 2. Describe it

```yaml
id: input-permissions                 # lowercase, digits and dashes; unique
title: MySQL logs from a Dallas database server are missing   # the symptom, never the cause
summary: >-                           # the real cause, for authors and the debrief; never sent to the browser
  During a MySQL upgrade, /var/log/mysql/mysqld.log on dal-db-0001 was recreated as mysql:mysql 0600 ...
topics: [inputs, linux, forwarders]   # used by the interview topic filter
difficulty: easy                      # easy | medium | hard
trigger: { onDemand: true }           # the default; { afterMinutes: N } starts it automatically
ticket:
  requester: Sam, Database Team
  persona: methodical                 # flavour only
  urgency: medium                     # low | medium | high
  text: >-                            # what the requester writes: symptoms and context, no diagnosis
    We upgraded MySQL on dal-db-0001 yesterday. The database is healthy, but its mysqld logs stopped ...
```

Keep the title and ticket to what the requester can see. A test checks that titles don't name config objects such as serverclass, whitelist, parsing queue, line breaking or props.

## 3. Break something: `changes`

Changes run in order when the incident starts. Two kinds exist.

**Config edits** patch one stanza in a `.conf` file under `/opt/splunk/etc` or `/opt/splunkforwarder/etc`. Other settings and comments are left alone.

```yaml
changes:
  - host: ds01
    path: /opt/splunk/etc/system/local/serverclass.conf
    stanza: 'serverClass:linux_web'
    set: { whitelist.0: 'dal-wbe-*' }
    unset: []                  # keys to remove from the stanza
    apply: deploy-server       # restart | deploy-server | none
```

- `apply: restart` restarts splunkd on that host. `deploy-server` runs `splunk reload deploy-server` and is valid on ds01 only. `none` leaves the change on disk only. Use `none` for the cluster manager's `manager-apps` copy, so the bundle looks as if it was pushed earlier.
- Several changes may edit the same file. Each host is restarted or reloaded once, after all the edits.
- To change every indexer, list one change per indexer `peer-apps` path plus the cm01 `manager-apps` path. [`timestamp-tz.yaml`](../scenarios/timestamp-tz.yaml) does this.
- New files belong to the directory's owner (the splunk user), mode 0600, like a file an admin created.

**File permission changes** set the mode and owner of an existing file on a Linux host:

```yaml
  - host: dal-db-0001
    file: /var/log/mysql/mysqld.log
    mode: '0600'
    owner: mysql
    group: mysql
```

Changes go through the same virtual filesystem and service controls the user has. Everything that follows is derived from the world state: logs, metrics, fleet health, searches, license usage and the scheduler. So the symptom shows up wherever it really would.

## 4. Mislead a little: `redHerrings`

These are real log lines written every few minutes while the ticket is open, in a host's `splunkd.log` or `/var/log/messages`. They're searchable and greppable like any other line.

```yaml
redHerrings:
  - host: dal-db-0001
    file: messages            # messages | splunkd
    level: WARN               # INFO | WARN | ERROR (splunkd only)
    component: mysqld
    message: '[Warning] [MY-010068] [Server] CA certificate ca.pem is self signed.'
    everyMinutes: 7
```

Make them plausible and harmless. They should be the kind of noise a real environment has, not something that would cause the symptom.

## 5. Define "fixed": `fixChecks`

Checks test **outcomes**, so any correct fix passes, not just the one you had in mind. They read running state, so saving a file without the right restart or reload never counts. Combine them with `all: [...]` and `any: [...]`.

| Check | Passes when |
|---|---|
| `fleet: { site?, serverClass?, health, maxPct }` | At most `maxPct`% of that scope is in `health` |
| `parsingQueue: { host, blocked }` | The indexer's parsing queue is (or isn't) blocked |
| `eventBreaking: { host, sourcetype, separate }` | The indexer keeps consecutive events of the sourcetype apart |
| `license: { maxProjectedPct }` | Projected daily license usage is at most this share of the quota |
| `timestamps: { host, sourcetype, maxSkewSeconds }` | Every running indexer stamps the forwarder's newest event within N seconds of its write time |
| `forwarderDelivering: { host }` | The forwarder is neither blocked nor offline |
| `collecting: { host, source }` | The forwarder is reading that file |
| `scheduler: { host, maxSkipped, minutes }` | At most N scheduled runs would be skipped over the next M minutes |
| `effectiveConf: { host, conf, stanza, key, equals }` | One exact running setting, only for incidents where that really is the point |

`recovery: { seconds: N }` is how long the check must keep passing before the ticket counts as resolved.

A ticket can only resolve after its check has failed at least once. That stops it resolving before a change has rolled out.

## 6. Interview mode: `interview`

Optional, but every current incident has one.

```yaml
interview:
  prompt: After a MySQL upgrade on one Dallas database server, its MySQL logs stopped showing up ...
  timeLimitMinutes: 15
  expectedPath:                                   # evidence milestones, met in any order
    - id: logs
      label: Read the forwarder's TailReader warnings
      any:
        - { cmd: 'splunkd\.log|TailReader', host: '^dal-db-0001$' }
        - { search: 'TailReader|Insufficient permissions' }
  verification: [{ search: 'mysqld|dal-db-0001' }] # data checks that count after the fix
  unsafe:                                          # on top of the engine's generic list
    - { label: Made the log file world-writable, match: { cmd: 'chmod\s+(-R\s+)?0?7[0-7]7' } }
  rootCause:                                       # concepts a correct answer names
    - { label: file permissions, any: ['permission', '0?600', 'unreadable'] }
  hints:
    - { cost: 10, text: The forwarder logs a warning when it can't read a monitored file. }
  modelAnswer: { rootCause: ..., fix: ..., verification: ..., prevention: ... }
  spokenAnswer: >-                                 # about 60 seconds spoken
    ...
```

- A **matcher** has exactly one of `cmd`, `search` or `page`, plus optional `host` and `role` (such as `indexer`). All are case-insensitive regexes.
- `cmd` matches the command line as typed. `ssh host cmd` counts as `cmd` on `host`.
- `search` matches the SPL followed by `[earliest=… latest=…]`.
- `page` matches page ids such as `fleet`, `search`, `monitoring/license` and `forwarders/serverclasses`.
- Quote YAML strings that contain commas inside `{ ... }`.
- Give each `rootCause` concept several phrasings. The offline grader matches words, so cover the ways people actually say it.

## 7. Test it

Every incident needs a **solution run** in `packages/sim/test/`. Copy one from [`incidents.test.ts`](../packages/sim/test/incidents.test.ts). A solution run:

1. starts the incident and ticks until the symptom appears;
2. checks the symptom where a user would see it (a search, `btool`, a log line or the fleet view);
3. applies a fix through the simulated terminal (`testTerm`) or a file edit, with the right restart or reload;
4. ticks past `recovery` and expects the ticket to be `resolved`.

Add a second test for a different correct fix when the incident allows one. For the interview, a test like the strong run in [`interview.test.ts`](../packages/sim/test/interview.test.ts) shows the expected path and verification really match what a good investigation does.

```bash
npm test
```

The scenario tests also check every file parses, that interview patterns compile, and that titles stay symptom-only.

## When the engine can't express it

If a cause or check doesn't fit the primitives above, add a **generic** primitive to the engine (`packages/sim/src/scenario/engine.ts`), such as a new check type or change type, with its own tests. Never special-case a scenario id in engine code (CLAUDE.md rule 4). Each check in the table above started that way.
