---
title: MySQL版本区别及管理
author: 程序员
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-04-22T00:00:00.000+08:00
slug: mysql-version-differences
featured: false
draft: false
tags:
  - MySQL
  - 数据库
  - 版本
description: 'MySQL各版本区别及管理'
---

> MySQL 是最流行的开源关系型数据库之一，了解各版本区别有助于选择合适的版本进行开发和部署。

## 版本对比

### MySQL 5.7 vs 8.0

| 特性 | MySQL 5.7 | MySQL 8.0 |
|------|-----------|-----------|
| **默认存储引擎** | InnoDB | InnoDB |
| **字符集** | latin1 | utf8mb4 |
| **CTE 支持** | 不支持 | 支持 |
| **窗口函数** | 不支持 | 支持 |
| **JSON 支持** | 基本 | 完整 |
| **角色管理** | 不支持 | 支持 |
| **隐藏索引** | 不支持 | 支持 |
| **直方图统计** | 不支持 | 支持 |

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

### YUM 安装

```bash
yum install https://dev.mysql.com/get/mysql80-community-release-el7-7.noarch.rpm
yum install mysql-community-server
systemctl start mysqld
systemctl enable mysqld
```

### Docker 安装

```bash
docker run -d \
  --name mysql \
  -p 3306:3306 \
  -e MYSQL_ROOT_PASSWORD=secret \
  -e MYSQL_DATABASE=myapp \
  -v mysql-data:/var/lib/mysql \
  mysql:8.0
```

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