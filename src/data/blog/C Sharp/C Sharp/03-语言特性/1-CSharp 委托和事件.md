---
title: C# 委托和事件
author: Joekma
pubDatetime: 2026-05-06T00:00:00.000+08:00
modDatetime: 2026-05-06T00:00:00.000+08:00
slug: csharp-delegates-events
description: '深入学习 C# 委托和事件，掌握委托定义、Lambda 表达式、多播委托、事件声明和处理程序。'
tags:
  - C#
  - 委托
  - 事件
  - Delegate
  - Event
  - Lambda
  - 回调
draft: false
language: zh-CN
---

## 概述

委托和事件是 C# 中实现回调和消息传递机制的核心概念。委托提供了一种类型安全的方式来封装方法，而事件则基于委托实现了发布-订阅模式。

### 核心概念

| 概念 | 说明 |
|------|------|
| **委托** | 封装方法的类型，类似于函数指针 |
| **事件** | 基于委托的消息通知机制 |
| **Lambda** | 匿名函数的简洁表示法 |
| **多播委托** | 一次调用多个方法 |

---

## 委托基础

### 什么是委托

委托是一种类型，它封装了具有特定返回值和参数的方法的引用：

```csharp
// 声明委托类型
public delegate int Calculate(int a, int b);

// 使用委托
Calculate calc = Add;
int result = calc(5, 3);  // result = 8

// 引用不同方法
calc = Multiply;
result = calc(5, 3);  // result = 15
```

### 内置委托类型

.NET 提供了通用的内置委托类型：

```csharp
// Action - 无返回值
Action<string> print = Console.WriteLine;
Action<int, int> addAndPrint = (a, b) => Console.WriteLine(a + b);

// Func - 有返回值
Func<int, int, int> add = (a, b) => a + b;
Func<string, int, string> format = (s, n) => $"{s}: {n}";

// Predicate - 返回 bool
Predicate<int> isEven = n => n % 2 == 0;
Predicate<string> isLong = s => s.Length > 10;
```

### 委托声明

```csharp
// 基本委托声明
public delegate void MessageHandler(string message); 
// 访问修饰符 返回值类型 委托名称     参数类型
public delegate T Transformer<T>(T input);
public delegate bool Filter<T>(T item);
```

---

## 使用委托

### 实例方法委托

```csharp
public class Calculator
{
    public int Add(int a, int b) => a + b;
    public int Subtract(int a, int b) => a - b;
}

var calc = new Calculator();
Func<int, int, int> operation = calc.Add;
int result = operation(10, 5);  // 15
```

### 静态方法委托

```csharp
public class MathUtils
{
    public static int Max(int a, int b) => Math.Max(a, b);
    public static int Min(int a, int b) => Math.Min(a, b);
}

Func<int, int, int> operation = MathUtils.Max;
int result = operation(10, 5);  // 10
```

### 委托链（多播委托）

```csharp
public delegate void Notify();

public class NotificationService
{
    public void Email() => Console.WriteLine("发送邮件");
    public void SMS() => Console.WriteLine("发送短信");
    public void WeChat() => Console.WriteLine("发送微信");
}

var service = new NotificationService();

Notify notify = service.Email;
notify += service.SMS;  // 添加到链
notify += service.WeChat;

// 调用一次，所有方法都会被执行
notify();  // 依次输出: 发送邮件, 发送短信, 发送微信

// 从链中移除
notify -= service.SMS;
notify();  // 发送邮件, 发送微信
```

---

## Lambda 表达式

### 基本语法

Lambda 表达式提供了一种简洁的方式来创建匿名函数：

```csharp
// 完整语法
Func<int, int, int> add1 = (int a, int b) => { return a + b; };

// 简写语法
Func<int, int, int> add2 = (a, b) => a + b;

// 单参数可以省略括号
Func<int, int> square = n => n * n;

// 无参数
Action greet = () => Console.WriteLine("Hello!");
```

### Lambda 与委托

```csharp
// 传统方法
int Add(int a, int b) { return a + b; }
Func<int, int, int> func1 = Add;

// Lambda 表达式
Func<int, int, int> func2 = (a, b) => a + b;

// LINQ 中使用
var numbers = new[] { 1, 2, 3, 4, 5 };
var evens = numbers.Where(n => n % 2 == 0);
```

### 表达式 Lambda vs 语句 Lambda

```csharp
// 表达式 Lambda - 直接返回表达式结果
Func<int, int> square = n => n * n;

// 语句 Lambda - 包含多条语句
Func<int, int> factorial = n =>
{
    if (n <= 1) return 1;
    int result = 1;
    for (int i = 2; i <= n; i++)
        result *= i;
    return result;
};
```

### 闭包

Lambda 表达式可以访问外部变量（闭包）：

```csharp
int multiplier = 3;
Func<int, int> multiply = n => n * multiplier;

multiplier = 5;
Console.WriteLine(multiply(4));  // 输出: 20 (使用最新的 multiplier)
```

---

## 事件基础

### 什么是事件

事件是基于委托的安全机制，用于实现发布-订阅模式：

```csharp
public class Button
{
    // 声明事件
    public event EventHandler Clicked;

    public void OnClick()
    {
        // 触发事件
        Clicked?.Invoke(this, EventArgs.Empty);
    }
}

// 订阅事件
var button = new Button();
button.Clicked += (sender, e) => Console.WriteLine("按钮被点击了！");

// 触发事件
button.OnClick();
```

### 事件声明

```csharp
// 标准事件模式
public event EventHandler<MyEventArgs> MyEvent;

// 使用自定义事件参数
public class MyEventArgs : EventArgs
{
    public string Message { get; set; }
    public int Value { get; set; }
}

public class Publisher
{
    public event EventHandler<MyEventArgs> DataChanged;

    public void RaiseEvent(string message, int value)
    {
        DataChanged?.Invoke(this, new MyEventArgs 
        { 
            Message = message, 
            Value = value 
        });
    }
}
```

### 订阅和取消订阅

```csharp
var publisher = new Publisher();

// 订阅事件
publisher.DataChanged += OnDataChanged;
publisher.DataChanged += (sender, e) => Console.WriteLine($"收到: {e.Message}");

// 取消订阅
publisher.DataChanged -= OnDataChanged;
```

---

## 事件访问器

### 自定义事件访问器

```csharp
private EventHandlerList _events = new EventHandlerList();

public event EventHandler Clicked
{
    add
    {
        Console.WriteLine("订阅 Clicked 事件");
        _events.AddHandler("clicked", value);
    }
    remove
    {
        Console.WriteLine("取消订阅 Clicked 事件");
        _events.RemoveHandler("clicked", value);
    }
}

protected virtual void OnClick()
{
    var handler = (EventHandler)_events["clicked"];
    handler?.Invoke(this, EventArgs.Empty);
}
```

---

## 实用示例

### 示例1：计算器回调

```csharp
public class Calculator
{
    public Func<int, int, int> Operation { get; set; }

    public int Calculate(int a, int b)
    {
        if (Operation == null)
            throw new InvalidOperationException("未设置操作");
        return Operation(a, b);
    }
}

var calc = new Calculator();
calc.Operation = (a, b) => a + b;
Console.WriteLine(calc.Calculate(5, 3));  // 8

calc.Operation = (a, b) => a * b;
Console.WriteLine(calc.Calculate(5, 3));  // 15
```

### 示例2：进度报告器

```csharp
public class ProgressReporter
{
    public Action<int, int> ProgressChanged;

    public async Task ProcessAsync(int total)
    {
        for (int i = 1; i <= total; i++)
        {
            await Task.Delay(100);
            ProgressChanged?.Invoke(i, total);
        }
    }
}

var reporter = new ProgressReporter();
reporter.ProgressChanged += (current, total) =>
{
    var percent = (double)current / total * 100;
    Console.WriteLine($"进度: {percent:F1}%");
};

await reporter.ProcessAsync(10);
```

### 示例3：插件系统

```csharp
public class PluginManager
{
    public event Action<string> PluginLoaded;
    public event Action<string> PluginUnloaded;
    public event Func<string, bool> PluginExecuting;

    public void LoadPlugin(string name)
    {
        Console.WriteLine($"加载插件: {name}");
        PluginLoaded?.Invoke(name);
    }

    public void ExecutePlugin(string name)
    {
        bool canExecute = PluginExecuting?.Invoke(name) ?? true;
        if (canExecute)
            Console.WriteLine($"执行插件: {name}");
    }
}

var manager = new PluginManager();

manager.PluginLoaded += name => Console.WriteLine($"日志: 已加载 {name}");
manager.PluginExecuting += name => name != "BadPlugin";

manager.LoadPlugin("PluginA");    // 加载并记录日志
manager.LoadPlugin("BadPlugin");  // 加载但不执行
manager.ExecutePlugin("PluginA");  // 执行
manager.ExecutePlugin("BadPlugin"); // 不执行
```

---

## 常见模式

### Observer 模式

```csharp
public interface IObserver<T>
{
    void Update(T data);
}

public class Subject<T>
{
    private readonly List<IObserver<T>> _observers = new();

    public void Attach(IObserver<T> observer) => _observers.Add(observer);
    public void Detach(IObserver<T> observer) => _observers.Remove(observer);

    public void Notify(T data)
    {
        foreach (var observer in _observers)
        {
            observer.Update(data);
        }
    }
}

// 使用
var subject = new Subject<string>();
subject.Attach(new ConsoleObserver());
subject.Attach(new EmailObserver());
subject.Notify("数据更新了！");
```

### 策略模式

```csharp
public class Sorter
{
    public Func<int[], int[]> SortAlgorithm { get; set; }

    public int[] Sort(int[] data)
    {
        return SortAlgorithm?.Invoke(data) ?? data;
    }
}

var sorter = new Sorter();

// 使用快速排序
sorter.SortAlgorithm = QuickSort;

// 使用冒泡排序
sorter.SortAlgorithm = BubbleSort;
```

---

## 常见错误

### 1. 忘记检查 null

```csharp
public delegate void MyDelegate();

// ❌ 错误：可能抛 NullReferenceException
public void Raise()
{
    MyDelegate();  // 如果没有订阅者会抛异常
}

// ✅ 正确：使用 null 条件运算符
public void Raise()
{
    MyDelegate?.Invoke();
}
```

### 2. 委托变量与事件混淆

```csharp
public class Publisher
{
    // ❌ 错误：直接暴露委托字段
    public Func<int, int> Process;

    // ✅ 正确：使用事件
    public event Func<int, int> Process;
}
```

### 3. 忘记取消订阅

```csharp
public class Parent
{
    private Child _child;

    public void Setup()
    {
        _child = new Child();
        _child.DataChanged += OnChildDataChanged;  // 订阅
    }

    // ❌ 错误：没有取消订阅，可能导致内存泄漏
    public void Cleanup()
    {
        // 忘记取消订阅
    }

    // ✅ 正确
    public void Cleanup()
    {
        _child.DataChanged -= OnChildDataChanged;
    }
}
```

---

## 最佳实践

### 1. 使用 EventHandler<T>

```csharp
// ✅ 推荐：使用泛型 EventHandler<T>
public event EventHandler<DataChangedEventArgs> DataChanged;

// ❌ 避免：使用自定义委托
public event Action<DataChangedEventArgs> DataChanged;
```

### 2. 遵循命名约定

```csharp
public class ButtonClickedEventArgs : EventArgs
{
    public int X { get; set; }
    public int Y { get; set; }
}

// 事件命名：名词或名词短语
public event EventHandler<ButtonClickedEventArgs> Clicked;
public event EventHandler Processing;
```

### 3. 提供受保护虚方法

```csharp
public class Publisher
{
    public event EventHandler Changed;

    protected virtual void OnChanged()
    {
        Changed?.Invoke(this, EventArgs.Empty);
    }
}

// 派生类可以重写
public class ExtendedPublisher : Publisher
{
    protected override void OnChanged()
    {
        Console.WriteLine("Changed 即将触发");
        base.OnChanged();
    }
}
```

---

## 总结

| 概念 | 说明 |
|------|------|
| **委托** | 封装方法的类型 |
| **Func/Action** | 内置通用委托类型 |
| **Lambda** | 匿名函数的简洁表示 |
| **事件** | 基于委托的消息机制 |
| **多播** | 一次调用多个方法 |
| **+= / -=** | 订阅和取消订阅 |

---

## 相关资源

- [委托文档](https://learn.microsoft.com/zh-cn/dotnet/csharp/delegates-overview)
- [事件文档](https://learn.microsoft.com/zh-cn/dotnet/csharp/event-oriented)
- [Lambda 表达式](https://learn.microsoft.com/zh-cn/dotnet/csharp/language-reference/operators/lambda-expressions)
