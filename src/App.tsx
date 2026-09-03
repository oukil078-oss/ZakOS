import React, { useState, useEffect, useCallback } from 'react';
import { FloatingCapsuleDock } from './components/layout/FloatingCapsuleDock';
import { MissionControl } from './components/telemetry/MissionControl';
import { ProjectsTrackerView } from './components/projects/ProjectsTrackerView';
import { NeuralBrainGalaxy } from './components/galaxy/NeuralBrainGalaxy';
import { Editor } from './components/editor/Editor';
import { AgentChat } from './components/agents/AgentChat';
import { CommandMatrixView } from './components/commands/CommandMatrixView';
import { IdeWorkspace } from './components/ide/IdeWorkspace';
import { VoiceJarvisView } from './components/voice/VoiceJarvisView';
import { AboutOperatorView } from './components/profile/AboutOperatorView';
import { TacticalTerminalView } from './components/terminal/TacticalTerminalView';
import { CommandPalette } from './components/commands/CommandPalette';
import { GitHubWorkspaceView } from './components/github/GitHubWorkspaceView';
import { AgentCollectiveView } from './components/hermes/AgentCollectiveView';
import { CronScheduleView } from './components/schedule/CronScheduleView';
import { AgentContentLibraryView } from './components/content/AgentContentLibraryView';
import { ForgeFleetView } from './components/forge/ForgeFleetView';
import { api } from './services/api';
import { useVaultSync } from './hooks/useVaultSync';
import { 
  NoteItem, 
  GraphData, 
  CommandItem, 
  ProjectKanbanItem, 
  TelemetryStats, 
  SystemTabId,
  ProjectInfo,
  ModelOption,
  ThemeMode,
  GitHubRepo
} from './types';

export const App: React.FC = () => {
  // Current active OS module tab
  const [activeTab, setActiveTab] = useState<SystemTabId>('dashboard');
  
  // Theme Mode: 'dark' (Pro Tactical) vs 'light' (Lumin Neo-Bento)
  const [theme, setTheme] = useState<ThemeMode>(() => {
    return (localStorage.getItem('zakos_theme') as ThemeMode) || 'dark';
  });

  // Vault & Telemetry State
  const [stats, setStats] = useState<TelemetryStats | null>(null);
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [commands, setCommands] = useState<CommandItem[]>([]);
  const [projects, setProjects] = useState<ProjectKanbanItem[]>([]);
  const [recentNotes, setRecentNotes] = useState<NoteItem[]>([]);
  const [selectedNotePath, setSelectedNotePath] = useState<string | null>(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('pentest');
  const [agentSubTab, setAgentSubTab] = useState<'collective' | 'chat'>('collective');
  
  // Available Projects & AI Models for IDE
  const [availableProjects, setAvailableProjects] = useState<ProjectInfo[]>([]);
  const [currentIdeProject, setCurrentIdeProject] = useState<ProjectInfo | null>(null);
  const [models, setModels] = useState<ModelOption[]>([]);
  const [gitHubRepos, setGitHubRepos] = useState<GitHubRepo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Sync theme with HTML document class
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('zakos_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Fetch full vault telemetry & caches
  const loadVaultData = useCallback(async () => {
    try {
      const [overviewData, notesList, graph, cmdList, projList, projFullList, modelList] = await Promise.all([
        api.getOverview(),
        api.getNotes(),
        api.getGraph(),
        api.getCommands(),
        api.getProjects(),
        api.getProjectList(),
        api.getModels(),
      ]);

      setStats(overviewData.stats);
      setRecentNotes(overviewData.recentNotes);
      setNotes(notesList);
      setGraphData(graph);
      setCommands(cmdList);
      setProjects(projList);
      setAvailableProjects(projFullList);
      if (projFullList.length > 0 && !currentIdeProject) {
        const zakOsProject = projFullList.find(
          (p) => p.name.toLowerCase() === 'zak_os' || p.id.includes('zak_os')
        );
        setCurrentIdeProject(zakOsProject || projFullList[0]);
      }
      setModels(modelList);

      // Fetch GitHub repos in background for Home Page Spotlight
      api.getGitHubRepos().then(setGitHubRepos).catch((err) => {
        console.warn('[App] GitHub repos background load error:', err);
      });
    } catch (err) {
      console.error('[App] Error loading vault data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentIdeProject]);

  useEffect(() => {
    loadVaultData();
  }, [loadVaultData]);

  // Live WebSocket Vault Synchronization
  const { isConnected } = useVaultSync(loadVaultData);

  // Keyboard Shortcuts: Alt+1 to Alt+9 for tabs, Ctrl+K for Search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key >= '1' && e.key <= '9') {
        const tabMap: SystemTabId[] = [
          'dashboard', 
          'projects', 
          'github',
          'galaxy', 
          'agents', 
          'pentest', 
          'ide', 
          'voice', 
          'about'
        ];
        const idx = parseInt(e.key, 10) - 1;
        if (tabMap[idx]) {
          setActiveTab(tabMap[idx]);
        }
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Open Project in IDE
  const handleOpenProjectInIde = (projectOrTitle: ProjectInfo | string) => {
    let proj: ProjectInfo | undefined;
    if (typeof projectOrTitle === 'string') {
      proj = availableProjects.find(
        (p) =>
          p.title.toLowerCase().includes(projectOrTitle.toLowerCase()) ||
          p.name.toLowerCase().includes(projectOrTitle.toLowerCase())
      );
      if (!proj && availableProjects.length > 0) {
        proj = availableProjects[0];
      }
    } else {
      proj = projectOrTitle;
    }

    if (proj) {
      setCurrentIdeProject(proj);
      setActiveTab('ide');
    }
  };

  // Open note in Monaco Studio
  const handleOpenNoteInEditor = (path: string) => {
    setSelectedNotePath(path);
    setActiveTab('editor');
  };

  // Save note handler
  const handleSaveNote = async (path: string, content: string, frontmatter?: Record<string, any>) => {
    try {
      const saved = await api.saveNote(path, content, frontmatter);
      setSelectedNotePath(saved.relativePath);
      await loadVaultData();
    } catch (err) {
      console.error('[App] Error saving note:', err);
      alert('Failed to save note to disk.');
    }
  };

  // Delete note handler
  const handleDeleteNote = async (path: string) => {
    try {
      await api.deleteNote(path);
      setSelectedNotePath(null);
      await loadVaultData();
    } catch (err) {
      console.error('[App] Error deleting note:', err);
    }
  };

  // Quick Daily Note Creation
  const handleQuickDailyNote = async (priorities?: string[]) => {
    try {
      const newDaily = await api.createDailyNote(priorities);
      await loadVaultData();
      setSelectedNotePath(newDaily.relativePath);
      setActiveTab('editor');
    } catch (err) {
      console.error('[App] Failed to create daily note:', err);
    }
  };

  // Add new command note from Command Matrix
  const handleSaveNewCommandNote = async (
    title: string,
    tool: string,
    category: string,
    command: string,
    description: string
  ) => {
    try {
      const cleanTitle = title.replace(/[\\/:*?"<>|]/g, '');
      const relPath = `01 Certifications/EJPT Certification/Commands/${cleanTitle}.md`;
      const content = `
# ${title}
**⬆️ Parent:** [[01 Certifications/EJPT Certification/Commands/EJPT Commands — Hub]]

---

## ⚡ Command Syntax
\`\`\`bash
${command}
\`\`\`

## 📝 Methodology & Usage Notes
${description}
`;

      const frontmatter = {
        title,
        type: 'leaf',
        category: 'cybersecurity',
        tool,
        tier: 4,
        status: 'active',
        tags: ['command', tool, 'ejpt'],
        created: new Date().toISOString().split('T')[0],
        updated: new Date().toISOString().split('T')[0],
        parent: '[[01 Certifications/EJPT Certification/Commands/EJPT Commands — Hub]]',
      };

      const saved = await api.saveNote(relPath, content.trim(), frontmatter);
      await loadVaultData();
      setSelectedNotePath(saved.relativePath);
      setActiveTab('editor');
    } catch (err) {
      console.error('[App] Error adding command note:', err);
    }
  };

  // Save Agent output directly to note
  const handleSaveAgentOutputToNote = async (
    title: string,
    content: string,
    branchDir: string,
    category: string
  ) => {
    try {
      const cleanTitle = title.replace(/[\\/:*?"<>|]/g, '');
      const relPath = `${branchDir}/${cleanTitle}.md`;

      const fullContent = `
# ${title}
**⬆️ Parent:** [[🏛 Zakarya Oukil — Master Root]]

---

${content}
`;

      const frontmatter = {
        title,
        type: 'leaf',
        category,
        tier: 4,
        status: 'active',
        tags: ['ai-agent-output', category],
        created: new Date().toISOString().split('T')[0],
        updated: new Date().toISOString().split('T')[0],
        parent: '[[🏛 Zakarya Oukil — Master Root]]',
      };

      const saved = await api.saveNote(relPath, fullContent.trim(), frontmatter);
      await loadVaultData();
      setSelectedNotePath(saved.relativePath);
      setActiveTab('editor');
    } catch (err) {
      console.error('[App] Error saving agent output to note:', err);
    }
  };

  // Fallback default IDE project
  const ideProject = currentIdeProject || (availableProjects.length > 0 ? availableProjects[0] : {
    id: 'default-project',
    name: 'Zak_OS',
    title: 'Zak_OS Multi-Agent Command Center',
    path: 'C:/Users/Zakar/Documents/Web_Dev/Zak_OS',
    category: 'Web Dev / AI',
    type: 'external',
    description: 'Active project workspace',
    language: 'typescript',
  });

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === 'dark' ? 'bg-[#0B0D10] text-[#F3F4F6]' : 'bg-[#F4F6F8] text-[#0E1116]'
    } flex flex-col`}>
      {/* Floating Capsule Dock Header */}
      <FloatingCapsuleDock
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        vaultConnected={isConnected}
        totalNotes={notes.length || 115}
      />

      {/* Main OS Viewport Container with Generous Spacing */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-24 space-y-8">
        {/* Module 1: Dashboard */}
        {(activeTab === 'dashboard' || activeTab === 'telemetry') && (
          <MissionControl
            stats={stats}
            projects={projects}
            recentNotes={recentNotes}
            graphData={graphData}
            notes={notes}
            gitHubRepos={gitHubRepos}
            onOpenNote={handleOpenNoteInEditor}
            onSelectTab={(t) => setActiveTab(t as SystemTabId)}
            onCreateDailyNote={handleQuickDailyNote}
            onOpenProjectInIde={handleOpenProjectInIde}
          />
        )}

        {/* Module 2: Projects Tracker */}
        {activeTab === 'projects' && (
          <ProjectsTrackerView
            projects={projects}
            availableProjects={availableProjects}
            onOpenProjectInIde={handleOpenProjectInIde}
            onOpenNote={handleOpenNoteInEditor}
            onOpenGitHub={() => setActiveTab('github')}
          />
        )}

        {/* Module 2b: GitHub Cloud Portfolio & Projects */}
        {activeTab === 'github' && (
          <GitHubWorkspaceView
            theme={theme}
            onOpenInLocalIde={handleOpenProjectInIde}
          />
        )}

        {/* Module 3: Jarvis Second Brain (3D Living Galaxy) */}
        {(activeTab === 'galaxy' || activeTab === 'graph') && (
          <NeuralBrainGalaxy
            graphData={graphData}
            notes={notes}
            onOpenNote={handleOpenNoteInEditor}
            onOpenStudio={() => setActiveTab('editor')}
          />
        )}

        {/* Module 3b: Notes Monaco Studio */}
        {activeTab === 'editor' && (
          <Editor
            notes={notes}
            selectedNotePath={selectedNotePath}
            onSelectNotePath={setSelectedNotePath}
            onSaveNote={handleSaveNote}
            onDeleteNote={handleDeleteNote}
          />
        )}

        {/* Module 4: Jarvis Multi-Agent Hierarchy & Hermes Subagent Collective */}
        {activeTab === 'agents' && (
          <div className="space-y-6">
            {/* Sub-tab switcher between The Collective Dashboard and Direct Chat */}
            <div className="flex items-center justify-between p-2 rounded-2xl bg-white/60 dark:bg-[#12151B]/70 border border-black/[0.08] dark:border-white/[0.08] backdrop-blur-md">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setAgentSubTab('collective')}
                  className={`px-4 py-1.5 rounded-xl font-mono text-xs font-bold uppercase transition ${
                    agentSubTab === 'collective'
                      ? 'bg-black dark:bg-white text-white dark:text-black shadow-sm'
                      : 'text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  The Collective (Swarm Dashboard)
                </button>
                <button
                  onClick={() => setAgentSubTab('chat')}
                  className={`px-4 py-1.5 rounded-xl font-mono text-xs font-bold uppercase transition ${
                    agentSubTab === 'chat'
                      ? 'bg-black dark:bg-white text-white dark:text-black shadow-sm'
                      : 'text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Interactive Directive Chat
                </button>
              </div>

              <span className="text-[10px] font-mono text-[#5EE2B5] font-bold px-3 hidden sm:inline-block">
                ● 5 AGENTS SYNCHRONIZED
              </span>
            </div>

            {agentSubTab === 'collective' ? (
              <AgentCollectiveView
                onOpenAgentChat={(agentId) => {
                  setSelectedAgentId(agentId);
                  setAgentSubTab('chat');
                }}
              />
            ) : (
              <AgentChat
                initialAgentId={selectedAgentId}
                onSaveToVaultNote={handleSaveAgentOutputToNote}
              />
            )}
          </div>
        )}

        {/* Module 4b: Hermes Cron Operations & Timeline */}
        {activeTab === 'schedule' && (
          <CronScheduleView />
        )}

        {/* Module 4c: Agent Content & Deliverables Library */}
        {activeTab === 'content' && (
          <AgentContentLibraryView />
        )}

        {/* Module 4d: Autonomous JobHunter / Forge Fleet */}
        {activeTab === 'fleet' && (
          <ForgeFleetView />
        )}

        {/* Module 5: Pentesting Lab Command Matrix */}
        {(activeTab === 'pentest' || activeTab === 'commands') && (
          <CommandMatrixView
            commands={commands}
            notes={notes}
            onOpenNoteInEditor={handleOpenNoteInEditor}
            onSaveNewCommandNote={handleSaveNewCommandNote}
            onExecuteCommand={(cmd) => {
              // Switch to IDE terminal with command
              setActiveTab('ide');
            }}
          />
        )}

        {/* Module 6: Live Fullstack IDE & Tech Scanner */}
        {activeTab === 'ide' && (
          <IdeWorkspace
            project={ideProject}
            models={models}
            allProjects={availableProjects}
            onSwitchProject={handleOpenProjectInIde}
            onRefreshProjects={loadVaultData}
            onOpenVaultNote={handleOpenNoteInEditor}
          />
        )}

        {/* Module 6b: Tactical Shell */}
        {activeTab === 'terminal' && (
          <TacticalTerminalView
            projects={availableProjects}
            onOpenProjectInIde={handleOpenProjectInIde}
          />
        )}

        {/* Module 7: Jarvis Voice Engine [Coming Soon] */}
        {activeTab === 'voice' && (
          <VoiceJarvisView />
        )}

        {/* Module 8: About Operator Profile */}
        {activeTab === 'about' && (
          <AboutOperatorView
            stats={stats}
            onOpenVaultNote={handleOpenNoteInEditor}
          />
        )}
      </main>

      {/* Global Command Palette Overlay (Ctrl+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        notes={notes}
        commands={commands}
        onSelectNote={(note) => {
          setSelectedNotePath(note.relativePath);
          setActiveTab('editor');
        }}
        onSelectCommand={() => {
          setActiveTab('pentest');
        }}
        onSelectTab={(tabKey) => {
          if (tabKey === 'nucleus' || tabKey === 'telemetry') setActiveTab('dashboard');
          if (tabKey === 'projects') setActiveTab('projects');
          if (tabKey === 'github') setActiveTab('github');
          if (tabKey === 'graph') setActiveTab('galaxy');
          if (tabKey === 'editor') setActiveTab('editor');
          if (tabKey === 'commands') setActiveTab('pentest');
          if (tabKey === 'agents') setActiveTab('agents');
          if (tabKey === 'ide') setActiveTab('ide');
          if (tabKey === 'about') setActiveTab('about');
        }}
        onQuickDailyNote={handleQuickDailyNote}
        onSelectAgent={(agentId) => {
          setSelectedAgentId(agentId);
          setActiveTab('agents');
        }}
      />
    </div>
  );
};
