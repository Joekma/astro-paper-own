---
title: Go Redis和MySQL数据库：连接池、事务、ORM实战
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-05-03T00:00:00.000+08:00
slug: golang-use-redis-mysql
description: '详细讲解 Go 集成 Redis 和 MySQL，包括 go-redis/v9、database/sql、连接池、context、事务、预处理、GORM 和常见实践。'
tags:
  - Go
  - Redis
  - MySQL
  - 数据库
  - ORM
  - GORM
  - 缓存
  - 连接池
draft: false
series: go
seriesOrder: 18
language: zh-CN
---

## Redis

### 安装 go-redis

```bash
go get github.com/redis/go-redis/v9
```

### 创建客户端

```go
package main

import (
    "context"
    "log"
    "time"

    "github.com/redis/go-redis/v9"
)

func newRedisClient() *redis.Client {
    return redis.NewClient(&redis.Options{
        Addr:         "localhost:6379",
        Password:     "",
        DB:           0,
        PoolSize:     20,
        MinIdleConns: 5,
    })
}

func main() {
    ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
    defer cancel()

    rdb := newRedisClient()
    defer rdb.Close()

    if err := rdb.Ping(ctx).Err(); err != nil {
        log.Fatal(err)
    }
}
```

go-redis 的操作都接收 `context.Context`，方便超时和取消。

### 基本操作

```go
func cacheUser(ctx context.Context, rdb *redis.Client, user User) error {
    key := "user:" + user.ID

    data, err := json.Marshal(user)
    if err != nil {
        return err
    }

    // 设置缓存和过期时间
    return rdb.Set(ctx, key, data, 10*time.Minute).Err()
}

func getCachedUser(ctx context.Context, rdb *redis.Client, id string) (*User, error) {
    data, err := rdb.Get(ctx, "user:"+id).Bytes()
    if err != nil {
        if errors.Is(err, redis.Nil) {
            return nil, nil // 缓存未命中
        }
        return nil, err
    }

    var user User
    if err := json.Unmarshal(data, &user); err != nil {
        return nil, err
    }
    return &user, nil
}
```

### Pipeline

Pipeline 可以减少多次命令的网络往返。

```go
func batchSet(ctx context.Context, rdb *redis.Client, values map[string]string) error {
    pipe := rdb.Pipeline()

    for key, value := range values {
        pipe.Set(ctx, key, value, time.Hour)
    }

    _, err := pipe.Exec(ctx)
    return err
}
```

Pipeline 不是事务。需要 Redis 事务语义时使用 `TxPipeline` 或 Lua，并理解具体命令的原子性。

---

## MySQL 与 database/sql

### 安装驱动

```bash
go get github.com/go-sql-driver/mysql
```

### 创建连接池

```go
import (
    "context"
    "database/sql"
    "time"

    _ "github.com/go-sql-driver/mysql"
)

func openDB(ctx context.Context, dsn string) (*sql.DB, error) {
    db, err := sql.Open("mysql", dsn)
    if err != nil {
        return nil, err
    }

    db.SetMaxOpenConns(50)
    db.SetMaxIdleConns(10)
    db.SetConnMaxLifetime(30 * time.Minute)
    db.SetConnMaxIdleTime(5 * time.Minute)

    if err := db.PingContext(ctx); err != nil {
        db.Close()
        return nil, err
    }
    return db, nil
}
```

`sql.Open` 不一定立即建立连接，使用 `PingContext` 可以验证数据库是否可达。

---

## 查询

```go
func listUsers(ctx context.Context, db *sql.DB, minAge int) ([]User, error) {
    rows, err := db.QueryContext(ctx, `
        SELECT id, name, email, age
        FROM users
        WHERE age >= ?
        ORDER BY id
    `, minAge)
    if err != nil {
        return nil, err
    }
    defer rows.Close()

    var users []User
    for rows.Next() {
        var user User
        if err := rows.Scan(&user.ID, &user.Name, &user.Email, &user.Age); err != nil {
            return nil, err
        }
        users = append(users, user)
    }

    if err := rows.Err(); err != nil {
        return nil, err
    }
    return users, nil
}
```

一定要检查 `rows.Err()`，否则遍历过程中的错误可能被忽略。

### 查询单行

```go
func getUser(ctx context.Context, db *sql.DB, id int64) (*User, error) {
    var user User
    err := db.QueryRowContext(ctx, `
        SELECT id, name, email, age
        FROM users
        WHERE id = ?
    `, id).Scan(&user.ID, &user.Name, &user.Email, &user.Age)

    if err != nil {
        if errors.Is(err, sql.ErrNoRows) {
            return nil, nil
        }
        return nil, err
    }
    return &user, nil
}
```

---

## 插入、更新、删除

```go
func createUser(ctx context.Context, db *sql.DB, user User) (int64, error) {
    result, err := db.ExecContext(ctx, `
        INSERT INTO users (name, email, age)
        VALUES (?, ?, ?)
    `, user.Name, user.Email, user.Age)
    if err != nil {
        return 0, err
    }

    return result.LastInsertId()
}
```

---

## 事务

```go
func transfer(ctx context.Context, db *sql.DB, fromID, toID int64, amount int64) error {
    tx, err := db.BeginTx(ctx, &sql.TxOptions{
        Isolation: sql.LevelReadCommitted,
    })
    if err != nil {
        return err
    }

    // 如果后续 Commit 成功，Rollback 会返回 sql.ErrTxDone，可忽略
    defer tx.Rollback()

    if _, err := tx.ExecContext(ctx,
        `UPDATE accounts SET balance = balance - ? WHERE id = ?`,
        amount, fromID,
    ); err != nil {
        return err
    }

    if _, err := tx.ExecContext(ctx,
        `UPDATE accounts SET balance = balance + ? WHERE id = ?`,
        amount, toID,
    ); err != nil {
        return err
    }

    if err := tx.Commit(); err != nil {
        return err
    }
    return nil
}
```

事务内所有操作都应使用 `tx`，不要混用外部 `db`，否则语句可能跑到事务之外。

---

## 预处理语句

```go
func insertMany(ctx context.Context, db *sql.DB, users []User) error {
    stmt, err := db.PrepareContext(ctx, `
        INSERT INTO users (name, email, age)
        VALUES (?, ?, ?)
    `)
    if err != nil {
        return err
    }
    defer stmt.Close()

    for _, user := range users {
        if _, err := stmt.ExecContext(ctx, user.Name, user.Email, user.Age); err != nil {
            return err
        }
    }
    return nil
}
```

预处理适合重复执行相同 SQL 的场景。

---

## GORM 简例

```bash
go get gorm.io/gorm
go get gorm.io/driver/mysql
```

```go
type User struct {
    ID    uint   `gorm:"primaryKey"`
    Name  string `gorm:"size:100;not null"`
    Email string `gorm:"uniqueIndex;size:255"`
    Age   int
}

func openGORM(dsn string) (*gorm.DB, error) {
    db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
    if err != nil {
        return nil, err
    }

    if err := db.AutoMigrate(&User{}); err != nil {
        return nil, err
    }
    return db, nil
}
```

ORM 能提高开发效率，但复杂查询、性能热点、事务边界仍要理解底层 SQL。

---

## 实践建议

1. 所有外部调用都传入 `context.Context`。
2. 初始化数据库后调用 `PingContext`。
3. 查询结果要 `defer rows.Close()` 并检查 `rows.Err()`。
4. 事务中使用 `BeginTx`，并 `defer tx.Rollback()`。
5. Redis 缓存要设置过期时间，避免无限增长。
6. ORM 适合常规 CRUD，关键路径仍需关注 SQL 和索引。
