---
title: LangGraph 状态管理与工作流
author: Joekma
pubDatetime: 2026-05-11T00:00:00.000+08:00
modDatetime: 2026-07-12T00:00:00.000+08:00
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

![状态 schema、节点局部更新、reducer 合并、按 thread_id 保存检查点以及从历史状态分叉的完整生命周期](./images/langgraph-state-update-reducer-lifecycle-figure-01.png)

## 前置知识与学习目标

阅读前应先理解上一篇中的 State、Node、Edge 和 `compile()`。本文不讨论模型如何选择工具，而是回答三个更底层的问题：状态允许有哪些字段、节点返回的新值如何合并、执行到一半时状态如何被保存和恢复。

读完后，你应当能够：

1. 为业务工作流选择 `TypedDict`、Pydantic 或 `MessagesState`；
2. 手算覆盖 reducer、累积 reducer 和 `add_messages` 的更新结果；
3. 解释 `thread_id` 如何隔离执行线程；
4. 为本地测试和生产服务选择合适的 checkpointer。

### 先把状态当作接口设计

状态 schema 是节点之间的公共协议。字段过少会迫使节点反复解析消息，字段过多又会让任意节点都能修改所有业务数据。一个实用的划分方式是：输入字段描述本次请求，过程字段记录路由与中间结果，输出字段保存调用方真正需要的结果，审计字段记录步骤、错误或停止原因。

| 字段类别 | 示例                          | 设计问题                 |
| -------- | ----------------------------- | ------------------------ |
| 输入     | `question`、`customer_id`     | 调用开始后是否应保持不变 |
| 过程     | `current_intent`、`documents` | 哪些节点拥有写权限       |
| 输出     | `answer`、`decision`          | 调用方如何判断是否完整   |
| 审计     | `events`、`stop_reason`       | 应覆盖还是累积           |

不要把模型客户端、数据库连接或文件句柄放入状态；它们属于运行时依赖，可以通过 runtime context 或闭包传入。状态应尽量可序列化，才能被 checkpointer 稳定保存和恢复。

为字段选择 reducer 时，可以依次问三个问题：新值是否应完全替换旧值；多次更新是否都需要保留；是否存在按 ID 修正既有元素的需求。分别对应默认覆盖、累积 reducer 和消息专用 reducer。无法明确回答时，先使用覆盖并增加测试，不要默认把所有列表都设为累积。

schema 变更还需要考虑已有检查点。新增可选字段通常容易兼容，删除或改名则可能使旧快照无法被新节点读取。上线前应使用真实旧快照执行一次恢复测试，而不只测试全新线程。

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

### 从旧状态手算一次合并

假设执行前的状态和节点返回值分别为：

```python
current = {"events": ["created"], "counter": 1}
update = {"events": ["validated"], "counter": 2}
```

`events` 使用 `operator.add`，而 `counter` 使用默认覆盖，因此合并后的结果是：

```python
merged = {"events": ["created", "validated"], "counter": 2}
```

| 字段      | 旧值          | 节点更新        | reducer        | 新值                       |
| --------- | ------------- | --------------- | -------------- | -------------------------- |
| `events`  | `["created"]` | `["validated"]` | `operator.add` | `["created", "validated"]` |
| `counter` | `1`           | `2`             | 默认覆盖       | `2`                        |

![LangGraph 对覆盖字段、累积字段和消息字段应用不同 reducer，并展示重复拼接与消息 ID 更新的差异](./images/langgraph-reducer-strategies-comparison-figure-02.png)

错误写法是让节点返回 `{"events": [*state["events"], "validated"]}`。节点已经把旧列表放入更新值，reducer 又把旧列表追加一次，最终会得到 `["created", "created", "validated"]`。

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

`add_messages` 不只是列表相加。如果新消息携带与历史消息相同的 ID，它会替换对应消息；如果 ID 不存在，则追加到历史。这使工具结果修正、人工编辑和消息重放比普通 `operator.add` 更可控。官方 [Graph API 文档](https://docs.langchain.com/oss/python/langgraph/graph-api) 将 reducer 定义为状态键的更新规则，而不是节点内部的副作用。

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

该示例的控制流固定为 `step_1 → step_2 → END`。`history` 只返回本次新增事件，`data` 则由节点显式复制并更新，因为普通字典字段默认会整体覆盖。若多个并行节点同时写入 `data`，应拆分字段或定义明确的 reducer，不能依赖执行顺序碰巧正确。

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

选择 schema 类型时，不应简单地把“验证越多越安全”当成结论：

| 方案            | 优点                   | 代价                 | 适用位置               |
| --------------- | ---------------------- | -------------------- | ---------------------- |
| `TypedDict`     | 轻量、类型检查友好     | 不做运行时验证       | 内部状态和高频节点     |
| Pydantic        | 递归验证、错误信息明确 | 构造与验证有额外成本 | 不可信输入进入图的边界 |
| `MessagesState` | 已配置消息 reducer     | 主要解决消息字段     | 对话与工具 Agent       |

即使使用 Pydantic，节点仍需验证跨字段业务约束，例如“退款金额不能超过订单实付金额”。schema 验证解决数据形状问题，业务验证解决领域规则问题，两者不能互相替代。

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

路由读取的是已经写入状态的 `current_intent`。如果让路由函数再次独立分类，就会出现“状态显示 query，但路由计算成 general”的双重事实来源。推荐让业务决策由一个节点写入状态，路由只消费该结果。

## 检查点与线程状态

`thread_id` 是 checkpointer 中执行线程的主标识。复用它会读取已有状态，换一个 ID 则创建新线程。

生产系统通常把 `thread_id` 设计为不可猜测、可审计且作用域明确的标识，而不是直接使用用户名。调用入口应先验证当前用户是否有权访问该线程，再把 ID 传给图；checkpointer 负责查找状态，不负责替应用完成租户授权。

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

检查点可以理解为某个执行步骤的不可变快照。使用旧 checkpoint config 再次调用图会形成新的执行轨迹；它不会删除后来已经存在的检查点。官方 [Persistence 文档](https://docs.langchain.com/oss/python/langgraph/persistence) 将其用途归纳为记忆、人工介入、时间旅行和故障恢复。

需要人工修正状态时，可以调用 `update_state`，但应同时指定 `as_node`，让 runtime 知道这次更新在逻辑上来自哪个节点。修改后的 config 指向新的快照；它不是在原快照上就地改值。对审计敏感的工作流，还应把操作者、原因和外部工单号写入专用审计字段，而不是只保存修正后的最终值。

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

| 场景           | 建议后端        | 主要边界                       |
| -------------- | --------------- | ------------------------------ |
| 单元测试、演示 | `InMemorySaver` | 进程退出后数据丢失             |
| 本地单进程工具 | SQLite          | 不适合高并发共享写入           |
| 多实例生产服务 | PostgreSQL      | 需要连接池、迁移和生命周期管理 |

checkpointer 与业务长期存储解决的问题不同：前者保存图执行状态，后者保存用户资料、知识、订单等领域数据。不要为了读取一条业务记录而把所有数据都塞进 graph state。

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

## 常见失败模式

- 节点读取了 schema 中不存在的键，导致类型检查缺失或运行时 `KeyError`。
- 已有累积 reducer 的字段再次手动拼接旧值，产生重复数据。
- 对消息列表使用普通 `operator.add`，失去消息对象转换和按 ID 更新能力。
- 多个并行节点同时覆盖同一个普通字段，引发并发更新冲突。
- 为不同用户复用同一个 `thread_id`，造成会话状态串线。
- 在每个请求中调用 PostgreSQL `setup()`，把初始化工作带入热路径。

## 本篇自检

1. 旧值 `["A"]` 与节点更新 `["B"]` 在默认覆盖和 `operator.add` 下分别得到什么结果？
2. 为什么 `MessagesState` 不应被普通列表 reducer 替代？
3. 从旧 checkpoint 继续执行时，原来的后续历史会发生什么？

<details>
<summary>查看答案</summary>

1. 默认覆盖得到 `["B"]`；`operator.add` 得到 `["A", "B"]`。
2. `MessagesState` 使用 `add_messages`，会完成消息对象转换、保留历史并按消息 ID 更新；普通列表相加只会盲目追加。
3. 原历史不会被覆盖或删除；新调用从该快照形成一条新的执行分支。

</details>

## 下一篇连接

掌握 reducer 和 checkpoint 后，下一篇将把它们用于循环、条件分支、人工中断、子图和动态并行派发。理解“节点只返回更新、runtime 负责合并”是阅读高级特性的前提。

## 总结

- 普通字段默认覆盖，累积字段必须显式定义 reducer。
- 消息历史使用 `MessagesState` 或 `add_messages`，不要用普通列表拼接替代。
- `TypedDict` 用于类型提示，Pydantic 或节点逻辑负责运行时验证。
- checkpointer 保存执行快照，`thread_id` 标识执行线程；内存实现不适合生产持久化。
