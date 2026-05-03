---
title: Go语言常见坑点：并发安全、内存泄漏、性能优化实战
author: 程序员
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-05-03T00:00:00.000+08:00
slug: go-common-pitfalls
description: '深入讲解Go语言常见坑点和最佳实践，包括goroutine泄漏、channel死锁、切片扩容、map并发、defer执行时机、切片传参、time.After内存泄漏、单例模式、错误处理等避坑技巧。'
tags:
  - Go
  - 常见错误
  - 性能优化
  - 并发安全
  - 最佳实践
  - 内存泄漏
draft: false
language: zh-CN
---

## goroutine 生命期

goroutine 必须有明确的退出机制，否则会造成资源泄漏。

### 问题示例

```go
func consumer(ch chan int) {
    for {
        data := <-ch
        fmt.Println(data)
    }
}

func main() {
    ch := make(chan int)
    for {
        var dummy string
        fmt.Scan(&dummy)
        go consumer(ch)  // goroutine 无法退出
        fmt.Println("goroutines:", runtime.NumGoroutine())
    }
}
```

### 正确做法

```go
func consumer(ch chan int) {
    for {
        data := <-ch
        if data == 0 {  // 退出条件
            break
        }
        fmt.Println(data)
    }
    fmt.Println("goroutine exit")
}

func main() {
    ch := make(chan int)
    for {
        var dummy string
        fmt.Scan(&dummy)
        if dummy == "quit" {
            for i := 0; i < runtime.NumGoroutine()-1; i++ {
                ch <- 0
            }
            continue
        }
        go consumer(ch)
    }
}
```

## 通道使用

通道不一定比锁高效，通道内部也需要加锁。

### 使用 WaitGroup 替代通道

```go
func socketRecv(conn net.Conn, wg *sync.WaitGroup) {
    buff := make([]byte, 1024)
    for {
        _, err := conn.Read(buff)
        if err != nil {
            break
        }
    }
    wg.Done()
}

func main() {
    conn, _ := net.Dial("tcp", "www.163.com:80")
    exit := make(chan string)

    var wg sync.WaitGroup
    wg.Add(1)
    go socketRecv(conn, &wg)

    time.Sleep(time.Second)
    conn.Close()

    wg.Wait()
}
```

## 切片操作

### 切片扩容

```go
// 错误：修改原切片
func appendWrong() []int {
    s := []int{1, 2, 3}
    s = append(s, 4)
    return s
}

// 正确：返回值是新切片
func appendRight() []int {
    s := []int{1, 2, 3}
    s = append(s, 4)
    return s
}
```

### 切片引用

```go
a := []int{1, 2, 3}
b := a        // b 和 a 指向同一底层数组
b[0] = 100
fmt.Println(a[0])  // 100，a 也被修改

c := make([]int, len(a))
copy(c, a)  // 复制到新切片
```

## map 操作

### 并发读写

```go
var m = make(map[string]int)

// 并发读写会 panic
go func() {
    for {
        m["key"] = 1
    }
}()
go func() {
    for {
        _ = m["key"]
    }
}()
```

### 解决方案

```go
var (
    mu sync.RWMutex
    m  = make(map[string]int)
)

mu.Lock()
m["key"] = 1
mu.Unlock()

mu.RLock()
_ = m["key"]
mu.RUnlock()

// 或使用 sync.Map
var safeMap sync.Map
safeMap.Store("key", 1)
value, _ := safeMap.Load("key")
```

## 字符串拼接

### 性能对比

| 方法 | 适用场景 |
|------|----------|
| `+` | 少量拼接 |
| `strings.Builder` | 大量拼接 |
| `bytes.Buffer` | 字节拼接 |
| `fmt.Sprintf` | 格式化拼接 |

### strings.Builder

```go
var sb strings.Builder
for i := 0; i < 1000; i++ {
    sb.WriteString("hello")
}
result := sb.String()
```

## defer 执行时机

```go
func foo() {
    for i := 0; i < 3; i++ {
        defer fmt.Println(i)  // 0, 1, 2
    }
}
// 输出: 2, 1, 0
```

### 闭包中的 defer

```go
func foo() {
    for i := 0; i < 3; i++ {
        defer func() {
            fmt.Println(i)  // 输出: 3, 3, 3
        }()
    }
}
```

### 正确做法

```go
func foo() {
    for i := 0; i < 3; i++ {
        v := i  // 闭包前捕获值
        defer func() {
            fmt.Println(v)  // 输出: 0, 1, 2
        }()
    }
}
```

## 错误处理

### 错误检查顺序

```go
// 错误：可能 panic
if err != nil {
    panic(err)
}

// 正确：检查后再使用
if result, err := do(); err != nil {
    return err
}
// 使用 result
```

### 自定义错误

```go
type MyError struct {
    Msg string
}

func (e *MyError) Error() string {
    return e.Msg
}

return &MyError{"something went wrong"}
```