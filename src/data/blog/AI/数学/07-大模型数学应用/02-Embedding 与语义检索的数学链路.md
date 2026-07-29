---
title: "Embedding 与语义检索的数学链路"
author: Joekma
pubDatetime: 2026-07-18T00:00:00.000+08:00
modDatetime: 2026-07-29T00:00:00.000+08:00
description: "串联 Token 查表、向量池化、归一化、余弦相似度与最近邻排序的数学步骤。"
tags: [AI, 数学, 大模型数学, Embedding]
draft: false
series: "AI 工程数学 · 数学知识在大模型中的综合应用"
seriesOrder: 2
language: zh-CN
---

## 从离散 ID 到连续向量

Embedding 表 $\mathbf E\in\mathbb R^{V\times C}$，Token ID $i$ 选择第 $i$ 行：

$$
\mathbf x_i=\mathbf E_{i,:}
$$

语言模型经过上下文层得到 `[B,T,C]`；句子级检索向量还需池化，例如带 Mask 均值：

$$
\mathbf e
=
\frac{\sum_t m_t\mathbf h_t}{\sum_t m_t}
$$

必须排除 padding，并遵循模型规定的前缀、特殊 Token 与池化方式。

归一化后：

$$
\hat{\mathbf e}=\frac{\mathbf e}{\|\mathbf e\|_2},
\qquad
s(q,d)=\hat{\mathbf e}_q^{\mathsf T}\hat{\mathbf e}_d
$$

点积等于余弦相似度。若模型未按余弦目标训练，强制归一化可能丢失有用范数信息。

检索是在候选向量中求最高相似度。精确搜索成本约随候选数 $N$ 与维度 $C$ 线性增长；近似索引用召回率换延迟和内存。相似度只是表示空间内的相关性代理，不能证明文档事实正确。

## 小结

语义检索链由查表/编码、池化、归一化、相似度和最近邻组成，每一步都有明确 Shape 与假设。下一篇进入 Attention 与多头计算。

## 参考资料

- [Sentence-BERT](https://arxiv.org/abs/1908.10084)
