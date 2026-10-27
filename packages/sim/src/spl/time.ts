/**
 * Splunk time modifiers: `now`, epoch seconds, `0` (all time), relative offsets with optional
 * snapping (`-24h`, `-1d@d`, `@w1`, `-1d@d+8h`), and absolute `%m/%d/%Y:%H:%M:%S`.
 * All times here are epoch milliseconds in UTC.
 */

const UNITS: [RegExp, string][] = [
  [/^(s|sec|secs|second|seconds)$/, 's'],
  [/^(m|min|mins|minute|minutes)$/, 'm'],
  [/^(h|hr|hrs|hour|hours)$/, 'h'],
  [/^(d|day|days)$/, 'd'],
  [/^(w|week|weeks)$/, 'w'],
  [/^(mon|month|months)$/, 'mon'],
  [/^(q|qtr|qtrs|quarter|quarters)$/, 'q'],
  [/^(y|yr|yrs|year|years)$/, 'y'],
];

function unitOf(u: string): string | null {
  for (const [re, name] of UNITS) if (re.test(u.toLowerCase())) return name;
  return null;
}

function add(t: number, n: number, unit: string): number {
  const d = new Date(t);
  switch (unit) {
    case 's':
      return t + n * 1000;
    case 'm':
      return t + n * 60_000;
    case 'h':
      return t + n * 3_600_000;
    case 'd':
      return t + n * 86_400_000;
    case 'w':
      return t + n * 7 * 86_400_000;
    case 'mon':
      d.setUTCMonth(d.getUTCMonth() + n);
      return d.getTime();
    case 'q':
      d.setUTCMonth(d.getUTCMonth() + 3 * n);
      return d.getTime();
    case 'y':
      d.setUTCFullYear(d.getUTCFullYear() + n);
      return d.getTime();
  }
  return t;
}

function snap(t: number, unit: string, weekday?: number): number {
  const d = new Date(t);
  switch (unit) {
    case 's':
      return Math.floor(t / 1000) * 1000;
    case 'm':
      return Math.floor(t / 60_000) * 60_000;
    case 'h':
      return Math.floor(t / 3_600_000) * 3_600_000;
    case 'd':
      return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
    case 'w': {
      const day = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
      const back = (d.getUTCDay() - (weekday ?? 0) + 7) % 7;
      return day - back * 86_400_000;
    }
    case 'mon':
      return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1);
    case 'q':
      return Date.UTC(d.getUTCFullYear(), Math.floor(d.getUTCMonth() / 3) * 3, 1);
    case 'y':
      return Date.UTC(d.getUTCFullYear(), 0, 1);
  }
  return t;
}

/** Returns epoch ms, or null if the modifier is invalid. */
export function parseTime(spec: string, now: number): number | null {
  const s = spec.trim();
  if (s === '' || s.toLowerCase() === 'now') return now;
  if (/^\d+(\.\d+)?$/.test(s)) return Number(s) * 1000;
  const abs = /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?::(\d{1,2}):(\d{2}):(\d{2}))?$/.exec(s);
  if (abs) return Date.UTC(+abs[3]!, +abs[1]! - 1, +abs[2]!, +(abs[4] ?? 0), +(abs[5] ?? 0), +(abs[6] ?? 0));

  let t = now;
  let rest = s;
  // Leading offset, then any number of @snap and +/- offsets.
  while (rest.length) {
    const off = /^([+-])(\d*)([a-zA-Z]+)/.exec(rest);
    if (off) {
      const unit = unitOf(off[3]!);
      if (!unit) return null;
      const n = off[2] === '' ? 1 : Number(off[2]);
      t = add(t, off[1] === '-' ? -n : n, unit);
      rest = rest.slice(off[0].length);
      continue;
    }
    const sn = /^@([a-zA-Z]+?)(\d)?(?=$|[+-])/.exec(rest);
    if (sn) {
      const unit = unitOf(sn[1]!);
      if (!unit) return null;
      t = snap(t, unit, sn[2] !== undefined ? Number(sn[2]) : undefined);
      rest = rest.slice(sn[0].length);
      continue;
    }
    return null;
  }
  return t;
}

const pad = (n: number, w = 2) => String(n).padStart(w, '0');
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** strftime subset over epoch seconds (UTC). */
export function strftime(seconds: number, fmt: string): string {
  const ms = seconds * 1000;
  const d = new Date(ms);
  const H = d.getUTCHours();
  return fmt.replace(/%(\d?)([a-zA-Z%])/g, (m, digits: string, c: string) => {
    switch (c) {
      case 'Y':
        return String(d.getUTCFullYear());
      case 'y':
        return pad(d.getUTCFullYear() % 100);
      case 'm':
        return pad(d.getUTCMonth() + 1);
      case 'd':
        return pad(d.getUTCDate());
      case 'e':
        return String(d.getUTCDate()).padStart(2, ' ');
      case 'H':
        return pad(H);
      case 'I':
        return pad(H % 12 || 12);
      case 'M':
        return pad(d.getUTCMinutes());
      case 'S':
        return pad(d.getUTCSeconds());
      case 'N':
        return pad(d.getUTCMilliseconds(), 3).slice(0, Number(digits) || 3);
      case 'p':
        return H < 12 ? 'AM' : 'PM';
      case 'b':
        return MONTHS[d.getUTCMonth()]!;
      case 'B':
        return new Date(ms).toLocaleString('en-US', { month: 'long', timeZone: 'UTC' });
      case 'a':
        return DAYS[d.getUTCDay()]!;
      case 'A':
        return new Date(ms).toLocaleString('en-US', { weekday: 'long', timeZone: 'UTC' });
      case 'j':
        return pad(Math.floor((ms - Date.UTC(d.getUTCFullYear(), 0, 1)) / 86_400_000) + 1, 3);
      case 's':
        return String(Math.floor(seconds));
      case 'F':
        return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
      case 'T':
        return `${pad(H)}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
      case 'Z':
        return 'UTC';
      case 'z':
        return '+0000';
      case '%':
        return '%';
      default:
        return m;
    }
  });
}

/** strptime for the common numeric formats (%Y %m %d %H %M %S, with literal separators). */
export function strptime(text: string, fmt: string): number | null {
  const fields: string[] = [];
  const re = fmt.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/%([YmdHMSyb])/g, (_, c: string) => {
    fields.push(c);
    return c === 'Y' ? '(\\d{4})' : c === 'b' ? '([A-Za-z]{3})' : '(\\d{1,2})';
  });
  const m = new RegExp(`^${re}`).exec(text.trim());
  if (!m) return null;
  const v: Record<string, number> = { Y: 1970, m: 1, d: 1, H: 0, M: 0, S: 0 };
  fields.forEach((f, i) => {
    const g = m[i + 1]!;
    if (f === 'b') v.m = MONTHS.indexOf(g) + 1;
    else if (f === 'y') v.Y = 2000 + Number(g);
    else v[f] = Number(g);
  });
  return Date.UTC(v.Y!, v.m! - 1, v.d!, v.H!, v.M!, v.S!) / 1000;
}

/** Automatic timechart span for a time range, like Splunk's defaults. */
export function autoSpanMs(rangeMs: number): number {
  const steps: [number, number][] = [
    [15 * 60_000, 10_000],
    [60 * 60_000, 60_000],
    [4 * 3_600_000, 5 * 60_000],
    [24 * 3_600_000, 30 * 60_000],
    [7 * 86_400_000, 3_600_000],
  ];
  for (const [limit, span] of steps) if (rangeMs <= limit) return span;
  return 86_400_000;
}

/** Parses timechart/bin span text: 10s, 5m, 1h, 1d. */
export function parseSpan(text: string): number | null {
  const m = /^(\d+)([a-zA-Z]+)$/.exec(text.trim());
  if (!m) return null;
  const unit = unitOf(m[2]!);
  const n = Number(m[1]);
  const per: Record<string, number> = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000, w: 7 * 86_400_000 };
  return unit && per[unit] ? n * per[unit]! : null;
}
