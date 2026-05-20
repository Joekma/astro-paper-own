---
title: Docker 使用：容器运行、生命周期管理和基本操作
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-05-17T00:00:00.000+08:00
slug: docker-usage-tutorial
description: '讲解 Docker 容器运行、生命周期、端口映射、日志查看和进入容器等基础操作。'
tags:
  - DevOps
  - Docker
  - 容器
draft: false
series: Docker
seriesOrder: 4
language: zh-CN
---

## 概述

容器是镜像的运行实例。学习 Docker 的第一步，是理解 `docker run` 如何从镜像创建容器，以及容器启动、停止、删除、查看日志和端口映射的基本流程。

## 学习路线

初学时可以按这个顺序练习：先运行一次性容器，再运行后台服务，随后学习端口映射、日志查看、进入容器和清理资源。等这些动作熟悉后，再进入镜像构建、数据卷和 Compose。

## Hello World

```bash
docker run --rm hello-world
```

这个命令会拉取 `hello-world` 镜像，创建一个临时容器并输出验证信息。`--rm` 表示容器退出后自动删除，适合一次性测试。

## 运行交互式容器

```bash
docker run --rm -it ubuntu:24.04 bash
```

| 参数 | 说明 |
|------|------|
| `--rm` | 容器退出后自动删除 |
| `-i` | 保持标准输入打开 |
| `-t` | 分配伪终端 |
| `ubuntu:24.04` | 指定要运行的镜像和标签 |
| `bash` | 容器启动后执行的命令 |

退出容器：

```bash
exit
```

## 后台运行容器

```bash
docker run -d --name demo-nginx nginx:1.27-alpine
```

查看运行中的容器：

```bash
docker ps
```

查看所有容器，包括已停止的容器：

```bash
docker ps -a
```

查看日志：

```bash
docker logs demo-nginx
docker logs -f demo-nginx
```

## 停止、启动与删除

```bash
# 停止容器
docker stop demo-nginx

# 启动已停止的容器
docker start demo-nginx

# 重启容器
docker restart demo-nginx

# 删除已停止的容器
docker rm demo-nginx
```

如果容器仍在运行，删除前需要先停止，或使用 `docker rm -f` 强制删除。强制删除会直接终止容器进程，应谨慎使用。

## 运行 Web 应用

### 随机端口映射

```bash
docker run -d --name web-demo -P nginx:1.27-alpine
docker port web-demo
```

`-P` 会把镜像声明的暴露端口映射到主机随机端口。

### 指定端口映射

```bash
docker run -d --name web-demo -p 8080:80 nginx:1.27-alpine
```

访问：

```bash
curl http://localhost:8080
```

`-p 8080:80` 表示主机 `8080` 端口转发到容器内 `80` 端口。

## 进入容器

```bash
docker exec -it web-demo sh
```

不同镜像内置的 Shell 不同。`nginx:alpine` 通常使用 `sh`，Ubuntu/Debian 系镜像通常可以使用 `bash`。

## 查看容器信息

```bash
# 查看容器内进程
docker top web-demo

# 查看容器详细配置
docker inspect web-demo

# 查看容器资源使用
docker stats web-demo
```

## 容器生命周期小结

常见流程是：

```bash
docker pull nginx:1.27-alpine
docker run -d --name web-demo -p 8080:80 nginx:1.27-alpine
docker logs -f web-demo
docker exec -it web-demo sh
docker stop web-demo
docker rm web-demo
```

容器默认不等于持久数据存储。数据库、上传文件和业务状态应放在数据卷或外部存储中，不要只保存在容器可写层里。

排查容器问题时优先看三处：`docker logs` 看应用输出，`docker inspect` 看配置和挂载，`docker stats` 看资源使用。
