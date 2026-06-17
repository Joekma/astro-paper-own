---
title: 'AI Agent 入门指南：核心概念与演进'
author: Joekma
pubDatetime: 2026-05-16T00:00:00.000+08:00
modDatetime: 2026-05-16T00:00:00.000+08:00
slug: ai-agent-introduction
description: '系统梳理 AI Agent 的定义、核心组件、能力边界和演进路线，并从 OpenClaw 与 Hermes Agent 中提炼个人智能代理系统的设计经验。'
tags:
  - AI
  - Agent
  - OpenClaw
  - Hermes
  - 智能代理
draft: false
series: Agent
seriesOrder: 2
language: zh-CN
---

## 概述

AI Agent 是一种能够围绕目标持续感知上下文、调用工具、执行动作并根据反馈修正策略的智能系统。它不只是一次问答，而是一条运行链路：接收任务、组装上下文、推理计划、选择工具、执行动作、观察结果、继续迭代，直到达到终止条件。

从 OpenClaw 和 Hermes Agent 的设计可以看到，现代 Agent 正在从“带工具的聊天机器人”演进为“长期运行的个人执行环境”。OpenClaw 强调本地优先、Gateway、多通道入口和工作区文件；Hermes Agent 强调技能、记忆、工具集、终端后端、定时任务和多平台运行。

## Agent 与普通聊天机器人的区别

| 维度 | 普通聊天机器人 | AI Agent |
| --- | --- | --- |
| 目标 | 回答当前问题 | 完成一个可持续推进的任务 |
| 上下文 | 主要依赖当前对话 | 结合记忆、文件、会话、工具结果 |
| 行动能力 | 通常只输出文本 | 可以调用 API、读写文件、执行命令、操作浏览器 |
| 过程 | 单轮或短对话 | 多轮循环、可暂停、可恢复 |
| 风险 | 输出错误信息 | 可能错误执行真实动作，需要权限边界 |
| 评估 | 看回答是否正确 | 看任务结果、成本、时延、安全和可追溯性 |

可以把 Agent 理解为“模型 + 工具 + 状态 + 策略 + 安全边界”的组合。

## 核心组件

### 1. 模型

模型负责理解任务、生成计划、选择工具、解释观察结果和合成最终输出。能力越强的模型，越适合处理长任务、模糊需求和多步推理。但模型不是系统的全部，Agent 的可靠性更多取决于运行时如何约束模型。

### 2. 工具

工具让 Agent 能够连接外部世界，例如：

- 搜索网页
- 调用数据库
- 读写文件
- 执行 Shell 命令
- 操作浏览器
- 调用消息平台
- 创建日程或自动化任务

OpenAI Agents SDK 将工具、handoff、guardrails、session 和 tracing 作为核心能力；MCP 则把外部数据源、工具和提示封装为可复用协议接口。

### 3. 状态

状态包括当前任务进度、会话历史、短期工作记忆、长期记忆、文件上下文和工具返回结果。没有状态，Agent 就很难做长期任务；状态过多，又会带来上下文污染、隐私泄露和成本上涨。

### 4. 运行循环

典型 Agent Loop 如下：

```text
用户目标
  ↓
上下文装配
  ↓
模型推理
  ↓
选择工具
  ↓
执行动作
  ↓
观察结果
  ↓
继续、修正或结束
```

OpenClaw 的 Agent Loop 文档把一次真实运行描述为从 intake、context assembly、model inference、tool execution、streaming replies 到 persistence 的完整路径。这个定义很适合作为个人 Agent 的基本运行模型。

### 5. 安全边界

一旦 Agent 能够执行命令、访问文件、使用浏览器和发送消息，安全边界就变成架构核心，而不是附加功能。常见边界包括：

- 工具白名单
- 操作审批
- 沙箱执行
- 只读工作区
- 最小权限凭据
- 网络访问限制
- 日志和审计
- 高风险命令扫描

Hermes Agent 的安全文档强调 command approval、container isolation、messaging authorization 等多层防护；OpenClaw 则将 Gateway、工作区、沙箱和远程访问配置作为主要安全面。

## OpenClaw 带来的启发

OpenClaw 更像一个“个人 Agent 操作系统入口”。它的重点不是只在终端里完成一次任务，而是让用户通过 Telegram、WhatsApp、Discord、Slack、iMessage 等通道触发同一个本地 Gateway。

它的设计启发包括：

- 多通道入口可以降低使用门槛。
- Gateway 应成为会话、路由、认证和通道连接的控制平面。
- 工作区文件可以承载身份、人格、工具约定、长期记忆和启动流程。
- 本地优先能降低隐私风险，但不等于天然安全，仍要有绑定地址、认证、沙箱和权限配置。

## Hermes Agent 带来的启发

Hermes Agent 更像一个“会学习的终端型 Agent”。它强调技能系统和持久记忆：当 Agent 完成复杂任务、被用户纠正、发现可复用流程时，可以把经验沉淀成 skill。

它的设计启发包括：

- 技能是过程记忆，比单纯聊天历史更可复用。
- 记忆需要边界和容量控制，不能无限塞入系统提示。
- 工具集应该按平台启用或禁用，而不是所有能力默认暴露。
- 定时任务、消息投递、子代理和多平台 Gateway 是 Agent 从“助手”到“自动化执行者”的关键跃迁。

## 能力边界

Agent 并不意味着完全自治。真实系统中应该明确以下边界：

| 边界 | 应该明确的问题 |
| --- | --- |
| 权限边界 | 哪些文件、命令、API 可以访问 |
| 决策边界 | 哪些动作必须用户确认 |
| 时间边界 | 任务最多执行多久，是否允许后台继续 |
| 成本边界 | 最大 token、最大工具调用次数、最大外部 API 成本 |
| 记忆边界 | 什么可以长期保存，什么必须遗忘 |
| 交付边界 | 最终产物是什么，如何验证完成 |

## 实践建议

构建自己的 Agent 系统时，可以按以下路线推进：

1. 先做单任务 Agent：明确输入、工具、输出和校验。
2. 再做可恢复会话：保存任务状态和工具结果。
3. 增加工具审批：先保护 Shell、文件写入、消息发送和支付类操作。
4. 引入记忆：只保存稳定事实、偏好和经过验证的经验。
5. 抽象技能：把重复流程写成可加载的 skill。
6. 扩展通道：从终端扩展到聊天平台、Webhook、Cron。
7. 建立评估：用任务成功率、人工介入次数、成本、回滚次数衡量效果。

## 实操：先做一个能跑的 Mini Agent

先不要急着接大模型。OpenClaw 和 Hermes 的源码都把 Agent 拆成“运行时 + 工具 + 工作区 + 记忆/技能”，所以我们也先用最小代码跑通这个骨架。

创建 `mini_agent.py`：

```python
from pathlib import Path
import sys

WORKSPACE = Path("workspace")
WORKSPACE.mkdir(exist_ok=True)


def list_files(_: str) -> str:
    return "\n".join(str(p) for p in WORKSPACE.rglob("*") if p.is_file()) or "workspace is empty"


def write_note(text: str) -> str:
    path = WORKSPACE / "note.md"
    path.write_text(text, encoding="utf-8")
    return f"wrote {path}"


TOOLS = {
    "list_files": list_files,
    "write_note": write_note,
}


def decide(user_input: str) -> tuple[str, str]:
    if "列文件" in user_input or "list" in user_input.lower():
        return "list_files", ""
    if "记录" in user_input or "note" in user_input.lower():
        return "write_note", user_input
    return "write_note", f"待处理任务：{user_input}"


def run(user_input: str) -> str:
    tool_name, args = decide(user_input)
    print(f"[plan] call tool: {tool_name}")
    result = TOOLS[tool_name](args)
    return f"[result] {result}"


if __name__ == "__main__":
    print(run(" ".join(sys.argv[1:]) or "记录：学习 Agent Loop"))
```

运行：

```bash
python mini_agent.py "记录：先把工具、状态、审批做出来"
python mini_agent.py "列文件"
```

这个例子故意不用 LLM，因为它要先让你看到 Agent 的骨架：

- `decide()` 是模型决策层的替身。
- `TOOLS` 是 Hermes `tools/registry.py` 里中心化工具注册思想的极简版本。
- `WORKSPACE` 是 OpenClaw workspace 思想的极简版本。
- `run()` 就是最小 Agent Loop。

下一步才是把 `decide()` 换成真实模型的 function calling，让模型输出 `{ "tool": "...", "args": "..." }`。

## 小结

AI Agent 的本质不是“让模型自己随便做事”，而是为模型提供一个可控的执行环境。OpenClaw 展示了个人 Agent 如何通过 Gateway、通道和工作区长期运行；Hermes Agent 展示了技能、记忆和工具集如何让 Agent 逐步贴合用户环境。把两者结合起来，可以得到一条务实路线：先可控，再可用，最后才追求更强自治。

## 参考资料

- [OpenClaw Documentation](https://openclawlab.com/en/docs/)
- [OpenClaw Agent Loop](https://openclawlab.com/en/docs/concepts/agent-loop/)
- [OpenClaw Agent workspace](https://documentation.openclaw.ai/concepts/agent-workspace)
- [Hermes Agent Docs](https://hermes-agent.nousresearch.com/docs/)
- [Hermes Agent Tools & Toolsets](https://hermes-agent.nousresearch.com/docs/user-guide/features/tools/)
- [Hermes Agent Tool Registry Source](https://github.com/NousResearch/hermes-agent/blob/main/tools/registry.py)
- [OpenAI Agents SDK](https://openai.github.io/openai-agents-python/)
- [Model Context Protocol](https://modelcontextprotocol.io/docs/getting-started/intro)
