# 🏛 Zak_OS — JARVIS Personal Second Brain & Agentic Web OS

A futuristic, high-performance **Cyberpunk HUD Glassmorphism** Web OS and Second Brain Dashboard for **Zakarya Oukil**, directly integrated with his local 115-note Obsidian Vault at `C:\Users\Zakar\Documents\Obsidian\My_Vault`.

---

## 🌟 6 Radial Taxonomy Branches & Color Matrix
- 🟡 **Tier 0: Master Nucleus Center** — `#FFD700` (`🏛 Zakarya Oukil — Master Root.md`)
- 🟢 **Branch 1: 01 Certifications** — `#10B981` (eJPTv2 Suite, Courses, Notes, Commands, CTF Labs, Cheatsheets)
- 🔵 **Branch 2: 02 Coding Projects** — `#3B82F6` (Python Async Scanner, Security Recon, Vault Sync, AI Agents)
- 🟣 **Branch 3: 03 AI OS — Agentic System** — `#A855F7` (6 Specialized Agents, 4 Workflows, 4 Prompt Catalogs)
- 🟠 **Branch 4: 04 Knowledge Base** — `#F97316` (TCP/IP Protocols, Burp Suite, Wireshark, Ghidra, Docker, Git)
- 🌸 **Branch 5: 05 Templates** — `#EC4899` (8 Parameterized Obsidian Templates)

---

## 🚀 Key Modules Built

### 1. 🌟 Module 1: Omni-Search & Command Matrix (`Ctrl + K` / `Cmd + K`)
- **Spotlight/Raycast Overlay**: Real-time fuzzy-search across all 115 vault notes, tags, and category tiers.
- **Cyber Command Matrix**: 100+ offensive cybersecurity & sysadmin commands (Nmap, Gobuster, SQLmap, Hydra, Metasploit, Socat, Docker, Git).
- **Live Parameter Substitution**: Dynamic inputs for `<TARGET_IP>`, `<PORT>`, `<WORDLIST>`, `<LHOST>`, `<LPORT>`, `<USER>`, `<PASS>` with one-click copy and instant toast notifications.
- **+ Add New Command Modal**: Add new commands with custom tools, flags, and descriptions that automatically create/update markdown files in the vault.

### 2. 🕸️ Module 2: Interactive 2D / 3D Force Graph Explorer
- **6-Branch Radial Tree Simulation**: Visual force simulation displaying all 115 notes and 240+ cross-links.
- **Glow & Particle Halos**: Color-coded halos according to the 6 vault taxonomy colors.
- **Node Inspection Card**: Displays incoming backlinks, outgoing wikilinks, word count, tags, and an "Open in Studio" button.
- **Branch & Tier Toggles**: Filter by Level 0-4 or specific branches.
- **Focus Center Button**: Smoothly re-centers viewport on Master Root (`🏛 Zakarya Oukil — Master Root`).

### 3. 📝 Module 3: Monaco Markdown Studio & Recon Cockpit
- **Dual-Pane Studio**: Monaco Editor on the left + Live HUD Markdown Preview on the right.
- **Syntax Highlighting**: Bash, Python, PowerShell, JSON, YAML, PHP, C, SQL.
- **Diagrams & Math**: Integrated live Mermaid.js graph rendering and KaTeX math formula visualizer.
- **Frontmatter Inspector**: Interactive badge tags (Status, Difficulty, Target IP, Tier, Category).
- **Live 2-Way Disk Sync**: Direct filesystem read/write to `C:\Users\Zakar\Documents\Obsidian\My_Vault` with `Ctrl+S` hotkey and automated backups.
- **Wikilink Navigation**: Clicking any `[[Note Name]]` instantly navigates to that note in the studio.

### 4. 🤖 Module 4: Autonomous AI Agent Cockpit ("JARVIS CREW")
Interfaces with all 6 specialized AI agents:
1. 🔍 **Research Agent (ORACLE-01)**: OSINT, CVE lookups, threat intelligence.
2. 💻 **Coding Agent (ARCHITECT-02)**: Python asyncio, fullstack TypeScript, concurrency architectures.
3. 🛡️ **Pentesting Agent (SPECTRE-03)**: eJPTv2 methodology, exploit chains, SUID privilege escalation, pivoting.
4. 📖 **Study Agent (SOCRATES-04)**: Socratic quizzer, eJPT flashcards, active recall spaced repetition.
5. 📑 **Summarization Agent (SYNTHESIS-05)**: Executive note summaries, high-density takeaways.
6. 🗄️ **Memory Agent (CHRONOS-06)**: Orphan note detection, cross-branch wikilink recommendations.
- **Save Output to Vault**: One-click action saving agent output directly into a new or existing note.

### 5. 📊 Module 5: Mission Control Telemetry & Daily Logger
- **eJPTv2 Readiness Radar**: Tracks progress across Assessment Methodologies, Host & Network Pentesting, Web Application Pentesting, and Next-Gen Cloud modules.
- **Coding Projects Kanban**: Interactive status tracking for active engineering suites.
- **Quick Daily Note Initializer**: One-click button creating today's structured daily note in `04 Knowledge Base/Daily Logs/`.

---

## 🛠️ Quick Launch Instructions

### 1. Launch Dev Mode (Server + Client concurrently)
```bash
cd "c:\Users\Zakar\Documents\Web_Dev\Zak_OS"
npm run dev
```
- **Web Dashboard**: `http://localhost:3000`
- **Backend API & WebSockets**: `http://localhost:4000`

### 2. Standalone Commands
```bash
# Start backend server only
npm run server:dev

# Start frontend client only
npm run client:dev

# Production build
npm run build
```

---

## ⌨️ Global Keyboard Shortcuts
- `Ctrl + K` / `Cmd + K`: Open Omni-Search & Command Palette
- `Ctrl + S` / `Cmd + S`: Save active note to Obsidian disk in Monaco Studio
- `ESC`: Close modals & overlays
