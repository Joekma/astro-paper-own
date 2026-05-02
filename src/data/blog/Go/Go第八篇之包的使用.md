---
title: Go语言包管理完全指南（2024）：GOPATH、Modules、import、导出规则详解
author: 程序员
pubDatetime: 2024-08-13T00:00:00.000+08:00
updated: 2026-04-22T00:00:00.000+08:00
slug: go-packages
description: 'Go语言包管理完整教程，详细讲解GOPATH、Go Modules（go.mod）、package、import、导出规则、循环导入和内部包，包含完整代码示例和项目结构建议。'
tags:
  - Go
  - Golang
  - 包管理
  - Modules
  - import
  - go.mod
  - GOPATH
draft: false
language: zh-CN
---

## GOPATH

GOPATH 是 Go 语言使用的环境变量，提供项目的工作目录。

### 查看 GOPATH

```bash
go env
```

| 平台 | 默认路径 |
|------|----------|
| Windows | `%USERPROFILE%/go` |
| Unix | `$HOME/go` |

### 项目结构

```
$GOPATH/
├── src/           # 源码目录
├── bin/           # 编译生成的可执行文件
└── pkg/           # 编译生成的中间文件
```

### 设置 GOPATH

```bash
export GOPATH=/path/to/project
mkdir -p src/hello
```

## package

包是多个 Go 源码的集合，用于代码复用。

### 基本规则

```go
package 包名
```

| 规则 | 说明 |
|------|------|
| 同一目录文件 | 必须属于同一个包 |
| 包名可不同目录 | 包名可以与目录不同 |
| main 包 | 应用程序入口包 |

### 创建包

```go
package mypkg

func Add(a, b int) int {
    return a + b
}
```

## 导出规则

首字母大写的标识符才能被导出。

### 示例

```go
package mypkg

var myVar = 100        // 仅包内可见
const MyConst = "hello"  // 导出
type MyStruct struct{}   // 导出
```

### 结构体字段导出

```go
type MyStruct struct {
    ExportedField int     // 包外可访问
    privateField  int     // 仅包内访问
}
```

## import 导入

### 单行导入

```go
import "fmt"
import "os"
```

### 多行导入

```go
import (
    "fmt"
    "os"
)
```

### 完整示例

```go
// mylib/add.go
package mylib

func Add(a, b int) int {
    return a + b
}
```

```go
// main.go
package main

import (
    "mylib"
    "fmt"
)

func main() {
    fmt.Println(mylib.Add(1, 2))
}
```

### 别名导入

```go
import (
    m "mylib"  // 使用 m 作为别名
)

func main() {
    m.Add(1, 2)
}
```

### 点导入

```go
import (
    . "mylib"
)

func main() {
    Add(1, 2)  // 直接使用，不需包名
}
```

### 下划线导入

```go
import (
    _ "mylib"  // 仅执行 init()，不引用
)
```

> 用于导入包时执行初始化代码。