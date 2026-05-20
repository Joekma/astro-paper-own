---
title: LlamaIndex 入门指南：核心概念与架构
author: Joekma
pubDatetime: 2026-05-07T00:00:00.000+08:00
modDatetime: 2026-05-07T00:00:00.000+08:00
slug: llamaindex-getting-started
description: 'LlamaIndex入门指南，详细介绍核心概念、架构组件、数据连接和索引类型。'
tags:
  - LlamaIndex
  - RAG
  - LLM
draft: false
series: LlamaIndex
seriesOrder: 2
language: zh-CN
---

## 概述

LlamaIndex 是一个专为构建 LLM 应用设计的数据框架，特别擅长处理检索增强生成（RAG）场景。与 LangChain 的通用性不同，LlamaIndex 专注于数据和知识管理，提供了更高效、更灵活的索引和检索能力。

### LlamaIndex vs LangChain

| 特性 | LlamaIndex | LangChain |
|------|-----------|-----------|
| **核心重点** | 数据和检索 | 工作流编排 |
| **RAG 支持** | 深度优化 | 基础支持 |
| **索引类型** | 丰富多样 | 有限 |
| **数据处理** | 强大的转换 | 基础支持 |
| **学习曲线** | 中等 | 较陡 |

### 核心架构

```
┌─────────────────────────────────────────────────────────────┐
│                     LlamaIndex 架构                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│   │   Data      │  │   Index     │  │   Query     │       │
│   │  Connectors │  │   Engine    │  │   Engine    │       │
│   └─────────────┘  └─────────────┘  └─────────────┘       │
│                                                              │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│   │   Nodes     │  │  Retrievers │  │ Synthesizer │       │
│   │             │  │             │  │             │       │
│   └─────────────┘  └─────────────┘  └─────────────┘       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 核心概念

### 1. 数据连接器 (Data Connectors)

从各种数据源读取数据：

```python
# 导入LlamaIndex核心组件
from llama_index.core import SimpleDirectoryReader

# 使用SimpleDirectoryReader加载目录中的所有文件
documents = SimpleDirectoryReader("./data").load_data()

# 打印加载的文档数量
print(f"加载了 {len(documents)} 个文档")
```

### 2. 文档 (Documents)

表示数据的基本单元：

```python
from llama_index.core import Document

# 创建文档对象，包含文本内容和元数据
doc = Document(
    text="这是文档内容",
    # 元数据可以包含来源、作者等信息，用于后续过滤
    metadata={"source": "example", "author": "张三"}
)

# 访问文档文本
print(doc.text)
# 访问文档元数据
print(doc.metadata)
```

### 3. 节点 (Nodes)

文档被分割后的基本单元：

```python
from llama_index.core import Document
from llama_index.core.node_parser import SimpleNodeParser

# 创建文档
doc = Document(text="长文档内容...")

# 创建节点解析器
parser = SimpleNodeParser()

# 将文档分割成节点
nodes = parser.get_nodes_from_documents([doc])

# 打印生成的节点数量
print(f"生成了 {len(nodes)} 个节点")
```

### 4. 索引 (Indexes)

组织和管理节点的数据结构：

```python
from llama_index.core import VectorStoreIndex

# 从文档创建向量索引
# 索引会自动处理文档分割、嵌入和存储
index = VectorStoreIndex.from_documents(documents)
print(index)
```

### 5. 查询引擎 (Query Engines)

处理用户查询并返回答案：

```python
# 将索引转换为查询引擎
query_engine = index.as_query_engine()

# 发送查询
response = query_engine.query("用户的问题")
print(response)
```

## 安装和设置

### 安装 LlamaIndex

```bash
pip install llama-index
pip install llama-index-llms-openai
pip install llama-index-embeddings-openai
```

### 基本配置

```python
from llama_index.llms.openai import OpenAI

llm = OpenAI(model="gpt-4")

from llama_index.embeddings.openai import OpenAIEmbedding

embed_model = OpenAIEmbedding(model="text-embedding-3-small")
```

## 基本使用流程

### 完整的 RAG 流程

```python
from llama_index.core import SimpleDirectoryReader, VectorStoreIndex
from llama_index.llms.openai import OpenAI

documents = SimpleDirectoryReader("./data").load_data()

index = VectorStoreIndex.from_documents(documents)

query_engine = index.as_query_engine()

response = query_engine.query("关于某个主题的问题")

print(response)
```

### 简化流程（新版本）

```python
from llama_index.core import download_loader, VectorStoreIndex
from llama_index.llms.openai import OpenAI

SimpleDirectoryReader = download_loader("SimpleDirectoryReader")
reader = SimpleDirectoryReader("./data")
documents = reader.load_data()

index = VectorStoreIndex.from_documents(documents)

query_engine = index.as_query_engine()
response = query_engine.query("你的问题")
```

## 文档加载

### 支持的数据源

| 数据源 | 说明 | 使用场景 |
|--------|------|---------|
| **本地文件** | txt, pdf, md 等 | 文档处理 |
| **Notion** | Notion 数据库 | 知识管理 |
| **Google Docs** | Google 文档 | 协作文档 |
| **Slack** | Slack 频道 | 对话数据 |
| **Web** | 网页内容 | 在线资源 |

### 本地文件加载

```python
from llama_index.core import SimpleDirectoryReader

reader = SimpleDirectoryReader(
    input_dir="./data",
    recursive=True,
    exclude=["*.tmp"]
)

documents = reader.load_data()
```

### PDF 加载

```python
from llama_index.core import SimpleDirectoryReader

documents = SimpleDirectoryReader(
    input_dir="./pdfs",
    file_extractor={".pdf": "PdfReader"}
).load_data()
```

## 节点解析

### 文本分割器

```python
from llama_index.core.node_parser import (
    SimpleNodeParser,
    SentenceSplitter,
    TokenTextSplitter
)

parser = SentenceSplitter(
    chunk_size=512,
    chunk_overlap=64
)

nodes = parser.get_nodes_from_documents(documents)
```

## 索引类型

### 常用索引类型

| 索引类型 | 说明 | 适用场景 |
|---------|------|---------|
| **VectorStoreIndex** | 向量索引 | 语义检索 |
| **SummaryIndex** | 摘要索引 | 简单查询 |
| **DocumentSummaryIndex** | 文档摘要索引 | 长文档 |
| **KeywordTableIndex** | 关键词索引 | 关键词匹配 |
| **FMIndex** | 全倒排索引 | 全文搜索 |

### 创建向量索引

```python
from llama_index.core import VectorStoreIndex

index = VectorStoreIndex.from_documents(
    documents,
    embed_model=embed_model
)
```

### 创建摘要索引

```python
from llama_index.core import SummaryIndex

index = SummaryIndex.from_documents(documents)
```

## 查询引擎

### 创建查询引擎

```python
query_engine = index.as_query_engine(
    similarity_top_k=5,
    response_mode="compact"
)

response = query_engine.query("你的问题")
```

### 自定义查询引擎

```python
from llama_index.core.query_engine import RetrieverQueryEngine

retriever = index.as_retriever(
    similarity_top_k=10
)

query_engine = RetrieverQueryEngine.from_args(
    retriever=retriever,
    response_synthesizer=response_synthesizer
)
```

## 响应模式

### 常用模式

| 模式 | 说明 |
|------|------|
| **default** | 默认响应 |
| **compact** | 压缩上下文 |
| **simple_summarize** | 简单摘要 |
| **refine** | 逐步优化 |

```python
query_engine = index.as_query_engine(
    response_mode="compact"
)
```

## 最佳实践

| 实践 | 说明 |
|------|------|
| **选择合适的索引** | 根据查询类型选择 |
| **优化 chunk_size** | 根据文档特点调整 |
| **设置 similarity_top_k** | 控制检索数量 |
| **使用合适的嵌入模型** | 根据语言选择 |

## 总结

LlamaIndex 的核心流程：

| 步骤 | 组件 |
|------|------|
| **1. 数据加载** | Data Connectors |
| **2. 文档解析** | Documents → Nodes |
| **3. 索引构建** | VectorStoreIndex |
| **4. 查询处理** | Query Engine |
| **5. 响应生成** | Response Synthesizer |

LlamaIndex 专注于数据检索场景，是构建高效 RAG 应用的理想选择。
