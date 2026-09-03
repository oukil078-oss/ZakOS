import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Terminal, 
  Search, 
  Wifi, 
  WifiOff, 
  Shield, 
  Cpu, 
  Layers, 
  Clock, 
  PlusCircle, 
  FileText,
  Sparkles
} from 'lucide-react';
import { TelemetryStats } from '../../types';

interface JarvisHeaderProps {
  stats: TelemetryStats | null;
  isConnected: boolean;
  onOpenCommandPalette: () => void;
  onQuickDailyNote: () => void;
  onSelectAgent: (agentId: string) => void;
}

export const JarvisHeader: React.FC<JarvisHeaderProps> = ({
  stats,
  isConnected,
  onOpenCommandPalette,
  onQuickDailyNote,
  onSelectAgent,
}) => {
  const [timeUtc, setTimeUtc] = useState<string>('');
  const [timeLocal, setTimeLocal] = useState<string>('');

  useEffect(() => {
    const updateTimes = () => {
      const now = new Date();
      setTimeUtc(now.toUTCString().split(' ')[4] + ' UTC');
      setTimeLocal(now.toLocaleTimeString());
    };
    updateTimes();
    const timer = setInterval(updateTimes, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="h-14 border-b border-cyan-500/20 bg-space-900/90 backdrop-blur-md px-4 flex items-center justify-between z-30 shrink-0 select-none">
      {/* Brand & System Status */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center shadow-glow-cyan">
            <Shield className="w-4 h-4 text-cyan-400 animate-pulse-slow" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-display font-black text-sm tracking-wider text-white">
                ZAK<span className="text-cyan-400">_OS</span>
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                v2.6 HUD
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-400 flex items-center space-x-1">
              <span>VAULT NUCLEUS</span>
              <span className="text-cyan-500">•</span>
              <span className="text-amber-400">ZAKARYA OUKIL</span>
            </span>
          </div>
        </div>

        {/* Live Sync Badge */}
        <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-space-850 border border-slate-700/60 text-xs font-mono">
          {isConnected ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-emerald-400 text-[11px] font-medium flex items-center gap-1">
                <Wifi className="w-3 h-3" /> OBSIDIAN SYNC ACTIVE
              </span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span className="text-rose-400 text-[11px] font-medium flex items-center gap-1">
                <WifiOff className="w-3 h-3" /> DISCONNECTED
              </span>
            </>
          )}
        </div>
      </div>

      {/* Center: Live Telemetry Gauges */}
      <div className="hidden md:flex items-center space-x-5 font-mono text-xs">
        {/* Notes Count */}
        <div className="flex items-center space-x-1.5 text-slate-300">
          <FileText className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-slate-400 text-[11px]">NOTES:</span>
          <span className="text-cyan-300 font-bold">{stats?.totalNotes ?? 115}</span>
        </div>

        {/* Links Count */}
        <div className="flex items-center space-x-1.5 text-slate-300">
          <Layers className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-slate-400 text-[11px]">LINKS:</span>
          <span className="text-purple-300 font-bold">{stats?.totalLinks ?? 240}</span>
        </div>

        {/* Commands Count */}
        <div className="flex items-center space-x-1.5 text-slate-300">
          <Terminal className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-slate-400 text-[11px]">COMMANDS:</span>
          <span className="text-emerald-300 font-bold">{stats?.totalCommands ?? 32}</span>
        </div>

        {/* eJPT Readiness */}
        <div className="flex items-center space-x-2 bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-0.5 rounded">
          <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span className="text-[11px] text-emerald-400 font-bold">
            eJPTv2: Course 3 (Enum 88%)
          </span>
        </div>
      </div>

      {/* Right: Clock & Quick Action Triggers */}
      <div className="flex items-center space-x-3">
        {/* Time Widget */}
        <div className="hidden xl:flex flex-col items-end font-mono text-[11px]">
          <div className="flex items-center space-x-1 text-slate-200">
            <Clock className="w-3 h-3 text-cyan-400" />
            <span className="font-semibold">{timeLocal}</span>
          </div>
          <span className="text-[9px] text-slate-400">{timeUtc}</span>
        </div>

        {/* Quick Daily Note Button */}
        <button
          onClick={onQuickDailyNote}
          className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 hover:border-amber-400 text-amber-300 text-xs font-mono transition shadow-sm"
          title="Create Daily Note"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>DAILY LOG</span>
        </button>

        {/* Omni Search Button */}
        <button
          onClick={onOpenCommandPalette}
          className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-space-800 border border-cyan-500/30 hover:border-cyan-400 hover:shadow-glow-cyan transition text-xs font-mono text-slate-300 group"
        >
          <Search className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
          <span className="hidden sm:inline">OMNI SEARCH</span>
          <kbd className="px-1.5 py-0.5 rounded bg-space-950 text-[10px] text-cyan-300 border border-cyan-500/30">
            Ctrl+K
          </kbd>
        </button>
      </div>
    </header>
  );
};
