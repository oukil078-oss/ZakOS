import re
from datetime import datetime, timezone
import scrapy
from ZakOS.items import CybersecNewsItem

class CveFeedSpider(scrapy.Spider):
    name = "cve_feed"
    start_urls = [
        "https://www.cisa.gov/known-exploited-vulnerabilities-catalog",
        "https://cve.mitre.org/data/refs/refmap/source-EXPLOIT-DB.html"
    ]

    custom_settings = {
        'ROBOTSTXT_OBEY': False,
        'DOWNLOAD_DELAY': 1.0,
    }

    def parse(self, response):
        now_iso = datetime.now(timezone.utc).isoformat()
        
        # Example parsing CISA KEV or general security vulnerability listings
        rows = response.css('table tr')
        if rows:
            for row in rows[1:25]:
                cells = row.css('td::text').getall()
                if len(cells) >= 3:
                    cve_id = cells[0].strip()
                    title = cells[1].strip() if len(cells) > 1 else "Security Advisory"
                    desc = cells[2].strip() if len(cells) > 2 else ""
                    yield CybersecNewsItem(
                        cve_id=cve_id,
                        title=f"{cve_id}: {title}",
                        source="CISA KEV / MITRE",
                        url=response.url,
                        description=desc,
                        published_date=datetime.now(timezone.utc).strftime("%Y-%m-%d"),
                        severity="HIGH",
                        category="Vulnerability",
                        scraped_at=now_iso
                    )
        else:
            # Fallback text regex scan for CVE entries
            cves = re.findall(r'CVE-\d{4}-\d{4,7}', response.text)
            for cve in list(set(cves))[:15]:
                yield CybersecNewsItem(
                    cve_id=cve,
                    title=f"Vulnerability Alert: {cve}",
                    source="Security Feed",
                    url=response.url,
                    description=f"Automated threat feed detection for {cve}",
                    published_date=datetime.now(timezone.utc).strftime("%Y-%m-%d"),
                    severity="CRITICAL" if "2026" in cve or "2025" in cve else "HIGH",
                    category="CVE Alert",
                    scraped_at=now_iso
                )
