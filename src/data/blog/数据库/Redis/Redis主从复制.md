---
title: Redis主从复制
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-04-22T00:00:00.000+08:00
slug: redis-replication
featured: false
draft: false
tags:
  - Redis
  - 数据库
  - 主从复制
  - 高可用
  - Sentinel
description: "Redis主从复制、读写分离和Sentinel高可用方案"
series: Redis
seriesOrder: 9
language: zh-CN
---

## 概述

Redis 主从复制是指将主节点的数据同步到从节点，实现数据冗余和读写分离，是 Redis 高可用架构的基础。

## 主从复制架构

```
┌─────────────┐
│   Master    │
│  (主节点)   │
└──────┬──────┘
       │
       │ 同步
       ▼
┌─────────────┐
│   Slave 1   │
│  (从节点1)  │
└─────────────┘

┌─────────────┐
│   Slave 2   │
│  (从节点2)  │
└─────────────┘
```

## 配置方式

### 方式一：配置文件配置

```bash
# 从节点配置文件
replicaof 192.168.1.100 6379

# 或从 Redis 5.0 开始
replicaof master_ip master_port

# 设置只读（从节点默认只读）
replica-read-only yes

# 认证密码（主节点设置）
requirepass your_password

# 主节点认证（从节点设置）
masterauth your_password
```

### 方式二：命令配置

```bash
# 指定主节点
REPLICAOF 192.168.1.100 6379

# 取消复制（变为主节点）
REPLICAOF NO ONE

# 设置认证
CONFIG SET masterauth password
CONFIG SET requirepass password
```

### 方式三：Docker 配置

```bash
# 主节点
docker run -d --name redis-master \
  -p 6379:6379 \
  redis:7

# 从节点
docker run -d --name redis-slave \
  -p 6380:6379 \
  --link redis-master \
  redis:7 \
  redis-server --replicaof redis-master 6379
```

## Docker Compose 部署

```yaml
version: "3"
services:
  master:
    image: redis:7
    container_name: redis-master
    ports:
      - "6379:6379"
    volumes:
      - ./master:/data
    command: redis-server --appendonly yes

  slave1:
    image: redis:7
    container_name: redis-slave1
    ports:
      - "6380:6379"
    volumes:
      - ./slave1:/data
    command: redis-server --replicaof redis-master 6379
    depends_on:
      - master

  slave2:
    image: redis:7
    container_name: redis-slave2
    ports:
      - "6381:6379"
    volumes:
      - ./slave2:/data
    command: redis-server --replicaof redis-master 6379
    depends_on:
      - master
```

## 复制原理

### 复制过程

| 阶段         | 说明                                  |
| ------------ | ------------------------------------- |
| **连接建立** | 从节点发送 PING，主节点返回 PONG      |
| **权限验证** | 如果有密码，验证 masterauth           |
| **同步数据** | 全量同步（RDB）或增量同步（命令传播） |
| **命令传播** | 主节点命令实时同步到从节点            |

### 全量同步（RDB）

```bash
# 1. 从节点发送 PSYNC ? -1
# 2. 主节点执行 BGSAVE 生成 RDB
# 3. 主节点发送 RDB 文件到从节点
# 4. 从节点加载 RDB 文件
# 5. 主节点发送缓冲区中的命令
```

### 增量同步（命令传播）

```bash
# 主节点将写命令发送给所有从节点
# repl_backlog 缓冲区记录最近的命令
# 从节点断开重连后发送 PSYNC offset
# 主节点根据 offset 发送缺失的命令
```

### 复制偏移量

```bash
# 主节点和从节点都有 replication offset
# 主节点发送 N 个字节，offset += N
# 从节点接收 N 个字节，offset += N

# 查看复制信息
INFO replication
```

## 复制配置参数

```bash
# repl-backlog-size：复制缓冲区大小
repl-backlog-size 10mb

# repl-backlog-ttl：从节点断开后缓冲区保留时间
repl-backlog-ttl 3600

# repl-diskless-sync：无盘复制
repl-diskless-sync yes

# repl-diskless-sync-delay：无盘复制延迟
repl-diskless-sync-delay 5

# repl-ping-replica-period：ping 从节点频率
repl-ping-replica-period 10

# repl-timeout：复制超时时间
repl-timeout 60
```

## 运维命令

### 查看复制状态

```bash
# 查看复制信息
INFO replication

# 查看从节点列表
CLIENT LIST | grep replica

# 查看主节点地址
CONFIG GET replicaof
```

### 管理从节点

```bash
# 断开复制连接
REPLICAOF NO ONE

# 同步延迟监控
INFO replication | grep lag

# 主节点查看从节点状态
CLIENT LIST type=replica
```

## 读写分离

### Python 读写分离

```python
import redis
from redis import Replication

# 创建连接池
master_pool = redis.ConnectionPool(host='192.168.1.100', port=6379, max_connections=10)
slave_pool = redis.ConnectionPool(host='192.168.1.101', port=6379, max_connections=20)

master = redis.Redis(connection_pool=master_pool)
slave = redis.Redis(connection_pool=slave_pool)

# 读操作（从节点）
def read(key):
    return slave.get(key)

# 写操作（主节点）
def write(key, value):
    return master.set(key, value)

# 批量读（从节点）
def batch_read(keys):
    pipe = slave.pipeline()
    for key in keys:
        pipe.get(key)
    return pipe.execute()
```

### 自动读写分离

```python
class ReadWriteRedis:
    def __init__(self, master_config, slave_configs):
        self.master = redis.Redis(**master_config)

        self.slave_pools = [
            redis.ConnectionPool(**config) for config in slave_configs
        ]
        self.slave_index = 0

    def get_slave(self):
        pool = self.slave_pools[self.slave_index]
        self.slave_index = (self.slave_index + 1) % len(self.slave_pools)
        return redis.Redis(connection_pool=pool)

    def read(self, key):
        slave = self.get_slave()
        return slave.get(key)

    def write(self, key, value):
        return self.master.set(key, value)
```

## Sentinel 高可用

Sentinel 在主从复制基础上提供监控、故障判断、自动故障转移和客户端服务发现能力。

| 组件         | 说明                       |
| ------------ | -------------------------- |
| **Master**   | 写入主节点                 |
| **Replica**  | 从节点，接收复制数据       |
| **Sentinel** | 监控节点状态并触发主从切换 |

### Sentinel 配置

```bash
sentinel monitor mymaster 127.0.0.1 6379 2
sentinel down-after-milliseconds mymaster 5000
sentinel failover-timeout mymaster 60000
sentinel parallel-syncs mymaster 1
```

### 故障转移流程

1. Sentinel 主观下线检测到 master 不可达。
2. 多个 Sentinel 投票形成客观下线。
3. Sentinel 从 replica 中选出新 master。
4. 其他 replica 自动改为复制新 master。
5. 客户端通过 Sentinel 获取新的 master 地址。

## 常见问题

### 问题一：复制延迟

```python
# 查看复制延迟
INFO replication
# slave0:ip=192.168.1.101,port=6379,state=online,offset=12345,lag=0

# lag=0 表示无延迟
# lag>0 表示延迟秒数
```

### 问题二：数据不一致

```bash
# 强制从节点同步主节点
DEBUG SEGFAULT  # 不要在生产环境使用

# 重新建立复制
REPLICAOF NO ONE
REPLICAOF master_ip master_port
```

### 问题三：复制风暴

```bash
# 原因：主节点挂了多个从节点同时重连
# 解决：使用树形复制

        Master
          │
      ┌───┴───┐
      │       │
   Slave1  Slave2
      │       │
   ┌───┴───┐ ┌─┴─┐
   │       │ │   │
 Rep1    Rep2 Rep3 Rep4
```

## 小结

| 配置项                 | 说明           |
| ---------------------- | -------------- |
| **replicaof**          | 指定主节点     |
| **replica-read-only**  | 从节点只读     |
| **masterauth**         | 主节点密码     |
| **repl-backlog-size**  | 复制缓冲区大小 |
| **repl-diskless-sync** | 无盘复制       |

| 同步方式     | 触发条件       | 数据范围          |
| ------------ | -------------- | ----------------- |
| **全量同步** | 从节点首次连接 | 全部数据          |
| **增量同步** | 断开重连       | offset 之后的数据 |

| 优势         | 说明                 |
| ------------ | -------------------- |
| **数据冗余** | 数据备份，提高安全性 |
| **读写分离** | 分散读压力，提升性能 |
| **故障恢复** | 从节点提升为主节点   |
