---
title: MySQL体系结构
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-04-22T00:00:00.000+08:00
slug: mysql-architecture
featured: false
draft: false
tags:
  - MySQL
  - 数据库
  - 架构
description: 'MySQL体系结构，包括连接层、服务层、存储引擎层'
---

> MySQL 体系结构决定了数据库的工作方式。

## 体系结构

| 层级 | 说明 |
|------|------|
| **连接层** | 连接管理、认证 |
| **服务层** | SQL 解析、优化 |
| **引擎层** | 存储引擎 |
| **物理层** | 文件系统 |

## 小结

- **连接层**：处理连接
- **服务层**：SQL 处理
- **引擎层**：数据存储
