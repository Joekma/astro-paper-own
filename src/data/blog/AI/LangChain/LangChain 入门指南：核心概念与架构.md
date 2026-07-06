---
title: LangChain 入门指南：核心概念与架构
author: Joekma
pubDatetime: 2026-05-11T00:00:00.000+08:00
modDatetime: 2026-05-11T00:00:00.000+08:00
slug: langchain-getting-started
description: 'LangChain v1.0入门指南，详细介绍核心概念、架构组件和开发环境配置。'
tags:
  - LangChain
  - LLM
  - AI
draft: false
series: LangChain
seriesOrder: 1
language: zh-CN
---

## 概述

LangChain v1.0 是一个面向生产环境的 AI Agent 构建框架，将 LLM 与外部工具结合，提供记忆能力、结构化输出和中间件控制。v1.0 基于 **LangGraph** 构建，将 Agent 表达为状态图，实现可追踪、可调试、可持久化的执行流程。

简单说，LangChain 负责把“模型调用、提示词、工具、状态、检索”这些零散能力接成一个可维护的应用骨架。刚开始接触时，不必急着记住所有类名，先理解每个模块在请求链路中负责哪一段，会更容易看懂后面的示例。

版本提示：本文按 LangChain v1 的思路组织。v1 中 `langchain` 主包更聚焦 Agent 相关能力，旧版 Chain、Memory 等接口如果继续使用，需要结合 `langchain-classic` 或迁移到新版的 Runnable、messages、checkpointer 写法。

### 核心设计理念

| 理念 | 说明 |
|------|------|
| **数据融合** | LLM 与外部数据源结合时最具变革性 |
| **Agent 化** | 未来应用将越来越 Agent 化 |
| **编排优先** | 模型应编排复杂流程，而非仅生成文本 |

### LangChain vs LangGraph 关系

```
┌─────────────────────────────────────────────────────────────┐
│                  LangChain v1.0 架构                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   ┌─────────────────────────────────────────────────────┐   │
│   │         LangChain (高层抽象)                         │   │
│   │         create_agent - 简单易用 (<10行代码)          │   │
│   └───────────────────────┬─────────────────────────────┘   │
│                           │ 构建在                             │
│                           ▼                                   │
│   ┌─────────────────────────────────────────────────────┐   │
│   │         LangGraph (底层运行时)                        │   │
│   │         状态图原语 - 精细控制                          │   │
│   └─────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 核心概念

### 六大模块

| 模块 | 功能 |
|------|------|
| **Model I/O** | 与语言模型交互，管理输入输出 |
| **Prompt Template** | 提示词模板化和管理 |
| **Agent** | 自主决策和执行任务的智能体 |
| **Tool** | 扩展 LLM 能力的外部函数 |
| **Memory** | 在对话或处理过程中保持状态 |
| **Retrieval** | 检索增强生成（RAG）相关组件 |

## 环境配置

### 安装 LangChain v1.0

```bash
pip install langchain langgraph langchain-openai
pip install langchain-community langchain-text-splitters
pip install langchain-chroma langchain-huggingface chromadb
```

### 环境变量配置

```python
import os

os.environ["OPENAI_API_KEY"] = "your-api-key"
os.environ["OPENAI_BASE_URL"] = "https://api.openai.com/v1"
```

### 快速验证

```python
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(model="gpt-4o")

response = llm.invoke("你好，请介绍一下你自己")
print(response.content)
```

## Agent 模块 (v1.0 新 API)

### create_agent 基础用法

```python
from langchain.agents import create_agent
from langchain_openai import ChatOpenAI

def get_weather(city: str) -> str:
    """获取城市天气信息"""
    return f"{city}今天天气晴朗，25摄氏度"

llm = ChatOpenAI(model="gpt-4o")

agent = create_agent(
    model=llm,
    tools=[get_weather],
    system_prompt="你是一个有帮助的 AI 助手，可以使用工具来回答问题。"
)

result = agent.invoke({"messages": [{"role": "user", "content": "北京今天的天气怎么样？"}]})
print(result["messages"][-1].content)
```

### 消息格式

```python
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage, ToolMessage

messages = [
    SystemMessage(content="你是一个专业助手。"),
    HumanMessage(content="你好"),
]

response = llm.invoke(messages)
```

## Tool 模块

### 定义工具

```python
from langchain_core.tools import tool

@tool
def search_database(query: str) -> str:
    """搜索数据库获取相关信息"""
    return f"关于'{query}'的搜索结果..."

@tool
def calculate(expression: str) -> str:
    """执行数学计算"""
    import operator

    ops = {
        "+": operator.add,
        "-": operator.sub,
        "*": operator.mul,
        "/": operator.truediv,
    }
    left, op, right = expression.split()
    if op not in ops:
        return "只支持 +、-、*、/ 四种运算"
    return str(ops[op](float(left), float(right)))

tools = [search_database, calculate]
```

工具函数的边界越清晰，Agent 越容易稳定调用。这里没有把任意字符串交给 Python 执行，因为示例代码经常会被直接复制到真实项目里，保守一些更安全。

## Memory 模块

### 对话记忆

```python
from langchain.agents import create_agent
from langgraph.checkpoint.memory import InMemorySaver

checkpointer = InMemorySaver()

agent = create_agent(
    model=llm,
    tools=tools,
    system_prompt="你是一个有帮助的助手。",
    checkpointer=checkpointer
)

config = {"configurable": {"thread_id": "demo-user"}}

result1 = agent.invoke(
    {"messages": [{"role": "user", "content": "我叫张三"}]},
    config=config
)
result2 = agent.invoke(
    {"messages": [{"role": "user", "content": "我叫什么名字？"}]},
    config=config
)
```

同一个 `thread_id` 会把两次调用放进同一段对话状态里。换成新的 `thread_id`，就相当于开始一段新的会话。

## Retrieval 模块 (RAG)

### 基础 RAG 实现

```python
from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_chroma import Chroma

loader = TextLoader("文档路径.txt")
documents = loader.load()

splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200
)
docs = splitter.split_documents(documents)

embeddings = OpenAIEmbeddings()
vectorstore = Chroma.from_documents(docs, embeddings)

retriever = vectorstore.as_retriever(search_kwargs={"k": 3})
```

## 实战示例：构建简单 Agent

```python
from langchain.agents import create_agent
from langchain_openai import ChatOpenAI
from langchain_core.tools import tool

@tool
def get_weather(city: str) -> str:
    """获取城市天气"""
    return f"{city}今天天气晴朗，25°C"

@tool
def calculator(expression: str) -> str:
    """数学计算"""
    import operator

    ops = {"+": operator.add, "-": operator.sub, "*": operator.mul, "/": operator.truediv}
    left, op, right = expression.split()
    return str(ops[op](float(left), float(right)))

llm = ChatOpenAI(model="gpt-4o", temperature=0)
tools = [get_weather, calculator]

agent = create_agent(
    model=llm,
    tools=tools,
    system_prompt="你是一个智能助手，可以通过工具来回答问题。"
)

result = agent.invoke({
    "messages": [{"role": "user", "content": "计算 2 + 3 的结果"}]
})

print(result["messages"][-1].content)
```

## 与 LangGraph 的关系

对于需要更精细控制的场景，可以直接使用 LangGraph：

```python
from langgraph.graph import StateGraph, START, END, MessagesState
from langgraph.prebuilt import ToolNode, tools_condition
from langchain_openai import ChatOpenAI
from langchain_core.tools import tool

@tool
def search(query: str) -> str:
    """搜索工具"""
    return f"搜索结果: {query}"

tools = [search]
tool_node = ToolNode(tools)

model = ChatOpenAI(model="gpt-4o").bind_tools(tools)

def should_continue(state: MessagesState):
    last_message = state["messages"][-1]
    if last_message.tool_calls:
        return "tools"
    return END

def call_model(state: MessagesState):
    messages = state["messages"]
    response = model.invoke(messages)
    return {"messages": [response]}

graph = StateGraph(MessagesState)
graph.add_node("model", call_model)
graph.add_node("tools", tool_node)
graph.add_edge(START, "model")
graph.add_conditional_edges("model", should_continue)
graph.add_edge("tools", "model")

app = graph.compile()

result = app.invoke({
    "messages": [{"role": "user", "content": "搜索 LangChain 相关资料"}]
})
```

## 总结

| 组件 | v1.0 新 API | 用途 |
|------|------------|------|
| **Agent** | `create_agent()` | 构建智能体 |
| **Tools** | `@tool` 装饰器 | 定义工具函数 |
| **Memory** | `checkpointer` + `thread_id` | 对话状态 |
| **Retrieval** | `vectorstore.as_retriever()` | RAG 检索 |

LangChain v1.0 提供了简洁的 `create_agent` API，让构建 AI Agent 变得简单。通过 `system_prompt` 配置角色行为，通过 `tools` 扩展能力，通过 `checkpointer` 和 `thread_id` 保持上下文。

对于复杂场景，可以下潜到 LangGraph 获得更精细的控制。
