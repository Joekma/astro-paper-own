---
title: C# 异常处理
author: Joekma
pubDatetime: 2026-05-07T00:00:00.000+08:00
modDatetime: 2026-05-07T00:00:00.000+08:00
slug: csharp-exception-handling
description: "深入学习 C# 异常处理机制，掌握 try/catch/finally、自定义异常、异常传播和最佳实践。"
tags:
  - C#
  - 异常处理
  - Exception
  - try
  - catch
  - throw
  - 错误处理
draft: false
series: csharp
language: zh-CN
---

## 概述

异常处理是保证程序健壮性的关键机制。当程序发生错误时，异常处理允许我们捕获错误、记录日志，并向用户提供有意义的反馈，而不是让程序直接崩溃。

### 核心概念

| 概念          | 说明                         |
| ------------- | ---------------------------- |
| **Exception** | 所有异常的基类               |
| **try**       | 包含可能抛出异常的代码       |
| **catch**     | 捕获并处理异常               |
| **finally**   | 无论是否异常都执行的清理代码 |
| **throw**     | 抛出异常                     |

---

## 基本语法

### try-catch 结构

```csharp
try
{
    int result = 10 / 0;  // 除零会抛出 DivideByZeroException
}
catch (Exception ex)
{
    Console.WriteLine($"发生错误: {ex.Message}");
}
```

### try-catch-finally 结构

`finally` 块中的代码无论是否发生异常都会执行，常用于资源清理：

```csharp
try
{
    // 打开文件流读取内容
    var reader = new StreamReader("file.txt");
    string content = reader.ReadToEnd();
    // 如果读取过程中出现异常，reader 可能未正确关闭
}
catch (FileNotFoundException ex)
{
    // 捕获文件不存在异常
    Console.WriteLine($"文件未找到: {ex.FileName}");
}
catch (IOException ex)
{
    // 捕获其他 IO 相关异常
    Console.WriteLine($"IO 错误: {ex.Message}");
}
finally
{
    // 无论 try 或 catch 是否抛出异常，这里都会执行
    Console.WriteLine("无论是否出错，这段代码都会执行");
}
```

---

## 常见异常类型

### 系统内置异常

| 异常类型                    | 说明         | 常见场景                       |
| --------------------------- | ------------ | ------------------------------ |
| `ArgumentNullException`     | 参数为空     | 传入 null 给不接受 null 的方法 |
| `ArgumentException`         | 参数无效     | 传递超出范围的参数             |
| `InvalidOperationException` | 操作状态无效 | 在不恰当的时机调用方法         |
| `NullReferenceException`    | 空引用访问   | 访问 null 对象的成员           |
| `IndexOutOfRangeException`  | 索引越界     | 数组访问超出范围               |
| `FormatException`           | 格式错误     | 字符串转数字时格式不对         |
| `DivideByZeroException`     | 除零错误     | 整数除以零                     |
| `TimeoutException`          | 操作超时     | HTTP 请求超时                  |

### 获取异常详细信息

```csharp
try
{
    int[] numbers = { 1, 2, 3 };
    int value = numbers[10];
}
catch (Exception ex)
{
    Console.WriteLine($"异常类型: {ex.GetType().Name}");
    Console.WriteLine($"错误信息: {ex.Message}");
    Console.WriteLine($"出错位置: {ex.StackTrace}");
}
```

---

## 多重 catch 块

### 从具体到通用

catch 块的顺序很重要，应该从最具体的异常类型开始：

```csharp
try
{
    var json = File.ReadAllText("data.json");
    var obj = JsonSerializer.Deserialize<Data>(json);
}
catch (FileNotFoundException ex)
{
    Console.WriteLine($"文件未找到: {ex.FileName}");
}
catch (JsonException ex)
{
    Console.WriteLine($"JSON 解析失败: {ex.Path}");
}
catch (IOException ex)
{
    Console.WriteLine($"文件操作失败: {ex.Message}");
}
catch (Exception ex)
{
    Console.WriteLine($"未知错误: {ex.Message}");
}
```

### 异常过滤器 (C# 6+)

使用 `when` 关键字添加条件：

```csharp
try
{
    var result = someNumber / divisor;
}
catch (DivideByZeroException ex) when (divisor != 0)
{
    // 只有 when 条件为 true 时才捕获
}
catch (Exception ex) when (ex.InnerException != null)
{
    // 捕获有内部异常的异常
}
```

---

## 抛出异常

### throw 关键字

```csharp
public void SetAge(int age)
{
    if (age < 0 || age > 150)
    {
        throw new ArgumentOutOfRangeException(nameof(age), "年龄必须在 0-150 之间");
    }
    Age = age;
}
```

### 重新抛出异常

保留原始异常信息：

```csharp
try
{
    ProcessData();
}
catch (Exception ex)
{
    Console.WriteLine("记录日志");
    throw;  // 重新抛出原始异常
}
```

### 包装异常

将低层异常转换为高层异常：

```csharp
try
{
    var data = File.ReadAllText("config.json");
}
catch (IOException ex)
{
    throw new ConfigurationException("读取配置文件失败", ex);
}
```

---

## 自定义异常

### 定义异常类

```csharp
public class ValidationException : Exception
{
    public string FieldName { get; }

    public ValidationException(string fieldName, string message)
        : base(message)
    {
        FieldName = fieldName;
    }

    public ValidationException(string fieldName, string message, Exception inner)
        : base(message, inner)
    {
        FieldName = fieldName;
    }
}
```

### 使用自定义异常

```csharp
public void RegisterUser(string username, string email)
{
    if (string.IsNullOrWhiteSpace(username))
    {
        throw new ValidationException("username", "用户名不能为空");
    }

    if (!email.Contains("@"))
    {
        throw new ValidationException("email", "邮箱格式不正确");
    }

    // 注册逻辑...
}
```

---

## using 语句

### 自动资源释放

`using` 语句确保资源在使用完毕后被正确释放：

```csharp
// 方式一：using 声明
using var reader = new StreamReader("file.txt");
string content = reader.ReadToEnd();
// reader 在作用域结束时自动 Dispose

// 方式二：using 块
using (var writer = new StreamWriter("output.txt"))
{
    writer.WriteLine("Hello");
}
// writer 自动关闭
```

### 实现 IDisposable

```csharp
public class DatabaseConnection : IDisposable
{
    private bool _disposed;

    public void Dispose()
    {
        if (!_disposed)
        {
            CloseConnection();
            _disposed = true;
        }
    }
}
```

---

## 最佳实践

### 应该做的事情

| 实践           | 说明                           |
| -------------- | ------------------------------ |
| **具体捕获**   | 尽可能捕获具体的异常类型       |
| **记录日志**   | 捕获异常时记录详细日志         |
| **清理资源**   | 使用 finally 或 using 释放资源 |
| **用户友好**   | 向用户显示有意义的消息         |
| **记录上下文** | 保存异常发生时的状态信息       |

### 不应该做的事情

| 反模式             | 说明                                 |
| ------------------ | ------------------------------------ |
| **空的 catch**     | 吞掉异常不处理是最糟糕的做法         |
| **过于宽泛**       | `catch (Exception)` 可能掩盖真正问题 |
| **抛出 Exception** | 使用具体的异常类型                   |
| **异常用于流程**   | 不要用异常来控制正常流程             |

### 正确示例 vs 错误示例

```csharp
// ❌ 错误：空的 catch 块
try
{
    DoSomething();
}
catch (Exception)
{
}

// ❌ 错误：过于宽泛
catch (Exception ex)
{
    Console.WriteLine(ex.Message);
    // 应该记录日志而不是只打印
}

// ✅ 正确：具体处理
try
{
    await _httpClient.GetAsync(url);
}
catch (HttpRequestException ex)
{
    _logger.LogError(ex, "HTTP 请求失败: {Url}", url);
    throw new ServiceException("服务暂时不可用", ex);
}
```

---

## 总结

异常处理是 C# 编程中不可或缺的一部分：

1. **了解常见异常** - 知道什么情况会抛出什么异常
2. **具体捕获** - 按从具体到通用的顺序 catch
3. **不要忽略** - 至少记录日志
4. **自定义异常** - 为业务场景定义专用异常
5. **资源管理** - 使用 using 语句自动释放资源

掌握异常处理让你的程序更加健壮，能够优雅地应对各种错误情况。
