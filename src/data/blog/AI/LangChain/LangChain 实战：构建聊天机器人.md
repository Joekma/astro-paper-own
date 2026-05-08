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
# 创建虚拟环境
python -m venv chatbot-env
source chatbot-env/bin/activate  # Linux/Mac
# 或
chatbot-env\Scripts\activate  # Windows

# 安装依赖
pip install langchain-openai langchain-community
pip install langchain
pip install streamlit  # 用于简单的前端
pip install python-dotenv
pip install chromadb  # 向量数据库
```

### 项目结构

```
chatbot_project/
├── config.py           # 配置
├── memory.py           # 对话记忆
├── knowledge_base.py   # 知识库
├── chains.py           # 聊天链
├── agents.py           # Agent
├── app.py             # 主应用
└── requirements.txt
```

## 配置管理

### config.py

```python
import os
from dotenv import load_dotenv

load_dotenv()

# API 配置
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
MODEL_NAME = "gpt-4"
TEMPERATURE = 0.7

# 向量数据库配置
VECTOR_STORE_PATH = "./vectorstore"
EMBEDDING_MODEL = "text-embedding-ada-002"

# 对话配置
MAX_HISTORY_LENGTH = 10
MAX_TOKEN_LIMIT = 2000
```

## 对话记忆模块

### memory.py

```python
from langchain.memory import ConversationBufferMemory
from langchain.memory import ConversationSummaryMemory
from langchain.memory import CombinedMemory
from langchain_openai import ChatOpenAI
from config import MODEL_NAME, MAX_TOKEN_LIMIT

def create_memory():
    """创建组合记忆"""
    llm = ChatOpenAI(model=MODEL_NAME, temperature=0)

    # 对话缓冲记忆
    conv_memory = ConversationBufferMemory(
        memory_key="conv_history",
        return_messages=True,
        max_token_limit=MAX_TOKEN_LIMIT
    )

    # 摘要记忆
    summary_memory = ConversationSummaryMemory(
        llm=llm,
        memory_key="summary",
        return_messages=True
    )

    # 组合记忆
    memory = CombinedMemory(
        memories=[conv_memory, summary_memory]
    )

    return memory

class ChatMemory:
    """对话记忆管理器"""

    def __init__(self):
        self.memory = create_memory()
        self.session_id = None

    def save_context(self, user_input: str, ai_output: str):
        """保存对话上下文"""
        self.memory.save_context(
            {"input": user_input},
            {"output": ai_output}
        )

    def get_history(self) -> dict:
        """获取对话历史"""
        return self.memory.load_memory_variables({})

    def clear(self):
        """清空记忆"""
        self.memory.clear()

    def get_messages(self):
        """获取消息列表"""
        return self.memory.chat_memory.messages
```

## 知识库模块

### knowledge_base.py

```python
from langchain_community.document_loaders import TextLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_core.retrievers import VectorStoreRetriever
from config import VECTOR_STORE_PATH, EMBEDDING_MODEL
import os

class KnowledgeBase:
    """知识库管理器"""

    def __init__(self):
        self.embeddings = OpenAIEmbeddings(model=EMBEDDING_MODEL)
        self.vectorstore = None
        self.retriever = None

    def load_documents(self, documents_path: str):
        """加载文档"""
        loader = TextLoader(documents_path)
        documents = loader.load()

        # 分割文档
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len
        )
        texts = splitter.split_documents(documents)

        # 创建向量存储
        self.vectorstore = Chroma.from_documents(
            documents=texts,
            embedding=self.embeddings,
            persist_directory=VECTOR_STORE_PATH
        )
        self.vectorstore.persist()

        # 创建检索器
        self.retriever = self.vectorstore.as_retriever(
            search_type="similarity",
            search_kwargs={"k": 5}
        )

    def load_existing(self):
        """加载已有知识库"""
        if os.path.exists(VECTOR_STORE_PATH):
            self.vectorstore = Chroma(
                persist_directory=VECTOR_STORE_PATH,
                embedding_function=self.embeddings
            )
            self.retriever = self.vectorstore.as_retriever(
                search_kwargs={"k": 5}
            )
            return True
        return False

    def get_retriever(self):
        """获取检索器"""
        return self.retriever

    def query(self, question: str, k: int = 5):
        """查询知识库"""
        if not self.retriever:
            return []

        docs = self.retriever.invoke(question)
        return docs
```

## 聊天链模块

### chains.py

```python
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.chains.conversational_retrieval.base import (
    ConversationalRetrievalChain
)
from langchain.chains.llm import LLMChain
from langchain_core.output_parsers import StrOutputParser
from memory import ChatMemory
from knowledge_base import KnowledgeBase
from config import MODEL_NAME, TEMPERATURE

def create_basic_chat_chain(memory: ChatMemory):
    """创建基础聊天链"""
    llm = ChatOpenAI(model=MODEL_NAME, temperature=TEMPERATURE)

    prompt = ChatPromptTemplate.from_messages([
        ("system", """你是一个友好的AI助手，名字叫小智。
        你应该：
        1. 回答专业、准确
        2. 使用友好、亲切的语气
        3. 如果不确定，说"我不确定"
        4. 不要编造信息

        对话历史摘要：{summary}"""),
        MessagesPlaceholder(variable_name="history"),
        ("human", "{question}")
    ])

    chain = LLMChain(
        llm=llm,
        prompt=prompt,
        memory=memory.memory,
        output_parser=StrOutputParser()
    )

    return chain

def create_rag_chat_chain(memory: ChatMemory, knowledge_base: KnowledgeBase):
    """创建带知识库的聊天链"""
    llm = ChatOpenAI(model=MODEL_NAME, temperature=TEMPERATURE)

    # RAG 问答链
    rag_chain = ConversationalRetrievalChain.from_llm(
        llm=llm,
        retriever=knowledge_base.get_retriever(),
        memory=memory.memory,
        condense_prompt=ChatPromptTemplate.from_template(
            """根据对话历史，重写用户问题使其独立完整。

            历史：
            {chat_history}

            问题：{question}

            独立问题："""
        ),
        combine__docs_chain_kwargs={
            "prompt": ChatPromptTemplate.from_template(
                """基于以下参考内容回答问题。如果参考内容没有相关信息，
                说明你不知道，不要编造。

                参考内容：
                {context}

                问题：{question}

                回答："""
            )
        }
    )

    return rag_chain

def create_general_chat_chain():
    """创建通用聊天链"""
    llm = ChatOpenAI(model=MODEL_NAME, temperature=TEMPERATURE)

    prompt = ChatPromptTemplate.from_messages([
        ("system", """你是一个智能助手，可以回答各种问题。
        请用简洁、专业的语言回答。"""),
        ("human", "{question}")
    ])

    chain = prompt | llm | StrOutputParser()
    return chain
```

## Agent 模块

### agents.py

```python
from langchain.agents import Agent, tool, AgentExecutor
from langchain.agents.agent_types import AgentType
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain.chains.llm import LLMChain
from config import MODEL_NAME

@tool
def calculator(expression: str) -> str:
    """执行数学计算

    Args:
        expression: 数学表达式，如 "2+3*5"
    """
    try:
        result = eval(expression)
        return f"计算结果：{result}"
    except Exception as e:
        return f"计算错误：{str(e)}"

@tool
def date_query(command: str) -> str:
    """获取当前日期或计算日期

    Args:
        command: "today" 或日期偏移，如 "+3days"
    """
    from datetime import datetime, timedelta

    if command == "today":
        return datetime.now().strftime("%Y年%m月%d日")
    elif "days" in command:
        days = int(command.replace("days", "").replace("+", "").strip())
        result = datetime.now() + timedelta(days=days)
        return result.strftime("%Y年%m月%d日")
    return "不支持的命令"

def create_tool_agent():
    """创建工具Agent"""
    llm = ChatOpenAI(model=MODEL_NAME, temperature=0)

    tools = [calculator, date_query]

    prompt = ChatPromptTemplate.from_messages([
        ("system", """你是一个智能助手，可以使用工具来回答问题。

        可用工具：
        - calculator: 计算数学表达式
        - date_query: 查询日期"""),
        ("human", "{input}"),
        MessagesPlaceholder(variable_name="agent_scratchpad")
    ])

    agent = Agent.from_agent_type(
        agent_type=AgentType.ZERO_SHOT_REACT_DESCRIPTION,
        llm=llm,
        tools=tools,
        prompt=prompt
    )

    executor = AgentExecutor(
        agent=agent,
        tools=tools,
        verbose=True
    )

    return executor

# 修复导入
from langchain_core.messages import MessagesPlaceholder
```

## 主应用

### app.py

```python
import streamlit as st
from langchain_core.callbacks import BaseCallbackHandler
from memory import ChatMemory, create_memory
from knowledge_base import KnowledgeBase
from chains import (
    create_basic_chat_chain,
    create_rag_chat_chain,
    create_general_chat_chain
)
from agents import create_tool_agent
from config import MODEL_NAME
import os

# 页面配置
st.set_page_config(
    page_title="AI 聊天助手",
    page_icon="🤖",
    layout="wide"
)

# 自定义回调处理器
class StreamlitCallbackHandler(BaseCallbackHandler):
    def __init__(self, container):
        self.container = container
        self.text_area = None

    def on_llm_start(self, serialized, prompts, **kwargs):
        self.text_area = self.container.empty()

    def on_llm_new_token(self, token, **kwargs):
        if self.text_area:
            self.text_area.markdown(token)

# 初始化会话状态
if "memory" not in st.session_state:
    st.session_state.memory = ChatMemory()

if "chat_mode" not in st.session_state:
    st.session_state.chat_mode = "basic"

if "knowledge_base" not in st.session_state:
    st.session_state.knowledge_base = KnowledgeBase()

# 侧边栏设置
with st.sidebar:
    st.title("⚙️ 设置")

    # 聊天模式选择
    st.session_state.chat_mode = st.selectbox(
        "选择聊天模式",
        ["basic", "rag", "agent", "general"],
        format_func=lambda x: {
            "basic": "💬 基础对话",
            "rag": "📚 知识库问答",
            "agent": "🛠️ 工具助手",
            "general": "🌐 通用助手"
        }[x]
    )

    # 知识库管理
    if st.session_state.chat_mode == "rag":
        st.subheader("📚 知识库管理")

        uploaded_file = st.file_uploader(
            "上传知识库文件",
            type=["txt"]
        )

        if uploaded_file:
            if st.button("加载知识库"):
                with open("temp_knowledge.txt", "wb") as f:
                    f.write(uploaded_file.getvalue())
                st.session_state.knowledge_base.load_documents("temp_knowledge.txt")
                st.success("知识库加载成功！")

        if st.button("清空知识库"):
            st.session_state.knowledge_base = KnowledgeBase()
            st.success("知识库已清空")

    # 清空对话
    if st.button("🗑️ 清空对话"):
        st.session_state.memory = ChatMemory()
        st.rerun()

# 主界面
st.title("🤖 AI 聊天助手")

# 显示聊天历史
for message in st.session_state.memory.get_messages():
    if hasattr(message, "type"):
        if message.type == "human":
            with st.chat_message("user"):
                st.write(message.content)
        else:
            with st.chat_message("assistant"):
                st.write(message.content)

# 用户输入
user_input = st.chat_input("输入你的问题...")

if user_input:
    with st.chat_message("user"):
        st.write(user_input)

    with st.chat_message("assistant"):
        with st.spinner("思考中..."):
            try:
                # 根据模式选择不同的链
                if st.session_state.chat_mode == "basic":
                    chain = create_basic_chat_chain(st.session_state.memory)
                    response = chain.invoke(
                        {"question": user_input},
                        config={"callbacks": [StreamlitCallbackHandler(st.container())]}
                    )
                    answer = response.get("text", response) if isinstance(response, dict) else response

                elif st.session_state.chat_mode == "rag":
                    if st.session_state.knowledge_base.get_retriever():
                        chain = create_rag_chat_chain(
                            st.session_state.memory,
                            st.session_state.knowledge_base
                        )
                        response = chain.invoke({"question": user_input})
                        answer = response["answer"]
                    else:
                        answer = "请先在侧边栏上传知识库文件"

                elif st.session_state.chat_mode == "agent":
                    executor = create_tool_agent()
                    response = executor.invoke({"input": user_input})
                    answer = response["output"]

                else:  # general
                    chain = create_general_chat_chain()
                    answer = chain.invoke({"question": user_input})

                st.write(answer)

                # 保存到记忆
                st.session_state.memory.save_context(user_input, answer)

            except Exception as e:
                st.error(f"发生错误：{str(e)}")

# 运行命令
if __name__ == "__main__":
    os.system("streamlit run app.py")
```

## 增强功能

### 流式输出

```python
from langchain.callbacks.streaming_stdout import StreamingStdOutCallbackHandler
from langchain_openai import ChatOpenAI

def create_streaming_chain():
    """创建支持流式输出的链"""
    llm = ChatOpenAI(
        model=MODEL_NAME,
        streaming=True,
        callbacks=[StreamingStdOutCallbackHandler()]
    )

    prompt = ChatPromptTemplate.from_messages([
        ("system", "你是一个友好的助手"),
        ("human", "{question}")
    ])

    chain = prompt | llm
    return chain
```

### 多轮对话优化

```python
def create_contextual_chat_chain(memory: ChatMemory):
    """创建带上下文的聊天链"""
    llm = ChatOpenAI(model=MODEL_NAME, temperature=0)

    # 动态构建提示词
    def get_prompt(inputs):
        history = memory.get_history()
        return f"""基于以下上下文回答问题：

        对话历史：{history.get('conv_history', '')}

        摘要：{history.get('summary', '')}

        问题：{inputs['question']}

        回答："""

    chain = LLMChain(
        llm=llm,
        prompt=PromptTemplate.from_template(get_prompt({})),
        callbacks=[StreamingStdOutCallbackHandler()]
    )

    return chain
```

## 部署说明

### 使用 Docker

```dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

EXPOSE 8501

CMD ["streamlit", "run", "app.py", "--server.address", "0.0.0.0"]
```

### requirements.txt

```
langchain>=0.1.0
langchain-openai>=0.0.2
langchain-community>=0.0.10
streamlit>=1.30.0
python-dotenv>=1.0.0
chromadb>=0.4.0
openai>=1.0.0
```

### 环境变量

```bash
# .env
OPENAI_API_KEY=your-api-key-here
```

## 测试

### 单元测试

```python
import pytest
from memory import ChatMemory
from chains import create_general_chat_chain

def test_memory():
    memory = ChatMemory()
    memory.save_context("你好", "你好！")
    history = memory.get_history()
    assert "conv_history" in history

def test_basic_chain():
    chain = create_general_chat_chain()
    result = chain.invoke({"question": "Hello"})
    assert isinstance(result, str)
    assert len(result) > 0

if __name__ == "__main__":
    pytest.main([__file__])
```

## 性能优化

### 缓存优化

```python
from functools import lru_cache

@lru_cache(maxsize=100)
def cached_embedding(text: str):
    """缓存嵌入结果"""
    return embeddings.embed_query(text)
```

### 异步处理

```python
import asyncio
from langchain_openai import ChatOpenAI

async def async_chat(question: str):
    llm = ChatOpenAI(model=MODEL_NAME)
    chain = prompt | llm | StrOutputParser()
    return await chain.ainvoke({"question": question})

# 批量异步调用
async def batch_chat(questions: list):
    tasks = [async_chat(q) for q in questions]
    return await asyncio.gather(*tasks)
```

## 常见问题

### Q1：如何处理长对话？

```python
# 设置 token 限制
memory = ConversationBufferMemory(
    max_token_limit=2000,
    memory_key="history"
)
```

### Q2：如何实现多用户隔离？

```python
# 每个用户独立的记忆
def get_user_memory(user_id: str) -> ChatMemory:
    if user_id not in st.session_state:
        st.session_state[user_id] = ChatMemory()
    return st.session_state[user_id]
```

### Q3：如何添加更多工具？

```python
@tool
def search_database(query: str) -> str:
    """搜索数据库"""
    # 实现搜索逻辑
    return results

# 添加到 Agent
tools = [calculator, date_query, search_database]
```

## 总结

本文实现了一个完整的 LangChain 聊天机器人：

| 模块 | 功能 |
|------|------|
| **memory** | 对话记忆管理 |
| **knowledge_base** | RAG 知识库 |
| **chains** | 多种聊天链 |
| **agents** | 工具调用 Agent |
| **app** | Streamlit 前端 |

核心特性：
- ✅ 多轮对话记忆
- ✅ 知识库问答 (RAG)
- ✅ 工具调用 Agent
- ✅ 流式输出
- ✅ 多聊天模式

这个项目可以作为开发更复杂 LLM 应用的基础。
