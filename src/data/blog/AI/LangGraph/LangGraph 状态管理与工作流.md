---
title: LangGraph 状态管理与工作流
author: Joekma
pubDatetime: 2026-05-07T00:00:00.000+08:00
modDatetime: 2026-05-07T00:00:00.000+08:00
slug: langgraph-state-management
description: '深入讲解LangGraph状态管理机制，包括状态定义、更新策略、状态持久化和跨会话管理。'
tags:
  - LangGraph
  - State
  - Workflow
draft: false
series: LangGraph
language: zh-CN
---

## 概述

状态管理是 LangGraph 的核心特性之一。它通过强类型的状态定义，确保数据在整个图中的流动是可预测和可控的。本篇将详细介绍 LangGraph 的状态管理机制。

### 状态管理架构

```
┌─────────────────────────────────────────────────────────────┐
│                    LangGraph 状态管理                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   ┌─────────────────────────────────────────────────────┐  │
│   │                    State 定义                        │  │
│   │   class AgentState(TypedDict):                      │  │
│   │       messages: list                                │  │
│   │       context: str                                  │  │
│   │       result: str                                   │  │
│   └─────────────────────────────────────────────────────┘  │
│                           │                                 │
│                           ▼                                 │
│   ┌─────────────────────────────────────────────────────┐  │
│   │              状态更新 (节点返回值)                     │  │
│   │   def node(state):                                   │  │
│   │       return {"key": "new_value"}                   │  │
│   └─────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 状态定义

### TypedDict 基础

```python
# 导入TypedDict用于类型安全的状态定义
from typing import TypedDict, List

# 定义Agent状态结构
class AgentState(TypedDict):
    messages: List[str]     # 消息列表
    context: str            # 上下文信息
    iterations: int         # 迭代次数
```

### 带注解的状态

```python
# 导入Annotated用于特殊状态更新策略
from typing import TypedDict, Annotated
import operator

# Annotated用于指定状态字段的特殊更新策略
# operator.add 表示列表字段使用追加而非替换策略
class EnhancedState(TypedDict):
    messages: Annotated[list, operator.add]  # 消息自动追加
    counter: int                            # 普通整数
    results: dict                            # 结果字典
```

## 状态更新策略

### 基础更新

```python
# 导入LangGraph组件
from langgraph.graph import StateGraph, START
from typing import TypedDict

# 定义简单状态
class SimpleState(TypedDict):
    value: str
    count: int

# 递增计数器的节点
def increment(state: SimpleState):
    # 返回要更新的字段，会与现有状态合并
    return {"count": state["count"] + 1}

# 更新值的节点
def update_value(state: SimpleState):
    return {"value": state["value"] + "_updated"}

# 创建图
graph = StateGraph(SimpleState)

# 添加节点
graph.add_node("increment", increment)
graph.add_node("update", update_value)

# 添加边
graph.add_edge(START, "increment")
graph.add_edge("increment", "update")
```

### 合并更新

```python
# 可以一次返回多个字段的更新
def multi_update(state: SimpleState):
    return {
        "value": "new_value",
        "count": state["count"] + 10
    }
```

### Annotated 状态

```python
# Annotated[list, operator.add] 表示消息追加而非替换
class MessageState(TypedDict):
    messages: Annotated[list, operator.add]

# 添加消息会自动追加到列表
def add_message(state: MessageState):
    return {"messages": [{"role": "assistant", "content": "新消息"}]}

# 再添加一条消息会追加而非替换
def another_message(state: MessageState):
    return {"messages": [{"role": "user", "content": "用户消息"}]}
```

## 内置状态类型

### MessagesState

```python
from langgraph.graph import MessagesState

def process_messages(state: MessagesState):
    messages = state["messages"]
    return {"messages": messages + ["处理后的消息"]}
```

### 自定义 MessagesState

```python
class CustomMessagesState(TypedDict):
    messages: Annotated[list, operator.add]
    metadata: dict
```

## 状态持久化

### MemorySaver

```python
# 导入内存检查点保存器
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import StateGraph, START, MessagesState

# 创建内存检查点
memory = MemorySaver()

# 创建图
graph = StateGraph(MessagesState)
graph.add_node("process", lambda s: {"messages": s["messages"]})
graph.add_edge(START, "process")

# 编译时传入检查点，实现状态持久化
app = graph.compile(checkpointer=memory)

# 配置，包含线程ID用于区分不同会话
config = {"configurable": {"thread_id": "user_123"}}

# 调用应用，状态会被保存
result = app.invoke(
    {"messages": [{"role": "user", "content": "你好"}]},
    config=config
)

# 获取对话历史
history = [s async for s in app.astream_history(config)]
```

### PostgreSQL Checkpointer

```python
from langgraph.checkpoint.postgres import PostgresSaver
from langchain_postgres import Pool

pool = Pool.connect("postgresql://user:pass@localhost/db")
checkpointer = PostgresSaver(pool)
checkpointer.setup()

app = graph.compile(checkpointer=checkpointer)
```

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
from langchain_core.runnables import RunnableConfig

config = {"configurable": {"thread_id": "session_1", "checkpoint_ns": "abc123"}}
app.recover_state_from_checkpoint(config)
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
from pydantic import BaseModel, Field, validator

class StateModel(BaseModel):
    name: str
    age: int = Field(gt=0)
    email: str

    @validator("email")
    def validate_email(cls, v):
        if "@" not in v:
            raise ValueError("无效的邮箱格式")
        return v
```

## 实际应用

### 1. 对话状态机

```python
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

def route_by_intent(state: ConversationState):
    intent = state["current_intent"]
    return intent
```

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
class BranchState(TypedDict):
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

| 特性 | 说明 |
|------|------|
| **TypedDict** | 类型安全的状态定义 |
| **Annotated** | 特殊的更新策略 |
| **MemorySaver** | 内存状态持久化 |
| **检查点** | 状态恢复和回溯 |

状态管理是 LangGraph 强大能力的核心，通过合理的状态设计可以构建复杂的工作流。
