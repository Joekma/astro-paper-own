---
title: Kafka知识点整理
author: 程序员
pubDatetime: 2024-08-13T00:00:00.000+08:00
updated: 2026-04-22T00:00:00.000+08:00
slug: kafka-notes
description: 'Kafka核心概念和原理'
tags:
  - Kafka
  - 消息队列
  - 大数据
category: 消息队列
draft: false
language: zh-CN
---

## 概述

Kafka 是 LinkedIn 开源的分布式流处理平台，最初用于日志收集，现已广泛用于实时数据管道、流处理等场景。以高吞吐量、低延迟著称，适合日志收集和实时分析。

## 核心概念

| 概念 | 说明 |
|------|------|
| **Topic** | 消息主题，用于分类消息 |
| **Partition** | 分区，每个 Topic 可分为多个分区 |
| **Broker** | Kafka 服务节点 |
| **Producer** | 消息生产者 |
| **Consumer** | 消息消费者 |
| **Consumer Group** | 消费者组，多个消费者共享消费 |
| **Offset** | 消息偏移量，记录消费位置 |

## 架构图

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Producer   │     │  Producer   │     │  Consumer   │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       ▼                   ▼                   ▼
┌──────────────────────────────────────────────────┐
│                   Kafka Cluster                   │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐           │
│  │ Broker1 │  │ Broker2 │  │ Broker3 │           │
│  │ P0 P1   │  │ P2 P3   │  │ P4 P5   │           │
│  └─────────┘  └─────────┘  └─────────┘           │
└──────────────────────────────────────────────────┘
```

## Topic 与 Partition

### 分区作用

- **并行处理**：一个 Topic 可并行消费
- **水平扩展**：分区可分布在不同 Broker
- **负载均衡**：消费者自动分配分区

### 消息存储

```
Topic: my-topic (3 partitions)
├── Partition 0
│   └── [offset:0, offset:1, offset:2, ...]
├── Partition 1
│   └── [offset:0, offset:1, offset:2, ...]
└── Partition 2
    └── [offset:0, offset:1, offset:2, ...]
```

### 分区副本

```properties
# server.properties
default.replication.factor=3
min.insync.replicas=2
```

## 命令行操作

### Topic 管理

```bash
# 创建 Topic
kafka-topics.sh --create \
  --topic my-topic \
  --partitions 3 \
  --replication-factor 1 \
  --bootstrap-server localhost:9092

# 查看 Topic 列表
kafka-topics.sh --list --bootstrap-server localhost:9092

# 查看 Topic 详情
kafka-topics.sh --describe --topic my-topic --bootstrap-server localhost:9092

# 删除 Topic
kafka-topics.sh --delete --topic my-topic --bootstrap-server localhost:9092
```

### 生产消息

```bash
# 命令行生产者
kafka-console-producer.sh --topic my-topic --bootstrap-server localhost:9092

# 发送带 key 的消息
kafka-console-producer.sh --topic my-topic --property "key.separator=:" --bootstrap-server localhost:9092
```

### 消费消息

```bash
# 从头消费
kafka-console-consumer.sh --topic my-topic --from-beginning --bootstrap-server localhost:9092

# 消费最新消息
kafka-console-consumer.sh --topic my-topic --bootstrap-server localhost:9092

# 消费者组
kafka-console-consumer.sh --topic my-topic --group my-group --bootstrap-server localhost:9092
```

## Python 使用示例

### 生产者

```python
from kafka import KafkaProducer

# 创建生产者
producer = KafkaProducer(
    bootstrap_servers=['localhost:9092'],
    value_serializer=lambda v: json.dumps(v).encode('utf-8')
)

# 发送消息
future = producer.send('my-topic', {'key': 'value'})
result = future.get(timeout=10)

# 批量发送
for i in range(100):
    producer.send('my-topic', {'num': i})
producer.flush()
```

### 消费者

```python
from kafka import KafkaConsumer

# 创建消费者
consumer = KafkaConsumer(
    'my-topic',
    bootstrap_servers=['localhost:9092'],
    group_id='my-group',
    auto_offset_reset='earliest',
    enable_auto_commit=True
)

# 消费消息
for message in consumer:
    print(f"Topic: {message.topic}, "
          f"Partition: {message.partition}, "
          f"Offset: {message.offset}, "
          f"Value: {message.value}")
```

### 消费者组示例

```python
consumer = KafkaConsumer(
    'my-topic',
    bootstrap_servers=['localhost:9092'],
    group_id='processor-group',
    max_poll_records=100,
    max_poll_interval_ms=300000,
    session_timeout_ms=10000
)

while True:
    records = consumer.poll(timeout_ms=1000)
    for topic_partition, messages in records.items():
        process_batch(messages)
```

## 配置参数

### 生产者配置

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `bootstrap.servers` | Broker 地址 | - |
| `acks` | 确认数量 | 1 |
| `retries` | 重试次数 | 0 |
| `batch.size` | 批次大小 | 16384 |
| `linger.ms` | 等待时间 | 0 |
| `compression.type` | 压缩类型 | none |

### 消费者配置

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `group.id` | 消费者组 ID | - |
| `auto.offset.reset` | 消费起始位置 | latest |
| `enable.auto.commit` | 自动提交 | true |
| `auto.commit.interval.ms` | 提交间隔 | 5000 |
| `max.poll.records` | 单次最大拉取数 | 500 |

## 消息可靠性

### 生产者可靠性

```python
producer = KafkaProducer(
    bootstrap_servers=['localhost:9092'],
    acks='all',                    # 等待所有副本确认
    retries=3,                     # 重试3次
    enable_idempotence=True        # 幂等生产者
)
```

### 消费者可靠性

```python
consumer = KafkaConsumer(
    'my-topic',
    enable_auto_commit=False,      # 手动提交
    auto_offset_reset='earliest'
)

for message in consumer:
    process(message)
    consumer.commit()             # 手动提交偏移量
```

## 监控工具

```bash
# 查看消费者组
kafka-consumer-groups.sh --bootstrap-server localhost:9092 --list

# 查看消费者组详情
kafka-consumer-groups.sh --bootstrap-server localhost:9092 \
  --group my-group --describe

# 查看偏移量
kafka-consumer-groups.sh --bootstrap-server localhost:9092 \
  --group my-group --describe --topic my-topic
```

## 小结

Kafka 核心特点：

- **高吞吐量**：支持每秒百万级消息
- **低延迟**：毫秒级消息传递
- **持久化**：消息持久化存储
- **分布式**：水平扩展能力强
- **流处理**：支持流处理框架