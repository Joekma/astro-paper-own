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

### 基础用法

LLMChain 是最基本的链类型，将提示词模板和语言模型结合：

```python
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate
from langchain.chains.llm import LLMChain

# 创建模型
llm = ChatOpenAI(model="gpt-4", temperature=0.7)

# 创建提示词模板
template = PromptTemplate.from_template(
    """你是一个创意写作助手。请为以下主题写一首诗：

    主题：{topic}
    风格：{style}

    诗歌："""
)

# 创建 LLMChain
chain = LLMChain(llm=llm, prompt=template)

# 运行链
result = chain.invoke({
    "topic": "春天",
    "style": "现代诗"
})

print(result["text"])
```

### 输出多个变量

```python
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate
from langchain.chains.llm import LLMChain

llm = ChatOpenAI(model="gpt-4")

# 输出多个变量的模板
template = PromptTemplate.from_template(
    """分析以下产品并提供反馈：

    产品：{product}

    请提供：
    1. 优点：{pros}
    2. 缺点：{cons}
    3. 建议：{suggestions}""",
    output_variables=["pros", "cons", "suggestions"]
)

chain = LLMChain(llm=llm, prompt=template)

result = chain.invoke({"product": "某款智能手机"})
print(f"优点：{result['pros']}")
print(f"缺点：{result['cons']}")
print(f"建议：{result['suggestions']}")
```

### 带输出的链

```python
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain.chains.llm import LLMChain

llm = ChatOpenAI(model="gpt-4")
parser = StrOutputParser()

# 带输出的 LLMChain
chain = LLMChain(
    llm=llm,
    prompt=PromptTemplate.from_template("用一句话解释{concept}"),
    output_parser=parser
)

result = chain.invoke({"concept": "量子计算"})
print(result)
```

## Sequential Chain

### SimpleSequentialChain

单输入单输出的顺序链：

```python
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate
from langchain.chains.sequential import SimpleSequentialChain

llm = ChatOpenAI(model="gpt-4")

# 链1：生成故事
chain1 = LLMChain(
    llm=llm,
    prompt=PromptTemplate.from_template(
        """为一个{character}写一个简短的冒险故事（100字以内）。

        角色：{character}"""
    )
)

# 链2：翻译成英文
chain2 = LLMChain(
    llm=llm,
    prompt=PromptTemplate.from_template(
        """将以下故事翻译成英文：

        {story}"""
    )
)

# 组合为顺序链
sequential_chain = SimpleSequentialChain(
    chains=[chain1, chain2],
    verbose=True
)

# 运行
result = sequential_chain.invoke({
    "character": "勇敢的小骑士"
})

print(result["output"])
```

### SequentialChain

多输入多输出的顺序链：

```python
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate
from langchain.chains.sequential import SequentialChain

llm = ChatOpenAI(model="gpt-4")

# 链1：分析文章
chain1 = LLMChain(
    llm=llm,
    prompt=PromptTemplate.from_template(
        """分析以下文章的主要观点：

        文章：{article}

        主要观点："""
    ),
    output_key="main_points"
)

# 链2：生成摘要
chain2 = LLMChain(
    llm=llm,
    prompt=PromptTemplate.from_template(
        """根据以下观点写一段摘要：

        观点：{main_points}

        摘要："""
    ),
    output_key="summary"
)

# 链3：翻译成英文
chain3 = LLMChain(
    llm=llm,
    prompt=PromptTemplate.from_template(
        """将以下中文摘要翻译成英文：

        {summary}

        英文摘要："""
    ),
    output_key="english_summary"
)

# 组合
full_chain = SequentialChain(
    chains=[chain1, chain2, chain3],
    input_variables=["article"],
    output_variables=["main_points", "summary", "english_summary"],
    verbose=True
)

# 运行
result = full_chain.invoke({
    "article": "人工智能技术正在快速发展..."
})

print(f"主要观点：{result['main_points']}")
print(f"中文摘要：{result['summary']}")
print(f"英文摘要：{result['english_summary']}")
```

## TransformChain

用于数据转换的链：

```python
from langchain.chains.sequential import TransformChain
from langchain_core.prompts import PromptTemplate

# 定义转换函数
def transform_function(inputs: dict) -> dict:
    text = inputs["text"]
    # 简单处理：按行分割
    lines = text.split("\n")
    return {"lines": lines, "line_count": len(lines)}

# 创建转换链
transform_chain = TransformChain(
    input_variables=["text"],
    output_variables=["lines", "line_count"],
    transform=transform_function
)

# 使用
result = transform_chain.invoke({
    "text": "第一行\n第二行\n第三行\n第四行"
})
print(f"行数：{result['line_count']}")
print(f"内容：{result['lines']}")
```

## RouterChain

根据输入动态选择处理链：

```python
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate
from langchain.chains.router.multi_prompt import MultiPromptChain
from langchain.chains.router import RouterChain
from langchain_core.output_parsers import StrOutputParser

llm = ChatOpenAI(model="gpt-4")

# 定义不同场景的链
math_template = PromptTemplate.from_template(
    """你是一个数学老师。回答以下数学问题：

    问题：{input}"""
)

science_template = PromptTemplate.from_template(
    """你是一个科学家。回答以下科学问题：

    问题：{input}"""
)

history_template = PromptTemplate.from_template(
    """你是一个历史学家。回答以下历史问题：

    问题：{input}"""
)

# 路由目标
destination_chains = {
    "math": math_template | llm | StrOutputParser(),
    "science": science_template | llm | StrOutputParser(),
    "history": history_template | llm | StrOutputParser(),
}

# 默认链
default_chain = llm | StrOutputParser()

# 路由提示词
router_template = """根据问题类型选择相应的链：

问题：{input}

类型选项：math, science, history

只输出类型名称，不要其他内容。"""

from langchain.chains.router.llm_router import LLMRouterChain

router_chain = LLMRouterChain.from_llm(
    llm,
    PromptTemplate.from_template(router_template),
    destination_chains.keys(),
    default_chain
)
```

## LCEL 管道组合

LangChain Expression Language (LCEL) 提供了更简洁的链式 API：

### 基础管道

```python
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser

llm = ChatOpenAI(model="gpt-4")

# 使用管道符组合
chain = PromptTemplate.from_template("解释{topic}") | llm | StrOutputParser()

# 调用
result = chain.invoke({"topic": "区块链"})
print(result)
```

### 动态链

```python
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate
from langchain_core.runnables import RunnablePassthrough

llm = ChatOpenAI(model="gpt-4")

# 动态选择提示词
def get_template(task: str) -> PromptTemplate:
    templates = {
        "summary": PromptTemplate.from_template("总结：{text}"),
        "translate": PromptTemplate.from_template("翻译成英文：{text}"),
        "analyze": PromptTemplate.from_template("分析：{text}"),
    }
    return templates.get(task, templates["summary"])

# 动态链
def create_chain(task: str):
    return PromptTemplate.from_template("{task}: {text}") | llm

# 使用
chain = create_chain("summary")
result = chain.invoke({"task": "总结", "text": "LangChain很强大"})
```

### Runnable 接口

```python
from langchain_core.runnables import RunnableLambda, RunnablePassthrough

# 自定义函数作为链
def process_text(text: str) -> dict:
    return {
        "upper": text.upper(),
        "lower": text.lower(),
        "length": len(text)
    }

# 使用 RunnableLambda
chain = RunnableLambda(process_text)

result = chain.invoke("Hello World")
print(result)
```

## 自定义 Chain

### 继承基础类

```python
from langchain_core.prompts import PromptTemplate
from langchain.chains.llm import LLMChain
from langchain.chains import Chain

class ResearchChain(Chain):
    """研究分析链"""

    def __init__(self, llm, **kwargs):
        self.llm = llm
        super().__init__(**kwargs)

    @property
    def input_keys(self):
        return ["topic"]

    @property
    def output_keys(self):
        return ["research", "questions"]

    def _call(self, inputs):
        topic = inputs["topic"]

        # 生成研究报告
        research_prompt = PromptTemplate.from_template(
            "为{topic}写一份简要研究报告"
        )
        research_chain = LLMChain(llm=self.llm, prompt=research_prompt)
        research = research_chain.run(topic)

        # 生成问题
        question_prompt = PromptTemplate.from_template(
            "基于以下研究，提出3个深入问题：\n{research}"
        )
        question_chain = LLMChain(llm=self.llm, prompt=question_prompt)
        questions = question_chain.run(research)

        return {
            "research": research,
            "questions": questions
        }

# 使用
research_chain = ResearchChain(llm=llm)
result = research_chain.run(topic="量子计算")
```

## 链的记忆功能

### 添加 Memory

```python
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate
from langchain.chains.llm import LLMChain
from langchain.memory import ConversationBufferMemory

llm = ChatOpenAI(model="gpt-4")

# 创建记忆
memory = ConversationBufferMemory(
    memory_key="history",
    return_messages=True
)

# 带记忆的链
chain = LLMChain(
    llm=llm,
    prompt=PromptTemplate.from_template(
        """基于以下对话历史回答问题：

        历史：{history}

        问题：{input}

        回答："""
    ),
    memory=memory,
    verbose=True
)

# 对话
chain.run("我叫张三")
chain.run("我叫什么名字？")
chain.run("我是做什么的？")
```

## 异步链

```python
import asyncio
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate
from langchain.chains.llm import LLMChain

llm = ChatOpenAI(model="gpt-4")

chain = LLMChain(
    llm=llm,
    prompt=PromptTemplate.from_template("用一句话解释：{topic}")
)

async def async_invoke():
    # 单次异步调用
    result = await chain.ainvoke({"topic": "量子纠缠"})
    print(result)

    # 批量异步调用
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
from langchain.chains.llm import LLMChain
from langchain_core.exceptions import OutputParserException

chain = LLMChain(
    llm=llm,
    prompt=PromptTemplate.from_template("返回JSON：{text}"),
    output_parser=JsonOutputParser()
)

try:
    result = chain.run({"text": "some text"})
except OutputParserException as e:
    print(f"解析错误: {e}")
```

## 最佳实践

| 实践 | 说明 |
|------|------|
| **单一职责** | 每个链负责一个特定任务 |
| **可复用性** | 创建通用链供多处使用 |
| **错误处理** | 为链添加异常处理 |
| **日志记录** | 使用 verbose 参数调试 |
| **性能优化** | 批量任务使用异步 API |

### 链的性能优化

```python
# 使用 batch 提高吞吐量
results = chain.batch([
    {"input": "问题1"},
    {"input": "问题2"},
    {"input": "问题3"}
])

# 使用异步提高效率
async def batch_process(items):
    results = await chain.abatch([{"input": i} for i in items])
    return results
```

## 常见链类型速查

| 链类型 | 用途 | 特点 |
|--------|------|------|
| **LLMChain** | 基础链 | 模板+模型 |
| **SimpleSequentialChain** | 顺序链 | 单输入/输出 |
| **SequentialChain** | 顺序链 | 多输入/输出 |
| **TransformChain** | 转换链 | 数据转换 |
| **RouterChain** | 路由链 | 动态选择 |
| **RetrievalQA** | 问答链 | RAG 支持 |

## 总结

Chain 是 LangChain 的核心抽象，它让我们能够：

1. **组合组件** - 将提示词、模型、解析器组合
2. **复用流程** - 创建可复用的工作流
3. **复杂逻辑** - 处理多步骤任务
4. **动态决策** - 根据输入选择处理路径

掌握 Chain 的使用，是构建复杂 LLM 应用的基础。
