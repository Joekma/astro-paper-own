---
title: Go 函数：参数、返回值、闭包、defer延迟调用
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-05-03T00:00:00.000+08:00
slug: go-functions
description: '深入讲解 Go 函数声明、参数传递、多返回值、命名返回值、闭包、defer、panic 和 recover，配合注释示例理解真实工程写法。'
tags:
  - Go
  - 函数
  - 闭包
  - defer
  - panic
  - recover
  - 参数传递
draft: false
series: go
language: zh-CN
---

## 函数声明

```go
func 函数名(参数列表) 返回值列表 {
    函数体
}
```

示例：

```go
func add(a int, b int) int {
    return a + b
}
```

相邻参数类型相同时，可以合并类型。

```go
func add(a, b int) int {
    return a + b
}
```

---

## 多返回值

Go 函数可以返回多个值，最常见的形式是“结果 + error”。

```go
func parsePort(raw string) (int, error) {
    port, err := strconv.Atoi(raw)
    if err != nil {
        return 0, fmt.Errorf("解析端口 %q: %w", raw, err)
    }
    if port <= 0 || port > 65535 {
        return 0, fmt.Errorf("端口超出范围: %d", port)
    }
    return port, nil
}
```

调用时要显式处理错误：

```go
port, err := parsePort("8080")
if err != nil {
    return err
}
fmt.Println(port)
```

---

## 命名返回值

命名返回值在进入函数时会被初始化为零值。

```go
func splitDuration(totalSeconds int) (days, hours, minutes int) {
    days = totalSeconds / (24 * 60 * 60)

    // 先取余，避免小时和分钟重复计算总秒数
    remaining := totalSeconds % (24 * 60 * 60)
    hours = remaining / (60 * 60)
    remaining = remaining % (60 * 60)
    minutes = remaining / 60

    return
}
```

命名返回值适合短函数或需要在 `defer` 中修改返回值的场景。函数较长时，显式 `return value, err` 通常更清晰。

---

## 参数传递

Go 的参数传递总是值传递：调用函数时会复制参数本身。

```go
func changeNumber(n int) {
    n = 100 // 只修改副本
}

func main() {
    value := 1
    changeNumber(value)
    fmt.Println(value) // 仍然是 1
}
```

如果参数是切片、map、channel、函数、指针、接口，复制的是这些值的“描述符”或指针，底层数据可能仍然共享。

```go
func appendItem(items []string) []string {
    // append 可能复用原底层数组，也可能分配新数组
    items = append(items, "new")
    return items
}

func updateFirst(items []string) {
    // 修改底层数组，调用方能看到变化
    if len(items) > 0 {
        items[0] = "updated"
    }
}
```

经验规则：

- 小型值类型直接传值。
- 需要修改调用方变量时传指针。
- 大结构体频繁传递时考虑指针，减少复制成本。
- 切片追加后要接收返回值。

---

## 可变参数

```go
func sum(nums ...int) int {
    total := 0
    for _, n := range nums {
        total += n
    }
    return total
}

fmt.Println(sum(1, 2, 3))

values := []int{4, 5, 6}
fmt.Println(sum(values...)) // 展开切片
```

可变参数在函数内部表现为切片。

---

## 函数作为值

函数可以赋值给变量，也可以作为参数或返回值。

```go
func apply(a, b int, fn func(int, int) int) int {
    return fn(a, b)
}

result := apply(2, 3, func(a, b int) int {
    return a * b
})
fmt.Println(result)
```

这让 Go 能很自然地表达中间件、回调、策略函数等模式。

---

## 闭包

闭包可以捕获外层变量。

```go
func counter() func() int {
    n := 0
    return func() int {
        n++
        return n
    }
}

next := counter()
fmt.Println(next()) // 1
fmt.Println(next()) // 2
```

注意：闭包捕获的是变量本身，而不是当时的值。Go 1.22 起循环变量闭包语义已调整，但维护旧版本项目时仍建议显式复制关键变量，便于读者理解。

---

## defer 延迟调用

`defer` 会在当前函数返回前执行，常用于释放资源。

```go
func readFile(path string) ([]byte, error) {
    file, err := os.Open(path)
    if err != nil {
        return nil, err
    }
    defer file.Close() // 无论后续哪条路径返回，文件都会关闭

    return io.ReadAll(file)
}
```

多个 `defer` 按后进先出顺序执行。

```go
func demo() {
    defer fmt.Println("first")
    defer fmt.Println("second")
}
// 输出:
// second
// first
```

`defer` 的参数会在注册时求值。

```go
func demo() {
    value := 1
    defer fmt.Println(value) // 注册 defer 时 value 已经是 1
    value = 2
}
// 输出 1
```

---

## defer 与命名返回值

`defer` 可以修改命名返回值。

```go
func safeRead(path string) (data []byte, err error) {
    defer func() {
        if err != nil {
            // 给错误补充上下文，调用方仍能看到原始错误链
            err = fmt.Errorf("读取文件 %q: %w", path, err)
        }
    }()

    data, err = os.ReadFile(path)
    return data, err
}
```

这种写法要克制使用。过多依赖 `defer` 修改返回值会增加阅读成本。

---

## panic 与 recover

`panic` 表示程序遇到无法正常继续的异常情况。普通业务错误应返回 `error`，不要用 `panic` 代替错误处理。

`recover` 只能在 `defer` 函数中捕获当前 goroutine 的 panic。

```go
func runSafely(fn func()) (err error) {
    defer func() {
        if value := recover(); value != nil {
            err = fmt.Errorf("panic recovered: %v", value)
        }
    }()

    fn()
    return nil
}
```

典型使用场景包括：框架边界保护、服务中间件防止单个请求导致进程退出、测试辅助工具等。

---

## 常见坑点

### 忘记接收 append 返回值

```go
items := []int{1, 2, 3}
items = append(items, 4) // 必须接收返回值
```

### 在循环中 defer 关闭资源

```go
for _, path := range paths {
    if err := processOne(path); err != nil {
        return err
    }
}

func processOne(path string) error {
    file, err := os.Open(path)
    if err != nil {
        return err
    }
    defer file.Close() // 每次调用结束就关闭，而不是等外层循环全部结束

    return handle(file)
}
```

在大循环里直接 `defer` 可能让资源长时间不释放，最好抽成小函数。

---

## 小结

1. Go 参数总是值传递，但切片、map、指针等会共享底层数据。
2. 多返回值让错误处理显式化。
3. 闭包适合保存状态，但要注意变量捕获。
4. `defer` 适合清理资源，参数在注册时求值，执行顺序后进先出。
5. `panic/recover` 用于异常边界保护，不应该替代普通错误处理。
