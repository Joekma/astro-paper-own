---
title: C# 模式匹配详解
author: Joekma
pubDatetime: 2026-05-06T00:00:00.000+08:00
modDatetime: 2026-05-06T00:00:00.000+08:00
slug: csharp-pattern-matching
description: '深入学习 C# 中的模式匹配技术，掌握类型模式、关系模式、逻辑模式等多种匹配方式，让代码更加简洁优雅。'
tags:
  - C#
  - 模式匹配
  - Pattern Matching
  - switch
  - is
  - 类型检查
  - 表达式
draft: false
language: zh-CN
---

## 概述

模式匹配是 C# 中强大的特性，允许你检查值是否具有特定特征，并从复合值中提取数据。相比传统的 `if-else` 链，模式匹配代码更清晰、更易维护。

### 模式类型一览

| 模式类型 | 说明 | 示例 |
|---------|------|------|
| **常量模式** | 匹配具体值 | `case 1:` |
| **类型模式** | 检查值的类型 | `case string s:` |
| **关系模式** | 比较大小 | `case > 0:` |
| **逻辑模式** | 组合条件 | `case > 0 and < 10:` |
| **属性模式** | 检查属性值 | `case { Length: > 0 }:` |
| **元组模式** | 匹配元组 | `case (1, 2):` |
| **var 模式** | 绑定变量 | `case var x:` |

---

## 简单值匹配

### 使用 is 检查常量

最基本的模式匹配使用 `is` 运算符：

```csharp
object value = "Hello";

if (value is "Hello")
{
    Console.WriteLine("值是 Hello");
}
else if (value is "World")
{
    Console.WriteLine("值是 World");
}
```

### 使用 switch 表达式

C# 8.0 引入了更简洁的 `switch` 表达式：

```csharp
string GetDayName(int day)
{
    return day switch
    {
        1 => "星期一",
        2 => "星期二",
        3 => "星期三",
        4 => "星期四",
        5 => "星期五",
        6 => "星期六",
        7 => "星期日",
        _ => "无效日期"
    };
}

Console.WriteLine(GetDayName(3));  // 星期三
```

### 默认模式（弃元）

使用 `_` 作为默认值：

```csharp
string GetGrade(int score)
{
    return score switch
    {
        90 or 91 or 92 or 93 or 94 or 95 or 96 or 97 or 98 or 99 or 100 => "A",
        80 or 81 or 82 or 83 or 84 or 85 or 86 or 87 or 88 or 89 => "B",
        70 or 71 or 72 or 73 or 74 or 75 or 76 or 77 or 78 or 79 => "C",
        _ => "D"
    };
}
```

---

## 类型模式

### 基本类型检查

```csharp
object value = "Hello World";

if (value is string)
{
    Console.WriteLine("这是一个字符串");
}
else if (value is int)
{
    Console.WriteLine("这是一个整数");
}
```

### 类型模式 + 变量

同时检查类型并提取值：

```csharp
object value = "Hello";

if (value is string s)
{
    Console.WriteLine($"字符串长度: {s.Length}");
}
else if (value is int i)
{
    Console.WriteLine($"整数值: {i}");
}
```

### 在 switch 中使用类型模式

```csharp
object value = 42;

string description = value switch
{
    string s => $"字符串: {s}",
    int i => $"整数: {i}",
    double d => $"浮点数: {d}",
    bool b => $"布尔值: {b}",
    _ => "未知类型"
};

Console.WriteLine(description);  // 整数: 42
```

---

## 关系模式

### 比较运算符

C# 9.0 引入了关系模式：

```csharp
string GetTemperatureStatus(int temp)
{
    return temp switch
    {
        < 0 => "冰冻",
        >= 0 and < 10 => "寒冷",
        >= 10 and < 20 => "凉爽",
        >= 20 and < 30 => "温暖",
        >= 30 => "炎热"
    };
}

Console.WriteLine(GetTemperatureStatus(15));  // 凉爽
```

### 使用 and/or/not

```csharp
string GetSize(int number)
{
    return number switch
    {
        < 0 or > 100 => "超出范围",
        >= 0 and <= 30 => "小",
        > 30 and <= 70 => "中",
        _ => "大"
    };
}
```

---

## 逻辑模式

### and - 且

```csharp
string GetPassStatus(int score)
{
    return score switch
    {
        >= 0 and <= 100 and >= 60 => "及格",
        >= 0 and <= 100 and < 60 => "不及格",
        _ => "成绩无效"
    };
}
```

### or - 或

```csharp
char grade = 'B';

bool isVowel = grade is 'A' or 'E' or 'I' or 'O' or 'U';
Console.WriteLine($"元音字母: {isVowel}");  // False
```

### not - 非

```csharp
object value = "Hello";

if (value is not null and not "")
{
    Console.WriteLine("值有效");
}
```

---

## 属性模式

### 检查对象属性

```csharp
string GetPersonInfo(Person p)
{
    return p switch
    {
        { Name: "Alice", Age: 25 } => "Alice, 25岁",
        { Name: "Bob" } => $"Bob, {p.Age}岁",
        { Age: > 18 } => $"成年人, {p.Name}",
        _ => "其他人"
    };
}
```

### 嵌套属性检查

```csharp
string GetCityInfo(Company company)
{
    return company switch
    {
        { Address: { City: "北京" } } => "北京公司",
        { Address: { City: "上海" } } => "上海公司",
        { Address: { Country: "中国" } } => "其他中国公司",
        _ => "海外公司"
    };
}
```

---

## 元组模式

### 基本元组匹配

```csharp
string GetSign(int x, int y)
{
    return (x, y) switch
    {
        (> 0, > 0) => "第一象限",
        (< 0, > 0) => "第二象限",
        (< 0, < 0) => "第三象限",
        (> 0, < 0) => "第四象限",
        (0, _) => "在Y轴上",
        (_, 0) => "在X轴上",
        _ => "原点"
    };
}

Console.WriteLine(GetSign(1, 1));   // 第一象限
Console.WriteLine(GetSign(0, 5));   // 在Y轴上
```

### 元组与变量绑定

```csharp
var result = ("success", 200) switch
{
    ("success", var code) => $"成功: {code}",
    ("error", var code) => $"失败: {code}",
    (var status, var code) => $"未知状态: {status}, 代码: {code}"
};
```

---

## var 模式

### 变量绑定

```csharp
object value = "Hello";

if (value is var v)
{
    Console.WriteLine($"值是: {v}");
}
```

### 与条件组合

```csharp
string GetInfo(object value)
{
    return value switch
    {
        null => "空值",
        string s when s.Length > 5 => $"长字符串: {s}",
        string s => $"短字符串: {s}",
        int i when i > 0 => $"正整数: {i}",
        _ => "其他"
    };
}
```

### 常用场景

```csharp
// 获取元组第一个元素
var tuple = (1, 2, 3);
if (tuple is var first)
{
    Console.WriteLine($"第一个元素: {tuple.Item1}");
}
```

---

## 可空类型模式

### null 检查

```csharp
string? name = null;

if (name is null)
{
    Console.WriteLine("name 是 null");
}

// 或者使用关系模式
if (name is null or "")
{
    Console.WriteLine("name 为空");
}
```

### 可空值类型

```csharp
int? value = 42;

if (value is int n)
{
    Console.WriteLine($"值: {n}");
}
else
{
    Console.WriteLine("值为 null");
}
```

---

## 实际应用示例

### 示例1：银行交易处理

```csharp
public record Deposit(double Amount, string Description);
public record Withdrawal(double Amount, string Description);

double ProcessTransaction(object transaction)
{
    return transaction switch
    {
        Deposit(double amount, _) => amount,
        Withdrawal(double amount, _) => -amount,
        _ => 0.0
    };
}

// 使用
var deposit = new Deposit(1000, "工资");
var withdrawal = new Withdrawal(500, "消费");

Console.WriteLine(ProcessTransaction(deposit));    // 1000
Console.WriteLine(ProcessTransaction(withdrawal)); // -500
```

### 示例2：HTTP 状态码

```csharp
string GetHttpMessage(int statusCode)
{
    return statusCode switch
    {
        200 => "OK",
        201 => "Created",
        204 => "No Content",
        400 => "Bad Request",
        401 or 403 => "Authentication/Authorization Error",
        404 => "Not Found",
        >= 500 => "Server Error",
        _ => "Unknown"
    };
}
```

### 示例3：JSON 类型处理

```csharp
object jsonValue = "hello";

var type = jsonValue switch
{
    null => "null",
    bool b => $"boolean: {b}",
    int i or long l => $"integer: {i}",
    double d => $"number: {d}",
    string s => $"string: {s}",
    Array a => $"array with {a.Length} elements",
    _ => "object"
};
```

### 示例4：命令解析

```csharp
string ExecuteCommand(string[] args)
{
    return args switch
    {
        ["help"] => "显示帮助",
        ["version"] => "显示版本",
        ["run", var name] => $"运行: {name}",
        ["run", var name, var arg] => $"运行: {name} 参数: {arg}",
        ["exit"] => "退出程序",
        _ => "未知命令"
    };
}
```

---

## 性能考虑

### 模式匹配的性能

```csharp
// 好的做法：先检查简单条件
if (value is null) return;

// 好的做法：按可能性排序
return statusCode switch
{
    200 => "OK",        // 最常见的情况放前面
    404 => "Not Found",
    _ => "Other"
};
```

### 避免过度使用

```csharp
// ❌ 过度复杂
return obj switch
{
    { Prop1: > 0, Prop2: < 10, Prop3: not null } => ...
};

// ✅ 简单明了
if (obj.Prop1 <= 0 || obj.Prop2 >= 10 || obj.Prop3 is null)
{
    return something;
}
return somethingElse;
```

---

## 常见错误

### 1. 模式顺序错误

```csharp
// ❌ 错误：default 放前面会匹配所有
return value switch
{
    _ => "default",
    1 => "one"  // 永远不执行
};

// ✅ 正确：default 放最后
return value switch
{
    1 => "one",
    _ => "default"
};
```

### 2. 遗漏可能值

```csharp
// ❌ 警告：可能有值未处理
return day switch
{
    1 => "周一",
    2 => "周二",
    // 缺少其他情况
};

// ✅ 正确：添加 default
return day switch
{
    1 => "周一",
    2 => "周二",
    _ => "其他"
};
```

### 3. 类型模式类型错误

```csharp
object value = "42";

// ❌ 错误：类型不匹配
if (value is int n && n > 0)  // value 是 string，无法匹配 int
{
    // ...
}

// ✅ 正确：先转换类型
if (value is string s && int.TryParse(s, out int n) && n > 0)
{
    // ...
}
```

---

## 版本历史

| C# 版本 | 新增模式 |
|---------|---------|
| C# 7.0 | 类型模式、var 模式 |
| C# 8.0 | switch 表达式、元组模式 |
| C# 9.0 | 关系模式、逻辑模式 not/and/or |
| C# 10 | 嵌套属性模式 |
| C# 11 | 带属性的记录类型模式 |

---

## 总结

| 模式 | 语法 | 示例 |
|------|------|------|
| **常量模式** | 文字值 | `case 1:` |
| **类型模式** | `type name` | `case string s:` |
| **关系模式** | `< > <= >=` | `case > 0:` |
| **逻辑模式** | `and or not` | `case > 0 and < 10:` |
| **属性模式** | `{ Property: value }` | `case { Name: "A" }:` |
| **元组模式** | `(a, b)` | `case (1, 2):` |
| **var 模式** | `var name` | `case var x:` |

---

## 相关资源

- [C# 模式匹配](https://learn.microsoft.com/zh-cn/dotnet/csharp/fundamentals/functional/pattern-matching)
- [模式匹配教程](https://learn.microsoft.com/zh-cn/dotnet/csharp/tour-of-csharp/tutorials/pattern-matching)
- [探索模式教程](https://learn.microsoft.com/zh-cn/dotnet/csharp/tutorials/patterns-objects)
