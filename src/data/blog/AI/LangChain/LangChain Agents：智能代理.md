---
title: LangChain Agents：智能代理
author: Joekma
pubDatetime: 2026-05-11T00:00:00.000+08:00
modDatetime: 2026-05-11T00:00:00.000+08:00
slug: langchain-agents
description: '深入讲解LangChain v1.0的Agent模块，包括create_agent新API、工具定义和实战应用。'
tags:
  - LangChain
  - Agent
  - LLM
draft: false
series: LangChain
seriesOrder: 4
language: zh-CN
---

## 概述

Agent（智能代理）是 LangChain v1.0 的核心功能，它赋予 LLM 自主决策和执行任务的能力。v1.0 统一使用 `create_agent` API，基于 LangGraph 构建，提供更好的状态管理和持久化支持。

### Agent 工作原理

```
┌─────────────────────────────────────────────────────────────┐
│                    Agent 执行流程                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  用户输入 → 模型推理 → 是否调用工具？                        │
│                              │                               │
│              ┌───────────────┴───────────────┐             │
│              │                               │                │
│              ▼                               ▼                │
│         不调用工具                      调用工具             │
│         生成最终回答                   执行工具              │
│                                              │                │
│                                              ▼                │
│                                         获取结果              │
│                                              │                │
│                                              ▼                │
│                                      返回模型继续推理          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## create_agent 基础用法

### 最小示例

```python
from langchain.agents import create_agent
from langchain_openai import ChatOpenAI
from langchain_core.tools import tool

@tool
def get_weather(city: str) -> str:
    """获取指定城市的天气信息

    Args:
        city: 城市名称

    Returns:
        天气信息字符串
    """
    return f"{city}今天天气晴朗，温度25-30°C"

@tool
def calculate(expression: str) -> str:
    """执行数学计算

    Args:
        expression: 数学表达式，如 "2+3*5"

    Returns:
        计算结果
    """
    return str(eval(expression))

llm = ChatOpenAI(model="gpt-4o", temperature=0)

agent = create_agent(
    model=llm,
    tools=[get_weather, calculate],
    system_prompt="你是一个助手，可以访问一组工具来回答问题。"
)

result = agent.invoke({
    "messages": [{"role": "user", "content": "北京今天的天气怎么样？"}]
})
print(result["messages"][-1].content)
```

### 完整参数说明

| 参数 | 类型 | 说明 |
|------|------|------|
| **model** | LanguageModelLike | 语言模型实例 |
| **tools** | Sequence[BaseTool] | 可用工具列表 |
| **system_prompt** | str | 系统提示词 |
| **memory** | BaseMemory | 对话记忆（可选） |
| **pre_model_hook** | RunnableLike | 模型调用前钩子 |
| **post_model_hook** | RunnableLike | 模型调用后钩子 |

## 工具定义

### 使用 @tool 装饰器

```python
from langchain_core.tools import tool

@tool
def search_knowledge_base(query: str) -> str:
    """搜索知识库获取相关信息

    Args:
        query: 搜索关键词

    Returns:
        搜索结果
    """
    return f"关于'{query}'的搜索结果..."

@tool
def get_current_time() -> str:
    """获取当前时间

    Returns:
        当前时间的字符串表示
    """
    from datetime import datetime
    return datetime.now().strftime("%Y年%m月%d日 %H:%M:%S")

@tool
def send_notification(message: str, recipient: str) -> str:
    """发送通知消息

    Args:
        message: 通知内容
        recipient: 接收人

    Returns:
        发送状态
    """
    return f"通知已发送给{recipient}：{message}"

tools = [search_knowledge_base, get_current_time, send_notification]
```

### 使用 Pydantic Schema

```python
from langchain_core.tools import tool
from pydantic import BaseModel, Field

class WeatherInput(BaseModel):
    city: str = Field(description="城市名称")
    date: str = Field(description="日期，格式为 YYYY-MM-DD")

@tool(args_schema=WeatherInput)
def get_weather(city: str, date: str) -> str:
    """获取指定城市和日期的天气"""
    return f"{city}在{date}的天气：晴朗，25°C"
```

### 工具描述最佳实践

```python
@tool
def well_designed_tool(query: str) -> str:
    """清晰描述工具功能

    工具描述应该包含：
    - 工具用途
    - 输入参数说明
    - 返回值格式
    - 使用场景示例

    Args:
        query: 搜索查询词，用于检索相关信息

    Returns:
        搜索结果列表，每项包含标题和摘要
    """
    return f"结果：{query}"
```

## Agent 与 Memory

### 添加对话记忆

```python
from langchain.agents import create_agent
from langchain.memory import ConversationBufferMemory
from langchain_openai import ChatOpenAI
from langchain_core.tools import tool

memory = ConversationBufferMemory(
    memory_key="chat_history",
    return_messages=True
)

@tool
def get_weather(city: str) -> str:
    """获取城市天气"""
    return f"{city}今天晴天"

llm = ChatOpenAI(model="gpt-4o")

agent = create_agent(
    model=llm,
    tools=[get_weather],
    system_prompt="你是一个有帮助的助手。",
    memory=memory
)

result1 = agent.invoke({
    "messages": [{"role": "user", "content": "我叫张三"}]
})

result2 = agent.invoke({
    "messages": [{"role": "user", "content": "我叫什么名字？"}]
})

print(result2["messages"][-1].content)
```

## LangGraph 底层实现

对于需要更精细控制的场景，可以直接使用 LangGraph：

### 完整 ReAct Agent

```python
from langgraph.graph import StateGraph, START, END, MessagesState
from langgraph.prebuilt import ToolNode, tools_condition
from langchain_openai import ChatOpenAI
from langchain_core.tools import tool
from typing import Annotated
import operator

def add_messages(left: list, right: list) -> list:
    """合并消息列表"""
    return left + right

class AgentState(TypedDict):
    messages: Annotated[list, add_messages]

@tool
def search(query: str) -> str:
    """搜索网络获取信息"""
    return f"关于'{query}'的搜索结果..."

@tool
def calculator(expression: str) -> str:
    """执行数学计算"""
    return str(eval(expression))

tools = [search, calculator]
tool_node = ToolNode(tools)

model = ChatOpenAI(model="gpt-4o").bind_tools(tools)

def should_continue(state: AgentState):
    """根据最后一条消息决定下一步"""
    last_message = state["messages"][-1]
    if last_message.tool_calls:
        return "tools"
    return END

def call_model(state: AgentState):
    """调用模型生成回复"""
    messages = state["messages"]
    response = model.invoke(messages)
    return {"messages": [response]}

graph = StateGraph(AgentState)
graph.add_node("model", call_model)
graph.add_node("tools", tool_node)

graph.add_edge(START, "model")
graph.add_conditional_edges("model", should_continue)
graph.add_edge("tools", "model")

app = graph.compile()

result = app.invoke({
    "messages": [{"role": "user", "content": "计算 2+3*5"}]
})
print(result["messages"][-1].content)
```

### 自定义状态管理

```python
from typing import TypedDict, Annotated

class CustomAgentState(TypedDict):
    messages: Annotated[list, operator.add]
    context: str
    iterations: int
    final_result: str

def model_node(state: CustomAgentState):
    """自定义模型节点"""
    messages = state["messages"]
    response = model.invoke(messages)
    return {
        "messages": [response],
        "iterations": state.get("iterations", 0) + 1
    }
```

## 状态持久化

### 使用 Checkpointer

```python
from langgraph.checkpoint.memory import MemorySaver

checkpointer = MemorySaver()

agent = create_agent(
    model=llm,
    tools=tools,
    system_prompt="你是一个有帮助的助手。",
)

app = agent.compile(checkpointer=checkpointer)

config = {"configurable": {"thread_id": "user_123"}}

result = app.invoke(
    {"messages": [{"role": "user", "content": "你好"]},
    config=config
)

history = app.get_state(config)
print(history.values)
```

## 错误处理

### 工具错误处理

```python
@tool
def safe_tool(input_data: str) -> str:
    """带错误处理的工具"""
    try:
        result = risky_operation(input_data)
        return result
    except Exception as e:
        return f"错误: {str(e)}"
```

### 重试机制

```python
from langchain_core.runnables import RunnableConfig

config = RunnableConfig(
    recursion_limit=10,
    max_concurrency=5
)

result = app.invoke(
    {"messages": [{"role": "user", "content": "你好"}]},
    config=config
)
```

## 最佳实践

| 实践 | 说明 |
|------|------|
| **清晰的工具描述** | 工具描述要准确、简洁，包含参数说明 |
| **错误处理** | 为工具添加异常处理，避免程序崩溃 |
| **限制迭代次数** | 使用 recursion_limit 防止无限循环 |
| **使用 memory** | 对话场景使用 ConversationBufferMemory |
| **状态持久化** | 生产环境使用 checkpointer |

### 推荐代码结构

```python
from langchain.agents import create_agent
from langchain_openai import ChatOpenAI
from langchain_core.tools import tool

def create_assistant_agent():
    """创建助手 Agent 的工厂函数"""
    llm = ChatOpenAI(model="gpt-4o", temperature=0)
    
    tools = [
        get_weather,
        search_database,
        calculator,
    ]
    
    agent = create_agent(
        model=llm,
        tools=tools,
        system_prompt="""你是一个专业的助手。
        当需要信息时，使用工具获取。
        回答要简洁准确。"""
    )
    
    return agent

agent = create_assistant_agent()
result = agent.invoke({"messages": [{"role": "user", "content": "用户问题"}]})
```

## 总结

Agent 是 LangChain v1.0 最强大的功能：

| 组件 | 作用 |
|------|------|
| **create_agent** | 统一的 Agent 构建入口 |
| **@tool** | 定义可扩展的工具函数 |
| **Memory** | 维护对话历史 |
| **Checkpointer** | 状态持久化 |

掌握 Agent 开发，可以构建真正智能的 LLM 应用。