import React, { useState } from 'react';
import { 
  FileText, 
  Search, 
  Plus, 
  Download, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Bot, 
  Sparkles, 
  Clock, 
  Copy, 
  BookOpen,
  Filter
} from 'lucide-react';
import { marked } from 'marked';

export interface ContentDocItem {
  id: string;
  agent: string;
  agentCode: string;
  color: string;
  title: string;
  filename: string;
  modifiedAt: string;
  content: string;
}

const INITIAL_DOCS: ContentDocItem[] = [
  {
    id: '1',
    agent: 'RedTeam-Ops',
    agentCode: 'PENT',
    color: '#F26D6D',
    title: 'Microsoft IIS & WebDAV Exploitation Briefing',
    filename: '2026-09-03_webdav-triage-vector.md',
    modifiedAt: '12m ago',
    content: `# Microsoft IIS & WebDAV Exploitation Briefing

## Executive Summary
This reconnaissance briefing covers target triage against Microsoft IIS 6.0 / 7.5 instances with misconfigured WebDAV extensions.

### Exploitation Vectors
1. **HTTP Verbs Enumeration**:
   \`\`\`bash
   curl -X OPTIONS -i http://10.10.10.50/webdav
   \`\`\`
   Verify if \`PUT\`, \`MOVE\`, \`PROPFIND\` and \`COPY\` methods are accepted without authentication.

2. **File Extension Filter Bypass**:
   When \`.asp\` or \`.aspx\` execution is blocked, upload an arbitrary benign extension (e.g. \`.txt\` or \`.cer\`) then invoke \`MOVE\` to rewrite the destination.
   \`\`\`bash
   davtest -url http://10.10.10.50/webdav -cleanup
   \`\`\`

3. **Defensive Hardening**:
   - Disable WebDAV Authoring Rules in IIS Manager.
   - Restrict write permissions on webroot virtual directories.
`
  },
  {
    id: '2',
    agent: 'Architect-02',
    agentCode: 'ARCH',
    color: '#7DD3FC',
    title: 'Zak_OS Ceramic-Glass Architecture Specification',
    filename: '2026-09-03_ceramic-glass-design-tokens.md',
    modifiedAt: '42m ago',
    content: `# Zak_OS Ceramic-Glass Design Tokens & Spatial Layout

## 1. Spatial Geometry
Zak_OS employs high-refraction frosted panels, dark bento hierarchy, and cyber-lime accents:

- **Base Canvas**: \`#0B0D13\` (99% darkness with multi-gradient radial bloom)
- **Glass Panel Surface**: \`rgba(18, 21, 27, 0.75)\` with \`backdrop-filter: blur(28px)\`
- **Primary Cyber Accent**: \`#D4FF00\` (Electric Volt Lime)
- **Border Definition**: \`1px solid rgba(255, 255, 255, 0.08)\`

## 2. Component Hierarchy
\`\`\`
FloatingCapsuleDock (Sticky Top)
├── Dynamic Island Header
├── Active Viewport Router
│   ├── MissionControl (Radar + 3D Galaxy + Metrics)
│   ├── IdeWorkspace (Multi-tab Monaco + Sandbox)
│   ├── GitHubWorkspaceView (Repo Explorer)
│   └── AgentCollective (5 Subagents Fleet)
\`\`\`
`
  },
  {
    id: '3',
    agent: 'Professor-Prime',
    agentCode: 'ACAD',
    color: '#F5B544',
    title: 'Final Year Thesis: Autonomous Multi-Agent OS Framework',
    filename: '2026-09-02_thesis-capstone-methodology.md',
    modifiedAt: '3h ago',
    content: `# Academic Research Proposal: Autonomous Multi-Agent Web Operating Systems

**Candidate**: Zakarya Oukil  
**Supervision Strategy**: Professor-Prime Academic AI  

## Abstract
Modern human-computer interfaces are transitioning from static application silos to unified autonomous agentic operating systems. This thesis demonstrates an empirical architecture combining **Obsidian Local Vault** knowledge graphs, **Google Gemini 2.5/Flash** multi-model routing, and high-performance **Monaco IDE execution**.

### Research Milestones
1. **Phase 1**: Literature survey of LLM agent communication protocols and durable response memory.
2. **Phase 2**: Real-time WebSocket synchronization benchmarks between local file vaults and reactive client frontends.
3. **Phase 3**: Comprehensive defense preparation and viva deck synthesis.
`
  },
  {
    id: '4',
    agent: 'DevSecOps',
    agentCode: 'DSEC',
    color: '#5EE2B5',
    title: 'Git Push Protection & Secret Zero Policy',
    filename: '2026-09-01_secret-zero-policy.md',
    modifiedAt: '1d ago',
    content: `# DevSecOps Secret Zero Policy & Environment Isolation

## Rules of Engagement
1. **Never Commit Secrets**: All API tokens (\`GITHUB_TOKEN\`, \`GEMINI_API_KEY\`) MUST be contained exclusively within local \`.env\` files.
2. **Push Protection Compliance**: All pre-commit hooks verify that no hardcoded fallback secrets exist in source tree.
3. **Reproducibility**: Maintain \`.env.example\` with placeholder tokens for portfolio visitors.
`
  }
];

export const AgentContentLibraryView: React.FC = () => {
  const [docs, setDocs] = useState<ContentDocItem[]>(INITIAL_DOCS);
  const [selectedDocId, setSelectedDocId] = useState<string>(INITIAL_DOCS[0].id);
  const [filterAgent, setFilterAgent] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editContent, setEditContent] = useState<string>('');
  const [isNewDocModalOpen, setIsNewDocModalOpen] = useState<boolean>(false);

  // New Doc Form
  const [newTitle, setNewTitle] = useState('');
  const [newAgent, setNewAgent] = useState('Architect-02');
  const [newBody, setNewBody] = useState('# Title\n\nWrite your document here...');

  const selectedDoc = docs.find((d) => d.id === selectedDocId) || docs[0];

  const handleStartEdit = () => {
    if (!selectedDoc) return;
    setEditContent(selectedDoc.content);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (!selectedDoc) return;
    setDocs((prev) =>
      prev.map((d) =>
        d.id === selectedDoc.id
          ? { ...d, content: editContent, modifiedAt: 'Just now' }
          : d
      )
    );
    setIsEditing(false);
  };

  const handleDownload = () => {
    if (!selectedDoc) return;
    const blob = new Blob([selectedDoc.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = selectedDoc.filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleDelete = () => {
    if (!selectedDoc) return;
    if (!confirm(`Delete ${selectedDoc.title}?`)) return;
    const filtered = docs.filter((d) => d.id !== selectedDoc.id);
    setDocs(filtered);
    if (filtered.length > 0) {
      setSelectedDocId(filtered[0].id);
    }
  };

  const handleCreateNewDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const agentMeta: Record<string, { code: string; color: string }> = {
      'RedTeam-Ops': { code: 'PENT', color: '#F26D6D' },
      'Architect-02': { code: 'ARCH', color: '#7DD3FC' },
      'Professor-Prime': { code: 'ACAD', color: '#F5B544' },
      'DevSecOps': { code: 'DSEC', color: '#5EE2B5' },
      'Orchestrator-01': { code: 'ORCH', color: '#A78BFA' },
    };

    const meta = agentMeta[newAgent] || { code: 'AGENT', color: '#7DD3FC' };
    const cleanSlug = newTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const newDocItem: ContentDocItem = {
      id: `doc-${Date.now()}`,
      agent: newAgent,
      agentCode: meta.code,
      color: meta.color,
      title: newTitle.trim(),
      filename: `${new Date().toISOString().slice(0, 10)}_${cleanSlug}.md`,
      modifiedAt: 'Just now',
      content: newBody,
    };

    setDocs((prev) => [newDocItem, ...prev]);
    setSelectedDocId(newDocItem.id);
    setIsNewDocModalOpen(false);
    setNewTitle('');
    setNewBody('# Title\n\n');
  };

  const filteredDocs = docs.filter((doc) => {
    const matchFilter = filterAgent === 'all' || doc.agentCode.toLowerCase() === filterAgent.toLowerCase();
    const matchSearch = !searchQuery || doc.title.toLowerCase().includes(searchQuery.toLowerCase()) || doc.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-widest text-[#D4FF00] uppercase mb-1">
            <BookOpen className="w-4 h-4" />
            <span>AGENT OUTPUT LIBRARY</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white tracking-tight">
            Document Repository.
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            Synthesized research papers, red team briefings, architecture blueprints, and policy notes produced by your agent collective.
          </p>
        </div>

        <button
          onClick={() => setIsNewDocModalOpen(true)}
          className="px-5 py-2.5 rounded-full font-extrabold text-xs bg-black dark:bg-white text-white dark:text-black hover:scale-105 transition shadow-lg flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-[#D4FF00] stroke-[3]" />
          <span>+ New Document</span>
        </button>
      </div>

      {/* Summary Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-3xl bg-white dark:bg-[#12151B] border border-black/[0.08] dark:border-white/[0.08]">
          <span className="font-mono text-[10px] text-gray-400 uppercase font-bold">Total Documents</span>
          <div className="text-2xl font-black text-[#A78BFA] mt-1">{docs.length}</div>
          <span className="text-[10px] font-mono text-gray-400">Stored in Markdown</span>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-[#12151B] border border-black/[0.08] dark:border-white/[0.08]">
          <span className="font-mono text-[10px] text-gray-400 uppercase font-bold">Agents Publishing</span>
          <div className="text-2xl font-black text-[#7DD3FC] mt-1">4 Active</div>
          <span className="text-[10px] font-mono text-gray-400">Autonomous writing</span>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-[#12151B] border border-black/[0.08] dark:border-white/[0.08]">
          <span className="font-mono text-[10px] text-gray-400 uppercase font-bold">Latest Entry</span>
          <div className="text-base font-black text-gray-900 dark:text-white mt-1 truncate">
            {selectedDoc?.title || 'No documents'}
          </div>
          <span className="text-[10px] font-mono text-gray-400">{selectedDoc?.modifiedAt}</span>
        </div>
      </div>

      {/* Split View: Left Document List | Right Reader/Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Sidebar List (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Search and Filters */}
          <div className="p-4 rounded-3xl bg-white dark:bg-[#12151B] border border-black/[0.08] dark:border-white/[0.08] space-y-3 shadow-md">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-black/[0.04] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.06] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-[#D4FF00]"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {['all', 'PENT', 'ARCH', 'ACAD', 'DSEC'].map((code) => (
                <button
                  key={code}
                  onClick={() => setFilterAgent(code)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase transition ${
                    filterAgent === code
                      ? 'bg-black dark:bg-white text-white dark:text-black shadow-sm'
                      : 'bg-black/[0.04] dark:bg-white/[0.04] text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {code}
                </button>
              ))}
            </div>
          </div>

          {/* Docs Scroll List */}
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {filteredDocs.map((doc) => {
              const isSelected = doc.id === selectedDoc?.id;
              return (
                <div
                  key={doc.id}
                  onClick={() => {
                    setSelectedDocId(doc.id);
                    setIsEditing(false);
                  }}
                  className={`p-4 rounded-2xl cursor-pointer transition-all border ${
                    isSelected
                      ? 'bg-white dark:bg-[#1a1e27] border-[#D4FF00] shadow-md -translate-y-0.5'
                      : 'bg-white/60 dark:bg-[#12151B]/60 border-black/[0.06] dark:border-white/[0.06] hover:bg-white dark:hover:bg-[#12151B]'
                  }`}
                  style={{ borderLeftWidth: isSelected ? '4px' : '1px', borderLeftColor: isSelected ? doc.color : undefined }}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span
                      className="px-2 py-0.5 rounded text-[9px] font-mono font-extrabold uppercase tracking-wider"
                      style={{
                        background: `color-mix(in srgb, ${doc.color} 15%, transparent)`,
                        color: doc.color,
                        border: `1px solid color-mix(in srgb, ${doc.color} 30%, transparent)`,
                      }}
                    >
                      {doc.agentCode}
                    </span>
                    <span className="text-[10px] font-mono text-gray-400">{doc.modifiedAt}</span>
                  </div>
                  <h4 className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white leading-snug line-clamp-2">
                    {doc.title}
                  </h4>
                  <div className="text-[10px] font-mono text-gray-400 mt-1.5 truncate">
                    {doc.filename}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Reader / Editor (8 cols) */}
        <div className="lg:col-span-8 p-6 rounded-3xl bg-white dark:bg-[#12151B] border border-black/[0.08] dark:border-white/[0.08] shadow-xl min-h-[600px] flex flex-col justify-between">
          {selectedDoc ? (
            <div>
              {/* Document Header & Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-6 border-b border-black/[0.08] dark:border-white/[0.08]">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase"
                      style={{
                        background: `color-mix(in srgb, ${selectedDoc.color} 15%, transparent)`,
                        color: selectedDoc.color,
                      }}
                    >
                      {selectedDoc.agent}
                    </span>
                    <span className="text-xs font-mono text-gray-400">{selectedDoc.filename}</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                    {selectedDoc.title}
                  </h2>
                </div>

                {/* Toolbar Buttons */}
                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <>
                      <button
                        onClick={handleSaveEdit}
                        className="px-3 py-1.5 rounded-full text-xs font-bold font-mono uppercase bg-[#5EE2B5] text-black hover:bg-[#5EE2B5]/90 transition flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Save</span>
                      </button>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="px-3 py-1.5 rounded-full text-xs font-bold font-mono uppercase bg-black/10 dark:bg-white/10 hover:bg-black/20 text-gray-400 transition"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={handleStartEdit}
                        className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 transition"
                        title="Edit Document"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleDownload}
                        className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 transition"
                        title="Download Markdown"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleDelete}
                        className="p-2 rounded-full hover:bg-red-500/20 text-red-500 transition"
                        title="Delete Document"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Content Body: Rendered Markdown or Textarea Editor */}
              {isEditing ? (
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full h-[450px] p-4 font-mono text-xs rounded-2xl bg-black/[0.04] dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.08] text-gray-900 dark:text-white focus:outline-none focus:border-[#D4FF00] resize-y leading-relaxed"
                />
              ) : (
                <div 
                  className="prose prose-sm dark:prose-invert max-w-none text-gray-800 dark:text-gray-200 leading-relaxed font-sans"
                  dangerouslySetInnerHTML={{ __html: marked.parse(selectedDoc.content) }}
                />
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-96 text-gray-400 font-mono text-xs">
              <FileText className="w-8 h-8 mb-2 opacity-40" />
              <span>Select a document from the left list</span>
            </div>
          )}
        </div>
      </div>

      {/* New Document Modal */}
      {isNewDocModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateNewDoc}
            className="w-full max-w-lg p-6 rounded-3xl bg-white dark:bg-[#12151B] border border-black/[0.08] dark:border-white/[0.08] shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-gray-900 dark:text-white">Create New Agent Document</h3>
              <button
                type="button"
                onClick={() => setIsNewDocModalOpen(false)}
                className="p-1 rounded-full text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div>
                <label className="block text-gray-400 uppercase font-bold mb-1">Document Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Reverse Engineering Kernel Hooks"
                  className="w-full p-2.5 rounded-xl bg-black/[0.04] dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.08] text-gray-900 dark:text-white focus:outline-none focus:border-[#D4FF00]"
                />
              </div>

              <div>
                <label className="block text-gray-400 uppercase font-bold mb-1">Authoring Agent</label>
                <select
                  value={newAgent}
                  onChange={(e) => setNewAgent(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-black/[0.04] dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.08] text-gray-900 dark:text-white focus:outline-none focus:border-[#D4FF00]"
                >
                  <option value="RedTeam-Ops">RedTeam-Ops (Penetration Testing)</option>
                  <option value="Architect-02">Architect-02 (Full-Stack Systems)</option>
                  <option value="Professor-Prime">Professor-Prime (Academic Thesis)</option>
                  <option value="DevSecOps">DevSecOps (Security Automation)</option>
                  <option value="Orchestrator-01">Orchestrator-01 (General Dispatch)</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-400 uppercase font-bold mb-1">Initial Markdown</label>
                <textarea
                  rows={6}
                  value={newBody}
                  onChange={(e) => setNewBody(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-black/[0.04] dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.08] text-gray-900 dark:text-white focus:outline-none focus:border-[#D4FF00]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsNewDocModalOpen(false)}
                className="px-4 py-2 rounded-full font-mono text-xs font-bold text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-full font-mono text-xs font-extrabold bg-[#D4FF00] text-black hover:bg-[#D4FF00]/90 transition"
              >
                Create Document
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AgentContentLibraryView;
