---
title: LangGraph 入门指南：核心概念与架构
author: Joekma
pubDatetime: 2026-05-08T00:00:00.000+08:00
modDatetime: 2026-05-08T00:00:00.000+08:00
slug: langgraph-getting-started
description: 'LangGraph入门指南，详细介绍核心概念、架构组件和有状态的工作流设计。'
tags:
  - LangGraph
  - LLM
  - AI
  - Agent
draft: false
language: zh-CN
---

## 概述

LangGraph 是由 LangChain 团队开发的一个扩展库，专门用于创建有状态、多actor参与的大语言模型（LLM）应用。与 LangChain 的 Chain 不同，LangGraph 强调**循环计算**和**状态持久化**，非常适合构建复杂的 AI Agent、聊天机器人和多步骤工作流。

### 为什么选择 LangGraph？

| 特性 | 说明 |
|------|------|
| **有状态的工作流** | 支持在多次交互中保持和更新状态 |
| **循环计算** | 支持条件循环、迭代等复杂控制流 |
| **多节点协作** | 支持构建多个 agent/actor 协同工作 |
| **持久化支持** | 内置检查点和状态持久化机制 |
| **图结构设计** | 直观的有向图表示工作流 |

### LangGraph vs LangChain Chain

| 特性 | LangChain Chain | LangGraph |
|------|----------------|-----------|
| **执行模型** | 线性、无环 | 支持循环 |
| **状态管理** | 依赖外部 Memory | 内置状态管理 |
| **控制流** | 简单顺序执行 | 支持条件分支、循环 |
| **适用场景** | 简单任务 | 复杂 Agent 工作流 |

## 核心概念

### 图结构（Graph）

LangGraph 的核心是**有向图（Directed Graph）**，由节点（Node）和边（Edge）组成：

```
┌─────────────────────────────────────────────────────────────┐
│                      LangGraph Architecture                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│    ┌──────────┐                                            │
│    │  Start   │                                            │
│    └────┬─────┘                                            │
│         │                                                  │
│         ▼                                                  │
│    ┌──────────┐     ┌──────────┐     ┌──────────┐         │
│    │  Node A  │────▶│  Node B  │────▶│  Node C  │         │
│    └──────────┘     └────┬─────┘     └──────────┘         │
│                          │                                  │
│                    ┌─────▼─────┐                           │
│                    │  Router   │                           │
│                    └─────┬─────┘                           │
│                          │                                  │
│         ┌────────────────┼────────────────┐                │
│         ▼                ▼                ▼                │
│    ┌──────────┐     ┌──────────┐     ┌──────────┐         │
│    │  Node D  │     │  Node E  │     │   End    │         │
│    └──────────┘     └──────────┘     └──────────┘         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 节点（Node）

节点是图中的基本执行单元，可以是：
- **LLM 调用**：执行语言模型推理
- **工具调用**：执行特定功能（搜索、计算等）
- **条件判断**：根据状态决定下一步
- **数据处理**：转换、聚合数据

### 边（Edge）

边定义了节点之间的连接关系：
- **普通边**：无条件转移到下一个节点
- **条件边**：根据状态有条件地选择下一个节点

## 环境配置

### 安装 LangGraph

```bash
# 基础安装
pip install langgraph

# 包含所有依赖
pip install langgraph[all]

# 推荐安装（包含 LangChain 集成）
pip install langgraph langchain-openai langchain-community
```

### 环境变量配置

```bash
# 设置 API Key
export OPENAI_API_KEY="your-api-key"

# 如果使用其他模型服务
export ANTHROPIC_API_KEY="your-anthropic-key"
```

### 快速验证

```python
from langgraph.graph import StateGraph, END
from langgraph.graph import MessagesState
from langchain_openai import ChatOpenAI

# 创建模型
llm = ChatOpenAI(model="gpt-4")

# 创建图
graph = StateGraph(MessagesState)

# 添加节点
def call_model(state):
    messages = state["messages"]
    response = llm.invoke(messages)
    return {"messages": [response]}

graph.add_node("call_model", call_model)
graph.add_edge("__start__", "call_model")
graph.add_edge("call_model", END)

# 编译并运行
app = graph.compile()
result = app.invoke({"messages": ["你好，介绍一下自己"]})
print(result["messages"][-1].content)
```

## 状态管理

### State 的定义

LangGraph 使用 **State** 来管理应用的状态：

```python
from typing import TypedDict, Annotated
from langgraph.graph import StateGraph
import operator

# 定义状态结构
class AgentState(TypedDict):
    messages: Annotated[list, operator.add]
    user_info: str
    session_id: str
    turn_count: int

# 创建图
graph = StateGraph(AgentState)
```

### 状态更新

状态可以通过 reducer 函数自动更新：

```python
from typing import TypedDict, Annotated
import operator

class MyState(TypedDict):
    # 列表会自动累加
    history: Annotated[list, operator.add]
    # 普通字段会覆盖
    current_step: str
    # 支持默认值
    count: int

def step1(state):
    return {
        "history": ["Step 1 completed"],
        "current_step": "step1",
        "count": state.get("count", 0) + 1
    }

def step2(state):
    return {
        "history": ["Step 2 completed"],
        "current_step": "step2",
        "count": state.get("count", 0) + 1
    }

# 构建图
graph = StateGraph(MyState)
graph.add_node("step1", step1)
graph.add_node("step2", step2)
graph.add_edge("__start__", "step1")
graph.add_edge("step1", "step2")
graph.add_edge("step2", "__end__")

app = graph.compile()
result = app.invoke({})
print(result)
# {'history': ['Step 1 completed', 'Step 2 completed'], 'current_step': 'step2', 'count': 2}
```

## 节点与边的构建

### 添加节点

```python
from langgraph.graph import StateGraph, END, START

# 定义状态
class MyState(TypedDict):
    data: str

# 创建图
graph = StateGraph(MyState)

# 添加节点（函数形式）
def process_data(state):
    return {"data": state["data"] + " - processed"}

graph.add_node("process", process_data)

# 添加节点（可调用对象形式）
class MyNode:
    def __call__(self, state):
        return {"data": state["data"] + " - class based"}

graph.add_node("process_class", MyNode())

# 起始节点
graph.add_edge(START, "process")
graph.add_edge("process", "process_class")
graph.add_edge("process_class", END)
```

### 条件边

条件边允许根据状态动态选择下一个节点：

```python
from typing import Literal

class WorkflowState(TypedDict):
    user_request: str
    classification: str
    response: str

def classify_request(state):
    request = state["user_request"].lower()
    if "help" in request:
        return "help"
    elif "feedback" in request:
        return "feedback"
    else:
        return "general"

def handle_help(state):
    return {"response": "我来帮你！"}

def handle_feedback(state):
    return {"response": "感谢你的反馈！"}

def handle_general(state):
    return {"response": "好的，让我来处理你的请求。"}

# 创建图
graph = StateGraph(WorkflowState)
graph.add_node("classify", classify_request)
graph.add_node("handle_help", handle_help)
graph.add_node("handle_feedback", handle_feedback)
graph.add_node("handle_general", handle_general)

# 条件边：根据分类结果选择节点
graph.add_edge(START, "classify")
graph.add_conditional_edges(
    "classify",
    lambda x: x["classification"],
    {
        "help": "handle_help",
        "feedback": "handle_feedback",
        "general": "handle_general"
    }
)

# 所有处理节点都结束
graph.add_edge("handle_help", END)
graph.add_edge("handle_feedback", END)
graph.add_edge("handle_general", END)

app = graph.compile()
```

## 循环工作流

LangGraph 支持循环结构，这对于需要迭代的任务非常有用：

```python
class LoopState(TypedDict):
    count: int
    max_count: int
    result: str

def increment(state):
    count = state["count"] + 1
    return {
        "count": count,
        "result": f"计数: {count}"
    }

def should_continue(state) -> Literal["increment", "__end__"]:
    if state["count"] < state["max_count"]:
        return "increment"
    return "__end__"

graph = StateGraph(LoopState)
graph.add_node("increment", increment)
graph.add_edge(START, "increment")

# 条件边：决定是否继续循环
graph.add_conditional_edges(
    "increment",
    should_continue,
    {
        "increment": "increment",
        "__end__": END
    }
)

app = graph.compile()
result = app.invoke({"count": 0, "max_count": 3, "result": ""})
print(result["count"])  # 3
```

## 实战示例：简单对话机器人

```python
from langgraph.graph import StateGraph, END, START, MessagesState
from langgraph.graph import add_messages
from typing import Annotated
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(model="gpt-4")

class ChatState(TypedDict):
    messages: Annotated[list, add_messages]
    user_name: str | None

def chatbot(state):
    response = llm.invoke(state["messages"])
    return {"messages": [response]}

def should_end(state) -> Literal["chatbot", "__end__"]:
    messages = state["messages"]
    last_message = messages[-1].content.lower()
    
    # 检查是否应该说再见
    if any(word in last_message for word in ["再见", "拜拜", "结束", "bye"]):
        return "__end__"
    return "chatbot"

graph = StateGraph(ChatState)
graph.add_node("chatbot", chatbot)
graph.add_edge(START, "chatbot")
graph.add_conditional_edges(
    "chatbot",
    should_end,
    {
        "chatbot": "chatbot",
        "__end__": END
    }
)

app = graph.compile()

# 运行对话
messages = [{"role": "user", "content": "你好！"}]
result = app.invoke({"messages": messages, "user_name": None})
print(result["messages"][-1].content)
```

## 持久化与检查点

LangGraph 支持状态持久化，可以保存和恢复执行状态：

```python
from langgraph.checkpoint.memory import MemorySaver

# 创建内存检查点
checkpointer = MemorySaver()

graph = StateGraph(ChatState)
# ... 添加节点和边 ...
app = graph.compile(checkpointer=checkpointer)

# 创建新线程
config = {"configurable": {"thread_id": "user_123"}}

# 第一次对话
app.invoke(
    {"messages": [{"role": "user", "content": "我叫张三"}]},
    config
)

# 第二次对话（保持上下文）
app.invoke(
    {"messages": [{"role": "user", "content": "我叫什么名字？"}]},
    config
)
```

## 总结

本文介绍了 LangGraph 的核心概念和架构：

| 概念 | 说明 |
|------|------|
| **图结构** | 有向图表示工作流，由节点和边组成 |
| **State** | 管理应用状态，支持多种数据类型 |
| **Node** | 基本执行单元，可以是 LLM 调用、工具等 |
| **Edge** | 连接节点，支持普通边和条件边 |
| **循环** | 支持迭代和条件循环 |
| **持久化** | 支持状态检查点和恢复 |

LangGraph 的设计使其非常适合构建复杂的 AI Agent 和多步骤工作流。后续文章将深入讲解状态管理、工具集成和高级特性。🚀
