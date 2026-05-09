---
title: Qdrant 入门指南：核心概念
author: Joekma
pubDatetime: 2026-05-09T00:00:00.000+08:00
modDatetime: 2026-05-09T00:00:00.000+08:00
slug: qdrant-getting-started
description: '详细介绍Qdrant向量数据库的核心概念、架构特点和应用场景。'
tags:
  - Qdrant
  - 向量数据库
  - AI
  - 相似性搜索
draft: false
language: zh-CN
---

## 概述

Qdrant 是一个开源的高性能向量搜索数据库和向量相似度搜索引擎，专为下一代 AI 应用设计。它提供了方便的 API，支持存储、搜索和管理带负载向量的点（points）。Qdrant 支持微服务部署，并提供有状态的过滤和查询功能。

### 为什么选择 Qdrant？

| 特性 | 说明 |
|------|------|
| **高性能** | HNSW 图索引，毫秒级查询 |
| **灵活过滤** | 支持复杂条件过滤 |
| **多语言** | Python、Rust、Go、JavaScript 等 |
| **云原生** | Docker、Kubernetes 友好 |
| **实时更新** | 支持在线数据更新 |
| **混合搜索** | 向量 + 关键词组合搜索 |

### Qdrant vs Milvus

| 特性 | Qdrant | Milvus |
|------|---------|--------|
| **索引类型** | HNSW | HNSW, IVF, ANNOY |
| **过滤** | 强大的 DSL | 表达式过滤 |
| **API** | REST + gRPC | REST + gRPC |
| **部署** | 轻量级 | 可分布式 |
| **客户端** | 多语言 SDK | 多语言 SDK |
| **云服务** | Qdrant Cloud | Zilliz Cloud |

## 核心概念

### Collection

Collection 是 Qdrant 中的顶级数据结构，类似于关系数据库的表：

```python
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams

client = QdrantClient("localhost", port=6333)

# 创建 Collection
client.create_collection(
    collection_name="my_collection",
    vectors_config=VectorParams(
        size=768,                    # 向量维度
        distance=Distance.COSINE    # 距离度量
    )
)
```

### Point

Point 是 Qdrant 中的基本数据单元，包含向量和负载：

```json
{
    "id": "unique-id-1",
    "vector": [0.1, 0.2, ...],  // 向量
    "payload": {                     // 负载数据
        "name": "Item 1",
        "category": "electronics",
        "price": 299.99,
        "in_stock": true
    }
}
```

### Vector

Vector 是点的数学表示：

```python
# 向量示例：768 维（BERT 模型输出）
vector = [0.123, 0.456, 0.789, ...]  # 768 维浮点数

# 二值向量（使用汉明距离）
binary_vector = [0, 1, 1, 0, ...]  # 二值向量
```

### Payload

Payload 存储向量的元数据：

```python
# 带负载的 Point
from qdrant_client.models import PointStruct

point = PointStruct(
    id=1,
    vector=[0.1] * 768,
    payload={
        "name": "Product A",
        "category": "electronics",
        "price": 299.99,
        "tags": ["electronics", "sale"],
        "created_at": "2024-01-01"
    }
)

# 插入 Point
client.upsert(
    collection_name="products",
    points=[point]
)
```

## 系统架构

### 架构概览

```
┌─────────────────────────────────────────────────────────────┐
│                      Qdrant 架构                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────┐   │
│  │                 API Layer                             │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐      │   │
│  │  │   REST    │  │   gRPC    │  │  Dashboard │      │   │
│  │  │   API     │  │   API     │  │            │      │   │
│  │  └────────────┘  └────────────┘  └────────────┘      │   │
│  └────────────────────────────────────────────────────┘   │
│                            │                               │
│  ┌────────────────────────────────────────────────────┐   │
│  │              Collections & Points                     │   │
│  │                                                       │   │
│  │  Collection ────> Segments ───> Points              │   │
│  │                                                       │   │
│  └────────────────────────────────────────────────────┘   │
│                            │                               │
│  ┌────────────────────────────────────────────────────┐   │
│  │                  Storage Layer                       │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐      │   │
│  │  │  HNSW    │  │  Payload  │  │  WAL      │      │   │
│  │  │  Index   │  │  Index    │  │  Write    │      │   │
│  │  └────────────┘  └────────────┘  └────────────┘      │   │
│  └────────────────────────────────────────────────────┘   │
│                            │                               │
│  ┌────────────────────────────────────────────────────┐   │
│  │                  Persistence                         │   │
│  │  ┌────────────┐  ┌────────────┐                      │   │
│  │  │ 磁盘存储  │  │  快照备份  │                      │   │
│  │  └────────────┘  └────────────┘                      │   │
│  └────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 组件说明

| 组件 | 说明 |
|------|------|
| **REST API** | HTTP 接口，方便调试和集成 |
| **gRPC API** | 高性能二进制协议 |
| **HNSW 索引** | 图索引，快速近似搜索 |
| **Payload 索引** | 字段索引，快速过滤 |
| **WAL** | 预写日志，保证数据持久性 |

## 距离度量

### 支持的距离类型

| 距离类型 | 说明 | 适用场景 |
|----------|------|----------|
| **Cosine** | 余弦相似度 | NLP、文本相似度 |
| **Euclid** | 欧氏距离 | 图像、特征向量 |
| **Dot** | 点积 | 推荐系统、嵌入向量 |
| **Manhattan** | 曼哈顿距离 | 特定场景 |

```python
from qdrant_client.models import Distance

# 余弦距离（推荐用于文本）
client.create_collection(
    collection_name="text_vectors",
    vectors_config=VectorParams(size=768, distance=Distance.COSINE)
)

# 欧氏距离（用于图像特征）
client.create_collection(
    collection_name="image_vectors",
    vectors_config=VectorParams(size=512, distance=Distance.EUCLID)
)

# 点积（用于归一化向量）
client.create_collection(
    collection_name="embeddings",
    vectors_config=VectorParams(size=768, distance=Distance.DOT)
)
```

## 索引类型

### HNSW 图索引

HNSW (Hierarchical Navigable Small World) 是 Qdrant 的核心索引：

```python
# HNSW 参数配置
hnsw_config = HnswConfigDiff(
    m=16,                    # 连接数
    ef_construct=200,       # 索引构建参数
    full_scan_threshold=10000 # 全表扫描阈值
)

# 创建带配置的 Collection
client.create_collection(
    collection_name="products",
    vectors_config=VectorParams(size=768, distance=Distance.COSINE),
    hnsw_config=hnsw_config
)
```

### HNSW 参数调优

| 参数 | 说明 | 推荐值 |
|------|------|----------|
| m | 每层最大连接数 | 8-32 |
| ef_construction | 索引构建时搜索宽度 | 64-512 |
| full_scan_threshold | 启用全表扫描的阈值 | 10K-100K |

## 过滤条件

### Payload 过滤

Qdrant 支持强大的过滤功能：

```python
from qdrant_client.models import Filter, FieldCondition, MatchValue, Range, MatchAny

# 简单过滤
filter_must = Filter(
    must=[
        FieldCondition(
            key="category",
            match=MatchValue(value="electronics")
        )
    ]
)

# 范围过滤
filter_range = Filter(
    must=[
        Range(
            key="price",
            gte=100,
            lte=500
        )
    ]
)

# 多值匹配
filter_any = Filter(
    must=[
        MatchAny(
            key="tags",
            any=["electronics", "sale", "new"]
        )
    ]
)

# 组合过滤
complex_filter = Filter(
    must=[
        FieldCondition(key="category", match=MatchValue(value="electronics")),
        Range(key="price", gte=100),
    ],
    must_not=[
        FieldCondition(key="out_of_stock", match=MatchValue(value=True))
    ]
)

# 执行过滤搜索
results = client.search(
    collection_name="products",
    query_vector=query_vector,
    query_filter=complex_filter,
    limit=10
)
```

### 过滤操作符

| 操作符 | 说明 | 示例 |
|--------|------|------|
| **MatchValue** | 精确匹配 | `category == "electronics"` |
| **Range** | 范围比较 | `price >= 100 AND price <= 500` |
| **MatchAny** | 任意匹配 | `tags IN ["A", "B"]` |
| **MatchExcept** | 排除匹配 | `tags NOT IN ["expired"]` |
| **Nested** | 嵌套字段 | `user.name == "John"` |

## 应用场景

### 语义搜索

```python
def semantic_search(query_text, collection_name="documents"):
    # 1. 将查询文本向量化
    query_vector = embed_model.encode(query_text)
    
    # 2. 搜索相似文档
    results = client.search(
        collection_name=collection_name,
        query_vector=query_vector,
        query_filter=Filter(
            must=[
                FieldCondition(
                    key="status",
                    match=MatchValue(value="published")
                )
            ]
        ),
        limit=5
    )
    
    return [result.payload['text'] for result in results]
```

### 推荐系统

```python
def recommend_items(user_vector, user_preferences, limit=10):
    # 1. 基础推荐
    base_results = client.search(
        collection_name="items",
        query_vector=user_vector,
        limit=100
    )
    
    # 2. 应用业务规则过滤
    filtered = [
        r for r in base_results
        if r.payload['category'] in user_preferences['categories']
        and r.payload['price'] <= user_preferences['max_price']
    ]
    
    return filtered[:limit]
```

### RAG 应用

```python
def rag_retrieve(query, collection_name="documents", top_k=5):
    # 1. 向量化查询
    query_vector = embedding_model.encode(query)
    
    # 2. 检索相关文档
    results = client.search(
        collection_name=collection_name,
        query_vector=query_vector,
        query_filter=Filter(
            must=[
                FieldCondition(
                    key="chunk_type",
                    match=MatchValue(value="content")
                )
            ]
        ),
        limit=top_k
    )
    
    # 3. 构建上下文
    context = "\n\n".join([
        r.payload['text'] for r in results
    ])
    
    return context
```

## 快速开始

### Python SDK 基本使用

```python
from qdrant_client import QdrantClient
from qdrant_client.models import (
    VectorParams, Distance, PointStruct
)

# 1. 连接 Qdrant
client = QdrantClient("localhost", port=6333)

# 2. 创建 Collection
client.create_collection(
    collection_name="demo",
    vectors_config=VectorParams(
        size=768,
        distance=Distance.COSINE
    )
)

# 3. 插入数据
import numpy as np

points = [
    PointStruct(
        id=i,
        vector=np.random.rand(768).tolist(),
        payload={"content": f"Document {i}"}
    )
    for i in range(100)
]

client.upsert(
    collection_name="demo",
    points=points
)

# 4. 搜索
query_vector = np.random.rand(768).tolist()
results = client.search(
    collection_name="demo",
    query_vector=query_vector,
    limit=5
)

for result in results:
    print(f"ID: {result.id}, Score: {result.score}")

# 5. 删除
client.delete_collection("demo")
```

### Rust SDK

```rust
use qdrant_client::client::QdrantClient;
use qdrant_client::models::Distance, VectorParams;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = QdrantClient::from_url("http://localhost:6333").build()?;

    // 创建 Collection
    client.create_collection(
        "test".into(),
        vectors_config: VectorParams {
            size: 768,
            distance: Distance::Cosine,
        }
    ).await?;

    Ok(())
}
```

## 与 LLM 集成

### LangChain 集成

```python
from langchain.vectorstores import Qdrant
from langchain.embeddings import OpenAIEmbeddings

# 初始化
embeddings = OpenAIEmbeddings()
vectorstore = Qdrant.from_documents(
    documents=texts,
    embedding=embeddings,
    url="http://localhost:6333",
    collection_name="my_collection"
)

# 相似度搜索
docs = vectorstore.similarity_search(query, k=5)
```

## 性能优化

### 批量操作

```python
# 批量插入提高性能
batch_size = 1000
for i in range(0, len(vectors), batch_size):
    batch = vectors[i:i+batch_size]
    points = [
        PointStruct(id=j, vector=v, payload={"id": j})
        for j, v in enumerate(batch, start=i)
    ]
    client.upsert(collection_name="test", points=points)
```

### 索引优化

```python
# 创建索引后重建
client.recreate_collection(
    collection_name="test",
    vectors_config=VectorParams(size=768, distance=Distance.COSINE),
    hnsw_config=HnswConfigDiff(
        m=32,                    # 提高准确性
        ef_construct=256        # 提高构建质量
    )
)
```

## 监控和运维

### 健康检查

```bash
# 检查服务状态
curl http://localhost:6333/health

# 查看 Collections
curl http://localhost:6333/collections

# 查看 Collection 详情
curl http://localhost:6333/collections/test
```

### 性能指标

```bash
# 查看指标
curl http://localhost:6333/metrics
```


