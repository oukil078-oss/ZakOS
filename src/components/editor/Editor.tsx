import React, { useState, useEffect, useRef } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { marked } from 'marked';
import mermaid from 'mermaid';
import katex from 'katex';
import { 
  Save, 
  Trash2, 
  Plus, 
  ExternalLink, 
  FolderTree, 
  FileText, 
  Eye, 
  Code, 
  Check, 
  Sparkles, 
  Layers, 
  Tag, 
  Hash, 
  ShieldAlert, 
  Terminal,
  Columns,
  Search,
  BookOpen
} from 'lucide-react';
import { NoteItem } from '../../types';

// Configure Mermaid
mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  themeVariables: {
    darkMode: true,
    background: '#070A13',
    primaryColor: '#00F0FF',
    primaryTextColor: '#E2E8F0',
    primaryBorderColor: '#00F0FF',
    lineColor: '#00F0FF',
    secondaryColor: '#A855F7',
    tertiaryColor: '#10B981',
  },
});

interface EditorProps {
  notes: NoteItem[];
  selectedNotePath: string | null;
  onSelectNotePath: (path: string) => void;
  onSaveNote: (path: string, content: string, frontmatter?: Record<string, any>) => Promise<void>;
  onDeleteNote: (path: string) => Promise<void>;
}

export const Editor: React.FC<EditorProps> = ({
  notes,
  selectedNotePath,
  onSelectNotePath,
  onSaveNote,
  onDeleteNote,
}) => {
  const [currentNote, setCurrentNote] = useState<NoteItem | null>(null);
  const [markdownContent, setMarkdownContent] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');
  const [activePane, setActivePane] = useState<'split' | 'edit' | 'preview'>('split');
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const previewRef = useRef<HTMLDivElement>(null);

  // New Note Modal
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteBranch, setNewNoteBranch] = useState('01 Certifications');
  const [newNoteCategory, setNewNoteCategory] = useState('cybersecurity');

  // Load selected note
  useEffect(() => {
    if (!selectedNotePath && notes.length > 0) {
      // Default to Master Root if available, or first note
      const masterRoot = notes.find((n) => n.tier === 0 || n.title.includes('Master Root'));
      const target = masterRoot || notes[0];
      onSelectNotePath(target.relativePath);
      return;
    }

    if (selectedNotePath) {
      const found = notes.find(
        (n) => n.relativePath === selectedNotePath || n.id === selectedNotePath.replace(/\.md$/, '')
      );
      if (found) {
        setCurrentNote(found);
        setMarkdownContent(found.content);
      }
    }
  }, [selectedNotePath, notes, onSelectNotePath]);

  // Global Ctrl+S listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentNote, markdownContent]);

  // Render Markdown with KaTeX and Mermaid
  useEffect(() => {
    if (!markdownContent) {
      setPreviewHtml('');
      return;
    }

    try {
      // 1. Preprocess KaTeX math: $$ ... $$ and $ ... $
      let processed = markdownContent.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
        try {
          return katex.renderToString(math, { displayMode: true });
        } catch (e) {
          return `<pre class="text-rose-400 font-mono">${math}</pre>`;
        }
      });

      processed = processed.replace(/\$([^\$\n]+)\$/g, (_, math) => {
        try {
          return katex.renderToString(math, { displayMode: false });
        } catch (e) {
          return `<code class="text-rose-400 font-mono">${math}</code>`;
        }
      });

      // 2. Preprocess Wikilinks: [[Target|Alias]] -> <a href="#note:Target" class="wikilink">Alias</a>
      processed = processed.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, target, alias) => {
        const displayText = alias || target;
        return `<a href="#wikilink:${encodeURIComponent(target.trim())}" class="wikilink-badge">${displayText}</a>`;
      });

      // 3. Parse Markdown using marked
      const rawHtml = marked.parse(processed, { async: false }) as string;
      setPreviewHtml(rawHtml);
    } catch (err) {
      console.error('[Editor] Error parsing markdown:', err);
    }
  }, [markdownContent]);

  // Post-render Mermaid Diagrams
  useEffect(() => {
    if (previewRef.current && (activePane === 'split' || activePane === 'preview')) {
      const mermaidElements = previewRef.current.querySelectorAll('.language-mermaid, pre code.language-mermaid');
      mermaidElements.forEach(async (el, idx) => {
        try {
          const code = el.textContent || '';
          const id = `mermaid-diagram-${idx}-${Date.now()}`;
          const { svg } = await mermaid.render(id, code);
          const parent = el.closest('pre') || el;
          parent.innerHTML = svg;
        } catch (e) {
          // ignore mermaid render errors
        }
      });
    }
  }, [previewHtml, activePane]);

  // Handle Wikilink clicks inside preview
  const handlePreviewClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const link = target.closest('a');
    if (link && link.getAttribute('href')?.startsWith('#wikilink:')) {
      e.preventDefault();
      const rawTarget = decodeURIComponent(link.getAttribute('href')!.replace('#wikilink:', ''));
      // Find matching note
      const found = notes.find(
        (n) => n.title === rawTarget || n.id === rawTarget || n.relativePath.includes(rawTarget)
      );
      if (found) {
        onSelectNotePath(found.relativePath);
      }
    }
  };

  const handleSave = async () => {
    if (!currentNote) return;
    setIsSaving(true);
    try {
      await onSaveNote(currentNote.relativePath, markdownContent, currentNote.frontmatter);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error('[Editor] Save failed:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!currentNote) return;
    if (window.confirm(`Are you sure you want to delete "${currentNote.title}" from disk?`)) {
      await onDeleteNote(currentNote.relativePath);
    }
  };

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteTitle.trim()) return;

    const relPath = `${newNoteBranch}/${newNoteTitle.trim()}.md`;
    const initialContent = `
# ${newNoteTitle.trim()}
**⬆️ Parent:** [[🏛 Zakarya Oukil — Master Root]]

---

## 🎯 Executive Overview
Enter tactical notes, code, or command references here...
`;

    const frontmatter = {
      title: newNoteTitle.trim(),
      type: 'leaf',
      category: newNoteCategory,
      tier: 4,
      status: 'active',
      tags: [newNoteCategory, 'recon'],
      created: new Date().toISOString().split('T')[0],
      updated: new Date().toISOString().split('T')[0],
      parent: '[[🏛 Zakarya Oukil — Master Root]]',
    };

    await onSaveNote(relPath, initialContent.trim(), frontmatter);
    setIsNewModalOpen(false);
    setNewNoteTitle('');
    onSelectNotePath(relPath);
  };

  // Filter notes in file explorer sidebar
  const filteredNotesList = notes.filter((n) => {
    if (!filterQuery.trim()) return true;
    const q = filterQuery.toLowerCase();
    return (
      n.title.toLowerCase().includes(q) ||
      n.relativePath.toLowerCase().includes(q) ||
      n.tags.some((t) => t.toLowerCase().includes(q))
    );
  });

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left Vault File Tree Navigation Rail */}
      <div className="w-64 bg-space-900 border-r border-cyan-500/20 flex flex-col shrink-0 select-none">
        {/* Explorer Header */}
        <div className="p-3 border-b border-cyan-500/20 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FolderTree className="w-4 h-4 text-cyan-400" />
            <span className="font-display font-bold text-xs text-white">
              VAULT EXPLORER
            </span>
          </div>
          <button
            onClick={() => setIsNewModalOpen(true)}
            className="p-1 rounded bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/40 text-xs flex items-center gap-1 font-mono"
            title="Create New Note"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>NEW</span>
          </button>
        </div>

        {/* Filter input */}
        <div className="p-2 border-b border-slate-800">
          <div className="relative">
            <Search className="w-3 h-3 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Filter 115 notes..."
              className="w-full bg-space-950 border border-slate-800 rounded px-7 py-1 text-[11px] font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-400"
            />
          </div>
        </div>

        {/* Notes Scroll List */}
        <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5 font-mono text-xs">
          {filteredNotesList.map((note) => {
            const isSelected = currentNote?.id === note.id || selectedNotePath === note.relativePath;

            return (
              <button
                key={note.id}
                onClick={() => onSelectNotePath(note.relativePath)}
                className={`w-full flex items-center space-x-2 px-2.5 py-1.5 rounded text-left transition-all group ${
                  isSelected
                    ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:bg-space-800/80 hover:text-slate-200 border border-transparent'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: note.branchColor }}
                />
                <span className="truncate text-[11px] font-medium flex-1">
                  {note.title}
                </span>
                <span className="text-[9px] px-1 py-0.2 rounded bg-space-950 text-slate-500">
                  T{note.tier}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Studio Work Area */}
      <div className="flex-1 flex flex-col overflow-hidden bg-space-950">
        {currentNote ? (
          <>
            {/* Top Toolbar */}
            <div className="h-12 border-b border-cyan-500/20 bg-space-900/90 px-4 flex items-center justify-between shrink-0 font-mono text-xs">
              <div className="flex items-center space-x-3 min-w-0 pr-2">
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: currentNote.branchColor }}
                />
                <h2 className="font-bold text-slate-100 truncate text-sm">
                  {currentNote.title}
                </h2>
                <span className="hidden md:inline text-[10px] text-slate-400">
                  [{currentNote.relativePath}]
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 shrink-0">
                {/* Pane Switcher */}
                <div className="hidden sm:flex items-center space-x-1 bg-space-950 p-0.5 rounded border border-slate-800">
                  <button
                    onClick={() => setActivePane('edit')}
                    className={`px-2 py-1 rounded text-[10px] ${
                      activePane === 'edit' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400'
                    }`}
                  >
                    CODE
                  </button>
                  <button
                    onClick={() => setActivePane('split')}
                    className={`px-2 py-1 rounded text-[10px] ${
                      activePane === 'split' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400'
                    }`}
                  >
                    SPLIT
                  </button>
                  <button
                    onClick={() => setActivePane('preview')}
                    className={`px-2 py-1 rounded text-[10px] ${
                      activePane === 'preview' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400'
                    }`}
                  >
                    PREVIEW
                  </button>
                </div>

                {/* Save Button */}
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition ${
                    saveSuccess
                      ? 'bg-emerald-500 text-black shadow-glow-green'
                      : 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-glow-cyan'
                  }`}
                >
                  {saveSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>SYNCED</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>{isSaving ? 'SAVING...' : 'SAVE (Ctrl+S)'}</span>
                    </>
                  )}
                </button>

                {/* Delete Note */}
                <button
                  onClick={handleDelete}
                  className="p-1.5 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-transparent hover:border-rose-500/30"
                  title="Delete Note"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Frontmatter Interactive Badges */}
            <div className="bg-space-900/60 border-b border-slate-800 px-4 py-2 flex flex-wrap items-center gap-2 text-xs font-mono">
              <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-cyan-400" /> FRONTMATTER:
              </span>
              <span className="px-2 py-0.5 rounded bg-space-950 text-cyan-300 border border-cyan-500/30 text-[10px]">
                Tier: {currentNote.tier}
              </span>
              <span className="px-2 py-0.5 rounded bg-space-950 text-emerald-300 border border-emerald-500/30 text-[10px]">
                Category: {currentNote.category}
              </span>
              <span className="px-2 py-0.5 rounded bg-space-950 text-purple-300 border border-purple-500/30 text-[10px]">
                Status: {currentNote.status}
              </span>
              {currentNote.tags.map((t) => (
                <span key={t} className="px-1.5 py-0.5 rounded bg-space-850 text-slate-400 border border-slate-700 text-[10px]">
                  #{t}
                </span>
              ))}
              {currentNote.backlinks.length > 0 && (
                <span className="ml-auto text-[10px] text-cyan-400 font-semibold">
                  🔗 {currentNote.backlinks.length} Backlinks
                </span>
              )}
            </div>

            {/* Editor & Preview Split Panes */}
            <div className="flex-1 flex overflow-hidden">
              {/* Left: Monaco Editor Pane */}
              {(activePane === 'edit' || activePane === 'split') && (
                <div className={`${activePane === 'split' ? 'w-1/2' : 'w-full'} h-full border-r border-slate-800 overflow-hidden`}>
                  <MonacoEditor
                    height="100%"
                    language="markdown"
                    theme="vs-dark"
                    value={markdownContent}
                    onChange={(val) => setMarkdownContent(val || '')}
                    options={{
                      fontSize: 13,
                      fontFamily: '"Fira Code", "JetBrains Mono", Consolas, monospace',
                      minimap: { enabled: false },
                      wordWrap: 'on',
                      lineNumbers: 'on',
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      padding: { top: 12, bottom: 12 },
                    }}
                  />
                </div>
              )}

              {/* Right: Live HUD Markdown Preview Pane */}
              {(activePane === 'preview' || activePane === 'split') && (
                <div
                  ref={previewRef}
                  onClick={handlePreviewClick}
                  className={`${activePane === 'split' ? 'w-1/2' : 'w-full'} h-full overflow-y-auto p-6 bg-space-950 text-slate-200 prose prose-invert max-w-none prose-headings:font-display prose-headings:text-cyan-300 prose-a:text-cyan-400 prose-code:text-emerald-300 prose-code:bg-space-900 prose-pre:bg-space-900 prose-pre:border prose-pre:border-slate-800`}
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500 font-mono space-y-3">
            <BookOpen className="w-12 h-12 text-slate-700 animate-pulse" />
            <h3 className="text-base text-slate-300 font-display">NO NOTE SELECTED</h3>
            <p className="text-xs max-w-md text-slate-500">
              Select a markdown file from the Vault Explorer on the left or use <kbd className="px-1.5 py-0.5 rounded bg-space-900 text-cyan-400 border border-cyan-500/30">Ctrl+K</kbd> to search.
            </p>
          </div>
        )}
      </div>

      {/* New Note Creation Modal */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-space-900 border border-cyan-500/40 rounded-xl p-6 shadow-glass-glow space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-cyan-400" />
                <h2 className="font-display font-bold text-base text-white">
                  CREATE NEW VAULT NOTE
                </h2>
              </div>
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNote} className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-slate-400 mb-1">NOTE TITLE</label>
                <input
                  type="text"
                  required
                  value={newNoteTitle}
                  onChange={(e) => setNewNoteTitle(e.target.value)}
                  placeholder="e.g. Active Directory Kerberoasting Attack"
                  className="w-full bg-space-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">TARGET BRANCH / FOLDER</label>
                <select
                  value={newNoteBranch}
                  onChange={(e) => setNewNoteBranch(e.target.value)}
                  className="w-full bg-space-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-cyan-400"
                >
                  <option value="01 Certifications/EJPT Certification/Notes">01 Certifications / Notes</option>
                  <option value="01 Certifications/EJPT Certification/Commands">01 Certifications / Commands</option>
                  <option value="01 Certifications/EJPT Certification/Labs">01 Certifications / Labs</option>
                  <option value="02 Coding Projects/Python">02 Coding Projects / Python</option>
                  <option value="02 Coding Projects/AI Agents">02 Coding Projects / AI Agents</option>
                  <option value="03 AI OS — Agentic System/Agents">03 AI OS / Agents</option>
                  <option value="04 Knowledge Base/Concepts">04 Knowledge Base / Concepts</option>
                  <option value="04 Knowledge Base/Tools">04 Knowledge Base / Tools</option>
                  <option value="05 Templates">05 Templates</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">CATEGORY</label>
                <input
                  type="text"
                  value={newNoteCategory}
                  onChange={(e) => setNewNoteCategory(e.target.value)}
                  placeholder="cybersecurity, networking, python, ai-os"
                  className="w-full bg-space-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-space-800 text-slate-300 hover:bg-space-700"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold shadow-glow-cyan"
                >
                  CREATE & OPEN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
