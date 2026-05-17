---
title: Go Kafka消息队列：生产者、消费者、分区、偏移量实战
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-05-03T00:00:00.000+08:00
slug: golang-use-kafka
description: '详细讲解 Go 集成 Kafka，包括 IBM Sarama 生产者、消费者组、分区、偏移量提交、可靠性参数、context 取消和常见实践。'
tags:
  - Go
  - Kafka
  - 消息队列
  - MQ
  - 分布式
  - 消息中间件
  - 消费者组
draft: false
series: go
language: zh-CN
---

## Kafka 核心概念

| 概念 | 说明 |
|------|------|
| Topic | 消息主题，逻辑分类 |
| Partition | Topic 的分区，是并行和顺序性的基本单位 |
| Producer | 生产者，负责写入消息 |
| Consumer | 消费者，负责读取消息 |
| Consumer Group | 消费者组，同组内每个分区通常只由一个消费者消费 |
| Offset | 消费者在分区中的消费位置 |

Kafka 适合事件流、异步解耦、日志管道等场景。

---

## 安装 Sarama

Sarama 当前推荐使用 IBM 维护的模块路径。

```bash
go get github.com/IBM/sarama
```

---

## 同步生产者

```go
package main

import (
    "fmt"
    "log"

    "github.com/IBM/sarama"
)

func main() {
    config := sarama.NewConfig()
    config.Version = sarama.V3_6_0_0

    // 同步生产者必须开启成功返回，否则 SendMessage 无法拿到 partition/offset
    config.Producer.Return.Successes = true
    config.Producer.RequiredAcks = sarama.WaitForAll
    config.Producer.Retry.Max = 3

    producer, err := sarama.NewSyncProducer([]string{"localhost:9092"}, config)
    if err != nil {
        log.Fatal(err)
    }
    defer producer.Close()

    msg := &sarama.ProducerMessage{
        Topic: "user-events",
        Key:   sarama.StringEncoder("user-1001"), // 相同 key 通常进入同一分区
        Value: sarama.StringEncoder(`{"type":"registered","user_id":"1001"}`),
    }

    partition, offset, err := producer.SendMessage(msg)
    if err != nil {
        log.Fatal(err)
    }

    fmt.Printf("sent partition=%d offset=%d\n", partition, offset)
}
```

`RequiredAcks = WaitForAll` 可靠性更高，但延迟也更高。

---

## 异步生产者

```go
func runAsyncProducer(ctx context.Context, brokers []string) error {
    config := sarama.NewConfig()
    config.Producer.Return.Successes = true
    config.Producer.Return.Errors = true

    producer, err := sarama.NewAsyncProducer(brokers, config)
    if err != nil {
        return err
    }
    defer producer.AsyncClose()

    go func() {
        for success := range producer.Successes() {
            log.Printf("sent partition=%d offset=%d", success.Partition, success.Offset)
        }
    }()

    go func() {
        for err := range producer.Errors() {
            log.Printf("send failed: %v", err)
        }
    }()

    for i := 0; i < 10; i++ {
        msg := &sarama.ProducerMessage{
            Topic: "async-events",
            Value: sarama.StringEncoder(fmt.Sprintf("message-%d", i)),
        }

        select {
        case producer.Input() <- msg:
        case <-ctx.Done():
            return ctx.Err()
        }
    }
    return nil
}
```

异步生产者必须持续消费 `Successes()` 和 `Errors()`，否则内部通道可能阻塞。

---

## 消费者组

```go
type consumerGroupHandler struct{}

func (h consumerGroupHandler) Setup(sarama.ConsumerGroupSession) error {
    return nil
}

func (h consumerGroupHandler) Cleanup(sarama.ConsumerGroupSession) error {
    return nil
}

func (h consumerGroupHandler) ConsumeClaim(session sarama.ConsumerGroupSession, claim sarama.ConsumerGroupClaim) error {
    for {
        select {
        case msg, ok := <-claim.Messages():
            if !ok {
                return nil
            }

            log.Printf("topic=%s partition=%d offset=%d value=%s",
                msg.Topic, msg.Partition, msg.Offset, string(msg.Value))

            // 业务处理成功后再标记消息，避免失败消息被提前提交
            session.MarkMessage(msg, "")

        case <-session.Context().Done():
            return session.Context().Err()
        }
    }
}
```

启动消费者组：

```go
func consume(ctx context.Context, brokers []string, group string, topics []string) error {
    config := sarama.NewConfig()
    config.Version = sarama.V3_6_0_0
    config.Consumer.Group.Rebalance.Strategy = sarama.NewBalanceStrategyRange()
    config.Consumer.Offsets.Initial = sarama.OffsetOldest

    consumer, err := sarama.NewConsumerGroup(brokers, group, config)
    if err != nil {
        return err
    }
    defer consumer.Close()

    handler := consumerGroupHandler{}

    for {
        if err := consumer.Consume(ctx, topics, handler); err != nil {
            return err
        }

        if ctx.Err() != nil {
            return ctx.Err()
        }
    }
}
```

`Consume` 会在 rebalance 后返回，通常要放在循环里重新调用。

---

## 分区与顺序性

Kafka 只保证同一分区内消息有序，不保证整个 Topic 全局有序。

- 同一个业务实体需要保持顺序时，使用稳定 key，例如 `order_id`。
- 分区数越多，并行能力越强，但顺序范围越小。
- 扩容分区可能改变 key 到分区的映射，要谨慎规划。

---

## 偏移量提交

消费者组依靠 offset 记录消费进度。通常流程是：

1. 拉取消息。
2. 执行业务处理。
3. 处理成功后标记消息。
4. 由客户端按策略提交 offset。

如果先提交 offset 再处理业务，进程崩溃时可能丢消息。如果处理成功但提交失败，消息可能被重复消费。

因此 Kafka 消费端业务要按“至少一次”语义设计，保证幂等。

---

## 可靠性参数

| 参数 | 建议 |
|------|------|
| `RequiredAcks` | 重要消息使用 `WaitForAll` |
| `Retry.Max` | 设置合理重试次数 |
| `Producer.Idempotent` | 对顺序和重复敏感时评估幂等生产者 |
| `Consumer.Offsets.Initial` | 新消费者组从最早还是最新 offset 开始 |

---

## 小结

1. Sarama 推荐使用 `github.com/IBM/sarama`。
2. 生产端关注 ack、重试、错误通道和 key 分区。
3. 消费端关注消费者组、rebalance、offset 和幂等处理。
4. Kafka 保证分区内有序，不保证 Topic 全局有序。
5. 真实业务通常按“至少一次”消费设计。
