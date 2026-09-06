from datetime import datetime, timezone
import scrapy
from ZakOS.items import AiResearchItem

class AiNewsSpider(scrapy.Spider):
    name = "ai_news"
    start_urls = [
        "https://arxiv.org/list/cs.AI/recent",
        "https://arxiv.org/list/cs.CR/recent",
    ]

    custom_settings = {
        'ROBOTSTXT_OBEY': False,
        'DOWNLOAD_DELAY': 1.0,
    }

    def parse(self, response):
        now_iso = datetime.now(timezone.utc).isoformat()
        dl = response.css('dl#articles')
        dt_list = dl.css('dt')
        dd_list = dl.css('dd')

        for dt, dd in zip(dt_list[:12], dd_list[:12]):
            link = dt.css('a[title="Abstract"]::attr(href)').get()
            title = dd.css('.list-title::text').getall()
            authors = dd.css('.list-authors a::text').getall()
            abstract = dd.css('p.mathjax::text').get() or ''

            clean_title = ' '.join([t.strip() for t in title if t.strip()]).replace('Title:', '').strip()
            full_url = response.urljoin(link) if link else response.url

            if clean_title:
                yield AiResearchItem(
                    title=clean_title,
                    authors=', '.join(authors[:4]),
                    url=full_url,
                    abstract=abstract.strip(),
                    source="arXiv AI/Cybersecurity",
                    published_date=datetime.now(timezone.utc).strftime("%Y-%m-%d"),
                    scraped_at=now_iso
                )
