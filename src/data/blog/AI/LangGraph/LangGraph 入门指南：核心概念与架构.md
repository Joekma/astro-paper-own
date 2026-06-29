---
title: LangGraph 入门指南：核心概念与架构
author: Joekma
pubDatetime: 2026-05-11T00:00:00.000+08:00
modDatetime: 2026-05-11T00:00:00.000+08:00
slug: langgraph-getting-started
description: "LangGraph入门指南，详细介绍核心概念、架构组件和使用场景。"
tags:
  - LangGraph
  - Agent
  - LLM
draft: false
series: LangGraph
seriesOrder: 2
language: zh-CN
---

## 概述

LangGraph 是 LangChain 生态系统中用于构建有状态、多参与者应用程序的开源框架。它利用 LLM 创建代理和多代理工作流，提供了循环性、可控性和持久性等核心优势。
相比把多个调用硬串成一条链，LangGraph 更适合描述“下一步取决于当前状态”的流程。读者可以先把它理解成一个带共享数据的流程图：节点负责处理，边负责决定流向，状态负责保存上下文。

### LangGraph vs LangChain Chain

| 特性         | LangChain Chain | LangGraph |
| ------------ | --------------- | --------- |
| **结构**     | 线性链          | 有向图    |
| **循环**     | 不支持          | 支持      |
| **条件分支** | 有限支持        | 完整支持  |
| **状态管理** | 外部处理        | 内置      |
| **持久化**   | 有限            | 内置支持  |

### 核心概念

```
┌─────────────────────────────────────────────────────────────┐
│                      LangGraph 核心概念                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   ┌──────────┐                                              │
│   │   Node   │ ← 函数/处理单元                               │
│   └──────────┘                                              │
│        │                                                      │
│   ┌────┴────┐                                                │
│   │   Edge  │ ← 节点之间的连接                               │
│   └────┬────┘                                                │
│        │                                                      │
│   ┌────┴────┐                                                │
│   │  State   │ ← 整个图共享的状态                            │
│   └──────────┘                                              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 核心概念详解

### 1. Graph（图）

LangGraph 应用的核心结构是有向图：
图负责声明整个应用有哪些步骤，以及这些步骤如何连接。它本身只是构建器，真正执行前需要通过 `compile()` 生成可运行对象。

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
节点通常是一个普通函数，输入当前状态，返回要更新的字段。保持节点职责单一，会让后续调试和复用更容易。

```python
def node_function(state):
    return {"current_step": "processed"}

graph.add_node("node_name", node_function)
```

### 3. Edge（边）

边定义了节点之间的连接关系：
普通边表示固定顺序，条件边表示运行时根据状态选择下一步。条件函数的返回值要么直接等于目标节点名，要么通过映射表转换成目标节点名。

```python
graph.add_edge("node_a", "node_b")
graph.add_conditional_edges("node_a", condition_function)
```

### 4. State（状态）

状态在整个图中共享和传递：
状态是节点之间传递信息的唯一上下文。用 `TypedDict` 明确字段，可以让读者一眼看出每个节点依赖和修改哪些数据。

```python
class AgentState(TypedDict):
    messages: list
    context: str
    result: str
```

## 基本使用

### 简单的状态图

下面的例子演示两个节点顺序执行：`START` 进入 `step_1`，然后根据 `should_continue` 的结果决定进入 `step_2` 或结束。

```python
from langgraph.graph import StateGraph, START, END
from typing import TypedDict

class SimpleState(TypedDict):
    value: str

def step_1(state):
    return {"value": state["value"] + " -> 步骤1"}

def step_2(state):
    return {"value": state["value"] + " -> 步骤2"}

def should_continue(state) -> str:
    return "step_2" if len(state["value"]) < 20 else END

graph = StateGraph(SimpleState)
graph.add_node("step_1", step_1)
graph.add_node("step_2", step_2)

graph.add_edge(START, "step_1")
graph.add_conditional_edges("step_1", should_continue)

app = graph.compile()

result = app.invoke({"value": "开始"})
print(result)
```

运行后，`value` 会被节点逐步追加文本。这里的重点不是字符串拼接，而是“节点只返回状态增量”，LangGraph 会把增量合并回整体状态。

### 带循环的图

循环本质上也是条件边：只要路由函数继续返回同一个节点名，图就会再次执行该节点。

```python
from langgraph.graph import StateGraph, START, END
from typing import TypedDict

class LoopState(TypedDict):
    counter: int
    messages: list

def increment(state):
    return {"counter": state["counter"] + 1}

def check_condition(state):
    if state["counter"] < 5:
        return "increment"
    return END

graph = StateGraph(LoopState)
graph.add_node("increment", increment)

graph.add_edge(START, "increment")
graph.add_conditional_edges("increment", check_condition)

app = graph.compile()
result = app.invoke({"counter": 0, "messages": []})
```

这个例子会把 `counter` 从 0 增加到 5。实际项目中要始终给循环设置明确退出条件，避免无限递归。

## 实际应用示例

### 1. 对话 Agent

```python
from langgraph.graph import StateGraph, START, END, MessagesState
from langgraph.prebuilt import ToolNode, tools_condition
from langchain_openai import ChatOpenAI
from langchain_core.tools import tool
from typing import Literal

@tool
def search_database(query: str) -> str:
    """搜索数据库"""
    return f"数据库结果：关于'{query}'的信息"

@tool
def calculate(a: float, b: float, operation: Literal["add", "subtract", "multiply", "divide"]) -> str:
    """执行受控的四则运算"""
    if operation == "add":
        return str(a + b)
    if operation == "subtract":
        return str(a - b)
    if operation == "multiply":
        return str(a * b)
    if operation == "divide":
        return "除数不能为 0" if b == 0 else str(a / b)
    return "未知操作"

tools = [search_database, calculate]

graph = StateGraph(MessagesState)

def call_model(state: MessagesState):
    messages = state["messages"]
    model = ChatOpenAI(model="gpt-4o").bind_tools(tools)
    response = model.invoke(messages)
    return {"messages": [response]}

tool_node = ToolNode(tools)

graph.add_node("model", call_model)
graph.add_node("tools", tool_node)

graph.add_edge(START, "model")
graph.add_conditional_edges(
    "model",
    tools_condition,
)
graph.add_edge("tools", "model")

app = graph.compile()

result = app.invoke({
    "messages": [{"role": "user", "content": "计算 2 和 15 相加"}]
})
print(result["messages"][-1].content)
```

`tools_condition` 会检查模型回复里是否包含工具调用：有工具调用就进入 `tools` 节点，没有就结束。计算工具刻意使用白名单参数，而不是执行任意表达式，避免把示例代码带入安全风险。

### 2. RAG 应用

```python
from langgraph.graph import StateGraph, START, END
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate
from typing import TypedDict

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
    llm = ChatOpenAI(model="gpt-4o")
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
graph.add_edge("generate", END)

app = graph.compile()
result = app.invoke({"question": "LangGraph是什么？", "context": "", "answer": ""})
```

RAG 示例把检索和生成拆成两个节点，便于替换检索器或单独测试生成逻辑。状态里的 `context` 是两个节点之间的交接字段。

## 主要特性

### 1. 循环支持

```python
from typing import Literal

def should_loop(state) -> Literal["loop", "end"]:
    return "loop" if len(state["messages"]) < 10 else "end"

graph.add_conditional_edges("node", should_loop, {"loop": "node", "end": END})
```

### 2. 条件分支

```python
from typing import Literal

def route_based_on_input(state) -> Literal["path_a", "path_b"]:
    if "查询" in state["input"]:
        return "path_a"
    return "path_b"

graph.add_conditional_edges("router", route_based_on_input)
```

如果路由函数返回值和节点名不一致，应传入映射表；如果返回值已经是节点名，可以省略映射。

### 3. 状态持久化

```python
from langgraph.checkpoint.memory import InMemorySaver

checkpointer = InMemorySaver()
app = graph.compile(checkpointer=checkpointer)

config = {"configurable": {"thread_id": "user_123"}}
result = app.invoke({"state": "initial"}, config=config)
```

`thread_id` 是读取同一段会话状态的关键。开发阶段可以使用内存型 checkpointer，生产环境应换成数据库等持久化实现。

### 4. 人机交互

```python
from langgraph.types import interrupt, Command

def human_node(state):
    user_input = interrupt({"question": "请补充信息", "current": state})
    return {"user_input": user_input}

graph.add_node("human", human_node)

# 恢复执行时传入人工输入
app.invoke(Command(resume="人工补充的内容"), config=config)
```

## 安装和使用

### 安装

```bash
pip install langgraph
```

### 基本导入

```python
from langgraph.graph import StateGraph, START, END, MessagesState
from langgraph.prebuilt import ToolNode, tools_condition, create_react_agent
from typing import TypedDict
```

## 应用场景

| 场景             | 说明                     |
| ---------------- | ------------------------ |
| **多步骤 Agent** | 需要循环和工具调用的任务 |
| **对话系统**     | 带记忆的多轮对话         |
| **RAG 流程**     | 检索-生成工作流          |
| **自动化流程**   | 需要条件判断的业务流程   |
| **监控系统**     | 需要持续运行的系统       |

## 最佳实践

| 实践               | 说明                            |
| ------------------ | ------------------------------- |
| **清晰的状态定义** | 使用 TypedDict 明确定义状态结构 |
| **模块化节点**     | 每个节点负责单一职责            |
| **合理的条件分支** | 使用枚举或字面量定义分支        |
| **状态持久化**     | 生产环境使用检查点持久化        |
| **错误处理**       | 为节点添加异常处理              |

## 总结

LangGraph 扩展了 LangChain，提供：

| 概念             | 作用           |
| ---------------- | -------------- |
| **Graph**        | 应用的整体结构 |
| **Node**         | 处理单元       |
| **Edge**         | 节点连接       |
| **State**        | 共享状态       |
| **Checkpointer** | 持久化支持     |

对于需要循环、条件分支和状态管理的复杂 LLM 应用，LangGraph 是理想的选择。
