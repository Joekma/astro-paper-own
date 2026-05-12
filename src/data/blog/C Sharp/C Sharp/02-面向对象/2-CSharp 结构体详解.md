---
title: C# 结构体详解
author: Joekma
pubDatetime: 2026-05-07T00:00:00.000+08:00
modDatetime: 2026-05-07T00:00:00.000+08:00
slug: csharp-struct
description: "深入学习 C# 结构体，掌握结构体与类的区别、readonly 结构体、记录类型等核心概念和使用场景。"
tags:
  - C#
  - 结构体
  - Struct
  - 值类型
  - 记录类型
  - Record
draft: false
series: csharp
language: zh-CN
---

## 概述

结构体（Struct）是 C# 中与类相似但有重要区别的类型。理解结构体与类的差异，能帮助你在不同场景下做出更好的设计选择。

### 结构体 vs 类

| 特性               | 结构体       | 类       |
| ------------------ | ------------ | -------- |
| **类型**           | 值类型       | 引用类型 |
| **存储位置**       | 栈（通常）   | 堆       |
| **复制方式**       | 完整副本     | 引用传递 |
| **默认构造函数**   | 不允许自定义 | 允许     |
| **继承**           | 不支持       | 支持     |
| **可以有析构函数** | 否           | 是       |

---

## 基本定义

### 声明结构体

```csharp
public struct Point
{
    public double X { get; set; }
    public double Y { get; set; }

    public Point(double x, double y)
    {
        X = x;
        Y = y;
    }

    public double DistanceTo(Point other)
    {
        double dx = X - other.X;
        double dy = Y - other.Y;
        return Math.Sqrt(dx * dx + dy * dy);
    }
}
```

### 使用结构体

```csharp
Point p1 = new Point(0, 0);
Point p2 = new Point(3, 4);

Console.WriteLine($"距离: {p1.DistanceTo(p2)}");  // 3
```

---

## 结构体与类的核心区别

### 值类型 vs 引用类型

```csharp
// 类 - 引用类型
class PersonClass
{
    public string Name { get; set; }
}

PersonClass a = new PersonClass();
a.Name = "Alice";
PersonClass b = a;        // b 指向同一个对象
b.Name = "Bob";
Console.WriteLine(a.Name);  // "Bob" - 修改互相影响

// 结构体 - 值类型
struct PersonStruct
{
    public string Name { get; set; }
}

PersonStruct p1 = new PersonStruct();
p1.Name = "Alice";
PersonStruct p2 = p1;     // p2 是独立的副本
p2.Name = "Bob";
Console.WriteLine(p1.Name);  // "Alice" - 互不影响
```

### 内存分配

```csharp
// 类对象 - 在堆上分配，通过引用访问
var obj = new MyClass();

// 结构体变量 - 直接存储值（在栈上或作为另一对象的一部分）
var point = new Point(1, 2);
```

### 赋值行为

```csharp
struct Rectangle
{
    public double Width { get; set; }
    public double Height { get; set; }
}

Rectangle rect1 = new Rectangle { Width = 10, Height = 5 };
Rectangle rect2 = rect1;      // 创建完整副本
rect2.Width = 20;

Console.WriteLine(rect1.Width);  // 10（未被修改）
Console.WriteLine(rect2.Width);  // 20
```

---

## 结构体的限制

### 不能有用户定义的无参构造函数

```csharp
struct InvalidStruct
{
    public int Value;

    // 错误：不能定义无参构造函数
    public InvalidStruct()
    {
        Value = 0;
    }
}

// 正确：结构体自动有无参构造函数
struct ValidStruct
{
    public int Value { get; set; }
}

var s = new ValidStruct();  // 调用隐式无参构造函数
Console.WriteLine(s.Value);  // 0（默认值）
```

### 不能继承其他结构体或类

```csharp
// 错误：结构体不能继承
struct BaseStruct { }
struct DerivedStruct : BaseStruct { }

// 正确：可以实现接口
struct ReadOnlyPoint : IEquatable<ReadOnlyPoint>
{
    public double X { get; init; }
    public double Y { get; init; }

    public bool Equals(ReadOnlyPoint other)
    {
        return X == other.X && Y == other.Y;
    }
}
```

---

## readonly 结构体

### 使用 readonly 修饰符

```csharp
readonly struct ImmutablePoint
{
    public double X { get; }
    public double Y { get; }

    public ImmutablePoint(double x, double y)
    {
        X = x;
        Y = y;
    }

    // 只能调用其他 readonly 成员
    public double DistanceToOrigin() => Math.Sqrt(X * X + Y * Y);
}
```

### readonly 与 ref

```csharp
readonly struct Color
{
    public byte R { get; }
    public byte G { get; }
    public byte B { get; }

    public Color(byte r, byte g, byte b)
    {
        R = r; G = g; B = b;
    }
}

// 引用传递，但防止修改
void ProcessColor(in Color color)
{
    Console.WriteLine($"RGB: {color.R}, {color.G}, {color.B}");
    // color.R = 255;  // 错误：不能修改 in 参数
}
```

---

## ref 结构体

### ref struct 的限制

ref struct 只能存在于栈上，不能装箱或作为类的字段：

```csharp
ref struct SpanExample
{
    private Span<int> _data;

    public SpanExample(int[] data)
    {
        _data = data;
    }
}
```

### 使用 Span\<T\>

```csharp
void ProcessData(Span<int> data)
{
    for (int i = 0; i < data.Length; i++)
    {
        data[i] *= 2;
    }
}

int[] numbers = { 1, 2, 3, 4, 5 };
Span<int> span = numbers;
ProcessData(span);
Console.WriteLine(string.Join(", ", numbers));  // 2, 4, 6, 8, 10
```

---

## 何时使用结构体

### 适用场景

| 场景             | 说明                             |
| ---------------- | -------------------------------- |
| **小数据结构**   | 只包含少量数据，如点、坐标、颜色 |
| **不可变数据**   | 创建后不希望被修改               |
| **值语义**       | 赋值时需要完整复制而不是引用     |
| **性能关键**     | 避免堆分配和垃圾回收开销         |
| **频繁创建销毁** | 大量短期存在的轻量对象           |

### 不适用场景

| 场景                 | 说明                       |
| -------------------- | -------------------------- |
| **大型数据**         | 结构体太大会导致拷贝开销大 |
| **需要继承**         | 必须用类                   |
| **需要持有大量实例** | 栈空间有限                 |
| **需要线程共享**     | 需要引用语义               |

### 经典示例

```csharp
// 适合用结构体：简单数据结构
public readonly struct Vector3
{
    public float X { get; }
    public float Y { get; }
    public float Z { get; }

    public Vector3(float x, float y, float z) => (X, Y, Z) = (x, y, z);

    public float Length => MathF.Sqrt(X * X + Y * Y + Z * Z);
    public Vector3 Normalize() => this / Length;
    public static Vector3 operator *(Vector3 v, float scalar) => new(v.X * scalar, v.Y * scalar, v.Z * scalar);
    public static Vector3 operator /(Vector3 v, float scalar) => new(v.X / scalar, v.Y / scalar, v.Z / scalar);
}

// 不适合用结构体：复杂业务对象
public class Customer
{
    public string Name { get; set; }
    public List<Order> Orders { get; set; }
    public Address Address { get; set; }
    // 大量属性和方法...
}
```

---

## 结构体的初始化

### 使用对象初始化器

```csharp
struct Dimensions
{
    public int Width { get; set; }
    public int Height { get; set; }
}

Dimensions d = new Dimensions { Width = 100, Height = 50 };
```

### 简洁语法 (C# 12+)

```csharp
readonly struct RGBColor
{
    public byte R { get; init; }
    public byte G { get; init; }
    public byte B { get; init; }
}

// C# 12 支持在类外使用 primary constructor
RGBColor red = new(255, 0, 0);
```

### 使用 with 表达式 (C# 9+)

```csharp
readonly struct Config
{
    public string Host { get; init; }
    public int Port { get; init; }
}

Config defaultConfig = new() { Host = "localhost", Port = 8080 };
Config devConfig = defaultConfig with { Host = "dev.local", Port = 3000 };
```

---

## 结构体与接口

### 实现接口

```csharp
interface IComparable<T>
{
    int CompareTo(T other);
}

struct Temperature : IComparable<Temperature>
{
    public double Celsius { get; }

    public Temperature(double celsius) => Celsius = celsius;

    public int CompareTo(Temperature other)
    {
        return Celsius.CompareTo(other.Celsius);
    }
}
```

### 装箱和拆箱

```csharp
int number = 42;
object obj = number;     // 装箱 - 包装成引用类型
int recovered = (int)obj;  // 拆箱 - 恢复为值类型

// 结构体也会发生装箱
Point point = new Point(1, 2);
object boxed = point;    // 装箱 - 创建临时的堆对象
Point unboxed = (Point)boxed;  // 拆箱
```

---

## 记录类型 (Record)

### ref struct 简介

Record 是 C# 9 引入的特殊结构体，专为不可变数据设计：

```csharp
// 引用记录
public record Person(string Name, int Age);

// 值记录 (C# 10+)
public readonly record struct Point(double X, double Y);

// 使用
Person person = new("Alice", 30);
Person clone = person with { Age = 31 };  // 创建副本
```

### Record vs Struct

| 特性        | Struct            | Record               |
| ----------- | ----------------- | -------------------- |
| 不可变性    | 需要手动 readonly | 自动生成的 init 属性 |
| 值相等      | 逐字段比较        | 逐字段比较           |
| with 表达式 | C# 9+ 支持        | 原生支持             |
| 继承        | 不支持            | 支持                 |

### 选择建议

```csharp
// 小型不可变数据 → Record
public record UserDto(int Id, string Name, string Email);

// 需要可变性 → Struct
public struct MutablePoint { public double X, Y; }

// 需要继承 → Class
public class Entity { }
public class User : Entity { }
```

---

## 最佳实践

### 设计原则

| 建议                 | 说明                       |
| -------------------- | -------------------------- |
| **保持小而轻量**     | 结构体应小于 16 字节       |
| **设计为不可变**     | 使用 readonly，成员用 init |
| **值语义**           | 确保拷贝行为符合预期       |
| **实现 IEquatable**  | 支持正确的相等性比较       |
| **实现 IComparable** | 支持排序操作               |

### 代码示例

```csharp
public readonly struct Fraction : IEquatable<Fraction>, IComparable<Fraction>
{
    public int Numerator { get; }
    public int Denominator { get; }

    public Fraction(int numerator, int denominator)
    {
        if (denominator == 0)
            throw new ArgumentException("分母不能为零", nameof(denominator));

        Numerator = numerator;
        Denominator = denominator;
    }

    public bool Equals(Fraction other) =>
        Numerator == other.Numerator && Denominator == other.Denominator;

    public override bool Equals(object? obj) => obj is Fraction f && Equals(f);

    public override int GetHashCode() => HashCode.Combine(Numerator, Denominator);

    public int CompareTo(Fraction other) =>
        (Numerator * other.Denominator).CompareTo(other.Numerator * Denominator);
}
```

---

## 总结

结构体是 C# 中重要的值类型：

1. **值语义** - 赋值时创建完整副本
2. **栈存储** - 通常分配在栈上，无垃圾回收开销
3. **无继承** - 不能继承类或结构体
4. **readonly** - 用于不可变数据结构
5. **记录类型** - C# 9+ 提供的不可变数据专用类型

合理使用结构体可以提升性能，但要注意值类型的特点和适用场景。
