---
title: Redis持久化机制：RDB和AOF
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-04-22T00:00:00.000+08:00
slug: redis-persistence
featured: false
draft: false
tags:
  - Redis
  - 数据库
  - 持久化
  - RDB
  - AOF
description: "Redis持久化机制，RDB和AOF详解"
series: Redis
seriesOrder: 5
language: zh-CN
---

> Redis 持久化是保证数据安全的关键机制，RDB 和 AOF 是两种主要的持久化方式，各有优缺点。

## 持久化概述

### 两种方式对比

| 特性           | RDB          | AOF        |
| -------------- | ------------ | ---------- |
| **原理**       | 定时快照     | 记录写命令 |
| **文件大小**   | 小           | 大         |
| **恢复速度**   | 快           | 慢         |
| **数据完整性** | 可能丢失数据 | 取决于策略 |
| **性能影响**   | 较低         | 略高       |

## RDB 持久化

### 配置

```bash
save 900 1
save 300 10
save 60 10000
dbfilename dump.rdb
dir /var/lib/redis
rdbcompression yes
rdbchecksum yes
stop-writes-on-bgsave-error yes
```

### 手动触发

```bash
SAVE
BGSAVE

redis-cli SAVE
redis-cli BGSAVE
```

### 工作原理

```
定时触发 → 子进程生成RDB文件 → 替换旧文件
```

1. 父进程 fork 子进程
2. 子进程遍历内存数据
3. 写入临时 RDB 文件
4. 替换旧 RDB 文件

### 优缺点

- **优点**：恢复快、文件紧凑
- **缺点**：可能丢失最后一次快照后的数据

## AOF 持久化

### 配置

```bash
appendonly yes
appendfilename "appendonly.aof"
appendfsync everysec
dir /var/lib/redis
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb
aof-load-truncated yes
aof-use-rdb-preamble yes
```

### 同步策略

| 策略         | 说明         | 安全性 | 性能 |
| ------------ | ------------ | ------ | ---- |
| **always**   | 每次写都同步 | 最高   | 最低 |
| **everysec** | 每秒同步     | 中等   | 较高 |
| **no**       | 操作系统决定 | 最低   | 最高 |

### 工作流程

```
写命令 → AOF缓冲区 → 同步到AOF文件 → 重写（可选）
```

### AOF 重写

```bash
BGREWRITEAOF

redis-cli BGREWRITEAOF
```

```bash
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb
```

## 混合持久化

### 配置

```bash
aof-use-rdb-preamble yes
```

### 原理

```
重写时：RDB格式 + AOF增量 → 混合文件
恢复时：先加载RDB，再执行AOF
```

### 优势

- 快速恢复（RDB 部分）
- 完整数据（AOF 部分）
- 文件较小

## 恢复与备份

### 数据恢复

```bash
# 停止 Redis
systemctl stop redis

# 恢复 RDB
cp /backup/dump.rdb /var/lib/redis/

# 启动 Redis
systemctl start redis
```

### 备份脚本

```bash
#!/bin/bash
BACKUP_DIR=/backup/redis
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

cp /var/lib/redis/dump.rdb $BACKUP_DIR/dump_$DATE.rdb
cp /var/lib/redis/appendonly.aof $BACKUP_DIR/appendonly_$DATE.aof

find $BACKUP_DIR -name "*.rdb" -mtime +7 -delete
find $BACKUP_DIR -name "*.aof" -mtime +7 -delete
```

## 最佳实践

| 场景         | 推荐策略           |
| ------------ | ------------------ |
| 数据安全优先 | AOF always + RDB   |
| 性能优先     | AOF everysec + RDB |
| 大数据量     | 混合持久化         |
| 纯缓存       | 关闭持久化         |

## 小结

- **RDB**：定时快照，适合备份、迁移
- **AOF**：记录命令，数据更完整
- **混合持久化**：结合两者优点
- **策略选择**：根据数据安全需求选择
