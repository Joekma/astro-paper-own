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
from langchain_core.prompts import PromptTemplate

# 方式1：从字符串创建
template = PromptTemplate.from_template("请将以下中文翻译成英文：{text}")

# 方式2：显式定义
template = PromptTemplate(
    template="解释{concept}的概念，并给出{count}个例子。",
    input_variables=["concept", "count"]
)

# 调用模板
prompt = template.invoke({
    "concept": "面向对象编程",
    "count": 3
})

print(prompt.to_string())
```

### 模板输出类型

```python
# 输出为字符串
prompt_str = template.invoke({"concept": "AI", "count": 2})
print(prompt_str.to_string())
# 输出: 解释AI的概念，并给出2个例子。

# 输出为消息列表
prompt_messages = template.invoke({"concept": "AI", "count": 2})
print(prompt_messages.to_messages())
# 输出: [StringPromptValue(text='解释AI的概念，并给出2个例子。')]
```

### 部分变量填充

```python
from langchain_core.prompts import PromptTemplate

# 创建模板
template = PromptTemplate(
    template="写一篇关于{topic}的{style}文章。",
    input_variables=["topic", "style"]
)

# 部分填充
partial_template = template.partial(topic="人工智能")
prompt = partial_template.invoke({"style": "技术博客"})
print(prompt.to_string())

# 也可以预先填充多个变量
template = template.partial(style="科普文章")
```

### 默认值模板

```python
from langchain_core.prompts import PromptTemplate

# 定义带默认值的模板
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

# 调用时只需提供 text
prompt = template.invoke({"text": "Python是一门优秀的编程语言"})
```

## ChatPromptTemplate

### 消息角色构建

```python
from langchain_core.prompts import ChatPromptTemplate

# 方式1：从消息元组创建
template = ChatPromptTemplate.from_messages([
    ("system", "你是一个专业的{profession}。"),
    ("human", "你好，我需要了解{topic}。"),
    ("ai", "您好！关于{topic}，我很乐意为您解答。")
])

# 调用
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
| **PlaceholderMessage** | 占位符 | 动态插入对话历史 |

```python
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from langchain_core.prompts import ChatPromptTemplate

# 显式创建消息
template = ChatPromptTemplate.from_messages([
    SystemMessage(content="你是一个乐于助人的助手。"),
    HumanMessage(content="什么是量子计算？"),
    AIMessage(content="量子计算是一种利用量子力学原理的计算方式..."),
    HumanMessage(content="{user_input}")  # 动态输入
])

prompt = template.invoke({"user_input": "能详细解释一下吗？"})
```

### Placeholder 占位符

```python
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

# 使用 MessagesPlaceholder
template = ChatPromptTemplate.from_messages([
    ("system", "你是一个对话助手。以下是之前的对话历史："),
    MessagesPlaceholder(variable_name="history"),
    ("human", "{question}"),
])

# 准备对话历史
history = [
    HumanMessage(content="我叫张三"),
    AIMessage(content="您好张三，很高兴认识您！"),
]

# 调用
prompt = template.invoke({
    "history": history,
    "question": "我叫什么名字？"
})
```

## Few-Shot 学习模板

### 基础 Few-Shot

```python
from langchain_core.prompts import PromptTemplate, FewShotPromptTemplate

# 定义示例
examples = [
    {"input": "开心", "output": "happy"},
    {"input": "悲伤", "output": "sad"},
    {"input": "惊讶", "output": "surprised"},
]

# 示例模板
example_prompt = PromptTemplate.from_template(
    "中文：{input} -> 英文：{output}"
)

# Few-Shot 提示词
few_shot_prompt = FewShotPromptTemplate(
    examples=examples,
    example_prompt=example_prompt,
    prefix="将以下中文情感词翻译成英文：",
    suffix="中文：{word} -> 英文：",
    input_variables=["word"]
)

# 调用
prompt = few_shot_prompt.invoke({"word": "兴奋"})
print(prompt.to_string())
```

### 示例选择器

```python
from langchain_core.prompts import FewShotPromptTemplate, PromptTemplate
from langchain_core.example_selectors import SemanticSimilarityExampleSelector
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import Chroma

# 示例集合
examples = [
    {"input": "今天心情很好", "output": "happy"},
    {"input": "考试没考好很难过", "output": "sad"},
    {"input": "收到礼物很开心", "output": "happy"},
    {"input": "生病了很不舒服", "output": "sad"},
]

# 创建示例选择器
example_selector = SemanticSimilarityExampleSelector.from_examples(
    examples=examples,
    embeddings=OpenAIEmbeddings(),
    vectorstore_cls=Chroma,
    k=2  # 选择最相似的2个示例
)

# 使用选择器创建 Few-Shot 模板
few_shot_prompt = FewShotPromptTemplate(
    example_selector=example_selector,
    example_prompt=PromptTemplate.from_template(
        "中文：{input} -> 情感：{output}"
    ),
    prefix="判断以下句子的情感：",
    suffix="中文：{sentence} -> 情感：",
    input_variables=["sentence"]
)

# 调用
prompt = few_shot_prompt.invoke({
    "sentence": "中彩票了，太高兴了！"
})
```

### 动态 Few-Shot

```python
from langchain_core.prompts import FewShotPromptTemplate, PromptTemplate

# 根据输入动态选择示例数量
template = FewShotPromptTemplate(
    examples=[
        {"word": "运行", "type": "动词"},
        {"word": "美丽", "type": "形容词"},
        {"word": "快速", "type": "形容词"},
    ],
    example_prompt=PromptTemplate.from_template(
        "单词：{word} -> 词性：{type}"
    ),
    suffix="单词：{input_word} -> 词性：",
    prefix=lambda x: f"根据{'少' if x.get('difficulty') == 'easy' else '多'}量示例判断词性：",
    input_variables=["input_word", "difficulty"]
)

# 简单难度
prompt_easy = template.invoke({"input_word": "奔跑", "difficulty": "easy"})
# 困难难度
prompt_hard = template.invoke({"input_word": "奔跑", "difficulty": "hard"})
```

## 管道模板

### 组合多个模板

```python
from langchain_core.prompts import PromptTemplate, ChatPromptTemplate

# 模板1：问题分析
analysis_template = PromptTemplate.from_template(
    "分析这个问题：{question}\n关键点："
)

# 模板2：答案生成
answer_template = PromptTemplate.from_template(
    """基于以下分析回答问题：

    分析：{analysis}

    问题：{question}

    回答："""
)

# 组合使用
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
    """根据任务类型返回不同的模板"""
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

# 使用
template = create_template("translate")
prompt = template.invoke({"lang": "英文", "text": "你好世界"})
```

### 列表变量

```python
from langchain_core.prompts import PromptTemplate

# 列表变量
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

# 创建解析器
parser = JsonOutputParser()

# 将格式指令注入模板
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

### 自定义格式化

```python
from langchain_core.prompts import PromptTemplate

class MarkdownFormatter:
    def format(self, text: str) -> str:
        return f"```\n{text}\n```"

formatter = MarkdownFormatter()

template = PromptTemplate.from_template(
    formatter.format("请解释{concept}：\n{content}")
)

prompt = template.invoke({
    "concept": "递归",
    "content": "什么是递归？"
})
```

## 模板继承和扩展

### 基础模板复用

```python
from langchain_core.prompts import PromptTemplate

# 基础模板
base_template = """你是一个AI助手。请回答用户的问题。

问题：{question}
回答："""

# 扩展模板（添加额外指令）
extended_template = base_template + "\n\n请用简洁专业的语言回答。"

# 创建模板
template = PromptTemplate.from_template(extended_template)
```

## 最佳实践

### 1. 结构化提示词

```python
# 推荐：结构化模板
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
# 推荐：使用 partial 分离固定内容
fixed_instructions = PromptTemplate.from_template(
    "你是一个{profession}专家，遵循专业规范回答问题。",
    partial_variables={"profession": "Python编程"}
)
```

### 3. 版本控制提示词

```python
# 推荐：为模板添加版本标识
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
# 打印完整的提示词内容
template = PromptTemplate.from_template("Hello {name}!")
prompt = template.invoke({"name": "World"})
print(prompt.to_string())  # Hello World!
```

### Q2：如何处理可选变量？

```python
# 使用 partial 填充部分变量
template = PromptTemplate.from_template(
    "分析{topic}，难度：{level}",
    partial_variables={"level": "中等"}  # 设为默认值
)
```

### Q3：如何在模板中使用条件逻辑？

```python
# 在调用前准备数据
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
