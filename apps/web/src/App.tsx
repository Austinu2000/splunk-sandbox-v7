import { KvStorePage } from './pages/KvStorePage';
import { LearnPage } from './pages/LearnPage';
import { TrainingPage } from './pages/TrainingPage';
import { CodePage } from './pages/CodePage';
import { currentProfile, flushEnvironment } from './environment';
import { OperationsPage } from './pages/OperationsPage';
import { EnvironmentsPage } from './pages/EnvironmentsPage';
import { useEffect, useState } from 'react';
import type { McView } from '@sandbox/shared';
import { api } from './api';
import { TopBar, type Route } from './components/TopBar';
import { FleetOverview } from './pages/FleetOverview';
import { SearchPage } from './pages/SearchPage';
import { TerminalPage } from './pages/TerminalPage';
import { TicketsPage } from './pages/TicketsPage';
import { usePoll } from './usePoll';
import { MonitoringConsole, MC_TABS } from './pages/MonitoringConsole';
import { ForwarderManagement, DS_TABS, type DsTab } from './pages/ForwarderManagement';
import { InterviewPage } from './pages/InterviewPage';
import { SessionsPage } from './pages/SessionsPage';
import { InterviewBar } from './components/InterviewBar';
import { HomePage } from './replica/HomePage';
import { KnowledgePage } from './replica/KnowledgePage';
import { SettingsPage } from './replica/SettingsPage';
import { InstalledViewPage, ViewCatalog } from './replica/InstalledViewPage';
import { AppsPage, LoginPage, PreferencesPage, HelpPage, UpgradePage } from './replica/AuxiliaryPages';
import { MonitoringOverview } from './replica/MonitoringOverview';
import { initializeLocation } from './replica/navigation';

initializeLocation();
const routes: Route[] = [
  'training',
  'code',
  'learn',
  'kvstore',
  'operations',
  'environments',
  'home',
  'fleet',
  'terminal',
  'search',
  'tickets',
  'monitoring',
  'forwarders',
  'interview',
  'sessions',
  'reports',
  'alerts',
  'dashboards',
  'dashboard',
  'datasets',
  'jobs',
  'triggered-alerts',
  'analytics',
  'studio',
  'settings',
  'apps',
  'find-apps',
  'upgrade',
  'view',
  'login',
  'preferences',
  'account',
  'help',
  'catalog',
];
function parts(hash: string) {
  return hash
    .replace(/^#\/?/, '')
    .split('?')[0]!
    .split('/')
    .filter(Boolean)
    .map((p) => {
      try {
        return decodeURIComponent(p);
      } catch {
        return p;
      }
    });
}
function routeFromHash(): Route {
  const first = parts(window.location.hash)[0] as Route;
  return routes.includes(first) ? first : 'home';
}
function pageId(hash: string) {
  return (parts(hash).slice(0, 3).join('/') || 'home').toLowerCase().replace(/[^a-z0-9/_-]/g, '');
}
export function App() {
  const [saveError, setSaveError] = useState(false);
  useEffect(() => {
    const warn = () => setSaveError(true);
    window.addEventListener('environment-save-error', warn);
    return () => window.removeEventListener('environment-save-error', warn);
  }, []);
  const world = usePoll(() => api.world(), [], 2000);
  const current = usePoll(() => api.currentInterview(), [], 2000);
  const [route, setRoute] = useState<Route>(routeFromHash);
  const [hash, setHash] = useState(window.location.hash);
  const [terminalOpened, setTerminalOpened] = useState(route === 'terminal');
  const [searchOpened, setSearchOpened] = useState(route === 'search');
  useEffect(() => {
    const change = () => {
      setRoute(routeFromHash());
      setHash(window.location.hash);
      void api.logPage(pageId(window.location.hash)).catch(() => undefined);
      window.scrollTo(0, 0);
    };
    void api.logPage(pageId(window.location.hash)).catch(() => undefined);
    window.addEventListener('hashchange', change);
    return () => window.removeEventListener('hashchange', change);
  }, []);
  useEffect(() => {
    if (route === 'terminal') setTerminalOpened(true);
    if (route === 'search') setSearchOpened(true);
    document.title = `${route === 'home' ? 'Home' : route.replaceAll('-', ' ').replace(/^./, (c) => c.toUpperCase())} | Splunk v7`;
  }, [route]);
  useEffect(() => {
    if (world.data?.profileId && currentProfile()?.id !== world.data.profileId) window.location.reload();
  }, [world.data?.profileId]);
  const segments = parts(hash);
  const sub = segments[1];
  const mc = MC_TABS.map((t) => t.view).includes(sub as McView) ? (sub as McView) : undefined;
  const ds = DS_TABS.map((t) => t.tab).includes(sub as DsTab) ? (sub as DsTab) : 'clients';
  const knowledge = [
    'reports',
    'alerts',
    'dashboards',
    'dashboard',
    'datasets',
    'jobs',
    'triggered-alerts',
    'analytics',
    'studio',
  ].includes(route);
  return (
    <>
      {route !== 'login' && (
        <TopBar
          world={world.data}
          route={route}
          onClock={async (patch) => {
            await api.setClock(patch);
            await world.refresh();
          }}
        />
      )}
      {current.data?.interview && route !== 'login' && (
        <InterviewBar interview={current.data.interview} onInterviewPage={route === 'interview'} />
      )}
      {world.error && !world.data && route !== 'login' && (
        <div className="error page-error">
          Cannot reach the sandbox server ({world.error}). Start v7 to load the simulated data.
        </div>
      )}
      {saveError && (
        <div className="error page-error" role="alert">
          Your latest UI changes have not reached the server.{' '}
          <button
            onClick={() =>
              void flushEnvironment()
                .then(() => setSaveError(false))
                .catch(() => setSaveError(true))
            }
          >
            Retry saving
          </button>
        </div>
      )}
      {route === 'operations' && <OperationsPage />}
      {route === 'environments' && <EnvironmentsPage />}
      {route === 'kvstore' && <KvStorePage />}
      {route === 'learn' && <LearnPage />}
      {route === 'training' && <TrainingPage />}
      {route === 'code' && <CodePage />}
      {route === 'home' && <HomePage />}
      {route === 'login' && <LoginPage />}
      {route === 'settings' && (
        <SettingsPage key={hash} id={hash.replace(/^#\/settings\/?/, '') || 'all-configurations'} />
      )}
      {knowledge && (
        <div role={route === 'analytics' ? undefined : 'main'} tabIndex={-1}>
          <KnowledgePage section={route} id={sub} />
        </div>
      )}
      {route === 'apps' && <AppsPage />}
      {route === 'find-apps' && <AppsPage browse />}
      {route === 'account' && <PreferencesPage account />}
      {route === 'preferences' && <PreferencesPage />}
      {route === 'help' && <HelpPage />}
      {route === 'upgrade' && <UpgradePage />}
      {route === 'catalog' && <ViewCatalog />}
      {route === 'view' && (
        <InstalledViewPage key={segments.slice(1).join('/')} app={segments[1] ?? ''} id={segments[2] ?? ''} />
      )}
      {world.data && route === 'fleet' && <FleetOverview world={world.data} />}
      {world.data && route === 'tickets' && <TicketsPage world={world.data} />}
      {route === 'monitoring' && (mc ? <MonitoringConsole view={mc} /> : <MonitoringOverview />)}
      {world.data && route === 'sessions' && (
        <SessionsPage
          world={world.data}
          onWorldChanged={() => {
            window.location.reload();
          }}
        />
      )}
      {world.data && route === 'interview' && (
        <InterviewPage
          view={sub}
          current={current.data?.interview ?? null}
          onChange={() => void current.refresh()}
        />
      )}
      {world.data && route === 'forwarders' && <ForwarderManagement tab={ds} now={world.data.now} />}
      {terminalOpened && <TerminalPage visible={route === 'terminal'} />}
      {searchOpened && <SearchPage visible={route === 'search'} />}
    </>
  );
}
