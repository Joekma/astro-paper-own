---
title: "分布式训练路线：从 DDP 到 FSDP2"
author: Joekma
pubDatetime: 2026-08-09T02:20:00.000+08:00
modDatetime: 2026-08-09T02:20:00.000+08:00
slug: pytorch-15-distributed-training
description: "理解 PyTorch DDP 的多进程数据并行、梯度同步、DistributedSampler、指标归约与 Checkpoint，并建立迁移到 FSDP2 的判断框架。"
tags: [AI, PyTorch, DDP, FSDP2]
draft: false
series: PyTorch
seriesOrder: 15
language: zh-CN
---

## 本篇要解决的问题

DDP 为什么通常是一张 GPU 一个进程，而不是一个进程控制所有 GPU？每个 rank 读取不同数据后，怎样保证梯度和指标具有全局语义？模型放不下一张卡时，FSDP2 与 DDP 的根本区别是什么？

分布式训练不是给单机脚本加一行包装：

```text
启动进程组 → 每 rank 选择设备 → 数据分片 → 前向/反向
           → 梯度集合通信 → 全局指标 → 协调 Checkpoint/退出
```

任何只在单进程成立的状态，都要重新回答“由哪个 rank 拥有、是否需要同步、失败后怎样恢复”。

### 前置知识与硬件说明

理解单设备训练、梯度累积、Checkpoint 和 Profiler。DDP 可用 Gloo 在 CPU 上学习进程语义，CUDA 多卡通常使用 NCCL；FSDP2 的实际价值和本文示例主要面向多 GPU。FashionMNIST 过小，不会因分布式自动变快。

## 先区分 DDP 与 FSDP2

| 方案 | 每个 rank 的模型参数 | 数据 | 主要目标 |
| --- | --- | --- | --- |
| DDP | 完整副本 | 各 rank 不同 batch | 提高数据并行吞吐 |
| FSDP2 | 参数、梯度、优化器状态按 rank 分片 | 各 rank 不同 batch | 降低单卡模型状态内存并扩展大模型 |

DDP 每个 rank 都能独立执行完整 forward。反向过程中，它把各 rank 对应 Parameter 的梯度做 all-reduce，使更新前梯度一致。模型必须能放入单卡。

FSDP2 平时只保留参数分片，在模块计算前 all-gather 当前完整参数，计算后重新分片；反向用 reduce-scatter 聚合并保留梯度分片。它用通信换取内存扩展，不是 DDP 的无成本升级。

## DDP 进程入口

`torchrun` 会为每个进程设置 `LOCAL_RANK`、`RANK` 与 `WORLD_SIZE`：

```python
import os

import torch
import torch.distributed as dist


def setup_distributed() -> tuple[int, torch.device]:
    local_rank = int(os.environ["LOCAL_RANK"])
    backend = "nccl" if torch.cuda.is_available() else "gloo"
    dist.init_process_group(backend=backend)

    if torch.cuda.is_available():
        torch.cuda.set_device(local_rank)
        device = torch.device("cuda", local_rank)
    else:
        device = torch.device("cpu")

    return local_rank, device


def cleanup_distributed() -> None:
    if dist.is_initialized():
        dist.destroy_process_group()
```

用两进程启动：

```bash
torchrun --standalone --nproc_per_node=2 train_ddp.py
```

CUDA 场景通常让 `nproc_per_node` 等于可见 GPU 数；每个进程绑定一张 GPU，避免多进程争用默认设备。

主函数应保证异常时也销毁进程组：

```python
def main() -> None:
    local_rank, device = setup_distributed()
    try:
        run_training(local_rank, device)
    finally:
        cleanup_distributed()


if __name__ == "__main__":
    main()
```

## DistributedSampler 切分数据

若每个 rank 都使用普通 `shuffle=True`，它们会各自遍历完整训练集，产生大量重复样本。使用分布式采样器：

```python
from torch.utils.data import DataLoader
from torch.utils.data.distributed import DistributedSampler

train_sampler = DistributedSampler(
    train_dataset,
    shuffle=True,
    drop_last=False,
)

train_loader = DataLoader(
    train_dataset,
    batch_size=128,
    sampler=train_sampler,
    shuffle=False,
    num_workers=4,
    pin_memory=device.type == "cuda",
)
```

每个 epoch 设置采样种子：

```python
for epoch in range(start_epoch, config.epochs + 1):
    train_sampler.set_epoch(epoch)
    train_one_epoch(...)
```

忘记 `set_epoch` 会让各 epoch 使用相同的 shuffle 顺序。为保证各 rank 样本数一致，Sampler 在数据量不能整除 world size 时可能补充索引或丢弃尾部；指标必须按实际样本与任务定义解释。

## 包装模型与构造优化器

```python
from torch.nn.parallel import DistributedDataParallel as DDP

model = FashionMLP().to(device)

if device.type == "cuda":
    ddp_model = DDP(model, device_ids=[local_rank])
else:
    ddp_model = DDP(model)

optimizer = torch.optim.AdamW(
    ddp_model.parameters(),
    lr=config.learning_rate,
)
```

所有 rank 必须用相同模型结构和 Parameter 注册顺序。DDP 初始化时同步状态，反向 Hook 按 bucket 触发梯度通信。不要让不同 rank 根据本地数据走出不一致的参数使用路径，否则可能等待永远不会到达的 collective。

调用 `ddp_model(images)`，不要绕到 `ddp_model.module(images)`；后者会跳过 DDP 包装。需要访问原 Module 的 `state_dict` 时才使用 `.module`。

## DDP 训练循环

单设备训练循环大部分保持不变：

```python
for images, targets in train_loader:
    images = images.to(device, non_blocking=True)
    targets = targets.to(device, non_blocking=True)

    optimizer.zero_grad(set_to_none=True)
    logits = ddp_model(images)
    loss = criterion(logits, targets)
    loss.backward()  # 反向期间触发梯度通信
    optimizer.step()
```

DDP 默认把各 rank 梯度归约为平均语义。若每 rank batch size 为 128，world size 为 4，则一次 update 的全局 batch 通常是 512；再加梯度累积时还要乘累积步数。学习率与调度应根据全局有效 batch 重新评估。

## 聚合全局指标

各 rank 本地准确率不等于全局准确率。应归约“损失和、正确数、样本数”，最后统一除法：

```python
totals = torch.tensor(
    [loss_sum, float(correct), float(sample_count)],
    dtype=torch.float64,
    device=device,
)
dist.all_reduce(totals, op=dist.ReduceOp.SUM)

global_loss = (totals[0] / totals[2]).item()
global_accuracy = (totals[1] / totals[2]).item()
```

不能简单平均各 rank 的平均 loss；尾部样本数不同时会产生偏差。验证集也需要 DistributedSampler 或只由一个 rank 完整评估，二者不能混用后再重复计数。

只有 rank 0 输出普通日志，避免每行重复 world size 次：

```python
if dist.get_rank() == 0:
    print(global_loss, global_accuracy)
```

调试时则应在日志中带 rank，让错误能够定位到具体进程。

## Checkpoint 只写一次

所有 DDP rank 的同步模型状态理论上一致。由 rank 0 保存原模型状态：

```python
if dist.get_rank() == 0:
    checkpoint = {
        "model": ddp_model.module.state_dict(),
        "optimizer": optimizer.state_dict(),
        "epoch": epoch,
        "world_size": dist.get_world_size(),
    }
    atomic_torch_save(checkpoint, checkpoint_path)

dist.barrier()
```

`barrier()` 只在确有阶段协调需求时使用，过多 barrier 会破坏计算与通信重叠。恢复时可以让每个 rank 读取共享文件，也可以由 rank 0 读取后广播；大型 Checkpoint 需要 PyTorch Distributed Checkpoint 等分片方案。

优化器状态在 DDP 中每个 rank 都有完整副本。改变 world size 恢复时，DataLoader 步数、全局 batch 和调度器时间轴可能变化，必须显式决定兼容策略。

## 梯度累积与 no_sync

DDP 默认每次 backward 都同步梯度。非更新 micro-step 可以跳过通信：

```python
from contextlib import nullcontext

accumulation_steps = 4
optimizer.zero_grad(set_to_none=True)

for micro_step, (images, targets) in enumerate(train_loader, start=1):
    should_update = micro_step % accumulation_steps == 0
    sync_context = nullcontext() if should_update else ddp_model.no_sync()

    with sync_context:
        logits = ddp_model(images.to(device))
        loss = criterion(logits, targets.to(device)) / accumulation_steps
        loss.backward()

    if should_update:
        optimizer.step()
        optimizer.zero_grad(set_to_none=True)
```

只有最后一次 backward 同步时，bucket 中才包含累计梯度。尾部不足累积步数仍要执行一次同步更新；否则各 rank 会留下未同步梯度。

## 常见挂起原因

Collective 要求相关 rank 以兼容顺序参与。典型挂起：

- 某 rank 提前异常退出，其他 rank 仍等待 all-reduce。
- 不同 rank 的循环步数不同。
- 数据相关分支让某些 Parameter 只在部分 rank 使用。
- rank 0 保存或验证很久，其他 rank 已进入下一 collective。
- 网络、NCCL 拓扑或环境变量配置错误。

排障先记录每个 rank 的 epoch、step 和最后进入的阶段，设置合理超时，并缩小到单节点双进程。不要把“卡住”一律归因于 GPU 性能。

## 何时选择 FSDP2

若模型能放入单卡且目标是提高吞吐，先使用 DDP。只有参数、梯度和优化器状态使单卡无法容纳，或希望扩展大模型时，再评估 FSDP2。

FSDP2 使用 `fully_shard` 自底向上分片子模块和根模块：

```python
from torch.distributed.fsdp import fully_shard

model = Transformer()
for layer in model.layers:
    fully_shard(layer)
fully_shard(model)

# 参数已经成为分片 DTensor，之后再构造优化器
optimizer = torch.optim.AdamW(model.parameters(), lr=3e-4)
```

对子层先分片，计算某层时只 all-gather 当前需要的参数，其余层保持分片；根 `fully_shard(model)` 管理未被子层包含的参数。优化器必须在 `fully_shard` 之后构造，因为此时 Parameter 已转换为 DTensor 语义。

FashionMLP 只有两个 Linear，FSDP2 通信成本远大于内存收益。本段更适合与现有的[用 PyTorch 手写 Transformer Block](/posts/ai/transformer系列教程/transformer-11-pytorch-block/)和[从 Bigram 到 Mini GPT](/posts/ai/transformer系列教程/transformer-12-bigram-to-mini-gpt/)结合理解：按重复 Block 分片，才有清楚的计算与通信边界。

FSDP2 Checkpoint 不能直接照搬 DDP 的 `.module.state_dict()`。状态是 DTensor，需要使用 Distributed Checkpoint 的 `get_model_state_dict`/`set_model_state_dict`，或显式聚合为 full state dict。大型模型若在 rank 0 一次性聚合全部权重，可能造成 CPU 或 GPU 内存峰值。

## 分布式性能判断

扩展效率可以写成：

$$
\text{scaling efficiency}
=\frac{\text{N 卡吞吐}}{N\times\text{单卡吞吐}}
$$

效率低的常见原因：模型计算太小、batch 不足、互联慢、数据管道无法随 rank 扩展、梯度 bucket 通信未与反向重叠，或频繁全局同步。

报告分布式结果时至少写明：节点/GPU 数、每 rank batch、全局 batch、累积步数、dtype、网络互联、模型参数量、是否包含数据与验证。只写“8 卡提升 6 倍”无法复现也无法比较。

## 常见误区

- **DDP 会自动切分模型**：它复制完整模型，只切分数据并同步梯度。
- **每个 rank 用 `shuffle=True` 即可**：需要 DistributedSampler 避免重复完整数据。
- **本地平均指标再平均就是全局指标**：样本数不同会产生偏差，应归约总和与计数。
- **所有 rank 都保存同一文件**：会竞争或损坏，DDP 通常只由 rank 0 写。
- **FSDP2 一定比 DDP 快**：它优先解决内存扩展，通信可能让小模型更慢。
- **梯度累积时每步都必须同步**：非更新 micro-step 可用 `no_sync()`，但最终一次必须同步。

## 本篇自检

1. DDP 为什么要求模型仍能放入单卡？
2. 为什么每个 epoch 都要调用 `DistributedSampler.set_epoch`？
3. FSDP2 为什么要在 `fully_shard` 之后构造优化器？

<details>
<summary>查看答案</summary>

1. 每个 rank 保存并计算完整模型副本，DDP 只分片输入数据。
2. 它让各 epoch 基于新种子产生一致协调但不同的全局 shuffle 顺序。
3. 分片会把参数转换为 DTensor 语义，优化器必须引用转换后的当前参数。

</details>

## 小结与下一篇

DDP 通过一进程一设备复制模型、切分数据并同步梯度来扩展吞吐；FSDP2 则通过参数、梯度和优化器状态分片突破单卡内存。两者都要求重新设计采样、指标、Checkpoint 和失败协调。最后一篇回到模型交付：把训练时 Module 转换成带动态 Shape 约束的 `torch.export` 与 ONNX 产物。

**下一篇：** [模型导出与推理交付：torch.export、ONNX 与一致性验证](/posts/ai/py-torch系列教程/pytorch-16-export-deployment/)

## 参考资料

- [PyTorch Distributed Overview](https://docs.pytorch.org/tutorials/distributed.html)
- [Getting Started with DDP](https://docs.pytorch.org/tutorials/intermediate/ddp_tutorial.html)
- [DDP Video Series](https://docs.pytorch.org/tutorials/beginner/ddp_series_intro.html)
- [Getting Started with FSDP2](https://docs.pytorch.org/tutorials/intermediate/FSDP_tutorial.html)
