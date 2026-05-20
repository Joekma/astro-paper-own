---
title: Git 深入浅出：版本控制的艺术
series: Git
seriesOrder: 2
author: Joekma
pubDatetime: 2026-05-07T00:00:00.000+08:00
modDatetime: 2026-05-16T00:00:00.000+08:00
slug: git-deep-dive
description: '深入讲解 Git 版本控制系统，从核心概念到分支、远程协作、撤销操作、工作流和最佳实践。'
tags:
  - Git
  - 版本控制
draft: false
language: zh-CN
---

## 概述

Git 是一个分布式版本控制系统，由 Linux 内核开发者 Linus Torvalds 于 2005 年创建。它让每个开发者都拥有完整的本地仓库，可以离线提交、创建分支、查看历史，并在需要时与远程仓库同步。

## 为什么选择 Git

| 特性 | 说明 |
|------|------|
| **分布式** | 每个克隆都有完整历史 |
| **高性能** | 大部分操作在本地完成 |
| **数据完整性** | 对对象内容计算哈希，发现意外损坏 |
| **分支轻量** | 分支创建、切换、合并成本低 |
| **生态成熟** | GitHub、GitLab、Gitea 等平台广泛支持 |

Git 传统上使用 SHA-1 标识对象，新版本也在推进 SHA-256 仓库格式。日常使用中可以把提交哈希理解为提交对象的唯一标识。

## 核心概念

### 三个区域

```text
工作目录  <->  暂存区(Index)  <->  本地仓库(.git)
   |                                  ^
   |                                  |
   +---------- 远程仓库同步 ----------+
```

| 区域 | 说明 |
|------|------|
| **工作目录** | 你正在编辑的项目文件 |
| **暂存区** | 下一次提交要包含的内容快照 |
| **本地仓库** | `.git` 目录保存的对象、引用和历史 |
| **远程仓库** | GitHub/GitLab 等服务器上的另一个仓库副本 |

`.git` 是本地仓库，不等于“本地仓库 + 远程仓库”。远程仓库通过 `origin/main` 这类远程跟踪分支在本地留下引用。

### 基本工作流程

```bash
git status
git add filename
git commit -m "提交说明"
git push
```

### 文件状态

Git 文件首先分为：

| 状态 | 说明 |
|------|------|
| **未跟踪 (Untracked)** | Git 尚未纳入管理的新文件 |
| **已跟踪 (Tracked)** | Git 已管理的文件 |

已跟踪文件可能处于：

| 状态 | 说明 |
|------|------|
| **未修改 (Unmodified)** | 与当前提交一致 |
| **已修改 (Modified)** | 工作目录有改动但未暂存 |
| **已暂存 (Staged)** | 已加入暂存区，等待提交 |

## 基础命令

### 初始化与配置

```bash
git init
git clone https://github.com/username/repo.git

git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
git config --list
```

### 查看与提交

```bash
git status
git diff
git diff --staged

git add filename
git add .
git commit -m "提交信息"

git log
git log --oneline
git log --oneline --graph --decorate --all
```

`git commit -am "提交信息"` 只会提交已跟踪文件的修改，不会自动加入未跟踪的新文件。

## 撤销操作

```bash
# 取消暂存，保留工作目录修改
git restore --staged filename

# 旧命令也常见
git reset HEAD filename

# 丢弃工作目录修改，危险
git restore filename

# 修改最后一次提交
git commit --amend
```

回退提交：

```bash
# 回退提交但保留改动在暂存区
git reset --soft HEAD~1

# 回退提交并保留改动在工作目录
git reset --mixed HEAD~1

# 回退提交并丢弃改动，危险
git reset --hard HEAD~1
```

公共分支上优先使用 `git revert` 生成反向提交，不要随意改写历史：

```bash
git revert commit-hash
```

## 分支管理

分支是指向某个提交的可移动引用。创建分支不会复制一份完整代码。

```bash
# 查看分支
git branch
git branch -r
git branch -a

# 创建分支
git branch feature-name

# 切换分支
git switch feature-name

# 创建并切换
git switch -c feature-name

# 兼容旧版本 Git
git checkout -b feature-name

# 删除本地分支
git branch -d feature-name
git branch -D feature-name

# 重命名分支
git branch -m old-name new-name
```

## 合并与冲突

```bash
# 合并分支到当前分支
git merge feature-name

# 取消正在进行的合并
git merge --abort
```

冲突标记示例：

```text
<<<<<<< HEAD
当前分支的内容
=======
被合并分支的内容
>>>>>>> feature-name
```

解决步骤：

```bash
# 1. 编辑文件，保留正确内容并删除冲突标记
# 2. 标记冲突已解决
git add filename

# 3. 完成合并提交
git commit
```

## 远程操作

```bash
git remote -v
git remote add origin https://github.com/username/repo.git
git remote show origin
git remote rename old new
git remote remove origin
```

推送与拉取：

```bash
git push origin main
git push -u origin main

git fetch origin
git pull origin main
git pull --rebase origin main
```

`git fetch` 只更新远程跟踪分支，不会修改当前工作分支；`git pull` 等于 fetch 后再 merge 或 rebase。

强制推送优先使用更安全的形式：

```bash
git push --force-with-lease
```

`git push --force` 可能覆盖他人已推送的提交，不应作为团队协作默认命令。

## 储藏工作进度

```bash
# 储藏已跟踪文件的修改
git stash push -m "工作进度说明"

# 同时包含未跟踪文件
git stash push -u -m "包含新文件"

# 查看储藏列表
git stash list

# 应用但不删除
git stash apply stash@{0}

# 应用并删除
git stash pop

# 查看储藏内容
git stash show -p stash@{0}

# 删除储藏
git stash drop stash@{0}
```

## 标签管理

```bash
# 轻量标签
git tag v1.0.0

# 附注标签，发布版本更推荐
git tag -a v1.0.0 -m "版本说明"

git tag
git push origin v1.0.0
git push --tags

git tag -d v1.0.0
git push origin --delete v1.0.0
```

## 查看与比较

```bash
git log --oneline --graph --all
git log -p -- filename
git log -2

git diff branch1..branch2
git diff commit1 commit2
git blame filename
git log -p --author="username"
```

## .gitignore 文件

```text
# 忽略所有 .log 文件
*.log

# 忽略依赖目录
node_modules/

# 忽略构建产物
dist/
build/

# 取消忽略特定文件
!important.log
```

`.gitignore` 不会自动停止跟踪已经提交过的文件。需要取消跟踪但保留本地文件时：

```bash
git rm --cached filename
```

## 常见工作流

### GitHub Flow

```bash
git switch -c feature-name
# 开发并提交
git push -u origin feature-name
# 创建 Pull Request
# 代码审查后合并
```

GitHub Flow 简洁，适合持续交付和多数 Web 项目。

### Git Flow

| 分支 | 说明 |
|------|------|
| `main` | 生产稳定分支 |
| `develop` | 集成开发分支 |
| `feature/*` | 功能分支 |
| `release/*` | 发布准备分支 |
| `hotfix/*` | 生产热修复分支 |

Git Flow 分支较多，适合发布周期明确的软件，不一定适合所有团队。

## 实战技巧

### 清理已合并分支

先查看：

```bash
git branch --merged main
```

再逐个删除：

```bash
git branch -d feature-name
```

不建议直接运行批量删除命令，因为它可能误删仍需保留的本地分支。

### 找回丢失提交

```bash
git reflog
git switch -c recovery-branch commit-hash
```

`reflog` 记录本地引用移动历史，是误 reset 后的重要恢复工具。

### 查看修改者

```bash
git blame filename
git log --format="%an" -1 -- filename
```

## 最佳实践

| 实践 | 说明 |
|------|------|
| 原子提交 | 一个提交只解决一个问题 |
| 清晰提交信息 | 说明“为什么”和“做了什么” |
| 频繁同步 | 避免长期分支积累大量冲突 |
| 谨慎改写历史 | 公共分支不要随意 reset/rebase 后强推 |
| 提交前自检 | 运行测试、格式化和静态检查 |

常见提交信息：

```text
feat: 添加用户注册功能
fix: 修复登录页面样式问题
docs: 更新 README 文档
refactor: 重构用户认证模块
test: 添加单元测试
chore: 更新依赖版本
```

## 快速命令参考

```bash
git status
git add .
git commit -m "消息"
git push

git switch -c feature-name
git merge feature-name
git log --oneline --graph --all
git diff
git stash push -u -m "临时保存"
```

## 总结

Git 的核心是对象、引用、暂存区和分支。掌握这些概念后，再学习 merge、rebase、stash、revert、reflog 等命令，会比单纯背命令更稳。
