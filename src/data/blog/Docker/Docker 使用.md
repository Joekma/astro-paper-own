---
title: Docker 使用
author: 程序员
pubDatetime: 2024-08-13T00:00:00.000+08:00
updated: 2026-04-22T00:00:00.000+08:00
slug: docker-usage-tutorial
description: 'Docker 使用教程，包括容器运行、生命周期管理和基本操作'
tags:
  - Docker
category: Docker
draft: false
language: zh-CN
---

## Hello World

Docker 允许在容器内运行应用程序，使用 `docker run` 命令在容器内运行应用程序。

```bash
docker run ubuntu:15.10 /bin/echo "Hello world"
```

> **参数说明：**
> - `docker`：Docker 的二进制执行文件
> - `run`：运行一个容器
> - `ubuntu:15.10`：指定要运行的镜像
> - `/bin/echo`：在容器里执行的命令

## 运行交互式容器

通过 `-i -t` 参数，让容器实现"对话"能力：

```bash
docker run -i -t ubuntu:15.10 /bin/bash
```

| 参数 | 说明 |
|------|------|
| `-t` | 在容器内指定伪终端 |
| `-i` | 允许对容器标准输入进行交互 |

> 使用 `exit` 或 `Ctrl+D` 退出容器。

## 后台运行容器

创建以进程方式运行的容器：

```bash
docker run -d ubuntu:15.10 /bin/sh -c "while true; do echo hello world; sleep 1; done"
```

查看运行中的容器：

```bash
docker ps
```

查看容器日志：

```bash
docker logs <容器ID/名称>
```

## 停止容器

```bash
docker stop <容器ID/名称>
```

## Docker 客户端

直接输入 `docker` 查看所有命令选项：

```bash
docker
```

查看具体命令帮助：

```bash
docker stats --help
```

## 运行 Web 应用

拉取镜像并运行 Python Flask 应用：

```bash
docker pull training/webapp
docker run -d -P training/webapp python app.py
```

| 参数 | 说明 |
|------|------|
| `-d` | 后台运行 |
| `-P` | 将容器内部端口映射到主机 |

## 查看 Web 应用容器

```bash
docker ps
```

### 端口映射

`PORTS` 显示格式：`0.0.0.0:32769->5000/tcp`

### 自定义端口映射

```bash
docker run -d -p 5000:5000 training/webapp python app.py
```

## 网络端口快捷方式

使用 `docker port` 查看端口映射：

```bash
docker port <容器ID/名称>
```

## 查看应用日志

```bash
docker logs -f <容器ID/名称>
```

| 参数 | 说明 |
|------|------|
| `-f` | 像 `tail -f` 一样输出日志 |

## 查看容器进程

```bash
docker top <容器名称>
```

## 检查容器底层信息

```bash
docker inspect <容器名称>
```

返回 JSON 格式的配置和状态信息。

## 重启 Web 应用

```bash
docker start <容器名称>
docker restart <容器名称>
```