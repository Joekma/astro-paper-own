---
title: Redis主从复制
author: 程序员
pubDatetime: 2024-08-13T00:00:00.000+08:00
updated: 2026-04-22T00:00:00.000+08:00
slug: redis-master-slave-replication
description: 'Redis主从复制配置和原理'
tags:
  - Redis
  - 数据库
  - 主从复制
category: 数据库
draft: false
language: zh-CN
---

> Redis 主从复制实现数据冗余。

## 配置

```bash
# 从库配置
replicaof 127.0.0.1 6379
```

## 小结

- **主从复制**：数据同步
- **读写分离**：分担压力
