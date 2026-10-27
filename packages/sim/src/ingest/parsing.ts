import { setting, type MergedConf } from '../conf/merge';
import { confBool } from '../conf/parse';
import type { HostProfile } from '../hosts/profile';
import { runningConfAt } from '../hosts/running';
import type { World } from '../world';

/**
 * Index-time parsing on the receiving indexer, driven by its running props.conf/transforms.conf at
 * the time the event arrived: line merging, timestamp extraction (TIME_PREFIX, TIME_FORMAT,
 * MAX_TIMESTAMP_LOOKAHEAD, TZ) and nullQueue filtering. A small, faithful subset of Splunk's
 * pipeline; anything it doesn't model leaves the event as written.
 */

export interface ParseConfig {
  merge: boolean;
  breaker: RegExp | null;
  prefix: RegExp | null;
  format: string | null;
  lookahead: number;
  /** Minutes east of UTC from TZ, or null when unset. */
  tzOffset: number | null;
  nullQueue: RegExp[];
}

/** UTC offsets in late October 2026 (northern-hemisphere DST still in effect until the 25th/Nov 1st). */
const ZONES: Record<string, number> = {
  UTC: 0,
  GMT: 0,
  'Etc/UTC': 0,
  'America/New_York': -240,
  'US/Eastern': -240,
  'America/Chicago': -300,
  'US/Central': -300,
  'America/Denver': -360,
  'America/Los_Angeles': -420,
  'US/Pacific': -420,
  'Europe/London': 60,
  'Europe/Berlin': 120,
  'Europe/Paris': 120,
  'Asia/Tokyo': 540,
  'Asia/Kolkata': 330,
  'Australia/Sydney': 660,
};
const ABBREV: Record<string, number> = {
  Z: 0,
  UTC: 0,
  GMT: 0,
  EST: -300,
  EDT: -240,
  CST: -360,
  CDT: -300,
  MST: -420,
  MDT: -360,
  PST: -480,
  PDT: -420,
  CET: 60,
  CEST: 120,
  JST: 540,
};

export function zoneOffset(tz: string | undefined): number | null {
  if (!tz) return null;
  if (tz in ZONES) return ZONES[tz]!;
  const m = /^Etc\/GMT([+-])(\d{1,2})$/.exec(tz);
  // Etc/GMT+5 means five hours *behind* UTC (POSIX sign convention).
  return m ? (m[1] === '+' ? -1 : 1) * Number(m[2]) * 60 : null;
}

function safeRegex(src: string | undefined): RegExp | null {
  if (!src) return null;
  try {
    return new RegExp(src);
  } catch {
    return null;
  }
}

/** nullQueue transforms referenced by the sourcetype's TRANSFORMS-* settings. */
function nullQueueRegexes(props: MergedConf, transforms: MergedConf, st: string): RegExp[] {
  const stanza = props.stanzas.get(st);
  if (!stanza) return [];
  const out: RegExp[] = [];
  for (const [key, v] of stanza.settings) {
    if (!/^TRANSFORMS(-|$)/.test(key)) continue;
    for (const name of v.value.split(',').map((x) => x.trim())) {
      const tr = transforms.stanzas.get(name);
      if (!tr) continue;
      const dest = tr.settings.get('DEST_KEY')?.value;
      const fmt = tr.settings.get('FORMAT')?.value;
      const re = safeRegex(tr.settings.get('REGEX')?.value);
      if (dest === 'queue' && fmt === 'nullQueue' && re) out.push(re);
    }
  }
  return out;
}

// Merged configs are cached per running revision, so the objects themselves identify a config.
const cache = new WeakMap<MergedConf, WeakMap<MergedConf, Map<string, ParseConfig>>>();

export function parseConfig(world: World, receiver: HostProfile, st: string, t: number): ParseConfig {
  const props = runningConfAt(world, receiver, 'props', t);
  const transforms = runningConfAt(world, receiver, 'transforms', t);
  let byTransforms = cache.get(props);
  if (!byTransforms) cache.set(props, (byTransforms = new WeakMap()));
  let bySt = byTransforms.get(transforms);
  if (!bySt) byTransforms.set(transforms, (bySt = new Map()));
  let cfg = bySt.get(st);
  if (!cfg) {
    const s = (k: string) => setting(props, st, k);
    cfg = {
      merge: confBool(s('SHOULD_LINEMERGE')),
      breaker: safeRegex(s('LINE_BREAKER')),
      prefix: safeRegex(s('TIME_PREFIX')),
      format: s('TIME_FORMAT') || null,
      lookahead: Number(s('MAX_TIMESTAMP_LOOKAHEAD')) || 128,
      tzOffset: zoneOffset(s('TZ')),
      nullQueue: nullQueueRegexes(props, transforms, st),
    };
    bySt.set(st, cfg);
  }
  return cfg;
}

/** Would this event be glued onto the previous one (line merging on, breaker not matching)? */
export function mergesWithPrevious(cfg: ParseConfig, raw: string): boolean {
  if (!cfg.merge) return false;
  return !(cfg.breaker ?? /[\r\n]+/).test('\n' + raw);
}

export function nullQueued(cfg: ParseConfig, raw: string): boolean {
  return cfg.nullQueue.some((re) => re.test(raw));
}

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

/**
 * strptime for timestamp extraction: %Y %y %m %d %e %H %I %M %S %p %b %3N/%6N/%N %z %Z %s %T %F.
 * Returns epoch ms, or null if the text doesn't match the format at that position.
 */
export function parseWithFormat(text: string, format: string, tzOffset: number | null): number | null {
  let i = 0;
  const v = { Y: 1970, m: 1, d: 1, H: 0, M: 0, S: 0, ms: 0, pm: null as boolean | null };
  let zone: number | null = null;
  let epoch: number | null = null;
  const num = (min: number, max: number): number | null => {
    const m = new RegExp(`^\\d{${min},${max}}`).exec(text.slice(i));
    if (!m) return null;
    i += m[0].length;
    return Number(m[0]);
  };
  const fmt = format.replace(/%T/g, '%H:%M:%S').replace(/%F/g, '%Y-%m-%d');
  for (let f = 0; f < fmt.length; f++) {
    const c = fmt[f]!;
    if (c !== '%') {
      if (/\s/.test(c)) {
        while (/\s/.test(text[i] ?? '')) i++;
      } else if (text[i++] !== c) return null;
      continue;
    }
    let width = '';
    while (/\d/.test(fmt[f + 1] ?? '')) width += fmt[++f];
    const d = fmt[++f];
    let n: number | null;
    switch (d) {
      case 'Y':
        if ((n = num(4, 4)) === null) return null;
        v.Y = n;
        break;
      case 'y':
        if ((n = num(2, 2)) === null) return null;
        v.Y = 2000 + n;
        break;
      case 'm':
        if ((n = num(1, 2)) === null || n < 1 || n > 12) return null;
        v.m = n;
        break;
      case 'd':
      case 'e':
        while (d === 'e' && text[i] === ' ') i++;
        if ((n = num(1, 2)) === null || n < 1 || n > 31) return null;
        v.d = n;
        break;
      case 'H':
      case 'I':
        if ((n = num(1, 2)) === null || n > 23) return null;
        v.H = n;
        break;
      case 'M':
        if ((n = num(2, 2)) === null || n > 59) return null;
        v.M = n;
        break;
      case 'S':
        if ((n = num(2, 2)) === null || n > 60) return null;
        v.S = n;
        break;
      case 'N': {
        const w = Number(width) || 9;
        const m = new RegExp(`^\\d{1,${w}}`).exec(text.slice(i));
        if (!m) return null;
        i += m[0].length;
        v.ms = Math.floor(Number(m[0].padEnd(3, '0').slice(0, 3)));
        break;
      }
      case 'p': {
        const m = /^(AM|PM)/i.exec(text.slice(i));
        if (!m) return null;
        i += 2;
        v.pm = m[1]!.toUpperCase() === 'PM';
        break;
      }
      case 'b': {
        const idx = MONTHS.indexOf(text.slice(i, i + 3).toLowerCase());
        if (idx < 0) return null;
        i += 3;
        v.m = idx + 1;
        break;
      }
      case 'z': {
        const m = /^(Z|[+-]\d{2}:?\d{2})/.exec(text.slice(i));
        if (!m) return null;
        i += m[0].length;
        zone =
          m[1] === 'Z'
            ? 0
            : (m[1]![0] === '-' ? -1 : 1) * (Number(m[1]!.slice(1, 3)) * 60 + Number(m[1]!.slice(-2)));
        break;
      }
      case 'Z': {
        const m = /^[A-Za-z]{1,5}/.exec(text.slice(i));
        if (!m || !(m[0].toUpperCase() in ABBREV)) return null;
        i += m[0].length;
        zone = ABBREV[m[0].toUpperCase()]!;
        break;
      }
      case 's':
        if ((n = num(9, 11)) === null) return null;
        epoch = n * 1000;
        break;
      case '%':
        if (text[i++] !== '%') return null;
        break;
      default:
        return null;
    }
  }
  if (epoch !== null) return epoch;
  if (v.pm !== null) v.H = (v.H % 12) + (v.pm ? 12 : 0);
  const local = Date.UTC(v.Y, v.m - 1, v.d, v.H, v.M, v.S, v.ms);
  return local - (zone ?? tzOffset ?? 0) * 60_000;
}

/**
 * The event's _time as the receiver extracts it, or null to keep the time it was written
 * (no TIME_FORMAT configured, or the format doesn't match). Splunk would fall back to a nearby
 * timestamp in that case; keeping the write time is the closest equivalent here.
 */
export function extractTime(cfg: ParseConfig, raw: string): number | null {
  if (!cfg.format) return null;
  let start = 0;
  if (cfg.prefix) {
    const m = cfg.prefix.exec(raw);
    if (!m) return null;
    start = m.index + m[0].length;
  }
  return parseWithFormat(raw.slice(start, start + Math.max(cfg.lookahead, 64)), cfg.format, cfg.tzOffset);
}

/** Largest time shift any TZ setting could cause, for widening scan windows. */
export const MAX_SHIFT_MS = 14 * 3_600_000;
