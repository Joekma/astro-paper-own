---
title: RAG 实战：构建完整 RAG 应用
author: Joekma
pubDatetime: 2026-05-11T00:00:00.000+08:00
modDatetime: 2026-05-11T00:00:00.000+08:00
slug: rag-full-implementation
description: '从零开始构建完整的RAG应用，包括数据处理、索引构建、检索优化和界面开发。'
tags:
  - RAG
  - 实战
  - 应用开发
  - 完整项目
draft: false
series: RAG
seriesOrder: 5
language: zh-CN
---

## 概述

本文将通过一个完整的实战项目，展示如何从零构建一个功能完善的 RAG 应用。我们将实现一个支持文档上传、智能问答、多轮对话的完整系统。

### 项目架构

```
┌─────────────────────────────────────────────────────────────────────┐
│                       RAG 应用架构                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐            │
│  │   前端界面   │ ←→ │    API     │ ←→ │   RAG Core  │            │
│  │  (Streamlit) │    │   (FastAPI) │    │  (LangChain)│            │
│  └─────────────┘    └─────────────┘    └─────────────┘            │
│                                              │                    │
│  ┌─────────────┐    ┌─────────────┐        │                    │
│  │  向量数据库  │ ←→ │   文档库    │ ←──────┘                    │
│  │   (Chroma)  │    │   (本地)    │                               │
│  └─────────────┘    └─────────────┘                               │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## 项目结构

```
rag_application/
├── app.py                 # Streamlit 主界面
├── api.py                # FastAPI 后端
├── rag/
│   ├── __init__.py
│   ├── loader.py         # 文档加载模块
│   ├── chunker.py       # 文本分割模块
│   ├── vectorstore.py   # 向量存储模块
│   ├── retriever.py    # 检索模块
│   ├── generator.py    # 生成模块
│   └── chain.py        # RAG Chain
├── config.py            # 配置文件
└── requirements.txt    # 依赖
```

## 核心模块实现

### 1. 配置管理 (config.py)

```python
from typing import Optional
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    openai_api_key: str
    openai_model: str = "gpt-4"
    embedding_model: str = "text-embedding-3-small"

    vectorstore_type: str = "chroma"
    persist_directory: str = "./vector_db"

    chunk_size: int = 1000
    chunk_overlap: int = 200

    retrieval_k: int = 5
    retrieval_search_type: str = "similarity"

    class Config:
        env_file = ".env"

settings = Settings()
```

### 2. 文档加载模块 (loader.py)

```python
from langchain_community.document_loaders import (
    TextLoader,
    PyPDFLoader,
    Docx2txtLoader,
    UnstructuredMarkdownLoader,
    CSVLoader
)
from langchain_core.documents import Document
from typing import List, Optional
import os

class DocumentLoader:
    def __init__(self):
        self.loaders = {
            ".txt": TextLoader,
            ".pdf": PyPDFLoader,
            ".docx": Docx2txtLoader,
            ".md": UnstructuredMarkdownLoader,
            ".csv": CSVLoader
        }

    def load_file(self, file_path: str) -> List[Document]:
        ext = os.path.splitext(file_path)[1].lower()

        if ext not in self.loaders:
            raise ValueError(f"不支持的文件格式: {ext}")

        loader_class = self.loaders[ext]
        loader = loader_class(file_path, encoding="utf-8")

        return loader.load()

    def load_directory(self, directory: str, exclude: Optional[List[str]] = None) -> List[Document]:
        all_documents = []
        exclude = exclude or []

        for root, dirs, files in os.walk(directory):
            for file in files:
                file_path = os.path.join(root, file)

                if any(ex in file_path for ex in exclude):
                    continue

                ext = os.path.splitext(file)[1].lower()
                if ext in self.loaders:
                    try:
                        docs = self.load_file(file_path)
                        for doc in docs:
                            doc.metadata["source"] = file_path
                        all_documents.extend(docs)
                    except Exception as e:
                        print(f"加载失败 {file_path}: {e}")

        return all_documents

loader = DocumentLoader()
documents = loader.load_directory("./documents", exclude=["*.tmp"])
print(f"加载了 {len(documents)} 个文档")
```

### 3. 文本分割模块 (chunker.py)

```python
from langchain.text_splitter import (
    RecursiveCharacterTextSplitter,
    MarkdownTextSplitter,
    Language
)
from langchain.schema import Document
from typing import List

class TextChunker:
    def __init__(self, chunk_size: int = 1000, chunk_overlap: int = 200):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    def split_documents(self, documents: List[Document]) -> List[Document]:
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=self.chunk_size,
            chunk_overlap=self.chunk_overlap,
            separators=["\n\n", "\n", ". ", ", ", " ", ""],
            length_function=len
        )

        chunks = splitter.split_documents(documents)

        for i, chunk in enumerate(chunks):
            chunk.metadata["chunk_index"] = i
            chunk.metadata["total_chunks"] = len(chunks)

        return chunks

    def split_markdown(self, markdown_text: str) -> List[str]:
        splitter = MarkdownTextSplitter(
            chunk_size=self.chunk_size,
            chunk_overlap=self.chunk_overlap
        )

        return splitter.split_text(markdown_text)

    def split_code(self, code: str, language: str = "python") -> List[str]:
        splitter = RecursiveCharacterTextSplitter.from_language(
            language=Language[language.upper()],
            chunk_size=self.chunk_size,
            chunk_overlap=self.chunk_overlap
        )

        return splitter.split_text(code)

chunker = TextChunker(chunk_size=1000, chunk_overlap=200)
chunks = chunker.split_documents(documents)
print(f"分割成 {len(chunks)} 个块")
```

### 4. 向量存储模块 (vectorstore.py)

```python
from langchain_community.vectorstores import Chroma, FAISS
from langchain_openai import OpenAIEmbeddings
from langchain.schema import Document
from typing import List, Optional

class VectorStoreManager:
    def __init__(
        self,
        embedding_model: str = "text-embedding-3-small",
        persist_directory: str = "./vector_db"
    ):
        self.embeddings = OpenAIEmbeddings(model=embedding_model)
        self.persist_directory = persist_directory
        self.vectorstore = None

    def create_vectorstore(self, documents: List[Document]) -> Chroma:
        self.vectorstore = Chroma.from_documents(
            documents=documents,
            embedding=self.embeddings,
            persist_directory=self.persist_directory
        )

        self.vectorstore.persist()

        return self.vectorstore

    def load_vectorstore(self) -> Chroma:
        self.vectorstore = Chroma(
            persist_directory=self.persist_directory,
            embedding_function=self.embeddings
        )

        return self.vectorstore

    def add_documents(self, documents: List[Document]):
        if self.vectorstore is None:
            self.create_vectorstore(documents)
        else:
            self.vectorstore.add_documents(documents)

    def delete_by_ids(self, ids: List[str]):
        if self.vectorstore:
            self.vectorstore.delete(ids)

    def get_retriever(self, search_type: str = "similarity", k: int = 5, **kwargs):
        if self.vectorstore is None:
            raise ValueError("向量存储未初始化")

        return self.vectorstore.as_retriever(
            search_type=search_type,
            search_kwargs={"k": k, **kwargs}
        )

vectorstore_manager = VectorStoreManager(
    embedding_model="text-embedding-3-small",
    persist_directory="./vector_db"
)

vectorstore = vectorstore_manager.create_vectorstore(chunks)
print("向量数据库创建成功")
```

### 5. 检索模块 (retriever.py)

```python
from langchain.schema import Document
from langchain_core.retrievers import BaseRetriever
from typing import List, Optional
import numpy as np

class HybridRetriever(BaseRetriever):
    def __init__(
        self,
        vectorstore,
        bm25_retriever=None,
        vector_weight: float = 0.7,
        bm25_weight: float = 0.3
    ):
        self.vectorstore = vectorstore
        self.bm25_retriever = bm25_retriever
        self.vector_weight = vector_weight
        self.bm25_weight = bm25_weight

    def _get_relevance_scores(self, docs: List[Document]) -> List[float]:
        return [1.0 / (1.0 + i * 0.1) for i in range(len(docs))]

    def _rerank_results(
        self,
        vector_docs: List[Document],
        bm25_docs: List[Document]
    ) -> List[Document]:
        scored_docs = {}

        for i, doc in enumerate(vector_docs):
            score = (1.0 / (1.0 + i * 0.1)) * self.vector_weight
            key = doc.page_content[:100]
            scored_docs[key] = {"doc": doc, "score": score}

        for i, doc in enumerate(bm25_docs):
            score = (1.0 / (1.0 + i * 0.1)) * self.bm25_weight
            key = doc.page_content[:100]
            if key in scored_docs:
                scored_docs[key]["score"] += score
            else:
                scored_docs[key] = {"doc": doc, "score": score}

        sorted_docs = sorted(
            scored_docs.values(),
            key=lambda x: x["score"],
            reverse=True
        )

        return [item["doc"] for item in sorted_docs]

    def get_relevant_documents(self, query: str) -> List[Document]:
        vector_results = self.vectorstore.similarity_search(query, k=10)

        if self.bm25_retriever:
            bm25_results = self.bm25_retriever.invoke(query)
            return self._rerank_results(vector_results, bm25_results)

        return vector_results

    async def aget_relevant_documents(self, query: str) -> List[Document]:
        return self.get_relevant_documents(query)
```

### 6. 生成模块 (generator.py)

```python
from typing import List
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser

class AnswerGenerator:
    def __init__(
        self,
        model: str = "gpt-4",
        temperature: float = 0.7
    ):
        self.llm = ChatOpenAI(
            model=model,
            temperature=temperature
        )

        self.prompt = PromptTemplate.from_template(
            """你是一个知识渊博的助手。请基于以下提供的上下文信息，准确回答用户的问题。

            如果上下文中没有相关信息，请明确告知用户，不要编造答案。

            上下文信息：
            {context}

            用户问题：{question}

            请提供回答："""
        )

        self.chain = self.prompt | self.llm | StrOutputParser()

    def generate(self, context: str, question: str) -> str:
        return self.chain.invoke({
            "context": context,
            "question": question
        })

    def generate_with_sources(self, context: str, question: str) -> dict:
        response = self.chain.invoke({
            "context": context,
            "question": question
        })

        return {
            "answer": response,
            "sources": self._extract_sources(context)
        }

    def _extract_sources(self, context: str) -> List[str]:
        sources = []
        lines = context.split("\n")

        for line in lines:
            if "[来源" in line or "Source" in line:
                sources.append(line.strip())

        return sources

generator = AnswerGenerator(model="gpt-4", temperature=0.7)
```

### 7. RAG Chain (chain.py)

```python
from typing import List, Optional, Dict
from langchain_core.runnables import Runnable
from langchain.schema import Document

class RAGChain:
    def __init__(
        self,
        vectorstore_manager,
        retriever,
        generator
    ):
        self.vectorstore_manager = vectorstore_manager
        self.retriever = retriever
        self.generator = generator

    def retrieve(self, query: str, k: int = 5) -> List[Document]:
        return self.retriever.invoke(query)[:k]

    def retrieve_with_scores(self, query: str, k: int = 5) -> List[tuple]:
        return self.vectorstore_manager.vectorstore.similarity_search_with_score(query, k=k)

    def generate_answer(
        self,
        query: str,
        context: Optional[str] = None,
        use_retrieval: bool = True
    ) -> str:
        if use_retrieval:
            docs = self.retrieve(query)
            context = "\n\n".join([doc.page_content for doc in docs])

        return self.generator.generate(context=context, question=query)

    def chat(self, query: str, chat_history: Optional[List[Dict]] = None) -> Dict:
        chat_history = chat_history or []

        docs = self.retrieve(query)
        context = "\n\n".join([doc.page_content for doc in docs])

        history_context = self._format_history(chat_history)

        full_context = f"{history_context}\n\n当前上下文：\n{context}"

        answer = self.generator.generate(
            context=full_context,
            question=query
        )

        return {
            "answer": answer,
            "context": docs,
            "sources": [doc.metadata.get("source", "未知") for doc in docs]
        }

    def _format_history(self, history: List[Dict]) -> str:
        if not history:
            return ""

        lines = ["对话历史："]
        for msg in history[-5:]:
            role = "用户" if msg["role"] == "user" else "助手"
            lines.append(f"{role}：{msg['content']}")

        return "\n".join(lines)

rag_chain = RAGChain(
    vectorstore_manager=vectorstore_manager,
    retriever=retriever,
    generator=generator
)
```

## 前端界面 (Streamlit)

### app.py

```python
import streamlit as st
from langchain_core.documents import Document
from rag.chain import RAGChain
from rag.chunker import TextChunker
from rag.vectorstore import VectorStoreManager
from rag.generator import AnswerGenerator

st.set_page_config(page_title="RAG 智能问答", page_icon="🤖")
st.title("🤖 RAG 智能问答系统")

if "rag_chain" not in st.session_state:
    st.session_state.rag_chain = None
    st.session_state.chat_history = []

with st.sidebar:
    st.header("📚 文档管理")

    uploaded_files = st.file_uploader(
        "上传文档",
        type=["txt", "pdf", "md", "docx"],
        accept_multiple_files=True
    )

    if uploaded_files:
        if st.button("处理文档", type="primary"):
            with st.spinner("处理文档中..."):
                # 读取上传文件并构造 Document 对象列表
                documents = []
                for file in uploaded_files:
                    content = file.read().decode("utf-8", errors="ignore")
                    documents.append(
                        Document(
                            page_content=content,
                            metadata={"source": file.name}
                        )
                    )

                # 分割文档为文本块
                chunks = TextChunker().split_documents(documents)

                # 创建向量库
                vs_manager = VectorStoreManager()
                vectorstore = vs_manager.create_vectorstore(chunks)

                # 构建 RAG Chain
                st.session_state.rag_chain = RAGChain(
                    vectorstore_manager=vs_manager,
                    retriever=vectorstore.as_retriever(search_kwargs={"k": 5}),
                    generator=AnswerGenerator()
                )

                st.success(f"处理完成！生成了 {len(chunks)} 个文本块")

st.header("💬 问答")

query = st.text_input("请输入您的问题：", placeholder="例如：Python中的装饰器是什么？")

if query:
    if st.session_state.rag_chain is None:
        st.warning("请先在侧边栏上传并处理文档")
    else:
        with st.spinner("思考中..."):
            result = st.session_state.rag_chain.chat(
                query,
                st.session_state.chat_history
            )

            st.session_state.chat_history.append({
                "role": "user",
                "content": query
            })
            st.session_state.chat_history.append({
                "role": "assistant",
                "content": result["answer"]
            })

            st.markdown("### 回答")
            st.write(result["answer"])

            with st.expander("📎 查看引用来源"):
                for i, source in enumerate(result["sources"], 1):
                    st.text(f"{i}. {source}")

with st.expander("💭 对话历史"):
    for msg in st.session_state.chat_history[-10:]:
        role = "👤 用户" if msg["role"] == "user" else "🤖 助手"
        st.markdown(f"**{role}**：{msg['content']}")
```

## API 接口 (FastAPI)

### api.py

```python
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from rag.chain import RAGChain

app = FastAPI(title="RAG API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

rag_chain: Optional[RAGChain] = None

class QueryRequest(BaseModel):
    query: str
    chat_history: Optional[List[dict]] = []

class QueryResponse(BaseModel):
    answer: str
    sources: List[str]
    context: str

def build_rag_chain(documents):
    """根据文档内容构建 RAG Chain。

    实际项目中应根据 RAGChain 的接口进行实现。
    """
    from rag.chunker import TextChunker
    from rag.vectorstore import VectorStoreManager
    from rag.generator import AnswerGenerator
    from langchain_core.documents import Document

    doc_objs = [
        Document(page_content=content, metadata={"source": f"upload_{i}"})
        for i, content in enumerate(documents)
    ]

    chunks = TextChunker().split_documents(doc_objs)
    vs_manager = VectorStoreManager()
    vectorstore = vs_manager.create_vectorstore(chunks)
    return RAGChain(
        vectorstore_manager=vs_manager,
        retriever=vectorstore.as_retriever(search_kwargs={"k": 5}),
        generator=AnswerGenerator()
    )

@app.post("/upload", status_code=201)
async def upload_documents(files: List[UploadFile] = File(...)):
    global rag_chain

    try:
        contents = []
        for file in files:
            content = await file.read()
            contents.append(content.decode("utf-8", errors="ignore"))

        rag_chain = build_rag_chain(contents)

        return {"status": "success", "message": f"处理了 {len(files)} 个文件"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/query", response_model=QueryResponse)
async def query(request: QueryRequest):
    if rag_chain is None:
        raise HTTPException(status_code=400, detail="请先上传文档")

    result = rag_chain.chat(
        request.query,
        request.chat_history
    )

    # result["context"] 是 Document 列表，需提取 page_content
    context_text = "\n\n".join(
        doc.page_content if hasattr(doc, "page_content") else str(doc)
        for doc in result["context"]
    )

    return QueryResponse(
        answer=result["answer"],
        sources=result["sources"],
        context=context_text
    )

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

## 部署配置

### requirements.txt

```
langchain>=0.1.0
langchain-openai>=0.0.5
langchain-community>=0.0.10
openai>=1.0.0
chromadb>=0.4.0
streamlit>=1.28.0
fastapi>=0.104.0
uvicorn>=0.24.0
pydantic>=2.0
pydantic-settings>=2.0
python-multipart>=0.0.6
```

### .env.example

```
OPENAI_API_KEY=sk-your-api-key-here
OPENAI_MODEL=gpt-4
EMBEDDING_MODEL=text-embedding-3-small
VECTORSTORE_TYPE=chroma
PERSIST_DIRECTORY=./vector_db
CHUNK_SIZE=1000
CHUNK_OVERLAP=200
RETRIEVAL_K=5
```

## 测试

### 单元测试

```python
import pytest
from rag.loader import DocumentLoader
from rag.chunker import TextChunker
from rag.generator import AnswerGenerator

def test_loader():
    loader = DocumentLoader()
    assert loader.loaders is not None

def test_chunker():
    chunker = TextChunker(chunk_size=100, chunk_overlap=20)
    chunks = chunker.split_documents([Document(page_content="测试内容" * 100)])
    assert len(chunks) > 0

def test_generator():
    generator = AnswerGenerator()
    result = generator.generate("测试上下文", "测试问题")
    assert isinstance(result, str)
    assert len(result) > 0

if __name__ == "__main__":
    pytest.main([__file__])
```

## 性能基准测试

```python
import time
from rag.chain import RAGChain

def benchmark(rag_chain, queries, iterations=5):
    results = []

    for query in queries:
        times = []
        for _ in range(iterations):
            start = time.time()
            rag_chain.generate_answer(query)
            elapsed = time.time() - start
            times.append(elapsed)

        avg_time = sum(times) / len(times)
        results.append({
            "query": query,
            "avg_time": avg_time,
            "min_time": min(times),
            "max_time": max(times)
        })

    return results

queries = [
    "Python中的列表推导式是什么？",
    "解释机器学习和深度学习的区别",
    "如何使用 LangChain 构建 Chain"
]

benchmark_results = benchmark(rag_chain, queries)

print("性能测试结果：")
for result in benchmark_results:
    print(f"\n查询: {result['query']}")
    print(f"  平均时间: {result['avg_time']:.3f}s")
    print(f"  最快时间: {result['min_time']:.3f}s")
    print(f"  最慢时间: {result['max_time']:.3f}s")
```

## 总结

本文实现了一个完整的 RAG 应用：

| 模块 | 功能 |
|------|------|
| **loader** | 多格式文档加载 |
| **chunker** | 智能文本分割 |
| **vectorstore** | 向量存储管理 |
| **retriever** | 混合检索 |
| **generator** | 答案生成 |
| **chain** | RAG 串联 |
| **app** | Streamlit 界面 |
| **api** | FastAPI 接口 |

这个项目可以作为开发生产级 RAG 应用的基础框架。

## 后续内容

本系列后续将深入讲解：
- RAG 性能优化技巧
- 多模态 RAG
- RAG 与 Agents 结合
