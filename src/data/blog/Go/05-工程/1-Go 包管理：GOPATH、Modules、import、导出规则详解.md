---
title: Go 包管理：GOPATH、Modules、import、导出规则详解
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-05-03T00:00:00.000+08:00
slug: go-packages
description: '详细讲解现代 Go Modules、go.mod、go.sum、GOPATH 的历史角色、package、import、导出规则、internal 包和 init 函数。'
tags:
  - Go
  - 包管理
  - Modules
  - import
  - go.mod
  - GOPATH
draft: false
series: go
seriesOrder: 14
language: zh-CN
---

## package

Go 代码按包组织。每个 `.go` 文件第一行非注释代码必须是包声明。

```go
package user
```

同一目录下的 Go 文件必须属于同一个包，但测试文件可以使用 `package user` 或 `package user_test`。

### main 包

```go
package main

func main() {
    // 可执行程序入口
}
```

`package main` 用于构建可执行程序。普通库包不需要 `main` 函数。

---

## 导出规则

包级标识符、类型字段、方法名首字母大写才会被其他包访问。

```go
package user

type User struct {
    ID   int64  // 导出字段
    name string // 仅 user 包内可见
}

func NewUser(id int64, name string) *User {
    return &User{ID: id, name: name}
}
```

JSON、ORM、反射库也只能访问导出字段。字段小写时，即使写了标签，外部包也不能直接读取。

---

## import

```go
import (
    "context"
    "fmt"

    "example.com/myapp/internal/user"
)
```

Go 工具会按标准库、第三方/内部包分组格式化 import。

### 别名导入

```go
import userrepo "example.com/myapp/internal/repository/user"
```

当包名冲突或默认包名不清晰时使用别名。

### 空白导入

```go
import _ "github.com/go-sql-driver/mysql"
```

空白导入只执行包的初始化逻辑，常见于注册数据库驱动。不要为了绕过未使用导入错误而滥用 `_`。

### 点导入

```go
import . "fmt"
```

点导入会把包内导出标识符直接放入当前文件命名空间，容易降低可读性。除测试辅助场景外不推荐。

---

## Go Modules

现代 Go 项目使用 Go Modules 管理依赖。

```bash
go mod init example.com/myapp
```

`go.mod` 示例：

```go
module example.com/myapp

go 1.22

require (
    github.com/go-chi/chi/v5 v5.0.12
)
```

| 文件 | 说明 |
|------|------|
| `go.mod` | 模块路径、Go 版本、依赖列表 |
| `go.sum` | 依赖校验和，保障可复现下载 |

### 常用命令

```bash
go mod tidy      # 增加缺失依赖，删除未使用依赖
go mod download  # 下载依赖
go list -m all   # 查看模块依赖
go mod why -m github.com/go-chi/chi/v5
```

`go mod tidy` 是日常最常用的依赖整理命令。

---

## go get 和 go install

现代 Go 中：

- `go get` 主要用于修改当前模块依赖。
- 安装命令行工具应使用 `go install module/path@version`。

```bash
go get github.com/go-chi/chi/v5@latest
go install golang.org/x/tools/cmd/stringer@latest
```

安装工具时带上 `@version` 可以避免污染当前项目的 `go.mod`。

---

## GOPATH 的角色

GOPATH 是 Go 早期工作区机制。现代 Modules 项目不再要求放在 `$GOPATH/src` 下。

GOPATH 仍然有两个常见用途：

| 路径 | 说明 |
|------|------|
| `$GOPATH/bin` | `go install` 安装的命令行工具默认位置 |
| `$GOPATH/pkg/mod` | 模块下载缓存，具体位置也可由 `GOMODCACHE` 控制 |

查看：

```bash
go env GOPATH
go env GOMODCACHE
```

---

## internal 包

`internal` 目录用于限制导入范围。

```text
myapp/
├── internal/
│   └── auth/
└── cmd/
    └── api/
```

`internal/auth` 只能被 `myapp` 目录树内部的包导入，外部模块无法导入。

这适合放不希望暴露给其他模块的业务实现。

---

## init 函数

`init` 在包初始化时自动执行，不能被手动调用。

```go
func init() {
    log.Println("package initialized")
}
```

初始化顺序大致为：

1. 先初始化被导入的包。
2. 再初始化当前包的变量。
3. 再执行当前包的 `init`。
4. 最后执行 `main.main`。

`init` 适合注册驱动、初始化少量包级状态。复杂初始化更推荐显式函数，便于测试和错误处理。

---

## 推荐项目结构

```text
myapp/
├── cmd/
│   └── api/
│       └── main.go
├── internal/
│   ├── handler/
│   ├── service/
│   └── repository/
├── pkg/
│   └── client/
├── go.mod
└── go.sum
```

不要机械套模板。小项目可以只有 `main.go` 和少量包；当边界变清晰后再拆分目录。

---

## 小结

1. 包是 Go 代码复用和封装的基本单位。
2. 首字母大写控制导出，`internal` 控制模块内部可见性。
3. 现代项目使用 Go Modules，不再依赖 GOPATH 项目结构。
4. `go get` 管依赖，`go install module@version` 安装工具。
5. `init` 要谨慎使用，复杂初始化尽量显式化。
