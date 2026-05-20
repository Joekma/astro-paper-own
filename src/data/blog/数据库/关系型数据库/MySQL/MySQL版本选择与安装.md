---
title: MySQL版本选择与安装
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-04-22T00:00:00.000+08:00
slug: mysql-version-selection
featured: false
draft: false
series: mysql
seriesOrder: 1
tags:
  - MySQL
  - 数据库
  - 版本
  - 安装
description: "MySQL版本选择、Windows/Linux/Docker安装和配置管理方法"
---

> MySQL 是最流行的开源关系型数据库之一，了解各版本区别有助于选择合适的版本进行开发和部署。

## MySQL 简介

| 特点             | 说明                                  |
| ---------------- | ------------------------------------- |
| **开源免费**     | 社区版可免费使用                      |
| **跨平台**       | 支持 Windows、Linux、macOS            |
| **生态成熟**     | 客户端、驱动、监控和备份工具丰富      |
| **存储引擎丰富** | 默认 InnoDB，也支持 MyISAM、Memory 等 |

## 版本对比

### MySQL 5.7 vs 8.0

| 特性             | MySQL 5.7 | MySQL 8.0 |
| ---------------- | --------- | --------- |
| **默认存储引擎** | InnoDB    | InnoDB    |
| **字符集**       | latin1    | utf8mb4   |
| **CTE 支持**     | 不支持    | 支持      |
| **窗口函数**     | 不支持    | 支持      |
| **JSON 支持**    | 基本      | 完整      |
| **角色管理**     | 不支持    | 支持      |
| **隐藏索引**     | 不支持    | 支持      |
| **直方图统计**   | 不支持    | 支持      |

## MySQL 8.0 新特性

### CTE（公用表表达式）

```sql
WITH cte AS (
    SELECT department_id, COUNT(*) as emp_count
    FROM employees
    GROUP BY department_id
)
SELECT * FROM cte WHERE emp_count > 5;
```

### 窗口函数

```sql
SELECT
    employee_id,
    salary,
    RANK() OVER (PARTITION BY department_id ORDER BY salary DESC) as rank,
    AVG(salary) OVER (PARTITION BY department_id) as avg_salary
FROM employees;
```

### JSON 函数增强

```sql
SELECT JSON_OBJECT(
    'id', id,
    'name', name,
    'metadata', JSON_MERGE_PATCH(metadata, '{"status":"active"}')
) FROM users;
```

## 安装管理

### Windows 图形化安装

1. 访问 [MySQL Community Downloads](https://dev.mysql.com/downloads/mysql/)，下载 MySQL Installer for Windows。
2. 选择 **Custom** 或 **Developer Default** 安装模式。
3. 勾选 **MySQL Server 8.0.x**，确认安装路径。
4. 配置端口 `3306`，设置 root 用户密码。
5. 服务名通常为 `MySQL80`，可按需勾选开机自启。

验证安装：

```bash
mysql -u root -p
```

### Windows 解压版安装

在 MySQL 根目录创建 `my.ini`：

```ini
[mysqld]
port=3306
basedir=D:\MySQL\mysql-8.0.x-winx64
datadir=D:\MySQL\mysql-8.0.x-winx64\data
max_connections=200
character-set-server=utf8mb4
default-storage-engine=INNODB
```

初始化并启动：

```bash
mysqld --initialize --console
mysqld --install
net start mysql
mysql -u root -p
ALTER USER 'root'@'localhost' IDENTIFIED BY '新密码';
```

### Linux YUM 安装

```bash
sudo rpm -Uvh https://dev.mysql.com/get/mysql80-community-release-el7-7.noarch.rpm
sudo yum install -y mysql-community-server
sudo systemctl start mysqld
sudo systemctl enable mysqld
sudo grep 'temporary password' /var/log/mysqld.log
mysql -u root -p
ALTER USER 'root'@'localhost' IDENTIFIED BY '新密码';
```

### Docker 安装

```bash
docker pull mysql:8.0

docker run -d \
  --name mysql \
  -p 3306:3306 \
  -e MYSQL_ROOT_PASSWORD=secret \
  -e MYSQL_DATABASE=myapp \
  -v mysql-data:/var/lib/mysql \
  mysql:8.0
```

### 常用命令

| 命令                      | 说明           |
| ------------------------- | -------------- |
| `mysql -u root -p`        | 登录 MySQL     |
| `SHOW DATABASES;`         | 查看所有数据库 |
| `CREATE DATABASE dbname;` | 创建数据库     |
| `USE dbname;`             | 选择数据库     |
| `SHOW TABLES;`            | 查看所有表     |
| `EXIT` 或 `QUIT`          | 退出           |

## 配置管理

### 配置文件

```bash
# 查找配置文件
mysql --help --verbose | grep my.cnf

# 主配置文件位置
/etc/my.cnf
/etc/mysql/my.cnf
~/.my.cnf
```

### 常用配置

```ini
[mysqld]
max_connections = 200
innodb_buffer_pool_size = 1G
innodb_log_file_size = 256M
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow.log
long_query_time = 2
```

## 小结

- **MySQL 8.0**：推荐新项目使用，功能更强
- **5.7**：稳定版本，适合旧系统迁移
- **选择依据**：功能需求、兼容性、社区支持
- **安装方式**：本机学习可用图形化安装，服务部署优先考虑 Linux 或 Docker
