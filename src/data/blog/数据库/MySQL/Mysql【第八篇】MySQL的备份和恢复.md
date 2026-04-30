---
title: MySQL备份和恢复
author: 程序员
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-04-22T00:00:00.000+08:00
slug: mysql-backup-restore
featured: false
draft: false
tags:
  - MySQL
  - 数据库
  - 备份
  - 恢复
description: 'MySQL备份和恢复方法详解'
---

> 数据库备份是数据安全的重要保障。

## 备份方法

```bash
# 全量备份
mysqldump -u root -p dbname > full.sql

# 恢复
mysql -u root -p dbname < full.sql
```

## 增量备份

```bash
# 基于 binlog
mysqlbinlog mysql-bin.000001 > increment.sql
```

## 小结

- **全量备份**：mysqldump
- **增量备份**：binlog
