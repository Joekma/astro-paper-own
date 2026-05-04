---
title: Linux 必备知识：系统结构、基础命令和网络管理
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-05-03T00:00:00.000+08:00
slug: linux-essential-knowledge
description: '深入讲解Linux必备知识，包括系统架构、目录结构、文件操作、权限管理、用户管理、进程管理、系统服务、磁盘管理、网络管理和防火墙配置。'
tags:
  - Linux
  - 系统管理
  - 命令行
  - Shell
  - 网络管理
draft: false
language: zh-CN
---

## Linux 简介

Linux 是开源的 Unix-like 操作系统内核，由林纳斯·托瓦兹于 1991 年发布。

### 核心优势

| 特性 | 说明 |
|------|------|
| **开源免费** | 遵循 GPL 协议 |
| **安全稳定** | 企业级可靠性 |
| **性能优异** | 高效利用系统资源 |
| **社区支持** | 庞大开发者社区 |
| **定制灵活** | 可按需定制 |

## 系统架构

```
┌──────────────────────────────────────┐
│           用户应用程序               │
├──────────────────────────────────────┤
│         Shell (命令行解释器)           │
├──────────────────────────────────────┤
│           系统调用接口                │
├──────────────────────────────────────┤
│      GNU C Library (glibc)           │
├──────────────────────────────────────┤
│           Linux 内核                 │
├──────────────────────────────────────┤
│         硬件抽象层                   │
├──────────────────────────────────────┤
│           物理硬件                   │
└──────────────────────────────────────┘
```

## 目录结构

| 目录 | 说明 |
|------|------|
| `/` | 根目录，文件系统起点 |
| `/bin` | 基本命令（二进制文件） |
| `/sbin` | 系统管理命令 |
| `/etc` | 系统配置文件 |
| `/home` | 普通用户家目录 |
| `/root` | root 用户家目录 |
| `/var` | 可变数据（日志、缓存） |
| `/tmp` | 临时文件目录 |
| `/usr` | 用户程序和文档 |
| `/proc` | 虚拟文件系统 |
| `/dev` | 设备文件目录 |
| `/mnt` | 临时挂载点 |
| `/opt` | 可选应用软件 |

## 文件操作

### 目录操作

```bash
ls -la                    # 列出目录详细内容
cd /path/to/directory     # 切换目录
pwd                       # 显示当前目录
mkdir directory_name       # 创建目录
rmdir directory_name       # 删除空目录
rm -rf directory_name      # 删除目录及内容
```

### 文件操作

```bash
touch filename            # 创建空文件
cp source dest            # 复制文件
cp -r source dest         # 递归复制目录
mv source dest            # 移动或重命名
rm filename               # 删除文件
cat filename              # 查看文件内容
head -n 10 filename      # 查看前10行
tail -n 10 filename      # 查看后10行
tail -f filename          # 实时查看
```

### 文件搜索

```bash
find /path -name "*.txt"  # 按名称搜索
grep "pattern" file        # 内容搜索
locate filename            # 快速定位
which command              # 查找命令位置
```

## 文件权限

### 权限表示

```
drwxr-xr-x
│└─┬─┘│ └──┘
│   │    └── 其他用户权限
│   └─────── 所属组权限
└───────────── 所有者权限
```

| 字符 | 说明 |
|------|------|
| `d` | 目录 |
| `-` | 普通文件 |
| `r` | 读权限 (4) |
| `w` | 写权限 (2) |
| `x` | 执行权限 (1) |

### 修改权限

```bash
chmod 755 filename        # 数字方式
chmod u+x filename        # 符号方式
chown user:group filename  # 改变所有者
```

## 用户管理

### 用户命令

```bash
useradd username          # 创建用户
userdel username          # 删除用户
usermod -aG group user   # 添加到组
passwd username           # 设置密码
su - username             # 切换用户
sudo command             # 以 root 执行
```

### 查看用户

```bash
whoami                    # 当前用户名
who                       # 登录用户
id                        # 用户 ID 信息
```

## 进程管理

### 查看进程

```bash
ps aux                    # 所有进程
ps -ef                    # 进程详情
top                       # 实时监控
htop                      # 高级监控
```

### 操作进程

```bash
kill PID                  # 终止进程
kill -9 PID               # 强制终止
killall processname        # 按名称终止
command &                  # 后台运行
nohup command &           # 忽略挂起运行
```

## 系统服务

### systemd（CentOS 7+）

```bash
systemctl start servicename      # 启动
systemctl stop servicename       # 停止
systemctl restart servicename     # 重启
systemctl status servicename      # 状态
systemctl enable servicename      # 开机自启
```

## 磁盘管理

```bash
df -h                     # 磁盘使用
du -sh /path              # 目录大小
lsblk                     # 块设备
mount /dev/sdb1 /mnt      # 挂载
umount /mnt               # 卸载
```

## 网络管理

### 查看配置

```bash
ip addr                   # 查看 IP
netstat -tuln            # 监听端口
ss -tuln                 # 推荐使用
ping -c 4 8.8.8.8        # 连通性测试
```

### 网络配置

```bash
ifconfig eth0 192.168.1.100  # 临时设置 IP
```

## 防火墙

### firewalld

```bash
firewall-cmd --state             # 状态
firewall-cmd --list-all          # 规则列表
firewall-cmd --add-port=80/tcp   # 添加端口
firewall-cmd --reload            # 重载配置
```

### iptables

```bash
iptables -L                      # 列出规则
iptables -A INPUT -p tcp --dport 80 -j ACCEPT  # 添加规则
```