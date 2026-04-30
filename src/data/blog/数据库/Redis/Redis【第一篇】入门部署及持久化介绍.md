---
title: Redis入门部署及持久化介绍
author: 程序员
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-04-22T00:00:00.000+08:00
slug: redis-getting-started
featured: false
draft: false
tags:
  - Redis
  - 数据库
  - 入门
  - 缓存
description: 'Redis入门，部署和持久化介绍'
---

> Redis 是基于内存的高性能键值存储数据库，支持多种数据结构，广泛用于缓存、消息队列等场景。

## 简介

### Redis 特性

| 特性 | 说明 |
|------|------|
| **高性能** | 基于内存，读写速度快 |
| **数据类型丰富** | String、Hash、List、Set、Sorted Set |
| **持久化** | 支持 RDB 和 AOF |
| **高可用** | 支持主从复制、哨兵、集群 |
| **单线程** | 避免锁竞争 |
| **发布订阅** | 支持消息发布/订阅 |

## 安装

### Docker 安装

```bash
docker run -d \
  --name redis \
  -p 6379:6379 \
  redis:7-alpine

# 带持久化
docker run -d \
  --name redis \
  -p 6379:6379 \
  -v redis-data:/data \
  redis:7-alpine \
  redis-server --appendonly yes
```

### Docker Compose

```yaml
version: '3'
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    command: redis-server --appendonly yes
    restart: always

volumes:
  redis-data:
```

## 基本操作

### 连接

```bash
redis-cli
redis-cli -h localhost -p 6379
```

### String 操作

```bash
SET name "Alice"
GET name
SETEX session:123 3600 "token123"
GETSET name "Bob"
MGET name age
MSET name "Alice" age 25
INCR counter
DECR counter
```

### Hash 操作

```bash
HSET user:1 name "Alice" email "alice@example.com"
HGET user:1 name
HGETALL user:1
HMSET user:2 name "Bob" age 30
HMGET user:2 name age
HKEYS user:1
HLEN user:1
```

### List 操作

```bash
LPUSH tasks "task1"
RPUSH tasks "task2"
LPOP tasks
RPOP tasks
LRANGE tasks 0 -1
LLEN tasks
```

### Set 操作

```bash
SADD tags "python" "redis"
SMEMBERS tags
SISMEMBER tags "python"
SCARD tags
SREM tags "redis"
SINTER tag1 tag2
```

### Sorted Set 操作

```bash
ZADD leaderboard 100 "Alice"
ZADD leaderboard 90 "Bob"
ZRANGE leaderboard 0 -1 WITHSCORES
ZREVRANGE leaderboard 0 -1
ZRANK leaderboard "Alice"
```

## Python 客户端

### 安装

```bash
pip install redis
```

### 基本使用

```python
import redis

r = redis.Redis(host='localhost', port=6379, db=0)

r.set('name', 'Alice')
name = r.get('name')

r.hset('user:1', mapping={'name': 'Alice', 'email': 'alice@example.com'})
user = r.hgetall('user:1')

r.lpush('tasks', 'task1', 'task2')
tasks = r.lrange('tasks', 0, -1)

r.zadd('leaderboard', {'Alice': 100, 'Bob': 90})
ranking = r.zrevrange('leaderboard', 0, 9, withscores=True)
```

### 连接池

```python
pool = redis.ConnectionPool(host='localhost', port=6379, db=0)
r = redis.Redis(connection_pool=pool)
```

## 持久化

### RDB

```bash
save 900 1
save 300 10
save 60 10000
```

```python
r.save()
r.bgsave()
```

### AOF

```bash
appendonly yes
appendfsync everysec
```

## 小结

- **Redis**：高性能内存数据库
- **数据结构**：String、Hash、List、Set、Sorted Set
- **安装**：Docker 最简单
- **持久化**：RDB 和 AOF 两种方式