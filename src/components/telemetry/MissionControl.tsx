import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Activity, 
  BarChart3, 
  Terminal, 
  Layers, 
  Cpu, 
  PlusCircle, 
  CheckCircle2, 
  Clock, 
  ExternalLink, 
  ArrowRight, 
  FolderGit2, 
  Award, 
  Sparkles,
  AlertTriangle,
  FolderTree,
  PlayCircle,
  HelpCircle,
  FlaskConical,
  Flag,
  Flame,
  Zap,
  Sliders,
  Code2,
  Orbit,
  GitBranch,
  Star
} from 'lucide-react';
import { TelemetryStats, ProjectKanbanItem, NoteItem, GraphData, GitHubRepo } from '../../types';
import HermesRadarWidget from '../hermes/HermesRadarWidget';
import { NeuralBrainGalaxy } from '../galaxy/NeuralBrainGalaxy';

interface MissionControlProps {
  stats: TelemetryStats | null;
  projects: ProjectKanbanItem[];
  recentNotes: NoteItem[];
  graphData?: GraphData;
  notes?: NoteItem[];
  gitHubRepos?: GitHubRepo[];
  onOpenNote: (path: string) => void;
  onSelectTab: (tab: string) => void;
  onCreateDailyNote: (priorities?: string[]) => Promise<void>;
  onOpenProjectInIde?: (projectName: string) => void;
}

export const MissionControl: React.FC<MissionControlProps> = ({
  stats,
  projects,
  recentNotes,
  graphData,
  notes = [],
  gitHubRepos = [],
  onOpenNote,
  onSelectTab,
  onCreateDailyNote,
  onOpenProjectInIde,
}) => {
  const [isCreatingDaily, setIsCreatingDaily] = useState(false);
  const [dailyCreatedSuccess, setDailyCreatedSuccess] = useState(false);

  // Local checklist state for the active Enumeration milestone
  const [taskState, setTaskState] = useState<Record<string, boolean>>({
    'SMTP Enumeration Video': true,
    'Enumeration Module Quiz': true,
    'Enumeration Hands-on Lab': false,
    'Enumeration CTF Challenge': false,
  });

  const toggleTask = (taskName: string) => {
    setTaskState((prev) => ({
      ...prev,
      [taskName]: !prev[taskName],
    }));
  };

  const handleQuickDaily = async () => {
    setIsCreatingDaily(true);
    try {
      await onCreateDailyNote();
      setDailyCreatedSuccess(true);
      setTimeout(() => setDailyCreatedSuccess(false), 2500);
    } catch (e) {
      console.error(e);
    } finally {
      setIsCreatingDaily(false);
    }
  };

  const ejpt = stats?.ejptReadiness || {
    percentage: 88,
    currentCourse: 'Course 3: Host & Network Pentesting — Enumeration',
    completedModules: 3,
    totalModules: 5,
    completedLabs: 5,
    totalLabs: 7,
    indexedCommands: 24,
    currentStage: {
      courseName: 'Host & Network Penetration Testing',
      subModule: 'Service & Host Enumeration',
      progress: 88,
      remainingTasks: [
        'SMTP Enumeration Video',
        'Enumeration Module Quiz',
        'Enumeration Hands-on Lab',
        'Enumeration CTF Challenge',
      ],
    },
    categories: [
      { name: '1. Assessment Methodologies & Info Gathering', progress: 100, status: 'Mastered' },
      { name: '2. Network Scanning & Port Discovery', progress: 100, status: 'Mastered' },
      { name: '3. Host & Network Pentesting (Enumeration)', progress: 88, status: 'In Progress (Active)' },
      { name: '4. Vulnerability Assessment & Exploitation', progress: 20, status: 'Next Up' },
      { name: '5. Web Application Penetration Testing', progress: 0, status: 'Queued' },
    ],
  };

  return (
    <div className="space-y-7 max-w-7xl mx-auto pb-16 animate-fadeIn">
      {/* Top Banner / Operator Status Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 bg-white dark:bg-[#12151B] border border-black/[0.07] dark:border-white/[0.08] p-7 rounded-3xl backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#D4FF00] text-black">
              MISSION CONTROL
            </span>
            <span className="text-xs text-gray-500 font-mono">Live Telemetry & Velocity Engine</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-[#D4FF00]" />
            Welcome back, Zakarya
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Your eJPTv2 certification readiness is at <span className="font-bold text-gray-900 dark:text-[#D4FF00]">{ejpt.percentage}%</span>. All local neural agents and vault links are active.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <button
            onClick={handleQuickDaily}
            disabled={isCreatingDaily}
            className={`px-4 py-2 rounded-full font-bold text-xs flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(212,255,0,0.3)] hover:scale-105 ${
              dailyCreatedSuccess
                ? 'bg-emerald-500 text-white'
                : 'bg-[#D4FF00] hover:bg-[#C6F500] text-black'
            }`}
          >
            {dailyCreatedSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Daily Log Created!</span>
              </>
            ) : (
              <>
                <PlusCircle className="w-4 h-4 stroke-[2.5]" />
                <span>{isCreatingDaily ? 'Creating Note...' : '+ New Daily Note'}</span>
              </>
            )}
          </button>

          <button
            onClick={() => onSelectTab('galaxy')}
            className="px-4 py-2 rounded-full bg-black dark:bg-white text-white dark:text-black font-bold text-xs flex items-center gap-1.5 hover:bg-[#D4FF00] dark:hover:bg-[#D4FF00] hover:text-black transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            3D Galaxy
          </button>
        </div>
      </div>

      {/* 4 Telemetry Bento Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Notes */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#181B22] border border-black/[0.07] dark:border-white/[0.08] shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-gray-500">VAULT NOTES</span>
            <span className="p-2 rounded-2xl bg-[#D4FF00]/15 text-black dark:text-[#D4FF00]">
              <FolderTree className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-gray-900 dark:text-white">
              {stats?.totalNotes ?? 115}
            </span>
            <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
              100% Indexed
            </span>
          </div>
          <p className="text-[11px] text-gray-400">Across 6 radial taxonomy branches</p>
        </div>

        {/* eJPT Readiness */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#181B22] border border-black/[0.07] dark:border-white/[0.08] shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-gray-500">eJPTv2 READINESS</span>
            <span className="p-2 rounded-2xl bg-[#D4FF00]/15 text-black dark:text-[#D4FF00]">
              <Award className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#D4FF00]">
              {ejpt.percentage}%
            </span>
            <span className="text-[11px] font-mono text-gray-500">Course 3 Focus</span>
          </div>
          <p className="text-[11px] text-gray-400">Service & Host Enumeration</p>
        </div>

        {/* Command Matrix */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#181B22] border border-black/[0.07] dark:border-white/[0.08] shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-gray-500">PENTEST ARSENAL</span>
            <span className="p-2 rounded-2xl bg-[#D4FF00]/15 text-black dark:text-[#D4FF00]">
              <Terminal className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-gray-900 dark:text-white">
              {stats?.totalCommands ?? 24}
            </span>
            <span className="text-[11px] font-mono text-[#D4FF00] font-bold">
              Paylod Matrix
            </span>
          </div>
          <p className="text-[11px] text-gray-400">With live parameter interpolation</p>
        </div>

        {/* Health Score */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#181B22] border border-black/[0.07] dark:border-white/[0.08] shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-gray-500">BRAIN HEALTH SCORE</span>
            <span className="p-2 rounded-2xl bg-[#D4FF00]/15 text-black dark:text-[#D4FF00]">
              <Activity className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-gray-900 dark:text-white">
              {stats?.vaultHealth?.healthScore ?? 96}%
            </span>
            <span className="text-[11px] font-mono text-gray-500">
              {stats?.totalLinks ?? 241} Links
            </span>
          </div>
          <p className="text-[11px] text-gray-400">
            {stats?.vaultHealth?.orphanCount ?? 2} orphan nodes remaining
          </p>
        </div>
      </div>

      {/* 🛰️ HERMES MISSION CONTROL: 360° RADAR TELEMETRY & OS GAUGES */}
      <HermesRadarWidget />

      {/* 🌌 HERO SECTION: 3D LIVING SECOND BRAIN GALAXY */}
      {graphData && (
        <div className="bg-white dark:bg-[#12151B] border border-black/[0.07] dark:border-white/[0.08] rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-black/[0.06] dark:border-white/[0.08] pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#D4FF00]/10 flex items-center justify-center text-[#D4FF00]">
                <Orbit className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-extrabold text-sm text-gray-900 dark:text-white uppercase tracking-wider">
                    Jarvis Living Neural Brain — 3D Galaxy
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#D4FF00]/15 text-black dark:text-[#D4FF00]">
                    LIVE COSMOS
                  </span>
                </div>
                <p className="text-xs text-gray-500 font-mono mt-0.5">
                  Interactive real-time 3D knowledge universe synced to your Obsidian vault. Click & drag to rotate.
                </p>
              </div>
            </div>

            <button
              onClick={() => onSelectTab('galaxy')}
              className="px-4 py-2 rounded-2xl bg-black dark:bg-white text-white dark:text-black hover:bg-[#D4FF00] dark:hover:bg-[#D4FF00] hover:text-black font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm self-end sm:self-auto"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Full Universe View</span>
            </button>
          </div>

          <NeuralBrainGalaxy
            graphData={graphData}
            notes={notes}
            onOpenNote={onOpenNote}
            isEmbedded={true}
            height="h-[480px]"
            onExpandFullscreen={() => onSelectTab('galaxy')}
          />
        </div>
      )}

      {/* Main 2-Column Bento: eJPT Roadmap & Projects Velocity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: eJPT Live Roadmap & Checklist (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-[#181B22] border border-black/[0.07] dark:border-white/[0.08] rounded-3xl p-6 space-y-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.08] pb-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#D4FF00]" />
              <h2 className="font-extrabold text-sm text-gray-900 dark:text-white">
                eJPTv2 ACTIVE ROADMAP
              </h2>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-[#D4FF00]/20 text-black dark:text-[#D4FF00] border border-[#D4FF00]/30 font-bold">
              COURSE 3 / 5
            </span>
          </div>

          {/* Active Course Card */}
          <div className="p-4 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.06] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-[#D4FF00] uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#D4FF00] animate-ping" />
                ACTIVE FOCUS: ENUMERATION
              </span>
              <span className="text-xs font-bold font-mono text-[#D4FF00]">88%</span>
            </div>

            <p className="text-xs text-gray-700 dark:text-gray-300 font-medium leading-relaxed">
              <strong>Course 3:</strong> Host & Network Penetration Testing — Service & Host Enumeration.
            </p>

            {/* Interactive Checklist */}
            <div className="space-y-2 pt-1">
              {Object.entries(taskState).map(([task, done]) => (
                <button
                  key={task}
                  onClick={() => toggleTask(task)}
                  className="w-full flex items-center justify-between p-2 rounded-xl bg-white dark:bg-black/40 border border-black/[0.04] dark:border-white/[0.05] text-left hover:border-[#D4FF00] transition-colors"
                >
                  <span className={`text-xs font-mono ${done ? 'line-through text-gray-400' : 'text-gray-800 dark:text-gray-200'}`}>
                    {task}
                  </span>
                  <CheckCircle2 className={`w-4 h-4 ${done ? 'text-emerald-500' : 'text-gray-400'}`} />
                </button>
              ))}
            </div>
          </div>

          {/* Category Progress Bars */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono font-bold text-gray-500 uppercase">
              Certification Domain Weights
            </h3>
            {ejpt.categories.map((cat) => (
              <div key={cat.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-gray-700 dark:text-gray-300 truncate pr-2">{cat.name}</span>
                  <span className="font-bold text-[#D4FF00]">{cat.progress}%</span>
                </div>
                <div className="w-full bg-black/10 dark:bg-white/10 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-[#D4FF00] h-full rounded-full transition-all duration-500" 
                    style={{ width: `${cat.progress}%` }} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Active Projects & Recent Notes (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Active Projects Bento */}
          <div className="bg-white dark:bg-[#181B22] border border-black/[0.07] dark:border-white/[0.08] rounded-3xl p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.08] pb-4">
              <div className="flex items-center gap-2">
                <FolderGit2 className="w-5 h-5 text-[#D4FF00]" />
                <h2 className="font-extrabold text-sm text-gray-900 dark:text-white">
                  ACTIVE SOFTWARE & LAB SUITES
                </h2>
              </div>
              <button
                onClick={() => onSelectTab('projects')}
                className="text-xs font-bold text-gray-600 dark:text-gray-400 hover:text-[#D4FF00] flex items-center gap-1 transition-colors"
              >
                View Tracker <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {projects.slice(0, 4).map((p) => (
                <div
                  key={p.id}
                  className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.05] dark:border-white/[0.06] space-y-2 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono text-gray-500">{p.category}</span>
                      <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-[#D4FF00]/20 text-black dark:text-[#D4FF00]">
                        {p.status}
                      </span>
                    </div>
                    <h4 className="font-bold text-xs text-gray-900 dark:text-white line-clamp-1">{p.title}</h4>
                    <p className="text-[11px] text-gray-500 line-clamp-2 mt-0.5">{p.description}</p>
                  </div>

                  <div className="pt-2 border-t border-black/[0.04] dark:border-white/[0.04] flex items-center justify-between">
                    <span className="text-[10px] font-mono text-gray-500 font-bold">{p.progress}% Complete</span>
                    {onOpenProjectInIde && (
                      <button
                        onClick={() => onOpenProjectInIde(p.title)}
                        className="text-[11px] font-bold text-gray-700 dark:text-gray-300 hover:text-[#D4FF00] flex items-center gap-1"
                      >
                        <Code2 className="w-3.5 h-3.5" /> IDE
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Vault Feed */}
          <div className="bg-white dark:bg-[#181B22] border border-black/[0.07] dark:border-white/[0.08] rounded-3xl p-6 space-y-3 shadow-sm">
            <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#D4FF00]" />
                <h3 className="font-bold text-xs text-gray-900 dark:text-white">
                  RECENT OBSIDIAN MEMORY FEED
                </h3>
              </div>
              <span className="text-[10px] font-mono text-gray-500">Direct Disk Sync</span>
            </div>

            <div className="space-y-2">
              {recentNotes.slice(0, 4).map((note) => (
                <button
                  key={note.id}
                  onClick={() => onOpenNote(note.path)}
                  className="w-full p-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] hover:bg-[#D4FF00]/10 border border-black/[0.04] dark:border-white/[0.04] flex items-center justify-between text-left transition-colors group"
                >
                  <div className="truncate pr-3">
                    <span className="text-xs font-semibold text-gray-900 dark:text-white group-hover:text-[#D4FF00] block truncate">
                      {note.title}
                    </span>
                    <span className="text-[10px] font-mono text-gray-400 truncate block">
                      {note.relativePath}
                    </span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#D4FF00] shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 🚀 GITHUB CLOUD PORTFOLIO SPOTLIGHT */}
      {gitHubRepos && gitHubRepos.length > 0 && (
        <div className="bg-white dark:bg-[#12151B] border border-black/[0.07] dark:border-white/[0.08] rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-black/[0.06] dark:border-white/[0.08] pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#D4FF00]/10 flex items-center justify-center text-[#D4FF00]">
                <FolderGit2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-gray-900 dark:text-white uppercase tracking-wider">
                  GitHub Cloud Portfolio Spotlight
                </h3>
                <p className="text-xs text-gray-500 font-mono mt-0.5">
                  Live synchronized projects from @oukil078-oss. Full source explorer & formatted IDE available.
                </p>
              </div>
            </div>

            <button
              onClick={() => onSelectTab('github')}
              className="px-4 py-2 rounded-2xl bg-[#D4FF00] hover:bg-[#C6F500] text-black font-bold text-xs flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(212,255,0,0.2)]"
            >
              <span>Explore All {gitHubRepos.length} Repositories</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {gitHubRepos.slice(0, 4).map((repo) => (
              <div
                key={repo.id}
                onClick={() => onSelectTab('github')}
                className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.05] hover:border-[#D4FF00]/40 transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-bold text-xs text-gray-900 dark:text-white group-hover:text-[#D4FF00] truncate">
                      {repo.name}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
                      repo.private ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'
                    }`}>
                      {repo.private ? 'Private' : 'Public'}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
                    {repo.description || 'Fullstack project in portfolio.'}
                  </p>
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-gray-400 pt-2 border-t border-black/[0.04] dark:border-white/[0.04]">
                  <span className="font-bold text-gray-300">{repo.language || 'Code'}</span>
                  <div className="flex items-center gap-1 text-[#D4FF00]">
                    <Star className="w-3 h-3" />
                    <span>{repo.stargazers_count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
