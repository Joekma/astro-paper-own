---
title: Python爬虫数据存储：MongoDB、Redis、MySQL
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-04-22T00:00:00.000+08:00
slug: python-scraping-data-storage
featured: false
draft: false
series: 爬虫
tags:
  - Python
  - 爬虫
  - MongoDB
  - Redis
  - MySQL
  - 数据库
  - NoSQL
  - 数据存储
description: 'Python爬虫数据存储，详细讲解MongoDB、Redis、MySQL的使用方法和应用场景，包含Python连接代码、CRUD操作、数据库选择策略和性能优化建议。'
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

## 连接池与异常处理

### MongoDB 连接池

```python
from pymongo import MongoClient
import pymongo

# 创建连接池
client = MongoClient(
    'mongodb://localhost:27017/',
    maxPoolSize=50,        # 最大连接数
    minPoolSize=10,        # 最小连接数
    maxIdleTimeMS=30000,   # 空闲超时
    connectTimeoutMS=5000, # 连接超时
    serverSelectionTimeoutMS=5000,  # 服务器选择超时
)

db = client['spider']

# 使用连接池
collection = db['articles']
result = collection.insert_one({'title': 'Python爬虫', 'views': 1000})
print(f"插入ID: {result.inserted_id}")

# 关闭连接池
client.close()
```

### Redis 连接池

```python
import redis

# 创建连接池
pool = redis.ConnectionPool(
    host='localhost',
    port=6379,
    db=0,
    max_connections=50,
    socket_timeout=5,
    socket_connect_timeout=5,
)

# 使用连接池
r = redis.Redis(connection_pool=pool)

# 批量操作
pipe = r.pipeline()
pipe.set('name', 'python')
pipe.incr('count')
pipe.hset('user:1', mapping={'name': '张三', 'age': 25})
pipe.execute()

# 关闭连接池
pool.disconnect()
```

### MySQL 连接池

```python
import pymysql
from dbutils.pooled_db import PooledDB

# 创建连接池
pool = PooledDB(
    creator=pymysql,
    maxconnections=20,
    mincached=5,
    maxcached=10,
    blocking=True,
    host='localhost',
    port=3306,
    user='root',
    password='',
    database='spider',
    charset='utf8mb4'
)

# 使用连接池
def insert_article(article):
    conn = pool.connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO articles (title, content) VALUES (%s, %s)",
            (article['title'], article['content'])
        )
        conn.commit()
    finally:
        conn.close()

# 关闭连接池
pool.close()
```

### 数据库异常处理

```python
import pymongo
import pymysql
import redis

# MongoDB 异常处理
try:
    client = pymongo.MongoClient('mongodb://localhost:27017/', serverSelectionTimeoutMS=5000)
    db = client['spider']
    collection = db['articles']
    
    result = collection.insert_one({'title': '测试文章'})
    print(f"插入成功: {result.inserted_id}")
    
except pymongo.errors.ConnectionFailure:
    print("MongoDB 连接失败")
except pymongo.errors.DuplicateKeyError:
    print("文档已存在（唯一键冲突）")
except pymongo.errors.BulkWriteError as e:
    print(f"批量写入错误: {e.details}")
except Exception as e:
    print(f"其他错误: {e}")
finally:
    client.close()

# MySQL 异常处理
try:
    connection = pymysql.connect(
        host='localhost',
        user='root',
        password='',
        database='spider'
    )
    
    with connection.cursor() as cursor:
        sql = "INSERT INTO articles (title) VALUES (%s)"
        cursor.execute(sql, ('测试标题',))
        connection.commit()
        
except pymysql.err.OperationalError:
    print("MySQL 连接失败")
except pymysql.err.IntegrityError:
    print("数据完整性错误（外键约束等）")
except pymysql.err.ProgrammingError:
    print("SQL 语法错误")
except Exception as e:
    print(f"其他错误: {e}")
finally:
    connection.close()

# Redis 异常处理
try:
    r = redis.Redis(host='localhost', port=6379)
    r.set('name', 'python', ex=3600)  # 设置过期时间
    
    value = r.get('name')
    if value:
        print(f"获取成功: {value.decode()}")
        
except redis.exceptions.ConnectionError:
    print("Redis 连接失败")
except redis.exceptions.TimeoutError:
    print("Redis 操作超时")
except redis.exceptions.ResponseError as e:
    print(f"Redis 响应错误: {e}")
except Exception as e:
    print(f"其他错误: {e}")
```

### 完整爬虫数据库封装

```python
import pymongo
import pymysql
import redis
from dbutils.pooled_db import PooledDB
from contextlib import contextmanager

class DatabaseManager:
    """爬虫数据库管理类"""
    
    def __init__(self):
        self.mongo_client = None
        self.mysql_pool = None
        self.redis_client = None
    
    def init_mongodb(self):
        """初始化 MongoDB"""
        self.mongo_client = pymongo.MongoClient(
            'mongodb://localhost:27017/',
            maxPoolSize=50
        )
        return self.mongo_client['spider']
    
    def init_mysql(self):
        """初始化 MySQL 连接池"""
        self.mysql_pool = PooledDB(
            creator=pymysql,
            maxconnections=20,
            mincached=5,
            host='localhost',
            user='root',
            password='',
            database='spider',
            charset='utf8mb4'
        )
        return self.mysql_pool
    
    def init_redis(self):
        """初始化 Redis"""
        self.redis_client = redis.Redis(
            host='localhost',
            port=6379,
            decode_responses=True
        )
        return self.redis_client
    
    @contextmanager
    def mysql_connection(self):
        """MySQL 上下文管理器"""
        conn = self.mysql_pool.connection()
        try:
            yield conn
        finally:
            conn.close()
    
    def close_all(self):
        """关闭所有连接"""
        if self.mongo_client:
            self.mongo_client.close()
        if self.mysql_pool:
            self.mysql_pool.close()
        if self.redis_client:
            self.redis_client.close()

# 使用示例
db_manager = DatabaseManager()

try:
    mongo_db = db_manager.init_mongodb()
    mysql_pool = db_manager.init_mysql()
    redis_client = db_manager.init_redis()
    
    # URL 去重（使用 Redis）
    if not redis_client.exists(f'url:{url}'):
        redis_client.setex(f'url:{url}', 86400, '1')
        
        # 保存数据（使用 MongoDB）
        mongo_db.articles.insert_one(data)
        
        # 统计分析（使用 MySQL）
        with db_manager.mysql_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "UPDATE stats SET count = count + 1 WHERE type = 'article'"
            )
            conn.commit()
            
finally:
    db_manager.close_all()
```

## 小结

- **MongoDB**：适合存储非结构化、嵌套的爬取数据
- **Redis**：适合 URL 去重、请求频率限制、数据缓存
- **MySQL**：适合存储需要统计分析的结构化数据
- **连接池**：显著提升数据库访问性能，避免频繁创建连接
- **异常处理**：完善错误处理机制，确保爬虫稳定运行
- **组合使用**：Redis+MongoDB+MySQL，发挥各数据库优势
