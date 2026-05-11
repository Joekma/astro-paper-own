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
# 导入ChatOpenAI类
from langchain_openai import ChatOpenAI

# 创建聊天模型实例
chat = ChatOpenAI(model="gpt-4")

# 使用invoke方法发送消息
# 模型返回一个响应对象（通常是AIMessage类型）
response = chat.invoke("你好，请介绍一下你自己")

# 从响应中提取文本内容
print(response.content)
```

### 消息类型

Chat Models 使用结构化的消息类型：

| 消息类型 | 说明 | 角色 |
|---------|------|------|
| **SystemMessage** | 系统指令，设置助手行为 | system |
| **HumanMessage** | 用户输入 | user |
| **AIMessage** | 助手回复 | assistant |
| **ToolMessage** | 工具执行结果 | tool |

```python
# 导入各种消息类型
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage

# 构建多轮对话消息列表
# 每条消息都有角色和内容
messages = [
    # SystemMessage: 设定助手的角色和行为
    SystemMessage(content="你是一个专业的Python编程导师。"),
    # HumanMessage: 用户的第一条问题
    HumanMessage(content="什么是装饰器？"),
    # AIMessage: 助手的回答
    AIMessage(content="装饰器是Python中的一种高级特性..."),
    # HumanMessage: 用户的后续追问
    HumanMessage(content="能给我一个例子吗？"),
]

# 将消息列表发送给聊天模型
response = chat.invoke(messages)
# 打印助手的回复
print(response.content)
```

## 提示词管理

### PromptTemplate

创建可复用的提示词模板：

```python
# 导入PromptTemplate类
from langchain_core.prompts import PromptTemplate

# 简单模板：使用{text}作为占位符
# from_template会从字符串中自动提取占位符
template = PromptTemplate.from_template("请将以下中文翻译成英文：{text}")

# invoke方法填充模板中的占位符
prompt = template.invoke({"text": "今天天气真好"})
# 打印填充后的提示词字符串
print(prompt.to_string())

# 多参数模板：演示如何处理多个变量
detailed_template = PromptTemplate.from_template(
    "将以下{source_lang}文本翻译成{target_lang}：\n\n"
    "原文：{text}\n\n"
    "翻译结果："
)

# 传入所有参数的值
prompt = detailed_template.invoke({
    "source_lang": "中文",
    "target_lang": "英文",
    "text": "人工智能正在改变世界"
})
```

### ChatPromptTemplate

专为聊天模型设计的模板：

```python
# 导入ChatPromptTemplate类
from langchain_core.prompts import ChatPromptTemplate

# 使用元组格式创建聊天模板
# 格式：(角色类型, 内容)
# 支持的元组格式："system", "human", "ai", "placeholder"
chat_template = ChatPromptTemplate.from_messages([
    # 系统消息：使用大括号定义动态参数
    ("system", "你是一个{profession}，专业领域是{domain}。"),
    # 用户消息：使用大括号定义动态参数
    ("human", "你好，我需要了解{topic}。"),
    # AI消息：模拟AI的回复（可选）
    ("ai", "您好！关于{topic}，我可以为您提供以下信息..."),
    # 用户后续问题
    ("human", "能详细说说吗？")
])

# 调用invoke填充所有参数
prompt = chat_template.invoke({
    "profession": "数据科学家",
    "domain": "机器学习",
    "topic": "神经网络"
})

# 转换为消息列表格式
print(prompt.to_messages())
```

### 部分变量填充

```python
# 导入PromptTemplate类
from langchain_core.prompts import PromptTemplate

# 创建模板，指定需要填充的变量
template = PromptTemplate(
    template="写一篇关于{topic}的{style}文章，字数约{word_count}字。",
    # 明确声明输入变量（也可通过from_template自动推断）
    input_variables=["topic", "style", "word_count"]
)

# 部分填充：先填充部分变量，生成新的模板
# 这样可以复用部分填充后的模板
partial_template = template.partial(style="技术博客")

# 填充剩余的变量
prompt = partial_template.invoke({
    "topic": "人工智能",
    "word_count": 1000
})
```

### 组合提示词

```python
# 导入提示词相关类
from langchain_core.prompts import PromptTemplate, FewShotPromptTemplate

# 定义示例数据（Few-shot Learning 所需的例子）
examples = [
    {"word": "开心", "emotion": "happy"},
    {"word": "悲伤", "emotion": "sad"},
]

# 创建示例模板：定义单个示例的格式
example_prompt = PromptTemplate.from_template("单词：{word} -> 情感：{emotion}")

# 创建Few-shot提示词模板
# 用于提供多个示例来指导模型输出
few_shot_prompt = FewShotPromptTemplate(
    examples=examples,              # 示例列表
    example_prompt=example_prompt,  # 单个示例的格式模板
    prefix="将以下中文单词分类为情感：",  # 前缀提示
    suffix="单词：{input} -> 情感：",    # 后缀，用户输入在这里插入
    input_variables=["input"]       # 用户需要提供的变量
)

# 传入用户输入，生成完整提示词
prompt = few_shot_prompt.invoke({"input": "兴奋"})
# 打印生成的提示词
print(prompt.to_string())
```

## 模型调用

### 同步调用

```python
# 导入ChatOpenAI类
from langchain_openai import ChatOpenAI

# 创建聊天模型实例
# temperature: 控制输出的随机性，值越高越有创造性
# max_tokens: 限制生成的最大token数
chat = ChatOpenAI(model="gpt-4", temperature=0.7, max_tokens=1000)

# 单个请求：使用invoke方法
response = chat.invoke("解释什么是区块链技术")
print(response.content)

# 批量请求：使用batch方法并行处理多个请求
responses = chat.batch([
    "什么是Python？",
    "什么是Java？",
    "什么是Go？"
])

# 遍历并打印每个响应
for resp in responses:
    print(resp.content)
```

### 异步调用

```python
# 导入asyncio用于异步编程
import asyncio
from langchain_openai import ChatOpenAI

# 创建聊天模型实例
chat = ChatOpenAI(model="gpt-4")

# 定义异步函数处理单个请求
async def async_call():
    # 使用ainvoke方法进行异步调用
    response = await chat.ainvoke("异步编程有什么优势？")
    print(response.content)

# 运行异步函数
asyncio.run(async_call())

# 定义异步函数处理批量请求
async def batch_async():
    # 使用abatch方法并行处理多个异步请求
    responses = await chat.abatch([
        "问题1",
        "问题2",
        "问题3"
    ])
    return responses
```

### 流式输出

```python
# 导入ChatOpenAI类
from langchain_openai import ChatOpenAI

# 创建聊天模型实例（stream参数可能需要根据实际API调整）
chat = ChatOpenAI(model="gpt-4", stream=True)

# 使用stream方法获取流式响应
# 返回的是一个生成器，每次yield一个响应块
for chunk in chat.stream("写一篇关于春天的散文"):
    # chunk.content 包含每个响应片段的内容
    # end="" 不换行，flush=True 立即刷新输出
    print(chunk.content, end="", flush=True)
```

### 配置参数

| 参数 | 说明 | 取值范围 |
|------|------|---------|
| **model** | 模型名称 | gpt-4, gpt-3.5-turbo, claude-3 等 |
| **temperature** | 随机性控制 | 0.0 - 2.0 |
| **max_tokens** | 最大生成token数 | 正整数 |
| **top_p** | 核采样参数 | 0.0 - 1.0 |

```python
chat = ChatOpenAI(
    model="gpt-4",
    temperature=0.7,
    max_tokens=2000,
    top_p=0.9
)
```

## 输出解析器

### 常见解析器类型

| 解析器 | 用途 | 输出格式 |
|--------|------|---------|
| **JsonOutputParser** | JSON 结构化输出 | dict |
| **PydanticOutputParser** | Pydantic 模型验证 | 自定义对象 |
| **CommaSeparatedListOutputParser** | 逗号分隔列表 | List[str] |
| **StrOutputParser** | 字符串输出 | str |

### JSON 输出解析器

```python
# 导入所需的组件
from langchain_core.output_parsers import JsonOutputParser  # JSON解析器
from langchain_openai import ChatOpenAI  # 聊天模型
from langchain_core.prompts import PromptTemplate  # 提示词模板

# 创建模型实例
model = ChatOpenAI(model="gpt-4")

# 创建JSON输出解析器
# 解析器会自动从模型响应中提取并解析JSON
parser = JsonOutputParser()

# 创建提示词模板
# {format_instructions} 是解析器提供的格式说明
chain = PromptTemplate.from_template(
    """返回一个JSON对象，包含一个人的姓名、年龄和职业。

    {format_instructions}

    只返回JSON，不要其他内容。"""
) | model | parser

# 调用链，传入格式说明
response = chain.invoke({
    "format_instructions": parser.get_format_instructions()
})

# response 现在是一个Python字典
print(response)
```

### Pydantic 输出解析器

```python
# 导入所需的组件
from langchain_core.output_parsers import PydanticOutputParser  # Pydantic解析器
from langchain_openai import ChatOpenAI  # 聊天模型
from langchain_core.prompts import PromptTemplate  # 提示词模板
from pydantic import BaseModel, Field  # Pydantic数据模型
from typing import List  # 类型注解

# 定义Pydantic模型，指定期望的数据结构
class PersonInfo(BaseModel):
    # name字段：字符串类型，description用于生成格式说明
    name: str = Field(description="姓名")
    # age字段：整数类型
    age: int = Field(description="年龄")
    # occupation字段：字符串类型
    occupation: str = Field(description="职业")
    # skills字段：字符串列表
    skills: List[str] = Field(description="技能列表")

# 创建Pydantic解析器
parser = PydanticOutputParser(pydantic_object=PersonInfo)

# 创建提示词模板
# 使用partial_variables预先填充格式说明
prompt = PromptTemplate.from_template(
    """提取以下文本中的人物信息：

    {query}

    {format_instructions}""",
    partial_variables={"format_instructions": parser.get_format_instructions()}
)

# 构建链：模板 -> 模型 -> 解析器
chain = prompt | model | parser

# 调用链并传入文本
result = chain.invoke({
    "query": "张三是一名30岁的软件工程师，擅长Python和Java开发"
})

# result是PersonInfo对象，可以直接访问属性
print(result.name)
print(result.age)
print(result.skills)
```

### 列表解析器

```python
# 导入逗号分隔列表解析器
from langchain_core.output_parsers import CommaSeparatedListOutputParser
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate

# 创建解析器实例
parser = CommaSeparatedListOutputParser()

# 创建提示词模板
chain = PromptTemplate.from_template(
    """列出Python的五个主要特性，使用逗号分隔。

    {format_instructions}"""
) | model | parser

# 调用链，结果直接是列表类型
result = chain.invoke({})
# result = ["特性1", "特性2", ...]
print(result)
```

## 与 LangChain Expression Language (LCEL) 集成

LangChain 提供了管道操作符来组合组件：

```python
# 导入所需的组件
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser

# 创建模型和解析器实例
model = ChatOpenAI(model="gpt-4")
parser = StrOutputParser()

# 使用LCEL管道操作符组合组件
# 数据流向：PromptTemplate -> ChatOpenAI -> StrOutputParser
chain = PromptTemplate.from_template("用一句话解释{concept}") | model | parser

# 调用链并传入参数
result = chain.invoke({"concept": "机器学习"})
print(result)
```

### 多步骤处理链

```python
# 导入所需的组件
from langchain_core.prompts import PromptTemplate
from langchain_openai import ChatOpenAI
from langchain_core.output_parsers import JsonOutputParser, StrOutputParser

# 创建模型实例
model = ChatOpenAI(model="gpt-4")

# 第一步链：提取信息并输出JSON
extract_prompt = PromptTemplate.from_template(
    """从以下文本中提取关键信息，输出JSON格式：
    {text}
    """
)
# 提取链：模板 -> 模型 -> JSON解析器
extract_chain = extract_prompt | model | JsonOutputParser()

# 第二步链：基于JSON生成摘要
summarize_prompt = PromptTemplate.from_template(
    """根据以下信息生成一段摘要：
    {info}
    """
)
# 摘要链：模板 -> 模型 -> 字符串解析器
summarize_chain = summarize_prompt | model | StrOutputParser()

# 组合链：将提取链的输出作为摘要链的输入
# extract_chain输出的字典中，"text"键会成为summarize_chain的输入
full_chain = extract_chain | summarize_chain

# 调用完整链
result = full_chain.invoke({
    "text": "Python是一种高级编程语言，由Guido van Rossum于1991年创建。它以简洁易读的语法著称。"
})
```

## 错误处理

```python
# 导入所需的组件
from langchain_openai import ChatOpenAI
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.exceptions import OutputParserException

# 创建模型和解析器
model = ChatOpenAI(model="gpt-4")
parser = JsonOutputParser()

# 构建链
chain = PromptTemplate.from_template("返回JSON：{text}") | model | parser

try:
    # 尝试调用链
    result = chain.invoke({"text": "some text"})
except OutputParserException as e:
    # 捕获解析器异常（模型输出不符合JSON格式）
    print(f"解析错误: {e}")
except Exception as e:
    # 捕获其他异常（网络错误、API错误等）
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
| **Chat Models** | 对话交互模型 |
| **PromptTemplate** | 动态提示词构建 |
| **OutputParser** | 结构化输出解析 |
| **LCEL** | 组件组合表达式 |

熟练运用这些组件，可以构建强大的 LLM 应用工作流。
