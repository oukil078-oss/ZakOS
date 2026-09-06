import re
import ssl
import urllib.request
from urllib.parse import urlparse
from datetime import datetime, timezone
import tldextract
import scrapy
from ZakOS.items import ZakosWebItem

def decode_cloudflare_email(cf_hex):
    try:
        k = int(cf_hex[:2], 16)
        email = ''.join([chr(int(cf_hex[i:i+2], 16) ^ k) for i in range(2, len(cf_hex), 2)])
        return email
    except Exception:
        return None

class ZakosSpider(scrapy.Spider):
    name = "zakos"
    allowed_domains = []
    
    EMAIL_REGEX = re.compile(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', re.IGNORECASE)

    custom_settings = {
        'ROBOTSTXT_OBEY': False,
        'DOWNLOAD_TIMEOUT': 15,
        'USER_AGENT': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 ZakOS-OSINT/2.0',
    }

    def __init__(self, url=None, *args, **kwargs):
        super(ZakosSpider, self).__init__(*args, **kwargs)
        if not url:
            url = "https://example.com"
        if not url.startswith(('http://', 'https://')):
            url = 'https://' + url
            
        self.initial_url = url
        parsed = urlparse(url)
        self.base_domain = parsed.netloc.lower()
        
        # Accurate registered root domain extraction using tldextract (e.g. his.edu.dz)
        ext = tldextract.extract(url)
        self.root_domain = ext.top_domain_under_public_suffix or ext.registered_domain or self.base_domain
        self.start_urls = [url]

    def _extract_emails_from_html(self, html_text, response=None):
        found = set()
        if not html_text:
            return found

        # 1. Regex on HTML/text
        for match in self.EMAIL_REGEX.findall(html_text):
            m = match.lower().strip()
            if not m.endswith(('.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.css', '.js', '.ico', '.woff', '.ttf', '.json')):
                found.add(m)

        # 2. Cloudflare email obfuscation decoding
        cf_matches = re.findall(r'data-cfemail=["\']([a-fA-F0-9]+)["\']', html_text)
        cf_matches += re.findall(r'/cdn-cgi/l/email-protection#([a-fA-F0-9]+)', html_text)
        for cf in cf_matches:
            decoded = decode_cloudflare_email(cf)
            if decoded and self.EMAIL_REGEX.match(decoded):
                found.add(decoded.lower().strip())

        # 3. mailto: links
        if response:
            for mailto in response.css('a[href^="mailto:"]::attr(href)').getall():
                clean = mailto.replace('mailto:', '').split('?')[0].strip().lower()
                if self.EMAIL_REGEX.match(clean) and not clean.endswith(('.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp')):
                    found.add(clean)

        return found

    def parse(self, response):
        page_url = response.url
        parsed_page = urlparse(page_url)
        current_domain = parsed_page.netloc.lower()

        # 1. Emails extraction from homepage
        all_emails = self._extract_emails_from_html(response.text, response)

        # 2. Links and Subdomains extraction from HTML
        internal_links = set()
        external_links = set()
        subdomains = set()
        subdomains_detail = []
        crawled_pages = [page_url]

        raw_links = response.css('a::attr(href)').getall()
        contact_candidates = set()

        for href in raw_links:
            if not href or href.startswith(('javascript:', '#', 'tel:', 'mailto:')):
                continue
            abs_url = response.urljoin(href.strip())
            parsed_href = urlparse(abs_url)
            link_host = parsed_href.netloc.lower()

            if not link_host:
                continue

            if link_host == current_domain or link_host == self.base_domain:
                internal_links.add(abs_url)
            elif link_host.endswith('.' + self.root_domain) or link_host == self.root_domain:
                internal_links.add(abs_url)
                if link_host != self.root_domain:
                    subdomains.add(link_host)
            else:
                external_links.add(abs_url)

            # Detect contact / about pages
            path_lower = parsed_href.path.lower()
            if any(k in path_lower for k in ['contact', 'about', 'propos', 'talent', 'team', 'staff', 'admission', 'info', 'utiles']):
                if link_host == current_domain or link_host.endswith('.' + self.root_domain):
                    contact_candidates.add(abs_url)

        # 3. Passive OSINT: HackerTarget HostSearch Subdomain Recon
        try:
            req = urllib.request.Request(
                f"https://api.hackertarget.com/hostsearch/?q={self.root_domain}",
                headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ZakOS-OSINT'}
            )
            ht_res = urllib.request.urlopen(req, timeout=7).read().decode('utf-8', 'ignore')
            for line in ht_res.strip().split('\n'):
                if ',' in line:
                    parts = line.split(',', 1)
                    sub = parts[0].strip().lower()
                    ip = parts[1].strip() if len(parts) > 1 else ''
                    if sub.endswith('.' + self.root_domain) or sub == self.root_domain:
                        subdomains.add(sub)
                        subdomains_detail.append({
                            "subdomain": sub,
                            "ip": ip,
                            "source": "hackertarget"
                        })
        except Exception as e:
            self.logger.warning(f"HackerTarget OSINT query error: {e}")

        # 4. Deep Crawl for Contact & Talent Pages
        # Probe common contact endpoints and discovered talent/contact subdomains
        candidate_list = list(contact_candidates)[:6]
        base_origin = f"{parsed_page.scheme}://{parsed_page.netloc}"
        
        # Add standard fallback paths
        for path in ['/contact-us/', '/contact/', '/contacts-utiles/', '/a-propos/']:
            candidate_list.append(f"{base_origin}{path}")
            
        # Add talent / portal subdomains discovered via OSINT
        for s in subdomains:
            if any(k in s for k in ['talent', 'contact', 'admission', 'career']):
                candidate_list.append(f"https://{s}/en")
                candidate_list.append(f"https://{s}/")

        ssl_ctx = ssl.create_default_context()
        ssl_ctx.check_hostname = False
        ssl_ctx.verify_mode = ssl.CERT_NONE

        for target_cand in set(candidate_list):
            if target_cand in crawled_pages:
                continue
            try:
                c_req = urllib.request.Request(target_cand, headers={
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ZakOS-OSINT'
                })
                c_html = urllib.request.urlopen(c_req, context=ssl_ctx, timeout=4).read().decode('utf-8', 'ignore')
                crawled_pages.append(target_cand)
                sub_emails = self._extract_emails_from_html(c_html)
                if sub_emails:
                    all_emails.update(sub_emails)
            except Exception:
                pass

        # 5. Metadata extraction
        title = response.css('title::text').get() or ''
        meta_desc = response.xpath('//meta[@name="description"]/@content').get() or \
                    response.xpath('//meta[@property="og:description"]/@content').get() or ''
        meta_author = response.xpath('//meta[@name="author"]/@content').get() or ''
        
        og_tags = {}
        for og in response.xpath('//meta[starts-with(@property, "og:")]'):
            prop = og.xpath('@property').get()
            content = og.xpath('@content').get()
            if prop and content:
                og_tags[prop.replace('og:', '')] = content

        headers = {k.decode('utf-8', 'ignore'): [v.decode('utf-8', 'ignore') for v in val] 
                   for k, val in response.headers.items()}

        metadata = {
            "title": title.strip(),
            "description": meta_desc.strip(),
            "author": meta_author.strip(),
            "status": response.status,
            "og": og_tags,
            "server": headers.get('Server', [''])[0],
            "content_type": headers.get('Content-Type', [''])[0],
        }

        # 6. Text content extraction
        paragraphs = response.xpath('//p//text() | //h1//text() | //h2//text() | //h3//text() | //li//text()').getall()
        cleaned_text = ' '.join([p.strip() for p in paragraphs if p.strip()])
        cleaned_text = re.sub(r'\s+', ' ', cleaned_text)[:12000]

        item = ZakosWebItem(
            url=page_url,
            domain=current_domain,
            metadata=metadata,
            emails=sorted(list(all_emails)),
            subdomains=sorted(list(subdomains)),
            links={
                "internal": sorted(list(internal_links))[:100],
                "external": sorted(list(external_links))[:100],
                "total_internal": len(internal_links),
                "total_external": len(external_links)
            },
            text=cleaned_text,
            scraped_at=datetime.now(timezone.utc).isoformat(),
            osint={
                "subdomains_detail": subdomains_detail,
                "crawled_pages": crawled_pages,
                "root_domain": self.root_domain
            }
        )

        yield dict(item)
