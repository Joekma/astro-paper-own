---
title: C# 特殊运算符与符号详解
author: Joekma
pubDatetime: 2026-05-12T00:00:00.000+08:00
modDatetime: 2026-05-12T00:00:00.000+08:00
slug: csharp-operators
description: "详解 C# 中的特殊运算符与符号，包括 Lambda、空条件、空合并、范围、位运算、字符串插值等运算符的含义与用法。"
tags:
  - C#
  - 运算符
  - 特殊符号
  - 编程基础
draft: false
series: csharp
language: zh-CN
---

## 概述

C# 中的运算符和特殊符号是语法的基础构件。本文系统介绍各类运算符的含义、用法和注意事项。

---

## => - Lambda 与表达式体成员

箭头运算符 `=>` 用于两种场景：Lambda 表达式和表达式体成员。

```csharp
// 1. Lambda 表达式：创建匿名函数
Func<int, int, int> add = (a, b) => a + b;
Action<string> print = message => Console.WriteLine(message);

// 带代码块的 Lambda
Func<int, int> square = n => {
    int result = n * n;
    return result;
};

// 2. 表达式体成员（C# 6+）：简写方法/属性
public class Calculator
{
    // 表达式体属性
    public string Name => "Calculator";

    // 表达式体方法
    public int Add(int a, int b) => a + b;

    // 表达式体构造函数
    public Calculator(string name) => Name = name;
}
```

---

## ?. / ?[] - 空条件运算符

在访问成员或索引前自动检查 null，避免 NullReferenceException：

```csharp
string? name = null;

// ?. 在对象为 null 时返回 null，不会抛出异常
int? length = name?.Length;  // length = null

// ?. 配合 ?? 使用，提供默认值
int len = name?.Length ?? 0;  // len = 0

// ?[] 用于数组或集合的安全索引访问
string[]? words = null;
string? first = words?[0];  // null，不会抛异常

// 链式使用
string? city = person?.Address?.City;

// ?.Invoke 安全调用委托（委托为 null 时不抛异常）
EventHandler? handler = Clicked;
handler?.Invoke(this, EventArgs.Empty);
```

---

## ! - 空条件抑制运算符

告诉编译器此值为非 null（用于 nullable 引用类型）：

```csharp
string? input = null;

// ! 断言 input 不为 null，抑制可空警告
// 谨慎使用！若实际为 null，后续代码可能抛 NullReferenceException
string nonNull = input!;

// 常见场景：已知初始化但类型系统无法推断的情况
public string GetName()
{
    // _name 是 readonly 字段，构造函数保证已赋值
    return _name!;
}

// LinkedList 场景（节点值已知非空）
var first = linkedList.First!;
```

---

## ?? / ??= - 空合并运算符

为空时提供默认值或执行赋值：

```csharp
string? name = null;

// ?? 左侧为 null 时返回右侧值
string display = name ?? "匿名用户";  // "匿名用户"

// ?? 可以链式使用
string result = name ?? settings?.DefaultName ?? "访客";

// ??= 复合赋值：仅在左侧为 null 时赋值
string? userName = null;
userName ??= "Guest";  // userName = "Guest"
userName ??= "Alice";  // 不变，仍为 "Guest"

// 等价于
if (userName == null)
{
    userName = "Guest";
}
```

---

## ?: - 条件运算符（三元运算符）

根据条件选择两个值之一：

```csharp
// condition ? valueIfTrue : valueIfFalse
int age = 20;
string status = age >= 18 ? "成年人" : "未成年人";

// 嵌套使用（避免过多嵌套，优先用 if）
string grade = score switch
{
    >= 90 => "A",
    >= 80 => "B",
    _ => "C"
};

// 配合 ?? 使用
string message = name ?? (age >= 18 ? "成年用户" : "未成年用户");
```

---

## .. / ^ - 范围与索引运算符

C# 8.0+ 支持范围切片和倒数索引：

```csharp
int[] numbers = { 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 };

// .. 范围运算符，包含起点不含终点
int[] slice1 = numbers[2..5];    // {2, 3, 4}
int[] slice2 = numbers[3..^1]; // 从索引3到倒数第1个 {3,4,5,6,7,8}

// 省略边界
int[] prefix = numbers[..3];    // 前3个 {0,1,2}
int[] suffix = numbers[7..];    // 从索引7到末尾 {7,8,9}

// ^ 从结尾计算索引（^1 最后一个，^2 倒数第二个）
int last = numbers[^1];      // 9
int secondLast = numbers[^2]; // 8

// 组合使用
int[] middle = numbers[2..^2];  // 排除首尾 {2,3,4,5,6,7}

// 范围变量（C# 8.0+）
Range range = 1..5;
int[] sub = numbers[range];  // {1,2,3,4}
```

---

## @ - 逐字字符串与保留字转义

允许使用 C# 保留字作为标识符，或避免转义反斜杠：

```csharp
// 1. 使用保留字作为变量名
class @class
{
    public string @return { get; set; }

    public void @void()
    {
        Console.WriteLine("方法名使用 @");
    }
}

var cls = new @class();
cls.@return = "value";

// 2. 逐字字符串：忽略转义
string path = "C:\\Users\\Name\\Documents";    // 需要双反斜杠
string path2 = @"C:\Users\Name\Documents";    // 单 @ 无需转义

// 3. 多行字符串
string multi = @"
第一行
第二行
";

// 4. 嵌入双引号："" 表示单个 "
string quote = @"他说:""你好""";  // 他说:"你好"
```

---

## :: - 命名空间别名限定符

访问命名空间别名，优先级高于全局 using：

- :: 会强制在其左侧查找命名空间或类型别名，不会查找普通类或变量
- 即使有同名的局部变量或类型，:: 仍会正确找到别名

```csharp
// 定义别名
using Win = System.Windows.Forms;
using Col = System.Collections.Generic;

// 使用别名（:: 确保不会与同名的类型/变量混淆）
var list = new Col::List<string>();
var form = new Win::Form();



// global:: 始终指向全局命名空间（解决命名冲突）
namespace MyNamespace
{
    class List { }

    void Example()
    {
        var a = new List();           // MyNamespace.List
        var b = new global::System.Collections.Generic.List<int>();  // 全局 List
    }
}
```

---

## $ - 字符串插值

在字符串中嵌入表达式（C# 6+）：

```csharp
string name = "Alice";
int age = 30;

// $ 开头支持在 {} 中嵌入表达式
string greeting = $"Hello, {name}! You are {age} years old.";

// 表达式中可进行计算
string calc = $"{2 + 3}";  // "5"

// 格式化
double price = 123.456;
string formatted = $"{price:F2}";   // "123.46"
string currency = $"{price:C}";     // "¥123.46"（取决于区域设置）

// $@ 组合（逐字 + 插值）
string sql = $@"
SELECT * FROM Users
WHERE Name = '{name}'
AND Age > {age}
";

// $ 和 ?. 结合（安全插值）
string? firstName = null;
string greeting2 = $"Hello, {firstName?.ToUpper() ?? "Guest"}!";  // "Hello, GUEST!"
```

---

## ..= - 区间运算符（C# 9+）

用于 switch 表达式中的区间匹配：

```csharp
int score = 75;

// 区间模式匹配
string grade = score switch
{
    90..100 => "A",
    80..89  => "B",
    70..79  => "C",
    60..69  => "D",
    0..59   => "F",
    _       => "无效"
};

// 适用于 char
char letter = 'm';
string category = letter switch
{
    'a'..'z' => "小写字母",
    'A'..'Z' => "大写字母",
    '0'..'9' => "数字",
    _        => "其他字符"
};
```

---

## & | ^ ~ << >> - 位运算符

对整数类型的位进行操作：

```csharp
int a = 5;   // 0101 (二进制)
int b = 3;   // 0011

int and = a & b;  // 0001 = 1  按位与
int or  = a | b;  // 0111 = 7  按位或
int xor = a ^ b;  // 0110 = 6  按位异或（相同为0，不同为1）
int not = ~a;     // -6  按位取反
int shl = a << 1; // 1010 = 10 左移（乘2）
int shr = a >> 1; // 0010 = 2  右移（除2，取整）

// 常用技巧：位标志位
int flag = 0b0001 | 0b0010 | 0b0100;      // 组合标志位 = 7
bool hasWrite = (flag & 0b0010) != 0;      // 检查权限
int addWrite = flag | 0b1000;              // 添加权限
int removeWrite = flag & ~0b0010;          // 移除权限
```

---

## => ; - 属性简写（init / get / set）

C# 9+ 支持更简洁的属性声明：

```csharp
public class Person
{
    // 自动属性（编译器生成后台字段）
    public string Name { get; set; }

    // init 仅初始化器可设（C# 9+）
    public DateTime CreatedAt { get; init; }

    // readonly（无 set）
    public int Id { get; }

    // init + 私有 set（外部只读，内部可修改）
    public string Status { get; private set; } = "Pending";
}
```

---

## 总结

| 运算符           | 名称                    | C# 版本 |
| ---------------- | ----------------------- | ------- |
| `=>`             | Lambda / 表达式体成员   | C# 6+   |
| `?.` / `?[]`     | 空条件运算符            | C# 6+   |
| `!`              | 空条件抑制运算符        | C# 8+   |
| `??` / `??=`     | 空合并运算符            | C# 2+   |
| `?:`             | 条件运算符              | C# 1.0  |
| `..` / `^`       | 范围与索引              | C# 8+   |
| `@`              | 逐字字符串 / 保留字转义 | C# 1.0  |
| `$`              | 字符串插值              | C# 6+   |
| `::`             | 命名空间别名            | C# 1.0  |
| `..=`            | 区间模式匹配            | C# 9+   |
| `& \| ^ ~ << >>` | 位运算符                | C# 1.0  |

---

## 相关资源

- [C# 运算符与表达式 - Microsoft Learn](https://learn.microsoft.com/zh-cn/dotnet/csharp/language-reference/operators/)
- [可为空引用类型 - Microsoft Learn](https://learn.microsoft.com/zh-cn/dotnet/csharp/language-reference/builtin-types/nullable-reference-types)
