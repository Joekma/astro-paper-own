---
title: Redis API开发
author: 程序员
pubDatetime: 2024-08-13T00:00:00.000+08:00
updated: 2026-04-22T00:00:00.000+08:00
slug: redis-api-development
description: 'Redis API开发和集成，包括Python和Go客户端'
tags:
  - Redis
  - 数据库
  - API
  - 开发
category: 数据库
draft: false
language: zh-CN
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
