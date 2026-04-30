---
title: Docker 命令大全
author: 程序员
pubDatetime: 2024-08-13T00:00:00.000+08:00
updated: 2026-04-22T00:00:00.000+08:00
slug: docker-commands-reference
description: 'Docker 命令速查手册，包含容器、镜像、仓库等常用命令'
tags:
  - Docker
category: Docker
draft: false
language: zh-CN
---

## 容器生命周期管理

| 命令 | 说明 |
|------|------|
| `run` | 创建并启动容器 |
| `start` | 启动容器 |
| `stop` | 停止容器 |
| `restart` | 重启容器 |
| `kill` | 强制终止容器 |
| `rm` | 删除容器 |
| `pause` | 暂停容器 |
| `unpause` | 恢复容器 |
| `create` | 创建容器 |
| `exec` | 在容器中执行命令 |

## 容器操作

| 命令 | 说明 |
|------|------|
| `ps` | 查看容器列表 |
| `inspect` | 查看容器详细信息 |
| `top` | 查看容器进程 |
| `attach` | 连接到运行中的容器 |
| `events` | 获取实时事件 |
| `logs` | 获取容器日志 |
| `wait` | 阻塞等待容器停止 |
| `export` | 导出容器文件系统 |
| `port` | 查看端口映射 |

## 容器 rootfs 命令

| 命令 | 说明 |
|------|------|
| `commit` | 从容器创建镜像 |
| `cp` | 在容器和主机间复制文件 |
| `diff` | 检查文件系统变化 |

## 镜像仓库

| 命令 | 说明 |
|------|------|
| `login` | 登录仓库 |
| `pull` | 拉取镜像 |
| `push` | 推送镜像 |
| `search` | 搜索镜像 |

## 本地镜像管理

| 命令 | 说明 |
|------|------|
| `images` | 查看本地镜像 |
| `rmi` | 删除镜像 |
| `tag` | 给镜像打标签 |
| `build` | 构建镜像 |
| `history` | 查看镜像历史 |
| `save` | 导出镜像 |
| `import` | 导入镜像 |

## 系统信息

| 命令 | 说明 |
|------|------|
| `info` | 显示 Docker 系统信息 |
| `version` | 显示 Docker 版本 |