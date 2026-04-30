---
title: Scrapy框架
author: 程序员
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-04-22T00:00:00.000+08:00
slug: scrapy-framework-tutorial
featured: false
draft: false
tags:
  - Python
  - 爬虫
  - Scrapy
description: 'Scrapy爬虫框架完整教程，包括安装、项目创建、Spider编写和数据处理'
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

## 小结

- **Scrapy** 是最流行的 Python 爬虫框架
- 使用 **Spider** 定义爬取逻辑
- 使用 **Item** 定义数据结构
- 使用 **Pipeline** 处理数据
- 通过 **Settings** 配置爬虫行为
