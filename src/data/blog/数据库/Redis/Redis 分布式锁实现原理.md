---
title: Redis 分布式锁实现原理
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-04-22T00:00:00.000+08:00
slug: redis-distributed-lock
description: "深入讲解Redis实现分布式锁的原理和代码实现。"
tags:
  - Redis
  - 分布式锁
  - 并发
draft: false
series: Redis
seriesOrder: 1
language: zh-CN
---

## 概述

分布式锁用于在分布式系统中协调多进程/多节点的并发访问，确保同一时刻只有一个节点能执行关键操作。

## 为什么需要分布式锁

### 单机锁的问题

```python
import threading

lock = threading.Lock()

def critical_section():
    with lock:
        # 关键操作
        pass

# 单机有效，分布式无效
```

### 分布式场景

```
┌─────────┐    ┌─────────┐    ┌─────────┐
│ Server1 │    │ Server2 │    │ Server3 │
└────┬────┘    └────┬────┘    └────┬────┘
     │              │              │
     └──────────────┼──────────────┘
                    ▼
               ┌────────┐
               │  Redis │
               └────────┘
```

单机锁无法控制跨服务器的并发访问。

## Redis 实现分布式锁

### 基本实现

```python
import redis
import time
import uuid

class RedisLock:
    def __init__(self, redis_client):
        self.redis = redis_client
        self.lock_key = None
        self.lock_value = None

    def acquire(self, key, timeout=10, retry=3):
        self.lock_key = f'lock:{key}'
        self.lock_value = str(uuid.uuid4())

        for _ in range(retry):
            # SET NX EX 原子操作
            if self.redis.set(
                self.lock_key,
                self.lock_value,
                nx=True,
                ex=timeout
            ):
                return True
            time.sleep(0.1)
        return False

    def release(self):
        if self.lock_key and self.lock_value:
            # Lua 脚本保证原子性
            script = """
            if redis.call('get', KEYS[1]) == ARGV[1] then
                return redis.call('del', KEYS[1])
            else
                return 0
            end
            """
            self.redis.eval(script, 1, self.lock_key, self.lock_value)

    def __enter__(self):
        if not self.acquire(self.key):
            raise Exception('获取锁失败')
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.release()
        return False
```

### 使用示例

```python
def order_payment(order_id):
    lock = RedisLock(redis_client)

    if lock.acquire(f'order:{order_id}', timeout=30):
        try:
            # 关键操作：检查支付状态
            if is_already_paid(order_id):
                return '已支付'

            # 执行支付
            do_payment(order_id)
            return '支付成功'
        finally:
            lock.release()
    else:
        return '系统繁忙，请重试'
```

### 上下文管理器版本

```python
from contextlib import contextmanager

@contextmanager
def redis_lock(redis_client, key, timeout=10):
    lock_key = f'lock:{key}'
    lock_value = str(uuid.uuid4())

    acquired = redis_client.set(lock_key, lock_value, nx=True, ex=timeout)
    if not acquired:
        raise Exception(f'获取锁失败: {key}')

    try:
        yield
    finally:
        script = """
        if redis.call('get', KEYS[1]) == ARGV[1] then
            return redis.call('del', KEYS[1])
        end
        """
        redis_client.eval(script, 1, lock_key, lock_value)

# 使用
try:
    with redis_lock(redis_client, 'order:12345', timeout=30):
        process_order()
except Exception as e:
    print(f'获取锁失败: {e}')
```

## Redlock 算法

Redlock 通过多个 Redis 节点提高可靠性：

```python
import redis
import time

class Redlock:
    def __init__(self, redis_clients):
        self.clock_offset = None
        self.clock_drift_factor = 0.01
        self.quorum = len(redis_clients) // 2 + 1
        self.clients = redis_clients

    def lock(self, resource, ttl=10000):
        self.lock_value = str(uuid.uuid4())
        ttl_ms = ttl * 1000

        start_time = time.time()

        # 向所有节点获取锁
        acquired = 0
        for client in self.clients:
            if self._acquire_lock(client, resource, ttl):
                acquired += 1

        # 计算有效时间
        elapsed = (time.time() - start_time) * 1000
        validity = ttl_ms - elapsed - (elapsed * self.clock_drift_factor)

        if acquired >= self.quorum and validity > 0:
            return {
                'resource': resource,
                'value': self.lock_value,
                'validity': validity,
                'quorum': acquired
            }

        # 释放所有锁
        self.unlock(resource)
        return None

    def _acquire_lock(self, client, resource, ttl):
        return client.set(
            f'lock:{resource}',
            self.lock_value,
            nx=True,
            ex=ttl // 1000
        )

    def unlock(self, resource):
        for client in self.clients:
            script = """
            if redis.call('get', KEYS[1]) == ARGV[1] then
                return redis.call('del', KEYS[1])
            end
            """
            client.eval(script, 1, f'lock:{resource}', self.lock_value)
```

## 常见问题

### 问题一：锁续期

```python
import threading

class LockWithRenew:
    def __init__(self, redis_client, key, ttl=30):
        self.redis = redis_client
        self.key = f'lock:{key}'
        self.value = str(uuid.uuid4())
        self.ttl = ttl
        self.renew_task = None

    def acquire(self):
        if not self.redis.set(self.key, self.value, nx=True, ex=self.ttl):
            return False

        # 启动续期线程
        self.renew_task = threading.Thread(target=self._renew_loop)
        self.renew_task.daemon = True
        self.renew_task.start()
        return True

    def _renew_loop(self):
        while True:
            time.sleep(self.ttl // 2)
            # 续期
            if not self.redis.set(self.key, self.value, xx=True, ex=self.ttl):
                break

    def release(self):
        if self.renew_task:
            self.renew_task.cancel()
        script = """
        if redis.call('get', KEYS[1]) == ARGV[1] then
            return redis.call('del', KEYS[1])
        end
        """
        self.redis.eval(script, 1, self.key, self.value)
```

### 问题二：可重入锁

```python
class ReentrantLock:
    def __init__(self, redis_client):
        self.redis = redis_client
        self.locks = {}  # thread_id -> (count, value)

    def acquire(self, key, timeout=10):
        import threading
        thread_id = threading.get_ident()
        lock_key = f'lock:{key}'

        if thread_id in self.locks:
            count, value = self.locks[thread_id]
            self.locks[thread_id] = (count + 1, value)
            return True

        value = str(uuid.uuid4())
        if self.redis.set(lock_key, value, nx=True, ex=timeout):
            self.locks[thread_id] = (1, value)
            return True
        return False

    def release(self, key):
        import threading
        thread_id = threading.get_ident()
        lock_key = f'lock:{key}'

        if thread_id not in self.locks:
            return

        count, value = self.locks[thread_id]
        if count == 1:
            script = """
            if redis.call('get', KEYS[1]) == ARGV[1] then
                return redis.call('del', KEYS[1])
            end
            """
            self.redis.eval(script, 1, lock_key, value)
            del self.locks[thread_id]
        else:
            self.locks[thread_id] = (count - 1, value)
```

### 问题三：锁超时

```python
def safe_increment(key):
    lock_key = f'lock:counter:{key}'

    while True:
        # 尝试获取锁，设置较短超时
        acquired = redis.set(lock_key, '1', nx=True, ex=3)
        if not acquired:
            time.sleep(0.1)
            continue

        try:
            # 快速完成操作
            value = redis.get(key)
            new_value = int(value or 0) + 1
            redis.set(key, new_value)
            break
        finally:
            redis.delete(lock_key)
```

## 分布式锁最佳实践

### 使用建议

1. **设置合理超时时间**：避免死锁
2. **使用唯一标识**：Lua 脚本安全释放
3. **锁续期机制**：长任务需要续期
4. **异常处理**：确保锁能释放
5. **监控告警**：监控锁等待时间

### 不适合场景

- 性能要求极高的场景（可考虑 localcache）
- 需要等待锁释放的场景（考虑消息队列）

## 替代方案

### Zookeeper 分布式锁

```python
from kazoo.client import KazooClient

class ZKLock:
    def __init__(self, hosts):
        self.client = KazooClient(hosts=hosts)
        self.client.start()
        self.lock = None

    def acquire(self, path):
        self.lock = self.client.Lock(path)
        return self.lock.acquire(blocking=True)

    def release(self):
        if self.lock:
            self.lock.release()

    def close(self):
        self.client.stop()
```

### 数据库乐观锁

```sql
UPDATE inventory
SET count = count - 1, version = version + 1
WHERE product_id = ? AND version = ? AND count > 0
```

## 小结

Redis 分布式锁要点：

- **SET NX EX**：原子性获取锁
- **唯一标识**：防止误删他人锁
- **Lua 脚本**：安全的释放操作
- **超时设置**：防止死锁
- **续期机制**：长任务处理
- **Redlock**：多节点提高可靠性
