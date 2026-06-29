---
title: LlamaIndex 数据连接与索引构建
author: Joekma
pubDatetime: 2026-05-07T00:00:00.000+08:00
modDatetime: 2026-05-07T00:00:00.000+08:00
slug: llamaindex-data-connectors
description: "深入讲解LlamaIndex数据连接器与索引构建，包括多种Reader、节点解析策略和索引类型。"
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

这篇文章可以按一条流水线理解：先把原始资料加载成文档，再清理和补充元数据，接着切分成节点，最后把节点组织成索引。每一步都会影响后续检索质量。

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

这一节解决“资料怎么进入 LlamaIndex”的问题。无论来源是本地文件、Notion 还是网页，最终目标都是得到一组结构一致的文档。

### 本地文件加载

本地目录是最容易验证的入口。`required_exts` 用来限制文件类型，`recursive=True` 用来递归扫描子目录。

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

文件类型越复杂，对依赖和解析质量的要求越高。入门阶段建议先用 txt、md 或少量 PDF 验证流程，再接入更多格式。

| 类型      | 说明      | 依赖                          |
| --------- | --------- | ----------------------------- |
| **.txt**  | 纯文本    | 无                            |
| **.md**   | Markdown  | 无                            |
| **.pdf**  | PDF 文档  | pypdf/llama-index-readers-pdf |
| **.docx** | Word 文档 | llama-index-readers-docx      |
| **.csv**  | CSV 文件  | pandas                        |
| **.json** | JSON 文件 | 无                            |

### Notion 加载

Notion 适合把团队知识库接入问答系统。示例中的 token 和 page_id 需要从 Notion 集成配置中获取。

```python
from llama_index.readers.notion import NotionReader

notion_reader = NotionReader(
    integration_token="your-integration-token"
)

documents = notion_reader.load_data(
    page_ids=["page_id_1", "page_id_2"]
)
```

### Web 加载

网页加载适合抓取公开页面内容。生产场景需要额外考虑网页更新频率、正文抽取质量和版权边界。

```python
from llama_index.readers.web import SimpleWebPageReader

web_reader = SimpleWebPageReader()

documents = web_reader.load_data(
    urls=["https://example.com/article"]
)
```

## 文档处理

这一节处理“资料加载进来后怎么补充上下文”。元数据越清晰，后续过滤、追踪来源和分组检索就越容易。

### 文档元数据

元数据应该保存稳定、可解释的信息，例如来源、分类、版本和创建时间。不要把敏感信息直接写进元数据。

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

如果目录天然按业务分类组织，可以在加载时把分类写入元数据。后续查询时就能按 `category` 做过滤或路由。

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

这一节决定文档如何变成检索单元。节点切分不是越细越好，关键是让每个节点既包含足够上下文，又不会混入太多无关内容。

### 基础解析器

通用文本可以先用 `SentenceSplitter`。它会尽量按句子边界切分，比简单按固定字符数截断更自然。

```python
from llama_index.core.node_parser import SentenceSplitter

parser = SentenceSplitter(chunk_size=512, chunk_overlap=64)

nodes = parser.get_nodes_from_documents(documents)
```

### 句子分割

`chunk_size` 控制节点大小，`chunk_overlap` 控制相邻节点的重叠范围。重叠可以减少上下文断裂，但也会增加索引体积。

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

Token 分割适合对模型上下文窗口更敏感的场景，例如需要严格控制每个节点进入模型的 token 数。

```python
from llama_index.core.node_parser import TokenTextSplitter

parser = TokenTextSplitter(
    chunk_size=1024,
    chunk_overlap=128
)

nodes = parser.get_nodes_from_documents(documents)
```

### Markdown 解析

Markdown 文档通常有标题层级，用专门的解析器可以更好保留章节结构。

```python
from llama_index.core.node_parser import MarkdownNodeParser

parser = MarkdownNodeParser()

nodes = parser.get_nodes_from_documents(documents)
```

### 自定义节点关系

需要表达章节顺序、父子关系或来源路径时，优先用元数据保存清晰字段。这样后续过滤和调试都更直观。

```python
nodes = parser.get_nodes_from_documents(documents)

for i, node in enumerate(nodes):
    node.metadata["section_order"] = i
    if i > 0:
        node.metadata["previous_node_id"] = nodes[i - 1].node_id
```

## 索引类型

这一节说明节点如何被组织起来。索引选择取决于查询方式：语义问答优先向量索引，整体归纳可以考虑摘要索引。

### VectorStoreIndex

最常用的向量索引用于语义检索。只要问题和原文表达不完全一致，向量索引通常比关键词匹配更稳。

```python
from llama_index.core import VectorStoreIndex

index = VectorStoreIndex.from_documents(
    documents,
    show_progress=True
)
```

### 详细配置

如果希望统一模型和切分策略，可以通过 `Settings` 设置全局默认值。后续构建索引时会自动使用这些配置。

```python
from llama_index.core import Settings, VectorStoreIndex
from llama_index.core.node_parser import SentenceSplitter
from llama_index.llms.openai import OpenAI
from llama_index.embeddings.openai import OpenAIEmbedding

Settings.llm = OpenAI(model="gpt-4o-mini")
Settings.embed_model = OpenAIEmbedding(model="text-embedding-3-small")
Settings.text_splitter = SentenceSplitter(chunk_size=512, chunk_overlap=64)

index = VectorStoreIndex.from_documents(
    documents,
    show_progress=True
)
```

### SummaryIndex

摘要索引适合把多个文档作为整体进行归纳，不适合用来替代向量索引做细粒度事实检索。

```python
from llama_index.core import SummaryIndex

index = SummaryIndex.from_documents(documents)
```

### KeywordTableIndex

关键词索引适合术语、编号、产品名等明确词面匹配的场景。它可以作为向量检索的补充，但不建议作为通用问答的唯一索引。

```python
from llama_index.core import KeywordTableIndex

index = KeywordTableIndex.from_documents(
    documents,
    max_keywords_per_chunk=10
)
```

### DocumentSummaryIndex

文档摘要索引会先为文档生成摘要，再基于摘要辅助检索，适合长文档集合或每篇文档主题较清晰的场景。

```python
from llama_index.core import DocumentSummaryIndex

index = DocumentSummaryIndex.from_documents(
    documents
)
```

## 存储和加载

这一节解决“索引是否需要每次重建”的问题。开发时可以反复重建，资料稳定后应把索引持久化，减少启动成本。

### 本地存储

构建完成后调用 `persist()` 保存索引相关数据。下次启动时可以直接加载，避免重复嵌入同一批文档。

```python
from llama_index.core import VectorStoreIndex

index = VectorStoreIndex.from_documents(documents)
index.storage_context.persist(persist_dir="./storage")
```

### 加载索引

加载索引时需要指向同一个持久化目录。模型配置可以继续由 `Settings` 提供。

```python
from llama_index.core import StorageContext, load_index_from_storage

storage_context = StorageContext.from_defaults(
    persist_dir="./storage"
)

index = load_index_from_storage(
    storage_context=storage_context
)
```

### 自定义存储

当数据量变大或需要向量库能力时，可以接入外部向量存储。下面示例使用 Chroma 保存向量数据。

```python
from llama_index.core import StorageContext
from llama_index.vector_stores.chroma import ChromaVectorStore
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

这一节补充两个常见扩展点：替换嵌入模型，以及按租户或业务线隔离索引。它们通常出现在项目从原型进入实际使用之后。

### 自定义嵌入模型

如果资料主要是中文、行业术语或内网文本，可以对比不同嵌入模型的召回效果，再决定是否替换默认模型。

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

多租户场景不要只依赖目录隔离，建议把租户 ID 写入文档元数据，后续查询时再配合过滤条件使用。

```python
from llama_index.core import VectorStoreIndex

def create_tenant_index(tenant_id: str, documents):
    for doc in documents:
        doc.metadata["tenant_id"] = tenant_id

    index = VectorStoreIndex.from_documents(
        documents
    )
    return index
```

## 最佳实践

这一节把数据入口和索引构建的选择收束成几条经验。优化顺序建议是：先保证资料干净，再调整切分，最后再更换索引或向量库。

| 实践                      | 说明                            |
| ------------------------- | ------------------------------- |
| **选择合适的 chunk_size** | 短文本 256-512，长文本 512-1024 |
| **保持适当 overlap**      | 10-20% 有助于上下文连续性       |
| **清理元数据**            | 删除敏感信息                    |
| **批量处理**              | 使用 show_progress 跟踪进度     |

## 总结

这一节回顾本篇的主线：数据连接器负责把资料变成文档，节点解析器负责把文档切成检索单元，索引负责组织这些节点。

| 组件               | 功能                 |
| ------------------ | -------------------- |
| **Readers**        | 从各种数据源加载文档 |
| **NodeParser**     | 将文档分割成节点     |
| **Index**          | 组织和索引节点       |
| **StorageContext** | 管理持久化存储       |

容易混淆的是，加载器只负责读入资料，解析器才决定检索粒度，索引则决定后续如何查找节点。把这三层分清楚，调试 RAG 效果时就能更快定位问题。
