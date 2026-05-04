---
title: Go Kafka消息队列：生产者、消费者、分区、偏移量实战
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-05-03T00:00:00.000+08:00
slug: golang-use-kafka
description: '详细讲解Go集成Kafka，包括Kafka生产者API、消费者API、分区策略、偏移量管理、消费者组、消息可靠性保证（acks、retries）、并发消费和性能优化，包含完整项目代码示例。'
tags:
  - Go
  - Kafka
  - 消息队列
  - MQ
  - 分布式
  - 消息中间件
  - 消费者组
draft: false
language: zh-CN
---

## Kafka 简介

Apache Kafka 是分布式流处理平台，用于实时处理海量数据。

### 核心概念

| 概念 | 说明 |
|------|------|
| **Topic** | 消息的分类单元 |
| **Producer** | 生产者，负责发送消息 |
| **Consumer** | 消费者，读取消息 |
| **Broker** | Kafka 服务器 |
| **Partition** | Topic 的物理分区 |

## 安装 Sarama

```bash
go get github.com/Shopify/sarama
```

## 生产者

### 同步生产者

```go
package main

import (
    "fmt"
    "log"

    "github.com/Shopify/sarama"
)

func main() {
    brokers := []string{"localhost:9092"}
    config := sarama.NewConfig()
    config.Producer.Return.Successes = true
    config.Producer.RequiredAcks = sarama.WaitForAll

    producer, err := sarama.NewSyncProducer(brokers, config)
    if err != nil {
        log.Fatal(err)
    }
    defer producer.Close()

    msg := &sarama.ProducerMessage{
        Topic: "user-events",
        Key:   sarama.StringEncoder("user-1001"),
        Value: sarama.StringEncoder("用户注册事件"),
    }

    partition, offset, err := producer.SendMessage(msg)
    if err != nil {
        log.Fatal(err)
    }

    fmt.Printf("消息发送成功 - 分区: %d, 偏移量: %d\n", partition, offset)
}
```

### 异步生产者

```go
func main() {
    config := sarama.NewConfig()
    config.Producer.Return.Successes = true
    config.Producer.Return.Errors = true

    producer, err := sarama.NewAsyncProducer([]string{"localhost:9092"}, config)
    if err != nil {
        log.Fatal(err)
    }
    defer producer.AsyncClose()

    var wg sync.WaitGroup
    wg.Add(2)

    go func() {
        defer wg.Done()
        for success := range producer.Successes() {
            fmt.Printf("发送成功: 分区=%d, 偏移=%d\n",
                success.Partition, success.Offset)
        }
    }()

    go func() {
        defer wg.Done()
        for err := range producer.Errors() {
            fmt.Printf("发送失败: %v\n", err)
        }
    }()

    for i := 0; i < 10; i++ {
        producer.Input() <- &sarama.ProducerMessage{
            Topic: "async-messages",
            Value: sarama.StringEncoder(fmt.Sprintf("消息 #%d", i)),
        }
    }

    producer.AsyncClose()
    wg.Wait()
}
```

## 消费者

### 消费者组

```go
func main() {
    brokers := []string{"localhost:9092"}
    topic := "user-events"
    group := "my-consumer-group"

    config := sarama.NewConfig()
    consumer, err := sarama.NewConsumerGroup(brokers, group, config)
    if err != nil {
        log.Fatal(err)
    }
    defer consumer.Close()

    ctx := context.Background()
    handler := &consumerGroupHandler{}

    for {
        if err := consumer.Consume(ctx, []string{topic}, handler); err != nil {
            log.Fatal(err)
        }
    }
}

type consumerGroupHandler struct{}

func (h *consumerGroupHandler) Setup(sarama.ConsumerGroupSession) error   { return nil }
func (h *consumerGroupHandler) Cleanup(sarama.ConsumerGroupSession) error { return nil }

func (h *consumerGroupHandler) ConsumeClaim(session sarama.ConsumerGroupSession, claim sarama.ConsumerGroupClaim) error {
    for msg := range claim.Messages() {
        fmt.Printf("收到消息: 主题=%s, 分区=%d, 偏移=%d, 值=%s\n",
            msg.Topic, msg.Partition, msg.Offset, string(msg.Value))
        session.MarkMessage(msg, "")
    }
    return nil
}
```