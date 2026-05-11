---
title: Python 操作 RabbitMQ 与 Memcached 指南
author: Joekma
pubDatetime: 2024-08-13T00:00:00Z
slug: python-rabbitmq-memcached
modDatetime: 2026-04-22T00:00:00Z
featured: false
draft: false
tags:
  - Python
  - RabbitMQ
  - Memcached
  - docs
description: Python 操作 RabbitMQ 消息队列与 Memcached 缓存的完整指南，涵盖安装、队列模型、发布订阅等核心功能。

series: python
language: zh-CN
---

# Python 操作 RabbitMQ 与 Memcached 指南

## 简介

`Memcached` 和 `RabbitMQ` 虽然都常出现在后端系统里，但它们解决的问题**完全不同**：

- `Memcached` 解决的是**缓存**问题
- `RabbitMQ` 解决的是**异步通信与消息分发**问题

这篇文章把两部分内容合并整理，方便你从 Python 角度快速理解它们的定位、安装方式和常见操作。

## Memcached 基础与 Python 操作

### Memcached 是什么

Memcached 是一个高性能的分布式内存对象缓存系统，经常用于降低数据库访问压力。它本质上是一个基于内存的键值存储系统，适合缓存热点数据、会话信息和部分计算结果。

它的典型收益在于：

- **减少数据库查询次数**
- **降低响应延迟**
- **提升高并发场景下的吞吐能力**

### Memcached 安装

```bash
wget http://memcached.org/latest
tar -zxvf memcached-1.x.x.tar.gz
cd memcached-1.x.x
./configure && make && make test && sudo make install
```

依赖安装示例：

```bash
# CentOS / RHEL
yum install libevent-devel

# Debian / Ubuntu
apt-get install libevent-dev
```

### 启动 Memcached

```bash
memcached -d -m 10 -u root -l 10.211.55.4 -p 12000 -c 256 -P /tmp/memcached.pid
```

参数说明：

| 参数 | 说明 |
|------|------|
| `-d` | 后台守护进程模式运行 |
| `-m` | 分配给 Memcached 的内存，单位 MB |
| `-u` | 运行用户 |
| `-l` | 监听 IP |
| `-p` | 监听端口 |
| `-c` | 最大并发连接数 |
| `-P` | 保存 pid 文件 |

### 常见命令

| 类型 | 命令 |
|------|------|
| **存储命令** | `set` / `add` / `replace` / `append` / `prepend` / `cas` |
| **获取命令** | `get` / `gets` |
| **其他命令** | `delete` / `stats` |

### Python 操作 Memcached

常见 Python 客户端是 `python-memcached`。

#### 安装

```bash
pip install python-memcached
```

#### 第一次操作

```python
import memcache

mc = memcache.Client(['10.211.55.4:12000'], debug=True)
mc.set("foo", "bar")
ret = mc.get("foo")
print(ret)
```

> **提示**：`debug=True` 适合调试阶段使用，生产环境通常应关闭。

#### 集群支持

`python-memcached` 原生支持简单的集群配置。权重越高的节点，在主机列表中命中的概率越高。

```python
import memcache

mc = memcache.Client([
    ('1.1.1.1:12000', 1),
    ('1.1.1.2:12000', 2),
    ('1.1.1.3:12000', 1),
], debug=True)

mc.set('k1', 'v1')
```

#### `add`

如果 key 已存在，`add` 不会覆盖。

```python
import memcache

mc = memcache.Client(['10.211.55.4:12000'], debug=True)
mc.add('k1', 'v1')
# mc.add('k1', 'v2')  # 对已存在的 key 重复添加会失败
```

#### `replace`

`replace` 只会修改已存在的 key。

```python
import memcache

mc = memcache.Client(['10.211.55.4:12000'], debug=True)
mc.replace('kkkk', '999')
```

#### `set` 与 `set_multi`

```python
import memcache

mc = memcache.Client(['10.211.55.4:12000'], debug=True)
mc.set('key0', 'wupeiqi')
mc.set_multi({'key1': 'val1', 'key2': 'val2'})
```

#### `delete` 与 `delete_multi`

```python
import memcache

mc = memcache.Client(['10.211.55.4:12000'], debug=True)
mc.delete('key0')
mc.delete_multi(['key1', 'key2'])
```

#### `get` 与 `get_multi`

```python
import memcache

mc = memcache.Client(['10.211.55.4:12000'], debug=True)
val = mc.get('key0')
item_dict = mc.get_multi(['key1', 'key2', 'key3'])
```

#### `append` 与 `prepend`

```python
import memcache

mc = memcache.Client(['10.211.55.4:12000'], debug=True)
mc.append('k1', 'after')
mc.prepend('k1', 'before')
```

#### `incr` 与 `decr`

```python
import memcache

mc = memcache.Client(['10.211.55.4:12000'], debug=True)
mc.set('k1', '777')

mc.incr('k1')
mc.incr('k1', 10)
mc.decr('k1')
mc.decr('k1', 10)
```

#### `gets` 与 `cas`

`gets` 与 `cas` 常用于解决并发修改导致的数据覆盖问题。

场景示例：

- 商品库存为 `900`
- 用户 A 读到 `900`
- 用户 B 也读到 `900`
- A 更新成 `899`
- B 也更新成 `899`

这样库存就会错误。为避免这种情况，可以使用 `gets + cas`。

```python
import memcache

mc = memcache.Client(['10.211.55.4:12000'], debug=True, cache_cas=True)
v = mc.gets('product_count')

# ... 业务处理

mc.cas('product_count', '899')
```

> **核心思想**：`cas` 的核心思想是：只有当数据版本没有变化时，才允许提交更新。

## RabbitMQ 基础与 Python 操作

### RabbitMQ 是什么

RabbitMQ 是一个基于 `AMQP` 协议的消息系统，适合做：

- **异步任务解耦**
- **服务间消息通信**
- **发布订阅**
- **延迟处理与削峰填谷**

它的核心对象通常包括：

| 对象 | 说明 |
|------|------|
| **Producer** | 生产者 |
| **Consumer** | 消费者 |
| **Queue** | 队列 |
| **Exchange** | 交换机 |
| **Routing Key** | 路由键 |

### RabbitMQ 安装

```bash
# 安装 epel 源
rpm -ivh http://dl.fedoraproject.org/pub/epel/6/i386/epel-release-6-8.noarch.rpm

# 安装 Erlang
yum -y install erlang

# 安装 RabbitMQ
yum -y install rabbitmq-server
```

服务启动与停止：

```bash
service rabbitmq-server start
service rabbitmq-server stop
```

### 安装 Python 客户端

常见客户端是 `pika`。

```bash
pip install pika
```

### 生产者消费者模型

下面的示例先用内存队列演示经典生产者消费者模型：

```python
#!/usr/bin/env python
# -*- coding:utf-8 -*-
import Queue
import threading

message = Queue.Queue(10)


def producer(i):
    while True:
        message.put(i)


def consumer(i):
    while True:
        msg = message.get()


for i in range(12):
    t = threading.Thread(target=producer, args=(i,))
    t.start()

for i in range(10):
    t = threading.Thread(target=consumer, args=(i,))
    t.start()
```

而在 RabbitMQ 中，消息不再存放在内存中的 `Queue` 对象里，而是由 RabbitMQ Server 统一维护。

### 最简单的队列收发

#### 生产者

```python
#!/usr/bin/env python
import pika

connection = pika.BlockingConnection(
    pika.ConnectionParameters(host='localhost')
)
channel = connection.channel()

channel.queue_declare(queue='hello')

channel.basic_publish(
    exchange='',
    routing_key='hello',
    body='Hello World!'
)
print(" [x] Sent 'Hello World!'")
connection.close()
```

#### 消费者

```python
#!/usr/bin/env python
import pika

connection = pika.BlockingConnection(
    pika.ConnectionParameters(host='localhost')
)
channel = connection.channel()

channel.queue_declare(queue='hello')


def callback(ch, method, properties, body):
    print(" [x] Received %r" % body)


channel.basic_consume(callback, queue='hello', no_ack=True)

print(' [*] Waiting for messages. To exit press CTRL+C')
channel.start_consuming()
```

### acknowledgment：保证消息不丢

当 `no_ack=False` 时，消费者处理完消息后需要显式确认。

如果消费者异常断开，RabbitMQ 可以把任务重新投递。

```python
import pika
import time

connection = pika.BlockingConnection(
    pika.ConnectionParameters(host='10.211.55.4')
)
channel = connection.channel()

channel.queue_declare(queue='hello')


def callback(ch, method, properties, body):
    print(" [x] Received %r" % body)
    time.sleep(10)
    print('ok')
    ch.basic_ack(delivery_tag=method.delivery_tag)


channel.basic_consume(callback, queue='hello', no_ack=False)

print(' [*] Waiting for messages. To exit press CTRL+C')
channel.start_consuming()
```

### durable：保证消息持久化

为了让 RabbitMQ 重启后队列和消息尽可能保留，需要同时设置：

- 队列 `durable=True`
- 消息 `delivery_mode=2`

#### 持久化生产者

```python
#!/usr/bin/env python
import pika

connection = pika.BlockingConnection(
    pika.ConnectionParameters(host='10.211.55.4')
)
channel = connection.channel()

channel.queue_declare(queue='hello', durable=True)

channel.basic_publish(
    exchange='',
    routing_key='hello',
    body='Hello World!',
    properties=pika.BasicProperties(delivery_mode=2),
)
print(" [x] Sent 'Hello World!'")
connection.close()
```

#### 持久化消费者

```python
#!/usr/bin/env python
# -*- coding:utf-8 -*-
import pika
import time

connection = pika.BlockingConnection(
    pika.ConnectionParameters(host='10.211.55.4')
)
channel = connection.channel()

channel.queue_declare(queue='hello', durable=True)


def callback(ch, method, properties, body):
    print(" [x] Received %r" % body)
    time.sleep(10)
    print('ok')
    ch.basic_ack(delivery_tag=method.delivery_tag)


channel.basic_consume(callback, queue='hello', no_ack=False)

print(' [*] Waiting for messages. To exit press CTRL+C')
channel.start_consuming()
```

### `basic_qos`：控制公平分发

默认情况下，消息分发可能不是完全公平的。设置 `prefetch_count=1` 后，可以让 RabbitMQ 更倾向于"谁处理完谁继续拿"。

```python
#!/usr/bin/env python
# -*- coding:utf-8 -*-
import pika
import time

connection = pika.BlockingConnection(
    pika.ConnectionParameters(host='10.211.55.4')
)
channel = connection.channel()

channel.queue_declare(queue='hello')


def callback(ch, method, properties, body):
    print(" [x] Received %r" % body)
    time.sleep(10)
    print('ok')
    ch.basic_ack(delivery_tag=method.delivery_tag)


channel.basic_qos(prefetch_count=1)
channel.basic_consume(callback, queue='hello', no_ack=False)

print(' [*] Waiting for messages. To exit press CTRL+C')
channel.start_consuming()
```

### 发布订阅模式

发布订阅的核心特点是：消息会广播给所有订阅者，而不是被某个消费者独占消费。

这种模式通常使用：

- `exchange type = fanout`

#### 发布者

```python
#!/usr/bin/env python
import pika
import sys

connection = pika.BlockingConnection(
    pika.ConnectionParameters(host='localhost')
)
channel = connection.channel()

channel.exchange_declare(exchange='logs', type='fanout')

message = ' '.join(sys.argv[1:]) or "info: Hello World!"
channel.basic_publish(exchange='logs', routing_key='', body=message)
print(" [x] Sent %r" % message)
connection.close()
```

#### 订阅者

```python
#!/usr/bin/env python
import pika

connection = pika.BlockingConnection(
    pika.ConnectionParameters(host='localhost')
)
channel = connection.channel()

channel.exchange_declare(exchange='logs', type='fanout')

result = channel.queue_declare(exclusive=True)
queue_name = result.method.queue

channel.bind_queue(exchange='logs', queue=queue_name)

print(' [*] Waiting for logs. To exit press CTRL+C')


def callback(ch, method, properties, body):
    print(" [x] %r" % body)


channel.basic_consume(callback, queue=queue_name, no_ack=True)

channel.start_consuming()
```

### Exchange 类型详解

RabbitMQ 支持多种 Exchange 类型，每种类型有不同的消息路由规则：

| 类型 | 说明 | 路由规则 |
|------|------|----------|
| **direct** | 精确匹配 | 消息路由到 Binding Key 与 Routing Key 完全匹配的队列 |
| **fanout** | 广播 | 消息路由到所有绑定的队列，无视 Routing Key |
| **topic** | 通配符匹配 | 支持 `*` 和 `#` 的模式匹配 |
| **headers** | 头信息匹配 | 根据消息头部的属性进行匹配 |

### 完整示例：任务队列

#### 生产者

```python
#!/usr/bin/env python
import pika
import json

connection = pika.BlockingConnection(
    pika.ConnectionParameters(host='localhost')
)
channel = connection.channel()

channel.queue_declare(queue='task_queue', durable=True)

message = json.dumps({
    'task_id': 1,
    'data': 'some task data'
})

channel.basic_publish(
    exchange='',
    routing_key='task_queue',
    body=message,
    properties=pika.BasicProperties(
        delivery_mode=2,  # 持久化
    )
)

print(" [x] Sent task")
connection.close()
```

#### 消费者

```python
#!/usr/bin/env python
import pika
import json
import time

connection = pika.BlockingConnection(
    pika.ConnectionParameters(host='localhost')
)
channel = connection.channel()

channel.queue_declare(queue='task_queue', durable=True)

channel.basic_qos(prefetch_count=1)


def callback(ch, method, properties, body):
    task = json.loads(body)
    print(f" [x] Received task: {task}")

    # 模拟处理任务
    time.sleep(2)
    print(" [x] Task completed")

    ch.basic_ack(delivery_tag=method.delivery_tag)


channel.basic_consume(callback, queue='task_queue')

print(' [*] Waiting for tasks. To exit press CTRL+C')
channel.start_consuming()
```

## 总结对比

### Memcached vs RabbitMQ

| 特性 | Memcached | RabbitMQ |
|------|-----------|----------|
| **定位** | 缓存系统 | 消息队列 |
| **数据存储** | 内存 | 内存+磁盘 |
| **数据模型** | 键值对 | 生产者-交换机-队列-消费者 |
| **典型用途** | 缓存热点数据、会话信息 | 异步通信、任务队列、发布订阅 |
| **可靠性** | 无持久化保证 | 支持消息持久化、确认机制 |
| **数据处理** | 被动获取 | 主动推送 |

### 使用场景建议

**选择 Memcached**：

- 需要缓存数据库查询结果
- 缓存会话信息和用户数据
- 需要高性能的键值读取
- 数据可以丢失的场景

**选择 RabbitMQ**：

- 需要异步处理任务
- 需要可靠的消息传递
- 需要发布订阅功能
- 需要负载均衡和故障转移

---
