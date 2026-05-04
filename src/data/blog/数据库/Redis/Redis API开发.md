---
title: Redis API开发
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-04-22T00:00:00.000+08:00
slug: redis-api-development
featured: false
draft: false
tags:
  - Redis
  - 数据库
  - API
  - 开发
description: 'Redis API开发和集成，包括Python和Go客户端使用'
---

> Redis API 用于应用程序集成。

## Python 客户端

```python
import redis
r = redis.Redis(host='localhost', port=6379)
r.set('key', 'value')
print(r.get('key'))
```

## 小结

- **redis-py**：Python 客户端
- **连接池**：复用连接
