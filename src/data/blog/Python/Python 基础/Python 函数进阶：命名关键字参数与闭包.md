---
title: Python 函数进阶：命名关键字参数与闭包
author: Joekma
pubDatetime: 2018-08-13T00:00:00.000+08:00
modDatetime: 2026-04-22T00:00:00.000+08:00
slug: python-advanced-functions-closure
description: '深入讲解Python的命名关键字参数、函数对象、嵌套、名称空间与作用域、闭包等高级概念。'
tags:
  - Python
  - 函数
  - 闭包
  - 作用域
  - 命名空间
draft: false
series: python
seriesOrder: 20
language: zh-CN
---

> 函数是 Python 的一等公民。本文将深入介绍命名关键字参数、函数对象、嵌套、名称空间与作用域，以及闭包函数等高级概念，帮助你提升 Python 编程能力。

## 关键字参数

对于关键字参数，函数的调用者可以传入任意不受限制的关键字参数。至于到底传入了哪些，就需要在函数内部通过检查。

以 `person()` 函数为例，我们检查是否有传入的 `city` 和 `job` 参数：

```python
def person(name, age, **ss):
    if 'city' in ss:
        # 有city参数
        pass
    if 'job' in ss:
        # 有job参数
        pass
    print('name:', name, 'age:', age, 'other:', ss)

person('Joek', 24, city='shanghai', addr='yang', number=123456)
# 输出: name: Joek age: 24 other: {'city': 'shanghai', 'addr': 'yang', 'number': 123456}
```

> 可以看出，调用者可以传入不受限制的关键字参数，不仅仅只是我们想要的 city 和 job 参数。

## 命名关键字参数

如果要限制关键字参数的名字，就可以用命名关键字参数。例如，只接收 `city` 和 `job` 作为关键字参数：

```python
def person(name, age, *, city, job):
    print(name, age, city, job)

# person('Joek', 24, city='shanghai', job='it', number=123456)
# TypeError: person() got an unexpected keyword argument 'number'

person('Joek', 24, city='shanghai', job='it')
# 输出: Joek 24 shanghai it
```

和关键字参数 `**ss` 不同，命名关键字参数需要一个特殊分隔符 `*`，`*` 后面的参数被视为命名关键字参数。

### 与可变参数配合使用

如果函数定义中已经有了一个可变参数，后面跟着的命名关键字参数就不再需要一个特殊分隔符 `*` 了：

```python
def person(name, age, *args, city, job):
    print(name, age, args, city, job)
```

### 必须传入参数名

命名关键字参数必须传入参数名，这和位置参数不同。如果没有传入参数名，调用将报错：

```python
def person(name, age, *, city, job):
    print(name, age, city, job)

person('Joek', 24, 'shanghai', 'it')
# TypeError: person() takes 2 positional arguments but 4 were given
```

### 默认值

命名关键字参数可以有默认值，从而简化调用：

```python
def person(name, age, *, city='shanghai', job):
    print(name, age, city, job)

person('Joek', 24, job='it')
# 输出: Joek 24 shanghai it
```

### 注意事项

> 如果没有可变参数，就必须加一个 `*` 作为特殊分隔符。如果缺少 `*`，Python 解释器将无法识别位置参数和命名关键字参数：

```python
def person(name, age, city, job):
    # 缺少 *，city和job被视为位置参数
    pass
```

## 函数对象

函数是第一类对象：指的是函数的内存地址可以像一个变量值一样去使用。函数作为对象可以：

- 赋值给一个变量
- 作为元素添加到集合对象中
- 作为参数值传递给其它函数
- 作为函数的返回值

### 函数值可以被引用

```python
def person(name):
    print(name)

# id()函数用于获取对象的内存地址
print(id(person), type(person), person)
# 输出: 2026874247368 <class 'function'> <function person at 0x000001D7EB1E98C8>

per = person
per('joek')
# 输出: joek
```

赋值给另外一个变量时，函数并不会被调用，仅仅是在函数对象上绑定一个新的名字而已。

### 变量值可以当作参数传给另外一个函数

```python
def person(name):
    print(name)

def show(func):
    name = 'joek'
    return func(name)

show(person)
# 输出: joek
```

### 变量值可以当作函数的返回值

```python
def person(name):
    print(name)

def put(func):
    return person

put(person)('joek')
# 输出: joek
```

### 高阶函数

函数接受一个或多个函数作为输入或者函数输出（返回）的值是函数时，我们称这样的函数为**高阶函数**。

Python 内置函数中，典型的高阶函数是 `map` 函数：

```python
def person(name):
    print(name)

lens = map(person, ["a", "b", "c", "d"])
print(list(lens))
# 输出:
# a
# b
# c
# d
# [None, None, None, None]
```

`map` 函数的作用相当于：

```python
print([person(i) for i in ["the", "zen", "of", "python"]])
```

只不过 `map` 的运行效率更快一点。

### 变量值可以当作容器类型的元素

```python
def person(name):
    print(name)

funcs = [person, str, len]
for f in funcs:
    print(f("joek"))

# 等效于
funcs[0]("joek")
```

## 参数传递的本质

### Python 中的一切皆为对象

在 Python 中，一切皆为对象。数字是对象，列表是对象，函数也是对象，任何东西都是对象。而变量是对象的一个引用（又称为名字或者标签）。

```python
a = []
a.append(1)
```

在 Python 中，「变量」更准确叫法是「名字」，赋值操作 `=` 就是把一个名字绑定到一个对象上。

### 参数传递的本质

Python 函数中，**参数的传递本质上是一种赋值操作**，而赋值操作是一种名字到对象的绑定过程。

```python
def foo(arg):
    arg = 2
    print(arg)

a = 1
foo(a)  # 输出: 2
print(a)  # 输出: 1
```

在例子中，变量 a 绑定了 1，调用函数 `foo(a)` 时，相当于给参数 `arg` 赋值 `arg=1`。在函数里面 `arg` 重新赋值为 2 之后，相当于把 1 上的 `arg` 标签撕掉，贴到 2 身上，而 1 上的另外一个标签 `a` 一直存在。

```python
def bar(args):
    args.append(1)

b = []
print(b)       # 输出: []
print(id(b))   # 输出: 4324106952

bar(b)
print(b)       # 输出: [1]
print(id(b))   # 输出: 4324106952
```

执行 `append` 方法前 `b` 和 `arg` 都指向（绑定）同一个对象。`append` 方法只是对列表对象插入一个元素，对象还是那个对象，只是对象里面的内容变了。

> **结论**：Python 参数传递采用的是"传对象引用"的方式。如果函数收到的是一个可变对象（比如字典或者列表）的引用，就能修改对象的原始值；如果函数收到的是一个不可变对象（比如数字、字符或者元组）的引用，就不能直接修改原始对象。

### 默认参数的陷阱

```python
def bad_append(new_item, a_list=[]):
    a_list.append(new_item)
    return a_list

print(bad_append('one'))  # ['one']
print(bad_append('one'))  # ['one', 'one']  ← 问题所在！
```

> **重要**：不要使用可变（mutable）对象作为参数的默认值！

正确的方式是，把参数默认值指定为 `None`：

```python
def good_append(new_item, a_list=None):
    if a_list is None:
        a_list = []
    a_list.append(new_item)
    return a_list

print(good_append('one'))  # ['one']
print(good_append('one'))  # ['one']
```

## 函数的嵌套

### 函数的嵌套调用

在一个函数内部又调用其他函数：

```python
def max2(x, y):
    if x > y:
        return x
    else:
        return y

def max4(a, b, c, d):
    res1 = max2(a, b)
    res2 = max2(res1, c)
    res3 = max2(res2, d)
    return res3

print(max4(1, 2, 3, 4))  # 4
```

### 函数的嵌套定义

在函数内又定义了其他函数：

```python
def func():
    def foo():
        print('from foo')
    print(foo)
    foo()
    x = 1
    print(x)

func()
```

### 实现了 __call__ 的类也可以作为函数

```python
class Add:
    def __init__(self, n):
        self.n = n

    def __call__(self, x):
        return self.n + x

add = Add(1)
print(add(4))  # 5
```

执行 `add(4)` 相当于调用 `Add.__call__(add, 4)`。

### 判断对象是否可调用

```python
print(callable(1))     # False
print(callable(int))   # True
```

## 名称空间与作用域

### 名称空间

名称空间（Namespaces）指的是存放名字与值内存地址绑定关系的地方。

### 四种名称空间类型

| 类型 | 说明 | 产生 | 销毁 |
|------|------|------|------|
| **内置名称空间** | Python 解释器自带的名字 | Python 解释器启动 | Python 解释器关闭 |
| **全局名称空间** | 在顶级定义的名字 | 执行 Python 程序时 | 程序执行完毕后 |
| **局部名称空间** | 在函数内定义的名字 | 函数调用时 | 函数调用完毕后 |
| **外围名称空间** | 上层函数的本地作用域 | 函数定义时 | 函数执行完毕后 |

### 名称空间的查找顺序

名称空间产生的先后顺序：**内置 → 全局 → 局部**

查找名字的顺序（**LEGB 法则**）：

1. **L**ocal - 本地函数内部
2. **E**nclosing - 直接外围空间（上层函数）
3. **G**lobal - 全局空间（模块）
4. **B**uiltin - 内置模块

### 作用域

作用域指的是作用范围。

| 类型 | 说明 | 特点 |
|------|------|------|
| **全局作用域** | 包含内置与全局名称空间的名字 | 全局存活，全局有效 |
| **局部作用域** | 包含局部名称空间的名字 | 临时存活，局部有效 |

### 作用域关系是在函数定义阶段就已经固定死了

```python
xxx = 111

def f1():
    print(xxx)

def f2():
    xxx = 222
    f1()

f2()  # 输出: 111
```

## global 与 nonlocal 关键字

### global 关键字

如果确实想要在函数内部改变全局变量的值，可以使用 `global` 关键字：

```python
count = 5

def myfun():
    global count  # global关键字告诉 Python 要改变全局变量了
    count = 10
    return count

print(count)      # 输出: 5
print(myfun())    # 输出: 10
```

### nonlocal 关键字

`nonlocal` 关键字用于在内层函数中修改外层函数的变量：

```python
def f1():
    a = 5
    def f2():
        nonlocal a  # 不写 nonlocal 会报错
        if 8 < 5:
            a = 7
        return a
    return f2()

print(f1())
```

**使用 nonlocal 的条件**：
1. 外部必须有这个变量
2. 在内部函数声明 `nonlocal` 变量之前不能再出现同名变量
3. 内部修改这个变量如果想在外部有这个变量的第一层函数中生效

## 闭包函数

### 闭包的作用

1. 避免使用全局变量，实现数据隐藏和封装
2. 当成员变量比较少，以及方法只有一个时，比类更简单实现
3. 数据和函数一起封装，适应异步或并发运行

### 什么时候定义了一个闭包

当在一个函数里嵌套定义一个函数时，就会产生一个闭包。定义一个闭包需要下面几个条件：

1. 嵌套函数定义（函数内定义函数）
2. 最内层嵌套函数访问函数外的局部变量
3. 函数返回内嵌套函数对象

```python
def outter():
    x = 1
    def inner():
        print('from inner', x)
    return inner

f = outter()

def foo():
    x = 111111111111111111111111111111111111
    f()

foo()
```

### 为函数体传值的两种方式

**方式一**：直接以参数的形式传入

```python
def foo(name):
    print('hello %s' % name)

foo('egon')
foo('egon')
foo('egon')
```

**方式二**：闭包函数

```python
def outter(name):
    def foo():
        print('hello %s' % name)
    return foo

f = outter('egon')
f()
f()
f()

f1 = outter('alex')
f1()
f1()
f1()
```

### 彻底理解闭包

```python
def make_mul(n):
    def mul(x):
        return x * n
    return mul

test1 = make_mul(3)
test2 = make_mul(5)

print(test1)             # <function make_mul.<locals>.mul at ...>
print(test2)             # <function make_mul.<locals>.mul at ...>
print(test2(test1(2)))   # 30

print(test1.__closure__[0].cell_contents)  # 3
print(test2.__closure__[0].cell_contents)  # 5
```

> 从上面这个例子里，可以看到局部变量 `n` 会保存起来，并且在这里并没有使用全局变量，就可以达到这个目标，并且数据也可以隐藏起来。

在 Python 里可以通过 `__closure__` 来查看闭包时保存的环境变量的值。

### 闭包最重要的使用价值

**闭包最重要的使用价值在于：封存函数执行的上下文环境**

闭包在其捕捉的执行环境（def 语句块所在上下文）中，也遵循 LEGB 规则逐层查找，直至找到符合要求的变量，或者抛出异常。

### 闭包的应用

闭包的重要特性是**封存上下文**，这一特性可以巧妙的被用于现有函数的包装，从而为现有函数增加功能，这就是**装饰器**。

```python
alist = range(1, 101)

def wrapper():
    alist = range(1, 101)
    def lazy_sum():
        return reduce(lambda x, y: x + y, alist)
    return lazy_sum

lazy_sum = wrapper()

if __name__ == "__main__":
    print(lazy_sum())  # 5050
```

这是一个典型的 Lazy Evaluation（惰性求值）的例子。局部变量在函数返回时，通常会被垃圾回收器回收，但这里的 `alist` 没有，因为它随着 `lazy_sum` 函数对象的返回被一并返回了。

## 小结

| 概念 | 说明 |
|------|------|
| **命名关键字参数** | 使用 `*` 分隔符限制关键字参数名 |
| **函数对象** | 函数是一等公民，可以赋值、作为参数、返回值 |
| **参数传递** | 本质是赋值操作，传对象引用 |
| **函数嵌套** | 函数内定义函数，产生闭包 |
| **名称空间** | 存放名字与值绑定关系的地方（内置、全局、局部、外围） |
| **作用域** | LEGB 法则：Local → Enclosing → Global → Builtin |
| **global** | 在函数内修改全局变量 |
| **nonlocal** | 在内层函数中修改外层函数的变量 |
| **闭包** | 封存函数执行的上下文环境 |

掌握这些高级概念，可以帮助你编写更加优雅和高效的 Python 代码。
