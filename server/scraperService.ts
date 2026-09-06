import { execFile, spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { getExpLabsApiKey, EXPLABS_BASE_URL } from './agent';

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
}

export interface ThreatAnalysis {
  summary: string;
  threatLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFORMATIONAL';
  attackSurface: string[];
  vulnerabilities: string[];
  recommendations: string[];
  rawAnalysis: string;
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
   * Run a Scrapy spider and return the parsed JSON results
   */
  public async crawl(spiderName: string = 'zakos', targetUrl?: string): Promise<ScrapedResult[]> {
    const pythonExe = this.getPythonExecutable();
    const tempOutputFile = path.join(os.tmpdir(), `scrapy_out_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.json`);

    const args = ['-m', 'scrapy', 'crawl', spiderName];
    if (targetUrl) {
      args.push('-a', `url=${targetUrl}`);
    }
    args.push('-O', tempOutputFile);

    return new Promise((resolve, reject) => {
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
              const items = Array.isArray(parsed) ? parsed : [parsed];
              console.log(`[ScraperService] Successfully scraped ${items.length} items with ${spiderName}`);
              return resolve(items);
            }
          }

          // If Scrapy didn't write a file or errored, check if targetUrl is provided for Node fallback
          if (targetUrl && spiderName === 'zakos') {
            console.warn('[ScraperService] Scrapy produced empty output, running fallback HTTP extractor...');
            const fallbackItem = await this.fallbackExtract(targetUrl);
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
   * Lightweight in-memory fallback extractor if Scrapy Python binary is blocked by OS
   */
  public async fallbackExtract(url: string): Promise<ScrapedResult> {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    const parsedUrl = new URL(url);
    const domain = parsedUrl.hostname.toLowerCase();

    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'ZakOS-Spider/1.0 (+https://github.com/oukil078-oss/ZakOS)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });

      const html = await res.text();
      const status = res.status;
      const server = res.headers.get('server') || '';
      const contentType = res.headers.get('content-type') || '';

      // Title
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : domain;

      // Meta description
      const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i) ||
                        html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i);
      const description = descMatch ? descMatch[1].trim() : '';

      // Emails
      const emailMatches = html.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
      const cleanEmails = Array.from(new Set(emailMatches.filter(e => !e.match(/\.(png|jpg|jpeg|gif|svg|webp)$/i)))).sort();

      // Links & subdomains
      const hrefMatches = html.matchAll(/href=["']([^"']+)["']/gi);
      const internalLinks = new Set<string>();
      const externalLinks = new Set<string>();
      const subdomains = new Set<string>();

      const rootParts = domain.split('.');
      const rootDomain = rootParts.length > 2 ? rootParts.slice(-2).join('.') : domain;

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
          } else {
            externalLinks.add(full);
          }
        } catch {}
      }

      // Text snippet
      const cleanText = html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 8000);

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
        emails: cleanEmails,
        subdomains: Array.from(subdomains).sort(),
        links: {
          internal: Array.from(internalLinks).slice(0, 100),
          external: Array.from(externalLinks).slice(0, 100),
          total_internal: internalLinks.size,
          total_external: externalLinks.size,
        },
        text: cleanText,
        scraped_at: new Date().toISOString(),
      };
    } catch (e: any) {
      return {
        url,
        domain,
        metadata: {
          title: 'Extraction Error',
          description: e.message,
          author: '',
          status: 500,
          og: {},
        },
        emails: [],
        subdomains: [],
        links: { internal: [], external: [], total_internal: 0, total_external: 0 },
        text: `Failed to connect: ${e.message}`,
        scraped_at: new Date().toISOString(),
      };
    }
  }

  /**
   * Run GPT-6 Astra SOTA Threat & Surface Analysis
   */
  public async analyzeWithGpt6Astra(scrapedItem: ScrapedResult): Promise<ThreatAnalysis> {
    const apiKey = getExpLabsApiKey();
    const prompt = `You are RedTeam & DevSecOps Lead for Zak_OS.
Perform a rigorous, professional cybersecurity attack surface and threat analysis on this target data extracted via Scrapy.

TARGET URL: ${scrapedItem.url}
DOMAIN: ${scrapedItem.domain}
SERVER HEADERS: ${scrapedItem.metadata.server || 'None declared'}
STATUS: ${scrapedItem.metadata.status}
DISCOVERED EMAILS (${scrapedItem.emails.length}): ${scrapedItem.emails.join(', ') || 'None'}
DISCOVERED SUBDOMAINS (${scrapedItem.subdomains.length}): ${scrapedItem.subdomains.join(', ') || 'None'}
INTERNAL LINKS COUNT: ${scrapedItem.links.total_internal}
EXTERNAL LINKS COUNT: ${scrapedItem.links.total_external}
PAGE TITLE: ${scrapedItem.metadata.title}
CONTENT EXCERPT: ${scrapedItem.text.slice(0, 2000)}

Please return your evaluation in structured Markdown covering:
1. **Executive Security Summary**: Overall risk posture and what this service exposes.
2. **Threat Level**: [CRITICAL | HIGH | MEDIUM | LOW | INFORMATIONAL]
3. **Attack Surface & Recon Findings**:
   - Email harvesting / OSINT / Spear-phishing vector
   - Subdomain expansion & lateral movement surface
   - Server header information leaks & web technology fingerprinting
4. **Vulnerability Hypotheses**: Potential CVEs or misconfigurations to audit (e.g. WebDAV, IIS, outdated framework, CORS).
5. **Tactical Remediation & Defense**: Actionable hardening steps.`;

    try {
      const res = await fetch(`${EXPLABS_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
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
          scrapedItem.metadata.server ? `Server fingerprint exposed: ${scrapedItem.metadata.server}` : 'No server banner banner leak',
          scrapedItem.emails.length > 0 ? `${scrapedItem.emails.length} personnel emails exposed for OSINT` : 'Zero emails harvested',
        ],
        recommendations: [
          'Suppress server headers to prevent technology fingerprinting.',
          'Verify SPF/DKIM/DMARC records for harvested email addresses.',
          'Enforce strict Content Security Policy (CSP) headers.'
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
        rawAnalysis: `### 🛡️ Heuristic Recon Summary\n\n- **Target:** ${scrapedItem.url}\n- **Discovered Emails:** ${scrapedItem.emails.length}\n- **Mapped Subdomains:** ${scrapedItem.subdomains.length}\n\n*Note: GPT-6 Astra inference encountered: ${err.message}*`
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
