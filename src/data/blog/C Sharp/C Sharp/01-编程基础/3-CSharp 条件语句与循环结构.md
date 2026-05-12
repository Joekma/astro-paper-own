---
title: C# 条件语句与循环结构
author: Joekma
pubDatetime: 2026-05-06T00:00:00.000+08:00
modDatetime: 2026-05-06T00:00:00.000+08:00
slug: csharp-branches-and-loops
description: "学习 C# 中的条件语句（if/else、switch）和循环结构（while、do-while、for、foreach），掌握程序控制流的核心概念。"
tags:
  - C#
  - 条件语句
  - if
  - else
  - switch
  - 循环
  - while
  - for
  - foreach
draft: false
series: csharp
language: zh-CN
---

## 概述

程序的核心能力之一是根据不同条件做出决策并重复执行代码。本文将详细介绍 C# 中的条件语句和循环结构。

### 概念速览

| 结构类型     | 用途                 | 关键字                          |
| ------------ | -------------------- | ------------------------------- |
| **条件语句** | 根据条件选择执行路径 | `if`、`else`、`switch`          |
| **循环语句** | 重复执行代码块       | `while`、`do`、`for`、`foreach` |

---

## 布尔类型

在深入学习条件语句之前，先了解布尔类型。

### bool 类型

布尔类型只有两个值：`true`（真）和 `false`（假）。

```csharp
bool isActive = true;
bool hasPermission = false;

Console.WriteLine($"isActive: {isActive}");
Console.WriteLine($"hasPermission: {hasPermission}");
```

### 关系运算符

| 运算符 | 说明     | 示例              |
| ------ | -------- | ----------------- |
| `==`   | 等于     | `5 == 5` → `true` |
| `!=`   | 不等于   | `5 != 3` → `true` |
| `>`    | 大于     | `5 > 3` → `true`  |
| `<`    | 小于     | `3 < 5` → `true`  |
| `>=`   | 大于等于 | `5 >= 5` → `true` |
| `<=`   | 小于等于 | `3 <= 5` → `true` |

### 逻辑运算符

| 运算符 | 说明   | 示例                       |
| ------ | ------ | -------------------------- |
| `&&`   | 逻辑与 | `true && false` → `false`  |
| `\|\|` | 逻辑或 | `true \|\| false` → `true` |
| `!`    | 逻辑非 | `!true` → `false`          |

---

## if 语句

### 基本语法

`if` 语句根据布尔条件决定是否执行代码：

```csharp
int a = 5;
int b = 6;

if (a + b > 10)
{
    Console.WriteLine("答案大于10");
}
```

### 单行语句（可省略大括号）

如果 `if` 体内只有一条语句，可以省略大括号：

```csharp
if (a > b)
    Console.WriteLine("a 大于 b");
```

**建议：** 始终使用大括号，提高代码可读性。

---

## if-else 语句

`else` 分支在条件为 `false` 时执行：

```csharp
int a = 5;
int b = 3;

if (a + b > 10)
{
    Console.WriteLine("答案大于10");
}
else
{
    Console.WriteLine("答案不大于10");
}
```

---

## else-if 链

使用 `else if` 处理多个条件：

```csharp
int score = 85;

if (score >= 90)
{
    Console.WriteLine("优秀");
}
else if (score >= 80)
{
    Console.WriteLine("良好");
}
else if (score >= 60)
{
    Console.WriteLine("及格");
}
else
{
    Console.WriteLine("不及格");
}
```

---

## 逻辑运算符组合条件

### &&（与）

所有条件都为 `true` 时才执行：

```csharp
int a = 5;
int b = 3;
int c = 4;

if ((a + b + c > 10) && (a == b))
{
    Console.WriteLine("两个条件都满足");
}
else
{
    Console.WriteLine("至少一个条件不满足");
}
```

### ||（或）

任一条件为 `true` 时就执行：

```csharp
if ((a + b + c > 10) || (a > b))
{
    Console.WriteLine("至少一个条件满足");
}
```

### !（非）

取反布尔值：

```csharp
bool isLoggedIn = false;

if (!isLoggedIn)
{
    Console.WriteLine("请先登录");
}
```

---

## switch 语句

`switch` 用于多值分支判断：

### 基本语法

```csharp
int day = 3;

switch (day)
{
    case 1:
        Console.WriteLine("星期一");
        break; // 必须要有，防止贯穿
    case 2:
        Console.WriteLine("星期二");
        break;
    case 3:
        Console.WriteLine("星期三");
        break;
    default:
        Console.WriteLine("未知日期");
        break;
}
```

### Switch 语句的重要规则

- 每个 `case` 分支必须以 `break` 结束，除非是最后一个 `case`。
- 如果没有 `break`，会继续执行下一个 `case` 分支，直到遇到 `break` 或 `default`。

```csharp
// 允许的跳转语句
switch (value)
{
    case 1:
        Console.WriteLine("A");
        break;        // 最常见的
    case 2:
        Console.WriteLine("B");
        return;       // 在方法中使用
    case 3:
        Console.WriteLine("C");
        goto case 4;  // 跳转到其他 case
    case 4:
        Console.WriteLine("D");
        goto default; // 跳转到 default
    default:
        Console.WriteLine("Default");
        break;
}
```

- 允许空 case 贯穿

```csharp
int score = 85;

switch (score / 10)
{
    case 10:
    case 9:  // 两个 case 共享相同代码
        Console.WriteLine("A");
        break;
    case 8:
        Console.WriteLine("B");
        break;
    case 7:
        Console.WriteLine("C");
        break;
    default:
        Console.WriteLine("D 或以下");
        break;
}
```

### switch 表达式（C# 8.0+）

更简洁的语法：

```csharp
string dayName = day switch
{
    1 => "星期一",
    2 => "星期二",
    3 => "星期三",
    _ => "未知日期"
};

Console.WriteLine(dayName);
```

---

## while 循环

`while` 在条件为 `true` 时重复执行：

### 基本语法

```csharp
int counter = 0;

while (counter < 5)
{
    Console.WriteLine($"计数器: {counter}");
    counter++;
}
```

### 执行流程

```
开始
  ↓
条件判断 → false → 结束
  ↓ true
执行循环体
  ↓
回到条件判断
```

### 注意事项

**避免无限循环：**

```csharp
// 错误：counter 永远是 0
while (counter < 5)
{
    Console.WriteLine(counter);
    // 忘记 counter++
}

// 正确：确保条件最终变为 false
while (counter < 5)
{
    Console.WriteLine(counter);
    counter++;
}
```

---

## do-while 循环

`do-while` 先执行后判断，保证循环体至少执行一次：

```csharp
int counter = 0;

do
{
    Console.WriteLine($"计数器: {counter}");
    counter++;
} while (counter < 5);
```

### while vs do-while

| 特性         | while  | do-while |
| ------------ | ------ | -------- |
| 首次判断时机 | 循环前 | 循环后   |
| 最少执行次数 | 0次    | 1次      |

---

## for 循环

`for` 循环适合已知循环次数的场景：

### 基本语法

```csharp
for (int i = 0; i < 5; i++)
{
    Console.WriteLine($"计数器: {i}");
}
```

**三个组成部分：**

| 部分       | 说明           | 示例        |
| ---------- | -------------- | ----------- |
| **初始值** | 循环变量初始化 | `int i = 0` |
| **条件**   | 循环继续的条件 | `i < 5`     |
| **迭代**   | 每次循环后执行 | `i++`       |

### for 循环的三个部分

```csharp
// 初始值部分
for (int i = 0; ...)  // 只执行一次

// 条件部分
for (...; i < 5; ...)  // 每次循环前判断

// 迭代部分
for (...; ...; i++)  // 每次循环后执行
```

### 常见模式

```csharp
// 从1到10
for (int i = 1; i <= 10; i++)

// 从10到1（倒序）
for (int i = 10; i >= 1; i--)

// 跳过偶数
for (int i = 0; i < 10; i += 2)

// 累加
int sum = 0;
for (int i = 1; i <= 100; i++)
{
    sum += i;
}
```

---

## foreach 循环

`foreach` 遍历集合中的每个元素：

### 基本语法

```csharp
string[] names = { "Alice", "Bob", "Charlie" };

foreach (string name in names)
{
    Console.WriteLine($"Hello {name}");
}
```

### 与 for 的对比

```csharp
string[] names = { "Alice", "Bob", "Charlie" };

// for 循环
for (int i = 0; i < names.Length; i++)
{
    Console.WriteLine(names[i]);
}

// foreach 循环（更简洁）
foreach (string name in names)
{
    Console.WriteLine(name);
}
```

**何时使用：**

| 循环类型  | 适用场景                 |
| --------- | ------------------------ |
| `for`     | 需要索引、跳步、倒序     |
| `foreach` | 遍历所有元素、不需要索引 |

---

## 嵌套循环

循环内部可以包含另一个循环：

### 示例：九九乘法表

```csharp
for (int i = 1; i <= 9; i++)
{
    for (int j = 1; j <= 9; j++)
    {
        Console.WriteLine($"{i} × {j} = {i * j}");
    }
}
```

### 示例：打印星号

```csharp
for (int row = 1; row <= 5; row++)
{
    for (int col = 1; col <= row; col++)
    {
        Console.Write("*");
    }
    Console.WriteLine();
}
```

**输出：**

```
*
**
***
****
*****
```

---

## 循环控制

### break - 跳出循环

```csharp
for (int i = 0; i < 10; i++)
{
    if (i == 5)
    {
        break;  // 跳出整个循环
    }
    Console.WriteLine(i);
}
// 输出: 0, 1, 2, 3, 4
```

### continue - 跳过当前迭代

```csharp
for (int i = 0; i < 5; i++)
{
    if (i == 2)
    {
        continue;  // 跳过本次循环，继续下次
    }
    Console.WriteLine(i);
}
// 输出: 0, 1, 3, 4
```

---

## 实用示例

### 示例1：求和

计算1到100的和：

```csharp
int sum = 0;
for (int i = 1; i <= 100; i++)
{
    sum += i;
}
Console.WriteLine($"1到100的和: {sum}");
```

### 示例2：查找最大值

```csharp
int[] numbers = { 5, 3, 9, 1, 7 };
int max = numbers[0];

foreach (int num in numbers)
{
    if (num > max)
    {
        max = num;
    }
}
Console.WriteLine($"最大值: {max}");
```

### 示例3：斐波那契数列

```csharp
int n1 = 1, n2 = 1;
Console.WriteLine($"第1项: {n1}");
Console.WriteLine($"第2项: {n2}");

for (int i = 3; i <= 10; i++)
{
    int n3 = n1 + n2;
    Console.WriteLine($"第{i}项: {n3}");
    n1 = n2;
    n2 = n3;
}
```

### 示例4：质数判断

```csharp
int number = 17;
bool isPrime = true;

for (int i = 2; i <= Math.Sqrt(number); i++)
{
    if (number % i == 0)
    {
        isPrime = false;
        break;
    }
}

Console.WriteLine($"{number} 是 {(isPrime ? "质数" : "合数")}");
```

---

## 常见错误

### 1. 循环条件错误

```csharp
// ❌ 错误：死循环
int i = 0;
while (i < 10)
{
    Console.WriteLine(i);
    // 忘记 i++
}

// ✅ 正确
while (i < 10)
{
    Console.WriteLine(i);
    i++;
}
```

### 2. 分号错误

```csharp
// ❌ 错误：循环体不是预期内容
for (int i = 0; i < 5; i++);
{
    Console.WriteLine("这会执行5次吗？");
}

// ✅ 正确
for (int i = 0; i < 5; i++)
{
    Console.WriteLine("这会执行5次");
}
```

### 3. 浮点数比较

```csharp
// ❌ 错误：浮点数有精度问题
double x = 0.1 + 0.2;
if (x == 0.3)  // 可能为 false
{
    Console.WriteLine("相等");
}

// ✅ 正确：使用容差
if (Math.Abs(x - 0.3) < 0.0001)
{
    Console.WriteLine("近似相等");
}
```

---

## 总结

| 结构       | 说明         |
| ---------- | ------------ |
| `if`       | 单条件判断   |
| `if-else`  | 双向分支     |
| `else if`  | 多条件分支   |
| `switch`   | 多值匹配     |
| `while`    | 先判断后执行 |
| `do-while` | 先执行后判断 |
| `for`      | 已知循环次数 |
| `foreach`  | 遍历集合     |
| `break`    | 跳出循环     |
| `continue` | 跳过当前迭代 |

---

## 相关资源

- [选择语句](https://learn.microsoft.com/zh-cn/dotnet/csharp/language-reference/statements/selection-statements)
- [迭代语句](https://learn.microsoft.com/zh-cn/dotnet/csharp/language-reference/statements/iteration-statements)
- [分支和循环教程](https://learn.microsoft.com/zh-cn/dotnet/csharp/tour-of-csharp/tutorials/branches-and-loops)
