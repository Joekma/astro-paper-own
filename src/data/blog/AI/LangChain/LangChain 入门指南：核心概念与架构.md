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
# 基础安装
pip install langchain

# 安装所有依赖
pip install langchain[all]

# 推荐安装（常用依赖）
pip install langchain-openai langchain-community
```

### 环境变量配置

```bash
# 设置 OpenAI API Key
export OPENAI_API_KEY="your-api-key"

# 或者在代码中设置
import os
os.environ["OPENAI_API_KEY"] = "your-api-key"
```

### 快速验证

```python
from langchain_openai import ChatOpenAI

# 创建模型实例
llm = ChatOpenAI(model="gpt-4")

# 测试调用
response = llm.invoke("你好，请介绍一下你自己")
print(response.content)
```

## Model I/O 模块

### LLMs 和 Chat Models

LangChain 支持两种类型的模型：

| 类型 | 说明 | 使用场景 |
|------|------|---------|
| **LLMs** | 纯文本补全模型 | 文本生成、翻译 |
| **Chat Models** | 对话模型 | 聊天机器人、问答 |

```python
from langchain_openai import ChatOpenAI, OpenAI

# Chat Model
chat_model = ChatOpenAI(model="gpt-4")

# LLM
llm = OpenAI(model="gpt-3.5-turbo-instruct")

# Chat Model 调用
chat_response = chat_model.invoke("解释什么是量子计算")
print(chat_response.content)

# LLM 调用
llm_response = llm.invoke("写一首关于春天的诗")
print(llm_response)
```

### 提示词模板

使用模板可以动态构建提示词：

```python
from langchain_core.prompts import PromptTemplate

# 简单模板
template = PromptTemplate.from_template("请将以下中文翻译成英文：{text}")
prompt = template.invoke({"text": "今天天气真好"})
response = chat_model.invoke(prompt)
print(response.content)

# 带示例的模板
template_with_examples = PromptTemplate.from_template(
    """将以下单词转换为复数形式：

    单词：{word}
    复数："""
)
```

## Chain 模块

Chain 是 LangChain 的核心概念，用于将多个组件串联起来。

### LLMChain

最基本的链，用于将提示词模板和模型连接：

```python
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate
from langchain.chains.llm import LLMChain

# 创建模型
llm = ChatOpenAI(model="gpt-4", temperature=0)

# 创建提示词模板
template = PromptTemplate.from_template("你是一个专业的{profession}，请回答以下问题：{question}")
chain = LLMChain(llm=llm, prompt=template)

# 运行链
result = chain.invoke({
    "profession": "软件工程师",
    "question": "什么是设计模式？"
})
print(result["text"])
```

### Sequential Chain

顺序执行多个链：

```python
from langchain.chains.sequential import SequentialChain

# 第一个链：翻译
chain1 = LLMChain(
    llm=llm,
    prompt=PromptTemplate.from_template("将以下文本翻译成法语：{text}"),
    output_key="french_text"
)

# 第二个链：总结
chain2 = LLMChain(
    llm=llm,
    prompt=PromptTemplate.from_template("用一句话总结以下文本：{french_text}"),
    output_key="summary"
)

# 组合成顺序链
sequential_chain = SequentialChain(
    chains=[chain1, chain2],
    input_variables=["text"],
    output_variables=["french_text", "summary"]
)

# 执行
result = sequential_chain.invoke({
    "text": "LangChain is a powerful framework for building LLM applications."
})
```

## Agent 模块

Agent 可以让模型自主决定执行哪些操作：

```python
from langchain.agents import Agent, tool
from langchain.agents.agent_types import AgentType
from langchain_core.prompts import PromptTemplate

# 定义工具
@tool
def get_weather(city: str) -> str:
    """获取城市天气"""
    return f"{city}今天的天气是晴天，25摄氏度。"

# 创建代理
tools = [get_weather]

agent = Agent.from_agent_type(
    agent_type=AgentType.ZERO_SHOT_REACT_DESCRIPTION,
    llm=llm,
    tools=tools
)

# 运行代理
result = agent.invoke("北京今天的天气怎么样？")
print(result)
```

## Memory 模块

Memory 用于在对话或处理过程中保持状态：

```python
from langchain.memory import ConversationBufferMemory
from langchain.chains.conversation import ConversationChain

# 创建内存
memory = ConversationBufferMemory()

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

## Retrieval 模块

用于实现检索增强生成（RAG）：

```python
from langchain_community.document_loaders import TextLoader
from langchain.text_splitter import CharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import Chroma

# 加载文档
loader = TextLoader("文档路径.txt")
documents = loader.load()

# 分割文档
splitter = CharacterTextSplitter(chunk_size=1000, chunk_overlap=0)
docs = splitter.split_documents(documents)

# 创建向量存储
embeddings = OpenAIEmbeddings()
vectorstore = Chroma.from_documents(docs, embeddings)

# 创建检索器
retriever = vectorstore.as_retriever()
```

## 实战示例：构建简单问答系统

```python
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate
from langchain.chains.llm import LLMChain

# 初始化模型
llm = ChatOpenAI(model="gpt-4", temperature=0.7)

# 定义提示词
template = """你是一个知识渊博的助手。基于以下上下文信息，
请回答用户的问题。如果上下文中没有相关信息，请如实说明。

上下文：
{context}

问题：{question}

回答："""

prompt = PromptTemplate(
    template=template,
    input_variables=["context", "question"]
)

# 创建链
chain = LLMChain(llm=llm, prompt=prompt)

# 模拟上下文
context = """
LangChain 是一个用于构建 LLM 应用的框架。
它提供了丰富的组件，包括模型、提示词模板、链、代理等。
"""

# 问答
result = chain.invoke({
    "context": context,
    "question": "LangChain 是什么？"
})
print(result["text"])
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
