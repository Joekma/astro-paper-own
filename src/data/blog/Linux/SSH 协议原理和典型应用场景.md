---
title: SSH 协议原理和典型应用场景
series: Linux
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-05-16T00:00:00.000+08:00
slug: ssh-protocol-applications
description: '讲解 SSH 协议的加密机制、连接过程、常用命令、密钥管理、端口转发和安全配置。'
tags:
  - SSH
  - 远程登录
  - 安全
draft: false
language: zh-CN
---

## 概述

SSH（Secure Shell）是一种加密网络协议，常用于远程登录、远程执行命令、文件传输和安全隧道。它解决的核心问题是：即使网络不可信，也能验证服务器身份、保护认证凭据和加密传输内容。

## SSH 工作原理

### 加密机制

| 类型 | 说明 |
|------|------|
| **密钥交换** | 双方协商会话密钥，常见算法包括 Diffie-Hellman 和 ECDH |
| **主机密钥** | 客户端用它验证服务器身份，防止中间人攻击 |
| **对称加密** | 使用会话密钥加密后续数据，效率高 |
| **消息认证** | 使用 MAC 或 AEAD 验证数据完整性 |
| **用户认证** | 使用密码、公钥、证书或多因素方式认证用户 |

非对称加密在 SSH 中主要用于身份验证和密钥交换过程，并不是用来加密整个会话数据。

### 连接过程

```text
客户端                         服务端
  | -------- 版本协商 --------> |
  | <------ 算法列表 ---------- |
  | ---- 密钥交换与主机验证 ---> |
  | <------ 建立会话密钥 ------ |
  | ---- 用户身份认证 --------> |
  | <====== 加密会话开始 =====> |
```

首次连接新主机时，客户端会把主机指纹写入 `~/.ssh/known_hosts`。如果之后指纹变化，应先确认服务器是否重装或更换密钥，不要直接忽略警告。

## SSH 命令详解

### 基本连接

```bash
# 登录远程主机
ssh user@hostname

# 指定端口
ssh -p 2222 user@hostname

# 使用指定私钥
ssh -i ~/.ssh/my_key user@hostname
```

### 文件传输

```bash
# 复制文件到远程
scp /path/local/file.txt user@host:/path/remote/

# 复制整个目录
scp -r /path/local/folder user@host:/path/remote/

# 从远程下载
scp user@host:/path/remote/file.txt /path/local/

# 指定端口传输，scp 使用大写 -P
scp -P 2222 file.txt user@host:/path/
```

OpenSSH 新版本中的 `scp` 默认行为已有变化。需要交互式传输或批量管理文件时，可以优先使用 `sftp` 或 `rsync -e ssh`。

### 远程执行

```bash
# 执行单条命令
ssh user@host "ls -la /home"

# 执行多条命令
ssh user@host "cd /tmp && ls"

# 远程执行本地脚本
ssh user@host 'bash -s' < script.sh
```

### 端口转发

```bash
# 本地端口转发：访问本机 8080，转到远程内网服务
ssh -L 8080:remote_host:80 user@gateway

# 远程端口转发：远程 8080 转到本地服务
ssh -R 8080:localhost:80 user@gateway

# 动态端口转发：创建 SOCKS 代理
ssh -D 1080 user@host
```

端口转发常用于临时访问内网服务。生产环境应配合防火墙、审计和最小权限策略。

## SSH 密钥管理

### 生成密钥对

```bash
# 推荐：生成 ED25519 密钥
ssh-keygen -t ed25519 -C "your_email@example.com"

# 兼容旧系统：生成 RSA 4096 位密钥
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"

# 指定存放位置
ssh-keygen -t ed25519 -f ~/.ssh/my_key
```

私钥应设置强口令并妥善保管，不要把私钥发送给他人或提交到代码仓库。

### ssh-agent

```bash
# 启动 agent 后添加密钥
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/my_key

# 查看已添加的密钥
ssh-add -l

# 删除所有已添加密钥
ssh-add -D
```

### 客户端配置

编辑 `~/.ssh/config`：

```text
Host myserver
    HostName 192.168.1.100
    User admin
    Port 22
    IdentityFile ~/.ssh/my_key
    IdentitiesOnly yes
    ServerAliveInterval 60

Host server2
    HostName example.com
    User ubuntu
    Port 2222
```

不建议默认写 `ForwardAgent yes`。Agent 转发会让远程主机在会话期间使用你的本地 agent，如果远程主机不可信，会扩大风险。确实需要时，只对单个可信 Host 开启。

```text
Host trusted-jump
    HostName jump.example.com
    User admin
    ForwardAgent yes
```

## 公钥分发

推荐使用 `ssh-copy-id`：

```bash
ssh-copy-id -i ~/.ssh/my_key.pub user@host
```

手动方式：

```bash
cat ~/.ssh/my_key.pub | ssh user@host 'umask 077; mkdir -p ~/.ssh; cat >> ~/.ssh/authorized_keys'
```

原理是把本地公钥追加到远程用户的 `~/.ssh/authorized_keys`。不要把私钥复制到服务器上。

## SSH 安全配置

服务端配置文件通常是 `/etc/ssh/sshd_config`。修改前先备份并检查语法：

```bash
sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak.$(date +%F)
sudo sshd -t
```

常见配置：

```text
# 禁用密码登录，确认密钥可用后再启用
PasswordAuthentication no

# 禁用 root 直接登录
PermitRootLogin no

# 启用公钥认证
PubkeyAuthentication yes

# 禁用空密码
PermitEmptyPasswords no

# 超时设置
ClientAliveInterval 300
ClientAliveCountMax 2

# 限制用户或用户组
AllowUsers user1 user2
AllowGroups sshusers
```

重启服务：

```bash
sudo sshd -t
sudo systemctl restart sshd
```

## 常见问题

### 连接超时

```text
Host *
    ServerAliveInterval 60
    ServerAliveCountMax 3
    ConnectTimeout 10
```

还应检查服务器安全组、防火墙、监听端口和路由。

### 权限问题

```bash
chmod 700 ~/.ssh
chmod 600 ~/.ssh/id_ed25519
chmod 644 ~/.ssh/id_ed25519.pub
chmod 600 ~/.ssh/authorized_keys
chmod 600 ~/.ssh/config
```

### known_hosts 问题

```bash
# 移除旧主机记录
ssh-keygen -R hostname

# 重新连接并核对指纹
ssh user@hostname
```

不要为了省事长期配置 `StrictHostKeyChecking no`，它会削弱主机身份验证。

## 小结

SSH 的安全性来自主机身份验证、密钥交换、加密会话和用户认证共同配合。日常使用中，应优先使用密钥登录、保护私钥、谨慎使用 Agent 转发，并在修改服务端配置前保留可回滚入口。
