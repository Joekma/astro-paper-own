---
title: MongoDB 索引优化与爬虫数据去重
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-04-22T00:00:00.000+08:00
slug: mongodb-indexes-and-deduplication
featured: false
draft: false
series: 爬虫
seriesOrder: 2
tags:
  - MongoDB
  - 数据库
  - 索引优化
  - 数据去重
  - Redis
  - 布隆过滤器
  - Python爬虫
  - 性能优化
description: 'MongoDB高级特性，深入讲解索引优化策略、爬虫数据去重技术、Redis和布隆过滤器的应用，以及数据库性能调优技巧。'
---

> MongoDB 是爬虫项目中常用的数据存储方案，本文介绍索引创建和爬虫数据去重方法。

## 索引

### 索引的作用

**索引可以显著提升查询速度**。在大量数据场景下，建立合适的索引至关重要。

### 创建索引

```javascript
// 插入测试数据
for (i = 0; i < 100000; i++) {
    db.t1.insert({name: 'test' + i, age: i})
}

// 查看查询计划
db.t1.find({name: 'test100000'}).explain('executionStats')

// 创建索引（1升序，-1降序）
db.t1.ensureIndex({name: 1})

// 再次查看查询计划
db.t1.find({name: 'test100000'}).explain('executionStats')
```

### 索引类型

| 类型 | 语法 | 说明 |
|------|------|------|
| **普通索引** | `db.t1.ensureIndex({name: 1})` | 基础索引 |
| **唯一索引** | `db.t1.ensureIndex({name: 1}, {unique: true})` | 值唯一 |
| **复合索引** | `db.t1.ensureIndex({name: 1, age: 1})` | 多字段索引 |

### 索引管理

```javascript
// 查看所有索引
db.t1.getIndexes()

// 删除索引
db.t1.dropIndex('索引名称')
```

## 数据库对比

| 特性 | MySQL | MongoDB | Redis |
|------|-------|---------|-------|
| **类型** | 关系型 | 文档型 | 键值型 |
| **事务** | 支持 | 不支持 | 不支持 |
| **速度** | 中等 | 快 | 最快 |
| **适用场景** | 关联查询 | 海量非结构化数据 | 缓存、去重 |

### 选择建议

- **数据量大、字段不固定** → MongoDB
- **需要关联查询** → MySQL
- **高频访问数据、去重** → Redis

## 爬虫数据去重

### URL 去重

#### 使用 Redis 集合

```python
import redis

r = redis.Redis(host='localhost', port=6379, db=0)

def is_url_crawled(url):
    """检查 URL 是否已爬取"""
    return r.sismember('visited_urls', url)

def add_url_to_crawl(url):
    """添加 URL 到待爬队列"""
    r.sadd('visited_urls', url)
```

#### 使用布隆过滤器

```python
from pybloom_live import BloomFilter

bf = BloomFilter(capacity=1000000, error_rate=0.001)

def is_url_crawled(url):
    """布隆过滤器检查"""
    return url in bf

def add_url_to_crawl(url):
    """添加 URL"""
    bf.add(url)
```

### 数据去重

```python
import hashlib
import redis

r = redis.Redis(host='localhost', port=6379, db=0)

def is_data_exists(data):
    """根据关键字段去重"""
    # 提取关键字段
    key_fields = f"{data['title']}_{data['author']}"
    # MD5 加密
    hash_key = hashlib.md5(key_fields.encode()).hexdigest()
    # 检查是否存在
    return r.sismember('data_hashes', hash_key)

def add_data(data):
    """添加数据"""
    key_fields = f"{data['title']}_{data['author']}"
    hash_key = hashlib.md5(key_fields.encode()).hexdigest()
    r.sadd('data_hashes', hash_key)
```

## 小结

- **索引**：提升查询性能，根据查询条件创建合适索引
- **去重**：Redis 集合适合 URL 去重，布隆过滤器适合海量数据去重
- **数据库选择**：根据数据类型和查询需求选择合适的存储方案
