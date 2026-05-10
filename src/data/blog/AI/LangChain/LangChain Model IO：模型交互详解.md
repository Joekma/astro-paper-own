---
title: LangChain Model I/O：模型交互详解
author: Joekma
pubDatetime: 2026-05-07T00:00:00.000+08:00
modDatetime: 2026-05-07T00:00:00.000+08:00
slug: langchain-model-io
description: '深入讲解LangChain的Model I/O模块，包括LLMs、Chat Models、提示词管理和输出解析。'
tags:
  - LangChain
  - LLM
  - AI
draft: false
series: LangChain
language: zh-CN
---

## 概述

Model I/O 是 LangChain 的核心模块，负责管理与语言模型的所有交互操作。这个模块涵盖了从提示词构建、模型调用到输出解析的完整流程。

### Model I/O 架构

```
┌─────────────────────────────────────────────────────────────┐
│                      Model I/O                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐   │
│   │   Prompts   │ -> │    Models   │ -> │   Output    │   │
│   │  Management │    │   (LLMs)    │    │   Parsers   │   │
│   └─────────────┘    └─────────────┘    └─────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 模型类型

### LLMs vs Chat Models

LangChain 支持两种核心模型类型：

| 类型 | 说明 | API 方式 |
|------|------|---------|
| **LLMs** | 纯文本补全，将文本作为输入，返回文本 | `/completions` |
| **Chat Models** | 对话模型，将对话消息列表作为输入 | `/chat/completions` |

```python
# LLMs - 文本补全
from langchain_openai import OpenAI

llm = OpenAI(model="gpt-3.5-turbo-instruct")
response = llm.invoke("从前有座山，")
print(response)

# Chat Models - 对话交互
from langchain_openai import ChatOpenAI

chat = ChatOpenAI(model="gpt-4")
response = chat.invoke("你好，请介绍一下你自己")
print(response.content)
```

### 消息类型

Chat Models 使用结构化的消息类型：

| 消息类型 | 说明 | 角色 |
|---------|------|------|
| **SystemMessage** | 系统指令，设置助手行为 | system |
| **HumanMessage** | 用户输入 | user |
| **AIMessage** | 助手回复 | assistant |
| **FunctionMessage** | 函数调用结果 | function |
| **ToolMessage** | 工具执行结果 | tool |

```python
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage

# 构建对话
messages = [
    SystemMessage(content="你是一个专业的Python编程导师。"),
    HumanMessage(content="什么是装饰器？"),
    AIMessage(content="装饰器是Python中的一种高级特性..."),
    HumanMessage(content="能给我一个例子吗？"),
]

# 调用模型
response = chat.invoke(messages)
print(response.content)
```

## 提示词管理

### PromptTemplate

创建可复用的提示词模板：

```python
from langchain_core.prompts import PromptTemplate

# 简单模板
template = PromptTemplate.from_template("请将以下中文翻译成英文：{text}")
prompt = template.invoke({"text": "今天天气真好"})
print(prompt.to_string())

# 带多个变量的模板
detailed_template = PromptTemplate.from_template(
    """将以下{source_lang}文本翻译成{target_lang}：

    原文：{text}

    翻译结果："""
)

prompt = detailed_template.invoke({
    "source_lang": "中文",
    "target_lang": "英文",
    "text": "人工智能正在改变世界"
})
```

### ChatPromptTemplate

专为聊天模型设计的模板：

```python
from langchain_core.prompts import ChatPromptTemplate

# 构建聊天模板
chat_template = ChatPromptTemplate.from_messages([
    ("system", "你是一个{profession}，专业领域是{domain}。"),
    ("human", "你好，我需要了解{topic}。"),
    ("ai", "您好！关于{topic}，我可以为您提供以下信息..."),
    ("human", "能详细说说吗？")
])

# 生成提示词
prompt = chat_template.invoke({
    "profession": "数据科学家",
    "domain": "机器学习",
    "topic": "神经网络"
})

print(prompt.to_messages())
```

### 部分变量填充

```python
from langchain_core.prompts import PromptTemplate

# 创建模板
template = PromptTemplate(
    template="写一篇关于{topic}的{style}文章，字数约{word_count}字。",
    input_variables=["topic", "style", "word_count"]
)

# 部分填充
partial_template = template.partial(style="技术博客")
prompt = partial_template.invoke({
    "topic": "人工智能",
    "word_count": 1000
})
```

### 组合提示词

```python
from langchain_core.prompts import PromptTemplate, FewShotPromptTemplate

# 示例
examples = [
    {"word": "开心", "emotion": "happy"},
    {"word": "悲伤", "emotion": "sad"},
]

# 示例模板
example_prompt = PromptTemplate.from_template("单词：{word} -> 情感：{emotion}")

# Few-shot 提示词
few_shot_prompt = FewShotPromptTemplate(
    examples=examples,
    example_prompt=example_prompt,
    prefix="将以下中文单词分类为情感：",
    suffix="单词：{input} -> 情感：",
    input_variables=["input"]
)

prompt = few_shot_prompt.invoke({"input": "兴奋"})
print(prompt.to_string())
```

## 模型调用

### 同步调用

```python
from langchain_openai import ChatOpenAI

chat = ChatOpenAI(model="gpt-4", temperature=0.7, max_tokens=1000)

# 单次调用
response = chat.invoke("解释什么是区块链技术")
print(response.content)

# 批量调用
responses = chat.batch([
    "什么是Python？",
    "什么是Java？",
    "什么是Go？"
])
for resp in responses:
    print(resp.content)
```

### 异步调用

```python
import asyncio
from langchain_openai import ChatOpenAI

chat = ChatOpenAI(model="gpt-4")

async def async_call():
    response = await chat.ainvoke("异步编程有什么优势？")
    print(response.content)

asyncio.run(async_call())

# 批量异步
async def batch_async():
    responses = await chat.abatch([
        "问题1",
        "问题2",
        "问题3"
    ])
    return responses
```

### 流式输出

```python
from langchain_openai import ChatOpenAI

chat = ChatOpenAI(model="gpt-4", stream=True)

# 流式调用
for chunk in chat.stream("写一篇关于春天的散文"):
    print(chunk.content, end="", flush=True)
```

### 配置参数

| 参数 | 说明 | 取值范围 |
|------|------|---------|
| **model** | 模型名称 | gpt-4, gpt-3.5-turbo, claude-3 等 |
| **temperature** | 随机性控制 | 0.0 - 2.0 |
| **max_tokens** | 最大生成token数 | 正整数 |
| **top_p** | 核采样参数 | 0.0 - 1.0 |
| **frequency_penalty** | 频率惩罚 | -2.0 - 2.0 |
| **presence_penalty** | 存在惩罚 | -2.0 - 2.0 |
| **stop** | 停止序列 | 字符串列表 |

```python
chat = ChatOpenAI(
    model="gpt-4",
    temperature=0.7,      # 控制创造性
    max_tokens=2000,      # 最大输出长度
    top_p=0.9,            # 采样策略
    frequency_penalty=0.5, # 避免重复
    presence_penalty=0.5   # 鼓励新话题
)
```

## 输出解析器

### 常见解析器类型

| 解析器 | 用途 | 输出格式 |
|--------|------|---------|
| **JsonOutputParser** | JSON 结构化输出 | dict |
| **PydanticOutputParser** | Pydantic 模型验证 | 自定义对象 |
| **CommaSeparatedListOutputParser** | 逗号分隔列表 | List[str] |
| **MarkdownOutputParser** | Markdown 格式 | 结构化文本 |

### JSON 输出解析器

```python
from langchain_core.output_parsers import JsonOutputParser
from pydantic import BaseModel

# 定义数据结构
model = ChatOpenAI(model="gpt-4")
parser = JsonOutputParser()

# 创建链
chain = model | parser

# 调用
response = chain.invoke("返回一个JSON对象，包含一个人的姓名、年龄和职业")
print(response)  # {'name': '张三', 'age': 30, 'occupation': '工程师'}
```

### Pydantic 输出解析器

```python
from langchain_core.output_parsers import PydanticOutputParser
from pydantic import BaseModel, Field
from typing import List

# 定义 Pydantic 模型
class PersonInfo(BaseModel):
    name: str = Field(description="姓名")
    age: int = Field(description="年龄")
    occupation: str = Field(description="职业")
    skills: List[str] = Field(description="技能列表")

# 创建解析器
parser = PydanticOutputParser(pydantic_object=PersonInfo)

# 创建提示词
prompt = PromptTemplate.from_template(
    """提取以下文本中的人物信息：

    {query}

    {format_instructions}""",
    partial_variables={"format_instructions": parser.get_format_instructions()}
)

# 创建链
chain = prompt | model | parser

# 调用
result = chain.invoke({
    "query": "张三是一名30岁的软件工程师，擅长Python和Java开发"
})
print(result.name)
print(result.age)
print(result.skills)
```

### 列表解析器

```python
from langchain_core.output_parsers import CommaSeparatedListOutputParser

parser = CommaSeparatedListOutputParser()

# 创建链
chain = model | parser

# 调用
result = chain.invoke("列出Python的五个主要特性")
print(result)  # ['特性1', '特性2', '特性3', '特性4', '特性5']
```

## 与 LangChain Expression Language (LCEL) 集成

LangChain 提供了管道操作符来组合组件：

```python
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser

# 创建组件
model = ChatOpenAI(model="gpt-4")
parser = StrOutputParser()

# 使用管道符组合
chain = PromptTemplate.from_template("用一句话解释{concept}") | model | parser

# 调用
result = chain.invoke({"concept": "机器学习"})
print(result)
```

### 多步骤处理链

```python
from langchain_core.prompts import PromptTemplate
from langchain_openai import ChatOpenAI
from langchain_core.output_parsers import JsonOutputParser

# 步骤1：提取信息
extract_prompt = PromptTemplate.from_template(
    """从以下文本中提取关键信息，输出JSON格式：
    {text}
    """
)
extract_chain = extract_prompt | model | JsonOutputParser()

# 步骤2：生成摘要
summarize_prompt = PromptTemplate.from_template(
    """根据以下信息生成一段摘要：
    {info}
    """
)
summarize_chain = summarize_prompt | model | StrOutputParser()

# 组合链
full_chain = extract_chain | summarize_chain

# 执行
result = full_chain.invoke({
    "text": "Python是一种高级编程语言，由Guido van Rossum于1991年创建。它以简洁易读的语法著称。"
})
```

## 错误处理

```python
from langchain_openai import ChatOpenAI
from langchain_core.exceptions import OutputParserException

model = ChatOpenAI(model="gpt-4")

try:
    # 可能失败的操作
    result = chain.invoke({"invalid_input": "test"})
except OutputParserException as e:
    print(f"解析错误: {e}")
except Exception as e:
    print(f"其他错误: {e}")
```

## 最佳实践

| 实践 | 说明 |
|------|------|
| **使用模板** | 始终使用 PromptTemplate 而不是硬编码字符串 |
| **控制参数** | 根据任务调整 temperature 和 max_tokens |
| **错误处理** | 为模型调用添加适当的异常处理 |
| **流式输出** | 长文本生成使用流式提升用户体验 |
| **批量处理** | 批量任务使用 batch 方法提高效率 |
| **异步编程** | 生产环境优先使用异步 API |

## 总结

Model I/O 是 LangChain 的核心模块，掌握以下要点：

| 组件 | 核心功能 |
|------|---------|
| **LLMs** | 文本补全模型 |
| **Chat Models** | 对话交互模型 |
| **PromptTemplate** | 动态提示词构建 |
| **OutputParser** | 结构化输出解析 |
| **LCEL** | 组件组合表达式 |

熟练运用这些组件，可以构建强大的 LLM 应用工作流。
