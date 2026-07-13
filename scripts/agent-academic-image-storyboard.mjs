export const styleContract = {
  status: "approved-2026-07-12",
  canvas: { width: 1600, height: 900, format: "png" },
  background: "#F8FAFC",
  typography: "Source Han Sans / Noto Sans CJK, sans-serif, Chinese explanation plus English standard term",
  palette: {
    input: "#2563EB",
    model: "#7C3AED",
    plan: "#4F46E5",
    tool: "#EA580C",
    observation: "#16A34A",
    state: "#0F766E",
    policy: "#DC2626",
    sandbox: "#64748B",
    output: "#1E3A8A",
  },
  layout: "academic paper diagram, strict grid alignment, thin arrows, generous whitespace, dashed trust boundaries",
  forbidden: [
    "decorative robots",
    "chat bubbles",
    "brand logos",
    "watermarks",
    "fictional modules",
    "hidden chain-of-thought",
    "unrequested prose",
  ],
};

const typeDefaults = {
  architecture: ["left-to-right component flow", "system boundary", "component ownership"],
  sequence: ["top-to-bottom time", "request and response correlation", "explicit stop event"],
  state: ["directed state transitions", "guard condition", "terminal state"],
  contract: ["request fields", "validation gate", "structured result"],
  security: ["untrusted-to-trusted crossing", "policy gate", "blocked path"],
  decision: ["mutually exclusive branches", "decision condition", "recommended outcome"],
  failure: ["happy path", "failure branch", "bounded recovery and terminal failure"],
  code: ["source statement", "runtime event", "state mutation"],
  evaluation: ["input set", "measured metric", "acceptance threshold"],
  comparison: ["same dimensions", "evidence status", "decision implication"],
};

function figure(article, index, spec, total) {
  const [slug, anchor, type, question, labels] = spec.split("|");
  const id = `agent-${String(article.order).padStart(2, "0")}-${String(index + 1).padStart(2, "0")}`;
  return {
    id,
    filename: `${id}-${slug}.png`,
    article: article.file,
    insertionAnchor: anchor,
    cognitiveQuestion: question,
    type,
    exactLabels: labels.split(","),
    actorsOrNodes: labels.split(","),
    stateBefore: `Before: ${labels.split(",")[0]}`,
    stateAfter: `After: ${labels.split(",").at(-1)}`,
    normalPath: typeDefaults[type]?.[0] ?? "explicit directed path",
    failurePath: typeDefaults[type]?.[1] ?? "separate failure branch",
    retryPath: type === "failure" || type === "sequence" ? "bounded retry returns to the named decision gate" : "none unless the source section defines retry",
    termination: typeDefaults[type]?.[2] ?? "named terminal node",
    sideEffects: ["mark every external read/write", "do not invent side effects"],
    approvalPoint: type === "security" || labels.includes("Approval") ? "show Approval before side effect" : "none",
    trustBoundary: type === "security" || type === "contract" ? "show trusted runtime versus untrusted model/external data" : "show only if crossed",
    arrows: "left-to-right for data; top-to-bottom for time; dashed line only for optional or denied path",
    visualEmphasis: [labels.split(",")[0], labels.split(",").at(-1)],
    differenceFromNeighbors: `Figure ${index + 1}/${total} explains only: ${question}`,
    promptStatus: "planned",
  };
}

const articles = [
  {
    order: 1,
    file: "01-AI Agent 入门指南：核心概念与演进.md",
    specs: [
      "chatbot-workflow-agent|## Agent 与普通聊天机器人的区别|comparison|三者的决策权和副作用边界如何不同？|Chatbot,Workflow,Agent",
      "five-control-planes|## 核心组件|architecture|一个最小 Agent 运行时需要哪五个控制面？|Model,Tools,State,Policy,Safety",
      "mini-agent-trace|## 实操：先做一个能跑的 Mini Agent|sequence|一次只读 Mini Agent 从目标到回答经过哪些事件？|User Task,Decision,Tool Request,Observation,Final Answer",
      "agent-or-workflow-decision|## 能力边界|decision|什么时候应选择 Workflow 而不是 Agent？|Deterministic Steps,Runtime Choice,Side Effects,Agent Decision",
      "runtime-state-record|## 工程补全：Agent 边界与最小系统|contract|一次运行至少需要保存哪些状态？|run_id,step_count,observations,stop_reason",
      "budget-termination|### 失败路径、终止与恢复|failure|步数或成本预算用尽时如何安全停止？|Budget Check,Stop Reason,Partial Result,Audit Event",
      "agent-evaluation-baseline|### 可观测性与验收|evaluation|入门 Agent 应该用哪些指标验收？|task_success,tool_error_rate,steps_per_run,cost_per_run",
    ],
  },
  {
    order: 2, file: "02-Agent Loop：从感知到行动的运行闭环.md",
    specs: [
      "runtime-state-machine|## 基础流程|state|Agent Loop 的显式状态和终态是什么？|pending,deciding,executing,observing,completed",
      "context-assembly|## 阶段三：提示组装|architecture|系统指令、记忆、工具和用户输入如何有序组装？|System Rules,Tool Schemas,Memory,User Input,Model Context",
      "decision-branches|## 阶段四：模型推理|decision|模型决策如何落到四种可审计分支？|Answer,Tool Call,Clarify,Stop",
      "tool-observation-loop|## 阶段六：观察与继续|sequence|工具结果为什么要回到决策节点？|Decision,Tool,Observation,State Update,Decision",
      "bounded-retry|## 阶段七：压缩与重试|failure|可重试错误如何有上限地退避？|Retryable Error,Backoff,Attempt Limit,Terminal Error",
      "context-compression|## 阶段七：压缩与重试|contract|压缩上下文时哪些信息必须保留？|Source,Open Tasks,Tool Results,Summary,Token Budget",
      "cancellation-propagation|### 失败路径、终止与恢复|sequence|取消信号如何穿过模型和工具阶段？|Cancel Requested,Model Boundary,Tool Boundary,Cancelled",
      "loop-event-trace|### 可观测性与验收|evaluation|怎样从事件轨迹定位 Loop 失败？|run_started,decision,tool_requested,tool_failed,run_stopped",
    ],
  },
  {
    order: 3, file: "03-工具调用与函数调用：Agent 连接外部世界.md",
    specs: [
      "proposal-vs-execution|## Function Calling 与 Tool Calling|security|为什么模型提议不等于工具执行？|Model Proposal,Trusted Runtime,Policy Gate,Tool Execution",
      "tool-schema-anatomy|## 工具的基本结构|contract|一个可用工具 Schema 必须声明什么？|name,description,parameters,required,side_effects",
      "tool-call-sequence|## 工具调用流程|sequence|工具调用从生成参数到观察回写如何流转？|Tool Request,Schema Validation,Approval,Execution,Observation",
      "structured-tool-result|## 错误恢复|contract|工具结果如何同时表达数据与错误语义？|ok,data,error.code,error.retryable,metadata",
      "idempotency-timeout|### 失败路径、终止与恢复|failure|写工具超时后如何避免重复副作用？|idempotency_key,Timeout,Result Lookup,Duplicate Suppressed",
      "parallel-tool-calls|## 工具调用流程|decision|哪些工具可以并行，哪些必须串行？|Independent Reads,Dependency,Write Conflict,Parallel,Serial",
      "approval-detail|### 4. 高风险动作审批|security|审批界面必须向用户展示哪些细节？|Tool,Target,Arguments,Side Effect,Approve,Deny",
      "untrusted-tool-output|### 5. 工具描述不要过度信任|security|工具输出中的指令为什么不能提权？|External Data,Provenance,Sanitization,Model Context",
      "tool-runtime-metrics|### 可观测性与验收|evaluation|工具层应该按哪些阶段计量失败？|validation_failure,approval_rate,tool_latency,timeout_rate,duplicate_suppressed",
    ],
  },
  {
    order: 4, file: "04-MCP 协议：Agent 工具生态的标准接口.md",
    specs: [
      "host-client-server|## MCP 的基本架构|architecture|Host、Client 和 Server 分别拥有什么状态和责任？|Host,Client,Server,Transport,Trust Boundary",
      "initialize-handshake|## 工程补全：MCP 生命周期、能力协商与信任边界|sequence|MCP 初始化与能力协商的消息顺序是什么？|initialize,protocolVersion,capabilities,initialized",
      "json-rpc-correlation|### 接口与数据契约|contract|JSON-RPC request、response 与 notification 如何区分？|jsonrpc,id,method,params,result,error",
      "mcp-primitives|## Server 能提供什么|comparison|Tools、Resources 和 Prompts 各自解决什么问题？|Tools,Resources,Prompts",
      "tools-list-call|## 实操：写一个最小 MCP Server|sequence|工具发现与调用的最小协议轨迹是什么？|tools/list,Tool Schema,tools/call,Tool Result",
      "transport-boundary|## MCP 的基本架构|architecture|传输层如何影响连接生命周期与边界？|Client Transport,Server Transport,Connection,Disconnect",
      "host-security-gate|## 安全原则|security|为什么 MCP 互操作不代替 Host 授权？|Server Result,Host Policy,Consent,Tool Execution",
      "version-mismatch|### 失败路径、终止与恢复|failure|协议版本或能力不兼容时如何终止？|Client Version,Server Version,Capability Mismatch,Initialize Error",
      "mcp-observability|### 可观测性与验收|evaluation|MCP 连接和请求应该跟踪哪些指标？|initialize_failure,capability_mismatch,request_latency,permission_denied",
    ],
  },
  {
    order: 5, file: "05-Agent 记忆系统：短期记忆、长期记忆与用户画像.md",
    specs: [
      "memory-taxonomy|## 记忆的层次|comparison|历史、运行状态、长期记忆、用户画像与 RAG 如何区分？|Conversation History,Runtime State,Long-term Memory,User Profile,RAG",
      "memory-write-pipeline|## 记忆写入策略|sequence|一条信息在写入长期记忆前经过哪些门？|Candidate,Secret Filter,Salience,Consent,Deduplication,Stored Memory",
      "memory-record-contract|### 接口与数据契约|contract|一条可治理记忆必须包含哪些字段？|subject,content,source,confidence,scope,expires_at",
      "memory-retrieval|## 记忆与搜索的区别|sequence|检索结果如何带来源进入模型上下文？|Query,Scope Filter,Ranking,Provenance,Context",
      "memory-conflict|## 长期记忆|failure|新旧记忆冲突时如何保留证据并解析？|Old Memory,New Memory,Source,Conflict,Resolved Version",
      "memory-deletion|## 遗忘机制|sequence|删除请求如何覆盖主存储、索引与缓存？|Delete Request,Primary Store,Vector Index,Cache,Deletion Receipt",
      "cross-user-isolation|## 安全风险|security|如何防止记忆跨用户或跨 Agent 泄漏？|Tenant Scope,User Scope,Agent Scope,Access Check,Memory Result",
      "memory-quality|### 可观测性与验收|evaluation|记忆系统应如何验证准确、时效与删除？|retrieval_precision,stale_memory_rate,cross_user_leakage,deletion_completion",
    ],
  },
  {
    order: 6, file: "06-Agent Skills：可复用能力与经验沉淀.md",
    specs: [
      "prompt-tool-skill-mcp|## Skill 与 Prompt 的区别|comparison|Prompt、Tool、Skill 和 MCP 分别提供什么？|Prompt,Tool,Skill,MCP",
      "skill-directory|## Skill 的基本形态|architecture|一个 Skill 的元数据、指令、资源和验证如何组织？|Manifest,Instructions,References,Scripts,Verification",
      "skill-discovery-trigger|## 为什么需要 Skills|sequence|Skill 如何从索引发现到触发选中？|Skill Index,Task Intent,Trigger Match,Selected Skill",
      "progressive-loading|## 渐进式加载|sequence|渐进式加载如何节省上下文又不丢失必需指令？|Metadata,Matched Skill,Full Instructions,Required Reference",
      "skill-manifest|## Skill 编写模板|contract|Skill manifest 需要哪些可验证字段？|name,description,version,triggers,requirements,verification",
      "skill-supply-chain|## 安全注意事项|security|第三方 Skill 从安装到激活需要哪些信任门？|Source,Signature,Static Review,Sandbox Test,Approval,Active Skill",
      "skill-version-rollback|## Skill 生命周期|failure|Skill 更新引入回归时如何回滚？|Known Good Version,Candidate Version,Regression,Rollback",
      "skill-evaluation|### 可观测性与验收|evaluation|Skill 的触发准确性和执行质量如何测量？|trigger_precision,load_latency,verification_pass,rollback_count",
    ],
  },
  {
    order: 7, file: "07-Agent 安全：权限、沙箱、审批与提示注入防护.md",
    specs: [
      "threat-model|## 威胁模型|security|Agent 的资产、对手、入口和信任边界是什么？|Assets,Adversary,Untrusted Inputs,Trust Boundary,Impact",
      "capability-model|## 最小权限|contract|工具能力如何限定资源、网络和审批范围？|capability,resource_scope,network_policy,approval_policy",
      "data-vs-instruction|## 提示注入防护|security|外部文档中的指令为什么只能作为数据？|External Document,Provenance,Untrusted Data,System Rules",
      "approval-gate|## 工具审批|sequence|高风险动作在执行前如何请求具体授权？|Tool Request,Risk Summary,Exact Arguments,Human Decision,Execution",
      "sandbox-limits|## 沙箱隔离|comparison|沙箱、文件权限、网络策略和 API 授权各限制什么？|Sandbox,Filesystem Policy,Network Policy,API Authorization",
      "workspace-containment|## 工作区边界|security|路径解析如何拦截穿越和符号链接逃逸？|Requested Path,Resolve,Workspace Root,Symlink Check,Allow,Deny",
      "secret-isolation|## 密钥管理|security|密钥如何在配置、运行时和日志之间隔离？|Secret Store,Scoped Injection,Tool Process,Redacted Log",
      "incident-response|## 审计与回滚|failure|发现越权或泄漏后的处置顺序是什么？|Detect,Stop Run,Revoke,Preserve Evidence,Rollback,Review",
      "security-tests|### 可观测性与验收|evaluation|安全回归应该攻击哪些边界？|Prompt Injection,Path Traversal,Approval Bypass,Secret Exposure,Sandbox Escape",
    ],
  },
  {
    order: 8, file: "08-从零构建 Agent：ReAct、Planner、Executor、Reflexion 全景学习指南.md",
    specs: [
      "complete-runtime-loop|## 先锁定系统边界|architecture|完整 Agent Runtime 如何在受控边界内从任务走到输出？|User Task,Context,Agent State,Model Decision,Planner,Tool Schema,Policy Check,Approval,Executor,Sandbox,Observation,Memory,Stop Reason,Final Answer",
      "component-responsibilities|## 先锁定系统边界|comparison|Model Adapter、Planner、Policy、Executor 和 Runtime 的责任如何分离？|Model Adapter,Planner,Policy Engine,Executor,Runtime",
      "runtime-data-contract|## 运行时数据契约|contract|Decision、ToolRequest 和 AgentState 如何约束运行？|Decision,ToolRequest,AgentState,StopReason",
      "react-controlled-loop|## 受控 ReAct Loop|state|受控 ReAct Loop 如何在每步前检查终止条件？|Budget Check,Cancel Check,Model Decision,Tool Execution,Observation,Stop",
      "tool-policy-path|## 受控 ReAct Loop|security|一次写工具请求如何通过幂等和审批门？|Tool Request,Idempotency,Approval,Execute,Observation",
      "planner-dag|## Planner：从目标到可验证 DAG|architecture|复合目标如何变成有依赖的任务 DAG？|Objective,Planner,Task A,Task B,Task C,Dependencies",
      "dag-validation|## Planner：从目标到可验证 DAG|failure|Planner 输出在执行前要通过哪些结构和权限检查？|Unique IDs,Known Dependencies,Cycle Check,Schema,Permission,Budget",
      "executor-layers|## Executor：顺序、并行与部分失败|sequence|Executor 如何按拓扑层次并行安全任务？|Ready Set,Concurrency Limit,Workers,Results,Next Layer",
      "partial-failure|## Executor：顺序、并行与部分失败|failure|部分任务失败时如何保留成功结果？|Completed Tasks,Failed Task,Skipped Dependents,Partial Result,Human Action",
      "reflection-gate|## Reflection 与评估闭环|decision|Reflection 如何在通过、受控重试、人工处理和失败之间决策？|Evaluator,pass,retry_with_change,needs_human,fail",
      "failure-matrix|## 失败路径与恢复矩阵|comparison|不同错误哪些可重试，哪些必须终止？|Schema Error,Timeout,Approval Denied,Cycle,Budget,Cancelled",
      "regression-suite|## 最小回归测试|evaluation|最小 Agent 回归测试如何覆盖终止、环和审批？|Max Steps Test,Cycle Test,Approval Test,Expected Stop Reason",
    ],
  },
  {
    order: 9, file: "09-多 Agent 协作：委派、并行与任务拆解.md",
    specs: [
      "single-or-multi-agent|## 适合多 Agent 的任务|decision|什么时候多 Agent 的收益超过协调成本？|Independent Subtasks,Specialization,Coordination Cost,Single Agent,Multi Agent",
      "collaboration-patterns|## 协作模式|comparison|Manager-Worker、Handoff、Review 和 Pipeline 有什么差异？|Manager-Worker,Handoff,Review,Pipeline",
      "delegation-contract|### 接口与数据契约|contract|子任务契约如何限定目标、工具、写范围和输出？|task_id,objective,inputs,allowed_tools,write_scope,output_schema",
      "manager-worker-sequence|## 实操：用 asyncio 模拟 Manager-Worker|sequence|Manager 如何委派、限制并发并整合结果？|Manager,Task Board,Worker A,Worker B,Reviewer,Integrator",
      "context-isolation|## 状态共享|security|子 Agent 应该看到多少上下文和权限？|Parent Context,Task Slice,Worker Context,Allowed Tools",
      "write-conflict|## 写入冲突控制|failure|多个 Worker 的写入如何避免相互覆盖？|Worker Branch,Worker Partition,Single Writer,Merge Gate,Conflict",
      "cancellation-tree|### 失败路径、终止与恢复|sequence|父任务取消如何传播到运行中和未启动子任务？|Parent Cancel,Running Worker,Queued Worker,Cancelled,Partial Results",
      "partial-result-merge|## 结果整合|failure|工作者部分失败时整合者应输出什么？|Evidence,Completed Result,Failed Task,Disagreement,Confidence,Next Action",
      "multi-agent-metrics|### 可观测性与验收|evaluation|如何判断多 Agent 是真的提速还是只增加协调开销？|parallel_speedup,handoff_loss,conflict_rate,coordination_cost",
    ],
  },
  {
    order: 10, file: "10-自动化 Agent：定时任务、后台运行与通知通道.md",
    specs: [
      "trigger-types|## 自动化入口|comparison|Cron、Webhook、Heartbeat 和人工触发的语义如何不同？|Cron,Webhook,Heartbeat,Manual Trigger",
      "scheduled-run|## 自动化执行流程|sequence|一次后台运行从触发到投递如何流转？|Trigger,Scheduler,Queue,Lease,Agent Run,Persist Result,Delivery",
      "job-contract|### 接口与数据契约|contract|一个可靠调度任务必须声明哪些字段？|schedule,timezone,idempotency_window,max_runtime,retry_policy,delivery",
      "lease-lock|### 失败路径、终止与恢复|state|带过期时间的租约如何防止永久锁？|Ready,Lease Acquired,Running,Lease Renewed,Lease Expired,Reclaimed",
      "idempotent-schedule|## 防失控机制|failure|调度器重复触发时如何保证一个业务窗口只执行一次？|scheduled_for,idempotency_key,Duplicate Trigger,Existing Run,Suppressed",
      "execution-vs-delivery|## 结果投递|failure|执行成功但通知失败时如何避免重跑 Agent？|Persisted Result,Delivery Attempt,Delivery Failure,Retry Delivery,Delivered",
      "automation-guardrails|## 防失控机制|security|后台 Agent 需要哪些终止和审批门？|Max Runtime,Tool Allowlist,Recursion Block,Approval,Audit",
      "automation-runbook|### 可观测性与验收|evaluation|后台任务告警后运行手册应如何定位？|schedule_delay,duplicate_suppressed,lease_expired,run_timeout,delivery_success",
    ],
  },
  {
    order: 11, file: "11-OpenClaw 架构学习：个人 AI 助手的本地优先设计.md",
    specs: [
      "openclaw-system|## 总体架构|architecture|OpenClaw 的 Channel、Gateway、Session、Runtime 和 Workspace 如何连接？|Channels,Gateway,Session Router,Agent Runtime,Workspace",
      "gateway-control-plane|## Gateway 的价值|architecture|Gateway 如何统一身份、路由、权限与审计？|Identity,Routing,Policy,Approval,Audit",
      "channel-session-routing|### 2. 会话路由统一|sequence|多通道消息如何路由到正确 Agent 与 Session？|Channel Message,Gateway,Agent ID,Session Key,Runtime",
      "workspace-model|## Workspace 文件模型|architecture|Workspace 中的指令、记忆、技能与工作文件如何分层？|Instructions,Memory,Skills,Work Files,Version Control",
      "openclaw-loop|## Agent Loop|sequence|一次 OpenClaw 运行在 Gateway 与 Runtime 之间如何流转？|Gateway Request,Session,Context,Model,Tool,Result",
      "skill-visibility|## Skills|security|多 Agent 中 Skill 可见性如何与 Workspace 隔离对齐？|Shared Skills,Agent Skills,Workspace Skills,Effective Skill Set",
      "openclaw-security|## 安全设计|security|通道身份为什么不直接等于工作区权限？|Channel Identity,Gateway Policy,Agent Scope,Workspace Permission",
      "fact-vs-inference|## 设计启发|comparison|如何在架构学习中区分项目事实与可迁移推导？|Official Fact,Source and Version,Design Inference,Applicability",
      "openclaw-operations|### 可观测性与验收|evaluation|OpenClaw 部署应如何监测 Gateway、路由与隔离？|gateway_availability,routing_error,session_isolation,workspace_write",
    ],
  },
  {
    order: 12, file: "12-Hermes Agent 架构学习：自改进、技能与记忆闭环.md",
    specs: [
      "hermes-system|## 总体架构|architecture|Hermes 如何组织 Toolsets、Backends、Skills、Memory、Cron 与 Delegation？|Gateway,Agent Runtime,Toolsets,Terminal Backends,Skills,Memory,Cron,Delegation",
      "toolsets-backends|## Terminal Backends|comparison|Toolsets 与 Terminal Backends 分别解决能力分组和执行隔离的哪一层？|Toolsets,Tool Registry,Terminal Backends,Execution Environment",
      "hermes-skill-loading|## 渐进式加载|sequence|Hermes Skill 如何从索引匹配到完整加载？|Skill Index,Intent Match,Instructions,References,Execution",
      "persistent-memory|## Persistent Memory|sequence|Hermes 持久记忆如何写入、检索并回到上下文？|Candidate Memory,Write Gate,Store,Retrieve,Context",
      "cron-delegation|## Delegation 与 Kanban|architecture|后台任务与委派任务如何在任务板上协调？|Cron,Task Board,Delegator,Worker,Result",
      "curator-loop|## Curator|sequence|Curator 候选经验如何经过验证进入可复用能力？|Experience,Candidate Skill,Static Review,Isolated Verification,Promotion",
      "controlled-self-improvement|### 失败路径、终止与恢复|security|自改进为什么不能自动扩大权限？|Candidate Change,Existing Capabilities,Permission Gate,Verification,Rollback",
      "versioned-facts|### 接口与数据契约|contract|快速迭代产品的架构事实如何锁定到版本与源码？|Claim,Official Document,Release Version,Commit,Verification Date",
      "hermes-metrics|### 可观测性与验收|evaluation|如何评估候选 Skill、记忆复用与委派效果？|candidate_skill_created,verification_pass,memory_reuse,delegation_success,rollback_rate",
    ],
  },
  {
    order: 13, file: "13-OpenClaw 与 Hermes 对比：Agent 系统设计模式总结.md",
    specs: [
      "evidence-baseline|## 总体对比|contract|一次公平架构对比如何锁定维度、版本与证据等级？|Dimension,Definition,Version Date,Official Evidence,Evidence Status",
      "system-comparison|## 总体对比|comparison|OpenClaw 与 Hermes 在控制面、工具、记忆和自动化上如何对齐？|Gateway,Tools,Workspace,Skills,Memory,Automation,Multi-Agent",
      "gateway-pattern|## 设计模式一：Gateway 作为控制平面|architecture|Gateway 参考模式应该集中哪些跨切关注？|Identity,Routing,Session,Policy,Approval,Audit",
      "memory-skill-boundary|## 设计模式四：Skills 作为过程记忆|comparison|Workspace、Memory 与 Skills 应该分别承载什么？|Workspace,Fact Memory,Process Skill,Versioned Artifact",
      "security-pattern|## 设计模式六：沙箱与审批双保险|security|为什么参考架构需要沙箱、权限和审批叠加？|Untrusted Input,Capability Gate,Approval,Sandbox,Audit",
      "selection-matrix|## 个人 Agent 推荐架构|decision|如何根据部署、通道、自改进与运维需求选择？|Requirement,OpenClaw,Hermes,External Capability,Decision",
      "reference-architecture|## 个人 Agent 推荐架构|architecture|从两个项目提炼的个人 Agent 参考架构是什么？|Channels,Gateway,Agent Runtime,Policy,Tools,Workspace,Memory,Skills,Automation",
      "staged-rollout|## 落地路线|sequence|从只读单 Agent 到多 Agent 的安全演进顺序是什么？|Read-only Agent,Workspace,Controlled Tools,Automation,Multi-Agent",
    ],
  },
];

export const storyboard = articles.map(article => ({
  order: article.order,
  file: article.file,
  figures: article.specs.map((spec, index) => figure(article, index, spec, article.specs.length)),
}));

export const sampleFigureId = "agent-08-01";

export const samplePrompt = `Use case: scientific-educational
Asset type: 1600x900 academic teaching diagram for a Chinese Agent engineering article
Primary request: Create the complete controlled Agent Runtime Loop from User Task to Final Answer. Show only auditable plans, actions, observations, state changes, and stop reasons; never show hidden chain-of-thought.
Scene/backdrop: white or #F8FAFC academic paper background
Style/medium: precise flat systems diagram, Chinese explanation plus English standard terms, Source Han Sans / Noto Sans CJK style
Composition/framing: strict left-to-right main flow with a bounded feedback loop; Planner is optional; Policy Check and Approval appear before Executor and Sandbox; State / Memory receives Observation; all terminal reasons converge to Final Answer or safe stop
Color palette: User/Input blue #2563EB; Model purple #7C3AED; Plan indigo #4F46E5; Tool orange #EA580C; Observation green #16A34A; State/Memory teal #0F766E; Policy/Approval red #DC2626; Sandbox gray #64748B; Output navy #1E3A8A
Text (verbatim): "User Task / 用户任务", "Context", "Agent State", "Model Decision", "Answer", "Tool Call", "Clarify", "Stop", "Planner (optional)", "Explicit Plan", "Tool Schema", "Policy Check", "Approval", "Executor", "Sandbox", "Observation", "State / Memory", "Max Steps", "Budget", "Cancelled", "Error", "Stop Reason", "Final Answer / 最终输出"
Constraints: thin arrows; strict alignment; generous whitespace; dashed trust boundaries; show Model Decision branches; show the feedback arrow from Observation and State / Memory back to Model Decision; show Max Steps, Budget, Cancelled, and Error as explicit safe termination conditions; no other labels
Avoid: decorative robots, chat bubbles, brand logos, watermarks, fictional modules, gradients, 3D, dense prose, hidden chain-of-thought, illegible text`;

export function buildPrompt(figure) {
  return `Use case: scientific-educational
Asset type: 1600x900 academic teaching diagram for a Chinese Agent engineering article
Primary request: ${figure.cognitiveQuestion}
Scene/backdrop: white or #F8FAFC academic paper background
Style/medium: precise flat systems diagram matching the approved Agent Runtime Loop sample; Chinese explanation only where specified, English standard terms otherwise; Source Han Sans / Noto Sans CJK style
Composition/framing: ${figure.normalPath}; ${figure.arrows}; strict grid alignment, thin arrows, generous whitespace
Color palette: User/Input blue #2563EB; Model purple #7C3AED; Plan indigo #4F46E5; Tool orange #EA580C; Observation green #16A34A; State/Memory teal #0F766E; Policy/Approval red #DC2626; Sandbox gray #64748B; Output navy #1E3A8A
Text (verbatim, use every label exactly once unless the flow requires a repeated state): ${figure.exactLabels.map(label => `"${label}"`).join(", ")}
Normal path: ${figure.normalPath}
Failure path: ${figure.failurePath}
Retry path: ${figure.retryPath}
Termination: ${figure.termination}
Trust boundary: ${figure.trustBoundary}
Approval point: ${figure.approvalPoint}
Constraints: explain exactly one cognitive question; make every required label readable at 50% scale; show only the named nodes; mark external reads/writes; preserve the approved sample's module, arrow, border, spacing, and color language
Avoid: decorative robots, chat bubbles, brand logos, watermarks, fictional modules, gradients, 3D, dense prose, hidden chain-of-thought, extra labels, illegible text`;
}

export const finalPrompts = storyboard.flatMap(article =>
  article.figures.map(figure => ({
    id: figure.id,
    filename: figure.filename,
    article: article.file,
    prompt: figure.id === sampleFigureId ? samplePrompt : buildPrompt(figure),
  }))
);

export const figureCount = storyboard.reduce((sum, article) => sum + article.figures.length, 0);

if (import.meta.url === `file://${process.argv[1]?.replaceAll("\\", "/")}`) {
  console.log(JSON.stringify({ figureCount, sampleFigureId, storyboard }, null, 2));
}
