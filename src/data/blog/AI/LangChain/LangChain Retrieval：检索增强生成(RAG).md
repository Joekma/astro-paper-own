---
title: LangChain Retrieval：检索增强生成(RAG)
author: Joekma
pubDatetime: 2026-05-07T00:00:00.000+08:00
modDatetime: 2026-05-07T00:00:00.000+08:00
slug: langchain-retrieval-rag
description: '深入讲解LangChain的Retrieval模块，包括文档加载、文本分割、向量存储和检索器实现RAG应用。'
tags:
  - LangChain
  - RAG
  - LLM
draft: false
series: LangChain
language: zh-CN
---

## 概述

Retrieval（检索）是 LangChain 中实现检索增强生成（Retrieval-Augmented Generation, RAG）的核心模块。RAG 是一种让 LLM 能够访问外部知识库的技术，可以显著提高回答的准确性和可靠性。

### 为什么需要 RAG？

| 问题 | RAG 解决方案 |
|------|------------|
| LLM 知识过时 | 接入最新文档 |
| 幻觉回答 | 基于事实检索 |
| 私有知识缺失 | 加载私有文档 |
| 长尾知识 | 扩展知识库 |

### RAG 工作流程

```
┌─────────────────────────────────────────────────────────────┐
│                      RAG 工作流程                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌────────┐ │
│  │  文档加载  │ → │  文本分割  │ → │  向量化  │ → │  存储   │ │
│  └──────────┘   └──────────┘   └──────────┘   └────────┘ │
│                                                              │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌────────┐ │
│  │  用户查询  │ → │  检索相关  │ → │  构建提示 │ → │  生成  │ │
│  └──────────┘   └──────────┘   └──────────┘   └────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 文档加载器

### 内置加载器类型

| 类型 | 说明 |
|------|------|
| **UnstructuredFileLoader** | 通用文件加载 |
| **TextLoader** | 文本文件 |
| **PDFLoader** | PDF 文档 |
| **CSVLoader** | CSV 文件 |
| **WebBaseLoader** | 网页内容 |
| **DirectoryLoader** | 目录批量加载 |

### 基础加载器

```python
from langchain_community.document_loaders import TextLoader
from langchain_community.document_loaders import DirectoryLoader

# 加载单个文本文件
loader = TextLoader("document.txt")
documents = loader.load()
print(documents[0].page_content)
print(documents[0].metadata)

# 加载目录中的所有文本文件
loader = DirectoryLoader(
    path="./documents",
    glob="**/*.txt",
    loader_cls=TextLoader
)
documents = loader.load()
```

### PDF 加载

```python
from langchain_community.document_loaders import PyPDFLoader

# 加载 PDF
loader = PyPDFLoader("document.pdf")
documents = loader.load()

# 访问内容
for doc in documents:
    print(f"Page {doc.metadata['page']}: {doc.page_content[:200]}...")
```

### CSV 加载

```python
from langchain_community.document_loaders import CSVLoader

loader = CSVLoader(
    file_path="data.csv",
    source_column="name"  # 指定源列
)
documents = loader.load()
```

### 网页加载

```python
from langchain_community.document_loaders import WebBaseLoader

loader = WebBaseLoader("https://example.com/article")
documents = loader.load()
```

## 文本分割

### 分割器类型

| 类型 | 说明 | 适用场景 |
|------|------|---------|
| **CharacterTextSplitter** | 按字符分割 | 简单文本 |
| **RecursiveCharacterTextSplitter** | 递归字符分割 | 通用场景 |
| **TokenTextSplitter** | 按 Token 分割 | 控制上下文长度 |
| **MarkdownTextSplitter** | Markdown 分割 | Markdown 文档 |
| **PythonCodeTextSplitter** | 代码分割 | 代码文件 |

### 基础分割

```python
from langchain.text_splitter import (
    CharacterTextSplitter,
    RecursiveCharacterTextSplitter
)

# 简单字符分割
splitter = CharacterTextSplitter(
    separator="\n",
    chunk_size=1000,
    chunk_overlap=100,
    length_function=len
)

docs = splitter.split_documents(documents)

# 递归字符分割（推荐）
recursive_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200,
    length_function=len,
    separators=["\n\n", "\n", " ", ""]
)

docs = recursive_splitter.split_documents(documents)
```

### 按 Token 分割

```python
from langchain.text_splitter import TokenTextSplitter

splitter = TokenTextSplitter(
    chunk_size=500,
    chunk_overlap=50
)

docs = splitter.split_documents(documents)
```

### Markdown 分割

```python
from langchain.text_splitter import MarkdownTextSplitter

splitter = MarkdownTextSplitter(
    chunk_size=500,
    chunk_overlap=50
)

docs = splitter.split_documents(markdown_documents)
```

## 向量存储

### 支持的向量数据库

| 数据库 | 说明 |
|--------|------|
| **Chroma** | 轻量级，本地开发首选 |
| **FAISS** | Facebook 高效相似性搜索 |
| **Pinecone** | 云端向量数据库 |
| **Weaviate** | 开源向量搜索引擎 |
| **Milvus** | 开源向量数据库 |
| **Qdrant** | 高性能向量数据库 |

### Chroma 向量存储

```python
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import Chroma

# 创建嵌入
embeddings = OpenAIEmbeddings()

# 创建向量存储
vectorstore = Chroma.from_documents(
    documents=docs,
    embedding=embeddings,
    persist_directory="./chroma_db"  # 持久化路径
)

# 保存
vectorstore.persist()

# 检索
results = vectorstore.similarity_search("查询内容", k=3)

# 带分数的检索
results_with_scores = vectorstore.similarity_search_with_score(
    "查询内容",
    k=3
)
```

### FAISS 向量存储

```python
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import FAISS

# 创建向量存储
vectorstore = FAISS.from_documents(
    documents=docs,
    embedding=embeddings
)

# 保存本地
vectorstore.save_local("faiss_index")

# 加载
loaded_vectorstore = FAISS.load_local(
    "faiss_index",
    embeddings
)
```

## 检索器

### 基础检索

```python
# 转换为检索器
retriever = vectorstore.as_retriever(
    search_type="similarity",  # 或 "mmr"
    search_kwargs={"k": 5}
)

# 执行检索
results = retriever.invoke("用户问题")
```

### MMR 检索

最大边际相关（MMR）检索，提供多样性：

```python
retriever = vectorstore.as_retriever(
    search_type="mmr",
    search_kwargs={
        "k": 5,              # 返回数量
        "fetch_k": 20,       # 初始获取数量
        "lambda_mult": 0.5   # 多样性参数 (0-1)
    }
)
```

### 自定义检索器

```python
from langchain_core.retrievers import BaseRetriever
from langchain_core.documents import Document
from typing import List

class CustomRetriever(BaseRetriever):
    """自定义检索器"""

    def _get_relevant_documents(
        self, query: str, **kwargs
    ) -> List[Document]:
        # 自定义检索逻辑
        docs = vectorstore.similarity_search(query, k=5)

        # 过滤逻辑
        filtered = [d for d in docs if "重要" in d.page_content]
        return filtered

    async def _aget_relevant_documents(self, query: str) -> List[Document]:
        # 异步版本
        return self._get_relevant_documents(query)
```

## RAG Chain 实现

### 基础 RAG

```python
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate
from langchain.chains.retrieval_qa.base import RetrievalQA

# 创建检索器
retriever = vectorstore.as_retriever(k=5)

# 创建 QA 链
qa_chain = RetrievalQA.from_chain_type(
    llm=ChatOpenAI(model="gpt-4"),
    chain_type="stuff",  # stuff, map_reduce, refine
    retriever=retriever,
    return_source_documents=True
)

# 问答
result = qa_chain.invoke({"query": "用户问题"})
print(result["result"])
print(result["source_documents"])
```

### Stuff Chain

将所有文档塞入单个提示词：

```python
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain.chains.retrieval import create_retrieval_chain

# 创建文档处理链
document_chain = create_stuff_documents_chain(
    llm=ChatOpenAI(model="gpt-4"),
    prompt=PromptTemplate.from_template(
        """基于以下上下文回答问题：

        上下文：
        {context}

        问题：{input}

        回答："""
    )
)

# 创建检索链
retrieval_chain = create_retrieval_chain(
    retriever=vectorstore.as_retriever(),
    combine_docs_chain=document_chain
)

# 执行
result = retrieval_chain.invoke({"input": "用户问题"})
```

### Map Reduce Chain

逐文档处理后合并：

```python
qa_chain = RetrievalQA.from_chain_type(
    llm=ChatOpenAI(model="gpt-4"),
    chain_type="map_reduce",
    retriever=retriever,
    combine_prompt=PromptTemplate.from_template(
        """总结以下文档：

        {docs}"""
    ),
    map_prompt=PromptTemplate.from_template(
        """基于以下文档回答问题：

        问题：{question}

        文档：{docs}

        答案："""
    )
)
```

## 问答系统实战

### 完整示例

```python
from langchain_community.document_loaders import TextLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_community.vectorstores import Chroma
from langchain.chains.retrieval_qa.base import RetrievalQA

# 1. 加载文档
loader = TextLoader("knowledge_base.txt")
documents = loader.load()

# 2. 分割文档
splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200
)
docs = splitter.split_documents(documents)

# 3. 向量化存储
embeddings = OpenAIEmbeddings()
vectorstore = Chroma.from_documents(
    documents=docs,
    embedding=embeddings
)

# 4. 创建检索器
retriever = vectorstore.as_retriever(k=5)

# 5. 创建 QA 链
llm = ChatOpenAI(model="gpt-4", temperature=0)
qa_chain = RetrievalQA.from_chain_type(
    llm=llm,
    chain_type="stuff",
    retriever=retriever,
    return_source_documents=True
)

# 6. 问答
result = qa_chain.invoke({
    "query": "公司有哪些产品？"
})

print(f"答案: {result['result']}")
print(f"来源文档数: {len(result['source_documents'])}")
```

### 带历史记录的 RAG

```python
from langchain.memory import ConversationBufferMemory
from langchain.chains.conversational_retrieval.base import (
    ConversationalRetrievalChain
)

# 创建对话检索链
conversational_chain = ConversationalRetrievalChain.from_llm(
    llm=ChatOpenAI(model="gpt-4"),
    retriever=retriever,
    memory=ConversationBufferMemory(
        memory_key="chat_history",
        return_messages=True
    )
)

# 对话
result = conversational_chain.invoke({
    "question": "公司的主营业务是什么？",
    "chat_history": []
})

result = conversational_chain.invoke({
    "question": "这个业务的规模有多大？",
    "chat_history": result["chat_history"]
})
```

## Embeddings 模型

### OpenAI Embeddings

```python
from langchain_openai import OpenAIEmbeddings

embeddings = OpenAIEmbeddings(
    model="text-embedding-ada-002"
)

# 单个文本
vector = embeddings.embed_query("查询文本")

# 批量文本
vectors = embeddings.embed_documents([
    "文本1",
    "文本2",
    "文本3"
])
```

### 本地 Embeddings

```python
from langchain_community.embeddings import HuggingFaceEmbeddings

embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)
```

## 性能优化

### 检索优化

```python
# 1. 优化检索参数
retriever = vectorstore.as_retriever(
    search_kwargs={
        "k": 10,           # 初始检索数量
        "filter": {...}    # 元数据过滤
    }
)

# 2. 后处理过滤
from langchain_core.runnables import RunnableLambda

def filter_docs(docs):
    return [d for d in docs if d.metadata.get("relevance", 0) > 0.5]

chain = retriever | RunnableLambda(filter_docs)
```

### 分块策略优化

```python
# 1. 根据内容类型调整
if "代码" in content_type:
    splitter = PythonCodeTextSplitter(chunk_size=200)
elif "Markdown" in content_type:
    splitter = MarkdownTextSplitter(chunk_size=500)
else:
    splitter = RecursiveCharacterTextSplitter(chunk_size=1000)
```

## 最佳实践

| 实践 | 说明 |
|------|------|
| **选择合适的分割大小** | 根据文档类型和模型上下文调整 |
| **保留重叠** | 设置适当的 chunk_overlap |
| **使用元数据** | 为文档添加来源、时间等元信息 |
| **优化嵌入模型** | 根据语言和领域选择合适模型 |
| **评估检索质量** | 定期评估和优化检索结果 |

### 分割大小参考

| 场景 | 推荐 Chunk Size |
|------|---------------|
| 短问答 | 500-1000 tokens |
| 文档摘要 | 1000-2000 tokens |
| 复杂分析 | 2000-4000 tokens |
| 代码理解 | 200-500 tokens |

## 常见问题

### Q1：如何处理多种格式的文档？

```python
from langchain_community.document_loaders import (
    TextLoader,
    PyPDFLoader,
    CSVLoader
)

loaders = {
    ".txt": TextLoader,
    ".pdf": PyPDFLoader,
    ".csv": CSVLoader
}
```

### Q2：如何更新向量数据库？

```python
# 添加新文档
vectorstore.add_documents(new_docs)

# 删除文档
vectorstore.delete(ids=["doc_id"])

# 持久化
vectorstore.persist()
```

### Q3：如何过滤检索结果？

```python
# 元数据过滤
results = vectorstore.similarity_search(
    "查询",
    filter={"source": "document1.pdf"}
)
```

## 总结

RAG 是扩展 LLM 能力的核心技术：

| 组件 | 功能 |
|------|------|
| **DocumentLoader** | 加载各种格式文档 |
| **TextSplitter** | 将文档分割成块 |
| **Embeddings** | 将文本转为向量 |
| **VectorStore** | 存储和检索向量 |
| **RetrievalQA** | RAG 问答链 |

掌握 RAG，可以构建强大的知识库问答系统。
