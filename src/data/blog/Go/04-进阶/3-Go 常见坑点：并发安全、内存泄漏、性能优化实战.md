---
title: Go 常见坑点：并发安全、内存泄漏、性能优化实战
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-05-03T00:00:00.000+08:00
slug: go-common-pitfalls
description: '深入讲解 Go 常见坑点，包括 goroutine 泄漏、channel 死锁、map 并发、切片内存保留、defer、循环变量、time.After 和错误处理。'
tags:
  - Go
  - 常见错误
  - 性能优化
  - 并发安全
  - 最佳实践
  - 内存泄漏
draft: false
series: go
language: zh-CN
---

## goroutine 泄漏

goroutine 如果一直阻塞在 channel、网络 I/O、锁或循环中，就可能泄漏。

### 问题示例

```go
func worker(ch <-chan int) {
    for value := range ch {
        fmt.Println(value)
    }
}

func main() {
    ch := make(chan int)
    go worker(ch)

    ch <- 1
    // 忘记 close(ch)，worker 会一直等待下一条消息
}
```

### 修复方式

```go
func main() {
    ch := make(chan int)
    var wg sync.WaitGroup

    wg.Add(1)
    go func() {
        defer wg.Done()
        worker(ch)
    }()

    ch <- 1
    close(ch) // 发送方关闭 channel，通知接收方退出
    wg.Wait()
}
```

更复杂的服务中，优先使用 `context` 传播取消信号。

---

## channel 死锁

无缓冲 channel 发送和接收必须同时准备好。

```go
ch := make(chan int)
ch <- 1 // 没有接收方，死锁
```

修复：

```go
ch := make(chan int)
go func() {
    ch <- 1
}()
fmt.Println(<-ch)
```

不要把 channel 当作万能同步工具。只保护共享变量时，`sync.Mutex` 往往更直接。

---

## map 并发读写

普通 map 不是并发安全的。

```go
var m = map[string]int{}

go func() {
    for {
        m["key"]++
    }
}()

go func() {
    for {
        _ = m["key"]
    }
}()
```

并发读写可能 panic，也可能产生数据竞争。

修复：

```go
type SafeMap struct {
    mu sync.RWMutex
    m  map[string]int
}

func (s *SafeMap) Get(key string) int {
    s.mu.RLock()
    defer s.mu.RUnlock()
    return s.m[key]
}

func (s *SafeMap) Inc(key string) {
    s.mu.Lock()
    defer s.mu.Unlock()
    s.m[key]++
}
```

读多写少且 key 生命周期特殊的场景可以评估 `sync.Map`，普通业务缓存通常用 `map + mutex` 更清楚。

---

## append 后忘记接收返回值

```go
func addWrong(items []int) {
    append(items, 4) // 编译错误：append 返回值未使用
}
```

正确写法：

```go
func add(items []int, value int) []int {
    items = append(items, value)
    return items
}
```

`append` 可能分配新的底层数组，因此必须使用返回的新切片。

---

## 切片共享底层数组

```go
a := []int{1, 2, 3}
b := a[:2]
b[0] = 100
fmt.Println(a) // [100 2 3]
```

如果需要独立数据，复制一份。

```go
b := append([]int(nil), a[:2]...)
```

---

## 切片导致内存保留

```go
func head(data []byte) []byte {
    return data[:10] // 小切片仍引用整个大数组
}
```

修复：

```go
func headCopy(data []byte) []byte {
    part := data[:10]
    out := make([]byte, len(part))
    copy(out, part)
    return out
}
```

长期保存小切片时尤其要注意这个问题。

---

## defer 在循环中使用

```go
for _, path := range paths {
    f, err := os.Open(path)
    if err != nil {
        return err
    }
    defer f.Close() // 文件会等外层函数结束才关闭
}
```

如果文件很多，可能耗尽文件描述符。修复方式是提取小函数。

```go
for _, path := range paths {
    if err := processFile(path); err != nil {
        return err
    }
}

func processFile(path string) error {
    f, err := os.Open(path)
    if err != nil {
        return err
    }
    defer f.Close()

    return handle(f)
}
```

---

## 循环变量闭包

Go 1.22 起，循环变量闭包的经典坑已被语言修复。但如果维护 Go 1.21 或更早版本代码，仍要注意。

兼容写法：

```go
for _, item := range items {
    item := item
    go func() {
        fmt.Println(item)
    }()
}
```

这行 `item := item` 也能让读者明确知道 goroutine 捕获的是本次迭代的值。

---

## time.After 长循环

在高频循环里反复创建 `time.After` 可能造成额外分配。

```go
for {
    select {
    case <-time.After(time.Second):
        doWork()
    }
}
```

更适合用 `time.Ticker`：

```go
ticker := time.NewTicker(time.Second)
defer ticker.Stop()

for {
    select {
    case <-ticker.C:
        doWork()
    case <-ctx.Done():
        return ctx.Err()
    }
}
```

---

## 错误处理顺序

错误要先检查，再使用结果。

```go
result, err := do()
if err != nil {
    return err
}

fmt.Println(result)
```

如果用短声明把变量限制在 `if` 内部，外部就不能再使用它。

```go
if result, err := do(); err != nil {
    return err
} else {
    fmt.Println(result)
}
```

---

## 字符串拼接

少量拼接使用 `+` 没问题；循环大量拼接优先使用 `strings.Builder`。

```go
var builder strings.Builder
builder.Grow(len(items) * 8) // 可预估长度时提前扩容

for _, item := range items {
    builder.WriteString(item)
}

result := builder.String()
```

不要在不了解热点路径前过度优化，先用 benchmark 找到真正瓶颈。

---

## 小结

1. goroutine 要能退出，channel 要明确关闭方。
2. 普通 map 不能并发读写。
3. 切片共享底层数组，长期保存小切片时注意内存保留。
4. `defer` 在循环中可能延迟释放大量资源。
5. Go 1.22 修复了循环变量闭包坑，但旧版本代码仍需兼容写法。
6. 性能优化前先写 benchmark 和 race 检测。
