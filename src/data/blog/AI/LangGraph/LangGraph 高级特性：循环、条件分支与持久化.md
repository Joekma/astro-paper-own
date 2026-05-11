---
title: LangGraph 高级特性：循环、条件分支与持久化
author: Joekma
pubDatetime: 2026-05-11T00:00:00.000+08:00
modDatetime: 2026-05-11T00:00:00.000+08:00
slug: langgraph-advanced-features
description: '深入讲解LangGraph高级特性，包括循环控制、条件分支、状态持久化和人机交互。'
tags:
  - LangGraph
  - 高级特性
  - 循环
draft: false
series: LangGraph
language: zh-CN
---

## 概述

LangGraph 的高级特性使其成为构建复杂 LLM 应用的理想选择。本篇将详细介绍循环控制、条件分支、状态持久化和人机交互等高级功能。

### 高级特性概览

```
┌─────────────────────────────────────────────────────────────┐
│                  LangGraph 高级特性                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │    循环     │  │  条件分支   │  │   持久化    │        │
│  │  Control   │  │  Branching │  │ Persist    │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   错误处理  │  │   子图调用  │  │  人机交互   │        │
│  │ Error Hand │  │ Subgraph   │  │ Human in L │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 循环控制

### 带条件的循环

```python
from langgraph.graph import StateGraph, START, END
from typing import TypedDict, Literal

class LoopState(TypedDict):
    counter: int
    messages: list[str]

def increment(state: LoopState):
    return {"counter": state["counter"] + 1}

def should_continue(state: LoopState) -> Literal["increment", "__end__"]:
    if state["counter"] < 5:
        return "increment"
    return "__end__"

graph = StateGraph(LoopState)
graph.add_node("increment", increment)
graph.add_edge(START, "increment")
graph.add_conditional_edges("increment", should_continue, {
    "increment": "increment",
    "__end__": END
})
app = graph.compile()
```

### 最大迭代限制

```python
from langgraph.graph import StateGraph, START, END
from typing import TypedDict
from langchain_core.runnables import RunnableConfig

class IterState(TypedDict):
    iterations: int
    result: str

def process(state: IterState):
    return {"iterations": state["iterations"] + 1}

graph = StateGraph(IterState)
graph.add_node("process", process)
graph.add_edge(START, "process")
graph.add_edge("process", END)

app = graph.compile()

config = RunnableConfig(recursion_limit=10)
result = app.invoke({"iterations": 0, "result": ""}, config=config)
```

### Early Stopping

```python
def should_stop_early(state: IterState) -> Literal["stop", "continue"]:
    if state.get("result") == "found":
        return "stop"
    if state["iterations"] >= 3:
        return "stop"
    return "continue"
```

## 条件分支

### 基础条件分支

```python
from typing import Literal

class BranchState(TypedDict):
    input_value: int
    path: str

def route_based_on_value(state: BranchState) -> Literal["high", "medium", "low"]:
    value = state["input_value"]
    if value > 100:
        return "high"
    elif value > 50:
        return "medium"
    return "low"

def process_high(state: BranchState):
    return {"path": "处理高值"}

def process_medium(state: BranchState):
    return {"path": "处理中值"}

def process_low(state: BranchState):
    return {"path": "处理低值"}

graph = StateGraph(BranchState)
graph.add_node("high", process_high)
graph.add_node("medium", process_medium)
graph.add_node("low", process_low)
graph.add_edge(START, "route")
graph.add_conditional_edges("route", route_based_on_value)
```

### 多条件路由

```python
from typing import Literal, Union

def complex_router(state: BranchState) -> Literal["path_a", "path_b", "path_c", "__end__"]:
    value = state.get("value", 0)
    status = state.get("status", "pending")

    if status == "completed":
        return "__end__"
    if value > 100 and status == "active":
        return "path_a"
    if value > 50:
        return "path_b"
    return "path_c"
```

### 动态分支映射

```python
graph.add_conditional_edges(
    "router",
    route_based_on_value,
    {
        "high": "high_processor",
        "medium": "medium_processor",
        "low": "low_processor"
    }
)
```

## 状态持久化

### MemorySaver

```python
from langgraph.checkpoint.memory import MemorySaver

checkpointer = MemorySaver()
app = graph.compile(checkpointer=checkpointer)

config = {"configurable": {"thread_id": "unique_session_id"}}

result1 = app.invoke({"messages": ["first message"]}, config=config)
result2 = app.invoke({"messages": ["second message"]}, config=config)

saved_state = app.get_state(config)
print(saved_state.values)
```

### 状态恢复

```python
checkpoint_config = {"configurable": {"thread_id": "session_1", "checkpoint_ns": "checkpoint_id"}}
app.recover_state_from_checkpoint(checkpoint_config)
```

### PostgreSQL 持久化

```python
from langgraph.checkpoint.postgres import PostgresSaver
from langchain_postgres import Pool

pool = Pool.connect("postgresql://user:pass@host:5432/db")
checkpointer = PostgresSaver(pool)
checkpointer.setup()

app = graph.compile(checkpointer=checkpointer)
```

### Sqlite 持久化

```python
from langgraph.checkpoint.sqlite import SqliteSaver

checkpointer = SqliteSaver.from_conn_string("checkpoints.db")
app = graph.compile(checkpointer=checkpointer)
```

## 人机交互

### Human-in-the-Loop

```python
from langgraph.types import interrupt

def human_review_node(state):
    current_value = state.get("value", "")

    review_decision = interrupt({
        "current_value": current_value,
        "options": ["approve", "reject", "modify"]
    })

    return {"decision": review_decision}
```

### 手动状态更新

```python
config = {"configurable": {"thread_id": "user_123", "checkpoint_ns": interrupt_id}}
app.update_state(config, {"user_feedback": "批准"})
```

## 错误处理

### TryExcept 节点

```python
from langgraph.prebuilt import ToolNode
from langchain_core.tools import tool

@tool
def unreliable_tool():
    import random
    if random.random() > 0.5:
        return "成功"
    raise Exception("工具执行失败")

graph = StateGraph(...)
tool_node = ToolNode(unreliable_tool)
```

### 自定义错误处理

```python
def safe_node(state):
    try:
        return risky_operation(state)
    except Exception as e:
        return {"error": str(e), "recovered": True}
```

## 子图调用

### 嵌套图

```python
from langgraph.graph import StateGraph, END

def create_subgraph():
    class SubGraphState(TypedDict):
        sub_value: str

    sub_graph = StateGraph(SubGraphState)
    sub_graph.add_node("sub_node", lambda s: {"sub_value": "processed"})
    sub_graph.add_edge(START, "sub_node")
    sub_graph.add_edge("sub_node", END)
    return sub_graph.compile()

subgraph = create_subgraph()

class MainState(TypedDict):
    main_value: str
    sub_result: str

main_graph = StateGraph(MainState)
main_graph.add_node("subgraph", subgraph)
main_graph.add_edge(START, "subgraph")
main_graph.add_edge("subgraph", END)
```

## 并行执行

### Send API

```python
from langgraph.constants import Send

class ParallelState(TypedDict):
    items: list
    results: list

def spawn_tasks(state: ParallelState):
    return [Send("processor", {"item": item}) for item in state["items"]]

def process_item(state: dict):
    return {"results": [f"processed: {state['item']}"]}

graph = StateGraph(ParallelState)
graph.add_node("processor", process_item)
graph.add_conditional_edges(START, spawn_tasks)
graph.add_edge("processor", END)
```

## 时间旅行

### 状态回溯

```python
def time_travel():
    config = {"configurable": {"thread_id": "user_session"}}

    history = list(app.get_state_history(config))
    print(f"共 {len(history)} 个检查点")

    if len(history) > 2:
        old_config = history[-3].config
        app.recover_state_from_checkpoint(old_config)
```

### 状态比较

```python
current = app.get_state(config)
previous = app.get_state(old_config)

print(f"当前状态: {current.values}")
print(f"之前状态: {previous.values}")
```

## 最佳实践

### 1. 避免无限循环

```python
def safe_loop_condition(state: IterState) -> Literal["continue", "stop"]:
    if state["iterations"] >= 100:
        return "stop"
    return "continue"
```

### 2. 合理的状态大小

```python
class OptimizedState(TypedDict):
    messages: Annotated[list, operator.add]
    summary: str
    result: str
```

### 3. 检查点策略

```python
from langgraph.checkpoint.memory import MemorySaver

checkpointer = MemorySaver()
app = graph.compile(
    checkpointer=checkpointer,
    debug=True
)
```

## 总结

| 高级特性 | 用途 |
|---------|------|
| **条件循环** | 动态控制执行流程 |
| **条件分支** | 根据状态路由 |
| **状态持久化** | 会话恢复 |
| **人机交互** | 人工干预 |
| **子图** | 模块化复杂逻辑 |
| **并行执行** | 高效处理批量任务 |

这些高级特性使 LangGraph 能够构建真正生产级别的 LLM 应用。