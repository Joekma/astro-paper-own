---
title: Go 编译与工具：go build、go run、go test、性能分析
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-05-03T00:00:00.000+08:00
slug: go-build-tools
description: '详细讲解 go build、go run、go install、go test、go fmt、go vet、race detector、benchmark、coverage、pprof 和 go generate。'
tags:
  - Go
  - 编译工具
  - go build
  - 性能优化
  - go test
  - pprof
  - gofmt
  - 开发工具
draft: false
series: go
language: zh-CN
---

## go run

`go run` 会临时编译并运行程序，适合开发和演示。

```bash
go run .
go run ./cmd/api
```

传递命令行参数：

```bash
go run ./cmd/api --config=config.yaml
```

---

## go build

`go build` 编译包或可执行程序。

```bash
go build ./...
go build -o bin/api ./cmd/api
```

常用参数：

| 参数 | 说明 |
|------|------|
| `-o` | 指定输出文件 |
| `-v` | 打印被编译的包 |
| `-x` | 打印底层执行命令 |
| `-race` | 开启数据竞争检测 |
| `-ldflags` | 传递链接参数 |

交叉编译：

```bash
GOOS=linux GOARCH=amd64 go build -o bin/api-linux ./cmd/api
```

Windows PowerShell 中可以这样设置：

```powershell
$env:GOOS="linux"
$env:GOARCH="amd64"
go build -o bin/api-linux ./cmd/api
```

---

## go install

安装当前模块命令：

```bash
go install ./cmd/api
```

安装外部命令行工具：

```bash
go install golang.org/x/tools/cmd/stringer@latest
```

带 `@version` 的 `go install` 是现代 Go 推荐的工具安装方式，不会修改当前项目的 `go.mod`。

---

## go test

运行测试：

```bash
go test ./...
go test -v ./...
go test -run TestAdd ./...
```

测试文件以 `_test.go` 结尾。

```go
func Add(a, b int) int {
    return a + b
}

func TestAdd(t *testing.T) {
    got := Add(1, 2)
    want := 3
    if got != want {
        t.Fatalf("Add(1, 2)=%d, want %d", got, want)
    }
}
```

表格驱动测试：

```go
func TestAddTable(t *testing.T) {
    tests := []struct {
        name string
        a, b int
        want int
    }{
        {name: "positive", a: 1, b: 2, want: 3},
        {name: "negative", a: -1, b: -2, want: -3},
    }

    for _, tt := range tests {
        tt := tt
        t.Run(tt.name, func(t *testing.T) {
            if got := Add(tt.a, tt.b); got != tt.want {
                t.Fatalf("got %d, want %d", got, tt.want)
            }
        })
    }
}
```

---

## 覆盖率

```bash
go test -cover ./...
go test -coverprofile=coverage.out ./...
go tool cover -html=coverage.out
```

覆盖率不是目标本身，它只是帮助发现未测试路径。关键业务分支和错误路径更值得关注。

---

## benchmark

基准测试函数以 `Benchmark` 开头。

```go
func BenchmarkBuilder(b *testing.B) {
    for i := 0; i < b.N; i++ {
        var builder strings.Builder
        for j := 0; j < 100; j++ {
            builder.WriteString("hello")
        }
        _ = builder.String()
    }
}
```

运行：

```bash
go test -bench=. -benchmem ./...
```

`-benchmem` 会输出内存分配次数和字节数，适合定位性能热点。

---

## race detector

```bash
go test -race ./...
go run -race ./cmd/api
```

竞态检测能发现并发读写共享变量的问题。它会带来明显开销，主要用于测试和排查。

---

## go fmt 和 gofmt

格式化当前模块：

```bash
go fmt ./...
```

`gofmt` 是 Go 风格统一的重要基础。团队不需要在缩进和换行上争论，把代码交给工具即可。

---

## go vet

`go vet` 检查可疑代码，例如格式化参数不匹配、不可达代码、错误的拷贝锁等。

```bash
go vet ./...
```

它不是完整静态分析器，但适合放进 CI。

---

## pprof 性能分析

HTTP 服务可以引入 pprof 端点。

```go
import _ "net/http/pprof"

func main() {
    go func() {
        log.Println(http.ListenAndServe("localhost:6060", nil))
    }()

    runApp()
}
```

采集 CPU profile：

```bash
go tool pprof http://localhost:6060/debug/pprof/profile?seconds=30
```

采集堆内存：

```bash
go tool pprof http://localhost:6060/debug/pprof/heap
```

生产环境暴露 pprof 要加访问控制，避免泄露内部信息。

---

## go generate

`go generate` 根据源码中的指令生成代码。

```go
//go:generate stringer -type=Status
type Status int
```

运行：

```bash
go generate ./...
```

`go generate` 不会在 `go build` 时自动执行，需要开发者或 CI 显式调用。

---

## 常用工作流

```bash
go fmt ./...
go vet ./...
go test ./...
go test -race ./...
go build ./...
```

大型项目可以把这些命令放进 Makefile、Taskfile 或 CI 流程。

---

## 小结

Go 工具链最大的优势是统一：格式化、测试、构建、依赖、性能分析都由官方工具覆盖。掌握 `go test`、`go vet`、`go build`、`go tool pprof`，就能支撑大多数日常工程工作。
