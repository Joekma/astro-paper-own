---
title: MySQL常见错误与解决
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-04-22T00:00:00.000+08:00
slug: mysql-error-solutions
featured: false
draft: false
series: mysql
tags:
  - MySQL
  - 数据库
  - 报错解决
  - 高可用
description: 'MySQL常见错误与解决方案汇总'
---

> MySQL 常见错误与解决方案汇总。

## 连接错误

### 1045 - 权限拒绝

```bash
# 错误：Access denied for user 'root'@'localhost'
mysql -u root -p

# 解决：重置密码
sudo systemctl stop mysqld
sudo mysqld_safe --skip-grant-tables &
mysql -u root

UPDATE mysql.user SET authentication_string=PASSWORD('新密码') WHERE User='root';
FLUSH PRIVILEGES;
```

### 2003 - 连接超时

```bash
# 错误：Can't connect to MySQL server
# 解决：检查服务状态
sudo systemctl start mysqld
sudo systemctl status mysqld
```

## 配置错误

### 1067 - 服务启动失败

```bash
# 解决：检查配置文件
cat /var/log/mysqld.log
my.ini 配置是否正确
```

## 主从复制错误

### 1236 - 主从复制中断

```bash
# 错误：Got fatal error 1236
# 解决：
STOP SLAVE;
CHANGE MASTER TO MASTER_LOG_FILE='mysql-bin.000001', MASTER_LOG_POS=xxx;
START SLAVE;
```

## 性能错误

### 1040 - 连接数过多

```sql
-- 查看连接数
SHOW STATUS LIKE 'Threads_connected';
SHOW PROCESSLIST;

-- 解决：增加连接数
SET GLOBAL max_connections = 500;
```

## 备份恢复错误

### 1062 - 重复键错误

```bash
# 在恢复备份时忽略重复
mysqlimport --ignore
```

## 小结

- **连接错误**：权限、服务状态
- **配置错误**：检查日志
- **主从错误**：重新定位复制位置
- **性能错误**：优化连接数
