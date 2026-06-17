# Tasks

- [x] Task 1: 修复 `从零构建 Agent：ReAct、Planner、Executor、Reflexion 全景学习指南.md` frontmatter
  - [x] SubTask 1.1: 在文件顶部 `---` 与 `---` 之间添加完整 frontmatter（title / author / pubDatetime / modDatetime / slug / description / tags / draft / series / seriesOrder / language）
  - [x] SubTask 1.2: 设置 `series: Agent`、`seriesOrder: 0`、`language: zh-CN`、`draft: false`
  - [x] SubTask 1.3: tags 至少包含 `AI`、`Agent`、`ReAct`、`Planner`、`Reflexion`、`Agent 构建`

- [x] Task 2: 修复不完整 / 伪代码性质的 Python 代码块
  - [x] SubTask 2.1: 修复 `class ReActAgent:` 示例为最小可独立运行的实现（包含 `__init__` 和 `run`，提供 `_think` / `_parse_action` 占位方法）
  - [x] SubTask 2.2: 审查并修正其他标记为 `python` 的代码块（例如 `context["task_1_result"]`、`memory.append(...)`、`if not progress: raise Exception("Cycle Detected")` 等孤立的 Python 片段）
  - [x] SubTask 2.3: 对于无法独立成段的"概念示意"代码（如 `"id": 1, "tool": "search"` 的 dict literal），保持为 `text` 代码块或 `json` 代码块，**不要**继续用 `python` 标记
  - [x] SubTask 2.4: 用 `python -m py_compile` 或人工 review 校验所有保留为 `python` 的代码块语法正确

- [x] Task 3: 统一文章风格
  - [x] SubTask 3.1: 将所有 `#` 一级章节标题改为 `##` 二级
  - [x] SubTask 3.2: 将中文数字编号（"一、"、"二、"…"、"十五、"）改为概念化短标题，例如"Agent 的定义"、"演进路线"、"ReAct"、"Planner"、"Reflexion"、"完整架构"等

- [x] Task 4: 验证 01-12 文章无需修改
  - [x] SubTask 4.1: 确认每篇都包含完整 frontmatter（含 `series: Agent` 与 `seriesOrder: 1-12`）
  - [x] SubTask 4.2: 抽样验证 `mini_agent.py`、`loop_agent.py`、`tool_registry.py`、`notes_server.py`、`memory_store.py`、`skill_loader.py`、`multi_agent_demo.py`、`safe_shell.py`、`cron_agent.py`、`load_workspace.py`、`hermes-mini/` 模块、`agent.py` 仍为最小可独立运行单元

# Task Dependencies
- Task 1（frontmatter）必须先于 Task 4（系列验证）完成
- Task 2（代码修复）和 Task 3（风格统一）相互独立，可并行
- Task 4 依赖 Task 1 完成后才能验证系列顺序
