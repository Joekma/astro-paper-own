---
title: Python 面向对象之封装与多态
author: 程序员
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-04-29T00:00:00.000+08:00
slug: python-oop-encapsulation-polymorphism
description: '深入讲解Python面向对象中的封装与多态，掌握属性隐藏、property装饰器、接口设计、鸭子类型等核心概念。'
tags:
  - Python
  - 面向对象
  - 封装
  - 多态
draft: false
language: zh-CN
---

> 封装和多态是面向对象编程的两大核心特性。封装通过隐藏实现细节提供清晰的接口；多态让同一操作作用于不同对象时产生不同结果。本文将深入探讨 Python 中封装和多态的实现方式及实际应用。

## 学习目标

读完本文后，你将掌握：

- 理解封装的概念和作用
- 掌握私有属性和私有方法的实现
- 熟练使用 @property 装饰器
- 理解多态的原理和优势
- 了解鸭子类型和接口设计

# 面向对象三大特性之封装与多态

## 封装

最主要的作用：隐藏对象的属性和实现细节，仅对外提供公共访问方式。

**封装原则：**

- 将不需要对外提供的内容都隐藏起来
- 把属性都隐藏，提供公共方法对其访问

### 在python中用双下划线开头的方式将属性隐藏起来（设置成私有的）

```python
# 其实这仅仅这是一种变形操作
# 类中所有双下划线开头的名称如__x都会自动变形成：_类名__x的形式

class A:
    __N = 0  # 类的数据属性就应该是共享的，但是语法上是可以把类的数据属性设置成私有的如__N，会变形为_A__N

    def __init__(self):
        self.__X = 10  # 变形为self._A__X

    def __foo(self):  # 变形为_A__foo
        print('from A')

    def bar(self):
        self.__foo()  # 只有在类内部才可以通过__foo的形式访问到

# A._A__N是可以访问到的，即这种操作并不是严格意义上的限制外部访问，仅仅只是一种语法意义上的变形，主要用来限制外部的直接访问
```

### 隐藏真实发生了什么？

#### 这种变形需要注意的问题

**1. 这种机制也并没有真正意义上限制我们从外部直接访问属性，知道了类名和属性名就可以拼出名字：_类名__属性，然后就可以访问了，如 a._A__N。**

> 即这种操作并不是严格意义上的限制外部访问，仅仅只是一种语法意义上的变形，主要用来限制外部的直接访问。

**2. 变形的过程只在类的定义时发生一次，在定义后的赋值操作，不会变形**

**3. 在继承中，父类如果不想让子类覆盖自己的方法，可以将方法定义为私有的**

**封装不是单纯的隐藏**

**封装的真谛在于明确地区分内外，封装的属性可以直接在内部使用，而不能被外部直接使用，然而定义属性的目的终归是要用，外部要想用类隐藏的属性，需要我们为其开放接口，让外部能够间接地用到我们隐藏起来的属性，那这么做的意义何在？**

### 封装

**封装数据：将数据隐藏起来这不是目的。隐藏起来然后对外提供操作该数据的接口，然后我们可以在接口附加上对该数据操作的限制，以此完成对数据属性操作的严格控制。**

```python
class Teacher:
    def __init__(self, name, age):
        # self.__name = name
        # self.__age = age
        self.set_info(name, age)

    def tell_info(self):
        print('姓名:%s,年龄:%s' % (self.__name, self.__age))

    def set_info(self, name, age):
        if not isinstance(name, str):
            raise TypeError('姓名必须是字符串类型')
        if not isinstance(age, int):
            raise TypeError('年龄必须是整型')
        self.__name = name
        self.__age = age

t = Teacher('egon', 18)
t.tell_info()

t.set_info('egon', 19)
t.tell_info()
```

**封装方法 目的是为了隔离复杂度，也就是说将操作傻瓜化，将内部复杂的功能都隐藏起来。**

> 提示：在编程语言里，对外提供的接口（接口可理解为了一个入口），可以是函数，称为接口函数，这与接口的概念还不一样，接口代表一组接口函数的集合体。

```python
class ATM:
    def __card(self):
        print('插卡')

    def __auth(self):
        print('用户认证')

    def __input(self):
        print('输入取款金额')

    def __print_bill(self):
        print('打印账单')

    def __take_money(self):
        print('取款')

    def withdraw(self):
        self.__card()
        self.__auth()
        self.__input()
        self.__print_bill()
        self.__take_money()

a = ATM()
a.withdraw()

# 执行结果：顺序执行，如果上面代码中有更为详细的功能，则会执行函数中更为详细的功能
# 插卡
# 用户认证
# 输入取款金额
# 打印账单
# 取款
```

**补充知识：**

python并不会真的阻止你访问私有的属性，模块也遵循这种约定，如果模块名以单下划线开头，那么 `from module import *` 时不能被导入，但是你 `from module import _private_module` 依然是可以导入的。

其实很多时候你去调用一个模块的功能时会遇到单下划线开头的 (socket._socket, sys._home, sys._clear_type_cache)，这些都是私有的，原则上是供内部调用的，作为外部的你，一意孤行也是可以用的，只不过显得稍微不专业一点点。

python要想与其他编程语言一样，严格控制属性的访问权限，只能借助内置方法如 `__getattr__`，详见面向对象之进阶。

### 特性 (property)

property是一种特殊的属性，访问它时会执行一段功能（函数）然后返回结果。这种被@property装饰过得到的特殊属性是不能被简单的赋值更改的。

**例一：BMI指数（bmi是计算而来的，但很明显它听起来像是一个属性而非方法，如果我们将其做成一个属性，更便于理解）**

成人的BMI数值：

| 分类 | BMI范围 |
|------|---------|
| 过轻 | 低于 18.5 |
| 正常 | 18.5-23.9 |
| 过重 | 24-27 |
| 肥胖 | 28-32 |
| 非常肥胖 | 高于 32 |

体质指数（BMI）= 体重（kg）÷身高^2（m）
例如：60kg÷(1.75×1.75) = 22.86

```python
class People:
    def __init__(self, name, weight, height):
        self.name = name
        self.weight = weight
        self.height = height

    @property  # 加上这个特殊的装饰器后，之后实例化出的对象就可以像访问属性一样得到bmi的值，而不再是调用一个方法
    def bmi(self):
        return self.weight / (self.height ** 2)

p1 = People('egon', 75, 1.85)
print(p1.bmi)
```

**@property的使用场景**

**例二：圆的周长和面积**

```python
import math

class Circle:
    def __init__(self, radius):  # 圆的半径radius
        self.radius = radius

    @property
    def area(self):
        return math.pi * self.radius ** 2  # 计算面积

    @property
    def perimeter(self):
        return 2 * math.pi * self.radius  # 计算周长

c = Circle(10)
print(c.radius)
print(c.area)  # 可以向访问数据属性一样去访问area，会触发一个函数的执行，动态计算出一个值
print(c.perimeter)  # 同上

# 输出结果:
# 10
# 314.1592653589793
# 62.83185307179586

# 注意：此时的特性area和perimeter不能被赋值
c.area = 3  # 为特性area赋值
# 抛出异常: AttributeError: can't set attribute
```

**@property的使用场景**

### 为什么要用property

将一个类的函数定义成特性以后，对象再去使用的时候 obj.name，根本无法察觉自己的name是执行了一个函数然后计算出来的，这种特性的使用方式遵循了统一访问的原则。

python并没有在语法上把它们三个内建到自己的class机制中，在C++里一般会将所有的所有的数据都设置为私有的，然后提供set和get方法（接口）去设置和获取，在python中通过property方法可以实现。

```python
class People:
    def __init__(self, name):
        self.__name = name

    @property
    def name(self):
        return "<name:%s>" % self.__name

    @name.setter
    def name(self, new_name):
        if type(new_name) is not str:
            print("名字必须是str类型")
            return
        self.__name = new_name

    @name.deleter
    def name(self):
        del self.__name

obj = People("xuxubao")
print(obj.name)  # 现在的输出对应@property装饰后的
# <name:xuxubao>

obj.name = "taonihouzi"
print(obj.name)  # 被@name.setter装饰后的name可以正常改值，不加装饰器直接改值会报错
# <name:taonihouzi>

del obj.name
print(obj.__dict__)  # 被@name.deleter装饰后的name可以正常删除，不加会报错
# {}
```

**被@property装饰后如何正常改值和删除**

```python
class Foo:
    def __init__(self, val):
        self.__NAME = val  # 将所有的数据属性都隐藏起来

    def getname(self):
        return self.__NAME  # obj.name访问的是self.__NAME（这也是真实值的存放位置）

    def setname(self, value):
        if not isinstance(value, str):  # 在设定值之前进行类型检查
            raise TypeError('%s must be str' % value)
        self.__NAME = value  # 通过类型检查后，将值value存放到真实的位置self.__NAME

    def delname(self):
        raise TypeError('Can not delete')

    name = property(getname, setname, delname)  # 不如装饰器的方式清晰
```

**老版本property的用法**

### 封装的扩展

封装在于明确区分内外，使得类实现者可以修改封装内的东西而不影响外部调用者的代码；而外部使用用者只知道一个接口（函数），只要接口（函数）名、参数不变，使用者的代码永远无需改变。这就提供一个良好的合作基础——或者说，只要接口这个基础约定不变，则代码改变不足为虑。

```python
# 类的设计者
class Room:
    def __init__(self, name, owner, width, length, high):
        self.name = name
        self.owner = owner
        self.__width = width
        self.__length = length
        self.__high = high

    def tell_area(self):  # 对外提供的接口，隐藏了内部的实现细节，此时我们想求的是面积
        return self.__width * self.__length

# 使用者
r1 = Room('卧室', 'egon', 20, 20, 20)
print(r1.tell_area())  # 使用者调用接口tell_area
# 400

# 类的设计者，轻松的扩展了功能，而类的使用者完全不需要改变自己的代码
class Room:
    def __init__(self, name, owner, width, length, high):
        self.name = name
        self.owner = owner
        self.__width = width
        self.__length = length
        self.__high = high

    def tell_area(self):  # 对外提供的接口，隐藏内部实现，此时我们想求的是体积，内部逻辑变了，只需求修改下列一行就可以很简单的实现，而且外部调用感知不到，仍然使用该方法，但是功能已经变了
        return self.__width * self.__length * self.__high

# 对于仍然在使用tell_area接口的人来说，根本无需改动自己的代码，就可以用上新功能
print(r1.tell_area())
# 8000
```

## 多态

多态即多种形态，在运行时确定其状态，在编译阶段无法确定其类型，这就是多态。Python中的多态和Java以及C++中的多态有点不同，Python中的变量是弱类型的，在定义时不用指明其类型，它会根据需要在运行时确定变量的类型（这也是多态的一种体现），并且Python本身是一种解释性语言，不进行预编译，因此它就只在运行时确定其状态，故也有人说Python是一种多态语言。

在Python中很多地方都可以体现多态的特性，比如内置函数 `len(object)`，`len` 函数不仅可以计算字符串的长度，还可以计算列表、元组等对象中的数据个数，这里在运行时通过参数类型确定其具体的计算过程，正是多态的一种体现。这有点类似于函数重载（一个编译单元中有多个同名函数，但参数不同），相当于为每种类型都定义了一个 len 函数。这是典型的多态表现，有些人提出Python不支持多态，我是完全不赞同。

```python
import abc

class Animal(metaclass=abc.ABCMeta):  # 同一类事物:动物（其实定义了一个标准，子类必须要有talk功能，这是一种强制手段）
    @abc.abstractmethod
    def talk(self):
        pass

class People(Animal):  # 动物的形态之一:人
    def talk(self):
        print('say hello')

class Dog(Animal):  # 动物的形态之二:狗
    def talk(self):
        print('say wangwang')

class Pig(Animal):  # 动物的形态之三:猪
    def talk(self):
        print('say aoao')
```

比如说文件有多种类型，文本文件，可执行文件等：

```python
import abc

class File(metaclass=abc.ABCMeta):  # 同一类事物:文件  强调：父类是用来指定标准的，不能被实例化
    @abc.abstractmethod
    def click(self):
        pass

class Text(File):  # 文件的形态之一:文本文件
    def click(self):
        print('open file')

class ExeFile(File):  # 文件的形态之二:可执行文件
    def click(self):
        print('execute file')
```

### 多态性

用一句话来概括下，多态就是同一操作（方法）作用于不同的对象时，可以有不同的解释，产生不同的执行结果。

本质上，多态意味着可以对不同的对象使用同样的操作，但它们可能会以多种形态呈现出结果。`len(object)` 函数就体现了这一点。在C++、Java、C#这种编译型语言中，由于有编译过程，因此就鲜明地分成了运行时多态和编译时多态。

**运行时多态**是指允许父类指针或名称来引用子类对象，或对象方法，而实际调用的方法为对象的类类型方法，这就是所谓的动态绑定。

**编译时多态**有模板或范型、方法重载(overload)、方法重写(override)等。而Python是动态语言，动态地确定类型信息恰恰体现了多态的特征。在Python中，任何不知道对象到底是什么类型，但又需要对象做点什么的时候，都会用到多态。

### 多态性是指在不考虑实例类型的情况下使用实例

在面向对象方法中一般是这样表述多态性：向不同的对象发送同一条消息（obj.func() 是调用了 obj 的方法 func，又称为向 obj 发送了一条消息 func），不同的对象在接收时会产生不同的行为（即方法）。也就是说，每个对象可以用自己的方式去响应共同的消息。所谓消息，就是调用函数，不同的行为就是指不同的实现，即执行不同的函数。

比如：老师.下课铃响了()，学生.下课铃响了()，老师执行的是下班操作，学生执行的是放学操作，虽然二者消息一样，但是执行的效果不一样。

### 为什么要用多态性（多态性的好处）

其实大家从上面多态性的例子可以看出，我们并没有增加什么新的知识，也就是说python本身就是支持多态性的，这么做的好处是什么呢？

1. **增加了程序的灵活性**：以不变应万变，不论对象千变万化，使用者都是同一种形式去调用，如 `func(animal)`

2. **增加了程序可扩展性**：通过继承animal类创建了一个新的类，使用者无需更改自己的代码，还是用 `func(animal)` 去调用

```python
peo = People()
dog = Dog()
pig = Pig()

# peo、dog、pig都是动物，只要是动物肯定有talk方法
# 于是我们可以不用考虑它们三者的具体是什么类型，而直接使用：
peo.talk()
dog.talk()
pig.talk()

# 更进一步，我们可以定义一个统一的接口来使用
def func(obj):
    obj.talk()
```

```python
>>> class Cat(Animal):  # 属于动物的另外一种形态：猫
...     def talk(self):
...         print('say miao')
...
>>> def func(animal):  # 对于使用者来说，自己的代码根本无需改动
...     animal.talk()
...
>>> cat1 = Cat()  # 实例出一只猫
>>> func(cat1)  # 甚至连调用方式也无需改变，就能调用猫的talk功能
say miao

# 这样我们新增了一个形态Cat，由Cat类产生的实例cat1，使用者可以在完全不需要修改自己代码的情况下。使用和人、狗、猪一样的方式调用cat1的talk方法，即func(cat1)
```

### 方法多态

```python
# -*- coding: UTF-8 -*-

class Calculator:
    def count(self, *args):
        return 1

calc = Calculator()  # 自定义类实例
from random import choice

obj = choice(['hello,world', [1, 2, 3], calc])  # obj是随机返回的，类型不确定
print(type(obj))

print(obj.count('a'))  # 方法多态：字符串和列表还有这个自定义的类都有count方法，执行结果不同
```

**方法多态**：对于一个临时对象obj，它通过Python的随机函数取出来，不知道具体类型（是字符串、元组还是自定义类型），都可以调用count方法进行计算，至于count由谁（哪种类型）去做怎么去实现我们并不关心。

### 关于鸭子类型

首先Python不支持多态，也不用支持多态，python是一种多态语言，崇尚鸭子类型。

在程序设计中，鸭子类型（英语：duck typing）是动态类型的一种风格。在这种风格中，一个对象有效的语义，不是由继承自特定的类或实现特定的接口，而是由当前方法和属性的集合决定。这个概念的名字来源于由James Whitcomb Riley提出的鸭子测试，"鸭子测试"可以这样表述："当看到一只鸟走起来像鸭子、游泳起来像鸭子、叫起来也像鸭子，那么这只鸟就可以被称为鸭子。"即把方法名都用相同的方法。

在鸭子类型中，关注的不是对象的类型本身，而是它是如何使用的。例如，在不使用鸭子类型的语言中，我们可以编写一个函数，它接受一个类型为鸭的对象，并调用它的走和叫方法。在使用鸭子类型的语言中，这样的一个函数可以接受一个任意类型的对象，并调用它的走和叫方法。如果这些需要被调用的方法不存在，那么将引发一个运行时错误。任何拥有这样的正确的走和叫方法的对象都可被函数接受的这种行为引出了以上表述，这种决定类型的方式因此得名。

```python
peo = People()
dog = Dog()

# 于是我们可以不用考虑它们的具体是什么类型，而直接使用：
peo.talk()
dog.talk()

# 更进一步，我们可以定义一个统一的接口来使用
def func1(obj):
    obj.talk()

def func2(dog):
    dog.talk()

# 就func1函数而言，参数对象是一个狗类型，它实现了方法多态。但是实际上我们知道，从严格的抽象来讲，Person类型和Dog完全风马牛不相及
```

鸭子类型通常得益于不测试方法和函数中参数的类型，而是依赖文档、清晰的代码和测试来确保正确使用。从静态类型语言转向动态类型语言的用户通常试图添加一些静态的（在运行之前的）类型检查，从而影响了鸭子类型的益处和可伸缩性，并约束了语言的动态特性。

### 运算符多态

```python
def add(x, y):
    return x + y

print(add(1, 2))  # 输出3

print(add("hello,", "world"))  # 输出hello,world

print(add(1, "abc"))  # 抛出异常：TypeError: unsupported operand type(s) for +: 'int' and 'str'
```

上例中，显而易见，Python的加法运算符是"多态"的，理论上，我们实现的add方法支持任意支持加法的对象，但是我们不用关心两个参数x和y具体是什么类型。

Python同样支持运算符重载，实例如下，详细的见面向对象进阶：

```python
class Vector:
    def __init__(self, a, b):
        self.a = a
        self.b = b

    def __str__(self):
        return 'Vector (%d, %d)' % (self.a, self.b)

    def __add__(self, other):
        return Vector(self.a + other.a, self.b + other.b)

v1 = Vector(2, 10)
v2 = Vector(5, -2)
print(v1 + v2)
```

一两个示例代码当然不能从根本上说明多态。普遍认为面向对象最有价值最被低估的特征其实是多态。我们所理解的多态的实现和子类的虚函数地址绑定有关系，多态的效果其实和函数地址运行时动态绑定有关。在C++, Java, C#中实现多态的方式通常有重写和重载两种，从上面两段代码，我们其实可以分析得出Python中实现多态也可以变相理解为重写和重载。在Python中很多内置函数和运算符都是多态的。

### 其他

**例子一：利用标准库中定义的各种'与文件类似'的对象，尽管这些对象的工作方式像文件，但他们没有继承内置文件对象的方法。**

```python
# 二者都像鸭子，二者看起来都像文件，因而就可以当文件一样去使用
class TxtFile:
    def read(self):
        pass

    def write(self):
        pass

class DiskFile:
    def read(self):
        pass

    def write(self):
        pass
```

## 总结

### 核心要点

本文详细介绍了 Python 面向对象中的封装与多态：

1. **封装隐藏实现细节**：
   - 使用双下划线前缀 `__` 实现私有属性
   - 实际上是通过名称改写（Name Mangling）实现
   - 提供公共接口访问隐藏的数据
2. **property 提供统一访问**：
   - `@property` 装饰器让方法像属性一样访问
   - `@setter` 和 `@deleter` 提供赋值和删除接口
   - 实现数据封装和验证
3. **多态提高灵活性**：
   - 同一接口，不同实现
   - 运行时动态确定对象类型
   - Python 天然支持多态
4. **鸭子类型更灵活**：
   - 不关心对象类型，只关心对象行为
   - "如果它走起来像鸭子，叫起来像鸭子，那它就是鸭子"

### 多态的实际应用场景

| 场景 | 示例 | 说明 |
|------|------|------|
| **函数参数** | `func(obj)` | 接受任何实现了 talk 方法的对象 |
| **内置函数** | `len()` | 对不同类型对象返回不同结果 |
| **运算符** | `+` | 对数字、字符串、列表有不同的行为 |
| **文件接口** | `read()/write()` | 任何实现该接口的对象都可用作文件 |

### Python 封装的特点

- **不是真正的限制**：通过 `_类名__属性` 仍然可以访问私有属性
- **这是一种约定**：遵循"以双下划线开头的属性不应在外部直接访问"的原则
- **主要用于提示**：告诉其他开发者这是内部实现，不应直接使用

### 实践建议

> **提示**：Python 的多态是动态语言特性，无需显式声明接口。遵循"如果它走起来像鸭子，叫起来像鸭子，那它就是鸭子"的原则设计你的代码。使用 property 装饰器可以让你的类提供更清晰的接口，同时保护内部数据。

