---
title: Milvus 入门指南：核心概念与架构
author: Joekma
pubDatetime: 2026-05-09T00:00:00.000+08:00
modDatetime: 2026-05-09T00:00:00.000+08:00
slug: milvus-getting-started
description: '详细介绍Milvus向量数据库的核心概念、架构组件和应用场景，帮助读者快速入门。'
tags:
  - Milvus
  - 向量数据库
  - AI
  - 机器学习
draft: false
language: zh-CN
---

## 概述

Milvus 是 LF AI & Data Foundation 旗下的开源向量数据库，专为处理海量向量数据设计，支持十亿级别的向量检索。作为云原生且分布式的向量数据库，Milvus 广泛应用于语义搜索、推荐系统、图像检索、自然语言处理等场景。

### 为什么选择 Milvus？

| 特性 | 说明 |
|------|------|
| **高性能** | 支持十亿级向量检索，毫秒级查询延迟 |
| **可扩展** | 原生支持分布式水平扩展 |
| **多索引** | 支持 IVF、HNSW、DiskANN 等多种索引 |
| **多语言** | 提供 Python、Java、Go、RESTful 等 SDK |
| **云原生** | 支持 Kubernetes 部署 |
| **开源免费** | Apache 2.0 许可证 |

### 向量数据库 vs 传统数据库

```
┌─────────────────────────────────────────────────────────────┐
│                 向量数据库 vs 传统数据库                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────┐    ┌──────────────────────────┐   │
│  │    传统数据库        │    │    向量数据库           │   │
│  ├──────────────────────┤    ├──────────────────────────┤   │
│  │ 存储结构化数据        │    │ 存储向量数据           │   │
│  │ 精确匹配            │    │ 近似最近邻（ANN）搜索   │   │
│  │ SQL 查询            │    │ 向量相似度搜索         │   │
│  │ 索引：B+树、哈希     │    │ 索引：HNSW、IVF、FAISS │   │
│  └─────────────────────┘    └──────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 核心概念

### 向量（Vector）

向量是 Milvus 存储的基本单元，通常由 Embedding 模型生成：

```python
# 向量示例：图像或文本的数学表示
vector = [0.123, 0.456, 0.789, ...]  # 128维、256维、768维、1536维...

# 常见向量维度
image_vectors = 512     # ResNet 生成的向量
text_vectors = 768      # BERT 生成的向量
sentence_vectors = 1536  # GPT 生成的向量
```

### 集合（Collection）

Collection 类似于关系型数据库中的表：

```python
from pymilvus import connections, Collection

# 连接到 Milvus
connections.connect(host='localhost', port='19530')

# 创建集合
collection = Collection('my_collection')

# 获取集合信息
print(f"集合名称: {collection.name}")
print(f"向量维度: {collection.dimension}")
print(f"数据量: {collection.num_entities}")
```

### 分区（Partition）

Partition 是集合的逻辑分区，提高查询效率：

```python
# 创建分区
collection.create_partition("partition_name")

# 查询特定分区
collection.query(
    expr="partition_tag in ['partition_name']",
    output_fields=["vector_field"]
)
```

### Shard

Shard 将数据水平分片，提高写入吞吐量：

```python
# Milvus 自动管理分片
# 通常 Shard 数 = 2 * CPU 核心数
```

## 系统架构

### 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                     Milvus 系统架构                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                   应用层                               │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐           │  │
│  │  │ Python  │  │   Java  │  │   Go    │           │  │
│  │  │   SDK   │  │   SDK   │  │   SDK   │           │  │
│  │  └──────────┘  └──────────┘  └──────────┘           │  │
│  └──────────────────────────────────────────────────────┘  │
│                            │                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                  协调服务层 (Coordination)            │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐           │  │
│  │  │  Root    │  │  Index   │  │   Query  │           │  │
│  │  │  Coord  │  │  Coord   │  │   Coord  │           │  │
│  │  └──────────┘  └──────────┘  └──────────┘           │  │
│  └──────────────────────────────────────────────────────┘  │
│                            │                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                    执行节点层 (Workers)               │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐           │  │
│  │  │  Data   │  │  Index   │  │  Query   │           │  │
│  │  │  Node   │  │  Node   │  │   Node   │           │  │
│  │  └──────────┘  └──────────┐  └──────────┘           │  │
│  └──────────────────────────────────────────────────────┘  │
│                            │                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                    存储层 (Storage)                   │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐           │  │
│  │  │ MinIO/  │  │  RocksDB │  │  etcd   │           │  │
│  │  │ S3      │  │          │  │          │           │  │
│  │  └──────────┘  └──────────┘  └──────────┘           │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 组件职责

| 组件 | 职责 |
|------|------|
| **Root Coord** | 元数据管理、ID 生成、时间戳分配 |
| **Index Coord** | 索引管理、调度 |
| **Query Coord** | 查询调度、负载均衡 |
| **Data Coord** | 数据管理、压缩 |
| **Data Node** | 数据写入、持久化 |
| **Query Node** | 向量检索 |
| **Index Node** | 索引构建 |

## 索引类型

### 索引类型对比

| 索引类型 | 适用场景 | 优点 | 缺点 |
|----------|----------|------|------|
| **FLAT** | 小数据量 | 精确搜索 | 慢 |
| **IVF** | 中等数据 | 快速 | 精度损失 |
| **HNSW** | 大规模数据 | 极快 | 内存占用高 |
| **DiskANN** | 超大规模 | 可扩展 | 需要 SSD |
| **ANNOY** | 内存受限 | 内存友好 | 查询较慢 |

### IVF 索引

```python
# IVF (Inverted File) 索引
# 将向量空间划分为多个聚类
index_params = {
    "metric_type": "L2",      # 距离度量
    "index_type": "IVF_FLAT",
    "params": {"nlist": 128}
}

# 创建索引
collection.create_index(
    field_name="vector_field",
    index_params=index_params
)
```

### HNSW 索引

```python
# HNSW (Hierarchical Navigable Small World) 索引
# 基于图的近似最近邻搜索
index_params = {
    "metric_type": "IP",      # 内积
    "index_type": "HNSW",
    "params": {
        "M": 16,              # 每层连接数
        "efConstruction": 200  # 搜索宽度
    }
}
```

## 距离度量

### 度量类型

| 度量 | 说明 | 适用场景 |
|------|------|----------|
| **L2** | 欧氏距离 | 图像、音频 |
| **IP** | 内积 | 归一化向量 |
| **HAMMING** | 汉明距离 | 二值向量 |
| **JACCARD** | 杰卡德距离 | 集合相似度 |

```python
# L2 距离（欧氏距离）
# d = √(Σ(aᵢ - bᵢ)²)

# IP 距离（内积）
# d = Σ(aᵢ × bᵢ)

# 选择度量类型
index_params = {
    "metric_type": "IP",  # 或 "L2"
    "index_type": "HNSW",
    "params": {"M": 16, "efConstruction": 200}
}
```

## 应用场景

### 语义搜索

```python
# 语义搜索示例：NLP 应用
def semantic_search(query_text, collection_name):
    # 1. 将查询文本转换为向量
    query_vector = embed_model.encode([query_text])
    
    # 2. 在 Milvus 中搜索
    search_params = {"metric_type": "IP", "params": {"ef": 100}}
    
    results = collection.search(
        data=[query_vector],
        anns_field="text_vector",
        param=search_params,
        limit=10
    )
    
    return results
```

### 图像检索

```python
# 图像检索示例
def image_search(query_image_path):
    # 1. 提取图像特征向量
    image_vector = image_model.extract_features(query_image_path)
    
    # 2. 搜索相似图像
    results = collection.search(
        data=[image_vector],
        anns_field="image_vector",
        param={"metric_type": "L2", "params": {}},
        limit=20
    )
    
    return results
```

### 推荐系统

```python
# 推荐系统应用
def recommend_items(user_vector, n=10):
    # 基于用户向量查找相似商品
    results = collection.search(
        data=[user_vector],
        anns_field="item_vector",
        param={"metric_type": "IP", "params": {"ef": 128}},
        limit=n
    )
    
    return [item.id for item in results[0]]
```

## 快速开始

### Python SDK 基本使用

```python
from pymilvus import connections, Collection, CollectionSchema, FieldSchema, DataType

# 1. 连接 Milvus
connections.connect(host='localhost', port='19530', alias='default')

# 2. 定义集合 schema
fields = [
    FieldSchema(name="id", dtype=DataType.INT64, is_primary=True),
    FieldSchema(name="vector", dtype=DataType.FLOAT_VECTOR, dim=128)
]

schema = CollectionSchema(fields=fields, description="示例集合")

# 3. 创建集合
collection = Collection("demo_collection", schema=schema)

# 4. 插入数据
import numpy as np

vectors = np.random.rand(1000, 128).astype(np.float32)
ids = list(range(1000))

collection.insert([ids, vectors])

# 5. 创建索引
index_params = {
    "index_type": "IVF_FLAT",
    "metric_type": "L2",
    "params": {"nlist": 128}
}

collection.create_index("vector", index_params)

# 6. 搜索
search_params = {"metric_type": "L2", "params": {"nprobe": 10}}

results = collection.search(
    data=[vectors[0]],
    anns_field="vector",
    param=search_params,
    limit=5
)

print(f"搜索结果: {results}")

# 7. 清理
collection.drop()
connections.disconnect("default")
```

## 与 LLM 集成

### RAG 应用

```python
# RAG (Retrieval-Augmented Generation) 示例
from langchain.embeddings import OpenAIEmbeddings
from pymilvus import Milvus

# 1. 文档向量化
documents = load_documents("path/to/docs")
embeddings = OpenAIEmbeddings()

vectors = embeddings.embed_documents(documents)

# 2. 存入 Milvus
milvus = Milvus()
milvus.insert_vectors("documents", vectors, documents)

# 3. 检索相关文档
query_vector = embeddings.embed_query("如何配置 Milvus")
results = milvus.search("documents", query_vector, top_k=5)

# 4. 生成回答
context = "\n".join(results)
response = llm.generate(f"基于以下上下文回答: {context}\n\n问题: {query}")
```

## 性能优化

### 最佳实践

```python
# 1. 合理选择向量维度
# 128-512 维通常足够，太高增加存储和计算负担

# 2. 选择合适的索引
# 小数据 (<1M): FLAT 或 IVF_FLAT
# 中数据 (1M-10M): IVF 或 HNSW
# 大数据 (>10M): HNSW 或 DiskANN

# 3. 批量插入提高性能
batch_size = 1000
for i in range(0, len(vectors), batch_size):
    batch = vectors[i:i+batch_size]
    collection.insert(batch)

# 4. 预先加载集合
collection.load()

# 5. 使用合适的搜索参数
search_params = {
    "metric_type": "L2",
    "params": {
        "ef": 128,      # HNSW 搜索参数
        "nprobe": 16     # IVF 搜索参数
    }
}
```

## 监控和维护

### 监控指标

```python
# 查看集合统计信息
stats = collection.num_entities
print(f"数据量: {stats}")

# 查看索引信息
index_info = collection.index()
print(f"索引类型: {index_info}")

# 检查健康状态
from pymilvus import utility
is_connected = utility活的_connection("default")
print(f"连接状态: {is_connected}")
```


