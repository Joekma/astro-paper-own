---
title: Python 开发者学习 C# 的路线图
author: Joekma
pubDatetime: 2026-05-06T00:00:00.000+08:00
modDatetime: 2026-05-06T00:00:00.000+08:00
slug: python-to-csharp-learning-path
description: "为 Python 开发者量身定制的 C# 学习路线图，对比两种语言的异同点，涵盖面向对象、类型系统、异步编程、LINQ 等核心概念。"
tags:
  - C#
  - Python
  - 编程语言
  - 学习路线
  - .NET
  - 语言对比
draft: false
series: csharp
language: zh-CN
---

## 概述

> C# 和 Python 具备类似的概念。如果你已经了解 Python，这些熟悉的构造可以帮助你学习 C#。本文档详细介绍两种语言的异同，帮助 Python 开发者平滑过渡到 C#。

### 学习收益

| 技能提升     | 说明                              |
| ------------ | --------------------------------- |
| **快速上手** | 利用已有的 Python 知识快速掌握 C# |
| **深入理解** | 通过对比加深对两种语言的理解      |
| **拓宽视野** | 掌握 .NET 生态系统开发能力        |

---

## 相似概念

Python 和 C# 共享许多核心概念，这些相似之处可以让学习过程更加顺畅。

### 面向对象

Python 和 C# 都是面向对象的语言。Python 中类的所有概念都适用于 C#，即使语法不同也适用。

```python
# Python 类定义
class Person:
    def __init__(self, name, age):
        self.name = name
        self.age = age

    def greet(self):
        return f"Hello, I'm {self.name}"
```

```csharp
// C# 类定义
class Person
{
    public string Name { get; set; }
    public int Age { get; set; }

    public Person(string name, int age)
    {
        Name = name;
        Age = age;
    }

    public string Greet() => $"Hello, I'm {Name}";
}
```

### 跨平台

Python 和 C# 都是跨平台语言。使用这两种语言中的任意一种编写的应用都可以在许多平台上运行。

| 平台    | Python        | C# (.NET)            |
| ------- | ------------- | -------------------- |
| Windows | ✅            | ✅                   |
| macOS   | ✅            | ✅                   |
| Linux   | ✅            | ✅                   |
| 移动端  | Kivy, BeeWare | .NET MAUI            |
| Web     | Django, Flask | Blazor, ASP.NET Core |

### 垃圾回收

这两种语言都通过垃圾收集来应用自动内存管理功能。运行时从未引用的对象中回收内存。

```python
# Python - 自动垃圾回收
obj = SomeClass()  # 分配内存
obj = None          # 对象可能被回收
```

```csharp
// C# - 自动垃圾回收
var obj = new SomeClass();  // 分配内存
obj = null;                  // 对象可能被回收
```

### 强类型化

Python 和 C# 都是强类型化语言。类型强制不会隐式发生。

```python
# Python - 动态类型
x = 10       # int
x = "hello"  # 可以重新赋值为 str
```

```csharp
// C# - 静态类型
int x = 10;      // 声明为 int
x = "hello";     // ❌ 编译错误：不能隐式转换
```

### Async/Await

Python 的 `async` 和 `await` 功能直接受到 C# 的 `async` 和 `await` 支持的启发。

```python
# Python 异步编程
import asyncio

async def fetch_data():
    await asyncio.sleep(1)
    return "data"
```

```csharp
// C# 异步编程
async Task<string> FetchDataAsync()
{
    await Task.Delay(1000);
    return "data";
}
```

### 模式匹配

Python 的 `match` 表达式和模式匹配类似于 C# 的 `match` 表达式。`switch` 可以使用这些功能来检查复杂数据表达式，以确定它是否与模式匹配。

```python
# Python 模式匹配 (3.10+)
def http_status(status):
    match status:
        case 200: return "OK"
        case 404: return "Not Found"
        case _:   return "Unknown"
```

```csharp
// C# 模式匹配
string HttpStatus(int status) => status switch
{
    200 => "OK",
    404 => "Not Found",
    _   => "Unknown"
};
```

### 语句关键字

Python 和 C# 有许多相同关键字，例如 `if`、`else`、`while`、`for` 等。虽然并非所有语法都相同，但它们十分相似，如果你了解 Python，就可以阅读 C#。

---

## 重要差异

了解 C# 时，可发现 C# 不同于 Python 的这些重要概念。

### 缩进与标记

在 Python 中，换行和缩进是一流的语法元素。在 C# 中，空格并不重要。

```python
# Python - 缩进敏感
if x > 0:
    print("positive")
    if x > 10:
        print("large")
```

```csharp
// C# - 使用大括号
if (x > 0)
{
    Console.WriteLine("positive");
    if (x > 10)
    {
        Console.WriteLine("large");
    }
}
```

**主要区别：**

| Python         | C#                      |
| -------------- | ----------------------- |
| 缩进定义代码块 | 大括号 `{ }` 定义代码块 |
| 换行分隔语句   | 分号 `;` 分隔语句       |
| 缩进必须一致   | 缩进仅用于可读性        |

### 静态类型语言

在 C# 中，变量声明包括其类型。将变量重新分配给不同类型的对象将生成编译器错误。

```python
# Python - 动态类型
def process(data):
    return data.upper()  # data 可以是任何类型
```

```csharp
// C# - 静态类型
string Process(string data)
{
    return data.ToUpper();  // data 必须是 string
}
```

**类型推断：** C# 提供 `var` 关键字简化声明，但仍为静态类型。

```csharp
var message = "Hello";  // 编译器推断为 string
message = 123;          // ❌ 编译错误
```

### 可以为 null 的类型

C# 变量可为空或不可为空。不可为 null 的类型是不能为 null（或不包含任何类型）的类型。它始终需要引用有效的对象。相比之下，可以为 null 的类型可以引用有效对象或 null。

```python
# Python - 所有引用都可以是 None
name = None
name = "Alice"
name = None  # 允许
```

```csharp
// C# - 可空和不可空类型
string name = null;      // ❌ 警告：不可空类型
string? nullableName = null;  // ✅ 允许
```

### LINQ

组成语言集成查询 (LINQ) 的查询表达式关键字与 Python 中的关键字不同。但是，Python 库（如 `itertools`、`more-itertools` 和 `py-linq`）具备类似的功能。

```python
# Python - 使用列表推导式或库
numbers = [1, 2, 3, 4, 5]
even_squares = [x**2 for x in numbers if x % 2 == 0]
```

```csharp
// C# - 使用 LINQ
var numbers = new[] { 1, 2, 3, 4, 5 };
var evenSquares = numbers
    .Where(x => x % 2 == 0)
    .Select(x => x * x)
    .ToList();
```

### 泛型

C# 泛型使用 C# 静态类型语言对类型参数提供的参数进行断言。泛型算法可能需要指定参数类型必须满足的约束。

泛型是 C# 中的一种机制，让你在定义类、方法、接口时先不指定具体类型，等使用时再确定类型。

用一句话理解：泛型就是把「类型」也当成一种参数，像传参数一样传类型。

```python
# Python - 动态类型，约束较少
def first(sequence):
    return sequence[0]
```

```csharp
// C# - 泛型约束
T First<T>(IList<T> sequence) where T : new()
{
    return sequence[0];
}
```

---

## Python 独有功能

有一些 Python 功能在 C# 中不可用或不常用。

### 结构化（鸭子）类型

在 C# 中，类型具有名称和声明。除元组外，具有相同结构的类型不可互换。

```python
# Python - 鸭子类型
class Dog:
    def speak(self): return "Woof"

class Cat:
    def speak(self): return "Meow"

def make_speak(animal):  # 任何有 speak 方法的对象都可以
    return animal.speak()
```

```csharp
// C# - 静态类型，需要接口
interface ISpeakable
{
    string Speak();
}

class Dog : ISpeakable
{
    public string Speak() => "Woof";
}

void MakeSpeak(ISpeakable animal)  // 必须实现接口
{
    Console.WriteLine(animal.Speak());
}
```

### REPL

C# 不具备读取-求值-打印循环 (REPL)，无法快速构建解决方案原型。

| Python                | C# 替代方案                 |
| --------------------- | --------------------------- |
| `python` 交互式解释器 | `dotnet script` 工具        |
| IPython/Jupyter       | .NET Interactive Notebooks  |
| `python -c "..."`     | `dotnet new console` + 运行 |

### 空格敏感性

Python 中缩进是语法的一部分，而 C# 中需要正确使用大括号 `{` 和 `}` 来声明块范围。

```python
# Python - 缩进必须完美
def func():
  if True:
pass  # ❌ IndentationError
```

```csharp
// C# - 大括号定义范围
void Func()
{
    if (true)
    {
        // ...
    }
}
```

---

## 相关资源

- [C# 文档 - Microsoft Learn](https://learn.microsoft.com/zh-cn/dotnet/csharp/)
- [C# 教程](https://learn.microsoft.com/zh-cn/dotnet/csharp/tour-of-csharp/tutorials/branches-and-loops)
- [C# 类型系统](https://learn.microsoft.com/zh-cn/dotnet/csharp/fundamentals/types/)
- [可以为 null 的类型](https://learn.microsoft.com/zh-cn/dotnet/csharp/nullable-references)
- [LINQ 查询](https://learn.microsoft.com/zh-cn/dotnet/csharp/linq/)
- [泛型](https://learn.microsoft.com/zh-cn/dotnet/csharp/fundamentals/types/generics)
