---
title: Go HTTP 服务开发
author: Joekma
pubDatetime: 2026-05-08T00:00:00.000+08:00
modDatetime: 2026-05-08T00:00:00.000+08:00
slug: go-http-service
description: '深入学习 Go HTTP 服务开发，掌握 net/http、路由处理、中间件、请求解析、响应构建等核心技能。'
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

Go 的 net/http 包提供了完整的 HTTP 服务器和客户端实现。本文章将详细介绍如何使用 Go 构建高性能 HTTP 服务，包括路由处理、中间件、请求解析、错误处理等核心技能。

### 核心组件

| 组件 | 说明 |
|------|------|
| **http.Server** | HTTP 服务器配置和启动 |
| **http.Handler** | 请求处理接口 |
| **http.HandlerFunc** | 函数类型的处理器 |
| **ServeMux** | 路由器/多路复用器 |
| **Middleware** | 中间件链式处理 |

---

## 快速入门

### 最简单的服务器

```go
package main

import (
    "fmt"
    "net/http"
)

func main() {
    http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
        fmt.Fprintf(w, "Hello, World!")
    })
    
    fmt.Println("服务器启动在 :8080")
    http.ListenAndServe(":8080", nil)
}
```

### 使用 Server 结构

```go
package main

import (
    "context"
    "fmt"
    "log"
    "net/http"
    "time"
)

func main() {
    handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        fmt.Fprintf(w, "Hello, HTTP!")
    })
    
    server := &http.Server{
        Addr:         ":8080",
        Handler:      handler,
        ReadTimeout:  10 * time.Second,
        WriteTimeout: 10 * time.Second,
        IdleTimeout:  60 * time.Second,
    }
    
    log.Println("服务器启动在 :8080")
    if err := server.ListenAndServe(); err != nil {
        log.Fatal(err)
    }
}
```

---

## ServeMux 路由

### 默认路由器

```go
func main() {
    mux := http.NewServeMux()
    
    mux.HandleFunc("/", homeHandler)
    mux.HandleFunc("/about", aboutHandler)
    mux.HandleFunc("/contact", contactHandler)
    
    http.ListenAndServe(":8080", mux)
}

func homeHandler(w http.ResponseWriter, r *http.Request) {
    fmt.Fprintf(w, "首页")
}

func aboutHandler(w http.ResponseWriter, r *http.Request) {
    fmt.Fprintf(w, "关于我们")
}

func contactHandler(w http.ResponseWriter, r *http.Request) {
    fmt.Fprintf(w, "联系我们")
}
```

### 路径模式匹配

```go
mux := http.NewServeMux()

// 精确匹配
mux.HandleFunc("/", homeHandler)

// 前缀匹配（/static/ 下的所有路径）
mux.Handle("/static/", http.StripPrefix("/static/", http.FileServer(http.Dir("./static"))))

// 路径参数（需要第三方路由器）
mux.HandleFunc("/users/", usersHandler)
```

### 处理静态文件

```go
func main() {
    mux := http.NewServeMux()
    
    // 处理静态文件目录
    fs := http.FileServer(http.Dir("static"))
    mux.Handle("/static/", http.StripPrefix("/static/", fs))
    
    // 或使用 Dir 配置
    mux.Handle("/assets/", http.FileServer(http.Dir("./public/assets")))
    
    http.ListenAndServe(":8080", mux)
}
```

---

## Handler 接口

### 实现 Handler 接口

```go
type LoggingHandler struct {
    next http.Handler
}

func (h *LoggingHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
    log.Printf("请求: %s %s", r.Method, r.URL.Path)
    h.next.ServeHTTP(w, r)
}

func main() {
    handler := &LoggingHandler{next: http.DefaultServeMux}
    http.ListenAndServe(":8080", handler)
}
```

### HandlerFunc 函数类型

```go
func logging(next http.HandlerFunc) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        log.Printf("%s %s", r.Method, r.URL.Path)
        next.ServeHTTP(w, r)
    }
}

func main() {
    mux := http.NewServeMux()
    
    mux.HandleFunc("/api/users", logging(getUsers))
    mux.HandleFunc("/api/posts", logging(getPosts))
    
    http.ListenAndServe(":8080", mux)
}

func getUsers(w http.ResponseWriter, r *http.Request) {
    json.NewEncoder(w).Encode([]string{"Alice", "Bob"})
}

func getPosts(w http.ResponseWriter, r *http.Request) {
    json.NewEncoder(w).Encode([]string{"Post 1", "Post 2"})
}
```

---

## 请求处理

### 获取请求参数

```go
func handleForm(w http.ResponseWriter, r *http.Request) {
    // 设置表单解析限制
    r.ParseForm()
    
    // 获取查询参数
    name := r.URL.Query().Get("name")
    age := r.URL.Query().Get("age")
    
    // 获取表单参数
    username := r.FormValue("username")
    password := r.FormValue("password")
    
    fmt.Fprintf(w, "Name: %s, Age: %s, User: %s", name, age, username)
}
```

### 解析 JSON 请求

```go
type UserRequest struct {
    Name  string `json:"name"`
    Email string `json:"email"`
    Age   int    `json:"age"`
}

func createUser(w http.ResponseWriter, r *http.Request) {
    if r.Method != http.MethodPost {
        http.Error(w, "方法不允许", http.StatusMethodNotAllowed)
        return
    }
    
    // 设置解析限制
    r.Body = http.MaxBytesReader(w, r.Body, 1<<20) // 1MB
    
    var req UserRequest
    decoder := json.NewDecoder(r.Body)
    decoder.DisallowUnknownFields()
    
    if err := decoder.Decode(&req); err != nil {
        http.Error(w, "无效的 JSON: "+err.Error(), http.StatusBadRequest)
        return
    }
    
    // 验证
    if req.Name == "" {
        http.Error(w, "姓名不能为空", http.StatusBadRequest)
        return
    }
    
    json.NewEncoder(w).Encode(map[string]interface{}{
        "message": "用户创建成功",
        "user":    req,
    })
}
```

### 路径参数

```go
// 简单路径参数（使用字符串处理）
func userHandler(w http.ResponseWriter, r *http.Request) {
    path := r.URL.Path
    // /users/123 -> 获取 123
    
    parts := strings.Split(path, "/")
    if len(parts) >= 3 {
        userID := parts[2]
        fmt.Fprintf(w, "用户 ID: %s", userID)
    }
}

// 使用 chi 路由器（推荐）
import "github.com/go-chi/chi/v5"

func main() {
    r := chi.NewRouter()
    
    r.Get("/users/{id}", func(w http.ResponseWriter, r *http.Request) {
        id := chi.URLParam(r, "id")
        fmt.Fprintf(w, "用户 ID: %s", id)
    })
    
    http.ListenAndServe(":8080", r)
}
```

---

## 响应处理

### JSON 响应

```go
import "encoding/json"

type Response struct {
    Success bool        `json:"success"`
    Data    interface{} `json:"data,omitempty"`
    Error   string      `json:"error,omitempty"`
}

func successResponse(w http.ResponseWriter, data interface{}) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusOK)
    json.NewEncoder(w).Encode(Response{
        Success: true,
        Data:    data,
    })
}

func errorResponse(w http.ResponseWriter, message string, status int) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(status)
    json.NewEncoder(w).Encode(Response{
        Success: false,
        Error:   message,
    })
}
```

### 设置响应头

```go
func setHeaders(next http.HandlerFunc) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Content-Type", "application/json")
        w.Header().Set("X-Custom-Header", "value")
        w.Header().Set("Access-Control-Allow-Origin", "*")
        next.ServeHTTP(w, r)
    }
}
```

### 重定向

```go
func redirectHandler(w http.ResponseWriter, r *http.Request) {
    http.Redirect(w, r, "/new-page", http.StatusMovedPermanently)
}

func temporaryRedirect(w http.ResponseWriter, r *http.Request) {
    http.Redirect(w, r, "/temporary", http.StatusFound)
}
```

---

## 中间件

### 日志中间件

```go
func loggingMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        start := time.Now()
        
        // 包装 ResponseWriter 记录状态码
        wrapped := &statusWriter{ResponseWriter: w, statusCode: 200}
        
        next.ServeHTTP(wrapped, r)
        
        duration := time.Since(start)
        log.Printf("%s %s %d %v", r.Method, r.URL.Path, wrapped.statusCode, duration)
    })
}

type statusWriter struct {
    http.ResponseWriter
    statusCode int
}

func (w *statusWriter) WriteHeader(code int) {
    w.statusCode = code
    w.ResponseWriter.WriteHeader(code)
}
```

### 认证中间件

```go
func authMiddleware(next http.HandlerFunc) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        token := r.Header.Get("Authorization")
        
        if token == "" {
            http.Error(w, "未授权", http.StatusUnauthorized)
            return
        }
        
        // 验证 token
        userID, err := validateToken(token)
        if err != nil {
            http.Error(w, "无效的 token", http.StatusUnauthorized)
            return
        }
        
        // 将用户 ID 存入 context
        ctx := context.WithValue(r.Context(), "userID", userID)
        next.ServeHTTP(w, r.WithContext(ctx))
    }
}

func validateToken(token string) (string, error) {
    // 实现 token 验证逻辑
    if token == "valid-token" {
        return "user123", nil
    }
    return "", errors.New("invalid token")
}
```

### 中间件链

```go
type Middleware func(http.Handler) http.Handler

func chain(middlewares ...Middleware) Middleware {
    return func(final http.Handler) http.Handler {
        for i := len(middlewares) - 1; i >= 0; i-- {
            final = middlewares[i](final)
        }
        return final
    }
}

func main() {
    finalHandler := http.HandlerFunc(apiHandler)
    
    handler := chain(
        loggingMiddleware,
        authMiddleware,
        corsMiddleware,
    )(finalHandler)
    
    http.ListenAndServe(":8080", handler)
}
```

---

## 优雅关闭

### 使用 context

```go
func main() {
    ctx, cancel := context.WithCancel(context.Background())
    defer cancel()
    
    server := &http.Server{
        Addr:    ":8080",
        Handler: setupRouter(),
    }
    
    // 启动服务器
    go func() {
        if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
            log.Fatalf("服务器错误: %v", err)
        }
    }()
    
    // 等待信号
    quit := make(chan os.Signal, 1)
    signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
    <-quit
    
    log.Println("关闭服务器...")
    
    // 优雅关闭，给 5 秒超时
    shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer shutdownCancel()
    
    if err := server.Shutdown(shutdownCtx); err != nil {
        log.Fatalf("服务器关闭失败: %v", err)
    }
    
    log.Println("服务器已关闭")
}

func setupRouter() *http.ServeMux {
    mux := http.NewServeMux()
    mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
        fmt.Fprintf(w, "Hello!")
    })
    return mux
}
```

---

## 常见问题

### CORS 跨域

```go
func corsMiddleware(next http.HandlerFunc) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Access-Control-Allow-Origin", "*")
        w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
        
        if r.Method == "OPTIONS" {
            w.WriteHeader(http.StatusOK)
            return
        }
        
        next.ServeHTTP(w, r)
    }
}
```

### 请求日志

```go
func requestLog(next http.HandlerFunc) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        log.Printf("--> %s %s %s", r.RemoteAddr, r.Method, r.URL.Path)
        next.ServeHTTP(w, r)
        log.Printf("<-- %s %s", r.Method, r.URL.Path)
    }
}
```

### 限流

```go
import "golang.org/x/time/rate"

type RateLimiter struct {
    limiter  *rate.Limiter
    viscosity map[string]*rate.Limiter
    mu       sync.RWMutex
}

func newRateLimiter() *RateLimiter {
    return &RateLimiter{
        limiter:  rate.NewLimiter(rate.Limit(100), 100),
        viscosity: make(map[string]*rate.Limiter),
    }
}

func (rl *RateLimiter) getLimiter(ip string) *rate.Limiter {
    rl.mu.Lock()
    defer rl.mu.Unlock()
    
    if limiter, ok := rl.viscosity[ip]; ok {
        return limiter
    }
    
    limiter := rate.NewLimiter(rate.Limit(10), 10)
    rl.viscosity[ip] = limiter
    return limiter
}

func rateLimitMiddleware(next http.HandlerFunc) http.HandlerFunc {
    rl := newRateLimiter()
    
    return func(w http.ResponseWriter, r *http.Request) {
        ip := r.RemoteAddr
        if !rl.getLimiter(ip).Allow() {
            http.Error(w, "请求过于频繁", http.StatusTooManyRequests)
            return
        }
        next.ServeHTTP(w, r)
    }
}
```

---

## 第三方路由器

### chi 路由器

```go
import "github.com/go-chi/chi/v5"

func main() {
    r := chi.NewRouter()
    
    // 中间件
    r.Use(middleware.Logger)
    r.Use(middleware.Recoverer)
    
    // 路由组
    r.Route("/api", func(r chi.Router) {
        r.Get("/users", listUsers)
        r.Post("/users", createUser)
        r.Get("/users/{id}", getUser)
        r.Put("/users/{id}", updateUser)
        r.Delete("/users/{id}", deleteUser)
    })
    
    http.ListenAndServe(":8080", r)
}

func listUsers(w http.ResponseWriter, r *http.Request) {
    json.NewEncoder(w).Encode([]User{})
}
```

### gin 路由器

```go
import "github.com/gin-gonic/gin"

func main() {
    r := gin.Default()
    
    r.GET("/users/:id", func(c *gin.Context) {
        id := c.Param("id")
        c.JSON(200, gin.H{"id": id})
    })
    
    r.POST("/users", func(c *gin.Context) {
        var user User
        if err := c.ShouldBindJSON(&user); err != nil {
            c.JSON(400, gin.H{"error": err.Error()})
            return
        }
        c.JSON(200, user)
    })
    
    r.Run(":8080")
}
```

---

## 最佳实践

| 实践 | 说明 |
|------|------|
| **使用路由器** | 不使用默认 ServeMux，避免全局状态 |
| **设置超时** | 为服务器设置 Read/Write Timeout |
| **优雅关闭** | 处理 SIGTERM 信号，优雅关闭服务器 |
| **使用中间件** | 分离横切关注点（日志、认证、CORS） |
| **返回 JSON** | 统一 JSON 响应格式 |
| **错误处理** | 对 JSON 解析等操作进行检查 |

---

## 总结

Go HTTP 服务开发核心要点：

1. **Handler** - 实现 Handler 接口或使用 HandlerFunc
2. **路由** - 使用 ServeMux 或第三方路由器
3. **请求解析** - 获取参数、解析 JSON、处理路径参数
4. **响应构建** - JSON 响应、设置 Header、状态码
5. **中间件** - 日志、认证、限流等横切关注点
6. **优雅关闭** - 处理信号、超时控制

掌握这些技能能让你构建出专业的 HTTP 服务。