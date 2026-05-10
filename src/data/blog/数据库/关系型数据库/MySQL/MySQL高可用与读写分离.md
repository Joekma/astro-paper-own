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
description: 'MySQL高可用架构MHA及读写分离方案'
---

> MySQL 高可用架构保障服务稳定性。

## 主从复制

```bash
# 配置主库
server-id=1
log-bin=mysql-bin

# 配置从库
server-id=2
relay-log=relay-bin
```

## MHA 架构

| 组件 | 说明 |
|------|------|
| **MHA Manager** | 管理节点 |
| **MHA Node** | 数据节点 |

## 读写分离

```bash
# 使用代理工具
# MySQL Proxy / Atlas / Amoeba
```

## 小结

- **主从复制**：数据同步
- **MHA**：故障切换
- **读写分离**：分担压力
