---
title: Django 请求生命周期：从入口到响应
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-04-22T00:00:00.000+08:00
slug: django-request-response
featured: false
draft: false
tags:
  - Python
  - Django
  - 请求处理
description: "深入讲解Django从入口到请求到响应的完整生命周期。"
---

## 起步

在我研究完 django 的自动加载机制后，有了阅读 django 源码的想法。那就看看吧，也不知道能坚持到什么地方。我阅读的版本也是我正在使用的 `1.10.5` 版本，算是比较新的了。

一般运行 django 程序都是通过: `python manage.py runserver` 开始的，那我们就从这个入口开始。

## 入口文件

`manage.py` 文件里只有简单的几行代码：
```python

#!/usr/bin/env python
import os
import sys

if __name__ == "__main__":
    # 将settings模块设置到环境变量中
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "webui.settings")
    from django.core.management import execute_from_command_line
    # 执行命令
    execute_from_command_line(sys.argv)

```
在设置环境变量之后，命令参数的列表传到了 `execute_from_command_line` 中：
```

def execute_from_command_line(argv=None):
    """
    A simple method that runs a ManagementUtility.
    """
    utility = ManagementUtility(argv)
    utility.execute()

```
## 命令管理工具

命令参数又传到了 `ManagementUtility` 类中：
```

class ManagementUtility(object):
    def __init__(self, argv=None):
        self.argv = argv or sys.argv[:]
        self.prog_name = os.path.basename(self.argv[0])
        self.settings_exception = None

```python
`prog_name` 就是 `manage.py`。实例化后调用了 `execute()` 方法，在这个方法中，会对命令参数进行处理。当解析的的命令是 `runserver` 时，会有两条路，第一个是会自动重装的路线，通过 `autoreload.check_errors(django.setup)()` 代理完成。另一个路线是参数中有 `--noreload` 时，就用 `django.setup()` 来启动服务。

如果不是 `runserver` 而是其他命令，那么会对命令参数 `self.argv[1]` 进行判断，包括错误处理，是否是 `help` ，是否是 `version` ，根据不同的情况展示不同的信息。

最重要的是最后一句，即前面的情况都不是，就进入 `self.fetch_command(subcommand).run_from_argv(self.argv)` ，这边分两步，一步是获取执行命令所需要的类，其次是将命令参数作为参数传递给执行函数执行：
```python

def fetch_command(self, subcommand):
    commands = get_commands()
    try:
        app_name = commands[subcommand]
    except KeyError:
        sys.exit(1)

    if isinstance(app_name, BaseCommand):
        # If the command is already loaded, use it directly.
        klass = app_name
    else:
        klass = load_command_class(app_name, subcommand)
    return klass

```
`get_commands()` 是返回是一个命令与模块映射作用的字典:
```bash

{
    "makemessages": "django.core",
    "makemigrations": "django.core",
    "migrate": "django.core",
    "runserver": "django.contrib.staticfiles",
    "startapp": "django.core",
    "startproject": "django.core",
    "createsuperuser": "django.contrib.auth"
    ...
}

```
## 动态加载模块

模块是通过 `load_command_class` 来动态加载的：
```python

def load_command_class(app_name, name):
    module = import_module('%s.management.commands.%s' % (app_name, name))
    return module.Command()

```
如执行 `runserver` 命令的模块就是 `django.contrib.staticfiles.management.commands.runserver` 返回该模块中定义的 `Command` 类的实例。获得实例后调用了 `run_from_argv(self.argv)` :
```python

def run_from_argv(self, argv):
    self._called_from_command_line = True
    parser = self.create_parser(argv[0], argv[1])

    options = parser.parse_args(argv[2:]) # Namespace(addrport=None, ...) 返回一个Namespace的实例
    cmd_options = vars(options) # 对象转成字典
    # Move positional args out of options to mimic legacy optparse
    args = cmd_options.pop('args', ())
    handle_default_options(options)     # 设置默认参数
    try:
        self.execute(*args, **cmd_options) # 异常捕获包裹的execute
    except Exception as e:
        sys.exit(1)
    finally:
        connections.close_all()

```
## 设置请求句柄

在 `execute` 中会做一些设置参数的错误检查，然后设置句柄:
```python

def handle(self, *args, **options):
    if not settings.DEBUG and not settings.ALLOWED_HOSTS:
        raise CommandError('You must set settings.ALLOWED_HOSTS if DEBUG is False.')

    self.use_ipv6 = options['use_ipv6']
    if self.use_ipv6 and not socket.has_ipv6:
        raise CommandError('Your Python does not support IPv6.')
    self._raw_ipv6 = False
    if not options['addrport']:
        self.addr = ''                  # 默认地址
        self.port = self.default_port  # 默认端口
    else: # 如果设置了ip地址和端口号，用正则匹配出来
        m = re.match(naiveip_re, options['addrport'])
        if m is None:
            raise CommandError('"%s" is not a valid port number '
                               'or address:port pair.' % options['addrport'])
        self.addr, _ipv4, _ipv6, _fqdn, self.port = m.groups()
        if not self.port.isdigit():
            raise CommandError("%r is not a valid port number." % self.port)
        if self.addr:
            if _ipv6:
                self.addr = self.addr[1:-1]
                self.use_ipv6 = True
                self._raw_ipv6 = True
            elif self.use_ipv6 and not _fqdn:
                raise CommandError('"%s" is not a valid IPv6 address.' % self.addr)
    if not self.addr:
        self.addr = '::1' if self.use_ipv6 else '127.0.0.1' [[如果没有设置ip地址使用127]].0.0.1代替
        self._raw_ipv6 = self.use_ipv6
    self.run(**options) # 运行命令

```
`run` 方法主要时调用了 `inner_run(*args, **options)` 这个方法:
```python

def inner_run(self, *args, **options):
    threading = options['use_threading']
    # 'shutdown_message' is a stealth option.
    shutdown_message = options.get('shutdown_message', '')
    quit_command = 'CTRL-BREAK' if sys.platform == 'win32' else 'CONTROL-C'
    # 输出基础信息
    self.stdout.write("Performing system checks...\n\n")
    self.check(display_num_errors=True)
    # Need to check migrations here, so can't use the
    # requires_migrations_check attribute.
    self.check_migrations()
    now = datetime.now().strftime('%B %d, %Y - %X')
    if six.PY2:
        now = now.decode(get_system_encoding())
    self.stdout.write(now)
    self.stdout.write((
        "Django version %(version)s, using settings %(settings)r\n"
        "Starting development server at http://%(addr)s:%(port)s/\n"
        "Quit the server with %(quit_command)s.\n"
    ) % {
        "version": self.get_version(),
        "settings": settings.SETTINGS_MODULE,
        "addr": '[%s]' % self.addr if self._raw_ipv6 else self.addr,
        "port": self.port,
        "quit_command": quit_command,
    })

    try:
        # 获取处理 http 的句柄
        handler = self.get_handler(*args, **options)
        run(self.addr, int(self.port), handler,
            ipv6=self.use_ipv6, threading=threading)
    except socket.error as e:
        os._exit(1)
    except KeyboardInterrupt:
        if shutdown_message:
            self.stdout.write(shutdown_message)
        sys.exit(0)

```
这部分除了有熟悉的信息输出外，重要的是这个句柄：
```python

def get_handler(self, *args, **options):
    """
    Returns the default WSGI handler for the runner.
    """
    return get_internal_wsgi_application()

```
`get_handler` 函数最终会返回一个 `WSGIHandler` 的实例。WSGIHandler 类只实现了 `def __call__(self, environ, start_response)` , 使它本身能够成为 `WSGI` 中的应用程序, 并且实现 `__call__` 能让类的行为跟函数一样。
```python

def run(addr, port, wsgi_handler, ipv6=False, threading=False):
    server_address = (addr, port)
    if threading:
        httpd_cls = type(str('WSGIServer'), (socketserver.ThreadingMixIn, WSGIServer), {})
    else:
        httpd_cls = WSGIServer
    httpd = httpd_cls(server_address, WSGIRequestHandler, ipv6=ipv6)
    if threading:
        httpd.daemon_threads = True
    httpd.set_app(wsgi_handler)
    httpd.serve_forever()

```
这是一个标准的 `wsgi` 实现。`httpd_cls` 是 `WSGIServer` 类，最终的实例化方法在父类 `SocketServer` 中的 `TCPServer` 和 `BaseServer` 中。包括初始化线程，初始化网络句柄，像下面的 `__is_shut_down` 和 `__shutdown_request` 都是在其中初始化的。

## 处理请求
```python

def serve_forever(self, poll_interval=0.5):
    """
    处理一个 http 请求直到关闭
    """
    [[__is_shut_down为一个初始化的threading]].Event()的句柄，用于线程间通信
    self.__is_shut_down.clear() #.clear()将标识设置为false
    try:
        with _ServerSelector() as selector:

            selector.register(self, selectors.EVENT_READ)

            while not self.__shutdown_request:
                # 下面的函数就是一个封装好了的select函数，超时时间 0.5 s
                ready = selector.select(poll_interval)
                if ready:
                    self._handle_request_noblock()

                self.service_actions()
    finally:
        self.__shutdown_request = False
        self.__is_shut_down.set() [[将标识设置为true]]

```
当发现有请求后，就调用 `_handle_request_noblock` 进行处理:
```python

def _handle_request_noblock(self):
    try:
        # 返回请求句柄，客户端地址，get_request()中调用了self.socket.accept()来实现客户端的连接
        request, client_address = self.get_request()
    except OSError:
        return
    if self.verify_request(request, client_address): # 验证请求合法性
        try:
            [[真正的处理连接请求的地方，调用了self]].finish_request(request, client_address)
            self.process_request(request, client_address)
        except Exception:
            self.handle_error(request, client_address)
            self.shutdown_request(request)
        except:
            self.shutdown_request(request)
            raise
    else:
        self.shutdown_request(request)

```
在 `finish_request` 函数返回 `django.core.servers.basehttp.WSGIRequestHandler` 的实例，其父类 `BaseHTTPRequestHandler` 类中有对 http 包解包的过程，从其父类的初始化:
```python

class BaseRequestHandler:
    def __init__(self, request, client_address, server):
        self.request = request
        self.client_address = client_address
        self.server = server
        self.setup()
        try:
            self.handle()
        finally:
            self.finish()

```
## 响应请求

可以看出，会回调 `handle()` 函数，也就是子类 `WSGIRequestHandler` 覆盖的方法:
```python

def handle(self):
    self.raw_requestline = self.rfile.readline(65537)
    if len(self.raw_requestline) > 65536:
        self.requestline = ''
        self.request_version = ''
        self.command = ''
        self.send_error(414)
        return
    [[传入的参数，读，写，错误，环境变量。在其父类SimpleHandler中进行了初始化，并且打开了多线程和多进程选项]]
    handler = ServerHandler(
        self.rfile, self.wfile, self.get_stderr(), self.get_environ()
    )
    handler.request_handler = self
    handler.run(self.server.get_app())

```
`handler.run(self.server.get_app())` 中就是调用之前设置句柄的 `WSGIHandler` 类:
```python

class WSGIHandler(base.BaseHandler):
    request_class = WSGIRequest

    def __init__(self, *args, **kwargs):
        super(WSGIHandler, self).__init__(*args, **kwargs)
        self.load_middleware()

    def __call__(self, environ, start_response):
        ...
        response = self.get_response(request)

        response._handler_class = self.__class__

        status = '%d %s' % (response.status_code, response.reason_phrase)
        response_headers = [(str(k), str(v)) for k, v in response.items()]
        for c in response.cookies.values():
            response_headers.append((str('Set-Cookie'), str(c.output(header=''))))
        start_response(force_str(status), response_headers)
        if getattr(response, 'file_to_stream', None) is not None and environ.get('wsgi.file_wrapper'):
            response = environ['wsgi.file_wrapper'](response.file_to_stream)
        return response

```
就有一个 `response` 响应返回啦。

---
