# RAG 系列图片 Prompt 与确认记录

## 状态

- 正文状态：已冻结，等待构建验证。
- 分镜状态：81 张已规划。
- Style Contract：`approved`（用户于 2026-07-12 确认）。
- 唯一允许在确认前生成的图片：`r04-f01-hybrid-retrieval-reranking-funnel.png`。
- 用户确认前禁止生成第二张图片、批量替换 Markdown 引用或删除旧图。

## 首张样图 Prompt

```text
Use case: scientific-educational
Asset type: 中文 RAG 教程的学术检索漏斗图，用作整套 81 张插图的 Style Contract 样图
Primary request: 绘制“混合检索与重排序完整漏斗”，只解释 Query 如何经过可选改写、权限过滤、Dense 与 BM25 并行召回、RRF 融合、Cross-Encoder 重排、去重，形成最终 Top-5 Context，并标出三个评测位置。
Scene/backdrop: 白色或极浅灰论文背景，无纹理、无装饰。
Style/medium: 顶会论文附图与研究生教材风格；扁平、精确、克制、矢量感；细线箭头；圆角矩形模块；严格网格对齐。
Composition/framing: 1600×900、16:9 横向；从左到右的漏斗。Query 后先经过 Query Rewrite / Decomposition（可选），再经过 ACL + Metadata Filter；随后明确分成上下两条并行支路 Dense Retrieval Top-50 与 BM25 Top-50；两路汇入 RRF Rank Fusion；再依次进入 Cross-Encoder Reranker Top-30、Deduplication、Final Top-5 Context。三个低饱和黄色评测标签分别靠近召回、重排和最终上下文阶段。留白充足。
Color palette: Query 低饱和蓝；Document 灰蓝；Dense 低饱和紫；BM25 低饱和橙；Filter 青色；RRF 靛蓝；Reranker 低饱和红；Context 低饱和绿；Metric 低饱和黄；其他为中性灰。
Text (verbatim): "Query"; "Query Rewrite / Decomposition（可选）"; "ACL + Metadata Filter"; "Dense Retrieval Top-50"; "BM25 Top-50"; "RRF Rank Fusion"; "Cross-Encoder Reranker Top-30"; "Deduplication"; "Final Top-5 Context"; "Recall@50"; "MRR / nDCG"; "Context Quality"
Constraints: 只出现上述 12 个文本标签；节点顺序完全一致；Dense 与 BM25 必须是两条并行支路；候选数量必须严格为 Top-50、Top-30、Top-5；必须恰好有三个评测标签；中文无衬线字体；英文术语保持英文；最小标签在 50% 缩放下仍清晰；无 Logo、无水印。
Avoid: 3D、照片质感、霓虹、发光、深色背景、渐变堆叠、卡通人物、装饰图标、数据库品牌、模型品牌、虚构指标、额外公式、额外文本、拼写错误、重复节点、交叉箭头。
```

## 样图验收断言

1. 图片最终文件严格为 1600×900 PNG。
2. 只有 12 个必备文本标签，不得出现标题、副标题、图例或水印。
3. Dense 与 BM25 是并行支路，不得串联。
4. 两路在 RRF 处汇合，之后顺序固定为 Reranker → Deduplication → Final Context。
5. `Top-50` 出现两次，`Top-30` 一次，`Top-5` 一次。
6. 评测标签严格为 `Recall@50`、`MRR / nDCG`、`Context Quality`。
7. 50% 缩放下标签和候选数量可辨认。

## 用户确认项（已通过）

- [x] 整体学术风格。
- [x] 颜色语义。
- [x] 字体和中英文混排。
- [x] 信息密度。
- [x] 箭头、分支、汇合和模块样式。
- [x] Top-n、指标与标签清晰度。

## Style Contract 锁定规则

用户确认后，将样图最终视觉参数写回 `scripts/rag-academic-image-storyboard.mjs`：

- `styleDraft.status` 改为 `approved`。
- 记录确认样图路径和确认日期。
- 锁定背景、字体、字号下限、线宽、圆角、箭头、间距和颜色值。
- 后续每张图继承同一 Contract，并附加各自 `IMAGE_SPEC`。
