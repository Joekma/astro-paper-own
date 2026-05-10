---
title: Django模板系统
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-05-04T00:00:00.000+08:00
slug: django-template-system
featured: false
draft: false
series: django
tags:
  - Python
  - Django
  - 模板
description: 'Django模板系统详解，包括模板语法、变量传递、过滤器、标签、模板继承和导入'
---

> Django 模板系统用于将 Python 数据渲染成 HTML 页面。

## 模板语法

### 变量

语法：`{{ 变量名 }}`，使用点号`.`访问复杂数据结构的属性和方法。

```python
def index(request):
    name = "hello"
    i = 200
    l = [11, 22, 33, 44, 55]
    d = {"name": "haiyan", "age": 20}

    class People:
        def __init__(self, name, age):
            self.name = name
            self.age = age
        def dream(self):
            return "你有梦想吗？"

    person = People("alex", 18)
    return render(request, "index.html", {"name": name, "person": person})
```

```html
<p>{{ name }}</p>
<p>{{ l.0 }}</p>
<p>{{ d.name }}</p>
<p>{{ person.name }}</p>
<p>{{ person.dream }}</p>
```

## 过滤器

语法：`{{ 变量|过滤器:参数 }}`

| 过滤器 | 说明 | 示例 |
|--------|------|------|
| `default` | 默认值 | `{{ name\|default:"空" }}` |
| `length` | 长度 | `{{ list\|length }}` |
| `filesizeformat` | 文件大小 | `{{ size\|filesizeformat }}` |
| `date` | 日期格式化 | `{{ date\|date:"Y-m-d" }}` |
| `truncatechars` | 截断字符 | `{{ text\|truncatechars:10 }}` |
| `safe` | 渲染HTML | `{{ html\|safe }}` |
| `add` | 加法 | `{{ value\|add:5 }}` |

## 标签

### for循环

```html
{% for item in list %}
    <li>{{ forloop.counter }} - {{ item }}</li>
{% empty %}
    <li>列表为空</li>
{% endfor %}
```

`forloop` 属性：
- `forloop.counter` - 当前循环计数（从1开始）
- `forloop.counter0` - 当前循环计数（从0开始）
- `forloop.first` - 是否第一次循环
- `forloop.last` - 是否最后一次循环

### if条件

```html
{% if user.is_authenticated %}
    <p>欢迎 {{ user.username }}</p>
{% elif user.is_staff %}
    <p>工作人员</p>
{% else %}
    <p>请登录</p>
{% endif %}
```

### with别名

```html
{% with people.name as name %}
    <p>{{ name }}</p>
{% endwith %}
```

## 模板继承

### 基础模板

```html
<!-- base.html -->
<!DOCTYPE html>
<html>
<head>
    <title>{% block title %}默认标题{% endblock %}</title>
    {% block css %}{% endblock %}
</head>
<body>
    <nav>导航栏</nav>
    {% block content %}{% endblock %}
    <footer>页脚</footer>
    {% block js %}{% endblock %}
</body>
</html>
```

### 子模板

```html
{% extends "base.html" %}

{% block title %}首页{% endblock %}

{% block content %}
    <h1>欢迎访问</h1>
    <p>这里是首页内容</p>
{% endblock %}
```

## 模板导入

使用 `{% include %}` 引入其他模板：

```html
<!-- 引入导航栏 -->
{% include "navbar.html" %}

<!-- 可以传递参数 -->
{% include "widget.html" with name="alex" %}
```

> 模板继承与导入的区别：
> - 继承：子模板可以覆盖父模板的块
> - 导入：一个页面可以引入多个模板片段

## 小结

- `{{ }}` 用于输出变量
- `{% %}` 用于编写模板标签
- 过滤器处理变量输出格式
- `{% extends %}` 实现模板继承
- `{% include %}` 引入模板片段