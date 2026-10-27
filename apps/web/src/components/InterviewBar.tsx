import { useEffect, useState } from 'react';
import type { InterviewDto } from '@sandbox/shared';

/** mm:ss (or h:mm:ss) for a number of seconds. */
export function fmtDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const pad = (n: number) => String(n).padStart(2, '0');
  return h ? `${h}:${pad(m)}:${pad(s % 60)}` : `${pad(m)}:${pad(s % 60)}`;
}

/** Wall-clock time left (negative once over), ticking every second. */
export function useCountdown(deadline: number | undefined): number {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (deadline === undefined) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [deadline]);
  return deadline === undefined ? 0 : Math.round((deadline - now) / 1000);
}

export function Countdown({ deadline, large }: { deadline: number; large?: boolean }) {
  const left = useCountdown(deadline);
  const cls = left < 0 ? 'over' : left < 120 ? 'low' : '';
  return (
    <span className={`countdown ${cls} ${large ? 'large' : ''}`} role="timer" aria-live="off">
      {left < 0 ? `+${fmtDuration(-left)} over` : `${fmtDuration(left)} left`}
    </span>
  );
}

/** Shown on every page while an interview runs, so the clock and prompt follow you around. */
export function InterviewBar({
  interview,
  onInterviewPage,
}: {
  interview: InterviewDto;
  onInterviewPage: boolean;
}) {
  return (
    <div className="interview-bar" role="region" aria-label="Interview in progress">
      <span className="iv-badge">Interview {interview.id}</span>
      <span className="iv-prompt" title={interview.prompt}>
        {interview.prompt}
      </span>
      <Countdown deadline={interview.deadline} />
      {!onInterviewPage && (
        <a className="iv-open" href="#/interview">
          Notes &amp; answer
        </a>
      )}
    </div>
  );
}
