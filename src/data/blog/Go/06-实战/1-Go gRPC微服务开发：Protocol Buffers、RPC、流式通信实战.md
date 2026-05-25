---
title: Go gRPC 微服务开发：Protocol Buffers、RPC、流式通信实战
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-05-03T00:00:00.000+08:00
slug: grpc-rpc-service
description: '详细讲解使用 gRPC 和 Protocol Buffers 开发 Go RPC 服务，包括 proto 编写、代码生成、服务实现、客户端调用、错误码、流式通信和拦截器。'
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
seriesOrder: 16
language: zh-CN
---

## gRPC 简介

gRPC 是基于 HTTP/2 的高性能 RPC 框架，默认使用 Protocol Buffers 描述接口和消息结构。

| 特性 | 说明 |
|------|------|
| IDL 优先 | 用 `.proto` 文件定义服务契约 |
| 代码生成 | 自动生成客户端和服务端接口 |
| 流式通信 | 支持服务端流、客户端流、双向流 |
| 错误模型 | 使用标准状态码表达错误 |
| 多语言 | 适合跨语言微服务 |

---

## 安装工具

```bash
go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest
```

确保 `$GOPATH/bin` 或 `GOBIN` 在 `PATH` 中，否则 `protoc` 找不到插件。

---

## 定义 proto

```protobuf
// proto/user/v1/user.proto
syntax = "proto3";

package user.v1;

option go_package = "example.com/user-service/proto/user/v1;userv1";

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

`go_package` 很重要，它决定生成代码的 Go 导入路径和包名。

---

## 生成代码

```bash
protoc \
  --go_out=. --go_opt=paths=source_relative \
  --go-grpc_out=. --go-grpc_opt=paths=source_relative \
  proto/user/v1/user.proto
```

会生成：

```text
proto/user/v1/user.pb.go
proto/user/v1/user_grpc.pb.go
```

---

## 实现服务端

```go
package main

import (
    "context"
    "log"
    "net"
    "sync"

    userv1 "example.com/user-service/proto/user/v1"
    "google.golang.org/grpc"
    "google.golang.org/grpc/codes"
    "google.golang.org/grpc/status"
)

type userServer struct {
    userv1.UnimplementedUserServiceServer

    mu    sync.RWMutex
    users map[string]*userv1.User
}

func newUserServer() *userServer {
    return &userServer{
        users: map[string]*userv1.User{
            "1": {Id: "1", Name: "Alice", Email: "alice@example.com", Age: 20},
        },
    }
}

func (s *userServer) GetUser(ctx context.Context, req *userv1.GetUserRequest) (*userv1.User, error) {
    if req.GetId() == "" {
        return nil, status.Error(codes.InvalidArgument, "id is required")
    }

    s.mu.RLock()
    defer s.mu.RUnlock()

    user, ok := s.users[req.GetId()]
    if !ok {
        return nil, status.Error(codes.NotFound, "user not found")
    }
    return user, nil
}

func (s *userServer) CreateUser(ctx context.Context, req *userv1.CreateUserRequest) (*userv1.User, error) {
    if req.GetName() == "" || req.GetEmail() == "" {
        return nil, status.Error(codes.InvalidArgument, "name and email are required")
    }

    s.mu.Lock()
    defer s.mu.Unlock()

    id := strconv.Itoa(len(s.users) + 1)
    user := &userv1.User{
        Id:    id,
        Name:  req.GetName(),
        Email: req.GetEmail(),
        Age:   req.GetAge(),
    }
    s.users[id] = user
    return user, nil
}

func (s *userServer) ListUsers(ctx context.Context, req *userv1.ListUsersRequest) (*userv1.ListUsersResponse, error) {
    s.mu.RLock()
    defer s.mu.RUnlock()

    users := make([]*userv1.User, 0, len(s.users))
    for _, user := range s.users {
        users = append(users, user)
    }

    return &userv1.ListUsersResponse{
        Users: users,
        Total: int32(len(users)),
    }, nil
}

func main() {
    lis, err := net.Listen("tcp", ":50051")
    if err != nil {
        log.Fatal(err)
    }

    server := grpc.NewServer()
    userv1.RegisterUserServiceServer(server, newUserServer())

    log.Println("gRPC server listening on :50051")
    if err := server.Serve(lis); err != nil {
        log.Fatal(err)
    }
}
```

服务端会并发处理请求，因此共享 map 需要锁保护。

---

## 客户端调用

```go
conn, err := grpc.NewClient(
    "localhost:50051",
    grpc.WithTransportCredentials(insecure.NewCredentials()),
)
if err != nil {
    log.Fatal(err)
}
defer conn.Close()

client := userv1.NewUserServiceClient(conn)

ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
defer cancel()

user, err := client.GetUser(ctx, &userv1.GetUserRequest{Id: "1"})
if err != nil {
    st, ok := status.FromError(err)
    if ok && st.Code() == codes.NotFound {
        log.Println("user not found")
        return
    }
    log.Fatal(err)
}

log.Printf("user=%+v", user)
```

示例使用 `insecure.NewCredentials()` 只适合本地开发。生产环境应使用 TLS。

---

## 服务端流

```protobuf
service UserService {
  rpc WatchUsers(WatchUsersRequest) returns (stream User);
}

message WatchUsersRequest {}
```

服务端实现：

```go
func (s *userServer) WatchUsers(req *userv1.WatchUsersRequest, stream userv1.UserService_WatchUsersServer) error {
    ticker := time.NewTicker(time.Second)
    defer ticker.Stop()

    for {
        select {
        case <-ticker.C:
            user := &userv1.User{Id: "heartbeat", Name: "system"}
            if err := stream.Send(user); err != nil {
                return err
            }
        case <-stream.Context().Done():
            return stream.Context().Err()
        }
    }
}
```

流式 RPC 必须关注 `stream.Context().Done()`，否则客户端断开后服务端可能继续工作。

---

## 一元拦截器

```go
func loggingInterceptor(
    ctx context.Context,
    req any,
    info *grpc.UnaryServerInfo,
    handler grpc.UnaryHandler,
) (any, error) {
    start := time.Now()

    resp, err := handler(ctx, req)

    log.Printf("method=%s duration=%s err=%v", info.FullMethod, time.Since(start), err)
    return resp, err
}

server := grpc.NewServer(
    grpc.UnaryInterceptor(loggingInterceptor),
)
```

拦截器适合做日志、认证、指标、恢复 panic 等横切逻辑。

---

## 小结

1. `.proto` 是 gRPC 的服务契约，`go_package` 必须正确。
2. 使用 `protoc-gen-go` 和 `protoc-gen-go-grpc` 生成代码。
3. 服务端共享状态要考虑并发安全。
4. 错误使用 `status.Error` 和 `codes` 表达。
5. 客户端应设置 context 超时，生产环境使用 TLS。
6. 流式 RPC 要监听 context 取消。
