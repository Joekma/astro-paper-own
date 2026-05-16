---
title: MySQL备份与恢复策略
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-04-22T00:00:00.000+08:00
slug: mysql-backup-recovery
featured: false
draft: false
series: mysql
tags:
  - MySQL
  - 数据库
  - 备份
  - 恢复
description: "MySQL备份与恢复方法"
---

> 数据库备份是保障数据安全的重要手段。

## 逻辑备份

### mysqldump

```bash
# 备份单个数据库
mysqldump -u root -p dbname > backup.sql

# 备份所有数据库
mysqldump -u root -p --all-databases > all_backup.sql

# 备份指定表
mysqldump -u root -p dbname users orders > tables.sql
```

## 物理备份

### 冷备份

```bash
# 停止 MySQL
sudo systemctl stop mysqld

# 复制数据文件
cp -r /var/lib/mysql /backup/mysql

# 重启 MySQL
sudo systemctl start mysqld
```

### XtraBackup

```bash
# 安装
yum install percona-xtrabackup

# 全量备份
xtrabackup --backup --target-dir=/backup/full

# 恢复
xtrabackup --prepare --target-dir=/backup/full
xtrabackup --copy-back --target-dir=/backup/full
```

## 数据恢复

### 恢复逻辑备份

```bash
mysql -u root -p dbname < backup.sql

# 恢复所有数据库
mysql -u root -p < all_backup.sql
```

## 增量备份

```bash
# 基于 binlog 的增量备份
mysqlbinlog --start-datetime='2024-01-01' mysql-bin.000001 > increment.sql
```

## 小结

- **逻辑备份**：mysqldump，跨平台
- **物理备份**：文件复制，快速
- **增量备份**：binlog，节省空间
