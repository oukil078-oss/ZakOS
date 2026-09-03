import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  Search, 
  Code, 
  ShieldAlert, 
  BookOpen, 
  FileText, 
  Cpu, 
  Copy, 
  Check, 
  Save, 
  Plus, 
  RefreshCw,
  Terminal,
  Zap,
  Layers,
  ArrowRight,
  Key,
  ChevronDown,
  ExternalLink,
  ShieldCheck
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

export const AgentChat: React.FC<AgentChatProps> = ({
  initialAgentId = 'pentest',
  onSaveToVaultNote,
}) => {
  const [profiles, setProfiles] = useState<AgentProfile[]>([]);
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
  const [noteBranch, setNoteBranch] = useState('01 Certifications');
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
        setProfiles(profileList);
        setModels(modelList);
        setHasApiKey(keyStatus.hasKey);
        setMaskedApiKey(keyStatus.maskedKey);

        // Set default models for each agent
        const initialMap: Record<string, string> = {};
        profileList.forEach((p) => {
          initialMap[p.id] = p.defaultModel || 'gemini-2.0-flash';
        });
        setAgentModels(initialMap);
      } catch (e) {
        console.error('Failed to load agent configuration:', e);
      }
    };
    fetchData();
  }, []);

  const activeAgent = profiles.find((p) => p.id === selectedAgentId) || profiles[0];
  const rawModelId = agentModels[selectedAgentId] || activeAgent?.defaultModel || 'gemini-2.5-flash';
  // Sanitize any previously saved deprecated model names
  const activeModelId =
    rawModelId === 'gemini-2.0-flash' || rawModelId === 'gemini-1.5-flash' || rawModelId === 'gemini-1.5-pro'
      ? 'gemini-2.5-flash'
      : rawModelId;

  const activeModelObj = models.find((m) => m.id === activeModelId) || models[0];

  const currentMessages = messages[selectedAgentId] || [
    {
      id: 'init',
      role: 'assistant',
      content: `### 🤖 ${activeAgent?.codename || 'JARVIS'} // Systems Operational
Greetings Zakarya. I am your **${activeAgent?.name || 'Agent'}** (${activeAgent?.role || 'Tactical Assistant'}).
Connected to model: \`${activeModelObj?.name || 'Gemini 2.0 Flash'}\`.
How can I assist your operations today? Select a tactical prompt below or enter custom instructions.`,
      timestamp: new Date().toLocaleTimeString(),
      modelUsed: activeModelObj?.name,
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

    const currentModelId = agentModels[selectedAgentId] || 'gemini-2.0-flash';
    const currentModelName = models.find((m) => m.id === currentModelId)?.name || currentModelId;

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString(),
    };

    const assistantMsgId = `asst-${Date.now()}`;
    const initialAssistantMsg: Message = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toLocaleTimeString(),
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
      case 'research':
        return Search;
      case 'coding':
        return Code;
      case 'pentest':
        return ShieldAlert;
      case 'study':
        return BookOpen;
      case 'summary':
        return FileText;
      case 'memory':
        return Cpu;
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
    <div className="flex-1 flex overflow-hidden">
      {/* Left Agent Selector Rail */}
      <div className="w-64 bg-space-900 border-r border-cyan-500/20 flex flex-col justify-between shrink-0 select-none">
        <div>
          <div className="p-3 border-b border-cyan-500/20 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bot className="w-4 h-4 text-purple-400" />
              <span className="font-display font-bold text-xs text-white">
                JARVIS CREW (6 AGENTS)
              </span>
            </div>
          </div>

          {/* Agents List */}
          <div className="overflow-y-auto p-2 space-y-1.5 font-mono text-xs">
            {profiles.map((agent) => {
              const Icon = getAgentIcon(agent.id);
              const isSelected = selectedAgentId === agent.id;
              const assignedModel = agentModels[agent.id] || agent.defaultModel;

              return (
                <button
                  key={agent.id}
                  onClick={() => setSelectedAgentId(agent.id)}
                  className={`w-full p-2.5 rounded-lg text-left transition-all relative group border ${
                    isSelected
                      ? 'bg-space-800 border-cyan-500/40 shadow-glow-cyan text-white'
                      : 'bg-space-950/50 border-slate-800/80 text-slate-400 hover:bg-space-850 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border"
                      style={{
                        backgroundColor: `${agent.color}15`,
                        borderColor: `${agent.color}40`,
                      }}
                    >
                      <Icon className="w-3.5 h-3.5" style={{ color: agent.color }} />
                    </div>

                    <div className="truncate flex-1 min-w-0">
                      <div className="font-bold text-xs text-slate-200 truncate group-hover:text-cyan-300">
                        {agent.name}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {agent.role}
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <span
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r shadow-sm"
                      style={{ backgroundColor: agent.color }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom API Key Status Button */}
        <div className="p-3 border-t border-slate-800 bg-space-950/60 font-mono text-xs">
          <button
            onClick={() => setIsKeyModalOpen(true)}
            className={`w-full py-2 px-3 rounded-lg border flex items-center justify-between transition ${
              hasApiKey
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
                : 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25 shadow-sm'
            }`}
          >
            <div className="flex items-center space-x-2 truncate">
              <Key className="w-3.5 h-3.5 shrink-0" />
              <span className="text-[11px] font-semibold truncate">
                {hasApiKey ? `KEY: ${maskedApiKey}` : 'ENTER GOOGLE API KEY'}
              </span>
            </div>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-space-900 border border-slate-700 uppercase">
              {hasApiKey ? 'ACTIVE' : 'FREE'}
            </span>
          </button>
        </div>
      </div>

      {/* Main Agent Chat Cockpit */}
      <div className="flex-1 flex flex-col overflow-hidden bg-space-950">
        {/* Agent Cockpit Header with Model & Router Selector */}
        <div className="h-14 border-b border-cyan-500/20 bg-space-900/90 px-4 flex items-center justify-between shrink-0 font-mono text-xs gap-3">
          <div className="flex items-center space-x-3 min-w-0 pr-2">
            <span
              className="w-3 h-3 rounded-full animate-ping shrink-0"
              style={{ backgroundColor: activeAgent?.color || '#00F0FF' }}
            />
            <div className="truncate">
              <div className="flex items-center space-x-2">
                <h2 className="font-bold text-slate-100 font-sans text-sm truncate">
                  {activeAgent?.name} [{activeAgent?.codename}]
                </h2>
                <span className="hidden md:inline px-2 py-0.5 rounded text-[10px] bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                  AUTONOMOUS
                </span>
              </div>
              <p className="text-[10px] text-slate-400 truncate">
                {activeAgent?.description}
              </p>
            </div>
          </div>

          {/* Model & Router Selector Controls */}
          <div className="flex items-center space-x-2 shrink-0">
            {/* Router Mode Selector */}
            <div className="hidden sm:flex items-center bg-space-950 p-0.5 rounded-lg border border-slate-800 text-[10px]">
              <button
                onClick={() => setRoutingMode('cloud_only')}
                className={`px-2 py-1 rounded transition ${
                  routingMode === 'cloud_only'
                    ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
                title="Cloud Only (Google Gemini)"
              >
                ☁️ Cloud Only
              </button>
              <button
                onClick={() => setRoutingMode('hybrid_fallback')}
                className={`px-2 py-1 rounded transition ${
                  routingMode === 'hybrid_fallback'
                    ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
                title="Hybrid (Cloud with Local Ollama Fallback)"
              >
                ⚡ Hybrid Fallback
              </button>
              <button
                onClick={() => setRoutingMode('local_only')}
                className={`px-2 py-1 rounded transition ${
                  routingMode === 'local_only'
                    ? 'bg-purple-500/20 text-purple-300 font-bold border border-purple-500/40'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
                title="Local Only (Ollama Direct)"
              >
                💻 Local Only
              </button>
            </div>

            {/* Model Selector Dropdown */}
            <div className="flex items-center space-x-1.5 bg-space-950 px-2.5 py-1 rounded-lg border border-cyan-500/30 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <select
                value={activeModelId}
                onChange={(e) => handleModelChange(selectedAgentId, e.target.value)}
                className="bg-transparent text-xs font-mono font-bold text-cyan-300 focus:outline-none cursor-pointer max-w-[180px] truncate"
              >
                <optgroup label="🌟 Google AI Models">
                  {models
                    .filter((m) => m.provider === 'google')
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                </optgroup>
                <optgroup label="⚡ Local GPU Models (Ollama)">
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

            <button
              onClick={() =>
                setMessages((prev) => ({
                  ...prev,
                  [selectedAgentId]: [],
                }))
              }
              className="p-1.5 rounded hover:bg-space-800 text-slate-400 hover:text-slate-200 border border-slate-700 text-xs flex items-center gap-1"
              title="Reset Conversation"
            >
              <RefreshCw className="w-3 h-3" />
              <span className="hidden sm:inline">CLEAR</span>
            </button>
          </div>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 font-mono text-xs">
          {currentMessages.map((msg) => {
            const isUser = msg.role === 'user';
            const isCopied = copiedIndex === msg.id;

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-3xl ${
                  isUser ? 'ml-auto' : 'mr-auto'
                } space-y-1`}
              >
                <div className="flex items-center space-x-2 text-[10px] text-slate-500 px-1">
                  <span>{isUser ? 'ZAKARYA' : `${activeAgent?.codename} (${msg.modelUsed || activeModelObj?.name || 'Gemini'})`}</span>
                  <span>•</span>
                  <span>{msg.timestamp}</span>
                </div>

                <div
                  className={`p-4 rounded-xl relative group max-w-full ${
                    isUser
                      ? 'bg-cyan-950/40 border border-cyan-500/30 text-cyan-100 shadow-sm'
                      : 'bg-space-900/90 border border-slate-700/80 text-slate-200 shadow-glass-panel'
                  }`}
                >
                  <div
                    className="prose prose-invert max-w-none text-xs leading-relaxed prose-headings:font-display prose-headings:text-cyan-300 prose-code:text-emerald-300 prose-code:bg-space-950 prose-pre:bg-space-950 prose-pre:border prose-pre:border-slate-800"
                    dangerouslySetInnerHTML={{
                      __html: marked.parse(msg.content, { async: false }) as string,
                    }}
                  />

                  {/* Message Action Hover Bar (Copy / Save to Vault) */}
                  {!isUser && msg.content && (
                    <div className="flex items-center space-x-2 mt-3 pt-2 border-t border-slate-800 text-[11px]">
                      <button
                        onClick={() => handleCopyMessage(msg.id, msg.content)}
                        className="flex items-center space-x-1 px-2 py-1 rounded bg-space-950 hover:bg-space-800 text-slate-300 border border-slate-800"
                      >
                        {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
                        <span>{isCopied ? 'COPIED' : 'COPY'}</span>
                      </button>

                      <button
                        onClick={() => openSaveModal(msg.content)}
                        className="flex items-center space-x-1 px-2 py-1 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40"
                      >
                        <Save className="w-3 h-3" />
                        <span>SAVE TO VAULT NOTE</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isStreaming && (
            <div className="flex items-center space-x-2 text-cyan-400 text-xs animate-pulse">
              <Sparkles className="w-4 h-4 animate-spin-slow" />
              <span>{activeAgent?.codename} ({activeModelObj?.name}) IS GENERATING INTEL STREAM...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Tactical Prompt Chips */}
        {activeAgent?.quickPrompts && activeAgent.quickPrompts.length > 0 && (
          <div className="p-3 bg-space-900/60 border-t border-slate-800 overflow-x-auto flex items-center space-x-2 shrink-0">
            <span className="text-[10px] text-slate-500 font-bold font-mono uppercase whitespace-nowrap flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" /> TACTICAL PROMPTS:
            </span>
            {activeAgent.quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(prompt)}
                disabled={isStreaming}
                className="px-2.5 py-1 rounded-full bg-space-950 hover:bg-space-800 border border-slate-700/80 hover:border-cyan-500/40 text-[11px] font-mono text-slate-300 whitespace-nowrap transition"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {/* Chat Input Box */}
        <div className="p-3 md:p-4 bg-space-900 border-t border-cyan-500/20 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center space-x-2"
          >
            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder={`Transmit instruction to ${activeAgent?.codename || 'Agent'} using ${activeModelObj?.name}...`}
              disabled={isStreaming}
              className="flex-1 bg-space-950 border border-cyan-500/20 rounded-xl px-4 py-2.5 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
            <button
              type="submit"
              disabled={isStreaming || !inputPrompt.trim()}
              className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black font-bold text-xs font-mono flex items-center space-x-1.5 transition shadow-glow-cyan"
            >
              <span>TRANSMIT</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>

      {/* Google API Key Configuration Modal */}
      {isKeyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-space-900 border border-cyan-500/40 rounded-xl p-6 shadow-glass-glow space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Key className="w-5 h-5 text-amber-400" />
                <h2 className="font-display font-bold text-base text-white">
                  GOOGLE AI STUDIO FREE API KEY
                </h2>
              </div>
              <button
                onClick={() => setIsKeyModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-lg bg-space-950 border border-slate-800 space-y-2">
              <div className="flex items-center space-x-2 text-emerald-400 font-bold text-[11px]">
                <ShieldCheck className="w-4 h-4" />
                <span>100% FREE TIER • NO CREDIT CARD REQUIRED</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Get your instant free API key at{' '}
                <a
                  href="https://aistudio.google.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-cyan-400 underline hover:text-cyan-300 inline-flex items-center gap-0.5"
                >
                  aistudio.google.com <ExternalLink className="w-3 h-3" />
                </a>
                . This gives all 6 agents live streaming access to <strong>Gemini 2.0 Flash, Gemini 1.5 Pro, and Gemini 1.5 Flash</strong> with 1,500 free requests per day.
              </p>
            </div>

            <form onSubmit={handleSaveApiKey} className="space-y-3">
              <div>
                <label className="block text-slate-400 mb-1 font-bold">PASTE GOOGLE AI API KEY</label>
                <input
                  type="password"
                  required
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder={hasApiKey ? `Current: ${maskedApiKey} (Enter new key to replace)` : 'AIzaSy...'}
                  className="w-full bg-space-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-400 font-mono text-xs"
                />
              </div>

              {keySaveSuccess && (
                <div className="p-2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-center font-bold">
                  ✓ API KEY SAVED & ACTIVE!
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsKeyModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-space-800 text-slate-300 hover:bg-space-700"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold shadow-glow-cyan"
                >
                  SAVE & ACTIVATE
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Save Output To Vault Note Modal */}
      {saveModalContent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-space-900 border border-cyan-500/40 rounded-xl p-6 shadow-glass-glow space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Save className="w-5 h-5 text-cyan-400" />
                <h2 className="font-display font-bold text-base text-white">
                  SAVE AGENT INTELLIGENCE TO OBSIDIAN
                </h2>
              </div>
              <button
                onClick={() => setSaveModalContent(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmSaveNote} className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-slate-400 mb-1">NOTE TITLE</label>
                <input
                  type="text"
                  required
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  className="w-full bg-space-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">BRANCH / TARGET DIRECTORY</label>
                  <select
                    value={noteBranch}
                    onChange={(e) => setNoteBranch(e.target.value)}
                    className="w-full bg-space-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-cyan-400"
                  >
                    <option value="01 Certifications/EJPT Certification/Notes">01 Certifications / Notes</option>
                    <option value="01 Certifications/EJPT Certification/Labs">01 Certifications / Labs</option>
                    <option value="02 Coding Projects/Python">02 Coding Projects / Python</option>
                    <option value="03 AI OS — Agentic System/Agents">03 AI OS / Agents</option>
                    <option value="04 Knowledge Base/Concepts">04 Knowledge Base / Concepts</option>
                    <option value="04 Knowledge Base/Tools">04 Knowledge Base / Tools</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">CATEGORY</label>
                  <input
                    type="text"
                    value={noteCategory}
                    onChange={(e) => setNoteCategory(e.target.value)}
                    className="w-full bg-space-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">CONTENT PREVIEW</label>
                <textarea
                  readOnly
                  rows={6}
                  value={saveModalContent}
                  className="w-full bg-space-950 border border-slate-800 rounded-lg p-2 text-slate-300 font-mono text-[11px] focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSaveModalContent(null)}
                  className="px-4 py-2 rounded-lg bg-space-800 text-slate-300 hover:bg-space-700"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold shadow-glow-cyan"
                >
                  SAVE & SYNC TO DISK
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
