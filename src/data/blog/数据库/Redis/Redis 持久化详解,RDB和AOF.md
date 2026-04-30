---
title: Redis持久化详解
author: 程序员
pubDatetime: 2024-08-13T00:00:00.000+08:00
updated: 2026-04-22T00:00:00.000+08:00
slug: redis-persistence-rdb-aof
description: 'Redis持久化方案RDB和AOF详解'
tags:
  - Redis
  - 数据库
  - 持久化
category: 数据库
draft: false
language: zh-CN
---

> Redis 持久化保障数据安全。

## RDB

```bash
# 配置文件
save 900 1
save 300 10
save 60 10000
```

## AOF

```bash
appendonly yes
appendfsync everysec
```

## 小结

- **RDB**：定时快照
- **AOF**：追加日志
