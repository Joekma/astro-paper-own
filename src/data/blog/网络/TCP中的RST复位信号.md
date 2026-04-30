---
title: TCP RST复位信号
author: 程序员
pubDatetime: 2024-08-13T00:00:00.000+08:00
updated: 2026-04-22T00:00:00.000+08:00
slug: tcp-rst-signal
description: 'TCP RST复位信号的原因和影响'
tags:
  - TCP
  - 网络
  - 协议
category: 网络
draft: false
language: zh-CN
---

> TCP RST 信号用于强制断开连接。

## RST 场景

| 场景 | 说明 |
|------|------|
| **端口未监听** | 连接不存在的服务 |
| **异常关闭** | SO_LINGER 设置 |
| **半开连接** | 一端崩溃 |

## 处理建议

```bash
# 查看连接
netstat -an | grep ESTABLISHED

# 调整内核参数
sysctl -w net.ipv4.tcp_syncookies=1
```

## 小结

- **RST**：强制断开
- **预防**：合理配置内核参数
