---
title: Python requests请求库详解
author: 程序员
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-04-22T00:00:00.000+08:00
slug: python-requests-library
featured: false
draft: false
tags:
  - Python
  - 爬虫
  - requests
  - HTTP
description: 'Python requests库详解和高级用法'
---

> requests 是 Python 中最流行的 HTTP 库，简洁易用的 API 使其成为网络请求的首选工具。

## 基本用法

### GET 请求

```python
import requests

# 简单 GET
response = requests.get("https://api.example.com/users")
print(response.status_code)
print(response.text)
```

```python
# 带参数
params = {"page": 1, "limit": 10}
response = requests.get("https://api.example.com/users", params=params)
```

```python
# 带请求头
headers = {"Authorization": "Bearer token123"}
response = requests.get(url, headers=headers)
```

### POST 请求

```python
# 表单数据
data = {"username": "user", "password": "pass"}
response = requests.post(url, data=data)
```

```python
# JSON 数据
import json
payload = {"name": "Alice", "email": "alice@example.com"}
response = requests.post(url, json=payload)
```

```python
# 文件上传
files = {"file": open("document.pdf", "rb")}
response = requests.post(url, files=files)
```

## 响应对象

### 常用属性

```python
response = requests.get(url)

response.status_code   # 状态码
response.text         # 响应文本
response.content      # 字节内容
response.json()       # JSON 解析
response.headers      # 响应头
response.cookies      # 响应 cookies
response.url          # 最终 URL
response.elapsed      # 请求耗时
```

### 状态码处理

```python
from requests import HTTPError

response = requests.get(url)

if response.status_code == 200:
    data = response.json()
elif response.status_code == 404:
    print("资源不存在")
elif response.status_code >= 400:
    raise HTTPError(f"请求失败: {response.status_code}")
```

## 高级用法

### 会话维持

```python
session = requests.Session()

# 会自动维护 cookies
session.headers.update({"User-Agent": "Mozilla/5.0"})

# 登录
session.post(login_url, data={"username": "user", "password": "pass"})

# 登录后请求
response = session.get(member_url)
```

### 重试机制

```python
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

def create_session():
    session = requests.Session()
    retry = Retry(
        total=3,
        backoff_factor=0.5,
        status_forcelist=[500, 502, 503, 504]
    )
    adapter = HTTPAdapter(max_retries=retry)
    session.mount("http://", adapter)
    session.mount("https://", adapter)
    return session
```

### 超时设置

```python
# 单次请求超时
response = requests.get(url, timeout=5)

# 连接超时和读取超时分开
response = requests.get(url, timeout=(3, 10))
```

### 代理设置

```python
proxies = {
    "http": "http://127.0.0.1:7890",
    "https": "http://127.0.0.1:7890"
}
response = requests.get(url, proxies=proxies)
```

### SSL 证书

```python
# 忽略证书验证（不推荐）
response = requests.get(url, verify=False)

# 指定证书
response = requests.get(url, verify="/path/to/cert.pem")
```

## 实战技巧

### 下载文件

```python
import requests

def download_file(url, save_path):
    response = requests.get(url, stream=True)
    with open(save_path, "wb") as f:
        for chunk in response.iter_content(chunk_size=8192):
            if chunk:
                f.write(chunk)
```

### 流式请求

```python
response = requests.get(url, stream=True)
for line in response.iter_lines():
    if line:
        print(line.decode("utf-8"))
```

### 并发请求

```python
import concurrent.futures
from requests import Session

def fetch(session, url):
    with session.get(url) as response:
        return response.json()

with Session() as session:
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        urls = ["http://example.com/api/1" for _ in range(100)]
        results = list(executor.map(lambda url: fetch(session, url), urls))
```

## 小结

- **GET/POST**：基本请求方法
- **会话**：Session 维持 cookies
- **重试**：HTTPAdapter 配置
- **超时**：避免长时间等待
- **代理**：突破访问限制