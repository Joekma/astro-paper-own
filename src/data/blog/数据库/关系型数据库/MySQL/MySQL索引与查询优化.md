---
title: MySQL索引与查询优化
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-04-22T00:00:00.000+08:00
slug: mysql-index-optimization
featured: false
draft: false
series: mysql
tags:
  - MySQL
  - 数据库
  - 索引
  - 优化
description: "MySQL索引原理、慢查询分析和优化技巧"
---

> 索引是提升查询性能的关键。

## 索引类型

| 类型         | 说明                     |
| ------------ | ------------------------ |
| **主键索引** | 主键自动建立，唯一且非空 |
| **唯一索引** | 值唯一                   |
| **普通索引** | 普通字段                 |
| **全文索引** | 文本内容搜索             |
| **复合索引** | 多字段组合               |

## 创建索引

```sql
-- 主键索引
ALTER TABLE users ADD PRIMARY KEY (id);

-- 唯一索引
CREATE UNIQUE INDEX idx_email ON users(email);

-- 普通索引
CREATE INDEX idx_name ON users(name);

-- 复合索引
CREATE INDEX idx_name_age ON users(name, age);

-- 全文索引
ALTER TABLE articles ADD FULLTEXT(title, content);
```

## 查看索引

```sql
SHOW INDEX FROM users;
SHOW INDEX FROM users\G
```

## 慢查询日志

```sql
-- 开启慢查询日志
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 2;
```

### 查看慢查询

```sql
SHOW VARIABLES LIKE 'slow_query%';
SHOW VARIABLES LIKE 'long_query_time';

-- 查看日志文件
SHOW FULL PROCESSLIST;
```

## EXPLAIN 分析

```sql
EXPLAIN SELECT * FROM users WHERE name = '张三';

-- 分析结果
-- type: const, eq_ref, ref, range, index, ALL
-- key: 使用的索引
-- rows: 扫描行数
-- Extra: Using index, Using filesort
```

### 关键字段

| 字段    | 说明           | 优化关注点                               |
| ------- | -------------- | ---------------------------------------- |
| `type`  | 连接访问类型   | 尽量避免 `ALL` 全表扫描                  |
| `key`   | 实际使用的索引 | 为空通常说明未命中索引                   |
| `rows`  | 预估扫描行数   | 数值越大，查询成本越高                   |
| `Extra` | 额外执行信息   | 关注 `Using filesort`、`Using temporary` |

## 优化技巧

### SQL 优化

```sql
-- 使用索引列
SELECT * FROM users WHERE id = 1;

-- 避免 SELECT *
SELECT id, name FROM users WHERE id = 1;

-- 使用 LIMIT
SELECT * FROM users LIMIT 10;

-- 批量插入
INSERT INTO users (name) VALUES ('a'), ('b'), ('c');
```

### 索引优化

```sql
-- 最左前缀原则
-- 复合索引 idx(a, b, c) 可用于：
-- a = 1
-- a = 1 AND b = 2
-- a = 1 AND b = 2 AND c = 3

-- 避免索引失效
-- 不要在索引列上使用函数
WHERE LEFT(name, 2) = '张'  -- 索引失效
WHERE name LIKE '张%'       -- 索引有效
```

## 小结

- **索引类型**：主键、唯一、普通、全文、复合
- **慢查询**：开启日志，分析 EXPLAIN
- **优化**：避免 SELECT \*，使用索引列，批量操作
