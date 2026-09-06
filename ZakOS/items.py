import scrapy

class ZakosWebItem(scrapy.Item):
    url = scrapy.Field()
    domain = scrapy.Field()
    metadata = scrapy.Field()
    emails = scrapy.Field()
    subdomains = scrapy.Field()
    links = scrapy.Field()
    text = scrapy.Field()
    scraped_at = scrapy.Field()
    osint = scrapy.Field()

class CybersecNewsItem(scrapy.Item):
    cve_id = scrapy.Field()
    title = scrapy.Field()
    source = scrapy.Field()
    url = scrapy.Field()
    description = scrapy.Field()
    published_date = scrapy.Field()
    severity = scrapy.Field()
    category = scrapy.Field()
    scraped_at = scrapy.Field()

class AiResearchItem(scrapy.Item):
    title = scrapy.Field()
    authors = scrapy.Field()
    url = scrapy.Field()
    abstract = scrapy.Field()
    source = scrapy.Field()
    published_date = scrapy.Field()
    scraped_at = scrapy.Field()
