---
title: Go语言编译与工具完全指南（2024）：go build、go run、go test、性能分析
author: 程序员
pubDatetime: 2024-08-13T00:00:00.000+08:00
updated: 2026-04-22T00:00:00.000+08:00
slug: go-build-tools
description: 'Go语言编译和工具完整教程，详细讲解go build、go run、go install、go test、go fmt、go vet、pprof性能分析和cgo集成，包含完整命令行参数说明和最佳实践。'
tags:
  - Go
  - Golang
  - 编译工具
  - go build
  - 性能优化
  - go test
  - pprof
  - 开发工具
draft: false
language: zh-CN
---

## go build

### 无参数编译

```bash
cd src/chapter11/gobuild
go build
```

### 文件列表编译

```bash
go build main.go lib.go
```

> 可执行文件名默认为第一个源码文件名。

### 指定输出文件名

```bash
go build -o myexec main.go lib.go
```

### 包编译

```bash
go build -o main chapter11/goinstall
```

### 常用选项

| 选项 | 说明 |
|------|------|
| `-v` | 显示包名 |
| `-p n` | 并发编译数 |
| `-a` | 强制重新构建 |
| `-n` | 打印命令但不执行 |
| `-x` | 打印编译命令 |
| `-race` | 开启竞态检测 |

## go run

编译并运行源码，不生成可执行文件。

```bash
go run main.go --arg1 value1
```

## go install

编译并安装到 `$GOPATH/bin`。

```bash
go install chapter11/goinstall
```

**输出结构：**
```
$GOPATH/
├── bin/
│   └── goinstall
├── pkg/
│   └── linux_amd64/
│       └── chapter11/goinstall/
│           └── mypkg.a
└── src/
    └── chapter11/
        └── goinstall/
```

## go get

拉取远程包并编译安装。

```bash
go get github.com/gin-gonic/gin
```

## go mod

### 初始化模块

```bash
go mod init github.com/example/project
```

### 下载依赖

```bash
go mod download
go mod tidy  # 清理不需要的依赖
```

### 查看依赖

```bash
go list -m all      # 列出所有依赖
go mod why <module> # 解释依赖原因
```

## go test

### 运行测试

```bash
go test ./...              # 运行所有测试
go test -v ./...           # 详细输出
go test -run TestName      # 运行指定测试
```

### 测试示例

```go
func Add(a, b int) int {
    return a + b
}

func TestAdd(t *testing.T) {
    if Add(1, 2) != 3 {
        t.Error("expected 3")
    }
}
```

## go fmt

格式化代码。

```bash
go fmt ./...
```

## go vet

检查代码错误。

```bash
go vet ./...
```

## golint

代码风格检查。

```bash
golint ./...
```