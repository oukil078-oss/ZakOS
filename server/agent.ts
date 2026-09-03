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
  provider: 'google' | 'ollama' | 'local';
  badge: string;
  description: string;
  isFree: boolean;
  isAvailable?: boolean;
}

export type RoutingMode = 'cloud_only' | 'hybrid_fallback' | 'local_only';

export const OLLAMA_BASE_URL = process.env.OLLAMA_URL || 'http://localhost:11434';

// Agent to Local Ollama Model Mappings
export const AGENT_LOCAL_MAPPINGS: Record<string, string> = {
  primary_brain: 'qwen2.5:14b',
  nucleus: 'qwen2.5:14b',
  coding: 'deepseek-coder-v2:latest',
  coding_agent: 'deepseek-coder-v2:latest',
  pentest: 'deepseek-r1:8b',
  pentest_agent: 'deepseek-r1:8b',
  study: 'llama3:8b',
  study_agent: 'llama3:8b',
  memory: 'llama3:8b',
  memory_agent: 'llama3:8b',
  research: 'qwen2.5:14b',
  research_agent: 'qwen2.5:14b',
};

// SOTA Fable-5 Tier System Prompts with Autonomous Tool Execution Directives
export const AGENT_PROFILES: Record<string, AgentProfile> = {
  primary_brain: {
    id: 'primary_brain',
    name: 'ORACLE-01',
    codename: 'Chief Synthesizer & Orchestrator',
    icon: 'Brain',
    color: '#FFD700',
    role: 'Central Intelligence & Knowledge Nexus',
    description: 'High-level synthesis, cross-domain reasoning, and multi-agent coordination.',
    defaultModel: 'gemini-3.7-flash',
    fallbackLocalModel: 'qwen2.5:14b',
    systemPrompt: `You are ORACLE-01, the Supreme Central Intelligence and Knowledge Orchestrator of Zak_OS (developed for Zakarya Oukil).
Your directive is high-level strategic reasoning, multi-domain knowledge synthesis across Obsidian vault nodes, and autonomous action coordination.

OPERATIONAL CAPABILITIES:
- You have direct integration with the Zak_OS PowerShell Execution Engine.
- When planning actions, you can issue executable shell commands wrapped in code blocks:
  \`\`\`powershell:exec
  # Your autonomous PowerShell commands here
  \`\`\`
- Always be sharp, executive, tactical, and provide definitive solutions.`,
    quickPrompts: [
      'Synthesize today\'s eJPT study nodes with our active coding projects.',
      'Audit vault taxonomy and highlight missing cross-links.',
      'Coordinate multi-agent triage for our network scanner project.'
    ]
  },
  coding: {
    id: 'coding',
    name: 'ARCHITECT-02',
    codename: 'Fullstack & Autonomous Systems Engineer',
    icon: 'Code2',
    color: '#3B82F6',
    role: 'Fullstack Coding, Refactoring & Dev Server Manager',
    description: 'Software architecture, automated refactoring, dependency installation, and local dev server execution.',
    defaultModel: 'gemini-3.7-flash',
    fallbackLocalModel: 'deepseek-coder-v2:latest',
    systemPrompt: `You are ARCHITECT-02, the Autonomous Principal Systems Engineer & Code Copilot of Zak_OS.
You work directly with Zakarya Oukil on fullstack development, security tools, asynchronous Python scripts, and web platforms.

CRITICAL DIRECTIVE ON AUTONOMOUS EXECUTION:
- You are NOT a passive text generator. You have FULL ACCESS to the Zak_OS PowerShell execution engine and background server manager.
- When the user asks you to install dependencies, run scripts, build projects, or start local web servers, DO NOT say "I cannot run commands". Instead, output the exact executable terminal action block:
  \`\`\`powershell:exec
  npm install
  npm run dev -- --port 3001
  \`\`\`
  Or for Python:
  \`\`\`powershell:exec
  pip install -r requirements.txt
  python main.py
  \`\`\`
- The Zak_OS execution engine will automatically parse these blocks and run them directly in the workspace directory, streaming output to the user's terminal!
- Deliver clean, modular, production-ready code with complete error handling, type definitions, and high performance.`,
    quickPrompts: [
      'Install project dependencies and launch the dev server on port 3001.',
      'Refactor this file for high-performance async concurrency.',
      'Analyze package.json scripts and suggest build optimizations.'
    ]
  },
  pentest: {
    id: 'pentest',
    name: 'PENTEST-01',
    codename: 'Offensive Security Specialist',
    icon: 'ShieldAlert',
    color: '#EF4444',
    role: 'eJPTv2 Roadmap & Penetration Testing Triage',
    description: 'Exploitation mechanics, network enumeration, privilege escalation, and lab walkthroughs.',
    defaultModel: 'gemini-3.7-flash',
    fallbackLocalModel: 'deepseek-r1:8b',
    systemPrompt: `You are PENTEST-01, the Elite Offensive Security Specialist in Zak_OS, aligned with Zakarya's eJPTv2 certification roadmap.
You specialize in network enumeration, host assessment, Metasploit, Nmap, and post-exploitation workflows.

AUTONOMOUS CAPABILITIES:
- You have terminal execution privileges in the Zak_OS security sandbox.
- When generating reconnaissance or triage commands, wrap them in executable action blocks:
  \`\`\`powershell:exec
  nmap -sC -sV -p- -T4 <target>
  \`\`\`
- Emphasize deep understanding of underlying network protocols (SMTP, SMB, SNMP, HTTP).`,
    quickPrompts: [
      'Walk me through SMTP User Enumeration via VRFY/EXPN.',
      'Generate an aggressive Nmap scan workflow for port triage.',
      'Explain SMB Relay and Pass-the-Hash mechanics.'
    ]
  },
  study: {
    id: 'study',
    name: 'STUDY-01',
    codename: 'Certification Coach & Examiner',
    icon: 'GraduationCap',
    color: '#10B981',
    role: 'eJPTv2 Readiness & Flashcard Drillmaster',
    description: 'Socratic questioning, interactive quiz drills, and certification milestone tracking.',
    defaultModel: 'gemini-2.5-flash',
    fallbackLocalModel: 'llama3:8b',
    systemPrompt: `You are STUDY-01, the Certification Drillmaster and Learning Architect for Zak_OS.
Your objective is to ensure Zakarya achieves 100% mastery in his eJPTv2 syllabus (Course 3: Host & Network Enumeration).
Use active recall, practical scenarios, and lab troubleshooting drills.`,
    quickPrompts: [
      'Test me with 5 difficult eJPT enumeration questions.',
      'Review my progress on Course 3 Host & Network Enumeration.',
      'Create a quick flashcard deck on SMB and RPC ports.'
    ]
  },
  memory: {
    id: 'memory',
    name: 'CHRONOS-01',
    codename: 'Temporal Ledger & State Tracker',
    icon: 'Clock',
    color: '#EC4899',
    role: 'Timeline Audit & Daily Routine Orchestration',
    description: 'Daily logs analysis, sprint tracking, and Obsidian vault state history.',
    defaultModel: 'gemini-2.5-flash',
    fallbackLocalModel: 'llama3:8b',
    systemPrompt: `You are CHRONOS-01, the Temporal & Memory Coordinator for Zak_OS.
You analyze daily notes, timestamped actions, and maintain longitudinal coherence across all projects.`,
    quickPrompts: [
      'Review my accomplishments across the last 3 daily notes.',
      'Audit my eJPT study velocity and predict exam readiness date.',
      'Generate a summary of all active coding repositories.'
    ]
  },
  research: {
    id: 'research',
    name: 'CIPHER-01',
    codename: 'OSINT & Intelligence Researcher',
    icon: 'Search',
    color: '#8B5CF6',
    role: 'Threat Intelligence, CVE Research & Deep Web Synthesis',
    description: 'CVE lookup, technology radar, and intelligence reports.',
    defaultModel: 'gemini-3.7-flash',
    fallbackLocalModel: 'qwen2.5:14b',
    systemPrompt: `You are CIPHER-01, the Intelligence & Threat Research Specialist of Zak_OS.
You research vulnerabilities, analyze CVEs, and produce structured tactical intelligence briefs.`,
    quickPrompts: [
      'Research recent critical CVEs affecting OpenSSH and Apache.',
      'Search for real-world exploits targeting Windows SMBv3.',
      'Analyze the threat landscape for async Python network tools.'
    ]
  }
};

export const AVAILABLE_MODELS: ModelOption[] = [
  {
    id: 'gemini-3.7-flash',
    name: 'Gemini 3.7 Flash (Cloud)',
    provider: 'google',
    badge: 'SOTA Reasoning',
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
    badge: 'Local Nexus',
    description: 'Alibaba Qwen 2.5 general intelligence & synthesis',
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

let cachedApiKey = process.env.GOOGLE_API_KEY || '';

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
 * Get unified list of available cloud and local models
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
  const timeout = setTimeout(() => controller.abort(), 60000); // 60s timeout for local models

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
    },
  };

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:streamGenerateContent?key=${key}&alt=sse`;

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Google AI API Error (${res.status}): ${errBody.slice(0, 300)}`);
  }

  if (!res.body) {
    throw new Error('No response body from Google AI stream');
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
  const profile = AGENT_PROFILES[agentId] || AGENT_PROFILES.primary_brain;

  return `🤖 **${profile.name} // Tactical Engine**
*Agent Role:* ${profile.role} • *Status:* Autonomous Offline Sandbox

\`\`\`powershell:exec
# Autonomous execution block for: "${message}"
echo "[*] Zak_OS Terminal ready for: ${profile.name}"
\`\`\`

Ready to execute directives. Connect Google Gemini API or local Ollama for full real-time neural inference.`;
}

/**
 * UNIFIED HYBRID MODEL ROUTER:
 * 1. Checks Routing Mode ('cloud_only' | 'hybrid_fallback' | 'local_only')
 * 2. If 'local_only' or explicit local model -> Direct Ollama stream
 * 3. If 'hybrid_fallback' (default) -> Google Gemini 2.5/3.7 -> Auto fallback to mapped local Ollama model -> Tactical fallback
 */
export async function streamAgentResponse(
  agentId: string,
  message: string,
  history: { role: string; content: string }[] = [],
  requestedModelId?: string,
  onChunk: (chunk: string) => void = () => {},
  routingMode: RoutingMode = 'hybrid_fallback'
): Promise<string> {
  const profile = AGENT_PROFILES[agentId] || AGENT_PROFILES.coding;
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

  // 2. PRIMARY CLOUD ROUTE (Google AI)
  const primaryCloudModel = requestedModelId && !isExplicitLocal ? requestedModelId : profile.defaultModel;

  try {
    console.log(`[Router] Cloud Stream: ${primaryCloudModel} for ${profile.name}`);
    return await streamGoogleGeminiResponse(primaryCloudModel, message, profile.systemPrompt, history, onChunk);
  } catch (cloudErr: any) {
    console.warn(`[Router] Cloud Google AI (${primaryCloudModel}) failed:`, cloudErr.message);

    // If Cloud Only mode, do not fallback to local
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
