---
title: 并发编程之asyncio模块：事件循环、任务调度与异步IO
series: python
seriesOrder: 43
language: zh-CN
author: Joekma
pubDatetime: 2026-07-01T00:00:00.000+08:00
slug: python-asyncio-module-guide
modDatetime: 2026-07-01T00:00:00.000+08:00
featured: false
draft: false
tags:
  - Python
  - 并发编程
  - 异步编程
  - asyncio
  - 协程
description: "系统讲解Python asyncio模块，涵盖事件循环、协程、Task、TaskGroup、超时取消、同步原语、队列、异步网络和阻塞代码处理。"
---

# 并发编程之asyncio模块：事件循环、任务调度与异步IO

## 引言

前面几篇文章已经分别讲过多进程、多线程、Greenlet、Gevent 和网络 IO 模型。

如果把它们放到同一张图里，可以这样理解：

| 技术            | 调度者            | 适合场景                | 典型特点                                     |
| --------------- | ----------------- | ----------------------- | -------------------------------------------- |
| 多进程          | 操作系统          | CPU 密集、进程隔离      | 可用多核，进程间通信成本较高                 |
| 多线程          | 操作系统          | 阻塞 IO、共享内存任务   | 共享进程资源，但要处理锁和竞态               |
| Greenlet/Gevent | 应用程序/猴子补丁 | 大量网络 IO             | 通过协作切换提升单线程并发能力               |
| asyncio         | Python 事件循环   | 高并发 IO、异步网络服务 | 基于 `async/await`，显式写出让出执行权的位置 |

`asyncio` 的目标不是让 Python 的 CPU 计算自动变快，而是让一个线程在大量 IO 等待之间高效切换：一个任务等待网络、磁盘、定时器或子进程结果时，事件循环可以去运行其他任务。

一句话记住：

> `asyncio` 适合高并发 IO 和结构化网络代码；CPU 密集任务仍然优先考虑多进程，或者交给会释放 GIL 的扩展库。

## asyncio 解决的核心问题

同步代码里，一个请求没返回，当前线程就停在原地：

```python
import time


def download(name: str, delay: float) -> str:
    time.sleep(delay)
    return f"{name} done"


def main():
    print(download("a", 2))
    print(download("b", 1))
    print(download("c", 1))


main()
```

这段代码总耗时约 4 秒。这里的 `time.sleep()` 可以替换成真实网络请求、数据库查询、文件读写或远程 API 调用，本质都是：程序在等待外部资源。

`asyncio` 的思路是：当任务遇到可以等待的地方，用 `await` 主动把控制权交还给事件循环。

```python
import asyncio


async def download(name: str, delay: float) -> str:
    await asyncio.sleep(delay)
    return f"{name} done"


async def main():
    results = await asyncio.gather(
        download("a", 2),
        download("b", 1),
        download("c", 1),
    )
    print(results)


asyncio.run(main())
```

这段代码总耗时约 2 秒，因为三个协程被并发调度了。注意这里的并发不是三条 Python 字节码同时运行，而是在单个线程中遇到 `await` 时协作切换。

## 核心模型

### 协程函数与协程对象

用 `async def` 定义的是协程函数，调用它得到的是协程对象。

```python
async def hello():
    return "hello asyncio"


coro = hello()
print(coro)  # <coroutine object hello at ...>
```

只调用协程函数不会执行它。协程对象必须被 `await`、放进 `Task`，或者交给 `asyncio.run()` 才会真正运行。

```python
import asyncio


async def hello():
    return "hello asyncio"


async def main():
    result = await hello()
    print(result)


asyncio.run(main())
```

### 事件循环

事件循环可以理解为 asyncio 程序的调度中心。它负责：

- 运行已经就绪的协程任务。
- 监听 socket、管道、子进程等 IO 事件。
- 管理定时器，例如 `asyncio.sleep()`。
- 在任务等待 Future 完成时切换到其他任务。

应用层代码通常不需要手动创建和关闭事件循环。现代写法是把入口函数写成 `async main()`，再用 `asyncio.run(main())` 启动。

```python
import asyncio


async def main():
    loop = asyncio.get_running_loop()
    print(loop)


asyncio.run(main())
```

`asyncio.run()` 会创建事件循环、运行传入的 awaitable、清理异步生成器和默认 executor，并在结束后关闭事件循环。它应该作为 asyncio 程序的顶层入口使用，通常一个程序只调用一次。

### Task

协程对象本身只是“可以运行的异步计算”。如果想让它被事件循环并发调度，需要包装成 `Task`。

```python
import asyncio


async def worker(name: str, delay: float):
    await asyncio.sleep(delay)
    print(f"{name} finished")
    return name


async def main():
    task = asyncio.create_task(worker("task-1", 1))
    print("task created")

    result = await task
    print("result:", result)


asyncio.run(main())
```

`asyncio.create_task()` 会把协程加入当前正在运行的事件循环，并返回一个 `Task` 对象。这个对象可以被等待、取消、命名，也可以查询结果或异常。

后台任务要保存引用。事件循环只保存任务的弱引用，如果创建任务后完全不保存，任务可能在执行中被垃圾回收。可靠的 fire-and-forget 写法通常会把任务放到集合里，并在完成后自动移除。

```python
import asyncio

background_tasks: set[asyncio.Task] = set()


async def send_metric(i: int):
    await asyncio.sleep(0.1)
    print(f"metric {i} sent")


def start_background_task(i: int):
    task = asyncio.create_task(send_metric(i))
    background_tasks.add(task)
    task.add_done_callback(background_tasks.discard)
```

### Future

`Future` 表示“未来会完成的结果”。在业务代码中很少需要自己创建 Future，但很多底层 API、协议层代码和 `run_in_executor()` 会返回 Future。

可以简单理解：

- 协程是可暂停的函数。
- Task 是被事件循环调度的协程。
- Future 是异步结果的占位符。

## 基础语法

### async 和 await

`async def` 定义协程函数，`await` 等待一个 awaitable 对象完成。

```python
import asyncio


async def step(name: str, delay: float):
    print(f"{name}: start")
    await asyncio.sleep(delay)
    print(f"{name}: end")
    return name


async def main():
    result = await step("A", 1)
    print(result)


asyncio.run(main())
```

`await` 不是简单的“阻塞等待”。当协程执行到 `await asyncio.sleep(1)` 时，当前任务暂停，事件循环可以去运行其他就绪任务。

### 串行与并发

串行写法：

```python
import asyncio
import time


async def query(name: str, delay: float):
    await asyncio.sleep(delay)
    return f"{name}: {delay}s"


async def main():
    start = time.perf_counter()

    a = await query("a", 1)
    b = await query("b", 1)
    c = await query("c", 1)

    print(a, b, c)
    print(f"cost: {time.perf_counter() - start:.2f}s")


asyncio.run(main())
```

耗时约 3 秒。

并发写法：

```python
import asyncio
import time


async def query(name: str, delay: float):
    await asyncio.sleep(delay)
    return f"{name}: {delay}s"


async def main():
    start = time.perf_counter()

    results = await asyncio.gather(
        query("a", 1),
        query("b", 1),
        query("c", 1),
    )

    print(results)
    print(f"cost: {time.perf_counter() - start:.2f}s")


asyncio.run(main())
```

耗时约 1 秒。区别不在 `async def`，而在是否把多个 awaitable 同时交给事件循环。

## 任务调度

### create_task：显式启动任务

当你希望一个协程立刻开始运行，并在后面某个时刻等待结果，可以使用 `create_task()`。

```python
import asyncio
import time


async def say_after(delay: float, text: str):
    await asyncio.sleep(delay)
    print(text)


async def main():
    print(f"started at {time.strftime('%X')}")

    task1 = asyncio.create_task(say_after(1, "hello"))
    task2 = asyncio.create_task(say_after(2, "world"))

    await task1
    await task2

    print(f"finished at {time.strftime('%X')}")


asyncio.run(main())
```

`task1` 和 `task2` 创建后就会被调度，而不是等到 `await task1` 时才开始。

### gather：等待一组任务

`asyncio.gather()` 最适合“同时发起一批任务，并按输入顺序拿到结果”的场景。

```python
import asyncio


async def fetch_user(user_id: int):
    await asyncio.sleep(0.2)
    return {"id": user_id, "name": f"user-{user_id}"}


async def main():
    users = await asyncio.gather(
        fetch_user(1),
        fetch_user(2),
        fetch_user(3),
    )
    print(users)


asyncio.run(main())
```

`gather()` 返回结果列表，顺序与传入 awaitable 的顺序一致，而不是按完成时间排序。

如果其中一个任务抛出异常，默认会把异常传播给等待 `gather()` 的地方。`return_exceptions=True` 会把异常对象也放进结果列表，这适合“批量任务尽量都跑完，再统一统计成功失败”的场景。

```python
import asyncio


async def job(i: int):
    await asyncio.sleep(0.1)
    if i == 2:
        raise ValueError("bad job")
    return i * 10


async def main():
    results = await asyncio.gather(
        job(1),
        job(2),
        job(3),
        return_exceptions=True,
    )

    for result in results:
        if isinstance(result, Exception):
            print("failed:", repr(result))
        else:
            print("ok:", result)


asyncio.run(main())
```

不要为了省事到处使用 `return_exceptions=True`，否则异常很容易被吞掉。它应该用于明确需要“部分成功”的批处理。

### as_completed：谁先完成先处理谁

如果希望任务完成一个就处理一个，而不是等待全部完成再拿列表，可以使用 `asyncio.as_completed()`。

```python
import asyncio
import random


async def fetch(name: str):
    delay = random.uniform(0.1, 1.0)
    await asyncio.sleep(delay)
    return name, delay


async def main():
    tasks = [
        asyncio.create_task(fetch("a")),
        asyncio.create_task(fetch("b")),
        asyncio.create_task(fetch("c")),
    ]

    for done in asyncio.as_completed(tasks):
        name, delay = await done
        print(f"{name} finished in {delay:.2f}s")


asyncio.run(main())
```

这种写法适合下载、批量 RPC、并发检查等场景：结果先回来就先落库、先展示、先进入下一步。

### TaskGroup：结构化并发

Python 3.11 引入了 `asyncio.TaskGroup`。它把一组相关任务放进同一个作用域里，退出 `async with` 时会等待所有任务完成。如果其中一个任务失败，同组任务会被取消，异常会以异常组的形式向外传播。

```python
import asyncio


async def load_profile(user_id: int):
    await asyncio.sleep(0.2)
    return {"user_id": user_id}


async def load_orders(user_id: int):
    await asyncio.sleep(0.3)
    return ["order-1", "order-2"]


async def main():
    async with asyncio.TaskGroup() as tg:
        profile_task = tg.create_task(load_profile(1))
        orders_task = tg.create_task(load_orders(1))

    profile = profile_task.result()
    orders = orders_task.result()
    print(profile, orders)


asyncio.run(main())
```

和散落的 `create_task()` 相比，`TaskGroup` 更适合“这些任务属于同一个业务操作，要一起成功或一起失败”的场景。

## 超时、取消与异常

### wait_for：给单个 awaitable 加超时

`asyncio.wait_for()` 会等待一个 awaitable 完成，如果超过指定时间，会取消该 awaitable 并抛出 `TimeoutError`。

```python
import asyncio


async def slow_query():
    await asyncio.sleep(3)
    return "data"


async def main():
    try:
        result = await asyncio.wait_for(slow_query(), timeout=1)
        print(result)
    except TimeoutError:
        print("query timeout")


asyncio.run(main())
```

### asyncio.timeout：给一段异步代码加超时

Python 3.11 起可以使用 `asyncio.timeout()`。它是异步上下文管理器，更适合包住一段结构化代码。

```python
import asyncio


async def call_api():
    await asyncio.sleep(0.8)
    return "api"


async def call_db():
    await asyncio.sleep(0.8)
    return "db"


async def main():
    try:
        async with asyncio.timeout(1):
            api_result = await call_api()
            db_result = await call_db()
            print(api_result, db_result)
    except TimeoutError:
        print("whole operation timeout")


asyncio.run(main())
```

这里的超时覆盖整个 `async with` 块，而不是单独覆盖某一个 awaitable。

### 取消任务

取消是 asyncio 中非常重要的控制流。调用 `task.cancel()` 后，任务会在下一次有机会运行时抛出 `asyncio.CancelledError`。

```python
import asyncio


async def worker():
    try:
        while True:
            print("working...")
            await asyncio.sleep(1)
    except asyncio.CancelledError:
        print("cleanup before cancel")
        raise


async def main():
    task = asyncio.create_task(worker())
    await asyncio.sleep(2.5)

    task.cancel()

    try:
        await task
    except asyncio.CancelledError:
        print("task cancelled")


asyncio.run(main())
```

如果捕获 `CancelledError` 做清理，清理完成后通常要重新 `raise`。`TaskGroup`、`asyncio.timeout()` 等结构化并发能力内部也依赖取消机制。如果随意吞掉取消异常，程序可能出现无法退出、超时失效或任务泄漏。

## 并发控制

并发不是越大越好。网络对端、数据库连接池、本机文件句柄、CPU 和内存都有上限。asyncio 提供了几类常用同步原语。

### Semaphore：限制同时执行数量

比如有 1000 个 URL，但最多同时请求 20 个。

```python
import asyncio
import random


async def fetch(url: str, sem: asyncio.Semaphore):
    async with sem:
        delay = random.uniform(0.1, 0.5)
        await asyncio.sleep(delay)
        print(f"fetched {url} in {delay:.2f}s")
        return url


async def main():
    sem = asyncio.Semaphore(20)
    urls = [f"https://example.com/{i}" for i in range(100)]

    results = await asyncio.gather(*(fetch(url, sem) for url in urls))
    print(f"total: {len(results)}")


asyncio.run(main())
```

`async with sem` 会自动 acquire/release，比手写 `try/finally` 更不容易漏释放。

### Lock：保护共享状态

asyncio 是单线程协作式调度，但只要在读写共享状态之间存在 `await`，就可能产生竞态。

```python
import asyncio


class Counter:
    def __init__(self):
        self.value = 0
        self.lock = asyncio.Lock()

    async def incr(self):
        async with self.lock:
            current = self.value
            await asyncio.sleep(0)
            self.value = current + 1


async def main():
    counter = Counter()
    await asyncio.gather(*(counter.incr() for _ in range(1000)))
    print(counter.value)


asyncio.run(main())
```

`await asyncio.sleep(0)` 常用于主动让出控制权。在真实业务里，它可能是数据库、缓存、HTTP 请求等 await 点。

### Event：通知多个任务

`asyncio.Event` 适合一个任务发布信号，多个任务等待信号。

```python
import asyncio


async def worker(name: str, ready: asyncio.Event):
    print(f"{name} waiting")
    await ready.wait()
    print(f"{name} start")


async def main():
    ready = asyncio.Event()

    tasks = [
        asyncio.create_task(worker("a", ready)),
        asyncio.create_task(worker("b", ready)),
    ]

    await asyncio.sleep(1)
    ready.set()

    await asyncio.gather(*tasks)


asyncio.run(main())
```

### Queue：生产者消费者

`asyncio.Queue` 是异步任务之间传递数据的常用工具。它天然适合爬虫、日志处理、消息消费、批量任务流水线。

```python
import asyncio
import random


async def producer(queue: asyncio.Queue[str]):
    for i in range(10):
        item = f"url-{i}"
        await queue.put(item)
        print("produce", item)
        await asyncio.sleep(0.1)

    for _ in range(3):
        await queue.put("STOP")


async def consumer(name: str, queue: asyncio.Queue[str]):
    while True:
        item = await queue.get()
        try:
            if item == "STOP":
                return

            await asyncio.sleep(random.uniform(0.1, 0.5))
            print(f"{name} handled {item}")
        finally:
            queue.task_done()


async def main():
    queue: asyncio.Queue[str] = asyncio.Queue(maxsize=5)

    consumers = [
        asyncio.create_task(consumer("worker-1", queue)),
        asyncio.create_task(consumer("worker-2", queue)),
        asyncio.create_task(consumer("worker-3", queue)),
    ]

    await producer(queue)
    await queue.join()
    await asyncio.gather(*consumers)


asyncio.run(main())
```

`maxsize` 可以提供背压：消费者处理不过来时，生产者会在 `await queue.put()` 处等待，避免无限堆积内存。

## 阻塞代码处理

### 不要在协程里直接调用阻塞函数

下面这段代码看似是 asyncio，但 `time.sleep()` 会阻塞整个事件循环：

```python
import asyncio
import time


async def bad():
    time.sleep(2)
    return "done"


async def ticker():
    for i in range(5):
        print("tick", i)
        await asyncio.sleep(0.5)


async def main():
    await asyncio.gather(bad(), ticker())


asyncio.run(main())
```

`ticker()` 本来应该每 0.5 秒输出一次，但事件循环会先被 `time.sleep(2)` 卡住。

### to_thread：把阻塞 IO 放到线程里

如果必须调用同步阻塞函数，可以用 `asyncio.to_thread()` 放到线程里执行。

```python
import asyncio
import time


def blocking_io(name: str):
    time.sleep(2)
    return f"{name} done"


async def ticker():
    for i in range(5):
        print("tick", i)
        await asyncio.sleep(0.5)


async def main():
    result, _ = await asyncio.gather(
        asyncio.to_thread(blocking_io, "file-read"),
        ticker(),
    )
    print(result)


asyncio.run(main())
```

`to_thread()` 主要用于阻塞 IO。由于 CPython 有 GIL，普通 Python CPU 密集计算放到线程里通常不能获得真正并行，CPU 密集任务更适合 `multiprocessing` 或 `ProcessPoolExecutor`。

### run_in_executor：自定义执行器

如果需要复用线程池或进程池，可以使用事件循环的 `run_in_executor()`。

```python
import asyncio
import concurrent.futures
import hashlib


def cpu_heavy(data: bytes) -> str:
    for _ in range(200_000):
        data = hashlib.sha256(data).digest()
    return data.hex()


async def main():
    loop = asyncio.get_running_loop()

    with concurrent.futures.ProcessPoolExecutor() as pool:
        result = await loop.run_in_executor(pool, cpu_heavy, b"hello")
        print(result[:20])


asyncio.run(main())
```

这个例子把 CPU 密集计算放进进程池，asyncio 只负责等待执行结果，不负责让计算本身变快。

## 异步网络实战

### TCP Echo Server

asyncio 标准库内置了 streams API，可以快速编写 TCP 服务。

```python
import asyncio


async def handle_client(reader: asyncio.StreamReader, writer: asyncio.StreamWriter):
    addr = writer.get_extra_info("peername")
    print(f"client connected: {addr}")

    try:
        while data := await reader.readline():
            message = data.decode().rstrip()
            print(f"received: {message}")

            writer.write(f"echo: {message}\n".encode())
            await writer.drain()
    finally:
        writer.close()
        await writer.wait_closed()
        print(f"client closed: {addr}")


async def main():
    server = await asyncio.start_server(handle_client, "127.0.0.1", 8888)

    addrs = ", ".join(str(sock.getsockname()) for sock in server.sockets)
    print(f"serving on {addrs}")

    async with server:
        await server.serve_forever()


asyncio.run(main())
```

可以用 `telnet 127.0.0.1 8888` 或 `nc 127.0.0.1 8888` 测试。

### TCP Client

```python
import asyncio


async def main():
    reader, writer = await asyncio.open_connection("127.0.0.1", 8888)

    writer.write(b"hello asyncio\n")
    await writer.drain()

    data = await reader.readline()
    print(data.decode().rstrip())

    writer.close()
    await writer.wait_closed()


asyncio.run(main())
```

`writer.write()` 只是把数据写入缓冲区，`await writer.drain()` 才会在缓冲区压力较大时等待底层发送。

### 简化版并发下载任务池

标准库没有高级异步 HTTP 客户端。实际项目中常见选择是 `aiohttp`、`httpx` 等第三方库。这里为了突出 asyncio 调度模型，用 `asyncio.sleep()` 模拟网络耗时，用任务池控制并发。

```python
import asyncio
import random


async def download(url: str) -> str:
    delay = random.uniform(0.2, 1.0)
    await asyncio.sleep(delay)

    if random.random() < 0.2:
        raise RuntimeError(f"download failed: {url}")

    return f"{url} body, cost={delay:.2f}s"


async def worker(name: str, queue: asyncio.Queue[str], results: list[str]):
    while True:
        url = await queue.get()
        try:
            if url == "STOP":
                return

            try:
                body = await asyncio.wait_for(download(url), timeout=1.5)
            except Exception as exc:
                print(f"{name} failed {url}: {exc!r}")
            else:
                results.append(body)
                print(f"{name} ok {url}")
        finally:
            queue.task_done()


async def main():
    urls = [f"https://example.com/page/{i}" for i in range(30)]
    queue: asyncio.Queue[str] = asyncio.Queue(maxsize=10)
    results: list[str] = []

    workers = [
        asyncio.create_task(worker(f"worker-{i}", queue, results))
        for i in range(5)
    ]

    for url in urls:
        await queue.put(url)

    for _ in workers:
        await queue.put("STOP")

    await queue.join()
    await asyncio.gather(*workers)

    print(f"success: {len(results)}")


asyncio.run(main())
```

这个例子把几个重要实践放在一起：

- `Queue(maxsize=10)` 限制待处理任务堆积。
- 5 个 worker 限制并发数量。
- `wait_for()` 给单个下载加超时。
- 单个 URL 失败不会影响整个批次。
- `queue.task_done()` 放在 `finally` 中，保证 `queue.join()` 不会永久等待。

## 常见误区

### 误区一：忘记 await

```python
async def get_data():
    return {"ok": True}


async def main():
    data = get_data()  # 错误：这里只是协程对象
    print(data)
```

正确写法：

```python
async def main():
    data = await get_data()
    print(data)
```

如果忘记 await，通常会看到 `RuntimeWarning: coroutine was never awaited`。

### 误区二：在协程里调用 time.sleep

```python
async def bad():
    time.sleep(1)  # 阻塞整个事件循环
```

正确写法：

```python
async def good():
    await asyncio.sleep(1)
```

如果必须调用同步阻塞函数，用 `await asyncio.to_thread(func, *args)`。

### 误区三：无边界创建任务

```python
tasks = [asyncio.create_task(fetch(url)) for url in million_urls]
await asyncio.gather(*tasks)
```

这会瞬间创建大量任务，带来内存压力、连接压力和对端限流。更好的写法是用 `Semaphore` 或 `Queue` 控制并发。

### 误区四：在已有事件循环里调用 asyncio.run

`asyncio.run()` 不能在同一线程已有事件循环运行时调用。比如在某些 Web 框架、Jupyter、异步测试框架内部，通常应该直接 `await`，或者使用框架提供的生命周期入口。

```python
async def handler():
    # 错误：当前线程可能已经有事件循环
    asyncio.run(do_something())
```

正确思路：

```python
async def handler():
    await do_something()
```

### 误区五：吞掉取消异常

```python
async def bad_worker():
    try:
        await asyncio.sleep(10)
    except asyncio.CancelledError:
        print("cancelled but ignored")
```

通常应该清理后重新抛出：

```python
async def good_worker():
    try:
        await asyncio.sleep(10)
    except asyncio.CancelledError:
        print("cleanup")
        raise
```

取消不是普通错误，它是 asyncio 的协作退出机制。

### 误区六：以为 asyncio 会自动使用多核

asyncio 的默认模型是单线程事件循环。它能提高 IO 并发吞吐，但不会让普通 Python CPU 计算自动跑满多核。

```python
async def cpu_task():
    total = 0
    for i in range(100_000_000):
        total += i
    return total
```

这种任务即使写成 `async def`，只要内部没有 `await`，就会一直占用事件循环。CPU 密集型任务应该考虑：

- `multiprocessing`
- `concurrent.futures.ProcessPoolExecutor`
- C 扩展、NumPy 等会释放 GIL 的计算库
- 任务队列或独立计算服务

## 调试建议

### 开启 debug 模式

开发阶段可以开启 asyncio debug 模式，帮助发现慢回调、未等待协程等问题。

```python
import asyncio


async def main():
    await asyncio.sleep(0.1)


asyncio.run(main(), debug=True)
```

也可以通过环境变量开启：

```bash
PYTHONASYNCIODEBUG=1 python app.py
```

### 给任务命名

任务多了之后，名字很重要。

```python
import asyncio


async def worker(user_id: int):
    await asyncio.sleep(1)
    return user_id


async def main():
    task = asyncio.create_task(worker(1001), name="load-user-1001")
    print(task.get_name())
    await task


asyncio.run(main())
```

日志、错误栈、任务排查都会更清楚。

### 打印当前任务

```python
import asyncio


async def main():
    current = asyncio.current_task()
    print(current)

    tasks = asyncio.all_tasks()
    print(f"task count: {len(tasks)}")


asyncio.run(main())
```

这类 API 适合调试和监控，不建议在业务逻辑中过度依赖。

## 实战选择建议

| 场景                       | 推荐方式                                   |
| -------------------------- | ------------------------------------------ |
| 批量 HTTP/RPC 请求         | `asyncio.gather()` + `Semaphore`           |
| 谁先返回先处理谁           | `asyncio.as_completed()`                   |
| 一组任务必须一起成功或失败 | `asyncio.TaskGroup`                        |
| 后台轻量任务               | `create_task()` + 保存引用 + done callback |
| 生产者消费者流水线         | `asyncio.Queue`                            |
| 单个操作超时               | `asyncio.wait_for()`                       |
| 一段异步流程超时           | `asyncio.timeout()`                        |
| 调用同步阻塞 IO            | `asyncio.to_thread()`                      |
| CPU 密集计算               | 多进程或进程池                             |
| TCP 服务                   | `asyncio.start_server()`                   |

## 与线程、进程的关系

asyncio、线程、进程不是互斥关系，而是不同层次的工具：

- asyncio 管理高并发 IO，让少量线程处理大量连接。
- 线程适合包住同步阻塞 IO，或者与旧库兼容。
- 进程适合 CPU 密集计算和强隔离任务。

一个真实服务里常常会组合使用：

```text
主进程
  ├── asyncio 事件循环处理网络连接
  ├── ThreadPoolExecutor 包装少量同步 IO SDK
  └── ProcessPoolExecutor 处理 CPU 密集任务
```

关键是不要把所有问题都塞进 asyncio。它擅长等待，不擅长计算。

## 总结

`asyncio` 的核心是协作式调度：

1. `async def` 定义协程函数，调用后得到协程对象。
2. `await` 表示等待一个 awaitable，并把控制权交还给事件循环。
3. `asyncio.run()` 是现代 asyncio 程序的顶层入口。
4. `create_task()` 可以让协程并发运行，但要保存任务引用。
5. `gather()` 适合批量等待，`as_completed()` 适合完成一个处理一个。
6. `TaskGroup` 适合结构化并发，让相关任务在同一作用域内管理。
7. 超时和取消是正常控制流，不能随便吞掉 `CancelledError`。
8. `Semaphore`、`Lock`、`Event`、`Queue` 是控制并发和组织任务流水线的基础工具。
9. 阻塞 IO 用 `to_thread()` 或 executor 隔离，CPU 密集任务优先用多进程。
10. asyncio 最适合高并发 IO，不是让 Python CPU 计算自动变快。

学会 asyncio 后，再看 FastAPI、aiohttp、httpx、asyncpg、Playwright、爬虫并发、异步任务调度等框架，就会发现它们背后的基本模型都是：事件循环调度任务，任务在 await 点主动让出执行权。

## 参考资料

- [asyncio 官方文档](https://docs.python.org/3/library/asyncio.html)
- [Runners：asyncio.run 与 Runner](https://docs.python.org/3/library/asyncio-runner.html)
- [Coroutines and Tasks](https://docs.python.org/3/library/asyncio-task.html)
- [Synchronization Primitives](https://docs.python.org/3/library/asyncio-sync.html)
- [Queues](https://docs.python.org/3/library/asyncio-queue.html)
- [Streams](https://docs.python.org/3/library/asyncio-stream.html)
