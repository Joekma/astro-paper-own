---
title: Python SAP Fiori XML解析
author: Joekma
pubDatetime: 2024-08-13T00:00:00Z
slug: python-sap-fiori-xml
modDatetime: 2026-04-22T00:00:00Z
featured: false
draft: false
tags:
  - Python
  - SAP
  - docs
description: Python XML 解析实战指南，涵盖 DOM、SAX、ElementTree 以及 SAP Fiori XML 数据处理。

series: python
seriesOrder: 51
language: zh-CN
---

# Python SAP Fiori XML解析

## XML 解析方式对比

### DOM vs SAX

操作XML有两种方法：**DOM** 和 **SAX**

- **DOM**：会把整个XML读入内存，解析为树，因此**占用内存大，解析慢**，优点是可以任意遍历树的节点
- **SAX**：是流模式，边读边解析，**占用内存小，解析快**，缺点是需要自己处理事件

> **推荐**：正常情况下，优先考虑SAX，因为DOM实在太占内存。

### SAX 事件处理机制

在Python中使用SAX解析XML非常简洁，通常关心的事件是：

- `start_element`：开始元素事件
- `end_element`：结束元素事件
- `char_data`：字符数据事件

准备好这3个函数，然后就可以解析xml了。

举个例子，当SAX解析器读到一个节点时：

```html
<a href="/">python</a>
```

会产生3个事件：

1. `start_element` 事件，在读取 `<a href="/">` 时
2. `char_data` 事件，在读取 `python` 时
3. `end_element` 事件，在读取 `</a>` 时

### SAX 解析示例

```python
from xml.parsers.expat import ParserCreate

class DefaultSaxHandler(object):
    def start_element(self, name, attrs):
        print('sax:start_element: %s, attrs: %s' % (name, str(attrs)))

    def end_element(self, name):
        print('sax:end_element: %s' % name)

    def char_data(self, text):
        print('sax:char_data: %s' % text)

xml = r'''<?xml version="1.0"?>
<ol>
    <li><a href="/python">Python</a></li>
    <li><a href="/ruby">Ruby</a></li>
</ol>
'''

handler = DefaultSaxHandler()
parser = ParserCreate()
parser.StartElementHandler = handler.start_element
parser.EndElementHandler = handler.end_element
parser.CharacterDataHandler = handler.char_data
parser.Parse(xml)
```

> **注意**：读取一大段字符串时，`CharacterDataHandler` 可能被多次调用，需要自己保存起来，在 `EndElementHandler` 里面再合并。

### 生成 XML

除了解析XML外，如何生成XML呢？

99%的情况下需要生成的XML结构都是非常简单的，因此，最简单也是最有效的生成XML的方法是**拼接字符串**：

```python
L = []
L.append(r'<?xml version="1.0"?>')
L.append(r'<root>')
L.append(encode('some & data'))
L.append(r'</root>')
return ''.join(L)
```

> **建议**：如果要生成复杂的XML，建议不要用XML，改成JSON。

## Python 标准库之 ElementTree

Python中有多种xml处理API，常用的有：

- `xml.dom.*` 模块
- `xml.sax.*` 模块
- `xml.parser.expat` 模块
- `xml.etree.ElementTree` 模块（简称 ET）

### ElementTree 核心概念

ET使用 **Element** 表示xml中的节点、文本、注释等。其主要属性如下：

| 属性 | 类型 | 说明 |
|------|------|------|
| **tag** | string | 表示数据代表的种类，当为节点时为节点名称 |
| **text** | string | 表示element的内容 |
| **attrib** | dictionary | 表示附有的属性 |
| **tail** | string | 表示element闭合之后的尾迹 |
| **若干子元素** | child elements | 包含的子节点 |

```xml
<tag attrib1=1>text</tag>tail
```

> **安全提示**：ET模块对于那些恶意构造的数据并不是安全的，如果需要解析不可信的数据，最好了解一下XML的安全弱点。

### 一、导入 ET 模块

```python
try:
    import xml.etree.cElementTree as ET
except ImportError:
    import xml.etree.ElementTree as ET
```

> **兼容性说明**：从Python 3.3开始，会默认使用cElementTree来加快速度，但是之前的版本最好使用如上的代码，以提高代码的兼容性。

### 二、解析 XML

```python
# 从文件中解析xml文件
tree = ET.ElementTree(file='doc.xml')
root = tree.getroot()  # 获取根节点

# 从内存字符串中解析xml
root = ET.fromstring(country_data_as_string)
```

### 三、访问数据

```python
# 遍历所有子节点
for child in root:
    print(child.tag, child.attrib)

# 使用索引寻找子节点
root[0][1].text

# 使用xpath方式进行遍历
root.findall("./country/neighbor")
```

### 四、流式处理 XML

```python
for event, elem in ET.iterparse(sys.argv[1]):
    if event == 'end':
        if elem.tag == 'location' and elem.text == 'Zimbabwe':
            count += 1
    elem.clear()  # discard the element
```

> **内存优化**：最后需要使用 `elem.clear()` 来释放内存，避免内存溢出。

### 五、Element 对象方法

| 方法 | 说明 |
|------|------|
| `clear()` | 清空元素的后代、属性、text和tail也设置为None |
| `get(key, default=None)` | 获取key对应的属性值 |
| `items()` | 根据属性字典返回一个列表 |
| `keys()` | 返回包含所有元素属性键的列表 |
| `set(key, value)` | 设置新的属性键与值 |
| `append(subelement)` | 添加直系子元素 |
| `extend(subelements)` | 增加一串元素对象作为子元素 |
| `find(match)` | 寻找第一个匹配子元素 |
| `findall(match)` | 寻找所有匹配子元素 |
| `findtext(match)` | 寻找第一个匹配子元素，返回其text值 |
| `insert(index, element)` | 在指定位置插入子元素 |
| `iter(tag=None)` | 生成遍历当前元素所有后代或者给定tag的后代的迭代器 |
| `iterfind(match)` | 根据tag或path查找所有的后代 |
| `itertext()` | 遍历所有后代并返回text值 |
| `remove(subelement)` | 删除子元素 |

### 六、ElementTree 对象方法

```text
class xml.etree.ElementTree.ElementTree(element=None, file=None)
```

| 方法 | 说明 |
|------|------|
| `find(match)` | 寻找匹配子元素 |
| `findall(match)` | 寻找所有匹配子元素 |
| `findtext(match, default=None)` | 寻找匹配子元素 |
| `iter(tag=None)` | 遍历元素 |
| `iterfind(match)` | 根据tag查找后代 |
| `parse(source, parser=None)` | 装载xml对象 |
| `getroot()` | 获取根节点 |
| `write(file, encoding="us-ascii", xml_declaration=None, method="xml")` | 写入文件 |

### 七、模块常用方法

| 方法 | 说明 |
|------|------|
| `ET.Comment(text=None)` | 创建一个特别的element，代表comment |
| `ET.dump(elem)` | 生成一个element tree，通过sys.stdout输出 |
| `ET.fromstring(text)` | 从字符串中解析出xml片段，返回Element实例 |
| `ET.fromstringlist(sequence, parser=None)` | 从字符串的序列对象中解析xml文档 |
| `ET.iselement(element)` | 检查是否是一个element对象 |
| `ET.iterparse(source, events=None, parser=None)` | 将文件递增解析为element tree |
| `ET.parse(source, parser=None)` | 将文件或者字符串解析为element tree |
| `ET.ProcessingInstruction(target, text=None)` | 创建一个element，代表xml处理命令 |
| `ET.register_namespace(prefix, uri)` | 注册命名空间前缀 |
| `ET.SubElement(parent, tag, attrib={}, **extra)` | 子元素工厂 |
| `ET.tostring(element, encoding="us-ascii", method="xml")` | 生成字符串来表示xml的element |
| `ET.tostringlist(element, encoding="us-ascii", method="xml")` | 生成字符串列表 |
| `ET.XML(text, parser=None)` | 从字符串常量中解析出xml片段 |
| `ET.XMLID(text, parser=None)` | 解析出xml片段，返回映射element的id到其自身的字典 |

## SAP Fiori XML 实战解析

### 业务场景

在实际项目中，SAP Fiori系统经常需要处理复杂的XML格式数据。以下是一个典型的员工费用明细XML解析示例：

```python
import xml.etree.ElementTree as ET

def parse_feed_xml(file_path):
    tree = ET.parse(file_path)
    root = tree.getroot()  # 获取根元素

    b = []
    a = {}

    for e in root.iter('{http://www.w3.org/2005/Atom}entry'):
        for element_index, element in enumerate(e.iter()):  # 遍历所有元素
            if 'Zzbzr' in element.tag:  # 员工编号
                a.setdefault("员工编号", element.text)
            elif 'Nachn' in element.tag:  # 员工姓名
                a.setdefault("员工姓名", element.text)
            elif 'Zytmc' in element.tag:  # 员工费用明细信息业务用途
                a.setdefault("业务用途", element.text)
            elif 'Zpjbh' in element.tag:  # 员工费用明细信息发票号码
                a.setdefault("发票号码", element.text)
            elif 'Zksrq' in element.tag:  # 报销期间-开始日期
                a.setdefault("报销期间-开始日期", element.text)
            elif 'Zjzrq' in element.tag:  # 报销期间-截止日期
                a.setdefault("报销期间-截止日期", element.text)
            elif 'Ztxbz' in element.tag:  # 费用标准
                a.setdefault("费用标准", element.text)
            elif 'Wrbtr' in element.tag:  # 报账金额
                a.setdefault("报账金额", element.text)
            elif 'Sgtxt' in element.tag:  # 摘要
                a.setdefault("摘要", element.text)
            elif 'Zysbmt' in element.tag:  # 成本中心
                a.setdefault("成本中心", element.text)
            elif 'Zczfmc' in element.tag:  # 出租方名称
                a.setdefault("出租方名称", element.text)

            if element_index == len(list(e.iter())) - 1:
                是否关联发票 = "是" if a.get("发票号码") else "否"
                a["是否关联发票"] = 是否关联发票
                b.append(a)
                a = {}
    return b
```

### 解析要点

1. **处理命名空间**：SAP Fiori的XML通常使用Atom命名空间，需要正确处理
2. **遍历所有元素**：使用 `iter()` 方法递归遍历所有后代元素
3. **字段匹配**：根据元素标签名称匹配对应的业务字段
4. **状态标记**：根据发票号码判断是否关联发票

---
