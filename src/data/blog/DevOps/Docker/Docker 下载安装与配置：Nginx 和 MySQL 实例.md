---
title: Docker 下载安装与配置：Nginx 和 MySQL 实例
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-05-17T00:00:00.000+08:00
slug: docker-download-install-examples
description: '通过 Nginx 和 MySQL 示例讲解 Docker 镜像拉取、Dockerfile 构建、端口映射、数据卷和环境变量配置。'
tags:
  - DevOps
  - Docker
  - Nginx
  - MySQL
draft: false
series: Docker
language: zh-CN
---

## 概述

在 Docker 中“安装服务”通常不是进入容器手动安装软件，而是选择合适的镜像、配置运行参数，并把需要持久保存的数据放到卷中。

本文以 Nginx 和 MySQL 为例，演示两种常见方式：

1. 直接使用官方镜像。
2. 编写 Dockerfile 构建自定义镜像。

## 示例目标

Nginx 代表无状态服务，重点在镜像版本、端口映射和静态文件交付。MySQL 代表有状态服务，重点在数据卷、密码、配置文件和备份策略。两类服务的运行方式不同，不能用同一套心智模型处理。

## Nginx 示例

### 拉取官方镜像

```bash
docker pull nginx:1.27-alpine
docker images nginx
```

### 直接运行容器

```bash
docker run -d --name my-nginx \
  -p 8080:80 \
  nginx:1.27-alpine
```

访问验证：

```bash
curl http://localhost:8080
```

### 挂载静态文件

创建目录：

```bash
mkdir -p nginx-demo/html nginx-demo/conf.d
```

`nginx-demo/html/index.html` 示例：

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <title>Nginx on Docker</title>
  </head>
  <body>
    <h1>Hello Docker</h1>
  </body>
</html>
```

运行：

```bash
docker run -d --name my-nginx \
  -p 8080:80 \
  -v "$PWD/nginx-demo/html:/usr/share/nginx/html:ro" \
  nginx:1.27-alpine
```

| 参数 | 说明 |
|------|------|
| `-p 8080:80` | 主机 `8080` 映射到容器 `80` |
| `-v ...:ro` | 只读挂载静态文件目录 |
| `--name my-nginx` | 指定容器名称 |
| `-d` | 后台运行 |

### 使用 Dockerfile 构建

`Dockerfile`：

```dockerfile
FROM nginx:1.27-alpine
COPY ./html/ /usr/share/nginx/html/
```

构建并运行：

```bash
docker build -t my-nginx:1.0 .
docker run -d --name my-nginx -p 8080:80 my-nginx:1.0
```

如果只是替换静态文件，Dockerfile 比挂载目录更适合交付；如果是本地开发调试，挂载目录更方便。

## MySQL 示例

### 拉取官方镜像

```bash
docker pull mysql:8.4
```

MySQL 8.4 是长期支持版本，更适合作为新示例。除非维护历史系统，否则不建议再用 MySQL 5.6 作为教程默认版本。

### 使用命名卷运行

```bash
docker volume create mysql-data

docker run -d --name mysql-demo \
  -p 3306:3306 \
  -v mysql-data:/var/lib/mysql \
  -e MYSQL_ROOT_PASSWORD='change_me_to_a_strong_password' \
  -e MYSQL_DATABASE=app \
  mysql:8.4
```

| 参数 | 说明 |
|------|------|
| `-p 3306:3306` | 映射 MySQL 默认端口 |
| `-v mysql-data:/var/lib/mysql` | 使用命名卷持久化数据 |
| `MYSQL_ROOT_PASSWORD` | 设置 root 密码，示例值必须替换 |
| `MYSQL_DATABASE` | 初始化时创建数据库 |

查看日志：

```bash
docker logs -f mysql-demo
```

连接测试：

```bash
docker exec -it mysql-demo mysql -uroot -p
```

### 使用自定义配置

创建配置目录：

```bash
mkdir -p mysql-demo/conf.d
```

`mysql-demo/conf.d/custom.cnf`：

```ini
[mysqld]
character-set-server=utf8mb4
collation-server=utf8mb4_0900_ai_ci
```

运行时挂载配置：

```bash
docker run -d --name mysql-demo \
  -p 3306:3306 \
  -v mysql-data:/var/lib/mysql \
  -v "$PWD/mysql-demo/conf.d:/etc/mysql/conf.d:ro" \
  -e MYSQL_ROOT_PASSWORD='change_me_to_a_strong_password' \
  mysql:8.4
```

## 常用操作命令

```bash
# 查看运行中的容器
docker ps

# 查看所有容器
docker ps -a

# 停止容器
docker stop my-nginx mysql-demo

# 启动容器
docker start my-nginx mysql-demo

# 查看日志
docker logs -f my-nginx

# 删除已停止容器
docker rm my-nginx

# 查看数据卷
docker volume ls
```

## 小结

Docker 部署服务时要分清三件事：镜像负责软件环境，容器负责运行实例，数据卷负责持久化数据。Nginx 这类无状态服务可以很轻量地替换镜像；MySQL 这类有状态服务必须明确数据卷、密码和备份策略。

上线前至少确认端口没有冲突、数据卷路径可备份、环境变量未泄露到仓库、镜像标签不是随意漂移的 `latest`。
