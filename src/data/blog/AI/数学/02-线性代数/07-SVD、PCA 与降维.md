---
title: "SVD、PCA 与降维"
author: Joekma
pubDatetime: 2026-07-18T00:00:00.000+08:00
modDatetime: 2026-07-29T00:00:00.000+08:00
description: "从奇异值分解推导低秩近似和主成分分析，解释中心化、解释方差及二维图的局限。"
tags: [AI, 数学, 线性代数, PCA]
draft: false
series: "AI 工程数学 · 线性代数"
seriesOrder: 7
language: zh-CN
---

## SVD 分解任意矩阵

对 $\mathbf{X}\in\mathbb{R}^{m\times n}$：

$$
\mathbf{X}
=
\mathbf{U}\mathbf{\Sigma}\mathbf{V}^{\mathsf T}
$$

$\mathbf{U}$ 与 $\mathbf{V}$ 的列是正交方向，$\mathbf{\Sigma}$ 的非负对角元素 $\sigma_1\ge\sigma_2\ge\cdots$ 是奇异值。它把变换解释为：先在输入空间旋转，再沿正交方向缩放，最后旋转到输出空间。

奇异值平方分别是 $\mathbf{X}^{\mathsf T}\mathbf{X}$ 和 $\mathbf{X}\mathbf{X}^{\mathsf T}$ 的非零特征值，因此 SVD 与特征分解相连，却不要求 $\mathbf{X}$ 是方阵。

## 截断 SVD 给出最佳低秩近似

只保留前 $k$ 个奇异值：

$$
\mathbf{X}_k
=
\mathbf{U}_k\mathbf{\Sigma}_k\mathbf{V}_k^{\mathsf T}
$$

在常见矩阵范数下，它是 rank 不超过 $k$ 的最佳近似。保留的奇异值越多，重建误差越小，参数与计算节省越少。

“奇异值很小”只说明该方向对当前矩阵能量贡献小，不保证对具体任务不重要。压缩必须用下游指标验证。

## PCA 从中心化数据中找主方向

设每行是一个样本，先中心化：

$$
\mathbf{X}_c=\mathbf{X}-\mathbf{1}\boldsymbol{\mu}^{\mathsf T}
$$

PCA 寻找投影后方差最大的正交方向。对 $\mathbf{X}_c$ 做 SVD，其右奇异向量就是主方向。第 $i$ 个主成分的解释方差比为：

$$
r_i=\frac{\sigma_i^2}{\sum_j\sigma_j^2}
$$

未中心化时，第一方向可能主要指向数据均值，而不是变化方向。

## 降维图不能承担证明

把高维 Embedding 投到二维会丢失距离和邻域信息。PCA 只保留线性高方差方向；t-SNE、UMAP 等方法又有不同目标。二维图适合提出假设和检查异常，不足以证明存在清晰语义簇或因果结构。

## 常见误区

- 把 SVD 限定为方阵。
- 做 PCA 前忘记中心化。
- 把解释方差高等同于任务信息重要。
- 用二维投影中的距离替代原空间定量评估。

## 小结

SVD 将任意矩阵拆成正交方向与缩放，截断后得到低秩近似；PCA 将它用于中心化数据的最大方差投影。下一篇把线性代数集中应用到 Attention 的 Shape 链。

## 参考资料

- [The Elements of Statistical Learning](https://hastie.su.domains/ElemStatLearn/)
