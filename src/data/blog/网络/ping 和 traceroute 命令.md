---
title: ping和traceroute命令
author: 程序员
pubDatetime: 2024-08-13T00:00:00.000+08:00
updated: 2026-04-22T00:00:00.000+08:00
slug: ping-traceroute-commands
description: '网络诊断工具ping和traceroute使用方法'
tags:
  - ping
  - traceroute
  - 网络诊断
  - Linux
category: 网络
draft: false
language: zh-CN
---

> 网络诊断工具帮助排查问题。

## ping

```bash
ping -c 4 example.com
ping -i 0.5 -c 5 example.com
```

## traceroute

```bash
traceroute example.com
traceroute -I example.com
```

## 小结

- **ping**：测试连通性
- **traceroute**：追踪路由
