import fs from 'fs';
import path from 'path';
import { exec, spawn, ChildProcess } from 'child_process';
import { vaultService } from './vault';
import { streamAgentResponse } from './agent';

export interface FileNode {
  id: string;
  name: string;
  path: string;
  relativePath: string;
  type: 'file' | 'directory';
  extension?: string;
  size?: number;
  updated?: string;
  children?: FileNode[];
}

export interface ProjectInfo {
  id: string;
  name: string;
  title: string;
  path: string;
  category: string;
  type: 'vault' | 'external';
  description: string;
  language: string;
  mainFile?: string;
  fileCount?: number;
  lastOpened?: string;
  vaultNotePath?: string;
}

export interface BackgroundServerInfo {
  id: string;
  pid: number;
  name: string;
  command: string;
  cwd: string;
  status: 'running' | 'stopped' | 'errored';
  startTime: string;
  port?: number;
  url?: string;
  logs: string[];
}

export interface CodeExecutionResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  durationMs: number;
  timestamp: string;
}

export interface IdeState {
  lastActiveProjectId: string;
  openTabs: { path: string; name: string; language: string }[];
  activeTabPath: string;
}

export class ProjectService {
  private defaultProjectsDir = path.join(
    process.env.VAULT_PATH || 'C:\\Users\\Zakar\\Documents\\Obsidian\\My_Vault',
    '02 Coding Projects'
  );

  private configFilePath = path.join(process.cwd(), 'workspaces_config.json');

  /**
   * Read stored custom workspaces and IDE state from JSON config
   */
  private readConfig(): { customWorkspaces: ProjectInfo[]; ideState: IdeState } {
    try {
      if (fs.existsSync(this.configFilePath)) {
        const raw = fs.readFileSync(this.configFilePath, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.error('[ProjectService] Error reading workspaces config:', err);
    }
    return {
      customWorkspaces: [],
      ideState: {
        lastActiveProjectId: '',
        openTabs: [],
        activeTabPath: '',
      },
    };
  }

  /**
   * Save custom workspaces and IDE state to JSON config
   */
  private saveConfig(config: { customWorkspaces: ProjectInfo[]; ideState: IdeState }): void {
    try {
      fs.writeFileSync(this.configFilePath, JSON.stringify(config, null, 2), 'utf-8');
    } catch (err) {
      console.error('[ProjectService] Error writing workspaces config:', err);
    }
  }

  /**
   * List all discoverable coding projects across Vault and saved external workspaces
   */
  public getProjects(): ProjectInfo[] {
    const projects: ProjectInfo[] = [];
    const config = this.readConfig();

    // 1. Prioritize Zak_OS System Source Workspace (Top Priority)
    const zakOsPath = path.resolve(process.cwd());
    projects.push({
      id: 'local-zak_os-source',
      name: 'Zak_OS',
      title: 'Zak_OS System Source',
      path: zakOsPath,
      category: 'Web Dev & OS',
      type: 'external',
      description: 'Zak_OS Fullstack Second Brain Operating System codebase',
      language: 'typescript',
      mainFile: 'src/App.tsx',
      vaultNotePath: '02 Coding Projects/Web Dev/Zak_OS.md',
    });

    // 2. Scan Obsidian Vault 02 Coding Projects
    if (fs.existsSync(this.defaultProjectsDir)) {
      try {
        const categories = fs.readdirSync(this.defaultProjectsDir, { withFileTypes: true });
        for (const cat of categories) {
          if (cat.isDirectory() && !cat.name.startsWith('.')) {
            const catPath = path.join(this.defaultProjectsDir, cat.name);
            const subItems = fs.readdirSync(catPath, { withFileTypes: true });

            for (const sub of subItems) {
              if (sub.isDirectory() && !sub.name.startsWith('.')) {
                const projPath = path.join(catPath, sub.name);
                const files = fs.readdirSync(projPath);
                const mainFile = files.find(
                  (f) =>
                    f.endsWith('.py') ||
                    f.endsWith('.ts') ||
                    f.endsWith('.js') ||
                    f.endsWith('.sh') ||
                    f.endsWith('.c') ||
                    f.endsWith('.md')
                );

                projects.push({
                  id: `vault-${cat.name.toLowerCase()}-${sub.name.toLowerCase()}`,
                  name: sub.name,
                  title: sub.name.replace(/_/g, ' '),
                  path: projPath,
                  category: cat.name,
                  type: 'vault',
                  description: `Vault Project in ${cat.name}`,
                  language: cat.name.toLowerCase().includes('python')
                    ? 'python'
                    : cat.name.toLowerCase().includes('c')
                    ? 'c'
                    : 'typescript',
                  mainFile,
                  fileCount: files.length,
                  vaultNotePath: `02 Coding Projects/${cat.name}/${sub.name}.md`,
                });
              }
            }
          }
        }
      } catch (err) {
        console.error('[ProjectService] Error scanning vault projects:', err);
      }
    }

    // 2. Add sample starter projects if vault has none
    if (projects.length === 0) {
      const pythonScannerPath = path.join(this.defaultProjectsDir, 'Python', 'Async_Network_Scanner');
      const discordBotPath = path.join(this.defaultProjectsDir, 'Python', 'Discord_Security_Bot');

      this.ensureDirectoryExists(pythonScannerPath);
      this.ensureDirectoryExists(discordBotPath);

      const scannerFile = path.join(pythonScannerPath, 'scanner.py');
      if (!fs.existsSync(scannerFile)) {
        fs.writeFileSync(
          scannerFile,
          `import asyncio
import socket
import sys
from datetime import datetime

"""
🚀 Zak_OS // Async Raw TCP Port Scanner & Banner Grabber
High-speed asynchronous port triage with semaphore concurrency.
"""

TARGET_HOST = "127.0.0.1"
COMMON_PORTS = [21, 22, 25, 53, 80, 110, 139, 443, 445, 1433, 3306, 3389, 8080]

async def check_port(host: str, port: int, semaphore: asyncio.Semaphore, timeout: float = 1.5):
    async with semaphore:
        try:
            conn = asyncio.open_connection(host, port)
            reader, writer = await asyncio.wait_for(conn, timeout=timeout)
            
            banner = ""
            try:
                writer.write(b"HEAD / HTTP/1.0\\r\\n\\r\\n")
                await writer.drain()
                data = await asyncio.wait_for(reader.read(1024), timeout=0.8)
                banner = data.decode('utf-8', errors='ignore').strip().split('\\n')[0]
            except Exception:
                pass
                
            writer.close()
            await writer.wait_closed()
            return (port, True, banner)
        except Exception:
            return (port, False, "")

async def main():
    print(f"[*] Starting Zak_OS Async Scanner against {TARGET_HOST}")
    print(f"[*] Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\\n")
    
    semaphore = asyncio.Semaphore(50)
    tasks = [check_port(TARGET_HOST, port, semaphore) for port in COMMON_PORTS]
    results = await asyncio.gather(*tasks)
    
    open_ports = [r for r in results if r[1]]
    print(f"[+] Scan Complete: {len(open_ports)} / {len(COMMON_PORTS)} ports open.")
    for port, is_open, banner in open_ports:
        banner_str = f"-> {banner}" if banner else ""
        print(f"    - PORT {port:<5} [OPEN] {banner_str}")

if __name__ == '__main__':
    asyncio.run(main())
`,
          'utf-8'
        );
      }

      projects.push({
        id: 'vault-python-async_network_scanner',
        name: 'Async_Network_Scanner',
        title: 'Async Network Scanner',
        path: pythonScannerPath,
        category: 'Python',
        type: 'vault',
        description: 'High-speed asynchronous Python TCP port triage & banner grabber',
        language: 'python',
        mainFile: 'scanner.py',
        fileCount: 3,
        vaultNotePath: '02 Coding Projects/Python/Async_Network_Scanner.md',
      });
    }

    // 3. Merge stored custom system workspaces (deduplicating by path)
    for (const cw of config.customWorkspaces) {
      if (fs.existsSync(cw.path) && !projects.some((p) => path.resolve(p.path) === path.resolve(cw.path))) {
        projects.push(cw);
      }
    }

    return projects;
  }

  /**
   * Add any existing system folder or create a new workspace on disk
   */
  public async addWorkspace(
    folderPath: string,
    customName?: string,
    category = 'General',
    autoScanWithAi = true
  ): Promise<ProjectInfo> {
    const fullPath = path.resolve(folderPath);
    this.ensureDirectoryExists(fullPath);

    const name = customName || path.basename(fullPath);
    const id = `ext-${Date.now()}-${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

    // Detect language from files
    let language = 'typescript';
    let mainFile = '';
    let fileCount = 0;

    try {
      const items = fs.readdirSync(fullPath);
      fileCount = items.length;
      if (items.some((f) => f.endsWith('.py'))) language = 'python';
      else if (items.some((f) => f.endsWith('.c') || f.endsWith('.cpp'))) language = 'c';
      else if (items.some((f) => f.endsWith('.rs'))) language = 'rust';
      else if (items.some((f) => f.endsWith('.go'))) language = 'go';
      else if (items.some((f) => f.endsWith('.sh'))) language = 'shell';

      mainFile =
        items.find(
          (f) =>
            f.endsWith('.py') ||
            f.endsWith('.ts') ||
            f.endsWith('.js') ||
            f.endsWith('.json') ||
            f.endsWith('.md')
        ) || '';
    } catch (e) {}

    const newProject: ProjectInfo = {
      id,
      name,
      title: name.replace(/_/g, ' '),
      path: fullPath,
      category,
      type: fullPath.includes('My_Vault') ? 'vault' : 'external',
      description: `Workspace at ${fullPath}`,
      language,
      mainFile,
      fileCount,
      lastOpened: new Date().toISOString(),
      vaultNotePath: `02 Coding Projects/${category}/${name}.md`,
    };

    // Save to workspaces config
    const config = this.readConfig();
    config.customWorkspaces = config.customWorkspaces.filter(
      (w) => path.resolve(w.path) !== path.resolve(fullPath)
    );
    config.customWorkspaces.unshift(newProject);
    this.saveConfig(config);

    // Auto AI Scan & Obsidian Node creation
    if (autoScanWithAi) {
      try {
        await this.scanAndSyncProjectToVault(newProject, 'gemini-3.7-flash');
      } catch (err) {
        console.error('[ProjectService] AI scan failed during addWorkspace:', err);
      }
    }

    return newProject;
  }

  /**
   * Remove workspace from custom list
   */
  public removeWorkspace(id: string): boolean {
    const config = this.readConfig();
    config.customWorkspaces = config.customWorkspaces.filter((w) => w.id !== id);
    this.saveConfig(config);
    return true;
  }

  /**
   * Autonomous AI Codebase Scanner:
   * Analyzes project structure and files with Google Gemini and creates/updates
   * a Tier 2 Obsidian Vault Note with frontmatter, architecture breakdown, and 3D graph links!
   */
  public async scanAndSyncProjectToVault(project: ProjectInfo, modelId = 'gemini-3.7-flash'): Promise<string> {
    const fullPath = path.resolve(project.path);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Project directory does not exist: ${fullPath}`);
    }

    // 1. Gather file list and preview of entry files
    let fileListStr = '';
    let previewCode = '';

    try {
      const items = fs.readdirSync(fullPath, { withFileTypes: true });
      const visible = items
        .filter((i) => !['node_modules', '.git', 'dist', 'build', '.next'].includes(i.name))
        .map((i) => (i.isDirectory() ? `📁 ${i.name}/` : `📄 ${i.name}`));
      fileListStr = visible.slice(0, 30).join('\n');

      if (project.mainFile) {
        const mainPath = path.join(fullPath, project.mainFile);
        if (fs.existsSync(mainPath)) {
          previewCode = fs.readFileSync(mainPath, 'utf-8').slice(0, 1500);
        }
      }
    } catch (e) {}

    // 2. Formulate Prompt for Autonomous Architecture Analysis
    const prompt = `Perform an executive technical architecture analysis for the following coding project:

Project Name: ${project.title}
Directory: ${fullPath}
Language: ${project.language}

File Structure:
${fileListStr}

${previewCode ? `Primary Code Sample (${project.mainFile}):\n\`\`\`${project.language}\n${previewCode}\n\`\`\`` : ''}

Provide a high-density, structured Markdown analysis with:
1. Executive Summary & Purpose
2. Key Architectural Modules & Flow
3. Tech Stack & Dependencies
4. Security & Performance Considerations
5. Next Milestones & Roadmap`;

    let aiAnalysis = '';
    try {
      aiAnalysis = await streamAgentResponse(
        'coding',
        prompt,
        [],
        modelId,
        () => {}
      );
    } catch (err: any) {
      console.warn('[ProjectService] AI stream failed, using structured template:', err.message);
      aiAnalysis = `### 💻 Technical Architecture Summary
- **Project:** ${project.title}
- **Language:** ${project.language.toUpperCase()}
- **Location:** \`${fullPath}\`
- **Total Files:** ${project.fileCount || 0}

#### ⚡ Core Capabilities
- Autonomous execution and modular structure.
- Integrated with Zak_OS Fullstack IDE.`;
    }

    // 3. Construct Obsidian Note with YAML Frontmatter & Wikilinks
    const cleanTitle = project.name.replace(/[\\/:*?"<>|]/g, '_');
    const category = project.category || 'General';
    const vaultRelPath = `02 Coding Projects/${category}/${cleanTitle}.md`;

    const noteContent = `---
title: "${project.title}"
type: project
category: coding
tier: 2
status: In-Progress
language: ${project.language}
path: "${fullPath.replace(/\\/g, '/')}"
tags:
  - project
  - coding
  - ${project.language.toLowerCase()}
  - zak_os
created: ${new Date().toISOString().split('T')[0]}
updated: ${new Date().toISOString().split('T')[0]}
parent: "[[02 Coding Projects/Coding Projects — Hub]]"
---

# 🚀 ${project.title}
**⬆️ Parent:** [[02 Coding Projects/Coding Projects — Hub]]  
**📂 Local Path:** \`${fullPath}\`  
**⚙️ Language:** \`${project.language.toUpperCase()}\` • **Files:** ${project.fileCount || 0}

---

${aiAnalysis}

---

## 🔗 Related Knowledge Base & Certs
- [[02 Coding Projects/Coding Projects — Hub]]
- [[01 Certifications/EJPT Certification/EJPT — Tools Index]]
- [[04 Knowledge Base/Tools/Python & Asyncio Mastery]]
`;

    // 4. Save directly into Obsidian Vault on disk
    const vaultFullPath = path.join(
      process.env.VAULT_PATH || 'C:\\Users\\Zakar\\Documents\\Obsidian\\My_Vault',
      vaultRelPath
    );
    this.ensureDirectoryExists(path.dirname(vaultFullPath));
    fs.writeFileSync(vaultFullPath, noteContent.trim(), 'utf-8');

    // 5. Trigger Vault Index rebuild so it binds to 3D Force Graph immediately!
    await vaultService.reindex();
    console.log(`[ProjectService] Synced project note to Vault: ${vaultRelPath}`);

    return vaultRelPath;
  }

  /**
   * Save & restore active IDE tabs and workspace state
   */
  public saveIdeState(state: IdeState): void {
    const config = this.readConfig();
    config.ideState = state;
    this.saveConfig(config);
  }

  public getIdeState(): IdeState {
    const config = this.readConfig();
    return (
      config.ideState || {
        lastActiveProjectId: '',
        openTabs: [],
        activeTabPath: '',
      }
    );
  }

  /**
   * Recursively get file tree for a given project directory path
   */
  public getDirectoryTree(dirPath: string, relativeRoot = ''): FileNode {
    const fullPath = path.resolve(dirPath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Directory not found: ${fullPath}`);
    }
    const stats = fs.statSync(fullPath);
    const name = path.basename(fullPath);

    if (!stats.isDirectory()) {
      return {
        id: fullPath,
        name,
        path: fullPath,
        relativePath: relativeRoot || name,
        type: 'file',
        extension: path.extname(name).toLowerCase(),
        size: stats.size,
        updated: stats.mtime.toISOString(),
      };
    }

    const node: FileNode = {
      id: fullPath,
      name,
      path: fullPath,
      relativePath: relativeRoot || '.',
      type: 'directory',
      updated: stats.mtime.toISOString(),
      children: [],
    };

    try {
      const items = fs.readdirSync(fullPath, { withFileTypes: true });
      const filtered = items.filter(
        (i) =>
          !['node_modules', '.git', '.next', 'dist', 'build', '.system_generated', '__pycache__', '.pytest_cache'].includes(
            i.name
          )
      );

      filtered.sort((a, b) => {
        if (a.isDirectory() && !b.isDirectory()) return -1;
        if (!a.isDirectory() && b.isDirectory()) return 1;
        return a.name.localeCompare(b.name);
      });

      for (const item of filtered) {
        const itemPath = path.join(fullPath, item.name);
        const childRel = relativeRoot ? `${relativeRoot}/${item.name}` : item.name;
        node.children!.push(this.getDirectoryTree(itemPath, childRel));
      }
    } catch (err) {
      console.error(`[ProjectService] Error reading dir ${fullPath}:`, err);
    }

    return node;
  }

  /**
   * Read raw file content from disk
   */
  public readFile(filePath: string): { content: string; path: string; name: string; size: number } {
    const fullPath = path.resolve(filePath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    const stats = fs.statSync(fullPath);
    const content = fs.readFileSync(fullPath, 'utf-8');
    return {
      content,
      path: fullPath,
      name: path.basename(fullPath),
      size: stats.size,
    };
  }

  /**
   * Write/save file content to disk
   */
  public writeFile(filePath: string, content: string): { success: boolean; path: string; name: string } {
    const fullPath = path.resolve(filePath);
    this.ensureDirectoryExists(path.dirname(fullPath));
    fs.writeFileSync(fullPath, content, 'utf-8');
    return {
      success: true,
      path: fullPath,
      name: path.basename(fullPath),
    };
  }

  /**
   * Create a new file or directory
   */
  public createItem(targetPath: string, type: 'file' | 'directory', initialContent = ''): boolean {
    const fullPath = path.resolve(targetPath);
    if (type === 'directory') {
      this.ensureDirectoryExists(fullPath);
      return true;
    } else {
      this.ensureDirectoryExists(path.dirname(fullPath));
      fs.writeFileSync(fullPath, initialContent, 'utf-8');
      return true;
    }
  }

  /**
   * Delete file or directory from disk
   */
  public deleteItem(targetPath: string): boolean {
    const fullPath = path.resolve(targetPath);
    if (!fs.existsSync(fullPath)) return false;
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      fs.rmSync(fullPath, { recursive: true, force: true });
    } else {
      fs.unlinkSync(fullPath);
    }
    return true;
  }

  private activeProcesses: Map<number, { info: BackgroundServerInfo; process: ChildProcess }> = new Map();
  private broadcastCallback?: (data: any) => void;

  public setBroadcastCallback(cb: (data: any) => void) {
    this.broadcastCallback = cb;
  }

  /**
   * Start a long-running background web server or daemon process
   */
  public startBackgroundServer(command: string, cwd: string, customName?: string): BackgroundServerInfo {
    const fullCwd = path.resolve(cwd);
    this.ensureDirectoryExists(fullCwd);

    const name = customName || path.basename(fullCwd);
    const id = `srv-${Date.now()}`;

    // Clean multiline commands for PowerShell execution
    const lines = command
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith('#'));
    const cleanCommand = lines.join(' ; ');

    // Spawn native powershell process on Windows or shell on POSIX
    const child =
      process.platform === 'win32'
        ? spawn('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', cleanCommand], {
            cwd: fullCwd,
            stdio: ['pipe', 'pipe', 'pipe'],
            detached: false,
          })
        : spawn(cleanCommand, {
            cwd: fullCwd,
            shell: true,
            stdio: ['pipe', 'pipe', 'pipe'],
            detached: false,
          });

    const serverInfo: BackgroundServerInfo = {
      id,
      pid: child.pid || 0,
      name,
      command: cleanCommand,
      cwd: fullCwd,
      status: 'running',
      startTime: new Date().toLocaleTimeString(),
      logs: [`[*] Launched daemon in ${fullCwd}:\n> powershell -Command "${cleanCommand}"\n`],
    };

    const extractPortAndUrl = (text: string) => {
      // Look for localhost:XXXX or 127.0.0.1:XXXX or port XXXX or http://[::1]:XXXX
      const urlMatch =
        text.match(/http:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0):(\d+)/i) ||
        text.match(/http:\/\/\[::1\]:(\d+)/i) ||
        text.match(/localhost:(\d+)/i);
      if (urlMatch) {
        serverInfo.url = urlMatch[0].startsWith('http') ? urlMatch[0] : `http://${urlMatch[0]}`;
        const portStr = urlMatch[2] || urlMatch[1];
        if (portStr && !isNaN(Number(portStr))) {
          serverInfo.port = Number(portStr);
        }
      }
    };

    if (child.stdout) {
      child.stdout.on('data', (data) => {
        const text = data.toString();
        serverInfo.logs.push(text);
        if (serverInfo.logs.length > 500) serverInfo.logs.shift();
        extractPortAndUrl(text);

        if (this.broadcastCallback) {
          this.broadcastCallback({
            type: 'terminal:log',
            pid: child.pid,
            text,
            timestamp: Date.now(),
          });
        }
      });
    }

    if (child.stderr) {
      child.stderr.on('data', (data) => {
        const text = data.toString();
        serverInfo.logs.push(text);
        if (serverInfo.logs.length > 500) serverInfo.logs.shift();
        extractPortAndUrl(text);

        if (this.broadcastCallback) {
          this.broadcastCallback({
            type: 'terminal:log',
            pid: child.pid,
            text,
            isError: true,
            timestamp: Date.now(),
          });
        }
      });
    }

    child.on('close', (code) => {
      serverInfo.status = code === 0 ? 'stopped' : 'errored';
      const exitMsg = `\n[!] Process PID ${child.pid} exited with code ${code}\n`;
      serverInfo.logs.push(exitMsg);
      if (this.broadcastCallback) {
        this.broadcastCallback({
          type: 'terminal:log',
          pid: child.pid,
          text: exitMsg,
          timestamp: Date.now(),
        });
      }
    });

    child.on('error', (err) => {
      serverInfo.status = 'errored';
      const errMsg = `\n[!] Process error: ${err.message}\n`;
      serverInfo.logs.push(errMsg);
      if (this.broadcastCallback) {
        this.broadcastCallback({
          type: 'terminal:log',
          pid: child.pid,
          text: errMsg,
          isError: true,
          timestamp: Date.now(),
        });
      }
    });

    if (child.pid) {
      this.activeProcesses.set(child.pid, { info: serverInfo, process: child });
    }

    return serverInfo;
  }

  /**
   * Stop/kill a running background server
   */
  public stopBackgroundServer(pid: number): boolean {
    const entry = this.activeProcesses.get(pid);
    if (!entry) {
      // Attempt taskkill on Windows
      try {
        exec(`taskkill /PID ${pid} /T /F`);
        return true;
      } catch (e) {
        return false;
      }
    }

    try {
      if (process.platform === 'win32') {
        exec(`taskkill /PID ${pid} /T /F`);
      } else {
        entry.process.kill('SIGTERM');
      }
      entry.info.status = 'stopped';
      this.activeProcesses.delete(pid);
      return true;
    } catch (err) {
      console.error(`[ProjectService] Error stopping process ${pid}:`, err);
      return false;
    }
  }

  /**
   * Get all active background servers
   */
  public getActiveServers(): BackgroundServerInfo[] {
    return Array.from(this.activeProcesses.values()).map((e) => e.info);
  }

  /**
   * Execute an arbitrary PowerShell command inside a project directory
   */
  public async executeTerminalCommand(command: string, cwd: string): Promise<CodeExecutionResult> {
    const start = Date.now();
    const fullCwd = path.resolve(cwd);
    this.ensureDirectoryExists(fullCwd);

    const lines = command
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith('#'));
    const cleanCommand = lines.join(' ; ');

    return new Promise((resolve) => {
      const psCommand =
        process.platform === 'win32'
          ? `powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "${cleanCommand.replace(/"/g, '\\"')}"`
          : cleanCommand;

      exec(psCommand, { cwd: fullCwd, timeout: 120000, maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
        const durationMs = Date.now() - start;

        resolve({
          success: !error,
          stdout: stdout || '',
          stderr: stderr || (error ? error.message : ''),
          exitCode: error ? error.code || 1 : 0,
          durationMs,
          timestamp: new Date().toLocaleTimeString(),
        });
      });
    });
  }

  /**
   * Safe Sandbox Execution Runner
   */
  public async runCode(language: string, code: string, filePath?: string): Promise<CodeExecutionResult> {
    const start = Date.now();
    const timeoutMs = 15000;

    let command = '';
    const ext = language === 'python' || language === 'py' ? '.py' : language === 'javascript' || language === 'js' ? '.js' : '.sh';
    const tempDir = path.join(process.cwd(), 'temp_sandbox');
    this.ensureDirectoryExists(tempDir);
    const tempFilePath = path.join(tempDir, `sandbox_${Date.now()}${ext}`);

    fs.writeFileSync(tempFilePath, code, 'utf-8');

    if (language === 'python' || language === 'py') {
      command = `py "${tempFilePath}" 2>&1 || python "${tempFilePath}" 2>&1 || python3 "${tempFilePath}" 2>&1`;
    } else if (language === 'javascript' || language === 'js' || language === 'typescript' || language === 'ts') {
      command = `node "${tempFilePath}"`;
    } else if (language === 'bash' || language === 'sh' || language === 'powershell' || language === 'ps1') {
      command = `powershell -ExecutionPolicy Bypass -File "${tempFilePath}"`;
    } else {
      command = `node "${tempFilePath}"`;
    }

    return new Promise((resolve) => {
      exec(command, { timeout: timeoutMs, maxBuffer: 1024 * 1024 * 2 }, (error, stdout, stderr) => {
        const durationMs = Date.now() - start;

        try {
          if (fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
          }
        } catch (e) {}

        if (error && error.killed) {
          return resolve({
            success: false,
            stdout,
            stderr: `[SANDBOX TIMEOUT] Process exceeded maximum execution limit of ${timeoutMs / 1000}s. Terminated.`,
            exitCode: -1,
            durationMs,
            timestamp: new Date().toLocaleTimeString(),
          });
        }

        resolve({
          success: !error,
          stdout: stdout || '',
          stderr: stderr || (error ? error.message : ''),
          exitCode: error ? error.code || 1 : 0,
          durationMs,
          timestamp: new Date().toLocaleTimeString(),
        });
      });
    });
  }

  private ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }
}

export const projectService = new ProjectService();

