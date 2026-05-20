---
title: Web身份认证：Cookie、Session与Token
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-05-03T00:00:00.000+08:00
slug: web-authentication-cookie-session-token
featured: false
draft: false
tags:
  - Web开发
  - 身份认证
  - Cookie
  - Session
  - Token
  - JWT
description: 'Web身份认证技术详解，包括Cookie、Session、Token原理和JWT实现'
series: python
seriesOrder: 31
language: zh-CN
---

> Web身份认证是Web开发的核心技术，本文详细介绍Cookie、Session、Token的原理和实践。

## 认证技术发展史

### 阶段一：无状态时代

Web早期只是文档浏览，HTTP协议是无状态的，服务器不需要记录谁访问了什么内容。每次请求都是全新的，服务器也"不关心"是谁发的请求。

### 阶段二：Cookie出现

随着交互式Web应用兴起（电商网站、社交平台），需要区分用户。于是出现了Session ID机制：

1. 用户登录后，服务器生成唯一的Session ID
2. 服务器保存`{session_id: user_info}`映射
3. 浏览器通过Cookie存储Session ID
4. 后续请求携带Cookie，服务器识别用户

**问题**：服务器需要存储所有用户的Session，扩展困难

### 阶段三：分布式Session

为了解决单机Session问题，出现了多种方案：

- **Session复制**：多台服务器同步Session数据
- **Session粘性**：用户请求固定到同一台服务器
- **Session集中存储**：使用Memcached/Redis存储Session

这些方案都增加了系统复杂度。

### 阶段四：Token认证

既然Session存储是负担，那就让客户端自己保存！关键点：

1. 服务器生成包含用户信息的Token（可签名防伪造）
2. 客户端存储Token，每次请求携带
3. 服务器验证Token即可，无需存储

这就是JWT的核心思想。

## Cookie详解

### 什么是Cookie

Cookie是服务器生成、浏览器存储的键值对数据，用于在客户端保存状态信息。

### Cookie特点

| 特性 | 说明 |
|------|------|
| **存储位置** | 客户端浏览器 |
| **大小限制** | 单个Cookie最大4KB |
| **生命周期** | 可设置过期时间 |
| **域名限制** | 同源策略限制 |
| **自动携带** | 符合条件自动随请求发送 |

### Cookie工作流程

```
1. 浏览器首次访问服务器
2. 服务器生成Cookie并返回
3. 浏览器保存Cookie到本地
4. 后续请求自动携带Cookie
5. 服务器通过Cookie识别用户
```

### Python/Django设置Cookie

```python
from django.shortcuts import redirect

def login(request):
    # 登录成功后设置Cookie
    response = redirect('/index/')
    response.set_cookie('islogin', True)           # 简单设置
    response.set_cookie('username', 'admin', 3600)  # 带过期时间
    return response

def logout(request):
    response = redirect('/login/')
    response.delete_cookie('islogin')  # 删除Cookie
    return response
```

### 读取Cookie

```python
def index(request):
    is_login = request.COOKIES.get('islogin')
    username = request.COOKIES.get('username')
```

## Session详解

### 什么是Session

Session是服务器端存储的用户会话数据，通过Session ID与客户端关联。

### Session vs Cookie

| 特性 | Cookie | Session |
|------|--------|---------|
| **存储位置** | 客户端 | 服务器端 |
| **安全性** | 较低（明文存储） | 较高（可加密） |
| **存储大小** | 最大4KB | 理论无限制 |
| **性能** | 快（无需服务器操作） | 较慢（需查询） |
| **跨域** | 支持 | 通常不支持 |

### Django Session使用

```python
# 设置Session
def login(request):
    request.session['user_id'] = 123
    request.session['username'] = 'admin'

# 读取Session
def index(request):
    user_id = request.session.get('user_id')
    username = request.session.get('username')

# 删除Session
def logout(request):
    request.session.flush()  # 清空当前会话
    # 或
    del request.session['user_id']  # 删除单个键
```

### Session存储方式

```python
# settings.py

# 数据库存储（默认）
SESSION_ENGINE = 'django.contrib.sessions.backends.db'

# Redis存储（推荐生产环境）
SESSION_ENGINE = 'django.contrib.sessions.backends.cache'
SESSION_CACHE_ALIAS = 'default'

# 混合存储
SESSION_ENGINE = 'django.contrib.sessions.backends.cached_db'
```

## Token认证

### Token优势

| 优势 | 说明 |
|------|------|
| **无状态** | 服务器不存储Token，水平扩展简单 |
| **跨域支持** | 可跨多个域名使用 |
| **移动友好** | 适合移动端和API场景 |
| **CSRF防护** | 不依赖Cookie，避免CSRF攻击 |

### Token认证流程

```
1. 用户登录 → 服务器验证
2. 服务器返回Token给客户端
3. 客户端存储Token（如localStorage）
4. 后续请求在Header携带Token
5. 服务器验证Token，解析用户信息
```

### Token存储选择

```javascript
// localStorage：持久存储，跨页面共享
localStorage.setItem('token', 'xxx')

// sessionStorage：会话级别，窗口关闭清除
sessionStorage.setItem('token', 'xxx')

// HttpOnly Cookie：JavaScript无法访问，更安全（推荐）
// 服务器设置：Set-Cookie: token=xxx; HttpOnly; Secure
```

## JWT详解

### JWT结构

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

| 部分 | 说明 | 内容示例 |
|------|------|----------|
| **Header** | 元数据，包含算法和类型 | `{"alg": "HS256", "typ": "JWT"}` |
| **Payload** | 声明，存储用户信息 | `{"sub": "123", "name": "John"}` |
| **Signature** | 签名，防篡改验证 | HMAC-SHA256签名 |

### JWT声明标准

| 声明 | 说明 |
|------|------|
| **iss** | 签发者 |
| **sub** | 主题（用户ID） |
| **aud** | 受众 |
| **exp** | 过期时间 |
| **nbf** | 生效时间 |
| **iat** | 签发时间 |
| **jti** | 唯一标识 |

### Python生成JWT

```python
import jwt
from datetime import datetime, timedelta, timezone

def create_token(user_id, username):
    payload = {
        'sub': user_id,
        'username': username,
        'iat': datetime.now(timezone.utc),
        'exp': datetime.now(timezone.utc) + timedelta(hours=24)
    }
    return jwt.encode(payload, 'secret_key', algorithm='HS256')

def verify_token(token):
    try:
        return jwt.decode(token, 'secret_key', algorithms=['HS256'])
    except jwt.ExpiredSignatureError:
        return None  # Token已过期
    except jwt.InvalidTokenError:
        return None  # Token无效
```

### Flask+JWT完整示例

```python
from flask import Flask, request, jsonify
import jwt
import datetime

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your_secret_key'

@app.route('/login', methods=['POST'])
def login():
    username = request.json.get('username')
    password = request.json.get('password')

    # 验证用户（实际应查数据库）
    if username == 'admin' and password == '123456':
        token = create_token(1, username)
        return jsonify({'token': token})

    return jsonify({'error': '认证失败'}), 401

@app.route('/protected')
def protected():
    auth = request.headers.get('Authorization')

    if not auth or not auth.startswith('Bearer '):
        return jsonify({'error': '缺少Token'}), 401

    token = auth.split(' ')[1]
    payload = verify_token(token)

    if not payload:
        return jsonify({'error': 'Token无效'}), 401

    return jsonify({'user': payload})

@app.route('/refresh', methods=['POST'])
def refresh():
    old_token = request.json.get('token')
    payload = verify_token(old_token)

    if payload:
        new_token = create_token(payload['sub'], payload['username'])
        return jsonify({'token': new_token})

    return jsonify({'error': '刷新失败'}), 401
```

### 前端请求封装

```javascript
class AuthService {
    constructor() {
        this.token = localStorage.getItem('token');
    }

    setToken(token) {
        this.token = token;
        localStorage.setItem('token', token);
    }

    clearToken() {
        this.token = null;
        localStorage.removeItem('token');
    }

    async request(url, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        const response = await fetch(url, { ...options, headers });
        return response;
    }
}

const auth = new AuthService();

// 使用
await auth.request('/api/user', { method: 'GET' });
```

## 安全最佳实践

### 防御措施

| 措施 | 说明 |
|------|------|
| **HTTPS** | 所有请求使用HTTPS |
| **HttpOnly Cookie** | 禁止JavaScript访问敏感Cookie |
| **Secure属性** | Cookie仅在HTTPS发送 |
| **SameSite** | 防止CSRF攻击 |
| **Token过期** | 设置合理的过期时间 |
| **Token刷新** | 定期刷新Token |

### 敏感操作验证

```python
def sensitive_operation_required(func):
    def wrapper(*args, **kwargs):
        token = request.headers.get('Authorization')
        payload = verify_token(token)

        # 敏感操作需要验证密码
        if not verify_password(payload['sub'], request.json.get('password')):
            return jsonify({'error': '身份验证失败'}), 403

        return func(*args, **kwargs)
    return wrapper
```

## 总结对比

| 技术 | 存储位置 | 安全性 | 适用场景 |
|------|----------|--------|----------|
| **Cookie** | 客户端 | 中 | 非敏感数据、本地存储 |
| **Session** | 服务器 | 高 | 登录状态、敏感数据 |
| **Token** | 客户端 | 高 | API认证、跨域场景 |
| **JWT** | 客户端 | 高 | 微服务、无状态认证 |

| 特性 | Cookie | Session | Token/JWT |
|------|--------|---------|-----------|
| **状态管理** | 客户端 | 服务端 | 无状态 |
| **扩展性** | 好 | 需额外处理 | 最好 |
| **跨域** | 受限 | 受限 | 支持 |
| **移动端** | 一般 | 一般 | 最好 |
