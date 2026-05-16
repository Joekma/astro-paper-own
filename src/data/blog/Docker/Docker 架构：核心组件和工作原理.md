---
title: Docker 架构：核心组件和工作原理
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-05-16T00:00:00.000+08:00
slug: docker-architecture
description: '讲解 Docker Client、Docker Daemon、containerd、runc、镜像、容器、网络、存储和 BuildKit 的工作关系。'
tags:
  - Docker
draft: false
series: docker
language: zh-CN
---

## 概述

Docker 是一个容器化平台，可以把应用及其依赖打包为镜像，并在隔离的容器中运行。容器共享宿主机内核，比虚拟机更轻量，但仍能通过命名空间、控制组和文件系统层实现隔离。

## 架构概览

Docker 采用 Client-Server 架构。用户通过 Docker CLI 发出命令，Docker Daemon 接收请求，再协调镜像、容器、网络和存储等组件。

```text
用户/CLI
   |
   v
Docker Client
   |
   v
Docker Daemon (dockerd)
   |
   +--> BuildKit        构建镜像
   +--> containerd      管理容器生命周期
   +--> Registry        拉取和推送镜像
   +--> Network/Volume  管理网络和数据卷
          |
          v
        runc            创建符合 OCI 规范的容器进程
```

| 组件 | 说明 |
|------|------|
| **Docker Client** | 命令行入口，例如 `docker run`、`docker build` |
| **Docker Daemon** | 后台服务，负责接收 API 请求并协调资源 |
| **containerd** | 容器运行时守护进程，管理镜像、快照和容器生命周期 |
| **runc** | 低层 OCI 运行时，真正创建容器进程 |
| **BuildKit** | 现代镜像构建后端，支持缓存、并行构建和密钥挂载 |
| **Registry** | 镜像仓库，例如 Docker Hub 或私有仓库 |

## Docker Client

Docker Client 是用户与 Docker 交互的主要方式。

```bash
docker pull nginx:1.27-alpine
docker run -d --name web nginx:1.27-alpine
docker ps
docker images
docker build -t myapp:1.0 .
```

Client 本身不直接创建容器，它通过 Unix Socket 或 TCP API 与 Docker Daemon 通信。默认 Unix Socket 通常是 `/var/run/docker.sock`。

## Docker Daemon

Docker Daemon（`dockerd`）负责管理 Docker 对象：

| 功能 | 说明 |
|------|------|
| 镜像管理 | 拉取、构建、打标签、删除镜像 |
| 容器管理 | 创建、启动、停止、删除容器 |
| 网络管理 | 创建 bridge、host、overlay 等网络 |
| 存储管理 | 管理 volume、bind mount 和镜像层 |
| API 服务 | 对 Docker Client 暴露操作接口 |

Daemon 并不是所有底层动作的唯一执行者。现代 Docker 会把容器生命周期交给 `containerd`，再由 `runc` 创建符合 OCI 规范的容器进程。

## 镜像与容器

### 镜像

镜像是只读模板，由多层文件系统组成，包含运行应用所需的文件、依赖和默认配置。

```text
myapp:1.0
├── Layer 1: 基础系统层
├── Layer 2: 运行时依赖
├── Layer 3: 应用依赖
└── Layer 4: 应用代码
```

常用命令：

```bash
docker images
docker pull ubuntu:24.04
docker build -t myapp:1.0 .
docker rmi myapp:1.0
```

### 容器

容器是镜像的运行实例。Docker 会在镜像只读层之上增加一个可写层，容器运行时产生的临时文件默认写入这一层。

```bash
docker run -d --name web nginx:1.27-alpine
docker stop web
docker start web
docker rm web
```

容器删除后，可写层会随之消失。需要保留的数据应放入数据卷或外部存储。

## 隔离机制

Docker 主要依赖 Linux 内核能力实现隔离和资源限制。

| 技术 | 作用 |
|------|------|
| **Namespaces** | 隔离进程、网络、挂载点、主机名、用户等视图 |
| **cgroups** | 限制和统计 CPU、内存、IO 等资源 |
| **Capabilities** | 细分 root 权限，减少容器默认权限 |
| **Seccomp/AppArmor/SELinux** | 限制系统调用和访问策略 |
| **Overlay filesystem** | 叠加镜像层和容器可写层 |

容器不是安全沙箱的绝对边界。运行不可信工作负载时，应额外关注 rootless Docker、只读文件系统、最小权限和运行时安全策略。

## 网络与存储

### 网络

```bash
docker network ls
docker network create app-net
docker run -d --name web --network app-net nginx:1.27-alpine
```

常见网络模式：

| 模式 | 说明 |
|------|------|
| `bridge` | 单机默认网络，适合本地容器互联 |
| `host` | 容器直接使用宿主机网络命名空间 |
| `none` | 不配置网络 |
| `overlay` | 跨主机网络，常用于 Swarm 场景 |

### 存储

```bash
docker volume create app-data
docker run -d -v app-data:/data alpine sleep 1d
docker volume ls
```

| 类型 | 说明 |
|------|------|
| Volume | Docker 管理的数据卷，适合持久化业务数据 |
| Bind mount | 挂载宿主机指定目录，适合开发调试 |
| tmpfs | 只在内存中保存，容器停止后消失 |

## Registry

Registry 用于存储和分发镜像。

```bash
# 拉取官方镜像
docker pull nginx:1.27-alpine

# 登录仓库
docker login

# 打标签并推送
docker tag myapp:1.0 registry.example.com/team/myapp:1.0
docker push registry.example.com/team/myapp:1.0
```

生产环境应固定镜像标签或摘要，避免直接依赖 `latest` 带来不可预期变更。

## 小结

理解 Docker 架构时，可以抓住一条主线：CLI 发送请求，Daemon 协调资源，BuildKit 构建镜像，containerd/runc 运行容器，Registry 负责镜像分发，Linux 内核能力提供隔离和资源控制。
