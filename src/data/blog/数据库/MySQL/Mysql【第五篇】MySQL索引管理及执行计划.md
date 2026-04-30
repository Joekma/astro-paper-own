---
title: MySQL索引管理及执行计划
author: 程序员
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-04-22T00:00:00.000+08:00
slug: mysql-index-management
featured: false
draft: false
tags:
  - MySQL
  - 数据库
  - 索引
  - EXPLAIN
description: 'MySQL索引管理和查询执行计划分析'
---

> 索引管理和查询分析是性能优化的基础。

## 索引管理

```sql
CREATE INDEX idx_name ON users(name);
DROP INDEX idx_name ON users;
ALTER TABLE users ADD PRIMARY KEY(id);
```

## EXPLAIN

```sql
EXPLAIN SELECT * FROM users WHERE name = '张三';
```

## 关键字段

| 字段 | 说明 |
|------|------|
| type | 连接类型 |
| key | 使用的索引 |
| rows | 扫描行数 |

## 小结

- **索引管理**：CREATE/DROP INDEX
- **执行计划**：EXPLAIN 分析
