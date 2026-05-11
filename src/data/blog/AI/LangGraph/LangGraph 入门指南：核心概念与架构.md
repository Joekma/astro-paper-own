---
title: LangGraph 入门指南：核心概念与架构
author: Joekma
pubDatetime: 2026-05-07T00:00:00.000+08:00
modDatetime: 2026-05-07T00:00:00.000+08:00
slug: langgraph-getting-started
description: 'LangGraph入门指南，详细介绍核心概念、架构组件和使用场景。'
tags:
  - LangGraph
  - Agent
  - LLM
draft: false
series: LangGraph
language: zh-CN
---

## 概述

LangGraph 是 LangChain 生态系统中用于构建有状态、多actor工作流的开源框架。它扩展了 LangChain 的 Chain 概念，引入了图结构，使得开发者可以创建具有循环、条件分支和持久化能力的复杂 LLM 应用。

### LangGraph vs LangChain Chain

| 特性 | LangChain Chain | LangGraph |
|------|----------------|-----------|
| **结构** | 线性链 | 有向图 |
| **循环** | 不支持 | 支持 |
| **条件分支** | 有限支持 | 完整支持 |
| **状态管理** | 外部处理 | 内置 |
| **持久化** | 有限 | 内置支持 |

### 核心概念

```
┌─────────────────────────────────────────────────────────────┐
│                      LangGraph 核心概念                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   ┌──────────┐                                              │
│   │   Node   │ ← 函数/处理单元                               │
│   └──────────┘                                              │
│        │                                                    │
│   ┌────┴────┐                                              │
│   │   Edge  │ ← 节点之间的连接                               │
│   └────┬────┘                                              │
│        │                                                    │
│   ┌────┴────┐                                              │
│   │  State   │ ← 整个图共享的状态                           │
│   └──────────┘                                              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 核心概念详解

### 1. Graph（图）

LangGraph 应用的核心结构是有向图：

```python
from langgraph.graph import StateGraph, END
from typing import TypedDict

class GraphState(TypedDict):
    messages: list
    current_step: str

graph = StateGraph(GraphState)
```

### 2. Node（节点）

节点是图中的处理单元：

```python
def node_function(state):
    return {"current_step": "processed"}

graph.add_node("node_name", node_function)
```

### 3. Edge（边）

边定义了节点之间的连接关系：

```python
graph.add_edge("node_a", "node_b")
graph.add_conditional_edges("node_a", condition_function)
```

### 4. State（状态）

状态在整个图中共享和传递：

```python
class AgentState(TypedDict):
    messages: list
    context: str
    result: str
```

## 基本使用

### 简单的状态图

```python
# 导入LangGraph核心组件
from langgraph.graph import StateGraph, START, END
from typing import TypedDict

# 定义状态类型，使用TypedDict确保类型安全
class SimpleState(TypedDict):
    value: str  # 状态值字段

# 定义第一个处理节点
def step_1(state):
    # 返回要更新的状态字段
    return {"value": state["value"] + " -> 步骤1"}

# 定义第二个处理节点
def step_2(state):
    return {"value": state["value"] + " -> 步骤2"}

# 条件判断函数，决定下一步走向
def should_continue(state) -> str:
    # 如果value长度小于20，继续到step_2，否则结束
    return "step_2" if len(state["value"]) < 20 else END

# 创建状态图，指定状态类型
graph = StateGraph(SimpleState)

# 添加节点
graph.add_node("step_1", step_1)
graph.add_node("step_2", step_2)

# 添加边：START -> step_1
graph.add_edge(START, "step_1")
# 添加条件边：step_1根据条件转到step_2或END
graph.add_conditional_edges("step_1", should_continue)

# 编译图，生成可执行的应用
app = graph.compile()

# 调用应用，传入初始状态
result = app.invoke({"value": "开始"})
print(result)
```

### 带循环的图

```python
# 导入核心组件
from langgraph.graph import StateGraph, START
from typing import TypedDict

# 定义带计数器的状态
class LoopState(TypedDict):
    counter: int        # 计数器
    messages: list     # 消息列表

# 递增计数器
def increment(state):
    return {"counter": state["counter"] + 1}

# 检查循环条件
def check_condition(state):
    # 如果计数器小于5，继续循环，否则结束
    if state["counter"] < 5:
        return "increment"
    return END

# 创建图并添加节点
graph = StateGraph(LoopState)
graph.add_node("increment", increment)

# 添加边和条件边
graph.add_edge(START, "increment")
graph.add_conditional_edges("increment", check_condition)

# 编译并调用
app = graph.compile()
result = app.invoke({"counter": 0, "messages": []})
```

## 实际应用示例

### 1. 对话 Agent

```python
from langgraph.graph import StateGraph, START, MessagesState
from langchain_openai import ChatOpenAI
from langgraph.prebuilt import ToolNode
from langgraph.prebuilt import tools_condition
from typing import Literal
from langchain_core.tools import tool

@tool
def search_database(query: str) -> str:
    """搜索数据库"""
    return f"数据库结果：关于'{query}'的信息"

@tool
def calculate(expression: str) -> str:
    """执行计算"""
    return str(eval(expression))

tools = [search_database, calculate]

graph = StateGraph(MessagesState)

def call_model(state: MessagesState):
    messages = state["messages"]
    response = ChatOpenAI(model="gpt-4").invoke(messages)
    return {"messages": [response]}

graph.add_node("model", call_model)
graph.add_node("tools", ToolNode(tools))

graph.add_edge(START, "model")
graph.add_conditional_edges(
    "model",
    tools_condition,
)
graph.add_edge("tools", "model")

app = graph.compile()

result = app.invoke({
    "messages": [{"role": "user", "content": "计算 2+3*5"}]
})
print(result["messages"][-1].content)
```

### 2. RAG 应用

```python
from langgraph.graph import StateGraph, START
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate

class RAGState(TypedDict):
    question: str
    context: str
    answer: str

def retrieve(state: RAGState):
    return {"context": "检索到的上下文信息..."}

def generate(state: RAGState):
    prompt = PromptTemplate.from_template(
        "基于以下上下文回答问题：\n{context}\n\n问题：{question}"
    )
    llm = ChatOpenAI(model="gpt-4")
    answer = (prompt | llm).invoke({
        "context": state["context"],
        "question": state["question"]
    })
    return {"answer": answer.content}

graph = StateGraph(RAGState)
graph.add_node("retrieve", retrieve)
graph.add_node("generate", generate)
graph.add_edge(START, "retrieve")
graph.add_edge("retrieve", "generate")

app = graph.compile()
result = app.invoke({"question": "LangGraph是什么？", "context": "", "answer": ""})
```

## 主要特性

### 1. 循环支持

```python
def should_loop(state):
    return len(state["messages"]) < 10

graph.add_conditional_edges("node", should_loop, {"loop": "node", "end": END})
```

### 2. 条件分支

```python
def route_based_on_input(state) -> Literal["path_a", "path_b"]:
    if "查询" in state["input"]:
        return "path_a"
    return "path_b"

graph.add_conditional_edges("router", route_based_on_input)
```

### 3. 状态持久化

```python
from langgraph.checkpoint.memory import MemorySaver

checkpointer = MemorySaver()
app = graph.compile(checkpointer=checkpointer)

config = {"configurable": {"thread_id": "user_123"}}
result = app.invoke({"state": "initial"}, config=config)
```

### 4. 人机交互

```python
def human_node(state):
    user_input = input("请输入：")
    return {"user_input": user_input}

graph.add_node("human", human_node)
```

## 安装和使用

### 安装

```bash
pip install langgraph
```

### 基本导入

```python
from langgraph.graph import StateGraph, START, END
from langgraph.prebuilt import create_react_agent
from typing import TypedDict
```

## 应用场景

| 场景 | 说明 |
|------|------|
| **多步骤 Agent** | 需要循环和工具调用的任务 |
| **对话系统** | 带记忆的多轮对话 |
| **RAG 流程** | 检索-生成工作流 |
| **自动化流程** | 需要条件判断的业务流程 |
| **监控系统** | 需要持续运行的系统 |

## 最佳实践

| 实践 | 说明 |
|------|------|
| **清晰的状态定义** | 使用 TypedDict 明确定义状态结构 |
| **模块化节点** | 每个节点负责单一职责 |
| **合理的条件分支** | 使用枚举或字面量定义分支 |
| **状态持久化** | 生产环境使用检查点持久化 |
| **错误处理** | 为节点添加异常处理 |

## 总结

LangGraph 扩展了 LangChain，提供：

| 概念 | 作用 |
|------|------|
| **Graph** | 应用的整体结构 |
| **Node** | 处理单元 |
| **Edge** | 节点连接 |
| **State** | 共享状态 |
| **Checkpointer** | 持久化支持 |

对于需要循环、条件分支和状态管理的复杂 LLM 应用，LangGraph 是理想的选择。
