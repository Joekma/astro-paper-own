---
title: "C# 特性（Attributes）详解"
author: Joekma
pubDatetime: 2026-05-13T00:00:00.000+08:00
modDatetime: 2026-05-13T00:00:00.000+08:00
slug: csharp-attributes
description: "深入学习 C# 特性（Attributes）机制，掌握自定义特性、AttributeUsage、反射读取特性以及常见内置特性的使用方法。"
tags:
  - C#
  - 特性
  - Attribute
  - 反射
  - 元数据
draft: false
series: csharp
language: zh-CN
---

## 概述

特性（Attribute）是一种将**元数据或声明性信息**与代码（程序集、类型、方法、属性等）关联的强大机制。将特性应用到程序实体后，可以通过**反射**在运行时查询这些特性。

特性具有以下核心特点：
- 特性向程序添加元数据（元数据是关于程序中定义的类型的信息）
- 特性可以应用于整个程序集、模块，或更小的程序元素（如类和属性）
- 特性可以接受参数，方式与方法和属性相同
- 程序可以使用反射检查自己的元数据或其他程序中的元数据

## 基础语法

### 应用特性

在 C# 中，通过将特性名称放在方括号 `[]` 中，并置于应用该特性的实体声明上方来指定特性：

```csharp
// 使用 SerializableAttribute 将类标记为可序列化
[Serializable]
public class SampleClass
{
    // 该类型的对象可以被序列化
}

// 使用 DllImportAttribute 声明外部方法
[DllImport("user32.dll")]
private static extern void SampleMethod();

// 多个特性可以应用于同一声明
[method: Obsolete]
[Conditional("DEBUG")]
void MethodA() { }

// 特性还可以应用于泛型类型参数
void GenericMethod<[Nullable] T>() { }
```

### 命名约定

按照约定，所有特性名称都以 "Attribute" 后缀结尾，以便与 .NET 库中的其他类型区分。但在代码中使用特性时，**无需指定特性后缀**：

```csharp
// 两者等效
[DllImport("user32.dll")]
[DllImportAttribute("user32.dll")]
```

## 特性参数

### 位置参数与命名参数

特性参数分为两类：

| 参数类型 | 说明 |
|---------|------|
| **位置参数** | 特性构造函数的参数，必须指定且顺序固定 |
| **命名参数** | 特性的公共属性或字段，可选且顺序任意 |

```csharp
// 第一个参数是位置参数，其他是命名参数
[DllImport("user32.dll")]
[DllImport("user32.dll", SetLastError = false, ExactSpelling = false)]
[DllImport("user32.dll", ExactSpelling = false, SetLastError = false)]

// 以上三种写法等效，命名参数默认为 false
```

## 特性目标

特性目标是指特性应用的实体。通过 `target:` 语法可以显式指定：

```csharp
// 默认：应用于方法
[ValidatedContract]
int Method1() { return 0; }

// 显式指定应用于方法
[method: ValidatedContract]
int Method2() { return 0; }

// 应用于参数
int Method3([ValidatedContract] string contract) { return 0; }

// 应用于返回值
[return: ValidatedContract]
int Method4() { return 0; }
```

常见目标值：

| 目标值 | 适用对象 |
|--------|----------|
| `assembly` | 整个程序集 |
| `module` | 当前程序集模块 |
| `field` | 类或结构中的字段 |
| `event` | 事件 |
| `method` | 方法或属性访问器 |
| `param` | 方法参数 |
| `property` | 属性 |
| `return` | 方法返回值 |
| `type` | 结构、类、接口等 |

## 常用内置特性

### [Obsolete] - 标记过时

```csharp
// 标记为过时，编译时显示警告
[Obsolete("请使用 NewMethod 代替", false)]
public void OldMethod()
{
    // ...
}

// 标记为过时，编译时显示错误（阻止编译）
[Obsolete("该方法已弃用，请使用新版", true)]
public void DeprecatedMethod()
{
    // ...
}
```

### [Conditional] - 条件编译

```csharp
// 仅在定义 DEBUG 符号时执行
[Conditional("DEBUG")]
void DebugLog(string message)
{
    Console.WriteLine($"[DEBUG] {message}");
}

// 满足任一条件时执行
[Conditional("DEBUG"), Conditional("TEST1")]
void TraceMethod()
{
    // ...
}
```

### [CallerMemberName] 等 - 调用者信息

```csharp
public void Log(string message,
    [CallerMemberName] string memberName = "",
    [CallerFilePath] string filePath = "",
    [CallerLineNumber] int lineNumber = 0)
{
    // 自动填充调用者信息
    Console.WriteLine($"{filePath}:{lineNumber} in {memberName}");
    Console.WriteLine($"Message: {message}");
}

// 调用时无需传递后三个参数，编译器自动填充
void MyMethod()
{
    Log("Something happened");
    // 输出类似：d:\project\program.cs:10 in MyMethod
}
```

## 自定义特性

### 定义特性类

自定义特性需要继承自 `System.Attribute` 类，并使用 `AttributeUsage` 限制应用范围：

```csharp
// 定义特性类（约定以 Attribute 结尾）
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, 
                AllowMultiple = true, 
                Inherited = false)]
public class CustomInfoAttribute : Attribute
{
    // 位置参数
    public string Description { get; }
    
    // 命名参数
    public string? Author { get; set; }
    public int Version { get; set; }

    // 构造函数（位置参数）
    public CustomInfoAttribute(string description)
    {
        Description = description;
    }
}
```

`AttributeUsage` 参数说明：

| 参数 | 说明 |
|------|------|
| `AttributeTargets` | 指定特性可以应用的目标类型 |
| `AllowMultiple` | 是否允许同一目标多次应用 |
| `Inherited` | 派生类是否继承该特性 |

### 应用自定义特性

```csharp
// 应用特性（可以省略 Attribute 后缀）
[CustomInfo("用户服务类", Author = "张三", Version = 1)]
[CustomInfo("这是第二个特性", Version = 2)]
public class UserService
{
    [CustomInfo("获取用户信息")]
    public User? GetUser(int id)
    {
        return null;
    }
}
```

## 使用反射读取特性

### GetCustomAttribute / GetCustomAttributes

```csharp
using System;
using System.Reflection;

// 获取类型的特性
var typeInfo = typeof(UserService);
var attributes = typeInfo.GetCustomAttributes();

// 查找特定特性
var customInfo = typeInfo.GetCustomAttribute<CustomInfoAttribute>();
if (customInfo != null)
{
    Console.WriteLine($"描述: {customInfo.Description}");
    Console.WriteLine($"作者: {customInfo.Author}");
    Console.WriteLine($"版本: {customInfo.Version}");
}

// 获取方法上的特性
var method = typeInfo.GetMethod("GetUser");
var methodAttr = method?.GetCustomAttribute<CustomInfoAttribute>();
Console.WriteLine($"方法描述: {methodAttr?.Description}");
```

### 遍历所有特性

```csharp
// 遍历类上的所有 CustomInfo 特性
var allCustomInfo = typeInfo.GetCustomAttributes<CustomInfoAttribute>();
foreach (var attr in allCustomInfo)
{
    Console.WriteLine($"- {attr.Description} (v{attr.Version}) by {attr.Author}");
}

// 检查是否存在特定特性
bool hasCustomInfo = typeInfo.IsDefined(typeof(CustomInfoAttribute));
```

## 实际应用场景

### 序列化标记

```csharp
[Serializable]
public class Product
{
    public int Id { get; set; }
    
    [field: NonSerialized]  // 标记不参与序列化
    private string _cache;
}
```

### API 路由标记（模拟 ASP.NET Core）

```csharp
[HttpGet("api/users")]
public List<User> GetUsers() { /* ... */ }

[HttpPost("api/users")]
public User CreateUser([FromBody] User user) { /* ... */ }

[HttpPut("api/users/{id}")]
public User UpdateUser(int id, [FromBody] User user) { /* ... */ }
```

### 数据验证标记

```csharp
public class UserModel
{
    [Required(ErrorMessage = "用户名不能为空")]
    [StringLength(20, MinimumLength = 3, ErrorMessage = "用户名长度为3-20")]
    public string UserName { get; set; }

    [Required(ErrorMessage = "邮箱不能为空")]
    [EmailAddress(ErrorMessage = "邮箱格式不正确")]
    public string Email { get; set; }

    [Range(18, 100, ErrorMessage = "年龄必须在18-100之间")]
    public int Age { get; set; }
}
```

## 总结

| 特性 | 用途 | 版本 |
|------|------|------|
| `[Serializable]` | 标记类型可序列化 | .NET 1.0+ |
| `[Obsolete]` | 标记过时的成员 | .NET 1.0+ |
| `[Conditional]` | 条件编译 | .NET 1.0+ |
| `[CallerMemberName]` | 自动填充调用者信息 | C# 5.0+ |
| `[DllImport]` | P/Invoke 声明 | .NET 1.0+ |
| `[AttributeUsage]` | 定义特性使用限制 | .NET 1.0+ |

## 相关资源

- [属性（C# 编程指南）](https://learn.microsoft.com/zh-cn/dotnet/csharp/programming-guide/concepts/attributes/)
- [创建自定义特性（C#）](https://learn.microsoft.com/zh-cn/dotnet/csharp/advanced-topics/reflection-and-attributes/creating-custom-attributes)
- [使用反射访问特性（C#）](https://learn.microsoft.com/zh-cn/dotnet/csharp/advanced-topics/reflection-and-attributes/accessing-attributes-by-using-reflection)