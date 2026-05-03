---
title: Django框架(四) Django之视图层
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-04-22T00:00:00.000+08:00
slug: django-framework-4-view
description: 'Django框架 (四) Django之视图层'
tags:
  - Python
  - Django
category: Django
draft: false
language: zh-CN
---

## 视图函数

一个视图函数，简称视图，是一个简单的Python函数，它接受Web请求并且返回Web响应。响应可以是一张网页的HTML内容，一个重定向，一个404错误，一个XML文档，或者一张图片。任何东西都可以。无论视图本身包含什么逻辑，都要返回响应。

为了将代码放在某处，约定是将视图放置在项目或应用程序目录中的名为`views.py`的文件中。

下面是一个返回当前日期和时间作为HTML文档的视图：

```python
from django.shortcuts import render, HttpResponse, HttpResponseRedirect, redirect
import datetime

def current_datetime(request):
    now = datetime.datetime.now()
    html = "<html><body>It is now %s.</body></html>" % now
    return HttpResponse(html)
```

**让我们逐行阅读上面的代码：**

1. 首先，我们从`django.shortcuts`模块导入了`HttpResponse`类，以及Python的`datetime`库
2. 接着，我们定义了`current_datetime`函数。它就是视图函数。每个视图函数都使用`HttpRequest`对象作为第一个参数，并且通常称之为`request`

**注意：** 视图函数的名称并不重要；不需要用一个统一的命名方式来命名，以便让Django识别它。我们将其命名为`current_datetime`，是因为这个名称能够精确地反映出它的功能。

3. 这个视图会返回一个`HttpResponse`对象，其中包含生成的响应。每个视图函数都负责返回一个`HttpResponse`对象。

**视图层，熟练掌握两个对象即可：请求对象(request)和响应对象(HttpResponse)**

## HttpRequest对象

### request属性

Django将请求报文中的请求行、首部信息、内容主体封装成HttpRequest类中的属性。除了特殊说明的之外，其他均为只读的。

```python
'''
1.HttpRequest.GET
   一个类似于字典的对象，包含 HTTP GET 的所有参数。详情请参考 QueryDict 对象。

2.HttpRequest.POST
   一个类似于字典的对象，如果请求中包含表单数据，则将这些数据封装成 QueryDict 对象。
   POST 请求可以带有空的 POST 字典 —— 如果通过 HTTP POST 方法发送一个表单，但是表单中没有任何的数据，QueryDict 对象依然会被创建。
   因此，不应该使用 if request.POST 来检查使用的是否是POST 方法；应该使用 if request.method == "POST"
   另外：如果使用 POST 上传文件的话，文件信息将包含在 FILES 属性中。
   注意：键值对的值是多个的时候，比如checkbox类型的input标签，select标签，需要用：
       request.POST.getlist("hobby")

3.HttpRequest.body
   一个字符串，代表请求报文的主体。在处理非 HTTP 形式的报文时非常有用，例如：二进制图片、XML,Json等。
   但是，如果要处理表单数据的时候，推荐还是使用 HttpRequest.POST 。

4.HttpRequest.path
   一个字符串，表示请求的路径组件（不含域名）。
   例如："/music/bands/the_beatles/"

5.HttpRequest.method
   一个字符串，表示请求使用的HTTP 方法。必须使用大写。
   例如："GET"、"POST"

6.HttpRequest.encoding
   一个字符串，表示提交的数据的编码方式（如果为 None 则表示使用 DEFAULT_CHARSET 的设置，默认为 'utf-8'）。

7.HttpRequest.META
   一个标准的Python字典，包含所有的HTTP首部。具体的头部信息取决于客户端和服务器，下面是一些示例：
   - CONTENT_LENGTH：请求的正文的长度（是一个字符串）
   - CONTENT_TYPE：请求的正文的MIME类型
   - HTTP_ACCEPT：响应可接收的Content-Type
   - HTTP_USER_AGENT：客户端的user-agent字符串
   - QUERY_STRING：单个字符串形式的查询字符串
   - REMOTE_ADDR：客户端的IP 地址

8.HttpRequest.FILES
   一个类似于字典的对象，包含所有的上传文件信息。

9.HttpRequest.COOKIES
   一个标准的Python字典，包含所有的cookie。键和值都为字符串。

10.HttpRequest.session
    一个既可读又可写的类似于字典的对象，表示当前的会话。

11.HttpRequest.user
    一个 AUTH_USER_MODEL 类型的对象，表示当前登录的用户。
'''
```

### request常用方法

```python
'''
1.HttpRequest.get_full_path()
   返回 path，如果可以将加上查询字符串。
   例如："/music/bands/the_beatles/?print=true"

2.HttpRequest.is_ajax()
   如果请求是通过XMLHttpRequest发起的，则返回True。
'''
```

## HttpResponse对象

响应对象主要有三种形式：

- `HttpResponse()`
- `render()`
- `redirect()`

HttpResponse()括号内直接跟一个具体的字符串作为响应体，比较直接很简单，所以这里主要介绍后面两种形式。

### render()

```python
render(request, template_name[, context])
```

结合一个给定的模板和一个给定的上下文字典，并返回一个渲染后的HttpResponse对象。

**参数：**

- `request`：用于生成响应的请求对象
- `template_name`：要使用的模板的完整名称，可选的参数
- `context`：添加到模板上下文的一个字典。默认是一个空字典

**注意：** render方法就是将一个模板页面中的模板语法进行渲染，最终渲染成一个html页面作为响应体。

### redirect()

传递要重定向的一个硬编码的URL：

```python
def my_view(request):
    return redirect('/some/url/')
```

也可以是一个完整的URL：

```python
def my_view(request):
    return redirect('http://www.baidu.com/')
```
