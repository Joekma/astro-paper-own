---
title: "溢出、下溢与稳定 Softmax"
author: Joekma
pubDatetime: 2026-07-18T00:00:00.000+08:00
modDatetime: 2026-07-29T00:00:00.000+08:00
description: "推导 max-shift Softmax 与 log-sum-exp，解释溢出、下溢、mask 和 log-softmax 的稳定实现。"
tags: [AI, 数学, 数值计算, Softmax]
draft: false
series: "AI 工程数学 · 数值计算"
seriesOrder: 3
language: zh-CN
---

## 直接指数化的问题

$$
p_i=\frac{e^{z_i}}{\sum_je^{z_j}}
$$

大正数的指数可能溢出为 `inf`，大负数可能下溢为 0。令 $m=\max_jz_j$，利用平移不变性：

$$
p_i=\frac{e^{z_i-m}}{\sum_je^{z_j-m}}
$$

现在最大指数输入为 0，至少有一项等于 1，既避免溢出，也避免分母全为 0。

对数 Softmax 应用：

$$
\log p_i
=
z_i-\operatorname{logsumexp}(\mathbf z)
$$

其中：

$$
\operatorname{logsumexp}(\mathbf z)
=m+\log\sum_je^{z_j-m}
$$

这比先算 Softmax 再取对数稳定，因此交叉熵实现通常融合 log-softmax 与 NLL。

Mask 应在 Softmax 前加入足够小的值；若某一行全部被 mask，分母无有效项，仍可能产生 `NaN`，必须定义空行语义。

## 小结

稳定 Softmax 通过减最大值控制指数范围，log-sum-exp 避免概率先下溢。下一篇研究把连续值映射到整数网格。

## 参考资料

- [Accurately Computing the Log-Sum-Exp and Softmax Functions](https://arxiv.org/abs/1909.03469)
