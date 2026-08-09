---
title: "PyTorch 2.x 入门：框架定位、环境安装与设备检查"
author: Joekma
pubDatetime: 2026-08-09T00:00:00.000+08:00
modDatetime: 2026-08-09T00:00:00.000+08:00
slug: pytorch-01-getting-started
description: "认识 PyTorch 2.x 的核心组件，完成 CPU、CUDA、MPS 环境选择与安装验证，并建立后续系列统一的设备检查方法。"
tags: [AI, PyTorch, Python, Deep Learning]
draft: false
series: PyTorch
seriesOrder: 1
language: zh-CN
---

## 本篇要解决的问题

PyTorch 是一个张量库、自动微分系统，还是完整的深度学习框架？安装页面为什么要选择操作系统、包管理器和计算平台？怎样判断当前 Python 进程真正识别了 GPU，而不是仅仅在电脑上安装过 CUDA？

本篇先建立全系列的坐标，再完成最小环境验证。后面十五篇会始终区分三个层次：**模型想表达什么、PyTorch API 怎样实现、当前硬件是否真的执行了预期计算**。

### 前置知识

读者需要能够创建 Python 虚拟环境、安装包并运行 `.py` 文件。暂时不要求了解神经网络、反向传播或 GPU 编程。

## PyTorch 在训练系统中的位置

PyTorch 的核心并不是某一种神经网络，而是一组可以组合的基础能力：

```text
数据 → Tensor → nn.Module → loss → autograd → optimizer → checkpoint
                                      ↓
                         accelerator / compile / distributed / export
```

- `torch.Tensor` 表示数据、参数和中间结果，并在 CPU 或加速器上执行算子。
- `torch.autograd` 记录张量运算，按链式法则计算梯度。
- `torch.nn` 提供层、损失函数和模型组织方式。
- `torch.optim` 根据梯度更新参数。
- `torch.utils.data` 负责样本、批次、采样和多进程加载。
- `torch.amp`、`torch.compile`、`torch.distributed` 分别处理混合精度、编译优化和分布式训练。
- `torch.export` 与 `torch.onnx` 把训练时的 Python 模型转换成更适合交付的图表示。

本系列以 PyTorch 2.13 为写作基线，但不会把刚发布且仍标为不稳定的功能当作必要前提。版本号决定可用 API，操作系统和硬件又决定具体后端，因此遇到问题时必须同时记录这三类信息。

## 建立隔离环境

建议每个学习项目使用独立虚拟环境。以下命令适用于 Python 自带的 `venv`：

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
```

Linux 和 macOS 的激活命令不同：

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
```

不要从旧文章复制一条固定的 CUDA 安装命令。进入 [Start Locally](https://pytorch.org/get-started/locally/)，依次选择操作系统、Pip、Python 和计算平台，再执行页面生成的命令。只需要 CPU 时选择 CPU；Windows 上使用 NVIDIA GPU 时选择驱动能够支持的 CUDA 构建；Apple Silicon 通常安装普通 macOS wheel，由 MPS 后端使用 Metal。

安装 FashionMNIST 示例需要 `torchvision`，因此至少安装：

```text
torch
torchvision
```

`torchaudio` 不在本系列范围内，不必为了“安装完整”而增加无关依赖。安装完成后可以保存环境快照，便于以后定位版本差异：

```powershell
python -m pip freeze > requirements-lock.txt
```

环境快照记录“当前装了什么”，不等于一个长期兼容性承诺。升级 PyTorch、Python 或显卡驱动时，应重新执行本篇的验证程序。

## 验证版本与设备

先确认导入的是虚拟环境中的包，再检查各后端：

```python
import platform
import sys

import torch
import torchvision

print("python:", sys.version.split()[0])
print("platform:", platform.platform())
print("torch:", torch.__version__)
print("torchvision:", torchvision.__version__)
print("cuda build:", torch.version.cuda)
print("cuda available:", torch.cuda.is_available())
print(
    "mps available:",
    hasattr(torch.backends, "mps") and torch.backends.mps.is_available(),
)
```

这里有两个容易混淆的结论：

1. `torch.version.cuda` 描述当前 PyTorch wheel 对应的 CUDA 运行时版本，不代表 GPU 一定可用。
2. `torch.cuda.is_available()` 为 `True` 才表示当前进程可以通过 PyTorch 使用 CUDA；仅有 `nvidia-smi` 输出还不够。

为了让后续代码在不同机器上运行，统一使用设备选择函数：

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
print("selected device:", device)
```

设备选择应该发生在程序入口，而不是散落在模型各层中。模型接收位于某个设备的 Tensor，并在同一设备上产生结果；训练器负责把模型和批次移动到目标设备。

## 第一个 Tensor 程序

创建一个二维 Tensor，移动到目标设备并完成矩阵乘法：

```python
x = torch.tensor(
    [[1.0, 2.0], [3.0, 4.0]],
    dtype=torch.float32,
    device=device,
)
weight = torch.eye(2, device=device)
y = x @ weight

assert y.shape == (2, 2)
assert y.device == x.device
assert torch.equal(x, y)
print(y)
```

这个例子虽小，却已经包含后续所有模型都要遵守的四个契约：

- **Shape**：每一维分别表示什么。
- **dtype**：元素采用什么数值类型。
- **device**：数据由哪个后端存储和计算。
- **语义**：矩阵两条轴的含义是否与运算一致。

`x @ weight` 能运行只说明维度满足矩阵乘法，不自动证明业务语义正确。后面会把 FashionMNIST 图像表示为 `[B, 1, 28, 28]`，其中 `B` 是批次大小；如果不记录轴语义，Shape 恰好兼容也可能算错。

## CUDA、驱动和本地 Toolkit 的边界

使用官方 wheel 时，常见误区是先安装完整 CUDA Toolkit，再期待任意 PyTorch wheel 自动匹配。实际要区分：

- NVIDIA 驱动负责让操作系统与 GPU 通信。
- PyTorch CUDA wheel 携带它所需的大部分 CUDA 运行时组件。
- 本地 `nvcc` 主要在编译自定义 CUDA 扩展时需要，本系列不涉及这一范围。

因此“本地装了 CUDA 13”并不能保证一个针对其他运行时构建的 wheel 可用；反过来，没有安装完整 Toolkit 也不代表官方 CUDA wheel 无法训练。排障时先核对驱动、wheel 构建和 `torch.cuda.is_available()`，不要从环境变量开始盲目修改。

## 贯穿案例的路线

本系列使用 FashionMNIST：每个样本是一张 `28×28` 灰度图，目标是十个服饰类别之一。它足够小，可以在 CPU 上验证数据和训练流程，也包含真实项目需要的输入、标签、验证集、Checkpoint、性能与导出问题。

后续不会每篇重写完整项目，而是逐步增加能力：

```text
Tensor → Autograd → Module → DataLoader → 训练循环
       → Checkpoint → 可复现 → 调试 → AMP → Profiler
       → compile → DDP/FSDP2 → export/ONNX
```

## 常见误区

- **把 PyTorch 与 CUDA 绑定**：CPU、MPS、XPU 等后端同样可以执行 PyTorch；CUDA 只是常用加速器之一。
- **用 `pip list` 代替运行验证**：包装上了不代表驱动、动态库和硬件路径已经可用。
- **全局设置默认 CUDA 设备**：教学项目更适合显式传递 `device`，避免第三方代码意外在 GPU 上分配内存。
- **追逐 Nightly 版本**：Nightly 适合验证新功能，不适合作为入门系列的默认环境。
- **一开始就追求训练速度**：先建立正确的 Shape、状态和结果基线，再讨论加速。

## 本篇自检

1. `torch.version.cuda` 有值，为什么 `torch.cuda.is_available()` 仍可能为 `False`？
2. 模型和输入分别位于 CUDA 与 CPU 时，为什么不应由 PyTorch静默复制其中一个？
3. 使用官方 wheel 训练普通模型时，是否一定要安装本地 `nvcc`？

<details>
<summary>查看答案</summary>

1. 前者只说明 wheel 的构建目标；驱动不可用、没有兼容 GPU 或设备被隐藏时，运行时检查仍会失败。
2. 隐式复制会产生难以察觉的性能和内存成本，也会让多设备语义变得不明确，因此调用者必须显式统一设备。
3. 不一定。官方 wheel 通常带有运行所需组件；编译自定义 CUDA 扩展才通常需要本地 Toolkit 和 `nvcc`。

</details>

## 小结与下一篇

PyTorch 把 Tensor、自动微分、模型、数据和训练工具组合成一套可逐层下探的系统。环境验证的目标不是打印一个漂亮的版本号，而是确认当前 Python 进程、PyTorch 构建和计算设备构成了可工作的闭环。

**下一篇：** [Tensor 心智模型：Shape、dtype、device 与广播](/posts/ai/py-torch系列教程/pytorch-02-tensor-fundamentals/)

## 参考资料

- [PyTorch 2.13 Release Blog](https://pytorch.org/blog/pytorch-2-13-release-blog/)
- [Start Locally](https://pytorch.org/get-started/locally/)
- [PyTorch Documentation](https://docs.pytorch.org/docs/stable/)
- [Learn the Basics](https://docs.pytorch.org/tutorials/beginner/basics/intro.html)
