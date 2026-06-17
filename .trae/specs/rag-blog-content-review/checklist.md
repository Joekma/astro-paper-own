# Checklist

## RAG 入门指南：核心概念与架构.md
- [x] `PDFLoader` 已修正为 `PyPDFLoader`
- [x] 未使用的 `StrOutputParser` 导入已移除
- [x] 所有 Python 代码块无导入错误
- [x] 所有 Python 代码块无未定义变量引用

## RAG 向量检索：嵌入与向量数据库.md
- [x] Weaviate 示例已使用正确的 API（v4 客户端或可运行的 langchain 集成）
- [x] Pinecone `index_params` 用法已修正
- [x] `embeddings` 变量在使用前已定义
- [x] `1 - distance / 2` 转换注释正确
- [x] 所有 Python 代码块无导入错误

## RAG 数据处理：文档加载与分割.md
- [x] `Document` 导入路径为 `langchain_core.documents`
- [x] `Language` 导入路径正确
- [x] `SentenceSplitter` 使用正确的参数
- [x] `normalize_text` 中字符替换逻辑正确
- [x] `adaptive_splitter` 中 `Language` 已导入
- [x] 所有 Python 代码块无导入错误

## RAG 检索策略：混合检索与重排序.md
- [x] `AttributeInfo` 已正确导入
- [x] `SelfQueryRetriever` 导入路径正确
- [x] `rerank_documents` 调用前 `documents` 已定义
- [x] LRU 缓存示例使用标准 `lru_cache` 模式
- [x] `SVMRetriever` 导入路径正确或已替换
- [x] `compress_documents` 中 `PromptTemplate` 已导入
- [x] `evaluate_retrieval` 中类型一致
- [x] `ab_test_strategies` 中 `relevant_docs` 已定义
- [x] 所有 Python 代码块无导入错误

## RAG 优化：性能优化与效果提升.md
- [x] `AsyncRAG.query` 中 `ainvoke` 返回值处理正确
- [x] `await` 仅在异步函数内使用
- [x] `calculate_relevance` 等评估函数已定义
- [x] `is_vectorstore_ready` 等辅助函数已定义或依赖已移除
- [x] `primary_rag` 等对象在使用前已定义
- [x] 所有 Python 代码块无导入错误

## RAG 多模态：处理图像、视频与音频.md
- [x] 已移除 `UnstructuredImageLoader` 引用
- [x] 视频描述生成模型使用真实可加载的模型
- [x] `import torch` 已补充
- [x] `client`、`text_vectorstore` 等变量已定义
- [x] `MultimodalRAGSystem` 中属性引用一致
- [x] 所有 Python 代码块无导入错误

## RAG 实战：构建完整 RAG 应用.md
- [x] `PDFLoader` 已修正为 `PyPDFLoader`
- [x] `List` 已正确导入
- [x] Streamlit 上传处理使用 `Document` 对象
- [x] `QueryResponse.context` 字段类型一致
- [x] 所有 Python 代码块无导入错误

## RAG 生产部署：从开发到上线的完整指南.md
- [x] pydantic v2 语法（`@field_validator`、`model_config`）正确
- [x] `save_feedback` 等被调用的函数已定义
- [x] `statistics.quantiles` 索引正确
- [x] `aiohttp` 已导入
- [x] 所有 Python 代码块无导入错误

## 总体检查
- [x] 所有 Markdown 文件的代码块语法正确
- [x] 所有代码示例符合"最小实现单元"原则
- [x] 所有导入语句路径与最新主流库版本兼容
- [x] 不存在已弃用 API 引用
