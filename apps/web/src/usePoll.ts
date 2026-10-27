import { useCallback, useEffect, useRef, useState } from 'react';

/** Fetches now and then every `intervalMs`, refetching immediately when `deps` change. Stale responses are dropped. */
export function usePoll<T>(fetcher: () => Promise<T>, deps: unknown[], intervalMs = 5000) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const seq = useRef(0);

  // The caller's deps decide when the fetcher identity changes.
  const run = useCallback(fetcher, deps);

  const refresh = useCallback(async () => {
    const id = ++seq.current;
    try {
      const result = await run();
      if (id === seq.current) {
        setData(result);
        setError(null);
      }
    } catch (e) {
      if (id === seq.current) setError((e as Error).message);
    }
  }, [run]);

  useEffect(() => {
    void refresh();
    const timer = setInterval(() => void refresh(), intervalMs);
    return () => clearInterval(timer);
  }, [refresh, intervalMs]);

  return { data, error, refresh };
}
