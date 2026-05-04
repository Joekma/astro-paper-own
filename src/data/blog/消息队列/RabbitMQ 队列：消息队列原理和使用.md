---
title: RabbitMQ 队列：消息队列原理和使用
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-04-22T00:00:00.000+08:00
slug: rabbitmq-tutorial
description: '深入讲解RabbitMQ消息队列原理和使用方法。'
tags:
  - RabbitMQ
  - 消息队列
  - 中间件
draft: false
language: zh-CN
---

## 概述

RabbitMQ 是基于 Erlang 开发的功能完善的开源消息队列系统，采用 AMQP 协议实现。具备可靠性、灵活路由、集群、事务等特性。

## 核心概念

| 概念 | 说明 |
|------|------|
| **Producer** | 消息生产者，负责发送消息 |
| **Consumer** | 消息消费者，负责接收和处理消息 |
| **Exchange** | 交换机，接收生产者的消息并路由到队列 |
| **Queue** | 队列，存储消息的容器 |
| **Routing Key** | 路由键，决定消息路由到哪个队列 |
| **Binding** | 绑定，连接 Exchange 和 Queue 的规则 |

## 消息流转

```
Producer → Exchange → Routing Key → Queue → Consumer
```

## Exchange 类型

| 类型 | 说明 | 路由规则 |
|------|------|----------|
| **direct** | 直接交换机 | 精确匹配路由键 |
| **fanout** | 广播交换机 | 发送给所有绑定的队列 |
| **topic** | 主题交换机 | 支持通配符匹配 |
| **headers** | 头交换机 | 匹配消息头属性 |

### 直接交换机

```python
# 声明交换机
channel.exchange_declare(exchange='direct_exchange', exchange_type='direct')

# 绑定队列
channel.queue_bind(queue='hello', exchange='direct_exchange', routing_key='hello')

# 发送消息
channel.basic_publish(exchange='direct_exchange', routing_key='hello', body='Hello')
```

### 广播交换机

```python
# 声明广播交换机
channel.exchange_declare(exchange='fanout_exchange', exchange_type='fanout')

# 绑定多个队列
channel.queue_bind(queue='queue1', exchange='fanout_exchange')
channel.queue_bind(queue='queue2', exchange='fanout_exchange')

# 广播消息
channel.basic_publish(exchange='fanout_exchange', routing_key='', body='Broadcast')
```

### 主题交换机

```python
# 绑定规则
# * 匹配一个单词
# # 匹配零个或多个单词

channel.queue_bind(queue='error_queue', exchange='topic_exchange', routing_key='*.error')
channel.queue_bind(queue='log_queue', exchange='topic_exchange', routing_key='#')
```

## Python 使用示例

### 基本操作

```python
import pika

# 连接
connection = pika.BlockingConnection(pika.ConnectionParameters('localhost'))
channel = connection.channel()

# 声明队列
channel.queue_declare(queue='hello', durable=True)

# 发送消息
channel.basic_publish(
    exchange='',
    routing_key='hello',
    body='Hello World!',
    properties=pika.BasicProperties(
        delivery_mode=2,  # 持久化
    )
)

# 消费消息
def callback(ch, method, properties, body):
    print(f"Received: {body}")
    ch.basic_ack(delivery_tag=method.delivery_tag)

channel.basic_consume(queue='hello', on_message_callback=callback)
channel.start_consuming()
```

### 工作队列模式

```python
# 消费者
def callback(ch, method, properties, body):
    print(f"Processing: {body}")
    time.sleep(1)
    ch.basic_ack(delivery_tag=method.delivery_tag)

channel.basic_qos(prefetch_count=1)  # 公平调度
channel.basic_consume(queue='task_queue', on_message_callback=callback)
```

### 发布订阅模式

```python
# 订阅者 1
def callback1(ch, method, properties, body):
    print(f"Subscriber 1: {body}")

exchange = 'logs'
channel.exchange_declare(exchange=exchange, exchange_type='fanout')
result = channel.queue_declare(exclusive=True)
queue_name = result.method.queue
channel.queue_bind(exchange=exchange, queue=queue_name)
channel.basic_consume(queue=queue_name, on_message_callback=callback1)
```

## 消息确认机制

### 消费者确认

```python
# 手动确认
def callback(ch, method, properties, body):
    try:
        process(body)
        ch.basic_ack(delivery_tag=method.delivery_tag)
    except Exception as e:
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=True)
```

### 生产者确认

```python
# 开启确认模式
channel.confirm_delivery()

try:
    channel.basic_publish(
        exchange='',
        routing_key='hello',
        body='Hello',
        properties=pika.BasicProperties(delivery_mode=2),
        mandatory=True
    )
except Exception as e:
    print(f"发送失败: {e}")
```

## 远程连接配置

```python
credentials = pika.PlainCredentials('guest', 'guest')
parameters = pika.ConnectionParameters(
    host='192.168.1.100',
    port=5672,
    virtual_host='/',
    credentials=credentials,
    heartbeat=600,
    blocked_connection_timeout=300
)
connection = pika.BlockingConnection(parameters)
```

## 常用命令

```bash
# 启动管理界面
rabbitmq-plugins enable rabbitmq_management

# 用户管理
rabbitmqctl add_user admin 123456
rabbitmqctl set_permissions -p / admin ".*" ".*" ".*"

# 队列管理
rabbitmqctl list_queues
rabbitmqctl list_exchanges
rabbitmqctl list_bindings
```

## 小结

RabbitMQ 核心特点：

- **可靠消息传递**：支持持久化、确认机制
- **灵活路由**：多种交换机类型满足不同场景
- **集群高可用**：支持主从复制和镜像队列
- **易于扩展**：丰富的插件系统和客户端库