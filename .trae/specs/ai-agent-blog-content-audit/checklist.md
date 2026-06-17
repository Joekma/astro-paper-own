# Checklist

## 元数据（frontmatter）
- [x] `从零构建 Agent：ReAct、Planner、Executor、Reflexion 全景学习指南.md` 顶部有完整的 `--- ... ---` frontmatter
- [x] 包含 `title` 字段
- [x] 包含 `author: Joekma`
- [x] 包含 `pubDatetime`（ISO 8601，带时区）
- [x] 包含 `modDatetime`（ISO 8601，带时区）
- [x] 包含 kebab-case `slug`，且与目录其他文章不冲突
- [x] 包含 1-2 句 `description`
- [x] `tags` 数组至少包含 `AI`、`Agent`、`ReAct`
- [x] `draft: false`
- [x] `series: Agent`
- [x] `seriesOrder: 0`
- [x] `language: zh-CN`

## seriesOrder 顺序
- [x] 同一系列 `series: Agent` 下 seriesOrder 唯一且连续
- [x] 顺序为：0（从零构建）→ 1（入门）→ 2（Loop）→ 3（工具）→ 4（MCP）→ 5（记忆）→ 6（Skills）→ 7（多 Agent）→ 8（安全）→ 9（自动化）→ 10（OpenClaw）→ 11（Hermes）→ 12（对比）
- [x] 路径体现"实操基础 → 概念 → 系统 → 项目 → 综合"

## 代码示例
- [x] `从零构建 Agent` 中所有 `python` 代码块通过 Python 语法检查（`python -m py_compile` 或人工 review）
- [x] `class ReActAgent` 重写为最小可独立运行单元（包含 `__init__`、`run`、辅助方法）
- [x] 所有 `python` 代码块满足"最小实现单元"：单一职责、import 完整、变量自洽
- [x] 那些本质是 dict literal / JSON / 概念示意的内容不再错用 `python` 代码块
- [x] 01-12 文章中的代码示例保持原样（无需修改）

## 风格统一
- [x] `从零构建 Agent` 一级标题 `#` 改为 `##`
- [x] 中文数字编号（"一、"、"二、"…）替换为概念化短标题
- [x] TOC 大纲结构与同系列 12 篇文章一致

## 现有文章核验（01-12）
- [x] 每篇都包含完整 frontmatter
- [x] 每篇 `seriesOrder` 唯一（1-12）
- [x] 每篇 `slug` 全站唯一
- [x] 抽样的代码示例仍为标准库 / 主流最新版本（mcp ≥ 1.0 FastMCP、asyncio、dataclass、subprocess）
