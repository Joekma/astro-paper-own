---
title: RAG 与 Agents：构建智能代理系统
author: Joekma
pubDatetime: 2026-05-11T00:00:00.000+08:00
modDatetime: 2026-05-11T00:00:00.000+08:00
slug: rag-agents-integration
description: '深入讲解RAG系统与Agent技术的深度融合，包括Agent架构、工具调用、多步推理和自主决策机制。'
tags:
  - RAG
  - Agent
  - 智能代理
  - 工具调用
  - 自主决策
draft: false
series: RAG
seriesOrder: 9
language: zh-CN
---

## 概述

Agent（智能代理）是当前人工智能领域最具前景的技术方向之一。将 RAG 与 Agent 结合，可以让 AI 系统具备自主规划、工具调用和多步推理的能力，从而完成更加复杂和动态的任务。本篇将详细介绍如何构建 RAG-Agent 融合系统。

### RAG-Agent 融合架构

```
┌─────────────────────────────────────────────────────────────────────┐
│                    RAG-Agent 融合架构                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────────────────────────────────────────┐        │
│  │                      用户请求                           │        │
│  └─────────────────────────┬─────────────────────────────┘        │
│                            │                                        │
│                            ▼                                        │
│  ┌─────────────────────────────────────────────────────────┐        │
│  │                    推理引擎 (Agent Brain)                │        │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │        │
│  │  │  规划器     │  │  记忆系统   │  │  决策器     │   │        │
│  │  │  Planner    │  │  Memory     │  │  Decider    │   │        │
│  │  └─────────────┘  └─────────────┘  └─────────────┘   │        │
│  └─────────────────────────┬─────────────────────────────┘        │
│                            │                                        │
│           ┌────────────────┼────────────────┐                      │
│           │                │                │                      │
│           ▼                ▼                ▼                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   RAG       │  │   工具      │  │   执行      │              │
│  │   检索器    │  │   调用器    │  │   器        │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
│           │                │                │                      │
│           ▼                ▼                ▼                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  知识库     │  │  外部工具   │  │  反馈系统   │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Agent 核心概念

### 什么是 Agent？

Agent 是一种能够自主感知环境、做出决策并执行行动的智能系统。与传统的 RAG 系统相比，Agent 具有以下核心能力：

| 能力 | 描述 | RAG | Agent+RAG |
|------|------|-----|-----------|
| **信息检索** | 从知识库获取信息 | ✅ | ✅ |
| **工具调用** | 调用外部工具和 API | ❌ | ✅ |
| **自主规划** | 分解复杂任务 | ❌ | ✅ |
| **多步推理** | 链式思考和推理 | ❌ | ✅ |
| **自我反思** | 评估和改进输出 | ❌ | ✅ |
| **持续学习** | 从反馈中学习 | ❌ | ✅ |

### Agent 的组成

```
Agent
├── 感知层 (Perception)
│   ├── 用户输入解析
│   ├── 环境信息获取
│   └── 上下文理解
│
├── 推理层 (Reasoning)
│   ├── 规划器 (Planner)
│   ├── 决策器 (Decider)
│   └── 反思器 (Reflector)
│
├── 记忆层 (Memory)
│   ├── 短期记忆 (Working Memory)
│   ├── 长期记忆 (Long-term Memory)
│   └── 情节记忆 (Episodic Memory)
│
├── 工具层 (Tools)
│   ├── RAG 检索器
│   ├── 计算器
│   ├── API 调用器
│   └── 代码执行器
│
└── 行动层 (Action)
    ├── 响应生成
    ├── 工具调用
    └── 状态更新
```

## LangChain Agent 基础

### Agent 类型

```python
from langchain.agents import AgentType, initialize_agent
from langchain_openai import ChatOpenAI
from langchain.agents import Tool

llm = ChatOpenAI(model="gpt-4", temperature=0)

tools = [
    Tool(
        name="RAG检索",
        func=rag_retriever.invoke,
        description="用于检索知识库中的相关信息。输入应该是搜索查询。"
    ),
    Tool(
        name="计算器",
        func=lambda x: str(eval(x)),
        description="用于数学计算。输入应该是数学表达式。"
    ),
    Tool(
        name="搜索",
        func=web_search,
        description="用于搜索互联网信息。输入应该是搜索关键词。"
    )
]

agent = initialize_agent(
    tools=tools,
    llm=llm,
    agent=AgentType.CHAT_CONVERSATIONAL,
    verbose=True
)

result = agent.run("查找RAG的最新研究进展并总结要点")
```

### 零样本 ReAct Agent

```python
from langchain.agents import ZeroShotAgent
from langchain.prompts import PromptTemplate

prompt = PromptTemplate.from_template(
    """你是一个助手。在每个步骤中，你可以使用以下工具：

{tools}

使用以下格式：

问题：你需要回答的输入问题
思考：你应该始终思考如何解决这个问题
行动：要使用的行动，应该是以下之一：{tool_names}
行动输入：给行动的输入
观察：行动的结果
...（这个思考/行动/观察可以重复N次）
思考：我现在知道最终答案了
最终答案：原始输入的最终答案

开始！

问题：{input}
{agent_scratchpad}"""
)

agent = ZeroShotAgent(
    llm=llm,
    tools=tools,
    prompt=prompt,
    verbose=True
)

agent_chain = agent.from_llm_and_tools(
    llm=llm,
    tools=tools,
    prompt=prompt
)

result = agent_chain.run("解释什么是Transformer架构并给出使用示例")
```

### 对话式 Agent

```python
from langchain.agents import ConversationalChatAgent
from langchain.memory import ConversationBufferMemory

memory = ConversationBufferMemory(
    memory_key="chat_history",
    return_messages=True
)

agent = ConversationalChatAgent.from_llm_and_tools(
    llm=llm,
    tools=tools,
    memory=memory
)

agent_executor = AgentExecutor.from_agent_and_tools(
    agent=agent,
    tools=tools,
    memory=memory,
    verbose=True
)

response = agent_executor.run(
    input="我想了解RAG系统的工作原理"
)

response = agent_executor.run(
    input="能详细解释一下检索部分吗？"
)
```

## RAG-Agent 融合实现

### 核心架构

```python
from typing import List, Dict, Optional
from langchain.schema import Document, AgentAction, AgentFinish
from langchain_openai import ChatOpenAI
from pydantic import BaseModel

class RAGAgentConfig(BaseModel):
    llm_model: str = "gpt-4"
    temperature: float = 0.7
    max_iterations: int = 10
    max_time: int = 120
    verbose: bool = True

class RAGAgent:
    def __init__(self, config: RAGAgentConfig):
        self.config = config
        self.llm = ChatOpenAI(
            model=config.llm_model,
            temperature=config.temperature
        )
        self.tools = []
        self.memory = []

    def add_tool(self, name: str, func, description: str):
        self.tools.append(Tool(
            name=name,
            func=func,
            description=description
        ))

    def add_rag_retriever(self, vectorstore, k: int = 5):
        def rag_search(query: str) -> str:
            docs = vectorstore.similarity_search(query, k=k)
            context = "\n\n".join([doc.page_content for doc in docs])
            return context

        self.add_tool(
            name="RAG检索",
            func=rag_search,
            description="从知识库中检索相关信息来回答问题。"
        )

    def plan(self, query: str) -> List[str]:
        planning_prompt = f"""分析以下查询并制定执行计划：

查询：{query}

请按步骤列出需要执行的操作：
1.
2.
3.

只输出步骤列表，不要其他内容。"""

        plan_text = self.llm.invoke(planning_prompt)
        steps = [line.strip() for line in plan_text.content.split('\n') if line.strip()]

        return steps

    def execute_step(self, step: str, context: str) -> str:
        execution_prompt = f"""当前上下文：
{context}

当前步骤：{step}

请执行这个步骤并返回结果。"""

        result = self.llm.invoke(execution_prompt)
        return result.content

    def run(self, query: str) -> Dict:
        if self.config.verbose:
            print(f"🔍 处理查询: {query}")

        steps = self.plan(query)

        if self.config.verbose:
            print(f"📋 计划步骤: {len(steps)} 个")

        context = f"原始查询: {query}\n\n"
        results = []

        for i, step in enumerate(steps):
            if self.config.verbose:
                print(f"  步骤 {i+1}: {step}")

            action_prompt = f"""查询：{query}
当前步骤：{step}
历史上下文：{context}

确定需要使用的工具（如果有）：
{self._format_tools()}

如果没有工具能帮助，直接回答问题。"""

            action = self.llm.invoke(action_prompt)

            if action.content in [tool.name for tool in self.tools]:
                tool = next(t for t in self.tools if t.name == action.content)
                tool_result = tool.func(step)
                results.append(f"[{tool.name}] {tool_result}")
                context += f"\n\n步骤{i+1}结果: {tool_result}"
            else:
                step_result = self.execute_step(step, context)
                results.append(step_result)
                context += f"\n\n步骤{i+1}执行: {step_result}"

        final_prompt = f"""基于以下执行过程，给出最终答案：

执行过程：
{context}

原始查询：{query}

请给出完整、清晰的最终答案。"""

        final_answer = self.llm.invoke(final_prompt)

        self.memory.append({
            "query": query,
            "answer": final_answer.content,
            "steps": results
        })

        return {
            "answer": final_answer.content,
            "steps": results,
            "plan": steps
        }

    def _format_tools(self) -> str:
        return "\n".join([
            f"- {tool.name}: {tool.description}"
            for tool in self.tools
        ])

config = RAGAgentConfig(verbose=True, max_iterations=10)
agent = RAGAgent(config)

agent.add_rag_retriever(vectorstore, k=5)
agent.add_tool(
    name="计算器",
    func=lambda x: str(eval(x)),
    description="执行数学计算"
)
agent.add_tool(
    name="搜索",
    func=web_search,
    description="搜索互联网"
)

result = agent.run("分析过去一年RAG技术的最新发展趋势")
print(result["answer"])
```

### 记忆系统

```python
from typing import List, Dict
from datetime import datetime
from collections import deque

class Memory:
    def __init__(self, max_length: int = 1000):
        self.short_term = deque(maxlen=100)
        self.long_term = []
        self.episodic = []
        self.max_length = max_length

    def add_interaction(self, role: str, content: str):
        self.short_term.append({
            "role": role,
            "content": content,
            "timestamp": datetime.now().isoformat()
        })

    def add_episode(self, episode: Dict):
        self.episodic.append({
            **episode,
            "timestamp": datetime.now().isoformat()
        })

    def retrieve_relevant(self, query: str, k: int = 5) -> List[Dict]:
        all_memories = (
            list(self.short_term) +
            self.long_term +
            self.episodic
        )

        if not all_memories:
            return []

        scores = []
        for mem in all_memories:
            content = mem.get("content", "")
            score = self._calculate_relevance(query, content)
            scores.append((mem, score))

        scores.sort(key=lambda x: x[1], reverse=True)
        return [mem for mem, score in scores[:k]]

    def _calculate_relevance(self, query: str, content: str) -> float:
        query_words = set(query.lower().split())
        content_words = set(content.lower().split())

        if not query_words:
            return 0.0

        overlap = len(query_words & content_words)
        return overlap / len(query_words)

    def compress(self):
        if len(self.short_term) > self.max_length:
            consolidated = self.short_term.copy()
            self.long_term.append({
                "type": "consolidated",
                "content": self._consolidate_memory(consolidated),
                "timestamp": datetime.now().isoformat()
            })
            self.short_term.clear()

    def _consolidate_memory(self, memories: deque) -> str:
        summary_prompt = f"总结以下对话的关键信息：\n\n"
        for mem in memories:
            summary_prompt += f"- {mem['role']}: {mem['content']}\n"

        return summary_prompt

    def get_context(self, query: str, max_memories: int = 10) -> str:
        relevant = self.retrieve_relevant(query, k=max_memories)

        context_parts = []
        for mem in relevant:
            context_parts.append(f"[{mem.get('role', 'unknown')}]: {mem.get('content', '')}")

        return "\n".join(context_parts)

memory = Memory()
memory.add_interaction("user", "我想了解RAG系统的基本原理")
memory.add_interaction("assistant", "RAG是检索增强生成的缩写，它通过从知识库检索相关信息来增强语言模型的生成能力。")

relevant_memories = memory.retrieve_relevant("RAG原理")
context = memory.get_context("RAG", max_memories=5)
```

### ReAct 推理模式

```python
from typing import Union
from langchain.schema import AgentAction, AgentFinish

class ReActAgent:
    def __init__(self, llm, tools: List[Tool], max_iterations: int = 10):
        self.llm = llm
        self.tools = {tool.name: tool for tool in tools}
        self.max_iterations = max_iterations

    def run(self, query: str) -> Union[AgentFinish, AgentAction]:
        observation = ""
        history = ""

        for i in range(self.max_iterations):
            if i == 0:
                history = f"问题：{query}\n\n"
            else:
                history += f"思考：{thought}\n"
                history += f"行动：{action}\n"
                history += f"行动输入：{action_input}\n"
                history += f"观察：{observation}\n\n"

            prompt = self._create_prompt(history)

            response = self.llm.invoke(prompt)

            parsed = self._parse_response(response.content)

            if parsed["type"] == "finish":
                return AgentFinish(
                    return_values={"output": parsed["output"]},
                    log=response.content
                )

            thought = parsed["thought"]
            action = parsed["action"]
            action_input = parsed["action_input"]

            if action == "None" or action == "无需工具":
                observation = "此步骤无需工具，直接给出答案。"
            elif action in self.tools:
                tool = self.tools[action]
                observation = tool.func(action_input)
            else:
                observation = f"错误：未找到工具 '{action}'"

        return AgentFinish(
            return_values={"output": "达到最大迭代次数"},
            log="max_iterations_reached"
        )

    def _create_prompt(self, history: str) -> str:
        tools_desc = "\n".join([
            f"- {name}: {tool.description}"
            for name, tool in self.tools.items()
        ])

        return f"""你是一个智能助手，使用思考-行动-观察的推理模式。

可用的工具：
{tools_desc}

推理格式：
思考：你对当前问题的分析和下一步计划
行动：要使用的工具名称（如果没有工具能帮助，回答"无需工具"）
行动输入：给工具的输入参数
观察：工具执行的结果

{history}
请继续推理："""

    def _parse_response(self, response: str) -> Dict:
        lines = response.strip().split("\n")

        parsed = {
            "type": "action",
            "thought": "",
            "action": "无需工具",
            "action_input": "",
            "output": ""
        }

        for line in lines:
            if "思考：" in line or "Thought:" in line:
                parsed["thought"] = line.split(":", 1)[1].strip()
            elif "行动：" in line or "Action:" in line:
                action_part = line.split(":", 1)[1].strip()
                if "[" in action_part and "]" in action_part:
                    parsed["action"] = action_part.split("[")[1].split("]")[0]
                else:
                    parsed["action"] = action_part
            elif "行动输入：" in line or "Action Input:" in line:
                parsed["action_input"] = line.split(":", 1)[1].strip()
            elif "最终答案：" in line or "Final Answer:" in line:
                parsed["type"] = "finish"
                parsed["output"] = line.split(":", 1)[1].strip()

        return parsed

react_agent = ReActAgent(llm, tools)
result = react_agent.run("比较RAG和Fine-tuning的优劣")
```

## 工具系统

### 工具定义与注册

```python
from langchain.tools import Tool
from typing import Callable, Any

class ToolRegistry:
    def __init__(self):
        self.tools = {}

    def register(self, name: str, func: Callable, description: str, return_direct: bool = False):
        tool = Tool(
            name=name,
            func=func,
            description=description,
            return_direct=return_direct
        )
        self.tools[name] = tool

    def get_tool(self, name: str) -> Tool:
        return self.tools.get(name)

    def list_tools(self) -> List[str]:
        return list(self.tools.keys())

    def execute(self, name: str, input_str: str) -> Any:
        tool = self.get_tool(name)
        if tool is None:
            return f"错误：工具 '{name}' 不存在"
        return tool.func(input_str)

registry = ToolRegistry()

registry.register(
    name="RAG检索",
    func=lambda query: "\n".join([doc.page_content for doc in vectorstore.similarity_search(query, k=5)]),
    description="从知识库检索相关信息。输入：搜索查询。输出：相关文档内容。"
)

registry.register(
    name="计算器",
    func=lambda expr: str(eval(expr)),
    description="执行数学计算。输入：数学表达式。输出：计算结果。"
)

registry.register(
    name="日期查询",
    func=lambda _: datetime.now().strftime("%Y年%m月%d日 %H:%M:%S"),
    description="获取当前日期和时间。输入：任意字符。输出：当前日期时间。"
)

registry.register(
    name="天气查询",
    func=get_weather,
    description="查询指定城市的天气。输入：城市名称。输出：天气信息。"
)

print(f"已注册 {len(registry.list_tools())} 个工具")
```

### 动态工具生成

```python
from langchain.tools import StructuredTool
from pydantic import BaseModel, Field

class WeatherInput(BaseModel):
    city: str = Field(description="城市名称")

def get_weather(city: str) -> str:
    weather_data = {
        "北京": "晴，25°C",
        "上海": "多云，28°C",
        "广州": "阵雨，30°C"
    }
    return weather_data.get(city, "未找到该城市天气信息")

weather_tool = StructuredTool.from_function(
    func=get_weather,
    name="weather_query",
    description="查询指定城市的天气情况",
    args_schema=WeatherInput
)

class StockInput(BaseModel):
    symbol: str = Field(description="股票代码")
    days: int = Field(default=7, description="查询天数")

def get_stock_price(symbol: str, days: int = 7) -> str:
    return f"{symbol} 过去{days}天的收盘价：{[100+days*2, 102+days*2, 101+days*2]}"

stock_tool = StructuredTool.from_function(
    func=get_stock_price,
    name="stock_query",
    description="查询股票价格信息",
    args_schema=StockInput
)

tools = [weather_tool, stock_tool]
```

### 工具选择策略

```python
class ToolSelector:
    def __init__(self, llm, tools: List[Tool]):
        self.llm = llm
        self.tools = tools

    def select(self, query: str, context: str = "") -> Tool:
        selection_prompt = f"""在以下工具中选择最合适的一个来回答用户问题：

用户问题：{query}

可用工具：
{self._format_tools()}

{context if context else "无额外上下文"}

只输出工具名称，不要解释。"""

        selected_name = self.llm.invoke(selection_prompt).content.strip()

        for tool in self.tools:
            if tool.name in selected_name or selected_name in tool.name:
                return tool

        return None

    def _format_tools(self) -> str:
        return "\n".join([
            f"{i+1}. {tool.name}: {tool.description}"
            for i, tool in enumerate(self.tools)
        ])

selector = ToolSelector(llm, tools)
selected_tool = selector.select("北京今天的天气如何？")

if selected_tool:
    result = selected_tool.func("北京")
    print(f"查询结果：{result}")
```

## 多步推理与规划

### 任务分解

```python
class TaskDecomposer:
    def __init__(self, llm):
        self.llm = llm

    def decompose(self, task: str) -> List[Dict]:
        decompose_prompt = f"""将以下复杂任务分解为可执行的子任务：

任务：{task}

输出格式（JSON数组）：
[
  {{"id": 1, "description": "子任务描述", "tool": "所需工具（无则填'无需工具'）", "depends_on": []}},
  ...
]

只输出JSON，不要其他内容。"""

        response = self.llm.invoke(decompose_prompt)

        import json
        try:
            tasks = json.loads(response.content)
            return tasks
        except:
            return [{"id": 1, "description": task, "tool": "无需工具", "depends_on": []}]

    def decompose_sequential(self, task: str) -> List[str]:
        tasks = self.decompose(task)

        execution_order = []
        completed = set()

        while len(execution_order) < len(tasks):
            for task in tasks:
                if task["id"] in execution_order:
                    continue

                deps_satisfied = all(
                    dep in completed
                    for dep in task.get("depends_on", [])
                )

                if deps_satisfied:
                    execution_order.append(task["id"])
                    completed.add(task["id"])

        return execution_order

decomposer = TaskDecomposer(llm)
tasks = decomposer.decompose("分析RAG系统的性能并与微调方案对比")

print("任务分解结果：")
for task in tasks:
    print(f"  {task['id']}. {task['description']} (工具: {task['tool']})")
```

### 执行引擎

```python
class ExecutionEngine:
    def __init__(self, tools: Dict[str, Tool]):
        self.tools = tools
        self.execution_log = []

    def execute_task(self, task: Dict, context: Dict) -> Any:
        tool_name = task.get("tool", "无需工具")
        description = task.get("description", "")

        if tool_name == "无需工具" or tool_name not in self.tools:
            return {"status": "success", "result": description}

        tool = self.tools[tool_name]
        result = tool.func(description)

        self.execution_log.append({
            "task_id": task.get("id"),
            "tool": tool_name,
            "input": description,
            "output": result,
            "status": "completed"
        })

        return {"status": "success", "result": result}

    def execute_plan(self, tasks: List[Dict], initial_context: Dict) -> List[Dict]:
        results = []
        context = initial_context.copy()

        execution_order = self._get_execution_order(tasks)

        for task_id in execution_order:
            task = next((t for t in tasks if t["id"] == task_id), None)

            if not task:
                continue

            result = self.execute_task(task, context)

            if result["status"] == "success":
                context[f"task_{task_id}_result"] = result["result"]
                results.append(result)
            else:
                results.append({
                    "status": "failed",
                    "task_id": task_id,
                    "error": result.get("error")
                })

        return results

    def _get_execution_order(self, tasks: List[Dict]) -> List[int]:
        order = []
        completed = set()

        while len(order) < len(tasks):
            for task in tasks:
                if task["id"] in order:
                    continue

                deps = task.get("depends_on", [])
                if all(dep in completed for dep in deps):
                    order.append(task["id"])
                    completed.add(task["id"])

        return order

engine = ExecutionEngine({t.name: t for t in tools})
results = engine.execute_plan(tasks, {"query": "RAG性能分析"})
```

### 反思与改进

```python
class ReflexionAgent:
    def __init__(self, llm, max_reflections: int = 3):
        self.llm = llm
        self.max_reflections = max_reflections

    def reflect(self, task: str, execution_result: Any, expected: str = None) -> Dict:
        reflection_prompt = f"""分析以下执行过程，评估结果质量：

任务：{task}
执行结果：{execution_result}
{('预期结果：' + expected) if expected else ''}

请评估：
1. 执行是否成功？
2. 结果是否满足任务要求？
3. 有哪些可以改进的地方？

输出格式：
{{
  "success": true/false,
  "quality_score": 0-10,
  "issues": ["问题1", "问题2"],
  "suggestions": ["建议1", "建议2"]
}}"""

        response = self.llm.invoke(reflection_prompt)

        import json
        try:
            return json.loads(response.content)
        except:
            return {"success": True, "quality_score": 5, "issues": [], "suggestions": []}

    def improve(self, task: str, reflection: Dict) -> str:
        improve_prompt = f"""基于以下反思结果，改进执行计划：

原始任务：{task}

反思结果：
问题：{reflection.get('issues', [])}
建议：{reflection.get('suggestions', [])}

请提供改进后的执行方案。"""

        improved = self.llm.invoke(improve_prompt)
        return improved.content

    def run_with_reflection(self, task: str, executor: ExecutionEngine) -> Any:
        for iteration in range(self.max_reflections):
            results = executor.execute_plan([{"id": 1, "description": task, "tool": "无需工具"}], {})

            result = results[0]["result"] if results else ""

            reflection = self.reflect(task, result)

            if reflection.get("success") and reflection.get("quality_score", 0) >= 7:
                return result

            if iteration < self.max_reflections - 1:
                improved_task = self.improve(task, reflection)
                task = improved_task

        return result

reflexion = ReflexionAgent(llm)
final_result = reflexion.run_with_reflection("解释注意力机制", executor)
```

## 自主决策系统

### 状态机 Agent

```python
from enum import Enum

class AgentState(Enum):
    IDLE = "idle"
    PLANNING = "planning"
    EXECUTING = "executing"
    WAITING = "waiting"
    REFLECTING = "reflecting"
    COMPLETED = "completed"
    FAILED = "failed"

class StateMachineAgent:
    def __init__(self, llm):
        self.llm = llm
        self.state = AgentState.IDLE
        self.context = {}

    def transition(self, new_state: AgentState, context_update: Dict = None):
        self.state = new_state
        if context_update:
            self.context.update(context_update)

    def run(self, query: str) -> Dict:
        self.transition(AgentState.PLANNING)
        plan = self._create_plan(query)

        self.transition(AgentState.EXECUTING, {"plan": plan})

        for step in plan["steps"]:
            self.transition(AgentState.EXECUTING, {"current_step": step})

            result = self._execute_step(step)

            if result.get("needs_input"):
                self.transition(AgentState.WAITING)
                user_input = self._get_user_input(result)
                self.transition(AgentState.EXECUTING, {"user_input": user_input})
                result = self._continue_step(result, user_input)

            self.context[f"step_result_{step['id']}"] = result

        self.transition(AgentState.REFLECTING)
        final_result = self._synthesize_result()

        self.transition(AgentState.COMPLETED)

        return final_result

    def _create_plan(self, query: str) -> Dict:
        planning_prompt = f"""为以下查询制定执行计划：

{query}

输出格式：
{{
  "steps": [
    {{"id": 1, "description": "...", "expected_output": "..."}}
  ],
  "requires_user_input": false
}}"""

        response = self.llm.invoke(planning_prompt)
        import json
        return json.loads(response.content)

    def _execute_step(self, step: Dict) -> Any:
        return {"status": "executed", "result": f"执行步骤 {step['id']}"}

    def _get_user_input(self, result: Dict) -> str:
        return input(f"需要您提供信息: {result.get('message', '请输入：')}")

    def _continue_step(self, result: Dict, user_input: str) -> Any:
        return {"status": "continued", "result": user_input}

    def _synthesize_result(self) -> Any:
        synthesis_prompt = f"""基于以下执行结果，生成最终答案：

{self.context}

请生成完整、连贯的最终答案。"""

        return self.llm.invoke(synthesis_prompt).content

state_agent = StateMachineAgent(llm)
result = state_agent.run("帮我分析这份文档")
```

### 条件分支处理

```python
class ConditionalBranch:
    def __init__(self, condition: str, action: Callable, fallback: Callable = None):
        self.condition = condition
        self.action = action
        self.fallback = fallback

class BranchingAgent:
    def __init__(self, llm):
        self.llm = llm
        self.branches = []

    def add_branch(self, condition: str, action: Callable, fallback: Callable = None):
        self.branches.append(ConditionalBranch(condition, action, fallback))

    def evaluate_condition(self, condition: str, context: Dict) -> bool:
        eval_prompt = f"""判断以下条件是否为真：

条件：{condition}
上下文：{context}

只输出 "true" 或 "false"。"""

        result = self.llm.invoke(eval_prompt).content.strip().lower()
        return "true" in result

    def run(self, query: str, context: Dict) -> Any:
        for branch in self.branches:
            if self.evaluate_condition(branch.condition, context):
                try:
                    return branch.action(context)
                except Exception as e:
                    if branch.fallback:
                        return branch.fallback(context)
                    raise e

        return self._default_action(query, context)

    def _default_action(self, query: str, context: Dict) -> str:
        return f"无法处理该查询: {query}"

agent = BranchingAgent(llm)

agent.add_branch(
    condition="查询涉及RAG系统",
    action=lambda ctx: "使用RAG检索回答",
    fallback=lambda ctx: "使用通用方式回答"
)

agent.add_branch(
    condition="查询需要计算",
    action=lambda ctx: "调用计算器工具",
    fallback=lambda ctx: "跳过计算"
)

result = agent.run("RAG系统的延迟是多少？需要计算平均响应时间", {})
```

## 实战：构建完整 RAG-Agent 系统

```python
class CompleteRAGAgent:
    def __init__(self, config: RAGAgentConfig):
        self.config = config
        self.llm = ChatOpenAI(model=config.llm_model, temperature=config.temperature)
        self.memory = Memory()
        self.tool_registry = ToolRegistry()
        self.planner = TaskDecomposer(self.llm)
        self.executor = None
        self.reflexion = ReflexionAgent(self.llm)

        self._setup_default_tools()

    def _setup_default_tools(self):
        self.tool_registry.register(
            name="RAG检索",
            func=self._rag_search,
            description="从知识库检索相关信息"
        )

        self.tool_registry.register(
            name="计算器",
            func=lambda x: str(eval(x)),
            description="执行数学计算"
        )

        self.tool_registry.register(
            name="日期查询",
            func=lambda _: datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            description="获取当前日期时间"
        )

    def _rag_search(self, query: str) -> str:
        if not hasattr(self, 'vectorstore'):
            return "知识库未初始化"

        docs = self.vectorstore.similarity_search(query, k=5)

        if not docs:
            return "未找到相关信息"

        results = []
        for i, doc in enumerate(docs, 1):
            results.append(f"[文档{i}]\n{doc.page_content[:200]}...")

        return "\n\n".join(results)

    def set_vectorstore(self, vectorstore):
        self.vectorstore = vectorstore

    def add_custom_tool(self, name: str, func: Callable, description: str):
        self.tool_registry.register(name, func, description)

    def process(self, query: str) -> Dict:
        self.memory.add_interaction("user", query)

        context = self.memory.get_context(query)

        plan = self.planner.decompose(query)

        if self.executor is None:
            self.executor = ExecutionEngine(
                {t.name: t for t in [self.tool_registry.get_tool(n) for n in self.tool_registry.list_tools()]}
            )

        results = self.executor.execute_plan(plan, {"query": query, "context": context})

        synthesized = self._synthesize(query, results)

        self.memory.add_interaction("assistant", synthesized)

        self.memory.compress()

        return {
            "answer": synthesized,
            "plan": plan,
            "steps": results,
            "tools_used": self._extract_tools_used(results)
        }

    def _synthesize(self, query: str, results: List[Dict]) -> str:
        results_text = "\n".join([
            f"步骤{i+1}结果: {r.get('result', r)}"
            for i, r in enumerate(results)
        ])

        synthesis_prompt = f"""基于以下执行结果，回答用户问题：

原始问题：{query}

执行结果：
{results_text}

请生成完整、清晰、有条理的回答。确保：
1. 答案直接回应用户问题
2. 包含必要的细节和解释
3. 结构清晰，易于理解"""

        return self.llm.invoke(synthesis_prompt).content

    def _extract_tools_used(self, results: List[Dict]) -> List[str]:
        return list(set([
            r.get("tool", "无需工具")
            for r in results
            if r.get("tool")
        ]))

agent = CompleteRAGAgent(RAGAgentConfig(verbose=True))

agent.set_vectorstore(vectorstore)

agent.add_custom_tool(
    name="翻译",
    func=lambda text: translate_to_english(text),
    description="将文本翻译成英文"
)

agent.add_custom_tool(
    name="天气",
    func=lambda city: get_weather(city),
    description="查询城市天气"
)

result = agent.process("分析RAG和Agent结合的技术优势")

print(f"答案: {result['answer']}")
print(f"使用工具: {result['tools_used']}")
```

## 最佳实践

### 设计原则

| 原则 | 说明 | 示例 |
|------|------|------|
| **工具职责单一** | 每个工具只做一件事 | RAG检索只负责检索 |
| **错误处理** | 为每个工具添加错误处理 | 超时重试、默认值 |
| **日志记录** | 记录所有执行过程 | 调试、审计 |
| **超时控制** | 防止无限循环 | max_iterations |
| **降级策略** | 工具失败时优雅降级 | 使用备用工具 |

### 性能优化

```python
class AgentOptimizer:
    def __init__(self):
        self.cache = {}
        self.batch_size = 10

    def cache_result(self, key: str, value: Any):
        self.cache[key] = {
            "value": value,
            "timestamp": datetime.now()
        }

    def get_cached(self, key: str, max_age_seconds: int = 300) -> Any:
        if key not in self.cache:
            return None

        cached = self.cache[key]
        age = (datetime.now() - cached["timestamp"]).total_seconds()

        if age > max_age_seconds:
            del self.cache[key]
            return None

        return cached["value"]

    def batch_execute(self, tasks: List[Dict]) -> List[Any]:
        results = []

        for i in range(0, len(tasks), self.batch_size):
            batch = tasks[i:i+self.batch_size]

            batch_results = [
                self._execute_single(task)
                for task in batch
            ]

            results.extend(batch_results)

        return results

    def _execute_single(self, task: Dict) -> Any:
        pass

optimizer = AgentOptimizer()
```

## 总结

| 组件 | 功能 | 关键实现 |
|------|------|---------|
| **Agent Core** | 核心推理引擎 | 状态机、规划器 |
| **Memory** | 记忆管理 | 短期/长期记忆 |
| **Tools** | 工具调用 | RAG检索、计算器 |
| **ReAct** | 推理模式 | 思考-行动-观察 |
| **Reflexion** | 自我反思 | 质量评估、改进 |

RAG 与 Agent 的结合使 AI 系统具备了更强的自主性和智能性，可以完成更加复杂和动态的任务。

## 后续内容

本系列后续将深入讲解：
- 生产级 RAG 最佳实践
- RAG 安全与隐私保护
- RAG 评估与监控