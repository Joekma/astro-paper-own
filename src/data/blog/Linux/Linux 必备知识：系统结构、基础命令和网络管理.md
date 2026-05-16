---
title: Linux 必备知识：系统结构、基础命令和网络管理
series: Linux
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-05-16T00:00:00.000+08:00
slug: linux-essential-knowledge
description: '讲解 Linux 系统结构、目录结构、文件操作、权限、用户、进程、systemd、磁盘、网络和防火墙基础。'
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

Linux 是开源的 Unix-like 操作系统内核，由 Linus Torvalds 于 1991 年发布。日常所说的 Linux 系统一般是 Linux 内核加 GNU 工具、系统服务、包管理器和发行版配置共同组成的操作系统。

## 系统架构

```text
┌──────────────────────────────────────┐
│           用户应用程序               │
├──────────────────────────────────────┤
│         Shell / 图形界面              │
├──────────────────────────────────────┤
│       系统库与系统调用接口           │
├──────────────────────────────────────┤
│             Linux 内核               │
├──────────────────────────────────────┤
│             硬件设备                 │
└──────────────────────────────────────┘
```

Shell 负责解释命令，内核负责进程、内存、文件系统、网络和设备管理。

## 目录结构

| 目录 | 说明 |
|------|------|
| `/` | 根目录，文件系统起点 |
| `/bin` | 基本用户命令 |
| `/sbin` | 系统管理命令 |
| `/etc` | 系统配置文件 |
| `/home` | 普通用户家目录 |
| `/root` | root 用户家目录 |
| `/var` | 可变数据，例如日志、缓存、队列 |
| `/tmp` | 临时文件目录 |
| `/usr` | 用户程序、库和文档 |
| `/proc` | 内核和进程信息的虚拟文件系统 |
| `/dev` | 设备文件 |
| `/mnt` | 临时挂载点 |
| `/opt` | 第三方或可选应用 |

## 文件操作

### 目录操作

```bash
ls -la
cd /path/to/directory
pwd
mkdir directory_name
rmdir empty_directory
```

删除目录前先确认路径：

```bash
rm -ri directory_name
```

`rm -rf` 会递归强制删除，适合脚本中的受控路径，不应作为初学者默认删除命令。

### 文件操作

```bash
touch filename
cp source dest
cp -r source_dir dest_dir
mv source dest
rm filename
cat filename
less filename
head -n 10 filename
tail -n 10 filename
tail -f filename
```

大文件查看优先使用 `less`、`head`、`tail`，不要直接 `cat` 巨大日志。

### 文件搜索

```bash
find /path -name "*.txt"
grep -R "pattern" /path
locate filename
which command
command -v command
```

`locate` 依赖索引数据库，结果可能不是实时的。

## 文件权限

### 权限表示

```text
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
| `r` | 读权限，数字值 4 |
| `w` | 写权限，数字值 2 |
| `x` | 执行权限，数字值 1 |

### 修改权限

```bash
chmod 755 script.sh
chmod u+x script.sh
chown user:group filename
```

不要为了省事使用 `chmod 777`。它会给所有用户读、写、执行权限，通常会扩大安全风险。

## 用户管理

```bash
sudo useradd username
sudo passwd username
sudo usermod -aG group username
sudo userdel username
su - username
sudo command
```

查看当前身份：

```bash
whoami
who
id
groups
```

涉及系统用户和 sudo 权限的修改，建议先确认发行版约定。例如 Debian/Ubuntu 常用 `sudo` 组，RHEL/CentOS 系常用 `wheel` 组。

## 进程管理

### 查看进程

```bash
ps aux
ps -ef
top
htop
```

`htop` 不是所有系统默认安装。

### 操作进程

```bash
kill PID
kill -TERM PID
kill -9 PID
killall processname
command &
nohup command &
```

优先使用默认的 `SIGTERM` 优雅停止。`kill -9` 会跳过进程清理逻辑，只应在进程无法正常退出时使用。

## 系统服务

多数现代 Linux 发行版使用 systemd：

```bash
systemctl start servicename
systemctl stop servicename
systemctl restart servicename
systemctl status servicename
systemctl enable servicename
systemctl disable servicename
journalctl -u servicename
```

查看服务失败原因时，`systemctl status` 和 `journalctl -u` 通常一起使用。

## 磁盘管理

```bash
df -h
du -sh /path
lsblk
blkid
mount /dev/sdb1 /mnt
umount /mnt
```

挂载生产磁盘前，应确认设备名、文件系统类型和是否已有数据。设备名如 `/dev/sdb` 可能随启动顺序变化，长期配置建议使用 UUID。

## 网络管理

### 查看网络

```bash
ip addr
ip route
ss -tuln
ping -c 4 8.8.8.8
curl -I https://example.com
```

`ip` 和 `ss` 是现代系统中更推荐的工具。`ifconfig`、`netstat` 在很多发行版中属于兼容工具或需要额外安装。

### 临时配置 IP

```bash
sudo ip addr add 192.168.1.100/24 dev eth0
sudo ip link set eth0 up
```

临时配置重启后会丢失。永久配置需要使用发行版的网络管理方式，例如 NetworkManager、netplan 或系统网络配置文件。

## 防火墙

### firewalld

```bash
sudo firewall-cmd --state
sudo firewall-cmd --list-all
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-port=8080/tcp
sudo firewall-cmd --reload
```

### iptables

```bash
sudo iptables -L -n -v
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
```

iptables 命令直接影响防火墙规则。生产环境修改前应确认现有规则和持久化方式，避免断开 SSH 连接。

## 小结

Linux 入门应先掌握目录结构、权限、用户、进程、服务、磁盘和网络这些基础概念。执行删除、权限、防火墙、磁盘挂载等命令前，先确认目标对象和回滚方式。
