import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { 
  FolderTree, 
  FileCode, 
  Folder, 
  FolderOpen, 
  Plus, 
  Trash2, 
  Play, 
  Terminal, 
  Bot, 
  Sparkles, 
  Save, 
  Check, 
  Zap, 
  Send, 
  ChevronRight, 
  ChevronDown, 
  RefreshCw, 
  Code, 
  Clock, 
  X,
  FolderGit2,
  FolderPlus,
  LayoutGrid,
  Search,
  CheckCircle2,
  Maximize2,
  Minimize2,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Globe,
  Square,
  Cpu,
  Shield,
  Activity,
  Layers,
  Copy,
  Server,
  CornerDownLeft
} from 'lucide-react';
import { marked } from 'marked';
import { ProjectInfo, FileNode, CodeExecutionResult, ModelOption, BackgroundServerInfo, RoutingMode } from '../../types';
import { api } from '../../services/api';

interface OpenFileTab {
  path: string;
  name: string;
  content: string;
  originalContent: string;
  isDirty: boolean;
  language: string;
}

interface IdeWorkspaceProps {
  project: ProjectInfo;
  models: ModelOption[];
  allProjects?: ProjectInfo[];
  onSwitchProject?: (project: ProjectInfo) => void;
  onRefreshProjects?: () => Promise<void>;
  onOpenVaultNote?: (notePath: string) => void;
}

export const IdeWorkspace: React.FC<IdeWorkspaceProps> = ({
  project: initialProject,
  models,
  allProjects = [],
  onSwitchProject,
  onRefreshProjects,
  onOpenVaultNote,
}) => {
  const [currentProject, setCurrentProject] = useState<ProjectInfo>(initialProject);
  const [projectsList, setProjectsList] = useState<ProjectInfo[]>(allProjects);

  // View Mode: 'editor' or 'welcome-hub'
  const [viewMode, setViewMode] = useState<'editor' | 'welcome-hub'>('editor');

  // Collapsible Layout Panes & Zen Mode State
  const [isLeftTreeOpen, setIsLeftTreeOpen] = useState(true);
  const [isRightCopilotOpen, setIsRightCopilotOpen] = useState(true);
  const [isZenMode, setIsZenMode] = useState(false);

  // Project Tree State
  const [tree, setTree] = useState<FileNode | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [selectedFilePath, setSelectedFilePath] = useState<string>('');
  const [treeSearch, setTreeSearch] = useState<string>('');

  // Multi-tab Monaco Files State
  const [openTabs, setOpenTabs] = useState<OpenFileTab[]>([]);
  const [activeTabPath, setActiveTabPath] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Terminal & Sandbox Runner State
  const [isTerminalOpen, setIsTerminalOpen] = useState(true);
  const [isRunningCode, setIsRunningCode] = useState(false);
  const [execResult, setExecResult] = useState<CodeExecutionResult | null>(null);
  const [terminalLogs, setTerminalLogs] = useState<string>('');
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Multi-tab Terminal State
  const [terminalActiveTab, setTerminalActiveTab] = useState<'interactive' | 'logs' | 'servers'>('interactive');
  const [interactiveCmdInput, setInteractiveCmdInput] = useState<string>('');
  const [interactiveHistory, setInteractiveHistory] = useState<{
    id: string;
    command: string;
    timestamp: string;
    result?: CodeExecutionResult;
    isExecuting?: boolean;
  }[]>([]);
  const [sentCmds, setSentCmds] = useState<string[]>([]);
  const [cmdHistIdx, setCmdHistIdx] = useState<number>(-1);
  const [isInteractiveExecuting, setIsInteractiveExecuting] = useState(false);
  const interactiveInputRef = useRef<HTMLInputElement>(null);
  const interactiveEndRef = useRef<HTMLDivElement>(null);
  const [copiedCmdId, setCopiedCmdId] = useState<string | null>(null);

  // Active Background Web Servers / Daemons
  const [activeServers, setActiveServers] = useState<BackgroundServerInfo[]>([]);

  // AI Copilot & Hybrid Model Router State
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.7-flash');
  const [routingMode, setRoutingMode] = useState<RoutingMode>('hybrid_fallback');
  const [isAutonomousMode, setIsAutonomousMode] = useState<boolean>(true);
  const [copilotMessages, setCopilotMessages] = useState<
    { id: string; role: 'user' | 'assistant'; content: string; timestamp: string; executed?: boolean }[]
  >([]);
  const [copilotInput, setCopilotInput] = useState<string>('');
  const [isCopilotStreaming, setIsCopilotStreaming] = useState<boolean>(false);

  // AI Codebase Scanner & Vault Sync State
  const [isScanningWithAi, setIsScanningWithAi] = useState(false);
  const [aiScanSuccessNote, setAiScanSuccessNote] = useState<string | null>(null);

  // Workspace Switcher Dropdown
  const [isWorkspaceDropdownOpen, setIsWorkspaceDropdownOpen] = useState(false);
  const [workspaceSearch, setWorkspaceSearch] = useState('');

  // Modals
  const [isOpenFolderModalOpen, setIsOpenFolderModalOpen] = useState(false);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isCreateItemModalOpen, setIsCreateItemModalOpen] = useState(false);

  // Form states
  const [customFolderPath, setCustomFolderPath] = useState('');
  const [customProjectName, setCustomProjectName] = useState('');
  const [customCategory, setCustomCategory] = useState('Web_Dev');
  const [autoScanOnAdd, setAutoScanOnAdd] = useState(true);

  // New Vault Project Form
  const [newVaultProjName, setNewVaultProjName] = useState('');
  const [newVaultProjLang, setNewVaultProjLang] = useState('Python');

  // New file/folder item inside tree
  const [createItemType, setCreateItemType] = useState<'file' | 'directory'>('file');
  const [newItemName, setNewItemName] = useState('');

  const editorRef = useRef<any>(null);
  const copilotEndRef = useRef<HTMLDivElement>(null);

  // Connect to live WebSocket for real-time daemon server stdout/stderr
  useEffect(() => {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.hostname}:4000`;
    let ws: WebSocket | null = null;
    try {
      ws = new WebSocket(wsUrl);
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'terminal:log') {
            setTerminalLogs((prev) => prev + data.text);
            loadActiveServers();
          }
        } catch (e) {}
      };
    } catch (e) {}

    const interval = setInterval(loadActiveServers, 3000);

    return () => {
      if (ws) ws.close();
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (terminalLogs && isTerminalOpen) {
      terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [terminalLogs, isTerminalOpen]);

  // Sync currentProject when initialProject prop changes
  useEffect(() => {
    setCurrentProject(initialProject);
  }, [initialProject.path]);

  // Load project list and tree on mount or project switch
  useEffect(() => {
    loadProjectsAndTree();
    loadActiveServers();
  }, [currentProject.path]);

  const loadProjectsAndTree = async () => {
    try {
      const [list, rootTree] = await Promise.all([
        api.getProjectList(),
        api.getProjectTree(currentProject.path),
      ]);
      setProjectsList(list);
      setTree(rootTree);
      setExpandedFolders({ [rootTree.path]: true });

      // If project has mainFile and no tabs are open, open it
      if (currentProject.mainFile && openTabs.length === 0) {
        const mainPath = `${currentProject.path}/${currentProject.mainFile}`.replace(/\\/g, '/');
        openFile(mainPath, currentProject.mainFile);
      }
    } catch (e) {
      console.error('[IDE] Failed to load project tree:', e);
    }
  };

  const loadActiveServers = async () => {
    try {
      const servers = await api.getActiveServers();
      setActiveServers(servers);
    } catch (e) {}
  };

  const getLanguageFromExt = (ext?: string, fileName?: string): string => {
    const f = (fileName || '').toLowerCase();
    if (f.endsWith('.py')) return 'python';
    if (f.endsWith('.ts') || f.endsWith('.tsx')) return 'typescript';
    if (f.endsWith('.js') || f.endsWith('.jsx')) return 'javascript';
    if (f.endsWith('.json')) return 'json';
    if (f.endsWith('.md')) return 'markdown';
    if (f.endsWith('.sh') || f.endsWith('.bash')) return 'shell';
    if (f.endsWith('.ps1')) return 'powershell';
    if (f.endsWith('.c') || f.endsWith('.h') || f.endsWith('.cpp')) return 'c';
    if (f.endsWith('.css')) return 'css';
    if (f.endsWith('.html')) return 'html';
    if (f.endsWith('.yaml') || f.endsWith('.yml')) return 'yaml';
    return 'plaintext';
  };

  const openFile = async (filePath: string, fileName?: string) => {
    const normalizedPath = filePath.replace(/\\/g, '/');
    setSelectedFilePath(normalizedPath);
    setViewMode('editor');

    const existing = openTabs.find((t) => t.path.toLowerCase() === normalizedPath.toLowerCase());
    if (existing) {
      setActiveTabPath(existing.path);
      return;
    }

    try {
      const fileData = await api.getProjectFile(normalizedPath);
      const newTab: OpenFileTab = {
        path: normalizedPath,
        name: fileName || fileData.name,
        content: fileData.content,
        originalContent: fileData.content,
        isDirty: false,
        language: getLanguageFromExt(undefined, fileData.name),
      };

      setOpenTabs((prev) => {
        if (prev.some((t) => t.path.toLowerCase() === normalizedPath.toLowerCase())) {
          return prev;
        }
        return [...prev, newTab];
      });
      setActiveTabPath(normalizedPath);
    } catch (err) {
      console.error('[IDE] Failed to open file:', err);
    }
  };

  const closeTab = (path: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const nextTabs = openTabs.filter((t) => t.path !== path);
    setOpenTabs(nextTabs);
    if (activeTabPath === path) {
      if (nextTabs.length > 0) {
        setActiveTabPath(nextTabs[nextTabs.length - 1].path);
      } else {
        setActiveTabPath('');
      }
    }
  };

  const activeTab = openTabs.find((t) => t.path === activeTabPath);

  const handleEditorChange = (value?: string) => {
    if (!activeTab || value === undefined) return;
    const isDirty = value !== activeTab.originalContent;
    setOpenTabs((prev) =>
      prev.map((t) => (t.path === activeTab.path ? { ...t, content: value, isDirty } : t))
    );
  };

  const handleSaveFile = async () => {
    if (!activeTab) return;
    setIsSaving(true);
    try {
      await api.saveProjectFile(activeTab.path, activeTab.content);
      setOpenTabs((prev) =>
        prev.map((t) => (t.path === activeTab.path ? { ...t, originalContent: t.content, isDirty: false } : t))
      );
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error('[IDE] Save failed:', err);
      alert('Failed to save file to disk.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRunCode = async () => {
    if (!activeTab) return;
    setIsRunningCode(true);
    setIsTerminalOpen(true);
    try {
      const result = await api.runProjectCode(activeTab.language, activeTab.content, activeTab.path);
      setExecResult(result);
    } catch (err: any) {
      setExecResult({
        success: false,
        stdout: '',
        stderr: err.message,
        exitCode: 1,
        durationMs: 0,
        timestamp: new Date().toLocaleTimeString(),
      });
    } finally {
      setIsRunningCode(false);
    }
  };

  const handleExecuteTerminalCommand = async (command: string) => {
    setIsRunningCode(true);
    setIsTerminalOpen(true);
    const cleanCmd = command.trim();
    setTerminalLogs((prev) => prev + `\n\n\x1b[36m⚡ [POWERSHELL DIRECTIVE]\x1b[0m ${cleanCmd}\n`);

    // If starting a dev server (npm run dev, npm start, etc.)
    if (
      cleanCmd.includes('npm run dev') ||
      cleanCmd.includes('npm start') ||
      cleanCmd.includes('yarn dev') ||
      cleanCmd.includes('pnpm dev') ||
      cleanCmd.includes('python -m http.server') ||
      cleanCmd.includes('vite') ||
      cleanCmd.includes('next dev')
    ) {
      try {
        const srv = await api.startBackgroundServer(cleanCmd, currentProject.path, currentProject.title);
        setActiveServers((prev) => [...prev.filter((s) => s.pid !== srv.pid), srv]);
        setTerminalLogs(
          (prev) =>
            prev +
            `[DAEMON] Spawning background server PID ${srv.pid} in ${currentProject.path}...\nStreaming stdout & stderr in real-time...\n`
        );
        setTimeout(loadActiveServers, 2000);
      } catch (err: any) {
        setTerminalLogs((prev) => prev + `\n[ERROR] ${err.message}\n`);
      } finally {
        setIsRunningCode(false);
      }
      return;
    }

    try {
      const result = await api.executeTerminalCommand(cleanCmd, currentProject.path);
      setExecResult(result);
      if (result.stdout) setTerminalLogs((prev) => prev + `${result.stdout}\n`);
      if (result.stderr) setTerminalLogs((prev) => prev + `\x1b[31m${result.stderr}\x1b[0m\n`);
    } catch (err: any) {
      setTerminalLogs((prev) => prev + `\n[ERROR] ${err.message}\n`);
    } finally {
      setIsRunningCode(false);
    }
  };

  const handleStopServer = async (pid: number) => {
    try {
      await api.stopBackgroundServer(pid);
      setActiveServers((prev) => prev.filter((s) => s.pid !== pid));
    } catch (e) {}
  };

  // Run Interactive Command from Terminal Input Prompt
  const handleRunInteractiveCommand = async (cmdToRun?: string) => {
    const cmd = (cmdToRun || interactiveCmdInput).trim();
    if (!cmd || isInteractiveExecuting) return;

    if (cmd.toLowerCase() === 'clear' || cmd.toLowerCase() === 'cls') {
      setInteractiveHistory([]);
      setInteractiveCmdInput('');
      setCmdHistIdx(-1);
      return;
    }

    const itemId = `ide-cmd-${Date.now()}`;
    const newItem = {
      id: itemId,
      command: cmd,
      timestamp: new Date().toLocaleTimeString(),
      isExecuting: true,
    };

    setInteractiveHistory((prev) => [...prev, newItem]);
    setSentCmds((prev) => [cmd, ...prev.filter((c) => c !== cmd)]);
    setInteractiveCmdInput('');
    setCmdHistIdx(-1);
    setIsInteractiveExecuting(true);
    setIsTerminalOpen(true);

    // If starting a background server
    if (
      cmd.includes('npm run dev') ||
      cmd.includes('npm start') ||
      cmd.includes('yarn dev') ||
      cmd.includes('pnpm dev') ||
      cmd.includes('python -m http.server') ||
      cmd.includes('vite') ||
      cmd.includes('next dev')
    ) {
      try {
        const srv = await api.startBackgroundServer(cmd, currentProject.path, currentProject.title);
        setActiveServers((prev) => [...prev.filter((s) => s.pid !== srv.pid), srv]);
        setTerminalLogs(
          (prev) =>
            prev +
            `\n[DAEMON] Started server PID ${srv.pid} in ${currentProject.path}...\n`
        );
        setInteractiveHistory((prev) =>
          prev.map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  isExecuting: false,
                  result: {
                    stdout: `[DAEMON] Background server spawned (PID ${srv.pid}) in ${currentProject.path}`,
                    stderr: '',
                    exitCode: 0,
                    executionTimeMs: 120,
                    language: 'powershell',
                  },
                }
              : item
          )
        );
        setTimeout(loadActiveServers, 2000);
      } catch (err: any) {
        setInteractiveHistory((prev) =>
          prev.map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  isExecuting: false,
                  result: {
                    stdout: '',
                    stderr: err.message,
                    exitCode: 1,
                    executionTimeMs: 0,
                    language: 'powershell',
                  },
                }
              : item
          )
        );
      } finally {
        setIsInteractiveExecuting(false);
      }
      return;
    }

    try {
      const result = await api.executeTerminalCommand(cmd, currentProject.path);
      setInteractiveHistory((prev) =>
        prev.map((item) => (item.id === itemId ? { ...item, result, isExecuting: false } : item))
      );
      if (result.stdout) setTerminalLogs((prev) => prev + `${result.stdout}\n`);
      if (result.stderr) setTerminalLogs((prev) => prev + `${result.stderr}\n`);
    } catch (err: any) {
      setInteractiveHistory((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? {
                ...item,
                isExecuting: false,
                result: {
                  stdout: '',
                  stderr: err.message,
                  exitCode: 1,
                  executionTimeMs: 0,
                  language: 'powershell',
                },
              }
            : item
        )
      );
    } finally {
      setIsInteractiveExecuting(false);
      setTimeout(() => interactiveInputRef.current?.focus(), 50);
    }
  };

  const handleInteractiveKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (sentCmds.length === 0) return;
      const nextIdx = Math.min(cmdHistIdx + 1, sentCmds.length - 1);
      setCmdHistIdx(nextIdx);
      setInteractiveCmdInput(sentCmds[nextIdx]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (cmdHistIdx > 0) {
        const nextIdx = cmdHistIdx - 1;
        setCmdHistIdx(nextIdx);
        setInteractiveCmdInput(sentCmds[nextIdx]);
      } else if (cmdHistIdx === 0) {
        setCmdHistIdx(-1);
        setInteractiveCmdInput('');
      }
    }
  };

  const toggleFolder = (folderPath: string) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [folderPath]: !prev[folderPath],
    }));
  };

  const handleSelectProject = (proj: ProjectInfo) => {
    setCurrentProject(proj);
    setOpenTabs([]);
    setActiveTabPath('');
    setViewMode('editor');
    setIsWorkspaceDropdownOpen(false);
    if (onSwitchProject) onSwitchProject(proj);
  };

  const handleAddFolderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customFolderPath.trim()) return;

    try {
      const newProj = await api.addWorkspace(
        customFolderPath.trim(),
        customProjectName.trim() || undefined,
        customCategory.trim() || 'External',
        autoScanOnAdd
      );
      setIsOpenFolderModalOpen(false);
      setCustomFolderPath('');
      setCustomProjectName('');
      if (onRefreshProjects) await onRefreshProjects();
      handleSelectProject(newProj);
    } catch (err: any) {
      alert(`Failed to add folder workspace: ${err.message}`);
    }
  };

  const handleCreateVaultProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVaultProjName.trim()) return;

    const cleanName = newVaultProjName.trim().replace(/\s+/g, '_');
    const vaultBasePath = 'C:\\Users\\Zakar\\Documents\\Obsidian\\My_Vault\\02 Coding Projects';
    const targetPath = `${vaultBasePath}\\${newVaultProjLang}\\${cleanName}`;

    try {
      const newProj = await api.addWorkspace(
        targetPath,
        cleanName,
        newVaultProjLang,
        true
      );
      setIsNewProjectModalOpen(false);
      setNewVaultProjName('');
      if (onRefreshProjects) await onRefreshProjects();
      handleSelectProject(newProj);
    } catch (err: any) {
      alert(`Failed to create vault project: ${err.message}`);
    }
  };

  const handleAiScanProject = async () => {
    setIsScanningWithAi(true);
    try {
      const noteRelPath = await api.scanProjectWithAi(
        currentProject.id,
        currentProject.path,
        selectedModel
      );
      setAiScanSuccessNote(noteRelPath);
      if (onRefreshProjects) await onRefreshProjects();
      setTimeout(() => setAiScanSuccessNote(null), 4000);
    } catch (err: any) {
      alert(`AI Scan failed: ${err.message}`);
    } finally {
      setIsScanningWithAi(false);
    }
  };

  const handleCreateTreeItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    const targetPath = `${currentProject.path}/${newItemName.trim()}`.replace(/\\/g, '/');
    try {
      await api.createProjectItem(targetPath, createItemType);
      setIsCreateItemModalOpen(false);
      setNewItemName('');
      await loadProjectsAndTree();
      if (createItemType === 'file') {
        openFile(targetPath, newItemName.trim());
      }
    } catch (err) {
      alert('Failed to create item.');
    }
  };

  const handleDeleteTreeItem = async (filePath: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete ${filePath}?`)) return;
    try {
      await api.deleteProjectItem(filePath);
      closeTab(filePath);
      await loadProjectsAndTree();
    } catch (err) {
      alert('Failed to delete item.');
    }
  };

  const extractExecutableCommands = (content: string): string | null => {
    // 1. Check for explicit :exec blocks
    const execMatch = content.match(/```(?:powershell|bash|sh|cmd)?:exec\s*([\s\S]*?)```/i);
    if (execMatch && execMatch[1]) return execMatch[1].trim();

    // 2. Check for powershell / bash blocks with shell commands
    const codeBlockMatch = content.match(/```(?:powershell|bash|sh|cmd|ps1)?\s*([\s\S]*?)```/i);
    if (codeBlockMatch && codeBlockMatch[1]) {
      const raw = codeBlockMatch[1].trim();
      if (
        raw.includes('npm ') ||
        raw.includes('yarn ') ||
        raw.includes('pnpm ') ||
        raw.includes('pip ') ||
        raw.includes('python ') ||
        raw.includes('node ') ||
        raw.includes('npx ') ||
        raw.includes('cargo ') ||
        raw.includes('nmap ')
      ) {
        return raw;
      }
    }
    return null;
  };

  // Autonomous Agent Chat & Tool Execution
  const handleSendCopilot = async (customPrompt?: string) => {
    const textToSend = (customPrompt || copilotInput).trim();
    if (!textToSend || isCopilotStreaming) return;

    const userMsg = {
      id: `copilot-u-${Date.now()}`,
      role: 'user' as const,
      content: textToSend,
      timestamp: new Date().toLocaleTimeString(),
    };

    const asstId = `copilot-a-${Date.now()}`;
    const initialAsstMsg = {
      id: asstId,
      role: 'assistant' as const,
      content: '',
      timestamp: new Date().toLocaleTimeString(),
    };

    setCopilotMessages((prev) => [...prev, userMsg, initialAsstMsg]);
    setCopilotInput('');
    setIsCopilotStreaming(true);

    const activeFileContext = activeTab
      ? `\n\n[ACTIVE FILE: ${activeTab.name} (${activeTab.language}) in ${currentProject.title}]:\n\`\`\`${activeTab.language}\n${activeTab.content}\n\`\`\``
      : `\n\n[PROJECT CONTEXT: ${currentProject.title} (${currentProject.path})]`;

    const fullPrompt = `${textToSend}${activeFileContext}`;

    let accumulatedResponse = '';

    try {
      await api.streamAgentChat(
        'coding',
        fullPrompt,
        copilotMessages.map((m) => ({ role: m.role, content: m.content })),
        selectedModel,
        (chunk) => {
          accumulatedResponse += chunk;
          setCopilotMessages((prev) =>
            prev.map((m) => (m.id === asstId ? { ...m, content: m.content + chunk } : m))
          );
        },
        routingMode
      );

      // Autonomous Execution: Scan for executable code blocks
      if (isAutonomousMode) {
        const cmdToRun = extractExecutableCommands(accumulatedResponse);
        if (cmdToRun) {
          console.log('[Autonomous AI Engine] Auto-executing directive:', cmdToRun);
          handleExecuteTerminalCommand(cmdToRun);
          setCopilotMessages((prev) =>
            prev.map((m) => (m.id === asstId ? { ...m, executed: true } : m))
          );
        }
      }
    } catch (err) {
      console.error('[Copilot] Stream failed:', err);
    } finally {
      setIsCopilotStreaming(false);
    }
  };

  const handleApplyCodeToEditor = (codeSnippet: string) => {
    if (!activeTab) return;
    let cleanCode = codeSnippet.trim();
    if (cleanCode.startsWith('```')) {
      const lines = cleanCode.split('\n');
      lines.shift();
      if (lines[lines.length - 1].startsWith('```')) {
        lines.pop();
      }
      cleanCode = lines.join('\n');
    }

    setOpenTabs((prev) =>
      prev.map((t) =>
        t.path === activeTab.path ? { ...t, content: cleanCode, isDirty: true } : t
      )
    );
  };

  const renderTreeNode = (node: FileNode, depth = 0) => {
    const isDir = node.type === 'directory';
    const isExpanded = !!expandedFolders[node.path];
    const isSelected = selectedFilePath === node.path;

    if (
      treeSearch &&
      !node.name.toLowerCase().includes(treeSearch.toLowerCase()) &&
      !isDir
    ) {
      return null;
    }

    return (
      <div key={`${node.path}-${depth}-${node.name}`} className="select-none text-xs">
        <div
          onClick={() => {
            if (isDir) {
              toggleFolder(node.path);
            } else {
              openFile(node.path, node.name);
            }
          }}
          className={`flex items-center justify-between px-2 py-1 rounded cursor-pointer transition group ${
            isSelected
              ? 'bg-cyan-500/20 text-cyan-300 font-bold border-l-2 border-cyan-400'
              : 'text-slate-400 hover:bg-space-850 hover:text-slate-200'
          }`}
          style={{ paddingLeft: `${Math.max(8, depth * 14)}px` }}
        >
          <div className="flex items-center space-x-1.5 truncate">
            {isDir ? (
              isExpanded ? (
                <FolderOpen className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              ) : (
                <Folder className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              )
            ) : (
              <FileCode className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            )}
            <span className="truncate font-mono text-[11px]">{node.name}</span>
          </div>

          {!isDir && (
            <button
              onClick={(e) => handleDeleteTreeItem(node.path, e)}
              className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-500 hover:text-rose-400 transition"
              title="Delete File"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>

        {isDir && isExpanded && node.children && (
          <div>{node.children.map((child) => renderTreeNode(child, depth + 1))}</div>
        )}
      </div>
    );
  };

  const filteredProjects = projectsList.filter(
    (p) =>
      p.title.toLowerCase().includes(workspaceSearch.toLowerCase()) ||
      p.category.toLowerCase().includes(workspaceSearch.toLowerCase()) ||
      p.path.toLowerCase().includes(workspaceSearch.toLowerCase())
  );

  return (
    <div className="h-full w-full flex-1 flex overflow-hidden bg-space-950 font-sans text-xs">
      {/* COLUMN 1: Project File Tree (Collapsible Left) */}
      {!isZenMode && (
        isLeftTreeOpen ? (
          <div className="w-64 h-full bg-space-900 border-r border-cyan-500/20 flex flex-col justify-between shrink-0 font-mono transition-all duration-200">
            <div>
              {/* Workspace Switcher Header Dropdown Button */}
              <div className="relative p-2 border-b border-cyan-500/20 bg-space-950">
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setIsWorkspaceDropdownOpen(!isWorkspaceDropdownOpen)}
                    className="flex-1 p-2 rounded-lg bg-space-900 hover:bg-space-850 border border-cyan-500/30 text-left flex items-center justify-between transition group shadow-sm min-w-0"
                    title="Switch Workspace / Open Folder"
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <FolderGit2 className="w-4 h-4 text-cyan-400 shrink-0" />
                      <div className="truncate">
                        <div className="font-bold text-xs text-white truncate group-hover:text-cyan-300">
                          {currentProject.title}
                        </div>
                        <div className="text-[9px] text-slate-500 truncate">
                          {currentProject.category} • {currentProject.language.toUpperCase()}
                        </div>
                      </div>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 group-hover:text-cyan-300" />
                  </button>

                  <button
                    onClick={() => setIsLeftTreeOpen(false)}
                    className="p-2 rounded-lg bg-space-900 hover:bg-space-800 border border-slate-800 text-slate-400 hover:text-cyan-300"
                    title="Collapse File Tree (Ctrl+B)"
                  >
                    <PanelLeftClose className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Dropdown Menu */}
                {isWorkspaceDropdownOpen && (
                  <div className="absolute left-2 right-2 top-14 bg-space-900 border border-cyan-500/40 rounded-xl shadow-glass-glow py-2 z-50 animate-in fade-in text-xs font-mono">
                    <div className="px-2.5 pb-2 border-b border-slate-800 space-y-1.5">
                      <input
                        type="text"
                        autoFocus
                        value={workspaceSearch}
                        onChange={(e) => setWorkspaceSearch(e.target.value)}
                        placeholder="Search workspaces..."
                        className="w-full bg-space-950 border border-slate-700 rounded px-2 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-cyan-400"
                      />
                      <div className="flex items-center justify-between text-[10px] text-slate-500 uppercase">
                        <span>WORKSPACES ({projectsList.length})</span>
                        <button
                          onClick={() => {
                            setViewMode('welcome-hub');
                            setIsWorkspaceDropdownOpen(false);
                          }}
                          className="text-cyan-400 hover:underline flex items-center gap-1"
                        >
                          <LayoutGrid className="w-3 h-3" /> HUB
                        </button>
                      </div>
                    </div>

                    <div className="max-h-56 overflow-y-auto p-1 space-y-0.5">
                      {filteredProjects.map((proj) => (
                        <button
                          key={proj.id}
                          onClick={() => handleSelectProject(proj)}
                          className={`w-full p-2 rounded-lg text-left transition flex items-center justify-between ${
                            proj.id === currentProject.id
                              ? 'bg-cyan-500/20 text-cyan-200 font-bold border border-cyan-500/40'
                              : 'hover:bg-space-800 text-slate-300'
                          }`}
                        >
                          <div className="truncate flex-1 min-w-0">
                            <div className="text-[11px] truncate text-slate-100">{proj.title}</div>
                            <div className="text-[9px] text-slate-500 truncate">{proj.path}</div>
                          </div>
                          <span className="text-[9px] px-1 py-0.2 rounded bg-space-950 border border-slate-800 text-slate-400 shrink-0 ml-1">
                            {proj.language}
                          </span>
                        </button>
                      ))}
                    </div>

                    <div className="pt-2 px-1 border-t border-slate-800 space-y-1">
                      <button
                        onClick={() => {
                          setIsWorkspaceDropdownOpen(false);
                          setIsOpenFolderModalOpen(true);
                        }}
                        className="w-full py-1.5 px-2 rounded bg-space-800 hover:bg-space-700 text-cyan-300 text-[11px] font-bold flex items-center justify-center space-x-1.5"
                      >
                        <FolderPlus className="w-3.5 h-3.5" />
                        <span>+ OPEN SYSTEM FOLDER</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsWorkspaceDropdownOpen(false);
                          setIsNewProjectModalOpen(true);
                        }}
                        className="w-full py-1.5 px-2 rounded bg-space-950 hover:bg-space-800 text-slate-300 text-[11px] flex items-center justify-center space-x-1.5 border border-slate-800"
                      >
                        <Plus className="w-3.5 h-3.5 text-amber-400" />
                        <span>+ CREATE NEW VAULT PROJECT</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Tree Action Bar & Filter */}
              <div className="p-2 border-b border-slate-800 flex items-center justify-between">
                <input
                  type="text"
                  value={treeSearch}
                  onChange={(e) => setTreeSearch(e.target.value)}
                  placeholder="Filter files..."
                  className="flex-1 bg-space-950 border border-slate-800 rounded px-2 py-1 text-[10px] text-slate-200 focus:outline-none focus:border-cyan-400 mr-1.5"
                />
                <div className="flex items-center space-x-1 shrink-0">
                  <button
                    onClick={() => {
                      setCreateItemType('file');
                      setIsCreateItemModalOpen(true);
                    }}
                    className="p-1 rounded hover:bg-space-800 text-slate-400 hover:text-cyan-300"
                    title="New File"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={loadProjectsAndTree}
                    className="p-1 rounded hover:bg-space-800 text-slate-400 hover:text-cyan-300"
                    title="Refresh Tree"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Recursive Tree Body */}
              <div className="p-1 overflow-y-auto max-h-[calc(100vh-230px)] space-y-0.5">
                {tree ? renderTreeNode(tree) : <div className="p-3 text-slate-500">Loading tree...</div>}
              </div>
            </div>

            {/* Bottom Hub Launcher Button */}
            <div className="p-2 border-t border-slate-800 bg-space-950/80 flex items-center justify-between text-[10px] text-slate-500">
              <button
                onClick={() => setViewMode(viewMode === 'welcome-hub' ? 'editor' : 'welcome-hub')}
                className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-bold"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>{viewMode === 'welcome-hub' ? 'SWITCH TO CODE' : 'WORKSPACES HUB'}</span>
              </button>
              <span className="truncate max-w-[100px]">{currentProject.fileCount || 0} files</span>
            </div>
          </div>
        ) : (
          /* Left Collapsed Micro-Rail */
          <div className="w-10 h-full bg-space-900 border-r border-cyan-500/20 flex flex-col items-center py-2 space-y-3 shrink-0">
            <button
              onClick={() => setIsLeftTreeOpen(true)}
              className="p-2 rounded hover:bg-space-800 text-cyan-400 hover:text-cyan-300"
              title="Expand File Tree"
            >
              <PanelLeftOpen className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode(viewMode === 'welcome-hub' ? 'editor' : 'welcome-hub')}
              className="p-2 rounded hover:bg-space-800 text-slate-400 hover:text-white"
              title="Workspaces Hub"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        )
      )}

      {/* COLUMN 2: Center Editor & Tactical Terminal (Expands dynamically) */}
      {viewMode === 'welcome-hub' ? (
        /* VS Code Style Welcome / Workspace Hub Screen */
        <div className="flex-1 flex flex-col overflow-y-auto p-6 bg-space-950 font-sans space-y-6">
          <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-r from-space-900 via-space-850 to-space-900 border border-cyan-500/30 shadow-glass-glow">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2 text-xs font-mono text-cyan-400">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>ZAK_OS // UNIVERSAL WORKSPACE & PROJECT MANAGER</span>
                </div>
                <h1 className="font-display font-black text-2xl text-white tracking-wider mt-1">
                  WORKSPACES <span className="text-cyan-400">HUB</span>
                </h1>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Universal filesystem mounts, autonomous AI architecture scanning, and Obsidian Vault node synchronization.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 font-mono">
                <button
                  onClick={() => setIsOpenFolderModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs flex items-center space-x-1.5 shadow-glow-cyan transition"
                >
                  <FolderPlus className="w-4 h-4" />
                  <span>OPEN SYSTEM FOLDER</span>
                </button>

                <button
                  onClick={() => setIsNewProjectModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-space-800 hover:bg-space-700 border border-slate-700 text-slate-200 text-xs font-bold flex items-center space-x-1.5 transition"
                >
                  <Plus className="w-4 h-4 text-amber-400" />
                  <span>NEW VAULT PROJECT</span>
                </button>
              </div>
            </div>
          </div>

          {/* Workspaces Grid */}
          <div className="space-y-3 font-mono">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <FolderGit2 className="w-4 h-4 text-cyan-400" />
                ACTIVE WORKSPACES & PROJECTS ({projectsList.length})
              </span>
              <span className="text-[10px] text-slate-500">Autonomous AI Synced</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {projectsList.map((proj) => (
                <div
                  key={proj.id}
                  className={`p-4 rounded-xl bg-space-900 border transition flex flex-col justify-between space-y-3 ${
                    proj.id === currentProject.id
                      ? 'border-cyan-500/50 shadow-glass-glow'
                      : 'border-slate-800 hover:border-cyan-500/30'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-space-950 border border-slate-700 text-cyan-300 font-bold uppercase">
                        {proj.language}
                      </span>
                      <span className="text-[9px] text-slate-500 font-mono">
                        {proj.type === 'vault' ? 'VAULT NODE' : 'EXTERNAL FOLDER'}
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-slate-100 mt-2">{proj.title}</h3>
                    <p className="text-[10px] text-slate-400 mt-1 line-clamp-1 font-mono">
                      {proj.path}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500">
                      {proj.fileCount || 0} files
                    </span>

                    <button
                      onClick={() => handleSelectProject(proj)}
                      className="px-3 py-1 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition flex items-center gap-1"
                    >
                      <span>LAUNCH IDE</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Monaco Code Studio & Tactical Terminal */
        <div className="flex-1 h-full flex flex-col overflow-hidden bg-space-950 transition-all">
          {/* Top IDE Header: Tabs, Panes & Zen Mode Controls */}
          <div className="h-10 border-b border-cyan-500/20 bg-space-900 px-2 flex items-center justify-between shrink-0 font-mono text-xs">
            {/* Open Tabs */}
            <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar flex-1 mr-2">
              {!isLeftTreeOpen && !isZenMode && (
                <button
                  onClick={() => setIsLeftTreeOpen(true)}
                  className="p-1.5 rounded hover:bg-space-800 text-cyan-400 mr-1"
                  title="Expand File Tree"
                >
                  <PanelLeftOpen className="w-3.5 h-3.5" />
                </button>
              )}

              {openTabs.map((tab, tabIdx) => {
                const isActive = tab.path === activeTabPath;

                return (
                  <div
                    key={`${tab.path}-${tabIdx}`}
                    onClick={() => setActiveTabPath(tab.path)}
                    className={`flex items-center space-x-2 px-3 py-1.5 rounded-t-md cursor-pointer transition text-[11px] border-t border-x ${
                      isActive
                        ? 'bg-space-950 border-cyan-500/40 text-cyan-300 font-bold'
                        : 'bg-space-900/60 border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <FileCode className="w-3 h-3 text-cyan-400" />
                    <span className="truncate max-w-[120px]">{tab.name}</span>
                    {tab.isDirty && <span className="w-2 h-2 rounded-full bg-amber-400" title="Unsaved changes" />}
                    <button
                      onClick={(e) => closeTab(tab.path, e)}
                      className="p-0.5 hover:text-rose-400 rounded text-slate-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Active Server Badge / Zen Mode / Action Controls */}
            <div className="flex items-center space-x-2 shrink-0">
              {activeServers.length > 0 && (
                <div className="hidden lg:flex items-center space-x-1.5 px-2 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-[10px]">
                  <Globe className="w-3 h-3 text-emerald-400 animate-spin" />
                  <span>{activeServers[0].url || `Server :${activeServers[0].port || activeServers[0].pid}`}</span>
                  {activeServers[0].url && (
                    <a
                      href={activeServers[0].url}
                      target="_blank"
                      rel="noreferrer"
                      className="underline font-bold text-cyan-300 hover:text-cyan-200 ml-1"
                    >
                      OPEN ↗
                    </a>
                  )}
                  <button
                    onClick={() => handleStopServer(activeServers[0].pid)}
                    className="p-0.5 hover:text-rose-400 text-slate-400"
                    title="Stop Server"
                  >
                    <Square className="w-2.5 h-2.5 fill-current" />
                  </button>
                </div>
              )}

              <button
                onClick={() => setIsZenMode(!isZenMode)}
                className={`p-1.5 rounded border text-[10px] font-bold flex items-center space-x-1 transition ${
                  isZenMode
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                    : 'bg-space-800 hover:bg-space-700 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
                title="Toggle Zen Mode (Full Width Editor)"
              >
                {isZenMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                <span className="hidden md:inline">{isZenMode ? 'EXIT ZEN' : 'ZEN'}</span>
              </button>

              <button
                onClick={handleSaveFile}
                disabled={isSaving || !activeTab}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded text-[11px] font-bold border transition ${
                  saveSuccess
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                    : 'bg-space-800 hover:bg-space-700 border-slate-700 text-slate-200'
                }`}
              >
                {saveSuccess ? <Check className="w-3 h-3 text-emerald-400" /> : <Save className="w-3 h-3 text-cyan-400" />}
                <span>{saveSuccess ? 'SAVED' : 'SAVE'}</span>
              </button>

              <button
                onClick={handleRunCode}
                disabled={isRunningCode || !activeTab}
                className="flex items-center space-x-1 px-3 py-1 rounded bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-bold text-[11px] shadow-glow-cyan transition"
              >
                <Play className="w-3 h-3 fill-black" />
                <span>{isRunningCode ? 'RUNNING...' : 'RUN (F5)'}</span>
              </button>

              {!isRightCopilotOpen && !isZenMode && (
                <button
                  onClick={() => setIsRightCopilotOpen(true)}
                  className="p-1.5 rounded hover:bg-space-800 text-blue-400"
                  title="Expand AI Copilot"
                >
                  <PanelRightOpen className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* AI Scan Success Toast Banner */}
          {aiScanSuccessNote && (
            <div className="p-2 bg-purple-950/80 border-b border-purple-500/40 text-purple-200 text-xs font-mono flex items-center justify-between px-4">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Autonomous AI Codebase Scan Complete! Created Vault Node: <strong>{aiScanSuccessNote}</strong></span>
              </span>
              {onOpenVaultNote && (
                <button
                  onClick={() => onOpenVaultNote(aiScanSuccessNote)}
                  className="underline text-cyan-300 font-bold hover:text-cyan-200"
                >
                  OPEN NOTE
                </button>
              )}
            </div>
          )}

          {/* Monaco Editor Container */}
          <div className="flex-1 overflow-hidden relative">
            {activeTab ? (
              <Editor
                height="100%"
                theme="vs-dark"
                language={activeTab.language}
                value={activeTab.content}
                onChange={handleEditorChange}
                onMount={(editor) => {
                  editorRef.current = editor;
                  editor.addCommand(2048 | 49, () => handleSaveFile());
                  editor.addCommand(63, () => handleRunCode());
                }}
                options={{
                  fontSize: 13,
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  minimap: { enabled: true },
                  scrollBeyondLastLine: false,
                  smoothScrolling: true,
                  automaticLayout: true,
                  tabSize: 4,
                  wordWrap: 'on',
                }}
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 font-mono space-y-3">
                <FolderGit2 className="w-12 h-12 text-slate-700" />
                <p>Select a file from the Project Tree on the left or launch Workspaces Hub.</p>
                <button
                  onClick={() => setViewMode('welcome-hub')}
                  className="px-3 py-1.5 rounded bg-space-800 hover:bg-space-700 text-cyan-300 border border-slate-700 text-xs"
                >
                  OPEN WORKSPACES HUB
                </button>
              </div>
            )}
          </div>

          {/* Collapsible Multi-Tab Tactical Terminal */}
          <div className="border-t border-cyan-500/20 bg-space-900/95 font-mono text-xs flex flex-col shrink-0">
            {/* Terminal Tab Bar Header */}
            <div className="h-9 px-3 bg-space-950 flex items-center justify-between border-b border-slate-800 select-none">
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1 mr-2">
                  <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-bold text-[11px] text-slate-200 hidden sm:inline">
                    TACTICAL TERMINAL
                  </span>
                </div>

                <div className="flex rounded bg-space-900 p-0.5 border border-slate-800">
                  <button
                    onClick={() => {
                      setTerminalActiveTab('interactive');
                      setIsTerminalOpen(true);
                    }}
                    className={`px-2.5 py-0.5 rounded text-[10px] font-bold transition flex items-center space-x-1 ${
                      terminalActiveTab === 'interactive' && isTerminalOpen
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Terminal className="w-3 h-3" />
                    <span>INTERACTIVE PS</span>
                  </button>

                  <button
                    onClick={() => {
                      setTerminalActiveTab('logs');
                      setIsTerminalOpen(true);
                    }}
                    className={`px-2.5 py-0.5 rounded text-[10px] font-bold transition flex items-center space-x-1 ${
                      terminalActiveTab === 'logs' && isTerminalOpen
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Activity className="w-3 h-3" />
                    <span>DAEMON LOGS</span>
                  </button>

                  <button
                    onClick={() => {
                      setTerminalActiveTab('servers');
                      setIsTerminalOpen(true);
                    }}
                    className={`px-2.5 py-0.5 rounded text-[10px] font-bold transition flex items-center space-x-1 ${
                      terminalActiveTab === 'servers' && isTerminalOpen
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Server className="w-3 h-3" />
                    <span>SERVICES ({activeServers.length})</span>
                  </button>
                </div>

                {activeServers.length > 0 && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse">
                    🟢 {activeServers.length} ACTIVE
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-2 text-slate-400">
                <button
                  onClick={() => {
                    if (terminalActiveTab === 'interactive') {
                      setInteractiveHistory([]);
                    } else {
                      setTerminalLogs('');
                    }
                  }}
                  className="px-2 py-0.5 rounded bg-space-900 hover:bg-space-800 border border-slate-800 text-[10px] text-slate-400 hover:text-white"
                  title="Clear Terminal Tab Output"
                >
                  CLEAR
                </button>
                <button
                  onClick={() => setIsTerminalOpen(!isTerminalOpen)}
                  className="flex items-center space-x-1 text-[10px] text-slate-400 hover:text-slate-200"
                >
                  <span>{isTerminalOpen ? 'COLLAPSE' : 'EXPAND'}</span>
                  {isTerminalOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {isTerminalOpen && (
              <div className="h-56 flex flex-col overflow-hidden bg-space-950">
                {/* TAB 1: Interactive PowerShell Terminal */}
                {terminalActiveTab === 'interactive' && (
                  <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Quick Command Chips */}
                    <div className="px-3 py-1.5 bg-space-900/60 border-b border-slate-800/80 flex items-center space-x-1.5 overflow-x-auto shrink-0">
                      <span className="text-[9px] text-slate-500 font-bold uppercase">CHIPS:</span>
                      {[
                        { label: '🚀 npm run dev', cmd: 'npm run dev' },
                        { label: '📦 npm install', cmd: 'npm install --no-audit --no-fund' },
                        { label: '🧪 npm test', cmd: 'npm test' },
                        { label: '📊 git status', cmd: 'git status' },
                        { label: '📁 dir', cmd: 'dir' },
                      ].map((chip, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleRunInteractiveCommand(chip.cmd)}
                          disabled={isInteractiveExecuting}
                          className="px-2 py-0.5 rounded bg-space-800 hover:bg-space-700 text-slate-300 hover:text-cyan-300 border border-slate-700/50 text-[10px] whitespace-nowrap transition disabled:opacity-50"
                        >
                          {chip.label}
                        </button>
                      ))}
                    </div>

                    {/* Interactive History Scroll */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-3 font-mono text-xs select-text">
                      {interactiveHistory.length === 0 ? (
                        <div className="text-slate-600 text-xs py-2">
                          Zak_OS PowerShell interactive prompt ready in <code className="text-cyan-400">{currentProject.path}</code>. Type a command below or click a quick action chip.
                        </div>
                      ) : (
                        interactiveHistory.map((item) => (
                          <div key={item.id} className="space-y-1 bg-space-900/40 p-2.5 rounded-lg border border-slate-800/80">
                            <div className="flex items-center justify-between text-slate-400 text-[11px]">
                              <div className="flex items-center space-x-1.5 text-cyan-300 font-bold truncate">
                                <span className="text-blue-400">PS&gt;</span>
                                <span className="text-emerald-300">{item.command}</span>
                              </div>
                              <div className="flex items-center space-x-2 shrink-0">
                                {item.result && (
                                  <span
                                    className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                                      item.result.exitCode === 0
                                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                    }`}
                                  >
                                    EXIT {item.result.exitCode} ({item.result.executionTimeMs}ms)
                                  </span>
                                )}
                                <span className="text-[10px] text-slate-600">{item.timestamp}</span>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(item.result?.stdout || item.command);
                                    setCopiedCmdId(item.id);
                                    setTimeout(() => setCopiedCmdId(null), 2000);
                                  }}
                                  className="text-slate-500 hover:text-slate-300"
                                  title="Copy command output"
                                >
                                  {copiedCmdId === item.id ? (
                                    <Check className="w-3 h-3 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                            </div>

                            {item.isExecuting ? (
                              <div className="flex items-center space-x-2 text-cyan-400 animate-pulse pt-1 text-[11px]">
                                <RefreshCw className="w-3 h-3 animate-spin" />
                                <span>Executing in project directory...</span>
                              </div>
                            ) : item.result ? (
                              <div className="mt-1 space-y-1">
                                {item.result.stdout && (
                                  <pre className="text-slate-200 whitespace-pre-wrap font-mono leading-relaxed bg-space-950 p-2 rounded border border-slate-900 overflow-x-auto text-[11px]">
                                    {item.result.stdout}
                                  </pre>
                                )}
                                {item.result.stderr && (
                                  <pre className="text-rose-400 whitespace-pre-wrap font-mono leading-relaxed bg-rose-950/20 p-2 rounded border border-rose-900/40 overflow-x-auto text-[11px]">
                                    {item.result.stderr}
                                  </pre>
                                )}
                              </div>
                            ) : null}
                          </div>
                        ))
                      )}
                      <div ref={interactiveEndRef} />
                    </div>

                    {/* Interactive Input Bar */}
                    <div className="p-2.5 bg-space-900 border-t border-cyan-500/20 shrink-0">
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleRunInteractiveCommand();
                        }}
                        className="flex items-center space-x-2"
                      >
                        <div className="flex items-center space-x-1 text-cyan-400 font-bold px-2 py-1.5 bg-space-950 rounded-l-lg border border-r-0 border-slate-800 shrink-0 text-[11px]">
                          <span className="text-blue-400">PS</span>
                          <span className="text-slate-500 max-w-[140px] truncate">{currentProject.title}&gt;</span>
                        </div>

                        <input
                          ref={interactiveInputRef}
                          type="text"
                          value={interactiveCmdInput}
                          onChange={(e) => setInteractiveCmdInput(e.target.value)}
                          onKeyDown={handleInteractiveKeyDown}
                          placeholder="Type PowerShell directive (e.g. npm run dev:server, dir)..."
                          disabled={isInteractiveExecuting}
                          className="flex-1 bg-space-950 border border-slate-800 rounded-r-lg px-3 py-1.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-400 placeholder-slate-600"
                        />

                        <button
                          type="submit"
                          disabled={isInteractiveExecuting || !interactiveCmdInput.trim()}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-bold flex items-center space-x-1 text-xs transition shadow-glow-cyan shrink-0"
                        >
                          <Play className="w-3 h-3 fill-black" />
                          <span>RUN</span>
                        </button>
                      </form>
                    </div>
                  </div>
                )}

                {/* TAB 2: Daemon & Server Logs Stream */}
                {terminalActiveTab === 'logs' && (
                  <div className="flex-1 overflow-y-auto p-3 text-slate-200 text-xs font-mono select-text space-y-2">
                    {activeServers.length > 0 && activeServers[0].url && (
                      <div className="p-2 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Live Server listening on: <strong>{activeServers[0].url}</strong></span>
                        </span>
                        <a
                          href={activeServers[0].url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 rounded bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-[10px]"
                        >
                          OPEN IN BROWSER ↗
                        </a>
                      </div>
                    )}

                    {terminalLogs ? (
                      <pre className="text-emerald-300 whitespace-pre-wrap leading-relaxed font-mono">
                        {terminalLogs}
                      </pre>
                    ) : (
                      <div className="text-slate-600">
                        Live stdout & stderr from background web servers and AI actions will stream here.
                      </div>
                    )}

                    {isRunningCode && (
                      <div className="flex items-center space-x-2 text-cyan-400 animate-pulse pt-1">
                        <Sparkles className="w-3.5 h-3.5 animate-spin" />
                        <span>Executing script in project directory...</span>
                      </div>
                    )}

                    <div ref={terminalEndRef} />
                  </div>
                )}

                {/* TAB 3: Active Background Services */}
                {terminalActiveTab === 'servers' && (
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {activeServers.length === 0 ? (
                      <div className="p-8 text-center text-slate-500 font-mono space-y-1 border border-dashed border-slate-800 rounded-lg">
                        <Server className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                        <p className="text-xs">No active background servers currently running.</p>
                        <p className="text-[10px] text-slate-600">
                          Execute <code>npm run dev</code> or ask ARCHITECT-02 to start a server.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {activeServers.map((srv) => (
                          <div
                            key={srv.pid}
                            className="p-3 rounded-lg bg-space-900 border border-emerald-500/30 flex flex-col justify-between space-y-2"
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                                  <span className="font-bold text-white text-xs">{srv.name || 'Server'}</span>
                                  <span className="px-1 py-0.2 rounded bg-space-950 border border-slate-800 text-slate-400 text-[9px]">
                                    PID {srv.pid}
                                  </span>
                                </div>
                                <code className="text-[10px] text-cyan-300 mt-1 block truncate">
                                  {srv.command}
                                </code>
                              </div>
                              <button
                                onClick={() => handleStopServer(srv.pid)}
                                className="px-2 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-[10px] font-bold flex items-center gap-1"
                              >
                                <Square className="w-2.5 h-2.5 fill-rose-400" />
                                <span>STOP</span>
                              </button>
                            </div>

                            {srv.url && (
                              <div className="p-1.5 rounded bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between text-emerald-300 text-[10px]">
                                <span>{srv.url}</span>
                                <a
                                  href={srv.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-2 py-0.5 rounded bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-[9px]"
                                >
                                  OPEN ↗
                                </a>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* COLUMN 3: ARCHITECT-02 AI Copilot Sidecar (Collapsible Right) */}
      {!isZenMode && (
        isRightCopilotOpen ? (
          <div className="w-80 lg:w-96 h-full bg-space-900 border-l border-cyan-500/20 flex flex-col justify-between shrink-0 font-mono text-xs transition-all duration-200">
            {/* Copilot Header */}
            <div className="p-3 border-b border-cyan-500/20 bg-space-950 flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Bot className="w-4 h-4 text-blue-400 animate-pulse" />
                  <span className="font-display font-bold text-xs text-white">
                    ARCHITECT-02
                  </span>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setIsAutonomousMode(!isAutonomousMode)}
                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold border transition ${
                      isAutonomousMode
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                        : 'bg-space-900 border-slate-800 text-slate-500'
                    }`}
                    title="Autonomous Mode: Auto-execute commands and server starts"
                  >
                    {isAutonomousMode ? '⚡ AUTO RUN' : '🛡️ GUIDED'}
                  </button>

                  <button
                    onClick={() => setIsRightCopilotOpen(false)}
                    className="p-1 rounded hover:bg-space-800 text-slate-400 hover:text-white"
                    title="Collapse Copilot"
                  >
                    <PanelRightClose className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Hybrid Model Router Selector */}
              <div className="flex items-center space-x-1 pt-1">
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="flex-1 bg-space-900 border border-slate-700 rounded px-2 py-1 text-[10px] text-cyan-300 focus:outline-none truncate"
                >
                  <optgroup label="Google AI (Cloud)">
                    <option value="gemini-3.7-flash">Gemini 3.7 Flash (Reasoning)</option>
                    <option value="gemini-2.5-flash">Gemini 2.5 Flash (Ultra Fast)</option>
                    <option value="gemini-3.6-flash">Gemini 3.6 Flash</option>
                  </optgroup>
                  <optgroup label="Ollama (Local Fallback)">
                    <option value="deepseek-coder-v2:latest">DeepSeek Coder V2 (Local)</option>
                    <option value="deepseek-r1:8b">DeepSeek R1 8B (Local)</option>
                    <option value="qwen2.5:14b">Qwen 2.5 14B (Local)</option>
                    <option value="llama3:8b">Llama 3 8B (Local)</option>
                  </optgroup>
                </select>

                <select
                  value={routingMode}
                  onChange={(e) => setRoutingMode(e.target.value as RoutingMode)}
                  className="bg-space-900 border border-cyan-500/30 rounded px-1.5 py-1 text-[9px] text-amber-300 font-bold focus:outline-none"
                  title="Router Strategy: Hybrid (Cloud with Local Fallback), Cloud Only, or Local Only"
                >
                  <option value="hybrid_fallback">⚡ Hybrid</option>
                  <option value="cloud_only">☁️ Cloud</option>
                  <option value="local_only">💻 Local</option>
                </select>
              </div>

              <div className="p-1.5 rounded bg-space-900 border border-cyan-500/30 flex items-center justify-between text-[10px]">
                <div className="flex items-center space-x-1.5 truncate text-cyan-400">
                  <Zap className="w-3 h-3 text-amber-400 shrink-0" />
                  <span className="truncate font-bold">
                    {activeTab ? `CONTEXT: ${activeTab.name}` : `WORKSPACE: ${currentProject.title}`}
                  </span>
                </div>
                <span className="text-slate-500 font-mono uppercase">
                  {activeTab?.language || currentProject.language}
                </span>
              </div>
            </div>

            {/* Copilot Chat Message Stream */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 font-mono text-xs">
              {copilotMessages.length === 0 ? (
                <div className="p-4 rounded-xl bg-space-950/70 border border-slate-800 text-slate-400 space-y-2">
                  <div className="font-bold text-slate-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                    <span>Autonomous ARCHITECT-02</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    I have full PowerShell terminal privileges and live background process control in <strong>{currentProject.title}</strong>.
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Ask me to install dependencies, run scripts, build projects, or launch web servers on any port!
                  </p>
                </div>
              ) : (
                copilotMessages.map((msg) => {
                  const isUser = msg.role === 'user';

                  return (
                    <div
                      key={msg.id}
                      className={`p-3 rounded-xl ${
                        isUser
                          ? 'bg-cyan-950/40 border border-cyan-500/30 text-cyan-100'
                          : 'bg-space-950 border border-slate-800 text-slate-200'
                      }`}
                    >
                      <div className="text-[9px] text-slate-500 mb-1 flex items-center justify-between">
                        <span>{isUser ? 'ZAKARYA' : 'ARCHITECT-02'}</span>
                        <div className="flex items-center gap-1">
                          {msg.executed && (
                            <span className="text-[9px] text-emerald-400 font-bold flex items-center gap-0.5">
                              <Check className="w-2.5 h-2.5" /> EXECUTED
                            </span>
                          )}
                          <span>{msg.timestamp}</span>
                        </div>
                      </div>

                      <div
                        className="prose prose-invert max-w-none text-xs leading-relaxed prose-pre:bg-space-900 prose-pre:border prose-pre:border-slate-800"
                        dangerouslySetInnerHTML={{
                          __html: marked.parse(msg.content, { async: false }) as string,
                        }}
                      />

                      {!isUser && (
                        <div className="mt-2 pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-end gap-1.5">
                          {msg.content.includes('```') && (
                            <button
                              onClick={() => handleApplyCodeToEditor(msg.content)}
                              className="flex items-center space-x-1 px-2.5 py-1 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-[10px] font-bold transition shadow-sm"
                              title="Inject code directly into Monaco editor"
                            >
                              <Zap className="w-3 h-3 text-amber-400" />
                              <span>⚡ APPLY TO EDITOR</span>
                            </button>
                          )}

                          {extractExecutableCommands(msg.content) && (
                            <button
                              onClick={() => {
                                const cmd = extractExecutableCommands(msg.content);
                                if (cmd) handleExecuteTerminalCommand(cmd);
                              }}
                              className="flex items-center space-x-1 px-2.5 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold transition shadow-sm"
                              title="Run script in PowerShell terminal"
                            >
                              <Play className="w-3 h-3 fill-emerald-400" />
                              <span>▶ RUN IN TERMINAL</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}

              {isCopilotStreaming && (
                <div className="flex items-center space-x-2 text-cyan-400 text-[11px] animate-pulse">
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  <span>Architect is reasoning and planning actions...</span>
                </div>
              )}

              <div ref={copilotEndRef} />
            </div>

            {/* Quick Action Chips */}
            <div className="p-2 bg-space-950 border-t border-slate-800 overflow-x-auto flex items-center space-x-1.5 shrink-0">
              {[
                { label: '🚀 Install & Run Server', prompt: 'Install dependencies for this project and start the local web server on the first open port please.' },
                { label: 'Refactor Code', prompt: 'Refactor and optimize the active file for performance and clean architecture.' },
                { label: 'Add Type Hints', prompt: 'Add complete type hints, docstrings, and error handling to this file.' },
                { label: 'Fix Bugs', prompt: 'Inspect the active file for logical errors, memory leaks, or unhandled exceptions.' },
              ].map((action, i) => (
                <button
                  key={i}
                  onClick={() => handleSendCopilot(action.prompt)}
                  disabled={isCopilotStreaming}
                  className="px-2 py-0.5 rounded bg-space-900 hover:bg-space-800 border border-slate-800 hover:border-cyan-500/40 text-[10px] text-slate-300 whitespace-nowrap transition"
                >
                  {action.label}
                </button>
              ))}
            </div>

            {/* Copilot Input */}
            <div className="p-3 bg-space-950 border-t border-cyan-500/20 shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendCopilot();
                }}
                className="flex items-center space-x-2"
              >
                <input
                  type="text"
                  value={copilotInput}
                  onChange={(e) => setCopilotInput(e.target.value)}
                  placeholder="Instruct Autonomous Architect..."
                  disabled={isCopilotStreaming}
                  className="flex-1 bg-space-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-400 placeholder-slate-600"
                />
                <button
                  type="submit"
                  disabled={isCopilotStreaming || !copilotInput.trim()}
                  className="p-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black font-bold transition shadow-glow-cyan"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* Right Collapsed Micro-Rail */
          <div className="w-10 h-full bg-space-900 border-l border-cyan-500/20 flex flex-col items-center py-2 space-y-3 shrink-0">
            <button
              onClick={() => setIsRightCopilotOpen(true)}
              className="p-2 rounded hover:bg-space-800 text-blue-400 hover:text-blue-300"
              title="Expand AI Copilot"
            >
              <PanelRightOpen className="w-4 h-4" />
            </button>
          </div>
        )
      )}

      {/* Modal 1: Open System Folder */}
      {isOpenFolderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-space-900 border border-cyan-500/40 rounded-xl p-6 shadow-glass-glow space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <FolderPlus className="w-5 h-5 text-cyan-400" />
                <h2 className="font-display font-bold text-base text-white">
                  OPEN SYSTEM FOLDER AS WORKSPACE
                </h2>
              </div>
              <button onClick={() => setIsOpenFolderModalOpen(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddFolderSubmit} className="space-y-3">
              <div>
                <label className="block text-slate-400 mb-1 font-bold">DIRECTORY PATH ON DISK</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={customFolderPath}
                  onChange={(e) => setCustomFolderPath(e.target.value)}
                  placeholder="e.g. C:\Users\Zakar\Documents\Web_Dev\MyProject"
                  className="w-full bg-space-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">PROJECT NAME (OPTIONAL)</label>
                  <input
                    type="text"
                    value={customProjectName}
                    onChange={(e) => setCustomProjectName(e.target.value)}
                    placeholder="My Project"
                    className="w-full bg-space-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">CATEGORY</label>
                  <input
                    type="text"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="Web_Dev / Security / Tools"
                    className="w-full bg-space-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <label className="flex items-center space-x-2 p-2.5 rounded bg-space-950 border border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoScanOnAdd}
                  onChange={(e) => setAutoScanOnAdd(e.target.checked)}
                  className="accent-cyan-400"
                />
                <span className="text-slate-300 text-[11px]">
                  🤖 <strong>Auto-Scan with Gemini AI:</strong> Generate Obsidian Tier 2 Node and 3D Graph Links.
                </span>
              </label>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpenFolderModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-space-800 text-slate-300 hover:bg-space-700"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold shadow-glow-cyan"
                >
                  MOUNT WORKSPACE
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Create New Project in Vault */}
      {isNewProjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-space-900 border border-cyan-500/40 rounded-xl p-6 shadow-glass-glow space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Plus className="w-5 h-5 text-amber-400" />
                <h2 className="font-display font-bold text-base text-white">
                  CREATE NEW VAULT PROJECT
                </h2>
              </div>
              <button onClick={() => setIsNewProjectModalOpen(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateVaultProjectSubmit} className="space-y-3">
              <div>
                <label className="block text-slate-400 mb-1">PROJECT NAME</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newVaultProjName}
                  onChange={(e) => setNewVaultProjName(e.target.value)}
                  placeholder="e.g. Discord_Security_Bot"
                  className="w-full bg-space-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">LANGUAGE & STACK</label>
                <select
                  value={newVaultProjLang}
                  onChange={(e) => setNewVaultProjLang(e.target.value)}
                  className="w-full bg-space-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-cyan-400"
                >
                  <option value="Python">Python (AsyncIO / Scripting)</option>
                  <option value="TypeScript">TypeScript (Node / Next.js)</option>
                  <option value="C">C / C++ (Low-Level Systems)</option>
                  <option value="Rust">Rust (High Performance)</option>
                  <option value="Bash">Bash / Shell (Automation)</option>
                </select>
              </div>

              <div className="p-2.5 rounded bg-space-950 text-slate-400 text-[10px]">
                📁 Creates folder in: <code>02 Coding Projects/{newVaultProjLang}/{newVaultProjName || '...'}</code>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewProjectModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-space-800 text-slate-300"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold shadow-glow-cyan"
                >
                  CREATE & INITIALIZE
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: New File / Folder inside active tree */}
      {isCreateItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm bg-space-900 border border-cyan-500/40 rounded-xl p-5 shadow-glass-glow space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-white uppercase">
                CREATE NEW {createItemType.toUpperCase()}
              </span>
              <button onClick={() => setIsCreateItemModalOpen(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTreeItem} className="space-y-3">
              <div>
                <label className="block text-slate-400 mb-1">NAME (e.g. scanner.py or utils/)</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder={createItemType === 'file' ? 'module.py' : 'subfolder'}
                  className="w-full bg-space-950 border border-slate-700 rounded p-2 text-slate-100 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateItemModalOpen(false)}
                  className="px-3 py-1.5 rounded bg-space-800 text-slate-300"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded bg-cyan-500 hover:bg-cyan-400 text-black font-bold"
                >
                  CREATE
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
