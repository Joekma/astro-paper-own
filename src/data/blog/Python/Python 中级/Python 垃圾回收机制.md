---
title: Python 垃圾回收机制
author: Joekma
pubDatetime: 2024-08-11T00:00:00.000+08:00
modDatetime: 2026-04-22T00:00:00.000+08:00
slug: python-garbage-collection
description: '深入理解 Python 垃圾回收机制：引用计数、分代回收、循环垃圾回收'
tags:
  - Python
  - 内存管理
  - GC
  - 垃圾回收
category: Python中级
draft: false
language: zh-CN
---

# Python 垃圾回收机制

## 什么是垃圾回收？

**垃圾回收（Garbage Collection，GC）**是自动内存管理的一种形式，用于自动回收不再使用的内存。

**为什么需要垃圾回收？**
- 手动管理内存容易出错
- 防止内存泄漏
- 避免悬挂指针
- 提高开发效率

## Python 内存管理基础

### 引用计数

Python 使用**引用计数**作为主要的内存管理机制。

```python
import sys

# 查看对象的引用计数
a = [1, 2, 3]  # 引用计数 = 1
print(f"引用计数: {sys.getrefcount(a)}")

b = a  # 引用计数 = 2
print(f"引用计数: {sys.getrefcount(a)}")

c = [a]  # 引用计数 = 3
print(f"引用计数: {sys.getrefcount(a)}")

del b  # 引用计数 = 2
print(f"引用计数: {sys.getrefcount(a)}")

del c  # 引用计数 = 1
print(f"引用计数: {sys.getrefcount(a)}")

del a  # 引用计数 = 0，对象被销毁
```

### 引用计数的优缺点

**引用计数的优点**：
- 简单高效
- 实时回收内存
- 无暂停时间

**引用计数的缺点**：
- 无法处理循环引用
- 需要额外的内存存储引用计数
- 频繁的引用计数更新

## 循环引用问题

### 什么是循环引用？

```python
# 循环引用示例
a = []  # 对象 A
b = []  # 对象 B
a.append(b)  # A 引用 B
b.append(a)  # B 引用 A

# 此时 A 和 B 的引用计数都是 2
# 即使删除 a 和 b，它们也无法被回收
del a
del b
# A 和 B 仍然互相引用，无法释放
```

### 循环引用导致内存泄漏

```python
import tracemalloc
import gc

# 启用内存追踪
tracemalloc.start()

def create_cycle():
    a = []
    b = []
    a.append(b)
    b.append(a)
    # 没有显式删除，循环引用存在

# 创建大量循环引用
for i in range(10000):
    create_cycle()

# 手动触发垃圾回收
gc.collect()

# 查看内存使用
snapshot = tracemalloc.take_snapshot()
top_stats = snapshot.statistics('lineno')
print("\n前10个内存使用最多的位置:")
for stat in top_stats[:10]:
    print(stat)
```

## Python 垃圾回收器

### 分代回收

Python 将对象按存活时间分为三代：

```python
import gc

# 查看垃圾回收器信息
print("GC 阈值:", gc.get_threshold())
print("GC 计数:", gc.get_count())
print("GC 分代:", gc.get世代())

# 默认阈值：(700, 10, 10)
# - 第 0 代：700 个对象
# - 第 1 代：10 次第 0 代回收
# - 第 2 代：10 次第 1 代回收
```

### 触发条件

```python
import gc

# 当第 0 代的对象数量超过阈值时，触发垃圾回收
# gc.get_threshold() 返回 (700, 10, 10)
# 含义：
# - 第 0 代：700 个对象
# - 第 1 代：10 次第 0 代回收
# - 第 2 代：10 次第 1 代回收
```

### 手动控制垃圾回收

```python
import gc

# 手动触发垃圾回收
gc.collect()

# 禁用自动垃圾回收
gc.disable()

# 启用自动垃圾回收
gc.enable()

# 检查是否启用
print("GC 是否启用:", gc.isenabled())

# 设置垃圾回收阈值
gc.set_threshold(100, 10, 10)
```

## 垃圾回收算法

### 标记-清除算法

```python
# 标记-清除算法分为两个阶段：
# 1. 标记阶段：遍历所有对象，标记可达对象
# 2. 清除阶段：删除所有未标记的对象

# 示例说明
class GraphNode:
    def __init__(self, name):
        self.name = name
        self.edges = []

    def add_edge(self, other):
        self.edges.append(other)

# 创建循环引用
node1 = GraphNode("A")
node2 = GraphNode("B")
node1.add_edge(node2)
node2.add_edge(node1)

# 标记阶段：从根对象开始，标记所有可达对象
# 可达对象：node1, node2
# 未标记：无

# 清除阶段：删除未标记的对象
# 无对象被删除（因为有外部引用）
```

### 标记-压缩算法

```python
# 标记-压缩算法在标记-清除的基础上，增加压缩步骤
# 将存活对象移动到一端，减少内存碎片

# 示例
before = [None] * 10
before[2] = "A"
before[5] = "B"
before[8] = "C"

# 压缩后
after = ["A", "B", "C"] + [None] * 7
```

## 追踪对象

### gc 模块追踪

```python
import gc
import sys

# 创建测试对象
class TestObject:
    def __init__(self, name):
        self.name = name

    def __repr__(self):
        return f"TestObject({self.name})"

# 创建对象
obj1 = TestObject("obj1")
obj2 = TestObject("obj2")
obj3 = TestObject("obj3")

# 获取所有追踪的对象
tracked_objects = gc.get_objects()
print(f"追踪的对象数量: {len(tracked_objects)}")

# 查找特定类型的对象
test_objects = [obj for obj in tracked_objects if isinstance(obj, TestObject)]
print(f"TestObject 数量: {len(test_objects)}")

# 查看对象的引用
print("\nobj1 的引用:")
for ref in gc.get_referrers(obj1):
    print(f"  - {type(ref)}: {ref if not isinstance(ref, dict) else 'dict'}")
```

### 引用关系

```python
# 查看对象的引用者
import gc

a = [1, 2, 3]
b = {"key": a}
c = (a,)

print("a 的引用者:")
for ref in gc.get_referrers(a):
    print(f"  {type(ref).__name__}: {ref}")

# 查看对象引用的对象
print("\na 引用的对象:")
for ref in gc.get_referents(a):
    print(f"  {type(ref).__name__}: {ref}")
```

## 内存泄漏与排查

### 常见内存泄漏

```python
# 1. 全局变量持有引用
global_list = []

def leak_memory():
    # 不断添加到全局列表，导致内存泄漏
    data = [i for i in range(10000)]
    global_list.append(data)

# 2. 缓存未清理
cache = {}

def leaky_cache(key, value):
    cache[key] = value
    # 缓存无限增长

# 3. 事件处理器未移除
class EventEmitter:
    def __init__(self):
        self.listeners = []

    def on(self, event, callback):
        self.listeners.append((event, callback))

    def remove_all_listeners(self):
        # 未清理，监听器持有引用
        self.listeners.clear()
```

### 使用 weakref 避免内存泄漏

```python
import weakref

# 使用弱引用，不增加引用计数
class Node:
    def __init__(self, value):
        self.value = value
        self.parent = None
        self.children = []

    def add_child(self, child):
        self.children.append(child)
        child.parent = self

# 使用弱引用
class WeakNode:
    def __init__(self, value):
        self.value = value
        self.parent = weakref.ref(self)
        self.children = []

    def add_child(self, child):
        self.children.append(child)
        child.parent = weakref.ref(self)

# 示例
root = WeakNode("root")
child1 = WeakNode("child1")
root.add_child(child1)

print(f"root 的引用计数: {sys.getrefcount(root)}")
print(f"child1 的引用计数: {sys.getrefcount(child1)}")

# 即使有循环引用，弱引用也不会阻止垃圾回收
del root
del child1

# 检查对象是否被回收
# 如果对象已被回收，weakref 返回 None
```

### 缓存实现

```python
import weakref
import functools

# 使用弱引用的缓存
class Cache:
    def __init__(self):
        self.cache = weakref.WeakValueDictionary()

    def get(self, key):
        return self.cache.get(key)

    def set(self, key, value):
        self.cache[key] = value

# 使用装饰器实现缓存
def memoize(func):
    cache = weakref.WeakValueDictionary()

    @functools.wraps(func)
    def wrapper(*args):
        if args in cache:
            return cache[args]
        result = func(*args)
        cache[args] = result
        return result

    return wrapper

@memoize
def expensive_computation(x, y):
    print(f"执行计算: {x} + {y}")
    return x + y
```

## 性能优化

### 减少垃圾回收频率

```python
import gc

# 调整垃圾回收阈值，减少 GC 频率
gc.set_threshold(10000, 100, 100)

# 或者禁用 GC（慎用）
gc.disable()

try:
    # 执行批量操作
    for i in range(100000):
        data = process_data()
finally:
    # 操作完成后重新启用 GC
    gc.enable()
```

### 及时清理大对象

```python
# 对于大对象，及时清理
def process_large_data():
    large_data = load_large_file()

    try:
        result = process(large_data)
        return result
    finally:
        # 显式清理
        del large_data
        gc.collect()
```

### 使用 __slots__ 减少内存占用

```python
# 普通类
class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y

# 使用 __slots__
class PointWithSlots:
    __slots__ = ['x', 'y']

    def __init__(self, x, y):
        self.x = x
        self.y = y

# __slots__ 的优点：
# 1. 减少内存占用
# 2. 加快属性访问
# 3. 防止动态添加属性
```

## 调试内存问题

### tracemalloc 模块

```python
import tracemalloc

# 启动追踪
tracemalloc.start()

# 执行代码
def process():
    data = [i for i in range(10000)]
    return sum(data)

process()

# 获取快照
snapshot = tracemalloc.take_snapshot()

# 显示前10个内存使用最多的地方
top_stats = snapshot.statistics('lineno')
print("前10个内存使用最多的位置:")
for stat in top_stats[:10]:
    print(stat)

# 比较两个快照
snapshot1 = tracemalloc.take_snapshot()
# ... 执行一些代码 ...
snapshot2 = tracemalloc.take_snapshot()

# 显示差异
top_stats = snapshot2.compare_to(snapshot1, 'lineno')
print("\n内存增长最多的地方:")
for stat in top_stats[:5]:
    print(stat)
```

### objgraph 模块

```python
# 安装: pip install objgraph

import objgraph

# 显示增长最多的对象类型
objgraph.show_most_common_types(limit=10)

# 显示某个类型的对象
objgraph.show_backref([obj], max_depth=3)

# 统计某个类型的对象数量
count = objgraph.count('MyClass')
print(f"MyClass 实例数量: {count}")
```

### memory_profiler

```python
# 安装: pip install memory_profiler

from memory_profiler import profile

@profile
def memory_intensive_function():
    data = [i ** 2 for i in range(1000000)]
    return sum(data)

if __name__ == '__main__':
    memory_intensive_function()
```

## 最佳实践

**Python 内存管理最佳实践**：

1. **避免循环引用**
   - 使用弱引用
   - 及时清理引用

2. **使用合适的数据结构**
   - __slots__ 优化内存
   - 生成器代替列表

3. **手动控制垃圾回收**
   - 批量操作时禁用 GC
   - 操作完成后显式回收

4. **使用内存分析工具**
   - tracemalloc
   - objgraph
   - memory_profiler

5. **及时清理大对象**
   - 使用 finally 清理
   - 显式 del 对象

## 总结

Python 的垃圾回收机制包括：

1. **引用计数**：主要内存管理机制，实时回收
2. **标记-清除**：处理循环引用
3. **分代回收**：优化性能，减少 GC 开销

**理解垃圾回收机制有助于**：
- 避免内存泄漏
- 优化内存使用
- 编写高效的 Python 代码
- 调试内存问题
