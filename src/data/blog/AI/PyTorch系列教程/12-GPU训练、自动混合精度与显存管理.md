---
title: "GPU 训练、自动混合精度与显存管理"
author: Joekma
pubDatetime: 2026-08-09T01:50:00.000+08:00
modDatetime: 2026-08-09T01:50:00.000+08:00
slug: pytorch-12-amp-memory
description: "建立设备无关的 GPU 训练循环，正确使用 autocast 与 GradScaler，并从参数、梯度、优化器和激活拆解显存占用与 OOM。"
tags: [AI, PyTorch, CUDA, AMP]
draft: false
series: PyTorch
seriesOrder: 12
language: zh-CN
---

## 本篇要解决的问题

把模型和 batch `.to("cuda")` 后，训练为什么不一定明显加速？自动混合精度中 `autocast` 与 GradScaler 分别解决什么问题？OOM 时为什么 `torch.cuda.empty_cache()` 常常没有用，应该先拆解哪些显存组成？

GPU 优化必须同时守住两个目标：**数值结果仍在可接受范围，吞吐或显存确实改善**。只看到显卡利用率升高并不能证明端到端训练更快。

### 前置知识与硬件说明

已经有正确的 FP32 FashionMNIST 训练基线和调试方法。本篇 AMP 主示例要求 CUDA；CPU、MPS 或 XPU 用户仍可使用设备无关结构，但低精度支持与行为要以对应后端文档为准。

## 设备无关的外层结构

```python
def select_device() -> torch.device:
    if torch.cuda.is_available():
        return torch.device("cuda")
    if hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
        return torch.device("mps")
    if hasattr(torch, "xpu") and torch.xpu.is_available():
        return torch.device("xpu")
    return torch.device("cpu")


device = select_device()
model = FashionMLP().to(device)
```

模型内部不调用 `.cuda()`，也不依赖全局 device。训练器负责 batch 迁移：

```python
for images, targets in train_loader:
    images = images.to(device, non_blocking=device.type == "cuda")
    targets = targets.to(device, non_blocking=device.type == "cuda")
    logits = model(images)
```

数据、Parameter、Buffer 和新建的辅助 Tensor 必须在同一设备。模型内部创建与输入相关的 Tensor 时，优先使用 `x.new_zeros(...)`、`torch.zeros_like(x)` 或显式 `device=x.device`。

## GPU 执行是异步的

CPU 提交 CUDA kernel 后通常立即继续，直接用墙钟包围一次调用会只测到提交时间：

```python
import time

torch.cuda.synchronize()
start = time.perf_counter()
logits = model(images)
torch.cuda.synchronize()
elapsed = time.perf_counter() - start
```

同步会打断流水，不应放进正式训练每个 step。更准确的 GPU 微基准可使用 CUDA Event 或 `torch.utils.benchmark`；端到端训练则测完整 epoch，并包含合理 warm-up。

FashionMLP 很小，CPU 到 GPU 的传输和 kernel 启动开销可能占主导，GPU 不一定比 CPU 快。硬件加速的收益取决于算子规模、batch size、数据管道和计算密度。

## 混合精度的两个组件

AMP 使用低精度执行适合的算子，保留需要更高精度的算子。CUDA 常见：

- float16 范围较窄、吞吐高，反向小梯度容易下溢。
- bfloat16 与 float32 有相近指数范围，通常不需要梯度缩放，但有效尾数更短，且依赖硬件支持。
- float32 仍用于部分归约、参数状态或数值敏感运算。

`autocast` 负责按算子策略选择 dtype，GradScaler 负责放大 loss，降低 float16 梯度下溢风险。二者解决不同问题。

## 正确的 AMP 训练 step

```python
use_amp = device.type == "cuda"
scaler = torch.amp.GradScaler("cuda", enabled=use_amp)


def train_amp_step(
    images: torch.Tensor,
    targets: torch.Tensor,
) -> float:
    optimizer.zero_grad(set_to_none=True)

    with torch.autocast(
        device_type=device.type,
        dtype=torch.float16,
        enabled=use_amp,
    ):
        logits = model(images)
        loss = criterion(logits, targets)

    scaler.scale(loss).backward()
    scaler.unscale_(optimizer)
    torch.nn.utils.clip_grad_norm_(
        model.parameters(),
        max_norm=1.0,
        error_if_nonfinite=True,
    )
    scaler.step(optimizer)
    scaler.update()
    return loss.detach().item()
```

顺序不可随意交换：

1. Forward 与 loss 在 autocast 上下文中执行。
2. 缩放后的 loss 反向，梯度也带缩放。
3. 裁剪或检查梯度前先 `unscale_`。
4. `scaler.step` 在发现非有限梯度时可以跳过 optimizer 更新。
5. `scaler.update` 根据本轮情况调整缩放因子。

不要把 `optimizer.step()` 和 `scaler.step()` 都调用；AMP 路径由后者代理更新。

验证不需要 GradScaler：

```python
model.eval()
with torch.inference_mode(), torch.autocast(
    device_type=device.type,
    dtype=torch.float16,
    enabled=use_amp,
):
    logits = model(images)
```

是否在推理启用 autocast，要根据数值一致性和真实性能决定，而不是默认照搬训练设置。

## bfloat16 路径

支持 bfloat16 的硬件可以使用：

```python
with torch.autocast(
    device_type="cuda",
    dtype=torch.bfloat16,
):
    loss = criterion(model(images), targets)

loss.backward()
optimizer.step()
```

bfloat16 通常不需要 GradScaler，但“通常”不是绝对规则；自定义算子和模型仍要检查有限值。硬件是否高效支持 bfloat16，可根据设备能力和官方文档判断。

不要把模型参数永久 `.half()` 当作 AMP 的等价方案。全模型 half 会强制所有兼容与不兼容算子使用 float16，丢失 autocast 按算子选择精度的能力，也更容易产生数值问题。

## AMP 与梯度累积

一次 optimizer update 内应保持同一缩放因子，累积结束后再解除缩放和更新：

```python
accumulation_steps = 4
optimizer.zero_grad(set_to_none=True)

for micro_step, (images, targets) in enumerate(train_loader, start=1):
    images = images.to(device, non_blocking=True)
    targets = targets.to(device, non_blocking=True)

    with torch.autocast("cuda", dtype=torch.float16):
        logits = model(images)
        loss = criterion(logits, targets) / accumulation_steps

    scaler.scale(loss).backward()

    if micro_step % accumulation_steps == 0:
        scaler.unscale_(optimizer)
        torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
        scaler.step(optimizer)
        scaler.update()
        optimizer.zero_grad(set_to_none=True)
```

还要处理尾部不足一个累积周期的 batch。分布式训练中，非更新 micro-step 可以避免不必要的梯度同步，第 15 篇会说明 DDP 的 `no_sync()` 边界。

## 显存由什么组成

训练显存不只有权重：

```text
参数 + 梯度 + 优化器状态 + 前向激活 + 临时工作区
+ CUDA context/库工作区 + 缓存分配器保留内存
```

以 float32 参数为例，每个元素 4 字节；梯度通常再占一份。AdamW 常维护两个与参数同 Shape 的状态，参数、梯度和状态合计就可能达到参数字节数的数倍。激活随 batch size、序列长度、分辨率和网络深度增长，并且要保留到反向使用。

AMP 可能降低激活和部分计算的内存，但优化器状态通常仍保留高精度。不能用“参数量 × 2 字节”估计训练总显存。

## 观察 allocated 与 reserved

CUDA 缓存分配器区分正在被 Tensor 使用的内存和为复用保留的内存：

```python
allocated = torch.cuda.memory_allocated()
reserved = torch.cuda.memory_reserved()
peak = torch.cuda.max_memory_allocated()

print("allocated MB:", allocated / 1024**2)
print("reserved MB:", reserved / 1024**2)
print("peak allocated MB:", peak / 1024**2)
```

测量一个阶段前可以重置峰值：

```python
torch.cuda.reset_peak_memory_stats()
```

`reserved > allocated` 并不自动表示泄漏。缓存分配器保留已申请块，以减少后续昂贵分配。真正泄漏通常表现为每个 step 的 `allocated` 持续增长，并能追溯到仍被 Python 容器引用的带图 Tensor。

典型错误：

```python
loss_history.append(loss)  # 保存整张计算图
```

正确记录标量：

```python
loss_history.append(loss.detach().item())
```

## OOM 的排查顺序

出现 OOM 时先记录：输入 Shape、batch size、dtype、训练/推理模式、allocated/reserved 峰值和发生阶段。然后按代价从低到高处理：

1. 确认没有累积带图 Tensor、重复模型或未释放 Hook。
2. 减小 batch size，并按需要使用梯度累积保持有效 batch。
3. 启用 AMP，比较数值与真实峰值。
4. 降低输入分辨率、序列长度或不必要的中间输出。
5. 对大激活区段使用 activation checkpointing，以额外重算换内存。
6. 再考虑模型并行、FSDP2、CPU offload 等复杂策略。

Activation checkpointing 不保存部分前向激活，在反向时重算：

```python
from torch.utils.checkpoint import checkpoint

output = checkpoint(block, x, use_reentrant=False)
```

它用计算换内存，并对随机数状态、设备迁移和副作用有额外要求。不要仅凭名称与“训练状态 Checkpoint”混淆：前者是激活重算技术，后者是断点恢复文件。

## empty_cache 能做什么

```python
torch.cuda.empty_cache()
```

它释放缓存分配器中未被 Tensor 使用的块，使其他进程可能使用这些显存；不会释放仍被活动 Tensor 引用的内存，也不会增加当前 PyTorch 进程可用于活动 Tensor 的理论上限。

若调用后 allocated 不变，说明内存仍有引用。应查列表、闭包、Hook、缓存输出和异常路径，而不是在循环中反复 `empty_cache()`。

## 数据传输与 pin_memory

CUDA DataLoader 可设置：

```python
train_loader = DataLoader(
    train_dataset,
    batch_size=128,
    shuffle=True,
    num_workers=4,
    pin_memory=True,
    persistent_workers=True,
)
```

配合 `.to(device, non_blocking=True)` 才可能让主机到设备拷贝与计算重叠。Pinned memory、worker 数和 prefetch 都会消耗主机资源；只有 Profiler 显示 GPU 等待数据时才值得继续调整。

## 常见误区

- **模型上 GPU 就一定更快**：小模型可能被传输和 kernel 启动开销主导。
- **AMP 等于全模型 half**：AMP 按算子选择精度，全模型 `.half()` 更激进。
- **GradScaler 提升前向精度**：它只通过 loss/梯度缩放缓解 float16 下溢。
- **裁剪缩放后的梯度**：应先 `unscale_`。
- **reserved 内存都是泄漏**：缓存分配器会保留可复用块。
- **`empty_cache()` 可以释放活动 Tensor**：只要仍有引用，它就无能为力。
- **Activation checkpoint 就是断点文件**：一个重算激活，一个保存训练状态。

## 本篇自检

1. AMP 中梯度裁剪为什么必须在 `unscale_` 之后？
2. `memory_reserved` 大于 `memory_allocated` 是否证明泄漏？
3. 为什么直接计时一次 CUDA forward 容易得到过小结果？

<details>
<summary>查看答案</summary>

1. 裁剪应基于真实梯度范数，缩放梯度的范数被人为放大。
2. 不能；差值可能只是缓存分配器为后续复用保留的空闲块。
3. CUDA 异步提交 kernel，CPU 计时可能在计算真正完成前结束，需要同步或使用 CUDA Event。

</details>

## 小结与下一篇

GPU 训练需要统一设备边界、理解异步执行，并用 autocast 与 GradScaler 分别管理算子精度和 float16 梯度范围。显存分析则必须拆开活动 Tensor、优化器状态、激活和缓存。下一篇不再凭感觉优化，而是用 Profiler 和端到端吞吐建立性能证据。

**下一篇：** [性能诊断：Profiler、DataLoader 与训练瓶颈](/posts/ai/py-torch系列教程/pytorch-13-profiler-performance/)

## 参考资料

- [Automatic Mixed Precision Recipe](https://docs.pytorch.org/tutorials/recipes/recipes/amp_recipe.html)
- [CUDA Semantics](https://docs.pytorch.org/docs/stable/notes/cuda.html)
- [CUDA Memory Management](https://docs.pytorch.org/docs/stable/notes/cuda.html#cuda-memory-management)
- [Activation Checkpointing](https://docs.pytorch.org/docs/stable/checkpoint.html)
