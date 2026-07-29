---
title: "梯度下降、SGD 与 Mini-batch"
author: Joekma
pubDatetime: 2026-07-18T00:00:00.000+08:00
modDatetime: 2026-07-29T00:00:00.000+08:00
description: "比较全量梯度、随机梯度和 Mini-batch 估计，解释 batch size、噪声与更新频率的权衡。"
tags: [AI, 数学, 微积分与优化, SGD]
draft: false
series: "AI 工程数学 · 微积分与优化"
seriesOrder: 5
language: zh-CN
---

## 从总体目标到批梯度

经验风险为：

$$
L(\theta)=\frac1N\sum_{i=1}^{N}\ell_i(\theta)
$$

全量梯度下降每步计算全部样本：

$$
\theta_{t+1}=\theta_t-\eta\nabla L(\theta_t)
$$

SGD 用一个样本估计梯度，Mini-batch 用子集 $\mathcal B_t$：

$$
\mathbf g_t
=
\frac1{|\mathcal B_t|}
\sum_{i\in\mathcal B_t}\nabla\ell_i(\theta_t)
$$

在适当随机采样下，$\mathbf g_t$ 是全量梯度的无偏或近似无偏估计。小批次噪声大但更新频繁，大批次吞吐高、估计稳定，却占用更多显存且每个 epoch 更新次数更少。

梯度累积把多个微批梯度相加后再更新，可模拟更大有效 batch；必须正确处理损失归约和学习率，否则梯度尺度会改变。

epoch 表示看过一遍数据，step 表示一次参数更新。调度器和日志若混淆二者，会造成学习率与实验比较错误。

## 小结

Mini-batch 用可控噪声换取计算效率，是训练中对全量梯度的统计估计。下一篇加入动量和自适应尺度。

## 参考资料

- [On the Importance of Initialization and Momentum](https://proceedings.mlr.press/v28/sutskever13.html)
