---
title: Python 流程控制：if、while、for、break、continue
author: Joekma
pubDatetime: 2018-08-13T00:00:00.000+08:00
modDatetime: 2026-05-03T00:00:00.000+08:00
slug: python-control-flow-if-while-for
description: '深入理解Python的流程控制语句：条件判断if、循环while和for、break和continue控制关键字，包含大量实战示例。'
tags:
  - Python
  - 流程控制
  - if语句
  - while循环
  - for循环
  - break
  - continue
draft: false
language: zh-CN
---

> 流程控制是编程的基础，让计算机能够像人一样具有判断和重复执行的能力。本文将详细介绍 Python 中的条件判断和循环语句。

## if 语句

### 什么是 if 语句

- **是什么**：判断一个条件如果成立则做...，不成立则做....
- **为什么**：让计算机能够像人一样具有判断的能力

### 如何使用 if 语句

#### 语法 1：单分支

```python
if 条件1:
    code1
    code2
    code3
```

**示例**：

```python
age = 18
if age != 18:
    print('你好啊小伙子')
    print('加个微信吧...')
    print('other code...')
```

#### 语法 2：双分支

```python
if 条件:
    code1
    code2
    code3
else:
    code1
    code2
```

**示例**：

```python
age = 18
sex = 'male'
wuzhong = 'human'
is_beautiful = True

if age > 16 and age < 22 and sex == 'female' and \
    wuzhong == 'human' and is_beautiful:
    print('开始表白...')
else:
    print('阿姨好，我逗你玩呢...')
```

#### 语法 3：多分支（多个 if）

```python
if 条件1:
    code1
    code2
if 条件2:
    code2
    code3
```

**示例**：

```python
a = 88
if a >= 90:
    print("优秀")
if a == 88:
    print("正好88")
if a >= 80:
    print("良好")
else:
    print("都不合格")
```

#### 语法 4：多分支（if-elif-else）

```python
if 条件1:
    子代码块1
elif 条件2:
    子代码块2
elif 条件3:
    子代码块3
elif 条件4:
    子代码块4
else:
    子代码块5
```

**示例**：

```python
a = 88
if a >= 90:
    print("优秀")
elif a == 88:
    print("正好88")
elif a >= 80:
    print("良好")
else:
    print("都不合格")
```

### if 和 elif 的区别

如果想让程序遍历到判断条件就不再执行其他判断条件分支语句，那么就用 `elif`；

如果程序中判断事件很多，全部用 `if` 的话，不管你想判断的条件有没有遍历到，它都会继续执行完所有的 `if`；用 `elif` 程序运行时，只要 `if` 或后续某一个 `elif` 之一满足逻辑值为 `True`，则程序执行完对应输出语句后面所有的 `elif` 和 `else` 就不会再被执行，会提高效率。

## while 循环

### 什么是循环

循环指的是一个重复做某件事的过程。

### 为什么要有循环

为了让计算机能够像人一样重复做某件事。

### 如何使用 while 循环

`while` 循环又称为条件循环，循环的次数取决于条件。

```python
while 条件:
    子代码1
    子代码2
    子代码3
```

**示例**：

```python
print('start....')
while True:
    name = input('please your name>>: ')
    pwd = input('please your password>>: ')
    if name == 'Mark' and pwd == '123':
        print('login successful')
    else:
        print('user or password err')
print('end...')
```

### 如何结束 while 循环

#### 方式一：操作条件

```python
print('start....')
tag = True
while tag:
    name = input('please your name>>: ')
    pwd = input('please your password>>: ')
    if name == 'Mark' and pwd == '123':
        print('login successful')
        tag = False
    else:
        print('user or password err')

print('end...')
```

#### 方式二：break 终止循环

`break` 用于强行终止本层循环。

```python
count = 1
while True:
    if count > 5:
        break
    print(count)
    count += 1
```

**示例**：

```python
print('start....')
while True:
    name = input('please your name>>: ')
    pwd = input('please your password>>: ')
    if name == 'Mark' and pwd == '123':
        print('login successful')
        break
    else:
        print('user or password err')

print('end...')
```

#### 输错三次则退出

**方式一**：计数器方式

```python
print('start....')
count = 0
while count <= 2:
    name = input('please your name>>: ')
    pwd = input('please your password>>: ')
    if name == 'Mark' and pwd == '123':
        print('login successful')
        break
    else:
        print('user or password err')
        count += 1
print('end...')
```

**方式二**：使用 break

```python
print('start....')
count = 0
while count < 3:
    name = input('please your name>>: ')
    pwd = input('please your password>>: ')
    if name == 'Mark' and pwd == '123':
        print('login successful')
        break
    else:
        print('user or password err')
        count += 1
else:
    print('输错的次数过多')

print('end...')
```

#### continue：结束本次循环

`continue` 代表结束本次循环，直接进入下一次。

```python
count = 1
while count < 6:
    if count == 4:
        count += 1
        continue  # 只能在 continue 同一级别之前加代码
    print(count)
    count += 1
```

> **注意**：不应该将 continue 作为循环体最后一步执行的代码。

```python
while True:
    print('11111')
    print('22222')
    print('333')
    continue  # 不应该将 continue 作为循环体最后一步执行的代码
```

### while + else

`while + else` 的意思是：只要循环正常完成，即中途没有 `break`，就会执行 `else` 语句；否则不会执行。

**示例**：

```python
count = 1
while count < 6:
    if count == 4:
        break
    print(count)
    count += 1
else:
    print('会在 while 循环没有被 break 终止的情况下执行')
```

### while 循环的嵌套

```python
name_of_db = 'Mark'
pwd_of_db = '123'
print('start....')
count = 0
while count <= 2:
    name = input('please your name>>: ')
    pwd = input('please your password>>: ')
    if name == name_of_db and pwd == pwd_of_db:
        print('login successful')
        while True:
            print("""
            1 浏览商品
            2 添加购物车
            3 支付
            4 退出
            """)
            choice = input('请输入你的操作: ')
            if choice == '1':
                print('开始浏览商品....')
            elif choice == '2':
                print('正在添加购物车....')
            elif choice == '3':
                print('正在支付....')
            elif choice == '4':
                break
        break
    else:
        print('user or password err')
        count += 1
else:
    print('输错的次数过多')

print('end...')
```

### tag 控制循环

使用 `tag` 控制所有 while 循环（相当于一个 while 循环的开关）。

```python
name_of_db = 'Mark'
pwd_of_db = '123'
tag = True
print('start....')
count = 0
while tag:
    if count == 3:
        print('尝试次数过多')
        break
    name = input('please your name>>: ')
    pwd = input('please your password>>: ')
    if name == name_of_db and pwd == pwd_of_db:
        print('login successful')
        while tag:
            print("""
            1 浏览商品
            2 添加购物车
            3 支付
            4 退出
            """)
            choice = input('请输入你的操作: ')
            if choice == '1':
                print('开始浏览商品....')
            elif choice == '2':
                print('正在添加购物车....')
            elif choice == '3':
                print('正在支付....')
            elif choice == '4':
                tag = False
    else:
        print('user or password err')
        count += 1

print('end...')
```

## for 循环

### for 循环主要用于循环取值

```python
student = ['Mark', '虎老师', 'lxxdsb', 'alexdsb', 'wupeiqisb']

# while 循环
i = 0
while i < len(student):
    print(student[i])
    i += 1

# for 循环
for item in student:
    print(item)

# 遍历字符串
for item in 'hello':
    print(item)

# 遍历字典
dic = {'x': 444, 'y': 333, 'z': 555}
for k in dic:
    print(k, dic[k])

# range 的使用
for i in range(1, 10, 3):
    print(i)

for i in range(10):
    print(i)

# 遍历带索引
for i in range(len(student)):
    print(i, student[i])
```

### for 循环的嵌套

#### 打印九九乘法表

**分析**：
```
1*1=1
1*2=2 2*2=4
1*3=3 2*3=6 3*3=9
...
1*9=9 2*9=18 ... 9*9=81
```

**代码实现**：

```python
for i in range(1, 10):
    for j in range(1, i + 1):
        print('%s*%s=%s' % (j, i, i * j), end=' ')
    print()
```

#### 打印金字塔

**分析**：
```
        *        max_level=5, current_level=1, blank=4, *号数=1
       ***       max_level=5, current_level=2, blank=3, *号数=3
      *****      max_level=5, current_level=3, blank=2, *号数=5
     *******     max_level=5, current_level=4, blank=1, *号数=7
    *********    max_level=5, current_level=5, blank=0, *号数=9
```

**数学表达式**：
- 空格数 = max_level - current_level
- *号数 = 2 * current_level - 1

**代码实现**：

```python
max_level = 5
for current_level in range(1, max_level + 1):
    # 打印空格
    for i in range(max_level - current_level):
        print(' ', end='')  # 在一行中连续打印多个空格
    # 打印星号
    for j in range(2 * current_level - 1):
        print('*', end='')
    print()
```

## 小结

| 语句 | 作用 | 使用场景 |
|------|------|---------|
| `if` | 条件判断 | 单个条件判断 |
| `if-else` | 双分支判断 | 二选一的场景 |
| `if-elif-else` | 多分支判断 | 多选一的场景 |
| `while` | 条件循环 | 不知道循环次数时 |
| `for` | 遍历循环 | 已知循环范围或遍历容器 |
| `break` | 终止循环 | 满足某个条件时退出循环 |
| `continue` | 跳过本次循环 | 满足某个条件时跳过本次迭代 |
| `while/for-else` | 循环正常结束时执行 | 判断循环是否被 break 终止 |

掌握这些流程控制语句，可以让你的程序具有判断和重复执行的能力，实现更加复杂的功能。
