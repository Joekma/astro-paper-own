---
title: MySQL主从复制
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-04-22T00:00:00.000+08:00
slug: mysql-replication
featured: false
draft: false
series: mysql
tags:
  - MySQL
  - 数据库
  - 主从复制
description: 'MySQL主从复制原理和配置方法'
---

> 主从复制实现数据同步和读写分离。

## 原理

| 步骤 | 说明 |
|------|------|
| 1 | 主库记录 binlog |
| 2 | 从库 IO 线程拉取 |
| 3 | 从库 SQL 线程执行 |

## 配置

```bash
# 主库
server-id=1
log-bin=mysql-bin

# 从库
server-id=2
relay-log=relay-bin
```

## 小结

- **binlog**：记录变更
- **IO/SQL 线程**：数据同步
