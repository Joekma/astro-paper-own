---
title: Go Redis和MySQL数据库：连接池、事务、ORM实战
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-05-03T00:00:00.000+08:00
slug: golang-use-redis-mysql
description: '详细讲解Go集成Redis和MySQL，包括Redis连接、缓存、分布式锁、发布订阅、Pipeline、MySQL连接池、事务处理、预处理语句、GORM和XORM ORM框架使用，包含完整项目代码示例。'
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
language: zh-CN
---

## Redis

### 安装客户端

```bash
go get github.com/gomodule/redigo/redis
```

### 连接

```go
import "github.com/gomodule/redigo/redis"

conn, err := redis.Dial("tcp", "localhost:6379")
if err != nil {
    log.Fatal(err)
}
defer conn.Close()
```

### 基本操作

```go
// 设置值
conn.Do("SET", "name", "wd")

// 获取值
name, err := redis.String(conn.Do("GET", "name"))
fmt.Println(name)  // wd

// 过期时间
conn.Do("EXPIRE", "name", 10)  // 10秒过期

// 删除
conn.Do("DEL", "name")
```

### 批量操作

```go
// MSET
conn.Do("MSET", "name", "wd", "age", 22)

// MGET
res, _ := redis.Strings(conn.Do("MGET", "name", "age"))
fmt.Println(res)  // [wd 22]
```

### 列表操作

```go
// LPUSH
conn.Do("LPUSH", "list1", "ele1", "ele2", "ele3")

// LPOP
val, _ := redis.String(conn.Do("LPOP", "list1"))
fmt.Println(val)  // ele3
```

### Hash 操作

```go
// HSET
conn.Do("HSET", "student", "name", "wd", "age", 22)

// HGET
age, _ := redis.Int64(conn.Do("HGET", "student", "age"))
fmt.Println(age)  // 22
```

### 连接池

```go
pool := &redis.Pool{
    MaxIdle:   10,
    MaxActive: 100,
    Dial: func() (redis.Conn, error) {
        return redis.Dial("tcp", "localhost:6379")
    },
}

conn := pool.Get()
defer conn.Close()
```

## MySQL

### 安装驱动

```bash
go get github.com/go-sql-driver/mysql
```

### 连接

```go
import (
    "database/sql"
    _ "github.com/go-sql-driver/mysql"
)

db, err := sql.Open("mysql", "user:password@tcp(localhost:3306)/dbname")
if err != nil {
    log.Fatal(err)
}
defer db.Close()

db.SetMaxOpenConns(100)
db.SetMaxIdleConns(10)
```

### 查询

```go
rows, err := db.Query("SELECT id, name FROM users WHERE age > ?", 18)
if err != nil {
    log.Fatal(err)
}
defer rows.Close()

for rows.Next() {
    var id int
    var name string
    if err := rows.Scan(&id, &name); err != nil {
        log.Fatal(err)
    }
    fmt.Println(id, name)
}
```

### 查询单行

```go
var name string
err := db.QueryRow("SELECT name FROM users WHERE id = ?", 1).Scan(&name)
fmt.Println(name)
```

### 插入

```go
result, err := db.Exec("INSERT INTO users (name, age) VALUES (?, ?)", "张三", 25)
if err != nil {
    log.Fatal(err)
}

id, _ := result.LastInsertId()
fmt.Println("插入ID:", id)
```

### 更新

```go
result, err := db.Exec("UPDATE users SET age = ? WHERE id = ?", 30, 1)
affected, _ := result.RowsAffected()
fmt.Println("影响行数:", affected)
```

### 删除

```go
result, err := db.Exec("DELETE FROM users WHERE id = ?", 1)
affected, _ := result.RowsAffected()
fmt.Println("删除行数:", affected)
```

### 预处理

```go
stmt, err := db.Prepare("INSERT INTO users (name, age) VALUES (?, ?)")
if err != nil {
    log.Fatal(err)
}
defer stmt.Close()

stmt.Exec("李四", 28)
stmt.Exec("王五", 32)
```

### 事务

```go
tx, err := db.Begin()
if err != nil {
    log.Fatal(err)
}

_, err = tx.Exec("UPDATE accounts SET balance = balance - 100 WHERE id = 1")
if err != nil {
    tx.Rollback()
    log.Fatal(err)
}

_, err = tx.Exec("UPDATE accounts SET balance = balance + 100 WHERE id = 2")
if err != nil {
    tx.Rollback()
    log.Fatal(err)
}

tx.Commit()
```