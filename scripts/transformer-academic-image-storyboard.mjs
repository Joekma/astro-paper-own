/**
 * Transformer 系列学术插图分镜。
 *
 * 当前为 styleDraft。只有 prototype 获得用户确认后，styleContract 才能锁定，
 * 其余图片才允许生成。旧 SVG 仅用于概念核对，不是转换清单。
 */

import { pathToFileURL } from "node:url";

export const styleDraft = {
  status: "approved",
  approvedPrototype: "src/data/blog/AI/Transformer系列教程/images/t04-f01-self-attention-full-pipeline.png",
  useCase: "scientific-educational",
  assetType: "中文 Transformer 教程的学术模型架构图",
  canvas: "1600×900, 16:9 landscape",
  background: "白色或极浅灰论文背景",
  typography: "中文解释使用清晰无衬线字体；英文标准术语和 Tensor Shape 保持原文",
  palette: {
    token: "低饱和蓝",
    query: "低饱和红",
    key: "低饱和橙",
    value: "低饱和绿",
    attention: "低饱和紫",
    mask: "中性灰",
    ffn: "低饱和黄",
    residual: "青色",
    output: "深蓝",
  },
  constraints: [
    "每张图只解释一个核心问题",
    "严格保留 spec 中的节点数量、顺序、箭头方向、公式、数值和 Shape",
    "不得新增装饰图标、虚构节点、无关公式、品牌标志或水印",
    "最小正文标签字号按 1600×900 画布不低于 24 px",
    "50% 缩放后关键标签仍须可读",
  ],
};

export const promptTemplate = `
Use case: scientific-educational
Asset type: 中文 Transformer 教程的学术模型架构图
Primary request: 根据 IMAGE_SPEC 绘制一张独立教学图，只解释该 spec 的 learningObjective。
Scene/backdrop: 白色或极浅灰论文背景，无遮挡、无纹理噪声。
Style/medium: 顶会论文附图与研究生教材插图风格；扁平、精确、克制、矢量感强。
Composition/framing: 1600×900 横向画布；严格按 structure 布局；留白充足；细线箭头；网格对齐。
Color palette: Token 蓝、Query 红、Key 橙、Value 绿、Attention 紫、Mask 灰、FFN 黄、Residual 青、Output 深蓝；其他元素用中性灰。
Text (verbatim): 必须逐字使用 IMAGE_SPEC.requiredLabels，不增加或改写任何标签。
Constraints: 保留指定节点数、顺序、箭头方向、矩阵值、公式与 Tensor Shape；中文无衬线字体；英文术语保持英文；无装饰图标；无水印。
Avoid: 3D、照片质感、霓虹、发光、深色背景、渐变堆叠、卡通人物、无关公式、伪造数据、拼写错误、额外文字。
`;

const f = (id, slug, anchor, type, learningObjective, requiredLabels, structure, distinction) => ({
  id,
  file: `${id}-${slug}.png`,
  anchor,
  type,
  learningObjective,
  requiredLabels,
  structure,
  distinction,
});

export const articles = [
  {
    article: 1,
    file: "01-Transformer到底解决了什么问题.md",
    figures: [
      f("t01-f01", "language-model-pipeline", "本篇要解决的问题", "数据流", "建立全系列端到端坐标", ["文本", "Token", "Embedding", "Transformer", "Logits", "下一个 Token"], "6 个节点自左向右连接", "只展示端到端目标，不解释内部结构"),
      f("t01-f02", "rnn-sequential-path", "RNN 的核心限制", "时间线", "看清 RNN 的时间步依赖", ["x₁", "h₁", "x₂", "h₂", "x₃", "h₃", "必须等待"], "交错输入和隐藏状态的单向链", "只说明串行依赖"),
      f("t01-f03", "transformer-parallel-layer", "RNN 的核心限制", "并行数据流", "区分层内并行与层间顺序", ["Layer n", "x₁", "x₂", "x₃", "x₄", "并行", "Layer n+1"], "同层四节点并行进入下一层", "不讨论复杂度"),
      f("t01-f04", "dependency-path-compare", "Attention 改变了信息传递距离", "对比图", "比较长距离依赖路径", ["RNN: O(T)", "Attention: O(1)", "它", "小猫"], "上下两条路径对比", "只比较信息路径长度"),
      f("t01-f05", "parallelism-cost-matrix", "并行不等于没有代价", "对比表", "同时呈现并行优势与 T² 代价", ["同层序列并行", "最长信息路径", "位置关系存储", "RNN", "Self-Attention", "O(T²)"], "两列四行学术表格", "专门解释工程权衡"),
      f("t01-f06", "transformer-family", "Transformer 不是单一架构", "分类图", "建立三类架构的家族关系", ["Encoder-only", "Decoder-only", "Encoder–Decoder", "BERT", "GPT", "T5"], "根节点分为三条支路", "只做架构分类"),
      f("t01-f07", "shared-sentence-roadmap", "一个贯穿全系列的句子", "标注图", "展示固定例子可承载的概念", ["小猫坐在垫子上，因为它累了。", "Token", "指代", "位置", "Mask", "预测"], "句子居中，概念以引线标注", "把固定语料与后续主题连接"),
      f("t01-f08", "course-roadmap", "小结", "路线图", "总结十二篇的学习顺序", ["表示", "Attention", "Multi-Head", "位置", "Mask", "Block", "Encoder / Decoder", "Mini GPT"], "8 阶段水平路线", "只做课程导航"),
    ],
  },
  {
    article: 2,
    file: "02-文本如何变成向量：词元与嵌入.md",
    figures: [
      f("t02-f01", "token-granularity", "Token 的粒度是一项工程选择", "对比图", "比较字符、单词、子词和字节切分", ["字符", "完整单词", "子词", "字节", "序列长度", "词表大小"], "四列对比", "只比较粒度权衡"),
      f("t02-f02", "subword-merge", "Token 的粒度是一项工程选择", "过程图", "直观展示子词合并", ["l", "o", "w", "er", "low", "lower", "高频片段合并"], "从字符到子词的三步合并", "补充 BPE 类方法直觉"),
      f("t02-f03", "text-token-id", "文本、Token 与 ID 是三层对象", "数据流", "严格区分字符串、Token 和 ID", ["机器学习很有趣", "[机器] [学习] [很] [有趣]", "[3251, 892, 127, 6318]"], "三层纵向数据流", "不包含 Embedding"),
      f("t02-f04", "embedding-lookup-numeric", "一个可以手算的查表示例", "矩阵图", "展示 ID 选择矩阵行", ["Embedding E [4,3]", "ids = [2,0,3]", "取第 2、0、3 行", "output [3,3]"], "矩阵左侧高亮三行，右侧输出", "数字化查表而非概念图"),
      f("t02-f05", "semantic-space", "语义空间", "向量空间", "说明方向和距离承载统计关系", ["国王", "王后", "男人", "女人", "降维示意"], "二维散点与关系箭头", "明确标注仅为降维示意"),
      f("t02-f06", "polysemy-context", "“语义空间”是一个有用但有限的直觉", "分叉图", "解释相同初始向量如何上下文化", ["苹果", "水果语境", "公司语境", "初始 Embedding 相同", "Attention 后不同"], "一个输入分为两条上下文支路", "专讲一词多义"),
      f("t02-f07", "embedding-shape", "永远标出 Tensor Shape", "Shape 图", "建立 B、T、C 三轴", ["Token IDs [B,T]", "Embedding [V,C]", "Output [B,T,C]", "B: Batch", "T: Sequence", "C: Channel"], "输入、查表、输出三卡片", "专讲形状"),
      f("t02-f08", "contextual-representation-flow", "静态向量如何变成上下文向量", "层级流", "展示表示被多层逐步重写", ["Token", "Static Embedding", "+ Position", "Layer 1", "Layer N", "Contextual Representation"], "六阶段水平流", "专讲深度更新"),
      f("t02-f09", "token-misconceptions", "本篇自检", "自检图", "用三组判断题收束输入表示", ["ID ≠ 语义大小", "Token ≠ 单词", "Embedding ≠ 最终语义"], "三张判断卡片", "总结误区，不新增机制"),
    ],
  },
  {
    article: 3,
    file: "03-从查询资料理解注意力机制.md",
    figures: [
      f("t03-f01", "library-retrieval", "把 Attention 想成一次软检索", "类比图", "用检索建立 QKV 职责", ["Query: 想找什么", "Key: 怎样被匹配", "Value: 真正的内容"], "三列检索卡片", "只建立生活类比"),
      f("t03-f02", "pronoun-reference", "语言中的具体例子", "关系图", "展示 it 对 animal 的读取关系", ["The animal", "it", "was tired", "高匹配"], "句子 Token 与一条强调箭头", "只讲指代例子"),
      f("t03-f03", "qkv-token-roles", "从直觉过渡到 QKV", "角色图", "把单个 Token 的三种投影视角分开", ["同一个 Token", "Query", "Key", "Value", "需要什么", "匹配什么", "提供什么"], "中心 Token 分三支", "从类比进入模型变量"),
      f("t03-f04", "attention-score-row", "注意力是一组归一化权重", "条形图", "展示一个 Query 对全部 Key 的分数", ["Query: 它", "小猫 2.1", "垫子 0.7", "累了 1.2", "raw scores"], "三个横向分数条", "Softmax 前的分数"),
      f("t03-f05", "softmax-weights", "注意力是一组归一化权重", "条形图", "展示 Softmax 后权重和为 1", ["0.65", "0.20", "0.15", "sum = 1"], "与上一图相同位置的归一化条形", "只解释 Softmax 后"),
      f("t03-f06", "weighted-value-sum", "用一行数字完成一次“读取”", "公式拆解", "把权重落实为 Value 加权和", ["0.65[2,0]", "+ 0.20[0,3]", "+ 0.15[1,1]", "= [1.45,0.75]"], "四段公式由左到右", "完整使用正文数字"),
      f("t03-f07", "isolated-to-contextual", "Self-Attention 的 Self 是什么", "前后对比", "说明输出是被更新的表示", ["孤立 Token 表示", "Self-Attention", "上下文 Token 表示", "[T,C] → [T,C]"], "输入与输出双栏", "只说明表示更新"),
      f("t03-f08", "attention-explanation-boundary", "注意力权重不是完整解释", "边界图", "展示权重之外的影响路径", ["Attention Weights", "Value Projection", "Residual", "Output Projection", "Next Layers", "Final Representation"], "多条支路汇入最终表示", "强调解释边界"),
      f("t03-f09", "attention-intuition-summary", "本篇自检", "总结图", "用寻址与内容两条线总结 Attention", ["Q + K = 寻址", "Weights", "V = 内容", "Context"], "上方寻址、下方内容，最终汇合", "为数学推导做过渡"),
    ],
  },
  {
    article: 4,
    file: "04-自注意力机制完整数学推导.md",
    figures: [
      f("t04-f01", "self-attention-full-pipeline", "本篇要解决的问题", "完整流程", "在一张图中建立 Self-Attention 数学总览", ["输入 X [B,T,C]", "Q [B,H,T,D]", "K [B,H,T,D]", "V [B,H,T,D]", "QKᵀ / √D", "可选 Mask", "Softmax", "weights @ V", "Concat + Wᴼ", "输出 [B,T,C]"], "自左向右主流程；Q/K 汇入分数；V 在权重后汇入；Mask 以虚线进入 Softmax 前", "首张风格 prototype；唯一允许展示完整链路"),
      f("t04-f02", "x-to-qkv", "第一步：从同一输入投影 Q、K、V", "投影图", "说明 QKV 来自同一 X 的不同线性投影", ["X [B,T,C]", "WQ", "WK", "WV", "Q [B,T,D]", "K [B,T,D]", "V [B,T,D]"], "X 分三支", "只讲投影来源"),
      f("t04-f03", "dot-product-geometry", "第二步：用点积计算所有匹配", "向量几何", "解释向量夹角与点积分数", ["方向接近: 高分", "近似垂直: 低分", "方向相反: 负分"], "三组二维箭头", "几何直觉，不画矩阵"),
      f("t04-f04", "score-matrix", "第二步：用点积计算所有匹配", "矩阵图", "解释 QKᵀ 为什么得到 T×T", ["Query 轴 T", "Key 轴 T", "QKᵀ [T,T]", "row i: Query i", "column j: Key j"], "带行列轴的方阵", "只讲全部位置对"),
      f("t04-f05", "sqrt-scaling", "第三步：缩放分数", "分布对比", "解释除以 √D 避免 Softmax 过早饱和", ["D 増大", "点积方差增大", "÷ √D", "稳定尺度", "保留梯度"], "左右两组分布与中间缩放", "只讲尺度"),
      f("t04-f06", "optional-mask-position", "第四步：逐行 Softmax", "流程图", "固定 Mask 在 Softmax 前的位置", ["scaled scores", "+ optional Mask", "future = −∞", "Softmax", "future weight = 0"], "五步水平流程", "只讲可选 Mask 接口"),
      f("t04-f07", "row-wise-softmax", "第四步：逐行 Softmax", "数值图", "展示逐行归一化而非整矩阵归一化", ["[2.1, 0.3, −0.7]", "Softmax(dim=−1)", "[0.81, 0.13, 0.06]", "row sum = 1"], "单行数值前后对比", "只讲 Softmax"),
      f("t04-f08", "weights-times-values", "第五步：混合 Value", "矩阵乘法", "说明输出是 A@V 而不是权重矩阵", ["A [B,T,T]", "V [B,T,D]", "O [B,T,D]", "A @ V"], "两个矩阵相乘得到输出", "只讲 Value 聚合"),
      f("t04-f09", "attention-shape-table", "Tensor Shape 总表", "Shape 表", "集中核对所有核心张量", ["X [B,T,C]", "Q/K/V [B,H,T,D]", "scores [B,H,T,T]", "weights [B,H,T,T]", "out [B,H,T,D]"], "五行学术表格", "只做 Shape 检查"),
      f("t04-f10", "two-token-hand-calculation", "一个从头到尾可手算的例子", "手算图", "复现正文 2 Token 数值推导", ["Q = K = I₂", "V = [[2,0],[0,4]]", "S = [[0.707,0],[0,0.707]]", "A ≈ [[0.67,0.33],[0.33,0.67]]", "O ≈ [[1.34,1.32],[0.66,2.68]]"], "Q/K/V、S、A、O 五个矩阵依次排列", "数字必须与正文完全一致"),
      f("t04-f11", "formula-shape-code", "公式、Shape 与 PyTorch 对齐", "代码映射", "把三种表达逐项对齐", ["QKᵀ", "[B,H,T,D] @ [B,H,D,T]", "q @ k.transpose(−2,−1)", "Softmax", "weights @ v"], "三列：公式、Shape、代码", "只做表达映射"),
      f("t04-f12", "self-attention-checklist", "本篇自检", "检查清单", "总结轴、归一化和输出三项关键检查", ["Query 行", "Key 列", "Softmax 沿 Key", "输出 = weights @ V"], "四张检查卡片", "不重复完整流程"),
    ],
  },
  {
    article: 5,
    file: "05-为什么需要多头注意力.md",
    figures: [
      f("t05-f01", "multiple-relations", "一句话里通常有多种关系", "关系图", "展示一句话中的多类关系", ["指代", "语法", "位置", "因果"], "同一句 Token 上四种颜色连线", "说明多视角需求"),
      f("t05-f02", "single-vs-multi-head", "一句话里通常有多种关系", "对比图", "比较单投影空间与多投影空间", ["Single Head", "Multi-Head", "多个可学习子空间"], "左右对比", "不讲 Shape"),
      f("t05-f03", "split-head-dimension", "拆头：从 C 变成 H×D", "Shape 图", "解释 C=H×D 与轴转置", ["[B,T,C]", "[B,T,H,D]", "[B,H,T,D]", "C = H × D"], "三阶段 reshape/transpose", "专讲拆头"),
      f("t05-f04", "head-patterns", "每个头独立计算 Attention", "热力图组", "展示多个头可能形成不同模式", ["Head 1", "Head 2", "Head 3", "Head 4", "示意，不是固定职责"], "2×2 小热力图", "强调模式可能不同"),
      f("t05-f05", "per-head-attention", "每个头独立计算 Attention", "并行流", "展示 H 个头独立完成相同公式", ["Qₕ", "Kₕ", "Vₕ", "Attentionₕ", "[B,H,T,D]"], "四条并行通道", "专讲每头计算"),
      f("t05-f06", "concat-output-projection", "合并：转回 T 在前并拼接", "数据流", "解释 Concat 与 Wᴼ", ["heads [B,H,T,D]", "transpose", "Concat [B,T,C]", "Wᴼ", "output [B,T,C]"], "五阶段水平流", "只讲合并"),
      f("t05-f07", "mha-parameter-count", "参数量并不简单乘以头数", "参数表", "展示固定 C 时主参数量约 4C²", ["WQ: C²", "WK: C²", "WV: C²", "Wᴼ: C²", "Total: 4C²"], "四项汇总表", "专讲参数量"),
      f("t05-f08", "mha-complexity", "参数量并不简单乘以头数", "公式图", "说明 H·D=C 后复杂度仍为 T²C", ["O(B·H·T²·D)", "H·D = C", "O(B·T²·C)"], "公式化简三步", "专讲计算量"),
      f("t05-f09", "mha-shape-checklist", "本篇自检", "Shape 清单", "收束多头实现最易错的轴", ["Q/K/V [B,H,T,D]", "scores [B,H,T,T]", "heads [B,H,T,D]", "output [B,T,C]"], "四行 Shape 清单", "只做实现核对"),
    ],
  },
  {
    article: 6,
    file: "06-Transformer如何理解词序.md",
    figures: [
      f("t06-f01", "word-order-meaning", "Token 相同，顺序可能改变意义", "对比图", "说明词序改变语义角色", ["猫追狗", "狗追猫", "Token 集合相同", "语义不同"], "左右句子对比", "只建立问题"),
      f("t06-f02", "permutation-equivariance", "用置换看清问题", "数学示意", "解释无位置 Attention 的排列等变性", ["X", "PX", "Attn(X)", "P Attn(X)", "Attn(PX)=P Attn(X)"], "上下两条同步置换路径", "精确解释等变性"),
      f("t06-f03", "token-plus-position", "最直接的做法：向量相加", "数据流", "说明位置向量与词向量同维相加", ["Token Embedding [T,C]", "Position [T,C]", "+", "Input [T,C]"], "两输入汇合", "只讲加法注入"),
      f("t06-f04", "sinusoidal-waves", "原论文的正弦余弦位置编码", "曲线图", "展示不同维度使用不同频率", ["低频", "中频", "高频", "position"], "三条频率不同的波形", "不画热力图"),
      f("t06-f05", "positional-heatmap", "原论文的正弦余弦位置编码", "热力图", "展示位置×维度的整体编码", ["Position", "Dimension", "sin", "cos"], "标准位置编码热力图", "只展示矩阵外观"),
      f("t06-f06", "learned-position-table", "学习式位置 Embedding", "查表图", "比较学习式位置表与 Token 表", ["Position IDs [0…T−1]", "Position Embedding [maxT,C]", "lookup", "[T,C]"], "位置 ID 查表流程", "只讲学习式绝对位置"),
      f("t06-f07", "rope-rotation", "从绝对位置到相对关系", "几何图", "说明 RoPE 旋转 Q/K 并影响点积", ["Q", "K", "position-dependent rotation", "relative offset", "dot product"], "二维旋转向量与相对夹角", "只讲 RoPE 直觉"),
      f("t06-f08", "position-methods-compare", "三类位置方法对比", "对比表", "集中比较正弦、学习式和 RoPE", ["正弦/余弦", "学习式绝对位置", "RoPE", "注入位置", "可学习", "主要限制"], "三列多行学术表格", "只做方法选择"),
      f("t06-f09", "position-checklist", "本篇自检", "总结图", "总结位置方法解决的共同问题", ["内容相同", "位置不同", "表示必须可区分", "顺序信息"], "问题到目标的四步流程", "不引入新方法"),
    ],
  },
  {
    article: 7,
    file: "07-注意力掩码是什么.md",
    figures: [
      f("t07-f01", "next-token-objective", "自回归目标", "时间线", "说明每个位置预测下一个 Token", ["今天", "天气", "很", "好", "xₜ → xₜ₊₁"], "Token 时间线与右移箭头", "只讲任务目标"),
      f("t07-f02", "future-leakage", "不加 Mask 会发生什么", "错误示意", "展示位置 t 偷看标签", ["position t", "future t+1", "label leakage", "错误"], "红色越界箭头", "只讲泄漏"),
      f("t07-f03", "causal-triangle", "下三角可见矩阵", "矩阵图", "展示 j≤i 的可见区域", ["✓", "×", "Query i", "Key j", "j ≤ i"], "4×4 下三角矩阵", "只讲可见性"),
      f("t07-f04", "mask-before-softmax", "Mask 要加在 Softmax 之前", "数值流", "解释 −∞ 如何变成权重 0", ["scores", "+ Mask", "−∞", "Softmax", "0"], "五步水平流", "只讲计算位置"),
      f("t07-f05", "mask-broadcast", "Mask 怎样广播", "Shape 图", "解释两类 Mask 的广播轴", ["scores [B,H,T,T]", "causal [1,1,T,T]", "padding [B,1,1,T]", "result [B,H,T,T]"], "三输入汇入结果", "专讲广播"),
      f("t07-f06", "combined-masks", "Causal Mask 与 Padding Mask", "对比矩阵", "展示时间约束与补齐约束组合", ["Causal", "Padding", "Combined", "future", "pad"], "三个小矩阵并列", "专讲组合语义"),
      f("t07-f07", "teacher-forcing", "Teacher Forcing 为什么不等于作弊", "数据流", "说明完整序列输入仍受因果边界", ["完整正确序列", "Causal Mask", "每个位置只看过去", "并行计算 loss"], "输入经过 Mask 分到各位置", "只讲训练条件"),
      f("t07-f08", "train-vs-generation", "为什么训练并行、生成串行", "对比图", "比较训练一次前向与生成逐步追加", ["训练: 全位置并行", "生成: 预测 → 追加 → 再预测"], "左右流程对比", "不讲缓存"),
      f("t07-f09", "kv-cache-boundary", "为什么训练并行、生成串行", "缓存图", "说明 KV Cache 省重算但不消除顺序依赖", ["Past K/V Cache", "new Query", "next Token", "仍需逐步"], "缓存与新 Token 数据流", "专讲缓存边界"),
    ],
  },
  {
    article: 8,
    file: "08-注意力机制之外还有什么.md",
    figures: [
      f("t08-f01", "attention-vs-ffn", "两种互补计算", "对比图", "区分跨 Token 通信和逐位置加工", ["Attention", "Token 之间通信", "FFN", "每个 Token 内部加工"], "左右双栏", "只讲职责"),
      f("t08-f02", "ffn-expand-contract", "Position-wise FFN", "Shape 流", "展示 C→d_ff→C", ["d_model", "Linear", "d_ff", "Activation", "Linear", "d_model"], "五阶段漏斗", "只讲扩降维"),
      f("t08-f03", "activation-necessity", "为什么先扩维再压回去", "对比图", "解释无激活的多层仍是线性", ["Linear ∘ Linear = Linear", "Activation", "Non-linear Features"], "上下两条计算路径", "专讲非线性"),
      f("t08-f04", "position-wise-sharing", "Position-wise FFN", "并行图", "说明每个位置独立但共享参数", ["Token 1", "Token 2", "Token 3", "同一个 FFN", "参数共享"], "三位置并行经过同一模块", "只讲逐位置"),
      f("t08-f05", "residual-path", "Residual", "路径图", "展示 x 与 F(x) 的旁路相加", ["x", "F(x)", "+", "y = x + F(x)"], "主干与支路汇合", "只讲残差"),
      f("t08-f06", "layernorm-axis", "LayerNorm", "轴示意", "说明对单 Token 的 C 维归一化", ["x[b,t,:]", "C features", "mean", "variance", "γ", "β"], "单行特征向量与统计量", "只讲归一化轴"),
      f("t08-f07", "pre-vs-post-norm", "Post-Norm 与 Pre-Norm", "对比流程", "精确比较 Norm 位置", ["Post: Norm(x + F(x))", "Pre: x + F(Norm(x))"], "上下两条残差流", "只比较顺序"),
      f("t08-f08", "dropout-locations", "Dropout 放在哪里", "架构标注", "标出常见 Dropout 位置", ["Attention Weights", "Sub-layer Output", "Embedding + Position", "Train only"], "Block 简图上三处标记", "专讲正则位置"),
      f("t08-f09", "full-prenorm-block-shapes", "完整 Pre-Norm Block", "完整模块图", "汇总 Block 数据流和 Shape 不变", ["x [B,T,C]", "LN", "MHA", "Residual", "LN", "FFN", "Residual", "output [B,T,C]"], "两段 Pre-Norm 残差链", "本篇总结图"),
    ],
  },
  {
    article: 9,
    file: "09-原始Transformer编码器.md",
    figures: [
      f("t09-f01", "encoder-overview", "Encoder 的宏观数据流", "架构图", "建立 Encoder 总体数据流", ["Token + Position", "N × Encoder Layer", "Encoder Memory [B,T,C]"], "三阶段垂直堆栈", "只做宏观结构"),
      f("t09-f02", "source-padding-mask", "Source Mask 约束什么", "Mask 图", "说明双向不读取 Padding", ["valid Token", "PAD", "Source Mask [B,1,1,T]", "双向有效位置"], "Token 行与可见矩阵", "专讲 Source Mask"),
      f("t09-f03", "encoder-layer", "放大一个 Encoder Layer", "模块图", "展示 Encoder 两个子层", ["Self-Attention", "Add & Norm", "FFN", "Add & Norm"], "四阶段垂直流", "只讲单层"),
      f("t09-f04", "bidirectional-attention", "Encoder 的 Self-Attention 是双向的", "可见性图", "展示每个有效位置读取左右上下文", ["left context", "current Token", "right context", "bidirectional"], "中心 Token 与双向箭头", "专讲可见范围"),
      f("t09-f05", "encoder-stack", "为什么能一层接一层", "层级图", "展示同 Shape 多层堆叠", ["Layer 1 [B,T,C]", "Layer 2 [B,T,C]", "Layer N [B,T,C]"], "多层竖直堆叠", "只讲接口一致"),
      f("t09-f06", "independent-layer-parameters", "堆叠不等于参数共享", "对比图", "区分相同结构与独立参数", ["相同结构", "不同参数 θ₁", "θ₂", "θₙ", "默认不共享"], "三个同形模块不同参数标记", "专讲参数独立"),
      f("t09-f07", "representation-depth", "为什么能一层接一层", "层级示意", "说明表示随深度逐步重写", ["Embedding", "局部模式", "句法/指代", "任务相关语义", "示意，不是固定定律"], "四级抽象层次", "专讲表示变化"),
      f("t09-f08", "encoder-output-uses", "Encoder 与 BERT 的关系", "用途矩阵", "比较 Encoder Memory 的不同下游用法", ["Cross-Attention K/V", "Token 分类", "句子分类", "向量检索", "BERT ≠ 翻译 Encoder"], "中心 Encoder 输出分四支", "只讲输出接口"),
    ],
  },
  {
    article: 10,
    file: "10-从原始解码器到GPT.md",
    figures: [
      f("t10-f01", "encoder-decoder-overview", "先还原 2017 年的完整架构", "全景架构", "展示原始两条堆栈", ["Source", "Encoder", "Encoder Memory", "Target Prefix", "Decoder", "Next Token"], "Encoder 与 Decoder 双列数据流", "只做原始架构总览"),
      f("t10-f02", "shifted-target", "目标序列为什么要右移", "序列对齐", "展示 Decoder input 与 label 错一位", ["Decoder input", "<bos>", "猫", "睡觉", "Training label", "<eos>"], "上下两行对齐 Token", "专讲右移"),
      f("t10-f03", "decoder-layer", "原始 Decoder Layer 的三个子层", "模块图", "展示三子层及残差归一化", ["Masked Self-Attention", "Cross-Attention", "FFN", "Add & Norm"], "三子层垂直堆叠", "只讲单层"),
      f("t10-f04", "cross-attention-sources", "Cross-Attention", "来源图", "固定 Q 来自 Decoder、K/V 来自 Encoder", ["Q ← Decoder", "K ← Encoder Memory", "V ← Encoder Memory"], "两来源汇入 Cross-Attention", "只讲来源"),
      f("t10-f05", "cross-attention-shapes", "Cross-Attention", "Shape 图", "推导 T_tgt×T_src 分数矩阵", ["Q [B,H,T_tgt,D]", "Kᵀ [B,H,D,T_src]", "scores [B,H,T_tgt,T_src]", "V [B,H,T_src,D]", "out [B,H,T_tgt,D]"], "矩阵乘法链", "专讲 Shape"),
      f("t10-f06", "translation-flow", "Cross-Attention", "任务数据流", "说明源句编码一次、目标逐步生成", ["The cat sleeps", "Encoder Memory", "猫", "猫 睡", "猫 睡觉"], "源句到逐步目标时间线", "专讲翻译任务"),
      f("t10-f07", "three-transformer-families", "三类架构的分界", "对比表", "比较三类堆栈与注意力", ["Encoder-only", "Decoder-only", "Encoder–Decoder", "双向", "因果", "Cross"], "三列架构表", "专讲家族"),
      f("t10-f08", "gpt-decoder-only", "GPT 如何得到 Decoder-only", "架构图", "展示 GPT 保留与删除的模块", ["Token + Position", "N × Causal Block", "Final Norm", "LM Head", "删除 Encoder", "删除 Cross-Attention"], "单堆栈与删除标注", "专讲结构迁移"),
      f("t10-f09", "gpt-next-token-training", "每个位置都提供训练信号", "序列图", "展示所有位置并行提供 next-token loss", ["input [我,喜,欢,学]", "target [喜,欢,学,习]", "logits [B,T,V]"], "输入标签上下对齐并连线", "专讲训练目标"),
      f("t10-f10", "decoder-terminology", "“Decoder”一词的三种语境", "术语图", "区分原始 Decoder、Decoder-only 与自编码器 Decoder", ["原始 Transformer Decoder", "Decoder-only Block", "Autoencoder Decoder", "根据数据流判断"], "三张术语卡片", "专讲命名边界"),
    ],
  },
  {
    article: 11,
    file: "11-用PyTorch手写Transformer模块.md",
    figures: [
      f("t11-f01", "module-dependencies", "模块依赖先行", "依赖图", "展示代码模块组合关系", ["CausalSelfAttention", "FeedForward", "Block", "MiniGPT"], "四级依赖树", "只讲类组合"),
      f("t11-f02", "qkv-code-map", "Causal Multi-Head Self-Attention", "代码映射", "对齐 qkv Linear、chunk 与公式", ["self.qkv(x) [B,T,3C]", "chunk(3)", "Q", "K", "V"], "代码行到三个张量", "专讲一次投影"),
      f("t11-f03", "registered-causal-mask", "初始化：参数与不可训练 Mask", "代码结构", "解释 register_buffer 的职责", ["mask [1,1,block_size,block_size]", "register_buffer", "随设备移动", "无梯度"], "Mask 矩阵与三项属性", "专讲 buffer"),
      f("t11-f04", "attention-code-shapes", "前向：投影、拆头、注意力与合并", "Shape 流", "展示完整代码 Shape", ["x [B,T,C]", "q/k/v [B,H,T,D]", "scores [B,H,T,T]", "out [B,H,T,D]", "output [B,T,C]"], "五阶段水平流", "只讲 Shape"),
      f("t11-f05", "masked-fill", "看清 Mask 前后", "矩阵对比", "展示 masked_fill 将上三角变为 −∞", ["before", "causal mask", "after", "−∞", "Softmax → 0"], "三个 4×4 矩阵", "专讲数值效果"),
      f("t11-f06", "transpose-contiguous-view", "为什么要 transpose、contiguous、view", "内存布局", "解释轴顺序和连续布局", ["[B,H,T,D]", "transpose", "[B,T,H,D]", "contiguous", "view [B,T,C]"], "五步轴变换", "专讲实现细节"),
      f("t11-f07", "ffn-block-code", "FFN 与完整 Block", "代码架构", "展示 FFN 与两条 Pre-Norm 残差", ["LN1", "Attention", "+x", "LN2", "FFN", "+x"], "两段残差链", "专讲 Block.forward"),
      f("t11-f08", "forward-dataflow", "FFN 与完整 Block", "数据流", "用伪代码对应前向更新", ["x = x + attn(ln1(x))", "x = x + ffn(ln2(x))", "[B,T,C]"], "两行公式与 Shape", "公式化总结代码"),
      f("t11-f09", "shape-gradient-test", "先做接口测试", "测试图", "展示 Shape、有限值和梯度三项断言", ["shape unchanged", "isfinite(y)", "backward()", "finite grad"], "四张测试卡片", "专讲接口测试"),
      f("t11-f10", "causal-leakage-test", "因果不泄漏测试", "实验图", "说明只改未来并比较过去输出", ["x₁: original", "x₂: change positions 6..7", "compare y[:, :6]", "allclose = True"], "两输入并行通过同一 Block 后比较", "专讲语义测试"),
    ],
  },
  {
    article: 12,
    file: "12-从二元模型到迷你GPT.md",
    figures: [
      f("t12-f01", "text-data-pipeline", "从字符级数据开始", "数据流", "展示原始文本到整数数据", ["Raw Text", "Vocabulary", "stoi / itos", "encode", "data [N]"], "五阶段水平流", "只讲编码"),
      f("t12-f02", "train-validation-split", "训练集与验证集必须分开", "切分图", "解释 90/10 数据划分和用途", ["Train 90%", "Validation 10%", "拟合", "泛化"], "长条数据分段", "专讲数据划分"),
      f("t12-f03", "sliding-window", "滑动窗口与右移标签", "序列图", "展示 hello 构造 hell/ello", ["text: hello", "x: hell", "y: ello", "shift by 1"], "三行字符对齐", "专讲样本构造"),
      f("t12-f04", "bigram-baseline", "先建立 Bigram 基线", "模型图", "说明当前 Token 直接查下一个 logits", ["current Token ID", "Embedding [V,V]", "next-token logits [V]", "no context"], "三阶段流与 no context 标记", "专讲基线"),
      f("t12-f05", "mini-gpt-architecture", "组装 Mini GPT", "完整架构", "汇总可训练语言模型堆栈", ["Token Embedding", "+ Position", "N × Transformer Block", "LayerNorm", "LM Head", "Logits [B,T,V]"], "六阶段水平或垂直堆栈", "本篇架构总览"),
      f("t12-f06", "logits-to-sampling", "从 Logits 到 Token", "数据流", "展示温度、Softmax、top-k 和采样", ["Logits", "÷ temperature", "Softmax", "top-k", "multinomial", "next Token"], "六阶段水平流", "专讲采样"),
      f("t12-f07", "cross-entropy", "交叉熵连接预测与训练目标", "公式图", "解释正确 Token 概率与 loss", ["target Token y", "p(y|context)", "loss = −log p(y)", "概率越低，损失越大"], "概率曲线与公式", "专讲损失"),
      f("t12-f08", "teaching-config", "组装 Mini GPT", "配置表", "记录最小教学配置", ["block_size=128", "n_embd=128", "n_head=4", "n_layer=4", "dropout=0.1"], "五行参数表", "只讲起始配置"),
      f("t12-f09", "training-loop", "交叉熵连接预测与训练目标", "训练循环", "展示优化器更新闭环", ["get_batch", "forward", "loss", "zero_grad", "backward", "clip_grad_norm", "optimizer.step"], "环形七步流程", "专讲训练"),
      f("t12-f10", "train-validation-loss", "一个最小验证损失函数", "曲线对比", "区分未学会和过拟合", ["Train Loss", "Validation Loss", "underfitting", "best checkpoint", "overfitting"], "两条损失曲线", "专讲评估"),
      f("t12-f11", "autoregressive-generation", "自回归生成循环", "循环图", "展示上下文裁剪、预测、追加和限制", ["context", "crop to block_size", "predict", "sample", "append", "repeat", "Mini GPT ≠ Chat Assistant"], "五步闭环与边界注释", "系列最终总结图"),
    ],
  },
];

export const prototype = {
  figureId: "t04-f01",
  approvalGate: false,
  approved: true,
  outputMode: "approved style reference",
  instruction: "以确认样图作为其余图片的风格参考。",
};

export const allFigures = articles.flatMap(article =>
  article.figures.map(figure => ({ article: article.article, ...figure })),
);

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const counts = Object.fromEntries(articles.map(a => [a.article, a.figures.length]));
  console.log(JSON.stringify({ total: allFigures.length, counts, prototype }, null, 2));
}
