---
title: Docker Compose：定义和运行多容器应用
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-04-22T00:00:00.000+08:00
slug: docker-compose-tutorial
description: '深入讲解Docker Compose定义和运行多容器Docker应用的方法和实践。'
tags:
  - Docker
  - Docker Compose
draft: false
language: zh-CN
---

## 概述

`Compose` 允许通过 `docker-compose.yml` 模板文件定义一组相关联的应用容器为一个项目。

### 核心概念

| 概念 | 说明 |
|------|------|
| **服务 (service)** | 一个应用的容器实例 |
| **项目 (project)** | 由一组关联容器组成的完整业务单元 |

> Compose 默认管理对象是项目，通过子命令对项目中的容器进行生命周期管理。

## 安装

### 二进制安装

```bash
sudo curl -L https://github.com/docker/compose/releases/download/1.17.1/docker-compose-`uname -s`-`uname -m` > /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### pip 安装

```bash
sudo pip install -U docker-compose
```

### 验证安装

```bash
docker-compose --version
```

## 使用

### 基本示例

创建目录并编写 `docker-compose.yml`：

```yaml
version: '3'
services:
  web:
    build: .
    ports:
      - "5000:5000"
  redis:
    image: "redis:alpine"
```

启动项目：

```bash
docker-compose up
```

### 完整示例

```yaml
version: '3'
services:
  web:
    build: .
    ports:
      - "5000:5000"
    volumes:
      - .:/code
    depends_on:
      - redis
  redis:
    image: redis:alpine
```

运行服务：

```bash
docker-compose up -d      # 后台运行
docker-compose logs -f    # 查看日志
docker-compose down       # 停止服务
```

## 常用命令

| 命令 | 说明 |
|------|------|
| `docker-compose up` | 创建并启动容器 |
| `docker-compose ps` | 查看运行中的容器 |
| `docker-compose build` | 构建服务镜像 |
| `docker-compose start` | 启动服务 |
| `docker-compose stop` | 停止服务 |
| `docker-compose restart` | 重启服务 |
| `docker-compose down` | 停止并移除容器 |
| `docker-compose logs` | 查看日志 |
| `docker-compose exec` | 进入容器 |

### 命令选项

| 选项 | 说明 |
|------|------|
| `-f, --file` | 指定 Compose 模板文件 |
| `-p, --project-name` | 指定项目名称 |
| `--verbose` | 输出调试信息 |
| `-v, --version` | 打印版本 |

### build 选项

| 选项 | 说明 |
|------|------|
| `--force-rm` | 删除构建过程中的临时容器 |
| `--no-cache` | 不使用缓存 |
| `--pull` | 始终拉取最新镜像 |

## 常用配置

### 端口映射

```yaml
ports:
  - "8000:8000"
  - "9000:80"
```

### 环境变量

```yaml
environment:
  - DEBUG=1
  - DB_HOST=db
```

### 数据卷

```yaml
volumes:
  - ./data:/var/lib/mysql
  - ./config:/etc/mysql
```

### 依赖关系

```yaml
depends_on:
  - db
  - redis
```

## 小结

Docker Compose 的优势：

- **简化多容器管理**：通过单一文件定义整个应用
- **环境一致性**：确保不同环境配置统一
- **快速部署**：一条命令启动所有服务
- **开发友好**：适合本地开发和测试环境