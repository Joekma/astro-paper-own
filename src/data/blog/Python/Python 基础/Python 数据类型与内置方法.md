---
title: Python 数据类型与内置方法
author: 程序员
pubDatetime: 2018-09-18T00:00:00.000+08:00
updated: 2026-04-22T00:00:00.000+08:00
slug: python-data-types-built-in-methods
description: '深入理解 Python 的数据类型和字符串、列表、元组、字典、集合的内置方法'
tags:
  - Python
  - 数据类型
  - 字符串
  - 列表
  - 元组
  - 字典
  - 集合
category: Python
draft: false
language: zh-CN
---

> Python 中一切皆为对象，每个对象都有其内置的方法。本文将详细介绍数字、字符串、列表、元组、字典和集合等数据类型的内置方法。

## 数字类型

### 整型 int

**用途**：记录年龄、等级、各种号码

**定义方式**：

```python
age = 18
age = int(18)
x = int('123')  # 只能将纯数字的字符串转换成整型
```

### 浮点型 float

**用途**：记录身高、体重、薪资

**定义方式**：

```python
salary = 1.3
salary = float(1.3)
x = float('3.1')
```

### 类型总结

| 类型 | 存值数量 | 有序性 | 可变性 | 可哈希 |
|------|---------|--------|--------|--------|
| **int** | 一个值 | 无 | 不可变 | 是 |
| **float** | 一个值 | 无 | 不可变 | 是 |
| **str** | 一个值 | 有 | 不可变 | 是 |
| **list** | 多个值 | 有 | 可变 | 否 |
| **tuple** | 多个值 | 有 | 不可变 | 是 |
| **dict** | 多个键值对 | 无 | 可变 | 否 |
| **set** | 多个值 | 无 | 可变 | 是 |

### 进制转换

```python
# 十进制 => 其他进制
print(bin(13))  # 二进制: 0b1101
print(oct(13))  # 八进制: 0o15
print(hex(13))  # 十六进制: 0xd
```

## 字符串类型

**用途**：记录描述性质的特征，如名字、地址、性别

**定义方式**：在单引号、双引号、三引号内包含的一串字符

```python
msg = 'aaa"bbb"'
msg = str('hello')
```

### 常用字符串方法

```python
# strip: 移除字符串头尾指定的字符（默认为空格）
name = "*joker**"
print(name.strip("*"))   # joker
print(name.lstrip("*"))  # 去除左边
print(name.rstrip("*"))  # 去除右边

# len: 获取字符串长度
msg = '你好啊a'
print(len(msg))

# in/not in: 成员运算
msg = 'joekma 老师是一个非常好的老师'
print('joekma' in msg)  # True
print('老师' not in msg)      # False

# replace: 替换
name = "joker is good joker boy!"
print(name.replace('joker', 'li'))       # 所有替换
print(name.replace('joker', 'li', 1))    # 只替换1次

# split: 字符串切分（结果是列表）
name = 'root:x:0:0::/root/:bin/bash'
print(name.split(':'))       # 按冒号分割
print(name.split('/', 1))   # 按斜杠分割1次
print(name.rsplit('|', 1))  # 从右边分割

# join: 拼接
tag = ' '
print(tag.join(['joker', 'li', 'good', 'boy']))  # joker li good boy

# startswith/endswith: 判断开头/结尾
name = "joker_li"
print(name.startswith("joker"))  # True
print(name.endswith("li"))       # True

# find/rfind/index/count
name = 'joker say hi'
print(name.find('s'))   # find: 从左查找，返回索引
print(name.count('k'))  # count: 统计出现次数
print(name.rfind('s'))  # rfind: 从右查找
print(name.index('s'))  # index: 同 find，找不到会报错

# center/ljust/rjust/zfill: 对齐
name = 'joker'
print(name.center(10, '_'))  # 居中对齐
print(name.ljust(10, '*'))   # 左对齐
print(name.rjust(10, '*'))   # 右对齐
print(name.zfill(10))       # 右对齐，用 0 补齐

# lower/upper: 大小写转换
name = 'Joker'
print(name.lower())  # 小写
print(name.upper())  # 大写

# capitalize/swapcase/title: 复杂大小写转换
name = 'joker li'
print(name.capitalize())  # 首字母大写
print(name.swapcase())    # 大小写对调
print(name.title())       # 每个单词首字母大写

# isdigit/isdecimal/isnumeric: 判断数字
num1 = b'4'       # bytes 类型
num2 = u'4'       # unicode 类型
num3 = '四'       # 中文数字
num4 = 'Ⅳ'       # 罗马数字

print(num1.isdigit())   # True
print(num2.isdigit())   # True
print(num3.isdigit())   # False
print(num4.isdigit())   # False
```

### 判断系列方法

```python
name = 'joker123'

print(name.isalnum())     # 字符串由字母和数字组成
print(name.isalpha())    # 字符串只由字母组成
print(name.isdigit())    # 是否是数字
print(name.isidentifier())  # 是否是合法的标识符
print(name.islower())   # 是否全是小写
print(name.isupper())   # 是否全是大写
print(name.isspace())   # 是否是空格
print(name.istitle())   # 每个单词首字母是否大写
```

## 列表类型

**用途**：记录多个值，如人的多个爱好

**定义方式**：在 `[]` 内用逗号分隔开多个任意类型的值

```python
li = [1, 2, 3]
li = list([1, 2, 3])
x = list('hello')
x = list({'a': 1, 'b': 2, 'c': 3})
```

### 列表常用方法

```python
li = ['a', 'b', 'c', 'd', 'e']

# 按索引存取
print(li[-1])   # 倒序取值
li[-1] = 'E'    # 修改值

# 切片: list[start:end:step]
print(li[0:3])   # 顾头不顾尾
print(li[::-1])  # 翻转

# append: 追加
li.append('f')
li.append([1, 2, 3])

# remove/pop: 删除
li.remove('a')           # 按元素值删除
li.pop(1)               # 按索引删除并返回值
del li[0]               # 按索引删除

# extend: 扩展
li.extend([1, 2, 3])   # 把列表里的元素添加进去
li.append([1, 2, 3])    # 把列表本身添加进去

# count/index/insert/reverse/sort
print(li.count('c'))     # 统计元素个数
print(li.index('b'))     # 查找元素索引
li.insert(1, 'x')       # 在索引1处插入
li.reverse()              # 翻转列表
li.sort(reverse=True)      # 排序

# 切片赋值
li = [2, 3, 4]
li[0:1] = [1.1, 2.2]   # 替换
li[1:] = [3.3, 4.4, 5.5]  # 追加
li[:] = [0, 1]          # 清空并替换
```

### 列表练习

```python
# 队列: 先进先出
q = []
q.append('first')
q.append('second')
q.append('third')
print(q.pop(0))   # first
print(q.pop(0))   # second

# 堆栈: 先进后出
q = []
q.append('first')
q.append('second')
q.append('third')
print(q.pop())  # third
print(q.pop())  # second
```

## 元组类型

**用途**：存放多个值，当存放的多个值只有读的需求没有改的需求时用元组最合适

**定义方式**：在 `()` 内用逗号分隔开多个任意类型的值

```python
t = (1, 3.1, 'aaa', (1, 2, 3), ['a', 'b'])
t = tuple('hello')
t = tuple({'x': 1, 'y': 2})
```

### 元组与逗号

```python
# 用逗号建立一个元组
res = 'dsb',      # 实际上是一个元组
res = 'dsb', 'yyh'
print(type(res))  # <class 'tuple'>
```

### 元组常用操作

```python
t = ('a', 'b', 1)

# 按索引取值（只能取）
print(t[0])

# 切片
print(t[1:3])

# 长度
print(len(t))

# 成员运算
print('a' in t)

# 循环
for item in t:
    print(item)
```

## 字典类型

**特性**：

- dict 是无序的
- key 必须是唯一的，不能重复

**定义方式**：在 `{}` 内用逗号分隔开多个 key:value

```python
info = {'stu1102': 'LongZe Luola', 'stu1104': '苍井空'}
```

### 字典常用方法

```python
info = {'stu1102': 'LongZe Luola', 'stu1103': 'XiaoZe Maliya'}

# 增加
info['huahuagongzi'] = 'lengdigaga'

# 修改
info['stu1101'] = "武藤兰"

# 删除
info.pop("stu1101")       # 标准删除姿势
info.popitem()            # 随机删除
del info['stu1103']       # 另一种删除方式

# 查找
print('stu1102' in info)  # 标准用法
print(info.get("stu1102"))  # 获取值
print(info.get("stu1105"))  # 不存在返回 None，不会报错

# keys/values/items
print(info.keys())   # 获取所有键
print(info.values()) # 获取所有值
print(info.items())  # 获取所有键值对

# setdefault: 设置默认值
info.setdefault("stu1106", "Alex")  # key 不存在则设置
info.setdefault("stu1102", "New")   # key 存在则返回原值

# update: 更新
info.update({'stu1107': 'New Student'})

# copy: 浅拷贝
info_copy = info.copy()
```

### 多级字典嵌套

```python
tv_catalog = {
    "欧美": {
        "www.omtv.com": ["没有免费的", "充值会员"],
    },
    "日韩": {
        "www.rhtv.com": ["质量怎样不清楚"],
    },
    "大陆": {
        "1024": ["全部免费", "好人一生平安"],
    }
}

# 访问和修改
print(av_catalog["大陆"]["1024"])
av_catalog["大陆"]["1024"].append("可以用爬虫爬下来")
```

## 集合类型

**特性**：

- 无序
- 元素唯一
- 可以进行交集、并集、差集等运算

**定义方式**：在 `{}` 内用逗号分隔开多个值

```python
s = {1, 2, 3, 4, 5}
s = set([1, 2, 3])
```

### 集合常用方法

```python
s1 = {1, 2, 3}
s2 = {3, 4, 5}

# 交集
print(s1 & s2)
print(s1.intersection(s2))

# 并集
print(s1 | s2)
print(s1.union(s2))

# 差集
print(s1 - s2)
print(s1.difference(s2))

# 对称差集
print(s1 ^ s2)
print(s1.symmetric_difference(s2))

# 添加/删除
s1.add(6)     # 添加
s1.remove(1)  # 删除，不存在会报错
s1.discard(1)  # 删除，不存在不报错
s1.pop()       # 随机删除

# 判断关系
print(s1.issubset(s2))      # s1 是否是 s2 的子集
print(s1.issuperset(s2))    # s1 是否是 s2 的超集
print(s1.isdisjoint(s2))    # s1 和 s2 是否无交集
```

## 小结

### 数据类型对比

| 类型 | 定义 | 有序 | 可变 | 用途 |
|------|------|------|------|------|
| **int/float** | `x = 1` | 否 | 否 | 数值计算 |
| **str** | `x = 'hello'` | 是 | 否 | 文本 |
| **list** | `x = [1, 2]` | 是 | 是 | 序列 |
| **tuple** | `x = (1, 2)` | 是 | 否 | 常量序列 |
| **dict** | `x = {'a': 1}` | 否 | 是 | 映射 |
| **set** | `x = {1, 2}` | 否 | 是 | 去重/集合运算 |

### 选择建议

1. **需要数字计算**：使用 `int`/`float`
2. **需要文本处理**：使用 `str`
3. **需要有序序列**：使用 `list`
4. **需要常量序列**：使用 `tuple`
5. **需要键值映射**：使用 `dict`
6. **需要去重或集合运算**：使用 `set`

掌握这些数据类型的内置方法，可以让你更高效地处理各种数据操作。