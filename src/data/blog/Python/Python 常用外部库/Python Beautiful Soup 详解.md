---
title: Python Beautiful Soup 详解
author: Joekma
pubDatetime: 2024-08-13T00:00:00Z
slug: python-beautiful-soup
modDatetime: 2026-04-22T00:00:00Z
featured: false
draft: false
tags:
  - Python
  - Beautiful Soup
  - docs
description: Beautiful Soup 完全指南，Python 强大的 HTML/XML 解析库，涵盖解析器选择、文档遍历、搜索过滤等核心功能。
series: python
language: zh-CN
---

# Python Beautiful Soup 详解

## 简介

Beautiful Soup 是一个可以从HTML或XML文件中提取数据的Python库。它能够通过你喜欢的转换器实现惯用的文档导航、查找、修改文档的方式。Beautiful Soup会帮你节省数小时甚至数天的工作时间。

> **重要提示**: Beautiful Soup 3 目前已经停止开发，官网推荐在现在的项目中使用 Beautiful Soup 4。

### 核心特性

- **强大的容错能力**: 自动处理不完整的HTML/XML文档
- **多种解析器支持**: 支持Python标准库、lxml、html5lib等解析器
- **灵活的搜索方法**: 提供多种方式查找和提取数据
- **简洁的API**: 易于学习和使用
- **轻量级**: 无需复杂的配置即可使用

## 安装与配置

### 安装 Beautiful Soup

```bash
# 使用 pip 安装
pip install beautifulsoup4

# 使用 conda 安装
conda install beautifulsoup4
```

### 安装解析器

Beautiful Soup 支持Python标准库中的HTML解析器，还支持一些第三方的解析器。

#### 安装 lxml 解析器

```bash
# Ubuntu/Debian
apt-get install python-lxml

# 使用 easy_install
easy_install lxml

# 使用 pip (推荐)
pip install lxml
```

#### 安装 html5lib 解析器

```bash
# Ubuntu/Debian
apt-get install python-html5lib

# 使用 easy_install
easy_install html5lib

# 使用 pip
pip install html5lib
```

> **推荐**: 使用 `lxml` 解析器，因为它具有最佳的性能和容错能力。

## 解析器选择

下表列出了主要的解析器以及它们的优缺点。**官网推荐使用 lxml 作为解析器，因为效率更高。**

> **注意**: 在 Python 2.7.3 之前和 Python 3.2.2 之前的版本中，必须安装 lxml 或 html5lib，因为那些 Python 版本的标准库中内置的 HTML 解析方法不够稳定。

### 解析器对比表

| 解析器 | 使用方法 | 优势 | 劣势 |
|--------|----------|------|------|
| **Python标准库** | `BeautifulSoup(markup, "html.parser")` | • Python的内置标准库<br>• 执行速度适中<br>• 文档容错能力强 | • Python 2.7.3 or 3.2.2前的版本中文档容错能力差 |
| **lxml HTML 解析器** | `BeautifulSoup(markup, "lxml")` | • 速度快<br>• 文档容错能力强 | • 需要安装C语言库 |
| **lxml XML 解析器** | `BeautifulSoup(markup, ["lxml", "xml"])`<br>`BeautifulSoup(markup, "xml")` | • 速度快<br>• 唯一支持XML的解析器 | • 需要安装C语言库 |
| **html5lib** | `BeautifulSoup(markup, "html5lib")` | • 最好的容错性<br>• 以浏览器的方式解析文档<br>• 生成HTML5格式的文档 | • 速度慢<br>• 不依赖外部扩展 |

### 解析器选择建议

- **推荐使用**: `lxml` - 速度和容错性的最佳平衡
- **Web兼容性**: `html5lib` - 与浏览器行为最接近
- **轻量级**: `html.parser` - 无需额外安装
- **XML文档**: `lxml` XML解析器 - 唯一支持XML的选择

> **官方文档**: <https://www.crummy.com/software/BeautifulSoup/bs4/doc/index.zh.html>

## 基本使用

### 容错处理示例

Beautiful Soup 的一个重要特性是**容错能力**，即在 HTML 代码不完整的情况下，能够自动识别并修复错误。

```python
from bs4 import BeautifulSoup

# 示例HTML文档
html_doc = """
<html><head><title>The Dormouse's story</title></head>
<body>
<p class="title"><b>The Dormouse's story</b></p>

<p class="story">Once upon a time there were three little sisters; and their names are
<a href="http://example.com/elsie" class="sister" id="link1">Elsie</a>,
<a href="http://example.com/lacie" class="sister" id="link2">Lacie</a> and
<a href="http://example.com/tillie" class="sister" id="link3">Tillie</a>;
and they lived at the bottom of a well.</p>

<p class="story">...</p>
</body></html>
"""

# 创建BeautifulSoup对象（使用lxml解析器）
soup = BeautifulSoup(html_doc, 'lxml')

# 格式化输出，处理缩进和结构化显示
formatted_html = soup.prettify()
print(formatted_html)
```

### 从文件读取

```python
# 从HTML文件读取
with open('example.html', 'r', encoding='utf-8') as file:
    soup = BeautifulSoup(file, 'lxml')

# 或者直接使用文件路径
soup = BeautifulSoup(open('example.html'), 'lxml')
```

### 基本操作

```python
# 获取文档标题
title = soup.title.string
print(f"标题: {title}")

# 获取第一个p标签
first_p = soup.p
print(f"第一个段落: {first_p}")

# 获取所有链接
all_links = soup.find_all('a')
for link in all_links:
    print(f"链接: {link.get('href')} - 文本: {link.string}")
```

## 遍历文档树

遍历文档树是指**直接通过标签名字选择**，特点是选择速度快，但如果存在多个相同的标签则只返回第一个。

### 准备示例文档

```python
from bs4 import BeautifulSoup

html_doc = """
<html><head><title>The Dormouse's story</title></head>
<body>
<p id="my p" class="title"><b id="bbb" class="boldest">The Dormouse's story</b></p>

<p class="story">Once upon a time there were three little sisters; and their names were
<a href="http://example.com/elsie" class="sister" id="link1">Elsie</a>,
<a href="http://example.com/lacie" class="sister" id="link2">Lacie</a> and
<a href="http://example.com/tillie" class="sister" id="link3">Tillie</a>;
and they lived at the bottom of a well.</p>

<p class="story">...</p>
</body></html>
"""

soup = BeautifulSoup(html_doc, 'lxml')
```

### 基本用法

```python
# 直接通过标签名访问（返回第一个匹配的标签）
print(soup.p)  # 第一个p标签
print(soup.a)  # 第一个a标签
```

### 获取标签信息

```python
# 获取标签名称
print(soup.p.name)  # 'p'

# 获取标签属性（字典形式）
print(soup.p.attrs)  # {'id': 'my p', 'class': ['title']}

# 获取特定属性
print(soup.p['id'])  # 'my p'
print(soup.p.get('class'))  # ['title']
```

### 获取标签内容

```python
# 获取标签内的文本（只有一个文本节点时）
print(soup.title.string)  # "The Dormouse's story"

# 获取所有文本内容（包括子标签）
print(soup.p.text)  # "The Dormouse's story"
print(soup.p.get_text())  # 同上

# 获取所有文本（生成器对象）
for text in soup.p.strings:
    print(repr(text))

# 获取去除空白的文本
for text in soup.stripped_strings:
    print(text)
```

> **注意**: 如果标签包含多个子节点，`.string` 方法返回 `None`。

### 嵌套选择

```python
# 嵌套访问标签
print(soup.head.title.string)  # "The Dormouse's story"
print(soup.body.a.string)  # "Elsie"
```

### 子节点操作

```python
# 获取所有直接子节点（列表）
print(soup.p.contents)

# 获取所有直接子节点（迭代器）
for i, child in enumerate(soup.p.children):
    print(f"子节点 {i}: {child}")

# 获取所有子孙节点（迭代器）
for i, descendant in enumerate(soup.p.descendants):
    print(f"子孙节点 {i}: {descendant}")
```

### 父节点操作

```python
# 获取直接父节点
print(soup.a.parent)  # p标签

# 获取所有祖先节点（迭代器）
for parent in soup.a.parents:
    print(f"祖先节点: {parent.name}")
```

### 兄弟节点操作

```python
# 获取下一个兄弟节点
print(soup.a.next_sibling)

# 获取上一个兄弟节点
print(soup.a.previous_sibling)

# 获取后面的所有兄弟节点
print(list(soup.a.next_siblings))

# 获取前面的所有兄弟节点
print(list(soup.a.previous_siblings))
```

## 搜索文档树

Beautiful Soup 定义了很多搜索方法，这里着重介绍两个最常用的：`find()` 和 `find_all()`。

### 五种过滤器类型

Beautiful Soup 支持5种过滤器：**字符串、正则表达式、列表、True、方法**。

#### 字符串过滤器

```python
# 按标签名查找
print(soup.find_all('b'))  # 查找所有b标签
print(soup.find_all('a'))  # 查找所有a标签
```

#### 正则表达式过滤器

```python
import re

# 查找以'b'开头的标签
print(soup.find_all(re.compile('^b')))  # 返回body和b标签

# 查找包含特定文本的标签
print(soup.find_all(string=re.compile('Dormouse')))
```

#### 列表过滤器

```python
# 查找多个标签类型
print(soup.find_all(['a', 'b']))  # 查找所有a标签和b标签
print(soup.find_all(['title', 'p']))  # 查找所有title和p标签
```

#### True 过滤器

```python
# 查找所有标签（不返回字符串节点）
all_tags = soup.find_all(True)
for tag in all_tags:
    print(f"标签名: {tag.name}")
```

#### 方法过滤器

```python
# 自定义过滤方法
def has_class_but_no_id(tag):
    """有class属性但没有id属性的标签"""
    return tag.has_attr('class') and not tag.has_attr('id')

def contains_sister_text(tag):
    """包含'sister'文本的标签"""
    return tag.string and 'sister' in tag.string

print(soup.find_all(has_class_but_no_id))
print(soup.find_all(contains_sister_text))
```

### find_all() 方法详解

`find_all(name, attrs, recursive, text, **kwargs)` 方法返回文档中符合条件的所有标签。

#### name 参数

```python
# name 参数可以是任何过滤器类型
print(soup.find_all(name=re.compile('^t')))  # 查找以t开头的标签
print(soup.find_all(name=['a', 'b']))  # 查找a和b标签
print(soup.find_all(name=True))  # 查找所有标签
```

#### keyword 参数 (属性搜索)

```python
# 按属性查找
print(soup.find_all(id=re.compile('my')))  # id包含'my'的标签
print(soup.find_all(href=re.compile('lacie'), id=re.compile(r'\d')))  # 多条件
print(soup.find_all(id=True))  # 有id属性的标签

# 注意：class是Python关键字，要使用class_
print(soup.find_all(class_='sister'))  # 查找class为sister的标签
print(soup.find_all('a', class_='sister'))  # 查找class为sister的a标签
```

#### class_ 参数详解

```python
# 查找特定类名的标签
print(soup.find_all('a', class_='sister'))  # class为sister的a标签
print(soup.find_all('a', class_='sister ssss'))  # 多个类名（顺序敏感）
print(soup.find_all(class_=re.compile('^sis')))  # 类名以sis开头的标签

# 多个类名的不同写法
print(soup.find_all(class_=['sister', 'title']))  # 任一类名匹配
```

#### attrs 参数

```python
# 使用字典形式查找属性
print(soup.find_all('p', attrs={'class': 'story'}))
print(soup.find_all(attrs={'id': 'link1', 'class': 'sister'}))
```

#### string 参数

```python
# 按文本内容查找
print(soup.find_all(string='Elsie'))  # 文本为'Elsie'的节点
print(soup.find_all('a', string='Elsie'))  # 文本为'Elsie'的a标签
print(soup.find_all(string=re.compile('story')))  # 文本包含'story'的节点
print(soup.find_all(string=['Elsie', 'Lacie']))  # 文本为任一值的节点
```

#### limit 参数

```python
# 限制返回结果数量（类似SQL的LIMIT）
print(soup.find_all('a', limit=2))  # 只返回前2个a标签
print(soup.find_all('p', limit=1))  # 只返回第1个p标签
```

#### recursive 参数

```python
# 是否递归搜索子节点
print(soup.html.find_all('a'))  # 搜索所有子孙节点中的a标签
print(soup.html.find_all('a', recursive=False))  # 只搜索直接子节点中的a标签
```

### find() 方法详解

`find(name, attrs, recursive, text, **kwargs)` 方法返回文档中符合条件的**第一个**标签。

#### find() 与 find_all() 的区别

```python
# find_all() 返回列表，find() 返回单个元素
title_all = soup.find_all('title', limit=1)  # [<title>The Dormouse's story</title>]
title_single = soup.find('title')  # <title>The Dormouse's story</title>

# 未找到目标时的返回值
print(soup.find_all("nosuchtag"))  # [] (空列表)
print(soup.find("nosuchtag"))  # None
```

#### 使用场景

```python
# 适合查找唯一元素的场景
body_tag = soup.find('body')  # 只有一个body标签
head_tag = soup.find('head')  # 只有一个head标签

# 查找特定条件的第一个元素
first_link = soup.find('a', class_='sister')
first_story = soup.find('p', class_='story')
```

#### 嵌套查找的简写

```python
# 以下写法等价
soup.head.title  # 简写形式
soup.find("head").find("title")  # 完整形式

# 更多嵌套示例
soup.body.p.b  # 简写
soup.find("body").find("p").find("b")  # 完整
```

## CSS选择器

Beautiful Soup 提供了 `select()` 方法来支持 CSS 选择器语法。

> **官方文档**: <https://www.crummy.com/software/BeautifulSoup/bs4/doc/index.zh.html#id37>

### 准备示例

```python
from bs4 import BeautifulSoup

html_doc = """
<html><head><title>The Dormouse's story</title></head>
<body>
<p class="title">
    <b>The Dormouse's story</b>
    Once upon a time there were three little sisters; and their names were
    <a href="http://example.com/elsie" class="sister" id="link1">
        <span>Elsie</span>
    </a>
    <a href="http://example.com/lacie" class="sister" id="link2">Lacie</a> and
    <a href="http://example.com/tillie" class="sister" id="link3">Tillie</a>;
    <div class='panel-1'>
        <ul class='list' id='list-1'>
            <li class='element'>Foo</li>
            <li class='element'>Bar</li>
            <li class='element'>Jay</li>
        </ul>
        <ul class='list list-small' id='list-2'>
            <li class='element'><h1 class='yyyy'>Foo</h1></li>
            <li class='element xxx'>Bar</li>
            <li class='element'>Jay</li>
        </ul>
    </div>
    and they lived at the bottom of a well.</p>
<p class="story">...</p>
</body></html>
"""

soup = BeautifulSoup(html_doc, 'lxml')
```

### 常用CSS选择器

#### 类选择器

```python
# 选择class为sister的所有元素
print(soup.select('.sister'))

# 选择class为sister的span元素
print(soup.select('.sister span'))

# 选择多个类名
print(soup.select('.list.list-small'))
```

#### ID选择器

```python
# 选择id为link1的元素
print(soup.select('#link1'))

# 选择id为link1下的span元素
print(soup.select('#link1 span'))

# 选择id为list-2下的class为element.xxx的元素
print(soup.select('#list-2 .element.xxx'))
```

#### 标签选择器

```python
# 选择所有a标签
print(soup.select('a'))

# 选择所有p标签
print(soup.select('p'))

# 选择所有li标签
print(soup.select('li'))
```

#### 层级选择器

```python
# 后代选择器（空格）
print(soup.select('div span'))  # div下的所有span
print(soup.select('ul li'))     # ul下的所有li

# 子选择器（>）
print(soup.select('ul > li'))   # ul的直接子元素li

# 相邻兄弟选择器（+）
print(soup.select('h1 + p'))    # h1后面的第一个p

# 普通兄弟选择器（~）
print(soup.select('h1 ~ p'))    # h1后面的所有p
```

#### 属性选择器

```python
# 选择有href属性的a标签
print(soup.select('a[href]'))

# 选择href为特定值的a标签
print(soup.select('a[href="http://example.com/elsie"]'))

# 选择href包含特定字符串的a标签
print(soup.select('a[href*="example.com"]'))

# 选择href以特定字符串开头的a标签
print(soup.select('a[href^="http://example.com/"]'))

# 选择href以特定字符串结尾的a标签
print(soup.select('a[href$="tillie"]'))
```

#### 伪类选择器

```python
# 选择第一个元素
print(soup.select('li:first-child'))

# 选择最后一个元素
print(soup.select('li:last-child'))

# 选择第n个元素
print(soup.select('li:nth-child(2)'))
```

### 组合选择器

```python
# 多条件组合
print(soup.select('a.sister[href*="example.com"]'))

# 复杂选择器
print(soup.select('#list-2 > li.element.xxx'))

# 多个选择器（逗号分隔）
print(soup.select('a, b, span'))
```

### 获取选择器结果

```python
# 获取属性
selected = soup.select('#list-2 h1')[0]
print(selected.attrs)  # {'class': ['yyyy']}

# 获取文本内容
print(selected.get_text())  # 'Foo'
print(selected.string)      # 'Foo'

# 获取特定属性
print(selected.get('class'))  # ['yyyy']
```

### CSS选择器 vs find方法

```python
# CSS选择器方式
css_results = soup.select('.sister')

# 等价的find方式
find_results = soup.find_all(class_='sister')

# 两者结果相同，选择器语法更简洁
```

---
