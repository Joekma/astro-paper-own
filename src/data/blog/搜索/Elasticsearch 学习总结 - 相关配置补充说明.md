---
title: Elasticsearch配置说明
author: 程序员
pubDatetime: 2024-08-13T00:00:00.000+08:00
updated: 2026-04-22T00:00:00.000+08:00
slug: elasticsearch-configuration
description: 'Elasticsearch配置项说明'
tags:
  - Elasticsearch
  - 搜索
  - 配置
category: 搜索
draft: false
language: zh-CN
---

> Elasticsearch 配置影响性能和行为。

## 重要配置

### cluster.name

```yaml
cluster.name: my-cluster
```

### node.name

```yaml
node.name: node-1
```

### network.host

```yaml
network.host: 0.0.0.0
```

## 小结

- **集群名**：区分不同集群
- **节点名**：标识节点
- **网络配置**：绑定地址
