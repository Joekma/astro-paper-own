---
title: Docker 命令速查：容器、镜像、仓库常用命令
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-04-22T00:00:00.000+08:00
slug: docker-commands-reference
description: 'Docker命令速查手册，包含容器、镜像、仓库等常用命令详解。'
tags:
  - Docker
draft: false
language: zh-CN
---

## 概述

本文整理了 Docker 常用命令，涵盖容器管理、镜像操作、仓库交互等核心功能。

## 容器生命周期管理

| 命令 | 说明 |
|------|------|
| `docker run` | 创建并启动容器 |
| `docker start` | 启动已停止的容器 |
| `docker stop` | 停止运行中的容器 |
| `docker restart` | 重启容器 |
| `docker kill` | 强制终止容器 |
| `docker rm` | 删除容器 |
| `docker pause` | 暂停容器 |
| `docker unpause` | 恢复容器 |
| `docker create` | 创建容器（不启动） |
| `docker exec` | 在容器中执行命令 |

## 容器操作

| 命令 | 说明 |
|------|------|
| `docker ps` | 查看容器列表 |
| `docker ps -a` | 查看所有容器（包括已停止） |
| `docker inspect` | 查看容器详细信息 |
| `docker top` | 查看容器进程 |
| `docker attach` | 连接到运行中的容器 |
| `docker events` | 获取实时事件 |
| `docker logs` | 获取容器日志 |
| `docker wait` | 阻塞等待容器停止 |
| `docker export` | 导出容器文件系统 |
| `docker port` | 查看端口映射 |

## 容器文件系统

| 命令 | 说明 |
|------|------|
| `docker commit` | 从容器创建镜像 |
| `docker cp` | 在容器和主机间复制文件 |
| `docker diff` | 检查文件系统变化 |

## 镜像仓库

| 命令 | 说明 |
|------|------|
| `docker login` | 登录仓库 |
| `docker pull` | 拉取镜像 |
| `docker push` | 推送镜像 |
| `docker search` | 搜索镜像 |

## 本地镜像管理

| 命令 | 说明 |
|------|------|
| `docker images` | 查看本地镜像 |
| `docker rmi` | 删除镜像 |
| `docker tag` | 给镜像打标签 |
| `docker build` | 构建镜像 |
| `docker history` | 查看镜像历史 |
| `docker save` | 导出镜像 |
| `docker load` | 导入镜像 |
| `docker prune` | 清理未使用镜像 |

## 系统信息

| 命令 | 说明 |
|------|------|
| `docker info` | 显示 Docker 系统信息 |
| `docker version` | 显示 Docker 版本 |
| `docker stats` | 显示容器资源使用 |
| `docker network ls` | 查看网络列表 |
| `docker volume ls` | 查看卷列表 |

## 常用组合命令

```bash
# 进入容器
docker exec -it <容器名> /bin/bash

# 查看容器日志
docker logs -f <容器名>

# 查看容器资源使用
docker stats

# 复制文件到容器
docker cp <本地文件> <容器名>:/path/

# 列出所有镜像
docker images -a

# 强制删除镜像
docker rmi -f <镜像ID>
```