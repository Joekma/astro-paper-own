---
title: Go 接口：接口定义、多态、接口组合、空接口详解
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-05-03T00:00:00.000+08:00
slug: go-interfaces
description: '深入讲解 Go 接口声明、隐式实现、多态、接口组合、any、类型断言、类型 switch、error 接口和接口 nil 陷阱。'
tags:
  - Go
  - 接口
  - interface
  - 多态
  - 面向对象
  - 类型断言
  - error
draft: false
series: go
language: zh-CN
---

## 接口是什么

接口描述一组行为，而不是描述一个对象“是什么”。

```go
type Writer interface {
    Write(p []byte) (n int, err error)
}
```

任何类型只要实现了 `Write([]byte) (int, error)` 方法，就自动实现 `Writer` 接口。Go 不需要 `implements` 关键字。

---

## 隐式实现

```go
type Buffer struct {
    data []byte
}

func (b *Buffer) Write(p []byte) (int, error) {
    b.data = append(b.data, p...)
    return len(p), nil
}

var _ io.Writer = (*Buffer)(nil) // 编译期接口实现检查
```

`var _ io.Writer = (*Buffer)(nil)` 不会生成运行时代码，但能在编译期确认 `*Buffer` 实现了接口。

---

## 小接口优先

Go 标准库大量使用小接口，例如：

| 接口 | 方法 |
|------|------|
| `io.Reader` | `Read(p []byte) (n int, err error)` |
| `io.Writer` | `Write(p []byte) (n int, err error)` |
| `io.Closer` | `Close() error` |
| `fmt.Stringer` | `String() string` |

小接口更容易复用，也更利于测试。

```go
func CopyToStdout(r io.Reader) error {
    _, err := io.Copy(os.Stdout, r)
    return err
}
```

这个函数不关心数据来自文件、网络连接还是字符串，只关心它能不能 `Read`。

---

## 多态示例

```go
type Notifier interface {
    Notify(ctx context.Context, message string) error
}

type EmailNotifier struct{}

func (EmailNotifier) Notify(ctx context.Context, message string) error {
    fmt.Println("send email:", message)
    return nil
}

type SMSNotifier struct{}

func (SMSNotifier) Notify(ctx context.Context, message string) error {
    fmt.Println("send sms:", message)
    return nil
}

func SendWelcome(ctx context.Context, n Notifier, username string) error {
    // 调用方传入不同实现，函数行为随之变化
    return n.Notify(ctx, "welcome "+username)
}
```

接口让调用方依赖抽象行为，而不是具体实现。

---

## 接口组合

接口可以嵌入其他接口。

```go
type ReadWriter interface {
    io.Reader
    io.Writer
}

type ReadWriteCloser interface {
    io.Reader
    io.Writer
    io.Closer
}
```

当一个类型实现组合接口里的所有方法时，就实现了这个组合接口。

---

## 空接口和 any

`interface{}` 表示没有方法约束的接口，任何类型都实现它。Go 1.18 起提供了别名 `any`，更适合表达“任意类型”。

```go
func Print(value any) {
    fmt.Println(value)
}
```

不要滥用 `any`。如果函数真正需要某种行为，用具体接口表达更清晰。

---

## 类型断言

当接口值里保存了具体类型，可以用类型断言取出。

```go
var w io.Writer = os.Stdout

file, ok := w.(*os.File)
if ok {
    fmt.Println(file.Name())
}
```

不带 `ok` 的断言失败会 panic。

```go
file := w.(*os.File) // 断言失败时 panic
```

生产代码中通常使用安全断言。

---

## 类型 switch

```go
func Format(value any) string {
    switch v := value.(type) {
    case nil:
        return "<nil>"
    case string:
        return v
    case int:
        return strconv.Itoa(v)
    case fmt.Stringer:
        return v.String()
    default:
        return fmt.Sprintf("%v", v)
    }
}
```

类型 switch 适合在边界层处理不确定输入，例如日志、配置解析、编码器等。

---

## error 接口

`error` 是 Go 内置接口。

```go
type error interface {
    Error() string
}
```

自定义错误类型可以携带更多上下文。

```go
type ValidationError struct {
    Field string
    Msg   string
}

func (e *ValidationError) Error() string {
    return e.Field + ": " + e.Msg
}
```

配合 `errors.As` 可以从错误链中提取具体类型。

```go
var validationErr *ValidationError
if errors.As(err, &validationErr) {
    fmt.Println(validationErr.Field)
}
```

---

## 接口 nil 陷阱

接口值由“动态类型”和“动态值”组成。只有两者都为空时，接口才等于 `nil`。

```go
type MyError struct{}

func (*MyError) Error() string {
    return "my error"
}

func returnsError() error {
    var err *MyError = nil
    return err // 返回的 error 接口并不等于 nil
}

func main() {
    err := returnsError()
    fmt.Println(err == nil) // false
}
```

正确做法是没有错误时直接返回 `nil`。

```go
func returnsError(ok bool) error {
    if ok {
        return nil
    }
    return &MyError{}
}
```

---

## 接口设计建议

1. 接收接口，返回具体类型。函数参数用接口利于测试和扩展，返回具体类型利于调用方使用。
2. 接口尽量小，通常一到三个方法就足够。
3. 在使用方定义接口，而不是在实现方提前定义庞大接口。
4. 需要编译期校验时使用 `var _ Interface = (*Type)(nil)`。
5. 不要为了“看起来抽象”而抽象，重复出现真实需求后再提接口。

---

## 小结

接口是 Go 表达抽象和多态的核心工具。理解隐式实现、小接口、接口组合、类型断言和 nil 陷阱，能让代码既灵活又保持清楚。
