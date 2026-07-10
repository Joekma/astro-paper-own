---
title: Redis事务与分布式锁
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-04-22T00:00:00.000+08:00
slug: redis-transactions-locks
featured: false
draft: false
tags:
  - Redis
  - 数据库
  - 事务
  - 锁
description: "Redis事务和锁机制，包括MULTI/EXEC和分布式锁实现"
series: Redis
seriesOrder: 7
language: zh-CN
---

## 概述

Redis 提供了事务和锁机制来保证数据一致性和并发控制，适用于电商库存、账户转账等场景。

![Redis 事务通过 MULTI 和 EXEC 顺序提交命令，WATCH 负责乐观锁冲突检测，Lua 脚本提供服务端原子执行](./images/redis-transaction-watch-lua-figure-01.png)

## 管道

管道用于把多个命令一次性发送到 Redis，减少网络往返次数。它不等同于事务，但常和批量读写、统计更新一起使用。

```bash
redis-cli --pipe < commands.txt
```

```python
pipe = r.pipeline(transaction=False)
pipe.set('name', 'zhangsan')
pipe.incr('counter')
pipe.get('name')
results = pipe.execute()
```

## 事务命令

### 基本事务

```bash
# 开启事务
MULTI

# 命令入队
SET name zhangsan
INCR age
SET email zhang@example.com

# 执行事务
EXEC

# 取消事务
DISCARD
```

### 事务特性

| 特性         | 说明                                   |
| ------------ | -------------------------------------- |
| **原子性**   | 事务内命令要么全部执行，要么全部不执行 |
| **批量操作** | 一次性发送多个命令                     |
| **顺序执行** | 按入队顺序执行                         |

### 事务示例

```python
import redis

r = redis.Redis()

# 使用事务
pipe = r.pipeline()
pipe.set('name', 'zhangsan')
pipe.incr('age')
pipe.set('email', 'zhang@example.com')
results = pipe.execute()

print(results)  # [True, 1, True]
```

## WATCH 监视

### 乐观锁

```bash
WATCH name
GET name
MULTI
SET name lisi
EXEC
```

### 监视示例

```python
import redis

r = redis.Redis()

# 监视 key
r.watch('account:1', 'account:2')

# 读取当前值
balance1 = int(r.get('account:1'))
balance2 = int(r.get('account:2'))

# 开启事务
pipe = r.pipeline()
pipe.multi()
pipe.set('account:1', balance1 - 100)
pipe.set('account:2', balance2 + 100)
pipe.execute()
```

### WATCH 失败处理

```python
import redis

def transfer_with_retry(r, from_account, to_account, amount, max_retries=3):
    for i in range(max_retries):
        try:
            pipe = r.pipeline(True)
            pipe.watch(from_account, to_account)

            from_balance = int(r.get(from_account))
            to_balance = int(r.get(to_account))

            if from_balance < amount:
                raise Exception('余额不足')

            pipe.multi()
            pipe.set(from_account, from_balance - amount)
            pipe.set(to_account, to_balance + amount)
            pipe.execute()
            return True

        except redis.WatchError:
            print(f'并发冲突，重试第 {i+1} 次')
            continue

    return False
```

## 分布式锁

### 实现原理

```python
import redis
import uuid
import time

class RedisLock:
    def __init__(self, redis_client, lock_name, timeout=10):
        self.redis = redis_client
        self.lock_name = f'lock:{lock_name}'
        self.lock_value = str(uuid.uuid4())
        self.timeout = timeout

    def acquire(self):
        return self.redis.set(
            self.lock_name,
            self.lock_value,
            nx=True,
            ex=self.timeout
        )

    def release(self):
        script = """
        if redis.call('get', KEYS[1]) == ARGV[1] then
            return redis.call('del', KEYS[1])
        else
            return 0
        end
        """
        return self.redis.eval(script, 1, self.lock_name, self.lock_value)

    def extend(self):
        script = """
        if redis.call('get', KEYS[1]) == ARGV[1] then
            return redis.call('expire', KEYS[1], ARGV[2])
        else
            return 0
        end
        """
        return self.redis.eval(script, 1, self.lock_name, self.lock_value, self.timeout)
```

### 使用示例

```python
import redis

r = redis.Redis()

def transfer_money(from_id, to_id, amount):
    lock = RedisLock(r, f'account:{from_id}')

    if lock.acquire():
        try:
            from_balance = int(r.get(f'account:{from_id}'))
            to_balance = int(r.get(f'account:{to_id}'))

            if from_balance < amount:
                raise Exception('余额不足')

            r.set(f'account:{from_id}', from_balance - amount)
            r.set(f'account:{to_id}', to_balance + amount)

        finally:
            lock.release()
    else:
        raise Exception('获取锁失败')
```

### 可重入锁

```python
import redis
import uuid
import threading

class ReentrantLock:
    def __init__(self, redis_client, lock_name):
        self.redis = redis_client
        self.lock_name = f'lock:{lock_name}'
        self.thread_id = threading.get_ident()
        self.lock_value = str(uuid.uuid4())
        self.locks = {}

    def acquire(self, blocking=True, timeout=None):
        current_count = self.locks.get(self.thread_id, 0)

        if current_count > 0:
            self.locks[self.thread_id] = current_count + 1
            return True

        result = self.redis.set(
            self.lock_name,
            self.lock_value,
            nx=True,
            ex=timeout or 10
        )

        if result:
            self.locks[self.thread_id] = 1
            return True

        return False

    def release(self):
        current_count = self.locks.get(self.thread_id, 0)

        if current_count <= 0:
            return

        if current_count == 1:
            self.redis.delete(self.lock_name)
            del self.locks[self.thread_id]
        else:
            self.locks[self.thread_id] = current_count - 1
```

## Lua 脚本

### 为什么用 Lua

| 特性       | 说明                                 |
| ---------- | ------------------------------------ |
| **原子性** | Lua 脚本整体执行，不会被其他命令打断 |
| **可编程** | 支持复杂逻辑                         |
| **高性能** | Redis 内置 Lua 解释器                |

### 常用脚本

```lua
-- INCR atomically
local key = KEYS[1]
local current = redis.call('GET', key) or '0'
redis.call('SET', key, current + 1)
return current + 1
```

```lua
-- Set if not exists with expiration
local key = KEYS[1]
local value = ARGV[1]
local ttl = ARGV[2]

if redis.call('EXISTS', key) == 0 then
    redis.call('SET', key, value, 'EX', ttl)
    return 1
else
    return 0
end
```

### Python 调用 Lua

```python
# 预加载脚本
script = r.register_script("""
local current = redis.call('GET', KEYS[1])
current = current or '0'
redis.call('SET', KEYS[1], tonumber(current) + 1)
return tonumber(current) + 1
""")

result = script(keys=['counter'])
print(result)
```

## 实战场景

### 库存扣减

```python
def decrease_stock(product_id, quantity):
    lock = RedisLock(r, f'stock:{product_id}')

    if lock.acquire():
        try:
            stock_key = f'stock:{product_id}'
            current = int(r.get(stock_key) or 0)

            if current < quantity:
                return False, '库存不足'

            r.set(stock_key, current - quantity)
            return True, '扣减成功'

        finally:
            lock.release()

    return False, '系统繁忙'
```

### 秒杀系统

```lua
-- Lua 脚本实现原子扣减
local stock_key = KEYS[1]
local order_key = KEYS[2]
local user_id = ARGV[1]
local quantity = tonumber(ARGV[2])

-- 检查是否已购买
if redis.call('SISMEMBER', order_key, user_id) == 1 then
    return -1
end

-- 检查库存
local stock = tonumber(redis.call('GET', stock_key) or 0)
if stock < quantity then
    return 0
end

-- 扣减库存并记录购买
redis.call('DECRBY', stock_key, quantity)
redis.call('SADD', order_key, user_id)
return 1
```

## 小结

| 机制         | 命令/方法  | 适用场景 |
| ------------ | ---------- | -------- |
| **事务**     | MULTI/EXEC | 批量操作 |
| **监视**     | WATCH      | 乐观锁   |
| **分布式锁** | SET NX     | 并发控制 |
| **Lua 脚本** | EVAL       | 原子操作 |
| **管道**     | pipeline   | 批量优化 |
