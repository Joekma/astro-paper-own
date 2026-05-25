---
title: Go 流程控制：if、for、switch、goto语句详解
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-05-03T00:00:00.000+08:00
slug: go-control-flow
description: '详细讲解 Go if、for、range、switch、select、break、continue、goto 等流程控制语句，并说明常见边界和现代 Go 版本变化。'
tags:
  - Go
  - 流程控制
  - if语句
  - for循环
  - switch
  - select
  - goto
draft: false
series: go
seriesOrder: 3
language: zh-CN
---

## if 语句

Go 的 `if` 条件不需要小括号，但左大括号必须和 `if` 在同一行。

```go
if score >= 90 {
    fmt.Println("A")
} else if score >= 80 {
    fmt.Println("B")
} else {
    fmt.Println("C")
}
```

### 带初始化语句

```go
if value, err := strconv.Atoi(input); err != nil {
    return fmt.Errorf("非法数字 %q: %w", input, err)
} else {
    fmt.Println("解析结果:", value)
}
```

`value` 和 `err` 的作用域只在这个 `if-else` 语句内部，适合临时变量。

---

## for 循环

Go 只有 `for` 一个循环关键字。

### 传统三段式

```go
for i := 0; i < 3; i++ {
    fmt.Println(i)
}
```

### 类 while 写法

```go
count := 3
for count > 0 {
    fmt.Println(count)
    count--
}
```

### 无限循环

```go
for {
    msg, err := readMessage()
    if err != nil {
        break
    }
    fmt.Println(msg)
}
```

---

## for range 遍历

### 遍历切片

```go
names := []string{"api", "worker", "cron"}
for i, name := range names {
    fmt.Printf("%d: %s\n", i, name)
}
```

如果不需要下标，可以用 `_` 忽略。

```go
for _, name := range names {
    fmt.Println(name)
}
```

### 遍历字符串

```go
for index, r := range "Go语言" {
    // index 是字节下标，r 是 rune
    fmt.Printf("byte=%d char=%c\n", index, r)
}
```

### 遍历 map

```go
scores := map[string]int{
    "alice": 95,
    "bob":   88,
}

for name, score := range scores {
    fmt.Println(name, score)
}
```

map 遍历顺序不稳定。如果需要稳定输出，先取出 key 排序。

```go
keys := make([]string, 0, len(scores))
for key := range scores {
    keys = append(keys, key)
}
slices.Sort(keys)

for _, key := range keys {
    fmt.Println(key, scores[key])
}
```

### 遍历 channel

```go
ch := make(chan int)

go func() {
    defer close(ch)
    for i := 1; i <= 3; i++ {
        ch <- i
    }
}()

for value := range ch {
    fmt.Println(value)
}
```

`range channel` 会一直接收，直到 channel 被关闭。

---

## 循环变量与闭包

Go 1.22 起，`for` 循环变量按每次迭代创建新变量，经典闭包坑已经被修复。

```go
for _, name := range []string{"a", "b", "c"} {
    go func() {
        fmt.Println(name)
    }()
}
```

如果项目仍使用 Go 1.21 或更早版本，闭包里捕获循环变量时需要显式复制。

```go
for _, name := range names {
    name := name // 兼容旧版本 Go
    go func() {
        fmt.Println(name)
    }()
}
```

---

## switch 语句

Go 的 `switch` 默认不会贯穿到下一个 `case`，通常不需要写 `break`。

```go
switch grade {
case "A":
    fmt.Println("优秀")
case "B", "C":
    fmt.Println("通过")
default:
    fmt.Println("未知等级")
}
```

### switch 带初始化语句

```go
switch day := time.Now().Weekday(); day {
case time.Saturday, time.Sunday:
    fmt.Println("周末")
default:
    fmt.Println("工作日")
}
```

### 无表达式 switch

无表达式 `switch` 常用于替代复杂的 `if-else`。

```go
switch {
case score >= 90:
    fmt.Println("A")
case score >= 80:
    fmt.Println("B")
default:
    fmt.Println("C")
}
```

### fallthrough

`fallthrough` 会强制执行下一个 `case`，但不会重新判断下一个条件。它容易降低可读性，应谨慎使用。

```go
switch n := 1; n {
case 1:
    fmt.Println("one")
    fallthrough
case 2:
    fmt.Println("two")
}
```

---

## select 多路复用

`select` 用于同时等待多个 channel 操作，常见于超时控制、取消信号和并发任务协调。

```go
select {
case msg := <-messages:
    fmt.Println("收到消息:", msg)
case <-time.After(time.Second):
    fmt.Println("等待超时")
}
```

带 `default` 的 `select` 不会阻塞。

```go
select {
case msg := <-messages:
    fmt.Println(msg)
default:
    fmt.Println("当前没有消息")
}
```

---

## break 和 continue

```go
for i := 0; i < 10; i++ {
    if i == 3 {
        continue // 跳过本次循环
    }
    if i == 8 {
        break // 退出循环
    }
    fmt.Println(i)
}
```

多层循环可以配合标签使用。

```go
outer:
for i := 0; i < 3; i++ {
    for j := 0; j < 3; j++ {
        if i*j > 2 {
            break outer
        }
    }
}
```

---

## goto

`goto` 可以跳转到同一函数内的标签，但不能跳过变量声明。业务代码中很少需要它，常见用途是跳到统一清理逻辑。

```go
func run() error {
    resource, err := openResource()
    if err != nil {
        return err
    }

    if err := doWork(resource); err != nil {
        goto cleanup
    }

cleanup:
    return resource.Close()
}
```

多数情况下，`defer` 比 `goto` 更清晰。

---

## 小结

1. `if`、`switch` 可以带短初始化语句，适合限制临时变量作用域。
2. `for` 覆盖传统循环、while 循环和无限循环。
3. `range` 字符串时得到的是字节下标和 rune。
4. map 遍历无序，需要稳定顺序时先排序 key。
5. `select` 是 channel 并发控制的重要工具。
6. Go 1.22 修复了循环变量闭包坑，但维护旧版本项目时仍要注意兼容。
