---
title: TCP协议详解（上）
author: 程序员
pubDatetime: 2024-08-13T00:00:00.000+08:00
updated: 2026-04-22T00:00:00.000+08:00
slug: tcp-protocol-part1
description: 'TCP协议特性详解，包括连接管理、滑动窗口等'
tags:
  - TCP
  - 网络
  - 协议
category: 网络
draft: false
language: zh-CN
---

> TCP 是面向连接的传输协议。

## TCP 特性

| 特性 | 说明 |
|------|------|
| **面向连接** | 三次握手建立连接 |
| **可靠传输** | 确认/重传机制 |
| **流量控制** | 滑动窗口 |
| **拥塞控制** | 慢启动/拥塞避免 |

## 三次握手

| 步骤 | 说明 |
|------|------|
| 第一次 | SYN, seq=x |
| 第二次 | SYN, ACK, seq=y, ack=x+1 |
| 第三次 | ACK, seq=x+1, ack=y+1 |

## 小结

- **三次握手**：建立可靠连接
- **四次挥手**：优雅关闭连接
