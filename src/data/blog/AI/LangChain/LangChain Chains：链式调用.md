---
title: LangChain Chains：链式调用
author: Joekma
pubDatetime: 2026-05-07T00:00:00.000+08:00
modDatetime: 2026-05-07T00:00:00.000+08:00
slug: langchain-chains
description: '深入讲解LangChain的Chain模块，包括LLMChain、SequentialChain、自定义链和LCEL表达式。'
tags:
  - LangChain
  - Chain
  - LLM
draft: false
series: LangChain
language: zh-CN
---

## 概述

Chain（链）是 LangChain 的核心概念之一，它允许我们将多个组件组合在一起，形成一个连贯的工作流程。通过链式调用，可以将提示词模板、模型、输出解析器等组件串联起来，实现复杂的 LLM 应用。

### 为什么需要 Chain？

| 需求 | 解决方案 |
|------|---------|
| 单次调用无法完成任务 | 将任务分解为多个步骤 |
| 需要复用处理流程 | 创建可复用的链 |
| 多模型协作 | 组合多个模型 |
| 后处理输出 | 添加解析和转换 |

### Chain 类型概览

```
┌─────────────────────────────────────────────────────────────┐
│                      Chain 类型                             │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   LLMChain    │  │  Sequential  │  │  Transform   │     │
│  │              │  │    Chain     │  │    Chain     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  RouterChain │  │  RetrievalQA │  │  Custom Chain │    │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

## LLMChain

### 基础用法（新版本推荐 LCEL）

LLMChain 是最基本的链类型，将提示词模板和语言模型结合：

```python
# 导入所需的组件
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser

# 创建LLM实例，设置temperature控制随机性
llm = ChatOpenAI(model="gpt-4", temperature=0.7)

# 创建提示词模板
# 模板中有两个占位符：topic（主题）和 style（风格）
template = PromptTemplate.from_template(
    """你是一个创意写作助手。请为以下主题写一首诗：

    主题：{topic}
    风格：{style}

    诗歌："""
)

# 使用LCEL构建链：模板 -> 模型 -> 解析器
chain = template | llm | StrOutputParser()

# 调用链并传入参数
result = chain.invoke({
    "topic": "春天",
    "style": "现代诗"
})

print(result)
```

### 使用 LLMChain 类

```python
# 导入所需的组件
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate
from langchain.chains import LLMChain

# 创建LLM实例
llm = ChatOpenAI(model="gpt-4")

# 创建提示词模板
# output_variables指定模板输出的变量名
template = PromptTemplate.from_template(
    """分析以下产品并提供反馈：

    产品：{product}

    请提供：
    1. 优点：{pros}
    2. 缺点：{cons}
    3. 建议：{suggestions}""",
    output_variables=["pros", "cons", "suggestions"]
)

# 创建LLMChain实例，关联模型和模板
chain = LLMChain(llm=llm, prompt=template)

# 调用链，返回包含各个输出变量的字典
result = chain.invoke({"product": "某款智能手机"})

# 从结果字典中提取各个字段
print(f"优点：{result['pros']}")
print(f"缺点：{result['cons']}")
print(f"建议：{result['suggestions']}")
```

## LCEL 管道组合

LangChain Expression Language (LCEL) 提供了更简洁的链式 API：

### 基础管道

```python
# 导入所需的组件
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser

# 创建LLM实例
llm = ChatOpenAI(model="gpt-4")

# 使用LCEL管道操作符组合组件
# 简洁写法：一个模板 + 一个模型 + 一个解析器
chain = PromptTemplate.from_template("解释{topic}") | llm | StrOutputParser()

# 调用链
result = chain.invoke({"topic": "区块链"})
print(result)
```

### 动态链

```python
# 导入所需的组件
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate

# 创建LLM实例
llm = ChatOpenAI(model="gpt-4")

# 根据任务类型返回不同的模板
def get_template(task: str) -> PromptTemplate:
    templates = {
        "summary": PromptTemplate.from_template("总结：{text}"),
        "translate": PromptTemplate.from_template("翻译成英文：{text}"),
        "analyze": PromptTemplate.from_template("分析：{text}"),
    }
    return templates.get(task, templates["summary"])

# 根据任务动态创建链
def create_chain(task: str):
    template = get_template(task)
    return template | llm

# 使用链
chain = create_chain("summary")
result = chain.invoke({"task": "总结", "text": "LangChain很强大"})
```

## Sequential Chain

### SimpleSequentialChain（新版本）

单输入单输出的顺序链：

```python
# 导入所需的组件
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser

# 创建LLM实例
llm = ChatOpenAI(model="gpt-4")

# 第一个链：生成故事
# 输入：character（角色名）
# 输出：story（故事内容）
chain1 = PromptTemplate.from_template(
    """为一个{character}写一个简短的冒险故事（100字以内）。
    角色：{character}"""
) | llm

# 第二个链：翻译故事
# 输入：story（故事内容）
# 输出：翻译后的英文故事
chain2 = PromptTemplate.from_template(
    """将以下故事翻译成英文：
    {story}"""
) | llm

# 使用管道操作符组合两个链
# 数据流向：chain1输出 -> chain2输入 -> StrOutputParser
sequential_chain = chain1 | chain2 | StrOutputParser()

# 调用链，只需传入第一个链的输入
result = sequential_chain.invoke({
    "character": "勇敢的小骑士"
})

print(result)
```

### SequentialChain

多输入多输出的顺序链：

```python
# 导入所需的组件
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate
from langchain.chains import SequentialChain

# 创建LLM实例
llm = ChatOpenAI(model="gpt-4")

# 第一个链：分析文章
# 输入：article
# 输出：main_points（主要观点）
chain1 = LLMChain(
    llm=llm,
    prompt=PromptTemplate.from_template(
        """分析以下文章的主要观点：

        文章：{article}

        主要观点："""
    ),
    output_key="main_points"  # 指定输出变量名
)

# 第二个链：生成摘要
# 输入：main_points
# 输出：summary（中文摘要）
chain2 = LLMChain(
    llm=llm,
    prompt=PromptTemplate.from_template(
        """根据以下观点写一段摘要：

        观点：{main_points}

        摘要："""
    ),
    output_key="summary"
)

# 第三个链：翻译摘要
# 输入：summary
# 输出：english_summary（英文摘要）
chain3 = LLMChain(
    llm=llm,
    prompt=PromptTemplate.from_template(
        """将以下中文摘要翻译成英文：

        {summary}

        英文摘要："""
    ),
    output_key="english_summary"
)

# 创建顺序链，串联三个链
# 每个链的输出会作为下一个链的输入
full_chain = SequentialChain(
    chains=[chain1, chain2, chain3],
    input_variables=["article"],  # 只需要提供初始输入
    output_variables=["main_points", "summary", "english_summary"],  # 所有输出变量
)

# 调用链
result = full_chain.invoke({
    "article": "人工智能技术正在快速发展..."
})

# 提取各个阶段的输出
print(f"主要观点：{result['main_points']}")
print(f"中文摘要：{result['summary']}")
print(f"英文摘要：{result['english_summary']}")
```

## TransformChain

用于数据转换的链：

```python
# 导入TransformChain和RunnableLambda
from langchain.chains import TransformChain
from langchain_core.runnables import RunnableLambda

# 定义数据转换函数
# 输入：包含"text"键的字典
# 输出：包含处理结果的字典
def transform_function(inputs: dict) -> dict:
    text = inputs["text"]
    # 按换行符分割文本为行
    lines = text.split("\n")
    return {"lines": lines, "line_count": len(lines)}

# 创建TransformChain
transform_chain = TransformChain(
    input_variables=["text"],      # 输入变量列表
    output_variables=["lines", "line_count"],  # 输出变量列表
    transform=transform_function   # 转换函数
)

# 调用链
result = transform_chain.invoke({
    "text": "第一行\n第二行\n第三行\n第四行"
})
print(f"行数：{result['line_count']}")
```

## 自定义 Chain（新版本）

### 使用 LCEL 自定义

```python
# 导入所需的组件
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate
from langchain_core.runnables import RunnableLambda

# 创建LLM实例
llm = ChatOpenAI(model="gpt-4")

# 第一步：定义研究函数
# 使用RunnableLambda将普通函数转换为可组合的Runnable
def research_step(inputs: dict) -> dict:
    topic = inputs["topic"]
    # 创建临时链：生成研究报告
    chain = PromptTemplate.from_template("为{topic}写一份简要研究报告") | llm
    result = chain.invoke({"topic": topic})
    # 返回结果，供下一步使用
    return {"research": result.content}

# 第二步：定义提问函数
def question_step(inputs: dict) -> dict:
    research = inputs["research"]
    # 基于研究报告生成问题
    chain = PromptTemplate.from_template(
        "基于以下研究，提出3个深入问题：\n{research}"
    ) | llm
    result = chain.invoke({"research": research})
    return {"questions": result.content}

# 使用RunnableLambda将函数转换为Runnable
# 然后使用管道操作符串联两个步骤
custom_chain = RunnableLambda(research_step) | RunnableLambda(question_step)

# 调用自定义链
result = custom_chain.invoke({"topic": "量子计算"})
print(result)
```

## 链的记忆功能（新版本）

### 添加 Memory

```python
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from langchain_core.runnables import RunnableLambda

llm = ChatOpenAI(model="gpt-4")

def create_chain_with_memory(memory):
    def chain_func(inputs):
        history = memory.load_memory_variables({}).get("history", [])

        prompt = ChatPromptTemplate.from_messages([
            SystemMessage(content="基于以下对话历史回答问题。"),
            MessagesPlaceholder(variable_name="history"),
            HumanMessage(content=inputs["input"])
        ])

        chain = prompt | llm
        response = chain.invoke({"history": history})

        memory.save_context(
            {"input": inputs["input"]},
            {"output": response.content}
        )

        return {"response": response.content}

    return RunnableLambda(chain_func)

memory = ConversationBufferMemory(
    memory_key="history",
    return_messages=True
)

chain = create_chain_with_memory(memory)

chain.invoke({"input": "我叫张三"})
chain.invoke({"input": "我叫什么名字？"})
```

## 异步链

```python
import asyncio
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser

llm = ChatOpenAI(model="gpt-4")

chain = PromptTemplate.from_template("用一句话解释：{topic}") | llm | StrOutputParser()

async def async_invoke():
    result = await chain.ainvoke({"topic": "量子纠缠"})
    print(result)

    results = await chain.abatch([
        {"topic": "人工智能"},
        {"topic": "机器学习"},
        {"topic": "深度学习"}
    ])
    for r in results:
        print(r)

asyncio.run(async_invoke())
```

## 错误处理

```python
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.exceptions import OutputParserException

chain = PromptTemplate.from_template("返回JSON：{text}") | llm | JsonOutputParser()

try:
    result = chain.invoke({"text": "some text"})
except OutputParserException as e:
    print(f"解析错误: {e}")
```

## 最佳实践

| 实践 | 说明 |
|------|------|
| **单一职责** | 每个链负责一个特定任务 |
| **可复用性** | 创建通用链供多处使用 |
| **错误处理** | 为链添加异常处理 |
| **日志记录** | 使用 callbacks 参数调试 |
| **性能优化** | 批量任务使用异步 API |

### 链的性能优化

```python
results = chain.batch([
    {"input": "问题1"},
    {"input": "问题2"},
    {"input": "问题3"}
])

async def batch_process(items):
    results = await chain.abatch([{"input": i} for i in items])
    return results
```

## 常见链类型速查

| 链类型 | 用途 | 特点 |
|--------|------|------|
| **LCEL 管道** | 基础链 | 模板+模型+解析器 |
| **SequentialChain** | 顺序链 | 多输入/输出 |
| **TransformChain** | 转换链 | 数据转换 |
| **自定义链** | 特殊逻辑 | RunnableLambda |

## 总结

Chain 是 LangChain 的核心抽象，它让我们能够：

1. **组合组件** - 将提示词、模型、解析器组合
2. **复用流程** - 创建可复用的工作流
3. **复杂逻辑** - 处理多步骤任务
4. **动态决策** - 根据输入选择处理路径

掌握 Chain 的使用，是构建复杂 LLM 应用的基础。
