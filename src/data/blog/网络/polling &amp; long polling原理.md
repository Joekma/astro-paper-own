---
title: Polling和Long Polling原理
author: 程序员
pubDatetime: 2024-08-13T00:00:00.000+08:00
updated: 2026-04-22T00:00:00.000+08:00
slug: polling-long-polling-principle
description: '轮询和长轮询实现实时通信的原理'
tags:
  - Polling
  - 长轮询
  - WebSocket
  - 实时通信
category: 网络
draft: false
language: zh-CN
---

> 轮询和长轮询是实时通信的基础方案。

## Polling

```javascript
setInterval(() => {
    fetch('/api/status')
        .then(res => res.json())
        .then(data => update(data))
}, 3000)
```

## Long Polling

```javascript
async function longPolling() {
    while (true) {
        const res = await fetch('/api/events')
        const data = await res.json()
        handle(data)
    }
}
```

## 小结

- **Polling**：定时轮询
- **Long Polling**：服务端hold连接
