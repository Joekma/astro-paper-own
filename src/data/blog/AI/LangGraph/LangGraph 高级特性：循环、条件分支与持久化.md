---
title: LangGraph 高级特性：循环、条件分支与持久化
author: Joekma
pubDatetime: 2026-05-11T00:00:00.000+08:00
modDatetime: 2026-05-11T00:00:00.000+08:00
slug: langgraph-advanced-features
description: "深入讲解LangGraph高级特性，包括循环控制、条件分支、状态持久化和人机交互。"
tags:
  - LangGraph
  - 高级特性
  - 循环
draft: false
series: LangGraph
seriesOrder: 1
language: zh-CN
---

## 概述

LangGraph 的高级特性使其成为构建复杂 LLM 应用的理想选择。本篇将详细介绍循环控制、条件分支、状态持久化和人机交互等高级功能。
这些能力通常不是孤立使用的：循环让 Agent 能多步尝试，条件分支让流程按状态选择路径，持久化让流程可以暂停、恢复和回溯。阅读下面的示例时，可以重点观察“状态字段如何驱动下一步”。

> 版本基线：本文示例按 `langgraph>=1.2.7` 的 1.x API 校验。基础图能力只需安装 `langgraph`；涉及模型调用时还需要 `langchain-openai` 并配置 `OPENAI_API_KEY`；PostgreSQL / SQLite 检查点需要额外安装对应的持久化包。

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

循环依赖条件边完成。节点每执行一次只更新状态，是否继续由路由函数决定。

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

这里 `counter` 小于 5 时会回到 `increment`，否则进入 `END`。实际项目中建议同时保留业务退出条件和 `recursion_limit` 这类兜底限制。

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

def route_by_iterations(state: IterState):
    return "process" if state["iterations"] < 5 else "end"

graph = StateGraph(IterState)
graph.add_node("process", process)
graph.add_edge(START, "process")
graph.add_conditional_edges("process", route_by_iterations, {"process": "process", "end": END})

app = graph.compile()

config = RunnableConfig(recursion_limit=10)
result = app.invoke({"iterations": 0, "result": ""}, config=config)
```

`recursion_limit` 是防护网，不应该替代业务退出条件。上例正常会在 5 次内结束；如果路由函数写错导致无法退出，递归限制会阻止无限执行。

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
from langgraph.graph import StateGraph, START, END
from typing import TypedDict, Literal

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
graph.add_node("router", lambda state: state)
graph.add_node("high", process_high)
graph.add_node("medium", process_medium)
graph.add_node("low", process_low)
graph.add_edge(START, "router")
graph.add_conditional_edges(
    "router",
    route_based_on_value,
    {"high": "high", "medium": "medium", "low": "low"},
)
graph.add_edge("high", END)
graph.add_edge("medium", END)
graph.add_edge("low", END)
```

条件边必须挂在一个真实存在的节点上。这里使用轻量的 `router` 节点保留状态，再由路由函数选择后续处理节点。

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

多条件路由适合把复杂判断集中在一个函数中，但返回值仍然要保持稳定。建议使用 `Literal` 标注所有可能分支，减少拼写错误。

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

### InMemorySaver

```python
from langgraph.checkpoint.memory import InMemorySaver

checkpointer = InMemorySaver()
app = graph.compile(checkpointer=checkpointer)

config = {"configurable": {"thread_id": "unique_session_id"}}

result1 = app.invoke({"messages": [{"role": "user", "content": "first message"}]}, config=config)
result2 = app.invoke({"messages": [{"role": "user", "content": "second message"}]}, config=config)

saved_state = app.get_state(config)
print(saved_state.values)
```

内存型 checkpointer 适合演示暂停、恢复和时间旅行。生产环境需要换成 PostgreSQL、SQLite 等能跨进程保存状态的实现。持久化 checkpointer 拆在独立包里，使用前先安装对应依赖：

```bash
pip install -U langgraph-checkpoint-postgres psycopg-pool
pip install -U langgraph-checkpoint-sqlite
```

### 状态恢复

```python
history = list(app.get_state_history(config))
checkpoint_config = history[-2].config

snapshot = app.get_state(checkpoint_config)
print(snapshot.values)

# 从历史检查点继续执行会形成新的执行分支
forked = app.invoke(
    {"messages": [{"role": "user", "content": "从检查点继续"}]},
    config=checkpoint_config,
)
```

### PostgreSQL 持久化

```python
from langgraph.checkpoint.postgres import PostgresSaver
from psycopg_pool import ConnectionPool

DB_URI = "postgresql://user:pass@host:5432/db"
connection_kwargs = {"autocommit": True, "prepare_threshold": 0}

with ConnectionPool(conninfo=DB_URI, kwargs=connection_kwargs) as pool:
    checkpointer = PostgresSaver(pool)
    checkpointer.setup()

    app = graph.compile(checkpointer=checkpointer)
```

`setup()` 用来创建或迁移检查点表，通常在应用启动或部署迁移阶段执行。示例使用连接池上下文管理器，离开 `with` 块后连接会被关闭，生产服务中应把编译后的图和连接池生命周期绑定到应用生命周期。

### SQLite 持久化

```python
from langgraph.checkpoint.sqlite import SqliteSaver

with SqliteSaver.from_conn_string("checkpoints.sqlite") as checkpointer:
    app = graph.compile(checkpointer=checkpointer)
```

SQLite 适合本地开发、小型单进程服务或测试环境。多进程、高并发或需要集中化运维时，优先选择 PostgreSQL。

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

`interrupt()` 会暂停图并把数据交给外部系统。外部拿到人工审核结果后，再用同一个 `thread_id` 恢复执行。

### 手动状态更新

```python
from langgraph.types import Command

config = {"configurable": {"thread_id": "user_123"}}
app.invoke(Command(resume="approve"), config=config)

# 如需人工修正状态，可以显式更新某个节点后的状态
app.update_state(config, {"user_feedback": "批准"}, as_node="human_review")
```

## 错误处理

### TryExcept 节点

```python
from langgraph.graph import StateGraph
from langgraph.prebuilt import ToolNode
from langchain_core.tools import tool
from typing import TypedDict

@tool
def unreliable_tool(query: str) -> str:
    import random
    if random.random() > 0.5:
        return f"成功处理：{query}"
    raise Exception("工具执行失败")

class ToolState(TypedDict):
    messages: list

graph = StateGraph(ToolState)
tool_node = ToolNode([unreliable_tool])
```

`ToolNode` 接收工具列表。工具异常通常会转成工具消息返回给模型，必要时可以在工具内部返回更业务化的错误信息。

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
from langgraph.graph import StateGraph, START, END
from typing import TypedDict

def create_subgraph():
    class SubGraphState(TypedDict):
        sub_result: str

    sub_graph = StateGraph(SubGraphState)
    sub_graph.add_node("sub_node", lambda s: {"sub_result": "processed"})
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

子图和父图直接相连时，二者需要共享要读写的状态字段。上例让子图写入父图中同名的 `sub_result` 字段；如果子图内部状态和父图字段不同，应使用一个包装节点显式转换输入输出。

## 并行执行

### Send API

```python
from langgraph.types import Send
from typing import TypedDict, Annotated
import operator

class ParallelState(TypedDict):
    items: list
    results: Annotated[list, operator.add]

def spawn_tasks(state: ParallelState):
    return [Send("processor", {"item": item}) for item in state["items"]]

def process_item(state: dict):
    return {"results": [f"processed: {state['item']}"]}

graph = StateGraph(ParallelState)
graph.add_node("processor", process_item)
graph.add_conditional_edges(START, spawn_tasks)
graph.add_edge("processor", END)
```

`Send` 会为每个 item 派发一次 `processor`。因为多个分支都会写入 `results`，这里用 `Annotated[list, operator.add]` 指定追加合并。

## 时间旅行

### 状态回溯

```python
def time_travel():
    config = {"configurable": {"thread_id": "user_session"}}

    history = list(app.get_state_history(config))
    print(f"共 {len(history)} 个检查点")

    if len(history) > 2:
        old_config = history[-3].config
        replayed = app.invoke(None, config=old_config)
        return replayed
```

时间旅行并不是把全局状态“倒回去”，而是使用历史检查点的 `config` 重新读取或继续执行。继续执行会产生新的分支，原历史仍可查看。

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
from langgraph.checkpoint.memory import InMemorySaver

checkpointer = InMemorySaver()
app = graph.compile(
    checkpointer=checkpointer,
    debug=True
)
```

## 总结

| 高级特性       | 用途             |
| -------------- | ---------------- |
| **条件循环**   | 动态控制执行流程 |
| **条件分支**   | 根据状态路由     |
| **状态持久化** | 会话恢复         |
| **人机交互**   | 人工干预         |
| **子图**       | 模块化复杂逻辑   |
| **并行执行**   | 高效处理批量任务 |

这些高级特性使 LangGraph 能够构建真正生产级别的 LLM 应用。
