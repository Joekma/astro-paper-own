---
title: LangGraph 状态管理与工作流
author: Joekma
pubDatetime: 2026-05-11T00:00:00.000+08:00
modDatetime: 2026-05-11T00:00:00.000+08:00
slug: langgraph-state-management
description: "深入讲解LangGraph状态管理机制，包括状态定义、更新策略、状态持久化和跨会话管理。"
tags:
  - LangGraph
  - State
  - Workflow
draft: false
series: LangGraph
seriesOrder: 2
language: zh-CN
---

## 概述

状态管理是 LangGraph 的核心特性之一。它通过强类型的状态定义，确保数据在整个图中的流动是可预测和可控的。
在 LangGraph 中，节点之间不直接互相传参，而是共同读写同一份状态。理解状态如何定义、如何更新、如何被检查点保存，是理解复杂工作流的关键。

> 版本基线：本文示例按 `langgraph>=1.2.8` 的 1.x API 校验。内存检查点随 `langgraph` 安装；PostgreSQL / SQLite 持久化检查点需要额外安装对应包。

### 状态管理架构

![LangGraph 状态管理通过 TypedDict 或 MessagesState 定义状态，节点返回局部更新，再由覆盖或 reducer 合并策略写入 checkpointer 并按 thread_id 隔离会话](./images/langgraph-state-management-workflow-figure-01.png)

## 状态定义

### TypedDict 基础

`TypedDict` 用来描述状态中有哪些字段。它不会在运行时自动校验所有数据，但能让编辑器、类型检查器和读者清楚知道状态结构。

```python
from typing import TypedDict, List

class AgentState(TypedDict):
    messages: List[str]
    context: str
    iterations: int
```

### 带注解的状态

默认情况下，节点返回的新值会覆盖旧值；使用 `Annotated` 可以为字段指定合并策略。列表字段常见的做法是追加而不是覆盖。

```python
from typing import TypedDict, Annotated
import operator

class EnhancedState(TypedDict):
    messages: Annotated[list, operator.add]
    counter: int
    results: dict
```

## 状态更新策略

### 基础更新

节点不需要返回完整状态，只返回本次要修改的字段即可。未返回的字段会保留原值。

```python
from langgraph.graph import StateGraph, START
from typing import TypedDict

class SimpleState(TypedDict):
    value: str
    count: int

def increment(state: SimpleState):
    return {"count": state["count"] + 1}

def update_value(state: SimpleState):
    return {"value": state["value"] + "_updated"}

graph = StateGraph(SimpleState)
graph.add_node("increment", increment)
graph.add_node("update", update_value)
graph.add_edge(START, "increment")
graph.add_edge("increment", "update")
```

### 合并更新

```python
def multi_update(state: SimpleState):
    return {
        "value": "new_value",
        "count": state["count"] + 10
    }
```

### Annotated 状态

```python
from typing import TypedDict, Annotated
from langgraph.graph.message import add_messages

class MessageState(TypedDict):
    messages: Annotated[list, add_messages]

def add_message(state: MessageState):
    return {"messages": [{"role": "assistant", "content": "新消息"}]}

def another_message(state: MessageState):
    return {"messages": [{"role": "user", "content": "用户消息"}]}
```

## 内置状态类型

### MessagesState

```python
from langgraph.graph.message import MessagesState

def process_messages(state: MessagesState):
    return {"messages": [{"role": "assistant", "content": "处理后的消息"}]}
```

`MessagesState` 已经内置消息合并规则，节点只需要返回新增消息。这样可以避免手动拼接时重复追加历史消息。

### 自定义 MessagesState

```python
from typing import TypedDict, Annotated
from langgraph.graph.message import add_messages

class CustomMessagesState(TypedDict):
    messages: Annotated[list, add_messages]
    metadata: dict
```

## 状态持久化

### InMemorySaver

```python
from langgraph.checkpoint.memory import InMemorySaver
from langgraph.graph import StateGraph, START
from langgraph.graph.message import MessagesState

memory = InMemorySaver()

graph = StateGraph(MessagesState)
graph.add_node("process", lambda s: {"messages": [{"role": "assistant", "content": "状态已保存"}]})
graph.add_edge(START, "process")

app = graph.compile(checkpointer=memory)

config = {"configurable": {"thread_id": "user_123"}}

result = app.invoke(
    {"messages": [{"role": "user", "content": "你好"}]},
    config=config
)

history = list(app.get_state_history(config))
```

`thread_id` 决定状态写入和读取到哪条会话。内存型 checkpointer 适合本地演示；生产环境应选择数据库等持久化 checkpointer。持久化实现拆在独立包中，使用前按需要安装：

```bash
pip install -U langgraph-checkpoint-postgres psycopg-pool
pip install -U langgraph-checkpoint-sqlite
```

### PostgreSQL Checkpointer

官方推荐使用 `langgraph-checkpoint-postgres` 包，它通过 psycopg 3 连接 PostgreSQL。根据使用场景，官方文档给出了三种连接方式：连接池、单连接、连接字符串。生产环境建议使用 `ConnectionPool`，并显式设置 `autocommit=True`（`setup()` 创建表所必需）以及 `row_factory=dict_row`（否则读取会报 `TypeError`）。

```python
from langgraph.checkpoint.postgres import PostgresSaver
from psycopg_pool import ConnectionPool

DB_URI = "postgresql://user:pass@localhost:5442/postgres?sslmode=disable"
connection_kwargs = {
    "autocommit": True,
    "prepare_threshold": 0,
}

with ConnectionPool(
    conninfo=DB_URI,
    max_size=20,
    kwargs=connection_kwargs,
) as pool:
    checkpointer = PostgresSaver(pool)

    # 首次使用前需要调用 setup() 创建检查点表
    checkpointer.setup()

    app = graph.compile(checkpointer=checkpointer)
```

如果不想自己管理连接池，也可以直接传入一条连接：

```python
from psycopg import Connection

with Connection.connect(DB_URI, **connection_kwargs) as conn:
    checkpointer = PostgresSaver(conn)
    # checkpointer.setup()  # 首次使用需要执行
    app = graph.compile(checkpointer=checkpointer)
```

最简单的方式是直接传连接字符串，`from_conn_string` 内部会处理连接生命周期：

```python
with PostgresSaver.from_conn_string(DB_URI) as checkpointer:
    app = graph.compile(checkpointer=checkpointer)
```

异步版本位于 `langgraph.checkpoint.postgres.aio`，对应使用 `AsyncPostgresSaver` 与 `AsyncConnectionPool`，方法名前缀为 `a`（如 `aput`、`aget`、`alist`）。

`setup()` 会创建或更新检查点表，通常只在初始化或迁移阶段运行。长生命周期服务中，连接池应和应用一起启动、一起关闭，不要在每次请求里重复创建。

## 状态回溯

### 获取历史状态

```python
config = {"configurable": {"thread_id": "session_1"}}

current_state = app.get_state(config)
print(current_state)

all_states = app.get_state_history(config)
for state in all_states:
    print(f"Step: {state.next}, Values: {state.values}")
```

### 状态恢复

```python
history = list(app.get_state_history(config))
checkpoint_config = history[-2].config

snapshot = app.get_state(checkpoint_config)
print(snapshot.values)

# 也可以从这个历史检查点继续执行，形成一条新的分支
forked = app.invoke(
    {"messages": [{"role": "user", "content": "从这里继续"}]},
    config=checkpoint_config,
)
```

## 状态验证

### TypedDict 验证

```python
class ValidatedState(TypedDict):
    name: str
    age: int
    email: str

def validate_node(state: ValidatedState):
    if state["age"] < 0:
        raise ValueError("年龄不能为负数")
    return state
```

### 自定义验证

```python
from pydantic import BaseModel, Field, field_validator

class StateModel(BaseModel):
    name: str
    age: int = Field(gt=0)
    email: str

    @field_validator("email")
    @classmethod
    def validate_email(cls, v):
        if "@" not in v:
            raise ValueError("无效的邮箱格式")
        return v
```

## 实际应用

### 1. 对话状态机

```python
from typing import TypedDict, Annotated, Literal
import operator

class ConversationState(TypedDict):
    messages: Annotated[list, operator.add]
    current_intent: str
    context: dict
    turn_count: int

def detect_intent(state: ConversationState):
    messages = state["messages"]
    last_message = messages[-1]["content"] if messages else ""

    intent = "general"
    if any(w in last_message for w in ["订购", "购买"]):
        intent = "order"
    elif any(w in last_message for w in ["查询", "状态"]):
        intent = "query"

    return {"current_intent": intent}

def process_order(state: ConversationState):
    return {"messages": [{"role": "assistant", "content": "订单已处理"}]}

def process_query(state: ConversationState):
    return {"messages": [{"role": "assistant", "content": "查询完成"}]}

def route_by_intent(state: ConversationState) -> Literal["process_order", "process_query"]:
    intent = state["current_intent"]
    return "process_order" if intent == "order" else "process_query"
```

路由函数返回的值必须能对应到下一步节点。这里把业务意图 `order/query/general` 转换成实际节点名，避免把状态值误当成节点名。

### 2. 多步骤工作流

```python
class WorkflowState(TypedDict):
    step: str
    data: dict
    history: Annotated[list, operator.add]

def step_1(state: WorkflowState):
    return {
        "step": "step_2",
        "data": {**state["data"], "step1_done": True},
        "history": ["Step 1 完成"]
    }

def step_2(state: WorkflowState):
    return {
        "step": "step_3",
        "data": {**state["data"], "step2_done": True},
        "history": ["Step 2 完成"]
    }

def step_3(state: WorkflowState):
    return {
        "step": "complete",
        "data": {**state["data"], "step3_done": True},
        "history": ["Step 3 完成"]
    }
```

### 3. 带分支的状态机

```python
from typing import Literal

class BranchState(TypedDict):
    value: int
    condition: str
    result: str

def evaluate_condition(state: BranchState):
    return {"condition": "path_a" if state.get("value", 0) > 5 else "path_b"}

def path_a_node(state: BranchState):
    return {"result": "A路径结果"}

def path_b_node(state: BranchState):
    return {"result": "B路径结果"}
```

## 最佳实践

### 1. 清晰的状态结构

```python
class WellStructuredState(TypedDict):
    input_data: dict
    processing_step: str
    results: dict
    metadata: dict
```

### 2. 最小化状态字段

```python
class MinimalState(TypedDict):
    messages: Annotated[list, operator.add]
    final_result: str
```

### 3. 类型注解

```python
class TypedState(TypedDict):
    count: int
    name: str
    items: list[str]
```

## 常见模式

### 计数器模式

```python
class CounterState(TypedDict):
    counter: Annotated[int, operator.add]

def increment(state: CounterState):
    return {"counter": 1}
```

### 累积模式

```python
class AccumulatorState(TypedDict):
    items: Annotated[list, operator.add]

def add_item(state: AccumulatorState):
    return {"items": [state.get("new_item", "item")]}
```

## 总结

| 特性              | 说明                 |
| ----------------- | -------------------- |
| **TypedDict**     | 类型安全的状态定义   |
| **Annotated**     | 特殊的更新策略       |
| **InMemorySaver** | 开发阶段的内存检查点 |
| **检查点**        | 状态恢复和回溯       |

状态管理是 LangGraph 强大能力的核心，通过合理的状态设计可以构建复杂的工作流。
