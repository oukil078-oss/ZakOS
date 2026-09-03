import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { NoteItem, GraphData, GraphNode, GraphLink, CommandItem, TelemetryStats, ProjectKanbanItem } from './types';

// Default target vault path
const DEFAULT_VAULT_PATH = process.env.VAULT_PATH || 'C:\\Users\\Zakar\\Documents\\Obsidian\\My_Vault';

export class VaultService {
  private vaultPath: string;
  private notesCache: Map<string, NoteItem> = new Map();
  private commandsCache: CommandItem[] = [];
  private graphCache: GraphData | null = null;
  private lastIndexed: number = 0;

  constructor(vaultPath: string = DEFAULT_VAULT_PATH) {
    this.vaultPath = vaultPath;
  }

  public getVaultPath(): string {
    return this.vaultPath;
  }

  public setVaultPath(newPath: string) {
    this.vaultPath = newPath;
    this.reindex();
  }

  /**
   * Determine Branch and Color from note path
   */
  private determineBranch(relPath: string, tier: number, title: string): {
    branch: NoteItem['branch'];
    branchLabel: string;
    branchColor: string;
  } {
    const normalized = relPath.replace(/\\/g, '/');

    if (tier === 0 || title.includes('Master Root') || normalized === '🏛 Zakarya Oukil — Master Root.md') {
      return {
        branch: 'nucleus',
        branchLabel: 'Master Nucleus',
        branchColor: '#FFD700', // Gold
      };
    }

    if (normalized.startsWith('01 Certifications')) {
      return {
        branch: 'certs',
        branchLabel: '01 Certifications (eJPT)',
        branchColor: '#10B981', // Green
      };
    }

    if (normalized.startsWith('02 Coding Projects')) {
      return {
        branch: 'coding',
        branchLabel: '02 Coding Projects',
        branchColor: '#3B82F6', // Blue
      };
    }

    if (normalized.startsWith('03 AI OS')) {
      return {
        branch: 'aios',
        branchLabel: '03 AI OS — Agentic System',
        branchColor: '#A855F7', // Purple
      };
    }

    if (normalized.startsWith('04 Knowledge Base')) {
      return {
        branch: 'kb',
        branchLabel: '04 Knowledge Base',
        branchColor: '#F97316', // Orange
      };
    }

    if (normalized.startsWith('05 Templates')) {
      return {
        branch: 'templates',
        branchLabel: '05 Templates',
        branchColor: '#EC4899', // Pink
      };
    }

    return {
      branch: 'other',
      branchLabel: 'General',
      branchColor: '#00F0FF', // Cyan
    };
  }

  /**
   * Extract wikilinks from note body and frontmatter parent
   */
  private extractWikilinks(content: string, frontmatter: any): string[] {
    const links: Set<string> = new Set();
    const linkRegex = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;
    let match;

    while ((match = linkRegex.exec(content)) !== null) {
      if (match[1]) {
        links.add(match[1].trim());
      }
    }

    if (frontmatter && frontmatter.parent) {
      const parentMatch = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/.exec(frontmatter.parent);
      if (parentMatch && parentMatch[1]) {
        links.add(parentMatch[1].trim());
      } else if (typeof frontmatter.parent === 'string' && frontmatter.parent.trim().length > 0) {
        links.add(frontmatter.parent.replace(/\[\[|\]\]/g, '').trim());
      }
    }

    return Array.from(links);
  }

  /**
   * Extract Headings from Markdown
   */
  private extractHeadings(content: string): { level: number; text: string }[] {
    const headings: { level: number; text: string }[] = [];
    const headingRegex = /^(#{1,6})\s+(.+)$/gm;
    let match;

    while ((match = headingRegex.exec(content)) !== null) {
      headings.push({
        level: match[1].length,
        text: match[2].trim(),
      });
    }

    return headings;
  }

  /**
   * Recursively scan vault directory
   */
  public async reindex(): Promise<Map<string, NoteItem>> {
    const newCache = new Map<string, NoteItem>();

    if (!fs.existsSync(this.vaultPath)) {
      console.warn(`[VaultService] Vault path not found: ${this.vaultPath}`);
      return newCache;
    }

    const scanDir = (dirPath: string) => {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        const relPath = path.relative(this.vaultPath, fullPath);

        // Skip hidden folders like .obsidian, .git, etc.
        if (entry.name.startsWith('.')) continue;

        if (entry.isDirectory()) {
          scanDir(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
          try {
            const rawContent = fs.readFileSync(fullPath, 'utf-8');
            const parsed = matter(rawContent);
            const stats = fs.statSync(fullPath);

            const title =
              parsed.data.title ||
              entry.name.replace(/\.md$/, '');
            const tier = typeof parsed.data.tier === 'number' ? parsed.data.tier : 4;
            const branchInfo = this.determineBranch(relPath, tier, title);

            const tags = Array.isArray(parsed.data.tags)
              ? parsed.data.tags
              : parsed.data.tags
              ? [parsed.data.tags]
              : [];

            const wikilinks = this.extractWikilinks(parsed.content, parsed.data);
            const headings = this.extractHeadings(parsed.content);
            const wordCount = parsed.content.trim().split(/\s+/).filter(Boolean).length;

            const noteId = relPath.replace(/\\/g, '/').replace(/\.md$/, '');

            const noteItem: NoteItem = {
              id: noteId,
              title,
              path: fullPath,
              relativePath: relPath.replace(/\\/g, '/'),
              branch: branchInfo.branch,
              branchLabel: branchInfo.branchLabel,
              branchColor: branchInfo.branchColor,
              tier,
              category: parsed.data.category || 'general',
              type: parsed.data.type || 'leaf',
              status: parsed.data.status || 'active',
              tags,
              created: parsed.data.created || stats.birthtime.toISOString().split('T')[0],
              updated: parsed.data.updated || stats.mtime.toISOString().split('T')[0],
              parent: parsed.data.parent || null,
              content: parsed.content,
              rawContent,
              frontmatter: parsed.data,
              links: wikilinks,
              backlinks: [], // will calculate in pass 2
              wordCount,
              size: stats.size,
              headings,
            };

            newCache.set(noteId, noteItem);
          } catch (err) {
            console.error(`[VaultService] Error reading file ${fullPath}:`, err);
          }
        }
      }
    };

    scanDir(this.vaultPath);

    // Pass 2: Calculate Backlinks and normalize link references
    for (const [sourceId, note] of newCache.entries()) {
      for (const rawLink of note.links) {
        // Resolve link by ID, relative path, or title
        let targetId = rawLink.replace(/\\/g, '/').replace(/\.md$/, '');
        let targetNote = newCache.get(targetId);

        if (!targetNote) {
          // Try to match by base note name (e.g. "EJPT Commands — Hub")
          for (const [k, v] of newCache.entries()) {
            if (v.title === rawLink || path.basename(k) === rawLink || v.relativePath === rawLink) {
              targetNote = v;
              targetId = k;
              break;
            }
          }
        }

        if (targetNote && !targetNote.backlinks.includes(sourceId)) {
          targetNote.backlinks.push(sourceId);
        }
      }
    }

    this.notesCache = newCache;
    this.buildGraph();
    this.extractCommands();
    this.lastIndexed = Date.now();

    console.log(`[VaultService] Indexed ${this.notesCache.size} notes from ${this.vaultPath}`);
    return this.notesCache;
  }

  /**
   * Build 2D / 3D Force Graph Topology
   */
  private buildGraph() {
    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];

    for (const [id, note] of this.notesCache.entries()) {
      const linkCount = note.links.length + note.backlinks.length;
      // Calculate node importance value: Tier 0 = largest (30), Tier 1 = (22), Tier 2 = (16), Tier 3 = (10), Tier 4 = (6)
      const baseVal = note.tier === 0 ? 35 : note.tier === 1 ? 24 : note.tier === 2 ? 16 : note.tier === 3 ? 10 : 6;
      const val = baseVal + Math.min(linkCount * 1.5, 15);

      nodes.push({
        id: note.id,
        label: note.title,
        path: note.relativePath,
        branch: note.branch,
        branchColor: note.branchColor,
        tier: note.tier,
        category: note.category,
        tags: note.tags,
        val,
        linkCount,
      });

      // Links from parent relationship or wikilinks
      for (const rawLink of note.links) {
        let targetId = rawLink.replace(/\\/g, '/').replace(/\.md$/, '');
        if (!this.notesCache.has(targetId)) {
          for (const [k, v] of this.notesCache.entries()) {
            if (v.title === rawLink || path.basename(k) === rawLink || v.relativePath === rawLink) {
              targetId = k;
              break;
            }
          }
        }

        if (this.notesCache.has(targetId)) {
          links.push({
            source: note.id,
            target: targetId,
            type: note.parent && note.parent.includes(rawLink) ? 'parent' : 'wikilink',
          });
        }
      }
    }

    this.graphCache = { nodes, links };
  }

  /**
   * Extract Cybersecurity and Sysadmin Commands across the vault
   */
  private extractCommands() {
    const commands: CommandItem[] = [];

    // Catalog of primary cybersecurity tools & cheatsheet commands
    const builtInCommands: Omit<CommandItem, 'id'>[] = [
      {
        title: 'Nmap Full TCP Port Fast Scan & Service Versioning',
        tool: 'nmap',
        category: 'Recon & Network Scanning',
        command: 'nmap -sC -sV -p- -T4 --min-rate 1000 -oA full_scan <TARGET_IP>',
        description: 'Comprehensive all-ports TCP scan with standard scripts, version detection, and output capture.',
        flags: ['-sC', '-sV', '-p-', '-T4', '--min-rate 1000', '-oA'],
        parameters: [
          { name: 'TARGET_IP', placeholder: '10.10.10.1', description: 'Target machine IP or hostname' }
        ],
        branch: 'certs',
        tags: ['nmap', 'recon', 'port-scan', 'ejpt'],
        sourceNote: '01 Certifications/EJPT Certification/Commands/Nmap Commands & Flag Cheatsheet'
      },
      {
        title: 'Nmap Fast UDP Top 100 Ports Discovery',
        tool: 'nmap',
        category: 'Recon & Network Scanning',
        command: 'sudo nmap -sU --top-ports 100 -sV -T4 <TARGET_IP>',
        description: 'Scan top 100 UDP ports for open services like SNMP, DNS, TFTP, NTP.',
        flags: ['-sU', '--top-ports 100', '-sV', '-T4'],
        parameters: [
          { name: 'TARGET_IP', placeholder: '10.10.10.1', description: 'Target host IP' }
        ],
        branch: 'certs',
        tags: ['nmap', 'udp', 'recon'],
        sourceNote: '01 Certifications/EJPT Certification/Commands/Nmap Commands & Flag Cheatsheet'
      },
      {
        title: 'Gobuster Directory Brute-Force with Common Extensions',
        tool: 'gobuster',
        category: 'Web Enumeration & Fuzzing',
        command: 'gobuster dir -u http://<TARGET_IP>:<PORT>/ -w <WORDLIST> -x php,html,js,txt,json -t 50 -k',
        description: 'Multi-threaded HTTP directory and file brute forcing with custom file extensions.',
        flags: ['dir', '-u', '-w', '-x', '-t', '-k'],
        parameters: [
          { name: 'TARGET_IP', placeholder: '10.10.10.1', description: 'Target host' },
          { name: 'PORT', placeholder: '80', defaultValue: '80', description: 'Web port' },
          { name: 'WORDLIST', placeholder: '/usr/share/wordlists/dirb/common.txt', defaultValue: '/usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt', description: 'Wordlist path' }
        ],
        branch: 'certs',
        tags: ['gobuster', 'web', 'dir-bust', 'fuzzing'],
        sourceNote: '01 Certifications/EJPT Certification/Commands/Gobuster & Ffuf Directory Fuzzing'
      },
      {
        title: 'Ffuf Virtual Host Subdomain Fuzzing',
        tool: 'ffuf',
        category: 'Web Enumeration & Fuzzing',
        command: 'ffuf -u http://<TARGET_DOMAIN> -H "Host: FUZZ.<TARGET_DOMAIN>" -w <WORDLIST> -fs <FILTER_SIZE>',
        description: 'Fuzz HTTP virtual host headers to discover internal hidden subdomains while filtering default response size.',
        flags: ['-u', '-H', '-w', '-fs'],
        parameters: [
          { name: 'TARGET_DOMAIN', placeholder: 'target.local', description: 'Root domain or IP' },
          { name: 'WORDLIST', placeholder: '/usr/share/wordlists/seclists/Discovery/DNS/subdomains-top1million-5000.txt', defaultValue: '/usr/share/wordlists/seclists/Discovery/DNS/subdomains-top1million-5000.txt' },
          { name: 'FILTER_SIZE', placeholder: '4242', description: 'HTTP response size to filter out' }
        ],
        branch: 'certs',
        tags: ['ffuf', 'vhost', 'subdomain', 'web'],
        sourceNote: '01 Certifications/EJPT Certification/Commands/Gobuster & Ffuf Directory Fuzzing'
      },
      {
        title: 'Hydra SSH Password Brute-Force',
        tool: 'hydra',
        category: 'Authentication & Password Cracking',
        command: 'hydra -l <USERNAME> -P <WORDLIST> ssh://<TARGET_IP> -t 4 -V -f',
        description: 'Fast online dictionary attack against SSH service with early exit on success.',
        flags: ['-l', '-P', '-t 4', '-V', '-f'],
        parameters: [
          { name: 'USERNAME', placeholder: 'root', defaultValue: 'root', description: 'Target user' },
          { name: 'WORDLIST', placeholder: '/usr/share/wordlists/rockyou.txt', defaultValue: '/usr/share/wordlists/rockyou.txt' },
          { name: 'TARGET_IP', placeholder: '10.10.10.1', description: 'Target IP' }
        ],
        branch: 'certs',
        tags: ['hydra', 'ssh', 'brute-force', 'passwords'],
        sourceNote: '01 Certifications/EJPT Certification/Commands/Hydra & Medusa Password Cracking'
      },
      {
        title: 'SQLmap Automated SQL Injection & Database Dump',
        tool: 'sqlmap',
        category: 'Vulnerability Exploitation',
        command: 'sqlmap -u "http://<TARGET_IP>/page.php?id=1" --batch --dbs --risk=3 --level=5 --random-agent',
        description: 'Automatic detection and exploitation of SQL injection vulnerabilities and schema enumeration.',
        flags: ['-u', '--batch', '--dbs', '--risk=3', '--level=5', '--random-agent'],
        parameters: [
          { name: 'TARGET_IP', placeholder: '10.10.10.1', description: 'Vulnerable target URL' }
        ],
        branch: 'certs',
        tags: ['sqlmap', 'sqli', 'database', 'web-exploit'],
        sourceNote: '01 Certifications/EJPT Certification/Commands/SQLmap Database Exploitation'
      },
      {
        title: 'Metasploit Msfvenom Linux x64 Staged Reverse TCP ELF',
        tool: 'msfvenom',
        category: 'Payload Generation & Shells',
        command: 'msfvenom -p linux/x64/meterpreter/reverse_tcp LHOST=<LHOST> LPORT=<LPORT> -f elf -o shell.elf',
        description: 'Generate executable ELF payload for 64-bit Linux target connecting back to Meterpreter multi/handler.',
        flags: ['-p', 'LHOST', 'LPORT', '-f elf', '-o'],
        parameters: [
          { name: 'LHOST', placeholder: '10.10.14.X', description: 'Attacker IP' },
          { name: 'LPORT', placeholder: '4444', defaultValue: '4444', description: 'Listening port' }
        ],
        branch: 'certs',
        tags: ['msfvenom', 'payload', 'reverse-shell', 'linux'],
        sourceNote: '01 Certifications/EJPT Certification/Commands/Metasploit Framework & Msfvenom'
      },
      {
        title: 'Netcat Reverse Shell Listener with PTY Stabilization',
        tool: 'netcat',
        category: 'Payload Generation & Shells',
        command: 'nc -lvnp <LPORT>',
        description: 'Start standard Netcat listener. Post-connect stabilization: python3 -c "import pty; pty.spawn(\'/bin/bash\')" followed by Ctrl+Z, stty raw -echo; fg.',
        flags: ['-l', '-v', '-n', '-p'],
        parameters: [
          { name: 'LPORT', placeholder: '9001', defaultValue: '9001', description: 'Listening Port' }
        ],
        branch: 'certs',
        tags: ['netcat', 'listener', 'reverse-shell', 'pty'],
        sourceNote: '01 Certifications/EJPT Certification/Commands/Netcat & Socat Reverse Shells'
      },
      {
        title: 'SSH Local Port Forwarding (Pivoting)',
        tool: 'ssh',
        category: 'Pivoting & Tunneling',
        command: 'ssh -L <LOCAL_PORT>:<INTERNAL_TARGET_IP>:<REMOTE_PORT> <USER>@<PIVOT_HOST_IP> -N',
        description: 'Tunnels local port traffic through compromised pivot jump host into isolated internal network subnet.',
        flags: ['-L', '-N'],
        parameters: [
          { name: 'LOCAL_PORT', placeholder: '8080', defaultValue: '8080', description: 'Port on attacker machine' },
          { name: 'INTERNAL_TARGET_IP', placeholder: '192.168.1.100', description: 'Internal target IP unreachable directly' },
          { name: 'REMOTE_PORT', placeholder: '80', defaultValue: '80', description: 'Target internal port' },
          { name: 'USER', placeholder: 'kali', description: 'Pivot host username' },
          { name: 'PIVOT_HOST_IP', placeholder: '10.10.10.50', description: 'Public facing pivot host' }
        ],
        branch: 'certs',
        tags: ['ssh', 'pivoting', 'tunneling', 'lateral-movement'],
        sourceNote: '01 Certifications/EJPT Certification/Commands/SSH Tunneling & Pivoting Commands'
      },
      {
        title: 'Linux Privilege Escalation SUID Discovery',
        tool: 'bash',
        category: 'Privilege Escalation',
        command: 'find / -perm -u=s -type f 2>/dev/null',
        description: 'Searches entire filesystem for binaries with SUID bit set for GTFOBins exploitation.',
        flags: ['-perm -u=s', '-type f', '2>/dev/null'],
        parameters: [],
        branch: 'certs',
        tags: ['privesc', 'linux', 'suid', 'gtfobins'],
        sourceNote: '01 Certifications/EJPT Certification/Notes/Privilege Escalation — Linux'
      },
      {
        title: 'Windows PowerShell Unquoted Service Path & Service Permissions',
        tool: 'powershell',
        category: 'Privilege Escalation',
        command: 'Get-WmiObject win32_service | Select-Object Name, State, PathName | Where-Object {$_.State -like \'Running\'}',
        description: 'Inspect all running Windows services and their executable binary paths for unquoted path vulnerabilities.',
        flags: [],
        parameters: [],
        branch: 'certs',
        tags: ['privesc', 'windows', 'powershell', 'services'],
        sourceNote: '01 Certifications/EJPT Certification/Notes/Privilege Escalation — Windows'
      },
      {
        title: 'Docker Container Security Inspection & Escape Audit',
        tool: 'docker',
        category: 'Sysadmin & Cloud Security',
        command: 'docker inspect --format=\'{{.HostConfig.Privileged}} - {{.HostConfig.CapAdd}}\' <CONTAINER_ID>',
        description: 'Verify if Docker container has privileged flags or elevated Linux capabilities (CAP_SYS_ADMIN, etc.).',
        flags: ['inspect', '--format'],
        parameters: [
          { name: 'CONTAINER_ID', placeholder: 'container_name_or_id', description: 'Target Docker container ID' }
        ],
        branch: 'kb',
        tags: ['docker', 'containers', 'security', 'sysadmin'],
        sourceNote: '04 Knowledge Base/Commands/Docker & Container Security Commands'
      },
      {
        title: 'Git Reflog & Catastrophic Branch Recovery',
        tool: 'git',
        category: 'Sysadmin & DevOps',
        command: 'git reflog && git checkout -b recovery-branch <COMMIT_HASH>',
        description: 'Inspect complete reference log of all HEAD movements and restore deleted commits or hard-reset branches.',
        flags: ['reflog', 'checkout -b'],
        parameters: [
          { name: 'COMMIT_HASH', placeholder: 'a1b2c3d', description: 'Target commit hash from reflog' }
        ],
        branch: 'kb',
        tags: ['git', 'devops', 'sysadmin', 'recovery'],
        sourceNote: '04 Knowledge Base/Commands/Git Advanced Workflows & Disaster Recovery'
      }
    ];

    let idCounter = 1;
    for (const cmd of builtInCommands) {
      commands.push({
        id: `cmd-${idCounter++}`,
        ...cmd,
      });
    }

    // Now scan through the notesCache for any inline code blocks or command notes
    for (const note of this.notesCache.values()) {
      if (note.relativePath.includes('Commands') || note.tags.includes('command')) {
        const codeBlockRegex = /```(?:bash|sh|powershell|cmd|zsh)?\s*\n([\s\S]*?)\n```/g;
        let blockMatch;
        while ((blockMatch = codeBlockRegex.exec(note.content)) !== null) {
          const rawLines = blockMatch[1].split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));
          for (const line of rawLines) {
            // Check if line looks like a command and not already added
            if (line.length > 5 && !commands.some(c => c.command === line)) {
              // Extract tool name from first token
              const firstToken = line.split(' ')[0].replace(/^sudo\s+/, '');
              const params: CommandItem['parameters'] = [];
              const paramMatches = line.match(/<([A-Z0-9_-]+)>/g);
              if (paramMatches) {
                for (const p of paramMatches) {
                  const paramName = p.replace(/[<>]/g, '');
                  if (!params.some(item => item.name === paramName)) {
                    params.push({
                      name: paramName,
                      placeholder: paramName,
                    });
                  }
                }
              }

              commands.push({
                id: `cmd-${idCounter++}`,
                title: `${note.title} — ${firstToken}`,
                tool: firstToken,
                category: note.category || 'CLI Reference',
                command: line,
                description: `Extracted from ${note.title}`,
                parameters: params,
                sourceNote: note.relativePath,
                branch: note.branch,
                tags: [...note.tags, firstToken],
              });
            }
          }
        }
      }
    }

    this.commandsCache = commands;
  }

  // --- CRUD API Methods ---

  public getAllNotes(): NoteItem[] {
    return Array.from(this.notesCache.values());
  }

  public getNoteById(id: string): NoteItem | null {
    return this.notesCache.get(id) || null;
  }

  public getNoteByRelativePath(relPath: string): NoteItem | null {
    const clean = relPath.replace(/\\/g, '/').replace(/\.md$/, '');
    return this.notesCache.get(clean) || null;
  }

  public getGraphData(): GraphData {
    if (!this.graphCache) {
      this.buildGraph();
    }
    return this.graphCache || { nodes: [], links: [] };
  }

  public getCommands(): CommandItem[] {
    return this.commandsCache;
  }

  /**
   * Save / Create / Update a Note directly to disk
   */
  public async saveNote(
    relativePath: string,
    content: string,
    frontmatterUpdates?: Partial<Record<string, any>>
  ): Promise<NoteItem> {
    const fullPath = path.isAbsolute(relativePath)
      ? relativePath
      : path.join(this.vaultPath, relativePath.endsWith('.md') ? relativePath : `${relativePath}.md`);

    // Ensure parent directory exists
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    let existingData: Record<string, any> = {};
    if (fs.existsSync(fullPath)) {
      try {
        const existingFile = fs.readFileSync(fullPath, 'utf-8');
        const parsed = matter(existingFile);
        existingData = parsed.data || {};
      } catch (e) {
        // ignore
      }
    }

    const mergedData = {
      ...existingData,
      ...(frontmatterUpdates || {}),
      updated: new Date().toISOString().split('T')[0],
    };

    const newRawContent = matter.stringify(content, mergedData);
    fs.writeFileSync(fullPath, newRawContent, 'utf-8');

    // Reindex cache
    await this.reindex();

    const cleanRel = path.relative(this.vaultPath, fullPath).replace(/\\/g, '/').replace(/\.md$/, '');
    const updatedNote = this.notesCache.get(cleanRel);

    if (!updatedNote) {
      throw new Error(`Failed to retrieve saved note: ${cleanRel}`);
    }

    return updatedNote;
  }

  /**
   * Delete a note from disk
   */
  public async deleteNote(relativePath: string): Promise<boolean> {
    const fullPath = path.isAbsolute(relativePath)
      ? relativePath
      : path.join(this.vaultPath, relativePath.endsWith('.md') ? relativePath : `${relativePath}.md`);

    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      await this.reindex();
      return true;
    }
    return false;
  }

  /**
   * Create a Daily Note using Template
   */
  public async createDailyNote(customPriorities?: string[]): Promise<NoteItem> {
    const today = new Date().toISOString().split('T')[0];
    const fileName = `Daily Note — ${today}.md`;
    const relPath = path.join('04 Knowledge Base', 'Daily Logs', fileName);

    const priorities = customPriorities && customPriorities.length > 0
      ? customPriorities.map(p => `- [ ] ${p}`).join('\n')
      : `- [ ] eJPTv2: Review Web Application & Host Penetration Testing\n- [ ] Code: Refactor Async Network Scanner core engine\n- [ ] AI OS: Evaluate Memory & Backlink Agent performance`;

    const content = `
# 📅 Daily Log — ${today}
**⬆️ Parent:** [[🏛 Zakarya Oukil — Master Root]]

---

## 🎯 Top Priorities & Target Milestones
${priorities}

---

## 🛡️ Cybersecurity & Pentesting Operations
- **Target / Lab:** 
- **Methodology Applied:** 
- **Findings & Exploits:** 

---

## 💻 Software Engineering & System Building
- **Module:** 
- **Architecture Notes:** 
- **Key Code Snippet / Commit:** 

---

## 💡 Insights & Second Brain Reflections
- *Daily Retrospective:* 
`;

    const frontmatter = {
      title: `Daily Note — ${today}`,
      type: 'leaf',
      category: 'daily-log',
      tier: 4,
      status: 'active',
      tags: ['daily-note', 'journal', 'recon'],
      created: today,
      updated: today,
      parent: '[[🏛 Zakarya Oukil — Master Root]]',
    };

    return await this.saveNote(relPath, content.trim(), frontmatter);
  }

  /**
   * Get Coding Projects Kanban status
   */
  public getProjectsKanban(): ProjectKanbanItem[] {
    const projects: ProjectKanbanItem[] = [
      {
        id: 'proj-1',
        title: 'Async Network Scanner',
        category: 'Python',
        status: 'In-Progress',
        tier: 3,
        path: '02 Coding Projects/Python/Async Network Scanner/Project Overview — Async Network Scanner',
        description: 'High-speed asynchronous port scanner & service banner grabber using Python asyncio & raw sockets.',
        progress: 68,
        tags: ['python', 'asyncio', 'networking', 'scanner'],
      },
      {
        id: 'proj-2',
        title: 'Security Recon Dashboard',
        category: 'Web Development',
        status: 'In-Progress',
        tier: 3,
        path: '02 Coding Projects/Web Development/Security Recon Dashboard/Project Overview — Security Recon Dashboard',
        description: 'Interactive web UI for real-time asset discovery, subdomain tracking, and port visualizer.',
        progress: 85,
        tags: ['react', 'recon', 'dashboard', 'cyberpunk'],
      },
      {
        id: 'proj-3',
        title: 'Vault Auto-Sync & Backup Engine',
        category: 'Automation Scripts',
        status: 'Completed',
        tier: 3,
        path: '02 Coding Projects/Automation Scripts/Vault Auto-Sync & Backup Engine/Project Overview — Vault Auto-Sync',
        description: 'Automated daemon watching Obsidian notes with continuous git versioning & encrypted backup.',
        progress: 100,
        tags: ['automation', 'backup', 'git', 'daemon'],
      },
      {
        id: 'proj-4',
        title: 'Obsidian Local Second Brain Agent',
        category: 'AI Agents',
        status: 'In-Progress',
        tier: 3,
        path: '02 Coding Projects/AI Agents/Obsidian Local Second Brain Agent/Project Overview — Obsidian Agent',
        description: 'Autonomous local AI agent utilizing RAG and graph embeddings over Obsidian markdown files.',
        progress: 74,
        tags: ['ai-agent', 'rag', 'llm', 'second-brain'],
      },
      {
        id: 'proj-5',
        title: 'Custom Exploit Stager & Payload Crafter',
        category: 'Security Tools',
        status: 'Planning',
        tier: 3,
        path: '02 Coding Projects/Security Tools/Custom Exploit Stager & Payload Crafter/Project Overview — Payload Crafter',
        description: 'Polymorphic shellcode encoder and dynamic multi-stage payload delivery generator.',
        progress: 35,
        tags: ['exploit', 'c', 'assembly', 'stager'],
      },
    ];

    return projects;
  }

  /**
   * Compute Overall Telemetry Statistics
   */
  public getTelemetryStats(): TelemetryStats {
    const totalNotes = this.notesCache.size;
    let totalLinks = 0;
    const allTags = new Set<string>();
    const branchCounts: Record<string, number> = {
      nucleus: 0,
      certs: 0,
      coding: 0,
      aios: 0,
      kb: 0,
      templates: 0,
      other: 0,
    };
    const tierCounts: Record<number, number> = {
      0: 0,
      1: 0,
      2: 0,
      3: 0,
      4: 0,
    };

    let orphanCount = 0;

    for (const note of this.notesCache.values()) {
      totalLinks += note.links.length;
      note.tags.forEach(t => allTags.add(t));
      branchCounts[note.branch] = (branchCounts[note.branch] || 0) + 1;
      tierCounts[note.tier] = (tierCounts[note.tier] || 0) + 1;

      if (note.tier > 0 && note.links.length === 0 && note.backlinks.length === 0) {
        orphanCount++;
      }
    }

    const healthScore = Math.max(
      60,
      Math.round(100 - (orphanCount * 2) + Math.min(20, totalLinks / totalNotes * 5))
    );

    return {
      totalNotes,
      totalLinks,
      totalTags: allTags.size,
      totalCommands: this.commandsCache.length,
      branchCounts,
      tierCounts,
      ejptReadiness: {
        percentage: 42,
        currentCourse: 'Course 3: Host & Network Pentesting — Enumeration',
        completedModules: 2,
        totalModules: 5,
        completedLabs: 3,
        totalLabs: 7,
        indexedCommands: this.commandsCache.length,
        currentStage: {
          courseName: 'Host & Network Penetration Testing',
          subModule: 'Service & Host Enumeration',
          progress: 88,
          remainingTasks: [
            'SMTP Enumeration Video',
            'Enumeration Module Quiz',
            'Enumeration Hands-on Lab',
            'Enumeration CTF Challenge',
          ],
        },
        categories: [
          { name: '1. Assessment Methodologies & Info Gathering', progress: 100, status: 'Mastered' },
          { name: '2. Network Scanning & Port Discovery', progress: 100, status: 'Mastered' },
          { name: '3. Host & Network Pentesting (Enumeration)', progress: 88, status: 'In Progress (Active)' },
          { name: '4. Vulnerability Assessment & Exploitation', progress: 0, status: 'Queued' },
          { name: '5. Web Application Penetration Testing', progress: 0, status: 'Queued' },
        ],
      },
      vaultHealth: {
        orphanCount,
        brokenLinksCount: 0,
        healthScore,
      },
    };
  }
}

export const vaultService = new VaultService();
