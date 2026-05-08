---
title: LangGraph 状态管理与工作流
author: Joekma
pubDatetime: 2026-05-08T00:00:00.000+08:00
modDatetime: 2026-05-08T00:00:00.000+08:00
slug: langgraph-state-management
description: '深入理解LangGraph状态管理机制，包括State定义、Reducer函数、工作流设计和最佳实践。'
tags:
  - LangGraph
  - LLM
  - AI
  - State Management
draft: false
language: zh-CN
---

## 概述

状态管理是 LangGraph 的核心特性之一。与传统的无状态函数调用不同，LangGraph 通过 **State** 机制在整个工作流中保持和传递数据，使得构建复杂的、多轮交互的 AI 应用成为可能。本文将深入探讨 LangGraph 的状态管理机制和高级工作流设计。

## State 的基本概念

### 什么是 State？

State 是 LangGraph 中用于存储和管理应用数据的对象。它贯穿整个图的执行过程，每个节点都可以读取和修改 State：

```
┌─────────────────────────────────────────────────────────┐
│                      State Flow                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────┐                                      │
│  │ Initial State│                                      │
│  └──────┬───────┘                                      │
│         │                                              │
│         ▼                                              │
│  ┌──────────────┐     ┌──────────────┐                │
│  │  Node A      │────▶│  Node B      │                │
│  │  (read)      │     │  (read/write)│                │
│  └──────┬───────┘     └──────┬───────┘                │
│         │                    │                        │
│         └──────────┬──────────┘                       │
│                    ▼                                   │
│              ┌──────────────┐                         │
│              │  Updated State│                        │
│              └──────────────┘                         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### State 的定义

使用 `TypedDict` 定义状态结构：

```python
from typing import TypedDict

class AgentState(TypedDict):
    # 必需字段
    messages: list
    
    # 可选字段带默认值
    user_name: str | None
    turn_count: int
    context: dict
```

## 高级 State 定义

### 使用 Annotated 添加 Reducer

Reducer 决定了如何更新状态字段，是 LangGraph 状态管理的核心：

```python
from typing import TypedDict, Annotated
import operator

class ConversationState(TypedDict):
    # 普通字段：会被新值覆盖
    current_topic: str
    
    # 带 reducer 的字段：会自动合并
    messages: Annotated[list, operator.add]
    
    # 使用 extend reducer：合并列表
    history: Annotated[list, operator.extend]
    
    # 计数器
    turn_count: Annotated[int, lambda x, y: x + y]
    
    # 字符串拼接
    summary: Annotated[str, lambda x, y: f"{x} {y}"]
```

### 常用 Reducer 函数

| Reducer | 用途 | 示例 |
|---------|------|------|
| `operator.add` | 列表累加 | `messages: Annotated[list, operator.add]` |
| `operator.extend` | 列表扩展 | `history: Annotated[list, operator.extend]` |
| `operator.and_` | 集合交集 | `tags: Annotated[set, operator.and_]` |
| `operator.or_` | 集合并集 | `permissions: Annotated[set, operator.or_]` |
| 自定义函数 | 特殊逻辑 | `count: Annotated[int, lambda x, y: x + y]` |

### 自定义 Reducer

```python
def merge_dicts(existing: dict, new: dict) -> dict:
    """合并字典，保留已存在的键"""
    result = existing.copy()
    result.update(new)
    return result

def take_last(existing: str, new: str) -> str:
    """只保留最新值"""
    return new

def count_items(existing: int, increment: int) -> int:
    """计数增加"""
    return existing + increment

class MyState(TypedDict):
    config: Annotated[dict, merge_dicts]
    current_value: Annotated[str, take_last]
    counter: Annotated[int, count_items]

def node1(state):
    return {
        "config": {"theme": "dark", "language": "zh"},
        "current_value": "first",
        "counter": 1
    }

def node2(state):
    return {
        "config": {"font_size": 14},
        "current_value": "second",
        "counter": 1
    }

# 验证 reducer 效果
graph = StateGraph(MyState)
graph.add_node("node1", node1)
graph.add_node("node2", node2)
graph.add_edge("__start__", "node1")
graph.add_edge("node1", "node2")
graph.add_edge("node2", "__end__")

app = graph.compile()
result = app.invoke({})

# 最终状态
# config: {"theme": "dark", "language": "zh", "font_size": 14}
# current_value: "second" (保留最后一次)
# counter: 2
```

## MessagesState 的消息管理

### 预定义状态

LangGraph 提供了预定义的 `MessagesState`，方便处理对话：

```python
from langgraph.graph import MessagesState

# MessagesState 包含:
# messages: Annotated[list[BaseMessage], add_messages]

# 导入消息添加 reducer
from langgraph.graph import add_messages
```

### add_messages Reducer

`add_messages` 是专门为对话设计的 reducer：

```python
from typing import TypedDict, Annotated
from langgraph.graph import MessagesState, add_messages

class ChatState(MessagesState):
    """扩展消息状态"""
    system_prompt: str
    user_preferences: dict

def chatbot(state):
    # 读取所有消息
    messages = state["messages"]
    
    # 生成回复
    response = llm.invoke(messages)
    
    # 返回更新（会自动添加到 messages）
    return {"messages": [response]}

def add_system_prompt(state):
    system_msg = SystemMessage(
        content=state.get("system_prompt", "你是一个有帮助的助手。")
    )
    return {"messages": [system_msg]}

# 特殊处理：消息 ID 管理
def update_message(state):
    from langchain_core.messages import AIMessage
    
    # 创建带 ID 的消息
    new_msg = AIMessage(
        content="这是新消息",
        id="msg_001"
    )
    
    return {"messages": [new_msg]}
```

## 工作流模式

### 顺序工作流

最简单的线性流程：

```python
class LinearState(TypedDict):
    data: str
    processed: list

def step1(state):
    return {"processed": ["Step 1"]}

def step2(state):
    return {"processed": state["processed"] + ["Step 2"]}

def step3(state):
    return {"processed": state["processed"] + ["Step 3"]}

graph = StateGraph(LinearState)
graph.add_node("step1", step1)
graph.add_node("step2", step2)
graph.add_node("step3", step3)

graph.add_edge("__start__", "step1")
graph.add_edge("step1", "step2")
graph.add_edge("step2", "step3")
graph.add_edge("step3", "__end__")
```

### 条件分支工作流

根据状态选择不同路径：

```python
class BranchState(TypedDict):
    user_level: str
    response: str
    skill_tags: list

def classify_user(state):
    # 根据用户历史判断级别
    return {"user_level": "advanced"}

def handle_beginner(state):
    return {"response": "欢迎！让我们从基础开始..."}

def handle_advanced(state):
    return {"response": "好的，让我们深入探讨..."}

def handle_expert(state):
    return {"response": "让我们讨论一些高级主题..."}

def route_based_on_level(state) -> Literal["beginner", "advanced", "expert"]:
    level = state["user_level"].lower()
    if level == "beginner":
        return "beginner"
    elif level == "advanced":
        return "advanced"
    else:
        return "expert"

graph = StateGraph(BranchState)
graph.add_node("classify", classify_user)
graph.add_node("beginner", handle_beginner)
graph.add_node("advanced", handle_advanced)
graph.add_node("expert", handle_expert)

graph.add_edge("__start__", "classify")
graph.add_conditional_edges(
    "classify",
    route_based_on_level,
    {
        "beginner": "beginner",
        "advanced": "advanced",
        "expert": "expert"
    }
)

graph.add_edge("beginner", "__end__")
graph.add_edge("advanced", "__end__")
graph.add_edge("expert", "__end__")
```

### 循环工作流

需要多次迭代的场景：

```python
class LoopState(TypedDict):
    query: str
    results: list
    iterations: int
    should_continue: bool

def search(state):
    # 执行搜索
    return {
        "results": state["results"] + ["search_result"],
        "iterations": state["iterations"] + 1
    }

def evaluate(state):
    # 评估结果
    quality = len(state["results"])  # 简化评估
    
    return {
        "should_continue": quality < 3
    }

def should_continue(state) -> Literal["search", "__end__"]:
    if state["should_continue"] and state["iterations"] < 5:
        return "search"
    return "__end__"

graph = StateGraph(LoopState)
graph.add_node("search", search)
graph.add_node("evaluate", evaluate)

graph.add_edge("__start__", "search")
graph.add_edge("search", "evaluate")
graph.add_conditional_edges(
    "evaluate",
    should_continue,
    {
        "search": "search",
        "__end__": END
    }
)

app = graph.compile()
result = app.invoke({
    "query": "LangGraph 教程",
    "results": [],
    "iterations": 0,
    "should_continue": True
})
```

### 并行工作流

多个节点同时执行：

```python
from typing import TypedDict
from langgraph.graph import StateGraph, END

class ParallelState(TypedDict):
    topic: str
    outline: Annotated[list, operator.add]
    content: str
    references: Annotated[list, operator.add]

def generate_outline(state):
    return {
        "outline": ["第1章: 概述", "第2章: 核心概念", "第3章: 实战"]
    }

def research_topic(state):
    return {
        "references": ["Ref 1", "Ref 2", "Ref 3"]
    }

def write_content(state):
    return {
        "content": "这是生成的内容..."
    }

def compile_results(state):
    return {
        "content": f"{state['content']}\n\n参考文献: {', '.join(state['references'])}"
    }

graph = StateGraph(ParallelState)
graph.add_node("outline", generate_outline)
graph.add_node("research", research_topic)
graph.add_node("write", write_content)
graph.add_node("compile", compile_results)

graph.add_edge("__start__", "outline")
graph.add_edge("__start__", "research")
graph.add_edge("__start__", "write")

# 所有前置节点完成后执行 compile
graph.add_edge("outline", "compile")
graph.add_edge("research", "compile")
graph.add_edge("write", "compile")
graph.add_edge("compile", "__end__")
```

## 状态访问模式

### 在节点中读取状态

```python
def my_node(state):
    # 读取单个字段
    user_name = state["user_name"]
    
    # 读取多个字段
    messages = state["messages"]
    count = state.get("count", 0)
    
    # 安全获取可选字段
    preferences = state.get("preferences", {})
    
    return {"result": f"处理 {user_name} 的请求"}
```

### 在条件边中访问状态

```python
def route_decision(state) -> Literal["path_a", "path_b"]:
    # 基于状态做路由决策
    if len(state["messages"]) > 10:
        return "path_a"
    else:
        return "path_b"

def complex_route(state) -> Literal["continue", "escalate", "end"]:
    msg_count = len(state["messages"])
    error_rate = state.get("error_rate", 0)
    
    if error_rate > 0.5:
        return "escalate"
    elif msg_count > 20:
        return "end"
    else:
        return "continue"
```

## 状态验证与类型安全

### 使用 Pydantic 验证

```python
from pydantic import BaseModel, Field, validator

class AgentState(TypedDict):
    messages: Annotated[list, add_messages]
    user_id: str
    
    # 字段验证
    confidence: float = Field(ge=0, le=1)  # 0-1 之间
    status: str = Field(pattern="^(active|idle|error)$")  # 枚举
    
    @validator("confidence")
    def validate_confidence(cls, v):
        if v < 0 or v > 1:
            raise ValueError("Confidence must be between 0 and 1")
        return v
```

## 性能优化

### 状态序列化

```python
import json

def serialize_state(state):
    """序列化状态用于存储"""
    return json.dumps(state, default=str)

def deserialize_state(state_str):
    """从存储恢复状态"""
    return json.loads(state_str)

# 与检查点配合使用
from langgraph.checkpoint.postgres import PostgresSaver

checkpointer = PostgresSaver.from_conn_string("postgresql://user:pass@host/db")
checkpointer.setup()  # 初始化数据库表
```

### 状态剪裁

```python
def trim_messages(state):
    """限制消息历史长度"""
    messages = state["messages"]
    
    # 只保留最近 10 条消息
    trimmed = messages[-10:] if len(messages) > 10 else messages
    
    return {"messages": trimmed}
```

## 实战案例：多轮对话 Agent

```python
from typing import TypedDict, Annotated
from langgraph.graph import StateGraph, END, START, add_messages
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(model="gpt-4")

class ConversationAgentState(TypedDict):
    messages: Annotated[list, add_messages]
    session_id: str
    turn_count: Annotated[int, lambda x, y: x + y]
    user_intent: str | None
    context: dict

def extract_intent(state):
    """提取用户意图"""
    last_msg = state["messages"][-1].content
    # 简化意图识别
    if "help" in last_msg:
        intent = "help"
    elif "question" in last_msg:
        intent = "question"
    else:
        intent = "general"
    
    return {"user_intent": intent}

def route_intent(state) -> Literal["help_handler", "question_handler", "general_handler"]:
    return f"{state['user_intent']}_handler"

def help_handler(state):
    return {
        "messages": [AIMessage(content="我来帮你！请告诉我你需要什么帮助。")]
    }

def question_handler(state):
    response = llm.invoke(state["messages"])
    return {"messages": [response]}

def general_handler(state):
    response = llm.invoke(state["messages"])
    return {"messages": [response]}

def should_continue(state) -> Literal["continue", "__end__"]:
    last_msg = state["messages"][-1].content.lower()
    if any(word in last_msg for word in ["再见", "结束", "bye"]):
        return "__end__"
    return "continue"

graph = StateGraph(ConversationAgentState)
graph.add_node("extract_intent", extract_intent)
graph.add_node("help_handler", help_handler)
graph.add_node("question_handler", question_handler)
graph.add_node("general_handler", general_handler)

graph.add_edge(START, "extract_intent")
graph.add_conditional_edges(
    "extract_intent",
    route_intent,
    {
        "help_handler": "help_handler",
        "question_handler": "question_handler",
        "general_handler": "general_handler"
    }
)

graph.add_conditional_edges(
    "help_handler",
    should_continue,
    {"continue": "extract_intent", "__end__": END}
)
graph.add_conditional_edges(
    "question_handler",
    should_continue,
    {"continue": "extract_intent", "__end__": END}
)
graph.add_conditional_edges(
    "general_handler",
    should_continue,
    {"continue": "extract_intent", "__end__": END}
)

app = graph.compile()

# 运行
config = {"configurable": {"session_id": "user_001"}}
result = app.invoke({
    "messages": [{"role": "user", "content": "你好，我想了解一下 LangGraph"}],
    "session_id": "user_001",
    "turn_count": 0,
    "user_intent": None,
    "context": {}
}, config)

print(result["messages"][-1].content)
```

## 最佳实践

| 实践 | 说明 |
|------|------|
| **状态最小化** | 只保存必要的数据，减少内存占用 |
| **合理使用 Reducer** | 选择合适的 reducer 函数处理不同类型数据 |
| **状态验证** | 使用类型注解和验证器确保数据安全 |
| **定期清理** | 在适当节点清理不需要的历史数据 |
| **持久化策略** | 根据需求选择内存、数据库或分布式存储 |
| **错误恢复** | 设计容错机制，从检查点恢复状态 |

## 总结

本文深入探讨了 LangGraph 的状态管理机制：

- **State 定义**：使用 TypedDict 和 Annotated 定义复杂状态结构
- **Reducer 函数**：operator.add、extend、自定义函数等
- **工作流模式**：顺序、分支、循环、并行等多种模式
- **状态访问**：节点和条件边中安全访问状态
- **性能优化**：序列化、剪裁和持久化策略

掌握这些概念后，你将能够构建出功能强大、状态管理清晰 LangGraph 应用！💪
