---
title: Django 分页器组件详解
author: 程序员
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-04-22T00:00:00.000+08:00
slug: django-component-1-paginator
featured: false
draft: false
tags:
  - Python
  - Django
  - 分页器
description: "深入讲解Django分页器组件的使用方法和实践技巧。"
---

## Django的分页器（paginator）简介

在页面显示分页数据，需要用到Django分页器组件：

```python
from django.core.paginator import Paginator
```

### Paginator对象

```python
paginator = Paginator(user_list, 10)

# per_page: 每页显示条目数量
# count:    数据总个数
# num_pages: 总页数
# page_range: 总页数的索引范围，如: (1,10),(1,200)
# page:     page对象
```

### page对象

```python
page = paginator.page(1)

# has_next              是否有下一页
# next_page_number      下一页页码
# has_previous          是否有上一页
# previous_page_number  上一页页码
# object_list           分页之后的数据列表
# number                当前页
# paginator             paginator对象
```

## 应用View层

```python
from django.shortcuts import render, HttpResponse
from app01.models import *
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger

def index(request):
    '''
    批量导入数据:
    Booklist=[]
    for i in range(100):
        Booklist.append(Book(title="book"+str(i), price=30+i*i))
    Book.objects.bulk_create(Booklist)
    '''

    '''
    分页器的使用:
    book_list = Book.objects.all()
    paginator = Paginator(book_list, 10)

    print("count:", paginator.count)           # 数据总数
    print("num_pages", paginator.num_pages)    # 总页数
    print("page_range", paginator.page_range)  # 页码的列表

    page1 = paginator.page(1)  # 第1页的page对象
    for i in page1:  # 遍历第1页的所有数据对象
        print(i)

    print(page1.object_list)  # 第1页的所有数据

    page2 = paginator.page(2)

    print(page2.has_next())             # 是否有下一页
    print(page2.next_page_number())     # 下一页的页码
    print(page2.has_previous())         # 是否有上一页
    print(page2.previous_page_number())  # 上一页的页码

    # 抛错
    page = paginator.page(12)   # error: EmptyPage
    page = paginator.page("z")   # error: PageNotAnInteger
    '''

    book_list = Book.objects.all()
    paginator = Paginator(book_list, 10)
    page = request.GET.get('page', 1)
    currentPage = int(page)

    try:
        print(page)
        book_list = paginator.page(page)
    except PageNotAnInteger:
        book_list = paginator.page(1)
    except EmptyPage:
        book_list = paginator.page(paginator.num_pages)

    return render(request, "index.html", {"book_list": book_list, "paginator": paginator, "currentPage": currentPage})
```

## 模版层 index.html

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Title</title>
    <link rel="stylesheet" href="https://cdn.bootcss.com/bootstrap/3.3.7/css/bootstrap.min.css"
          integrity="sha384-BVYiiSIFeK1dGmJRAkycuHAHRg32OmUcww7on3RYdg4Va+PmSTsz/K68vbdEjh4u" crossorigin="anonymous">
</head>
<body>

<div class="container">

    <h4>分页器</h4>
    <ul>

        {% for book in book_list %}
            <li>{{ book.title }} -----{{ book.price }}</li>
        {% endfor %}

    </ul>

    <ul class="pagination" id="pager">

        {% if book_list.has_previous %}
            <li class="previous"><a href="/index/?page={{ book_list.previous_page_number }}">上一页</a></li>
        {% else %}
            <li class="previous disabled"><a href="#">上一页</a></li>
        {% endif %}

        {% for num in paginator.page_range %}

            {% if num == currentPage %}
                <li class="item active"><a href="/index/?page={{ num }}">{{ num }}</a></li>
            {% else %}
                <li class="item"><a href="/index/?page={{ num }}">{{ num }}</a></li>
            {% endif %}

        {% endfor %}

        {% if book_list.has_next %}
            <li class="next"><a href="/index/?page={{ book_list.next_page_number }}">下一页</a></li>
        {% else %}
            <li class="next disabled"><a href="#">下一页</a></li>
        {% endif %}

    </ul>
</div>

</body>
</html>
```

## 扩展：自定义页码范围

显示左5右5，总共11个页码的情况：

```python
'''
显示左5，右5，总共11个页，
1 如果总页码大于11
    1.1 if 当前页码减5小于1，要生成1到12的列表（顾头不顾尾，共11个页码）
        page_range = range(1, 12)
    1.2 elif 当前页码+5大于总页码，生成当前页码减10，到当前页码加1的列表（顾头不顾尾，共11个页码）
        page_range = range(paginator.num_pages-10, paginator.num_pages+1)
    1.3 else 生成当前页码-5，到当前页码+6的列表
        page_range = range(current_page_num-5, current_page_num+6)
2 其它情况，生成的列表就是pageinator的page_range
    page_range = paginator.page_range
'''

def index(request):
    book_list = Book.objects.all()
    paginator = Paginator(book_list, 15)
    page = request.GET.get('page', 1)
    currentPage = int(page)

    # 如果页数十分多时，换另外一种显示方式
    if paginator.num_pages > 11:
        if currentPage - 5 < 1:
            pageRange = range(1, 11)
        elif currentPage + 5 > paginator.num_pages:
            pageRange = range(currentPage - 5, paginator.num_pages + 1)
        else:
            pageRange = range(currentPage - 5, currentPage + 5)
    else:
        pageRange = paginator.page_range
```

## 使用Bootstrap样式显示分页

```html
<nav aria-label="Page navigation">
    <ul class="pagination">
        {% if book_list.has_previous %}
            <li>
                <a href="?page={{ book_list.previous_page_number }}" aria-label="Previous">
                    <span aria-hidden="true">&laquo;</span>
                </a>
            </li>
        {% endif %}

        {% for num in pageRange %}
            {% if num == currentPage %}
                <li class="active"><a href="?page={{ num }}">{{ num }}</a></li>
            {% else %}
                <li><a href="?page={{ num }}">{{ num }}</a></li>
            {% endif %}
        {% endfor %}

        {% if book_list.has_next %}
            <li>
                <a href="?page={{ book_list.next_page_number }}" aria-label="Next">
                    <span aria-hidden="true">&raquo;</span>
                </a>
            </li>
        {% endif %}
    </ul>
</nav>
```