---
title: C# 集合与列表 List<T> 详解
author: Joekma
pubDatetime: 2026-05-06T00:00:00.000+08:00
modDatetime: 2026-05-06T00:00:00.000+08:00
slug: csharp-list-collection
description: '深入学习 C# 中的 List<T> 集合，掌握列表的创建、增删改查、排序和搜索等操作。'
tags:
  - C#
  - 集合
  - List
  - 泛型
  - 数组
  - 数据结构
draft: false
language: zh-CN
---

## 概述

集合是编程中处理一组数据的基础工具。C# 提供了丰富的集合类型，其中 `List<T>` 是最常用的动态数组。本教程将详细介绍 List 的使用方法和常用操作。

### 集合类型对比

| 类型 | 特点 | 适用场景 |
|------|------|---------|
| `List<T>` | 动态大小、有索引 | 需要随机访问 |
| `Dictionary<TKey, TValue>` | 键值对、无索引 | 需要按键查找 |
| `HashSet<T>` | 不重复、无序 | 需要去重 |
| `Queue<T>` | 先进先出 | 任务队列 |
| `Stack<T>` | 先进后出 | 撤销操作 |

---

## 创建列表

### 基本创建

```csharp
// 创建字符串列表
List<string> names = new List<string>();

// 创建整数列表
List<int> numbers = new List<int>();
```

### 初始化器创建

```csharp
// 直接初始化
List<string> names = new List<string> { "Alice", "Bob", "Charlie" };

// 使用数组初始化
string[] array = { "Alice", "Bob" };
List<string> names = new List<string>(array);

// C# 12 简写
List<string> names = ["Alice", "Bob", "Charlie"];
```

### 创建带初始值的列表

```csharp
List<int> scores = new List<int> { 90, 85, 78, 92, 88 };
```

---

## 添加元素

### Add - 添加单个元素

```csharp
List<string> names = new List<string>();
names.Add("Alice");
names.Add("Bob");
names.Add("Charlie");

foreach (string name in names)
{
    Console.WriteLine(name);
}
```

### AddRange - 添加多个元素

```csharp
List<string> names = new List<string> { "Alice" };
List<string> moreNames = new List<string> { "Bob", "Charlie" };

names.AddRange(moreNames);
```

**或者使用数组：**

```csharp
string[] newNames = { "Bob", "Charlie" };
names.AddRange(newNames);
```

### Insert - 插入元素

```csharp
List<string> names = new List<string> { "Alice", "Charlie" };
names.Insert(1, "Bob");  // 在索引1处插入

// 结果: ["Alice", "Bob", "Charlie"]
```

### InsertRange - 插入多个元素

```csharp
List<string> names = new List<string> { "Alice", "Charlie" };
List<string> toInsert = new List<string> { "Bob1", "Bob2" };

names.InsertRange(1, toInsert);

// 结果: ["Alice", "Bob1", "Bob2", "Charlie"]
```

---

## 访问元素

### 使用索引

```csharp
List<string> names = new List<string> { "Alice", "Bob", "Charlie" };

Console.WriteLine(names[0]);  // Alice
Console.WriteLine(names[1]);  // Bob
Console.WriteLine(names[2]);  // Charlie
```

**注意：** 索引从 0 开始。

### 越界检查

```csharp
List<string> names = new List<string> { "Alice", "Bob" };

// names[5] 会抛出 IndexOutOfRangeException
// 正确做法：先检查长度
if (names.Count > 5)
{
    Console.WriteLine(names[5]);
}
```

### 获取属性

```csharp
List<string> names = new List<string> { "Alice", "Bob" };

Console.WriteLine($"元素数量: {names.Count}");  // 2
Console.WriteLine($"容量: {names.Capacity}");   // 4（自动增长）
```

---

## 修改元素

### 通过索引修改

```csharp
List<string> names = new List<string> { "Alice", "Bob" };
names[0] = "Alicia";  // 修改第一个元素

// 结果: ["Alicia", "Bob"]
```

### 替换多个元素

```csharp
List<int> numbers = new List<int> { 1, 2, 3, 4, 5 };
numbers[1] = 20;  // 第二个元素改为20
numbers[3] = 40;  // 第四个元素改为40
```

---

## 删除元素

### Remove - 删除第一个匹配项

```csharp
List<string> names = new List<string> { "Alice", "Bob", "Alice" };
names.Remove("Alice");  // 删除第一个 "Alice"

// 结果: ["Bob", "Alice"]
```

### RemoveAt - 删除指定索引

```csharp
List<string> names = new List<string> { "Alice", "Bob", "Charlie" };
names.RemoveAt(1);  // 删除索引1的元素

// 结果: ["Alice", "Charlie"]
```

### RemoveRange - 删除范围内元素

```csharp
List<string> names = new List<string> { "A", "B", "C", "D", "E" };
names.RemoveRange(1, 3);  // 从索引1开始删除3个元素

// 结果: ["A", "E"]
```

### Clear - 清空所有元素

```csharp
List<string> names = new List<string> { "Alice", "Bob" };
names.Clear();  // 删除所有元素

Console.WriteLine(names.Count);  // 0
```

---

## 遍历列表

### foreach 循环

```csharp
List<string> names = new List<string> { "Alice", "Bob", "Charlie" };

foreach (string name in names)
{
    Console.WriteLine($"Hello {name.ToUpper()}!");
}
```

### for 循环

```csharp
for (int i = 0; i < names.Count; i++)
{
    Console.WriteLine($"Index {i}: {names[i]}");
}
```

### 倒序遍历

```csharp
for (int i = names.Count - 1; i >= 0; i--)
{
    Console.WriteLine(names[i]);
}
```

---

## 搜索元素

### Contains - 判断是否包含

```csharp
List<string> names = new List<string> { "Alice", "Bob", "Charlie" };

bool hasAlice = names.Contains("Alice");   // true
bool hasDavid = names.Contains("David");    // false
```

### IndexOf - 获取首次出现位置

```csharp
List<string> names = new List<string> { "Alice", "Bob", "Alice" };

int index1 = names.IndexOf("Alice");   // 0
int index2 = names.IndexOf("David");    // -1（未找到）
```

### LastIndexOf - 获取最后出现位置

```csharp
List<string> names = new List<string> { "Alice", "Bob", "Alice" };

int lastIndex = names.LastIndexOf("Alice");  // 2
```

### FindIndex - 使用条件查找

```csharp
List<int> scores = new List<int> { 85, 92, 78, 95, 88 };

int firstPassIndex = scores.FindIndex(s => s >= 90);  // 1（值为92）
```

### FindLastIndex - 查找最后一个

```csharp
int lastPassIndex = scores.FindLastIndex(s => s >= 90);  // 3（值为95）
```

### Find - 查找第一个匹配项

```csharp
List<int> scores = new List<int> { 85, 92, 78, 95, 88 };

int firstPass = scores.Find(s => s >= 90);  // 92
```

### FindAll - 查找所有匹配项

```csharp
List<int> scores = new List<int> { 85, 92, 78, 95, 88 };

List<int> passingScores = scores.FindAll(s => s >= 90);
// 结果: [92, 95]
```

---

## 排序

### Sort - 默认升序

```csharp
List<int> numbers = new List<int> { 5, 2, 8, 1, 9 };
numbers.Sort();

foreach (int n in numbers)
{
    Console.WriteLine(n);
}
```

**输出：** 1, 2, 5, 8, 9

### Reverse - 反转顺序

```csharp
List<int> numbers = new List<int> { 1, 2, 3, 4, 5 };
numbers.Reverse();

// 结果: [5, 4, 3, 2, 1]
```

### 自定义排序

```csharp
List<string> names = new List<string> { "Charlie", "Alice", "Bob" };

// 按长度排序
names.Sort((a, b) => a.Length.CompareTo(b.Length));

// 结果: ["Bob", "Alice", "Charlie"]
```

---

## 其他操作

### ConvertAll - 转换所有元素

```csharp
List<int> numbers = new List<int> { 1, 2, 3, 4, 5 };

// 将所有数字转为字符串
List<string> strNumbers = numbers.ConvertAll(n => n.ToString());
```

### Exists - 判断是否存在

```csharp
List<int> numbers = new List<int> { 1, 2, 3, 4, 5 };

bool hasEven = numbers.Exists(n => n % 2 == 0);  // true
bool hasNegative = numbers.Exists(n => n < 0);   // false
```

### TrueForAll - 判断所有元素

```csharp
List<int> numbers = new List<int> { 2, 4, 6, 8 };

bool allEven = numbers.TrueForAll(n => n % 2 == 0);  // true
```

---

## 实用示例

### 示例1：学生成绩管理

```csharp
List<int> scores = new List<int>();

// 添加成绩
scores.Add(85);
scores.Add(92);
scores.Add(78);
scores.Add(95);
scores.Add(88);

// 计算平均分
int sum = 0;
foreach (int score in scores)
{
    sum += score;
}
double average = (double)sum / scores.Count;

Console.WriteLine($"平均分: {average:F2}");  // 87.60
```

### 示例2：去重

```csharp
List<string> items = new List<string> { "A", "B", "A", "C", "B" };
List<string> unique = items.Distinct().ToList();

foreach (string item in unique)
{
    Console.WriteLine(item);
}
// 输出: A, B, C
```

### 示例3：斐波那契数列

```csharp
List<int> fibonacci = new List<int> { 1, 1 };

while (fibonacci.Count < 20)
{
    int a = fibonacci[fibonacci.Count - 1];
    int b = fibonacci[fibonacci.Count - 2];
    fibonacci.Add(a + b);
}

foreach (int n in fibonacci)
{
    Console.WriteLine(n);
}
```

### 示例4：筛选和统计

```csharp
List<int> numbers = new List<int> { 85, 92, 78, 95, 88, 73, 90 };

// 找出及格的成绩
List<int> passing = numbers.FindAll(n => n >= 60);
Console.WriteLine($"及格人数: {passing.Count}");

// 找出最高分
int max = numbers.Max();
Console.WriteLine($"最高分: {max}");

// 找出最低分
int min = numbers.Min();
Console.WriteLine($"最低分: {min}");
```

---

## 性能注意事项

### 容量预分配

如果知道大概元素数量，可以预分配容量：

```csharp
List<string> names = new List<string>(1000);  // 预分配1000个空间

// 避免频繁扩容，提高性能
```

### 不要在遍历时修改

```csharp
List<string> names = new List<string> { "A", "B", "C" };

// ❌ 错误：foreach中修改集合
foreach (string name in names)
{
    if (name == "B")
        names.Remove(name);
}

// ✅ 正确：使用 RemoveAll
names.RemoveAll(n => n == "B");

// ✅ 正确：倒序遍历时删除
for (int i = names.Count - 1; i >= 0; i--)
{
    if (names[i] == "B")
        names.RemoveAt(i);
}
```

---

## 常见错误

### 1. 索引越界

```csharp
List<string> names = new List<string> { "Alice" };

Console.WriteLine(names[10]);  // ❌ IndexOutOfRangeException

// ✅ 正确做法
if (names.Count > 10)
{
    Console.WriteLine(names[10]);
}
```

### 2. 空列表操作

```csharp
List<string> names = new List<string>();

names[0] = "Alice";  // ❌ 空列表没有索引0

// ✅ 正确做法
names.Add("Alice");
```

### 3. 类型不匹配

```csharp
List<int> numbers = new List<int> { 1, 2, 3 };
numbers.Add("4");  // ❌ 编译错误：类型不匹配

// ✅ 正确做法
numbers.Add(4);
```

---

## 总结

| 方法 | 说明 |
|------|------|
| `Add()` | 添加单个元素 |
| `AddRange()` | 添加多个元素 |
| `Insert()` | 在指定位置插入 |
| `Remove()` | 删除第一个匹配项 |
| `RemoveAt()` | 删除指定索引 |
| `Clear()` | 清空所有元素 |
| `Contains()` | 判断是否包含 |
| `IndexOf()` | 查找首次出现位置 |
| `Sort()` | 排序 |
| `Reverse()` | 反转顺序 |
| `FindAll()` | 查找所有匹配项 |

---

## 相关资源

- [List<T> 文档](https://learn.microsoft.com/zh-cn/dotnet/api/system.collections.generic.list-1)
- [选择集合类型](https://learn.microsoft.com/zh-cn/dotnet/standard/collections/selecting-a-collection-class)
- [集合教程](https://learn.microsoft.com/zh-cn/dotnet/csharp/tour-of-csharp/tutorials/list-collection)
