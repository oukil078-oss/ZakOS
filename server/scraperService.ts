import { execFile } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import dns from 'dns';
import { getExpLabsApiKey, EXPLABS_BASE_URL } from './agent';

export interface SubdomainDetail {
  subdomain: string;
  ip?: string;
  source?: string;
}

export interface OsintReconData {
  root_domain?: string;
  subdomains_detail?: SubdomainDetail[];
  crawled_pages?: string[];
  dns?: {
    a?: string[];
    mx?: { exchange: string; priority: number }[];
    txt?: string[];
    ns?: string[];
  };
  geo?: {
    query?: string;
    country?: string;
    city?: string;
    isp?: string;
    org?: string;
    as?: string;
  };
}

export interface ScrapedResult {
  url: string;
  domain: string;
  metadata: {
    title: string;
    description: string;
    author: string;
    status: number;
    og: Record<string, string>;
    server?: string;
    content_type?: string;
  };
  emails: string[];
  subdomains: string[];
  links: {
    internal: string[];
    external: string[];
    total_internal: number;
    total_external: number;
  };
  text: string;
  scraped_at: string;
  osint?: OsintReconData;
}

export interface ThreatAnalysis {
  summary: string;
  threatLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFORMATIONAL';
  attackSurface: string[];
  vulnerabilities: string[];
  recommendations: string[];
  rawAnalysis: string;
}

function decodeCloudflareEmail(encoded: string): string | null {
  try {
    const k = parseInt(encoded.substr(0, 2), 16);
    let email = '';
    for (let i = 2; i < encoded.length; i += 2) {
      email += String.fromCharCode(parseInt(encoded.substr(i, 2), 16) ^ k);
    }
    return email;
  } catch {
    return null;
  }
}

export class ScraperService {
  private projectRoot: string;
  private venvPython: string;

  constructor() {
    this.projectRoot = path.resolve(process.cwd());
    const isWindows = process.platform === 'win32';
    this.venvPython = isWindows
      ? path.join(this.projectRoot, '.venv', 'Scripts', 'python.exe')
      : path.join(this.projectRoot, '.venv', 'bin', 'python');
  }

  private getPythonExecutable(): string {
    if (fs.existsSync(this.venvPython)) {
      return this.venvPython;
    }
    return 'python';
  }

  /**
   * Run a Scrapy spider and return the parsed JSON results enriched with OSINT
   */
  public async crawl(spiderName: string = 'zakos', targetUrl?: string): Promise<ScrapedResult[]> {
    const pythonExe = this.getPythonExecutable();
    const tempOutputFile = path.join(os.tmpdir(), `scrapy_out_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.json`);

    const args = ['-m', 'scrapy', 'crawl', spiderName];
    if (targetUrl) {
      args.push('-a', `url=${targetUrl}`);
    }
    args.push('-O', tempOutputFile);

    return new Promise(async (resolve, reject) => {
      console.log(`[ScraperService] Launching spider: ${spiderName} for url: ${targetUrl || 'default'} via ${pythonExe}`);

      execFile(pythonExe, args, { cwd: this.projectRoot, timeout: 60000 }, async (error, stdout, stderr) => {
        try {
          if (fs.existsSync(tempOutputFile)) {
            const raw = fs.readFileSync(tempOutputFile, 'utf-8');
            try {
              fs.unlinkSync(tempOutputFile);
            } catch {}

            if (raw.trim()) {
              const parsed = JSON.parse(raw);
              const items: ScrapedResult[] = Array.isArray(parsed) ? parsed : [parsed];
              console.log(`[ScraperService] Successfully scraped ${items.length} items with ${spiderName}`);

              // Enrich item 0 with DNS and Geolocation OSINT
              if (items.length > 0 && items[0].domain) {
                await this.enrichWithDnsAndGeo(items[0]);
              }

              return resolve(items);
            }
          }

          // If Scrapy produced empty output or errored, run full Node OSINT fallback
          if (targetUrl && spiderName === 'zakos') {
            console.warn('[ScraperService] Scrapy produced empty output, running fallback OSINT extractor...');
            const fallbackItem = await this.fallbackExtract(targetUrl);
            await this.enrichWithDnsAndGeo(fallbackItem);
            return resolve([fallbackItem]);
          }

          if (error) {
            console.error('[ScraperService] Scrapy error:', stderr || error.message);
            return reject(new Error(stderr || error.message));
          }

          resolve([]);
        } catch (e: any) {
          reject(e);
        }
      });
    });
  }

  /**
   * Enrich ScrapedResult with DNS (A, MX, TXT/SPF, NS) and IP Geolocation OSINT
   */
  public async enrichWithDnsAndGeo(item: ScrapedResult): Promise<void> {
    const domain = item.domain;
    if (!domain) return;

    if (!item.osint) {
      item.osint = {};
    }

    try {
      const dnsPromises = dns.promises;
      const [aRes, mxRes, txtRes, nsRes] = await Promise.allSettled([
        dnsPromises.resolve4(domain),
        dnsPromises.resolveMx(domain),
        dnsPromises.resolveTxt(domain),
        dnsPromises.resolveNs(domain),
      ]);

      const aRecords = aRes.status === 'fulfilled' ? aRes.value : [];
      const mxRecords = mxRes.status === 'fulfilled' ? mxRes.value : [];
      const txtRecords = txtRes.status === 'fulfilled' ? txtRes.value.map(chunks => chunks.join('')) : [];
      const nsRecords = nsRes.status === 'fulfilled' ? nsRes.value : [];

      item.osint.dns = {
        a: aRecords,
        mx: mxRecords,
        txt: txtRecords,
        ns: nsRecords,
      };

      // Perform Geolocation on first A record IP
      if (aRecords.length > 0) {
        const ip = aRecords[0];
        try {
          const geoRes = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,city,isp,org,as,query`, {
            signal: AbortSignal.timeout(3000),
          });
          if (geoRes.ok) {
            const geoData = await geoRes.json() as any;
            if (geoData.status === 'success') {
              item.osint.geo = geoData;
            }
          }
        } catch {}
      }

      // Check for any subdomains in MX records or subdomains_detail
      const existingSubdomains = new Set(item.subdomains || []);
      for (const mx of mxRecords) {
        if (mx.exchange && mx.exchange.endsWith('.' + domain)) {
          existingSubdomains.add(mx.exchange.toLowerCase());
        }
      }
      item.subdomains = Array.from(existingSubdomains).sort();

    } catch (e: any) {
      console.warn(`[ScraperService] DNS/Geo enrichment warning: ${e.message}`);
    }
  }

  /**
   * Lightweight in-memory fallback extractor with deep OSINT contact crawl & HackerTarget recon
   */
  public async fallbackExtract(url: string): Promise<ScrapedResult> {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    const parsedUrl = new URL(url);
    const domain = parsedUrl.hostname.toLowerCase();
    const origin = parsedUrl.origin;

    const parts = domain.split('.');
    const rootDomain = parts.length > 2 && (parts[parts.length - 2] === 'edu' || parts[parts.length - 2] === 'com' || parts[parts.length - 2] === 'gov' || parts[parts.length - 2] === 'co')
      ? parts.slice(-3).join('.')
      : parts.length > 2 ? parts.slice(-2).join('.') : domain;

    const emails = new Set<string>();
    const subdomains = new Set<string>();
    const subdomainsDetail: SubdomainDetail[] = [];
    const internalLinks = new Set<string>();
    const externalLinks = new Set<string>();
    const crawledPages: string[] = [];

    let title = domain;
    let description = '';
    let server = '';
    let contentType = '';
    let status = 200;
    let mainText = '';

    // 1. Passive HackerTarget Subdomain Query
    try {
      const htRes = await fetch(`https://api.hackertarget.com/hostsearch/?q=${rootDomain}`, {
        headers: { 'User-Agent': 'Mozilla/5.0 ZakOS-OSINT' },
        signal: AbortSignal.timeout(6000),
      });
      if (htRes.ok) {
        const text = await htRes.text();
        for (const line of text.trim().split('\n')) {
          if (line.includes(',')) {
            const [sub, ip] = line.split(',').map(s => s.trim().toLowerCase());
            if (sub && (sub.endsWith('.' + rootDomain) || sub === rootDomain)) {
              subdomains.add(sub);
              subdomainsDetail.push({ subdomain: sub, ip, source: 'hackertarget' });
            }
          }
        }
      }
    } catch {}

    // 2. Fetch Root Page
    try {
      crawledPages.push(url);
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ZakOS-Spider/2.0',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        signal: AbortSignal.timeout(10000),
      });

      status = res.status;
      server = res.headers.get('server') || '';
      contentType = res.headers.get('content-type') || '';
      const html = await res.text();

      // Title & Description
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (titleMatch) title = titleMatch[1].trim();

      const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i) ||
                        html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i);
      if (descMatch) description = descMatch[1].trim();

      // Email Extraction from Root
      this.extractEmailsFromHtml(html, emails);

      // Links Extraction
      const hrefMatches = html.matchAll(/href=["']([^"']+)["']/gi);
      const contactCandidates: string[] = [];

      for (const m of hrefMatches) {
        const href = m[1];
        if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:')) continue;
        try {
          const full = new URL(href, url).toString();
          const host = new URL(full).hostname.toLowerCase();
          if (host === domain || host.endsWith('.' + rootDomain)) {
            internalLinks.add(full);
            if (host !== rootDomain && host.endsWith('.' + rootDomain)) {
              subdomains.add(host);
            }
            if (/(contact|about|propos|talent|team|admission|utiles|career)/i.test(full)) {
              contactCandidates.push(full);
            }
          } else {
            externalLinks.add(full);
          }
        } catch {}
      }

      // Text snippet
      mainText = html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 8000);

      // 3. Deep Contact & Talent Page Crawl
      const candidatePaths = [
        `${origin}/contact-us/`,
        `${origin}/contact/`,
        `${origin}/contacts-utiles/`,
        `${origin}/a-propos/`,
        ...contactCandidates.slice(0, 5),
      ];

      for (const sub of subdomains) {
        if (/(talent|contact|career|apply)/i.test(sub)) {
          candidatePaths.push(`https://${sub}/en`);
          candidatePaths.push(`https://${sub}/`);
        }
      }

      for (const candUrl of Array.from(new Set(candidatePaths)).slice(0, 8)) {
        if (crawledPages.includes(candUrl)) continue;
        try {
          crawledPages.push(candUrl);
          const cRes = await fetch(candUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 ZakOS-OSINT/2.0' },
            signal: AbortSignal.timeout(4000),
          });
          if (cRes.ok) {
            const cHtml = await cRes.text();
            this.extractEmailsFromHtml(cHtml, emails);
          }
        } catch {}
      }

    } catch (e: any) {
      mainText = `Connection warning: ${e.message}`;
    }

    return {
      url,
      domain,
      metadata: {
        title,
        description,
        author: '',
        status,
        og: {},
        server,
        content_type: contentType,
      },
      emails: Array.from(emails).sort(),
      subdomains: Array.from(subdomains).sort(),
      links: {
        internal: Array.from(internalLinks).slice(0, 100),
        external: Array.from(externalLinks).slice(0, 100),
        total_internal: internalLinks.size,
        total_external: externalLinks.size,
      },
      text: mainText,
      scraped_at: new Date().toISOString(),
      osint: {
        root_domain: rootDomain,
        subdomains_detail: subdomainsDetail,
        crawled_pages: crawledPages,
      },
    };
  }

  private extractEmailsFromHtml(html: string, emailSet: Set<string>): void {
    // 1. Plain text regex
    const emailMatches = html.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
    for (const em of emailMatches) {
      const clean = em.toLowerCase().trim();
      if (!clean.match(/\.(png|jpg|jpeg|gif|svg|webp|css|js|ico|woff|ttf|json)$/i)) {
        emailSet.add(clean);
      }
    }

    // 2. Cloudflare email protection de-obfuscation
    const cfMatches = [
      ...(html.matchAll(/data-cfemail=["']([a-fA-F0-9]+)["']/gi) || []),
      ...(html.matchAll(/\/cdn-cgi\/l\/email-protection#([a-fA-F0-9]+)/gi) || []),
    ];
    for (const match of cfMatches) {
      const hex = match[1];
      const decoded = decodeCloudflareEmail(hex);
      if (decoded && /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(decoded)) {
        emailSet.add(decoded.toLowerCase().trim());
      }
    }
  }

  /**
   * Run GPT-6 Astra SOTA Threat & Surface Analysis
   */
  public async analyzeWithGpt6Astra(scrapedItem: ScrapedResult): Promise<ThreatAnalysis> {
    const apiKey = getExpLabsApiKey();
    const osint = scrapedItem.osint;
    const dnsInfo = osint?.dns;
    const geoInfo = osint?.geo;

    const prompt = `You are RedTeam & DevSecOps Lead for Zak_OS.
Perform an exhaustive, professional cybersecurity attack surface and threat reconnaissance analysis on this target data extracted via Scrapy and OSINT engine.

TARGET URL: ${scrapedItem.url}
DOMAIN: ${scrapedItem.domain}
ROOT DOMAIN: ${osint?.root_domain || scrapedItem.domain}
SERVER HEADERS: ${scrapedItem.metadata.server || 'None declared'}
STATUS: ${scrapedItem.metadata.status}
IP & GEOLOCATION: ${geoInfo ? `${geoInfo.query} | ${geoInfo.city}, ${geoInfo.country} | ISP: ${geoInfo.isp} | AS: ${geoInfo.as}` : (dnsInfo?.a?.[0] || 'Unknown')}
DNS A RECORDS: ${dnsInfo?.a?.join(', ') || 'N/A'}
DNS MX MAIL SERVERS: ${dnsInfo?.mx?.map(m => `${m.exchange} (pri: ${m.priority})`).join(', ') || 'N/A'}
DNS TXT / SPF / DMARC: ${dnsInfo?.txt?.join(' | ') || 'N/A'}
NAMESERVERS (NS): ${dnsInfo?.ns?.join(', ') || 'N/A'}
DISCOVERED EMAILS (${scrapedItem.emails.length}): ${scrapedItem.emails.join(', ') || 'None'}
DISCOVERED SUBDOMAINS (${scrapedItem.subdomains.length}): ${scrapedItem.subdomains.join(', ') || 'None'}
CRAWLED RECON PAGES (${osint?.crawled_pages?.length || 1}): ${osint?.crawled_pages?.join(', ') || scrapedItem.url}
INTERNAL LINKS: ${scrapedItem.links.total_internal} | EXTERNAL LINKS: ${scrapedItem.links.total_external}
PAGE TITLE: ${scrapedItem.metadata.title}
CONTENT EXCERPT: ${scrapedItem.text.slice(0, 2500)}

Please return your evaluation in structured Markdown covering:
1. **Executive Security Summary**: Overall risk posture, technology stack, and defense-in-depth posture.
2. **Threat Level**: [CRITICAL | HIGH | MEDIUM | LOW | INFORMATIONAL]
3. **Attack Surface & OSINT Findings**:
   - **Personnel / Email Exposure**: Specific spear-phishing and social engineering vectors based on harvested emails (${scrapedItem.emails.join(', ') || 'None'}).
   - **Subdomain Exposure & Lateral Movement**: Analysis of exposed subdomains (e.g. portals, webmail, student affairs, talent platforms).
   - **DNS & Infrastructure Recon**: Origin IP exposure through SPF/MX records, Cloudflare bypass risks, and mail security.
4. **Vulnerability Hypotheses**: Potential attack vectors to audit (e.g. Next.js / PHP / LiteSpeed vulnerabilities, exposed cPanel webmail, subdomain takeover).
5. **Tactical Remediation & Hardening**: Concrete security controls.`;

    try {
      const res = await fetch(`${EXPLABS_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(30000),
        body: JSON.stringify({
          model: 'gpt-6-astra',
          messages: [
            {
              role: 'system',
              content: 'You are an elite cybersecurity threat analyst in Zak_OS. Deliver rigorous, technically precise threat assessments.'
            },
            {
              role: 'user',
              content: prompt
            }
          ]
        })
      });

      if (!res.ok) {
        throw new Error(`GPT-6 Astra responded with status ${res.status}`);
      }

      const data = await res.json() as any;
      const content = data.choices?.[0]?.message?.content || 'No analysis returned.';

      // Determine Threat Level
      let threatLevel: ThreatAnalysis['threatLevel'] = 'MEDIUM';
      if (content.includes('CRITICAL')) threatLevel = 'CRITICAL';
      else if (content.includes('HIGH')) threatLevel = 'HIGH';
      else if (content.includes('LOW')) threatLevel = 'LOW';
      else if (content.includes('INFORMATIONAL')) threatLevel = 'INFORMATIONAL';

      return {
        summary: `Target ${scrapedItem.domain} analyzed by GPT-6 Astra. Posture: ${threatLevel}.`,
        threatLevel,
        attackSurface: scrapedItem.subdomains.length > 0 ? scrapedItem.subdomains : [scrapedItem.domain],
        vulnerabilities: [
          scrapedItem.metadata.server ? `Server fingerprint: ${scrapedItem.metadata.server}` : 'No server banner banner leak',
          scrapedItem.emails.length > 0 ? `${scrapedItem.emails.length} personnel emails harvested for OSINT` : 'Zero emails harvested',
          dnsInfo?.mx && dnsInfo.mx.length > 0 ? `Exposed ${dnsInfo.mx.length} MX mail routing servers` : 'No MX records',
          scrapedItem.subdomains.length > 0 ? `${scrapedItem.subdomains.length} mapped subdomains expanding attack surface` : 'Single domain'
        ],
        recommendations: [
          'Verify SPF/DKIM/DMARC alignment to mitigate email spoofing.',
          'Review exposed subdomains for subdomain takeover or unprotected administrative portals.',
          'Enforce strict Content Security Policy (CSP) and mask backend server headers.'
        ],
        rawAnalysis: content
      };
    } catch (err: any) {
      console.error('[ScraperService] GPT-6 Astra analysis error:', err.message);
      return {
        summary: `Automated assessment for ${scrapedItem.domain}`,
        threatLevel: 'INFORMATIONAL',
        attackSurface: [scrapedItem.domain],
        vulnerabilities: ['Automated heuristic fallback (API unreachable)'],
        recommendations: ['Check Experiential Labs API key status in Settings.'],
        rawAnalysis: `### 🛡️ Heuristic Recon Summary\n\n- **Target:** ${scrapedItem.url}\n- **Harvested Emails:** ${scrapedItem.emails.length}\n- **Mapped Subdomains:** ${scrapedItem.subdomains.length}\n\n*Note: GPT-6 Astra inference encountered: ${err.message}*`
      };
    }
  }

  /**
   * Run GPT-6 Astra Threat Intelligence on a CVE or Security News Feed item
   */
  public async analyzeCybersecItem(item: any): Promise<string> {
    const apiKey = getExpLabsApiKey();
    const prompt = `Perform an expert cybersecurity triage on this security feed item:
TITLE: ${item.title}
SOURCE: ${item.source}
CVE ID: ${item.cve_id || 'N/A'}
DESCRIPTION: ${item.description}
DATE: ${item.published_date}

Provide:
1. Executive Triage Summary
2. CVE / Threat Extraction & Estimated CVSS v3/v4 Score
3. Attack Vector & Exploitation Scenario
4. Detection & Mitigation Guidance (Snort/YARA rule suggestions or patching priority)`;

    try {
      const res = await fetch(`${EXPLABS_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(30000),
        body: JSON.stringify({
          model: 'gpt-6-astra',
          messages: [
            {
              role: 'system',
              content: 'You are the Lead Threat Intelligence Analyst of Zak_OS.'
            },
            {
              role: 'user',
              content: prompt
            }
          ]
        })
      });

      if (!res.ok) {
        throw new Error(`GPT-6 Astra error: ${res.status}`);
      }

      const data = await res.json() as any;
      return data.choices?.[0]?.message?.content || 'No threat briefing generated.';
    } catch (e: any) {
      return `### Threat Analysis (Offline Fallback)\n\n**Item:** ${item.title}\n\n*Error connecting to GPT-6 Astra: ${e.message}*`;
    }
  }
}

export const scraperService = new ScraperService();
