---
title: RAG 向量检索：嵌入与向量数据库
author: Joekma
pubDatetime: 2026-05-11T00:00:00.000+08:00
modDatetime: 2026-05-11T00:00:00.000+08:00
slug: rag-vector-retrieval
description: '深入讲解RAG系统中的向量检索技术，包括文本嵌入模型、向量数据库选择和相似度检索原理。'
tags:
  - RAG
  - 向量检索
  - Embeddings
  - VectorDB
draft: false
series: RAG
seriesOrder: 7
language: zh-CN
---

## 概述

向量检索是 RAG 系统的核心环节。通过将文本转换为向量表示，我们可以利用向量数据库高效的相似度搜索能力，快速找到与用户查询最相关的文档。本篇将详细介绍嵌入模型、向量数据库和相似度检索的原理与实践。

### 向量检索流程

```
┌─────────────────────────────────────────────────────────────────────┐
│                       向量检索流程                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐        │
│  │  文本   │ →  │  嵌入   │ →  │  存储   │ →  │  检索   │        │
│  │  输入   │    │  模型   │    │  向量库  │    │  相似  │        │
│  └─────────┘    └─────────┘    └─────────┘    └─────────┘        │
│                                                                      │
│  Query: "如何学习Python?"                                           │
│         ↓                                                           │
│  Embedding: [0.123, -0.456, 0.789, ...]                            │
│         ↓                                                           │
│  Top-K 相似文档检索                                                  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## 文本嵌入模型

### 什么是文本嵌入？

文本嵌入（Text Embedding）是将文本转换为密集向量的技术，使语义相似的文本在向量空间中彼此接近。

| 嵌入类型 | 示例 | 维度 |
|---------|------|------|
| **词嵌入** | Word2Vec, GloVe | 100-300 |
| **句嵌入** | Sentence-BERT | 384-1536 |
| **文档嵌入** | Doc2Vec | 100-500 |

### OpenAI 嵌入模型

```python
from langchain_openai import OpenAIEmbeddings

embeddings = OpenAIEmbeddings(
    model="text-embedding-3-small",
    api_key="your-api-key"
)

text = "这是一个测试文本"
vector = embeddings.embed_query(text)

print(f"向量维度: {len(vector)}")
print(f"向量示例: {vector[:5]}")
```

### 批量嵌入

```python
texts = [
    "Python 是一种高级编程语言",
    "机器学习是人工智能的分支",
    "深度学习是机器学习的子领域"
]

vectors = embeddings.embed_documents(texts)

for i, vec in enumerate(vectors):
    print(f"文本 {i+1} 向量: {vec[:5]}...")
```

### HuggingFace 嵌入模型

```python
from langchain_community.embeddings import HuggingFaceEmbeddings

model_name = "sentence-transformers/all-MiniLM-L6-v2"

embeddings = HuggingFaceEmbeddings(
    model_name=model_name,
    model_kwargs={"device": "cpu"},
    encode_kwargs={"normalize_embeddings": True}
)

text = "这是一个测试文本"
vector = embeddings.embed_query(text)

print(f"向量维度: {len(vector)}")
```

### Embedding 模型对比

| 模型 | 维度 | 特点 | 适用场景 |
|------|------|------|---------|
| **text-embedding-3-small** | 1536 | 高效、便宜 | 通用场景 |
| **text-embedding-3-large** | 3072 | 最高质量 | 精确匹配 |
| **text-embedding-ada-002** | 1536 | 经典稳定 | 兼容性好 |
| **all-MiniLM-L6-v2** | 384 | 本地运行 | 本地部署 |
| **all-mpnet-base-v2** | 768 | 高质量 | 本地高质量 |

### 嵌入质量评估

```python
def evaluate_embeddings(query, relevant_docs, irrelevant_docs, embeddings_model):
    query_vec = embeddings_model.embed_query(query)

    relevant_scores = [
        cosine_similarity(query_vec, embeddings_model.embed_query(doc))
        for doc in relevant_docs
    ]

    irrelevant_scores = [
        cosine_similarity(query_vec, embeddings_model.embed_query(doc))
        for doc in irrelevant_docs
    ]

    avg_relevant = sum(relevant_scores) / len(relevant_scores)
    avg_irrelevant = sum(irrelevant_scores) / len(irrelevant_scores)

    print(f"相关文档平均相似度: {avg_relevant:.4f}")
    print(f"不相关文档平均相似度: {avg_irrelevant:.4f}")
    print(f"分离度: {avg_relevant - avg_irrelevant:.4f}")

    return avg_relevant - avg_irrelevant

def cosine_similarity(vec1, vec2):
    import numpy as np
    vec1 = np.array(vec1)
    vec2 = np.array(vec2)
    return np.dot(vec1, vec2) / (np.linalg.norm(vec1) * np.linalg.norm(vec2))
```

## 向量数据库

### 向量数据库选择

| 数据库 | 类型 | 特点 | 适用场景 |
|--------|------|------|---------|
| **Chroma** | 本地 | 轻量、易用 | 开发测试 |
| **FAISS** | 本地 | 高性能 | 大规模本地 |
| **Pinecone** | 云端 | 托管、易扩展 | 生产环境 |
| **Weaviate** | 云端/本地 | 混合搜索 | 多模态 |
| **Milvus** | 云端/本地 | 高并发 | 企业级 |
| **Qdrant** | 云端/本地 | 高性能 | 生产环境 |

### Chroma 向量数据库

#### 创建向量数据库

```python
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import TextLoader

loader = TextLoader("document.txt")
documents = loader.load()

splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
chunks = splitter.split_documents(documents)

embeddings = OpenAIEmbeddings(model="text-embedding-3-small")

vectorstore = Chroma.from_documents(
    documents=chunks,
    embedding=embeddings,
    persist_directory="./chroma_db"
)

vectorstore.persist()
```

#### 相似度检索

```python
query = "用户查询内容"

results = vectorstore.similarity_search(query, k=5)

for i, doc in enumerate(results):
    print(f"结果 {i+1}: {doc.page_content[:100]}...")
```

#### 带相似度分数的检索

```python
results_with_scores = vectorstore.similarity_search_with_score(query, k=5)

for doc, score in results_with_scores:
    print(f"分数: {score:.4f} | 内容: {doc.page_content[:100]}...")

    distance = score
    similarity = 1 - distance / 2
    print(f"相似度: {similarity:.2%}")
```

#### 元数据过滤检索

```python
results = vectorstore.similarity_search(
    query,
    k=5,
    filter={"category": "技术文档", "source": "python.md"}
)

print(f"过滤后找到 {len(results)} 个结果")
```

### FAISS 向量数据库

Facebook 的高效相似度搜索库：

```python
from langchain_community.vectorstores import FAISS
from langchain_openai import OpenAIEmbeddings

embeddings = OpenAIEmbeddings()

vectorstore = FAISS.from_documents(
    documents=chunks,
    embedding=embeddings
)

vectorstore.save_local("faiss_index")

new_vectorstore = FAISS.load_local(
    "faiss_index",
    embeddings
)
```

#### 增量添加

```python
new_doc = Document(page_content="新文档内容", metadata={"source": "new.txt"})

vectorstore.add_documents([new_doc])

vectorstore.save_local("faiss_index_updated")
```

### Pinecone 云端向量数据库

```python
from langchain_pinecone import PineconeVectorStore
from langchain_openai import OpenAIEmbeddings
from pinecone import Pinecone

pc = Pinecone(api_key="your-api-key")
index = pc.Index("rag-index")

embeddings = OpenAIEmbeddings()

vectorstore = PineconeVectorStore(
    index=index,
    embedding=embeddings,
    text_key="text"
)

vectorstore.add_documents(chunks)

results = vectorstore.similarity_search(query="查询内容", k=5)
```

### Weaviate 向量数据库

```python
import weaviate

client = weaviate.Client(url="http://localhost:8080")

vectorstore = Weaviate(
    client=client,
    index_name="Document",
    text_key="text",
    embedding=embeddings,
    attributes=["source", "category"]
)

vectorstore.add_documents(chunks)

results = vectorstore.similarity_search(query="查询", k=5)
```

## 相似度计算

### 1. 余弦相似度

最常用的相似度度量：

```python
import numpy as np

def cosine_similarity(vec1, vec2):
    vec1 = np.array(vec1)
    vec2 = np.array(vec2)

    dot_product = np.dot(vec1, vec2)
    norm_product = np.linalg.norm(vec1) * np.linalg.norm(vec2)

    if norm_product == 0:
        return 0

    return dot_product / norm_product

similarity = cosine_similarity(vector_a, vector_b)
print(f"余弦相似度: {similarity:.4f}")
```

### 2. 点积（内积）

快速计算，适合归一化向量：

```python
import numpy as np

def dot_product_similarity(vec1, vec2):
    vec1 = np.array(vec1)
    vec2 = np.array(vec2)

    return np.dot(vec1, vec2)

similarity = dot_product_similarity(vector_a, vector_b)
```

### 3. 欧氏距离

计算向量间的直线距离：

```python
import numpy as np

def euclidean_distance(vec1, vec2):
    vec1 = np.array(vec1)
    vec2 = np.array(vec2)

    distance = np.linalg.norm(vec1 - vec2)
    similarity = 1 / (1 + distance)

    return distance, similarity

distance, similarity = euclidean_distance(vector_a, vector_b)
print(f"欧氏距离: {distance:.4f}, 相似度: {similarity:.4f}")
```

### 相似度计算对比

| 方法 | 公式 | 范围 | 适用场景 |
|------|------|------|---------|
| **余弦相似度** | cos(θ) | [-1, 1] | 方向重要性 |
| **点积** | A·B | [-∞, ∞] | 归一化向量 |
| **欧氏距离** | \|\|A-B\|\| | [0, ∞] | 绝对距离 |

## 索引类型

### 1. 扁平索引（Flat）

最简单，逐个比较：

```python
vectorstore = Chroma(
    collection_name="flat_index",
    embedding_function=embeddings
)
```

### 2. IVF 索引（Inverted File）

聚类加速搜索：

```python
from langchain_community.vectorstores import FAISS

vectorstore = FAISS.from_documents(
    documents=chunks,
    embedding=embeddings,
    index_params={
        "nlist": 100,
        "metric_type": 1
    }
)
```

### 3. HNSW 索引（层次可导航小世界图）

高效的近似最近邻：

```python
from langchain_pinecone import PineconeVectorStore

vectorstore = PineconeVectorStore(
    index=index,
    embedding=embeddings,
    index_params={
        "name": "hnsw",
        "parameters": {
            "ef_construction": 200,
            "m": 16
        }
    }
)
```

### 索引参数对比

| 参数 | 说明 | 建议值 |
|------|------|--------|
| **ef_construction** | HNSW 构建参数 | 100-200 |
| **m** | HNSW 连接数 | 16-64 |
| **nlist** | IVF 聚类数 | 4×√n |
| **ef_search** | 搜索范围 | 50-200 |

## 高级检索模式

### 1. 最大边际相关检索 (MMR)

平衡相关性和多样性：

```python
retriever = vectorstore.as_retriever(
    search_type="mmr",
    search_kwargs={
        "k": 10,
        "fetch_k": 20,
        "lambda_mult": 0.5
    }
)

results = retriever.invoke("查询内容")

print(f"检索到 {len(results)} 个结果")
```

### 2. 带分数阈值的检索

过滤低质量结果：

```python
def threshold_search(query, vectorstore, threshold=0.7):
    results = vectorstore.similarity_search_with_score(query, k=20)

    filtered = [
        (doc, score) for doc, score in results
        if score < threshold
    ]

    return filtered

results = threshold_search("查询", vectorstore, threshold=0.7)
```

### 3. 混合检索

结合关键词和向量检索：

```python
from langchain.retrievers import EnsembleRetriever

vector_retriever = vectorstore.as_retriever(
    search_kwargs={"k": 5}
)

keyword_retriever = vectorstore.as_retriever(
    search_type="mmr",
    search_kwargs={"k": 5}
)

ensemble_retriever = EnsembleRetriever(
    retrievers=[vector_retriever, keyword_retriever],
    weights=[0.7, 0.3]
)

results = ensemble_retriever.invoke("查询内容")
```

## 持久化与加载

### 向量数据库持久化

```python
vectorstore = Chroma.from_documents(
    documents=chunks,
    embedding=embeddings,
    persist_directory="./vector_db"
)

vectorstore.persist()

print("向量数据库已保存")
```

### 加载已有向量数据库

```python
vectorstore = Chroma(
    persist_directory="./vector_db",
    embedding_function=embeddings
)

results = vectorstore.similarity_search("查询", k=5)

print(f"从已存储的数据库检索到 {len(results)} 个结果")
```

### 跨环境迁移

```python
import json

def export_vectorstore(vectorstore, metadata_path="metadata.json"):
    vectors = []
    metadatas = []
    ids = []

    for doc in vectorstore.get()["documents"]:
        doc_id = doc.metadata.get("id", str(hash(doc.page_content)))
        ids.append(doc_id)
        vectors.append(vectorstore.get_vector(doc_id))
        metadatas.append(doc.metadata)

    with open(metadata_path, "w") as f:
        json.dump({
            "ids": ids,
            "metadatas": metadatas
        }, f)

    return vectors, ids

vectors, ids = export_vectorstore(vectorstore)
print(f"导出了 {len(vectors)} 个向量")
```

## 最佳实践

### 1. 向量维度选择

| 模型 | 维度 | 质量 | 速度 |
|------|------|------|------|
| **text-embedding-3-small** | 1536 | 中 | 快 |
| **text-embedding-3-large** | 3072 | 高 | 中 |
| **all-MiniLM-L6-v2** | 384 | 中 | 快 |
| **all-mpnet-base-v2** | 768 | 高 | 中 |

### 2. 批量处理优化

```python
batch_size = 100

for i in range(0, len(documents), batch_size):
    batch = documents[i:i+batch_size]

    vectorstore.add_documents(batch)

    print(f"处理进度: {min(i+batch_size, len(documents))}/{len(documents)}")
```

### 3. 向量数据库选择指南

```
数据量
  │
  ├─ < 10,000
  │   └─ Chroma / FAISS (本地足够)
  │
  ├─ 10,000 - 1,000,000
  │   ├─ FAISS (高性能本地)
  │   └─ Pinecone / Qdrant (云端)
  │
  └─ > 1,000,000
      └─ Pinecone / Milvus (企业级云端)
```

## 总结

| 组件 | 功能 | 关键技术 |
|------|------|---------|
| **Embedding** | 文本转向量 | OpenAI, HuggingFace |
| **VectorDB** | 向量存储检索 | Chroma, FAISS, Pinecone |
| **Similarity** | 相似度计算 | Cosine, Dot Product |
| **Retrieval** | 智能检索 | MMR, Filtering |

向量检索是 RAG 系统的核心，选择合适的嵌入模型和向量数据库对系统性能至关重要。

## 后续内容

本系列后续将深入讲解：
- 高级检索策略
- RAG 实战应用
- 性能优化技巧
- 多模态 RAG
