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
description: 'Redis常用命令和Python操作Redis的方法'
---

> Redis 操作包括命令和 Python 接口。

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

## 小结

- **命令**：SET/GET/DEL
- **Python**：redis-py 库
