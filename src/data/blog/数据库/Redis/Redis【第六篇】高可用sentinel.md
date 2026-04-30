---
title: Redis高可用Sentinel
author: 程序员
pubDatetime: 2024-08-13T00:00:00.000+08:00
updated: 2026-04-22T00:00:00.000+08:00
slug: redis-sentinel-tutorial
description: 'Redis Sentinel高可用方案，包括主从切换和故障转移'
tags:
  - Redis
  - 数据库
  - 高可用
  - Sentinel
category: 数据库
draft: false
language: zh-CN
---

> Sentinel 实现 Redis 高可用。

## 架构

| 组件 | 说明 |
|------|------|
| **Master** | 主节点 |
| **Slave** | 从节点 |
| **Sentinel** | 监控和故障转移 |

## 配置

```bash
sentinel monitor mymaster 127.0.0.1 6379 2
sentinel down-after-milliseconds mymaster 5000
```

## 小结

- **Sentinel**：自动故障转移
- **主从**：数据同步
