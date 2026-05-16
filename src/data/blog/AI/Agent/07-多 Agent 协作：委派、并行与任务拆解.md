---
title: '多 Agent 协作：委派、并行与任务拆解'
author: Joekma
pubDatetime: 2026-05-16T00:00:00.000+08:00
modDatetime: 2026-05-16T00:00:00.000+08:00
slug: multi-agent-collaboration
description: '讲解多 Agent 系统中的任务拆解、委派、并行执行、共享状态、冲突控制和结果整合，并结合 OpenClaw、Hermes Agent 与 OpenAI Agents SDK。'
tags:
  - AI
  - Agent
  - Multi-Agent
  - Delegation
  - Hermes
draft: false
series: Agent
language: zh-CN
---

## 概述

多 Agent 协作不是简单地“多开几个模型”。它的核心是把复杂任务拆成多个边界清晰、可并行、可验证的子任务，再由主控 Agent 进行协调、合并和验收。

如果拆分不当，多 Agent 只会放大混乱：重复工作、互相覆盖文件、争抢资源、成本上涨、上下文不一致。

## 适合多 Agent 的任务

适合拆分的任务通常具有以下特征：

- 子任务之间依赖较弱
- 可以独立验证结果
- 写入范围可以隔离
- 信息收集可以并行
- 主 Agent 不需要每一步都等待

例如：

| 任务 | 拆分方式 |
| --- | --- |
| 大型代码迁移 | 按模块分给不同 worker |
| 技术调研 | 不同 agent 调研不同方案 |
| 文档体系生成 | 按章节分配写作，再统一风格 |
| Bug 排查 | 一个复现，一个查日志，一个看最近变更 |
| 数据分析 | 一个清洗数据，一个建模，一个做可视化 |

## 不适合多 Agent 的任务

不适合：

- 单文件小改动
- 需求高度模糊
- 子任务强依赖
- 需要频繁共享同一状态
- 风险很高且难以回滚
- 输出无法客观验证

多 Agent 的目标是缩短关键路径，而不是制造“热闹的并发”。

## 协作模式

### 1. Manager-Worker

主 Agent 负责任务拆解、上下文分发、结果合并和最终验收；Worker 只负责明确范围内的执行。

```text
Manager
  ├── Worker A：实现认证模块
  ├── Worker B：更新数据库迁移
  └── Worker C：补充测试
```

这是最常用、也最容易治理的模式。

### 2. Specialist Handoff

当任务需要专业能力时，主 Agent 将控制权交给专门 Agent。例如：

- 代码审查 Agent
- 安全审计 Agent
- 数据分析 Agent
- 文档 Agent
- 浏览器自动化 Agent

OpenAI Agents SDK 中的 handoffs 就是这种思想：让 agent 将任务移交给更适合的 agent。

### 3. Debate / Review

多个 Agent 从不同角度评估同一个方案，最后由主 Agent 选择或综合。

适合：

- 架构决策
- 安全审查
- 复杂问题诊断
- 方案权衡

不适合简单执行任务，因为成本较高。

### 4. Pipeline

一个 Agent 的输出成为另一个 Agent 的输入：

```text
需求分析 → 方案设计 → 实现 → 测试 → 文档
```

Pipeline 易于追踪，但并行度较低。

## Hermes Agent 的委派能力

Hermes Agent 的工具集中包含 `delegation`，并支持子代理任务委派。它还提供 Kanban 这类多 Agent 工作队列能力，用于多 profile / 多 worker 的协作。

这种设计说明，多 Agent 不只是“运行多个会话”，还需要：

- 任务队列
- worker 领取机制
- 状态记录
- 阻塞和完成标记
- 心跳
- 失败回收

## OpenClaw 的多 Agent 启发

OpenClaw 的 multi-agent routing 强调按 agent、workspace 或 sender 隔离会话。对个人 Agent 来说，这非常重要：

- 工作 Agent 不应该污染生活 Agent 的记忆。
- 不同项目应该使用不同 workspace。
- 不同通道来源可以路由到不同 agent。
- 高风险任务可以交给隔离配置的 agent。

多 Agent 的第一原则是隔离，其次才是协作。

## 状态共享

多 Agent 协作时，状态共享要非常克制。

推荐共享：

- 任务目标
- 输入资料
- 写入边界
- 验收标准
- 当前阻塞
- 最终产物路径

避免共享：

- 全量聊天历史
- 无关工具日志
- 私人记忆
- 未验证猜测
- 其他 worker 的临时思路

共享状态可以放在：

- 任务描述
- issue
- kanban board
- 共享 markdown
- 数据库表
- checkpoint store

## 写入冲突控制

如果多个 Agent 会修改文件，必须明确所有权：

```text
Worker A：只修改 src/auth/**
Worker B：只修改 db/migrations/**
Worker C：只修改 tests/auth/**
```

冲突控制策略：

- 每个 worker 有独立写入范围。
- 主 Agent 负责整合。
- worker 不得回滚其他人的修改。
- 合并前运行测试。
- 大规模变更使用分支或 worktree。

Hermes 的 worktree mode 和 Kanban worker 思路，都是为了降低并发写入风险。

## 结果整合

主 Agent 合并结果时要检查：

- 子任务是否完成
- 输出是否符合约束
- 是否存在互相矛盾
- 是否有遗漏
- 是否需要二次验证
- 是否引入额外风险

建议使用统一结果格式：

```markdown
## 完成内容

## 修改文件

## 验证结果

## 风险和未完成项
```

## 多 Agent 评估指标

| 指标 | 说明 |
| --- | --- |
| 关键路径时间 | 是否真的比单 Agent 更快 |
| 重复工作率 | 是否多个 Agent 做了同一件事 |
| 冲突次数 | 文件、状态、决策是否冲突 |
| 人工介入次数 | 是否需要频繁协调 |
| 成本 | token、工具调用和外部 API 成本 |
| 结果质量 | 是否提高成功率和覆盖面 |

## 实操：用 asyncio 模拟 Manager-Worker

Hermes 的 delegation 和 Kanban 方向，本质是主 Agent 分配任务、worker 并行执行、主 Agent 合并结果。先用 Python 模拟这个流程。

创建 `multi_agent_demo.py`：

```python
import asyncio
from dataclasses import dataclass


@dataclass
class Task:
    owner: str
    instruction: str
    write_scope: str


async def worker(task: Task) -> dict:
    print(f"[{task.owner}] start: {task.instruction}")
    await asyncio.sleep(0.5)
    return {
        "owner": task.owner,
        "scope": task.write_scope,
        "summary": f"完成 {task.instruction}",
        "risk": "未运行真实测试，仅为 demo",
    }


async def manager(goal: str) -> list[dict]:
    tasks = [
        Task("worker-a", "整理 Agent Loop 章节", "docs/loop.md"),
        Task("worker-b", "整理工具调用章节", "docs/tools.md"),
        Task("worker-c", "整理安全检查清单", "docs/security.md"),
    ]
    print(f"[manager] goal: {goal}")
    print("[manager] dispatch tasks")
    results = await asyncio.gather(*(worker(task) for task in tasks))
    print("[manager] merge results")
    return results


if __name__ == "__main__":
    output = asyncio.run(manager("生成一套 Agent 实操文档"))
    for item in output:
        print(item)
```

运行：

```bash
python multi_agent_demo.py
```

这个 demo 要刻意保留 `write_scope`，因为多 Agent 最大的坑就是写入冲突。真实代码任务中可以把它升级成：

```text
worker-a 只允许修改 src/auth/**
worker-b 只允许修改 db/migrations/**
worker-c 只允许修改 tests/auth/**
```

主 Agent 最后负责合并、测试和验收，而不是让 worker 互相覆盖。

## 小结

多 Agent 协作的价值在于并行和专业化，但前提是任务边界清晰、状态共享克制、写入范围隔离。OpenClaw 提醒我们要按 agent/workspace/sender 隔离上下文；Hermes Agent 提醒我们需要 delegation、Kanban 和 profile 这样的协作基础设施。没有治理的多 Agent 只是多个模型一起制造不确定性。

## 参考资料

- [Hermes Agent bundled skill: Hermes Agent](https://hermes-agent.nousresearch.com/docs/user-guide/skills/bundled/autonomous-ai-agents/autonomous-ai-agents-hermes-agent)
- [Hermes Agent Tools & Toolsets](https://hermes-agent.nousresearch.com/docs/user-guide/features/tools/)
- [OpenClaw Documentation](https://openclawlab.com/en/docs/)
- [OpenAI Agents SDK Handoffs](https://openai.github.io/openai-agents-python/handoffs/)
- [LangGraph Overview](https://docs.langchain.com/oss/python/langgraph/overview)
