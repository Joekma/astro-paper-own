---
title: TCPCopy使用
author: 程序员
pubDatetime: 2024-08-13T00:00:00.000+08:00
updated: 2026-04-22T00:00:00.000+08:00
slug: tcpcopy-usage
description: 'TCPCopy流量复制工具使用教程'
tags:
  - TCPCopy
  - 网络
  - 测试
  - 流量复制
category: 网络
draft: false
language: zh-CN
---

> TCPCopy 用于线上流量复制和测试。

## 原理

| 组件 | 说明 |
|------|------|
| **TCPCopy** | 流量复制 |
| **IP Queue** | 内核旁路 |
| **Target Server** | 目标测试服务器 |

## 使用

```bash
# 复制流量
tcpCopy -i eth0 -t target_ip:target_port
```

## 小结

- **TCPCopy**：流量回放测试
- **线上测试**：验证新版本
