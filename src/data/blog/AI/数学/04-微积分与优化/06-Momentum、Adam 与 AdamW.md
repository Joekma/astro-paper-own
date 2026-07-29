---
title: "Momentum、Adam 与 AdamW"
author: Joekma
pubDatetime: 2026-07-18T00:00:00.000+08:00
modDatetime: 2026-07-29T00:00:00.000+08:00
description: "推导动量、Adam 的矩估计和偏差修正，并区分 L2 正则化与解耦权重衰减。"
tags: [AI, 数学, 微积分与优化, AdamW]
draft: false
series: "AI 工程数学 · 微积分与优化"
seriesOrder: 6
language: zh-CN
---

## 动量平滑更新方向

$$
\mathbf v_t=\beta\mathbf v_{t-1}+(1-\beta)\mathbf g_t,
\qquad
\theta_t=\theta_{t-1}-\eta\mathbf v_t
$$

指数移动平均抑制批梯度噪声，并在方向持续一致时积累速度。

Adam 同时跟踪一阶矩和二阶矩：

$$
\mathbf m_t=\beta_1\mathbf m_{t-1}+(1-\beta_1)\mathbf g_t
$$

$$
\mathbf v_t=\beta_2\mathbf v_{t-1}+(1-\beta_2)\mathbf g_t^2
$$

初始为零会使早期估计偏小，因此使用 $\hat{\mathbf m}_t=\mathbf m_t/(1-\beta_1^t)$、$\hat{\mathbf v}_t=\mathbf v_t/(1-\beta_2^t)$，再更新：

$$
\theta_t=\theta_{t-1}
-\eta\frac{\hat{\mathbf m}_t}{\sqrt{\hat{\mathbf v}_t}+\varepsilon}
$$

AdamW 把权重衰减从自适应梯度中解耦，额外执行与参数成比例的收缩。它不应施加到 bias 和部分归一化参数，具体分组需明确。

## 小结

Momentum 平滑方向，Adam 按历史平方梯度调整每个参数步长，AdamW 独立处理权重衰减。下一篇讨论决定整体步长的学习率。

## 参考资料

- [Adam](https://arxiv.org/abs/1412.6980)
- [Decoupled Weight Decay Regularization](https://arxiv.org/abs/1711.05101)
