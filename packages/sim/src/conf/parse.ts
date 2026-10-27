/**
 * Splunk .conf parser. Follows Splunk's rules: `#` comments only at the start of a line, `[stanza]`
 * headers, `key = value` split on the first `=`, trailing-backslash line continuation, settings before
 * any header belong to [default], and a stanza repeated in one file merges (last value wins).
 */

export interface ConfSetting {
  key: string;
  value: string;
  line: number;
}

export interface ConfStanza {
  name: string;
  /** Line of the stanza header (0 for the implicit [default] at the top of a file). */
  line: number;
  settings: Map<string, ConfSetting>;
}

export interface ParsedConf {
  stanzas: Map<string, ConfStanza>;
  /** Lines that are neither comments, headers nor settings. */
  errors: { line: number; text: string }[];
}

export function parseConf(text: string): ParsedConf {
  const stanzas = new Map<string, ConfStanza>();
  const errors: ParsedConf['errors'] = [];
  const stanza = (name: string, line: number) => {
    let s = stanzas.get(name);
    if (!s) stanzas.set(name, (s = { name, line, settings: new Map() }));
    return s;
  };
  let current = stanza('default', 0);

  const raw = text.split(/\r?\n/);
  for (let i = 0; i < raw.length; i++) {
    const lineNo = i + 1;
    let line = raw[i]!;
    // Continuation: a trailing backslash joins the next line (the newline is kept, as Splunk does).
    while (line.endsWith('\\') && i + 1 < raw.length) line = line.slice(0, -1) + '\n' + raw[++i];
    const trimmed = line.trim();
    if (trimmed === '' || trimmed.startsWith('#')) continue;
    if (trimmed.startsWith('[')) {
      const end = trimmed.lastIndexOf(']');
      if (end < 0) {
        errors.push({ line: lineNo, text: trimmed });
        continue;
      }
      current = stanza(trimmed.slice(1, end).trim(), lineNo);
      if (current.line === 0) current.line = lineNo; // an explicit [default] header after implicit settings
      continue;
    }
    const eq = line.indexOf('=');
    if (eq < 0) {
      errors.push({ line: lineNo, text: trimmed });
      continue;
    }
    const key = line.slice(0, eq).trim();
    if (!key) {
      errors.push({ line: lineNo, text: trimmed });
      continue;
    }
    current.settings.set(key, { key, value: line.slice(eq + 1).trim(), line: lineNo });
  }
  const def = stanzas.get('default')!;
  if (def.settings.size === 0 && def.line === 0) stanzas.delete('default');
  return { stanzas, errors };
}

/** Splunk's boolean parsing (true/false, 1/0, yes/no, t/f, y/n), case-insensitive. */
export function confBool(value: string | undefined, fallback = false): boolean {
  if (value === undefined) return fallback;
  const v = value.trim().toLowerCase();
  if (['true', '1', 'yes', 't', 'y', 'enabled'].includes(v)) return true;
  if (['false', '0', 'no', 'f', 'n', 'disabled'].includes(v)) return false;
  return fallback;
}
