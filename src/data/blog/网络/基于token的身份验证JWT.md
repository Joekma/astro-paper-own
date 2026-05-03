---
title: JWT身份验证
author: 程序员
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-04-22T00:00:00.000+08:00
slug: jwt-authentication
description: 'JWT（JSON Web Token）身份验证原理和使用'
tags:
  - JWT
  - 身份验证
  - 安全
  - Web
category: 网络
draft: false
language: zh-CN
---

## 概述

JWT（JSON Web Token）是一种用于身份验证和授权的开放标准，采用 JSON 格式传输，具有自包含、可验证的特点。

## JWT 结构

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

| 部分 | 说明 | 示例 |
|------|------|------|
| **Header** | Token 类型和算法 | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9` |
| **Payload** | 声明和用户信息 | `eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIi...` |
| **Signature** | 签名验证 | `SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c` |

### Header 解码示例

```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

### Payload 声明类型

| 声明 | 说明 |
|------|------|
| **iss** | 签发者（Issuer） |
| **sub** | 主题（Subject） |
| **aud** | 受众（Audience） |
| **exp** | 过期时间（Expiration） |
| **nbf** | 生效时间（Not Before） |
| **iat** | 签发时间（Issued At） |
| **jti** | JWT 唯一标识 |

## Python 实现

### 生成 Token

```python
import jwt
import datetime

def create_token(user_id, username):
    payload = {
        'sub': user_id,
        'username': username,
        'iat': datetime.datetime.utcnow(),
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    }

    token = jwt.encode(
        payload,
        'secret_key',
        algorithm='HS256'
    )

    return token

# 使用
token = create_token(123, 'zhangsan')
print(token)
```

### 验证 Token

```python
def verify_token(token):
    try:
        payload = jwt.decode(
            token,
            'secret_key',
            algorithms=['HS256']
        )
        return payload
    except jwt.ExpiredSignatureError:
        return 'Token 已过期'
    except jwt.InvalidTokenError:
        return '无效 Token'

# 使用
payload = verify_token(token)
print(payload)
```

### 刷新 Token

```python
def refresh_token(refresh_token):
    try:
        payload = jwt.decode(
            refresh_token,
            'refresh_secret',
            algorithms=['HS256']
        )

        # 生成新的 access_token
        new_payload = {
            'sub': payload['sub'],
            'username': payload['username'],
            'iat': datetime.datetime.utcnow(),
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=1)
        }

        return jwt.encode(new_payload, 'secret_key', algorithm='HS256')

    except jwt.InvalidTokenError:
        return None
```

## Flask 应用

```python
from flask import Flask, request, jsonify
import jwt
import datetime

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your_secret_key'
app.config['REFRESH_SECRET_KEY'] = 'refresh_secret_key'

# 登录接口
@app.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    # 验证用户（实际场景从数据库验证）
    if username == 'admin' and password == '123456':
        access_token = create_token(1, username)
        refresh_token = create_refresh_token(username)

        return jsonify({
            'access_token': access_token,
            'refresh_token': refresh_token
        })

    return jsonify({'error': '用户名或密码错误'}), 401

# 受保护的接口
@app.route('/protected')
def protected():
    auth_header = request.headers.get('Authorization')

    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'error': '缺少 Token'}), 401

    token = auth_header.split(' ')[1]
    payload = verify_token(token)

    if isinstance(payload, str):
        return jsonify({'error': payload}), 401

    return jsonify({
        'message': '访问成功',
        'user': payload
    })

# 刷新 Token
@app.route('/refresh', methods=['POST'])
def refresh():
    data = request.json
    refresh_token = data.get('refresh_token')

    new_token = refresh_access_token(refresh_token)
    if new_token:
        return jsonify({'access_token': new_token})

    return jsonify({'error': '无效的刷新令牌'}), 401
```

## 前端使用

### JavaScript 请求封装

```javascript
class AuthService {
    constructor() {
        this.accessToken = localStorage.getItem('access_token');
        this.refreshToken = localStorage.getItem('refresh_token');
    }

    async login(username, password) {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            this.accessToken = data.access_token;
            this.refreshToken = data.refresh_token;
            localStorage.setItem('access_token', this.accessToken);
            localStorage.setItem('refresh_token', this.refreshToken);
            return true;
        }

        return false;
    }

    async request(url, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (this.accessToken) {
            headers['Authorization'] = `Bearer ${this.accessToken}`;
        }

        let response = await fetch(url, { ...options, headers });

        if (response.status === 401 && this.refreshToken) {
            const newToken = await this.refresh();
            if (newToken) {
                headers['Authorization'] = `Bearer ${newToken}`;
                response = await fetch(url, { ...options, headers });
            }
        }

        return response;
    }

    async refresh() {
        const response = await fetch('/api/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: this.refreshToken })
        });

        if (response.ok) {
            const data = await response.json();
            this.accessToken = data.access_token;
            localStorage.setItem('access_token', this.accessToken);
            return this.accessToken;
        }

        this.logout();
        return null;
    }

    logout() {
        this.accessToken = null;
        this.refreshToken = null;
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
    }
}

const auth = new AuthService();
```

### React 使用示例

```javascript
import React, { useState, useEffect } from 'react';

function ProtectedComponent() {
    const [user, setUser] = useState(null);

    useEffect(() => {
        fetch('/api/protected', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            }
        })
        .then(res => res.json())
        .then(data => setUser(data.user))
        .catch(err => console.error(err));
    }, []);

    if (!user) return <div>加载中...</div>;

    return <div>欢迎, {user.username}</div>;
}
```

## Token 安全策略

### 存储安全

```javascript
// 不要在 localStorage 存储敏感信息
// 使用 HttpOnly Cookie 存储 Token

// 设置 Cookie
function setCookie(name, value, days) {
    const expires = new Date();
    expires.setDate(expires.getDate() + days);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
}

// 读取 Cookie
function getCookie(name) {
    const nameEQ = name + '=';
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}
```

### Token 黑名单

```python
import redis

class TokenBlacklist:
    def __init__(self):
        self.redis = redis.Redis()

    def add(self, jti, exp):
        ttl = exp - int(time.time())
        if ttl > 0:
            self.redis.setex(f'blacklist:{jti}', ttl, '1')

    def is_blacklisted(self, jti):
        return self.redis.exists(f'blacklist:{jti}')

# 使用
def verify_token_with_blacklist(token):
    payload = jwt.decode(token, 'secret_key', algorithms=['HS256'])

    if token_blacklist.is_blacklisted(payload['jti']):
        raise jwt.InvalidTokenError('Token 已被吊销')

    return payload
```

### 敏感操作验证

```python
def sensitive_operation_required(func):
    def wrapper(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        token = auth_header.split(' ')[1]
        payload = verify_token(token)

        # 检查是否需要重新验证密码
        if payload.get('need_password_verified'):
            password = request.json.get('password')
            if not verify_password(payload['sub'], password):
                return jsonify({'error': '密码验证失败'}), 403

        return func(*args, **kwargs)

    return wrapper

@app.route('/change-password')
@sensitive_operation_required
def change_password():
    # 敏感操作
    pass
```

## 常见问题

### Token 过期处理

```python
# 自定义异常处理
@app.errorhandler(jwt.ExpiredSignatureError)
def handle_expired_signature(e):
    return jsonify({'error': 'Token 已过期', 'code': 'TOKEN_EXPIRED'}), 401

@app.errorhandler(jwt.InvalidTokenError)
def handle_invalid_token(e):
    return jsonify({'error': '无效 Token', 'code': 'TOKEN_INVALID'}), 401
```

### 多服务器共享密钥

```python
# 使用 RSA 非对称加密
# 签名用私钥，验证用公钥

# 生成密钥对
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa

private_key = rsa.generate_private_key(
    public_exponent=65537,
    key_size=2048
)

public_key = private_key.public_key()

# 签发
payload = {...}
token = jwt.encode(payload, private_key, algorithm='RS256')

# 验证
decoded = jwt.decode(token, public_key, algorithms=['RS256'])
```

### Token 撤销

```python
# 基于版本号的撤销方案
def create_token_with_version(user_id, version):
    payload = {
        'sub': user_id,
        'version': version,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    }
    return jwt.encode(payload, 'secret_key', algorithm='HS256')

# 撤销时增加版本号
def revoke_user_tokens(user_id, db):
    current_version = db.get_user_version(user_id)
    db.set_user_version(user_id, current_version + 1)

# 验证时检查版本
def verify_token_with_version(token, db):
    payload = jwt.decode(token, 'secret_key', algorithms=['HS256'])

    current_version = db.get_user_version(payload['sub'])
    if payload['version'] < current_version:
        raise jwt.InvalidTokenError('Token 已被撤销')
```

## 小结

JWT 核心要点：

- **无状态验证**：服务器无需存储 Token
- **自包含**：Token 包含用户信息
- **跨域认证**：适合分布式系统
- **安全存储**：敏感信息不要放 Payload
- **Token 刷新**：使用 Refresh Token 机制
- **黑名单机制**：实现 Token 撤销