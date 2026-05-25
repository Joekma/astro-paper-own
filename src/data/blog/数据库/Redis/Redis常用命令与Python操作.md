---
title: Redis常用命令与Python操作
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-04-22T00:00:00.000+08:00
slug: redis-commands-python
featured: false
draft: false
tags:
  - Redis
  - 数据库
  - Python
  - API
description: "Redis常用命令、Python操作和应用程序集成方法"
series: Redis
seriesOrder: 4
language: zh-CN
---

> Redis 操作包括命令行、Python 客户端和应用程序集成接口。

## 常用命令

```bash
SET name zhangsan
GET name
DEL name
EXISTS name
```

## Python 操作

```python
import redis
r = redis.Redis(host='localhost', port=6379)
r.set('name', 'zhangsan')
print(r.get('name'))
```

### 连接池

```python
import redis

pool = redis.ConnectionPool(host='localhost', port=6379, db=0)
r = redis.Redis(connection_pool=pool)

r.set('key', 'value')
print(r.get('key'))
```

## API 集成建议

- **复用连接**：Web 服务中优先使用连接池，避免每次请求都创建 TCP 连接。
- **统一封装**：把缓存读写、过期时间、序列化逻辑封装到独立模块，减少业务代码重复。
- **超时控制**：生产环境建议显式设置 `socket_timeout` 和 `socket_connect_timeout`。

## 小结

- **命令**：SET/GET/DEL
- **Python**：redis-py 库
- **API 集成**：连接池、统一封装、超时控制
