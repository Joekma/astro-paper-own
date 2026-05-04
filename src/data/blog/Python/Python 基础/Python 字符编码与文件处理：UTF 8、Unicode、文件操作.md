---
title: Python 字符编码与文件处理：UTF 8、Unicode、文件操作
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-05-03T00:00:00.000+08:00
slug: python-character-encoding-file-handling
description: '深入讲解Python的字符编码原理（ASCII、GBK、Unicode、UTF-8）和文件操作（r、w、a、b模式），详解编码与解码的三个阶段和文件指针操作。'
tags:
  - Python
  - 字符编码
  - 文件操作
  - UTF-8
  - Unicode
draft: false
language: zh-CN
---

> 字符编码和文件处理是 Python 编程中的重要基础。本文将详细介绍字符编码的发展历程、编码与解码的原理，以及 Python 中的文件操作方法。

## 字符编码

### 前提摘要

运行 Python 程序的三个步骤：

1. 先启动 Python 解释器
2. 再将 Python 文件当作普通的文本文件读入内存
3. 解释执行读入内存的代码，开始识别语法

### 重点理论

#### 1. 编码与解码

```
字符 ---编码--> Unicode 的二进制 ---编码--> GBK 的二进制
GBK 的二进制 ---解码--> Unicode 的二进制 ---解码--> 字符
```

#### 2. 解决乱码问题的核心法则

> **字符用什么编码格式编码的，就应该用什么编码格式进行解码**

#### 3. Python 解释器默认的字符编码

- **Python 2**：ASCII
- **Python 3**：UTF-8

可以通过文件头修改 Python 解释器默认使用的字符编码：

```python
# -*- coding: 文件当初存的时候用的字符编码 -*-
```

针对 Python 2 解释器中定义字符串应该加 `u` 前缀：

```python
# Python 2
x = u"上"  # 对于 Python 3 即便是 x = "上" 不加 u 前缀也是存成 unicode
```

在 Python 3 中：

```python
x = '上'  # '上' 存成了 unicode

# unicode 转 gbk
res = x.encode('gbk')  # res 是 gbk 格式的二进制，称之为 bytes 类型

# gbk 转 unicode
y = res.decode('gbk')  # y 就是 unicode
```

#### 4. 关于字符编码的操作

1. 编写 Python 文件，首行应该加文件头：`# coding: 文件存时用的编码`
2. 用 Python 2 写程序，定义字符串应该加前缀 `u`，如 `x = u'上'`
3. Python 3 中的字符串都是 unicode 编码的，Python 3 的字符串 encode 之后可以得到 bytes 类型

### 字符编码的发展历程

#### ASCII 码

ASCII（American Standard Code for Information Interchange，美国标准信息交换代码）是基于拉丁字母的一套电脑编码系统，主要用于显示现代英语和其他西欧语言。

- ASCII 码最多只能用 8 位来表示（一个字节）
- 即：2^8 = 256，所以 ASCII 码最多只能表示 255 个符号

#### GB 系列编码

为了处理汉字，程序员设计了用于简体中文的 GB2312 和用于繁体中文的 Big5。

**GB2312（1980年）**：
- 一共收录了 7445 个字符，包括 6763 个汉字和 682 个其它符号
- 汉字区的内码范围高字节从 B0-F7，低字节从 A1-FE

**GBK（1995年）**：
- GBK1.0 收录了 21886 个符号
- 包括 21003 个字符

**GB18030（2000年）**：
- 取代 GBK1.0 的正式国家标准
- 收录了 27484 个汉字
- 同时收录了藏文、蒙文、维吾尔文等主要的少数民族文字

> **注意**：从 ASCII、GB2312、GBK 到 GB18030，这些编码方法是向下兼容的，即同一个字符在这些方案中总是有相同的编码。

#### Unicode（统一码）

ASCII 码无法将世界上的各种文字和符号全部表示，所以需要新出一种可以代表所有字符和符号的编码，即 Unicode。

**Unicode 的特点**：
- 为每种语言中的每个字符设定了统一并且唯一的二进制编码
- 规定所有的字符和符号最少由 16 位来表示（2 个字节）
- 即：2^16 = 65536

#### UTF-8

UTF-8 是对 Unicode 编码的压缩和优化：

- ASCII 码中的内容：用 1 个字节保存
- 欧洲的字符：用 2 个字节保存
- 东亚的字符：用 3 个字节保存
- 更复杂的字符：用 4 个字节保存

### 编码与解码的三个阶段

**第一阶段**：打开 Python 解释器、编辑器加载到内存

**第二阶段**：
- 写一个文件：`内存 --encode--> bytes（二进制）`
- 显示文件：`硬盘 --decode--> unicode（万国码）`

**第三阶段**：执行阶段

- 数据是最先产生于内存中，是 unicode 格式
- 要想传输需要转成 bytes 格式：`unicode --encode(utf-8)--> bytes`
- 拿到 bytes，就可以往文件内存放或者基于网络传输：`bytes --decode(gbk)--> unicode`

> Python 解释器在加载 `.py` 文件中的代码时，会对内容进行编码（默认 ASCII）

### 内存与编码的关系

1. **以什么编码存的就要以什么编码取出**
2. 内存固定使用 Unicode 编码，我们可以控制的编码是往硬盘存放或者基于网络传输时选择编码
3. 数据是最先产生于内存中，是 Unicode 格式，要想传输需要转成 bytes 格式

## 文件操作

### 什么是文件

文件是操作系统提供给用户/应用程序的一种虚拟单位，该虚拟单位直接映射的是硬盘空间。

### 为何要处理文件

用户/应用程序直接操作文件（读/写）就被操作系统转换成具体的硬盘操作，从而实现：
- 用户/应用程序将内存中的数据永久保存到硬盘中

### 如何用文件

文件处理的三个步骤：

```python
# 打开文件
f = open(r'c.txt', mode='r', encoding='utf-8')

# 读写文件
data = f.read()

# 关闭文件
f.close()
```

> **注意**：
> - 在同一个文件目录下，文件路径可以填相对路径（文件名）
> - 文件路径前面的 `r` 是将文件路径中可能被转义的字符转换成原生字符串

### 操作文件内容的模式

控制操作文件内容格式的两种模式：`t`（默认的）和 `b`

> **大前提**：t、b 模式均不能单独使用，必须与纯净模式结合使用

#### t 文本模式

1. 读写文件都是以字符串为单位的
2. 只能针对文本文件
3. 必须指定 encoding 参数

#### b 二进制模式

1. 读写文件都是以 bytes/二进制为单位的
2. 可以针对所有文件
3. 一定不能指定 encoding 参数

### 文件操作模式详解

#### r 模式：只读模式

- 文件不存在时报错
- 文件存在时文件指针跳到文件的开头

```python
# 文本模式读取
with open(r'c.txt', mode='rt', encoding='utf-8') as f:
    print(f.read())
    print(f.readable())
    print(f.writable())

# 二进制模式读取
with open(r'c.txt', mode='rb') as f:
    data = f.read()
    print(data, type(data))
    res = data.decode('utf-8')
    print(res)
```

#### w 模式：只写模式

1. 文件不存在时，新建一个空文档
2. 文件存在时，清空文件内容，文件指针跑到文件的开头

```python
with open('c.txt', mode='wt', encoding='utf-8') as f:
    print(f.readable())  # False
    print(f.writable())  # True
    f.write('哈哈哈\n')
    f.write('你愁啥\n')
    f.write('瞅你咋地\n')

# 批量写入
info = ['egon:123\n', 'alex:456\n', 'lxx:lxx123\n']
for line in info:
    f.write(line)
f.writelines(info)

# 二进制写入
with open('c.txt', mode='wb') as f:
    f.write('哈哈哈\n'.encode('utf-8'))
    f.write('你愁啥\n'.encode('utf-8'))
    f.write('瞅你咋地\n'.encode('utf-8'))
```

#### a 模式：只追加写模式

1. 文件不存在时，新建一个空文档，文件指针跑到文件的末尾
2. 文件存在时，文件指针跑到文件的末尾

```python
with open('c.txt', mode='at', encoding='utf-8') as f:
    print(f.readable())  # False
    print(f.writable())  # True
    f.write('虎老师:123\n')

# 在文件打开不关闭的情况下，连续的写入，下一次写入一定是基于上一次写入指针的位置而继续的
```

#### 上下文管理

```python
with open(r'c.txt', mode='r', encoding='utf-8') as f, \
     open(r'b.txt', mode='r', encoding='utf-8') as f1:
    pass
```

#### 循环读文件内容

```python
with open(r'c.txt', mode='rt', encoding='utf-8') as f:
    for line in f:
        print(line, end='')
```

## 文本操作中的指针问题

### 基本概念

> **大前提**：文件内指针的移动是以 Bytes 为单位的，唯独 t 模式下 read 读取内容个数是以字符为单位

### f.read() 方法

- 无参数：读全部
- 有 `b`：按字节
- 无 `b`：按字符

```python
with open('a.txt', mode='rt', encoding='utf-8') as f:
    data = f.read(3)  # 读取3个字符
    print(data)

with open('a.txt', mode='rb') as f:
    data = f.read(3)  # 读取3个字节
    print(data.decode('utf-8'))
```

### f.seek() 方法

`f.seek(指针移动的字节数, 模式控制)`

| 模式 | 说明 | 适用场景 |
|------|------|---------|
| **0** | 默认模式，代表指针移动的字节数是以文件开头为参照 | t 或 b 模式 |
| **1** | 代表指针移动的字节数是以当前所在的位置为参照 | 只能用于 b 模式 |
| **2** | 代表指针移动的字节数是以文件末尾的位置为参照 | 只能用于 b 模式 |

### f.tell() 方法

查看文件指针当前距离文件开头的位置（以字节为单位）。

### 各模式详解

#### 0 模式详解

```python
with open('a.txt', mode='rt', encoding='utf-8') as f:
    f.seek(4, 0)  # 从文件开头跳到第4个字节
    print(f.tell())
    print(f.read())

with open('a.txt', mode='rb') as f:
    f.seek(4, 0)
    f.seek(2, 0)  # 相对于当前位置再跳2个字节
    print(f.tell())
    print(f.read().decode('utf-8'))

with open('a.txt', mode='rt', encoding='utf-8') as f:
    f.seek(5, 0)
    print(f.read())
```

#### 1 模式详解

```python
with open('a.txt', mode='rb') as f:
    f.seek(3, 1)  # 相对于当前位置跳3个字节
    print(f.tell())
    f.seek(4, 1)  # 相对于当前位置再跳4个字节
    print(f.tell())
    print(f.read().decode('utf-8'))
```

#### 2 模式详解

```python
with open('a.txt', mode='rb') as f:
    f.seek(-9, 2)  # 相对于文件末尾跳9个字节
    data = f.read()
    print(data.decode('utf-8'))

# tail -f access.log
with open('access.log', mode='rb') as f:
    f.seek(0, 2)
    while True:
        line = f.readline()
        if len(line) == 0:
            continue
        else:
            print(line.decode('utf-8'), end='')
```

## 文件修改

### 须知一

> **硬盘空间无法修改**，硬盘中的数据更新都是用新的内容覆盖旧的内容

### 须知二

文件对应的是硬盘空间，硬盘不能修改应为文件本质也不能修改。我们看到文件的内容可以修改，是如何实现的呢？

大的思路是：将硬盘中文件内容读入内存，然后在内存中修改完毕后再覆盖回硬盘。

具体的实现方式分为两种：

#### 方式一：一次性读入内存

将文件内容一次性全部读入内存，然后在内存中修改完毕后再覆盖写回原文件。

**优点**：在文件修改过程中同一份数据只有一份
**缺点**：会过多地占用内存

```python
with open('db.txt', mode='rt', encoding='utf-8') as f:
    data = f.read()

with open('db.txt', mode='wt', encoding='utf-8') as f:
    f.write(data.replace('kevin', 'SB'))
```

#### 方式二：临时文件方式

以读的方式打开原文件，以写的方式打开一个临时文件，一行行读取原文件内容，修改完后写入临时文件...，删掉原文件，将临时文件重命名原文件名。

**优点**：不会占用过多的内存
**缺点**：在文件修改过程中同一份数据存了两份

```python
import os

with open('db.txt', mode='rt', encoding='utf-8') as read_f, \
       open('.db.txt.swap', mode='wt', encoding='utf-8') as write_f:
    for line in read_f:
        write_f.write(line.replace('SB', 'kevin'))

os.remove('db.txt')
os.rename('.db.txt.swap', 'db.txt')
```

## 常用文件操作大全

| 方法 | 说明 |
|------|------|
| `f.read()` | 无参数，读全部；有 b 按字节，无 b 按字符 |
| `f.tell()` | 获取当前指针位置（字节） |
| `f.seek()` | 跳转到哪个位置（字节） |
| `f.write()` | 写数据；有 b 就是写字节，无 b 就是字符 |
| `f.close()` | 关闭文件 |
| `f.flush()` | 强刷到硬盘（之前是存在缓冲区，等待 close 时才会刷到硬盘） |
| `f.fileno()` | 文件描述符，用于后面的 socket |
| `f.readable()` | 判断是否可读，跟模式有关 |
| `f.seekable()` | 判断是否可以移动指针 |
| `f.writable()` | 判断是否可写 |
| `f.readline()` | 读取一行，指针换行 |
| `f.readlines()` | 全部读取存为列表 |
| `f.truncate()` | 截断数据，将指针后面的清空 |
| `for line in f` | for 循环文件对象，一行一行读取 |

### 文件打开模式总结

| 模式 | 说明 |
|------|------|
| `r` | 只读，文件不存在报错 |
| `w` | 只写，文件不存在创建，存在清空 |
| `a` | 追加，文件不存在创建，存在追加 |
| `rb` | 二进制读取 |
| `wb` | 二进制写入 |
| `ab` | 二进制追加 |
| `r+` | 可读写，可读、可写、可追加 |
| `w+` | 写读，先清空后写 |
| `a+` | 同 a，但可以读 |
| `x` | 文件存在报错，不存在创建写内容 |

> **注意**：Windows 里面的换行符实际是 `\r\n`

## 小结

### 字符编码

1. **ASCII**：只能表示英文字母，1 个字节
2. **GBK**：支持中文，2 个字节
3. **Unicode**：统一编码，2-4 个字节
4. **UTF-8**：Unicode 的优化实现，1-4 个字节可变长度

### 编码与解码

- **编码**：`unicode --encode--> bytes`
- **解码**：`bytes --decode--> unicode`

### 文件操作

1. **三步走**：打开 → 读写 → 关闭
2. **两种模式**：`t` 文本模式、`b` 二进制模式
3. **三种基本模式**：`r` 读、`w` 写、`a` 追加
4. **文件指针**：`seek()` 跳转、`tell()` 查看当前位置

掌握这些字符编码和文件操作的知识，可以帮助你更好地处理文本数据和文件持久化。
