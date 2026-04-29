---
title: Python 模块与包
author: 程序员
pubDatetime: 2024-08-13T00:00:00.000+08:00
updated: 2026-04-22T00:00:00.000+08:00
slug: python-modules-and-packages
description: '深入理解 Python 的模块与包组织结构'
tags:
  - Python
  - 模块
  - 包
  - import
  - 作用域
category: Python
draft: false
language: zh-CN
---

> 模块是 Python 编程的核心概念之一。本文将详细介绍模块的定义、导入方式、循环导入问题，以及模块搜索路径和编译文件等高级主题。

## 模块

### 什么是模块

模块就是一组功能的集合体，我们的程序可以导入模块来复用模块里的功能。一个模块就是一个包含了功能的 Python 文件，比如 `spam.py`，模块名为 `spam`，可以通过 `import spam` 使用。

在 Python 中，模块可以分为以下几类：

| 类型 | 说明 |
|------|------|
| **Python 文件** | 使用 Python 编写的 `.py` 文件 |
| **C/C++ 扩展** | 已被编译为共享库或 DLL 的 C 或 C++ 扩展 |
| **包** | 一系列模块组织在一起的文件夹（包含 `__init__.py`） |
| **内置模块** | 使用 C 编写并链接到 Python 解释器的内置模块 |

## import 的使用

### 模块导入的基本过程

模块可以包含可执行的语句和函数的定义，这些语句的目的是初始化模块。它们只在模块名第一次遇到导入语句时才执行。

```python
# spam.py
import spam

# 执行结果：只会打印一次 'from the spam.py'
import spam
import spam
import spam
```

> Python 优化手段：第一次导入后将模块名加载到内存，后续的 import 语句仅是对已经加载到内存中的模块对象增加了一次引用，不会重新执行模块内的语句。

### 第一次导入模块的三件事

1. 为源文件创建新的名称空间
2. 在新创建的命名空间中执行模块中包含的代码
3. 创建名字来引用该命名空间

### sys.module

我们可以从 `sys.module` 中找到当前已经加载的模块，它是一个字典，包含模块名与模块对象的映射。

```python
import sys
print(sys.modules)  # 查看所有已加载的模块
```

### 被导入模块有独立的名称空间

每个模块都是一个独立的名称空间，定义在这个模块中的函数把这个模块的名称空间当做全局名称空间。

```python
# test.py
import spam
money = 10
print(spam.money)  # 1000
```

### 为模块名起别名

为已经导入的模块起别名的方式对编写可扩展的代码很有用：

```python
import spam as sm
print(sm.money)
```

### 逻辑内导入

```python
if file_format == 'xml':
    import xmlreader as reader
elif file_format == 'csv':
    import csvreader as reader

data = reader.read_data(filename)
```

### 一行导入多个模块

```python
import sys, os, json
```

## from...import... 的使用

```python
from spam import read1, read2
```

### from...import 与 import 的区别

**唯一区别**：使用 `from...import...` 则是将 `spam` 中的名字直接导入到当前的名称空间中，所以在当前名称空间中，直接使用名字就可以了，无需加前缀。

**好处**：使用起来方便了
**坏处**：容易与当前执行文件中的名字冲突

```python
# 导入的函数 read1，执行时仍然回到 spam.py 中寻找全局变量 money
from spam import read1
money = 1000
read1()
# 输出: from the spam.py
#       spam->read1->money 1000
```

### 重名覆盖

```python
from spam import read1

def read1():
    print('==========')

read1()  # 执行结果: ==========
```

### 支持 as

```python
from spam import read1 as read
```

### 一行导入多个名字

```python
from spam import read1, read2, money
```

### from...import *

`from spam import *` 把 `spam` 中所有的不是以下划线 `_` 开头的名字都导入到当前位置。

可以使用 `__all__` 来控制 `*` 导入：

```python
# spam.py
__all__ = ['money', 'read1']  # 只允许导入这两个名字

# 另一个文件中
from spam import *  # 只能导入 money 和 read1
```

## 模块循环导入问题

### 问题分析

模块循环/嵌套导入抛出异常的根本原因是由于在 Python 中模块被导入一次之后，就不会重新导入，只会在第一次导入时执行模块内代码。

```python
# m1.py
print('正在导入m1')
from m2 import y
x = 'm1'

# m2.py
print('正在导入m2')
from m1 import x
y = 'm2'

# run.py
import m1
```

**执行结果**：

```
正在导入m1
正在导入m2
Traceback (most recent call last):
  File "run.py", line 1, in <module>
    import m1
  File "m1.py", line 2, in <module>
    from m2 import y
  File "m2.py", line 2, in <module>
    from m1 import x
ImportError: cannot import name 'x'
```

### 解决方法

**方法一**：导入语句放到最后

```python
# m1.py
print('正在导入m1')
x = 'm1'
from m2 import y

# m2.py
print('正在导入m2')
y = 'm2'
from m1 import x
```

**方法二**：导入语句放到函数中

```python
# m1.py
print('正在导入m1')

def f1():
    from m2 import y
    print(x, y)

x = 'm1'

# m2.py
print('正在导入m2')

def f2():
    from m1 import x
    print(x, y)

y = 'm2'
```

## __name__ 的使用

```python
# fib.py
def fib(n):
    a, b = 0, 1
    while b < n:
        print(b, end=' ')
        a, b = b, a + b
    print()

def fib2(n):
    result = []
    a, b = 0, 1
    while b < n:
        result.append(b)
        a, b = b, a + b
    return result

if __name__ == "__main__":
    import sys
    fib(int(sys.argv[1]))
```

**说明**：

1. 如果模块是被导入，`__name__` 的值为模块名字
2. 如果模块是被直接执行，`__name__` 的值为 `'__main__'`

## 模块的重载

考虑到性能的原因，每个模块只被导入一次。如果你想交互测试一个模块，可以使用 `importlib.reload()`：

```python
import importlib
import aa

# 重新加载 aa 模块
importlib.reload(aa)
aa.func1()
```

## 模块搜索路径

### 查找顺序

模块的查找顺序是：

1. **内存中已经加载的模块** - 如果模块已经被加载到内存中，则直接引用
2. **内置模块** - 查找同名的内建模块
3. **sys.path 路径** - 从 sys.path 给出的目录列表中依次寻找

### sys.path 的初始化

`sys.path` 从以下位置初始化：

1. **执行文件所在的当前目录**
2. **PYTHONPATH**（包含一系列目录名，与 shell 变量 PATH 语法一样）
3. **依赖安装时默认指定的目录**

### sys.path 的修改

在初始化后，Python 程序可以修改 `sys.path`：

```python
import sys

# 添加到末尾
sys.path.append('/a/b/c/d')

# 添加到开头（优先搜索）
sys.path.insert(0, '/x/y/z')
```

### .zip 和 .egg 文件

`sys.path` 中还可能包含 .zip 归档文件和 .egg 文件：

```python
# 制作归档文件
zip module.zip foo.py bar.py

import sys
sys.path.append('module.zip')
import foo, bar
```

> `.egg` 文件是由 setuptools 创建的包，实际上只是添加了额外元数据的 .zip 文件。

## 编译 Python 文件

### 什么是 pyc 文件

`.pyc` 是一种二进制文件，是由 `.py` 文件经过编译后生成的文件，是一种 byte code。

### 编译命令

```python
# 编译成 pyc 文件
python -m py_compile file.py
python -m py_compile /path/to/file.py

# 编译成 pyo 文件（优化）
python -O -m py_compile file.py
```

或者使用代码：

```python
import py_compile
py_compile.compile('path')
```

### pyc 文件的特点

1. **跨平台**：相同的库可以在不同的架构的系统之间共享
2. **版本相关**：不同版本的 Python 编译后的 .pyc 文件是不同的
3. **可反编译**：.pyc 文件不是用来加密的，只是提升模块的加载速度
4. **自动编译**：Python 检查源文件的修改时间与编译的版本进行对比，如果过期就需要重新编译

## 包

### 什么是包

包是一个包含 `__init__.py` 文件的文件夹，用于组织模块。

### 包的结构

```
my_package/
├── __init__.py
├── module1.py
├── module2.py
└── sub_package/
    ├── __init__.py
    └── module3.py
```

### 导入包的方式

```python
# 导入整个包
import my_package

# 导入包中的模块
from my_package import module1

# 导入包中的函数
from my_package.module1 import my_function

# 使用别名
from my_package import module1 as m1
```

### __init__.py 的作用

1. **标识包**：`__init__.py` 让 Python 知道这是一个包
2. **初始化代码**：包被导入时自动执行的代码
3. **控制导出**：可以在 `__init__.py` 中设置 `__all__` 来控制 `from package import *` 的行为

```python
# my_package/__init__.py
from .module1 import my_function
from .module2 import another_function

__all__ = ['my_function', 'another_function']
```

## 小结

### 模块相关

| 概念 | 说明 |
|------|------|
| **模块导入** | `import` 和 `from...import` |
| **模块别名** | `import spam as sm` |
| **循环导入** | 将导入语句放到函数中或最后 |
| **搜索路径** | 内存 → 内置模块 → sys.path |
| **编译文件** | `.pyc` 文件提升加载速度 |

### 包相关

| 概念 | 说明 |
|------|------|
| **包结构** | 包含 `__init__.py` 的文件夹 |
| **导入方式** | `import package` 或 `from package import module` |
| **__init__.py** | 包的标识文件，可用于初始化和导出控制 |

### 最佳实践

1. **避免循环导入**：将导入语句放到函数中或文件最后
2. **使用 `__all__`**：控制模块/包的导出接口
3. **合理组织结构**：将相关的功能放在同一个模块或包中
4. **注意命名冲突**：使用 `from...import` 时注意变量名冲突

掌握这些模块和包的知识，可以帮助你更好地组织和管理 Python 代码，实现代码的复用和模块化。
