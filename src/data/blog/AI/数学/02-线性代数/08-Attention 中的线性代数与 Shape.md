---
title: "Attention 中的线性代数与 Shape"
author: Joekma
pubDatetime: 2026-07-18T00:00:00.000+08:00
modDatetime: 2026-07-29T00:00:00.000+08:00
description: "逐步核对 Q、K、V 投影、分数矩阵、多头拆分和输出拼接的矩阵乘法与 Shape。"
tags: [AI, 数学, 线性代数, Attention]
draft: false
series: "AI 工程数学 · 线性代数"
seriesOrder: 8
language: zh-CN
---

## 从输入到 Q、K、V

设输入 $\mathbf{X}\in\mathbb{R}^{T\times C}$，单头投影为：

$$
\mathbf{Q}=\mathbf{X}\mathbf{W}_Q,\quad
\mathbf{K}=\mathbf{X}\mathbf{W}_K,\quad
\mathbf{V}=\mathbf{X}\mathbf{W}_V
$$

若 $\mathbf{W}_Q,\mathbf{W}_K\in\mathbb{R}^{C\times D}$、$\mathbf{W}_V\in\mathbb{R}^{C\times D_v}$，则 Q、K 为 `[T,D]`，V 为 `[T,Dv]`。三个矩阵来自同一输入，却因参数不同承担不同角色。

## 分数矩阵为什么是方阵

$$
\mathbf{S}
=
\frac{\mathbf{Q}\mathbf{K}^{\mathsf T}}{\sqrt{D}}
$$

Shape 为：

```text
[T,D] @ [D,T] → [T,T]
```

$S_{ij}$ 是第 $i$ 个 Query 与第 $j$ 个 Key 的点积。Softmax 沿每一行的 Key 轴归一化，得到 $\mathbf{A}\in\mathbb{R}^{T\times T}$；再与 V 相乘：

$$
\mathbf{O}=\mathbf{A}\mathbf{V},
\qquad
[T,T]@[T,D_v]\to[T,D_v]
$$

序列长度 $T$ 在分数矩阵中出现两次，这也是标准 Attention 需要二次方存储分数的来源。

## 多头只是增加一个批量轴

对批输入 `[B,T,C]`，投影后拆为：

```text
Q,K,V       [B,H,T,D]
scores      [B,H,T,T]
head output [B,H,T,D]
```

其中通常 $C=H D$。各头独立计算后，先转置为 `[B,T,H,D]`，再合并为 `[B,T,C]`，最后经过输出投影。

`reshape` 之前必须确认内存中的轴顺序。直接把 `[B,T,H,D]` 当作 `[B,H,T,D]` 不会报元素数量错误，却会混合 Token 与 Head。

## Mask 与广播

因果 Mask 常具有 `[T,T]`，通过广播应用到 `[B,H,T,T]`。它在 Softmax 前把不可见位置的分数设为负无穷，使归一化后权重为零。Mask 的 `True/False` 语义在不同 API 中可能相反，不能只凭 Shape 判断。

## 常见误区

- 把 Softmax 作用到 Query 轴而不是 Key 轴。
- 忘记 $\mathbf{K}$ 转置。
- 认为分数矩阵就是 Attention 输出。
- 合并多头前没有恢复 `[B,T,H,D]` 的轴顺序。
- 把 $\sqrt{D}$ 错写成 $\sqrt{T}$。

## 小结

Attention 的线性代数主链是投影、批量点积、按行归一化和值向量加权。掌握 Shape 后，公式中的每个轴都有可检查的来源。下一模块进入概率论与统计。

## 参考资料

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
- [The Annotated Transformer](https://nlp.seas.harvard.edu/annotated-transformer/)
