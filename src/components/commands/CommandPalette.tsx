import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Terminal, 
  FileText, 
  Share2, 
  Bot, 
  PlusCircle, 
  X, 
  ArrowRight, 
  Folder, 
  Tag, 
  Sparkles,
  Command as CommandIcon,
  ShieldAlert
} from 'lucide-react';
import { NoteItem, CommandItem } from '../../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  notes: NoteItem[];
  commands: CommandItem[];
  onSelectNote: (note: NoteItem) => void;
  onSelectCommand: (command: CommandItem) => void;
  onSelectTab: (tab: string) => void;
  onQuickDailyNote: () => void;
  onSelectAgent: (agentId: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  notes,
  commands,
  onSelectNote,
  onSelectCommand,
  onSelectTab,
  onQuickDailyNote,
  onSelectAgent,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Open handled by parent or state
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Filter notes
  const filteredNotes = query.trim()
    ? notes.filter((n) => {
        const q = query.toLowerCase();
        return (
          n.title.toLowerCase().includes(q) ||
          n.relativePath.toLowerCase().includes(q) ||
          n.tags.some((t) => t.toLowerCase().includes(q)) ||
          n.category.toLowerCase().includes(q)
        );
      }).slice(0, 8)
    : notes.slice(0, 5);

  // Filter commands
  const filteredCommands = query.trim()
    ? commands.filter((c) => {
        const q = query.toLowerCase();
        return (
          c.title.toLowerCase().includes(q) ||
          c.command.toLowerCase().includes(q) ||
          c.tool.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q)
        );
      }).slice(0, 5)
    : commands.slice(0, 4);

  // Actions list
  const quickActions = [
    {
      id: 'act-daily',
      title: 'Generate Daily Note (Today)',
      category: 'Action',
      icon: PlusCircle,
      action: () => {
        onQuickDailyNote();
        onClose();
      },
    },
    {
      id: 'act-graph',
      title: 'Open 3D Force Graph Topology',
      category: 'Navigation',
      icon: Share2,
      action: () => {
        onSelectTab('graph');
        onClose();
      },
    },
    {
      id: 'act-commands',
      title: 'Open Full Cybersecurity Command Matrix',
      category: 'Arsenal',
      icon: Terminal,
      action: () => {
        onSelectTab('commands');
        onClose();
      },
    },
    {
      id: 'act-agent-pentest',
      title: 'Deploy Pentesting Agent (SPECTRE-03)',
      category: 'AI Crew',
      icon: ShieldAlert,
      action: () => {
        onSelectAgent('pentest');
        onSelectTab('agents');
        onClose();
      },
    },
  ].filter((a) => !query.trim() || a.title.toLowerCase().includes(query.toLowerCase()));

  const totalResultsCount = filteredNotes.length + filteredCommands.length + quickActions.length;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, totalResultsCount));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + totalResultsCount) % Math.max(1, totalResultsCount));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      // Resolve selected item
      let cursor = 0;

      // Check Actions
      if (selectedIndex < quickActions.length) {
        quickActions[selectedIndex].action();
        return;
      }
      cursor += quickActions.length;

      // Check Notes
      const noteIdx = selectedIndex - cursor;
      if (noteIdx >= 0 && noteIdx < filteredNotes.length) {
        onSelectNote(filteredNotes[noteIdx]);
        onClose();
        return;
      }
      cursor += filteredNotes.length;

      // Check Commands
      const cmdIdx = selectedIndex - cursor;
      if (cmdIdx >= 0 && cmdIdx < filteredCommands.length) {
        onSelectCommand(filteredCommands[cmdIdx]);
        onClose();
        return;
      }
    }
  };

  let globalIndexCounter = 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-150">
      <div 
        className="w-full max-w-2xl bg-space-900 border border-cyan-500/30 rounded-xl shadow-glass-glow overflow-hidden flex flex-col max-h-[75vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-cyan-500/20 bg-space-850">
          <Search className="w-5 h-5 text-cyan-400 mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command, search 115 vault notes, or query tools..."
            className="w-full bg-transparent text-slate-100 placeholder-slate-500 text-sm focus:outline-none font-mono"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded hover:bg-space-750 text-slate-400 hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block ml-3 px-2 py-0.5 rounded text-[10px] font-mono bg-space-950 text-cyan-400 border border-cyan-500/30">
            ESC
          </kbd>
        </div>

        {/* Results Stream */}
        <div className="overflow-y-auto p-2 space-y-4 text-xs font-mono">
          {/* Section: Quick Actions */}
          {quickActions.length > 0 && (
            <div>
              <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>QUICK PROTOCOLS</span>
              </div>
              <div className="space-y-1 mt-1">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  const itemIndex = globalIndexCounter++;
                  const isSelected = selectedIndex === itemIndex;

                  return (
                    <button
                      key={action.id}
                      onClick={action.action}
                      onMouseEnter={() => setSelectedIndex(itemIndex)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
                        isSelected
                          ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-200 shadow-sm'
                          : 'hover:bg-space-800 text-slate-300 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <Icon className="w-4 h-4 text-amber-400" />
                        <span className="font-medium">{action.title}</span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-space-950 text-slate-400 border border-slate-700">
                        {action.category}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section: Vault Notes */}
          {filteredNotes.length > 0 && (
            <div>
              <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3 h-3 text-cyan-400" />
                <span>VAULT SECOND BRAIN NOTES ({filteredNotes.length})</span>
              </div>
              <div className="space-y-1 mt-1">
                {filteredNotes.map((note) => {
                  const itemIndex = globalIndexCounter++;
                  const isSelected = selectedIndex === itemIndex;

                  return (
                    <button
                      key={note.id}
                      onClick={() => {
                        onSelectNote(note);
                        onClose();
                      }}
                      onMouseEnter={() => setSelectedIndex(itemIndex)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
                        isSelected
                          ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-200 shadow-sm'
                          : 'hover:bg-space-800 text-slate-300 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: note.branchColor }}
                        />
                        <div className="truncate">
                          <span className="font-semibold text-slate-100">{note.title}</span>
                          <p className="text-[10px] text-slate-400 truncate flex items-center gap-1 mt-0.5">
                            <Folder className="w-2.5 h-2.5" /> {note.relativePath}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1.5 shrink-0">
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-space-950 text-cyan-300 border border-cyan-500/30">
                          Tier {note.tier}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-space-800 text-slate-400 border border-slate-700">
                          {note.category}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section: Cybersecurity Commands */}
          {filteredCommands.length > 0 && (
            <div>
              <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Terminal className="w-3 h-3 text-emerald-400" />
                <span>CYBERSECURITY & DEV COMMANDS ({filteredCommands.length})</span>
              </div>
              <div className="space-y-1 mt-1">
                {filteredCommands.map((cmd) => {
                  const itemIndex = globalIndexCounter++;
                  const isSelected = selectedIndex === itemIndex;

                  return (
                    <button
                      key={cmd.id}
                      onClick={() => {
                        onSelectCommand(cmd);
                        onClose();
                      }}
                      onMouseEnter={() => setSelectedIndex(itemIndex)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
                        isSelected
                          ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-200 shadow-sm'
                          : 'hover:bg-space-800 text-slate-300 border border-transparent'
                      }`}
                    >
                      <div className="truncate min-w-0 pr-2">
                        <div className="flex items-center space-x-2">
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            {cmd.tool.toUpperCase()}
                          </span>
                          <span className="font-semibold text-slate-100 truncate">{cmd.title}</span>
                        </div>
                        <code className="text-[10px] text-emerald-400/90 truncate block mt-0.5 font-mono">
                          {cmd.command}
                        </code>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {totalResultsCount === 0 && (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <CommandIcon className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-sm">No results found for "{query}"</p>
              <p className="text-[11px] text-slate-500 font-mono">
                Try searching for "Nmap", "eJPT", "SQLmap", "Docker", or a note title.
              </p>
            </div>
          )}
        </div>

        {/* Footer Shortcut Bar */}
        <div className="px-4 py-2 border-t border-cyan-500/20 bg-space-850 flex items-center justify-between text-[11px] font-mono text-slate-400">
          <div className="flex items-center space-x-3">
            <span>
              <kbd className="px-1 py-0.5 rounded bg-space-950 text-slate-300 border border-slate-700 text-[10px]">
                ↑↓
              </kbd>{' '}
              Navigate
            </span>
            <span>
              <kbd className="px-1 py-0.5 rounded bg-space-950 text-slate-300 border border-slate-700 text-[10px]">
                ENTER
              </kbd>{' '}
              Execute / Open
            </span>
          </div>
          <span className="text-cyan-400/70">ZAK_OS OMNI ENGINE</span>
        </div>
      </div>
    </div>
  );
};
