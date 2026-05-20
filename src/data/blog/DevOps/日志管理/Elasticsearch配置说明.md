---
title: Elasticsearch 配置说明
series: Elasticsearch
seriesOrder: 4
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-05-17T00:00:00.000+08:00
slug: elasticsearch-configuration
description: '梳理 Elasticsearch 集群、节点角色、索引模板、JVM、系统参数和网络配置的关键项与生产建议。'
tags:
  - DevOps
  - Elasticsearch
  - 搜索
  - 配置
draft: false
language: zh-CN
---

> Elasticsearch 的配置分为 JVM 配置、系统配置和索引配置，合理配置对性能至关重要。本文详细介绍各配置项及其最佳实践。

## 配置思路

配置 Elasticsearch 时先分清三类目标：集群能稳定发现和选主，节点能承载预期角色，索引能匹配数据量和查询方式。不要只复制配置模板，应该把每个参数和实际场景绑定起来。

## 集群配置

### elasticsearch.yml 基础配置

```yaml
cluster.name: my-cluster
node.name: node-1
node.master: true
node.data: true
node.ingest: true
node.attr.box_type: hot
network.host: 0.0.0.0
http.port: 9200
transport.tcp.port: 9300
discovery.seed_hosts:
  - 192.168.1.10:9300
  - 192.168.1.11:9300
  - 192.168.1.12:9300
cluster.initial_master_nodes:
  - node-1
  - node-2
  - node-3
```

### 集群级别配置

```yaml
cluster.routing.allocation.same_shard.host: true
cluster.routing.allocation.enable: all
cluster.routing.rebalance.enable: all
indices.recovery.max_bytes_per_sec: 100mb
breaker.fielddata.limit: 40%
breaker.request.limit: 60%
breaker.total.limit: 70%
```

## 节点配置

### 节点类型

| 类型 | master | data | ingest | 适用场景 |
|------|--------|------|--------|----------|
| 主节点 | ✓ | - | - | 集群管理 |
| 数据节点 | - | ✓ | - | 数据存储 |
| 协调节点 | - | - | - | 请求路由 |
| 热节点 | - | ✓ | - | 实时数据 |
| 冷节点 | - | ✓ | - | 历史数据 |

```yaml
node.master: true
node.data: false
node.ingest: false
```

### 节点内存配置

```yaml
node.store.memory.load_type: mmapfs
bootstrap.memory_lock: true
```

## 索引配置

### 索引设置

```yaml
index.number_of_shards: 3
index.number_of_replicas: 1
index.analysis.analyzer.default.type: ik_max_word
index.refresh_interval: 1s
index.max_result_window: 10000
index.merge.policy.max_merges_at_once: 10
index.merge.policy.segments_per_tier: 10
```

### 索引模板

```bash
PUT /_template/my_template
{
  "index_patterns": ["my-*"],
  "settings": {
    "number_of_shards": 3,
    "number_of_replicas": 1
  }
}
```

## JVM 配置

### 堆内存配置

```bash
-Xms2g
-Xmx2g
-XX:NewSize=512m
-XX:MaxNewSize=512m
-XX:+UseG1GC
-XX:MaxGCPauseMillis=200
-XX:MetaspaceSize=256m
```

### 生产环境建议

```bash
-Xms8g
-Xmx8g
-XX:+UseG1GC
-XX:MaxGCPauseMillis=200
-XX:+AlwaysPreTouch
```

## 系统配置

### Linux 系统参数

```bash
# /etc/security/limits.conf
elasticsearch - nofile 65536
elasticsearch - nproc 2048
elasticsearch - memlock unlimited

# /etc/sysctl.conf
vm.max_map_count=262144
vm.swappiness=1
```

```bash
sysctl -w vm.max_map_count=262144
sysctl -w vm.swappiness=1
```

### 网络配置

```yaml
transport.tcp.compress: true
transport.tcp.connect_timeout: 30s
http.max_content_length: 200mb
http.cors.enabled: true
http.cors.allow-origin: "*"
```

## 配置速查表

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| `cluster.name` | elasticsearch | 集群名称 |
| `node.name` | 主机名 | 节点名称 |
| `network.host` | 127.0.0.1 | 绑定地址 |
| `http.port` | 9200 | HTTP 端口 |
| `number_of_shards` | 1 | 主分片数 |
| `number_of_replicas` | 1 | 副本数 |

## 小结

- **集群名称**：区分不同集群
- **节点角色**：根据需求选择节点类型
- **JVM 内存**：不超过 32GB，使用 G1 GC
- **系统参数**：调整文件描述符、内存锁定
- **索引设置**：根据数据量调整分片副本

变更生产配置前，先在测试集群验证启动、滚动重启、分片迁移和查询性能。涉及分片数量、节点角色、网络绑定和安全配置的调整，应提前准备回滚方案。
