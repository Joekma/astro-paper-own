---
title: 'Agent 记忆系统：短期记忆、长期记忆与用户画像'
author: Joekma
pubDatetime: 2026-05-16T00:00:00.000+08:00
modDatetime: 2026-05-16T00:00:00.000+08:00
slug: agent-memory-system
description: '系统讲解 Agent 记忆设计，包括会话状态、工作记忆、长期记忆、用户画像、检索记忆、遗忘机制和安全边界。'
tags:
  - AI
  - Agent
  - Memory
  - OpenClaw
  - Hermes
draft: false
series: Agent
seriesOrder: 5
language: zh-CN
---

## 概述

记忆让 Agent 从一次性工具变成长期助手。没有记忆，Agent 每次都要重新认识用户、项目和环境；记忆过多，又会带来隐私、成本、幻觉固化和上下文污染。

好的记忆系统不是“什么都记住”，而是“只记住稳定、可复用、经过验证的信息，并允许修正和遗忘”。

## 记忆的层次

| 层次 | 生命周期 | 用途 |
| --- | --- | --- |
| 当前消息 | 单次推理 | 理解用户当前输入 |
| 会话历史 | 当前会话 | 保持多轮上下文 |
| 工作记忆 | 当前任务 | 记录计划、进度、临时变量 |
| 项目记忆 | 项目周期 | 记录项目结构、约定、常见命令 |
| 用户画像 | 长期 | 记录偏好、沟通方式、授权边界 |
| 经验记忆 | 长期 | 记录解决问题的方法和失败教训 |
| 检索记忆 | 长期且大规模 | 搜索过去会话、文档和知识库 |

## 短期记忆

短期记忆服务当前任务。它通常包括：

- 用户目标
- 当前计划
- 已执行步骤
- 工具返回结果
- 待确认问题
- 错误和修复尝试

短期记忆适合放在会话状态或 checkpoint 中。LangGraph 的 persistence 通过 checkpoint 保存图状态，支持 human-in-the-loop、memory、time travel 和 fault-tolerance，这类机制非常适合长任务 Agent。

## 长期记忆

长期记忆保存跨会话仍然有价值的信息，例如：

- 用户常用技术栈
- 项目部署方式
- 常见测试命令
- 用户不希望 Agent 做的事
- 某个系统的登录方式
- 已验证的故障排查流程

Hermes Agent 的内置记忆由 `MEMORY.md` 和 `USER.md` 两个文件组成，并设置字符限制，避免记忆无限膨胀。这个设计非常务实：长期记忆应该精炼，而不是变成聊天历史仓库。

## 用户画像

用户画像不是“越详细越好”。Agent 只应该保存能提升协作质量的信息：

```text
应该保存：
- 用户偏好中文回答
- 用户使用 Windows + PowerShell
- 某项目使用 pnpm 构建
- 用户希望高风险命令先确认

不应该保存：
- 一次性情绪表达
- 未确认的身份推测
- 短期任务细节
- 密码、token、私钥
```

用户画像必须可查看、可编辑、可删除。

## OpenClaw 的工作区记忆

OpenClaw 的 Agent workspace 把工作区当作 Agent 的家。标准文件包括：

- `AGENTS.md`：操作指令
- `SOUL.md`：人格和语气
- `USER.md`：用户信息
- `TOOLS.md`：工具约定
- `HEARTBEAT.md`：心跳任务清单
- `memory/YYYY-MM-DD.md`：每日记忆日志
- `MEMORY.md`：长期记忆
- `skills/`：工作区技能

这个结构说明，记忆不只是向量库。对个人 Agent 来说，普通 Markdown 文件也可以成为透明、可审计、可编辑的记忆层。

## Hermes Agent 的记忆边界

Hermes Agent 的持久记忆强调 bounded 和 curated。内置记忆有容量限制，并且在会话开始时作为冻结快照注入系统提示。

这种设计有两个好处：

- 成本可控：每次会话注入的长期记忆不会无限增长。
- 状态稳定：当前会话不会因为记忆文件中途变化而反复漂移。

Hermes 还支持外部记忆提供商，用于更深层的语义搜索、知识图谱和跨会话建模。但外部记忆应该补充内置记忆，而不是替代清晰的用户画像和核心规则。

## 记忆写入策略

不要让 Agent 每轮都写记忆。更稳妥的触发条件包括：

- 用户明确要求记住
- 用户纠正了 Agent 的错误
- Agent 完成了复杂任务并总结出可复用流程
- 发现稳定的项目约定
- 某个失败原因未来很可能再次出现

写入前应问三个问题：

1. 这条信息未来是否仍然有效？
2. 是否经过用户确认或工具验证？
3. 是否包含隐私或敏感凭据？

## 遗忘机制

长期运行的 Agent 会产生记忆债务。遗忘机制至少包括：

- 用户手动删除
- 过期清理
- 低价值记忆归档
- 冲突记忆合并
- 错误记忆修正

Hermes Agent 的 Curator 机制用于维护 agent-created skills，例如标记闲置技能、归档过时技能、保留备份。记忆系统也应该有类似的生命周期管理。

## 记忆与搜索的区别

| 维度 | 长期记忆 | 会话搜索 |
| --- | --- | --- |
| 内容 | 精炼事实、偏好、规则 | 历史对话和执行记录 |
| 注入方式 | 会话开始时直接加载 | 需要时检索 |
| 成本 | 固定 | 按需 |
| 风险 | 错误会长期影响行为 | 检索不准会影响当前任务 |
| 适用 | 稳定信息 | 查找过去发生过什么 |

记忆不是搜索的替代品。记忆负责“我应该一直知道什么”，搜索负责“我需要时再去查什么”。

## 安全风险

记忆系统的主要风险包括：

- 保存敏感信息
- 保存错误结论
- 被提示注入诱导写入恶意规则
- 在群聊或共享环境中泄露私人记忆
- 不同用户记忆串用

建议策略：

- 私人记忆只用于私人会话。
- 群聊中禁用用户私人画像。
- 写入记忆前做敏感信息检测。
- 长期记忆变更要可追踪。
- 高风险规则不能由网页内容直接写入。

## 实操：实现一个 Markdown 记忆层

Hermes 的 `memory_tool.py` 把 `MEMORY.md` 和 `USER.md` 当作内置记忆入口。我们可以先实现一个更小的版本：只允许追加经过用户确认的记忆，并限制文件大小。

创建 `memory_store.py`：

```python
from pathlib import Path
from datetime import datetime

MEMORY_DIR = Path("agent_memory")
MEMORY_DIR.mkdir(exist_ok=True)
MEMORY_FILE = MEMORY_DIR / "MEMORY.md"
USER_FILE = MEMORY_DIR / "USER.md"
MAX_CHARS = 12_000


def read_memory() -> str:
    parts = []
    for path in [USER_FILE, MEMORY_FILE]:
        if path.exists():
            parts.append(f"# {path.name}\n{path.read_text(encoding='utf-8')}")
    return "\n\n".join(parts)


def append_memory(kind: str, text: str) -> str:
    if kind not in {"memory", "user"}:
        raise ValueError("kind must be memory or user")
    if any(secret in text.lower() for secret in ["api_key", "password", "token", "secret"]):
        raise ValueError("refuse to store possible secret")

    path = USER_FILE if kind == "user" else MEMORY_FILE
    old = path.read_text(encoding="utf-8") if path.exists() else ""
    entry = f"\n- {datetime.now().date()}: {text.strip()}\n"
    new_text = (old + entry)[-MAX_CHARS:]
    path.write_text(new_text, encoding="utf-8")
    return f"saved to {path}"


if __name__ == "__main__":
    append_memory("user", "用户偏好中文回答，喜欢先给结论再给步骤")
    append_memory("memory", "本项目使用 npm.cmd run build 校验 Astro 构建")
    print(read_memory())
```

运行：

```bash
python memory_store.py
```

接入 Agent Loop 时，在组装上下文阶段加入：

```python
system_context = f"""
你是一个任务执行 Agent。

长期记忆：
{read_memory()}
"""
```

注意两个边界：

- 只有用户明确要求或验证过的事实才写入。
- 不要把 token、密码、一次性网页内容写进长期记忆。

## 小结

记忆是 Agent 个性化和长期协作的基础，但它必须被管理。OpenClaw 的工作区文件展示了透明记忆的价值，Hermes Agent 的 bounded memory 展示了容量控制的重要性。真正可用的 Agent 记忆系统，应该同时具备保存、检索、修正和遗忘能力。

## 参考资料

- [Hermes Agent Persistent Memory](https://hermes-agent.nousresearch.com/docs/user-guide/features/memory/)
- [Hermes Agent Memory Tool Source](https://github.com/NousResearch/hermes-agent/blob/main/tools/memory_tool.py)
- [OpenClaw Agent workspace](https://documentation.openclaw.ai/concepts/agent-workspace)
- [LangGraph Persistence](https://docs.langchain.com/oss/python/langgraph/persistence)
- [OpenAI Agents SDK Sessions](https://openai.github.io/openai-agents-python/sessions/)
