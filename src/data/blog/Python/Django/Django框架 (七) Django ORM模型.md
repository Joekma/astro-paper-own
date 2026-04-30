---
title: Django框架(七) Django ORM模型
author: 程序员
pubDatetime: 2024-08-13T00:00:00.000+08:00
updated: 2026-04-22T00:00:00.000+08:00
slug: django-framework-7-orm
description: 'Django框架 (七) Django ORM模型'
tags:
  - Python
  - Django
category: Django
draft: false
language: zh-CN
---

## ORM简介

查询数据层次图解：如果操作mysql，ORM是在pymysq之上又进行了一层封装。

MVC或者MTV框架中包括一个重要的部分，就是ORM，它实现了数据模型与数据库的解耦，即数据模型的设计不需要依赖于特定的数据库，通过简单的配置就可以轻松更换数据库，这极大的减轻了开发人员的工作量，不需要面对因数据库变更而导致的无效劳动。

ORM是"对象-关系-映射"的简称。

### SQL中的表

```sql
-- 创建表
CREATE TABLE employee(
    id INT PRIMARY KEY auto_increment,
    name VARCHAR(20),
    gender BIT default 1,
    birthday DATA,
    department VARCHAR(20),
    salary DECIMAL(8,2) unsigned
);
```

### SQL中的表纪录

```sql
-- 添加一条表纪录
INSERT employee (name,gender,birthday,salary,department)
VALUES ("alex",1,"1985-12-12",8000,"保洁部");

-- 查询一条表纪录
SELECT * FROM employee WHERE age=24;

-- 更新一条表纪录
UPDATE employee SET birthday="1989-10-24" WHERE id=1;

-- 删除一条表纪录
DELETE FROM employee WHERE name="alex"
```

### Python的类

```python
class Employee(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=32)
    gender = models.BooleanField()
    birthday = models.DateField()
    department = models.CharField(max_length=32)
    salary = models.DecimalField(max_digits=8, decimal_places=2)
```

### Python的类对象

```python
# 添加一条表纪录
emp = Employee(name="alex", gender=True, birthday="1985-12-12", department="保洁部")
emp.save()

# 查询一条表纪录
Employee.objects.filter(age=24)

# 更新一条表纪录
Employee.objects.filter(id=1).update(birthday="1989-10-24")

# 删除一条表纪录
Employee.objects.filter(name="alex").delete()
```

## 单表操作

### 创建表

#### 创建模型

在book应用下的models.py中创建模型：

```python
from django.db import models

class Book(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=64)
    pub_data = models.DateField()
    price = models.DecimalField(max_digits=5, decimal_places=2)
    publish = models.CharField(max_length=12)

    def __str__(self):
        return self.name
```

#### 更多字段和参数

每个字段有一些特有的参数，例如，CharField需要max_length参数来指定VARCHAR数据库字段的大小。还有一些适用于所有字段的通用参数。

### 常用字段类型

#### AutoField

- int自增列，必须填入参数primary_key=True
- 当model中如果没有自增列，则自动会创建一个列名为id的列

```python
from django.db import models

class UserInfo(models.Model):
    # 自动创建一个列名为id的且为自增的整数列
    username = models.CharField(max_length=32)

class Group(models.Model):
    # 自定义自增列
    nid = models.AutoField(primary_key=True)
    name = models.CharField(max_length=32)
```

#### BigAutoField

- bigint自增列，必须填入参数primary_key=True

#### SmallIntegerField

- 小整数：-32768 ～ 32767

#### PositiveSmallIntegerField

- 正小整数：0 ～ 32767

#### IntegerField

- 整数列（有符号的）：-2147483648 ～ 2147483647

#### PositiveIntegerField

- 正整数：0 ～ 2147483647

#### BigIntegerField

- 长整型（有符号的）：-9223372036854775808 ～ 9223372036854775807

#### 自定义无符号整数字段

```python
class UnsignedIntegerField(models.IntegerField):
    def db_type(self, connection):
        return 'integer UNSIGNED'
```

### 字段对应关系

Django字段默认的值与数据库类型的对应关系：

| Django字段 | 数据库类型 |
|------------|-----------|
| AutoField | integer AUTO_INCREMENT |
| BigAutoField | bigint AUTO_INCREMENT |
| BinaryField | longblob |
| BooleanField | bool |
| CharField | varchar(%(max_length)s) |
| DateField | date |
| DateTimeField | datetime |
| DecimalField | numeric(%(max_digits)s, %(decimal_places)s) |
| IntegerField | integer |
| BigIntegerField | bigint |
| TextField | longtext |
| PositiveIntegerField | integer UNSIGNED |
| PositiveSmallIntegerField | smallint UNSIGNED |

### 其他常用字段

#### BooleanField

- 布尔值类型

#### NullBooleanField

- 可以为空的布尔值

#### CharField

- 字符类型，必须提供max_length参数

#### TextField

- 文本类型

#### EmailField

- 字符串类型，Django Admin以及ModelForm中提供验证机制

#### IPAddressField

- 字符串类型，Django Admin以及ModelForm中提供验证IPV4机制

#### GenericIPAddressField

- 字符串类型，Django Admin以及ModelForm中提供验证Ipv4和Ipv6

**参数：**

- protocol：用于指定Ipv4或Ipv6，'both', "ipv4", "ipv6"
- unpack_ipv4：如果指定为True，则输入::ffff:192.0.2.1时候，可解析为192.0.2.1

#### URLField

- 字符串类型，Django Admin以及ModelForm中提供验证URL

#### SlugField

- 字符串类型，Django Admin以及ModelForm中提供验证支持字母、数字、下划线、连接符（减号）