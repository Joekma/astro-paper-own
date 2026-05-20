---
title: LlamaIndex 数据连接与索引构建
author: Joekma
pubDatetime: 2026-05-07T00:00:00.000+08:00
modDatetime: 2026-05-07T00:00:00.000+08:00
slug: llamaindex-data-connectors
description: '深入讲解LlamaIndex数据连接器与索引构建，包括多种Reader、节点解析策略和索引类型。'
tags:
  - LlamaIndex
  - Data Connectors
  - Index
draft: false
series: LlamaIndex
seriesOrder: 4
language: zh-CN
---

## 概述

数据连接和索引构建是 LlamaIndex 的核心能力。本篇将详细介绍各种数据连接器的使用方法和不同的索引构建策略。

### 数据处理流程

```
┌─────────────────────────────────────────────────────────────┐
│                 LlamaIndex 数据处理流程                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌────────┐ │
│   │  原始数据 │ → │  加载器  │ → │  解析器  │ → │  节点  │ │
│   └──────────┘   └──────────┘   └──────────┘   └────────┘ │
│                          │                                  │
│                          ▼                                  │
│                     ┌──────────┐                           │
│                     │  索引    │                           │
│                     └──────────┘                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 数据连接器 (Readers)

### 本地文件加载

```python
from llama_index.core import SimpleDirectoryReader

documents = SimpleDirectoryReader(
    input_dir="./data",
    required_exts=[".txt", ".md", ".pdf"],
    recursive=True
).load_data()

print(f"加载了 {len(documents)} 个文档")
```

### 支持的文件类型

| 类型 | 说明 | 依赖 |
|------|------|------|
| **.txt** | 纯文本 | 无 |
| **.md** | Markdown | 无 |
| **.pdf** | PDF 文档 | pypdf/llama-index-readers-pdf |
| **.docx** | Word 文档 | llama-index-readers-docx |
| **.csv** | CSV 文件 | pandas |
| **.json** | JSON 文件 | 无 |

### Notion 加载

```python
from llama_index.core import download_loader
from llama_index.readers.notion import NotionReader

notion_reader = NotionReader(
    integration_token="your-integration-token"
)

documents = notion_reader.load_data(
    page_ids=["page_id_1", "page_id_2"]
)
```

### Web 加载

```python
from llama_index.core import download_loader
from llama_index.readers.web import SimpleWebPageReader

web_reader = SimpleWebPageReader()

documents = web_reader.load_data(
    urls=["https://example.com/article"]
)
```

## 文档处理

### 文档元数据

```python
from llama_index.core import Document

doc = Document(
    text="文档内容",
    metadata={
        "source": "manual",
        "category": "技术文档",
        "version": "1.0",
        "created_at": "2024-01-01"
    }
)
```

### 批量处理

```python
from llama_index.core import SimpleDirectoryReader

def batch_load_documents(directory: str, categories: list):
    all_documents = []

    for category in categories:
        category_dir = f"{directory}/{category}"
        reader = SimpleDirectoryReader(input_dir=category_dir)

        docs = reader.load_data()
        for doc in docs:
            doc.metadata["category"] = category
            all_documents.append(doc)

    return all_documents

documents = batch_load_documents("./data", ["tech", "business"])
```

## 节点解析

### 基础解析器

```python
from llama_index.core.node_parser import SimpleNodeParser

parser = SimpleNodeParser()

nodes = parser.get_nodes_from_documents(documents)
```

### 句子分割

```python
from llama_index.core.node_parser import SentenceSplitter

parser = SentenceSplitter(
    chunk_size=512,
    chunk_overlap=64,
    separator="\n\n"
)

nodes = parser.get_nodes_from_documents(documents)
```

### Token 分割

```python
from llama_index.core.node_parser import TokenTextSplitter

parser = TokenTextSplitter(
    chunk_size=1024,
    chunk_overlap=128,
    separator=["\n\n", "\n", ". ", " "]
)

nodes = parser.get_nodes_from_documents(documents)
```

### Markdown 解析

```python
from llama_index.core.node_parser import MarkdownNodeParser

parser = MarkdownNodeParser()

nodes = parser.get_nodes_from_documents(documents)
```

### 自定义节点关系

```python
from llama_index.core.schema import NodeRelationship

nodes = parser.get_nodes_from_documents(documents)

for i, node in enumerate(nodes):
    if i > 0:
        node.relationships[NodeRelationship.PARENT] = nodes[i-1].as_related_node()
```

## 索引类型

### VectorStoreIndex

最常用的向量索引：

```python
from llama_index.core import VectorStoreIndex

index = VectorStoreIndex.from_documents(
    documents,
    embed_model=embed_model,
    show_progress=True
)
```

### 详细配置

```python
from llama_index.core import VectorStoreIndex
from llama_index.core.config import StorageContext, ServiceContext

service_context = ServiceContext.from_defaults(
    llm=llm,
    embed_model=embed_model,
    chunk_size=512,
    chunk_overlap=64
)

index = VectorStoreIndex.from_documents(
    documents,
    service_context=service_context,
    metadata={"index_name": "my_index"}
)
```

### SummaryIndex

简单列表索引：

```python
from llama_index.core import SummaryIndex

index = SummaryIndex.from_documents(
    documents,
    service_context=service_context
)
```

### KeywordTableIndex

关键词索引：

```python
from llama_index.core import KeywordTableIndex

index = KeywordTableIndex.from_documents(
    documents,
    max_keywords_per_chunk=10
)
```

### DocumentSummaryIndex

文档摘要索引：

```python
from llama_index.core import DocumentSummaryIndex

index = DocumentSummaryIndex.from_documents(
    documents,
    service_context=service_context
)
```

## 存储和加载

### 本地存储

```python
from llama_index.core import StorageContext

storage_context = StorageContext.from_defaults(
    persist_dir="./storage"
)

index = VectorStoreIndex.from_documents(
    documents,
    storage_context=storage_context
)

index.storage_context.persist()
```

### 加载索引

```python
from llama_index.core import load_index_from_storage

storage_context = StorageContext.from_defaults(
    persist_dir="./storage"
)

index = load_index_from_storage(
    storage_context=storage_context,
    service_context=service_context
)
```

### 自定义存储

```python
from llama_index.core import StorageContext
from llama_index.core.vector_stores import ChromaVectorStore
import chromadb

chroma_client = chromadb.PersistClient(path="./chroma_db")

vector_store = ChromaVectorStore(
    chroma_client=chroma_client,
    collection_name="my_collection"
)

storage_context = StorageContext.from_defaults(
    vector_store=vector_store
)

index = VectorStoreIndex.from_documents(
    documents,
    storage_context=storage_context
)
```

## 高级配置

### 自定义嵌入模型

```python
from llama_index.embeddings.huggingface import HuggingFaceEmbedding

embed_model = HuggingFaceEmbedding(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)

index = VectorStoreIndex.from_documents(
    documents,
    embed_model=embed_model
)
```

### 多租户索引

```python
from llama_index.core import VectorStoreIndex

def create_tenant_index(tenant_id: str, documents):
    index = VectorStoreIndex.from_documents(
        documents,
        metadata={"tenant_id": tenant_id}
    )
    return index
```

## 最佳实践

| 实践 | 说明 |
|------|------|
| **选择合适的 chunk_size** | 短文本 256-512，长文本 512-1024 |
| **保持适当 overlap** | 10-20% 有助于上下文连续性 |
| **清理元数据** | 删除敏感信息 |
| **批量处理** | 使用 show_progress 跟踪进度 |

## 总结

| 组件 | 功能 |
|------|------|
| **Readers** | 从各种数据源加载文档 |
| **NodeParser** | 将文档分割成节点 |
| **Index** | 组织和索引节点 |
| **StorageContext** | 管理持久化存储 |

正确的数据连接和索引构建是构建高效 RAG 应用的基础。
