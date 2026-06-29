---
title: LangGraph 实战：构建智能代理
author: Joekma
pubDatetime: 2026-05-11T00:00:00.000+08:00
modDatetime: 2026-05-11T00:00:00.000+08:00
slug: langgraph-agent-pratice
description: "使用LangGraph构建完整的智能代理应用，包括工具调用、决策逻辑和多Agent协作。"
tags:
  - LangGraph
  - Agent
  - 实战
draft: false
series: LangGraph
seriesOrder: 3
language: zh-CN
---

## 概述

本文将通过实战项目展示如何使用 LangGraph 构建智能代理。我们将创建一个能够自主决策、使用工具并完成复杂任务的 Agent 系统。
实战里的关键不是让所有逻辑都塞进一个大函数，而是把“模型思考”“工具执行”“状态记录”“条件路由”拆成清晰节点。这样每一步都能单独观察，也更容易定位 Agent 为什么走到了某个分支。

### 项目目标

```
┌─────────────────────────────────────────────────────────────┐
│                    智能代理架构图                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   ┌─────────┐                                                │
│   │  用户   │                                                │
│   └────┬────┘                                                │
│        │                                                      │
│        ▼                                                      │
│   ┌─────────────────┐                                        │
│   │    Agent Core   │                                        │
│   └────────┬────────┘                                        │
│            │                                                  │
│     ┌──────┼──────┐                                         │
│     ▼      ▼      ▼                                         │
│  ┌────┐ ┌────┐ ┌────┐                                      │
│  │工具1│ │工具2│ │工具3│                                     │
│  └────┘ └────┘ └────┘                                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 环境配置

### 安装依赖

```bash
pip install langgraph langchain-openai langchain-community
```

## 定义工具

### 创建工具集

```python
from langchain_core.tools import tool
from langgraph.prebuilt import ToolNode, tools_condition
from langgraph.graph import StateGraph, START, END, MessagesState
from langchain_openai import ChatOpenAI
from typing import Literal

@tool
def search_knowledge_base(query: str) -> str:
    """搜索知识库获取相关信息"""
    knowledge = {
        "python": "Python是一门高级编程语言...",
        "java": "Java是一种面向对象编程语言...",
        "javascript": "JavaScript是一种脚本语言..."
    }
    for key, value in knowledge.items():
        if key in query.lower():
            return value
    return "未找到相关信息"

@tool
def calculate(a: float, b: float, operation: Literal["add", "subtract", "multiply", "divide"]) -> str:
    """执行受控的四则运算"""
    if operation == "add":
        return str(a + b)
    if operation == "subtract":
        return str(a - b)
    if operation == "multiply":
        return str(a * b)
    if operation == "divide":
        return "除数不能为 0" if b == 0 else str(a / b)
    return "未知操作"

@tool
def get_current_time() -> str:
    """获取当前时间"""
    from datetime import datetime
    return datetime.now().strftime("%Y年%m月%d日 %H:%M:%S")

@tool
def send_notification(message: str, recipient: str) -> str:
    """发送通知"""
    return f"通知已发送给{recipient}：{message}"

tools = [search_knowledge_base, calculate, get_current_time, send_notification]
```

工具函数的签名会影响模型如何生成工具调用参数。这里的计算工具使用明确的参数和操作枚举，避免让示例执行任意表达式。

## Agent 实现

### 基础 Agent 图

基础 Agent 图由两个核心节点组成：`model` 负责判断是否需要工具，`tools` 负责执行工具调用。`tools_condition` 会把模型输出路由到工具节点或结束。

```python
def create_agent_graph():
    graph = StateGraph(MessagesState)

    def call_model(state: MessagesState):
        messages = state["messages"]
        llm = ChatOpenAI(model="gpt-4o")
        llm_with_tools = llm.bind_tools(tools)
        response = llm_with_tools.invoke(messages)
        return {"messages": [response]}

    tool_node = ToolNode(tools)

    graph.add_node("model", call_model)
    graph.add_node("tools", tool_node)

    graph.add_edge(START, "model")
    graph.add_conditional_edges(
        "model",
        tools_condition,
    )
    graph.add_edge("tools", "model")

    return graph.compile()

agent = create_agent_graph()

result = agent.invoke({
    "messages": [{"role": "user", "content": "Python是什么编程语言？"}]
})
print(result["messages"][-1].content)
```

这段图会在“模型 -> 工具 -> 模型”之间循环，直到模型不再请求工具。循环边让工具结果回到模型，模型才能基于工具结果生成最终回答。

## 带状态的 Agent

### 自定义状态

自定义状态适合保存业务字段，例如上下文、迭代次数和最终结果。`iterations` 是循环保护字段，避免 Agent 在没有明确答案时无限自我调用。

```python
from typing import TypedDict, Annotated
import operator

class AgentState(TypedDict):
    messages: Annotated[list, operator.add]
    context: str
    iterations: int
    final_result: str

def create_advanced_agent():
    graph = StateGraph(AgentState)

    def model_node(state: AgentState):
        messages = state["messages"]
        context = state.get("context", "")
        iterations = state.get("iterations", 0)

        if context:
            prompt = f"上下文：{context}\n\n用户：{messages[-1].content}"
        else:
            prompt = messages[-1].content

        llm = ChatOpenAI(model="gpt-4o")
        response = llm.invoke([{"role": "user", "content": prompt}])

        return {
            "messages": [response],
            "iterations": iterations + 1
        }

    def should_continue(state: AgentState):
        if state["iterations"] >= 3:
            return "end"
        last_message = state["messages"][-1]
        if hasattr(last_message, "content"):
            if "完成" in last_message.content or "结束" in last_message.content:
                return "end"
        return "continue"

    graph.add_node("model", model_node)
    graph.add_edge(START, "model")
    graph.add_conditional_edges("model", should_continue, {"continue": "model", "end": END})

    return graph.compile()

agent = create_advanced_agent()
```

## 多工具协调

### 复杂任务处理

```python
from typing import Literal

def create_coordinator_agent():
    class CoordinatorState(TypedDict):
        messages: list
        current_task: str
        completed_tasks: list
        results: dict

    graph = StateGraph(CoordinatorState)

    def analyze_task(state: CoordinatorState):
        task = state["current_task"]
        return {"completed_tasks": state.get("completed_tasks", []) + [task]}

    def route_task(state: CoordinatorState) -> Literal["calculator", "searcher", "time_checker", "model"]:
        task = state["current_task"]
        if "计算" in task:
            return "calculator"
        elif "搜索" in task:
            return "searcher"
        elif "时间" in task:
            return "time_checker"
        return "model"

    def calculator_node(state: CoordinatorState):
        result = 10 + 20
        return {"results": {**state.get("results", {}), "calc": result}}

    graph.add_node("analyzer", analyze_task)
    graph.add_node("calculator", calculator_node)
    graph.add_node("searcher", lambda s: {"results": {**s.get("results", {}), "search": "搜索结果"}})
    graph.add_node("time_checker", lambda s: {"results": {**s.get("results", {}), "time": "当前时间"}})
    graph.add_node("model", lambda s: {"messages": s["messages"]})

    graph.add_edge(START, "analyzer")
    graph.add_conditional_edges("analyzer", route_task)
    graph.add_edge("calculator", END)
    graph.add_edge("searcher", END)
    graph.add_edge("time_checker", END)
    graph.add_edge("model", END)

    return graph.compile()

agent = create_coordinator_agent()
```

协调型 Agent 的重点是先识别任务类型，再把任务交给专门节点。条件路由返回的字符串必须和节点名一致，或者通过映射表转换。

## 带记忆的 Agent

### 持久化对话

```python
from langgraph.checkpoint.memory import InMemorySaver

def create_memory_agent():
    memory = InMemorySaver()

    graph = StateGraph(MessagesState)

    def call_model(state: MessagesState):
        messages = state["messages"]
        llm = ChatOpenAI(model="gpt-4o")
        response = llm.invoke(messages)
        return {"messages": [response]}

    graph.add_node("model", call_model)
    graph.add_edge(START, "model")

    return graph.compile(checkpointer=memory)

agent = create_memory_agent()
config = {"configurable": {"thread_id": "user_123"}}

result1 = agent.invoke(
    {"messages": [{"role": "user", "content": "我叫张三"}]},
    config=config
)

result2 = agent.invoke(
    {"messages": [{"role": "user", "content": "我叫什么名字？"}]},
    config=config
)
```

同一个 `thread_id` 会让后续调用读取同一条会话历史。示例使用内存型 checkpointer 方便演示，服务重启后仍要保留状态时应换成数据库持久化。

## 决策 Agent

### 条件路由

当规则足够明确时，可以先用普通函数完成决策，再把 LLM 放到需要语言理解或生成的节点里。这样能降低成本，也让路由逻辑更可预测。

```python
from typing import Literal

def create_decision_agent():
    class DecisionState(TypedDict):
        user_input: str
        decision: str
        result: str

    graph = StateGraph(DecisionState)

    def make_decision(state: DecisionState):
        user_input = state["user_input"]

        if "天气" in user_input:
            decision = "weather"
            result = "今天天气晴朗"
        elif "新闻" in user_input:
            decision = "news"
            result = "今日新闻摘要..."
        elif any(word in user_input for word in ["计算", "数学"]):
            decision = "calculation"
            result = "计算完成"
        else:
            decision = "general"
            result = "这是通用响应"

        return {"decision": decision, "result": result}

    graph.add_node("decision_maker", make_decision)
    graph.add_edge(START, "decision_maker")

    return graph.compile()

agent = create_decision_agent()
result = agent.invoke({"user_input": "今天天气怎么样？", "decision": "", "result": ""})
print(result["result"])
```

## 实际应用

### 研究助手 Agent

```python
from typing import Literal

def create_research_agent():
    class ResearchState(TypedDict):
        topic: str
        research_steps: list
        findings: list
        final_report: str

    graph = StateGraph(ResearchState)

    def research_step(state: ResearchState):
        topic = state["topic"]
        findings = state.get("findings", [])

        new_finding = f"关于'{topic}'的研究发现..."
        return {"findings": findings + [new_finding]}

    def compile_report(state: ResearchState):
        findings = state.get("findings", [])
        report = "\n".join(findings)
        return {"final_report": report}

    def should_continue(state: ResearchState) -> Literal["research", "compile"]:
        if len(state.get("findings", [])) >= 3:
            return "compile"
        return "research"

    graph.add_node("research", research_step)
    graph.add_node("compile", compile_report)

    graph.add_edge(START, "research")
    graph.add_conditional_edges("research", should_continue, {"research": "research", "compile": "compile"})
    graph.add_edge("compile", END)

    return graph.compile()

agent = create_research_agent()
result = agent.invoke({"topic": "人工智能", "research_steps": [], "findings": [], "final_report": ""})
print(result["final_report"])
```

这里的 `compile` 分支必须先进入 `compile` 节点，再连接到 `END`。如果直接把 `"compile"` 映射到 `END`，报告生成节点就不会执行。

## 最佳实践

### 1. 工具设计原则

```python
@tool
def well_designed_tool(query: str) -> str:
    """清晰描述工具功能

    Args:
        query: 搜索查询词

    Returns:
        搜索结果
    """
    return f"结果：{query}"
```

### 2. 错误处理

```python
def safe_tool_call(func, *args, **kwargs):
    try:
        return func(*args, **kwargs)
    except Exception as e:
        return f"错误：{str(e)}"
```

### 3. 状态管理

```python
class OptimizedState(TypedDict):
    messages: Annotated[list, operator.add]
    metadata: dict

def get_recent_messages(state: OptimizedState, n: int = 5):
    return state["messages"][-n:]
```

## 总结

本文实现的智能代理特性：

| 特性           | 实现方式                            |
| -------------- | ----------------------------------- |
| **工具调用**   | ToolNode + tools_condition          |
| **状态管理**   | TypedDict 自定义状态                |
| **记忆持久化** | InMemorySaver / 持久化 checkpointer |
| **条件路由**   | add_conditional_edges               |
| **多步骤处理** | 循环 + 状态更新                     |

LangGraph 的图结构让构建复杂的 Agent 系统变得直观和可控。
