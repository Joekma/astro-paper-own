# 《vLLM 与 SGLang》图片分镜与 Prompt 清单

## 文档状态

- 对应正文：`vLLM 与 SGLang 是什么.md`
- 分镜版本：1.0
- 正文冻结基线：2026-07-13
- 目标尺寸：1600×900 PNG
- 计划图片：12 张
- 当前状态：Style Contract 已确认；F01–F12 已生成、验收并写入正文

## Style Contract（已确认锁定）

- 用户确认日期：2026-07-13
- 风格锚点：`images/local-serving-f04-kv-management-comparison.png`
- 后续图片必须继承本节视觉语言、颜色语义、字体层级和禁止项。
- 除技术准确性修订外，不再改变整套图片的视觉方向。

## 批量执行结果

- F01–F03、F05–F12 均以 F04 为风格参考，每张图独立调用内置 imagegen。
- F02、F05、F12 各进行一次定向 imagegen 修订。
- F02 的 Decode Token 编号在修订后仍有重复，因此使用确定性文本层将 `Decode 2`、`Decode 3` 修正为 `y₃`、`y₄`。
- 12 张最终图片均为 1600×900 PNG，无 Alpha 通道。
- 最终正文引用数量为 12，与分镜和文件数量一致。
- 完整 Prompt 与修订记录保存在 `_vllm-sglang-final-prompts.md`。

### 视觉语言

- 白色或 `#F7F8FA` 极浅灰论文背景
- 16:9 横向教学图，严格栅格、充分留白、无装饰性插画
- 扁平矢量式信息图；圆角矩形、细线连接器、统一 2 px 视觉线宽
- 中文解释为主，英文标准术语作为副标题或括注
- 标题、模块名、公式和 Shape 具有清晰层级，不使用长段正文
- 箭头只能表达数据流、时间或映射，不用作装饰
- 不使用 3D、拟物、渐变、阴影堆叠、卡通角色、品牌 Logo 或水印

### 颜色语义

| 语义                 | 颜色                         |
| -------------------- | ---------------------------- |
| Application / Output | 深蓝 `#264A73`               |
| Request / Token      | 蓝 `#4C78A8`                 |
| Prefill              | 橙 `#F28E2B`                 |
| Decode               | 绿 `#59A14F`                 |
| KV Cache             | 紫 `#8064A2`                 |
| Physical Block       | 青 `#4E9FAD`                 |
| Shared Prefix        | 红棕 `#B45F4B`               |
| Metric / Neutral     | 灰黑 `#4D5663`               |
| Security / Warning   | 灰 `#8A9099`，必要时少量暗红 |

### 字体与标签

- 中文使用清晰无衬线黑体风格，英文使用现代 sans-serif
- 主标题约 38–44 px，模块标题约 25–30 px，普通标签约 20–24 px
- 50% 缩放下核心标签仍需可辨认
- 技术词保持原文：`Prefill`、`Decode`、`KV Cache`、`PagedAttention`、`RadixAttention`、`TTFT`、`ITL`、`TPOT`
- 公式、数值与英文大小写必须逐字准确；不得自行添加文字

## F01 推理服务分层

- 文件名：`local-serving-f01-stack.png`
- 插入位置：`先说结论` 中四层文本架构之后
- 唯一问题：模型、推理引擎、API 与业务应用分别负责什么
- 类型：分层架构图
- 必备节点：
  1. `业务应用 / Agent / RAG / Dify`
  2. `HTTP API`
  3. `vLLM / SGLang 推理服务`
  4. `模型权重 + Tokenizer + Chat Template`
  5. `GPU / NPU / CPU`
- 箭头：严格从上到下
- 视觉强调：第二层为深蓝，推理服务为紫色边框
- 禁止项：不得把 vLLM/SGLang 画成模型；不得添加云服务商 Logo

## F02 Prefill 与 Decode

- 文件名：`local-serving-f02-prefill-decode.png`
- 插入位置：`一次生成请求是怎样执行的` 开头
- 唯一问题：输入和输出 Token 在两个阶段如何流动
- 类型：时间线
- 必备标签：`Input Tokens`、`Prefill`、`KV Cache`、`First Token`、`Decode`、`Output Tokens`
- 顺序：输入 Token → Prefill → 首 Token → 多次 Decode
- 视觉强调：Prefill 橙、Decode 绿、KV Cache 紫
- 禁止项：不得表现成一次并行生成全部输出 Token

## F03 KV Cache 公式算例

- 文件名：`local-serving-f03-kv-cache-formula.png`
- 插入位置：KV Cache 公式之后
- 唯一问题：为什么 8192 Token 的单序列缓存约为 1 GiB
- 类型：公式拆解
- 必备公式：`M_KV ≈ 2 × L × T × H_kv × D_h × B`
- 必备数值：`L=32`、`T=8192`、`H_kv=8`、`D_h=128`、`BF16=2 bytes`、`≈ 1 GiB / sequence`
- 布局：左侧变量卡片，中央代入式，右侧 1 GiB 结果
- 禁止项：不得把 1 GiB 表述为所有模型固定值；不得加入模型权重

## F04 KV Cache 管理与前缀复用（首张样图）

- 文件名：`local-serving-f04-kv-management-comparison.png`
- 插入位置：`三个容易混淆的优化` 之前
- 唯一问题：块式显存管理与公共前缀复用解决的不是同一个问题
- 类型：机制对比
- 画布：1600×900，左右双栏，中间细分隔线
- 主标题：`KV Cache 管理的两个问题`
- 副标题：`Memory Allocation ≠ Prefix Reuse`

### 左栏

- 栏标题：`块式管理 Block-based Management`
- 逻辑请求：`Request A`、`Request B`
- 逻辑块：A1、A2、A3；B1、B2
- 物理块池：P1、P2、P3、P4、P5、P6
- 映射示例：A1→P2、A2→P5、A3→P1；B1→P4、B2→P6；P3 标记 `Free`
- 说明标签：`按需分配 / 非连续物理块`
- 底部结论：`重点：减少预留浪费与显存碎片`

### 右栏

- 栏标题：`共享前缀复用 Shared Prefix Reuse`
- 树根：`固定规则 Prefix`
- 共享节点：`角色` → `评分规则` → `JSON Schema`
- 三个分支：`企业 A`、`企业 B`、`企业 C`
- 共享节点旁放一个紫色 `Cached KV` 标记
- 三个后缀旁放小标签 `Only compute suffix`
- 底部结论：`重点：跳过重复 Prefill`

### 全图准确性约束

- 左栏表达“怎样分配缓存空间”，右栏表达“哪些计算可以复用”
- 不出现性能倍数和 benchmark 数值
- 不写“vLLM 专属”或“SGLang 专属”
- 仅在底部脚注出现：`代表性机制：PagedAttention / RadixAttention；现代框架能力存在重叠`
- 不将物理块连成一段连续空间
- 树的公共前缀只有一份，企业分支从公共节点末端分叉

### 首次生成 Prompt

```text
Use case: scientific-educational
Asset type: Chinese technical blog teaching diagram, 16:9 landscape
Primary request: create a rigorous two-column educational infographic explaining that block-based KV Cache memory allocation and shared-prefix KV reuse solve different problems.
Scene/backdrop: pure white or very light gray academic paper background, strict grid, generous whitespace.
Style/medium: flat vector-like scientific diagram, precise thin arrows, rounded rectangles, no decorative icons.
Composition/framing: 1600×900 landscape. Centered title at top. Left and right columns have equal width with a thin vertical divider. A narrow footnote band at bottom.
Text (verbatim): "KV Cache 管理的两个问题", "Memory Allocation ≠ Prefix Reuse", "块式管理 Block-based Management", "Request A", "Request B", "A1", "A2", "A3", "B1", "B2", "P1", "P2", "P3", "P4", "P5", "P6", "Free", "按需分配 / 非连续物理块", "重点：减少预留浪费与显存碎片", "共享前缀复用 Shared Prefix Reuse", "固定规则 Prefix", "角色", "评分规则", "JSON Schema", "Cached KV", "企业 A", "企业 B", "企业 C", "Only compute suffix", "重点：跳过重复 Prefill", "代表性机制：PagedAttention / RadixAttention；现代框架能力存在重叠"
Left column details: show logical blocks A1 A2 A3 and B1 B2 mapped with thin arrows to a physical block pool P1–P6. Exact mapping: A1→P2, A2→P5, A3→P1, B1→P4, B2→P6. P3 is gray and labeled Free. Physical blocks are visibly non-contiguous.
Right column details: show one shared tree path 固定规则 Prefix → 角色 → 评分规则 → JSON Schema, then branch to 企业 A, 企业 B, 企业 C. Place one purple Cached KV marker beside the shared path. Each company branch has the small label Only compute suffix.
Color palette: Request blue #4C78A8, KV Cache purple #8064A2, Physical Block teal #4E9FAD, Shared Prefix muted brick #B45F4B, neutral text #4D5663, white/light-gray background.
Typography: highly legible Chinese sans-serif plus modern English sans-serif, strong hierarchy, readable at 50% scale.
Constraints: every required text string must appear exactly once except block IDs; preserve exact capitalization; scientifically accurate; left column means allocation, right column means reuse; no performance numbers; no framework exclusivity claim.
Avoid: watermark, logos, gradients, 3D, shadows, cartoons, server icons, chips, GPUs, decorative symbols, invented nodes, tiny text, extra formulas, crossed arrows, spelling drift.
```

### 样图执行记录

- 内置 imagegen 首次生成：整体布局、配色、中文标签和右栏树结构通过；左栏缺少 P5 且映射不符合分镜。
- 定向 imagegen 修订：补齐 P1–P6，但仍未严格执行 A1→P2、A2→P5、A3→P1、B1→P4、B2→P6。
- 确定性校正：仅覆盖左栏物理块池、箭头、映射图例和局部间距；右栏与整体生成风格保持不变。
- 最终文件：`images/local-serving-f04-kv-management-comparison.png`
- 最终规格：1600×900、PNG、无 Alpha、约 1.1 MB。
- 最终核对：P1–P6 各出现一次，P3 为 Free；五条映射正确；公共前缀只保存一份并从 JSON Schema 后分为企业 A/B/C。
- 正文引用：尚未写入，等待整套图片完成后一次性接入。

## F05 连续批处理时间线

- 文件名：`local-serving-f05-continuous-batching.png`
- 插入位置：连续批处理示例之后
- 唯一问题：完成请求如何退出、新请求如何补位
- 类型：调度时间线
- 必备标签：`Iteration 1`、`Iteration 2`、`Iteration 3`、`A`、`B`、`C 完成`、`D 加入`
- 箭头：仅从左到右
- 禁止项：不得把 Continuous Batching 画成一次固定静态 Batch

## F06 vLLM 最小部署闭环

- 文件名：`local-serving-f06-vllm-deployment.png`
- 插入位置：vLLM 客户端代码之后
- 唯一问题：客户端请求经过哪些部署组件
- 类型：数据流
- 节点：`OpenAI Client` → `Reverse Proxy / Auth` → `vLLM API Server` → `Scheduler + KV Cache` → `Model on GPU`
- 返回箭头：`Streaming Tokens`
- 禁止项：不得暗示 `--api-key` 可以保护全部网络面

## F07 Radix Tree 前缀复用

- 文件名：`local-serving-f07-radix-prefix-cache.png`
- 插入位置：SGLang 主要能力之后
- 唯一问题：最长公共前缀如何形成共享树路径
- 类型：树结构
- 节点：`角色`、`评分规则`、`JSON Schema`、`企业 A/B/C 数据`
- 标注：`Cache Hit`、`Cache Miss`、`Eviction` 只作为三个小型状态说明
- 禁止项：不得画成每个企业各保存一份完整公共前缀

## F08 SGLang 最小部署闭环

- 文件名：`local-serving-f08-sglang-deployment.png`
- 插入位置：SGLang 客户端代码之后
- 唯一问题：Parser、Scheduler 与 Radix Cache 在服务链路中的位置
- 类型：数据流
- 节点：`OpenAI Client` → `SGLang API Server` → `Chat Template / Parser` → `Scheduler` → `Radix Cache` → `Model on GPU`
- 禁止项：Parser 不得画成模型自身能力；不得虚构外部 Agent 节点

## F09 能力重叠矩阵

- 文件名：`local-serving-f09-capability-overlap.png`
- 插入位置：`两者应该怎样比较` 开头
- 唯一问题：共同能力与代表性技术怎样区分
- 类型：双圆重叠矩阵
- 共同区域：`OpenAI API`、`Continuous Batching`、`Paged KV`、`Prefix Cache`、`Structured Outputs`、`Quantization`、`Distributed`、`Multimodal`
- 左侧强调：`PagedAttention`、`通用 serving 生态`
- 右侧强调：`RadixAttention`、`前缀感知运行时`
- 禁止项：共同能力不得落入单方专属区

## F10 选型决策树

- 文件名：`local-serving-f10-selection-tree.png`
- 插入位置：`本地部署时怎样选` 开头
- 唯一问题：选型必须先过硬约束，再进入业务压测
- 类型：决策树
- 顺序：`模型支持？` → `硬件支持？` → `容量足够？` → `特殊能力？` → `真实负载压测` → `按 SLO 选择`
- 分支：不满足前三项时输出 `更换模型 / 硬件 / 配置`
- 禁止项：最终叶子不得直接写固定赢家

## F11 五类压测负载

- 文件名：`local-serving-f11-benchmark-workloads.png`
- 插入位置：五类工作负载表之后
- 唯一问题：不同 Token 形态分别压测哪个阶段
- 类型：实验矩阵
- 五行：`短入短出`、`长入短出`、`短入长出`、`共享长前缀`、`严格 JSON Schema`
- 列：`Input`、`Output`、`Cache`、`Primary Metrics`
- 强制标注：共享前缀行拆为 `Cold Cache` 与 `Warm Cache`
- 禁止项：不得使用虚构性能数字

## F12 指标时间线与生产门

- 文件名：`local-serving-f12-metrics-and-production.png`
- 插入位置：生产部署章节之前
- 唯一问题：性能数字怎样转化为可发布的 SLO 门槛
- 类型：时间线 + Gate
- 时间线：`Request` → `Queue` → `Prefill` → `First Token` → `Decode Tokens` → `Complete`
- 指标括号：`TTFT`、`ITL`、`TPOT`、`E2E`
- 发布门：`Latency`、`Goodput`、`Error Rate`、`Schema Accuracy`、`Peak VRAM`、`Security`
- 禁止项：TPOT 不得从 Request 起点开始；ITL 必须位于相邻输出 Token 之间

## 批量阶段验收顺序

1. 逐图核对文字、节点、箭头和颜色语义。
2. 技术文字漂移时只做一次定向生成修订。
3. 仍不准确时使用确定性文本层覆盖，不接受近似拼写。
4. 统一处理为 1600×900 PNG，不拉伸。
5. 12 张图全部验收后，一次性插入正文。
6. 检查 Markdown 引用与实际文件一一对应。
7. 最终 `images` 目录只保留被正文引用的 PNG。
