# RAG 图片最终修订契约

本文件与 `rag-image-prompts.md`、`rag-academic-image-storyboard.mjs` 一起构成最终可复现清单。下表中的约束覆盖同一图片 ID 的初始 prompt；未列出的图片继续使用初始 prompt。

所有修订图继续继承已确认的 Style Contract：1600×900 PNG、白色或极浅灰背景、低饱和语义色、细线箭头、严格对齐、中文解释加英文标准术语、无水印和品牌元素。

| 图片 ID | 最终内容约束 |
| --- | --- |
| r01-f03 | 单张 `Chunk` 卡片，依次列出 `chunk_id`、`document_id`、`text`、`source`、`section`、`page`、`version`、`acl` 及中文含义；不得出现外部空节点。 |
| r01-f05 | 一个根节点、三类失败、每类两个叶节点；检索、上下文、生成与引用的归因不得交叉或重复扩展。 |
| r01-f06 | 严格 4×2 矩阵：Grounded/Faithful、Correct、Complete、Citation Correctness 及各自核心问题。 |
| r01-f07 | `频繁更新或引用 → RAG`；否则依次判断一次性文档、用户可自行浏览、稳定行为或格式，落到长上下文、搜索、微调或 RAG。 |
| r02-f02 | `RawDocument → ParsedBlock → Chunk` 三卡片；字段按最终数据契约分配，仅对 document_id、locator、acl 画字段血缘。 |
| r02-f04 | 两列对比：可统一为 Unicode、连续空白、无意义页眉页脚、日期格式、金额格式；必须保留版本号、否定词、表格结构、编号、单位。 |
| r02-f05 | 六行三列分块策略表，逐行写明固定字符、Token、递归结构、父子分块、滑窗重叠、语义分块的优点与风险。 |
| r03-f07 | 两条独立路径：`Flat → 全部向量 → Exact Top-k` 与 `ANN → 候选导航 → Approximate Top-k`；不得在 ANN 路径前再放 Flat。 |
| r03-f08 | Flat、IVF、HNSW、PQ 对比表，单元格使用明确文字描述结果、查询、内存、构建与更新，不使用含义不清的升降箭头。 |
| r04-f08 | 保留标准 MMR 公式；候选 A 高相关低冗余优先，B 高相关高冗余受惩罚，C 低相关不优先；不得生成伪不等式链。 |
| r05-f01 | 离线仅 `Ingest → ChunkStore`；在线为 `Identity → Retriever → ContextBuilder → Generator → Citation → RAGResult`；ChunkStore 仅读取到 Retriever。 |
| r05-f08 | Selected Chunk 与 Citation 的 chunk_id、source、locator 一一映射，再经过断言级校验得到通过或拒绝。 |
| r05-f10 | 顶层七阶段必须全部具名；阶段下方记录 trace_id、耗时、Token、版本、citations 与 refused，不允许空阶段框。 |
| r06-f06 | Baseline 与 Experiment A 仅改变 `rerank_n: 20 → 50`，其余语料、索引、Prompt、模型固定，并比较质量、p95 延迟、成本。 |
| r06-f09 | 缓存键包含 query、tenant、role、filters、index/prompt/model version；文档、权限、Prompt/模型变化分别触发对应版本变化和失效。 |
| r07-f06 | 两个镜头分别经过 Frames、Keyframe、OCR、ASR、MediaSegment，时间码连续且边界为 `00:03:27.900`。 |
| r07-f11 | 四模态五层矩阵，分别列出解析、检索、生成、引用和评测；禁止把图片、视频、音频方向混写。 |
| r08-f01 | 三平面必须无空节点；Serving、Indexing、Control 各自完整，Versioned Index 供 Retrieval 读取，控制门向上生效。 |
| r08-f07 | Tenant A 与 Tenant B 拥有独立 ACL、索引访问结果、缓存命名空间和日志链路；禁止任何跨租户箭头。 |
| r08-f08 | 单一恶意文档依次经过七层防御，再由一个 Pass/Block 门进入 Release 或 Rollback；不得复制七份输入和发布节点。 |
| r08-f11 | 五级安全降级从完整 RAG 逐步关闭可选能力，最终明确拒绝；每一行节点均需具名，禁止模型无证据自由回答。 |

