---
title: LangChain Prompt Templates：提示词模板
author: Joekma
pubDatetime: 2026-05-07T00:00:00.000+08:00
modDatetime: 2026-05-07T00:00:00.000+08:00
slug: langchain-prompt-templates
description: '深入讲解LangChain提示词模板，包括PromptTemplate、ChatPromptTemplate、动态模板和最佳实践。'
tags:
  - LangChain
  - Prompt
  - LLM
draft: false
series: LangChain
language: zh-CN
---

## 概述

提示词模板（Prompt Template）是 LangChain 中最常用的组件之一，它允许开发者创建可复用的、结构化的提示词。通过模板化，可以更方便地管理复杂提示词，提高代码的可维护性和一致性。

### 提示词模板的价值

| 价值 | 说明 |
|------|------|
| **可复用性** | 定义一次，使用多次 |
| **一致性** | 保持提示词格式统一 |
| **可维护性** | 修改模板即可更新所有使用处 |
| **动态性** | 支持变量插值和条件逻辑 |

## PromptTemplate

### 基础用法

```python
# 导入PromptTemplate类
from langchain_core.prompts import PromptTemplate

# 从模板字符串创建PromptTemplate
# {text}是占位符，会在invoke时被实际值替换
template = PromptTemplate.from_template("请将以下中文翻译成英文：{text}")

# 使用invoke方法填充模板中的占位符
prompt = template.invoke({
    "text": "今天天气真好"
})

# 打印填充后的提示词字符串
print(prompt.to_string())
```

### 模板输出类型

```python
# to_string(): 将模板转换为字符串格式
prompt_str = template.invoke({"text": "AI"})
print(prompt_str.to_string())

# to_messages(): 将模板转换为消息列表格式
# 返回HumanMessage对象列表，适合发送给聊天模型
prompt_messages = template.invoke({"text": "AI"})
print(prompt_messages.to_messages())
```

### 部分变量填充

```python
# 导入PromptTemplate类
from langchain_core.prompts import PromptTemplate

# 创建模板，定义多个变量
template = PromptTemplate(
    template="写一篇关于{topic}的{style}文章。",
    input_variables=["topic", "style"]
)

# partial(): 部分填充变量，生成新模板
# 新模板只保留未填充的变量
partial_template = template.partial(topic="人工智能")

# 调用部分填充后的模板，只需提供剩余变量
prompt = partial_template.invoke({"style": "技术博客"})
print(prompt.to_string())

# 也可以直接对模板进行部分填充
template = template.partial(style="科普文章")
```

### 默认值模板

```python
from langchain_core.prompts import PromptTemplate

template = PromptTemplate.from_template(
    template="""分析以下文本：

    文本：{text}

    分析深度：{depth}

    输出格式：{format}""",
    partial_variables={
        "depth": "详细",
        "format": "段落"
    }
)

prompt = template.invoke({"text": "Python是一门优秀的编程语言"})
```

## ChatPromptTemplate

### 消息角色构建

```python
from langchain_core.prompts import ChatPromptTemplate

template = ChatPromptTemplate.from_messages([
    ("system", "你是一个专业的{profession}。"),
    ("human", "你好，我需要了解{topic}。"),
    ("ai", "您好！关于{topic}，我很乐意为您解答。")
])

prompt = template.invoke({
    "profession": "法律顾问",
    "topic": "合同法"
})

print(prompt.to_messages())
```

### 消息类型详解

| 类型 | 说明 | 使用场景 |
|------|------|---------|
| **SystemMessage** | 系统角色 | 设置AI行为和身份 |
| **HumanMessage** | 用户输入 | 用户的问题或指令 |
| **AIMessage** | AI回复 | 预设的回复内容 |

```python
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from langchain_core.prompts import ChatPromptTemplate

template = ChatPromptTemplate.from_messages([
    SystemMessage(content="你是一个乐于助人的助手。"),
    HumanMessage(content="什么是量子计算？"),
    AIMessage(content="量子计算是一种利用量子力学原理的计算方式..."),
    HumanMessage(content="{user_input}")
])

prompt = template.invoke({"user_input": "能详细解释一下吗？"})
```

### MessagesPlaceholder 占位符

```python
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

template = ChatPromptTemplate.from_messages([
    ("system", "你是一个对话助手。以下是之前的对话历史："),
    MessagesPlaceholder(variable_name="history"),
    ("human", "{question}"),
])

history = [
    HumanMessage(content="我叫张三"),
    AIMessage(content="您好张三，很高兴认识您！"),
]

prompt = template.invoke({
    "history": history,
    "question": "我叫什么名字？"
})
```

## Few-Shot 学习模板

### 基础 Few-Shot

```python
from langchain_core.prompts import PromptTemplate, FewShotPromptTemplate

examples = [
    {"input": "开心", "output": "happy"},
    {"input": "悲伤", "output": "sad"},
    {"input": "惊讶", "output": "surprised"},
]

example_prompt = PromptTemplate.from_template(
    "中文：{input} -> 英文：{output}"
)

few_shot_prompt = FewShotPromptTemplate(
    examples=examples,
    example_prompt=example_prompt,
    prefix="将以下中文情感词翻译成英文：",
    suffix="中文：{word} -> 英文：",
    input_variables=["word"]
)

prompt = few_shot_prompt.invoke({"word": "兴奋"})
print(prompt.to_string())
```

### 示例选择器

```python
# 导入语义相似度示例选择器
from langchain_core.prompts import FewShotPromptTemplate, PromptTemplate
from langchain_core.example_selectors import SemanticSimilarityExampleSelector
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import Chroma

# 定义示例库
examples = [
    {"input": "今天心情很好", "output": "happy"},
    {"input": "考试没考好很难过", "output": "sad"},
    {"input": "收到礼物很开心", "output": "happy"},
    {"input": "生病了很不舒服", "output": "sad"},
]

# 创建语义相似度选择器
# 会根据输入自动选择最相关的示例
example_selector = SemanticSimilarityExampleSelector.from_examples(
    examples=examples,                    # 示例库
    embeddings=OpenAIEmbeddings(),        # 嵌入模型
    vectorstore_cls=Chroma,              # 向量存储
    k=2                                  # 选择2个最相关的示例
)

# 创建Few-Shot模板，使用选择器代替固定示例
few_shot_prompt = FewShotPromptTemplate(
    example_selector=example_selector,    # 动态示例选择器
    example_prompt=PromptTemplate.from_template(
        "中文：{input} -> 情感：{output}"
    ),
    prefix="判断以下句子的情感：",        # 前缀提示
    suffix="中文：{sentence} -> 情感：",  # 后缀，用户输入位置
    input_variables=["sentence"]
)

# 根据输入自动选择相关示例并生成提示词
prompt = few_shot_prompt.invoke({
    "sentence": "中彩票了，太高兴了！"
})
```

## 管道模板

### 组合多个模板

```python
from langchain_core.prompts import PromptTemplate, ChatPromptTemplate

analysis_template = PromptTemplate.from_template(
    "分析这个问题：{question}\n关键点："
)

answer_template = PromptTemplate.from_template(
    """基于以下分析回答问题：

    分析：{analysis}

    问题：{question}

    回答："""
)

analysis_prompt = analysis_template.invoke({"question": "什么是AI？"})
print(analysis_prompt.to_string())

answer_prompt = answer_template.invoke({
    "analysis": "用户想了解AI的基本概念",
    "question": "什么是AI？"
})
print(answer_prompt.to_string())
```

## 动态模板

### 条件模板

```python
from langchain_core.prompts import PromptTemplate

def create_template(task_type: str) -> PromptTemplate:
    templates = {
        "summarize": PromptTemplate.from_template(
            "请简洁地总结以下文本：\n{text}"
        ),
        "translate": PromptTemplate.from_template(
            "将以下文本翻译成{lang}：\n{text}"
        ),
        "analyze": PromptTemplate.from_template(
            "详细分析以下文本的优缺点：\n{text}"
        ),
    }
    return templates.get(task_type, templates["analyze"])

template = create_template("translate")
prompt = template.invoke({"lang": "英文", "text": "你好世界"})
```

### 列表变量

```python
from langchain_core.prompts import PromptTemplate

template = PromptTemplate.from_template(
    "分析以下关键词：{keywords}\n\n请提供每个关键词的简短解释。"
)

prompt = template.invoke({
    "keywords": ["人工智能", "机器学习", "深度学习"]
})
print(prompt.to_string())
```

## 模板输出控制

### 添加约束指令

```python
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import JsonOutputParser

parser = JsonOutputParser()

template = PromptTemplate.from_template(
    """提取文本中的信息：

    文本：{text}

    {format_instructions}""",
    partial_variables={"format_instructions": parser.get_format_instructions()}
)

prompt = template.invoke({
    "text": "张三，30岁，软件工程师，住在北京"
})

print(prompt.to_string())
```

## 模板继承和扩展

### 基础模板复用

```python
from langchain_core.prompts import PromptTemplate

base_template = """你是一个AI助手。请回答用户的问题。

问题：{question}
回答："""

extended_template = base_template + "\n\n请用简洁专业的语言回答。"

template = PromptTemplate.from_template(extended_template)
```

## 最佳实践

### 1. 结构化提示词

```python
template = PromptTemplate.from_template("""任务：{task}

背景信息：
{background}

要求：
{requirements}

输入：
{input}

输出：""")
```

### 2. 分离可变和固定部分

```python
fixed_instructions = PromptTemplate.from_template(
    "你是一个{profession}专家，遵循专业规范回答问题。",
    partial_variables={"profession": "Python编程"}
)
```

### 3. 版本控制提示词

```python
template = PromptTemplate.from_template(
    """[v2.0] 请按照以下格式回答：

    格式：{format}

    内容：{content}"""
)
```

### 提示词模板检查清单

| 检查项 | 说明 |
|--------|------|
| ✅ 定义所有必需变量 | 确保 input_variables 完整 |
| ✅ 设置默认值 | 减少调用时参数 |
| ✅ 添加格式约束 | 配合 OutputParser 使用 |
| ✅ 使用描述性变量名 | 提高可读性 |
| ✅ 包含示例 | Few-Shot 提升效果 |

## 常见问题

### Q1：如何调试模板？

```python
template = PromptTemplate.from_template("Hello {name}!")
prompt = template.invoke({"name": "World"})
print(prompt.to_string())
```

### Q2：如何处理可选变量？

```python
template = PromptTemplate.from_template(
    "分析{topic}，难度：{level}",
    partial_variables={"level": "中等"}
)
```

### Q3：如何在模板中使用条件逻辑？

```python
def create_prompt(topic: str, include_examples: bool):
    base = f"解释{topic}的概念。"
    if include_examples:
        base += "\n\n例如："
        base += "\n- 示例1"
        base += "\n- 示例2"
    return PromptTemplate.from_template(base)
```

## 总结

| 模板类型 | 适用场景 |
|---------|---------|
| **PromptTemplate** | 简单文本提示 |
| **ChatPromptTemplate** | 对话场景 |
| **FewShotPromptTemplate** | 需要示例的任务 |
| **自定义模板** | 复杂逻辑需求 |

掌握提示词模板可以让你的 LLM 应用更加灵活和可维护。
