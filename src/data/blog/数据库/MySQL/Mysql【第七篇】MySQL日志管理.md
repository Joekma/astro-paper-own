---
title: MySQL日志管理
author: 程序员
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-04-22T00:00:00.000+08:00
slug: mysql-log-management
featured: false
draft: false
tags:
  - MySQL
  - 数据库
  - 日志
description: 'MySQL日志类型和管理，包括binlog、slowlog等'
---

> MySQL 日志用于审计和故障排查。

## 日志类型

| 类型 | 作用 |
|------|------|
| **binlog** | 数据变更记录 |
| **slowlog** | 慢查询日志 |
| **errorlog** | 错误日志 |

## 小结

- **binlog**：数据恢复、主从复制
- **slowlog**：性能分析
