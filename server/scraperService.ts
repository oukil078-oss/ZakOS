import { execFile } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import dns from 'dns';
import net from 'net';
import tls from 'tls';
import http from 'http';
import https from 'https';
import { getExpLabsApiKey, EXPLABS_BASE_URL } from './agent';

export interface SubdomainDetail {
  subdomain: string;
  ip?: string;
  source?: string;
}

export interface SensitiveFileFinding {
  path: string;
  url: string;
  status: number;
  contentType?: string;
  size?: number;
  snippet?: string;
  source: 'robots.txt' | 'heuristic' | 'directory_listing' | 'sitemap';
  emails_found?: string[];
  interesting: boolean;
  notes?: string;
}

export interface RobotsTxtData {
  disallow: string[];
  allow: string[];
  sitemaps: string[];
  raw?: string;
}

export interface SslCertInfo {
  cn?: string;
  sans?: string[];
  issuer?: string;
  validFrom?: string;
  validTo?: string;
  serialNumber?: string;
}

export interface SecurityHeaderFinding {
  header: string;
  value?: string;
  status: 'pass' | 'fail' | 'warn';
  importance: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  recommendation: string;
}

export interface SecurityHeadersAudit {
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  score: number;
  passCount: number;
  failCount: number;
  findings: SecurityHeaderFinding[];
}

export interface DetectedTechnology {
  name: string;
  category: 'Web Server' | 'CMS' | 'Frontend' | 'Backend' | 'CDN / WAF' | 'Analytics' | 'Security / Captcha';
  version?: string;
  confidence: 'high' | 'medium' | 'low';
  icon?: string;
}

export interface EmailSecurityPosture {
  spf: {
    record?: string;
    status: 'hardfail' | 'softfail' | 'neutral' | 'missing' | 'vulnerable';
    description: string;
    relayNetworks?: string[];
  };
  dmarc: {
    record?: string;
    policy?: 'reject' | 'quarantine' | 'none' | 'missing';
    status: 'strong' | 'moderate' | 'insecure' | 'missing';
    description: string;
    ruaMailbox?: string;
  };
  caa?: {
    records: string[];
    authorizedCas: string[];
    status: 'enforced' | 'missing';
  };
}

export interface SecurityTxtData {
  exists: boolean;
  url?: string;
  contact?: string[];
  policy?: string;
  encryption?: string;
  hiring?: string;
  acknowledgments?: string;
  canonical?: string;
  raw?: string;
}

export interface RdapData {
  target: string;
  handle?: string;
  name?: string;
  country?: string;
  registrar?: string;
  startAddress?: string;
  endAddress?: string;
  created?: string;
  expires?: string;
  updated?: string;
  status?: string[];
  raw?: any;
}

export interface OsintReconData {
  root_domain?: string;
  is_ip?: boolean;
  target_ip?: string;
  reverse_dns?: string[];
  ssl_cert?: SslCertInfo;
  robots_txt?: RobotsTxtData;
  sensitive_files?: SensitiveFileFinding[];
  subdomains_detail?: SubdomainDetail[];
  crawled_pages?: string[];
  security_headers?: SecurityHeadersAudit;
  technologies?: DetectedTechnology[];
  email_security?: EmailSecurityPosture;
  security_txt?: SecurityTxtData;
  rdap?: RdapData;
  ct_subdomains_count?: number;
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
   * Determine if a host is an IPv4 or IPv6 address
   */
  public isIp(host: string): boolean {
    return net.isIP(host) !== 0;
  }

  /**
   * Normalize input into URL and host metadata
   */
  public parseTarget(input: string): {
    normalizedUrl: string;
    host: string;
    isIp: boolean;
    protocol: string;
    port: number;
    origin: string;
  } {
    let clean = input.trim();
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      clean = 'https://' + clean;
    }
    try {
      const parsed = new URL(clean);
      const host = parsed.hostname.toLowerCase();
      const isIp = this.isIp(host);
      const protocol = parsed.protocol;
      const port = parsed.port ? parseInt(parsed.port, 10) : (protocol === 'https:' ? 443 : 80);
      return {
        normalizedUrl: parsed.toString(),
        host,
        isIp,
        protocol,
        port,
        origin: parsed.origin,
      };
    } catch {
      const isIp = this.isIp(clean);
      return {
        normalizedUrl: 'https://' + clean,
        host: clean.toLowerCase(),
        isIp,
        protocol: 'https:',
        port: 443,
        origin: 'https://' + clean,
      };
    }
  }

  /**
   * Inspect TLS certificate on port 443 to extract CN, SANs, Issuer, and Expiry
   */
  public async inspectTlsCert(host: string, port = 443): Promise<SslCertInfo | null> {
    return new Promise((resolve) => {
      try {
        const socket = tls.connect({
          host,
          port,
          servername: net.isIP(host) ? undefined : host,
          rejectUnauthorized: false,
          timeout: 4500,
        }, () => {
          try {
            const cert = socket.getPeerCertificate();
            if (cert && Object.keys(cert).length > 0) {
              const cn = cert.subject?.CN;
              const issuer = typeof cert.issuer === 'object'
                ? `${cert.issuer.O || ''} ${cert.issuer.CN || ''}`.trim()
                : String(cert.issuer || '');

              let sans: string[] = [];
              if (cert.subjectaltname) {
                sans = cert.subjectaltname
                  .split(',')
                  .map((s: string) => s.trim().replace(/^DNS:/i, ''))
                  .filter(Boolean);
              }

              socket.end();
              return resolve({
                cn,
                sans: Array.from(new Set(sans)),
                issuer,
                validFrom: cert.valid_from,
                validTo: cert.valid_to,
                serialNumber: cert.serialNumber,
              });
            }
          } catch {}
          socket.end();
          resolve(null);
        });

        const timer = setTimeout(() => {
          try { socket.destroy(); } catch {}
          resolve(null);
        }, 3000);

        socket.on('error', () => {
          clearTimeout(timer);
          resolve(null);
        });
        socket.on('timeout', () => {
          clearTimeout(timer);
          try { socket.destroy(); } catch {}
          resolve(null);
        });
      } catch {
        resolve(null);
      }
    });
  }

  /**
   * Direct HTTP/HTTPS request with certificate bypass for raw IP/domain probing
   */
  public async probeHttpEndpoint(
    urlStr: string,
    timeoutMs = 3000
  ): Promise<{ status: number; headers: Record<string, string>; body: string; title: string; contentType: string } | null> {
    return new Promise((resolve) => {
      let resolved = false;
      const cleanup = (val: any) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(hardTimer);
          resolve(val);
        }
      };

      const hardTimer = setTimeout(() => {
        try {
          if (req) req.destroy();
        } catch {}
        cleanup(null);
      }, timeoutMs);

      let req: any = null;
      try {
        const parsed = new URL(urlStr);
        const isHttps = parsed.protocol === 'https:';
        const client = isHttps ? https : http;

        const options = {
          protocol: parsed.protocol,
          hostname: parsed.hostname,
          port: parsed.port || (isHttps ? 443 : 80),
          path: parsed.pathname + parsed.search,
          method: 'GET',
          rejectUnauthorized: false,
          timeout: timeoutMs,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ZakOS-OSINT/2.0',
            'Accept': '*/*',
          },
        };

        req = client.request(options, (res) => {
          const status = res.statusCode || 0;
          const headers: Record<string, string> = {};
          for (const [k, v] of Object.entries(res.headers)) {
            if (typeof v === 'string') headers[k.toLowerCase()] = v;
            else if (Array.isArray(v)) headers[k.toLowerCase()] = v.join(', ');
          }

          let body = '';
          res.setEncoding('utf8');
          res.on('data', (chunk) => {
            if (body.length < 100000) body += chunk;
          });
          res.on('end', () => {
            let title = '';
            const m = body.match(/<title[^>]*>([^<]+)<\/title>/i);
            if (m) title = m[1].trim();
            cleanup({
              status,
              headers,
              body,
              title,
              contentType: headers['content-type'] || '',
            });
          });
        });

        req.on('error', () => cleanup(null));
        req.on('timeout', () => {
          try { req.destroy(); } catch {}
          cleanup(null);
        });
        req.end();
      } catch {
        cleanup(null);
      }
    });
  }

  /**
   * Robots.txt Parsing & Deep Folder / File Digging
   */
  public async performRobotsAndFolderDigging(
    origin: string,
    emailsSet: Set<string>,
    rootDomain?: string
  ): Promise<{
    robots: RobotsTxtData;
    files: SensitiveFileFinding[];
    crawledPages: string[];
  }> {
    const robotsData: RobotsTxtData = {
      disallow: [],
      allow: [],
      sitemaps: [],
      raw: '',
    };
    const files: SensitiveFileFinding[] = [];
    const crawledPages: string[] = [];

    // 1. Fetch /robots.txt
    const robotsUrl = `${origin}/robots.txt`;
    crawledPages.push(robotsUrl);
    const robotsProbe = await this.probeHttpEndpoint(robotsUrl, 5000);

    if (robotsProbe && robotsProbe.status === 200 && robotsProbe.body) {
      robotsData.raw = robotsProbe.body;
      const lines = robotsProbe.body.split('\n');
      for (let line of lines) {
        line = line.trim();
        if (line.startsWith('#') || !line) continue;

        const disallowMatch = line.match(/^Disallow:\s*(.*)$/i);
        if (disallowMatch) {
          const pathVal = disallowMatch[1].trim();
          if (pathVal && !robotsData.disallow.includes(pathVal)) {
            robotsData.disallow.push(pathVal);
          }
        }

        const allowMatch = line.match(/^Allow:\s*(.*)$/i);
        if (allowMatch) {
          const pathVal = allowMatch[1].trim();
          if (pathVal && !robotsData.allow.includes(pathVal)) {
            robotsData.allow.push(pathVal);
          }
        }

        const sitemapMatch = line.match(/^Sitemap:\s*(.*)$/i);
        if (sitemapMatch) {
          const smUrl = sitemapMatch[1].trim();
          if (smUrl && !robotsData.sitemaps.includes(smUrl)) {
            robotsData.sitemaps.push(smUrl);
          }
        }
      }

      files.push({
        path: '/robots.txt',
        url: robotsUrl,
        status: 200,
        contentType: robotsProbe.contentType,
        size: robotsProbe.body.length,
        snippet: robotsProbe.body.slice(0, 300),
        source: 'robots.txt',
        interesting: true,
        notes: `Disallow rules: ${robotsData.disallow.length} | Sitemaps: ${robotsData.sitemaps.length}`,
      });
    }

    // 2. Build candidate paths to dig into (Disallowed paths + SOTA recon endpoints)
    const pathsToProbe: { path: string; source: SensitiveFileFinding['source']; reason: string }[] = [];

    // Add Disallowed folders from robots.txt
    for (const d of robotsData.disallow.slice(0, 10)) {
      if (!d.startsWith('/')) continue;
      pathsToProbe.push({
        path: d,
        source: 'robots.txt',
        reason: 'Restricted path declared in robots.txt',
      });
    }

    // Add Standard Recon / Sensitive Endpoints
    const standardEndpoints = [
      { path: '/sitemap_index.xml', reason: 'XML Sitemap index' },
      { path: '/sitemap.xml', reason: 'Standard XML Sitemap' },
      { path: '/.well-known/security.txt', reason: 'RFC 9116 Security Contacts' },
      { path: '/security.txt', reason: 'Root Security Contacts' },
      { path: '/humans.txt', reason: 'Authors & Developer credits' },
      { path: '/README.md', reason: 'Repository/Project Readme' },
      { path: '/.git/HEAD', reason: 'Exposed Git Repository' },
      { path: '/version.txt', reason: 'Build Version identifier' },
      { path: '/changelog.txt', reason: 'Changelog leak' },
      { path: '/.env.example', reason: 'Environment template leak' },
      { path: '/composer.json', reason: 'PHP Dependencies configuration' },
      { path: '/package.json', reason: 'Node.js Package configuration' },
    ];

    for (const ep of standardEndpoints) {
      if (!pathsToProbe.some((p) => p.path === ep.path)) {
        pathsToProbe.push({
          path: ep.path,
          source: 'heuristic',
          reason: ep.reason,
        });
      }
    }

    // 3. Probe folders and files concurrently
    const probeBatch = pathsToProbe.slice(0, 16);
    await Promise.allSettled(
      probeBatch.map(async (target) => {
        const fullUrl = `${origin}${target.path.startsWith('/') ? '' : '/'}${target.path}`;
        crawledPages.push(fullUrl);
        const probeRes = await this.probeHttpEndpoint(fullUrl, 3000);

        if (probeRes && (probeRes.status === 200 || probeRes.status === 403 || probeRes.status === 401 || probeRes.status === 301 || probeRes.status === 302)) {
          const bodySnippet = probeRes.body.replace(/\s+/g, ' ').trim().slice(0, 300);
          const emailsFoundInFile: string[] = [];
          this.extractEmailsFromHtml(probeRes.body, emailsSet);

          // Check if directory listing
          const isDirListing = /<title>Index of /i.test(probeRes.body) || /Directory listing for/i.test(probeRes.body);
          let note = target.reason;
          if (isDirListing) {
            note = 'CRITICAL: Open directory listing exposed!';
            const dirFiles = Array.from(probeRes.body.matchAll(/href=["']([^"'?#]+(?:\.txt|\.log|\.cfg|\.conf|\.sql|\.bak|\.env|\.json|\.csv|\.md))["']/gi))
              .map((m) => m[1])
              .slice(0, 3);

            for (const df of dirFiles) {
              const fileUrl = new URL(df, fullUrl).toString();
              crawledPages.push(fileUrl);
              const dfRes = await this.probeHttpEndpoint(fileUrl, 3000);
              if (dfRes && dfRes.status === 200) {
                this.extractEmailsFromHtml(dfRes.body, emailsSet);
                files.push({
                  path: `${target.path}/${df}`,
                  url: fileUrl,
                  status: dfRes.status,
                  contentType: dfRes.contentType,
                  size: dfRes.body.length,
                  snippet: dfRes.body.slice(0, 300),
                  source: 'directory_listing',
                  interesting: true,
                  notes: 'Text file harvested from open directory listing',
                });
              }
            }
          } else if (probeRes.status === 403) {
            note = 'Protected folder (403 Forbidden) - Server confirms directory exists';
          } else if (probeRes.status === 401) {
            note = 'Protected endpoint (401 Unauthorized) - HTTP Auth enforced';
          } else if (probeRes.status === 200 && probeRes.body.length === 0) {
            note = 'Empty index file preventing directory listing';
          }

          files.push({
            path: target.path,
            url: fullUrl,
            status: probeRes.status,
            contentType: probeRes.contentType,
            size: probeRes.body.length,
            snippet: bodySnippet,
            source: target.source,
            emails_found: emailsFoundInFile,
            interesting: probeRes.status === 200 || probeRes.status === 403,
            notes: note,
          });
        }
      })
    );

    // 4. Dig through discovered XML Sitemaps for deep contact/about pages
    const sitemapsToCrawl = [...robotsData.sitemaps];
    if (sitemapsToCrawl.length === 0 && rootDomain && !this.isIp(rootDomain)) {
      sitemapsToCrawl.push(`${origin}/sitemap_index.xml`);
    }

    for (const sm of sitemapsToCrawl.slice(0, 2)) {
      try {
        const smRes = await this.probeHttpEndpoint(sm, 2500);
        if (smRes && smRes.status === 200 && smRes.body.includes('<loc>')) {
          const locs = Array.from(smRes.body.matchAll(/<loc>([^<]+)<\/loc>/g))
            .map((m) => m[1].trim())
            .filter((u) => u.startsWith('http'));

          const pageSitemap = locs.find((u) => /(page|post|program)/i.test(u));
          let candidateUrls = locs;
          if (pageSitemap) {
            const nestedRes = await this.probeHttpEndpoint(pageSitemap, 4000);
            if (nestedRes && nestedRes.status === 200) {
              candidateUrls = Array.from(nestedRes.body.matchAll(/<loc>([^<]+)<\/loc>/g))
                .map((m) => m[1].trim())
                .filter((u) => u.startsWith('http'));
            }
          }

          const priorityContactUrls = candidateUrls.filter((u) =>
            /(contact|about|propos|talent|admission|utiles|career|equipe|staff)/i.test(u)
          );

          for (const candUrl of priorityContactUrls.slice(0, 6)) {
            if (crawledPages.includes(candUrl)) continue;
            crawledPages.push(candUrl);
            const candRes = await this.probeHttpEndpoint(candUrl, 3500);
            if (candRes && candRes.status === 200) {
              this.extractEmailsFromHtml(candRes.body, emailsSet);
            }
          }
        }
      } catch {}
    }

    return {
      robots: robotsData,
      files,
      crawledPages,
    };
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

              // Enrich item 0 with DNS, Geolocation, Robots, TLS OSINT
              if (items.length > 0 && items[0].domain) {
                await this.enrichWithDnsAndGeo(items[0]);
              }

              return resolve(items);
            }
          }

          // Fallback OSINT extractor
          if (targetUrl && spiderName === 'zakos') {
            console.warn('[ScraperService] Scrapy output empty or unavailable, running ZakOS fallback OSINT extractor...');
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
   * Enrich ScrapedResult with DNS (A, MX, TXT/SPF, NS), Reverse DNS, Geolocation, SSL Cert, and Robots/Folders
   */
  /**
   * 1. Audit HTTP Security Headers & calculate OWASP defense grade
   */
  public auditSecurityHeaders(headers: Record<string, string> = {}): SecurityHeadersAudit {
    const findings: SecurityHeaderFinding[] = [];
    const normalized: Record<string, string> = {};
    for (const [k, v] of Object.entries(headers || {})) {
      normalized[k.toLowerCase()] = v;
    }

    let passCount = 0;
    let failCount = 0;
    let score = 100;

    // Content-Security-Policy
    const csp = normalized['content-security-policy'];
    if (csp) {
      passCount++;
      findings.push({
        header: 'Content-Security-Policy',
        value: csp.slice(0, 140) + (csp.length > 140 ? '...' : ''),
        status: 'pass',
        importance: 'critical',
        description: 'Restricts sources of executable scripts, objects, frames, and connections.',
        recommendation: 'Policy active. Ensure default-src and script-src avoid unsafe-inline or unsafe-eval.',
      });
    } else {
      failCount++;
      score -= 25;
      findings.push({
        header: 'Content-Security-Policy',
        status: 'fail',
        importance: 'critical',
        description: 'Defines approved content sources to prevent Cross-Site Scripting (XSS) and injection.',
        recommendation: 'Deploy a robust CSP header (e.g. default-src \'self\'; script-src \'self\').',
      });
    }

    // Strict-Transport-Security (HSTS)
    const hsts = normalized['strict-transport-security'];
    if (hsts) {
      const maxAgeMatch = hsts.match(/max-age=(\d+)/i);
      const maxAge = maxAgeMatch ? parseInt(maxAgeMatch[1], 10) : 0;
      if (maxAge >= 15768000) {
        passCount++;
        findings.push({
          header: 'Strict-Transport-Security',
          value: hsts,
          status: 'pass',
          importance: 'high',
          description: 'Enforces HTTPS encryption and protects against SSL-stripping MITM attacks.',
          recommendation: 'HSTS is properly configured with an effective expiration window.',
        });
      } else {
        score -= 10;
        findings.push({
          header: 'Strict-Transport-Security',
          value: hsts,
          status: 'warn',
          importance: 'high',
          description: 'HSTS max-age is below recommended 1-year threshold (31536000s).',
          recommendation: 'Increase max-age to at least 31536000 and includeSubDomains.',
        });
      }
    } else {
      failCount++;
      score -= 20;
      findings.push({
        header: 'Strict-Transport-Security',
        status: 'fail',
        importance: 'high',
        description: 'Forces web browsers to only communicate over encrypted HTTPS.',
        recommendation: 'Set Strict-Transport-Security: max-age=31536000; includeSubDomains; preload.',
      });
    }

    // X-Frame-Options
    const xfo = normalized['x-frame-options'];
    if (xfo && (xfo.toUpperCase() === 'DENY' || xfo.toUpperCase() === 'SAMEORIGIN')) {
      passCount++;
      findings.push({
        header: 'X-Frame-Options',
        value: xfo,
        status: 'pass',
        importance: 'high',
        description: 'Prevents site embedding in foreign iframes (Clickjacking defense).',
        recommendation: 'Clickjacking mitigation is active.',
      });
    } else {
      failCount++;
      score -= 15;
      findings.push({
        header: 'X-Frame-Options',
        status: 'fail',
        importance: 'high',
        description: 'Mitigates UI redressing / Clickjacking attacks.',
        recommendation: 'Set X-Frame-Options: SAMEORIGIN or DENY.',
      });
    }

    // X-Content-Type-Options
    const xcto = normalized['x-content-type-options'];
    if (xcto && xcto.toLowerCase() === 'nosniff') {
      passCount++;
      findings.push({
        header: 'X-Content-Type-Options',
        value: xcto,
        status: 'pass',
        importance: 'medium',
        description: 'Prevents MIME-type confusion / sniffing vulnerabilities in browsers.',
        recommendation: 'nosniff directive is active.',
      });
    } else {
      failCount++;
      score -= 10;
      findings.push({
        header: 'X-Content-Type-Options',
        status: 'fail',
        importance: 'medium',
        description: 'Prevents MIME-sniffing by instructing browsers to respect declared Content-Type.',
        recommendation: 'Set X-Content-Type-Options: nosniff.',
      });
    }

    // Referrer-Policy
    const refPol = normalized['referrer-policy'];
    if (refPol && !refPol.toLowerCase().includes('unsafe-url')) {
      passCount++;
      findings.push({
        header: 'Referrer-Policy',
        value: refPol,
        status: 'pass',
        importance: 'medium',
        description: 'Controls how much referrer information is sent with outbound navigation.',
        recommendation: 'Referrer policy is securely restricted.',
      });
    } else {
      failCount++;
      score -= 10;
      findings.push({
        header: 'Referrer-Policy',
        status: 'fail',
        importance: 'medium',
        description: 'Restricts path and query parameter leakage in HTTP Referer headers.',
        recommendation: 'Set Referrer-Policy: strict-origin-when-cross-origin.',
      });
    }

    // Permissions-Policy
    const permPol = normalized['permissions-policy'] || normalized['feature-policy'];
    if (permPol) {
      passCount++;
      findings.push({
        header: 'Permissions-Policy',
        value: permPol.slice(0, 90) + (permPol.length > 90 ? '...' : ''),
        status: 'pass',
        importance: 'low',
        description: 'Restricts browser APIs (camera, microphone, geolocation).',
        recommendation: 'Permissions policy is active.',
      });
    } else {
      score -= 5;
      findings.push({
        header: 'Permissions-Policy',
        status: 'warn',
        importance: 'low',
        description: 'Controls access to hardware sensors and browser features.',
        recommendation: 'Consider setting Permissions-Policy (e.g. camera=(), microphone=()).',
      });
    }

    // Server / X-Powered-By leakage
    const serverHdr = normalized['server'];
    const poweredBy = normalized['x-powered-by'];
    if (poweredBy) {
      failCount++;
      score -= 10;
      findings.push({
        header: 'X-Powered-By Leakage',
        value: poweredBy,
        status: 'fail',
        importance: 'medium',
        description: 'Leaking backend technology stack aids targeted version exploit enumeration.',
        recommendation: 'Disable X-Powered-By header in web server configuration.',
      });
    } else if (serverHdr && /\d+\.\d+/.test(serverHdr)) {
      score -= 5;
      findings.push({
        header: 'Server Banner Version Leak',
        value: serverHdr,
        status: 'warn',
        importance: 'medium',
        description: `Exact server version revealed: ${serverHdr}.`,
        recommendation: 'Conceal granular software versions in production web server configuration.',
      });
    } else {
      passCount++;
      findings.push({
        header: 'Server & Tech Concealment',
        value: serverHdr || 'Concealed',
        status: 'pass',
        importance: 'low',
        description: 'No sensitive backend version numbers exposed in headers.',
        recommendation: 'Good hardening practice.',
      });
    }

    score = Math.max(0, Math.min(100, score));
    let grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F' = 'F';
    if (score >= 95) grade = 'A+';
    else if (score >= 85) grade = 'A';
    else if (score >= 70) grade = 'B';
    else if (score >= 55) grade = 'C';
    else if (score >= 40) grade = 'D';
    else grade = 'F';

    return {
      grade,
      score,
      passCount,
      failCount,
      findings,
    };
  }

  /**
   * 2. Passive Technology & Component Stack Fingerprinting
   */
  public detectTechnologies(headers: Record<string, string> = {}, html: string = ''): DetectedTechnology[] {
    const techs: DetectedTechnology[] = [];
    const normalized: Record<string, string> = {};
    for (const [k, v] of Object.entries(headers || {})) {
      normalized[k.toLowerCase()] = v;
    }

    const server = normalized['server'] || '';
    const poweredBy = normalized['x-powered-by'] || '';
    const setCookie = normalized['set-cookie'] || '';

    // Web Servers
    if (/litespeed/i.test(server)) {
      techs.push({ name: 'LiteSpeed Web Server', category: 'Web Server', confidence: 'high' });
    } else if (/nginx/i.test(server)) {
      const ver = server.match(/nginx\/([\d.]+)/i)?.[1];
      techs.push({ name: 'Nginx', category: 'Web Server', version: ver, confidence: 'high' });
    } else if (/apache/i.test(server)) {
      const ver = server.match(/apache\/([\d.]+)/i)?.[1];
      techs.push({ name: 'Apache HTTP Server', category: 'Web Server', version: ver, confidence: 'high' });
    } else if (/caddy/i.test(server)) {
      techs.push({ name: 'Caddy', category: 'Web Server', confidence: 'high' });
    } else if (/microsoft-iis/i.test(server)) {
      const ver = server.match(/microsoft-iis\/([\d.]+)/i)?.[1];
      techs.push({ name: 'Microsoft IIS', category: 'Web Server', version: ver, confidence: 'high' });
    } else if (/cloudflare/i.test(server)) {
      techs.push({ name: 'Cloudflare Edge Server', category: 'Web Server', confidence: 'high' });
    }

    // CDN / WAF
    if (normalized['cf-ray'] || /cloudflare/i.test(server) || /__cf_bm/i.test(setCookie)) {
      techs.push({ name: 'Cloudflare CDN / WAF', category: 'CDN / WAF', confidence: 'high' });
    }
    if (normalized['x-amz-cf-id'] || /cloudfront/i.test(server)) {
      techs.push({ name: 'Amazon CloudFront', category: 'CDN / WAF', confidence: 'high' });
    }
    if (normalized['x-served-by']?.includes('cache-') || /fastly/i.test(server)) {
      techs.push({ name: 'Fastly CDN', category: 'CDN / WAF', confidence: 'high' });
    }
    if (normalized['x-litespeed-cache']) {
      techs.push({ name: 'LSCache (LiteSpeed Cache)', category: 'CDN / WAF', confidence: 'high' });
    }

    // Backend / Platform
    if (/php/i.test(poweredBy) || /PHPSESSID/i.test(setCookie)) {
      const ver = poweredBy.match(/php\/([\d.]+)/i)?.[1];
      techs.push({ name: 'PHP', category: 'Backend', version: ver, confidence: 'high' });
    }
    if (/asp\.net/i.test(poweredBy) || normalized['x-aspnet-version'] || /ASP\.NET_SessionId/i.test(setCookie)) {
      techs.push({ name: 'ASP.NET', category: 'Backend', confidence: 'high' });
    }
    if (/express/i.test(poweredBy) || /connect\.sid/i.test(setCookie)) {
      techs.push({ name: 'Express.js (Node.js)', category: 'Backend', confidence: 'high' });
    }
    if (/laravel/i.test(setCookie) || /XSRF-TOKEN.*laravel/i.test(setCookie)) {
      techs.push({ name: 'Laravel', category: 'Backend', confidence: 'medium' });
    }
    if (/csrftoken.*django/i.test(setCookie) || /django/i.test(html)) {
      techs.push({ name: 'Django (Python)', category: 'Backend', confidence: 'medium' });
    }

    // CMS & Frameworks
    if (html) {
      if (/wp-content|wp-includes|wp-json/i.test(html)) {
        const wpVer = html.match(/name=["']generator["']\s+content=["']WordPress\s+([\d.]+)/i)?.[1];
        techs.push({ name: 'WordPress', category: 'CMS', version: wpVer, confidence: 'high' });
      }
      if (/Drupal\.settings|drupal\.js|name=["']generator["']\s+content=["']Drupal/i.test(html)) {
        techs.push({ name: 'Drupal', category: 'CMS', confidence: 'high' });
      }
      if (/cdn\.shopify\.com|Shopify\.theme/i.test(html)) {
        techs.push({ name: 'Shopify', category: 'CMS', confidence: 'high' });
      }
      if (/joomla/i.test(html)) {
        techs.push({ name: 'Joomla', category: 'CMS', confidence: 'high' });
      }

      if (/__NEXT_DATA__|_next\/static/i.test(html)) {
        techs.push({ name: 'Next.js (React Framework)', category: 'Frontend', confidence: 'high' });
      } else if (/__NUXT__|_nuxt\//i.test(html)) {
        techs.push({ name: 'Nuxt (Vue Framework)', category: 'Frontend', confidence: 'high' });
      } else if (/data-reactroot|_reactListening|react\.production/i.test(html)) {
        techs.push({ name: 'React', category: 'Frontend', confidence: 'high' });
      } else if (/data-v-|__vue_app__|vue\.global/i.test(html)) {
        techs.push({ name: 'Vue.js', category: 'Frontend', confidence: 'high' });
      } else if (/ng-version|ng-app/i.test(html)) {
        const ngVer = html.match(/ng-version=["']([\d.]+)/i)?.[1];
        techs.push({ name: 'Angular', category: 'Frontend', version: ngVer, confidence: 'high' });
      }

      if (/jquery[.-]([\d.]+)?\.min\.js/i.test(html) || /jQuery/i.test(html)) {
        const jqVer = html.match(/jquery[.-]([\d.]+)\.min\.js/i)?.[1];
        techs.push({ name: 'jQuery', category: 'Frontend', version: jqVer, confidence: 'high' });
      }
      if (/bootstrap[.-]([\d.]+)?(\.bundle)?\.min\.(js|css)/i.test(html)) {
        const bVer = html.match(/bootstrap[.-]([\d.]+)/i)?.[1];
        techs.push({ name: 'Bootstrap', category: 'Frontend', version: bVer, confidence: 'high' });
      }
      if (/class="[^"]*(flex|grid|hidden|px-|py-|text-)/i.test(html)) {
        techs.push({ name: 'Tailwind CSS', category: 'Frontend', confidence: 'medium' });
      }

      if (/googletagmanager\.com|gtag\/js/i.test(html)) {
        techs.push({ name: 'Google Tag Manager / GA4', category: 'Analytics', confidence: 'high' });
      }
      if (/hotjar\.com|hjid/i.test(html)) {
        techs.push({ name: 'Hotjar Analytics', category: 'Analytics', confidence: 'high' });
      }
      if (/fbevents\.js|fbq\(/i.test(html)) {
        techs.push({ name: 'Meta Pixel', category: 'Analytics', confidence: 'high' });
      }

      if (/challenges\.cloudflare\.com\/turnstile/i.test(html)) {
        techs.push({ name: 'Cloudflare Turnstile', category: 'Security / Captcha', confidence: 'high' });
      }
      if (/google\.com\/recaptcha/i.test(html)) {
        techs.push({ name: 'Google reCAPTCHA', category: 'Security / Captcha', confidence: 'high' });
      }
      if (/hcaptcha\.com/i.test(html)) {
        techs.push({ name: 'hCaptcha', category: 'Security / Captcha', confidence: 'high' });
      }
    }

    const seen = new Set<string>();
    return techs.filter((t) => {
      if (seen.has(t.name)) return false;
      seen.add(t.name);
      return true;
    });
  }

  /**
   * 3. Passive Email Security & Anti-Spoofing Posture (SPF, DMARC, CAA)
   */
  public async fetchEmailSecurityAndCAA(domain: string): Promise<EmailSecurityPosture> {
    const dnsPromises = dns.promises;
    let spfRecord: string | undefined;
    let dmarcRecord: string | undefined;
    let caaRecords: string[] = [];
    const authorizedCas: string[] = [];
    const relayNetworks: string[] = [];

    // Query SPF (domain TXT)
    try {
      const txts = await dnsPromises.resolveTxt(domain);
      const flatTxt = txts.map((t) => t.join(''));
      spfRecord = flatTxt.find((t) => t.startsWith('v=spf1'));
      if (spfRecord) {
        const parts = spfRecord.split(/\s+/);
        for (const p of parts) {
          if (p.startsWith('include:') || p.startsWith('ip4:') || p.startsWith('ip6:') || p.startsWith('redirect=')) {
            relayNetworks.push(p);
          }
        }
      }
    } catch {}

    // Query DMARC (_dmarc.<domain> TXT)
    try {
      const dmarcTxts = await dnsPromises.resolveTxt(`_dmarc.${domain}`);
      dmarcRecord = dmarcTxts.map((t) => t.join('')).find((t) => t.startsWith('v=DMARC1'));
    } catch {}

    // Query CAA records
    try {
      const caa = await dnsPromises.resolveCaa(domain);
      if (caa && Array.isArray(caa)) {
        for (const c of caa) {
          caaRecords.push(`${c.tag || 'issue'}: ${c.value || (c as any).issue}`);
          if (c.value || (c as any).issue) {
            authorizedCas.push(String(c.value || (c as any).issue));
          }
        }
      }
    } catch {}

    // SPF Posture evaluation
    let spfStatus: 'hardfail' | 'softfail' | 'neutral' | 'missing' | 'vulnerable' = 'missing';
    let spfDesc = 'No SPF record published. Anyone can forge emails from this domain.';
    if (spfRecord) {
      if (spfRecord.includes('-all')) {
        spfStatus = 'hardfail';
        spfDesc = 'Hardfail enforced (-all). Unlisted sending servers are strictly rejected by recipient MTAs.';
      } else if (spfRecord.includes('~all')) {
        spfStatus = 'softfail';
        spfDesc = 'Softfail (~all). Unlisted servers are flagged as suspicious but delivered to Spam.';
      } else if (spfRecord.includes('+all') || spfRecord.includes('?all')) {
        spfStatus = 'vulnerable';
        spfDesc = 'CRITICAL: Insecure record (+all or ?all) permits unauthorized servers to spoof emails!';
      } else {
        spfStatus = 'neutral';
        spfDesc = 'Neutral SPF policy. Does not provide deterministic anti-spoofing defense.';
      }
    }

    // DMARC Posture evaluation
    let dmarcPolicy: 'reject' | 'quarantine' | 'none' | 'missing' = 'missing';
    let dmarcStatus: 'strong' | 'moderate' | 'insecure' | 'missing' = 'missing';
    let dmarcDesc = 'No DMARC record found (_dmarc.<domain>). Domain is unprotected against executive spoofing & phishing.';
    let ruaMailbox: string | undefined;

    if (dmarcRecord) {
      const policyMatch = dmarcRecord.match(/p\s*=\s*([a-zA-Z]+)/i);
      const pol = policyMatch ? policyMatch[1].toLowerCase() : 'none';
      const ruaMatch = dmarcRecord.match(/rua\s*=\s*([^;]+)/i);
      if (ruaMatch) ruaMailbox = ruaMatch[1].trim();

      if (pol === 'reject') {
        dmarcPolicy = 'reject';
        dmarcStatus = 'strong';
        dmarcDesc = 'Strict Reject (p=reject). Spoofed emails are outright blocked by recipient inboxes.';
      } else if (pol === 'quarantine') {
        dmarcPolicy = 'quarantine';
        dmarcStatus = 'moderate';
        dmarcDesc = 'Quarantine (p=quarantine). Spoofed emails are diverted to recipient junk/quarantine folders.';
      } else {
        dmarcPolicy = 'none';
        dmarcStatus = 'insecure';
        dmarcDesc = 'Monitoring Only (p=none). WARNING: Spoofed emails are NOT blocked and will reach inboxes.';
      }
    }

    return {
      spf: {
        record: spfRecord,
        status: spfStatus,
        description: spfDesc,
        relayNetworks: relayNetworks.slice(0, 10),
      },
      dmarc: {
        record: dmarcRecord,
        policy: dmarcPolicy,
        status: dmarcStatus,
        description: dmarcDesc,
        ruaMailbox,
      },
      caa: {
        records: caaRecords,
        authorizedCas: Array.from(new Set(authorizedCas)),
        status: caaRecords.length > 0 ? 'enforced' : 'missing',
      },
    };
  }

  /**
   * 4. Passive Certificate Transparency (CT) Log Mining via crt.sh
   */
  public async fetchCertificateTransparencySubdomains(domain: string, rootDomain?: string): Promise<string[]> {
    const targetDomain = rootDomain || domain;
    try {
      const res = await fetch(`https://crt.sh/?q=%25.${targetDomain}&output=json`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        signal: AbortSignal.timeout(4500),
      });
      if (!res.ok) return [];
      const entries = (await res.json()) as any[];
      const subdomains = new Set<string>();
      for (const entry of entries) {
        const val = entry.name_value || '';
        for (const line of val.split('\n')) {
          const clean = line.replace(/^\*\./, '').toLowerCase().trim();
          if (clean.endsWith('.' + targetDomain) && clean !== targetDomain) {
            subdomains.add(clean);
          }
        }
      }
      return Array.from(subdomains);
    } catch {
      return [];
    }
  }

  /**
   * 5. RFC 9116 security.txt & Vulnerability Disclosure Program (VDP) Discovery
   */
  public async fetchSecurityTxt(origin: string): Promise<SecurityTxtData | undefined> {
    const candidates = [
      `${origin}/.well-known/security.txt`,
      `${origin}/security.txt`,
    ];
    for (const cUrl of candidates) {
      try {
        const probe = await this.probeHttpEndpoint(cUrl, 3000);
        if (probe && probe.status === 200 && probe.body && /contact:/i.test(probe.body)) {
          const lines = probe.body.split(/\r?\n/);
          const contacts: string[] = [];
          let policy: string | undefined;
          let encryption: string | undefined;
          let hiring: string | undefined;
          let acks: string | undefined;
          let canonical: string | undefined;

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('#') || !trimmed) continue;
            const colonIdx = trimmed.indexOf(':');
            if (colonIdx === -1) continue;
            const field = trimmed.slice(0, colonIdx).trim().toLowerCase();
            const val = trimmed.slice(colonIdx + 1).trim();
            if (field === 'contact') contacts.push(val);
            else if (field === 'policy') policy = val;
            else if (field === 'encryption') encryption = val;
            else if (field === 'hiring') hiring = val;
            else if (field === 'acknowledgments') acks = val;
            else if (field === 'canonical') canonical = val;
          }

          return {
            exists: true,
            url: cUrl,
            contact: contacts,
            policy,
            encryption,
            hiring,
            acknowledgments: acks,
            canonical,
            raw: probe.body.slice(0, 1500),
          };
        }
      } catch {}
    }
    return undefined;
  }

  /**
   * 6. RFC 7480 Registration Data Access Protocol (RDAP) lookup
   */
  public async fetchRdapData(target: string, isIp: boolean): Promise<RdapData | undefined> {
    const rdapUrl = isIp ? `https://rdap.org/ip/${target}` : `https://rdap.org/domain/${target}`;
    try {
      const res = await fetch(rdapUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        signal: AbortSignal.timeout(3500),
      });
      if (!res.ok) return undefined;
      const data = (await res.json()) as any;

      let registrar: string | undefined;
      if (data.entities && Array.isArray(data.entities)) {
        for (const ent of data.entities) {
          if (ent.roles && (ent.roles.includes('registrar') || ent.roles.includes('registrant'))) {
            registrar = ent.vcardArray?.[1]?.find((f: any) => f[0] === 'fn')?.[3] || ent.handle;
            if (registrar) break;
          }
        }
      }

      let created: string | undefined;
      let expires: string | undefined;
      let updated: string | undefined;
      if (data.events && Array.isArray(data.events)) {
        for (const ev of data.events) {
          if (ev.eventAction === 'registration') created = ev.eventDate;
          else if (ev.eventAction === 'expiration') expires = ev.eventDate;
          else if (ev.eventAction === 'last changed' || ev.eventAction === 'last update') updated = ev.eventDate;
        }
      }

      return {
        target,
        handle: data.handle,
        name: data.name,
        country: data.country,
        registrar,
        startAddress: data.startAddress,
        endAddress: data.endAddress,
        created,
        expires,
        updated,
        status: Array.isArray(data.status) ? data.status : undefined,
      };
    } catch {
      return undefined;
    }
  }

  public async enrichWithDnsAndGeo(item: ScrapedResult): Promise<void> {
    const domain = item.domain;
    if (!domain) return;

    if (!item.osint) {
      item.osint = {};
    }

    const isIp = this.isIp(domain);
    item.osint.is_ip = isIp;

    // 1. Audit Security Headers & Detect Technologies from response headers
    const sampleHeaders: Record<string, string> = (item as any)._responseHeaders || {};
    if (item.metadata?.server && !sampleHeaders['server']) {
      sampleHeaders['server'] = item.metadata.server;
    }
    item.osint.security_headers = this.auditSecurityHeaders(sampleHeaders);
    item.osint.technologies = this.detectTechnologies(sampleHeaders, item.text || '');

    if (isIp) {
      item.osint.target_ip = domain;

      // Reverse DNS (PTR)
      try {
        const ptrs = await dns.promises.reverse(domain);
        item.osint.reverse_dns = ptrs;
        for (const p of ptrs) {
          if (!item.subdomains.includes(p)) {
            item.subdomains.push(p);
          }
        }
      } catch {
        item.osint.reverse_dns = [];
      }

      // TLS Cert Inspection on port 443
      try {
        const cert = await this.inspectTlsCert(domain, 443);
        if (cert) {
          item.osint.ssl_cert = cert;
          if (cert.cn && !item.subdomains.includes(cert.cn)) {
            item.subdomains.push(cert.cn);
          }
          if (cert.sans) {
            for (const s of cert.sans) {
              if (!item.subdomains.includes(s)) {
                item.subdomains.push(s);
              }
            }
          }
        }
      } catch {}

      // Geolocation and RDAP for IP
      try {
        const [geoRes, rdapData] = await Promise.allSettled([
          fetch(`http://ip-api.com/json/${domain}?fields=status,country,city,isp,org,as,query`, {
            signal: AbortSignal.timeout(3500),
          }),
          this.fetchRdapData(domain, true),
        ]);

        if (geoRes.status === 'fulfilled' && geoRes.value.ok) {
          const geoData = (await geoRes.value.json()) as any;
          if (geoData.status === 'success') {
            item.osint.geo = geoData;
          }
        }
        if (rdapData.status === 'fulfilled' && rdapData.value) {
          item.osint.rdap = rdapData.value;
        }
      } catch {}

      // Robots, Folder digging & security.txt on IP
      const digOrigin = item.url.startsWith('https://') ? item.url : `https://${domain}`;
      const [secTxt, dig] = await Promise.allSettled([
        this.fetchSecurityTxt(digOrigin),
        (!item.osint.robots_txt || !item.osint.sensitive_files)
          ? this.performRobotsAndFolderDigging(digOrigin, new Set(item.emails || []))
          : Promise.resolve(null),
      ]);

      if (secTxt.status === 'fulfilled' && secTxt.value) {
        item.osint.security_txt = secTxt.value;
      }
      if (dig.status === 'fulfilled' && dig.value) {
        item.osint.robots_txt = dig.value.robots;
        item.osint.sensitive_files = dig.value.files;
      }
    } else {
      // It is a Domain Target
      try {
        const dnsPromises = dns.promises;
        const [aRes, mxRes, txtRes, nsRes, emailSec, ctSubs, rdapData] = await Promise.allSettled([
          dnsPromises.resolve4(domain),
          dnsPromises.resolveMx(domain),
          dnsPromises.resolveTxt(domain),
          dnsPromises.resolveNs(domain),
          this.fetchEmailSecurityAndCAA(domain),
          this.fetchCertificateTransparencySubdomains(domain, item.osint.root_domain),
          this.fetchRdapData(domain, false),
        ]);

        const aRecords = aRes.status === 'fulfilled' ? aRes.value : [];
        const mxRecords = mxRes.status === 'fulfilled' ? mxRes.value : [];
        const txtRecords = txtRes.status === 'fulfilled' ? txtRes.value.map((chunks) => chunks.join('')) : [];
        const nsRecords = nsRes.status === 'fulfilled' ? nsRes.value : [];

        item.osint.dns = {
          a: aRecords,
          mx: mxRecords,
          txt: txtRecords,
          ns: nsRecords,
        };

        if (emailSec.status === 'fulfilled' && emailSec.value) {
          item.osint.email_security = emailSec.value;
        }

        if (rdapData.status === 'fulfilled' && rdapData.value) {
          item.osint.rdap = rdapData.value;
        }

        // Add CT subdomains to subdomains list
        const existingSubdomains = new Set(item.subdomains || []);
        if (ctSubs.status === 'fulfilled' && ctSubs.value) {
          item.osint.ct_subdomains_count = ctSubs.value.length;
          for (const s of ctSubs.value) {
            existingSubdomains.add(s);
            if (!item.osint.subdomains_detail) item.osint.subdomains_detail = [];
            if (!item.osint.subdomains_detail.some((d) => d.subdomain === s)) {
              item.osint.subdomains_detail.push({ subdomain: s, source: 'crt.sh' });
            }
          }
        }

        // Geolocation and Reverse DNS on the first A record IP
        if (aRecords.length > 0) {
          const ip = aRecords[0];
          item.osint.target_ip = ip;
          try {
            const [geoRes, revPtr] = await Promise.allSettled([
              fetch(`http://ip-api.com/json/${ip}?fields=status,country,city,isp,org,as,query`, {
                signal: AbortSignal.timeout(3000),
              }),
              dnsPromises.reverse(ip),
            ]);

            if (geoRes.status === 'fulfilled' && geoRes.value.ok) {
              const geoData = (await geoRes.value.json()) as any;
              if (geoData.status === 'success') {
                item.osint.geo = geoData;
              }
            }

            if (revPtr.status === 'fulfilled' && revPtr.value.length > 0) {
              item.osint.reverse_dns = revPtr.value;
            }
          } catch {}
        }

        // TLS Cert Inspection on Domain
        try {
          const cert = await this.inspectTlsCert(domain, 443);
          if (cert) {
            item.osint.ssl_cert = cert;
            if (cert.sans) {
              for (const s of cert.sans) {
                if (s.endsWith('.' + (item.osint.root_domain || domain)) && !existingSubdomains.has(s)) {
                  existingSubdomains.add(s);
                }
              }
            }
          }
        } catch {}

        // MX record subdomains
        for (const mx of mxRecords) {
          if (mx.exchange && mx.exchange.endsWith('.' + domain)) {
            existingSubdomains.add(mx.exchange.toLowerCase());
          }
        }
        item.subdomains = Array.from(existingSubdomains).sort();

        // Perform Robots, Folder Digging & security.txt
        const digOrigin = `https://${domain}`;
        const [secTxt, dig] = await Promise.allSettled([
          this.fetchSecurityTxt(digOrigin),
          (!item.osint.robots_txt || !item.osint.sensitive_files)
            ? this.performRobotsAndFolderDigging(digOrigin, new Set(item.emails || []), item.osint.root_domain)
            : Promise.resolve(null),
        ]);

        if (secTxt.status === 'fulfilled' && secTxt.value) {
          item.osint.security_txt = secTxt.value;
        }
        if (dig.status === 'fulfilled' && dig.value) {
          item.osint.robots_txt = dig.value.robots;
          item.osint.sensitive_files = dig.value.files;
          item.emails = Array.from(new Set([...(item.emails || []), ...Array.from(dig.value.emails)])).sort();
        }
      } catch (e: any) {
        console.warn(`[ScraperService] DNS/Geo enrichment warning: ${e.message}`);
      }
    }
  }

  /**
   * Universal in-memory fallback extractor supporting both Domain and IP targets
   */
  public async fallbackExtract(targetInput: string): Promise<ScrapedResult> {
    const parsedTarget = this.parseTarget(targetInput);
    const domain = parsedTarget.host;
    const isIp = parsedTarget.isIp;
    let url = parsedTarget.normalizedUrl;

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
    let rootDomain = domain;

    if (isIp) {
      // ============================================
      // IP ADDRESS TARGET PIPELINE
      // ============================================
      title = `Host IP: ${domain}`;
      crawledPages.push(url);

      // Probe HTTPS first, then fallback to HTTP
      let probe = await this.probeHttpEndpoint(`https://${domain}/`, 4000);
      if (probe && probe.status !== 0) {
        url = `https://${domain}/`;
      } else {
        probe = await this.probeHttpEndpoint(`http://${domain}/`, 4000);
        if (probe && probe.status !== 0) {
          url = `http://${domain}/`;
        }
      }

      let responseHeaders: Record<string, string> = {};
      if (probe) {
        status = probe.status;
        server = probe.headers['server'] || '';
        contentType = probe.contentType;
        responseHeaders = probe.headers;
        if (probe.title) title = probe.title;
        mainText = probe.body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 6000);
        this.extractEmailsFromHtml(probe.body, emails);
      }

      // Reverse DNS
      let reverseDns: string[] = [];
      try {
        reverseDns = await dns.promises.reverse(domain);
        for (const ptr of reverseDns) {
          subdomains.add(ptr);
          subdomainsDetail.push({ subdomain: ptr, ip: domain, source: 'reverse_dns' });
        }
      } catch {}

      // TLS Cert Inspection
      const sslCert = await this.inspectTlsCert(domain, 443);
      if (sslCert) {
        if (sslCert.cn) {
          subdomains.add(sslCert.cn);
          subdomainsDetail.push({ subdomain: sslCert.cn, ip: domain, source: 'ssl_cn' });
        }
        if (sslCert.sans) {
          for (const san of sslCert.sans) {
            subdomains.add(san);
            subdomainsDetail.push({ subdomain: san, ip: domain, source: 'ssl_san' });
          }
        }
      }

      // Robots & Folder Digging on IP
      const origin = url.startsWith('http') ? new URL(url).origin : `https://${domain}`;
      const dig = await this.performRobotsAndFolderDigging(origin, emails);
      crawledPages.push(...dig.crawledPages);

      return {
        url,
        domain,
        metadata: {
          title,
          description: `IP Host Scan for ${domain}`,
          author: '',
          status,
          og: {},
          server,
          content_type: contentType,
        },
        emails: Array.from(emails).sort(),
        subdomains: Array.from(subdomains).sort(),
        links: {
          internal: [],
          external: [],
          total_internal: 0,
          total_external: 0,
        },
        text: mainText,
        scraped_at: new Date().toISOString(),
        osint: {
          is_ip: true,
          target_ip: domain,
          reverse_dns: reverseDns,
          ssl_cert: sslCert || undefined,
          robots_txt: dig.robots,
          sensitive_files: dig.files,
          subdomains_detail: subdomainsDetail,
          crawled_pages: crawledPages,
        },
      };
    } else {
      // ============================================
      // DOMAIN TARGET PIPELINE
      // ============================================
      const parts = domain.split('.');
      rootDomain =
        parts.length > 2 &&
        (parts[parts.length - 2] === 'edu' ||
          parts[parts.length - 2] === 'com' ||
          parts[parts.length - 2] === 'gov' ||
          parts[parts.length - 2] === 'co')
          ? parts.slice(-3).join('.')
          : parts.length > 2
          ? parts.slice(-2).join('.')
          : domain;

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
              const [sub, ip] = line.split(',').map((s) => s.trim().toLowerCase());
              if (sub && (sub.endsWith('.' + rootDomain) || sub === rootDomain)) {
                subdomains.add(sub);
                subdomainsDetail.push({ subdomain: sub, ip, source: 'hackertarget' });
              }
            }
          }
        }
      } catch {}

      // 2. Fetch Root Page
      const origin = `https://${domain}`;
      try {
        crawledPages.push(url);
        const probe = await this.probeHttpEndpoint(url, 10000);
        if (probe) {
          status = probe.status;
          server = probe.headers['server'] || '';
          contentType = probe.contentType;
          if (probe.title) title = probe.title;

          const descMatch =
            probe.body.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i) ||
            probe.body.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i);
          if (descMatch) description = descMatch[1].trim();

          this.extractEmailsFromHtml(probe.body, emails);

          // Links Extraction
          const hrefMatches = probe.body.matchAll(/href=["']([^"']+)["']/gi);
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

          mainText = probe.body
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
            .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 8000);

          // Contact pages crawl
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

          for (const candUrl of Array.from(new Set(candidatePaths)).slice(0, 6)) {
            if (crawledPages.includes(candUrl)) continue;
            try {
              crawledPages.push(candUrl);
              const cProbe = await this.probeHttpEndpoint(candUrl, 4000);
              if (cProbe && cProbe.status === 200) {
                this.extractEmailsFromHtml(cProbe.body, emails);
              }
            } catch {}
          }
        }
      } catch (e: any) {
        mainText = `Connection warning: ${e.message}`;
      }

      // 3. Robots.txt & Folder Digging
      const dig = await this.performRobotsAndFolderDigging(origin, emails, rootDomain);
      crawledPages.push(...dig.crawledPages);

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
          is_ip: false,
          robots_txt: dig.robots,
          sensitive_files: dig.files,
          subdomains_detail: subdomainsDetail,
          crawled_pages: crawledPages,
          security_headers: this.auditSecurityHeaders(responseHeaders),
          technologies: this.detectTechnologies(responseHeaders, mainText),
        },
      };
    }
  }

  private extractEmailsFromHtml(html: string, emailSet: Set<string>): void {
    if (!html) return;

    // 1. Plain text regex
    const emailMatches = html.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
    for (const em of emailMatches) {
      const clean = em.toLowerCase().trim();
      if (
        !clean.match(/\.(png|jpg|jpeg|gif|svg|webp|css|js|ico|woff|woff2|ttf|json|mp4|webm)$/i) &&
        !clean.includes('@2x') &&
        !clean.includes('@3x')
      ) {
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
        const clean = decoded.toLowerCase().trim();
        if (!clean.match(/\.(png|jpg|jpeg|gif|svg|webp|css|js)$/i)) {
          emailSet.add(clean);
        }
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
    const isIp = osint?.is_ip || this.isIp(scrapedItem.domain);
    const targetIp = osint?.target_ip || dnsInfo?.a?.[0] || 'Unknown';
    const sslCert = osint?.ssl_cert;
    const robotsTxt = osint?.robots_txt;
    const sensitiveFiles = osint?.sensitive_files || [];

    const secHeaders = osint?.security_headers;
    const emailSec = osint?.email_security;
    const techStack = osint?.technologies || [];
    const secTxt = osint?.security_txt;
    const rdap = osint?.rdap;

    const prompt = `You are RedTeam & DevSecOps Lead for Zak_OS.
Perform an exhaustive, professional cybersecurity attack surface, penetration testing reconnaissance, and threat assessment on this target data extracted via Scrapy and the lawful OSINT intelligence engine.

TARGET CLASSIFICATION: ${isIp ? 'Raw IP Host' : 'Registered Domain'}
TARGET URL: ${scrapedItem.url}
PRIMARY HOST/DOMAIN: ${scrapedItem.domain}
ROOT DOMAIN: ${osint?.root_domain || scrapedItem.domain}
TARGET IP: ${targetIp}
SERVER HEADERS: ${scrapedItem.metadata.server || 'None declared'}
HTTP STATUS: ${scrapedItem.metadata.status}
REVERSE DNS (PTR): ${osint?.reverse_dns?.join(', ') || 'N/A'}
IP & GEOLOCATION: ${geoInfo ? `${geoInfo.query} | ${geoInfo.city}, ${geoInfo.country} | ISP: ${geoInfo.isp} | AS: ${geoInfo.as}` : targetIp}
DNS A RECORDS: ${dnsInfo?.a?.join(', ') || 'N/A'}
DNS MX MAIL SERVERS: ${dnsInfo?.mx?.map((m) => `${m.exchange} (pri: ${m.priority})`).join(', ') || 'N/A'}
DNS TXT / SPF / DMARC: ${dnsInfo?.txt?.join(' | ') || 'N/A'}
NAMESERVERS (NS): ${dnsInfo?.ns?.join(', ') || 'N/A'}

--- DEFENSIVE POSTURE & AUDIT ---
OWASP SECURITY HEADERS GRADE: ${secHeaders ? `${secHeaders.grade} (${secHeaders.score}/100 - ${secHeaders.passCount} passed, ${secHeaders.failCount} failed)` : 'N/A'}
FAILED DEFENSIVE HEADERS: ${secHeaders?.findings?.filter(f => f.status === 'fail').map(f => `${f.header} (${f.description})`).join('; ') || 'None'}
FINGERPRINTED TECH STACK (${techStack.length}): ${techStack.map(t => `${t.name} [${t.category}${t.version ? ' ' + t.version : ''}]`).join(', ') || 'None'}
EMAIL SPOOFING (SPF): ${emailSec?.spf?.status ? `${emailSec.spf.status.toUpperCase()} - ${emailSec.spf.description}` : 'N/A'}
EMAIL ANTI-PHISHING (DMARC): ${emailSec?.dmarc?.status ? `${emailSec.dmarc.status.toUpperCase()} (policy: ${emailSec.dmarc.policy || 'none'}) - ${emailSec.dmarc.description}` : 'N/A'}
CERTIFICATE AUTHORITY AUTH (CAA): ${emailSec?.caa?.status === 'enforced' ? `Enforced (${emailSec.caa.authorizedCas.join(', ')})` : 'Missing (Any CA can issue certs)'}
RFC 9116 SECURITY.TXT: ${secTxt?.exists ? `Active (${secTxt.url}) | Contacts: ${secTxt.contact?.join(', ') || 'None'} | Policy: ${secTxt.policy || 'None'}` : 'Not Published'}
REGISTRATION & RDAP ALLOCATION: ${rdap ? `Name: ${rdap.name || 'N/A'} | Handle: ${rdap.handle || 'N/A'} | Range: ${rdap.startAddress ? `${rdap.startAddress} - ${rdap.endAddress}` : 'N/A'} | Registrar: ${rdap.registrar || 'N/A'}` : 'N/A'}
CERTIFICATE TRANSPARENCY (crt.sh) SUBDOMAINS: ${osint?.ct_subdomains_count || 0} discovered passively

--- CERTIFICATE & DIRECTORY DIGGING ---
SSL/TLS CERTIFICATE: CN: ${sslCert?.cn || 'N/A'} | Issuer: ${sslCert?.issuer || 'N/A'} | SANs: ${sslCert?.sans?.join(', ') || 'None'}
ROBOTS.TXT DISALLOWED PATHS (${robotsTxt?.disallow?.length || 0}): ${robotsTxt?.disallow?.join(', ') || 'None'}
DISCOVERED SITEMAPS (${robotsTxt?.sitemaps?.length || 0}): ${robotsTxt?.sitemaps?.join(', ') || 'None'}
ACCESSIBLE / SENSITIVE FILES (${sensitiveFiles.length}): ${sensitiveFiles.map((f) => `${f.path} (status: ${f.status}, source: ${f.source}, notes: ${f.notes || ''})`).join('; ') || 'None'}
DISCOVERED PERSONNEL EMAILS (${scrapedItem.emails.length}): ${scrapedItem.emails.join(', ') || 'None'}
DISCOVERED SUBDOMAINS & HOSTNAMES (${scrapedItem.subdomains.length}): ${scrapedItem.subdomains.join(', ') || 'None'}
CRAWLED RECON ENDPOINTS (${osint?.crawled_pages?.length || 1}): ${osint?.crawled_pages?.slice(0, 15).join(', ') || scrapedItem.url}
PAGE TITLE: ${scrapedItem.metadata.title}
CONTENT EXCERPT: ${scrapedItem.text.slice(0, 2500)}

Please return your evaluation in structured Markdown covering:
1. **Executive Security Summary**: Overall risk posture, target type (${isIp ? 'Raw IP Address' : 'Domain'}), technology stack, and defense-in-depth posture.
2. **Threat Level**: [CRITICAL | HIGH | MEDIUM | LOW | INFORMATIONAL]
3. **Attack Surface & OSINT Findings**:
   - **Infrastructure & IP Recon**: Direct IP exposure vs WAF/Cloudflare bypass, reverse DNS hostname revelations, SSL certificate SAN mappings (domains sharing this IP).
   - **Folder Digging & Restricted Paths**: Analysis of /robots.txt Disallow directives and accessible files/folders (${sensitiveFiles.map((f) => f.path).join(', ') || 'None'}).
   - **Personnel & Email Exposure**: Social engineering vectors based on harvested personnel emails (${scrapedItem.emails.join(', ') || 'None'}).
   - **Subdomain Exposure & Lateral Movement**: Attack paths against exposed hostnames and portals.
4. **Vulnerability Hypotheses**: Potential attack vectors to audit (e.g. server banner vulnerabilities, open directories, administrative portal exposure, email spoofing).
5. **Tactical Remediation & Hardening**: Concrete security controls.`;

    try {
      const res = await fetch(`${EXPLABS_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(30000),
        body: JSON.stringify({
          model: 'gpt-6-astra',
          messages: [
            {
              role: 'system',
              content: 'You are an elite cybersecurity threat analyst in Zak_OS. Deliver rigorous, technically precise threat assessments.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
        }),
      });

      if (!res.ok) {
        throw new Error(`GPT-6 Astra responded with status ${res.status}`);
      }

      const data = (await res.json()) as any;
      const content = data.choices?.[0]?.message?.content || 'No analysis returned.';

      // Determine Threat Level
      let threatLevel: ThreatAnalysis['threatLevel'] = 'MEDIUM';
      if (content.includes('CRITICAL')) threatLevel = 'CRITICAL';
      else if (content.includes('HIGH')) threatLevel = 'HIGH';
      else if (content.includes('LOW')) threatLevel = 'LOW';
      else if (content.includes('INFORMATIONAL')) threatLevel = 'INFORMATIONAL';

      const vulns: string[] = [];
      if (isIp) {
        vulns.push(`Direct IP host targeted (${domain}) - bypasses CDN protections if origin is exposed`);
      }
      if (scrapedItem.metadata.server) {
        vulns.push(`Server banner fingerprint: ${scrapedItem.metadata.server}`);
      }
      if (robotsTxt?.disallow && robotsTxt.disallow.length > 0) {
        vulns.push(`${robotsTxt.disallow.length} restricted directories revealed via robots.txt`);
      }
      if (sensitiveFiles.some((f) => f.status === 200 && f.path !== '/robots.txt')) {
        vulns.push(`Sensitive endpoints accessible with HTTP 200 OK`);
      }
      if (scrapedItem.emails.length > 0) {
        vulns.push(`${scrapedItem.emails.length} personnel emails exposed for phishing OSINT`);
      }
      if (scrapedItem.subdomains.length > 0) {
        vulns.push(`${scrapedItem.subdomains.length} hostnames/subdomains mapped in attack surface`);
      }

      return {
        summary: `Target ${scrapedItem.domain} (${isIp ? 'IP Host' : 'Domain'}) analyzed by GPT-6 Astra. Posture: ${threatLevel}.`,
        threatLevel,
        attackSurface: scrapedItem.subdomains.length > 0 ? scrapedItem.subdomains : [scrapedItem.domain],
        vulnerabilities: vulns.length > 0 ? vulns : ['Standard attack surface footprint'],
        recommendations: [
          'Audit robots.txt disallow entries to prevent sensitive path enumeration.',
          'Verify SSL/TLS SAN certificates do not leak internal staging or administrative hostnames.',
          'Restrict direct IP access on origin web servers to only authorized reverse proxy IPs.',
          'Enforce SPF, DKIM, and strict DMARC rejection to mitigate email spoofing.',
        ],
        rawAnalysis: content,
      };
    } catch (err: any) {
      console.error('[ScraperService] GPT-6 Astra analysis error:', err.message);
      return {
        summary: `Automated assessment for ${scrapedItem.domain}`,
        threatLevel: 'INFORMATIONAL',
        attackSurface: [scrapedItem.domain],
        vulnerabilities: ['Automated heuristic fallback (API unreachable)'],
        recommendations: ['Check Experiential Labs API key status in Settings.'],
        rawAnalysis: `### 🛡️ Heuristic Recon Summary\n\n- **Target:** ${scrapedItem.url}\n- **Classification:** ${isIp ? 'Raw IP Host' : 'Domain'}\n- **Harvested Emails:** ${scrapedItem.emails.length}\n- **Mapped Subdomains/Hostnames:** ${scrapedItem.subdomains.length}\n- **Robots Disallow Rules:** ${robotsTxt?.disallow?.length || 0}\n\n*Note: GPT-6 Astra inference encountered: ${err.message}*`,
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
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(30000),
        body: JSON.stringify({
          model: 'gpt-6-astra',
          messages: [
            {
              role: 'system',
              content: 'You are the Lead Threat Intelligence Analyst of Zak_OS.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
        }),
      });

      if (!res.ok) {
        throw new Error(`GPT-6 Astra error: ${res.status}`);
      }

      const data = (await res.json()) as any;
      return data.choices?.[0]?.message?.content || 'No threat briefing generated.';
    } catch (e: any) {
      return `### Threat Analysis (Offline Fallback)\n\n**Item:** ${item.title}\n\n*Error connecting to GPT-6 Astra: ${e.message}*`;
    }
  }
}

export const scraperService = new ScraperService();
