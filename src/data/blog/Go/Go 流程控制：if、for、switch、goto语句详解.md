---
title: Go 流程控制：if、for、switch、goto语句详解
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-05-03T00:00:00.000+08:00
slug: go-control-flow
description: '详细讲解Go if条件语句、for循环、select多路复用、switch多路分支、goto跳转、break和continue控制关键字，包含完整代码示例和实战应用。'
tags:
  - Go
  - 流程控制
  - if语句
  - for循环
  - switch
  - select
  - goto
draft: false
language: zh-CN
---

## if 语句

```go
if 表达式1 {
    分支1
} else if 表达式2 {
    分支2
} else {
    分支3
}
```

> 左括号 `{` 必须与 `if` 在同一行。

### 示例

```go
var ten int = 11
if ten > 10 {
    fmt.Println(">10")
} else {
    fmt.Println("<=10")
}
```

### 特殊写法

```go
if err := Connect(); err != nil {
    fmt.Println(err)
    return
}
```

> 返回值作用域被限制在 if-else 语句组合中。

## for 循环

Go 语言只有 `for` 一种循环结构。

### 基本格式

```go
for 初始语句; 条件表达式; 结束语句 {
    循环体代码
}
```

### 省略初始语句

```go
step := 2
for ; step > 0; step-- {
    fmt.Println(step)
}
```

### 无限循环

```go
for {
    if i > 10 {
        break
    }
    i++
}
```

### 只有条件表达式

```go
var i int
for i <= 10 {
    i++
}
```

## 九九乘法表

```go
for y := 1; y <= 9; y++ {
    for x := 1; x <= y; x++ {
        fmt.Printf("%d*%d=%d ", x, y, x*y)
    }
    fmt.Println()
}
```

## for range 遍历

### 遍历数组/切片

```go
for key, value := range []int{1, 2, 3, 4} {
    fmt.Printf("key:%d value:%d\n", key, value)
}
```

### 遍历字符串

```go
var str = "hello"
for key, value := range str {
    fmt.Printf("key:%d value:0x%x\n", key, value)
}
```

### 遍历 map

```go
m := map[string]int{
    "hello": 100,
    "world": 200,
}
for key, value := range m {
    fmt.Println(key, value)
}
```

> map 遍历输出是无序的。

### 遍历通道

```go
c := make(chan int)
go func() {
    c <- 1
    c <- 2
    c <- 3
    close(c)
}()
for v := range c {
    fmt.Println(v)
}
```

## switch 语句

```go
switch 变量 {
case 值1:
    分支1
case 值2:
    分支2
default:
    默认分支
}
```

### 示例

```go
grade := "B"
switch grade {
case "A":
    fmt.Println("优秀")
case "B":
    fmt.Println("良好")
default:
    fmt.Println("一般")
}
```

### 多值匹配

```go
switch grade {
case "A", "B":
    fmt.Println("优秀或良好")
}
```

## 控制语句

| 语句 | 说明 |
|------|------|
| `break` | 跳出当前循环 |
| `continue` | 跳过本次迭代 |
| `goto` | 跳转到标签 |
| `return` | 退出函数 |

### goto 示例

```go
fmt.Println("start")
goto label
fmt.Println("skip")
label:
fmt.Println("label")
```