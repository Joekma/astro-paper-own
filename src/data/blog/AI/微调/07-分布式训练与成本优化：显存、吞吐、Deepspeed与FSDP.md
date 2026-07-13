---
title: 分布式训练与成本优化：显存、吞吐、Deepspeed与FSDP
author: Joekma
pubDatetime: 2026-06-26T00:00:00.000+08:00
modDatetime: 2026-07-12T00:00:00.000+08:00
description: "讲解大模型微调中的显存构成、吞吐指标、梯度累积、checkpoint、DeepSpeed ZeRO、FSDP 和成本优化策略。"
tags:
  - AI
  - LLM
  - DeepSpeed
  - FSDP
  - 分布式训练
draft: false
series: 大模型微调
seriesOrder: 7
language: zh-CN
---

## 概述

分布式训练不是“多加几张卡”这么简单。它要同时处理显存、吞吐、通信、失败重跑和成本控制。微调项目真正昂贵的地方，往往不是一次成功训练，而是多次失败实验和不可复现的调参。

![拆分权重、梯度、优化器、激活与临时项](./images/fine-tuning-07-memory-stack-figure-01.png)

![按参数量估算静态显存](./images/fine-tuning-07-memory-formula-figure-02.png)

![区分 step time、有效 tokens/s、利用率与 padding](./images/fine-tuning-07-throughput-metrics-figure-03.png)

![理解以重计算换激活显存](./images/fine-tuning-07-checkpointing-tradeoff-figure-04.png)

![展示 padding 节省与样例边界风险](./images/fine-tuning-07-packing-boundary-figure-05.png)

![比较 ZeRO-1/2/3 分片对象](./images/fine-tuning-07-zero-stages-figure-06.png)

![展示参数分片、all-gather 与 reshard](./images/fine-tuning-07-fsdp-allgather-figure-07.png)

![区分 FSDP1 与 FSDP2 接口和 checkpoint](./images/fine-tuning-07-fsdp1-fsdp2-figure-08.png)

![按 OOM 阶段选择处理方法](./images/fine-tuning-07-oom-decision-tree-figure-09.png)

![从冒烟到全量逐级控制成本](./images/fine-tuning-07-cost-experiment-ladder-figure-10.png)

### 前置知识与学习目标

你应理解 batch、梯度和优化器。学完后，应能估算主要显存项，区分“模型放得下”和“训练吞吐高”，并根据瓶颈选择 LoRA、checkpointing、ZeRO 或 FSDP。

## 核心概念

### 显存主要花在哪里

训练时显存通常来自：

| 部分       | 说明                  | 优化方式                      |
| ---------- | --------------------- | ----------------------------- |
| 模型参数   | 基座模型权重          | 量化、LoRA、FSDP              |
| 梯度       | 反向传播保存的梯度    | ZeRO、梯度检查点              |
| 优化器状态 | Adam 的一阶和二阶动量 | ZeRO、8-bit optimizer         |
| 激活值     | 前向计算中间结果      | gradient checkpointing        |
| batch 数据 | token、mask、labels   | 控制 max length 和 batch size |

对包含 `N` 个参数的全参数 AdamW 训练，可先用下面的粗略模型建立量级直觉：

```text
模型权重 ≈ N × weight_bytes
梯度     ≈ N × grad_bytes
优化器   ≈ N × 2 × state_bytes
激活     ≈ 与 B、T、层数、隐藏维度和 checkpoint 策略相关
```

这不是精确显存公式：混合精度主权重、量化元数据、allocator 碎片、通信 bucket 和临时 kernel buffer 都会改变峰值。规划后必须用目标硬件上的峰值监控校准。

### 吞吐指标

训练效率不要只看“跑得动”，还要看：

```text
tokens_per_second = 训练 token 数 / 训练时间
gpu_utilization = GPU 实际计算利用率
step_time = 每个训练 step 耗时
padding_ratio = padding token / 全部 token
cost_per_million_tokens = GPU 小时成本 / 有效训练 token × 1,000,000
```

一个显存刚好跑满但吞吐很低的配置，可能并不便宜。

## 优化策略

### 1. 梯度累积

小显存机器可以用小 batch 多次累积梯度。

```python
effective_batch_size = (
    per_device_train_batch_size
    * gradient_accumulation_steps
    * num_gpus
)

print(effective_batch_size)
```

### 2. Gradient Checkpointing

梯度检查点会少保存一部分激活值，反向传播时重新计算，以时间换显存。

```python
model.gradient_checkpointing_enable()
```

适合：

- 序列长度较长。
- 显存不足。
- 可以接受训练速度下降。

### 3. 数据 Packing

短样例很多时，如果每条样例单独 padding，会浪费大量 token。packing 会把多个短样例拼到一个序列里。

```text
不 packing：
[短样例 + padding]
[短样例 + padding]

packing：
[短样例 + eos + 短样例 + eos + 短样例]
```

注意：packing 要确保样例边界清楚，避免不同对话互相污染。

只有 EOS 并不总能阻止跨样例注意力。应确认 trainer 的 packing 实现是否提供边界隔离，或明确接受“可跨样例读取”的语义；同时验证 assistant loss mask 没有跨样例错位。吞吐提升必须和评估结果一起验收。

### 4. DeepSpeed ZeRO

DeepSpeed ZeRO 会把优化器状态、梯度和参数切分到不同 GPU 上。

ZeRO 阶段：

| 阶段   | 切分内容                 | 显存收益 |
| ------ | ------------------------ | -------- |
| ZeRO-1 | 优化器状态               | 中       |
| ZeRO-2 | 优化器状态 + 梯度        | 高       |
| ZeRO-3 | 优化器状态 + 梯度 + 参数 | 更高     |

示例配置：

```json
{
  "bf16": { "enabled": true },
  "zero_optimization": {
    "stage": 2,
    "overlap_comm": true,
    "contiguous_gradients": true
  },
  "gradient_accumulation_steps": 8,
  "train_micro_batch_size_per_gpu": 1
}
```

### 5. FSDP

FSDP（Fully Sharded Data Parallel）是 PyTorch 原生的全分片数据并行方案，适合希望减少外部依赖、深度使用 PyTorch 生态的团队。

典型思路：

```text
每张 GPU 只保存部分参数
前向和反向时按需 all-gather
计算完成后释放临时完整参数
```

当前 PyTorch 同时存在经典 `FullyShardedDataParallel`（FSDP1）和基于 `fully_shard`、DTensor 的 FSDP2。新项目应根据所用 PyTorch、Transformers/Accelerate 版本选择并锁定一种实现，不能混用两套 checkpoint 与配置说明。

## 优化顺序与故障树

1. 先降低 `per_device_train_batch_size`，确认不是单纯 batch 过大。
2. 检查长度分布、padding 与异常超长样例，再调整 `max_length` 或 packing。
3. 开启 BF16/FP16、gradient checkpointing，并测量吞吐损失。
4. 若只需适配任务，优先 LoRA/QLoRA，而不是直接分片全参数训练。
5. 单机多卡先验证 DDP；确因模型/状态放不下再引入 ZeRO/FSDP。
6. OOM 若发生在保存或评估阶段，要检查权重聚合、生成长度和 all-gather，而不是只调训练 batch。

分布式正确性还要求每个 rank 看到预期数据分片、梯度同步步数一致、保存仅由正确进程协调，并能从分片 checkpoint 恢复。

## 成本控制方法

### 小步实验

不要一开始就全量训练。推荐顺序：

```text
100 条样例验证格式
  ↓
1000 条样例验证趋势
  ↓
完整训练集跑正式实验
```

### 固定实验矩阵

| 实验      | 数据     | 方法       | 目标         |
| --------- | -------- | ---------- | ------------ |
| baseline  | 无微调   | 基座模型   | 评估原始能力 |
| sft-small | 1k 样例  | LoRA       | 验证方向     |
| sft-full  | 全量     | LoRA/QLoRA | 比较业务指标 |
| align     | 偏好数据 | DPO/ORPO   | 优化答案偏好 |

## 常见问题

### GPU 越多越快吗？

不一定。GPU 增加后通信成本会上升。如果 batch 太小、网络慢、数据加载慢，更多 GPU 可能利用率更低。

### DeepSpeed 和 FSDP 怎么选？

DeepSpeed 配置成熟、资料多，适合大量训练项目。FSDP 是 PyTorch 原生方案，适合希望贴近原生生态的团队。实际选择要看团队经验、模型规模和运维栈。

### 为什么显存没满但训练很慢？

可能瓶颈在 CPU 数据处理、磁盘读取、网络通信、padding 浪费或过于频繁的评估保存。

## 检查清单

- 是否记录 tokens/s，而不只是记录训练耗时？
- 是否统计样例长度分布并设置合理 max length？
- 是否启用梯度累积和 gradient checkpointing 做对比？
- 是否有小样本试跑，避免全量失败？
- 是否记录 GPU 利用率、显存峰值和失败重跑成本？

## 自检题

<details><summary>1. 为什么参数显存估算正确，运行仍可能 OOM？</summary>

激活、临时 buffer、通信 bucket、allocator 碎片及保存/评估时的权重聚合都可能形成更高峰值。

</details>

<details><summary>2. ZeRO-2 与 ZeRO-3 的关键差别是什么？</summary>

ZeRO-2 分片优化器状态和梯度；ZeRO-3 进一步分片模型参数。

</details>

<details><summary>3. packing 吞吐提升后还要验证什么？</summary>

验证样例边界、loss mask、有效 token 数和固定评估集，避免跨样例注意力或标签错位改变训练语义。

</details>

## 参考资料

- [DeepSpeed ZeRO 文档](https://www.deepspeed.ai/tutorials/zero/)
- [PyTorch FSDP 文档](https://pytorch.org/docs/stable/fsdp.html)
- [Accelerate DeepSpeed 文档](https://huggingface.co/docs/accelerate/usage_guides/deepspeed)
- [Transformers 性能优化文档](https://huggingface.co/docs/transformers/perf_train_gpu_one)
