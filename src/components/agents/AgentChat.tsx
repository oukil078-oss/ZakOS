import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  Search, 
  Code2, 
  ShieldAlert, 
  BookOpen, 
  FileText, 
  Copy, 
  Check, 
  Save, 
  RefreshCw,
  Zap,
  Key,
  ExternalLink,
  ShieldCheck,
  GraduationCap,
  Lock,
  User,
  Activity,
  Maximize2
} from 'lucide-react';
import { marked } from 'marked';
import { AgentProfile, ModelOption, RoutingMode } from '../../types';
import { api } from '../../services/api';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  modelUsed?: string;
}

interface AgentChatProps {
  initialAgentId?: string;
  onSaveToVaultNote: (title: string, content: string, branch: string, category: string) => void;
}

const DEFAULT_PROFILES: AgentProfile[] = [
  {
    id: 'orchestrator',
    name: 'Orchestrator-01',
    codename: 'ORCH',
    icon: 'Bot',
    color: '#A78BFA',
    role: 'Supreme Mission Commander & Task Dispatcher',
    description: 'Autonomous high-level mission planning, backlog allocation, and multi-agent coordination.',
    defaultModel: 'gemini-2.5-pro',
    fallbackLocalModel: 'qwen2.5:14b',
    systemPrompt: '',
    quickPrompts: [
      'Allocate sprint backlog tasks across our 5 specialist subagents.',
      'Review daily system telemetry and prioritize today\'s focus areas.',
      'Coordinate cross-agent workflow for our upcoming portfolio release.'
    ]
  },
  {
    id: 'pentest',
    name: 'RedTeam-Ops',
    codename: 'PENT',
    icon: 'ShieldAlert',
    color: '#F26D6D',
    role: 'Penetration Testing, IIS/WebDAV & CVE Audit Specialist',
    description: 'Offensive cybersecurity, vulnerability enumeration, network reconnaissance, and lab exploitation.',
    defaultModel: 'gemini-2.5-flash',
    fallbackLocalModel: 'deepseek-r1:8b',
    systemPrompt: '',
    quickPrompts: [
      'Audit target for Microsoft IIS 6.0/7.5 WebDAV vulnerabilities and PUT methods.',
      'Generate an aggressive Nmap reconnaissance workflow for port triage.',
      'Explain SMB Relay, Pass-the-Hash, and Active Directory Kerberoasting.'
    ]
  },
  {
    id: 'architect',
    name: 'Architect-02',
    codename: 'ARCH',
    icon: 'Code2',
    color: '#7DD3FC',
    role: 'Full-Stack Software Architecture & Monaco Systems',
    description: 'Modern React/TypeScript engineering, state management, Monaco IDE extensions, and Tailwind systems.',
    defaultModel: 'gemini-2.5-pro',
    fallbackLocalModel: 'deepseek-coder-v2:latest',
    systemPrompt: '',
    quickPrompts: [
      'Design a scalable state architecture for our live Monaco IDE workspace.',
      'Refactor this React component with high-performance hooks and memoization.',
      'Create Tailwind v4 glassmorphic tokens matching our electric-lime aesthetic.'
    ]
  },
  {
    id: 'professor',
    name: 'Professor-Prime',
    codename: 'ACAD',
    icon: 'GraduationCap',
    color: '#F5B544',
    role: 'Academic Thesis Strategist & Research Synthesis',
    description: 'Graduation capstone supervision, empirical benchmark synthesis, academic literature review, and viva defense.',
    defaultModel: 'gemini-2.5-pro',
    fallbackLocalModel: 'llama3:8b',
    systemPrompt: '',
    quickPrompts: [
      'Synthesize academic literature citations for autonomous multi-agent OS.',
      'Draft the methodology section evaluating local vs cloud LLM latency.',
      'Generate 5 rigorous viva defense questions with model answers.'
    ]
  },
  {
    id: 'devsecops',
    name: 'DevSecOps',
    codename: 'DSEC',
    icon: 'Lock',
    color: '#5EE2B5',
    role: 'Push Protection, Container Hardening & CI/CD Guard',
    description: 'Secret zero enforcement, git hygiene, Docker container hardening, and automated CI/CD pipelines.',
    defaultModel: 'gemini-2.5-flash',
    fallbackLocalModel: 'deepseek-coder-v2:latest',
    systemPrompt: '',
    quickPrompts: [
      'Audit local repository for hardcoded secrets or exposed API keys.',
      'Create a hardened Dockerfile configuration for our Express/Vite backend.',
      'Review git pre-push protection compliance and suggest CI/CD improvements.'
    ]
  }
];

export const AgentChat: React.FC<AgentChatProps> = ({
  initialAgentId = 'orchestrator',
  onSaveToVaultNote,
}) => {
  const [profiles, setProfiles] = useState<AgentProfile[]>(DEFAULT_PROFILES);
  const [models, setModels] = useState<ModelOption[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>(initialAgentId);
  const [agentModels, setAgentModels] = useState<Record<string, string>>({});
  const [routingMode, setRoutingMode] = useState<RoutingMode>('hybrid_fallback');
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [inputPrompt, setInputPrompt] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  // API Key Modal State
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [hasApiKey, setHasApiKey] = useState(false);
  const [maskedApiKey, setMaskedApiKey] = useState('');
  const [keySaveSuccess, setKeySaveSuccess] = useState(false);

  // Save Modal
  const [saveModalContent, setSaveModalContent] = useState<string | null>(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteBranch, setNoteBranch] = useState('01 Certifications/EJPT Certification/Notes');
  const [noteCategory, setNoteCategory] = useState('cybersecurity');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialAgentId) {
      setSelectedAgentId(initialAgentId);
    }
  }, [initialAgentId]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileList, modelList, keyStatus] = await Promise.all([
          api.getAgentProfiles(),
          api.getModels(),
          api.getApiKeyStatus(),
        ]);
        if (profileList && profileList.length > 0) {
          const merged = [...DEFAULT_PROFILES];
          profileList.forEach(p => {
            if (!merged.some(m => m.id === p.id)) {
              merged.push(p);
            }
          });
          setProfiles(merged);
        }
        setModels(modelList);
        setHasApiKey(keyStatus.hasKey);
        setMaskedApiKey(keyStatus.maskedKey);

        const initialMap: Record<string, string> = {};
        DEFAULT_PROFILES.forEach((p) => {
          initialMap[p.id] = p.defaultModel || 'gemini-2.5-flash';
        });
        setAgentModels(initialMap);
      } catch (e) {
        console.error('Failed to load agent configuration:', e);
      }
    };
    fetchData();
  }, []);

  const activeAgent = profiles.find((p) => p.id === selectedAgentId) || profiles[0] || DEFAULT_PROFILES[0];
  const rawModelId = agentModels[selectedAgentId] || activeAgent?.defaultModel || 'gemini-2.5-flash';
  const activeModelId =
    rawModelId === 'gemini-2.0-flash' || rawModelId === 'gemini-1.5-flash' || rawModelId === 'gemini-1.5-pro'
      ? 'gemini-2.5-flash'
      : rawModelId;

  const activeModelObj = models.find((m) => m.id === activeModelId) || models[0];

  const currentMessages = messages[selectedAgentId] || [
    {
      id: 'init',
      role: 'assistant',
      content: `### 🤖 ${activeAgent?.codename || 'ORCH'} // Systems Online & Primed
Greetings Zakarya. I am **${activeAgent?.name || 'Agent'}** — ${activeAgent?.role}.
Inference Engine: \`${activeModelObj?.name || 'Gemini 2.5 Pro'}\` • Routing: \`${routingMode}\`.

All systems, tools, and Obsidian vault integrations are active. Select an operational directive below or transmit custom instructions.`,
      timestamp: new Date().toLocaleTimeString(),
      modelUsed: activeModelObj?.name || 'Gemini 2.5 Pro',
    },
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages, isStreaming]);

  const handleModelChange = (agentId: string, modelId: string) => {
    setAgentModels((prev) => ({
      ...prev,
      [agentId]: modelId,
    }));
  };

  const handleSaveApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKeyInput.trim()) return;

    try {
      await api.saveApiKey(apiKeyInput.trim());
      setHasApiKey(true);
      setMaskedApiKey(`${apiKeyInput.slice(0, 6)}...${apiKeyInput.slice(-4)}`);
      setKeySaveSuccess(true);
      setApiKeyInput('');
      setTimeout(() => {
        setKeySaveSuccess(false);
        setIsKeyModalOpen(false);
      }, 1500);
    } catch (e) {
      console.error(e);
      alert('Failed to save API key.');
    }
  };

  const handleSend = async (customText?: string) => {
    const textToSend = (customText || inputPrompt).trim();
    if (!textToSend || isStreaming) return;

    const currentModelId = agentModels[selectedAgentId] || activeAgent?.defaultModel || 'gemini-2.5-flash';
    const currentModelName = models.find((m) => m.id === currentModelId)?.name || currentModelId;

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const assistantMsgId = `asst-${Date.now()}`;
    const initialAssistantMsg: Message = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      modelUsed: currentModelName,
    };

    setMessages((prev) => ({
      ...prev,
      [selectedAgentId]: [...(prev[selectedAgentId] || []), userMsg, initialAssistantMsg],
    }));

    setInputPrompt('');
    setIsStreaming(true);

    try {
      const history = (messages[selectedAgentId] || []).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      await api.streamAgentChat(
        selectedAgentId,
        textToSend,
        history,
        currentModelId,
        (chunk) => {
          setMessages((prev) => {
            const list = prev[selectedAgentId] || [];
            const updated = list.map((m) => {
              if (m.id === assistantMsgId) {
                return { ...m, content: m.content + chunk };
              }
              return m;
            });
            return { ...prev, [selectedAgentId]: updated };
          });
        },
        routingMode
      );
    } catch (err) {
      console.error('[AgentChat] Stream failed:', err);
    } finally {
      setIsStreaming(false);
    }
  };

  const getAgentIcon = (id: string) => {
    switch (id) {
      case 'orchestrator':
      case 'primary_brain':
        return Bot;
      case 'pentest':
        return ShieldAlert;
      case 'architect':
      case 'coding':
        return Code2;
      case 'professor':
      case 'study':
        return GraduationCap;
      case 'devsecops':
      case 'memory':
        return Lock;
      case 'research':
        return Search;
      default:
        return Bot;
    }
  };

  const handleCopyMessage = (msgId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(msgId);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const openSaveModal = (content: string) => {
    setSaveModalContent(content);
    setNoteTitle(`${activeAgent?.name || 'Agent'} Intelligence — ${new Date().toISOString().split('T')[0]}`);
  };

  const handleConfirmSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!saveModalContent || !noteTitle.trim()) return;

    onSaveToVaultNote(noteTitle, saveModalContent, noteBranch, noteCategory);
    setSaveModalContent(null);
  };

  return (
    <div className="h-[84vh] flex bg-[#0B0D10] border border-white/[0.08] rounded-3xl overflow-hidden shadow-2xl">
      {/* 🧭 LEFT COLUMN: AGENT SELECTION RAIL */}
      <div className="w-72 bg-[#12151B]/90 backdrop-blur-2xl border-r border-white/[0.08] flex flex-col justify-between shrink-0 select-none">
        <div className="flex flex-col h-full overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-white/[0.08] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#D4FF00]/15 border border-[#D4FF00]/30 flex items-center justify-center">
                <Bot className="w-4 h-4 text-[#D4FF00]" />
              </div>
              <div>
                <h3 className="font-extrabold text-xs text-white tracking-wide uppercase">
                  Jarvis Crew
                </h3>
                <span className="text-[10px] font-mono text-gray-400 block">
                  {profiles.length} Specialists Online
                </span>
              </div>
            </div>
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" title="Agents Online" />
          </div>

          {/* Agents List */}
          <div className="flex-1 overflow-y-auto p-2.5 space-y-2 font-mono text-xs">
            {profiles.map((agent) => {
              const Icon = getAgentIcon(agent.id);
              const isSelected = selectedAgentId === agent.id;

              return (
                <button
                  key={agent.id}
                  onClick={() => setSelectedAgentId(agent.id)}
                  className={`w-full p-3 rounded-2xl text-left transition-all relative group border flex items-start gap-3 ${
                    isSelected
                      ? 'bg-white/[0.08] border-[#D4FF00]/60 shadow-[0_0_20px_rgba(212,255,0,0.12)] text-white'
                      : 'bg-white/[0.02] border-white/[0.05] text-gray-400 hover:bg-white/[0.05] hover:text-white hover:border-white/10'
                  }`}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border transition-transform group-hover:scale-105"
                    style={{
                      backgroundColor: `${agent.color}18`,
                      borderColor: `${agent.color}50`,
                    }}
                  >
                    <Icon className="w-4 h-4" style={{ color: agent.color }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-xs text-white truncate">
                        {agent.name}
                      </span>
                      <span
                        className="text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider"
                        style={{
                          backgroundColor: `${agent.color}25`,
                          color: agent.color,
                        }}
                      >
                        {agent.codename || agent.id.toUpperCase().slice(0, 4)}
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-400 truncate mt-0.5">
                      {agent.role}
                    </div>
                  </div>

                  {isSelected && (
                    <span
                      className="absolute -left-[1px] top-1/2 -translate-y-1/2 w-1.5 h-6 rounded-r-full shadow-sm"
                      style={{ backgroundColor: agent.color }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Bottom API Key Status Button */}
          <div className="p-3 border-t border-white/[0.08] bg-[#0B0D10]/80 font-mono text-xs">
            <button
              onClick={() => setIsKeyModalOpen(true)}
              className={`w-full py-2.5 px-3 rounded-xl border flex items-center justify-between transition active:scale-98 ${
                hasApiKey
                  ? 'bg-[#10B981]/10 border-[#10B981]/30 text-[#10B981] hover:bg-[#10B981]/20'
                  : 'bg-[#D4FF00]/10 border-[#D4FF00]/30 text-[#D4FF00] hover:bg-[#D4FF00]/20'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <Key className="w-3.5 h-3.5 shrink-0" />
                <span className="text-[11px] font-bold truncate">
                  {hasApiKey ? `KEY: ${maskedApiKey}` : 'ENTER GEMINI KEY'}
                </span>
              </div>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-black/40 border border-white/10 uppercase font-black">
                {hasApiKey ? 'ACTIVE' : 'FREE'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 🚀 RIGHT COLUMN: ACTIVE AGENT COCKPIT */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#0B0D10]">
        {/* Cockpit Top Header */}
        <div className="h-16 border-b border-white/[0.08] bg-[#12151B]/80 backdrop-blur-xl px-5 flex items-center justify-between shrink-0 font-mono text-xs gap-3">
          <div className="flex items-center gap-3.5 min-w-0 pr-2">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border relative"
              style={{
                backgroundColor: `${activeAgent?.color}20`,
                borderColor: `${activeAgent?.color}50`,
              }}
            >
              {React.createElement(getAgentIcon(activeAgent?.id || ''), {
                className: 'w-4 h-4',
                style: { color: activeAgent?.color },
              })}
              <span
                className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full animate-ping"
                style={{ backgroundColor: activeAgent?.color }}
              />
            </div>

            <div className="truncate">
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-white text-sm tracking-wide truncate">
                  {activeAgent?.name}
                </h2>
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider"
                  style={{
                    backgroundColor: `${activeAgent?.color}20`,
                    color: activeAgent?.color,
                    border: `1px solid ${activeAgent?.color}40`,
                  }}
                >
                  {activeAgent?.codename}
                </span>
              </div>
              <p className="text-[11px] text-gray-400 truncate">
                {activeAgent?.description}
              </p>
            </div>
          </div>

          {/* Model & Router Selector Controls */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Router Mode Selector */}
            <div className="hidden lg:flex items-center bg-[#0B0D10] p-1 rounded-xl border border-white/[0.08] text-[10px]">
              <button
                onClick={() => setRoutingMode('cloud_only')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  routingMode === 'cloud_only'
                    ? 'bg-sky-500/20 text-sky-300 font-bold border border-sky-500/40 shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
                title="Cloud Only (Google Gemini)"
              >
                ☁️ Cloud
              </button>
              <button
                onClick={() => setRoutingMode('hybrid_fallback')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  routingMode === 'hybrid_fallback'
                    ? 'bg-[#D4FF00]/20 text-[#D4FF00] font-bold border border-[#D4FF00]/40 shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
                title="Hybrid (Cloud with Local Ollama Fallback)"
              >
                ⚡ Hybrid
              </button>
              <button
                onClick={() => setRoutingMode('local_only')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  routingMode === 'local_only'
                    ? 'bg-purple-500/20 text-purple-300 font-bold border border-purple-500/40 shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
                title="Local Only (Ollama Direct)"
              >
                💻 Local
              </button>
            </div>

            {/* Model Selector Dropdown */}
            <div className="flex items-center gap-1.5 bg-[#0B0D10] px-3 py-1.5 rounded-xl border border-white/[0.12] shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <select
                value={activeModelId}
                onChange={(e) => handleModelChange(selectedAgentId, e.target.value)}
                className="bg-transparent text-xs font-mono font-bold text-[#D4FF00] focus:outline-none cursor-pointer max-w-[160px] truncate"
              >
                <optgroup label="🌟 Google AI Models" className="bg-[#12151B] text-white">
                  {models
                    .filter((m) => m.provider === 'google')
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                </optgroup>
                <optgroup label="⚡ Local GPU Models (Ollama)" className="bg-[#12151B] text-white">
                  {models
                    .filter((m) => m.provider === 'ollama')
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                </optgroup>
              </select>
            </div>

            {/* Clear History Button */}
            <button
              onClick={() =>
                setMessages((prev) => ({
                  ...prev,
                  [selectedAgentId]: [],
                }))
              }
              className="p-2 rounded-xl bg-[#0B0D10] hover:bg-white/10 text-gray-400 hover:text-white border border-white/[0.08] transition"
              title="Clear Conversation History"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-5 font-mono text-xs">
          {currentMessages.map((msg) => {
            const isUser = msg.role === 'user';
            const isCopied = copiedIndex === msg.id;

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-3xl ${
                  isUser ? 'ml-auto' : 'mr-auto'
                } space-y-1.5`}
              >
                <div className="flex items-center gap-2 text-[10px] text-gray-500 px-1">
                  {isUser ? (
                    <span className="flex items-center gap-1 font-bold text-gray-300">
                      <User className="w-3 h-3 text-[#D4FF00]" /> ZAKARYA
                    </span>
                  ) : (
                    <span
                      className="font-bold flex items-center gap-1"
                      style={{ color: activeAgent?.color }}
                    >
                      <Bot className="w-3 h-3" /> {activeAgent?.codename} ({msg.modelUsed || activeModelObj?.name || 'Gemini'})
                    </span>
                  )}
                  <span>•</span>
                  <span>{msg.timestamp}</span>
                </div>

                <div
                  className={`p-5 rounded-2xl relative group max-w-full ${
                    isUser
                      ? 'bg-white/[0.07] border border-white/[0.12] text-white rounded-tr-none shadow-md'
                      : 'bg-[#12151B]/95 border border-white/[0.08] text-gray-200 rounded-tl-none shadow-xl'
                  }`}
                >
                  <div
                    className="prose prose-invert max-w-none text-xs leading-relaxed prose-headings:font-bold prose-headings:text-white prose-p:text-gray-300 prose-code:text-[#D4FF00] prose-code:bg-[#0B0D10] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-pre:bg-[#0B0D10] prose-pre:border prose-pre:border-white/10 prose-pre:rounded-xl"
                    dangerouslySetInnerHTML={{
                      __html: marked.parse(msg.content, { async: false }) as string,
                    }}
                  />

                  {/* Assistant Message Actions (Copy & Save to Obsidian Note) */}
                  {!isUser && msg.content && (
                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/[0.08] text-[11px]">
                      <button
                        onClick={() => handleCopyMessage(msg.id, msg.content)}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 transition"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
                        <span>{isCopied ? 'COPIED' : 'COPY'}</span>
                      </button>

                      <button
                        onClick={() => openSaveModal(msg.content)}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#D4FF00]/15 hover:bg-[#D4FF00]/25 text-[#D4FF00] border border-[#D4FF00]/30 transition"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>SAVE TO VAULT NOTE</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Real-time Streaming Indicator */}
          {isStreaming && (
            <div className="flex items-center gap-2.5 text-xs animate-pulse p-3 rounded-xl bg-white/[0.03] border border-white/10 max-w-md">
              <Sparkles className="w-4 h-4 animate-spin text-[#D4FF00]" />
              <span className="font-mono font-bold text-gray-300">
                {activeAgent?.codename} ({activeModelObj?.name}) STREAMING RESPONSE...
              </span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Tactical Prompt Chips */}
        {activeAgent?.quickPrompts && activeAgent.quickPrompts.length > 0 && (
          <div className="px-5 py-2.5 bg-[#12151B]/50 border-t border-white/[0.06] overflow-x-auto flex items-center gap-2 shrink-0">
            <span className="text-[10px] text-gray-500 font-bold font-mono uppercase whitespace-nowrap flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" /> DIRECTIVES:
            </span>
            {activeAgent.quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(prompt)}
                disabled={isStreaming}
                className="px-3 py-1 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-[#D4FF00]/50 hover:text-[#D4FF00] text-[11px] font-mono text-gray-300 whitespace-nowrap transition active:scale-95"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {/* Chat Input Box */}
        <div className="p-4 bg-[#12151B]/95 border-t border-white/[0.08] shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder={`Transmit instruction to ${activeAgent?.name} [${activeAgent?.codename}] via ${activeModelObj?.name}...`}
              disabled={isStreaming}
              className="flex-1 bg-[#0B0D10] border border-white/[0.12] rounded-2xl px-4 py-3 text-xs font-mono text-white placeholder-gray-500 focus:outline-none focus:border-[#D4FF00] transition"
            />
            <button
              type="submit"
              disabled={isStreaming || !inputPrompt.trim()}
              className="px-5 py-3 rounded-2xl bg-[#D4FF00] hover:bg-[#c6f500] disabled:opacity-40 text-black font-extrabold text-xs font-mono flex items-center gap-2 transition shadow-[0_0_20px_rgba(212,255,0,0.25)] active:scale-95"
            >
              <span>TRANSMIT</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>

      {/* 🔑 GOOGLE API KEY MODAL */}
      {isKeyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md bg-[#12151B] border border-white/15 rounded-3xl p-6 shadow-2xl space-y-4 font-mono text-xs text-white">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-400" />
                <h2 className="font-extrabold text-base text-white">
                  GOOGLE AI STUDIO API KEY
                </h2>
              </div>
              <button
                onClick={() => setIsKeyModalOpen(false)}
                className="text-gray-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
              <div className="flex items-center gap-2 text-[#10B981] font-bold text-[11px]">
                <ShieldCheck className="w-4 h-4" />
                <span>100% FREE TIER • NO CREDIT CARD REQUIRED</span>
              </div>
              <p className="text-gray-400 text-[11px] leading-relaxed">
                Generate an instant free API key at{' '}
                <a
                  href="https://aistudio.google.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#D4FF00] underline hover:text-[#c6f500] inline-flex items-center gap-0.5"
                >
                  aistudio.google.com <ExternalLink className="w-3 h-3" />
                </a>
                . Enables live streaming with <strong>Gemini 2.5 Pro & Flash</strong> with 1,500 free requests per day.
              </p>
            </div>

            <form onSubmit={handleSaveApiKey} className="space-y-4">
              <div>
                <label className="block text-gray-400 mb-1.5 font-bold">PASTE GOOGLE AI KEY</label>
                <input
                  type="password"
                  required
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder={hasApiKey ? `Current: ${maskedApiKey} (Enter new key to update)` : 'AIzaSy...'}
                  className="w-full bg-[#0B0D10] border border-white/15 rounded-xl p-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#D4FF00] font-mono text-xs"
                />
              </div>

              {keySaveSuccess && (
                <div className="p-2.5 rounded-xl bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40 text-center font-bold">
                  ✓ API KEY SAVED & ACTIVE!
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsKeyModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#D4FF00] hover:bg-[#c6f500] text-black font-extrabold shadow-[0_0_15px_rgba(212,255,0,0.3)]"
                >
                  SAVE & ACTIVATE
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 💾 SAVE TO OBSIDIAN VAULT NOTE MODAL */}
      {saveModalContent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-lg bg-[#12151B] border border-white/15 rounded-3xl p-6 shadow-2xl space-y-4 text-white font-mono text-xs">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Save className="w-5 h-5 text-[#D4FF00]" />
                <h2 className="font-extrabold text-base text-white">
                  SAVE AGENT INTELLIGENCE TO OBSIDIAN
                </h2>
              </div>
              <button
                onClick={() => setSaveModalContent(null)}
                className="text-gray-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmSaveNote} className="space-y-3.5">
              <div>
                <label className="block text-gray-400 mb-1 font-bold">NOTE TITLE</label>
                <input
                  type="text"
                  required
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  className="w-full bg-[#0B0D10] border border-white/15 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#D4FF00]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 mb-1 font-bold">BRANCH / DIRECTORY</label>
                  <select
                    value={noteBranch}
                    onChange={(e) => setNoteBranch(e.target.value)}
                    className="w-full bg-[#0B0D10] border border-white/15 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#D4FF00]"
                  >
                    <option value="01 Certifications/EJPT Certification/Notes">01 Certifications / Notes</option>
                    <option value="01 Certifications/EJPT Certification/Labs">01 Certifications / Labs</option>
                    <option value="02 Coding Projects/Web Dev">02 Coding Projects / Web Dev</option>
                    <option value="03 AI OS — Agentic System/Agents">03 AI OS / Agents</option>
                    <option value="04 Knowledge Base/Concepts">04 Knowledge Base / Concepts</option>
                    <option value="04 Knowledge Base/Tools">04 Knowledge Base / Tools</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 mb-1 font-bold">CATEGORY TAG</label>
                  <input
                    type="text"
                    value={noteCategory}
                    onChange={(e) => setNoteCategory(e.target.value)}
                    className="w-full bg-[#0B0D10] border border-white/15 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#D4FF00]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-400 mb-1 font-bold">CONTENT PREVIEW</label>
                <textarea
                  readOnly
                  rows={6}
                  value={saveModalContent}
                  className="w-full bg-[#0B0D10] border border-white/10 rounded-xl p-3 text-gray-300 font-mono text-[11px] focus:outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSaveModalContent(null)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#D4FF00] hover:bg-[#c6f500] text-black font-extrabold shadow-[0_0_15px_rgba(212,255,0,0.3)]"
                >
                  SAVE & SYNC NOTE
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
