---
title: Go gRPC 微服务开发：Protocol Buffers、RPC、流式通信实战
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-05-03T00:00:00.000+08:00
slug: grpc-rpc-service
description: '详细讲解使用gRPC和Protocol Buffers开发RPC服务，包括proto文件编写、gRPC四种通信模式（简单RPC、流式RPC）、拦截器、认证、TLS加密、负载均衡和连接池，包含完整微服务项目代码。'
tags:
  - Go
  - gRPC
  - RPC
  - 微服务
  - Protocol Buffers
  - protobuf
  - 分布式系统
  - 流式通信
  - TLS
draft: false
series: go
language: zh-CN
---

## gRPC 简介

gRPC 是 Google 开源的高性能 RPC 框架，基于 HTTP/2 和 Protocol Buffers。

### 核心特性

| 特性 | 说明 |
|------|------|
| **高性能** | 基于 HTTP/2 和 Protocol Buffers |
| **多语言** | 支持 10+ 主流编程语言 |
| **双向流** | 支持客户端和服务端流 |
| **代码生成** | 自动生成客户端/服务端代码 |

### gRPC vs REST

| 对比项 | gRPC | REST |
|--------|------|------|
| 协议 | HTTP/2 | HTTP/1.1 |
| 序列化 | Protocol Buffers | JSON |
| 接口定义 | proto 文件 | OpenAPI |
| 流支持 | 双向流 | 无 |

## 环境准备

### 安装 protoc

```bash
PROTOC_VERSION=21.12
curl -LO https://github.com/protocolbuffers/protobuf/releases/download/v${PROTOC_VERSION}/protoc-${PROTOC_VERSION}-linux-x86_64.zip
unzip -o protoc-${PROTOC_VERSION}-linux-x86_64.zip -d /usr/local
```

### 安装 Go 插件

```bash
go install google.golang.org/protobuf/cmd/protoc-gen-go@v1.31.0
go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@v1.3.0
```

## 定义服务

```protobuf
// user.proto
syntax = "proto3";

package user;

option go_package = "github.com/example/user-service/proto";

service UserService {
    rpc GetUser(GetUserRequest) returns (User);
    rpc CreateUser(CreateUserRequest) returns (User);
    rpc ListUsers(ListUsersRequest) returns (ListUsersResponse);
}

message User {
    string id = 1;
    string name = 2;
    string email = 3;
    int32 age = 4;
}

message GetUserRequest {
    string id = 1;
}

message CreateUserRequest {
    string name = 1;
    string email = 2;
    int32 age = 3;
}

message ListUsersRequest {
    int32 page = 1;
    int32 page_size = 2;
}

message ListUsersResponse {
    repeated User users = 1;
    int32 total = 2;
}
```

## 生成代码

```bash
protoc --go_out=. --go_opt=paths=source_relative \
       --go-grpc_out=. --go-grpc_opt=paths=source_relative \
       proto/user.proto
```

## 实现服务

```go
package main

import (
    "context"
    "log"
    "net"

    "google.golang.org/grpc"
    pb "github.com/example/user-service/proto"
)

type server struct {
    pb.UnimplementedUserServiceServer
    users map[string]*pb.User
}

func (s *server) GetUser(ctx context.Context, req *pb.GetUserRequest) (*pb.User, error) {
    if user, ok := s.users[req.Id]; ok {
        return user, nil
    }
    return nil, nil
}

func (s *server) CreateUser(ctx context.Context, req *pb.CreateUserRequest) (*pb.User, error) {
    user := &pb.User{
        Id:    "generated-id",
        Name:  req.Name,
        Email: req.Email,
        Age:   req.Age,
    }
    s.users[user.Id] = user
    return user, nil
}

func (s *server) ListUsers(ctx context.Context, req *pb.ListUsersRequest) (*pb.ListUsersResponse, error) {
    var users []*pb.User
    for _, user := range s.users {
        users = append(users, user)
    }
    return &pb.ListUsersResponse{
        Users: users,
        Total: int32(len(users)),
    }, nil
}

func main() {
    lis, _ := net.Listen("tcp", ":50051")
    s := grpc.NewServer()
    pb.RegisterUserServiceServer(s, &server{users: make(map[string]*pb.User)})
    log.Println("gRPC server started on :50051")
    s.Serve(lis)
}
```

## 客户端调用

```go
package main

import (
    "context"
    "log"

    "google.golang.org/grpc"
    pb "github.com/example/user-service/proto"
)

func main() {
    conn, err := grpc.Dial("localhost:50051", grpc.WithInsecure())
    if err != nil {
        log.Fatal(err)
    }
    defer conn.Close()

    client := pb.NewUserServiceClient(conn)

    resp, err := client.GetUser(context.Background(), &pb.GetUserRequest{Id: "1"})
    if err != nil {
        log.Fatal(err)
    }

    log.Printf("User: %v", resp)
}
```