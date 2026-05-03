---
title: Python StringIO与BytesIO
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-04-22T00:00:00.000+08:00
slug: python-stringio-bytesio
description: '深入理解 Python StringIO与BytesIO：内存读写、缓冲区操作'
tags:
  - Python
  - IO
  - StringIO
  - BytesIO
category: Python中级
draft: false
language: zh-CN
---

# Python StringIO与BytesIO

## StringIO

很多时候，数据读写不一定是文件，也可以在内存中读写。

StringIO顾名思义就是在内存中读写str。

要把str写入StringIO，我们需要先创建一个StringIO，然后，像文件一样写入即可：
```python

>>> from io import StringIO
>>> f = StringIO()
>>> f.write('hello') # 5
>>> f.write(' ') # 1
>>> f.write('world!') # 6
>>> print(f.getvalue()) # hello world!

```
`getvalue()`方法用于获得写入后的str。

要读取StringIO，可以用一个str初始化StringIO，然后，像读文件一样读取：
```python
>>> from io import StringIO
>>> f = StringIO('Hello!\nHi!\nGoodbye!')
>>> while True:
...     s = f.readline()
...     if s == '':
...         break
...     print(s.strip())

```
## BytesIO

StringIO操作的只能是str，如果要操作二进制数据，就需要使用BytesIO。

BytesIO实现了在内存中读写bytes，我们创建一个BytesIO，然后写入一些bytes：
```python
>>> from io import BytesIO
>>> f = BytesIO()
>>> f.write('中文'.encode('utf-8')) # 6
>>> print(f.getvalue()) # b'\xe4\xb8\xad\xe6\x96\x87'

```
请注意，写入的不是str，而是经过UTF-8编码的bytes。

和StringIO类似，可以用一个bytes初始化BytesIO，然后，像读文件一样读取：
```python
>>> from io import BytesIO
>>> f = BytesIO(b'\xe4\xb8\xad\xe6\x96\x87')
>>> f.read() # b'\xe4\xb8\xad\xe6\x96\x87'
```
StringIO和BytesIO是在内存中操作str和bytes的方法，使得和读写文件具有一致的接口。

## 实际应用场景

### 1. 单元测试中的模拟文件

在单元测试中，我们经常需要模拟文件操作，而不需要创建真实的临时文件：

```python
from io import StringIO
import unittest

def process_lines(f):
    """处理文件每一行"""
    return [line.strip() for line in f.readlines()]

class TestProcessLines(unittest.TestCase):
    def test_process_lines(self):
        # 模拟文件内容
        mock_file = StringIO("Hello\nWorld\nPython")
        result = process_lines(mock_file)
        self.assertEqual(result, ["Hello", "World", "Python"])

    def test_empty_file(self):
        mock_file = StringIO("")
        result = process_lines(mock_file)
        self.assertEqual(result, [])
```

### 2. 捕获打印输出

有时候我们需要捕获函数的打印输出进行测试或验证：

```python
from io import StringIO
import sys

def greet(name):
    print(f"Hello, {name}!")

class TestGreet:
    def test_capture_stdout(self):
        # 创建内存缓冲区捕获输出
        captured_output = StringIO()
        sys.stdout = captured_output  # 重定向标准输出
        
        greet("Alice")
        
        sys.stdout = sys.__stdout__  # 恢复标准输出
        output = captured_output.getvalue()
        
        assert output == "Hello, Alice!\n"
```

### 3. 数据过滤和转换

StringIO 非常适合用于流式数据处理：

```python
from io import StringIO

def filter_words(text, remove_words):
    """过滤文本中的指定词语"""
    stream = StringIO(text)
    result = []
    
    for line in stream:
        words = line.split()
        filtered = [w for w in words if w not in remove_words]
        result.append(' '.join(filtered))
    
    return '\n'.join(result)

text = "This is a simple text with some simple words"
remove = {"a", "is", "some"}
result = filter_words(text, remove)
print(result)  # "This  simple text with  simple words"
```

### 4. BytesIO 与数据压缩

BytesIO 可以与 gzip 等压缩模块配合使用，实现内存中的数据压缩：

```python
from io import BytesIO
import gzip

# 压缩数据
data = b"Hello, World! This is some text to be compressed."
buffer = BytesIO()

with gzip.GzipFile(fileobj=buffer, mode='wb') as gz_file:
    gz_file.write(data)

compressed_data = buffer.getvalue()
print(f"原始大小: {len(data)} 字节")
print(f"压缩后: {len(compressed_data)} 字节")

# 解压缩数据
buffer = BytesIO(compressed_data)
with gzip.GzipFile(fileobj=buffer, mode='rb') as gz_file:
    decompressed_data = gz_file.read()

print(f"解压后: {decompressed_data.decode()}")
```

### 5. 处理图片和二进制数据

BytesIO 可以用于图片处理库（如 Pillow）：

```python
from io import BytesIO
from PIL import Image

# 创建图片
img = Image.new('RGB', (100, 100), color='red')

# 保存到 BytesIO（内存中）
buffer = BytesIO()
img.save(buffer, format='PNG')
png_bytes = buffer.getvalue()

print(f"PNG 图片大小: {len(png_bytes)} 字节")

# 从 BytesIO 读取图片
buffer = BytesIO(png_bytes)
loaded_img = Image.open(buffer)
print(f"图片尺寸: {loaded_img.size}")
```

## 高级用法

### seek() 和 tell() - 控制读写位置

```python
from io import StringIO

f = StringIO("Hello, World!")

# tell() - 获取当前位置
print(f"初始位置: {f.tell()}")  # 0

# read() - 读取所有内容
content = f.read()
print(f"读取后位置: {f.tell()}")  # 13

# seek() - 移动到指定位置
f.seek(0)  # 回到开头
print(f"seek(0) 后的位置: {f.tell()}")  # 0

# seek(offset, whence) - whence=0(开头), 1(当前位置), 2(结尾)
f.seek(7)  # 移动到第7个位置
print(f"seek(7) 后的位置: {f.tell()}")  # 7
print(f"剩余内容: {f.read()}")  # "World!"
```

### truncate() - 截断内容

```python
from io import StringIO

f = StringIO("Hello, World!")
f.seek(5)  # 移动到第5个位置
f.truncate()  # 删除当前位置之后的内容
print(f.getvalue())  # "Hello"
```

### 写入模式的覆盖和追加

```python
from io import StringIO

# 写入模式：每次写入会覆盖
f = StringIO()
f.write("Hello")
f.write("World")  # 会覆盖 "Hello"
print(f.getvalue())  # "HelloWorld"

# 追加模式：使用 seek 移动到末尾
f = StringIO("Hello")
f.seek(0, 2)  # 移动到末尾 (seek(0, 2) = seek(0) 配合 whence=2)
f.write(", World")
print(f.getvalue())  # "Hello, World"
```

## 最佳实践

### 1. 使用 with 语句（注意事项）

⚠️ **注意**：`StringIO` 和 `BytesIO` 不支持 `with` 语句（上下文管理器）。

```python
# 错误方式 ❌
from io import StringIO
with StringIO() as f:
    f.write("Hello")
# AttributeError: __enter__ not defined

# 正确方式 ✓
from io import StringIO
f = StringIO()
try:
    f.write("Hello")
    content = f.getvalue()
finally:
    # 没有需要关闭的资源，但保持良好的习惯
    pass
```

### 2. 指定编码（推荐）

```python
from io import StringIO

# 显式指定编码，避免依赖系统默认编码
f = StringIO()
f.write("中文内容")

# 或者初始化时指定
f = StringIO(initial_value="中文内容", newline='\n')
```

### 3. 性能考虑

```python
from io import BytesIO
import time

# 小数据量
buffer = BytesIO()
buffer.write(b"small data")

# 大数据量 - 预分配缓冲区大小可以提升性能
buffer = BytesIO(1024 * 1024)  # 预分配 1MB 缓冲区
```

### 4. 与文件操作的对比

| 特性 | StringIO/BytesIO | 真实文件 |
|------|-----------------|----------|
| **速度** | 更快（内存操作） | 较慢（磁盘 I/O） |
| **持久性** | 程序结束即消失 | 可长期保存 |
| **适用场景** | 测试、临时处理 | 长期存储、共享 |
| **内存占用** | 占用进程内存 | 不占进程内存 |
| **容量限制** | 受限于可用内存 | 受限于磁盘空间 |

## 与其他模块的配合

### 配合 csv 模块处理 CSV 数据

```python
from io import StringIO
import csv

# 模拟 CSV 数据
csv_data = """name,age,city
Alice,25,Beijing
Bob,30,Shanghai
Charlie,35,Guangzhou"""

# 使用 StringIO 读取
f = StringIO(csv_data)
reader = csv.DictReader(f)
for row in reader:
    print(f"{row['name']} lives in {row['city']}")
```

### 配合 json 模块

```python
from io import StringIO
import json

data = {"name": "Alice", "scores": [95, 88, 92]}

# 序列化到 StringIO
buffer = StringIO()
json.dump(data, buffer, indent=2)
json_str = buffer.getvalue()
print(json_str)

# 反序列化
buffer = StringIO(json_str)
loaded_data = json.load(buffer)
print(loaded_data)
```

## 总结

StringIO 和 BytesIO 是 Python 中处理内存中数据读写的利器，它们的核心价值在于：

**统一的接口**：提供了与文件操作一致的 API，无需修改代码即可在内存和文件之间切换
**测试友好**：在单元测试中模拟文件操作，无需创建临时文件
**性能优化**：避免不必要的磁盘 I/O，提升处理速度
**灵活组合**：可以与 gzip、json、csv、PIL 等模块配合使用，实现强大的数据处理能力

---
