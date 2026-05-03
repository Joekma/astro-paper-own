---
title: Docker 架构：核心组件和工作原理
author: 程序员
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-04-22T00:00:00.000+08:00
slug: docker-architecture
description: '深入讲解Docker架构，介绍Docker核心组件和工作原理。'
tags:
  - Docker
draft: false
language: zh-CN
---

## 概述

Docker 是一个开源的容器化平台，可以将应用程序及其依赖打包成轻量级、可移植的容器，实现"一次构建，处处运行"。

### 核心优势

| 特性 | 说明 |
|------|------|
| **轻量级** | 容器共享宿主机内核，占用资源少 |
| **快速启动** | 秒级启动，比虚拟机快数十倍 |
| **可移植性** | 一次构建，多处运行，环境一致 |
| **隔离性** | 应用之间相互隔离，互不影响 |
| **版本控制** | 支持镜像版本管理，可追溯 |
| **生态系统** | 丰富的镜像仓库和工具，开箱即用 |

## 架构概览

Docker 采用 **Client-Server** 架构，主要包含以下核心组件：

| 组件 | 说明 |
|------|------|
| **Docker Client** | 客户端工具，用户交互入口 |
| **Docker Host** | 宿主机，运行容器的地方 |
| **Docker Daemon** | 守护进程，管理容器和镜像 |
| **Docker Registry** | 镜像仓库，存储分发镜像 |

## 核心组件详解

### Docker Client（客户端）

Docker Client 是用户与 Docker 交互的主要方式，通过 CLI 发送命令：

```bash
docker pull nginx    # 拉取镜像
docker run -d nginx  # 运行容器
docker ps            # 查看容器
docker images        # 查看镜像
docker build -t myapp .  # 构建镜像
```

**客户端特点：**
- 提供命令行工具 `docker`
- 通过 REST API 与 Docker Daemon 通信
- 支持 Unix Socket 或网络接口通信

### Docker Daemon（守护进程）

Docker Daemon（`dockerd`）是 Docker 系统的核心后台进程，负责管理所有 Docker 对象：

| 功能 | 说明 |
|------|------|
| 镜像管理 | 拉取、构建、删除、层级管理 |
| 容器管理 | 创建、启动、监控、资源限制 |
| 网络管理 | 创建网络、配置、连接 |
| 存储管理 | 管理数据卷、文件系统 |
| 集群管理 | Docker Swarm、服务编排 |

### Docker Registry（镜像仓库）

Docker Registry 是存储和分发 Docker 镜像的服务。

**公共仓库：**

```bash
# Docker Hub
https://hub.docker.com

# 拉取官方镜像
docker pull nginx:latest
docker pull mysql:8.0
docker pull redis:alpine
```

**私有仓库：**

```bash
# 搭建私有仓库
docker run -d -p 5000:5000 --name registry registry:2

# 推送镜像
docker tag myapp:latest localhost:5000/myapp:latest
docker push localhost:5000/myapp:latest
```

## Docker Objects

### Docker Images（镜像）

镜像是只读的模板，包含运行容器所需的所有文件。

**镜像结构：**

```
镜像名称:标签
├── Layer 1: 基础操作系统 (Ubuntu 20.04)
├── Layer 2: 运行时环境
├── Layer 3: 应用程序依赖
└── Layer 4: 应用程序代码
```

**常用操作：**

```bash
docker images              # 查看本地镜像
docker pull ubuntu:20.04   # 拉取镜像
docker build -t myapp:1.0 .  # 构建镜像
docker rmi myapp:1.0       # 删除镜像
```

### Docker Containers（容器）

容器是镜像的运行实例，具有可写层：

```bash
docker run -d --name web nginx    # 创建并启动容器
docker ps                         # 查看运行中的容器
docker stop web                   # 停止容器
docker start web                  # 启动容器
docker rm web                     # 删除容器
```

### 网络与存储

```bash
# 网络操作
docker network create mynet       # 创建网络
docker network ls                 # 查看网络

# 卷操作
docker volume create mydata       # 创建卷
docker volume ls                  # 查看卷
```

## 工作流程

```
┌──────────────┐      命令       ┌──────────────┐
│  用户/CLI    │ ─────────────▶ │   Daemon     │
└──────────────┘                └──────────────┘
                                        │
              ┌─────────────────────────┼─────────────────────────┐
              ▼                         ▼                         ▼
        ┌──────────┐            ┌──────────────┐          ┌──────────┐
        │  Images  │            │  Containers   │          │  Network │
        └──────────┘            └──────────────┘          └──────────┘
```

1. 用户通过 Client 发送命令
2. Daemon 接收并处理请求
3. 从 Registry 拉取或管理镜像
4. 创建和管理容器
5. 配置网络和存储