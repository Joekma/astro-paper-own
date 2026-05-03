---
title: Django框架(二) MTV模型简介
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-04-22T00:00:00.000+08:00
slug: django-framework-2-mtv
description: 'Django框架 (二) MTV模型简介'
tags:
  - Python
  - Django
category: Django
draft: false
language: zh-CN
---

## MTV模型

Django的MTV分别代表：

- **Model（模型）**：和数据库相关的，负责业务对象与数据库的对象（ORM）
- **Template（模板）**：放所有的html文件，模板语法目的是将变量（数据库的内容）如何巧妙地嵌入到html页面中
- **View（视图）**：负责业务逻辑，并在适当的时候调用Model和Template

此外，Django还有一个URL分发器。它的作用是将一个个URL的页面请求分别发给不同的Views处理，Views再调用相应的Model和Template
![image](https://images2017.cnblogs.com/blog/1184802/201710/1184802-20171020192615099-1822435931.png)

![image](https://images2017.cnblogs.com/blog/1184802/201710/1184802-20171020200746396-146438460.png)

## 编写路由

URL配置（URLconf）就像Django所支撑网站的目录。它的本质是URL与要为该URL调用的视图函数之间的映射表。

你就是以这种方式告诉Django，对于这个URL调用这段代码，对于那个URL调用那段代码。路由映射模块，主要完成url与views视图函数的映射。当一个url请求到来时，会按照这个模块中的url地址从上到下进行匹配，如果匹配成功，将执行映射试图中的函数；反之将返回404错误。

```python
urlpatterns = [
    url(正则表达式, views视图函数，参数，别名),
]
```

**参数说明：**

- 一个正则表达式字符串
- 一个可调用对象，通常为一个视图函数或一个指定视图函数路径的字符串
- 可选的要传递给视图函数的默认参数（字典形式）
- 一个可选的name参数

**注意：**
- 正则匹配中，如果带了括号，那么该括号中的内容会当作参数传递到对应的视图函数中去
- 别名，在文件路径发生变化时用处非常大

## URLconf的正则字符串参数

### 简单配置
```python

from django.conf.urls import url

from . import views

urlpatterns = [
    url(r'^articles/2003/$', views.special_case_2003),
    url(r'^articles/([0-9]{4})/$', views.year_archive),
    url(r'^articles/([0-9]{4})/([0-9]{2})/$', views.month_archive),
    url(r'^articles/([0-9]{4})/([0-9]{2})/([0-9]+)/$', views.article_detail),
]　

```
注意几点：
```

NOTE:
1、一旦匹配成功则不再继续
2、若要从URL 中捕获一个值，只需要在它周围放置一对圆括号。
3、不需要添加一个前导的反斜杠，因为每个URL 都有。例如，应该是^articles 而不是 ^/articles。
4、每个正则表达式前面的'r' 是可选的但是建议加上。

[[设置项是否开启URL访问地址后面不为/跳转至带有/的路径]]
APPEND_SLASH=True

```
**如果给路径命名了，那么对应的视图函数中，必须按照该命名作为形参**

### 别名

```python
urlpatterns = [
    url(r'^admin/', admin.site.urls),   # 系统生成的映射
    url(r'^reg/$', views.month_views, name='register')
]
```

而在访问的静态文件中：

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="x-ua-compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Title</title>
</head>
<body>
    <form method='post' action='{% register %}'>xxxx</form>
</body>
</html>
```

当我们后端的路径发生变化时，前端的页面不用改变任何代码，都能够正常访问。

### 路由应用分发

如果一个网站很多，有很多app应用，那么就需要很多路由分发。如果将所有的路由分发都放在urlconf文件下，这样会使得文件不易于管理，为此，我们可以给每一个app都创建一个urls.py文件，然后再urlconf中的urlpatterns中将该urls.py文件包含进来就行了。

```python
from django.conf.urls import include, url  # 导入全局url

urlpatterns = [
    url(r'^blog', include('blog.urls')),   # 将访问路径以blog开头的路径分发到blog下的urls.py模块里进行路由映射
]
```

这样在我们blog-app中的url中，存放所有关于blog的url分发工作。

```python
urlpatterns = [
    url(r'^2004/$', year_2004),
    url(r'^(\d{4})/$', year_query),
    url(r'^(\d{4})/(\d{2})$', year_query),
    url(r'^(?P<year>\d{4})/(?P<month>\d{2})$', year_query),
]
```

这样我们访问网站应该是：`http://localhost:8080/blog/2012/3` 前面都得带上app的名称。

## 编写业务处理逻辑三剑客

一个视图函数，简称视图，是一个简单的Python函数，它接受Web请求并且返回Web响应。响应可以是一张网页的HTML内容，一个重定向，一个404错误，一个XML文档，或者一张图片。任何东西都可以。无论视图本身包含什么逻辑，都要返回响应。代码写在哪里也无所谓，只要它在你的Python目录下面。 为了将代码放在某处，约定是将视图放置在项目或应用程序目录中的名为`views.py`的文件中。

views.py示例：

```python
from django.shortcuts import render, HttpResponse

# Create your views here.
def year(request):  # request参数请求所有的参数，这个参数一定要有
    return HttpResponse("ok")  # 每一个视图函数必须有return

def year2(request, year):
    print(year)
    return HttpResponse("hello")   # 返回的一定是一个字符串，如果你想return纯字符串，就用HttpResponse方法

def year_month(request, year, month):
    print(year, month)
    # 返回的是匹配的年和月拼接的结果
    return HttpResponse(year + month)

def year_month_hasname(request, month, year):
    print(year, month)
    return HttpResponse("month是：%s, year是：%s" % (month, year))
```

**注意：视图会返回一个`HttpResponse`对象，其中包含生成的响应。每个视图函数都负责返回一个`HttpResponse`对象。**

### HttpRequest对象

属性
```

path：       请求页面的全路径，不包括域名
method：     请求中使用的HTTP方法的字符串表示。全大写表示。例如
               if  req.method=="GET":
                         do_something()
               elif req.method=="POST":
                         do_something_else()
GET:         包含所有HTTP GET参数的类字典对象
POST：       包含所有HTTP POST参数的类字典对象
COOKIES:     包含所有cookies的标准Python字典对象；keys和values都是字符串。

FILES：      包含所有上传文件的类字典对象；FILES中的每一个Key都是<input type="file" name="" />标签中
             name属性的值，FILES中的每一个value同时也是一个标准的python字典对象，包含下面三个Keys：

             filename：      上传文件名，用字符串表示
             content_type:   上传文件的Content Type
             content：       上传文件的原始内容
user：       是一个django.contrib.auth.models.User对象，代表当前登陆的用户。如果访问用户当前
             没有登陆，user将被初始化为django.contrib.auth.models.AnonymousUser的实例。你
             可以通过user的is_authenticated()方法来辨别用户是否登陆：
             if req.user.is_authenticated();只有激活Django中的AuthenticationMiddleware
             时该属性才可用
session：    唯一可读写的属性，代表当前会话的字典对象；自己有激活Django中的session支持时该属性才可用。

```
方法
```

get_full_path()

```
注意：键值对的值是多个的时候,比如checkbox类型的input标签，select标签，需要用：
```

request.POST.getlist("hobby")

```
**request,它是一个对象。**  
**当中存储了请求信息，比如请求路径，请求方式，GET数据，POST数据…等等。**  
**必须要接收一个request参数。**  
**当你想返回一个html文件时，不是使用HttpResponse方法，而是使用render方法来渲染（打包）。**  
**不过本质上render最终还是使用了HttpResponse方法发送byte字节给浏览器的**

### **HttpResponse**

对于HttpRequest请求对象来说，是由django自动创建的，但是，HttpResponse响应对象就必须我们自己创建。每个view请求处理方法必须返回一个HttpResponse响应对象。HttpResponse类在django.http.HttpResponse。

**在HttpResponse对象上扩展的常用方法**

render(请求对象，'html文件和路径')方法，将指定页面渲染后返回给浏览器
```

from django.shortcuts import render

def test(request):
    return render(request,'index.html')   [[向用户显示一个html页面]]

```
### render 函数
```

render(request, template_name[, context]）
结合一个给定的模板和一个给定的上下文字典，并返回一个渲染后的 HttpResponse 对象。
参数：
     request： 用于生成响应的请求对象。
     template_name：要使用的模板的完整名称，可选的参数
     context：添加到模板上下文的一个字典。默认是一个空字典。如果字典中的某个值是可调用的，视图将在渲染模板之前调用它。
     content_type：生成的文档要使用的MIME类型。默认为DEFAULT_CONTENT_TYPE 设置的值。
     status：响应的状态码。默认为200。

```
下面为render官方源码，可以看出render最后也是返回了一个HttpResponse给webserver
```

def render(request, template_name, context=None, content_type=None, status=None, using=None):
    """
    Returns a HttpResponse whose content is filled with the result of calling
    django.template.loader.render_to_string() with the passed arguments.
    """
    content = loader.render_to_string(template_name, context, request, using=using)
    return HttpResponse(content, content_type, status)

```
细说render:

render方法主要是将从服务器提取的数据，填充到模板中，然后将渲染后的html静态文件返回给浏览器。这里一定要注意：render渲染的是模板，下面我们看看什么叫作模板
```

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="x-ua-compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Title</title>
    <style>
        li,ul,ol{  list-style: none;  }
        a{ text-decoration: none; }
    </style>
</head>
<body>
<ul>
    {% for book in list %}
        <li><a href="{{book.id}}">{{ book.btitle }}</a></li>
    {% endfor %}
</ul>
</body>
</html>

```css
上面{%%}之间包括的就是我们要从数据库取出的数据，进行填充。对于这样一个没有填充数据的html文件，浏览器是不能进行渲染的，所以，对于上述{%%}之间的内容先要被render进行渲染之后，才能发送给浏览器。总结一句话就是，render方法作用就是-----填坑

关于render如何填坑，下面举个例子
```python

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="x-ua-compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Title</title>
    <style>
        li,ul,ol{  list-style: none;  }
        a{ text-decoration: none; }
    </style>
</head>
<body>
<ul>
    {% for book in list %}
        <li><a href="{{book.id}}">{{ book.btitle }}</a></li>
    {% endfor %}

</ul>
</body>
</html>

def show(request, id):  
    book = BookInfo.objects.get(pk=id) [[从数据库中取出对应id的数据]]
    herolist = book.heroinfo_set.all()  
    context = {'list': herolist} # 将数据保存在list
    return render(request, 'booktest/show.html', context) [[通过render进行模板渲染]]

```
render_to_response('html文件和路径')方法，将指定页面渲染后返回给浏览器
```python

from django.shortcuts import render

def test(request):
    return render_to_reponse(request,'index.html')   [[向用户显示一个html页面]]

```
下面为render_to_reponse源码:
```python

def render_to_response(template_name, context=None, content_type=None, status=None, using=None):
    """
    Returns a HttpResponse whose content is filled with the result of calling
    django.template.loader.render_to_string() with the passed arguments.
    """
    content = loader.render_to_string(template_name, context, using=using)
    return HttpResponse(content, content_type, status)

```
### redirect函数

redirect('跳转路径和名称')方法，页面跳转
```python

from django.shortcuts import render,render_to_response,redirect
def test(request): 
　　return redirect('http://www.jxiou.com/') [[跳转页面]]

```
注意：render与redirect两点区别：

我们来模拟一个登陆网页，当我登陆成功后，跳转到另一个页面，分别用render与redirect来试试。

总结两者区别： 

第一，render返回一个登陆成功后的页面，刷新该页面将回复到跳转前页面。而redirect则不会

第二，render返回一个登陆成功页面，不会经过url路由分发系统，也就是说，不会执行跳转后url的试图函数。这样，返回的页面渲染不成功；而redirect是跳转到指定页面，当登陆成功后，会在url路由系统进行匹配，如果有存在的映射函数，就会执行对应的映射函数。

## 模版层

**python的模板：HTML代码＋模板语法**

**模版包括在使用时会被值替换掉的 变量，和控制模版逻辑的 标签**
```python

def current_time(req):
    # =====原始的视图函数
    # import datetime
    # now=datetime.datetime.now()
    # html="<html><body>现在时刻：<h1>%s.</h1></body></html>" %now

    # ====django模板修改的视图函数
    # from django.template import Template,Context
    # now=datetime.datetime.now()
    # t=Template('<html><body>现在时刻是:<h1>{{current_date}}</h1></body></html>')
    # [[t]]=get_template('current_datetime.html')
    # c=Context({'current_date':str(now)})
    # html=t.render(c)
    #
    # return HttpResponse(html)

    [[另一种写法]](推荐)
    import datetime
    now=datetime.datetime.now()
    return render(req, 'current_datetime.html', {'current_date':str(now)[:19]})

```
**模板语法： 目的是将变量（数据库的内容）如何巧妙的嵌入到html页面中(就不用之前我们用的字符串拼接了)**

在 Django 模板中遍历复杂数据结构的关键是句点字符 .

语法：
```json

{{var_name}}   

```
**view.py**
```python

def index(request):
    import datetime
    s="hello"
    l=[111,222,333]    # 列表
    dic={"name":"yuan","age":18}  # 字典
    date = datetime.date(1993, 5, 2)   # 日期对象
 
    class Person(object):
        def __init__(self,name):
            self.name=name
 
    person_yuan=Person("yuan")  # 自定义类对象
    person_egon=Person("egon")
    person_alex=Person("alex")
 
    person_list=[person_yuan,person_egon,person_alex]
    return render(request,"index.html",{"l":l,"dic":dic,"date":date,"person_list":person_list})　

```
**template：**
```css

<h4>{{s}}</h4>
<h4>列表:{{ l.0 }}</h4>
<h4>列表:{{ l.2 }}</h4>
<h4>字典:{{ dic.name }}</h4>
<h4>日期:{{ date.year }}</h4>
<h4>类对象列表:{{ person_list.0.name }}</h4>

```
注意：句点符也可以用来引用对象的方法(无参数方法)。
```css

<h4>字典:{{ dic.name.upper }}</h4>

```
settings.py设置模板文件夹

settings.py文件中有TEMPLATES变量，它是一个列表，列表中又存放了一个字典，其中一个键值对   
'DIRS':[os.path.join(BASE_DIR, 'templates')]   
效果就是默认设置了模板目录是使用默认的项目文件夹下的templates目录。   
如果有特殊需要修改的就是在此改动。   
另外django有一个好处，代码更改之后，一般无需重启web服务，它会自动加载最新代码。
```css

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [os.path.join(BASE_DIR, 'templates')]
        ,
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

```
##  使用静态文件

将html文件返回给用户还不够，前端三大块，HTML、CSS、JS还有各种插件等，完整齐全才是一个好看的页面。在django中，一般将静态文件放在static目录中。接下来，在项目根目录下新建一个static目录。   
同时，我还在此目录下建立起js，css，img子目录和相关文件：

static这个静态目录名和Django默认设置的静态目录名别名一致，   
在settings.py中可找到相关设置项，就是在结尾处再添加上新的一行表示告诉Django静态目录的路径：
```bash

# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/2.0/howto/static-files/

STATIC_URL = '/static/'
# STATIC_URL表示的是引用别名（指针），不是具体的目录
# 可以改成你想指定的名字，但是在相应的引用地方必須和它对应到

# 增加以下一段表示设置静态目录的路径
STATICFILES_DIRS = (
    os.path.join(BASE_DIR, 'static'),
)
# 真实目录名不要在html中写死，而是写成别名引用，
# 如此，目录名就算有改动也只需改动此处即可。
# 另外，由于此行是一个元组，别忘了后面还需加个逗号。　

```
同理，在html文件中引用静态文件，例如jquery.js文件如下：
```html

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Title</title>
</head>
<body>
    {# 由两个大括号括起来里面加个变量名，相当于是字典的键名，是django用于占位输出的语法 #}
    <h3>当前时间：{{ ctime }}</h3>
    <script src="/static/js/jquery.js"></script>
</body>
</html>　

```
主要看`<script src="/static/js/jquery.js"></script>`这一行，里面的路径并没有写死，而是使用了/static/来代指了真实的静态目录

## 接收用户发送的数据

至此，我们做到了将一个要素齐全的HTML文件返还给了用户浏览器。   
但这还不够，因为web服务器和用户之间还没有动态交互。   
下面我们来设计一个login页面，上面建立一个表单，让用户输入用户名和密码，提交给login   
这个url，服务器将接收到这些数据。
```html

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>登录</title>
</head>
<body>
    <form action="" method="post">
        {# 注意Django中有一个跨站请求保护机制，所以需要加以下一行 #}
        {% csrf_token %}
        用户名：<input type="text" name="user" />
        密码：<input type="password" name="pwd" />
        <input type="submit" value="提交" />
    </form>
</body>
</html>

```
这其中牵涉到一个csrf的防护机制

CSRF百度百科：CSRF（Cross-site request forgery）跨站请求伪造，也被称为“One Click Attack”或者Session Riding，通常缩写为CSRF或者XSRF，是一种对网站的恶意利用。尽管听起来像跨站脚本（XSS），但它与XSS非常不同，XSS利用站点内的信任用户，而CSRF则通过伪装来自受信任用户的请求来利用受信任的网站。与XSS攻击相比，CSRF攻击往往不大流行（因此对其进行防范的资源也相当稀少）和难以防范，所以被认为比XSS更具危险性。  
假如没有加{% csrf_token %}这一行防护，运行时将会报错

urls.py中`urlpatterns`添加路由条目： 
```

path('login/', views.login),

```
views.py中添加login函数
```python

def login(request):
    if request.method=="POST":
        username = request.POST.get("user", None)
        password = request.POST.get("pwd", None)
    print("用户名：", username,"密码", password)
    return render(request, "login.html")

```
此逻辑处理将会在pycharm中可以看到用户输入的用户名密码。

运行效果如下：   
html页面效果：   
![image](https://www.tielemao.com/wp-content/uploads/2018/06/django_login.jpg)

pycharm后端效果：   
![image](https://www.tielemao.com/wp-content/uploads/2018/06/django_post.jpg)

pycharm中可以看到提交后的post请求数据后端都获取到了

## 返回动态页面

我们收到了用户的数据，但返回给用户的依然是个静态页面，通常页面会根据用户的数据，进行处理后在返回给用户。   
django采用自己的模板语言，类似jinja2，可根据提供的数据，替换掉HTML中的相应部分。

例：views.py文件修改如下：
```python

# 创建一个用户信息表，预设了两个数据，将返回给浏览器展示给用户
user_list = [
    {"user":"tielemao", "pwd":"12345"},
    {"user":"LiLei", "pwd":"abc123"},
]
def login(request):
    if request.method=="POST":
        username = request.POST.get("user", None)
        password = request.POST.get("pwd", None)
        temp = {"user":username, "pwd":password}
        user_list.append(temp)
    return render(request, "login.html", {"data":user_list})
# render接收的第三个参数是后台返回给浏览器的数据，一个字典。
# data是字典的键，是你在login.html中自定义的指针名字，对应引用值。

```
而login.html相应修改：
```html

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>登录</title>
</head>
<body>
    <form action="" method="post">
        {# 注意Django中有一个跨站请求保护机制，所以需要加以下一行 #}
        {% csrf_token %}
        用户名：<input type="text" name="user" />
        密码：<input type="password" name="pwd" />
        <input type="submit" value="提交" />
    </form>

    <h2>用户列表</h2>
    <table border="1">
        <thead>
            <th>用户名</th>
            <th>密码</th>
        </thead>
        <tbody>
            {% for line in data %}
            <tr>
                <td>{{ line.user }}</td>
                <td>{{ line.pwd }}</td>
            </tr>
            {% endfor %}
        </tbody>
    </table>
</body>
</html>

```
login.html中利用for循环将data(引用）迭代填入数据到表格。

效果就是用户列表会随着提交的数据而发生变化，算是一个简单的动态页面， 和用户的交户过程

##  使用数据库

使用mysql的步骤
```python

orm连接mysql步骤：
0 手动创建出数据库：0107
1 在settings中配置：
'default': {
	# 这些key必须都是大写
	'ENGINE': 'django.db.backends.mysql',
	# 数据库名字
	'NAME': '0107',
	'HOST':'127.0.0.1',
	'PORT':3306,
	'USER':'root',
	# 'PASSWORD':''
	}
2 再app的init文件中写：
　　import pymysql
　　pymysql.install_as_MySQLdb()
3 在models中创建类，类中写字段
　　class UserInfo(models.Model):
	id=models.AutoField(primary_key=True)
　　　　 name=models.CharField(max_length=32)
	pwd=models.CharField(max_length=32)
4 把表同步到数据库
　　[[数据库表并没有同步到数据库，只是在migrations内做了一个记录]]
　　-python3 manage.py makemigrations
　　[[才将数据表同步到数据库]]
　　-python3 mangae.py migrate

```
虽然和用户交互得很好，但并没有保存任何数据，页面一旦关闭，或服务器重启，一切都将回到原始状态。   
使用数据库是正常最常见的，django通过自带的ORM框架操作数据库，并且自带轻量级的sqlite3数据库。这次我们先来使用sqlite数据库来演示，后面再学习详细使用mysql。   
首先是注册app，不进行这一步的话django不会知道该给哪个app创建表。

在settings.py中注册你的app:
```bash

# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'app01.apps.App01Config',
]

```
例，因为我之前执行了创建应用的命令，django2.06版本自动在创建应用的同时就帮我注册了app,就是上面代码中的app01.apps.App01Config。如果重复注册一个app01，会在运行python manage.py makemigrations命令的时候报错django.core.exceptions.ImproperlyConfigured: Application labels aren't unique, duplicates: app01

然后在settings中，配置数据库相关的参数，这次使用自带的sqlite，不需要修改
```css

# Database
# https://docs.djangoproject.com/en/2.0/ref/settings/#databases

DATABASES = {
'default': {
'ENGINE': 'django.db.backends.sqlite3',
'NAME': os.path.join(BASE_DIR, 'db.sqlite3'),
}
}

```
编辑models.py，也就是MTV中的M
```python

from django.db import models

# Create your models here.

# 固定继承models.Model这个类
class UserInfo(models.Model):
    id = models.AutoField(primary_key=True)
    user = models.CharField(max_length=32)
    pwd = models.CharField(max_length=32)

```
以上创建了三个字段，分别保存id，用户名和密码。

将models中的类映射到数据库中要输入两条命令

第一条命令
```

python manage.py makemigrations
  
注：migration翻译为迁移
注意此时运行完此命令只是翻译了了sql语句，还没有真正将sql语句实行到数据库中

```
运行结果
```yaml

E:\Django\tielemao>python manage.py makemigrations
Migrations for 'app01':
  app01\migrations\0001_initial.py
    - Create model UserInfo

```
第二条命令
```

* `python manage.py migrate`
* 此命令执行后才是真正在相应的数据库中创建好了表。
* 同时还会将diango一些认为要创建的表创建上。

```
运行结果
```yaml

E:\Django\tielemao>python manage.py migrate
Operations to perform:
  Apply all migrations: admin, app01, auth, contenttypes, sessions
Running migrations:
  Applying contenttypes.0001_initial... OK
  Applying auth.0001_initial... OK
  Applying admin.0001_initial... OK
  Applying admin.0002_logentry_remove_auto_add... OK
  Applying app01.0001_initial... OK
  Applying contenttypes.0002_remove_content_type_name... OK
  Applying auth.0002_alter_permission_name_max_length... OK
  Applying auth.0003_alter_user_email_max_length... OK
  Applying auth.0004_alter_user_username_opts... OK
  Applying auth.0005_alter_user_last_login_null... OK
  Applying auth.0006_require_contenttypes_0002... OK
  Applying auth.0007_alter_validators_add_error_messages... OK
  Applying auth.0008_alter_user_username_max_length... OK
  Applying auth.0009_alter_user_last_name_max_length... OK
  Applying sessions.0001_initial... OK

```
使用sqlite3作为数据库的话，现在可以在项目根目录下看到有`db.sqlite3`文件

可以使用查看sqlite文件的软件连接查看该数据库验证。

**例如使用navicat连接sqlite：**  
![image](https://www.tielemao.com/wp-content/uploads/2018/06/natcat_sqlite3.jpg)  
![image](https://www.tielemao.com/wp-content/uploads/2018/06/django-sqlite3.jpg)

修改views.py中的业务逻辑如下
```python

from django.shortcuts import render
# 导入models文件
from app01 import models

def login(request):
    if request.method=="POST":
        username = request.POST.get("user", None)
        password = request.POST.get("pwd", None)
        # 添加数据到数据库
        models.UserInfo.objects.create(user=username, pwd=password)
    # 从数据库中读取所有数据
    user_list = models.UserInfo.objects.all()

    return render(request, "login.html", {"data":user_list})
# render接收的第三个参数是后台返回给浏览器的数据，一个字典。
# data是字典的键，是你在login.html中自定义的指针名字，对应引用值。

```
重启web服务，刷新浏览器页面，之后和用户交互的数据都能保存到数据库中。  
任何时候都可以从数据库中读取数据，展示到页面上

![image](https://www.tielemao.com/wp-content/uploads/2018/06/django-sqlite_login.jpg)

利用pycharm自带的数据库工具也可以查看和操作数据库，不过要下载对应数据库的驱动

![image](https://img2018.cnblogs.com/blog/1330620/201901/1330620-20190108171323088-624391882.png)

![image](https://img2018.cnblogs.com/blog/1330620/201901/1330620-20190108171413391-1531357180.png)

这样操作数据库也非常方便

至此，一个要素齐全，主体框架展示清晰的简单django项目完成了，最后分析一下Django的请求生命周期。

## Django请求生命周期

![image](https://img2024.cnblogs.com/blog/1330620/202408/1330620-20240813135725470-1579825815.png)

补充：什么是根目录
```

就是没有路径，只有域名、。url(r'^$')

```
补充一张关于wsgiref模块的图片

![image](https://images2017.cnblogs.com/blog/1184802/201710/1184802-20171020214238037-821302404.png)

---
