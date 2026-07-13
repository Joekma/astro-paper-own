/**
 * RAG 系列学术插图分镜。
 * 正文已经冻结；只有 prototype 获得用户确认后才能批量生成并替换 Markdown 引用。
 */

import { pathToFileURL } from "node:url";

export const styleDraft = {
  status: "approved",
  approvedAt: "2026-07-12",
  approvedPrototype: "src/data/blog/AI/RAG/images/r04-f01-hybrid-retrieval-reranking-funnel.png",
  prototype: "src/data/blog/AI/RAG/images/r04-f01-hybrid-retrieval-reranking-funnel.png",
  useCase: "scientific-educational",
  assetType: "中文 RAG 教程的学术系统与检索图",
  canvas: "1600×900, 16:9 landscape",
  background: "白色或极浅灰论文背景",
  typography: "中文解释使用清晰无衬线字体；英文术语、ID、公式和指标保持原文",
  palette: {
    query: "低饱和蓝",
    document: "灰蓝",
    dense: "低饱和紫",
    sparse: "低饱和橙",
    filter: "青色",
    fusion: "靛蓝",
    reranker: "低饱和红",
    context: "低饱和绿",
    metric: "低饱和黄",
    security: "灰红",
  },
  constraints: [
    "每张图只解释一个核心问题",
    "严格保留节点数量、顺序、箭头方向、公式、示例值、候选数和 Top-k",
    "不得新增品牌 Logo、装饰图标、虚构指标、无关公式或水印",
    "最小正文标签字号按 1600×900 画布不低于 24 px",
    "50% 缩放后关键标签、Chunk ID、指标和 Shape 仍须可读",
  ],
};

export const promptTemplate = `
Use case: scientific-educational
Asset type: 中文 RAG 教程的学术系统与检索图
Primary request: 根据 IMAGE_SPEC 绘制一张独立教学图，只解释 learningObjective。
Scene/backdrop: 白色或极浅灰论文背景，无纹理噪声。
Style/medium: 顶会论文附图与研究生教材插图风格，扁平、精确、克制、矢量感强。
Composition/framing: 1600×900 横向画布，严格按 structure 布局，留白充足，细线箭头，网格对齐。
Color palette: Query 蓝、Document 灰蓝、Dense 紫、Sparse 橙、Filter 青、Fusion 靛蓝、Reranker 红、Context 绿、Metric 黄、Security 灰红。
Text (verbatim): 只使用 IMAGE_SPEC.requiredLabels 中的文本，不增加或改写标签。
Constraints: 保留节点数、顺序、箭头、公式、ID、候选数和 Top-k；中文无衬线字体；英文术语保持英文；无水印。
Avoid: 3D、照片、霓虹、发光、深色背景、卡通人物、品牌 Logo、无关公式、伪造数据、额外文字。
`;

const f = (id, slug, anchor, type, learningObjective, requiredLabels, structure, distinction, checks = []) => ({
  id,
  file: `${id}-${slug}.png`,
  anchor,
  type,
  learningObjective,
  requiredLabels,
  structure,
  distinction,
  checks,
});

export const articles = [
  {
    article: 1,
    file: "RAG 入门指南：核心概念与架构.md",
    figures: [
      f("r01-f01", "rag-value-before-after", "为什么直接询问模型不够", "直觉对比", "区分参数回答与证据回答", ["直接回答", "内部制度 v3", "检索证据", "回答", "来源：第 4.2 节", "证据不足则拒答"], "上下两条问答路径对比", "只解释 RAG 的证据价值"),
      f("r01-f02", "offline-online-dual-pipeline", "两条链路：离线索引与在线问答", "双链路", "建立离线与在线总坐标", ["离线索引", "原始文档", "解析", "Chunk", "Embedding / 关键词索引", "版本化索引", "在线问答", "Query", "Retrieval", "Context", "Generation", "Answer + Citation"], "上下两条链路在版本化索引汇合", "全系列架构总览"),
      f("r01-f03", "chunk-data-contract", "离线索引链路", "数据契约", "看清 Chunk 不是只有正文", ["chunk_id", "document_id", "text", "source", "section", "page", "version", "acl"], "中心 Chunk 卡片包含 8 个字段", "只解释最小字段"),
      f("r01-f04", "online-stage-artifacts", "在线问答链路", "数据流", "区分四类可观测产物", ["Retrieval", "候选 Chunk ID", "Context", "实际模型输入", "Generation", "答案或拒答", "Citation", "断言 → 来源"], "四阶段水平流水线，每阶段下方一个产物", "强调产物而非内部算法"),
      f("r01-f05", "three-layer-failure-model", "三层失败模型", "故障树", "把最终错误定位到正确层", ["最终回答错误", "检索失败", "上下文失败", "生成与引用失败", "黄金证据未召回", "证据被截断或淹没", "断言无支持或引用错误"], "根节点向下分三支", "只做错误归因"),
      f("r01-f06", "quality-dimensions-matrix", "Grounded、Correct 与 Complete 不相同", "评测矩阵", "区分四个质量维度", ["Grounded / Faithful", "Correct", "Complete", "Citation Correctness", "上下文支持？", "事实有效？", "覆盖完整？", "引用蕴含？"], "4×2 学术矩阵", "不呈现检索指标"),
      f("r01-f07", "rag-choice-map", "RAG、长上下文、搜索与微调如何选择", "决策图", "根据知识与行为需求选择方法", ["需要频繁更新或引用？", "RAG", "文档少且一次性？", "长上下文", "用户自行浏览？", "搜索", "稳定行为或格式？", "微调"], "从问题到四个叶节点", "只解释选择边界"),
      f("r01-f08", "series-roadmap", "总结与下一篇", "路线图", "总结八篇学习顺序", ["1 架构", "2 数据处理", "3 向量检索", "4 混合检索", "5 最小应用", "6 评估优化", "7 多模态", "8 生产部署"], "8 阶段水平路线", "只做系列导航"),
    ],
  },
  {
    article: 2,
    file: "RAG 数据处理：文档加载与分割.md",
    figures: [
      f("r02-f01", "ingestion-quality-gates", "数据处理不是格式转换", "数据流", "建立带质量门的数据流水线", ["发现文档", "解析", "结构与页码检查", "规范化", "去重", "分块", "元数据与 ACL", "稳定 ID", "质量检查", "索引版本"], "10 节点左到右并在检查处加门", "只解释整体处理顺序"),
      f("r02-f02", "raw-to-chunk-contract", "定义输入与输出契约", "数据契约", "看清 RawDocument 到 Chunk 的字段演化", ["RawDocument", "ParsedBlock", "Chunk", "document_id", "content_hash", "block_type", "section_path", "chunk_id", "locator", "parent_id"], "三张卡片水平连接", "强调字段继承"),
      f("r02-f03", "pdf-parsing-failure", "解析质量门", "失败对比", "识别 PDF 读取成功但语义损坏", ["原始双栏 PDF", "错误阅读顺序", "重复页眉", "表格错位", "解析质量门", "可定位结构块"], "左侧原稿、中间错误、右侧质量门后结果", "只说明解析质量"),
      f("r02-f04", "normalization-boundary", "规范化与去重", "对比图", "区分安全规范化与语义破坏", ["可统一", "Unicode", "连续空白", "确认无意义的页眉", "必须保留", "金额", "日期", "版本号", "否定词", "表格结构"], "左右两列允许/禁止", "只解释清洗边界"),
      f("r02-f05", "chunking-strategies", "六类分块策略", "对比图", "比较六种分块策略", ["固定字符", "Token", "递归结构", "父子分块", "滑窗重叠", "语义分块", "边界完整性", "成本", "可解释性"], "6 行 3 维对比表", "做策略总览，不给固定最优值"),
      f("r02-f06", "parent-child-chunking", "父子分块", "层级图", "理解小块检索与父块展开", ["父块：4.2 超标准审批", "子块 A：条件与审批人", "子块 B：说明与附件", "检索命中", "parent_id", "展开并去重"], "一父两子，命中 A 后回到父块", "只解释父子机制"),
      f("r02-f07", "overlap-tradeoff", "滑窗重叠", "对比图", "理解 Overlap 的收益与重复代价", ["Chunk A", "Overlap", "Chunk B", "缓解边界截断", "索引体积增加", "Context 重复"], "两条文本条带重叠并标注利弊", "只解释重叠"),
      f("r02-f08", "chunk-size-experiment", "Chunk Size 不是常数", "实验图", "用多指标选择 Chunk Size", ["Chunk Size", "Recall@k", "证据完整率", "Context 重复率", "p95 Token", "没有单一最大值"], "横轴 Size，四条趋势线，不使用虚构刻度", "只展示权衡方法"),
      f("r02-f09", "blue-green-index-sync", "增量更新与删除传播", "时序图", "理解索引版本切换与删除传播", ["Source v3", "Build index-v42", "质量检查", "黄金查询", "切换 active", "index-v41", "回滚", "删除传播", "缓存失效"], "左到右发布时序，旧版本在下方", "只解释生命周期"),
    ],
  },
  {
    article: 3,
    file: "RAG 向量检索：嵌入与向量数据库.md",
    figures: [
      f("r03-f01", "dual-encoder-flow", "从文本到候选 Chunk", "双塔数据流", "理解 Query 和 Chunk 如何进入共享空间", ["Chunk text", "Document Encoder", "document vector", "Query", "Query Encoder", "query vector", "Vector Index", "Top-k Chunk IDs"], "上下两路向量在索引处汇合", "只解释向量检索总流"),
      f("r03-f02", "embedding-record-contract", "Embedding 数据契约", "数据契约", "防止混用不兼容向量", ["chunk_id", "vector", "embedding_model", "dimensions", "normalized", "index_version", "不可混用"], "两张兼容/不兼容记录卡片", "只解释版本与维度"),
      f("r03-f03", "vector-space-intuition", "三种距离如何影响排序", "直觉图", "建立二维语义空间直觉", ["query vector q", "dA：审批", "dB：交通票据", "dC：住宿附件", "方向接近", "不等于事实蕴含"], "二维坐标与四个向量", "不展开公式"),
      f("r03-f04", "similarity-formulas", "三种距离如何影响排序", "公式拆解", "对比余弦、点积与欧氏距离", ["cos(q,d) = (q·d)/(‖q‖₂‖d‖₂)", "dot(q,d) = Σ qᵢdᵢ", "L₂(q,d) = √Σ(qᵢ-dᵢ)²", "越大越相似", "越小越相似"], "三列公式卡片，排序方向突出", "只解释公式定义"),
      f("r03-f05", "normalized-equivalence", "三种距离如何影响排序", "公式推导", "理解归一化向量的等价排序", ["‖q‖₂ = 1", "‖d‖₂ = 1", "‖q-d‖₂² = 2 - 2(q·d)", "点积排序", "余弦排序", "欧氏距离反向排序", "等价"], "从归一化条件到三种排序", "只解释等价条件"),
      f("r03-f06", "top-k-hand-calculation", "一个可手算的 Top-k 例子", "数值图", "手算三个二维向量的 Top-2", ["q = [1.0, 0.0]", "dA = [0.8, 0.6]", "dB = [0.0, 1.0]", "dC = [0.6, 0.8]", "0.8", "0.0", "0.6", "Top-2: A, C"], "左侧向量，右侧点积排名", "只解释数值排序"),
      f("r03-f07", "flat-vs-ann", "为什么需要 ANN", "对比图", "区分精确 Top-k 与近似 Top-k", ["Flat", "全部向量", "Exact Top-k", "ANN", "候选导航", "Approximate Top-k", "延迟", "召回损失"], "上下两条检索路径", "只解释近似概念"),
      f("r03-f08", "index-types-tradeoff", "为什么需要 ANN", "对比表", "比较 Flat、IVF、HNSW、PQ", ["Flat", "IVF", "HNSW", "PQ", "精确性", "延迟", "内存", "构建", "更新"], "4×5 学术表格", "不绑定具体数据库"),
      f("r03-f09", "ann-vs-business-recall", "HNSW 与 IVF 的关键参数", "指标对比", "区分 ANN Recall 与业务 Recall", ["Exact Vector Top-k", "ANN Top-k", "ANN Recall@k", "Gold Relevant IDs", "Business Recall@k", "索引近似误差", "业务相关性"], "上下两个集合交集示意", "专门防止指标混淆"),
      f("r03-f10", "acl-prefilter", "过滤与向量检索的顺序", "安全边界", "理解权限过滤必须早于候选暴露", ["Verified identity", "tenant_id + ACL", "Pre-filter", "Vector Search", "Authorized Top-k", "Post-filter 风险", "日志 / 缓存 / Context"], "上方安全路径，下方红色风险路径", "只解释过滤顺序"),
    ],
  },
  {
    article: 4,
    file: "RAG 检索策略：混合检索与重排序.md",
    figures: [
      f("r04-f01", "hybrid-retrieval-reranking-funnel", "为什么只用一种检索器不够", "检索漏斗", "建立混合检索到最终上下文的完整坐标", ["Query", "Query Rewrite / Decomposition（可选）", "ACL + Metadata Filter", "Dense Retrieval Top-50", "BM25 Top-50", "RRF Rank Fusion", "Cross-Encoder Reranker Top-30", "Deduplication", "Final Top-5 Context", "Recall@50", "MRR / nDCG", "Context Quality"], "左到右漏斗：Query 后分成 Dense 与 BM25 两路，再汇入 RRF、Reranker、去重和 Final Top-5；三个黄色评测点分别位于召回、重排和上下文阶段", "Style Contract 首张样图；不解释单个算法内部", ["节点顺序必须完全一致", "Dense 与 BM25 必须是并行支路", "候选数量必须为 Top-50、Top-30、Top-5", "必须恰好有三个评测标签"]),
      f("r04-f02", "dense-bm25-complement", "候选召回：先追求不漏", "案例对比", "理解 Dense 与 BM25 的互补", ["住宿超标需要谁审批？", "制度 4.2 条怎么写？", "Dense Retrieval", "BM25", "语义改写", "精确编号", "互补召回"], "两个 Query 各自命中擅长支路", "只解释互补性"),
      f("r04-f03", "raw-score-mismatch", "为什么不能直接加原始分数", "尺度对比", "看清异构分数不可直接相加", ["Cosine similarity: 0.82", "BM25 score: 14.7", "Distance: 0.18", "不同尺度", "不可直接相加", "Rank Fusion / Calibration"], "三把不同刻度尺汇入禁止符号", "只解释数值尺度"),
      f("r04-f04", "rrf-formula", "RRF 公式与手算", "公式拆解", "解释 RRF 每个变量", ["RRF(d) = Σᵣ 1/(k + rankᵣ(d))", "d：Chunk", "R：排序器集合", "rankᵣ(d)：从 1 开始的名次", "k：平滑常数", "不是概率"], "中心公式，五条引线注释", "只解释公式"),
      f("r04-f05", "rrf-hand-calculation", "RRF 公式与手算", "排名表", "手算 A/B/C 融合顺序", ["k = 60", "Dense", "BM25", "A: 1, 3 → 0.03226", "B: 2, 1 → 0.03252", "C: 3, 2 → 0.03200", "Final: B > A > C"], "左侧双排名，右侧计算与最终排序", "只解释数值例子"),
      f("r04-f06", "candidate-counts", "重排序：在小候选集上做更贵的判断", "漏斗", "区分 retrieval_n、rerank_n、context_k", ["retrieval_n = 50 / 路", "RRF candidates", "rerank_n = 30", "Cross-Encoder", "context_k = 5", "候选更少，判断更贵"], "由宽到窄三层漏斗", "只解释三个数量"),
      f("r04-f07", "bi-vs-cross-encoder", "重排序：在小候选集上做更贵的判断", "对比图", "比较双编码召回与 Cross-Encoder 重排", ["Bi-Encoder", "Query vector", "Document vectors", "大规模召回", "Cross-Encoder", "[Query, Document]", "成对交互", "精细重排"], "左右两种模型结构", "只解释模型职责"),
      f("r04-f08", "mmr-tradeoff", "MMR 解决的是重复，不是纯相关性", "公式与选择", "理解相关性—多样性权衡", ["MMR(d) = λRel(q,d) - (1-λ)max Sim(d,s)", "相关性", "与已选结果相似", "λ", "减少重复", "可能牺牲纯相关性"], "左公式右三候选选择示意", "只解释 MMR"),
      f("r04-f09", "query-transform-risks", "查询改写、HyDE 与查询分解", "三列对比", "比较三种 Query 变换的收益与风险", ["Query Rewrite", "补实体 / 消指代", "意图漂移", "HyDE", "假设文档", "错误假设", "Decomposition", "子问题", "延迟与合并"], "三列各含输入、收益、风险", "只做策略边界"),
      f("r04-f10", "retrieval-metrics", "检索评测指标", "公式对比", "区分 Recall@k、MRR、nDCG@k", ["Recall@k", "证据是否找齐", "MRR", "第一个相关结果", "nDCG@k", "等级相关性与位置", "稳定 Chunk ID"], "三张指标卡，底部共同 ID 契约", "只解释指标选型"),
      f("r04-f11", "stage-diagnostic-map", "分阶段诊断", "故障定位", "从现象定位到检索阶段", ["黄金证据不在 Dense Top-50", "融合后消失", "重排后下降", "Final Context 重复", "Embedding / Chunk", "RRF / ID", "Reranker", "去重 / MMR"], "左侧四现象，右侧四根因一一连接", "只做诊断地图"),
    ],
  },
  {
    article: 5,
    file: "RAG 实战：构建完整 RAG 应用.md",
    figures: [
      f("r05-f01", "minimal-app-boundary", "应用边界", "系统架构", "建立最小应用模块边界", ["Ingest", "ChunkStore", "Identity", "Retriever", "ContextBuilder", "Generator", "Citation", "RAGResult", "Logs"], "离线写入与在线查询两路", "只解释教学基线"),
      f("r05-f02", "core-data-models", "1. 数据模型", "类型关系", "看清 Chunk、Hit、Citation、Result 关系", ["Chunk", "SearchHit", "Citation", "RAGResult", "chunk_id", "score", "source + locator", "retrieved_ids", "refused"], "四张类型卡及引用箭头", "只解释类型契约"),
      f("r05-f03", "idempotent-store", "2. 幂等 Chunk Store", "状态变化", "理解 upsert 与文档级删除", ["upsert", "chunk_id", "覆盖同 ID", "delete_document", "document_id", "删除全部派生 Chunk", "幂等"], "Before/After 两组状态卡", "只解释存储语义"),
      f("r05-f04", "acl-retrieval-boundary", "3. 确定性检索基线", "安全数据流", "验证 ACL 在候选前生效", ["Query + verified roles", "ChunkStore", "ACL filter", "Lexical score", "Authorized SearchHit", "未授权 Chunk", "不得进入候选"], "绿色授权路径与灰红阻断路径", "只解释检索权限"),
      f("r05-f05", "context-budget", "4. 上下文预算与去重", "预算条", "理解去重和预算选择", ["SearchHit", "去重 chunk_id", "Token / Char Budget", "Selected Context", "重复", "超预算", "跳过"], "候选卡片进入固定长度预算容器", "只解释 ContextBuilder"),
      f("r05-f06", "deterministic-to-model-adapter", "5. 受约束生成", "替换架构", "理解确定性基线与模型适配器共享协议", ["Generator protocol", "ExtractiveGenerator", "OpenAIGenerator", "同一输入：Query + Context", "同一输出：answer", "测试稳定", "生产适配"], "中心协议向左右两个实现分支", "只解释可替换性"),
      f("r05-f07", "untrusted-evidence", "OpenAI Responses API 适配器", "安全边界", "把检索文本当作不可信数据", ["System Instructions", "QUESTION", "EVIDENCE（不可信数据）", "恶意指令", "不得执行", "Structured Output", "最小权限"], "三层 Prompt 容器与灰红阻断箭头", "只解释 Prompt 边界"),
      f("r05-f08", "structured-citation", "6. 组装服务与结构化引用", "代码映射", "理解引用来自 Context 元数据", ["Selected Chunk", "chunk_id", "source", "locator", "Citation", "禁止解析模型自由文本", "断言级校验（生产扩展）"], "左侧 Chunk 字段映射到 Citation 卡片", "只解释引用组装"),
      f("r05-f09", "semantic-test-pyramid", "8. 语义行为测试", "测试矩阵", "覆盖 RAG 关键语义而非只测 HTTP", ["命中 + 稳定引用", "无答案拒答", "ACL 不泄漏", "删除传播", "间接提示注入", "接口测试", "语义行为测试"], "底层协议测试、上层五类语义测试", "只解释测试覆盖"),
      f("r05-f10", "request-observability", "可观测字段", "请求时序", "记录一次请求的版本与阶段耗时", ["trace_id", "index_version", "retrieval_ms", "rerank_ms", "context_tokens", "generation_ms", "model_version", "citations", "refused"], "一条请求时序，字段贴在对应阶段", "只解释观测字段"),
    ],
  },
  {
    article: 6,
    file: "RAG 优化：性能优化与效果提升.md",
    figures: [
      f("r06-f01", "evaluation-loop", "优化闭环", "闭环", "建立从黄金集到发布回滚的优化闭环", ["定义任务与风险", "黄金集", "基线", "错误分类", "单一改动", "离线消融", "线上验证", "发布 / 回滚", "失败样本回流"], "9 节点顺时针闭环", "只解释过程"),
      f("r06-f02", "golden-set-coverage", "黄金评测集的数据契约", "覆盖矩阵", "设计有代表性的黄金集", ["正常问题", "长尾术语", "多证据", "无答案", "版本冲突", "权限不足", "恶意文档", "解析难例", "Train / Dev / Test"], "8 类案例矩阵与三集合隔离", "只解释数据覆盖"),
      f("r06-f03", "four-layer-metrics", "四层质量指标", "指标地图", "区分 Retrieval、Context、Answer、Citation", ["Retrieval", "Recall@k / MRR / nDCG", "Context", "Recall / Precision / 重复率", "Answer", "Correct / Faithful / Complete / Abstain", "Citation", "Validity / Correctness / Completeness / Locator"], "四层垂直栈，每层指标一组", "全篇指标总览"),
      f("r06-f04", "claim-citation-evaluation", "Citation Quality", "断言映射", "理解断言级引用评测", ["断言 A", "断言 B", "Chunk 4.2", "Chunk 5.1", "Citation Validity", "Citation Correctness", "Citation Completeness", "Locator Accuracy"], "两条断言到两份证据的正确/错误连接", "只解释 Citation"),
      f("r06-f05", "error-taxonomy", "错误分类优先于调参", "故障树", "把失败定位到八类根因", ["Parse miss", "Chunk miss", "Retrieval miss", "Ranking miss", "Context miss", "Generation error", "Citation error", "Freshness / ACL"], "从一次错误向下八个分类节点", "只做分类总览"),
      f("r06-f06", "single-variable-ablation", "单变量消融", "实验对比", "理解一次只改一个主要因素", ["Baseline", "Experiment A", "仅改变：rerank_n 20 → 50", "固定：语料 / 索引 / Prompt / 模型", "质量差异", "p95 延迟差异", "成本差异"], "左右两实验配置对照，中间唯一差异高亮", "只解释因果归因"),
      f("r06-f07", "latency-budget", "延迟：看分段和分位数", "时间预算", "拆解请求预算与长尾", ["T_auth", "T_rewrite", "T_retrieval", "T_rerank", "T_context", "T_generation", "T_postprocess", "p50", "p95", "p99"], "水平时间条与三条分位数标尺", "只解释延迟"),
      f("r06-f08", "cost-equation", "成本与 Token 预算", "公式拆解", "拆解每请求可变成本", ["C = C_embed + C_rerank + C_input + C_output + C_infra", "Embedding", "Rerank", "Input Token", "Output Token", "Infrastructure", "价格配置独立"], "中心公式与五项成本卡片", "不写单价"),
      f("r06-f09", "cache-key-invalidation", "缓存必须先保证正确", "键与时序", "理解安全缓存键和失效事件", ["normalized_query", "tenant_id", "role_set", "filters", "index_version", "prompt_version", "model_version", "文档更新", "权限变化", "失效"], "左侧 Key 拼装，右侧三种事件触发失效", "只解释缓存正确性"),
      f("r06-f10", "release-regression-gate", "回归门", "发布门", "用质量、安全、延迟和成本共同阻断退化", ["Candidate Version", "Recall@10", "Evidence Set Recall", "Abstention", "ACL：100% 不泄漏", "Citation Validity：100%", "p95 Latency", "Token Budget", "Release", "Block"], "候选版本经过 7 个门后分 Release/Block", "只解释发布门"),
    ],
  },
  {
    article: 7,
    file: "RAG 多模态：处理图像、视频与音频.md",
    figures: [
      f("r07-f01", "multimodal-pipeline", "多模态 RAG 的完整链路", "多路架构", "建立四模态到带定位答案的总坐标", ["Image", "Video", "Audio", "Text", "OCR / Caption / Region", "Shot / Keyframe / ASR", "ASR / Speaker / Event", "Parse / Chunk", "Modal Index", "Fusion", "Multimodal Context", "Answer + Locator"], "四路输入汇入索引与融合", "全篇总览"),
      f("r07-f02", "text-proxy-vs-native", "两种索引路线", "对比图", "区分文本代理与原生多模态向量", ["文本代理", "OCR / ASR / Caption", "复用文本检索", "可能丢失视觉与声音信息", "原生多模态向量", "共享或分离空间", "跨模态检索", "需要领域评测"], "左右两条索引路线", "只解释路线选择"),
      f("r07-f03", "media-segment-contract", "统一资产与片段数据契约", "数据契约", "统一页码、区域和时间码", ["segment_id", "asset_id", "modality", "text_proxy", "source_uri", "start_ms / end_ms", "page", "region_xywh", "acl"], "中心 Segment 卡片含 9 字段", "只解释定位字段"),
      f("r07-f04", "ocr-caption-region", "图像处理", "三列对比", "区分 OCR、Caption 与 Region", ["OCR", "文字 / 编号 / 金额", "Caption", "场景 / 对象 / 关系", "Region", "局部对象 / 图表 / 控件", "各有盲区"], "一张界面图分三种派生产物", "只解释图像表征"),
      f("r07-f05", "image-region-locator", "图像处理", "坐标图", "理解归一化区域引用", ["page = 7", "region_xywh = (0.12, 0.28, 0.46, 0.18)", "x", "y", "width", "height", "0..1", "证据区域"], "页面矩形与高亮区域、坐标箭头", "只解释坐标"),
      f("r07-f06", "video-shot-pipeline", "视频处理", "时间线", "从镜头、关键帧和 ASR 构建片段", ["Shot Boundary", "Shot 17", "Shot 18", "Keyframe", "OCR", "ASR", "00:03:12.400", "00:03:27.900", "MediaSegment"], "视频时间线分镜并对齐 ASR", "只解释视频切分"),
      f("r07-f07", "audio-evidence-types", "音频处理", "分层图", "区分 ASR、Speaker 与 Sound Event", ["Audio", "ASR：说了什么", "Diarization：谁说的", "Sound Event：发生了什么声音", "Timestamp", "不同任务需要不同证据"], "音频波形分出三条分析支路", "只解释音频任务"),
      f("r07-f08", "cross-modal-fusion", "跨模态检索与融合", "融合图", "理解多模态分数需融合或校准", ["Text Query", "Image Rank", "OCR Rank", "ASR Rank", "原始分数不可直接相加", "RRF / Calibration", "Fused Segment IDs"], "三种排名并行汇入融合", "只解释融合"),
      f("r07-f09", "multimodal-budget", "多模态 Context 构建", "预算容器", "同时控制文本、图片和媒体预算", ["Text Token", "Image Count / Resolution", "Video / Audio Duration", "Dedup", "ACL / License", "Model Input Limit", "Segment Manifest"], "三类资源进入统一预算框", "只解释 Context 预算"),
      f("r07-f10", "multimodal-error-propagation", "误差传播", "故障链", "从 OCR 错误追踪到最终回答", ["低清图片", "OCR：直属 → 直屋", "文本检索未命中", "Context 缺证据", "错误回答 / 拒答", "根因：解析层"], "5 节点红色故障链", "只解释误差传播"),
      f("r07-f11", "modality-evaluation-matrix", "分模态评测", "评测矩阵", "按处理层和检索方向拆分评测", ["解析层", "OCR / ASR / Shot", "检索层", "Text→Image", "Text→Video", "Image→Image", "生成层", "Faithfulness", "引用层", "Region / Timestamp"], "行是四层，列是模态与方向", "只解释评测设计"),
    ],
  },
  {
    article: 8,
    file: "RAG 生产部署：从开发到上线的完整指南.md",
    figures: [
      f("r08-f01", "three-plane-architecture", "生产架构的三个平面", "系统架构", "区分 Serving、Indexing 与 Control Plane", ["Serving Plane", "Identity", "Retrieval", "Generation", "Indexing Plane", "Queue", "Parse / Chunk / Embed", "Control Plane", "Version", "Eval", "Release / Rollback"], "三条水平泳道及控制箭头", "生产总览"),
      f("r08-f02", "runtime-version-vector", "版本是一等公民", "版本契约", "记录可重放请求所需版本向量", ["application", "corpus", "index", "embedding_model", "reranker", "prompt", "generation_model", "trace_id", "可重放"], "一次请求连接 7 个版本标签", "只解释版本"),
      f("r08-f03", "idempotent-index-job", "幂等索引任务", "任务时序", "理解幂等键、原子提交和 DLQ", ["job_id = hash(document_id, content_hash, pipeline_version)", "Durable Queue", "Worker", "临时产物", "Quality Check", "Atomic Commit", "Retry Budget", "DLQ"], "从消息到成功提交/失败 DLQ 两支", "只解释任务语义"),
      f("r08-f04", "blue-green-index-release", "蓝绿索引发布", "发布时序", "安全切换活动索引并回滚", ["index-v41 active", "build index-v42", "完整性检查", "黄金集", "Shadow", "Canary", "active = index-v42", "观察窗口", "Rollback to v41"], "双版本时间线与原子切换点", "只解释索引发布"),
      f("r08-f05", "request-timeout-budget", "超时、重试和背压", "时间预算", "分配端到端请求预算", ["Request Budget: 8s（示意）", "Retrieval 0.5s", "Rerank 1.0s", "Generation 5.5s", "Validation 0.5s", "Reserve 0.5s", "Cancel Propagation"], "8 秒水平时间条按 5 段划分", "只解释预算，不作为推荐值"),
      f("r08-f06", "backpressure-control", "超时、重试和背压", "容量流", "理解有界并发与队列", ["Incoming Requests", "Rate Limit", "Bounded Queue", "Concurrency Limit", "Downstream", "Timeout", "Circuit Breaker", "Reject / Degrade"], "漏斗式流量控制与旁路降级", "只解释背压"),
      f("r08-f07", "tenant-security-boundary", "身份、租户与 ACL", "安全边界", "阻止跨租户候选、缓存与日志泄漏", ["Verified Identity", "Tenant A", "ACL Policy", "Authorized Index Partition", "Tenant B", "Blocked", "Cache Namespace", "Logs / Trace"], "Tenant A 绿色路径，Tenant B 灰红阻断", "只解释租户隔离"),
      f("r08-f08", "rag-prompt-injection-defense", "Prompt Injection 与知识库投毒", "纵深防御", "把恶意文档限制在低权限数据边界", ["Malicious Document", "Source Governance", "Content Hash / Version", "Untrusted Evidence", "No Privileged Tools", "Output Schema", "Citation Validation", "Red Team Tests"], "恶意文档依次通过 7 层防御", "只解释防御层，不宣称消除风险"),
      f("r08-f09", "observability-map", "可观测性", "指标地图", "统一系统、质量、索引和成本观测", ["Request / System", "QPS / p95 / Error", "RAG Quality", "No-result / Refusal / Citation", "Index", "Freshness / DLQ / Delete Lag", "Cost", "Token / Request / Tenant", "trace_id"], "中心 Trace 连接四个指标象限", "只解释观测分类"),
      f("r08-f10", "slo-alert-runbook", "SLO 与告警", "运营流", "从 SLI 越界连接到可执行 Runbook", ["Availability", "Freshness", "Citation Validity", "SLO", "Error Budget", "Alert", "Runbook", "Impact", "Diagnosis", "Rollback", "Owner"], "三个 SLI 汇入 SLO 后触发告警与 Runbook", "只解释告警闭环"),
      f("r08-f11", "safe-degradation-ladder", "安全降级", "阶梯图", "保持证据保证的降级顺序", ["完整 RAG", "关闭可选 Query Expansion", "缩小 Rerank 候选", "只返回检索结果 + 来源", "明确暂不可用", "禁止：模型自由回答"], "四级下降阶梯，底部灰红禁止路径", "只解释降级"),
      f("r08-f12", "backup-restore-drill", "备份、恢复与灾难演练", "恢复闭环", "用恢复演练证明 RPO/RTO", ["Backup", "Isolated Restore", "Count Consistency", "Golden Queries", "ACL Adversarial Tests", "Measure RPO / RTO", "Update Runbook"], "7 节点闭环，Restore 到 Runbook 回流", "只解释灾难恢复验证"),
    ],
  },
];

export const allFigures = articles.flatMap((article) =>
  article.figures.map((figure) => ({ article: article.article, articleFile: article.file, ...figure })),
);

export function validateStoryboard() {
  const expected = [8, 9, 10, 11, 10, 10, 11, 12];
  const errors = [];
  if (articles.length !== 8) errors.push(`expected 8 articles, got ${articles.length}`);
  articles.forEach((article, index) => {
    if (article.figures.length !== expected[index]) {
      errors.push(`article ${article.article}: expected ${expected[index]} figures, got ${article.figures.length}`);
    }
  });
  const ids = allFigures.map((figure) => figure.id);
  const files = allFigures.map((figure) => figure.file);
  if (new Set(ids).size !== ids.length) errors.push("duplicate figure id");
  if (new Set(files).size !== files.length) errors.push("duplicate figure file");
  if (allFigures.length !== 81) errors.push(`expected 81 figures, got ${allFigures.length}`);
  if (errors.length) throw new Error(errors.join("\n"));
  return { articles: articles.length, figures: allFigures.length, perArticle: expected };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.log(JSON.stringify(validateStoryboard(), null, 2));
}
