---
title: LangChain Memory：记忆组件
author: Joekma
pubDatetime: 2026-05-07T00:00:00.000+08:00
modDatetime: 2026-05-07T00:00:00.000+08:00
slug: langchain-memory
description: '深入讲解LangChain的Memory模块，包括对话记忆、缓冲记忆、实体记忆和各种记忆组合方式。'
tags:
  - LangChain
  - Memory
  - LLM
draft: false
series: LangChain
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
│  ┌─────────┐    ┌─────────┐    ┌─────────┐                  │
│  │   存储   │ ←→ │  读取   │ ←→ │  写入   │                  │
│  └─────────┘    └─────────┘    └─────────┘                  │
│      ↑                                                    │
│      │                                                    │
│  ┌───┴─────┐                                             │
│  │ 上下文  │                                             │
│  │ 历史数据 │                                             │
│  └─────────┘                                             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Memory 类型概览

| 类型 | 说明 | 适用场景 |
|------|------|---------|
| **BufferMemory** | 简单缓冲记忆 | 短期对话 |
| **ConversationBufferMemory** | 对话缓冲 | 标准聊天 |
| **ConversationSummaryMemory** | 摘要记忆 | 长对话 |
| **CombinedMemory** | 组合记忆 | 多维度记忆 |
| **VectorStoreRetrieverMemory** | 向量记忆 | 语义检索 |

## BufferMemory

### 基础用法（新版本）

```python
# 导入记忆组件和消息类型
from langchain.memory import ConversationBufferMemory
from langchain_core.messages import SystemMessage

# 创建对话缓冲记忆实例
memory = ConversationBufferMemory(
    memory_key="history",        # 引用记忆的变量名
    return_messages=True         # 返回消息对象而非字符串
)

# 向记忆中添加用户消息
memory.chat_memory.add_user_message("你好")

# 向记忆中添加AI回复
memory.chat_memory.add_ai_message("你好！有什么可以帮助你的吗？")

# 从记忆中加载数据
# 返回包含"history"键的字典
history = memory.load_memory_variables({})
print(history)
```

## ConversationMemory

### ConversationBufferMemory（新版本）

完整的对话缓冲记忆：

```python
from langchain.memory import ConversationBufferMemory
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

memory = ConversationBufferMemory(
    memory_key="history",
    return_messages=True
)

prompt = ChatPromptTemplate.from_messages([
    ("system", "你是一个友好的助手。"),
    MessagesPlaceholder(variable_name="history"),
    ("human", "{input}")
])

def chat_with_memory(input_text):
    history = memory.load_memory_variables({})["history"]

    chain = prompt | ChatOpenAI(model="gpt-4")
    response = chain.invoke({
        "input": input_text,
        "history": history
    })

    memory.chat_memory.add_user_message(input_text)
    memory.chat_memory.add_ai_message(response.content)

    return response.content

response = chat_with_memory("我喜欢编程")
print(response)

response = chat_with_memory("我的爱好是什么？")
print(response)
```

## SummaryMemory

### ConversationSummaryMemory（新版本）

对长对话进行摘要，节省 token：

```python
from langchain.memory import ConversationSummaryMemory
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(model="gpt-4")

memory = ConversationSummaryMemory(
    llm=llm,
    memory_key="summary",
    return_messages=True
)

for i in range(5):
    memory.chat_memory.add_user_message(f"这是第{i+1}轮对话，内容涉及项目进度和技术讨论")

summary = memory.load_memory_variables({})
print(summary["summary"])
```

## CombinedMemory（新版本）

### 组合多种记忆类型

```python
from langchain.memory import (
    ConversationBufferMemory,
    ConversationSummaryMemory
)
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

llm = ChatOpenAI(model="gpt-4")

conv_memory = ConversationBufferMemory(
    memory_key="recent_history",
    return_messages=True
)

summary_memory = ConversationSummaryMemory(
    llm=llm,
    memory_key="summary",
    return_messages=True
)

prompt = ChatPromptTemplate.from_messages([
    ("system", "你是一个友好的助手。"),
    MessagesPlaceholder(variable_name="history"),
    ("system", "对话摘要：{summary}"),
    ("human", "{input}")
])

def chat_with_combined_memory(input_text):
    recent_history = conv_memory.load_memory_variables({}).get("history", [])
    summary = summary_memory.load_memory_variables({}).get("summary", "")

    chain = prompt | llm
    response = chain.invoke({
        "input": input_text,
        "history": recent_history,
        "summary": summary
    })

    conv_memory.chat_memory.add_user_message(input_text)
    conv_memory.chat_memory.add_ai_message(response.content)
    summary_memory.chat_memory.add_user_message(input_text)
    summary_memory.chat_memory.add_ai_message(response.content)

    return response.content

chat_with_combined_memory("我们公司最近推出了新产品，用户反馈很好")
```

## 向量记忆（新版本）

### VectorStoreRetrieverMemory

基于语义检索的记忆：

```python
from langchain.memory import VectorStoreRetrieverMemory
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_openai import ChatOpenAI

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

## 使用 Memory 在 Chain 中

### 直接使用（新版本）

```python
from langchain.memory import ConversationBufferMemory
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

memory = ConversationBufferMemory(memory_key="chat_history", return_messages=True)

prompt = ChatPromptTemplate.from_messages([
    ("system", "你是一个友好的助手。"),
    MessagesPlaceholder(variable_name="chat_history"),
    ("human", "{question}")
])

def chat(question):
    history = memory.load_memory_variables({}).get("chat_history", [])

    chain = prompt | ChatOpenAI(model="gpt-4")
    response = chain.invoke({
        "question": question,
        "chat_history": history
    })

    memory.chat_memory.add_user_message(question)
    memory.chat_memory.add_ai_message(response.content)

    return response.content

chat("我叫小明，请记住我的名字")
chat("我叫什么名字？")
```

### 在 Agent 中使用（新版本）

```python
from langchain_core.tools import tool
from langchain_openai import ChatOpenAI
from langchain import create_conversational_retrieval_agent

llm = ChatOpenAI(model="gpt-4")

memory = ConversationBufferMemory(
    memory_key="chat_history",
    return_messages=True
)

@tool
def search_tool(query: str) -> str:
    """搜索工具"""
    return f"关于'{query}'的搜索结果..."

tools = [search_tool]

agent = create_conversational_retrieval_agent(llm, tools, memory=memory)

agent.invoke({"input": "我叫王五，是一名数据科学家"})
agent.invoke({"input": "我的职业是什么？"})
```

## 持久化记忆

### 使用基础存储

```python
# 导入记忆组件
from langchain.memory import ConversationBufferMemory

# 创建对话缓冲记忆
memory = ConversationBufferMemory(
    memory_key="chat_history",
    return_messages=True
)

# 添加对话消息
memory.chat_memory.add_user_message("你好")
memory.chat_memory.add_ai_message("你好！")

# 获取消息列表
# chat_memory.messages 是存储消息的列表
chat_history = memory.chat_memory.messages
```

## 记忆与提示词模板

### 自定义带记忆的提示词（新版本）

```python
from langchain.memory import ConversationBufferMemory
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_openai import ChatOpenAI

memory = ConversationBufferMemory(
    memory_key="history",
    return_messages=True
)

prompt = ChatPromptTemplate.from_messages([
    ("system", "你是一个友好的助手。记住之前的对话内容。"),
    MessagesPlaceholder(variable_name="chat_history"),
    ("human", "{question}")
])
```

## 记忆管理

### 清空记忆

```python
memory.clear()

memory.chat_memory.messages.clear()
```

### 保存和加载

```python
memory.save_context(
    {"input": "用户输入"},
    {"output": "AI输出"}
)

vars = memory.load_memory_variables({})
print(vars)
```

## 最佳实践

| 实践 | 说明 |
|------|------|
| **选择合适的类型** | 短对话用 Buffer，长对话用 Summary |
| **设置 token 限制** | 避免超出模型上下文限制 |
| **定期清理** | 删除无用记忆 |
| **持久化存储** | 生产环境使用数据库存储 |
| **分离关注点** | 使用 CombinedMemory 管理多种记忆 |

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

## 常见问题

### Q1：如何限制记忆长度？

```python
memory = ConversationBufferMemory(
    max_token_limit=1000
)
```

### Q2：如何获取记忆内容？

```python
vars = memory.load_memory_variables({})
print(vars["history"])
```

### Q3：如何持久化记忆？

```python
import json

vars = memory.load_memory_variables({})
with open("memory.json", "w") as f:
    json.dump(vars, f)
```

## 总结

| Memory 类型 | 特点 | 适用场景 |
|------------|------|---------|
| **BufferMemory** | 完整历史 | 短对话 |
| **SummaryMemory** | 摘要存储 | 长对话 |
| **VectorMemory** | 语义检索 | 大量记忆 |
| **CombinedMemory** | 多类型组合 | 复杂需求 |

Memory 让 LLM 应用具有真正的对话能力，选择合适的记忆类型可以优化性能和用户体验。
