import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Play, 
  CheckCircle2, 
  RefreshCw, 
  Terminal, 
  Layers, 
  Flame, 
  Sparkles,
  ChevronRight,
  Plus,
  Shield,
  Activity
} from 'lucide-react';

export interface CronJobItem {
  id: string;
  name: string;
  schedule: string;
  humanTime: string;
  category: 'security' | 'architecture' | 'vault' | 'system';
  detail: string;
  color: string;
  command: string;
  nextRunIn: string;
}

const CRON_JOBS: CronJobItem[] = [
  {
    id: '1',
    name: 'RedTeam Automated CVE Triage',
    schedule: '0 8 * * *',
    humanTime: '08:00 DAILY',
    category: 'security',
    detail: 'Nightly vulnerability scan across target lab IP ranges and WebDAV endpoints.',
    color: '#F26D6D',
    command: 'pentest-scanner --targets lab-subnet --output vault/security',
    nextRunIn: 'in 4h 12m',
  },
  {
    id: '2',
    name: 'Mind-Vault Bidirectional Sync',
    schedule: '*/30 * * * *',
    humanTime: 'EVERY 30 MIN',
    category: 'vault',
    detail: 'Indexes 118 Obsidian markdown files, updates knowledge graph edges, and syncs tags.',
    color: '#5EE2B5',
    command: 'zakos-vault-daemon --sync --rebuild-index',
    nextRunIn: 'in 14m',
  },
  {
    id: '3',
    name: 'Academic Thesis Literature Monitor',
    schedule: '0 10 * * 1',
    humanTime: '10:00 MON',
    category: 'architecture',
    detail: 'arXiv and IEEE semantic search for newly published multi-agent orchestration papers.',
    color: '#F5B544',
    command: 'academic-agent --query "agentic OS multi-model" --vault-save',
    nextRunIn: 'in 2d 6h',
  },
  {
    id: '4',
    name: 'GitHub Cloud Portfolio Verification',
    schedule: '0 12 * * *',
    humanTime: '12:00 DAILY',
    category: 'architecture',
    detail: 'Fetches updated commit logs, branch activity, and languages for 19 repositories.',
    color: '#7DD3FC',
    command: 'github-sync --token env.GITHUB_TOKEN --user oukil078-oss',
    nextRunIn: 'in 8h 40m',
  },
  {
    id: '5',
    name: 'DevSecOps Secrets & Log Rotation',
    schedule: '0 3 1 * *',
    humanTime: '03:00 1ST OF MONTH',
    category: 'system',
    detail: 'Audits local storage keys, cleans temporary execution sandboxes, and rotates logs.',
    color: '#A78BFA',
    command: 'cleanup-logs.sh && verify-secrets.sh',
    nextRunIn: 'in 27d',
  },
];

export const CronScheduleView: React.FC = () => {
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [nowProgress, setNowProgress] = useState(50);

  useEffect(() => {
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();
    setNowProgress((currentMins / 1440) * 100);
  }, []);

  const daysOfWeek = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-widest text-[#D4FF00] uppercase mb-1">
            <CalendarIcon className="w-4 h-4" />
            <span>CRON CALENDAR & TIMELINE</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white tracking-tight">
            Schedule Operations.
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            Automated recurring triggers, background security triages, vault indexers, and academic paper crawlers.
          </p>
        </div>

        {/* Next Cron Countdown Pill */}
        <div className="p-3 px-5 rounded-2xl bg-white dark:bg-[#12151B] border border-black/[0.08] dark:border-white/[0.08] shadow-sm flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-[#A78BFA] shadow-[0_0_10px_#A78BFA] animate-ping" />
          <div>
            <div className="text-[10px] font-mono text-gray-400 uppercase font-bold">Next Cron Job</div>
            <div className="text-base font-mono font-black text-[#A78BFA]">
              Mind-Vault Sync · in 14m
            </div>
          </div>
        </div>
      </div>

      {/* Stats Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-3xl bg-white dark:bg-[#12151B] border border-black/[0.08] dark:border-white/[0.08]">
          <span className="font-mono text-[10px] text-gray-400 uppercase font-bold">Total Cron Jobs</span>
          <div className="text-2xl font-black text-[#7DD3FC] mt-1">{CRON_JOBS.length}</div>
          <span className="text-[10px] font-mono text-gray-400">Daemon triggers</span>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-[#12151B] border border-black/[0.08] dark:border-white/[0.08]">
          <span className="font-mono text-[10px] text-gray-400 uppercase font-bold">CyberSec & Pentest</span>
          <div className="text-2xl font-black text-[#F26D6D] mt-1">2 Active</div>
          <span className="text-[10px] font-mono text-gray-400">Nightly triage</span>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-[#12151B] border border-black/[0.08] dark:border-white/[0.08]">
          <span className="font-mono text-[10px] text-gray-400 uppercase font-bold">Vault & Knowledge</span>
          <div className="text-2xl font-black text-[#5EE2B5] mt-1">1 Live</div>
          <span className="text-[10px] font-mono text-gray-400">Continuous index</span>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-[#12151B] border border-black/[0.08] dark:border-white/[0.08]">
          <span className="font-mono text-[10px] text-gray-400 uppercase font-bold">System Status</span>
          <div className="text-2xl font-black text-[#D4FF00] mt-1">100% Nominal</div>
          <span className="text-[10px] font-mono text-gray-400">Zero missed triggers</span>
        </div>
      </div>

      {/* 24-Hour Week Timeline Visualization */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#12151B] border border-black/[0.08] dark:border-white/[0.08] shadow-xl">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <span className="font-mono text-[10px] text-gray-400 uppercase font-bold">EXECUTION TIMELINE</span>
            <h2 className="text-lg font-black text-gray-900 dark:text-white">Next 7 Days Schedule Matrix</h2>
          </div>

          <div className="flex items-center gap-1 p-1 rounded-full bg-black/[0.04] dark:bg-white/[0.04]">
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase transition ${
                viewMode === 'week'
                  ? 'bg-black dark:bg-white text-white dark:text-black shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase transition ${
                viewMode === 'month'
                  ? 'bg-black dark:bg-white text-white dark:text-black shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Month
            </button>
          </div>
        </div>

        {/* 7 Days Timeline Rows */}
        <div className="space-y-3">
          {daysOfWeek.map((day, idx) => {
            const isToday = idx === 3; // e.g. Thursday
            return (
              <div
                key={day}
                className={`grid grid-cols-12 gap-3 items-center p-2 rounded-2xl transition ${
                  isToday ? 'bg-[#D4FF00]/5 border border-[#D4FF00]/20' : 'hover:bg-black/[0.02] dark:hover:bg-white/[0.02]'
                }`}
              >
                {/* Day Label */}
                <div className="col-span-2 sm:col-span-1 flex items-center gap-2">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs font-black ${
                      isToday ? 'bg-[#D4FF00] text-black shadow-sm' : 'bg-black/10 dark:bg-white/10 text-gray-400'
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <span className="font-mono text-xs font-bold text-gray-700 dark:text-gray-300">{day}</span>
                </div>

                {/* 24-Hour Timeline Bar */}
                <div className="col-span-10 sm:col-span-11 relative h-6 rounded-full bg-black/[0.04] dark:bg-white/[0.04] flex items-center">
                  {/* Now line for today */}
                  {isToday && (
                    <div
                      className="absolute top-0 bottom-0 w-[2px] bg-[#D4FF00] shadow-[0_0_8px_#D4FF00] z-20"
                      style={{ left: `${nowProgress}%` }}
                    >
                      <span className="absolute -top-1 -left-1 w-2.5 h-2.5 rounded-full bg-[#D4FF00]" />
                    </div>
                  )}

                  {/* Job Trigger Dots */}
                  <span
                    className="absolute w-3 h-3 rounded-full cursor-pointer hover:scale-150 transition-transform shadow-md"
                    style={{ left: '33.3%', background: '#F26D6D' }}
                    title="08:00 - RedTeam CVE Triage"
                  />
                  <span
                    className="absolute w-2.5 h-2.5 rounded-full cursor-pointer hover:scale-150 transition-transform shadow-md"
                    style={{ left: '50%', background: '#7DD3FC' }}
                    title="12:00 - GitHub Sync"
                  />
                  <span
                    className="absolute w-2.5 h-2.5 rounded-full cursor-pointer hover:scale-150 transition-transform shadow-md"
                    style={{ left: '75%', background: '#5EE2B5' }}
                    title="18:00 - Mind-Vault Refresh"
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* 24h Axis Labels */}
        <div className="grid grid-cols-12 gap-3 mt-2 text-[10px] font-mono text-gray-400">
          <div className="col-span-1" />
          <div className="col-span-11 flex justify-between px-1">
            <span>00:00</span>
            <span>04:00</span>
            <span>08:00</span>
            <span>12:00</span>
            <span>16:00</span>
            <span>20:00</span>
            <span>24:00</span>
          </div>
        </div>
      </div>

      {/* Categorized Job Cards */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-widest text-gray-400 uppercase">
          <Terminal className="w-4 h-4" />
          <span>SCHEDULED AUTOMATION CHIPS</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {CRON_JOBS.map((job) => (
            <div
              key={job.id}
              className="p-5 rounded-3xl bg-white dark:bg-[#12151B] border border-black/[0.08] dark:border-white/[0.08] shadow-md hover:shadow-xl transition-all relative flex flex-col justify-between"
              style={{ borderLeft: `4px solid ${job.color}` }}
            >
              <div>
                <div className="flex items-center justify-between text-xs font-mono mb-2">
                  <span className="font-extrabold uppercase" style={{ color: job.color }}>
                    {job.humanTime}
                  </span>
                  <span className="text-[10px] text-gray-400">{job.nextRunIn}</span>
                </div>

                <h3 className="font-extrabold text-sm text-gray-900 dark:text-white">
                  {job.name}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                  {job.detail}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-black/[0.05] dark:border-white/[0.05] flex items-center justify-between text-[10px] font-mono text-gray-400">
                <span className="truncate max-w-[180px] font-mono">`{job.command}`</span>
                <span className="text-[#5EE2B5] font-bold">ONLINE</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CronScheduleView;
