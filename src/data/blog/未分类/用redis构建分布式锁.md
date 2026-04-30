---
title: Redis分布式锁
author: 程序员
pubDatetime: 2024-08-13T00:00:00.000+08:00
updated: 2026-04-22T00:00:00.000+08:00
slug: redis-distributed-lock
description: 'Redis实现分布式锁的原理和代码'
tags:
  - Redis
  - 分布式锁
  - 并发
category: 未分类
draft: false
language: zh-CN
---

> 分布式锁保障多节点同步。

## 实现方案

```python
import redis

lock = redis.set('lock', '1', nx=True, ex=10)
if lock:
    # 业务逻辑
    redis.delete('lock')
```

## 小结

- **SET NX**：原子操作
- **过期时间**：防止死锁
