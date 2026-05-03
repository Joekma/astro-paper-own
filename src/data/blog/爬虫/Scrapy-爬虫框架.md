---
title: Scrapy 爬虫框架
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-04-22T00:00:00.000+08:00
slug: scrapy-framework-tutorial
featured: false
draft: false
tags:
  - Python
  - 爬虫
  - Scrapy
  - Web爬虫
  - 框架
  - 数据采集
description: 'Python Scrapy 爬虫框架，详细讲解Spider编写、CSS/XPath选择器、Item Pipeline数据处理、Settings配置等核心功能，包含实战示例代码。'
---

> Scrapy 是一个基于 Python 的高级爬虫框架，提供了完整的爬虫解决方案，包括请求调度、数据提取、数据存储等功能。

## 安装

```bash
pip install scrapy
```

> Windows 用户可能需要安装 Microsoft Visual C++ Build Tools。

## Scrapy 架构

### 核心组件

| 组件 | 说明 |
|------|------|
| **Engine** | 核心，控制数据流和组件通信 |
| **Scheduler** | 调度器，管理待爬取请求队列 |
| **Downloader** | 下载器，负责下载页面 |
| **Spider** | 爬虫，定义如何爬取网站 |
| **Item Pipeline** | 管道，处理爬取到的数据 |
| **Middleware** | 中间件，处理请求和响应 |

## 创建项目

```bash
scrapy startproject tutorial
```

### 项目结构

```
tutorial/
├── scrapy.cfg              # 项目配置
└── tutorial/
    ├── __init__.py
    ├── items.py            # 定义数据结构
    ├── middlewares.py      # 中间件
    ├── pipelines.py        # 管道
    ├── settings.py         # 设置
    └── spiders/            # 爬虫目录
```

## Spider 编写

### 基本 Spider

```python
import scrapy

class QuotesSpider(scrapy.Spider):
    name = "quotes"
    allowed_domains = ["quotes.toscrape.com"]
    start_urls = ['https://quotes.toscrape.com/page/1/']

    def parse(self, response):
        # 保存页面
        page = response.url.split("/")[-2]
        with open(f'quotes-{page}.html', 'wb') as f:
            f.write(response.body)
```

### CSS 选择器提取数据

```python
class QuotesSpider(scrapy.Spider):
    name = "quotes"
    start_urls = ['https://quotes.toscrape.com/page/1/']

    def parse(self, response):
        for quote in response.css('div.quote'):
            yield {
                'text': quote.css('span.text::text').get(),
                'author': quote.css('span small::text').get(),
                'tags': quote.css('div.tags a.tag::text').getall(),
            }

        # 跟进下一页
        next_page = response.css('li.next a::attr("href")').get()
        if next_page:
            yield response.follow(next_page, callback=self.parse)
```

### XPath 选择器

```python
class QuotesSpider(scrapy.Spider):
    name = "quotes"
    start_urls = ['https://quotes.toscrape.com/page/1/']

    def parse(self, response):
        for quote in response.xpath('//div[@class="quote"]'):
            yield {
                'text': quote.xpath('span[@class="text"]/text()').get(),
                'author': quote.xpath('span/small/text()').get(),
            }
```

## Item 使用

### 定义 Item

```python
import scrapy

class QuoteItem(scrapy.Item):
    text = scrapy.Field()
    author = scrapy.Field()
    tags = scrapy.Field()
```

### 使用 Item

```python
from tutorial.items import QuoteItem

class QuotesSpider(scrapy.Spider):
    name = "quotes"
    start_urls = ['https://quotes.toscrape.com/page/1/']

    def parse(self, response):
        for quote in response.css('div.quote'):
            item = QuoteItem()
            item['text'] = quote.css('span.text::text').get()
            item['author'] = quote.css('span small::text').get()
            item['tags'] = quote.css('div.tags a.tag::text').getall()
            yield item
```

## Item Pipeline

### 基本 Pipeline

```python
class TutorialPipeline:
    def process_item(self, item, spider):
        # 数据清洗
        item['text'] = item['text'].strip()
        return item
```

### 保存到文件

```python
import json

class JsonWriterPipeline:
    def open_spider(self, spider):
        self.file = open('items.json', 'w')

    def process_item(self, item, spider):
        line = json.dumps(dict(item)) + "\n"
        self.file.write(line)
        return item

    def close_spider(self, spider):
        self.file.close()
```

### 保存到数据库

```python
from pymongo import MongoClient

class MongoPipeline:
    def open_spider(self, spider):
        self.client = MongoClient('localhost', 27017)
        self.db = self.client['tutorial']

    def process_item(self, item, spider):
        self.db.quotes.insert_one(dict(item))
        return item

    def close_spider(self, spider):
        self.client.close()
```

## Settings 配置

```python
# settings.py

BOT_NAME = 'tutorial'
SPIDER_MODULES = ['tutorial.spiders']
NEWSPIDER_MODULE = 'tutorial.spiders'

# 启用 Pipeline
ITEM_PIPELINES = {
    'tutorial.pipelines.JsonWriterPipeline': 300,
    'tutorial.pipelines.MongoPipeline': 400,
}

# 下载延迟
DOWNLOAD_DELAY = 1

# 并发请求数
CONCURRENT_REQUESTS_PER_DOMAIN = 8

# User-Agent
USER_AGENT = 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36'

# 关闭机器人规则
ROBOTSTXT_OBEY = False
```

## 运行爬虫

```bash
# 运行爬虫
scrapy crawl quotes

# 保存为 JSON
scrapy crawl quotes -o items.json

# 保存为 CSV
scrapy crawl quotes -o items.csv
```

## 常用命令

| 命令 | 说明 |
|------|------|
| `scrapy startproject` | 创建项目 |
| `scrapy genspider` | 创建爬虫 |
| `scrapy crawl` | 运行爬虫 |
| `scrapy list` | 列出所有爬虫 |
| `scrapy edit` | 编辑爬虫 |
| `scrapy fetch` | 获取页面 |
| `scrapy shell` | 交互式调试 |

## 错误处理和重试机制

### Settings 配置

```python
# settings.py

# 启用重试
RETRY_ENABLED = True
RETRY_TIMES = 3

# 需要重试的HTTP状态码
RETRY_HTTP_CODES = [500, 502, 503, 504, 408, 429]

# 超时设置
DOWNLOAD_TIMEOUT = 30
```

### Spider 中处理错误

```python
import scrapy

class QuotesSpider(scrapy.Spider):
    name = "quotes"
    
    def start_requests(self):
        urls = ['https://quotes.toscrape.com/page/1/']
        for url in urls:
            yield scrapy.Request(url, callback=self.parse, errback=self.handle_error)
    
    def handle_error(self, failure):
        # 记录错误日志
        self.logger.error(repr(failure))
        
        # 可以在这里重新请求
        if failure.request:
            yield failure.request.copy()
    
    def parse(self, response):
        # 正常处理
        pass
```

## 日志配置

### 基本配置

```python
# settings.py

# 日志级别
LOG_LEVEL = 'INFO'

# 保存到文件
LOG_FILE = 'scrapy.log'

# 日志编码
LOG_ENCODING = 'utf-8'
```

### 命令行指定

```bash
# 保存日志到文件
scrapy crawl quotes --logfile=scrapy.log

# 设置日志级别
scrapy crawl quotes -L INFO

# 同时输出到文件和终端
scrapy crawl quotes --logfile=scrapy.log -s LOG_FILE=scrapy.log
```

### Spider 中使用日志

```python
class QuotesSpider(scrapy.Spider):
    name = "quotes"
    
    def parse(self, response):
        self.logger.info('正在爬取: %s', response.url)
        self.logger.debug('响应状态: %s', response.status)
        
        # 记录错误
        self.logger.error('爬取失败: %s', response.url)
```

## CrawlSpider 和 LinkExtractor

### 自动化链接处理

```python
import scrapy
from scrapy.linkextractors import LinkExtractor
from scrapy.spiders import CrawlSpider, Rule

class BlogSpider(CrawlSpider):
    name = "blog"
    allowed_domains = ["example.com"]
    start_urls = ['https://example.com/']
    
    rules = (
        # 匹配文章详情页，调用parse_item处理
        Rule(
            LinkExtractor(allow=r'/article/\d+/'), 
            callback='parse_item'
        ),
        # 匹配分页链接，自动跟进
        Rule(
            LinkExtractor(allow=r'/page/\d+/'), 
            follow=True
        ),
        # 匹配分类页
        Rule(
            LinkExtractor(allow=r'/category/.*'),
            follow=True
        ),
    )
    
    def parse_item(self, response):
        yield {
            'title': response.css('h1.title::text').get(),
            'url': response.url,
        }
```

### LinkExtractor 常用参数

```python
from scrapy.linkextractors import LinkExtractor

# 基于正则表达式
le = LinkExtractor(allow=r'/page/\d+')

# 基于CSS选择器
le = LinkExtractor(
    restrict_css='div.pagination a',
    allow=r'/page/\d+'
)

# 排除特定链接
le = LinkExtractor(
    allow=r'/article/',
    deny=(r'/admin/', r'/private/')
)

# 基于XPath
le = LinkExtractor(
    restrict_xpaths='//div[@class="links"]'
)
```

## FormRequest 和登录处理

### 基本表单提交

```python
class LoginSpider(scrapy.Spider):
    name = "login"
    
    def start_requests(self):
        yield scrapy.FormRequest(
            url='https://example.com/login',
            formdata={
                'username': 'user@example.com',
                'password': 'password123'
            },
            callback=self.after_login
        )
    
    def after_login(self, response):
        # 检查登录是否成功
        if '登录失败' in response.text:
            self.logger.error('登录失败')
            return
        
        # 登录成功后继续爬取
        yield scrapy.Request('https://example.com/user/dashboard')
```

### 处理需要Token的表单

```python
class FormSpider(scrapy.Spider):
    name = "form"
    
    def parse(self, response):
        # 从页面提取CSRF Token
        token = response.css('input[name="csrf_token"]::attr(value)').get()
        
        yield scrapy.FormRequest(
            url='https://example.com/submit',
            formdata={
                'csrf_token': token,
                'content': 'Hello World'
            },
            callback=self.parse_result
        )
```

## scrapy shell 交互式调试

### 启动方式

```bash
# 启动shell并指定URL
scrapy shell "https://quotes.toscrape.com"

# 启动后会自动下载页面
# 可用对象：response, request, spider, settings
```

### 常用命令

```python
# 查看响应内容
view(response)  # 在浏览器中打开

# 测试CSS选择器
response.css('div.quote')
response.css('div.quote span.text::text').get()
response.css('div.quote span.text::text').getall()

# 测试XPath
response.xpath('//div[@class="quote"]')
response.xpath('//span[@class="text"]/text()').get()

# 提取属性
response.css('a::attr(href)').get()

# 保存到文件
with open('test.html', 'wb') as f:
    f.write(response.body)
```

### 实际调试示例

```bash
$ scrapy shell "https://quotes.toscrape.com"

# 在shell中测试
>>> response.css('div.quote').getall()  # 获取所有引用块
>>> response.css('span.text::text').getall()  # 获取所有文本
>>> response.css('a::attr(href)').get()  # 获取第一个链接
>>> author = response.css('span small::text').get()  # 获取作者
>>> tags = response.css('div.tags a.tag::text').getall()  # 获取标签列表
```

## 进阶技巧

### 代理池配置

```python
# middlewares.py
import random

class ProxyMiddleware:
    def __init__(self):
        self.proxies = [
            'http://user:pass@proxy1.com:8080',
            'http://user:pass@proxy2.com:8080',
            'http://proxy3.com:8080',
        ]
    
    def process_request(self, request, spider):
        proxy = random.choice(self.proxies)
        request.meta['proxy'] = proxy
        spider.logger.info(f'使用代理: {proxy}')
```

### User-Agent 轮换

```python
# middlewares.py
import random

class RandomUserAgentMiddleware:
    def __init__(self):
        self.user_agents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
        ]
    
    def process_request(self, request, spider):
        request.headers['User-Agent'] = random.choice(self.user_agents)
```

### Spider 暂停和恢复

```bash
# 开始爬取并保存状态
scrapy crawl quotes -s JOBDIR=crawls/quotes-1

# 按Ctrl+C暂停

# 恢复爬取（从上次中断处继续）
scrapy crawl quotes -s JOBDIR=crawls/quotes-1
```

### 自动限速（推荐）

```python
# settings.py

# 启用自动限速
AUTOTHROTTLE_ENABLED = True

# 初始延迟（秒）
AUTOTHROTTLE_START_DELAY = 1

# 最大延迟（秒）
AUTOTHROTTLE_MAX_DELAY = 60

# 并发请求数
AUTOTHROTTLE_TARGET_CONCURRENCY = 1.0

# 开启调试模式，显示限速信息
AUTOTHROTTLE_DEBUG = True
```

### 完整中间件配置示例

```python
# settings.py

DOWNLOADER_MIDDLEWARES = {
    'tutorial.middlewares.RandomUserAgentMiddleware': 400,
    'tutorial.middlewares.ProxyMiddleware': 100,
}

# 启用自动限速
AUTOTHROTTLE_ENABLED = True
AUTOTHROTTLE_START_DELAY = 2
AUTOTHROTTLE_MAX_DELAY = 10

# 关闭机器人规则
ROBOTSTXT_OBEY = False

# 设置下载延迟
DOWNLOAD_DELAY = 1
```

## 小结

- **Scrapy** 是最流行的 Python 爬虫框架
- 使用 **Spider** 定义爬取逻辑
- 使用 **Item** 定义数据结构
- 使用 **Pipeline** 处理数据
- 通过 **Settings** 配置爬虫行为
- 使用 **CrawlSpider** 自动化处理链接和分页
- 掌握 **错误处理和日志** 确保生产环境稳定运行
- 善用 **scrapy shell** 快速调试选择器
- 通过 **中间件和代理池** 提升爬虫隐蔽性
- 使用 **暂停恢复** 功能处理大型爬虫任务
