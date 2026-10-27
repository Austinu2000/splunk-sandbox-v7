import type { EnvironmentProfileDto } from '@sandbox/shared';
let profile: EnvironmentProfileDto | null = null;
let state: Record<string, string> = {};
let timer: ReturnType<typeof setTimeout> | undefined;
let revision = 0;
let savedRevision = 0;
let pending: Promise<void> = Promise.resolve();
export const currentProfile = () => profile;
export async function initializeEnvironment(): Promise<void> {
  const response = await fetch('/api/profile');
  if (!response.ok) throw new Error('Could not load the environment');
  const body = (await response.json()) as { profile: EnvironmentProfileDto; uiState: Record<string, string> };
  profile = body.profile;
  state = body.uiState;
  window.addEventListener('pagehide', () => {
    if (revision === savedRevision) return;
    navigator.sendBeacon(
      '/api/profile/ui',
      new Blob([JSON.stringify({ profileId: profile!.id, state })], { type: 'application/json' }),
    );
  });
}
export function flushEnvironment(): Promise<void> {
  clearTimeout(timer);
  pending = pending
    .catch(() => undefined)
    .then(async () => {
      if (!profile || revision === savedRevision) return;
      const rev = revision;
      const res = await fetch('/api/profile/ui', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ profileId: profile.id, state }),
      });
      if (!res.ok)
        throw new Error('Your environment changes could not be saved. Please retry before switching.');
      savedRevision = rev;
    });
  return pending;
}
function changed() {
  clearTimeout(timer);
  revision++;
  timer = setTimeout(
    () => void flushEnvironment().catch(() => window.dispatchEvent(new Event('environment-save-error'))),
    500,
  );
}
export const profileStorage = {
  getItem(key: string): string | null {
    return profile ? (state[key] ?? null) : localStorage.getItem(key);
  },
  setItem(key: string, value: string): void {
    if (!profile) {
      localStorage.setItem(key, value);
      return;
    }
    state[key] = value;
    changed();
  },
  removeItem(key: string): void {
    if (!profile) {
      localStorage.removeItem(key);
      return;
    }
    delete state[key];
    changed();
  },
};
