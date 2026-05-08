---
title: LlamaIndex 查询与检索机制
author: Joekma
pubDatetime: 2026-05-08T00:00:00.000+08:00
modDatetime: 2026-05-08T00:00:00.000+08:00
slug: llamaindex-query-retrieval
description: '深入理解LlamaIndex查询引擎、检索机制、响应合成器和高级查询模式。'
tags:
  - LlamaIndex
  - LLM
  - AI
  - Query
  - Retrieval
draft: false
language: zh-CN
---

## 概述

查询是 RAG 系统的核心环节。LlamaIndex 提供了强大而灵活的查询引擎，支持多种检索策略、响应合成模式和高级查询功能。本文将深入探讨 LlamaIndex 的查询机制、检索优化和高级查询模式。

## 查询引擎基础

### 创建查询引擎

```python
from llama_index.core import VectorStoreIndex

# 从索引创建查询引擎
index = VectorStoreIndex.from_documents(documents)

# 基础查询引擎
query_engine = index.as_query_engine()

# 带配置的查询引擎
query_engine = index.as_query_engine(
    similarity_top_k=5,  # 返回前 5 个相关结果
    response_mode="compact",  # 响应模式
    verbose=True  # 显示详细信息
)
```

### 执行查询

```python
# 简单查询
response = query_engine.query("什么是人工智能？")
print(response.response)

# 获取详细结果
response = query_engine.query("机器学习的应用场景")
print(f"回答: {response.response}")
print(f"源节点数: {len(response.source_nodes)}")

# 访问源节点
for node in response.source_nodes:
    print(f"文本: {node.text[:200]}...")
    print(f"相似度: {node.score}")
    print(f"元数据: {node.metadata}")
```

## 检索器（Retriever）

### 内置检索器

```python
from llama_index.core.retrievers import (
    VectorIndexRetriever,
    BM25Retriever,
    AutoMergingRetriever,
    SentenceWindowRetriever,
    QueryFusionRetriever
)

# 向量检索器
retriever = VectorIndexRetriever(
    index=index,
    similarity_top_k=5,
    vector_store_query_mode="default",
    alpha=0.5,  # 混合搜索权重
    filters=None
)

# BM25 检索器（基于关键词）
retriever = BM25Retriever.from_defaults(
    index=index,
    similarity_top_k=5
)

# 自动合并检索器（层级检索）
retriever = AutoMergingRetriever(
    index=index,
    simple_ratio=0.5
)
```

### 自定义检索器

```python
from llama_index.core.retrievers import BaseRetriever
from llama_index.core.schema import NodeWithScore

class CustomRetriever(BaseRetriever):
    """自定义检索器"""
    
    def __init__(self, index, threshold=0.7):
        super().__init__()
        self.index = index
        self.threshold = threshold
    
    def _retrieve(self, query_bundle):
        """实现检索逻辑"""
        # 获取所有节点
        nodes = self.index.docstore.get_nodes(
            self.index.index_struct.nodes
        )
        
        # 自定义过滤逻辑
        filtered_nodes = []
        for node in nodes:
            # 根据自定义条件过滤
            if self._is_relevant(node, query_bundle.query_str):
                filtered_nodes.append(NodeWithScore(
                    node=node,
                    score=self._calculate_score(node, query_bundle.query_str)
                ))
        
        # 按分数排序
        filtered_nodes.sort(key=lambda x: x.score, reverse=True)
        
        return filtered_nodes[:10]
    
    def _is_relevant(self, node, query):
        """判断节点是否相关"""
        # 自定义相关性判断
        return True
    
    def _calculate_score(self, node, query):
        """计算相关分数"""
        return 0.9

# 使用自定义检索器
retriever = CustomRetriever(index, threshold=0.8)
query_engine = index.as_query_engine(retriever=retriever)
```

## 响应合成器（Response Synthesizer）

### 响应模式

| 模式 | 说明 | 适用场景 |
|------|------|---------|
| **compact** | 压缩上下文后生成 | 快速响应 |
| **refine** | 逐步精炼响应 | 高质量回答 |
| **tree_summarize** | 树形结构总结 | 多文档总结 |
| **simple_summarize** | 简单总结 | 快速摘要 |
| **no_text** | 只检索不生成 | 仅检索 |
| **accumulate** | 累积节点结果 | 列表式回答 |

```python
from llama_index.core import ResponseMode

# compact 模式（默认）
query_engine = index.as_query_engine(
    response_mode="compact"
)

# refine 模式（精炼）
query_engine = index.as_query_engine(
    response_mode="refine",
    refine_template="""根据已有回答和上下文，进一步完善答案。
    
已有回答：
{prev_answer}

上下文：
{context}

请基于以上信息，给出更完整、更准确的回答。
"""
)

# tree_summarize 模式
query_engine = index.as_query_engine(
    response_mode="tree_summarize",
    summary_template="请用一句话总结以下内容：{context}"
)

# accumulate 模式
query_engine = index.as_query_engine(
    response_mode="accumulate"
)
```

### 自定义合成器

```python
from llama_index.core.response_synthesizers import CompactAndRefine
from llama_index.core import get_response_synthesizer

# 使用内置合成器
synthesizer = get_response_synthesizer(
    response_mode="compact",
    text_qa_template=PromptTemplate(
        """根据以下上下文回答问题。
        
上下文：
{context}

问题：{query}

回答："""
    )
)

query_engine = index.as_query_engine(
    response_synthesizer=synthesizer
)
```

## 高级查询模式

### 多步查询

```python
from llama_index.core.query_engine import MultiStepQueryEngine
from llama_index.core.step_decomposition import LLMPathExtractor

# 多步查询引擎
step_extractor = LLMPathExtractor.from_defaults(
    llm=llm
)

query_engine = MultiStepQueryEngine(
    query_engine=base_query_engine,
    step_extractor=step_extractor,
    index=index
)

# 执行多步查询
response = query_engine.query(
    "Python 和 JavaScript 有什么区别？"
)
```

### 递归查询

```python
from llama_index.core.query_engine import RecursiveQueryEngine

# 递归查询引擎
query_engine = RecursiveQueryEngine(
    base_query_engine=base_engine,
    retry_engine=retry_engine  # 用于处理模糊查询
)

response = query_engine.query("详细解释一下机器学习")
```

### 查询路由

```python
from llama_index.core.query_engine import RouterQueryEngine
from llama_index.core.selectors import (
    LLMMultiSelector,
    LLMSingleSelector
)

# 定义子查询引擎
vector_engine = index.vector_query_engine
summary_engine = index.summary_query_engine

# 创建路由
selector = LLMMultiSelector.from_defaults(llm=llm)

query_engine = RouterQueryEngine(
    selector=selector,
    query_engine_tools=[
        QueryEngineTool(
            query_engine=vector_engine,
            metadata=ToolMetadata(
                name="vector_search",
                description="用于精确检索文档内容"
            )
        ),
        QueryEngineTool(
            query_engine=summary_engine,
            metadata=ToolMetadata(
                name="summary",
                description="用于获取文档概览"
            )
        )
    ]
)

# 智能路由
response = query_engine.query("总结一下主要内容")
# -> 自动路由到 summary 引擎

response = query_engine.query("第三段讲了什么")
# -> 自动路由到 vector 引擎
```

## 混合搜索

### 配置混合搜索

```python
from llama_index.core import VectorStoreIndex

index = VectorStoreIndex.from_documents(documents)

# 混合搜索（向量 + 关键词）
query_engine = index.as_query_engine(
    vector_store_query_mode="hybrid",
    alpha=0.5,  # 0 = 纯关键词, 1 = 纯向量
    similarity_top_k=10
)

response = query_engine.query("深度学习 模型")
```

### RRF 融合

```python
from llama_index.core.retrievers import QueryFusionRetriever

# RRF（倒数排名融合）
fusion_retriever = QueryFusionRetriever(
    retrievers=[
        VectorIndexRetriever(index=index, similarity_top_k=5),
        BM25Retriever.from_defaults(index=index)
    ],
    mode="rrf",  # 或 "dist_based"
    similarity_top_k=5
)

# 使用融合检索器
query_engine = index.as_query_engine(retriever=fusion_retriever)
```

## 过滤与约束

### 元数据过滤

```python
from llama_index.core.vector_stores import MetadataFilter, MetadataFilters

# 单个过滤器
filters = MetadataFilters(
    filters=[
        MetadataFilter(
            key="category",
            operator="==",
            value="技术文档"
        )
    ]
)

query_engine = index.as_query_engine(
    filters=filters
)

# 多个过滤器（AND）
filters = MetadataFilters(
    filters=[
        MetadataFilter(key="category", operator="==", value="技术文档"),
        MetadataFilter(key="author", operator="==", value="张三"),
        MetadataFilter(key="date", operator=">=", value="2026-01-01")
    ],
    condition="and"
)

# OR 条件
filters = MetadataFilters(
    filters=[
        MetadataFilter(key="tag", operator="==", value="AI"),
        MetadataFilter(key="tag", operator="==", value="ML")
    ],
    condition="or"
)
```

### 预过滤器

```python
from llama_index.core.vector_stores import FilterOperator

# 复杂过滤
filters = MetadataFilters(
    filters=[
        MetadataFilter(
            key="date",
            operator=FilterOperator.GTE,
            value="2026-01-01"
        ),
        MetadataFilter(
            key="status",
            operator=FilterOperator.IN,
            value=["published", "reviewed"]
        )
    ]
)

query_engine = index.as_query_engine(filters=filters)
```

## 查询优化

### MMR（最大边际相关性）

```python
# MMR 检索，增加结果多样性
query_engine = index.as_query_engine(
    vector_store_query_mode="mmr",
    mmr_threshold=0.7,  # 相似度阈值
    similarity_top_k=20  # 初始检索数量
)

response = query_engine.query("深度学习框架")
```

### 查询改写

```python
from llama_index.core.query_engine import QueryReWriterEngine

# 查询改写引擎
query_engine = QueryReWriterEngine(
    base_query_engine=base_engine,
    llm=llm,
    rewrite_template="""将用户问题改写得更清晰、更适合检索。
    
原始问题：{query}

请改写问题，使其更明确、更适合向量检索。
"""
)

# 自动改写查询
response = query_engine.query("那个深度学习的框架怎么用的")
# -> 自动改写为更清晰的查询
```

### HyDE 查询增强

```python
from llama_index.core.query_engine import HyDEQueryEngine

# HyDE（假设文档增强）
query_engine = HyDEQueryEngine(
    base_query_engine=base_engine,
    llm=llm,
    hyde_prompt_template="""根据问题生成一个假设性文档。

问题：{query}

请生成一个可能包含答案的假设性文档片段。
"""
)
```

## 流式响应

```python
# 流式查询
query_engine = index.as_query_engine(
    streaming=True
)

# 流式响应
response = query_engine.query("详细解释一下")

# 逐块输出
for text in response.response_gen:
    print(text, end="", flush=True)
print()
```

## 查询结果后处理

### 结果重排序

```python
from llama_index.core.postprocessor import SimilarityPostprocessor

# 相似度过滤
processor = SimilarityPostprocessor(similarity_cutoff=0.7)

query_engine = index.as_query_engine(
    node_postprocessors=[processor]
)

# 定制重排序
from llama_index.core.postprocessor import KeywordNodePostprocessor

processor = KeywordNodePostprocessor(
    required_keywords=["AI", "机器学习"],
    exclude_keywords=["不相关"]
)

query_engine = index.as_query_engine(
    node_postprocessors=[processor]
)
```

### 结果转换

```python
from llama_index.core.postprocessor import (
    MetadataReplacementPostProcessor,
    LongContextReorder
)

# 元数据替换（将窗口上下文替换原始文本）
processor = MetadataReplacementPostProcessor(
    target_metadata_key="window"
)

# 长上下文重排序（减少中间丢失效应）
reorder = LongContextReorder()

query_engine = index.as_query_engine(
    node_postprocessors=[reorder]
)
```

## 查询监控与调试

### 详细日志

```python
import logging

# 启用详细日志
logging.basicConfig(level=logging.DEBUG)

# 带 verbose 的查询
query_engine = index.as_query_engine(
    verbose=True
)

response = query_engine.query("问题")
```

### 查询分析

```python
# 获取查询相关节点
response = query_engine.query("查询内容")

# 分析源节点
for node in response.source_nodes:
    print(f"节点 ID: {node.id_}")
    print(f"相似度: {node.score}")
    print(f"文本: {node.text[:100]}")
    print(f"元数据: {node.metadata}")
```

## 性能优化

### 缓存优化

```python
from llama_index.core import QueryCacheManager

# 启用查询缓存
cache_manager = QueryCacheManager()

query_engine = index.as_query_engine(
    cache_manager=cache_manager
)
```

### 并行查询

```python
from llama_index.core import VectorStoreIndex
from concurrent.futures import ThreadPoolExecutor

# 批量查询
queries = [
    "问题1",
    "问题2",
    "问题3",
    "问题4"
]

def run_query(query):
    return query_engine.query(query)

with ThreadPoolExecutor(max_workers=4) as executor:
    results = list(executor.map(run_query, queries))
```

### 异步查询

```python
import asyncio
from llama_index.core import AsyncQueryEngine

# 异步查询引擎
async_engine = index.as_async_query_engine()

async def run_queries():
    results = await async_engine.aquery("问题")
    return results

response = asyncio.run(run_queries())
```

## 实战案例：高级问答系统

```python
from llama_index.core import VectorStoreIndex
from llama_index.core.query_engine import RouterQueryEngine
from llama_index.core.selectors import LLMSingleSelector
from llama_index.core.postprocessor import (
    SimilarityPostprocessor,
    KeywordNodePostprocessor,
    LongContextReorder
)

# 构建索引
index = VectorStoreIndex.from_documents(documents)

# 定义多个查询引擎
vector_engine = index.as_query_engine(
    similarity_top_k=10,
    response_mode="compact"
)

summary_engine = index.as_query_engine(
    response_mode="tree_summarize"
)

# 路由选择器
selector = LLMSingleSelector.from_defaults(llm=llm)

# 高级查询引擎
advanced_engine = RouterQueryEngine(
    selector=selector,
    query_engine_tools=[
        QueryEngineTool(
            query_engine=vector_engine,
            metadata=ToolMetadata(
                name="detail_search",
                description="精确检索文档细节"
            )
        ),
        QueryEngineTool(
            query_engine=summary_engine,
            metadata=ToolMetadata(
                name="summary_search",
                description="获取文档概要"
            )
        )
    ]
)

# 添加后处理器
query_engine = index.as_query_engine(
    node_postprocessors=[
        SimilarityPostprocessor(similarity_cutoff=0.75),
        KeywordNodePostprocessor(
            required_keywords=["重要", "关键"],
            exclude_keywords=["测试"]
        ),
        LongContextReorder()
    ]
)

# 执行查询
response = query_engine.query("详细解释深度学习的原理")
print(response.response)
```

## 最佳实践

| 实践 | 说明 |
|------|------|
| **选择合适的检索器** | 根据数据特点和查询需求选择 |
| **优化 chunk_size** | 平衡上下文和精度 |
| **使用混合搜索** | 结合向量和关键词检索 |
| **合理设置 top_k** | 避免过多或过少的结果 |
| **后处理优化** | 过滤和重排序结果 |
| **监控查询性能** | 关注延迟和准确性 |

## 总结

本文深入介绍了 LlamaIndex 的查询与检索机制：

- **查询引擎**：多种内置查询引擎和自定义能力
- **检索器**：向量、关键词、融合等多种检索策略
- **响应合成**：compact、refine、tree_summarize 等模式
- **高级模式**：多步查询、递归查询、智能路由
- **混合搜索**：结合向量和关键词的优势
- **过滤约束**：元数据过滤和后处理
- **性能优化**：缓存、异步和并行处理

掌握这些查询技术，你将能够构建精准、高效的检索系统！🔍
