---
title: TCP/IP协议栈概述
author: 程序员
pubDatetime: 2024-08-13T00:00:00.000+08:00
updated: 2026-04-22T00:00:00.000+08:00
slug: tcp-ip-protocol-stack
description: 'TCP/IP协议栈各层功能和数据封装流程'
tags:
  - TCP/IP
  - 网络
  - 协议
  - 网络基础
category: 网络
draft: false
language: zh-CN
---

> TCP/IP 是Internet的基础协议族。

## 四层模型

| 层级 | 说明 |
|------|------|
| **应用层** | HTTP/FTP/SMTP |
| **传输层** | TCP/UDP |
| **网络层** | IP/ICMP |
| **链路层** | 以太网/WiFi |

## TCP 三次握手

| 步骤 | 说明 |
|------|------|
| 第一次握手 | SYN=1, seq=x |
| 第二次握手 | SYN=1, ACK=1, seq=y, ack=x+1 |
| 第三次握手 | ACK=1, seq=x+1, ack=y+1 |

## 小结

- **四层模型**：应用/传输/网络/链路
- **TCP 三次握手**：建立连接
- **四次挥手**：关闭连接
