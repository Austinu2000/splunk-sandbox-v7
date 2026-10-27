import type { SplEvent } from './row';

/**
 * Search-time field extraction. Every sourcetype gets automatic key=value extraction (Splunk's
 * KV_MODE=auto default); some get regex extractions, modelled on the shipped props.conf.
 */

const KV = /(?:^|[\s,;[(])([A-Za-z_][\w.]*)=("([^"]*)"|'([^']*)'|[^\s,;"'\]]*)/g;

const EXTRACTS: Record<string, RegExp[]> = {
  splunkd: [
    /^(?:[^ ]* ){2}(?:[+-]\d+ )?(?<log_level>[A-Z]+)\s+(?<component>[^ ]+) (?:\[[^\]]*\] )?- (?<event_message>.+)/s,
  ],
  syslog: [/^\w{3} +\d+ [\d:]+ \S+ (?<process>[\w.-]+)(?:\[(?<pid>\d+)\])?:/],
  linux_secure: [
    /^\w{3} +\d+ [\d:]+ \S+ (?<process>[\w.-]+)(?:\[(?<pid>\d+)\])?:/,
    /(?<action>Accepted|Failed|Connection closed)\b.*? (?:for|by)(?: authenticating)? (?:user )?(?<user>[\w-]+) (?:from )?(?<src>\d+\.\d+\.\d+\.\d+)/,
  ],
  access_combined: [
    /^(?<clientip>\S+) \S+ \S+ \[[^\]]+\] "(?<method>[A-Z]+) (?<uri>\S+) (?<version>[^"]+)" (?<status>\d{3}) (?<bytes>\d+|-)/,
  ],
  XmlWinEventLog: [
    /<EventID>(?<EventCode>\d+)<\/EventID>/,
    /<Computer>(?<Computer>[^<]+)<\/Computer>/,
    /<Data Name="TargetUserName">(?<TargetUserName>[^<]+)<\/Data>/,
    /<Data Name="IpAddress">(?<IpAddress>[^<]+)<\/Data>/,
  ],
  'aws:cloudwatchlogs:vpcflow': [
    /^(?<version>\d+) (?<account_id>\S+) (?<interface_id>\S+) (?<srcaddr>\S+) (?<dstaddr>\S+) (?<srcport>\d+) (?<dstport>\d+) (?<protocol>\d+) (?<packets>\d+) (?<bytes>\d+) (?<start>\d+) (?<end>\d+) (?<action>\S+) (?<log_status>\S+)$/,
  ],
  app_log: [/^\S+ (?<log_level>[A-Z]+)\s+\[(?<thread>[^\]]+)\] (?<logger>\S+) - (?<message>.*)$/s],
  log4j: [/^\S+ (?<log_level>[A-Z]+)\s+\[(?<thread>[^\]]+)\] (?<logger>\S+) - (?<message>.*)$/s],
  'app:log': [/^\S+ (?<log_level>[A-Z]+)\s+\[(?<thread>[^\]]+)\] (?<logger>\S+) - (?<message>.*)$/s],
  syslog_asa: [/%ASA-(?<severity>\d)-(?<message_id>\d+)/],
  audittrail: [/user=(?<user>[^,\]]+), action=(?<action>[^,\]]+), info=(?<info>[^,\]\s]+)/],
};

export function extractFields(ev: SplEvent): Map<string, string> {
  const out = new Map<string, string>();
  for (const re of EXTRACTS[ev.sourcetype] ?? []) {
    const m = re.exec(ev.raw);
    if (m?.groups)
      for (const [k, v] of Object.entries(m.groups)) if (v !== undefined && !out.has(k)) out.set(k, v.trim());
  }
  if (ev.sourcetype === 'syslog' && ev.raw.includes('%ASA-')) {
    const m = EXTRACTS.syslog_asa![0]!.exec(ev.raw);
    if (m?.groups) for (const [k, v] of Object.entries(m.groups)) out.set(k, v);
  }
  KV.lastIndex = 0;
  for (const m of ev.raw.matchAll(KV)) {
    const key = m[1]!;
    if (out.has(key) || (key.startsWith('_') && !key.startsWith('_tcp'))) continue;
    out.set(key, m[3] ?? m[4] ?? m[2] ?? '');
  }
  return out;
}

/** Fields extracted by regex (their names don't appear literally in _raw). */
export const REGEX_FIELD_NAMES = new Set([
  'tag',
  'eventtype',
  'datamodel',
  ...Object.values(EXTRACTS)
    .flat()
    .flatMap((re) => [...re.source.matchAll(/\(\?<([A-Za-z_][A-Za-z0-9_]*)>/g)].map((m) => m[1]!)),
]);
