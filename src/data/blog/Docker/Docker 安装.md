---
title: Docker 安装
author: 程序员
pubDatetime: 2024-08-13T00:00:00.000+08:00
updated: 2026-04-22T00:00:00.000+08:00
slug: docker-installation-guide
description: 'Docker 安装教程，包含 Ubuntu 和 CentOS 系统安装步骤'
tags:
  - Docker
category: Docker
draft: false
language: zh-CN
---

## Ubuntu Docker 安装

### 支持的版本

- Ubuntu Precise 12.04 (LTS)
- Ubuntu Trusty 14.04 (LTS)
- Ubuntu Wily 15.10
- 其他更新版本

### 前提条件

Docker 要求内核版本高于 3.10，查看内核版本：

```bash
uname -r
```

## 使用脚本安装

### 1. 获取最新版本

```bash
wget -qO- https://get.docker.com/ | sh
```

> 输入用户密码后，下载脚本并安装 Docker 及依赖包。

### 2. 非 root 用户配置

```bash
sudo usermod -aG docker <用户名>
```

> 需要重新登录使配置生效。

### 3. 启动 Docker 服务

```bash
sudo service docker start
```

### 4. 测试运行

```bash
docker run hello-world
```

## 镜像加速

配置国内镜像加速器，解决拉取镜像缓慢问题。

### 配置文件位置

- Linux：`/etc/docker/daemon.json`
- Windows：`%programdata%\docker\config\daemon.json`

### 配置内容

```json
{
  "registry-mirrors": ["http://hub-mirror.c.163.com"]
}
```

## CentOS Docker 安装

### 支持的版本

- CentOS 7 (64-bit)
- CentOS 6.5 (64-bit) 或更高版本

### 前提条件

| 版本 | 内核要求 |
|------|----------|
| CentOS 7 | 3.10 以上 |
| CentOS 6.5+ | 2.6.32-431 或更高 |

## yum 安装（CentOS 7）

### 1. 移除旧版本

```bash
sudo yum remove docker \
  docker-client \
  docker-client-latest \
  docker-common \
  docker-latest \
  docker-latest-logrotate \
  docker-logrotate \
  docker-selinux \
  docker-engine-selinux \
  docker-engine
```

### 2. 安装必要工具

```bash
sudo yum install -y yum-utils device-mapper-persistent-data lvm2
```

### 3. 添加软件源

```bash
sudo yum-config-manager --add-repo http://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo
```

### 4. 安装 Docker CE

```bash
sudo yum -y install docker-ce
```

### 5. 启动服务

```bash
sudo systemctl start docker
sudo systemctl enable docker
```

### 6. 验证安装

```bash
docker --version
docker run hello-world
```