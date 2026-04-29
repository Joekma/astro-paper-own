---
title: 网络编程之Socket
author: FjellOverflow
pubDatetime: 2024-08-13T00:00:00Z
modDatetime: 2026-04-22T00:00:00Z
featured: false
draft: false
tags:
  - Python
  - 网络编程
  - docs
description: 网络编程之Socket，详细讲解TCP/UDP协议、Socket套接字编程与网络通信原理。
---

# 网络编程之Socket

## socket的起源

socket一词的起源：在组网领域的首次使用是在1970年2月12日发布的文献IETF RFC33中发现的，撰写者为Stephen Carr、Steve Crocker和Vint Cerf。根据美国计算机历史博物馆的记载，Croker写道："命名空间的元素都可称为套接字接口。一个套接字接口构成一个连接的一端，而一个连接可完全由一对套接字接口规定。"计算机历史博物馆补充道："这比BSD的套接字接口定义早了大约12年。"

socket起源于Unix，而Unix/Linux 基本哲学之一就是"一切皆文件"，都可以用"打开open -> 读写write/read -> 关闭close"模式来操作。Socket就是该模式的一个实现，socket即是一种特殊的文件，一些socket函数就是对其进行的操作（读写IO、打开、关闭）。

套接字起源于 20 世纪 70 年代加利福尼亚大学伯克利分校版本的Unix，即人们所说的 BSD Unix。因此，有时人们也把套接字称为"伯克利套接字"或"BSD 套接字"。一开始套接字被设计用在同一台主机上多个应用程序之间的通讯。这也被称进程间通讯，即IPC。套接字有两种（或者称为有两个种族）分别是基于文件型的和基于网络型的。

今天，SOCKET接口是TCP/IP网络最为通用的API，也是在INTERNET上进行应用开发最为通用的API。

九十年代初，由Microsoft联合了其他几家公司共同制定了一套WINDOWS下的网络编程接口，即Windows Sockets规范。它是Berkeley Sockets的重要扩充，主要是增加了一些异步函数，并增加了符合 Windows 消息驱动特性的网络事件异步选择机制。Windows Sockets规范是一套开放的、支持多种协议的 Windows下的网络编程接口。目前，在实际应用中的Windows Sockets规范主要是1.1版和2.0版。两者的最重要区别是1.1版只支持TCP/IP协议，而2.0版可以支持多协议。2.0版有良好的向后兼容性，目前，Windows下的Internet软件都是基于 WinSock开发的。

| 参数 | 描述 |
|------|------|
| **socket.AF_INET** | **IPv4（默认）** |
| **socket.AF_INET6** | **IPv6** |
| **socket.AF_UNIX** | **只能够用于单一的Unix系统进程间通信** |

### 基于文件类型的套接字家族

**套接字家族的名字：AF_UNIX**

unix一切皆文件，基于文件的套接字调用的就是底层的文件系统来取数据，两个套接字进程运行在同一机器，可以通过访问同一个文件系统间接完成通信。

### 基于网络类型的套接字家族

**套接字家族的名字：AF_INET**

还有AF_INET6被用于ipv6，还有一些其他的地址家族，不过，他们要么是只用于某个平台，要么就是已经被废弃，或者是很少被使用，或者是根本没有实现。所有地址家族中，AF_INET是使用最广泛的一个，python支持很多种地址家族，但是由于我们只关心网络编程，所以大部分时候我们只使用AF_INET。

你想给另一台计算机发消息，你知道他的IP地址，他的机器上同时运行着qq、迅雷、word、浏览器等程序，你想给他的qq发消息，那想一下，你现在只能通过ip找到他的机器，但如果让这台机器知道把消息发给qq程序呢？答案就是通过port，一个机器上可以有1-65535个端口，你的程序想从网络上收发数据，就必须绑定一个端口，这样，远程发到这个端口上的数据，就全会转给这个程序。

## 什么是socket

Socket是应用层与TCP/IP协议族通信的中间软件抽象层。它是一组接口。在设计模式中，Socket其实就是一个门面模式，它把复杂的TCP/IP协议族隐藏在Socket接口后面，对用户来说，一组简单的接口就是全部。让Socket去组织数据，以符合指定的协议。

所以，我们无需深入理解tcp/udp协议，socket已经为我们封装好了，我们只需要遵循socket的规定去编程，写出的程序自然就是遵循tcp/udp标准。

也有人将socket说成ip+port，ip是用来标识互联网中的一台主机的位置，而port是用来标识这台机器上的一个应用程序。ip地址是配置到网卡上的，而port是应用程序开启的，ip与port的绑定就标识了互联网中独一无二的一个应用程序。而程序的pid是同一台机器上不同进程或者线程的标识。

Socket是网络编程的一个抽象概念。通常我们用一个Socket表示"打开了一个网络链接"，而打开一个Socket需要知道目标计算机的IP地址和端口号，再指定协议类型即可。

Socket的英文原意为"孔"或"插座"。作为BSD UNIX的进程通信机制，通常也称"套接字"，用于描述IP地址和端口，是一个通信链的句柄，可以用来实现不同虚拟机或不同计算机之间的通信。

网络上的两个程序通过一个双向的通信连接实现数据的交换，这个连接的一端称为一个socket。

建立网络通信连接至少要一对端口号(socket)。socket本质是编程接口(API)，对TCP/IP的封装，TCP/IP也要提供可供程序员做网络开发所用的接口，这就是Socket编程接口；HTTP是轿车，提供了封装或者显示数据的具体形式；Socket是发动机，提供了网络通信的能力。

### 服务器

和客户端编程相比，服务器编程就要复杂一些。

服务器进程首先要绑定一个端口并监听来自其他客户端的连接。如果某个客户端连接过来了，服务器就与该客户端建立Socket连接，随后的通信就靠这个Socket连接了。

所以，服务器会打开固定端口（比如80）监听，每来一个客户端连接，就创建该Socket连接。由于服务器会有大量来自客户端的连接，所以，服务器要能够区分一个Socket连接是和哪个客户端绑定的。一个Socket依赖4项：服务器地址、服务器端口、客户端地址、客户端端口来唯一确定一个Socket。

但是服务器还需要同时响应多个客户端的请求，所以，每个连接都需要一个新的进程或者新的线程来处理，否则，服务器一次就只能服务一个客户端。

```python
import socket

# 开启ip和端口
ip_port = ('127.0.0.1', 9999)

# 生成一个句柄
sk = socket.socket()

# 绑定ip端口
sk.bind(ip_port)

# 最多连接数
sk.listen(5)

# 开启死循环
while True:
    print('server waiting...')

    # 等待链接，阻塞，直到收到链?conn，打开一个新的对?专门给当前链接的客户?addr是ip地址
    conn, addr = sk.accept()

    # 获取客户端请求数据
    client_data = conn.recv(1024)

    # 打印对方的数据
    print(str(client_data, 'utf8'))

    # 向对方发送数据
    conn.sendall(bytes('不要回答,不要回答,不要回答', 'utf8'))

    # 关闭链接
    conn.close()
```

### 客户端

大多数连接都是可靠的TCP连接。创建TCP连接时，主动发起连接的叫客户端，被动响应连接的叫服务器。

举个例子，当我们在浏览器中访问新浪时，我们自己的计算机就是客户端，浏览器会主动向新浪的服务器发起连接。如果一切顺利，新浪的服务器接受了我们的连接，一个TCP连接就建立起来的，后面的通信就是发送网页内容了。

所以，我们要创建一个基于TCP连接的Socket。

创建`Socket`时，`AF_INET`指定使用IPv4协议，如果要用更先进的IPv6，就指定为`AF_INET6`。`SOCK_STREAM`指定使用面向流的TCP协议，这样，一个`Socket`对象就创建成功，但是还没有建立连接。

客户端要主动发起TCP连接，必须知道服务器的IP地址和端口号。新浪网站的IP地址可以用域名`www.sina.com.cn`自动转换到IP地址，但是怎么知道新浪服务器的端口号呢？

答案是作为服务器，提供什么样的服务，端口号就必须固定下来。由于我们想要访问网页，因此新浪提供网页服务的服务器必须把端口号固定在`80`端口，因为`80`端口是Web服务的标准端口。其他服务都有对应的标准端口号，例如SMTP服务是`25`端口，FTP服务是`21`端口，等等。端口号小于1024的是Internet标准服务的端口，端口号大于1024的，可以任意使用。

TCP连接创建的是双向通道，双方都可以同时给对方发数据。但是谁先发谁后发，怎么协调，要根据具体的协议来决定。例如，HTTP协议规定客户端必须先发请求给服务器，服务器收到后才发数据给客户端。

```python
import socket

# 链接服务端ip和端口
ip_port = ('127.0.0.1', 9999)

# 生成一个句柄
sk = socket.socket()

# 请求连接服务端
sk.connect(ip_port)

# 发送数据
sk.sendall(bytes('yaoyao', 'utf8'))

# 接受数据
server_reply = sk.recv(1024)

# 打印接受的数据
print(str(server_reply, 'utf8'))

# 关闭连接
sk.close()
```

### 小结

用TCP协议进行Socket编程在Python中十分简单，对于客户端，要主动连接服务器的IP和指定端口，对于服务器，要首先监听指定端口，然后，对每一个新的连接，创建一个线程或进程来处理。通常，服务器程序会无限运行下去。

同一个端口，被一个Socket绑定了以后，就不能被别的Socket绑定了。

### 其他功能

```python
sk = socket.socket(socket.AF_INET, socket.SOCK_STREAM, 0)
```

**参数一：地址族**

- socket.AF_INET IPv4（默认）
- socket.AF_INET6 IPv6
- socket.AF_UNIX 只能够用于单一的Unix系统进程间通信

**参数二：类型**

- socket.SOCK_STREAM 流式socket，for TCP（默认）
- socket.SOCK_DGRAM 数据报式socket，for UDP
- socket.SOCK_RAW 原始套接字，普通的套接字无法处理ICMP、IGMP等网络报文，而SOCK_RAW可以；其次，SOCK_RAW也可以处理特殊的IPv4报文；此外，利用原始套接字，可以通过IP_HDRINCL套接字选项由用户构造IP头
- socket.SOCK_RDM 是一种可靠的UDP形式，即保证交付数据报但不保证顺序
- socket.SOCK_RAM用来提供对原始协议的低级访问，在需要执行某些特殊操作时使用，如发送ICMP报文。SOCK_RAM通常仅限于高级用户或管理员运行的程序使用
- socket.SOCK_SEQPACKET 可靠的连续数据包服务

**参数三：协议**

- 0（默认）与特定的地址家族相关的协议。如果?0?则系统就会根据地址格式和套接类?自动选择一个合适的协议

## SOCKET通信流程

是为实现以上各个协议而建立的一个通信管道，实际上就是代表了客户端与服务器端的一个通信进程，双方都是通过指定的socket进行通信，客户端与服务器端都是通过指定的协议去进行通信的。而socket只能是一种连接模式，它也是完全基于TCP以及UDP这两个在传输层最基本的协议的。实际上有很多应用层上的协议是完全基于这两个协议的，比如HTTP协议就是基于TCP协议（TCP协议是可靠的，在发送和接收时都要计算校验和，在传输字节流时是基于三次握手的），而socket则可以创建TCP或UDP的连接，这就说明Socket可以创建任意在应用层上的连接，因为在应用层上的协议完全就是基于UDP与TCP的。

网络编程对所有开发语言都是一样的，Python也不例外。用Python进行网络编程，就是在Python程序本身这个进程内，连接别的服务器进程的通信端口进行通信。

### 流程如下

1. 服务器根据地址类型（ipv4,ipv6）、socket类型、协议创建socket
2. 服务器为socket绑定ip地址和端口号
3. 服务器socket监听端口号请求，随时准备接收客户端发来的连接，这时候服务器的socket并没有被打开
4. 客户端创建socket
5. 客户端打开socket，根据服务器ip地址和端口号试图连接服务器socket
6. 服务器socket接收到客户端socket请求，被动打开，开始接收客户端请求，直到客户端返回连接信息。这时候socket进入阻塞状态，所谓阻塞即accept()方法一直等到客户端返回连接信息后才返回，开始接收下一个客户端连接请求
7. 客户端连接成功，向服务器发送连接状态信息
8. 服务器accept方法返回，连接成功
9. 客户端向socket写入信息（或服务端向socket写入信息）
10. 服务器读取信息，客户端读取信息
11. 客户端关闭
12. 服务器端关闭

### 图表示如下

![socket通信流程](https://images2018.cnblogs.com/blog/1226410/201804/1226410-20180427101220813-1313776302.png)

### 连接原理（三次握手）

根据连接启动的方法以及本地套接字要连接的目标，套接字之间的连接过程可以分为三个步骤：服务端监听，客户端请求，连接确认。

1. **服务器监听**：是服务器端套接字并不定位具体的客户端套接字，而是处于等待连接的状态，实时监控网络状态
2. **客户端请求**：是指由客户端的套接字提出连接请求，要连接的目标是服务器端的套接字。为此，客户端的套接字必须首先描述它要连接的服务器的套接字，指出服务器端套接字的地址和端口号，然后就向服务器端套接字提出连接请求
3. **连接确认**：是指当服务器端套接字监听到或者说接收到客户端套接字的连接请求，它就响应客户端套接字的请求，建立一个新的线程，把服务器端套接字的描述发给客户端，一旦客户端确认了此描述，连接就建立好了。而服务器端套接字继续处于监听状态，继续接收其他客户端套接字的连接请求

更加详细的三次握手，四次挥手请参考一位大佬的博客：https://blog.csdn.net/qzcsu/article/details/72861891

### socket套接字相关方法和参数介绍

```python
sk.bind(address)  # 将套接字绑定到地址。address地址的格式取决于地址族。在AF_INET下，以元组（host,port）的形式表示地址

sk.listen(backlog)  # 开始监听传入连接。backlog指定在拒绝连接之前，可以挂起的最大连接数量
                    # backlog等于5，表示内核已经接到了连接请求，但服务器还没有调用accept进行处理的连接个数最大为5
                    # 这个值不能无限大，因为要在内核中维护连接队列

sk.setblocking(bool)  # 是否阻塞（默认True），如果设置False，那么accept和recv时一旦无数据，则报错

sk.accept()  # 接受连接并返回（conn,address），其中conn是新的套接字对象，可以用来接收和发送数据。address是连接客户端的地址
             # 接收TCP客户的连接（阻塞式）等待连接的到达

sk.connect(address)  # 连接到address处的套接字。一般，address的格式为元组（hostname,port）。如果连接出错，返回socket.error错误

sk.connect_ex(address)  # 同上，只不过会有返回值，连接成功时返回0，连接失败时候返回编码，例如10061

sk.close()  # 关闭套接字

sk.recv(bufsize[, flag])  # 接受套接字的数据。数据以字符串形式返回，bufsize指定最多可以接收的数量。flag提供有关消息的其他信息，通常可以忽略

sk.recvfrom(bufsize[, flag])  # 与recv()类似，但返回值是（data, address）。其中data是包含接收数据的字符串，address是发送数据的套接字地址

sk.send(string[, flag])  # 将string中的数据发送到连接的套接字。返回值是要发送的字节数量，该数量可能小于string的字节大小。即：可能未将指定内容全部发送

sk.sendall(string[, flag])  # 将string中的数据发送到连接的套接字，但在返回之前会尝试发送所有数据。成功返回None，失败则抛出异常
                            # 内部通过递归调用send，将所有内容发送出去

sk.sendto(string[, flag], address)  # 将数据发送到套接字，address是形式为（ipaddr，port）的元组，指定远程地址。返回值是发送的字节数。该函数主要用于UDP协议

sk.settimeout(timeout)  # 设置套接字操作的超时期，timeout是一个浮点数，单位是秒。值为None表示没有超时期。一般，超时期应该在刚创建套接字时设置，因为它们可能用于连接的操作（如client连接最多等?s?）

sk.getpeername()  # 返回连接套接字的远程地址。返回值通常是元组（ipaddr, port）

sk.getsockname()  # 返回套接字自己的地址。通常是一个元组(ipaddr, port)

sk.fileno()  # 套接字的文件描述符
```

## Socket通信套路

当通过socket建立两台机器的连接后，本质上socket只干2件事，一是收数据，一是发数据，没数据时就等着。

socket建立连接的过程跟我们现实中打电话比较像，打电话必须是打电话方和接电话方共同完成的事情，我们分别看看他们是怎么建立起通话的。

### 接电话方

1. 首先你得有个电话
2. 你的电话要有号码
3. 你的电话必须连上电话线
4. 开始在家等电话
5. 电话铃响了，接起电话，听到对方的声音

### 打电话方

1. 首先你得有个电话
2. 输入你想拨打的电话
3. 等待对方接听
4. say "hi 约么，我有七天酒店的打折卡噢~"
5. 等待回应——响应回应——等待回应

### 把它翻译成socket通信

**接电话方（socket服务器端）**

1. 首先你得有个电话（生成socket对象）
2. 你的电话要有号码（绑定本机ip+port）
3. 你的电话必须连上电话线（连网）
4. 开始在家等电话（开始监听电话listen）
5. 电话铃响了，接起电话，听到对方的声音（接受新连接accept）

**打电话方（socket客户端）**

1. 首先你得有个电话（生成socket对象）
2. 输入你想拨打的电话（connect 远程主机ip+port）
3. 等待对方接听
4. say "hi 约么，我有七天酒店的打折卡噢~"（send() 发消息）
5. 等待回应——响应回应——等待回应

## Socket套接字方法

### socket实例

```python
socket.socket(family=AF_INET, type=SOCK_STREAM, proto=0, fileno=None)
```

### family（socket家族）

- socket.AF_UNIX：用于本机进程间通讯，为了保证程序安全，两个独立的进程(进程)间是不能互相访问彼此的内存的，但为了实现进程间的通讯，可以通过创建一个本地的socket来完成
- socket.AF_INET：（还有AF_INET6被用于ipv6，还有一些其他的地址家族，不过，他们要么是只用于某个平台，要么就是已经被废弃，或者是很少被使用，或者是根本没有实现，所有地址家族中，AF_INET是使用最广泛的一个，python支持很多种地址家族，但是由于我们只关心网络编程，所以大部分时候我们只使用AF_INET）

### socket type类型

```python
socket.SOCK_STREAM  # for tcp

socket.SOCK_DGRAM  # for udp

socket.SOCK_RAW  # 原始套接字，普通的套接字无法处理ICMP、IGMP等网络报文，
                 # 而SOCK_RAW可以；其次，SOCK_RAW也可以处理特殊的IPv4报文；此外，
                 # 利用原始套接字，可以通过IP_HDRINCL套接字选项由用户构造IP头
```

### 基于UDP的socket

UDP协议是面向无连接的协议，UDP的不止表现在建立连接上，而且每个数据报都是独立发送的，正是因为UDP协议这些与TCP协议的差异，所以基于UDP的socket编程与基于TCP的socket有较大的区别：

```python
import socket

udp_server = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
udp_server.bind(('127.0.0.1', 8080))

while True:
    msg, addr = udp_server.recvfrom(1024)
    print('收到来自 %s 的消息: %s' % (addr, msg.decode('utf-8')))
    udp_server.sendto(b'我已经收到你的消息', addr)

udp_server.close()
```

```python
import socket

udp_client = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)

while True:
    msg = input('请输入消息: ')
    if msg == 'exit':
        break
    udp_client.sendto(msg.encode('utf-8'), ('127.0.0.1', 8080))
    response, addr = udp_client.recvfrom(1024)
    print('收到服务器回复: %s' % response.decode('utf-8'))

udp_client.close()
```

### 简单版本FTP

**服务端**

```python
import socket
import os

class FTPserver:
    def __init__(self, host='', port=8021):
        self.addr = (host, port)
        self.server = socket.socket()
        self.server.bind(self.addr)
        self.server.listen(5)

    def run(self):
        print('FTP服务器启动，监听 %s:%s' % self.addr)
        while True:
            conn, addr = self.server.accept()
            print('客户端连接: %s:%s' % addr)
            self.handle(conn)

    def handle(self, conn):
        while True:
            data = conn.recv(1024).decode('utf-8')
            if not data:
                break
            cmd, filename = data.split()
            if cmd == 'get':
                self.download(conn, filename)
            elif cmd == 'put':
                self.upload(conn, filename)
            elif cmd == 'list':
                self.list_files(conn)
            elif cmd == 'quit':
                break

    def download(self, conn, filename):
        if os.path.exists(filename):
            file_size = os.path.getsize(filename)
            conn.send(str(file_size).encode('utf-8'))
            with open(filename, 'rb') as f:
                for line in f:
                    conn.send(line)
            print('上传成功')
        else:
            conn.send(b'ERROR: File not found')

    def upload(self, conn, filename):
        data = conn.recv(1024)
        file_size = int(data.decode('utf-8'))
        received_size = 0
        with open('new_' + filename, 'wb') as f:
            while received_size < file_size:
                data = conn.recv(1024)
                f.write(data)
                received_size += len(data)
        print('下载成功')

    def list_files(self, conn):
        files = os.listdir('.')
        conn.send(str(files).encode('utf-8'))

if __name__ == '__main__':
    ftp = FTPserver()
    ftp.run()
```

**客户端**

```python
import socket
import os

class MYTCPClient:
    def __init__(self, addr):
        self.addr = addr
        self.client = socket.socket()

    def run(self):
        self.client.connect(self.addr)
        while True:
            cmd = input('请输入命令 (get/put/list/quit): ').strip()
            if not cmd:
                continue
            self.client.send(cmd.encode('utf-8'))
            if cmd == 'quit':
                break
            elif cmd == 'list':
                files = self.client.recv(1024).decode('utf-8')
                print('服务器文件列表:', files)
            elif cmd.startswith('get '):
                filename = cmd.split()[1]
                self.download_file(filename)
            elif cmd.startswith('put '):
                filename = cmd.split()[1]
                self.upload_file(filename)

    def download_file(self, filename):
        file_size = int(self.client.recv(1024).decode('utf-8'))
        received_size = 0
        with open('download_' + filename, 'wb') as f:
            while received_size < file_size:
                data = self.client.recv(1024)
                f.write(data)
                received_size += len(data)
        print('下载成功')

    def upload_file(self, filename):
        if os.path.exists(filename):
            file_size = os.path.getsize(filename)
            self.client.send(str(file_size).encode('utf-8'))
            with open(filename, 'rb') as f:
                for line in f:
                    self.client.send(line)
            print('上传成功')
        else:
            print('文件不存在')

if __name__ == '__main__':
    client = MYTCPClient(('127.0.0.1', 8021))
    client.run()
```

### 发送带进度条的文件

**服务端**

```python
import socket
import os

class FTPServer:
    def __init__(self, host='', port=8080):
        self.addr = (host, port)
        self.server = socket.socket()
        self.server.bind(self.addr)
        self.server.listen(5)

    def run(self):
        print('服务器启动，监听 %s:%s' % self.addr)
        while True:
            conn, addr = self.server.accept()
            print('客户端连接: %s:%s' % addr)
            self.handle(conn)

    def handle(self, conn):
        data = conn.recv(1024).decode('utf-8')
        filename, file_size = data.split()
        file_size = int(file_size)
        print('准备接收文件: %s, 大小: %s' % (filename, file_size))

        received_size = 0
        with open('received_' + filename, 'wb') as f:
            while received_size < file_size:
                data = conn.recv(1024)
                f.write(data)
                received_size += len(data)
                progress = received_size / file_size * 100
                print('\r接收进度: %.2f%%' % progress, end='')
        print('\n接收完成')

if __name__ == '__main__':
    server = FTPServer()
    server.run()
```

**客户端**

```python
import socket
import os

class MYTCPClient:
    def __init__(self, addr):
        self.addr = addr
        self.client = socket.socket()

    def run(self):
        self.client.connect(self.addr)
        filename = input('请输入要发送的文件名: ')
        if os.path.exists(filename):
            file_size = os.path.getsize(filename)
            self.client.send(('%s %s' % (filename, file_size)).encode('utf-8'))

            send_size = 0
            with open(filename, 'rb') as f:
                for line in f:
                    self.client.send(line)
                    send_size += len(line)
                    progress = send_size / file_size * 100
                    print('\r发送进度: %.2f%%' % progress, end='')
            print('\n发送完成')
        else:
            print('文件不存在')

if __name__ == '__main__':
    client = MYTCPClient(('127.0.0.1', 8080))
    client.run()
```
