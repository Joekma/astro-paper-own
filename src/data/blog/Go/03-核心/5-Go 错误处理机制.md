---
title: Go 错误处理机制
author: Joekma
pubDatetime: 2026-05-08T00:00:00.000+08:00
modDatetime: 2026-05-08T00:00:00.000+08:00
slug: go-error-handling
description: '深入学习 Go 语言错误处理机制，掌握 error 接口、自定义错误、错误包装、错误链等核心概念。'
tags:
  - Go
  - 错误处理
  - error
  - 异常
  - 最佳实践
draft: false
language: zh-CN
---

## 概述

Go 语言采用独特的错误处理方式，没有 try-catch 机制，而是通过返回 error 对象来表达错误。这种设计让错误处理变得显式和可控，但也需要开发者掌握正确的错误处理模式。

### 核心概念

| 概念 | 说明 |
|------|------|
| **error 接口** | 内置接口，用于表示错误状态 |
| **返回错误** | 函数返回 (result, error) 形式 |
| **错误检查** | if err != nil 处理错误 |
| **错误包装** | fmt.Errorf 携带上下文 |
| **哨兵错误** | 预定义错误变量用于比较 |

---

## error 接口基础

### 内置 error 接口

```go
type error interface {
    Error() string
}
```

### 最简单的错误

```go
import "errors"

// 使用 errors.New 创建错误
err := errors.New("这是一个错误")
fmt.Println(err)  // 这是一个错误
```

### 函数返回错误

```go
import (
    "errors"
    "fmt"
)

func divide(a, b int) (int, error) {
    if b == 0 {
        return 0, errors.New("除数不能为零")
    }
    return a / b, nil
}

// 使用函数
result, err := divide(10, 2)
if err != nil {
    fmt.Println("错误:", err)
    return
}
fmt.Println("结果:", result)
```

---

## 自定义错误类型

### 定义错误类型

```go
import (
    "fmt"
    "time"
)

// 自定义错误类型
type ValidationError struct {
    Field   string
    Message string
    Time    time.Time
}

func (e *ValidationError) Error() string {
    return fmt.Sprintf("%s: %s", e.Field, e.Message)
}

// 使用自定义错误
func validateAge(age int) error {
    if age < 0 {
        return &ValidationError{
            Field:   "age",
            Message: "年龄不能为负数",
            Time:    time.Now(),
        }
    }
    if age > 150 {
        return &ValidationError{
            Field:   "age",
            Message: "年龄不合理",
            Time:    time.Now(),
        }
    }
    return nil
}
```

### 检查错误类型

```go
err := validateAge(-1)
if err != nil {
    // 类型断言
    if validationErr, ok := err.(*ValidationError); ok {
        fmt.Printf("验证错误字段: %s\n", validationErr.Field)
        fmt.Printf("错误时间: %s\n", validationErr.Time)
    }
}
```

---

## 错误包装

### fmt.Errorf 包装错误

```go
import "fmt"

func readConfig(path string) error {
    if path == "" {
        return fmt.Errorf("配置文件路径为空")
    }
    // 模拟读取失败
    return fmt.Errorf("读取文件失败: %w", errors.New("file not found"))
}

func main() {
    err := readConfig("")
    if err != nil {
        // errors.Is 检查错误链
        if errors.Is(err, errors.New("file not found")) {
            fmt.Println("文件未找到")
        }
    }
}
```

### errors.Wrap 包装 (Go 1.13+)

```go
import "fmt"

func readFile(filename string) error {
    return fmt.Errorf("文件读取失败: %w", os.ErrNotExist)
}

func processData(filename string) error {
    err := readFile(filename)
    if err != nil {
        return fmt.Errorf("处理数据时: %w", err)
    }
    return nil
}

// 检查错误链
err := processData("data.txt")
if err != nil {
    if errors.Is(err, os.ErrNotExist) {
        fmt.Println("文件不存在")
    }
}
```

---

## 哨兵错误

### 预定义错误

```go
import "errors"

// 定义哨兵错误
var (
    ErrNotFound      = errors.New("资源不存在")
    ErrUnauthorized   = errors.New("未授权访问")
    ErrInvalidInput   = errors.New("无效输入")
    ErrAlreadyExists  = errors.New("资源已存在")
)

func findUser(id string) (*User, error) {
    if id == "" {
        return nil, ErrInvalidInput
    }
    if id == "unknown" {
        return nil, ErrNotFound
    }
    return &User{ID: id}, nil
}

// 使用哨兵错误
user, err := findUser("unknown")
if err != nil {
    if errors.Is(err, ErrNotFound) {
        fmt.Println("用户不存在")
    } else if errors.Is(err, ErrInvalidInput) {
        fmt.Println("输入无效")
    }
}
```

### 避免暴露内部错误

```go
import "errors"

var errNotFound = errors.New("not found")

type UserStore struct {
    data map[string]*User
}

func (s *UserStore) FindUser(id string) (*User, error) {
    user, ok := s.data[id]
    if !ok {
        return nil, errNotFound
    }
    return user, nil
}

// 对外暴露的包装错误
func (s *UserStore) GetUser(id string) (*User, error) {
    user, err := s.FindUser(id)
    if err != nil {
        if errors.Is(err, errNotFound) {
            return nil, fmt.Errorf("获取用户失败: %w", err)
        }
        return nil, err
    }
    return user, nil
}
```

---

## 错误链操作

### errors.Is

```go
import (
    "errors"
    "fmt"
)

var ErrBase = errors.New("基础错误")

func level1() error { return fmt.Errorf("level1: %w", ErrBase) }
func level2() error { return fmt.Errorf("level2: %w", level1()) }
func level3() error { return fmt.Errorf("level3: %w", level2()) }

// 检查错误链
err := level3()
fmt.Println(errors.Is(err, ErrBase))  // true
```

### errors.As

```go
import (
    "errors"
    "fmt"
)

type MyError struct {
    Code    int
    Message string
}

func (e *MyError) Error() string {
    return e.Message
}

func returnMyError() error {
    return &MyError{Code: 404, Message: "not found"}
}

// 提取错误类型
err := returnMyError()
var myErr *MyError
if errors.As(err, &myErr) {
    fmt.Printf("错误代码: %d\n", myErr.Code)
}
```

---

## defer 延迟处理

### 清理资源

```go
func readLargeFile(filepath string) error {
    file, err := os.Open(filepath)
    if err != nil {
        return err
    }
    
    // defer 确保文件关闭
    defer file.Close()
    
    // 读取文件内容
    data := make([]byte, 1024)
    _, err = file.Read(data)
    return err
}
```

### 恢复 panic

```go
import "fmt"

func safeDivide(a, b int) (result int, err error) {
    // defer 恢复 panic
    defer func() {
        if r := recover(); r != nil {
            err = fmt.Errorf("panic recovered: %v", r)
        }
    }()
    
    // 可能 panic 的代码
    if b == 0 {
        panic("除数不能为零")
    }
    return a / b, nil
}

func main() {
    result, err := safeDivide(10, 0)
    if err != nil {
        fmt.Println("捕获错误:", err)
    }
}
```

---

## 错误处理模式

### 只检查错误存在

```go
data, err := fetchData()
if err != nil {
    return err  // 简单向上传递
}
```

### 添加上下文后传递

```go
data, err := fetchData()
if err != nil {
    return fmt.Errorf("获取用户数据失败: %w", err)
}
```

### 使用错误变量进行比较

```go
if errors.Is(err, os.ErrNotExist) {
    // 文件不存在
}
```

### 自定义错误类型检查

```go
var validationErr *ValidationError
if errors.As(err, &validationErr) {
    fmt.Println(validationErr.Field)
}
```

---

## 最佳实践

### 应该做的事情

| 实践 | 说明 |
|------|------|
| **返回具体错误** | 使用自定义错误类型提供更多上下文 |
| **错误包装** | 使用 %w 包装底层错误 |
| **使用哨兵错误** | 对于可预见的错误使用预定义错误 |
| **错误检查使用 Is/As** | 不要直接比较错误值 |
| **defer 清理资源** | 确保资源正确释放 |

### 不应该做的事情

| 反模式 | 说明 |
|--------|------|
| **忽略错误** | 不要使用 `_` 忽略错误 |
| **panic 用于正常流程** | panic 只用于真正的异常情况 |
| **字符串比较错误** | 使用 errors.Is 而非字符串比较 |
| **错误信息过于模糊** | 提供有意义的错误信息 |

### 示例对比

```go
// ❌ 错误：忽略错误
data, _ := fetchData()

// ❌ 错误：字符串比较
if err.Error() == "not found" { }

// ❌ 错误：过于宽泛
if err != nil {
    return err
}

// ✅ 正确：明确处理
data, err := fetchData()
if err != nil {
    return fmt.Errorf("处理数据失败: %w", err)
}

// ✅ 正确：使用 errors.Is
if errors.Is(err, os.ErrNotExist) {
    return fmt.Errorf("配置文件不存在: %w", err)
}
```

---

## 错误与日志

### 在错误中包含日志

```go
import "log"

func processRequest(req *Request) error {
    err := validate(req)
    if err != nil {
        log.Printf("验证失败: %v", err)
        return err
    }
    return nil
}
```

### 统一错误响应

```go
type APIError struct {
    Code    int    `json:"code"`
    Message string `json:"message"`
}

func (e *APIError) Error() string {
    return e.Message
}

func handleError(err error) *APIError {
    if errors.Is(err, ErrNotFound) {
        return &APIError{Code: 404, Message: "资源不存在"}
    }
    if errors.Is(err, ErrUnauthorized) {
        return &APIError{Code: 401, Message: "未授权"}
    }
    return &APIError{Code: 500, Message: "内部错误"}
}
```

---

## 总结

Go 的错误处理设计强调显式和可控：

1. **error 接口** - 内置接口，返回错误作为函数返回值
2. **自定义错误** - 通过实现 Error() 方法创建类型
3. **错误包装** - 使用 %w 在错误链中保留上下文
4. **errors.Is/As** - 安全地检查和提取错误
5. **defer** - 确保资源清理和 panic 恢复

掌握这些技巧能让你写出健壮的 Go 代码。