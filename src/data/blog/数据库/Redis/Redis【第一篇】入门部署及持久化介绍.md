---
title: Redis入门部署及持久化
author: 程序员
pubDatetime: 2024-08-13T00:00:00.000+08:00
updated: 2026-04-22T00:00:00.000+08:00
slug: redis-intro-deployment-persistence
description: 'Redis数据库入门教程，包括特性介绍、部署安装和持久化方案'
tags:
  - Redis
  - 数据库
  - NoSQL
  - 缓存
category: 数据库
draft: false
language: zh-CN
---

> Redis 是一款开源的内存键值数据库，支持多种数据类型和持久化存储。

## Redis 简介

### 主要特性

| 特性 | 说明 |
|------|------|
| **高速读写** | 基于内存，支持持久化 |
| **数据类型丰富** | String、Hash、List、Set、Zset |
| **持久化** | RDB 和 AOF 两种方式 |
| **支持事务** | MULTI/EXEC 命令 |
| **消息队列** | Pub/Sub 功能 |
| **高可用** | 支持主从复制、哨兵、集群 |

### 应用场景

- **缓存**：热点数据缓存
- **会话存储**：Session 管理
- **实时排行**：Zset 实现排行榜
- **消息队列**：Pub/Sub 实现消息订阅
- **分布式锁**：SETNX 实现锁机制

## 缓存方案对比

| 特性 | Memcached | Redis | Tair |
|------|-----------|-------|------|
| **持久化** | ❌ | ✅ | ✅ |
| **数据类型** | 单一 | 丰富 | 丰富 |
| **性能** | 高（多线程） | 高（单线程） | 中等 |
| **高可用** | 需客户端实现 | 原生支持 | 原生支持 |
| **适用场景** | 简单缓存 | 复杂缓存 | 大规模缓存 |

## Linux 安装

### 方法一：Yum 安装

```bash
# 安装 EPEL 源
sudo yum install -y epel-release

# 安装 Redis
sudo yum install -y redis

# 启动服务
sudo systemctl start redis
sudo systemctl enable redis

# 测试连接
redis-cli ping
```

### 方法二：编译安装

```bash
# 安装依赖
sudo yum install -y gcc make

# 下载源码
wget http://download.redis.io/releases/redis-6.2.6.tar.gz
tar xzf redis-6.2.6.tar.gz
cd redis-6.2.6

# 编译安装
make
sudo make install

# 复制配置文件
sudo cp redis.conf /etc/redis.conf

# 修改配置
sudo sed -i 's/bind 127.0.0.1/bind 0.0.0.0/' /etc/redis.conf
sudo sed -i 's/protected-mode yes/protected-mode no/' /etc/redis.conf

# 启动 Redis
redis-server /etc/redis.conf
```

## Docker 安装

```bash
# 拉取镜像
docker pull redis:7

# 运行容器
docker run -d \
  --name redis \
  -p 6379:6379 \
  -v /data/redis:/data \
  redis:7 \
  redis-server --appendonly yes
```

## 持久化

Redis 支持两种持久化方式：RDB 和 AOF。

### RDB 持久化

**原理**：定时将内存数据快照保存到磁盘。

```bash
# 配置文件
save 900 1      # 900秒内至少1个key变化
save 300 10     # 300秒内至少10个key变化
save 60 10000   # 60秒内至少10000个key变化

# 手动执行
redis-cli SAVE          # 同步保存（阻塞）
redis-cli BGSAVE        # 异步保存（后台执行）
```

**优点**：
- 文件紧凑，适合备份
- 恢复大数据集快

**缺点**：
- 可能丢失最后一次快照后的数据
- Fork 进程会消耗内存

### AOF 持久化

**原理**：记录所有写命令到日志文件。

```bash
# 配置文件
appendonly yes
appendfilename "appendonly.aof"
appendfsync everysec   # 每秒同步
# appendfsync always   # 每次写入都同步
# appendfsync no        # 由操作系统决定

# 重写 AOF 文件（压缩）
redis-cli BGREWRITEAOF
```

**优点**：
- 数据安全性更高
- 日志文件可读

**缺点**：
- 文件比 RDB 大
- 可能比 RDB 慢

### 持久化策略建议

```bash
# 推荐配置
appendonly yes
appendfsync everysec
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb
```

## 基本命令

### String 类型

```bash
SET name "zhangsan"
GET name
MSET name1 "v1" name2 "v2"
MGET name1 name2
INCR counter
INCRBY counter 10
EXPIRE name 60     # 设置过期时间
TTL name           # 查看剩余时间
```

### Hash 类型

```bash
HSET user:1 name "zhangsan" age "25"
HGET user:1 name
HGETALL user:1
HINCRBY user:1 age 1
HDEL user:1 age
```

### List 类型

```bash
LPUSH list a b c
RPUSH list d e f
LRANGE list 0 -1
LPOP list
RPOP list
```

### Set 类型

```bash
SADD tags python java go
SMEMBERS tags
SISMEMBER tags python
SREM tags python
```

### Zset 类型

```bash
ZADD leaderboard 100 "zhangsan"
ZADD leaderboard 90 "lisi"
ZRANGE leaderboard 0 -1 WITHSCORES
ZREVRANGE leaderboard 0 2 WITHSCORES
```

## 常用管理命令

```bash
redis-cli INFO              # 查看信息
redis-cli DBSIZE            # 键数量
redis-cli FLUSHDB           # 清空当前数据库
redis-cli FLUSHALL          # 清空所有数据库
redis-cli KEYS pattern       # 查找键
redis-cli EXPIRE key 60      # 设置过期
redis-cli PERSIST key       # 移除过期
```

## 小结

- **Redis**：高性能内存键值数据库
- **安装**：Yum、编译、Docker
- **持久化**：RDB（快照）+ AOF（日志）
- **数据类型**：String、Hash、List、Set、Zset
- **应用**：缓存、Session、队列、锁
