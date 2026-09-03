import React, { useState, useEffect } from 'react';
import { JarvisHeader } from './JarvisHeader';
import { JarvisSidebar, NavTab } from './JarvisSidebar';
import { TelemetryStats } from '../../types';

interface JarvisHUDLayoutProps {
  stats: TelemetryStats | null;
  isConnected: boolean;
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onOpenCommandPalette: () => void;
  onQuickDailyNote: () => void;
  onSelectAgent: (agentId: string) => void;
  children: React.ReactNode;
}

export const JarvisHUDLayout: React.FC<JarvisHUDLayoutProps> = ({
  stats,
  isConnected,
  activeTab,
  onTabChange,
  onOpenCommandPalette,
  onQuickDailyNote,
  onSelectAgent,
  children,
}) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('zakos_sidebar_collapsed') === 'true';
    } catch (e) {
      return false;
    }
  });

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('zakos_sidebar_collapsed', String(next));
      } catch (e) {}
      return next;
    });
  };

  // Keyboard shortcut Ctrl+B or Alt+S to toggle global navigation sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        // Only toggle if not actively focused in Monaco editor or input
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && !target.classList.contains('inputarea')) {
          e.preventDefault();
          toggleSidebar();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen bg-space-950 text-slate-100 overflow-hidden relative font-sans">
      {/* Background Cyber Grid & Vignette */}
      <div className="absolute inset-0 bg-grid-pattern pointer-events-none opacity-40 z-0" />
      <div className="absolute inset-0 bg-radial-vignette pointer-events-none z-0" />
      
      {/* Ambient Top Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-cyan-500/10 blur-3xl pointer-events-none z-0" />

      {/* Top Telemetry Header */}
      <JarvisHeader
        stats={stats}
        isConnected={isConnected}
        onOpenCommandPalette={onOpenCommandPalette}
        onQuickDailyNote={onQuickDailyNote}
        onSelectAgent={onSelectAgent}
      />

      {/* Main Workspace Frame */}
      <div className="flex flex-1 overflow-hidden relative z-10">
        <JarvisSidebar 
          activeTab={activeTab} 
          onTabChange={onTabChange} 
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={toggleSidebar}
        />

        <main className="flex-1 overflow-hidden relative flex flex-col bg-space-900/40 backdrop-blur-sm">
          {children}
        </main>
      </div>
    </div>
  );
};
