---
title: Docker 下载安装实例
author: 程序员
pubDatetime: 2024-08-13T00:00:00.000+08:00
updated: 2026-04-22T00:00:00.000+08:00
slug: docker-download-install-examples
description: 'Docker 下载安装实例，包含 Nginx 和 MySQL 的安装配置教程'
tags:
  - Docker
category: Docker
draft: false
language: zh-CN
---

## 安装 Nginx

### 方法一：docker pull（推荐）

查找 Docker Hub 上的 nginx 镜像：

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

## 使用 nginx 镜像

### 运行容器

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
| `-v` | 挂载卷 |

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