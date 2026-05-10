---
title: C# 学会使用 LINQ 查询数据
author: Joekma
pubDatetime: 2026-05-06T00:00:00.000+08:00
modDatetime: 2026-05-06T00:00:00.000+08:00
slug: csharp-linq-queries
description: '深入学习 C# LINQ 查询，掌握查询语法、方法语法、标准查询运算符，以及如何查询各种数据源。'
tags:
  - C#
  - LINQ
  - 查询
  - 数据查询
  - Lambda
  - 语言集成查询
draft: false
series: csharp
language: zh-CN
---

## 概述

LINQ（Language-Integrated Query，语言集成查询）是 C# 中强大的数据查询功能。它将查询功能直接集成到 C# 语言中，提供一致的方式来查询和转换各种数据源的数据。

### LINQ 的优势

| 优势 | 说明 |
|------|------|
| **统一语法** | 使用相同语法查询不同数据源 |
| **编译时检查** | 类型安全，编译时发现错误 |
| **智能提示** | IDE 提供完整的 IntelliSense 支持 |
| **声明式编程** | 代码更简洁、更易读 |

---

## 查询表达式基础

### 三个组成部分

每个 LINQ 查询操作都包含三个部分：

1. **数据源** - 指定要查询的数据
2. **查询** - 定义要执行的操作
3. **执行** - 通常使用 `foreach` 执行

```csharp
// 1. 数据源
int[] numbers = { 0, 1, 2, 3, 4, 5, 6 };

// 2. 创建查询
var query = from num in numbers
            where num % 2 == 0
            select num;

// 3. 执行查询
foreach (int num in query)
{
    Console.Write($"{num} ");
}
```

### 查询子句

| 子句 | 说明 | 示例 |
|------|------|------|
| `from` | 指定数据源和范围变量 | `from n in numbers` |
| `where` | 筛选条件 | `where n > 5` |
| `select` | 指定返回元素 | `select n * 2` |
| `orderby` | 排序 | `orderby n descending` |
| `group` | 分组 | `group n by n % 2` |
| `join` | 连接两个集合 | `join n2 in nums2 on n equals n2` |
| `let` | 定义临时变量 | `let square = n * n` |

---

## 筛选操作

### 使用 where 子句

```csharp
int[] scores = { 90, 85, 78, 92, 88, 73, 95 };

// 查询及格成绩
var passingScores = from score in scores
                     where score >= 60
                     select score;

// 方法语法
var passingScores2 = scores.Where(s => s >= 60);
```

### 多个筛选条件

```csharp
var highScores = from score in scores
                 where score >= 80 && score <= 95
                 select score;

// 或
var highScores2 = scores.Where(s => s >= 80 && s <= 95);
```

---

## 排序操作

### orderby 子句

```csharp
string[] names = { "Charlie", "Alice", "Bob", "Diana" };

// 升序排序
var sortedAsc = from name in names
                orderby name
                select name;

// 降序排序
var sortedDesc = from name in names
                 orderby name descending
                 select name;
```

### 多级排序

```csharp
var students = new[]
{
    new { Name = "Alice", Score = 92 },
    new { Name = "Bob", Score = 78 },
    new { Name = "Charlie", Score = 92 },
    new { Name = "Diana", Score = 85 }
};

// 先按分数降序，再按姓名升序
var sorted = from s in students
             orderby s.Score descending, s.Name ascending
             select s;
```

---

## 分组操作

### group 子句

```csharp
int[] numbers = { 1, 2, 3, 4, 5, 6, 7, 8, 9 };

// 按奇偶分组
var grouped = from n in numbers
              group n by n % 2;

// grouped 是 IEnumerable<IGrouping<int, int>>
foreach (var group in grouped)
{
    Console.WriteLine($"余数 {group.Key}:");
    foreach (var number in group)
    {
        Console.WriteLine($"  {number}");
    }
}
```

### 使用 into 保存分组结果

```csharp
var groups = from n in numbers
             group n by n % 2 into g
             where g.Count() > 2  // 只保留元素超过2个的组
             select new
             {
                 Remainder = g.Key,
                 Count = g.Count(),
                 Numbers = g.ToList()
             };
```

---

## 连接操作

### join 子句

```csharp
var students = new[]
{
    new { Id = 1, Name = "Alice" },
    new { Id = 2, Name = "Bob" }
};

var grades = new[]
{
    new { StudentId = 1, Score = 92 },
    new { StudentId = 1, Score = 88 },
    new { StudentId = 2, Score = 78 }
};

// 内连接
var joined = from s in students
             join g in grades on s.Id equals g.StudentId
             select new
             {
                 s.Name,
                 g.Score
             };
```

### 分组连接

```csharp
// 保留左表中没有匹配的记录
var groupJoin = from s in students
                join g in grades on s.Id equals g.StudentId into studentGrades
                select new
                {
                    s.Name,
                    Grades = studentGrades
                };
```

---

## 投影操作

### select 子句

```csharp
int[] numbers = { 1, 2, 3, 4, 5 };

// 投影为新类型
var doubled = from n in numbers
              select n * 2;

// 投影为匿名对象
var anonymous = from n in numbers
                select new
                {
                    Number = n,
                    Square = n * n,
                    Cube = n * n * n
                };
```

### 筛选特定属性

```csharp
var people = new[]
{
    new { Name = "Alice", Age = 25, City = "北京" },
    new { Name = "Bob", Age = 30, City = "上海" },
    new { Name = "Charlie", Age = 25, City = "北京" }
};

// 只选择姓名和城市
var namesAndCities = from p in people
                     select new { p.Name, p.City };
```

---

## let 子句

使用 `let` 创建临时变量：

```csharp
string[] words = { "hello", "world", "LINQ", "programming" };

var results = from word in words
              let length = word.Length
              where length > 4
              orderby length
              select new
              {
                  Word = word,
                  Length = length,
                  Upper = word.ToUpper()
              };
```

---

## 标准查询运算符

### 分类

| 类型 | 运算符 |
|------|--------|
| **限制** | `Where`、`Take`、`Skip`、`TakeWhile`、`SkipWhile` |
| **投影** | `Select`、`SelectMany` |
| **排序** | `OrderBy`、`ThenBy`、`OrderByDescending`、`ThenByDescending`、`Reverse` |
| **分组** | `GroupBy`、`ToLookup` |
| **集合** | `Distinct`、`Union`、`Intersect`、`Except` |
| **转换** | `OfType`、`Cast` |
| **元素** | `First`、`FirstOrDefault`、`Last`、`LastOrDefault`、`Single`、`ElementAt` |
| **聚合** | `Count`、`Sum`、`Average`、`Min`、`Max`、`Aggregate` |
| **限定符** | `Any`、`All`、`Contains` |
| **生成** | `Range`、`Repeat`、`Empty` |

### Where - 筛选

```csharp
int[] numbers = { 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 };

// 找出偶数
var evens = numbers.Where(n => n % 2 == 0);

// 找出大于5的数
var greaterThan5 = numbers.Where(n => n > 5);
```

### Select - 投影

```csharp
string[] names = { "Alice", "Bob", "Charlie" };

// 转换为大写
var upperNames = names.Select(n => n.ToUpper());

// 转换为长度
var lengths = names.Select(n => n.Length);

// 索引版 Select
var indexed = names.Select((name, index) => $"{index}: {name}");
```

### OrderBy / ThenBy - 排序

```csharp
var students = new[]
{
    new { Name = "Alice", Score = 92 },
    new { Name = "Bob", Score = 78 },
    new { Name = "Charlie", Score = 92 }
};

// 单级排序
var byScore = students.OrderBy(s => s.Score);

// 多级排序
var byScoreAndName = students
    .OrderByDescending(s => s.Score)
    .ThenBy(s => s.Name);
```

### GroupBy - 分组

```csharp
var people = new[]
{
    new { Name = "Alice", City = "北京" },
    new { Name = "Bob", City = "上海" },
    new { Name = "Charlie", City = "北京" },
    new { Name = "Diana", City = "上海" }
};

// 按城市分组
var byCity = people.GroupBy(p => p.City);

foreach (var group in byCity)
{
    Console.WriteLine($"城市: {group.Key}");
    foreach (var person in group)
    {
        Console.WriteLine($"  {person.Name}");
    }
}
```

### Join - 连接

```csharp
var employees = new[]
{
    new { Id = 1, Name = "Alice" },
    new { Id = 2, Name = "Bob" }
};

var departments = new[]
{
    new { EmployeeId = 1, Dept = "研发" },
    new { EmployeeId = 2, Dept = "销售" }
};

var joined = employees.Join(
    departments,
    e => e.Id,
    d => d.EmployeeId,
    (e, d) => new { e.Name, d.Dept }
);
```

### Any / All - 限定符

```csharp
int[] numbers = { 1, 2, 3, 4, 5 };

// 是否有任何偶数
bool hasEven = numbers.Any(n => n % 2 == 0);

// 是否所有数都大于0
bool allPositive = numbers.All(n => n > 0);
```

### Count / Sum / Average / Min / Max - 聚合

```csharp
int[] scores = { 90, 85, 78, 92, 88 };

// 元素个数
int count = scores.Count();

// 总分
int total = scores.Sum();

// 平均分
double average = scores.Average();

// 最高分
int max = scores.Max();

// 最低分
int min = scores.Min();
```

### First / Single - 元素

```csharp
int[] numbers = { 1, 2, 3, 4, 5 };

// 获取第一个元素
int first = numbers.First();           // 1
int firstEven = numbers.First(n => n % 2 == 0);  // 2

// 获取第一个或默认值
int firstOrDefault = numbers.FirstOrDefault(n => n > 10);  // 0

// 获取唯一元素（如果有多个会抛异常）
int single = numbers.Single(n => n == 3);  // 3
```

### Take / Skip - 分页

```csharp
int[] numbers = { 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 };

// 取前5个
var first5 = numbers.Take(5);

// 跳过前3个
var skip3 = numbers.Skip(3);

// 分页：每页3条，取第2页
var page2 = numbers.Skip(3).Take(3);  // 4, 5, 6
```

### Distinct - 去重

```csharp
int[] numbers = { 1, 2, 2, 3, 3, 3, 4, 4, 4, 4 };

var unique = numbers.Distinct();  // 1, 2, 3, 4

// 自定义去重
var people = new[]
{
    new { Name = "Alice", Age = 25 },
    new { Name = "Bob", Age = 30 },
    new { Name = "Alice", Age = 25 }
};

var distinctPeople = people.Distinct();  // 保留第一个 Alice
```

### Union / Intersect / Except - 集合操作

```csharp
int[] a = { 1, 2, 3, 4 };
int[] b = { 3, 4, 5, 6 };

// 并集
var union = a.Union(b);  // 1, 2, 3, 4, 5, 6

// 交集
var intersect = a.Intersect(b);  // 3, 4

// 差集
var except = a.Except(b);  // 1, 2
```

---

## 查询执行方式

### 延迟执行

大多数 LINQ 查询使用延迟执行：

```csharp
int[] numbers = { 1, 2, 3, 4, 5 };

var query = numbers.Where(n => n > 2);  // 不执行

// 修改数据源
numbers[0] = 10;  // 修改数据源

// 执行查询 - 反映最新数据
foreach (var n in query)
{
    Console.WriteLine(n);  // 输出: 3, 4, 5
}
```

### 立即执行

某些操作会立即执行：

```csharp
int[] numbers = { 1, 2, 3, 4, 5 };

// 聚合操作立即执行
int count = numbers.Count();  // 立即执行

// 转换为 List 或数组
List<int> list = numbers.Where(n => n > 2).ToList();  // 立即执行
int[] array = numbers.Where(n => n > 2).ToArray();  // 立即执行
```

### ToList / ToArray / ToDictionary

```csharp
// 转换为 List
var list = (from n in numbers
            where n > 2
            select n).ToList();

// 转换为数组
var array = numbers.Where(n => n > 2).ToArray();

// 转换为 Dictionary
var dict = students.ToDictionary(s => s.Id, s => s.Name);
```

---

## 方法语法与查询语法

### 互相转换

```csharp
int[] numbers = { 1, 2, 3, 4, 5 };

// 查询语法
var query1 = from n in numbers
             where n > 2
             orderby n descending
             select n * 2;

// 方法语法
var query2 = numbers
    .Where(n => n > 2)
    .OrderByDescending(n => n)
    .Select(n => n * 2);

// 混合使用
var mixed = (from n in numbers
             where n > 2
             select n)
    .Average();  // 使用方法语法调用 Average
```

### 选择合适的方式

| 场景 | 推荐语法 |
|------|---------|
| 简单筛选 | 方法语法 |
| 复杂 join/group | 查询语法 |
| 多步操作 | 混合语法 |

---

## 实用示例

### 示例1：学生成绩统计

```csharp
var students = new[]
{
    new { Name = "Alice", Score = 92, Class = "A" },
    new { Name = "Bob", Score = 78, Class = "B" },
    new { Name = "Charlie", Score = 85, Class = "A" },
    new { Name = "Diana", Score = 90, Class = "B" },
    new { Name = "Eve", Score = 88, Class = "A" }
};

// 1. 各班平均分
var classAverages = students
    .GroupBy(s => s.Class)
    .Select(g => new
    {
        Class = g.Key,
        Average = g.Average(s => s.Score)
    });

// 2. 及格学生名单
var passing = students
    .Where(s => s.Score >= 60)
    .OrderByDescending(s => s.Score);

// 3. 最高分学生
var topStudent = students
    .OrderByDescending(s => s.Score)
    .First();

// 4. 成绩分段统计
var scoreRanges = students
    .GroupBy(s => s.Score switch
    {
        >= 90 => "优秀",
        >= 80 => "良好",
        >= 70 => "中等",
        >= 60 => "及格",
        _ => "不及格"
    });
```

### 示例2：文本处理

```csharp
string text = "Hello World, Hello LINQ, Hello C#";

// 1. 词频统计
var wordCounts = text
    .Split(new[] { ' ', ',', '.' }, StringSplitOptions.RemoveEmptyEntries)
    .GroupBy(w => w)
    .Select(g => new { Word = g.Key, Count = g.Count() })
    .OrderByDescending(x => x.Count);

// 2. 找出出现次数最多的词
var mostCommon = wordCounts.First();
```

### 示例3：层次结构查询

```csharp
var categories = new[]
{
    new { Id = 1, Name = "电子产品", ParentId = (int?)null },
    new { Id = 2, Name = "手机", ParentId = 1 },
    new { Id = 3, Name = "电脑", ParentId = 1 },
    new { Id = 4, Name = "小米手机", ParentId = 2 }
};

// 获取所有分类及其子分类
var allCategories = from c1 in categories
                   join c2 in categories on c1.Id equals c2.ParentId into subs
                   select new
                   {
                       Category = c1,
                       SubCategories = subs
                   };
```

---

## 常见错误

### 1. 在循环外修改数据源

```csharp
var numbers = new List<int> { 1, 2, 3 };

var query = numbers.Where(n => n > 1);

numbers.Add(4);  // 修改数据源

foreach (var n in query)
{
    Console.WriteLine(n);  // 可能包含意外结果
}
```

### 2. 多次枚举延迟查询

```csharp
var numbers = new[] { 1, 2, 3, 4, 5 };

var evens = numbers.Where(n => n % 2 == 0);

// 第一次枚举
foreach (var n in evens) { /* ... */ }

// 第二次枚举 - 每次都重新计算
foreach (var n in evens) { /* ... */ }

// 解决方案：使用 ToList/ToArray
var evensList = evens.ToList();
foreach (var n in evensList) { /* ... */ }
foreach (var n in evensList) { /* ... */ }
```

### 3. 空集合处理

```csharp
int[] numbers = { };

// First() 会抛异常
// int first = numbers.First();  // InvalidOperationException

// FirstOrDefault() 返回默认值
int first = numbers.FirstOrDefault();  // 0
```

---

## 总结

| 运算符 | 说明 |
|--------|------|
| `Where` | 筛选条件 |
| `Select` | 投影转换 |
| `OrderBy/ThenBy` | 排序 |
| `GroupBy` | 分组 |
| `Join` | 连接 |
| `Any/All` | 限定符 |
| `Count/Sum/Min/Max/Average` | 聚合 |
| `Take/Skip` | 分页 |
| `Distinct` | 去重 |

---

## 相关资源

- [LINQ 概述](https://learn.microsoft.com/zh-cn/dotnet/csharp/linq/)
- [LINQ 查询简介](https://learn.microsoft.com/zh-cn/dotnet/csharp/linq/get-started/introduction-to-linq-queries)
- [标准查询运算符](https://learn.microsoft.com/zh-cn/dotnet/csharp/linq/standard-query-operators/)
