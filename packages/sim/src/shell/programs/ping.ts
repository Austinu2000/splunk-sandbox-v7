import type { HostProfile } from '../../hosts/profile';
import { rttMs } from '../commands/system';
import type { Shell } from '../shell';
import type { Program, ProgramHost } from '../types';

export function pingReply(to: HostProfile, seq: number, rtt: number): string {
  return `64 bytes from ${to.fqdn} (${to.ip}): icmp_seq=${seq} ttl=64 time=${rtt < 10 ? rtt.toFixed(3) : rtt.toFixed(1)} ms\n`;
}

export function pingSummary(to: HostProfile, sent: number, rtts: number[]): string {
  const loss = sent ? Math.round(((sent - rtts.length) / sent) * 100) : 0;
  let out = `\n--- ${to.fqdn} ping statistics ---\n${sent} packets transmitted, ${rtts.length} received, ${loss}% packet loss, time ${Math.max(0, sent - 1) * 1001}ms\n`;
  if (rtts.length) {
    const min = Math.min(...rtts);
    const max = Math.max(...rtts);
    const avg = rtts.reduce((a, b) => a + b, 0) / rtts.length;
    const mdev = Math.sqrt(rtts.reduce((s, r) => s + (r - avg) ** 2, 0) / rtts.length);
    out += `rtt min/avg/max/mdev = ${[min, avg, max, mdev].map((v) => v.toFixed(3)).join('/')} ms\n`;
  }
  return out;
}

/** `ping host` without -c: one reply per real second until Ctrl-C. */
export function pingProgram(sh: Shell, to: HostProfile): Program {
  let host: ProgramHost;
  let seq = 0;
  const rtts: number[] = [];
  const next = () => {
    seq++;
    const r = rttMs(sh.world, sh.host, to, seq);
    rtts.push(r);
    host.write(pingReply(to, seq, r));
    host.schedule(1000, next);
  };
  return {
    start(h) {
      host = h;
      host.write(`PING ${to.fqdn} (${to.ip}) 56(84) bytes of data.\n`);
      next();
    },
    key(k) {
      if (k.name === 'ctrl' && k.ch === 'c') {
        host.write('^C' + pingSummary(to, seq, rtts));
        host.exit(rtts.length ? 0 : 1);
      }
    },
  };
}
