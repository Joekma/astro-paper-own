---
title: Redis消息队列
author: 程序员
pubDatetime: 2024-08-13T00:00:00.000+08:00
updated: 2026-04-22T00:00:00.000+08:00
slug: redis-message-queue
description: 'Redis实现消息队列，包括List和Stream'
tags:
  - Redis
  - 数据库
  - 消息队列
category: 数据库
draft: false
language: zh-CN
---

> Redis List 实现消息队列。

## List 实现

```python
# 生产者
r.lpush('queue', 'message')

# 消费者
r.brpop('queue', 0)
```

## 小结

- **LPUSH/RPOP**：队列操作
- **BRPOP**：阻塞获取
