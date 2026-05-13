---
title: "C# 并发与多线程编程"
author: Joekma
pubDatetime: 2026-05-13T00:00:00.000+08:00
modDatetime: 2026-05-13T00:00:00.000+08:00
slug: csharp-concurrency
description: "深入学习 C# 多线程编程，包括 Thread、lock、同步基元、async/await 进阶、并发集合以及并行编程的最佳实践。"
tags:
  - C#
  - 多线程
  - Thread
  - lock
  - 同步
  - 并发
  - 并行编程
  - lock
draft: false
series: csharp
language: zh-CN
---

## 概述

现代应用程序需要同时处理多个任务，C# 提供了丰富的多线程和并发编程支持。从基础的 `Thread` 类到高级的 `Task` 并行库，本教程将帮助你全面掌握 C# 的并发编程能力。

## 线程基础

### 创建和启动线程

```csharp
using System;
using System.Threading;

// 创建线程（方式1：使用 ThreadStart 委托）
Thread thread1 = new Thread(() =>
{
    Console.WriteLine("线程1开始执行");
    Thread.Sleep(1000);  // 模拟工作
    Console.WriteLine("线程1完成");
});
thread1.Start();  // 启动线程

// 创建线程（方式2：使用 ParameterizedThreadStart）
Thread thread2 = new Thread(new ParameterizedThreadStart(WorkerMethod));
thread2.Start("参数数据");

// 带参数的线程方法
void WorkerMethod(object? data)
{
    Console.WriteLine($"线程收到参数: {data}");
    Thread.Sleep(500);
}

// 等待线程完成
thread1.Join();
Console.WriteLine("主线程继续执行");
```

### 前台线程与后台线程

```csharp
// 前台线程：阻止应用程序退出
Thread foregroundThread = new Thread(() =>
{
    Thread.Sleep(3000);
    Console.WriteLine("前台线程完成");
});
foregroundThread.IsBackground = false;  // 默认就是前台
foregroundThread.Start();

// 后台线程：不阻止应用程序退出
Thread backgroundThread = new Thread(() =>
{
    Thread.Sleep(3000);
    Console.WriteLine("后台线程完成（可能不输出）");
});
backgroundThread.IsBackground = true;
backgroundThread.Start();

// 主线程结束，前台线程阻止退出，后台线程可能被中断
Console.WriteLine("主线程结束");
```

### 线程优先级

```csharp
Thread normalThread = new Thread(() => { /* ... */ });
Thread highThread = new Thread(() => { /* ... */ });

normalThread.Priority = ThreadPriority.Normal;
highThread.Priority = ThreadPriority.Highest;  // 更高概率获得CPU时间
```

## 同步基础

### lock 语句

`lock` 是最常用的线程同步方式，确保同一时刻只有一个线程访问共享资源：

```csharp
public class Counter
{
    private int _count = 0;
    private readonly object _lock = new object();  // 锁对象

    public void Increment()
    {
        lock (_lock)  // 进入临界区
        {
            _count++;  // 同一时刻只有一个线程能执行这里
        }  // 退出临界区，自动释放锁
    }

    public int GetCount()
    {
        lock (_lock)
        {
            return _count;
        }
    }

    // 线程安全的属性
    public int Count
    {
        get { lock (_lock) { return _count; } }
    }
}
```

### lock 的注意事项

```csharp
public class BadExample
{
    private string _name = "";

    public void UpdateName()
    {
        // ❌ 错误：锁定类型实例本身可能导致死锁
        lock (this)
        {
            _name = "新名称";
        }
    }

    // ✅ 正确做法：使用私有锁对象
    private readonly object _nameLock = new object();
    
    public void UpdateNameCorrect()
    {
        lock (_nameLock)
        {
            _name = "新名称";
        }
    }
}

// ✅ 锁定 readonly 字段
public class SafeClass
{
    private readonly object _syncRoot = new object();
    private int _value;
    
    public void SafeIncrement()
    {
        lock (_syncRoot)
        {
            _value++;
        }
    }
}
```

### Monitor 类

`Monitor` 提供了比 `lock` 更精细的控制：

```csharp
private object _lock = new object();

public void CriticalSection()
{
    // 尝试获取锁，超时则返回
    if (Monitor.TryEnter(_lock, TimeSpan.FromMilliseconds(100)))
    {
        try
        {
            // 临界区代码
        }
        finally
        {
            Monitor.Exit(_lock);  // 必须在 finally 中释放
        }
    }
    else
    {
        Console.WriteLine("获取锁超时");
    }
}

// 等待和信号（类似 wait/notify）
public void WaitExample()
{
    lock (_lock)
    {
        while (!condition)  // 注意：必须用 while，不是 if
        {
            Monitor.Wait(_lock);  // 释放锁并等待信号
        }
        // 处理业务
    }
}

public void SignalExample()
{
    lock (_lock)
    {
        condition = true;
        Monitor.Pulse(_lock);  // 通知一个等待线程
        // 或 Monitor.PulseAll(_lock); 通知所有等待线程
    }
}
```

## 同步基元

### SemaphoreSlim - 限制并发数

```csharp
// 限制同时最多3个线程访问
private static SemaphoreSlim _semaphore = new SemaphoreSlim(3);

public async Task ProcessAsync(int id)
{
    await _semaphore.WaitAsync();  // 获取信号量
    try
    {
        Console.WriteLine($"任务 {id} 开始");
        await Task.Delay(1000);  // 模拟工作
        Console.WriteLine($"任务 {id} 完成");
    }
    finally
    {
        _semaphore.Release();  // 释放信号量
    }
}

// 使用示例
public async Task RunAll()
{
    var tasks = Enumerable.Range(1, 10).Select(i => ProcessAsync(i));
    await Task.WhenAll(tasks);
}
```

### ManualResetEventSlim - 手动重置事件

```csharp
// 初始化为未信号状态
private static ManualResetEventSlim _event = new ManualResetEventSlim(false);

public void Worker()
{
    Console.WriteLine("等待信号...");
    _event.Wait();  // 阻塞直到收到信号
    Console.WriteLine("收到信号，继续执行");
}

public void Signal()
{
    _event.Set();  // 发送信号（保持信号状态）
    // _event.Reset();  // 手动重置为未信号状态
}

// AutoResetEvent：自动重置
private static AutoResetEvent _autoEvent = new AutoResetEvent(false);

public void AutoWorker()
{
    _autoEvent.WaitOne();  // 收到信号后自动重置
    Console.WriteLine("处理事件");
}
```

### ReaderWriterLockSlim - 读写锁

```csharp
private static ReaderWriterLockSlim _rwLock = new ReaderWriterLockSlim();
private static List<string> _items = new List<string>();

// 读操作：多个线程可以同时读
public string? Read(int index)
{
    _rwLock.EnterReadLock();
    try
    {
        return index < _items.Count ? _items[index] : null;
    }
    finally
    {
        _rwLock.ExitReadLock();
    }
}

// 写操作：独占访问
public void Add(string item)
{
    _rwLock.EnterWriteLock();
    try
    {
        _items.Add(item);
    }
    finally
    {
        _rwLock.ExitWriteLock();
    }
}

// 升级锁（从读到写）
public void UpdateIfExists(int index, string newValue)
{
    _rwLock.EnterUpgradeableReadLock();  // 进入可升级读模式
    try
    {
        if (index < _items.Count)
        {
            // 升级为写锁
            _rwLock.EnterWriteLock();
            try
            {
                _items[index] = newValue;
            }
            finally
            {
                _rwLock.ExitWriteLock();
            }
        }
    }
    finally
    {
        _rwLock.ExitUpgradeableReadLock();
    }
}
```

### Interlocked - 原子操作

```csharp
private static int _counter = 0;

// 原子递增
Interlocked.Increment(ref _counter);

// 原子递减
Interlocked.Decrement(ref _counter);

// 原子加法
Interlocked.Add(ref _counter, 10);

// 原子读取
int value = Interlocked.Read(ref _counter);

// 原子交换
int original = Interlocked.Exchange(ref _counter, 100);

// 原子比较交换（CAS）
int oldValue = 0;
int newValue = 42;
int replaced = Interlocked.CompareExchange(ref _counter, newValue, oldValue);
// 如果 _counter == oldValue，则设为 newValue，返回原值
// 如果不等，返回当前值，不修改
```

## 并发集合

`System.Collections.Concurrent` 命名空间提供了线程安全的集合：

```csharp
using System.Collections.Concurrent;

// 线程安全的字典
private static ConcurrentDictionary<string, int> _cache = new();

public void UseCache()
{
    // 添加或更新
    _cache["key1"] = 1;
    
    // 安全的获取
    if (_cache.TryGetValue("key1", out int value))
    {
        Console.WriteLine($"获取到值: {value}");
    }
    
    // 添加（仅当不存在）
    _cache.TryAdd("key2", 2);
    
    // 安全地添加或更新
    _cache.AddOrUpdate("key1", 1, (key, old) => old + 1);
    
    // 安全地获取或添加
    int result = _cache.GetOrAdd("key3", 3);
}

// 线程安全的队列
private static ConcurrentQueue<string> _queue = new();

public void UseQueue()
{
    _queue.Enqueue("item1");
    _queue.Enqueue("item2");
    
    if (_queue.TryDequeue(out string? item))
    {
        Console.WriteLine($"出队: {item}");
    }
}

// 线程安全的栈
private static ConcurrentStack<int> _stack = new();

public void UseStack()
{
    _stack.Push(1);
    _stack.Push(2);
    
    if (_stack.TryPop(out int item))
    {
        Console.WriteLine($"弹出: {item}");
    }
}

// 线程安全的包（无序）
private static ConcurrentBag<string> _bag = new();

public void UseBag()
{
    _bag.Add("a");
    _bag.Add("b");
    
    if (_bag.TryTake(out string? item))
    {
        Console.WriteLine($"取出: {item}");
    }
}

// 生产者-消费者集合
private static Channel<int> _channel = Channel.CreateBounded<int>(100);

// 生产者
public async Task ProduceAsync()
{
    for (int i = 0; i < 10; i++)
    {
        await _channel.Writer.WriteAsync(i);
        await Task.Delay(100);
    }
    _channel.Writer.Complete();  // 标记完成
}

// 消费者
public async Task ConsumeAsync()
{
    await foreach (int item in _channel.Reader.ReadAllAsync())
    {
        Console.WriteLine($"消费: {item}");
    }
}
```

## 线程本地存储

### ThreadLocal\<T\> - 线程局部变量

```csharp
private static ThreadLocal<int> _threadLocal = new ThreadLocal<int>(() => 
{
    // 初始化函数，每个线程调用一次
    return Environment.CurrentManagedThreadId;
});

public void ThreadLocalExample()
{
    Thread thread1 = new Thread(() =>
    {
        _threadLocal.Value = 100;
        Console.WriteLine($"线程1: {_threadLocal.Value}");
    });
    
    Thread thread2 = new Thread(() =>
    {
        _threadLocal.Value = 200;
        Console.WriteLine($"线程2: {_threadLocal.Value}");
    });
    
    thread1.Start();
    thread2.Start();
    
    // 主线程
    Console.WriteLine($"主线程: {_threadLocal.Value}");
}
```

## async/await 进阶

### 异步锁

```csharp
private static SemaphoreSlim _asyncLock = new SemaphoreSlim(1, 1);

public async Task ProcessAsync(string name)
{
    await _asyncLock.WaitAsync();  // 异步等待锁
    try
    {
        Console.WriteLine($"{name} 获取锁");
        await Task.Delay(1000);  // 模拟异步操作
        Console.WriteLine($"{name} 释放锁");
    }
    finally
    {
        _asyncLock.Release();
    }
}
```

### 并行执行多个异步任务

```csharp
public async Task ParallelExamples()
{
    // 并行执行（等待所有任务完成）
    var task1 = HttpGetAsync("https://api1.example.com");
    var task2 = HttpGetAsync("https://api2.example.com");
    var task3 = HttpGetAsync("https://api3.example.com");
    
    string[] results = await Task.WhenAll(task1, task2, task3);
    
    // 等待第一个完成（竞态）
    var firstTask = await Task.WhenAny(task1, task2, task3);
    Console.WriteLine($"第一个完成: {await firstTask}");
    
    // 延迟取消
    using var cts = new CancellationTokenSource();
    cts.CancelAfter(TimeSpan.FromSeconds(5));
    
    try
    {
        await LongRunningTaskAsync(cts.Token);
    }
    catch (OperationCanceledException)
    {
        Console.WriteLine("任务超时被取消");
    }
}

private async Task<string> HttpGetAsync(string url) 
{
    using var client = new HttpClient();
    return await client.GetStringAsync(url);
}

private async Task LongRunningTaskAsync(CancellationToken token)
{
    for (int i = 0; i < 100; i++)
    {
        token.ThrowIfCancellationRequested();
        await Task.Delay(100, token);
    }
}
```

### 异步流

```csharp
public async IAsyncEnumerable<int> GenerateNumbersAsync(
    int count, 
    [EnumeratorCancellation] CancellationToken token = default)
{
    for (int i = 0; i < count; i++)
    {
        token.ThrowIfCancellationRequested();
        await Task.Delay(100, token);
        yield return i;
    }
}

// 使用
public async Task ConsumeAsync()
{
    await foreach (int number in GenerateNumbersAsync(10))
    {
        Console.WriteLine(number);
    }
}
```

## 线程安全的单例模式

```csharp
public sealed class ThreadSafeSingleton
{
    private static readonly Lazy<ThreadSafeSingleton> _lazy = 
        new Lazy<ThreadSafeSingleton>(() => new ThreadSafeSingleton());

    // 私有构造函数
    private ThreadSafeSingleton()
    {
        Console.WriteLine("单例实例被创建");
    }

    public static ThreadSafeSingleton Instance => _lazy.Value;

    public void DoSomething()
    {
        Console.WriteLine("执行操作");
    }
}

// 使用
var instance = ThreadSafeSingleton.Instance;
```

## 最佳实践

### 应该做的 ✅

```csharp
// 1. 使用 async/await 代替阻塞
public async Task DoWorkAsync()
{
    var data = await File.ReadAllTextAsync("file.txt");
    await Task.Run(() => Process(data));
}

// 2. 优先使用并发集合
var cache = new ConcurrentDictionary<string, int>();

// 3. 使用 CancellationToken 取消任务
using var cts = new CancellationTokenSource();
await Task.WhenAll(tasks.Select(t => DoWorkAsync(cts.Token)));

// 4. 捕获异步异常
try
{
    await RiskyOperationAsync();
}
catch (Exception ex)
{
    Console.WriteLine($"错误: {ex.Message}");
}
```

### 避免的 ❌

```csharp
// 1. 避免使用 Thread.Abort
// Thread.Abort();  // 不要这样做！

// 2. 避免长时间持有锁
// lock (syncRoot)
// {
//     await Task.Delay(1000);  // 不要在锁内 await！
// }

// 3. 避免在 lock 内调用未知代码
// 可能导致死锁

// 4. 避免过度使用线程
// 线程创建有开销，优先使用 Task
```

## 总结

| 同步基元 | 用途 | 适用场景 |
|---------|------|----------|
| `lock` | 互斥 | 保护共享资源 |
| `Monitor` | 互斥+等待 | 需要 wait/pulse |
| `Mutex` | 互斥 | 跨进程同步 |
| `SemaphoreSlim` | 计数信号 | 限制并发数 |
| `ReaderWriterLockSlim` | 读写锁 | 读多写少场景 |
| `AutoResetEvent` | 自动重置 | 一次性信号 |
| `ManualResetEventSlim` | 手动重置 | 需要手动控制 |
| `Interlocked` | 原子操作 | 简单计数器 |

## 相关资源

- [托管线程处理基本知识](https://learn.microsoft.com/zh-cn/dotnet/standard/threading/managed-threading-basics)
- [同步基元概述](https://learn.microsoft.com/zh-cn/dotnet/standard/threading/overview-of-synchronization-primitives)
- [线程安全集合](https://learn.microsoft.com/zh-cn/dotnet/standard/collections/thread-safe/)
- [并行编程](https://learn.microsoft.com/zh-cn/dotnet/standard/parallel-programming/)