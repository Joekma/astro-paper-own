---
title: LangGraph 高级特性：循环、条件分支与持久化
author: Joekma
pubDatetime: 2026-05-11T00:00:00.000+08:00
modDatetime: 2026-07-10T00:00:00.000+08:00
slug: langgraph-advanced-features
description: "深入讲解LangGraph高级特性，包括循环控制、条件分支、状态持久化和人机交互。"
tags:
  - LangGraph
  - 高级特性
  - 循环
draft: false
series: LangGraph
seriesOrder: 3
language: zh-CN
---

## 概述

循环、条件分支、检查点、人工审核、子图和并行派发共同构成 LangGraph 的高级编排能力。设计这些工作流时，最重要的是让状态字段、路由返回值和节点输入保持一致。

> 版本基线：本文在 2026-07-10 按 Python 3.10+、`langgraph==1.2.8` 和 `langchain==1.3.11` 校验。PostgreSQL、SQLite 检查点分别使用 3.1.0 稳定版。

![LangGraph 高级特性通过状态驱动的循环、条件分支、子图、人机审批、错误重试和 checkpointer 时间线实现可恢复的复杂工作流](./images/langgraph-advanced-features-figure-01.png)

## 循环控制

循环必须同时具备业务退出条件和运行时保护。下面的业务条件在第五次执行后进入 `END`，`recursion_limit` 只在路由代码出错时兜底。

```python
from typing import Literal, TypedDict

from langgraph.graph import END, START, StateGraph

class LoopState(TypedDict):
    counter: int
    result: str

def process(state: LoopState) -> dict:
    counter = state["counter"] + 1
    return {"counter": counter, "result": f"第 {counter} 次处理"}

def route(state: LoopState) -> Literal["process", "__end__"]:
    return "process" if state["counter"] < 5 else END

builder = StateGraph(LoopState)
builder.add_node("process", process)
builder.add_edge(START, "process")
builder.add_conditional_edges("process", route)

graph = builder.compile()
result = graph.invoke(
    {"counter": 0, "result": ""},
    config={"recursion_limit": 10},
)
assert result["counter"] == 5
```

业务上还可以提前结束，例如找到目标后直接返回 `END`：

```python
# 路由函数片段，依赖前一个示例的 LoopState。
def stop_when_found(state: LoopState) -> Literal["process", "__end__"]:
    if state["result"] == "found" or state["counter"] >= 3:
        return END
    return "process"
```

## 条件分支

路由函数的返回值可以直接使用节点名，也可以通过 `path_map` 映射。下面显式使用业务标签到节点名的映射。

```python
from typing import Literal, TypedDict

from langgraph.graph import END, START, StateGraph

class BranchState(TypedDict):
    input_value: int
    path: str

def classify(state: BranchState) -> Literal["high", "medium", "low"]:
    if state["input_value"] > 100:
        return "high"
    if state["input_value"] > 50:
        return "medium"
    return "low"

def process_high(state: BranchState) -> dict:
    return {"path": "处理高值"}

def process_medium(state: BranchState) -> dict:
    return {"path": "处理中值"}

def process_low(state: BranchState) -> dict:
    return {"path": "处理低值"}

builder = StateGraph(BranchState)
builder.add_node("router", lambda state: {})
builder.add_node("high_processor", process_high)
builder.add_node("medium_processor", process_medium)
builder.add_node("low_processor", process_low)
builder.add_edge(START, "router")
builder.add_conditional_edges(
    "router",
    classify,
    {
        "high": "high_processor",
        "medium": "medium_processor",
        "low": "low_processor",
    },
)
builder.add_edge("high_processor", END)
builder.add_edge("medium_processor", END)
builder.add_edge("low_processor", END)

graph = builder.compile()
result = graph.invoke({"input_value": 75, "path": ""})
assert result["path"] == "处理中值"
```

映射表中的每个目标都必须是已经添加的节点或 `END`。不要把示例中的占位节点名直接带入可运行代码。

## 检查点、恢复与时间旅行

持久化示例需要使用与输入匹配的状态图。下面单独构建消息图，不复用前一节的 `BranchState`。

```python
from langgraph.checkpoint.memory import InMemorySaver
from langgraph.graph import START, MessagesState, StateGraph

def reply(state: MessagesState) -> dict:
    text = state["messages"][-1].content
    return {"messages": [{"role": "assistant", "content": f"收到：{text}"}]}

builder = StateGraph(MessagesState)
builder.add_node("reply", reply)
builder.add_edge(START, "reply")
graph = builder.compile(checkpointer=InMemorySaver())

config = {"configurable": {"thread_id": "session-1"}}
graph.invoke({"messages": [{"role": "user", "content": "第一条"}]}, config)
graph.invoke({"messages": [{"role": "user", "content": "第二条"}]}, config)

history = list(graph.get_state_history(config))
checkpoint_config = history[-2].config
snapshot = graph.get_state(checkpoint_config)

forked = graph.invoke(
    {"messages": [{"role": "user", "content": "从检查点继续"}]},
    checkpoint_config,
)
print(snapshot.values, forked)
```

从历史检查点调用图会创建新分支，不会删除原来的检查点历史。如果要重放该检查点尚未完成的后续任务，使用 `graph.invoke(None, checkpoint_config)`；如果要加入新的用户输入，则像上例一样传入新的状态增量。

## PostgreSQL 与 SQLite 持久化

```bash
python -m pip install "langgraph-checkpoint-postgres==3.1.0" "psycopg[binary,pool]"
python -m pip install "langgraph-checkpoint-sqlite==3.1.0"
```

手动创建 PostgreSQL 连接池时必须配置 `dict_row`。`setup()` 只在初始化或迁移阶段运行。

```python
from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool
from langgraph.checkpoint.postgres import PostgresSaver

DB_URI = "postgresql://user:pass@localhost:5432/postgres?sslmode=disable"

with ConnectionPool(
    conninfo=DB_URI,
    min_size=1,
    max_size=20,
    kwargs={
        "autocommit": True,
        "prepare_threshold": 0,
        "row_factory": dict_row,
    },
) as pool:
    checkpointer = PostgresSaver(pool)
    checkpointer.setup()
    graph = builder.compile(checkpointer=checkpointer)
```

连接字符串方式会在内部创建满足要求的连接：

```python
# 本片段复用前文的 DB_URI 和 builder。
from langgraph.checkpoint.postgres import PostgresSaver

with PostgresSaver.from_conn_string(DB_URI) as checkpointer:
    graph = builder.compile(checkpointer=checkpointer)
```

SQLite 适合本地或测试环境：

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
        {"configurable": {"thread_id": "sqlite-1"}},
    )
    assert result["messages"][-1].content == "ok"
```

生产服务应让连接池与编译后的图随应用一起启动和关闭。异步 PostgreSQL 实现为 `AsyncPostgresSaver`，对应使用 `AsyncConnectionPool` 和异步方法。

## Human-in-the-Loop

`interrupt()` 会保存当前位置并把可序列化数据交给调用方。恢复时节点从头重新执行，`interrupt()` 返回传给 `Command(resume=...)` 的值，因此中断前的副作用必须幂等。

```python
from typing import TypedDict

from langgraph.checkpoint.memory import InMemorySaver
from langgraph.graph import END, START, StateGraph
from langgraph.types import Command, interrupt

class ReviewState(TypedDict):
    draft: str
    decision: str

def human_review(state: ReviewState) -> dict:
    decision = interrupt(
        {
            "draft": state["draft"],
            "options": ["approve", "reject"],
        }
    )
    return {"decision": decision}

builder = StateGraph(ReviewState)
builder.add_node("human_review", human_review)
builder.add_edge(START, "human_review")
builder.add_edge("human_review", END)
graph = builder.compile(checkpointer=InMemorySaver())

config = {"configurable": {"thread_id": "review-1"}}
paused = graph.invoke({"draft": "待审核内容", "decision": ""}, config)
assert paused["__interrupt__"]

result = graph.invoke(Command(resume="approve"), config)
assert result["decision"] == "approve"
```

如果要直接修正已保存状态，使用 `update_state`，并明确更新被视为来自哪个节点：

```python
# 本片段接续上一个人工审核示例。
updated_config = graph.update_state(
    config,
    {"decision": "manual-override"},
    as_node="human_review",
)
print(graph.get_state(updated_config).values)
```

## 工具错误处理

`@tool` 函数必须提供 docstring 或显式 description。`ToolNode` 默认只处理工具调用参数等调用错误，工具函数自身抛出的执行异常会继续向外抛出。若要把执行错误转换为 `ToolMessage` 返回模型，需要显式配置 `handle_tool_errors`。

```python
from langchain.tools import tool
from langgraph.prebuilt import ToolNode

@tool
def unreliable_tool(query: str) -> str:
    """处理查询；用于演示工具执行异常。"""
    raise RuntimeError(f"处理失败：{query}")

tool_node = ToolNode(
    [unreliable_tool],
    handle_tool_errors="工具暂时不可用，请稍后重试。",
)
```

对普通节点，只有明确可恢复的异常才应在节点内捕获；未知编程错误应保留堆栈并交给运行时处理。

## 子图

父图与子图共享状态键时，可以把编译后的子图直接添加为节点。子图私有字段不会出现在父图最终输出中。

```python
from typing import TypedDict

from langgraph.graph import END, START, StateGraph

class SubgraphState(TypedDict):
    value: str
    private_note: str

def prepare(state: SubgraphState) -> dict:
    return {"private_note": "已处理"}

def publish(state: SubgraphState) -> dict:
    return {"value": f"{state['value']} / {state['private_note']}"}

sub_builder = StateGraph(SubgraphState)
sub_builder.add_node("prepare", prepare)
sub_builder.add_node("publish", publish)
sub_builder.add_edge(START, "prepare")
sub_builder.add_edge("prepare", "publish")
sub_builder.add_edge("publish", END)
subgraph = sub_builder.compile()

class ParentState(TypedDict):
    value: str

parent_builder = StateGraph(ParentState)
parent_builder.add_node("subgraph", subgraph)
parent_builder.add_edge(START, "subgraph")
parent_builder.add_edge("subgraph", END)
graph = parent_builder.compile()

result = graph.invoke({"value": "父图输入"})
assert result == {"value": "父图输入 / 已处理"}
```

父子图没有共享字段时，使用包装节点显式转换输入和输出。

## Send 并行派发

`Send` 为每个输入创建独立的节点调用。所有分支写入同一个结果字段时，该字段必须配置 reducer。

```python
import operator
from typing import Annotated, TypedDict

from langgraph.graph import END, START, StateGraph
from langgraph.types import Send

class OverallState(TypedDict):
    items: list[str]
    results: Annotated[list[str], operator.add]

class ItemState(TypedDict):
    item: str

def spawn_tasks(state: OverallState) -> list[Send]:
    return [Send("process_item", {"item": item}) for item in state["items"]]

def process_item(state: ItemState) -> dict:
    return {"results": [f"processed: {state['item']}"]}

builder = StateGraph(OverallState)
builder.add_node("process_item", process_item)
builder.add_conditional_edges(START, spawn_tasks)
builder.add_edge("process_item", END)
graph = builder.compile()

result = graph.invoke({"items": ["a", "b"], "results": []})
assert sorted(result["results"]) == ["processed: a", "processed: b"]
```

## 总结

- 循环必须有业务退出条件，并用 `recursion_limit` 防御错误路由。
- 分支标签、映射表和节点名必须一一对应。
- 中断和时间旅行依赖 checkpointer 与稳定的 `thread_id`。
- 工具执行异常默认不会自动变成工具消息，需要显式错误策略。
- 子图用于封装局部状态，`Send` 用于动态 map-reduce 派发。
