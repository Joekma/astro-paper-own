---
title: LlamaIndex 实战：构建 RAG 应用
author: Joekma
pubDatetime: 2026-05-08T00:00:00.000+08:00
modDatetime: 2026-05-08T00:00:00.000+08:00
slug: llamaindex-rag-practical
description: '使用LlamaIndex构建完整的RAG应用，包括文档问答、知识库、聊天机器人和企业搜索系统。'
tags:
  - LlamaIndex
  - LLM
  - AI
  - RAG
  - Practical
draft: false
language: zh-CN
---

## 概述

RAG（检索增强生成）是当前构建 LLM 应用最流行的架构之一。本文将通过多个实战案例，展示如何使用 LlamaIndex 构建完整的 RAG 应用，包括文档问答系统、企业知识库、智能聊天机器人和高级搜索系统。

## 基础 RAG 流程

### 完整的 RAG 流程

```
┌─────────────────────────────────────────────────────────────┐
│                      RAG Architecture                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────┐                                              │
│  │  文档    │                                              │
│  └────┬─────┘                                              │
│       │                                                    │
│       ▼                                                    │
│  ┌──────────┐     ┌──────────┐                            │
│  │  加载    │────▶│  分割    │                            │
│  └──────────┘     └────┬─────┘                            │
│                       │                                   │
│                       ▼                                   │
│  ┌──────────┐     ┌──────────┐                            │
│  │ 向量存储 │◀────│ 嵌入    │                            │
│  └────┬─────┘     └──────────┘                            │
│       │                                                    │
│       │  ┌──────────┐                                     │
│       ├──│ 用户查询 │                                     │
│       │  └────┬─────┘                                     │
│       ▼      ▼                                           │
│  ┌──────────┐  ┌──────────┐                              │
│  │  检索    │──│  检索    │                              │
│  └────┬─────┘  └────┬─────┘                              │
│       │             │                                    │
│       │    ┌────────┴────────┐                           │
│       │    │                 │                           │
│       ▼    ▼                 ▼                           │
│  ┌──────────┐          ┌──────────┐                      │
│  │  上下文  │          │   LLM   │                      │
│  └────┬─────┘          └────┬─────┘                      │
│       │                    │                             │
│       │    ┌────────────────┘                             │
│       ▼    ▼                                             │
│  ┌──────────┐                                            │
│  │ 生成回答 │                                            │
│  └──────────┘                                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 案例一：文档问答系统

### 基础实现

```python
from llama_index.core import (
    VectorStoreIndex,
    SimpleDirectoryReader,
    ServiceContext
)
from llama_index.llms.openai import OpenAI

# 1. 加载文档
documents = SimpleDirectoryReader("./data/docs").load_data()

# 2. 配置 LLM
llm = OpenAI(model="gpt-4", temperature=0)
service_context = ServiceContext.from_defaults(llm=llm)

# 3. 创建索引
index = VectorStoreIndex.from_documents(
    documents,
    service_context=service_context
)

# 4. 创建查询引擎
query_engine = index.as_query_engine(
    similarity_top_k=5,
    response_mode="compact"
)

# 5. 问答函数
def ask_question(question):
    response = query_engine.query(question)
    return {
        "answer": response.response,
        "sources": [
            {
                "text": node.text[:200],
                "score": node.score,
                "metadata": node.metadata
            }
            for node in response.source_nodes
        ]
    }

# 测试
result = ask_question("这份文档的主要观点是什么？")
print(f"回答：{result['answer']}")
```

### 带历史记录的问答

```python
from llama_index.core import VectorStoreIndex
from llama_index.core.memory import ChatMemoryBuffer

class DocumentQAWithHistory:
    """带对话历史的文档问答系统"""
    
    def __init__(self, documents):
        # 创建索引
        self.index = VectorStoreIndex.from_documents(documents)
        
        # 创建内存
        self.memory = ChatMemoryBuffer.from_defaults()
        
        # 创建查询引擎
        self.query_engine = self.index.as_query_engine(
            similarity_top_k=5,
            memory=self.memory
        )
    
    def chat(self, question):
        """对话"""
        # 获取相关上下文
        response = self.query_engine.query(question)
        
        # 保存到记忆
        self.memory.put(
            HumanMessage(content=question),
            AIMessage(content=response.response)
        )
        
        return response.response
    
    def reset(self):
        """重置对话历史"""
        self.memory.reset()

# 使用
qa_system = DocumentQAWithHistory(documents)

# 多轮对话
print(qa_system.chat("LangGraph 是什么？"))
print(qa_system.chat("它和 LangChain 有什么关系？"))
print(qa_system.chat("能给我一些使用示例吗？"))
```

## 案例二：企业知识库

### 多数据源知识库

```python
from llama_index.core import VectorStoreIndex
from llama_index.core import SimpleDirectoryReader
from llama_index.core.readers import (
    GitHubReader,
    SlackReader,
    NotionReader
)
from llama_index.core import StorageContext
from llama_index.vector_stores.chroma import ChromaVectorStore
import chromadb

class EnterpriseKnowledgeBase:
    """企业知识库"""
    
    def __init__(self):
        self.documents = []
        self.index = None
        self.query_engine = None
    
    def load_all_sources(self):
        """加载所有数据源"""
        
        # 1. 本地文档
        local_docs = SimpleDirectoryReader("./data/docs").load_data()
        self.documents.extend(local_docs)
        
        # 2. GitHub 文档
        try:
            github_reader = GitHubReader(
                github_token="ghp_xxx",
                owner="company",
                repo="docs",
                use_rich_text_output=True
            )
            github_docs = github_reader.load_data(branch="main")
            self.documents.extend(github_docs)
        except Exception as e:
            print(f"GitHub 加载失败: {e}")
        
        # 3. Notion 笔记
        try:
            notion_reader = NotionPageReader(
                integration_token="secret_xxx"
            )
            notion_docs = notion_reader.load_data(
                page_ids=["page-id-1", "page-id-2"]
            )
            self.documents.extend(notion_docs)
        except Exception as e:
            print(f"Notion 加载失败: {e}")
        
        print(f"总共加载 {len(self.documents)} 个文档")
    
    def build_index(self):
        """构建索引"""
        # 使用向量数据库存储
        chroma_client = chromadb.PersistentClient(path="./chroma_db")
        vector_store = ChromaVectorStore(
            chroma_client=chroma_client,
            collection_name="enterprise_kb"
        )
        
        storage_context = StorageContext.from_defaults(
            vector_store=vector_store
        )
        
        self.index = VectorStoreIndex.from_documents(
            self.documents,
            storage_context=storage_context
        )
        
        self.query_engine = self.index.as_query_engine(
            similarity_top_k=10,
            response_mode="compact"
        )
    
    def query(self, question, filters=None):
        """查询"""
        if filters:
            self.query_engine = self.index.as_query_engine(
                similarity_top_k=10,
                response_mode="compact",
                filters=filters
            )
        
        response = self.query_engine.query(question)
        
        return {
            "answer": response.response,
            "sources": len(response.source_nodes),
            "metadata": [node.metadata for node in response.source_nodes]
        }

# 使用
kb = EnterpriseKnowledgeBase()
kb.load_all_sources()
kb.build_index()

result = kb.query("公司的年假政策是什么？")
print(result["answer"])
```

### 分类知识库

```python
from llama_index.core import VectorStoreIndex, SummaryIndex
from llama_index.core.composability import ComposableGraph

class CategorizedKnowledgeBase:
    """分类知识库"""
    
    def __init__(self, documents):
        # 按类别分组文档
        self.category_docs = self._categorize_documents(documents)
        
        # 为每个类别创建索引
        self.category_indexes = {}
        for category, docs in self.category_docs.items():
            self.category_indexes[category] = VectorStoreIndex.from_documents(docs)
        
        # 创建总索引
        self.global_index = VectorStoreIndex.from_documents(documents)
    
    def _categorize_documents(self, documents):
        """按类别分组文档"""
        categories = {}
        for doc in documents:
            category = doc.metadata.get("category", "general")
            if category not in categories:
                categories[category] = []
            categories[category].append(doc)
        return categories
    
    def query_by_category(self, question, category):
        """按类别查询"""
        if category not in self.category_indexes:
            return {"error": f"未找到类别: {category}"}
        
        engine = self.category_indexes[category].as_query_engine()
        response = engine.query(question)
        
        return {
            "category": category,
            "answer": response.response,
            "sources": len(response.source_nodes)
        }
    
    def query_all(self, question):
        """查询所有类别"""
        # 获取所有类别的结果
        results = {}
        for category in self.category_indexes:
            engine = self.category_indexes[category].as_query_engine(
                similarity_top_k=3
            )
            response = engine.query(question)
            results[category] = {
                "answer": response.response,
                "relevance": sum(n.score for n in response.source_nodes) / len(response.source_nodes)
            }
        
        # 返回最相关的类别
        best_category = max(results, key=lambda x: results[x]["relevance"])
        
        return {
            "best_category": best_category,
            "answer": results[best_category]["answer"],
            "all_results": results
        }

# 使用
kb = CategorizedKnowledgeBase(documents)
result = kb.query_all("如何使用 API？")
```

## 案例三：智能聊天机器人

### RAG 聊天机器人

```python
from llama_index.core import VectorStoreIndex
from llama_index.core.memory import ChatMemoryBuffer
from llama_index.core.chat_engine import ContextChatEngine
from llama_index.llms.openai import OpenAI

class RAGChatBot:
    """基于 RAG 的聊天机器人"""
    
    def __init__(self, documents):
        self.llm = OpenAI(model="gpt-4")
        
        # 构建索引
        self.index = VectorStoreIndex.from_documents(documents)
        
        # 创建聊天引擎
        self.chat_engine = ContextChatEngine.from_defaults(
            retriever=self.index.as_retriever(similarity_top_k=5),
            llm=self.llm,
            memory=ChatMemoryBuffer.from_defaults()
        )
    
    def chat(self, message):
        """聊天"""
        response = self.chat_engine.chat(message)
        return response.response
    
    def reset(self):
        """重置对话"""
        self.chat_engine.reset()

# 使用
bot = RAGChatBot(documents)

print(bot.chat("你好！"))
print(bot.chat("你能帮我解答什么问题？"))
print(bot.chat("LangGraph 的优势是什么？"))
```

### 多轮推理聊天

```python
from llama_index.core import VectorStoreIndex
from llama_index.core.query_engine import MultiStepQueryEngine
from llama_index.core.step_decomposition import LLMPathExtractor

class ReasoningChatBot:
    """带推理能力的聊天机器人"""
    
    def __init__(self, documents):
        self.index = VectorStoreIndex.from_documents(documents)
        
        # 基础引擎
        base_engine = self.index.as_query_engine(
            similarity_top_k=5,
            response_mode="compact"
        )
        
        # 多步查询引擎
        step_extractor = LLMPathExtractor.from_defaults()
        
        self.chat_engine = MultiStepQueryEngine(
            query_engine=base_engine,
            step_extractor=step_extractor
        )
    
    def chat(self, message):
        """多轮推理聊天"""
        response = self.chat_engine.query(message)
        return response.response

# 使用
bot = ReasoningChatBot(documents)
print(bot.chat(
    "LangGraph 和 LangChain 都能构建 Agent 应用，"
    "它们之间有什么区别？应该选择哪个？"
))
```

## 案例四：高级搜索系统

### 混合搜索系统

```python
from llama_index.core import VectorStoreIndex
from llama_index.core.retrievers import QueryFusionRetriever
from llama_index.core.vector_stores import MetadataFilters

class AdvancedSearchSystem:
    """高级搜索系统"""
    
    def __init__(self, documents):
        self.index = VectorStoreIndex.from_documents(documents)
    
    def search(self, query, filters=None, mode="hybrid"):
        """高级搜索"""
        
        # 基础检索器
        base_retriever = self.index.as_retriever(similarity_top_k=10)
        
        if mode == "hybrid":
            # 混合检索
            retriever = QueryFusionRetriever(
                retrievers=[base_retriever],
                similarity_top_k=5,
                mode="rrf"
            )
        elif mode == "mmr":
            # MMR 多样性检索
            retriever = self.index.as_retriever(
                vector_store_query_mode="mmr",
                mmr_threshold=0.7,
                similarity_top_k=10
            )
        else:
            retriever = base_retriever
        
        engine = self.index.as_query_engine(
            retriever=retriever,
            response_mode="compact"
        )
        
        # 应用过滤器
        if filters:
            engine = self.index.as_query_engine(
                retriever=retriever,
                filters=filters
            )
        
        response = engine.query(query)
        
        return {
            "answer": response.response,
            "results": [
                {
                    "text": node.text,
                    "score": node.score,
                    "metadata": node.metadata
                }
                for node in response.source_nodes
            ]
        }

# 使用
search = AdvancedSearchSystem(documents)

# 混合搜索
result = search.search(
    "深度学习框架",
    mode="hybrid"
)

# 带过滤的搜索
filters = MetadataFilters(
    filters=[
        MetadataFilter(key="category", operator="==", value="技术")
    ]
)
result = search.search(
    "Python",
    filters=filters,
    mode="mmr"
)
```

### 语义缓存搜索

```python
from llama_index.core import VectorStoreIndex
from llama_index.core.cache import SemanticCache
import hashlib

class CachedSearchSystem:
    """带语义缓存的搜索系统"""
    
    def __init__(self, documents):
        self.index = VectorStoreIndex.from_documents(documents)
        
        # 语义缓存
        self.cache = SemanticCache(
            index=self.index,
            threshold=0.9  # 相似度阈值
        )
    
    def search(self, query):
        """搜索（带缓存）"""
        # 检查缓存
        cached_result = self.cache.lookup(query)
        if cached_result:
            return {
                "answer": cached_result,
                "cached": True
            }
        
        # 执行查询
        engine = self.index.as_query_engine()
        response = engine.query(query)
        
        # 保存到缓存
        self.cache.update(query, response.response)
        
        return {
            "answer": response.response,
            "cached": False
        }

# 使用
search = CachedSearchSystem(documents)
result1 = search.search("什么是机器学习")
result2 = search.search("什么是机器学习")  # 使用缓存
```

## 案例五：PDF 文档分析

```python
from llama_index.core import VectorStoreIndex
from llama_index.core.readers import PDFReader
from llama_index.core.node_parser import SemanticSplitterNodeParser
from llama_index.embeddings.openai import OpenAIEmbedding

class PDFAnalyzer:
    """PDF 文档分析器"""
    
    def __init__(self, pdf_path):
        self.pdf_path = pdf_path
        self.reader = PDFReader()
        self.documents = None
        self.index = None
    
    def load_and_process(self):
        """加载和处理 PDF"""
        # 加载 PDF
        self.documents = self.reader.load_data(file=self.pdf_path)
        
        # 语义分割
        embed_model = OpenAIEmbedding(model="text-embedding-3-small")
        parser = SemanticSplitterNodeParser(
            embed_model=embed_model,
            buffer_size=1,
            breakpoint_threshold_amount=0.5
        )
        
        nodes = parser.get_nodes_from_documents(self.documents)
        
        # 创建索引
        self.index = VectorStoreIndex.from_nodes(nodes)
        
        return len(nodes)
    
    def analyze(self, question):
        """分析文档"""
        if not self.index:
            return {"error": "请先调用 load_and_process()"}
        
        engine = self.index.as_query_engine(
            similarity_top_k=5,
            response_mode="tree_summarize"
        )
        
        response = engine.query(question)
        
        return {
            "answer": response.response,
            "pages_consulted": [
                node.metadata.get("page_label", "unknown")
                for node in response.source_nodes
            ]
        }
    
    def get_summary(self):
        """获取摘要"""
        engine = self.index.as_query_engine(
            response_mode="tree_summarize"
        )
        
        return engine.query("总结这份文档的主要内容").response

# 使用
analyzer = PDFAnalyzer("./document.pdf")
node_count = analyzer.load_and_process()
print(f"文档已分割为 {node_count} 个节点")

summary = analyzer.get_summary()
print(f"摘要：{summary}")

result = analyzer.analyze("这份文档的关键技术点是什么？")
print(f"分析结果：{result['answer']}")
```

## 案例六：实时文档更新

```python
from llama_index.core import VectorStoreIndex
from llama_index.core import StorageContext
from llama_index.vector_stores.chroma import ChromaVectorStore
import chromadb

class DynamicRAGSystem:
    """动态 RAG 系统（支持实时更新）"""
    
    def __init__(self, collection_name="dynamic_rag"):
        self.chroma_client = chromadb.PersistentClient(path="./chroma_db")
        self.vector_store = ChromaVectorStore(
            chroma_client=self.chroma_client,
            collection_name=collection_name
        )
        self.storage_context = StorageContext.from_defaults(
            vector_store=self.vector_store
        )
        self.index = None
    
    def initial_build(self, documents):
        """初始构建"""
        self.index = VectorStoreIndex.from_documents(
            documents,
            storage_context=self.storage_context
        )
        return len(documents)
    
    def add_documents(self, new_documents):
        """添加文档"""
        if not self.index:
            return self.initial_build(new_documents)
        
        for doc in new_documents:
            self.index.insert(doc)
        
        return len(new_documents)
    
    def delete_documents(self, doc_ids):
        """删除文档"""
        if not self.index:
            return
        
        for doc_id in doc_ids:
            self.index.delete(doc_id)
    
    def update_document(self, doc_id, new_document):
        """更新文档"""
        self.delete_documents([doc_id])
        self.add_documents([new_document])
    
    def query(self, question):
        """查询"""
        engine = self.index.as_query_engine(
            similarity_top_k=5
        )
        return engine.query(question).response

# 使用
rag = DynamicRAGSystem("my_docs")

# 初始构建
initial_count = rag.initial_build(initial_docs)
print(f"初始加载 {initial_count} 个文档")

# 实时添加
rag.add_documents([new_doc])
print("已添加新文档")

# 查询
result = rag.query("相关问题")
```

## 生产环境部署

### Flask API

```python
from flask import Flask, request, jsonify
from llama_index.core import VectorStoreIndex, SimpleDirectoryReader

app = Flask(__name__)

# 初始化（应用启动时）
documents = SimpleDirectoryReader("./data").load_data()
index = VectorStoreIndex.from_documents(documents)
query_engine = index.as_query_engine()

@app.route("/api/query", methods=["POST"])
def query():
    data = request.json
    question = data.get("question")
    
    if not question:
        return jsonify({"error": "问题不能为空"}), 400
    
    response = query_engine.query(question)
    
    return jsonify({
        "answer": response.response,
        "sources": [
            {
                "text": node.text[:200],
                "score": node.score
            }
            for node in response.source_nodes
        ]
    })

if __name__ == "__main__":
    app.run(debug=False, port=5000)
```

### FastAPI 版本

```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from llama_index.core import VectorStoreIndex, SimpleDirectoryReader

app = FastAPI()

# 初始化
documents = SimpleDirectoryReader("./data").load_data()
index = VectorStoreIndex.from_documents(documents)

class QueryRequest(BaseModel):
    question: str
    top_k: int = 5

class QueryResponse(BaseModel):
    answer: str
    sources: list

@app.post("/api/query", response_model=QueryResponse)
async def query(request: QueryRequest):
    engine = index.as_query_engine(similarity_top_k=request.top_k)
    response = engine.query(request.question)
    
    return QueryResponse(
        answer=response.response,
        sources=[
            {
                "text": node.text[:200],
                "score": node.score,
                "metadata": node.metadata
            }
            for node in response.source_nodes
        ]
    )

# 运行
# uvicorn main:app --host 0.0.0.0 --port 8000
```

## 性能优化

### 批处理

```python
from concurrent.futures import ThreadPoolExecutor

class BatchProcessor:
    """批量处理器"""
    
    def __init__(self, documents, batch_size=10):
        self.documents = documents
        self.batch_size = batch_size
        self.index = None
    
    def build_index(self):
        """分批构建索引"""
        batches = [
            self.documents[i:i + self.batch_size]
            for i in range(0, len(self.documents), self.batch_size)
        ]
        
        # 构建所有批次
        all_nodes = []
        for batch in batches:
            nodes = parser.get_nodes_from_documents(batch)
            all_nodes.extend(nodes)
        
        self.index = VectorStoreIndex.from_nodes(all_nodes)
        
        return len(all_nodes)
    
    def batch_query(self, questions, max_workers=4):
        """批量查询"""
        def single_query(q):
            engine = self.index.as_query_engine()
            return engine.query(q).response
        
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            results = list(executor.map(single_query, questions))
        
        return results
```

## 最佳实践

| 实践 | 说明 |
|------|------|
| **数据质量** | 确保文档清洗、格式规范 |
| **合理分割** | chunk_size 和 overlap 要适中 |
| **选择索引** | 根据查询需求选择合适的索引类型 |
| **混合检索** | 结合向量和关键词搜索 |
| **结果验证** | 检查检索结果的相关性 |
| **缓存策略** | 使用语义缓存提升性能 |
| **错误处理** | 完善的异常处理机制 |
| **监控日志** | 记录查询日志便于优化 |

## 总结

本文通过多个实战案例展示了 LlamaIndex 构建 RAG 应用的能力：

- **文档问答系统**：基础 RAG、带历史的问答
- **企业知识库**：多数据源、分类知识库
- **智能聊天机器人**：RAG 聊天、推理聊天
- **高级搜索系统**：混合搜索、语义缓存
- **PDF 分析**：语义分割、摘要生成
- **动态更新**：实时添加、删除文档
- **生产部署**：Flask、FastAPI 部署
- **性能优化**：批处理、并发查询

掌握这些实战技能，你将能够构建功能强大、性能优异的 RAG 应用！🚀
