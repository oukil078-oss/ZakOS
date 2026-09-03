import React, { useState, useEffect, useRef } from 'react';
import {
  Terminal as TerminalIcon,
  Play,
  Square,
  RefreshCw,
  Folder,
  Globe,
  Trash2,
  Copy,
  Check,
  Zap,
  Activity,
  Layers,
  ChevronRight,
  Sparkles,
  Server,
  ArrowUp,
  ArrowDown,
  CornerDownLeft
} from 'lucide-react';
import { ProjectInfo, CodeExecutionResult } from '../../types';
import { api } from '../../services/api';

interface TacticalTerminalViewProps {
  projects: ProjectInfo[];
  activeProjectId?: string;
  onOpenProjectInIde?: (project: ProjectInfo) => void;
}

interface CommandHistoryItem {
  id: string;
  command: string;
  cwd: string;
  timestamp: string;
  result?: CodeExecutionResult;
  isExecuting?: boolean;
}

export const TacticalTerminalView: React.FC<TacticalTerminalViewProps> = ({
  projects,
  activeProjectId,
  onOpenProjectInIde,
}) => {
  // Selected project / working directory
  const [selectedProject, setSelectedProject] = useState<ProjectInfo | null>(() => {
    if (activeProjectId) {
      return projects.find((p) => p.id === activeProjectId) || projects[0] || null;
    }
    return projects[0] || null;
  });

  const [customCwd, setCustomCwd] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'shell' | 'daemons' | 'cheatsheet'>('shell');

  // Interactive Prompt & History
  const [inputCommand, setInputCommand] = useState('');
  const [historyItems, setHistoryItems] = useState<CommandHistoryItem[]>([]);
  const [sentCommands, setSentCommands] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [isExecuting, setIsExecuting] = useState(false);

  // Background Daemons
  const [activeServers, setActiveServers] = useState<any[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync selected project with activeProjectId prop if changed
  useEffect(() => {
    if (activeProjectId) {
      const proj = projects.find((p) => p.id === activeProjectId);
      if (proj) {
        setSelectedProject(proj);
        setCustomCwd(proj.path);
      }
    } else if (projects.length > 0 && !selectedProject) {
      setSelectedProject(projects[0]);
      setCustomCwd(projects[0].path);
    }
  }, [activeProjectId, projects]);

  // Set default cwd on mount
  useEffect(() => {
    if (selectedProject && !customCwd) {
      setCustomCwd(selectedProject.path);
    }
  }, [selectedProject]);

  // Poll active daemons
  const refreshServers = async () => {
    try {
      const servers = await api.getActiveServers();
      setActiveServers(servers);
    } catch (e) {
      console.error('Failed to fetch active servers', e);
    }
  };

  useEffect(() => {
    refreshServers();
    const interval = setInterval(refreshServers, 3000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll to bottom of command history
  useEffect(() => {
    if (activeTab === 'shell') {
      terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [historyItems, isExecuting, activeTab]);

  const effectiveCwd = customCwd.trim() || selectedProject?.path || '';

  // Execute PowerShell command
  const handleRunCommand = async (cmdToRun?: string) => {
    const cmd = (cmdToRun || inputCommand).trim();
    if (!cmd || isExecuting) return;

    // Check for local 'clear' or 'cls'
    if (cmd.toLowerCase() === 'clear' || cmd.toLowerCase() === 'cls') {
      setHistoryItems([]);
      setInputCommand('');
      setHistoryIndex(-1);
      return;
    }

    const itemCwd = effectiveCwd;
    const itemId = `cmd-${Date.now()}`;
    const newItem: CommandHistoryItem = {
      id: itemId,
      command: cmd,
      cwd: itemCwd,
      timestamp: new Date().toLocaleTimeString(),
      isExecuting: true,
    };

    setHistoryItems((prev) => [...prev, newItem]);
    setSentCommands((prev) => [cmd, ...prev.filter((c) => c !== cmd)]);
    setInputCommand('');
    setHistoryIndex(-1);
    setIsExecuting(true);

    try {
      const result = await api.executeTerminalCommand(cmd, itemCwd);
      setHistoryItems((prev) =>
        prev.map((item) => (item.id === itemId ? { ...item, result, isExecuting: false } : item))
      );
      refreshServers();
    } catch (err: any) {
      setHistoryItems((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? {
                ...item,
                isExecuting: false,
                result: {
                  stdout: '',
                  stderr: err.message || 'Execution error',
                  exitCode: 1,
                  executionTimeMs: 0,
                  language: 'powershell',
                },
              }
            : item
        )
      );
    } finally {
      setIsExecuting(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  // Keyboard navigation for command history
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (sentCommands.length === 0) return;
      const nextIdx = Math.min(historyIndex + 1, sentCommands.length - 1);
      setHistoryIndex(nextIdx);
      setInputCommand(sentCommands[nextIdx]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const nextIdx = historyIndex - 1;
        setHistoryIndex(nextIdx);
        setInputCommand(sentCommands[nextIdx]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInputCommand('');
      }
    }
  };

  const handleStopServer = async (pid: number) => {
    try {
      await api.stopBackgroundServer(pid);
      await refreshServers();
    } catch (e) {
      console.error('Failed to stop server', e);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="w-full h-full flex flex-col bg-space-950 text-slate-100 font-mono text-xs overflow-hidden select-text relative">
      {/* Top HUD Control Bar */}
      <div className="p-3 bg-space-900/90 border-b border-cyan-500/20 flex flex-wrap items-center justify-between gap-3 shrink-0 backdrop-blur-md">
        {/* Left: Title & Mode Tabs */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <TerminalIcon className="w-5 h-5 text-emerald-400 animate-pulse" />
            <span className="font-display font-bold text-sm tracking-wider text-white">
              TACTICAL TERMINAL // CYBER SHELL
            </span>
          </div>

          <div className="flex rounded-lg bg-space-950 p-0.5 border border-slate-800">
            <button
              onClick={() => setActiveTab('shell')}
              className={`px-3 py-1 rounded text-xs font-bold transition flex items-center space-x-1.5 ${
                activeTab === 'shell'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TerminalIcon className="w-3.5 h-3.5" />
              <span>INTERACTIVE POWERSHELL</span>
            </button>
            <button
              onClick={() => setActiveTab('daemons')}
              className={`px-3 py-1 rounded text-xs font-bold transition flex items-center space-x-1.5 ${
                activeTab === 'daemons'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>ACTIVE DAEMONS ({activeServers.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('cheatsheet')}
              className={`px-3 py-1 rounded text-xs font-bold transition flex items-center space-x-1.5 ${
                activeTab === 'cheatsheet'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>COMMAND MATRIX</span>
            </button>
          </div>
        </div>

        {/* Right: Workspace Directory Selector */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 bg-space-950 px-2 py-1 rounded border border-slate-800">
            <Folder className="w-3.5 h-3.5 text-cyan-400" />
            <select
              value={selectedProject?.id || ''}
              onChange={(e) => {
                const p = projects.find((proj) => proj.id === e.target.value);
                if (p) {
                  setSelectedProject(p);
                  setCustomCwd(p.path);
                }
              }}
              className="bg-transparent text-slate-200 text-xs font-mono focus:outline-none cursor-pointer max-w-xs truncate"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id} className="bg-space-900 text-white">
                  {p.title} ({p.path})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setHistoryItems([])}
            className="px-2.5 py-1 rounded bg-space-900 hover:bg-space-800 border border-slate-800 text-slate-400 hover:text-white flex items-center space-x-1 transition"
            title="Clear Console History"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>CLEAR</span>
          </button>
        </div>
      </div>

      {/* Main Terminal Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* VIEW 1: Interactive Shell */}
        {activeTab === 'shell' && (
          <div className="flex-1 flex flex-col overflow-hidden bg-space-950">
            {/* Quick Command Chips */}
            <div className="px-3 py-2 bg-space-900/50 border-b border-slate-800/80 flex items-center space-x-2 overflow-x-auto shrink-0">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">QUICK ACTIONS:</span>
              {[
                { label: '🚀 npm run dev', cmd: 'npm run dev' },
                { label: '📦 npm install', cmd: 'npm install' },
                { label: '🧪 npm test', cmd: 'npm test' },
                { label: '📊 git status', cmd: 'git status' },
                { label: '📁 dir', cmd: 'dir' },
                { label: '🐍 python --version', cmd: 'python --version' },
                { label: '🌐 netstat -ano', cmd: 'netstat -ano | findstr LISTENING' },
              ].map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleRunCommand(chip.cmd)}
                  disabled={isExecuting}
                  className="px-2 py-0.5 rounded bg-space-800 hover:bg-space-700 text-slate-300 hover:text-cyan-300 border border-slate-700/60 text-[11px] whitespace-nowrap transition disabled:opacity-50"
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Terminal History Output Stream */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-xs">
              {/* Welcome Banner */}
              <div className="p-3 rounded-lg bg-cyan-950/30 border border-cyan-500/20 text-slate-300 space-y-1">
                <div className="text-cyan-400 font-bold flex items-center space-x-1.5">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>Zak_OS Windows Native PowerShell Shell (PID Engine Active)</span>
                </div>
                <div className="text-slate-400 text-[11px]">
                  Working Directory: <code className="text-emerald-400 font-bold">{effectiveCwd}</code>
                </div>
                <div className="text-slate-500 text-[10px]">
                  Type any command and hit <kbd className="px-1 py-0.5 rounded bg-space-900 border border-slate-700 text-slate-300">Enter</kbd>. Use <kbd className="px-1 py-0.5 rounded bg-space-900 border border-slate-700 text-slate-300">↑</kbd>/<kbd className="px-1 py-0.5 rounded bg-space-900 border border-slate-700 text-slate-300">↓</kbd> for command history.
                </div>
              </div>

              {/* History Items */}
              {historyItems.map((item) => (
                <div key={item.id} className="space-y-1 bg-space-900/30 p-3 rounded-lg border border-slate-800/80">
                  {/* Command Prompt Line */}
                  <div className="flex items-center justify-between text-slate-400 text-[11px]">
                    <div className="flex items-center space-x-1.5 text-cyan-300 font-bold truncate">
                      <span className="text-blue-400">PS</span>
                      <span className="text-slate-500">{item.cwd}&gt;</span>
                      <span className="text-emerald-300">{item.command}</span>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      {item.result && (
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                            item.result.exitCode === 0
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          EXIT {item.result.exitCode} ({item.result.executionTimeMs}ms)
                        </span>
                      )}
                      <span className="text-[10px] text-slate-600">{item.timestamp}</span>
                      <button
                        onClick={() => copyToClipboard(item.result?.stdout || item.command, item.id)}
                        className="text-slate-500 hover:text-slate-300"
                        title="Copy command output"
                      >
                        {copiedId === item.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Output Display */}
                  {item.isExecuting ? (
                    <div className="flex items-center space-x-2 text-cyan-400 animate-pulse pt-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Executing in PowerShell...</span>
                    </div>
                  ) : item.result ? (
                    <div className="mt-2 space-y-1">
                      {item.result.stdout && (
                        <pre className="text-slate-200 whitespace-pre-wrap font-mono leading-relaxed bg-space-950 p-2.5 rounded border border-slate-900 overflow-x-auto select-text">
                          {item.result.stdout}
                        </pre>
                      )}
                      {item.result.stderr && (
                        <pre className="text-rose-400 whitespace-pre-wrap font-mono leading-relaxed bg-rose-950/20 p-2.5 rounded border border-rose-900/40 overflow-x-auto select-text">
                          {item.result.stderr}
                        </pre>
                      )}
                    </div>
                  ) : null}
                </div>
              ))}

              <div ref={terminalEndRef} />
            </div>

            {/* Interactive Command Input Box */}
            <div className="p-3 bg-space-900 border-t border-cyan-500/20 shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleRunCommand();
                }}
                className="flex items-center space-x-2"
              >
                <div className="flex items-center space-x-1.5 text-cyan-400 font-bold px-2 py-2 bg-space-950 rounded-l-lg border border-r-0 border-slate-800 shrink-0">
                  <span className="text-blue-400">PS</span>
                  <span className="text-slate-500 truncate max-w-xs">{effectiveCwd}&gt;</span>
                </div>

                <input
                  ref={inputRef}
                  type="text"
                  value={inputCommand}
                  onChange={(e) => setInputCommand(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type PowerShell directive (e.g. npm run dev, git log, dir)..."
                  disabled={isExecuting}
                  autoFocus
                  className="flex-1 bg-space-950 border border-slate-800 rounded-r-lg px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-400 placeholder-slate-600"
                />

                <button
                  type="submit"
                  disabled={isExecuting || !inputCommand.trim()}
                  className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-bold flex items-center space-x-1.5 transition shadow-glow-cyan shrink-0"
                >
                  <Play className="w-3.5 h-3.5 fill-black" />
                  <span>RUN</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* VIEW 2: Active Daemons & Background Servers */}
        {activeTab === 'daemons' && (
          <div className="flex-1 p-6 overflow-y-auto bg-space-950 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Server className="w-4 h-4 text-emerald-400" />
                  <span>ACTIVE BACKGROUND DAEMONS & SERVERS</span>
                </h2>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Long-running processes (Vite, Express, Webpack, Python API) listening on local ports.
                </p>
              </div>
              <button
                onClick={refreshServers}
                className="px-3 py-1.5 rounded bg-space-900 hover:bg-space-800 border border-slate-800 text-slate-300 text-xs flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>REFRESH</span>
              </button>
            </div>

            {activeServers.length === 0 ? (
              <div className="p-12 text-center text-slate-500 font-mono space-y-2 border border-dashed border-slate-800 rounded-xl">
                <Server className="w-10 h-10 text-slate-700 mx-auto" />
                <p className="text-sm">No active background servers currently running.</p>
                <p className="text-xs text-slate-600">
                  Launch a server via the Interactive PowerShell prompt or the Fullstack IDE.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeServers.map((server) => (
                  <div
                    key={server.pid}
                    className="p-4 rounded-xl bg-space-900 border border-emerald-500/30 shadow-glass-glow flex flex-col justify-between space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                          <span className="font-bold text-white text-sm">{server.name || 'Web Server'}</span>
                          <span className="px-1.5 py-0.5 rounded bg-space-950 border border-slate-800 text-slate-400 text-[10px]">
                            PID {server.pid}
                          </span>
                        </div>
                        <div className="text-slate-400 text-[11px]">
                          Command: <code className="text-cyan-300">{server.command}</code>
                        </div>
                        <div className="text-slate-500 text-[10px] truncate max-w-sm">
                          CWD: {server.cwd}
                        </div>
                      </div>

                      <button
                        onClick={() => handleStopServer(server.pid)}
                        className="px-3 py-1.5 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold flex items-center gap-1 transition"
                      >
                        <Square className="w-3.5 h-3.5 fill-rose-400" />
                        <span>STOP</span>
                      </button>
                    </div>

                    {server.url && (
                      <div className="p-2 rounded bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between text-emerald-300">
                        <div className="flex items-center gap-1.5">
                          <Globe className="w-4 h-4 text-emerald-400" />
                          <span>Listening on: <strong>{server.url}</strong></span>
                        </div>
                        <a
                          href={server.url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 rounded bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-[10px]"
                        >
                          OPEN ↗
                        </a>
                      </div>
                    )}

                    {server.logs && server.logs.length > 0 && (
                      <div className="p-2.5 rounded bg-space-950 border border-slate-900 max-h-32 overflow-y-auto space-y-0.5 text-[10px] text-slate-300">
                        <div className="text-slate-500 font-bold mb-1">RECENT LOGS:</div>
                        {server.logs.slice(-6).map((log: string, i: number) => (
                          <div key={i} className="truncate font-mono text-emerald-400/90">
                            {log}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW 3: Cheatsheet / Common Commands */}
        {activeTab === 'cheatsheet' && (
          <div className="flex-1 p-6 overflow-y-auto bg-space-950 space-y-6">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>ESSENTIAL DEVELOPER COMMAND REFERENCE</span>
              </h2>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Click any command to load and execute it directly in the active project directory.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  category: 'Node & NPM Workspaces',
                  items: [
                    { title: 'Install All Packages', cmd: 'npm install --no-audit --no-fund' },
                    { title: 'Run Dev Server', cmd: 'npm run dev' },
                    { title: 'Build Project', cmd: 'npm run build' },
                    { title: 'Type Check', cmd: 'npx tsc --noEmit' },
                  ],
                },
                {
                  category: 'Git & Version Control',
                  items: [
                    { title: 'Check Git Status', cmd: 'git status' },
                    { title: 'Recent Commits', cmd: 'git log --oneline -n 10' },
                    { title: 'Show Current Branch', cmd: 'git branch -a' },
                    { title: 'Stage All Changes', cmd: 'git add -A' },
                  ],
                },
                {
                  category: 'System & Networking',
                  items: [
                    { title: 'Find Active Listening Ports', cmd: 'netstat -ano | findstr LISTENING' },
                    { title: 'Kill Process on Port', cmd: 'taskkill /PID <PID> /F' },
                    { title: 'Inspect Directory Tree', cmd: 'tree /F /A' },
                    { title: 'System Info & Specs', cmd: 'systeminfo' },
                  ],
                },
              ].map((cat, i) => (
                <div key={i} className="p-4 rounded-xl bg-space-900 border border-slate-800 space-y-3">
                  <h3 className="font-bold text-cyan-300 text-xs uppercase tracking-wider border-b border-slate-800 pb-2">
                    {cat.category}
                  </h3>
                  <div className="space-y-2">
                    {cat.items.map((item, j) => (
                      <button
                        key={j}
                        onClick={() => {
                          setActiveTab('shell');
                          handleRunCommand(item.cmd);
                        }}
                        className="w-full text-left p-2 rounded bg-space-950 hover:bg-space-800 border border-slate-900 hover:border-cyan-500/40 transition group"
                      >
                        <div className="text-[11px] font-bold text-slate-200 group-hover:text-cyan-300">
                          {item.title}
                        </div>
                        <code className="text-[10px] text-emerald-400/80 block mt-0.5 truncate">
                          {item.cmd}
                        </code>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
