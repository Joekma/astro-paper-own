---
title: HTTP 协议：请求方法、状态码、头部字段
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-04-22T00:00:00.000+08:00
slug: http-protocol-detailed-intro
description: 'HTTP协议，包括请求方法、状态码、头部字段等核心概念。'
tags:
  - HTTP
  - 网络
  - 协议
  - Web
draft: false
series: 网络
language: zh-CN
---

## 概述

HTTP（HyperText Transfer Protocol）是万维网的数据通信基础，是客户端与服务器之间的请求-响应协议。

## HTTP 工作流程

```
客户端 ──▶ 请求 ──▶ 服务器
     ◀─── 响应 ◀───
```

1. 客户端建立 TCP 连接
2. 发送 HTTP 请求
3. 服务器处理请求并返回响应
4. 关闭连接（HTTP/1.0）或保持连接（HTTP/1.1）

## HTTP 版本

| 版本 | 年份 | 主要特性 |
|------|------|----------|
| HTTP/0.9 | 1991 | 简单文本协议 |
| HTTP/1.0 | 1996 | 引入请求头/响应头 |
| HTTP/1.1 | 1999 | 持久连接、管道化 |
| HTTP/2 | 2015 | 多路复用、头部压缩 |
| HTTP/3 | 2021 | QUIC 协议 |

## 请求方法

| 方法 | 幂等性 | 说明 | 常见用途 |
|------|--------|------|----------|
| **GET** | 幂等 | 获取资源 | 查询数据 |
| **POST** | 非幂等 | 提交数据 | 创建资源 |
| **PUT** | 幂等 | 更新资源 | 完整更新 |
| **PATCH** | 非幂等 | 部分更新 | 局部修改 |
| **DELETE** | 幂等 | 删除资源 | 删除数据 |
| **HEAD** | 幂等 | 获取头部 | 检查资源 |
| **OPTIONS** | 幂等 | 获取支持方法 | CORS 预检 |

### GET vs POST 对比

| 特性 | GET | POST |
|------|-----|------|
| 参数位置 | URL 查询字符串 | 请求体 |
| 长度限制 | 约 2048 字符 | 无限制 |
| 安全性 | 参数暴露在 URL | 相对安全 |
| 缓存 | 可缓存 | 通常不可缓存 |
| 幂等性 | 幂等 | 非幂等 |

## 请求格式

```
请求方法 URL HTTP/版本
Header1: value1
Header2: value2

请求体（可选）
```

### 示例

```http
GET /api/users?id=1 HTTP/1.1
Host: api.example.com
User-Agent: Mozilla/5.0
Accept: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Cookie: session_id=abc123
```

```http
POST /api/users HTTP/1.1
Host: api.example.com
Content-Type: application/json
Content-Length: 56

{"name":"张三","email":"zhang@example.com"}
```

## 响应格式

```
HTTP/版本 状态码 状态描述
Header1: value1
Header2: value2

响应体
```

### 示例

```http
HTTP/1.1 200 OK
Content-Type: application/json
Content-Length: 128
Cache-Control: max-age=3600

{"code":0,"data":{"id":1,"name":"张三"}}
```

## 状态码分类

| 分类 | 范围 | 说明 |
|------|------|------|
| **1xx** | 100-199 | 信息性状态 |
| **2xx** | 200-299 | 成功状态 |
| **3xx** | 300-399 | 重定向状态 |
| **4xx** | 400-499 | 客户端错误 |
| **5xx** | 500-599 | 服务器错误 |

### 常见状态码

| 状态码 | 说明 | 使用场景 |
|--------|------|----------|
| **200** | OK | 请求成功 |
| **201** | Created | 资源创建成功 |
| **204** | No Content | 请求成功，无返回内容 |
| **301** | Moved Permanently | 永久重定向 |
| **302** | Found | 临时重定向 |
| **304** | Not Modified | 使用缓存 |
| **400** | Bad Request | 请求参数错误 |
| **401** | Unauthorized | 未认证 |
| **403** | Forbidden | 无权限 |
| **404** | Not Found | 资源不存在 |
| **405** | Method Not Allowed | 方法不支持 |
| **429** | Too Many Requests | 请求过于频繁 |
| **500** | Internal Server Error | 服务器内部错误 |
| **502** | Bad Gateway | 网关错误 |
| **503** | Service Unavailable | 服务不可用 |
| **504** | Gateway Timeout | 网关超时 |

## HTTP 头部

### 通用头部

| 头部 | 说明 |
|------|------|
| `Cache-Control` | 缓存控制 |
| `Connection` | 连接管理 |
| `Date` | 消息日期 |
| `Transfer-Encoding` | 传输编码 |

### 请求头部

| 头部 | 说明 |
|------|------|
| `Host` | 目标主机 |
| `User-Agent` | 用户代理 |
| `Accept` | 可接受的内容类型 |
| `Accept-Language` | 可接受的语言 |
| `Accept-Encoding` | 可接受的编码 |
| `Authorization` | 认证信息 |
| `Cookie` | Cookie 数据 |
| `Referer` | 请求来源 |
| `Origin` | 请求源（用于 CORS） |

### 响应头部

| 头部 | 说明 |
|------|------|
| `Content-Type` | 内容类型 |
| `Content-Length` | 内容长度 |
| `Content-Encoding` | 内容编码 |
| `Set-Cookie` | 设置 Cookie |
| `WWW-Authenticate` | 认证挑战 |

### 自定义头部

```http
X-Request-ID: 12345
X-Api-Version: v2
X-Custom-Header: value
```

## HTTPS

HTTP over TLS/HTTPS 通过 SSL/TLS 加密传输：

```
HTTP 数据 → TLS 加密 → TCP 传输
```

```bash
# 生成自签名证书
openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365 -nodes

# Nginx 配置 HTTPS
server {
    listen 443 ssl;
    ssl_certificate cert.pem;
    ssl_certificate_key key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
}
```

## HTTP/2 特性

### 多路复用

```bash
# 一个连接上并行多个请求
Stream 1: ───────────────────────────────
Stream 2: ──────────────────────
Stream 3: ────────────────────────
```

### 头部压缩（HPACK）

```bash
# 使用索引表压缩头部
静态表 + 动态表 + 霍夫曼编码
```

### 服务器推送

```nginx
# Nginx 配置
location / {
    http2_push /style.css;
    http2_push /script.js;
}
```

## HTTP 缓存

### 缓存控制

```http
# 禁止缓存
Cache-Control: no-store

# 必须验证
Cache-Control: no-cache

# 缓存时间
Cache-Control: max-age=3600

# 公共缓存
Cache-Control: public

# 私有缓存
Cache-Control: private
```

### 条件请求

```http
# 带着 If-None-Match
If-None-Match: "etag-value"

# 带 If-Modified-Since
If-Modified-Since: Wed, 21 Oct 2015 07:28:00 GMT
```

### ETag 机制

```python
# Flask 实现 ETag
from flask import Flask, request, make_response

app = Flask(__name__)

@app.route('/api/data')
def get_data():
    data = {"message": "Hello"}
    response = make_response(data)

    # 生成 ETag
    etag = hash(str(data))
    response.headers['ETag'] = f'"{etag}"'

    # 检查 If-None-Match
    if request.headers.get('If-None-Match') == f'"{etag}"':
        return '', 304

    return response
```

## HTTP 长连接与短连接

### 短连接

```python
# 每次请求都创建新连接
# HTTP/1.0 默认
Connection: close
```

### 长连接

```python
# 保持连接复用
# HTTP/1.1 默认
Connection: keep-alive

# 限制
Keep-Alive: timeout=5, max=100
```

## 小结

HTTP 核心要点：

- **请求-响应**：客户端发起请求，服务器返回响应
- **无状态**：每个请求相互独立
- **明文传输**：HTTP/1.x 不加密（使用 HTTPS）
- **幂等性**：GET/PUT/DELETE 幂等，POST/PATCH 非幂等
- **缓存机制**：通过 Cache-Control 和 ETag 控制