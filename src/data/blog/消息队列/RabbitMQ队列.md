---
title: RabbitMQ队列
author: 程序员
pubDatetime: 2024-08-13T00:00:00.000+08:00
updated: 2026-04-22T00:00:00.000+08:00
slug: rabbitmq-tutorial
description: 'RabbitMQ消息队列原理和使用'
tags:
  - RabbitMQ
  - 消息队列
  - 中间件
category: 消息队列
draft: false
language: zh-CN
---

> RabbitMQ 是流行的消息队列中间件。

## 核心概念

| 概念 | 说明 |
|------|------|
| **Exchange** | 交换机 |
| **Queue** | 队列 |
| **Routing Key** | 路由键 |

## 使用示例

```python
import pika

connection = pika.BlockingConnection()
channel = connection.channel()
channel.queue_declare(queue='hello')

channel.basic_publish(exchange='', routing_key='hello', body='Hello World!')
```

## 小结

- **RabbitMQ**：可靠消息队列
- **Exchange**：消息路由
