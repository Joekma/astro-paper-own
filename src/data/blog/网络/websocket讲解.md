---
title: WebSocket详解
author: 程序员
pubDatetime: 2024-08-13T00:00:00.000+08:00
updated: 2026-04-22T00:00:00.000+08:00
slug: websocket-tutorial
description: 'WebSocket协议原理和使用方法'
tags:
  - WebSocket
  - 网络
  - 实时通信
  - Web
category: 网络
draft: false
language: zh-CN
---

> WebSocket 实现双向实时通信。

## 协议握手

```javascript
// 客户端
const ws = new WebSocket('ws://example.com/ws')

ws.onopen = () => {
    ws.send('Hello')
}

ws.onmessage = (event) => {
    console.log(event.data)
}
```

## 对比轮询

| 特性 | HTTP轮询 | WebSocket |
|------|---------|----------|
| **连接** | 每次新建 | 保持连接 |
| **方向** | 客户端发起 | 双向 |
| **实时性** | 延迟高 | 实时 |
| **资源** | 频繁创建销毁 | 长连接 |

## 小结

- **WebSocket**：全双工通信
- **握手升级**：HTTP → WS
