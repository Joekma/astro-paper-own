---
title: Go语言函数：参数、返回值、闭包、defer延迟调用
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-05-03T00:00:00.000+08:00
slug: go-functions
description: '深入讲解Go语言函数声明、参数传递、返回值处理、多返回值、命名返回值、闭包函数、defer延迟调用、panic异常处理和recover恢复机制，包含完整代码示例和最佳实践。'
tags:
  - Go
  - 函数
  - 闭包
  - defer
  - panic
  - recover
  - 参数传递
draft: false
language: zh-CN
---

## 函数声明

```go
func 函数名(参数列表)(返回参数列表) {
    函数体
}
```

| 部分 | 说明 |
|------|------|
| 函数名 | 字母、数字、下划线，首字符不能为数字 |
| 参数列表 | 参数变量和参数类型组成 |
| 返回参数 | 可以是类型列表或命名返回值 |
| 函数体 | 可重复调用的代码片段 |

### 参数类型简写

```go
func add(a, b int) int {
    return a + b
}
```

> 相邻同类型参数可以省略前面的类型。

## 返回值

### 多返回值

```go
func typedTwoValues() (int, int) {
    return 1, 2
}

a, b := typedTwoValues()
```

### 命名返回值

```go
func namedRetValues() (a, b int) {
    a = 1
    b = 2
    return
}
```

> 命名返回值默认为类型零值。

## 函数调用

```go
返回值变量列表 = 函数名(参数列表)
```

```go
result := add(1, 1)
```

## 示例：秒转换为时间

```go
const (
    SecondsPerMinute = 60
    SecondsPerHour   = 60 * 60
    SecondsPerDay    = 24 * 60 * 60
)

func resolveTime(seconds int) (day, hour, minute int) {
    day = seconds / SecondsPerDay
    hour = seconds / SecondsPerHour
    minute = seconds / SecondsPerMinute
    return
}

func main() {
    fmt.Println(resolveTime(1000))    // 0 0 16
    _, hour, minute := resolveTime(18000)
    fmt.Println(hour, minute)          // 5 300
}
```

## 参数传递

Go 语言使用值传递，指针、切片、map 引用类型指向的内容不会复制。

### 值传递示例

```go
type Data struct {
    complax  []int
    instance InnerData
    ptr      *InnerData
}

type InnerData struct {
    a int
}

func passByValue(inFunc Data) Data {
    fmt.Printf("inFunc value: %+v\n", inFunc)
    fmt.Printf("inFunc ptr: %p\n", &inFunc)
    return inFunc
}

func main() {
    in := Data{
        complax:  []int{1, 2, 3},
        instance: InnerData{5},
        ptr:      &InnerData{1},
    }
    out := passByValue(in)
    fmt.Printf("out value: %+v\n", out)
}
```

> 切片内部以指针存在，参数传递不会复制底层数组。

## 匿名函数

```go
func(x, y int) int {
    return x + y
}(1, 2)
```

## 闭包

```go
func adder() func(int) int {
    sum := 0
    return func(x int) int {
        sum += x
        return sum
    }
}

func main() {
    add := adder()
    fmt.Println(add(1))  // 1
    fmt.Println(add(2))  // 3
}
```