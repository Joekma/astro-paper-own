---
title: 面向对象之（非）绑定方法，反射，isinstance与issubclass
author: FjellOverflow
pubDatetime: 2024-08-13T00:00:00Z
modDatetime: 2026-04-22T00:00:00Z
featured: false
draft: false
tags:
  - Python
  - 面向对象
  - docs
description: 面向对象之（非）绑定方法，反射，isinstance与issubclass，涵盖绑定方法、反射机制、类型检查等核心概念。
---

# 面向对象之（非）绑定方法，反射，isinstance与issubclass

## isinstance(obj,cls)和issubclass(sub,super)

isinstance(obj,cls)检查obj是否是类 cls 的对象
```python

class Foo(object):
    pass
obj = Foo()
isinstance(obj, Foo)

```
issubclass(sub, super)检查sub类是否是 super 类的派生类
```

class Foo(object):
    pass
class Bar(Foo):
    pass
 
issubclass(Bar, Foo)

```
## 绑定方法与非绑定方法

### **绑定方法**

**绑定给谁，谁来调用就自动将它本身当作第一个参数传入**

**绑定方法分为绑定到类的方法和绑定到对象的方法，具体如下：**
```

1. 绑定到类的方法：用classmethod装饰器装饰的方法。
                为类量身定制
                类.boud_method(),自动将类当作第一个参数传入
              （其实对象也可调用，但仍将类当作第一个参数传入）
 
2. 绑定到对象的方法：没有被任何装饰器装饰的方法。
               为对象量身定制
               对象.boud_method(),自动将对象当作第一个参数传入
             （属于类的函数，类可以调用，但是必须按照函数的规则来，没有自动传值那么一说）

```
### **非绑定方法：用staticmethod装饰器装饰的方法**
```

不与类或对象绑定，类和对象都可以调用，但是没有自动传值那么一说。就是一个普通工具而已
注意：与绑定到对象方法区分开，在类中直接定义的函数，没有被任何装饰器
装饰的，都是绑定到对象的方法，可不是普通函数，对象调用该方法会自动传值，而
staticmethod装饰的方法，不管谁来调用，都没有自动传值一说

```
### 对于绑定方法和非绑定方法举个例子
```

在类内部定义的函数,分为两大类:
    一：绑定对象：绑定给谁就由谁来调用，谁来调用就会把调用者当作第一个参数自动传入
        绑定到对象的方法：在类内定义的没有被任何装饰器修饰的
class Foo():
    def __init__(self,name):
        self.name = name
 
    def tell(self):
        print('名字是%s'%self.name)
 
f = Foo('james')
print(f.tell)
# <bound method Foo.tell of <__main__.Foo object at 0x0000021B7AB3C9E8>>
        绑定到类的方法:在类内定义的被装饰器classmethod修饰的方法
# def 定义的两个都是绑定到对象的方法
class Foo():
    def __init__(self,name):
        self.name = name
    @classmethod
    def func(cls):  [[cls]] = Foo
        print(cls)
print(Foo.func)
# <bound method Foo.func of <class '__main__.Foo'>>
 
    二：非绑定方法：没有自动传值这一说法，简单说就是一个普通方法
        非绑定方法：不与类或者对象绑定，谁都可以调用
class Foo():
    def __init__(self,name):
        self.name = name
    @classmethod
    def func(cls):  [[cls]] = Foo
        print(cls)
 
    @staticmethod
    def func1(x,y):
        print(x+y)
 
print(Foo.func1)
# <function Foo.func1 at 0x0000023D73765840>

```
## 绑定方法

绑定给对象的方法（略）

绑定给类的方法（classmethod）

classmehtod是给类用的，即绑定到类，类在使用时会将类本身当做参数传给类方法的第一个参数（即便是对象来调用也会将类当作第一个参数传入），python为我们内置了函数classmethod来把类中的函数定义成类方法
```

HOST='127.0.0.1'
PORT=3306
DB_PATH=r'C:\Users\Administrator\PycharmProjects\test\面向对象编程\test1\db'

import settings
class MySQL:
    def __init__(self,host,port):
        self.host=host
        self.port=port
 
    @classmethod
    def from_conf(cls):
        print(cls)
        return cls(settings.HOST,settings.PORT)
 
print(MySQL.from_conf) #<bound method MySQL.from_conf of <class '__main__.MySQL'>>
conn=MySQL.from_conf()
 
conn.from_conf() [[对象也可以调用，但是默认传的第一个参数仍然是类]]

```
## 非绑定方法

在类内部用staticmethod装饰的函数即非绑定方法，就是普通函数

statimethod不与类或对象绑定，谁都可以调用，没有自动传值效果
```

import hashlib
import time
class MySQL:
    def __init__(self,host,port):
        self.id=self.create_id()
        self.host=host
        self.port=port
    @staticmethod
    def create_id(): [[就是一个普通工具]]
        m=hashlib.md5(str(time.time()).encode('utf-8'))
        return m.hexdigest()
 
 
print(MySQL.create_id) #<function MySQL.create_id at 0x0000000001E6B9D8>
 [[查看结果为普通函数]]
conn=MySQL('127.0.0.1',3306)
print(conn.create_id) #<function MySQL.create_id at 0x00000000026FB9D8>
 [[查看结果为普通函数]]

```
## 绑定方法与非绑定方法的使用举例
```

import settings
import hashlib
import time
class People:
    def __init__(self,name,age,sex):
        self.id =self.create_id()
        self.name = name
        self.age = age
        self.sex = sex
    def tell_info(self):  [[绑定到对象啊]]
        print("name:%s Age:%s Sex:%s"%(self.name,self.age,self.sex))
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
[[绑定到对象，就应该由对象来调用]],自动将对象本身当作第一个参数传入
# p.tell_info()  [[tell_info]](p)
[[绑定给类，就应该由类来调用，自动将类本身当作第一个参数传入]]
# p1 = People.from_conf() [[from_conf]](People)
# p1.tell_info()
[[非绑定方法，不与类或者对象绑定，谁都可以调用，没有自动传值这一说]]
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
```

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
print(m) [[我们的意图是想触发Mariadb]].__str__,但是结果触发了MySQL.__str__的执行，打印就不告诉你：
 
mariadb是mysql

```
### 类方法，静态方法的定义

Python 是双面向的,既可以面向函数编程,也可以面向对象编程,所谓面向函数就是单独一个. py 文件,里面没有类,全是一些函数,调用的时候导入模块,通过模块名.函数名()即可调用,完全不需要类,那么你可能会问,那要类还有什么毛用? 类就是用来面向对象编程啦,类可以有自己的属性,类可以创建很多实例,每个实例可以有不同的属性,这也就保存了很多私有的数据,总之都有存在的必要.

面向对象程序设计中，类方法和静态方法是经常用到的术语，逻辑上将：类方法只能由类名调用，静态方法可以由类名或者对象名调用。在python 语法中，类有三种方法，分别是实例方法，静态方法，类方法
```

class Foo(object):
    '''类三种方法语法形式'''
        [[在类中定义普通方法，在定义普通方法的时候，必须添加self]]  
    def instance_method(self):
        print("是类{}的实例方法，只能被实例对象调用".format(Foo))
　　[[在类中定义静态方法，在定义静态方法的时候，不需要传递任何类的东西]] 
    @staticmethod
    def static_method():
        print("是静态方法")
　　[[在类中定义类方法，在定义类方法的时候，需要传递参数cls]]  cls即为类本身
    @classmethod
    def class_method(cls):
        print("是类方法")
 
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
```

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
```

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
## 小练习 定义MySQL类

1.对象有id、host、port三个属性

2.定义工具create_id，在实例化时为每个对象随机生成id，保证id唯一

3.提供两种实例化方式，方式一：用户传入host和port 方式二：从配置文件中读取host和port进行实例化

4.为对象定制方法，save和get_obj_by_id，save能自动将对象序列化到文件中，文件路径为配置文件中DB_PATH,文件名为id号，保存之前验证对象是否已经存在，若存在则抛出异常，;get_obj_by_id方法用来从文件中反序列化出对象
```

概述：

    UUID是128位的全局唯一标识符，通常由32字节的字符串表示。
    它可以保证时间和空间的唯一性，也称为GUID，全称为：
            UUID —— Universally Unique IDentifier      Python 中叫 UUID
            GUID —— Globally Unique IDentifier          C#  中叫 GUID

    它通过MAC地址、时间戳、命名空间、随机数、伪随机数来保证生成ID的唯一性。
    UUID主要有五个算法，也就是五种方法来实现：

       1、uuid1()——基于时间戳

               由MAC地址、当前时间戳、随机数生成。可以保证全球范围内的唯一性，
               但MAC的使用同时带来安全性问题，局域网中可以使用IP来代替MAC。

       2、uuid2()——基于分布式计算环境DCE（Python中没有这个函数）

                算法与uuid1相同，不同的是把时间戳的前4位置换为POSIX的UID。
                实际中很少用到该方法。

      3、uuid3()——基于名字的MD5散列值

                通过计算名字和命名空间的MD5散列值得到，保证了同一命名空间中不同名字的唯一性，
                和不同命名空间的唯一性，但同一命名空间的同一名字生成相同的uuid。    

       4、uuid4()——基于随机数

                由伪随机数得到，有一定的重复概率，该概率可以计算出来。

       5、uuid5()——基于名字的SHA-1散列值

                算法与uuid3相同，不同的是使用 Secure Hash Algorithm 1 算法

使用方面：

    首先，Python中没有基于DCE的，所以uuid2可以忽略；
    其次，uuid4存在概率性重复，由无映射性，最好不用；
    再次，若在Global的分布式计算环境下，最好用uuid1；
    最后，若有名字的唯一性要求，最好用uuid3或uuid5。

编码方法：

    # -*- coding: utf-8 -*-

    import uuid

    name = "test_name"
    namespace = "test_namespace"

    print uuid.uuid1()  # 带参的方法参见Python Doc
    print uuid.uuid3(namespace, name)
    print uuid.uuid4()
    print uuid.uuid5(namespace, name)

[[settings]].py内容
'''
HOST='127.0.0.1'
PORT=3306
DB_PATH=r'E:\CMS\aaa\db'
'''
import settings
import uuid
import pickle
import os
class MySQL:
    def __init__(self,host,port):
        self.id=self.create_id()
        self.host=host
        self.port=port

    def save(self):
        if not self.is_exists:
            raise PermissionError('对象已存在')
        file_path=r'%s%s%s' %(settings.DB_PATH,os.sep,self.id)
        pickle.dump(self,open(file_path,'wb'))

    @property
    def is_exists(self):
        tag=True
        files=os.listdir(settings.DB_PATH)
        for file in files:
            file_abspath=r'%s%s%s' %(settings.DB_PATH,os.sep,file)
            obj=pickle.load(open(file_abspath,'rb'))
            if self.host == obj.host and self.port == obj.port:
                tag=False
                break
        return tag
    @staticmethod
    def get_obj_by_id(id):
        file_abspath = r'%s%s%s' % (settings.DB_PATH, os.sep, id)
        return pickle.load(open(file_abspath,'rb'))

    @staticmethod
    def create_id():
        return str(uuid.uuid1())

    @classmethod
    def from_conf(cls):
        print(cls)
        return cls(settings.HOST,settings.PORT)

# print(MySQL.from_conf) #<bound method MySQL.from_conf of <class '__main__.MySQL'>>
conn=MySQL.from_conf()
conn.save()

conn1=MySQL('127.0.0.1',3306)
conn1.save() [[抛出异常PermissionError]]: 对象已存在

obj=MySQL.get_obj_by_id('7e6c5ec0-7e9f-11e7-9acc-408d5c2f84ca')
print(obj.host)

class Date:
    def __init__(self,year,month,day):
        self.year=year
        self.month=month
        self.day=day
    @staticmethod
    def now(): [[用Date]].now()的形式去产生实例,该实例用的是当前时间
        t=time.localtime() [[获取结构化的时间格式]]
        return Date(t.tm_year,t.tm_mon,t.tm_mday) [[新建实例并且返回]]
    @staticmethod
    def tomorrow():#用Date.tomorrow()的形式去产生实例,该实例用的是明天的时间
        t=time.localtime(time.time()+86400)
        return Date(t.tm_year,t.tm_mon,t.tm_mday)

a=Date('1987',11,27) [[自己定义时间]]
b=Date.now() [[采用当前时间]]
c=Date.tomorrow() [[采用明天的时间]]

print(a.year,a.month,a.day)
print(b.year,b.month,b.day)
print(c.year,c.month,c.day)

[[分割线]]==============================
import time
class Date:
    def __init__(self,year,month,day):
        self.year=year
        self.month=month
        self.day=day
    @staticmethod
    def now():
        t=time.localtime()
        return Date(t.tm_year,t.tm_mon,t.tm_mday)

class EuroDate(Date):
    def __str__(self):
        return 'year:%s month:%s day:%s' %(self.year,self.month,self.day)

e=EuroDate.now()
print(e) [[我们的意图是想触发EuroDate]].__str__,但是结果为
'''
输出结果:
<__main__.Date object at 0x1013f9d68>
'''
因为e就是用Date类产生的,所以根本不会触发EuroDate.__str__,解决方法就是用classmethod

import time
class Date:
    def __init__(self,year,month,day):
        self.year=year
        self.month=month
        self.day=day
    # @staticmethod
    # def now():
    #     t=time.localtime()
    #     return Date(t.tm_year,t.tm_mon,t.tm_mday)

    @classmethod [[改成类方法]]
    def now(cls):
        t=time.localtime()
        return cls(t.tm_year,t.tm_mon,t.tm_mday) [[哪个类来调用]],即用哪个类cls来实例化

class EuroDate(Date):
    def __str__(self):
        return 'year:%s month:%s day:%s' %(self.year,self.month,self.day)

e=EuroDate.now()
print(e) [[我们的意图是想触发EuroDate]].__str__,此时e就是由EuroDate产生的,所以会如我们所愿
'''
输出结果:
year:2017 month:3 day:3
'''

```
## 反射

### 为什么要用反射
```

[[反射，通过字符串映射到对象的属性]]
[[首先这个例子，我们可以看出访问类或者对象的属性的时候，我们是对象]].属性  类.属性
[[所以实际上，点后面都是属性，而不是字符串，但是我们需要字符串]]
class People:
    def __init__(self,name,age):
        self.name = name
        self.age = age
    def talk(self):
        print('%s is talking'%self.name)
 
 
obj = People('huard',18)
print(obj.name)
print(obj.talk)
# huard
# <bound method People.talk of <__main__.People object at 0x000001C3FE8DC048>>
[[当用户输入字符串的时候，如何映射到一个对象的属性？]]
# 比如
choice = input(">>>")
print(obj.choice)

```
### 什么是反射

反射的概念是由Smith在1982年首次提出的，主要是指程序可以访问、检测和修改它本身状态或行为的一种能力（自省）。这一概念的提出很快引发了计算机科学领域关于应用反射性的研究。它首先被程序语言的设计领域所采用,并在Lisp和面向对象方面取得了成绩。

### python面向对象中的反射：通过字符串的形式操作对象相关的属性。python中的一切事物都是对象（都可以使用反射）

四个可以实现自省的函数

下列方法适用于类和对象（一切皆对象，类本身也是一个对象）

**hasattr(object,name)` 判断object中有没有对应的方法和属性`**
```

判断object中有没有一个name字符串对应的方法或属性

class People:
    def __init__(self,name,age):
        self.name = name
        self.age = age
    def talk(self):
        print('%s is talking'%self.name)
obj = People('huard',18)
print(hasattr(obj,'name'))
print(hasattr(obj,'talk'))
print(hasattr(obj,'age'))
# 结果：
# True
# True
# True　

```
**getattr(object, name, default=None) 获取object中有没有对应的方法和属性**
```

def getattr(object, name, default=None): # known special case of getattr
    """
    getattr(object, name[, default]) -> value
 
    Get a named attribute from an object; getattr(x, 'y') is equivalent to x.y.
    When a default argument is given, it is returned when the attribute doesn't
    exist; without it, an exception is raised in that case.
    """
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
```

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
```

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
```

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
 
[[检测是否含有某属性]]
print(hasattr(b1,'name'))   [[True]]
print(hasattr(b1,'sell_house')) [[True]]
 
[[获取属性]]
n=getattr(b1,'name')
print(n)  [[万成置地]]
func=getattr(b1,'rent_house')
func()   [[万成置地]] 黑中介租房子啦,才租呢
 
# getattr(b1,'aaaaaaaa') [[报错]]
'''    getattr(b1,'aaaaaaaa') [[报错]]
AttributeError: 'BlackMedium' object has no attribute 'aaaaaaaa'
'''
[[为了不让报错，我们提前设置异常处理，如果没有的话]] 直接读取的是我们设置的
print(getattr(b1,'aaaaaaaa','不存在啊'))  [[不存在啊]]
 
[[设置属性]]
setattr(b1,'sb',True)
setattr(b1,'show_name',lambda self:self.name+'sb')
print(b1.__dict__)
# {'name': '万成置地', 'addr': '回龙观天露园', 'sb': True, 'show_name': <function <lambda> at 0x000001A26A0E56A8>}
print(b1.show_name(b1))
# 万成置地sb
 
[[删除属性]]
delattr(b1,'addr')
delattr(b1,'show_name')
# delattr(b1,'show_name111')#不存在,则报错AttributeError: show_name111
 
print(b1.__dict__) #{'name': '万成置地', 'sb': True}

```
**类也是对象**
```

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
```

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
```

import module_test as obj
 
[[obj]].test()
 
print(hasattr(obj,'test'))
 
getattr(obj,'test')()
# True
# from the test

```
**module_test.py**
```

# _*_ coding: utf-8 _*_
def test():
    print('from the test')　

```
### 为什么用反射？（反射的好处）

好处一：实现可插拔机制

有俩程序员，一个james，一个是dunart，james在写程序的时候需要用到dunart所写的类，但是dunart去跟女朋友度蜜月去了，还没有完成他写的类，james想到了反射，使用了反射机制james可以继续完成自己的代码，等dunart度蜜月回来后再继续完成类的定义并且去实现james想要的功能。

总之反射的好处就是，可以事先定义好接口，接口只有在被完成后才会真正执行，这实现了即插即用，这其实是一种‘后期绑定’，什么意思？即你可以事先把主要的逻辑写好（只定义接口），然后后期再去实现接口的功能

**dunart还没有实现全部功能**
```

class FtpClient:
    'ftp客户端,但是还么有实现具体的功能'
    def __init__(self,addr):
        print('正在连接服务器[%s]' %addr)
        self.addr=addr

```
**不影响james的代码编写**
```

[[from]] module import FtpClient
f1=FtpClient('192.168.1.1')
if hasattr(f1,'get'):
    func_get=getattr(f1,'get')
    func_get()
else:
    print('---->不存在此方法')
    print('处理其他的逻辑')

```
好处二：动态导入模块（基于反射当前模块成员）

![image](https://images2018.cnblogs.com/blog/1226410/201804/1226410-20180408155736408-678271775.png)

## __setattr__,__delattr__,__getattr__

### **三者的用法演示**
```

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
 
[[__setattr__添加/修改属性会触发它的执行]]
f1=Foo(10)
print(f1.__dict__) # 因为你重写了__setattr__,凡是赋值操作都会触发它的运行,你啥都没写,就是根本没赋值,除非你直接操作属性字典,否则永远无法赋值
f1.z=3
print(f1.__dict__)
 
[[__delattr__删除属性的时候会触发]]
f1.__dict__['a']=3#我们可以直接修改属性字典,来完成添加/修改属性的操作
del f1.a
print(f1.__dict__)
 
[[__getattr__只有在使用点调用属性且属性不存在的时候才会触发]]
f1.xxxxxx

```yaml
---
