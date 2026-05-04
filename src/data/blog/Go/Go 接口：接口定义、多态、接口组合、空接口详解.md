---
title: Go 接口：接口定义、多态、接口组合、空接口详解
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-05-03T00:00:00.000+08:00
slug: go-interfaces
description: '深入讲解Go接口声明、隐式实现、多态特性、接口组合、空接口、类型断言、类型查询和error接口，包含完整代码示例和最佳实践。'
tags:
  - Go
  - 接口
  - interface
  - 多态
  - 面向对象
  - 类型断言
  - error
draft: false
language: zh-CN
---

## 接口声明

接口是双方约定的一种合作协议。

```go
type 接口名 interface {
    方法名1(参数列表1) 返回值列表1
    方法名2(参数列表2) 返回值列表2
}
```

### 命名习惯

| 接口名 | 说明 |
|--------|------|
| `Writer` | 写操作 |
| `Reader` | 读操作 |
| `Closer` | 关闭操作 |
| `Stringer` | 字符串表示 |

### 示例

```go
type Writer interface {
    Write([]byte) (n int, err error)
}

type Stringer interface {
    String() string
}
```

## 接口实现

Go 语言的接口实现是隐式的，无须声明实现了哪些接口。

### 实现条件

| 条件 | 说明 |
|------|------|
| 方法签名一致 | 方法名、参数列表、返回值一致 |
| 全部方法实现 | 接口中所有方法都被实现 |

### 示例

```go
type DataWriter interface {
    WriteData(data interface{}) error
}

type file struct{}

func (d *file) WriteData(data interface{}) error {
    fmt.Println("WriteData:", data)
    return nil
}

func main() {
    var writer DataWriter
    f := new(file)
    writer = f
    writer.WriteData("data")
}
```

## 类型与接口关系

### 一对多：一个类型实现多个接口

```go
type Socket struct{}

func (s *Socket) Write(p []byte) (n int, err error) {
    return 0, nil
}

func (s *Socket) Close() error {
    return nil
}

// 实现了 io.Writer 和 io.Closer 两个接口
```

### 多对一：多个类型实现同一接口

```go
type Logger struct{}

func (g *Logger) Log(l string) {}

type GameService struct {
    Logger  // 嵌入日志器
}

func (g *GameService) Start() {}

var s Service = new(GameService)
// GameService 通过嵌入 Logger 实现了 Service 的 Log 方法
```

## 接口类型断言

### 安全断言

```go
var w io.Writer = os.Stdout

if f, ok := w.(*os.File); ok {
    fmt.Println(f.Name())
}
```

### switch 类型判断

```go
switch v := i.(type) {
case int:
    fmt.Println("int:", v)
case string:
    fmt.Println("string:", v)
default:
    fmt.Println("unknown")
}
```

## 空接口

```go
interface{}  // 空接口，所有类型都实现空接口
```

### 使用场景

```go
func PrintAll(vals []interface{}) {
    for _, val := range vals {
        fmt.Println(val)
    }
}
```

## 接口组合

```go
type ReadWriter interface {
    Reader
    Writer
}
```

> 接口可以嵌入其他接口，组合成更复杂的接口。