---
title: Python 网络爬虫：原理、流程与实战
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-04-22T00:00:00.000+08:00
slug: web-scraping-basics
featured: false
draft: false
series: 爬虫
seriesOrder: 3
tags:
  - Python
  - 爬虫
  - 网络爬虫
  - HTTP协议
  - 数据采集
  - requests库
  - BeautifulSoup
description: 'Python网络爬虫，详细讲解HTTP协议、requests请求、BeautifulSoup解析、反爬机制应对、数据存储等核心知识，包含完整的爬虫流程示例代码。'
---

> 网络爬虫是通过程序自动获取网页内容的技术，是数据采集的重要手段。

![网络爬虫生命周期流程图](./images/web-scraping-lifecycle-pipeline-figure-01.png)

## 基本原理

### 爬虫流程

```
发起请求 → 获取响应 → 解析内容 → 保存数据 → 重复步骤
```

1. **发起请求**：向目标服务器发送 HTTP 请求
2. **获取响应**：接收服务器返回的 HTML/JSON 内容
3. **解析内容**：提取所需的数据
4. **保存数据**：存储到数据库或文件
5. **重复步骤**：爬取更多页面

### 简单示例

```python
import requests

def scrape_basic(url):
    response = requests.get(url)
    if response.status_code == 200:
        html = response.text
        # 解析 html 提取数据
        return html
    else:
        print(f"请求失败: {response.status_code}")
        return None
```

## HTTP 协议基础

### 请求方法

| 方法 | 说明 | 用途 |
|------|------|------|
| GET | 获取资源 | 页面、API |
| POST | 提交数据 | 登录、搜索 |
| HEAD | 获取头部 | 检查资源 |
| PUT | 上传资源 | 文件上传 |

### 请求头

```python
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept": "text/html,application/json",
    "Accept-Language": "zh-CN,zh;q=0.9",
    "Referer": "https://example.com",
    "Cookie": "session_id=xxx"
}
```

## 请求库

### requests 库

```python
import requests

# GET 请求
response = requests.get(url, params={"key": "value"})
print(response.text)
print(response.json())
print(response.headers)
```

```python
# POST 请求
data = {"username": "user", "password": "pass"}
response = requests.post(url, data=data)
```

```python
# 带参数请求
session = requests.Session()
session.headers.update({"User-Agent": "Custom Agent"})

response = session.get(url)
```

### 处理超时和重试

```python
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

def create_session():
    session = requests.Session()
    retry = Retry(total=3, backoff_factor=0.5)
    adapter = HTTPAdapter(max_retries=retry)
    session.mount("http://", adapter)
    session.mount("https://", adapter)
    return session
```

## 反爬机制与应对

### 常见反爬

| 类型 | 说明 | 应对 |
|------|------|------|
| **User-Agent** | 检测浏览器 | 随机 UA |
| **IP 限制** | 限制访问频率 | 代理 IP |
| **验证码** | 人机验证 | 第三方识别 |
| **Cookie** | 追踪会话 | 维持会话 |
| **JavaScript** | 动态渲染 | Selenium |
| **加密参数** | 参数签名 | 逆向分析 |

### 应对策略

```python
import random

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36"
]

def get_random_headers():
    return {
        "User-Agent": random.choice(USER_AGENTS),
        "Accept-Language": "zh-CN,zh;q=0.9"
    }
```

## 数据解析

### 正则表达式

```python
import re

# 提取链接
links = re.findall(r'<a href="(.*?)">(.*?)</a>', html)

# 提取手机号
phones = re.findall(r'1[3-9]\d{9}', text)

# 提取邮箱
emails = re.findall(r'\w+@\w+\.\w+', text)
```

### BeautifulSoup

```python
from bs4 import BeautifulSoup

soup = BeautifulSoup(html, "html.parser")

# 查找元素
title = soup.find("h1").text
links = soup.find_all("a", class_="item")
items = soup.select(".container .item")
```

### pyquery

```python
from pyquery import PyQuery

doc = PyQuery(html)
items = doc(".item")
titles = items.find("h2").text()
```

## 数据存储

### 存储为文件

```python
import json

# JSON 文件
with open("data.json", "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

# CSV 文件
import csv

with open("data.csv", "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=["title", "url"])
    writer.writeheader()
    writer.writerows(data)
```

### 存储到数据库

```python
import pymongo

client = pymongo.MongoClient("mongodb://localhost:27017/")
db = client["spider"]
collection = db["articles"]
collection.insert_many(data)
```

## Selenium 浏览器自动化

### 安装和基本使用

```bash
pip install selenium
```

### 基本示例

```python
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# 初始化Chrome浏览器
driver = webdriver.Chrome()

# 访问网页
driver.get('https://example.com')

# 等待页面加载
element = WebDriverWait(driver, 10).until(
    EC.presence_of_element_located((By.CLASS_NAME, "content"))
)

# 获取渲染后的HTML
html = driver.page_source

# 提取数据
title = driver.find_element(By.CSS_SELECTOR, "h1").text
links = driver.find_elements(By.TAG_NAME, "a")

# 执行JavaScript
driver.execute_script("window.scrollTo(0, document.body.scrollHeight)")

# 关闭浏览器
driver.quit()
```

### 元素定位方法

```python
# 通过ID
element = driver.find_element(By.ID, "username")

# 通过CSS选择器
element = driver.find_element(By.CSS_SELECTOR, ".container .item")

# 通过XPath
element = driver.find_element(By.XPATH, "//div[@class='content']/p")

# 通过Class名称
elements = driver.find_elements(By.CLASS_NAME, "item")

# 查找链接
link = driver.find_element(By.PARTIAL_LINK_TEXT, "登录")
```

### 处理动态内容

```python
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# 等待元素出现
element = WebDriverWait(driver, 10).until(
    EC.presence_of_element_located((By.ID, "dynamic-content"))
)

# 等待元素可点击
button = WebDriverWait(driver, 10).until(
    EC.element_to_be_clickable((By.ID, "submit-btn"))
)

# 等待文本出现
text = WebDriverWait(driver, 10).until(
    EC.text_to_be_present_in_element((By.CLASS_NAME, "status"), "Success")
)

# 等待页面加载完成
driver.implicitly_wait(10)  # 隐式等待
```

### 无头模式

```python
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

options = Options()
options.add_argument('--headless')  # 无头模式，不显示浏览器窗口
options.add_argument('--disable-gpu')
options.add_argument('--no-sandbox')
options.add_argument('--disable-dev-shm-usage')

driver = webdriver.Chrome(options=options)
driver.get('https://example.com')
```

## JSON API 接口爬取

### 基本 API 请求

```python
import requests

# GET 请求
response = requests.get('https://api.example.com/users', params={'page': 1})
data = response.json()

# 解析JSON数据
for user in data['data']:
    print(f"用户名: {user['name']}, 邮箱: {user['email']}")

# 获取分页数据
while data.get('next'):
    response = requests.get(data['next'])
    data = response.json()
```

### 处理分页 API

```python
import requests

def fetch_all_pages(url):
    """获取所有分页数据"""
    all_data = []
    page = 1
    
    while True:
        response = requests.get(url, params={'page': page})
        data = response.json()
        
        all_data.extend(data['data'])
        
        # 检查是否还有下一页
        if not data.get('next'):
            break
        
        page += 1
    
    return all_data

# 使用
items = fetch_all_pages('https://api.example.com/items')
```

### 常见 API 认证方式

```python
import requests

# API Key认证
response = requests.get(
    'https://api.example.com/data',
    headers={'Authorization': 'Bearer YOUR_TOKEN'}
)

# 查询参数认证
response = requests.get(
    'https://api.example.com/data',
    params={'api_key': 'YOUR_KEY'}
)

# POST 认证
response = requests.post(
    'https://api.example.com/login',
    json={'username': 'user', 'password': 'pass'}
)
```

## Session 和 Cookie 管理

### 基本使用

```python
import requests

# 创建Session对象
session = requests.Session()

# 设置默认Headers
session.headers.update({
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept-Language': 'zh-CN,zh;q=0.9'
})

# 登录
login_data = {'username': 'user', 'password': 'pass'}
session.post('https://example.com/login', data=login_data)

# 访问需要登录的页面
response = session.get('https://example.com/profile')
print(response.text)
```

### Cookie 持久化

```python
import requests
import pickle

# 保存Cookie
def save_session(session, filename):
    with open(filename, 'wb') as f:
        pickle.dump(session.cookies, f)

# 加载Cookie
def load_session(session, filename):
    try:
        with open(filename, 'rb') as f:
            session.cookies.update(pickle.load(f))
    except FileNotFoundError:
        pass

# 使用
session = requests.Session()
load_session(session, 'session.pkl')

# 访问需要登录的页面
response = session.get('https://example.com/dashboard')
```

### 处理登录验证

```python
import requests

session = requests.Session()

# 1. 获取登录页面，提取Token
response = session.get('https://example.com/login')
token = response.css('input[name="csrf_token"]::attr(value)').get()  # 需要BeautifulSoup

# 2. 提交登录
login_data = {
    'username': 'user',
    'password': 'pass',
    'csrf_token': token
}
session.post('https://example.com/login', data=login_data)

# 3. 验证登录
response = session.get('https://example.com/user')
if '欢迎' in response.text:
    print('登录成功')
```

## 代理 IP 使用

### 基本使用

```python
import requests

proxies = {
    'http': 'http://user:pass@proxy.example.com:8080',
    'https': 'https://user:pass@proxy.example.com:8080'
}

response = requests.get(url, proxies=proxies)
```

### 随机代理池

```python
import requests
import random

class ProxyPool:
    def __init__(self):
        self.proxies = [
            'http://user:pass@proxy1.example.com:8080',
            'http://user:pass@proxy2.example.com:8080',
            'http://proxy3.example.com:8080',
        ]
    
    def get_random_proxy(self):
        return {
            'http': random.choice(self.proxies),
            'https': random.choice(self.proxies)
        }

pool = ProxyPool()
response = requests.get(url, proxies=pool.get_random_proxy())
```

### 免费代理获取

```python
import requests

def get_free_proxies():
    """从公开API获取免费代理"""
    response = requests.get('https://www.proxyscrape.com/free-proxy-list')
    # 实际使用需要解析返回的代理列表
    proxies = [
        'http://1.2.3.4:8080',
        'http://5.6.7.8:8080',
    ]
    return proxies

## 小结

- **流程**：请求 → 响应 → 解析 → 存储
- **requests**：最常用的 HTTP 库
- **解析**：正则、BeautifulSoup、pyquery
- **反爬**：UA、代理、Selenium
- **存储**：JSON、CSV、数据库
- **浏览器自动化**：使用 Selenium 处理 JavaScript 动态渲染
- **API 接口**：JSON API 是现代网站数据获取的重要方式
- **会话管理**：Session 和 Cookie 维持登录状态
- **代理使用**：代理池避免 IP 被封禁
