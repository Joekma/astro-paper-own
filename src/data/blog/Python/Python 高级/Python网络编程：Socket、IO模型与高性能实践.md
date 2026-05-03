---
title: Python网络编程：Socket、IO模型与高性能实践
author: 程序员
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-05-03T00:00:00.000+08:00
slug: python-network-programming
featured: false
draft: false
tags:
  - Python
  - 网络编程
  - Socket
  - IO模型
  - 高性能
description: 'Python网络编程完整指南，涵盖Socket套接字、IO模型、并发编程和异步实现'
---

> 网络编程是服务端开发的核心技术，本文详细介绍Socket编程、IO模型对比和异步高性能实现。

## Socket基础

### 什么是Socket

Socket（套接字）是应用层与TCP/IP协议族通信的中间软件抽象层，封装了复杂的协议细节，提供简单的编程接口。

**Socket = IP地址 + 端口号**，唯一标识互联网上的一台主机上的一个应用程序。

### Socket起源

Socket起源于1970年的BSD Unix，"一切皆文件"的Unix哲学使得Socket可以用"打开→读写→关闭"的模式操作。

### 地址族与类型

| 参数 | 说明 |
|------|------|
| **socket.AF_INET** | IPv4协议（默认） |
| **socket.AF_INET6** | IPv6协议 |
| **socket.AF_UNIX** | Unix域套接字 |
| **socket.SOCK_STREAM** | TCP流式socket |
| **socket.SOCK_DGRAM** | UDP数据报socket |
| **socket.SOCK_RAW** | 原始套接字 |

### TCP服务器端

```python
import socket

# 创建Socket
server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

# 设置端口复用
server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)

# 绑定地址和端口
server.bind(('0.0.0.0', 9999))

# 监听连接
server.listen(5)

while True:
    # 接受客户端连接（阻塞）
    conn, addr = server.accept()
    print(f'客户端连接: {addr}')
    
    while True:
        try:
            # 接收数据
            data = conn.recv(1024)
            if not data:
                break
            print(f'收到: {data.decode()}')
            # 发送响应
            conn.sendall(data.upper())
        except ConnectionResetError:
            break
    
    conn.close()

server.close()
```

### TCP客户端

```python
import socket

# 创建Socket
client = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

# 连接服务器
client.connect(('127.0.0.1', 9999))

while True:
    msg = input('>>:').strip()
    if not msg:
        continue
    
    # 发送数据
    client.sendall(msg.encode('utf-8'))
    
    # 接收响应
    data = client.recv(1024)
    print(f'收到: {data.decode()}')

client.close()
```

### UDP服务器与客户端

```python
# UDP服务器
server = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
server.bind(('0.0.0.0', 8888))

while True:
    data, addr = server.recvfrom(1024)
    print(f'收到来自 {addr}: {data.decode()}')
    server.sendto(b'ACK', addr)

# UDP客户端
client = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
client.sendto(b'hello', ('127.0.0.1', 8888))
data, _ = client.recvfrom(1024)
```

### Socket方法汇总

| 方法 | 说明 |
|------|------|
| `bind(address)` | 绑定地址 |
| `listen(backlog)` | 开始监听 |
| `accept()` | 接受连接 |
| `connect(address)` | 连接远程 |
| `send(data)` | 发送数据 |
| `recv(bufsize)` | 接收数据 |
| `close()` | 关闭连接 |
| `setblocking(bool)` | 设置阻塞模式 |
| `setsockopt()` | 设置选项 |

## IO模型详解

### IO两个阶段

对于网络IO操作，主要经历两个阶段：

1. **等待数据准备** - 数据从网络到达内核缓冲区
2. **数据拷贝** - 从内核缓冲区拷贝到用户进程

不同IO模型的区别就在这两个阶段的不同处理方式。

### 阻塞IO（BIO）

默认情况下，所有Socket操作都是阻塞的：

```
用户进程 ←← 内核 ←← 网络
   ↓
recvfrom（阻塞等待）
   ↓
① 等待数据准备（阻塞）
   ↓
② 数据拷贝到用户空间（阻塞）
   ↓
返回结果
```

**特点**：
- 两个阶段都被阻塞
- 实现简单，但资源利用率低
- 每个连接一个线程

```python
# 阻塞IO示例
while True:
    conn, addr = server.accept()  # 阻塞
    data = conn.recv(1024)         # 阻塞
    conn.sendall(data)
    conn.close()
```

### 非阻塞IO（NIO）

设置Socket为非阻塞后，操作立即返回：

```python
server.setblocking(False)

while True:
    try:
        conn, addr = server.accept()
    except BlockingIOError:
        # 没有连接时做其他事
        pass
    
    # 轮询检查每个连接
    for conn in connections:
        try:
            data = conn.recv(1024)
        except BlockingIOError:
            continue
```

**特点**：
- 等待数据阶段不阻塞
- 需要不断轮询询问
- CPU空转消耗资源

### IO多路复用

使用select/poll/epoll同时监控多个IO：

#### select

```python
import select

server = socket.socket()
server.bind(('0.0.0.0', 8000))
server.listen(128)
server.setblocking(False)

inputs = [server]
outputs = []

while inputs:
    readable, writable, exceptional = select.select(inputs, outputs, inputs)
    
    for s in readable:
        if s is server:
            conn, _ = s.accept()
            inputs.append(conn)
        else:
            data = s.recv(1024)
            if data:
                outputs.append(s)
            else:
                s.close()
                inputs.remove(s)
    
    for s in writable:
        s.sendall(b'OK')
        outputs.remove(s)
```

#### poll

```python
import select

poll = select.poll()
poll.register(server, select.POLLIN)
fd_to_sock = {server.fileno(): server}

while True:
    events = poll.poll()
    for fd, event in events:
        sock = fd_to_sock[fd]
        
        if sock is server:
            conn, _ = sock.accept()
            poll.register(conn, select.POLLIN)
            fd_to_sock[conn.fileno()] = conn
        elif event & select.POLLIN:
            data = sock.recv(1024)
            if data:
                poll.modify(sock, select.POLLOUT)
            else:
                poll.unregister(sock)
                sock.close()
```

#### epoll（Linux）

```python
import select

epoll = select.epoll()
epoll.register(server.fileno(), select.EPOLLIN)
fd_to_sock = {server.fileno(): server}

while True:
    events = epoll.poll()
    for fd, event in events:
        sock = fd_to_sock[fd]
        
        if sock is server:
            conn, _ = sock.accept()
            conn.setblocking(False)
            epoll.register(conn.fileno(), select.EPOLLIN)
            fd_to_sock[conn.fileno()] = conn
        elif event & select.EPOLLIN:
            data = sock.recv(1024)
            if data:
                epoll.modify(fd, select.EPOLLOUT)
            else:
                epoll.unregister(fd)
                sock.close()
                del fd_to_sock[fd]
        elif event & select.EPOLLOUT:
            sock.sendall(b'ACK')
            epoll.modify(fd, select.EPOLLIN)
```

### 异步IO

asyncio是Python标准库提供的异步编程框架：

```python
import asyncio

async def handle_client(reader, writer):
    data = await reader.read(1024)
    writer.write(data.upper())
    await writer.drain()
    writer.close()

async def main():
    server = await asyncio.start_server(
        handle_client, '0.0.0.0', 8888
    )
    async with server:
        await server.serve_forever()

asyncio.run(main())
```

### IO模型对比

| 模型 | 等待数据 | 数据拷贝 | 优点 | 缺点 |
|------|----------|----------|------|------|
| **阻塞IO** | 阻塞 | 阻塞 | 简单 | 资源利用率低 |
| **非阻塞IO** | 非阻塞 | 阻塞 | 可并发 | CPU空转 |
| **IO多路复用** | 阻塞（统一） | 阻塞 | 高效 | 复杂度高 |
| **异步IO** | 非阻塞 | 非阻塞 | 最高效 | 复杂度高 |

### 线程池方案

对于阻塞IO，使用线程池可以提高并发能力：

```python
from concurrent.futures import ThreadPoolExecutor

def handle_connection(conn):
    data = conn.recv(1024)
    conn.sendall(data.upper())
    conn.close()

executor = ThreadPoolExecutor(max_workers=100)

while True:
    conn, addr = server.accept()
    executor.submit(handle_connection, conn)
```

## 协程与异步编程

### 生成器与协程

```python
def simple_coroutine():
    while True:
        value = yield
        print(f'收到: {value}')

coro = simple_coroutine()
next(coro)
coro.send(1)
coro.send(2)
```

### async/await

```python
import asyncio

async def fetch_data(url):
    await asyncio.sleep(1)
    return f'数据 from {url}'

async def main():
    tasks = [fetch_data(f'url_{i}') for i in range(10)]
    results = await asyncio.gather(*tasks)
    print(results)

asyncio.run(main())
```

### aiohttp异步HTTP

```python
from aiohttp import web

async def handle(request):
    data = await request.text()
    return web.Response(text=data.upper())

app = web.Application()
app.router.add_post('/echo', handle)

web.run_app(app, host='0.0.0.0', port=8080)
```

## 高性能网络编程

### 连接池

```python
import queue

class ConnectionPool:
    def __init__(self, max_connections=10, **kwargs):
        self.pool = queue.Queue(max_connections)
        for _ in range(max_connections):
            conn = socket.socket(**kwargs)
            self.pool.put(conn)
    
    def get_connection(self, timeout=None):
        return self.pool.get(timeout=timeout)
    
    def return_connection(self, conn):
        self.pool.put(conn)
```

### Nagle算法优化

```python
# 禁用Nagle（小数据高实时场景）
sock.setsockopt(socket.IPPROTO_TCP, socket.TCP_NODELAY, 1)

# 启用Nagle（大数据高吞吐场景）
sock.setsockopt(socket.IPPROTO_TCP, socket.TCP_NODELAY, 0)
```

### 缓冲区优化

```python
# 设置缓冲区大小
sock.setsockopt(socket.SOL_SOCKET, socket.SO_RCVBUF, 1024 * 1024)
sock.setsockopt(socket.SOL_SOCKET, socket.SO_SNDBUF, 1024 * 1024)
```

### 生产者-消费者模式

```python
import threading
import queue

def producer(q, count):
    for i in range(count):
        q.put(i)

def consumer(q):
    while True:
        item = q.get()
        if item is None:
            break
        print(f'处理: {item}')

q = queue.Queue()
threads = []

for _ in range(3):
    t = threading.Thread(target=consumer, args=(q,))
    t.start()
    threads.append(t)

producer(q, 100)

for _ in range(3):
    q.put(None)

for t in threads:
    t.join()
```

## 总结

| 技术 | 适用场景 |
|------|----------|
| **阻塞Socket** | 低并发场景 |
| **非阻塞Socket** | 轮询监控场景 |
| **select/poll** | 中等并发（<1000连接） |
| **epoll** | 高并发（Linux） |
| **asyncio** | 异步高性能 |
| **线程池** | CPU密集型并发 |