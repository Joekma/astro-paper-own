---
title: Go 并发编程：goroutine、channel、协程同步、并发安全
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-05-03T00:00:00.000+08:00
slug: go-concurrency
description: '深入讲解Go goroutine、channel通道、缓冲channel、select多路复用、协程同步（WaitGroup、Mutex、RWMutex、Cond、Once、Pool）、并发安全和死锁避免，包含完整代码示例。'
tags:
  - Go
  - 并发编程
  - goroutine
  - channel
  - 协程
  - 并发安全
  - 同步机制
  - sync
draft: false
language: zh-CN
---

## goroutine

goroutine 是 Go 语言的轻量级线程，由 Go 程序运行时调度和管理。

### 创建 goroutine

```go
go 函数名(参数列表)
```

### 示例

```go
func running() {
    var times int
    for {
        times++
        fmt.Println("tick", times)
        time.Sleep(time.Second)
    }
}

func main() {
    go running()
    var input string
    fmt.Scanln(&input)
}
```

### 匿名函数 goroutine

```go
go func() {
    for {
        fmt.Println("running...")
        time.Sleep(time.Second)
    }
}()
```

## 并发与并行

| 概念 | 说明 |
|------|------|
| **并发 (concurrency)** | 任务在不同时间点交替执行 |
| **并行 (parallelism)** | 任务同时执行 |

> Go 在 GOMAXPROCS 数量与任务数量相等时可并行执行。

## channel

channel 是 goroutine 之间通信的通道。

### 声明

```go
var ch chan int         // 双向 channel
var send chan<- int     // 只发送
var recv <-chan int     // 只接收
```

### 创建

```go
ch := make(chan int)           // 无缓冲
ch := make(chan int, 10)       // 有缓冲，容量 10
```

### 发送和接收

```go
ch <- value    // 发送
value := <-ch  // 接收
```

> 发送和接收操作会阻塞，直到另一端准备好。

### 示例

```go
func producer(ch chan<- int) {
    for i := 0; i < 5; i++ {
        ch <- i
    }
    close(ch)
}

func consumer(ch <-chan int) {
    for v := range ch {
        fmt.Println(v)
    }
}

func main() {
    ch := make(chan int)
    go producer(ch)
    consumer(ch)
}
```

## 通道方向

```go
func send(ch chan<- int) {
    ch <- 1
}

func receive(ch <-chan int) {
    v := <-ch
    fmt.Println(v)
}
```

## select 多路复用

```go
select {
case v := <-ch1:
    fmt.Println("ch1:", v)
case v := <-ch2:
    fmt.Println("ch2:", v)
default:
    fmt.Println("no data")
}
```

## 并发控制

### sync.WaitGroup

```go
var wg sync.WaitGroup

for i := 0; i < 5; i++ {
    wg.Add(1)
    go func(id int) {
        defer wg.Done()
        fmt.Println("goroutine", id)
    }(i)
}

wg.Wait()  // 等待所有 goroutine 完成
```

### sync.Mutex

```go
var (
    mu sync.Mutex
    counter int
)

func increment() {
    mu.Lock()
    defer mu.Unlock()
    counter++
}
```

### sync.RWMutex

```go
var (
    mu sync.RWMutex
    value int
)

func read() int {
    mu.RLock()
    defer mu.RUnlock()
    return value
}

func write(v int) {
    mu.Lock()
    defer mu.Unlock()
    value = v
}
```

## GOMAXPROCS

```go
import "runtime"

runtime.GOMAXPROCS(runtime.NumCPU())  // 使用所有 CPU 核心
```

> Go 1.5 之后默认使用多核。