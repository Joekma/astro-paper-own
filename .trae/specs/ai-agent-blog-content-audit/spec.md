# AI Agent 系列博客内容审查与修复规范

## Why

`src/data/blog/AI/Agent/` 目录下共有 13 篇 AI Agent 系列博客（12 篇带序号 01-12、1 篇无 frontmatter 的 `从零构建 Agent`），存在三类系统性问题：

1. **元数据不完整**：`从零构建 Agent：ReAct、Planner、Executor、Reflexion 全景学习指南.md` 完全没有 frontmatter（缺 title、pubDatetime、slug、description、tags、draft、series、seriesOrder、language），与同系列其他文章风格不一致。
2. **seriesOrder 顺序不合理**：`从零构建 Agent` 是面向"零基础"读者的实操入门（涵盖 ReAct、Planner、Executor、Reflexion 四大基础模式），却因为没有 seriesOrder 排在 12 之后、按文件名排序时也游离在系列外。逻辑上应该作为整个系列的"前置实操基础"，seriesOrder 应为 0 或 1。
3. **示例代码质量差**：`从零构建 Agent` 中存在多段语法错误的 Python 代码（如 `class ReActAgent: def run()` 缺少冒号和函数体），且大量 Python 代码块实际写的是 dict literal 或伪代码片段，并未真正演示一个最小可运行的实现单元。其余 12 篇（01-12）的代码示例质量良好，均为标准库 / 主流最新版本（mcp ≥ 1.0, fastmcp, asyncio, dataclass）的最小实现单元。

需要系统修复以保证：(a) 整个系列元数据统一、可被 astro-paper 正确索引；(b) 学习路径合理（基础实操 → 概念 → 系统组件 → 项目实战 → 综合对比）；(c) 教学代码自身正确可运行。

## What Changes

- 为 `从零构建 Agent：ReAct、Planner、Executor、Reflexion 全景学习指南.md` 补齐 frontmatter（title / author / pubDatetime / modDatetime / slug / description / tags / draft / series / seriesOrder / language）
- 调整该篇的 seriesOrder 为 0（推荐）或 1，使其作为系列前置实操指南
- 修复该篇中所有语法错误或伪代码性质的 Python 代码块，至少补完 `ReActAgent` 示例类为最小可独立运行的实现
- 统一该篇的章节标题层级（`##` 二级）与其他 12 篇一致
- 验证 01-12 文章的代码示例仍然为最小可独立运行单元（已通过初步审查，无需修改）

## Impact

- **受影响文件**（13 篇）：
  - `01-AI Agent 入门指南：核心概念与演进.md` ✅ frontmatter 完整，代码良好，无需修改
  - `02-Agent Loop：从感知到行动的运行闭环.md` ✅ frontmatter 完整，代码良好，无需修改
  - `03-工具调用与函数调用：Agent 连接外部世界.md` ✅ frontmatter 完整，代码良好，无需修改
  - `04-MCP 协议：Agent 工具生态的标准接口.md` ✅ frontmatter 完整，代码良好（使用 mcp ≥ 1.0 FastMCP），无需修改
  - `05-Agent 记忆系统：短期记忆、长期记忆与用户画像.md` ✅ frontmatter 完整，代码良好，无需修改
  - `06-Agent Skills：可复用能力与经验沉淀.md` ✅ frontmatter 完整，代码良好，无需修改
  - `07-多 Agent 协作：委派、并行与任务拆解.md` ✅ frontmatter 完整，代码良好，无需修改
  - `08-Agent 安全：权限、沙箱、审批与提示注入防护.md` ✅ frontmatter 完整，代码良好，无需修改
  - `09-自动化 Agent：定时任务、后台运行与通知通道.md` ✅ frontmatter 完整，代码良好，无需修改
  - `10-OpenClaw 架构学习：个人 AI 助手的本地优先设计.md` ✅ frontmatter 完整，代码良好，无需修改
  - `11-Hermes Agent 架构学习：自改进、技能与记忆闭环.md` ✅ frontmatter 完整，代码良好，无需修改
  - `12-OpenClaw 与 Hermes 对比：Agent 系统设计模式总结.md` ✅ frontmatter 完整，代码良好，无需修改
  - `从零构建 Agent：ReAct、Planner、Executor、Reflexion 全景学习指南.md` ❌ 缺 frontmatter，seriesOrder 不合理，Python 代码块有语法错误
- **不影响**：构建产物、运行时（仅文档与 frontmatter 元数据）

## ADDED Requirements

### Requirement: 从零构建 Agent frontmatter 补全
`从零构建 Agent：ReAct、Planner、Executor、Reflexion 全景学习指南.md` 必须在文件顶部增加完整 frontmatter，至少包含：
- `title`：与一级标题一致或更精确
- `author`：Joekma
- `pubDatetime` / `modDatetime`：合理时间戳
- `slug`：英文短横线格式（kebab-case）
- `description`：1-2 句话说明文章价值
- `tags`：至少包含 `AI`、`Agent`、`ReAct`、`Planner`、`Reflexion` 等
- `draft: false`
- `series: Agent`
- `seriesOrder: 0`（推荐，使该篇成为系列前置实操基础）
- `language: zh-CN`

#### Scenario: frontmatter 校验通过
- **WHEN** astro-paper 加载该篇文章
- **THEN** 文章能被正确识别为 seriesOrder 0 的 Agent 系列文章
- **AND** 不应出现 slug 冲突或 frontmatter 缺失警告

### Requirement: seriesOrder 顺序合理化
- 该篇应被设为 `seriesOrder: 0`，作为"前置实操基础"
- 其他 12 篇保持 `seriesOrder: 1` 至 `seriesOrder: 12` 不变
- 系列阅读路径：0（实操基础）→ 1（概念入门）→ 2（Loop）→ 3（工具）→ 4（MCP）→ 5（记忆）→ 6（Skills）→ 7（多 Agent）→ 8（安全）→ 9（自动化）→ 10（OpenClaw）→ 11（Hermes）→ 12（对比总结）

#### Scenario: 系列按 seriesOrder 升序展示
- **WHEN** 访问 Agent 系列文章列表页
- **THEN** 列表顺序为：从零构建 → 入门指南 → Loop → 工具 → MCP → 记忆 → Skills → 多 Agent → 安全 → 自动化 → OpenClaw → Hermes → 对比
- **AND** 体现"基础实操 → 概念 → 系统 → 项目 → 综合"的学习路径

### Requirement: 修复不完整的 Python 示例代码
`从零构建 Agent` 中所有标记为 `python` 的代码块必须：
- 通过 Python 语法检查
- 满足"最小实现单元"：可独立复制运行，演示一个核心概念
- 依赖项在代码顶部 `import` 明确列出
- 函数/类定义完整（无 `def run()` 缺冒号、无 `class ReActAgent:` 后无 pass/body 等情况）

**至少需修复的关键代码块**（位于第 156-159 行附近）：
```python
# 当前错误示例：
class ReActAgent:
    def run()
```

应重写为最小可运行版本，例如：
```python
class ReActAgent:
    """最小 ReAct Agent：Thought → Action → Observation 循环。"""

    def __init__(self, tools: dict, max_steps: int = 5) -> None:
        self.tools = tools
        self.max_steps = max_steps

    def run(self, question: str) -> str:
        history = [f"问题：{question}"]
        for _ in range(self.max_steps):
            thought = self._think(history)
            history.append(f"思考：{thought}")
            if "Final Answer" in thought:
                return thought
            action, arg = self._parse_action(thought)
            if action not in self.tools:
                return f"未知工具：{action}"
            observation = self.tools[action](arg)
            history.append(f"观察：{observation}")
        return "达到最大步数，未完成"
```

#### Scenario: 教学代码可独立运行
- **WHEN** 读者复制文章中的 ReAct Agent 示例代码
- **THEN** 代码应能通过 Python 语法检查
- **AND** 提供清晰的扩展点（注入真实 LLM）

### Requirement: 统一文章风格
`从零构建 Agent` 当前的章节标题使用 `#` 一级标题 + 中文数字编号（"一、什么是 Agent？"），与同系列其他 12 篇使用 `##` 二级标题的格式不一致。

应将所有 `#` 改为 `##`，将中文数字编号（"一、"、"二、"等）改为概念化短标题（与系列其他文章一致）。

#### Scenario: 标题层级与系列一致
- **WHEN** 浏览文章 TOC 或大纲
- **THEN** 一级标题只有文章标题本身，所有章节使用 `##` 二级

## MODIFIED Requirements
无（首次审查，无既有需求被修改）

## REMOVED Requirements
无

## 修复原则

### 最小实现单元标准
每个代码示例块应满足：
1. **可独立运行**：复制粘贴后只需补充最少环境变量即可运行
2. **单一职责**：一个代码块演示一个核心概念
3. **依赖明确**：所有外部依赖在代码顶部 `import` 中明确列出
4. **变量完整**：代码中使用的所有变量都应在代码块内定义
5. **Python 语法合法**：所有 `python` 代码块必须能通过 `python -m py_compile` 编译

### Frontmatter 标准
astro-paper 要求每篇博客包含：
- title（必填）
- pubDatetime（必填，ISO 8601）
- slug（必填，kebab-case 且唯一）
- description（推荐）
- tags（推荐数组）
- draft（必填布尔）
- series / seriesOrder（当属于某个系列时）
- language（推荐 `zh-CN`）

### seriesOrder 编号原则
- 0 = 前置 / 入门基础
- 1-N = 主体章节
- 最后一片 = 综合对比 / 总结
- 同一系列内 seriesOrder 必须唯一
