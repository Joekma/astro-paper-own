# LangGraph 学术架构图提示清单

## 统一规范

- Use case: `scientific-educational / infographic-diagram`
- Asset: 中文技术博客论文插图，16:9，最终后处理为 1600×900 PNG
- Style: 白色或 `#F6F8FB` 背景，现代中文无衬线字体，细线箭头，圆角卡片，充足留白，无重阴影
- Palette: Node/控制流 `#143A66`，State/数据流 `#1B8A89`，Router `#D98B2B`，Persistence `#6C63B5`，Tool `#3B8F5A`，Human `#D97706`，Error/Guard `#C84C4C`
- Constraints: 中文解释加英文标准术语；只包含正文出现的组件；箭头方向准确；无水印、品牌、伪代码、装饰图标和无关公式

## 01 入门：状态图三层架构

- File: `langgraph-core-stategraph-architecture-figure-01.png`
- Status: 已确认风格样图，直接复用并后处理
- Required labels: `LangGraph 状态图：从定义到运行`、`1 状态定义`、`2 图构建`、`3 运行时`、`messages`、`context`、`step_count`、`START`、`节点 A`、`条件路由`、`节点 B`、`END`、`共享状态`、`读取状态`、`局部更新`、`compile`、`可运行图`、`检查点`、`调用`、`流式输出`、`恢复`
- Prompt: 三栏展示状态 schema、StateGraph 控制流和编译后的运行时；控制流与状态读写使用不同线型；不声称 TypedDict 提供运行时验证。

## 02 入门：抽象层选择树

- File: `langgraph-agent-vs-graph-api-decision-figure-02.png`
- Required labels: `选择 Agent 抽象层`、`标准工具循环？`、`自定义状态或路由？`、`需要暂停与恢复？`、`create_agent`、`Graph API`、`模型接口`、`高层 Agent`、`底层编排`
- Prompt: 从需求问题开始的自上而下决策树；标准工具循环进入 create_agent，自定义状态/路由或精细恢复进入 Graph API，单次模型调用进入模型接口；底部说明 create_agent 运行在 LangGraph 之上。

## 03 状态：更新与检查点生命周期

- File: `langgraph-state-update-reducer-lifecycle-figure-01.png`
- Required labels: `状态生命周期 State Lifecycle`、`State Schema`、`读取状态 Read`、`节点 Node`、`局部更新 Partial Update`、`Reducer 合并`、`新状态 New State`、`Checkpoint`、`thread_id`、`历史快照`、`恢复 Resume`、`分叉 Fork`
- Prompt: 左到右展示 schema、节点读取、局部更新、reducer、新状态和 checkpoint；下方用时间线表示同一 thread_id 的不可变快照以及从旧快照恢复和分叉。

## 04 状态：Reducer 策略对比

- File: `langgraph-reducer-strategies-comparison-figure-02.png`
- Required labels: `Reducer 更新策略`、`默认覆盖 Overwrite`、`累积 Add`、`消息合并 add_messages`、`旧值`、`节点更新`、`新值`、`按 ID 替换`、`避免重复拼接`
- Prompt: 三列对比覆盖、operator.add、add_messages；使用小型确定性值演示结果；突出手动拼接旧值再累积会重复，消息相同 ID 会替换。

## 05 高级：控制流地图

- File: `langgraph-advanced-control-flow-figure-01.png`
- Required labels: `高级控制流 Advanced Control Flow`、`START`、`处理节点`、`条件路由`、`循环 Loop`、`业务退出`、`子图 Subgraph`、`Send 并行派发`、`Reducer 聚合`、`END`、`recursion_limit`
- Prompt: 以条件路由为中心，分别连接循环、子图和 Send worker 分支；并行 worker 汇入 reducer 后进入 END；业务退出与 recursion_limit 视觉上明确区分。

## 06 高级：中断与恢复时间线

- File: `langgraph-recovery-interrupt-checkpoint-timeline-figure-02.png`
- Required labels: `可恢复执行 Durable Execution`、`Checkpoint 1`、`Checkpoint 2`、`interrupt`、`人工审核 Human Review`、`Command(resume=...)`、`节点重新执行`、`幂等副作用`、`重放 Replay`、`分叉 Fork`、`原历史保留`
- Prompt: 横向检查点时间线；主线在 interrupt 暂停，经人工审核和 Command 恢复；从旧检查点分别画重放与新分叉，原历史保持可见；用红色护栏提示节点从头执行和副作用幂等。

## 07 实战：安全工具调用循环

- File: `langgraph-agent-tool-loop-figure-01.png`
- Required labels: `LangGraph 工具 Agent`、`用户输入`、`Model Node`、`tools_condition`、`ToolNode`、`ToolMessage`、`最终回答`、`AgentState`、`messages`、`context`、`iterations`、`stop_reason`、`max_iterations`、`Checkpoint`
- Prompt: 主路径为用户输入 → Model → tools_condition；无工具调用进入最终回答，有工具调用进入 ToolNode 和 ToolMessage 后回到 Model；迭代上限进入 stop_reason；下方展示自定义状态和 checkpoint。

## 08 实战：工作流与 Agent 边界

- File: `langgraph-workflow-vs-agent-observability-figure-02.png`
- Required labels: `工作流还是 Agent？`、`路径预先确定`、`动态选择工具`、`确定性 Workflow`、`动态 Agent`、`规则节点`、`模型决策`、`单元测试`、`集成测试`、`节点耗时`、`工具失败率`、`iterations`、`stop_reason`
- Prompt: 左右对比确定性工作流与动态 Agent，中间以路径是否预先确定和是否需要模型选择工具作为判断；底部为共同的测试与观测层，不把观测节点画进业务控制流。
