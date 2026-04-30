---
title: CORS跨域解决方案
author: 程序员
pubDatetime: 2024-08-13T00:00:00.000+08:00
updated: 2026-04-22T00:00:00.000+08:00
slug: cors-cross-origin-solution
description: 'CORS跨域资源共享配置方法'
tags:
  - CORS
  - 跨域
  - 前端
  - Web
category: 网络
draft: false
language: zh-CN
---

> CORS 解决浏览器跨域限制。

## 跨域原因

浏览器同源策略限制跨域请求。

## 解决方案

### 服务端设置

```javascript
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Methods', 'GET,POST')
    res.header('Access-Control-Allow-Headers', 'Content-Type')
    next()
})
```

### Nginx 配置

```nginx
add_header 'Access-Control-Allow-Origin' '*'
```

## 小结

- **CORS**：跨域资源共享
- **Access-Control**：响应头配置
