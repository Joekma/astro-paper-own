---
title: ping和traceroute命令
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-04-22T00:00:00.000+08:00
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

## 概述

ping 和 traceroute 是最常用的网络诊断工具，用于测试网络连通性和分析网络路径。

## ping 命令

### 基本用法

```bash
# 测试基本连通性
ping 8.8.8.8

# 测试域名
ping google.com

# Windows 默认发送 4 次
ping example.com

# Linux 持续 ping（Ctrl+C 停止）
ping -c 4 example.com
```

### 输出分析

```bash
PING google.com (142.250.185.78): 56 data bytes
64 bytes from 142.250.185.78: icmp_seq=0 ttl=117 time=15.2 ms
64 bytes from 142.250.185.78: icmp_seq=1 ttl=117 time=14.8 ms
64 bytes from 142.250.185.78: icmp_seq=2 ttl=117 time=14.9 ms
64 bytes from 142.250.185.78: icmp_seq=3 ttl=117 time=15.0 ms

--- google.com ping statistics ---
4 packets transmitted, 4 packets received, 0.0% packet loss
round-trip min/avg/max/stddev = 14.8/15.0/15.2/0.2 ms
```

| 字段 | 说明 |
|------|------|
| **64 bytes** | ICMP 数据包大小（默认 64 字节） |
| **icmp_seq** | ICMP 序列号 |
| **ttl** | 生存时间（剩余跳数） |
| **time** | 往返时间 |
| **packet loss** | 丢包率 |
| **round-trip** | 延迟统计（最小/平均/最大/标准差） |

### 常用参数

| 参数 | 说明 | 示例 |
|------|------|------|
| `-c count` | 指定 ping 次数 | `ping -c 10 host` |
| `-i interval` | ping 间隔（秒） | `ping -i 0.5 host` |
| `-t ttl` | 设置 TTL | `ping -t 64 host` |
| `-s size` | 数据包大小 | `ping -s 1000 host` |
| `-f` | 快速 ping（ flooding） | `ping -f host` |
| `-q` | 仅显示摘要 | `ping -q host` |

```bash
# 快速测试（每秒一次，共 5 次）
ping -c 5 -i 1 example.com

# 大数据包测试
ping -s 1472 example.com  # MTU 1500 - 20(IP) - 8(ICMP) = 1472

# 持续 ping 直到中断
ping -c 100000 example.com
```

### 进阶使用

```bash
# 解析 IP 地址
ping -a 8.8.8.8  # Windows 显示主机名

# 指定源 IP
ping -I 192.168.1.100 target.com

# 记录路由（IPv4）
ping -R target.com

# 使用 IPv6
ping6 ipv6.google.com
```

### 常见结果分析

```bash
# 正常结果
64 bytes from 8.8.8.8: icmp_seq=0 ttl=117 time=15 ms

# 超时（网络不可达）
Request timeout for icmp_seq 0

# 目标不可达
From gateway (192.168.1.1) Destination Host Unreachable

# 端口不可达（某些防火墙）
From 10.0.0.1: icmp_seq=0 Destination Host Unreachable
```

### ping 结果判断

| 结果 | 说明 |
|------|------|
| 延迟 < 50ms | 网络状况良好 |
| 延迟 50-100ms | 略有延迟 |
| 延迟 > 100ms | 延迟较高 |
| 丢包率 > 1% | 网络不稳定 |
| 完全不通 | 网络故障或防火墙 |

## traceroute 命令

### 基本用法

```bash
# Linux/Mac
traceroute google.com

# Windows
tracert google.com

# 追踪到 8.8.8.8
traceroute 8.8.8.8
```

### 输出分析

```bash
traceroute to google.com (142.250.185.78), 30 hops max, 60 byte packets

 1  192.168.1.1 (192.168.1.1)      1.2 ms    1.1 ms    1.0 ms   # 本地网关
 2  10.0.0.1 (10.0.0.1)             5.3 ms    5.2 ms    5.1 ms   # ISP
 3  72.14.215.85 (72.14.215.85)    10.5 ms   10.4 ms   10.3 ms  # 骨干网
 4  *  *  *                                          # 路由器不响应
 5  108.170.252.129 (108.170.252.129) 14.2 ms  14.1 ms  14.0 ms
 6  142.250.185.78 (142.250.185.78)  15.3 ms  15.2 ms  15.1 ms
```

| 字段 | 说明 |
|------|------|
| **跳数** | 第几跳路由器 |
| **IP/主机名** | 路由器地址 |
| **三个时间** | 三次探测的延迟 |

### 常用参数

```bash
# Linux/Mac 参数
-m max_ttl      # 最大跳数（默认 30）
-n               # 不解析 IP 为域名（加速）
-w timeout       # 等待超时（秒）
-q nqueries      # 每跳探测次数（默认 3）
-I               # 使用 ICMP（默认 UDP）
-T               # 使用 TCP SYN
-p port          # 指定端口
-f first_ttl     # 起始 TTL

# Windows 参数
-d               # 不解析主机名
-h maximum_hops  # 最大跳数
-w timeout       # 等待超时
```

```bash
# 不解析域名，加快速度
traceroute -n google.com

# 设置最大跳数
traceroute -m 20 google.com

# 使用 ICMP
traceroute -I google.com

# 使用 TCP（SYN）探测
traceroute -T -p 443 google.com

# 自定义源端口
traceroute -s 33434 google.com

# 跳过前几跳
traceroute -f 5 google.com
```

### traceroute 原理

```python
# UDP/ICMP traceroute 原理
1. 发送 TTL=1 的 UDP 数据包
2. 第一跳路由器返回 ICMP Time Exceeded
3. 增加 TTL=2，继续发送
4. 重复直到到达目标或超过最大跳数
5. 目标返回 ICMP Port Unreachable

# TCP traceroute
1. 发送 TCP SYN 到目标端口
2. 沿途路由器返回 TTL Exceeded
3. 目标返回 SYN+ACK 或 RST
```

### 常见输出分析

```bash
# 正常路径
 1  192.168.1.1     1.0 ms
 2  10.0.0.1        5.0 ms
 3  72.14.209.85    10.0 ms
 4  *  *  *         # 跳过
 5  108.170.252.1   15.0 ms

# 问题诊断
# * * * 表示该路由器不响应 ICMP
# 可能原因：防火墙过滤、高延迟、丢包
```

## mtr 命令（Linux）

组合 ping 和 traceroute：

```bash
# 安装
yum install mtr      # CentOS
apt install mtr     # Debian/Ubuntu

# 使用
mtr google.com

# 输出示例
 1. 192.168.1.1     0.5 ms   0.4 ms   0.5 ms
 2. 10.0.0.1        5.2 ms   5.1 ms   5.3 ms
 3. 72.14.215.85   10.5 ms  10.4 ms  10.6 ms
 4. 108.170.252.1  14.2 ms  14.1 ms  14.3 ms
 5. google.com      15.0 ms  14.9 ms  15.1 ms
```

## 综合诊断流程

### 网络连通性检查

```bash
# 1. 检查本地网络配置
ipconfig /all           # Windows
ifconfig / ip addr      # Linux

# 2. 测试本地网关
ping 192.168.1.1

# 3. 测试 DNS 解析
ping google.com

# 4. 测试外网连通性
ping 8.8.8.8

# 5. 追踪路由
traceroute 8.8.8.8

# 6. DNS 解析检查
nslookup google.com
dig google.com

# 7. 端口连通性
telnet target.com 80
nc -zv target.com 80
```

### 常见问题排查

```bash
# 问题：无法访问网站
# 排查步骤：
1. ping 目标域名
2. traceroute 目标域名
3. 检查 DNS 解析
4. 检查防火墙规则

# 问题：网络延迟高
# 排查步骤：
1. 持续 ping 测试丢包率
2. traceroute 找出延迟高的节点
3. 使用 mtr 持续监控

# 问题：特定端口不通
# 排查步骤：
1. telnet/IP 端口测试
2. 检查防火墙规则
3. 检查服务是否监听
4. 检查云服务商安全组
```

## 常用组合命令

```bash
# 网络诊断脚本
#!/bin/bash
TARGET=$1

echo "=== 网络诊断报告 ==="
echo "目标: $TARGET"
echo ""

echo "1. Ping 测试"
ping -c 4 $TARGET
echo ""

echo "2. 路由追踪"
traceroute -n -w 2 $TARGET
echo ""

echo "3. DNS 解析"
nslookup $TARGET
echo ""

echo "4. 端口检测"
nc -zv -w 3 $TARGET 80 443
echo ""

echo "=== 诊断完成 ==="
```

## 小结

| 工具 | 用途 | 关键指标 |
|------|------|----------|
| **ping** | 测试连通性 | 延迟、丢包率 |
| **traceroute** | 分析路由路径 | 跳数、各节点延迟 |
| **mtr** | 综合诊断 | 持续监控 |
| **nslookup/dig** | DNS 查询 | 解析时间、结果 |

使用技巧：
- 持续 ping 检测网络稳定性
- traceroute -n 加速分析
- 结合使用 mtr 进行综合诊断
- 注意防火墙导致的 * * *