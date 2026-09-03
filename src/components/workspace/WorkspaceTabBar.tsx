import React, { useState } from 'react';
import { 
  BarChart3, 
  Layers, 
  Edit3, 
  Terminal, 
  Bot, 
  Code2, 
  Plus, 
  X, 
  ChevronDown, 
  FolderGit2, 
  Sparkles,
  ExternalLink,
  Cpu
} from 'lucide-react';
import { WorkspaceTab, ProjectInfo } from '../../types';

interface WorkspaceTabBarProps {
  tabs: WorkspaceTab[];
  activeTabId: string;
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string) => void;
  onOpenProjectTab: (project: ProjectInfo) => void;
  availableProjects: ProjectInfo[];
}

export const WorkspaceTabBar: React.FC<WorkspaceTabBarProps> = ({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  onOpenProjectTab,
  availableProjects,
}) => {
  const [isNewProjectMenuOpen, setIsNewProjectMenuOpen] = useState(false);

  const getTabIcon = (tab: WorkspaceTab) => {
    if (tab.type === 'ide') {
      return <Code2 className="w-3.5 h-3.5 text-cyan-400" />;
    }
    switch (tab.systemTabId) {
      case 'telemetry':
        return <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />;
      case 'graph':
        return <Layers className="w-3.5 h-3.5 text-amber-400" />;
      case 'editor':
        return <Edit3 className="w-3.5 h-3.5 text-cyan-400" />;
      case 'commands':
        return <Terminal className="w-3.5 h-3.5 text-purple-400" />;
      case 'agents':
        return <Bot className="w-3.5 h-3.5 text-pink-400" />;
      default:
        return <Cpu className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <div className="h-10 bg-space-950 border-b border-cyan-500/20 px-3 flex items-center justify-between shrink-0 select-none font-mono text-xs z-30">
      {/* Left: OS Traffic Lights & Scrollable Tabs Bar */}
      <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar flex-1 mr-2">
        {/* OS Traffic Lights */}
        <div className="flex items-center space-x-1.5 px-1 shrink-0">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 border border-rose-400/40" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 border border-amber-400/40" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 border border-emerald-400/40" />
        </div>

        <div className="h-4 w-[1px] bg-slate-800 shrink-0" />

        {/* Tab Items */}
        <div className="flex items-center space-x-1">
          {tabs.map((tab, idx) => {
            const isActive = tab.id === activeTabId;

            return (
              <div
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`group flex items-center space-x-2 px-3 py-1 rounded-t-md text-xs cursor-pointer transition-all border-t border-x ${
                  isActive
                    ? 'bg-space-900 border-cyan-500/40 text-slate-100 shadow-sm font-bold'
                    : 'bg-space-950/70 border-transparent text-slate-400 hover:bg-space-900/60 hover:text-slate-200'
                }`}
              >
                {getTabIcon(tab)}
                <span className="truncate max-w-[130px] font-sans font-medium text-[11px]">
                  {tab.title}
                </span>

                {/* Keyboard Shortcut Hint badge */}
                {idx < 9 && (
                  <span className="text-[9px] text-slate-600 group-hover:text-slate-400 font-mono hidden md:inline">
                    ⌥{idx + 1}
                  </span>
                )}

                {/* Close Button for non-pinned tabs */}
                {!tab.isPinned && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCloseTab(tab.id);
                    }}
                    className="p-0.5 rounded hover:bg-space-800 text-slate-500 hover:text-rose-400 transition"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* + Add New IDE Workspace Tab */}
        <div className="relative shrink-0">
          <button
            onClick={() => setIsNewProjectMenuOpen(!isNewProjectMenuOpen)}
            className="flex items-center space-x-1 px-2 py-1 rounded bg-space-900 hover:bg-space-800 border border-slate-800 hover:border-cyan-500/40 text-slate-300 text-[11px] transition"
            title="Open Project in New IDE Workspace"
          >
            <Plus className="w-3 h-3 text-cyan-400" />
            <span className="hidden sm:inline">IDE WORKSPACE</span>
            <ChevronDown className="w-2.5 h-2.5 text-slate-500" />
          </button>

          {isNewProjectMenuOpen && (
            <div className="absolute left-0 mt-1 w-64 bg-space-900 border border-cyan-500/40 rounded-xl shadow-glass-glow py-1 z-50 animate-in fade-in text-xs font-mono">
              <div className="px-3 py-1.5 text-[10px] text-slate-500 font-bold uppercase border-b border-slate-800 flex items-center justify-between">
                <span>LAUNCH CODING WORKSPACE</span>
                <span className="text-cyan-400">ARCHITECT-02</span>
              </div>

              <div className="max-h-60 overflow-y-auto p-1 space-y-0.5">
                {availableProjects.map((proj) => (
                  <button
                    key={proj.id}
                    onClick={() => {
                      onOpenProjectTab(proj);
                      setIsNewProjectMenuOpen(false);
                    }}
                    className="w-full p-2 rounded-lg text-left hover:bg-space-800 text-slate-300 hover:text-cyan-300 flex items-start space-x-2 transition"
                  >
                    <FolderGit2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                    <div className="truncate flex-1 min-w-0">
                      <div className="font-bold text-[11px] truncate text-slate-100">
                        {proj.title}
                      </div>
                      <div className="text-[9px] text-slate-500 truncate">
                        {proj.category} • {proj.language.toUpperCase()}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right: OS Status Indicator */}
      <div className="hidden lg:flex items-center space-x-3 text-[10px] text-slate-500 shrink-0">
        <span className="flex items-center space-x-1 text-cyan-400">
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>ZAK_OS v2.4</span>
        </span>
        <span className="text-slate-600">|</span>
        <span>WORKSPACE ENGINE: ACTIVE</span>
      </div>
    </div>
  );
};
