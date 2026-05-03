---
title: MySQL安装
author: 程序员
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-04-22T00:00:00.000+08:00
slug: mysql-installation-guide
featured: false
draft: false
tags:
  - MySQL
  - 数据库
  - 安装
description: 'MySQL数据库安装，包括Windows、Linux系统'
---

> MySQL 是全球最流行的开源关系型数据库管理系统。

## MySQL 简介

### 主要特点

| 特点 | 说明 |
|------|------|
| **开源免费** | 遵循 GPL 协议 |
| **跨平台** | Windows、Linux、macOS |
| **性能优异** | 高并发读写 |
| **存储引擎丰富** | InnoDB、MyISAM、MEMORY |
| **多语言支持** | PHP、Java、Python、Node.js |

## Windows 安装

### 方法一：图形化安装

#### 1. 下载安装包

访问 [MySQL Community Downloads](https://dev.mysql.com/downloads/mysql/)，下载 MySQL Installer for Windows。

#### 2. 安装步骤

1. 双击 `.msi` 文件启动安装向导
2. 选择 **Custom**（自定义安装）
3. 选择 **MySQL Server 8.0.x**
4. 确认安装路径（建议 `D:\MySQL\MySQL Server 8.0`）
5. 点击 **Execute** 开始安装

#### 3. 配置向导

1. 选择 **Standalone MySQL Server**
2. 端口：**3306**（默认）
3. 设置 root 用户密码
4. 服务名：`MySQL80`，勾选开机自启

#### 4. 验证安装

```bash
# 登录 MySQL
mysql -u root -p

# 输入密码后出现 mysql> 提示符即成功
```

### 方法二：解压版安装

#### 1. 下载解压版

从官网下载 Windows ZIP Archive 版本，解压到 `D:\MySQL\mysql-8.0.x-winx64`。

#### 2. 配置环境变量

1. 右键 **此电脑** → **属性** → **高级系统设置**
2. 编辑 **Path**，添加 `D:\MySQL\mysql-8.0.x-winx64\bin`

#### 3. 创建配置文件

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

#### 4. 初始化和启动

```bash
# 初始化（生成临时密码）
mysqld --initialize --console

# 安装服务
mysqld --install

# 启动服务
net start mysql

# 登录（使用临时密码）
mysql -u root -p

# 修改密码
ALTER USER 'root'@'localhost' IDENTIFIED BY '新密码';
```

## Linux 安装（CentOS 7）

### 使用 Yum 安装

```bash
# 安装 MySQL Yum 源
sudo rpm -Uvh https://dev.mysql.com/get/mysql80-community-release-el7-7.noarch.rpm

# 安装 MySQL
sudo yum install -y mysql-community-server

# 启动服务
sudo systemctl start mysqld

# 开机自启
sudo systemctl enable mysqld

# 获取临时密码
sudo grep 'temporary password' /var/log/mysqld.log

# 登录
mysql -u root -p

# 修改密码
ALTER USER 'root'@'localhost' IDENTIFIED BY '新密码';
```

## Docker 安装（推荐）

```bash
# 拉取镜像
docker pull mysql:8.0

# 创建容器
docker run -d \
  --name mysql \
  -p 3306:3306 \
  -e MYSQL_ROOT_PASSWORD=your_password \
  -e MYSQL_DATABASE=testdb \
  -v /data/mysql:/var/lib/mysql \
  mysql:8.0

# 连接 MySQL
mysql -h 127.0.0.1 -u root -p
```

## 常用命令

| 命令 | 说明 |
|------|------|
| `mysql -u root -p` | 登录 MySQL |
| `SHOW DATABASES;` | 查看所有数据库 |
| `CREATE DATABASE dbname;` | 创建数据库 |
| `USE dbname;` | 选择数据库 |
| `SHOW TABLES;` | 查看所有表 |
| `EXIT` 或 `QUIT` | 退出 |

## 小结

- **Windows**：图形化安装或解压版
- **Linux**：Yum 安装或编译安装
- **Docker**：最简单快捷的安装方式
- **默认端口**：3306
