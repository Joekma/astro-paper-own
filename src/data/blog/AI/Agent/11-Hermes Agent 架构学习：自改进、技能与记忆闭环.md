---
title: 'Hermes Agent 架构学习：自改进、技能与记忆闭环'
author: Joekma
pubDatetime: 2026-05-16T00:00:00.000+08:00
modDatetime: 2026-05-16T00:00:00.000+08:00
slug: hermes-agent-architecture-learning
description: '从 Hermes Agent 官方文档学习自改进 Agent 架构，分析工具集、技能、记忆、Cron、委派、安全扫描和多平台 Gateway。'
tags:
  - AI
  - Agent
  - Hermes
  - Skills
  - Memory
draft: false
series: Agent
language: zh-CN
---

## 概述

Hermes Agent 是 Nous Research 推出的开源 AI Agent 框架，定位于终端、消息平台和 IDE 中运行的自主编码与任务执行 Agent。它的核心特色是技能、持久记忆、多工具集、多平台 Gateway 和自改进闭环。

如果说 OpenClaw 更强调个人助手的入口和 Gateway，那么 Hermes Agent 更强调 Agent 如何在使用过程中积累经验，并把经验沉淀为可复用技能。

## 总体架构

```text
CLI / IDE / Messaging Gateway
        ↓
    Hermes Agent
        ↓
  Toolsets / Skills / Memory
        ↓
 Terminal / Files / Browser / Web / MCP
        ↓
 Sessions / Cron / Delegation / Curator
```

Hermes 文档中列出的能力非常广：Web 搜索、浏览器自动化、终端执行、文件编辑、记忆、委派、RL training、消息投递、Home Assistant、MCP 等。

## Toolsets

Hermes 将工具组织成 toolsets，例如：

- `web`
- `terminal`
- `file`
- `browser`
- `vision`
- `image_gen`
- `memory`
- `session_search`
- `cronjob`
- `delegation`
- `clarify`
- `safe`
- `rl`

这种方式比“所有工具默认可用”更合理。不同平台和任务可以启用不同 toolset，从而控制风险和成本。

## Terminal Backends

Hermes 的 terminal 工具支持多种后端：

| Backend | 场景 |
| --- | --- |
| local | 本机开发、可信任务 |
| docker | 隔离环境、安全执行 |
| ssh | 远程服务器 |
| singularity | HPC / rootless 容器 |
| modal | 云执行 |
| daytona | 持久远程开发环境 |
| vercel_sandbox | 云 microVM |

这说明 Agent 的“执行位置”本身应该是可配置的。高风险任务不应该默认在用户主机上直接执行。

## Skills 系统

Hermes 的 Skills 是按需加载的知识文档，位于 `~/.hermes/skills/`。技能可以来自：

- bundled skills
- official optional skills
- skills hub
- GitHub
- direct URL
- external skill directories
- agent-created skills

最重要的是 agent-managed skills。Agent 可以在完成复杂任务、发现非平凡流程或被用户纠正后，把经验写成 skill。这构成了 Hermes 自改进的核心闭环：

```text
执行任务
  ↓
遇到问题
  ↓
找到解法
  ↓
沉淀为 skill
  ↓
下次按需加载
```

## 渐进式加载

Hermes Skills 使用 progressive disclosure：

```text
skills_list()：加载技能索引
skill_view(name)：加载完整技能
skill_view(name, path)：加载具体引用文件
```

这能显著降低 token 消耗，也能避免无关技能干扰当前任务。

## Persistent Memory

Hermes 的内置记忆由两个文件组成：

- `MEMORY.md`：Agent 的个人笔记，记录环境事实、约定和经验。
- `USER.md`：用户画像，记录偏好、沟通方式和期待。

官方文档强调 bounded, curated memory，并设置字符限制。这一点非常关键：长期记忆必须经过整理，而不是无限追加聊天记录。

Hermes 还支持外部 memory providers，例如 Honcho、Mem0 等，用于更深层的语义搜索和用户建模。

## Cron 与后台任务

Hermes 的 `cronjob` 工具支持：

- 创建一次性或周期性任务
- 暂停、恢复、编辑、触发和删除
- 附加一个或多个 skills
- 把结果投递到 origin、本地文件或消息平台
- 使用 fresh agent sessions 运行任务
- no-agent mode 执行脚本

这让 Hermes 从交互式 Agent 扩展为后台自动化 Agent。

## Delegation 与 Kanban

Hermes 支持子代理委派和 Kanban 多 Agent 工作队列。它的重点不是单纯并发，而是给多 worker 协作提供状态边界：

- 任务创建
- 领取
- 阻塞
- 完成
- 心跳
- 评论
- 自动回收失败任务

这是多 Agent 工程化的重要方向。

## 安全设计

Hermes 安全文档强调 defense-in-depth。关键机制包括：

- 命令审批
- 容器隔离
- messaging platform 授权
- terminal backend 安全区分
- Tirith 预执行扫描
- context file injection protection
- skills guard
- 环境变量按需透传

其中 Tirith 用于识别同形异义 URL、`curl | bash` 这类管道到解释器模式和终端注入攻击，并将结果接入审批流程。

## Curator

自改进 Agent 面临一个问题：如果不断生成技能，技能库会变乱。Hermes 的 Curator 用于维护 agent-created skills：

- 跟踪使用次数
- 标记闲置技能
- 归档过时技能
- 备份
- 保留 pinned skills
- 不删除 bundled 和 hub-installed skills

这说明真正的自改进不仅需要“学会”，还需要“整理”和“遗忘”。

## 设计启发

从 Hermes Agent 可以学到：

1. 把工具按 toolset 管理，而不是全量暴露。
2. 把经验沉淀为 skills，而不是只依赖聊天历史。
3. 长期记忆要有容量限制和人工可审查形式。
4. 自动化任务要支持 fresh session 和结果投递。
5. 多 Agent 协作需要工作队列，而不是临时喊几个 worker。
6. 自改进需要 curator，否则知识会变成负担。
7. 安全扫描和审批流必须嵌入工具执行前。

## 实操：把工具、记忆、技能串成一个 Hermes 风格闭环

Hermes 的源码不是把所有能力写在一个巨大的 prompt 里，而是拆成工具注册表、skills、memory、cron、terminal backend 等模块。下面用一个小 demo 串起来。

目录：

```text
hermes-mini/
  tools.py
  memory.py
  skills/
    summarize/
      SKILL.md
  main.py
```

`tools.py`：

```python
from pathlib import Path


def list_workspace(_: dict) -> dict:
    files = [str(p) for p in Path(".").rglob("*") if p.is_file()]
    return {"files": files[:50]}


TOOLS = {
    "list_workspace": {
        "description": "列出当前工作区文件",
        "handler": list_workspace,
    }
}
```

`memory.py`：

```python
from pathlib import Path

MEMORY = Path("MEMORY.md")


def remember(text: str) -> None:
    old = MEMORY.read_text(encoding="utf-8") if MEMORY.exists() else ""
    MEMORY.write_text((old + f"\n- {text}\n")[-8000:], encoding="utf-8")


def read_memory() -> str:
    return MEMORY.read_text(encoding="utf-8") if MEMORY.exists() else ""
```

`skills/summarize/SKILL.md`：

```markdown
# Summarize

当用户要求总结文件、目录或任务结果时：

1. 先列出可用文件。
2. 只读取必要内容。
3. 输出结论、依据和下一步建议。
```

`main.py`：

```python
from pathlib import Path
from tools import TOOLS
from memory import remember, read_memory


def load_skill(name: str) -> str:
    return (Path("skills") / name / "SKILL.md").read_text(encoding="utf-8")


def run(task: str) -> str:
    memory = read_memory()
    skill = load_skill("summarize") if "总结" in task else ""
    print("[context]")
    print(memory)
    print(skill)

    result = TOOLS["list_workspace"]["handler"]({})
    remember(f"用户执行过任务：{task}")
    return f"根据 {len(result['files'])} 个文件生成摘要。"


if __name__ == "__main__":
    print(run("总结当前工作区"))
```

运行：

```bash
python main.py
```

这个 demo 展示了 Hermes 风格的闭环：

- 工具不直接写在 prompt 里，而是注册为 `TOOLS`。
- 技能按任务触发加载。
- 记忆只保存稳定摘要。
- 每次运行都能把经验带到下一次。

## 小结

Hermes Agent 的架构重点在“学习闭环”：工具执行产生经验，经验沉淀为技能，技能按需加载，记忆保存稳定偏好，Curator 维护技能生命周期。学习 Hermes，有助于我们理解 Agent 如何从一次性任务执行器演进为持续积累的个人工作系统。

## 参考资料

- [Hermes Agent Docs](https://hermes-agent.nousresearch.com/docs/)
- [Hermes Agent bundled skill](https://hermes-agent.nousresearch.com/docs/user-guide/skills/bundled/autonomous-ai-agents/autonomous-ai-agents-hermes-agent)
- [Hermes Agent Tools & Toolsets](https://hermes-agent.nousresearch.com/docs/user-guide/features/tools/)
- [Hermes Agent Skills System](https://hermes-agent.nousresearch.com/docs/user-guide/features/skills/)
- [Hermes Agent Persistent Memory](https://hermes-agent.nousresearch.com/docs/user-guide/features/memory/)
- [Hermes Agent Security](https://hermes-agent.nousresearch.com/docs/user-guide/security/)
- [Hermes Agent Scheduled Tasks](https://hermes-agent.nousresearch.com/docs/user-guide/features/cron/)
- [Hermes Agent Source Code](https://github.com/NousResearch/hermes-agent)
