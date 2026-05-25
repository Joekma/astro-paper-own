---
title: LangChain 输出解析器：Output Parsers
author: Joekma
pubDatetime: 2026-05-11T00:00:00.000+08:00
modDatetime: 2026-05-11T00:00:00.000+08:00
slug: langchain-output-parsers
description: '深入讲解LangChain v1.0的Output Parser模块，包括结构化输出、JSON解析和Pydantic验证。'
tags:
  - LangChain
  - Output Parser
  - LLM
draft: false
series: LangChain
seriesOrder: 3
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

## Parser 类型概览

| Parser | 说明 | 输出类型 |
|--------|------|---------|
| **StrOutputParser** | 字符串输出 | str |
| **JsonOutputParser** | JSON 解析 | dict |
| **PydanticOutputParser** | Pydantic 验证 | Pydantic 模型 |
| **CommaSeparatedListOutputParser** | 列表解析 | List[str] |

## StrOutputParser

### 基础用法

```python
from langchain_core.output_parsers import StrOutputParser
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate

llm = ChatOpenAI(model="gpt-4o")

chain = PromptTemplate.from_template("用一句话解释{topic}") | llm | StrOutputParser()

result = chain.invoke({"topic": "人工智能"})
print(result)
```

## JsonOutputParser

### 基础用法

```python
from langchain_core.output_parsers import JsonOutputParser
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate

llm = ChatOpenAI(model="gpt-4o")
parser = JsonOutputParser()

prompt = PromptTemplate.from_template(
    """返回一个JSON对象，包含以下信息：
    - name: 姓名
    - age: 年龄
    - city: 城市

    {format_instructions}

    只返回JSON，不要其他内容。"""
)

chain = prompt | llm | parser

result = chain.invoke({
    "format_instructions": parser.get_format_instructions()
})

print(result)
print(result["name"])
```

## PydanticOutputParser

### 基本使用

```python
from langchain_core.output_parsers import PydanticOutputParser
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate
from pydantic import BaseModel, Field
from typing import List

class Person(BaseModel):
    name: str = Field(description="人物姓名")
    age: int = Field(description="人物年龄")
    occupation: str = Field(description="职业")
    skills: List[str] = Field(description="技能列表")

parser = PydanticOutputParser(pydantic_object=Person)

prompt = PromptTemplate.from_template(
    """从以下文本中提取人物信息：

    {query}

    {format_instructions}""",
    partial_variables={"format_instructions": parser.get_format_instructions()}
)

llm = ChatOpenAI(model="gpt-4o")
chain = prompt | llm | parser

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
    level: str

class PersonWithSkills(BaseModel):
    name: str
    age: int
    skills: List[Skill]

parser = PydanticOutputParser(pydantic_object=PersonWithSkills)

chain = prompt | llm | parser
result = chain.invoke({
    "query": "王芳，28岁，技能：Python（高级），数据分析（中级）"
})
print(result.skills[0].name)
```

## 列表 Parser

### CommaSeparatedListOutputParser

```python
from langchain_core.output_parsers import CommaSeparatedListOutputParser
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate

parser = CommaSeparatedListOutputParser()

chain = PromptTemplate.from_template(
    """列出Python的5个主要特性，使用逗号分隔。

    {format_instructions}"""
) | llm | parser

result = chain.invoke({})
print(result)
```

## 自定义 Parser

### 基础自定义

```python
from langchain_core.output_parsers import BaseOutputParser
from typing import Any
import re
import json

class CustomParser(BaseOutputParser):
    def parse(self, text: str) -> Any:
        text = text.strip()
        if "{" in text and "}" in text:
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
        formats = ["%Y-%m-%d", "%Y/%m/%d", "%d-%m-%Y", "%d/%m/%Y"]

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

### 编号列表解析

```python
class NumberedListParser(BaseOutputParser[list]):
    def parse(self, text: str) -> list:
        lines = text.strip().split('\n')
        result = []
        for line in lines:
            cleaned = line.lstrip('0123456789.、)） ')
            if cleaned:
                result.append(cleaned)
        return result

    @property
    def _type(self) -> str:
        return "numbered_list"

parser = NumberedListParser()
result = parser.parse("1. 第一项\n2. 第二项\n3. 第三项")
print(result)
```

## 错误处理

### ValidationError 处理

```python
from pydantic import BaseModel, ValidationError

parser = PydanticOutputParser(pydantic_object=Person)

try:
    result = chain.invoke({})
except ValidationError as e:
    print(f"验证错误: {e}")
```

### OutputParserException 处理

```python
from langchain_core.exceptions import OutputParserException

try:
    result = chain.invoke({})
except OutputParserException as e:
    print(f"解析错误: {e}")
```

## 实际应用

### 问答系统

```python
from pydantic import BaseModel, Field
from typing import List

class QAResponse(BaseModel):
    question: str = Field(description="原始问题")
    answer: str = Field(description="答案")
    sources: List[str] = Field(description="参考来源")
    confidence: float = Field(description="置信度", ge=0, le=1)

parser = PydanticOutputParser(pydantic_object=QAResponse)

chain = prompt | llm | parser

result = chain.invoke({
    "context": "Python是一种高级编程语言...",
    "question": "Python是什么？"
})
```

## 最佳实践

| 实践 | 说明 |
|------|------|
| **使用 Pydantic** | 类型安全，自动验证 |
| **提供格式指令** | 帮助 LLM 生成正确格式 |
| **错误处理** | 解析可能失败，准备降级方案 |
| **清晰 Schema** | 详细的字段描述 |

## 总结

| Parser | 用途 | 特点 |
|--------|------|------|
| **StrOutputParser** | 简单字符串 | 零转换 |
| **JsonOutputParser** | JSON 解析 | 基础结构 |
| **PydanticOutputParser** | 类型验证 | 最推荐 |
| **CommaSeparatedListOutputParser** | 列表解析 | 简单列表 |

Output Parser 让 LLM 输出变得可控、可验证，是构建可靠 LLM 应用的关键。