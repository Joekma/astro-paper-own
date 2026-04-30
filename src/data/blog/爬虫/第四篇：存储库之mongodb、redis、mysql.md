---
title: 第四篇：存储库之MongoDB、Redis、MySQL
author: 程序员
pubDatetime: 2024-08-13T00:00:00.000+08:00
updated: 2026-04-22T00:00:00.000+08:00
slug: python-scraping-data-storage
description: '爬虫数据存储方案，包括MongoDB、Redis和MySQL的使用'
tags:
  - Python
  - 爬虫
  - 数据库
  - MongoDB
  - Redis
  - MySQL
category: 爬虫
draft: false
language: zh-CN
---

> 在爬虫程序中，获取到数据后需要将数据存储起来。根据数据类型和访问频率选择合适的存储方案。

## 存储方案选择

| 数据类型 | 推荐存储 | 原因 |
|---------|---------|------|
| 海量非结构化数据 | MongoDB | 无 schema，文档存储 |
| 高频访问热点数据 | Redis | 内存数据库，读写性能高 |
| 需要关联查询的结构化数据 | MySQL | 关系型数据库，支持 SQL |

## MongoDB

### 简介

**MongoDB** 是一个基于文档的非关系型数据库，使用 JSON 格式存储数据。

**特点**：
- **无 schema**：不需要预先定义表结构
- **高性能**：支持索引，读写性能优异
- **高可用**：支持副本集和分片集群
- **易扩展**：水平扩展能力强

### 安装

```bash
# Ubuntu/Debian
sudo apt-get install -y mongodb

# Python 驱动
pip install pymongo
```

### 基本操作

```python
from pymongo import MongoClient

# 连接数据库
client = MongoClient('mongodb://localhost:27017/')
db = client['spider']
collection = db['articles']

# 插入单条数据
article = {
    'title': 'Python 爬虫入门',
    'author': '张三',
    'content': '入门教程',
    'tags': ['Python', '爬虫'],
    'views': 1000
}
result = collection.insert_one(article)
print(f"插入的文档 ID: {result.inserted_id}")

# 插入多条数据
articles = [
    {'title': '文章1', 'author': '李四'},
    {'title': '文章2', 'author': '王五'}
]
results = collection.insert_many(articles)

# 查询单条数据
article = collection.find_one({'title': 'Python 爬虫入门'})
print(article)

# 条件查询
articles = collection.find({'author': '张三'})

# 更新数据
collection.update_one(
    {'title': 'Python 爬虫入门'},
    {'$set': {'views': 2000}}
)

# 删除数据
collection.delete_one({'title': '文章1'})
```

## Redis

### 简介

**Redis** 是一个基于内存的键值存储数据库，读写性能极高，常用于缓存和计数器。

### 安装

```bash
# 安装 Redis
sudo apt-get install redis-server

# Python 驱动
pip install redis
```

### 基本操作

```python
import redis

# 连接 Redis
r = redis.Redis(host='localhost', port=6379, db=0)

# 字符串操作
r.set('name', 'python')
print(r.get('name'))  # b'python'

# 计数器
r.incr('page_count')
print(r.get('page_count'))  # b'1'

# 哈希操作
r.hset('article:1', mapping={
    'title': 'Python 爬虫',
    'author': '张三'
})
print(r.hgetall('article:1'))

# 列表操作
r.lpush('urls', 'http://example.com/1')
r.lpush('urls', 'http://example.com/2')
print(r.lrange('urls', 0, -1))

# 集合操作
r.sadd('tags', 'python', '爬虫', '教程')
print(r.smembers('tags'))

# 爬虫常用场景：URL 去重
if not r.sismember('visited_urls', 'http://example.com'):
    r.sadd('visited_urls', 'http://example.com')
    # 执行爬取逻辑
```

## MySQL

### 简介

**MySQL** 是最流行的关系型数据库之一，适合存储需要关联查询的结构化数据。

### 安装

```bash
# 安装 MySQL
sudo apt-get install mysql-server

# Python 驱动
pip install pymysql
```

### 基本操作

```python
import pymysql

# 连接数据库
connection = pymysql.connect(
    host='localhost',
    user='root',
    password='password',
    database='spider',
    charset='utf8mb4'
)

try:
    with connection.cursor() as cursor:
        # 创建表
        sql = """
        CREATE TABLE IF NOT EXISTS articles (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            author VARCHAR(100),
            content TEXT,
            views INT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
        cursor.execute(sql)

        # 插入数据
        sql = "INSERT INTO articles (title, author, content) VALUES (%s, %s, %s)"
        cursor.execute(sql, ('Python 爬虫', '张三', '入门教程'))

        # 查询数据
        sql = "SELECT * FROM articles WHERE author = %s"
        cursor.execute(sql, ('张三',))
        results = cursor.fetchall()
        for row in results:
            print(row)

        # 更新数据
        sql = "UPDATE articles SET views = views + 1 WHERE id = %s"
        cursor.execute(sql, (1,))

    connection.commit()
finally:
    connection.close()
```

## 对比总结

| 特性 | MongoDB | Redis | MySQL |
|------|---------|-------|-------|
| **类型** | 文档数据库 | 键值数据库 | 关系数据库 |
| **数据结构** | JSON 文档 | 字符串/哈希/列表/集合 | 表（行/列） |
| **查询能力** | 丰富 | 有限 | SQL 强大 |
| **性能** | 高 | 最高 | 中等 |
| **适用场景** | 非结构化数据 | 缓存、去重、计数器 | 结构化、关联查询 |

> **建议**：爬虫项目通常组合使用多种数据库，例如 Redis 用于去重和缓存，MongoDB 用于存储爬取的数据。

## 小结

- **MongoDB**：适合存储非结构化、嵌套的爬取数据
- **Redis**：适合 URL 去重、请求频率限制、数据缓存
- **MySQL**：适合存储需要统计分析的结构化数据
