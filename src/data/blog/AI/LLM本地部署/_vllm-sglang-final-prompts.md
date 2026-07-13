# 《vLLM 与 SGLang》最终 Prompt 清单

## 使用方式

除 F04 外，每张图都将已确认样图 `images/local-serving-f04-kv-management-comparison.png` 作为 `referenced_image_paths` 中唯一的风格参考图，并使用下面的共享前缀加对应图片的独有 Prompt。

```text
Use case: scientific-educational
Asset type: Chinese technical blog teaching diagram, 16:9 landscape
Input images: Image 1 is a STYLE REFERENCE ONLY. Match its white academic background, flat vector-like modules, thin arrows, Chinese/English typography, low-saturation colors, alignment and generous whitespace. Do not copy its content.
Constraints: exact readable labels, technically accurate relationships, no invented performance numbers.
Avoid: watermark, logos, gradients, 3D, heavy shadows, decorative clutter, tiny text.
```

## F01 服务分层

```text
Primary request: create a five-layer top-to-bottom architecture diagram explaining where an LLM inference serving engine sits.
Title: "本地大模型推理服务分层".
Five layers in exact order: "业务应用 / Agent / RAG / Dify", "HTTP API", "vLLM / SGLang 推理服务", "模型权重 + Tokenizer + Chat Template", "GPU / NPU / CPU".
Role labels: "业务逻辑", "服务接口", "调度 · 显存 · 生成", "能力与输入格式", "计算硬件".
Arrows strictly top-to-bottom. Show vLLM/SGLang as serving engines, never as model names.
```

## F02 Prefill 与 Decode

### 首次生成

```text
Primary request: create a left-to-right timeline showing one LLM generation request split into Prefill and Decode.
Title: "一次请求的 Prefill 与 Decode".
Required labels: "Input Tokens", "Prefill", "KV Cache", "First Token", "Decode 1", "Decode 2", "Decode 3", "Output Tokens", "TTFT", "ITL", "TPOT".
Flow: blue Input Tokens enter one orange Prefill block; Prefill creates a purple KV Cache and emits First Token; three green Decode steps occur sequentially.
TTFT spans request start to First Token. ITL spans adjacent output tokens. TPOT spans the repeated Decode region after First Token.
```

### 定向修订

```text
Correct only token numbering and KV Cache progression.
Token sequence: First Token y1; Decode 1 y2; Decode 2 y3; Decode 3 y4; Output Tokens y1 y2 y3 y4.
Cache progression: Prompt KV; Prompt KV + y1; Prompt KV + y1 + y2; Prompt KV + y1 + y2 + y3; Prompt KV + y1 + y2 + y3 + y4.
Preserve title, layout, colors and metric brackets.
```

修订后 `Decode 2`、`Decode 3` 仍出现重复编号，最终使用确定性文本层覆盖为 `y₃`、`y₄`。

## F03 KV Cache 公式

```text
Primary request: create a formula explainer showing why one sequence's KV Cache is approximately 1 GiB.
Title: "KV Cache 显存估算".
Formula: "M_KV ≈ 2 × L × T × H_kv × D_h × B".
Variable cards: "2 = Key + Value", "L = 32 层", "T = 8192 Tokens", "H_kv = 8", "D_h = 128", "B = 2 bytes (BF16)".
Substitution: "2 × 32 × 8192 × 8 × 128 × 2".
Result: "≈ 1 GiB / sequence".
Footnote: "教学近似值，不含模型权重与运行时开销".
```

## F04 KV Cache 管理对比

F04 的完整首次生成 Prompt、定向修订和确定性覆盖说明保存在 `_vllm-sglang-image-plan.md` 的 F04 小节。

## F05 连续批处理

### 首次生成

```text
Primary request: create a three-column scheduler timeline explaining Continuous Batching.
Title: "连续批处理 Continuous Batching".
Columns: "Iteration 1", "Iteration 2", "Iteration 3".
Iteration 1: A 处理中, B 处理中, C 处理中.
Iteration 2: A 处理中, B 处理中, C 完成.
Iteration 3: A 处理中, B 处理中, D 加入.
Conclusion: "完成请求退出，等待请求进入；无需等待整批结束".
```

### 定向修订

```text
Remove the current "C 立即移出" annotation between Iteration 1 and Iteration 2.
Between Iteration 2 and Iteration 3 place exactly: "C 立即移出，D 立即补位".
Preserve all request states and the conclusion.
```

## F06 vLLM 部署闭环

```text
Primary request: create a left-to-right minimal production deployment flow for a vLLM OpenAI-compatible service.
Title: "vLLM 最小部署闭环".
Nodes in order: "OpenAI Client", "Reverse Proxy / Auth", "vLLM API Server", "Scheduler + KV Cache", "Model on GPU".
Forward label: "HTTP Request". Return label: "Streaming Tokens".
Security note: "API Key 不是完整安全边界".
Configuration chips: "Model Revision", "dtype / Quantization", "Tensor Parallel".
```

## F07 Radix Tree

```text
Primary request: create a Radix Tree diagram explaining longest shared-prefix KV reuse for three enterprise requests.
Title: "Radix Tree：共享前缀如何复用".
Shared path: "角色" → "评分规则" → "JSON Schema".
Branches: "企业 A 数据", "企业 B 数据", "企业 C 数据".
Labels: "Cached KV", "Cache Hit", "Cache Miss", "Eviction".
Conclusion: "共享路径只计算一次，不同后缀分别计算".
Shared prefix appears once; exactly three branches begin after JSON Schema.
```

## F08 SGLang 部署闭环

```text
Primary request: create a left-to-right minimal production deployment flow for an SGLang OpenAI-compatible service.
Title: "SGLang 最小部署闭环".
Nodes in order: "OpenAI Client", "SGLang API Server", "Chat Template / Parser", "Scheduler", "Radix Cache", "Model on GPU".
Forward label: "HTTP Request". Return label: "Streaming Tokens".
Note: "Parser 适配模型协议，不等于模型能力".
Configuration chips: "Reasoning Parser", "Tool Parser", "API Key".
Parser sits between API server and scheduler and is not inside the model.
```

## F09 能力重叠

```text
Primary request: create a two-circle capability overlap diagram for vLLM and SGLang that avoids a false binary comparison.
Title: "vLLM 与 SGLang：共同能力与代表性设计".
Left-only: "PagedAttention", "通用 serving 生态".
Right-only: "RadixAttention", "前缀感知运行时".
Shared center: "OpenAI API", "Continuous Batching", "Paged KV", "Prefix Cache", "Structured Outputs", "Quantization", "Distributed", "Multimodal".
Conclusion: "共同能力很多，差异需要在目标模型与硬件上实测".
All eight shared labels must appear only in the overlap.
```

## F10 选型决策树

```text
Primary request: create a top-to-bottom decision tree for selecting an LLM serving engine without declaring a fixed winner.
Title: "本地推理引擎选型决策树".
Decision nodes in order: "模型支持？", "硬件支持？", "容量足够？", "特殊能力满足？", "真实负载压测", "按 SLO 选择".
No branch outcome: "更换模型 / 硬件 / 配置".
Special ability chips: "量化", "多 GPU", "多模态", "Prefix Cache", "Structured Outputs".
Metric chips: "TTFT", "TPOT", "Goodput", "错误率", "显存".
Final leaf must not name a fixed winner.
```

## F11 压测工作负载

```text
Primary request: create a five-row experimental workload matrix for fair LLM serving benchmarks.
Title: "五类工作负载：分别测试什么".
Headers: Workload, Input, Output, Cache, Primary Metrics.
Rows:
1. 短入短出 | Short | Short | Off | 通用基线
2. 长入短出 | Long | Short | Off | TTFT / Prefill
3. 短入长出 | Short | Long | Off | ITL / TPOT
4. 共享长前缀 | Long Shared Prefix | Short | Cold / Warm | Cache Hit / TTFT
5. 严格 JSON Schema | Schema Prompt | JSON | Same | 合规率 / 正确率
Bottom note: "同一模型 · 同一硬件 · 同一精度 · 同一请求集".
```

## F12 指标与生产发布门

### 首次生成

```text
Primary request: create a request-lifecycle metric timeline that flows into a production release gate.
Title: "从性能指标到生产发布门".
Timeline: "Request", "Queue", "Prefill", "First Token", "Decode Tokens", "Complete".
Metric brackets: "TTFT", "ITL", "TPOT", "E2E".
Gate title: "Production Gate".
Gate criteria: "Latency", "Goodput", "Error Rate", "Schema Accuracy", "Peak VRAM", "Security".
Conclusion: "吞吐不是唯一答案；满足 SLO 的有效请求才可发布".
```

### 定向修订

```text
Change only two text areas: title must be exactly "从性能指标到生产发布门" with normal spacing; add "Decode Tokens" centered above Ti, T2, …, Tn.
Preserve all geometry, metric brackets, gate cards and conclusion.
```
