---
title: Go 并发编程：goroutine、channel、协程同步、并发安全
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-05-03T00:00:00.000+08:00
slug: go-concurrency
description: '深入讲解 Go goroutine、channel、select、WaitGroup、Mutex、RWMutex、Once、Pool、context 取消和并发安全实践。'
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
series: go
language: zh-CN
---

## goroutine

goroutine 是由 Go 运行时调度的轻量级执行单元。

```go
go func() {
    fmt.Println("run in another goroutine")
}()
```

启动 goroutine 很便宜，但不是免费。每个 goroutine 都应该有明确的退出条件。

---

## 等待 goroutine 完成

`sync.WaitGroup` 用来等待一组 goroutine 结束。

```go
var wg sync.WaitGroup

for i := 0; i < 3; i++ {
    i := i // 兼容旧 Go 版本，也让捕获关系更明显

    wg.Add(1)
    go func() {
        defer wg.Done()
        fmt.Println("worker", i)
    }()
}

wg.Wait()
```

`Add` 应在启动 goroutine 前调用，避免 goroutine 太快执行导致计数混乱。

---

## channel

channel 用于 goroutine 之间通信。

```go
ch := make(chan int)     // 无缓冲 channel
buf := make(chan int, 3) // 有缓冲 channel
```

无缓冲 channel 发送和接收必须同时准备好；有缓冲 channel 在缓冲未满时发送不阻塞，在缓冲非空时接收不阻塞。

```go
func producer(ch chan<- int) {
    defer close(ch)
    for i := 0; i < 5; i++ {
        ch <- i
    }
}

func consumer(ch <-chan int) {
    for value := range ch {
        fmt.Println(value)
    }
}
```

约定：通常由发送方关闭 channel，接收方不应关闭自己没有所有权的 channel。

---

## select

`select` 同时等待多个 channel 操作。

```go
select {
case value := <-data:
    fmt.Println("data:", value)
case <-time.After(time.Second):
    fmt.Println("timeout")
}
```

配合 context 实现取消：

```go
func worker(ctx context.Context, jobs <-chan Job) error {
    for {
        select {
        case job, ok := <-jobs:
            if !ok {
                return nil
            }
            if err := handle(job); err != nil {
                return err
            }
        case <-ctx.Done():
            return ctx.Err()
        }
    }
}
```

---

## worker pool 示例

```go
func runWorkers(ctx context.Context, jobs []Job, workerCount int) error {
    jobCh := make(chan Job)
    errCh := make(chan error, workerCount)

    var wg sync.WaitGroup
    for i := 0; i < workerCount; i++ {
        wg.Add(1)
        go func(id int) {
            defer wg.Done()
            if err := worker(ctx, jobCh); err != nil {
                errCh <- fmt.Errorf("worker %d: %w", id, err)
            }
        }(i)
    }

    go func() {
        defer close(jobCh)
        for _, job := range jobs {
            select {
            case jobCh <- job:
            case <-ctx.Done():
                return
            }
        }
    }()

    wg.Wait()
    close(errCh)

    for err := range errCh {
        if err != nil {
            return err
        }
    }
    return ctx.Err()
}
```

这个例子包含几个关键点：任务 channel 由发送方关闭、worker 能响应 context 取消、主流程等待所有 worker 结束。

---

## 互斥锁 Mutex

多个 goroutine 访问共享变量时，需要同步。

```go
type Counter struct {
    mu    sync.Mutex
    value int
}

func (c *Counter) Inc() {
    c.mu.Lock()
    defer c.mu.Unlock()
    c.value++
}

func (c *Counter) Value() int {
    c.mu.Lock()
    defer c.mu.Unlock()
    return c.value
}
```

不要复制已经使用过的锁。包含锁的结构体通常用指针传递。

---

## 读写锁 RWMutex

读多写少时可以使用 `sync.RWMutex`。

```go
type Cache struct {
    mu   sync.RWMutex
    data map[string]string
}

func (c *Cache) Get(key string) (string, bool) {
    c.mu.RLock()
    defer c.mu.RUnlock()
    value, ok := c.data[key]
    return value, ok
}

func (c *Cache) Set(key, value string) {
    c.mu.Lock()
    defer c.mu.Unlock()
    c.data[key] = value
}
```

如果写操作频繁，`RWMutex` 不一定比 `Mutex` 更快，应以 benchmark 为准。

---

## sync.Once

`sync.Once` 保证某段初始化逻辑只执行一次。

```go
var (
    once sync.Once
    cfg  *Config
)

func ConfigInstance() *Config {
    once.Do(func() {
        cfg = loadConfig()
    })
    return cfg
}
```

适合懒加载配置、连接池等一次性初始化。

---

## sync.Pool

`sync.Pool` 用于复用临时对象，减少 GC 压力。

```go
var bufferPool = sync.Pool{
    New: func() any {
        return new(bytes.Buffer)
    },
}

func encode(value any) ([]byte, error) {
    buf := bufferPool.Get().(*bytes.Buffer)
    buf.Reset()
    defer bufferPool.Put(buf)

    if err := json.NewEncoder(buf).Encode(value); err != nil {
        return nil, err
    }

    // 返回前复制一份，避免调用方引用被放回池中的 buffer
    out := append([]byte(nil), buf.Bytes()...)
    return out, nil
}
```

`sync.Pool` 的对象可能随时被 GC 清理，不能用它保存必须存在的状态。

---

## 并发与并行

并发是“同时处理多个任务的结构”，并行是“多个任务真的在同一时刻运行”。

Go 默认会使用多个 CPU 核心执行 goroutine。`runtime.GOMAXPROCS` 通常不需要手动设置，除非做性能实验或特殊运行环境控制。

---

## race detector

并发代码建议经常使用竞态检测。

```bash
go test -race ./...
go run -race .
```

竞态检测会增加运行开销，不适合生产常驻开启，但非常适合测试和排查问题。

---

## 小结

1. goroutine 必须有退出条件。
2. channel 用来通信，锁用来保护共享内存，两者按场景选择。
3. `WaitGroup` 等待任务完成，`context` 传播取消信号。
4. map、计数器、缓存等共享状态需要锁或其他同步机制。
5. 并发正确性优先于性能，优化前先用测试和 race detector 验证。
