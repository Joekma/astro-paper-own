---
title: LangChain Chains：链式调用
author: Joekma
pubDatetime: 2026-05-11T00:00:00.000+08:00
modDatetime: 2026-05-11T00:00:00.000+08:00
slug: langchain-chains
description: '深入讲解LangChain v1.0的Chain模块，包括LCEL表达式、Sequential Chain和自定义链。'
tags:
  - LangChain
  - Chain
  - LLM
draft: false
series: LangChain
seriesOrder: 6
language: zh-CN
---

## 概述

Chain（链）是 LangChain 的核心概念之一，它允许我们将多个组件组合在一起，形成一个连贯的工作流程。通过链式调用，可以将提示词模板、模型、输出解析器等组件串联起来，实现复杂的 LLM 应用。

### 为什么需要 Chain？

| 需求 | 解决方案 |
|------|---------|
| 单次调用无法完成任务 | 将任务分解为多个步骤 |
| 需要复用处理流程 | 创建可复用的链 |
| 多模型协作 | 组合多个模型 |
| 后处理输出 | 添加解析和转换 |

### Chain 类型概览

```
┌─────────────────────────────────────────────────────────────┐
│                      Chain 类型                              │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   LCEL 管道   │  │  Sequential │  │  Transform   │     │
│  │              │  │    Chain    │  │    Chain     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  RouterChain │  │  RetrievalQA │  │  Custom Chain │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

## LCEL 管道组合

LangChain Expression Language (LCEL) 提供了简洁的链式 API：

### 基础管道

```python
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser

llm = ChatOpenAI(model="gpt-4o")

chain = PromptTemplate.from_template("解释{topic}") | llm | StrOutputParser()

result = chain.invoke({"topic": "区块链"})
print(result)
```

### 动态链

```python
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate

llm = ChatOpenAI(model="gpt-4o")

def get_template(task: str) -> PromptTemplate:
    templates = {
        "summary": PromptTemplate.from_template("总结：{text}"),
        "translate": PromptTemplate.from_template("翻译成英文：{text}"),
        "analyze": PromptTemplate.from_template("分析：{text}"),
    }
    return templates.get(task, templates["summary"])

def create_chain(task: str):
    template = get_template(task)
    return template | llm

chain = create_chain("summary")
result = chain.invoke({"text": "LangChain很强大"})
```

## Sequential Chain

### SimpleSequentialChain

单输入单输出的顺序链：

```python
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser

llm = ChatOpenAI(model="gpt-4o")

chain1 = PromptTemplate.from_template(
    "为一个{character}写一个简短的冒险故事（100字以内）。"
) | llm

chain2 = PromptTemplate.from_template(
    "将以下故事翻译成英文：\n{story}"
) | llm

sequential_chain = chain1 | chain2 | StrOutputParser()

result = sequential_chain.invoke({
    "character": "勇敢的小骑士"
})

print(result)
```

### 多步链

```python
chain = (
    PromptTemplate.from_template("分析：{text}")
    | llm
    | StrOutputParser()
    | (lambda output: {"analysis": output})
    | PromptTemplate.from_template("基于分析{analysis}写摘要")
    | llm
    | StrOutputParser()
)
```

## TransformChain

用于数据转换的链：

```python
from langchain.chains import TransformChain
from langchain_core.runnables import RunnableLambda

def transform_function(inputs: dict) -> dict:
    text = inputs["text"]
    lines = text.split("\n")
    return {"lines": lines, "line_count": len(lines)}

transform_chain = TransformChain(
    input_variables=["text"],
    output_variables=["lines", "line_count"],
    transform=transform_function
)

result = transform_chain.invoke({
    "text": "第一行\n第二行\n第三行\n第四行"
})
print(f"行数：{result['line_count']}")
```

## 自定义 Chain

### 使用 RunnableLambda

```python
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate
from langchain_core.runnables import RunnableLambda

llm = ChatOpenAI(model="gpt-4o")

def research_step(inputs: dict) -> dict:
    topic = inputs["topic"]
    chain = PromptTemplate.from_template("为{topic}写一份简要研究报告") | llm
    result = chain.invoke({"topic": topic})
    return {"research": result.content}

def question_step(inputs: dict) -> dict:
    research = inputs["research"]
    chain = PromptTemplate.from_template(
        "基于以下研究，提出3个深入问题：\n{research}"
    ) | llm
    result = chain.invoke({"research": research})
    return {"questions": result.content}

custom_chain = RunnableLambda(research_step) | RunnableLambda(question_step)

result = custom_chain.invoke({"topic": "量子计算"})
print(result)
```

## 异步链

```python
import asyncio
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser

llm = ChatOpenAI(model="gpt-4o")

chain = PromptTemplate.from_template("用一句话解释：{topic}") | llm | StrOutputParser()

async def async_invoke():
    result = await chain.ainvoke({"topic": "量子纠缠"})
    print(result)

    results = await chain.abatch([
        {"topic": "人工智能"},
        {"topic": "机器学习"},
        {"topic": "深度学习"}
    ])
    for r in results:
        print(r)

asyncio.run(async_invoke())
```

## 错误处理

```python
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.exceptions import OutputParserException

chain = PromptTemplate.from_template("返回JSON：{text}") | llm | JsonOutputParser()

try:
    result = chain.invoke({"text": "some text"})
except OutputParserException as e:
    print(f"解析错误: {e}")
```

## 最佳实践

| 实践 | 说明 |
|------|------|
| **单一职责** | 每个链负责一个特定任务 |
| **可复用性** | 创建通用链供多处使用 |
| **错误处理** | 为链添加异常处理 |
| **日志记录** | 使用 callbacks 参数调试 |
| **性能优化** | 批量任务使用异步 API |

### 链的性能优化

```python
results = chain.batch([
    {"input": "问题1"},
    {"input": "问题2"},
    {"input": "问题3"}
])

async def batch_process(items):
    results = await chain.abatch([{"input": i} for i in items])
    return results
```

## 总结

Chain 是 LangChain 的核心抽象：

| 链类型 | 用途 | 特点 |
|--------|------|------|
| **LCEL 管道** | 基础链 | 模板+模型+解析器 |
| **Sequential** | 顺序链 | 多步骤处理 |
| **Transform** | 转换链 | 数据转换 |
| **自定义链** | 特殊逻辑 | RunnableLambda |

掌握 Chain 的使用，是构建复杂 LLM 应用的基础。