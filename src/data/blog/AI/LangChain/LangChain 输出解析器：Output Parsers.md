---
title: LangChain 输出解析器：Output Parsers
author: Joekma
pubDatetime: 2026-05-07T00:00:00.000+08:00
modDatetime: 2026-05-07T00:00:00.000+08:00
slug: langchain-output-parsers
description: '深入讲解LangChain的Output Parser模块，包括结构化输出、JSON解析、Pydantic验证和自定义解析器。'
tags:
  - LangChain
  - Output Parser
  - LLM
draft: false
language: zh-CN
---

## 概述

Output Parsers（输出解析器）是 LangChain 中用于将 LLM 的原始文本输出转换为结构化数据的模块。它们确保 LLM 的输出符合预期的格式，便于后续处理和使用。

### 为什么需要 Output Parser？

| 问题 | Parser 解决方案 |
|------|---------------|
| 输出格式不稳定 | 强制特定格式 |
| 难以程序化处理 | 转换为结构化对象 |
| 缺乏类型安全 | Pydantic 验证 |
| 需要提取特定信息 | 自定义解析逻辑 |

### Parser 工作流程

```
┌─────────────────────────────────────────────────────────────┐
│                    Output Parser 工作流程                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   LLM 原始输出                                              │
│       │                                                      │
│       ▼                                                      │
│   ┌─────────────────┐                                        │
│   │  Output Parser  │                                        │
│   └────────┬────────┘                                        │
│            │                                                  │
│     ┌──────┴──────┐                                          │
│     │             │                                          │
│     ▼             ▼                                          │
│  ┌────────┐  ┌────────────┐                                  │
│  │ 格式化 │  │  结构验证  │                                  │
│  └────────┘  └────────────┘                                  │
│                                                              │
│   转换后输出                                                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Parser 类型概览

| Parser | 说明 | 输出类型 |
|--------|------|---------|
| **StrOutputParser** | 字符串输出 | str |
| **JsonOutputParser** | JSON 解析 | dict |
| **PydanticOutputParser** | Pydantic 验证 | Pydantic 模型 |
| **CommaSeparatedListOutputParser** | 列表解析 | List[str] |
| **StructuredOutputParser** | 结构化解析 | dict |
| **RetryOutputParser** | 带重试解析 | 验证后输出 |

## 基础 Parser

### StrOutputParser

最简单，只返回字符串：

```python
from langchain_core.output_parsers import StrOutputParser
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate

llm = ChatOpenAI(model="gpt-4")

# 创建链
chain = PromptTemplate.from_template("用一句话解释{topic}") | llm | StrOutputParser()

# 执行
result = chain.invoke({"topic": "人工智能"})
print(result)  # str 类型
```

### IntOutputParser

返回整数：

```python
from langchain_core.output_parsers import IntOutputParser

chain = PromptTemplate.from_template(
    "统计以下文本中的单词数量：{text}"
) | llm | IntOutputParser()

result = chain.invoke({"text": "Hello world"})
print(type(result))  # <class 'int'>
```

### FloatOutputParser

返回浮点数：

```python
from langchain_core.output_parsers import FloatOutputParser

chain = PromptTemplate.from_template(
    "计算 10 除以 3，保留两位小数"
) | llm | FloatOutputParser()

result = chain.invoke({})
print(type(result))  # <class 'float'>
```

## JSON Parser

### JsonOutputParser

基础 JSON 解析：

```python
from langchain_core.output_parsers import JsonOutputParser
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate

llm = ChatOpenAI(model="gpt-4")

# 创建链
chain = PromptTemplate.from_template(
    """返回一个JSON对象，包含以下信息：
    - name: 姓名
    - age: 年龄
    - city: 城市

    只返回JSON，不要其他内容。"""
) | llm | JsonOutputParser()

result = chain.invoke({})
print(result)  # {'name': '...', 'age': 25, 'city': '...'}
```

### 带格式指令的 JSON Parser

```python
from langchain_core.output_parsers import JsonOutputParser
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import BaseOutputParser

llm = ChatOpenAI(model="gpt-4")
parser = JsonOutputParser()

prompt = PromptTemplate.from_template(
    """提取文本中的人物信息。

    {format_instructions}

    文本：张三，男，30岁，软件工程师，居住在北京。""",
    partial_variables={"format_instructions": parser.get_format_instructions()}
)

chain = prompt | llm | parser
result = chain.invoke({})
print(result)
```

## Pydantic Parser

### 基本使用

```python
from langchain_core.output_parsers import PydanticOutputParser
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate
from pydantic import BaseModel, Field
from typing import List, Optional

# 定义数据模型
class Person(BaseModel):
    name: str = Field(description="人物姓名")
    age: int = Field(description="人物年龄")
    occupation: str = Field(description="职业")
    skills: List[str] = Field(description="技能列表")

# 创建解析器
parser = PydanticOutputParser(pydantic_object=Person)

# 创建提示词
prompt = PromptTemplate.from_template(
    """从以下文本中提取人物信息：

    {query}

    {format_instructions}""",
    partial_variables={"format_instructions": parser.get_format_instructions()}
)

# 创建链
llm = ChatOpenAI(model="gpt-4")
chain = prompt | llm | parser

# 执行
result = chain.invoke({
    "query": "李明是一位35岁的数据科学家，精通Python、SQL和机器学习"
})

print(result.name)
print(result.age)
print(result.skills)
```

### 嵌套模型

```python
from pydantic import BaseModel, Field
from typing import List

class Skill(BaseModel):
    name: str
    level: str  # 初级/中级/高级

class PersonWithSkills(BaseModel):
    name: str
    age: int
    skills: List[Skill]

parser = PydanticOutputParser(pydantic_object=PersonWithSkills)

chain = prompt | llm | parser
result = chain.invoke({"query": "王芳，28岁，技能：Python（高级），数据分析（中级）"})
print(result.skills[0].name)
```

### 可选字段

```python
from pydantic import BaseModel, Field
from typing import Optional

class Product(BaseModel):
    name: str
    price: float
    description: Optional[str] = None  # 可选字段
    tags: List[str] = Field(default_factory=list)

parser = PydanticOutputParser(pydantic_object=Product)
```

## 列表 Parser

### CommaSeparatedListOutputParser

逗号分隔的列表：

```python
from langchain_core.output_parsers import CommaSeparatedListOutputParser
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate

llm = ChatOpenAI(model="gpt-4")

parser = CommaSeparatedListOutputParser()

chain = PromptTemplate.from_template(
    """列出Python的5个主要特性，使用逗号分隔。

    {format_instructions}""",
    partial_variables={"format_instructions": parser.get_format_instructions()}
) | llm | parser

result = chain.invoke({})
print(result)  # ['特性1', '特性2', '特性3', '特性4', '特性5']
```

### 自定义列表解析

```python
from langchain_core.output_parsers import BaseOutputParser
from typing import List

class NumberedListParser(BaseOutputParser[List[str]]):
    """解析带编号的列表"""

    def parse(self, text: str) -> List[str]:
        lines = text.strip().split('\n')
        result = []
        for line in lines:
            # 移除编号（如 "1." 或 "1、"）
            cleaned = line.lstrip('0123456789.、)） ')
            if cleaned:
                result.append(cleaned)
        return result

    @property
    def _type(self) -> str:
        return "numbered_list"

parser = NumberedListParser()
result = parser.parse("1. 第一项\n2. 第二项\n3. 第三项")
print(result)  # ['第一项', '第二项', '第三项']
```

## 结构化输出

### StructuredOutputParser

```python
from langchain_core.output_parsers import StructuredOutputParser, ResponseSchema
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate

# 定义响应模式
response_schemas = [
    ResponseSchema(name="answer", description="问题的答案"),
    ResponseSchema(name="confidence", description="答案的可信度，0-1之间"),
    ResponseSchema(name="reasoning", description="推理过程")
]

parser = StructuredOutputParser.from_response_schemas(response_schemas)

chain = PromptTemplate.from_template(
    """回答以下问题：

    问题：{question}

    {format_instructions}""",
    partial_variables={"format_instructions": parser.get_format_instructions()}
) | ChatOpenAI(model="gpt-4") | parser

result = chain.invoke({"question": "什么是人工智能？"})
print(result["answer"])
print(result["confidence"])
```

## Retry Parser

### 带重试的解析

```python
from langchain_core.output_parsers import PydanticOutputParser
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate
from pydantic import BaseModel

class WeatherInfo(BaseModel):
    city: str
    temperature: int
    condition: str

# 带重试的解析器
parser = PydanticOutputParser(pydantic_object=WeatherInfo)

# 自定义提示词引导正确格式
prompt = PromptTemplate.from_template(
    """返回城市的天气信息，格式必须是：

    {format_instructions}

    城市天气信息："""
)
```

## 自定义 Parser

### 基础自定义

```python
from langchain_core.output_parsers import BaseOutputParser
from typing import Any

class CustomParser(BaseOutputParser):
    """自定义解析器"""

    def parse(self, text: str) -> Any:
        # 自定义解析逻辑
        text = text.strip()

        # 示例：提取 JSON
        if "{" in text and "}" in text:
            import json
            import re
            json_str = re.search(r'\{.*\}', text, re.DOTALL).group()
            return json.loads(json_str)

        return text

    @property
    def _type(self) -> str:
        return "custom_parser"
```

### 日期解析

```python
from langchain_core.output_parsers import BaseOutputParser
from datetime import datetime
from typing import Optional

class DateParser(BaseOutputParser[Optional[datetime]]):
    def parse(self, text: str) -> Optional[datetime]:
        text = text.strip()

        formats = [
            "%Y-%m-%d",
            "%Y/%m/%d",
            "%d-%m-%Y",
            "%d/%m/%Y",
            "%Y年%m月%d日"
        ]

        for fmt in formats:
            try:
                return datetime.strptime(text, fmt)
            except ValueError:
                continue

        return None

    @property
    def _type(self) -> str:
        return "date_parser"
```

## 组合 Parser

### Pipeline Parser

```python
from langchain_core.output_parsers import StrOutputParser, JsonOutputParser

# 先解析为字符串，再解析为 JSON
parser = StrOutputParser() | JsonOutputParser()
```

### 条件解析

```python
from langchain_core.output_parsers import BaseOutputParser
from typing import Union, List, Dict

class ConditionalParser(BaseOutputParser):
    def __init__(self, list_parser, dict_parser):
        self.list_parser = list_parser
        self.dict_parser = dict_parser

    def parse(self, text: str) -> Union[List, Dict]:
        text = text.strip()

        if text.startswith("["):
            return self.list_parser.parse(text)
        elif text.startswith("{"):
            return self.dict_parser.parse(text)
        else:
            return {"raw": text}
```

## 格式化指令

### 获取格式指令

```python
from langchain_core.output_parsers import PydanticOutputParser
from pydantic import BaseModel

class Person(BaseModel):
    name: str
    age: int

parser = PydanticOutputParser(pydantic_object=Person)

# 获取格式说明
instructions = parser.get_format_instructions()
print(instructions)
```

### 自定义格式说明

```python
from langchain_core.output_parsers import BaseOutputParser

class CustomFormatParser(BaseOutputParser):
    def get_format_instructions(self) -> str:
        return """请按以下格式输出：
        {
            "status": "状态",
            "data": {
                "key": "value"
            }
        }"""

    def parse(self, text: str) -> dict:
        import json
        return json.loads(text)
```

## 错误处理

### ValidationError 处理

```python
from langchain_core.output_parsers import PydanticOutputParser
from langchain_openai import ChatOpenAI
from pydantic import BaseModel, ValidationError

class Person(BaseModel):
    name: str
    age: int

parser = PydanticOutputParser(pydantic_object=Person)

try:
    result = chain.invoke({})
except ValidationError as e:
    print(f"验证错误: {e}")
    # 可以在这里实现重试逻辑
```

### 优雅降级

```python
from langchain_core.output_parsers import BaseOutputParser
from typing import Any

class SafeJsonParser(BaseOutputParser):
    def parse(self, text: str) -> Any:
        try:
            import json
            return json.loads(text)
        except json.JSONDecodeError:
            # 返回原始文本作为降级方案
            return {"raw": text, "error": "JSON解析失败"}
```

## 实际应用

### 1. 问答系统

```python
from pydantic import BaseModel, Field

class QAResponse(BaseModel):
    question: str = Field(description="原始问题")
    answer: str = Field(description="答案")
    sources: List[str] = Field(description="参考来源")
    confidence: float = Field(description="置信度", ge=0, le=1)

parser = PydanticOutputParser(pydantic_object=QAResponse)

chain = PromptTemplate.from_template(
    """基于以下上下文回答问题：

    上下文：{context}

    问题：{question}

    {format_instructions}"""
) | llm | parser

result = chain.invoke({
    "context": "Python是一种高级编程语言...",
    "question": "Python是什么？"
})

print(f"问题: {result.question}")
print(f"答案: {result.answer}")
print(f"置信度: {result.confidence}")
```

### 2. 情感分析

```python
from pydantic import BaseModel, Field
from typing import Literal

class SentimentResult(BaseModel):
    sentiment: Literal["positive", "negative", "neutral"]
    score: float = Field(description="情感得分，-1到1之间")
    keywords: List[str] = Field(description="情感关键词")

parser = PydanticOutputParser(pydantic_object=SentimentResult)

chain = prompt | llm | parser

result = chain.invoke({
    "text": "这个产品太棒了，质量很好！"
})
```

## 最佳实践

| 实践 | 说明 |
|------|------|
| **使用 Pydantic** | 类型安全，自动验证 |
| **提供格式指令** | 帮助 LLM 生成正确格式 |
| **错误处理** | 解析可能失败，准备降级方案 |
| **重试机制** | 验证失败时自动重试 |
| **清晰 Schema** | 详细的字段描述 |

### Schema 设计指南

```python
class WellDesignedModel(BaseModel):
    # 1. 使用类型提示
    name: str

    # 2. 添加字段描述
    age: int = Field(description="人物年龄")

    # 3. 设置约束
    score: float = Field(description="评分", ge=0, le=10)

    # 4. 设置默认值
    tags: List[str] = Field(default_factory=list)

    # 5. 枚举约束
    status: Literal["active", "inactive", "pending"]
```

## 常见问题

### Q1：Parser 如何处理格式错误？

```python
# 使用 RetryOutputParser
from langchain_core.output_parsers import RetryOutputParser

parser = RetryOutputParser.from_ parser(
    parser=JsonOutputParser(),
    retry_code=..." # 重试提示
)
```

### Q2：如何获取解析器的格式指令？

```python
parser = PydanticOutputParser(pydantic_object=Person)
instructions = parser.get_format_instructions()
```

### Q3：如何组合多个 Parser？

```python
# 使用管道符
combined = StrOutputParser() | JsonOutputParser()
```

## 总结

| Parser | 用途 | 特点 |
|--------|------|------|
| **StrOutputParser** | 简单字符串 | 零转换 |
| **JsonOutputParser** | JSON 解析 | 基础结构 |
| **PydanticOutputParser** | 类型验证 | 最推荐 |
| **CommaSeparatedListOutputParser** | 列表解析 | 简单列表 |
| **StructuredOutputParser** | 结构化 | 多字段 |

Output Parser 让 LLM 输出变得可控、可验证，是构建可靠 LLM 应用的关键。
