export interface NoteFrontmatter {
  title?: string;
  type?: string;
  category?: string;
  tier?: number;
  status?: string;
  tags?: string[];
  created?: string;
  updated?: string;
  parent?: string;
  difficulty?: string;
  target_ip?: string;
  tool?: string;
  [key: string]: any;
}

export interface NoteItem {
  id: string;
  title: string;
  path: string;
  relativePath: string;
  branch: 'nucleus' | 'certs' | 'coding' | 'aios' | 'kb' | 'templates' | 'other';
  branchLabel: string;
  branchColor: string;
  tier: number;
  category: string;
  type: string;
  status: string;
  tags: string[];
  created: string;
  updated: string;
  parent: string | null;
  content: string;
  rawContent: string;
  frontmatter: NoteFrontmatter;
  links: string[];
  backlinks: string[];
  wordCount: number;
  size: number;
  headings: { level: number; text: string }[];
}

export interface GraphNode {
  id: string;
  label: string;
  path: string;
  branch: string;
  branchColor: string;
  tier: number;
  category: string;
  tags: string[];
  val: number;
  linkCount: number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

export interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  type: 'parent' | 'wikilink' | 'reference';
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface CommandItem {
  id: string;
  title: string;
  tool: string;
  category: string;
  command: string;
  description: string;
  flags?: string[];
  parameters: {
    name: string;
    placeholder: string;
    defaultValue?: string;
    description?: string;
  }[];
  sourceNote?: string;
  branch: string;
  tags: string[];
}

export interface TaskAttachment {
  id: string;
  type: 'video' | 'image' | 'pdf' | 'link';
  url: string;
  title?: string;
  description?: string;
}

export interface ProjectTaskItem {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: 'planning' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;
  amount?: string;
  assignee?: {
    name: string;
    avatar?: string;
    role?: string;
  };
  notes?: string;
  attachments?: TaskAttachment[];
  imageLayout?: 'horizontal' | 'vertical';
  createdAt?: string;
  updatedAt?: string;
}

export interface DetailedProjectItem {
  id: string;
  title: string;
  category: string;
  description: string;
  status: 'planning' | 'in-progress' | 'completed';
  progress: number;
  tags: string[];
  themeColor?: string;
  accentColor?: string;
  clientOrOrg?: string;
  dueDate?: string;
  sourceNote?: string;
  localPath?: string;
  tasks: ProjectTaskItem[];
}

export interface ProjectKanbanItem {
  id: string;
  title: string;
  category: string;
  status: 'Planning' | 'In-Progress' | 'Testing' | 'Completed';
  tier: number;
  path: string;
  description: string;
  progress: number;
  tags: string[];
}

export interface TelemetryStats {
  totalNotes: number;
  totalLinks: number;
  totalTags: number;
  totalCommands: number;
  branchCounts: Record<string, number>;
  tierCounts: Record<number, number>;
  ejptReadiness: {
    percentage: number;
    currentCourse?: string;
    completedModules: number;
    totalModules: number;
    completedLabs: number;
    totalLabs: number;
    indexedCommands: number;
    currentStage?: {
      courseName: string;
      subModule: string;
      progress: number;
      remainingTasks: string[];
    };
    categories: {
      name: string;
      progress: number;
      status: string;
    }[];
  };
  vaultHealth: {
    orphanCount: number;
    brokenLinksCount: number;
    healthScore: number;
  };
}

export type RoutingMode = 'cloud_only' | 'hybrid_fallback' | 'local_only';

export interface ModelOption {
  id: string;
  name: string;
  provider: 'google' | 'ollama' | 'builtin' | 'local';
  badge: string;
  description: string;
  isFree: boolean;
  isAvailable?: boolean;
}

export interface BackgroundServerInfo {
  id: string;
  pid: number;
  name: string;
  command: string;
  cwd: string;
  status: 'running' | 'stopped' | 'errored';
  startTime: string;
  port?: number;
  url?: string;
  logs: string[];
}

export interface AgentProfile {
  id: string;
  name: string;
  codename: string;
  icon: string;
  color: string;
  role: string;
  description: string;
  systemPrompt: string;
  defaultModel?: string;
  fallbackLocalModel?: string;
  quickPrompts: string[];
}

// IDE & Workspace Types
export interface FileNode {
  id: string;
  name: string;
  path: string;
  relativePath: string;
  type: 'file' | 'directory';
  extension?: string;
  size?: number;
  updated?: string;
  children?: FileNode[];
}

export interface ProjectInfo {
  id: string;
  name: string;
  title: string;
  path: string;
  category: string;
  type: 'vault' | 'external';
  description: string;
  language: string;
  mainFile?: string;
  fileCount?: number;
  lastOpened?: string;
  vaultNotePath?: string;
}

export interface IdeState {
  lastActiveProjectId: string;
  openTabs: { path: string; name: string; language: string }[];
  activeTabPath: string;
}

export interface CodeExecutionResult {
  success?: boolean;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  durationMs?: number;
  executionTimeMs?: number;
  timestamp?: string;
  language?: string;
}

export type ThemeMode = 'light' | 'dark';

export type SystemTabId = 
  | 'dashboard' 
  | 'projects' 
  | 'github'
  | 'galaxy' 
  | 'editor' 
  | 'agents' 
  | 'pentest' 
  | 'ide' 
  | 'terminal' 
  | 'voice' 
  | 'about'
  | 'telemetry' 
  | 'graph' 
  | 'commands';

export interface WorkspaceTab {
  id: string;
  title: string;
  type: 'system' | 'ide';
  systemTabId?: SystemTabId;
  icon?: string;
  project?: ProjectInfo;
  isPinned?: boolean;
}

// GitHub Cloud Integration Types
export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  name: string | null;
  company: string | null;
  blog: string | null;
  location: string | null;
  email: string | null;
  bio: string | null;
  public_repos: number;
  total_private_repos?: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  owner?: {
    login: string;
    avatar_url?: string;
    html_url?: string;
  };
  description: string | null;
  fork: boolean;
  url: string;
  stargazers_count: number;
  watchers_count: number;
  language: string | null;
  forks_count: number;
  open_issues_count: number;
  default_branch: string;
  topics?: string[];
  visibility?: 'public' | 'private';
  updated_at: string;
  pushed_at: string;
  created_at: string;
  size: number;
  clone_url: string;
  ssh_url: string;
  homepage?: string | null;
  license?: {
    key: string;
    name: string;
    spdx_id: string;
  } | null;
}

export interface GitHubTreeItem {
  path: string;
  mode: string;
  type: 'blob' | 'tree';
  sha: string;
  size?: number;
  url: string;
}

export interface GitHubFileDetail {
  name: string;
  path: string;
  sha: string;
  size: number;
  type: string;
  download_url: string;
  content: string;
  isBinary: boolean;
  encoding: string;
}

export interface GitHubCommitItem {
  sha: string;
  node_id: string;
  commit: {
    author: {
      name: string;
      email: string;
      date: string;
    };
    committer: {
      name: string;
      email: string;
      date: string;
    };
    message: string;
    comment_count: number;
  };
  html_url: string;
  author?: {
    login: string;
    avatar_url: string;
    html_url: string;
  } | null;
}

export interface GitHubContributorItem {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  contributions: number;
  type: string;
}

export interface GitHubReadme {
  name: string;
  path: string;
  content: string;
  download_url: string;
}

