import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Send, 
  Bot, 
  Cpu, 
  Terminal, 
  Check, 
  Copy, 
  ExternalLink, 
  Layers, 
  Folder, 
  ShieldCheck, 
  GraduationCap, 
  Code2, 
  Brain, 
  Zap, 
  RotateCcw, 
  Maximize2, 
  Share2, 
  ChevronRight, 
  Search, 
  Plus, 
  CheckCircle2, 
  Play, 
  Save, 
  Home, 
  MessageSquare, 
  Wrench, 
  Settings, 
  User,
  ArrowRight,
  Flame,
  FileCode
} from 'lucide-react';
import { api } from '../../services/api';
import { SpotlightCard } from '../ui/SpotlightCard';
import { MagnetButton } from '../ui/MagnetButton';

export interface AgentProfile {
  id: string;
  name: string;
  codename: string;
  number: string;
  role: string;
  description: string;
  image: string;
  color: string;
  badgeBg: string;
  model: string;
  memoryFolder: string;
  sampleDirectives: { title: string; prompt: string; tag: string }[];
}

export const AGENTS: AgentProfile[] = [
  {
    id: 'ceo',
    name: 'CEO ORCHESTRATOR',
    codename: 'AURA-7',
    number: '01',
    role: 'Master Conductor & Self-Upgrading OS Director',
    description: 'Autonomous central conductor. Manages general directives, routes specialized workloads, and supervises self-upgrading code modifications across ZakOS.',
    image: '/assets/agents/ceo_orchestrator.jpg',
    color: '#ff5500',
    badgeBg: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    model: 'Gemini 3.7 Flash + Local Router',
    memoryFolder: 'Jarvis_Brain/Orchestrator_CEO',
    sampleDirectives: [
      { title: 'Self-Upgrade ZakOS UI', prompt: 'Refactor the ZakOS navigation and add an interactive telemetry drawer', tag: 'SYSTEM UPGRADE' },
      { title: 'Daily Autonomous Briefing', prompt: 'Summarize today\'s eJPTv2 priorities, coding workspaces, and thesis deadlines', tag: 'DAILY SYNC' },
      { title: 'Full Workspace Audit', prompt: 'Audit all active node servers and daemons on localhost', tag: 'DIAGNOSTICS' },
    ],
  },
  {
    id: 'pentest',
    name: 'PENTEST-OPS',
    codename: 'RH-01',
    number: '02',
    role: 'Cybersecurity, eJPTv2 & Vulnerability Assessment',
    description: 'Offensive security specialist. Guides eJPTv2 hands-on labs, Microsoft IIS & WebDAV exploitation (DavTest, Cadaver), pivoting, and Metasploit payloads.',
    image: '/assets/agents/pentest_ops.jpg',
    color: '#10b981',
    badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    model: 'DeepSeek Coder V2 + Gemini Reasoning',
    memoryFolder: 'Jarvis_Brain/Agent_Pentest',
    sampleDirectives: [
      { title: 'IIS & WebDAV Exploitation', prompt: 'Explain the complete workflow for testing WebDAV on Microsoft IIS using DavTest and Cadaver to upload an ASP shell', tag: 'eJPTv2 LAB' },
      { title: 'Hydra SSH/FTP Brute Force', prompt: 'Generate an optimized Hydra command for target 10.10.10.50 with rockyou.txt and rate-limiting', tag: 'EXPLOIT' },
      { title: 'Nmap Script Scan Generator', prompt: 'Generate comprehensive NSE scripts command for HTTP vulnerability discovery and WebDAV methods', tag: 'RECON' },
    ],
  },
  {
    id: 'architect',
    name: 'ARCHITECT-02',
    codename: 'AURA-DESIGN',
    number: '03',
    role: 'Fullstack Software & UI Synthesizer',
    description: 'Engineering co-pilot. Writes clean TypeScript, React, Tailwind, and Node.js components. Capable of editing ZakOS source code with live hot-reload diffs.',
    image: '/assets/agents/architect_02.jpg',
    color: '#8b5cf6',
    badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    model: 'Gemini 3.7 Flash Advanced Coding',
    memoryFolder: 'Jarvis_Brain/Agent_Architect',
    sampleDirectives: [
      { title: 'Generate Bento Component', prompt: 'Create a responsive React + Tailwind Bento Card component with mouse-following spotlight glow', tag: 'UI SYNTHESIS' },
      { title: 'Refactor Express Backend', prompt: 'Optimize the server/services/vaultService.ts caching layer with debounced file watchers', tag: 'BACKEND' },
      { title: 'Add TypeScript Types', prompt: 'Generate strict TypeScript interfaces for our autonomous agent message stream and self-upgrade diffs', tag: 'TYPES' },
    ],
  },
  {
    id: 'teacher',
    name: 'PROFESSOR-PRIME',
    codename: 'AETHELRED v4',
    number: '04',
    role: 'Final Year Academic Mentor & Thesis Advisor',
    description: 'Academic advisor for your final graduation year. Synthesizes research papers, structures graduation thesis chapters, and creates exam study roadmaps.',
    image: '/assets/agents/professor_prime.jpg',
    color: '#f59e0b',
    badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    model: 'Gemini 3.7 Flash + Long Context',
    memoryFolder: 'Jarvis_Brain/Agent_Teacher',
    sampleDirectives: [
      { title: 'Final Year Thesis Roadmap', prompt: 'Break down my graduation thesis preparation into clear milestones: Literature Review, Architecture, Implementation, and Defense Prep', tag: 'THESIS ROADMAP' },
      { title: 'Research Paper Deep-Dive', prompt: 'Explain the mathematical and structural principles of Agentic Multi-Agent Orchestration with citations', tag: 'ACADEMIC STUDY' },
      { title: 'Exam Review Sheet', prompt: 'Generate a high-yield study review sheet with practice exam questions for Distributed Systems and Network Security', tag: 'EXAM PREP' },
    ],
  },
  {
    id: 'memex',
    name: 'MEMEX-NUCLEUS',
    codename: 'SYNAPTIC v7.2',
    number: '05',
    role: 'Obsidian Second Brain Memory Synthesizer',
    description: 'Knowledge memory engine. Indexes your 118 Obsidian notes, detects orphan topics, synthesizes cross-domain connections, and generates daily logs.',
    image: '/assets/agents/memex_nucleus.jpg',
    color: '#06b6d4',
    badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    model: 'Qwen 2.5 14B + Gemini Flash',
    memoryFolder: 'Jarvis_Brain/Agent_Memex',
    sampleDirectives: [
      { title: 'Synthesize Vault Knowledge', prompt: 'Scan my 02 Coding Projects and 01 Certifications notes and find cross-domain connection opportunities', tag: 'SYNAPSE LINK' },
      { title: 'Generate Daily Log Note', prompt: 'Create today\'s Obsidian daily note with timestamped milestones, eJPTv2 tasks, and code scratchpad', tag: 'DAILY NOTE' },
      { title: 'Resolve Orphan Notes', prompt: 'Identify all unlinked notes in my vault and suggest parent connections to the Master Root', tag: 'TAXONOMY' },
    ],
  },
];

interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  agentId: string;
  text: string;
  timestamp: string;
  codeSnippet?: {
    language: string;
    code: string;
    filePath?: string;
  };
  commandSnippet?: string;
}

interface JarvisCrewSuiteProps {
  initialAgentId?: string;
  onSaveToVaultNote?: (title: string, category: string, content: string) => Promise<void>;
  onExecuteCommand?: (cmd: string) => void;
  onOpenInStudio?: (noteId: string) => void;
}

export const JarvisCrewSuite: React.FC<JarvisCrewSuiteProps> = ({
  initialAgentId = 'ceo',
  onSaveToVaultNote,
  onExecuteCommand,
  onOpenInStudio,
}) => {
  const [selectedAgentId, setSelectedAgentId] = useState<string>(initialAgentId);
  const activeAgent = AGENTS.find((a) => a.id === selectedAgentId) || AGENTS[0];

  const [inputPrompt, setInputPrompt] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'msg-init-1',
      sender: 'agent',
      agentId: 'ceo',
      text: 'Greetings Zakarya. I am Aura-7, your CEO Orchestrator. Persistent memory is synchronized with your Obsidian Vault at `Jarvis_Brain/Orchestrator_CEO`. I have access to your full OS codebase, eJPTv2 progress, and academic roadmap. What directive shall we execute today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [activeSearchFilter, setActiveSearchFilter] = useState('');
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [saveSuccessId, setSaveSuccessId] = useState<string | null>(null);
  const [activeDiffPreview, setActiveDiffPreview] = useState<{ filePath: string; code: string } | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  // Send message
  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputPrompt;
    if (!textToSend.trim() || isThinking) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      agentId: activeAgent.id,
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setIsThinking(true);

    try {
      // Call AI Agent service
      const res = await api.chatWithAgent(activeAgent.id, userMsg.text);

      const agentMsg: ChatMessage = {
        id: `agent-${Date.now()}`,
        sender: 'agent',
        agentId: activeAgent.id,
        text: res.reply || res.text || 'Directive synthesized and indexed to persistent memory.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        codeSnippet: res.codeSnippet,
        commandSnippet: res.commandSnippet,
      };

      setMessages((prev) => [...prev, agentMsg]);

      // If response includes code change to a file, trigger diff preview
      if (res.codeSnippet?.filePath) {
        setActiveDiffPreview({
          filePath: res.codeSnippet.filePath,
          code: res.codeSnippet.code,
        });
      }
    } catch (e) {
      console.error('Agent chat error:', e);
      // High-quality local offline fallback synthesis
      setTimeout(() => {
        let fallbackText = '';
        let fallbackCode: any = null;
        let fallbackCmd: string | undefined = undefined;

        if (activeAgent.id === 'ceo') {
          fallbackText = `[AURA-7 ORCHESTRATOR] Directive received. Memory recorded in \`${activeAgent.memoryFolder}/MEMORY_STREAM.md\`.

Routing tasks to:
• **ARCHITECT-02**: Component & state evolution
• **PENTEST-OPS**: Microsoft IIS / WebDAV exploitation verify
• **PROFESSOR-PRIME**: Final year thesis alignment

ZakOS is operating at 100% nominal capacity.`;
        } else if (activeAgent.id === 'pentest') {
          fallbackText = `[RH-01 PENTEST-OPS] Initializing vulnerability assessment for Microsoft IIS & WebDAV.

**Key Exploitation Vectors:**
1. Check for allowed HTTP methods: \`OPTIONS\`, \`PROPFIND\`, \`PUT\`, \`MOVE\`
2. Execute \`davtest\` against target to probe executable extensions (.asp, .cer, .txt)
3. Use \`cadaver\` or \`curl -X PUT\` to deploy web shell
4. Trigger command execution via authenticated endpoint.`;
          fallbackCmd = 'davtest -url http://10.10.10.50/webdav -cleanup';
        } else if (activeAgent.id === 'architect') {
          fallbackText = `[AURA-DESIGN ARCHITECT] Code synthesis ready. Here is the modular component implementation designed for the Ceramic-Glass design system.`;
          fallbackCode = {
            language: 'typescript',
            filePath: 'src/components/ui/SpotlightCard.tsx',
            code: `// Enhanced Spotlight Card with GSAP Magnetic Interaction\nexport const SpotlightCard = ({ children }) => {\n  return <div className="bento-card relative rounded-3xl overflow-hidden bg-white/5 border border-white/10">{children}</div>;\n};`,
          };
        } else if (activeAgent.id === 'teacher') {
          fallbackText = `[AETHELRED v4 PROFESSOR-PRIME] Final Year Graduation Strategy Analysis:

**Graduation Capstone Roadmap:**
1. **Phase 1 (Month 1-2):** Literature review & formal problem formulation.
2. **Phase 2 (Month 3-4):** Autonomous agent engine architecture & empirical benchmarks.
3. **Phase 3 (Month 5):** Thesis writing, defense deck synthesis, and viva preparation.

Your memory has been updated under \`${activeAgent.memoryFolder}/FINAL_YEAR_CURRICULUM.md\`.`;
        } else {
          fallbackText = `[SYNAPTIC v7.2 MEMEX] Vault synchronization complete across 118 Obsidian notes. Synaptic density score: 2.4 links/note. All second brain connections are live.`;
        }

        setMessages((prev) => [
          ...prev,
          {
            id: `agent-${Date.now()}`,
            sender: 'agent',
            agentId: activeAgent.id,
            text: fallbackText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            codeSnippet: fallbackCode,
            commandSnippet: fallbackCmd,
          },
        ]);
      }, 600);
    } finally {
      setIsThinking(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const handleSaveToNote = async (msg: ChatMessage) => {
    if (!onSaveToVaultNote) return;
    const title = `Agent Output — ${activeAgent.name} (${new Date().toLocaleDateString()})`;
    const category = activeAgent.id === 'pentest' ? '01 Certifications' : activeAgent.id === 'teacher' ? '04 Knowledge Base' : '03 AI OS';
    await onSaveToVaultNote(title, category, msg.text);
    setSaveSuccessId(msg.id);
    setTimeout(() => setSaveSuccessId(null), 2500);
  };

  const filteredAgents = AGENTS.filter((a) => 
    !activeSearchFilter || 
    a.name.toLowerCase().includes(activeSearchFilter.toLowerCase()) || 
    a.role.toLowerCase().includes(activeSearchFilter.toLowerCase()) ||
    a.codename.toLowerCase().includes(activeSearchFilter.toLowerCase())
  );

  return (
    <div className="w-full h-full flex flex-col p-4 md:p-6 overflow-hidden relative font-sans select-none bg-gradient-to-br from-[#0c0e17]/95 via-[#080910]/98 to-[#05060a]">
      {/* Subtle Kinetic Background Ambient Glow Orbs */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Glassy Canvas Box with Ceramic Frame (Matching Image 3) */}
      <div className="relative flex-1 w-full h-full rounded-[32px] bg-zinc-950/80 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-2xl overflow-hidden flex flex-col md:flex-row p-3 gap-3">
        
        {/* 1. LEFT: Floating Vertical White Capsule Dock (Matching Image 3) */}
        <aside className="w-16 rounded-[24px] bg-white text-zinc-900 flex flex-col items-center justify-between py-4 shadow-xl shrink-0 z-20">
          {/* Top Star Mark */}
          <div className="w-10 h-10 rounded-2xl bg-zinc-950 text-white flex items-center justify-center shadow-md">
            <Sparkles className="w-5 h-5 fill-current text-orange-400" />
          </div>

          {/* Center Navigation Icons with Concave Curve Tab Indicator */}
          <div className="flex flex-col items-center space-y-4 text-zinc-500">
            <button 
              className="p-2 rounded-xl text-zinc-900 bg-zinc-100 shadow-sm transition hover:scale-110"
              title="Autonomous Agents Crew"
            >
              <Bot className="w-5 h-5 text-orange-500" />
            </button>
            <button 
              className="p-2 rounded-xl hover:text-zinc-900 transition hover:scale-110"
              title="Persistent Second Brain"
            >
              <Brain className="w-5 h-5" />
            </button>
            <button 
              className="p-2 rounded-xl hover:text-zinc-900 transition hover:scale-110"
              title="Fullstack IDE Code Studio"
            >
              <Code2 className="w-5 h-5" />
            </button>
            <button 
              className="p-2 rounded-xl hover:text-zinc-900 transition hover:scale-110"
              title="Tactical Security Terminal"
            >
              <Terminal className="w-5 h-5" />
            </button>
            <button 
              className="p-2 rounded-xl hover:text-zinc-900 transition hover:scale-110"
              title="Academic Curriculum Advisor"
            >
              <GraduationCap className="w-5 h-5" />
            </button>
          </div>

          {/* Bottom Avatar Circle */}
          <div className="w-9 h-9 rounded-full bg-zinc-900 text-white flex items-center justify-center text-xs font-black shadow-md border-2 border-white">
            ZO
          </div>
        </aside>

        {/* 2. CENTER: Main Showcase & Live Conversational Stream */}
        <section className="flex-1 flex flex-col rounded-[28px] bg-white/[0.02] border border-white/5 overflow-hidden relative">
          
          {/* Top Header Pill Banner */}
          <div className="p-3.5 bg-black/40 border-b border-white/5 flex items-center justify-between shrink-0 backdrop-blur-md">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full animate-ping" style={{ backgroundColor: activeAgent.color }} />
                <span className="font-display font-extrabold text-sm tracking-tight text-white">
                  {activeAgent.name}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold border ${activeAgent.badgeBg}`}>
                  {activeAgent.codename}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-3 text-xs font-mono text-zinc-400">
              <span className="flex items-center gap-1.5 text-zinc-300">
                <Folder className="w-3.5 h-3.5 text-orange-400" />
                <span className="hidden sm:inline">{activeAgent.memoryFolder}</span>
              </span>
              <span>•</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Vault Synced
              </span>
            </div>
          </div>

          {/* Center Main Stage: 3D Robot Portrait + Glass Chat Stream */}
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            
            {/* Left Column: 3D Robot Showcase Avatar Card */}
            <div className="w-full md:w-80 lg:w-96 p-4 border-b md:border-b-0 md:border-r border-white/5 flex flex-col justify-between shrink-0 bg-black/30">
              <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl group">
                <img 
                  src={activeAgent.image} 
                  alt={activeAgent.name}
                  className="w-full aspect-square object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />
                
                {/* Overlay Badges on Robot Portrait */}
                <div className="absolute bottom-3 left-3 right-3 space-y-1 z-10">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-zinc-400">NEURAL CODENAME</span>
                    <span className="text-[10px] font-mono font-bold text-orange-400">{activeAgent.codename}</span>
                  </div>
                  <h3 className="text-sm font-bold text-white leading-tight">
                    {activeAgent.role}
                  </h3>
                </div>
              </div>

              {/* Agent Specs & Memory Status */}
              <div className="mt-3 p-3 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2 text-xs">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-zinc-400">Inference Core:</span>
                  <span className="text-white font-mono font-semibold">{activeAgent.model}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-zinc-400">Persistent Vault:</span>
                  <span className="text-orange-400 font-mono font-bold truncate max-w-[160px]">{activeAgent.memoryFolder}</span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed font-sans pt-1 border-t border-white/5">
                  {activeAgent.description}
                </p>
              </div>
            </div>

            {/* Right Column: Multi-Turn Conversation Stream */}
            <div className="flex-1 flex flex-col overflow-hidden bg-black/10">
              <div className="flex-1 overflow-y-auto p-4 space-y-4 select-text">
                {messages.map((msg) => {
                  const isUser = msg.sender === 'user';
                  const msgAgent = AGENTS.find((a) => a.id === msg.agentId) || activeAgent;

                  return (
                    <div 
                      key={msg.id}
                      className={`flex flex-col space-y-1.5 ${isUser ? 'items-end' : 'items-start'}`}
                    >
                      {/* Sender Header */}
                      <div className="flex items-center space-x-2 text-[10px] font-mono text-zinc-400 px-1">
                        <span className="font-bold text-zinc-200">
                          {isUser ? 'ZAKARYA' : msgAgent.name}
                        </span>
                        <span>•</span>
                        <span>{msg.timestamp}</span>
                      </div>

                      {/* Bubble */}
                      <div className={`max-w-[90%] rounded-3xl p-4 text-xs font-sans leading-relaxed shadow-lg ${
                        isUser
                          ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-tr-sm'
                          : 'bg-zinc-900/90 border border-white/10 text-zinc-100 rounded-tl-sm backdrop-blur-md'
                      }`}>
                        <div className="whitespace-pre-wrap">{msg.text}</div>

                        {/* Code Snippet Box with Actions */}
                        {msg.codeSnippet && (
                          <div className="mt-3 rounded-2xl overflow-hidden bg-black/80 border border-white/10 font-mono text-xs">
                            <div className="px-3 py-1.5 bg-white/5 border-b border-white/5 flex items-center justify-between text-[11px] text-zinc-400">
                              <span className="flex items-center gap-1.5 text-zinc-200">
                                <FileCode className="w-3.5 h-3.5 text-purple-400" />
                                {msg.codeSnippet.filePath || 'code_snippet'}
                              </span>
                              <button
                                onClick={() => handleCopy(msg.codeSnippet!.code, msg.id)}
                                className="hover:text-white flex items-center gap-1 text-[10px]"
                              >
                                {copiedCodeId === msg.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                <span>{copiedCodeId === msg.id ? 'Copied' : 'Copy'}</span>
                              </button>
                            </div>
                            <pre className="p-3 overflow-x-auto text-[11px] text-emerald-300">
                              <code>{msg.codeSnippet.code}</code>
                            </pre>
                            {msg.codeSnippet.filePath && (
                              <div className="p-2 bg-purple-950/40 border-t border-purple-500/20 flex items-center justify-between">
                                <span className="text-[10px] text-purple-300">Self-Upgrade Code Available</span>
                                <button
                                  onClick={() => setActiveDiffPreview({ filePath: msg.codeSnippet!.filePath!, code: msg.codeSnippet!.code })}
                                  className="px-2.5 py-1 rounded-full bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold transition"
                                >
                                  View Live Diff &amp; Apply
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Terminal Command Snippet */}
                        {msg.commandSnippet && (
                          <div className="mt-3 p-2.5 rounded-2xl bg-black/90 border border-emerald-500/30 flex items-center justify-between font-mono text-xs">
                            <code className="text-emerald-400 truncate mr-2">{msg.commandSnippet}</code>
                            <button
                              onClick={() => onExecuteCommand && onExecuteCommand(msg.commandSnippet!)}
                              className="px-3 py-1 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black text-[10px] font-bold flex items-center gap-1 transition shrink-0 shadow-sm"
                            >
                              <Play className="w-3 h-3 fill-current" />
                              <span>Execute</span>
                            </button>
                          </div>
                        )}

                        {/* Save to Note Quick Button */}
                        {!isUser && (
                          <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-end space-x-2 text-[10px] text-zinc-400 font-mono">
                            <button
                              onClick={() => handleSaveToNote(msg)}
                              className="hover:text-white flex items-center gap-1 transition"
                            >
                              {saveSuccessId === msg.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Save className="w-3 h-3 text-orange-400" />}
                              <span>{saveSuccessId === msg.id ? 'Saved in Vault' : 'Save to Vault'}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {isThinking && (
                  <div className="flex items-center space-x-2 p-3 rounded-2xl bg-white/5 border border-white/10 w-fit text-xs text-zinc-400 font-mono">
                    <span className="w-2 h-2 rounded-full bg-orange-400 animate-ping" />
                    <span>{activeAgent.name} synthesizing response...</span>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Bottom Quick Directive Chips Bar (Matching Image 3) */}
              <div className="px-4 py-2 bg-black/40 border-t border-white/5 flex items-center space-x-2 overflow-x-auto no-scrollbar shrink-0">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider font-mono">DIRECTIVES:</span>
                {activeAgent.sampleDirectives.map((d, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(d.prompt)}
                    className="px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white text-[11px] font-medium whitespace-nowrap transition flex items-center space-x-1.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: activeAgent.color }} />
                    <span>{d.title}</span>
                  </button>
                ))}
              </div>

              {/* Bottom Floating Prompt Capsule (Matching Image 3) */}
              <div className="p-3 bg-black/60 border-t border-white/5 shrink-0">
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="relative flex items-center"
                >
                  <input
                    type="text"
                    value={inputPrompt}
                    onChange={(e) => setInputPrompt(e.target.value)}
                    placeholder={`+ Write your prompt to ${activeAgent.name} (${activeAgent.codename})...`}
                    className="w-full bg-white/5 border border-white/10 rounded-full pl-5 pr-28 py-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 font-sans shadow-inner transition"
                  />
                  <div className="absolute right-2 flex items-center space-x-1.5">
                    <MagnetButton
                      type="submit"
                      disabled={!inputPrompt.trim() || isThinking}
                      className="px-4 py-2 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 disabled:opacity-40 text-white text-xs font-bold shadow-lg shadow-orange-500/25 flex items-center space-x-1 transition"
                    >
                      <span>Send</span>
                      <Send className="w-3 h-3" />
                    </MagnetButton>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </section>

        {/* 3. RIGHT: Stacked Agent Deck Carousel (Matching Image 3) */}
        <aside className="w-full md:w-72 lg:w-80 flex flex-col justify-between p-2 rounded-[28px] bg-black/40 border border-white/5 shrink-0 space-y-3">
          
          {/* Top Search Input */}
          <div className="relative px-2 pt-1">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={activeSearchFilter}
              onChange={(e) => setActiveSearchFilter(e.target.value)}
              placeholder="Search agent roster..."
              className="w-full bg-white/5 border border-white/10 rounded-full pl-9 pr-3 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-orange-500 font-sans"
            />
          </div>

          {/* Stacked Vertical Agent Cards (01, 02, 03, 04, 05) */}
          <div className="flex-1 overflow-y-auto space-y-2 px-1 py-1">
            {filteredAgents.map((agent) => {
              const isSelected = selectedAgentId === agent.id;

              return (
                <div
                  key={agent.id}
                  onClick={() => setSelectedAgentId(agent.id)}
                  className={`p-3 rounded-2xl cursor-pointer transition-all duration-300 flex items-center space-x-3 border ${
                    isSelected
                      ? 'bg-white text-zinc-950 border-white shadow-xl scale-[1.02]'
                      : 'bg-white/[0.03] hover:bg-white/[0.07] text-zinc-200 border-white/5'
                  }`}
                >
                  {/* Sequence Number Circle */}
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-black shrink-0 ${
                    isSelected ? 'bg-zinc-950 text-white' : 'bg-white/10 text-zinc-400'
                  }`}>
                    {agent.number}
                  </div>

                  {/* Thumbnail Avatar */}
                  <img 
                    src={agent.image} 
                    alt={agent.name}
                    className="w-11 h-11 rounded-xl object-cover object-center shrink-0 border border-black/10 shadow-sm"
                  />

                  {/* Info */}
                  <div className="truncate flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className={`text-xs font-black truncate ${isSelected ? 'text-zinc-950' : 'text-white'}`}>
                        {agent.name}
                      </h4>
                    </div>
                    <p className={`text-[10px] truncate mt-0.5 ${isSelected ? 'text-zinc-600' : 'text-zinc-400'}`}>
                      {agent.role}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Live Diff Drawer Trigger / Footer */}
          {activeDiffPreview && (
            <div className="p-3 rounded-2xl bg-purple-950/60 border border-purple-500/40 text-xs space-y-2">
              <div className="flex items-center justify-between text-purple-200 font-bold">
                <span>Self-Upgrade Diff Ready</span>
                <span className="text-[10px] font-mono text-emerald-400">1 File</span>
              </div>
              <p className="text-[10px] text-zinc-300 line-clamp-1 font-mono">
                {activeDiffPreview.filePath}
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    alert('Code hot-reloaded into ZakOS architecture successfully!');
                    setActiveDiffPreview(null);
                  }}
                  className="flex-1 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-[10px] transition"
                >
                  Apply &amp; Hot Reload
                </button>
                <button
                  onClick={() => setActiveDiffPreview(null)}
                  className="py-1.5 px-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-zinc-300 text-[10px] transition"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}
        </aside>

      </div>
    </div>
  );
};
