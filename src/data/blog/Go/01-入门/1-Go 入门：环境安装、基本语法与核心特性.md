---
title: Go 入门：环境安装、基本语法与核心特性
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-05-03T00:00:00.000+08:00
slug: go-getting-started
description: '从环境安装、模块初始化、Hello World 到 Go 的核心语法和工程特性，循序渐进建立 Go 入门知识框架。'
tags:
  - Go
  - 后端开发
  - 环境配置
  - 基本语法
  - goroutine
  - 并发编程
draft: false
series: go
seriesOrder: 1
language: zh-CN
---

## Go 语言简介

Go，也常被称为 Golang，是 Google 开源的静态类型、编译型编程语言。它的目标很务实：保留接近 C/C++ 的部署和性能优势，同时让语法、工具链和并发编程更简单。

Go 适合构建网络服务、命令行工具、云原生基础设施、微服务、数据处理程序等。Docker、Kubernetes、etcd、Terraform、Prometheus 等项目都大量使用 Go。

### 设计取向

| 取向 | 说明 |
|------|------|
| 简洁 | 语法少，风格统一，`gofmt` 自动格式化 |
| 编译快 | 依赖分析和编译速度适合大型工程 |
| 部署简单 | 常见服务可以编译成单个二进制文件 |
| 并发友好 | goroutine 和 channel 是语言级并发模型 |
| 标准库强 | `net/http`、`encoding/json`、`database/sql` 等开箱可用 |

Go 不是“语法最多”的语言，而是倾向于把复杂度放到工具链、运行时和标准库中，让业务代码保持清楚。

---

## 环境安装

### 安装 Go

从官方页面下载安装包，安装后确认 `go` 命令可用。

```bash
go version
```

能看到类似 `go version go1.xx.x ...` 的输出就说明安装成功。

### 常用环境变量

```bash
go env GOPATH
go env GOMODCACHE
go env GOPROXY
```

| 变量 | 说明 |
|------|------|
| `GOROOT` | Go 安装目录，通常不需要手动修改 |
| `GOPATH` | 工作区和默认二进制安装位置，现代项目不再要求放在 GOPATH 下 |
| `GOMODCACHE` | 模块依赖缓存目录 |
| `GOPROXY` | 模块下载代理 |

现代 Go 项目以 Go Modules 为主，通常从 `go mod init` 开始，而不是手动创建 `$GOPATH/src` 项目。

---

## 创建第一个项目

```bash
mkdir hello-go
cd hello-go
go mod init example.com/hello-go
```

创建 `main.go`：

```go
package main

import "fmt"

func main() {
    fmt.Println("Hello, Go!")
}
```

运行：

```bash
go run .
```

构建可执行文件：

```bash
go build -o hello
```

`go run .` 适合开发期快速运行，`go build` 适合生成可部署的二进制文件。

---

## 基本语法速览

### 包和入口函数

```go
package main

func main() {
    // main 包中的 main 函数是可执行程序入口
}
```

每个 `.go` 文件都必须声明所属包。可执行程序必须包含 `package main` 和 `func main()`。

### 变量与常量

```go
package main

import "fmt"

func main() {
    var name string = "gopher"
    age := 3 // 短变量声明，只能在函数内部使用

    const language = "Go"

    fmt.Println(name, age, language)
}
```

Go 是静态类型语言。变量类型在编译期确定，但很多场景下编译器能自动推导类型。

### 条件与循环

```go
if age >= 3 {
    fmt.Println("experienced gopher")
}

for i := 0; i < 3; i++ {
    fmt.Println(i)
}

for _, value := range []string{"api", "worker", "cli"} {
    fmt.Println(value)
}
```

Go 只有 `for` 一种循环关键字，`while` 的写法也通过 `for condition` 表达。

---

## 函数和错误

Go 鼓励显式返回错误，而不是用 `try-catch` 处理常规失败。

```go
package main

import (
    "errors"
    "fmt"
)

func divide(a, b int) (int, error) {
    if b == 0 {
        return 0, errors.New("除数不能为 0")
    }
    return a / b, nil
}

func main() {
    result, err := divide(10, 2)
    if err != nil {
        fmt.Println("计算失败:", err)
        return
    }
    fmt.Println("结果:", result)
}
```

Go 代码里常见的 `if err != nil` 不是模板噪音，而是在调用处明确表达失败路径。

---

## 并发入门

goroutine 是 Go 运行时调度的轻量级执行单元。channel 用来在 goroutine 之间传递数据。

```go
package main

import (
    "fmt"
    "time"
)

func worker(id int, jobs <-chan string, done chan<- struct{}) {
    for job := range jobs {
        // range 会持续接收，直到 jobs 被 close
        fmt.Printf("worker %d processing %s\n", id, job)
        time.Sleep(200 * time.Millisecond)
    }

    // 用空结构体发送完成信号，不额外分配业务数据
    done <- struct{}{}
}

func main() {
    jobs := make(chan string)
    done := make(chan struct{})

    go worker(1, jobs, done)

    jobs <- "build"
    jobs <- "test"
    close(jobs) // 告诉 worker 没有更多任务

    <-done // 等待 worker 退出，避免 main 提前结束
}
```

并发代码要格外关注退出条件。没有退出条件的 goroutine 可能造成资源泄漏。

---

## 标准库

| 包名 | 常见用途 |
|------|----------|
| `fmt` | 格式化输入输出 |
| `errors` | 创建和处理错误 |
| `context` | 超时、取消和请求作用域数据 |
| `net/http` | HTTP 服务端和客户端 |
| `encoding/json` | JSON 编解码 |
| `database/sql` | 数据库通用接口 |
| `sync` | 锁、等待组、一次性执行等同步原语 |
| `testing` | 单元测试、基准测试 |

先熟悉标准库，再决定是否引入第三方包，是 Go 工程里很常见的选择。

---

## 推荐项目结构

小项目可以非常简单：

```text
hello-go/
├── go.mod
├── main.go
└── README.md
```

服务逐渐变大后，可以按职责拆分：

```text
myservice/
├── cmd/
│   └── api/            # 程序入口
│       └── main.go
├── internal/           # 仅当前模块可导入的业务代码
│   ├── handler/
│   ├── service/
│   └── repository/
├── pkg/                # 确实需要给外部复用的库代码
├── go.mod
└── go.sum
```

不要一上来追求复杂目录。Go 项目结构的核心原则是：先让包边界服务于业务边界，再逐步抽象。

---

