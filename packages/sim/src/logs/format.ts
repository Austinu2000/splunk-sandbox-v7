const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const p2 = (n: number) => String(n).padStart(2, '0');
const p3 = (n: number) => String(n).padStart(3, '0');

/** splunkd.log / metrics.log style: 10-23-2026 08:00:21.123 +0000 */
export function splunkTs(ms: number): string {
  const d = new Date(ms);
  return `${p2(d.getUTCMonth() + 1)}-${p2(d.getUTCDate())}-${d.getUTCFullYear()} ${p2(d.getUTCHours())}:${p2(
    d.getUTCMinutes(),
  )}:${p2(d.getUTCSeconds())}.${p3(d.getUTCMilliseconds())} +0000`;
}

/** syslog style: Oct 23 08:00:21 */
export function syslogTs(ms: number): string {
  const d = new Date(ms);
  return `${MONTHS[d.getUTCMonth()]} ${String(d.getUTCDate()).padStart(2, ' ')} ${p2(d.getUTCHours())}:${p2(
    d.getUTCMinutes(),
  )}:${p2(d.getUTCSeconds())}`;
}

/** ISO 8601 with milliseconds: 2026-10-23T08:00:21.123Z */
export function isoTs(ms: number): string {
  return new Date(ms).toISOString();
}

/** date(1) style: Thu Oct 23 08:00:21 UTC 2026 */
export function dateCmd(ms: number): string {
  const d = new Date(ms);
  return `${DAYS[d.getUTCDay()]} ${MONTHS[d.getUTCMonth()]} ${String(d.getUTCDate()).padStart(2, ' ')} ${p2(
    d.getUTCHours(),
  )}:${p2(d.getUTCMinutes())}:${p2(d.getUTCSeconds())} UTC ${d.getUTCFullYear()}`;
}

/** "Last login" style: Thu Oct 23 08:00:21 2026 */
export function lastLoginTs(ms: number): string {
  const d = new Date(ms);
  return `${DAYS[d.getUTCDay()]} ${MONTHS[d.getUTCMonth()]} ${String(d.getUTCDate()).padStart(2, ' ')} ${p2(
    d.getUTCHours(),
  )}:${p2(d.getUTCMinutes())}:${p2(d.getUTCSeconds())} ${d.getUTCFullYear()}`;
}

/** ls -l style: "Oct 23 08:00" for recent files, "Mar  4  2026" for files older than six months. */
export function lsTime(ms: number, now: number): string {
  const d = new Date(ms);
  const day = String(d.getUTCDate()).padStart(2, ' ');
  if (now - ms > 182 * 86_400_000 || ms > now + 3_600_000)
    return `${MONTHS[d.getUTCMonth()]} ${day}  ${d.getUTCFullYear()}`;
  return `${MONTHS[d.getUTCMonth()]} ${day} ${p2(d.getUTCHours())}:${p2(d.getUTCMinutes())}`;
}

/** HH:MM:SS of a time of day. */
export function clockTime(ms: number): string {
  const d = new Date(ms);
  return `${p2(d.getUTCHours())}:${p2(d.getUTCMinutes())}:${p2(d.getUTCSeconds())}`;
}
