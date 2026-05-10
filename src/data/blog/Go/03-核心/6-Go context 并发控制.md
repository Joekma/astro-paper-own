---
title: Go context 并发控制
author: Joekma
pubDatetime: 2026-05-08T00:00:00.000+08:00
modDatetime: 2026-05-08T00:00:00.000+08:00
slug: go-context
description: '深入学习 Go context 包，掌握上下文传播、取消信号、超时控制、请求作用域等核心概念。'
tags:
  - Go
  - context
  - 并发
  - 取消
  - 超时
draft: false
series: go
language: zh-CN
---

## 概述

context 是 Go 中非常重要的并发控制工具，它用于在协程之间传递截止时间、取消信号和请求作用域数据。掌握 context 是编写健壮 Go 程序的关键技能。

### 核心概念

| 概念 | 说明 |
|------|------|
| **Context** | 接口，用于传递上下文信息 |
| **取消信号** | 通知协程停止工作 |
| **截止时间** | 设置操作的最大时长 |
| **超时控制** | 限制操作的等待时间 |
| **请求数据** | 在请求链中传递数据 |

---

## Context 接口

### 内置接口

```go
type Context interface {
    Deadline() (deadline time.Time, ok bool)
    Done() <-chan struct{}
    Err() error
    Value(key any) any
}
```

### 四个方法

| 方法 | 说明 |
|------|------|
| `Deadline()` | 返回截止时间和是否存在 |
| `Done()` | 返回关闭的通道 |
| `Err()` | 返回错误（取消或超时） |
| `Value()` | 根据 key 获取值 |

---

## 创建 Context

### background 和 TODO

```go
import "context"

// 最基础的 Context，不能被取消
ctx := context.Background()

// 用于暂时没有合适 context 的情况
ctx := context.TODO()
```

### 带截止时间

```go
import "context"
import "time"

// 设置绝对截止时间
deadline := time.Now().Add(5 * time.Second)
ctx, cancel := context.WithDeadline(parentCtx, deadline)
defer cancel()
```

### 带超时时间

```go
import "context"

// 1秒后自动取消
ctx, cancel := context.WithTimeout(parentCtx, time.Second)
defer cancel()

// 使用 Background 作为父 context
ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
defer cancel()
```

### 可取消 Context

```go
ctx, cancel := context.WithCancel(context.Background())

// 手动取消
cancel()

// 在协程中监听取消
select {
case <-ctx.Done():
    fmt.Println("上下文已取消")
    return
default:
    // 继续工作
}
```

---

## 取消信号

### 基本取消

```go
func main() {
    ctx, cancel := context.WithCancel(context.Background())
    
    go func() {
        time.Sleep(2 * time.Second)
        cancel()  // 发送取消信号
    }()
    
    doWork(ctx)
}

func doWork(ctx context.Context) {
    for i := 0; ; i++ {
        select {
        case <-ctx.Done():
            fmt.Println("工作被取消:", ctx.Err())
            return
        default:
            fmt.Printf("工作中... %d\n", i)
            time.Sleep(500 * time.Millisecond)
        }
    }
}
```

### 多协程取消

```go
func main() {
    ctx, cancel := context.WithCancel(context.Background())
    
    // 启动多个工作协程
    for i := 0; i < 3; i++ {
        workerID := i
        go worker(ctx, workerID)
    }
    
    time.Sleep(3 * time.Second)
    fmt.Println("主函数取消所有工作")
    cancel()
    
    time.Sleep(time.Second)
}

func worker(ctx context.Context, id int) {
    for {
        select {
        case <-ctx.Done():
            fmt.Printf("Worker %d 收到取消信号: %v\n", id, ctx.Err())
            return
        default:
            fmt.Printf("Worker %d 工作中...\n", id)
            time.Sleep(time.Second)
        }
    }
}
```

---

## 超时控制

### WithTimeout

```go
func fetchData(url string) ([]byte, error) {
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()
    
    req, _ := http.NewRequestWithContext(ctx, "GET", url, nil)
    
    client := &http.Client{}
    resp, err := client.Do(req)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()
    
    return io.ReadAll(resp.Body)
}
```

### WithDeadline

```go
func longRunningTask() error {
    deadline := time.Now().Add(10 * time.Second)
    ctx, cancel := context.WithDeadline(context.Background(), deadline)
    defer cancel()
    
    return executeTask(ctx)
}

func executeTask(ctx context.Context) error {
    for {
        select {
        case <-time.After(time.Second):
            fmt.Println("任务执行中...")
            
            // 检查截止时间
            if _, ok := ctx.Deadline(); !ok {
                fmt.Println("没有截止时间限制")
            } else {
                fmt.Println("还有", time.Until(deadline), "结束")
            }
            
        case <-ctx.Done():
            return ctx.Err()
        }
    }
}
```

---

## 在协程间传递

### 传递 Context

```go
func processRequest(w http.ResponseWriter, r *http.Request) {
    // 从请求中获取 Context
    ctx := r.Context()
    
    // 处理长时间操作
    result, err := doLongOperation(ctx)
    if err != nil {
        http.Error(w, err.Error(), 500)
        return
    }
    
    json.NewEncoder(w).Encode(result)
}

func doLongOperation(ctx context.Context) (string, error) {
    for i := 0; i < 5; i++ {
        select {
        case <-time.After(time.Second):
            fmt.Println("操作中...")
        case <-ctx.Done():
            return "", ctx.Err()
        }
    }
    return "完成", nil
}
```

### HTTP 中间件

```go
func loggingMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        ctx := r.Context()
        
        // 添加开始时间
        start := time.Now()
        
        // 添加日志记录
        log.Printf("请求开始: %s %s", r.Method, r.URL.Path)
        
        // 执行下一个 handler
        next.ServeHTTP(w, r)
        
        // 请求结束
        log.Printf("请求结束，耗时: %v", time.Since(start))
        
        // 检查是否被取消
        if ctx.Err() == context.Canceled {
            log.Printf("请求被客户端取消")
        }
    })
}
```

---

## 使用 Value 传递数据

### 设置和获取值

```go
import "context"

type contextKey string

const userIDKey contextKey = "userID"
const requestIDKey contextKey = "requestID"

func main() {
    ctx := context.Background()
    
    // 添加数据
    ctx = context.WithValue(ctx, userIDKey, "user123")
    ctx = context.WithValue(ctx, requestIDKey, "req-456")
    
    // 在函数中使用
    processRequest(ctx)
}

func processRequest(ctx context.Context) {
    userID, ok := ctx.Value(userIDKey).(string)
    if !ok {
        fmt.Println("未找到 userID")
        return
    }
    
    requestID := ctx.Value(requestIDKey)
    fmt.Printf("处理用户 %s 的请求 %v\n", userID, requestID)
}
```

### 请求追踪

```go
func handler(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    
    // 从 header 或生成 request ID
    requestID := r.Header.Get("X-Request-ID")
    if requestID == "" {
        requestID = generateID()
    }
    
    // 放入 context
    ctx = context.WithValue(ctx, requestIDKey, requestID)
    
    // 添加到 response header
    w.Header().Set("X-Request-ID", requestID)
    
    // 传递处理
    process(ctx)
}

func process(ctx context.Context) {
    requestID := ctx.Value(requestIDKey)
    log.Printf("处理请求: %v", requestID)
}
```

---

## 错误处理

### 检查取消错误

```go
func doWork(ctx context.Context) error {
    for {
        select {
        case <-time.After(time.Second):
            fmt.Println("工作中")
        case <-ctx.Done():
            // 处理不同的错误类型
            switch ctx.Err() {
            case context.Canceled:
                fmt.Println("任务被手动取消")
            case context.DeadlineExceeded:
                fmt.Println("任务超时")
            default:
                fmt.Println("未知错误:", ctx.Err())
            }
            return ctx.Err()
        }
    }
}
```

### 传播取消

```go
func parentFunction(ctx context.Context) error {
    ctx, cancel := context.WithCancel(ctx)
    defer cancel()
    
    // 启动子任务
    err := childFunction(ctx)
    if err != nil {
        // 取消所有子任务
        cancel()
        return err
    }
    
    return nil
}
```

---

## 最佳实践

### 应该做的事情

| 实践 | 说明 |
|------|------|
| **传递 Context** | 作为第一个参数传递给需要它的函数 |
| **检查 Done** | 定期检查 ctx.Done() 响应取消 |
| **总是调用 cancel** | 释放 WithCancel/WithTimeout 创建的资源 |
| **使用 defer** | 确保 cancel 一定被调用 |
| **不存储 Context** | 不要在结构体中存储 context |

### 不应该做的事情

| 反模式 | 说明 |
|--------|------|
| **存 nil Context** | 不要传递 nil Context |
| **过度使用** | 不要把 context 用于非控制流目的 |
| **存储在结构体** | context 应该作为参数传递 |
| **用于传递可选参数** | 使用选项模式代替 |

### 正确示例

```go
// ✅ 正确：在函数签名中传递 Context
func fetchUser(ctx context.Context, id string) (*User, error) {
    req, _ := http.NewRequestWithContext(ctx, "GET", "/users/"+id, nil)
    return doRequest(req)
}

// ✅ 正确：使用 defer 确保 cancel
func process(ctx context.Context) error {
    ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
    defer cancel()
    
    return doWork(ctx)
}

// ✅ 正确：定期检查取消
func longOperation(ctx context.Context) error {
    for i := 0; i < 100; i++ {
        if err := doStep(i); err != nil {
            return err
        }
        
        // 定期检查是否被取消
        select {
        case <-ctx.Done():
            return ctx.Err()
        default:
        }
    }
    return nil
}
```

---

## 常见场景

### HTTP 服务器

```go
func handleRequest(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    
    // 添加超时
    ctx, cancel := context.WithTimeout(ctx, 10*time.Second)
    defer cancel()
    
    // 处理请求
    select {
    case <-time.After(5 * time.Second):
        io.WriteString(w, "完成")
    case <-ctx.Done():
        http.Error(w, "超时", 408)
    }
}
```

### 数据库查询

```go
func queryDB(ctx context.Context, query string) ([]Row, error) {
    rows, err := db.QueryContext(ctx, query)
    if err != nil {
        return nil, err
    }
    defer rows.Close()
    
    var results []Row
    for rows.Next() {
        var row Row
        if err := rows.Scan(&row...); err != nil {
            return nil, err
        }
        results = append(results, row)
    }
    
    return results, rows.Err()
}
```

### 并发任务

```go
func parallelFetch(ctx context.Context, urls []string) ([]string, error) {
    results := make(chan string, len(urls))
    errors := make(chan error, len(urls))
    
    for _, url := range urls {
        go func(u string) {
            select {
            case results <- fetch(u):
            case <-ctx.Done():
                errors <- ctx.Err()
            }
        }(url)
    }
    
    var outputs []string
    for i := 0; i < len(urls); i++ {
        select {
        case r := <-results:
            outputs = append(outputs, r)
        case err := <-errors:
            return nil, err
        }
    }
    
    return outputs, nil
}
```

---

## 总结

context 是 Go 并发编程的核心工具：

1. **接口** - Deadline、Done、Err、Value 四个方法
2. **创建** - Background、TODO、WithCancel/Timeout/Deadline
3. **取消传播** - 在协程树中传播取消信号
4. **超时控制** - 防止操作无限等待
5. **数据传递** - 在请求链中传递值

掌握 context 能让你编写出可控、可预测的并发程序。