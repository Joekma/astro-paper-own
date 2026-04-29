---
title: Cookie 和 Session 完全指南 - Web 身份认证技术
author: FjellOverflow
pubDatetime: 2024-08-13T00:00:00Z
modDatetime: 2026-04-22T00:00:00Z
featured: false
draft: false
tags:
  - Python
  - Web开发
  - docs
description: Cookie 和 Session 完全指南，深入讲解Web身份认证技术、状态管理与安全最佳实践。
---

# Cookie 和 Session 完全指南 - Web 身份认证技术

## 简介

Cookie 和 Session 是 Web 开发中用于保持用户状态和实现身份认证的核心技术，基于 HTTP 协议的无状态特性，服务器无法识别用户的身份，因此需要通过 Cookie 和 Session 机制来解决这个问题。

### 核心特性

- **Cookie**：客户端存储机制，以键值对形式存储在浏览器中
- **Session**：服务端存储机制，安全地在服务器上存储敏感数据
- **状态管理**：在多个 HTTP 请求之间维护用户状态
- **身份认证**：实现用户登录和授权功能
- **会话跟踪**：跟踪用户活动和会话生命周期
- **灵活存储**：支持多种存储后端（数据库、缓存、文件）

### 应用场景

- **用户认证**：Web 应用的登录/注销功能
- **购物车**：电商购物车的会话持久化
- **用户偏好**：记住用户设置和偏好
- **安全控制**：基于会话的访问控制和授权
- **数据分析**：跟踪用户行为和会话数据
- **个性化**：基于会话数据的定制化用户体验

## Cookie 工作原理

由服务器产生内容，浏览器收到请求后保存在本地；当浏览器再次访问时，浏览器会自动带上Cookie，这样服务器就能通过Cookie的内容来判断这个是"谁"了。

虽然Cookie在一定程度上解决了"保持状态"的需求，但由于Cookie本身最大支持4096字节，以及Cookie本身保存在客户端，可能被拦截或窃取，因此就需要有一种新的东西，它能支持更多的字节，并且保存在服务器，有较高的安全性，这就是Session。

基于HTTP协议的无状态特征，服务器根本就不知道访问者是"谁"。那么上述的Cookie就起到桥接的作用。

我们可以给每个客户端的Cookie分配一个唯一的id，这样用户在访问时，通过Cookie，服务器就知道来的人是"谁"。然后我们再根据不同的Cookie的id，在服务器上保存一段时间的私密资料，如"账号密码"等等。

### Cookie 与 Session 对比

| 特性 | Cookie | Session |
|------|--------|---------|
| **存储位置** | 客户端（浏览器） | 服务端（服务器） |
| **存储大小** | 最大 4096 字节 | 理论无限制 |
| **安全性** | 较低，易被窃取 | 较高，数据加密 |
| **访问速度** | 快，无需网络请求 | 较慢，需要网络请求 |
| **适用场景** | 非敏感数据 | 敏感数据 |

## 登录应用原理

前几节的介绍中我们已经有能力制作一个登陆页面，在验证了用户名和密码的正确性后跳转到后台的页面。但是测试后也发现，如果绕过登陆页面，直接输入后台的url地址也可以直接访问。这个显然是不合理的。其实我们缺失的就是Cookie和Session配合的验证。有了这个验证过程，我们就可以实现和其他网站一样必须登录才能进入后台页面了。

**认证机制**：每当我们使用一款浏览器访问一个登陆页面的时候，一旦我们通过了认证，服务器端就会发送一组随机唯一的字符串（假设是123abc）到浏览器端，这个被存储在浏览器端的东西就叫Cookie。而服务器端也会自己存储一下用户当前的状态，比如login=true，username=hahaha之类的用户信息。但是这种存储是以字典形式存储的，字典的唯一key就是刚才发给用户的唯一的Cookie值。

Session信息字典示例：

```json
{'123abc': {'login': true, 'username': 'hahaha'}}
```

因为每个Cookie都是唯一的，所以我们在电脑上换个浏览器再登陆同一个网站也需要再次验证。出于安全性的考虑，对于上面那个大字典不光key值123abc是被加密的，value值{'login':true,'username':'hahaha'}在服务器端也是一样被加密的。所以我们服务器上就算打开Session信息看到的也是类似与以下样子的东西：

```
{'123abc': dasdasdasd1231231da1231231}
```

## Cookie 使用

### 获取 Cookie

```python
request.COOKIES.get("islogin", None)  # 如果有就获取，没有就默认为None
```

### 设置 Cookie

```python
obj = redirect("/index/")
obj.set_cookie("islogin", True)  # 设置cookie值，注意这里的参数，一个是键，一个是值
obj.set_cookie("haiyan", "344", 20)  # 20代表过期时间
obj.set_cookie("username", username)
```

### 删除 Cookie

```python
obj.delete_cookie("cookie_key", path="/", domain=name)
```

### 登录认证示例

**需要注意几点：**

- 一共有三次请求
- 注意：form表单的action走的路径还是/login/
- 第一次请求：url: http://127.0.0.1:8080/login get请求
- 第二次请求：url: http://127.0.0.1:8080/login post请求 user password
- 第三次请求：url: http://127.0.0.1:8080/index post请求 携带着cookie的了
- 所以在index页面中就会取到cookie，因为此时的index里面已经有cookie了

**urls.py**

```python
from app01 import views

urlpatterns = [
    url(r'^admin/', admin.site.urls),
    url(r'^login/', views.login),
    url(r'^index/', views.index),
]
```

**views.py**

```python
from django.shortcuts import render, redirect, HttpResponse
from app01 import models

def login(request):
    if request.method == "POST":
        print("所有请求数据", request.POST)
        username = request.POST.get("username")
        password = request.POST.get("password")
        # 查看数据库中的用户名和密码，对比用户输入的是否是数据库中的值
        ret = models.UserInfo.objects.filter(username=username, password=password)
        if ret:  # 如果用户名和密码都正确，则登录成功
            print(request.COOKIES)
            # 由于http协议是无状态的，你这次登录完就不知道是谁登录了，当别人知道你的主页url，就都可以登录了。那样就没有隐私了
            # 这就得用到cookie了
            obj = redirect("/index/")
            obj.set_cookie("islogin", True)  # 设置cookie值
            obj.set_cookie("haiyan", "344", 20)  # 20代表过期时间
            obj.set_cookie("username", username)
            return obj
        else:
            return render(request, "login.html")
    else:
        return render(request, "login.html")

def index(request):
    is_login = request.COOKIES.get("islogin", None)  # 得到cookie，有就得到，没有就得到none
    if is_login:
        username = request.COOKIES.get("username")
        print(username)
        return render(request, "index.html", {"username": username})
    else:  # 如果没有拿到值，就一直在登录页面就进不去
        return redirect("/login/")
```

**models.py**

```python
class UserInfo(models.Model):
    username = models.CharField(max_length=32)
    password = models.CharField(max_length=32)
```

**login.html**

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width">
    <title>用户登录</title>
    <link rel="stylesheet" href="/static/bootstrap-3.3.7-dist/css/bootstrap.min.css">
    <script src="/static/bootstrap-3.3.7-dist/js/bootstrap.min.js"></script>
    <style>
        .c1 {
            margin-top: 100px;
        }
        .btn {
            width: 130px;
        }
        .c2 {
            margin-left: 40px;
        }
    </style>
</head>
<body>
<div class="container">
    <div class="row">
        <div class="c1 col-md-5 col-md-offset-3">
            <form class="form-horizontal" action="/login/" method="post" novalidate>
                {% csrf_token %}
                <div class="form-group">
                    <label for="username" class="col-sm-2 control-label">用户名</label>
                    <div class="col-sm-10">
                        <input type="email" class="form-control" id="username" placeholder="Email" name="username">
                    </div>
                </div>
                <div class="form-group">
                    <label for="password" class="col-sm-2 control-label">密码</label>
                    <div class="col-sm-10">
                        <input type="password" class="form-control" name="password" id="password" placeholder="Password">
                    </div>
                </div>
                <div class="form-group">
                    <div class="col-sm-offset-2 col-sm-10">
                        <button type="submit" class="btn btn-primary">登录</button>
                        <button type="submit" class="btn btn-success c2">注册</button>
                    </div>
                </div>
            </form>
        </div>
    </div>
</div>
</body>
</html>
```

**index.html**

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width">
    <title>Title</title>
</head>
<body>
<h1>hello {{ username }}</h1>
</body>
</html>
```

### Cookie 存储特点

**优点**：数据存储在客户端，减轻服务端的压力，提高网站的性能

**缺点**：安全性不高，在客户端很容易被查看或破解用户会话信息

## Session 使用

### 基本操作（需要掌握的）

**1、设置Session值**

```python
request.session["session_name"] = "admin"
```

**2、获取Session值**

```python
session_name = request.session["session_name"]
```

**3、删除Session值**

```python
del request.session["session_name"]  # 删除一组键值对
request.session.flush()  # 删除一条记录
```

**4、检测是否操作Session值**

```python
if "session_name" in request.session:
    # do something
```

### 其他操作

**5、get(key, default=None)**

```python
fav_color = request.session.get('fav_color', 'red')
```

**6、pop(key)**

```python
fav_color = request.session.pop('fav_color')
```

**7、keys()** - 获取所有键

**8、items()** - 获取所有键值对

**9、setdefault()** - 设置默认值

**10、flush()** - 删除当前的会话数据并删除会话的Cookie。这用于确保前面的会话数据不可以再次被用户的浏览器访问，例如，django.contrib.auth.logout() 函数中就会调用它。

**11、用户session的随机字符串**

```python
request.session.session_key

# 将所有Session失效日期小于当前日期的数据删除
request.session.clear_expired()

# 检查用户session的随机字符串在数据库中是否存在
request.session.exists("session_key")

# 删除当前用户的所有Session数据
request.session.delete("session_key")

request.session.set_expiry(value)
# 如果value是个整数，session会在此秒数后失效。
# 如果value是个datatime或timedelta，session就会在这个时间后失效。
# 如果value是0，用户关闭浏览器session就会失效。
# 如果value是None，session会依赖全局session失效策略。
```

## Session 原理分析

由于Cookie会把所有的信息都保存在客户端，也就是浏览器上，这样会导致不安全，所以引用了Session，但是只是单单的Session也不好用，必须Session和Cookie配合使用。

Session会把信息保存在服务端。

### Session 原理分析流程

```python
{"session_id": "dfhasdjfhkjlcn4352kjdsfhkjsd"}

if post:
    request.session["is_login"] = True
    request.session["user"] = username
    return redirect("/index/")
```

Django会做三件事：

1. 创建随机字符串，假如 s="sdgsdfg4565dfgsdfgsdf"

2. 在django-session表中，添加一条记录

django-session有三个字段，分别是：session_key，session_data，expire_data

SQL语句：

```sql
insert into django-session values (s, '{"IS_LOGON": True, "USER": egon}', 12321)
```

3. 给浏览器设置sessionID：

```python
obj.set_cookie("session_id", s)
```

执行完之后重定向：

```python
/home/  ---->  {"session_id": "fasdlkfjsakdl324ada2adhdjlka99"}
```

获取Session数据：

```python
request.session.get("IS_LOGON", None)
```

在django-session表中，进行查询：

```python
s = request.COOKIES.get("session_id")
select session_data from django-session where session_key = s
```

### Session 示例

**views.py**

```python
def log_in(request):
    if request.method == "POST":
        username = request.POST['user']
        password = request.POST['pwd']

        user = UserInfo.objects.filter(username=username, password=password)

        if user:
            # 设置session内部的字典内容
            request.session['is_login'] = 'true'
            request.session['username'] = username

            # 登录成功就将url重定向到后台的url
            return redirect('/backend/')

    # 登录不成功或第一次访问就停留在登录页面
    return render(request, 'login.html')

def backend(request):
    print(request.session, "------cookie")
    print(request.COOKIES, '-------session')

    """
    这里必须用读取字典的get()方法把is_login的value缺省设置为False，
    当用户访问backend这个url先尝试获取这个浏览器对应的session中的
    is_login的值。如果对方登录成功的话，在login里就已经把is_login
    的值修改为了True，反之这个值就是False的
    """

    is_login = request.session.get('is_login', False)
    # 如果为真，就说明用户是正常登陆的
    if is_login:
        # 获取字典的内容并传入页面文件
        cookie_content = request.COOKIES
        session_content = request.session

        username = request.session['username']

        return render(request, 'backend.html', locals())
    else:
        """
        如果访问的时候没有携带正确的session，
        就直接被重定向url回login页面
        """
        return redirect('/login/')

def log_out(request):
    """
    直接通过request.session['is_login']回去返回的时候，
    如果is_login对应的value值不存在会导致程序异常。所以
    需要做异常处理
    """
    try:
        # 删除is_login对应的value值
        del request.session['is_login']

        # OR---->request.session.flush()  # 删除django-session表中的对应一行记录

    except KeyError:
        pass

    # 点击注销之后，直接重定向回登录页面
    return redirect('/login/')
```

**Templates**

**login.html**

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Title</title>
</head>
<body>
<form action="/login/" method="post">
    <p>用户名: <input type="text" name="user"></p>
    <p>密码: <input type="password" name="pwd"></p>
    <p><input type="submit"></p>
</form>
</body>
</html>
```

**backend.html**

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Title</title>
</head>
<body>
<h3>hello {{ username }}</h3>
<a href="/logout/">注销</a>
</body>
</html>
```

## Session 存储配置

### 数据库配置（默认）

Django默认支持Session，并且默认是将Session数据存储在数据库中，即：django_session 表中。

**配置 settings.py**

```python
SESSION_ENGINE = 'django.contrib.sessions.backends.db'  # 引擎（默认）
SESSION_COOKIE_NAME = "sessionid"  # Session的cookie保存在浏览器上时的key，即：sessionid＝随机字符串（默认）
SESSION_COOKIE_PATH = "/"  # Session的cookie保存的路径（默认）
SESSION_COOKIE_DOMAIN = None  # Session的cookie保存的域名（默认）
SESSION_COOKIE_SECURE = False  # 是否Https传输cookie（默认）
SESSION_COOKIE_HTTPONLY = True  # 是否Session的cookie只支持http传输（默认）
SESSION_COOKIE_AGE = 1209600  # Session的cookie失效日期（2周）（默认）
SESSION_EXPIRE_AT_BROWSER_CLOSE = False  # 是否关闭浏览器使得Session过期（默认）
SESSION_SAVE_EVERY_REQUEST = False  # 是否每次请求都保存Session，默认修改之后才保存（默认）
```

### 缓存配置

**配置 settings.py**

```python
SESSION_ENGINE = 'django.contrib.sessions.backends.cache'  # 引擎
SESSION_CACHE_ALIAS = 'default'  # 使用的缓存别名（默认内存缓存，也可以是memcache）
SESSION_COOKIE_NAME = "sessionid"  # Session的cookie保存在浏览器上时的key
SESSION_COOKIE_PATH = "/"  # Session的cookie保存的路径
SESSION_COOKIE_DOMAIN = None  # Session的cookie保存的域名
SESSION_COOKIE_SECURE = False  # 是否Https传输cookie
SESSION_COOKIE_HTTPONLY = True  # 是否Session的cookie只支持http传输
SESSION_COOKIE_AGE = 1209600  # Session的cookie失效日期（2周）
SESSION_EXPIRE_AT_BROWSER_CLOSE = False  # 是否关闭浏览器使得Session过期
SESSION_SAVE_EVERY_REQUEST = False  # 是否每次请求都保存Session
```

### 文件配置

**配置 settings.py**

```bash
SESSION_ENGINE = 'django.contrib.sessions.backends.file'  # 引擎
SESSION_FILE_PATH = None  # 缓存文件路径，如果为None，则使用tempfile模块获取一个临时地址tempfile.gettempdir()
SESSION_COOKIE_NAME = "sessionid"  # Session的cookie保存在浏览器上时的key
SESSION_COOKIE_PATH = "/"  # Session的cookie保存的路径
SESSION_COOKIE_DOMAIN = None  # Session的cookie保存的域名
SESSION_COOKIE_SECURE = False  # 是否Https传输cookie
SESSION_COOKIE_HTTPONLY = True  # 是否Session的cookie只支持http传输
SESSION_COOKIE_AGE = 1209600  # Session的cookie失效日期（2周）
SESSION_EXPIRE_AT_BROWSER_CLOSE = False  # 是否关闭浏览器使得Session过期
SESSION_SAVE_EVERY_REQUEST = False  # 是否每次请求都保存Session
```

## 最佳实践

### 1. 安全性建议

#### Cookie 安全配置

```python
# 设置 Cookie 为 HttpOnly，防止 XSS 攻击
SESSION_COOKIE_HTTPONLY = True

# 设置 Cookie 为 Secure，只在 HTTPS 下传输
SESSION_COOKIE_SECURE = True

# 设置 Cookie 的 SameSite 属性
SESSION_COOKIE_SAMESITE = 'Lax'  # 或 'Strict'
```

#### Session 数据加密

```python
# 使用签名 Cookie 防止篡改
obj.set_signed_cookie('name', 'value', salt='your_salt')

# 获取签名 Cookie
name = request.get_signed_cookie('name', salt='your_salt')
```

### 2. 性能优化

#### 选择合适的存储后端

- **数据库**：适合小型应用，易于管理
- **缓存**：适合高并发应用，性能最佳
- **文件**：适合开发环境，简单易用

#### Session 过期策略

```python
# 设置 Session 过期时间
request.session.set_expiry(3600)  # 1小时后过期

# 浏览器关闭时过期
request.session.set_expiry(0)

# 使用全局过期策略
SESSION_AGE = 1209600  # 2周
```

### 3. 实用技巧

#### Cookie 操作最佳实践

```python
# 检查 Cookie 是否存在
if 'cookie_name' in request.COOKIES:
    value = request.COOKIES['cookie_name']

# 设置带路径的 Cookie
response.set_cookie('name', 'value', path='/app/')

# 设置带域名的 Cookie
response.set_cookie('name', 'value', domain='.example.com')
```

#### Session 操作最佳实践

```python
# 安全地获取 Session 值
value = request.session.get('key', default_value)

# 批量删除 Session 数据
request.session.flush()

# 检查 Session 是否存在
if request.session.exists(session_key):
    # 处理逻辑
```
