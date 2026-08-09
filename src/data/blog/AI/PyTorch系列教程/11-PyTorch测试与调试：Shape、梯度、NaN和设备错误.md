---
title: "PyTorch 测试与调试：Shape、梯度、NaN 和设备错误"
author: Joekma
pubDatetime: 2026-08-09T01:40:00.000+08:00
modDatetime: 2026-08-09T01:40:00.000+08:00
slug: pytorch-11-testing-debugging
description: "建立 PyTorch 模型的数据、前向、梯度、更新和推理测试，并系统排查 Shape、NaN、梯度断裂、设备不一致与模式泄漏。"
tags: [AI, PyTorch, Testing, Debugging]
draft: false
series: PyTorch
seriesOrder: 11
language: zh-CN
---

## 本篇要解决的问题

模型 loss 不下降时，怎样判断是数据、前向、梯度还是优化器的问题？出现 NaN 后为什么不应只把学习率除以十？Module Hook、异常检测与 `gradcheck` 分别适合定位哪类问题？

调试应沿数据流逐层缩小范围：

```text
数据契约 → 前向 Shape/有限值 → loss 契约 → backward 梯度
        → optimizer 更新 → eval 行为 → Checkpoint 恢复
```

直接盯完整训练日志通常只能看到症状，无法确定故障从哪个边界进入。

### 前置知识

已经完成 FashionMNIST 训练、Checkpoint 和可复现配置，理解训练与推理模式。

## 建立分层检查

推荐从低成本到高成本依次验证：

1. **静态契约**：Shape、dtype、device、数值范围和标签范围。
2. **前向契约**：输出 Shape 正确且所有值有限。
3. **梯度契约**：关键 Parameter 产生 Shape 正确的有限梯度。
4. **更新契约**：`optimizer.step()` 后至少部分可训练参数发生变化。
5. **学习能力**：模型能否过拟合一个很小 batch。
6. **评估契约**：`eval()` 结果稳定，指标覆盖完整数据。

这套顺序避免在数据类型已经错误时，先花几个小时调整网络结构。

## 数据边界断言

```python
def assert_fashion_batch(
    images: torch.Tensor,
    targets: torch.Tensor,
) -> None:
    assert images.ndim == 4
    assert images.shape[1:] == (1, 28, 28)
    assert images.dtype == torch.float32
    assert targets.ndim == 1
    assert targets.dtype == torch.int64
    assert images.size(0) == targets.size(0)
    assert torch.isfinite(images).all()
    assert targets.numel() > 0
    assert targets.min().item() >= 0
    assert targets.max().item() < 10
```

训练前检查多个 batch 的范围和类别分布：

```python
for batch_index, (images, targets) in enumerate(train_loader):
    assert_fashion_batch(images, targets)
    if batch_index == 9:
        break
```

只检查第一条样本可能漏掉损坏文件和尾部标签。断言适合开发期快速失败；对外部输入应抛出带上下文的异常，而不是依赖可能被 Python 优化选项关闭的 `assert`。

## 前向接口检查

```python
model = FashionMLP().to(device)
images = torch.randn(7, 1, 28, 28, device=device)

model.eval()
with torch.inference_mode():
    logits = model(images)

assert logits.shape == (7, 10)
assert logits.dtype == torch.float32
assert logits.device == device
assert torch.isfinite(logits).all()
```

测试 batch size 使用 7 而不是 8、16 等常见对称数字，更容易暴露硬编码。测试轴变换时让各轴长度不同，例如 `[2,3,5,7]`，避免误交换两条长度相等的轴仍然通过。

输出全为有限值不代表数值健康。还可观察均值、标准差和极值：

```python
print(
    logits.mean().item(),
    logits.std().item(),
    logits.abs().max().item(),
)
```

初始化后 logits 极大可能让 Softmax 迅速饱和；全部为 0 可能代表参数初始化或数据通路被错误清空。

## 梯度存在性与有限值

```python
model.train()
criterion = torch.nn.CrossEntropyLoss()

images = torch.randn(8, 1, 28, 28, device=device)
targets = torch.randint(0, 10, (8,), device=device)

model.zero_grad(set_to_none=True)
loss = criterion(model(images), targets)
assert torch.isfinite(loss)
loss.backward()

for name, parameter in model.named_parameters():
    if not parameter.requires_grad:
        continue
    if parameter.grad is None:
        raise AssertionError(f"missing gradient: {name}")
    if parameter.grad.shape != parameter.shape:
        raise AssertionError(f"gradient shape mismatch: {name}")
    if not torch.isfinite(parameter.grad).all():
        raise AssertionError(f"non-finite gradient: {name}")
```

某些分支参数在当前 batch 未参与计算时，`.grad is None` 可能是合法行为；测试应根据模型结构定义预期，而不是机械要求所有参数都有梯度。

梯度恰好为 0 与缺失不同：前者说明图连通但局部导数为 0，后者可能是 `detach`、错误的 `no_grad`、未注册层或当前分支未使用。

## 验证参数真的更新

```python
optimizer = torch.optim.SGD(model.parameters(), lr=0.1)

before = {
    name: parameter.detach().clone()
    for name, parameter in model.named_parameters()
}

optimizer.zero_grad(set_to_none=True)
loss = criterion(model(images), targets)
loss.backward()
optimizer.step()

changed = []
for name, parameter in model.named_parameters():
    changed.append(
        not torch.equal(before[name], parameter.detach())
    )

assert any(changed)
```

如果梯度存在但参数不变，检查学习率是否为 0、参数是否真正进入 optimizer、梯度是否在 step 前被清掉，以及 GradScaler 是否跳过了包含非有限梯度的更新。

比较浮点 Tensor 时通常用 `torch.testing.assert_close`，而不是精确相等：

```python
torch.testing.assert_close(
    actual,
    expected,
    rtol=1e-5,
    atol=1e-7,
)
```

容差必须根据 dtype、算子和业务影响选择，不能为了让测试通过无限放宽。

## gradcheck 检查自定义可微函数

`torch.autograd.gradcheck` 用双精度有限差分比较解析梯度，适合小型自定义算子：

```python
def function(x: torch.Tensor) -> torch.Tensor:
    return torch.sin(x) * x.square()


x = torch.randn(
    4,
    dtype=torch.float64,
    requires_grad=True,
)

assert torch.autograd.gradcheck(function, (x,))
```

它成本较高、需要平滑点和 double 输入，不适合每步训练或整个大模型。普通 Linear/ReLU 已由 PyTorch 验证，重点应放在自己的张量变形、Mask、损失组合和自定义 Function 上。

不可导点附近的有限差分可能不稳定，例如 ReLU 恰好在 0。测试输入应避开不连续边界，或明确采用哪种次梯度约定。

## 异常检测定位反向错误

```python
with torch.autograd.detect_anomaly():
    logits = model(images)
    loss = criterion(logits, targets)
    loss.backward()
```

当反向产生 NaN 或某个 Autograd Function 失败时，异常检测会保留更多前向上下文，帮助定位来源。它开销很大，只在最小复现场景中启用，不应作为长期训练默认设置。

NaN 排查顺序：

1. 检查输入、标签和 loss 在第一次异常前是否有限。
2. 找到第一个产生非有限输出的层，而不是最后报错的优化器。
3. 检查除零、`log(0)`、`exp` 溢出、无穷 Mask、错误 dtype 与超大 logits。
4. 再检查学习率、初始化、梯度裁剪和混合精度缩放。

如果 FP32 第一个 step 已出现 NaN，先降低学习率可能掩盖数据或公式错误。

## 使用 Hook 观察模块边界

Forward Hook 可以记录模块输入输出：

```python
handles = []


def inspect_output(
    module: torch.nn.Module,
    inputs: tuple[torch.Tensor, ...],
    output: torch.Tensor,
) -> None:
    del inputs
    if isinstance(output, torch.Tensor):
        print(
            type(module).__name__,
            tuple(output.shape),
            torch.isfinite(output).all().item(),
        )


for module in model.modules():
    if isinstance(module, torch.nn.Linear):
        handles.append(module.register_forward_hook(inspect_output))

model(images)

for handle in handles:
    handle.remove()
```

Hook 应及时移除，否则多次注册会重复执行并持有对象引用。编译与导出路径对 Python Hook 有额外限制，性能测试前应关闭诊断 Hook。

还可以给 Parameter 注册梯度 Hook，定位第一个非有限梯度：

```python
def check_gradient(name: str):
    def hook(gradient: torch.Tensor) -> torch.Tensor:
        if not torch.isfinite(gradient).all():
            raise FloatingPointError(f"non-finite gradient in {name}")
        return gradient
    return hook


for name, parameter in model.named_parameters():
    if parameter.requires_grad:
        parameter.register_hook(check_gradient(name))
```

## 过拟合一个小 batch

模型无法在少量固定样本上显著降低 loss 时，通常不必先讨论泛化。冻结一个 batch，关闭随机增强，以较多更新尝试拟合：

```python
images, targets = next(iter(train_loader))
images = images[:32].to(device)
targets = targets[:32].to(device)

model = FashionMLP().to(device)
optimizer = torch.optim.AdamW(model.parameters(), lr=1e-3)

for _ in range(300):
    optimizer.zero_grad(set_to_none=True)
    logits = model(images)
    loss = criterion(logits, targets)
    loss.backward()
    optimizer.step()
```

若小 batch 都无法拟合，优先检查：标签对齐、输出与损失契约、参数注册、梯度是否断裂、学习率和模型容量。能拟合小 batch 只证明基本学习通路存在，不代表验证集效果好。

## 设备与 dtype 错误

常见设备错误：模型在 CUDA、输入在 CPU，或 Module 中藏着未注册的 CPU Tensor。打印设备时同时检查 Parameter、Buffer 和 batch：

```python
print("input:", images.device)
print("parameter:", next(model.parameters()).device)
print(
    "buffers:",
    [(name, buffer.device) for name, buffer in model.named_buffers()],
)
```

不要在出错后对每个局部变量盲目 `.cuda()`。先找出哪个对象的生命周期没有被统一管理。

常见 dtype 错误包括分类标签被转成 float、整数输入交给 Linear、float64 NumPy 数据让整个模型发生类型不匹配，以及 AMP 中自定义运算不支持低精度。

## 模式泄漏测试

Dropout 模型在 eval 下应稳定：

```python
model.eval()
with torch.inference_mode():
    first = model(images)
    second = model(images)

torch.testing.assert_close(first, second)
```

验证函数结束后不要假设模型已自动回到 train。训练入口应每个 epoch 调 `model.train()`。对 BatchNorm，还要检查验证是否意外更新 running statistics。

## 常见误区

- **loss 不下降就加深模型**：先证明数据、梯度和更新通路正确。
- **NaN 就降低学习率**：先定位第一个非有限值及其输入。
- **所有 `.grad is None` 都是框架 Bug**：参数可能未参与当前分支，但也可能未注册或被 detach。
- **Hook 可以长期保留**：它会增加开销、重复执行并影响编译。
- **能过拟合小 batch 就代表模型正确**：它只是训练通路的必要非充分检查。
- **设备错误用到处 `.cuda()` 修复**：应统一状态所有权与迁移边界。

## 本篇自检

1. 梯度为 `None` 与全 0 的诊断含义有什么不同？
2. 为什么异常检测只适合最小复现？
3. 过拟合一个小 batch 能排除什么，又不能证明什么？

<details>
<summary>查看答案</summary>

1. `None` 表示没有梯度被写入，可能图不连通或参数未参与；全 0 表示参与反向但局部导数为 0。
2. 它为反向保留额外前向上下文，时间和内存开销都很大。
3. 它能验证数据到参数更新的基本学习通路，不能证明泛化、校准或生产数据表现。

</details>

## 小结与下一篇

高效调试依赖明确边界：先查数据与 Shape，再查有限值、梯度、参数更新和模式状态。Hook 与异常检测是缩小范围的临时工具，最小 batch 过拟合则是训练通路的强诊断。下一篇进入 GPU、自动混合精度和显存管理，并继续沿同样的证据链排查性能与数值问题。

**下一篇：** [GPU 训练、自动混合精度与显存管理](/posts/ai/py-torch系列教程/pytorch-12-amp-memory/)

## 参考资料

- [`torch.testing`](https://docs.pytorch.org/docs/stable/testing.html)
- [`gradcheck`](https://docs.pytorch.org/docs/stable/generated/torch.autograd.gradcheck.html)
- [Autograd Anomaly Detection](https://docs.pytorch.org/docs/stable/autograd.html#debugging-and-anomaly-detection)
- [Module Hooks](https://docs.pytorch.org/docs/stable/generated/torch.nn.Module.html)
