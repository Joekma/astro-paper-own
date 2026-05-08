---
title: LlamaIndex 数据连接与索引构建
author: Joekma
pubDatetime: 2026-05-08T00:00:00.000+08:00
modDatetime: 2026-05-08T00:00:00.000+08:00
slug: llamaindex-data-connectors
description: '深入探讨LlamaIndex的数据连接器使用、文档处理、节点分割和多种索引类型的构建方法。'
tags:
  - LlamaIndex
  - LLM
  - AI
  - Data Connectors
  - Indexing
draft: false
language: zh-CN
---

## 概述

数据是 RAG 系统的核心。LlamaIndex 提供了强大的数据连接器生态，可以从各种数据源加载数据，并将其转换为可索引的格式。本文将深入探讨 LlamaIndex 的数据连接器、文档处理、节点分割以及各种索引类型的构建方法。

## 数据连接器详解

### 内置数据连接器

LlamaIndex 提供了 100+ 预置的数据连接器，覆盖各类数据源：

```python
# 文件系统连接器
from llama_index.core import SimpleDirectoryReader

# API 连接器
from llama_index.core.readers import (
    GitHubReader,          # GitHub
    DiscordReader,         # Discord
    SlackReader,           # Slack
    TwitterReader,         # Twitter
    NotionReader,          # Notion
)

# 数据库连接器
from llama_index.core import SQLDatabase

# 云存储连接器
from llama_index.core.readers import (
    S3Reader,              # AWS S3
    GCSReader,             # Google Cloud Storage
    AzureBlobReader,       # Azure Blob
)

# 文档格式连接器
from llama_index.core.readers import (
    PDFReader,             # PDF
    DocxReader,            # Word
    PptxReader,            # PowerPoint
    MarkdownReader,        # Markdown
)
```

### 文件连接器

#### PDF 文件

```python
from llama_index.core.readers import PDFReader

# 加载 PDF
reader = PDFReader()
documents = reader.load_data(file="./document.pdf")

# 提取特定页面
documents = reader.load_data(file="./document.pdf", pages=[1, 2, 3])

# 提取并包含元数据
documents = reader.load_data(
    file="./document.pdf",
    extra_info={"source": "user_manual"}
)

# 使用 PDF 解析器（更高精度）
from llama_index.core.readers import PagedPDFReader
from llama_index.core.node_parser import IlliberalNodeParser

parser = IlliberalNodeParser.from_defaults()
reader = PagedPDFReader(parser=parser)
documents = reader.load_data(file="./document.pdf")
```

#### Word 文档

```python
from llama_index.core.readers import DocxReader

reader = DocxReader()
documents = reader.load_data(file="./document.docx")

# 处理多个 Word 文档
reader = DocxReader()
docs = []
for doc_path in ["./doc1.docx", "./doc2.docx"]:
    docs.extend(reader.load_data(file=doc_path))
```

#### Markdown 文件

```python
from llama_index.core.readers import MarkdownReader

reader = MarkdownReader()
documents = reader.load_data(file="./readme.md")

# 提取标题作为元数据
reader = MarkdownReader(
    remove_lines_containing=["#", "##", "```"]
)
documents = reader.load_data(file="./readme.md")
```

#### HTML 文件

```python
from llama_index.core.readers import HTMLReader

reader = HTMLReader()
documents = reader.load_data(file="./page.html")

# 提取特定元素
reader = HTMLReader(
    tags=["article", "main", "section"]
)
documents = reader.load_data(file="./page.html")
```

### API 连接器

#### GitHub 连接器

```python
from llama_index.core.readers import GitHubReader

github_reader = GitHubReader(
    github_token="your-github-token",
    owner="owner-name",
    repo="repo-name",
    use_rich_text_output=True
)

# 加载仓库文件
documents = github_reader.load_data(branch="main")

# 加载特定路径
documents = github_reader.load_data(
    branch="main",
    filepath="README.md"
)

# 加载 issues 或 PR
from llama_index.core.readers.github_api import GitHubIssuesAPIReader

issues_reader = GitHubIssuesAPIReader(
    github_token="your-github-token"
)

issues = issues_reader.load_data(
    owner="owner-name",
    repo="repo-name",
    state="all",
    num_comments_threshold=0
)
```

#### Slack 连接器

```python
from llama_index.core.readers import SlackReader

slack_reader = SlackReader(
    slack_token="xoxb-your-token",
    team_id="T1234567890"
)

# 加载频道消息
documents = slack_reader.load_data(
    channel_ids=["C1234567890"]
)

# 带日期过滤
documents = slack_reader.load_data(
    channel_ids=["C1234567890"],
    start_date="2026-01-01",
    end_date="2026-12-31"
)
```

#### Notion 连接器

```python
from llama_index.core.readers import NotionPageReader

notion_reader = NotionPageReader(
    integration_token="secret_xxx"
)

# 加载页面
page_ids = ["page-id-1", "page-id-2"]
documents = notion_reader.load_data(page_ids=page_ids)

# 加载数据库
database_ids = ["database-id-1"]
documents = notion_reader.load_data(database_ids=database_ids)
```

### 数据库连接器

#### SQL 数据库

```python
from llama_index.core import SQLDatabase
from sqlalchemy import create_engine

# 创建数据库引擎
engine = create_engine("postgresql://user:pass@localhost/dbname")

# 创建 SQL 数据库连接器
sql_database = SQLDatabase(engine)

# 加载表数据
documents = sql_database.load_data(
    table_names=["users", "products"]
)

# 自定义查询
documents = sql_database.load_data(
    table_names=["users"],
    sql_query="SELECT id, name, email FROM users WHERE active = true"
)

# 获取表结构信息
table_schema = sql_database.get_table_schema("users")
print(f"表名: {table_schema['table_name']}")
print(f"列: {table_schema['columns']}")
```

#### 知识图谱数据库

```python
from llama_index.core import KnowledgeGraphIndex
from llama_index.graph_stores.nebula import NebulaGraphStore

# NebulaGraph 连接
graph_store = NebulaGraphStore(
    space="knowledge_graph",
    host="localhost",
    port=9669,
    username="root",
    password="password"
)
```

### 云存储连接器

#### AWS S3

```python
from llama_index.core.readers import S3Reader

s3_reader = S3Reader(
    bucket="my-bucket",
    key="path/to/folder",
    aws_access_id="AKIA...",
    aws_access_secret="secret",
    region_name="us-east-1"
)

# 加载整个前缀
documents = s3_reader.load_data()

# 加载特定文件
documents = s3_reader.load_data(key="path/to/file.pdf")
```

## 文档处理

### 文档属性

```python
from llama_index.core import Document

# 创建带完整元数据的文档
doc = Document(
    text="这是文档的主要内容",
    metadata={
        "file_name": "example.pdf",
        "file_path": "/path/to/example.pdf",
        "file_size": 1024000,
        "creation_date": "2026-01-15",
        "last_modified_date": "2026-02-20",
        "author": "John Doe",
        "category": "技术文档",
        "tags": ["AI", "机器学习"]
    },
    doc_id="unique-doc-id-123",
    relationships={
        "source": RelationshipType.SOURCE,
        "1": RelationshipType.PARENT  # 父文档关系
    },
    excluded_llm_metadata_keys=["file_size"],
    excluded_embed_keys=["file_path"]
)

# 访问属性
print(doc.text)  # 文本内容
print(doc.metadata)  # 元数据字典
print(doc.doc_id)  # 文档 ID
```

### 文档转换

```python
from llama_index.core import Document

# 从原始文本创建文档
raw_text = """
# 标题
这是正文内容。

## 子标题
更多内容。
"""

# 方式 1：直接创建
doc = Document(text=raw_text)

# 方式 2：批量创建
texts = ["文本1", "文本2", "文本3"]
docs = [Document(text=t) for t in texts]

# 方式 3：从结构化数据创建
structured_data = [
    {"title": "文章1", "content": "内容1", "date": "2026-01-01"},
    {"title": "文章2", "content": "内容2", "date": "2026-01-02"}
]

docs = [
    Document(
        text=f"{item['title']}: {item['content']}",
        metadata={"date": item['date']}
    )
    for item in structured_data
]
```

## 节点分割

### 节点解析器

```python
from llama_index.core.node_parser import (
    SimpleNodeParser,
    SentenceSplitter,
    SentenceWindowNodeParser,
    TokenTextSplitter,
    CodeSplitter
)

# 基础文本分割
parser = SimpleNodeParser.from_defaults(
    chunk_size=1024,
    chunk_overlap=200,
    separator=" "
)

nodes = parser.get_nodes_from_documents(documents)
```

### 句子级别分割

```python
from llama_index.core.node_parser import SentenceSplitter

parser = SentenceSplitter(
    chunk_size=256,  # 每个块约 256 字符
    chunk_overlap=50,  # 50 字符重叠
    paragraph_separator="\n\n",
    sentence_separator=". ",
    secondary_chunking_regex="[^,.;。]+[,.;。]",
    language="chinese"  # 中文支持
)

nodes = parser.get_nodes_from_documents(documents)

# 查看节点
for node in nodes[:5]:
    print(f"文本长度: {len(node.text)}")
    print(f"文本: {node.text[:100]}...")
    print("---")
```

### Token 级别分割

```python
from llama_index.core.node_parser import TokenTextSplitter

parser = TokenTextSplitter(
    chunk_size=512,  # 512 tokens
    chunk_overlap=64,  # 64 tokens 重叠
    separator=" ",
    backup_separators=["\n", "。", "！", "？"]
)

nodes = parser.get_nodes_from_documents(documents)
```

### 代码分割

```python
from llama_index.core.node_parser import CodeSplitter

parser = CodeSplitter(
    language="python",
    chunk_lines=40,  # 每块 40 行
    overlap=5,  # 5 行重叠
    max_chars=1500  # 最大字符数
)

nodes = parser.get_nodes_from_documents(documents)

# 支持多种语言
languages = ["python", "javascript", "typescript", "java", "go", "rust"]
```

### 语义分割

```python
from llama_index.core.node_parser import SemanticSplitterNodeParser
from llama_index.embeddings.openai import OpenAIEmbedding

embed_model = OpenAIEmbedding(model="text-embedding-3-small")

parser = SemanticSplitterNodeParser(
    embed_model=embed_model,
    buffer_size=1,  # 句子缓冲大小
    breakpoint_threshold_amount=0.5,  # 断点阈值
    breakpoint_threshold_type="percentile"
)

nodes = parser.get_nodes_from_documents(documents)
```

### 句子窗口分割

```python
from llama_index.core.node_parser import SentenceWindowNodeParser

# 创建句子窗口节点（用于句子窗口检索）
parser = SentenceWindowNodeParser(
    window_size=3,  # 周围句子数
    window_metadata_key="window",
    original_text_metadata_key="original_text"
)

nodes = parser.get_nodes_from_documents(documents)

# 窗口节点包含周围上下文
for node in nodes:
    if "window" in node.metadata:
        print(f"原始文本: {node.text}")
        print(f"窗口上下文: {node.metadata['window']}")
```

## 索引构建

### Vector Store Index

```python
from llama_index.core import VectorStoreIndex

# 基础构建
index = VectorStoreIndex.from_documents(documents)

# 自定义配置
index = VectorStoreIndex.from_documents(
    documents,
    service_context=service_context,
    storage_context=storage_context,
    show_progress=True  # 显示进度条
)

# 从节点构建
index = VectorStoreIndex.from_nodes(
    nodes,
    embed_model=embed_model,
    vector_store_config={
        "similarity_top_k": 5
    }
)

# 从已有向量存储构建
index = VectorStoreIndex.from_vector_store(
    vector_store=vector_store,
    embed_model=embed_model
)
```

### 多种索引类型

#### Summary Index

```python
from llama_index.core import SummaryIndex

# 创建总结索引
index = SummaryIndex.from_documents(documents)

# 适合快速浏览所有文档
query_engine = index.as_query_engine(
    response_mode="tree_summarize"
)
```

#### Keyword Table Index

```python
from llama_index.core import KeywordTableIndex

# 关键词表索引
index = KeywordTableIndex.from_documents(documents)

# 适合关键词精确匹配
query_engine = index.as_query_engine(
    keyword_filter=["AI", "机器学习"]
)
```

#### Tree Index

```python
from llama_index.core import TreeIndex

# 树形索引
index = TreeIndex.from_documents(documents)

# 适合层次化总结
query_engine = index.as_query_engine(
    response_mode="tree_summarize",
    child_branch_factor=2
)
```

#### Graph Index

```python
from llama_index.core import KnowledgeGraphIndex

# 知识图谱索引
index = KnowledgeGraphIndex.from_documents(
    documents,
    max_triplets_per_chunk=10,
    storage_context=storage_context
)

# 知识图谱查询
query_engine = index.as_query_engine(
    include_raw=True,
    embedding_mode="hybrid"
)
```

### 组合索引

```python
from llama_index.core import VectorStoreIndex, SummaryIndex
from llama_index.core.composability import ComposableGraph

# 创建多个索引
vector_index = VectorStoreIndex.from_documents(documents[:len(documents)//2])
summary_index = SummaryIndex.from_documents(documents[len(documents)//2:])

# 组合索引
graph = ComposableGraph.from_indices(
    [vector_index, summary_index],
    [chunk1, chunk2],  # 节点映射
    index_summaries=["向量索引摘要", "总结索引摘要"]
)

# 从图中创建查询引擎
query_engine = graph.as_query_engine(
    response_mode="compact"
)
```

## 高级索引配置

### 自定义嵌入

```python
from llama_index.embeddings.openai import OpenAIEmbedding

# OpenAI 嵌入
embed_model = OpenAIEmbedding(
    model="text-embedding-3-small",
    dimensions=1536,
    api_key="your-api-key",
    api_base="https://api.openai.com/v1"
)

# 使用自定义嵌入
index = VectorStoreIndex.from_documents(
    documents,
    embed_model=embed_model
)
```

### 本地嵌入

```python
from llama_index.embeddings.huggingface import HuggingFaceEmbedding

# HuggingFace 本地嵌入
embed_model = HuggingFaceEmbedding(
    model_name="sentence-transformers/all-MiniLM-L6-v2",
    device="cpu"  # 或 "cuda"
)

index = VectorStoreIndex.from_documents(
    documents,
    embed_model=embed_model
)
```

### 混合搜索配置

```python
from llama_index.core import VectorStoreIndex

# 混合搜索
index = VectorStoreIndex.from_documents(documents)

query_engine = index.as_query_engine(
    vector_store_query_mode="hybrid",
    alpha=0.5  # 向量权重：0.5 = 平衡
)

# MMR（最大边际相关性）
query_engine = index.as_query_engine(
    vector_store_query_mode="mmr",
    mmr_threshold=0.7,
    similarity_top_k=10
)
```

## 存储与加载

### 本地存储

```python
from llama_index.core import StorageContext, load_index_from_storage

# 存储索引
storage_context = StorageContext.from_defaults(
    persist_dir="./storage"
)

index = VectorStoreIndex.from_documents(
    documents,
    storage_context=storage_context
)

# 持久化
storage_context.persist(persist_dir="./storage")

# 加载索引
loaded_index = load_index_from_storage(
    storage_context=StorageContext.from_defaults(
        persist_dir="./storage"
    )
)
```

### 向量数据库存储

#### Chroma

```python
import chromadb
from llama_index.vector_stores.chroma import ChromaVectorStore

# 创建 Chroma 客户端
chroma_client = chromadb.PersistentClient(path="./chroma_db")

# 获取或创建集合
collection = chroma_client.get_or_create_collection("documents")

# 创建向量存储
vector_store = ChromaVectorStore(
    chroma_collection=collection,
    embedding=embed_model
)

# 创建索引
index = VectorStoreIndex.from_documents(
    documents,
    vector_store=vector_store
)
```

#### Qdrant

```python
from qdrant_client import QdrantClient
from llama_index.vector_stores.qdrant import QdrantVectorStore

# Qdrant 客户端
client = QdrantClient(host="localhost", port=6333)

# 创建向量存储
vector_store = QdrantVectorStore(
    client=client,
    collection_name="my_collection",
    embedding=embed_model
)

# 创建索引
index = VectorStoreIndex.from_documents(
    documents,
    vector_store=vector_store
)
```

#### Pinecone

```python
from pinecone import Pinecone
from llama_index.vector_stores.pinecone import PineconeVectorStore

# Pinecone 客户端
pc = Pinecone(api_key="your-api-key")
pinecone_index = pc.Index("my-index")

# 创建向量存储
vector_store = PineconeVectorStore(
    pinecone_index=pinecone_index,
    embedding=embed_model
)

# 创建索引
index = VectorStoreIndex.from_documents(
    documents,
    vector_store=vector_store
)
```

## 批量处理

### 批量加载和索引

```python
from llama_index.core import SimpleDirectoryReader, VectorStoreIndex
from concurrent.futures import ThreadPoolExecutor

def process_file(file_path):
    """处理单个文件"""
    try:
        reader = SimpleDirectoryReader(input_files=[file_path])
        documents = reader.load_data()
        
        # 创建索引
        index = VectorStoreIndex.from_documents(documents)
        
        return {"file": file_path, "status": "success", "nodes": len(documents)}
    except Exception as e:
        return {"file": file_path, "status": "error", "error": str(e)}

# 批量处理文件
file_paths = [f"./data/{i}.pdf" for i in range(100)]

with ThreadPoolExecutor(max_workers=4) as executor:
    results = list(executor.map(process_file, file_paths))

# 统计结果
success = sum(1 for r in results if r["status"] == "success")
failed = sum(1 for r in results if r["status"] == "error")

print(f"成功: {success}, 失败: {failed}")
```

## 错误处理

### 数据加载错误处理

```python
from llama_index.core import SimpleDirectoryReader

class RobustReader:
    """健壮的数据读取器"""
    
    def __init__(self, directory):
        self.directory = directory
    
    def load_with_retry(self, max_retries=3):
        """带重试的加载"""
        documents = []
        
        for attempt in range(max_retries):
            try:
                reader = SimpleDirectoryReader(
                    input_dir=self.directory,
                    recursive=True,
                    required_exts=[".pdf", ".txt", ".md"]
                )
                documents = reader.load_data()
                break
            except Exception as e:
                print(f"尝试 {attempt + 1} 失败: {e}")
                if attempt == max_retries - 1:
                    raise
        
        return documents

# 使用
reader = RobustReader("./data")
documents = reader.load_with_retry()
```

## 最佳实践

| 实践 | 说明 |
|------|------|
| **合理选择 chunk_size** | 根据数据特点调整，通常 512-1024 |
| **使用 chunk_overlap** | 保持上下文连续性 |
| **选择合适的索引类型** | 根据查询需求选择 |
| **预处理数据** | 清洗和规范化数据 |
| **监控索引质量** | 检查检索结果相关性 |
| **批量处理** | 利用并发加速处理 |

## 总结

本文深入介绍了 LlamaIndex 的数据连接和索引构建：

- **数据连接器**：100+ 预置连接器，覆盖文件、API、数据库等
- **文档处理**：灵活创建和管理文档对象
- **节点分割**：多种分割策略，平衡上下文和精度
- **索引类型**：向量、关键词、树形、图等多种索引
- **存储方案**：本地存储和向量数据库支持
- **批量处理**：高效处理大规模数据

掌握这些技术，你将能够构建强大的数据管道和高效的检索系统！💪
