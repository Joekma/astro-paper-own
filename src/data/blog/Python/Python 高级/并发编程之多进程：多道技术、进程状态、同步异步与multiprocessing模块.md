---
title: 并发编程之多进程：多道技术、进程状态、同步异步与multiprocessing模块
author: Joekma
pubDatetime: 2024-08-13T00:00:00Z
modDatetime: 2026-04-22T00:00:00Z
featured: false
draft: false
tags:
  - Python
  - 并发编程
  - 多进程
description: '深入讲解并发编程之多进程，涵盖多道技术、进程状态、同步异步、multiprocessing模块等核心概念。'
---

# 并发编程之多进程

## 多道技术

多道技术中的多道指的是多个程序，多道技术的实现是为了解决多个程序竞争或者说共享同一个资源（比如cpu）的有序调度问题，解决方式即多路复用，多路复用分为时间上的复用和空间上的复用。

**空间上的复用**：将内存分为几部分，每个部分放入一个程序，这样，同一时间内存中就有了多道程序。

**时间上的复用**：当一个程序在等待I/O时，另一个程序可以使用cpu，如果内存中可以同时存放足够多的作业，则cpu的利用率可以接近100%，类似于我们小学数学所学的**统筹方法**。（操作系统采用了多道技术后，可以控制进程的切换，或者说进程之间去争抢cpu的执行权限。这种切换不仅会在一个进程遇到io时进行，一个进程占用cpu时间过长也会切换，或者说被操作系统夺走cpu的执行权限）

现代计算机或者网络都是多用户的，多个用户不仅共享硬件，而且共享文件，数据库等信息，共享意味着冲突和无序。

操作系统主要使用来干什么？

1. 记录哪个程序使用什么资源
2. 对资源请求进行分类
3. 为不同的程序和用户调解互相冲突的资源请求

我们可将上述操作系统的功能总结为：处理来自多个程序发起的多个（多个即多路）共享（共享即复用）资源的请求，简称多路复用多路复用有两种实现方式：

### 时间上的复用

当一个资源在时间上复用时，不同的程序或用户轮流使用它，第一个程序获取到该资源使用结束后，再轮到第二个......第三个......

例如：只有一个cpu，多个程序需要在该cpu上运行，操作系统先把cpu分给第一个程序，在这个程序运行的足够长的时间（时间长短由操作系统的算法说了算）或者遇到了I/O阻塞，操作系统则把cpu分配给下一个程序，以此类推，直到第一个程序重新被分配到了cpu然后再次运行，由于cpu的切换速度很快，给用户的感觉就是这些程序是同时运行的，或者说是并发的，或者说是伪并行的。至于资源如何实现时间复用，或者说谁应该是下一个要运行的程序，以及一个任务需要运行多长时间，这些都是操作系统的工作。

### 空间上的复用

每个客户都获取了一个大的资源中的一小部分资源，从而减少了排队等待资源的时间。

例如：多个运行的程序同时进入内存，硬件层面提供保护机制来确保各自的内存是分割开的，且由操作系统控制，这比一个程序独占内存一个一个排队进入内存效率要高的多。

有关空间复用的其他资源还有磁盘，在许多系统中，一个磁盘同时为许多用户保存文件。分配磁盘空间并且记录谁正在使用哪个磁盘块是操作系统资源管理的典型任务。这两种方式合起来便是多道技术详解。

### 空间上的复用最大的问题是

程序之间的内存必须分割，这种分割需要在硬件层面实现，由操作系统控制。如果内存彼此不分割，则一个程序可以访问另外一个程序的内存。

首先丧失的是安全性，比如你的qq程序可以访问操作系统的内存，这意味着你的qq可以获取到操作系统的所有权限。

其次丧失的是稳定性，某个程序崩溃时有可能把别的程序的内存也给回收了，比方说把操作系统的内存给回收了，则操作系统崩溃。

## 什么是进程

进程：正在进行的一个过程或者说一个任务。而负责执行任务则是cpu。

## 并发与并行

无论是并行还是并发，在用户看来都是'同时'运行的，不管是进程还是线程，都只是一个任务而已，真实干活的是cpu，cpu来做这些任务，而一个cpu同一时刻只能执行一个任务。

**并发**：是伪并行，即看起来是同时运行。单个cpu+多道技术就可以实现并发，（并行也属于并发）。

**并行**：同时运行，只有具备多个cpu才能实现并行。

单核下，可以利用多道技术，多个核，每个核也都可以利用多道技术（**多道技术是针对单核而言的**）。

有四个核，六个任务，这样同一时间有四个任务被执行，假设分别被分配给了cpu1，cpu2，cpu3，cpu4。

一旦任务1遇到I/O就被迫中断执行，此时任务5就拿到cpu1的时间片去执行，这就是单核下的多道技术。

而一旦任务1的I/O结束了，操作系统会重新调用它（**需知进程的调度、分配给哪个cpu运行，由操作系统说了算**），可能被分配给四个cpu中的任意一个去执行。

## 同步/异步和阻塞/非阻塞

### 状态介绍

在了解其他概念之前，我们首先要了解进程的几个状态。在程序运行的过程中，由于被操作系统的调度算法控制，程序会进入几个状态：就绪，运行和阻塞。

1. **就绪（Ready）状态**：当进程已分配到除CPU以外的所有必要的资源，只要获得处理机便可立即执行，这时的进程状态称为就绪状态。

2. **运行（Running）状态**：当进程已获得处理机，其程序正在处理机上执行，此时的进程状态称为执行状态。

3. **阻塞（Blocked）状态**：正在执行的进程，由于等待某个事件发生而无法执行时，便放弃处理机而处于阻塞状态。引起进程阻塞的事件可有多种，例如，等待I/O完成、申请缓冲区不能满足、等待信号（信号）等。

### 同步

所谓同步，就是在发出一个功能调用时，在没有得到结果之前，该调用就不会返回。按照这个定义，其实绝大多数函数都是同步调用。但是一般而言，我们在说同步、异步的时候，特指那些需要其他部件协作或者需要一定时间完成的任务。

**举例**：

1. multiprocessing.Pool下的apply（发起同步调用后，就在原地等着任务结束，根本不考虑任务是在计算还是在io阻塞，总之就是一股脑地等任务结束）
2. concurrent.futures.ProcessPoolExecutor().submit(func,).result()
3. concurrent.futures.ThreadPoolExecutor().submit(func,).result()

### 异步

异步的概念和同步相对。当一个异步功能调用发出后，调用者不能立刻得到结果。当该异步功能完成后，通过状态、通知或回调来通知调用者。如果异步功能用状态来通知，那么调用者就需要每隔一定时间检查一次，效率就很低（有些初学多线程编程的人，总喜欢用一个循环去检查某个变量的值，这其实是一种很严重的错误）。如果是使用通知的方式，效率则很高，因为异步功能几乎不需要做额外的操作。至于回调函数，其实和通知没太多区别。

**举例**：

1. multiprocessing.Pool().apply_async()（发起异步调用后，并不会等待任务结束才返回，相反，会立即获取一个临时结果（并不是最终的结果，可能是封装好的一个对象）。）
2. concurrent.futures.ProcessPoolExecutor(3).submit(func,)
3. concurrent.futures.ThreadPoolExecutor(3).submit(func,)

### 阻塞

阻塞调用是指调用结果返回之前，当前线程会被挂起（如遇到io操作）。函数只有在得到结果之后才会将阻塞的线程激活。有人也许会把阻塞调用和同步调用等同起来，实际上他是不同的。对于同步调用来说，很多时候当前线程还是激活的，只是从逻辑上当前函数没有返回而已。

**举例**：

1. 同步调用：apply一个累计一亿次的任务，该调用会一直等待，直到任务返回结果为止，但并未阻塞住（即便是被抢走cpu的执行权限，那也是处于就绪态）
2. 阻塞调用：当socket工作在阻塞模式的时候，如果没有数据的情况下调用recv函数，则当前线程就会被挂起，直到有数据为止。

### 非阻塞

非阻塞和阻塞的概念相对应，指在不能立刻得到结果之前也会立刻返回，同时该函数不会阻塞当前线程。

### 小结

1. 同步与异步针对的是函数/任务的调用方式：同步就是当一个进程发起一个函数（任务）调用的时候，一直等到函数（任务）完成，而进程继续处于激活状态。而异步情况下是当一个进程发起一个函数（任务）调用的时候，不会等函数返回，而是继续往下执行当，函数返回的时候通过状态、通知、事件等方式通知进程任务完成。

2. 阻塞与非阻塞针对的是进程或线程：阻塞是当请求不能满足的时候就将进程挂起，而非阻塞则不会阻塞当前进程。

### 补充

1. **同步阻塞形式**：效率最低。拿上面的例子来说，就是你专心排队，什么别的事都不做。

2. **异步阻塞形式**：如果在银行等待办理业务的人采用的是异步的方式去等待消息被触发（通知），也就是领了一张小纸条，假如在这段时间里他不能离开银行做其它的事情，那么很显然，这个人被阻塞在了这个等待的操作上面。**异步操作是可以被阻塞住的，只不过它不是在处理消息时阻塞，而是在等待消息通知时被阻塞。**

3. **同步非阻塞形式**：实际上是效率低下的。想象一下你一边打着电话一边还需要抬头看到底队伍排到你了没有，如果把打电话和观察排队的位置看成是程序的两个操作的话，这个程序需要在这两种不同的行为之间来回的切换，效率可想而知是低下的。

4. **异步非阻塞形式**：效率更高。因为打电话是等待的事情，而通知你则是柜台消息触发机制的事情，程序没有在两种不同的操作中来回切换。例如，这个人突然发觉自己烟瘾犯了，需要出去抽根烟，于是他告诉大堂经理说，排到我这个号码的时候麻烦到外面通知我一下，那么他就没有被阻塞在这个等待的操作上面，自然这个就是异步+非阻塞的方式了。

很多人会把同步和阻塞混淆，是因为**很多时候同步操作会以阻塞的形式表现出来**，同样的，很多人也会把异步和非阻塞混淆，因为**异步操作一般都不会在真正的IO操作处被阻塞**。

## 进程的创建

但凡是硬件，都需要有操作系统去管理，只要有操作系统，就有进程的概念，就需要有创建进程的方式，一些操作系统只为一个应用程序设计，比如微波炉中的控制器，一旦启动微波炉，所有的进程都已经存在。

而对于通用系统（跑很多应用程序），需要有系统运行过程中创建或撤销进程的能力，主要分为4种形式创建新的进程：

1. **系统初始化**（查看进程linux中用ps命令，windows中用任务管理器，前台进程负责与用户交互，后台运行的进程与用户无关，运行在后台并且只在需要时才唤醒的进程，称为守护进程，如电子邮件、web页面、新闻、打印）

2. **一个进程在运行过程中开启了子进程**（如nginx开启多进程，os.fork, subprocess.Popen等）

3. **用户的交互式请求，而创建一个新进程**（如用户双击暴风影音）

4. **一个批处理作业的初始化**（只在大型机的批处理系统中应用）

无论哪一种，新进程的创建都是由一个已经存在的进程执行了一个用于创建进程的系统调用而创建的。

1. 在UNIX中该系统调用是：fork，fork会创建一个与父进程一模一样的副本，二者有相同的存储映像、同样的环境字符串和同样的打开文件（在shell解释器进程中，执行一个命令就会创建一个子进程）。

2. 在windows中该系统调用是：CreateProcess，CreateProcess既处理进程的创建，也负责把正确的程序装入新进程。

关于创建的子进程，UNIX和windows：

1. 相同的是：进程创建后，父进程和子进程有各自不同的地址空间。（**多道技术要求物理层面实现进程之间内存的隔离**），任何一个进程的在其地址空间中的修改都不会影响到另外一个进程。

2. 不同的是：在UNIX中，子进程的初始地址空间是父进程的一个副本，提示：子进程和父进程是可以有只读的共享内存区的。但是对于windows系统来说，从一开始父进程与子进程的地址空间就是不同的。

## 进程的终止

1. **正常退出**（自愿，如用户点击交互式页面的叉号，或程序执行完毕调用发起系统调用正常退出，在linux中用exit，在windows中用ExitProcess）

2. **出错退出**（自愿，python a.py中a.py不存在）

3. **严重错误**（非自愿，执行非法指令，如引用不存在的内存，1/0等，可以捕捉异常，try...except...）

4. **被其他进程杀死**（非自愿，如kill -9）

## 进程的层次结构

无论UNIX还是windows，进程只有一个父进程，不同的是：

1. 在UNIX中所有的进程，都是以init进程为根，组成树形结构。父子进程共同组成一个进程组，这样，当从键盘发出一个信号时，该信号被送给当前与键盘相关的进程组中的所有成员。

2. 在windows中，没有进程层次的概念，所有的进程都是地位相同的，唯一类似于进程层次的暗示，是在创建进程时，父进程得到一个特别的令牌（**称为句柄**），该句柄可以用来控制子进程，但是父进程有权把该句柄传给其他子进程，这样就没有层次了。

## 进程的状态

```
tail -f access.log | grep '404'
```

执行程序tail，开启一个子进程，执行程序grep，开启另外一个子进程，两个进程之间基于管道'|'通讯，将tail的结果作为grep的输入。

进程grep在等待输入（即I/O）时的状态称为阻塞，此时grep命令都无法运行。

其实在两种情况下会导致一个进程在逻辑上不能运行：

1. 进程挂起是自身原因，遇到I/O阻塞，便要让出CPU让其他进程去执行，这样保证CPU一直在工作。

2. 与进程无关，是操作系统层面，可能会因为一个进程占用时间过多，或者优先级等原因，而调用其他的进程去使用CPU。

因而一个进程有三种状态：

![进程状态图](https://images2017.cnblogs.com/blog/1036857/201712/1036857-20171229144413132-1909478252.png)

### 进程并发的实现

进程并发的实现在于，硬件中断一个正在运行的进程，把此时进程运行的所有状态保存下来，为此，操作系统维护一张表格，即进程表（process table），每个进程占用一个进程表项（这些表项也称为进程控制块）。

![进程表](https://images2017.cnblogs.com/blog/1036857/201712/1036857-20171229144430038-509212133.png)

该表存放了进程状态的重要信息：程序计数器、堆栈指针、内存分配状况、所有打开文件的状态、帐号和调度信息，以及其他在进程由运行态转为就绪态或阻塞态时，必须保存的信息，从而保证该进程在再次启动时，就像从未被中断过一样。

## multiprocessing模块介绍

python中的多线程无法利用多核优势，如果想要充分地使用多核CPU的资源（os.cpu_count()查看），在python中大部分情况需要使用多进程。Python提供了multiprocessing。

multiprocessing模块用来开启子进程，并在子进程中执行我们定制的任务（比如函数），该模块与多线程模块threading的编程接口类似。

multiprocessing模块的功能众多：支持子进程、通信和共享数据、执行不同形式的同步，提供了Process、Queue、Pipe、Lock等组件。

需要再次强调的一点是：与线程不同，进程没有任何共享状态，进程修改的数据，改动仅限于该进程内。

## Process类的介绍

### 创建进程的类

```python
Process([group [, target [, name [, args [, kwargs]]]]])，由该类实例化得到的对象，可用来开启一个子进程

强调：
1. 需要使用关键字的方式来指定参数
2. args指定的为传给target函数的位置参数，是一个元组形式，必须有逗号
```

### 参数介绍

```python
group参数未使用，值始终为None

target表示调用对象，即子进程要执行的任务

args表示调用对象的位置参数元组，args=(1,2,'egon',)

kwargs表示调用对象的字典，kwargs={'name':'egon','age':18}

name为子进程的名称
```

### 方法介绍

```python
p.start()：启动进程，并调用该子进程中的p.run()

p.run():进程启动时运行的方法，正是它去调用target指定的函数，我们自定义类的类中一定要实现该方法

p.terminate():强制终止进程p，不会进行任何清理操作，如果p创建了子进程，该子进程就成了僵尸进程，使用该方法需要特别小心这种情况。如果p还保存了一个锁那么也将不会被释放，进而导致死锁

p.is_alive():如果p仍然运行，返回True

p.join([timeout]):主线程等待p终止（强调：是主线程处于等的状态，而p是处于运行的状态）。timeout是可选的超时时间
```

### 属性介绍

```python
p.daemon：默认值为False，如果设为True，代表p为后台运行的守护进程，当p的父进程终止时，p也随之终止，并且设定为True后，p不能创建自己的新进程，必须在p.start()之前设置

p.name:进程的名称

p.pid：进程的pid
```

## Process类的使用

### windows下Process（）使用的解决方法及原理分析

```python
import multiprocessing, time

def test(i):
    while 1:
        print(i)
        time.sleep(.2)

# if __name__ == '__main__': --- 去掉则会报错
multiprocessing.Process(target=test, args=(1,)).start()
multiprocessing.Process(target=test, args=(2,)).start()
```

**RuntimeError**: An attempt has been made to start a new process before the current process has finished its bootstrapping phase. This probably means that you are not using fork to start your child processes and you have forgotten to use the proper idiom in the main module: if __name__ == '__main__': freeze_support() ...

如果不加 `if __name__ == '__main__'`，则会报错。

子进程会在运行时拷贝当前主进程中的所有内容，这也就意味着当一个新的子进程被创建的时候，该子进程就会复制当前模块，当然也包括了以下两行：

```python
multiprocessing.Process(target=test, args=(1,)).start()
multiprocessing.Process(target=test, args=(2,)).start()
```

很显然，这样的写法可能形成无限递归式地创建新的子进程。所以为了避免以上情况发生，我们在此引入 `if __name__ == '__main__'`。

### 创建并开启子进程的方式一

```python
import time
import random
from multiprocessing import Process

def piao(name):
    print('%s piaoing' % name)
    time.sleep(random.randrange(1, 5))
    print('%s piao end' % name)

if __name__ == '__main__':
    # 实例化得到四个对象
    p1 = Process(target=piao, args=('egon',))  # 必须加逗号
    p2 = Process(target=piao, args=('alex',))
    p3 = Process(target=piao, args=('wupeiqi',))
    p4 = Process(target=piao, args=('yuanhao',))

    # 调用对象下的方法，开启四个进程
    p1.start()
    p2.start()
    p3.start()
    p4.start()
    p1.join()
    p2.join()
    p3.join()
    p4.join()
    print('主进程')
```

### 创建并开启子进程的方式二

```python
from multiprocessing import Process
import time

class MyProcess(Process):
    def __init__(self, person):
        self.person = person
        super().__init__()

    def run(self):
        print('%s is running' % self.person)
        time.sleep(1)
        print('%s is done' % self.person)

if __name__ == '__main__':
    p1 = MyProcess('egon')
    p2 = MyProcess('alex')
    p3 = MyProcess('wupeiqi')
    p4 = MyProcess('yuanhao')

    p1.start()  # start会自动调用run
    p2.start()
    p3.start()
    p4.start()

    p1.join()
    p2.join()
    p3.join()
    p4.join()
    print('主进程')
```

### 进程间通信

#### 队列Queue

```python
from multiprocessing import Process, Queue

def producer(q):
    q.put('hello')

def consumer(q):
    print(q.get())

if __name__ == '__main__':
    q = Queue()
    p1 = Process(target=producer, args=(q,))
    p2 = Process(target=consumer, args=(q,))
    p1.start()
    p2.start()
    p1.join()
    p2.join()
```

#### 生产者消费者模型

```python
from multiprocessing import Process, Queue
import time
import random

def producer(q, name):
    for i in range(5):
        time.sleep(random.random())
        print('%s生产了%s' % (name, i))
        q.put(i)

def consumer(q, name):
    while True:
        time.sleep(random.random())
        try:
            data = q.get(timeout=1)
            print('%s消费了%s' % (name, data))
        except:
            break

if __name__ == '__main__':
    q = Queue()
    p_producer = Process(target=producer, args=(q, '生产者1'))
    p_consumer = Process(target=consumer, args=(q, '消费者1'))
    p_producer.start()
    p_consumer.start()
    p_producer.join()
    p_consumer.join()
```

#### 管道Pipe

```python
from multiprocessing import Process, Pipe

def f(conn):
    conn.send('hello parent')
    print('child received:', conn.recv())

if __name__ == '__main__':
    parent_conn, child_conn = Pipe()
    p = Process(target=f, args=(child_conn,))
    p.start()
    print('parent received:', parent_conn.recv())
    parent_conn.send('hello child')
    p.join()
```

#### 共享数据

```python
from multiprocessing import Process, Value, Array

def func(num, arr):
    num.value = 3.14159
    for i in range(len(arr)):
        arr[i] = i

if __name__ == '__main__':
    num = Value('d', 0.0)  # 'd'表示double类型
    arr = Array('i', range(10))  # 'i'表示int类型

    p = Process(target=func, args=(num, arr))
    p.start()
    p.join()

    print(num.value)
    print(arr[:])
```

#### 进程同步（锁）

```python
from multiprocessing import Process, Lock
import time
import json

def search():
    with open('ticket.txt', 'r', encoding='utf-8') as f:
        data = json.load(f)
        print('剩余票数:', data['count'])

def buy():
    with open('ticket.txt', 'r', encoding='utf-8') as f:
        data = json.load(f)
    if data['count'] > 0:
        time.sleep(0.1)
        with open('ticket.txt', 'w', encoding='utf-8') as f:
            data['count'] -= 1
            json.dump(data, f)
        print('购票成功')
    else:
        print('购票失败')

def task(lock):
    search()
    lock.acquire()
    buy()
    lock.release()

if __name__ == '__main__':
    # 初始化票数
    with open('ticket.txt', 'w', encoding='utf-8') as f:
        json.dump({'count': 1}, f)

    lock = Lock()
    for i in range(10):
        p = Process(target=task, args=(lock,))
        p.start()
```

## 进程池

### 基本使用

```python
from multiprocessing import Pool
import time

def func(n):
    print('start', n)
    time.sleep(1)
    print('end', n)

if __name__ == '__main__':
    pool = Pool(4)  # 最多同时运行4个进程
    for i in range(10):
        pool.apply_async(func, args=(i,))

    pool.close()  # 关闭池，不再接收新任务
    pool.join()  # 等待所有进程完成
    print('所有进程执行完毕')
```

### 使用map

```python
from multiprocessing import Pool

def f(x):
    return x * x

if __name__ == '__main__':
    with Pool(5) as p:
        result = p.map(f, [1, 2, 3, 4, 5])
        print(result)  # [1, 4, 9, 16, 25]
```

### 回调函数

```python
from multiprocessing import Pool

def func(n):
    return n * n

def callback(result):
    print('结果:', result)

if __name__ == '__main__':
    pool = Pool(3)
    for i in range(5):
        pool.apply_async(func, args=(i,), callback=callback)
    pool.close()
    pool.join()
```
