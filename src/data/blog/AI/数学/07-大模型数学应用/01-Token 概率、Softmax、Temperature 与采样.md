---
title: "Token 概率、Softmax、Temperature 与采样"
author: Joekma
pubDatetime: 2026-07-18T00:00:00.000+08:00
modDatetime: 2026-07-29T00:00:00.000+08:00
description: "从 logits 推导 Token 分布，解释 Temperature、Top-k、Top-p 与采样如何改变生成。"
tags: [AI, 数学, 大模型数学, 解码]
draft: false
series: "AI 工程数学 · 数学知识在大模型中的综合应用"
seriesOrder: 1
language: zh-CN
---

## 从隐藏状态到分布

最后一层隐藏状态 $\mathbf h_t\in\mathbb R^C$ 经输出矩阵得到词表 logits：

$$
\mathbf z_t=\mathbf W_{\text{out}}\mathbf h_t+\mathbf b,
\qquad
\mathbf z_t\in\mathbb R^V
$$

Temperature 为 $\tau>0$ 的 Softmax：

$$
p_i(\tau)
=
\frac{\exp(z_i/\tau)}
{\sum_j\exp(z_j/\tau)}
$$

$\tau<1$ 放大 logit 差异、分布更尖；$\tau>1$ 缩小差异、分布更平。它不改变 logits 的排序。$\tau\to0^+$ 接近贪心选择，但实际实现不应直接除以 0。

Top-k 只保留分数最高的 $k$ 个 Token，Top-p 保留累计概率达到阈值的最小集合，之后都必须重新归一化再采样。二者改变的是解码分布，不是模型训练得到的原始分布。

贪心解码取 $\arg\max_i p_i$，采样按分类分布随机选择。局部最高概率序列不一定拥有全局最高联合概率，且更高随机性不等于更高创造力或正确性。

## 小结

logits 经 Temperature 与 Softmax 形成 Token 分布，截断策略再改变候选支持集。下一篇跟踪 Token ID 如何进入向量空间并用于相似度计算。

## 参考资料

- [The Curious Case of Neural Text Degeneration](https://arxiv.org/abs/1904.09751)
