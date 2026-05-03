---
title: Redis消息队列
author: 程序员
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-04-22T00:00:00.000+08:00
slug: redis-message-queue
featured: false
draft: false
tags:
  - Redis
  - 数据库
  - 消息队列
description: 'Redis消息队列实现，包括List队列和Pub/Sub发布订阅'
---

## 概述

Redis 提供了多种实现消息队列的方式，包括基于 List 的队列和基于 Pub/Sub 的发布订阅模式。

## 基于 List 的消息队列

### 生产者消费者模式

```python
import redis

r = redis.Redis()

# 生产者：左推入队列
def produce(queue_name, message):
    r.lpush(queue_name, message)

# 消费者：右弹出队列
def consume(queue_name):
    return r.rpop(queue_name)

# 阻塞式消费
def blocking_consume(queue_name, timeout=0):
    return r.brpop(queue_name, timeout)
```

### 命令对照

| 操作 | 命令 | 说明 |
|------|------|------|
| **入队** | LPUSH/RPUSH | 从左/右插入 |
| **出队** | LPOP/RPOP | 从左/右弹出 |
| **阻塞出队** | BRPOP/BLPOP | 阻塞等待 |
| **队列长度** | LLEN | 查看长度 |

### 示例

```bash
# 插入消息
LPUSH queue task1
LPUSH queue task2
LPUSH queue task3

# 弹出消息
RPOP queue  # task1
RPOP queue  # task2

# 阻塞等待
BRPOP queue 0  # 0 表示无限等待
```

### Python 实现

```python
import redis
import json

class MessageQueue:
    def __init__(self, redis_client, queue_name):
        self.r = redis_client
        self.queue_name = queue_name

    def enqueue(self, message):
        if isinstance(message, dict):
            message = json.dumps(message)
        self.r.lpush(self.queue_name, message)

    def dequeue(self, blocking=False, timeout=0):
        if blocking:
            result = self.r.brpop(self.queue_name, timeout)
            if result:
                _, message = result
            else:
                return None
        else:
            message = self.r.rpop(self.queue_name)

        if message and isinstance(message, bytes):
            message = message.decode()

        try:
            return json.loads(message)
        except:
            return message

    def size(self):
        return self.r.llen(self.queue_name)
```

## 基于 Pub/Sub 的消息队列

### 发布订阅模式

```python
import redis

r = redis.Redis()

# 发布者
def publish(channel, message):
    r.publish(channel, message)

# 订阅者
def subscribe(channel):
    pubsub = r.pubsub()
    pubsub.subscribe(channel)

    for message in pubsub.listen():
        if message['type'] == 'message':
            print(f"收到: {message['data']}")

# 发布消息
publish('news', '今日新闻')

# 订阅频道
subscribe('news')
```

### 模式订阅

```python
# 订阅多个频道
pubsub.subscribe('news', 'sports', 'tech')

# 模式匹配订阅
pubsub.psubscribe('news.*', 'sports.*')

# 退订
pubsub.unsubscribe('news')
pubsub.punsubscribe('news.*')
```

### Pub/Sub 命令

| 命令 | 说明 |
|------|------|
| **PUBLISH** | 发布消息 |
| **SUBSCRIBE** | 订阅频道 |
| **PSUBSCRIBE** | 模式订阅 |
| **UNSUBSCRIBE** | 退订频道 |
| **PUNSUBSCRIBE** | 退订模式 |

## 消息队列对比

| 特性 | List 队列 | Pub/Sub |
|------|-----------|---------|
| **消息持久化** | ✅ 支持 | ❌ 不支持 |
| **消息确认** | ✅ 支持 | ❌ 不支持 |
| **消息堆积** | ✅ 支持 | ❌ 不支持 |
| **模式匹配** | ❌ 不支持 | ✅ 支持 |
| **多消费者** | ❌ 不支持 | ✅ 支持 |
| **离线消息** | ❌ 不支持 | ❌ 不支持 |

## 实战：实现可靠队列

### 消息确认机制

```python
import redis
import json
import time

class ReliableQueue:
    def __init__(self, redis_client, queue_name, processing_name=None):
        self.r = redis_client
        self.queue_name = queue_name
        self.processing_name = processing_name or f'{queue_name}:processing'

    def enqueue(self, message, ttl=3600):
        if isinstance(message, dict):
            message = json.dumps(message)

        data = {
            'message': message,
            'enqueued_at': time.time()
        }
        self.r.lpush(self.queue_name, json.dumps(data))

    def dequeue(self, timeout=0):
        result = self.r.brpoplpush(
            self.queue_name,
            self.processing_name,
            timeout
        )

        if result:
            return json.loads(result)

        return None

    def acknowledge(self, message):
        self.r.lrem(self.processing_name, 1, json.dumps(message))

    def retry(self, message, delay=60):
        self.r.lrem(self.processing_name, 1, json.dumps(message))
        time.sleep(delay)
        self.enqueue(message['message'])

    def size(self):
        return self.r.llen(self.queue_name)

    def processing_size(self):
        return self.r.llen(self.processing_name)
```

### 使用示例

```python
# 创建可靠队列
queue = ReliableQueue(r, 'task_queue')

# 生产者
queue.enqueue({'task_id': 1, 'data': 'task data'})
queue.enqueue({'task_id': 2, 'data': 'task data 2'})

# 消费者
while True:
    message = queue.dequeue(timeout=5)

    if message:
        try:
            task_id = message['message']['task_id']
            print(f'处理任务: {task_id}')

            # 模拟处理
            process_task(task_id)

            # 确认完成
            queue.acknowledge(message)

        except Exception as e:
            print(f'处理失败: {e}')
            # 重新入队
            queue.retry(message, delay=10)
```

## 延时队列

### 基于 Sorted Set

```python
import redis
import json
import time

class DelayQueue:
    def __init__(self, redis_client, queue_name):
        self.r = redis_client
        self.queue_name = queue_name
        self.zset_name = f'{queue_name}:delay'

    def enqueue(self, message, delay_seconds):
        if isinstance(message, dict):
            message = json.dumps(message)

        execute_time = time.time() + delay_seconds
        self.r.zadd(self.zset_name, {message: execute_time})

    def dequeue(self):
        now = time.time()

        results = self.r.zrangebyscore(
            self.zset_name,
            0,
            now,
            start=0,
            num=1
        )

        if results:
            message = results[0]
            self.r.zrem(self.zset_name, message)

            if isinstance(message, bytes):
                message = message.decode()

            try:
                return json.loads(message)
            except:
                return message

        return None

    def size(self):
        return self.r.zcard(self.zset_name)
```

### 使用示例

```python
delay_queue = DelayQueue(r, 'delay_task')

# 发送延时消息（5秒后执行）
delay_queue.enqueue({'task': 'send_email', 'to': 'user@example.com'}, delay_seconds=5)

# 消费者轮询
while True:
    message = delay_queue.dequeue()

    if message:
        print(f'执行任务: {message}')
        execute_task(message)

    time.sleep(1)
```

## 小结

| 方案 | 适用场景 | 特点 |
|------|----------|------|
| **List 队列** | 任务队列、定时任务 | 持久化、可靠 |
| **Pub/Sub** | 实时消息、广播 | 低延迟、多订阅 |
| **Sorted Set** | 延时队列、定时任务 | 精确延时 |
| **可靠队列** | 关键任务处理 | 消息确认、重试 |