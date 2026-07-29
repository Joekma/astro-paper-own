---
title: "从交叉熵到参数更新：Transformer 数学闭环"
author: Joekma
pubDatetime: 2026-07-18T00:00:00.000+08:00
modDatetime: 2026-07-29T00:00:00.000+08:00
description: "把 Embedding、Attention、logits、交叉熵、反向传播与 AdamW 串成 Transformer 训练闭环。"
tags: [AI, 数学, 大模型数学, Transformer]
draft: false
series: "AI 工程数学 · 数学知识在大模型中的综合应用"
seriesOrder: 6
language: zh-CN
---

## 前向：从 Token 到 logits

输入 ID `[B,T]` 经 Embedding 得到 $\mathbf X_0\in\mathbb R^{B\times T\times C}$。每层用 Attention 在位置间混合信息，用前馈网络在每个位置变换特征，并通过残差与归一化保持 Shape `[B,T,C]`：

$$
\mathbf X_{l+1}=F_l(\mathbf X_l;\theta_l)
$$

最后输出投影得到 `[B,T,V]` logits，经 log-softmax 形成下一个 Token 分布。

## 目标：预测右移一位的 Token

对有效位置集合 $\mathcal I$：

$$
L(\theta)
=
-\frac1{|\mathcal I|}
\sum_{(b,t)\in\mathcal I}
\log p_\theta(x_{b,t+1}\mid x_{b,\le t})
$$

因果 Mask 保证位置 $t$ 不能读取未来；padding 和不参与训练的位置不应进入分母。

## 反向与更新

输出层先得到 logits 梯度。对单个 one-hot 目标，交叉熵对 logits 的梯度为：

$$
\frac{\partial L}{\partial z_k}=p_k-y_k
$$

链式法则将它反传到输出矩阵、各 Transformer 层和 Embedding。数据并行归约、梯度累积和裁剪完成后，AdamW 根据一阶/二阶矩与权重衰减更新参数。

完整闭环是：

```text
Token ID → Embedding → 多层表示 → logits → 概率
→ 交叉熵 → 反向传播 → 梯度归约/裁剪 → AdamW 更新
```

训练损失下降表示模型更好拟合训练分布的条件 Token 概率，不自动保证事实性、推理能力或部署任务成功。

## 小结

Transformer 训练把本系列全部主线连接起来：线性代数负责表示与 Attention，概率和信息论定义分布与损失，微积分传递梯度，优化器更新参数，数值计算保证闭环可执行。

## 参考资料

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
- [The Annotated Transformer](https://nlp.seas.harvard.edu/annotated-transformer/)
