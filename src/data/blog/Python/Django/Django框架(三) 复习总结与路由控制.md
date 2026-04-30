---
title: Django框架(三) 复习总结与路由控制
author: 程序员
pubDatetime: 2024-08-13T00:00:00.000+08:00
updated: 2026-04-22T00:00:00.000+08:00
slug: django-framework-3-routing
description: 'Django框架 (三) 复习总结与路由控制'
tags:
  - Python
  - Django
category: Django
draft: false
language: zh-CN
---

## 知识点回顾

### MTV模型

- **model**：模型，和数据库相关的
- **template**：模板，存放html文件，模板语法（目的是将变量如何巧妙地嵌入到HTML页面中）
- **views**：视图函数
- **urls**：url路径与视图函数的映射关系，可以不是一一对应的

### 相关的一些命令

```bash
# 创建一个Django项目
django-admin startproject projectname

# 创建一个项目下的应用
python3 manage.py startapp appname

# 运行
python3 manage.py runserver IP PORT
```

### url配置（URLconf）urls.py

**功能：**建立起url与视图函数的映射关系

```python
url(正则表达式（规则），视图函数，[可选参数])
```

**示例：**

```
url：http://127.0.0.1:8080/blog/articles/2003/05?a=1&b=2
匹配字符串：用户输入的url对应的路径    /blog/articles/2003/05
```

**注意：**

1. 出现覆盖现象的情况，也就是匹配规则冲突的时候，匹配第一个url
2. 无名分组：`url(r'^articles/(\d{4})/(\d{2})$', views.year_month)`  # year(request, 1990, 12) 按位置传参数
3. 有名分组：`url(r'^articles/(?P<year>\d{4})/(?P<month>\d{2})$', views.year_month)`  # year(request, year=1990, month=12) 按关键字传参数
4. url分发：`url(r'^blog/', include('blog.urls'))`
### 视图函数的补充

**视图函数：**一定是要包含两个对象的（render源码里面有HttpResponse对象）

- **request对象**：所有的请求信息
- **HttpResponse**：响应的内容（字符串）

get请求发送数据：`http://127.0.0.1:8000/login.html?user=asd&pwd=asd`

**重点：request里包含哪些数据**

1. `request.GET`：GET请求的数据，如果没有数据是一个空字典 `{}`
2. `request.POST`：POST请求的数据，如果没有数据是一个空字典 `{}`
3. `request.method`：请求方式：GET 或 POST
4. 请求某个键下多个值时：`request.POST.getlist("hobby")`
5. `request.path`：请求路径（只会拿到路径，不拿数据）
   - 请求url：`http://127.0.0.1:8000/index.html/23?a=1`
   - path：`request.path: /index.html/23`
6. `request.get_full_path()`：请求路径（路径和数据都会拿到）
   - 请求url：`http://127.0.0.1:8000/index.html/23?a=1`
   - `request.get_full_path(): /index.html/23?a=1`

### render函数和redirect函数的区别

- **render**：只会返回页面内容，但是未发送第二次请求
- **redirect**：发挥了第二次请求，url更新

![image](https://images2017.cnblogs.com/blog/1184802/201710/1184802-20171023152539316-64471089.png)

## Django中路由的作用**  
**

**这里使用2.x版本的URL中的语法path，1.x版本的url与2.x的re_path差不多，后面会详细分析**

URL配置(URLconf)就像Django 所支撑网站的目录。**它的本质是URL与要为该URL调用的视图函数之间的映射表** ；你就是以这种方式告诉Django，对于客户端发来的某个URL调用哪一段逻辑代码对应执行

典型的例子：
```

from django.urls import path

urlpatterns = [
    path('articles', views.special),
]
articles这个路由对应着视图函数中special这个方法，浏览器输入这个链接，就会响应到special这个函数来执行

```
## 简单的路由配置
```

from django.conf.urls import url

urlpatterns = [
     url(正则表达式, views视图函数，参数，别名),
]

```
  * 正则表达式：一个正则表达式字符串
  * views视图函数：一个可调用对象，通常为一个视图函数或一个指定视图函数路径的字符串
  * 参数：可选的要传递给视图函数的默认参数（字典形式）
  * 别名：一个可选的name参数

```

from django.urls import path,re_path

from app01 import views

urlpatterns = [
    re_path(r'^articles/2003/$', views.special_case_2003),
    re_path(r'^articles/([0-9]{4})/$', views.year_archive),
    re_path(r'^articles/([0-9]{4})/([0-9]{2})/$', views.month_archive),
    re_path(r'^articles/([0-9]{4})/([0-9]{2})/([0-9]+)/$', views.article_detail),
]

```
注意：

  * 若要从URL 中捕获一个值，只需要在它周围放置一对圆括号。
  * 不需要添加一个前导的反斜杠，因为每个URL 都有。例如，应该是`^articles` 而不是 `^/articles`。
  * 每个正则表达式前面的'r' 是可选的但是建议加上。它告诉Python 这个字符串是“原始的” —— 字符串中任何字符都不应该转义
  * urlpatterns中的元素按照书写顺序从上往下逐一匹配正则表达式，一旦匹配成功则不再继续

示例
```

'''
 一些请求的例子：
/articles/2005/03/ 请求将匹配列表中的第三个模式。Django 将调用函数views.month_archive(request, '2005', '03')。
/articles/2005/3/ 不匹配任何URL 模式，因为列表中的第三个模式要求月份应该是两个数字。
/articles/2003/ 将匹配列表中的第一个模式不是第二个，因为模式按顺序匹配，第一个会首先测试是否匹配。请像这样自由插入一些特殊的情况来探测匹配的次序。
/articles/2003 不匹配任何一个模式，因为每个模式要求URL 以一个反斜线结尾。
/articles/2003/03/03/ 将匹配最后一个模式。Django 将调用函数views.article_detail(request, '2003', '03', '03')。 
'''

```
**APPEND_SLASH**
```

# 是否开启URL访问地址后面不为/ 跳转至带有/的路径的配置项
APPEND_SLASH=True

```
**Django settings.py配置文件中默认没有 APPEND_SLASH 这个参数，但 Django 默认这个参数为 APPEND_SLASH = True。 其作用就是自动在网址结尾加'/'**

我们定义了urls.py：
```

from django.conf.urls import url
from app01 import views

urlpatterns = [
        url(r'^blog/$', views.blog),
]

```
访问 http://www.example.com/blog 时，默认将网址自动转换为 http://www.example/com/blog/ 。

如果在settings.py中设置了 **APPEND_SLASH=False** ，此时我们再请求 http://www.example.com/blog 时就会提示找不到页面。

## 无名分组

无名分组分出几个值,视图函数就要接受几个值(位置参数形式传过来的)
```

urls.py
from app123 import views
urlpatterns = [
    url(r'^admin/', admin.site.urls),
    url(r'^article/([0-9]{4})/([0-9]{2})', views.article_read),
]

view.py
def article_read(request,r1,r2):
    print(r1,r2)
    return HttpResponse("您要查看%s年%s月的文章"%(r1,r2))

```
## 有名分组

**注意：有名分组与无名分组最好不要混用**
```

import re
ret=re.search('(?P<year>[0-9]{4})/([0-9]{2})','2012/12')
print(ret.group())
print(ret.group(1))
print(ret.group(2))
print(ret.group('year'))

```
上面的示例使用简单的、没有命名的正则表达式组（通过圆括号）来捕获URL 中的值并以位置 参数传递给视图。

在更高级的用法中，可以使用命名的正则表达式组来捕获URL 中的值并以**关键字参数** 传递给视图。

在Python 正则表达式中，命名正则表达式组的语法是**`(?P<name>pattern)`**，其中`name` 是组的名称，`pattern` 是要匹配的模式。

下面是以上URLconf 使用命名组的重写
```

from django.urls import path,re_path

from app01 import views

urlpatterns = [
    re_path(r'^articles/2003/$', views.special_case_2003),
    re_path(r'^articles/(?P<year>[0-9]{4})/$', views.year_archive),
    re_path(r'^articles/(?P<year>[0-9]{4})/(?P<month>[0-9]{2})/$', views.month_archive),
    re_path(r'^articles/(?P<year>[0-9]{4})/(?P<month>[0-9]{2})/(?P<day>[0-9]{2})/$', views.article_detail),
]
[[捕获到的数据都是str类型]]
[[视图函数里可以指定默认值]]
url('blog/$', views.blog),
url('blog/?(?P<num>[0-9]{1})', views.blog),
def blog(request,num=1):
    print(num)
    return HttpResponse('ok')
 

```
这个实现与前面的示例完全相同，只有一个细微的差别：捕获的值作为关键字参数而不是位置参数传递给视图函数。例如
```

'''
/articles/2005/03/ 请求将调用views.month_archive(request, year='2005', month='03')函数，而不是views.month_archive(request, '2005', '03')。
/articles/2003/03/03/ 请求将调用函数views.article_detail(request, year='2003', month='03', day='03')。
'''

```
在实际应用中，这意味你的URLconf 会更加明晰且不容易产生参数顺序问题的错误 —— 你可以在你的视图函数定义中重新安排参数的顺序。当然，这些好处是以简洁为代价

## 路由分发

Django1.1版本的分发
```

from django.conf.urls import url,include

```
[[主]] urls.py
```

from django.urls import path,re_path,include
from app01 import views
from app01 import urls
urlpatterns = [ 
　　# re_path(r'^app01/',include('app01.urls')),#行
　　# re_path(r'^app01/$',include('app01.urls')),#不可以加上$
　　# path('app01/',include('app01.urls')),#行　
　　[[path]]('app01/', include(urls)),不行，要带上运用的名字
]

```
在app01里创建一个urls.py
```

from django.urls import path,re_path
  
from app01 import views
urlpatterns = [
    re_path(r'^test/(?P<year>[0-9]{2})/$',views.url_test),
]

```python
## 反向解析

在使用Django 项目时，一个常见的需求是获得URL 的最终形式，以用于嵌入到生成的内容中（视图中和显示给用户的URL等）或者用于处理服务器端的导航（重定向等）。人们强烈希望不要硬编码这些URL（费力、不可扩展且容易产生错误）或者设计一种与URLconf 毫不相关的专门的URL 生成机制，因为这样容易导致一定程度上产生过期的URL。

在需要URL 的地方，对于不同层级，Django 提供不同的工具用于URL 反查：

  * 在模板中：使用url 模板标签。
  * 在Python 代码中：使用`from django.urls import reverse()函数`

**urls.py**
```python

from django.urls import path,re_path
from app01 import views
urlpatterns = [
    re_path(r'^test/(?P<year>[0-9]{2})/(?P<month>[0-9]{2})/$',views.url_test,name='test'),
]

```
**html**
```css

<a href="{% url 'test' 10 23 %}">哈哈</a>

```
视图函数中
```python

from django.shortcuts import render, HttpResponse,redirect,reverse
def url_test(request,year,month):
    print(year)
    print(month)
    url=reverse('test',args=(10,20))
    print(url)
    return HttpResponse('ok')

```
**总结：**
```css

1 在html代码里{% url "别名" 参数  参数%}

2 在视图函数中：
　　2.1 url=reverse('test')
      2.2 url=reverse('test',args=(10,20))
3 在模板中反向解析:
      3.1{% url 'url地址的别名'%}
      [[如果做了分组]]
      3.2{% url 'url地址的别名' 参数1 参数2%}    

```
当命名你的URL 模式时，请确保使用的名称不会与其它应用中名称冲突。如果你的URL 模式叫做`comment`，而另外一个应用中也有一个同样的名称，当你在模板中使用这个名称的时候不能保证将插入哪个URL。在URL 名称中加上一个前缀，比如应用的名称，将减少冲突的可能。我们建议使用`myapp-comment` 而不是`comment`

## 名称空间

命名空间（英语：Namespace）是表示标识符的可见范围。一个标识符可在多个命名空间中定义，它在不同命名空间中的含义是互不相干的。这样，在一个新的命名空间中可定义任何标识符，它们不会与任何已有的标识符发生冲突，因为已有的定义都处于其它命名空间中

由于name没有作用域，Django在反解URL时，会在项目全局顺序搜索，当查找到第一个name指定URL时，立即返回

我们在开发项目时，会经常使用name属性反解出URL，当不小心在不同的app的urls中定义相同的name时，可能会导致URL反解错误，为了避免这种事情发生，引入了命名空间

创建一个app02：python manage.py startapp app02

总**urls.py**
```python

from django.urls import path,re_path,include
urlpatterns = [
    path('app01/', include('app01.urls')),
    path('app02/', include('app02.urls'))
]

```
**app01 的urls.py**
```python

from django.urls import path,re_path
from app01 import views
urlpatterns = [
    re_path(r'index/',views.index,name='index'),
]

```
**app02 的urls.py**
```python

from django.urls import path, re_path, include
from app02 import views

urlpatterns = [
    re_path(r'index/', views.index,name='index'),
]

```
app01的视图函数
```python

def index(request):
    url=reverse('index')
    print(url)
    return HttpResponse('index app01')

```
app02的视图函数
```python

def index(request):
    url=reverse('index')
    print(url)
    return HttpResponse('index app02')

```
**这样都找index，app01和app02找到的都是app02的index**

**如何处理？在路由分发的时候指定名称空间**

**总urls.py在路由分发时，指定名称空间**
```

 path('app01/', include(('app01.urls','app01'))),
 path('app02/', include(('app02.urls','app02')))

 url(r'app01/',include('app01.urls',namespace='app01')),
 url(r'app02/',include('app02.urls',namespace='app02'))

 url(r'app01/',include(('app01.urls','app01'))),
 url(r'app02/',include(('app02.urls','app02')))

```
在视图函数反向解析的时候，指定是那个名称空间下的
```python

 url=reverse('app02:index')
 print(url)
 url2=reverse('app01:index')
 print(url2)

```
在模版里
```css

<a href="{% url 'app02:index'%}">哈哈</a>

```
## django2.0版的path

django2.0的re_path和1.0的url一样

思考情况如下：
```css

urlpatterns = [  
    re_path('articles/(?P<year>[0-9]{4})/', year_archive),  
    re_path('article/(?P<article_id>[a-zA-Z0-9]+)/detail/', detail_view),  
    re_path('articles/(?P<article_id>[a-zA-Z0-9]+)/edit/', edit_view),  
    re_path('articles/(?P<article_id>[a-zA-Z0-9]+)/delete/', delete_view),  
]

```
考虑下这样的两个问题

第一个问题，函数 `year_archive` 中year参数是字符串类型的，因此需要先转化为整数类型的变量值，当然`year=int(year)` 不会有诸如如TypeError或者ValueError的异常。那么有没有一种方法，在url中，使得这一转化步骤可以由Django自动完成？

第二个问题，三个路由中article_id都是同样的正则表达式，但是你需要写三遍，当之后article_id规则改变后，需要同时修改三处代码，那么有没有一种方法，只需修改一处即可？

在Django2.0中，可以使用 `path` 解决以上的两个问题。

### 基本示例

这是一个简单的例子
```python

from django.urls import path  
from . import views  
urlpatterns = [  
    path('articles/2003/', views.special_case_2003),  
    path('articles/<int:year>/', views.year_archive),  
    path('articles/<int:year>/<int:month>/', views.month_archive),  
    path('articles/<int:year>/<int:month>/<slug>/', views.article_detail),  
　　# path才支持，re_path不支持
　　path('order/<int:year>',views.order),
]  

```
基本规则：

  * 使用尖括号(`<>`)从url中捕获值。
  * 捕获值中可以包含一个转化器类型（converter type），比如使用 `<int:name>` 捕获一个整数变量。若果没有转化器，将匹配任何字符串，当然也包括了 `/` 字符。
  * 无需添加前导斜杠。

以下是根据 [2.0官方文档](https://docs.djangoproject.com/en/2.0/topics/http/urls/#example) 而整理的示例分析表：(跟上面url的匹配关系)

![image](https://img2024.cnblogs.com/blog/1330620/202408/1330620-20240813140013158-1068165219.png)

### path转化器
```

文档原文是Path converters，暂且翻译为转化器

```
Django默认支持以下5个转化器：

  * str,匹配除了路径分隔符（`/`）之外的非空字符串，这是默认的形式
  * int,匹配正整数，包含0。
  * slug,匹配字母、数字以及横杠、下划线组成的字符串。
  * uuid,匹配格式化的uuid，如 075194d3-6885-417e-a8a8-6c931e272f00。
  * path,匹配任何非空字符串，包含了路径分隔符（/）（不能用？）

### 注册自定义转化器

对于一些复杂或者复用的需要，可以定义自己的转化器。转化器是一个类或接口，它的要求有三点：

  * `regex` 类属性，字符串类型

  * `to_python(self, value)` 方法，value是由类属性 `regex` 所匹配到的字符串，返回具体的Python变量值，以供Django传递到对应的视图函数中。
  * `to_url(self, value)` 方法，和 `to_python` 相反，value是一个具体的Python变量值，返回其字符串，通常用于url反向引用。

例子：
```python

class FourDigitYearConverter:  
    regex = '[0-9]{4}'  
    def to_python(self, value):  
        return int(value)  
    def to_url(self, value):  
        return '%04d' % value  

```
使用`register_converter` 将其注册到URL配置中
```python

from django.urls import register_converter, path  
from . import converters, views  
register_converter(converters.FourDigitYearConverter, 'yyyy')  
urlpatterns = [  
    path('articles/2003/', views.special_case_2003),  
    path('articles/<yyyy:year>/', views.year_archive),  
    ...  
]  

```
## 跨站请求伪造保护

### 使用规则
```

CSRF 中间件在MIDDLEWARE_CLASSES 设置中默认启用。如果你要覆盖这个设置，请记住 'django.middleware.csrf.CsrfViewMiddleware' 应该位于其它任何假设CSRF 已经处理过的视图中间件之前。
如果你关闭了它，虽然不建议，你可以在你想要保护的视图上使用csrf_protect()。
在使用POST 表单的模板中，对于内部的URL请在<form> 元素中使用csrf_token 标签：<form action="." method="post">它不应该用于目标是外部URL 的POST 表单，因为这将引起CSRF 信息泄露而导致出现漏洞。  
在对应的视图函数中，确保使用 'django.template.context_processors.csrf' Context 处理器。通常可以用两种方法实现：
使用RequestContext，它会始终使用'django.template.context_processors.csrf'（无论 TEMPLATES 设置中配置的是什么模板上下文处理器）。如果你正在使用通用视图或Contrib 中的应用，你就不用担心了，因为这些应用通篇都使用RequestContext　

```
### AJAX

虽然上面的方法可以用于AJAX POST 请求，但是它不太方便：你必须记住在每个POST 请求的数据中传递CSRF token。由于这个原因，还有另外一种方法：在每个XMLHttpRequest 上设置一个自定义的`X-CSRFToken` 头部，其值为CSRF token。这非常容易，因为许多JavaScript 框架都提供在每个请求上设置头部的方法。

第一步，你必须获得CSRF token。建议从`csrftoken` Cookie 中获取，如果你在视图中启用CSRF 防护它就会设置。

注：

CSRF token 的Cookie 默认叫做`csrftoken`，你可以通过[`CSRF_COOKIE_NAME`](http://python.usyiyi.cn/documents/django_182/ref/settings.html#std:setting-CSRF_COOKIE_NAME) 设置自定义它的名字。

获取token 非常简单
```javascript

// using jQuery
function getCookie(name) {
    var cookieValue = null;
    if (document.cookie && document.cookie != '') {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var cookie = jQuery.trim(cookies[i]);
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) == (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}
var csrftoken = getCookie('csrftoken');

```
以上代码可以使用jquery.cookie.js来替换`getCookie`  

var csrftoken = $.cookie('csrftoken');

Jquery.cookie.js
```javascript

function csrfSafeMethod(method) {
        return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
    }

    $.ajaxSetup({//全局设置csrf-token
       beforeSend:function (xhr,settings) {
           //请求头设置一次csrf-token
           if (!csrfSafeMethod(settings.type)){
               xhr.setRequestHeader('X-CSRFToken',$.cookie('csrftoken'));//在每次请求的cookie中设置csrftoken
           }
       }
    });

```
注：CSRF token 也存在于DOM 中，但只有你在模板中明确使用`csrf_token` 标签时才有。如果你的视图渲染的模板没有包含`csrf_token` 标签，Django 可能不会再Cookie 中设置CSRF token。这常见于表单是动态的方式添加到网页中的。为了解决这个问题，Django 提供一个视图装饰器`ensure_csrf_cookie()`，它将强制设置这个Cookie。
```python

from django.views.decorators.csrf import ensure_csrf_cookie

```
将此装饰器强制设置在视图上

### 场景

CSRF保护应该禁用只有几个视图

大多数视图需要CSRF保护，但有几个不需要。

解决方案：而不是禁用中间件，并对所有需要它的视图应用`csrf_protect`，启用中间件并使用`csrf_exempt()`。
```python

from django.views.decorators.csrf import csrf_exempt
from django.http import HttpResponse

@csrf_exempt
def my_view(request):
    return HttpResponse('Hello world')

```
#### CsrfViewMiddleware.process_view未使用[  
](http://python.usyiyi.cn/documents/django_182/ref/csrf.html#csrfviewmiddleware-process-view-not-used "Permalink to this headline")

有些情况下，如果`CsrfViewMiddleware.process_view`可能在您的视图运行之前没有运行 - 例如404和500处理程序，但是您仍然需要一个表单中的CSRF令牌。

解决方案：使用`requires_csrf_token()`
```python

from django.views.decorators.csrf import requires_csrf_token
from django.shortcuts import render

@requires_csrf_token
def my_view(request):
    c = {}
    # ...
    return render(request, "a_template.html", c)

```
#### 不受保护的视图需要CSRF令牌[  
](http://python.usyiyi.cn/documents/django_182/ref/csrf.html#unprotected-view-needs-the-csrf-token "Permalink to this headline")

可能有一些视图未受保护，并且已被`csrf_exempt`豁免，但仍需要包括CSRF令牌。

解决方案：使用`csrf_exempt()`，后跟`requires_csrf_token()`。（即`requires_csrf_token`应该是最内部的装饰器）。

#### View需要保护一个路径[  
](http://python.usyiyi.cn/documents/django_182/ref/csrf.html#view-needs-protection-for-one-path "Permalink to this headline")

视图仅需要一组条件下的CSRF保护，并且在其余时间内不能拥有它。

解决方案：对于需要保护的路径，使用`csrf_exempt()`作为整个视图函数，`csrf_protect()`例
```python

from django.views.decorators.csrf import csrf_exempt, csrf_protect

@csrf_exempt
def my_view(request):

    @csrf_protect
    def protected_path(request):
        do_something()

    if some_condition():
       return protected_path(request)
    else:
       do_something_else()

```
页面使用AJAX，没有任何HTML表单

网页通过ajax发出post请求，并且该网页没有带有`csrf_token`的HTML表单，就会导致所需的CSRF Cookie被发送

解决方案：在发送页面的视图上使用`ensure_csrf_cookie()`

---
