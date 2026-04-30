---
title: Redis安装配置和操作
author: 程序员
pubDatetime: 2024-08-13T00:00:00.000+08:00
updated: 2026-04-22T00:00:00.000+08:00
slug: redis-installation-configuration
description: 'Redis安装、配置和基本数据操作'
tags:
  - Redis
  - 数据库
  - 安装
category: 数据库
draft: false
language: zh-CN
---

> Redis 安装和配置是使用的基础。

## 安装

```bash
# Linux
sudo apt install redis-server

# Docker
docker pull redis
```

## 基本操作

```bash
SET name zhangsan
GET name
DEL name
```

## 小结

- **安装**：apt/docker
- **操作**：String/Hash/List
