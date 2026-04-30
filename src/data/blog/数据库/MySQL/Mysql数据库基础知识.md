---
title: MySQL数据库基础知识
author: 程序员
pubDatetime: 2024-08-13T00:00:00.000+08:00
updated: 2026-04-22T00:00:00.000+08:00
slug: mysql-database-basics
description: 'MySQL数据库基础知识，包括安装、数据类型和基本操作'
tags:
  - MySQL
  - 数据库
  - 基础知识
category: 数据库
draft: false
language: zh-CN
---

> MySQL 是最流行的开源关系型数据库。

## 数据类型

| 类型 | 说明 | 示例 |
|------|------|------|
| INT | 整数 | 1, 100 |
| VARCHAR | 可变字符串 | 'hello' |
| TEXT | 长文本 | 文章内容 |
| DATE | 日期 | 2024-01-01 |
| DATETIME | 日期时间 | 2024-01-01 10:00:00 |
| FLOAT | 浮点数 | 3.14 |
| DECIMAL | 精确小数 | 3.14 |

## 基本操作

```sql
CREATE DATABASE dbname;
SHOW DATABASES;
USE dbname;
DROP DATABASE dbname;
```

## 小结

- **数据类型**：INT、VARCHAR、DATE 等
- **基本操作**：增删改查
