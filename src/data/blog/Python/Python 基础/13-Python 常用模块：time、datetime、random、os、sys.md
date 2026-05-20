---
title: Python 常用模块：time、datetime、random、os、sys
author: Joekma
pubDatetime: 2018-08-16T00:00:00.000+08:00
modDatetime: 2026-05-03T00:00:00.000+08:00
slug: python-common-modules-time-random-os-sys
description: '深入讲解Python常用模块：时间处理（time、datetime）、随机数（random）、文件操作（os）和系统操作（sys）的使用方法。'
tags:
  - Python
  - time
  - datetime
  - random
  - os
  - sys
draft: false
series: python
seriesOrder: 13
language: zh-CN
---

> Python 提供了丰富的标准模块来处理时间、随机数、文件和系统操作。本文将详细介绍 time、datetime、random、os、sys 等常用模块的使用方法。

## time 与 datetime 模块

### 时间的三种表示方式

1. **时间戳（timestamp）**：从 1970 年 1 月 1 日开始的秒数
2. **格式化的时间字符串**：按照指定格式输出的日期字符串
3. **结构化的时间（struct_time）**：元组形式 `(年，月，日，时，分，秒，一年中第几周，一年中第几天，夏令时)`

### 三种时间格式的转换

```python
import time

# 时间戳
print(time.time())  # 1487130156.419527

# 格式化的时间字符串
print(time.strftime("%Y-%m-%d %X"))  # 2017-02-15 11:40:53

# 本地时区的 struct_time
print(time.localtime())  # time.struct_time(tm_year=2017, tm_mon=2, ...)

# UTC 时区的 struct_time
print(time.gmtime())  # time.struct_time(tm_year=2017, tm_mon=2, ...)
```

### 时间格式化符号

| 符号 | 说明 |
|------|------|
| `%y` | 两位数年份（00-99） |
| `%Y` | 四位数年份（000-9999） |
| `%m` | 月份（01-12） |
| `%d` | 日期（0-31） |
| `%H` | 24 小时制小时数（0-23） |
| `%I` | 12 小时制小时数（01-12） |
| `%M` | 分钟数（00-59） |
| `%S` | 秒（00-59） |
| `%a` | 本地简化星期名称 |
| `%A` | 本地完整星期名称 |
| `%b` | 本地简化月份名称 |
| `%B` | 本地完整月份名称 |

### 结构化时间转换

```python
import time

# localtime：时间戳转本地 struct_time
print(time.localtime(1539582935.9421027))

# gmtime：时间戳转 UTC struct_time
print(time.gmtime())

# mktime：struct_time 转时间戳
print(time.mktime(time.localtime()))

# strftime：struct_time 转格式化字符串
print(time.strftime("%Y-%m-%d %X", time.localtime()))
# 输出: 2018-10-15 13:57:56

# strptime：格式化字符串转 struct_time
print(time.strptime('2011-05-05 16:37:06', '%Y-%m-%d %X'))
# 输出: time.struct_time(tm_year=2011, tm_mon=5, tm_mday=5, ...)
```

### 其他时间函数

```python
import time

# asctime：转成人可读格式
print(time.asctime())  # Sun Sep 11 00:43:43 2016

# ctime：时间戳转成人可读格式
print(time.ctime())  # Sun Sep 11 00:46:38 2016
print(time.ctime(time.time()))  # 效果相同
```

### datetime 模块

```python
import datetime

# 当前时间
print(datetime.datetime.now())  # 2016-08-19 12:47:03.941925

# 时间戳直接转日期
print(datetime.date.fromtimestamp(time.time()))  # 2016-08-19

# 时间加减
print(datetime.datetime.now() + datetime.timedelta(3))  # 当前时间 + 3 天
print(datetime.datetime.now() + datetime.timedelta(-3))  # 当前时间 - 3 天
print(datetime.datetime.now() + datetime.timedelta(hours=3))  # 当前时间 + 3 小时
print(datetime.datetime.now() + datetime.timedelta(minutes=30))  # 当前时间 + 30 分钟

# 时间替换
c_time = datetime.datetime.now()
print(c_time.replace(minute=3, hour=2))  # 替换指定字段
```

## random 模块

```python
import random

# 0-1 之间的小数
print(random.random())  # 大于 0 且小于 1 之间的小数

# 整数（包含边界）
print(random.randint(1, 3))  # 大于等于 1 且小于等于 3

# 整数（不包含右边界）
print(random.randrange(1, 3))  # 大于等于 1 且小于 3

# 随机选择
print(random.choice([1, '23', [4, 5]]))  # 随机返回一个元素

# 随机组合
print(random.sample([1, '23', [4, 5]], 2))  # 随机返回 2 个元素的组合

# 指定范围的浮点数
print(random.uniform(1, 3))  # 大于 1 小于 3 的小数

# 洗牌
item = [1, 3, 5, 7, 9]
random.shuffle(item)  # 打乱顺序
print(item)
```

## os 模块

`os` 模块是与操作系统交互的接口。

### 目录操作

```python
import os

# 获取当前工作目录
print(os.getcwd())

# 改变当前脚本工作目录
os.chdir("dirname")

# 返回当前目录
print(os.curdir)  # '.'

# 获取当前目录的父目录
print(os.pardir)  # '..'

# 创建目录
os.mkdir('dirname')  # 单级目录
os.makedirs('dir1/dir2')  # 多级递归目录

# 删除目录
os.rmdir('dirname')  # 删除单级空目录
os.removedirs('dir1/dir2')  # 递归删除（如果为空）

# 列出目录内容
print(os.listdir('dirname'))

# 重命名
os.rename("oldname", "newname")

# 删除文件
os.remove("filename")

# 获取文件/目录信息
print(os.stat('path/filename'))
```

### 路径操作

```python
import os

# 返回绝对路径
print(os.path.abspath('file.txt'))

# 分割路径
print(os.path.split('/home/user/file.txt'))  # ('/home/user', 'file.txt')

# 获取目录
print(os.path.dirname('/home/user/file.txt'))  # /home/user

# 获取文件名
print(os.path.basename('/home/user/file.txt'))  # file.txt

# 判断路径
print(os.path.exists('file.txt'))  # 是否存在
print(os.path.isabs('file.txt'))  # 是否是绝对路径
print(os.path.isfile('file.txt'))  # 是否是文件
print(os.path.isdir('file.txt'))  # 是否是目录

# 组合路径
print(os.path.join('/home', 'user', 'file.txt'))  # /home/user/file.txt

# 获取文件时间戳
print(os.path.getatime('file.txt'))  # 最后访问时间
print(os.path.getmtime('file.txt'))  # 最后修改时间
print(os.path.getsize('file.txt'))  # 文件大小
```

### 系统相关

```python
import os

# 路径分隔符
print(os.sep)  # Windows: '\\', Linux: '/'

# 行终止符
print(os.linesep)  # Windows: '\r\n', Linux: '\n'

# 路径分隔符字符串
print(os.pathsep)  # Windows: ';', Linux: ':'

# 操作系统名称
print(os.name)  # Windows: 'nt', Linux: 'posix'

# 运行 shell 命令
os.system("bash command")

# 获取系统环境变量
print(os.environ)

# 路径规范化
print(os.path.normpath('c://windows\\System32\\../Temp\\'))
# 输出: c:\windows\Temp
```

### 路径处理（推荐方式）

```python
import os
import sys

# 推荐方式：向上查找多级目录
possible_topdir = os.path.normpath(os.path.join(
    os.path.abspath(__file__),
    os.pardir,  # 上一级
    os.pardir,
    os.pardir
))
sys.path.insert(0, possible_topdir)
```

## sys 模块

`sys` 模块提供对 Python 解释器相关变量的访问。

### 常用函数

```python
import sys

# 命令行参数
print(sys.argv)  # [程序本身路径, 参数1, 参数2, ...]

# 导入的模块列表
print(sys.modules.keys())

# 退出程序
sys.exit(0)  # 正常退出

# Python 版本
print(sys.version)  # 版本信息
print(sys.version_info)  # 版本信息（元组）
print(sys.hexversion)  # 十六进制格式版本

# 平台
print(sys.platform)  # 操作系统平台名称

# 路径
print(sys.path)  # 模块搜索路径
sys.path.append("my_path")  # 添加搜索路径

# 标准流
sys.stdout  # 标准输出
sys.stdin   # 标准输入
sys.stderr  # 错误输出

# 最大值
print(sys.maxint)  # 最大 int 值（Python 2）
print(sys.maxunicode)  # 最大 unicode 值
```

### sys.modules

```python
import sys

# 查看所有已导入的模块
print(sys.modules.keys())

# 长度
print(len(sys.modules.keys()))
```

### 打印进度条

```python
import sys
import time

def progress(percent, width=50):
    if percent >= 1:
        percent = 1
    show_str = ('[%%-%ds]' % width) % (int(width * percent) * '#')
    print('\r%s %d%%' % (show_str, int(100 * percent)), file=sys.stdout, flush=True, end='')

# 应用示例
data_size = 102500
recv_size = 0
while recv_size < data_size:
    time.sleep(0.1)  # 模拟传输延迟
    recv_size += 1024  # 每次收 1024
    percent = recv_size / data_size
    progress(percent, width=70)
```

## print 函数参数详解

```python
# print 函数完整签名
print(value, ..., sep=' ', end='\n', file=sys.stdout, flush=False)

# 参数说明
# sep: 多个输出值之间的分隔符，默认为空格
# end: 输出语句结束后的字符串，默认为换行
# file: 输出目标，默认为 sys.stdout
# flush: 是否立即输出
```

### 实际示例

```python
# 默认
print("hello", "world")  # hello world

# 修改分隔符
print("hello", "world", sep=",")  # hello,world

# 不换行
print("hello", end="")
print("world")  # helloworld

# 输出到文件
test = open("test.txt", "w")
print("hello", "world", sep="\n", file=test)

# flush 参数
print("loading...", end="", flush=True)
```

## functools 模块

`functools` 为高阶函数提供支持。

### partial 函数（偏函数）

```python
import functools

def show_parameter(*args, **kw):
    print(args)
    print(kw)

# 创建偏函数（部分参数固定）
p1 = functools.partial(show_parameter, 1, 2, 3)
p1()  # (1, 2, 3), {}
p1(4, 5, 6)  # (1, 2, 3, 4, 5, 6), {}

p2 = functools.partial(show_parameter, a=3, b='linux')
p2()  # (), {'a': 3, 'b': 'linux'}
```

## 小结

| 模块 | 用途 |
|------|------|
| **time** | 时间处理和时间戳转换 |
| **datetime** | 日期时间的创建和运算 |
| **random** | 生成随机数和随机选择 |
| **os** | 操作系统交互和文件操作 |
| **sys** | Python 解释器相关操作 |
| **functools** | 高阶函数和偏函数 |

掌握这些模块的使用，可以帮助你更好地处理时间、文件和系统相关的操作。