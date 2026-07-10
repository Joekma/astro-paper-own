---
title: LangGraph 状态管理与工作流
author: Joekma
pubDatetime: 2026-05-11T00:00:00.000+08:00
modDatetime: 2026-07-10T00:00:00.000+08:00
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

LangGraph 节点共同读写一份状态。状态 schema 决定可用字段，reducer 决定同一字段收到新值时如何合并，checkpointer 则在每个执行步骤保存状态快照。

> 版本基线：本文在 2026-07-10 按 Python 3.10+ 和 `langgraph==1.2.8` 校验。PostgreSQL、SQLite 示例分别使用 `langgraph-checkpoint-postgres==3.1.0` 和 `langgraph-checkpoint-sqlite==3.1.0`。

![LangGraph 状态管理通过 TypedDict 或 MessagesState 定义状态，节点返回局部更新，再由覆盖或 reducer 合并策略写入 checkpointer 并按 thread_id 隔离会话](./images/langgraph-state-management-workflow-figure-01.png)

## 状态 schema 与 reducer

### TypedDict：静态类型信息

`TypedDict` 告诉编辑器、类型检查器和读者状态有哪些字段，但它不会自动验证运行时输入。

```python
from typing import TypedDict

class AgentState(TypedDict):
    context: str
    iterations: int
```

默认 reducer 是覆盖：节点返回的新值替换旧值。使用 `Annotated` 可以为字段指定累积策略。

```python
import operator
from typing import Annotated, TypedDict

class AccumulatingState(TypedDict):
    events: Annotated[list[str], operator.add]
    counter: int

def record_event(state: AccumulatingState) -> dict:
    return {
        "events": [f"第 {state['counter'] + 1} 次执行"],
        "counter": state["counter"] + 1,
    }
```

节点应返回状态增量。对已配置累积 reducer 的字段，不要再次手动拼接旧值，否则会重复追加。

### MessagesState：消息专用状态

消息不适合使用普通 `operator.add`。`add_messages` 会把字典消息转换为 LangChain 消息对象、按 ID 更新消息，并保留已有历史。内置 `MessagesState` 已声明好这个 reducer。

```python
from langgraph.graph import MessagesState

def add_reply(state: MessagesState) -> dict:
    user_text = state["messages"][-1].content
    return {
        "messages": [
            {"role": "assistant", "content": f"已收到：{user_text}"}
        ]
    }
```

需要额外业务字段时可以继承 `MessagesState`：

```python
from langgraph.graph import MessagesState

class SupportState(MessagesState):
    customer_id: str
    current_intent: str
```

## 状态更新工作流

下面的完整示例同时展示覆盖字段和累积字段。

```python
import operator
from typing import Annotated, TypedDict

from langgraph.graph import END, START, StateGraph

class WorkflowState(TypedDict):
    step: str
    data: dict
    history: Annotated[list[str], operator.add]

def step_1(state: WorkflowState) -> dict:
    return {
        "step": "step_2",
        "data": {**state["data"], "step1_done": True},
        "history": ["Step 1 完成"],
    }

def step_2(state: WorkflowState) -> dict:
    return {
        "step": "complete",
        "data": {**state["data"], "step2_done": True},
        "history": ["Step 2 完成"],
    }

builder = StateGraph(WorkflowState)
builder.add_node("step_1", step_1)
builder.add_node("step_2", step_2)
builder.add_edge(START, "step_1")
builder.add_edge("step_1", "step_2")
builder.add_edge("step_2", END)

graph = builder.compile()
result = graph.invoke({"step": "start", "data": {}, "history": []})
assert result["history"] == ["Step 1 完成", "Step 2 完成"]
```

## 状态验证

### 节点中的业务验证

`TypedDict` 不做运行时验证。简单业务约束可以在节点中显式检查。

```python
from typing import TypedDict

class UserState(TypedDict):
    name: str
    age: int

def validate_user(state: UserState) -> dict:
    if state["age"] < 0:
        raise ValueError("年龄不能为负数")
    return {}
```

### Pydantic 运行时验证

需要递归运行时验证时，Graph API 支持把 Pydantic 模型作为状态 schema。代价是性能低于 `TypedDict`。

```python
from pydantic import BaseModel, Field, field_validator
from langgraph.graph import END, START, StateGraph

class ValidatedState(BaseModel):
    name: str
    age: int = Field(ge=0)
    email: str

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        if "@" not in value:
            raise ValueError("无效的邮箱格式")
        return value

def normalize_name(state: ValidatedState) -> dict:
    return {"name": state.name.strip()}

builder = StateGraph(ValidatedState)
builder.add_node("normalize_name", normalize_name)
builder.add_edge(START, "normalize_name")
builder.add_edge("normalize_name", END)
graph = builder.compile()

result = graph.invoke({"name": " 张三 ", "age": 20, "email": "a@example.com"})
assert result["name"] == "张三"
```

## 条件路由状态机

路由函数应返回真实节点名，或通过 `path_map` 映射到节点名。下面把 `general` 和 `query` 都交给查询节点，避免出现没有对应节点的状态值。

```python
from typing import Literal

from langgraph.graph import END, START, MessagesState, StateGraph

class ConversationState(MessagesState):
    current_intent: str

def detect_intent(state: ConversationState) -> dict:
    text = state["messages"][-1].content
    if any(word in text for word in ["订购", "购买"]):
        intent = "order"
    elif any(word in text for word in ["查询", "状态"]):
        intent = "query"
    else:
        intent = "general"
    return {"current_intent": intent}

def route_intent(
    state: ConversationState,
) -> Literal["process_order", "process_query"]:
    return "process_order" if state["current_intent"] == "order" else "process_query"

def process_order(state: ConversationState) -> dict:
    return {"messages": [{"role": "assistant", "content": "订单已处理"}]}

def process_query(state: ConversationState) -> dict:
    return {"messages": [{"role": "assistant", "content": "查询完成"}]}

builder = StateGraph(ConversationState)
builder.add_node("detect_intent", detect_intent)
builder.add_node("process_order", process_order)
builder.add_node("process_query", process_query)
builder.add_edge(START, "detect_intent")
builder.add_conditional_edges("detect_intent", route_intent)
builder.add_edge("process_order", END)
builder.add_edge("process_query", END)

graph = builder.compile()
result = graph.invoke(
    {
        "messages": [{"role": "user", "content": "查询订单状态"}],
        "current_intent": "",
    }
)
assert result["current_intent"] == "query"
```

## 检查点与线程状态

`thread_id` 是 checkpointer 中执行线程的主标识。复用它会读取已有状态，换一个 ID 则创建新线程。

```python
from langgraph.checkpoint.memory import InMemorySaver
from langgraph.graph import START, MessagesState, StateGraph

def echo(state: MessagesState) -> dict:
    text = state["messages"][-1].content
    return {"messages": [{"role": "assistant", "content": f"Echo: {text}"}]}

builder = StateGraph(MessagesState)
builder.add_node("echo", echo)
builder.add_edge(START, "echo")
graph = builder.compile(checkpointer=InMemorySaver())

config = {"configurable": {"thread_id": "session-1"}}
graph.invoke({"messages": [{"role": "user", "content": "第一轮"}]}, config)
result = graph.invoke(
    {"messages": [{"role": "user", "content": "第二轮"}]},
    config,
)

snapshot = graph.get_state(config)
history = list(graph.get_state_history(config))
assert snapshot.values == result
assert len(history) > 1
```

从历史检查点继续执行会产生新分支，而不是覆盖原历史：

```python
# 本片段接续上一个检查点示例。
checkpoint_config = history[-2].config
old_snapshot = graph.get_state(checkpoint_config)

forked = graph.invoke(
    {"messages": [{"role": "user", "content": "从历史状态继续"}]},
    checkpoint_config,
)
print(old_snapshot.values, forked)
```

## PostgreSQL Checkpointer

```bash
python -m pip install "langgraph-checkpoint-postgres==3.1.0" "psycopg[binary,pool]"
```

手动提供连接或连接池时，连接必须使用 `autocommit=True` 和 `row_factory=dict_row`。`setup()` 创建或迁移检查点表，应在初始化或部署迁移阶段执行，而不是在每次请求中调用。

```python
from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool
from langgraph.checkpoint.postgres import PostgresSaver

DB_URI = "postgresql://user:pass@localhost:5432/postgres?sslmode=disable"

connection_kwargs = {
    "autocommit": True,
    "prepare_threshold": 0,
    "row_factory": dict_row,
}

with ConnectionPool(
    conninfo=DB_URI,
    min_size=1,
    max_size=20,
    kwargs=connection_kwargs,
) as pool:
    checkpointer = PostgresSaver(pool)
    checkpointer.setup()  # 仅首次初始化或迁移时执行
    graph = builder.compile(checkpointer=checkpointer)
```

如果不需要自己管理连接池，可以使用连接字符串上下文管理器：

```python
# 本片段复用前文的 DB_URI 和 builder。
from langgraph.checkpoint.postgres import PostgresSaver

with PostgresSaver.from_conn_string(DB_URI) as checkpointer:
    graph = builder.compile(checkpointer=checkpointer)
```

异步版本使用 `langgraph.checkpoint.postgres.aio.AsyncPostgresSaver` 和 `psycopg_pool.AsyncConnectionPool`。连接池及编译后的图应与服务进程保持相同生命周期。

## SQLite Checkpointer

SQLite 适合本地开发、测试或小型单进程应用。

```bash
python -m pip install "langgraph-checkpoint-sqlite==3.1.0"
```

```python
from langgraph.checkpoint.sqlite import SqliteSaver
from langgraph.graph import START, MessagesState, StateGraph

builder = StateGraph(MessagesState)
builder.add_node("reply", lambda state: {"messages": [{"role": "assistant", "content": "ok"}]})
builder.add_edge(START, "reply")

with SqliteSaver.from_conn_string(":memory:") as checkpointer:
    graph = builder.compile(checkpointer=checkpointer)
    result = graph.invoke(
        {"messages": [{"role": "user", "content": "hello"}]},
        {"configurable": {"thread_id": "sqlite-test"}},
    )
    assert result["messages"][-1].content == "ok"
```

多进程、高并发或需要集中化运维时，优先选择 PostgreSQL 等服务型后端。

## 常见累积模式

状态函数读取的字段必须出现在 schema 中。下面的 `new_item` 是输入字段，`items` 是累积结果。

```python
import operator
from typing import Annotated, TypedDict

from langgraph.graph import START, StateGraph

class AccumulatorState(TypedDict):
    new_item: str
    items: Annotated[list[str], operator.add]

def add_item(state: AccumulatorState) -> dict:
    return {"items": [state["new_item"]]}

builder = StateGraph(AccumulatorState)
builder.add_node("add_item", add_item)
builder.add_edge(START, "add_item")
graph = builder.compile()

result = graph.invoke({"new_item": "A", "items": []})
assert result["items"] == ["A"]
```

## 总结

- 普通字段默认覆盖，累积字段必须显式定义 reducer。
- 消息历史使用 `MessagesState` 或 `add_messages`，不要用普通列表拼接替代。
- `TypedDict` 用于类型提示，Pydantic 或节点逻辑负责运行时验证。
- checkpointer 保存执行快照，`thread_id` 标识执行线程；内存实现不适合生产持久化。
