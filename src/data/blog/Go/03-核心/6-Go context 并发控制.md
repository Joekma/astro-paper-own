---
title: Go context 并发控制
author: Joekma
pubDatetime: 2026-05-08T00:00:00.000+08:00
modDatetime: 2026-05-08T00:00:00.000+08:00
slug: go-context
description: '深入学习 Go context 包，掌握上下文传播、取消信号、超时控制、取消原因、请求作用域数据以及 HTTP/数据库/并发任务中的实践。'
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

## context 解决什么问题

`context.Context` 用于在调用链和 goroutine 之间传递：

- 取消信号
- 截止时间
- 超时控制
- 请求作用域数据

它不是全局变量，也不是配置容器。它的主要职责是让一组相关操作可以一起停止。

---

## Context 接口

```go
type Context interface {
    Deadline() (deadline time.Time, ok bool)
    Done() <-chan struct{}
    Err() error
    Value(key any) any
}
```

| 方法 | 说明 |
|------|------|
| `Deadline` | 返回截止时间，以及是否设置了截止时间 |
| `Done` | 返回取消信号通道，取消后会被关闭 |
| `Err` | 返回取消原因，常见为 `context.Canceled` 或 `context.DeadlineExceeded` |
| `Value` | 获取请求作用域数据 |

---

## 创建 Context

### Background 和 TODO

```go
ctx := context.Background()
```

`Background` 通常作为根 context，用在 `main`、初始化、测试等入口处。

```go
ctx := context.TODO()
```

`TODO` 表示暂时还不确定应该传入哪个 context，适合迁移阶段占位。

### WithCancel

```go
ctx, cancel := context.WithCancel(context.Background())
defer cancel()
```

调用 `cancel()` 会关闭 `ctx.Done()`。

### WithTimeout

```go
ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
defer cancel()
```

即使超时会自动取消，也应调用 `cancel`，以便及时释放内部资源。

### WithDeadline

```go
deadline := time.Now().Add(5 * time.Second)
ctx, cancel := context.WithDeadline(context.Background(), deadline)
defer cancel()
```

`WithTimeout` 本质上是相对时间，`WithDeadline` 是绝对时间。

### 取消原因

较新版本 Go 提供了带原因的取消函数，适合向上层传递更明确的失败原因。

```go
ctx, cancel := context.WithCancelCause(context.Background())
cancel(errors.New("用户主动停止任务"))

fmt.Println(context.Cause(ctx))
```

---

## 监听取消

```go
func doWork(ctx context.Context) error {
    ticker := time.NewTicker(500 * time.Millisecond)
    defer ticker.Stop()

    for {
        select {
        case <-ticker.C:
            fmt.Println("working...")
        case <-ctx.Done():
            // ctx.Err() 表示是主动取消还是超时
            return ctx.Err()
        }
    }
}
```

关键点：长时间运行的任务要定期检查 `ctx.Done()`，否则上游取消后任务仍会继续运行。

---

## HTTP 请求中的 context

HTTP 请求自带 context。当客户端断开连接、请求被取消或服务端超时时，请求 context 会被取消。

```go
func handleUser(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()

    user, err := loadUser(ctx, r.PathValue("id"))
    if err != nil {
        if errors.Is(err, context.Canceled) {
            return // 客户端取消时，通常不需要再写响应
        }
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }

    _ = json.NewEncoder(w).Encode(user)
}
```

下游函数把 context 作为第一个参数。

```go
func loadUser(ctx context.Context, id string) (*User, error) {
    req, err := http.NewRequestWithContext(ctx, http.MethodGet, "https://example.com/users/"+id, nil)
    if err != nil {
        return nil, err
    }

    resp, err := http.DefaultClient.Do(req)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()

    var user User
    if err := json.NewDecoder(resp.Body).Decode(&user); err != nil {
        return nil, err
    }
    return &user, nil
}
```

---

## 数据库查询

`database/sql` 提供了 `QueryContext`、`ExecContext`、`BeginTx` 等方法。

```go
func findUsers(ctx context.Context, db *sql.DB, minAge int) ([]User, error) {
    rows, err := db.QueryContext(ctx, `
        SELECT id, name, age
        FROM users
        WHERE age >= ?
    `, minAge)
    if err != nil {
        return nil, err
    }
    defer rows.Close()

    var users []User
    for rows.Next() {
        var user User
        if err := rows.Scan(&user.ID, &user.Name, &user.Age); err != nil {
            return nil, err
        }
        users = append(users, user)
    }

    // rows.Err 会返回遍历过程中发生的延迟错误
    if err := rows.Err(); err != nil {
        return nil, err
    }
    return users, nil
}
```

传入 context 后，查询可以随请求取消或超时而中断。

---

## context.Value

`Value` 适合传递请求作用域数据，例如 request id、trace id、认证主体。不要把它当作普通函数参数或配置系统。

推荐使用自定义 key 类型，避免不同包之间 key 冲突。

```go
type contextKey string

const requestIDKey contextKey = "requestID"

func withRequestID(ctx context.Context, requestID string) context.Context {
    return context.WithValue(ctx, requestIDKey, requestID)
}

func requestIDFrom(ctx context.Context) (string, bool) {
    value, ok := ctx.Value(requestIDKey).(string)
    return value, ok
}
```

中间件示例：

```go
func requestIDMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        requestID := r.Header.Get("X-Request-ID")
        if requestID == "" {
            requestID = uuid.NewString()
        }

        w.Header().Set("X-Request-ID", requestID)

        ctx := withRequestID(r.Context(), requestID)
        next.ServeHTTP(w, r.WithContext(ctx))
    })
}
```

---

## 并发任务取消

下面的例子启动多个请求，只要任一任务失败，就取消其他任务。

```go
func fetchAll(ctx context.Context, urls []string) ([]string, error) {
    ctx, cancel := context.WithCancel(ctx)
    defer cancel()

    type result struct {
        index int
        body  string
        err   error
    }

    results := make(chan result, len(urls))

    for i, url := range urls {
        i, url := i, url // 让代码在旧 Go 版本中也清晰安全

        go func() {
            body, err := fetchOne(ctx, url)
            results <- result{index: i, body: body, err: err}
        }()
    }

    bodies := make([]string, len(urls))
    for range urls {
        select {
        case item := <-results:
            if item.err != nil {
                cancel() // 通知其他 goroutine 停止
                return nil, item.err
            }
            bodies[item.index] = item.body
        case <-ctx.Done():
            return nil, ctx.Err()
        }
    }
    return bodies, nil
}

func fetchOne(ctx context.Context, url string) (string, error) {
    req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
    if err != nil {
        return "", err
    }

    resp, err := http.DefaultClient.Do(req)
    if err != nil {
        return "", err
    }
    defer resp.Body.Close()

    data, err := io.ReadAll(resp.Body)
    if err != nil {
        return "", err
    }
    return string(data), nil
}
```

复杂并发任务也可以使用 `golang.org/x/sync/errgroup`，它对“任一 goroutine 返回错误就取消整体任务”的场景更简洁。

---

## 最佳实践

| 做法 | 说明 |
|------|------|
| context 作为第一个参数 | `func Do(ctx context.Context, ...)` 是惯例 |
| 不传 nil context | 不确定时传 `context.TODO()` |
| 不把 context 存进结构体 | context 描述一次调用，不是对象状态 |
| 总是调用 cancel | 释放 `WithCancel/Timeout/Deadline` 创建的资源 |
| 定期监听 Done | 长任务必须能响应取消 |
| Value 只放请求作用域数据 | 不放配置、可选参数、业务大对象 |

---

## 小结

`context` 是 Go 服务端编程的基础设施。它把“请求结束、超时、主动取消”这些控制信号沿调用链向下传递，让 HTTP、数据库、RPC 和 goroutine 能协同停止，避免资源泄漏和无意义工作。
