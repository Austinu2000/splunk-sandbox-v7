import { parseConf } from './parse';

/** Reads directories and files for config layering; returns null when missing or unreadable. */
export interface ConfReader {
  list(dir: string): string[] | null;
  read(path: string): string | null;
}

export interface ConfSource {
  path: string;
  app?: string;
}

export interface MergedValue {
  value: string;
  path: string;
  line: number;
}

export interface MergedStanza {
  name: string;
  /** File whose copy of this stanza has the highest precedence (btool shows it on the header line). */
  path: string;
  settings: Map<string, MergedValue>;
}

export interface MergedConf {
  conf: string;
  stanzas: Map<string, MergedStanza>;
  /** Files that took part, highest precedence first. */
  sources: ConfSource[];
}

/** ASCII order, as Splunk uses for app precedence (uppercase sorts before lowercase). */
const ascii = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

/**
 * Files for `<conf>.conf` in global-context precedence order, highest first:
 *   peer-apps local (cluster peers) → system/local → apps local (A..z) →
 *   peer-apps default (cluster peers) → apps default (A..z) → system/default
 */
export function confSources(
  reader: ConfReader,
  splunkHome: string,
  conf: string,
  opts: { app?: string } = {},
): ConfSource[] {
  const file = `${conf}.conf`;
  const out: ConfSource[] = [];
  const add = (path: string, app?: string) => {
    if (opts.app && app !== opts.app) return;
    if (reader.read(path) !== null) out.push({ path, app });
  };
  const appsIn = (dir: string) => (reader.list(`${splunkHome}/${dir}`) ?? []).sort(ascii);
  const peerApps = appsIn('etc/peer-apps');
  const apps = appsIn('etc/apps');

  for (const a of peerApps) add(`${splunkHome}/etc/peer-apps/${a}/local/${file}`, a);
  add(`${splunkHome}/etc/system/local/${file}`, opts.app ? 'system' : undefined);
  for (const a of apps) add(`${splunkHome}/etc/apps/${a}/local/${file}`, a);
  for (const a of peerApps) add(`${splunkHome}/etc/peer-apps/${a}/default/${file}`, a);
  for (const a of apps) add(`${splunkHome}/etc/apps/${a}/default/${file}`, a);
  add(`${splunkHome}/etc/system/default/${file}`, opts.app ? 'system' : undefined);
  return out;
}

/**
 * Merges files (highest precedence first). A setting's first occurrence wins. Then every stanza
 * inherits [default] settings it does not set itself, the way btool reports them.
 */
export function mergeConf(conf: string, reader: ConfReader, sources: ConfSource[]): MergedConf {
  const stanzas = new Map<string, MergedStanza>();
  for (const src of sources) {
    const parsed = parseConf(reader.read(src.path) ?? '');
    for (const st of parsed.stanzas.values()) {
      let m = stanzas.get(st.name);
      if (!m) stanzas.set(st.name, (m = { name: st.name, path: src.path, settings: new Map() }));
      for (const s of st.settings.values())
        if (!m.settings.has(s.key)) m.settings.set(s.key, { value: s.value, path: src.path, line: s.line });
    }
  }
  const def = stanzas.get('default');
  if (def)
    for (const st of stanzas.values()) {
      if (st === def) continue;
      for (const [k, v] of def.settings) if (!st.settings.has(k)) st.settings.set(k, v);
    }
  return { conf, stanzas, sources };
}

export function loadConf(
  reader: ConfReader,
  splunkHome: string,
  conf: string,
  opts: { app?: string } = {},
): MergedConf {
  return mergeConf(conf, reader, confSources(reader, splunkHome, conf, opts));
}

/** A setting's merged value, or undefined. */
export function setting(m: MergedConf, stanza: string, key: string): string | undefined {
  return m.stanzas.get(stanza)?.settings.get(key)?.value;
}

/**
 * btool's `list` output. Stanzas and keys are sorted. With debug, every line is prefixed with the
 * file it came from, padded to the longest path.
 */
export function formatBtool(m: MergedConf, opts: { debug?: boolean; stanza?: string } = {}): string {
  const names = [...m.stanzas.keys()]
    .filter((n) => opts.stanza === undefined || n === opts.stanza)
    .sort(ascii);
  const rows: [string, string][] = [];
  for (const name of names) {
    const st = m.stanzas.get(name)!;
    rows.push([st.path, `[${name}]`]);
    for (const key of [...st.settings.keys()].sort(ascii)) {
      const v = st.settings.get(key)!;
      rows.push([v.path, v.value === '' ? `${key} =` : `${key} = ${v.value}`]);
    }
  }
  if (!rows.length) return '';
  if (!opts.debug) return rows.map((r) => r[1]).join('\n') + '\n';
  const width = Math.max(...rows.map((r) => r[0].length));
  return rows.map(([p, l]) => `${p.padEnd(width)} ${l}`).join('\n') + '\n';
}
