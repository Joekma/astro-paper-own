---
title: Playwright 爬虫实战：动态页面数据抓取
series: playwright
author: Joekma
pubDatetime: 2026-05-09T00:00:00.000+08:00
modDatetime: 2026-05-09T00:00:00.000+08:00
slug: playwright-web-scraping
description: '详细介绍使用Playwright进行网页爬虫开发，包括动态内容抓取、无限滚动、登录后数据访问、分布式爬虫等实战技巧。'
tags:
  - Playwright
  - RPA
  - 爬虫
  - 数据抓取
draft: false
language: zh-CN
---

## 概述

传统爬虫基于 HTTP 请求的方案在面对现代 SPA（单页应用）和动态渲染页面时显得力不从心。Playwright 的出现完美解决了这个问题——它能像真实浏览器一样执行 JavaScript，渲染页面，等待动态内容加载。本教程将带你从零构建一个强大的网页爬虫。

### 传统爬虫 vs Playwright 爬虫

```
┌─────────────────────────────────────────────────────────────┐
│                    传统爬虫                                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  HTTP 请求 ──▶ 获取 HTML ──▶ 解析 ──▶ 提取数据               │
│                                                              │
│  ❌ 无法执行 JavaScript                                      │
│  ❌ 无法处理动态加载                                          │
│  ❌ 无法模拟登录                                             │
│  ❌ 容易被检测                                               │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  Playwright 爬虫                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  浏览器实例 ──▶ 渲染页面 ──▶ 执行 JS ──▶ 提取数据            │
│                                                              │
│  ✅ 完全执行 JavaScript                                       │
│  ✅ 处理所有动态内容                                          │
│  ✅ 支持登录和会话                                            │
│  ✅ 可模拟真实用户行为                                        │
│  ✅ 支持反爬规避                                              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 基础爬虫架构

### 爬虫项目结构

```
web-scraper/
├── scraper/
│   ├── __init__.py
│   ├── browser.py          # 浏览器管理
│   ├── spider.py           # 爬虫核心
│   ├── extractors.py      # 数据提取器
│   └── storage.py         # 数据存储
├── config/
│   └── settings.py        # 配置文件
├── utils/
│   ├── __init__.py
│   └── helpers.py         # 工具函数
├── outputs/              # 输出目录
├── requirements.txt
└── run.py                # 入口文件
```

### 浏览器管理模块

```python
# scraper/browser.py
from playwright.sync_api import sync_playwright, Browser, BrowserContext
from typing import Optional
import random

class BrowserManager:
    """浏览器管理器"""
    
    USER_AGENTS = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
    ]
    
    def __init__(self, headless: bool = True):
        self.headless = headless
        self.playwright = None
        self.browser: Optional[Browser] = None
    
    def __enter__(self):
        self.playwright = sync_playwright().start()
        self.browser = self.playwright.chromium.launch(
            headless=self.headless,
            args=[
                "--disable-blink-features=AutomationControlled",
                "--disable-dev-shm-usage",
                "--no-sandbox"
            ]
        )
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        if self.browser:
            self.browser.close()
        if self.playwright:
            self.playwright.stop()
    
    def create_context(self) -> BrowserContext:
        """创建新的浏览器上下文"""
        context = self.browser.new_context(
            user_agent=random.choice(self.USER_AGENTS),
            viewport={"width": 1920, "height": 1080},
            locale="zh-CN",
            timezone_id="Asia/Shanghai"
        )
        return context
```

### 爬虫核心类

```python
# scraper/spider.py
from playwright.sync_api import Page, BrowserContext
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, asdict
import time

@dataclass
class Product:
    """产品数据模型"""
    name: str
    price: str
    url: str
    rating: Optional[str] = None
    reviews: Optional[str] = None
    description: Optional[str] = None

class BaseSpider:
    """爬虫基类"""
    
    def __init__(self, context: BrowserContext, delay: float = 1.0):
        self.context = context
        self.page: Optional[Page] = None
        self.delay = delay  # 请求间隔（秒）
    
    def open_page(self) -> Page:
        """打开新页面"""
        self.page = self.context.new_page()
        return self.page
    
    def close_page(self):
        """关闭页面"""
        if self.page:
            self.page.close()
            self.page = None
    
    def random_delay(self):
        """随机延迟"""
        import random
        time.sleep(self.delay + random.uniform(0, 1))
    
    def scrape(self, url: str) -> List[Dict[str, Any]]:
        """爬取数据（子类实现）"""
        raise NotImplementedError
```

## 数据提取器

### 基础提取器

```python
# scraper/extractor.py
from playwright.sync_api import Page, Locator
from typing import List, Dict, Any, Optional
import re

class DataExtractor:
    """数据提取器"""
    
    def __init__(self, page: Page):
        self.page = page
    
    def extract_text(self, selector: str) -> Optional[str]:
        """提取文本"""
        try:
            element = self.page.locator(selector).first
            if element.is_visible():
                return element.inner_text().strip()
        except Exception:
            pass
        return None
    
    def extract_attribute(self, selector: str, attribute: str) -> Optional[str]:
        """提取属性"""
        try:
            return self.page.locator(selector).first.get_attribute(attribute)
        except Exception:
            return None
    
    def extract_all(self, selector: str) -> List[str]:
        """提取所有匹配元素文本"""
        try:
            return [el.inner_text().strip() 
                    for el in self.page.locator(selector).all()
                    if el.is_visible()]
        except Exception:
            return []
    
    def extract_table(self, table_selector: str) -> List[Dict[str, str]]:
        """提取表格数据"""
        rows = []
        try:
            headers = [th.inner_text().strip() 
                      for th in self.page.locator(f"{table_selector} thead th").all()]
            
            for tr in self.page.locator(f"{table_selector} tbody tr").all():
                cells = [td.inner_text().strip() for td in tr.locator("td").all()]
                if cells:
                    rows.append(dict(zip(headers, cells)))
        except Exception:
            pass
        return rows
    
    def extract_json_from_page(self, key: str) -> Optional[Dict]:
        """从页面 JavaScript 变量提取数据"""
        try:
            script = f"""
                return JSON.stringify(window.{key} || null);
            """
            json_str = self.page.evaluate(script)
            if json_str:
                import json
                return json.loads(json_str)
        except Exception:
            pass
        return None
```

### 产品数据提取

```python
# scraper/product_extractor.py
from .extractor import DataExtractor
from typing import List, Optional
from urllib.parse import urljoin

class ProductExtractor(DataExtractor):
    """产品数据提取器"""
    
    def extract_products(self, list_selector: str) -> List[Dict]:
        """提取产品列表"""
        products = []
        
        try:
            product_cards = self.page.locator(list_selector).all()
            
            for card in product_cards:
                product = {
                    "name": self._safe_extract(card, ".product-name"),
                    "price": self._safe_extract(card, ".price"),
                    "rating": self._safe_extract(card, ".rating"),
                    "url": self._safe_extract_attr(card, "a", "href"),
                    "image": self._safe_extract_attr(card, "img", "src")
                }
                products.append(product)
                
        except Exception as e:
            print(f"提取产品列表失败: {e}")
        
        return products
    
    def extract_product_detail(self) -> Dict:
        """提取产品详情"""
        return {
            "name": self.extract_text(".product-title h1"),
            "price": self.extract_text(".price-current"),
            "original_price": self.extract_text(".price-original"),
            "description": self.extract_text(".product-description"),
            "specifications": self.extract_table(".specifications-table"),
            "images": self.extract_all(".product-gallery img"),
            "reviews": self.extract_reviews()
        }
    
    def extract_reviews(self) -> List[Dict]:
        """提取评论"""
        reviews = []
        try:
            for review in self.page.locator(".review-item").all():
                reviews.append({
                    "user": self._safe_extract(review, ".reviewer-name"),
                    "rating": self._safe_extract(review, ".review-rating"),
                    "date": self._safe_extract(review, ".review-date"),
                    "content": self._safe_extract(review, ".review-content"),
                    "helpful": self._safe_extract(review, ".helpful-count")
                })
        except Exception:
            pass
        return reviews
    
    def _safe_extract(self, locator: Locator, selector: str) -> Optional[str]:
        """安全提取文本"""
        try:
            return locator.locator(selector).inner_text().strip()
        except Exception:
            return None
    
    def _safe_extract_attr(self, locator: Locator, selector: str, attr: str) -> Optional[str]:
        """安全提取属性"""
        try:
            return locator.locator(selector).get_attribute(attr)
        except Exception:
            return None
```

## 实战案例

### 电商网站爬虫

```python
# scraper/ecommerce_spider.py
from .spider import BaseSpider
from .product_extractor import ProductExtractor
from typing import List, Dict
import json

class EcommerceSpider(BaseSpider):
    """电商网站爬虫"""
    
    def __init__(self, context, delay: float = 2.0):
        super().__init__(context, delay)
        self.extractor: ProductExtractor = None
    
    def scrape_category(self, category_url: str, max_pages: int = 5) -> List[Dict]:
        """爬取分类页面"""
        all_products = []
        current_page = 1
        
        self.open_page()
        self.extractor = ProductExtractor(self.page)
        
        while current_page <= max_pages:
            print(f"爬取第 {current_page} 页...")
            
            # 访问页面
            url = f"{category_url}?page={current_page}" if current_page > 1 else category_url
            self.page.goto(url, wait_until="networkidle")
            
            # 等待产品列表加载
            self.page.wait_for_selector(".product-list", timeout=10000)
            
            # 提取产品
            products = self.extractor.extract_products(".product-card")
            all_products.extend(products)
            
            print(f"  提取 {len(products)} 个产品")
            
            # 检查是否有下一页
            next_btn = self.page.locator(".pagination .next")
            if not next_btn.is_enabled():
                break
            
            current_page += 1
            self.random_delay()
        
        self.close_page()
        return all_products
    
    def scrape_product_detail(self, product_url: str) -> Dict:
        """爬取产品详情"""
        self.open_page()
        self.extractor = ProductExtractor(self.page)
        
        self.page.goto(product_url, wait_until="networkidle")
        self.page.wait_for_selector(".product-detail", timeout=10000)
        
        detail = self.extractor.extract_product_detail()
        
        self.close_page()
        return detail
    
    def scrape_search(self, keyword: str, max_results: int = 50) -> List[Dict]:
        """爬取搜索结果"""
        all_products = []
        
        self.open_page()
        self.extractor = ProductExtractor(self.page)
        
        # 执行搜索
        search_url = f"https://example.com/search?q={keyword}"
        self.page.goto(search_url, wait_until="networkidle")
        
        # 滚动加载更多
        loaded_count = 0
        while loaded_count < max_results:
            products = self.extractor.extract_products(".product-card")
            
            if not products:
                break
            
            all_products.extend(products[:max_results - loaded_count])
            loaded_count = len(all_products)
            
            print(f"已加载 {loaded_count}/{max_results} 个产品")
            
            # 滚动到页面底部加载更多
            self._scroll_to_load_more()
            self.random_delay()
        
        self.close_page()
        return all_products
    
    def _scroll_to_load_more(self):
        """滚动加载更多内容"""
        self.page.evaluate("""
            window.scrollTo({
                top: document.body.scrollHeight,
                behavior: 'smooth'
            });
        """)
        self.page.wait_for_timeout(1000)
```

### 社交媒体爬虫

```python
# scraper/social_media_spider.py
from .spider import BaseSpider
from typing import List, Dict
import time

class SocialMediaSpider(BaseSpider):
    """社交媒体爬虫"""
    
    def __init__(self, context, delay: float = 2.0):
        super().__init__(context, delay)
    
    def login(self, username: str, password: str) -> bool:
        """登录"""
        self.open_page()
        
        try:
            self.page.goto("https://social.example.com/login")
            self.page.wait_for_load_state("networkidle")
            
            # 输入凭据
            self.page.fill("input[name='username']", username)
            self.page.fill("input[name='password']", password)
            
            # 点击登录
            self.page.click("button[type='submit']")
            
            # 等待登录完成
            self.page.wait_for_url("**/home", timeout=10000)
            
            print("登录成功！")
            return True
            
        except Exception as e:
            print(f"登录失败: {e}")
            return False
    
    def extract_posts(self, max_count: int = 20) -> List[Dict]:
        """提取帖子"""
        posts = []
        
        # 滚动加载
        last_height = self.page.evaluate("document.body.scrollHeight")
        
        while len(posts) < max_count:
            # 提取当前可见帖子
            visible_posts = self.page.locator(".post").all()
            
            for post in visible_posts[len(posts):]:
                try:
                    post_data = {
                        "author": post.locator(".author-name").inner_text(),
                        "content": post.locator(".post-content").inner_text(),
                        "timestamp": post.locator(".post-time").inner_text(),
                        "likes": post.locator(".like-count").inner_text(),
                        "comments": post.locator(".comment-count").inner_text(),
                        "shares": post.locator(".share-count").inner_text()
                    }
                    posts.append(post_data)
                    
                    if len(posts) >= max_count:
                        break
                        
                except Exception as e:
                    continue
            
            # 滚动加载更多
            self.page.evaluate("window.scrollTo(0, document.body.scrollHeight);")
            time.sleep(2)
            
            # 检查是否已加载全部
            new_height = self.page.evaluate("document.body.scrollHeight")
            if new_height == last_height:
                break
            last_height = new_height
        
        return posts
    
    def extract_profile(self, username: str) -> Dict:
        """提取用户资料"""
        self.page.goto(f"https://social.example.com/user/{username}")
        self.page.wait_for_load_state("networkidle")
        
        return {
            "username": username,
            "display_name": self.page.locator(".profile-name").inner_text(),
            "bio": self.page.locator(".profile-bio").inner_text(),
            "followers": self.page.locator(".follower-count").inner_text(),
            "following": self.page.locator(".following-count").inner_text(),
            "posts_count": self.page.locator(".posts-count").inner_text()
        }
```

## 无限滚动处理

### 滚动加载爬虫

```python
# scraper/infinite_scroll.py
from playwright.sync_api import Page
from typing import Callable, List, Any
import time

class InfiniteScrollHandler:
    """无限滚动处理器"""
    
    def __init__(self, page: Page):
        self.page = page
    
    def scroll_until_end(
        self,
        extract_func: Callable,
        max_scrolls: int = 10,
        scroll_delay: float = 2.0,
        stop_condition: Callable[[List], bool] = None
    ) -> List[Any]:
        """
        滚动到页面底部
        
        Args:
            extract_func: 提取函数，返回当前页面的数据
            max_scrolls: 最大滚动次数
            scroll_delay: 滚动间隔（秒）
            stop_condition: 停止条件函数
        """
        all_data = []
        last_height = 0
        scroll_count = 0
        no_new_data_count = 0
        
        while scroll_count < max_scrolls:
            # 提取当前数据
            current_data = extract_func()
            
            if not current_data:
                no_new_data_count += 1
                if no_new_data_count >= 3:  # 连续3次无新数据则停止
                    break
            else:
                all_data.extend(current_data)
                no_new_data_count = 0
            
            # 检查停止条件
            if stop_condition and stop_condition(all_data):
                break
            
            # 执行滚动
            self._smooth_scroll()
            time.sleep(scroll_delay)
            
            # 检查高度变化
            new_height = self.page.evaluate("document.body.scrollHeight")
            
            if new_height == last_height:
                no_new_data_count += 1
            else:
                last_height = new_height
                no_new_data_count = 0
            
            scroll_count += 1
            print(f"滚动次数: {scroll_count}, 已提取: {len(all_data)} 条")
        
        return all_data
    
    def _smooth_scroll(self):
        """平滑滚动"""
        self.page.evaluate("""
            window.scrollTo({
                top: document.body.scrollHeight,
                behavior: 'smooth'
            });
        """)
    
    def scroll_by_increment(self, increment: int = 500, pause: float = 0.5):
        """增量滚动"""
        position = 0
        total_height = self.page.evaluate("document.body.scrollHeight")
        
        while position < total_height:
            self.page.evaluate(f"window.scrollTo(0, {position});")
            time.sleep(pause)
            position += increment
            new_height = self.page.evaluate("document.body.scrollHeight")
            if new_height > total_height:
                total_height = new_height
```

## 数据存储

### JSON 存储

```python
# scraper/storage.py
import json
from pathlib import Path
from datetime import datetime
from typing import List, Dict

class JSONStorage:
    """JSON 存储"""
    
    def __init__(self, output_dir: str = "outputs"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
    
    def save(self, data: List[Dict], filename: str):
        """保存数据"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filepath = self.output_dir / f"{filename}_{timestamp}.json"
        
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        print(f"数据已保存到: {filepath}")
        return filepath
    
    def append(self, data: Dict, filename: str):
        """追加数据"""
        filepath = self.output_dir / f"{filename}.json"
        
        # 读取现有数据
        existing_data = []
        if filepath.exists():
            with open(filepath, "r", encoding="utf-8") as f:
                existing_data = json.load(f)
        
        # 追加新数据
        existing_data.append(data)
        
        # 保存
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(existing_data, f, ensure_ascii=False, indent=2)
        
        print(f"数据已追加到: {filepath}")
```

### CSV 存储

```python
import csv
from pathlib import Path
from typing import List, Dict

class CSVStorage:
    """CSV 存储"""
    
    def __init__(self, output_dir: str = "outputs"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
    
    def save(self, data: List[Dict], filename: str):
        """保存数据为 CSV"""
        if not data:
            print("没有数据可保存")
            return
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filepath = self.output_dir / f"{filename}_{timestamp}.csv"
        
        # 获取所有字段
        fieldnames = list(data[0].keys())
        
        with open(filepath, "w", newline="", encoding="utf-8-sig") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(data)
        
        print(f"CSV 已保存到: {filepath}")
        return filepath
```

### 数据库存储

```python
import sqlite3
from typing import List, Dict

class DatabaseStorage:
    """SQLite 数据库存储"""
    
    def __init__(self, db_path: str = "scraper.db"):
        self.db_path = db_path
        self._init_database()
    
    def _init_database(self):
        """初始化数据库"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT,
                price TEXT,
                url TEXT,
                rating TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        conn.commit()
        conn.close()
    
    def save(self, data: List[Dict]):
        """保存数据"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        for item in data:
            cursor.execute("""
                INSERT INTO products (name, price, url, rating)
                VALUES (?, ?, ?, ?)
            """, (
                item.get("name"),
                item.get("price"),
                item.get("url"),
                item.get("rating")
            ))
        
        conn.commit()
        conn.close()
        
        print(f"已保存 {len(data)} 条数据")
```

## 运行爬虫

### 主程序

```python
# run.py
from scraper.browser import BrowserManager
from scraper.ecommerce_spider import EcommerceSpider
from scraper.storage import JSONStorage, CSVStorage
import argparse

def main():
    parser = argparse.ArgumentParser(description="网页爬虫")
    parser.add_argument("--mode", choices=["category", "search", "detail"],
                       default="category", help="爬取模式")
    parser.add_argument("--url", help="目标 URL")
    parser.add_argument("--keyword", help="搜索关键词")
    parser.add_argument("--output", choices=["json", "csv"], default="json")
    parser.add_argument("--headless", action="store_true", help="无头模式")
    args = parser.parse_args()
    
    storage = JSONStorage() if args.output == "json" else CSVStorage()
    
    with BrowserManager(headless=args.headless) as browser_manager:
        context = browser_manager.create_context()
        spider = EcommerceSpider(context, delay=2.0)
        
        if args.mode == "category":
            products = spider.scrape_category(args.url)
            storage.save(products, "products")
            
        elif args.mode == "search":
            products = spider.scrape_search(args.keyword)
            storage.save(products, "search_results")
            
        elif args.mode == "detail":
            detail = spider.scrape_product_detail(args.url)
            storage.save([detail], "product_detail")
    
    print("爬取完成！")

if __name__ == "__main__":
    main()
```

### 运行命令

```bash
# 爬取分类
python run.py --mode category --url "https://example.com/category/electronics"

# 搜索爬取
python run.py --mode search --keyword "laptop"

# 详情爬取
python run.py --mode detail --url "https://example.com/product/123"

# 带界面运行
python run.py --mode search --keyword "phone" --headless
```

## 反爬应对策略

### 用户代理轮换

```python
def rotate_user_agent():
    import random
    
    user_agents = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36...",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36...",
        # 更多 UA...
    ]
    
    context = browser.new_context(
        user_agent=random.choice(user_agents)
    )
```

### 代理 IP

```python
def use_proxy():
    context = browser.new_context(
        proxy={
            "server": "http://proxy.example.com:8080",
            "username": "user",
            "password": "password"
        }
    )
```

### 随机延迟

```python
def random_delay():
    import random
    import time
    
    delay = random.uniform(1, 3)
    time.sleep(delay)
```

### 模拟人类行为

```python
def human_behavior(page):
    import random
    
    # 随机移动鼠标
    page.mouse.move(random.randint(100, 500), random.randint(100, 500))
    
    # 随机点击位置偏移
    box = page.locator("button").first.bounding_box()
    if box:
        page.mouse.click(
            box['x'] + random.uniform(-5, 5),
            box['y'] + random.uniform(-5, 5)
        )
```
