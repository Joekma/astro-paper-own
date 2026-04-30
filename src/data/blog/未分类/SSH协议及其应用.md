---
title: SSH协议及其应用
author: 程序员
pubDatetime: 2024-08-13T00:00:00.000+08:00
updated: 2026-04-22T00:00:00.000+08:00
slug: ssh-protocol-applications
description: 'SSH协议原理和典型应用场景'
tags:
  - SSH
  - 远程登录
  - 安全
category: 未分类
draft: false
language: zh-CN
---

> SSH 是安全的远程登录协议。

## SSH 原理

| 组件 | 说明 |
|------|------|
| **SSH** | 加密传输 |
| **密钥** | 非对称加密 |
| **端口** | 22 |

## 使用命令

```bash
ssh user@host
scp file.txt user@host:/path
```

## 小结

- **SSH**：安全远程登录
- **SCP**：安全复制
