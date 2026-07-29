---
title: "KV Cache、上下文长度与计算复杂度"
author: Joekma
pubDatetime: 2026-07-18T00:00:00.000+08:00
modDatetime: 2026-07-29T00:00:00.000+08:00
description: "区分 Prefill 与 Decode，推导 KV Cache 的 Shape、显存增长和上下文长度复杂度。"
tags: [AI, 数学, 大模型数学, KVCache]
draft: false
series: "AI 工程数学 · 数学知识在大模型中的综合应用"
seriesOrder: 5
language: zh-CN
---

## 为什么缓存 K、V

自回归第 $t$ 步只新增一个 Token。历史 Token 在固定模型下产生的 K、V 不变，可以缓存；新 Query 只需与全部历史 Key 比较。

若层数为 $L$、KV 头数 $H_{kv}$、头维 $D$、缓存长度 $T$、每元素 $s$ 字节，单样本缓存近似：

$$
M_{\mathrm{KV}}
=
2L H_{kv}TDs
$$

系数 2 来自 K 和 V。批次、并行布局、页表与内存碎片还会增加实际占用。GQA/MQA 通过减少 KV 头数降低缓存。

Prefill 一次处理长度 $T$ 的提示，标准 Attention 分数规模为 $T^2$；Decode 每步只有一个新 Query，对历史长度做 $O(TD)$ 的注意力，并从缓存读取 K、V。生成 $G$ 个 Token 的总 Decode 工作仍随上下文不断增长。

KV Cache 用显存换重复计算，并不减少每步必须读取的历史长度。滑动窗口、分页缓存和前缀复用分别改变可见范围、内存管理和跨请求复用，数学语义不同。

## 小结

KV Cache 避免重算历史 K、V，但容量线性随层数、长度和 KV 头数增长。最后一篇把前向概率、交叉熵、反向梯度与更新闭合起来。

## 参考资料

- [FlashAttention](https://arxiv.org/abs/2205.14135)
