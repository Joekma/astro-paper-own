---
title: Elasticsearch集群健康和索引状态
author: 程序员
pubDatetime: 2024-08-13T00:00:00.000+08:00
updated: 2026-04-22T00:00:00.000+08:00
slug: elasticsearch-cluster-health
description: 'Elasticsearch集群健康状态和索引管理'
tags:
  - Elasticsearch
  - 搜索
  - 集群
  - 运维
category: 搜索
draft: false
language: zh-CN
---

> Elasticsearch 集群健康状态指示集群运行状况。

## 健康状态

| 状态 | 颜色 | 说明 |
|------|------|------|
| **green** | 绿色 | 所有分片正常 |
| **yellow** | 黄色 | 主分片正常，副本异常 |
| **red** | 红色 | 主分片异常 |

## 查看健康

```bash
GET _cluster/health
GET _cluster/health?level=indices
```

## 索引状态

```bash
GET _cat/indices?v
```

## 小结

- **green**：最理想状态
- **yellow**：注意副本
- **red**：紧急处理
