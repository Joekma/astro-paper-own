---
title: Django 深入理解 WSGI 协议
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-04-22T00:00:00.000+08:00
slug: django-wsgi-protocol
featured: false
draft: false
tags:
  - Python
  - Django
  - WSGI
description: "深入讲解WSGI协议的工作原理和在Django中的应用。"
---

## 起步

距离上一篇这个系列的文章已经是半年前了，随着Django 2.0的发布，感觉之前分析的1.10.5版本似乎有点老了，好在和前面文章分析的内容差异不大，基本上也是可以就着前面的分析内容来品尝最新的django代码。

那接下来阅读的版本就从当前能获取的2.0.6来分析。不过，本章要将的内容，可能和django代码本身没太多关系。本章来理解一下WSGI协议，django就是遵守这个协议的web开发框架，本章重点是协议方面的说明，顶多会讲讲django里相应的wsgi的代码，而不对django代码做分析。

## 什么是WSGI

WSGI（Web Server Gateway Interface）是用来指定Web服务器与Python Web应用程序或框架之间标准接口，以促进跨各种Web服务器的可移植性。

在这个规范出来之前，Python拥有各种各样的Web应用程序框架，这也就产生了一个问题，开发者选择Web框架会限制他们选择web服务器，反之亦然。

因此，python就提出了一个简单而通用的Web服务器与Web应用程序之间的接口：**Python Web服务器网关接口（WSGI）**。

WSGI的目标是促进现有服务器和应用程序的轻松互联，而**不是创建新的Web框架**。

## 调用方式

WSGI协议要面对两个端：一个是服务器或者说是网关端，另一个是应用程序或者说框架端。就需要处理一个问题，是谁调用了另一方。

在协议中规定了调用方式：服务器端调用应用程序端提供的**可调用**对象。

也就是说，web应用程序需要提供一个可调用对象给web服务器调用，这个可调用的对象可以是**函数、方法、类或者带有`__call__`方法的实例**。

## 可调用对象的构成

这个可调用对象的构成也很简单，它接收**两个参数**，该对象必须允许能够调用多次，如下面的示例：

```python
def simple_app(environ, start_response):
    """最简单的应用程序对象"""
    status = '200 OK'
    response_headers = [('Content-type', 'text/plain')]
    start_response(status, response_headers)
    return ['Hello world!\n']
```

这样就是一个满足WSGI协议的web程序应用了，是不是很简单。对应的django里，可以从`wsgi.py`中看到`application = get_wsgi_application()`这个函数展开基本和我们实例的最简单应用程序对象结构一样了：

```python
class WSGIHandler(base.BaseHandler):
    request_class = WSGIRequest

    def __call__(self, environ, start_response):
        request = self.request_class(environ)
        response = self.get_response(request)

        status = '%d %s' % (response.status_code, response.reason_phrase)
        response_headers = list(response.items())
        start_response(status, response_headers)

        return response
```

## 服务器端

服务器的作用是接收每一个HTTP请求，应用程序对象调用时需要传入`environ`和`start_response`，因此这两个参数需要由服务器端来整理并提供给应用程序使用。

`environ`是一个字典，以一个简单的CGI网关为例，它的值可以这么设置：

```python
import os

environ = dict(os.environ.items())
environ['wsgi.input'] = sys.stdin
environ['wsgi.errors'] = sys.stderr
environ['wsgi.version'] = (1, 0)
environ['wsgi.multithread'] = False
environ['wsgi.multiprocess'] = True
environ['wsgi.run_once'] = True

if environ.get('HTTPS', 'off') in ('on', '1'):
    environ['wsgi.url_scheme'] = 'https'
else:
    environ['wsgi.url_scheme'] = 'http'
```

`start_response`则是一个函数，原型是`start_response(status, response_headers, exc_info=None)`并且这个函数要返回一个可调用的`write(body_data)`对象。例如：

```python
def unicode_to_wsgi(u):
    return u.encode(enc, esc).decode('iso-8859-1')

def wsgi_to_bytes(s):
    return s.encode('iso-8859-1')

headers_set = []  # 待发送的响应的header信息
headers_sent = []  # 已发送的响应的header信息

def write(data):
    out = sys.stdout.buffer

    if not headers_set:
        raise AssertionError("write() before start_response()")

    elif not headers_sent:
        status, response_headers = headers_sent[:] = headers_set
        out.write(wsgi_to_bytes('Status: %s\r\n' % status))
        for header in response_headers:
            out.write(wsgi_to_bytes('%s: %s\r\n' % header))
        out.write(wsgi_to_bytes('\r\n'))

    out.write(data)
    out.flush()

def start_response(status, response_headers, exc_info=None):
    if exc_info:
        try:
            if headers_sent:
                raise exc_info[1].with_traceback(exc_info[2])
        finally:
            exc_info = None
    elif headers_set:
        raise AssertionError("Headers already set!")

    headers_set[:] = [status, response_headers]

    return write
```

这样其实一个满足WSGI协议的web服务器端就基本完成了，现在需要整合一下，由于需要涉及到请求包的分析过程，我们就直接用标准库`wsgiref.simple_server`中的`WSGIServer`作为web服务器。

整合一下：

```python
import sys
import os
from wsgiref.simple_server import WSGIServer, WSGIRequestHandler

def demo_app(environ, start_response):
    """示例的app"""
    stdout = "Hello world!"
    h = sorted(environ.items())
    for k, v in h:
        stdout += k + '=' + repr(v) + "\r\n"
    start_response("200 OK", [('Content-Type', 'text/plain; charset=utf-8')])
    return [stdout.encode("utf-8")]

enc, esc = sys.getfilesystemencoding(), 'surrogateescape'

def unicode_to_wsgi(u):
    return u.encode(enc, esc).decode('iso-8859-1')

def wsgi_to_bytes(s):
    return s.encode('iso-8859-1')

def run_with_cgi(request, client_address, server):
    environ = {k: unicode_to_wsgi(v) for k, v in os.environ.items()}
    environ['wsgi.input'] = sys.stdin.buffer
    environ['wsgi.errors'] = sys.stderr
    environ['wsgi.version'] = (1, 0)
    environ['wsgi.multithread'] = False
    environ['wsgi.multiprocess'] = True
    environ['wsgi.run_once'] = True

    if environ.get('HTTPS', 'off') in ('on', '1'):
        environ['wsgi.url_scheme'] = 'https'
    else:
        environ['wsgi.url_scheme'] = 'http'

    headers_set = []
    headers_sent = []

    def write(data):
        out = sys.stdout.buffer

        if not headers_set:
            raise AssertionError("write() before start_response()")

        elif not headers_sent:
            status, response_headers = headers_sent[:] = headers_set
            out.write(wsgi_to_bytes('Status: %s\r\n' % status))
            for header in response_headers:
                out.write(wsgi_to_bytes('%s: %s\r\n' % header))
            out.write(wsgi_to_bytes('\r\n'))

        out.write(data)
        out.flush()

    def start_response(status, response_headers, exc_info=None):
        if exc_info:
            try:
                if headers_sent:
                    raise exc_info[1].with_traceback(exc_info[2])
            finally:
                exc_info = None
        elif headers_set:
            raise AssertionError("Headers already set!")

        headers_set[:] = [status, response_headers]

        return write
```
