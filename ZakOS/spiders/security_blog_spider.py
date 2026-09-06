from datetime import datetime, timezone
import scrapy
from ZakOS.items import CybersecNewsItem

class SecurityBlogSpider(scrapy.Spider):
    name = "security_blogs"
    start_urls = [
        "https://thehackernews.com/",
    ]

    custom_settings = {
        'ROBOTSTXT_OBEY': False,
        'DOWNLOAD_DELAY': 1.0,
    }

    def parse(self, response):
        now_iso = datetime.now(timezone.utc).isoformat()
        articles = response.css('.body-post')

        if not articles:
            articles = response.css('article') or response.css('.story-link')

        for article in articles[:15]:
            title = article.css('.home-title::text, h2::text, .story-title::text').get()
            url = article.css('a.story-link::attr(href), a::attr(href)').get()
            desc = article.css('.home-desc::text, p::text').get()
            date_str = article.css('.h-datetime::text, time::text').get() or datetime.now(timezone.utc).strftime("%Y-%m-%d")
            
            if title and url:
                yield CybersecNewsItem(
                    cve_id="N/A",
                    title=title.strip(),
                    source="The Hacker News",
                    url=response.urljoin(url.strip()),
                    description=(desc or '').strip(),
                    published_date=date_str.strip(),
                    severity="INFO",
                    category="Threat Intel",
                    scraped_at=now_iso
                )
