---
title: LangChain 入门指南：核心概念与架构
author: Joekma
pubDatetime: 2026-05-07T00:00:00.000+08:00
modDatetime: 2026-05-07T00:00:00.000+08:00
slug: langchain-getting-started
description: 'LangChain入门指南，详细介绍核心概念、架构组件和开发环境配置。'
tags:
  - LangChain
  - LLM
  - AI
draft: false
series: LangChain
language: zh-CN
---

## 概述

LangChain 是一个用于构建基于大语言模型（LLM）应用的开源框架。它提供了一套丰富的工具和抽象，帮助开发者快速构建复杂的 LLM 应用，如聊天机器人、问答系统、内容生成工具等。

### 为什么选择 LangChain？

| 特性 | 说明 |
|------|------|
| **模块化设计** | 各组件独立，可灵活组合 |
| **丰富的组件库** | 内置大量工具、链和代理 |
| **主流模型支持** | 支持 OpenAI、HuggingFace 等多种模型 |
| **检索增强生成** | 内置 RAG 所需的所有组件 |
| **活跃社区** | 丰富的文档和示例 |

## 核心概念

### LangChain 六大模块

LangChain 的核心架构围绕六大模块展开：

```
┌─────────────────────────────────────────────────────────────────┐
│                         LangChain                               │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐            │
│  │  Model  │  │ Prompt  │  │  Chain  │  │  Agent  │            │
│  │    I/O  │  │Template │  │         │  │         │            │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘            │
│  ┌─────────┐  ┌─────────┐                                      │
│  │ Memory  │  │Retrieval│                                      │
│  │         │  │         │                                      │
│  └─────────┘  └─────────┘                                      │
└─────────────────────────────────────────────────────────────────┘
```

| 模块 | 功能 |
|------|------|
| **Model I/O** | 与语言模型交互，管理输入输出 |
| **Prompt Template** | 提示词模板化和管理 |
| **Chain** | 将多个组件串联成工作流 |
| **Agent** | 自主决策和执行任务的智能体 |
| **Memory** | 在对话或处理过程中保持状态 |
| **Retrieval** | 检索增强生成（RAG）相关组件 |

## 环境配置

### 安装 LangChain

```bash
pip install langchain-openai langchain-community
```

### 环境变量配置

```bash
export OPENAI_API_KEY="your-api-key"
```

```python
import os
os.environ["OPENAI_API_KEY"] = "your-api-key"
```

### 快速验证

```python
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(model="gpt-4")

response = llm.invoke("你好，请介绍一下你自己")
print(response.content)
```

## Model I/O 模块

### Chat Models

```python
from langchain_openai import ChatOpenAI

chat_model = ChatOpenAI(model="gpt-4")

chat_response = chat_model.invoke("解释什么是量子计算")
print(chat_response.content)
```

### 提示词模板

```python
from langchain_core.prompts import PromptTemplate

template = PromptTemplate.from_template("请将以下中文翻译成英文：{text}")
prompt = template.invoke({"text": "今天天气真好"})
response = chat_model.invoke(prompt)
print(response.content)
```

## Chain 模块

### LCEL 管道（新版本推荐）

```python
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser

llm = ChatOpenAI(model="gpt-4", temperature=0)

template = PromptTemplate.from_template("你是一个专业的{profession}，请回答以下问题：{question}")
chain = template | llm | StrOutputParser()

result = chain.invoke({
    "profession": "软件工程师",
    "question": "什么是设计模式？"
})
print(result)
```

## Agent 模块

```python
from langchain_core.tools import tool
from langchain_openai import ChatOpenAI
from langchain import create_react_agent

@tool
def get_weather(city: str) -> str:
    """获取城市天气"""
    return f"{city}今天的天气是晴天，25摄氏度。"

llm = ChatOpenAI(model="gpt-4")
tools = [get_weather]

agent = create_react_agent(llm, tools)

result = agent.invoke({"messages": ["北京今天的天气怎么样？"]})
print(result["messages"][-1].content)
```

## Memory 模块

```python
from langchain.memory import ConversationBufferMemory
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_openai import ChatOpenAI

memory = ConversationBufferMemory(
    memory_key="chat_history",
    return_messages=True
)

prompt = ChatPromptTemplate.from_messages([
    ("system", "你是一个友好的助手。"),
    MessagesPlaceholder(variable_name="chat_history"),
    ("human", "{input}")
])

def chat(input_text):
    history = memory.load_memory_variables({}).get("chat_history", [])

    chain = prompt | ChatOpenAI(model="gpt-4")
    response = chain.invoke({
        "input": input_text,
        "chat_history": history
    })

    memory.chat_memory.add_user_message(input_text)
    memory.chat_memory.add_ai_message(response.content)

    return response.content

chat("我叫张三，是一名软件工程师")
chat("我叫什么名字？")
chat("我的职业是什么？")
```

## Retrieval 模块

```python
from langchain_community.document_loaders import TextLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import Chroma

loader = TextLoader("文档路径.txt")
documents = loader.load()

splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
docs = splitter.split_documents(documents)

embeddings = OpenAIEmbeddings()
vectorstore = Chroma.from_documents(docs, embeddings)

retriever = vectorstore.as_retriever()
```

## 实战示例：构建简单问答系统

```python
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser

llm = ChatOpenAI(model="gpt-4", temperature=0.7)

template = PromptTemplate.from_template(
    """你是一个知识渊博的助手。基于以下上下文信息，
请回答用户的问题。如果上下文中没有相关信息，请如实说明。

上下文：
{context}

问题：{question}

回答："""
)

chain = template | llm | StrOutputParser()

context = """
LangChain 是一个用于构建 LLM 应用的框架。
它提供了丰富的组件，包括模型、提示词模板、链、代理等。
"""

result = chain.invoke({
    "context": context,
    "question": "LangChain 是什么？"
})
print(result)
```

## 总结

本文介绍了 LangChain 的核心概念和架构：

| 模块 | 核心功能 |
|------|---------|
| **Model I/O** | 与 LLM 交互的核心接口 |
| **Prompt Template** | 灵活构建动态提示词 |
| **Chain** | 组合多个组件的工作流 |
| **Agent** | 自主决策和执行 |
| **Memory** | 保持对话/处理状态 |
| **Retrieval** | 实现 RAG 能力 |

LangChain 的模块化设计让开发者可以灵活组合各种组件，构建强大的 LLM 应用。后续文章将深入讲解每个模块的具体用法。
