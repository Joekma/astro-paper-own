---
title: C# 类、接口、继承
author: Joekma
pubDatetime: 2026-05-06T00:00:00.000+08:00
modDatetime: 2026-05-06T00:00:00.000+08:00
slug: csharp-class-interface-inheritance
description: '深入学习 C# 中的类定义、面向对象特性、接口实现和继承机制，掌握面向对象编程的核心概念。'
tags:
  - C#
  - 类
  - 接口
  - 继承
  - 面向对象
  - OOP
draft: false
series: csharp
language: zh-CN
---

## 概述

类是 C# 中最核心的概念之一，它是面向对象编程的基础。本文将详细介绍类的定义、对象的创建、继承机制和接口的实现。

### 核心概念速览

| 概念 | 说明 |
|------|------|
| **类** | 引用类型，定义对象的模板 |
| **对象** | 类的实例，通过 `new` 创建 |
| **继承** | 从基类派生新类 |
| **接口** | 定义行为的契约 |
| **多态** | 同一接口的不同实现 |

---

## 类的基本概念

### 什么是类

类是引用类型，用于定义对象的蓝图或模板。在运行时，使用 `new` 关键字创建类的实例。

```csharp
// 声明类
public class Person
{
    // 属性
    public string Name { get; set; }
    public int Age { get; set; }
    
    // 构造函数
    public Person(string name, int age)
    {
        Name = name;
        Age = age;
    }
    
    // 方法
    public void SayHello()
    {
        Console.WriteLine($"你好，我是{Name}，今年{Age}岁");
    }
}
```

### 类声明的组成

```csharp
[访问修饰符] class 类名
{
    // 字段
    // 属性
    // 方法
    // 事件
}
```

### 访问修饰符

| 修饰符 | 说明 |
|--------|------|
| `public` | 公开访问，无限制 |
| `private` | 私有访问，仅限本类 |
| `protected` | 受保护访问，本类及派生类 |
| `internal` | 内部访问，当前程序集 |
| `protected internal` | 受保护或内部访问 |
| `private protected` | 受保护且内部访问 |

---

## 创建对象

### 使用 new 关键字

```csharp
// 创建对象实例
Person person1 = new Person("Alice", 25);
Person person2 = new Person("Bob", 30);

// 调用方法
person1.SayHello();
person2.SayHello();
```

### 对象引用

对象引用指向堆上的实际对象：

```csharp
Person person1 = new Person("Alice", 25);
Person person2 = person1;  // 引用同一个对象

person2.Name = "Charlie";
Console.WriteLine(person1.Name);  // 输出: Charlie
```

### 对象初始化器

简化对象创建：

```csharp
// 传统方式
Person person1 = new Person();
person1.Name = "Alice";
person1.Age = 25;

// 初始化器方式
Person person2 = new Person { Name = "Bob", Age = 30 };

// 匿名对象
var anonymous = new { Name = "Anonymous", Age = 20 };  // 不需要定义类,编译器自动生成一个匿名类型，属性是只读的
```

---

## 构造函数

### 默认构造函数

```csharp
public class Person
{
    public string Name { get; set; }
    
    // 默认构造函数
    public Person()
    {
        Name = "Unknown";
    }
}
```
- 当创建 `Person` 对象时，自动将 `Name` 初始化为 `"Unknown"`
- 不需要显式调用，系统会自动执行默认构造函数

### 带参数的构造函数

```csharp
public class Person
{
    public string Name { get; set; }
    public int Age { get; set; }
    
    // 构造函数重载
    public Person()
    {
        Name = "Unknown";
        Age = 0;
    }
    
    public Person(string name)
    {
        Name = name;
        Age = 0;
    }
    
    public Person(string name, int age)
    {
        Name = name;
        Age = age;
    }
}
```

### 构造函数链

使用 `this` 关键字调用其他构造函数：
在 C# 中，`this` 关键字在这个上下文里指的是当前类的另一个构造函数。

```csharp
public class Person
{
    public string Name { get; set; }
    public int Age { get; set; }
    public string Address { get; set; }
    
    public Person() : this("Unknown", 0, "未知地址")
    {
    }
    
    public Person(string name, int age) : this(name, age, "未知地址")
    {
    }
    
    public Person(string name, int age, string address)
    {
        Name = name;
        Age = age;
        Address = address;
    }
}
```

### 静态构造函数

初始化静态成员：

- 使用 static 关键字
- 不能有参数
- 不能有访问修饰符（public、private 等）
- 只能有一个静态构造函数

```csharp
public class Configuration
{
    public static string AppName { get; set; }
    public static int Version { get; set; }
    
    // 静态构造函数
    static Configuration()
    {
        AppName = "My Application";
        Version = 1;
    }
}
```

**在第一次访问类的任何静态成员之前自动调用，且只调用一次**

```csharp
// 首次访问静态属性时，会触发静态构造函数执行
string name = Configuration.AppName;  // 此时静态构造函数执行
int version = Configuration.Version;   // 不会再执行

// 或者创建实例时也会先触发
Configuration config = new Configuration();  // 也会先执行静态构造函数
```

|场景| 说明|
|--------|------|
|初始化静态字段|设置静态属性的初始值|
|加载配置文件|从文件或数据库读取一次配置|
|注册日志记录器|初始化日志系统|
|创建连接池|数据库连接池等单次初始化|

---

## 属性

### 自动实现属性

```csharp
public class Person
{
    // 自动实现属性
    public string Name { get; set; }
    public int Age { get; set; }
}
```

### 带验证的属性

```csharp
public class Person
{
    private string _name; // 私有字段 - 存储实际数据
    public string Name // 公开属性 - 控制访问逻辑
    {
        get { return _name; }
        set 
        {
            if (string.IsNullOrWhiteSpace(value))
                throw new ArgumentException("姓名不能为空");
            _name = value;
        }
    }
    
    private int _age; // 私有字段 - 存储实际数据
    public int Age // 公开属性 - 控制访问逻辑
    {
        get { return _age; }
        set
        {
            if (value < 0 || value > 150)
                throw new ArgumentException("年龄必须在0-150之间");
            _age = value;
        }
    }
}
```
### 简化写法（C# 7.0+）

```csharp
public class Person
{
    private string _name;
    public string Name
    {
        get => _name;
        set => _name = !string.IsNullOrWhiteSpace(value) 
            ? value 
            : throw new ArgumentException("姓名不能为空");
    }
    
    private int _age;
    public int Age
    {
        get => _age;
        set => _age = value >= 0 && value <= 150
            ? value
            : throw new ArgumentException("年龄必须在0-150之间");
    }
}
```

### 只读属性

```csharp
public class Circle
{
    public double Radius { get; }
    
    public Circle(double radius)
    {
        Radius = radius;
    }
    
    public double Area => Math.PI * Radius * Radius;
}
```

---

## 继承

### 基类和派生类

继承允许创建一个基于现有类的新类：

```csharp
// 基类
public class Animal
{
    public string Name { get; set; }
    
    public void Eat()
    {
        Console.WriteLine($"{Name} 正在吃东西");
    }
}

// 派生类
public class Dog : Animal
{
    public void Bark()
    {
        Console.WriteLine($"{Name} 汪汪叫");
    }
}
```

### 使用派生类

```csharp
Dog dog = new Dog();
dog.Name = "旺财";
dog.Eat();   // 继承自 Animal
dog.Bark();  // Dog 特有
```

### 继承的特性

| 特性 | 说明 |
|------|------|
| 单继承 | 类只能继承一个基类 |
| 构造函数不继承 | 派生类必须定义自己的构造函数 |
| 所有成员被继承 | 字段、方法、属性都会被继承 |
| 密封类 | 使用 `sealed` 防止被继承 |

---

## 多态性

### 虚方法和重写

```csharp
public class Animal
{
    public string Name { get; set; }
    
    // 虚方法
    public virtual void MakeSound()  // 虚方法 - 可以被重写
    {
        Console.WriteLine($"{Name} 发出声音");
    }
}

public class Dog : Animal
{
    // 重写基类方法
    public override void MakeSound()  // 重写基类方法 - 可以在派生类中实现不同的行为
    {
        Console.WriteLine($"{Name} 汪汪叫");
    }
}

public class Cat : Animal
{
    public override void MakeSound()  // 重写基类方法 - 可以在派生类中实现不同的行为
    {
        Console.WriteLine($"{Name} 喵喵叫");
    }
}
```

### 使用多态

```csharp
Animal animal1 = new Dog { Name = "旺财" };
Animal animal2 = new Cat { Name = "咪咪" };

animal1.MakeSound();  // 输出: 旺财 汪汪叫
animal2.MakeSound();  // 输出: 咪咪 喵喵叫
```

### 抽象类和抽象方法

- 抽象类不能被实例化
- 抽象成员没有实现（无方法体）
- 派生类必须实现所有抽象成员（除非派生类也是抽象的）

```csharp
// 抽象类
public abstract class Shape
{
    public abstract double Area { get; }  // 抽象属性 - 必须在派生类中实现
    
    public abstract void Draw();  // 抽象方法 - 必须在派生类中实现
}

// 抽象方法必须在派生类中实现
public class Rectangle : Shape
{
    public double Width { get; set; }
    public double Height { get; set; }
    
    public override double Area => Width * Height;
    
    public override void Draw()
    {
        Console.WriteLine($"绘制矩形: {Width}x{Height}");
    }
}

public class Circle : Shape
{
    public double Radius { get; set; }
    
    public override double Area => Math.PI * Radius * Radius;
    
    public override void Draw()
    {
        Console.WriteLine($"绘制圆形: 半径{Radius}");
    }
}
```

---

## 接口

### 定义接口

接口定义行为的契约：

```csharp
// 定义接口
public interface IComparable
{
    int CompareTo(object obj);
}

public interface IComparable<T>
{
    int CompareTo(T other);
}

public interface IDisposable
{
    void Dispose();
}

public interface IEnumerable
{
    IEnumerator GetEnumerator();
}
```

### 实现接口

```csharp
public class Person : IComparable<Person>
{
    public string Name { get; set; }
    public int Age { get; set; }
    
    // 实现接口方法
    public int CompareTo(Person other)
    {
        if (other == null) return 1;
        return this.Age.CompareTo(other.Age);
    }
}
```

### 接口与类的区别

| 特性 | 类 | 接口 |
|------|-----|------|
| 继承 | 单继承 | 多实现 |
| 成员 | 可以有实现 | C# 8.0 前只能声明 |
| 字段 | 可以有实例字段 | 不能有实例字段 |
| 构造函数 | 可以有 | 不能有 |
| 多态 | 通过继承实现 | 通过实现实现 |

### 接口继承

```csharp
public interface IReadable
{
    void Read();
}

public interface IWritable
{
    void Write();
}

// 继承多个接口
public interface IFile : IReadable, IWritable
{
    void Delete();
}

public class TextFile : IFile
{
    public void Read()
    {
        Console.WriteLine("读取文件");
    }
    
    public void Write()
    {
        Console.WriteLine("写入文件");
    }
    
    public void Delete()
    {
        Console.WriteLine("删除文件");
    }
}
```

---

## 密封类和方法

使用 `sealed` 防止类被继承或方法被重写：

```csharp
// 密封类，不能被继承
public sealed class Singleton
{
    private static Singleton _instance;
    
    public static Singleton Instance
    {
        get
        {
            if (_instance == null)
                _instance = new Singleton();
            return _instance;
        }
    }
    
    private Singleton() { }
}

// 密封方法
public class BaseClass
{
    public virtual void Method() { }
}

public class DerivedClass : BaseClass
{
    public sealed override void Method() { }  // 阻止进一步重写
}
```

---

## 部分类和方法

可以将类定义拆分到多个文件中：

```csharp
// File1.cs
public partial class Customer
{
    public string Name { get; set; }
}

// File2.cs
public partial class Customer
{
    public void Save()
    {
        Console.WriteLine($"保存客户: {Name}");
    }
}
```

---

## 静态类

静态类只能包含静态成员，不能被实例化：

```csharp
public static class MathHelper
{
    public static double PI => 3.14159;
    
    public static int Max(int a, int b) => a > b ? a : b;
    
    public static int Min(int a, int b) => a < b ? a : b;
    
    public static bool IsPrime(int number)
    {
        if (number < 2) return false;
        for (int i = 2; i <= Math.Sqrt(number); i++)
        {
            if (number % i == 0) return false;
        }
        return true;
    }
}

// 使用
Console.WriteLine(MathHelper.Max(5, 10));
Console.WriteLine(MathHelper.PI);
```

---

## 实用示例

### 示例1：银行账户系统

```csharp
public abstract class BankAccount
{
    public string AccountNumber { get; }
    public decimal Balance { get; protected set; }
    
    protected BankAccount(string accountNumber, decimal initialBalance)
    {
        AccountNumber = accountNumber;
        Balance = initialBalance;
    }
    
    public abstract void Deposit(decimal amount);
    public abstract void Withdraw(decimal amount);
    
    public void PrintBalance()
    {
        Console.WriteLine($"账户 {AccountNumber} 余额: {Balance:C}");
    }
}

public class SavingsAccount : BankAccount
{
    public decimal InterestRate { get; }
    
    public SavingsAccount(string accountNumber, decimal initialBalance, decimal interestRate)
        : base(accountNumber, initialBalance)
    {
        InterestRate = interestRate;
    }
    
    public override void Deposit(decimal amount)
    {
        if (amount <= 0)
            throw new ArgumentException("存款金额必须为正数");
        Balance += amount;
        Console.WriteLine($"存款成功: {amount:C}");
    }
    
    public override void Withdraw(decimal amount)
    {
        if (amount <= 0)
            throw new ArgumentException("取款金额必须为正数");
        if (amount > Balance)
            throw new InvalidOperationException("余额不足");
        Balance -= amount;
        Console.WriteLine($"取款成功: {amount:C}");
    }
    
    public void CalculateInterest()
    {
        decimal interest = Balance * InterestRate;
        Balance += interest;
        Console.WriteLine($"利息: {interest:C}, 新余额: {Balance:C}");
    }
}
```

### 示例2：形状计算器

```csharp
public interface IShape
{
    double Area { get; }
    double Perimeter { get; }
}

public class Rectangle : IShape
{
    public double Width { get; set; }
    public double Height { get; set; }
    
    public double Area => Width * Height;
    public double Perimeter => 2 * (Width + Height);
}

public class Circle : IShape
{
    public double Radius { get; set; }
    
    public double Area => Math.PI * Radius * Radius;
    public double Perimeter => 2 * Math.PI * Radius;
}

public class Triangle : IShape
{
    public double A { get; set; }
    public double B { get; set; }
    public double C { get; set; }
    
    public double Area
    {
        get
        {
            double s = (A + B + C) / 2;
            return Math.Sqrt(s * (s - A) * (s - B) * (s - C));
        }
    }
    
    public double Perimeter => A + B + C;
}

// 使用多态计算面积
public static class AreaCalculator
{
    public static double TotalArea(params IShape[] shapes)
    {
        double total = 0;
        foreach (var shape in shapes)
        {
            total += shape.Area;
        }
        return total;
    }
}
```

---

## 常见错误

### 1. 忘记调用 base 构造函数

```csharp
// ❌ 错误
public class Derived : Base
{
    public Derived(int value)
    {
        // 没有初始化基类
    }
}

// ✅ 正确
public class Derived : Base
{
    public Derived(int value) : base(value)
    {
    }
}
```

### 2. 隐藏而非重写

```csharp
public class Base
{
    public void Method() { }
}

public class Derived : Base
{
    public new void Method() { }  // 隐藏，不是重写
}
```

### 3. 抽象类实例化

```csharp
public abstract class Shape { }

Shape s = new Shape();  // ❌ 编译错误

Shape s = new Circle();  // ✅ 正确，使用派生类实例化
```

---

## 总结

| 概念 | 说明 |
|------|------|
| **类** | 引用类型，定义对象模板 |
| **对象** | 类的实例，通过 `new` 创建 |
| **构造函数** | 初始化对象 |
| **属性** | 封装字段的访问器 |
| **继承** | 从基类派生新类 |
| **虚方法** | 可被重写的方法 |
| **抽象类** | 不能实例化的基类 |
| **接口** | 行为的契约 |

---

## 相关资源

- [C# 类文档](https://learn.microsoft.com/zh-cn/dotnet/csharp/fundamentals/types/classes)
- [接口文档](https://learn.microsoft.com/zh-cn/dotnet/csharp/fundamentals/types/interfaces)
- [继承文档](https://learn.microsoft.com/zh-cn/dotnet/csharp/fundamentals/object-oriented/inheritance)
