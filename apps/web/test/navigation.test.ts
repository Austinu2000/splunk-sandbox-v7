import { describe, expect, it } from 'vitest';
import { nativePathToHash, viewHref } from '../src/replica/navigation';
import { settingsGroups } from '../src/replica/settingsCatalog';

describe('Splunk route compatibility', () => {
  it('preserves native search query and time parameters', () => {
    expect(
      nativePathToHash('/en-US/app/search/search', '?q=index%3D_internal&earliest=-24h&latest=now'),
    ).toBe('#/search?q=index%3D_internal&earliest=-24h&latest=now');
  });
  it('resolves manager pages in any app namespace', () => {
    expect(nativePathToHash('/en-US/manager/launcher/authentication/users')).toBe('#/settings/users');
    expect(nativePathToHash('/en-US/manager/splunk-dashboard-studio/data/indexes')).toBe(
      '#/settings/indexes',
    );
  });
  it('covers every captured Settings menu target', () => {
    for (const item of settingsGroups.flatMap((g) => g.items))
      expect(nativePathToHash(item.sourcePath), item.label).toBe(item.href);
  });
  it('keeps installed app views distinct and uses known working pages', () => {
    expect(viewHref('search', 'search')).toBe('#/search');
    expect(viewHref('splunk_monitoring_console', 'monitoringconsole_overview')).toBe('#/monitoring');
    expect(viewHref('custom', 'search')).toBe('#/view/custom/search');
    expect(nativePathToHash('/en-US/account/login')).toBe('#/login');
    expect(nativePathToHash('/en-US/manager/launcher/apps/local')).toBe('#/apps');
    expect(nativePathToHash('/unknown')).toBeNull();
  });
});
