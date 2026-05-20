---
title: Django ORM高级
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-05-04T00:00:00.000+08:00
slug: django-orm-advanced
featured: false
draft: false
series: django
seriesOrder: 18
tags:
  - Python
  - Django
  - ORM
  - 性能优化
description: 'Django ORM高级特性，包括QuerySet缓存、关联查询、性能优化技巧'
---

> 本篇介绍 Django ORM 的高级特性，包括 QuerySet 惰性查询、缓存机制、关联查询优化等。

## QuerySet特性

### 惰性查询

QuerySet 是惰性的，创建查询集不会立即访问数据库：

```python
queryset = Book.objects.all()  # 不访问数据库
print(queryset)                # 访问数据库
```

### 可切片

```python
Book.objects.all()[:5]     # LIMIT 5
Book.objects.all()[5:10]   # OFFSET 5 LIMIT 5
```

### 缓存机制

每个 QuerySet 都包含缓存，第一次求值时查询数据库并缓存结果：

```python
# 错误：两次查询
print([book.title for book in Book.objects.all()])
print([book.price for book in Book.objects.all()])  # 再次查询

# 正确：复用缓存
books = Book.objects.all()
print([book.title for book in books])
print([book.price for book in books])  # 复用缓存
```

### exists和count

```python
# 检查是否存在（不加载所有数据）
if Book.objects.filter(title="Python").exists():
    pass

# 计数
count = Book.objects.count()
```

## 关联查询

### select_related

用于一对一和多对一关系，预加载关联数据，减少查询次数：

```python
# 无select_related：N+1问题
books = Book.objects.all()
for book in books:
    print(book.publish.name)  # 每次都查询

# 使用select_related：一对多时使用
books = Book.objects.select_related("publish").all()
for book in books:
    print(book.publish.name)  # 使用预加载的数据
```

### prefetch_related

用于多对多和反向外键，预加载关联数据：

```python
# 无prefetch_related：N+1问题
books = Book.objects.all()
for book in books:
    for author in book.authors.all():  # 每次都查询
        print(author.name)

# 使用prefetch_related：多对多时使用
books = Book.objects.prefetch_related("authors").all()
for book in books:
    for author in book.authors.all():  # 使用预加载
        print(author.name)
```

### annotate

聚合查询，为每个对象添加注解：

```python
from django.db.models import Count

# 每个作者关联的书籍数量
authors = Author.objects.annotate(book_count=Count("book"))
for author in authors:
    print(f"{author.name}: {author.book_count} 本书")
```

## 性能优化

### 选择合适字段

```python
# 使用notull=False而非null=True
name = models.CharField(max_length=100, null=False)

# 使用CharField而非TextField存储短文本
title = models.CharField(max_length=200)
```

### 批量操作

```python
# 批量插入
Book.objects.bulk_create([
    Book(title="Book1"),
    Book(title="Book2"),
    Book(title="Book3"),
])

# 批量更新
Book.objects.filter(id__gt=100).update(price=F("price") * 0.9)
```

### 避免循环查询

```python
# 错误：循环中查询
for author in authors:
    print(author.book_set.count())  # N次查询

# 正确：预先聚合
from django.db.models import Count
authors = Author.objects.annotate(book_count=Count("book"))
for author in authors:
    print(author.book_count)  # 1次查询
```

### only和defer

```python
# 只读取title字段
books = Book.objects.only("title")

# 排除content字段
books = Book.objects.defer("content")
```

### values和values_list

```python
# 返回字典列表
books = Book.objects.values("title", "price")

# 返回元组列表
books = Book.objects.values_list("title", "price")

# 返回单个字段
titles = Book.objects.values_list("title", flat=True)
```

## 小结

- **select_related**：一对一、多对一关系
- **prefetch_related**：多对多、反向外键
- **annotate**：聚合统计
- **bulk_create/bulk_update**：批量操作
- **only/defer**：字段选择
- **values/values_list**：数据格式