---
title: LangChain 实战：构建聊天机器人
author: Joekma
pubDatetime: 2026-05-07T00:00:00.000+08:00
modDatetime: 2026-05-07T00:00:00.000+08:00
slug: langchain-chatbot实战
description: '使用LangChain构建完整的聊天机器人应用，包括对话管理、RAG集成和流式输出。'
tags:
  - LangChain
  - ChatBot
  - 实战
draft: false
series: LangChain
language: zh-CN
---

## 概述

本文将通过一个完整的实战项目，展示如何使用 LangChain 构建功能丰富的聊天机器人。我们将实现一个支持多轮对话、知识库问答和流式输出的智能助手。

### 项目架构

```
┌─────────────────────────────────────────────────────────────┐
│                    聊天机器人架构                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐   │
│   │   前端界面   │ ←→ │   API层     │ ←→ │  LangChain  │   │
│   └─────────────┘    └─────────────┘    └─────────────┘   │
│                                              │             │
│                           ┌──────────────────┼──────────┐ │
│                           │                  │          │ │
│                           ▼                  ▼          ▼ │
│                      ┌─────────┐      ┌─────────┐  ┌─────┐│
│                      │ Memory  │      │  Agent  │  │ RAG ││
│                      └─────────┘      └─────────┘  └─────┘│
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 项目初始化

### 环境准备

```bash
pip install langchain-openai langchain-community
pip install langchain
pip install streamlit
pip install python-dotenv
pip install chromadb
```

## 对话记忆模块（新版本）

```python
from langchain.memory import ConversationBufferMemory
from langchain_openai import ChatOpenAI

class ChatMemory:
    def __init__(self):
        self.memory = ConversationBufferMemory(
            memory_key="chat_history",
            return_messages=True
        )

    def save_context(self, user_input: str, ai_output: str):
        self.memory.chat_memory.add_user_message(user_input)
        self.memory.chat_memory.add_ai_message(ai_output)

    def get_history(self) -> list:
        return self.memory.load_memory_variables({}).get("chat_history", [])

    def clear(self):
        self.memory.clear()

    def get_messages(self):
        return self.memory.chat_memory.messages
```

## 知识库模块（新版本）

```python
from langchain_community.document_loaders import TextLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import Chroma

class KnowledgeBase:
    def __init__(self):
        self.embeddings = OpenAIEmbeddings()
        self.vectorstore = None
        self.retriever = None

    def load_documents(self, documents_path: str):
        loader = TextLoader(documents_path)
        documents = loader.load()

        splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200
        )
        texts = splitter.split_documents(documents)

        self.vectorstore = Chroma.from_documents(
            documents=texts,
            embedding=self.embeddings
        )

        self.retriever = self.vectorstore.as_retriever(
            search_kwargs={"k": 5}
        )

    def query(self, question: str, k: int = 5):
        if not self.retriever:
            return []
        docs = self.retriever.invoke(question)
        return docs
```

## 聊天链模块（新版本）

```python
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.output_parsers import StrOutputParser

def create_basic_chat_chain():
    llm = ChatOpenAI(model="gpt-4", temperature=0.7)

    prompt = ChatPromptTemplate.from_messages([
        ("system", "你是一个友好的AI助手，名字叫小智。"),
        MessagesPlaceholder(variable_name="history"),
        ("human", "{question}")
    ])

    chain = prompt | llm | StrOutputParser()
    return chain

def chat_with_memory(chain, memory, question):
    history = memory.get_history()

    response = chain.invoke({
        "question": question,
        "history": history
    })

    memory.save_context(question, response)
    return response
```

## Agent 模块（新版本）

```python
from langchain_core.tools import tool
from langchain_openai import ChatOpenAI
from langchain import create_react_agent
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

@tool
def calculator(expression: str) -> str:
    """执行数学计算"""
    try:
        result = eval(expression)
        return f"计算结果：{result}"
    except Exception as e:
        return f"计算错误：{str(e)}"

@tool
def date_query(command: str) -> str:
    """获取当前日期"""
    from datetime import datetime
    return datetime.now().strftime("%Y年%m月%d日")

def create_tool_agent():
    llm = ChatOpenAI(model="gpt-4", temperature=0)
    tools = [calculator, date_query]

    prompt = ChatPromptTemplate.from_messages([
        ("system", "你是一个智能助手，可以使用工具来回答问题。"),
        ("human", "{input}"),
        MessagesPlaceholder(variable_name="agent_scratchpad")
    ])

    agent = create_react_agent(llm, tools, prompt)
    return agent
```

## 主应用（新版本）

```python
import streamlit as st
from langchain_core.callbacks import BaseCallbackHandler

class StreamlitCallbackHandler(BaseCallbackHandler):
    def __init__(self, container):
        self.container = container
        self.text_area = None

    def on_llm_new_token(self, token, **kwargs):
        if self.text_area:
            self.text_area.markdown(token)

if "memory" not in st.session_state:
    st.session_state.memory = ChatMemory()

if "chat_mode" not in st.session_state:
    st.session_state.chat_mode = "basic"

if "knowledge_base" not in st.session_state:
    st.session_state.knowledge_base = KnowledgeBase()

with st.sidebar:
    st.session_state.chat_mode = st.selectbox(
        "选择聊天模式",
        ["basic", "agent"]
    )

st.title("🤖 AI 聊天助手")

for message in st.session_state.memory.get_messages():
    if hasattr(message, "type"):
        with st.chat_message("user" if message.type == "human" else "assistant"):
            st.write(message.content)

user_input = st.chat_input("输入你的问题...")

if user_input:
    with st.chat_message("user"):
        st.write(user_input)

    with st.chat_message("assistant"):
        if st.session_state.chat_mode == "basic":
            chain = create_basic_chat_chain()
            response = chat_with_memory(
                chain,
                st.session_state.memory,
                user_input
            )
            st.write(response)
```

## 增强功能

### 流式输出

```python
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate

def create_streaming_chain():
    llm = ChatOpenAI(
        model="gpt-4",
        streaming=True
    )

    prompt = ChatPromptTemplate.from_messages([
        ("system", "你是一个友好的助手"),
        ("human", "{question}")
    ])

    chain = prompt | llm
    return chain
```

## 性能优化

### 异步处理

```python
import asyncio
from langchain_openai import ChatOpenAI

async def async_chat(question: str):
    chain = create_basic_chat_chain()
    return await chain.ainvoke({"question": question})
```

## 测试

```python
def test_memory():
    memory = ChatMemory()
    memory.save_context("你好", "你好！")
    history = memory.get_history()
    assert len(history) == 2

def test_basic_chain():
    chain = create_basic_chat_chain()
    result = chain.invoke({"question": "Hello", "history": []})
    assert isinstance(result, str)
    assert len(result) > 0
```

## 总结

本文实现了一个完整的 LangChain 聊天机器人：

| 模块 | 功能 |
|------|------|
| **memory** | 对话记忆管理 |
| **knowledge_base** | RAG 知识库 |
| **chains** | 多种聊天链 |
| **agents** | 工具调用 Agent |

核心特性：
- ✅ 多轮对话记忆
- ✅ 知识库问答 (RAG)
- ✅ 工具调用 Agent
- ✅ 流式输出
- ✅ 多聊天模式

这个项目可以作为开发更复杂 LLM 应用的基础。
