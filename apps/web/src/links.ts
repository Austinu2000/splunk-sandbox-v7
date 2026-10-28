/** Hash link that opens Search & Reporting with a query (and runs it). */
export function searchHash(q: string, earliest = '-15m', latest = 'now', host?: string): string {
  return `#/search?${new URLSearchParams({ q, earliest, latest, ...(host ? { host } : {}) }).toString()}`;
}
