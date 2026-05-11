---
title: Python 字符串格式化：%、format()、f string详解
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-05-03T00:00:00.000+08:00
slug: python-string-formatting-guide
description: '深入讲解Python的三种字符串格式化方式：传统%格式化、format()方法和f-string，详解对齐、补位、精度控制、进制转换等实战技巧。'
tags:
  - Python
  - 字符串格式化
  - f-string
  - format
draft: false
series: python
language: zh-CN
---

> 在 Python 中，字符串格式化是非常高频的基础能力。无论是打印日志、拼接提示信息，还是构造 SQL、接口参数，都离不开格式化输出。本文将详细介绍三种主流的格式化方式。

## 简介

Python 中常见的格式化方式主要有三种：

- 传统的 `%` 格式化
- 功能更完整的 `str.format()`
- 语法更简洁的 f-string

## 为什么需要格式化输出

如果只是简单拼接字符串，往往会写出可读性较差的代码：

```python
name = "Jack"
age = 18
print("my name is " + name + ", age is " + str(age))
```

格式化输出的价值在于：

- 让代码更简洁
- 让数字、字符串、日期等类型输出更可控
- 支持对齐、补位、保留小数、百分比等显示需求

## % 格式化的基本用法

`%` 是 Python 中较早的格式化方案，语法直观，适合基础场景。

### 整数输出

常见格式说明符：

- `%o`：八进制
- `%d`：十进制
- `%x`：十六进制

```python
print('%o' % 20)   # 24
print('%d' % 20)   # 20
print('%x' % 20)   # 14
```

### 浮点数输出

常见格式说明符：

- `%f`：普通浮点数，默认保留 6 位小数
- `%.3f`：保留 3 位小数
- `%e`：科学计数法
- `%g`：在普通表示法与科学计数法之间自动切换

```python
print('%f' % 1.11)      # 默认保留 6 位小数
print('%.1f' % 1.11)    # 保留 1 位小数
print('%e' % 1.11)      # 科学计数法
print('%.3e' % 1.11)    # 科学计数法，保留 3 位小数
print('%g' % 1111.1111) # 自动选择格式
print('%.7g' % 1111.1111)
print('%.2g' % 1111.1111)
```

### 字符串输出

常见格式说明符：

- `%s`：字符串
- `%10s`：右对齐，占 10 位
- `%-10s`：左对齐，占 10 位
- `%.2s`：截取前 2 个字符

```python
print('%s' % 'hello world')
print('%20s' % 'hello world')
print('%-20s' % 'hello world')
print('%.2s' % 'hello world')
print('%10.2s' % 'hello world')
print('%-10.2s' % 'hello world')
```

### 常用 % 格式代码

| 代码 | 说明 |
|------|------|
| `%s` | 字符串 |
| `%c` | 字符 |
| `%d` | 十进制整数 |
| `%i` | 整数 |
| `%u` | 无符号整数 |
| `%o` | 八进制整数 |
| `%x` | 十六进制整数 |
| `%X` | 大写十六进制整数 |
| `%e` | 科学计数法（小写） |
| `%E` | 科学计数法（大写） |
| `%f` | 浮点数 |
| `%g` | 自动选择浮点显示方式 |
| `%G` | 自动选择浮点显示方式（大写） |
| `%%` | 输出百分号本身 |

### 常用转义字符

| 转义字符 | 说明 |
|---------|------|
| `\\` | 反斜杠 |
| `\'` | 单引号 |
| `\"` | 双引号 |
| `\a` | 响铃 |
| `\b` | 退格 |
| `\n` | 换行 |
| `\v` | 纵向制表符 |
| `\t` | 横向制表符 |
| `\r` | 回车 |
| `\f` | 换页 |

## format() 的常见写法

相比 `%`，`format()` 更灵活，适合更复杂的格式化需求。

### 位置匹配

`format()` 支持按位置、编号和关键字进行匹配。

```python
print('{} {}'.format('hello', 'world'))
print('{0} {1}'.format('hello', 'world'))
print('{0} {1} {0}'.format('hello', 'world'))
print('{1} {1} {0}'.format('hello', 'world'))
print('{a} {tom} {a}'.format(tom='hello', a='world'))
```

### 通过位置匹配对象

```python
print('{0}, {1}, {2}'.format('a', 'b', 'c'))
print('{}, {}, {}'.format('a', 'b', 'c'))
print('{2}, {1}, {0}'.format('a', 'b', 'c'))
print('{2}, {1}, {0}'.format(*'abc'))
print('{0}{1}{0}'.format('abra', 'cad'))
```

### 通过名字匹配对象

```python
print('Coordinates: {latitude}, {longitude}'.format(
    latitude='37.24N',
    longitude='-115.81W'
))

coord = {'latitude': '37.24N', 'longitude': '-115.81W'}
print('Coordinates: {latitude}, {longitude}'.format(**coord))
```

### 通过对象属性匹配

```python
c = 3 - 5j
print(
    'The complex number {0} is formed from the real part {0.real} '
    'and the imaginary part {0.imag}.'.format(c)
)


class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y

    def __str__(self):
        return 'Point({self.x}, {self.y})'.format(self=self)


print(Point(4, 2))
```

### 通过下标或 key 取值

```python
coord = (3, 5)
print('X: {0[0]}; Y: {0[1]}'.format(coord))

a = {'a': 'test_a', 'b': 'test_b'}
print('X: {0[a]}; Y: {0[b]}'.format(a))
```

### 常见格式转换

```python
print('{0:b}'.format(3))
print('{:c}'.format(20))
print('{:d}'.format(20))
print('{:o}'.format(20))
print('{:x}'.format(20))
print('{:e}'.format(20))
print('{:g}'.format(20.1))
print('{:f}'.format(20))
print('{:n}'.format(20))
print('{:%}'.format(20))
```

常见转换含义：

- `b`：二进制
- `c`：字符
- `d`：十进制整数
- `o`：八进制
- `x`：十六进制
- `e`：科学计数法
- `g`：自动选择显示方式
- `%`：百分比

## 进阶格式控制

### 进制转换

```python
print("int: {0:d}; hex: {0:x}; oct: {0:o}; bin: {0:b}".format(42))
print("int: {0:d}; hex: {0:#x}; oct: {0:#o}; bin: {0:#b}".format(42))
```

### 对齐与补位

对齐控制符：

- `<`：左对齐
- `>`：右对齐
- `^`：居中对齐
- `=`：数字补位时常用

```python
print('{} and {}'.format('hello', 'world'))
print('{:10s} and {:>10s}'.format('hello', 'world'))
print('{:^10s} and {:^10s}'.format('hello', 'world'))
print('{} is {:.2f}'.format(1.123, 1.123))
print('{0} is {0:>10.2f}'.format(1.123))

print('{:<30}'.format('left aligned'))
print('{:>30}'.format('right aligned'))
print('{:^30}'.format('centered'))
print('{:*^30}'.format('centered'))
print('{:0=30}'.format(11))
```

### 正负号显示

```python
print('{:+f}; {:+f}'.format(3.14, -3.14))
print('{: f}; {: f}'.format(3.14, -3.14))
print('{:-f}; {:-f}'.format(3.14, -3.14))
```

### 百分数输出

```python
points = 19
total = 22
print('Correct answers: {:.2%}'.format(points / total))
```

### 时间格式化

```python
import datetime

d = datetime.datetime(2010, 7, 4, 12, 15, 58)
print('{:%Y-%m-%d %H:%M:%S}'.format(d))
```

### 千分位分隔

```python
print('{:,}'.format(1234567890))
```

### 占位符嵌套

```python
for align, text in zip('<^>', ['left', 'center', 'right']):
    print('{0:{fill}{align}16}'.format(text, fill=align, align=align))

octets = [192, 168, 0, 1]
print('{:02X}{:02X}{:02X}{:02X}'.format(*octets))

width = 5
for num in range(5, 12):
    for base in 'dXob':
        print('{0:{width}{base}}'.format(num, base=base, width=width), end=' ')
    print()
```

### !s、!r 与 !a

`format()` 还支持调用不同的字符串转换方式：

- `!s`：调用 `str()`
- `!r`：调用 `repr()`
- `!a`：调用 `ascii()`

```python
print("repr() shows quotes: {!r}; str() doesn't: {!s}".format('test1', 'test2'))
```

## %、format() 与 f-string 的对比

### %

**优点**：
- 写法短
- 基础场景足够用

**缺点**：
- 可读性和扩展性一般
- 复杂场景不如 `format()` 和 f-string 灵活

### format()

**优点**：
- 功能完整
- 格式控制能力强

**缺点**：
- 写法比 f-string 稍显冗长

### f-string

f-string 是现代 Python 中最推荐的字符串格式化方式，语法简洁、可读性强。

```python
name = "小明"
age = 25
print(f"我叫{name}，今年{age}岁")       # 我叫小明，今年25岁
print(f"明年我{age + 1}岁")             # 支持表达式
print(f"大写名字：{name.upper()}")      # 支持方法调用
```

## 使用建议

### 1. 新项目优先使用 f-string

如果你的 Python 版本支持 f-string，优先使用它。它通常是最清晰、最自然的写法。

### 2. 需要复杂模板时使用 format()

当你要按位置、按名称、按对象属性或下标取值时，`format()` 仍然非常实用。

### 3. 维护旧代码时理解 % 很重要

很多老项目、日志代码和第三方示例里仍然大量使用 `%`，因此它依然值得掌握。

## 小结

| 方式 | 特点 | 适用场景 |
|------|------|---------|
| `%` | 传统、简单 | 快速输出、简单格式化 |
| `format()` | 功能完整 | 复杂格式模板 |
| f-string | 现代、简洁 | 新项目首选 |

实际开发中可以这样选：

- **快速输出变量**：优先 f-string
- **复杂格式模板**：优先 `format()`
- **维护旧项目**：读懂并会用 `%`

掌握这三种格式化方式，可以让你的 Python 代码更加优雅和易读。
