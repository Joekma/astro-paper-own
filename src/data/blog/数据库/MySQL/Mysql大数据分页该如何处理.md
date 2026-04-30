---
title: MySQL大数据分页处理
author: 程序员
pubDatetime: 2024-08-13T00:00:00.000+08:00
updated: 2026-04-22T00:00:00.000+08:00
slug: mysql-large-data-pagination
description: 'MySQL大数据分页优化方案，包括深度分页问题和优化技巧'
tags:
  - MySQL
  - 数据库
  - 分页
  - 优化
category: 数据库
draft: false
language: zh-CN
---

> 大数据量分页需要优化。

## 基础分页

```sql
SELECT * FROM orders LIMIT 0, 10;
SELECT * FROM orders LIMIT 10, 10;
```

## 深度分页问题

```sql
-- 问题：OFFSET 越大，性能越差
SELECT * FROM orders LIMIT 1000000, 10;
```

## 优化方案

### 方案一：延迟关联

```sql
SELECT * FROM orders o
INNER JOIN (
    SELECT id FROM orders ORDER BY id LIMIT 1000000, 10
) t ON o.id = t.id;
```

### 方案二：游标分页

```sql
-- 记录上次查询的最大 ID
SELECT * FROM orders WHERE id > 1000000 LIMIT 10;
```

### 方案三：范围查询

```sql
SELECT * FROM orders 
WHERE id BETWEEN 1000000 AND 1000010;
```

## 小结

- **延迟关联**：子查询 + JOIN
- **游标分页**：记录上次位置
- **范围查询**：BETWEEN AND
