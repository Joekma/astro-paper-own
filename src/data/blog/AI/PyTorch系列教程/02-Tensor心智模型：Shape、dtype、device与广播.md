---
title: "Tensor 心智模型：Shape、dtype、device 与广播"
author: Joekma
pubDatetime: 2026-08-09T00:10:00.000+08:00
modDatetime: 2026-08-09T00:10:00.000+08:00
slug: pytorch-02-tensor-fundamentals
description: "从 FashionMNIST 图像批次出发，掌握 PyTorch Tensor 的 Shape、dtype、device、索引、广播、矩阵运算与 NumPy 互操作。"
tags: [AI, PyTorch, Tensor, NumPy]
draft: false
series: PyTorch
seriesOrder: 2
language: zh-CN
---

## 本篇要解决的问题

Tensor 与 NumPy 数组有什么相同和不同？为什么图像批次写成 `[B,C,H,W]`，标签却只有 `[B]`？两个 Shape 不相同的 Tensor 为什么有时可以相加，有时会把结果意外扩成一个矩阵？

Tensor 代码最危险的错误通常不是“程序崩溃”，而是 Shape 恰好能够广播，程序继续运行，却计算了错误的含义。本篇建立一套固定检查顺序：**先写轴语义，再看 Shape，然后核对 dtype 和 device，最后才选择算子**。

### 前置知识

已经完成环境安装，理解 Python 列表、切片和 NumPy 数组的基本概念。

## 从 FashionMNIST 的 Shape 开始

单张 FashionMNIST 灰度图在 PyTorch 中通常表示为：

```text
[C, H, W] = [1, 28, 28]
```

DataLoader 把 64 张图片堆叠成批次后，增加 Batch 轴：

```text
images: [B, C, H, W] = [64, 1, 28, 28]
labels: [B]          = [64]
```

可以先用随机数据固定接口：

```python
import torch

images = torch.rand(64, 1, 28, 28)
labels = torch.randint(0, 10, (64,))

assert images.shape == (64, 1, 28, 28)
assert images.dtype == torch.float32
assert labels.shape == (64,)
assert labels.dtype == torch.int64
```

图像需要参与乘法和梯度计算，通常采用浮点类型；`CrossEntropyLoss` 的类别目标是索引，要求 `torch.int64`。把标签转成 `float32` 并不会让它“精度更高”，反而会破坏损失函数契约。

## 创建 Tensor 时控制信息来源

常用构造方式各有不同目的：

```python
from_data = torch.tensor([[1, 2], [3, 4]], dtype=torch.float32)
zeros = torch.zeros(2, 3)
ones = torch.ones_like(zeros)
uniform = torch.rand(2, 3)
normal = torch.randn(2, 3)
indices = torch.arange(0, 10, 2)
```

`*_like` 会继承输入的 Shape、dtype 和 device，适合创建掩码或初始状态：

```python
mask = torch.ones_like(images, dtype=torch.bool)
assert mask.device == images.device
assert mask.shape == images.shape
```

不要使用旧式的 `torch.FloatTensor(...)`、`torch.cuda.FloatTensor(...)` 来表达 dtype 和 device。现代代码应显式写 `dtype=`、`device=` 或调用 `.to()`，这样同一份代码更容易跨设备运行。

## 四个核心属性

每个 Tensor 至少要关注：

```python
x = torch.randn(8, 16, dtype=torch.float32)

print(x.shape)   # torch.Size([8, 16])
print(x.dtype)   # torch.float32
print(x.device)  # cpu
print(x.layout)  # torch.strided
```

- `shape` 描述各轴长度，但不包含轴的业务名称。
- `dtype` 决定数值范围、精度、内存和可用算子。
- `device` 决定数据位于 CPU、CUDA、MPS 或其他后端。
- `layout` 描述存储布局；本系列绝大多数示例使用默认的 strided Tensor。

设备和类型可以一起转换：

```python
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
images = images.to(device=device, dtype=torch.float32)
labels = labels.to(device=device)  # 保持 int64
```

`.to()` 在属性已经满足时可以直接返回原对象，在需要转换时创建新 Tensor。因此应接住返回值，不能假设它原地修改了变量。

## 索引、切片和归约

Tensor 索引与 NumPy 相似：

```python
first_image = images[0]          # [1, 28, 28]
top_half = images[:, :, :14, :]  # [64, 1, 14, 28]
first_pixel = images[0, 0, 0, 0] # 标量 Tensor
```

维度是否保留会影响后续广播。`images[0]` 消掉 Batch 轴，而 `images[0:1]` 保留长度为 1 的 Batch 轴：

```python
assert images[0].shape == (1, 28, 28)
assert images[0:1].shape == (1, 1, 28, 28)
```

归约算子也要明确轴：

```python
global_mean = images.mean()                 # 标量
per_image_mean = images.mean(dim=(1, 2, 3)) # [B]
channel_mean = images.mean(dim=(0, 2, 3))   # [C]
```

`dim` 回答“消掉哪些轴”。需要保留长度为 1 的轴以便后续广播时，使用 `keepdim=True`：

```python
mean = images.mean(dim=(2, 3), keepdim=True)  # [B, C, 1, 1]
centered = images - mean                       # 广播到 [B, C, H, W]
```

## 广播从尾部维度对齐

两个 Tensor 可广播，当从最后一维向前比较时，每对维度相等、其中一个为 1，或其中一个不存在。

```python
x = torch.zeros(32, 10)
bias = torch.arange(10, dtype=torch.float32)
y = x + bias
assert y.shape == (32, 10)
```

`bias` 的 `[10]` 与 `x` 的最后一维对齐，相当于在 32 个样本上共享同一组类别偏置。广播通常不会先真实复制数据，但结果语义必须由调用者保证。

最典型的错误是把 `[B]` 与 `[B,1]` 相减：

```python
pred = torch.randn(32, 1)
target = torch.randn(32)
wrong = pred - target
assert wrong.shape == (32, 32)
```

从尾部对齐后，`[32,1]` 与 `[32]` 被解释为 `[32,1]` 和 `[1,32]`，于是生成了两两组合矩阵。正确做法是先统一契约：

```python
target = target.unsqueeze(1)
correct = pred - target
assert correct.shape == (32, 1)
```

广播错误之所以隐蔽，是因为程序没有异常，loss 甚至可能下降。训练前应对模型输出与目标 Shape 做断言，而不是只看最终标量损失。

## 矩阵乘法与轴语义

FashionMNIST 的全连接基线会先把图片展平：

```python
flat = images.flatten(start_dim=1)
assert flat.shape == (64, 784)

weight = torch.randn(784, 10, device=images.device)
bias = torch.zeros(10, device=images.device)
logits = flat @ weight + bias
assert logits.shape == (64, 10)
```

这里的契约是：

```text
[batch, input_feature] @ [input_feature, class] → [batch, class]
```

`@` 对二维 Tensor 执行矩阵乘法，对更高维 Tensor 执行批量矩阵乘法并广播前导维度。逐元素乘法使用 `*`，点积、矩阵乘法和逐元素乘法不能仅凭“都在做乘法”互换。

## 与 NumPy 互操作

CPU Tensor 和 NumPy 数组可以共享底层内存：

```python
import numpy as np

array = np.array([1.0, 2.0, 3.0], dtype=np.float32)
tensor = torch.from_numpy(array)

array[0] = 99.0
assert tensor[0].item() == 99.0
```

共享内存能避免复制，也意味着一侧修改会影响另一侧。若需要独立数据，应显式复制：

```python
independent = torch.from_numpy(array).clone()
```

CUDA Tensor 不能直接 `.numpy()`，要先停止梯度关联、移动到 CPU：

```python
array = tensor.detach().cpu().numpy()
```

标量 Tensor 使用 `.item()` 变成 Python 数值；大型 Tensor 不应在训练循环中频繁 `.tolist()` 或 `.cpu()`，因为设备同步和数据复制会成为性能瓶颈。

## 常见误区

- **Shape 相等就代表含义相同**：`[B,T,C]` 和 `[B,H,W]` 可以恰好相等，但轴语义完全不同。
- **所有浮点都用 float64**：深度学习默认常用 float32；更高精度会增加内存与计算成本，并不自动改善训练。
- **把标签也移动成模型 dtype**：分类目标通常必须保持 int64。
- **广播会报告可疑 Shape**：只要规则合法就不会报错，因此关键边界需要断言。
- **`.to(device)` 会原地修改**：必须使用返回值。

## 本篇自检

1. 为什么分类 logits 是 `[B,10]`，标签却是 `[B]`？
2. `[B,1] - [B]` 为什么可能得到 `[B,B]`？
3. `torch.from_numpy` 后修改数组，为什么 Tensor 也可能变化？

<details>
<summary>查看答案</summary>

1. 每个样本需要十个类别分数，但真实目标只需一个类别索引。
2. 广播从尾部对齐，把两者视为 `[B,1]` 与 `[1,B]`，两个非单例轴分别扩展。
3. CPU Tensor 与 NumPy 数组可以共享同一块底层内存；需要隔离时应复制或 `clone()`。

</details>

## 小结与下一篇

Tensor 不只是“多维数组”。可靠代码必须同时维护 Shape、轴语义、dtype 和 device。广播、矩阵乘法与 NumPy 共享内存都是高效工具，也都可能在契约不清时制造静默错误。

**下一篇：** [Tensor 内存与变形：stride、view、reshape 与 contiguous](/posts/ai/py-torch系列教程/pytorch-03-tensor-memory/)

## 参考资料

- [Tensors](https://docs.pytorch.org/tutorials/beginner/basics/tensorqs_tutorial.html)
- [Tensor Attributes](https://docs.pytorch.org/docs/stable/tensor_attributes.html)
- [Broadcasting Semantics](https://docs.pytorch.org/docs/stable/notes/broadcasting.html)
- [NumPy Bridge](https://docs.pytorch.org/tutorials/beginner/blitz/tensor_tutorial.html#numpy-bridge)
