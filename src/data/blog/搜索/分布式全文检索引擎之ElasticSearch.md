---
title: Elasticsearch全文检索引擎
author: 程序员
pubDatetime: 2024-08-13T00:00:00.000+08:00
updated: 2026-04-22T00:00:00.000+08:00
slug: elasticsearch-search-engine
description: 'Elasticsearch全文检索引擎介绍和使用'
tags:
  - Elasticsearch
  - 搜索
  - 全文检索
  - 搜索引擎
category: 搜索
draft: false
language: zh-CN
---

> Elasticsearch 是分布式全文检索引擎。

## 简介

**Elasticsearch** 是一个基于 Lucene 的搜索服务器，提供了分布式多用户能力的全文搜索引擎。

### 主要特点

| 特点 | 说明 |
|------|------|
| **分布式** | 支持集群部署 |
| **全文检索** | 支持复杂查询 |
| **RESTful API** | HTTP 接口 |
| **近实时** | 秒级检索 |

## 安装

```bash
docker run -d --name elasticsearch -p 9200:9200 -p 9300:9300 \
  -e "discovery.type=single-node" \
  elasticsearch:7.17.0
```

## 基本概念

| 概念 | 说明 |
|------|------|
| **索引** | 相当于数据库 |
| **文档** | 相当于记录 |
| **字段** | 相当于列 |
| **分片** | 数据分片存储 |

## 基本操作

### 创建索引

```bash
PUT /my_index
{
    "mappings": {
        "properties": {
            "title": {"type": "text"},
            "content": {"type": "text"},
            "author": {"type": "keyword"}
        }
    }
}
```

### 插入文档

```bash
POST /my_index/_doc/1
{
    "title": "Elasticsearch 入门",
    "content": "Elasticsearch 是强大的搜索引擎",
    "author": "张三"
}
```

### 搜索文档

```bash
GET /my_index/_search
{
    "query": {
        "match": {
            "content": "搜索引擎"
        }
    }
}
```

## 小结

- **Elasticsearch**：分布式全文搜索
- **索引/文档**：核心概念
- **REST API**：方便集成
