---
title: gRPC Gateway：gRPC转HTTP JSON、OpenAPI文档、自动生成SDK
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-05-03T00:00:00.000+08:00
slug: grpc-gateway-http
description: '详细讲解 gRPC-Gateway v2 将 gRPC 服务暴露为 HTTP/JSON API，包含 proto 注解、代码生成、Gateway 实现、OpenAPI 文档和实践建议。'
tags:
  - Go
  - gRPC
  - HTTP
  - gRPC-Gateway
  - RESTful API
  - OpenAPI
  - Swagger
draft: false
series: go
language: zh-CN
---

## 简介

gRPC-Gateway 是 protoc 插件，可以根据 proto 中的 HTTP 注解生成反向代理代码，把 HTTP/JSON 请求转换为 gRPC 调用。

典型用途：

- 内部服务使用 gRPC。
- 外部客户端或浏览器使用 HTTP/JSON。
- 从同一份 proto 生成 gRPC 代码、Gateway 代码和 OpenAPI 文档。

---

## 安装工具

```bash
go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest
go install github.com/grpc-ecosystem/grpc-gateway/v2/protoc-gen-grpc-gateway@latest
go install github.com/grpc-ecosystem/grpc-gateway/v2/protoc-gen-openapiv2@latest
```

确保这些工具所在目录在 `PATH` 中。

---

## 定义 proto

```protobuf
// proto/hello/v1/hello.proto
syntax = "proto3";

package hello.v1;

import "google/api/annotations.proto";

option go_package = "example.com/hello-gateway/proto/hello/v1;hellov1";

service Greeter {
  rpc SayHello(SayHelloRequest) returns (SayHelloResponse) {
    option (google.api.http) = {
      post: "/v1/hello"
      body: "*"
    };
  }

  rpc GetHello(GetHelloRequest) returns (SayHelloResponse) {
    option (google.api.http) = {
      get: "/v1/hello/{name}"
    };
  }
}

message SayHelloRequest {
  string name = 1;
}

message GetHelloRequest {
  string name = 1;
}

message SayHelloResponse {
  string message = 1;
}
```

`google.api.http` 注解决定 HTTP 方法、路径和请求体映射。

---

## 生成代码

```bash
protoc -I . -I ./third_party/googleapis \
  --go_out=. --go_opt=paths=source_relative \
  --go-grpc_out=. --go-grpc_opt=paths=source_relative \
  --grpc-gateway_out=. --grpc-gateway_opt=paths=source_relative \
  proto/hello/v1/hello.proto
```

生成 OpenAPI：

```bash
protoc -I . -I ./third_party/googleapis \
  --openapiv2_out ./openapi \
  --openapiv2_opt logtostderr=true \
  proto/hello/v1/hello.proto
```

`google/api/annotations.proto` 通常来自 googleapis 仓库，也可以通过 buf、依赖管理或项目脚本统一管理。

---

## 实现 gRPC 服务

```go
type greeterServer struct {
    hellov1.UnimplementedGreeterServer
}

func (s greeterServer) SayHello(ctx context.Context, req *hellov1.SayHelloRequest) (*hellov1.SayHelloResponse, error) {
    if req.GetName() == "" {
        return nil, status.Error(codes.InvalidArgument, "name is required")
    }
    return &hellov1.SayHelloResponse{Message: "Hello " + req.GetName()}, nil
}

func (s greeterServer) GetHello(ctx context.Context, req *hellov1.GetHelloRequest) (*hellov1.SayHelloResponse, error) {
    if req.GetName() == "" {
        return nil, status.Error(codes.InvalidArgument, "name is required")
    }
    return &hellov1.SayHelloResponse{Message: "Hello " + req.GetName()}, nil
}
```

---

## 启动 Gateway

```go
package main

import (
    "context"
    "log"
    "net/http"

    hellov1 "example.com/hello-gateway/proto/hello/v1"
    "github.com/grpc-ecosystem/grpc-gateway/v2/runtime"
    "google.golang.org/grpc"
    "google.golang.org/grpc/credentials/insecure"
)

func main() {
    ctx := context.Background()
    mux := runtime.NewServeMux()

    opts := []grpc.DialOption{
        grpc.WithTransportCredentials(insecure.NewCredentials()),
    }

    // Gateway 会把 HTTP 请求转发到后端 gRPC 服务
    err := hellov1.RegisterGreeterHandlerFromEndpoint(ctx, mux, "localhost:50051", opts)
    if err != nil {
        log.Fatal(err)
    }

    server := &http.Server{
        Addr:    ":8080",
        Handler: mux,
    }

    log.Println("gateway listening on :8080")
    if err := server.ListenAndServe(); err != nil {
        log.Fatal(err)
    }
}
```

本地开发可以用 `insecure.NewCredentials()`，生产环境应配置 TLS。

---

## 测试

启动 gRPC 服务：

```bash
go run ./cmd/grpc-server
```

启动 Gateway：

```bash
go run ./cmd/gateway
```

POST 请求：

```bash
curl -X POST http://localhost:8080/v1/hello \
  -H 'Content-Type: application/json' \
  -d '{"name":"world"}'
```

GET 请求：

```bash
curl http://localhost:8080/v1/hello/world
```

响应：

```json
{"message":"Hello world"}
```

---

## 错误映射

gRPC-Gateway 会把 gRPC 状态码映射为 HTTP 状态码。例如：

| gRPC code | HTTP 状态 |
|-----------|-----------|
| `InvalidArgument` | 400 |
| `Unauthenticated` | 401 |
| `PermissionDenied` | 403 |
| `NotFound` | 404 |
| `Internal` | 500 |

服务端应返回 `status.Error(codes.Code, message)`，不要返回普通字符串错误让 Gateway 无法准确映射。

---

## 实践建议

1. proto 是唯一契约来源，HTTP 路由也写在 proto 注解里。
2. 使用 gRPC 状态码表达错误，避免散落的 HTTP 状态转换。
3. 生产环境使用 TLS，并为 Gateway 设置超时、日志、认证和限流中间件。
4. OpenAPI 文档应进入 CI，避免接口变更没有同步文档。
5. 对外 HTTP API 要谨慎设计字段命名、错误格式和版本路径。

---

## 流程图

```text
客户端 HTTP/JSON
      |
      v
gRPC-Gateway
      |
      | gRPC
      v
gRPC Server
```
