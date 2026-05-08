---
title: LangGraph 高级特性：循环、条件分支与持久化
author: Joekma
pubDatetime: 2026-05-08T00:00:00.000+08:00
modDatetime: 2026-05-08T00:00:00.000+08:00
slug: langgraph-advanced-features
description: '深入探讨LangGraph的高级特性，包括复杂循环、条件分支、状态持久化、并发执行和性能优化。'
tags:
  - LangGraph
  - LLM
  - AI
  - Advanced
  - Persistence
draft: false
language: zh-CN
---

## 概述

LangGraph 的强大之处不仅在于其基础的有状态工作流，更在于其丰富的高级特性。本文将深入探讨 LangGraph 的高级功能，包括复杂循环控制流、条件分支逻辑、状态持久化机制、并发执行能力以及性能优化策略，帮助你构建更加复杂和强大的 AI 应用。

## 复杂循环控制流

### 多条件循环

在实际应用中，循环通常需要根据多个条件来决定是否继续：

```python
from typing import TypedDict, Annotated, Literal
from langgraph.graph import StateGraph, END
import operator

class ComplexLoopState(TypedDict):
    data: list
    processed_count: int
    total_count: int
    errors: Annotated[list, operator.add]
    should_retry: bool
    quality_score: float

def process_batch(state):
    """处理一批数据"""
    processed = state["processed_count"]
    total = state["total_count"]
    batch_size = 5
    
    new_processed = min(processed + batch_size, total)
    
    # 模拟处理，可能产生错误
    import random
    if random.random() < 0.2:  # 20% 概率出错
        return {
            "processed_count": new_processed,
            "errors": ["Batch processing error"],
            "quality_score": max(0, state["quality_score"] - 0.1)
        }
    
    return {
        "processed_count": new_processed,
        "quality_score": min(1.0, state["quality_score"] + 0.15)
    }

def evaluate_continue(state):
    """评估是否继续循环"""
    should_retry = state["should_retry"]
    errors = state["errors"]
    quality = state["quality_score"]
    processed = state["processed_count"]
    total = state["total_count"]
    
    # 多种退出条件
    if processed >= total:
        return "complete"
    elif should_retry and len(errors) < 3:
        return "retry"
    elif quality < 0.3:
        return "quality_warning"
    else:
        return "continue"

def handle_quality_warning(state):
    """处理质量问题"""
    return {
        "should_retry": True,
        "quality_score": 0.5  # 重置质量分数
    }

def finalize(state):
    """完成处理"""
    return {
        "data": state["data"] + ["Final result"]
    }

graph = StateGraph(ComplexLoopState)
graph.add_node("process", process_batch)
graph.add_node("evaluate", evaluate_evaluation_node)
graph.add_node("quality_handler", handle_quality_warning)
graph.add_node("finalize", finalize)

graph.add_edge("__start__", "process")
graph.add_edge("process", "evaluate")
graph.add_conditional_edges(
    "evaluate",
    lambda x: x,
    {
        "complete": "finalize",
        "retry": "process",
        "quality_warning": "quality_handler",
        "continue": "process"
    }
)
graph.add_edge("quality_handler", "process")
graph.add_edge("finalize", END)

app = graph.compile()
```

### 嵌套循环

复杂场景下可能需要嵌套的循环结构：

```python
class NestedLoopState(TypedDict):
    outer_loop_var: int
    inner_loop_var: int
    results: Annotated[list, operator.add]
    phase: str

def outer_loop_body(state):
    """外层循环体"""
    return {
        "outer_loop_var": state["outer_loop_var"] + 1,
        "inner_loop_var": 0,
        "phase": "inner"
    }

def inner_loop_body(state):
    """内层循环体"""
    return {
        "inner_loop_var": state["inner_loop_var"] + 1,
        "results": [f"({state['outer_loop_var']}, {state['inner_loop_var']})"]
    }

def check_inner_loop(state) -> Literal["inner_body", "outer_check"]:
    if state["inner_loop_var"] < 3:
        return "inner_body"
    return "outer_check"

def check_outer_loop(state) -> Literal["outer_body", "__end__"]:
    if state["outer_loop_var"] < 2:
        return "outer_body"
    return "__end__"

graph = StateGraph(NestedLoopState)
graph.add_node("outer_body", outer_loop_body)
graph.add_node("inner_body", inner_loop_body)
graph.add_node("inner_check", lambda s: {})
graph.add_node("outer_check", lambda s: {})

graph.add_edge("__start__", "outer_body")
graph.add_edge("outer_body", "inner_check")
graph.add_conditional_edges(
    "inner_check",
    check_inner_loop,
    {"inner_body": "inner_body", "outer_check": "outer_check"}
)
graph.add_edge("inner_body", "inner_check")
graph.add_conditional_edges(
    "outer_check",
    check_outer_loop,
    {"outer_body": "outer_body", "__end__": END}
)
```

## 条件分支的高级用法

### 多层条件判断

```python
class MultiLayerBranchState(TypedDict):
    user_level: str
    request_type: str
    urgency: str
    response: str
    assigned_team: str

def classify_request(state):
    """多维度分类请求"""
    return {
        "user_level": "premium",
        "request_type": "technical",
        "urgency": "high"
    }

def route_to_team(state) -> str:
    """多层路由逻辑"""
    level = state["user_level"]
    req_type = state["request_type"]
    urgency = state["urgency"]
    
    # VIP 客户优先处理
    if level == "premium":
        if urgency == "critical":
            return "vip_emergency_team"
        elif req_type == "technical":
            return "vip_tech_team"
        else:
            return "vip_general_team"
    elif level == "standard":
        if req_type == "billing":
            return "billing_team"
        elif req_type == "technical":
            return "tech_support"
        else:
            return "general_support"
    else:
        return "community_forum"

def handle_by_team(state):
    """根据团队处理"""
    team = state["assigned_team"]
    
    handlers = {
        "vip_emergency_team": "VIP 紧急团队正在处理...",
        "vip_tech_team": "VIP 技术团队正在处理...",
        "billing_team": "账单团队正在处理...",
        "tech_support": "技术支持团队正在处理...",
        "general_support": "一般支持团队正在处理...",
        "community_forum": "建议您访问社区论坛..."
    }
    
    return {"response": handlers.get(team, "未知团队")}

graph = StateGraph(MultiLayerBranchState)
graph.add_node("classify", classify_request)
graph.add_node("route", lambda s: {"assigned_team": route_to_team(s)})
graph.add_node("handle", handle_by_team)

graph.add_edge("__start__", "classify")
graph.add_edge("classify", "route")
graph.add_edge("route", "handle")
graph.add_edge("handle", END)
```

### 动态条件边

```python
def dynamic_route_builder(state):
    """动态构建路由规则"""
    user_tier = state.get("user_tier", "free")
    features_enabled = state.get("features", [])
    
    routes = {}
    
    # 基础路由
    routes["process"] = "process"
    
    # 根据用户等级添加额外路由
    if user_tier in ["pro", "enterprise"]:
        routes["advanced"] = "advanced_process"
    
    # 根据功能启用情况添加路由
    if "analytics" in features_enabled:
        routes["analytics"] = "analytics_process"
    
    if "custom" in features_enabled:
        routes["custom"] = "custom_process"
    
    return routes

graph.add_conditional_edges(
    "classify",
    dynamic_route_builder,
    {
        "process": "process",
        "advanced_process": "advanced_process",
        "analytics_process": "analytics_process",
        "custom_process": "custom_process"
    }
)
```

## 状态持久化深入

### 数据库持久化

```python
from langgraph.checkpoint.postgres import PostgresSaver
from langgraph.checkpoint.sqlite import SqliteSaver

# PostgreSQL 持久化（生产环境推荐）
postgres_checkpointer = PostgresSaver.from_conn_string(
    "postgresql://user:password@localhost:5432/langgraph"
)
postgres_checkpointer.setup()

# SQLite 持久化（开发环境）
sqlite_checkpointer = SqliteSaver.from_conn_string("sqlite:///langgraph.db")

class PersistentState(TypedDict):
    messages: list
    user_id: str
    conversation_id: str
    metadata: dict

graph = StateGraph(PersistentState)
# ... 添加节点和边 ...
app = graph.compile(checkpointer=postgres_checkpointer)

# 创建对话
config = {
    "configurable": {
        "thread_id": "conv_123",
        "checkpoint_id": None  # 最新 checkpoint
    }
}

# 保存对话状态
result = app.invoke({
    "messages": [{"role": "user", "content": "你好"}],
    "user_id": "user_456",
    "conversation_id": "conv_123",
    "metadata": {"source": "web"}
}, config)

# 恢复对话
config_restore = {
    "configurable": {
        "thread_id": "conv_123",
        "checkpoint_id": result.get("metadata", {}).get("checkpoint_id")
    }
}

# 获取历史状态
history = list(app.get_state_history(config))
```

### 自定义持久化存储

```python
from langgraph.checkpoint.base import BaseCheckpointSaver
from typing import Any, Optional
import json
import redis

class RedisCheckpointSaver(BaseCheckpointSaver):
    """Redis 自定义检查点存储"""
    
    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client
        super().__init__()
    
    def put(
        self,
        config: dict,
        checkpoint: Any,
        metadata: dict,
        new_version: bool = False
    ) -> dict:
        """保存检查点"""
        thread_id = config["configurable"]["thread_id"]
        key = f"checkpoint:{thread_id}"
        
        data = {
            "checkpoint": checkpoint,
            "metadata": metadata
        }
        
        self.redis.set(key, json.dumps(data))
        return config
    
    def get(self, config: dict) -> Optional[Any]:
        """获取检查点"""
        thread_id = config["configurable"]["thread_id"]
        key = f"checkpoint:{thread_id}"
        
        data = self.redis.get(key)
        if data:
            return json.loads(data)["checkpoint"]
        return None
    
    def list(self, config: dict, limit: int = 10) -> list:
        """列出检查点"""
        pattern = f"checkpoint:{config['configurable']['thread_id']}*"
        keys = self.redis.keys(pattern)
        return keys[:limit]

redis_client = redis.Redis(host='localhost', port=6379)
redis_checkpointer = RedisCheckpointSaver(redis_client)
```

## 并发执行

### 并行节点执行

```python
from typing import TypedDict, Annotated
from langgraph.graph import StateGraph, END
import asyncio
import operator

class ParallelState(TypedDict):
    task_id: str
    results: Annotated[dict, lambda old, new: {**old, **new}]
    status: str

async def task_a(state):
    """任务 A"""
    await asyncio.sleep(0.5)  # 模拟耗时操作
    return {"results": {"task_a": "Result A"}}

async def task_b(state):
    """任务 B"""
    await asyncio.sleep(0.3)
    return {"results": {"task_b": "Result B"}}

async def task_c(state):
    """任务 C"""
    await asyncio.sleep(0.4)
    return {"results": {"task_c": "Result C"}}

def aggregate_results(state):
    """聚合结果"""
    return {
        "status": "completed",
        "results": state["results"]
    }

graph = StateGraph(ParallelState)
graph.add_node("task_a", task_a)
graph.add_node("task_b", task_b)
graph.add_node("task_c", task_c)
graph.add_node("aggregate", aggregate_results)

graph.add_edge("__start__", "task_a")
graph.add_edge("__start__", "task_b")
graph.add_edge("__start__", "task_c")
graph.add_edge("task_a", "aggregate")
graph.add_edge("task_b", "aggregate")
graph.add_edge("task_c", "aggregate")
graph.add_edge("aggregate", END)

# 编译为异步版本
app = graph.compile()

async def run_parallel():
    result = await app.ainvoke({
        "task_id": "123",
        "results": {},
        "status": "running"
    })
    return result

# 运行
result = asyncio.run(run_parallel())
```

### 消息传递模式

```python
class MessagePassingState(TypedDict):
    pipeline_id: str
    stages: Annotated[list, operator.add]
    messages: dict
    completed_stages: Annotated[list, operator.add]

def stage_1(state):
    result = "Stage 1 completed"
    return {
        "stages": ["stage_1"],
        "messages": {"stage_1": result},
        "completed_stages": [1]
    }

def stage_2(state):
    # 可以访问之前阶段的消息
    prev_msg = state["messages"].get("stage_1", "")
    result = f"Stage 2 processed: {prev_msg}"
    return {
        "stages": ["stage_2"],
        "messages": {"stage_2": result},
        "completed_stages": [2]
    }

def stage_3(state):
    # 访问所有之前消息
    all_msgs = state["messages"]
    result = f"Stage 3 analysis: {all_msgs}"
    return {
        "stages": ["stage_3"],
        "messages": {"stage_3": result},
        "completed_stages": [3]
    }

graph = StateGraph(MessagePassingState)
graph.add_node("stage_1", stage_1)
graph.add_node("stage_2", stage_2)
graph.add_node("stage_3", stage_3)

graph.add_edge("__start__", "stage_1")
graph.add_edge("stage_1", "stage_2")
graph.add_edge("stage_2", "stage_3")
graph.add_edge("stage_3", END)
```

## 错误处理与重试

### 自动重试机制

```python
from tenacity import retry, stop_after_attempt, wait_exponential

class ResilientState(TypedDict):
    data: str
    attempt_count: int
    result: str | None

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10)
)
def unreliable_operation(state):
    """可能失败的操作"""
    import random
    if random.random() < 0.7:  # 70% 失败率
        raise Exception("Random failure")
    return {"result": "Operation succeeded"}

def handle_success(state):
    return {"data": f"Final result: {state['result']}"}

def handle_failure(state):
    return {"data": "Fallback result after failures"}

def process_with_retry(state):
    try:
        result = unreliable_operation.invoke(state)
        return result
    except Exception as e:
        return {"result": f"Failed: {str(e)}"}

graph = StateGraph(ResilientState)
graph.add_node("process", process_with_retry)
graph.add_node("success", handle_success)
graph.add_node("failure", handle_failure)

graph.add_edge("__start__", "process")
graph.add_edge("process", "success")  # 简化处理
```

### 错误边界节点

```python
def error_boundary(state, error: Exception):
    """错误边界处理"""
    return {
        "error": str(error),
        "fallback_result": "Safe fallback value"
    }

def safe_node(state):
    return {"result": "Safe result"}

def error_recovery_node(state):
    return {"result": state.get("fallback_result", "Default")}

graph = StateGraph(ResilientState)
graph.add_node("safe_operation", safe_node)
graph.add_node("recovery", error_recovery_node)

# 设置错误处理
graph.add_edge("__start__", "safe_operation")

try:
    app = graph.compile()
except Exception as e:
    print(f"Graph compilation error: {e}")
```

## 性能优化

### 状态剪裁

```python
class OptimizedState(TypedDict):
    messages: Annotated[list, add_messages]
    short_term: str
    long_term_data: list

def trim_old_messages(state):
    """修剪旧消息以控制内存"""
    messages = state["messages"]
    
    # 只保留最近 20 条消息
    max_messages = 20
    if len(messages) > max_messages:
        return {"messages": messages[-max_messages:]}
    
    return {}

def checkpoint_with_trim(state):
    """带剪裁的检查点"""
    trimmed = trim_old_messages(state)
    return {**state, **trimmed}

# 在关键节点添加剪裁
graph.add_node("trim", checkpoint_with_trim)
```

### 条件跳过

```python
def should_skip_heavy_processing(state) -> Literal["heavy", "light"]:
    """根据条件决定处理路径"""
    if state.get("use_cache") and state.get("cached_result"):
        return "light"  # 使用缓存，跳过重处理
    return "heavy"  # 需要完整处理

def heavy_processing(state):
    """重量级处理"""
    return {"result": "Computed result"}

def light_processing(state):
    """轻量级处理（使用缓存）"""
    return {"result": state.get("cached_result")}

graph = StateGraph(OptimizedState)
graph.add_node("heavy", heavy_processing)
graph.add_node("light", light_processing)

graph.add_edge("__start__", "check_cache")
graph.add_conditional_edges(
    "check_cache",
    should_skip_heavy_processing,
    {"heavy": "heavy", "light": "light"}
)
```

## 事务与一致性

### 批量操作

```python
class BatchState(TypedDict):
    items: list
    processed: Annotated[list, operator.add]
    failed: Annotated[list, operator.add]
    transaction_log: Annotated[list, operator.add]

def process_batch(state):
    """批量处理项目"""
    items = state["items"]
    batch_results = {"processed": [], "failed": []}
    
    for item in items:
        try:
            # 处理每个项目
            result = process_item(item)
            batch_results["processed"].append(item)
        except Exception as e:
            batch_results["failed"].append({"item": item, "error": str(e)})
    
    return {
        "processed": batch_results["processed"],
        "failed": batch_results["failed"],
        "transaction_log": [f"Processed {len(batch_results['processed'])} items"]
    }

def rollback_on_failure(state):
    """失败时回滚"""
    if len(state["failed"]) > 0:
        # 回滚已处理的项目
        return {
            "items": state["items"] + state["processed"],
            "processed": [],
            "transaction_log": ["Transaction rolled back"]
        }
    return {}

graph = StateGraph(BatchState)
graph.add_node("batch_process", process_batch)
graph.add_node("rollback", rollback_on_failure)

graph.add_edge("__start__", "batch_process")
graph.add_edge("batch_process", "rollback")
graph.add_edge("rollback", END)
```

## 监控与可观测性

### 添加追踪

```python
from opentelemetry import trace

tracer = trace.get_tracer(__name__)

class TracedState(TypedDict):
    data: str
    trace_id: str

@tracer.start_as_current_span("custom_node")
def traced_node(state):
    span = trace.get_current_span()
    span.set_attribute("custom.attribute", state.get("data", ""))
    
    return {"result": "processed"}

# LangSmith 集成
from langgraph.checkpoint.langchain import LangChainCheckpointer
from langsmith import Client

langsmith_client = Client()
checkpointer = LangChainCheckpointer(
    client=langsmith_client,
    project_name="my-langgraph-app"
)
```

## 总结

本文深入探讨了 LangGraph 的高级特性：

| 特性 | 用途 |
|------|------|
| **复杂循环** | 多条件判断、嵌套循环 |
| **条件分支** | 多层路由、动态条件 |
| **持久化** | 数据库、Redis、自定义存储 |
| **并发执行** | 并行节点、消息传递 |
| **错误处理** | 重试机制、错误边界 |
| **性能优化** | 状态剪裁、条件跳过 |
| **事务处理** | 批量操作、回滚机制 |
| **可观测性** | 追踪、日志、监控 |

这些高级特性让你能够构建生产级别的复杂 AI 应用，处理各种边缘情况和性能要求。🎯
