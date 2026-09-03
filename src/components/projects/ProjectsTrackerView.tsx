import React, { useState } from 'react';
import { 
  FolderKanban, 
  Plus, 
  Search, 
  Filter, 
  ExternalLink, 
  Code2, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  Layers, 
  Tag, 
  Flame, 
  ArrowUpRight,
  Sliders,
  LayoutGrid,
  List,
  Folder,
  FolderOpen,
  Check,
  Calendar,
  SlidersHorizontal,
  Flame as FlameIcon,
  FolderGit2
} from 'lucide-react';
import { DetailedProjectItem, ProjectInfo } from '../../types';
import FolderProjectCard from './FolderProjectCard';
import ProjectDetailWorkspace from './ProjectDetailWorkspace';

interface ProjectsTrackerViewProps {
  projects?: any[];
  availableProjects?: ProjectInfo[];
  onOpenProjectInIde: (project: ProjectInfo | string) => void;
  onOpenNote: (path: string) => void;
  onAddWorkspaceFolder?: () => void;
  onOpenGitHub?: () => void;
}

const INITIAL_DETAILED_PROJECTS: DetailedProjectItem[] = [
  {
    id: 'proj-ejpt',
    title: 'eJPTv2 Certification Path & Lab Mastery',
    category: 'Cybersecurity',
    clientOrOrg: 'INE Security / eLearnSecurity',
    status: 'in-progress',
    progress: 88,
    dueDate: '28.09.2026',
    themeColor: 'lime',
    tags: ['eJPTv2', 'INE', 'Metasploit', 'Nmap', 'PrivEsc', 'Pivoting'],
    sourceNote: '01 Certifications/EJPT Certification/EJPT — Root Overview.md',
    description: 'Complete hands-on offensive penetration testing curriculum: Assessment Methodology, Host & Network Auditing, Web Application Pentesting, and Exploitation.',
    tasks: [
      {
        id: 't-ejpt-1',
        projectId: 'proj-ejpt',
        title: 'Nmap & Network Discovery Automation',
        description: 'Perform full TCP SYN port scan and NSE vulnerability audits across subnet targets.',
        status: 'completed',
        priority: 'high',
        dueDate: '15.08.2026',
        assignee: { name: 'Zakarya Oukil', role: 'Security Researcher' },
        notes: `### Nmap Fast Scanning Methodology
- Ran \`nmap -sS -T4 -p- 10.10.10.50\`
- Discovered open ports: 21 (vsftpd), 22 (OpenSSH), 80 (Apache), 445 (Samba).
- Ran default NSE scripts: \`nmap -sC -sV -p 21,22,80,445 10.10.10.50\`.`,
        imageLayout: 'horizontal',
        attachments: [
          {
            id: 'att-1',
            type: 'link',
            url: 'https://nmap.org/book/man.html',
            title: 'Official Nmap Reference Manual',
            description: 'Core NSE flag documentation'
          },
          {
            id: 'att-2',
            type: 'image',
            url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=800&auto=format&fit=crop',
            title: 'Nmap Scan Terminal Output',
            description: 'Initial network sweep'
          }
        ]
      },
      {
        id: 't-ejpt-2',
        projectId: 'proj-ejpt',
        title: 'Web Application Fuzzing & SQLi Exploitation',
        description: 'Fuzz administrative directories with Gobuster and extract database tables using SQLMap.',
        status: 'completed',
        priority: 'high',
        dueDate: '20.08.2026',
        assignee: { name: 'Zakarya Oukil', role: 'Security Researcher' },
        notes: `### SQLi Verification
- Tested login parameter \`admin' or 1=1--\`
- SQLMap command: \`sqlmap -u "http://10.10.10.50/login.php" --data="user=admin&pass=1" --dbs\`
- Dumped \`users\` table credentials successfully.`,
        imageLayout: 'horizontal',
        attachments: [
          {
            id: 'att-3',
            type: 'video',
            url: 'https://www.youtube.com/watch?v=2e_Zz32w7hU',
            title: 'Web Exploitation Walkthrough Video',
            description: 'Directory fuzzing and SQLMap tutorial'
          },
          {
            id: 'att-4',
            type: 'link',
            url: 'https://portswigger.net/web-security/sql-injection',
            title: 'PortSwigger SQL Injection Academy',
            description: 'Theory and practice lab guide'
          }
        ]
      },
      {
        id: 't-ejpt-3',
        projectId: 'proj-ejpt',
        title: 'Linux Privilege Escalation & SUID Binaries',
        description: 'Inspect cron jobs, sudo permissions (\`sudo -l\`), and SUID binaries against GTFOBins.',
        status: 'in-progress',
        priority: 'urgent',
        dueDate: '05.09.2026',
        assignee: { name: 'Zakarya Oukil', role: 'Security Researcher' },
        notes: `### LinPEAS findings
- SUID binary identified: \`/usr/bin/find\`
- Exploit: \`find . -exec /bin/sh -p \\; -quit\`
- Yields root shell immediately.`,
        imageLayout: 'vertical',
        attachments: [
          {
            id: 'att-5',
            type: 'link',
            url: 'https://gtfobins.github.io/',
            title: 'GTFOBins Unix Privilege Escalation',
            description: 'Curated list of Unix binaries to bypass local security'
          },
          {
            id: 'att-6',
            type: 'image',
            url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=800&auto=format&fit=crop',
            title: 'Root Shell Confirmation',
            description: 'whoami -> root'
          }
        ]
      },
      {
        id: 't-ejpt-4',
        projectId: 'proj-ejpt',
        title: 'Windows Token Privileges & Lateral Movement',
        description: 'Audit SeImpersonatePrivilege and configure Chisel reverse SOCKS5 tunneling for internal pivot.',
        status: 'planning',
        priority: 'medium',
        dueDate: '15.09.2026',
        assignee: { name: 'Zakarya Oukil', role: 'Security Researcher' },
        notes: 'Prepare Chisel binary transfer and verify proxychains configuration.',
        attachments: []
      }
    ]
  },
  {
    id: 'proj-zakos',
    title: 'Zak_OS — Jarvis Multi-Agent AI Web Operating System',
    category: 'Web Dev / AI',
    clientOrOrg: 'Zakarya Oukil Architecture',
    status: 'in-progress',
    progress: 92,
    dueDate: '10.09.2026',
    themeColor: 'blue',
    tags: ['React', 'TypeScript', 'Tailwind', 'WebGL', 'ThreeJS', 'Ollama'],
    sourceNote: '02 Coding Projects/Zak_OS/Zak_OS Architecture.md',
    description: 'Futuristic Lumin Neo-Bento command center with real-time 3D living galaxy second brain, WebGL liquid glass dock, and Ollama agent fleet.',
    tasks: [
      {
        id: 't-zk-1',
        projectId: 'proj-zakos',
        title: 'WebGL Liquid Glass Header Refraction',
        description: 'Implement ray displacement, Snell refraction, and Poisson blur on floating capsule dock.',
        status: 'completed',
        priority: 'urgent',
        assignee: { name: 'Zakarya Oukil', role: 'Lead Architect' },
        notes: 'Full screen shader with sdRoundedRect and Poisson sampling complete.',
        attachments: []
      },
      {
        id: 't-zk-2',
        projectId: 'proj-zakos',
        title: 'Interactive 3D Galaxy Cosmic Second Brain',
        description: 'HTML5 Canvas and WebGL particle system visualizing Obsidian vault hierarchy and wikilinks.',
        status: 'completed',
        priority: 'high',
        assignee: { name: 'Zakarya Oukil', role: 'Lead Architect' },
        notes: 'Interactive orbits, zoom, pan, and live node inspector linked.',
        attachments: []
      },
      {
        id: 't-zk-3',
        projectId: 'proj-zakos',
        title: 'Folder Card System & Media Notebook Workspace',
        description: 'Build asymmetric folder card silhouette with Kanban board and multimedia task notebook.',
        status: 'in-progress',
        priority: 'urgent',
        assignee: { name: 'Zakarya Oukil', role: 'Lead Architect' },
        notes: 'Includes video player, web previewer, and horizontal/vertical image gallery.',
        attachments: []
      }
    ]
  },
  {
    id: 'proj-recon-scanner',
    title: 'Python Async Network & Port Scanner',
    category: 'Security Tools',
    clientOrOrg: 'Open Source Tooling',
    status: 'in-progress',
    progress: 75,
    dueDate: '20.09.2026',
    themeColor: 'red',
    tags: ['Python', 'Asyncio', 'Raw Sockets', 'Banner Grabbing'],
    description: 'High-speed asynchronous banner grabber and TCP SYN scanner utilizing asyncio and raw sockets.',
    tasks: [
      {
        id: 't-rec-1',
        projectId: 'proj-recon-scanner',
        title: 'Async TCP SYN Packet Crafter',
        description: 'Build raw IP packet generator with Scapy and socket fallback.',
        status: 'completed',
        priority: 'high',
        attachments: []
      },
      {
        id: 't-rec-2',
        projectId: 'proj-recon-scanner',
        title: 'Multi-Threaded Banner Inspection',
        description: 'Parse HTTP, FTP, SSH, and SMTP banners with regex signature engine.',
        status: 'in-progress',
        priority: 'medium',
        attachments: []
      }
    ]
  },
  {
    id: 'proj-agents-crew',
    title: 'Autonomous Multi-Agent Crew Engine',
    category: 'Artificial Intelligence',
    clientOrOrg: 'Jarvis Intelligence Fleet',
    status: 'completed',
    progress: 100,
    dueDate: '25.08.2026',
    themeColor: 'lime',
    tags: ['AI Agents', 'Ollama', 'Gemini', 'SSE Streaming', 'Hierarchy'],
    description: 'Hierarchical prompt dispatcher coordinating 6 specialized local and cloud agents (Spectre, Architect, Oracle, Socrates, Synthesis, Chronos).',
    tasks: [
      {
        id: 't-ag-1',
        projectId: 'proj-agents-crew',
        title: 'Big Boss Prompt Dispatcher Architecture',
        description: 'Analyze user intent and rewrite optimized specialized prompts.',
        status: 'completed',
        priority: 'urgent',
        attachments: []
      },
      {
        id: 't-ag-2',
        projectId: 'proj-agents-crew',
        title: 'Ollama Local Streaming & Gemini Cloud Fallback',
        description: 'Robust dual-engine streaming pipeline with live token output.',
        status: 'completed',
        priority: 'high',
        attachments: []
      }
    ]
  }
];

export const ProjectsTrackerView: React.FC<ProjectsTrackerViewProps> = ({
  projects: propProjects,
  availableProjects,
  onOpenProjectInIde,
  onOpenNote,
  onAddWorkspaceFolder,
  onOpenGitHub,
}) => {
  const [projectList, setProjectList] = useState<DetailedProjectItem[]>(INITIAL_DETAILED_PROJECTS);
  const [activeProject, setActiveProject] = useState<DetailedProjectItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Cybersecurity');
  const [newClient, setNewClient] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDueDate, setNewDueDate] = useState('');

  const filterChips = ['All', '🔥 Hot Focus', 'Due Soon', 'Completed', 'Cybersecurity', 'AI & Tools'];

  const totalAllTasks = projectList.reduce((acc, p) => acc + p.tasks.length, 0);

  const filteredProjects = projectList.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    let matchesFilter = true;
    if (selectedFilter === '🔥 Hot Focus') {
      matchesFilter = p.status === 'in-progress';
    } else if (selectedFilter === 'Completed') {
      matchesFilter = p.status === 'completed';
    } else if (selectedFilter === 'Cybersecurity') {
      matchesFilter = p.category === 'Cybersecurity';
    } else if (selectedFilter === 'AI & Tools') {
      matchesFilter = p.category.includes('AI') || p.category.includes('Tools');
    }

    return matchesSearch && matchesFilter;
  });

  const handleUpdateProject = (updated: DetailedProjectItem) => {
    setProjectList((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    if (activeProject && activeProject.id === updated.id) {
      setActiveProject(updated);
    }
  };

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newProj: DetailedProjectItem = {
      id: `proj-${Date.now()}`,
      title: newTitle.trim(),
      category: newCategory,
      clientOrOrg: newClient.trim() || 'Zakarya Oukil',
      description: newDesc.trim(),
      dueDate: newDueDate.trim() || '2026-10-01',
      status: 'planning',
      progress: 0,
      tags: [newCategory],
      tasks: [],
    };

    setProjectList((prev) => [newProj, ...prev]);
    setIsAddModalOpen(false);
    setNewTitle('');
    setNewDesc('');
    setNewClient('');
  };

  // If a project folder is opened, render the ProjectDetailWorkspace!
  if (activeProject) {
    return (
      <ProjectDetailWorkspace
        project={activeProject}
        onBack={() => setActiveProject(null)}
        onUpdateProject={handleUpdateProject}
        onOpenNote={onOpenNote}
      />
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20 animate-fadeIn">
      {/* 🌟 1. Top Schedule Pill Header (Matching Reference Design Image 1) */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-white dark:bg-[#12151B] p-4 sm:p-5 rounded-[32px] border border-black/[0.07] dark:border-white/[0.08] shadow-sm">
        {/* Left Schedule Capsule */}
        <div className="flex items-center gap-3 bg-black dark:bg-[#181B22] text-white px-5 py-3 rounded-full">
          <span className="text-xs sm:text-sm font-black tracking-wider uppercase">Your Schedule</span>
          <div className="flex items-center gap-1.5 text-xs text-gray-400 font-mono border-l border-white/20 pl-3">
            <Calendar className="w-3.5 h-3.5 text-[#D4FF00]" />
            <span>28 August</span>
          </div>
        </div>

        {/* Right Active Timeline Indicator Bar */}
        <div className="flex-1 flex items-center justify-between gap-3 bg-[#D4FF00] text-black px-6 py-3 rounded-full font-bold text-xs shadow-[0_0_20px_rgba(212,255,0,0.25)]">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-black animate-ping" />
            <span className="font-extrabold uppercase">Live Sprint</span>
          </div>
          <span className="font-mono text-xs">{totalAllTasks} Active Tasks in Folders</span>
          <div className="flex items-center gap-1 text-[11px] font-mono bg-black/10 px-3 py-1 rounded-full">
            <span>2:00 PM</span>
          </div>
        </div>
      </div>

      {/* 🌟 2. Main Workspace Title Bar & Filter Chips (Matching Reference Design Image 1 & 2) */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 bg-white dark:bg-[#12151B] border border-black/[0.07] dark:border-white/[0.08] p-7 rounded-[32px] backdrop-blur-xl shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-3 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-[#D4FF00] text-black">
              WORKSPACE FOLDERS
            </span>
            <span className="text-xs text-gray-500 font-mono">
              {projectList.length} Active Project Vaults • {totalAllTasks} Tasks
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
            WORKSPACE
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            Real physical folder cards with tucked document sheets. Click any folder to inspect its Kanban workflow and multimedia task notebook.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {onOpenGitHub && (
            <button
              onClick={onOpenGitHub}
              className="px-5 py-3 bg-[#D4FF00]/10 border border-[#D4FF00]/30 hover:bg-[#D4FF00]/20 text-gray-900 dark:text-[#D4FF00] font-extrabold text-xs rounded-full flex items-center gap-2 transition-all hover:scale-105"
            >
              <FolderGit2 className="w-4 h-4 text-[#D4FF00]" />
              <span>GitHub Cloud Hub</span>
            </button>
          )}

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black font-extrabold text-xs rounded-full flex items-center gap-2 shadow-lg transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4 stroke-[3] text-[#D4FF00]" />
            <span>+ New Task / Folder</span>
          </button>
        </div>
      </div>

      {/* 🌟 3. Search & Filter Bar (Matching Reference Design) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search folders, tasks, certs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 text-xs bg-white dark:bg-[#12151B] border border-black/[0.08] dark:border-white/[0.08] rounded-full text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-[#D4FF00] shadow-sm"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 w-full sm:w-auto">
          {filterChips.map((chip) => (
            <button
              key={chip}
              onClick={() => setSelectedFilter(chip)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                selectedFilter === chip
                  ? 'bg-black dark:bg-white text-white dark:text-black shadow-md'
                  : 'bg-white dark:bg-[#12151B] border border-black/[0.06] dark:border-white/[0.08] text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white'
              }`}
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {/* 🌟 4. Real 3D Physical Folders Grid (Matching Image 3 with Tucked Paper Sheets) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
        {filteredProjects.map((project, idx) => {
          const variants: ('lime' | 'blue' | 'red' | 'dark')[] = ['lime', 'blue', 'red', 'dark'];
          const variant = (project.themeColor as any) || variants[idx % variants.length];

          return (
            <FolderProjectCard
              key={project.id}
              project={project}
              variant={variant}
              onOpenProject={(p) => setActiveProject(p)}
              onOpenNote={onOpenNote}
            />
          );
        })}
      </div>

      {/* Create New Folder Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
          <div className="bg-white dark:bg-[#181B22] border border-black/[0.08] dark:border-white/[0.08] p-7 rounded-3xl max-w-lg w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#D4FF00]" />
              Create New Physical Folder
            </h3>
            <form onSubmit={handleCreateProject} className="space-y-3.5">
              <div>
                <label className="block text-xs font-mono text-gray-500 mb-1">Folder Title</label>
                <input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  placeholder="e.g. eJPT Exam Red Team Arsenal"
                  className="w-full px-3.5 py-2.5 text-xs bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.08] rounded-xl text-gray-900 dark:text-white focus:outline-none focus:border-[#D4FF00]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-gray-500 mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.08] rounded-xl text-gray-900 dark:text-white focus:outline-none focus:border-[#D4FF00]"
                  >
                    <option value="Cybersecurity">Cybersecurity</option>
                    <option value="Web Dev / AI">Web Dev / AI</option>
                    <option value="Security Tools">Security Tools</option>
                    <option value="Artificial Intelligence">Artificial Intelligence</option>
                    <option value="Systems">Systems</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-mono text-gray-500 mb-1">Client / Org</label>
                  <input
                    value={newClient}
                    onChange={(e) => setNewClient(e.target.value)}
                    placeholder="INE, Personal..."
                    className="w-full px-3 py-2.5 text-xs bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.08] rounded-xl text-gray-900 dark:text-white focus:outline-none focus:border-[#D4FF00]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-gray-500 mb-1">Description</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  rows={3}
                  placeholder="Key milestones, objectives, roadmap..."
                  className="w-full px-3.5 py-2 text-xs bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.08] rounded-xl text-gray-900 dark:text-white focus:outline-none focus:border-[#D4FF00]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs rounded-xl bg-black/[0.05] dark:bg-white/[0.05] text-gray-600 dark:text-gray-400 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs rounded-xl bg-[#D4FF00] text-black font-extrabold hover:scale-105 transition-transform"
                >
                  Create Folder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsTrackerView;
