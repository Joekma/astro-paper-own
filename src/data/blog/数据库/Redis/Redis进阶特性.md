---
title: Redis进阶特性
author: 程序员
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-04-22T00:00:00.000+08:00
slug: redis-advanced-features
featured: false
draft: false
tags:
  - Redis
  - 数据库
  - NoSQL
description: 'Redis进阶特性，包括管道、事务、Lua脚本等'
---

> Redis 进阶特性提升性能和功能。

## 管道

```bash
redis-cli --pipe < commands.txt
```

## 事务

```bash
MULTI
SET name zhangsan
GET name
EXEC
```

## 小结

- **管道**：批量执行
- **事务**：原子操作
