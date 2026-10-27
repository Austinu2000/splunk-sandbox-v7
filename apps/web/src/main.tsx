import { initializeEnvironment } from './environment';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles.css';
import './replica/replica.css';

async function start() {
  await initializeEnvironment();
  if (!localStorage.getItem('splunk-v6-environment-selected')) window.location.hash = '#/environments';
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
void start().catch(() => {
  document.getElementById('root')!.textContent = 'Unable to reach v6. Start the server and reload this page.';
});
