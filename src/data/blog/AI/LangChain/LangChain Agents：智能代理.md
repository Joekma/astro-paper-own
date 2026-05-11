---
title: LangChain Agents：智能代理
author: Joekma
pubDatetime: 2026-05-07T00:00:00.000+08:00
modDatetime: 2026-05-07T00:00:00.000+08:00
slug: langchain-agents
description: '深入讲解LangChain的Agent模块，包括代理类型、工具定义、推理模式和实战应用。'
tags:
  - LangChain
  - Agent
  - LLM
draft: false
series: LangChain
language: zh-CN
---

## 概述

Agent（智能代理）是 LangChain 中最强大的功能之一，它赋予了 LLM 自主决策和执行任务的能力。与简单的 Chain 不同，Agent 可以根据输入动态决定使用哪些工具，以及以什么顺序使用。

### Agent vs Chain

| 特性 | Chain | Agent |
|------|-------|-------|
| **执行方式** | 预定义流程 | 动态决策 |
| **工具使用** | 不支持 | 支持多工具 |
| **多步骤任务** | 固定步骤 | 循环直到完成 |
| **错误恢复** | 需手动处理 | 可自主调整 |
| **适用场景** | 简单任务 | 复杂任务 |

### Agent 工作原理

```
┌─────────────────────────────────────────────────────────────┐
│                        Agent 执行流程                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  用户输入 → 模型推理 → 选择工具 → 执行工具 → 获取结果 →     │
│                                                              │
│       ↑                                              ↓       │
│       └──── 结果评估 ← 决定下一步 ←─────────────────┘       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Agent 核心组件

### 四大核心组件

| 组件 | 说明 |
|------|------|
| **Agent** | 决策大脑，决定使用哪些工具 |
| **Tools** | 可执行的具体功能 |
| **Toolkits** | 工具集合 |
| **AgentExecutor** | 执行器，运行 Agent |

## 工具定义

### 使用 @tool 装饰器

```python
# 导入tool装饰器
from langchain_core.tools import tool

# 使用@tool装饰器定义工具函数
# 装饰器会自动提取函数签名和文档字符串作为工具定义
@tool
def get_weather(city: str) -> str:
    """获取指定城市的天气信息。

    Args:
        city: 城市名称，如"北京"、"上海"

    Returns:
        天气信息字符串
    """
    # 简单的模拟天气查询逻辑
    if "北京" in city:
        return f"{city}今天天气晴朗，温度25-30°C"
    elif "上海" in city:
        return f"{city}今天多云，温度23-28°C"
    else:
        return f"{city}天气信息暂不可用"

@tool
def calculate(expression: str) -> str:
    """执行数学计算。

    Args:
        expression: 数学表达式，如 "2+3*5"

    Returns:
        计算结果
    """
    try:
        result = eval(expression)
        return str(result)
    except:
        return "计算错误"

# 打印工具的名称和描述
print(get_weather.name)
print(get_weather.description)
```

### 使用 Tool 类

```python
# 导入tool装饰器
from langchain_core.tools import tool

# 定义搜索函数
def search_wikipedia(query: str) -> str:
    """搜索维基百科"""
    return f"关于'{query}'的信息..."

# 使用@tool装饰器包装函数
# 可以用于将已有的函数转换为工具
@tool
def search_wiki(query: str) -> str:
    """搜索维基百科获取信息。

    Args:
        query: 搜索关键词
    """
    return f"维基百科关于'{query}'的内容..."
```

### 常用预定义工具

```python
# 导入Wikipedia查询工具
from langchain_community.tools import WikipediaQueryRun
from langchain_community.utilities import WikipediaAPIWrapper

# 创建API包装器
api_wrapper = WikipediaAPIWrapper()

# 使用API包装器创建Wikipedia查询工具
wiki_tool = WikipediaQueryRun(api_wrapper=api_wrapper)

# 调用工具进行查询
result = wiki_tool.invoke({"query": "Python编程语言"})
```

## Agent 类型

### create_react_agent（新版本推荐方式）

根据描述选择工具，不维护会话状态：

```python
# 导入所需的组件
from langchain_core.tools import tool
from langchain_openai import ChatOpenAI
from langchain import create_react_agent
from langchain_core.messages import SystemMessage

# 创建LLM实例，temperature=0使输出更确定性
llm = ChatOpenAI(model="gpt-4", temperature=0)

# 定义工具函数
@tool
def get_weather(city: str) -> str:
    """获取城市天气"""
    return f"{city}今天晴天，25°C"

@tool
def calculate(expression: str) -> str:
    """数学计算"""
    return str(eval(expression))

# 注册工具列表
tools = [get_weather, calculate]

# 创建系统消息，定义Agent的角色和能力
system_prompt = SystemMessage(content="""你是一个助手，可以访问一组工具。
当需要信息时，使用工具获取。
回答要简洁准确。""")

# 创建ReAct Agent
# Agent会自主决定何时使用工具
agent = create_react_agent(
    llm,
    tools,
    state_system_message=system_prompt
)

# 调用Agent，传入消息列表
result = agent.invoke({"messages": ["北京今天的天气怎么样？"]})

# 提取最后一条消息（最终回答）
print(result["messages"][-1].content)
```

### create_conversational_retrieval_agent

维护对话历史的 Agent：

```python
# 导入所需的组件
from langchain_core.tools import tool
from langchain_openai import ChatOpenAI
from langchain import create_conversational_retrieval_agent

# 创建LLM实例
llm = ChatOpenAI(model="gpt-4")

# 定义工具
@tool
def search_knowledge_base(query: str) -> str:
    """搜索知识库获取信息"""
    return f"关于'{query}'的知识库内容..."

@tool
def get_calendar(event: str) -> str:
    """获取日历事件"""
    return f"日历事件: {event}"

# 注册工具列表
tools = [search_knowledge_base, get_calendar]

# 创建对话式检索Agent
# 这种Agent会维护对话历史，支持多轮对话
agent = create_conversational_retrieval_agent(
    llm,
    tools,
    verbose=True  # 启用详细输出，方便调试
)

# 第一轮对话：告诉Agent我的名字
result = agent.invoke({"input": "我叫张三"})

# 第二轮对话：询问Agent我的名字
# Agent会从对话历史中获取这个信息
result = agent.invoke({"input": "我叫什么名字？"})
```

### create_structured_chat_agent

使用结构化聊天：

```python
from langchain_core.tools import tool
from langchain_openai import ChatOpenAI
from langchain.agents import create_structured_chat_agent
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

llm = ChatOpenAI(model="gpt-4")

@tool
def get_date(days_offset: int = 0) -> str:
    """获取日期

    Args:
        days_offset: 相对于今天偏移的天数
    """
    from datetime import datetime, timedelta
    date = datetime.now() + timedelta(days=days_offset)
    return date.strftime("%Y年%m月%d日")

@tool
def calculate_days(from_date: str, to_date: str) -> str:
    """计算两个日期之间的天数"""
    from datetime import datetime
    d1 = datetime.strptime(from_date, "%Y年%m月%d日")
    d2 = datetime.strptime(to_date, "%Y年%m月%d日")
    return str((d2 - d1).days)

tools = [get_date, calculate_days]

prompt = ChatPromptTemplate.from_messages([
    ("system", """你是一个助手，可以访问一组工具。
    始终使用工具来回答用户的问题。"""),
    MessagesPlaceholder(variable_name="chat_history", optional=True),
    ("human", "{input}"),
    MessagesPlaceholder(variable_name="agent_scratchpad")
])

agent = create_structured_chat_agent(llm, tools, prompt)
```

## Agent Executor（新版本简化）

### 基础用法

```python
# 导入所需的组件
from langchain_core.tools import tool
from langchain_openai import ChatOpenAI
from langchain import create_react_agent

# 定义获取日期的工具
@tool
def get_date(days_offset: int = 0) -> str:
    """获取日期

    Args:
        days_offset: 相对于今天偏移的天数
    """
    from datetime import datetime, timedelta
    # 计算目标日期
    date = datetime.now() + timedelta(days=days_offset)
    return date.strftime("%Y年%m月%d日")

# 定义计算日期间隔的工具
@tool
def calculate_days(from_date: str, to_date: str) -> str:
    """计算两个日期之间的天数"""
    from datetime import datetime
    # 解析日期字符串
    d1 = datetime.strptime(from_date, "%Y年%m月%d日")
    d2 = datetime.strptime(to_date, "%Y年%m月%d日")
    # 计算天数差
    return str((d2 - d1).days)

# 创建LLM实例
llm = ChatOpenAI(model="gpt-4", temperature=0)

# 注册工具
tools = [get_date, calculate_days]

# 创建Agent
agent = create_react_agent(llm, tools)

# 调用Agent，它会自动调用工具来完成任务
result = agent.invoke({
    "messages": ["今天距离2024年春节(2024年2月10日)还有多少天？"]
})
```

### 配置参数

| 参数 | 说明 | 默认值 |
|------|------|--------|
| **max_iterations** | 最大迭代次数 | 15 |
| **return_intermediate_steps** | 返回中间步骤 | False |

```python
# 导入RunnableConfig用于配置Agent行为
from langchain_core.runnable import RunnableConfig

# 创建配置对象
config = RunnableConfig(
    recursion_limit=10,              # 限制最大递归/迭代次数
    configurable={"verbose": True}  # 启用详细输出
)

# 调用Agent并传入配置
result = agent.invoke(
    {"messages": ["你的问题"]},
    config=config
)
```

## 工具包 (Toolkit)

### 常用 Toolkits

```python
from langchain_core.tools import tool
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(model="gpt-4")

@tool
def calculator(expression: str) -> str:
    """执行数学计算"""
    try:
        result = eval(expression)
        return f"计算结果：{result}"
    except Exception as e:
        return f"计算错误：{str(e)}"

@tool
def date_query(command: str) -> str:
    """获取当前日期"""
    from datetime import datetime
    return datetime.now().strftime("%Y年%m月%d日")

tools = [calculator, date_query]
```

## 多 Agent 协作

### 协作模式

```python
from langchain_core.tools import tool
from langchain_openai import ChatOpenAI
from langchain import create_react_agent

llm = ChatOpenAI(model="gpt-4")

@tool
def search_research(query: str) -> str:
    """搜索研究资料"""
    return f"关于'{query}'的研究资料..."

@tool
def write_article(topic: str) -> str:
    """撰写文章"""
    return f"关于'{topic}'的文章内容..."

@tool
def review_content(content: str) -> str:
    """审核内容"""
    return f"审核意见：内容{len(content)}字，质量良好"

researcher_tools = [search_research]
writer_tools = [write_article]
reviewer_tools = [review_content]

researcher_agent = create_react_agent(llm, researcher_tools)
writer_agent = create_react_agent(llm, writer_tools)
reviewer_agent = create_react_agent(llm, reviewer_tools)

def multi_agent_collaboration(task: str):
    research = researcher_agent.invoke({"messages": [f"研究{task}"]})

    writing = writer_agent.invoke({
        "messages": [f"基于以下研究写一篇文章：{research['messages'][-1].content}"]
    })

    review = reviewer_agent.invoke({
        "messages": [f"审核以下内容：{writing['messages'][-1].content}"]
    })

    return review["messages"][-1].content
```

## 自定义 Agent（新版本）

### 使用 create_react_agent 自定义

```python
from langchain_core.tools import tool
from langchain_openai import ChatOpenAI
from langchain import create_react_agent
from langchain_core.prompts import ChatPromptTemplate, SystemMessage, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage

llm = ChatOpenAI(model="gpt-4")

@tool
def custom_tool(param: str) -> str:
    """自定义工具"""
    return f"处理结果: {param}"

tools = [custom_tool]

prompt = ChatPromptTemplate.from_messages([
    SystemMessage(content="""你是一个专业的助手。
    使用提供的工具来完成任务。
    每次只使用一个工具。"""),
    MessagesPlaceholder(variable_name="chat_history", optional=True),
    ("human", "{input}"),
    MessagesPlaceholder(variable_name="agent_scratchpad")
])

agent = create_react_agent(llm, tools, prompt)

result = agent.invoke({
    "input": "使用自定义工具处理'测试数据'",
    "chat_history": []
})
```

## 实战案例

### 智能助手 Agent

```python
from langchain_core.tools import tool
from langchain_openai import ChatOpenAI
from langchain import create_react_agent
from langchain_core.messages import SystemMessage

llm = ChatOpenAI(model="gpt-4", temperature=0)

@tool
def search_web(query: str) -> str:
    """搜索网络获取信息"""
    return f"搜索结果：关于'{query}'的最新信息..."

@tool
def get_time() -> str:
    """获取当前时间"""
    from datetime import datetime
    return f"现在是{datetime.now().strftime('%Y年%m月%d日 %H:%M')}"

@tool
def calculate(expression: str) -> str:
    """数学计算"""
    return str(eval(expression))

@tool
def send_email(to: str, content: str) -> str:
    """发送邮件"""
    return f"邮件已发送给{to}"

tools = [search_web, get_time, calculate, send_email]

system_message = SystemMessage(content="""你是一个智能助手，可以使用工具来回答问题。
可用工具：search_web, get_time, calculate, send_email""")

agent = create_react_agent(
    llm,
    tools,
    state_system_message=system_message
)

result = agent.invoke({
    "messages": ["帮我查一下今天北京的天气，然后在明天下午3点给老板发一封邮件告诉他"]
})

print(result["messages"][-1].content)
```

### 数据分析 Agent（新版本）

```python
from langchain_openai import ChatOpenAI
from langchain_experimental.agents import create_pandas_dataframe_agent
import pandas as pd

llm = ChatOpenAI(model="gpt-4", temperature=0)

df = pd.read_csv("sales_data.csv")

df_agent = create_pandas_dataframe_agent(
    llm,
    df,
    verbose=True,
    agent_type="openai-tools"
)

result = df_agent.invoke("绘制销售趋势图")
result = df_agent.invoke("找出销售额最高的前5个产品")
```

## 调试技巧

### 启用详细输出

```python
from langchain_core.runnable import RunnableConfig

config = RunnableConfig(
    configurable={"verbose": True}
)

result = agent.invoke(
    {"messages": ["你的问题"]},
    config=config
)

if "messages" in result:
    for msg in result["messages"]:
        print(f"{msg.type}: {msg.content}")
```

### 常见错误处理

```python
from langchain_core.runnable import RunnableConfig

config = RunnableConfig(
    recursion_limit=5
)

try:
    result = agent.invoke(
        {"messages": ["你的问题"]},
        config=config
    )
except Exception as e:
    print(f"遇到错误: {e}")
```

## 最佳实践

| 实践 | 说明 |
|------|------|
| **清晰的工具描述** | 工具描述要准确、简洁 |
| **错误处理** | 为工具添加异常处理 |
| **限制迭代次数** | 防止无限循环 |
| **使用适当的 Agent 类型** | 根据场景选择 |
| **记忆管理** | 对话场景使用带记忆的 Agent |

## 总结

Agent 是 LangChain 最强大的功能：

| 组件 | 作用 |
|------|------|
| **Tools** | 执行具体任务 |
| **Agent** | 决策选择工具 |
| **Executor** | 控制执行流程 |
| **Memory** | 维护对话历史 |

掌握 Agent 开发，可以构建真正智能的 LLM 应用。
