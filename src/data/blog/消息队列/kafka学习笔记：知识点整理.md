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

> Kafka 是高吞吐量分布式消息队列。

## 核心概念

| 概念 | 说明 |
|------|------|
| **Topic** | 消息主题 |
| **Partition** | 分区存储 |
| **Consumer Group** | 消费者组 |

## 使用示例

```bash
# 创建 Topic
kafka-topics.sh --create --topic my-topic

# 生产消息
kafka-console-producer.sh --topic my-topic

# 消费消息
kafka-console-consumer.sh --topic my-topic
```

## 小结

- **Kafka**：高吞吐日志系统
- **Partition**：数据分片
