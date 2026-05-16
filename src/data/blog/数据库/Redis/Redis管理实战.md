---
title: Redis管理实战
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-04-22T00:00:00.000+08:00
slug: redis-management
featured: false
draft: false
tags:
  - Redis
  - 数据库
  - 运维
description: "Redis管理运维实战经验，包含配置优化、监控和安全"
series: Redis
language: zh-CN
---

## 概述

Redis 管理涉及配置优化、运维监控、安全设置等方面，是保证 Redis 高效稳定运行的关键。

## 核心配置

### 内存配置

```bash
# 最大内存
maxmemory 2gb
maxmemory-policy allkeys-lru

# 内存淘汰策略
# noeviction - 不淘汰
# allkeys-lru - 所有key最近最少使用
# volatile-lru - 设置过期key最近最少使用
# allkeys-random - 所有key随机淘汰
# volatile-random - 设置过期key随机淘汰
# volatile-ttl - 设置过期key优先淘汰TTL短的
```

### 网络配置

```bash
# 绑定地址
bind 0.0.0.0

# 端口
port 6379

# 超时设置
timeout 300
tcp-keepalive 60
```

### RDB 配置

```bash
# 快照策略
save 900 1      # 900秒内有1个key变化
save 300 10     # 300秒内有10个key变化
save 60 10000   # 60秒内有10000个key变化

# 禁用 RDB
save ""

# 压缩
rdbcompression yes
```

### AOF 配置

```bash
# 开启 AOF
appendonly yes
appendfilename "appendonly.aof"

# 同步策略
# always - 每次写入同步
# everysec - 每秒同步（推荐）
# no - 由系统决定
appendfsync everysec

# 重写配置
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb
```

## 运维命令

### 服务器信息

```bash
# 查看服务器信息
INFO

# 查看特定信息
INFO memory
INFO clients
INFO stats
INFO replication

# 查看配置
CONFIG GET *
CONFIG GET maxmemory
```

### 客户端管理

```bash
# 查看客户端
CLIENT LIST
CLIENT LIST type=normal

# 杀掉客户端
CLIENT KILL ip:port

# 设置客户端名称
CLIENT SETNAME my-client
CLIENT GETNAME
```

### 数据库操作

```bash
# 切换数据库
SELECT 0

# 清空当前数据库
FLUSHDB

# 清空所有数据库
FLUSHALL

# 查看 key 数量
DBSIZE
```

### 性能监控

```bash
# 实时统计
MONITOR

# 慢查询日志
SLOWLOG GET 10
SLOWLOG LEN
SLOWLOG RESET

# 设置慢查询阈值
CONFIG SET slowlog-log-slower-than 1000
```

## 备份与恢复

### RDB 备份

```bash
# 手动备份
BGSAVE

# 检查后台保存状态
LASTSAVE

# 复制备份文件
cp dump.rdb /backup/
```

### AOF 恢复

```bash
# 开启 AOF
CONFIG SET appendonly yes

# 修复 AOF 文件
redis-check-aof --fix appendonly.aof
```

### 数据迁移

```bash
# 使用 SCAN 迁移
redis-cli --scan | redis-cli -pipe < data.txt

# 使用 MIGRATE（Redis 3.0+）
MIGRATE 192.168.1.100 6379 "" 0 5000 KEYS key1 key2
```

## 安全配置

### 密码认证

```bash
# 设置密码
CONFIG SET requirepass "your_password"

# 认证
AUTH your_password

# 永久设置（在配置文件中）
requirepass your_password
```

### 命令重命名

```bash
# 重命名危险命令
CONFIG SET rename-command FLUSHDB "FLUSHDB_mypass"
CONFIG SET rename-command FLUSHALL "FLUSHALL_mypass"
CONFIG SET rename-command CONFIG "CONFIG_mypass"
```

### IP 白名单

```bash
# 绑定特定 IP
bind 127.0.0.1 192.168.1.100

# 保护模式
protected-mode yes
```

## 性能优化

### 内存优化

```bash
# 使用ziplist
hash-max-ziplist-entries 512
hash-max-ziplist-value 64

# 使用intset
set-max-intset-entries 512

# 使用quicklist
list-max-ziplist-size -2
```

### 连接优化

```bash
# 最大连接数
maxclients 10000

# TCP 积压
tcp-backlog 511

# 客户端超时
timeout 300
```

### 持久化优化

```bash
# 后台保存子进程优先级
replica-read-only yes

# 关闭 BGSAVE 时允许写入
stop-writes-on-bgsave-error yes
```

## 监控告警

### 关键指标

| 指标              | 说明       | 告警阈值         |
| ----------------- | ---------- | ---------------- |
| used_memory       | 已使用内存 | > maxmemory 80%  |
| connected_clients | 连接数     | > maxclients 80% |
| blocked_clients   | 阻塞客户端 | > 0              |
| evicted_keys      | 淘汰key数  | > 0              |
| replication_lag   | 复制延迟   | > 5秒            |

### Python 监控脚本

```python
import redis
import time

def monitor_redis(host='localhost', port=6379):
    r = redis.Redis(host=host, port=port)

    while True:
        info = r.info()

        metrics = {
            'used_memory': info['used_memory_human'],
            'connected_clients': info['connected_clients'],
            'blocked_clients': info['blocked_clients'],
            'evicted_keys': info['evicted_keys'],
            'instantaneous_ops_per_sec': info['instantaneous_ops_per_sec'],
            'keyspace_hits': info['keyspace_hits'],
            'keyspace_misses': info['keyspace_misses']
        }

        hit_rate = info['keyspace_hits'] / (info['keyspace_hits'] + info['keyspace_misses']) * 100

        print(f"时间: {time.strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"内存: {metrics['used_memory']}")
        print(f"命中率: {hit_rate:.2f}%")
        print("-" * 50)

        time.sleep(60)
```

## 小结

| 类别       | 关键配置            |
| ---------- | ------------------- |
| **内存**   | maxmemory、淘汰策略 |
| **持久化** | RDB 快照、AOF 日志  |
| **安全**   | 密码、IP 白名单     |
| **性能**   | 连接数、慢查询      |
| **监控**   | 内存、命中率、延迟  |
