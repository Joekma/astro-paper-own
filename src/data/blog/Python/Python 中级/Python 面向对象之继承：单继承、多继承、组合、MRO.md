---
title: Python 面向对象之继承：单继承、多继承、组合、MRO
author: Joekma
pubDatetime: 2024-08-13T00:00:00Z
modDatetime: 2026-04-29T00:00:00.000+08:00
slug: python-oop-inheritance
featured: false
draft: false
tags:
  - Python
  - 面向对象
  - 继承
description: '深入讲解Python面向对象中的继承，掌握单继承、多继承、组合、MRO等核心概念，学会运用继承实现代码复用。'
language: zh-CN
---

> 继承是面向对象编程的三大特性之一，通过继承可以实现代码复用，提高程序的可维护性和可扩展性。本文将详细介绍 Python 中的继承机制，包括单继承、多继承、组合以及方法解析顺序（MRO）。

## 学习目标

读完本文后，你将掌握：

- 理解继承的概念和作用
- 掌握单继承和多继承的语法
- 了解组合与继承的区别和使用场景
- 理解 Python 的 MRO（方法解析顺序）
- 学会使用抽象类和接口设计

# 面向对象三大特性之继承

## 继承

**最主要的作用：减少类与类之间代码冗余的问题**

在程序中继承是一种新建子类的方式，新创建的类称之为子类/派生类，被继承的类称之为父类/基类/超类，继承描述的是一种遗传关系。子类可以重用父类的属性。如何继承，先抽象再继承？

### 单继承和多继承

```python
class ParentClass1:  # 定义父类
    pass

class ParentClass2:  # 定义父类
    pass

class SubClass1(ParentClass1):  # 单继承，基类是ParentClass1，派生类是SubClass
    pass

class SubClass2(ParentClass1, ParentClass2):  # python支持多继承，用逗号分隔开多个继承的类
    pass
```

### 查看基类，父类

```python
>>> SubClass1.__bases__  # __base__只查看从左到右继承的第一个父类，__bases__则是查看所有继承的父类
(<class '__main__.ParentClass1'>,)
>>> SubClass2.__bases__
(<class '__main__.ParentClass1'>, <class '__main__.ParentClass2'>)
```

### 经典类与新式类

只有在python2中才分新式类和经典类，python3中统一都是新式类。

- 在python2中，没有显式的继承object类的类，以及该类的子类，都是经典类
- 在python2中，显式地声明继承object的类，以及该类的子类，都是新式类
- 在python3中，无论是否继承object，都默认继承object，即python3中所有类均为新式类

> 提示：如果没有指定基类，python的类会默认继承object类，object是所有python类的基类，它提供了一些常见方法（如__str__）的实现。

## 继承的实现方法——先抽象再继承

**继承描述的是子类与父类之间的关系，是一种什么是什么的关系。要找出这种关系，必须先抽象再继承。**

抽象即抽取类似或者说比较像的部分，抽象分成两个层次：

1. 将A和B这俩对象比较像的部分抽取成类
2. 将C，D，F这三个类比较像的部分抽取成父类

抽象最主要的作用是划分类别（可以隔离关注点，降低复杂度）。

**继承：是基于抽象的结果，通过编程语言去实现它，肯定是先经历抽象这个过程，才能通过继承的方式去表达出抽象的结构。**

抽象这个过程只是分析和设计的过程中，一个动作或者说一种技巧，通过抽象可以得到类。

在开发程序的过程中，如果我们定义了一个类A，然后又想新建立另外一个类B，但是类B的大部分内容与类A的相同时，我们不可能从头开始写一个类B，这就用到了类的继承的概念。

通过继承的方式新建类B，让B继承A，B会"遗传"A的所有属性（数据属性和函数属性），实现代码重用。

## 派生

当然子类也可以添加自己新的属性或者在自己这里重新定义这些属性（不会影响到父类），需要注意的是，一旦重新定义了自己的属性且与父类重名，那么调用新增的属性时，就以自己为准了。

```python
class Riven(Hero):
    camp = 'Noxus'

    def attack(self, enemy):  # 在自己这里定义新的attack，不再使用父类的attack，且不会影响父类
        print('from riven')

    def fly(self):  # 在自己这里定义新的
        print('%s is flying' % self.nickname)
```

**在子类中，新建的重名的函数属性，在编辑函数内功能的时候，有可能需要重用父类中重名的那个函数功能，应该是用调用普通函数的方式，即：类名.func()，此时就与调用普通函数无异了。因此即便是self参数也要为其传值（要理解，不再自动传值了）。**

```python
class Hero:
    def __init__(self, nickname, aggressivity, life_value):  # 绰号、攻击力
        self.nickname = nickname
        self.aggressivity = aggressivity
        self.life_value = life_value

    def move_forward(self):
        print('%s move forward' % self.nickname)

    def move_backward(self):
        print('%s move backward' % self.nickname)

    def move_left(self):
        print('%s move forward' % self.nickname)

    def move_right(self):
        print('%s move forward' % self.nickname)

    def attack(self, enemy):
        enemy.life_value -= self.aggressivity

class Garen(Hero):
    pass

class Riven(Hero):
    pass

class Riven(Hero):
    camp = 'Noxus'

    def __init__(self, nickname, aggressivity, life_value, skin):
        Hero.__init__(self, nickname, aggressivity, life_value)  # 调用父类功能
        self.skin = skin  # 新属性

    def attack(self, enemy):  # 在自己这里定义新的attack，不再使用父类的attack，且不会影响父类
        Hero.attack(self, enemy)  # 调用功能
        print('from riven')

    def fly(self):  # 在自己这里定义新的
        print('%s is flying' % self.nickname)

r1 = Riven('锐雯', 57, 200, '冠军之刃')
r1.fly()
print('所用皮肤为%s' % (r1.skin))
```

## 组合与重用

代码重用的重要方式除了继承之外还有另外一种方式，即：组合。组合也可以解决代码冗余的问题，但是组合反应的是一种什么是什么的关系。

组合指的是，在一个类中以另外一个类的对象作为数据属性，称为类的组合，或者说，将另外一个类产生的对象作为自己的属性成员（自己的一个属性来自于另外一个对象），这就是组合。

```python
class Equip:  # 武器装备类
    def Black_cutter(self):
        print('破甲提升30%')

class Riven:  # 英雄Riven的类，一个英雄需要有装备，因而需要组合Equip
    camp = 'Noxus'  # campaign 战役，战争，诺克萨斯

    def __init__(self, nickname):
        self.equip = Equip()  # 用Equip类产生一个装备（实例）赋值给实例的equip属性

r1 = Riven('锐雯')
r1.equip.Black_cutter()  # 可以使用组合的类产生的对象所持有的方法
```

组合与继承都是有效地利用已有类的资源的重要方式。但是二者的概念和使用场景皆不同：

**继承的方式：**

通过继承建立了派生类与基类之间的关系，它是一种"是什么"的关系，比如白马是马，人是动物。

当类之间有很多相同的功能，提取这些共同的功能做成基类，用继承比较好，比如老师是人，学生是人。

**组合的方式：**

用组合的方式建立了类与另外一个类的实例之间的关系，它是一种"有"的关系，比如教授有生日，教授教python和linux课程，教授有学生s1、s2、s3。

```python
class People:
    def __init__(self, name, age, sex):
        self.name = name
        self.age = age
        self.sex = sex

class Course:
    def __init__(self, name, period, price):
        self.name = name
        self.period = period
        self.price = price

    def tell_info(self):
        print("<%s %s %s>" % (self.name, self.period, self.price))

class Teacher(People):
    def __init__(self, name, age, sex, job_title):
        People.__init__(self, name, age, sex)  # 这就相当于调用一个普通函数，该传几个值传几个，没学面向对象都会
        self.job_title = job_title
        self.course = []
        self.student = []

class Student(People):
    def __init__(self, name, age, sex):
        People.__init__(self, name, age, sex)
        self.course = []

xuxubaobao = Teacher("旭旭宝宝", '18', 'man', "斗鱼第一老吊")
s1 = Student('大红神', 18, 'man')

taohou = Course("逃课", "10years", 0.5)
nizhenmeng = Course("逆真萌", "10years", 0.5)

# 为老师和学生添加课程
xuxubaobao.course.append(taohou)
xuxubaobao.course.append(nizhenmeng)
s1.course.append(taohou)

# 为老师添加学生
xuxubaobao.student.append(s1)

# 使用
for obj in xuxubaobao.course:
    obj.tell_info()  # course这个容器里面装了两个Course产生的对象，只要是Course实例化产生的对象都能使用类中的方法
```

**当类之间有显著不同，并且较小的类是较大的类所需要的组件时，用组合比较好。**

再看一个例子：

```python
# 先定义两个类，一个老师类，老师类有名字，年龄，出生的年、月和日，所教的课程等特征以及走路，教书的技能
class Teacher:
    def __init__(self, name, age, year, mon, day):
        self.name = name
        self.age = age
        self.year = year
        self.mon = mon
        self.day = day

    def walk(self):
        print("%s is walking slowly" % self.name)

    def teach(self):
        print("%s is teaching" % self.name)

# 再定义一个学生类，学生类有名字，年龄，出生的年、月和日，学习的组名等特征以及走路，学习的技能
class Student:
    def __init__(self, name, age, year, mon, day):
        self.name = name
        self.age = age
        self.year = year
        self.mon = mon
        self.day = day

    def walk(self):
        print("%s is walking slowly" % self.name)

    def study(self):
        print("%s is studying" % self.name)

# 根据类的继承这个特性，可以把代码缩减一下。定义一个人类，然后再让老师类和学生类继承人类的特征和技能
class People:
    def __init__(self, name, age, year, mon, day):
        self.name = name
        self.age = age
        self.year = year
        self.mon = mon
        self.day = day

    def walk(self):
        print("%s is walking" % self.name)

class Teacher(People):
    def __init__(self, name, age, year, mon, day, course):
        People.__init__(self, name, age, year, mon, day)
        self.course = course

    def teach(self):
        print("%s is teaching" % self.name)

class Student(People):
    def __init__(self, name, age, year, mon, day, group):
        People.__init__(self, name, age, year, mon, day)
        self.group = group

    def study(self):
        print("%s is studying" % self.name)

# 再对老师和学生进行实例化，得到一个老师和一个学生
t1 = Teacher("alex", 28, 1989, 9, 2, "python")
s1 = Student("jack", 22, 1995, 2, 8, "group2")

# 现在想知道t1和s1的名字，年龄，出生的年、月、日都很容易，但是想一次性打印出t1或s1的生日就不那么容易了，这时就需要用字符串进行拼接了，有没有什么更好的办法呢？那就是组合。

# 继承是一个子类是一个父类的关系，而组合则是一个类有另一个类的关系。
# 可以说每个人都有生日，而不能说人是生日，这样就要使用组合的功能。
# 可以把出生的年月和日另外再定义一个日期的类，然后用老师或者是学生与这个日期的类组合起来，就可以很容易得出老师t1或者学生s1的生日了，再也不用字符串拼接那么麻烦了。

class Date:
    def __init__(self, year, mon, day):
        self.year = year
        self.mon = mon
        self.day = day

    def birth_info(self):
        print("The birth is %s-%s-%s" % (self.year, self.mon, self.day))

class People:
    def __init__(self, name, age, year, mon, day):
        self.name = name
        self.age = age
        self.birth = Date(year, mon, day)

    def walk(self):
        print("%s is walking" % self.name)

class Teacher(People):
    def __init__(self, name, age, year, mon, day, course):
        People.__init__(self, name, age, year, mon, day)
        self.course = course

    def teach(self):
        print("%s is teaching" % self.name)

class Student(People):
    def __init__(self, name, age, year, mon, day, group):
        People.__init__(self, name, age, year, mon, day)
        self.group = group

    def study(self):
        print("%s is studying" % self.name)

t1 = Teacher("alex", 28, 1989, 9, 2, "python")
s1 = Student("jack", 22, 1995, 2, 8, "group2")

# 这样一来，可以使用跟前面一样的方法来调用老师t1或学生s1的姓名，年龄等特征以及走路，教书或者学习的技能。
print(t1.name)
t1.walk()
t1.teach()

# 输出为：
# alex
# alex is walking
# alex is teaching

# 那要怎么能够知道他们的生日呢？
print(t1.birth)
# 输出为：
# <__main__.Date object at 0x0000000002969550>

# 这个birth是子类Teacher从父类People继承过来的，而父类People的birth又是与Date这个类组合在一起的，所以，这个birth是一个对象。
# 而在Date类下面有一个birth_info的技能，这样就可以通过调用Date下面的birth_info这个函数属性来知道老师t1的生日了。

t1.birth.birth_info()
# 得到的结果为：The birth is 1989-9-2

# 同样的，想知道实例学生s1的生日也用同样的方法
s1.birth.birth_info()
# 得到的结果为：The birth is 1995-2-8

# 组合就是一个类中使用到另一个类，从而把几个类拼到一起。组合的功能也是为了减少重复代码。
```

## 接口与归一化设计思想

### java中的接口

```java
// 第一部分：Java 语言中的接口很好的展现了接口的含义
// IAnimal.java

/*
* Java的Interface接口的特点：
* 1) 是一组功能的集合，而不是一个功能
* 2) 接口的功能用于交互，所有的功能都是public，即别的对象可操作
* 3) 接口只定义函数，但不涉及函数实现
* 4) 这些功能是相关的，都是动物相关的功能，但光合作用就不适宜放到IAnimal里面
*/

package com.oo.demo;
public interface IAnimal {
    public void eat();
    public void run();
    public void sleep();
    public void speak();
}
```

```java
// 第二部分：Pig.java：猪"的类设计，实现了IAnimal接口
package com.oo.demo;
public class Pig implements IAnimal {  // 如下每个函数都需要详细实现
    public void eat(){
        System.out.println("Pig like to eat grass");
    }

    public void run(){
        System.out.println("Pig run: front legs, back legs");
    }

    public void sleep(){
        System.out.println("Pig sleep 16 hours every day");
    }

    public void speak(){
        System.out.println("Pig can not speak");
    }
}
```

> 给我开个查询接口。此时的接口指的是：自己提供给使用者来调用自己功能的方式、方法、入口。

### 为何要用接口

接口提取了一群类共同的函数，可以把接口当做一个函数的集合。然后让子类去实现接口中的函数。这么做的意义在于归一化，什么叫归一化，就是只要是基于同一个接口实现的类，那么所有的这些类产生的对象在使用时，从用法上来说都一样。

### 归一化的好处

1. 归一化让使用者无需关心对象的类是什么，只需要的知道这些对象都具备某些功能就可以了，这极大地降低了使用者的使用难度。
2. 归一化使得高层的外部使用者可以不加区分的处理所有接口兼容的对象集合。
   - 就好像linux的泛文件概念一样，所有东西都可以当文件处理，不必关心它是内存、磁盘、网络还是屏幕。
   - 再比如：我们有一个汽车接口，里面定义了汽车所有的功能，然后由本田汽车的类，奥迪汽车的类，大众汽车的类，他们都实现了汽车接口，这样就好办了，大家只需要学会了怎么开汽车，那么无论是本田，还是奥迪，还是大众我们都会开了，开的时候根本无需关心我开的是哪一类车，操作手法（函数调用）都一样。

### 模仿interface

在python中根本就没有一个叫做interface的关键字，如果非要去模仿接口的概念，可以借助第三方模块：zope.interface。

```python
class Interface:  # 定义接口Interface类来模仿接口的概念，python中压根就没有interface关键字来定义一个接口
    def read(self):  # 定接口函数read
        pass

    def write(self):  # 定义接口函数write
        pass

class Txt(Interface):  # 文本，具体实现read和write
    def read(self):
        print('文本数据的读取方法')

    def write(self):
        print('文本数据的写入方法')

class Sata(Interface):  # 磁盘，具体实现read和write
    def read(self):
        print('硬盘数据的读取方法')

    def write(self):
        print('硬盘数据的写入方法')

class Process(Interface):
    def read(self):
        print('进程数据的读取方法')

    def write(self):
        print('进程数据的写入方法')
```

**上面的代码只是看起来像接口，其实并没有起到接口的作用，子类完全可以不用去实现接口，这就用到了抽象类。**

## 抽象类

### 什么是抽象类

与java一样，python也有抽象类的概念但是同样需要借助模块实现，抽象类是一个特殊的类，它的特殊之处在于只能被继承，不能被实例化。

### 为什么要有抽象类

如果说类是从一堆对象中抽取相同的内容而来的，那么抽象类就是从一堆类中抽取相同的内容而来的，内容包括数据属性和函数属性。

比如我们有香蕉的类，有苹果的类，有桃子的类，从这些类抽取相同的内容就是水果这个抽象的类，你吃水果时，要么是吃一个具体的香蕉，要么是吃一个具体的桃子......你永远无法吃到一个叫做水果的东西。

从设计角度去看，如果类是从现实对象抽象而来的，那么抽象类就是基于类抽象而来的。

从实现角度来看，抽象类与普通类的不同之处在于：抽象类中只能有抽象方法（没有实现功能），该类不能被实例化，只能被继承，且子类必须实现抽象方法。这一点与接口有点类似，但其实是不同的。

### 在python中实现抽象类

```python
# 一切皆文件思想
import abc  # 利用abc模块实现抽象类

class Allfile(metaclass=abc.ABCMeta):
    all_type = 'file'

    @abc.abstractmethod  # 定义抽象方法，无需实现功能
    def read(self):
        "子类必须定义读功能"
        pass

    @abc.abstractmethod  # 定义抽象方法，无需实现功能
    def write(self):
        "子类必须定义写功能"
        pass

# class Txt(Allfile):
#     pass
```

## 总结

### 核心要点

本文详细介绍了 Python 面向对象中的继承机制：

1. **继承减少代码冗余**：子类继承父类的属性和方法，实现代码复用
2. **单继承与多继承**：
   - 单继承：一个子类只继承一个父类
   - 多继承：一个子类继承多个父类（用逗号分隔）
3. **派生与重写**：子类可以重写父类的方法，也可以添加新的属性
4. **组合更灵活**：通过对象引用实现代码复用，耦合度更低

### 继承 vs 组合对比

| 特性 | 继承 | 组合 |
|------|------|------|
| **关系** | "是什么" (is-a) | "有什么" (has-a) |
| **耦合度** | 高 | 低 |
| **灵活性** | 低 | 高 |
| **代码复用** | 通过父类直接复用 | 通过对象引用复用 |
| **适用场景** | 类之间有明显的层次关系 | 类之间是组装关系 |
| **例子** | 学生是人，狗是动物 | 老师有课程，学生有老师 |

### Python 3 新特性

- **统一为新式类**：Python 3 中所有类都默认继承 object
- **MRO 算法**：Python 采用 C3 线性化算法确定方法解析顺序
- **super() 函数**：推荐使用 `super().__init__()` 调用父类构造方法

### 设计建议

> 💡 **提示**：遵循"**组合 > 继承**"的原则。继承虽然简单，但耦合度高；组合更加灵活，应优先考虑。只有当类之间存在明显的"是什么"关系时才使用继承。

### 抽象类的使用场景

- 定义接口规范，强制子类实现特定方法
- 提供公共实现，减少子类代码重复
- 使用 `@abc.abstractmethod` 装饰器定义抽象方法
