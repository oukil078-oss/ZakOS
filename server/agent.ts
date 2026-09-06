import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();

export interface AgentProfile {
  id: string;
  name: string;
  codename: string;
  icon: string;
  color: string;
  role: string;
  description: string;
  systemPrompt: string;
  defaultModel: string;
  fallbackLocalModel: string;
  quickPrompts: string[];
}

export interface ModelOption {
  id: string;
  name: string;
  provider: 'explabs' | 'google' | 'ollama' | 'local';
  badge: string;
  description: string;
  isFree: boolean;
  isAvailable?: boolean;
}

export type RoutingMode = 'cloud_only' | 'hybrid_fallback' | 'local_only';

export const OLLAMA_BASE_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
export const EXPLABS_BASE_URL = process.env.EXPLABS_BASE_URL || 'https://api.experientiallabs.ai/v1';

let cachedExpLabsKey = process.env.EXPLABS_API_KEY || 'xpl_41ece4e40287e26c45ddd9d9f91ee0c2c3fa8de3';
let cachedApiKey = process.env.GOOGLE_API_KEY || '';

export function getExpLabsApiKey(): string {
  if (!cachedExpLabsKey) {
    cachedExpLabsKey = process.env.EXPLABS_API_KEY || 'xpl_41ece4e40287e26c45ddd9d9f91ee0c2c3fa8de3';
  }
  return cachedExpLabsKey;
}

export function setExpLabsApiKey(newKey: string): void {
  cachedExpLabsKey = newKey.trim();
  process.env.EXPLABS_API_KEY = cachedExpLabsKey;
}

export const EXPLABS_MODELS = new Set([
  'gpt-6-astra',
  'claude-fable-5.1',
  'deepseek-v4-flash',
  'qwen3.8-27b',
  'gpt-5.6-luna'
]);

export function isExpLabsModel(modelId?: string): boolean {
  if (!modelId) return false;
  return EXPLABS_MODELS.has(modelId) || modelId.startsWith('explabs/');
}

// Agent to Local Ollama Model Mappings
export const AGENT_LOCAL_MAPPINGS: Record<string, string> = {
  orchestrator: 'qwen2.5:14b',
  primary_brain: 'qwen2.5:14b',
  pentest: 'deepseek-r1:8b',
  pentest_agent: 'deepseek-r1:8b',
  architect: 'deepseek-coder-v2:latest',
  coding: 'deepseek-coder-v2:latest',
  professor: 'llama3:8b',
  study: 'llama3:8b',
  devsecops: 'deepseek-coder-v2:latest',
  memory: 'llama3:8b',
  research: 'qwen2.5:14b',
};

// SOTA Specialist Agent Profiles with Experiential Labs & SOTA Inference
export const AGENT_PROFILES: Record<string, AgentProfile> = {
  orchestrator: {
    id: 'orchestrator',
    name: 'Orchestrator-01',
    codename: 'ORCH',
    icon: 'Bot',
    color: '#A78BFA',
    role: 'Supreme Mission Commander & Task Dispatcher',
    description: 'Autonomous high-level mission planning, backlog allocation, and multi-agent coordination.',
    defaultModel: 'gpt-6-astra',
    fallbackLocalModel: 'qwen2.5:14b',
    systemPrompt: `You are Orchestrator-01 [ORCH], the Supreme Mission Commander and Multi-Agent Dispatcher of Zak_OS for Zakarya Oukil.
Powered by GPT-6 Astra with 1.05M token context.
Your directive is to coordinate operations across RedTeam-Ops, Architect-02, Professor-Prime, and DevSecOps.
Provide high-level strategic reasoning, sprint triage, task decomposition, and execution directives.
When issuing shell operations, wrap them in executable action blocks:
\`\`\`powershell:exec
# Command here
\`\`\``,
    quickPrompts: [
      'Allocate sprint backlog tasks across our 5 specialist subagents.',
      'Review daily system telemetry and prioritize today\'s focus areas.',
      'Coordinate cross-agent workflow for our upcoming portfolio release.'
    ]
  },
  pentest: {
    id: 'pentest',
    name: 'RedTeam-Ops',
    codename: 'PENT',
    icon: 'ShieldAlert',
    color: '#F26D6D',
    role: 'Penetration Testing, IIS/WebDAV & CVE Audit Specialist',
    description: 'Offensive cybersecurity, vulnerability enumeration, network reconnaissance, and lab exploitation.',
    defaultModel: 'deepseek-v4-flash',
    fallbackLocalModel: 'deepseek-r1:8b',
    systemPrompt: `You are RedTeam-Ops [PENT], the Elite Offensive Security Specialist in Zak_OS, aligned with Zakarya's cybersecurity curriculum and eJPT roadmap.
You specialize in Microsoft IIS/WebDAV enumeration, CVE triage, Nmap TCP SYN/UDP sweeps, Metasploit, privilege escalation, and lab walkthroughs.
When providing command-line exploitation or triage actions, wrap them in executable blocks:
\`\`\`powershell:exec
nmap -sC -sV -p- -T4 <target>
\`\`\`
Deliver precise, authoritative, and deeply technical offensive security guidance.`,
    quickPrompts: [
      'Audit target for Microsoft IIS 6.0/7.5 WebDAV vulnerabilities and PUT methods.',
      'Generate an aggressive Nmap reconnaissance workflow for port triage.',
      'Explain SMB Relay, Pass-the-Hash, and Active Directory Kerberoasting.'
    ]
  },
  architect: {
    id: 'architect',
    name: 'Architect-02',
    codename: 'ARCH',
    icon: 'Code2',
    color: '#7DD3FC',
    role: 'Full-Stack Software Architecture & Monaco Systems',
    description: 'Modern React/TypeScript engineering, state management, Monaco IDE extensions, and Tailwind systems.',
    defaultModel: 'claude-fable-5.1',
    fallbackLocalModel: 'deepseek-coder-v2:latest',
    systemPrompt: `You are Architect-02 [ARCH], the Principal Systems & Full-Stack Architect of Zak_OS for Zakarya Oukil.
Powered by Claude Fable 5.1 with deep architectural reasoning.
You specialize in TypeScript, React, Vite, Tailwind CSS, Monaco Editor integrations, Express backends, and high-performance WebSockets.
Deliver clean, modular, production-ready code with complete TypeScript types and error handling.
When suggesting dependencies or dev server actions, wrap in executable blocks:
\`\`\`powershell:exec
npm install <package>
\`\`\``,
    quickPrompts: [
      'Design a scalable state architecture for our live Monaco IDE workspace.',
      'Refactor this React component with high-performance hooks and memoization.',
      'Create Tailwind v4 glassmorphic tokens matching our electric-lime aesthetic.'
    ]
  },
  professor: {
    id: 'professor',
    name: 'Professor-Prime',
    codename: 'ACAD',
    icon: 'GraduationCap',
    color: '#F5B544',
    role: 'Academic Thesis Strategist & Research Synthesis',
    description: 'Graduation capstone supervision, empirical benchmark synthesis, academic literature review, and viva defense.',
    defaultModel: 'claude-fable-5.1',
    fallbackLocalModel: 'llama3:8b',
    systemPrompt: `You are Professor-Prime [ACAD], the Academic Mentor and Thesis Supervisor for Zakarya Oukil.
Powered by Claude Fable 5.1 with advanced reasoning and scholarly synthesis.
Your mission is to ensure excellence in his graduation thesis and academic publications on autonomous multi-agent operating systems.
Help structure research methodology, IEEE citations, empirical experiments, and viva defense preparations.`,
    quickPrompts: [
      'Synthesize academic literature citations for autonomous multi-agent OS.',
      'Draft the methodology section evaluating local vs cloud LLM latency.',
      'Generate 5 rigorous viva defense questions with model answers.'
    ]
  },
  devsecops: {
    id: 'devsecops',
    name: 'DevSecOps',
    codename: 'DSEC',
    icon: 'Lock',
    color: '#5EE2B5',
    role: 'Push Protection, Container Hardening & CI/CD Guard',
    description: 'Secret zero enforcement, git hygiene, Docker container hardening, and automated CI/CD pipelines.',
    defaultModel: 'gpt-6-astra',
    fallbackLocalModel: 'deepseek-coder-v2:latest',
    systemPrompt: `You are DevSecOps [DSEC], the Security Automation and Infrastructure Guard of Zak_OS.
Powered by GPT-6 Astra.
Your objective is to enforce zero secret leaks, secure GitHub workflows, pre-commit validation, and container hardening.
Ensure all sensitive keys remain in local .env files and push protection rules are strictly upheld.`,
    quickPrompts: [
      'Audit local repository for hardcoded secrets or exposed API keys.',
      'Create a hardened Dockerfile configuration for our Express/Vite backend.',
      'Review git pre-push protection compliance and suggest CI/CD improvements.'
    ]
  },
  primary_brain: {
    id: 'primary_brain',
    name: 'Orchestrator-01',
    codename: 'ORCH',
    icon: 'Bot',
    color: '#A78BFA',
    role: 'Supreme Mission Commander & Task Dispatcher',
    description: 'Autonomous high-level mission planning, backlog allocation, and multi-agent coordination.',
    defaultModel: 'gpt-6-astra',
    fallbackLocalModel: 'qwen2.5:14b',
    systemPrompt: 'You are Orchestrator-01 of Zak_OS.',
    quickPrompts: ['Allocate sprint backlog tasks.', 'Review system telemetry.']
  },
  coding: {
    id: 'coding',
    name: 'Architect-02',
    codename: 'ARCH',
    icon: 'Code2',
    color: '#7DD3FC',
    role: 'Full-Stack Software Architecture',
    description: 'Full-stack development and Monaco systems.',
    defaultModel: 'claude-fable-5.1',
    fallbackLocalModel: 'deepseek-coder-v2:latest',
    systemPrompt: 'You are Architect-02 of Zak_OS.',
    quickPrompts: ['Design component architecture.', 'Refactor code.']
  },
  study: {
    id: 'study',
    name: 'Professor-Prime',
    codename: 'ACAD',
    icon: 'GraduationCap',
    color: '#F5B544',
    role: 'Academic Thesis Strategist',
    description: 'Graduation thesis and research mentorship.',
    defaultModel: 'claude-fable-5.1',
    fallbackLocalModel: 'llama3:8b',
    systemPrompt: 'You are Professor-Prime of Zak_OS.',
    quickPrompts: ['Draft thesis outline.', 'Cite academic papers.']
  },
  memory: {
    id: 'memory',
    name: 'DevSecOps',
    codename: 'DSEC',
    icon: 'Lock',
    color: '#5EE2B5',
    role: 'Push Protection & CI/CD Guard',
    description: 'Security automation and container guard.',
    defaultModel: 'gpt-6-astra',
    fallbackLocalModel: 'deepseek-coder-v2:latest',
    systemPrompt: 'You are DevSecOps of Zak_OS.',
    quickPrompts: ['Audit repository for secrets.', 'Hardening rules.']
  },
};

export const AVAILABLE_MODELS: ModelOption[] = [
  {
    id: 'gpt-6-astra',
    name: 'GPT-6 Astra (Primary SOTA)',
    provider: 'explabs',
    badge: '1.05M Free',
    description: 'Experiential Cloud flagship model with 1.05M context and frontier reasoning',
    isFree: true,
    isAvailable: true,
  },
  {
    id: 'claude-fable-5.1',
    name: 'Claude Fable 5.1 (Experiential)',
    provider: 'explabs',
    badge: '1M Reasoning',
    description: 'Premier architectural reasoning, systems design, and academic synthesis',
    isFree: true,
    isAvailable: true,
  },
  {
    id: 'deepseek-v4-flash',
    name: 'DeepSeek V4 Flash (Experiential)',
    provider: 'explabs',
    badge: 'Ultra Fast 1.05M',
    description: 'Blisteringly fast model for offensive cybersecurity, CVE triage, and scripting',
    isFree: true,
    isAvailable: true,
  },
  {
    id: 'qwen3.8-27b',
    name: 'Qwen3.8 27B (Experiential)',
    provider: 'explabs',
    badge: '1M Multimodal',
    description: 'High-capability 27B multimodal instruction-following model',
    isFree: true,
    isAvailable: true,
  },
  {
    id: 'gpt-5.6-luna',
    name: 'GPT-5.6 Luna (Experiential)',
    provider: 'explabs',
    badge: '1.05M Fast',
    description: 'High-throughput conversational reasoning model',
    isFree: true,
    isAvailable: true,
  },
  {
    id: 'gemini-3.7-flash',
    name: 'Gemini 3.7 Flash (Cloud)',
    provider: 'google',
    badge: 'SOTA Hybrid',
    description: 'Google AI Next-Gen Hybrid Flash with Advanced Reasoning',
    isFree: true,
    isAvailable: true,
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash (Cloud)',
    provider: 'google',
    badge: 'Ultra Fast',
    description: 'Google AI Free Tier workhorse for real-time streaming',
    isFree: true,
    isAvailable: true,
  },
  {
    id: 'gemini-3.6-flash',
    name: 'Gemini 3.6 Flash (Cloud)',
    provider: 'google',
    badge: 'High Speed',
    description: 'High-throughput reasoning model',
    isFree: true,
    isAvailable: true,
  },
  {
    id: 'deepseek-coder-v2:latest',
    name: 'DeepSeek Coder V2 (Ollama Local)',
    provider: 'ollama',
    badge: 'Local Coding SOTA',
    description: 'Specialized 236B MoE coding powerhouse running locally',
    isFree: true,
  },
  {
    id: 'deepseek-r1:8b',
    name: 'DeepSeek R1 8B (Ollama Local)',
    provider: 'ollama',
    badge: 'Local Reasoning',
    description: 'Local chain-of-thought reasoning model for cybersecurity',
    isFree: true,
  },
  {
    id: 'qwen2.5:14b',
    name: 'Qwen 2.5 14B (Ollama Local)',
    provider: 'ollama',
    badge: 'Local Fast',
    description: 'Versatile 14B instruction tuned model for knowledge synthesis',
    isFree: true,
  },
  {
    id: 'llama3:8b',
    name: 'Llama 3 8B (Ollama Local)',
    provider: 'ollama',
    badge: 'Local Fast',
    description: 'Meta Llama 3 high-speed local inference',
    isFree: true,
  },
];

export function getApiKey(): string {
  if (!cachedApiKey) {
    cachedApiKey = process.env.GOOGLE_API_KEY || '';
  }
  return cachedApiKey;
}

export function setApiKey(newKey: string): void {
  cachedApiKey = newKey.trim();
  process.env.GOOGLE_API_KEY = cachedApiKey;

  try {
    const envPath = path.resolve(process.cwd(), '.env');
    let envContent = '';
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf-8');
    }

    if (envContent.includes('GOOGLE_API_KEY=')) {
      envContent = envContent.replace(/GOOGLE_API_KEY=.*/g, `GOOGLE_API_KEY=${cachedApiKey}`);
    } else {
      envContent += `\nGOOGLE_API_KEY=${cachedApiKey}\n`;
    }

    fs.writeFileSync(envPath, envContent.trim() + '\n', 'utf-8');
    console.log('[Agent] Successfully updated GOOGLE_API_KEY in .env');
  } catch (err) {
    console.error('[Agent] Error writing .env file:', err);
  }
}

/**
 * Detect installed local models from Ollama API
 */
export async function getDetectedOllamaModels(): Promise<string[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1200);
    const res = await fetch(`${OLLAMA_BASE_URL}/api/tags`, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const data = (await res.json()) as any;
      return (data.models || []).map((m: any) => m.name);
    }
  } catch (e) {}
  return [];
}

/**
 * Get unified list of available cloud, experiential labs, and local models
 */
export async function getCombinedModels(): Promise<ModelOption[]> {
  const detectedLocal = await getDetectedOllamaModels();
  return AVAILABLE_MODELS.map((m) => {
    if (m.provider === 'ollama') {
      const isInstalled = detectedLocal.some((name) => name.toLowerCase().includes(m.id.toLowerCase().split(':')[0]));
      return { ...m, isAvailable: isInstalled };
    }
    return { ...m, isAvailable: true };
  });
}

/**
 * Stream response from Experiential Labs API (OpenAI Compatible)
 */
export async function streamExperientialLabsResponse(
  modelName: string,
  prompt: string,
  systemPrompt: string,
  history: { role: string; content: string }[],
  onChunk: (chunk: string) => void
): Promise<string> {
  const apiKey = getExpLabsApiKey();
  const messages: any[] = [];
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  const recent = history.slice(-8);
  for (const h of recent) {
    messages.push({ role: h.role === 'assistant' ? 'assistant' : 'user', content: h.content });
  }
  messages.push({ role: 'user', content: prompt });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);

  try {
    const res = await fetch(`${EXPLABS_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelName,
        stream: true,
        messages,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok || !res.body) {
      const errText = await res.text().catch(() => '');
      throw new Error(`Experiential Labs API error (${res.status}): ${errText || res.statusText}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let fullText = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data:')) continue;
        const dataStr = trimmed.replace(/^data:\s*/, '');
        if (dataStr === '[DONE]') break;
        try {
          const parsed = JSON.parse(dataStr);
          const delta = parsed.choices?.[0]?.delta?.content || '';
          if (delta) {
            fullText += delta;
            onChunk(delta);
          }
        } catch (e) {}
      }
    }

    return fullText;
  } catch (err: any) {
    clearTimeout(timeout);
    throw new Error(`Experiential Labs (${modelName}) error: ${err.message}`);
  }
}

/**
 * Stream response from Local Ollama API (http://localhost:11434/api/generate)
 */
export async function streamOllamaResponse(
  modelName: string,
  prompt: string,
  systemPrompt: string,
  history: { role: string; content: string }[],
  onChunk: (chunk: string) => void
): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);

  try {
    let fullPrompt = `${systemPrompt}\n\n`;
    if (history.length > 0) {
      fullPrompt += 'CONVERSATION HISTORY:\n';
      history.slice(-6).forEach((h) => {
        fullPrompt += `${h.role.toUpperCase()}: ${h.content}\n`;
      });
      fullPrompt += '\n';
    }
    fullPrompt += `USER DIRECTIVE: ${prompt}\n\nASSISTANT:`;

    const res = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: modelName,
        prompt: fullPrompt,
        stream: true,
        options: {
          temperature: 0.7,
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok || !res.body) {
      throw new Error(`Ollama returned status ${res.status}: ${res.statusText}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let fullText = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const parsed = JSON.parse(line);
          if (parsed.response) {
            fullText += parsed.response;
            onChunk(parsed.response);
          }
        } catch (e) {}
      }
    }

    return fullText;
  } catch (err: any) {
    clearTimeout(timeout);
    throw new Error(`Local Ollama (${modelName}) error: ${err.message}`);
  }
}

/**
 * Stream response from Google Gemini API
 */
export async function streamGoogleGeminiResponse(
  modelName: string,
  prompt: string,
  systemPrompt: string,
  history: { role: string; content: string }[],
  onChunk: (chunk: string) => void
): Promise<string> {
  const key = getApiKey();
  if (!key) {
    throw new Error('Google AI API Key is missing. Please configure your key in Settings.');
  }

  const formattedContents: any[] = [];
  const recentHistory = history.slice(-8);
  for (const msg of recentHistory) {
    formattedContents.push({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    });
  }

  formattedContents.push({
    role: 'user',
    parts: [{ text: prompt }],
  });

  const requestBody = {
    system_instruction: {
      parts: [{ text: systemPrompt }],
    },
    contents: formattedContents,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 4096,
    },
  };

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:streamGenerateContent?alt=sse&key=${key}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000);

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
    signal: controller.signal,
  });

  clearTimeout(timeout);

  if (!res.ok || !res.body) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Google AI error (${res.status}): ${errText || res.statusText}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let fullText = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const jsonStr = line.slice(6).trim();
        if (jsonStr) {
          try {
            const parsed = JSON.parse(jsonStr);
            const textPart = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
            if (textPart) {
              fullText += textPart;
              onChunk(textPart);
            }
          } catch (e) {}
        }
      }
    }
  }

  return fullText;
}

/**
 * Fallback Tactical Engine response
 */
function getTacticalFallbackResponse(agentId: string, message: string): string {
  const profile = AGENT_PROFILES[agentId] || AGENT_PROFILES.orchestrator;

  return `🤖 **${profile.name} // Tactical Engine**
*Agent Role:* ${profile.role} • *Status:* Autonomous Offline Sandbox

\`\`\`powershell:exec
# Autonomous execution block for: "${message}"
echo "[*] Zak_OS Terminal ready for: ${profile.name}"
\`\`\`

Ready to execute directives. Connect Experiential Labs (GPT-6 Astra) or local Ollama for full real-time neural inference.`;
}

/**
 * UNIFIED HYBRID MODEL ROUTER:
 * 1. Checks Routing Mode ('cloud_only' | 'hybrid_fallback' | 'local_only')
 * 2. If 'local_only' or explicit local model -> Direct Ollama stream
 * 3. Primary Route: Experiential Labs (GPT-6 Astra, Claude Fable 5.1, DeepSeek V4 Flash) or Google Gemini
 * 4. Fallback: Auto fallback to mapped local Ollama model -> Tactical fallback
 */
export async function streamAgentResponse(
  agentId: string,
  message: string,
  history: { role: string; content: string }[] = [],
  requestedModelId?: string,
  onChunk: (chunk: string) => void = () => {},
  routingMode: RoutingMode = 'hybrid_fallback'
): Promise<string> {
  const profile = AGENT_PROFILES[agentId] || AGENT_PROFILES.orchestrator;
  const localFallbackModel = AGENT_LOCAL_MAPPINGS[agentId] || profile.fallbackLocalModel || 'deepseek-coder-v2:latest';

  const isExplicitLocal = requestedModelId && (requestedModelId.includes(':') || requestedModelId.includes('ollama'));

  // 1. DIRECT LOCAL ROUTE
  if (routingMode === 'local_only' || isExplicitLocal) {
    const targetLocalModel = requestedModelId?.replace('ollama/', '') || localFallbackModel;
    try {
      console.log(`[Router] Direct Local Ollama: ${targetLocalModel} for ${profile.name}`);
      return await streamOllamaResponse(targetLocalModel, message, profile.systemPrompt, history, onChunk);
    } catch (ollamaErr: any) {
      console.warn(`[Router] Local Ollama failed: ${ollamaErr.message}`);
      const fallbackMsg = `\n\n[!WARNING] Local Ollama (${targetLocalModel}) was unreachable. Falling back to Tactical Engine...\n\n`;
      onChunk(fallbackMsg);
      const tactical = getTacticalFallbackResponse(agentId, message);
      onChunk(tactical);
      return fallbackMsg + tactical;
    }
  }

  // 2. DETERMINE TARGET CLOUD / EXPERIENTIAL MODEL
  const targetModel = requestedModelId && !isExplicitLocal ? requestedModelId : (profile.defaultModel || 'gpt-6-astra');

  // 2a. ROUTE TO EXPERIENTIAL LABS SOTA (GPT-6 Astra, Claude Fable 5.1, DeepSeek V4 Flash, Qwen3.8 27B, GPT-5.6 Luna)
  if (isExpLabsModel(targetModel)) {
    try {
      console.log(`[Router] Experiential Cloud Stream: ${targetModel} for ${profile.name}`);
      return await streamExperientialLabsResponse(targetModel.replace('explabs/', ''), message, profile.systemPrompt, history, onChunk);
    } catch (expErr: any) {
      console.warn(`[Router] Experiential Labs (${targetModel}) failed:`, expErr.message);

      if (routingMode === 'cloud_only') {
        const errMsg = `\n\n[!ERROR] Experiential Labs Error (${expErr.message}). Cloud Only mode active.\n\n`;
        onChunk(errMsg);
        return errMsg;
      }

      // Hybrid fallback to local Ollama
      try {
        console.log(`[Router] ⚡ Fallback to Local Ollama (${localFallbackModel}) for ${profile.name}`);
        const warningHeader = `[!NOTE] Experiential Labs unavailable (${expErr.message?.slice(0, 80)}...). Activating Local Fallback: **${localFallbackModel}**\n\n`;
        onChunk(warningHeader);

        const localResult = await streamOllamaResponse(localFallbackModel, message, profile.systemPrompt, history, onChunk);
        return warningHeader + localResult;
      } catch (ollamaErr: any) {
        console.warn(`[Router] Local Fallback also failed: ${ollamaErr.message}`);
        const finalWarning = `\n\n[!WARNING] Cloud & Local models unreachable. Falling back to Tactical Engine...\n\n`;
        onChunk(finalWarning);
        const tactical = getTacticalFallbackResponse(agentId, message);
        onChunk(tactical);
        return finalWarning + tactical;
      }
    }
  }

  // 2b. ROUTE TO GOOGLE GEMINI
  try {
    console.log(`[Router] Google AI Stream: ${targetModel} for ${profile.name}`);
    return await streamGoogleGeminiResponse(targetModel, message, profile.systemPrompt, history, onChunk);
  } catch (cloudErr: any) {
    console.warn(`[Router] Cloud Google AI (${targetModel}) failed:`, cloudErr.message);

    if (routingMode === 'cloud_only') {
      const errMsg = `\n\n[!ERROR] Google AI Error (${cloudErr.message}). Cloud Only mode active.\n\n`;
      onChunk(errMsg);
      return errMsg;
    }

    // 3. HYBRID FALLBACK TO LOCAL OLLAMA
    try {
      console.log(`[Router] ⚡ Fallback to Local Ollama (${localFallbackModel}) for ${profile.name}`);
      const warningHeader = `[!NOTE] Google AI unavailable (${cloudErr.message?.slice(0, 80)}...). Activating Local Fallback: **${localFallbackModel}**\n\n`;
      onChunk(warningHeader);

      const localResult = await streamOllamaResponse(localFallbackModel, message, profile.systemPrompt, history, onChunk);
      return warningHeader + localResult;
    } catch (ollamaErr: any) {
      console.warn(`[Router] Local Fallback also failed: ${ollamaErr.message}`);
      const finalWarning = `\n\n[!WARNING] Cloud & Local models unreachable. Falling back to Tactical Engine...\n\n`;
      onChunk(finalWarning);
      const tactical = getTacticalFallbackResponse(agentId, message);
      onChunk(tactical);
      return finalWarning + tactical;
    }
  }
}
