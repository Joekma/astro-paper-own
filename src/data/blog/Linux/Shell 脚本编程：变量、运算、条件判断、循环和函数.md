---
title: Shell 脚本编程：变量、运算、条件判断、循环和函数
series: Linux
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-05-03T00:00:00.000+08:00
slug: shell-scripting
description: '深入讲解Shell脚本编程，包含变量、运算、条件判断、循环、函数、字符串处理、数组、输入输出和管道重定向，包含大量实战示例。'
tags:
  - Shell
  - Bash
  - 脚本编程
  - Linux
  - 自动化
draft: false
language: zh-CN
---

## 简介

Shell 是 Unix/Linux 系统的命令行解释器，是用户与操作系统内核之间的接口。

### Shell 类型

| 类型 | 说明 |
|------|------|
| **Bash** | Bourne Again Shell，最常用 |
| **Zsh** | 功能强大的 Shell |
| **Fish** | 用户友好的 Shell |
| **Sh** | 原始 Bourne Shell |

### 脚本首行

```bash
#!/bin/bash
#!/usr/bin/env bash
```

## 变量

### 基本定义

```bash
name="John"        # 普通变量
age=25
readonly PI=3.14159  # 只读变量
```

### 使用变量

```bash
echo "Name: $name"
echo "Age: ${age}"
```

### 环境变量

```bash
echo $PATH
echo $HOME
echo $USER

export VAR_NAME="value"
```

### 特殊变量

| 变量 | 说明 |
|------|------|
| `$0` | 脚本名称 |
| `$1-$9` | 第1-9个参数 |
| `$#` | 参数个数 |
| `$*` | 所有参数（单个字符串） |
| `$@` | 所有参数（独立字符串） |
| `$?` | 上一条命令退出状态 |
| `$$` | 当前进程 ID |

## 运算

### 算术运算

```bash
a=10
b=5

echo $((a + b))    # 加法：15
echo $((a - b))    # 减法：5
echo $((a * b))    # 乘法：50
echo $((a / b))    # 除法：2
echo $((a % b))    # 取余：0

((a++))            # 自增
((a += 5))         # 加法赋值
```

### 浮点运算

```bash
echo "scale=2; 10 / 3" | bc
awk 'BEGIN {printf "%.2f\n", 10/3}'
```

### 逻辑运算

```bash
# 字符串比较
[[ "abc" == "abc" ]]
[[ -z "$str" ]]      # 字符串为空
[[ -n "$str" ]]      # 字符串非空

# 数字比较
[[ $a -eq $b ]]      # 相等
[[ $a -gt $b ]]      # 大于
[[ $a -lt $b ]]      # 小于

# 文件测试
[[ -e file ]]        # 文件存在
[[ -f file ]]        # 普通文件
[[ -d file ]]        # 目录
[[ -r file ]]        # 可读
[[ -w file ]]        # 可写
[[ -x file ]]        # 可执行
```

## 条件判断

### if 语句

```bash
if [ $a -gt $b ]; then
    echo "a > b"
elif [ $a -eq $b ]; then
    echo "a == b"
else
    echo "a < b"
fi
```

### case 语句

```bash
case $variable in
    value1)
        echo "值是1"
        ;;
    value2)
        echo "值是2"
        ;;
    *)
        echo "其他值"
        ;;
esac
```

## 循环

### for 循环

```bash
# 基本循环
for i in 1 2 3 4 5; do
    echo "Number: $i"
done

# C 风格
for ((i=0; i<10; i++)); do
    echo "Count: $i"
done

# 遍历数组
arr=(apple banana orange)
for fruit in "${arr[@]}"; do
    echo "Fruit: $fruit"
done
```

### while 循环

```bash
i=1
while [ $i -le 5 ]; do
    echo "Count: $i"
    ((i++))
done

# 无限循环
while true; do
    echo "Running..."
    sleep 1
done
```

### until 循环

```bash
i=1
until [ $i -gt 5 ]; do
    echo "Count: $i"
    ((i++))
done
```

## 函数

### 定义函数

```bash
function hello() {
    echo "Hello, $1"
}

hello "World"
```

### 返回值

```bash
function add() {
    return $(($1 + $2))
}

add 3 5
echo $?  # 输出: 8
```

### 局部变量

```bash
function demo() {
    local var="局部变量"
    echo $var
}
```

## 字符串处理

```bash
str="Hello World"

# 长度
echo ${#str}

# 子串
echo ${str:0:5}    # Hello
echo ${str:6}      # World

# 替换
echo ${str/World/Shell}

# 切除
echo ${str#Hello}   # World
echo ${str%World}  # Hello
```

## 数组

### 基本操作

```bash
arr=(one two three)
echo ${arr[0]}      # one
echo ${arr[@]}       # 全部元素
echo ${#arr[@]}      # 数组长度

arr[0]="ONE"        # 修改元素
arr+=(four five)    # 追加元素
unset arr[1]        # 删除元素
```

## 输入输出

### echo 和 printf

```bash
echo "Hello"
printf "Name: %s, Age: %d\n" "Tom" 25
```

### read

```bash
read -p "请输入姓名: " name
read -s -p "请输入密码: " password
```

### 重定向

```bash
command > file       # 输出重定向
command >> file      # 追加
command < file       # 输入重定向
command 2> file      # 错误重定向
command &> file       # 所有输出
```

### 管道

```bash
cat file.txt | grep "pattern"
ls -la | head -n 10
```

## 常用命令

| 命令 | 说明 |
|------|------|
| `sed` | 流编辑器 |
| `awk` | 文本处理 |
| `cut` | 字段提取 |
| `sort` | 排序 |
| `uniq` | 去重 |
| `wc` | 统计 |
| `xargs` | 参数构建 |
| `find` | 文件查找 |
| `grep` | 模式匹配 |
| `tr` | 字符转换 |