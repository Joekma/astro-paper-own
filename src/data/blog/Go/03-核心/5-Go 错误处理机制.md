---
title: Go 错误处理机制
author: Joekma
pubDatetime: 2026-05-08T00:00:00.000+08:00
modDatetime: 2026-05-08T00:00:00.000+08:00
slug: go-error-handling
description: '深入学习 Go 语言错误处理机制，掌握 error 接口、自定义错误、错误包装、错误链、errors.Is/As/Join、panic/recover 和工程最佳实践。'
tags:
  - Go
  - 错误处理
  - error
  - 异常
  - 最佳实践
draft: false
series: go
seriesOrder: 8
language: zh-CN
---

## 概述

Go 没有 Java、JavaScript 那样的 `try-catch` 机制。普通失败通过返回 `error` 显式表达，调用方决定如何处理。

```go
value, err := strconv.Atoi("42")
if err != nil {
    return fmt.Errorf("解析数字: %w", err)
}
fmt.Println(value)
```

![Go 错误处理通过 result 和 error 显式返回，调用方检查 err != nil，并可用 fmt.Errorf 的 %w 形成错误包装链，再通过 errors.Is、errors.As、errors.Join 识别和组合错误，panic 与 recover 只用于异常边界](./images/go-error-handling-chain-figure-01.png)

这种写法看起来直接，但优点也很明显：错误路径清楚，不会被隐藏在异常跳转里。

---

## error 接口

`error` 是内置接口。

```go
type error interface {
    Error() string
}
```

任何实现 `Error() string` 方法的类型都可以作为错误返回。

### 创建简单错误

```go
var ErrNotFound = errors.New("not found")
```

`errors.New` 适合创建固定错误值。需要格式化上下文时使用 `fmt.Errorf`。

```go
return fmt.Errorf("用户 %s 不存在", userID)
```

---

## 返回错误

Go 习惯把 `error` 放在最后一个返回值。

```go
func divide(a, b int) (int, error) {
    if b == 0 {
        return 0, errors.New("除数不能为 0")
    }
    return a / b, nil
}
```

调用方必须先检查错误，再使用结果。

```go
result, err := divide(10, 0)
if err != nil {
    return err
}
fmt.Println(result)
```

---

## 哨兵错误

哨兵错误是预定义错误变量，适合表示稳定、可比较的错误状态。

```go
var (
    ErrUserNotFound = errors.New("user not found")
    ErrInvalidInput = errors.New("invalid input")
)

func findUser(id string) (*User, error) {
    if id == "" {
        return nil, ErrInvalidInput
    }
    if id == "missing" {
        return nil, ErrUserNotFound
    }
    return &User{ID: id}, nil
}
```

判断时使用 `errors.Is`，这样即使错误被包装过也能匹配。

```go
user, err := findUser("missing")
if err != nil {
    if errors.Is(err, ErrUserNotFound) {
        return nil, fmt.Errorf("查询用户失败: %w", err)
    }
    return nil, err
}
fmt.Println(user)
```

不要这样写：

```go
if errors.Is(err, errors.New("user not found")) {
    // 永远不要用新创建的 error 做匹配目标
}
```

每次 `errors.New` 都会创建一个新的错误值，和原来的哨兵错误不是同一个值。

---

## 错误包装

Go 1.13 起，`fmt.Errorf` 使用 `%w` 可以包装错误，保留错误链。

```go
func loadConfig(path string) error {
    data, err := os.ReadFile(path)
    if err != nil {
        return fmt.Errorf("读取配置文件 %q: %w", path, err)
    }

    if len(data) == 0 {
        return fmt.Errorf("配置文件 %q 为空: %w", path, ErrInvalidInput)
    }
    return nil
}
```

检查错误链：

```go
err := loadConfig("missing.yaml")
if errors.Is(err, os.ErrNotExist) {
    fmt.Println("配置文件不存在")
}
```

包装错误时要补充“正在做什么”，而不是重复底层错误文本。

---

## 自定义错误类型

自定义错误适合携带结构化信息。

```go
type ValidationError struct {
    Field string
    Msg   string
}

func (e *ValidationError) Error() string {
    return e.Field + ": " + e.Msg
}

func validateAge(age int) error {
    if age < 0 {
        return &ValidationError{Field: "age", Msg: "不能为负数"}
    }
    if age > 150 {
        return &ValidationError{Field: "age", Msg: "不合理"}
    }
    return nil
}
```

提取错误类型时使用 `errors.As`。

```go
err := validateAge(-1)

var validationErr *ValidationError
if errors.As(err, &validationErr) {
    fmt.Println("字段:", validationErr.Field)
}
```

`errors.As` 能穿透包装链，比直接类型断言更适合现代 Go 代码。

---

## 实现 Unwrap

自定义错误类型也可以实现 `Unwrap`，让 `errors.Is/As` 识别内部错误。

```go
type QueryError struct {
    Query string
    Err   error
}

func (e *QueryError) Error() string {
    return "查询失败: " + e.Query
}

func (e *QueryError) Unwrap() error {
    return e.Err
}
```

使用：

```go
err := &QueryError{
    Query: "select * from users",
    Err:   context.DeadlineExceeded,
}

fmt.Println(errors.Is(err, context.DeadlineExceeded)) // true
```

---

## errors.Join

当一个操作可能产生多个错误时，可以使用 `errors.Join` 合并。

```go
func closeAll(closers ...io.Closer) error {
    var errs []error
    for _, closer := range closers {
        if err := closer.Close(); err != nil {
            errs = append(errs, err)
        }
    }
    return errors.Join(errs...)
}
```

`errors.Is` 和 `errors.As` 可以检查由 `errors.Join` 返回的错误树。

---

## defer 与资源清理

`defer` 常用于释放资源。

```go
func copyFile(dstPath, srcPath string) (err error) {
    src, err := os.Open(srcPath)
    if err != nil {
        return fmt.Errorf("打开源文件: %w", err)
    }
    defer src.Close()

    dst, err := os.Create(dstPath)
    if err != nil {
        return fmt.Errorf("创建目标文件: %w", err)
    }

    defer func() {
        closeErr := dst.Close()
        if err == nil && closeErr != nil {
            // 写文件时 Close 也可能返回刷盘错误
            err = fmt.Errorf("关闭目标文件: %w", closeErr)
        }
    }()

    if _, err := io.Copy(dst, src); err != nil {
        return fmt.Errorf("复制文件: %w", err)
    }
    return nil
}
```

只读文件的 `Close` 错误通常影响较小；写文件时更应该关注 `Close` 错误。

---

## panic 和 recover

普通业务失败应返回 `error`。`panic` 适合表示程序无法继续的异常，例如不可恢复的不变量破坏。

`recover` 只能在同一个 goroutine 的 `defer` 函数中捕获 panic。

```go
func RecoverMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        defer func() {
            if value := recover(); value != nil {
                log.Printf("panic: %v", value)
                http.Error(w, "internal server error", http.StatusInternalServerError)
            }
        }()

        next.ServeHTTP(w, r)
    })
}
```

中间件捕获 panic 后，应记录日志并返回统一错误响应，避免服务进程因为单个请求退出。

---

## 错误和日志

错误应向上返回，日志通常在边界层记录。

```go
func service(ctx context.Context) error {
    if err := repository(ctx); err != nil {
        return fmt.Errorf("执行业务逻辑: %w", err)
    }
    return nil
}

func handler(w http.ResponseWriter, r *http.Request) {
    if err := service(r.Context()); err != nil {
        // HTTP 边界层统一记录日志和转换响应
        log.Printf("request failed: %v", err)
        http.Error(w, "internal error", http.StatusInternalServerError)
        return
    }
}
```

不要在每一层都打印同一个错误，否则日志会重复且难以定位。

---

## 最佳实践

| 做法 | 说明 |
|------|------|
| 失败时立即处理或返回 | 不要忽略错误 |
| 包装错误时添加上下文 | 说明当前操作，例如“读取配置” |
| 用 `%w` 保留错误链 | 方便上层 `errors.Is/As` |
| 稳定错误用哨兵值 | 不要用字符串比较错误 |
| 类型信息用自定义错误 | 需要字段、错误码、重试标记时很有用 |
| 边界层统一记录日志 | 避免重复日志 |

---

## 小结

Go 错误处理的核心是“显式”。函数返回错误，调用方检查错误；需要上下文时包装错误；需要判断时使用 `errors.Is/As`；需要多个错误时使用 `errors.Join`；只有真正异常的情况才使用 `panic/recover`。
