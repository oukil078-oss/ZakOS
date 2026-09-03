import React from 'react';
import { 
  Compass, 
  Share2, 
  Edit3, 
  Terminal, 
  Bot, 
  BarChart3, 
  Sparkles, 
  FolderTree, 
  ShieldCheck, 
  Zap,
  Code,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronLeft,
  ChevronRight,
  Layers
} from 'lucide-react';

export type NavTab = 'nucleus' | 'graph' | 'editor' | 'commands' | 'agents' | 'telemetry' | 'ide' | 'coding' | 'terminal';

interface JarvisSidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const JarvisSidebar: React.FC<JarvisSidebarProps> = ({ 
  activeTab, 
  onTabChange,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const navItems: { id: NavTab; label: string; icon: React.ComponentType<any>; color: string; branchBadge?: string }[] = [
    {
      id: 'nucleus',
      label: 'Master Nucleus',
      icon: Compass,
      color: 'text-amber-400',
      branchBadge: 'Tier 0'
    },
    {
      id: 'ide',
      label: 'Fullstack IDE',
      icon: Code,
      color: 'text-blue-400',
      branchBadge: 'Branch 2'
    },
    {
      id: 'terminal',
      label: 'Tactical Terminal',
      icon: Terminal,
      color: 'text-emerald-400',
      branchBadge: 'PS Shell'
    },
    {
      id: 'graph',
      label: 'Force Graph 3D',
      icon: Share2,
      color: 'text-cyan-400',
      branchBadge: 'Topology'
    },
    {
      id: 'editor',
      label: 'Markdown Studio',
      icon: Edit3,
      color: 'text-emerald-400',
      branchBadge: 'Cockpit'
    },
    {
      id: 'commands',
      label: 'Command Matrix',
      icon: Layers,
      color: 'text-amber-400',
      branchBadge: 'Cyber'
    },
    {
      id: 'agents',
      label: 'JARVIS Crew (AI)',
      icon: Bot,
      color: 'text-purple-400',
      branchBadge: '6 Agents'
    },
    {
      id: 'telemetry',
      label: 'Mission Control',
      icon: BarChart3,
      color: 'text-rose-400',
      branchBadge: 'eJPTv2'
    },
  ];

  return (
    <aside
      className={`bg-space-900/95 border-r border-cyan-500/20 flex flex-col justify-between p-2 select-none z-20 shrink-0 transition-all duration-300 ${
        isCollapsed ? 'w-14 items-center' : 'w-56'
      }`}
    >
      {/* Top Nav Items */}
      <div className="space-y-1 w-full">
        {/* Header with Collapse Toggle */}
        <div className="flex items-center justify-between px-2 py-1.5 mb-1 border-b border-slate-800/80">
          {!isCollapsed && (
            <span className="text-[10px] font-mono text-cyan-400/70 tracking-widest uppercase truncate font-bold">
              NAVIGATION
            </span>
          )}

          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className={`p-1 rounded-md text-slate-400 hover:text-cyan-300 hover:bg-space-800 transition ${
                isCollapsed ? 'w-full flex justify-center' : ''
              }`}
              title={isCollapsed ? 'Expand Navigation Sidebar' : 'Collapse Navigation Sidebar'}
            >
              {isCollapsed ? <PanelLeftOpen className="w-4 h-4 text-cyan-400" /> : <PanelLeftClose className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              title={isCollapsed ? item.label : undefined}
              className={`w-full flex items-center ${
                isCollapsed ? 'justify-center px-0 py-2.5' : 'justify-between px-3 py-2.5'
              } rounded-lg font-mono text-xs transition-all relative group ${
                isActive
                  ? 'bg-cyan-500/15 text-cyan-200 border border-cyan-500/40 shadow-glow-cyan'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-space-800/80 border border-transparent'
              }`}
            >
              <div className="flex items-center space-x-3 truncate">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                    isActive ? item.color : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />
                {!isCollapsed && (
                  <span className="font-medium tracking-wide truncate">
                    {item.label}
                  </span>
                )}
              </div>

              {!isCollapsed && item.branchBadge && (
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-space-950/80 border border-slate-700 text-slate-400 font-mono shrink-0 ml-1">
                  {item.branchBadge}
                </span>
              )}

              {/* Active indicator bar */}
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-cyan-400 rounded-r shadow-glow-cyan" />
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Vault Taxonomy Mini Legend / Toggle Footer */}
      {!isCollapsed ? (
        <div className="space-y-2 p-2.5 rounded-lg bg-space-950/70 border border-cyan-500/15 text-[10px] font-mono w-full">
          <div className="flex items-center justify-between text-slate-400 pb-1 border-b border-slate-800">
            <span className="flex items-center gap-1 text-cyan-400 font-bold">
              <FolderTree className="w-3 h-3" /> TAXONOMY
            </span>
            <span className="text-[9px] text-slate-500">6 TIERS</span>
          </div>
          <div className="space-y-1 pt-1 text-slate-300">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 shadow-glow-gold" />
                Nucleus Root
              </span>
              <span className="text-slate-500 text-[9px]">T0</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                Coding Projects
              </span>
              <span className="text-slate-500 text-[9px]">T2</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                AI Agents OS
              </span>
              <span className="text-slate-500 text-[9px]">T3</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full flex justify-center py-2 border-t border-slate-800">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" title="Zak_OS Online" />
        </div>
      )}
    </aside>
  );
};
