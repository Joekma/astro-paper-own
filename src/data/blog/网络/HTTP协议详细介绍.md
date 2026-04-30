---
title: HTTP协议详细介绍
author: 程序员
pubDatetime: 2024-08-13T00:00:00.000+08:00
updated: 2026-04-22T00:00:00.000+08:00
slug: http-protocol-detailed-intro
description: 'HTTP协议详解，包括请求方法、状态码、头部字段等'
tags:
  - HTTP
  - 网络
  - 协议
  - Web
category: 网络
draft: false
language: zh-CN
---

> HTTP 是 Web 通信的基础协议。

## 请求方法

| 方法 | 说明 |
|------|------|
| **GET** | 获取资源 |
| **POST** | 提交数据 |
| **PUT** | 更新资源 |
| **DELETE** | 删除资源 |
| **PATCH** | 部分更新 |

## 状态码

| 状态码 | 说明 |
|--------|------|
| **200** | 成功 |
| **301/302** | 重定向 |
| **404** | 未找到 |
| **500** | 服务器错误 |

## 请求头

```http
GET /index.html HTTP/1.1
Host: example.com
User-Agent: Mozilla/5.0
Accept: text/html
Cookie: session=abc123
```

## 小结

- **HTTP** 协议是 Web 基础
- **方法** GET/POST/PUT/DELETE
- **状态码** 1xx-5xx
