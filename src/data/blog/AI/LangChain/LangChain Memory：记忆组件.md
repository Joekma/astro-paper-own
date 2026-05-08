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
| **EntityMemory** | 实体记忆 | 实体信息提取 |
| **CombinedMemory** | 组合记忆 | 多维度记忆 |
| **VectorStoreRetrieverMemory** | 向量记忆 | 语义检索 |

## BufferMemory

### 基础用法

```python
from langchain.memory import BufferMemory
from langchain_openai import ChatOpenAI
from langchain.chains.conversation import ConversationChain

llm = ChatOpenAI(model="gpt-4", temperature=0)

# 创建记忆
memory = BufferMemory(
    ai_prefix="AI助手",
    human_prefix="用户"
)

# 创建对话链
conversation = ConversationChain(
    llm=llm,
    memory=memory,
    verbose=True
)

# 对话
conversation.invoke("我叫张三，是一名软件工程师")
conversation.invoke("我叫什么名字？")
conversation.invoke("我的职业是什么？")
```

### 自定义缓冲区

```python
from langchain.memory import BufferMemory

memory = BufferMemory(
    max_token_limit=100,  # 最大 token 数
    ai_prefix="助手",
    human_prefix="我"
)

# 手动添加消息
memory.chat_memory.add_user_message("你好")
memory.chat_memory.add_ai_message("你好！有什么可以帮助你的吗？")

# 获取历史
history = memory.load_memory_variables({})
print(history)
```

## ConversationMemory

### ConversationBufferMemory

完整的对话缓冲记忆：

```python
from langchain.memory import ConversationBufferMemory
from langchain_openai import ChatOpenAI
from langchain.chains.conversation import ConversationChain

memory = ConversationBufferMemory(
    memory_key="history",
    return_messages=True,
    output_key="response"
)

conversation = ConversationChain(
    llm=ChatOpenAI(model="gpt-4"),
    memory=memory,
    prompt=...  # 可选的自定义提示词
)

# 对话
response = conversation.invoke({"input": "我喜欢编程"})
print(f"回复: {response['response']}")

# 查看记忆内容
print(memory.load_memory_variables({}))
```

## SummaryMemory

### ConversationSummaryMemory

对长对话进行摘要，节省 token：

```python
from langchain.memory import ConversationSummaryMemory
from langchain_openai import ChatOpenAI
from langchain.chains.conversation import ConversationChain

llm = ChatOpenAI(model="gpt-4")

# 创建摘要记忆
memory = ConversationSummaryMemory(
    llm=llm,  # 需要 LLM 来生成摘要
    memory_key="summary",
    return_messages=True
)

conversation = ConversationChain(
    llm=llm,
    memory=memory,
    verbose=True
)

# 多次对话后查看摘要
for i in range(5):
    conversation.invoke({f"input": f"这是第{i+1}轮对话，内容涉及项目进度和技术讨论"})

# 查看生成的摘要
summary = memory.load_memory_variables({})
print(summary["summary"])
```

### 对比 Buffer vs Summary

| 特性 | BufferMemory | SummaryMemory |
|------|-------------|--------------|
| 存储内容 | 完整对话历史 | 摘要文本 |
| Token 消耗 | 线性增长 | 固定长度 |
| 信息完整性 | 完全保留 | 可能丢失细节 |
| 适用场景 | 短对话 | 长对话 |

## EntityMemory

### 提取和记忆实体

```python
from langchain.memory import EntityMemory
from langchain_openai import ChatOpenAI
from langchain.chains.conversation import ConversationChain

llm = ChatOpenAI(model="gpt-4")

memory = EntityMemory(
    llm=llm,
    memory_key="entities",
    return_messages=True
)

conversation = ConversationChain(
    llm=llm,
    memory=memory,
    verbose=True
)

# 对话中提取实体
conversation.invoke("我叫李明，在北京工作，是一名产品经理")
conversation.invoke("我的名字是什么？")
conversation.invoke("我在哪个城市工作？")

# 查看提取的实体
entities = memory.load_memory_variables({})
print(entities["entities"])
```

## CombinedMemory

### 组合多种记忆类型

```python
from langchain.memory import (
    ConversationBufferMemory,
    ConversationSummaryMemory,
    CombinedMemory
)
from langchain_openai import ChatOpenAI
from langchain.chains.conversation import ConversationChain

llm = ChatOpenAI(model="gpt-4")

# 创建多种记忆
conv_memory = ConversationBufferMemory(
    memory_key="recent_history",
    return_messages=True
)

summary_memory = ConversationSummaryMemory(
    llm=llm,
    memory_key="summary",
    return_messages=True
)

# 组合记忆
memory = CombinedMemory(
    memories=[conv_memory, summary_memory]
)

conversation = ConversationChain(
    llm=llm,
    memory=memory,
    verbose=True
)

# 对话
conversation.invoke("我们公司最近推出了新产品，用户反馈很好")
conversation.invoke("最近有什么新产品吗？")
```

## 向量记忆

### VectorStoreRetrieverMemory

基于语义检索的记忆：

```python
from langchain.memory import VectorStoreRetrieverMemory
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_openai import ChatOpenAI

# 创建向量存储
embeddings = OpenAIEmbeddings()
vectorstore = Chroma(embedding_function=embeddings)

# 创建向量记忆
memory = VectorStoreRetrieverMemory(
    vectorstore=vectorstore,
    memory_key="chat_history",
    k=3,  # 检索最近3条相关记忆
    search_score_threshold=0.5  # 相似度阈值
)

# 添加记忆
memory.save_context(
    {"input": "我喜欢Python编程"},
    {"output": "Python是一门很棒的编程语言！"}
)
memory.save_context(
    {"input": "我在上海工作"},
    {"output": "上海是一座国际化大都市！"}
)

# 检索相关记忆
related = memory.load_memory_variables(
    {"prompt": "我在哪里工作？"}
)
print(related)
```

## 使用 Memory 在 Chain 中

### 直接在 LLMChain 中使用

```python
from langchain.memory import ConversationBufferMemory
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate
from langchain.chains.llm import LLMChain

llm = ChatOpenAI(model="gpt-4")

# 创建带记忆的链
memory = ConversationBufferMemory(memory_key="chat_history")

prompt = PromptTemplate.from_template(
    """基于以下对话历史回答问题：

    历史：{chat_history}

    问题：{question}

    回答："""
)

chain = LLMChain(
    llm=llm,
    prompt=prompt,
    memory=memory,
    verbose=True
)

# 使用
chain.invoke({
    "question": "我叫小明，请记住我的名字"
})

chain.invoke({
    "question": "我叫什么名字？"
})
```

### 在 Agent 中使用

```python
from langchain.agents import Agent, tool
from langchain.agents.agent_types import AgentType
from langchain.memory import ConversationBufferMemory
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(model="gpt-4")

# 创建记忆
memory = ConversationBufferMemory(
    memory_key="chat_history",
    return_messages=True
)

# 创建 Agent
agent = Agent.from_agent_type(
    agent_type=AgentType.CONVERSATIONAL_REACT_DESCRIPTION,
    llm=llm,
    memory=memory,
    tools=[tool1, tool2]  # 可选的工具
)

# 对话
agent.invoke("我叫王五，是一名数据科学家")
agent.invoke("我的职业是什么？")
```

## 持久化记忆

### 使用 SQL 存储

```python
from langchain.memory import SQLStore, ConversationBufferMemory

# 创建 SQL 存储
store = SQLStore(
    session_id="user_123",
    table_name="conversation_memory"
)

memory = ConversationBufferMemory(
    chat_memory=store
)

# 对话自动持久化
memory.chat_memory.add_user_message("你好")
memory.chat_memory.add_ai_message("你好！")
```

### 使用 Redis 存储

```python
from langchain.memory import RedisChatMemory
from langchain_openai import ChatOpenAI

memory = RedisChatMemory(
    session_id="user_123",
    redis_url="redis://localhost:6379",
    memory_key="chat_history"
)
```

## 记忆与提示词模板

### 自定义带记忆的提示词

```python
from langchain.memory import ConversationBufferMemory
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI

memory = ConversationBufferMemory(
    memory_key="history",
    return_messages=True
)

# 自定义提示词
prompt = ChatPromptTemplate.from_messages([
    ("system", "你是一个友好的助手。记住之前的对话内容。"),
    ("placeholder", "{chat_history}"),
    ("human", "{question}"),
])

# 创建链
chain = prompt | ChatOpenAI(model="gpt-4")

# 使用
from langchain.chains.history_aware_retriever import create_history_aware_retriever
```

## 记忆管理

### 清空记忆

```python
# 清空所有记忆
memory.clear()

# 删除特定消息
memory.chat_memory.messages.pop()
```

### 保存和加载

```python
# 保存记忆
memory.save_context(
    {"input": "用户输入"},
    {"output": "AI输出"}
)

# 加载记忆变量
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
  │ 短（< 5轮）
  │  └── ConversationBufferMemory
  │
  │ 中等（5-20轮）
  │  └── ConversationSummaryMemory
  │
  │ 长（> 20轮）
  │  ├── 需要检索 → VectorStoreRetrieverMemory
  │  └── 实体信息 → EntityMemory
  │
  │ 复杂场景
  │  └── CombinedMemory（组合多种）
```

## 常见问题

### Q1：如何限制记忆长度？

```python
memory = ConversationBufferMemory(
    max_token_limit=1000  # 限制最大 token 数
)
```

### Q2：如何获取记忆内容？

```python
vars = memory.load_memory_variables({})
print(vars["history"])
```

### Q3：如何持久化记忆？

```python
# 使用数据库
from langchain.memory import SQLStore

store = SQLStore(session_id="user_session")
memory = ConversationBufferMemory(chat_memory=store)
```

## 总结

| Memory 类型 | 特点 | 适用场景 |
|------------|------|---------|
| **BufferMemory** | 完整历史 | 短对话 |
| **SummaryMemory** | 摘要存储 | 长对话 |
| **EntityMemory** | 实体提取 | 实体信息 |
| **VectorMemory** | 语义检索 | 大量记忆 |
| **CombinedMemory** | 多类型组合 | 复杂需求 |

Memory 让 LLM 应用具有真正的对话能力，选择合适的记忆类型可以优化性能和用户体验。
