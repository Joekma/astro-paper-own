---
title: Django框架(八) Django之ORM数据库操作
author: 程序员
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-04-22T00:00:00.000+08:00
slug: django-framework-8-orm-db
description: 'Django框架 (八) Django之ORM数据库操作'
tags:
  - Python
  - Django
category: Django
draft: false
language: zh-CN
---

## 创建模型

### 概念说明

我们假设下面这些概念，字段和关系：

- **作者模型**：一个作者有姓名和年龄
- **作者详细模型**：把作者的详情放到详情表，包含生日、手机号、家庭住址等信息。作者详情模型和作者模型之间是一对一的关系
- **出版商模型**：出版商有名称、所在城市以及email
- **书籍模型**：书籍有书名和出版日期

**关系总结：**

- 一本书可能有多个作者，一个作者也可以写多本书，所以作者和书籍是多对多的关系
- 一本书只能由一个出版商出版，所以出版商和书籍是一对多的关系

### 表结构设计

#### 出版社和书籍的一对多关系

**Book表：**

| id | title | price | publish_id |
|----|----|----|----|
| 1 | php | 100 | 1 |
| 2 | python | 200 | 1 |
| 3 | go | 100 | 2 |
| 4 | java | 300 | 1 |

**Publish表：**

| id | name | email | addr |
|----|----|----|----|
| 1 | 人民出版社 | 111 | 北京 |
| 2 | 沙河出版社 | 222 | 沙河 |

**总结：** 一旦确定表关系是一对多，在多的表中创建关联字段（如publish_id）。

#### 作者和书籍的多对多关系

**Book表：**

| id | title | price | publish_id |
|----|----|----|----|
| 1 | php | 100 | 1 |
| 2 | python | 200 | 1 |
| 3 | go | 100 | 2 |
| 4 | java | 300 | 1 |

**Author表：**

| id | name | age | addr |
|----|----|----|----|
| 1 | alex | 34 | beijing |
| 2 | egon | 55 | nanjing |

**Book2Author表（中间表）：**

| id | book_id | author_id |
|----|----|----|
| 1 | 2 | 1 |
| 2 | 2 | 2 |
| 3 | 3 | 2 |

**总结：** 一旦确定是多对多关系，创建第三张关系表（中间表包含书籍id和作者id）。

#### 作者和作者详情的一对一关系

**Author表：**

| id | name | age | ad_id |
|----|----|----|----|
| 1 | alex | 34 | 1 |
| 2 | egon | 55 | 2 |

**AuthorDetail表：**

| id | addr | gender | tel | gf_name | author_id |
|----|----|----|----|----|----|
| 1 | beijing | male | 110 | 小花 | 1 |
| 2 | nanjing | male | 911 | 杠娘 | 2 |

**总结：** 一旦确定是一对一关系，在任意一张表中建立关联字段+Unique。

### 在Models创建模型

```python
class Book(models.Model):
    nid = models.AutoField(primary_key=True)
    name = models.CharField(max_length=32)
    price = models.DecimalField(max_digits=5, decimal_places=2)
    publish_date = models.DateField()

    publish = models.ForeignKey(to='Publish', to_field='nid', on_delete=models.CASCADE)
    authors = models.ManyToManyField(to='Author')

    def __str__(self):
        return self.name

class Author(models.Model):
    nid = models.AutoField(primary_key=True)
    name = models.CharField(max_length=32)
    age = models.IntegerField()
    author_detail = models.OneToOneField(to='AuthorDatail', to_field='nid', unique=True, on_delete=models.CASCADE)

class AuthorDatail(models.Model):
    nid = models.AutoField(primary_key=True)
    telephone = models.BigIntegerField()
    birthday = models.DateField()
    addr = models.CharField(max_length=64)

class Publish(models.Model):
    nid = models.AutoField(primary_key=True)
    name = models.CharField(max_length=32)
    city = models.CharField(max_length=32)
    email = models.EmailField()
```

### 生成的表结构

![image](https://img2024.cnblogs.com/blog/1330620/202408/1330620-20240813135649990-865691805.png)

### 注意事项

1. 表的名称`myapp_modelName`是根据模型中的元数据自动生成的，也可以覆写为别的名称
2. `id`字段是自动添加的
3. 对于外键字段，Django会在字段名上添加`"_id"`来创建数据库中的列名
4. 外键字段ForeignKey有一个`null=True`的设置（它允许外键接受空值NULL），你可以赋给它空值None

## 新增或者删除字段

### 新增字段

**第一步：** 在要添加新字段的app的models.py文件中添加需要新增的字段

**第二步：** 在终端命令行中执行：

```bash
python manage.py makemigrations AppTest
```

**第三步：** 选择输入1（这里要求你设置新建字段的默认值）

**第四步：** 如果不想让它有值，可以直接输`''`（中间没有空格）。

**注意：** 如果是数值类型，需要设置`blank=True`和`null=True`。

**blank和null的区别：**

- `blank=True`时，字段可以为空
- `null=True`时，django用Null来存储空值

**第五步：** 最后执行：

```bash
python manage.py migrate
```

### 删除字段

只需要将想要删除的字段注释掉，再执行makemigrations和migrate两条命令即可。

## 添加表记录

### 一对多的添加方式

**方式1：**

```python
publish_obj = Publish.objects.get(nid=1)
book_obj = Book.objects.create(title="", publish_date="2012-12-12", price=100, publish=publish_obj)
```

**方式2：**

```python
book_obj = Book.objects.create(title="", publish_date="2012-12-12", price=100, publish_id=1)
```

### 关键点

1. `book_obj.publish` 等于 `Publish.objects.filter(id=book_obj.publish_id).first()`
2. `book_obj.authors.all()` 可以获取书籍的所有作者
