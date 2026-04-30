---
title: InnoDB与MyISAM的区别
author: 程序员
pubDatetime: 2024-08-13T00:00:00.000+08:00
updated: 2026-04-22T00:00:00.000+08:00
slug: mysql-innodb-myisam-comparison
description: 'MySQL InnoDB与MyISAM存储引擎的区别对比'
tags:
  - MySQL
  - 数据库
  - 存储引擎
  - InnoDB
  - MyISAM
category: 数据库
draft: false
language: zh-CN
---

> InnoDB 和 MyISAM 是 MySQL 最常用的存储引擎。

## 区别对比

| 特性 | InnoDB | MyISAM |
|------|--------|--------|
| **事务** | 支持 | 不支持 |
| **外键** | 支持 | 不支持 |
| **锁** | 行锁 | 表锁 |
| **全文索引** | 5.6+ 支持 | 支持 |
| **存储空间** | 较大 | 较小 |
| **崩溃恢复** | 自动恢复 | 较慢 |

## 选择建议

- **InnoDB**：事务需求、外键、高并发
- **MyISAM**：只读、全文搜索、低内存

## 小结

- **InnoDB**：事务型应用首选
- **MyISAM**：只读场景可用
