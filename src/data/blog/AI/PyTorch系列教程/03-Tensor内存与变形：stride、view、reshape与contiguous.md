---
title: "Tensor 内存与变形：stride、view、reshape 与 contiguous"
author: Joekma
pubDatetime: 2026-08-09T00:20:00.000+08:00
modDatetime: 2026-08-09T00:20:00.000+08:00
slug: pytorch-03-tensor-memory
description: "理解 PyTorch Tensor 的 Storage、stride、视图与复制，厘清 view、reshape、transpose、expand 和原地操作的边界。"
tags: [AI, PyTorch, Tensor, Memory]
draft: false
series: PyTorch
seriesOrder: 3
language: zh-CN
---

## 本篇要解决的问题

为什么 `transpose()` 几乎不花时间，却可能让后面的 `view()` 报错？`reshape()` 有时不复制、有时复制，为什么不能依赖它的共享关系？`expand()` 如何“扩展”Tensor 而不真正分配重复数据？

上一节从 Shape 理解 Tensor，本篇再加入两层信息：**Storage 保存元素，stride 说明逻辑索引怎样映射到 Storage**。Shape 相同的 Tensor，内存访问方式可能完全不同。

### 前置知识

掌握 Tensor 的 Shape、dtype、device、索引与广播规则。

## Tensor 是 Storage 的带步长视图

以一个 `3×4` Tensor 为例：

```python
import torch

x = torch.arange(12).reshape(3, 4)
print(x)
print("shape:", x.shape)
print("stride:", x.stride())
print("offset:", x.storage_offset())
```

连续布局下 stride 通常为 `(4,1)`：第一维索引增加 1，需要在 Storage 中跨过 4 个元素；第二维增加 1，只跨过 1 个元素。元素地址可概念化为：

```text
storage_offset + row_index × 4 + column_index × 1
```

Tensor 不是简单持有“嵌套列表”。它保存 Storage、Shape、stride、offset、dtype 和 device 等元数据。多个 Tensor 可以用不同元数据解释同一块 Storage，这就是视图。

## 视图共享底层数据

`view()` 可以在不移动数据的前提下改变 Shape：

```python
x = torch.arange(12)
matrix = x.view(3, 4)

matrix[0, 0] = 99
assert x[0].item() == 99
assert matrix.untyped_storage().data_ptr() == x.untyped_storage().data_ptr()
```

修改视图会影响基 Tensor。共享是性能特征，也是状态风险。需要独立副本时使用：

```python
copy = matrix.clone()
copy[0, 0] = -1
assert matrix[0, 0].item() == 99
```

常见视图操作还包括基本切片、`transpose`、`permute`、`narrow`、`squeeze`、`unsqueeze`、`expand` 和 `flatten` 的部分情况。高级索引通常返回副本：

```python
basic = matrix[:, 1:3]           # 通常是视图
advanced = matrix[[0, 2], [1, 3]] # 高级索引产生新 Tensor
```

调用者不应只根据“写法看起来像切片”判断是否复制；需要长期保存或修改中间结果时，应显式决定是否 `clone()`。

## transpose 为什么产生非连续 Tensor

转置只交换 Shape 和 stride，不需要重排 Storage：

```python
x = torch.arange(12).reshape(3, 4)
y = x.transpose(0, 1)

assert y.shape == (4, 3)
assert x.stride() == (4, 1)
assert y.stride() == (1, 4)
assert not y.is_contiguous()
```

逻辑上的 `y[0,1]` 仍可以通过 stride 找到正确数据，但它不再符合默认的逐行连续布局。此时直接合并维度可能失败：

```python
try:
    y.view(-1)
except RuntimeError as error:
    print(error)
```

如果后续算子确实要求连续布局，可以显式复制：

```python
flat = y.contiguous().view(-1)
assert flat.is_contiguous()
```

`contiguous()` 在输入已经连续时通常返回原 Tensor，否则分配并复制数据。不要在每个操作后机械调用它；复制可能掩盖布局理解错误，并增加显存与带宽开销。

## view、reshape 与 flatten 的区别

三者都可能改变 Shape，但承诺不同：

- `view()` 要求现有 Shape 与 stride 能直接解释目标 Shape，否则报错；成功时共享 Storage。
- `reshape()` 优先返回视图，不能直接表示时会复制；调用者不应依赖结果究竟共享还是独立。
- `flatten()` 合并一段连续维度，也可能返回视图或副本。

```python
x = torch.randn(8, 1, 28, 28)
flat = x.flatten(start_dim=1)
assert flat.shape == (8, 784)
```

对模型接口而言，通常更关心结果 Shape 和数值，因此 `reshape`、`flatten` 很方便；对缓存、原地修改或内存优化而言，则必须明确共享关系。

在 FashionMNIST 全连接模型中，从 `[B,1,28,28]` 变成 `[B,784]` 时必须保留 Batch 轴。下面写法会把整个批次压成一维，破坏样本边界：

```python
wrong = x.reshape(-1)          # [B * 784]
correct = x.reshape(x.size(0), -1) # [B, 784]
```

## permute 只调整轴，不改变轴的含义

图像常见两种布局：

```text
PyTorch 常用: [N, C, H, W]
部分图像库:   [N, H, W, C]
```

可以用 `permute` 调整顺序：

```python
nchw = torch.randn(16, 3, 224, 224)
nhwc = nchw.permute(0, 2, 3, 1)
assert nhwc.shape == (16, 224, 224, 3)
```

这个操作没有“理解图像”，只是重排轴元数据。如果把 `H` 和 `W` 写反，正方形图片上 Shape 仍相同，错误可能直到换成长方形输入才暴露。因此测试 Shape 时应包含各维长度不同的样本，而不是全部使用 `8×8×8`。

## expand 与 repeat

`expand()` 利用 stride 为 0 的维度重复读取同一数据，不实际复制重复元素：

```python
bias = torch.arange(10).reshape(1, 10)
expanded = bias.expand(32, 10)

assert expanded.shape == (32, 10)
assert expanded.stride()[0] == 0
```

因为第一维所有行指向同一数据，不能把展开结果当作 32 份可独立修改的存储。`repeat()` 则真实复制：

```python
repeated = bias.repeat(32, 1)
assert repeated.shape == (32, 10)
```

广播通常使用类似 `expand` 的逻辑视图，因此广播本身可能很便宜；但随后的算子仍要计算完整输出。所谓“不复制”不等于“没有计算成本”。

## 原地操作与 Autograd 风险

以下划线结尾的方法通常是原地操作：

```python
x = torch.tensor([1.0, 2.0])
x.add_(1.0)
assert torch.equal(x, torch.tensor([2.0, 3.0]))
```

原地操作节省一个输出分配，但可能带来三个问题：

1. 其他视图会同步看到修改，状态影响范围比当前变量大。
2. Autograd 可能需要旧值计算梯度，原地覆盖会触发版本检查错误。
3. 编译器和并行执行更难分析带有别名和副作用的程序。

不要因为“显存紧张”就全面改成原地操作。应先用 Profiler 和内存工具找到真正占用，再判断该操作是否满足梯度与别名契约。

下面例子展示视图与原地修改的联动：

```python
base = torch.zeros(2, 3)
view = base[:, :2]
view.add_(5)

assert torch.equal(base[:, :2], torch.full((2, 2), 5.0))
```

## 用 Shape 契约限制变形

建议在模型边界记录轴名称，并在教学代码中断言：

```python
def flatten_images(images: torch.Tensor) -> torch.Tensor:
    if images.ndim != 4:
        raise ValueError(f"expected [B,C,H,W], got {tuple(images.shape)}")

    batch, channels, height, width = images.shape
    if (channels, height, width) != (1, 28, 28):
        raise ValueError("expected FashionMNIST images shaped [B,1,28,28]")

    return images.flatten(start_dim=1)
```

命名拆包比直接写 `images.view(-1,784)` 多几行，却能清楚表达哪个轴必须保留、输入格式是什么，以及失败时怎样诊断。

## 常见误区

- **`reshape` 一定复制或一定不复制**：两种情况都可能发生，不能依赖共享关系。
- **Shape 相同就表示布局相同**：stride 和连续性可能不同。
- **`contiguous()` 只是语法要求**：它可能产生一次真实的大规模复制。
- **`expand` 得到独立副本**：扩展维度可以使用 stride 0，多行实际指向同一数据。
- **原地操作必然更快**：副作用可能阻碍 Autograd 和编译优化，也可能根本不是瓶颈。

## 本篇自检

1. `transpose()` 为什么通常很快？
2. `reshape()` 成功后，能否断言它与输入共享 Storage？
3. `expand(32,10)` 为什么不代表已经分配 32 份 bias？

<details>
<summary>查看答案</summary>

1. 它通常只交换 Shape 和 stride 元数据，不重排底层元素。
2. 不能；它可能返回视图，也可能在无法直接表示时复制。
3. 单例维度可以通过 stride 0 重复读取同一位置；只有后续计算输出才覆盖完整逻辑 Shape。

</details>

## 小结与下一篇

Tensor 是对 Storage 的带步长解释。`view`、`transpose` 和 `expand` 的效率来自共享与元数据变换；同样的共享也使原地修改、连续性和 Autograd 更容易出错。理解 Shape 之后继续理解 stride，才能可靠解释模型中的变形与复制成本。

**下一篇：** [Autograd 自动微分：计算图、梯度与反向传播](/posts/ai/py-torch系列教程/pytorch-04-autograd/)

## 参考资料

- [Tensor Views](https://docs.pytorch.org/docs/stable/tensor_view.html)
- [`Tensor.view`](https://docs.pytorch.org/docs/stable/generated/torch.Tensor.view.html)
- [`Tensor.reshape`](https://docs.pytorch.org/docs/stable/generated/torch.Tensor.reshape.html)
- [Autograd Mechanics](https://docs.pytorch.org/docs/stable/notes/autograd.html)
