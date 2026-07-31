---
title: Python 面向对象设计思想
author: Joekma
pubDatetime: 2024-08-13T00:00:00Z
modDatetime: 2026-04-29T00:00:00.000+08:00
slug: python-oop-design-thinking
featured: false
draft: false
tags:
  - Python
  - 面向对象
  - docs
description: 深入理解 Python 面向对象设计思想，掌握类、对象、属性、方法等核心概念，学会用面向对象的思维去设计程序。
series: Python中级
seriesOrder: 2
language: zh-CN
---

> 本篇文章将带你深入理解 Python 面向对象编程的核心思想。从类与对象的概念出发，逐步掌握属性、方法、命名空间等关键知识点，为后续学习继承、封装、多态打下坚实基础。

## 学习目标

读完本文后，你将掌握：

- 理解类和对象的概念及区别
- 掌握类的属性和方法的定义
- 了解 Python 中的命名空间机制
- 理解绑定方法和 self 的含义
- 掌握 __init__ 构造方法的用法

# 面向对象的思维去设计程序

## 什么是面向对象编程

面向对象编程是一种程序的范式，它把程序看成是对不同对象的相互调用，对现实世界建立的一种模型。在进行python面向对象编程之前，先来了解几个术语：类，类对象，实例对象，属性，函数和方法。

## 什么是类

```python
class ClassMate:
    """类的定义示例"""
    pass

# 类的名字常常以大写开头  驼峰命名法

# 程序中类的用法：专门用来访问属性，本质操作的就是 __dict__
OldboyStudent.school  # 等于经典类的操作 OldboyStudent.__dict__['school']
OldboyStudent.school = 'Oldboy'  # 等于 OldboyStudent.__dict__['school']='Oldboy'
OldboyStudent.x = 1  # 等于 OldboyStudent.__dict__['x']=1
del OldboyStudent.x  # 等于 OldboyStudent.__dict__.pop('x')
```
## 什么是类对象

注意类名后面有个冒号，在block块里面就可以定义属性和方法了。当一个类定义完之后，就产生了一个类对象。类对象支持两种操作：引用和实例化。引用操作是通过类对象去调用类中的属性或者方法，而实例化是产生出一个类对象的实例，称作实例对象。比如定义了一个goods类
```python
class Goods:
    """定义一个商品类"""

    name = 'apple'  # 定义了一个属性

    def print_name(self):
        """定义了一个方法"""
        print(self.name)

goods_instance = Goods()
goods_instance.print_name()
# 输出: apple
```

goods类定义完成之后就产生了一个全局的类对象，可以通过类对象来访问类中的属性和方法了。

在上面代码中注释的很清楚了，name是一个属性，printName( )是一个方法，与某个对象进行绑定的函数称作为方法。一般在类里面定义的函数与类对象或者实例对象绑定了，所以称作为方法；而在类外定义的函数一般没有同对象进行绑定，就称为函数。

### Python 为类内置的特殊属性

```python
类名.__name__   # 类的名字(字符串)
类名.__doc__    # 类的文档字符串
类名.__base__   # 类的第一个父类(在讲继承时会讲)
类名.__bases__  # 类所有父类构成的元组(在讲继承时会讲)
类名.__dict__   # 类的字典属性
类名.__module__ # 类定义所在的模块
类名.__class__  # 实例对应的类(仅新式类中)
```
### 更好的理解类对象
```python
class goods:
    name = 'apple'  # 定义了一个属性
    def __init__(self,name):
         self.name=name
# 类对象产生，其实goods默认继承了object类，类对象的产生与object里面的内置方法有关系

print(goods.__dict__)
sdsd=goods('scscs')
print(goods.__dict__)

# 输出示例：{'__module__': '__main__', 'name': 'apple', ...}
# 输出示例：{'__module__': '__main__', 'name': 'apple', ...}
# 可以看出来类里面的__init__只是初始化类的实例化结果，类的名称空间不发生变化
# 如果变量name没有被初始化，对象sdsd也可以使用父类的name变量

print(sdsd.__dict__)
# {'name': 'scscs'}

```
## 属性
```python
class people:
    name = 'jack'
    age = 12

p = people()
print(p.name,p.age)
# 定义了一个people类，里面定义了name和age属性，默认值分别为'jack'和12。在定义了类之后，就可以用来产生实例化对象了，这句p = people( )实例化了一个对象p，然后就可以通过p来读取属性了。这里的name和age都是公有的，可以直接在类外通过对象名访问，如果想定义成私有的，则需在前面加2个下划线 ' __'
class people:
    __name = 'jack'
    __age = 12

p = people()
print(p.__name,p.__age)
```
程序运行会报错
```python
Traceback (most recent call last):
  File "C:/PycharmProjects/FirstProject/oop.py", line 6, in <module>
    print p.__name,p.__age
AttributeError: people instance has no attribute '__name
```
提示找不到该属性，因为私有属性是不能够在类外通过对象名来进行访问的。在Python中没有像C++中public和private这些关键字来区别公有属性和私有属性，它是以属性命名方式来区分，如果在属性名前面加了2个下划线'__'，则表明该属性是私有属性，否则为公有属性（方法也是一样，方法名前面加了2个下划线的话表示该方法是私有的，否则为公有的）

### 类即类型

python中一切皆为对象，且python3中类与类型是一个概念，类型就是类
```python
# 类型dict就是类dict
list
<class 'list'>

# 实例化的到3个对象l1,l2,l3
l1=list()
l2=list()
l3=list()

# 三个对象都有绑定方法append,是相同的功能,但内存地址不同
l1.append
<built-in method append of list object at 0x10b482b48>
l2.append
<built-in method append of list object at 0x10b482b88>
l3.append
<built-in method append of list object at 0x10b482bc8>

# 操作绑定方法l1.append(3),就是在往l1添加3,绝对不会将3添加到l2或l3
l1.append(3)
l1
[3]
l2
[]
l3
[]
# 调用类list.append(l3,111)等同于l3.append(111)
list3.append(111)
l3
[111]
```
补充: 我们都知道Python一切皆对象，那么Python究竟是怎么管理对象的呢？

1、无处不在的__dict__
1）首先看一下类的__dict__属性和类对象的__dict__属性
2）由此可见， 类的静态函数、类函数、普通函数、全局变量以及一些内置的属性都是放在类__dict__里的
3）对象的__dict__中存储了一些self.xxx的一些东西

2、Python里什么没有__dict__属性
虽然说一切皆对象，但对象也有不同，就好比不是每个人的女朋友都是一个人一样，一些内置的数据类型是没有__dict__属性的，如下
```python
num = 3
ll = []
dd = {}
print(num.__dict__)
print(ll.__dict__)
print(dd.__dict__)
```
3、发生继承时候的__dict__属性

子类有自己的__dict__, 父类也有自己的__dict__,子类的全局变量和函数放在子类的dict中，父类的放在父类dict中
1）每个类的类变量、函数名都放在自己的__dict__中
2）子类对象可以用父类的__dict__里面的值

总结：
1） 内置的数据类型没有__dict__属性
2） 每个类有自己的__dict__属性，就算存着继承关系，父类的__dict__ 并不会影响子类的__dict__
3） 对象也有自己的__dict__属性， 存储self.xxx 信息

### 方法

在类中可以根据需要定义一些方法，定义方法采用def关键字，在类中定义的方法至少会有一个参数，一般以名为'self'的变量作为该参数（用其他名称也可以），而且需要作为第一个参数。下面看个例子：

```python
class people:
    __name = 'jack'
    __age = 12

    def getName(self):
        return self.__name
    def getAge(self):
        return self.__age

p = people()
print(p.getName(), p.getAge())
```

## 类属性 vs 实例属性

### 数据属性（类属性）

类的数据属性是所有对象**共享**的，指向同一块内存地址。

```python
class Student:
    school = 'Oldboy'  # 类数据属性

    def __init__(self, name):
        self.name = name  # 实例属性

    def learn(self):
        print(f'{self.name} is learning')

s1 = Student('Alice')
s2 = Student('Bob')
s3 = Student('Charlie')

# 类的数据属性是所有对象共享的，id 都一样
print(id(Student.school))  # 4377347328
print(id(s1.school))       # 4377347328
print(id(s2.school))       # 4377347328
print(id(s3.school))       # 4377347328
```

### 函数属性（绑定方法）

类中定义的函数主要是给对象使用的，而且是**绑定到对象**的。虽然所有对象指向的都是相同的功能，但是绑定到不同的对象时是**不同的方法对象**。

```python
# 类的函数属性是绑定给对象使用的，内存地址都不一样
print(Student.learn)  # <function Student.learn at 0x1021329d8>
print(s1.learn)        # <bound method Student.learn of <Student object at ...>>
print(s2.learn)        # <bound method Student.learn of <Student object at ...>>
print(s3.learn)        # <bound method Student.learn of <Student object at ...>>
```

## 绑定方法详解

### 什么是绑定方法？

绑定方法是一种特殊的函数，它**自动绑定到调用它的对象**，并在调用时自动将该对象作为第一个参数传入。

```python
# 调用绑定方法
s1.learn()  # 等同于 Student.learn(s1)
s2.learn()  # 等同于 Student.learn(s2)
s3.learn()  # 等同于 Student.learn(s3)
```

### 绑定方法的特点

1. **自动传值**：绑定到谁的身上，就由谁来调用，会自动把对象本身当做第一个参数传入
2. **统一接口**：无论对象是什么，调用方式都一样
3. **参数规则**：如果类想调用绑定方法，必须遵循函数的参数规则

> 💡 **提示**：`self` 可以是任意名字，但是约定俗成地写成 `self`。可以把它理解为 C++ 中的 `this` 指针。

### __init__ 也是绑定方法

在类的内部来说，`__init__` 是类的函数属性；但是对于对象来说，它就是绑定方法。

```python
class People:
    def __init__(self, name, age):
        self.name = name
        self.age = age

p1 = People('Alice', 25)
p2 = People('Bob', 30)

# __init__ 是绑定方法，会自动传递 self
# p1.__init__('Alice', 25) 等同于 People.__init__(p1, 'Alice', 25)
```

## 命名空间与属性查找顺序

### Python 的属性查找顺序

当访问一个对象的属性时，Python 会按照以下顺序查找：

1. **对象的命名空间**（`对象.__dict__`）
2. **类的命名空间**（`类.__dict__`）
3. **父类的命名空间**（按继承顺序查找）
4. **如果都找不到，抛出 AttributeError**

```python
class Animal:
    species = '动物'  # 类属性

    def __init__(self, name):
        self.name = name  # 实例属性

class Dog(Animal):
    breed = '狗'  # 子类属性

    def __init__(self, name, color):
        super().__init__(name)
        self.color = color  # 实例属性

dog = Dog('旺财', '黄色')

# 属性查找顺序演示
print(dog.name)    # '旺财' - 在对象的 __dict__ 中找到
print(dog.color)   # '黄色' - 在对象的 __dict__ 中找到
print(dog.breed)   # '狗' - 在类 Dog 的 __dict__ 中找到
print(dog.species)  # '动物' - 在父类 Animal 的 __dict__ 中找到
```

```python
# Filename: class_init.py
class Person:
    def __init__(self, name):
        self.name = name
    def sayHi(self):
        print('Hello, my name is', self.name)

p = Person('Swaroop')
p.sayHi()

# 输出：Hello, my name is Swaroop

# __init__的必须注意的点
# 1. 该方法内可以有任意 Python 代码
# 2. 一定不能有返回值
```

## 总结

### 核心要点

本文详细介绍了 Python 面向对象编程的核心概念：

1. **类与对象的区别**：类是抽象的模板，对象是具体的实例
2. **属性和方法的分类**：
   - 类数据属性是所有对象共享的，内存地址相同
   - 类函数属性是绑定到对象的，内存地址不同
3. **self 参数的意义**：
   - self 指向当前对象
   - 方法调用时会自动传递当前对象作为第一个参数
4. **__init__ 构造方法**：
   - 用于初始化对象状态
   - 在对象创建时自动调用
   - 不能有返回值

### 命名空间总结

- **类的 __dict__**：存储类的静态函数、类函数、普通函数、全局变量以及内置属性
- **对象的 __dict__**：存储 self.xxx 的实例属性
- **内置数据类型**（如 int、list、dict）没有 __dict__ 属性

### 实践建议

> **提示**：在定义类的时候，优先使用 `__init__` 方法统一初始化对象状态，私有属性使用双下划线前缀 `__` 来保护数据。

### 核心原则

- **绑定方法**：定义在类内部的函数会自动绑定到对象，由对象调用时自动传递 self
- **统一访问**：通过 property 装饰器可以让方法像属性一样访问，提高代码可读性
- **命名规范**：类名使用驼峰命名法，方法名使用小写下划线分隔法
---
