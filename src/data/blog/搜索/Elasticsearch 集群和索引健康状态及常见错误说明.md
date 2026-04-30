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

> Elasticsearch 集群健康状态是运维监控的重要指标，理解三种状态含义并及时处理异常情况，对保障服务稳定性至关重要。

## 健康状态详解

### 三种健康状态

| 状态 | 颜色 | 含义 | 处理建议 |
|------|------|------|----------|
| **green** | 绿色 | 所有分片正常 | 最佳状态 |
| **yellow** | 黄色 | 主分片正常，副本异常 | 尽快修复 |
| **red** | 红色 | 存在未分配主分片 | 紧急处理 |

### 查看集群健康

```bash
GET /_cluster/health

{
  "cluster_name": "my-cluster",
  "status": "yellow",
  "number_of_nodes": 3,
  "active_shards": 12,
  "unassigned_shards": 3
}
```

### 详细健康检查

```bash
GET /_cluster/health?level=indices
GET /_cluster/health?level=shards
GET /_cluster/health/my_index
```

## 索引状态

### 索引列表

```bash
GET /_cat/indices?v
GET /_cat/indices?v&h=i,shards,docs,store.size,memory
```

### 分片状态

| 状态 | 说明 |
|------|------|
| **STARTED** | 正常启动 |
| **INITIALIZING** | 正在初始化 |
| **RELOCATING** | 正在迁移 |
| **UNASSIGNED** | 未分配 |

```bash
GET /_cat/shards?v
```

## 常见问题处理

### Yellow 状态

```bash
# 减少副本数（临时方案）
PUT /my_index/_settings
{
  "number_of_replicas": 0
}

# 查看未分配原因
GET /_cat/shards?h=index,shard,state,unassigned.reason
```

### Red 状态

```bash
GET /_cluster/allocation/explain
```

常见原因：磁盘空间不足、分片损坏、节点离线。

## 监控脚本

```python
from elasticsearch import Elasticsearch

def check_cluster_health(es_host='localhost:9200'):
    es = Elasticsearch([es_host])
    health = es.cluster.health()
    status = health['status']

    print(f"集群状态: {status}")
    print(f"未分配分片: {health['unassigned_shards']}")

    return status

if __name__ == '__main__':
    check_cluster_health()
```

## 小结

- **green**：最佳状态，无需处理
- **yellow**：注意副本分配
- **red**：紧急处理分片问题
- **预防**：合理配置副本和磁盘 watermark