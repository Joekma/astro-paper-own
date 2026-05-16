---
title: MySQL高可用与读写分离
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-04-22T00:00:00.000+08:00
slug: mysql-high-availability
featured: false
draft: false
series: mysql
tags:
  - MySQL
  - 数据库
  - 高可用
  - 读写分离
  - 主从复制
description: "MySQL主从复制、高可用架构MHA及读写分离方案"
---

> MySQL 高可用架构保障服务稳定性。

## 主从复制

主从复制通过 binlog、relay log、IO 线程和 SQL 线程把主库变更同步到从库。

| 步骤 | 说明                                     |
| ---- | ---------------------------------------- |
| 1    | 主库把数据变更记录到 binlog              |
| 2    | 从库 IO 线程拉取 binlog 并写入 relay log |
| 3    | 从库 SQL 线程读取 relay log 并重放 SQL   |

```bash
# 配置主库
server-id=1
log-bin=mysql-bin

# 配置从库
server-id=2
relay-log=relay-bin
```

复制链路正常时，从库可承担读请求；主库故障时，高可用组件可以提升从库为新主库。

## MHA 架构

| 组件            | 说明     |
| --------------- | -------- |
| **MHA Manager** | 管理节点 |
| **MHA Node**    | 数据节点 |

## 读写分离

```bash
# 使用代理工具
# MySQL Proxy / Atlas / Amoeba
```

## 小结

- **主从复制**：数据同步
- **MHA**：故障切换
- **读写分离**：分担压力
