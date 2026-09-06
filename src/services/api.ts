import { 
  NoteItem, 
  GraphData, 
  CommandItem, 
  ProjectKanbanItem, 
  TelemetryStats, 
  AgentProfile, 
  ModelOption,
  ProjectInfo,
  FileNode,
  CodeExecutionResult,
  GitHubUser,
  GitHubRepo,
  GitHubTreeItem,
  GitHubFileDetail,
  GitHubCommitItem,
  GitHubContributorItem,
  GitHubReadme,
  ScrapedResult,
  ThreatAnalysis,
  CybersecNewsItem
} from '../types';

const API_BASE = '/api';

export const api = {
  // Overview
  async getOverview(): Promise<{
    stats: TelemetryStats;
    projects: ProjectKanbanItem[];
    recentNotes: NoteItem[];
    vaultPath: string;
  }> {
    const res = await fetch(`${API_BASE}/vault/overview`);
    if (!res.ok) throw new Error('Failed to fetch overview');
    return await res.json();
  },

  // Notes
  async getNotes(): Promise<NoteItem[]> {
    const res = await fetch(`${API_BASE}/vault/notes`);
    if (!res.ok) throw new Error('Failed to fetch notes');
    const data = await res.json();
    return data.notes || [];
  },

  async getNote(pathOrId: string): Promise<NoteItem> {
    const param = pathOrId.includes('/') || pathOrId.includes('\\') ? `path=${encodeURIComponent(pathOrId)}` : `id=${encodeURIComponent(pathOrId)}`;
    const res = await fetch(`${API_BASE}/vault/note?${param}`);
    if (!res.ok) throw new Error('Failed to fetch note');
    const data = await res.json();
    return data.note;
  },

  async saveNote(path: string, content: string, frontmatter?: Record<string, any>): Promise<NoteItem> {
    const res = await fetch(`${API_BASE}/vault/note`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, content, frontmatter }),
    });
    if (!res.ok) throw new Error('Failed to save note');
    const data = await res.json();
    return data.note;
  },

  async deleteNote(path: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/vault/note`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path }),
    });
    if (!res.ok) throw new Error('Failed to delete note');
    const data = await res.json();
    return data.success;
  },

  // Graph
  async getGraph(): Promise<GraphData> {
    const res = await fetch(`${API_BASE}/vault/graph`);
    if (!res.ok) throw new Error('Failed to fetch graph');
    const data = await res.json();
    return data.graph || { nodes: [], links: [] };
  },

  // Commands
  async getCommands(): Promise<CommandItem[]> {
    const res = await fetch(`${API_BASE}/vault/commands`);
    if (!res.ok) throw new Error('Failed to fetch commands');
    const data = await res.json();
    return data.commands || [];
  },

  // Projects
  async getProjects(): Promise<ProjectKanbanItem[]> {
    const res = await fetch(`${API_BASE}/vault/projects`);
    if (!res.ok) throw new Error('Failed to fetch projects');
    const data = await res.json();
    return data.projects || [];
  },

  // Daily Note
  async createDailyNote(priorities?: string[]): Promise<NoteItem> {
    const res = await fetch(`${API_BASE}/vault/daily`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priorities }),
    });
    if (!res.ok) throw new Error('Failed to create daily note');
    const data = await res.json();
    return data.note;
  },

  // Agent Profiles & Models
  async getAgentProfiles(): Promise<AgentProfile[]> {
    const res = await fetch(`${API_BASE}/agent/profiles`);
    if (!res.ok) throw new Error('Failed to fetch agent profiles');
    const data = await res.json();
    return data.profiles || [];
  },

  async getModels(): Promise<ModelOption[]> {
    const res = await fetch(`${API_BASE}/agent/models`);
    if (!res.ok) throw new Error('Failed to fetch models');
    const data = await res.json();
    return data.models || [];
  },

  async chatWithAgent(agentId: string, message: string, history: any[] = [], modelId?: string): Promise<any> {
    const res = await fetch(`${API_BASE}/agent/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId, message, history, modelId }),
    });
    if (!res.ok) throw new Error('Agent chat failed');
    const data = await res.json().catch(() => ({ reply: '', text: '' }));
    return data;
  },

  // API Key Management
  async getApiKeyStatus(): Promise<{ hasKey: boolean; maskedKey: string }> {
    const res = await fetch(`${API_BASE}/settings/key`);
    if (!res.ok) throw new Error('Failed to get API key status');
    return await res.json();
  },

  async saveApiKey(key: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/settings/key`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key }),
    });
    if (!res.ok) throw new Error('Failed to save API key');
    const data = await res.json();
    return data.success;
  },

  // Agent Chat (Hybrid SSE Stream with Model & Routing Selection)
  async streamAgentChat(
    agentId: string,
    message: string,
    history: { role: string; content: string }[],
    modelId: string,
    onChunk: (chunk: string) => void,
    routingMode = 'hybrid_fallback'
  ): Promise<void> {
    const res = await fetch(`${API_BASE}/agent/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId, message, history, modelId, routingMode }),
    });

    if (!res.ok || !res.body) {
      throw new Error('Agent chat stream failed');
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.chunk) {
              onChunk(data.chunk);
            }
          } catch (e) {}
        }
      }
    }
  },

  // Project Filesystem & IDE Endpoints
  async getProjectList(): Promise<ProjectInfo[]> {
    const res = await fetch(`${API_BASE}/project/list`);
    if (!res.ok) throw new Error('Failed to fetch project list');
    const data = await res.json();
    return data.projects || [];
  },

  async getProjectTree(dirPath?: string): Promise<FileNode> {
    const param = dirPath ? `?path=${encodeURIComponent(dirPath)}` : '';
    const res = await fetch(`${API_BASE}/project/tree${param}`);
    if (!res.ok) throw new Error('Failed to fetch project tree');
    const data = await res.json();
    return data.tree;
  },

  async getProjectFile(filePath: string): Promise<{ content: string; path: string; name: string; size: number }> {
    const res = await fetch(`${API_BASE}/project/file?path=${encodeURIComponent(filePath)}`);
    if (!res.ok) throw new Error('Failed to fetch project file');
    const data = await res.json();
    return data.file;
  },

  async saveProjectFile(filePath: string, content: string): Promise<{ success: boolean; path: string; name: string }> {
    const res = await fetch(`${API_BASE}/project/file`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: filePath, content }),
    });
    if (!res.ok) throw new Error('Failed to save project file');
    return await res.json();
  },

  async createProjectItem(targetPath: string, type: 'file' | 'directory', initialContent = ''): Promise<boolean> {
    const res = await fetch(`${API_BASE}/project/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: targetPath, type, initialContent }),
    });
    if (!res.ok) throw new Error('Failed to create project item');
    const data = await res.json();
    return data.success;
  },

  async deleteProjectItem(targetPath: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/project/file`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: targetPath }),
    });
    if (!res.ok) throw new Error('Failed to delete project item');
    const data = await res.json();
    return data.success;
  },

  // Workspace & Project Manager Methods
  async addWorkspace(
    folderPath: string,
    customName?: string,
    category = 'General',
    autoScanWithAi = true
  ): Promise<ProjectInfo> {
    const res = await fetch(`${API_BASE}/project/workspace/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folderPath, customName, category, autoScanWithAi }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to add workspace');
    }
    const data = await res.json();
    return data.project;
  },

  async removeWorkspace(id: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/project/workspace/remove`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) throw new Error('Failed to remove workspace');
    const data = await res.json();
    return data.success;
  },

  async scanProjectWithAi(
    projectId?: string,
    projectPath?: string,
    modelId = 'gemini-3.7-flash'
  ): Promise<string> {
    const res = await fetch(`${API_BASE}/project/workspace/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, projectPath, modelId }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to scan project with AI');
    }
    const data = await res.json();
    return data.vaultNotePath;
  },

  async getIdeState(): Promise<{
    lastActiveProjectId: string;
    openTabs: { path: string; name: string; language: string }[];
    activeTabPath: string;
  }> {
    const res = await fetch(`${API_BASE}/project/workspace/state`);
    if (!res.ok) throw new Error('Failed to get IDE state');
    const data = await res.json();
    return data.state;
  },

  async saveIdeState(state: {
    lastActiveProjectId: string;
    openTabs: { path: string; name: string; language: string }[];
    activeTabPath: string;
  }): Promise<boolean> {
    const res = await fetch(`${API_BASE}/project/workspace/state`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state }),
    });
    if (!res.ok) throw new Error('Failed to save IDE state');
    const data = await res.json();
    return data.success;
  },

  async runProjectCode(language: string, code: string, filePath?: string): Promise<CodeExecutionResult> {
    const res = await fetch(`${API_BASE}/project/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language, code, filePath }),
    });
    if (!res.ok) throw new Error('Failed to execute code in sandbox');
    const data = await res.json();
    return data.result;
  },

  async executeTerminalCommand(command: string, cwd?: string): Promise<CodeExecutionResult> {
    const res = await fetch(`${API_BASE}/project/terminal/exec`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command, cwd }),
    });
    if (!res.ok) throw new Error('Failed to execute terminal command');
    const data = await res.json();
    return data.result;
  },

  async startBackgroundServer(command: string, cwd?: string, name?: string): Promise<any> {
    const res = await fetch(`${API_BASE}/project/server/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command, cwd, name }),
    });
    if (!res.ok) throw new Error('Failed to start background server');
    const data = await res.json();
    return data.server;
  },

  async stopBackgroundServer(pid: number): Promise<boolean> {
    const res = await fetch(`${API_BASE}/project/server/stop`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pid }),
    });
    if (!res.ok) throw new Error('Failed to stop server');
    const data = await res.json();
    return data.success;
  },

  async getActiveServers(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/project/server/list`);
    if (!res.ok) throw new Error('Failed to get active servers');
    const data = await res.json();
    return data.servers || [];
  },

  async getServerLogs(pid?: number): Promise<string[]> {
    const url = pid ? `${API_BASE}/project/server/logs?pid=${pid}` : `${API_BASE}/project/server/logs`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to get server logs');
    const data = await res.json();
    return data.logs || [];
  },

  // ==========================================
  // GitHub Cloud Portfolio API
  // ==========================================
  getStoredGitHubToken(): string {
    return localStorage.getItem('zakos_github_token') || '';
  },

  setStoredGitHubToken(token: string) {
    if (token) {
      localStorage.setItem('zakos_github_token', token);
    } else {
      localStorage.removeItem('zakos_github_token');
    }
  },

  getGitHubHeaders(customToken?: string): Record<string, string> {
    const token = customToken || this.getStoredGitHubToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers['x-github-token'] = token;
    }
    return headers;
  },

  async getGitHubUser(token?: string): Promise<GitHubUser> {
    const res = await fetch(`${API_BASE}/github/user`, {
      headers: this.getGitHubHeaders(token),
    });
    if (!res.ok) {
      // Direct client-side fallback if backend route is unavailable
      const fallbackToken = token || this.getStoredGitHubToken() || '';
      const headers: Record<string, string> = {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'ZakOS-Portfolio',
      };
      if (fallbackToken) headers['Authorization'] = `token ${fallbackToken}`;
      const fbRes = await fetch('https://api.github.com/user', { headers });
      if (!fbRes.ok) throw new Error('Failed to fetch GitHub profile');
      return await fbRes.json();
    }
    const data = await res.json();
    return data.user;
  },

  async getGitHubRepos(token?: string): Promise<GitHubRepo[]> {
    const res = await fetch(`${API_BASE}/github/repos`, {
      headers: this.getGitHubHeaders(token),
    });
    if (!res.ok) {
      const fallbackToken = token || this.getStoredGitHubToken() || '';
      const headers: Record<string, string> = {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'ZakOS-Portfolio',
      };
      if (fallbackToken) headers['Authorization'] = `token ${fallbackToken}`;
      const fbRes = await fetch('https://api.github.com/user/repos?per_page=100&sort=updated', { headers });
      if (!fbRes.ok) throw new Error('Failed to fetch GitHub repositories');
      return await fbRes.json();
    }
    const data = await res.json();
    return data.repos || [];
  },

  async getGitHubRepo(owner: string, repo: string, token?: string): Promise<GitHubRepo> {
    const res = await fetch(`${API_BASE}/github/repo?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`, {
      headers: this.getGitHubHeaders(token),
    });
    if (!res.ok) throw new Error(`Failed to fetch repo ${owner}/${repo}`);
    const data = await res.json();
    return data.repo;
  },

  async getGitHubBranches(owner: string, repo: string, token?: string): Promise<{ name: string; commit: { sha: string } }[]> {
    const res = await fetch(`${API_BASE}/github/branches?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`, {
      headers: this.getGitHubHeaders(token),
    });
    if (!res.ok) return [{ name: 'main', commit: { sha: '' } }];
    const data = await res.json();
    return data.branches || [];
  },

  async getGitHubTree(owner: string, repo: string, branch: string = 'main', token?: string): Promise<{ tree: GitHubTreeItem[]; truncated: boolean }> {
    const res = await fetch(`${API_BASE}/github/tree?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}&branch=${encodeURIComponent(branch)}`, {
      headers: this.getGitHubHeaders(token),
    });
    if (!res.ok) throw new Error('Failed to fetch file tree');
    const data = await res.json();
    return data.tree;
  },

  async getGitHubFile(owner: string, repo: string, path: string, branch?: string, token?: string): Promise<GitHubFileDetail> {
    const branchParam = branch ? `&branch=${encodeURIComponent(branch)}` : '';
    const res = await fetch(`${API_BASE}/github/file?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}&path=${encodeURIComponent(path)}${branchParam}`, {
      headers: this.getGitHubHeaders(token),
    });
    if (!res.ok) throw new Error(`Failed to fetch file ${path}`);
    const data = await res.json();
    return data.file;
  },

  async getGitHubCommits(owner: string, repo: string, branch?: string, perPage: number = 30, token?: string): Promise<GitHubCommitItem[]> {
    const branchParam = branch ? `&branch=${encodeURIComponent(branch)}` : '';
    const res = await fetch(`${API_BASE}/github/commits?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}&per_page=${perPage}${branchParam}`, {
      headers: this.getGitHubHeaders(token),
    });
    if (!res.ok) throw new Error('Failed to fetch commits');
    const data = await res.json();
    return data.commits || [];
  },

  async getGitHubContributors(owner: string, repo: string, token?: string): Promise<GitHubContributorItem[]> {
    const res = await fetch(`${API_BASE}/github/contributors?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`, {
      headers: this.getGitHubHeaders(token),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.contributors || [];
  },

  async getGitHubReadme(owner: string, repo: string, branch?: string, token?: string): Promise<GitHubReadme | null> {
    const branchParam = branch ? `&branch=${encodeURIComponent(branch)}` : '';
    const res = await fetch(`${API_BASE}/github/readme?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}${branchParam}`, {
      headers: this.getGitHubHeaders(token),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.readme;
  },

  async getGitHubLanguages(owner: string, repo: string, token?: string): Promise<Record<string, number>> {
    const res = await fetch(`${API_BASE}/github/languages?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`, {
      headers: this.getGitHubHeaders(token),
    });
    if (!res.ok) return {};
    const data = await res.json();
    return data.languages || {};
  },

  async updateGitHubToken(token: string): Promise<boolean> {
    this.setStoredGitHubToken(token);
    try {
      const res = await fetch(`${API_BASE}/github/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      return res.ok;
    } catch {
      return true;
    }
  },

  // Scrapy & Web Scraper / Threat Intelligence
  async crawlUrl(url: string, spider: string = 'zakos'): Promise<{ success: boolean; items: ScrapedResult[] }> {
    const res = await fetch(`${API_BASE}/scraper/crawl`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, spider }),
    });
    if (!res.ok) throw new Error('Crawl request failed');
    return await res.json();
  },

  async analyzeScrapedData(item: ScrapedResult): Promise<{ success: boolean; analysis: ThreatAnalysis }> {
    const res = await fetch(`${API_BASE}/scraper/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item }),
    });
    if (!res.ok) throw new Error('Analysis request failed');
    return await res.json();
  },

  async getScraperNews(spider: string = 'cve_feed'): Promise<{ success: boolean; items: CybersecNewsItem[] }> {
    const res = await fetch(`${API_BASE}/scraper/news?spider=${encodeURIComponent(spider)}`);
    if (!res.ok) throw new Error('Failed to fetch scraper news');
    return await res.json();
  },

  async analyzeFeedItem(item: any): Promise<{ success: boolean; briefing: string }> {
    const res = await fetch(`${API_BASE}/scraper/analyze-item`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item }),
    });
    if (!res.ok) throw new Error('Failed to analyze feed item');
    return await res.json();
  },
};
