---
title: Go 基本语法：变量、数据类型、运算符详解
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-05-03T00:00:00.000+08:00
slug: go-basic-syntax
description: '深入讲解Go标识符、变量声明、数据类型转换、运算符、优先级、指针、Map、异常处理等核心概念，包含大量代码示例和最佳实践。'
tags:
  - Go
  - 基本语法
  - 变量
  - 数据类型
  - 运算符
  - 指针
  - Map
  - 异常处理
draft: false
language: zh-CN
---

## 标识符

- 标识符以字母或下划线开头
- 大小写敏感
- `_` 是特殊标识符，用来忽略结果

## 变量声明

### 标准格式

```go
var 变量名 变量类型
```

> 变量声明以关键字 `var` 开头，后置变量类型。

### 批量格式

```go
var (
    a int
    b string
    c []float32
    d func() bool
    e struct {
        x int
    }
)
```

### 短变量声明

```go
hp := 100
conn, err := net.Dial("tcp", "127.0.0.1:8080")
```

> 使用 `:=` 推导类型，左值变量必须未定义过。

## 变量初始化

### 默认值

| 类型 | 默认值 |
|------|--------|
| 整型、浮点型 | `0` |
| 字符串 | 空字符串 `""` |
| 布尔型 | `false` |
| 切片、指针 | `nil` |

### 初始化方式

```go
var hp = 100           // 编译器推导类型
var a int = 10         // 标准格式
```

## 多重赋值

```go
var a int = 100
var b int = 200
b, a = a, b            // 交换变量
fmt.Println(a, b)      // 输出: 200 100
```

## 匿名变量

```go
func GetData() (int, int) {
    return 100, 200
}

a, _ := GetData()      // 忽略第二个返回值
_, b := GetData()      // 忽略第一个返回值
```

> 匿名变量不占用命名空间，不会分配内存。

## 整型

| 类型 | 说明 |
|------|------|
| `int8/int16/int32/int64` | 有符号整型 |
| `uint8/uint16/uint32/uint64` | 无符号整型 |
| `int/uint` | 平台相关整型 |
| `byte` | uint8 的别名 |
| `rune` | int32 的别名，表示 Unicode |

> 在二进制传输、文件结构描述时，避免使用 `int` 和 `uint`。

## 浮点型

```go
float32  // 最大范围约 3.4e38
float64  // 最大范围约 1.8e308
```

| 类型 | 常量 |
|------|------|
| `float32` | `math.MaxFloat32` |
| `float64` | `math.MaxFloat64` |

## 布尔型

```go
var n bool    // 默认值 false
```

> 布尔型无法参与数值运算，也无法与其他类型转换。

## 字符串

```go
str := "hello world"
ch := "中文"
```

### 转义符

| 转义符 | 含义 |
|--------|------|
| `\r` | 回车符 |
| `\n` | 换行符 |
| `\t` | 制表符 |
| `\'` | 单引号 |
| `\"` | 双引号 |
| `\\` | 反斜杠 |

### 多行字符串

```go
const str = `第一行
第二行
第三行`
```

> 使用反引号可以书写多行字符串。