---
title: LangChain Callbacks：回调机制
author: Joekma
pubDatetime: 2026-05-07T00:00:00.000+08:00
modDatetime: 2026-05-07T00:00:00.000+08:00
slug: langchain-callbacks
description: '深入讲解LangChain的Callbacks机制，包括事件处理、日志记录、自定义回调和异步回调。'
tags:
  - LangChain
  - Callbacks
  - LLM
draft: false
series: LangChain
language: zh-CN
---

## 概述

Callbacks（回调机制）是 LangChain 中用于监控和记录 LLM 应用执行过程的模块。它允许你在关键事件发生时执行自定义逻辑，如记录日志、显示进度、收集指标等。

### 为什么需要 Callbacks？

| 需求 | Callbacks 解决方案 |
|------|------------------|
| 调试应用 | 记录详细执行日志 |
| 监控性能 | 跟踪处理时间 |
| 流式输出 | 实时显示生成内容 |
| 错误追踪 | 捕获和处理异常 |
| 成本分析 | 统计 Token 消耗 |

### Callback 工作原理

```
┌─────────────────────────────────────────────────────────────┐
│                    Callback 工作原理                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   ┌──────────┐                                              │
│   │  Chain   │                                              │
│   │   执行   │                                              │
│   └────┬─────┘                                              │
│        │                                                    │
│        ├─────────────────┐                                  │
│        │                 │                                  │
│        ▼                 ▼                                  │
│   ┌─────────┐       ┌─────────┐                              │
│   │ Callback │ ←─── │ Events  │                              │
│   │ Handlers│       │ 触发器  │                              │
│   └─────────┘       └─────────┘                              │
│                                                              │
│   事件列表：on_chain_start, on_chain_end, on_chat_model_start,│
│            on_chat_model_end, on_tool_start, on_tool_end...  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## CallbackHandler 接口

### 核心方法

```python
from langchain_core.callbacks import BaseCallbackHandler

class CustomHandler(BaseCallbackHandler):
    def on_chat_model_start(self, serialized, messages, **kwargs):
        print(f"聊天模型开始处理")

    def on_chat_model_end(self, response, **kwargs):
        print(f"聊天模型结束")

    def on_chain_start(self, serialized, inputs, **kwargs):
        print(f"Chain 开始: {serialized.get('name', 'unknown')}")

    def on_chain_end(self, outputs, **kwargs):
        print(f"Chain 结束: 输出包含 {len(outputs)} 个键")

    def on_tool_start(self, serialized, input_str, **kwargs):
        print(f"工具开始: {serialized.get('name')}")

    def on_tool_end(self, output, **kwargs):
        print(f"工具结束")
```

## 常用事件

### Chain 事件

| 事件 | 说明 | 触发时机 |
|------|------|---------|
| **on_chain_start** | 链开始 | Chain 执行前 |
| **on_chain_end** | 链结束 | Chain 执行后 |
| **on_chain_error** | 链错误 | Chain 执行出错 |

```python
from langchain_core.callbacks import BaseCallbackHandler

class ChainHandler(BaseCallbackHandler):
    def on_chain_start(self, serialized, inputs, **kwargs):
        print("=== Chain 开始 ===")
        print(f"输入: {inputs}")

    def on_chain_end(self, outputs, **kwargs):
        print("=== Chain 结束 ===")
        print(f"输出: {outputs}")

    def on_chain_error(self, error, **kwargs):
        print(f"=== Chain 错误 ===")
        print(f"错误: {error}")
```

### Chat Model 事件

| 事件 | 说明 |
|------|------|
| **on_chat_model_start** | 模型开始推理 |
| **on_chat_model_end** | 模型推理完成 |
| **on_llm_new_token** | 生成新 token（流式） |
| **on_llm_error** | 模型推理出错 |

```python
class LLMHandler(BaseCallbackHandler):
    def on_chat_model_start(self, serialized, messages, **kwargs):
        print("LLM 开始推理...")

    def on_llm_new_token(self, token, **kwargs):
        print(token, end="", flush=True)

    def on_chat_model_end(self, response, **kwargs):
        print("\nLLM 推理完成")
```

### Tool 事件

| 事件 | 说明 |
|------|------|
| **on_tool_start** | 工具开始执行 |
| **on_tool_end** | 工具执行完成 |
| **on_tool_error** | 工具执行出错 |

## 基础使用

### 全局 Callback（新版本）

```python
from langchain_openai import ChatOpenAI
from langchain_core.callbacks import BaseCallbackHandler

class LoggingHandler(BaseCallbackHandler):
    def on_llm_new_token(self, token, **kwargs):
        print(f"Token: {token}", end="", flush=True)

llm = ChatOpenAI(
    model="gpt-4",
    callbacks=[LoggingHandler()]
)

response = llm.invoke("写一首关于春天的诗")
```

### Chain Callback（新版本）

```python
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser

class ChainCallbackHandler(BaseCallbackHandler):
    def on_chain_start(self, serialized, inputs, **kwargs):
        print(f"链开始执行...")

    def on_chain_end(self, outputs, **kwargs):
        print(f"链执行完成!")

chain = PromptTemplate.from_template("解释{topic}") | ChatOpenAI(model="gpt-4") | StrOutputParser()

result = chain.invoke(
    {"topic": "人工智能"},
    config={"callbacks": [ChainCallbackHandler()]}
)
```

### Agent Callback（新版本）

```python
from langchain_core.tools import tool
from langchain_openai import ChatOpenAI
from langchain import create_react_agent
from langchain_core.callbacks import BaseCallbackHandler

class LoggingHandler(BaseCallbackHandler):
    def on_tool_start(self, serialized, inputs, **kwargs):
        print(f"工具开始: {serialized.get('name', 'unknown')}")

@tool
def get_weather(city: str) -> str:
    return f"{city}天气晴朗"

llm = ChatOpenAI(model="gpt-4")
agent = create_react_agent(llm, [get_weather])

result = agent.invoke(
    {"messages": ["北京天气如何？"]},
    config={"callbacks": [LoggingHandler()]}
)
```

## 预定义回调处理器

### StdOutCallbackHandler

标准输出回调：

```python
from langchain_core.callbacks import StdOutCallbackHandler
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(
    model="gpt-4",
    callbacks=[StdOutCallbackHandler()]
)

response = llm.invoke("解释量子计算")
```

### FileCallbackHandler

文件日志记录：

```python
from langchain_core.callbacks import FileCallbackHandler
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

file_handler = FileCallbackHandler("app.log")

llm = ChatOpenAI(
    model="gpt-4",
    callbacks=[file_handler]
)
```

### StreamingStdOutCallbackHandler

流式输出到标准输出：

```python
from langchain_core.callbacks import StreamingStdOutCallbackHandler

llm = ChatOpenAI(
    model="gpt-4",
    streaming=True,
    callbacks=[StreamingStdOutCallbackHandler()]
)

for chunk in llm.stream("写一篇关于春天的散文"):
    print(chunk.content, end="", flush=True)
```

## 异步回调

### AsyncCallbackHandler（新版本）

```python
from langchain_core.callbacks import AsyncCallbackHandler
import asyncio

class AsyncLoggingHandler(AsyncCallbackHandler):
    async def on_chain_start(self, serialized, inputs, **kwargs):
        print("异步链开始...")

    async def on_chain_end(self, outputs, **kwargs):
        print("异步链结束...")

    async def on_chat_model_start(self, serialized, messages, **kwargs):
        print("异步LLM开始...")

    async def on_chat_model_end(self, response, **kwargs):
        print("异步LLM结束...")

async def run_async():
    handler = AsyncLoggingHandler()

    llm = ChatOpenAI(
        model="gpt-4",
        callbacks=[handler]
    )

    response = await llm.ainvoke("异步测试")
    print(response.content)

asyncio.run(run_async())
```

### 混合同步异步

```python
class MixedHandler(BaseCallbackHandler):
    def on_chat_model_start(self, serialized, messages, **kwargs):
        print("同步: LLM开始")

    async def on_chat_model_end(self, response, **kwargs):
        print("异步: LLM结束")
```

## 实际应用

### 1. 成本追踪（新版本）

```python
# 导入所需的组件
from langchain_core.callbacks import BaseCallbackHandler
from langchain_openai import ChatOpenAI
from datetime import datetime

# 创建成本追踪器
class CostTracker(BaseCallbackHandler):
    def __init__(self):
        self.total_tokens = 0      # 累计Token数
        self.total_cost = 0        # 累计成本
        self.requests = []         # 请求记录列表

    # 当聊天模型结束推理时触发
    def on_chat_model_end(self, response, **kwargs):
        # 从响应中获取Token使用量
        usage = response.usage_metadata

        input_tokens = usage.get("input_tokens", 0)     # 输入Token数
        output_tokens = usage.get("output_tokens", 0)    # 输出Token数
        total = usage.get("total_tokens", 0)             # 总Token数

        # 计算成本（GPT-4的参考价格）
        cost = (input_tokens * 0.03 + output_tokens * 0.06) / 1000

        # 更新统计数据
        self.total_tokens += total
        self.total_cost += cost
        self.requests.append({
            "time": datetime.now(),
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "cost": cost
        })

    # 生成报告
    def get_report(self):
        return {
            "总Token数": self.total_tokens,
            "总成本": f"${self.total_cost:.4f}",
            "请求数": len(self.requests)
        }

# 使用追踪器
tracker = CostTracker()
llm = ChatOpenAI(model="gpt-4", callbacks=[tracker])

# 模拟多次请求
for i in range(5):
    llm.invoke(f"生成内容 {i}")

# 打印成本报告
print(tracker.get_report())
```

### 2. 性能监控（新版本）

```python
import time
from langchain_core.callbacks import BaseCallbackHandler

class PerformanceMonitor(BaseCallbackHandler):
    def __init__(self):
        self.chain_times = []
        self.llm_times = []

    def on_chain_start(self, serialized, inputs, **kwargs):
        self.chain_start = time.time()

    def on_chain_end(self, outputs, **kwargs):
        elapsed = time.time() - self.chain_start
        self.chain_times.append(elapsed)
        print(f"Chain 耗时: {elapsed:.2f}s")

    def on_chat_model_start(self, serialized, messages, **kwargs):
        self.llm_start = time.time()

    def on_chat_model_end(self, response, **kwargs):
        elapsed = time.time() - self.llm_start
        self.llm_times.append(elapsed)

    def get_stats(self):
        return {
            "avg_chain_time": sum(self.chain_times) / len(self.chain_times),
            "avg_llm_time": sum(self.llm_times) / len(self.llm_times),
            "total_chains": len(self.chain_times),
            "total_llms": len(self.llm_times)
        }
```

### 3. 详细日志

```python
import json
from datetime import datetime

class DetailedLogger(BaseCallbackHandler):
    def __init__(self, log_file="app.log"):
        self.log_file = log_file

    def _log(self, event_type, data):
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "event": event_type,
            "data": str(data)[:500]
        }
        with open(self.log_file, "a") as f:
            f.write(json.dumps(log_entry) + "\n")

    def on_chain_start(self, serialized, inputs, **kwargs):
        self._log("chain_start", inputs)

    def on_chain_end(self, outputs, **kwargs):
        self._log("chain_end", outputs)

    def on_chat_model_start(self, serialized, messages, **kwargs):
        self._log("llm_start", messages)

    def on_chat_model_end(self, response, **kwargs):
        self._log("llm_end", response.content)
```

## 多个 Callback

### 多个处理器（新版本）

```python
handler1 = LoggingHandler()
handler2 = CostTracker()
handler3 = PerformanceMonitor()

handlers = [handler1, handler2, handler3]

llm = ChatOpenAI(
    model="gpt-4",
    callbacks=handlers
)
```

### 嵌套回调

```python
chain = PromptTemplate.from_template("{input}") | llm

llm_response = llm.invoke(
    "query",
    config={"callbacks": [llm_handler]}
)

chain_response = chain.invoke(
    {"input": "query"},
    config={"callbacks": [chain_handler]}
)
```

## 上下文传递

### 使用 metadata（新版本）

```python
from langchain_core.callbacks import BaseCallbackHandler

class ContextHandler(BaseCallbackHandler):
    def on_chat_model_start(self, serialized, messages, **kwargs):
        metadata = kwargs.get("metadata", {})
        tags = metadata.get("tags", [])
        print(f"处理标签: {tags}")

llm = ChatOpenAI(callbacks=[ContextHandler()])

chain = PromptTemplate.from_template("{input}") | llm

chain.invoke(
    {"input": "query"},
    config={
        "metadata": {"user_id": "123", "tags": ["production"]}
    }
)
```

## 事件过滤

```python
class FilteredHandler(BaseCallbackHandler):
    def __init__(self, verbose=False):
        self.verbose = verbose

    @property
    def ignore_llm(self):
        return not self.verbose

    @property
    def ignore_chain(self):
        return not self.verbose
```

## 最佳实践

| 实践 | 说明 |
|------|------|
| **分离关注点** | 不同功能使用不同 Handler |
| **性能考虑** | 避免在回调中执行重操作 |
| **异常处理** | 回调中的异常不应中断主流程 |
| **资源管理** | 使用 context manager 管理资源 |
| **日志级别** | 生产环境使用适当日志级别 |

### 推荐架构

```python
class ProductionCallbacks:
    def __init__(self, config):
        self.handlers = [
            CostTracker(),
            PerformanceMonitor(),
            DetailedLogger(config.log_path),
        ]
        if config.debug:
            self.handlers.append(StdOutCallbackHandler())

    def get_callbacks(self):
        return self.handlers
```

## 常见问题

### Q1：如何禁用回调？

```python
llm = ChatOpenAI(callbacks=[])

result = chain.invoke(
    {"input": "query"},
    config={"callbacks": []}
)
```

### Q2：如何共享回调状态？

```python
class SharedState:
    def __init__(self):
        self.state = {"tokens": 0, "errors": 0}

shared = SharedState()
handler1 = LoggingHandler(shared)
handler2 = CostTracker(shared)
```

### Q3：如何处理流式输出？

```python
class StreamHandler(BaseCallbackHandler):
    def on_llm_new_token(self, token, **kwargs):
        print(token, end="", flush=True)
```

## 总结

Callback 是 LangChain 监控和扩展的核心机制：

| 事件类型 | 常见用途 |
|---------|---------|
| **Chain 事件** | 执行流程追踪 |
| **LLM 事件** | Token 消耗、性能监控 |
| **Tool 事件** | 工具使用分析 |
| **Agent 事件** | 决策过程分析 |

掌握 Callback，可以实现：
- 详细日志和监控
- 性能分析
- 成本追踪
- 流式输出
- 错误处理
