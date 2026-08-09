---
title: "Dataset 与 DataLoader：构建可靠数据管道"
author: Joekma
pubDatetime: 2026-08-09T00:50:00.000+08:00
modDatetime: 2026-08-09T00:50:00.000+08:00
slug: pytorch-06-data-pipeline
description: "以 FashionMNIST 为例掌握 Dataset、Transform、Sampler、DataLoader、collate_fn、多进程加载和批次数据契约。"
tags: [AI, PyTorch, Dataset, DataLoader]
draft: false
series: PyTorch
seriesOrder: 6
language: zh-CN
---

## 本篇要解决的问题

Dataset 与 DataLoader 分别负责什么？训练集为什么可以 `shuffle=True`，验证集却要稳定顺序？`num_workers` 增大为什么不一定更快，甚至会在 Windows 上重复启动程序？变长样本为什么不能直接用默认批处理？

数据管道的职责不是“把文件读出来”，而是把原始样本稳定地转换成模型契约：

```text
原始样本 → Transform → Dataset item → Sampler 索引
        → collate_fn 组成 batch → 训练器迁移 device
```

### 前置知识

理解 Tensor 的 Shape/dtype/device，能够定义 `nn.Module` 的输入输出接口。

## Dataset 只描述单个样本

Map-style Dataset 需要实现两个核心方法：

```python
from pathlib import Path

import torch
from torch.utils.data import Dataset


class TensorFileDataset(Dataset):
    def __init__(self, paths: list[Path], labels: list[int]):
        if len(paths) != len(labels):
            raise ValueError("paths and labels must have the same length")
        self.paths = paths
        self.labels = labels

    def __len__(self) -> int:
        return len(self.paths)

    def __getitem__(self, index: int) -> tuple[torch.Tensor, int]:
        image = torch.load(self.paths[index], map_location="cpu")
        label = self.labels[index]
        return image, label
```

- `__len__` 给出可索引样本数。
- `__getitem__` 接收一个整数索引，返回一个样本。

Dataset 不应该把全部训练数据提前移动到 GPU。多进程 worker 在 CPU 上读取和预处理，训练循环再按 batch 迁移设备，才能控制显存并重叠数据准备与计算。

## 加载 FashionMNIST

`torchvision.datasets.FashionMNIST` 已实现下载、索引与标签读取。使用 transforms v2 把 PIL 图像转成浮点 Tensor 并归一化：

```python
import torch
from torchvision import datasets
from torchvision.transforms import v2

transform = v2.Compose(
    [
        v2.ToImage(),
        v2.ToDtype(torch.float32, scale=True),
        v2.Normalize(mean=(0.2860,), std=(0.3530,)),
    ]
)

train_full = datasets.FashionMNIST(
    root="data",
    train=True,
    download=True,
    transform=transform,
)

test_dataset = datasets.FashionMNIST(
    root="data",
    train=False,
    download=True,
    transform=transform,
)
```

`scale=True` 把整数像素缩放到浮点范围，再按训练集统计量标准化。顺序不能随意交换：如果先对 `uint8` 直接减浮点均值，类型和数值范围就不符合预期。

检查单样本契约：

```python
image, label = train_full[0]

assert image.shape == (1, 28, 28)
assert image.dtype == torch.float32
assert isinstance(label, int)
assert 0 <= label < 10
```

可视化标准化后的图像时，应先反标准化；否则画面偏暗或偏亮不代表数据读取错误。

## 划分训练集与验证集

测试集只用于最终估计，不能承担调参职责。把官方训练集固定划分为训练与验证部分：

```python
from torch.utils.data import random_split

generator = torch.Generator().manual_seed(42)
train_dataset, val_dataset = random_split(
    train_full,
    lengths=[55_000, 5_000],
    generator=generator,
)

assert len(train_dataset) + len(val_dataset) == len(train_full)
```

保存随机种子还不如保存实际索引稳妥：跨版本或更换划分逻辑时，只有索引能精确说明哪些样本进入哪一部分。第 10 篇会进一步讨论可复现性。

如果训练需要随机数据增强，而验证只需要确定性变换，不应直接对同一个带随机 transform 的 Dataset 做 `random_split`。可让两个 Dataset 实例共享原始数据和固定索引，但使用不同 transform。

## DataLoader 组织批次

```python
from torch.utils.data import DataLoader

train_loader = DataLoader(
    train_dataset,
    batch_size=128,
    shuffle=True,
    num_workers=0,
    drop_last=False,
)

val_loader = DataLoader(
    val_dataset,
    batch_size=256,
    shuffle=False,
    num_workers=0,
)
```

默认 `collate_fn` 会把样本 Tensor 沿新 Batch 轴堆叠，把 Python 整数标签转换为 Tensor：

```python
images, labels = next(iter(train_loader))

assert images.shape == (128, 1, 28, 28)
assert labels.shape == (128,)
assert labels.dtype == torch.int64
```

训练集打乱是为了避免固定顺序与梯度更新耦合；验证集不需要打乱，稳定顺序更利于复现样本级错误。`drop_last=True` 会丢弃不足一个 batch 的尾部样本，只有当模型或 BatchNorm 明确需要固定 batch 时才使用；评估绝不能无意丢样本。

## shuffle 与 Sampler 的关系

DataLoader 不负责决定数据内容，而是根据 Sampler 产生的索引取样。`shuffle=True` 是使用随机采样顺序的便捷配置；传入 `sampler=` 后不能同时设置 `shuffle=True`。

类别不平衡时可使用 `WeightedRandomSampler`，分布式训练则使用 `DistributedSampler`。采样改变训练分布，但不会自动改变验证指标含义。过采样后必须清楚区分：模型看到了什么分布，最终评估使用什么真实分布。

固定一个 epoch 中的数据顺序可以显式传入 Generator：

```python
loader_generator = torch.Generator().manual_seed(2026)

train_loader = DataLoader(
    train_dataset,
    batch_size=128,
    shuffle=True,
    generator=loader_generator,
)
```

恢复训练若要求延续相同采样序列，还要保存 Generator 或 Sampler 状态，而不是只保存模型权重。

## 自定义 collate_fn

默认堆叠要求同一字段 Shape 一致。FashionMNIST 图片固定为 `1×28×28`，无需自定义；文本、检测框或不同尺寸图片则需要填充或保留列表。

下面把变长一维序列填充到 batch 内最大长度，并同时返回真实长度：

```python
from torch.nn.utils.rnn import pad_sequence


def collate_sequences(
    samples: list[tuple[torch.Tensor, int]],
) -> tuple[torch.Tensor, torch.Tensor, torch.Tensor]:
    sequences, labels = zip(*samples, strict=True)
    lengths = torch.tensor([len(sequence) for sequence in sequences])
    padded = pad_sequence(
        sequences,
        batch_first=True,
        padding_value=0,
    )
    return padded, lengths, torch.tensor(labels, dtype=torch.int64)
```

`collate_fn` 是 batch 契约边界。它可以做轻量整理，但不适合执行需要 GPU 的模型计算；复杂预处理应考虑离线完成或在 Dataset worker 中执行。

## 多进程加载

`num_workers=0` 表示主进程同步读取，最容易调试。大于 0 时，DataLoader 启动 worker 并行准备样本。合适值取决于存储、CPU、变换成本、batch size 和操作系统，不能简单设置成 CPU 核数。

Windows 与 macOS 常用 spawn 启动进程，入口必须受保护：

```python
def main() -> None:
    loader = DataLoader(
        train_dataset,
        batch_size=128,
        num_workers=4,
        persistent_workers=True,
    )
    for images, labels in loader:
        pass


if __name__ == "__main__":
    main()
```

Dataset、transform 和 `collate_fn` 应定义在模块顶层，使它们能够被序列化。Notebook 中多进程问题较多时，先退回 `num_workers=0` 验证正确性。

`persistent_workers=True` 避免每个 epoch 重建 worker，但只有 `num_workers>0` 时可用。它提高持续训练效率，也意味着 Dataset worker 内部状态会跨 epoch 保留。

## pinned memory 与设备迁移

CUDA 训练常用 page-locked CPU 内存加速异步拷贝：

```python
use_cuda = torch.cuda.is_available()

train_loader = DataLoader(
    train_dataset,
    batch_size=128,
    shuffle=True,
    pin_memory=use_cuda,
)

for images, labels in train_loader:
    images = images.to("cuda", non_blocking=True)
    labels = labels.to("cuda", non_blocking=True)
```

`non_blocking=True` 只是允许在满足条件时异步，不保证整个训练自动与拷贝重叠。Pinned memory 也占用有限的主机资源；CPU、MPS 路径通常不应机械开启。第 13 篇会用 Profiler 判断数据管道是否真是瓶颈。

## 在边界检查数据

建议在正式训练前检查多个 batch，而不是只看第一条：

```python
def validate_batch(images: torch.Tensor, labels: torch.Tensor) -> None:
    assert images.ndim == 4
    assert images.shape[1:] == (1, 28, 28)
    assert images.dtype == torch.float32
    assert labels.ndim == 1
    assert labels.dtype == torch.int64
    assert images.shape[0] == labels.shape[0]
    assert torch.isfinite(images).all()
    assert labels.min().item() >= 0
    assert labels.max().item() < 10
```

还应统计类别分布、像素范围、缺失样本和重复标识。Dataset 能返回一个正确样本，不代表整体数据分布正确。

## 常见误区

- **Dataset 应返回 batch**：Dataset 通常返回单样本，DataLoader 负责批处理。
- **验证集也 `shuffle=True` 更公平**：验证指标与顺序无关，稳定顺序更利于诊断。
- **worker 越多越快**：进程、序列化和 I/O 竞争可能让吞吐下降。
- **Pinned memory 对所有设备有利**：它主要服务于主机到 CUDA 的传输。
- **随机增强可直接共享给验证集**：训练和验证需要不同的随机性契约。
- **DataLoader 会自动移动 GPU**：设备迁移由训练循环负责。

## 本篇自检

1. Dataset 与 DataLoader 的最小职责分别是什么？
2. 为什么分类验证集通常不能设置 `drop_last=True`？
3. 变长序列为什么需要自定义 `collate_fn`？

<details>
<summary>查看答案</summary>

1. Dataset 把索引映射为单样本；DataLoader 根据采样顺序读取样本并组成批次。
2. 它会丢掉尾部真实样本，使指标不再覆盖完整验证集。
3. 默认堆叠要求 Shape 相同，需要先填充、返回长度或保留列表才能形成合法批次。

</details>

## 小结与下一篇

可靠数据管道需要分别管理单样本、采样、批处理、多进程和设备迁移。FashionMNIST 的固定 Shape 很简单，但这套职责分离可以直接迁移到文本、检测和自定义数据集。下一篇把 `[B,10]` logits 与 `[B]` 标签连接成损失和参数更新。

**下一篇：** [损失函数、优化器与学习率调度](/posts/ai/py-torch系列教程/pytorch-07-loss-optimizer/)

## 参考资料

- [Datasets & DataLoaders](https://docs.pytorch.org/tutorials/beginner/basics/data_tutorial.html)
- [`torch.utils.data`](https://docs.pytorch.org/docs/stable/data.html)
- [Data Loading Optimization](https://docs.pytorch.org/tutorials/recipes/recipes/tuning_guide.html)
- [Torchvision Transforms v2](https://docs.pytorch.org/vision/stable/transforms.html)
