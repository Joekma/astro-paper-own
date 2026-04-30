---
title: HTTPS协议浅析
author: 程序员
pubDatetime: 2024-08-13T00:00:00.000+08:00
updated: 2026-04-22T00:00:00.000+08:00
slug: https-protocol-analysis
description: 'HTTPS协议原理，SSL/TLS加密机制'
tags:
  - HTTPS
  - SSL
  - TLS
  - 安全
category: 网络
draft: false
language: zh-CN
---

> HTTPS 通过 TLS 加密传输数据。

## SSL/TLS 握手

| 步骤 | 说明 |
|------|------|
| ClientHello | 客户端问候 |
| ServerHello | 服务端证书 |
| 密钥交换 | 协商密钥 |
| 加密通信 | 安全传输 |

## 证书类型

| 类型 | 说明 |
|------|------|
| **DV** | 域名验证 |
| **OV** | 组织验证 |
| **EV** | 扩展验证 |

## 自签名证书

```bash
openssl req -x509 -newkey rsa:2048 -nodes -keyout key.pem -out cert.pem -days 365
```

## 小结

- **HTTPS**：加密传输
- **TLS握手**：协商密钥
- **证书类型**：DV/OV/EV
