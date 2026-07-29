---
title: "Attention 与多头注意力的公式和 Shape"
author: Joekma
pubDatetime: 2026-07-18T00:00:00.000+08:00
modDatetime: 2026-07-29T00:00:00.000+08:00
description: "从 QKV 投影、缩放点积、Mask、Softmax 到多头拼接，完整核对公式和 Shape。"
tags: [AI, 数学, 大模型数学, Attention]
draft: false
series: "AI 工程数学 · 数学知识在大模型中的综合应用"
seriesOrder: 3
language: zh-CN
---

## 单头主公式

$$
\operatorname{Attention}(Q,K,V)
=
\operatorname{softmax}
\left(\frac{QK^{\mathsf T}}{\sqrt{D}}+M\right)V
$$

对 `[B,H,T,D]`：

```text
Q @ Kᵀ        → [B,H,T,T]
add mask M    → [B,H,T,T]
softmax(-1)   → [B,H,T,T]
weights @ V   → [B,H,T,D]
```

$1/\sqrt D$ 抵消独立单位方差分量点积随 $D$ 增长的方差，减少 Softmax 过早饱和。Mask 在 Softmax 前屏蔽未来或 padding。

多头结果转成 `[B,T,H,D]` 后拼为 `[B,T,C]`，其中通常 $C=HD$，再乘输出矩阵 $W_O$。不同头有独立投影，但“每头必然学习某种可命名关系”并无保证。

分数与权重需要 $O(T^2)$ 空间；标准训练 Attention 的主要计算也随 $T^2D$ 增长。FlashAttention 改变分块和内存访问，不改变数学结果。

## 小结

Attention 是批量相似度、归一化与值向量加权的组合；多头增加并行子空间。下一篇解释在没有卷积或递归时如何表示顺序。

## 参考资料

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
- [FlashAttention](https://arxiv.org/abs/2205.14135)
