# RAG 系列博客内容审查与修复规范

## Why
RAG 系列 8 篇博客文章中存在大量 Python 示例代码的语法错误、导入错误、API 用法错误，以及未定义的变量/函数引用。同时，许多代码块作为"示例"过于庞大（多类多函数耦合），不符合"最小实现单元"原则。需要系统性修复以确保教程内容正确、可运行、易理解。

## What Changes
- 修复 8 篇 RAG 博客文章中的所有代码语法错误
- 修复导入路径错误（langchain v0.1+、pydantic v2、weaviate v4 等的迁移）
- 修复未定义变量、函数、类的引用
- 将过大的代码示例拆分为最小可独立运行的实现单元
- 修正错误的概念描述（模型名称、API 用法）
- 调整对当前主流库版本兼容的导入和 API 调用

## Impact
- 受影响文档：
  - RAG 入门指南：核心概念与架构.md
  - RAG 向量检索：嵌入与向量数据库.md
  - RAG 数据处理：文档加载与分割.md
  - RAG 检索策略：混合检索与重排序.md
  - RAG 优化：性能优化与效果提升.md
  - RAG 多模态：处理图像、视频与音频.md
  - RAG 实战：构建完整 RAG 应用.md
  - RAG 生产部署：从开发到上线的完整指南.md
- 不涉及代码运行时（仅为文档），但影响读者复制粘贴代码的可运行性

## ADDED Requirements

### Requirement: RAG 入门指南修复
文档 `RAG 入门指南：核心概念与架构.md` 的代码示例必须：
- 修正 `PDFLoader` 为 `PyPDFLoader`（langchain_community 中正确的类名）
- 移除未使用的 `StrOutputParser` 导入
- 修正相似度过滤逻辑说明（distance vs similarity 概念）
- 保持每个代码块为最小可独立运行单元

#### Scenario: 入门文档代码可正确导入
- **WHEN** 读者按文档复制粘贴数据处理层代码
- **THEN** 所有 `from langchain_community...` 导入必须能成功执行
- **AND** 不应出现 `ImportError`

### Requirement: RAG 向量检索修复
文档 `RAG 向量检索：嵌入与向量数据库.md` 的代码示例必须：
- 修正 Weaviate 示例（使用 weaviate v4 客户端或改用其他向量库）
- 修正 Pinecone `index_params` 实际并不通过此方式传递
- 修正 `1 - distance / 2` 余弦相似度转换的注释
- 修正未定义变量（`embeddings`, `chunks` 等）

#### Scenario: 向量数据库示例能加载
- **WHEN** 读者按文档使用 Weaviate 或 Pinecone
- **THEN** 代码不应引用已弃用的 API

### Requirement: RAG 数据处理修复
文档 `RAG 数据处理：文档加载与分割.md` 的代码示例必须：
- 修正 `Document` 的导入路径为 `langchain_core.documents`
- 修正 `Language` 的导入
- 修正 `SentenceSplitter` 参数（移除 `separator` 或改用 `paragraph_separator`）
- 修复 `normalize_text` 中相同字符替换的逻辑错误
- 修正未导入的 `Language` 在 `adaptive_splitter` 中的使用

#### Scenario: 数据处理代码可执行
- **WHEN** 读者运行文档中的分割代码
- **THEN** 不应出现 `ImportError` 或 `TypeError`

### Requirement: RAG 检索策略修复
文档 `RAG 检索策略：混合检索与重排序.md` 的代码示例必须：
- 补充 `AttributeInfo` 的导入
- 修正 `SelfQueryRetriever` 的导入路径
- 修正未定义的 `documents` 变量
- 重写 LRU 缓存示例（使用标准 `lru_cache` 而非 `setattr` 模式）
- 移除 `SVMRetriever`（如已弃用则改用其他实现）或修正导入
- 修正 `PromptTemplate` 的缺失导入
- 修正 `evaluate_retrieval` 中集合与列表的混合使用

#### Scenario: 检索策略代码无未定义引用
- **WHEN** 读者尝试运行 `rerank_documents` 函数
- **THEN** 所有依赖的变量必须已定义或明确说明前置条件

### Requirement: RAG 优化修复
文档 `RAG 优化：性能优化与效果提升.md` 的代码示例必须：
- 修正 `await self.llm.ainvoke(...)` 的返回类型处理
- 修正顶层 `await` 使用（应在异步函数内）
- 补充 `calculate_relevance` 等评估函数定义
- 补充 `is_vectorstore_ready`、`is_llm_ready`、`get_uptime` 等辅助函数
- 移除未定义对象引用（`primary_rag`, `simple_rag`）

#### Scenario: 性能优化示例可独立运行
- **WHEN** 读者复制 `AsyncRAG` 类
- **THEN** 实例化和 `await` 调用应能正常工作

### Requirement: RAG 多模态修复
文档 `RAG 多模态：处理图像、视频与音频.md` 的代码示例必须：
- 修正 `VideoCLIPModel` 实际并不存在 `generate` 方法（应为图像-文本对比模型）
- 修正 `fcakyon/video-caption-gen` 模型为不存在的模型
- 移除 `UnstructuredImageLoader`（langchain 中不存在）
- 补充 `import torch`
- 修正未定义变量 `client`、`text_vectorstore` 等
- 重写视频描述生成示例（使用实际可用的模型如 BLIP 处理帧图像）

#### Scenario: 多模态示例使用真实可加载模型
- **WHEN** 读者按文档加载视频处理模型
- **THEN** `from_pretrained` 必须能找到对应的模型

### Requirement: RAG 实战修复
文档 `RAG 实战：构建完整 RAG 应用.md` 的代码示例必须：
- 修正 `PDFLoader` 为 `PyPDFLoader`
- 补充 `List` 的导入
- 修正 Streamlit 上传后 `documents.append({...})` 应使用 `Document` 对象
- 修正 `QueryResponse.context` 字段类型
- 修正 `_extract_sources` 中列表与字符串的处理

#### Scenario: 实战项目可成功运行
- **WHEN** 读者运行 RAG 实战项目
- **THEN** Streamlit 界面应能成功处理上传文档并回答问题

### Requirement: RAG 生产部署修复
文档 `RAG 生产部署：从开发到上线的完整指南.md` 的代码示例必须：
- 修正 pydantic v2 语法（`@field_validator` 替代 `@validator`，`model_config` 替代 `class Config`）
- 补充 `save_feedback`、`get_session_history`、`process_and_index_document`、`record_upload_metadata` 等被调用但未定义的函数
- 修正 `statistics.quantiles` 的索引错误（p99 应为 `[98]` for n=100 或 `[99]` for n=20）
- 补充 `aiohttp` 的导入

#### Scenario: 生产部署示例使用 pydantic v2
- **WHEN** 读者使用文档中的 Settings 类
- **THEN** 不会出现 `PydanticUserError`

## MODIFIED Requirements
无（这是首次审查，无既有需求被修改）

## REMOVED Requirements
无

## 修复原则

### 最小实现单元标准
每个代码示例块应满足：
1. **可独立运行**：复制粘贴后只需补充最少环境变量（如 `OPENAI_API_KEY`）即可运行
2. **单一职责**：一个代码块演示一个核心概念
3. **依赖明确**：所有外部依赖在代码顶部 `import` 中明确列出
4. **变量完整**：代码中使用的所有变量都应在代码块内定义
5. **可读性优先**：避免过深的类嵌套和过长的函数

### 库版本兼容
- LangChain ≥ 0.1（langchain-core 拆分）
- Pydantic ≥ 2.0（`model_config`, `@field_validator`）
- 移除已弃用 API（如 `weaviate.Client` v3）
