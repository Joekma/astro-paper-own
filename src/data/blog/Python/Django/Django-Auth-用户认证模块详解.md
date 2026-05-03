---
title: Django Auth 用户认证模块详解
author: 程序员
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-04-22T00:00:00.000+08:00
slug: django-component-4-auth
featured: false
draft: false
tags:
  - Python
  - Django
  - 用户认证
description: "深入讲解Django Auth用户认证模块的使用方法和实践技巧。"
---

## Auth模块概述

Auth模块是Django自带的用户认证模块。

我们在开发一个网站的时候，无可避免的需要设计实现网站的用户系统。此时我们需要实现包括用户注册、用户登录、用户认证、注销、修改密码等功能。

Django作为一个完美主义者的终极框架，当然也会想到用户的这些痛点。它内置了强大的用户认证系统--auth，它默认使用auth_user表来存储用户数据。

### Auth模块主要功能

1. Django自带的用户认证模块，可以快速的实现登录、注销、修改密码等
2. 扩展auth表，需要继承AbstractUser
3. 一定不要忘记在setting中配置：`AUTH_USER_MODEL = "app名.UserInfo"`
4. 它提供的功能

### 常用功能

```python
from django.contrib.auth import authenticate, login, logout

# 用户认证
user = authenticate(username='lqz', password='123')

# 用户一旦认证通过，调用login(request, user)
# 以后从request.user中就能取出当前登录人对象

# 退出
logout(request)
# request.user就是匿名用户

# 校验是否通过认证（是否登录）
request.user.is_authenticated()

# 创建普通用户
User.objects.create_user(username='lqz')

# 创建超级用户
User.objects.create_superuser(username='lqz', password='123')

# 修改密码
user.set_password(new_password)
# 一定要记住save

# 校验密码
user.check_password(password)

# 登录认证装饰器（没有登录的时候跳转）
@login_required(login_url='/login/')

# 全局配置（在setting中配置）
LOGIN_URL = '/login/'
```

### 常用属性

- `is_staff`：用户是否拥有网站的管理权限
- `is_active`：是否允许用户登录，设置为False，可以在不删除用户的前提下禁止用户登录

## auth模块常用方法

```python
from django.contrib import auth
```

### authenticate()

提供了用户认证功能，即验证用户名以及密码是否正确，一般需要username、password两个关键字参数。

如果认证成功（用户名和密码正确有效），便会返回一个User对象。

authenticate()会在该User对象上设置一个属性来标识后端已经认证了该用户，且该信息在后续的登录过程中是需要的。

**用法：**

```python
user = authenticate(username='username', password='password')
```

### login(HttpRequest, user)

该函数接受一个HttpRequest对象，以及一个经过认证的User对象。

该函数实现一个用户登录的功能。它本质上会在后端为该用户生成相关session数据。

**用法：**

```python
from django.contrib.auth import authenticate, login

def my_view(request):
    username = request.POST['username']
    password = request.POST['password']
    user = authenticate(username=username, password=password)
    if user is not None:
        login(request, user)
        # Redirect to a success page.
        ...
    else:
        # Return an 'invalid login' error message.
        ...
```

### logout(request)

该函数接受一个HttpRequest对象，无返回值。

当调用该函数时，当前请求的session信息会全部清除。该用户即使没有登录，使用该函数也不会报错。

**用法：**

```python
from django.contrib.auth import logout

def logout_view(request):
    logout(request)
    # Redirect to a success page.
```

### is_authenticated()

用来判断当前请求是否通过了认证。

**用法：**

```python
def my_view(request):
    if not request.user.is_authenticated():
        return redirect('%s?next=%s' % (settings.LOGIN_URL, request.path))
```

### login_required()

auth给我们提供的一个装饰器工具，用来快捷的给某个视图添加登录校验。

**用法：**

```python
from django.contrib.auth.decorators import login_required

@login_required
def my_view(request):
    ...
```

若用户没有登录，则会跳转到django默认的登录URL '/accounts/login/' 并传递当前访问url的绝对路径（登陆成功后，会重定向到该路径）。

如果需要自定义登录的URL，则需要在settings.py文件中通过LOGIN_URL进行修改：

```python
LOGIN_URL = '/login/'  # 这里配置成你项目登录页面的路由
```

### create_user()

auth提供的一个创建新用户的方法，需要提供必要参数（username、password）等。

**用法：**

```python
from django.contrib.auth.models import User

user = User.objects.create_user(username='用户名', password='密码', email='邮箱', ...)
```

### create_superuser()

auth提供的一个创建新的超级用户的方法，需要提供必要参数（username、password）等。

**用法：**

```python
from django.contrib.auth.models import User

user = User.objects.create_superuser(username='用户名', password='密码', email='邮箱', ...)
```

### check_password(password)

auth提供的一个检查密码是否正确的方法，需要提供当前请求用户的密码。

密码正确返回True，否则返回False。

**用法：**

```python
ok = user.check_password('密码')
```

### set_password(password)

auth提供的一个修改密码的方法，接收要设置的新密码作为参数。

**注意：** 设置完一定要调用用户对象的save方法！！！

**用法：**

```python
user.set_password(password='')
user.save()

@login_required
def set_password(request):
    user = request.user
    err_msg = ''
    if request.method == 'POST':
        old_password = request.POST.get('old_password', '')
        new_password = request.POST.get('new_password', '')

        # 校验旧密码
        if user.check_password(old_password):
            user.set_password(new_password)
            user.save()
            return redirect('/login/')
        else:
            err_msg = '旧密码错误'

    return render(request, 'set_password.html', {'err_msg': err_msg})
```

## 扩展auth_user表

如果需要扩展auth_user表，可以继承AbstractUser模型：

```python
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    phone = models.CharField(max_length=11, null=True, blank=True)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)

    class Meta:
        db_table = 'user'
```

然后在settings.py中配置：

```python
AUTH_USER_MODEL = 'app名.User'
```

## 完整登录示例

### views.py

```python
from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User

def login_view(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')

        user = authenticate(username=username, password=password)
        if user:
            login(request, user)
            return redirect('/index/')
        else:
            return render(request, 'login.html', {'error': '用户名或密码错误'})

    return render(request, 'login.html')

def logout_view(request):
    logout(request)
    return redirect('/login/')

@login_required(login_url='/login/')
def index_view(request):
    return render(request, 'index.html', {'user': request.user})

def register_view(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        password2 = request.POST.get('password2')
        email = request.POST.get('email')

        if password != password2:
            return render(request, 'register.html', {'error': '两次密码不一致'})

        if User.objects.filter(username=username).exists():
            return render(request, 'register.html', {'error': '用户名已存在'})

        User.objects.create_user(username=username, password=password, email=email)
        return redirect('/login/')

    return render(request, 'register.html')
```

### urls.py

```python
from django.urls import path
from . import views

urlpatterns = [
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('index/', views.index_view, name='index'),
    path('register/', views.register_view, name='register'),
]
```

### login.html

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>登录</title>
</head>
<body>
    <form action="" method="post">
        {% csrf_token %}
        用户名：<input type="text" name="username"><br>
        密码：<input type="password" name="password"><br>
        <button type="submit">登录</button>
    </form>
    {% if error %}
        <p style="color: red;">{{ error }}</p>
    {% endif %}
</body>
</html>
```