BOT_NAME = "ZakOS"

SPIDER_MODULES = ["ZakOS.spiders"]
NEWSPIDER_MODULE = "ZakOS.spiders"

# Obey robots.txt rules
ROBOTSTXT_OBEY = True

# Performance and politeness
CONCURRENT_REQUESTS = 16
DOWNLOAD_DELAY = 0.5
COOKIES_ENABLED = False

# User agent
USER_AGENT = "ZakOS-Spider/1.0 (+https://github.com/oukil078-oss/ZakOS)"

# Feed and reactor configuration
REQUEST_FINGERPRINTER_IMPLEMENTATION = "2.7"
TWISTED_REACTOR = "twisted.internet.asyncioreactor.AsyncioSelectorReactor"
FEED_EXPORT_ENCODING = "utf-8"
