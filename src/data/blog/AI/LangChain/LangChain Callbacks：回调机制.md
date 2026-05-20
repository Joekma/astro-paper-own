---
title: LangChain Callbacks：回调机制
author: Joekma
pubDatetime: 2026-05-11T00:00:00.000+08:00
modDatetime: 2026-05-11T00:00:00.000+08:00
slug: langchain-callbacks
description: '深入讲解LangChain v1.0的Callbacks机制，包括事件处理、日志记录和自定义回调。'
tags:
  - LangChain
  - Callbacks
  - LLM
draft: false
series: LangChain
seriesOrder: 5
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
        print(f"Chain 结束")

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

### Chat Model 事件

| 事件 | 说明 |
|------|------|
| **on_chat_model_start** | 模型开始推理 |
| **on_chat_model_end** | 模型推理完成 |
| **on_llm_new_token** | 生成新 token（流式） |
| **on_llm_error** | 模型推理出错 |

### Tool 事件

| 事件 | 说明 |
|------|------|
| **on_tool_start** | 工具开始执行 |
| **on_tool_end** | 工具执行完成 |
| **on_tool_error** | 工具执行出错 |

## 基础使用

### LLM Callback

```python
from langchain_openai import ChatOpenAI
from langchain_core.callbacks import BaseCallbackHandler

class LoggingHandler(BaseCallbackHandler):
    def on_llm_new_token(self, token, **kwargs):
        print(f"Token: {token}", end="", flush=True)

llm = ChatOpenAI(
    model="gpt-4o",
    callbacks=[LoggingHandler()]
)

response = llm.invoke("写一首关于春天的诗")
```

### Chain Callback

```python
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.callbacks import BaseCallbackHandler

class ChainCallbackHandler(BaseCallbackHandler):
    def on_chain_start(self, serialized, inputs, **kwargs):
        print(f"链开始执行...")

    def on_chain_end(self, outputs, **kwargs):
        print(f"链执行完成!")

chain = PromptTemplate.from_template("解释{topic}") | ChatOpenAI(model="gpt-4o") | StrOutputParser()

result = chain.invoke(
    {"topic": "人工智能"},
    config={"callbacks": [ChainCallbackHandler()]}
)
```

## 预定义回调处理器

### StdOutCallbackHandler

```python
from langchain_core.callbacks import StdOutCallbackHandler
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(
    model="gpt-4o",
    callbacks=[StdOutCallbackHandler()]
)

response = llm.invoke("解释量子计算")
```

### StreamingStdOutCallbackHandler

```python
from langchain_core.callbacks import StreamingStdOutCallbackHandler

llm = ChatOpenAI(
    model="gpt-4o",
    streaming=True,
    callbacks=[StreamingStdOutCallbackHandler()]
)

for chunk in llm.stream("写一篇关于春天的散文"):
    print(chunk.content, end="", flush=True)
```

## 异步回调

### AsyncCallbackHandler

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
        model="gpt-4o",
        callbacks=[handler]
    )

    response = await llm.ainvoke("异步测试")
    print(response.content)

asyncio.run(run_async())
```

## 实际应用

### 1. 成本追踪

```python
from langchain_core.callbacks import BaseCallbackHandler
from langchain_openai import ChatOpenAI
from datetime import datetime

class CostTracker(BaseCallbackHandler):
    def __init__(self):
        self.total_tokens = 0
        self.total_cost = 0
        self.requests = []

    def on_chat_model_end(self, response, **kwargs):
        usage = response.usage_metadata

        input_tokens = usage.get("input_tokens", 0)
        output_tokens = usage.get("output_tokens", 0)
        total = usage.get("total_tokens", 0)

        cost = (input_tokens * 0.03 + output_tokens * 0.06) / 1000

        self.total_tokens += total
        self.total_cost += cost
        self.requests.append({
            "time": datetime.now(),
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "cost": cost
        })

    def get_report(self):
        return {
            "总Token数": self.total_tokens,
            "总成本": f"${self.total_cost:.4f}",
            "请求数": len(self.requests)
        }

tracker = CostTracker()
llm = ChatOpenAI(model="gpt-4o", callbacks=[tracker])

for i in range(5):
    llm.invoke(f"生成内容 {i}")

print(tracker.get_report())
```

### 2. 性能监控

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

### 多个处理器

```python
handler1 = LoggingHandler()
handler2 = CostTracker()
handler3 = PerformanceMonitor()

handlers = [handler1, handler2, handler3]

llm = ChatOpenAI(
    model="gpt-4o",
    callbacks=handlers
)
```

## 上下文传递

### 使用 metadata

```python
from langchain_core.callbacks import BaseCallbackHandler

class ContextHandler(BaseCallbackHandler):
    def on_chat_model_start(self, serialized, messages, **kwargs):
        metadata = kwargs.get("metadata", {})
        tags = metadata.get("tags", [])
        print(f"处理标签: {tags}")

llm = ChatOpenAI(callbacks=[ContextHandler()])

chain.invoke(
    {"input": "query"},
    config={
        "metadata": {"user_id": "123", "tags": ["production"]}
    }
)
```

## 最佳实践

| 实践 | 说明 |
|------|------|
| **分离关注点** | 不同功能使用不同 Handler |
| **性能考虑** | 避免在回调中执行重操作 |
| **异常处理** | 回调中的异常不应中断主流程 |
| **资源管理** | 使用 context manager 管理资源 |
| **日志级别** | 生产环境使用适当日志级别 |

## 总结

Callback 是 LangChain 监控和扩展的核心机制：

| 事件类型 | 常见用途 |
|---------|---------|
| **Chain 事件** | 执行流程追踪 |
| **LLM 事件** | Token 消耗、性能监控 |
| **Tool 事件** | 工具使用分析 |

掌握 Callback，可以实现详细日志和监控、性能分析、成本追踪、流式输出和错误处理。