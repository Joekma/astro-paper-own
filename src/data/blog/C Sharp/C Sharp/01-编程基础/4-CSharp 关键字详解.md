---
title: C# 关键字详解
author: Joekma
pubDatetime: 2026-05-12T00:00:00.000+08:00
modDatetime: 2026-05-12T00:00:00.000+08:00
slug: csharp-keywords
description: "系统梳理 C# 语言关键字，详解访问修饰符、类型关键字、流程控制、修饰符、查询关键字等各类关键字的含义与用法。"
tags:
  - C#
  - 关键字
  - Keywords
  - 访问修饰符
  - 编程基础
draft: false
series: csharp
language: zh-CN
---

## 概述

C# 关键字是语言预定义的保留词，每个关键字都有特定的含义，不能用作标识符。了解关键字是掌握 C# 语言的基础。本文按功能分类介绍 C# 中的常用关键字。

### C# 关键字分类

| 类别       | 包含关键字                                                                 |
| ---------- | -------------------------------------------------------------------------- |
| 访问修饰符 | `public`、`private`、`protected`、`internal`                               |
| 类型关键字 | `class`、`struct`、`interface`、`enum`、`record`                           |
| 流程控制   | `if`、`else`、`switch`、`case`、`for`、`foreach`、`while`                  |
| 方法与参数 | `void`、`return`、`this`、`base`、`params`、`ref`、`out`、`in`             |
| 修饰符     | `static`、`readonly`、`const`、`virtual`、`override`、`abstract`、`sealed` |
| 异常处理   | `try`、`catch`、`finally`、`throw`                                         |
| 泛型       | `where`、`new`                                                             |
| 查询       | `var`、`from`、`select`、`where`、`join`、`group`、`orderby`               |
| 异步       | `async`、`await`                                                           |
| 类型转换   | `typeof`、`as`、`is`、`checked`、`unchecked`                               |
| 命名空间   | `namespace`、`using`、`global`                                             |
| 其他       | `null`、`true`、`false`、`default`、`delegate`、`event`                    |

---

## 访问修饰符关键字

访问修饰符控制类型和类型成员的可见性。

### 五种访问级别

```csharp
// public：公开访问，无限制
public class PublicClass
{
    // 同一程序集和引用它的程序集都可以访问
    public int PublicField;
}

// private：私有访问，仅限本类内部
private class PrivateHelper
{
    // 仅在 PrivateHelper 内部可见
    private int _helperState;
}

// protected：受保护访问，本类及派生类可访问
protected class ProtectedExample
{
    // 派生类可以访问
    protected int ProtectedField;
}

// internal：内部访问，仅当前程序集可见
internal class InternalClass
{
    // 同一程序集内可见，外部程序集不可见
    internal int InternalField;
}

// protected internal：受保护或内部访问（二者之一即可访问）
protected internal int ProtectedInternalField;

// private protected：C# 7.2+，同程序集内的派生类可访问
private protected int PrivateProtectedField;
```

### 访问修饰符组合表

| 修饰符               | 同一类 | 同程序集 | 派生类（同程序集） | 派生类（不同程序集） | 任意位置 |
| -------------------- | ------ | -------- | ------------------ | -------------------- | -------- |
| `public`             | ✅     | ✅       | ✅                 | ✅                   | ✅       |
| `protected`          | ✅     | ❌       | ✅                 | ✅                   | ❌       |
| `internal`           | ✅     | ✅       | ✅                 | ❌                   | ❌       |
| `protected internal` | ✅     | ✅       | ✅                 | ✅                   | ❌       |
| `private protected`  | ✅     | ✅       | ✅                 | ❌                   | ❌       |
| `private`            | ✅     | ❌       | ❌                 | ❌                   | ❌       |

---

## 类型声明关键字

### class - 类

类是引用类型，是面向对象编程的基础：

```csharp
// 完整类声明
public class Person
{
    // 字段
    private string _name;

    // 属性
    public string Name
    {
        get => _name;
        set => _name = value;
    }

    // 方法
    public void SayHello()
    {
        Console.WriteLine($"Hello, I'm {_name}");
    }
}

// 抽象类：不能实例化，只能被继承
public abstract class Shape
{
    public abstract double Area { get; }
}

// 密封类：不能被继承
public sealed class FinalClass
{
    // 继承链到此为止
}
```

### struct - 结构体

结构体是值类型，适合轻量级数据结构：

```csharp
// 结构体声明
public struct Point
{
    public double X { get; }
    public double Y { get; }

    // 结构体必须有完整构造函数
    public Point(double x, double y)
    {
        X = x;
        Y = y;
    }
}

// 只读结构体（C# 10+）
public readonly struct ReadOnlyPoint
{
    public double X { get; init; }
    public double Y { get; init; }
}

// ref 结构体：只能存在于栈上
public ref struct SpanExample
{
    public Span<int> Data;
}
```

### interface - 接口

接口定义行为的契约：

```csharp
// 接口声明
public interface IComparable
{
    int CompareTo(object obj);
}

// 多接口继承
public interface IDrawable
{
    void Draw();
}

public interface ISerializable : IDrawable
{
    string Serialize();
}

// 接口默认成员（C# 8.0+）
public interface ILogger
{
    void Log(string message);

    // 默认实现
    void LogError(string error) => Log($"[ERROR] {error}");
}
```

### enum - 枚举

枚举是一组命名的整数常量：

```csharp
// 基本枚举，默认从 0 开始
public enum LogLevel
{
    Debug,    // 0
    Info,     // 1
    Warning,  // 2
    Error     // 3
}

// 指定基础类型的枚举
public enum FileAccess : int
{
    Read = 1,
    Write = 2,
    Execute = 4,
    All = Read | Write | Execute
}

// Flags 枚举用于位掩码操作
[Flags]
public enum FilePermissions
{
    None = 0,
    Read = 1,
    Write = 2,
    Execute = 4,
    All = Read | Write | Execute
}

// 使用 Flags 枚举
FilePermissions perms = FilePermissions.Read | FilePermissions.Write;
bool canRead = perms.HasFlag(FilePermissions.Read);  // true
```

### record - 记录

记录是 C# 9+ 引入的引用类型，专为不可变数据设计：

```csharp
// 引用记录
public record Person(string Name, int Age);

// 值记录（C# 10+）
public readonly record struct Point(double X, double Y);

// 使用 with 表达式创建副本
Person original = new Person("Alice", 30);
Person modified = original with { Age = 31 };

// 继承记录
public record Student(string Name, int Age, int Grade)
    : Person(Name, Age);
```

---

## 流程控制关键字

### if / else

条件分支：

```csharp
int score = 85;

if (score >= 90)
{
    Console.WriteLine("优秀");
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

### switch / case

多值匹配，C# 7.0+ 支持 switch 表达式：

```csharp
// 传统 switch 语句
int day = 3;
switch (day)
{
    case 1:
        Console.WriteLine("星期一");
        break;
    case 2:
    case 3:
    case 4:
    case 5:
        Console.WriteLine("工作日");
        break;
    default:
        Console.WriteLine("周末");
        break;
}

// switch 表达式（C# 8.0+）
string dayName = day switch
{
    1 => "星期一",
    2 => "星期二",
    3 => "星期三",
    _ => "未知"
};

// switch 表达式结合模式匹配（C# 9.0+）
string describe = score switch
{
    >= 90 => "优秀",
    >= 80 => "良好",
    >= 60 => "及格",
    _ => "不及格"
};
```

### for / foreach / while

循环结构：

```csharp
// for 循环
for (int i = 0; i < 5; i++)
{
    Console.WriteLine(i);
}

// foreach 循环
string[] names = { "Alice", "Bob", "Charlie" };
foreach (string name in names)
{
    Console.WriteLine(name);
}

// while 循环
int count = 0;
while (count < 5)
{
    Console.WriteLine(count);
    count++;
}

// do-while 循环（至少执行一次）
int n = 0;
do
{
    Console.WriteLine(n);
    n++;
} while (n < 5);
```

### break / continue / return

控制跳转：

```csharp
// break：跳出当前循环
for (int i = 0; i < 10; i++)
{
    if (i == 5) break;  // 跳出整个循环
    Console.WriteLine(i);
}

// continue：跳过本次迭代
for (int i = 0; i < 5; i++)
{
    if (i == 2) continue;  // 跳过 i==2 的这次迭代
    Console.WriteLine(i);
}

// return：返回方法值或退出方法
int Max(int a, int b)
{
    return a > b ? a : b;
}
```

---

## 方法与参数关键字

### void

表示方法没有返回值：

```csharp
// 无返回值方法
public void PrintMessage(string message)
{
    Console.WriteLine(message);
}

// 异步无返回值
public async void ProcessAsync()
{
    await Task.Delay(1000);
}
```

### this

引用当前实例：

```csharp
public class Employee
{
    private string _name;
    private decimal _salary;

    // this 用于消除字段与参数的歧义
    public Employee(string name, decimal salary)
    {
        this._name = name;       // this._name 是字段
        this._salary = salary;   // salary 是参数
    }

    // this 用于在构造函数中调用另一个构造函数
    public Employee() : this("Unknown", 0m)
    {
    }

    // this 用于返回自身（链式调用）
    public Employee SetName(string name)
    {
        this._name = name;
        return this;
    }
}
```

### base

访问基类成员：

```csharp
public class Animal
{
    public string Name { get; set; }

    public virtual void Speak()
    {
        Console.WriteLine("...");
    }
}

public class Dog : Animal
{
    public override void Speak()
    {
        // 调用基类的 Speak 方法
        base.Speak();
        Console.WriteLine("汪汪！");
    }
}

public class ChildDog : Dog
{
    public override void Speak()
    {
        base.Speak();  // 调用 Dog.Speak()，即 Animal.Speak() + "汪汪！"
        Console.WriteLine("汪汪汪！");
    }
}
```

### ref / out / in

参数传递方式：

```csharp
// ref：传入引用，方法内外共享同一个变量
public void Swap(ref int a, ref int b)
{
    int temp = a;
    a = b;
    b = temp;
}

int x = 1, y = 2;
Swap(ref x, ref y);  // x=2, y=1

// out：传出参数，方法内必须赋值
public bool TryParse(string input, out int result)
{
    return int.TryParse(input, out result);
}

if (TryParse("42", out int number))
{
    Console.WriteLine(number);  // 42
}

// in：传入只读引用，方法内不能修改
public void PrintCoordinate(in Point point)
{
    // point.X = 100;  // 编译错误，不能修改 in 参数
    Console.WriteLine($"({point.X}, {point.Y})");
}
```

### params

可变数量参数：

```csharp
// params 允许传入任意数量的同类型参数
public int Sum(params int[] numbers)
{
    int total = 0;
    foreach (int n in numbers)
    {
        total += n;
    }
    return total;
}

// 调用方式
int result1 = Sum(1, 2, 3);           // 6
int result2 = Sum(new[] { 1, 2, 3, 4 }); // 10
```

### params + ref / out

```csharp
// params 与 ref 结合
public void SetValues(ref int result, params int[] values)
{
    result = values.Sum();
}

int total = 0;
SetValues(ref total, 1, 2, 3, 4, 5);  // total = 15
```

---

## 修饰符关键字

### static

静态成员属于类本身，而非实例：

```csharp
public class MathHelper
{
    // 静态字段：所有实例共享
    public static int InstanceCount { get; private set; }

    // 静态构造函数：类首次访问时执行一次
    static MathHelper()
    {
        InstanceCount = 0;
        Console.WriteLine("MathHelper 类被加载");
    }

    // 静态方法：无需实例化即可调用
    public static int Max(int a, int b) => a > b ? a : b;

    // 实例方法
    public int Min(int a, int b) => a < b ? a : b;
}

// 调用静态成员
int max = MathHelper.Max(3, 5);  // 5
MathHelper.InstanceCount++;
```

### readonly

只读字段，只能在构造函数或初始化器中赋值：

```csharp
public class Circle
{
    // 只能在声明时或构造函数中赋值
    public readonly double Radius;

    // 可以与 static 结合
    public static readonly double PI = 3.14159;

    public Circle(double radius)
    {
        this.Radius = radius;
    }

    public double Area => PI * Radius * Radius;
}
```

### const

编译时常量，在编译时完全替换：

```csharp
public class Constants
{
    // 编译时常量，必须是字面量
    public const int MaxRetry = 3;
    public const string AppName = "MyApp";
    public const double Gravity = 9.8;

    // 注意：const 隐含 static
    public static double GetGravity() => Gravity;  // 正确
}
```

### const vs readonly

| 对比     | const              | readonly       |
| -------- | ------------------ | -------------- |
| 赋值时机 | 编译时             | 运行时常量     |
| 类型限制 | 只能是编译期字面量 | 任意类型       |
| 内存位置 | 内联到使用处       | 实例或类内存中 |
| static   | 隐含 static        | 可加 static    |

```csharp
public class Example
{
    // const：编译时确定
    public const int ConstValue = 100;

    // readonly：运行时确定
    public readonly DateTime CreatedAt = DateTime.Now;

    // readonly 可以是实例级别
    public Example()
    {
        CreatedAt = DateTime.UtcNow;  // 可以赋值
    }
}
```

### virtual / override

虚方法与重写：

```csharp
public class BaseClass
{
    // virtual 标记方法可以被重写
    public virtual void Draw()
    {
        Console.WriteLine("BaseClass.Draw()");
    }

    // 普通方法不能被重写
    public void Display()
    {
        Console.WriteLine("BaseClass.Display()");
    }
}

public class DerivedClass : BaseClass
{
    // override 重写基类虚方法
    public override void Draw()
    {
        Console.WriteLine("DerivedClass.Draw()");
        base.Draw();  // 可选：调用基类实现
    }

    // new 隐藏基类方法（非重写）
    public new void Display()
    {
        Console.WriteLine("DerivedClass.Display()");
    }
}
```

### abstract

抽象成员必须在派生类中实现：

```csharp
// abstract 类不能实例化
public abstract class Shape
{
    // abstract 属性：没有实现
    public abstract double Area { get; }

    // abstract 方法：没有实现
    public abstract void Draw();

    // 抽象类可以有具体方法
    public void PrintInfo()
    {
        Console.WriteLine($"Area: {Area}");
    }
}

public class Rectangle : Shape
{
    public double Width { get; set; }
    public double Height { get; set; }

    // 必须实现所有抽象成员
    public override double Area => Width * Height;

    public override void Draw()
    {
        Console.WriteLine($"Drawing rectangle {Width}x{Height}");
    }
}
```

### sealed

阻止进一步继承或重写：

```csharp
// sealed 类：阻止继承
public sealed class Singleton
{
    private static readonly Lazy<Singleton> _instance =
        new(() => new Singleton());

    public static Singleton Instance => _instance.Value;

    private Singleton() { }
}

// sealed 方法：阻止派生类重写
public class Base
{
    public virtual void Method() { }
}

public class Derived : Base
{
    // 阻止 FurtherDerived 重写此方法
    public sealed override void Method()
    {
        Console.WriteLine("Derived.Method()");
    }
}
```

---

## 异常处理关键字

### try / catch / finally / throw

异常处理的核心关键字：

```csharp
public void ProcessData()
{
    try
    {
        // 可能抛出异常的代码
        int[] numbers = { 1, 2, 3 };
        int value = numbers[10];  // IndexOutOfRangeException
    }
    catch (IndexOutOfRangeException ex)
    {
        // 捕获特定异常
        Console.WriteLine($"索引越界: {ex.Message}");
    }
    catch (Exception ex) when (ex.InnerException != null)
    {
        // 异常过滤器（C# 6+）
        Console.WriteLine($"有内部异常的异常: {ex.Message}");
    }
    catch (Exception ex)
    {
        // 捕获所有其他异常
        Console.WriteLine($"未知错误: {ex.Message}");
        throw;  // 重新抛出
    }
    finally
    {
        // 无论是否异常都执行
        Console.WriteLine("清理资源");
    }
}

// throw：抛出异常
public void ValidateAge(int age)
{
    if (age < 0 || age > 150)
    {
        throw new ArgumentOutOfRangeException(nameof(age), "年龄必须在 0-150 之间");
    }
}
```

---

## 类型关键字

### var

隐式类型推断（C# 3.0+）：

```csharp
// 编译器根据右侧表达式推断类型
var name = "Alice";           // 推断为 string
var count = 42;                // 推断为 int
var numbers = new[] { 1, 2, 3 };  // 推断为 int[]
var person = new Person();     // 推断为 Person

// var 可以配合匿名类型使用
var anonymous = new { Name = "Bob", Age = 25 };

// var 不能用于：
// 1. 字段声明（class/struct 内部）
// 2. 属性声明
// 3. 返回类型
// 4. 参数类型
```

### typeof / nameof

获取类型和名称信息：

```csharp
// typeof：获取类型对象
Type t = typeof(string);           // System.String
Type intType = typeof(int);        // System.Int32

// 泛型类型
Type listType = typeof(List<>);     // 未绑定泛型类型
Type stringListType = typeof(List<string>);

// nameof：获取变量/类型/成员的字符串名称
string name = "Alice";
string variableName = nameof(name);        // "name"
string className = nameof(Person);         // "Person"
string propName = nameof(Person.Name);     // "Name"

// nameof 在重构时非常有用
public void SetName(string name)
{
    if (string.IsNullOrEmpty(name))
    {
        throw new ArgumentNullException(nameof(name));
    }
}
```

### as / is

类型转换和类型检查：

```csharp
// is：类型检查
object obj = "Hello";

if (obj is string str)
{
    // 同时完成类型检查和转型
    Console.WriteLine(str.Length);  // str 是 string 类型
}

// is 配合模式（C# 9.0+）
if (obj is not null and not "")
{
    Console.WriteLine("有效字符串");
}

// as：安全类型转换，失败返回 null
object text = "Hello";
string? result = text as string;  // "Hello"
string? fail = obj as int;         // null（转换失败）

// 结合使用
if (obj is string s)
{
    Console.WriteLine(s);
}
else
{
    Console.WriteLine("不是字符串");
}
```

### checked / unchecked

溢出检查控制：

```csharp
// checked：启用溢出检查，超出范围时抛出 OverflowException
checked
{
    int a = int.MaxValue;
    int b = a + 1;  // 抛出 OverflowException
}

// unchecked：禁用溢出检查（默认行为）
unchecked
{
    int a = int.MaxValue;
    int b = a + 1;  // 结果为 int.MinValue（回绕）
}

// 默认是 unchecked
int x = int.MaxValue + 1;  // 正常编译，结果回绕
```

### default

默认值和 default 表达式：

```csharp
// 获取类型的默认值
int i = default;           // 0
double d = default;         // 0.0
bool b = default;           // false
string s = default;         // null
DateTime dt = default;      // 0001/01/01 00:00:00

// default 在泛型中特别有用
public T GetDefault<T>()
{
    return default;
}

// default 表达式（C# 7.1+）
// 根据上下文推断类型
int num = default;          // 推断为 int
string str = default;       // 推断为 string

// default 用于 switch 表达式
string result = value switch
{
    1 => "一",
    2 => "二",
    _ => default           // 使用 default 关键字
};
```

---

## 泛型关键字

### where

泛型类型约束：

```csharp
// 基本约束
public class Repository<T> where T : class
{
    // T 必须是引用类型
}

public class Cache<TKey, TValue> where TKey : notnull
{
    // TKey 不能为 null
}

public class Factory<T> where T : new()
{
    // T 必须有无参构造函数
    public T Create() => new T();
}

// 多重约束
public class Manager<T> where T : class, new()
{
    // T 既是引用类型，又有无参构造函数
}

// 接口约束
public class Sorter<T> where T : IComparable<T>
{
    public void Sort(T[] items)
    {
        // T 实现了 IComparable<T>，可以比较
        Array.Sort(items);
    }
}
```

### new 约束 vs new() 构造函数

| 形式            | 含义                   |
| --------------- | ---------------------- |
| `new()`         | 要求类型有无参构造函数 |
| `new`（表达式） | 调用构造函数创建实例   |

```csharp
// new() 是约束
public T Create<T>() where T : new()
{
    return new T();  // 调用无参构造函数
}

// new 是表达式
var person = new Person();
```

---

## 异步关键字

### async / await

异步编程的基础：

```csharp
// async 方法必须返回 Task、Task<T> 或 void
public async Task<int> DownloadAsync(string url)
{
    using var client = new HttpClient();
    var content = await client.GetStringAsync(url);
    return content.Length;
}

// async void 仅用于事件处理
private async void Button_Click(object sender, EventArgs e)
{
    try
    {
        var result = await DownloadAsync("https://example.com");
        textBox.Text = $"下载了 {result} 字节";
    }
    catch (Exception ex)
    {
        MessageBox.Show($"错误: {ex.Message}");
    }
}

// 多个异步操作
public async Task ProcessAllAsync()
{
    // 并行执行
    var task1 = DownloadAsync("url1");
    var task2 = DownloadAsync("url2");

    // 等待所有任务完成
    await Task.WhenAll(task1, task2);
}
```

---

## 命名空间关键字

### namespace / using / global

组织代码的命名空间关键字：

```csharp
// namespace：声明命名空间
namespace Company.Project.Module
{
    public class Service { }
}

// 嵌套命名空间
namespace Company
{
    namespace Project
    {
        namespace Module
        {
            public class Service { }
        }
    }
}

// 或使用点语法
namespace Company.Project.Module { }

// using：引入命名空间
using System;
using System.Collections.Generic;
using System.Linq;

// using 别名
using StringList = System.Collections.Generic.List<string>;

// using 静态导入
using static System.Console;
using static System.Math;

class Program
{
    static void Main()
    {
        WriteLine(Sqrt(PI));  // 直接调用静态成员
    }
}

// global using（C# 10+）
// 在 GlobalUsings.cs 中全局引入
global using System;
global using System.Collections.Generic;
```

---

## 特殊关键字

### null / true / false

```csharp
// null：引用类型默认值
string? name = null;
string safe = name ?? "默认值";

// true / false：布尔字面量
bool isReady = true;
bool isEmpty = false;

// 重载 true/false 运算符
public class Flag
{
    public static bool operator true(Flag f) => f.IsSet;
    public static bool operator false(Flag f) => !f.IsSet;
    public bool IsSet { get; set; }
}
```

### delegate

声明委托类型：

```csharp
// delegate：声明委托
public delegate int Calculate(int a, int b);

// 使用委托
public class Calculator
{
    public int Add(int a, int b) => a + b;
}

Calculate calc = new Calculator().Add;
int result = calc(3, 5);  // 8

// Func 和 Action 是更现代的委托形式
Func<int, int, int> multiply = (a, b) => a * b;
Action<string> print = Console.WriteLine;
```

### event

声明事件：

```csharp
public class Button
{
    // event：声明事件
    public event EventHandler? Clicked;

    protected virtual void OnClicked()
    {
        Clicked?.Invoke(this, EventArgs.Empty);
    }

    public void SimulateClick()
    {
        Console.WriteLine("Button 被点击");
        OnClicked();
    }
}

// 订阅和取消订阅事件
var button = new Button();
button.Clicked += (s, e) => Console.WriteLine("处理点击1");
button.Clicked += HandlerMethod;

button.SimulateClick();

button.Clicked -= HandlerMethod;
```

---

## 查询关键字（LINQ）

### from / select / where / orderby

语言集成查询语法：

```csharp
int[] numbers = { 5, 2, 8, 1, 9, 3 };

// from：指定数据源和范围变量
// where：过滤条件
// orderby：排序
// select：投影结果
var result = from n in numbers
              where n > 3
              orderby n descending
              select n * 2;

// 等价的点语法
var result2 = numbers
    .Where(n => n > 3)
    .OrderByDescending(n => n)
    .Select(n => n * 2);
```

### join / group / let

高级查询：

```csharp
// join：连接两个集合
var employees = new[]
{
    new { Id = 1, Name = "Alice", DeptId = 1 },
    new { Id = 2, Name = "Bob", DeptId = 2 }
};

var departments = new[]
{
    new { Id = 1, Name = "技术部" },
    new { Id = 2, Name = "市场部" }
};

var query = from e in employees
            join d in departments on e.DeptId equals d.Id
            select new { e.Name, DeptName = d.Name };

// group：分组
var groups = from n in numbers
             group n by n % 2 == 0 ? "偶数" : "奇数";

// let：引入中间变量
var query2 = from n in numbers
              let doubled = n * 2
              where doubled > 10
              select $"{n} -> {doubled}";
```

---

## 特殊运算符与符号

### => - Lambda 与表达式体成员

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
    public string Name => "Calculator";  // 等价于 get => Name { get { return "Calculator"; } }

    // 表达式体方法
    public int Add(int a, int b) => a + b;

    // 表达式体构造函数
    public Calculator(string name) => Name = name;
}
```

### ?. / ?[] - 空条件运算符

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

### ! - 空条件抑制运算符

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

### ?? / ??= - 空合并运算符

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
userName ??= "Alice";   // 不变，仍为 "Guest"

// 等价于
if (userName == null)
{
    userName = "Guest";
}
```

### ?: - 条件运算符（三元运算符）

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

### .. / ^ - 范围与索引运算符

C# 8.0+ 支持范围切片和倒数索引：

```csharp
int[] numbers = { 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 };

// .. 范围运算符，包含起点不含终点
int[] slice1 = numbers[2..5];    // {2, 3, 4}
int[] slice2 = numbers[3..^1];   // 从索引3到倒数第1个 {3,4,5,6,7,8}

// 省略边界
int[] prefix = numbers[..3];      // 前3个 {0,1,2}
int[] suffix = numbers[7..];      // 从索引7到末尾 {7,8,9}

// ^ 从结尾计算索引（^1 最后一个，^2 倒数第二个）
int last = numbers[^1];    // 9
int secondLast = numbers[^2];  // 8

// 组合使用
int[] middle = numbers[2..^2];  // 排除首尾 {2,3,4,5,6,7}

// 范围变量（C# 8.0+）
Range range = 1..5;
int[] sub = numbers[range];  // {1,2,3,4}
```

### @ - 逐字字符串与保留字转义

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
string path = "C:\\Users\\Name\\Documents";       // 需要双反斜杠
string path2 = @"C:\Users\Name\Documents";     // 单 @ 无需转义

// 3. 多行字符串
string multi = @"
第一行
第二行
";

// 4. 嵌入双引号："" 表示单个 "
string quote = @"他说:""你好""";  // 他说:"你好"
```

### :: - 命名空间别名限定符

访问命名空间别名，优先级高于全局 using：

```csharp
// 定义别名
using Win = System.Windows.Forms;
using Col = System.Collections.Generic;

// 使用别名（:: 确保不会与同名的类型/变量混淆）
var list = new Col::List<string>();  // System.Collections.Generic.List
var form = new Win::Form();

// global:: 始终指向全局命名空间（解决命名冲突）
namespace MyNamespace
{
    class List { }  // 隐藏了 System.Collections.Generic.List

    void Example()
    {
        var a = new List();           // MyNamespace.List
        var b = new global::System.Collections.Generic.List<int>();  // 全局 List
    }
}
```

### $ - 字符串插值

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
string formatted = $"{price:F2}";  // "123.46"
string currency = $"{price:C}";    // "¥123.46"（取决于区域设置）

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

### ..= - 区间运算符（C# 9+）

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

### & | ^ ~ << >> - 位运算符

对整数类型的位进行操作：

```csharp
int a = 5;   // 0101 (二进制)
int b = 3;   // 0011

int and = a & b;   // 0001 = 1  按位与
int or  = a | b;   // 0111 = 7  按位或
int xor = a ^ b;   // 0110 = 6  按位异或（相同为0，不同为1）
int not = ~a;      // ...11111010 = -6 按位取反
int shl = a << 1;  // 1010 = 10 左移（乘2）
int shr = a >> 1;  // 0010 = 2  右移（除2，取整）

// 常用技巧
int flag = 0b0001 | 0b0010 | 0b0100;  // 组合标志位 = 7
bool hasWrite = (flag & 0b0010) != 0;   // 检查是否有写入权限
int addWrite = flag | 0b1000;            // 添加写入权限
int removeWrite = flag & ~0b0010;        // 移除写入权限
```

### => ; - 属性简写（init / get / set）

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

    // with 表达式使用（C# 9+）
    Person updated = person with { Status = "Approved" };
}
```

---

## 总结

C# 关键字速查表：

| 类别           | 关键字                                                                               |
| -------------- | ------------------------------------------------------------------------------------ |
| **访问修饰符** | `public` `private` `protected` `internal`                                            |
| **类型声明**   | `class` `struct` `interface` `enum` `record`                                         |
| **流程控制**   | `if` `else` `switch` `case` `for` `foreach` `while` `do` `break` `continue` `return` |
| **方法参数**   | `void` `this` `base` `ref` `out` `in` `params`                                       |
| **修饰符**     | `static` `readonly` `const` `virtual` `override` `abstract` `sealed` `new`           |
| **异常处理**   | `try` `catch` `finally` `throw`                                                      |
| **类型操作**   | `var` `typeof` `nameof` `as` `is` `default` `checked` `unchecked`                    |
| **泛型**       | `where` `new()`                                                                      |
| **异步**       | `async` `await`                                                                      |
| **命名空间**   | `namespace` `using` `global`                                                         |
| **特殊运算符** | `=>` `?.` `!` `??` `??=` `?:` `..` `^` `@` `$` `::` `&` `\|` `^` `~` `<<` `>>` `..=` |
| **其他**       | `null` `true` `false` `delegate` `event` `yield` `lock` `using`                      |

掌握这些关键字的含义和使用场景，是写出高质量 C# 代码的基础。

---

## 相关资源

- [C# 关键字 - Microsoft Learn](https://learn.microsoft.com/zh-cn/dotnet/csharp/language-reference/keywords/)
- [C# 关键字上下文 - Microsoft Learn](https://learn.microsoft.com/zh-cn/dotnet/csharp/language-reference/keywords/contextual-keywords)
- [修饰符 - Microsoft Learn](https://learn.microsoft.com/zh-cn/dotnet/csharp/language-reference/keywords/modifiers)
