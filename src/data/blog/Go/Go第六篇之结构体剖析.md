---
title: Go 第六篇之结构体剖析
author: 程序员
pubDatetime: 2019-01-17T00:00:00.000+08:00
updated: 2026-04-22T00:00:00.000+08:00
slug: go-structs
description: 'Go 语言结构体详解，包括定义、实例化和初始化'
tags:
  - Go
category: Go
draft: false
language: zh-CN
---

## 结构体定义

```go
type 类型名 struct {
    字段1 字段1类型
    字段2 字段2类型
}
```

### 示例

```go
type Point struct {
    X int
    Y int
}

type Color struct {
    R, G, B byte  // 同类型可写在一行
}
```

> 结构体定义只是内存布局描述，需要实例化才能使用。

## 实例化

### 基本实例化

```go
var p Point
p.X = 10
p.Y = 20
```

### new 实例化

```go
tank := new(Player)
// tank 类型为 *Player
tank.Name = "Canon"
tank.HealthPoint = 300
```

### 取地址实例化

```go
cmd := &Command{}
cmd.Name = "version"
cmd.Var = &version
```

> 取地址实例化是最广泛使用的方式。

## 初始化

### 键值对初始化

```go
p := Point{
    X: 10,
    Y: 20,
}
```

### 列表初始化

```go
addr := Address{
    "四川",
    "成都",
    610000,
}
```

> 必须初始化所有字段，且顺序与声明一致。

### 嵌套初始化

```go
relation := &People{
    name: "爷爷",
    child: &People{
        name: "爸爸",
        child: &People{
            name: "我",
        },
    },
}
```

## 匿名结构体

```go
ins := struct {
    ID   int
    Data string
}{
    ID:   1,
    Data: "test",
}
```

## 结构体方法

### 值接收器方法

```go
func (p Point) Distance() float64 {
    return math.Sqrt(float64(p.X*p.X + p.Y*p.Y))
}
```

### 指针接收器方法

```go
func (p *Point) Offset(x, y int) {
    p.X += x
    p.Y += y
}
```

> 需要修改结构体或大型结构体使用指针接收器。

## 结构体嵌套

### 组合

```go
type Base struct {
    Name string
}

type Person struct {
    Base
    Age int
}

p := Person{
    Base: Base{Name: "张三"},
    Age:  30,
}
fmt.Println(p.Name)  // 直接访问内部字段
```

### 命名嵌入

```go
type Base struct {
    Name string
}

type Person struct {
    base Base
    Age  int
}
```

## 结构体标签

```go
type Person struct {
    Name string `json:"name"`
    Age  int    `json:"age"`
}
```

> 标签用于反射获取或序列化时指定字段名称。