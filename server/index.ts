import express, { Request, Response } from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import path from 'path';
import chokidar from 'chokidar';
import { vaultService } from './vault';
import { 
  AGENT_PROFILES, 
  AVAILABLE_MODELS, 
  getApiKey, 
  setApiKey, 
  getExpLabsApiKey,
  setExpLabsApiKey,
  streamAgentResponse, 
  getCombinedModels, 
  streamOllamaResponse,
  RoutingMode
} from './agent';
import { projectService } from './projectService';
import { githubService } from './githubService';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Active WebSocket clients set
const clients = new Set<WebSocket>();

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log(`[WS] Client connected. Active clients: ${clients.size}`);

  // Send initial sync event
  ws.send(JSON.stringify({ type: 'connected', time: new Date().toISOString() }));

  ws.on('close', () => {
    clients.delete(ws);
    console.log(`[WS] Client disconnected. Active clients: ${clients.size}`);
  });

  ws.on('error', (err) => {
    console.error('[WS] Error:', err);
    clients.delete(ws);
  });
});

function broadcast(data: any) {
  const payload = JSON.stringify(data);
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}

// Connect project service to live WebSocket broadcast
projectService.setBroadcastCallback(broadcast);

// ==========================================
// REST API ROUTES
// ==========================================

// 1. Vault Overview & Telemetry
app.get('/api/vault/overview', (req: Request, res: Response) => {
  try {
    const stats = vaultService.getTelemetryStats();
    const projects = vaultService.getProjectsKanban();
    const recentNotes = vaultService.getAllNotes()
      .sort((a, b) => new Date(b.updated).getTime() - new Date(a.updated).getTime())
      .slice(0, 10);

    res.json({
      success: true,
      stats,
      projects,
      recentNotes,
      vaultPath: vaultService.getVaultPath(),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. All Notes List
app.get('/api/vault/notes', (req: Request, res: Response) => {
  try {
    const notes = vaultService.getAllNotes();
    res.json({ success: true, count: notes.length, notes });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. Single Note details
app.get('/api/vault/note', (req: Request, res: Response) => {
  try {
    const notePath = req.query.path as string;
    const noteId = req.query.id as string;

    if (!notePath && !noteId) {
      return res.status(400).json({ success: false, error: 'Missing path or id parameter' });
    }

    const note = notePath
      ? vaultService.getNoteByRelativePath(notePath)
      : vaultService.getNoteById(noteId);

    if (!note) {
      return res.status(404).json({ success: false, error: 'Note not found' });
    }

    res.json({ success: true, note });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. Save / Create / Update Note
app.post('/api/vault/note', async (req: Request, res: Response) => {
  try {
    const { path: notePath, content, frontmatter } = req.body;

    if (!notePath || content === undefined) {
      return res.status(400).json({ success: false, error: 'Missing path or content' });
    }

    const savedNote = await vaultService.saveNote(notePath, content, frontmatter);
    
    // Broadcast live change to all connected dashboards
    broadcast({
      type: 'note:saved',
      note: savedNote,
      timestamp: Date.now(),
    });

    res.json({ success: true, note: savedNote });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 5. Delete Note
app.delete('/api/vault/note', async (req: Request, res: Response) => {
  try {
    const { path: notePath } = req.body;
    if (!notePath) {
      return res.status(400).json({ success: false, error: 'Missing path' });
    }

    const deleted = await vaultService.deleteNote(notePath);
    
    broadcast({
      type: 'note:deleted',
      path: notePath,
      timestamp: Date.now(),
    });

    res.json({ success: deleted });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 6. Force-Directed Graph Data
app.get('/api/vault/graph', (req: Request, res: Response) => {
  try {
    const graphData = vaultService.getGraphData();
    res.json({ success: true, graph: graphData });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 7. Commands Matrix
app.get('/api/vault/commands', (req: Request, res: Response) => {
  try {
    const commands = vaultService.getCommands();
    res.json({ success: true, count: commands.length, commands });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 8. Projects Kanban
app.get('/api/vault/projects', (req: Request, res: Response) => {
  try {
    const projects = vaultService.getProjectsKanban();
    res.json({ success: true, projects });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 9. Quick Daily Note Creator
app.post('/api/vault/daily', async (req: Request, res: Response) => {
  try {
    const { priorities } = req.body;
    const dailyNote = await vaultService.createDailyNote(priorities);

    broadcast({
      type: 'daily:created',
      note: dailyNote,
      timestamp: Date.now(),
    });

    res.json({ success: true, note: dailyNote });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 10. AI Agent Profiles & Models
app.get('/api/agent/profiles', (req: Request, res: Response) => {
  res.json({ success: true, profiles: Object.values(AGENT_PROFILES) });
});

app.get('/api/agent/models', async (req: Request, res: Response) => {
  try {
    const models = await getCombinedModels();
    res.json({ success: true, models });
  } catch (error: any) {
    res.json({ success: true, models: AVAILABLE_MODELS });
  }
});

// Alias: GET /api/models
app.get('/api/models', async (req: Request, res: Response) => {
  try {
    const models = await getCombinedModels();
    res.json({ success: true, models });
  } catch (error: any) {
    res.json({ success: true, models: AVAILABLE_MODELS });
  }
});

// 11. API Key Management
app.get('/api/settings/key', (req: Request, res: Response) => {
  const googleKey = getApiKey();
  const explabsKey = getExpLabsApiKey();
  const hasExpLabs = explabsKey.length > 5;
  const hasGoogle = googleKey.length > 5;
  const hasKey = hasExpLabs || hasGoogle;
  const maskedKey = hasExpLabs 
    ? `${explabsKey.slice(0, 8)}...${explabsKey.slice(-4)}`
    : (hasGoogle ? `${googleKey.slice(0, 6)}...${googleKey.slice(-4)}` : '');
  
  res.json({ 
    success: true, 
    hasKey, 
    maskedKey,
    hasExpLabs,
    maskedExpLabsKey: hasExpLabs ? `${explabsKey.slice(0, 8)}...${explabsKey.slice(-4)}` : '',
    hasGoogle,
    maskedGoogleKey: hasGoogle ? `${googleKey.slice(0, 6)}...${googleKey.slice(-4)}` : ''
  });
});

app.post('/api/settings/key', (req: Request, res: Response) => {
  try {
    const { key, provider } = req.body;
    if (typeof key === 'string' && key.trim()) {
      if (key.startsWith('xpl_') || provider === 'explabs') {
        setExpLabsApiKey(key.trim());
      } else {
        setApiKey(key.trim());
      }
      res.json({ success: true, message: 'API key saved successfully' });
    } else {
      res.status(400).json({ success: false, error: 'Invalid key' });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 12. Hybrid AI Agent Chat Stream (SSE)
app.post(['/api/agent/chat', '/api/agent-chat'], async (req: Request, res: Response) => {
  const { 
    agentId, 
    agent, 
    message, 
    prompt, 
    history = [], 
    modelId, 
    routingMode = 'hybrid_fallback' 
  } = req.body;

  const targetAgent = agentId || agent || 'coding';
  const targetPrompt = message || prompt || '';

  if (!targetPrompt) {
    return res.status(400).json({ success: false, error: 'Missing message or prompt' });
  }

  // Set SSE Headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  try {
    const fullResponse = await streamAgentResponse(
      targetAgent,
      targetPrompt,
      history,
      modelId,
      (chunk: string) => {
        res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
      },
      routingMode as RoutingMode
    );

    res.write(`data: ${JSON.stringify({ done: true, fullResponse })}\n\n`);
    res.end();
  } catch (error: any) {
    console.error('[Agent Stream Error]:', error);
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
});

// Direct Local Model Execution (Ollama)
app.post('/api/local-model', async (req: Request, res: Response) => {
  const { model = 'deepseek-coder-v2:latest', prompt, history = [] } = req.body;
  if (!prompt) {
    return res.status(400).json({ success: false, error: 'Missing prompt' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  try {
    const fullResponse = await streamOllamaResponse(
      model,
      prompt,
      'You are a high-performance local AI model running under Zak_OS.',
      history,
      (chunk: string) => {
        res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
      }
    );

    res.write(`data: ${JSON.stringify({ done: true, fullResponse })}\n\n`);
    res.end();
  } catch (error: any) {
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
});

// 13. Terminal Execution & Background Daemon Server Endpoints
app.post('/api/project/terminal/exec', async (req: Request, res: Response) => {
  try {
    const { command, cwd = process.cwd() } = req.body;
    if (!command) {
      return res.status(400).json({ success: false, error: 'Missing command' });
    }
    const result = await projectService.executeTerminalCommand(command, cwd);
    res.json({ success: true, result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/project/server/start', (req: Request, res: Response) => {
  try {
    const { command, cwd = process.cwd(), name } = req.body;
    if (!command) {
      return res.status(400).json({ success: false, error: 'Missing command' });
    }
    const serverInfo = projectService.startBackgroundServer(command, cwd, name);
    res.json({ success: true, server: serverInfo });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/project/server/stop', (req: Request, res: Response) => {
  try {
    const { pid } = req.body;
    if (!pid) {
      return res.status(400).json({ success: false, error: 'Missing pid' });
    }
    const success = projectService.stopBackgroundServer(Number(pid));
    res.json({ success });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/project/server/list', (req: Request, res: Response) => {
  try {
    const servers = projectService.getActiveServers();
    res.json({ success: true, servers });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/project/server/logs', (req: Request, res: Response) => {
  try {
    const pid = req.query.pid ? Number(req.query.pid) : undefined;
    const servers = projectService.getActiveServers();
    if (pid) {
      const target = servers.find((s) => s.pid === pid);
      return res.json({ success: true, logs: target?.logs || [] });
    }
    const allLogs = servers.map((s) => ({ pid: s.pid, name: s.name, url: s.url, logs: s.logs }));
    res.json({ success: true, allLogs });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 13. Project IDE & Filesystem Endpoints
app.get('/api/project/list', (req: Request, res: Response) => {
  try {
    const projects = projectService.getProjects();
    res.json({ success: true, projects });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/project/workspace/add', async (req: Request, res: Response) => {
  try {
    const { folderPath, customName, category = 'General', autoScanWithAi = true } = req.body;
    if (!folderPath) {
      return res.status(400).json({ success: false, error: 'Missing folderPath' });
    }
    const project = await projectService.addWorkspace(folderPath, customName, category, autoScanWithAi);
    res.json({ success: true, project });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/project/workspace/remove', (req: Request, res: Response) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ success: false, error: 'Missing id' });
    }
    const success = projectService.removeWorkspace(id);
    res.json({ success });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/project/workspace/scan', async (req: Request, res: Response) => {
  try {
    const { projectPath, projectId, modelId = 'gemini-3.7-flash' } = req.body;
    const projects = projectService.getProjects();
    const proj = projects.find((p) => p.id === projectId || p.path === projectPath);
    if (!proj) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    const vaultNotePath = await projectService.scanAndSyncProjectToVault(proj, modelId);
    res.json({ success: true, vaultNotePath });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/project/workspace/state', (req: Request, res: Response) => {
  try {
    const state = projectService.getIdeState();
    res.json({ success: true, state });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/project/workspace/state', (req: Request, res: Response) => {
  try {
    const { state } = req.body;
    if (state) {
      projectService.saveIdeState(state);
      res.json({ success: true });
    } else {
      res.status(400).json({ success: false, error: 'Missing state' });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/project/tree', (req: Request, res: Response) => {
  try {
    const dirPath = (req.query.path as string) || process.cwd();
    const tree = projectService.getDirectoryTree(dirPath);
    res.json({ success: true, tree });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/project/file', (req: Request, res: Response) => {
  try {
    const filePath = req.query.path as string;
    if (!filePath) {
      return res.status(400).json({ success: false, error: 'Missing path parameter' });
    }
    const file = projectService.readFile(filePath);
    res.json({ success: true, file });
  } catch (error: any) {
    res.status(404).json({ success: false, error: error.message });
  }
});

app.post('/api/project/file', (req: Request, res: Response) => {
  try {
    const { path: filePath, content } = req.body;
    if (!filePath || content === undefined) {
      return res.status(400).json({ success: false, error: 'Missing path or content' });
    }
    const result = projectService.writeFile(filePath, content);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/project/create', (req: Request, res: Response) => {
  try {
    const { path: targetPath, type, initialContent = '' } = req.body;
    if (!targetPath || !type) {
      return res.status(400).json({ success: false, error: 'Missing path or type' });
    }
    const success = projectService.createItem(targetPath, type, initialContent);
    res.json({ success });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/project/file', (req: Request, res: Response) => {
  try {
    const { path: targetPath } = req.body;
    if (!targetPath) {
      return res.status(400).json({ success: false, error: 'Missing path' });
    }
    const success = projectService.deleteItem(targetPath);
    res.json({ success });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/project/run', async (req: Request, res: Response) => {
  try {
    const { language = 'python', code, filePath } = req.body;
    if (!code && !filePath) {
      return res.status(400).json({ success: false, error: 'Missing code or filePath' });
    }
    const result = await projectService.runCode(language, code, filePath);
    res.json({ success: true, result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// 14. GITHUB CLOUD INTEGRATION ENDPOINTS
// ==========================================

// Authenticated user profile
app.get('/api/github/user', async (req: Request, res: Response) => {
  try {
    const token = (req.headers['x-github-token'] as string) || undefined;
    const user = await githubService.getUser(token);
    res.json({ success: true, user });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// User repositories list
app.get('/api/github/repos', async (req: Request, res: Response) => {
  try {
    const token = (req.headers['x-github-token'] as string) || undefined;
    const repos = await githubService.getRepos(token);
    res.json({ success: true, count: repos.length, repos });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Specific repository details
app.get('/api/github/repo', async (req: Request, res: Response) => {
  try {
    const { owner, repo } = req.query as { owner: string; repo: string };
    if (!owner || !repo) {
      return res.status(400).json({ success: false, error: 'Missing owner or repo query parameters' });
    }
    const token = (req.headers['x-github-token'] as string) || undefined;
    const repoData = await githubService.getRepo(owner, repo, token);
    res.json({ success: true, repo: repoData });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Repository branches
app.get('/api/github/branches', async (req: Request, res: Response) => {
  try {
    const { owner, repo } = req.query as { owner: string; repo: string };
    if (!owner || !repo) {
      return res.status(400).json({ success: false, error: 'Missing owner or repo query parameters' });
    }
    const token = (req.headers['x-github-token'] as string) || undefined;
    const branches = await githubService.getBranches(owner, repo, token);
    res.json({ success: true, branches });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Repository Git Tree (file hierarchy)
app.get('/api/github/tree', async (req: Request, res: Response) => {
  try {
    const { owner, repo, branch = 'main' } = req.query as { owner: string; repo: string; branch?: string };
    if (!owner || !repo) {
      return res.status(400).json({ success: false, error: 'Missing owner or repo query parameters' });
    }
    const token = (req.headers['x-github-token'] as string) || undefined;
    const tree = await githubService.getTree(owner, repo, branch, token);
    res.json({ success: true, tree });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Single file content (formatted UTF-8 or base64)
app.get('/api/github/file', async (req: Request, res: Response) => {
  try {
    const { owner, repo, path: filePath, branch } = req.query as {
      owner: string;
      repo: string;
      path: string;
      branch?: string;
    };
    if (!owner || !repo || !filePath) {
      return res.status(400).json({ success: false, error: 'Missing owner, repo, or path parameter' });
    }
    const token = (req.headers['x-github-token'] as string) || undefined;
    const file = await githubService.getFile(owner, repo, filePath, branch, token);
    res.json({ success: true, file });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Commit history
app.get('/api/github/commits', async (req: Request, res: Response) => {
  try {
    const { owner, repo, branch, per_page } = req.query as {
      owner: string;
      repo: string;
      branch?: string;
      per_page?: string;
    };
    if (!owner || !repo) {
      return res.status(400).json({ success: false, error: 'Missing owner or repo parameter' });
    }
    const token = (req.headers['x-github-token'] as string) || undefined;
    const commits = await githubService.getCommits(owner, repo, branch, per_page ? Number(per_page) : 30, token);
    res.json({ success: true, count: commits.length, commits });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Contributors
app.get('/api/github/contributors', async (req: Request, res: Response) => {
  try {
    const { owner, repo } = req.query as { owner: string; repo: string };
    if (!owner || !repo) {
      return res.status(400).json({ success: false, error: 'Missing owner or repo parameter' });
    }
    const token = (req.headers['x-github-token'] as string) || undefined;
    const contributors = await githubService.getContributors(owner, repo, token);
    res.json({ success: true, contributors });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// README preview content
app.get('/api/github/readme', async (req: Request, res: Response) => {
  try {
    const { owner, repo, branch } = req.query as { owner: string; repo: string; branch?: string };
    if (!owner || !repo) {
      return res.status(400).json({ success: false, error: 'Missing owner or repo parameter' });
    }
    const token = (req.headers['x-github-token'] as string) || undefined;
    const readme = await githubService.getReadme(owner, repo, branch, token);
    res.json({ success: true, readme });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Language stats
app.get('/api/github/languages', async (req: Request, res: Response) => {
  try {
    const { owner, repo } = req.query as { owner: string; repo: string };
    if (!owner || !repo) {
      return res.status(400).json({ success: false, error: 'Missing owner or repo parameter' });
    }
    const token = (req.headers['x-github-token'] as string) || undefined;
    const languages = await githubService.getLanguages(owner, repo, token);
    res.json({ success: true, languages });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Set / Update Token
app.post('/api/github/token', (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    if (typeof token === 'string' && token.trim()) {
      githubService.setToken(token.trim());
      res.json({ success: true, message: 'GitHub token updated' });
    } else {
      res.status(400).json({ success: false, error: 'Invalid token' });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// CHOKIDAR FILE WATCHER & INITIALIZATION
// ==========================================

async function startServer() {
  const vaultPath = vaultService.getVaultPath();
  console.log(`[Zak_OS] Initializing vault scan at: ${vaultPath}`);
  
  await vaultService.reindex();

  // Watch for external Obsidian changes
  const watcher = chokidar.watch(vaultPath, {
    ignored: /(^|[\/\\])\..|node_modules/,
    persistent: true,
    ignoreInitial: true,
    depth: 10,
  });

  let debounceTimer: NodeJS.Timeout | null = null;

  const handleFsChange = (event: string, filePath: string) => {
    if (!filePath.endsWith('.md')) return;

    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      console.log(`[Chokidar] Vault change detected (${event}): ${path.basename(filePath)}`);
      await vaultService.reindex();
      broadcast({
        type: 'vault:updated',
        event,
        filePath,
        timestamp: Date.now(),
      });
    }, 400);
  };

  watcher
    .on('add', (p) => handleFsChange('add', p))
    .on('change', (p) => handleFsChange('change', p))
    .on('unlink', (p) => handleFsChange('unlink', p));

  server.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🚀 Zak_OS Backend Server Online`);
    console.log(`📡 REST API & WebSockets running on: http://localhost:${PORT}`);
    console.log(`🏛 Connected to Obsidian Vault: ${vaultPath}`);
    console.log(`======================================================\n`);
  });
}

startServer().catch((err) => {
  console.error('[Zak_OS] Failed to start server:', err);
});
