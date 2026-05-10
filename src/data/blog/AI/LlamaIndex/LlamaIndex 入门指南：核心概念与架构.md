---
title: LlamaIndex 入门指南：核心概念与架构
series: LlamaIndex
author: Joekma
pubDatetime: 2026-05-08T00:00:00.000+08:00
modDatetime: 2026-05-08T00:00:00.000+08:00
slug: llamaindex-getting-started
description: 'LlamaIndex入门指南，详细介绍核心概念、架构组件和数据连接机制。'
tags:
  - LlamaIndex
  - LLM
  - AI
  - RAG
draft: false
language: zh-CN
---

## 概述

LlamaIndex 是一个专为构建 LLM 应用设计的数据框架，专注于**检索增强生成（RAG）**场景。它提供了丰富的数据连接器、索引结构和查询引擎，让开发者能够轻松地将私有数据与 LLM 结合，实现精准的知识问答和智能检索。

### 为什么选择 LlamaIndex？

| 特性 | 说明 |
|------|------|
| **丰富的连接器** | 支持 100+ 数据源，包括文件、API、数据库等 |
| **多样的索引类型** | 支持向量索引、关键词索引、混合索引等 |
| **灵活的查询引擎** | 支持单步查询、递归查询、多步推理等 |
| **易于集成** | 与主流 LLM 和向量数据库无缝集成 |
| **高性能** | 针对大规模数据优化，支持流式输出 |

### LlamaIndex vs LangChain

| 特性 | LangChain | LlamaIndex |
|------|----------|-----------|
| **定位** | 通用的 LLM 应用框架 | 专注于数据检索和 RAG |
| **数据处理** | 基础文档加载 | 强大的数据连接和预处理 |
| **索引结构** | 简单向量存储 | 多种高级索引类型 |
| **查询能力** | 基础 Chain | 高级查询引擎和路由 |
| **学习曲线** | 较陡 | 较平缓，上手快 |

## 核心概念

### LlamaIndex 架构

```
┌─────────────────────────────────────────────────────────────────┐
│                       LlamaIndex Architecture                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Data Sources                           │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐        │  │
│  │  │  Files  │ │   API   │ │Database │ │  Web    │   ...   │  │
│  │  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘        │  │
│  └───────┼────────────┼────────────┼────────────┼─────────────┘  │
│          │            │            │            │              │
│          ▼            ▼            ▼            ▼              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                  Connectors (Readers)                    │  │
│  │  ┌─────────────────────────────────────────────────┐     │  │
│  │  │          Document / Node Extraction             │     │  │
│  │  └─────────────────────────────────────────────────┘     │  │
│  └──────────────────────────┬───────────────────────────────┘  │
│                               │                                │
│                               ▼                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Index Structures                       │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │  │
│  │  │  Vector  │ │ Keyword  │ │  Tree    │ │  Graph   │   │  │
│  │  │  Index   │ │  Index   │ │  Index   │ │  Index   │   │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │  │
│  └──────────────────────────┬───────────────────────────────┘  │
│                               │                                │
│                               ▼                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Query Engine                           │  │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐           │  │
│  │  │   Retriever│ │  Synthesizer│ │  Router   │           │  │
│  │  └────────────┘ └────────────┘ └────────────┘           │  │
│  └──────────────────────────┬───────────────────────────────┘  │
│                               │                                │
│                               ▼                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    LLM Integration                         │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 核心组件

| 组件 | 说明 |
|------|------|
| **Connectors (Readers)** | 数据连接器，从各种源加载数据 |
| **Documents** | 文档对象，包含文本和元数据 |
| **Nodes** | 节点，文档的最小索引单位 |
| **Indexes** | 索引结构，高效检索数据 |
| **Query Engine** | 查询引擎，执行检索和生成 |
| **Response Synthesizer** | 响应合成器，生成最终答案 |

## 环境配置

### 安装 LlamaIndex

```bash
# 基础安装
pip install llama-index

# 包含所有依赖
pip install llama-index[all]

# 推荐安装（常用依赖）
pip install llama-index-llms-openai llama-index-embeddings-openai

# 向量存储支持
pip install llama-index-vector-stores-chroma
pip install llama-index-vector-stores-qdrant
```

### 环境变量配置

```bash
# 设置 API Key
export OPENAI_API_KEY="your-api-key"

# 可选：设置其他配置
export OPENAI_API_BASE="https://api.openai.com/v1"
export ANTHROPIC_API_KEY="your-anthropic-key"
```

### 快速验证

```python
from llama_index.core import VectorStoreIndex, SimpleDirectoryReader

# 加载文档
documents = SimpleDirectoryReader("./data").load_data()

# 创建索引
index = VectorStoreIndex.from_documents(documents)

# 创建查询引擎
query_engine = index.as_query_engine()

# 查询
response = query_engine.query("介绍一下这些文档的内容")
print(response)
```

## 数据加载器

### 加载本地文件

```python
from llama_index.core import SimpleDirectoryReader

# 加载单个目录下的所有文件
reader = SimpleDirectoryReader(
    input_dir="./data",
    recursive=True,  # 递归加载子目录
    exclude=["*.tmp"],  # 排除特定文件
    required_exts=[".pdf", ".txt", ".md"]  # 只加载特定扩展名
)

documents = reader.load_data()

# 指定文件加载
reader = SimpleDirectoryReader(input_files=["./data/doc1.pdf", "./data/doc2.txt"])
documents = reader.load_data()
```

### 加载单个文档

```python
from llama_index.core import SimpleDirectoryReader

# 加载特定文件
reader = SimpleDirectoryReader(input_files=["./data/article.pdf"])
documents = reader.load_data()

# 使用不同的解析器
from llama_index.core import SimpleReader

# 纯文本文件
text_docs = SimpleReader().load_data(path="article.txt")

# Markdown 文件
from llama_index.core.readers import MarkdownReader
md_docs = MarkdownReader().load_data(path="article.md")
```

### 加载网络内容

```python
from llama_index.core.readers import BeautifulSoupWebReader

# 加载网页
web_reader = BeautifulSoupWebReader()
documents = web_reader.load_data(urls=["https://example.com/article"])

# 从多个 URL 加载
urls = [
    "https://en.wikipedia.org/wiki/Artificial_intelligence",
    "https://en.wikipedia.org/wiki/Machine_learning"
]
docs = web_reader.load_data(urls=urls)
```

### 加载数据库

```python
from llama_index.core import SQLDatabase
from sqlalchemy import create_engine

# 创建数据库连接
engine = create_engine("sqlite:///mydatabase.db")
sql_database = SQLDatabase(engine)

# 加载数据库表
documents = sql_database.load_data(
    table_names=["users", "products"],
    sql_query="SELECT * FROM users LIMIT 100"
)
```

## 文档与节点

### Document 结构

```python
from llama_index.core import Document

# 创建文档
doc = Document(
    text="这是文档的文本内容",
    metadata={
        "file_name": "example.txt",
        "file_path": "/path/to/file",
        "file_size": 1024,
        "creation_date": "2026-01-01",
        "author": "John Doe"
    },
    doc_id="unique_doc_id",
    excluded_llm_metadata_keys=["file_size"]  # 排除特定元数据
)

# 访问文档属性
print(doc.text)
print(doc.metadata)
print(doc.doc_id)
```

### Node 结构

```行 = Document(
    text="这是节点的文本内容",
    metadata={
        "file_name": "example.txt",
        "page": 1
    },
    relationships={
        "1": RelationshipType.SOURCE,  # 指向源文档
    }
)

# 创建节点（自动从文档分割）
nodes = parser.get_nodes_from_documents(documents)

# 访问节点属性
for node in nodes:
    print(node.text)
    print(node.metadata)
    print(node.relationships)
```

### 文档分割

```python
from llama_index.core.node_parser import (
    SimpleNodeParser,
    SentenceSplitter,
    TokenTextSplitter
)

# 简单文本分割
parser = SimpleNodeParser.from_defaults(
    chunk_size=1024,  # 块大小
    chunk_overlap=200  # 重叠大小
)
nodes = parser.get_nodes_from_documents(documents)

# 句子级别分割
parser = SentenceSplitter(
    chunk_size=256,
    paragraph_separator="\n\n",
    secondary_chunking_regex="[^,.;。]+[,.;。]",
)

# Token 级别分割
parser = TokenTextSplitter(
    chunk_size=512,
    chunk_overlap=50,
    separator=" "
)
```

## 索引类型

### Vector Store Index（向量索引）

最常用的索引类型，适合语义搜索：

```python
from llama_index.core import VectorStoreIndex

# 从文档创建
index = VectorStoreIndex.from_documents(documents)

# 从节点创建
index = VectorStoreIndex.from_nodes(nodes)

# 从已有向量存储创建
index = VectorStoreIndex.from_vector_store(vector_store)

# 自定义嵌入模型
from llama_index.embeddings.openai import OpenAIEmbedding

embed_model = OpenAIEmbedding(
    model="text-embedding-3-small",
    dimensions=1536
)

index = VectorStoreIndex.from_documents(
    documents,
    embed_model=embed_model
)
```

### Summary Index（总结索引）

简单的列表索引，按插入顺序存储：

```python
from llama_index.core import SummaryIndex

index = SummaryIndex.from_documents(documents)

# 查询所有文档
query_engine = index.as_query_engine(
    response_mode="tree_summarize"
)
```

### Keyword Table Index（关键词索引）

基于关键词的索引，适合精确匹配：

```python
from llama_index.core import KeywordTableIndex

index = KeywordTableIndex.from_documents(documents)

# 关键词查询
query_engine = index.as_query_engine(
    keyword_filter=["AI", "机器学习"]
)
```

### Tree Index（树形索引）

层次化索引，适合总结和导航：

```python
from llama_index.core import TreeIndex

index = TreeIndex.from_documents(documents)

# 树形查询（自底向上总结）
query_engine = index.as_query_engine(
    response_mode="tree_summarize"
)
```

### Graph Index（图索引）

图结构索引，适合关系型数据：

```python
from llama_index.core import KnowledgeGraphIndex

# 从文档创建知识图谱
index = KnowledgeGraphIndex.from_documents(
    documents,
    max_triplets_per_chunk=10
)
```

## 查询引擎

### 创建查询引擎

```python
from llama_index.core import VectorStoreIndex

index = VectorStoreIndex.from_documents(documents)

# 基本查询引擎
query_engine = index.as_query_engine()

# 带参数的查询引擎
query_engine = index.as_query_engine(
    similarity_top_k=5,  # 返回前 5 个最相关结果
    vector_store_query_mode="default",
    alpha=None  # 混合搜索的权重
)
```

### 执行查询

```python
# 简单查询
response = query_engine.query("什么是人工智能？")
print(response)

# 查询并获取源节点
response = query_engine.query(
    "解释一下机器学习的原理",
    similarity_top_k=3
)

# 访问响应和源信息
print(response.response)  # 回答文本
print(response.source_nodes)  # 使用的源节点
print(response.metadata)  # 元数据
```

### 查询模式

| 模式 | 说明 | 适用场景 |
|------|------|---------|
| **default** | 标准向量检索 | 通用场景 |
| **hybrid** | 混合向量+关键词 | 平衡精确和语义 |
| **mmr** | 最大边际相关性 | 多样性检索 |

```python
# 混合搜索
query_engine = index.as_query_engine(
    vector_store_query_mode="hybrid",
    alpha=0.5  # 0.5 = 平衡，0 = 纯关键词，1 = 纯向量
)

# MMR 检索（多样性）
query_engine = index.as_query_engine(
    vector_store_query_mode="mmr",
    mmr_threshold=0.5  # MMR 阈值
)
```

## 服务上下文

### 配置 LLM 和嵌入模型

```python
from llama_index.core import ServiceContext
from llama_index.llms.openai import OpenAI
from llama_index.embeddings.openai import OpenAIEmbedding

# 创建服务上下文
service_context = ServiceContext.from_defaults(
    llm=OpenAI(model="gpt-4", temperature=0),
    embed_model=OpenAIEmbedding(model="text-embedding-3-small"),
    chunk_size=512,
    num_output=512
)

# 使用服务上下文创建索引
index = VectorStoreIndex.from_documents(
    documents,
    service_context=service_context
)
```

### 本地模型配置

```python
from llama_index.llms.ollama import Ollama
from llama_index.embeddings.ollama import OllamaEmbedding

# Ollama 本地模型
llm = Ollama(model="llama2", base_url="http://localhost:11434")
embed_model = OllamaEmbedding(
    model_name="nomic-embed-text",
    base_url="http://localhost:11434"
)

service_context = ServiceContext.from_defaults(
    llm=llm,
    embed_model=embed_model
)
```

## 存储与持久化

### 默认存储（内存）

```python
# 索引存储在内存中（默认）
index = VectorStoreIndex.from_documents(documents)

# 内存中的持久化（pickle）
index.storage_context.persist(persist_dir="./storage")
```

### 向量数据库存储

```python
from llama_index.vector_stores.chroma import ChromaVectorStore
import chromadb

# Chroma 向量数据库
chroma_client = chromadb.PersistentClient(path="./chroma_db")
vector_store = ChromaVectorStore(chroma_client=chroma_client)

index = VectorStoreIndex.from_documents(
    documents,
    vector_store=vector_store
)
```

### 完整存储配置

```python
from llama_index.core import StorageContext, load_index_from_storage
from llama_index.vector_stores.qdrant import QdrantVectorStore
from qdrant_client import QdrantClient

# 配置存储
storage_context = StorageContext.from_defaults(
    vector_store=QdrantVectorStore.from_existing(
        collection_name="my_collection",
        client=QdrantClient(host="localhost", port=6333)
    )
)

# 创建索引并保存
index = VectorStoreIndex.from_documents(
    documents,
    storage_context=storage_context
)

# 从存储加载索引
loaded_index = load_index_from_storage(storage_context=storage_context)
```

## 实战示例：构建简单问答系统

```python
from llama_index.core import VectorStoreIndex, SimpleDirectoryReader
from llama_index.llms.openai import OpenAI

# 1. 加载数据
documents = SimpleDirectoryReader("./docs").load_data()

# 2. 配置 LLM
llm = OpenAI(model="gpt-4", temperature=0.7)

# 3. 创建索引
index = VectorStoreIndex.from_documents(documents)

# 4. 创建查询引擎
query_engine = index.as_query_engine(
    similarity_top_k=3,
    response_mode="compact"
)

# 5. 问答
questions = [
    "这篇文章的主要观点是什么？",
    "作者如何解释这个概念？",
    "有什么具体的例子吗？"
]

for question in questions:
    print(f"\n问题：{question}")
    response = query_engine.query(question)
    print(f"回答：{response}")
```

## 总结

本文介绍了 LlamaIndex 的核心概念和架构：

| 组件 | 核心功能 |
|------|---------|
| **Connectors** | 连接各种数据源 |
| **Documents** | 表示文档及其元数据 |
| **Nodes** | 文档分割后的最小单位 |
| **Indexes** | 多种索引结构支持 |
| **Query Engine** | 灵活的查询和检索 |
| **Storage** | 多种存储后端支持 |

LlamaIndex 为构建 RAG 应用提供了完整的数据管道和查询能力。后续文章将深入讲解索引构建、查询优化和高级用法。🌟
