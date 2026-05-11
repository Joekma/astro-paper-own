---
title: LlamaIndex 查询与检索机制
author: Joekma
pubDatetime: 2026-05-07T00:00:00.000+08:00
modDatetime: 2026-05-07T00:00:00.000+08:00
slug: llamaindex-query-retrieval
description: '深入讲解LlamaIndex查询与检索机制，包括查询引擎、检索器、后处理器和响应合成。'
tags:
  - LlamaIndex
  - Query
  - Retrieval
draft: false
series: LlamaIndex
language: zh-CN
---

## 概述

查询与检索是 LlamaIndex 实现 RAG 的核心环节。本篇将详细介绍查询引擎的工作机制、检索器的配置以及如何优化检索效果。

### 查询流程

```
┌─────────────────────────────────────────────────────────────┐
│                   LlamaIndex 查询流程                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌────────┐ │
│   │  用户查询 │ → │  检索   │ → │  后处理  │ → │  合成  │ │
│   └──────────┘   └──────────┘   └──────────┘   └────────┘ │
│                                                              │
│       ↑              ↑              ↑              ↑         │
│       │              │              │              │         │
│   Query String    Retriever    Postprocessor   Synthesizer │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 查询引擎

### 创建查询引擎

```python
from llama_index.core import VectorStoreIndex

index = VectorStoreIndex.from_documents(documents)

query_engine = index.as_query_engine(
    similarity_top_k=5,
    response_mode="compact"
)

response = query_engine.query("你的问题")
print(response)
```

### 基础查询

```python
response = query_engine.query("LangChain是什么？")
print(response)
print(f"来源：{response.metadata}")
```

### 流式查询

```python
query_engine = index.as_query_engine(
    streaming=True
)

response_stream = query_engine.query("解释量子计算")

for text in response_stream.response_gen:
    print(text, end="", flush=True)
```

### 异步查询

```python
import asyncio

async def async_query():
    response = await query_engine.aquery("异步查询测试")
    return response

result = asyncio.run(async_query())
```

## 检索器

### 创建检索器

```python
retriever = index.as_retriever(
    similarity_top_k=5,
    alpha=0.5
)

nodes = retriever.retrieve("检索查询")

for node in nodes:
    print(f"内容：{node.text[:100]}...")
    print(f"相似度：{node.score}")
```

### 向量检索

```python
from llama_index.core.retrievers import VectorIndexRetriever

retriever = VectorIndexRetriever(
    index=index,
    similarity_top_k=10,
    alpha=0.7,
    filters=None
)

nodes = retriever.retrieve("查询")
```

### 混合检索

```python
from llama_index.core.retrievers import QueryFusionRetriever
from llama_index.core.retrievers import VectorIndexRetriever
from llama_index.core.retrievers import KeywordTableRetriever

vector_retriever = VectorIndexRetriever(index=index)
keyword_retriever = KeywordTableRetriever(index=keyword_index)

fusion_retriever = QueryFusionRetriever(
    retrievers=[vector_retriever, keyword_retriever],
    similarity_top_k=5,
    num_queries=4,
    mode=QueryFusionMode.RECIPROCAL_RANK
)
```

### 自定义检索器

```python
from llama_index.core.retrievers import BaseRetriever

class CustomRetriever(BaseRetriever):
    def __init__(self, index, threshold=0.5):
        self.index = index
        self.threshold = threshold

    def retrieve(self, query_bundle):
        nodes = self.index.retrieve(query_bundle)
        filtered = [n for n in nodes if n.score >= self.threshold]
        return filtered

retriever = CustomRetriever(index, threshold=0.7)
```

## 后处理器

### 相似度过滤

```python
from llama_index.core.postprocessor import SimilarityPostprocessor

postprocessor = SimilarityPostprocessor(
    similarity_cutoff=0.7
)

query_engine = index.as_query_engine(
    node_postprocessors=[postprocessor]
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

### 元数据过滤

```python
from llama_index.core.postprocessor import MetadataReplacementPostProcessor

postprocessor = MetadataReplacementPostProcessor(
    target_metadata_key="window_metadata"
)

query_engine = index.as_query_engine(
    node_postprocessors=[postprocessor]
)
```

### 组合后处理器

```python
from llama_index.core.postprocessor import (
    SimilarityPostprocessor,
    SentenceEmbeddingRerank,
    KeywordNodePostprocessor
)

query_engine = index.as_query_engine(
    similarity_top_k=30,
    node_postprocessors=[
        SimilarityPostprocessor(similarity_cutoff=0.6),
        SentenceEmbeddingRerank(top_n=10),
        KeywordNodePostprocessor(keywords=["技术", "架构"])
    ]
)
```

## 响应合成

### 响应模式

| 模式 | 说明 | 适用场景 |
|------|------|---------|
| **default** | 默认响应 | 简单问答 |
| **compact** | 压缩上下文 | 长文本处理 |
| **simple_summarize** | 简单摘要 | 快速响应 |
| **refine** | 逐步优化 | 复杂问答 |

```python
query_engine = index.as_query_engine(
    response_mode="compact"
)

response = query_engine.query("问题")
```

### 自定义响应合成

```python
from llama_index.core.response_synthesizers import TreeSummarize

synthesizer = TreeSummarize(
    service_context=service_context,
    summary_template="总结以下内容：{context}"
)

query_engine = RetrieverQueryEngine.from_args(
    retriever=retriever,
    response_synthesizer=synthesizer
)
```

## Chat Engine

### 对话模式

```python
chat_engine = index.as_chat_engine(
    chat_mode="condense_plus_context",
    similarity_top_k=5
)

response = chat_engine.chat("你好")
print(response)
```

### 聊天模式类型

| 模式 | 说明 |
|------|------|
| **condense** | 压缩上下文 |
| **context** | 保持完整上下文 |
| **condense_plus_context** | 压缩+上下文 |

```python
chat_engine = index.as_chat_engine(
    chat_mode="condense_plus_context",
    system_prompt="你是一个专业的技术顾问。"
)
```

## 查询优化

### 高级配置

```python
from llama_index.core.query_engine import RetrieverQueryEngine

retriever = VectorIndexRetriever(
    index=index,
    similarity_top_k=20,
    alpha=0.5
)

postprocessor = SentenceEmbeddingRerank(
    top_n=10,
    model="text-embedding-3-small"
)

synthesizer = TreeSummarize(
    service_context=service_context,
    verbose=True
)

query_engine = RetrieverQueryEngine.from_args(
    retriever=retriever,
    node_postprocessors=[postprocessor],
    response_synthesizer=synthesizer
)
```

### 自动优化

```python
query_engine = index.as_query_engine(
    similarity_top_k=5,
    response_mode="compact",
    optimize_by_category=True
)
```

## 索引更新

### 增量更新

```python
new_docs = SimpleDirectoryReader("./new_data").load_data()

for doc in new_docs:
    index.insert(doc)
```

### 删除节点

```python
from llama_index.core.storage.docstore import SimpleDocumentStore

docstore = index.storage_context.docstore
docstore.delete_document(doc_id="doc_123")
```

### 重建索引

```python
index.delete_ref_doc(ref_doc_id="doc_123", delete_from_docstore=True)
index.insert(new_doc)
```

## 最佳实践

| 实践 | 说明 |
|------|------|
| **top_k 优化** | 检索更多候选，用后处理器过滤 |
| **alpha 参数** | 控制向量和关键词检索权重 |
| **响应模式** | 根据场景选择合适模式 |
| **重排序** | 提升检索质量 |

## 总结

| 组件 | 功能 |
|------|------|
| **QueryEngine** | 封装检索和合成 |
| **Retriever** | 从索引获取相关节点 |
| **Postprocessor** | 过滤和重排序 |
| **ResponseSynthesizer** | 生成最终响应 |

优化查询检索是提升 RAG 应用效果的关键环节。
