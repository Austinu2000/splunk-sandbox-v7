# V7 identity and security practice

SP-081 and SP-082 are executable after 12 lesson acceptance cases. An additional
passive-grading/stale-proof check and four engine/API cases cover integration.
The combined identity, model, monitoring and persistence gate passed 97 tests.
This is a partial M8 checkpoint: six M8 lessons and Milestones 9–11 remain.

## Native sources and explicit fictional evidence

Interview workbench → Recorded security operations → Identity and role mapping
opens `#/settings/identity-operations`. Edits stage native system/local
`authentication.conf` or `authorize.conf`; a virtual search-head restart activates
them. API writes and probes pin the environment and host source revision. A stale
lesson/editor cannot write into the newly selected world.

The SAML sample has a fixed fictional audience, group attribute, signer identifier
and validity interval. The probe checks the active strategy, entity ID, fictional
IdP URL, signedAssertion, role attribute, trusted teaching-certificate metadata,
expiry and case-sensitive role-to-group mapping. The metadata file is JSON under
`etc/auth/idpCerts`, explicitly separate from native PEM or XML cryptography.
Signature verification cannot simply be disabled to pass this exercise.

The LDAP sample has fixed fictional user/group entries and a training-only bind
identity. Native strategy, host/port/SSL, bind, search bases, uid/cn/dn/member
attributes, simple bounded filters and role mapping determine its result. Arbitrary
LDAP filter trees, nested directory groups and real directory/network operations
are not implemented. Only `bindDNpassword=training-only` is accepted in the editor;
real credentials, secret/token fields and alternate passwords are rejected.

Mapped native roles use the same authorize.conf merge/index-pattern logic as the
existing practice principals. Custom role names and inherited role lookup are
supported, with missing/cyclic roles rejected in a probe. This retains the existing
teaching authorization semantics rather than claiming every production capability
union rule. Available recorded rows are read from the actual searchable bucket
state; denied indexes expose no row count. Probes do not create a browser session.
Search keeps explicit admin/analyst/operator practice principals.

Retained probes include active-source fingerprints, mapped roles, index visibility,
capabilities and failures. A current-source check rejects a success recorded against
an earlier source. Historical SAML proof remains visible when the lesson deliberately
switches to LDAP. Grading is passive and cannot create a new identity probe. Save
schema 12 retains identity evidence while loading versions 1–11.

## Independent security checks

Search evidence now records dispatch host and practice principal, so a successful
admin search cannot meet a new analyst-search outcome. Older evidence remains
loadable. SP-082 combines actual TLS canary delivery, active certificate verification,
service-owned restrictive file permissions and restricted reader access. Its TLS
fixture uses the previously documented metadata certificate/CA relationships;
this does not perform native TLS cryptography or open a socket.

Browser verification completed SP-081's workflow checks: initial SAML mapping
failure retained, successful restricted SAML probe, successful current LDAP probe,
and an independently inspected analyst search returning three actual records.
[Probe proof](v7-identity-probes.png). The separate verification learner is saved
and existing Lab free practice restored afterwards.

## Primary reference

[Splunk Enterprise 9.4 authentication.conf](https://help.splunk.com/en/splunk-enterprise/administer/admin-manual/9.4/configuration-file-reference/9.4.0-configuration-file-reference/authentication.conf)
defines the native strategy and mapping families. The fixed assertion, directory
entries and JSON certificate are teaching fixtures, not native export formats.
Existing inherited profiles/authentication metadata are preserved; no automatic
external-login conversion is performed.
