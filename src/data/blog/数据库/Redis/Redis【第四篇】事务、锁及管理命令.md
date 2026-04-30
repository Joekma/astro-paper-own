---
title: Redis事务和锁
author: 程序员
pubDatetime: 2024-08-13T00:00:00.000+08:00
updated: 2026-04-22T00:00:00.000+08:00
slug: redis-transactions-locks
description: 'Redis事务和锁机制，包括MULTI/EXEC和分布式锁'
tags:
  - Redis
  - 数据库
  - 事务
  - 锁
category: 数据库
draft: false
language: zh-CN
---

> Redis 事务和锁保障数据一致性。

## 事务

```bash
MULTI
SET name zhangsan
INCR age
EXEC
```

## 分布式锁

```python
# 获取锁
lock = r.set('lock', '1', nx=True, ex=10)
if lock:
    # 业务逻辑
    r.delete('lock')
```

## 小结

- **事务**：MULTI/EXEC
- **分布式锁**：SET NX EX
