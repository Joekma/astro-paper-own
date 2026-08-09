---
title: "标准训练循环：从 FashionMNIST 到首个分类器"
author: Joekma
pubDatetime: 2026-08-09T01:10:00.000+08:00
modDatetime: 2026-08-09T01:10:00.000+08:00
slug: pytorch-08-training-loop
description: "把 FashionMNIST 数据、nn.Module、交叉熵和 AdamW 组合成完整训练、验证、指标、早停与单样本推理闭环。"
tags: [AI, PyTorch, FashionMNIST, Training Loop]
draft: false
series: PyTorch
seriesOrder: 8
language: zh-CN
---

## 本篇要解决的问题

怎样写出职责清楚的训练与验证循环？为什么 epoch loss 不能直接平均 batch loss？早停应该观察训练集、验证集还是测试集？推理时除了 `eval()` 和 `inference_mode()`，还需要保存哪些输入契约？

前七篇已经准备好所有零件，本篇第一次形成端到端闭环：

```text
FashionMNIST → DataLoader → FashionMLP → CrossEntropyLoss
             → backward → AdamW → validation → prediction
```

### 前置知识

掌握 Tensor、Autograd、`nn.Module`、DataLoader、交叉熵与优化器的基本接口。

## 固定配置和设备

先把会影响训练的选择集中起来：

```python
from dataclasses import dataclass

import torch


@dataclass(frozen=True)
class Config:
    batch_size: int = 128
    learning_rate: float = 3e-4
    weight_decay: float = 1e-2
    epochs: int = 20
    patience: int = 3
    seed: int = 42


config = Config()
torch.manual_seed(config.seed)
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
```

这里只固定 PyTorch CPU/CUDA 随机数，尚未承诺完整可复现；第 10 篇会补齐 Python、NumPy、DataLoader worker 和确定性算法。

## 准备数据

```python
from torch.utils.data import DataLoader, random_split
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
    "data", train=True, download=True, transform=transform
)
test_dataset = datasets.FashionMNIST(
    "data", train=False, download=True, transform=transform
)

split_generator = torch.Generator().manual_seed(config.seed)
train_dataset, val_dataset = random_split(
    train_full,
    [55_000, 5_000],
    generator=split_generator,
)

train_loader = DataLoader(
    train_dataset,
    batch_size=config.batch_size,
    shuffle=True,
)
val_loader = DataLoader(
    val_dataset,
    batch_size=256,
    shuffle=False,
)
test_loader = DataLoader(
    test_dataset,
    batch_size=256,
    shuffle=False,
)
```

训练集用于产生梯度，验证集用于选择超参数与停止时机，测试集只在方案确定后做最终评估。若每个 epoch 都查看测试集并调整模型，测试集实际上已经变成验证集。

## 定义模型与训练组件

```python
import torch.nn as nn


class FashionMLP(nn.Module):
    def __init__(self):
        super().__init__()
        self.network = nn.Sequential(
            nn.Flatten(start_dim=1),
            nn.Linear(28 * 28, 256),
            nn.ReLU(),
            nn.Dropout(0.1),
            nn.Linear(256, 10),
        )

    def forward(self, images: torch.Tensor) -> torch.Tensor:
        return self.network(images)


model = FashionMLP().to(device)
criterion = nn.CrossEntropyLoss()
optimizer = torch.optim.AdamW(
    model.parameters(),
    lr=config.learning_rate,
    weight_decay=config.weight_decay,
)
```

训练前执行一次接口检查，尽早发现 Shape 和设备问题：

```python
sample_images, sample_targets = next(iter(train_loader))
sample_logits = model(sample_images.to(device))

assert sample_logits.shape == (sample_images.size(0), 10)
assert sample_logits.device == device
assert sample_targets.dtype == torch.int64
```

这次前向仍在默认训练模式，会执行 Dropout 并建立计算图。纯接口检查可以临时进入 `eval()` 和 `inference_mode()`，检查后再切回训练模式。

## 训练一个 epoch

```python
def train_one_epoch(
    model: nn.Module,
    loader: DataLoader,
    criterion: nn.Module,
    optimizer: torch.optim.Optimizer,
    device: torch.device,
) -> dict[str, float]:
    model.train()
    loss_sum = 0.0
    correct = 0
    sample_count = 0

    for images, targets in loader:
        images = images.to(device)
        targets = targets.to(device)

        optimizer.zero_grad(set_to_none=True)
        logits = model(images)
        loss = criterion(logits, targets)
        loss.backward()
        optimizer.step()

        batch_size = images.size(0)
        loss_sum += loss.detach().item() * batch_size
        correct += (logits.argmax(dim=1) == targets).sum().item()
        sample_count += batch_size

    return {
        "loss": loss_sum / sample_count,
        "accuracy": correct / sample_count,
    }
```

几个细节值得单独说明：

- `model.train()` 每个 epoch 显式调用，避免之前的验证模式泄漏。
- 指标只读取 `detach()` 后的值，不把整个 epoch 的计算图保存在列表里。
- loss 先乘当前 batch size，再除总样本数，正确处理尾部小 batch。
- 准确率使用样本计数累积，不平均各 batch 准确率。

不应在每个 step 调用 `torch.cuda.empty_cache()`。缓存分配器保留内存是为了复用，频繁清理通常降低性能，也不能修复仍被 Tensor 引用的显存泄漏。

## 验证循环

```python
def evaluate(
    model: nn.Module,
    loader: DataLoader,
    criterion: nn.Module,
    device: torch.device,
) -> dict[str, float]:
    model.eval()
    loss_sum = 0.0
    correct = 0
    sample_count = 0

    with torch.inference_mode():
        for images, targets in loader:
            images = images.to(device)
            targets = targets.to(device)

            logits = model(images)
            loss = criterion(logits, targets)

            batch_size = images.size(0)
            loss_sum += loss.item() * batch_size
            correct += (logits.argmax(dim=1) == targets).sum().item()
            sample_count += batch_size

    return {
        "loss": loss_sum / sample_count,
        "accuracy": correct / sample_count,
    }
```

验证没有 `zero_grad`、`backward` 和 `optimizer.step`。`inference_mode()` 阻止构图，`eval()` 关闭 Dropout 的随机行为。评估函数不自动把模型切回训练模式；下一次 `train_one_epoch` 在入口显式恢复，更容易审计状态。

## 训练主循环与早停

早停观察验证损失，并在内存中保存最佳权重副本：

```python
import copy

best_val_loss = float("inf")
best_state = None
epochs_without_improvement = 0

for epoch in range(1, config.epochs + 1):
    train_metrics = train_one_epoch(
        model, train_loader, criterion, optimizer, device
    )
    val_metrics = evaluate(model, val_loader, criterion, device)

    print(
        f"epoch={epoch:02d} "
        f"train_loss={train_metrics['loss']:.4f} "
        f"train_acc={train_metrics['accuracy']:.4f} "
        f"val_loss={val_metrics['loss']:.4f} "
        f"val_acc={val_metrics['accuracy']:.4f}"
    )

    if val_metrics["loss"] < best_val_loss:
        best_val_loss = val_metrics["loss"]
        best_state = copy.deepcopy(model.state_dict())
        epochs_without_improvement = 0
    else:
        epochs_without_improvement += 1

    if epochs_without_improvement >= config.patience:
        print("early stopping")
        break

if best_state is None:
    raise RuntimeError("training produced no valid checkpoint")

model.load_state_dict(best_state)
```

必须 `deepcopy`。`state_dict()` 中的 Tensor 与模型状态有关联，如果只保存字典引用，后续训练可能让所谓“最佳状态”继续变化。第 9 篇会把它写入磁盘，并保存优化器和训练进度。

早停不是判断模型“已经学会”的证明。它只是根据有限验证集和 patience 规则控制训练预算。验证波动很大时，还应考虑最小改进量、平滑指标或更稳定的数据划分。

## 最终测试

模型选择结束后，才在测试集执行一次：

```python
test_metrics = evaluate(model, test_loader, criterion, device)
print(
    f"test_loss={test_metrics['loss']:.4f} "
    f"test_acc={test_metrics['accuracy']:.4f}"
)
```

一个总准确率不足以解释错误。可以累计混淆矩阵：

```python
def update_confusion_matrix(
    matrix: torch.Tensor,
    predictions: torch.Tensor,
    targets: torch.Tensor,
) -> None:
    class_count = matrix.size(0)
    indices = targets.cpu() * class_count + predictions.cpu()
    counts = torch.bincount(
        indices,
        minlength=class_count * class_count,
    )
    matrix += counts.reshape(class_count, class_count)
```

矩阵的行约定为真实类别、列约定为预测类别。报告前必须写清方向，否则同一张矩阵会被相反解释。

## 单样本推理

训练和推理必须使用相同预处理：

```python
class_names = train_full.classes

image, target = test_dataset[0]
batch = image.unsqueeze(0).to(device)

model.eval()
with torch.inference_mode():
    logits = model(batch)
    probabilities = logits.softmax(dim=1)
    predicted_index = probabilities.argmax(dim=1).item()
    confidence = probabilities[0, predicted_index].item()

print("predicted:", class_names[predicted_index])
print("target:", class_names[target])
print("confidence:", confidence)
```

`unsqueeze(0)` 恢复 Batch 轴。所谓 confidence 只是模型 Softmax 输出，不自动等于真实正确概率；模型校准需要单独评估。

服务接收原始图片时，还必须复现灰度转换、尺寸、缩放和归一化。只交付权重而不交付预处理合同，会出现“Notebook 准确、服务错误”的典型训练—推理偏差。

## 训练日志应回答什么

最低限度记录：

- epoch、optimizer update 数和学习率；
- 训练/验证 loss 与样本级指标；
- 当前最佳指标和早停计数；
- 数据划分、模型配置、随机种子、PyTorch/torchvision 版本；
- 设备类型和总耗时。

日志不是为了让终端更热闹，而是为了回答“这次结果由什么配置产生、为什么停止、能否与另一次比较”。第 10 篇会把这些字段写成结构化实验记录。

## 常见误区

- **平均 batch loss 得到 epoch loss**：尾部 batch 大小不同时会产生偏差。
- **验证时只用 `no_grad`，忘记 `eval`**：Dropout 和 BatchNorm 行为仍是训练模式。
- **早停观察测试集**：会把测试信息用于模型选择。
- **保存 `state_dict` 引用就是最佳模型**：内存快照需要深复制，磁盘快照需要序列化。
- **推理只需要权重**：还必须固定模型结构、类别映射和预处理。
- **Softmax 置信度就是正确概率**：未经校准不能这样解释。

## 本篇自检

1. 为什么 epoch loss 要按 batch 样本数加权？
2. 为什么早停恢复的是最佳验证状态，而不是保留最后一个 epoch？
3. 单张 `[1,28,28]` 图片为什么要先变成 `[1,1,28,28]`？

<details>
<summary>查看答案</summary>

1. `reduction="mean"` 得到的是 batch 均值，尾部 batch 可能更小；只有按样本加总后再除总数才是全体均值。
2. 最后一次训练可能已经过拟合或波动变差，早停的选择规则以最佳验证指标为准。
3. Module 契约包含 Batch 轴，`unsqueeze(0)` 表示一个样本的批次。

</details>

## 小结与下一篇

至此已经得到正确的训练闭环：训练模式产生梯度与更新，验证模式计算完整样本指标，早停只使用验证集，最终测试与推理复用同一输入契约。下一篇把单文件基线拆成可维护项目，并让 Checkpoint 真正支持中断恢复。

**下一篇：** [从训练脚本到工程项目：配置、Checkpoint 与断点续训](/posts/ai/py-torch系列教程/pytorch-09-checkpoint-project/)

## 参考资料

- [Quickstart](https://docs.pytorch.org/tutorials/beginner/basics/quickstart_tutorial.html)
- [Optimization Loop](https://docs.pytorch.org/tutorials/beginner/basics/optimization_tutorial.html)
- [Saving and Loading Models](https://docs.pytorch.org/tutorials/beginner/saving_loading_models.html)
- [FashionMNIST](https://docs.pytorch.org/vision/stable/generated/torchvision.datasets.FashionMNIST.html)
