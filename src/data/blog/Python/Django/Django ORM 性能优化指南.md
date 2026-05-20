---
title: Django ORM 性能优化指南
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-04-22T00:00:00.000+08:00
slug: django-orm-optimization
featured: false
draft: false
series: django
seriesOrder: 17
tags:
  - Python
  - Django
  - ORM
  - 性能优化
description: "深入讲解Django ORM性能优化的方法和实践技巧。"
---

## 怎么查问题

Web系统是个挺复杂的玩意，有时候有点无从下手哈。可以采用自底向上的顺序，从数据存储一直到数据展现，按照这个顺序一点一点查找性能问题。

1. 数据库（缺少索引/数据模型）
2. 数据存储接口（ORM/低效的查询）
3. 展现/数据使用（Views/报表等）

Web应用的大部分问题都会跟数据库扯上关系。除非你正在处理大量的数据并知道你在做什么，否则不要去考虑用Big-O表示法思考View的问题。数据库调用的开销将使循环和模板渲染的开销相形见绌。不首先解决数据库使用中的问题，您就不能继续解决其他问题。

Django的文档中有那么一节，详细的描述了[DB部分优化](https://docs.djangoproject.com/en/1.10/topics/db/optimization/)，ORM从一开始就应该写的比较高效一些（毕竟有那么多最佳实践）。

优化，很多时候意味着代码可能变得不太清晰。当你遇到选择清晰的代码，还是牺牲清晰代码来获取性能上的一点点提高的时候，请优先考虑要代码的清晰整洁。

## 工具

解决问题的第一步是找到问题，面对ORM，有时间事情可以做。

### 方法一：django.db.connection

理解`django.db.connection`，这个对象可以用来记录当前查询花费的时间：

```text
>>> from django.db import connection
>>> connection.queries
[]
>>> Author.objects.all()
<QuerySet [<Author: Author object>]>
>>> connection.queries
[{'time': '0.002', 'sql': 'SELECT "library_author"."id", "library_author"."name" FROM "library_author" LIMIT 21'}]
```

### 方法二：django-extensions

在shell命令行的环境下，可以使用[django-extensions](https://github.com/django-extensions/django-extensions)的`shell_plus`命令并打开`--print-sql`选项：

```bash
python manage.py shell_plus --print-sql
```

```text
>>> Author.objects.all()
SELECT "library_author"."id", "library_author"."name" FROM "library_author" LIMIT 21
Execution time: 0.001393s [Database: default]
<QuerySet [<Author: Author object>]>
```

### 方法三：Django-debug-toolbar

使用[Django-debug-toolbar](http://django-debug-toolbar.readthedocs.org/)工具，就可以在web端查看SQL查询的详细统计结果，其实它功能远不止这个。

### 总结

- `django.db.connection`：django自身提供，比较底层
- `django-extensions`：可以在shell环境下方便调试
- `django-debug-toolbar`：可以在web端直接看到debug结果

## 案例

下面是用个具体的例子来说明一些问题。

### Model定义

很经典的外键关系，Author和Book一对多的关系：

```python
class Author(models.Model):
    name = models.TextField()

class Book(models.Model):
    title = models.TextField()
    author = models.ForeignKey(
        Author, on_delete=models.PROTECT, related_name='books', null=True
    )
```

### 多余的查询

当你检查一个book是否有author或者想获取这本书的author的id的时候，可能更倾向于直接使用author对象：

```python
if book.author:
    do_stuff()
# 或者
do_stuff_with_author_id(book.author.id)
```

这里`author对象`其实并不需要（主要指第一行代码，其实只需要author_id），会导致一次多余的查询。如果后面需要author对象，再获取也不冲突。比较好的习惯是，直接使用字段名：

```python
if book.author_id:
    do_stuff()

do_stuff_with_author_id(book.author_id)
```

### count和exists

对于初学者，知道什么时候使用`count`和`exists`还是挺好难的。Django会缓存查询结果，所以如果后续的操作会用到这些查询出来的数据，可以使用Python的内置方法（指的是len，if判断queryset）。如果不用查询出的数据，使用queryset提供的方法（`count(), exists()`）：

```python
# 如果要使用查询结果，不要浪费查询
books = Book.objects.filter(...)
if books:
    do_stuff_with_books(books)

# 如果不使用查询结果，使用exist
books = Book.objects.filter(...)
if books.exists():
    do_some_stuff()

# 但永远不要这样
if Book.objects.filter(...):
    do_some_stuff()
```

下面是关于`count`和`len`的例子：

```python
# 如果要使用查询结果，不要浪费查询
books = Book.objects.filter(...)
if len(books) > 5:
    do_stuff_with_books(books)

# 如果不使用查询结果，使用count
books = Book.objects.filter(...)
if books.count() > 5:
    do_some_stuff()

# 但永远不要这样
if len(Book.objects.filter(...)) > 5:
    do_some_stuff()
```

### 只获取需要的数据

默认情况下，ORM查询的时候会把数据库记录对应的所有列取出来，然后转换成Python对象，这无疑是个很大的浪费（有时候只想要一两个列的）。当你只需要某些列的时候可以使用`values`或者`values_list`，它们不是把数据转换成复杂的python对象，而是dicts、tuples等：

```text
# 检索值作为字典
>>> Book.objects.values('title', 'author__name')
<QuerySet [{'author__name': 'Nikolai Gogol', 'title': 'The Overcoat'}, {'author__name': 'Leo Tolstoy', 'title': 'War and Peace'}]>

# 检索值作为元组
>>> Book.objects.values_list('title', 'author__name')
<QuerySet [('The Overcoat', 'Nikolai Gogol'), ('War and Peace', 'Leo Tolstoy')]>
>>> Book.objects.values_list('title')
<QuerySet [('The Overcoat',), ('War and Peace',)]>

# 只获取一个值时，更容易扁平化列表
>>> Book.objects.values_list('title', flat=True)
<QuerySet ['The Overcoat', 'War and Peace']>
```

### 处理很多记录

当你获得一个queryset的时候，Django会缓存这些数据。如果你需要对查询结果进行好几次循环，这种缓存是有意义的，但是对于queryset只循环一次的情况，缓存就没什么意义了：

```python
for book in Books.objects.all():
    do_stuff(book)
```

上面的查询，django会把books所有的数据载入内存，然后进行一次循环。其实我们更想要保持这个数据库connection，每次循环的取出一条book数据，然后调用`do_stuff`。`iterator`就是我们的救星：

```python
for book in Books.objects.all().iterator():
    do_stuff(book)
```

有了iterator，你就可以编写线性数据表或者CSV流了。就能增量写入文件或者发送给用户。

特别是跟`values`、`values_list`结合在一起的时候，能尽可能少的使用内存。在需要对表中的每一行进行修改的迁移期间，使用iterator也非常方便。不能因为迁移不是面向客户的就可以降低对效率的要求。长时间运行的迁移可能意味着事务锁定或停机。

### 关联查询问题

Django ORM的API使得我们使用关系型数据库的时候就像使用面向对象的Python语言那样自然：

```python
# 获取Book的Author的名字
book = Book.objects.first()
book.author.name
```

上面的代码相当的清晰和好理解。Django使用lazy loading（懒加载）的方式，只有用到了author对象时候才会加载。这样做有好处，但是会造成爆炸式的查询。

### 使用select_related和prefetch_related

```python
# N+1查询问题
books = Book.objects.all()
for book in books:
    print(book.author.name)  # 每次都会执行一次查询

# 解决方案：使用select_related
books = Book.objects.select_related('author')
for book in books:
    print(book.author.name)  # 只执行一次查询
```

### 使用only和defer减少字段

```python
# 只获取需要的字段
book = Book.objects.only('title', 'author__name').first()
print(book.title)  # 不会执行额外查询
print(book.author.name)  # 不会执行额外查询（因为使用了select_related）
```

### 使用bulk_create批量插入

```python
# 逐个插入
for i in range(1000):
    Book.objects.create(title=f'Book {i}')

# 批量插入
Book.objects.bulk_create([
    Book(title=f'Book {i}') for i in range(1000)
])
```

### 使用update代替save

```python
# 使用save
book = Book.objects.first()
book.title = 'New Title'
book.save()  # 需要先获取对象

# 使用update
Book.objects.filter(id=1).update(title='New Title')  # 直接更新，不需要获取对象
```
