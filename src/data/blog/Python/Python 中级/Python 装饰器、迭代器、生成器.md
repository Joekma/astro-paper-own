---
title: Python 装饰器、迭代器、生成器
author: FjellOverflow
pubDatetime: 2018-09-28T00:00:00Z
modDatetime: 2026-04-22T00:00:00Z
featured: false
draft: false
tags:
  - Python
  - 装饰器
  - docs
description: Python 装饰器、迭代器、生成器分析，涵盖装饰器模式、迭代器协议、生成器yield等核心概念。
---

# Python 装饰器、迭代器、生成器

## 装饰器

### 什么是装饰器

装饰器本身可以是任意可调用的对象 => 函数
被装饰的对象也可以是任意可调用的对象 => 函数

**一个装饰器是一个需要另一个函数作为参数的函数。在装饰器内部动态定义一个函数：wrapper。这个函数将被包装在原始函数的四周，因此就可以在原始函数之前和之后执行一些代码。**

### 为何要用装饰器

开放封闭原则：软件一旦上线就应该对修改封闭，对扩展开放

- 对修改封闭：
  1. 不能修改功能的源代码
  2. 也不能修改功能的调用方式
- 对扩展开放：可以为原有的功能添加新的功能

装饰器就是要在不修改功能源代码以及调用方式的前提下为原功能添加额外新的功能。

### 无参装饰器

```python
def outter(func):
    def wrapper(*args, **kwargs):
        res = func(*args, **kwargs)
        return res
    return wrapper
```

### 简单装饰器

```python
import time

def index():
    print('welcome to index page')
    time.sleep(3)
    return 123

def home(name):
    print('welcome %s to home page' % name)
    time.sleep(1)

def outter(func):
    # func = 最原始那个home的内地址
    def wrapper(*args, **kwargs):
        start = time.time()
        res = func(*args, **kwargs)
        stop = time.time()
        print('run time is %s' % (stop - start))
        return res
    return wrapper
```

### 装饰器的语法糖

```python
# @装饰器的名字: 要在被装饰对象正上方单独一行写上
import time
from functools import wraps

def timmer(func):
    @wraps(func)  # 自动保存原函数的属性
    def wrapper(*args, **kwargs):
        start = time.time()
        res = func(*args, **kwargs)
        stop = time.time()
        print('run time is %s' % (stop - start))
        return res
    return wrapper

@timmer
def index():
    """这是index功能"""
    print('welcome to index page')
    time.sleep(3)
    return 123

@timmer
def home(name):
    """这是home功能"""
    print('welcome %s to home page' % name)
    time.sleep(1)

# 查看函数属性
print(home.__name__)  # 输出: home
print(home.__doc__)   # 输出: 这是home功能
```

### 有参装饰器

```python
# 参数默认为空字符串
def title(show=''):
    def printStar(func):
        def f(a, b):
            print(show, "*************************")
            return func(a, b)
        return f
    return printStar

@title('add')
def add(a, b):
    return a + b

@title()
def sub(a, b):
    return a - b

print(add(1, 1))  # 输出: add *************************
                      #   2
print(sub(2, 1))  # 输出:  *************************
                      #   1
```

### 完整的有参装饰器示例

```python
def outter2(xxx, yyy):
    def outter(func):
        def wrapper(*args, **kwargs):
            res = func(*args, **kwargs)
            print(xxx)
            print(yyy)
            return res
        return wrapper
    return outter

import time

user_info = {'current_user': None}

def auth2(engine='file'):
    def auth(func):
        def wrapper(*args, **kwargs):
            if user_info['current_user'] is not None:
                res = func(*args, **kwargs)
                return res
            inp_user = input('username>>>: ').strip()
            inp_pwd = input('password>>>: ').strip()
            if engine == 'file':
                print('基于文件的认证')
                if inp_user == 'egon' and inp_pwd == '123':
                    user_info['current_user'] = inp_user
                    print('login successful')
                    res = func(*args, **kwargs)
                    return res
                else:
                    print('user or password error')
            elif engine == 'mysql':
                print('基于mysql数据的认证')
            elif engine == 'ldap':
                print('基于ldap的认证')
            else:
                print('无法识别认证源')
        return wrapper
    return auth

@auth2(engine='file')
def index():
    """这是index功能"""
    print('welcome to index page')
    time.sleep(2)
    return 123

@auth2(engine='file')
def home(name):
    """这是home功能"""
    print('welcome %s to home page' % name)
    time.sleep(1)

index()
home('joek')
```

### 叠加多个装饰器

当一个被装饰的对象同时叠加多个装饰器时：

- 装饰器的加载顺序是：自下而上
- 装饰器内wrapper函数的执行顺序是：自上而下

```python
import time

def timmer(func):
    # func = wrapper2的内存地址
    def wrapper1(*args, **kwargs):
        print('===================================>wrapper1运行了')
        start = time.time()
        res = func(*args, **kwargs)  # 跳到wrapper2去执行了
        stop = time.time()
        print('run time is %s' % (stop - start))
        return res
    return wrapper1

def auth(engine='file'):
    def xxx(func):
        # func = 最原始那个index的内存地址
        def wrapper2(*args, **kwargs):
            print('===================================>wrapper2运行了')
            name = input('username>>>: ').strip()
            pwd = input('password>>>: ').strip()
            if engine == 'file':
                print('基于文件的认证')
                if name == 'egon' and pwd == '123':
                    print('login successful')
                    res = func(*args, **kwargs)
                    return res
            elif engine == 'mysql':
                print('基于mysql的认证')
            elif engine == 'ldap':
                print('基于ldap的认证')
            else:
                print('错误的认证源')
        return wrapper2
    return xxx

# 装饰器的顺序不一样结果不一样，上一个的运行时间包含了另外一个装饰器的运行时间
@timmer
@auth(engine='file')
def index():
    print('welcome to index page')
    time.sleep(2)

index()  # wrapper1的内存地址()
```

## 迭代器

### 什么是迭代器

迭代指的是一个重复的过程，每一次重复都是基于上一次的结果而来的。
迭代器指的是迭代取值的工具，该工具的特点是可以不依赖于索引取值。

### 为何要用迭代器

为了找出一种通用的、可以不依赖于索引的迭代取值方式。

### 如何用迭代器

- **可迭代的对象**：但凡内置有 `.__iter__` 方法的对象都称之为可迭代的对象
- **迭代器对象**：既内置有 `__iter__` 方法，又内置有 `__next__` 方法

### 迭代器示例

```python
dic = {'x': 1, 'y': 2, 'z': 3}

# 把字典转化成迭代器
iter_dic = dic.__iter__()
print(iter_dic)

# __iter__返回迭代器本身
print(iter_dic.__iter__())

# 迭代取值
res1 = iter_dic.__next__()
print(res1)  # x
res2 = iter_dic.__next__()
print(res2)  # y
res3 = iter_dic.__next__()
print(res3)  # z
```

### for循环的原理

for准确地说应该是迭代器循环，for循环的原理如下：
1. 先调用 in 后面那个值的 `__iter__` 方法，得到迭代器对象
2. 执行迭代器的 `__next__()` 方法得到一个返回值，然后赋值给一个变量k，运行循环体代码
3. 循环往复，直到迭代器取值完毕抛出异常然后捕捉异常自动结束循环

```python
dic = {'x': 1, 'y': 2, 'z': 3}

for k in dic:
    print(k)

# 等价于:
# iter_dic = dic.__iter__()
# while True:
#     try:
#         k = iter_dic.__next__()
#         print(k)
#     except StopIteration:
#         break
```

### 文件也是可迭代对象

```python
# 读取文件内容
with open(r'db.txt', mode='rt', encoding='utf-8') as f:
    for line in f:
        print(line)

# 等价于:
# iter_file = f.__iter__()
# while True:
#     try:
#         line = iter_file.__next__()
#         print(line)
#     except StopIteration:
#         break
```

### 自定义迭代器（生成器）

yield关键字：只能用在函数内。在函数内凡包含有yield关键字，再去执行函数，就不会立刻运行函数体代码了，会得到一个返回值，该返回值称之为生成器对象，生成器本质就是迭代器。

```python
def func():
    print('=====>第一次')
    yield 1
    print('=====>第二次')
    yield 2
    print('=====>第三次')
    yield 3
    print('=====>第四次')

g = func()
print(next(g))  # 输出: =====>第一次
                  #       1
print(next(g))  # 输出: =====>第二次
                  #       2
```

### yield VS return

**相同点**：都可以用于返回值

**不同点**：yield可以暂停函数，可以返回多次值，而return只能返回值一次函数就立刻终止

```python
def my_range(start, stop, step=1):
    while start < stop:
        yield start
        start += step

# 生成器按需产生值，节省内存
for item in my_range(1, 5, 2):
    print(item)
# 输出: 1
#       3
```

## 生成器

### 生成器函数

生成器函数：常规函数定义，但是使用yield语句而不是return语句返回结果。

**本质**：迭代器（自带了 `__iter__` 方法和 `__next__` 方法，不需要我们去实现）

**特点**：惰性运算，开发者自定义

```python
import time

def generator_fun1():
    a = 1
    print('现在定义了a变量')
    yield a
    b = 2
    print('现在又定义了b变量')
    yield b

g1 = generator_fun1()
print('g1 : ', g1)  # 输出: g1 :  <generator object generator_fun1 at 0x...>
print('-' * 20)
print(next(g1))
# 输出: 现在定义了a变量
#       1
time.sleep(1)
print(next(g1))
# 输出: 现在又定义了b变量
#       2
```

### 生成器监听文件输入的例子

```python
import time

def tail(filename):
    f = open(filename)
    f.seek(0, 2)  # 从文件末尾算起
    while True:
        line = f.readline()  # 读取文件中新的文本行
        if not line:
            time.sleep(0.1)
            continue
        yield line

# 使用生成器实时监控日志文件
# g = tail('access.log')
# for line in g:
#     print(line)
```

### 生成器与内存优化

```python
# 不使用生成器 - 所有结果一次性加载到内存
def getquares(n):
    result = []
    for i in range(n):
        result.append(i * i)
    return result

# 使用生成器 - 按需生成，节省内存
def getquares_generator(n):
    for i in range(n):
        yield i * i

# 对比测试
import sys

# 生成器只占用少量内存（生成器对象本身）
gen = getquares_generator(1000000)
print(sys.getsizeof(gen))  # 很小的内存占用

# 列表占用大量内存
lst = getquares(1000000)
print(sys.getsizeof(lst))  # 很大的内存占用
```

### 生成器的优势

1. **惰性计算**：只有在需要时才计算值，节省内存
2. **流式处理**：可以处理无限序列
3. **代码简洁**：避免一次性创建大型数据结构

```python
# 无限序列
def infinite_sequence():
    num = 0
    while True:
        yield num
        num += 1

# 斐波那契数列
def fibonacci():
    a, b = 0, 1
    while True:
        yield a
        a, b = b, a + b

# 使用生成器
for i, fib_num in enumerate(fibonacci()):
    if i > 10:
        break
    print(fib_num)
# 输出: 0 1 1 2 3 5 8 13 21 34 55
```
