import React from 'react';
import { 
  LayoutDashboard, 
  FolderKanban, 
  FolderGit2,
  Orbit, 
  Bot, 
  Crosshair, 
  Code2, 
  Mic, 
  User, 
  Search, 
  Moon, 
  Sun,
  Activity
} from 'lucide-react';
import { SystemTabId } from '../../types';
import LiquidGlassWebGL from '../ui/LiquidGlassWebGL';

interface FloatingCapsuleDockProps {
  activeTab: SystemTabId;
  onSelectTab: (tab: SystemTabId) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenCommandPalette: () => void;
  vaultConnected: boolean;
  totalNotes: number;
}

export const FloatingCapsuleDock: React.FC<FloatingCapsuleDockProps> = ({
  activeTab,
  onSelectTab,
  theme,
  onToggleTheme,
  onOpenCommandPalette,
  vaultConnected,
  totalNotes,
}) => {
  const navItems: { id: SystemTabId; label: string; icon: any; badge?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'projects', label: 'Projects', icon: FolderKanban },
    { id: 'github', label: 'GitHub Cloud', icon: FolderGit2, badge: 'Portfolio' },
    { id: 'galaxy', label: 'Second Brain', icon: Orbit, badge: `${totalNotes}` },
    { id: 'agents', label: 'Jarvis Crew', icon: Bot },
    { id: 'pentest', label: 'Pentest Lab', icon: Crosshair },
    { id: 'ide', label: 'Live IDE', icon: Code2 },
    { id: 'voice', label: 'Voice AI', icon: Mic, badge: 'SOON' },
    { id: 'about', label: 'About Me', icon: User },
  ];

  // Map legacy tabs if needed
  const normalizedActive = 
    activeTab === 'telemetry' ? 'dashboard' :
    activeTab === 'graph' ? 'galaxy' :
    activeTab === 'commands' ? 'pentest' :
    activeTab;

  return (
    <header className="sticky top-4 z-50 px-4 sm:px-6 max-w-7xl mx-auto w-full mb-6 transition-all duration-300">
      <LiquidGlassWebGL
        theme={theme}
        thickness={62}
        bezel={60}
        ior={3.0}
        blur={2.0}
        specular={0.55}
        tint={0.08}
        shadow={0.50}
        radius={100}
        className="w-full shadow-[0_15px_45px_rgba(0,0,0,0.6)]"
      >
        <div className="flex items-center justify-between gap-3 px-5 py-3 w-full backdrop-blur-md">
          {/* Brand Logo & Operator Tag */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => onSelectTab('dashboard')}
              className="flex items-center gap-2.5 group focus:outline-none"
            >
              <div className="w-8 h-8 rounded-full bg-[#D4FF00] flex items-center justify-center shadow-[0_0_20px_rgba(212,255,0,0.5)] group-hover:scale-105 transition-transform">
                <span className="text-black font-black text-xs tracking-tighter">ZO</span>
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-extrabold tracking-wider ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                    ZAK_OS
                  </span>
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#D4FF00] animate-pulse shadow-[0_0_8px_#D4FF00]" />
                </div>
                <span className={`text-[10px] font-mono leading-none ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  JARVIS V2.4
                </span>
              </div>
            </button>
          </div>

          {/* Floating Capsule Nav Items */}
          <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = normalizedActive === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`
                    relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 whitespace-nowrap
                    ${isActive 
                      ? 'bg-[#D4FF00] text-black shadow-[0_0_20px_rgba(212,255,0,0.4)] scale-105 font-bold' 
                      : theme === 'dark'
                        ? 'text-gray-300 hover:text-white hover:bg-white/[0.08]'
                        : 'text-gray-700 hover:text-black hover:bg-black/[0.06]'
                    }
                  `}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-black stroke-[2.5]' : ''}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className={`
                      text-[9px] font-bold px-1.5 py-0.2 rounded-full
                      ${isActive 
                        ? 'bg-black text-[#D4FF00]' 
                        : item.badge === 'SOON'
                          ? 'bg-[#D4FF00]/20 text-[#D4FF00] border border-[#D4FF00]/30'
                          : theme === 'dark' ? 'bg-white/10 text-gray-300' : 'bg-black/10 text-gray-700'
                      }
                    `}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action Tools: Search, Theme, Live Status */}
          <div className="flex items-center gap-2">
            {/* Omni Search Button */}
            <button
              onClick={onOpenCommandPalette}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono transition-all
                ${theme === 'dark'
                  ? 'bg-white/[0.06] hover:bg-white/[0.12] text-gray-300 border border-white/[0.08]'
                  : 'bg-black/[0.04] hover:bg-black/[0.08] text-gray-700 border border-black/[0.06]'
                }
              `}
              title="Search Vault & Commands (Ctrl+K)"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden md:inline text-[11px]">Search</span>
              <kbd className="hidden lg:inline px-1 py-0.2 text-[9px] rounded bg-black/20 dark:bg-white/10 border border-current opacity-60">
                ⌘K
              </kbd>
            </button>

            {/* Theme Toggle Button */}
            <button
              onClick={onToggleTheme}
              className={`
                p-2 rounded-full transition-all
                ${theme === 'dark'
                  ? 'bg-white/[0.06] hover:bg-white/[0.12] text-[#D4FF00]'
                  : 'bg-black/[0.04] hover:bg-black/[0.08] text-gray-800'
                }
              `}
              title={theme === 'dark' ? 'Switch to Neo-Lumin Light Mode' : 'Switch to Tactical Dark Mode'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Live Vault / Socket Pulse Indicator */}
            <div 
              className={`
                hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono
                ${vaultConnected 
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                }
              `}
              title={vaultConnected ? 'Obsidian Vault Connected via WebSocket' : 'Connecting to Vault...'}
            >
              <Activity className="w-3 h-3 animate-spin" style={{ animationDuration: '3s' }} />
              <span className="font-bold">{vaultConnected ? 'SYNCED' : 'OFFLINE'}</span>
            </div>
          </div>
        </div>
      </LiquidGlassWebGL>
    </header>
  );
};