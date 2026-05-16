---
title: MySQL数据库基础操作
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-04-22T00:00:00.000+08:00
slug: mysql-database-operations
featured: false
draft: false
series: mysql
tags:
  - MySQL
  - 数据库
  - SQL
description: "MySQL体系结构、数据类型和数据库、表、记录的基本操作语句"
---

> MySQL 基本操作包括库、表、记录的增删改查。

## 体系结构

| 层级       | 说明                                    |
| ---------- | --------------------------------------- |
| **连接层** | 负责连接管理、认证和权限校验            |
| **服务层** | 负责 SQL 解析、优化、缓存和内置函数     |
| **引擎层** | 通过存储引擎读写数据，如 InnoDB、MyISAM |
| **物理层** | 数据文件、日志文件和文件系统            |

## 数据类型

| 类型       | 说明       | 示例                  |
| ---------- | ---------- | --------------------- |
| `INT`      | 整数       | `1`, `100`            |
| `VARCHAR`  | 可变字符串 | `'hello'`             |
| `TEXT`     | 长文本     | 文章内容              |
| `DATE`     | 日期       | `2024-01-01`          |
| `DATETIME` | 日期时间   | `2024-01-01 10:00:00` |
| `FLOAT`    | 浮点数     | `3.14`                |
| `DECIMAL`  | 精确小数   | `3.14`                |

## 数据库操作

```sql
-- 创建数据库
CREATE DATABASE dbname;

-- 查看数据库
SHOW DATABASES;

-- 选择数据库
USE dbname;

-- 删除数据库
DROP DATABASE dbname;

-- 修改数据库字符集
ALTER DATABASE dbname CHARACTER SET utf8mb4;
```

## 表操作

### 创建表

```sql
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE,
    age INT DEFAULT 18,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 查看表

```sql
SHOW TABLES;
DESC users;
SHOW CREATE TABLE users;
```

### 修改表

```sql
-- 添加字段
ALTER TABLE users ADD COLUMN phone VARCHAR(20);

-- 修改字段
ALTER TABLE users MODIFY COLUMN phone INT;

-- 删除字段
ALTER TABLE users DROP COLUMN phone;

-- 重命名表
RENAME TABLE users TO new_users;
```

### 删除表

```sql
DROP TABLE users;
TRUNCATE TABLE users;
```

## 记录操作

### INSERT

```sql
-- 单条插入
INSERT INTO users (name, email) VALUES ('张三', 'zhang@example.com');

-- 批量插入
INSERT INTO users (name, email) VALUES
('李四', 'li@example.com'),
('王五', 'wang@example.com');
```

### SELECT

```sql
-- 基本查询
SELECT * FROM users;

-- 条件查询
SELECT name, email FROM users WHERE age > 18;

-- 排序分页
SELECT * FROM users ORDER BY created_at DESC LIMIT 10;
```

### UPDATE

```sql
UPDATE users SET age = 20 WHERE id = 1;
```

### DELETE

```sql
DELETE FROM users WHERE id = 1;
DELETE FROM users WHERE age < 18;
```

## 小结

- **架构**：连接层、服务层、引擎层、物理层
- **数据类型**：INT、VARCHAR、DATE、DECIMAL 等
- **库**：CREATE/DROP DATABASE
- **表**：CREATE/DROP/ALTER TABLE
- **记录**：INSERT/SELECT/UPDATE/DELETE
