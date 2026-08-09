---
title: "模型导出与推理交付：torch.export、ONNX 与一致性验证"
author: Joekma
pubDatetime: 2026-08-09T02:30:00.000+08:00
modDatetime: 2026-08-09T02:30:00.000+08:00
slug: pytorch-16-export-deployment
description: "固定 FashionMNIST 推理契约，使用 torch.export 与 ONNX 导出动态 Batch 模型，并理解数值一致性、预处理、版本和部署边界。"
tags: [AI, PyTorch, torch.export, ONNX]
draft: false
series: PyTorch
seriesOrder: 16
language: zh-CN
---

## 本篇要解决的问题

保存 `state_dict`、`torch.export` 和 ONNX 分别交付了什么？训练模型为什么不能直接连同 PIL 预处理和任意 Python 控制流一起导出？动态 batch 怎样声明约束，导出后又如何证明产物仍符合 Eager 模型的输入输出合同？

部署不是“换一个文件后缀”，而是把训练时隐含假设变成显式协议：

```text
原始输入 → 预处理 → Tensor 契约 → 推理图 → logits
        → 后处理/类别映射 → 运行时 → 监控与版本
```

### 前置知识

已经训练并选择 FashionMNIST 最佳权重，理解 `eval()`、`inference_mode()`、Checkpoint、动态 Shape 与编译图边界。

## 三种产物回答不同问题

| 产物 | 保存内容 | 加载端需要什么 | 主要用途 |
| --- | --- | --- | --- |
| `state_dict` | 参数与 Buffer | Python 模型定义、兼容配置 | PyTorch 推理、续训、迁移 |
| `ExportedProgram` | 规范化 Tensor 计算图与 Shape 约束 | 支持 torch.export 的运行链路 | AOT 变换、PyTorch 部署生态 |
| ONNX | 标准化跨运行时计算图 | ONNX Runtime 等执行器 | 跨语言、跨框架推理 |

没有一种格式自动包含业务类别名称、图片解码、服务鉴权、批处理队列或监控。模型产物必须与部署清单一起交付。

## 固定推理模块

训练 Dataset 已把像素缩放、归一化放在 transform 中。为了减少服务端偏差，可以让导出模块接收 `[0,1]` 范围的浮点灰度 Tensor，并在图内归一化：

```python
import torch
import torch.nn as nn


class FashionInference(nn.Module):
    def __init__(self, classifier: nn.Module):
        super().__init__()
        self.classifier = classifier
        self.register_buffer(
            "mean", torch.tensor([0.2860]).reshape(1, 1, 1, 1)
        )
        self.register_buffer(
            "std", torch.tensor([0.3530]).reshape(1, 1, 1, 1)
        )

    def forward(self, images: torch.Tensor) -> torch.Tensor:
        normalized = (images - self.mean) / self.std
        return self.classifier(normalized)
```

分类器加载最佳权重后切换推理模式：

```python
classifier = FashionMLP()
state_dict = torch.load(
    "checkpoints/best_weights.pt",
    map_location="cpu",
    weights_only=True,
)
classifier.load_state_dict(state_dict, strict=True)

model = FashionInference(classifier).eval()
```

导出边界仍不包含 JPEG/PNG 解码、彩色转灰度和 Resize。不同语言对图片像素、EXIF 方向和插值算法的处理可能不同，这些步骤要在服务契约中单独固定。

## 导出前建立 Eager 基线

```python
sample = torch.rand(4, 1, 28, 28, dtype=torch.float32)

with torch.inference_mode():
    eager_logits = model(sample)

assert eager_logits.shape == (4, 10)
assert eager_logits.dtype == torch.float32
assert torch.isfinite(eager_logits).all()
```

输入合同：

```text
name: images
shape: [B, 1, 28, 28]
dtype: float32
range: [0, 1]
batch: 1 <= B <= 128
```

输出合同：

```text
name: logits
shape: [B, 10]
dtype: float32
class order: FashionMNIST classes
```

导出 API 能捕获 Shape 约束，却不知道 `[0,1]` 数值范围和类别顺序。这些仍要写入部署清单。

## 使用 torch.export

`torch.export.export` 从 `nn.Module` 和示例输入捕获只包含 Tensor 计算的 AOT 图：

```python
batch = torch.export.Dim("batch", min=1, max=128)

exported = torch.export.export(
    model,
    args=(sample,),
    dynamic_shapes=({0: batch},),
)

print(exported.graph_module)
```

`dynamic_shapes` 与位置参数结构对应，`{0: batch}` 表示输入第 0 维动态，其余 `1×28×28` 固定。约束不是文档注释，而是 ExportedProgram 正确性的组成部分；超出范围的输入应失败，而不是静默执行未知行为。

保存与加载：

```python
torch.export.save(exported, "fashion_mlp.pt2")
restored = torch.export.load("fashion_mlp.pt2")
```

执行加载程序的 Module：

```python
with torch.inference_mode():
    exported_logits = restored.module()(sample)

torch.testing.assert_close(
    exported_logits,
    eager_logits,
    rtol=1e-5,
    atol=1e-6,
)
```

导出的程序不是原 Python Module 的通用替代。Tensor 图之外的任意 Python 对象、文件访问、日志副作用和数据相关控制流可能无法捕获，或在捕获时被固化。

## 为什么 Python 控制流需要改写

下面逻辑取决于运行时 Tensor 值：

```python
def forward(self, x):
    if x.mean().item() > 0.5:
        return self.bright_model(x)
    return self.dark_model(x)
```

`.item()` 把 Tensor 转成 Python 标量，普通 Python `if` 不属于纯 Tensor 图。选择包括：

- 把路由放在模型服务外层，分别导出两个模型。
- 用 `torch.cond` 表达满足限制的 Tensor 控制流。
- 若分支其实是配置常量，在导出前固定成明确版本。

不要为追求单一模型文件，把可观察、可测试的业务路由藏进复杂图算子。

## 导出 ONNX

PyTorch 当前推荐基于 `torch.export` 的新 ONNX exporter：

```python
onnx_program = torch.onnx.export(
    model,
    args=(sample,),
    f=None,
    input_names=["images"],
    output_names=["logits"],
    dynamo=True,
    dynamic_shapes=({0: batch},),
    verify=True,
)

onnx_program.save("fashion_mlp.onnx")
```

`verify=True` 会使用 ONNX Runtime 验证导出产物，需要安装相应依赖。若运行环境缺少 ONNX/ONNX Runtime，应先安装与当前 Python 兼容的版本。

也可以直接给 `f="fashion_mlp.onnx"`。保留返回的 ONNXProgram 更便于检查图、调用和保存调试报告。

并非所有 PyTorch 算子都有目标 ONNX opset 的等价表示。失败时可：

1. 查看 exporter 生成的报告和首个不支持算子。
2. 缩小为最小 Module，确认是模型结构还是版本问题。
3. 用等价的稳定 PyTorch 算子改写。
4. 必要时添加自定义转换，并让部署运行时实现对应算子。

不能把不支持算子静默删除或替换为近似结果。

## 使用 ONNX Runtime 比较输出

```python
import numpy as np
import onnxruntime as ort

session = ort.InferenceSession(
    "fashion_mlp.onnx",
    providers=["CPUExecutionProvider"],
)

onnx_outputs = session.run(
    ["logits"],
    {"images": sample.numpy()},
)[0]

np.testing.assert_allclose(
    onnx_outputs,
    eager_logits.numpy(),
    rtol=1e-4,
    atol=1e-5,
)
```

比较样本不应只有导出时的一个 batch。至少覆盖：

- 动态 batch 的最小值 1、常用值和最大值 128；
- 全零、全一和正常数据分布；
- 模型容易混淆的真实样本；
- CPU 与目标加速 provider；
- 输出 Shape、dtype、有限值与数值容差。

不同运行时可能使用不同融合与舍入顺序，浮点结果按容差比较。若最终决策使用 argmax，还应检查边界样本是否因微小 logits 差异改变类别。

## 推理性能的正确边界

推理服务性能包括：

```text
请求排队 + 解码/预处理 + batch 组装 + 主机到设备传输
+ 模型执行 + 后处理 + 序列化/网络响应
```

只测 `session.run` 或 Module forward 是模型内核基准，不是服务延迟。动态 batch 提高吞吐，却增加排队延迟；部署要分别报告 P50/P95/P99 延迟、吞吐、batch 策略和并发数。

FashionMNIST 模型很小，Python/网络开销可能超过推理本身。此时导出价值更多在于运行时边界和跨语言，而不一定是巨大加速。

## 部署清单

模型文件旁至少保存：

```json
{
  "model_name": "fashion-mlp",
  "model_version": "1.0.0",
  "format": "onnx",
  "pytorch_version": "2.13",
  "input": {
    "name": "images",
    "dtype": "float32",
    "shape": ["batch", 1, 28, 28],
    "range": [0.0, 1.0],
    "batch_min": 1,
    "batch_max": 128
  },
  "output": {
    "name": "logits",
    "classes": 10
  }
}
```

另外保存：类别名称顺序、图片预处理版本、训练 run ID、权重哈希、导出脚本版本、ONNX opset、验证样本与容差。版本升级时保留回滚产物，不能覆盖唯一的线上模型文件。

## 安全与兼容边界

- 使用 `weights_only=True` 加载权重，且只信任受控来源。
- ExportedProgram、ONNX 与运行时都应固定兼容版本并经过目标环境验证。
- 动态 Shape 有明确上下界，防止异常大 batch 或尺寸造成资源耗尽。
- 不把用户提供的任意模型文件直接加载到高权限服务。
- 模型输出是候选分数，不自动具有权限决策或业务事实语义。

ONNX 格式减少对原 Python 类的依赖，不代表文件绝对安全；解析器、外部数据文件和自定义算子仍属于供应链攻击面。

## 与大模型部署的关系

FashionMLP 可以导出为通用静态推理图，LLM 则还涉及动态序列、KV Cache、采样循环、张量并行和专用运行时。不要把本篇流程直接等同于大模型服务。

现有[从 Bigram 到 Mini GPT](/posts/ai/transformer系列教程/transformer-12-bigram-to-mini-gpt/)展示了自回归生成闭环；其中逐 Token 控制流和缓存状态，正是 LLM 推理系统需要额外管理的部分。

## 常见误区

- **`state_dict` 是可独立运行模型**：加载端仍需兼容 Python 结构和配置。
- **导出会自动包含 PIL 预处理**：导出主边界是 Tensor 计算，图片解码应单独固定。
- **动态 Shape 代表任意 Shape**：只声明和验证指定轴与范围。
- **导出成功就等于部署正确**：还要跨输入、运行时和目标设备比较数值与业务决策。
- **ONNX 必然比 Eager 快**：收益取决于模型、provider、batch 和端到端开销。
- **模型文件就是完整服务**：类别映射、版本、预处理、监控和回滚同样是交付物。

## 本篇自检

1. `state_dict`、ExportedProgram 和 ONNX 的主要边界分别是什么？
2. 为什么输入范围和类别顺序不能只依赖导出图表达？
3. 导出时的示例 batch 能通过，为什么仍要测试动态 batch 边界？

<details>
<summary>查看答案</summary>

1. state_dict 只保存状态；ExportedProgram 保存 PyTorch Tensor 图及约束；ONNX 保存可供跨运行时执行的标准图。
2. 图能约束部分 Shape/dtype，却不知道业务数值范围与类别索引语义，需要外部清单固定。
3. 示例只证明一个具体 Shape；动态约束、运行时实现和内存边界必须用最小、常用和最大值验证。

</details>

## 系列总结

这十六篇从环境与 Tensor 出发，依次建立了内存布局、Autograd、Module、数据管道、优化与训练循环，再扩展到 Checkpoint、可复现、调试、AMP、Profiler、编译、分布式和模型导出。

贯穿所有主题的是同一套方法：

```text
先定义输入输出与状态 → 用最小案例验证机制
→ 建立正确性基线 → 测量资源与性能 → 再扩大规模
```

PyTorch API 会继续演进，但 Shape、状态所有权、计算图、训练—推理一致性和证据驱动优化这些原则不会随版本失效。完成本系列后，可以继续阅读现有 [Transformer 系列](/series/transformer/)；其中手写 Block 与 Mini GPT 会把本系列的张量、梯度和训练工程能力带入现代语言模型。

## 参考资料

- [`torch.export`](https://docs.pytorch.org/docs/stable/user_guide/torch_compiler/export.html)
- [torch.export Tutorial](https://docs.pytorch.org/tutorials/intermediate/torch_export_tutorial.html)
- [`torch.onnx`](https://docs.pytorch.org/docs/stable/onnx.html)
- [Export a PyTorch Model to ONNX](https://docs.pytorch.org/tutorials/beginner/onnx/export_simple_model_to_onnx_tutorial.html)
