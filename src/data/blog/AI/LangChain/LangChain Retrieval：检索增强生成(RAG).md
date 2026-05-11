---
title: LangChain Retrieval：检索增强生成(RAG)
author: Joekma
pubDatetime: 2026-05-11T00:00:00.000+08:00
modDatetime: 2026-05-11T00:00:00.000+08:00
slug: langchain-retrieval-rag
description: '深入讲解LangChain v1.0的Retrieval模块，包括文档加载、文本分割、向量存储和检索器实现RAG。'
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
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌────────┐   │
│  │  文档加载  │ → │  文本分割  │ → │  向量化  │ → │  存储   │   │
│  └──────────┘   └──────────┘   └──────────┘   └────────┘   │
│                                                              │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌────────┐   │
│  │  用户查询  │ → │  检索相关  │ → │  构建提示 │ → │  生成  │   │
│  └──────────┘   └──────────┘   └──────────┘   └────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 文档加载器

### 内置加载器类型

| 类型 | 说明 |
|------|------|
| **TextLoader** | 文本文件 |
| **PDFLoader** | PDF 文档 |
| **CSVLoader** | CSV 文件 |
| **WebBaseLoader** | 网页内容 |
| **DirectoryLoader** | 目录批量加载 |

### 基础加载器

```python
from langchain_community.document_loaders import TextLoader
from langchain_community.document_loaders import DirectoryLoader

loader = TextLoader("document.txt")
documents = loader.load()

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

loader = PyPDFLoader("document.pdf")
documents = loader.load()

for doc in documents:
    print(f"Page {doc.metadata['page']}: {doc.page_content[:200]}...")
```

## 文本分割

### 分割器类型

| 类型 | 说明 | 适用场景 |
|------|------|---------|
| **CharacterTextSplitter** | 按字符分割 | 简单文本 |
| **RecursiveCharacterTextSplitter** | 递归字符分割 | 通用场景 |
| **TokenTextSplitter** | 按 Token 分割 | 控制上下文长度 |

### 基础分割

```python
from langchain.text_splitter import RecursiveCharacterTextSplitter

splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200,
    length_function=len,
    separators=["\n\n", "\n", " ", ""]
)

docs = splitter.split_documents(documents)
```

## 向量存储

### 支持的向量数据库

| 数据库 | 说明 |
|--------|------|
| **Chroma** | 轻量级，本地开发首选 |
| **FAISS** | Facebook 高效相似性搜索 |
| **Pinecone** | 云端向量数据库 |
| **Qdrant** | 高性能向量数据库 |

### Chroma 向量存储

```python
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import Chroma

embeddings = OpenAIEmbeddings()

vectorstore = Chroma.from_documents(
    documents=docs,
    embedding=embeddings,
    persist_directory="./chroma_db"
)

vectorstore.persist()

results = vectorstore.similarity_search("查询内容", k=3)

results_with_scores = vectorstore.similarity_search_with_score(
    "查询内容",
    k=3
)
```

### FAISS 向量存储

```python
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import FAISS

vectorstore = FAISS.from_documents(
    documents=docs,
    embedding=embeddings
)

vectorstore.save_local("faiss_index")

loaded_vectorstore = FAISS.load_local(
    "faiss_index",
    embeddings
)
```

## 检索器

### 基础检索

```python
retriever = vectorstore.as_retriever(
    search_type="similarity",
    search_kwargs={"k": 5}
)

results = retriever.invoke("用户问题")
```

### MMR 检索

最大边际相关（MMR）检索，提供多样性：

```python
retriever = vectorstore.as_retriever(
    search_type="mmr",
    search_kwargs={
        "k": 5,
        "fetch_k": 20,
        "lambda_mult": 0.5
    }
)
```

## RAG Chain 实现

### 基础 RAG

```python
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate
from langchain_core.runnables import RunnablePassthrough

llm = ChatOpenAI(model="gpt-4o")

def format_docs(docs):
    return "\n\n".join([d.page_content for d in docs])

rag_chain = (
    {"context": retriever | format_docs, "question": RunnablePassthrough()}
    | PromptTemplate.from_template(
        """基于以下上下文回答问题：

        上下文：
        {context}

        问题：{question}

        回答："""
    )
    | llm
)

result = rag_chain.invoke("用户问题")
```

### 带历史记录的 RAG

```python
from langchain.memory import ConversationBufferMemory

memory = ConversationBufferMemory(
    memory_key="chat_history",
    return_messages=True,
    output_key="answer"
)

def chat_with_history(question):
    history = memory.load_memory_variables({}).get("chat_history", [])

    retrieved_docs = retriever.invoke(question)
    context = "\n\n".join([doc.page_content for doc in retrieved_docs])

    prompt = PromptTemplate.from_template(
        """基于以下上下文和对话历史回答问题：

        对话历史：
        {chat_history}

        上下文：
        {context}

        问题：{question}

        回答："""
    )

    response = llm.invoke(prompt.format_messages(
        chat_history=history,
        context=context,
        question=question
    ))

    memory.save_context(
        {"question": question},
        {"answer": response.content}
    )

    return response.content

result = chat_with_history("公司的主营业务是什么？")
result = chat_with_history("这个业务的规模有多大？")
```

## Embeddings 模型

### OpenAI Embeddings

```python
from langchain_openai import OpenAIEmbeddings

embeddings = OpenAIEmbeddings(
    model="text-embedding-3-small"
)

vector = embeddings.embed_query("查询文本")

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

## 总结

RAG 是扩展 LLM 能力的核心技术：

| 组件 | 功能 |
|------|------|
| **DocumentLoader** | 加载各种格式文档 |
| **TextSplitter** | 将文档分割成块 |
| **Embeddings** | 将文本转为向量 |
| **VectorStore** | 存储和检索向量 |
| **RAG Chain** | RAG 问答链 |

掌握 RAG，可以构建强大的知识库问答系统。