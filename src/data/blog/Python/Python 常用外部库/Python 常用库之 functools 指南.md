---
title: Python 常用库之 functools 指南
author: Joekma
pubDatetime: 2024-08-13T00:00:00Z
slug: python-functools
modDatetime: 2026-04-22T00:00:00Z
featured: false
draft: false
tags:
  - Python
  - functools
  - docs
description: Python functools 模块完全指南，详解 partial 偏函数和 wraps 装饰器保留元信息的最佳实践。

series: python
language: zh-CN
---

# Python 常用库之 functools 指南

## 简介

`functools` 是 Python 标准库中非常实用的一组函数工具集合。它主要用于函数式编程风格、装饰器开发、参数预绑定以及函数元信息维护等场景。

在实际业务开发中，不是每个函数都会高频用到，但其中有几个成员几乎是日常必备，尤其是：

- **`partial`**：偏函数，预先绑定部分参数
- **`wraps`**：装饰器中保留原函数元信息

这篇文章重点整理这两个最常见、最实用的工具。

## 🧰 functools 是什么

`functools` 在 Python 2.5 中引入，用于集中提供一些与函数相关的辅助能力。

在 Python 3 中，它已经扩展得更完整。比如在 Python 3.6 中，可以看到它包含如下成员：

```python
import functools

print(dir(functools))
```

示例输出：

```python
[
    'MappingProxyType', 'RLock', 'WRAPPER_ASSIGNMENTS',
    'WRAPPER_UPDATES', 'WeakKeyDictionary', '_CacheInfo',
    '_HashedSeq', '__all__', '__builtins__', '__cached__', '__doc__',
    '__file__', '__loader__', '__name__', '__package__', '__spec__',
    '_c3_merge', '_c3_mro', '_compose_mro', '_convert',
    '_find_impl', '_ge_from_gt', '_ge_from_le', '_ge_from_lt',
    '_gt_from_ge', '_gt_from_le', '_gt_from_lt', '_le_from_ge',
    '_le_from_gt', '_le_from_lt', '_lru_cache_wrapper', '_lt_from_ge',
    '_lt_from_gt', '_lt_from_le', 'cmp_to_key',
    'get_cache_token', 'lru_cache', 'namedtuple', 'partial',
    'partialmethod', 'recursive_repr', 'reduce', 'singledispatch',
    'total_ordering', 'update_wrapper', 'wraps'
]
```

## 常见成员概览

虽然 `functools` 里工具不少，但在普通业务代码里最常见的通常是：

| 成员 | 说明 | 使用频率 |
|------|------|----------|
| **`partial`** | 给函数预先绑定一部分参数 | 高 |
| **`wraps`** | 装饰器中保留原函数名称、文档字符串等元信息 | 高 |
| **`lru_cache`** | 缓存函数结果 | 中 |
| **`reduce`** | 把序列中的元素按规则累计计算 | 中 |

> **说明**：本文重点展开前两个。

## `partial`：偏函数

### 什么是偏函数

`partial` 可以把一个函数的部分参数预先固定下来，生成一个新的函数。这样后续调用时，就不需要每次都重复传那些固定参数了。

它特别适合：

- **封装默认参数**
- **构造更易调用的新函数**
- **回调函数预绑定参数**

### 基本示例

```python
import functools


def showarg(*args, **kw):
    print(args)
    print(kw)


p1 = functools.partial(showarg, 1, 2, 3)
p1()
p1(4, 5, 6)
p1(a='python', b='itcast')

p2 = functools.partial(showarg, a=3, b='linux')
p2()
p2(1, 2)
p2(a='python', b='itcast')
```

输出结果：

```python
(1, 2, 3)
{}
(1, 2, 3, 4, 5, 6)
{}
(1, 2, 3)
{'a': 'python', 'b': 'itcast'}
()
{'a': 3, 'b': 'linux'}
(1, 2)
{'a': 3, 'b': 'linux'}
()
{'a': 'python', 'b': 'itcast'}
```

### 如何理解

例如：

```python
p1 = functools.partial(showarg, 1, 2, 3)
```

这表示创建了一个新函数 `p1`，它等价于"把 `showarg` 的前三个位置参数固定为 `1, 2, 3`"。

后续调用：

```python
p1(4, 5, 6)
```

本质上相当于：

```python
showarg(1, 2, 3, 4, 5, 6)
```

### 适用场景

#### 场景一：为通用函数生成专用版本

```python
from functools import partial


def power(base, exponent):
    return base ** exponent


square = partial(power, exponent=2)
cube = partial(power, exponent=3)

print(square(5))  # 输出: 25
print(cube(2))    # 输出: 8
```

#### 场景二：给回调函数预绑定上下文参数

在 GUI、异步任务或调度系统中，`partial` 常用来把回调函数和固定参数组合在一起。

```python
from functools import partial
import tkinter as tk


def on_click(button_name, event):
    print(f"Button {button_name} clicked")


root = tk.Tk()
btn1 = tk.Button(root, text="Button 1")
btn2 = tk.Button(root, text="Button 2")

btn1.bind('<Button-1>', partial(on_click, 'Button 1'))
btn2.bind('<Button-1>', partial(on_click, 'Button 2'))

root.mainloop()
```

## `wraps`：保留被装饰函数元信息

### 为什么需要 `wraps`

使用装饰器后，原函数通常会被包装成一个新的函数对象。如果不做额外处理，那么函数名、文档字符串等元信息会变成包装函数自己的信息。

这会带来一些问题：

- **调试时函数名不准确**
- **自动化测试和反射场景下信息失真**
- **文档工具拿到的是包装函数而不是原函数**

### 不使用 `wraps` 的示例

```python
def note(func):
    "note function"

    def wrapper():
        "wrapper function"
        print('note something')
        return func()

    return wrapper


@note
def test():
    "test function"
    print('I am test')


test()
print(test.__doc__)
```

输出结果：

```text
note something
I am test
wrapper function
```

> **问题**：可以看到，`test.__doc__` 变成了包装函数 `wrapper` 的文档，而不是原始 `test` 函数的文档。

### 使用 `wraps` 的示例

```python
import functools


def note(func):
    "note function"

    @functools.wraps(func)
    def wrapper():
        "wrapper function"
        print('note something')
        return func()

    return wrapper


@note
def test():
    "test function"
    print('I am test')


test()
print(test.__doc__)
```

输出结果：

```text
note something
I am test
test function
```

> **解决**：正确保留了原函数的文档字符串。

### `wraps` 做了什么

`functools.wraps(func)` 本质上会把原函数的重要元信息复制到包装函数上，例如：

- `__name__`：函数名称
- `__doc__`：文档字符串
- `__module__`：模块名称

所以在写装饰器时，一个非常实用的习惯是：

```text
@functools.wraps(func)
```

> **提示**：几乎可以视为标准写法。

### 推荐写法模板

```python
import functools


def decorator(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        # 前置逻辑
        result = func(*args, **kwargs)
        # 后置逻辑
        return result

    return wrapper
```

> **最佳实践**：以后写装饰器时，优先加上 `@functools.wraps(func)`，除非有明确理由不保留原函数信息。

## 使用建议

### 1. 写装饰器时优先加 `wraps`

如果你自己写装饰器，除非有明确理由不保留原函数信息，否则几乎都建议加上 `@functools.wraps(func)`。

### 2. `partial` 适合做"函数定制"

如果你发现某个函数总是以相似参数反复调用，可以考虑用 `partial` 生成一个更专用、更简洁的函数。

### 3. 不要为了"函数式"而函数式

`functools` 很强大，但是否使用它，应该以代码可读性为前提。尤其在团队项目中，清晰比技巧更重要。

### 4. 结合使用场景选择工具

- 需要**简化函数调用** → 考虑 `partial`
- 需要**写装饰器** → 必须加 `wraps`
- 需要**缓存结果** → 考虑 `lru_cache`
- 需要**累计计算** → 考虑 `reduce`

## 小结

`functools` 是 Python 标准库里非常值得掌握的一部分工具集合，而在日常开发中最常用的通常就是这两个：

- **`partial`**：提前绑定部分参数，生成新函数
- **`wraps`**：让装饰器保留原函数元信息

如果把这篇内容浓缩成一句话，那就是：

> **`partial` 让函数更容易调用，`wraps` 让装饰器更规范。**

---
