---
title: LangChain Memory：记忆组件
author: Joekma
pubDatetime: 2026-05-11T00:00:00.000+08:00
modDatetime: 2026-05-11T00:00:00.000+08:00
slug: langchain-memory
description: '深入讲解LangChain v1.0的Memory模块，包括对话记忆、缓冲记忆和组合记忆。'
tags:
  - LangChain
  - Memory
  - LLM
draft: false
series: LangChain
seriesOrder: 7
language: zh-CN
---

## 概述

Memory（记忆组件）是 LangChain 中用于在对话或处理过程中保持状态的模块。它让 LLM 能够记住之前的信息，实现真正的多轮对话体验。

### 为什么需要 Memory？

| 场景 | 没有 Memory | 有 Memory |
|------|------------|----------|
| 多轮对话 | 每轮都是新对话 | 记住之前的上下文 |
| 长对话 | 丢失早期信息 | 保持完整对话历史 |
| 上下文理解 | 无法关联之前内容 | 理解完整的上下文 |

### Memory 工作原理

```
┌─────────────────────────────────────────────────────────────┐
│                    Memory 工作流程                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  用户输入 → 加载历史 → 合并上下文 → 调用模型                  │
│                                      │                       │
│                                      ▼                       │
│                               保存到记忆                      │
│                                      │                       │
│                                      ▼                       │
│                               下轮使用                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Memory 类型概览

| 类型 | 说明 | 适用场景 |
|------|------|---------|
| **ConversationBufferMemory** | 简单缓冲记忆 | 标准聊天 |
| **ConversationSummaryMemory** | 摘要记忆 | 长对话 |
| **CombinedMemory** | 组合记忆 | 多维度记忆 |
| **VectorStoreRetrieverMemory** | 向量记忆 | 语义检索 |

## ConversationBufferMemory

### 基础用法

```python
from langchain.memory import ConversationBufferMemory
from langchain_core.messages import HumanMessage, AIMessage

memory = ConversationBufferMemory(
    memory_key="history",
    return_messages=True
)

memory.chat_memory.add_user_message("你好")
memory.chat_memory.add_ai_message("你好！有什么可以帮助你的吗？")

history = memory.load_memory_variables({})
print(history["history"])
```

### 在 Agent 中使用

```python
from langchain.agents import create_agent
from langchain.memory import ConversationBufferMemory
from langchain_openai import ChatOpenAI
from langchain_core.tools import tool

memory = ConversationBufferMemory(
    memory_key="chat_history",
    return_messages=True
)

@tool
def get_weather(city: str) -> str:
    """获取城市天气"""
    return f"{city}今天晴天"

llm = ChatOpenAI(model="gpt-4o")

agent = create_agent(
    model=llm,
    tools=[get_weather],
    system_prompt="你是一个有帮助的助手。",
    memory=memory
)

result1 = agent.invoke({
    "messages": [{"role": "user", "content": "我叫张三"}]
})

result2 = agent.invoke({
    "messages": [{"role": "user", "content": "我叫什么名字？"}]
})
```

## ConversationSummaryMemory

### 对长对话进行摘要

```python
from langchain.memory import ConversationSummaryMemory
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(model="gpt-4o")

memory = ConversationSummaryMemory(
    llm=llm,
    memory_key="summary",
    return_messages=True
)

for i in range(10):
    memory.chat_memory.add_user_message(f"这是第{i+1}轮对话")

summary = memory.load_memory_variables({})
print(summary["summary"])
```

## CombinedMemory

### 组合多种记忆类型

```python
from langchain.memory import (
    ConversationBufferMemory,
    ConversationSummaryMemory
)
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

llm = ChatOpenAI(model="gpt-4o")

conv_memory = ConversationBufferMemory(
    memory_key="recent_history",
    return_messages=True
)

summary_memory = ConversationSummaryMemory(
    llm=llm,
    memory_key="summary",
    return_messages=True
)

def chat_with_combined_memory(input_text, messages):
    recent_history = conv_memory.load_memory_variables({}).get("history", [])
    summary = summary_memory.load_memory_variables({}).get("summary", "")

    prompt = ChatPromptTemplate.from_messages([
        ("system", "你是一个友好的助手。"),
        MessagesPlaceholder(variable_name="history"),
        ("system", "对话摘要：{summary}"),
        ("human", "{input}")
    ])

    response = llm.invoke(prompt.format_messages(
        history=recent_history,
        summary=summary,
        input=input_text
    ))

    conv_memory.chat_memory.add_user_message(input_text)
    conv_memory.chat_memory.add_ai_message(response.content)
    summary_memory.chat_memory.add_user_message(input_text)
    summary_memory.chat_memory.add_ai_message(response.content)

    return response.content

chat_with_combined_memory("我们公司最近推出了新产品", [])
```

## VectorStoreRetrieverMemory

### 基于语义检索的记忆

```python
from langchain.memory import VectorStoreRetrieverMemory
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import Chroma

embeddings = OpenAIEmbeddings()
vectorstore = Chroma(embedding_function=embeddings)

memory = VectorStoreRetrieverMemory(
    vectorstore=vectorstore,
    memory_key="chat_history",
    k=3
)

memory.save_context(
    {"input": "我喜欢Python编程"},
    {"output": "Python是一门很棒的编程语言！"}
)
memory.save_context(
    {"input": "我在上海工作"},
    {"output": "上海是一座国际化大都市！"}
)

related = memory.load_memory_variables(
    {"input": "我在哪里工作？"}
)
print(related)
```

## 持久化记忆

### 使用 Checkpointer

```python
from langgraph.checkpoint.memory import MemorySaver

checkpointer = MemorySaver()

memory = ConversationBufferMemory(
    memory_key="chat_history",
    return_messages=True,
    checkpointer=checkpointer
)

config = {"configurable": {"thread_id": "user_123"}}

memory.save_context(
    {"input": "你好"},
    {"output": "你好！"}
)

history = memory.load_memory_variables({})
print(history)
```

### 保存和加载

```python
import json

vars = memory.load_memory_variables({})
with open("memory.json", "w") as f:
    json.dump(vars, f)

with open("memory.json", "r") as f:
    loaded = json.load(f)
    print(loaded)
```

## 最佳实践

| 实践 | 说明 |
|------|------|
| **选择合适的类型** | 短对话用 Buffer，长对话用 Summary |
| **设置 token 限制** | 避免超出模型上下文限制 |
| **定期清理** | 删除无用记忆 |
| **持久化存储** | 生产环境使用 checkpointer |

### 记忆类型选择指南

```
对话长度
  │
  │短（< 5轮）
  │  └── ConversationBufferMemory
  │
  │中等（5-20轮）
  │  └── ConversationSummaryMemory
  │
  │长（> 20轮）
  │  └── 需要检索 → VectorStoreRetrieverMemory
  │
  │ 复杂场景
  │  └── CombinedMemory（组合多种）
```

### 限制记忆长度

```python
memory = ConversationBufferMemory(
    max_token_limit=2000
)
```

## 总结

| Memory 类型 | 特点 | 适用场景 |
|------------|------|---------|
| **BufferMemory** | 完整历史 | 短对话 |
| **SummaryMemory** | 摘要存储 | 长对话 |
| **VectorMemory** | 语义检索 | 大量记忆 |
| **CombinedMemory** | 多类型组合 | 复杂需求 |

Memory 让 LLM 应用具有真正的对话能力，选择合适的记忆类型可以优化性能和用户体验。