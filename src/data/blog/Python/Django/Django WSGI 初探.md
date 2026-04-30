---
title: Django WSGI 初探
author: 程序员
pubDatetime: 2024-08-13T00:00:00.000+08:00
updated: 2026-04-22T00:00:00.000+08:00
slug: django-wsgi-introduction
featured: false
draft: false
tags:
  - Python
  - Django
description: "Django WSGI 初探"
---

## 起步

> Django 使用 `WSGIServer` 作为内置服务器，定义于 `django/core/servers/basehttp.py`

Django 的 `ServerHandler`、`WSGIServer`、`WSGIRequestHandler` 都是基于 Python 标准库 `wsgiref` 封装。

## Django 的内置服务器

> 内置服务器由 `django.core.servers` 和 `django.core.handlers` 共同实现

```python
# django/core/servers/basehttp.py
def run(addr, port, wsgi_handler, ipv6=False, threading=False):
    server_address = (addr, port)
    # 支持多线程模式
    if threading:
        httpd_cls = type(str('WSGIServer'), (socketserver.ThreadingMixIn, WSGIServer), {})
    else:
        httpd_cls = WSGIServer
    httpd = httpd_cls(server_address, WSGIRequestHandler, ipv6=ipv6)
    if threading:
        httpd.daemon_threads = True

    # 设置 WSGI 处理器并启动服务
    httpd.set_app(wsgi_handler)
    httpd.serve_forever()
```

> `wsgi_handler` 实际是 `StaticFilesHandler` 实例

## WSGI 应用

> WSGI 应用入口在 `settings.py` 中定义

```python
WSGI_APPLICATION = 'webui.wsgi.application'
```

```python
# wsgi.py
import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "webui.settings")
application = get_wsgi_application()
```

> `get_wsgi_application()` 实例化 `WSGIHandler`

### StaticFilesHandler

> 第一个落地的 WSGI 处理器

```python
class Command(RunserverCommand):
    def get_handler(self, *args, **options):
        handler = super(Command, self).get_handler(*args, **options)
        use_static_handler = options['use_static_handler']
        insecure_serving = options['insecure_serving']
        # DEBUG 模式下启用静态文件处理
        if use_static_handler and (settings.DEBUG or insecure_serving):
            return StaticFilesHandler(handler)
        return handler
```

```python
class StaticFilesHandler(WSGIHandler):
    def __init__(self, application):
        self.application = application
        self.base_url = urlparse(self.get_base_url())
        super(StaticFilesHandler, self).__init__()

    def _should_handle(self, path):
        return path.startswith(self.base_url[2]) and not self.base_url[1]

    def __call__(self, environ, start_response):
        # 静态文件请求由 StaticFilesHandler 处理
        if not self._should_handle(get_path_info(environ)):
            return self.application(environ, start_response)
        return super(StaticFilesHandler, self).__call__(environ, start_response)
```

> `StaticFilesHandler` 先判断是否为静态文件请求，是则处理，否则交给 Django Handler

### WSGIHandler

> 非静态文件请求由 `WSGIHandler` 处理

```python
class WSGIHandler(base.BaseHandler):
    request_class = WSGIRequest

    def __call__(self, environ, start_response):
        try:
            # 根据 environ 实例化 WSGIRequest
            request = self.request_class(environ)
        except UnicodeDecodeError:
            response = http.HttpResponseBadRequest()
        else:
            # 获取响应对象
            response = self.get_response(request)

        response._handler_class = self.__class__
        # 构建响应状态和头信息
        status = '%d %s' % (response.status_code, response.reason_phrase)
        response_headers = [(str(k), str(v)) for k, v in response.items()]
        for c in response.cookies.values():
            response_headers.append((str('Set-Cookie'), str(c.output(header=''))))
        # 调用 start_response 返回给服务器
        start_response(force_str(status), response_headers)
        if getattr(response, 'file_to_stream', None) is not None and environ.get('wsgi.file_wrapper'):
            response = environ['wsgi.file_wrapper'](response.file_to_stream)
        return response
```

> `WSGIHandler.__call__` 主要流程：
> 1. 从 `environ` 实例化 `WSGIRequest`（就是 view 中的 `request` 参数）
> 2. 通过中间件链调用 `get_response()` 获取响应对象
> 3. 返回响应给 WSGI 服务器
