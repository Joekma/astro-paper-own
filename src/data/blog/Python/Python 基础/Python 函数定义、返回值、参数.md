---
title: Python 函数定义、返回值、参数
author: 程序员
pubDatetime: 2018-08-16T00:00:00.000+08:00
updated: 2026-04-22T00:00:00.000+08:00
slug: python-functions-definition-return-values-parameters
description: '深入理解 Python 函数定义、返回值、各种参数类型以及深拷贝与浅拷贝'
tags:
  - Python
  - 函数
  - 参数
  - 返回值
  - 深拷贝
  - 浅拷贝
category: Python
draft: false
language: zh-CN
---

> 函数是 Python 编程的核心概念之一。本文将详细介绍函数的定义、返回值、各种参数类型以及深拷贝与浅拷贝的概念，帮助你掌握函数的高级用法。

## 函数的定义

### 基本概念

**函数名**：
- 必须由字母、下划线、数字组成
- 不能是关键字
- 不能是数字开头
- 应该有意义，能够简单说明函数的功能

**def** 是定义函数的关键字

**函数的基本结构**：

```python
def 函数名():
    '''
    函数的文档字符串，用于说明函数功能
    '''
    # 函数体
    return 返回值
```

### 函数调用

函数名 + 括号即可调用函数

```python
def strlen():
    '''
    计算字符串长度的函数
    '''
    s = 'hello world'
    length = 0
    for i in s:
        length += 1
    return length

leng = strlen()  # 调用函数
print(leng)  # 输出: 11
```

## 函数调用的三种形式

```python
# 1. 语句形式
register()

# 2. 表达式形式
def max2(x, y):
    if x > y:
        return x
    else:
        return y

res = max2(10, 20) * 12

# 3. 作为其他函数的参数
res = max2(max2(10, 20), 30)
print(res)  # 输出: 30
```

## 函数的返回值

### 返回值的几种情况

1. **返回任意数据类型**：函数返回值可以是任意的数据类型
2. **必须用变量接收**：如果有返回值，必须要用变量接收才会有效果
3. **没有返回值**：函数可以没有返回值，默认返回 `None`

   函数返回值为 `None` 的三种情况：
   - 不写返回值
   - 只写一个 `return`
   - `return None`

4. **`return` 的双重功能**：
   - 返回值的功能
   - 结束函数执行的功能（函数内可以有多个 `return`，但只要执行一次，整个函数就立即结束）

### 返回单个值和多个值

```python
# 返回一个值
def func1():
    return 1

# 返回多个值（以元组形式返回）
def func2():
    return 1, 2, 3

result1 = func1()
result2 = func2()

print(result1)  # 1
print(result2)  # (1, 2, 3)

# 可以用多个变量接收（解压式接收）
a, b, c = func2()
print(a, b, c)  # 1 2 3
```

## 函数的参数

### 基本概念

- **`实参`**：函数调用的时候传入的参数
- **`形参`**：函数定义的时候括号内的参数
### 定义阶段的形参

#### 默认形参

在定义阶段就已经为形参赋值，该形参称之为默认参数。

**特点**：
1. 定义阶段就已经有值意味着调用阶段可以不用传值
2. 位置形参必须放到默认形参的前面
3. 默认形参的值在函数定义阶段就已经固定死了，定义阶段之后的改动不会影响该值
4. 默认形参的值通常应该是不可变类型

```python
def stu_info(name, sex='male'):
    print('name: %s, sex: %s' % (name, sex))

stu_info('zioe')           # 默认参数可以不传值
stu_info('joek', 'male')   # 如果传值了，覆盖默认值
```

**默认参数形成流程**：

```python
s = 'male'

def stu_info(name, sex=s):
    print('name: %s, sex: %s' % (name, sex))

s = 'female'  # 不影响定义时 sex 的值
print(stu_info("张三"))  # 打印出来的就是 male
```

> **重要**：不要设置可变数据类型为默认参数！

```python
b = []

def func(a=[]):
    a.append(1)
    print(a)

func()  # [1]
func()  # [1, 1]  ← 问题所在！
```

#### 位置形参

在定义阶段，按照从左到右的顺序依次定义的形参称之为位置形参。

**特点**：但凡按照位置定义的形参，必须被传值，多一个不行少一个也不行。

```python
def func(x, y, z):
    print(x, y, z)

func(1, 2)      # 报错：缺少参数
func(1, 2, 3)   # 正确
func(1, 2, 3, 4)  # 报错：参数过多
```

### 调用阶段的实参

#### 位置实参

在调用阶段，按照从左到右的顺序依次传入的值称之为位置实参。

**特点**：与形参一一对应。

```python
def my_max(a, b):
    '''返回两个值之间的最大值'''
    print(a, b)
    if a > b:
        return a
    else:
        return b

print(my_max(10, 20))
print(my_max(30, 20))
```

#### 关键字实参

在调用阶段，按照 `key=value` 的形式定义的实参称之为关键字实参。

**特点**：可以完全打乱顺序，但仍然能为指定的形参传值（指名道姓地为指定的形参传值）。

```python
def func(x, y, z):
    print(x, y, z)

func(x=1, y=2, z=3)
func(1, 2, 3)
func(z=3, y=2, x=1)
```

#### 混合使用规则

实参的形式可以是位置实参与关键字实参混合使用，但必须遵循原则：
1. 位置实参必须放在关键字实参的前面
2. 不能对同一个形参重复传值

### 可变长参数

可变长实参指的是在调用阶段，实参值个数是不固定的。

实参无非两种形式（位置、关键字实参），对应着形参也必须有两种解决方案：
- `*` → 溢出的位置实参
- `**` → 溢出的关键字实参

#### * 的用法

**在形参前加 `*`**：会将溢出的位置实参存成元组的形式，然后赋值给 `*` 后的形参名

```python
def sum2(*x):
    # x = (1, 2, 3, 4, 5)
    res = 0
    for i in x:
        res += i
    return res

print(sum2(1, 2, 3, 4, 5))  # 15

def func(x, y, *z):
    # z = (3, 4, 5)
    print(x, y, z)

func(1, 2, 3, 4, 5)
```

**在实参前加 `*`**：但凡碰到实参中带 `*` 的，先将实参打散成位置实参再与形参做对应

```python
def func(x, y, z):
    print(x, y, z)

func(1, 2, [3, 4, 5])
func(*[1, 2, 3, 4, 5])  # func(1, 2, 3, 4, 5)
func(*[1, 2, 3])         # func(1, 2, 3)

def func(x, y, *z):
    print(x, y, z)

func(1111, 2222, *[1, 2, 3, 4, 5])  # func(1111, 2222, 1, 2, 3, 4, 5)
```

#### ** 的用法

**在形参前加 `**`**：会将溢出的关键字实参存成字典的形式，然后赋值给 `**` 后的形参名

```python
def func(x, y, **z):
    # z = {'c': 3, 'b': 2, 'a': 1}
    print(x, y, z)

func(1, y=2, a=1, b=2, c=3)
```

**在实参前加 `**`**：但凡碰到实参中带 `**` 的，先将实参打散成关键字实参再与形参做对应

```python
def func(x, y, z):
    print(x, y, z)

func(1, **{'y': 2, 'z': 3})       # func(1, z=3, y=2)
func(1, **{'a': 2, 'y': 333, 'z': 3})  # 错误：a 不是形参

def func(x, y, **z):
    print(x, y, z)

func(**{'y': 1, 'x': 2, 'a': 1111, 'b': 2222})  # func(y=1, x=2, a=1111, b=2222)
```

### 形参中的 *args 和 **kwargs

`*args` 和 `**kwargs` 是 Python 中最常用的可变长参数写法：

```python
def func(x, *args):
    print(x)
    print(args)

def func(x, **kwargs):
    print(x)
    print(kwargs)
```

### * 与 ** 的应用

```python
def index(name, age, sex):
    print('index=====>', name, age, sex)

# 会将 wrapper 函数接收的参数格式原封不动地转嫁给其内部的 index 函数
def wrapper(*args, **kwargs):
    # args = ('egon',)
    # kwargs = {'sex': 'male', 'age': 18}
    index(*args, **kwargs)  # index(*('egon',), **{'sex': 'male', 'age': 18})
                            # index('egon', sex='male', age=18)

wrapper(1, 2, 3, 4, 5, a=1, b=2, c=3)
wrapper('egon', sex='male', age=18)
```

### 传参时传递的是引用

```python
# format 方法的解包
msg = "{0},{1}"
print(msg.format("joker", "11"))
print(msg.format(*["joker", "11"]))

msg = "{name},{age}"
print(msg.format(name="joker", age="11"))
print(msg.format(**{"name": "joker", "age": "11"}))

# 传递数据类型时，其实传递的是引用
l = [1, 2, 3, 4]

def f1(a1):
    a1.append(999)

f1(l)
print(l)  # [1, 2, 3, 4, 999]

# 全局变量，通常全部大写
name = [1, 2, 3, 4]

def f1():
    global name  # 直接修改全局变量
    name = [111]
    return

f1()
print(name)  # [111]

name = [1, 2, 3, 4]

def f1():
    name.append(5)  # 局部不能给全局重新赋值，只能修改
    return

f1()
print(name)  # [1, 2, 3, 4, 5]
```

## 函数默认参数的陷阱

### 陷阱的根本原因

`Python 函数的参数默认值，是在编译阶段就绑定的。`

如果参数默认值是一个可变对象（如 list、dictionary），那么所有函数体内对于该参数的修改，实际上都是对编译阶段就已经确定的那个对象的修改。

> **Important warning**: The default value is evaluated only once. This makes a difference when the default is a mutable object such as list, dictionary, or instances of most classes.

### 如何避免这个陷阱

**方案一**：不要使用可变对象作为函数默认值

**方案二**：使用 `None` 作为默认值，在函数体内判断并创建新的可变对象

```python
def generate_new_list_with(my_list=None, element=None):
    if my_list is None:
        my_list = []
    my_list.append(element)
    return my_list
```

### 默认值的作用域

```python
def foo(xyz=[]):
    xyz.append(10)
    print(xyz)

foo()  # [10]
foo()  # [10, 10]  ← 问题所在！
```

**为什么第二次打印 `[10, 10]`？**

因为函数也是对象，Python 把函数的默认值放在了 `__defaults__` 属性中，这个属性就伴随着这个函数对象的整个生命周期。

```python
def foo(xyz=[], u='abc', z=123):
    xyz.append(1)
    return xyz

print(foo(), id(foo))       # [1] 44516624
print(foo.__defaults__)     # ([1], 'abc', 123)
print(foo(), id(foo))       # [1, 1] 44516624
print(foo.__defaults__)     # ([1, 1], 'abc', 123)
```

### 安全的默认参数处理方式

**方式一**：影子拷贝（浅拷贝）

```python
def foo(lst=[], u='abc', z=123):
    lst = lst[:]  # 影子拷贝，没有改变形参默认值
    lst.append(1)
    print(lst)

foo()
foo()
foo([10])
foo([10, 5])
```

**方式二**：默认值为 `None`，对 `None` 进行判断

```python
def foo(lst=None, u='abc', z=123):
    if lst is None:
        lst = []
    lst.append(1)
    print(lst)

foo()
foo()
foo([10])
foo([10, 5])
```

## 深拷贝和浅拷贝

### 概念解析

- **浅拷贝**：只拷贝最外层，是对于一个对象的顶层拷贝。通俗的理解是：拷贝了引用，并没有拷贝内容。
- **深拷贝**：有多少层都拷贝，是对于一个对象所有层次的拷贝（递归）。

### 可变类型和不可变类型

| 类型 | 包含内容 |
|------|---------|
| **不可变类型** | 整型、浮点数、布尔、字符串、元组 |
| **可变类型** | 列表、字典 |

### 深浅拷贝的区别

1. 如果用 `copy.copy` 或 `copy.deepcopy` 对一个全部都是不可变类型的数据进行拷贝，那么它们结果相同，都是引用指向。

2. 如果拷贝的是一个拥有不可变类型的数据，即使元组是最顶层，那么 deepcopy 依然是深拷贝，而 copy.copy 还是指向。

3. 基本上只要不是我们自已手动调用的 deepcopy 方法都是浅拷贝，切片拷贝、字典拷贝都是浅拷贝。

4. 有些内置函数可以生成拷贝，属于深拷贝，例如：
   ```python
   a = list(range(10))
   b = list(a)  # 深拷贝
   ```

### 实际应用示例

```python
import copy

# 示例 1：浅拷贝
list1 = [1, 2, 3]
list2 = copy.copy(list1)
print(list1 is list2)  # False

# 示例 2：深拷贝
list3 = [[1, 2], [3, 4]]
list4 = copy.deepcopy(list3)
print(list3 is list4)  # False
print(list3[0] is list4[0])  # False，深拷贝会递归拷贝所有层级
```

> 更详细的深浅拷贝分析请参考：[Python 深浅拷贝详解](https://www.cnblogs.com/Eva-J/p/5534037.html)

## 小结

本文介绍了 Python 函数的核心概念：

1. **函数定义**：使用 `def` 关键字，支持文档字符串
2. **返回值**：
   - 可以返回任意数据类型
   - 可以返回多个值（以元组形式）
   - `return` 还可以结束函数执行
3. **参数类型**：
   - 位置参数和关键字参数
   - 默认参数（注意不要使用可变类型作为默认值）
   - 可变长参数 `*args` 和 `**kwargs`
4. **深浅拷贝**：
   - 浅拷贝只拷贝顶层引用
   - 深拷贝递归拷贝所有层级

掌握这些知识，将帮助你编写更加优雅和健壮的 Python 代码。
