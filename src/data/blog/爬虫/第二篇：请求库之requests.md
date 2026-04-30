---
title: 第二篇：请求库之requests
author: 程序员
pubDatetime: 2024-08-13T00:00:00.000+08:00
updated: 2026-04-22T00:00:00.000+08:00
slug: python-requests-library
description: 'Python requests库详解，包括GET、POST请求及Headers、Cookies处理'
tags:
  - Python
  - 爬虫
  - requests
category: 爬虫
draft: false
language: zh-CN
---

> `requests` 是一个 Python HTTP 库，可以模拟浏览器的请求。比起 urllib，requests 模块的 API 更加便捷。

## 安装

```bash
pip install requests
```

## 常用请求方式

```python
import requests

# GET 请求
r = requests.get('https://api.github.com/events')

# POST 请求
r = requests.post('http://httpbin.org/post', data={'key': 'value'})

# 其他请求方式
r = requests.put('http://httpbin.org/put', data={'key': 'value'})
r = requests.delete('http://httpbin.org/delete')
r = requests.head('http://httpbin.org/get')
r = requests.options('http://httpbin.org/get')
```

> requests 库发送请求将网页内容下载下来以后，并不会执行 JS 代码。

## GET 请求

### 基本请求

```python
import requests

response = requests.get('http://www.baidu.com/')
print(response.text)
```

### 带参数请求

#### 使用 params 参数

```python
import requests
from urllib.parse import urlencode

# 方式一：手动拼接 URL
keywords = "haiyan海燕"
encode_res = urlencode({"k": keywords}, encoding="utf-8")
url = "https://www.baidu.com/s?" + encode_res

# 方式二：使用 params 参数（推荐）
wd = 'python'
pn = 1
response = requests.get(
    'https://www.baidu.com/s',
    params={'wd': wd, 'pn': pn},
    headers={
        'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36'
    }
)
print(response.text)
```

## 请求头 Headers

### 常用请求头

| 请求头 | 说明 |
|--------|------|
| **Host** | 访问的服务器域名和端口号 |
| **Referer** | 请求的来源，大型网站常据此判断 |
| **User-Agent** | 客户端标识，必须添加 |
| **Cookie** | 使用单独的 cookies 参数处理 |

### 示例

```python
import requests

# 添加 headers 伪装成浏览器
headers = {
    'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36'
}

response = requests.get('https://www.zhihu.com/explore', headers=headers)
print(response.status_code)  # 200
```

## Cookies 处理

```python
import requests

# 手动设置 cookies
cookies = {
    'user_session': 'your_session_token'
}
response = requests.get('https://github.com/settings/emails', cookies=cookies)
print('378533872@qq.com' in response.text)  # True
```

## POST 请求

### GET vs POST

| 特性 | GET | POST |
|------|-----|------|
| 数据位置 | URL 查询参数 | 请求体 |
| 数据大小 | 有限制（1K） | 无限制 |
| 安全性 | 较低（暴露在 URL） | 较高 |
| 编码方式 | URL 编码 | URL 编码 |

### 示例

```python
import requests

# 模拟登录
response = requests.post(
    'https://example.com/login',
    data={
        'username': 'user',
        'password': 'pass'
    },
    headers={
        'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36'
    }
)
print(response.status_code)
```

## Session 保持会话

```python
import requests

# 使用 session 保持 cookie
session = requests.Session()

# 登录
session.post('https://example.com/login', data={'username': 'user', 'password': 'pass'})

# 之后的请求会自动带上 cookie
response = session.get('https://example.com/profile')
print(response.text)
```

## 注意事项

> **重要提示**：
> 1. 登录抓包时，应输入错误的用户名密码，避免页面跳转
> 2. 测试前先清除浏览器 cookie
> 3. 使用 `requests.session()` 自动管理 cookie

## 小结

- **requests** 是 Python 最常用的 HTTP 请求库
- GET 请求使用 `params` 参数
- POST 请求使用 `data` 参数
- 使用 `headers` 伪装浏览器
- 使用 `session` 保持会话状态
