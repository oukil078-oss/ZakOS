import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Shield, 
  Code2, 
  GraduationCap, 
  Lock, 
  Terminal, 
  Activity, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  ArrowUpRight,
  Filter,
  Layers,
  MessageSquare
} from 'lucide-react';

export interface AgentCollectiveItem {
  id: string;
  code: string;
  name: string;
  role: string;
  platform: string;
  color: string;
  model: string;
  totalResponses: number;
  successRate: number;
  status: 'active' | 'idle' | 'dormant';
  lastTask: string;
  lastSeen: string;
  bars: number[];
}

const AGENT_COLLECTIVE: AgentCollectiveItem[] = [
  {
    id: 'orchestrator',
    code: 'ORCH',
    name: 'Orchestrator-01',
    role: 'Top-level operational director dispatching directives, prioritizing backlog, and managing multi-agent handoffs.',
    platform: 'Telegram / Web',
    color: '#A78BFA',
    model: 'gemini-2.5-pro',
    totalResponses: 384,
    successRate: 99,
    status: 'active',
    lastTask: 'Synchronized daily memory stream & cron schedule',
    lastSeen: '12s ago',
    bars: [18, 24, 30, 26, 35, 42, 48],
  },
  {
    id: 'pentest',
    code: 'PENT',
    name: 'RedTeam-Ops',
    role: 'Penetration testing engineer analyzing Microsoft IIS / WebDAV vectors, CVE triage, Nmap scans, and privilege escalation.',
    platform: 'Tactical CLI',
    color: '#F26D6D',
    model: 'gemini-2.5-flash',
    totalResponses: 276,
    successRate: 96,
    status: 'active',
    lastTask: 'davtest executable probe against target lab (10.10.10.50)',
    lastSeen: '45s ago',
    bars: [12, 18, 22, 29, 31, 38, 44],
  },
  {
    id: 'architect',
    code: 'ARCH',
    name: 'Architect-02',
    role: 'Full-stack software architect synthesizing React, TypeScript, Monaco IDE integrations, and Tailwind design systems.',
    platform: 'Monaco IDE',
    color: '#7DD3FC',
    model: 'gemini-2.5-pro',
    totalResponses: 412,
    successRate: 100,
    status: 'active',
    lastTask: 'Unified live IDE workspace with neo-glass styling',
    lastSeen: '2m ago',
    bars: [24, 32, 28, 41, 39, 52, 58],
  },
  {
    id: 'professor',
    code: 'ACAD',
    name: 'Professor-Prime',
    role: 'Academic mentor and thesis strategist managing graduation capstone research, empirical benchmarks, and viva defense.',
    platform: 'Mind-Vault',
    color: '#F5B544',
    model: 'gemini-2.5-pro',
    totalResponses: 189,
    successRate: 100,
    status: 'idle',
    lastTask: 'Compiled IEEE-formatted citations for agentic OS paper',
    lastSeen: '14m ago',
    bars: [10, 14, 16, 20, 22, 28, 30],
  },
  {
    id: 'devsecops',
    code: 'DSEC',
    name: 'DevSecOps',
    role: 'Infrastructure and security automation guard enforcing secret scanning, CI/CD pipeline integrity, and git hygiene.',
    platform: 'GitHub Cloud',
    color: '#5EE2B5',
    model: 'gemini-2.5-flash',
    totalResponses: 320,
    successRate: 100,
    status: 'active',
    lastTask: 'Verified zero exposed secrets before git commit & push',
    lastSeen: '1m ago',
    bars: [16, 20, 25, 30, 36, 40, 46],
  },
];

const AUDIT_LOGS = [
  { id: '1', time: '12s ago', agent: 'RedTeam-Ops', code: 'PENT', color: '#F26D6D', task: 'davtest WebDAV PUT / MOVE validation test executed', model: 'gemini-2.5-flash', status: 'done' },
  { id: '2', time: '38s ago', agent: 'Architect-02', code: 'ARCH', color: '#7DD3FC', task: 'Monaco IDE editor styling & multi-tab state verified', model: 'gemini-2.5-pro', status: 'done' },
  { id: '3', time: '1m ago', agent: 'DevSecOps', code: 'DSEC', color: '#5EE2B5', task: 'GitHub remote push protection scan passed without warnings', model: 'gemini-2.5-flash', status: 'done' },
  { id: '4', time: '2m ago', agent: 'Orchestrator-01', code: 'ORCH', color: '#A78BFA', task: 'Subagent collective telemetry heartbeat sync', model: 'gemini-2.5-pro', status: 'done' },
  { id: '5', time: '5m ago', agent: 'Professor-Prime', code: 'ACAD', color: '#F5B544', task: 'Exported thesis methodology notes to Obsidian Vault', model: 'gemini-2.5-pro', status: 'done' },
  { id: '6', time: '8m ago', agent: 'RedTeam-Ops', code: 'PENT', color: '#F26D6D', task: 'Nmap TCP SYN scan against local lab subnet', model: 'gemini-2.5-flash', status: 'done' },
  { id: '7', time: '12m ago', agent: 'Architect-02', code: 'ARCH', color: '#7DD3FC', task: 'Liquid Glass WebGL canvas rendering optimization', model: 'gemini-2.5-pro', status: 'done' },
];

interface AgentCollectiveViewProps {
  onOpenAgentChat?: (agentId: string) => void;
}

export const AgentCollectiveView: React.FC<AgentCollectiveViewProps> = ({ onOpenAgentChat }) => {
  const [filterCode, setFilterCode] = useState<string>('all');
  const donutCanvasRef = useRef<HTMLCanvasElement>(null);

  const totalResponses = AGENT_COLLECTIVE.reduce((acc, a) => acc + a.totalResponses, 0);
  const activeCount = AGENT_COLLECTIVE.filter((a) => a.status === 'active').length;
  const idleCount = AGENT_COLLECTIVE.filter((a) => a.status === 'idle').length;

  // Draw Donut Chart
  useEffect(() => {
    const canvas = donutCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const outerRadius = 54;
    const innerRadius = 34;

    ctx.clearRect(0, 0, w, h);
    let startAngle = -Math.PI / 2;

    AGENT_COLLECTIVE.forEach((agent) => {
      const sliceAngle = (agent.totalResponses / totalResponses) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(cx, cy, (outerRadius + innerRadius) / 2, startAngle, startAngle + sliceAngle);
      ctx.strokeStyle = agent.color;
      ctx.lineWidth = outerRadius - innerRadius;
      ctx.stroke();
      startAngle += sliceAngle;
    });

    // Center text
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 16px monospace';
    ctx.fillText(`${totalResponses}`, cx, cy - 4);
    ctx.font = '9px monospace';
    ctx.fillStyle = '#9CA3AF';
    ctx.fillText('TASKS', cx, cy + 12);
  }, [totalResponses]);

  const filteredLogs = filterCode === 'all' 
    ? AUDIT_LOGS 
    : AUDIT_LOGS.filter((l) => l.code.toLowerCase() === filterCode.toLowerCase());

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-widest text-[#D4FF00] uppercase mb-1">
            <Bot className="w-4 h-4" />
            <span>HERMES SUBAGENT FLEET</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white tracking-tight">
            The Collective.
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            5 autonomous specialist AI agents tailored for cybersecurity research, full-stack architecture, and academic defense.
          </p>
        </div>

        {/* State Status Counters */}
        <div className="flex items-center gap-3 p-2 rounded-2xl bg-white dark:bg-[#12151B] border border-black/[0.08] dark:border-white/[0.08] shadow-sm">
          <div className="px-3 py-1.5 text-center">
            <div className="text-[10px] font-mono text-gray-400 uppercase font-bold">Active</div>
            <div className="text-xl font-mono font-black text-[#5EE2B5]">{activeCount}</div>
          </div>
          <div className="h-7 w-[1px] bg-black/[0.08] dark:bg-white/[0.08]" />
          <div className="px-3 py-1.5 text-center">
            <div className="text-[10px] font-mono text-gray-400 uppercase font-bold">Idle</div>
            <div className="text-xl font-mono font-black text-[#F5B544]">{idleCount}</div>
          </div>
          <div className="h-7 w-[1px] bg-black/[0.08] dark:bg-white/[0.08]" />
          <div className="px-3 py-1.5 text-center">
            <div className="text-[10px] font-mono text-gray-400 uppercase font-bold">Total</div>
            <div className="text-xl font-mono font-black text-gray-900 dark:text-white">5</div>
          </div>
        </div>
      </div>

      {/* 5 Subagent Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {AGENT_COLLECTIVE.map((agent) => {
          const maxBar = Math.max(...agent.bars);
          return (
            <div
              key={agent.id}
              className="group rounded-3xl p-5 bg-white dark:bg-[#12151B] border border-black/[0.08] dark:border-white/[0.08] shadow-lg hover:shadow-2xl transition-all duration-300 relative flex flex-col justify-between overflow-hidden"
              style={{ borderTop: `3px solid ${agent.color}` }}
            >
              <div>
                {/* Header Badge */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span
                    className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-extrabold tracking-wider"
                    style={{
                      background: `color-mix(in srgb, ${agent.color} 15%, transparent)`,
                      color: agent.color,
                      border: `1px solid color-mix(in srgb, ${agent.color} 30%, transparent)`,
                    }}
                  >
                    {agent.code}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-mono text-gray-400 uppercase truncate max-w-[80px]">
                      {agent.platform}
                    </span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        agent.status === 'active' ? 'bg-[#5EE2B5] shadow-[0_0_8px_#5EE2B5]' : 'bg-[#F5B544]'
                      }`}
                    />
                  </div>
                </div>

                <h3 className="font-extrabold text-base text-gray-900 dark:text-white tracking-tight">
                  {agent.name}
                </h3>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 leading-relaxed min-h-[32px]">
                  {agent.role}
                </p>

                {/* 7-Day Mini Activity Bars */}
                <div className="mt-4 pt-3 border-t border-black/[0.05] dark:border-white/[0.05]">
                  <div className="text-[9px] font-mono uppercase text-gray-400 mb-1.5 font-bold">
                    7-Day Activity
                  </div>
                  <div className="flex items-end gap-1.5 h-8">
                    {agent.bars.map((v, idx) => (
                      <span
                        key={idx}
                        className="flex-1 rounded-full transition-all group-hover:opacity-100"
                        style={{
                          height: `${Math.max(4, Math.round((v / maxBar) * 30))}px`,
                          background: agent.color,
                          opacity: 0.8,
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-black/[0.05] dark:border-white/[0.05] text-center font-mono">
                  <div>
                    <div className="text-xs font-black" style={{ color: agent.color }}>
                      {agent.totalResponses}
                    </div>
                    <div className="text-[8px] text-gray-400 uppercase">Calls</div>
                  </div>
                  <div>
                    <div className="text-xs font-black text-[#5EE2B5]">{agent.successRate}%</div>
                    <div className="text-[8px] text-gray-400 uppercase">Success</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-gray-700 dark:text-gray-300 truncate">
                      {agent.model.split('-')[1]}
                    </div>
                    <div className="text-[8px] text-gray-400 uppercase">Model</div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-4 pt-3 border-t border-black/[0.05] dark:border-white/[0.05]">
                <div className="text-[9px] font-mono text-gray-400 truncate mb-2">
                  ↳ {agent.lastTask}
                </div>
                {onOpenAgentChat && (
                  <button
                    onClick={() => onOpenAgentChat(agent.id)}
                    className="w-full py-1.5 rounded-xl text-xs font-bold font-mono uppercase flex items-center justify-center gap-1.5 bg-black/[0.04] dark:bg-white/[0.04] hover:bg-[#D4FF00]/20 hover:text-black dark:hover:text-[#D4FF00] transition"
                  >
                    <MessageSquare className="w-3 h-3" />
                    <span>Directive Chat</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Analytics & Donut Task Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Metric Cards (8 cols) */}
        <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-3xl bg-white dark:bg-[#12151B] border border-black/[0.08] dark:border-white/[0.08]">
            <span className="font-mono text-[10px] text-gray-400 uppercase font-bold">Tasks Today</span>
            <div className="text-2xl font-black text-[#F5B544] mt-1">142</div>
            <div className="h-1 rounded-full bg-[#F5B544]/30 mt-3 overflow-hidden">
              <div className="h-full bg-[#F5B544] w-full" />
            </div>
          </div>

          <div className="p-4 rounded-3xl bg-white dark:bg-[#12151B] border border-black/[0.08] dark:border-white/[0.08]">
            <span className="font-mono text-[10px] text-gray-400 uppercase font-bold">Tasks This Week</span>
            <div className="text-2xl font-black text-[#7DD3FC] mt-1">896</div>
            <div className="h-1 rounded-full bg-[#7DD3FC]/30 mt-3 overflow-hidden">
              <div className="h-full bg-[#7DD3FC] w-full" />
            </div>
          </div>

          <div className="p-4 rounded-3xl bg-white dark:bg-[#12151B] border border-black/[0.08] dark:border-white/[0.08]">
            <span className="font-mono text-[10px] text-gray-400 uppercase font-bold">Top Contributor</span>
            <div className="text-2xl font-black text-[#A78BFA] mt-1 truncate">Architect</div>
            <div className="h-1 rounded-full bg-[#A78BFA]/30 mt-3 overflow-hidden">
              <div className="h-full bg-[#A78BFA] w-[75%]" />
            </div>
          </div>

          <div className="p-4 rounded-3xl bg-white dark:bg-[#12151B] border border-black/[0.08] dark:border-white/[0.08]">
            <span className="font-mono text-[10px] text-gray-400 uppercase font-bold">Success Rate</span>
            <div className="text-2xl font-black text-[#5EE2B5] mt-1">99.4%</div>
            <div className="h-1 rounded-full bg-[#5EE2B5]/30 mt-3 overflow-hidden">
              <div className="h-full bg-[#5EE2B5] w-[99%]" />
            </div>
          </div>

          {/* Audit Log Table */}
          <div className="col-span-2 sm:col-span-4 p-5 rounded-3xl bg-white dark:bg-[#12151B] border border-black/[0.08] dark:border-white/[0.08]">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#D4FF00]" />
                <span className="font-mono text-xs font-extrabold uppercase text-gray-900 dark:text-white">
                  Agent Execution Audit Log
                </span>
              </div>

              {/* Log Filters */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {['all', 'ORCH', 'PENT', 'ARCH', 'ACAD', 'DSEC'].map((code) => (
                  <button
                    key={code}
                    onClick={() => setFilterCode(code)}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase transition ${
                      filterCode === code
                        ? 'bg-black dark:bg-white text-white dark:text-black shadow-sm'
                        : 'bg-black/[0.04] dark:bg-white/[0.04] text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    {code}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto max-h-56">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-black/[0.08] dark:border-white/[0.08] text-gray-400 text-[10px] uppercase">
                    <th className="pb-2">Time</th>
                    <th className="pb-2">Agent</th>
                    <th className="pb-2">Task Description</th>
                    <th className="pb-2">Model</th>
                    <th className="pb-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                      <td className="py-2 text-gray-400 text-[11px] whitespace-nowrap">{log.time}</td>
                      <td className="py-2 font-bold whitespace-nowrap" style={{ color: log.color }}>
                        {log.agent}
                      </td>
                      <td className="py-2 text-gray-700 dark:text-gray-300 truncate max-w-xs">{log.task}</td>
                      <td className="py-2 text-gray-400 text-[10px] whitespace-nowrap">{log.model}</td>
                      <td className="py-2 text-right whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-[#5EE2B5]/10 border border-[#5EE2B5]/30 text-[#5EE2B5]">
                          DONE
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Task Distribution Donut (4 cols) */}
        <div className="lg:col-span-4 p-5 rounded-3xl bg-white dark:bg-[#12151B] border border-black/[0.08] dark:border-white/[0.08] flex flex-col items-center">
          <div className="w-full flex items-center justify-between text-[11px] font-mono font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
            <span>TASK DISTRIBUTION</span>
            <span className="text-[#D4FF00]">100% NOMINAL</span>
          </div>

          <div className="my-2">
            <canvas ref={donutCanvasRef} width={140} height={140} className="w-36 h-36" />
          </div>

          {/* Legend */}
          <div className="w-full space-y-2 mt-4 pt-3 border-t border-black/[0.05] dark:border-white/[0.05]">
            {AGENT_COLLECTIVE.map((agent) => {
              const pct = Math.round((agent.totalResponses / totalResponses) * 100);
              return (
                <div key={agent.id} className="flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: agent.color }} />
                    <span className="text-gray-700 dark:text-gray-300 font-bold">{agent.name}</span>
                  </div>
                  <span className="text-gray-400">{pct}% ({agent.totalResponses})</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentCollectiveView;
