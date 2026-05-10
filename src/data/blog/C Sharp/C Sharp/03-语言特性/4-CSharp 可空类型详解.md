---
title: C# 可空类型详解
author: Joekma
pubDatetime: 2026-05-07T00:00:00.000+08:00
modDatetime: 2026-05-07T00:00:00.000+08:00
slug: csharp-nullable-types
description: '深入学习 C# 可空类型，掌握可空值类型、空合并运算符、空条件运算符、可空引用类型等核心概念。'
tags:
  - C#
  - 可空类型
  - Nullable
  - "null"
  - 空合并
  - 空条件运算符
draft: false
series: csharp
language: zh-CN
---

## 概述

在 C# 中，值类型不能为 null，但实际编程中我们经常需要表示「无值」的状态。可空类型允许值类型也表示 null，从而处理那些「可能没有值」的情况。

### 核心概念

| 概念 | 说明 |
|------|------|
| **可空值类型** | 在值类型后加 `?`，如 `int?` |
| **null** | 表示「无值」或「不存在」 |
| **空合并运算符** | `??` 提供默认值 |
| **空条件运算符** | `?.` 安全地访问成员 |
| **可空引用类型** | C# 8.0+ 特性 |

---

## 可空值类型基础

### 声明可空类型

```csharp
// 基本语法：类型 + ?
int? age = null;
double? price = 9.99;
bool? isActive = true;

// 普通值类型
int normalInt = 0;      // 不能为 null
int? nullableInt = null; // 可以为 null
```

### 判断是否有值

```csharp
int? score = null;

// 使用 HasValue 属性
if (score.HasValue)
{
    Console.WriteLine($"分数: {score.Value}");
}
else
{
    Console.WriteLine("没有分数数据");
}

// 或者使用 != null
if (score != null)
{
    int value = score.Value;
}
```

### 获取值或默认值

```csharp
int? count = null;

// GetValueOrDefault - 获取值或类型默认值
int result1 = count.GetValueOrDefault();  // 0

int result2 = count.GetValueOrDefault(100);  // 100

// 直接访问 Value（可能抛出异常）
try
{
    int value = count.Value;
}
catch (InvalidOperationException ex)
{
    Console.WriteLine("可空类型没有值");
}
```

---

## 空合并运算符

### `??` 运算符

当左侧操作数为 null 时，返回右侧的值：

```csharp
int? score = null;
int result = score ?? 0;  // result = 0

score = 85;
result = score ?? 0;  // result = 85
```

### 链式使用

```csharp
int? a = null;
int? b = null;
int? c = 50;

int result = a ?? b ?? c ?? 0;  // result = 50
```

### 常见场景

```csharp
// 字符串处理
string? name = null;
string displayName = name ?? "匿名用户";

// 方法返回值
string? GetNickname() => null;
string nickname = GetNickname() ?? "访客";

// 配置读取
int timeout = GetConfig() ?? 30;
```

---

## 空条件运算符

### `?.` 运算符

安全地访问可能为 null 的成员：

```csharp
string? name = null;

// 错误：会抛出 NullReferenceException   
int len = name.Length;

// 正确：返回 null 而不是抛异常
int? len = name?.Length;  // len = null

// 如果有值才访问
if (name?.Length > 0)
{
    Console.WriteLine($"名字长度为 {name.Length}");
}
```

### 链式调用

```csharp
Person? person = GetPerson();

string? city = person?.Address?.City;

string? street = person?.Address?.Street ?? "未知地址";
```

### 与空合并结合

```csharp
string? name = null;

int length = name?.Length ?? 0;  // length = 0

name = "Alice";
length = name?.Length ?? 0;  // length = 5
```

---

## 空条件与索引器

### 数组和列表

```csharp
string[]? names = null;

// 安全访问
string? first = names?[0];

// 普通访问会抛异常
try
{
    string test = names[0];  // NullReferenceException
}
catch (Exception ex)
{
    Console.WriteLine("数组为 null");
}
```

### 字典访问

```csharp
Dictionary<string, int>? ages = null;

int? aliceAge = ages?["Alice"];  // null（字典为 null）
int? bobAge = ages?["Bob"];      // null（键不存在）

ages = new Dictionary<string, int> { { "Alice", 25 } };
aliceAge = ages?["Alice"];  // 25
bobAge = ages?["Bob"];      // null（键不存在）
```

---

## 可空值类型的运算

### 算术运算

```csharp
int? a = 5;
int? b = 3;

int? sum = a + b;      // 8
int? product = a * b;  // 15

a = null;
b = 10;

sum = a + b;           // null（任一操作数为 null）
product = a * b;       // null
```

### 比较运算

```csharp
int? x = 5;
int? y = null;

bool result1 = x == 5;    // true
bool result2 = x == null; // false
bool result3 = y == null; // true

// 使用 ? 比较
bool result4 = x > 3;     // true
bool result5 = y > 3;     // false（无法与 null 比较）
```

### 显式转换

```csharp
int? nullableInt = 42;

// 显式转换到普通 int（可能抛出异常）
int normalInt = (int)nullableInt;

// 安全转换
int? maybeNull = GetValue();
int safeInt = maybeNull ?? 0;
```

---

## 可空引用类型

### C# 8.0 可空上下文

在项目文件中启用可空引用类型：

```xml
<PropertyGroup>
  <Nullable>enable</Nullable>
</PropertyGroup>
```

### 启用后的行为

```csharp
// 可空引用类型
string? nullableString = null;  // 合法
string normalString = null;     // 警告！可能为 null

// 启用可空分析后，编译器会检查 null 用法
void ProcessName(string? name)
{
    // name 可能为 null，需要处理
    if (name != null)
    {
        Console.WriteLine(name.ToUpper());
    }
}
```

### null-forgiving 运算符

`!` 告诉编译器你知道这个值不为 null：

```csharp
string? input = GetInput();

// 绕过可空警告（谨慎使用）
string definitelyNotNull = input!;
```

### 可空上下文中控制 null 性

| 语法 | 含义 |
|------|------|
| `string?` | 可为 null |
| `string` | 不可为 null（根据上下文） |
| `string!` | 强制认为不为 null |

---

## 实际应用场景

### 数据库映射

```csharp
public class Product
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public decimal? Price { get; set; }  // 价格可能未知
    public DateTime? DiscontinuedDate { get; set; }  // 可能未停产
}
```

### 用户输入

```csharp
int? userInput = ReadUserInput();

if (userInput.HasValue)
{
    ProcessOrder(userInput.Value);
}
else
{
    Console.WriteLine("请输入有效的订单数量");
}
```

### 配置选项

```csharp
class AppConfig
{
    public string? LogDirectory { get; set; }
    public int? MaxRetryCount { get; set; }
    public bool? EnableDebugMode { get; set; }
    
    public int GetRetryCount() => MaxRetryCount ?? 3;
    public string GetLogPath() => LogDirectory ?? "./logs";
}
```

---

## 可空类型的模式匹配

### is 模式

```csharp
object? value = "Hello";

if (value is string s)
{
    Console.WriteLine($"字符串内容: {s}");
}

int? number = 42;
if (number is int n)
{
    Console.WriteLine($"整数: {n}");
}
```

### switch 表达式

```csharp
string? GetMonthName(int? month)
{
    return month switch
    {
        1 => "一月",
        2 => "二月",
        // ...
        null => "月份未知",
        _ => "无效月份"
    };
}
```

---

## 最佳实践

### 应该做的事情

| 实践 | 说明 |
|------|------|
| **明确意图** | 使用 `?` 清楚表示值可能为空 |
| **提供默认值** | 使用 `??` 提供合理的默认值 |
| **安全访问** | 使用 `?.` 避免 NullReferenceException |
| **检查后再用** | 先判断 HasValue 再访问 Value |

### 不应该做的事情

| 反模式 | 说明 |
|--------|------|
| **滥用可空类型** | 如果值永远不为 null，就不要用 `?` |
| **忽略 null 检查** | 不检查就直接访问 Value |
| **过度使用 `!`** | 使用 null-forgiving 会隐藏潜在问题 |
| **可空用于可选参数** | 应该用方法重载或可选参数 |

### 代码示例

```csharp
// 错误：忽略 null 检查
int? count = GetCount();
int result = count.Value;  // 可能抛异常

// 正确：检查后使用
int? count = GetCount();
int result = count ?? 0;

// 最佳：链式安全调用
string city = person?.Address?.City ?? "未知";
```

---

## 总结

可空类型是 C# 中处理「无值」状态的重要工具：

1. **可空值类型** - `int?`、`double?` 等允许值为 null
2. **空合并运算符** - `??` 提供默认值
3. **空条件运算符** - `?.` 安全访问成员
4. **可空引用类型** - C# 8.0+ 的现代 null 处理
5. **模式匹配** - 结合 `is` 和 `switch` 处理可空类型

掌握这些技巧让你的代码更安全，避免 null 相关异常。