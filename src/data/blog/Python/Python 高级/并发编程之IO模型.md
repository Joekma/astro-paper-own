---
title: 并发编程之IO模型
author: FjellOverflow
pubDatetime: 2018-11-14T00:00:00Z
modDatetime: 2026-04-22T00:00:00Z
featured: false
draft: false
tags:
  - Python
  - 并发编程
  - docs
description: 并发编程之IO模型，详解阻塞IO、非阻塞IO、IO多路复用、异步IO等核心概念与实现。
---

# 并发编程之IO模型

## IO模型介绍

同步（synchronous）IO和异步（asynchronous）IO，阻塞（blocking）IO和非阻塞（non-blocking）IO分别是什么，到底有什么区别？这个问题其实不同的人给出的答案都可能不同，比如wiki，就认为 asynchronous IO和non-blocking IO是一个东西。这其实是因为不同的人的知识背景不同，并且在讨论这个问题的时候上下文(context)也不相同。所以，为了更好的回答这个问题，我先限定一下本文的上下文。

本文讨论的背景是Linux环境下的network IO。本文最重要的参考文献是Richard Stevens的"UNIX Network Programming Volume 1, Third Edition: The Sockets Networking"，6.2节"I/O Models"，Stevens在这节中详细说明了各种IO的特点和区别，如果英文够好的话，推荐直接阅读。Stevens的文风是有名的深入浅出，所以不用担心看不懂。本文中的流程图也是截取自参考文献。

Stevens在文章中一共比较了五种IO Model：

* blocking IO
* nonblocking IO
* IO multiplexing
* signal driven IO
* asynchronous IO

由signal driven IO（信号驱动IO）在实际中并不常用，所以主要介绍其余四种IO Model。

再说一下IO发生时涉及的对象和步骤。对于一个network IO (这里我们以read举例)，它会涉及到两个系统对象，一个是调用这个IO的process (or thread)，另一个就是系统内核(kernel)。当一个read操作发生时，该操作会经历两个阶段：

```python
# 1）等待数据准备 (Waiting for the data to be ready)
# 2）将数据从内核拷贝到进程 (Copying the data from the kernel to the process)
```

记住这两点很重要，因为这些IO模型的区别就是在两个阶段上各有不同的情况。

1. 输入操作：read、readv、recv、recvfrom、recvmsg等函数，如果会阻塞状态，则会经历wait data和copy data两个阶段，如果设置为非阻塞则在wait 不到data时抛出异常
2. 输出操作：write、writev、send、sendto、sendmsg等函数，在发送缓冲区满了会阻塞在原地，如果设置为非阻塞，则会抛出异常
3. 接收外来链接：accept，与输入操作类似
4. 发起外出链接：connect，与输出操作类似

## 阻塞IO (blocking IO)

在linux中，默认情况下所有的socket都是blocking，一个典型的读操作流程大概是这个样子：

![blocking IO模型](https://images2017.cnblogs.com/blog/1036857/201708/1036857-20170831215423765-2063960072.png)

当用户进程调用了recvfrom这个系统调用，kernel就开始了IO的第一个阶段：准备数据。对于network io来说，很多时候数据在一开始还没有到达（比如，还没有收到一个完整的UDP包），这个时候kernel就要等待足够的数据到来。

而在用户进程这边，整个进程会被阻塞。当kernel一直等到数据准备好了，它就会将数据从kernel中拷贝到用户内存，然后kernel返回结果，用户进程才解除block的状态，重新运行起来。

**所以，blocking IO的特点就是在IO执行的两个阶段（等待数据和拷贝数据两个阶段）都被block了。**

几乎所有的程序员第一次接触到的网络编程都是从listen()、send()、recv() 等接口开始的，使用这些接口可以很方便的构建服务器/客户机的模型。然而大部分的socket接口都是阻塞型的。

ps：所谓阻塞型接口是指系统调用（一般是IO接口）不返回调用结果并让当前线程一直阻塞，只有当该系统调用获得结果或者超时出错时才返回。

![阻塞IO模型](https://images2017.cnblogs.com/blog/1036857/201708/1036857-20170831220441233-1942812160.png)

实际上，除非特别指定，几乎所有的IO接口 (包括socket接口) 都是阻塞型的。这给网络编程带来了一个很大的问题，如在调用recv(1024)的同时，线程将被阻塞，在此期间，线程将无法执行任何运算或响应任何的网络请求。

```python
from socket import *

server = socket(AF_INET, SOCK_STREAM)
server.setsockopt(SOL_SOCKET, SO_REUSEADDR, 1)
server.bind(('127.0.0.1', 8080))
server.listen(5)
print('start runnig...')

while True:
    conn, addr = server.accept()  # IO操作 在这accept的时候不能干recv的活
    print(addr)
    while True:
        try:
            data = conn.recv(1024)  # IO操作
            conn.send(data.upper())
        except Exception:
            break
    conn.close()
server.close()

# 我们以前写的这个就是阻塞的IO模型：一旦阻塞了就在那卡着
# 直到等到数据已经到了操作系统，操作系统再从内核拷贝给应用程序
# 阻塞IO在那两个阶段全都阻塞住了
```

**服务端代码**

```python
from socket import *

client = socket(AF_INET, SOCK_STREAM)
client.connect(('127.0.0.1', 8080))

while True:
    cmd = input('>>:').strip()
    if not cmd:
        continue
    client.send(cmd.encode('utf-8'))
    data = client.recv(1024)
    print('接受的是: %s' % data.decode('utf-8'))

client.close()
```

**客户端代码**

一个简单的解决方案：

在服务器端使用多线程（或多进程）。多线程（或多进程）的目的是让每个连接都拥有独立的线程（或进程），这样任何一个连接的阻塞都不会影响其他的连接。

**该方案的问题是：**

开启多进程或都线程的方式，在遇到要同时响应成百上千路的连接请求，则无论多线程还是多进程都会严重占据系统资源，降低系统对外界响应效率，而且线程与进程本身也更容易进入假死状态。

**改进方案：**

很多程序员可能会考虑使用"线程池"或"连接池"。"线程池"旨在减少创建和销毁线程的频率，其维持一定合理数量的线程，并让空闲的线程重新承担新的执行任务。"连接池"维持连接的缓存池，尽量重用已有的连接、减少创建和关闭连接的频率。这两种技术都可以很好的降低系统开销，都被广泛应用很多大型系统，如websphere、tomcat和各种数据库等。

**改进后方案其实也存在着问题：**

"线程池"和"连接池"技术也只是在一定程度上缓解了频繁调用IO接口带来的资源占用。而且，所谓"池"始终有其上限，当请求大大超过上限时，"池"构成的系统对外界的响应并不比没有池的时候效果好多少。所以使用"池"必须考虑其面临的响应规模，并根据响应规模调整"池"的大小。

**对应上例中的所面临的可能同时出现的上千甚至上万次的客户端请求，"线程池"或"连接池"或许可以缓解部分压力，但是不能解决所有问题。总之，多线程模型可以方便高效的解决小规模的服务请求，但面对大规模的服务请求，多线程模型也会遇到瓶颈，可以用非阻塞接口来尝试解决这个问题。**

## 非阻塞IO (non-blocking IO)

Linux下，可以通过设置socket使其变为non-blocking。当对一个non-blocking socket执行读操作时，流程是这个样子：

![非阻塞IO模型](https://images2017.cnblogs.com/blog/1036857/201708/1036857-20170831221803468-1908924864.png)

从图中可以看出，当用户进程发出read操作时，如果kernel中的数据还没有准备好，那么它并不会block用户进程，而是立刻返回一个error。从用户进程角度讲，它发起一个read操作后，并不需要等待，而是马上就得到了一个结果。用户进程判断结果是一个error时，它就知道数据还没有准备好，于是用户就可以在本次到下次再发起read询问的时间间隔内做其他事情，或者直接再次发送read操作。一旦kernel中的数据准备好了，并且又再次收到了用户进程的system call，那么它马上就将数据拷贝到了用户内存（这一阶段仍然是阻塞的），然后返回。

也就是说非阻塞的recvform系统调用调用之后，进程并没有被阻塞，内核马上返回给进程，如果数据还没准备好，此时会返回一个error。进程在返回之后，可以干点别的事情，然后再发起recvform系统调用。重复上面的过程，循环往复的进行recvform系统调用。这个过程通常被称之为轮询。轮询检查内核数据，直到数据准备好，再拷贝数据到进程，进行数据处理。需要注意，拷贝数据整个过程，进程仍然是属于阻塞的状态。

**所以，在非阻塞式IO中，用户进程其实是需要不断的主动询问kernel数据准备好了没有。**

```python
'''
server.setblocking()   默认值为True
server.setblocking(False)  False的话就成了非阻塞了，这只是对于socket套接字来说的
所以，在非阻塞式IO中，用户进程其实是需要不断的主动询问内核数据准备好了没有

wait data 等数据的这个阶段是不阻塞的，copy data 这个阶段还是要阻塞的
'''

# 服务端
import socket
import time

server = socket.socket()
server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
server.bind(('127.0.0.1', 8083))
server.listen(5)

server.setblocking(False)
r_list = []
w_list = {}

while 1:
    try:
        conn, addr = server.accept()
        r_list.append(conn)
    except BlockingIOError:
        # 强调强调强调：！！！非阻塞IO的精髓在于完全没有阻塞！！！
        # time.sleep(0.5)  # 打开该行注释纯属为了方便查看效果
        print('在做其他的事情')
        print('rlist: ', len(r_list))
        print('wlist: ', len(w_list))

        # 遍历读列表，依次取出套接字读取内容
        del_rlist = []
        for conn in r_list:
            try:
                data = conn.recv(1024)
                if not data:
                    conn.close()
                    del_rlist.append(conn)
                    continue
                w_list[conn] = data.upper()
            except BlockingIOError:  # 没有收成功，则继续检索下一个套接字的内容
                continue
            except ConnectionResetError:  # 当前套接字出异常，则关闭，然后加入删除列表，等待被清除
                conn.close()
                del_rlist.append(conn)

        # 遍历写列表，依次取出套接字发送内容
        del_wlist = []
        for conn, data in w_list.items():
            try:
                conn.send(data)
                del_wlist.append(conn)
            except BlockingIOError:
                continue

        # 清理无用的套接字，无需再监听它们的IO操作
        for conn in del_rlist:
            r_list.remove(conn)

        for conn in del_wlist:
            w_list.pop(conn)
```

**服务端代码**

```python
# 客户端
import socket
import os

client = socket.socket()
client.connect(('127.0.0.1', 8083))

while 1:
    res = ('%s hello' % os.getpid()).encode('utf-8')
    client.send(res)
    data = client.recv(1024)
    print(data.decode('utf-8'))
```

**客户端代码**

```python
from socket import *
import time

server = socket(AF_INET, SOCK_STREAM)
server.bind(('127.0.0.1', 8080))
server.listen(5)

server.setblocking(False)  # 默认值是True （如果是False，套接字里面的一些阻塞操作都变成非阻塞的了
print('start....')

conn_l = []  # 这种读写没有分开检测，如果服务端操作系统缓存满了，就会报错，还是分成两个列表更加完善
del_l = []
while True:
    try:
        conn, addr = server.accept()  # 收不到数据的时候才出异常
        print(conn)
        conn_l.append(conn)
    except BlockingIOError:  # 把收不到数据的那段时间利用起来（利用他收不到数据的时候，才干下面的for循环）
        for conn in conn_l:
            try:
                data = conn.recv(1024)
                conn.send(data.upper())
            except BlockingIOError:
                pass
            except ConnectionResetError:  # 断开连接的错误（如果突然断开连接，会报错，就先添加到列表里面去，完了把连接清除）
                del_l.append(conn)
        for obj in del_l:
            obj.close()
            conn_l.remove(obj)
        del_l.clear()
```

**服务端代码**

```python
from socket import *

client = socket(AF_INET, SOCK_STREAM)
client.connect(('127.0.0.1', 8080))

while True:
    cmd = input('>>:').strip()
    if not cmd:
        continue
    client.send(cmd.encode('utf-8'))
    data = client.recv(1024)
    print(data.decode('utf-8'))
```

**客户端代码**

```python
from concurrent.futures import ThreadPoolExecutor
import socket

server = socket.socket()
# 重用端口
server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)

server.bind(("192.168.11.210", 9999))
server.listen(5)

# 设置是否为阻塞，默认阻塞
server.setblocking(False)

def data_handler(conn):
    print("一个新连接..")
    while True:
        data = conn.recv(1024)
        conn.send(data.upper())

# 已连接的客户端列表
clients = []
# 需要发送的数据
send_datas = []
# 已经发送完毕，需要删除的数据
del_datas = []
# 待关闭的客户端列表
closed_cs = []

import time
while True:
    try:
        conn, addr = server.accept()
        # 切到处理数据的任务去执行
        # 代码走到这里才算是连接成功
        # 把连接成功的客户端存起来
        clients.append(conn)
    except BlockingIOError:
        # 要处理的是已经连接成功的客户端
        # 接收数据
        for c in clients:
            try:
                data = c.recv(1024)
                if not data:
                    # 对方关闭了连接
                    c.close()
                    # 从客户端列表中删除它
                    closed_cs.append(c)
                    continue
                print("收到 %s" % data.decode("utf-8"))
                # 现在非阻塞，send直接往缓存放，如果缓存满了 肯定有问题，需要单独处理发送
                send_datas.append((c, data))
            except BlockingIOError:
                pass
            except ConnectionResetError:
                # 对方关闭了连接
                c.close()
                # 从客户端列表中删除它
                closed_cs.append(c)

        # 处理发送数据
        for data in send_datas[:]:  # 复制了一份原有列表，但这种方法没有在迭代期间修改被迭代对象，也可以实现删除操作
            try:
                data[0].send(data[1].upper())
                # 发送成功需要删除，不能直接删除
                del_datas.append(data)
            except BlockingIOError:
                continue
            except ConnectionResetError:
                # 客户端连接需要删除
                data[0].close()
                closed_cs.append(data[0])
                # 等待发送的数据需要删除
                del_datas.append(data)

        # 删除无用的数据
        for d in del_datas:
            # 从待发送的列表中删除
            send_datas.remove(d)
        del_datas.clear()
        for c in closed_cs:
            clients.remove(c)
        closed_cs.clear()
```

**虎老师的服务端代码**

**但是非阻塞IO模型绝不被推荐。**

我们不能否定其优点：能够在等待任务完成的时间里干其他活了（包括提交其他任务，也就是"后台"可以有多个任务在"同时"执行）。

但是也难掩其缺点：

1. 循环调用recv()将大幅度推高CPU占用率；这也是我们在代码中留一句time.sleep(2)的原因，否则在低配主机下极容易出现卡机情况。
2. 任务完成的响应延迟增大了，因为每过一段时间才去轮询一次read操作，而任务可能在两次轮询之间的任意时间完成。这会导致整体数据吞吐量的降低。

**此外，在这个方案中recv()更多的是起到检测"操作是否完成"的作用，实际操作系统提供了更为高效的检测"操作是否完成"作用的接口，例如select()多路复用模式，可以一次检测多个连接是否活跃。**

## 多路复用IO (IO multiplexing)

Python中有一个select模块，其中提供了：select、poll、epoll三个方法，分别调用系统的 select，poll，epoll从而实现IO多路复用。

- Windows Python：提供：select
- Mac Python：提供：select
- Linux Python：提供：select、poll、epoll

**select方法**

select 的中文含义是"选择"，select机制也如其名，监听一些server 关心的套接字、文件等对象，关注他们是否可读、可写、发生异常等事件，一旦出现一些 select 关注的事件，select 会对相应的套接字或文件进行特定的处理，这就是 select 机制最主要的功能。select 机制可以只使用一个进程/线程来处理多个socket或其他对象，因此又被称为I/O复用。

关于select机制的进程阻塞形式，与普通的套接字略有不同。socket对象可能阻塞在accept(),recvfrom()等方法上，以recvfrom()方法为例，当执行到socket.recvfrom()这一句时，就会调用一个系统调用询问内核：client/server发来的数据包准备好了没？此时从进程空间切换到内核地址空间，内核可能需要等数据包完全到达，然后将数据复制到程序的地址空间后，recvfrom()才会返回，接下来进程继续执行，对读取到的数据进行必要的处理。

而使用select函数编程时，同样针对上面的recvfrom()方法，进程会阻塞在select()调用上，等待出现一个或多个套接字对象满足可读事件，当内核将数据准备好后，select()返回某个套接字对象可读这一条件，随后再调用recvfrom()将数据包从内核复制到进程地址空间。所以可见，如果仅仅从单个套接字的处理来看，select()反倒性能更低，因为select机制使用两个系统调用。但select机制的优势就在于它可以同时等待多个fd就绪，而当某个fd发生满足我们关心的事件时，就对它执行特定的操作。

**select语法**

```python
select(rlist, wlist, xlist, timeout=None)

Wait until one or more file descriptors are ready for some kind of I/O.
The first three arguments are sequences of file descriptors to be waited for

rlist -- wait until ready for reading
wlist -- wait until ready for writing
xlist -- wait for an  "exceptional condition"

If only one kind of condition is required, pass [] for the other lists.
A file descriptor is either a socket or file object, or a small integer
gotten from a fileno() method call on one of those

The return value is a tuple of three lists corresponding to the first three
arguments; each contains the subset of the corresponding file descriptors
that are ready
```

**select官方解释**

select方法用来监视文件句柄，如果句柄发生变化，则获取该句柄：

1. 当参数1序列中的句柄发生可读时（accept和read），则获取发生变化的句柄并添加到返回的序列中。
2. 当参数2序列中含有句柄时，则将该序列中所有的句柄添加到返回的序列中。
3. 当参数3序列中的句柄发生错误时，则将该发生错误的句柄添加到返回的序列中。
4. 当超时时间未设置，则select会一直阻塞，直到监听的句柄发生变化。
5. 当超时时间设置时，那么如果监听的句柄均无任何变化，则select会阻塞X秒，之后返回三个空列表，如果监听的句柄有变化，则直接执行。

由于select()接口可以同时对多个句柄进行读状态，写状态和错误状态的探测，所以可以很容易构建为多个客户端提供独立问答服务的服务器系统。这里需要指出的是，客户端的一个connect()操作，将在服务器端激发一个"可读事件"，所以 select() 也能探测来自客户端的connect()行为。

上述模型中，最关键的地方是如何动态维护select()的三个参数。程序员需要检查对应的返回值列表，以确定到底哪些句柄发生了事件。所以如果select()发现某句柄捕捉到了"可读事件"，服务器程序应及时做recv()操作，并根据接收到的数据准备好待发送数据，并将对应的句柄值加入句柄序列中，准备下一次的"可写事件"的select()探测。同样，如果select()发现某句柄捕捉到"可写事件"，则程序应及时做send()操作，并准备好下一次的"可读事件"探测准备工作。

IO multiplexing这个词可能有点陌生，但是如果我说select/epoll，大概就都能明白了。有些地方也称这种IO方式为**事件驱动IO** (event driven IO)。我们都知道，select/epoll的好处就在于单个process就可以同时处理多个网络连接的IO，它的基本原理就是select/epoll这个function会不断的轮询所负责的所有socket，当某个socket有数据到达了，就通知用户进程，它的流程如图：

![IO多路复用模型](https://images2017.cnblogs.com/blog/1036857/201708/1036857-20170831225603562-854824774.png)

当用户进程调用了select，那么整个进程会被block，而同时，kernel会"监视"所有select负责的socket，当任何一个socket中的数据准备好了，select就会返回。这个时候用户进程再调用read操作，将数据从kernel拷贝到用户进程。

这个图和blocking IO的图其实并没有太大的不同，事实上还更差一些。因为这里需要使用两个系统调用(select和recvfrom)，而blocking IO只调用了一个系统调用(recvfrom)。但是，用select的优势在于它可以同时处理多个connection。

**强调：**

**1. 如果处理的连接数不是很高的话，使用select/epoll的web server不一定比使用multi-threading + blocking IO的web server性能更好，可能延迟还更大。select/epoll的优势并不是对于单个连接能处理得更快，而是在于能处理更多的连接。**

**2. 在多路复用模型中，对于每一个socket，一般都设置成为non-blocking，但是，如上图所示，整个用户的process其实是一直被block的。只不过process是被select这个函数block，而不是被socket IO给block。**

**结论: select的优势在于可以处理多个连接，不适用于单个连接。**

```python
# 服务端
from socket import *
import select

server = socket(AF_INET, SOCK_STREAM)
server.bind(('127.0.0.1', 8093))
server.listen(5)
server.setblocking(False)
print('starting...')

rlist = [server, ]
wlist = []
wdata = {}

while True:
    rl, wl, xl = select.select(rlist, wlist, [], 0.5)
    print(wl)
    for sock in rl:
        if sock == server:
            conn, addr = sock.accept()
            rlist.append(conn)
        else:
            try:
                data = sock.recv(1024)
                if not data:
                    sock.close()
                    rlist.remove(sock)
                    continue
                wlist.append(sock)
                wdata[sock] = data.upper()
            except Exception:
                sock.close()
                rlist.remove(sock)

    for sock in wl:
        sock.send(wdata[sock])
        wlist.remove(sock)
        wdata.pop(sock)

# 客户端
from socket import *

client = socket(AF_INET, SOCK_STREAM)
client.connect(('127.0.0.1', 8093))

while True:
    msg = input('>>: ').strip()
    if not msg:
        continue
    client.send(msg.encode('utf-8'))
    data = client.recv(1024)
    print(data.decode('utf-8'))

client.close()
```

**代码示例**

```python
from concurrent.futures import ThreadPoolExecutor
import socket
import select

# select 帮你从一堆连接中找出来需要被处理的连接
server = socket.socket()
# 重用端口
server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)

server.bind(("192.168.11.210", 9999))
server.listen(5)

# 设置是否为阻塞，默认阻塞
server.setblocking(False)

def data_handler(conn):
    print("一个新连接..")
    while True:
        data = conn.recv(1024)
        conn.send(data.upper())

# 需要检测的 是否可读取的列表 (recv就是一个读取操作)
rlist = [server, ]
# 需要检测的 是否写入的列表 (send就是写入操作)
wlist = []

# 需要发送的数据 目前是因为我们要把接收的数据在发回去，所以搞了这个东西，正常没有这种需求
# 目前客户端与服务器端交互是必须客户端发送数据，服务器端才能返回数据
dic = {}

while True:  # 用于检测需要处理的连接 需要不断检测，所以循环
    # rl目前可读的客户端列表 wl目前可写的客户端列表
    rl, wl, xl = select.select(rlist, wlist, [])  # select默认阻塞 阻塞到任意一个连接可以被处理
    print(len(rl))
    # 处理可读的socket
    for c in rl:
        # 无论是客户端还是服务器只要可读就会执行到这里
        if c == server:
            # 接收客户端的连接请求 (一个读操作)
            conn, addr = c.accept()
            # 将新连接也交给select来检测
            rlist.append(conn)
        else:  # 不是服务器就是客户端，客户端可读可以执行recv
            try:
                data = c.recv(1024)
                if not data:
                    c.close()
                    rlist.remove(c)
                    continue
                wlist.append(c)
                wdata[c] = data
            except Exception:
                c.close()
                rlist.remove(c)

    # 处理可写的socket
    for c in wl:
        try:
            c.send(wdata[c].upper())
            wlist.remove(c)
            del wdata[c]
        except Exception:
            c.close()
            wlist.remove(c)
            rlist.remove(c)
            del wdata[c]
```

**selectors更好用，解决了上面select，epoll，poll的问题。socketserver用这个模块IO问题也解决了，实现并发也解决了。**
