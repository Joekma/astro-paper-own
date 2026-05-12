---
title: C# 理解泛型和集合（List、Dictionary）
author: Joekma
pubDatetime: 2026-05-06T00:00:00.000+08:00
modDatetime: 2026-05-06T00:00:00.000+08:00
slug: csharp-generics-collections
description: "深入学习 C# 泛型编程，掌握泛型类型、泛型方法、类型约束、协变逆变，以及常用泛型集合 List、Dictionary、HashSet 等。"
tags:
  - C#
  - 泛型
  - 集合
  - List
  - Dictionary
  - 泛型约束
  - 协变
  - 逆变
draft: false
series: csharp
language: zh-CN
---

## 概述

泛型允许编写适用于任何类型的代码，同时保持完整的类型安全性。本文将详细介绍泛型类型、泛型方法、类型约束，以及常用的泛型集合。

### 泛型的优势

| 优势         | 说明                   |
| ------------ | ---------------------- |
| **类型安全** | 编译时检查类型错误     |
| **性能优化** | 避免装箱和拆箱操作     |
| **代码复用** | 一套代码适用于多种类型 |
| **可读性**   | 代码更清晰、更易维护   |

---

## 泛型类型参数

### 什么是泛型

泛型通过类型参数（通常用 `T` 表示）来编写可重用的代码：

```csharp
// 非泛型 - 需要为每种类型编写不同代码
class IntStack
{
    private int[] _items;
    public void Push(int item) { /* ... */ }
}

class StringStack
{
    private string[] _items;
    public void Push(string item) { /* ... */ }
}

// 泛型 - 一套代码适用于所有类型
class Stack<T>
{
    private T[] _items;
    public void Push(T item) { /* ... */ }
}
```

### 使用泛型类型

```csharp
// 创建整数栈
var intStack = new Stack<int>();
intStack.Push(1);
intStack.Push(2);

// 创建字符串栈
var stringStack = new Stack<string>();
stringStack.Push("Hello");
stringStack.Push("World");

// 创建自定义类型栈
var personStack = new Stack<Person>();
personStack.Push(new Person("Alice", 25));
```

---

## 泛型方法

### 基本语法

泛型方法声明自己的类型参数：

```csharp
// 泛型方法
static void Print<T>(T value)
{
    Console.WriteLine($"Value: {value}");
}

// 编译器自动推断类型
Print(42);           // T 推断为 int
Print("Hello");       // T 推断为 string
Print(3.14);          // T 推断为 double
```

### 多个类型参数

```csharp
// 多个类型参数
static TReturn Execute<TInput, TReturn>(TInput input, Func<TInput, TReturn> transform)
{
    return transform(input);
}

// 使用
var result = Execute("Hello", s => s.ToUpper());  // HELLO
var num = Execute(5, n => n * n);                 // 25
```

### 带约束的泛型方法

```csharp
// 要求 T 实现 IComparable<T>
static T Max<T>(T a, T b) where T : IComparable<T>
{
    return a.CompareTo(b) >= 0 ? a : b;
}

Console.WriteLine(Max(3, 7));              // 7
Console.WriteLine(Max("apple", "banana")); // banana
```

---

## 类型约束

### 常用约束

| 约束                   | 说明                       |
| ---------------------- | -------------------------- |
| `where T : class`      | T 必须是引用类型           |
| `where T : struct`     | T 必须是值类型             |
| `where T : new()`      | T 必须有公共无参数构造函数 |
| `where T : BaseClass`  | T 必须派生自 BaseClass     |
| `where T : IInterface` | T 必须实现 IInterface      |

### 约束示例

```csharp
// 必须有默认构造函数
static T CreateDefault<T>() where T : new()
{
    return new T();
}

// 必须实现接口
static decimal Sum<T>(IEnumerable<T> items) where T : INumber<T>
{
    return items.Sum();
}

// 必须派生自某个类
static void Save<T>(T entity) where T : BaseEntity
{
    entity.Save();
}

// 组合多个约束
class Factory<T> where T : class, new()
{
    public T Create()
    {
        return new T();
    }
}
```

### 少见约束

```csharp
// 必须是枚举类型
static T EnumToString<T>() where T : Enum
{
    return default;
}

// 必须是委托类型
static void InvokeDelegate<T>(T del) where T : Delegate
{
    del.DynamicInvoke();
}

// 必须是非托管类型
static unsafe void* ToPointer<T>(T value) where T : unmanaged
{
    return &value;
}
```

---

## 泛型集合

### 集合类型概览

| 集合                       | 特点             | 适用场景     |
| -------------------------- | ---------------- | ------------ |
| `List<T>`                  | 动态数组、有索引 | 需要随机访问 |
| `Dictionary<TKey, TValue>` | 键值对、键唯一   | 需要按键查找 |
| `HashSet<T>`               | 不重复、无序     | 需要去重     |
| `Queue<T>`                 | 先进先出         | 任务队列     |
| `Stack<T>`                 | 先进后出         | 撤销操作     |
| `LinkedList<T>`            | 双向链表         | 频繁插入删除 |

---

## List<T> 详解

### 创建和初始化

```csharp
// 创建空列表
var list1 = new List<int>();

// 创建带初始容量
var list2 = new List<int>(100);

// 从集合初始化
var list3 = new List<int> { 1, 2, 3, 4, 5 };

// C# 12 简写
List<string> names = ["Alice", "Bob", "Charlie"];
```

### 添加元素

```csharp
var list = new List<int>();

list.Add(1);        // 添加单个元素
list.Add(2);

list.AddRange(new[] { 3, 4, 5 });  // 添加多个元素

list.Insert(0, 0);  // 在指定位置插入
list.InsertRange(2, new[] { 1, 2 });  // 批量插入
```

### 访问元素

```csharp
var list = new List<int> { 10, 20, 30, 40, 50 };

Console.WriteLine(list[0]);   // 第一个元素
Console.WriteLine(list[^1]);  // 最后一个元素 (C# 8+)
Console.WriteLine(list.Count); // 元素个数

// 遍历
foreach (var item in list)
{
    Console.WriteLine(item);
}
```

### 查找元素

```csharp
var list = new List<int> { 1, 2, 3, 4, 5 };

// 是否包含
bool has3 = list.Contains(3);  // true

// 查找位置
int index = list.IndexOf(3);   // 2
int lastIndex = list.LastIndexOf(3);  // 2

// 条件查找
int firstEven = list.Find(n => n % 2 == 0);  // 2
List<int> allEven = list.FindAll(n => n % 2 == 0);  // [2, 4]

// 查找索引
int firstEvenIndex = list.FindIndex(n => n % 2 == 0);  // 1
```

### 删除元素

```csharp
var list = new List<int> { 1, 2, 3, 2, 4, 2 };

list.Remove(2);       // 删除第一个匹配的 2
list.RemoveAt(0);     // 删除指定索引的元素
list.RemoveRange(0, 2);  // 删除范围内元素
list.RemoveAll(n => n == 2);  // 删除所有匹配的
list.Clear();         // 清空所有元素
```

### 排序和搜索

```csharp
var list = new List<int> { 3, 1, 4, 1, 5, 9, 2, 6 };

list.Sort();          // 升序排序
list.Reverse();      // 反转顺序

// 自定义排序
list.Sort((a, b) => b.CompareTo(a));  // 降序

// 二分查找（需要已排序）
int idx = list.BinarySearch(5);  // 查找 5 的位置
```

### 其他方法

```csharp
var list = new List<int> { 1, 2, 3, 4, 5 };

// 转换所有元素
List<string> strNums = list.ConvertAll(n => n.ToString());
// 结果: ["1", "2", "3", "4", "5"]

// 判断是否存在
bool hasEven = list.Exists(n => n % 2 == 0);  // true
bool hasNegative = list.Exists(n => n < 0);   // false

// 判断所有元素
bool allPositive = list.TrueForAll(n => n > 0);  // true

// 转换为数组
int[] array = list.ToArray();

// 获取子列表
var sub = list.GetRange(1, 3);  // 从索引1开始取3个元素
// 结果: [2, 3, 4]
```

### 遍历时修改

```csharp
var list = new List<int> { 1, 2, 3, 4, 5 };

// ❌ 错误：foreach 中直接修改
foreach (var n in list)
{
    if (n > 3) list.Remove(n);
}

// ✅ 正确：倒序遍历
for (int i = list.Count - 1; i >= 0; i--)
{
    if (list[i] > 3) list.RemoveAt(i);
}

// ✅ 正确：使用 RemoveAll
list.RemoveAll(n => n > 3);
```

---

## Dictionary<TKey, TValue> 详解

### 创建和初始化

```csharp
// 创建空字典
var dict1 = new Dictionary<string, int>();

// 创建带初始数据
var dict2 = new Dictionary<string, int>
{
    ["Alice"] = 90,
    ["Bob"] = 85,
    ["Charlie"] = 92
};

// 使用对象初始化器
var dict3 = new Dictionary<string, int>
{
    { "Alice", 90 },
    { "Bob", 85 }
};
```

### 添加和访问

```csharp
var dict = new Dictionary<string, int>
{
    ["Alice"] = 90,
    ["Bob"] = 85
};

// 添加
dict["Charlie"] = 92;
dict.Add("Diana", 88);

// 访问
int aliceScore = dict["Alice"];
Console.WriteLine(aliceScore);  // 90

// 安全访问
bool found = dict.TryGetValue("Bob", out int score);
Console.WriteLine(score);  // 85

// 遍历
foreach (var kvp in dict)
{
    Console.WriteLine($"{kvp.Key}: {kvp.Value}");
}
```

### 常用操作

```csharp
var dict = new Dictionary<string, int>
{
    ["Alice"] = 90,
    ["Bob"] = 85,
    ["Charlie"] = 92
};

// 是否包含
bool hasAlice = dict.ContainsKey("Alice");
bool has90 = dict.ContainsValue(90);

// 删除
dict.Remove("Bob");

// 清空
dict.Clear();

// 统计
int count = dict.Count;
```

### 高级用法

```csharp
var dict = new Dictionary<string, int>
{
    ["Alice"] = 90,
    ["Bob"] = 85,
    ["Charlie"] = 92
};

// 获取所有键
foreach (var key in dict.Keys)
{
    Console.WriteLine(key);
}

// 获取所有值
foreach (var value in dict.Values)
{
    Console.WriteLine(value);
}

// 合并字典
var defaults = new Dictionary<string, int>
{
    ["Timeout"] = 30,
    ["Retries"] = 3
};

var overrides = new Dictionary<string, int>
{
    ["Timeout"] = 60
};

var config = new Dictionary<string, int>(defaults);
foreach (var kvp in overrides)
{
    config[kvp.Key] = kvp.Value;
}
```

---

## HashSet<T> 详解

### 基本用法

```csharp
// 创建 HashSet
var set = new HashSet<int> { 1, 2, 3, 4, 5 };

// 添加
set.Add(6);
set.Add(1);  // 重复，不会添加

Console.WriteLine(set.Count);  // 6

// 是否包含
bool has3 = set.Contains(3);  // true
```

### 集合操作

```csharp
var set1 = new HashSet<int> { 1, 2, 3, 4 };
var set2 = new HashSet<int> { 3, 4, 5, 6 };

// 并集
var union = new HashSet<int>(set1);
union.UnionWith(set2);  // { 1, 2, 3, 4, 5, 6 }

// 交集
var intersect = new HashSet<int>(set1);
intersect.IntersectWith(set2);  // { 3, 4 }

// 差集
var except = new HashSet<int>(set1);
except.ExceptWith(set2);  // { 1, 2 }

// 对称差集
var symmetric = new HashSet<int>(set1);
symmetric.SymmetricExceptWith(set2);  // { 1, 2, 5, 6 }

// 子集判断
bool isSubset = set1.IsSubsetOf(union);  // true
bool isSuperset = union.IsSupersetOf(set1);  // true
```

---

## LinkedList<T> 详解

### 双向链表

LinkedList 是双向链表，适合频繁插入删除的场景：

```csharp
var linked = new LinkedList<int>();

// 添加节点
linked.AddFirst(1);      // 头部添加
linked.AddLast(5);      // 尾部添加
linked.AddAfter(linked.First!, 2);  // 在首节点后添加
linked.AddBefore(linked.Last!, 4);  // 在尾节点前添加

// 结果: 1 → 2 → 4 → 5
```

### 遍历和访问

```csharp
var linked = new LinkedList<string>();
linked.AddLast("A");
linked.AddLast("B");
linked.AddLast("C");

// 正向遍历
for (LinkedListNode<string>? node = linked.First; node != null; node = node.Next)
{
    Console.WriteLine(node.Value);
}

// 反向遍历
for (LinkedListNode<string>? node = linked.Last; node != null; node = node.Previous)
{
    Console.WriteLine(node.Value);
}

// 直接访问
Console.WriteLine(linked.First?.Value);   // 第一个: "A"
Console.WriteLine(linked.Last?.Value);    // 最后一个: "C"
Console.WriteLine(linked.Count);          // 元素个数: 3
```

### 插入和删除

```csharp
var linked = new LinkedList<int>(new[] { 1, 3, 5 });

// 插入节点
var node2 = linked.Find(3);
linked.AddAfter(node2!, 4);   // 在 3 后插入 4

var node4 = linked.Find(4);
linked.AddBefore(node4!, 2);  // 在 4 前插入 2

// 删除节点
linked.Remove(3);             // 删除值 3
linked.RemoveFirst();        // 删除第一个
linked.RemoveLast();         // 删除最后一个
linked.Clear();              // 清空所有

// 结果: 1 → 2 → 4 → 5
```

### 适用场景

| 场景                 | 说明                       |
| -------------------- | -------------------------- |
| **频繁插入删除**     | O(1) 时间复杂度            |
| **不需要随机访问**   | 只能顺序遍历               |
| **实现其他数据结构** | 如栈、队列、双端队列       |
| **迭代时需要删除**   | 安全地在迭代中删除当前节点 |

---

## Queue<T> 详解

### 先进先出集合

```csharp
var queue = new Queue<int>();

// 入队
queue.Enqueue(1);
queue.Enqueue(2);
queue.Enqueue(3);

// 查看队首
int first = queue.Peek();  // 1

// 出队
int item = queue.Dequeue();  // 1
item = queue.Dequeue();       // 2

// 遍历
foreach (var item in queue)
{
    Console.WriteLine(item);
}
```

---

## Stack<T> 详解

### 先进后出集合

```csharp
var stack = new Stack<int>();

// 压栈
stack.Push(1);
stack.Push(2);
stack.Push(3);

// 查看栈顶
int top = stack.Peek();  // 3

// 弹栈
int item = stack.Pop();  // 3
item = stack.Pop();      // 2

// 遍历
foreach (var item in stack)
{
    Console.WriteLine(item);
}
```

---

## 协变和逆变

### 协变 (out)

协变允许使用比声明更具体的类型：

```csharp
// IEnumerable<T> 是协变的
IEnumerable<Dog> dogs = new List<Dog> { new Dog(), new Dog() };
IEnumerable<Animal> animals = dogs;  // 允许！

// Func<TResult> 也是协变的
Func<Dog> dogFunc = () => new Dog();
Func<Animal> animalFunc = dogFunc;  // 允许！
```

### 逆变 (in)

逆变允许使用比声明更一般的类型：

```csharp
// Action<T> 是逆变的
Action<Animal> printAnimal = a => Console.WriteLine(a.Name);
Action<Dog> printDog = printAnimal;  // 允许！

printDog(new Dog());  // 调用时会当作 Animal 处理
```

### 自定义协变接口

```csharp
// 定义协变接口
public interface IProducer<out T>
{
    T Produce();
}

// 定义逆变接口
public interface IConsumer<in T>
{
    void Consume(T item);
}

// 使用
IProducer<Dog> dogProducer = () => new Dog();
IProducer<Animal> animalProducer = dogProducer;  // 协变

IConsumer<Animal> animalConsumer = a => Console.WriteLine(a);
IConsumer<Dog> dogConsumer = animalConsumer;  // 逆变
```

---

## 集合表达式 (C# 12)

### 基本语法

```csharp
// 创建列表
List<int> numbers = [1, 2, 3, 4, 5];

// 创建数组
int[] array = [1, 2, 3];

// 范围操作符
var first = numbers[..3];   // 前3个
var last = numbers[^2..];   // 后2个
```

### 展开操作符

```csharp
var first = new List<int> { 1, 2, 3 };
var second = new List<int> { 4, 5, 6 };

// 合并列表
var combined = [.. first, .. second];
Console.WriteLine(string.Join(", ", combined));  // 1, 2, 3, 4, 5, 6

// 带额外元素
var withExtras = [0, .. first, 99, .. second];
```

---

## 实用示例

### 示例1：单词频率统计

```csharp
string text = "hello world hello C# hello";
var words = text.Split(' ');

var wordCounts = new Dictionary<string, int>();
foreach (var word in words)
{
    if (wordCounts.ContainsKey(word))
        wordCounts[word]++;
    else
        wordCounts[word] = 1;
}

// 使用 GetValueOrDefault 简化
var counts = new Dictionary<string, int>();
foreach (var word in words)
{
    counts[word] = counts.GetValueOrDefault(word) + 1;
}
```

### 示例2：分组统计

```csharp
var students = new[]
{
    new { Name = "Alice", Class = "A", Score = 90 },
    new { Name = "Bob", Class = "B", Score = 85 },
    new { Name = "Charlie", Class = "A", Score = 92 },
    new { Name = "Diana", Class = "B", Score = 88 }
};

var byClass = new Dictionary<string, List<int>>();
foreach (var s in students)
{
    if (!byClass.ContainsKey(s.Class))
        byClass[s.Class] = new List<int>();
    byClass[s.Class].Add(s.Score);
}

// 计算各班平均分
foreach (var kvp in byClass)
{
    double avg = kvp.Value.Average();
    Console.WriteLine($"Class {kvp.Key}: {avg:F2}");
}
```

### 示例3：LRU 缓存

```csharp
public class LRUCache<TKey, TValue> where TKey : notnull
{
    private readonly int _capacity;
    private readonly Dictionary<TKey, TValue> _cache;
    private readonly Queue<TKey> _order;

    public LRUCache(int capacity)
    {
        _capacity = capacity;
        _cache = new Dictionary<TKey, TValue>(capacity);
        _order = new Queue<TKey>();
    }

    public TValue Get(TKey key)
    {
        if (_cache.TryGetValue(key, out var value))
        {
            // 重新排序
            var newOrder = new Queue<TKey>();
            while (_order.Count > 0)
            {
                var k = _order.Dequeue();
                if (!k?.Equals(key) == true)
                    newOrder.Enqueue(k);
            }
            newOrder.Enqueue(key);
            _order = newOrder;
            return value;
        }
        throw new KeyNotFoundException();
    }

    public void Put(TKey key, TValue value)
    {
        if (_cache.Count >= _capacity && !_cache.ContainsKey(key))
        {
            var removed = _order.Dequeue();
            _cache.Remove(removed);
        }
        _cache[key] = value;
        _order.Enqueue(key);
    }
}
```

---

## 常见错误

### 1. 类型不匹配

```csharp
List<int> intList = new List<int>();
List<object> objList = intList;  // ❌ 编译错误
```

### 2. 约束不足

```csharp
static T Max<T>(T a, T b)
{
    return a > b ? a : b;  // ❌ T 不一定能比较
}

// ✅ 正确：添加约束
static T Max<T>(T a, T b) where T : IComparable<T>
{
    return a.CompareTo(b) >= 0 ? a : b;
}
```

### 3. 修改集合时遍历

```csharp
var list = new List<int> { 1, 2, 3, 4, 5 };

// ❌ 错误：遍历时修改
foreach (var n in list)
{
    if (n > 3)
        list.Remove(n);
}

// ✅ 正确：倒序遍历
for (int i = list.Count - 1; i >= 0; i--)
{
    if (list[i] > 3)
        list.RemoveAt(i);
}

// ✅ 正确：使用 RemoveAll
list.RemoveAll(n => n > 3);
```

---

## 总结

| 集合                       | 特点               |
| -------------------------- | ------------------ |
| `List<T>`                  | 动态数组，支持索引 |
| `Dictionary<TKey, TValue>` | 键值对映射         |
| `HashSet<T>`               | 不重复集合         |
| `Queue<T>`                 | 先进先出           |
| `Stack<T>`                 | 先进后出           |
| **泛型约束**               | 限制类型参数的能力 |

---

## 相关资源

- [泛型文档](https://learn.microsoft.com/zh-cn/dotnet/csharp/fundamentals/types/generics)
- [集合概述](https://learn.microsoft.com/zh-cn/dotnet/csharp/tutorials/working-with-linq)
- [.NET 集合](https://learn.microsoft.com/zh-cn/dotnet/standard/collections/)
