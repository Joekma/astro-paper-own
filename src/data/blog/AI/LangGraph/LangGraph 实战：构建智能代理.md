---
title: LangGraph 实战：构建智能代理
author: Joekma
pubDatetime: 2026-05-08T00:00:00.000+08:00
modDatetime: 2026-05-08T00:00:00.000+08:00
slug: langgraph-agent-practical
description: '使用LangGraph构建智能代理，包括ReAct代理、工具调用、多代理协作等实战案例。'
tags:
  - LangGraph
  - LLM
  - AI
  - Agent
  - Tool Calling
draft: false
language: zh-CN
---

## 概述

智能代理（Agent）是当前 AI 应用最热门的话题之一。LangGraph 提供了强大的工具支持，让你能够构建具有推理能力、工具调用能力和多步骤执行能力的智能代理。本文将通过实战案例，展示如何使用 LangGraph 构建各种类型的 AI 代理。

## ReAct 代理

### 什么是 ReAct？

ReAct（Reason + Act）是一种结合推理和行动的代理框架，让模型能够：
- **Reason**：分析当前情况，进行推理
- **Act**：决定采取什么行动
- **Observe**：观察行动结果
- **Reflect**：反思结果，调整策略

### ReAct 工作流程

```
┌─────────────────────────────────────────────────────────┐
│                   ReAct Loop                            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────┐                                          │
│  │  Think   │                                          │
│  └────┬─────┘                                          │
│       │                                                │
│       ▼                                                │
│  ┌──────────┐                                          │
│  │   Act    │◀─────────────┐                          │
│  └────┬─────┘              │                           │
│       │                    │                           │
│       ▼                    │                           │
│  ┌──────────┐              │                           │
│  │ Observe  │──────────────┘                           │
│  └────┬─────┘              │                           │
│       │                    │                           │
│       ▼                    │ loop until done          │
│  ┌──────────┐              │                           │
│  │ Finish?  │──────────────┘                           │
│  └──────────┘                                          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 实现 ReAct 代理

```python
from typing import TypedDict, Annotated, Literal
from langgraph.graph import StateGraph, END, START, add_messages
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage

llm = ChatOpenAI(model="gpt-4")

class ReActState(TypedDict):
    messages: Annotated[list, add_messages]
    reasoning: str
    action: str | None
    observation: str | None
    step_count: int

def reason_node(state):
    """推理节点：分析当前情况"""
    messages = state["messages"]
    last_msg = messages[-1].content
    
    reasoning_prompt = f"""分析用户请求：{last_msg}
    
当前状态：
- 步骤数：{state['step_count']}
- 上一步行动：{state.get('action', '无')}
- 上一步结果：{state.get('observation', '无')}

请分析：
1. 用户真正想要什么？
2. 是否需要调用工具？
3. 如果需要，应该调用什么工具？
4. 如果不需要，如何直接回答？"""
    
    response = llm.invoke([
        SystemMessage(content=reasoning_prompt),
        HumanMessage(content="请进行推理分析")
    ])
    
    return {"reasoning": response.content}

def act_node(state):
    """行动节点：根据推理决定行动"""
    reasoning = state["reasoning"].lower()
    
    # 根据推理结果决定行动
    if "需要搜索" in reasoning or "search" in reasoning:
        action = "search"
    elif "需要计算" in reasoning or "calculate" in reasoning:
        action = "calculate"
    elif "需要查询天气" in reasoning or "weather" in reasoning:
        action = "weather"
    else:
        action = "respond"
    
    return {"action": action, "step_count": state["step_count"] + 1}

def execute_action(state):
    """执行行动节点"""
    action = state["action"]
    
    if action == "search":
        observation = "搜索结果：[关于 LangGraph 的相关信息...]"
    elif action == "calculate":
        observation = "计算结果：42"
    elif action == "weather":
        observation = "天气：晴，25度"
    else:
        observation = ""
    
    return {"observation": observation}

def should_continue(state) -> Literal["reason", "respond"]:
    """判断是否继续推理"""
    if state["step_count"] >= 3:
        return "respond"
    if not state.get("observation"):
        return "reason"
    
    reasoning = state["reasoning"].lower()
    if "完成" in reasoning or "完成" in state["observation"]:
        return "respond"
    
    return "reason"

def respond_node(state):
    """生成最终响应"""
    response_prompt = f"""基于以下信息生成最终回复：

用户请求：{state['messages'][0].content}
推理过程：{state['reasoning']}
行动结果：{state.get('observation', '无')}

请生成一个完整、有帮助的回答。"""
    
    response = llm.invoke([HumanMessage(content=response_prompt)])
    
    return {"messages": [response]}

# 构建图
graph = StateGraph(ReActState)
graph.add_node("reason", reason_node)
graph.add_node("act", act_node)
graph.add_node("execute", execute_action)
graph.add_node("respond", respond_node)

graph.add_edge(START, "reason")
graph.add_edge("reason", "act")
graph.add_edge("act", "execute")
graph.add_edge("execute", "reason")
graph.add_conditional_edges(
    "reason",
    should_continue,
    {"reason": "act", "respond": "respond"}
)
graph.add_edge("respond", END)

app = graph.compile()

# 测试
result = app.invoke({
    "messages": [HumanMessage(content="LangGraph 是什么？")],
    "reasoning": "",
    "action": None,
    "observation": None,
    "step_count": 0
})

print(result["messages"][-1].content)
```

## 工具调用代理

### 定义工具

```python
from langchain_core.tools import tool
from langchain_community.utilities import SerpAPIWrapper
from langchain_community.tools import DuckDuckGoSearchRun

# 搜索工具
search = DuckDuckGoSearchRun()

@tool
def web_search(query: str) -> str:
    """搜索网络信息
    
    Args:
        query: 搜索查询字符串
        
    Returns:
        搜索结果摘要
    """
    try:
        results = search.run(query)
        return f"搜索结果：{results[:500]}"
    except Exception as e:
        return f"搜索失败：{str(e)}"

@tool
def calculator(expression: str) -> str:
    """执行数学计算
    
    Args:
        expression: 数学表达式，如 "2+2" 或 "sqrt(16)"
        
    Returns:
        计算结果
    """
    try:
        result = eval(expression)
        return f"计算结果：{result}"
    except Exception as e:
        return f"计算错误：{str(e)}"

@tool
def get_weather(city: str) -> str:
    """获取城市天气信息
    
    Args:
        city: 城市名称
        
    Returns:
        天气情况描述
    """
    weathers = {
        "北京": "北京：晴，25°C，适宜出行",
        "上海": "上海：多云，23°C，适宜出行",
        "广州": "广州：雷阵雨，28°C，记得带伞",
        "深圳": "深圳：晴，29°C，适宜出行"
    }
    return weathers.get(city, f"抱歉，暂不支持查询{city}的天气")

# 工具列表
tools = [web_search, calculator, get_weather]
```

### 工具调用代理实现

```python
from typing import TypedDict, Annotated, Literal
from langgraph.graph import StateGraph, END, START, add_messages
from langchain_core.utils.function_calling import convert_to_openai_function
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(model="gpt-4")
tool_schemas = [convert_to_openai_function(tool) for tool in tools]

class ToolAgentState(TypedDict):
    messages: Annotated[list, add_messages]
    tool_calls: list
    tool_results: list
    current_step: int

def chat_with_tools(state):
    """带工具调用的聊天"""
    messages = state["messages"]
    
    # 绑定工具的 LLM
    llm_with_tools = llm.bind_functions(tools)
    
    # 调用
    response = llm_with_tools.invoke(messages)
    
    return {"messages": [response], "tool_calls": [], "tool_results": []}

def execute_tools(state):
    """执行工具调用"""
    messages = state["messages"]
    last_message = messages[-1]
    
    results = []
    
    # 检查是否有工具调用
    if hasattr(last_message, 'additional_kwargs') and 'function_call' in last_message.additional_kwargs:
        function_call = last_message.additional_kwargs['function_call']
        func_name = function_call['name']
        func_args = json.loads(function_call['arguments'])
        
        # 找到对应的工具
        for tool in tools:
            if tool.name == func_name:
                result = tool.invoke(func_args)
                results.append({"tool": func_name, "result": result})
    
    return {"tool_results": results, "current_step": state["current_step"] + 1}

def should_continue(state) -> Literal["chat", "__end__"]:
    """判断是否需要继续或结束"""
    last_message = state["messages"][-1]
    
    # 如果消息包含工具调用，需要执行
    if hasattr(last_message, 'additional_kwargs'):
        if 'function_call' in last_message.additional_kwargs:
            return "chat"
    
    # 如果有工具结果，添加到消息中继续
    if state.get("tool_results"):
        return "chat"
    
    return "__end__"

def process_results(state):
    """处理工具结果并继续对话"""
    tool_results = state["tool_results"]
    
    # 将工具结果添加到消息中
    result_messages = []
    for tr in tool_results:
        result_messages.append(
            HumanMessage(content=f"工具 {tr['tool']} 返回：{tr['result']}")
        )
    
    return {"messages": result_messages}

graph = StateGraph(ToolAgentState)
graph.add_node("chat", chat_with_tools)
graph.add_node("execute", execute_tools)
graph.add_node("process", process_results)

graph.add_edge(START, "chat")
graph.add_conditional_edges(
    "chat",
    should_continue,
    {"chat": "execute", "__end__": END}
)
graph.add_edge("execute", "process")
graph.add_edge("process", "chat")

app = graph.compile()

# 测试
result = app.invoke({
    "messages": [HumanMessage(content="北京今天的天气怎么样？")],
    "tool_calls": [],
    "tool_results": [],
    "current_step": 0
})

print(result["messages"][-1].content)
```

## 多代理协作

### 代理编排器模式

```python
from typing import TypedDict, Annotated, Literal
from langgraph.graph import StateGraph, END, START, add_messages

class MultiAgentState(TypedDict):
    messages: Annotated[list, add_messages]
    task: str
    researcher_result: str | None
    writer_result: str | None
    critic_result: str | None
    current_agent: str

def coordinator(state):
    """协调者：分析任务并分配"""
    task = state["messages"][-1].content
    
    # 分析任务类型
    if "研究" in task or "分析" in task:
        return {"current_agent": "researcher", "task": task}
    elif "写作" in task or "写" in task or "创作" in task:
        return {"current_agent": "writer", "task": task}
    elif "评估" in task or "审查" in task:
        return {"current_agent": "critic", "task": task}
    else:
        return {"current_agent": "general", "task": task}

def researcher_agent(state):
    """研究代理：收集和分析信息"""
    task = state["task"]
    
    research_prompt = f"""作为研究员，请深入研究以下主题：
    
主题：{task}

请提供：
1. 核心概念解释
2. 关键技术和方法
3. 实际应用案例
4. 相关资源和参考

请用结构化的方式呈现你的研究成果。"""
    
    response = llm.invoke([HumanMessage(content=research_prompt)])
    
    return {"researcher_result": response.content}

def writer_agent(state):
    """写作代理：创作内容"""
    task = state["task"]
    research = state.get("researcher_result", "")
    
    writer_prompt = f"""作为专业作家，请基于以下研究撰写内容：
    
主题：{task}
研究材料：{research}

要求：
1. 文章结构清晰
2. 语言生动易懂
3. 包含实际例子
4. 适当使用图表说明"""
    
    response = llm.invoke([HumanMessage(content=writer_prompt)])
    
    return {"writer_result": response.content}

def critic_agent(state):
    """评论代理：评估和建议"""
    task = state["task"]
    content = state.get("writer_result", "")
    
    critic_prompt = f"""作为评论家，请评估以下内容：
    
任务：{task}
内容：{content}

请从以下角度评估：
1. 准确性
2. 完整性
3. 逻辑性
4. 可读性

提供具体的改进建议。"""
    
    response = llm.invoke([HumanMessage(content=critic_prompt)])
    
    return {"critic_result": response.content}

def route_to_agent(state) -> Literal["researcher", "writer", "critic", "general"]:
    return state["current_agent"]

def finalize(state):
    """整合所有结果"""
    task = state["task"]
    research = state.get("researcher_result", "")
    writing = state.get("writer_result", "")
    critique = state.get("critic_result", "")
    
    final_prompt = f"""请整合以下内容，生成最终报告：

任务：{task}

研究结果：
{research}

写作内容：
{writing}

评论意见：
{critique}

请生成一份完整、专业的研究报告。"""
    
    response = llm.invoke([HumanMessage(content=final_prompt)])
    
    return {"messages": [response]}

graph = StateGraph(MultiAgentState)
graph.add_node("coordinator", coordinator)
graph.add_node("researcher", researcher_agent)
graph.add_node("writer", writer_agent)
graph.add_node("critic", critic_agent)
graph.add_node("finalize", finalize)

graph.add_edge(START, "coordinator")
graph.add_conditional_edges(
    "coordinator",
    route_to_agent,
    {
        "researcher": "researcher",
        "writer": "writer",
        "critic": "critic",
        "general": "finalize"
    }
)

# 所有代理都通向 finalize
graph.add_edge("researcher", "finalize")
graph.add_edge("writer", "finalize")
graph.add_edge("critic", "finalize")
graph.add_edge("finalize", END)

app = graph.compile()

# 测试
result = app.invoke({
    "messages": [HumanMessage(content="研究并撰写一篇关于 LangGraph 的技术文章")],
    "task": "",
    "researcher_result": None,
    "writer_result": None,
    "critic_result": None,
    "current_agent": ""
})

print(result["messages"][-1].content)
```

## 对话式助手代理

### 带记忆的对话代理

```python
from typing import TypedDict, Annotated, Literal
from langgraph.graph import StateGraph, END, START, add_messages
from langgraph.checkpoint.memory import MemorySaver

class ConversationalAgentState(TypedDict):
    messages: Annotated[list, add_messages]
    user_name: str | None
    preferences: dict
    session_context: list
    turn_count: int

def greeting(state):
    """问候节点"""
    if not state["user_name"]:
        return {"messages": [AIMessage(content="你好！很高兴见到你。我叫什么名字呢？")]}
    return {"messages": [AIMessage(content=f"欢迎回来，{state['user_name']}！有什么我可以帮你的？")]}

def extract_info(state):
    """提取用户信息"""
    messages = state["messages"]
    last_msg = messages[-1].content.lower()
    
    updates = {}
    
    # 提取名字
    if "我叫" in last_msg or "名字是" in last_msg:
        import re
        match = re.search(r"(?:我叫|名字是)\s*(\w+)", last_msg)
        if match:
            updates["user_name"] = match.group(1)
    
    # 更新计数
    updates["turn_count"] = state["turn_count"] + 1
    
    return updates

def chat(state):
    """主对话节点"""
    messages = state["messages"]
    
    system_prompt = f"""你是一个友好、有帮助的 AI 助手。
用户信息：
- 名字：{state.get('user_name', '未知')}
- 对话轮次：{state['turn_count']}
- 偏好：{state.get('preferences', {})}

请基于以上信息，提供个性化的回复。"""
    
    response = llm.invoke([
        SystemMessage(content=system_prompt),
        *messages
    ])
    
    return {"messages": [response]}

def should_extract_info(state) -> Literal["extract", "chat"]:
    """判断是否需要提取信息"""
    if state["turn_count"] == 0:
        return "extract"
    return "chat"

def should_continue_chat(state) -> Literal["continue", "__end__"]:
    """判断是否继续对话"""
    last_msg = state["messages"][-1].content.lower()
    
    if any(word in last_msg for word in ["再见", "拜拜", "结束", "bye", "退出"]):
        return "__end__"
    
    return "continue"

checkpointer = MemorySaver()
graph = StateGraph(ConversationalAgentState)
graph.add_node("greeting", greeting)
graph.add_node("extract", extract_info)
graph.add_node("chat", chat)

graph.add_edge(START, "greeting")
graph.add_edge("greeting", "extract")
graph.add_conditional_edges(
    "extract",
    should_extract_info,
    {"extract": "extract", "chat": "chat"}
)
graph.add_conditional_edges(
    "chat",
    should_continue_chat,
    {"continue": "extract", "__end__": END}
)

app = graph.compile(checkpointer=checkpointer)

# 多轮对话
config = {"configurable": {"thread_id": "user_session_001"}}

# 第一轮
result = app.invoke({
    "messages": [HumanMessage(content="你好")],
    "user_name": None,
    "preferences": {},
    "session_context": [],
    "turn_count": 0
}, config)

print("第一轮回复：", result["messages"][-1].content)

# 第二轮
result = app.invoke({
    "messages": [HumanMessage(content="我叫张三")],
    "user_name": result.get("user_name"),
    "preferences": result.get("preferences", {}),
    "session_context": result.get("session_context", []),
    "turn_count": result.get("turn_count", 0)
}, config)

print("第二轮回复：", result["messages"][-1].content)
```

## RAG 代理

### 检索增强生成代理

```python
from typing import TypedDict, Annotated, Literal
from langgraph.graph import StateGraph, END, START, add_messages
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import Chroma

class RAGAgentState(TypedDict):
    messages: Annotated[list, add_messages]
    query: str
    retrieved_docs: list
    context: str
    needs_more_info: bool

# 模拟向量数据库
def setup_vectorstore():
    """设置向量存储"""
    embeddings = OpenAIEmbeddings()
    
    # 文档内容
    docs = [
        "LangGraph 是一个用于构建有状态 AI 应用的库",
        "它支持循环计算和状态管理",
        "LangGraph 可以用于构建复杂的 Agent 工作流",
        "它与 LangChain 深度集成"
    ]
    
    # 创建向量存储
    vectorstore = Chroma.from_texts(docs, embeddings, metadatas=[{"source": i} for i in range(len(docs))])
    
    return vectorstore

vectorstore = setup_vectorstore()

def retrieve_docs(state):
    """检索相关文档"""
    query = state["messages"][-1].content
    
    # 执行相似性搜索
    docs = vectorstore.similarity_search(query, k=3)
    
    return {
        "retrieved_docs": [doc.page_content for doc in docs],
        "query": query
    }

def generate_context(state):
    """生成上下文"""
    docs = state["retrieved_docs"]
    
    context = "\n\n".join([f"文档{i+1}：{doc}" for i, doc in enumerate(docs)])
    
    return {"context": context}

def answer_question(state):
    """基于上下文回答问题"""
    context = state["context"]
    query = state["query"]
    
    prompt = f"""基于以下上下文信息，回答用户的问题。如果上下文中没有相关信息，请如实说明。

上下文：
{context}

问题：{query}

回答："""
    
    response = llm.invoke([HumanMessage(content=prompt)])
    
    return {"messages": [response]}

def check_understanding(state):
    """检查是否需要更多信息"""
    # 简化逻辑：检查检索结果是否足够
    if len(state["retrieved_docs"]) < 2:
        return {"needs_more_info": True}
    return {"needs_more_info": False}

def clarify_if_needed(state):
    """如需要则澄清"""
    return {
        "messages": [AIMessage(content="抱歉，我需要更多信息来准确回答您的问题。请问您能提供更多细节吗？")]
    }

def route_after_check(state) -> Literal["answer", "clarify"]:
    return "clarify" if state["needs_more_info"] else "answer"

graph = StateGraph(RAGAgentState)
graph.add_node("retrieve", retrieve_docs)
graph.add_node("generate_context", generate_context)
graph.add_node("check", check_understanding)
graph.add_node("answer", answer_question)
graph.add_node("clarify", clarify_if_needed)

graph.add_edge(START, "retrieve")
graph.add_edge("retrieve", "generate_context")
graph.add_edge("generate_context", "check")
graph.add_conditional_edges(
    "check",
    route_after_check,
    {"answer": "answer", "clarify": "clarify"}
)
graph.add_edge("answer", END)
graph.add_edge("clarify", END)

app = graph.compile()

# 测试
result = app.invoke({
    "messages": [HumanMessage(content="LangGraph 是什么？")],
    "query": "",
    "retrieved_docs": [],
    "context": "",
    "needs_more_info": False
})

print(result["messages"][-1].content)
```

## 代理监控与调试

### 添加监控节点

```python
from datetime import datetime

def monitor_node(state):
    """监控节点：记录执行状态"""
    print(f"[{datetime.now()}] 执行监控")
    print(f"当前状态：{state}")
    
    return {}  # 不修改状态

def error_handler(state):
    """错误处理节点"""
    print(f"捕获错误，当前状态：{state}")
    
    return {
        "messages": [AIMessage(content="抱歉，发生了错误。请稍后重试。")]
    }

# 在关键位置添加监控
graph.add_node("monitor", monitor_node)
graph.add_node("error_handler", error_handler)

# 添加监控边
graph.add_edge("start_node", "monitor")
```

## 最佳实践

| 实践 | 说明 |
|------|------|
| **清晰的代理职责** | 每个代理应该有明确、单一的职责 |
| **合理的工具设计** | 工具应该小而专注，易于组合 |
| **错误处理机制** | 始终准备降级方案和错误处理 |
| **状态管理** | 合理管理对话历史和上下文 |
| **性能优化** | 避免不必要的 LLM 调用 |
| **可观测性** | 添加日志和监控，便于调试 |

## 总结

本文通过多个实战案例展示了 LangGraph 构建智能代理的能力：

- **ReAct 代理**：推理与行动结合的代理模式
- **工具调用代理**：集成外部工具的代理
- **多代理协作**：多个代理协同工作
- **对话代理**：带记忆的对话系统
- **RAG 代理**：检索增强生成代理

掌握这些模式后，你将能够构建功能强大的 AI 应用！🚀
