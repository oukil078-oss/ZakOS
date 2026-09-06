import re
from urllib.parse import urlparse
from datetime import datetime, timezone
import scrapy
from ZakOS.items import ZakosWebItem

class ZakosSpider(scrapy.Spider):
    name = "zakos"
    allowed_domains = []
    
    EMAIL_REGEX = re.compile(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', re.IGNORECASE)

    def __init__(self, url=None, *args, **kwargs):
        super(ZakosSpider, self).__init__(*args, **kwargs)
        if url:
            if not url.startswith(('http://', 'https://')):
                url = 'https://' + url
            self.start_urls = [url]
            parsed = urlparse(url)
            self.base_domain = parsed.netloc.lower()
            # Extract root domain (e.g., example.com from sub.example.com)
            parts = self.base_domain.split('.')
            if len(parts) > 2:
                self.root_domain = '.'.join(parts[-2:])
            else:
                self.root_domain = self.base_domain
        else:
            self.start_urls = ["https://example.com"]
            self.base_domain = "example.com"
            self.root_domain = "example.com"

    def parse(self, response):
        page_url = response.url
        parsed_page = urlparse(page_url)
        current_domain = parsed_page.netloc.lower()

        # 1. Emails extraction (from mailto and full HTML text)
        emails = set()
        for mailto in response.css('a[href^="mailto:"]::attr(href)').getall():
            clean_email = mailto.replace('mailto:', '').split('?')[0].strip()
            if self.EMAIL_REGEX.match(clean_email):
                emails.add(clean_email.lower())

        body_text = response.text
        for match in self.EMAIL_REGEX.findall(body_text):
            # Exclude common image extensions or false positives
            if not match.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp')):
                emails.add(match.lower())

        # 2. Links and Subdomains extraction
        internal_links = set()
        external_links = set()
        subdomains = set()

        raw_links = response.css('a::attr(href)').getall()
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

        # 3. Metadata extraction
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

        # 4. Text content extraction (paragraphs, headings, lists)
        paragraphs = response.xpath('//p//text() | //h1//text() | //h2//text() | //h3//text() | //li//text()').getall()
        cleaned_text = ' '.join([p.strip() for p in paragraphs if p.strip()])
        # Normalize whitespace
        cleaned_text = re.sub(r'\s+', ' ', cleaned_text)[:12000]

        item = ZakosWebItem(
            url=page_url,
            domain=current_domain,
            metadata=metadata,
            emails=sorted(list(emails)),
            subdomains=sorted(list(subdomains)),
            links={
                "internal": sorted(list(internal_links))[:100],
                "external": sorted(list(external_links))[:100],
                "total_internal": len(internal_links),
                "total_external": len(external_links)
            },
            text=cleaned_text,
            scraped_at=datetime.now(timezone.utc).isoformat()
        )

        yield dict(item)
