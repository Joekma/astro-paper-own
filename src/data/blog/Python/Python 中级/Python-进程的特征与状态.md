---
title: Python 进程的特征与状态
author: Joekma
pubDatetime: 2018-09-15T00:00:00Z
modDatetime: 2026-04-22T00:00:00Z
featured: false
draft: false
tags:
  - Python
  - 进程管理
description: '深入讲解Python进程的特征与状态，涵盖进程特征、进程调度算法、进程控制块（PCB）等核心概念。'
---

# Python 进程的特征与状态   

## 进程的基本特征

进程（Process）是程序的一次执行实例，是操作系统分配资源的基本单位。

### 进程特征

1. **动态性**：进程是动态创建的，有生命周期
2. **并发性**：多个进程可同时运行
3. **独立性**：每个进程有独立地址空间
4. **异步性**：进程按各自速度推进
5. **结构性**：包含程序、数据、进程控制块（PCB）

### 进程与程序的区别

| 特征 | 程序 | 进程 |
|------|------|------|
| 存在形态 | 静态 | 动态 |
| 生命周期 | 长期存在 | 有创建和消亡 |
| 资源占用 | 不占用系统资源 | 占用系统资源 |
| 结构 | 代码和数据 | PCB + 代码 + 数据 |

## 进程状态

### 基本状态

```
                  创建态
                     ↓
就绪态 ←→ 运行态 →→ 阻塞态
  ↑         ↓         ↑
  └─────────┴─────────┘
              ↓
           终止态
```

### 详细状态

```python
# 进程状态示意
states = {
    'new': '创建态',           # 进程正在创建
    'ready': '就绪态',        # 等待CPU分配
    'running': '运行态',      # 正在执行
    'waiting': '阻塞态',      # 等待I/O
    'terminated': '终止态'    # 执行完成
}
```

## 进程控制块（PCB）

PCB是操作系统管理进程的数据结构：

```c
struct PCB {
    int pid;              // 进程ID
    int parent_pid;        // 父进程ID
    char state;           // 进程状态
    int priority;         // 进程优先级
    struct registers regs; // 寄存器值
    struct mm_struct *mm;  // 内存管理信息
    struct files_struct *files;  // 文件描述符
};
```

## 进程调度

### 调度算法

```python
# 先来先服务（FCFS）
def fcfs_scheduling(processes):
    """按到达顺序执行"""
    processes.sort(key=lambda p: p['arrival_time'])
    return processes

# 短作业优先（SJF）
def sjf_scheduling(processes):
    """按执行时间排序"""
    processes.sort(key=lambda p: p['burst_time'])
    return processes

# 时间片轮转
def round_robin(processes, time_slice=4):
    """每个进程执行一个时间片"""
    queue = processes.copy()
    results = []
    while queue:
        current = queue.pop(0)
        execute_time = min(time_slice, current['burst_time'])
        current['burst_time'] -= execute_time
        if current['burst_time'] > 0:
            queue.append(current)
        results.append((current['name'], execute_time))
    return results
```

## 进程间通信（IPC）

```python
# 1. 管道（Pipe）
import subprocess
pipe = subprocess.PIPE

# 2. 消息队列（Queue）
from multiprocessing import Queue
queue = Queue()
queue.put("消息")
message = queue.get()

# 3. 共享内存
from multiprocessing import Array
shared = Array('i', [1, 2, 3])

# 4. 信号量（Semaphore）
from multiprocessing import Semaphore
sem = Semaphore(1)

# 5. 套接字（Socket）
import socket
sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
```

## Python中的进程

```python
from multiprocessing import Process, Queue

def worker(q):
    q.put("Hello from child")

if __name__ == '__main__':
    q = Queue()
    p = Process(target=worker, args=(q,))
    p.start()
    print(q.get())  # 输出: Hello from child
    p.join()
```

## 进程状态监控

```python
import psutil
import os

# 获取当前进程信息
process = psutil.Process(os.getpid())
print(f"PID: {process.pid}")
print(f"名称: {process.name()}")
print(f"CPU使用率: {process.cpu_percent(interval=1)}%")
print(f"内存使用: {process.memory_info().rss} bytes")

# 获取所有进程
for proc in psutil.process_iter(['pid', 'name', 'status']):
    print(proc.info)
```

## 进程池

```python
from multiprocessing import Pool

def worker(x):
    return x * x

if __name__ == '__main__':
    with Pool(4) as pool:
        results = pool.map(worker, [1, 2, 3, 4, 5])
        print(results)  # [1, 4, 9, 16, 25]
```

理解进程的特征和状态是操作系统学习的基础。