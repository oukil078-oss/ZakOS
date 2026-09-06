import React, { useState, useEffect, useMemo } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { marked } from 'marked';
import { 
  FolderGit2, 
  GitBranch, 
  GitCommit, 
  GitFork, 
  Star, 
  Users, 
  FolderTree, 
  FileCode, 
  ExternalLink, 
  Copy, 
  Check, 
  Search, 
  Filter, 
  ArrowLeft, 
  Code, 
  Sparkles, 
  RefreshCw, 
  Lock, 
  Globe, 
  Key, 
  Layers, 
  Eye, 
  Download,
  Folder,
  FolderOpen,
  File,
  Terminal,
  Shield,
  Clock,
  LayoutGrid,
  List,
  ChevronRight,
  ChevronDown,
  Info
} from 'lucide-react';
import { 
  GitHubUser, 
  GitHubRepo, 
  GitHubTreeItem, 
  GitHubFileDetail, 
  GitHubCommitItem, 
  GitHubContributorItem, 
  GitHubReadme,
  ThemeMode
} from '../../types';
import { api } from '../../services/api';

interface GitHubWorkspaceViewProps {
  theme?: ThemeMode;
  onOpenInLocalIde?: (repoName: string) => void;
}

// Tree structure for file browser
interface TreeNode {
  name: string;
  path: string;
  type: 'blob' | 'tree';
  size?: number;
  sha: string;
  children?: TreeNode[];
}

export const GitHubWorkspaceView: React.FC<GitHubWorkspaceViewProps> = ({
  theme = 'dark',
  onOpenInLocalIde,
}) => {
  // State: Profile & Repos
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'public' | 'private'>('all');
  const [sortBy, setSortBy] = useState<'updated' | 'stars' | 'name'>('updated');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Active Deep-Dive Repo
  const [activeRepo, setActiveRepo] = useState<GitHubRepo | null>(null);
  const [activeTab, setActiveTab] = useState<'code' | 'readme' | 'commits' | 'contributors' | 'languages'>('code');

  // Repo Detail Data
  const [branches, setBranches] = useState<{ name: string; commit: { sha: string } }[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>('main');
  const [fileTree, setFileTree] = useState<GitHubTreeItem[]>([]);
  const [isLoadingTree, setIsLoadingTree] = useState(false);
  
  // Selected File & Monaco Editor
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);
  const [fileDetail, setFileDetail] = useState<GitHubFileDetail | null>(null);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [isRawView, setIsRawView] = useState(false);

  // Commits & Contributors & Readme & Languages
  const [commits, setCommits] = useState<GitHubCommitItem[]>([]);
  const [contributors, setContributors] = useState<GitHubContributorItem[]>([]);
  const [readme, setReadme] = useState<GitHubReadme | null>(null);
  const [languages, setLanguages] = useState<Record<string, number>>({});
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Token Modal
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [tokenSavedSuccess, setTokenSavedSuccess] = useState(false);

  // Copy feedback
  const [copiedCloneType, setCopiedCloneType] = useState<'https' | 'ssh' | 'code' | null>(null);

  // Expanded folders in Tree View
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

  // Initial Load
  const fetchGitHubData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [profile, repoList] = await Promise.all([
        api.getGitHubUser(),
        api.getGitHubRepos(),
      ]);
      setUser(profile);
      setRepos(repoList);
    } catch (err: any) {
      console.error('[GitHub] Fetch error:', err);
      setError(err.message || 'Failed to connect to GitHub API');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchGitHubData();
  }, []);

  // When a repo is selected, fetch its branches, tree, commits, contributors, and readme
  const loadRepoDetails = async (repo: GitHubRepo) => {
    setActiveRepo(repo);
    setSelectedBranch(repo.default_branch || 'main');
    setSelectedFilePath(null);
    setFileDetail(null);
    setActiveTab('code');
    setIsLoadingDetails(true);
    setIsLoadingTree(true);

    try {
      const [branchList, treeData, commitsList, contribList, readmeData, langData] = await Promise.all([
        api.getGitHubBranches(repo.owner?.login || user?.login || 'oukil078-oss', repo.name),
        api.getGitHubTree(repo.owner?.login || user?.login || 'oukil078-oss', repo.name, repo.default_branch || 'main'),
        api.getGitHubCommits(repo.owner?.login || user?.login || 'oukil078-oss', repo.name, repo.default_branch || 'main', 30),
        api.getGitHubContributors(repo.owner?.login || user?.login || 'oukil078-oss', repo.name),
        api.getGitHubReadme(repo.owner?.login || user?.login || 'oukil078-oss', repo.name, repo.default_branch || 'main'),
        api.getGitHubLanguages(repo.owner?.login || user?.login || 'oukil078-oss', repo.name),
      ]);

      setBranches(branchList);
      setFileTree(treeData?.tree || []);
      setCommits(commitsList);
      setContributors(contribList);
      setReadme(readmeData);
      setLanguages(langData);

      // Automatically open README.md or package.json if available
      const preferredFile = treeData?.tree?.find(
        (f) => f.path.toLowerCase() === 'readme.md' || f.path.toLowerCase() === 'package.json'
      );
      if (preferredFile && preferredFile.type === 'blob') {
        openFile(repo, preferredFile.path, repo.default_branch || 'main');
      }
    } catch (err: any) {
      console.error('[GitHub] Error loading repo details:', err);
    } finally {
      setIsLoadingTree(false);
      setIsLoadingDetails(false);
    }
  };

  // Branch Switch Handler
  const handleBranchChange = async (branchName: string) => {
    if (!activeRepo) return;
    setSelectedBranch(branchName);
    setIsLoadingTree(true);
    try {
      const treeData = await api.getGitHubTree(
        activeRepo.owner?.login || user?.login || 'oukil078-oss',
        activeRepo.name,
        branchName
      );
      setFileTree(treeData?.tree || []);
      if (selectedFilePath) {
        openFile(activeRepo, selectedFilePath, branchName);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingTree(false);
    }
  };

  // Open file in Monaco Editor
  const openFile = async (repo: GitHubRepo, path: string, branchName: string = selectedBranch) => {
    setSelectedFilePath(path);
    setIsLoadingFile(true);
    try {
      const file = await api.getGitHubFile(
        repo.owner?.login || user?.login || 'oukil078-oss',
        repo.name,
        path,
        branchName
      );
      setFileDetail(file);
    } catch (err: any) {
      console.error('[GitHub] Error opening file:', err);
      setFileDetail(null);
    } finally {
      setIsLoadingFile(false);
    }
  };

  // Build hierarchical folder tree from flat GitHub recursive tree items
  const hierarchicalTree = useMemo(() => {
    const root: TreeNode = { name: 'root', path: '', type: 'tree', sha: '', children: [] };

    fileTree.forEach((item) => {
      const parts = item.path.split('/');
      let current = root;

      parts.forEach((part, index) => {
        const isLast = index === parts.length - 1;
        const currentPath = parts.slice(0, index + 1).join('/');

        if (isLast) {
          if (!current.children) current.children = [];
          current.children.push({
            name: part,
            path: item.path,
            type: item.type,
            size: item.size,
            sha: item.sha,
          });
        } else {
          if (!current.children) current.children = [];
          let folder = current.children.find((c) => c.name === part && c.type === 'tree');
          if (!folder) {
            folder = {
              name: part,
              path: currentPath,
              type: 'tree',
              sha: '',
              children: [],
            };
            current.children.push(folder);
          }
          current = folder;
        }
      });
    });

    // Sort folders first, then files alphabetically
    const sortNodes = (node: TreeNode) => {
      if (node.children) {
        node.children.sort((a, b) => {
          if (a.type !== b.type) return a.type === 'tree' ? -1 : 1;
          return a.name.localeCompare(b.name);
        });
        node.children.forEach(sortNodes);
      }
    };

    sortNodes(root);
    return root.children || [];
  }, [fileTree]);

  // Toggle Folder open/closed
  const toggleFolder = (folderPath: string) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [folderPath]: !prev[folderPath],
    }));
  };

  // Copy helper
  const handleCopy = (text: string, type: 'https' | 'ssh' | 'code') => {
    navigator.clipboard.writeText(text);
    setCopiedCloneType(type);
    setTimeout(() => setCopiedCloneType(null), 2000);
  };

  // Language color map
  const languageColors: Record<string, string> = {
    TypeScript: '#3178C6',
    JavaScript: '#F7DF1E',
    Python: '#3776AB',
    HTML: '#E34F26',
    CSS: '#1572B6',
    Shell: '#89E051',
    Dockerfile: '#384D54',
    Rust: '#DEA584',
    Go: '#00ADD8',
    C: '#555555',
    'C++': '#F34B7D',
  };

  // Filtered Repositories
  const availableLanguages = useMemo(() => {
    const set = new Set<string>();
    repos.forEach((r) => {
      if (r.language) set.add(r.language);
    });
    return Array.from(set);
  }, [repos]);

  const filteredRepos = useMemo(() => {
    return repos
      .filter((repo) => {
        const matchesSearch =
          repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (repo.description && repo.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (repo.language && repo.language.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesLang =
          selectedLanguage === 'all' ||
          (repo.language && repo.language.toLowerCase() === selectedLanguage.toLowerCase());

        const matchesVis =
          visibilityFilter === 'all' ||
          (visibilityFilter === 'public' && !repo.private) ||
          (visibilityFilter === 'private' && repo.private);

        return matchesSearch && matchesLang && matchesVis;
      })
      .sort((a, b) => {
        if (sortBy === 'stars') return b.stargazers_count - a.stargazers_count;
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      });
  }, [repos, searchQuery, selectedLanguage, visibilityFilter, sortBy]);

  // Detect Monaco Editor language by file extension
  const getEditorLanguage = (path: string): string => {
    const ext = path.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'ts':
      case 'tsx':
        return 'typescript';
      case 'js':
      case 'jsx':
        return 'javascript';
      case 'json':
        return 'json';
      case 'html':
        return 'html';
      case 'css':
      case 'scss':
        return 'css';
      case 'py':
        return 'python';
      case 'md':
        return 'markdown';
      case 'sh':
      case 'bash':
        return 'shell';
      case 'yaml':
      case 'yml':
        return 'yaml';
      case 'sql':
        return 'sql';
      default:
        return 'plaintext';
    }
  };

  // Render file tree node recursively
  const renderTreeNode = (node: TreeNode, depth: number = 0) => {
    const isFolder = node.type === 'tree';
    const isExpanded = !!expandedFolders[node.path];
    const isSelected = selectedFilePath === node.path;

    return (
      <div key={node.path} className="select-none">
        <div
          onClick={() => {
            if (isFolder) {
              toggleFolder(node.path);
            } else if (activeRepo) {
              openFile(activeRepo, node.path);
            }
          }}
          style={{ paddingLeft: `${depth * 14 + 10}px` }}
          className={`flex items-center justify-between py-1.5 pr-2 rounded-lg cursor-pointer text-xs font-mono transition-colors group ${
            isSelected
              ? 'bg-[#D4FF00]/15 text-[#D4FF00] font-bold'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <div className="flex items-center gap-2 truncate">
            {isFolder ? (
              <>
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                )}
                {isExpanded ? (
                  <FolderOpen className="w-3.5 h-3.5 text-[#D4FF00] shrink-0" />
                ) : (
                  <Folder className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                )}
              </>
            ) : (
              <>
                <span className="w-3.5" />
                <FileCode className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-[#D4FF00]' : 'text-gray-400'}`} />
              </>
            )}
            <span className="truncate">{node.name}</span>
          </div>

          {!isFolder && node.size !== undefined && (
            <span className="text-[10px] text-gray-500 font-sans opacity-0 group-hover:opacity-100">
              {node.size > 1024 ? `${(node.size / 1024).toFixed(1)} KB` : `${node.size} B`}
            </span>
          )}
        </div>

        {isFolder && isExpanded && node.children && (
          <div>
            {node.children.map((child) => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  // Render Readme HTML safely with marked
  const renderedReadmeHtml = useMemo(() => {
    if (!readme || !readme.content) return '';
    try {
      return marked.parse(readme.content, { async: false }) as string;
    } catch {
      return `<pre class="p-4">${readme.content}</pre>`;
    }
  }, [readme]);

  // Calculate languages percentage
  const languageStats = useMemo(() => {
    const total = Object.values(languages).reduce((a, b) => a + b, 0);
    if (total === 0) return [];
    return Object.entries(languages).map(([lang, bytes]) => ({
      lang,
      bytes,
      percentage: ((bytes / total) * 100).toFixed(1),
      color: languageColors[lang] || '#A855F7',
    }));
  }, [languages]);

  return (
    <div className="space-y-7 max-w-7xl mx-auto pb-24 animate-fadeIn">
      {/* ========================================================================= */}
      {/* 🌟 1. Profile & Portfolio Showcase Header */}
      {/* ========================================================================= */}
      <div className="relative overflow-hidden rounded-[32px] bg-white dark:bg-[#12151B] border border-black/[0.07] dark:border-white/[0.08] p-6 sm:p-8 backdrop-blur-xl shadow-[0_15px_35px_rgba(0,0,0,0.06)]">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4FF00]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          {/* User Info */}
          <div className="flex items-center gap-5">
            <div className="relative group">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-[#D4FF00]/40 shadow-[0_0_25px_rgba(212,255,0,0.3)] group-hover:scale-105 transition-transform bg-[#181B22] flex items-center justify-center">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt={user.login} className="w-full h-full object-cover" />
                ) : (
                  <FolderGit2 className="w-8 h-8 text-[#D4FF00]" />
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-black flex items-center justify-center" title="GitHub Connected">
                <Check className="w-3 h-3 text-black stroke-[3]" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#D4FF00] text-black">
                  PORTFOLIO ARCHIVE
                </span>
                <span className="text-xs text-gray-500 font-mono">
                  GitHub Cloud Repositories
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white flex items-center gap-2 tracking-tight">
                {user?.name || 'Zakarya Oukil'}
                <span className="text-sm font-mono text-gray-500 font-normal">(@{user?.login || 'oukil078-oss'})</span>
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-xl">
                {user?.bio || 'Fullstack Architect & Cybersecurity Researcher. Exploring offensive security, AI multi-agents, and modern interactive web systems.'}
              </p>
            </div>
          </div>

          {/* Header Action Buttons & Stats */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.08] px-4 py-2.5 rounded-2xl text-xs font-mono">
              <span className="text-gray-500">Repositories:</span>
              <span className="font-bold text-[#D4FF00]">{repos.length}</span>
              <span className="text-gray-400">({repos.filter(r => !r.private).length} pub / {repos.filter(r => r.private).length} priv)</span>
            </div>

            <button
              onClick={() => {
                setIsRefreshing(true);
                fetchGitHubData();
              }}
              disabled={isRefreshing}
              className="p-2.5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.08] text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Refresh Repositories"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#D4FF00]' : ''}`} />
            </button>

            <button
              onClick={() => setIsTokenModalOpen(true)}
              className="px-3.5 py-2.5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.08] text-xs font-mono font-bold text-gray-300 hover:text-white flex items-center gap-2 hover:bg-white/10 transition-colors"
              title="Configure GitHub API Key"
            >
              <Key className="w-3.5 h-3.5 text-[#D4FF00]" />
              <span>Token Config</span>
            </button>

            {user?.html_url && (
              <a
                href={user.html_url}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2.5 rounded-2xl bg-[#D4FF00] text-black font-bold text-xs flex items-center gap-1.5 shadow-[0_0_20px_rgba(212,255,0,0.25)] hover:bg-[#C6F500] hover:scale-105 transition-all"
              >
                <span>View on GitHub</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🌟 2. Token Settings Modal */}
      {/* ========================================================================= */}
      {isTokenModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="bg-[#12151B] border border-white/10 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-[#D4FF00]" />
                <h3 className="font-bold text-white text-base">GitHub API Authentication</h3>
              </div>
              <button
                onClick={() => setIsTokenModalOpen(false)}
                className="text-gray-400 hover:text-white text-xs font-mono"
              >
                ✕ Close
              </button>
            </div>

            <p className="text-xs text-gray-400">
              Provide your GitHub Personal Access Token (PAT) with <code className="text-[#D4FF00]">repo</code> and <code className="text-[#D4FF00]">read:user</code> scopes to access public and private repositories without rate limits.
            </p>

            <div className="space-y-2">
              <input
                type="password"
                placeholder="ghp_************************************"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                className="w-full bg-[#181B22] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white font-mono placeholder:text-gray-600 focus:outline-none focus:border-[#D4FF00]"
              />
              <div className="text-[11px] text-gray-500 font-mono">
                Current active token: <span className="text-emerald-400 font-bold">Configured in Zak_OS (.env)</span>
              </div>
            </div>

            {tokenSavedSuccess && (
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono flex items-center gap-2">
                <Check className="w-4 h-4" />
                Token successfully verified and updated!
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsTokenModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (tokenInput.trim()) {
                    await api.updateGitHubToken(tokenInput.trim());
                    setTokenSavedSuccess(true);
                    setTimeout(() => {
                      setTokenSavedSuccess(false);
                      setIsTokenModalOpen(false);
                      fetchGitHubData();
                    }, 1200);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-[#D4FF00] text-black font-bold text-xs hover:bg-[#C6F500]"
              >
                Save & Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🌟 3. MAIN CONTENT: Active Repo Workspace OR Repositories Browser */}
      {/* ========================================================================= */}
      {activeRepo ? (
        /* ------------------------------------------------------------- */
        /* 🔬 DEEP-DIVE REPOSITORY WORKSPACE & IDE VIEW                  */
        /* ------------------------------------------------------------- */
        <div className="space-y-6">
          {/* Top Bar with Back Button, Repo Title & Actions */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-white dark:bg-[#12151B] p-5 rounded-[28px] border border-black/[0.07] dark:border-white/[0.08] shadow-sm">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveRepo(null)}
                className="p-2.5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.08] text-gray-400 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1.5 font-bold text-xs"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>All Projects</span>
              </button>

              <div className="h-6 w-[1px] bg-white/10" />

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-extrabold text-gray-900 dark:text-white flex items-center gap-1.5">
                    <FolderGit2 className="w-4 h-4 text-[#D4FF00]" />
                    {activeRepo.name}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    activeRepo.private
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {activeRepo.private ? 'Private' : 'Public'}
                  </span>
                </div>
                {activeRepo.description && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate max-w-xl">
                    {activeRepo.description}
                  </p>
                )}
              </div>
            </div>

            {/* Branch Selector & Clone Buttons */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Branch Selector */}
              <div className="flex items-center gap-1.5 bg-[#181B22] border border-white/10 px-3 py-1.5 rounded-xl text-xs font-mono">
                <GitBranch className="w-3.5 h-3.5 text-[#D4FF00]" />
                <select
                  value={selectedBranch}
                  onChange={(e) => handleBranchChange(e.target.value)}
                  className="bg-transparent text-gray-200 focus:outline-none cursor-pointer pr-2"
                >
                  {branches.length > 0 ? (
                    branches.map((b) => (
                      <option key={b.name} value={b.name} className="bg-[#181B22] text-white">
                        {b.name}
                      </option>
                    ))
                  ) : (
                    <option value={activeRepo.default_branch || 'main'} className="bg-[#181B22] text-white">
                      {activeRepo.default_branch || 'main'}
                    </option>
                  )}
                </select>
              </div>

              {/* Copy HTTPS Clone URL */}
              <button
                onClick={() => handleCopy(activeRepo.clone_url, 'https')}
                className="px-3 py-1.5 rounded-xl bg-[#181B22] border border-white/10 text-xs font-mono text-gray-300 hover:text-white flex items-center gap-1.5 hover:bg-white/5 transition-colors"
                title="Copy HTTPS Clone URL"
              >
                {copiedCloneType === 'https' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied HTTPS</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-gray-400" />
                    <span>Clone HTTPS</span>
                  </>
                )}
              </button>

              {/* Copy SSH Clone URL */}
              <button
                onClick={() => handleCopy(activeRepo.ssh_url, 'ssh')}
                className="px-3 py-1.5 rounded-xl bg-[#181B22] border border-white/10 text-xs font-mono text-gray-300 hover:text-white flex items-center gap-1.5 hover:bg-white/5 transition-colors"
                title="Copy SSH Clone URL"
              >
                {copiedCloneType === 'ssh' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied SSH</span>
                  </>
                ) : (
                  <>
                    <Terminal className="w-3.5 h-3.5 text-gray-400" />
                    <span>SSH</span>
                  </>
                )}
              </button>

              {/* External GitHub Link */}
              <a
                href={activeRepo.html_url}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl bg-[#181B22] border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                title="Open repository in GitHub"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Sub-Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-black/[0.07] dark:border-white/[0.08] pb-2">
            {[
              { id: 'code', label: 'Code & IDE View', icon: Code, count: fileTree.length },
              { id: 'readme', label: 'README.md', icon: File, count: readme ? 'Available' : undefined },
              { id: 'commits', label: 'Commits', icon: GitCommit, count: commits.length },
              { id: 'contributors', label: 'Contributors', icon: Users, count: contributors.length },
              { id: 'languages', label: 'Tech Stack', icon: Layers, count: Object.keys(languages).length },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold font-mono transition-all ${
                    isActive
                      ? 'bg-[#D4FF00] text-black shadow-[0_0_15px_rgba(212,255,0,0.3)]'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isActive ? 'bg-black/20 text-black' : 'bg-white/10 text-gray-400'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab 1: Code & Monaco IDE View */}
          {activeTab === 'code' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-[720px] rounded-3xl overflow-hidden border border-black/[0.07] dark:border-white/[0.08] bg-[#0E1117] shadow-xl">
              {/* Left Column: File Tree Explorer (4 cols) */}
              <div className="lg:col-span-4 border-r border-white/10 flex flex-col h-full bg-[#12151B]">
                <div className="p-3.5 border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-300 font-mono">
                    <FolderTree className="w-4 h-4 text-[#D4FF00]" />
                    <span>EXPLORER</span>
                    <span className="text-[10px] text-gray-500 font-normal">({fileTree.length} files)</span>
                  </div>
                  <span className="text-[10px] font-mono text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">
                    {selectedBranch}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto p-2 no-scrollbar space-y-0.5">
                  {isLoadingTree ? (
                    <div className="flex flex-col items-center justify-center h-48 text-gray-500 gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin text-[#D4FF00]" />
                      <span className="text-xs font-mono">Fetching repository tree...</span>
                    </div>
                  ) : hierarchicalTree.length > 0 ? (
                    hierarchicalTree.map((node) => renderTreeNode(node))
                  ) : (
                    <div className="text-xs text-gray-500 text-center py-10">No files found in branch.</div>
                  )}
                </div>
              </div>

              {/* Right Column: Monaco IDE Code Viewer (8 cols) */}
              <div className="lg:col-span-8 flex flex-col h-full bg-[#0B0D10]">
                {/* File Header Bar */}
                <div className="p-3.5 border-b border-white/10 flex items-center justify-between bg-[#12151B]/80 backdrop-blur-md">
                  <div className="flex items-center gap-2 truncate">
                    <FileCode className="w-4 h-4 text-[#D4FF00] shrink-0" />
                    <span className="text-xs font-mono font-bold text-white truncate">
                      {selectedFilePath || 'Select a file to inspect'}
                    </span>
                    {fileDetail && (
                      <span className="text-[10px] font-mono text-gray-400 bg-white/5 px-2 py-0.5 rounded-full shrink-0">
                        {fileDetail.size > 1024 ? `${(fileDetail.size / 1024).toFixed(1)} KB` : `${fileDetail.size} B`}
                      </span>
                    )}
                  </div>

                  {fileDetail && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleCopy(fileDetail.content, 'code')}
                        className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-mono flex items-center gap-1.5 transition-colors"
                        title="Copy file content"
                      >
                        {copiedCloneType === 'code' ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400 text-[11px]">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-gray-400" />
                            <span className="text-[11px]">Copy Code</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => setIsRawView(!isRawView)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors ${
                          isRawView ? 'bg-[#D4FF00] text-black font-bold' : 'bg-white/5 hover:bg-white/10 text-gray-300'
                        }`}
                      >
                        Raw
                      </button>

                      {fileDetail.download_url && (
                        <a
                          href={fileDetail.download_url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                          title="Download Raw File"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {/* File Content / Monaco Editor */}
                <div className="flex-1 relative overflow-hidden">
                  {isLoadingFile ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-3">
                      <RefreshCw className="w-6 h-6 animate-spin text-[#D4FF00]" />
                      <span className="text-xs font-mono">Loading file contents from GitHub...</span>
                    </div>
                  ) : fileDetail ? (
                    isRawView ? (
                      <pre className="p-4 text-xs font-mono text-gray-300 overflow-auto h-full whitespace-pre-wrap">
                        {fileDetail.content}
                      </pre>
                    ) : (
                      <MonacoEditor
                        height="100%"
                        language={getEditorLanguage(fileDetail.path)}
                        value={fileDetail.content}
                        theme={theme === 'dark' ? 'vs-dark' : 'light'}
                        options={{
                          readOnly: true,
                          minimap: { enabled: true },
                          fontSize: 13,
                          lineNumbers: 'on',
                          scrollBeyondLastLine: false,
                          automaticLayout: true,
                          fontFamily: 'JetBrains Mono, Fira Code, monospace',
                          padding: { top: 12 },
                        }}
                      />
                    )
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8 text-center space-y-3">
                      <Code className="w-12 h-12 text-gray-600" />
                      <p className="text-sm font-mono text-gray-400">Click any file in the Explorer on the left to preview it inside the formatted Monaco IDE.</p>
                      <span className="text-xs font-mono text-[#D4FF00]">Full syntax highlighting & minimap enabled</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: README Preview */}
          {activeTab === 'readme' && (
            <div className="bg-white dark:bg-[#12151B] border border-black/[0.07] dark:border-white/[0.08] rounded-3xl p-8 shadow-sm">
              <div className="flex items-center justify-between border-b border-black/[0.07] dark:border-white/[0.08] pb-4 mb-6">
                <div className="flex items-center gap-2">
                  <File className="w-5 h-5 text-[#D4FF00]" />
                  <h3 className="font-bold text-gray-900 dark:text-white font-mono text-sm">
                    {readme?.name || 'README.md'}
                  </h3>
                </div>
                <span className="text-xs font-mono text-gray-500">Rendered GitHub Markdown</span>
              </div>

              {readme?.content ? (
                <div
                  className="prose dark:prose-invert max-w-none text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: renderedReadmeHtml }}
                />
              ) : (
                <div className="py-16 text-center text-gray-500 font-mono text-xs">
                  No README.md found in this repository.
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Commits Timeline */}
          {activeTab === 'commits' && (
            <div className="bg-white dark:bg-[#12151B] border border-black/[0.07] dark:border-white/[0.08] rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-black/[0.07] dark:border-white/[0.08] pb-4">
                <div className="flex items-center gap-2">
                  <GitCommit className="w-5 h-5 text-[#D4FF00]" />
                  <h3 className="font-bold text-gray-900 dark:text-white font-mono text-sm">
                    Commit History ({commits.length} recent commits)
                  </h3>
                </div>
                <span className="text-xs font-mono text-gray-500">Branch: {selectedBranch}</span>
              </div>

              <div className="space-y-3">
                {commits.map((c) => (
                  <div
                    key={c.sha}
                    className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-[#D4FF00]/40 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      {c.author?.avatar_url ? (
                        <img src={c.author.avatar_url} alt="author" className="w-8 h-8 rounded-full border border-white/10" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-mono">
                          {c.commit.author.name[0]}
                        </div>
                      )}
                      <div>
                        <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white leading-snug">
                          {c.commit.message.split('\n')[0]}
                        </p>
                        <div className="flex items-center gap-2 text-[11px] font-mono text-gray-500 mt-1">
                          <span className="text-gray-400 font-bold">{c.commit.author.name}</span>
                          <span>•</span>
                          <span>{new Date(c.commit.author.date).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <span className="text-[11px] font-mono text-[#D4FF00] bg-[#D4FF00]/10 px-2.5 py-1 rounded-lg">
                        {c.sha.slice(0, 7)}
                      </span>
                      <a
                        href={c.html_url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 4: Contributors */}
          {activeTab === 'contributors' && (
            <div className="bg-white dark:bg-[#12151B] border border-black/[0.07] dark:border-white/[0.08] rounded-3xl p-6 shadow-sm space-y-5">
              <div className="flex items-center gap-2 border-b border-black/[0.07] dark:border-white/[0.08] pb-4">
                <Users className="w-5 h-5 text-[#D4FF00]" />
                <h3 className="font-bold text-gray-900 dark:text-white font-mono text-sm">
                  Project Contributors ({contributors.length})
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {contributors.map((contrib) => (
                  <div
                    key={contrib.id}
                    className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <img src={contrib.avatar_url} alt={contrib.login} className="w-10 h-10 rounded-full border border-white/10" />
                      <div>
                        <span className="text-xs font-bold text-gray-900 dark:text-white block">
                          @{contrib.login}
                        </span>
                        <span className="text-[11px] font-mono text-[#D4FF00]">
                          {contrib.contributions} {contrib.contributions === 1 ? 'commit' : 'commits'}
                        </span>
                      </div>
                    </div>

                    <a
                      href={contrib.html_url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 5: Tech Stack & Languages */}
          {activeTab === 'languages' && (
            <div className="bg-white dark:bg-[#12151B] border border-black/[0.07] dark:border-white/[0.08] rounded-3xl p-6 shadow-sm space-y-6">
              <div className="flex items-center gap-2 border-b border-black/[0.07] dark:border-white/[0.08] pb-4">
                <Layers className="w-5 h-5 text-[#D4FF00]" />
                <h3 className="font-bold text-gray-900 dark:text-white font-mono text-sm">
                  Language & Code Distribution
                </h3>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-4 rounded-full overflow-hidden flex bg-white/5 border border-white/10">
                {languageStats.map((item) => (
                  <div
                    key={item.lang}
                    style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                    title={`${item.lang}: ${item.percentage}%`}
                    className="h-full transition-all"
                  />
                ))}
              </div>

              {/* Legend */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {languageStats.map((item) => (
                  <div key={item.lang} className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06] space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-xs font-bold text-gray-900 dark:text-white font-mono">
                        {item.lang}
                      </span>
                    </div>
                    <div className="text-xs font-mono text-gray-500">
                      {item.percentage}% ({item.bytes > 1024 ? `${(item.bytes / 1024).toFixed(1)} KB` : `${item.bytes} B`})
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ------------------------------------------------------------- */
        /* 📦 REPOSITORIES DIRECTORY & SEARCH HUB                        */
        /* ------------------------------------------------------------- */
        <div className="space-y-6">
          {/* Controls Bar: Search, Language Filter, Visibility, Sort, View Toggle */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white dark:bg-[#12151B] p-4 sm:p-5 rounded-[28px] border border-black/[0.07] dark:border-white/[0.08] shadow-sm">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects by name, language, or description..."
                className="w-full bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl pl-11 pr-4 py-2.5 text-xs text-gray-900 dark:text-white placeholder:text-gray-500 focus:outline-none focus:border-[#D4FF00]"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Visibility Filter */}
              <div className="flex items-center p-1 bg-black/[0.03] dark:bg-white/[0.05] rounded-2xl border border-black/[0.06] dark:border-white/[0.08] text-xs font-mono">
                {(['all', 'public', 'private'] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setVisibilityFilter(v)}
                    className={`px-3 py-1.5 rounded-xl capitalize transition-all ${
                      visibilityFilter === v
                        ? 'bg-[#D4FF00] text-black font-bold'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>

              {/* Language Dropdown */}
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl px-3 py-2 text-xs font-mono text-gray-300 focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-[#12151B]">All Languages</option>
                {availableLanguages.map((lang) => (
                  <option key={lang} value={lang} className="bg-[#12151B]">
                    {lang}
                  </option>
                ))}
              </select>

              {/* Sort By Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl px-3 py-2 text-xs font-mono text-gray-300 focus:outline-none cursor-pointer"
              >
                <option value="updated" className="bg-[#12151B]">Recently Updated</option>
                <option value="stars" className="bg-[#12151B]">Most Stars</option>
                <option value="name" className="bg-[#12151B]">Alphabetical</option>
              </select>

              {/* View Toggle (Grid / List) */}
              <div className="flex items-center p-1 bg-black/[0.03] dark:bg-white/[0.05] rounded-2xl border border-black/[0.06] dark:border-white/[0.08]">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-xl ${viewMode === 'grid' ? 'bg-[#D4FF00] text-black' : 'text-gray-400'}`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-xl ${viewMode === 'list' ? 'bg-[#D4FF00] text-black' : 'text-gray-400'}`}
                  title="List View"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Repositories Cards Grid */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <RefreshCw className="w-8 h-8 animate-spin text-[#D4FF00]" />
              <p className="text-xs font-mono text-gray-400">Loading GitHub cloud repositories...</p>
            </div>
          ) : filteredRepos.length > 0 ? (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5' : 'space-y-3'}>
              {filteredRepos.map((repo) => (
                <div
                  key={repo.id}
                  onClick={() => loadRepoDetails(repo)}
                  className="group relative rounded-3xl bg-white dark:bg-[#12151B] border border-black/[0.07] dark:border-white/[0.08] p-6 hover:border-[#D4FF00]/50 transition-all duration-300 shadow-[0_10px_25px_rgba(0,0,0,0.03)] hover:shadow-[0_15px_30px_rgba(212,255,0,0.08)] cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    {/* Top Row: Icon, Title, Visibility */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-[#D4FF00]/10 flex items-center justify-center text-[#D4FF00] group-hover:scale-110 transition-transform">
                          <FolderGit2 className="w-4 h-4" />
                        </div>
                        <h3 className="font-extrabold text-sm sm:text-base text-gray-900 dark:text-white group-hover:text-[#D4FF00] transition-colors truncate max-w-[180px] sm:max-w-[200px]">
                          {repo.name}
                        </h3>
                      </div>

                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold shrink-0 ${
                        repo.private
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {repo.private ? 'Private' : 'Public'}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-4 leading-relaxed">
                      {repo.description || 'No description provided for this repository.'}
                    </p>

                    {/* Topics / Tags */}
                    {repo.topics && repo.topics.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {repo.topics.slice(0, 3).map((topic) => (
                          <span key={topic} className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/5 text-gray-400">
                            #{topic}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Bottom Row: Language, Metrics, Action Button */}
                  <div className="pt-4 border-t border-black/[0.05] dark:border-white/[0.06] flex items-center justify-between text-xs font-mono text-gray-500">
                    <div className="flex items-center gap-3">
                      {repo.language && (
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: languageColors[repo.language] || '#D4FF00' }}
                          />
                          <span className="text-gray-300 font-bold">{repo.language}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-1 text-gray-400">
                        <Star className="w-3.5 h-3.5" />
                        <span>{repo.stargazers_count}</span>
                      </div>

                      <div className="flex items-center gap-1 text-gray-400">
                        <GitFork className="w-3.5 h-3.5" />
                        <span>{repo.forks_count}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-[#D4FF00] text-xs font-bold group-hover:translate-x-1 transition-transform">
                      <span>Inspect</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center text-gray-500 font-mono text-xs">
              No repositories matched your filters.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
