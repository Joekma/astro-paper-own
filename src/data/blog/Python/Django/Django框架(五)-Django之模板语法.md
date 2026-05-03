---
title: Django框架(五) Django之模板语法
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-04-22T00:00:00.000+08:00
slug: django-framework-5-template
description: 'Django框架 (五) Django之模板语法'
tags:
  - Python
  - Django
category: Django
draft: false
language: zh-CN
---

## 什么是模板

只要是在html里面有模板语法就不是html文件了，这样的文件就叫做模板。

## 模板语法分类

### 模板语法之变量：语法为 `{{ 变量名 }}`

在Django模板中遍历复杂数据结构的关键是句点字符`.`（也就是点）。

views.py示例：

```python
def index(request):
    name = "hello yds"
    i = 200
    l = [11, 22, 33, 44, 55]
    d = {"name": "haiyan", "age": 20}

    class People(object):  # 继承元类
        def __init__(self, name, age):
            self.name = name
            self.age = age

        def __str__(self):
            return self.name + str(self.age)

        def dream(self):
            return "你有梦想吗？"

    # 实例化
    person_egon = People("laoa", 10)
    person_dada = People("laob", 34)
    person_susan = People("xiaoa", 34)
    person_list = [person_dada, person_egon, person_susan]

    return render(request, "index.html",
        {
            "name": name,
            "i": i,
            "l": l,
            "d": d,  # 键对应的是模板里的名字，值对应的是上面定义的变量
            "person_egon": person_egon,
            "person_dada": person_dada,
            "person_list": person_list,
        }
    )

    # return render(request, "index.html", locals())
```

**注意：** 用`locals()`可以不用写上面的render了。不过用`locals()`，views里面用什么名，模板里面就得用什么名。

template/index.html示例：

```html
<h4>变量{{ z }}:深度查询</h4><hr>
<h3>{{ name }}</h3>
<p>{{ i }}</p>
<p>{{ l }}</p>
<p>{{ d }}</p>
<p>{{ l.0 }}</p>  <!-- 取单个值可通过句点符 -->
<p>{{ l.4 }}</p>
<p>{{ d.name }}</p>
<p>{{ d.age }}</p>
<p>{{ person_dada.name }}</p>
<p>{{ person_egon.age }}</p>
<p>{{ person_dada.dream }}</p>  <!-- .方法的时候，注意当前的方法是没有参数的 -->
<p>{{ person_list.2 }}</p>  <!-- 单个取值 -->
<p>{{ person_list.1.name }}</p>
```

**注意：**

1. 在模板上写变量的时候，相当于执行了print方法
2. 如果是方法，不能加括号，它会自动加括号，但是不支持传参数
3. 句点符也可以用来引用对象的方法（无参数方法）
4. `<h4>字典:{{ dic.name.upper }}</h4>`

### 模板语法之标签：语法为 `{% tag %}`

标签比变量更加复杂：一些在输出中创建文本，一些通过循环或逻辑来控制流程，一些加载其后的变量将使用到的额外信息到模版中。

一些标签需要开始和结束标签（例如`{% tag %} ... {% endtag %}`）。

#### 1. for标签

**注：循环序号可以通过`{{ forloop }}`显示**

```html
<h3>循环取值1</h3><hr>
{% for item in person_list %}
    <p>{{ item.name }}, {{ item.age }}</p>
{% endfor %}

<h3>循环取值2:倒序</h3><hr>
{% for item in person_list reversed %}
    <p>{{ forloop.counter }}----->{{ item.name }}, {{ item.age }}</p>
    <p>{{ forloop.counter0 }}----->{{ item.name }}, {{ item.age }}</p>
    <p>{{ forloop.revcounter }}----->{{ item.name }}, {{ item.age }}</p>
{% endfor %}

<h3>循环取值3：字典</h3><hr>
{% for k, v in d.items %}
    <p>{{ k }}, {{ v }}</p>
{% endfor %}
```

#### 2. for....empty

`for`标签带有一个可选的`{% empty %}`从句，以便在给出的组是空的或者没有被找到时，可以有所操作。

```html
{% for person in person_list %}
    <p>{{ person.name }}</p>
{% empty %}
    <p>sorry, no person here</p>
{% endfor %}
```

#### 3. if标签

`{% if %}`会对一个变量求值，如果它的值是"True"（存在、不为空、且不是boolean类型的false值），对应的内容块会输出。

```html
{% if i > 300 %}
    <p>大于{{ i }}</p>
{% elif i == 200 %}
    <p>等于{{ i }}</p>
{% else %}
    <p>小于{{ i }}</p>
{% endif %}
```

**注意：** if语句支持 `and`、`or`、`==`、`>`、`<`、`!=`、`<=`、`>=`、`in`、`not in`、`is`、`is not`判断，这些两边要加上空格。

#### 4. with

使用一个简单地名字缓存一个复杂的变量，当你需要使用一个"昂贵的"方法（比如访问数据库）很多次的时候是非常有用的。

```html
{% with dic.hobby.1 as a %}
    {{ a }}
    <p>aaaa</p>
    {{ a }}
{% endwith %}

<p>{{ person_list.2.name }}</p>
{% with name=person_list.2.name %}  <!-- 注意这个等于号两边不能有空格 -->
    <p>{{ name }}</p>
{% endwith %}
```

#### 5. csrf_token

这个标签用于跨站请求伪造保护。

提交数据的时候就会做安全机制，当你点击提交的时候会出现一个forbidden的错误，就是用setting配置里的csrf做安全机制的。

我们可以在form表单下面添加`{% csrf_token %}`来解决这个问题：

```html
<h3>csrf_token</h3>
<form action="/tag/" method="post">
    {% csrf_token %}
    <p><input type="text" name="haiyan"></p>
    <input type="submit">
</form>
```

### 模板语法之过滤器：语法 `{{obj|filter__name:param}}`

**后面只能传一个参数。**

**{{变量名|过滤器的名字:参数}}**

**过滤器本质是一个函数。**

#### 1. default

如果一个变量是false或者为空，使用给定的默认值。否则，使用变量的值。

```html
<p>default过滤器：{{ li|default:"如果显示为空，设置的解释性的内容" }}</p>
```

#### 2. length

返回值的长度。它对字符串和列表都起作用。

```html
{{ value|length }}
```

如果value是`['a', 'b', 'c', 'd']`，那么输出是4。

#### 3. filesizeformat

将值格式化为一个"人类可读的"文件尺寸（例如`'13 KB'`、`'4.1 MB'`、`'102 bytes'`等等）。
