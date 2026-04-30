---
title: Redis缓存使用
author: 程序员
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-04-22T00:00:00.000+08:00
slug: redis-caching-tutorial
featured: false
draft: false
tags:
  - Redis
  - 数据库
  - 缓存
description: 'Redis作为缓存的使用方法和最佳实践'
---

> Redis 常用于缓存加速应用。

## 缓存策略

| 策略 | 说明 |
|------|------|
| **Cache-Aside** | 应用自行管理 |
| **Read-Through** | 缓存自动加载 |
| **Write-Through** | 同步写缓存 |

## 示例

```python
# 缓存查询
def get_user(user_id):
    cache_key = f'user:{user_id}'
    user = r.get(cache_key)
    if user:
        return json.loads(user)
    
    user = db.query(user_id)
    r.setex(cache_key, 3600, json.dumps(user))
    return user
```

## 小结

- **缓存查询**：先缓存后数据库
- **缓存更新**：删除或更新缓存
