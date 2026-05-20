---
title: Django Form 组件详解
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-04-22T00:00:00.000+08:00
slug: django-component-2-form
featured: false
draft: false
series: django
seriesOrder: 16
tags:
  - Python
  - Django
  - Form
description: "深入讲解Django Form组件的数据校验和模板渲染功能。"
---

## Forms组件概述

Django提供的用于数据校验和模板渲染的组件。

**使用步骤：**

1. 在项目中创建一个py文件
2. 写一个类继承Form
3. 在类中写属性，写的属性就是要校验的字段
4. 使用：生成一个你写的类的对象myform，把要校验的数据（字典），传到对象中：`MyForm(字典)`
5. `myform.is_valid()`是True表示所有字段都通过校验
6. `myform.cleaned_data`：是一个字典，所有通过校验的数据放在里面
7. `myform.errors`：是一个字典，所有的错误字段的信息

**在模板中：**

```html
{{ myform.name }}
{% for item in myform %}
    {{ item.label }}:{{ item }}
{% endfor %}
<!-- myform.as_table/as_p/as_ul（不推荐使用） -->
```

### Forms组件的渲染错误信息

在模板中：`<span>{{ foo.errors.0 }}</span>`

### Forms使用bootstrap样式

```python
widget=widgets.EmailInput(attrs={'class': 'form-control'})
```

### 全局和局部钩子函数

AOP：面向切面编程

**局部钩子函数**（再校验name）：

```python
def clean_name(self):
    # 从cleaned_data中取出字段的值
    name = self.cleaned_data.get('name')
    # 校验是否以sb开头
    if name.startswith('sb'):
        raise ValidationError('不能以sb开头')
    else:
        return name
```

**全局钩子函数**：

```python
def clean(self):
    pwd = self.cleaned_data.get('pwd')
    re_pwd = self.cleaned_data.get('re_pwd')
    if pwd == re_pwd:
        # 正确，返回self.cleaned_data
        return self.cleaned_data
    else:
        # 校验失败，抛异常
        raise ValidationError('两次密码不一致')
```

## 校验字段功能

针对一个实例：注册用户讲解。

### 模型 models.py

```python
class UserInfo(models.Model):
    name = models.CharField(max_length=32)
    pwd = models.CharField(max_length=32)
    email = models.EmailField()
```

### 模版文件

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Title</title>
</head>
<body>

<form action="" method="post">
    {% csrf_token %}
    <div>
        <label for="user">用户名</label>
        <p><input type="text" name="name" id="name"></p>
    </div>
    <div>
        <label for="pwd">密码</label>
        <p><input type="password" name="pwd" id="pwd"></p>
    </div>
    <div>
        <label for="r_pwd">确认密码</label>
        <p><input type="password" name="r_pwd" id="r_pwd"></p>
    </div>
    <div>
        <label for="email">邮箱</label>
        <p><input type="text" name="email" id="email"></p>
    </div>
    <input type="submit">
</form>

</body>
</html>
```

### 视图函数

```python
# forms组件
from django.forms import widgets

wid_01 = widgets.TextInput(attrs={"class": "form-control"})
wid_02 = widgets.PasswordInput(attrs={"class": "form-control"})

class UserForm(forms.Form):
    name = forms.CharField(max_length=32, widget=wid_01)
    pwd = forms.CharField(max_length=32, widget=wid_02)
    r_pwd = forms.CharField(max_length=32, widget=wid_02)
    email = forms.EmailField(widget=wid_01)
    tel = forms.CharField(max_length=32, widget=wid_01)

def register(request):
    if request.method == "POST":
        form = UserForm(request.POST)
        if form.is_valid():
            print(form.cleaned_data)       # 所有干净的字段以及对应的值
        else:
            print(form.cleaned_data)       #
            print(form.errors)             # ErrorDict: {"校验错误的字段": ["错误信息",]}
            print(form.errors.get("name")) # ErrorList ["错误信息",]
        return HttpResponse("OK")

    form = UserForm()
    return render(request, "register.html", locals())
```

## 渲染标签功能

### 渲染方式1

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Title</title>
    <!-- 最新版本的 Bootstrap 核心 CSS 文件 -->
    <link rel="stylesheet" href="https://cdn.bootcss.com/bootstrap/3.3.7/css/bootstrap.min.css" integrity="sha384-BVYiiSIFeK1dGmJRAkycuHAHRg32OmUcww7on3RYdg4Va+PmSTsz/K68vbdEjh4u" crossorigin="anonymous">
</head>
<body>
<h3>注册页面</h3>
<div class="container">
    <div class="row">
        <div class="col-md-6 col-lg-offset-3">

            <form action="" method="post">
                {% csrf_token %}
                <div>
                    <label for="">用户名</label>
                    {{ form.name }}
                </div>
                <div>
                    <label for="">密码</label>
                    {{ form.pwd }}
                </div>
                <div>
                    <label for="">确认密码</label>
                    {{ form.r_pwd }}
                </div>
                <div>
                    <label for="">邮箱</label>
                    {{ form.email }}
                </div>

                <input type="submit" class="btn btn-default pull-right">
            </form>
        </div>
    </div>
</div>

</body>
</html>
```

### 渲染方式2

```html
<form action="" method="post">
    {% csrf_token %}

    {% for field in form %}
        <div>
            <label for="">{{ field.label }}</label>
            {{ field }}
            <span>{{ field.errors.0 }}</span>
        </div>
    {% endfor %}

    <input type="submit" class="btn btn-default">
</form>
```

### 渲染方式3

```html
<form action="" method="post">
    {% csrf_token %}

    {{ form.as_p }}

    <input type="submit" class="btn btn-default">
</form>
```

## 常用字段类型

```python
forms.CharField()                # 字符串类型
forms.IntegerField()             # 整数类型
forms.EmailField()               # 邮箱类型
forms.URLField()                 # URL类型
forms.IPAddressField()           # IP地址类型
forms.GenericIPAddressField()     # 通用IP地址类型
forms.DateField()                # 日期类型
forms.DateTimeField()            # 日期时间类型
forms.TimeField()                # 时间类型
forms.RegexField()               # 正则表达式类型
forms.FileField()                # 文件上传类型
forms.ImageField()               # 图片上传类型
forms.ChoiceField()              # 选择类型
forms.MultipleChoiceField()      # 多选类型
```

## 常用参数

```python
required=True                   # 是否允许为空
widget=widgets.TextInput(attrs={'class': 'form-control'})  # 前端样式
label='用户名'                   # 标签
help_text='帮助信息'             # 帮助信息
error_messages={'required': '不能为空'}  # 错误信息
validators=[]                    # 正则验证
```

## 完整示例

### forms.py

```python
from django import forms
from django.core.validators import RegexValidator

class LoginForm(forms.Form):
    username = forms.CharField(
        required=True,
        min_length=6,
        max_length=18,
        label='用户名',
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': '请输入用户名'}),
        error_messages={
            'required': '用户名不能为空',
            'min_length': '用户名至少6位',
            'max_length': '用户名最多18位',
        }
    )

    password = forms.CharField(
        required=True,
        min_length=6,
        label='密码',
        widget=forms.PasswordInput(attrs={'class': 'form-control', 'placeholder': '请输入密码'}),
        error_messages={
            'required': '密码不能为空',
            'min_length': '密码至少6位',
        }
    )

    # 局部钩子：校验用户名
    def clean_username(self):
        username = self.cleaned_data.get('username')
        if username.startswith('admin'):
            raise forms.ValidationError('用户名不能以admin开头')
        return username

    # 全局钩子：校验密码
    def clean(self):
        password = self.cleaned_data.get('password')
        password2 = self.cleaned_data.get('password2')
        if password and password2 and password != password2:
            raise forms.ValidationError('两次密码不一致')
        return self.cleaned_data
```

### views.py

```python
def login(request):
    if request.method == 'POST':
        form = LoginForm(request.POST)
        if form.is_valid():
            # 通过校验，获取数据
            username = form.cleaned_data.get('username')
            password = form.cleaned_data.get('password')
            # 进行登录逻辑处理
            return HttpResponse('登录成功')
        else:
            # 未通过校验，form.errors包含错误信息
            return render(request, 'login.html', {'form': form})
    else:
        form = LoginForm()
        return render(request, 'login.html', {'form': form})
```

### login.html

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>登录</title>
    <link rel="stylesheet" href="https://cdn.bootcss.com/bootstrap/3.3.7/css/bootstrap.min.css">
</head>
<body>
<div class="container">
    <div class="row">
        <div class="col-md-6 col-md-offset-3">
            <h2>登录</h2>
            <form action="" method="post" novalidate>
                {% csrf_token %}
                <div class="form-group">
                    <label>{{ form.username.label }}</label>
                    {{ form.username }}
                    <span class="help-block text-danger">{{ form.username.errors.0 }}</span>
                </div>
                <div class="form-group">
                    <label>{{ form.password.label }}</label>
                    {{ form.password }}
                    <span class="help-block text-danger">{{ form.password.errors.0 }}</span>
                </div>
                <button type="submit" class="btn btn-primary">登录</button>
            </form>
        </div>
    </div>
</div>
</body>
</html>
```