---
title: "torch.compile：图捕获、Graph Break 与性能验证"
author: Joekma
pubDatetime: 2026-08-09T02:10:00.000+08:00
modDatetime: 2026-08-09T02:10:00.000+08:00
slug: pytorch-14-torch-compile
description: "理解 torch.compile 的图捕获、guards、Graph Break、重编译和冷启动成本，并建立 Eager 与 Compile 的数值及性能比较方法。"
tags: [AI, PyTorch, torch.compile, Performance]
draft: false
series: PyTorch
seriesOrder: 14
language: zh-CN
---

## 本篇要解决的问题

`torch.compile(model)` 为什么第一次调用更慢？Python `if`、`.item()` 和打印如何造成 Graph Break？动态 batch 为什么可能重复编译？编译后怎样证明得到的是同一个模型结果，而不是用精度换速度？

`torch.compile` 的目标是捕获 PyTorch 程序中的 Tensor 运算区域，生成更少、更适合目标硬件的代码。它不是把任意 Python 程序一次性转换成静态图，也不承诺所有模型必然加速。

### 前置知识与环境说明

已经能用 Profiler 建立 Eager 基线，理解 GPU warm-up 和异步计时。编译后端、支持范围和收益依赖 PyTorch 版本、操作系统与硬件；本篇以 PyTorch 2.13 默认 Inductor 后端为基线。

## 最小编译入口

```python
eager_model = FashionMLP().to(device).eval()
compiled_model = torch.compile(eager_model)

images = torch.randn(128, 1, 28, 28, device=device)

with torch.inference_mode():
    logits = compiled_model(images)
```

第一次调用通常经历：

```text
Python frame 分析 → Tensor 图捕获 → Autograd/算子变换
→ Inductor 生成代码 → 后端编译与 autotune → 执行
```

后续满足同一组 guard 的输入会复用缓存结果。小模型只运行一次时，编译成本可能远大于节省的执行时间；长时间训练或重复推理才更可能摊薄冷启动。

也可以调用：

```python
model.compile()
```

它原地配置 Module 的编译调用路径。教学中使用返回新 callable 的 `torch.compile(model)` 更容易保留 Eager 对照。

## 先验证数值一致性

编译前复制同一权重并关闭 Dropout：

```python
import copy

eager_model = FashionMLP().to(device).eval()
compiled_source = copy.deepcopy(eager_model)
compiled_model = torch.compile(compiled_source)

images = torch.randn(17, 1, 28, 28, device=device)

with torch.inference_mode():
    eager_logits = eager_model(images)
    compiled_logits = compiled_model(images)

torch.testing.assert_close(
    compiled_logits,
    eager_logits,
    rtol=1e-4,
    atol=1e-5,
)
```

浮点运算融合可能改变舍入顺序，因此不应默认逐 bit 相等。容差应按 dtype 与任务风险设置。除输出外，训练编译还要比较 loss、关键梯度、若干更新后的参数和验证指标。

不要让两个模型依次执行随机 Dropout 后再比较；随机数流已经前进。可以切到 eval、固定 RNG 状态或直接比较确定性子模块。

## 分开冷启动与稳态

```python
import time


def timed_call(function, images: torch.Tensor) -> float:
    if images.device.type == "cuda":
        torch.cuda.synchronize()
    started = time.perf_counter()
    function(images)
    if images.device.type == "cuda":
        torch.cuda.synchronize()
    return time.perf_counter() - started


with torch.inference_mode():
    compile_cold_start = timed_call(compiled_model, images)
    for _ in range(5):
        compiled_model(images)
    compiled_steady = [timed_call(compiled_model, images) for _ in range(20)]
    eager_steady = [timed_call(eager_model, images) for _ in range(20)]
```

报告至少分为：首次编译延迟、稳态中位数、输入 Shape、设备/dtype 和总调用次数。只删掉首次耗时会夸大短任务收益，只把首次耗时摊入每次调用又会低估长期服务收益。

编译缓存与 PyTorch、Triton、硬件和配置有关，不能假设在开发机生成的缓存可无条件搬到任意生产机。

## guard 与重编译

编译器会为捕获结果建立条件，例如 Tensor dtype、device、维数、部分 Shape、Python 常量和 Module 状态。当新输入不满足 guard 时，需要选择另一个已编译版本或重新编译。

```python
with torch.inference_mode():
    compiled_model(torch.randn(64, 1, 28, 28, device=device))
    compiled_model(torch.randn(128, 1, 28, 28, device=device))
```

不同 batch 是否重编译取决于动态 Shape 策略和图中约束。可开启日志：

```powershell
$env:TORCH_LOGS="guards,recompiles,graph_breaks"
python train.py
```

Linux/macOS：

```bash
TORCH_LOGS="guards,recompiles,graph_breaks" python train.py
```

先观察重编译原因，再决定是否启用更动态的捕获：

```python
compiled_model = torch.compile(model, dynamic=True)
```

`dynamic=True` 不是免费加速开关。更通用的 Shape 可能限制专门优化，仍然存在数据相关约束。若实际只使用少数固定 batch，稳定 Shape 往往更简单。

## Graph Break 是什么

当编译器无法继续把当前 Python frame 捕获为一张图时，会结束一个编译区域，在 Eager Python 中执行不支持部分，再尝试捕获后续区域。默认 `fullgraph=False` 时，Graph Break 通常不是错误，但会增加边界、阻止跨区域融合。

典型来源：

```python
def forward(self, x):
    score = x.mean()
    if score.item() > 0:  # Tensor → Python 标量，触发数据相关控制流
        x = x * 2
    print(x.shape)         # Python 副作用
    return self.network(x)
```

`.item()` 需要从 Tensor 提取 Python 值，CUDA 上还可能同步设备；随后 Python 分支取决于运行时数据，不能直接作为普通固定图处理。

改进方向取决于语义：

- 日志和指标移到编译区域外。
- 能用 Tensor 表达的分支改为 `torch.where` 等算子。
- 真正的数据相关控制流评估 `torch.cond`，并接受其输入输出限制。
- 对明确不值得编译的小辅助函数使用稳定的编译禁用边界。

不要为了消除所有 Graph Break 把可读业务逻辑改成难以维护的 Tensor 技巧。先用 Profiler 证明这些边界影响端到端性能。

## fullgraph 用于暴露边界

```python
strict_compiled = torch.compile(model, fullgraph=True)
```

`fullgraph=True` 要求一次调用捕获为单个图，遇到 Graph Break 会报错。它适合开发期确认可捕获性，不代表生产必须使用单图；复杂训练系统保留少量合理边界可能更实际。

如果错误来自数据加载、日志、Checkpoint 等纯 Python 外层，不应把这些职责塞进编译函数。通常只编译模型 forward，或一个边界清楚的 train step。

## 训练编译边界

最保守路径只编译模型：

```python
model = FashionMLP().to(device)
compiled_model = torch.compile(model)

for images, targets in train_loader:
    optimizer.zero_grad(set_to_none=True)
    logits = compiled_model(images)
    loss = criterion(logits, targets)
    loss.backward()
    optimizer.step()
```

这样 Autograd 仍能编译相关图，而 DataLoader、日志和 Checkpoint 留在 Eager。进一步编译 loss 或 optimizer 可能提升性能，也会增加调度器、参数组、AMP 与 Graph Break 的复杂性；应在前一层已经成为瓶颈后再扩展。

编译模型的权重仍属于原始 Module。持久化时保存原始模型的 `state_dict()`，不要把编译缓存当作训练 Checkpoint：

```python
torch.save(model.state_dict(), "fashion_mlp_weights.pt")
```

## 常见重编译诱因

- 每次调用传入不同 Python list 长度或字典结构。
- 在 `forward` 中读取不断变化的 Python 属性。
- batch、序列或图片 Shape 高度离散。
- 训练中频繁切换 dtype、device 或 Module 模式。
- 在循环内重新定义函数或重新调用 `torch.compile`。
- 数据相关 `.item()` 进入 Python 分支。

编译对象应在循环外创建。若动态 Shape 来自最后一个小 batch，可比较 `drop_last=True` 的吞吐收益与丢样本/训练语义成本，或让动态 batch 轴被合理捕获；不能为了少一次编译无条件丢数据。

## 编译失败的处理顺序

1. 在 Eager 模式复现并确认模型本身正确。
2. 使用 `TORCH_LOGS` 找首个 Graph Break 或重编译原因。
3. 缩小到最小 Module 或函数。
4. 判断是代码可重构、框架不支持还是后端 Bug。
5. 保留可回退的 Eager 路径，并记录受影响 Shape 与环境。

`torch.compile(..., disable=True)` 可以把编译入口变为 no-op，便于用同一配置比较 Eager：

```python
model = torch.compile(model, disable=not config.enable_compile)
```

不要捕获异常后静默返回不同结果。编译失败可以降级性能，不能降级正确性。

## 常见误区

- **compile 第一次慢说明无效**：要分开冷启动与稳态，并结合调用总量。
- **没有异常就没有 Graph Break**：默认允许多图执行，需要查看日志和 Profiler。
- **`dynamic=True` 解决所有 Shape**：它增加通用性，也可能降低专门优化并保留其他 guards。
- **编译输出必须逐 bit 等于 Eager**：融合可能改变浮点舍入，应按合理容差与任务指标比较。
- **所有 Python 都应塞进 compile**：数据、日志和 Checkpoint 应保留在清晰外层。
- **编译对象就是部署产物**：训练仍保存模型状态；导出是下一篇之后的独立协议。

## 本篇自检

1. 为什么必须分别报告编译冷启动与稳态延迟？
2. `.item()` 为什么既可能 Graph Break，又可能造成 CUDA 同步？
3. `fullgraph=True` 最适合用来做什么？

<details>
<summary>查看答案</summary>

1. 一次性与长期任务摊销编译成本的方式不同，混在一起无法判断实际收益。
2. 它把设备 Tensor 变成 Python 标量，编译器遇到数据相关 Python 控制流，CPU 也必须等待设备值可用。
3. 在开发期严格暴露不能形成单图的边界，而不是要求所有生产代码必须单图执行。

</details>

## 小结与下一篇

`torch.compile` 通过捕获 Tensor 图和生成优化代码提高稳态执行效率，代价是冷启动、guards、Graph Break 与重编译。正确做法是保留 Eager 对照，先验证数值，再测稳态和完整训练。下一篇把单进程扩展到多进程，比较 DDP 的数据并行与 FSDP2 的参数分片。

**下一篇：** [分布式训练路线：从 DDP 到 FSDP2](/posts/ai/py-torch系列教程/pytorch-15-distributed-training/)

## 参考资料

- [Introduction to torch.compile](https://docs.pytorch.org/tutorials/intermediate/torch_compile_tutorial.html)
- [`torch.compile`](https://docs.pytorch.org/docs/stable/generated/torch.compile.html)
- [torch.compile Programming Model](https://docs.pytorch.org/docs/stable/user_guide/torch_compiler/torch.compiler_programming_model.html)
- [Compile Time Caching](https://docs.pytorch.org/tutorials/recipes/torch_compile_caching_tutorial.html)
