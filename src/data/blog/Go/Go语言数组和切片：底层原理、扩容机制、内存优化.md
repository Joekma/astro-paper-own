---
title: Go语言数组和切片：底层原理、扩容机制、内存优化
author: 程序员
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-05-03T00:00:00.000+08:00
slug: go-slice-array
description: '深入讲解Go语言数组和切片的声明、初始化、遍历、切片操作、append扩容机制、底层数组原理、内存优化技巧，Map和sync.Map高性能并发使用，包含完整代码示例。'
tags:
  - Go
  - 数组
  - 切片
  - 内存管理
  - Map
  - sync.Map
draft: false
language: zh-CN
---

## 数组

数组是一段固定长度的连续内存区域，声明时确定大小，大小不可变化。

### 声明

```go
var 数组变量名 [元素数量]T
```

### 示例

```go
var team [3]string
team[0] = "hammer"
team[1] = "soldier"
team[2] = "mum"
fmt.Println(team)  // [hammer soldier mum]
```

### 初始化

```go
// 指定大小
var team = [3]string{"hammer", "soldier", "mum"}

// 自动推断大小
var team = [...]string{"hammer", "soldier", "mum"}
```

### 遍历

```go
for k, v := range team {
    fmt.Println(k, v)
}
```

## 切片

切片是拥有相同类型元素的可变长度序列，包含地址、大小和容量。

### 从数组生成

```go
slice [开始位置:结束位置]
```

| 操作 | 说明 |
|------|------|
| `a[1:2]` | 取出元素数量：结束位置 - 开始位置 |
| `a[:]` | 从开头到末尾 |
| `a[1:]` | 从索引 1 到末尾 |
| `a[:2]` | 从开头到索引 2 |

### 直接声明

```go
var strList []string           // nil 切片
var numListEmpty = []int{}     // 空切片，已分配内存
```

### make() 创建

```go
make([]T, size, cap)
```

| 参数 | 说明 |
|------|------|
| `T` | 切片元素类型 |
| `size` | 元素数量 |
| `cap` | 预分配容量 |

```go
a := make([]int, 2)        // len=2, cap=2
b := make([]int, 2, 10)    // len=2, cap=10
```

### 常用操作

| 方法 | 说明 |
|------|------|
| `len()` | 获取长度 |
| `cap()` | 获取容量 |
| `append()` | 添加元素 |
| `copy()` | 复制切片 |

### append() 添加元素

```go
var numbers []int
for i := 0; i < 10; i++ {
    numbers = append(numbers, i)
}
```

> 切片容量不足时，会进行扩容，通常按 2 倍扩充。

### 切片复制

```go
source := []int{1, 2, 3}
dest := make([]int, len(source))
copy(dest, source)
```

### 删除元素

```go
// 删除索引为 i 的元素
numbers = append(numbers[:i], numbers[i+1:]...)
```

### 切片截取

```go
a := []int{1, 2, 3, 4, 5}
b := a[1:3]     // [2, 3]
c := a[:3]      // [1, 2, 3]
d := a[2:]      // [3, 4, 5]
```

### 多维切片

```go
twoD := [][]int{
    {1, 2, 3},
    {4, 5, 6},
}
```