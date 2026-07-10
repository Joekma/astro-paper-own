---
title: LangGraph 入门指南：核心概念与架构
author: Joekma
pubDatetime: 2026-05-11T00:00:00.000+08:00
modDatetime: 2026-07-10T00:00:00.000+08:00
slug: langgraph-getting-started
description: "LangGraph入门指南，详细介绍核心概念、架构组件和使用场景。"
tags:
  - LangGraph
  - Agent
  - LLM
draft: false
series: LangGraph
seriesOrder: 1
language: zh-CN
---

## 概述

LangGraph 是用于构建长时间运行、有状态 Agent 和工作流的低层编排框架。它把应用表示为图：状态保存共享数据，节点执行工作，边决定下一步。循环、条件路由、持久化和人机协作都是运行时的一等能力。

> 版本基线：本文在 2026-07-10 按 Python 3.10+、`langgraph==1.2.8`、`langchain==1.3.11` 和 `langchain-openai==1.3.3` 校验。只有调用 OpenAI 模型的示例才需要 `OPENAI_API_KEY` 和 `OPENAI_MODEL`。

LangChain 与 LangGraph 不是简单的“链与图”替代关系。LangChain 提供模型、工具、Agent 和中间件等高层接口，其中标准 Agent 的 `create_agent` 本身构建在 LangGraph 上；当应用需要完全控制状态、节点、分支或持久化时，再直接使用 LangGraph Graph API。LangGraph 1.x 已弃用 `langgraph.prebuilt.create_react_agent`，标准 Agent 应使用 `langchain.agents.create_agent`。

![LangGraph 通过 StateGraph、Node、Edge、Conditional Edge、共享 State 和 compile 运行时构建可循环、可分支、可持久化的状态图应用](./images/langgraph-core-stategraph-architecture-figure-01.png)

## 核心概念

### State（状态）

状态定义图中可以读写的数据。`TypedDict` 提供静态类型信息，但不会自动完成运行时数据验证。

```python
from typing import TypedDict

class GraphState(TypedDict):
    value: str
    step_count: int
```

### Node（节点）

节点接收当前状态，并返回本次需要更新的字段。未返回的字段保持不变。

```python
def append_step(state: GraphState) -> dict:
    return {
        "value": state["value"] + " -> 已处理",
        "step_count": state["step_count"] + 1,
    }
```

### Edge（边）与 Graph（图）

普通边表示固定顺序，条件边根据路由函数返回值决定下一步。构建器需要通过 `compile()` 生成可运行图。

```python
from typing import Literal, TypedDict
from langgraph.graph import END, START, StateGraph

class SimpleState(TypedDict):
    value: str
    step_count: int

def step_1(state: SimpleState) -> dict:
    return {
        "value": state["value"] + " -> 步骤1",
        "step_count": state["step_count"] + 1,
    }

def step_2(state: SimpleState) -> dict:
    return {
        "value": state["value"] + " -> 步骤2",
        "step_count": state["step_count"] + 1,
    }

def route_after_step_1(state: SimpleState) -> Literal["step_2", "__end__"]:
    return "step_2" if state["step_count"] < 2 else END

builder = StateGraph(SimpleState)
builder.add_node("step_1", step_1)
builder.add_node("step_2", step_2)
builder.add_edge(START, "step_1")
builder.add_conditional_edges("step_1", route_after_step_1)
builder.add_edge("step_2", END)

graph = builder.compile()
result = graph.invoke({"value": "开始", "step_count": 0})
print(result)
```

## 循环与条件分支

循环也是条件边。业务退出条件负责正常结束，`recursion_limit` 只作为防止错误路由无限执行的兜底。

```python
from typing import Literal, TypedDict
from langgraph.graph import END, START, StateGraph

class LoopState(TypedDict):
    counter: int

def increment(state: LoopState) -> dict:
    return {"counter": state["counter"] + 1}

def should_continue(state: LoopState) -> Literal["increment", "__end__"]:
    return "increment" if state["counter"] < 5 else END

builder = StateGraph(LoopState)
builder.add_node("increment", increment)
builder.add_edge(START, "increment")
builder.add_conditional_edges("increment", should_continue)

graph = builder.compile()
result = graph.invoke({"counter": 0}, config={"recursion_limit": 10})
assert result["counter"] == 5
```

## 自定义工具调用 Agent

标准 Agent 优先使用 `langchain.agents.create_agent`。下面直接使用 `StateGraph`，是为了展示模型节点、工具节点和回环如何组成自定义 Agent。

```python
import os
from typing import Literal

from langchain.tools import tool
from langchain_openai import ChatOpenAI
from langgraph.graph import START, MessagesState, StateGraph
from langgraph.prebuilt import ToolNode, tools_condition

@tool
def calculate(
    a: float,
    b: float,
    operation: Literal["add", "subtract", "multiply", "divide"],
) -> str:
    """执行受控的四则运算。"""
    if operation == "add":
        return str(a + b)
    if operation == "subtract":
        return str(a - b)
    if operation == "multiply":
        return str(a * b)
    return "除数不能为 0" if b == 0 else str(a / b)

tools = [calculate]
model = ChatOpenAI(model=os.environ["OPENAI_MODEL"]).bind_tools(tools)

def call_model(state: MessagesState) -> dict:
    return {"messages": [model.invoke(state["messages"])]}

builder = StateGraph(MessagesState)
builder.add_node("model", call_model)
builder.add_node("tools", ToolNode(tools))
builder.add_edge(START, "model")
builder.add_conditional_edges("model", tools_condition)
builder.add_edge("tools", "model")

graph = builder.compile()
result = graph.invoke(
    {"messages": [{"role": "user", "content": "计算 2 和 15 相加"}]}
)
print(result["messages"][-1].content)
```

`tools_condition` 检查最后一条模型消息：有工具调用时进入默认名为 `tools` 的节点，否则进入 `END`。工具结果必须回到模型节点，模型才能基于结果生成最终回复。

## RAG 工作流

这个最小示例用固定字符串代替真实检索器，重点是展示检索结果如何通过状态交给生成节点。

```python
import os
from typing import TypedDict

from langchain_openai import ChatOpenAI
from langgraph.graph import END, START, StateGraph

class RAGState(TypedDict):
    question: str
    context: str
    answer: str

model = ChatOpenAI(model=os.environ["OPENAI_MODEL"])

def retrieve(state: RAGState) -> dict:
    return {"context": "LangGraph 是用于有状态 Agent 的低层编排框架。"}

def generate(state: RAGState) -> dict:
    response = model.invoke(
        [
            {
                "role": "user",
                "content": (
                    f"只根据上下文回答。\n上下文：{state['context']}\n"
                    f"问题：{state['question']}"
                ),
            }
        ]
    )
    return {"answer": response.content}

builder = StateGraph(RAGState)
builder.add_node("retrieve", retrieve)
builder.add_node("generate", generate)
builder.add_edge(START, "retrieve")
builder.add_edge("retrieve", "generate")
builder.add_edge("generate", END)

graph = builder.compile()
result = graph.invoke(
    {"question": "LangGraph 是什么？", "context": "", "answer": ""}
)
print(result["answer"])
```

## 状态持久化

编译时提供 checkpointer 后，`thread_id` 用来定位同一条执行线程。`InMemorySaver` 仅适合开发和测试。

```python
from langgraph.checkpoint.memory import InMemorySaver
from langgraph.graph import START, MessagesState, StateGraph

def reply(state: MessagesState) -> dict:
    last_text = state["messages"][-1].content
    return {"messages": [{"role": "assistant", "content": f"收到：{last_text}"}]}

builder = StateGraph(MessagesState)
builder.add_node("reply", reply)
builder.add_edge(START, "reply")

graph = builder.compile(checkpointer=InMemorySaver())
config = {"configurable": {"thread_id": "user-123"}}

graph.invoke({"messages": [{"role": "user", "content": "第一条消息"}]}, config)
result = graph.invoke(
    {"messages": [{"role": "user", "content": "第二条消息"}]},
    config,
)
assert len(result["messages"]) == 4
```

## 人机交互

`interrupt()` 需要 checkpointer 和稳定的 `thread_id`。首次调用暂停，恢复时用同一个配置传入 `Command(resume=...)`。

```python
from typing import TypedDict

from langgraph.checkpoint.memory import InMemorySaver
from langgraph.graph import START, StateGraph
from langgraph.types import Command, interrupt

class ReviewState(TypedDict):
    draft: str
    decision: str

def human_review(state: ReviewState) -> dict:
    decision = interrupt({"draft": state["draft"], "question": "是否批准？"})
    return {"decision": decision}

builder = StateGraph(ReviewState)
builder.add_node("human_review", human_review)
builder.add_edge(START, "human_review")
graph = builder.compile(checkpointer=InMemorySaver())

config = {"configurable": {"thread_id": "review-1"}}
paused = graph.invoke({"draft": "待审核内容", "decision": ""}, config)
print(paused["__interrupt__"])

result = graph.invoke(Command(resume="approve"), config)
assert result["decision"] == "approve"
```

## 安装与配置

```bash
python -m pip install "langgraph==1.2.8" "langchain==1.3.11" "langchain-openai==1.3.3"
```

调用 OpenAI 模型前设置：

```bash
export OPENAI_API_KEY="your-api-key"
export OPENAI_MODEL="your-available-model"
```

Windows PowerShell 使用 `$env:OPENAI_API_KEY` 和 `$env:OPENAI_MODEL`。只运行基础图、循环、持久化和人机交互示例时，不需要模型依赖或 API Key。

## 总结

LangGraph 的核心可以归纳为：状态描述共享数据，节点返回局部更新，边控制执行流，checkpointer 保存执行进度。标准 Agent 可以从 LangChain `create_agent` 起步；需要自定义循环、分支、恢复或多节点协调时，再使用 LangGraph Graph API。
