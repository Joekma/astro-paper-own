# Tasks

- [x] Task 1: 修复 RAG 入门指南：核心概念与架构.md
  - [x] SubTask 1.1: 修正 `PDFLoader` → `PyPDFLoader` 导入
  - [x] SubTask 1.2: 移除未使用的 `StrOutputParser` 导入
  - [x] SubTask 1.3: 优化 `filtered_rag` 中相似度阈值说明（distance vs similarity 概念）
  - [x] SubTask 1.4: 验证所有代码块语法正确

- [x] Task 2: 修复 RAG 向量检索：嵌入与向量数据库.md
  - [x] SubTask 2.1: 修正 Weaviate 示例（改用 langchain_community.vectorstores.Weaviate 或替换为可运行示例）
  - [x] SubTask 2.2: 修正 Pinecone `index_params` 用法
  - [x] SubTask 2.3: 修正 `embeddings` 未定义问题
  - [x] SubTask 2.4: 修正 `1 - distance / 2` 注释或公式
  - [x] SubTask 2.5: 验证所有代码块语法正确

- [x] Task 3: 修复 RAG 数据处理：文档加载与分割.md
  - [x] SubTask 3.1: 修正 `Document` 导入路径为 `langchain_core.documents`
  - [x] SubTask 3.2: 修正 `Language` 的导入路径
  - [x] SubTask 3.3: 修正 `SentenceSplitter` 不存在的 `separator` 参数
  - [x] SubTask 3.4: 修复 `normalize_text` 中相同字符替换错误
  - [x] SubTask 3.5: 修正 `adaptive_splitter` 中未导入的 `Language`
  - [x] SubTask 3.6: 验证所有代码块语法正确

- [x] Task 4: 修复 RAG 检索策略：混合检索与重排序.md
  - [x] SubTask 4.1: 补充 `AttributeInfo` 导入
  - [x] SubTask 4.2: 修正 `SelfQueryRetriever` 导入路径
  - [x] SubTask 4.3: 修正 `documents` 未定义变量（`rerank_documents` 调用）
  - [x] SubTask 4.4: 重写 LRU 缓存示例（使用模块级属性或类封装）
  - [x] SubTask 4.5: 修正或移除 `SVMRetriever` 示例
  - [x] SubTask 4.6: 补充 `PromptTemplate` 导入（`compress_documents` 示例）
  - [x] SubTask 4.7: 修正 `evaluate_retrieval` 集合/列表类型问题
  - [x] SubTask 4.8: 修正 `ab_test_strategies` 中 `relevant_docs` 未定义
  - [x] SubTask 4.9: 验证所有代码块语法正确

- [x] Task 5: 修复 RAG 优化：性能优化与效果提升.md
  - [x] SubTask 5.1: 修正 `AsyncRAG.query` 中 `ainvoke` 返回值处理
  - [x] SubTask 5.2: 修正顶层 `await` 使用问题
  - [x] SubTask 5.3: 补充 `calculate_relevance`、`calculate_accuracy`、`calculate_coherence` 函数定义
  - [x] SubTask 5.4: 补充 `is_vectorstore_ready`、`is_llm_ready`、`get_uptime` 辅助函数或移除依赖
  - [x] SubTask 5.5: 修正未定义对象引用（`primary_rag`, `simple_rag`）
  - [x] SubTask 5.6: 验证所有代码块语法正确

- [x] Task 6: 修复 RAG 多模态：处理图像、视频与音频.md
  - [x] SubTask 6.1: 移除不存在的 `UnstructuredImageLoader` 引用，改用 PIL
  - [x] SubTask 6.2: 修正 `VideoCLIPModel` 不存在的 `generate` 方法
  - [x] SubTask 6.3: 替换不存在的 `fcakyon/video-caption-gen` 模型
  - [x] SubTask 6.4: 补充 `import torch`
  - [x] SubTask 6.5: 修正未定义变量 `client`、`text_vectorstore` 等
  - [x] SubTask 6.6: 重写 `MultimodalRAGSystem` 类中的 `image_captioner` 引用
  - [x] SubTask 6.7: 验证所有代码块语法正确

- [x] Task 7: 修复 RAG 实战：构建完整 RAG 应用.md
  - [x] SubTask 7.1: 修正 `PDFLoader` → `PyPDFLoader`
  - [x] SubTask 7.2: 补充 `List` 的导入（`AnswerGenerator._extract_sources` 使用）
  - [x] SubTask 7.3: 修正 Streamlit 上传时使用 `Document` 对象而非字典
  - [x] SubTask 7.4: 修正 `QueryResponse.context` 字段处理
  - [x] SubTask 7.5: 验证所有代码块语法正确

- [x] Task 8: 修复 RAG 生产部署：从开发到上线的完整指南.md
  - [x] SubTask 8.1: 修正 pydantic v2 语法（`@field_validator`、`model_config`）
  - [x] SubTask 8.2: 补充被调用但未定义的函数（`save_feedback`、`get_session_history` 等）
  - [x] SubTask 8.3: 修正 `statistics.quantiles` 索引错误
  - [x] SubTask 8.4: 补充 `aiohttp` 导入
  - [x] SubTask 8.5: 验证所有代码块语法正确

# Task Dependencies
- Task 2、3、4、5、6、7、8 彼此独立，可并行处理
- Task 1 独立，可并行处理
