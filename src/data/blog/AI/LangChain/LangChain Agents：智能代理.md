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
from langchain.agents import tool

@tool
def get_weather(city: str) -> str:
    """获取指定城市的天气信息。

    Args:
        city: 城市名称，如"北京"、"上海"

    Returns:
        天气信息字符串
    """
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

# 查看工具信息
print(get_weather.name)  # get_weather
print(get_weather.description)
print(get_weather.args)
```

### 使用 Tool 类

```python
from langchain.agents import Tool
from langchain_core.tools import tool

# 方式1：函数定义
def search_wikipedia(query: str) -> str:
    """搜索维基百科"""
    return f"关于'{query}'的信息..."

search_tool = Tool(
    name="wikipedia_search",
    func=search_wikipedia,
    description="搜索维基百科获取信息。输入应该是搜索关键词。"
)

# 方式2：使用 @tool 装饰器（推荐）
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
from langchain_community.tools import WikipediaQueryRun
from langchain_community.utilities import WikipediaAPIWrapper

# 维基百科搜索
api_wrapper = WikipediaAPIWrapper()
wiki_tool = WikipediaQueryRun(api_wrapper=api_wrapper)

# 使用
result = wiki_tool.invoke({"query": "Python编程语言"})
```

## Agent 类型

### ZeroShotReAct

根据描述选择工具，不维护会话状态：

```python
from langchain.agents import Agent, tool
from langchain.agents.agent_types import AgentType
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(model="gpt-4", temperature=0)

@tool
def get_weather(city: str) -> str:
    """获取城市天气"""
    return f"{city}今天晴天，25°C"

@tool
def calculate(expression: str) -> str:
    """数学计算"""
    return str(eval(expression))

tools = [get_weather, calculate]

# 创建 Agent
agent = Agent.from_agent_type(
    agent_type=AgentType.ZERO_SHOT_REACT_DESCRIPTION,
    llm=llm,
    tools=tools,
    verbose=True
)

# 运行
result = agent.invoke("北京今天的天气怎么样？")
print(result)
```

### Conversational

维护对话历史的 Agent：

```python
from langchain.agents import ConversationalChatAgent
from langchain.memory import ConversationBufferMemory

# 创建记忆
memory = ConversationBufferMemory(
    memory_key="chat_history",
    return_messages=True
)

# 创建 Agent
agent = ConversationalChatAgent.from_llm_and_tools(
    llm=llm,
    tools=tools,
    memory=memory,
    system_message="你是一个友好的助手。",
    verbose=True
)

# 对话
agent.invoke("我叫张三")
agent.invoke("我叫什么名字？")
```

### ReActDocStore

使用文档存储的推理 Agent：

```python
from langchain.agents import create_react_docstore_agent
from langchain_core.prompts import PromptTemplate
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(model="gpt-4")

# 简单的文档存储
documents = {
    "Apple": "苹果公司是一家美国科技公司，成立于1976年。",
    "Microsoft": "微软公司是一家美国科技公司，成立于1975年。",
    "Google": "谷歌是一家美国科技公司，成立于1998年。"
}

# 创建 Agent
agent = create_react_docstore_agent(
    llm=llm,
    tools=tools,  # 需要 Lookup 和 Info 工具
    prompt=PromptTemplate.from_template(...)
)
```

### OpenAI Functions Agent

使用 OpenAI 函数调用功能：

```python
from langchain.agents import Agent, OpenAIFunctionsAgent
from langchain_core.messages import SystemMessage

system_message = SystemMessage(content="""你是一个助手，可以访问一组工具。
当需要信息时，使用工具获取。
回答要简洁准确。""")

prompt = OpenAIFunctionsAgent.create_prompt(system_message=system_message)

agent = OpenAIFunctionsAgent(
    llm=llm,
    tools=tools,
    prompt=prompt
)
```

## Agent Executor

### 基础用法

```python
from langchain.agents import AgentExecutor, tool

# 定义工具
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

# 创建 Executor
executor = AgentExecutor(
    agent=agent,
    tools=[get_date, calculate_days],
    verbose=True,
    max_iterations=10,
    handle_parsing_errors=True
)

# 执行
result = executor.invoke({
    "input": "今天距离2024年春节(2024年2月10日)还有多少天？"
})
```

### 执行器配置

| 参数 | 说明 | 默认值 |
|------|------|--------|
| **agent** | Agent 实例 | 必需 |
| **tools** | 可用工具列表 | 必需 |
| **verbose** | 是否打印详细日志 | False |
| **max_iterations** | 最大迭代次数 | 15 |
| **handle_parsing_errors** | 处理解析错误 | True |
| **early_stopping_method** | 提前停止方法 | "force" |

```python
executor = AgentExecutor(
    agent=agent,
    tools=tools,
    verbose=True,
    max_iterations=5,
    max_execution_time=60,  # 最大执行时间（秒）
    handle_parsing_errors="handle_parsing_errors",  # 或 True
    return_intermediate_steps=True  # 返回中间步骤
)
```

## 工具包 (Toolkit)

### 常用 Toolkits

```python
# 文件系统工具包
from langchain_community.agent_toolkits import FileManagementToolkit
import os

toolkit = FileManagementToolkit(
    root_dir=os.getcwd(),
    selected_tools=["read_file", "write_file", "list_directory"]
)
file_tools = toolkit.get_tools()

# Python 解释器工具包
from langchain_experimental.agents.agent_toolkits import create_python_agent
from langchain_experimental.tools.python.tool import PythonREPLTool

python_agent = create_python_agent(
    llm=llm,
    tool=PythonREPLTool(),
    verbose=True
)
```

## 多 Agent 协作

### 协作模式

```python
from langchain.agents import Agent, tool
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(model="gpt-4")

# 专家 Agent
researcher_tools = [...]
researcher_agent = Agent.from_agent_type(
    agent_type=AgentType.ZERO_SHOT_REACT_DESCRIPTION,
    llm=llm,
    tools=researcher_tools
)

# 作家 Agent
writer_tools = [...]
writer_agent = Agent.from_agent_type(
    agent_type=AgentType.ZERO_SHOT_REACT_DESCRIPTION,
    llm=llm,
    tools=writer_tools
)

# 协调器
def multi_agent_collaboration(task: str):
    # 1. 研究
    research = researcher_agent.invoke({"input": f"研究{task}"})

    # 2. 写作
    writing = writer_agent.invoke({
        "input": f"基于以下研究写一篇文章：{research['output']}"
    })

    return writing["output"]
```

## 自定义 Agent

### 继承 Agent 类

```python
from langchain.agents import Agent
from langchain_core.tools import BaseTool
from typing import List, Tuple, Union, Any

class CustomAgent(Agent):
    """自定义 Agent"""

    @property
    def observation_prefix(self) -> str:
        return "Observation: "

    @property
    def llm_prefix(self) -> str:
        return "Thought: "

    @property
    def output_keys(self) -> List[str]:
        return ["output"]

    def _construct_scratchpad(
        self, intermediate_steps: List[Tuple[Any, str]]
    ) -> str:
        """构建思考过程"""
        thoughts = ""
        for action, observation in intermediate_steps:
            thoughts += action.log
            thoughts += f"\n{self.observation_prefix}{observation}\n"
        return thoughts

    def _get_text_output(
        self, tool_arguments: str, observation: str
    ) -> str:
        return observation

    def _take_next_step(
        self, name_to_tool_map: dict,
        color_mapping: dict,
        inputs: dict,
        intermediate_steps: List[Tuple[Any, str]]
    ) -> Union[dict, Any]:
        # 自定义决策逻辑
        pass
```

## 实战案例

### 智能助手 Agent

```python
from langchain.agents import Agent, tool, AgentExecutor
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(model="gpt-4", temperature=0)

@tool
def search_web(query: str) -> str:
    """搜索网络获取信息"""
    return f"搜索结果：关于'{query}'的最新信息..."

@tool
def get_time(city: str) -> str:
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

agent = Agent.from_agent_type(
    agent_type=AgentType.ZERO_SHOT_REACT_DESCRIPTION,
    llm=llm,
    tools=tools
)

executor = AgentExecutor(
    agent=agent,
    tools=tools,
    verbose=True
)

# 测试
executor.invoke({
    "input": "帮我查一下今天北京的天气，然后在明天下午3点给老板发一封邮件告诉他"
})
```

### 数据分析 Agent

```python
from langchain.agents import create_pandas_dataframe_agent
from langchain_experimental.agents import create_csv_agent
import pandas as pd

# CSV 分析 Agent
csv_agent = create_csv_agent(
    llm=llm,
    path="data.csv",
    verbose=True
)

# 使用
csv_agent.invoke("有多少行数据？")
csv_agent.invoke("计算 'sales' 列的平均值")

# DataFrame 分析
df = pd.read_csv("sales_data.csv")
df_agent = create_pandas_dataframe_agent(
    llm=llm,
    df=df,
    verbose=True
)

df_agent.invoke("绘制销售趋势图")
df_agent.invoke("找出销售额最高的前5个产品")
```

## 调试技巧

### 启用详细输出

```python
executor = AgentExecutor(
    agent=agent,
    tools=tools,
    verbose=True,
    max_iterations=10
)

result = executor.invoke({
    "input": "你的问题",
    "intermediate_steps": []  # 跟踪中间步骤
})

# 查看所有中间步骤
if "intermediate_steps" in result:
    for step in result["intermediate_steps"]:
        print(f"Action: {step[0]}")
        print(f"Observation: {step[1]}")
```

### 常见错误处理

```python
# 处理解析错误
executor = AgentExecutor(
    agent=agent,
    tools=tools,
    handle_parsing_errors=True  # 自动处理
)

# 或者自定义处理
def handle_error(error):
    return f"遇到错误: {error}，请重新尝试"

executor = AgentExecutor(
    agent=agent,
    tools=tools,
    handle_parsing_errors=handle_error
)
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
