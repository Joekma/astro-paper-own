---
title: MySQL多表查询
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-04-22T00:00:00.000+08:00
slug: mysql-multi-table-queries
featured: false
draft: false
tags:
  - MySQL
  - 数据库
  - SQL
  - 多表查询
description: 'MySQL多表查询，包括连接查询、子查询和联合查询'
---

## 概述

多表查询是处理关联数据的关键技术，包括连接查询、子查询和联合查询等多种方式。

## 连接查询

### 连接类型对比

| 连接类型 | 说明 | 结果集 |
|---------|------|--------|
| **INNER JOIN** | 内连接 | 只保留匹配行 |
| **LEFT JOIN** | 左连接 | 保留左表全部 |
| **RIGHT JOIN** | 右连接 | 保留右表全部 |
| **FULL OUTER JOIN** | 全连接 | 保留两表全部 |

### 数据准备

```sql
-- 用户表
CREATE TABLE users (
    id INT PRIMARY KEY,
    name VARCHAR(50),
    department_id INT
);

-- 部门表
CREATE TABLE departments (
    id INT PRIMARY KEY,
    name VARCHAR(50)
);

-- 订单表
CREATE TABLE orders (
    id INT PRIMARY KEY,
    user_id INT,
    amount DECIMAL(10,2)
);
```

### 内连接（INNER JOIN）

```sql
-- 基本语法
SELECT u.name, d.name as dept_name
FROM users u
INNER JOIN departments d ON u.department_id = d.id;

-- 多个表连接
SELECT u.name, o.id, o.amount
FROM users u
INNER JOIN orders o ON u.id = o.user_id
INNER JOIN departments d ON u.department_id = d.id;
```

### 左连接（LEFT JOIN）

```sql
-- 保留左表全部数据
SELECT u.name, o.id, o.amount
FROM users u
LEFT JOIN orders o ON u.id = o.user_id;

-- 即使没有订单也显示用户
-- 结果：无订单的用户 o.id 和 o.amount 为 NULL
```

### 右连接（RIGHT JOIN）

```sql
-- 保留右表全部数据
SELECT u.name, o.id, o.amount
FROM users u
RIGHT JOIN orders o ON u.id = o.user_id;

-- 即使没有用户也显示订单
-- 结果：无用户的订单 u.name 为 NULL
```

### 全外连接（FULL OUTER JOIN）

```sql
-- MySQL 不直接支持，使用 UNION 实现
SELECT u.name, o.id
FROM users u
LEFT JOIN orders o ON u.id = o.user_id

UNION

SELECT u.name, o.id
FROM users u
RIGHT JOIN orders o ON u.id = o.user_id;
```

### 交叉连接（CROSS JOIN）

```sql
-- 笛卡尔积
SELECT u.name, d.name
FROM users u
CROSS JOIN departments d;

-- 每个用户对应每个部门
```

## 子查询

### 子查询位置

| 位置 | 说明 |
|------|------|
| **SELECT 后** | 标量子查询 |
| **FROM 后** | 表子查询 |
| **WHERE 后** | 条件子查询 |

### WHERE 子句子查询

```sql
-- 单行子查询
SELECT * FROM employees
WHERE salary > (SELECT AVG(salary) FROM employees);

-- 多行子查询
SELECT * FROM employees
WHERE department_id IN (
    SELECT id FROM departments WHERE name = '技术部'
);
```

### IN / NOT IN

```sql
-- 在子查询结果中
SELECT * FROM users
WHERE id IN (SELECT user_id FROM orders WHERE amount > 1000);

-- 不在子查询结果中
SELECT * FROM users
WHERE id NOT IN (SELECT user_id FROM orders);
```

### EXISTS / NOT EXISTS

```sql
-- 存在则返回
SELECT * FROM users u
WHERE EXISTS (
    SELECT 1 FROM orders o WHERE o.user_id = u.id
);

-- 不存在则返回
SELECT * FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM orders o WHERE o.user_id = u.id
);
```

### FROM 子句子查询

```sql
-- 作为临时表
SELECT dept_name, AVG(salary) as avg_sal
FROM (
    SELECT d.name as dept_name, e.salary
    FROM employees e
    INNER JOIN departments d ON e.department_id = d.id
) AS t
GROUP BY dept_name;
```

### SELECT 子句子查询

```sql
-- 标量子查询
SELECT
    name,
    salary,
    (SELECT AVG(salary) FROM employees) as avg_salary,
    salary - (SELECT AVG(salary) FROM employees) as diff
FROM employees;
```

## 联合查询

### UNION / UNION ALL

```sql
-- UNION 自动去重
SELECT name FROM users
UNION
SELECT name FROM admins;

-- UNION ALL 不去重（更快）
SELECT name FROM users
UNION ALL
SELECT name FROM admins;

-- 配合 ORDER BY
(SELECT name, 'user' as type FROM users)
UNION ALL
(SELECT name, 'admin' as type FROM admins)
ORDER BY name;
```

### 联合查询应用

```sql
-- 合并不同条件的结果
(SELECT id, name, '员工' as role FROM employees WHERE status = 'active')
UNION
(SELECT id, name, '访客' as role FROM visitors WHERE visit_date = CURDATE())
ORDER BY role, name;
```

## 连接查询优化

### 使用索引

```sql
-- 确保连接字段有索引
CREATE INDEX idx_user_dept ON users(department_id);
CREATE INDEX idx_order_user ON orders(user_id);
```

### 避免全表扫描

```sql
-- 避免
SELECT * FROM users u
LEFT JOIN orders o ON 1=1;

-- 推荐：明确连接条件
SELECT * FROM users u
LEFT JOIN orders o ON u.id = o.user_id;
```

### 小表驱动大表

```sql
-- MySQL 会自动优化，但可以手动指定
SELECT * FROM small_table s
INNER JOIN large_table l ON s.id = l.small_id;

-- 使用 STRAIGHT_JOIN 强制顺序
SELECT STRAIGHT_JOIN * FROM users
INNER JOIN orders ON users.id = orders.user_id;
```

## 综合示例

```sql
SELECT
    d.name as department,
    COUNT(DISTINCT u.id) as user_count,
    COUNT(o.id) as order_count,
    COALESCE(SUM(o.amount), 0) as total_amount,
    COALESCE(AVG(o.amount), 0) as avg_amount
FROM departments d
LEFT JOIN users u ON d.id = u.department_id
LEFT JOIN orders o ON u.id = o.user_id
WHERE d.status = 'active'
GROUP BY d.id, d.name
HAVING user_count > 0
ORDER BY total_amount DESC;
```

## 小结

| 查询类型 | 关键字 | 适用场景 |
|---------|--------|----------|
| **内连接** | INNER JOIN | 只获取两表匹配数据 |
| **左连接** | LEFT JOIN | 保留左表全部数据 |
| **右连接** | RIGHT JOIN | 保留右表全部数据 |
| **子查询** | IN/EXISTS | 复杂条件筛选 |
| **联合查询** | UNION | 合并多个结果集 |
| **优化要点** | 索引、避免笛卡尔积 | 提升查询性能 |