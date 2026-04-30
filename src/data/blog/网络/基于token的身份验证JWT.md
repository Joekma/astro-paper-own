---
title: JWT身份验证
author: 程序员
pubDatetime: 2024-08-13T00:00:00.000+08:00
updated: 2026-04-22T00:00:00.000+08:00
slug: jwt-authentication-tutorial
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

> JWT 是无状态的令牌认证方案。

## JWT 结构

| 部分 | 说明 |
|------|------|
| **Header** | 头部信息 |
| **Payload** | 载荷数据 |
| **Signature** | 签名验证 |

## 使用

```javascript
const jwt = require('jsonwebtoken')

const token = jwt.sign(
    { userId: 1 },
    'secret',
    { expiresIn: '1h' }
)

const decoded = jwt.verify(token, 'secret')
```

## 小结

- **JWT**：无状态认证
- **三部分**：Header.Payload.Signature
- **验证**：服务端解密校验
