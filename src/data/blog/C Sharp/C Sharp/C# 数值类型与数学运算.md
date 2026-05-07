---
title: C# 数值类型与数学运算
author: Joekma
pubDatetime: 2026-05-06T00:00:00.000+08:00
modDatetime: 2026-05-06T00:00:00.000+08:00
slug: csharp-numbers-and-math
description: '深入学习 C# 中的数值类型，包括整数、浮点数、十进制数，以及基本数学运算和运算符优先级。'
tags:
  - C#
  - 数值类型
  - 数学运算
  - int
  - double
  - decimal
  - 编程基础
draft: false
language: zh-CN
---

## 概述

C# 提供了丰富的数值类型来满足不同的计算需求。本教程将详细介绍整数、浮点数和十进制数的使用，以及数学运算的基本规则。

### 数值类型概览

| 类型 | 说明 | 范围 | 精度 |
|------|------|------|------|
| `int` | 32位整数 | ±21亿 | 精确 |
| `double` | 双精度浮点数 | ±10³⁰⁸ | 近似 |
| `decimal` | 十进制数 | ±7.9×10²⁸ | 精确 |

---

## 整数运算

### 基本数学运算

```csharp
int a = 18;
int b = 6;

// 加法
int c = a + b;
Console.WriteLine(c);  // 24

// 减法
c = a - b;
Console.WriteLine(c);  // 12

// 乘法
c = a * b;
Console.WriteLine(c);  // 108

// 除法
c = a / b;
Console.WriteLine(c);  // 3
```

**运算符一览：**

| 运算符 | 说明 | 示例 |
|--------|------|------|
| `+` | 加法 | `5 + 3 = 8` |
| `-` | 减法 | `5 - 3 = 2` |
| `*` | 乘法 | `5 * 3 = 15` |
| `/` | 除法 | `15 / 3 = 5` |

### 取余运算

使用 `%` 运算符获取除法的余数：

```csharp
int a = 7;
int b = 4;
int quotient = a / b;      // 1
int remainder = a % b;    // 3

Console.WriteLine($"商: {quotient}, 余数: {remainder}");
```

**典型应用：**

- 判断奇偶性：`number % 2 == 0`
- 判断整除：`number % 3 == 0`
- 循环计数

---

## 运算符优先级

数学运算遵循标准优先级规则：

### 优先级规则

1. **括号** `()` 最高
2. **乘除** `* / %`
3. **加减** `+ -` 最低

### 示例

```csharp
int a = 5;
int b = 4;
int c = 2;
int d = a + b * c;
Console.WriteLine(d);  // 13 (先算乘法)
```

使用括号改变优先级：

```csharp
d = (a + b) * c;
Console.WriteLine(d);  // 18 (先算加法)
```

### 复杂表达式

```csharp
int result = (a + b) - 6 * c + (12 * 4) / 3 + 12;
Console.WriteLine(result);
```

---

## 整数精度与限制

### int 类型的范围

```csharp
int max = int.MaxValue;
int min = int.MinValue;

Console.WriteLine($"整数范围: {min} 到 {max}");
```

**输出：**

```
整数范围: -2147483648 到 2147483647
```

### 溢出问题

当计算结果超出范围时，会发生**溢出**：

```csharp
int max = int.MaxValue;
int overflow = max + 3;
Console.WriteLine($"溢出示例: {overflow}");
```

**输出：**

```
溢出示例: -2147483646
```

整数溢出会"环绕"，从最大值跳到最小值。

---

## 双精度浮点数

### double 类型

`double` 用于处理带小数点的数字：

```csharp
double a = 5;
double b = 4;
double c = 2;
double d = (a + b) / c;
Console.WriteLine(d);  // 4.5
```

### double 的范围

```csharp
double max = double.MaxValue;
double min = double.MinValue;

Console.WriteLine($"double 范围: {min} 到 {max}");
```

### 精度问题

`double` 存在舍入误差：

```csharp
double one = 1.0;
double three = 3.0;
double result = one / three;

Console.WriteLine(result);  // 0.3333333333333333
```

这是因为 `1/3` 是无限循环小数，无法精确表示。

---

## 十进制类型

### decimal 类型

`decimal` 提供更高的精度，适合金融计算：

```csharp
decimal min = decimal.MinValue;
decimal max = decimal.MaxValue;

Console.WriteLine($"decimal 范围: {min} 到 {max}");
```

### decimal vs double

```csharp
double a = 1.0;
double b = 3.0;
Console.WriteLine($"double: {a / b}");  // 0.33333333333333331

decimal c = 1.0M;
decimal d = 3.0M;
Console.WriteLine($"decimal: {c / d}");  // 0.3333333333333333333333333333
```

**注意：** `M` 后缀表示 `decimal` 类型常量。

### 应用场景

| 类型 | 适用场景 | 示例 |
|------|---------|------|
| `int` | 整数计数、循环 | 数组索引、年龄 |
| `double` | 科学计算、物理 | 坐标、速度 |
| `decimal` | 金融计算、货币 | 金额、利率 |

---

## Math 类

`System.Math` 类提供丰富的数学函数：

### 常用常量

```csharp
Console.WriteLine(Math.PI);    // 3.141592653589793
Console.WriteLine(Math.E);     // 2.718281828459045
```

### 常用方法

```csharp
// 绝对值
Console.WriteLine(Math.Abs(-10));  // 10

// 平方根
Console.WriteLine(Math.Sqrt(16));   // 4

// 幂运算
Console.WriteLine(Math.Pow(2, 3)); // 8

// 最大值/最小值
Console.WriteLine(Math.Max(5, 3));  // 5
Console.WriteLine(Math.Min(5, 3));  // 3

// 四舍五入
Console.WriteLine(Math.Round(3.7)); // 4
Console.WriteLine(Math.Floor(3.9)); // 3
Console.WriteLine(Math.Ceiling(3.1)); // 4
```

---

## 实用示例

### 计算圆的面积

```csharp
double radius = 2.50;
double area = Math.PI * radius * radius;
Console.WriteLine($"圆的面积: {area}");
```

**输出：**

```
圆的面积: 19.6349540849362
```

### 斐波那契数列

```csharp
int a = 1;
int b = 1;

Console.WriteLine($"第1项: {a}");
Console.WriteLine($"第2项: {b}");

for (int i = 3; i <= 10; i++)
{
    int c = a + b;
    Console.WriteLine($"第{i}项: {c}");
    a = b;
    b = c;
}
```

### 华氏度转摄氏度

```csharp
double fahrenheit = 98.6;
double celsius = (fahrenheit - 32) * 5 / 9;
Console.WriteLine($"{fahrenheit}°F = {celsius}°C");
```

---

## 类型转换

### 隐式转换

小类型自动转换为大类型：

```csharp
int i = 100;
double d = i;  // 自动转换
Console.WriteLine(d);  // 100
```

### 显式转换（强制转换）

大类型转换小类型需要显式转换：

```csharp
double d = 99.9;
int i = (int)d;  // 丢失小数部分
Console.WriteLine(i);  // 99
```

### Convert 类

```csharp
string str = "123";
int num = Convert.ToInt32(str);

double d = 3.14;
int i = Convert.ToInt32(d);  // 四舍五入
```

---

## 常见错误

### 整数除法

```csharp
int a = 5;
int b = 2;
Console.WriteLine(a / b);  // 2，不是 2.5！
```

**解决方案：** 至少有一个操作数使用 double 或 decimal。

```csharp
Console.WriteLine((double)a / b);  // 2.5
```

### 溢出检测

使用 `checked` 关键字检测溢出：

```csharp
int max = int.MaxValue;
checked
{
    int overflow = max + 1;  // 抛出 OverflowException
}
```

---

## 总结

| 概念 | 说明 |
|------|------|
| **运算符优先级** | 括号 > 乘除 > 加减 |
| **int** | 整数，精确，范围 ±21亿 |
| **double** | 浮点数，范围大，有舍入误差 |
| **decimal** | 十进制，精确，适合金融 |
| **溢出** | 超出范围会环绕 |

---

## 相关资源

- [整型数值类型](https://learn.microsoft.com/zh-cn/dotnet/csharp/language-reference/builtin-types/integral-numeric-types)
- [浮点数值类型](https://learn.microsoft.com/zh-cn/dotnet/csharp/language-reference/builtin-types/floating-point-numeric-types)
- [数值类型教程](https://learn.microsoft.com/zh-cn/dotnet/csharp/tour-of-csharp/tutorials/numbers-in-csharp)
