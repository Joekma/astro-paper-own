---
title: MySQL常见问题
author: 程序员
pubDatetime: 2024-08-13T00:00:00.000+08:00
updated: 2026-04-22T00:00:00.000+08:00
slug: mysql-common-problems
description: 'MySQL使用中的常见问题及解决方案'
tags:
  - MySQL
  - 数据库
  - 问题解决
category: 数据库
draft: false
language: zh-CN
---

> MySQL 使用中的常见问题汇总。

## 连接问题

```sql
-- 连接数过多
SHOW STATUS LIKE 'Threads%';
SET GLOBAL max_connections = 500;
```

## 性能问题

```sql
-- 查询慢
EXPLAIN SELECT * FROM users;

-- 索引缺失
SHOW INDEX FROM users;
```

## 数据问题

```sql
-- 数据重复
DELETE FROM users WHERE id NOT IN (
    SELECT MIN(id) FROM users GROUP BY name
);
```

## 小结

- **连接数**：调整 max_connections
- **性能**：使用 EXPLAIN 分析
- **数据**：清理重复数据
