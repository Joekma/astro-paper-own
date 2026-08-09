---
title: "性能诊断：Profiler、DataLoader 与训练瓶颈"
author: Joekma
pubDatetime: 2026-08-09T02:00:00.000+08:00
modDatetime: 2026-08-09T02:00:00.000+08:00
slug: pytorch-13-profiler-performance
description: "用端到端吞吐、PyTorch Profiler、record_function 和 DataLoader 对照实验定位 CPU、GPU、数据与同步瓶颈。"
tags: [AI, PyTorch, Profiler, Performance]
draft: false
series: PyTorch
seriesOrder: 13
language: zh-CN
---

## 本篇要解决的问题

GPU 利用率低，是模型太小、数据太慢还是同步过多？Profiler 表里某个算子耗时最高，是否应该立刻优化它？怎样比较 `num_workers`、batch size 与 AMP，避免把 warm-up、编译或磁盘缓存差异当成提升？

性能工程的基本闭环是：

```text
定义目标 → 建立基线 → 分段测量 → 找主要等待
        → 只改一个变量 → 复测正确性与端到端指标
```

没有基线的“优化”只是代码变化，没有成本模型的单算子加速也可能对完整训练无影响。

### 前置知识与硬件说明

已经有正确的 FP32/AMP 训练循环，理解 CUDA 异步执行与 DataLoader 多进程。本篇 CPU 部分可在普通环境运行；CUDA kernel 与传输分析需要 NVIDIA GPU 和可用的 CUPTI Profiler 支持。

## 先定义性能指标

训练常见指标：

- **samples/s**：每秒处理的有效样本数。
- **step time**：一个 optimizer update 的耗时分布。
- **time to target**：达到目标验证指标所需时间。
- **peak memory**：给定 batch 与配置的峰值设备内存。
- **data wait ratio**：训练等待下一个 batch 的比例。

只报告 epoch 耗时还不够，必须同时给出样本数、batch size、累积步数、设备、dtype、模型状态和是否包含验证。AMP 可能提高 samples/s，却因数值差异需要更多 step；最终目标应优先看 time to target。

FashionMNIST MLP 很小，适合教学 Profiler，不适合用来证明某块 GPU 的峰值性能。

## 正确测量端到端基线

```python
import statistics
import time


def measure_epochs(
    run_epoch,
    warmup_epochs: int = 1,
    measured_epochs: int = 5,
) -> tuple[float, float]:
    for _ in range(warmup_epochs):
        run_epoch()

    durations = []
    for _ in range(measured_epochs):
        if torch.cuda.is_available():
            torch.cuda.synchronize()
        started = time.perf_counter()

        run_epoch()

        if torch.cuda.is_available():
            torch.cuda.synchronize()
        durations.append(time.perf_counter() - started)

    return statistics.median(durations), statistics.pstdev(durations)
```

使用中位数降低偶发抖动影响，同时保留标准差观察稳定性。基准运行应：

- 先 warm-up，避免首次 CUDA context、内核选择和磁盘缓存影响。
- 使用同一数据子集、模型状态和随机性策略。
- 固定训练/推理模式与 AMP 配置。
- 在比较前验证输出和 loss 没有异常。
- 避免同时运行浏览器、其他 GPU 任务或系统更新。

若只测单个 CUDA 区段，可以使用 Event：

```python
start = torch.cuda.Event(enable_timing=True)
end = torch.cuda.Event(enable_timing=True)

start.record()
logits = model(images)
end.record()
end.synchronize()

elapsed_ms = start.elapsed_time(end)
```

Event 测量 GPU 时间，不包含 CPU 数据准备和部分排队等待；它与端到端墙钟回答的是不同问题。

## 用 record_function 标记阶段

Profiler 默认显示大量算子名，但不理解业务阶段。用标签建立层次：

```python
from torch.profiler import record_function

with record_function("data_to_device"):
    images = images.to(device, non_blocking=True)
    targets = targets.to(device, non_blocking=True)

with record_function("forward_and_loss"):
    logits = model(images)
    loss = criterion(logits, targets)

with record_function("backward"):
    loss.backward()

with record_function("optimizer_step"):
    optimizer.step()
    optimizer.zero_grad(set_to_none=True)
```

标签不会自动同步 CUDA，也不应包围大量 Python 日志。它们用于把 trace 中的算子归因到数据、前向、反向和更新阶段。

## PyTorch Profiler 的最小使用

```python
from pathlib import Path
from torch.profiler import ProfilerActivity, profile, schedule

activities = [ProfilerActivity.CPU]
if device.type == "cuda":
    activities.append(ProfilerActivity.CUDA)

trace_dir = Path("runs/profile")
trace_dir.mkdir(parents=True, exist_ok=True)

with profile(
    activities=activities,
    schedule=schedule(wait=1, warmup=1, active=3, repeat=1),
    on_trace_ready=torch.profiler.tensorboard_trace_handler(str(trace_dir)),
    record_shapes=True,
    profile_memory=True,
    with_stack=False,
) as profiler:
    for step, (images, targets) in enumerate(train_loader):
        train_step(images, targets)
        profiler.step()
        if step >= 5:
            break
```

调度含义：先跳过一个 step，warm-up 一个 step，再记录三个 step。Profiler 本身有开销，`record_shapes`、`profile_memory` 和 `with_stack=True` 会进一步增加成本；只在短窗口开启。

查看聚合表：

```python
sort_key = "self_cuda_time_total" if device.type == "cuda" else "self_cpu_time_total"
print(profiler.key_averages().table(sort_by=sort_key, row_limit=20))
```

- `CPU total` 包含子调用时间，`Self CPU` 只统计当前事件自身。
- CUDA 时间描述 kernel 执行，不自动包含 CPU 等待或数据准备。
- 调用次数很重要：单次很短但调用百万次的算子可能是瓶颈。
- Shape 能解释为什么同名算子成本不同。

不要把 CPU 与 CUDA 列相加得到 step time；二者可能并行或互相等待。

## 从时间线识别等待

常见 trace 形态：

### GPU 间有大片空白

可能原因：

- DataLoader 未及时提供 batch。
- Python 小算子和控制流提交 kernel 太慢。
- 频繁 `.item()`、`.cpu()` 或打印触发同步。
- batch 太小，kernel 工作量不足。

### GPU 连续忙碌但吞吐仍低

可能是模型本身计算受限，或使用了低效算子、dtype、内存布局。此时提高 worker 数通常没有效果。

### CPU 很忙但 GPU 等待

检查图片解码、随机增强、Python `collate_fn`、单线程算子和进程间序列化。先定位具体阶段，再决定缓存、离线预处理或增加 worker。

### step 之间出现固定同步

检查每步指标是否调用 `.item()`、进度条是否读取 CUDA Tensor、是否频繁执行 `torch.cuda.synchronize()`，以及内存统计是否强制同步。

## 单独测 DataLoader

先不执行模型，测 batch 产出速度：

```python
def measure_loader(loader: DataLoader, max_batches: int = 200) -> float:
    started = time.perf_counter()
    sample_count = 0

    for batch_index, (images, targets) in enumerate(loader):
        sample_count += images.size(0)
        if batch_index + 1 >= max_batches:
            break

    elapsed = time.perf_counter() - started
    return sample_count / elapsed
```

分别比较：

```text
num_workers = 0, 1, 2, 4, 8
pin_memory = false / true（仅 CUDA 路径）
persistent_workers = false / true
不同 batch size
```

每次只改一个变量，并测多个 epoch。第一个 epoch 包含 worker 启动和文件系统冷缓存，不能直接与后续 epoch 混合平均。

`prefetch_factor` 控制每个 worker 预取 batch 数，只在 `num_workers>0` 时使用。过度预取会增加主机内存并让随机增强提前执行，未必增加吞吐。

## batch size 的权衡

增大 batch 往往提高 GPU 利用率，却同时改变：

- 峰值显存与激活大小；
- 每个 epoch 的 optimizer update 数；
- 梯度统计与学习率选择；
- 最后一个 batch 和数据并行负载；
- 达到目标精度所需的 step 数。

比较纯系统吞吐时可固定模型权重、不执行更新；比较训练方案时则必须重新验证优化超参数和最终指标。不能只用最大不 OOM 的 batch 作为最优值。

## Python 同步陷阱

以下操作会把设备结果带回 CPU，可能触发同步：

```python
loss.item()
tensor.cpu()
tensor.numpy()
print(cuda_tensor)
bool(cuda_tensor)
```

指标仍然需要读取，但可以降低频率或在设备上累积一段时间：

```python
running_loss = torch.zeros((), device=device)
running_correct = torch.zeros((), device=device, dtype=torch.int64)

running_loss += loss.detach() * images.size(0)
running_correct += (logits.argmax(1) == targets).sum()

# 在日志边界集中同步一次
loss_value = running_loss.item()
correct_value = running_correct.item()
```

不要为了避免同步而无限保存每步 Tensor；应在固定日志边界聚合和释放。

## 优化决策矩阵

| 证据 | 优先尝试 | 不应先做 |
| --- | --- | --- |
| GPU 等待 DataLoader | 调整 worker、缓存、pin/prefetch | 重写模型算子 |
| 大量极小 kernel 与 Python 间隙 | 增大工作量、减少 Python 边界、评估 compile | 继续增加 worker |
| 单个大 GEMM/卷积占主导 | AMP、合适 batch、后端优化 | 优化无关日志 |
| 显存限制 batch | AMP、累积、activation checkpoint | 频繁 empty_cache |
| 每步固定主机同步 | 降低 `.item()`/打印频率 | 增加 GPU 数 |

优化后重跑相同基线，并记录：性能变化、峰值内存、数值差异和配置成本。提升小于运行抖动时不能下结论。

## 常见误区

- **GPU 利用率是唯一目标**：高利用率可能只是执行了更多无用工作。
- **Profiler 第一名就是优化目标**：要看 self/total、调用次数及端到端占比。
- **微基准提升等于 epoch 提升**：数据和同步可能完全抵消收益。
- **worker 越多越快**：I/O、序列化和 CPU 竞争会产生反效果。
- **单次计时可以比较方案**：warm-up、缓存和异步都会污染结果。
- **优化不需要复查数值**：更换 dtype、编译和融合都必须守住正确性基线。

## 本篇自检

1. 为什么 CUDA Event 与完整 epoch 墙钟不能相互替代？
2. GPU 时间线有空白时，为什么不应立刻换更快显卡？
3. 调整 batch size 后为什么还要重新检查优化结果？

<details>
<summary>查看答案</summary>

1. Event 测量设备区段，epoch 墙钟还包含数据、CPU、同步和验证等端到端成本。
2. 空白可能来自数据或 Python 提交瓶颈，换设备甚至会扩大等待比例。
3. batch 改变更新频率和梯度统计，原学习率与调度未必仍合适。

</details>

## 小结与下一篇

性能诊断从目标和可重复基线开始，Profiler 用于解释等待发生在哪里，DataLoader 对照实验与时间线则区分数据、Python 和设备瓶颈。下一篇在这些证据上引入 `torch.compile`，理解它能优化什么，以及 Graph Break 和重编译如何消耗收益。

**下一篇：** [torch.compile：图捕获、Graph Break 与性能验证](/posts/ai/py-torch系列教程/pytorch-14-torch-compile/)

## 参考资料

- [Profiling your PyTorch Module](https://docs.pytorch.org/tutorials/beginner/profiler.html)
- [`torch.profiler`](https://docs.pytorch.org/docs/stable/profiler.html)
- [Performance Tuning Guide](https://docs.pytorch.org/tutorials/recipes/recipes/tuning_guide.html)
- [`torch.utils.benchmark`](https://docs.pytorch.org/docs/stable/benchmark_utils.html)
