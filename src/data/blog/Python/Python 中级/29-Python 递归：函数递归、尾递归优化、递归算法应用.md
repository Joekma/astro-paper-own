---
title: Python 递归：函数递归、尾递归优化、递归算法应用
author: Joekma
pubDatetime: 2024-08-13T00:00:00Z
slug: python-recursion-tail-recursion-algorithm
modDatetime: 2026-04-22T00:00:00Z
featured: false
draft: false
tags:
  - Python
  - 算法
  - 递归
description: '深入讲解Python递归，涵盖函数递归、尾递归优化、递归算法应用等核心概念。'
series: python
seriesOrder: 29
language: zh-CN
---

# Python 递归

## **递归**

是指函数/过程/子程序在运行过程序中直接或间接调用自身而产生的重入现象。在计算机编程里，递归指的是一个过程：函数不断引用自身，直到引用的对象已知。使用递归解决问题，思路清晰，代码少。但是在主流高级语言中（如C语言、Pascal语言等）使用递归算法要耗用更多的栈空间，所以在堆栈尺寸受限制时（如嵌入式系统或者内核态编程），应避免采用。所有的递归算法都可以改写成与之等价的非递归算法。

### 什么是函数递归

函数的递归调用是函数嵌套调用的一种特殊形式,特殊在调用一个函数的过程中又直接或者间接地调用了该函数本身。如果构成了循环递归调用是非常危险的，但是往往这种情况在代码复杂的情况下，还是可能发生这种调用。要用代码的规范来避免这种递归调用的发生，使用递归必须有一个终止条件，如计算阶层的n==1返回1

### 递归优点

- 实现简单，结构清晰
- 理论上递归都可以用循环来实现
- 递归要防止栈溢出，有调用层数限制

### 直接调用
```python
def func():
  print('from func')
  func()
func()

```
### 可以总结一下常见递归的套路
```python
def fun(i):
  if 成立条件:
    递归调用
  else:
    *****
  return *****

```
### 间接调用

间接递归调用就是在函数foo()（或过程）中调用另外一个函数bar()，而该函数bar()又引用（调用）了函数foo()
```python
def foo():
    print('from foo')
    bar()

def bar():
    print('from bar')
    foo()

foo()

```
递归本质就是一个循环的过程,但是递归必须满足两个原则:
1\. 每进入下一层递归,问题的规模必须有所减少
2\. 递归必须有一个明确的结束条件或者说有一个明确的进入下一层递归的条件

并且递归有两个明确的阶段
1\. 回溯: 一层一层地递归调用下去
2\. 递推: 再某一层结束掉递归,然后一层一层返回

递推：像上边递归实现所拆解，递归每一次都是基于上一次进行下一次的执行，这叫递推
回溯：则是在遇到终止条件，则从最后往回返一级一级的把值返回来，这叫回溯

### 递归的实现
```python

def age(n):
    if n == 1:
        return 18
    return age(n - 1) + 2

print(age(5))

# age(5)=age(4)+2 第一次进入
# age(4)=age(3)+2 第二次进入
# age(3)=age(2)+2 第三次进入
# age(2)=age(1)+2 第四次进入
# age(1)=18 第五次进入，最后判断终止条件

# age(n)=age(n-1)+2 # n>1 递归终止条件
# age(1)=18 # n=1 等于终止条件

l = [1, 2, [3, [4, 5, 6, [7, 8, [9, 10, [11, 12, 13, [14, 15, [16, [17, 18, 19]]]]]]]]]

def search(l):
    for item in l:
        if type(item) is list:
            search(item)
        else:
            print(item)

search(l)

```
Python函数递归调用，会用到栈

-这里的栈是函数/程序运行时系统为其分配的一段内存区
-栈具有后进先出的特性
-该段内存区域大小有限，大小跟系统有关
-该区用来存储局部变量等
-递归函数，调用时借助这个区域存放中间过程
-所以递归有层数限制

因为递归调用使用到栈，栈大小是由限制的，所以Python缺省情况下，递归调用限制为1000层（深度），有时候没有达到1000也会报异常。关于Python环境下阶层调用深度限制可以通过sys模块的方法修改。
```python

import sys
print(sys.getrecursionlimit())
1000
sys.setrecursionlimit(1200)
print(sys.getrecursionlimit())
1200

```
## **递归的分析**

递归的概念很简单，如果函数包含了对其自身的调用，该函数就是递归的。拗口一点的定义是，如果一个新的调用能在相同过程中较早的调用结束之前开始，那么个该过程就是递归。两

一个经典的例子，讲述递归的应用：

阶乘函数的定义
```python
N! = factorial(N) = 1 * 2 * 3 * ... * N
```
那么可以用这种方法来看阶乘函数：
```python
factorial(N) = N!
             = N * (N - 1)!
             = N * (N - 1) * (N - 2)!
             = N * (N - 1) * (N - 2) * ... * 3 * 2 * 1
             = N * factorial(N - 1)

```
于是我们有了阶乘函数的递归版本：
```python
def factorial(n):
    if n == 0 or n == 1: return 1
    else: return (n * factorial(n - 1))

print(factorial(6))
# 输出：720

```
来看看这个问题：

还是这个函数factorial(N)，让我们试试N = 999和N = 1000，问题来了，N = 999时能输出正确答案，但当N = 1000时，就出现下面的错误了：
```python
RuntimeError: maximum recursion depth exceeded
```
于是，请记住，默认的Python有一个可用的递归深度的限制，以避免耗尽计算机中的内存

递归算法一般用于解决三类问题

- （1）数据的定义是按递归定义的。（比如Fibonacci函数）
- （2）问题解法按递归算法实现。（回溯）
- （3）数据的结构形式是按递归定义的。（比如树的遍历，图的搜索）

递归的缺点：递归算法解题的运行效率较低。在递归调用的过程当中系统为每一层的返回点、局部量等开辟了栈来存储。递归次数过多容易造成栈溢出等。

## **递归的优化**

一般递归
```python

def normal_recursion(n):
    if n == 1:
        return 1
    else:
        return n + normal_recursion(n-1)

```
执行：
```python
normal_recursion(5)
5 + normal_recursion(4)
5 + 4 + normal_recursion(3)
5 + 4 + 3 + normal_recursion(2)
5 + 4 + 3 + 2 + normal_recursion(1)
5 + 4 + 3 + 3
5 + 4 + 6
5 + 10
15
```
可以看到, 一般递归, 每一级递归都需要调用函数, 会创建新的栈,
随着递归深度的增加, 创建的栈越来越多, 造成爆栈

尾递归
尾递归基于函数的尾调用, 每一级调用直接返回函数的返回值更新调用栈,而不用创建新的调用栈, 类似迭代的实现, 时间和空间上均优化了一般递归!
```python
def tail_recursion(n, total=0):
    if n == 0:
        return total
    else:
        return tail_recursion(n-1, total+n)

# 执行过程：
# tail_recursion(5)
# tail_recursion(4, 5)
# tail_recursion(3, 9)
# tail_recursion(2, 12)
# tail_recursion(1, 14)
# tail_recursion(0, 15)
# 15

```
可以看到, 每一级递归的函数调用变成”线性”的形式.
深入理解尾递归
呃, 所以呢? 是不是感觉还不够过瘾… 谁说尾递归调用就不用创建新的栈呢?
还是让我们去底层一探究竟吧
```c
int tail_recursion(int n, int total) {
if (n == 0) {
return total;
}
else {
return tail_recursion(n-1, total+n);
}
}

int main(void) {
int total = 0, n = 4;
tail_recursion(n, total);
return 0;
}
```
反汇编
```bash
$ gcc -S tail_recursion.c -o normal_recursion.S
$ gcc -S -O2 tail_recursion.c -o tail_recursion.S gcc开启尾递归优化
```
对比反汇编代码如下(AT&T语法)

可以看到, 开启尾递归优化前, 使用call调用函数, 创建了新的调用栈(LBB0_3);
而开启尾递归优化后, 就没有新的调用栈生成了, 而是直接pop
bp指向的_tail_recursion函数的地址(pushq %rbp)然后返回,

仍旧用的是同一个调用栈!

### 存在的问题

虽然尾递归优化很好, 但python 不支持尾递归，递归深度超过1000时会报错
```python
RuntimeError: maximum recursion depth exceeded
```
一个牛人想出的解决办法
实现一个 tail_call_optimized 装饰器

```python
import sys

class TailRecurseException(Exception):
    def __init__(self, args, kwargs):
        self.args = args
        self.kwargs = kwargs

def tail_call_optimized(func):
    """Use an exception to simulate tail-call optimization."""
    def wrapper(*args, **kwargs):
        frame = sys._getframe()
        if frame.f_back and frame.f_back.f_back and frame.f_back.f_back.f_code == frame.f_code:
            raise TailRecurseException(args, kwargs)
        while True:
            try:
                return func(*args, **kwargs)
            except TailRecurseException as exc:
                args = exc.args
                kwargs = exc.kwargs

    wrapper.__doc__ = func.__doc__
    return wrapper

@tail_call_optimized
def factorial(n, acc=1):
    "calculate a factorial"
    if n == 0:
        return acc
    return factorial(n - 1, n * acc)

print(factorial(10000))
```
> 说明：CPython 本身不会优化尾递归，这类装饰器属于教学演示，不建议在生产代码中依赖。
因为尾递归没有调用栈的嵌套, 所以Python也不会报RuntimeError: maximum recursion depth exceeded错误了!
这里解释一下 sys._getframe() 函数:
```text

sys._getframe([depth]):
Return a frame object from the call stack.
If optional integer depth is given, return the frame object that many calls below the top of the stack.
If that is deeper than the call stack, ValueEfror is raised. The default for depth is zero,
returning the frame at the top of the call stack.

```
即返回depth深度调用的栈帧对象.
```python
import sys

def get_cur_info():
    print(sys._getframe().f_code.co_filename)  # 当前文件名
    print(sys._getframe().f_code.co_name)      # 当前函数名
    print(sys._getframe().f_lineno)            # 当前行号
    print(sys._getframe().f_back)              # 调用者的帧
```
### 小结

递归会将前面的调用的函数暂时挂起, 等待递归的终止条件给出的明确的条件, 然后将所有的挂起的内容进行反向计算, 其实, 递归也可以看做是一种反向计算的过程, 前面调用递归的过程只是将表达式罗列出来, 等待终止条件出现后, 依次从后往前倒序进行计算前面挂起的内容, 最后将所有结果一起返回递归调用的次数过多会导致栈的溢出, 入上例中 fact(1000), 这时就需要优化尾递归优化
```python
def fact_iter(num, product):
    if num == 1:
        return product
    return fact_iter(num - 1, num * product)

def fact(n):
    return fact_iter(n, 1)
```
将每次的乘积存入到 product 中, return fact_iter(num -1, num * product) 返回的仅仅是函数本身, num - 1, 和 num * product 在函数调用前就会被计算出来

上例中的优化其实就是讲 原本的倒序的计算, 通过 num * product 变为了正序的计算, 还是递归的思想, 但是不会占用其他的栈帧, 因为所有的结果都已近存放在了 product 中递归主要还是有防止溢出, Python标准的解释器并没有对尾递归做出优化, 所有一定要防止 栈溢出 的情况

## **经典的递归**

递归函数与三级菜单

```python
menu = {
    '北京': {
        '海淀': {
            '五道口': {
                'soho': {},
                '网易': {},
                'google': {}
            },
            '中关村': {
                '爱奇艺': {},
                '汽车之家': {},
                'youku': {},
            },
            '上地': {
                '百度': {},
            },
        },
        '昌平': {
            '沙河': {
                '老男孩': {},
                '北航': {},
            },
            '天通苑': {},
            '回龙观': {},
        },
        '朝阳': {},
        '东城': {},
    },
    '上海': {
        '闵行': {
            "人民广场": {
                '炸鸡店': {}
            }
        },
        '闸北': {
            '火车战': {
                '携程': {}
            }
        },
        '浦东': {},
    },
    '山东': {},
}
```
menu
```python
def threeLM(dic):
    while True:
        for k in dic:print(k)
        key = input('input>>').strip()
        if key == 'b' or key == 'q':return key
        elif key in dic.keys() and dic[key]:
            ret = threeLM(dic[key])
            if ret == 'q': return 'q'

threeLM(menu)
```
递归函数实现三级菜单

```python
l = [menu]
while l:
    for key in l[-1]:print(key)
    k = input('input>>').strip()   # 北京
    if k in l[-1].keys() and l[-1][k]:l.append(l[-1][k])
    elif k == 'b':l.pop()
    elif k == 'q':break
```
堆栈实现

素因数的求法：

```python
# -*- coding:utf-8 -*-

import math

def suyinshu(n):
    for i in range(2,int(math.sqrt(n+1))+1): # range里必须是整数
        if n%i == 0:
           print(i)
           suyinshu(n/i)
           return
        if(n > 1): # 如果是素数
            print(n)

suyinshu(100)
```
分析下，求素因数的思路：用n对i(2到根号n)取模，为零的便证明是n的因数，将其输出，之后再用n/i作为参数，递归调用函数，再次求n（n/i）的因数，如果没有因数（证明本身是素数），便将n输出。注意return的位置，在调用结束后，函数开始返回，此时因为不需要返回值，便返回空。

同时我们要理解一点，用递归解决的问题，都可以转化为循环执行，因为递归实质是调用栈，而栈和递归又可以相互转化。因此我们可以将素因数的求法用循环表示
```python
import math

def suyinshu2(n):
  for i in range(2,int(math.sqrt(n))):
    while n%i == 0:
        print(i)
        n = n/i
    if(n > 1):
        print(n)

suyinshu2(100)
```


阶乘：

```python
def fact(n):
    if n == 1:
        return 1
    return n * fact(n - 1)

print(fact(5))  # 120
```

可能有点懵吧，来看一看计算过程吧：

```python
fact(5)
5 * fact(4)
5 * (4 * fact(3))
5 * (4 * (3 * fact(2)))
5 * (4 * (3 * (2 * fact(1))))
5 * (4 * (3 * (2 * 1)))
5 * (4 * (3 * 2))
5 * (4 * 6)
5 * 24
120
```
计算过程

强化阶乘的理解：

```python
def factorial(n):
  space = ' '*(4*n)
  print(space,'factorial',n)
  if n == 0:
    return 1
# 进行递归调用来找到 n−1 的阶乘然后乘以 n:
  else:
    recurse = factorial(n-1)
    result = n * recurse
    print(space, 'returning', result)
  return result

print(factorial(4))

# 输出结果：
#                  factorial 4
#              factorial 3
#          factorial 2
#      factorial 1
#  factorial 0
#      returning 1
#          returning 2
#              returning 6
#                  returning 24
# 24
```


阶乘优化版本，处理小数的情况

```python
# 若n为小数，则死循环,处理方法如下； 那么泛化factorial，使其能处理小数
def factorial(n):
  if not isinstance(n,int):
    print('Factorial is only defined for integers')
    return None
  elif n<0:
    print('Factorial is not defined for negative integers.')
    return None
  elif n == 0:
    return 1
  else:
    return n*factorial(n-1)

print(factorial(3))
```

菲波那切数列

斐波那契数列（Fibonacci sequence），又称黄金分割数列、因数学家列昂纳多·斐波那契（Leonardoda Fibonacci）以兔子繁殖为例子而引入，故又称为“兔子数列”，指的是这样一个数列：1、1、2、3、5、8、13、21、34、……在数学上，斐波纳契数列以如下被以递推的方法定义：F(1)=1，F(2)=1, F(n)=F(n-1)+F(n-2)（n>=3，n∈N*）

原理

```python
# 根据需求可选择优化
def fibonacci(n):
    if n == 0:
        return 0
    elif n == 1:
        return 1
    else:
        return fibonacci(n-1) + fibonacci(n-2)

print(fibonacci(10))
# 输出结果：55
```
一个数是否是另一个数的幂

```python
# 当数字 a 能被 b 整除，并且 a/b 是 b 的幂时， 它就是 b 的幂。
# 编写一个叫 is_power 的函数，接受两个参数 a 和 b， 并且当 a 是 b 的幂时返回 True。
# 1是任何数的乘方，a**n表示a的n次方，a为底数，底数不能为0
def is_power(a,b):
    if a == 1:
        return True
    elif a == 0:
        return False
    elif a % b == 0:
        return is_power(a/b,b)
    return False

ans = is_power(4, 2)
print(ans)
```


最大公约数

```python
# a和 b 的最大公约数（GCD）是能被二者整除的最大数。
# 求两个数的最大公约数的一种方法，是基于这样一个原理：如果 r 是 a 被 b 除后的余数，那么 gcd(a,b)=gcd(b,r) 。
# 我们可以把 gcd(a,0)=a 当做基础情形。
def gcd(a,b):
    # r = a % b
    if b == 0:
        return a
    else:
        return gcd(b,a%b)

r = 6%4 # 取余

print(gcd(6,4))
print(gcd(4,r))
```

汉诺塔

```python
def hanoti(n,x1,x2,x3):
    if n == 1:
        print('move:', x1, '-->', x3)
        return
    hanoti(n - 1, x1, x3, x2)
    print('move:', x1, '-->', x3)
    hanoti(n - 1, x2, x1, x3)
```

更加详细的汉诺塔分析见：<https://blog.csdn.net/hikobe8/article/details/50479669>

---
