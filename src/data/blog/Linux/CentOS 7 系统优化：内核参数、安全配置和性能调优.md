---
title: CentOS 7 系统优化：内核参数、安全配置和性能调优
series: Linux
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-05-16T00:00:00.000+08:00
slug: centos7-optimization
description: '讲解 CentOS 7 存量系统的安全加固、内核参数、资源限制、磁盘 IO、网络和防火墙调优，并强调 EOL 风险与回滚策略。'
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

## 先说明：CentOS 7 已停止维护

CentOS Linux 7 已在 2024 年 6 月 30 日停止维护。新系统不建议继续部署 CentOS 7，应优先迁移到 RHEL、CentOS Stream、Rocky Linux、AlmaLinux、Ubuntu LTS 或 Debian 等仍在维护的发行版。

本文只适合维护存量 CentOS 7 服务器时参考。调优前务必备份配置、记录变更、准备回滚，并先在测试环境验证。

## 优化原则

| 原则 | 说明 |
|------|------|
| **先安全后性能** | 不用关闭安全防护换取微小性能收益 |
| **按场景调优** | Web、数据库、缓存、网关的参数不同 |
| **可观测再修改** | 根据监控、日志和压测结果调整 |
| **保留回滚路径** | 每次只改少量参数，并记录原值 |

## 内核参数管理

建议把自定义参数放在独立文件中，避免直接堆到 `/etc/sysctl.conf`：

```bash
sudo cp /etc/sysctl.conf /etc/sysctl.conf.bak.$(date +%F)
sudo vi /etc/sysctl.d/99-local-tuning.conf
```

加载并验证：

```bash
sudo sysctl --system
sysctl net.core.somaxconn
```

### 常见网络参数

```ini
# 提高监听队列上限，适合高并发 Web 服务
net.core.somaxconn = 4096
net.ipv4.tcp_max_syn_backlog = 8192

# 缩短 FIN-WAIT-2 等待时间，需要结合业务连接特征测试
net.ipv4.tcp_fin_timeout = 30

# 降低交换倾向，适合内存较充足的应用服务器
vm.swappiness = 10

# 提高系统可分配文件句柄上限
fs.file-max = 1048576
```

不要直接照抄超大值。参数过大可能掩盖应用泄漏、增加内存压力或让故障排查更困难。

### 关于 `tcp_tw_reuse`

CentOS 7 内核较旧，`net.ipv4.tcp_tw_reuse = 1` 在部分出站连接密集场景可能有帮助，但不应作为通用默认值。涉及 NAT、负载均衡或长连接业务时，必须压测验证。

## SSH 安全配置

编辑前先备份：

```bash
sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak.$(date +%F)
sudo vi /etc/ssh/sshd_config
```

推荐项：

| 配置项 | 建议值 | 说明 |
|--------|--------|------|
| `PermitRootLogin` | `no` | 禁止 root 直接登录 |
| `PasswordAuthentication` | `no` | 仅在密钥登录确认可用后再关闭密码 |
| `PubkeyAuthentication` | `yes` | 启用公钥认证 |
| `MaxAuthTries` | `3` | 限制认证尝试次数 |
| `ClientAliveInterval` | `300` | 空闲连接保活间隔 |
| `UseDNS` | `no` | 避免反向解析导致登录慢 |

重启前先检查语法：

```bash
sudo sshd -t
sudo systemctl restart sshd
```

不要在没有备用会话或控制台访问的情况下关闭密码登录，否则可能把自己锁在服务器外。

## 用户权限

### sudo 权限

使用 `visudo` 修改 sudo 配置，避免语法错误：

```bash
sudo visudo
```

示例：

```text
%wheel ALL=(ALL) ALL
```

把用户加入 `wheel` 组：

```bash
sudo usermod -aG wheel username
```

### su 限制

不要用 `echo >> /etc/pam.d/su` 直接追加配置。先备份并编辑：

```bash
sudo cp /etc/pam.d/su /etc/pam.d/su.bak.$(date +%F)
sudo vi /etc/pam.d/su
```

确认或添加：

```ini
auth required pam_wheel.so use_uid
```

然后只允许 `wheel` 组用户切换：

```bash
sudo usermod -aG wheel username
```

## 文件描述符与进程限制

编辑独立配置文件：

```bash
sudo vi /etc/security/limits.d/99-local-limits.conf
```

示例：

```ini
* soft nofile 65535
* hard nofile 65535
* soft nproc 65535
* hard nproc 65535
```

验证：

```bash
ulimit -n
ulimit -u
```

systemd 服务还需要在 unit 中设置：

```ini
[Service]
LimitNOFILE=65535
LimitNPROC=65535
```

修改后执行：

```bash
sudo systemctl daemon-reload
sudo systemctl restart servicename
```

## 磁盘 IO

查看调度器：

```bash
cat /sys/block/sda/queue/scheduler
```

CentOS 7 常见机械盘可测试 `deadline`，SSD/NVMe 环境未必适合照搬。临时设置：

```bash
echo deadline | sudo tee /sys/block/sda/queue/scheduler
```

如果验证有效，再通过 udev 规则或启动配置持久化，不建议直接把命令追加到 `/etc/rc.d/rc.local`。

预读设置也应按负载测试：

```bash
sudo blockdev --getra /dev/sda
sudo blockdev --setra 4096 /dev/sda
```

## CPU 与安全缓解

查看 CPU 调速策略：

```bash
cpupower frequency-info
```

设置性能模式：

```bash
sudo cpupower frequency-set -g performance
```

不建议把 `mitigations=off` 作为默认优化项。它会关闭部分 CPU 漏洞缓解措施，可能显著降低安全性。只有在隔离、可信、经过风险评估的性能敏感环境中，才应考虑使用，并必须记录审批和回滚方法。

## 内存与写回参数

示例：

```ini
vm.dirty_ratio = 15
vm.dirty_background_ratio = 5
vm.vfs_cache_pressure = 50
vm.swappiness = 10
```

这些参数会影响缓存回收和脏页写回。数据库服务器通常还需要结合数据库自身缓冲池、文件系统和 IO 延迟一起调优。

## TCP BBR

BBR 需要内核支持。CentOS 7 默认内核通常较旧，未必原生支持 BBR。

检查可用算法：

```bash
sysctl net.ipv4.tcp_available_congestion_control
```

如果输出包含 `bbr`，可以测试启用：

```bash
sudo sysctl -w net.core.default_qdisc=fq
sudo sysctl -w net.ipv4.tcp_congestion_control=bbr
```

确认有效：

```bash
sysctl net.ipv4.tcp_congestion_control
```

验证收益后再写入 `/etc/sysctl.d/99-local-tuning.conf`。如果内核不支持，不要为了 BBR 随意更换生产内核。

## 防火墙配置

### firewalld

```bash
sudo systemctl enable --now firewalld
sudo firewall-cmd --state
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --reload
```

### iptables

CentOS 7 默认使用 firewalld。只有在确有兼容需求时才切换到 iptables-services，避免两套防火墙工具规则互相干扰。

```bash
sudo yum install -y iptables-services
sudo systemctl disable --now firewalld
sudo systemctl enable --now iptables
```

## 自动化脚本建议

不要使用“无条件追加配置”的一键优化脚本。更安全的自动化方式应满足：

- 每个配置文件先备份。
- 写入独立配置文件，而不是反复追加到系统主配置。
- 执行前输出将要修改的内容。
- 支持回滚。
- 变更后执行语法检查和状态验证。

最小示例：

```bash
#!/usr/bin/env bash
set -euo pipefail

backup="/etc/sysctl.conf.bak.$(date +%F-%H%M%S)"
sudo cp /etc/sysctl.conf "$backup"

sudo tee /etc/sysctl.d/99-local-tuning.conf > /dev/null <<'EOF'
vm.swappiness = 10
net.core.somaxconn = 4096
fs.file-max = 1048576
EOF

sudo sysctl --system
echo "完成，原配置备份在 $backup"
```

## 小结

CentOS 7 调优的重点不是堆参数，而是控制风险：先确认系统仍有安全维护路径，再按业务场景逐项验证。所有涉及 SSH、PAM、防火墙、内核和资源限制的修改，都应有备份、验证和回滚。
