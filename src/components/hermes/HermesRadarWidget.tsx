import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, 
  Cpu, 
  HardDrive, 
  Server, 
  Database, 
  Radio, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Flame, 
  Zap, 
  Terminal,
  Shield,
  Layers,
  ArrowUpRight
} from 'lucide-react';

interface AgentPulse {
  key: string;
  code: string;
  name: string;
  color: string;
  angle: number;
  distance: number;
  status: 'active' | 'idle' | 'dormant';
  task: string;
}

const AGENTS: AgentPulse[] = [
  { key: 'orchestrator', code: 'ORCH', name: 'Orchestrator-01', color: '#A78BFA', angle: -90, distance: 48, status: 'active', task: 'Directing multi-agent telemetry stream' },
  { key: 'pentest', code: 'PENT', name: 'RedTeam-Ops', color: '#F26D6D', angle: -18, distance: 42, status: 'active', task: 'CVE vulnerability audit & WebDAV triage' },
  { key: 'architect', code: 'ARCH', name: 'Architect-02', color: '#7DD3FC', angle: 54, distance: 52, status: 'active', task: 'React / TypeScript component state synthesis' },
  { key: 'professor', code: 'ACAD', name: 'Professor-Prime', color: '#F5B544', angle: 126, distance: 38, status: 'idle', task: 'Final year thesis roadmap & literature sync' },
  { key: 'devsecops', code: 'DSEC', name: 'DevSecOps', color: '#5EE2B5', angle: 198, distance: 46, status: 'active', task: 'Container hardening & git push protection guard' },
];

const DIRECTIVES = [
  { agent: 'ORCHESTRATOR-01', text: 'DISPATCHING KERNEL DIRECTIVES ACROSS 5 NEURAL SUBAGENTS', color: '#A78BFA' },
  { agent: 'REDTEAM-OPS', text: 'CVE-2026-X ENUMERATION ACTIVE · WEBDAV HEAD/PUT VECTOR VERIFIED', color: '#F26D6D' },
  { agent: 'ARCHITECT-02', text: 'CERAMIC-GLASS SYSTEM STABLE · REBUILDING MONACO IDE VIEWPORT', color: '#7DD3FC' },
  { agent: 'DEVSECOPS', text: 'VAULT AUDIT COMPLETE · ZERO EXPOSED SECRETS IN PRODUCTION DEPLOY', color: '#5EE2B5' },
  { agent: 'PROFESSOR-PRIME', text: 'THESIS ROADMAP PHASE 2 SYNCED WITH 118 OBSIDIAN NODES', color: '#F5B544' },
];

const RECENT_FEEDS = [
  { id: '1', agent: 'RedTeam-Ops', color: '#F26D6D', task: 'IIS & WebDAV exploit vector simulation', status: 'COMPLETED', time: '12s ago' },
  { id: '2', agent: 'Architect-02', color: '#7DD3FC', task: 'Unified Monaco IDE workspace view upgrade', status: 'COMPLETED', time: '48s ago' },
  { id: '3', agent: 'DevSecOps', color: '#5EE2B5', task: 'GitHub repo push protection check clean', status: 'COMPLETED', time: '1m ago' },
  { id: '4', agent: 'Orchestrator-01', color: '#A78BFA', task: 'Scheduled cron jobs synchronized with system', status: 'COMPLETED', time: '2m ago' },
  { id: '5', agent: 'Professor-Prime', color: '#F5B544', task: 'Generated academic defense bibliography', status: 'COMPLETED', time: '4m ago' },
];

export const HermesRadarWidget: React.FC = () => {
  const [directiveIdx, setDirectiveIdx] = useState(0);
  const [activeAgentIdx, setActiveAgentIdx] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const [sparkTick, setSparkTick] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Cycle directives smoothly
  useEffect(() => {
    const interval = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setDirectiveIdx((prev) => (prev + 1) % DIRECTIVES.length);
        setActiveAgentIdx((prev) => (prev + 1) % AGENTS.length);
        setIsFading(false);
      }, 250);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Draw Throughput Sparkline Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const dataPoints = [32, 45, 58, 40, 65, 82, 75, 94, 88, 105, 92, 115, 98, 124];
    const max = Math.max(...dataPoints);
    const pad = 8;
    const pts: [number, number][] = dataPoints.map((v, i) => [
      pad + i * ((w - pad * 2) / (dataPoints.length - 1)),
      h - pad - (v / max) * (h - 24)
    ]);

    // Fill Gradient
    const fill = ctx.createLinearGradient(0, 0, 0, h);
    fill.addColorStop(0, 'rgba(212, 255, 0, 0.22)');
    fill.addColorStop(1, 'rgba(212, 255, 0, 0)');

    ctx.beginPath();
    pts.forEach((p, i) => (i ? ctx.lineTo(...p) : ctx.moveTo(...p)));
    ctx.lineTo(pts[pts.length - 1][0], h - pad);
    ctx.lineTo(pts[0][0], h - pad);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();

    // Stroke
    const grad = ctx.createLinearGradient(0, 0, w, 0);
    grad.addColorStop(0, '#8B5CF6');
    grad.addColorStop(0.5, '#7DD3FC');
    grad.addColorStop(1, '#D4FF00');

    ctx.beginPath();
    pts.forEach((p, i) => (i ? ctx.lineTo(...p) : ctx.moveTo(...p)));
    ctx.strokeStyle = grad;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#D4FF00';
    ctx.shadowBlur = 8;
    ctx.stroke();

    // Pulse tip dot
    const last = pts[pts.length - 1];
    ctx.beginPath();
    ctx.arc(last[0], last[1], 4 + Math.sin(sparkTick) * 1.5, 0, Math.PI * 2);
    ctx.fillStyle = '#D4FF00';
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#D4FF00';
    ctx.fill();
  }, [sparkTick]);

  useEffect(() => {
    const t = setInterval(() => setSparkTick((prev) => prev + 0.2), 100);
    return () => clearInterval(t);
  }, []);

  const currentDirective = DIRECTIVES[directiveIdx];
  const currentAgent = AGENTS[activeAgentIdx];

  return (
    <div className="rounded-3xl p-6 bg-white/70 dark:bg-[#12151B]/80 border border-black/[0.08] dark:border-white/[0.08] backdrop-blur-xl shadow-xl relative overflow-hidden transition-all">
      {/* Background radial atmosphere */}
      <div 
        className="absolute top-0 right-0 w-96 h-96 rounded-full pointer-events-none filter blur-[100px] opacity-20 transition-colors duration-700"
        style={{ background: currentDirective.color }}
      />

      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-black/[0.06] dark:border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-[#D4FF00] shadow-[0_0_12px_#D4FF00] animate-pulse" />
          <span className="font-mono text-xs font-extrabold uppercase tracking-widest text-gray-900 dark:text-white">
            HERMES MISSION CONTROL · 360° RADAR TELEMETRY
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] px-2.5 py-1 rounded-full bg-[#D4FF00]/10 border border-[#D4FF00]/30 text-gray-900 dark:text-[#D4FF00] font-bold uppercase">
            LIVE UPLINK ACTIVE
          </span>
          <span className="font-mono text-xs text-gray-500 dark:text-gray-400">
            5/5 Subagents Nominal
          </span>
        </div>
      </div>

      {/* 3-Column Ops Grid: Radar | Directive HUD | VPS System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Col 1: 360° Radar Canvas Viewport (4 cols) */}
        <div className="lg:col-span-4 flex flex-col items-center justify-center p-4 rounded-2xl bg-black/[0.03] dark:bg-black/30 border border-black/[0.05] dark:border-white/[0.05] relative">
          <div className="relative w-48 h-48 flex items-center justify-center">
            {/* SVG Radar */}
            <svg className="w-48 h-48 overflow-visible" viewBox="0 0 140 140">
              <defs>
                <filter id="hermesSweepGlow">
                  <feGaussianBlur stdDeviation="2.5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Concentric rings */}
              <circle cx="70" cy="70" r="62" fill="none" stroke="currentColor" strokeWidth="0.6" className="text-gray-300 dark:text-white/10" />
              <circle cx="70" cy="70" r="46" fill="none" stroke="currentColor" strokeWidth="0.6" className="text-gray-300 dark:text-white/10" />
              <circle cx="70" cy="70" r="30" fill="none" stroke="currentColor" strokeWidth="0.6" className="text-gray-300 dark:text-white/10" />
              <circle cx="70" cy="70" r="14" fill="none" stroke="currentColor" strokeWidth="0.6" className="text-gray-300 dark:text-white/10" />

              {/* Axis Crosshairs */}
              <line x1="8" y1="70" x2="132" y2="70" stroke="currentColor" strokeWidth="0.5" className="text-gray-300 dark:text-white/10" />
              <line x1="70" y1="8" x2="70" y2="132" stroke="currentColor" strokeWidth="0.5" className="text-gray-300 dark:text-white/10" />

              {/* Rotating Sweep Beam */}
              <g className="origin-[70px_70px] animate-[spin_3.2s_linear_infinite]" filter="url(#hermesSweepGlow)">
                <line x1="70" y1="70" x2="70" y2="8" stroke="#D4FF00" strokeWidth="1.2" />
                <circle cx="70" cy="8" r="2.8" fill="#D4FF00" />
              </g>

              {/* Radial Subagent Pings */}
              {AGENTS.map((agent, i) => {
                const angleRad = (agent.angle * Math.PI) / 180;
                const x = 70 + Math.cos(angleRad) * agent.distance;
                const y = 70 + Math.sin(angleRad) * agent.distance;
                const isCurrent = i === activeAgentIdx;
                return (
                  <g key={agent.key} className="cursor-pointer transition-transform hover:scale-125">
                    <circle
                      cx={x.toFixed(1)}
                      cy={y.toFixed(1)}
                      r={isCurrent ? '5.5' : '4'}
                      fill={agent.color}
                      style={{
                        filter: `drop-shadow(0 0 ${isCurrent ? '8px' : '4px'} ${agent.color})`,
                        opacity: isCurrent ? 1 : 0.85
                      }}
                    />
                    <text
                      x={x + 7}
                      y={y + 3}
                      fill={agent.color}
                      fontSize="7"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      {agent.code}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
          <span className="font-mono text-[10px] text-gray-400 mt-2 tracking-wider uppercase">
            360° Real-time Radial Sweep
          </span>
        </div>

        {/* Col 2: Live Directive HUD & Segment Meter (4 cols) */}
        <div className="lg:col-span-4 flex flex-col justify-between p-4 rounded-2xl bg-black/[0.03] dark:bg-black/30 border border-black/[0.05] dark:border-white/[0.05] h-full min-h-[220px]">
          <div>
            <div className="flex items-center justify-between text-[11px] font-mono font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              <span>CURRENT DIRECTIVE</span>
              <span style={{ color: currentDirective.color }}>{currentDirective.agent}</span>
            </div>

            <div 
              className={`font-mono text-xs sm:text-sm font-bold leading-relaxed tracking-wide min-h-[64px] transition-all duration-300 ${
                isFading ? 'opacity-20 translate-y-1' : 'opacity-100 translate-y-0'
              }`}
              style={{ color: currentDirective.color }}
            >
              {currentDirective.text}
            </div>
          </div>

          <div className="mt-4 p-3 rounded-xl bg-black/[0.04] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.04]">
            <div className="flex items-center justify-between text-[10px] font-mono text-gray-500 dark:text-gray-400 uppercase mb-2">
              <span className="font-bold text-gray-900 dark:text-white">{currentAgent.name}</span>
              <span>NOMINAL LOAD</span>
            </div>
            
            {/* 16-Segment Pulse Visualizer */}
            <div className="grid grid-cols-16 gap-1 my-1">
              {Array.from({ length: 16 }, (_, i) => {
                const filled = i < 11;
                return (
                  <span
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      filled ? 'opacity-90 shadow-sm' : 'opacity-20'
                    }`}
                    style={{
                      background: filled ? currentAgent.color : 'currentColor',
                      boxShadow: filled ? `0 0 6px ${currentAgent.color}` : 'none'
                    }}
                  />
                );
              })}
            </div>
            <div className="text-[10px] font-mono text-gray-400 mt-1 truncate">
              ↳ {currentAgent.task}
            </div>
          </div>
        </div>

        {/* Col 3: VPS / Hardware Resource Gauges (4 cols) */}
        <div className="lg:col-span-4 flex flex-col justify-between p-4 rounded-2xl bg-black/[0.03] dark:bg-black/30 border border-black/[0.05] dark:border-white/[0.05] h-full min-h-[220px]">
          <div className="flex items-center justify-between text-[11px] font-mono font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            <span>OPERATING SYSTEM METRICS</span>
            <span className="text-[#D4FF00]">HEALTH 100%</span>
          </div>

          <div className="space-y-3">
            {/* CPU Bar */}
            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-[#7DD3FC]" /> CPU Core (12x)
                </span>
                <span className="font-bold text-[#7DD3FC]">18.4%</span>
              </div>
              <div className="h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-[#7DD3FC] to-[#8B5CF6]" style={{ width: '18.4%' }} />
              </div>
            </div>

            {/* RAM Bar */}
            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-[#8B5CF6]" /> RAM (32 GB)
                </span>
                <span className="font-bold text-[#8B5CF6]">51.2% · 16.4 GB</span>
              </div>
              <div className="h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#E879F9]" style={{ width: '51.2%' }} />
              </div>
            </div>

            {/* NVMe SSD Bar */}
            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-[#5EE2B5]" /> Fast Storage
                </span>
                <span className="font-bold text-[#5EE2B5]">26.0% · 134 GB</span>
              </div>
              <div className="h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-[#5EE2B5] to-[#D4FF00]" style={{ width: '26%' }} />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 mt-2 border-t border-black/[0.05] dark:border-white/[0.05] text-[11px] font-mono">
            <span className="text-gray-500 dark:text-gray-400">Mind Vault Database</span>
            <span className="font-bold text-[#F5B544]">118 Notes · 2.4 Links/Note</span>
          </div>
        </div>
      </div>

      {/* Bottom Section: Sparkline Throughput & Live Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6 pt-6 border-t border-black/[0.06] dark:border-white/[0.06]">
        {/* Throughput Canvas Graph (7 cols) */}
        <div className="lg:col-span-7">
          <div className="flex items-baseline justify-between mb-2">
            <div>
              <span className="font-mono text-[10px] font-extrabold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                TOTAL TELEMETRY RESPONSES
              </span>
              <div className="text-2xl font-black text-gray-900 dark:text-white mt-0.5">
                1,482 <span className="text-xs font-mono text-[#D4FF00] font-normal">+18% this session</span>
              </div>
            </div>
            <span className="font-mono text-[10px] text-gray-400">Real-time LLM API throughput</span>
          </div>
          <canvas ref={canvasRef} width={650} height={90} className="w-full h-24 block" />
        </div>

        {/* Live Activity Feed Stream (5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between">
          <div className="font-mono text-[10px] font-extrabold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2">
            LIVE AGENT ACTIVITY FEED
          </div>
          <div className="space-y-2">
            {RECENT_FEEDS.map((feed) => (
              <div
                key={feed.id}
                className="flex items-center justify-between text-xs py-1.5 px-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.04]"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="font-mono text-[10px] font-extrabold px-1.5 py-0.5 rounded text-black font-bold shrink-0"
                    style={{ background: feed.color }}
                  >
                    {feed.agent.slice(0, 4).toUpperCase()}
                  </span>
                  <span className="text-gray-700 dark:text-gray-300 truncate text-[11px]">
                    {feed.task}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0 font-mono text-[10px]">
                  <span className="text-[#5EE2B5] font-bold">{feed.status}</span>
                  <span className="text-gray-400">{feed.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HermesRadarWidget;
