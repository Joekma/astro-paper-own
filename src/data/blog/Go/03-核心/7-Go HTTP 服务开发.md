---
title: Go HTTP 服务开发
author: Joekma
pubDatetime: 2026-05-08T00:00:00.000+08:00
modDatetime: 2026-05-08T00:00:00.000+08:00
slug: go-http-service
description: '深入学习 Go HTTP 服务开发，掌握 net/http、Go 1.22+ ServeMux 路由、请求解析、JSON 响应、中间件、超时、限流和优雅关闭。'
tags:
  - Go
  - HTTP
  - Web
  - 服务器
  - 路由
  - 中间件
draft: false
series: go
language: zh-CN
---

## 概述

Go 标准库 `net/http` 已经能完成大量 Web/API 服务开发工作。Go 1.22 起，`http.ServeMux` 支持更强的路由模式，包括 HTTP 方法和路径通配符，小型服务未必需要第三方路由器。

---

## 最小 HTTP 服务

```go
package main

import (
    "fmt"
    "log"
    "net/http"
)

func main() {
    mux := http.NewServeMux()

    mux.HandleFunc("GET /", func(w http.ResponseWriter, r *http.Request) {
        fmt.Fprintln(w, "Hello, Go HTTP")
    })

    log.Println("listening on :8080")
    if err := http.ListenAndServe(":8080", mux); err != nil {
        log.Fatal(err)
    }
}
```

推荐显式创建 `ServeMux`，避免依赖全局 `http.DefaultServeMux`。

---

## 使用 http.Server

生产服务应设置超时，避免慢客户端长时间占用连接。

```go
server := &http.Server{
    Addr:         ":8080",
    Handler:      mux,
    ReadTimeout:  5 * time.Second,
    WriteTimeout: 10 * time.Second,
    IdleTimeout:  60 * time.Second,
}

if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
    log.Fatal(err)
}
```

---

## ServeMux 路由

Go 1.22+ 支持方法和路径变量。

```go
mux := http.NewServeMux()

mux.HandleFunc("GET /users", listUsers)
mux.HandleFunc("POST /users", createUser)
mux.HandleFunc("GET /users/{id}", getUser)
mux.HandleFunc("GET /files/{path...}", getFile)
```

获取路径变量：

```go
func getUser(w http.ResponseWriter, r *http.Request) {
    id := r.PathValue("id")
    fmt.Fprintf(w, "user id=%s\n", id)
}
```

`{id}` 匹配单个路径段，`{path...}` 匹配剩余路径。

---

## 请求解析

### 查询参数

```go
func listUsers(w http.ResponseWriter, r *http.Request) {
    page := r.URL.Query().Get("page")
    if page == "" {
        page = "1"
    }
    fmt.Fprintln(w, "page:", page)
}
```

### JSON 请求体

```go
type CreateUserRequest struct {
    Name  string `json:"name"`
    Email string `json:"email"`
}

func createUser(w http.ResponseWriter, r *http.Request) {
    // 限制请求体大小，防止客户端发送过大的 JSON
    r.Body = http.MaxBytesReader(w, r.Body, 1<<20) // 1 MiB
    defer r.Body.Close()

    var req CreateUserRequest
    decoder := json.NewDecoder(r.Body)
    decoder.DisallowUnknownFields() // 遇到未知字段直接报错，避免静默忽略

    if err := decoder.Decode(&req); err != nil {
        writeError(w, http.StatusBadRequest, "invalid json")
        return
    }

    if req.Name == "" || req.Email == "" {
        writeError(w, http.StatusBadRequest, "name and email are required")
        return
    }

    writeJSON(w, http.StatusCreated, map[string]any{
        "id":    "generated-id",
        "name":  req.Name,
        "email": req.Email,
    })
}
```

---

## JSON 响应

```go
func writeJSON(w http.ResponseWriter, status int, value any) {
    w.Header().Set("Content-Type", "application/json; charset=utf-8")
    w.WriteHeader(status)

    if err := json.NewEncoder(w).Encode(value); err != nil {
        // 响应已开始写出，此时只能记录日志
        log.Printf("encode response: %v", err)
    }
}

func writeError(w http.ResponseWriter, status int, message string) {
    writeJSON(w, status, map[string]any{
        "error": message,
    })
}
```

响应头必须在 `WriteHeader` 或第一次 `Write` 之前设置。

---

## 中间件

Go 中间件通常是 `func(http.Handler) http.Handler`。

```go
type Middleware func(http.Handler) http.Handler

func chain(final http.Handler, middlewares ...Middleware) http.Handler {
    for i := len(middlewares) - 1; i >= 0; i-- {
        final = middlewares[i](final)
    }
    return final
}
```

### 请求日志

```go
type statusWriter struct {
    http.ResponseWriter
    status int
}

func (w *statusWriter) WriteHeader(status int) {
    w.status = status
    w.ResponseWriter.WriteHeader(status)
}

func logging(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        start := time.Now()
        sw := &statusWriter{ResponseWriter: w, status: http.StatusOK}

        next.ServeHTTP(sw, r)

        log.Printf("%s %s %d %s", r.Method, r.URL.Path, sw.status, time.Since(start))
    })
}
```

### 恢复 panic

```go
func recoverPanic(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        defer func() {
            if value := recover(); value != nil {
                log.Printf("panic: %v", value)
                writeError(w, http.StatusInternalServerError, "internal error")
            }
        }()

        next.ServeHTTP(w, r)
    })
}
```

### 认证示例

```go
type userIDKey struct{}

func auth(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        token := strings.TrimPrefix(r.Header.Get("Authorization"), "Bearer ")
        if token == "" {
            writeError(w, http.StatusUnauthorized, "missing token")
            return
        }

        userID, err := validateToken(token)
        if err != nil {
            writeError(w, http.StatusUnauthorized, "invalid token")
            return
        }

        // 把请求作用域数据放入 context，后续 handler 可读取
        ctx := context.WithValue(r.Context(), userIDKey{}, userID)
        next.ServeHTTP(w, r.WithContext(ctx))
    })
}
```

---

## 静态文件

```go
fs := http.FileServer(http.Dir("./static"))
mux.Handle("GET /static/", http.StripPrefix("/static/", fs))
```

公开静态目录前要确认目录中没有配置文件、源码、密钥等敏感内容。

---

## 限流

下面是按客户端 IP 限流的简化示例。

```go
type RateLimiter struct {
    mu       sync.Mutex
    visitors map[string]*rate.Limiter
}

func NewRateLimiter() *RateLimiter {
    return &RateLimiter{
        visitors: make(map[string]*rate.Limiter),
    }
}

func (rl *RateLimiter) limiterFor(ip string) *rate.Limiter {
    rl.mu.Lock()
    defer rl.mu.Unlock()

    limiter, ok := rl.visitors[ip]
    if !ok {
        limiter = rate.NewLimiter(10, 20) // 每秒 10 个事件，突发 20 个
        rl.visitors[ip] = limiter
    }
    return limiter
}

func (rl *RateLimiter) Middleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        host, _, err := net.SplitHostPort(r.RemoteAddr)
        if err != nil {
            writeError(w, http.StatusBadRequest, "bad remote address")
            return
        }

        if !rl.limiterFor(host).Allow() {
            writeError(w, http.StatusTooManyRequests, "too many requests")
            return
        }

        next.ServeHTTP(w, r)
    })
}
```

真实生产环境还要考虑代理头、清理长期不活跃 IP、分布式限流等问题。

---

## 优雅关闭

```go
func main() {
    mux := http.NewServeMux()
    mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, r *http.Request) {
        w.WriteHeader(http.StatusOK)
    })

    server := &http.Server{
        Addr:         ":8080",
        Handler:      chain(mux, recoverPanic, logging),
        ReadTimeout:  5 * time.Second,
        WriteTimeout: 10 * time.Second,
        IdleTimeout:  60 * time.Second,
    }

    go func() {
        if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
            log.Fatalf("listen: %v", err)
        }
    }()

    quit := make(chan os.Signal, 1)
    signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
    <-quit

    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()

    if err := server.Shutdown(ctx); err != nil {
        log.Printf("shutdown: %v", err)
    }
}
```

`Shutdown` 会停止接收新连接，并等待已有请求在 context 超时前完成。

---

## 第三方路由器

标准库足够应对许多服务。需要更丰富的路由组、中间件生态、参数绑定时，可以考虑：

| 路由器 | 特点 |
|--------|------|
| chi | 轻量、贴近标准库、适合 API 服务 |
| gin | 功能完整、生态丰富、上手快 |
| echo | Web/API 功能较完整 |

即使用第三方框架，也建议先理解 `net/http` 的 `Handler` 模型，因为大部分框架都构建在它之上。

---

## 最佳实践

1. 显式创建 `http.ServeMux` 或路由器，不依赖全局默认路由。
2. 给 `http.Server` 设置 `ReadTimeout`、`WriteTimeout`、`IdleTimeout`。
3. 解析 JSON 时限制请求体大小，并检查解码错误。
4. 统一 JSON 响应和错误格式。
5. 中间件统一使用 `func(http.Handler) http.Handler`，方便组合。
6. 使用请求 `context` 传递取消信号和请求作用域数据。
7. 生产服务实现优雅关闭。

---

## 小结

Go HTTP 服务的核心是 `Handler`。理解 `ServeMux`、请求解析、响应写入、中间件、context 和优雅关闭，就能用标准库写出清晰可靠的 API 服务。复杂业务再引入 chi、gin 等框架，会更知道自己在使用什么。
