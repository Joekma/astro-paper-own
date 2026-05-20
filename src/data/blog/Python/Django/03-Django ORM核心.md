---
title: Django ORM核心
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-05-04T00:00:00.000+08:00
slug: django-orm-core
featured: false
draft: false
series: django
seriesOrder: 4
tags:
  - Python
  - Django
  - ORM
  - 数据库
description: 'Django ORM核心详解，包括模型定义、字段类型、关系映射、增删改查操作'
---

> ORM（对象-关系-映射）让开发者无需直接写SQL，通过Python对象操作数据库。

## ORM简介

### ORM vs SQL

```python
# 使用ORM
class Employee(models.Model):
    name = models.CharField(max_length=32)
    salary = models.DecimalField(max_digits=8, decimal_places=2)

Employee.objects.filter(name="alex")

# 等价 SQL：SELECT * FROM employee WHERE name='alex';
```

## 模型定义

### 常用字段

| 字段 | 说明 | 参数 |
|------|------|------|
| `AutoField` | 自增主键 | `primary_key=True` |
| `CharField` | 字符 | `max_length=100` |
| `IntegerField` | 整数 | - |
| `DateField` | 日期 | - |
| `DateTimeField` | 日期时间 | - |
| `TextField` | 文本 | - |
| `BooleanField` | 布尔 | - |
| `DecimalField` | 小数 | `max_digits`, `decimal_places` |
| `ForeignKey` | 外键 | `to`, `on_delete` |
| `ManyToManyField` | 多对多 | `to` |

### 字段参数

```python
class Book(models.Model):
    title = models.CharField(max_length=100, verbose_name="书名")
    price = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    publish = models.ForeignKey('Publish', on_delete=models.CASCADE)
    authors = models.ManyToManyField('Author')
    is_delete = models.BooleanField(default=False)
```

## 表关系

### 一对多

```python
class Publish(models.Model):
    name = models.CharField(max_length=100)

class Book(models.Model):
    title = models.CharField(max_length=100)
    publish = models.ForeignKey(Publish, on_delete=models.CASCADE)
```

在多的表中创建关联字段：

```sql
CREATE TABLE book (
    id INT PRIMARY KEY,
    title VARCHAR(100),
    publish_id INT,
    FOREIGN KEY (publish_id) REFERENCES publish(id)
);
```

### 多对多

```python
class Author(models.Model):
    name = models.CharField(max_length=100)

class Book(models.Model):
    title = models.CharField(max_length=100)
    authors = models.ManyToManyField(Author)
```

Django自动创建中间表：

```sql
CREATE TABLE book_authors (
    id INT PRIMARY KEY,
    book_id INT,
    author_id INT
);
```

### 一对一

```python
class User(models.Model):
    username = models.CharField(max_length=100)

class UserDetail(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    phone = models.CharField(max_length=20)
```

## CRUD操作

### 创建

```python
# 方式1：实例化后保存
book = Book(title="Python", price=99)
book.save()

# 方式2：create 直接创建
Book.objects.create(title="Django", price=89)

# 方式3：bulk_create 批量创建
Book.objects.bulk_create([
    Book(title="Go", price=79),
    Book(title="Java", price=99),
])
```

### 查询

```python
# 查询所有
Book.objects.all()

# 过滤查询
Book.objects.filter(title="Python")

# 获取单个
Book.objects.get(id=1)

# 排除
Book.objects.exclude(title="Go")

# 排序
Book.objects.order_by("-price")  # 降序

# 切片（分页）
Book.objects.all()[0:10]

# 聚合
from django.db.models import Sum, Avg, Max, Min, Count
Book.objects.aggregate(total=Sum("price"))
```

### 更新

```python
# 单条更新
book = Book.objects.get(id=1)
book.price = 109
book.save()

# 批量更新
Book.objects.filter(id=1).update(price=119)
```

### 删除

```python
# 单条删除
book = Book.objects.get(id=1)
book.delete()

# 批量删除
Book.objects.filter(title="Go").delete()
```

## 进阶查询

### 模糊查询

```python
# contains 包含
Book.objects.filter(title__contains="Python")

# icontains 不区分大小写
Book.objects.filter(title__icontains="python")

# startswith / endswith
Book.objects.filter(title__startswith="D")
```

### 比较查询

```python
Book.objects.filter(price__gt=50)    # 大于
Book.objects.filter(price__gte=50)   # 大于等于
Book.objects.filter(price__lt=100)   # 小于
Book.objects.filter(price__lte=100)  # 小于等于
Book.objects.filter(price__range=(50, 100))  # 范围
```

### F和Q对象

```python
from django.db.models import F, Q

# F对象：字段比较
Book.objects.filter(price__gt=F("original_price"))

# Q对象：复杂查询
Book.objects.filter(Q(title="Python") | Q(title="Django"))
Book.objects.filter(Q(price__gt=50) & ~Q(title__startswith="Go"))
```

### 正向与反向查询

```python
# 正向查询（已知Book，找Publish）
book = Book.objects.get(id=1)
book.publish.name  # 通过外键属性

# 反向查询（已知Publish，找Books）
publish = Publish.objects.get(id=1)
publish.book_set.all()  # 通过关联模型名_set
```

## 小结

- ORM通过Python对象操作数据库，无需编写SQL
- 使用`models.Model`定义模型
- `objects`管理器提供`filter`、`get`、`create`等方法
- 一对多用`ForeignKey`，多对多用`ManyToManyField`