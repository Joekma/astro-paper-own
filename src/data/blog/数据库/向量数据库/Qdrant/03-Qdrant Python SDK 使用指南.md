---
title: Qdrant Python SDK 使用指南
series: 'Qdrant'
author: Joekma
pubDatetime: 2026-05-09T00:00:00.000+08:00
modDatetime: 2026-05-09T00:00:00.000+08:00
slug: qdrant-python-sdk
description: '详细介绍Qdrant Python SDK的使用方法，包括Collection操作、向量CRUD、搜索过滤等。'
tags:
  - Qdrant
  - Python
  - 向量数据库
  - SDK
draft: false
language: zh-CN
---

## 概述

Qdrant 提供了功能完整的 Python SDK，支持 Collection 管理、向量操作、搜索查询等功能。本教程将详细介绍 Python SDK 的使用方法。

### 安装

```bash
# 使用 pip
pip install qdrant-client

# 使用 Poetry
poetry add qdrant-client

# 可选依赖
pip install qdrant-client[fastembed]  # 包含向量化模型
```

## 基本操作

### 连接 Qdrant

```python
from qdrant_client import QdrantClient

# 本地连接
client = QdrantClient("localhost", port=6333)

# 远程连接
client = QdrantClient(host="qdrant.example.com", port=6333)

# 带认证连接
client = QdrantClient(
    url="https://qdrant.example.com",
    api_key="your-api-key"
)

# 异步客户端
from qdrant_client import AsyncQdrantClient

async_client = AsyncQdrantClient("localhost", port=6333)
```

### Collection 管理

```python
from qdrant_client.models import VectorParams, Distance, HnswConfigDiff

# 创建 Collection
client.create_collection(
    collection_name="my_collection",
    vectors_config=VectorParams(
        size=768,                    # 向量维度
        distance=Distance.COSINE       # 距离度量
    )
)

# 查看所有 Collection
collections = client.get_collections()
print(collections)

# 查看 Collection 信息
info = client.get_collection("my_collection")
print(f"向量维度: {info.config.params.vector_size}")
print(f"距离类型: {info.config.params.distance}")
print(f"点数: {info.points_count}")

# 删除 Collection
client.delete_collection("my_collection")

# 检查是否存在
exists = client.collection_exists("my_collection")
print(f"存在: {exists}")
```

## 向量操作

### 插入向量

```python
from qdrant_client.models import PointStruct
import numpy as np

# 单个向量
vector = np.random.rand(768).astype(np.float32)

point = PointStruct(
    id=1,
    vector=vector.tolist(),
    payload={
        "name": "文档1",
        "category": "tech",
        "content": "这是文档内容"
    }
)

client.upsert(
    collection_name="my_collection",
    points=[point]
)

# 批量插入
points = []
for i in range(1000):
    vector = np.random.rand(768).astype(np.float32)
    points.append(PointStruct(
        id=i,
        vector=vector.tolist(),
        payload={"id": i}
    ))

client.upsert(
    collection_name="my_collection",
    points=points
)
```

### 查询向量

```python
# ID 查询
results = client.retrieve(
    collection_name="my_collection",
    ids=[1, 2, 3]
)

for result in results:
    print(f"ID: {result.id}")
    print(f"Vector: {result.vector[:5]}...")  # 前5个维度
    print(f"Payload: {result.payload}")

# 获取单个向量
result = client.retrieve(
    collection_name="my_collection",
    ids=[1]
)[0]
```

### 更新向量

```python
# 更新 Payload
client.set_payload(
    collection_name="my_collection",
    payload={"updated_field": "新值"},
    points=[1]
)

# 删除 Payload 字段
client.delete_payload(
    collection_name="my_collection",
    keys=["temporary_field"],
    points=[1]
)
```

### 删除向量

```python
# 删除单个向量
client.delete(
    collection_name="my_collection",
    points=[1]
)

# 批量删除
client.delete(
    collection_name="my_collection",
    points=[1, 2, 3, 4, 5]
)

# 删除所有向量（保留 Collection）
client.delete(
    collection_name="my_collection",
    points_selector=True  # 删除所有
)
```

## 搜索操作

### 基础搜索

```python
import numpy as np

# 准备查询向量
query_vector = np.random.rand(768).astype(np.float32).tolist()

# 最近邻搜索
results = client.search(
    collection_name="my_collection",
    query_vector=query_vector,
    limit=5
)

for result in results:
    print(f"ID: {result.id}")
    print(f"分数: {result.score}")
    print(f"内容: {result.payload}")
```

### 带过滤搜索

```python
from qdrant_client.models import Filter, FieldCondition, MatchValue, Range

# 构建过滤条件
search_filter = Filter(
    must=[
        FieldCondition(
            key="category",
            match=MatchValue(value="electronics")
        ),
        Range(key="price", gte=100)
    ]
)

# 带过滤搜索
results = client.search(
    collection_name="products",
    query_vector=query_vector,
    query_filter=search_filter,
    limit=10
)

# 复合过滤
complex_filter = Filter(
    must=[
        FieldCondition(key="status", match=MatchValue(value="active"))
    ],
    must_not=[
        FieldCondition(key="deleted", match=MatchValue(value=True))
    ]
)
```

### 批量搜索

```python
# 多个查询向量
query_vectors = [
    np.random.rand(768).astype(np.float32).tolist()
    for _ in range(5)
]

results = client.search_batch(
    collection_name="my_collection",
    requests=[
        {"vector": vec, "limit": 5, "params": {"hnsw_ef": 128}}
        for vec in query_vectors
    ]
)
```

## 分页和滚动

### 分页搜索

```python
# 第一页
page1 = client.search(
    collection_name="my_collection",
    query_vector=query_vector,
    limit=10,
    offset=0
)

# 第二页
page2 = client.search(
    collection_name="my_collection",
    query_vector=query_vector,
    limit=10,
    offset=10
)

# 带分数阈值的搜索
filtered_results = client.search(
    collection_name="my_collection",
    query_vector=query_vector,
    query_filter=Filter(
        must=[
            ScoreThreshold(scores_threshold=0.8)
        ]
    )
)
```

### 滚动获取所有结果

```python
all_results = []
offset = 0
batch_size = 100

while True:
    batch = client.search(
        collection_name="my_collection",
        query_vector=query_vector,
        limit=batch_size,
        offset=offset
    )
    
    if not batch:
        break
    
    all_results.extend(batch)
    offset += batch_size
    
    if len(batch) < batch_size:
        break

print(f"共获取 {len(all_results)} 条结果")
```

## 聚合操作

### 分组查询

```python
from qdrant_client.models import QueryGroups

# 按字段分组
groups = client.query_groups(
    collection_name="products",
    query_vector=query_vector,
    group_by="category",
    limit=5,
    group_size=3
)

for group in groups.groups:
    print(f"分组: {group.group_id}")
    print(f"点数: {len(group.hits)}")
    for hit in group.hits:
        print(f"  - {hit.id}: {hit.score}")
```

### 范围查询

```python
# 获取范围内向量
nearby = client.search_nearest_examples(
    collection_name="my_collection",
    positive=[1],  # 正例向量
    negative=[2],   # 负例向量
    limit=10
)
```

## 索引管理

### 创建索引

```python
from qdrant_client.models import PayloadIndexParams, PayloadSchemaType

# 创建 Payload 索引
client.create_payload_index(
    collection_name="my_collection",
    field_name="category",
    field_schema=PayloadSchemaType.KEYWORD
)

# 创建数值索引
client.create_payload_index(
    collection_name="my_collection",
    field_name="price",
    field_schema=PayloadSchemaType.FLOAT
)

# 创建全文索引
client.create_payload_index(
    collection_name="my_collection",
    field_name="content",
    field_schema=PayloadSchemaType.TEXT
)
```

### 重建索引

```python
# 重建 Collection 索引
client.recreate_collection(
    collection_name="my_collection",
    vectors_config=VectorParams(size=768, distance=Distance.COSINE),
    hnsw_config=HnswConfigDiff(m=32, ef_construct=256)
)

# 优化索引
client.optimize(
    collection_name="my_collection",
    optimizer_config=OptimizersConfigDiff(
        index_threshold_kb=1024,
        memmap_threshold_kb=20000,
        hnsw_ef_construct=256
    )
)
```

## LangChain 集成

### 向量存储

```python
from langchain.vectorstores import Qdrant
from langchain.embeddings import OpenAIEmbeddings

# 初始化
embeddings = OpenAIEmbeddings()

vectorstore = Qdrant.from_documents(
    documents=texts,
    embedding=embeddings,
    url="http://localhost:6333",
    collection_name="documents",
    vector_params={"size": 1536, "distance": "Cosine"}
)

# 相似度搜索
docs = vectorstore.similarity_search("query text", k=5)

# 带过滤的搜索
docs = vectorstore.similarity_search_with_score(
    "query",
    k=5,
    filter={"category": "tech"}
)
```

## 错误处理

```python
try:
    client.create_collection(
        collection_name="test",
        vectors_config=VectorParams(size=768, distance=Distance.COSINE)
except Exception as e:
    print(f"错误: {e}")

# 处理冲突
from qdrant_client.models import Distance

try:
    client.create_collection(...)
except ResponseHandlingException:
    # Collection 已存在
    pass
```

## 性能优化

### 批量操作

```python
import numpy as np

def batch_upsert(vectors, payloads, batch_size=1000):
    """批量插入优化"""
    for i in range(0, len(vectors), batch_size):
        batch = [
            PointStruct(
                id=i + j,
                vector=vec.tolist(),
                payload=payload
            )
            for j, (vec, payload) in enumerate(vectors[i:i+batch_size])
        
        client.upsert(
            collection_name="my_collection",
            points=batch,
            wait=True
        )

# 使用
batch_upsert(all_vectors, all_payloads)
```

### 并发操作

```python
from concurrent.futures import ThreadPoolExecutor

def search_batch(queries):
    """并发搜索"""
    with ThreadPoolExecutor(max_workers=4) as executor:
        futures = [
            executor.submit(client.search, "my_collection", vec, 10)
            for vec in queries
        ]
        return [f.result() for f in concurrent.futures.as_completed(futures)]
```

## 完整示例

```python
from qdrant_client import QdrantClient
from qdrant_client.models import (
    VectorParams, Distance, PointStruct, Filter,
    FieldCondition, MatchValue
)
import numpy as np

class QdrantManager:
    def __init__(self, host="localhost", port=6333):
        self.client = QdrantClient(host, port=port)
    
    def setup_collection(self, name, dim):
        """创建 Collection"""
        self.client.recreate_collection(
            collection_name=name,
            vectors_config=VectorParams(size=dim, distance=Distance.COSINE)
        print(f"Created collection: {name}")
    
    def add_documents(self, collection, documents):
        """批量添加文档"""
        points = [
            PointStruct(
                id=i,
                vector=np.random.rand(768).tolist(),
                payload={"content": doc}
            )
            for i, doc in enumerate(documents)
        ]
        
        self.client.upsert(
            collection_name=collection,
            points=points
        )
        print(f"Added {len(documents)} documents")
    
    def search_similar(self, collection, query, top_k=5):
        """搜索相似文档"""
        query_vector = np.random.rand(768).tolist()
        
        return self.client.search(
            collection_name=collection,
            query_vector=query_vector,
            limit=top_k
        )

# 使用
manager = QdrantManager()
manager.setup_collection("docs", 768)
manager.add_documents("docs", ["文档1", "文档2", "文档3"])
results = manager.search_similar("docs", "query")
```


