---
title: CentOS 7 系统优化：内核参数、安全配置和性能调优
author: 程序员
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-05-03T00:00:00.000+08:00
slug: centos7-optimization
description: '深入讲解CentOS 7系统优化，包含内核参数调优、安全配置（SSH、用户权限、防火墙）、性能优化（CPU、内存、磁盘IO、网络TCP BBR）和自动化脚本。'
tags:
  - Linux
  - CentOS
  - 系统优化
  - 性能调优
  - 安全配置
  - 内核参数
  - TCP BBR
draft: false
language: zh-CN
---

## 优化原则

| 原则 | 说明 |
|------|------|
| **安全第一** | 关闭不必要的服务和端口 |
| **性能优先** | 提高响应速度 |
| **稳定可靠** | 避免过度优化 |
| **可维护性** | 记录所有修改 |

## 内核参数优化

### 网络参数

```bash
# 编辑配置文件
vim /etc/sysctl.conf

# 使配置生效
sysctl -p
```

### 常用参数

```bash
# 内存交换
vm.swappiness = 10

# 网络队列
net.core.netdev_max_backlog = 65535
net.core.somaxconn = 65535
net.ipv4.tcp_max_syn_backlog = 65535

# TCP 连接
net.ipv4.tcp_tw_reuse = 1
net.ipv4.tcp_fin_timeout = 15

# 文件描述符
fs.file-max = 6553560
```

### 内存参数

```bash
kernel.shmmax = 68719476736
kernel.shmall = 4294967296
kernel.shmmni = 4096
kernel.sem = 5010 641280 10020 5010
kernel.msgmnb = 65536
kernel.msgmax = 65536
kernel.threads-max = 65535
kernel.pid_max = 65535
```

## 安全优化

### 禁用不必要的服务

```bash
systemctl stop postfix        # 邮件服务
systemctl disable postfix
systemctl stop cups           # 打印服务
systemctl disable cups
```

### SSH 安全配置

```bash
vim /etc/ssh/sshd_config
```

**推荐配置：**

| 配置项 | 值 | 说明 |
|--------|-----|------|
| `Port` | 2222 | 更改默认端口 |
| `PermitRootLogin` | no | 禁止 root 登录 |
| `PasswordAuthentication` | no | 禁用密码认证 |
| `PubkeyAuthentication` | yes | 启用密钥认证 |
| `MaxAuthTries` | 3 | 最大认证尝试次数 |
| `ClientAliveInterval` | 300 | 连接超时 |
| `UseDNS` | no | 禁用 DNS 反向解析 |

### 重启服务

```bash
systemctl restart sshd
```

## 用户权限

### 限制 sudo

```bash
visudo

# 添加（示例）
username ALL=(ALL) ALL
%wheel ALL=(ALL) ALL
```

### 限制 su

```bash
echo "auth required pam_wheel.so use_uid" >> /etc/pam.d/su
usermod -aG wheel username
```

## 文件系统优化

### 资源限制

```bash
vim /etc/security/limits.conf
```

```bash
* soft nofile 65535
* hard nofile 65535
* soft nproc 65535
* hard nproc 65535
* soft core unlimited
* hard core unlimited
```

### 使配置生效

```bash
ulimit -n 65535
```

## 磁盘 IO

### 查看调度算法

```bash
cat /sys/block/sda/queue/scheduler
```

### 设置调度器

```bash
# deadline 适合数据库和 Web 服务器
echo deadline > /sys/block/sda/queue/scheduler

# 永久生效
echo "echo deadline > /sys/block/sda/queue/scheduler" >> /etc/rc.d/rc.local
chmod +x /etc/rc.d/rc.local
```

### 优化预读

```bash
blockdev --setra 4096 /dev/sda
```

## CPU 优化

### 性能模式

```bash
cpupower frequency-info
cpupower frequency-set -g performance
```

### GRUB 优化

```bash
vim /etc/default/grub

# 添加到 GRUB_CMDLINE_LINUX
GRUB_CMDLINE_LINUX="crashkernel=auto rhgb quiet mitigations=off"
```

> `mitigations=off` 可提升性能，但存在安全风险。

### 重新生成配置

```bash
grub2-mkconfig -o /boot/grub2/grub.cfg
```

## 内存优化

```bash
vim /etc/sysctl.conf

vm.dirty_ratio = 15
vm.dirty_background_ratio = 5
vm.vfs_cache_pressure = 50
vm.overcommit_memory = 1
vm.swappiness = 10
```

## 网络优化

### 连接跟踪

```bash
net.netfilter.nf_conntrack_max = 1048576
net.netfilter.nf_conntrack_tcp_timeout_established = 3600
```

### TCP BBR

```bash
# 启用 BBR
sysctl -w net.ipv4.tcp_congestion_control=bbr

# 持久化
echo "net.ipv4.tcp_congestion_control = bbr" >> /etc/sysctl.conf
echo "net.core.default_qdisc = fq" >> /etc/sysctl.conf
```

## 防火墙配置

### firewalld

```bash
systemctl start firewalld
systemctl enable firewalld

firewall-cmd --permanent --add-port=80/tcp
firewall-cmd --reload
```

### iptables

```bash
yum install -y iptables-services
systemctl enable iptables
systemctl start iptables
```

## 自动化脚本

```bash
#!/bin/bash
# 系统优化脚本

# 内核参数
cat >> /etc/sysctl.conf << EOF
vm.swappiness = 10
net.core.somaxconn = 65535
fs.file-max = 6553560
EOF

sysctl -p

# 文件描述符
echo "* soft nofile 65535" >> /etc/security/limits.conf
echo "* hard nofile 65535" >> /etc/security/limits.conf

# 禁用不必要的服务
for service in postfix cups; do
    systemctl stop $service
    systemctl disable $service
done

echo "优化完成！"
```