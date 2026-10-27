import { useCallback, useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { api, type RosterEntry } from '../api';

type Status = 'connecting' | 'connected' | 'closed';

const ROLE_LABEL: Record<string, string> = {
  automation: 'Automation control node',
  deployer: 'SHC deployer',
  monitoring_console: 'Monitoring Console',
  deployment_server: 'Deployment server',
  indexer: 'Indexer',
  universal_forwarder: 'Universal forwarder',
  search_head: 'Search head',
  cluster_manager: 'Cluster manager',
  license_manager: 'License manager',
  heavy_forwarder: 'Heavy forwarder',
};

const TIPS = [
  ['ssh splunk@ds01', 'log in from the bastion'],
  ['sudo -i', 'root shell (splunk has NOPASSWD sudo)'],
  ['tail -f $SPLUNK_HOME/var/log/splunk/splunkd.log', 'follow a live log; Ctrl-C stops'],
  ["grep -i warn splunkd.log | awk '{print $5}' | sort | uniq -c", 'pipes work'],
  ['vi / nano / less', 'full-screen editor and pager'],
  ['exit', 'back to the previous host'],
];

/** The simulated terminal. Kept mounted while hidden so the session survives page switches. */
export function TerminalPage({ visible }: { visible: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const term = useRef<Terminal | null>(null);
  const fit = useRef<FitAddon | null>(null);
  const ws = useRef<WebSocket | null>(null);
  const [status, setStatus] = useState<Status>('connecting');
  const [location, setLocation] = useState('engineer@bastion01');
  const [roster, setRoster] = useState<RosterEntry[]>([]);
  const [generation, setGeneration] = useState(0);

  useEffect(() => {
    api.roster().then(setRoster, () => setRoster([]));
  }, []);

  useEffect(() => {
    const t = new Terminal({
      cursorBlink: true,
      fontFamily: 'Menlo, Consolas, "Liberation Mono", monospace',
      fontSize: 13,
      scrollback: 5000,
      theme: {
        background: '#101418',
        foreground: '#d8dee4',
        cursor: '#5cc05c',
        selectionBackground: '#3a4652',
      },
    });
    const f = new FitAddon();
    t.loadAddon(f);
    t.open(host.current!);
    term.current = t;
    fit.current = f;
    const ro = new ResizeObserver(() => {
      if (host.current?.offsetParent === null) return;
      f.fit();
      const socket = ws.current;
      if (socket?.readyState === WebSocket.OPEN)
        socket.send(JSON.stringify({ type: 'resize', cols: t.cols, rows: t.rows }));
    });
    ro.observe(host.current!);
    const input = t.onData((data) => {
      const socket = ws.current;
      if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: 'input', data }));
    });
    return () => {
      input.dispose();
      ro.disconnect();
      if (term.current === t) term.current = null;
      // xterm queues a setTimeout(0) during open(); disposing synchronously (React dev double-mount) races it.
      setTimeout(() => t.dispose(), 0);
    };
  }, []);

  useEffect(() => {
    const t = term.current;
    if (!t) return;
    try {
      fit.current?.fit();
    } catch {
      // Not laid out yet; the resize observer will fit later.
    }
    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const socket = new WebSocket(`${proto}://${window.location.host}/ws/term?cols=${t.cols}&rows=${t.rows}`);
    ws.current = socket;
    // Events from a socket this effect already replaced (React dev double-mount, reconnect) are ignored.
    const live = () => ws.current === socket && term.current === t;
    setStatus('connecting');
    socket.onopen = () => live() && setStatus('connected');
    socket.onmessage = (ev) => {
      if (!live()) return;
      const msg = JSON.parse(ev.data as string);
      if (msg.type === 'output') t.write(msg.data);
      else if (msg.type === 'location') setLocation(`${msg.user}@${msg.host}`);
    };
    socket.onclose = (ev) => {
      if (!live()) return;
      setStatus('closed');
      // 4000: the server loaded a saved session or reset the world; this shell belonged to the old one.
      t.write(
        ev.code === 4000
          ? '\r\n\x1b[33m[the world was replaced (session loaded or reset): reconnect for a new shell]\x1b[0m\r\n'
          : '\r\n\x1b[33m[disconnected from the sandbox server]\x1b[0m\r\n',
      );
    };
    return () => {
      if (ws.current === socket) ws.current = null;
      // Closing while still connecting logs a browser warning; close as soon as it opens instead.
      if (socket.readyState === WebSocket.CONNECTING) socket.onopen = () => socket.close();
      else socket.close();
    };
  }, [generation]);

  useEffect(() => {
    if (!visible) return;
    requestAnimationFrame(() => {
      fit.current?.fit();
      term.current?.focus();
    });
  }, [visible]);

  const typeCommand = useCallback((cmd: string) => {
    const socket = ws.current;
    if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: 'input', data: cmd }));
    term.current?.focus();
  }, []);

  return (
    <main className="terminal-page" style={{ display: visible ? undefined : 'none' }}>
      <section className="terminal-panel">
        <div className="terminal-bar">
          <span className={`conn-dot ${status}`} />
          <span className="mono">
            {status === 'connected' ? location : status === 'connecting' ? 'connecting…' : 'disconnected'}
          </span>
          <span className="terminal-note">Simulated shell — nothing runs on your machine</span>
          {status === 'closed' && (
            <button className="sys-btn light" onClick={() => setGeneration((g) => g + 1)}>
              Reconnect
            </button>
          )}
        </div>
        <div className="terminal-host" ref={host} />
      </section>
      <aside className="terminal-side">
        <h2>Hosts</h2>
        <p className="side-hint">Click to type the ssh command (from the bastion).</p>
        <ul className="roster">
          {roster.map((r) => (
            <li key={r.hostname}>
              <button
                onClick={() =>
                  typeCommand(`ssh ${r.role === 'automation' ? 'svc_ansible' : 'splunk'}@${r.hostname}`)
                }
                title={`ssh ${r.role === 'automation' ? 'svc_ansible' : 'splunk'}@${r.hostname}`}
              >
                <span className="mono">{r.hostname}</span>
                {r.detailed && <span className="badge">detailed</span>}
                <span className="role">
                  {ROLE_LABEL[r.role] ?? r.role} · {r.site}
                </span>
              </button>
            </li>
          ))}
        </ul>
        <p className="side-hint">
          Online Linux forwarders accept SSH. Find their names in Fleet Overview. Windows forwarders don't run
          sshd.
        </p>
        {roster.some((r) => r.role === 'automation') && (
          <>
            <h2>Git practice</h2>
            <p className="side-hint">
              Log in as svc_ansible, then open ~/splunk-automation or ~/splunk-apps. Git changes are saved
              with this environment.
            </p>
            <ul className="tips">
              <li>
                <code>ssh svc_ansible@ansible01</code>
                <span>open the automation workspace</span>
              </li>
              <li>
                <code>cd ~/splunk-automation</code>
                <span>enter the repository</span>
              </li>
              <li>
                <code>git status</code>
                <span>see staged and unstaged changes</span>
              </li>
              <li>
                <code>git log --oneline</code>
                <span>read commit history</span>
              </li>
            </ul>
            <p className="side-hint">
              Use Code & Ansible for reviews, checks, deployment and playbook runs. Learn opens saved
              lesson sessions with instructions beside this terminal.
            </p>
          </>
        )}
        <h2>Try</h2>
        <ul className="tips">
          {TIPS.map(([cmd, what]) => (
            <li key={cmd}>
              <code>{cmd}</code>
              <span>{what}</span>
            </li>
          ))}
        </ul>
      </aside>
    </main>
  );
}
