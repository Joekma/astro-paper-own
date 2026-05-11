---
title: Python 面向对象之绑定方法、反射与类型检查
author: Joekma
pubDatetime: 2024-08-13T00:00:00Z
modDatetime: 2026-04-29T00:00:00.000+08:00
slug: python-oop-methods-reflection
featured: false
draft: false
tags:
  - Python
  - 面向对象
  - 绑定方法
  - 反射
  - docs
description: 深入理解 Python 面向对象中的绑定方法（classmethod、staticmethod）、反射机制（hasattr、getattr、setattr、delattr）以及类型检查（isinstance、issubclass）。
series: python
language: zh-CN
---

> 本篇文章将深入探讨 Python 面向对象中的高级特性。包括：绑定方法（classmethod vs staticmethod）、反射机制（通过字符串操作对象属性）、类型检查（isinstance vs issubclass）。掌握这些知识，你将能够编写更加灵活和动态的 Python 代码。

## 学习目标

读完本文后，你将掌握：

- 理解实例方法、类方法和静态方法的区别
- 掌握 @classmethod 和 @staticmethod 的使用场景
- 理解反射的概念和四个内置函数
- 学会使用 isinstance 和 issubclass 进行类型检查
- 提升代码的动态性和灵活性

# 面向对象之绑定方法、反射与类型检查

## isinstance 和 issubclass

### isinstance()

检查对象是否是某个类的实例。

```python
class Animal:
    pass

class Dog(Animal):
    pass

dog = Dog()

# isinstance 检查实例
print(isinstance(dog, Dog))      # True
print(isinstance(dog, Animal))  # True（因为 Dog 继承自 Animal）

# type 只检查精确类型
print(type(dog) == Dog)         # True
print(type(dog) == Animal)      # False
```

### issubclass()

检查类是否是另一个类的子类。

```python
print(issubclass(Dog, Animal))  # True
print(issubclass(Animal, Dog))  # False
print(issubclass(Dog, Dog))     # True（类是自己子类）
```

### isinstance vs type 对比

| 函数 | 说明 | 示例 |
|------|------|------|
| `isinstance()` | 检查继承关系 | `isinstance(dog, Animal)` → True |
| `type()` | 检查精确类型 | `type(dog) == Animal` → False |

> 💡 **提示**：优先使用 `isinstance()` 而不是 `type()`，因为 `isinstance()` 支持继承检查。

## 绑定方法详解

### 三种方法对比

在 Python 类中，方法分为三种类型：

| 方法类型 | 装饰器 | 调用方式 | 自动传值 | 说明 |
|---------|--------|---------|----------|------|
| **实例方法** | 无 | `对象.方法()` | 传 `self`（实例） | 绑定到对象 |
| **类方法** | `@classmethod` | `类.方法()` 或 `对象.方法()` | 传 `cls`（类） | 绑定到类 |
| **静态方法** | `@staticmethod` | `类.方法()` 或 `对象.方法()` | 不传值 | 不绑定 |

### 1. 实例方法（绑定到对象）

实例方法是类中最常见的方法类型，绑定到具体对象，需要通过实例调用。

```python
class People:
    def __init__(self, name, age):
        self.name = name
        self.age = age

    def talk(self):  # 实例方法
        print(f'{self.name} is talking')

p = People('Alice', 25)
p.talk()  # 必须通过实例调用
```

### 2. 类方法（绑定到类）

类方法使用 `@classmethod` 装饰，第一个参数自动接收类本身。

```python
class People:
    def __init__(self, name, age):
        self.name = name
        self.age = age

    @classmethod
    def create_anonymous(cls):
        """类方法：创建一个匿名对象"""
        return cls('Anonymous', 0)

    @classmethod
    def create_from_dict(cls, data):
        """类方法：从字典创建对象"""
        return cls(data['name'], data['age'])

# 类和实例都可以调用类方法
p1 = People.create_anonymous()
p2 = People.create_from_dict({'name': 'Bob', 'age': 30})
```

### 3. 静态方法（不绑定）

静态方法使用 `@staticmethod` 装饰，不与类或对象绑定，就是普通函数。

```python
import hashlib
import time

class User:
    def __init__(self, username):
        self.username = username

    @staticmethod
    def generate_id():
        """静态方法：生成随机ID"""
        return hashlib.md5(str(time.time()).encode()).hexdigest()

# 类和实例都可以调用静态方法
user_id = User.generate_id()
```

### 使用场景对比

| 场景 | 推荐方法 | 原因 |
|------|---------|------|
| 访问/修改实例属性 | 实例方法 | 自然绑定到实例 |
| 访问类属性或创建实例 | 类方法 | 自动接收类信息 |
| 工具函数，不依赖类/实例 | 静态方法 | 不需要自动传值 |

## 类方法的实际应用

### 从配置文件创建实例

类方法常用于从配置文件创建实例，实现类的多样化构造。

```python
import settings

class MySQL:
    def __init__(self, host, port):
        self.host = host
        self.port = port

    @classmethod
    def from_conf(cls):
        """类方法：从配置创建实例"""
        return cls(settings.HOST, settings.PORT)

# 类方法调用
conn = MySQL.from_conf()
print(conn.host)  # 127.0.0.1

# 对象也可以调用类方法，但 cls 仍是类
conn.from_conf()  # 仍传递类而不是对象
```

## 静态方法的实际应用

### 静态方法：工具函数

静态方法适合放置与类相关但不依赖类/实例状态的工具函数。

```python
import hashlib
import time

class MySQL:
    def __init__(self, host, port):
        self.host = host
        self.port = port

    @staticmethod
    def create_id():
        """静态方法：生成唯一ID"""
        return hashlib.md5(str(time.time()).encode('utf-8')).hexdigest()

# 静态方法调用
print(MySQL.create_id())  # 0c6a2ae9cf81c16fb8e80b0e5f6d1c4

conn = MySQL('127.0.0.1', 3306)
print(conn.create_id())  # 同样可以调用
```

### 静态方法的坑：继承问题

使用静态方法创建实例时，可能导致继承问题：

```python
import time

class Date:
    def __init__(self, year, month, day):
        self.year = year
        self.month = month
        self.day = day

    @staticmethod
    def now():
        """静态方法：获取当前日期"""
        t = time.localtime()
        return Date(t.tm_year, t.tm_mon, t.tm_day)

class EuroDate(Date):
    def __str__(self):
        return f'{self.year}年{self.month}月{self.day}日'

# 问题：EuroDate.now() 返回的是 Date 对象，不是 EuroDate
e = EuroDate.now()
print(type(e))  # <class '__main__.Date'>
print(e)  # 显示 Date 的格式，不是 EuroDate
```

**解决方案：使用类方法代替静态方法**

```python
import time

class Date:
    def __init__(self, year, month, day):
        self.year = year
        self.month = month
        self.day = day

    @classmethod
    def now(cls):
        """类方法：获取当前日期，自动适配子类"""
        t = time.localtime()
        return cls(t.tm_year, t.tm_mon, t.tm_day)

class EuroDate(Date):
    def __str__(self):
        return f'{self.year}年{self.month}月{self.day}日'

# 现在 EuroDate.now() 返回正确的类型
e = EuroDate.now()
print(type(e))  # <class '__main__.EuroDate'>
print(e)  # 2017年3月3日
```

> 💡 **经验教训**：如果需要创建实例的工厂方法，优先使用类方法而非静态方法，以便支持继承。

## 反射机制
```python
@classmethod
def from_conf(cls):
    obj = cls(
        settings.name,
        settings.age,
        settings.sex
    )
    return obj
@staticmethod
def create_id():
    m = hashlib.md5(str(time.time()).encode('utf-8'))
    return m.hexdigest()
p = People('tom',18,'male')
# 绑定到对象，就应该由对象来调用，自动将对象本身当作第一个参数传入
# p.tell_info()  [[tell_info]](p)
# 绑定给类，就应该由类来调用，自动将类本身当作第一个参数传入
# p1 = People.from_conf() [[from_conf]](People)
# p1.tell_info()
# 非绑定方法，不与类或者对象绑定，谁都可以调用，没有自动传值这一说
p1 = People('tom1',18,'male')
p2 = People('tom2',18,'male')
p3 = People('tom3',18,'male')
print(p1.id)
print(p2.id)
print(p3.id)
# 08885a46a83b92f94c0f4de537fce9c3
# 08885a46a83b92f94c0f4de537fce9c3
# 2b2df79b379a5f7f709ead6268eb3361

```
## classmethod 与 staticmethod的区别
```python
import settings
class MySQL:
    def __init__(self,host,port):
        self.host=host
        self.port=port
 
    @staticmethod
    def from_conf():
        return MySQL(settings.HOST,settings.PORT)
 
    # @classmethod [[哪个类来调用]],就将哪个类当做第一个参数传入
    # def from_conf(cls):
    #     return cls(settings.HOST,settings.PORT)
 
    def __str__(self):
        return '就不告诉你'
 
class Mariadb(MySQL):
    def __str__(self):
        return '<%s:%s>' %(self.host,self.port)
 
 
m=Mariadb.from_conf()
print(m) # 我们的意图是想触发Mariadb.__str__,但是结果触发了MySQL.__str__的执行，打印就不告诉你：
 
mariadb是mysql

```
### 类方法，静态方法的定义

Python 是双面向的,既可以面向函数编程,也可以面向对象编程,所谓面向函数就是单独一个. py 文件,里面没有类,全是一些函数,调用的时候导入模块,通过模块名.函数名()即可调用,完全不需要类,那么你可能会问,那要类还有什么毛用? 类就是用来面向对象编程啦,类可以有自己的属性,类可以创建很多实例,每个实例可以有不同的属性,这也就保存了很多私有的数据,总之都有存在的必要.

面向对象程序设计中，类方法和静态方法是经常用到的术语，逻辑上将：类方法只能由类名调用，静态方法可以由类名或者对象名调用。在python 语法中，类有三种方法，分别是实例方法，静态方法，类方法
```python
class Foo(object):
    '''类三种方法语法形式'''
        [[在类中定义普通方法，在定义普通方法的时候，必须添加self]]  
    def instance_method(self):
        print("是类{}的实例方法，只能被实例对象调用".format(Foo))
　　# 在类中定义静态方法，在定义静态方法的时候，不需要传递任何类的东西 
    @staticmethod
    def static_method():
        print("是静态方法")
　　# 在类中定义类方法，在定义类方法的时候，需要传递参数cls  cls即为类本身
    @classmethod
    def class_method(cls):
        print("是类{}的类方法，只能被类对象调用".format(Foo))
 
foo = Foo()
foo.instance_method()
foo.class_method()
foo.static_method()
print("---------------")
Foo.static_method()
Foo.class_method()
```
可以看出：

实例方法只能被实例对象调用，静态方法(由@staticmethod装饰的方法)、类方法(由@classmethod装饰的方法)，可以被类或类的实例对象调用。  
实例方法，第一个参数必须要默认传实例对象，一般习惯用self。对象方法中有self参数，类方法有cls参数，静态方法是不需要这些附加参数（在c++中，是没有类这个概念）

静态函数（@staticmethod）:即静态方法，静态方法是一类特殊的方法，有时候你可能需要填写一个属于这个类的方法，但是这些代码完全不会使用到实例对象本身。它主要处理这个类的逻辑关联，如验证数据；而且对参数没有要求。

类方法（@classmethod）：即类方法，类方法不是绑定到对象上，而是绑定在类上的方法，它更关注于从类中调用方法，而不是从实例中调用方法，如构造重载；

成员函数：实例的方法，只能通过实例进行调用；第一个参数必须要默认传类，一般习惯用cls。

### 类方法与静态方法说明

1：self表示为类型为类的object，而cls表示为类也就是class

2：在定义普通方法的时候，需要的是参数self,也就是把类的实例作为参数传递给方法，如果不写self的时候，会发现报错TypeError错误，表示传递的参数多了，其实也就是调用方法的时候，将实例作为参数传递了，在使用普通方法的时候，使用的是实例来调用方法，不能使用类来调用方法，没有实例，那么方法将无法调用。

3：在定义静态方法的时候，和模块中的方法没有什么不同，最大的不同就是在于静态方法在类的命名空间之间，而且在声明静态方法的时候，使用的标记为@staticmethod，表示为静态方法，在你用静态方法的时候，可以使用类名或者是实例名来进行调用，一般使用类名来调用

4：静态方法主要是用来放一些方法的，方法的逻辑属于类，但是有何类本身没有什么交互，从而形成了静态方法，主要是让静态方法放在此类的名称空间之内，从而能够更加有组织性。

5：在定义类方法的时候，传递的参数为cls.表示为类，此写法也可以变，但是一般写为cls。类的方法调用可以使用类，也可以使用实例，一般情况使用的是类。

6：在重载调用父类方法的时候，最好是使用super来进行调用父类的方法。静态方法主要用来存放逻辑性的代码，基本在静态方法中，不会涉及到类的方法和类的参数。

7：python中实现静态方法和类方法都是依赖python的修饰器来实现的。静态方法是staticmethod，类方法是classmethod

8：在继承的时候，静态方法和类方法都会被子类继承。在进行重载类中的普通方法的时候，只要 写上相同的名字即可进行重载。

### 静态方法，类方法的使用区别

1：类方法用在模拟java定义多个构造函数的情况

由于python类中只能有一个初始化方法，不能按照不同的情况初始化类，举例如下：
```python
class book(object):
 
    def __init__(self,title):
        self.title = title
 
    @classmethod
    def creat(cls,title):
        book = cls(title=title)
        return book
 
book1=book("python")
book2 = book.creat("python is my work")
print(book1)
print(book2)
print(book1.title)
print(book2.title)
```
2：类中静态方法方法调用静态方法的情况

下面的代码，静态方法调用另一个静态方法，如果改用类方法调用静态方法，可以让cls代替类，（让代码看起来精简一些，也防止类名修改了，不用在类定义中修改原来的类名）
```python
class foo(object):
    x =1
    u =1
 
    @staticmethod
    def average(*mixes):
        return sum(mixes)/len(mixes)
 
    @staticmethod
    def static_method():
        return foo.average(foo.x,foo.u)
 
    @classmethod
    def class_method(cls):
        return cls.average(cls.x,cls.u)
 
a = foo()
print(a.static_method())
print(a.class_method())
```
## 反射

### 什么是反射？

反射是指程序能够在运行时**访问、检测和修改**自身状态或行为的能力。在 Python 中，通过字符串的形式操作对象的属性。

> **核心问题**：通常我们用 `obj.attr` 或 `Class.attr` 访问属性，但如果属性名是字符串怎么办？

```python
class People:
    def __init__(self, name, age):
        self.name = name
        self.age = age

    def talk(self):
        print(f'{self.name} is talking')

obj = People('Alice', 25)

# 正常访问
print(obj.name)  # Alice

# 如果属性名是字符串呢？
choice = input("请输入要访问的属性名: ")  # 输入 'name'
print(obj.choice)  # ❌ 报错！

# 反射：通过字符串访问属性
print(getattr(obj, choice))  # ✅ 正常输出
```

### 四个内置函数

Python 提供四个内置函数来实现反射：

| 函数 | 说明 | 示例 |
|------|------|------|
| `hasattr()` | 判断是否有属性 | `hasattr(obj, 'name')` |
| `getattr()` | 获取属性值 | `getattr(obj, 'name', None)` |
| `setattr()` | 设置属性值 | `setattr(obj, 'name', 'Alice')` |
| `delattr()` | 删除属性 | `delattr(obj, 'name')` |

> 💡 **提示**：这四个函数适用于类和对象，因为 Python 中一切皆对象，类本身也是对象。

### hasattr - 检查属性是否存在

```python
class People:
    def __init__(self, name, age):
        self.name = name
        self.age = age

    def talk(self):
        print(f'{self.name} is talking')

obj = People('Alice', 25)

print(hasattr(obj, 'name'))      # True
print(hasattr(obj, 'talk'))     # True
print(hasattr(obj, 'gender'))  # False
```

### getattr - 获取属性值

```python
# 获取普通属性
name = getattr(obj, 'name')
print(name)  # Alice

# 获取方法并调用
func = getattr(obj, 'talk')
func()  # Alice is talking

# 获取不存在的属性，设置默认值
gender = getattr(obj, 'gender', 'Unknown')
print(gender)  # Unknown
```

### setattr - 设置属性值

```python
# 设置新属性
setattr(obj, 'gender', 'Female')
print(obj.gender)  # Female

# 设置方法属性
setattr(obj, 'greet', lambda: print('Hello!'))
obj.greet()  # Hello!
```

### delattr - 删除属性

```python
# 删除属性
delattr(obj, 'age')
print(hasattr(obj, 'age'))  # False

# 删除不存在的属性会报错
# delattr(obj, 'nonexistent')  # AttributeError
```
print(hasattr(obj,'name'))
print(hasattr(obj,'talk'))
print(hasattr(obj,'age'))
# 结果：
# True
# True
# True　
```
**getattr(object, name, default=None) 获取object中有没有对应的方法和属性**

```python
def getattr(object, name, default=None): # known special case of getattr
    '''
    getattr(object, name[, default]) -> value
    Get a named attribute from an object; getattr(x, 'y') is equivalent to x.y.
    When a default argument is given, it is returned when the attribute doesn't
    exist; without it, an exception is raised in that case.
    '''
    pass
class People:
    def __init__(self,name,age):
        self.name = name
        self.age = age
    def talk(self):
        print('%s is talking'%self.name)
obj = People('huard',18)
print(getattr(obj,'name'))
print(getattr(obj,'talk'))
print(getattr(obj,'age',default=None))
print(getattr(obj,'ads',None))
# 结果：（如果有的话 就返回值，没有的话就返回None）
# huard
# <bound method People.talk of <__main__.People object at 0x000001661CE1CBA8>>
# 18
# None
```

**setattr(x, y, v) 设置对象及其属性**
```python
def setattr(x, y, v): # real signature unknown; restored from __doc__
    """
    Sets the named attribute on the given object to the specified value.
 
    setattr(x, 'y', v) is equivalent to ``x.y = v''
    """
    pass

class People:
    def __init__(self,name,age):
        self.name = name
        self.age = age
    def talk(self):
        print('%s is talking'%self.name)
obj = People('huard',18)
setattr(obj,'sex','male')
print(obj.__dict__)
print(obj.sex)
# 结果：
# {'name': 'huard', 'age': 18, 'sex': 'male'}
# male

```
**delattr(x, y) 删除类或对象的属性**
```python
def delattr(x, y): # real signature unknown; restored from __doc__
    """
    Deletes the named attribute from the given object.
 
    delattr(x, 'y') is equivalent to ``del x.y''
    """
    pass

class People:
    def __init__(self,name,age):
        self.name = name
        self.age = age
    def talk(self):
        print('%s is talking'%self.name)
 
obj = People('huard', 18)
delattr(obj, 'age')
print(obj.__dict__)
# 结果：
# {'name': 'huard'}　
```
**四个方法的使用演示**
```python
class BlackMedium:
    feature='Ugly'
    def __init__(self,name,addr):
        self.name=name
        self.addr=addr
 
    def sell_house(self):
        print('%s 黑中介卖房子啦,,但是谁能证明自己不mai' %self.name)
    def rent_house(self):
        print('%s 黑中介租房子啦,才租呢' %self.name)
 
b1=BlackMedium('万成置地','回龙观天露园')
 
# 检测是否含有某属性
print(hasattr(b1,'name'))   [[True]]
print(hasattr(b1,'sell_house')) [[True]]
 
# 获取属性
print(b1.name)
print(b1.addr)
n=getattr(b1,'name')
print(n)  [[万成置地]]
func=getattr(b1,'rent_house')
func()   [[万成置地]] 黑中介租房子啦,才租呢
 
# getattr(b1,'aaaaaaaa') [[报错]]
'''    getattr(b1,'aaaaaaaa') [[报错]]
AttributeError: 'BlackMedium' object has no attribute 'aaaaaaaa'
'''
# 为了不让报错，我们提前设置异常处理，如果没有的话 直接读取的是我们设置的默认值
print(getattr(b1,'aaaaaaaa','不存在啊'))  [[不存在啊]]
 
# 设置属性
setattr(b1,'sb',True)
setattr(b1,'show_name',lambda self:self.name+'sb')
print(b1.__dict__)
# {'name': '万成置地', 'addr': '回龙观天露园', 'sb': True, 'show_name': <function <lambda> at 0x000001A26A0E56A8>}
print(b1.show_name(b1))
# 万成置地sb
 
# 删除属性
delattr(b1,'addr')
delattr(b1,'show_name')
# delattr(b1,'show_name111')#不存在,则报错AttributeError: show_name111
 
print(b1.__dict__) #{'name': '万成置地', 'sb': True}

```
**类也是对象**
```python
class Foo(object):
    staticField = "old boy"
 
    def __init__(self):
        self.name = 'wupeiqi'
 
    def func(self):
        return 'func'
 
    @staticmethod
    def bar():
        return 'bar'
 
print(getattr(Foo, 'staticField'))
print(getattr(Foo, 'func'))
print(getattr(Foo, 'bar'))
# old boy
# <function Foo.func at 0x00000240E3205A60>
# <function Foo.bar at 0x00000240E3205AE8>　

```
**反射当前模块成员**
```python
import sys
 
def s1():
    print('s1')
 
def s2():
    print('s2')
 
this_module = sys.modules[__name__]
 
print(hasattr(this_module, 's1'))
print(getattr(this_module, 's2'))
# True
# <function s2 at 0x0000020F3F0A59D8>

```
**导入其他模块，利用反射查找该模块是否存在某个方法**
```python

import module_test as obj
 
obj.test()
 
print(hasattr(obj,'test'))
 
getattr(obj,'test')()
# True
# from the test

```
**module_test.py**
```python

# _*_ coding: utf-8 _*_
def test():
    print('from the test')　

```
### 为什么用反射？（反射的好处）

好处一：实现可插拔机制

有俩程序员，一个james，一个是dunart，james在写程序的时候需要用到dunart所写的类，但是dunart去跟女朋友度蜜月去了，还没有完成他写的类，james想到了反射，使用了反射机制james可以继续完成自己的代码，等dunart度蜜月回来后再继续完成类的定义并且去实现james想要的功能。

总之反射的好处就是，可以事先定义好接口，接口只有在被完成后才会真正执行，这实现了即插即用，这其实是一种‘后期绑定’，什么意思？即你可以事先把主要的逻辑写好（只定义接口），然后后期再去实现接口的功能

**dunart还没有实现全部功能**
```python
class FtpClient:
    'ftp客户端,但是还么有实现具体的功能'
    def __init__(self,addr):
        print('正在连接服务器[%s]' %addr)
        self.addr=addr
```
**不影响james的代码编写**
```python
from module import FtpClient
f1=FtpClient('192.168.1.1')
if hasattr(f1,'get'):
    func_get=getattr(f1,'get')
    func_get()
else:
    print('---->不存在此方法')
    print('处理其他的逻辑')
```
好处二：动态导入模块（基于反射当前模块成员）

## __setattr__,__delattr__,__getattr__

### **三者的用法演示**
```python
class Foo:
    x=1
    def __init__(self,y):
        self.y=y
 
    def __getattr__(self, item):
        print('----> from getattr:你找的属性不存在')
 
 
    def __setattr__(self, key, value):
        print('----> from setattr')
        # self.key=value [[这就无限递归了]],你好好想想
        # self.__dict__[key]=value [[应该使用它]]
 
    def __delattr__(self, item):
        print('----> from delattr')
        # del self.item [[无限递归了]]
        self.__dict__.pop(item)
 
# __setattr__添加/修改属性会触发它的运行
f1=Foo(10)
print(f1.__dict__) # 因为你重写了__setattr__,凡是赋值操作都会触发它的运行,你啥都没写,就是根本没赋值,除非你直接操作属性字典,否则永远无法赋值
f1.z=3
print(f1.__dict__)
 
# __delattr__删除属性的时候会触发它的运行
f1.__dict__['a']=3#我们可以直接修改属性字典,来完成添加/修改属性的操作
del f1.a
print(f1.__dict__)
 
# __getattr__只有在使用点调用属性且属性不存在的时候才会触发它的运行
f1.xxxxxx

```
---
