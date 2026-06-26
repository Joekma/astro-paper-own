---
title: LoRA与QLoRA：参数高效微调原理和实战
author: Joekma
pubDatetime: 2026-06-26T00:00:00.000+08:00
modDatetime: 2026-06-26T00:00:00.000+08:00
description: "系统讲解 LoRA 与 QLoRA 的原理、适用场景、关键参数、PEFT 实战代码、合并部署方式和常见问题。"
tags:
  - AI
  - LLM
  - LoRA
  - QLoRA
  - PEFT
draft: false
series: 大模型微调
seriesOrder: 5
language: zh-CN
---

## 概述

全参数微调成本高、显存压力大，不适合大多数团队作为第一选择。LoRA 和 QLoRA 属于参数高效微调（PEFT）方法，它们通过训练少量新增参数，让模型在较低成本下适应新任务。

![LoRA 与 QLoRA 参数高效微调](./images/05-lora-qlora.svg)

## 核心概念

### LoRA 的直觉

LoRA 的核心思想是：不直接更新原始权重，而是在某些线性层旁边增加两个低秩矩阵。

```text
原始输出：y = W x
LoRA 输出：y = W x + B A x
```

其中：

- `W` 是冻结的原始权重。
- `A` 和 `B` 是可训练的低秩矩阵。
- rank `r` 越大，可学习能力越强，参数和显存也越高。

### QLoRA 的直觉

QLoRA 会用 4-bit 方式加载基座模型，再训练 LoRA adapter。它进一步降低显存占用，适合单卡或小规模 GPU 环境。

```text
基座模型：4-bit 量化加载
训练参数：LoRA adapter
优化目标：在低显存下完成 SFT
```

### LoRA 训练哪些层

常见目标层包括：

| 模块              | 作用                 | 是否常训练       |
| ----------------- | -------------------- | ---------------- |
| q_proj            | attention query 投影 | 常见             |
| k_proj            | attention key 投影   | 常见             |
| v_proj            | attention value 投影 | 常见             |
| o_proj            | attention 输出投影   | 常见             |
| gate_proj         | MLP 门控             | 视任务而定       |
| up_proj/down_proj | MLP 升降维           | 视显存和效果而定 |

## 关键参数

| 参数             | 说明           | 建议                  |
| ---------------- | -------------- | --------------------- |
| `r`              | 低秩维度       | 从 8、16、32 试起     |
| `lora_alpha`     | LoRA 缩放系数  | 常设置为 `2r` 或 `r`  |
| `lora_dropout`   | LoRA dropout   | 小数据可设 0.05       |
| `target_modules` | 注入 LoRA 的层 | 先覆盖 attention 投影 |
| `bias`           | 是否训练 bias  | 多数场景设为 `none`   |

## 实战代码

### 1. LoRA 配置

```python
from peft import LoraConfig, TaskType

lora_config = LoraConfig(
    task_type=TaskType.CAUSAL_LM,
    r=16,
    lora_alpha=32,
    lora_dropout=0.05,
    bias="none",
    target_modules=[
        "q_proj",
        "k_proj",
        "v_proj",
        "o_proj",
        "gate_proj",
        "up_proj",
        "down_proj",
    ],
)
```

### 2. QLoRA 加载模型

```python
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig

model_name = "Qwen/Qwen2.5-0.5B-Instruct"

quant_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_compute_dtype=torch.bfloat16,
    bnb_4bit_use_double_quant=True,
)

tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForCausalLM.from_pretrained(
    model_name,
    quantization_config=quant_config,
    device_map="auto",
)
```

### 3. 结合 SFTTrainer

```python
import torch
from datasets import load_dataset
from peft import LoraConfig, TaskType
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
from trl import SFTConfig, SFTTrainer

model_name = "Qwen/Qwen2.5-0.5B-Instruct"

quant_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_compute_dtype=torch.bfloat16,
    bnb_4bit_use_double_quant=True,
)

tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForCausalLM.from_pretrained(
    model_name,
    quantization_config=quant_config,
    device_map="auto",
)

peft_config = LoraConfig(
    task_type=TaskType.CAUSAL_LM,
    r=16,
    lora_alpha=32,
    lora_dropout=0.05,
    bias="none",
    target_modules=["q_proj", "k_proj", "v_proj", "o_proj"],
)

dataset = load_dataset(
    "json",
    data_files={"train": "data/train.jsonl", "validation": "data/valid.jsonl"},
)

args = SFTConfig(
    output_dir="outputs/qlora",
    max_length=2048,
    per_device_train_batch_size=1,
    gradient_accumulation_steps=8,
    learning_rate=2e-4,
    num_train_epochs=3,
    logging_steps=10,
    eval_steps=50,
    save_steps=50,
)

trainer = SFTTrainer(
    model=model,
    args=args,
    train_dataset=dataset["train"],
    eval_dataset=dataset["validation"],
    peft_config=peft_config,
    processing_class=tokenizer,
)

trainer.train()
trainer.save_model("outputs/qlora/final-adapter")
```

### 4. 合并 LoRA 权重

部署时可以保留 adapter，也可以合并到基座模型。

```python
from peft import PeftModel
from transformers import AutoModelForCausalLM, AutoTokenizer

base_model = "Qwen/Qwen2.5-0.5B-Instruct"
adapter_dir = "outputs/qlora/final-adapter"
merged_dir = "outputs/merged-model"

tokenizer = AutoTokenizer.from_pretrained(base_model)
model = AutoModelForCausalLM.from_pretrained(base_model, device_map="auto")
model = PeftModel.from_pretrained(model, adapter_dir)

merged_model = model.merge_and_unload()
merged_model.save_pretrained(merged_dir)
tokenizer.save_pretrained(merged_dir)
```

## 常见问题

### LoRA rank 越大越好吗？

不一定。rank 越大，表达能力越强，但更容易过拟合，训练成本也更高。建议从小 rank 开始，用验证集和人工评审比较。

### Adapter 部署和合并部署怎么选？

adapter 部署便于多个业务共用基座模型，也方便回滚。合并部署推理链路更简单，但每个业务模型会占用完整权重空间。

### QLoRA 会不会影响效果？

通常会有一些量化误差，但对很多 SFT 任务是可接受的。关键是用固定评估集比较 LoRA、QLoRA 和基座模型，而不是只看训练 loss。

## 检查清单

- 是否确认目标层名称与模型结构匹配？
- 是否记录 LoRA rank、alpha、dropout 和目标模块？
- 是否比较 LoRA、QLoRA 和全参数微调成本？
- 是否保存 adapter、tokenizer 和训练配置？
- 是否设计了合并和回滚策略？

## 参考资料

- [Hugging Face PEFT LoRA 文档](https://huggingface.co/docs/peft)
- [TRL SFTTrainer 文档](https://huggingface.co/docs/trl/en/sft_trainer)
- [Transformers bitsandbytes 量化文档](https://huggingface.co/docs/transformers/quantization/bitsandbytes)
