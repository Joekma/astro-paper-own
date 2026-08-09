---
title: "Autograd 自动微分：计算图、梯度与反向传播"
author: Joekma
pubDatetime: 2026-08-09T00:30:00.000+08:00
modDatetime: 2026-08-09T00:30:00.000+08:00
slug: pytorch-04-autograd
description: "理解 PyTorch 动态计算图、叶子张量、梯度累积与反向传播，并厘清 detach、no_grad、inference_mode 和原地操作。"
tags: [AI, PyTorch, Autograd, Backpropagation]
draft: false
series: PyTorch
seriesOrder: 4
language: zh-CN
---

## 本篇要解决的问题

PyTorch 如何知道每个参数的梯度？为什么连续调用两次 `backward()` 会把梯度相加？`detach()`、`torch.no_grad()` 与 `torch.inference_mode()` 都能阻止记录，它们的使用边界有什么不同？

本篇不重新推导完整微积分，而是关注从公式到 PyTorch 状态的映射：**哪些 Tensor 要求梯度、前向过程记录了什么、反向从哪里开始、结果最终累积到哪里**。

### 前置知识

理解 Tensor 的 Shape、dtype、device、视图与原地操作。知道导数衡量输出对输入的局部变化即可。

## 用一元模型观察梯度

考虑最简单的线性模型：

$$
\hat{y}=wx+b,\qquad L=(\hat{y}-y)^2
$$

在 PyTorch 中，参数通过 `requires_grad=True` 进入计算图：

```python
import torch

x = torch.tensor(2.0)
target = torch.tensor(7.0)
w = torch.tensor(3.0, requires_grad=True)
b = torch.tensor(0.5, requires_grad=True)

prediction = w * x + b
loss = (prediction - target).square()
loss.backward()

print("loss:", loss.item())
print("dw:", w.grad.item())
print("db:", b.grad.item())
```

当前 `prediction=6.5`，误差为 `-0.5`。根据链式法则：

$$
\frac{\partial L}{\partial w}=2(\hat{y}-y)x=-2,
\qquad
\frac{\partial L}{\partial b}=2(\hat{y}-y)=-1
$$

可以把计算图理解为前向运算形成的有向无环图：叶子参数 `w,b` 经乘法、加法和平方得到标量 `loss`；反向从 loss 的梯度 1 开始，逐节点应用局部导数。

## 动态计算图意味着什么

PyTorch 默认采用 eager execution。普通 Python 控制流决定这一次实际执行哪些 Tensor 运算，执行时建立对应图：

```python
def piecewise(x: torch.Tensor) -> torch.Tensor:
    if x.item() >= 0:
        return x.square()
    return -x


positive = torch.tensor(2.0, requires_grad=True)
piecewise(positive).backward()
assert positive.grad.item() == 4.0
```

下一次输入走另一分支，会建立另一张图。这种模式易于调试，但 Python 控制流和动态行为也可能阻碍 `torch.compile` 或 `torch.export` 捕获稳定图；第 14、16 篇会讨论边界。

计算图默认在完成反向后释放用于求导的中间状态。对同一个 `loss` 再次调用 `backward()` 通常会报错：

```python
loss = (w * x + b - target).square()
loss.backward()

# loss.backward()  # 图已释放，通常会报 RuntimeError
```

确实需要对同一图多次求导时可以使用 `retain_graph=True`，但普通训练循环每个 batch 都会重新前向，不应把保留图当作默认修复方式。错误地跨 step 保存带图 Tensor，是常见显存泄漏来源。

## 标量与非标量输出

`backward()` 最自然的入口是标量 loss。非标量输出没有唯一的“梯度为 1”定义，需要显式提供向量—雅可比积的上游梯度，或先归约：

```python
x = torch.tensor([1.0, 2.0, 3.0], requires_grad=True)
y = x.square()

y.sum().backward()
assert torch.equal(x.grad, torch.tensor([2.0, 4.0, 6.0]))
```

也可以写：

```python
x.grad = None
y = x.square()
y.backward(torch.ones_like(y))
```

深度学习损失通常先对 batch 求均值或和，最终形成标量。`mean` 与 `sum` 会让梯度尺度相差 batch size，调整 batch size 时不能忽略这个差别。

## 梯度为什么累积

Autograd 把叶子 Tensor 的结果累加到 `.grad`，而不是每次覆盖。这样才能实现一个大 batch 被拆成多个 micro-batch 的梯度累积，但普通训练若忘记清零，梯度就会串到下一步。

```python
w = torch.tensor(1.0, requires_grad=True)

(w * 2).backward()
assert w.grad.item() == 2.0

(w * 3).backward()
assert w.grad.item() == 5.0
```

清理方式通常是：

```python
w.grad = None
```

使用优化器时推荐：

```python
optimizer.zero_grad(set_to_none=True)
```

把梯度设为 `None` 可以避免一次填零，并让“本轮没有产生梯度”与“梯度恰好为 0”保持区别。读取前要允许 `.grad is None`。

## 叶子、非叶子与 retain_grad

用户创建且未由其他需梯度运算产生的参数通常是叶子 Tensor：

```python
x = torch.tensor(2.0, requires_grad=True)
y = x * 3
z = y.square()

assert x.is_leaf
assert not y.is_leaf
```

反向后，叶子的 `.grad` 默认被保留，中间结果的 `.grad` 默认不保留：

```python
y.retain_grad()
z.backward()

assert x.grad is not None
assert y.grad is not None
```

训练时优化器更新的是模型 Parameter 这些叶子状态。调试中间层梯度可以使用 `retain_grad()` 或 Hook，但为所有激活保留梯度会增加内存，不能长期默认开启。

一个常见陷阱是在创建参数后立即做转换：

```python
base = torch.tensor([1.0], requires_grad=True)
converted = base.to(torch.float64)

assert base.is_leaf
assert not converted.is_leaf
```

模型参数应由 `nn.Parameter` 注册，并通过 `model.to(device)` 统一移动；不要在训练循环中不断对参数创建新转换结果。

## detach、no_grad 与 inference_mode

三者用途不同：

### detach：切断某个 Tensor 的历史

```python
x = torch.tensor(2.0, requires_grad=True)
y = x.square()
snapshot = y.detach()

assert not snapshot.requires_grad
```

`detach()` 返回与原 Tensor 共享 Storage 的新视图，只切断梯度关系，不保证数据独立。需要独立快照时使用 `y.detach().clone()`。

### no_grad：临时不记录运算

```python
with torch.no_grad():
    prediction = x * 3

assert not prediction.requires_grad
```

它适合验证、手工参数更新和不需要构图的辅助计算。退出上下文后，普通 Autograd 行为恢复。

### inference_mode：更强的推理约束

```python
with torch.inference_mode():
    prediction = x * 3
```

推理模式还关闭部分版本计数和视图跟踪，通常比 `no_grad` 更适合纯推理。由该模式创建的 Tensor 受到更严格限制，不应再带回需要 Autograd 记录的训练路径。验证循环若只计算指标，可以优先使用它；若后续操作需要重新参与梯度，则用 `no_grad` 更稳妥。

`model.eval()` 不会关闭梯度；它只改变 Dropout、BatchNorm 等模块行为。可靠验证通常同时使用：

```python
model.eval()
with torch.inference_mode():
    logits = model(images)
```

## 一次完整的手工更新

把前面的模型执行一个最小梯度下降步骤：

```python
x = torch.tensor([1.0, 2.0, 3.0])
target = torch.tensor([3.0, 5.0, 7.0])
w = torch.tensor(0.0, requires_grad=True)
b = torch.tensor(0.0, requires_grad=True)
learning_rate = 0.1

prediction = w * x + b
loss = (prediction - target).square().mean()
loss.backward()

with torch.no_grad():
    w -= learning_rate * w.grad
    b -= learning_rate * b.grad

w.grad = None
b.grad = None
```

参数更新放在 `no_grad` 中，因为它是优化规则，不应成为下一轮模型计算图的一部分。后续 `torch.optim` 会组织同样的更新，但不会改变“前向—反向—更新—清梯度”的基本闭环。

## 梯度正确性的最小检查

对小函数可以用有限差分核对 Autograd：

```python
def f(value: torch.Tensor) -> torch.Tensor:
    return value.pow(3)


x = torch.tensor(2.0, requires_grad=True)
f(x).backward()
autograd_value = x.grad.item()

epsilon = 1e-3
left = f(torch.tensor(2.0 - epsilon))
right = f(torch.tensor(2.0 + epsilon))
finite_difference = ((right - left) / (2 * epsilon)).item()

assert abs(autograd_value - finite_difference) < 1e-2
```

有限差分受步长和浮点误差影响，只适合小规模验证；自定义可微算子可使用 `torch.autograd.gradcheck`。普通模型更应检查梯度存在、Shape 正确且数值有限，而不是保存所有中间梯度。

## 常见误区

- **`backward()` 会覆盖旧梯度**：默认是累加。
- **`model.eval()` 等于关闭梯度**：它只切换模块模式。
- **`detach()` 会复制数据**：通常仍共享 Storage。
- **报“第二次反向”就加 `retain_graph=True`**：先检查是否错误复用了上一轮计算图。
- **梯度为 0 与梯度为 `None` 相同**：前者表示参与计算但局部导数为 0，后者常表示没有产生梯度。
- **原地更新参数可以直接记录在图里**：优化步骤应置于 `no_grad` 或交给优化器。

## 本篇自检

1. 为什么训练每个 step 通常要先清理旧梯度？
2. `model.eval()` 与 `torch.inference_mode()` 分别改变什么？
3. `detach()` 后为什么仍不适合随意原地修改结果？

<details>
<summary>查看答案</summary>

1. 叶子参数的 `.grad` 默认累积，不清理会把不同 step 的梯度错误相加。
2. `eval()` 改变部分模块的训练/推理行为；`inference_mode()` 关闭 Autograd 记录并减少相关开销。
3. `detach()` 通常与原 Tensor 共享 Storage，原地修改可能影响原值及其他视图。

</details>

## 小结与下一篇

Autograd 的关键不是背诵 `backward()`，而是管理计算图生命周期、叶子状态和梯度累积。前向建立图，标量 loss 提供反向入口，梯度累积到参数，更新必须脱离计算图。下一篇用 `nn.Module` 把散落的 Tensor 参数组织成真正的模型。

**下一篇：** [nn.Module 模型系统：层、参数、Buffer 与状态](/posts/ai/py-torch系列教程/pytorch-05-nn-module/)

## 参考资料

- [Automatic Differentiation](https://docs.pytorch.org/tutorials/beginner/basics/autogradqs_tutorial.html)
- [Autograd Mechanics](https://docs.pytorch.org/docs/stable/notes/autograd.html)
- [`torch.no_grad`](https://docs.pytorch.org/docs/stable/generated/torch.no_grad.html)
- [`torch.inference_mode`](https://docs.pytorch.org/docs/stable/generated/torch.autograd.grad_mode.inference_mode.html)
