---
title: Django框架(六) Django之模板继承
author: 程序员
pubDatetime: 2024-08-13T00:00:00.000+08:00
updated: 2026-04-22T00:00:00.000+08:00
slug: django-framework-6-template-inherit
description: 'Django框架 (六) Django之模板继承'
tags:
  - Python
  - Django
category: Django
draft: false
language: zh-CN
---

## 模版导入和继承

### 模版导入

**一个页面只能继承一个模板，如何解决了？如何使用多个模板，或者引入其他页面**

`<% include "a.html" %>` 可以引用多次

**模板，include，子页面怎么渲染？**
先把自己渲染成字符串，在拿模板和include渲染，所以不存在渲染问题（可以把子页面继承include当做一个整页面）

### 示例

urls.py示例：

```python
url(r'^tpl1$', views.tpl1),
url(r'^tpl2$', views.tpl2),
url(r'^tpl3$', views.tpl3),
```

views.py示例：

```python
def tpl1(request):
    u = [1, 2, 3]
    return render(request, "tp1.html", {"u": u})

def tpl2(request):
    name = "alex"
    return render(request, "tp2.html", {"name": name})

def tpl3(request):
    status = "已修改"
    return render(request, "tp3.html", {"status": status})
```

**模板：master.html**

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>
        {% block title %}{% endblock %}
    </title>
    <link rel="stylesheet" href="/static/common.css">
    {% block css %}
    {% endblock %}
</head>
<body>
    {% block content %}
    {% endblock %}

    <script src="/static/js/jquery-1.12.4.js"></script>
    <script src="/static/bootstrap-3.3.7-dist/js/bootstrap.min.js"></script>
    {% block js %}
    {% endblock %}
</body>
</html>
```

**子页面：tp1.html**

```html
{% extends "master.html" %}

{% block title %}
    用户管理
{% endblock %}

{% block css %}
    <style>
        body {
            background-color: aqua;
        }
    </style>
{% endblock %}

{% block content %}
    <h1>用户管理</h1>
    <ul>
        {% for i in u %}
            <li>{{ i }}</li>
        {% endfor %}
    </ul>
{% endblock %}
```

**子页面：tp2.html**

```html
{% extends "master.html" %}

{% block content %}
    <h1>修改密码{{ name }}</h1>
    {% include "tp3.html" %}
{% endblock %}
```

**include页面：tp3.html**

```html
<div>
    <input type="text">
    <input type="button" value="++">
</div>
```

### 模版继承

Django模版引擎中最强大也是最复杂的部分就是模版继承了。模版继承可以让您创建一个基本的"骨架"模版，它包含您站点中的全部元素，并且可以定义能够被子模版覆盖的blocks。

通过从下面这个例子开始，可以容易的理解模版继承：

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <link rel="stylesheet" href="style.css"/>
    <title>{% block title %}My amazing site{% endblock %}</title>
</head>

<body>
    <div id="sidebar">
        {% block sidebar %}
            <ul>
                <li><a href="/">Home</a></li>
                <li><a href="/blog/">Blog</a></li>
            </ul>
        {% endblock %}
    </div>

    <div id="content">
        {% block content %}{% endblock %}
    </div>
</body>
</html>
```

这个模版，我们把它叫作`base.html`，它定义了一个可以用于两列排版页面的简单HTML骨架。"子模版"的工作是用它们的内容填充空的blocks。

在这个例子中，`block`标签定义了三个可以被子模版内容填充的block。`block`告诉模版引擎：子模版可能会覆盖掉模版中的这些位置。

子模版可能看起来是这样的：

```html
{% extends "base.html" %}

{% block title %}My amazing blog{% endblock %}

{% block content %}
{% for entry in blog_entries %}
    <h2>{{ entry.title }}</h2>
    <p>{{ entry.body }}</p>
{% endfor %}
{% endblock %}
```

`extends`标签是这里的关键。它告诉模版引擎，这个模版"继承"了另一个模版。当模版系统处理这个模版时，首先，它将定位父模版——在此例中，就是"base.html"。

那时，模版引擎将注意到`base.html`中的三个`block`标签，并用子模版中的内容来替换这些block。根据`blog_entries`的值，输出可能看起来是这样的：

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <link rel="stylesheet" href="style.css" />
    <title>My amazing blog</title>
</head>

<body>
    <div id="sidebar">
        <ul>
            <li><a href="/">Home</a></li>
            <li><a href="/blog/">Blog</a></li>
        </ul>
    </div>

    <div id="content">
        <h2>Entry one</h2>
        <p>This is my first entry.</p>

        <h2>Entry two</h2>
        <p>This is my second entry.</p>
    </div>
</body>
</html>
```

**请注意：** 子模版并没有定义`sidebar`block，所以系统使用了父模版中的值。父模版的`{% block %}`标签中的内容总是被用作备选内容（fallback）。

这种方式使代码得到最大程度的复用，并且使得添加内容到共享的内容区域更加简单，例如，部分范围内的导航。

### 使用继承的一些提示

1. 如果你在模版中使用`{% extends %}`标签，它必须是模版中的第一个标签。其他的任何情况下，模版继承都将无法工作。

2. 在base模版中设置越多的`{% block %}`标签越好。请记住，子模版不必定义全部父模版中的blocks，所以，你可以在大多数blocks中填充合理的默认内容，然后，只定义你需要的那一个，多一点钩子总比少一点好。

3. 如果你发现自己在大量的模版中复制内容，那可能意味着你应该把内容移动到父模版中的一个`{% block %}`中。

4. 如果你需要获取父模版中block的内容，`{{ block.super }}`变量可以解决这个问题。如果你只想添加到父block的内容而不是完全覆盖它，这很有用。
