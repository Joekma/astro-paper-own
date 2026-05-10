---
title: Django 服务器结构演变
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-04-22T00:00:00.000+08:00
slug: django-server-structure-evolution
featured: false
draft: false
series: django
tags:
  - Python
  - Django
  - 服务器
description: "深入讲解Django服务器结构的演变和各个Handler之间的关系。"
---

## 起步

根据前面的分析实在是有太多太多`Handler`，绕来绕去，今天就从头整理，将一个最基础的服务器慢慢改成类似django的服务器结构。

## 从simple_server说起

根据django运行的服务器`django.core.servers.basehttp`的`run`函数，我们也利用`simpler_server`模块起一个很简单的服务：

```python
from wsgiref.simple_server import WSGIServer, WSGIRequestHandler

def demo_app(environ, start_response):
    """示例的app"""
    stdout = "Hello world!"
    h = sorted(environ.items())
    for k, v in h:
        stdout += k + '=' + repr(v) + "\r\n"
    print(start_response)
    start_response("200 OK", [('Content-Type', 'text/plain; charset=utf-8')])
    return [stdout.encode("utf-8")]

server = WSGIServer(('', 8000), WSGIRequestHandler)
server.set_app(demo_app)
server.serve_forever()
```

我们会将这个程序改造成与django服务器结构差不多的形式，便于理解其各个`Handler`之间的关系。运行这个程序，访问`http://localhost:8000`可以看到打印了`Hello World!`和`environ`字典中各个项。结构上，我们可以将字符串通过`[stdout.encode("utf-8")]`bytes对象组成的数组作为`response`返回即可。

## 最外层的StaticFilesHandler

`StaticFilesHandler`是服务器结构第一个接手的对象。所有请求都是先通过这个对象接手再由其他对象处理的。这个对象处理请求也比较简单，就是判断一下请求是否是静态文件，是的话自己处理，不是的话，交个其他handler处理。我们模拟一下这个类：

```python
class StaticFilesHandler:
    """处理静态文件的句柄"""
    def __init__(self, application):
        self.application = application

    def __call__(self, environ, start_response):
        if True:  # 假设所有请求都不是静态文件
            return self.application(environ, start_response)
```

启动程序：

```python
server = WSGIServer(('', 8000), WSGIRequestHandler)
static_handler = StaticFilesHandler(demo_app)
server.set_app(static_handler)
server.serve_forever()
```

这部分比较好理解，就是简单套了一个对象做代理。最终调用还是`demo_app`函数。

## 封装请求的request

在封装请求之前，要先定义一下`request`的样子，这部分代码在`django.http.request`中`HttpRequest`，作为模仿，简单的展示这个类：

```python
class HttpRequest(object):
    """定义request所需的属性"""
    def __init__(self):
        self.GET = {}
        self.POST = {}
        self.COOKIES = {}
        self.META = {}
        self.FILES = {}

        self.path = ''
        self.path_info = ''
        self.method = None
```

这个类是定义其属性，将其派生个子类，作用是将`environ`转换成对应的属性：

```python
class WSGIRequest(HttpRequest):
    """将环境变量转到request属性"""
    def __init__(self, environ):
        script_name = environ["SCRIPT_NAME"]
        path_info = environ["PATH_INFO"]
        if not path_info:
            path_info = '/'

        self.environ = environ
        self.path_info = path_info

        self.path = '%s/%s' % (script_name.rstrip('/'), path_info.replace('/', '', 1))
        self.META = environ
        self.META['PATH_INFO'] = path_info
        self.META['SCRIPT_NAME'] = script_name
        self.method = environ['REQUEST_METHOD'].upper()
```

## 定义应用application

`WSGIServer`利用`set_app(app)`将应用作为回调的，根据上面通过`StaticFilesHandler`代理，但最后执行的是`demo_app`，现在需要将其改造一下，用上我们的`WSGIRequest`：

```python
def get_response(request):
    print("path = %s" % request.path)
    print("method = %s" % request.method)
    return [str(request).encode("utf-8")]

class WSGIHandler(object):
    request_class = WSGIRequest

    def __call__(self, environ, start_response):
        request = self.request_class(environ)
        response = get_response(request)
        start_response("200 OK", [('Content-Type', 'text/plain; charset=utf-8')])
        return response
```

这样，在`get_response`中，就是`request`对象了。定义了`__call__`函数用于`StaticFilesHandler`对实例进行调用`self.application(environ, start_response)`。而在这个`__call__`函数中，根据`environ`环境变量创建一个`WSGIRequest`的对象，`get_response`函数中的`request`就是通常使用的django中views里面的`request`。

将启动应用的代码稍作修改：

```python
application = WSGIHandler()
static_handler = StaticFilesHandler(application)

server = WSGIServer(('', 8000), WSGIRequestHandler)
server.set_app(static_handler)
server.serve_forever()
```

## 封装响应的response

现在还差对响应进行封装了，这个封装其实也比较简单，最后返回的是一个`[bytes()]`形式的既可：

```python
class HttpResponse(object):
    """一个简单封装的response类"""
    def __init__(self, content="", status=200,
                 charset="utf-8", content_type="text/plain; charset=utf-8",
                 *args, **kwargs):
        self._headers = {'Content-Type': content_type}
        self._charset = charset
        self.content(content)
        self.status_code = status

    def serialize_headers(self):
        """序列化headers"""
        def to_bytes(val, encoding):
            return val if isinstance(val, bytes) else val.encode(encoding)

        headers = [
            (b': '.join([to_bytes(key, 'ascii'), to_bytes(value, 'latin-1')]))
            for key, value in self._headers.values()
        ]
        return b'\r\n'.join(headers)

    def content(self, value):
        """将str转为bytes"""
        content = bytes(value.encode(self._charset))
        self._container = [content]

    def __iter__(self):
        """将对象视为可迭代"""
        return iter(self._container)
```

这样，我们的`get_response`就可以很自由的操作响应对象了：

```python
def get_response(request):
    print("path = %s" % request.path)
    print("method = %s" % request.method)
    res = HttpResponse("hello world")
    res.status_code = 400
    res._headers["hahahah"] = "xxxxxx"
    return res
```