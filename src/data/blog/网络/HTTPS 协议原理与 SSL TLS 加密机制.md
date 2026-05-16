---
title: HTTPS 协议原理与 SSL/TLS 加密机制
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-04-22T00:00:00.000+08:00
slug: https-protocol-analysis
description: 'HTTPS协议原理和SSL/TLS加密机制。'
tags:
  - HTTPS
  - SSL
  - TLS
  - 安全
draft: false
series: 网络
language: zh-CN
---

## 概述

HTTPS（HTTP Secure）是 HTTP 的安全版本，通过 TLS/SSL 协议对通信进行加密，确保数据传输的安全性。

## HTTP vs HTTPS

| 特性 | HTTP | HTTPS |
|------|------|-------|
| 端口 | 80 | 443 |
| 加密 | 无 | TLS/SSL 加密 |
| 验证 | 无 | 证书验证 |
| 性能 | 略高 | 略有开销 |
| SEO | 一般 | 优先收录 |
| 支付 | 不可用 | 必须使用 |

## SSL/TLS 握手过程

```
┌────────┐                      ┌────────┐                      ┌────────┐
│  客户端  │                      │  服务器  │                      │   CA   │
└───┬────┘                      └───┬────┘                      └───┬────┘
    │                                │                                │
    │──── ClientHello ─────────────▶│                                │
    │                                │                                │
    │◀─── ServerHello ──────────────│                                │
    │◀─── Certificate ─────────────│                                │
    │◀─── ServerKeyExchange ────────│                                │
    │                                │                                │
    │──── ClientKeyExchange ────────▶│                                │
    │──── ChangeCipherSpec ─────────▶│                                │
    │──── Finished ─────────────────▶│                                │
    │                                │                                │
    │◀─── ChangeCipherSpec ─────────│                                │
    │◀─── Finished ─────────────────│                                │
    │                                │                                │
    │════════ 加密通信开始 ═════════│                                │
    │                                │                                │
```

### 握手步骤详解

| 步骤 | 客户端 | 服务器 |
|------|--------|--------|
| 1 | ClientHello（支持的协议版本、加密套件） | - |
| 2 | - | ServerHello（选定协议版本和加密套件） |
| 3 | - | Certificate（发送证书） |
| 4 | - | ServerKeyExchange（DH 参数等） |
| 5 | 验证证书（检查 CA 签名、有效期等） | - |
| 6 | ClientKeyExchange（发送预主密钥） | - |
| 7 | ChangeCipherSpec（加密方式切换） | - |
| 8 | Finished（加密握手消息摘要） | - |
| 9 | - | ChangeCipherSpec |
| 10 | - | Finished |
| 11 | 加密通信开始 | 加密通信开始 |

## 加密算法

### 对称加密

```python
# AES-GCM 示例
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

key = AESGCM.generate_key(bit_length=256)
aesgcm = AESGCM(key)

nonce = os.urandom(12)  # 96 位随机数
ciphertext = aesgcm.encrypt(nonce, b"Hello, World!", None)
```

### 非对称加密

```python
# RSA 密钥生成
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization

private_key = rsa.generate_private_key(
    public_exponent=65537,
    key_size=2048
)

public_key = private_key.public_key()

# 导出
private_pem = private_key.private_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PrivateFormat.PKCS8
)

public_pem = public_key.public_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PublicFormat.SubjectPublicKeyInfo
)
```

### 混合加密

```python
# TLS 使用的混合加密方式
# 1. 使用非对称加密交换会话密钥
# 2. 使用对称加密传输实际数据

def tls_encrypt(data, public_key):
    # 生成会话密钥
    session_key = os.urandom(32)

    # 用公钥加密会话密钥
    encrypted_key = public_key.encrypt(
        session_key,
        padding.OAEP(
            mgf=padding.MGF1(algorithm=hashes.SHA256()),
            algorithm=hashes.SHA256(),
            label=None
        )
    )

    # 用会话密钥加密数据
    cipher = AESGCM(session_key)
    nonce = os.urandom(12)
    encrypted_data = cipher.encrypt(nonce, data, None)

    return encrypted_key, nonce, encrypted_data
```

## 证书

### 证书类型

| 类型 | 验证级别 | 用途 |
|------|----------|------|
| **DV** | 域名验证 | 个人网站 |
| **OV** | 组织验证 | 企业网站 |
| **EV** | 扩展验证 | 金融、电商 |

### 自签名证书

```bash
# 生成私钥和证书
openssl req -x509 -newkey rsa:2048 \
  -keyout key.pem -out cert.pem \
  -days 365 -nodes \
  -subj "/C=CN/ST=Beijing/L=Beijing/O=MyOrg/OU=MyUnit/CN=example.com"

# 查看证书
openssl x509 -in cert.pem -text -noout

# 验证证书
openssl verify -CAfile cert.pem cert.pem
```

### Let's Encrypt

```bash
# 使用 certbot 获取证书
certbot certonly --webroot -w /var/www/html -d example.com -d www.example.com

# 证书位置
/etc/letsencrypt/live/example.com/fullchain.pem
/etc/letsencrypt/live/example.com/privkey.pem

# 自动续期
crontab -e
0 0 * * * certbot renew --quiet
```

## Nginx HTTPS 配置

```nginx
server {
    listen 443 ssl http2;
    server_name example.com;

    # 证书
    ssl_certificate /etc/ssl/certs/example.com.crt;
    ssl_certificate_key /etc/ssl/private/example.com.key;

    # SSL 版本
    ssl_protocols TLSv1.2 TLSv1.3;

    # 加密套件
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers on;

    # HSTS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # SSL 会话
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    location / {
        root /var/www/html;
        index index.html;
    }
}

# HTTP 重定向到 HTTPS
server {
    listen 80;
    server_name example.com;
    return 301 https://$server_name$request_uri;
}
```

## 证书链验证

```python
from cryptography import x509
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import hashes
import requests

def verify_certificate_chain(cert_file):
    # 加载证书
    with open(cert_file, 'rb') as f:
        cert = x509.load_pem_x509_certificate(f.read(), default_backend())

    # 获取证书链
    cert_chain = []

    # 验证签名
    issuer = cert.issuer
    subject = cert.subject

    # 检查证书有效期
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc)

    if not (cert.not_valid_before_utc <= now <= cert.not_valid_after_utc):
        raise ValueError("证书已过期")

    # 获取证书扩展
    for ext in cert.extensions:
        if isinstance(ext, x509.SubjectAlternativeName):
            print(f"DNS Names: {ext.value}")

def fetch_https_headers(url):
    response = requests.get(url, verify=True)
    print(f"证书信息: {response.cert}")
```

## HTTP 严格传输安全（HSTS）

```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

| 参数 | 说明 |
|------|------|
| **max-age** | HSTS 策略有效期 |
| **includeSubDomains** | 包含子域名 |
| **preload** | 提交到 HSTS Preload List |

## HTTPS 性能优化

### Session Resumption

```nginx
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 1d;
ssl_session_tickets on;
ssl_session_ticket_key /path/to/ticket.key;
```

### OCSP Stapling

```nginx
ssl_stapling on;
ssl_stapling_verify on;
resolver 8.8.8.8 8.8.4.4 valid=300s;
resolver_timeout 5s;
ssl_trusted_certificate /path/to/ca-bundle.crt;
```

### 硬件加速

```nginx
ssl_engine aesni;  # 使用 CPU AES 指令集
```

## 安全检查

### SSL Labs 测试

```bash
# 查看 SSL 配置
openssl s_client -connect example.com:443 -tls1_2

# 检查证书链
openssl s_client -connect example.com:443 -showcerts

# 检查支持协议
openssl s_client -connect example.com:443 -ssl2
openssl s_client -connect example.com:443 -ssl3
openssl s_client -connect example.com:443 -tls1
openssl s_client -connect example.com:443 -tls1_1

# 检查加密套件
openssl s_client -connect example.com:443 -cipher 'ALL:!ADH:!EXPORT:!SSLv2'
```

### 常用命令

```bash
# 检查证书过期
echo | openssl s_client -connect example.com:443 2>/dev/null | openssl x509 -noout -dates

# 检查证书链
echo | openssl s_client -connect example.com:443 -showcerts 2>/dev/null | grep "Certificate chain"

# 导出证书
echo | openssl s_client -connect example.com:443 2>/dev/null | openssl x509 > cert.pem
```

## 小结

HTTPS 核心要点：

- **TLS 握手**：协商加密算法、交换密钥
- **混合加密**：非对称加密交换密钥，对称加密传输数据
- **证书验证**：确保服务器身份可信
- **HSTS**：强制使用 HTTPS
- **性能优化**：Session 复用、OCSP Stapling

> 相关阅读：
> - [HTTP 协议：请求方法、状态码、头部字段](/网络/HTTP-协议：请求方法、状态码、头部字段) - HTTP 基础
> - [HTTP/3 与 QUIC 协议](/网络/HTTP3-与-QUIC-协议) - HTTP 最新版本
> - [对称加密与非对称加密算法原理](/网络/对称加密与非对称加密算法原理) - 加密算法详解
> - [TCP/IP 协议栈概述](/网络/TCP-IP-协议栈概述) - 协议栈基础