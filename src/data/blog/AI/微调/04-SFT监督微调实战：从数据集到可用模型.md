---
title: SFT监督微调实战：从数据集到可用模型
author: Joekma
pubDatetime: 2026-06-26T00:00:00.000+08:00
modDatetime: 2026-07-12T00:00:00.000+08:00
description: "基于 Hugging Face TRL SFTTrainer 讲解监督微调完整流程，包括数据准备、聊天模板、训练配置、验证和模型保存。"
tags:
  - AI
  - LLM
  - SFT
  - TRL
draft: false
series: 大模型微调
seriesOrder: 4
language: zh-CN
---

## 概述

SFT（Supervised Fine-tuning，监督微调）是大模型微调最常见的第一步。它用高质量的“输入-理想输出”样例训练模型，让模型学会任务格式、语气、边界和回答结构。

![建立完整 SFT 流程](./images/fine-tuning-04-sft-workflow-figure-01.png)

![展示 messages 渲染与角色边界](./images/fine-tuning-04-message-rendering-figure-02.png)

![解释 assistant_only_loss 的模板前提](./images/fine-tuning-04-assistant-only-requirement-figure-03.png)

![锁定代码、依赖、模型与数据](./images/fine-tuning-04-version-lock-figure-04.png)

![映射 SFTConfig 到训练行为](./images/fine-tuning-04-training-config-figure-05.png)

![识别正常训练与过拟合](./images/fine-tuning-04-validation-curves-figure-06.png)

![理解完整断点状态](./images/fine-tuning-04-checkpoint-state-figure-07.png)

![区分输入 token 与新生成 token](./images/fine-tuning-04-generation-slicing-figure-08.png)

![总结六级 SFT 验收门](./images/fine-tuning-04-six-gates-figure-09.png)

### 前置知识与学习目标

你应已读过数据工程和训练基础两篇。学完本篇后，应能完成一次可复现的 SFT 小实验，并证明 loss mask、验证集、保存产物和推理模板都符合预期。

## 核心概念

### SFT 数据长什么样

对聊天模型来说，推荐使用 messages 格式：

```json
{
  "messages": [
    { "role": "system", "content": "你是一个专业的售后工单分析助手。" },
    {
      "role": "user",
      "content": "用户反馈付款后订单仍显示待支付，请分析原因。"
    },
    {
      "role": "assistant",
      "content": "可能原因包括支付回调延迟、订单状态同步失败或第三方支付通知丢失。建议先查询支付流水，再核对订单状态变更日志。"
    }
  ]
}
```

SFT 的核心不是让模型背答案，而是让模型学习：

- 如何理解任务。
- 如何组织答案。
- 如何遵守输出格式。
- 什么时候拒答或承认不确定。

### 训练目标

SFT 通常只训练 assistant 部分。这样可以避免模型学习用户提问方式，也能把训练信号集中在理想答案上。

```text
system/user：提供上下文
assistant：计算 loss
```

## 实战代码

### 1. 安装依赖

```bash
python -m venv .venv
# 激活虚拟环境后安装并锁定经过验证的版本；不要在生产文档中永久依赖浮动最新版。
pip install transformers datasets accelerate trl peft
pip freeze > requirements-lock.txt
```

### 2. 准备数据

`data/train.jsonl`：

```json
{
  "messages": [
    { "role": "system", "content": "你是一个工单分析助手。" },
    { "role": "user", "content": "订单付款成功但状态未更新怎么办？" },
    {
      "role": "assistant",
      "content": "先确认支付流水是否成功，再检查支付回调日志和订单状态同步任务。如果流水成功但订单未更新，应触发补偿任务并记录异常原因。"
    }
  ]
}
```

`data/valid.jsonl`：

```json
{
  "messages": [
    { "role": "system", "content": "你是一个工单分析助手。" },
    { "role": "user", "content": "用户说无法下载发票，应该排查什么？" },
    {
      "role": "assistant",
      "content": "优先检查用户是否具备开票权限、订单是否已完成、发票服务是否返回错误，以及下载链接是否过期。"
    }
  ]
}
```

### 3. 训练脚本

```python
from datasets import load_dataset
from transformers import AutoModelForCausalLM, AutoTokenizer
from trl import SFTConfig, SFTTrainer

model_name = "Qwen/Qwen2.5-0.5B-Instruct"

tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForCausalLM.from_pretrained(
    model_name,
    device_map="auto",
)

dataset = load_dataset(
    "json",
    data_files={
        "train": "data/train.jsonl",
        "validation": "data/valid.jsonl",
    },
)

training_args = SFTConfig(
    output_dir="outputs/sft",
    max_length=2048,
    per_device_train_batch_size=1,
    gradient_accumulation_steps=8,
    learning_rate=2e-5,
    num_train_epochs=3,
    logging_steps=10,
    eval_strategy="steps",
    eval_steps=50,
    save_steps=50,
    save_strategy="steps",
    save_total_limit=2,
    bf16=True,
    seed=42,
    data_seed=42,
    assistant_only_loss=True,
    report_to="none",
)

trainer = SFTTrainer(
    model=model,
    args=training_args,
    train_dataset=dataset["train"],
    eval_dataset=dataset["validation"],
    processing_class=tokenizer,
)

trainer.train()
trainer.save_model("outputs/sft/final")
tokenizer.save_pretrained("outputs/sft/final")
```

`assistant_only_loss=True` 不是对任意模板都自动有效。模板必须能返回 assistant token mask；运行正式训练前，应取一条样例检查 system/user 对应 label 为 `-100`、assistant token 对应真实 token ID。若模型模板不支持该 mask，应显式预处理 labels，而不是默默退化为全序列 loss。

`bf16=True` 也不是跨硬件默认值。应先检查设备是否支持 BF16；否则选择 FP16 或 FP32，并把实际 dtype 写入实验记录。

### 4. 推理验证

```python
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer

model_dir = "outputs/sft/final"
tokenizer = AutoTokenizer.from_pretrained(model_dir)
model = AutoModelForCausalLM.from_pretrained(model_dir, device_map="auto")

messages = [
    {"role": "system", "content": "你是一个工单分析助手。"},
    {"role": "user", "content": "用户付款成功但订单仍待支付，怎么排查？"},
]

text = tokenizer.apply_chat_template(
    messages,
    tokenize=False,
    add_generation_prompt=True,
)

inputs = tokenizer(text, return_tensors="pt").to(model.device)
with torch.no_grad():
    output_ids = model.generate(
        **inputs,
        max_new_tokens=256,
        do_sample=False,
    )

new_tokens = output_ids[0, inputs["input_ids"].shape[1] :]
print(tokenizer.decode(new_tokens, skip_special_tokens=True))
```

评估时使用确定性解码可以减少采样噪声。若线上必须采样，则基座模型与微调模型必须使用完全相同的 temperature、top-p、seed 和最大输出长度。

## 训练前后的验证门

1. **数据门**：抽样渲染 chat template，验证角色顺序、EOS、截断和 assistant mask。
2. **冒烟门**：用极小数据跑 1–2 step，确认 loss 有限、梯度存在且只更新预期参数。
3. **基线门**：在训练前保存基座模型与当前 Prompt 的固定评估结果。
4. **训练门**：记录 train/eval loss、有效 token 数、峰值显存和 checkpoint。
5. **产物门**：最终目录同时保存 tokenizer、chat template、generation config、训练配置和依赖锁。
6. **业务门**：固定评估集通过后才允许进入部署篇的合并或量化流程。

断点续训时使用 `trainer.train(resume_from_checkpoint=True)`，并确认恢复的不只是权重，还包括 optimizer、scheduler、global step 和随机状态。

## 关键配置

| 配置           | 建议                           |
| -------------- | ------------------------------ |
| 学习率         | SFT 常从 `1e-5` 到 `2e-5` 试起 |
| epoch          | 小数据集从 1 到 3 轮开始       |
| max_seq_length | 根据样例长度分布设置           |
| eval_steps     | 保证每轮能看到多次验证结果     |
| save_steps     | 结合训练耗时和磁盘空间设置     |

## 常见问题

### SFT 后模型为什么变啰嗦？

训练数据可能普遍啰嗦，或者系统提示没有约束回答长度。可以增加简洁答案样例，并在评估集中加入长度指标。

### 为什么训练后格式仍然不稳定？

常见原因是格式样例太少、格式不一致、推理时没有使用相同 chat template，或者训练时没有只对 assistant 部分计算 loss。

### 小数据集能训练吗？

可以做验证，但不要期待泛化很强。小数据集适合证明方向，大规模上线需要更丰富的失败样例和覆盖集。

## 检查清单

- 数据是否统一为 messages 格式？
- 训练和推理是否使用同一个 chat template？
- 是否有独立验证集？
- 是否记录了训练配置和依赖版本？
- 是否用业务样例人工检查输出质量？
- 是否和原始基座模型做了对比？

## 自检题

<details><summary>1. 设置 `assistant_only_loss=True` 后为什么仍要检查模板？</summary>

因为该功能依赖 chat template 提供 assistant token mask；不支持时无法可靠区分角色边界。

</details>

<details><summary>2. 为什么推理解码只截取新生成 token？</summary>

`generate` 返回输入与续写拼接后的序列。若不切片，打印结果会把 prompt 误当成模型输出。

</details>

<details><summary>3. checkpoint 能加载就算恢复成功吗？</summary>

不算。还要核对 optimizer、scheduler、step 和随机状态，否则训练轨迹与学习率都会改变。

</details>

## 参考资料

- [TRL SFTTrainer 文档](https://huggingface.co/docs/trl/en/sft_trainer)
- [Transformers TrainingArguments 文档](https://huggingface.co/docs/transformers/main_classes/trainer)
- [Hugging Face Chat Templates 文档](https://huggingface.co/docs/transformers/chat_templating)
