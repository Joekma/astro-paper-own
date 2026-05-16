---
title: Python 元类与单例模式：type创建类、自定义元类
author: Joekma
pubDatetime: 2018-11-19T00:00:00.000+08:00
modDatetime: 2026-05-03T00:00:00.000+08:00
slug: python-metaclass-singleton
description: '深入讲解Python元类与单例模式，详解type创建类、自定义元类控制类的创建和调用、__call__方法、exec用法和ORM框架中的应用。'
tags:
  - Python
  - 面向对象
  - 元类
  - 单例模式
  - type
draft: false
series: python
language: zh-CN
---

# Python 元类与单例模式

## 什么是元类

一切源自于一句话：python中一切皆为对象。让我们先定义一个类，然后逐步分析
```python
class Teather(object):
    school='xindongfang'
    def __init__(self,name,age):
        self.name=name
        self.age=age

    def say(self):
        print('%s says welcome to the xindongfang to learn cook'%self.name)
```
所有的对象都是实例化或者说调用类而得到的（调用类的过程称为类的实例化），比如对象te1是调用类Teacher得到的
```python
te1=Teather('shahuhu',35)
print(type(te1))  # <class '__main__.Teather'>
```
如果一切皆为对象，那么类Teacher本质也是一个对象，既然所有的对象都是调用类得到的，那么Teacher必然也是调用了一个类得到的，这个类称为元类

**于是我们可以推导出=== >产生Teacher的过程一定发生了：Teacher=元类(...)**
```python
print(type(Teacher)) # 结果为<class 'type'>，证明是调用了type这个元类而产生的Teacher，即默认的元类为type
```
## class关键字创建类的流程分析

上文我们基于python中一切皆为对象的概念分析出：我们用class关键字定义的类本身也是一个对象，负责产生该对象的类称之为元类（元类可以简称为类的类），内置的元类为type

class关键字在帮我们创建类时，必然帮我们调用了元类Teacher=type(...)，那调用type时传入的参数是什么呢？必然是类的关键组成部分，一个类有三大组成部分，分别是

1、类名class_name='Teacher'
2、基类们class_bases=(object,)
3、类的名称空间class_dic，**类的名称空间是执行类体代码而得到的**

调用type时会依次传入以上三个参数

综上，class关键字帮我们创建一个类应该细分为以下四个过程
```
1拿到类名    2拿到类的基类们   3执行类体代码   4调用元类得到类
```
理解第三部要补充exec的用法
```python
# exec：三个参数
# 参数一：包含一系列python代码的字符串  依然要保持原有python的代码规范，不然会出错
# 参数二：全局作用域（字典形式），如果不指定，默认为globals()
# 参数三：局部作用域（字典形式），如果不指定，默认为locals()
# 可以把exec命令的执行当成是一个函数的执行，会将执行期间产生的名字存放于局部名称空间中
g={
    'x':1,
    'y':2
}
l={}

exec('''
global x,z
x=100
z=200

m=300
''',g,l)

print(g) #{'x': 100, 'y': 2,'z':200,......}
print(l) #{'m': 300}
```
## 自定义元类控制类Teacher的创建

一个类没有声明自己的元类，默认他的元类就是type，除了使用内置元类type，我们也可以通过继承type来自定义元类，然后使用metaclass关键字参数为一个类指定元类
```python
class Mymeta(type):
    pass

class Teacther(object,metaclass=Mymeta):
    school='xindongfang'

    def __init__(self,name,age):
        self.name=name
        self.age=age

    def say(self):
        print('%s says welcome to the xindongfang to learn cook'%self.name)
```
自定义元类可以控制类的产生过程，类的产生过程其实就是元类的调用过程,即Teacher=Mymeta('Teacher',(object),{...})，调用Mymeta会先产生一个空对象Teacher，然后连同调用Mymeta括号内的参数一同传给Mymeta下的__init__方法，完成初始化，于是我们可以
```python
class Mymeta(type):
    def __init__(self,class_name,class_bases,class_dic):
        # print(self)           #<class '__main__.Teacher'>
        # print(class_bases)    #(<class 'object'>,)
        # print(class_dic)       #{'__module__': '__main__', '__qualname__': 'Teacher', '__doc__':
        #  '\n    类Teacher的中文注释\n    ', 'school': 'xindongfnag', '__init__': <function Teacher.__init__ at 0x00000274DF108AE8>,
        #  'say': <function Teacher.say at 0x00000274DF108B70>}
        super(Mymeta,self).__init__(class_name,class_bases,class_dic)  #子类重用父类的方法
        if class_name.islower():
            raise TypeError('类名%s请修改为驼峰体'%class_name)
        if '__doc__' not in class_dic or len(class_dic['__doc__'].strip('\n')) == 0:
            raise TypeError('类中必须要有中文注释，并且文档注释不能为空')

class Teacher(object,metaclass=Mymeta):
    '''
    类Teacher的中文注释
    '''
    school='xindongfnag'

    def __init__(self,name,age):
        self.name=name
        self.age=age

    def say(self):
        print('%s says welcome to the xindongfang to learn cook' % self.name)
```
## 自定义元类控制类Teacher的调用

### __call__

```python
class Foo:
    def __call__(self, *args, **kwargs):
        print(self)
        print(args)
        print(kwargs)

obj=Foo()
# 1、要想让obj这个对象变成一个可调用的对象，需要在该对象的类中定义一个方法__call__方法，该方法会在调用对象时自动触发
# 2、调用obj的返回值就是__call__方法的返回值
res=obj(1,2,3,x=1,y=2)
print(res)
```

由上例得知，调用一个对象，就是触发对象所在类中的__call__方法的执行，如果把Teacher也当做一个对象，那么在Teacher这个对象的类中也必然存在一个__call__方法
```python
class Mymeta(type): #只有继承了type类才能称之为一个元类，否则就是一个普通的自定义类
    def __call__(self, *args, **kwargs):
        print(self)      #<class '__main__.Teacher'>
        print(args)      #('shahuhu', 35)
        print(kwargs)    #{}
        return 123

class Teacher(object,metaclass=Mymeta):
    school='xindongfang'
    def __init__(self,name,age):
        self.name=name
        self.age=age
    def say(self):
        print('%s says welcome to the xindongfang to learn cook' %self.name)

# 调用Teacher就是在调用Teacher类中的__call__方法
# 然后将Teacher传给self,溢出的位置参数传给*，溢出的关键字参数传给**
# 调用Teacher的返回值就是调用__call__的返回值
te1=Teacher('shahuhu',35)

print(te1) #123
```
默认地，调用te1=Teacher('shahuhu',35)会做三件事

1、产生一个空对象obj
2、调用__init__方法初始化对象obj
3、返回初始化好的obj

对应着，Teacher类中的__call__方法也应该做这三件事
```python
class Mymeta(type): #只有继承了type类才能称之为一个元类，否则就是一个普通的自定义类
    def __call__(self, *args, **kwargs): # [self]=<class '__main__.OldboyTeacher'>
        # 1、调用__new__产生一个空对象obj
        obj=self.__new__(self) # 此处的self是类OldoyTeacher，必须传参，代表创建一个OldboyTeacher的对象obj

        # 2、调用__init__初始化空对象obj
        # self.__init__(obj,*args,**kwargs)   [[类调用__init__]]  要传第一个参数类实例出的对象
        obj.__init__(*args,**kwargs)      [[对象调用]]

        # 3、返回初始化好的对象obj
        return obj

class Teacher(object,metaclass=Mymeta):
    school='xindongfang'

    def __init__(self,name,age):
        self.name=name
        self.age=age

    def say(self):
        print('%s says welcome to the xindongfang to learn cook' %self.name)

t1=Teacher('shahuhu',35)
print(t1)
print(t1.__dict__) #{'name': 'shahuhu', 'age': 35}
'''
<__main__.Teacher object at 0x0000019EB12B7E48>
{'name': 'shahuhu', 'age': 35}

'''

```
## 再看属性查找

结合python继承的实现原理+元类重新看属性的查找应该是什么样子呢？？？

在学习完元类后，其实我们用class自定义的类也全都是对象（包括object类本身也是元类type的 一个实例，可以用type(object)查看），我们学习过继承的实现原理，如果把类当成对象去看，将下述继承应该说成是：对象OldboyTeacher继承对象Foo，对象Foo继承对象Bar，对象Bar继承对象object

```python
class Mymeta(type): #只有继承了type类才能称之为一个元类，否则就是一个普通的自定义类
    n=444
    def __call__(self, *args, **kwargs): # [self]=<class '__main__.OldboyTeacher'>
        obj=self.__new__(self)
        self.__init__(obj,*args,**kwargs)
        return obj

class Bar(object):
    n=333

class Foo(Bar):
    n=222

class OldboyTeacher(Foo,metaclass=Mymeta):
    n=111

    school='oldboy'

    def __init__(self,name,age):
        self.name=name
        self.age=age

    def say(self):
        print('%s says welcome to the oldboy to learn Python' %self.name)

print(OldboyTeacher.n) #111
# 自下而上依次注释各个类中的n=xxx，然后重新运行程序，发现n的查找顺序为OldboyTeacher->Foo->Bar->object->Mymeta->type
```


于是属性查找应该分成两层，一层是对象层（基于c3算法的MRO）的查找，另外一个层则是类层（即元类层）的查找

```
查找顺序：
1、先对象层：OldoyTeacher->Foo->Bar->object
2、然后元类层：Mymeta->type
```
依据上述总结，我们来分析下元类Mymeta中__call__里的self.__new__的查找

```python
class Mymeta(type): #只有继承了type类才能称之为一个元类，否则就是一个普通的自定义类
    n=444
    def __call__(self, *args, **kwargs): # [self]=<class '__main__.OldboyTeacher'>
        obj=self.__new__(self)
        print(self.__new__ is object.__new__) #True

class Bar(object):
    n=333
    # def __new__(cls, *args, **kwargs):
    #     print('Bar.__new__')

class Foo(Bar):
    n=222
    # def __new__(cls, *args, **kwargs):
    #     print('Foo.__new__')

class OldboyTeacher(Foo,metaclass=Mymeta):
    n=111
    school='oldboy'
    def __init__(self,name,age):
        self.name=name
        self.age=age

    def say(self):
        print('%s says welcome to the oldboy to learn Python' %self.name)

    # def __new__(cls, *args, **kwargs):
    #     print('OldboyTeacher.__new__')

OldboyTeacher('egon', 18)  # 触发 OldboyTeacher 类中的 __call__ 方法，进而查找 self.__new__

```

总结，Mymeta下的__call__里的self.__new__在OldboyTeacher、Foo、Bar里都没有找到__new__的情况下，会去找object里的__new__，而object下默认就有一个__new__，所以即便是之前的类均未实现__new__,也一定会在object中找到一个，根本不会、也根本没必要再去找元类Mymeta->type中查找__new__

我们在元类的__call__中也可以用object.__new__(self)去造对象

**但我们还是推荐在__call__中使用self.__new__（self）去创造空对象，因为这种方式会检索三个类OldboyTeacher- >Foo->Bar,而object.__new__则是直接跨过了他们三个**

最后说明一点

```python
class Mymeta(type): #只有继承了type类才能称之为一个元类，否则就是一个普通的自定义类
    n=444

    def __new__(cls, *args, **kwargs):
        obj=type.__new__(cls,*args,**kwargs) # 必须按照这种传值方式
        print(obj.__dict__)
        # return obj # 只有在返回值是type的对象时，才会触发下面的__init__
        return 123

    def __init__(self,class_name,class_bases,class_dic):
        print('run。。。')

class OldboyTeacher(object, metaclass=Mymeta):  # OldboyTeacher = Mymeta('OldboyTeacher', (object,), {...})
    n=111

    school='oldboy'

    def __init__(self,name,age):
        self.name=name
        self.age=age

    def say(self):
        print('%s says welcome to the oldboy to learn Python' %self.name)

print(type(Mymeta)) #<class 'type'>
# 产生类OldboyTeacher的过程就是在调用Mymeta，而Mymeta也是type类的一个对象，那么Mymeta之所以可以调用，一定是在元类type中有一个__call__方法
# 该方法中同样需要做至少三件事：
# class type:
#     def __call__(self, *args, **kwargs): [[self]]=<class '__main__.Mymeta'>
#         obj=self.__new__(self,*args,**kwargs) # 产生Mymeta的一个对象
#         self.__init__(obj,*args,**kwargs)
#         return obj

```

## **基于元类实现单例模式**
```python
# 单例：即单个实例，指的是同一个类实例化多次的结果指向同一个对象，用于节省内存空间
# 如果我们从配置文件中读取配置来进行实例化，在配置相同的情况下，就没必要重复产生对象浪费内存了
# settings.py文件内容如下
HOST='1.1.1.1'
PORT=3306

# 方式一:定义一个类方法实现单例模式
import settings

class Mysql:
    __instance=None
    def __init__(self,host,port):
        self.host=host
        self.port=port

    @classmethod
    def singleton(cls):
        if not cls.__instance:
            cls.__instance=cls(settings.HOST,settings.PORT)
        return cls.__instance

obj1=Mysql('1.1.1.2',3306)
obj2=Mysql('1.1.1.3',3307)
print(obj1 is obj2)  # False

obj3=Mysql.singleton()
obj4=Mysql.singleton()
print(obj3 is obj4)  # True

# 方式二:定义一个装饰器实现单例模式
import settings  # 在此之前写过的一个配置文件

def singleton(cls): # cls=Mysql
    _instance=cls(settings.HOST,settings.PORT)

    def wrapper(*args,**kwargs):
        if args or kwargs:
            obj=cls(*args,**kwargs)
            return obj
        return _instance
    return wrapper

@singleton # Mysql=singleton(Mysql)
class Mysql:
    def __init__(self,host,port):
        self.host=host
        self.port=port

obj1=Mysql()
obj2=Mysql()
obj3=Mysql()
print(obj1 is obj2 is obj3) [[True]]

obj4=Mysql('1.1.1.3',3307)
obj5=Mysql('1.1.1.4',3308)
print(obj3 is obj4) [[False]]

# 方式三:基于元类的方式
class Mymeta(type):
    def __init__(self,class_name,class_bases,class_dic):
        if not class_name.istitle():
            raise TypeError('类名的首字母必须大写')
        if '__doc__' not in class_dic or not class_dic['__doc__'].strip():
            raise TypeError('必须有注释，且注释不能为空')
        super(Mymeta,self).__init__(class_name,class_bases,class_dic)
        self.__instance =None
    def __call__(self, *args, **kwargs):
        if not self.__instance:
            obj = object.__new__(self)
            self.__init__(obj)
            self.__instance = obj
        return self.__instance

class Mysql(object,metaclass=Mymeta):
    '''必须有注释'''
    def __init__(self):
        self.host = '127.0.0.1'
        self.port = 3306
    def conn(self):
        pass
    def execute(self):
        pass

obj1 =Mysql()
obj2 =Mysql()
obj3 =Mysql()
print(obj1 is obj2 is obj3)
# True

# 单例模式实现方式四:利用模块导入的知识，模块第一次导才会造名称空间，才会执行模块体代码

# singleton.py
import settings

class MySQL:
    print("run......")
    def __init__(self,ip,port):
        self.ip=ip
        self.port=port

instance=MySQL(settings.IP,settings.PORT)

# 单例模式.py
def f1():
    from singleton import instance
    print(instance)

def f2():
    from singleton import instance,MySQL
    print(instance)
    obj=MySQL('1.1.1.3',3302)
    print(obj)

f1()
f2()

# 单例实现
import threading

class SingletonType(type):
    _instance_lock = threading.Lock()
    def __call__(cls, *args, **kwargs):
        if not hasattr(cls, "_instance"):
            with SingletonType._instance_lock:
                if not hasattr(cls, "_instance"):
                    cls._instance = super(SingletonType,cls).__call__(*args, **kwargs)
        return cls._instance

class Foo(metaclass=SingletonType):
    def __init__(self,name):
        self.name = name

obj1 = Foo('name')
obj2 = Foo('name')
print(obj1)
print(obj2)

'''
<__main__.Foo object at 0x000001A7C4B97B70>
<__main__.Foo object at 0x000001A7C4B97B70>
'''

# 方式六:基于__new__方法。Python中类是通过__new__来创建实例的
class Singleton(object):
    def __new__(cls,*args,**kwargs):
        if not hasattr(cls,'_inst'):
            cls._inst=super(Singleton,cls).__new__(cls)
        return cls._inst
if __name__=='__main__':
    class A(Singleton):
        def __init__(self,s):
            self.s=s
    a=A('apple')
    b=A('banana')
    print(id(a),a.s)
    print(id(b),b.s)

'''
2365861035536 banana
2365861035536 banana
'''
# 通过__new__方法，将类的实例在创建的时候绑定到类属性_inst上。如果cls._inst为None，说明类还未实例化
# 实例化并将实例绑定到cls._inst，以后每次实例化的时候都返回第一次实例化创建的实例。注意从Singleton派生子类的时候，不要重载__new__

# 最简单的方法

class singleton(object):
     pass
singleton=singleton()

# 将名字singleton绑定到实例上，singleton就是它自己类的唯一对象了。

```
### 应用场景
```python
需要频繁实例化然后销毁的对象。

创建对象时耗时过多或者耗资源过多，但又经常用到的对象。
有状态的工具类对象。
频繁访问数据库或文件的对象。

生成全局惟一的序列号
访问全局复用的惟一资源，如磁盘、总线等
单个对象占用的资源过多，如数据库等
系统全局统一管理，如Windows下的Task Manager
网站计数器
```
### 单例优缺点
```python
优点：
在内存中只有一个对象，节省内存空间。
避免频繁的创建销毁对象，可以提高性能。
可以全局访问。
全局只有一个接入点，可以更好地进行数据同步控制，避免多重占用

缺点：
开销
虽然数量很少，但如果每次对象请求引用时都要检查是否存在类的实例，将仍然需要一些开销。可以通过使用静态初始化解决此问题。
可能的开发混淆
使用单例对象（尤其在类库中定义的对象）时，开发人员必须记住自己不能使用 new关键字实例化对象。因为可能无法访问库源代码，因此应用程序开发人员可能会意外发现自己无法直接实例化此类。
对象生存期
不能解决删除单个对象的问题。在提供内存管理的语言中（例如基于.NET Framework的语言），只有单例类能够导致实例被取消分配，因为它包含对该实例的私有引用。在某些语言中（如 C++），其他类可以删除对象实例，但这样会导致单例类中出现悬浮引用。
```
### 单例模式注意事项

只能使用单例类提供的方法得到单例对象，不要使用反射，否则将会实例化一个新对象。
不要做断开单例类对象与类中静态引用的危险操作。
多线程使用单例使用共享资源时，注意线程安全问题.
## 练习

### **在元类中控制把自定义类的数据属性都变成大写**

```python
class Mymetaclass(type):
    def __new__(cls,name,bases,attrs):
        update_attrs={}
        for k,v in attrs.items():
            if not callable(v) and not k.startswith('__'):
                update_attrs[k.upper()]=v
            else:
                update_attrs[k]=v
        return type.__new__(cls,name,bases,update_attrs)

class Chinese(metaclass=Mymetaclass):
    country='China'
    tag='Legend of the Dragon' [[龙的传人]]
    def walk(self):
        print('%s is walking' %self.name)

print(Chinese.__dict__)
'''
{'__module__': '__main__',
 'COUNTRY': 'China',
 'TAG': 'Legend of the Dragon',
 'walk': <function Chinese.walk at 0x0000000001E7B950>,
 '__dict__': <attribute '__dict__' of 'Chinese' objects>,
 '__weakref__': <attribute '__weakref__' of 'Chinese' objects>,
 '__doc__': None}
'''
```

### ****在元类中控制自定义的类无需__init__方法****

1.元类帮其完成创建对象，以及初始化操作；

2.要求实例化时传参必须为关键字形式，否则抛出异常TypeError: must use keyword argument

3.key作为用户自定义类产生对象的属性，且所有属性变成大写

```python
class Mymetaclass(type):
    # def __new__(cls,name,bases,attrs):
    #     update_attrs={}
    #     for k,v in attrs.items():
    #         if not callable(v) and not k.startswith('__'):
    #             update_attrs[k.upper()]=v
    #         else:
    #             update_attrs[k]=v
    #     return type.__new__(cls,name,bases,update_attrs)

    def __call__(self, *args, **kwargs):
        if args:
            raise TypeError('must use keyword argument for key function')
        obj = object.__new__(self)  # 创建对象，self 为类 Foo

        for k,v in kwargs.items():
            obj.__dict__[k.upper()]=v
        return obj

class Chinese(metaclass=Mymetaclass):
    country='China'
    tag='Legend of the Dragon' [[龙的传人]]
    def walk(self):
        print('%s is walking' %self.name)

p=Chinese(name='egon',age=18,sex='male')
print(p.__dict__)
```

### **在元类中控制自定义的类产生的对象相关的属性全部为隐藏属性**

```python
class Mymeta(type):
    def __init__(self,class_name,class_bases,class_dic):
        # 控制类Foo的创建过程
        super(Mymeta,self).__init__(class_name,class_bases,class_dic)

    def __call__(self, *args, **kwargs):
        # 控制Foo的调用过程，即Foo对象的产生过程
        obj = self.__new__(self)
        self.__init__(obj, *args, **kwargs)
        obj.__dict__={'_%s__%s' %(self.__name__,k):v for k,v in obj.__dict__.items()}
        return obj

class Foo(object,metaclass=Mymeta):  # Foo=Mymeta(...)
    def __init__(self, name, age,sex):
        self.name=name
        self.age=age
        self.sex=sex

obj=Foo('egon',18,'male')
print(obj.__dict__)
```


---
