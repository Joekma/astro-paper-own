---
title: LlamaIndex 实战：构建 RAG 应用
author: Joekma
pubDatetime: 2026-05-07T00:00:00.000+08:00
modDatetime: 2026-05-07T00:00:00.000+08:00
slug: llamaindex-rag-pratice
description: '使用LlamaIndex构建完整的RAG应用，包括文档处理、索引构建、查询优化和多模态支持。'
tags:
  - LlamaIndex
  - RAG
  - 实战
draft: false
series: LlamaIndex
seriesOrder: 3
language: zh-CN
---

## 概述

本文将通过实战项目展示如何使用 LlamaIndex 构建完整的 RAG（检索增强生成）应用。我们将实现一个支持多种文档格式、灵活检索的智能问答系统。

### 项目架构

```
┌─────────────────────────────────────────────────────────────┐
│                    RAG 应用架构                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌────────┐ │
│   │  数据加载 │ → │  文本分割 │ → │  构建索引 │ → │  存储  │ │
│   └──────────┘   └──────────┘   └──────────┘   └────────┘ │
│                                                              │
│   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌────────┐ │
│   │  用户查询 │ → │  语义检索 │ → │  上下文  │ → │  生成  │ │
│   └──────────┘   └──────────┘   └──────────┘   └────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 项目初始化

### 环境配置

```bash
pip install llama-index
pip install llama-index-llms-openai
pip install llama-index-embeddings-openai
pip install llama-index-readers-file
```

### 基本设置

```python
# 导入OpenAI的LLM和嵌入模型
from llama_index.llms.openai import OpenAI
from llama_index.embeddings.openai import OpenAIEmbedding

# 创建LLM实例
llm = OpenAI(model="gpt-4")

# 创建嵌入模型实例，用于将文本转换为向量
embed_model = OpenAIEmbedding(model="text-embedding-3-small")
```

## 数据加载模块

### 加载多种文档

```python
# 导入文档加载器和配置类
from llama_index.core import SimpleDirectoryReader
from llama_index.core.config import ServiceContext

# 创建服务上下文，配置LLM和嵌入模型
service_context = ServiceContext.from_defaults(
    llm=llm,
    embed_model=embed_model
)

# 定义文档加载函数
def load_documents(data_dir: str):
    # 创建目录读取器
    reader = SimpleDirectoryReader(
        input_dir=data_dir,
        recursive=True,                 # 递归扫描子目录
        exclude=["*.tmp", ".git/*"]    # 排除临时文件和git目录
    )
    documents = reader.load_data()
    return documents

# 加载文档
documents = load_documents("./data")
print(f"加载了 {len(documents)} 个文档")
```

### 自定义文档加载

```python
from llama_index.core import Document

# 创建自定义文档
custom_doc = Document(
    text="自定义文档内容",
    # 包含自定义元数据
    metadata={
        "source": "custom",
        "category": "technical",
        "version": "1.0"
    }
)
```

## 文本分割模块

### 智能分割策略

```python
from llama_index.core.node_parser import SentenceSplitter

# 定义文档分割函数
def split_documents(documents, chunk_size=512, chunk_overlap=64):
    # 创建句子级别的分割器
    parser = SentenceSplitter(
        chunk_size=chunk_size,        # 每个chunk的字符数
        chunk_overlap=chunk_overlap,  # 相邻chunk的重叠字符数
        separator="\n\n"             # 分割符
    )

    # 将文档分割成节点
    nodes = parser.get_nodes_from_documents(documents)
    return nodes

nodes = split_documents(documents)
print(f"生成了 {len(nodes)} 个节点")
```

### 按标题分割

```python
from llama_index.core.node_parser import MarkdownNodeParser

parser = MarkdownNodeParser()

nodes = parser.get_nodes_from_documents(documents)
```

## 索引构建

### 创建向量索引

```python
# 导入向量存储索引和存储上下文
from llama_index.core import VectorStoreIndex, StorageContext
from llama_index.core.config import ServiceContext

def build_vector_index(nodes, persist_dir="./storage"):
    # 创建服务上下文
    service_context = ServiceContext.from_defaults(
        llm=llm,
        embed_model=embed_model
    )

    # 从节点创建索引
    index = VectorStoreIndex.from_documents(
        nodes,
        service_context=service_context
    )

    # 持久化存储
    index.storage_context.persist(persist_dir=persist_dir)

    return index

index = build_vector_index(nodes)
```

### 加载已有索引

```python
from llama_index.core import load_index_from_storage

def load_existing_index(persist_dir="./storage"):
    # 创建存储上下文，指定持久化目录
    storage_context = StorageContext.from_defaults(
        persist_dir=persist_dir
    )

    # 创建服务上下文
    service_context = ServiceContext.from_defaults(
        llm=llm,
        embed_model=embed_model
    )

    # 从存储加载索引
    index = load_index_from_storage(
        storage_context=storage_context,
        service_context=service_context
    )

    return index

index = load_existing_index()
```

## 查询引擎

### 基础查询

```python
def create_query_engine(index, similarity_top_k=5):
    # 将索引转换为查询引擎
    query_engine = index.as_query_engine(
        similarity_top_k=similarity_top_k,  # 检索最相似的top_k个结果
        response_mode="compact"              # 压缩上下文模式
    )
    return query_engine

query_engine = create_query_engine(index)

response = query_engine.query("你的问题")
print(response)
```

### 高级查询配置

```python
from llama_index.core.query_engine import RetrieverQueryEngine
from llama_index.core.retrievers import VectorIndexRetriever
from llama_index.core.postprocessor import SimilarityPostprocessor

retriever = VectorIndexRetriever(
    index=index,
    similarity_top_k=10,
    alpha=0.5
)

postprocessor = SimilarityPostprocessor(
    similarity_cutoff=0.7
)

query_engine = RetrieverQueryEngine.from_args(
    retriever=retriever,
    node_postprocessors=[postprocessor]
)
```

## 对话式查询

### Chat Engine

```python
def create_chat_engine(index):
    chat_engine = index.as_chat_engine(
        chat_mode="condense_plus_context",
        similarity_top_k=5
    )
    return chat_engine

chat_engine = create_chat_engine(index)

response = chat_engine.chat("你好")
print(response)

response = chat_engine.chat("我刚才问了什么？")
print(response)
```

### 多轮对话

```python
chat_engine = index.as_chat_engine(
    chat_mode="context",
    system_prompt="你是一个有帮助的助手，基于提供的上下文回答问题。"
)

messages = [
    {"role": "user", "content": "我叫张三"},
    {"role": "assistant", "content": "你好张三，有什么可以帮助你的？"},
    {"role": "user", "content": "我的名字是什么？"}
]

for msg in messages:
    response = chat_engine.chat(msg["content"])
    print(f"{msg['role']}: {msg['content']}")
    print(f"assistant: {response}")
```

## 检索优化

### 混合检索

```python
from llama_index.core.retrievers import KeywordTableSimpleRetriever
from llama_index.core import SummaryIndex

keyword_index = SummaryIndex.from_documents(documents)

hybrid_retriever = index.as_retriever(
    vector_similarity_top_k=5,
    filters=["metadata.category == 'technical'"]
)
```

### 重排序

```python
from llama_index.core.postprocessor import SentenceEmbeddingRerank

rerank = SentenceEmbeddingRerank(
    top_n=5,
    model="text-embedding-3-small"
)

query_engine = index.as_query_engine(
    similarity_top_k=20,
    node_postprocessors=[rerank]
)
```

## 完整 RAG Pipeline

### 封装为类

```python
class RAGApplication:
    def __init__(self, data_dir: str, persist_dir: str = "./storage"):
        self.data_dir = data_dir
        self.persist_dir = persist_dir
        self.service_context = ServiceContext.from_defaults(
            llm=llm,
            embed_model=embed_model
        )
        self.index = None
        self.query_engine = None

    def load_and_index(self):
        reader = SimpleDirectoryReader(self.data_dir)
        documents = reader.load_data()

        parser = SentenceSplitter(chunk_size=512, chunk_overlap=64)
        nodes = parser.get_nodes_from_documents(documents)

        self.index = VectorStoreIndex.from_documents(
            nodes,
            service_context=self.service_context
        )

        self.index.storage_context.persist(self.persist_dir)
        return self

    def load_index(self):
        storage_context = StorageContext.from_defaults(
            persist_dir=self.persist_dir
        )
        self.index = load_index_from_storage(
            storage_context=storage_context,
            service_context=self.service_context
        )
        return self

    def query(self, question: str) -> str:
        if not self.index:
            self.load_index()

        query_engine = self.index.as_query_engine(
            similarity_top_k=5,
            response_mode="compact"
        )

        response = query_engine.query(question)
        return response

    def chat(self, message: str) -> str:
        if not self.index:
            self.load_index()

        chat_engine = self.index.as_chat_engine(
            chat_mode="condense_plus_context"
        )

        response = chat_engine.chat(message)
        return response

rag_app = RAGApplication("./data")
rag_app.load_and_index()

result = rag_app.query("关于某个主题的问题")
print(result)
```

## 性能优化

### 批量查询

```python
def batch_query(query_engine, questions: list):
    responses = []
    for question in questions:
        response = query_engine.query(question)
        responses.append(response)
    return responses

responses = batch_query(query_engine, ["问题1", "问题2", "问题3"])
```

### 异步处理

```python
import asyncio

async def async_query(query_engine, question: str):
    response = await query_engine.aquery(question)
    return response

async def async_batch_query(query_engine, questions: list):
    tasks = [async_query(query_engine, q) for q in questions]
    responses = await asyncio.gather(*tasks)
    return responses
```

## 错误处理

```python
def safe_query(query_engine, question: str, max_retries=3):
    for attempt in range(max_retries):
        try:
            response = query_engine.query(question)
            return response
        except Exception as e:
            if attempt == max_retries - 1:
                raise e
            continue
    return "查询失败"
```

## 最佳实践

| 实践 | 说明 |
|------|------|
| **chunk_size 优化** | 根据文档长度调整（512-1024） |
| **overlap 设置** | 保持 10-20% 的重叠 |
| **similarity_top_k** | 检索更多候选后重排序 |
| **metadata 利用** | 过滤和路由检索 |

## 总结

本文实现了一个完整的 LlamaIndex RAG 应用：

| 模块 | 功能 |
|------|------|
| **数据加载** | 多格式文档支持 |
| **文本分割** | 智能 chunk 策略 |
| **索引构建** | 向量存储 |
| **查询引擎** | 灵活检索 |
| **对话引擎** | 多轮对话 |

这个 RAG Pipeline 可以作为构建更复杂知识问答系统的基础。
