---
title: "从训练脚本到工程项目：配置、Checkpoint 与断点续训"
author: Joekma
pubDatetime: 2026-08-09T01:20:00.000+08:00
modDatetime: 2026-08-09T01:20:00.000+08:00
slug: pytorch-09-checkpoint-project
description: "把 FashionMNIST 单文件脚本拆分为可维护项目，设计模型权重、训练 Checkpoint、原子保存、加载兼容性和断点续训流程。"
tags: [AI, PyTorch, Checkpoint, MLOps]
draft: false
series: PyTorch
seriesOrder: 9
language: zh-CN
---

## 本篇要解决的问题

只保存 `model.state_dict()` 为什么不能无缝续训？训练 Checkpoint 应包含哪些状态，加载顺序为什么会影响优化器？如何区分“最佳模型”“最近进度”和“用于推理的权重”？

单文件脚本适合验证闭环，长期项目则需要把变化频率不同的职责拆开：

```text
配置 → 数据 → 模型 → 训练/验证引擎 → Checkpoint → CLI 入口
```

工程化不是增加目录数量，而是让每种状态只有一个所有者，并能回答“中断后从哪里继续”。

### 前置知识

已经完成 FashionMNIST 训练循环，理解 `state_dict`、优化器状态和早停的最佳模型概念。

## 从单文件拆分职责

一个轻量项目可以采用：

```text
pytorch_fashion/
├─ config.py       # Config 与参数校验
├─ data.py         # Dataset、划分、DataLoader
├─ model.py        # FashionMLP
├─ engine.py       # train_one_epoch、evaluate
├─ checkpoint.py   # save、load、resume
├─ train.py        # 训练入口
└─ predict.py      # 推理入口
```

拆分依据是依赖方向，而不是文件行数：

- `model.py` 不读取命令行、不创建 DataLoader，也不决定 Checkpoint 路径。
- `data.py` 输出符合模型契约的 batch，但不执行优化器更新。
- `engine.py` 接收已经构造的 Module、DataLoader 和优化器，不猜测全局配置。
- `train.py` 负责组合对象、选择设备、恢复状态并驱动 epoch。

这种结构仍然很小，却能让数据、模型和训练循环分别被复用。不要一开始引入复杂注册表和依赖注入框架；只有真实变化点出现后再增加抽象。

## 配置是实验输入

```python
from dataclasses import asdict, dataclass


@dataclass(frozen=True)
class Config:
    batch_size: int = 128
    hidden_size: int = 256
    dropout: float = 0.1
    learning_rate: float = 3e-4
    weight_decay: float = 1e-2
    epochs: int = 20
    seed: int = 42

    def validate(self) -> None:
        if self.batch_size <= 0:
            raise ValueError("batch_size must be positive")
        if self.hidden_size <= 0:
            raise ValueError("hidden_size must be positive")
        if not 0 <= self.dropout < 1:
            raise ValueError("dropout must be in [0, 1)")
        if self.learning_rate <= 0:
            raise ValueError("learning_rate must be positive")


config = Config()
config.validate()
config_dict = asdict(config)
```

配置要能序列化为普通标量和容器。不要把已构造的 Module、函数闭包或设备对象塞进配置；它们属于运行时对象，不是稳定实验定义。

恢复时必须比较影响结构的字段，例如 `hidden_size`。batch size 可以变化，但会改变优化轨迹；即使技术上能恢复，也要在运行记录中标注配置变更。

## 三类保存物

### 推理权重

只保存模型状态，体积小、边界清晰：

```python
torch.save(model.state_dict(), "fashion_mlp_weights.pt")
```

加载端需要同一模型定义和兼容配置。它适合推理、发布与微调起点，不包含训练进度。

### 最近训练进度

`latest.pt` 用于断点续训，应覆盖：

```python
checkpoint = {
    "format_version": 1,
    "epoch": epoch,
    "global_step": global_step,
    "model": model.state_dict(),
    "optimizer": optimizer.state_dict(),
    "scheduler": scheduler.state_dict(),
    "best_val_loss": best_val_loss,
    "epochs_without_improvement": epochs_without_improvement,
    "config": asdict(config),
    "class_names": train_dataset.classes,
    "torch_rng_state": torch.get_rng_state(),
}

if torch.cuda.is_available():
    checkpoint["cuda_rng_state_all"] = torch.cuda.get_rng_state_all()
```

若使用 AMP，还要保存 GradScaler；若使用自定义 Sampler，还要保存其进度。原则是：**下一次更新会读取的可变状态，都必须恢复或明确重新初始化**。

### 最佳模型

`best.pt` 由验证选择规则更新。它可以保存完整训练状态，也可以只保存推理权重。不要让 `latest.pt` 与 `best.pt` 指向同一个含义模糊的文件：中断恢复需要最新进度，最终评估需要最佳验证状态，两者经常不是同一 epoch。

## 原子保存避免半个文件

进程可能在写文件时被终止。先写同目录临时文件，再用原子替换减少损坏窗口：

```python
import os
from pathlib import Path
from typing import Any


def atomic_torch_save(state: dict[str, Any], path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".tmp")
    torch.save(state, temporary)
    os.replace(temporary, path)
```

同一文件系统内的 `os.replace` 通常是原子替换。它不能替代远程对象存储的事务语义，也不能防止文件内容逻辑不完整；保存前仍应先构造完整字典，并在分布式训练中只让指定 rank 写入。

保留最近若干带 epoch 的快照，可以防止 `latest.pt` 虽然写成功但训练状态本身已异常：

```text
checkpoints/
├─ latest.pt
├─ best.pt
├─ epoch-0005.pt
└─ epoch-0010.pt
```

## 加载顺序

恢复训练的推荐顺序：

```text
读取 Checkpoint 元数据
→ 用兼容配置构造模型
→ 模型移动到目标设备
→ 构造 optimizer 和 scheduler
→ 加载各自 state_dict
→ 恢复进度与随机状态
→ 从 epoch + 1 继续
```

示例：

```python
from pathlib import Path
from typing import Any


def load_training_checkpoint(
    path: Path,
    model: torch.nn.Module,
    optimizer: torch.optim.Optimizer,
    scheduler: torch.optim.lr_scheduler.LRScheduler,
    device: torch.device,
) -> dict[str, Any]:
    checkpoint = torch.load(
        path,
        map_location=device,
        weights_only=True,
    )

    if checkpoint["format_version"] != 1:
        raise ValueError("unsupported checkpoint format")

    incompatible = model.load_state_dict(checkpoint["model"], strict=True)
    if incompatible.missing_keys or incompatible.unexpected_keys:
        raise RuntimeError(f"incompatible model state: {incompatible}")

    optimizer.load_state_dict(checkpoint["optimizer"])
    scheduler.load_state_dict(checkpoint["scheduler"])
    torch.set_rng_state(checkpoint["torch_rng_state"].cpu())

    if device.type == "cuda" and "cuda_rng_state_all" in checkpoint:
        torch.cuda.set_rng_state_all(checkpoint["cuda_rng_state_all"])

    return checkpoint
```

构造优化器时，它必须拿到当前模型的 Parameter 引用；因此不能加载一个优化器后再创建新模型。Scheduler 往往依赖优化器的当前学习率和 step 计数，也要恢复。

`map_location` 让 GPU 保存物可以在 CPU 上检查。加载推理权重时先映射到 CPU，再按部署设备移动，通常更节省峰值显存。

## 恢复主循环

```python
start_epoch = 1
global_step = 0
best_val_loss = float("inf")
epochs_without_improvement = 0

resume_path = Path("checkpoints/latest.pt")
if resume_path.exists():
    state = load_training_checkpoint(
        resume_path,
        model,
        optimizer,
        scheduler,
        device,
    )
    start_epoch = int(state["epoch"]) + 1
    global_step = int(state["global_step"])
    best_val_loss = float(state["best_val_loss"])
    epochs_without_improvement = int(
        state["epochs_without_improvement"]
    )

for epoch in range(start_epoch, config.epochs + 1):
    train_metrics = train_one_epoch(...)
    val_metrics = evaluate(...)
    scheduler.step()

    atomic_torch_save(
        build_checkpoint(...),
        Path("checkpoints/latest.pt"),
    )
```

明确 `epoch` 表示“已完成的 epoch”，恢复时从 `epoch+1` 开始。若保存发生在 epoch 中间，还必须记录 batch/Sampler 位置和梯度累积状态；本系列采用 epoch 边界保存，以换取更简单可靠的语义。

## 配置兼容性检查

模型权重 Shape 会捕获部分结构差异，但不能捕获所有语义变化。例如类别顺序改变后，最后一层仍是 `[10,256]`，严格加载完全成功，输出含义却已错位。

至少比较：

```python
def validate_resume_config(
    current: Config,
    saved: dict[str, object],
) -> None:
    structural_fields = ("hidden_size",)
    for field in structural_fields:
        current_value = getattr(current, field)
        saved_value = saved[field]
        if current_value != saved_value:
            raise ValueError(
                f"config mismatch for {field}: "
                f"current={current_value}, saved={saved_value}"
            )
```

还要比较类别名称、预处理版本、数据划分标识和模型代码版本。无法自动比较的变更，应更新 `format_version` 并编写显式迁移，而不是长期依赖 `strict=False`。

## Checkpoint 不是安全容器

传统 PyTorch 序列化基于 Pickle，加载不可信文件可能执行恶意代码。现代 `torch.load(..., weights_only=True)` 限制反序列化范围，应作为权重和纯状态字典的默认选择；只有文件来源可信且确实包含自定义对象时，才考虑关闭该限制。

不要把任意 Python Module 实例直接 `torch.save(model, ...)` 作为长期格式。它把文件与类路径和实现细节强绑定，也扩大加载风险。`state_dict + 明确配置 + 版本字段` 更适合维护。

## 常见误区

- **只保存模型即可续训**：优化器、调度器、Scaler、随机状态和进度都会影响下一步。
- **latest 就是 best**：最近进度服务恢复，最佳状态服务选择与发布。
- **`strict=False` 能解决兼容性**：它只能跳过键差异，无法解释类别或预处理语义变化。
- **保存成功就一定可恢复**：还要有格式版本、配置与加载流程。
- **任意 Checkpoint 都能放心加载**：不可信 Pickle 存在代码执行风险。
- **中间 batch 保存和 epoch 边界保存一样简单**：前者还需保存采样位置、累积梯度等状态。

## 本篇自检

1. 为什么优化器必须在当前模型 Parameter 上构造后再加载状态？
2. `latest.pt` 和 `best.pt` 应分别回答什么问题？
3. 模型权重 Shape 完全兼容，为什么类别映射仍可能错误？

<details>
<summary>查看答案</summary>

1. 优化器持有 Parameter 引用，状态需要映射到这些当前参数；先加载旧优化器再换模型会保留错误引用。
2. latest 回答“中断后从哪里继续”，best 回答“验证规则选择了哪个模型用于最终评估或交付”。
3. 输出层维度相同不能证明索引语义相同，类别顺序可能已变化。

</details>

## 小结与下一篇

可恢复训练是状态协议，而不只是一行 `torch.save`。模型、优化器、调度器、进度、配置和类别映射必须形成版本化整体；最佳模型与最近进度需要分开管理。下一篇进一步固定随机性、数据划分和实验记录，让“恢复”扩展为“可解释地复现”。

**下一篇：** [可复现训练与实验管理](/posts/ai/py-torch系列教程/pytorch-10-reproducibility/)

## 参考资料

- [Saving and Loading Models](https://docs.pytorch.org/tutorials/beginner/saving_loading_models.html)
- [Serialization Semantics](https://docs.pytorch.org/docs/stable/notes/serialization.html)
- [Tips for Loading an nn.Module from a Checkpoint](https://docs.pytorch.org/tutorials/recipes/recipes/module_load_state_dict_tips.html)
- [`torch.load`](https://docs.pytorch.org/docs/stable/generated/torch.load.html)
