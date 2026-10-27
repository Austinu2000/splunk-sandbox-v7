import { parseConf } from './parse';
import { confSources, type ConfReader } from './merge';

/**
 * Valid setting names for the conf files the sandbox models, used by `btool check` and by the
 * "Checking conf files for problems" step of `splunk start/restart`. Patterns cover numbered and
 * class-prefixed keys (whitelist.N, EXTRACT-foo). Conf types not listed here are not checked.
 */
const SPEC: Record<string, (string | RegExp)[]> = {
  inputs: [
    'disabled',
    'index',
    'sourcetype',
    'source',
    'host',
    'host_segment',
    'host_regex',
    'queue',
    '_rcvbuf',
    'evt_resolve_ad_obj',
    'whitelist',
    'blacklist',
    'crcSalt',
    'initCrcLength',
    'ignoreOlderThan',
    'followTail',
    'alwaysOpenFile',
    'time_before_close',
    'recursive',
    'followSymlink',
    'move_policy',
    'interval',
    'connection_host',
    'acceptFrom',
    'route',
    'renderXml',
    'start_from',
    'current_only',
    'checkpointInterval',
    'compressed',
    'enableS2SHeartbeat',
    'negotiateProtocolLevel',
    '_TCP_ROUTING',
    '_SYSLOG_ROUTING',
    '_INDEX_AND_FORWARD_ROUTING',
    'outputgroup',
    'token',
    'useACK',
    'sslPassword',
    'serverCert',
    'requireClientCert',
    /^_meta$/,
    /^whitelist\d*$/,
    /^blacklist\d*$/,
  ],
  outputs: [
    'defaultGroup',
    'server',
    'disabled',
    'indexAndForward',
    'index',
    'maxQueueSize',
    'autoLBFrequency',
    'autoLBVolume',
    'useACK',
    'compressed',
    'blockOnCloning',
    'dropClonedEventsOnQueueFull',
    'dropEventsOnQueueFull',
    'heartbeatFrequency',
    'maxFailuresPerInterval',
    'secsInFailureInterval',
    'maxConnectionsPerIndexer',
    'connectionTimeout',
    'readTimeout',
    'writeTimeout',
    'sendCookedData',
    'forceTimebasedAutoLB',
    'clientCert',
    'sslPassword',
    'sslVerifyServerCert',
    'useClientSSLCompression',
    'blockWarnThreshold',
    'forwardedindex.filter.disable',
    'negotiateProtocolLevel',
    /^forwardedindex\.\d+\.(whitelist|blacklist)$/,
  ],
  props: [
    'CHARSET',
    'LINE_BREAKER',
    'LINE_BREAKER_LOOKBEHIND',
    'TRUNCATE',
    'DATETIME_CONFIG',
    'ANNOTATE_PUNCT',
    'HEADER_MODE',
    'MATCH_LIMIT',
    'DEPTH_LIMIT',
    'MAX_DAYS_HENCE',
    'MAX_DAYS_AGO',
    'MAX_DIFF_SECS_AGO',
    'MAX_DIFF_SECS_HENCE',
    'MAX_TIMESTAMP_LOOKAHEAD',
    'SHOULD_LINEMERGE',
    'BREAK_ONLY_BEFORE',
    'BREAK_ONLY_BEFORE_DATE',
    'MAX_EVENTS',
    'MUST_BREAK_AFTER',
    'MUST_NOT_BREAK_AFTER',
    'MUST_NOT_BREAK_BEFORE',
    'TRANSFORMS',
    'SEGMENTATION',
    'LEARN_SOURCETYPE',
    'LEARN_MODEL',
    'TIME_PREFIX',
    'TIME_FORMAT',
    'TZ',
    'pulldown_type',
    'maxDist',
    'category',
    'description',
    'KV_MODE',
    'NO_BINARY_CHECK',
    'INDEXED_EXTRACTIONS',
    'EVENT_BREAKER_ENABLE',
    'EVENT_BREAKER',
    'sourcetype',
    'rename',
    'priority',
    'TRANSFORMS',
    'SEDCMD',
    'ADD_EXTRA_TIME_FIELDS',
    'detect_trailing_nulls',
    /^(EXTRACT|REPORT|TRANSFORMS|SEGMENTATION|FIELDALIAS|EVAL|LOOKUP|SEDCMD)-.+$/,
  ],
  server: [
    'serverName',
    'sessionTimeout',
    'trustedIP',
    'allowRemoteLogin',
    'pass4SymmKey',
    'listenOnIPv6',
    'connectUsingIpVersion',
    'useHTTPServerCompression',
    'parallelIngestionPipelines',
    'enableSplunkdSSL',
    'sslVersions',
    'serverCert',
    'sslPassword',
    'max-age',
    'follow-symlinks',
    'maxSockets',
    'maxThreads',
    'maxSize',
    'manager_uri',
    'master_uri',
    'active_group',
    'mode',
    'replication_factor',
    'search_factor',
    'heartbeat_timeout',
    'cluster_label',
    'site',
    'multisite',
    'disabled',
  ],
  deploymentclient: [
    'disabled',
    'workingDir',
    'repositoryLocation',
    'serverRepositoryLocationPolicy',
    'endpoint',
    'phoneHomeIntervalInSecs',
    'handshakeRetryIntervalInSecs',
    'appEventsResyncIntervalInSecs',
    'reloadDSOnAppInstall',
    'targetUri',
    'clientName',
  ],
  serverclass: [
    'disabled',
    'crossServerChecksum',
    'repositoryLocation',
    'targetRepositoryLocation',
    'tmpFolder',
    'continueMatching',
    'endpoint',
    'filterType',
    'stateOnClient',
    'restartSplunkWeb',
    'restartSplunkd',
    'issueReload',
    'machineTypesFilter',
    'excludeFromUpdate',
    'appFile',
    'precompressBundles',
    /^(whitelist|blacklist)\.\d+$/,
    /^(whitelist|blacklist)\.(from_pathname|select_field|where_field|where_equals)$/,
  ],
};

export interface CheckIssue {
  path: string;
  line: number;
  stanza: string;
  key: string;
  value: string;
}

export function validKey(conf: string, key: string): boolean {
  const spec = SPEC[conf];
  if (!spec) return true;
  return spec.some((k) => (typeof k === 'string' ? k === key : k.test(key)));
}

export const CHECKED_CONFS = Object.keys(SPEC);

/** Unknown settings across all layers of the checked conf types. */
export function checkConfs(reader: ConfReader, splunkHome: string): CheckIssue[] {
  const issues: CheckIssue[] = [];
  for (const conf of CHECKED_CONFS) {
    for (const src of confSources(reader, splunkHome, conf)) {
      if (src.path.includes('/system/default/')) continue;
      const parsed = parseConf(reader.read(src.path) ?? '');
      for (const st of parsed.stanzas.values())
        for (const s of st.settings.values())
          if (!validKey(conf, s.key))
            issues.push({ path: src.path, line: s.line, stanza: st.name, key: s.key, value: s.value });
    }
  }
  return issues;
}

/** Splunk's wording for an invalid key. */
export function formatIssue(i: CheckIssue): string {
  return `Invalid key in stanza [${i.stanza}] in ${i.path}, line ${i.line}: ${i.key}  (value:  ${i.value}).`;
}
