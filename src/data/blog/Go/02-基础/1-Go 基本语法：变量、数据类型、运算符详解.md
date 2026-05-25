---
title: Go 基本语法：变量、数据类型、运算符详解
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-05-03T00:00:00.000+08:00
slug: go-basic-syntax
description: '系统讲解 Go 标识符、变量、常量、基础类型、类型转换、运算符、指针、map 和基础错误处理，配合可读代码示例建立语法基础。'
tags:
  - Go
  - 基本语法
  - 变量
  - 数据类型
  - 运算符
  - 指针
  - Map
  - 错误处理
draft: false
series: go
seriesOrder: 2
language: zh-CN
---

## 标识符

标识符用于命名变量、函数、类型、常量、包等。

- 可以由 Unicode 字母、数字和下划线组成。
- 不能以数字开头。
- 大小写敏感，`Name` 和 `name` 是两个不同标识符。
- 首字母大写的包级标识符可以被其他包访问，首字母小写则仅包内可见。
- `_` 是空白标识符，用于显式忽略不需要的值。

```go
value, _ := strconv.Atoi("42") // 忽略错误只适合演示，生产代码应处理 err
fmt.Println(value)
```

---

## 变量声明

### 标准声明

```go
var name string
var age int
```

没有显式初始化时，变量会得到对应类型的零值。

| 类型 | 零值 |
|------|------|
| 数值类型 | `0` |
| 字符串 | `""` |
| 布尔值 | `false` |
| 指针、切片、map、函数、接口、channel | `nil` |

### 声明并初始化

```go
var name string = "gopher"
var age = 3 // 编译器推导为 int
```

### 短变量声明

```go
name := "gopher"
age, err := strconv.Atoi("3")
```

`:=` 只能在函数内部使用。在同一个作用域里，多变量短声明至少要引入一个新变量。

```go
count := 1
count, err := strconv.Atoi("2") // err 是新变量，所以合法
```

### 批量声明

```go
var (
    host = "127.0.0.1"
    port = 8080
    debug bool
)
```

---

## 常量与 iota

常量在编译期确定，不能被修改。

```go
const appName = "order-service"
const timeoutSeconds = 5
```

`iota` 常用于定义一组递增枚举值。

```go
type Status int

const (
    StatusPending Status = iota
    StatusPaid
    StatusCanceled
)
```

`iota` 每遇到一个新的 `const` 块会从 0 重新开始。

---

## 基础数据类型

### 整型

| 类型 | 说明 |
|------|------|
| `int8/int16/int32/int64` | 固定宽度有符号整数 |
| `uint8/uint16/uint32/uint64` | 固定宽度无符号整数 |
| `int/uint` | 宽度与平台相关，常用于普通计数 |
| `byte` | `uint8` 的别名，常用于二进制数据 |
| `rune` | `int32` 的别名，常用于 Unicode 字符 |

涉及协议、文件格式、网络传输时，优先使用固定宽度类型，例如 `uint32`、`int64`。

### 浮点和复数

```go
var price float64 = 19.9
var ratio float32 = 0.75
var z complex128 = 1 + 2i
```

### 布尔值

```go
var ok bool
if !ok {
    fmt.Println("not ok")
}
```

Go 不允许把整数隐式当作布尔值，`if 1 {}` 是非法代码。

### 字符串、byte 和 rune

字符串是只读字节序列，通常保存 UTF-8 文本。

```go
s := "Go语言"

fmt.Println(len(s)) // 字节数，不是字符数

for i, r := range s {
    // range 字符串时，i 是字节下标，r 是 rune
    fmt.Printf("index=%d rune=%c\n", i, r)
}
```

如果要按“字符”处理中文、emoji 等 Unicode 文本，通常要用 `rune`。

---

## 类型转换

Go 不做数值类型的隐式转换。

```go
var a int = 10
var b int64 = int64(a)
fmt.Println(b)
```

字符串和数字之间需要使用标准库。

```go
n, err := strconv.Atoi("42")
if err != nil {
    return err
}

s := strconv.Itoa(n)
fmt.Println(s)
```

---

## 运算符

### 算术运算符

| 运算符 | 说明 |
|--------|------|
| `+` | 加法或字符串拼接 |
| `-` | 减法 |
| `*` | 乘法 |
| `/` | 除法 |
| `%` | 取余，仅用于整数 |

```go
fmt.Println(7 / 2)   // 3，整数除法会截断
fmt.Println(7.0 / 2) // 3.5
```

### 比较和逻辑运算符

```go
age := 20
if age >= 18 && age < 65 {
    fmt.Println("working age")
}
```

| 运算符 | 说明 |
|--------|------|
| `==`、`!=` | 相等、不等 |
| `<`、`<=`、`>`、`>=` | 大小比较 |
| `&&` | 逻辑与 |
| `||` | 逻辑或 |
| `!` | 逻辑非 |

切片、map、函数不能直接比较，只能和 `nil` 比较。

### 位运算符

```go
const read = 1 << iota
const write = 1 << iota
```

| 运算符 | 说明 |
|--------|------|
| `&` | 按位与 |
| `|` | 按位或 |
| `^` | 按位异或 |
| `&^` | 位清除 |
| `<<`、`>>` | 左移、右移 |

---

## 指针

指针保存变量地址。Go 支持指针，但不支持指针运算。

```go
func addOne(n *int) {
    // n 是指针，*n 表示指针指向的值
    *n = *n + 1
}

func main() {
    count := 1
    addOne(&count) // &count 获取变量地址
    fmt.Println(count)
}
```

当函数需要修改调用方传入的变量，或者传递较大的结构体时，可以使用指针。

---

## map

map 是键值对集合。

```go
scores := map[string]int{
    "alice": 95,
    "bob":   88,
}

score, ok := scores["alice"]
if ok {
    fmt.Println(score)
}
```

读取不存在的 key 会得到值类型的零值，所以通常用第二个返回值判断 key 是否存在。

```go
delete(scores, "bob")
```

注意：普通 map 不是并发安全的。多 goroutine 并发读写时需要加锁，或在适合的场景使用 `sync.Map`。

---

## 基础错误处理

Go 习惯把错误作为最后一个返回值。

```go
func parsePort(s string) (int, error) {
    port, err := strconv.Atoi(s)
    if err != nil {
        return 0, fmt.Errorf("解析端口 %q: %w", s, err)
    }
    if port <= 0 || port > 65535 {
        return 0, fmt.Errorf("端口超出范围: %d", port)
    }
    return port, nil
}
```

`%w` 会保留原始错误，后续可以用 `errors.Is` 或 `errors.As` 判断错误链。

---

## 小结

Go 基础语法的重点不是记住每个符号，而是形成几个习惯：

1. 类型明确，必要时显式转换。
2. 错误显式返回和处理。
3. 字符串按字节存储，处理 Unicode 时理解 `rune`。
4. map、切片、指针等类型要理解零值和共享底层数据的行为。
5. 写完代码交给 `gofmt`，保持统一风格。
