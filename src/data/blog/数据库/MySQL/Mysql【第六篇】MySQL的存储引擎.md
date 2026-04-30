---
title: MySQL存储引擎
author: 程序员
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-04-22T00:00:00.000+08:00
slug: mysql-storage-engines
featured: false
draft: false
tags:
  - MySQL
  - 数据库
  - 存储引擎
description: 'MySQL存储引擎介绍，包括InnoDB、MyISAM、Memory等'
---

> 存储引擎决定数据的存储方式。

## 常用引擎

| 引擎 | 特点 |
|------|------|
| **InnoDB** | 事务支持、行锁 |
| **MyISAM** | 表锁、全文索引 |
| **Memory** | 内存存储 |
| **Archive** | 压缩存储 |

## 设置引擎

```sql
CREATE TABLE t (id INT) ENGINE=InnoDB;
ALTER TABLE t ENGINE=MyISAM;
```

## 小结

- **InnoDB**：默认引擎，事务支持
- **MyISAM**：高速读取
- **Memory**：临时表
