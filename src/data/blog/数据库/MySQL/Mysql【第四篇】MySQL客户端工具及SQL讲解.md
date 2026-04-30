---
title: MySQL客户端工具
author: 程序员
pubDatetime: 2024-08-13T00:00:00.000+08:00
updated: 2026-04-22T00:00:00.000+08:00
slug: mysql-client-tools
description: 'MySQL客户端工具及SQL命令详解'
tags:
  - MySQL
  - 数据库
  - 客户端
category: 数据库
draft: false
language: zh-CN
---

> MySQL 客户端工具用于连接和管理数据库。

## 命令行工具

### mysql

```bash
mysql -u root -p
mysql -u root -p dbname
mysql -u root -p < backup.sql
```

### mysqldump

```bash
mysqldump -u root -p dbname > backup.sql
```

## GUI 工具

| 工具 | 说明 |
|------|------|
| MySQL Workbench | 官方工具 |
| Navicat | 付费，功能强大 |
| DBeaver | 免费开源 |
| phpMyAdmin | Web 界面 |

## 小结

- **mysql**：命令行客户端
- **mysqldump**：备份工具
- **GUI**：可视化操作
