import React, { useState, useEffect } from 'react';
import { 
  Radar, 
  Globe, 
  ShieldAlert, 
  Mail, 
  Network, 
  FileText, 
  Code, 
  Sparkles, 
  Search, 
  ExternalLink, 
  Copy, 
  Check, 
  Save, 
  RefreshCw, 
  Terminal, 
  AlertTriangle, 
  ShieldCheck, 
  Newspaper, 
  Cpu, 
  Layers,
  Server,
  MapPin,
  FolderTree,
  FolderSearch,
  Lock,
  CheckCircle,
  FileCode
} from 'lucide-react';
import { marked } from 'marked';
import { ScrapedResult, ThreatAnalysis, CybersecNewsItem } from '../../types';
import { api } from '../../services/api';

interface WebScraperIntelViewProps {
  onSaveToVaultNote: (title: string, content: string, branch: string, category: string) => void;
}

type ScraperTab = 'intel' | 'emails' | 'subdomains' | 'folders' | 'security' | 'osint' | 'links' | 'metadata' | 'text' | 'raw';
type PipelineMode = 'recon' | 'cve' | 'security' | 'ai';

export const WebScraperIntelView: React.FC<WebScraperIntelViewProps> = ({
  onSaveToVaultNote
}) => {
  const [pipelineMode, setPipelineMode] = useState<PipelineMode>('recon');
  const [targetUrl, setTargetUrl] = useState('https://example.com');
  const [isCrawling, setIsCrawling] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [crawledData, setCrawledData] = useState<ScrapedResult | null>(null);
  const [threatAnalysis, setThreatAnalysis] = useState<ThreatAnalysis | null>(null);
  const [activeTab, setActiveTab] = useState<ScraperTab>('intel');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [consoleLog, setConsoleLog] = useState<string[]>([]);
  const [subdomainFilter, setSubdomainFilter] = useState('');
  const [emailFilter, setEmailFilter] = useState('');

  const filteredEmails = (crawledData?.emails || []).filter(e => 
    e.toLowerCase().includes(emailFilter.toLowerCase())
  );
  const filteredSubdomains = (crawledData?.subdomains || []).filter(s => 
    s.toLowerCase().includes(subdomainFilter.toLowerCase())
  );

  // News Pipeline State
  const [newsItems, setNewsItems] = useState<CybersecNewsItem[]>([]);
  const [isLoadingNews, setIsLoadingNews] = useState(false);
  const [selectedNewsAnalysis, setSelectedNewsAnalysis] = useState<{ title: string; briefing: string } | null>(null);
  const [isAnalyzingItem, setIsAnalyzingItem] = useState(false);

  const presets = [
    'his.edu.dz',
    '199.16.129.142',
    'https://owasp.org',
    'https://thehackernews.com'
  ];

  const log = (msg: string) => {
    setConsoleLog((prev) => [...prev.slice(-40), `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleRunRecon = async (urlToCrawl?: string) => {
    const url = (urlToCrawl || targetUrl).trim();
    if (!url || isCrawling) return;

    setIsCrawling(true);
    setCrawledData(null);
    setThreatAnalysis(null);
    log(`Initiating Scrapy spider 'zakos' against ${url}...`);
    log('Extracting: emails, subdomains, internal/external links, and page metadata...');

    try {
      const res = await api.crawlUrl(url, 'zakos');
      if (res.success && res.items && res.items.length > 0) {
        const item = res.items[0];
        setCrawledData(item);
        log(`Scrapy crawl completed! Harvested: ${item.emails.length} emails, ${item.subdomains.length} subdomains, ${item.links.total_internal + item.links.total_external} links.`);

        // Automatically trigger GPT-6 Astra Threat & Surface Analysis
        setIsAnalyzing(true);
        log('Transmitting extracted reconnaissance data to GPT-6 Astra (1.05M Context)...');
        try {
          const analysisRes = await api.analyzeScrapedData(item);
          if (analysisRes.success && analysisRes.analysis) {
            setThreatAnalysis(analysisRes.analysis);
            log(`GPT-6 Astra Threat Analysis complete! Assessment: ${analysisRes.analysis.threatLevel}`);
          }
        } catch (err: any) {
          log(`GPT-6 Astra analysis error: ${err.message}`);
        } finally {
          setIsAnalyzing(false);
        }
      } else {
        log('Scrapy returned no items for target.');
      }
    } catch (err: any) {
      log(`Error during crawl: ${err.message}`);
    } finally {
      setIsCrawling(false);
    }
  };

  const handleFetchNews = async (spider: string) => {
    setIsLoadingNews(true);
    setNewsItems([]);
    log(`Polling spider '${spider}' for intelligence feeds...`);
    try {
      const res = await api.getScraperNews(spider);
      if (res.success && res.items) {
        setNewsItems(res.items);
        log(`Loaded ${res.items.length} intelligence items from ${spider}.`);
      }
    } catch (e: any) {
      log(`Error fetching news feed: ${e.message}`);
    } finally {
      setIsLoadingNews(false);
    }
  };

  const handleAnalyzeFeedItem = async (item: CybersecNewsItem) => {
    setIsAnalyzingItem(true);
    setSelectedNewsAnalysis({ title: item.title, briefing: 'Transmitting item to GPT-6 Astra for threat triage...' });
    try {
      const res = await api.analyzeFeedItem(item);
      if (res.success && res.briefing) {
        setSelectedNewsAnalysis({ title: item.title, briefing: res.briefing });
      }
    } catch (e: any) {
      setSelectedNewsAnalysis({ title: item.title, briefing: `Analysis error: ${e.message}` });
    } finally {
      setIsAnalyzingItem(false);
    }
  };

  const handleSaveAnalysisToVault = () => {
    if (!crawledData) return;
    const isIp = Boolean(crawledData.osint?.is_ip);
    const targetIdentifier = crawledData.domain || (isIp ? (crawledData.osint?.target_ip || 'ip-target') : 'target');
    const cleanTarget = targetIdentifier.replace(/[^a-zA-Z0-9.-]/g, '_');
    
    // User requested: main folder "targets" and subfolder being target domain/ip
    const targetBranch = `targets/${cleanTarget}`;
    const title = `Recon-Report`;

    const osint = crawledData.osint;
    const dnsInfo = osint?.dns;
    const geo = osint?.geo || {};
    const sslCert = osint?.ssl_cert;
    const robotsTxt = osint?.robots_txt;
    const sensitiveFiles = osint?.sensitive_files || [];
    const threatLvl = threatAnalysis?.threatLevel || 'INFORMATIONAL';
    const today = new Date().toISOString().split('T')[0];

    const content = `
**Target URL:** \`${crawledData.url}\`  
**Classification:** \`${isIp ? 'Raw IPv4/IPv6 Host' : 'Registered Domain'}\`  
**HTTP Status:** \`${crawledData.metadata.status}\` | **Server Header:** \`${crawledData.metadata.server || 'None declared'}\`  
**Scan Timestamp:** \`${crawledData.scraped_at}\`  
**Assessed Risk Posture:** \`${threatLvl}\`

---

## 🌐 Network & Infrastructure OSINT
| Recon Parameter | Discovered Data |
|---|---|
| **Target Address** | \`${osint?.target_ip || (dnsInfo?.a?.[0] || 'N/A')}\` |
| **Reverse DNS (PTR)** | \`${osint?.reverse_dns?.join(', ') || 'None'}\` |
| **Autonomous System** | \`${geo.as || 'N/A'}\` |
| **Hosting ISP / Org** | \`${geo.isp || 'N/A'}\` — \`${geo.org || 'N/A'}\` |
| **Physical Geolocation** | \`${geo.city || 'N/A'}, ${geo.country || 'N/A'}\` |
| **Nameservers (NS)** | \`${dnsInfo?.ns?.join(', ') || 'N/A'}\` |
| **Mail Routing (MX)** | \`${dnsInfo?.mx?.map(m => `${m.exchange} (pri: ${m.priority})`).join(', ') || 'N/A'}\` |
| **TXT / SPF Origin** | \`${dnsInfo?.txt?.join(' \| ') || 'N/A'}\` |

---

## 🔒 SSL / TLS Certificate Recon
- **Common Name (CN):** \`${sslCert?.cn || 'N/A'}\`
- **Issuer Authority:** \`${sslCert?.issuer || 'N/A'}\`
- **Valid Window:** \`${sslCert?.validFrom || 'N/A'}\` to \`${sslCert?.validTo || 'N/A'}\`
- **Subject Alternative Names (SANs / Associated Hostnames):**
${sslCert?.sans && sslCert.sans.length > 0 ? sslCert.sans.map(s => `- \`${s}\``).join('\n') : '- None recorded'}

---

## 📂 Robots.txt & Folder Digging Audit
- **Disallowed Directories (${robotsTxt?.disallow?.length || 0}):**
${robotsTxt?.disallow && robotsTxt.disallow.length > 0 ? robotsTxt.disallow.map(p => `- \`${p}\``).join('\n') : '- None declared'}

- **Discovered Sitemaps (${robotsTxt?.sitemaps?.length || 0}):**
${robotsTxt?.sitemaps && robotsTxt.sitemaps.length > 0 ? robotsTxt.sitemaps.map(s => `- [${s}](${s})`).join('\n') : '- None declared'}

### 🔍 Sensitive Files & Endpoints Matrix (${sensitiveFiles.length})
| Path | Status | Source | Findings / Notes |
|---|---|---|---|
${sensitiveFiles.length > 0 ? sensitiveFiles.map(f => `| \`${f.path}\` | \`${f.status}\` | \`${f.source}\` | ${(f.notes || f.snippet || 'Accessible').slice(0, 80).replace(/\|/g, '\\|')} |`).join('\n') : '| None | - | - | - |'}

---

## 👥 Harvested Personnel & Contact Emails (${crawledData.emails.length})
${crawledData.emails.length > 0 ? crawledData.emails.map(e => `- 📧 \`${e}\``).join('\n') : '- Zero personnel emails harvested'}

---

## 🗺️ Discovered Subdomains & Hostnames (${crawledData.subdomains.length})
| Subdomain / Host | IP Address | Source |
|---|---|---|
${crawledData.subdomains.length > 0 ? crawledData.subdomains.map(s => {
  const detail = osint?.subdomains_detail?.find(d => d.subdomain === s);
  return `| [${s}](https://${s}) | \`${detail?.ip || 'Resolved'}\` | \`${detail?.source || 'crawl'}\` |`;
}).join('\n') : '| None | - | - |'}

---

## 🛡️ OWASP Security Headers Posture (Grade: ${osint?.security_headers?.grade || 'N/A'} - Score: ${osint?.security_headers?.score ?? 'N/A'}/100)
| Security Header | Status | Risk Level | Finding / Directive |
|---|---|---|---|
${osint?.security_headers?.findings ? osint.security_headers.findings.map(f => `| \`${f.header}\` | \`${f.status.toUpperCase()}\` | \`${f.importance}\` | ${(f.value || f.description).slice(0, 60).replace(/\|/g, '\\|')} |`).join('\n') : '| None | - | - | - |'}

---

## ⚡ Fingerprinted Technology Stack
${osint?.technologies && osint.technologies.length > 0 ? osint.technologies.map(t => `- **${t.name}** (\`${t.category}\`${t.version ? ` v${t.version}` : ''}) — Confidence: \`${t.confidence}\``).join('\n') : '- No specific technology components identified.'}

---

## ✉️ Email Anti-Spoofing & Phishing Posture (SPF & DMARC)
- **SPF Record:** \`${osint?.email_security?.spf?.record || 'None'}\`
  - **Verdict:** \`${osint?.email_security?.spf?.status || 'N/A'}\` — ${osint?.email_security?.spf?.description || ''}
  - **Authorized Relay Networks:** ${osint?.email_security?.spf?.relayNetworks?.join(', ') || 'None declared'}
- **DMARC Record:** \`${osint?.email_security?.dmarc?.record || 'None'}\`
  - **Policy Enforcement:** \`${osint?.email_security?.dmarc?.policy || 'none'}\` (\`${osint?.email_security?.dmarc?.status || 'missing'}\`)
  - **Assessment:** ${osint?.email_security?.dmarc?.description || ''}
  - **Reporting Mailbox:** \`${osint?.email_security?.dmarc?.ruaMailbox || 'None'}\`
- **Certificate Authority Authorization (CAA):** \`${osint?.email_security?.caa?.status || 'missing'}\` (${osint?.email_security?.caa?.authorizedCas?.join(', ') || 'Any CA permitted'})

---

## 📜 RFC 9116 security.txt & Vulnerability Disclosure Program
- **Status:** \`${osint?.security_txt?.exists ? 'Published & Active' : 'Not Published'}\`
- **Endpoint URL:** \`${osint?.security_txt?.url || 'N/A'}\`
- **Reporting Contact:** \`${osint?.security_txt?.contact?.join(', ') || 'None'}\`
- **Safe Harbor Policy:** \`${osint?.security_txt?.policy || 'None'}\`

---

## 📋 Public Registration & Network Allocation (RDAP)
- **Network / Domain Name:** \`${osint?.rdap?.name || 'N/A'}\`
- **Registry Handle:** \`${osint?.rdap?.handle || 'N/A'}\`
- **Allocated IP Range:** \`${osint?.rdap?.startAddress ? `${osint.rdap.startAddress} — ${osint.rdap.endAddress}` : 'N/A'}\`
- **Registrar:** \`${osint?.rdap?.registrar || 'N/A'}\`

---

## 🌐 Certificate Transparency Logs (crt.sh)
- **Passive Subdomains Discovered:** \`${osint?.ct_subdomains_count || 0}\` historical & active subdomains mined from public CA logs without sending traffic to the target.

---

## 🧠 GPT-6 Astra Threat & Surface Assessment
${threatAnalysis ? threatAnalysis.rawAnalysis : '*Threat triage not run yet.*'}
`;

    onSaveToVaultNote(title, content, targetBranch, 'target-intel');
    setSaveSuccessMsg(`${targetBranch}/${title}.md`);
    setTimeout(() => setSaveSuccessMsg(null), 6000);
  };

  return (
    <div className="h-[84vh] flex flex-col bg-[#0B0D10] border border-white/[0.08] rounded-3xl overflow-hidden shadow-2xl font-mono text-xs text-white">
      {/* 🚀 TOP COCKPIT: CONTROL DECK */}
      <div className="p-4 bg-[#12151B]/90 backdrop-blur-xl border-b border-white/[0.08] flex flex-col gap-3 shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#D4FF00]/15 border border-[#D4FF00]/30 flex items-center justify-center text-[#D4FF00]">
              <Radar className="w-4 h-4 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-sm tracking-wide text-white">
                  WEB SCRAPER & THREAT INTEL
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-[#D4FF00]/20 text-[#D4FF00] border border-[#D4FF00]/40">
                  Zyte Scrapy Cloud Ready
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  GPT-6 Astra 1.05M
                </span>
              </div>
              <p className="text-[11px] text-gray-400">
                Scrapy project with automated email harvesting, subdomain mapping, and AI risk analysis.
              </p>
            </div>
          </div>

          {/* Pipeline Mode Switcher */}
          <div className="flex items-center bg-[#0B0D10] p-1 rounded-2xl border border-white/[0.08]">
            <button
              onClick={() => setPipelineMode('recon')}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                pipelineMode === 'recon'
                  ? 'bg-[#D4FF00] text-black shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Target Recon</span>
            </button>
            <button
              onClick={() => {
                setPipelineMode('cve');
                handleFetchNews('cve_feed');
              }}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                pipelineMode === 'cve'
                  ? 'bg-rose-500 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>CVE Feeds</span>
            </button>
            <button
              onClick={() => {
                setPipelineMode('security');
                handleFetchNews('security_blogs');
              }}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                pipelineMode === 'security'
                  ? 'bg-sky-500 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Newspaper className="w-3.5 h-3.5" />
              <span>Security News</span>
            </button>
            <button
              onClick={() => {
                setPipelineMode('ai');
                handleFetchNews('ai_news');
              }}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                pipelineMode === 'ai'
                  ? 'bg-purple-500 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>AI Research</span>
            </button>
          </div>
        </div>

        {/* URL Target Bar (when in Recon mode) */}
        {pipelineMode === 'recon' && (
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <div className="relative flex-1 w-full">
              <input
                type="text"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="Enter target URL (e.g. https://example.com)..."
                disabled={isCrawling}
                className="w-full bg-[#0B0D10] border border-white/15 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#D4FF00] font-mono transition"
              />
            </div>

            <button
              onClick={() => handleRunRecon()}
              disabled={isCrawling || !targetUrl.trim()}
              className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-[#D4FF00] hover:bg-[#c6f500] disabled:opacity-40 text-black font-extrabold flex items-center justify-center gap-2 transition shadow-[0_0_20px_rgba(212,255,0,0.25)] active:scale-95 shrink-0"
            >
              {isCrawling ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>CRAWLING WITH SCRAPY...</span>
                </>
              ) : (
                <>
                  <Radar className="w-4 h-4" />
                  <span>RUN RECON CRAWL</span>
                </>
              )}
            </button>

            {/* Target Presets */}
            <div className="hidden xl:flex items-center gap-1.5 pl-2">
              <span className="text-[10px] text-gray-500">PRESETS:</span>
              {presets.map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    setTargetUrl(p);
                    handleRunRecon(p);
                  }}
                  className="px-2 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[10px] text-gray-300 hover:text-[#D4FF00] border border-white/[0.06] transition"
                >
                  {p.replace('https://', '')}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 🧭 MAIN SPLIT VIEW */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT COLUMN: RECON DETAILS OR NEWS FEED */}
        <div className="flex-1 flex flex-col overflow-hidden border-r border-white/[0.08]">
          {/* RECON PIPELINE VIEW */}
          {pipelineMode === 'recon' ? (
            crawledData ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Result Subtabs */}
                <div className="px-4 py-2 bg-[#12151B]/50 border-b border-white/[0.08] flex items-center justify-between gap-2 overflow-x-auto shrink-0">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setActiveTab('intel')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                        activeTab === 'intel'
                          ? 'bg-[#D4FF00]/20 text-[#D4FF00] border border-[#D4FF00]/40'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>GPT-6 Astra Intel</span>
                      {threatAnalysis && (
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-black ${
                          threatAnalysis.threatLevel === 'CRITICAL' ? 'bg-rose-500 text-white' :
                          threatAnalysis.threatLevel === 'HIGH' ? 'bg-amber-500 text-black' :
                          'bg-emerald-500 text-white'
                        }`}>
                          {threatAnalysis.threatLevel}
                        </span>
                      )}
                    </button>

                    <button
                      onClick={() => setActiveTab('emails')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                        activeTab === 'emails'
                          ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Emails ({crawledData.emails.length})</span>
                    </button>

                    <button
                      onClick={() => setActiveTab('subdomains')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                        activeTab === 'subdomains'
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <Network className="w-3.5 h-3.5" />
                      <span>Subdomains ({crawledData.subdomains.length})</span>
                    </button>

                    <button
                      onClick={() => setActiveTab('folders')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                        activeTab === 'folders'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <FolderTree className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Robots & Files ({crawledData.osint?.sensitive_files?.length || 0})</span>
                      {crawledData.osint?.robots_txt?.disallow && crawledData.osint.robots_txt.disallow.length > 0 && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded font-black bg-rose-500/30 text-rose-300">
                          {crawledData.osint.robots_txt.disallow.length} Disallow
                        </span>
                      )}
                    </button>

                    <button
                      onClick={() => setActiveTab('security')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                        activeTab === 'security'
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                      <span>Security & Tech</span>
                      {crawledData.osint?.security_headers && (
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-black ${
                          crawledData.osint.security_headers.grade === 'A+' || crawledData.osint.security_headers.grade === 'A'
                            ? 'bg-emerald-500/30 text-emerald-300'
                            : crawledData.osint.security_headers.grade === 'B' || crawledData.osint.security_headers.grade === 'C'
                            ? 'bg-amber-500/30 text-amber-300'
                            : 'bg-rose-500/30 text-rose-300'
                        }`}>
                          Grade {crawledData.osint.security_headers.grade}
                        </span>
                      )}
                    </button>

                    <button
                      onClick={() => setActiveTab('osint')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                        activeTab === 'osint'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <Globe className="w-3.5 h-3.5 text-amber-400" />
                      <span>DNS & OSINT</span>
                      {crawledData.osint?.dns?.mx && crawledData.osint.dns.mx.length > 0 && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded font-black bg-amber-500/30 text-amber-300">
                          {crawledData.osint.dns.mx.length} MX
                        </span>
                      )}
                    </button>

                    <button
                      onClick={() => setActiveTab('links')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                        activeTab === 'links'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Links ({crawledData.links.total_internal + crawledData.links.total_external})</span>
                    </button>

                    <button
                      onClick={() => setActiveTab('metadata')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                        activeTab === 'metadata'
                          ? 'bg-white/10 text-white border border-white/20'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Metadata</span>
                    </button>

                    <button
                      onClick={() => setActiveTab('text')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                        activeTab === 'text'
                          ? 'bg-white/10 text-white border border-white/20'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Page Text</span>
                    </button>

                    <button
                      onClick={() => setActiveTab('raw')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                        activeTab === 'raw'
                          ? 'bg-white/10 text-white border border-white/20'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <Code className="w-3.5 h-3.5" />
                      <span>Raw JSON</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {saveSuccessMsg && (
                      <div className="px-2.5 py-1 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold flex items-center gap-1.5 animate-pulse">
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>Saved: {saveSuccessMsg}</span>
                      </div>
                    )}
                    <button
                      onClick={handleSaveAnalysisToVault}
                      className="px-3 py-1.5 rounded-xl bg-[#D4FF00] hover:bg-[#c6f500] text-black font-extrabold transition flex items-center gap-1.5 shadow-[0_0_15px_rgba(212,255,0,0.3)] shrink-0 active:scale-95 text-xs"
                      title="Save full target dossier to Obsidian Vault under targets/<target>/Recon-Report.md"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>SAVE TARGET TO OBSIDIAN</span>
                    </button>
                  </div>
                </div>

                {/* Subtab Content Area */}
                <div className="flex-1 overflow-y-auto p-5">
                  {/* 1. GPT-6 ASTRA THREAT ASSESSMENT */}
                  {activeTab === 'intel' && (
                    <div className="space-y-4">
                      {isAnalyzing ? (
                        <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col items-center justify-center gap-3">
                          <Sparkles className="w-6 h-6 animate-spin text-[#D4FF00]" />
                          <span className="font-bold text-gray-300">
                            GPT-6 ASTRA ANALYZING ATTACK SURFACE (1.05M Context)...
                          </span>
                        </div>
                      ) : threatAnalysis ? (
                        <div className="p-6 rounded-3xl bg-[#12151B]/95 border border-white/[0.08] space-y-4 shadow-xl">
                          <div className="flex items-center justify-between border-b border-white/10 pb-3">
                            <div className="flex items-center gap-2">
                              <ShieldCheck className="w-5 h-5 text-[#10B981]" />
                              <h3 className="font-extrabold text-sm text-white uppercase">
                                Autonomous Threat & Attack Surface Briefing
                              </h3>
                            </div>
                            <span className="text-[10px] text-gray-400">
                              Generated by GPT-6 Astra
                            </span>
                          </div>

                          <div
                            className="prose prose-invert max-w-none text-xs leading-relaxed prose-headings:text-white prose-p:text-gray-300 prose-code:text-[#D4FF00] prose-code:bg-[#0B0D10] prose-code:px-1 prose-code:py-0.5 prose-code:rounded"
                            dangerouslySetInnerHTML={{
                              __html: marked.parse(threatAnalysis.rawAnalysis, { async: false }) as string,
                            }}
                          />
                        </div>
                      ) : (
                        <div className="p-8 text-center text-gray-500 font-mono">
                          Click "Run Recon Crawl" above to generate intelligence.
                        </div>
                      )}
                    </div>
                  )}

                  {/* 2. EMAILS DISCOVERED */}
                  {activeTab === 'emails' && (
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2 border-b border-white/10">
                        <div>
                          <span className="text-xs text-gray-400">
                            Discovered <strong>{crawledData.emails.length}</strong> personnel & contact emails:
                          </span>
                          {crawledData.osint?.crawled_pages && (
                            <span className="text-[10px] text-sky-400 ml-2">
                              (Scraped across {crawledData.osint.crawled_pages.length} deep recon pages)
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <div className="relative flex-1 sm:w-48">
                            <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-2.5" />
                            <input
                              type="text"
                              value={emailFilter}
                              onChange={(e) => setEmailFilter(e.target.value)}
                              placeholder="Filter emails..."
                              className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-8 pr-2.5 py-1 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-sky-500"
                            />
                          </div>
                          {crawledData.emails.length > 0 && (
                            <button
                              onClick={() => handleCopy('all-emails', crawledData.emails.join('\n'))}
                              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 flex items-center gap-1.5 shrink-0"
                            >
                              {copiedKey === 'all-emails' ? <Check className="w-3 h-3 text-[#10B981]" /> : <Copy className="w-3 h-3" />}
                              <span>COPY ALL</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {filteredEmails.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                          {filteredEmails.map((email, idx) => {
                            const isPersonnel = !email.startsWith('contact@') && !email.startsWith('info@') && !email.startsWith('admin@');
                            return (
                              <div
                                key={idx}
                                className={`p-3 rounded-xl bg-white/[0.02] border flex items-center justify-between group transition ${
                                  isPersonnel ? 'border-sky-500/30 hover:border-sky-500/70 bg-sky-500/[0.02]' : 'border-white/[0.08] hover:border-white/20'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 truncate">
                                  <Mail className={`w-4 h-4 shrink-0 ${isPersonnel ? 'text-sky-400' : 'text-gray-400'}`} />
                                  <div className="truncate">
                                    <span className="font-mono text-xs text-white font-semibold block truncate">{email}</span>
                                    <span className="text-[9px] text-gray-400">
                                      {isPersonnel ? 'Target Personnel / Executive' : 'Department Contact / Role'}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 shrink-0 ml-2">
                                  <a
                                    href={`mailto:${email}`}
                                    className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-sky-400 transition"
                                    title="Send Email"
                                  >
                                    <Mail className="w-3.5 h-3.5" />
                                  </a>
                                  <button
                                    onClick={() => handleCopy('email-' + idx, email)}
                                    className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white transition"
                                    title="Copy Email"
                                  >
                                    {copiedKey === 'email-' + idx ? <Check className="w-3 h-3 text-[#10B981]" /> : <Copy className="w-3 h-3" />}
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="py-12 text-center text-gray-500">
                          {crawledData.emails.length === 0 ? 'No exposed emails found on target landing page.' : 'No emails match the filter.'}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 3. MAPPED SUBDOMAINS */}
                  {activeTab === 'subdomains' && (
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2 border-b border-white/10">
                        <span className="text-xs text-gray-400">
                          Discovered <strong>{crawledData.subdomains.length}</strong> related subdomains via OSINT & Crawling:
                        </span>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <div className="relative flex-1 sm:w-48">
                            <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-2.5" />
                            <input
                              type="text"
                              value={subdomainFilter}
                              onChange={(e) => setSubdomainFilter(e.target.value)}
                              placeholder="Filter subdomains..."
                              className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-8 pr-2.5 py-1 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                            />
                          </div>
                          {crawledData.subdomains.length > 0 && (
                            <button
                              onClick={() => handleCopy('all-subdomains', crawledData.subdomains.join('\n'))}
                              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 flex items-center gap-1.5 shrink-0"
                            >
                              {copiedKey === 'all-subdomains' ? <Check className="w-3 h-3 text-[#10B981]" /> : <Copy className="w-3 h-3" />}
                              <span>COPY ALL</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {filteredSubdomains.length > 0 ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
                          {filteredSubdomains.map((sub, idx) => {
                            const detail = crawledData.osint?.subdomains_detail?.find(d => d.subdomain.toLowerCase() === sub.toLowerCase());
                            const isTalentOrPortal = /(talent|portal|student|career|apply|exam|attendance|email|mail)/i.test(sub);
                            return (
                              <div
                                key={idx}
                                className={`p-3 rounded-xl bg-white/[0.02] border flex items-center justify-between group transition ${
                                  isTalentOrPortal ? 'border-purple-500/30 hover:border-purple-500/70 bg-purple-500/[0.03]' : 'border-white/[0.08] hover:border-white/20'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 truncate">
                                  <Network className={`w-4 h-4 shrink-0 ${isTalentOrPortal ? 'text-purple-400' : 'text-gray-400'}`} />
                                  <div className="truncate">
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono text-xs text-white font-semibold truncate">{sub}</span>
                                      {detail?.ip && (
                                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/5 text-gray-400 border border-white/10 shrink-0">
                                          {detail.ip}
                                        </span>
                                      )}
                                    </div>
                                    {detail?.source && (
                                      <span className="text-[9px] text-purple-400/80 uppercase">
                                        Source: {detail.source}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 shrink-0 ml-2">
                                  <a
                                    href={`https://${sub}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-[#D4FF00] transition"
                                    title="Open Subdomain in New Tab"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </a>
                                  <button
                                    onClick={() => handleCopy('sub-' + idx, sub)}
                                    className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white transition"
                                    title="Copy Subdomain"
                                  >
                                    {copiedKey === 'sub-' + idx ? <Check className="w-3 h-3 text-[#10B981]" /> : <Copy className="w-3 h-3" />}
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="py-12 text-center text-gray-500">
                          {crawledData.subdomains.length === 0 ? 'No separate subdomains referenced in hyperlinks.' : 'No subdomains match the filter.'}
                        </div>
                      )}
                    </div>
                  )}

                                    {/* 3.5 ROBOTS.TXT & FOLDER DIGGING */}
                  {activeTab === 'folders' && (
                    <div className="space-y-4">
                      {/* Summary Stat Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Robots.txt Rules</span>
                            <div className="text-xl font-black text-rose-400 mt-0.5">
                              {crawledData.osint?.robots_txt?.disallow?.length || 0} Disallowed
                            </div>
                          </div>
                          <div className="w-9 h-9 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
                            <ShieldAlert className="w-4 h-4" />
                          </div>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Discovered Sitemaps</span>
                            <div className="text-xl font-black text-amber-400 mt-0.5">
                              {crawledData.osint?.robots_txt?.sitemaps?.length || 0} XML Index
                            </div>
                          </div>
                          <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                            <Globe className="w-4 h-4" />
                          </div>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Probed Endpoints</span>
                            <div className="text-xl font-black text-emerald-400 mt-0.5">
                              {crawledData.osint?.sensitive_files?.length || 0} Probed
                            </div>
                          </div>
                          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                            <FolderTree className="w-4 h-4" />
                          </div>
                        </div>
                      </div>

                      {/* Section 1: Robots.txt Disallowed Directives */}
                      <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4 text-rose-400" />
                            <h4 className="font-bold text-gray-200">Robots.txt Disallow Directives (Hidden / Restricted Paths)</h4>
                          </div>
                          <span className="text-[10px] text-gray-400 font-bold">
                            {crawledData.osint?.robots_txt?.disallow?.length || 0} Paths Declared
                          </span>
                        </div>

                        {crawledData.osint?.robots_txt?.disallow && crawledData.osint.robots_txt.disallow.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {crawledData.osint.robots_txt.disallow.map((p, idx) => {
                              const targetLink = new URL(p, crawledData.url).toString();
                              return (
                                <div key={idx} className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between group hover:border-rose-500/30 transition">
                                  <div className="flex items-center gap-2 overflow-hidden">
                                    <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                                    <span className="font-mono text-xs text-rose-300 truncate">{p}</span>
                                  </div>
                                  <div className="flex items-center gap-1 shrink-0 ml-2">
                                    <button
                                      onClick={() => handleCopy(`disallow-${idx}`, targetLink)}
                                      className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white transition"
                                      title="Copy URL"
                                    >
                                      {copiedKey === `disallow-${idx}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                    </button>
                                    <a
                                      href={targetLink}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="p-1 rounded bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition"
                                      title="Open Path in Browser"
                                    >
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-500 italic">No Disallow rules declared in robots.txt.</p>
                        )}

                        {/* Sitemaps */}
                        {crawledData.osint?.robots_txt?.sitemaps && crawledData.osint.robots_txt.sitemaps.length > 0 && (
                          <div className="pt-3 border-t border-white/[0.06] space-y-2">
                            <span className="text-[11px] text-gray-400 font-bold flex items-center gap-1.5">
                              <Globe className="w-3.5 h-3.5 text-amber-400" />
                              <span>Sitemaps Declared in Robots.txt:</span>
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {crawledData.osint.robots_txt.sitemaps.map((sm, sIdx) => (
                                <a
                                  key={sIdx}
                                  href={sm}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-1.5 hover:bg-amber-500/20 transition"
                                >
                                  <span className="truncate max-w-[280px]">{sm}</span>
                                  <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Section 2: Deep Folder Digging & Sensitive Files Matrix */}
                      <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FolderSearch className="w-4 h-4 text-emerald-400" />
                            <h4 className="font-bold text-gray-200">Discovered Folders & Exposed Text Files</h4>
                          </div>
                          <span className="text-[10px] text-gray-400 font-bold">
                            {crawledData.osint?.sensitive_files?.length || 0} Endpoints Probed
                          </span>
                        </div>

                        {crawledData.osint?.sensitive_files && crawledData.osint.sensitive_files.length > 0 ? (
                          <div className="space-y-2">
                            {crawledData.osint.sensitive_files.map((file, fIdx) => (
                              <div
                                key={fIdx}
                                className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/20 transition flex flex-col gap-2"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                                      file.status === 200 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                                      file.status === 403 ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' :
                                      file.status === 401 ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' :
                                      file.status === 301 || file.status === 302 ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40' :
                                      'bg-gray-500/20 text-gray-400'
                                    }`}>
                                      HTTP {file.status}
                                    </span>
                                    <span className="font-mono font-bold text-white text-xs">{file.path}</span>
                                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/5 text-gray-400 border border-white/10 uppercase">
                                      {file.source}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1.5">
                                    <button
                                      onClick={() => handleCopy(`file-${fIdx}`, file.url)}
                                      className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white transition"
                                      title="Copy Endpoint URL"
                                    >
                                      {copiedKey === `file-${fIdx}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                    </button>
                                    <a
                                      href={file.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="p-1 rounded bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition"
                                      title="Open Endpoint"
                                    >
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  </div>
                                </div>

                                {file.notes && (
                                  <div className="text-[11px] text-gray-400">
                                    {file.notes}
                                  </div>
                                )}

                                {file.snippet && (
                                  <div className="p-2 rounded-lg bg-black/50 border border-white/[0.04] text-[11px] font-mono text-gray-300 overflow-x-auto max-h-24">
                                    <code>{file.snippet}</code>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="py-8 text-center text-gray-500 text-xs">
                            No sensitive folders or files discovered on target.
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 3.8 LAWFUL OSINT: SECURITY & TECH POSTURE */}
                  {activeTab === 'security' && (
                    <div className="space-y-4">
                      {/* Summary Banner: OWASP Grade & Threat Alignment */}
                      <div className="p-4 rounded-3xl bg-gradient-to-r from-purple-900/20 via-black/40 to-white/[0.02] border border-purple-500/20 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-black border shadow-lg ${
                            crawledData.osint?.security_headers?.grade === 'A+' || crawledData.osint?.security_headers?.grade === 'A'
                              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                              : crawledData.osint?.security_headers?.grade === 'B' || crawledData.osint?.security_headers?.grade === 'C'
                              ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                              : 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                          }`}>
                            <span className="text-[10px] text-gray-400 font-bold">OWASP</span>
                            <span className="text-2xl leading-none font-extrabold">{crawledData.osint?.security_headers?.grade || 'N/A'}</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-base font-extrabold text-white">Client Defense-in-Depth Posture</h3>
                              <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold border border-purple-500/40 uppercase">
                                100% Passive Audit
                              </span>
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5">
                              Security Score: <span className="text-white font-mono font-bold">{crawledData.osint?.security_headers?.score ?? 'N/A'}/100</span> — {crawledData.osint?.security_headers?.passCount || 0} protections passed, {crawledData.osint?.security_headers?.failCount || 0} deficiencies detected.
                            </p>
                          </div>
                        </div>

                        {/* RFC 9116 / VDP Badge */}
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border ${
                            crawledData.osint?.security_txt?.exists
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                              : 'bg-white/5 border-white/10 text-gray-400'
                          }`}>
                            <ShieldCheck className="w-4 h-4" />
                            <span>security.txt: {crawledData.osint?.security_txt?.exists ? 'Published (RFC 9116)' : 'Not Published'}</span>
                          </span>
                        </div>
                      </div>

                      {/* Section 1: Security Headers Breakdown */}
                      <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4 text-purple-400" />
                            <h4 className="font-bold text-gray-200">HTTP Security Headers Evaluation</h4>
                          </div>
                          <span className="text-[10px] text-gray-400 font-bold">
                            {crawledData.osint?.security_headers?.findings?.length || 0} Core Protections Tested
                          </span>
                        </div>

                        <div className="space-y-2">
                          {crawledData.osint?.security_headers?.findings?.map((finding, idx) => (
                            <div
                              key={idx}
                              className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                            >
                              <div className="space-y-1 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                    finding.status === 'pass'
                                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                      : finding.status === 'warn'
                                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                  }`}>
                                    {finding.status}
                                  </span>
                                  <span className="font-mono font-bold text-xs text-white">{finding.header}</span>
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/5 text-gray-400 border border-white/10">
                                    {finding.importance} risk
                                  </span>
                                </div>
                                <p className="text-[11px] text-gray-400">{finding.description}</p>
                                {finding.value && (
                                  <div className="text-[10px] font-mono text-gray-300 bg-black/40 px-2 py-1 rounded border border-white/[0.04] truncate max-w-xl">
                                    {finding.value}
                                  </div>
                                )}
                              </div>
                              <div className="text-right sm:max-w-xs shrink-0">
                                <span className="text-[10px] text-gray-400 font-medium block">
                                  💡 {finding.recommendation}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Section 2: Fingerprinted Technology Stack */}
                      <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Cpu className="w-4 h-4 text-emerald-400" />
                            <h4 className="font-bold text-gray-200">Fingerprinted Technology & Framework Stack</h4>
                          </div>
                          <span className="text-[10px] text-gray-400 font-bold">
                            {crawledData.osint?.technologies?.length || 0} Components Identified
                          </span>
                        </div>

                        {crawledData.osint?.technologies && crawledData.osint.technologies.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                            {crawledData.osint.technologies.map((tech, idx) => (
                              <div
                                key={idx}
                                className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-emerald-500/30 transition space-y-1.5"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-xs text-white">{tech.name}</span>
                                  <span className={`text-[9px] px-1.5 py-0.2 rounded font-black uppercase ${
                                    tech.confidence === 'high' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                                  }`}>
                                    {tech.confidence}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-[11px] text-gray-400">
                                  <span className="px-1.5 py-0.2 rounded bg-white/5 border border-white/10 text-[10px] text-gray-300">
                                    {tech.category}
                                  </span>
                                  {tech.version && (
                                    <span className="font-mono text-emerald-400 font-bold text-[10px]">
                                      v{tech.version}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-500 italic">No specific framework or CMS components identified.</p>
                        )}
                      </div>

                      {/* Section 3: Email Anti-Spoofing & Phishing Posture (SPF & DMARC) */}
                      {crawledData.osint?.email_security && (
                        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-amber-400" />
                              <h4 className="font-bold text-gray-200">Email Anti-Spoofing & Domain Phishing Defense</h4>
                            </div>
                            <span className="text-[10px] text-gray-400 font-bold">Mail Delivery Trust</span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {/* SPF Card */}
                            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                                  <span>Sender Policy Framework (SPF)</span>
                                </span>
                                <span className={`text-[10px] px-2 py-0.5 rounded font-black uppercase ${
                                  crawledData.osint.email_security.spf.status === 'hardfail'
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                    : crawledData.osint.email_security.spf.status === 'softfail'
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                }`}>
                                  {crawledData.osint.email_security.spf.status}
                                </span>
                              </div>
                              <p className="text-[11px] text-gray-400">
                                {crawledData.osint.email_security.spf.description}
                              </p>
                              {crawledData.osint.email_security.spf.record && (
                                <div className="p-2 rounded bg-black/40 border border-white/[0.04] text-[10px] font-mono text-amber-300 break-all">
                                  {crawledData.osint.email_security.spf.record}
                                </div>
                              )}
                              {crawledData.osint.email_security.spf.relayNetworks && crawledData.osint.email_security.spf.relayNetworks.length > 0 && (
                                <div className="text-[10px] text-gray-400">
                                  <span className="font-bold text-gray-300">Authorized Relays: </span>
                                  {crawledData.osint.email_security.spf.relayNetworks.join(', ')}
                                </div>
                              )}
                            </div>

                            {/* DMARC Card */}
                            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-white">DMARC Policy Enforcement</span>
                                <span className={`text-[10px] px-2 py-0.5 rounded font-black uppercase ${
                                  crawledData.osint.email_security.dmarc.status === 'strong'
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                    : crawledData.osint.email_security.dmarc.status === 'moderate'
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                }`}>
                                  {crawledData.osint.email_security.dmarc.status}
                                </span>
                              </div>
                              <p className="text-[11px] text-gray-400">
                                {crawledData.osint.email_security.dmarc.description}
                              </p>
                              {crawledData.osint.email_security.dmarc.record && (
                                <div className="p-2 rounded bg-black/40 border border-white/[0.04] text-[10px] font-mono text-purple-300 break-all">
                                  {crawledData.osint.email_security.dmarc.record}
                                </div>
                              )}
                              {crawledData.osint.email_security.dmarc.ruaMailbox && (
                                <div className="text-[10px] text-gray-400">
                                  <span className="font-bold text-gray-300">Telemetry Mailbox: </span>
                                  <span className="font-mono text-gray-300">{crawledData.osint.email_security.dmarc.ruaMailbox}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Section 4: RFC 9116 security.txt & RDAP */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* security.txt Card */}
                        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white flex items-center gap-1.5">
                              <ShieldCheck className="w-4 h-4 text-emerald-400" />
                              <span>RFC 9116 security.txt (Safe Harbor)</span>
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded font-black uppercase ${
                              crawledData.osint?.security_txt?.exists
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : 'bg-gray-500/20 text-gray-400'
                            }`}>
                              {crawledData.osint?.security_txt?.exists ? 'Active' : 'Missing'}
                            </span>
                          </div>

                          {crawledData.osint?.security_txt?.exists ? (
                            <div className="space-y-1.5 text-xs text-gray-300">
                              {crawledData.osint.security_txt.contact && (
                                <div>
                                  <span className="text-gray-500 font-bold block text-[10px]">REPORTING CONTACT</span>
                                  <span className="font-mono text-emerald-300">{crawledData.osint.security_txt.contact.join(', ')}</span>
                                </div>
                              )}
                              {crawledData.osint.security_txt.policy && (
                                <div>
                                  <span className="text-gray-500 font-bold block text-[10px]">POLICY URL</span>
                                  <a href={crawledData.osint.security_txt.policy} target="_blank" rel="noreferrer" className="text-purple-300 underline font-mono text-[11px] truncate block">
                                    {crawledData.osint.security_txt.policy}
                                  </a>
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="text-xs text-gray-500 italic">
                              Target has not published an RFC 9116 security contact or vulnerability disclosure policy at /.well-known/security.txt.
                            </p>
                          )}
                        </div>

                        {/* RDAP / Network Allocation Card */}
                        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white flex items-center gap-1.5">
                              <Globe className="w-4 h-4 text-sky-400" />
                              <span>RFC 7480 Public Registration (RDAP)</span>
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded font-black uppercase bg-sky-500/20 text-sky-300 border border-sky-500/40">
                              Registry
                            </span>
                          </div>

                          {crawledData.osint?.rdap ? (
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              {crawledData.osint.rdap.name && (
                                <div className="p-2 rounded bg-white/[0.02] border border-white/5">
                                  <span className="text-[10px] text-gray-500 block">NET NAME</span>
                                  <span className="font-mono text-white font-bold">{crawledData.osint.rdap.name}</span>
                                </div>
                              )}
                              {crawledData.osint.rdap.handle && (
                                <div className="p-2 rounded bg-white/[0.02] border border-white/5">
                                  <span className="text-[10px] text-gray-500 block">HANDLE</span>
                                  <span className="font-mono text-white font-bold truncate block">{crawledData.osint.rdap.handle}</span>
                                </div>
                              )}
                              {crawledData.osint.rdap.startAddress && (
                                <div className="p-2 rounded bg-white/[0.02] border border-white/5 col-span-2">
                                  <span className="text-[10px] text-gray-500 block">ALLOCATED IP BLOCK</span>
                                  <span className="font-mono text-amber-300 font-bold">
                                    {crawledData.osint.rdap.startAddress} — {crawledData.osint.rdap.endAddress}
                                  </span>
                                </div>
                              )}
                              {crawledData.osint.rdap.registrar && (
                                <div className="p-2 rounded bg-white/[0.02] border border-white/5 col-span-2">
                                  <span className="text-[10px] text-gray-500 block">REGISTRAR</span>
                                  <span className="font-mono text-gray-300">{crawledData.osint.rdap.registrar}</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="text-xs text-gray-500 italic">No RDAP registry record published or reachable for this target.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

{/* 4. DNS & OSINT RECON */}
                  {activeTab === 'osint' && (
                    <div className="space-y-4">
                      {/* Target Classification & Network Identity Banner */}
                      <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black">
                            {crawledData.osint?.is_ip ? 'IP' : 'DOM'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-sm text-white font-mono">{crawledData.domain}</span>
                              <span className={`text-[10px] px-2 py-0.5 rounded font-black uppercase ${
                                crawledData.osint?.is_ip 
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' 
                                  : 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                              }`}>
                                {crawledData.osint?.is_ip ? 'Raw Host IP Target' : 'Registered Domain'}
                              </span>
                            </div>
                            <span className="text-[11px] text-gray-400 font-mono">
                              Resolved Target IP: {crawledData.osint?.target_ip || (crawledData.osint?.dns?.a?.[0] || 'N/A')}
                            </span>
                          </div>
                        </div>

                        {crawledData.osint?.reverse_dns && crawledData.osint.reverse_dns.length > 0 && (
                          <div className="flex items-center gap-2 p-2 rounded-xl bg-white/[0.03] border border-white/10">
                            <span className="text-[10px] text-gray-400 font-bold uppercase">PTR (Reverse DNS):</span>
                            <span className="font-mono text-xs text-amber-300 font-bold">{crawledData.osint.reverse_dns.join(', ')}</span>
                            <button
                              onClick={() => handleCopy('rev-dns', crawledData.osint!.reverse_dns!.join(', '))}
                              className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white"
                              title="Copy Reverse DNS"
                            >
                              {copiedKey === 'rev-dns' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                        )}
                      </div>

                      {/* SSL / TLS Certificate Recon Card */}
                      {crawledData.osint?.ssl_cert && (
                        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                              <Lock className="w-4 h-4" />
                              <span>SSL / TLS CERTIFICATE & HOSTNAMES (SANs)</span>
                            </div>
                            <span className="text-[10px] text-gray-500">Port 443 Handshake</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                              <span className="text-[10px] text-gray-500 block">SUBJECT COMMON NAME (CN)</span>
                              <span className="font-mono text-white font-bold">{crawledData.osint.ssl_cert.cn || 'None'}</span>
                            </div>
                            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                              <span className="text-[10px] text-gray-500 block">ISSUER AUTHORITY</span>
                              <span className="font-mono text-white font-bold truncate block">{crawledData.osint.ssl_cert.issuer || 'N/A'}</span>
                            </div>
                            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                              <span className="text-[10px] text-gray-500 block">VALIDITY WINDOW</span>
                              <span className="font-mono text-gray-300 text-[11px] block">
                                {crawledData.osint.ssl_cert.validFrom ? new Date(crawledData.osint.ssl_cert.validFrom).toLocaleDateString() : 'N/A'} - {crawledData.osint.ssl_cert.validTo ? new Date(crawledData.osint.ssl_cert.validTo).toLocaleDateString() : 'N/A'}
                              </span>
                            </div>
                          </div>

                          {crawledData.osint.ssl_cert.sans && crawledData.osint.ssl_cert.sans.length > 0 && (
                            <div className="space-y-1.5 pt-1">
                              <span className="text-[10px] text-gray-400 font-bold uppercase">
                                Subject Alternative Names / Associated Hostnames ({crawledData.osint.ssl_cert.sans.length}):
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {crawledData.osint.ssl_cert.sans.map((san, sanIdx) => (
                                  <span
                                    key={sanIdx}
                                    className="px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-mono text-[11px] flex items-center gap-1"
                                  >
                                    <span>{san}</span>
                                    <button
                                      onClick={() => handleCopy(`san-${sanIdx}`, san)}
                                      className="hover:text-white"
                                      title="Copy SAN"
                                    >
                                      {copiedKey === `san-${sanIdx}` ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                                    </button>
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Geo & Host Card */}
                      {crawledData.osint?.geo && (
                        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                            <MapPin className="w-4 h-4" />
                            <span>GEOLOCATION & AUTONOMOUS SYSTEM (ASN)</span>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                              <span className="text-[10px] text-gray-500 block">PRIMARY IP</span>
                              <span className="font-mono text-white font-bold">{crawledData.osint.geo.query}</span>
                            </div>
                            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                              <span className="text-[10px] text-gray-500 block">LOCATION</span>
                              <span className="font-mono text-white font-bold">{crawledData.osint.geo.city}, {crawledData.osint.geo.country}</span>
                            </div>
                            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                              <span className="text-[10px] text-gray-500 block">ISP / HOST</span>
                              <span className="font-mono text-white font-bold truncate block">{crawledData.osint.geo.isp}</span>
                            </div>
                            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                              <span className="text-[10px] text-gray-500 block">ASN ROUTING</span>
                              <span className="font-mono text-white font-bold truncate block">{crawledData.osint.geo.as}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* DNS Records Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* MX Mail Servers */}
                        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-sky-400 flex items-center gap-1.5">
                              <Server className="w-4 h-4" />
                              <span>MX MAIL SERVERS ({crawledData.osint?.dns?.mx?.length || 0})</span>
                            </span>
                            <span className="text-[10px] text-gray-500">Direct Email Routing</span>
                          </div>
                          <div className="space-y-1.5">
                            {crawledData.osint?.dns?.mx && crawledData.osint.dns.mx.length > 0 ? (
                              crawledData.osint.dns.mx.map((m, idx) => (
                                <div key={idx} className="p-2 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between font-mono text-xs">
                                  <span className="text-white truncate">{m.exchange}</span>
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 font-bold">
                                    Pri: {m.priority}
                                  </span>
                                </div>
                              ))
                            ) : (
                              <div className="text-gray-500 text-xs py-2">No MX records returned.</div>
                            )}
                          </div>
                        </div>

                        {/* Nameservers */}
                        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-purple-400 flex items-center gap-1.5">
                              <Globe className="w-4 h-4" />
                              <span>NAMESERVERS (NS) ({crawledData.osint?.dns?.ns?.length || 0})</span>
                            </span>
                            <span className="text-[10px] text-gray-500">DNS Authority</span>
                          </div>
                          <div className="space-y-1.5">
                            {crawledData.osint?.dns?.ns && crawledData.osint.dns.ns.length > 0 ? (
                              crawledData.osint.dns.ns.map((ns, idx) => (
                                <div key={idx} className="p-2 rounded-xl bg-white/[0.03] border border-white/5 font-mono text-xs text-white truncate">
                                  {ns}
                                </div>
                              ))
                            ) : (
                              <div className="text-gray-500 text-xs py-2">No NS records returned.</div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* TXT / SPF Records */}
                      <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-[#D4FF00] flex items-center gap-1.5">
                            <ShieldAlert className="w-4 h-4" />
                            <span>TXT / SPF / DMARC & VERIFICATION POLICIES</span>
                          </span>
                          <span className="text-[10px] text-gray-500">Origin Leak & Mail Security</span>
                        </div>
                        <div className="space-y-2">
                          {crawledData.osint?.dns?.txt && crawledData.osint.dns.txt.length > 0 ? (
                            crawledData.osint.dns.txt.map((txt, idx) => {
                              const isSpf = txt.toLowerCase().startsWith('v=spf1');
                              return (
                                <div
                                  key={idx}
                                  className={`p-2.5 rounded-xl font-mono text-xs break-all border ${
                                    isSpf ? 'bg-[#D4FF00]/10 border-[#D4FF00]/30 text-[#D4FF00]' : 'bg-white/[0.03] border-white/5 text-gray-300'
                                  }`}
                                >
                                  {isSpf && <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#D4FF00] text-black font-black mr-2 uppercase">SPF POLICY</span>}
                                  {txt}
                                </div>
                              );
                            })
                          ) : (
                            <div className="text-gray-500 text-xs py-2">No TXT records discovered.</div>
                          )}
                        </div>
                      </div>

                      {/* Crawled Recon Footprint */}
                      {crawledData.osint?.crawled_pages && (
                        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-emerald-400 flex items-center gap-1.5">
                              <Layers className="w-4 h-4" />
                              <span>CRAWLED RECON TARGET FOOTPRINT ({crawledData.osint.crawled_pages.length})</span>
                            </span>
                            <span className="text-[10px] text-gray-500">Contact & Portal Crawl Path</span>
                          </div>
                          <div className="space-y-1">
                            {crawledData.osint.crawled_pages.map((p, idx) => (
                              <div key={idx} className="p-2 rounded-lg bg-white/[0.02] border border-white/5 font-mono text-[11px] text-gray-300 flex items-center justify-between">
                                <span className="truncate">{p}</span>
                                <a href={p} target="_blank" rel="noreferrer" className="text-gray-500 hover:text-emerald-400 ml-2">
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 4. LINKS TOPOLOGY */}
                  {activeTab === 'links' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3 text-center">
                        <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10">
                          <span className="text-[10px] text-gray-400 block">INTERNAL LINKS</span>
                          <span className="text-base font-extrabold text-[#D4FF00]">
                            {crawledData.links.total_internal}
                          </span>
                        </div>
                        <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10">
                          <span className="text-[10px] text-gray-400 block">EXTERNAL OUTBOUND LINKS</span>
                          <span className="text-base font-extrabold text-sky-400">
                            {crawledData.links.total_external}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-gray-300">Extracted URLs (Sample 40):</h4>
                        <div className="max-h-96 overflow-y-auto space-y-1.5 p-2 rounded-2xl bg-[#0B0D10] border border-white/10">
                          {[...crawledData.links.internal, ...crawledData.links.external].slice(0, 40).map((l, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 truncate">
                              <span className="text-[11px] text-gray-300 truncate">{l}</span>
                              <a
                                href={l}
                                target="_blank"
                                rel="noreferrer"
                                className="text-gray-500 hover:text-[#D4FF00] p-1 shrink-0"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 5. METADATA & HEADERS */}
                  {activeTab === 'metadata' && (
                    <div className="space-y-3">
                      <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                        <div>
                          <span className="text-[10px] text-gray-500 uppercase font-bold block">PAGE TITLE</span>
                          <span className="text-sm font-bold text-white">{crawledData.metadata.title || 'None'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-gray-500 uppercase font-bold block">META DESCRIPTION</span>
                          <span className="text-xs text-gray-300">{crawledData.metadata.description || 'No description meta tag declared.'}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-3 pt-2">
                          <div>
                            <span className="text-[10px] text-gray-500 uppercase font-bold block">HTTP STATUS</span>
                            <span className="text-xs font-bold text-emerald-400">{crawledData.metadata.status}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-gray-500 uppercase font-bold block">SERVER BANNER</span>
                            <span className="text-xs font-bold text-amber-400">{crawledData.metadata.server || 'Hidden'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-gray-500 uppercase font-bold block">CONTENT-TYPE</span>
                            <span className="text-xs text-gray-300">{crawledData.metadata.content_type || 'text/html'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 6. PAGE TEXT */}
                  {activeTab === 'text' && (
                    <div className="p-4 rounded-2xl bg-[#0B0D10] border border-white/10 font-mono text-[11px] text-gray-300 leading-relaxed max-h-[500px] overflow-y-auto whitespace-pre-wrap">
                      {crawledData.text || 'No text extracted.'}
                    </div>
                  )}

                  {/* 7. RAW JSON */}
                  {activeTab === 'raw' && (
                    <div className="relative">
                      <button
                        onClick={() => handleCopy('raw-json', JSON.stringify(crawledData, null, 2))}
                        className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center gap-1.5 text-xs"
                      >
                        {copiedKey === 'raw-json' ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>COPY JSON</span>
                      </button>
                      <pre className="p-4 rounded-2xl bg-[#0B0D10] border border-white/10 text-gray-300 font-mono text-[11px] max-h-[500px] overflow-auto">
                        {JSON.stringify(crawledData, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-500 font-mono">
                <Radar className="w-12 h-12 mb-3 text-gray-600 animate-pulse" />
                <h3 className="text-sm font-bold text-gray-300 mb-1">
                  NO TARGET ACTIVE
                </h3>
                <p className="text-xs max-w-sm">
                  Enter an HTTP/HTTPS target above and click <strong>RUN RECON CRAWL</strong> to execute Scrapy and GPT-6 Astra threat modeling.
                </p>
              </div>
            )
          ) : (
            /* NEWS / CVE / AI FEED VIEW */
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="p-3 bg-[#12151B]/50 border-b border-white/[0.08] flex items-center justify-between">
                <span className="text-xs font-bold text-gray-300 uppercase">
                  {pipelineMode === 'cve' ? '🛡️ CVE & Exploit Advisories Feed' :
                   pipelineMode === 'security' ? '📰 Cyber Threat Intelligence Stream' :
                   '🤖 arXiv & AI Research Pipeline'}
                </span>
                <button
                  onClick={() => handleFetchNews(
                    pipelineMode === 'cve' ? 'cve_feed' :
                    pipelineMode === 'security' ? 'security_blogs' : 'ai_news'
                  )}
                  disabled={isLoadingNews}
                  className="px-3 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingNews ? 'animate-spin' : ''}`} />
                  <span>REFRESH FEED</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {isLoadingNews ? (
                  <div className="py-20 flex flex-col items-center justify-center gap-3">
                    <RefreshCw className="w-6 h-6 animate-spin text-[#D4FF00]" />
                    <span className="text-xs font-bold text-gray-400">EXECUTING SPIDER FEED EXTRACTION...</span>
                  </div>
                ) : newsItems.length > 0 ? (
                  newsItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-[#12151B]/95 border border-white/[0.08] hover:border-white/20 transition space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            {item.cve_id && item.cve_id !== 'N/A' && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-rose-500/20 text-rose-300 border border-rose-500/40">
                                {item.cve_id}
                              </span>
                            )}
                            <span className="text-[10px] text-gray-400">
                              {item.source} • {item.published_date}
                            </span>
                          </div>
                          <h4 className="font-extrabold text-xs text-white leading-snug">
                            {item.title}
                          </h4>
                        </div>

                        <button
                          onClick={() => handleAnalyzeFeedItem(item)}
                          className="px-3 py-1.5 rounded-xl bg-[#D4FF00]/15 hover:bg-[#D4FF00]/25 text-[#D4FF00] border border-[#D4FF00]/30 transition flex items-center gap-1.5 shrink-0 text-[11px]"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>ANALYZE WITH GPT-6 ASTRA</span>
                        </button>
                      </div>

                      <p className="text-[11px] text-gray-400 line-clamp-3">
                        {item.description || item.abstract || 'No summary excerpt available.'}
                      </p>

                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-sky-400 hover:underline"
                        >
                          <span>View Upstream Source</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="py-20 text-center text-gray-500">
                    Click <strong>REFRESH FEED</strong> above to trigger Scrapy spider feed retrieval.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: RECON TELEMETRY LOGS & DEEP DIVE MODAL */}
        <div className="w-80 bg-[#12151B]/95 flex flex-col shrink-0 select-none overflow-hidden">
          <div className="p-3 border-b border-white/[0.08] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-[#D4FF00]" />
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-white">
                Scrapy Telemetry Log
              </span>
            </div>
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
          </div>

          <div className="flex-1 p-3 overflow-y-auto font-mono text-[10px] space-y-1.5 text-gray-400 leading-relaxed bg-[#0B0D10]/90">
            {consoleLog.length > 0 ? (
              consoleLog.map((l, idx) => (
                <div key={idx} className="font-mono break-all">
                  <span className="text-[#D4FF00]">&gt;</span> {l}
                </div>
              ))
            ) : (
              <div className="text-gray-600 italic">
                Ready for recon tasks...
              </div>
            )}
          </div>

          {/* Quick Engine Architecture Summary */}
          <div className="p-3 bg-[#0B0D10] border-t border-white/[0.08] text-[10px] text-gray-400 space-y-1.5">
            <div className="flex justify-between">
              <span>Scrapy Spider:</span>
              <strong className="text-white font-mono">{pipelineMode === 'recon' ? 'zakos' : pipelineMode}</strong>
            </div>
            <div className="flex justify-between">
              <span>Deploy Target:</span>
              <strong className="text-[#D4FF00] font-mono">Zyte Scrapy Cloud (Egg)</strong>
            </div>
            <div className="flex justify-between">
              <span>Intel Model:</span>
              <strong className="text-purple-300 font-mono">GPT-6 Astra</strong>
            </div>
          </div>
        </div>
      </div>

      {/* 🧠 GPT-6 ASTRA DEEP DIVE MODAL FOR NEWS / CVE */}
      {selectedNewsAnalysis && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-2xl bg-[#12151B] border border-white/15 rounded-3xl p-6 shadow-2xl space-y-4 font-mono text-xs text-white max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 shrink-0">
              <div className="flex items-center gap-2 truncate pr-3">
                <Sparkles className="w-5 h-5 text-[#D4FF00] shrink-0" />
                <h3 className="font-extrabold text-sm text-white truncate">
                  GPT-6 ASTRA THREAT INTELLIGENCE
                </h3>
              </div>
              <button
                onClick={() => setSelectedNewsAnalysis(null)}
                className="text-gray-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="text-[11px] text-gray-400 font-bold">
              Item: {selectedNewsAnalysis.title}
            </div>

            <div className="flex-1 overflow-y-auto p-4 rounded-2xl bg-[#0B0D10] border border-white/10">
              {isAnalyzingItem ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3">
                  <Sparkles className="w-6 h-6 animate-spin text-[#D4FF00]" />
                  <span className="font-bold text-gray-300">
                    GPT-6 ASTRA GENERATING CVSS & TRIAGE BRIEFING...
                  </span>
                </div>
              ) : (
                <div
                  className="prose prose-invert max-w-none text-xs leading-relaxed prose-headings:text-white prose-p:text-gray-300 prose-code:text-[#D4FF00] prose-code:bg-[#12151B] prose-code:px-1 prose-code:py-0.5 prose-code:rounded"
                  dangerouslySetInnerHTML={{
                    __html: marked.parse(selectedNewsAnalysis.briefing, { async: false }) as string,
                  }}
                />
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 shrink-0">
              <button
                onClick={() => {
                  onSaveToVaultNote(
                    `Threat Intel — ${selectedNewsAnalysis.title.slice(0, 40)}`,
                    selectedNewsAnalysis.briefing,
                    '01 Certifications/EJPT Certification/Notes',
                    'threat_intel'
                  );
                  setSelectedNewsAnalysis(null);
                }}
                className="px-4 py-2 rounded-xl bg-[#D4FF00] text-black font-extrabold"
              >
                SAVE TO OBSIDIAN NOTE
              </button>
              <button
                onClick={() => setSelectedNewsAnalysis(null)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
