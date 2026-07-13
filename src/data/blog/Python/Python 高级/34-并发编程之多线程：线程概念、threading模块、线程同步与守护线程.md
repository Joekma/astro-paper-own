---
title: 并发编程之多线程：线程概念、threading模块、线程同步与守护线程
series: python
seriesOrder: 34
language: zh-CN
author: Joekma
pubDatetime: 2024-08-13T00:00:00Z
slug: python-multi-threading-threading-module
modDatetime: 2026-07-11T00:00:00.000+08:00
featured: false
draft: false
tags:
  - Python
  - 并发编程
  - 多线程
description: '深入讲解并发编程之多线程，涵盖线程概念、threading模块、线程同步与守护线程等核心知识。'
---

# 并发编程之多线程

## 什么是线程

在传统操作系统中，每个进程有一个地址空间，而且默认就有一个控制线程。线程顾名思义，就是一条流水线工作的过程，一条流水线必须属于一个车间，一个车间的工作过程是一个进程。车间负责把资源整合到一起，是一个资源单位，而一个车间内至少有一个流水线。

流水线的工作需要电源，电源就相当于cpu。所以，**进程只是用来把资源集中到一起（进程只是一个资源单位，或者说资源集合），而线程才是cpu上的执行单位。**

多线程（即多个控制线程）的概念是，在一个进程中存在多个控制线程，多个控制线程共享该进程的地址空间，相当于一个车间内有多条流水线，都共用一个车间的资源。

例如，北京地铁与上海地铁是不同的进程，而北京地铁里的3号线是一个线程，北京地铁所有的线路共享北京地铁所有的资源，比如所有的乘客可以被所有线路拉载。

## 线程的创建开销

创建进程的开销要远大于线程。

如果我们的软件是一个工厂，该工厂有多条流水线，流水线工作需要电源，电源只有一个即cpu（单核cpu）。

一个车间就是一个进程，一个车间至少一条流水线（一个进程至少一个线程）。

创建一个进程，就是创建一个车间（申请空间，在该空间内建至少一条流水线）。

而建线程，就只是在一个车间内造一条流水线，无需申请空间，所以创建开销小。

进程之间是竞争关系，线程之间是协作关系？

车间之间是竞争抢电源的关系，竞争（不同的进程之间是竞争关系，是不同的程序员写的程序运行的，迅雷抢占其他进程的网速，360把其他进程当做病毒干死）。

一个车间的不同流水线式协同工作的关系（同一个进程的线程之间是合作关系，是同一个程序写的程序内开启启动，迅雷内的线程是合作关系，不会自己干自己）。

## 线程与进程的区别

- 线程共享创建它的进程的地址空间；进程拥有它们自己的地址空间
- 线程可以直接访问其进程的数据段；进程有它们自己的父进程的数据段的副本
- 线程可以直接与其进程的其他线程通信；进程必须使用进程间通信来与兄弟进程通信
- 新线程容易创建；新进程需要复制父进程
- 线程可以对同一进程的线程执行相当大的控制；进程只能对子进程执行控制
- 主线程的更改（取消、优先级更改等）可能影响进程的其他线程的行为；父进程的更改不影响子进程

## 为何要用多线程

多线程指的是，在一个进程中开启多个线程，简单的讲：如果多个任务共用一块地址空间，那么必须在一个进程内开启多个线程。详细的讲分4点：

1. 多线程共享一个进程的地址空间
2. 线程比进程更轻量级，线程比进程更容易创建可撤销，在许多操作系统中，创建一个线程比创建一个进程要快10-100倍，在有大量线程需要动态和快速修改时，这一特性很有用
3. 若多个线程都是cpu密集型的，那么并不能获得性能上的增强，但是如果存在大量的计算和大量的I/O处理，拥有多个线程允许这些活动彼此重叠运行，从而会加快程序执行的速度
4. 在多cpu系统中，为了最大限度的利用多核，可以开启多个线程，比开进程开销要小的多（这一条并不适用于python）

### 多线程的应用举例

开启一个字处理软件进程，该进程肯定需要办不止一件事情，比如监听键盘输入，处理文字，定时自动将文字保存到硬盘，这三个任务操作的都是同一块数据，因而不能用多进程。只能在一个进程里并发地开启三个线程。如果是单线程，那就只能是，键盘输入时，不能处理文字和自动保存，自动保存时又不能输入和处理文字。

## threading模块介绍

multiprocessing模块的完全模仿了threading模块的接口，二者在使用层面，有很大的相似性，因而不再详细介绍，官方文档：https://docs.python.org/3/library/threading.html

### 开启线程的两种方式

**方式一**

<!-- snippet: id=python-multi-threading-threading-module-01 mode=compile python=3.12-3.14 deps=stdlib -->
```python
from threading import Thread
import time

def sayhi(name):
    time.sleep(2)
    print('%s say hello' % name)

if __name__ == '__main__':
    t = Thread(target=sayhi, args=('egon',))
    t.start()
    print('主线程')
```

**方式二**

<!-- snippet: id=python-multi-threading-threading-module-02 mode=compile python=3.12-3.14 deps=stdlib -->
```python
from threading import Thread
import time

class Sayhi(Thread):
    def __init__(self, name):
        super().__init__()
        self.name = name

    def run(self):
        time.sleep(2)
        print('%s say hello' % self.name)

if __name__ == '__main__':
    t = Sayhi('egon')
    t.start()
    print('主线程')
```

## 在一个进程下开启多个线程与在一个进程下开启多个子进程的区别

<!-- snippet: id=python-multi-threading-threading-module-03 mode=compile python=3.12-3.14 deps=stdlib -->
```python
from threading import Thread
from multiprocessing import Process
import os

def work():
    print('hello')

if __name__ == '__main__':
    # 在主进程下开启线程
    t = Thread(target=work)
    t.start()
    print('主进程 主线程', os.getpid())

    # 在主进程下开启子进程
    t = Process(target=work)
    t.start()
    print('主进程 主线程', os.getpid())
```

**开启速度测试**

<!-- snippet: id=python-multi-threading-threading-module-04 mode=compile python=3.12-3.14 deps=stdlib -->
```python
from threading import Thread
from multiprocessing import Process
import os

def work():
    print('hello', os.getpid())

if __name__ == '__main__':
    # part1: 在主进程下开启多个线程，每个线程都跟主进程的pid一样
    t1 = Thread(target=work)
    t2 = Thread(target=work)
    t1.start()
    t2.start()
    print('主进程 pid', os.getpid())

    # part2: 开多个进程，每个进程都有不同的pid
    p1 = Process(target=work)
    p2 = Process(target=work)
    p1.start()
    p2.start()
    print('主进程 pid', os.getpid())
```

**pid检测**

<!-- snippet: id=python-multi-threading-threading-module-05 mode=compile python=3.12-3.14 deps=stdlib -->
```python
from threading import Thread
from multiprocessing import Process
import os

def work():
    global n
    n = 0

if __name__ == '__main__':
    # n = 100
    # p = Process(target=work)
    # p.start()
    # p.join()
    # print('n =', n)  # 毫无疑问子进程p已经将自己的全局的n改成0了，但改的仅仅是它自己的，查看父进程的n仍然是100

    n = 1
    t = Thread(target=work)
    t.start()
    t.join()
    print('n =', n)  # 查看结果n = 0，因为同一进程内的线程之间共享进程内的数据
```

同一进程内的线程共享该进程的数据。

### 练习一：多线程并发的socket服务端

<!-- snippet: id=python-multi-threading-threading-module-06 mode=compile python=3.12-3.14 deps=stdlib -->
```python
import threading
import socket

s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.bind(('127.0.0.1', 8080))
s.listen(5)

def action(conn):
    while True:
        data = conn.recv(1024)
        print(data)
        conn.send(data.upper())

if __name__ == '__main__':
    while True:
        conn, addr = s.accept()
        p = threading.Thread(target=action, args=(conn,))
        p.start()
```

<!-- snippet: id=python-multi-threading-threading-module-07 mode=compile python=3.12-3.14 deps=stdlib -->
```python
import socket

s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.connect(('127.0.0.1', 8080))

while True:
    msg = input('>>: ').strip()
    if not msg:
        continue
    s.send(msg.encode('utf-8'))
    data = s.recv(1024)
    print(data)
```

### 练习二：三个任务，一个接收用户输入，一个将用户输入的内容格式化成大写，一个将格式化后的结果存入文件

<!-- snippet: id=python-multi-threading-threading-module-08 mode=compile python=3.12-3.14 deps=stdlib -->
```python
from threading import Thread

msg_l = []
format_l = []

def talk():
    while True:
        msg = input('>>: ').strip()
        if not msg:
            continue
        msg_l.append(msg)

def format_msg():
    while True:
        if msg_l:
            res = msg_l.pop()
            format_l.append(res.upper())

def save():
    while True:
        if format_l:
            with open('db.txt', 'a', encoding='utf-8') as f:
                res = format_l.pop()
                f.write('%s\n' % res)

if __name__ == '__main__':
    t1 = Thread(target=talk)
    t2 = Thread(target=format_msg)
    t3 = Thread(target=save)
    t1.start()
    t2.start()
    t3.start()
```

## 线程相关的其他方法

<!-- snippet: id=python-multi-threading-threading-module-09 mode=compile python=3.12-3.14 deps=stdlib -->
```python
# Thread实例对象的方法
# isAlive(): 返回线程是否活动的
# getName(): 返回线程名称
# setName(): 设置线程名称

# threading模块提供的一些方法：
# threading.currentThread(): 返回当前的线程变量
# threading.enumerate(): 返回一个包含正在运行的线程的list。正在运行指线程启动后、结束前，不包括启动前和终止后的线程
# threading.activeCount(): 返回正在运行的线程数量，与len(threading.enumerate())有相同的结果
```

<!-- snippet: id=python-multi-threading-threading-module-10 mode=compile python=3.12-3.14 deps=stdlib -->
```python
from threading import Thread
import threading
from multiprocessing import Process
import os

def work():
    import time
    time.sleep(3)
    print(threading.current_thread().getName())

if __name__ == '__main__':
    # 在主进程下开启线程
    t = Thread(target=work)
    t.start()

    print(threading.current_thread().getName())
    print(threading.current_thread())  # 主线程
    print(threading.enumerate())  # 连同主线程在内有两个运行的线程
    print(threading.active_count())
    print('主进程 pid', os.getpid())
```

**主线程等待子线程结束**

<!-- snippet: id=python-multi-threading-threading-module-11 mode=compile python=3.12-3.14 deps=stdlib -->
```python
from threading import Thread
import time

def sayhi(name):
    time.sleep(2)
    print('%s say hello' % name)

if __name__ == '__main__':
    t = Thread(target=sayhi, args=('egon',))
    t.start()
    t.join()
    print('主线程')
    print(t.is_alive())
    # egon say hello
    # 主线程
    # False
```

## 守护线程

**无论是进程还是线程，都遵循：守护xxx会等待主xxx运行完毕后被销毁。**

**需要强调的是：运行完毕并非终止运行。**

1. 对主进程来说，运行完毕指的是主进程代码运行完毕
2. 对主线程来说，运行完毕指的是主线程所在的进程内所有非守护线程统统运行完毕，主线程才算运行完毕

**详细解释**

1. 主进程在其代码结束后就已经算运行完毕了（守护进程在此时就被回收），然后主进程会一直等非守护的子进程都运行完毕后回收子进程的资源，否则会产生僵尸进程，才会结束。

2. 主线程在其他非守护线程运行完毕后才算运行完毕（守护线程在此时就被回收）。因为主线程的结束意味着进程的结束，进程整体的资源都将被回收，而进程必须保证非守护线程都运行完毕后才能结束。

<!-- snippet: id=python-multi-threading-threading-module-12 mode=compile python=3.12-3.14 deps=stdlib -->
```python
from threading import Thread
import time

def sayhi(name):
    time.sleep(2)
    print('%s say hello' % name)

if __name__ == '__main__':
    t = Thread(target=sayhi, args=('egon',))
    t.setDaemon(True)  # 必须在t.start()之前设置
    t.start()

    print('主线程')
    print(t.is_alive())
    # 主线程
    # True
```

<!-- snippet: id=python-multi-threading-threading-module-13 mode=compile python=3.12-3.14 deps=stdlib -->
```python
from threading import Thread
import time

def foo():
    print(123)
    time.sleep(1)
    print("end123")

def bar():
    print(456)
    time.sleep(3)
    print("end456")

t1 = Thread(target=foo)
t2 = Thread(target=bar)

t1.daemon = True
t1.start()
t2.start()
print("main-------")
```

## 事件

线程的一个关键特性是每个线程都是独立运行且状态不可预测。如果程序中的其他线程需要通过判断某个线程的状态来确定自己下一步的操作，这时线程同步问题就会变得非常棘手。为了解决这些问题，我们需要使用threading库中的Event对象。

Event对象包含一个可由线程设置的信号标志，它允许线程等待某些事件的发生。在初始情况下，Event对象中的信号标志被设置为假。如果有线程等待一个Event对象，而这个Event对象的标志为假，那么这个线程将会被一直阻塞直至该标志为真。一个线程如果将一个Event对象的信号标志设置为真，它将唤醒所有等待这个Event对象的线程。如果一个线程等待一个已经被设置为真的Event对象，那么它将忽略这个事件，继续执行。

<!-- snippet: id=python-multi-threading-threading-module-14 mode=compile python=3.12-3.14 deps=stdlib -->
```python
Event.isSet()  # 返回event的状态值
Event.wait()  # 如果 event.isSet() == False 将阻塞线程
Event.set()  # 设置event的状态值为True，所有阻塞池的线程激活进入就绪状态，等待操作系统调度
Event.clear()  # 恢复
```

**有多个工作线程尝试链接MySQL，我们想要在链接前确保MySQL服务正常才让那些工作线程去连接MySQL服务器，如果连接不成功，都会去尝试重新连接。那么我们就可以采用threading.Event机制来协调各个工作线程的连接操作。**

<!-- snippet: id=python-multi-threading-threading-module-15 mode=compile python=3.12-3.14 deps=stdlib -->
```python
from threading import Thread, Event
import time

def check_mysql(event):
    print('正在检查mysql连接...')
    time.sleep(2)
    print('mysql连接成功')
    event.set()  # 通知所有等待的线程

def worker(event):
    print('线程 %s 正在等待mysql连接...' % threading.current_thread().name)
    event.wait()  # 阻塞等待
    print('线程 %s 开始工作' % threading.current_thread().name)

if __name__ == '__main__':
    event = Event()

    # 启动检查线程
    check_thread = Thread(target=check_mysql, args=(event,))
    check_thread.start()

    # 启动多个工作线程
    for i in range(5):
        t = Thread(target=worker, args=(event,))
        t.start()
```

## 线程同步与锁

### 同步的概念

1. **多线程开发可能遇到的问题**

假设两个线程t1和t2都要对num=0进行增1运算，t1和t2都各对num修改10次，num的最终的结果应该为20。但是由于是多线程访问，有可能出现下面情况：

在num=0时，t1取得num=0。此时系统把t1调度为"sleeping"状态，把t2转换为"running"状态，t2也获得num=0。然后t2对得到的值进行加1并赋给num，使得num=1。然后系统又把t2调度为"sleeping"，把t1转为"running"。线程t1又把它之前得到的0加1后赋值给num。这样，明明t1和t2都完成了1次加1工作，但结果仍然是num=1。

<!-- snippet: id=python-multi-threading-threading-module-16 mode=compile python=3.12-3.14 deps=stdlib -->
```python
from threading import Thread
import time

g_num = 0

def test1():
    global g_num
    for i in range(1000000):
        g_num += 1
    print("---test1---g_num=%d" % g_num)

def test2():
    global g_num
    for i in range(1000000):
        g_num += 1
    print("---test2---g_num=%d" % g_num)

p1 = Thread(target=test1)
p1.start()
# time.sleep(3)  # 取消屏蔽之后再次运行程序，结果会不一样
p2 = Thread(target=test2)
p2.start()
print("---g_num=%d---" % g_num)
```

运行结果（可能不一样，但是结果往往不是2000000）：

<!-- snippet: id=python-multi-threading-threading-module-17 mode=display python=3.12-3.14 deps=stdlib -->
```text
---g_num=284672---
---test1---g_num=1166544
---test2---g_num=1406832
```

取消屏蔽之后，再次运行结果如下：

<!-- snippet: id=python-multi-threading-threading-module-18 mode=display python=3.12-3.14 deps=stdlib -->
```text
---test1---g_num=1000000
---g_num=1041802---
---test2---g_num=2000000
```

问题产生的原因就是没有控制多个线程对同一资源的访问，对数据造成破坏，使得线程运行的结果不可预期。这种现象称为"线程不安全"。

2. **什么是同步**

同步就是协同步调，按预定的先后次序进行运行。如:你说完，我再说。

"同"字从字面上容易理解为我们一起动作其实不是，"同"字应是指协同、协助、互相配合。如进程、线程同步，可理解为进程或线程A和B一块配合，A执行到一定程度时要依靠B的某个结果，于是停下来，示意B运行；B依言执行，再将结果给A；A再继续操作。

3. **解决问题的思路**

对于本小节提出的那个计算错误的问题，可以通过线程同步来进行解决。

<!-- snippet: id=python-multi-threading-threading-module-19 mode=compile python=3.12-3.14 deps=stdlib -->
```python
from threading import Thread, Lock

g_num = 0

def test1():
    global g_num
    for i in range(1000000):
        mutex.acquire()
        g_num += 1
        mutex.release()
    print("---test1---g_num=%d" % g_num)

def test2():
    global g_num
    for i in range(1000000):
        mutex.acquire()
        g_num += 1
        mutex.release()
    print("---test2---g_num=%d" % g_num)

mutex = Lock()
p1 = Thread(target=test1)
p1.start()
p2 = Thread(target=test2)
p2.start()
print("---g_num=%d---" % g_num)
```

## GIL全局解释器锁

Python代码的执行由Python虚拟机（解释器）控制。Python在设计时是这样考虑的：在主循环中只能有一个线程执行解释器代码。

GIL 的全称是 Global Interpreter Lock。对默认启用 GIL 的 CPython 构建，同一解释器在某一时刻通常只有一个线程执行 Python 字节码；线程本身仍是操作系统线程，并非“模拟线程”。阻塞 I/O 和许多 C 扩展会释放 GIL。Python 3.13 起还提供实验性的 free-threaded CPython 构建，因此这里属于 CPython 构建方式的实现约束，不是 Python 语言保证。

**注意**：GIL只会影响到那些严重依赖CPU的程序（如数值计算），对于I/O操作（文件读写、网络请求等）影响不大。

<!-- snippet: id=python-multi-threading-threading-module-20 mode=compile python=3.12-3.14 deps=stdlib -->
```python
# 在I/O密集型任务中，多线程很有用
import threading
import time

def task():
    time.sleep(1)
    print('done')

threads = []
for i in range(5):
    t = threading.Thread(target=task)
    threads.append(t)
    t.start()

for t in threads:
    t.join()
```

## 总结

1. 线程共享创建它的进程的地址空间；进程拥有独立的地址空间
2. 线程可以直接访问其进程的数据；进程拥有父进程数据段的副本
3. 线程可以与其进程的其他线程直接通信；进程必须使用进程间通信
4. 新线程创建容易；新进程需要复制父进程
5. 线程可以对同一进程的线程执行较大控制；进程只能控制子进程
6. Python的GIL限制了同一时刻只能有一个线程执行Python字节码，但I/O操作时会释放GIL
