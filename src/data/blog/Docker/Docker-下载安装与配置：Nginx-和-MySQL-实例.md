---
title: Docker 下载安装与配置：Nginx 和 MySQL 实例
author: 程序员
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-04-22T00:00:00.000+08:00
slug: docker-download-install-examples
description: '详细讲解Docker中安装和配置Nginx、MySQL等常用服务的方法。'
tags:
  - Docker
  - Nginx
  - MySQL
draft: false
language: zh-CN
---

## 概述

Docker 容器化技术已成为现代应用部署的标准方式。本教程将详细介绍如何在 Docker 中安装和配置 Nginx、MySQL 等常用服务，帮助你快速上手容器化部署。

## 安装 Nginx

### 方法一：docker pull（推荐）

首先，查找 Docker Hub 上的 nginx 镜像：

```bash
docker search nginx
```

拉取官方镜像：

```bash
docker pull nginx
```

等待下载完成后，查看本地镜像：

```bash
docker images nginx
```

### 方法二：通过 Dockerfile 构建

创建目录结构：

```bash
mkdir -p ~/nginx/www ~/nginx/logs ~/nginx/conf
```

| 目录 | 用途 |
|------|------|
| `www` | 映射为容器虚拟目录 |
| `logs` | 映射为容器日志目录 |
| `conf` | 配置文件映射 |

### 运行 Nginx 容器

```bash
docker run -p 80:80 --name mynginx \
  -v $PWD/www:/www \
  -v $PWD/conf/nginx.conf:/etc/nginx/nginx.conf \
  -v $PWD/logs:/wwwlogs \
  -d nginx
```

| 参数 | 说明 |
|------|------|
| `-p 80:80` | 将容器端口映射到主机 |
| `--name mynginx` | 容器命名 |
| `-v $PWD/www:/www` | 挂载网站目录 |
| `-v $PWD/conf/nginx.conf:/etc/nginx/nginx.conf` | 挂载配置文件 |
| `-v $PWD/logs:/wwwlogs` | 挂载日志目录 |
| `-d` | 后台运行 |

### 查看容器状态

```bash
docker ps
```

## 安装 MySQL

### 方法一：docker pull

查找镜像：

```bash
docker search mysql
```

拉取指定版本：

```bash
docker pull mysql:5.6
```

### 方法二：通过 Dockerfile 构建

创建目录：

```bash
mkdir -p ~/mysql/data ~/mysql/logs ~/mysql/conf
```

| 目录 | 用途 |
|------|------|
| `data` | 数据文件存放路径 |
| `logs` | 日志目录 |
| `conf` | 配置文件 |

### 运行 MySQL 容器

```bash
docker run -p 3306:3306 --name mysql \
  -v $PWD/data:/var/lib/mysql \
  -v $PWD/conf:/etc/mysql \
  -v $PWD/logs:/var/log/mysql \
  -e MYSQL_ROOT_PASSWORD=123456 \
  -d mysql:5.6
```

| 参数 | 说明 |
|------|------|
| `-p 3306:3306` | 映射 MySQL 默认端口 |
| `-e MYSQL_ROOT_PASSWORD=123456` | 设置 root 密码 |
| `-v $PWD/data:/var/lib/mysql` | 挂载数据目录 |
| `-v $PWD/conf:/etc/mysql` | 挂载配置目录 |
| `-v $PWD/logs:/var/log/mysql` | 挂载日志目录 |

## 常用操作命令

```bash
# 查看运行中的容器
docker ps

# 查看所有容器（包括已停止）
docker ps -a

# 停止容器
docker stop mynginx

# 启动容器
docker start mynginx

# 进入容器
docker exec -it mynginx /bin/bash

# 查看容器日志
docker logs -f mynginx

# 删除容器
docker rm mynginx
```

## 小结

通过 Docker，我们可以快速部署 Nginx、MySQL 等常用服务。关键点：

- 使用 `-p` 参数进行端口映射
- 使用 `-v` 参数进行目录挂载，实现数据持久化
- 使用 `-e` 参数设置环境变量
- 使用 `-d` 参数后台运行容器