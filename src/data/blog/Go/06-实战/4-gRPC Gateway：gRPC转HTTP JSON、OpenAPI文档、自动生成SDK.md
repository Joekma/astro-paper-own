---
title: gRPC Gateway：gRPC转HTTP JSON、OpenAPI文档、自动生成SDK
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-05-03T00:00:00.000+08:00
slug: grpc-gateway-http
description: '详细讲解gRPC-Gateway将gRPC服务转换为HTTP/JSON API、自动生成Swagger/OpenAPI文档、proto文件注解、认证和中间件集成、错误处理，包含完整项目配置和部署实战。'
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

grpc-gateway 是 protoc 插件，将 gRPC API 转换为 RESTful HTTP/JSON API。

## 安装

### 1. 安装 Protocol Buffers

```bash
git clone https://github.com/google/protobuf
cd protobuf
./autogen.sh
./configure
make && make install
```

### 2. 安装 Go 工具

```bash
go get -u github.com/grpc-ecosystem/grpc-gateway/protoc-gen-grpc-gateway
go get -u github.com/golang/protobuf/protoc-gen-go
```

## 定义 proto

```protobuf
syntax = "proto3";

package helloworld;

import "google/api/annotations.proto";

service Greeter {
  rpc SayHello (HelloRequest) returns (HelloReply) {
    option (google.api.http) = {
      post: "/v1/example/echo"
      body: "*"
    };
  }
}

message HelloRequest {
  string name = 1;
}

message HelloReply {
  string message = 1;
}
```

## 编译 proto

### 生成 Go 代码

```bash
protoc -I/usr/local/include -I. \
  -I$GOPATH/src \
  -I$GOPATH/src/github.com/grpc-ecosystem/grpc-gateway/third_party/googleapis \
  --go_out=plugins=grpc:. \
  helloworld.proto
```

### 生成 gateway 代码

```bash
protoc -I/usr/local/include -I. \
  -I$GOPATH/src \
  -I$GOPATH/src/github.com/grpc-ecosystem/grpc-gateway/third_party/googleapis \
  --grpc-gateway_out=logtostderr=true:. \
  helloworld.proto
```

## 实现 gateway

```go
package main

import (
    "flag"
    "net/http"

    "github.com/golang/glog"
    "github.com/grpc-ecosystem/grpc-gateway/runtime"
    "golang.org/x/net/context"
    "google.golang.org/grpc"

    gw "path/to/helloworld"
)

func run() error {
    ctx := context.Background()
    ctx, cancel := context.WithCancel(ctx)
    defer cancel()

    mux := runtime.NewServeMux()
    opts := []grpc.DialOption{grpc.WithInsecure()}

    err := gw.RegisterGreeterHandlerFromEndpoint(ctx, mux, "localhost:50051", opts)
    if err != nil {
        return err
    }

    return http.ListenAndServe(":8080", mux)
}

func main() {
    flag.Parse()
    defer glog.Flush()

    if err := run(); err != nil {
        glog.Fatal(err)
    }
}
```

## 测试

### 启动 gRPC 服务

```bash
./greeter_server
```

### 启动 gateway

```bash
./gateway
```

### HTTP 请求

```bash
curl -X POST -k http://localhost:8080/v1/example/echo \
  -d '{"name": "world"}'
```

### 响应

```json
{"message":"Hello world"}
```

## 流程图

```
客户端 (HTTP/JSON)
      │
      ▼
┌─────────────┐
│ grpc-gateway │
└─────────────┘
      │
      │ gRPC
      ▼
┌─────────────┐
│ gRPC Server │
└─────────────┘
```