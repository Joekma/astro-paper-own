---
title: Python 操作 RabbitMQ 与 Memcached 指南
author: Joekma
pubDatetime: 2024-08-13T00:00:00Z
slug: python-rabbitmq-memcached
modDatetime: 2026-07-11T00:00:00.000+08:00
featured: false
draft: false
tags:
  - Python
  - RabbitMQ
  - Memcached
  - docs
description: Python 操作 RabbitMQ 消息队列与 Memcached 缓存的完整指南，涵盖安装、队列模型、发布订阅等核心功能。

series: python
seriesOrder: 54
language: zh-CN
---

# Python 操作 RabbitMQ 与 Memcached 指南

## RabbitMQ：可靠投递而非无限重试

本文使用 Pika 1.4.1。生产者开启 publisher confirms，并声明持久化交换机/队列、持久化消息和 mandatory 路由；消费者只有在业务事务成功后才 ack。连接需 heartbeat、blocked connection timeout 和重连退避。

<!-- snippet: id=python-pika-reliable-publish mode=service python=3.12-3.14 deps=pika==1.4.1 service=rabbitmq -->
```python
import json
import os
import pika

parameters = pika.URLParameters(os.environ["AMQP_URL"])
parameters.heartbeat = 30
parameters.blocked_connection_timeout = 15
connection = pika.BlockingConnection(parameters)
try:
    channel = connection.channel()
    channel.queue_declare(queue="events", durable=True)
    channel.confirm_delivery()
    ok = channel.basic_publish(
        exchange="",
        routing_key="events",
        body=json.dumps({"event_id": "evt-test-1"}).encode(),
        properties=pika.BasicProperties(delivery_mode=pika.DeliveryMode.Persistent,
                                        content_type="application/json"),
        mandatory=True,
    )
    if not ok:
        raise RuntimeError("broker did not confirm message")
finally:
    connection.close()
```

消费者要限制 prefetch，校验消息大小/schema，并以 `event_id` 做数据库幂等。不可恢复错误进入死信队列；临时错误按有限次数和退避重试，禁止立即 requeue 形成热循环。关闭时停止拉取、等待在途任务、ack/nack 后关闭 channel 与 connection。

## Memcached：只存可丢失缓存

Memcached 没有可靠持久化和细粒度安全边界，只放可重建数据。键包含 schema 版本和租户边界，值限制大小并设置 TTL；缓存未命中、超时和节点驱逐都回源。不要存 Session 主副本、支付状态、锁或唯一幂等记录，也不要暴露到公网。

并发更新可使用 CAS 降低覆盖，但 CAS 失败必须重新读取并限制重试。反序列化只使用 JSON 等安全格式，不从缓存加载 pickle。测试需覆盖节点不可用、超时、缓存击穿、脏数据和优雅降级。
