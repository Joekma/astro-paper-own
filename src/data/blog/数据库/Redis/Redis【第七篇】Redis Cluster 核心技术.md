---
title: Redis Cluster集群
author: 程序员
pubDatetime: 2024-08-13T00:00:00.000+08:00
updated: 2026-04-22T00:00:00.000+08:00
slug: redis-cluster-tutorial
description: 'Redis Cluster集群配置和原理'
tags:
  - Redis
  - 数据库
  - 集群
category: 数据库
draft: false
language: zh-CN
---

> Redis Cluster 实现数据分片和高可用。

## 分片

| 槽位 | 说明 |
|------|------|
| 0-5460 | 节点1 |
| 5461-10922 | 节点2 |
| 10923-16383 | 节点3 |

## 小结

- **16384 槽**：自动分片
- **故障转移**：节点自动切换
