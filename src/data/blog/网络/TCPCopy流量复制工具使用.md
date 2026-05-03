---
title: TCPCopy流量复制工具使用
author: 程序员
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-04-22T00:00:00.000+08:00
slug: tcpcopy-usage
description: 'TCPCopy流量复制工具使用方法'
tags:
  - TCPCopy
  - 网络
  - 测试
  - 流量复制
category: 网络
draft: false
language: zh-CN
---

## 概述

TCPCopy 是一款流量复制工具，用于将生产环境的流量复制到测试环境，进行真实环境测试和性能压测。

## 工作原理

```
┌───────────┐          ┌───────────┐          ┌───────────┐
│ 生产服务器 │          │ TCPCopy   │          │ 测试服务器 │
│           │          │           │          │           │
│ Client ──▶│ ───抓包──▶│           │ ───复制──▶│           │
│           │          │           │          │           │
└───────────┘          └───────────┘          └───────────┘
     原始流量             流量复制            测试流量
```

### 架构组件

| 组件 | 说明 |
|------|------|
| **TCPCopy** | 流量复制工具，运行在中介服务器 |
| **IP Queue** | 内核模块，实现流量劫持 |
| **Target Server** | 目标测试服务器 |

## 安装

### 编译安装

```bash
# 下载源码
git clone https://github.com/session-replay-tools/tcpcopy.git

# 编译
cd tcpcopy
./configure
make
make install

# 加载 IP Queue 模块
modprobe ip_queue
```

### 依赖

```bash
# CentOS
yum install -y libnet libpcap libpcap-devel

# Ubuntu
apt install -y libnet1-dev libpcap-dev
```

## 使用

### 基本用法

```bash
# 复制单个端口流量
tcpcopy -x 80-target_server:80 -s intermediate_server_ip

# 示例：复制本机80端口到 192.168.1.100 的 80 端口
tcpcopy -x 80-192.168.1.100:80 -s 192.168.1.200
```

### 参数说明

| 参数 | 说明 |
|------|------|
| `-x` | 源端口-目标服务器:目标端口 |
| `-s` | 中介服务器 IP |
| `-c` | 目标地址转换 |
| `-n` | 加速倍数 |
| `-d` | 后台运行 |
| `-l` | 日志文件 |

### 高级用法

```bash
# 复制多个端口
tcpcopy -x 80-192.168.1.100:80 -x 443-192.168.1.100:443 -s 192.168.1.200

# 加速流量（10倍）
tcpcopy -x 80-192.168.1.100:80 -n 10 -s 192.168.1.200

# 修改目标 IP
tcpcopy -x 80-192.168.1.100:80 -c 192.168.1.0/24 -s 192.168.1.200

# 后台运行并记录日志
tcpcopy -x 80-192.168.1.100:80 -s 192.168.1.200 -d -l /var/log/tcpcopy.log
```

## 辅助工具

### Session 辅助

```bash
# 启动 session helper
 ./session_helper -l /var/log/session.log -d
```

### 地址辅助

```bash
# 启动 address helper（解决连接问题）
./address_helper -l /var/log/address.log -d
```

## 配置示例

### 单点复制

```
┌─────────────┐
│ 生产服务器   │
│ 192.168.1.1 │
│ Port: 8080  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ TCPCopy     │
│ 192.168.1.2 │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ 测试服务器   │
│ 192.168.1.3 │
│ Port: 8080  │
└─────────────┘
```

```bash
# 在 192.168.1.2 上执行
tcpcopy -x 8080-192.168.1.3:8080 -s 192.168.1.2
```

### 集群复制

```bash
# 复制到多个测试服务器
tcpcopy -x 80-192.168.1.100:80 -x 80-192.168.1.101:80 -x 80-192.168.1.102:80 -s 192.168.1.200
```

### 流量控制

```bash
# 限制每秒请求数
tcpcopy -x 80-192.168.1.100:80 -r 1000 -s 192.168.1.200

# 加速倍数
tcpcopy -x 80-192.168.1.100:80 -n 5 -s 192.168.1.200
```

## 问题排查

### 检查运行状态

```bash
# 查看 TCPCopy 进程
ps aux | grep tcpcopy

# 查看端口占用
netstat -anp | grep tcpcopy

# 查看 IP Queue 状态
cat /proc/net/ip_queue
```

### 日志分析

```bash
# 查看日志
tail -f /var/log/tcpcopy.log

# 统计请求数
grep "new session" /var/log/tcpcopy.log | wc -l

# 统计错误
grep "error" /var/log/tcpcopy.log
```

### 常见问题

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| 流量未复制 | IP Queue 未加载 | `modprobe ip_queue` |
| 连接失败 | 防火墙阻止 | 开放端口 |
| 响应慢 | 测试服务器性能不足 | 增加资源 |
| 数据丢失 | 网络带宽不足 | 升级网络 |

## 性能优化

### 内核参数

```bash
# 调整 IP Queue 大小
echo 10000 > /proc/sys/net/ip/queue/maxlen

# 调整文件描述符
ulimit -n 65535

# 调整 TCP 参数
sysctl -w net.ipv4.tcp_syncookies=1
sysctl -w net.core.somaxconn=1024
sysctl -w net.ipv4.tcp_max_syn_backlog=1024
```

### 注意事项

1. **网络带宽**：确保 TCPCopy 服务器带宽足够
2. **测试服务器**：测试服务器需要能承受流量
3. **数据隔离**：测试环境数据要隔离
4. **监控**：实时监控流量和性能

## 应用场景

| 场景 | 说明 |
|------|------|
| **功能测试** | 真实流量测试新功能 |
| **性能压测** | 模拟高并发场景 |
| **故障复现** | 复现生产问题 |
| **版本对比** | 对比新旧版本性能 |

## 小结

TCPCopy 核心要点：

- **流量复制**：将生产流量复制到测试环境
- **真实测试**：使用真实数据进行测试
- **性能压测**：支持流量倍增和限流
- **部署模式**：需要中介服务器