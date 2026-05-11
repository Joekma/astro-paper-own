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
# 导入os模块，用于设置环境变量
import os
# 设置OpenAI API密钥，这是访问OpenAI模型的必要凭证
os.environ["OPENAI_API_KEY"] = "your-api-key"
```

### 快速验证

```python
# 从langchain_openai包导入ChatOpenAI类
from langchain_openai import ChatOpenAI

# 创建ChatOpenAI实例，指定使用gpt-4模型
llm = ChatOpenAI(model="gpt-4")

# 使用invoke方法发送消息给LLM
# LLM将返回一个包含生成内容的响应对象
response = llm.invoke("你好，请介绍一下你自己")
# 从响应对象中提取文本内容并打印
print(response.content)
```

## Model I/O 模块

### Chat Models

```python
# 导入ChatOpenAI类，用于创建聊天模型实例
from langchain_openai import ChatOpenAI

# 创建聊天模型实例，使用gpt-4模型
chat_model = ChatOpenAI(model="gpt-4")

# 使用invoke方法发送聊天请求
# 模型将返回一个AIMessage对象，包含生成的回复
chat_response = chat_model.invoke("解释什么是量子计算")
# 打印回复的文本内容
print(chat_response.content)
```

### 提示词模板

```python
# 导入PromptTemplate类，用于创建提示词模板
from langchain_core.prompts import PromptTemplate

# 从模板字符串创建PromptTemplate
# {text} 是一个占位符，会在调用时被实际值替换
template = PromptTemplate.from_template("请将以下中文翻译成英文：{text}")

# 使用invoke方法填充模板中的占位符
# 传入字典指定text变量的值
prompt = template.invoke({"text": "今天天气真好"})

# 将填充后的提示词发送给聊天模型
response = chat_model.invoke(prompt)
# 打印翻译结果
print(response.content)
```

## Chain 模块

### LCEL 管道（新版本推荐）

```python
# 导入所需的组件
from langchain_openai import ChatOpenAI  # 聊天模型
from langchain_core.prompts import PromptTemplate  # 提示词模板
from langchain_core.output_parsers import StrOutputParser  # 输出解析器

# 创建LLM实例，temperature=0表示输出更确定性
llm = ChatOpenAI(model="gpt-4", temperature=0)

# 创建提示词模板
# {profession} 和 {question} 是动态参数，会被实际值替换
template = PromptTemplate.from_template("你是一个专业的{profession}，请回答以下问题：{question}")

# 使用LCEL管道操作符组合组件
# template | llm | StrOutputParser() 表示：模板 -> 模型 -> 解析器
# 数据会依次流经这三个组件
chain = template | llm | StrOutputParser()

# 调用链，传入参数
# 模板会先填充参数，然后发送给LLM，最后解析输出
result = chain.invoke({
    "profession": "软件工程师",
    "question": "什么是设计模式？"
})

# 打印最终结果（已经是字符串格式）
print(result)
```

## Agent 模块

```python
# 导入工具装饰器和Agent创建函数
from langchain_core.tools import tool
from langchain_openai import ChatOpenAI
from langchain import create_react_agent

# 使用@tool装饰器定义一个工具函数
# 装饰器会自动将函数转换为LangChain工具
@tool
def get_weather(city: str) -> str:
    """获取城市天气"""
    # 返回模拟的天气信息
    return f"{city}今天的天气是晴天，25摄氏度。"

# 创建LLM实例
llm = ChatOpenAI(model="gpt-4")

# 将工具注册到列表中，供Agent使用
tools = [get_weather]

# 创建ReAct Agent（推理+行动Agent）
# Agent能够自主决定何时使用工具来回答问题
agent = create_react_agent(llm, tools)

# 调用Agent，传入消息列表
# Agent会分析问题，决定是否需要调用工具
result = agent.invoke({"messages": ["北京今天的天气怎么样？"]})

# 从结果中提取最后一条消息的内容并打印
# [-1]表示最后一条消息，也就是最终回答
print(result["messages"][-1].content)
```

## Memory 模块

```python
# 导入记忆组件和提示词相关类
from langchain.memory import ConversationBufferMemory
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_openai import ChatOpenAI

# 创建对话缓冲记忆实例
# memory_key: 在提示词中引用记忆的变量名
# return_messages=True: 返回消息对象而非字符串
memory = ConversationBufferMemory(
    memory_key="chat_history",
    return_messages=True
)

# 创建聊天提示词模板
# MessagesPlaceholder会在运行时被对话历史替换
prompt = ChatPromptTemplate.from_messages([
    ("system", "你是一个友好的助手。"),  # 系统消息设定助手角色
    MessagesPlaceholder(variable_name="chat_history"),  # 动态插入对话历史
    ("human", "{input}")  # 用户当前输入
])

def chat(input_text):
    # 从记忆中加载历史对话
    # load_memory_variables返回字典，包含"chat_history"键
    history = memory.load_memory_variables({}).get("chat_history", [])

    # 创建链并调用
    chain = prompt | ChatOpenAI(model="gpt-4")
    response = chain.invoke({
        "input": input_text,
        "chat_history": history  # 将历史对话传入模板
    })

    # 将本次对话保存到记忆中
    # add_user_message: 保存用户消息
    memory.chat_memory.add_user_message(input_text)
    # add_ai_message: 保存AI回复
    memory.chat_memory.add_ai_message(response.content)

    return response.content

# 第一轮对话：告诉AI我的名字和职业
chat("我叫张三，是一名软件工程师")
# 第二轮对话：询问名字，Agent会从记忆中查找
chat("我叫什么名字？")
# 第三轮对话：询问职业，同样从记忆中获取
chat("我的职业是什么？")
```

## Retrieval 模块

```python
# 导入文档加载器、文本分割器、嵌入模型和向量存储
from langchain_community.document_loaders import TextLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import Chroma

# 第一步：加载文档
# TextLoader用于加载文本文件
loader = TextLoader("文档路径.txt")
documents = loader.load()

# 第二步：分割文档
# RecursiveCharacterTextSplitter递归分割文档，保持语义连贯性
# chunk_size: 每个文本块的最大字符数
# chunk_overlap: 块之间的重叠字符数，用于保持上下文连续性
splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
docs = splitter.split_documents(documents)

# 第三步：创建嵌入模型
# OpenAIEmbeddings将文本转换为向量表示
embeddings = OpenAIEmbeddings()

# 第四步：创建向量存储
# Chroma是轻量级向量数据库，存储文档及其向量
vectorstore = Chroma.from_documents(docs, embeddings)

# 第五步：将向量存储转换为检索器
# 检索器用于后续的相似性搜索
retriever = vectorstore.as_retriever()
```

## 实战示例：构建简单问答系统

```python
# 导入所需的LangChain组件
from langchain_openai import ChatOpenAI  # OpenAI聊天模型
from langchain_core.prompts import PromptTemplate  # 提示词模板
from langchain_core.output_parsers import StrOutputParser  # 输出解析器

# 创建LLM实例
# temperature=0.7: 适度的随机性，平衡创造性和准确性
llm = ChatOpenAI(model="gpt-4", temperature=0.7)

# 创建提示词模板
# 模板定义了助手的角色和回答格式
# {context} 和 {question} 是动态参数
template = PromptTemplate.from_template(
    """你是一个知识渊博的助手。基于以下上下文信息，
请回答用户的问题。如果上下文中没有相关信息，请如实说明。

上下文：
{context}

问题：{question}

回答："""
)

# 使用LCEL构建问答链
# 管道操作符将模板、模型和解析器串联起来
chain = template | llm | StrOutputParser()

# 定义上下文信息（可以是知识库、文档等）
context = """
LangChain 是一个用于构建 LLM 应用的框架。
它提供了丰富的组件，包括模型、提示词模板、链、代理等。
"""

# 调用链进行问答
# 传入上下文和问题，链会自动组合它们并生成答案
result = chain.invoke({
    "context": context,
    "question": "LangChain 是什么？"
})

# 打印回答结果
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
