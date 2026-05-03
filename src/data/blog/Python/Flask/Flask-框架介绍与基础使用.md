---
title: Flask 框架介绍与基础使用
author: 程序员
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-04-22T00:00:00.000+08:00
slug: flask-1-introduction
description: '介绍Flask框架的基本概念、与Django的对比、Werkzeug原理以及Flask的基础使用方法。'
tags:
  - Python
  - Flask
  - Web开发
draft: false
language: zh-CN
---

## 什么是 Flask

Flask 是一个基于 Python 的轻量级 Web 框架，它的核心设计理念是"微"（micro）。这意味着 Flask 致力于保持核心简单、易于扩展，同时给予开发者最大的灵活性。

### Flask 的核心依赖

Flask 依赖两个关键的 Python 库：

- **Werkzeug**：一个 WSGI 工具库，提供了请求处理、路由匹配等核心功能。本质上是一个 Socket 服务端，用于接收 HTTP 请求并对请求进行预处理
- **Jinja2**：模板引擎，用于将 Python 数据渲染成 HTML 页面

### "微"框架的含义

> "微"并不意味着你需要把整个 Web 应用塞进单个 Python 文件（虽然确实可以），也不意味着 Flask 在功能上有所欠缺。

Flask 的"微"体现在：

1. **核心简单**：Flask 不替你做太多决策，比如使用何种数据库
2. **易于扩展**：通过 Flask 扩展（Extension）可以添加各种功能，如数据库操作、表单验证、用户认证等
3. **高度灵活**：你可以替换任何组件，比如将 Jinja2 替换为其他模板引擎

### Flask 能做什么

默认情况下，Flask 不包含：
- 数据库抽象层
- 表单验证
- 用户认证

但是，通过扩展可以轻松实现：
- 数据库集成（Flask-SQLAlchemy）
- 表单验证（Flask-WTF）
- 用户认证（Flask-Login）
- 文件上传处理（Flask-Upload）
- 邮件发送（Flask-Mail）
- 各种认证技术（如 OAuth、JWT 等）

**Flask 虽是"微小"的，但已准备好在需求繁杂的生产环境中投入使用。**

## Flask vs Django

| 特性 | Django | Flask |
|------|--------|-------|
| 架构 | 大而全，自带 ORM、Admin 等 | 微框架，核心精简 |
| 数据库 | 内置 ORM | 通过扩展（如 Flask-SQLAlchemy） |
| 表单 | 内置 Form 组件 | 通过 Flask-WTF |
| 管理后台 | 自带 Admin | 通过扩展或手动实现 |
| 灵活性 | 约定优于配置 | 完全灵活 |
| 学习曲线 | 较陡 | 较平缓 |

## 快速开始

### 安装 Flask

```bash
pip3 install flask
```

### 第一个 Flask 应用

```python
from flask import Flask

app = Flask(__name__)

@app.route('/')
def hello_world():
    return 'Hello World!'

if __name__ == '__main__':
    app.run(debug=True)
```

运行后访问 `http://127.0.0.1:5000/`，即可看到 "Hello World!"。

## Werkzeug 原理：WSGI 协议的优雅封装

Flask 依赖 Werkzeug 实现 WSGI 协议。要理解 Flask 的底层运行机制，首先需要看懂 Werkzeug 的基本用法。

### 1. 原生 WSGI 应用

按照 PEP 3333 标准，一个最简单的 WSGI 应用必须是这样的：

```python
def raw_wsgi_app(environ, start_response):
    """
    environ: 包含所有 HTTP 请求信息的字典
    start_response: 用于发送 HTTP 状态码和响应头的可调用对象
    """
    status = '200 OK'
    response_headers = [('Content-Type', 'text/plain')]
    start_response(status, response_headers)
    return [b'Hello World!']
```

**痛点**：开发者必须手动去 `environ` 字典里解析路由、提取参数、拼接状态码，开发体验极差。

### 2. Werkzeug 的优雅封装

Werkzeug 的出现就是为了消灭上面的痛点：

```python
from werkzeug.wrappers import Request, Response

@Request.application
def hello(request):
    return Response('Hello World!')

if __name__ == '__main__':
    from werkzeug.serving import run_simple
    run_simple('localhost', 4000, hello)
```

这段代码展示了 Werkzeug 的核心模式：通过装饰器 `@Request.application` 将一个普通函数，转换为一个严格符合 WSGI 标准的应用。

### 3. Werkzeug 的四个核心动作

#### 动作一：请求解析（Request 对象）

当 HTTP 请求到达时，Werkzeug 会拦截那个丑陋的 `environ` 字典，解析、清洗后实例化成一个优雅的 `request` 对象：

```python
# 之前：直接操作字典
username = environ['HTTP_USERNAME']  # 容易出错

# 之后：优雅的对象访问
username = request.form.get('username')
```

#### 动作二：应用转换（@Request.application 装饰器）

装饰器在底层做了一个"套娃"操作：

```python
# 装饰器底层的伪代码逻辑
def inner_wsgi_app(environ, start_response):
    req = Request(environ)                  # 1. 解析请求
    resp = hello(req)                      # 2. 调用业务逻辑
    return resp(environ, start_response)   # 3. 执行 WSGI 协议
```

经过装饰后，`hello` 函数表面上只接收 `request`，本质上依然是一个接收 `environ, start_response` 的合法 WSGI 应用。

#### 动作三：响应标准化（Response 对象）

你只需要写：

```python
return Response('Hello World!')
```

当 `resp(environ, start_response)` 被执行时：
1. Response 对象自动调用 `start_response('200 OK', [('Content-Type', 'text/plain')])`
2. 字符串被编码为 `[b'Hello World!']` 返回

#### 动作四：开发服务器（run_simple）

`run_simple` 的作用：
- 在开发阶段启动一个单线程 Socket 服务
- 监听 `localhost:4000`
- 将请求转换成 `environ`，喂给被装饰过的函数

> 注意：`run_simple` 不适合生产环境，生产环境应使用 Gunicorn/uWSGI。

### 4. 对比总结

| 阶段 | 方式 | 代码量 | 可读性 |
|------|------|--------|--------|
| 原生 WSGI | 手动操作 environ 字典 | 多 | 差 |
| Werkzeug | Request/Response 封装 | 少 | 好 |

### 5. Flask 的进化

Flask 本质上就是对 Werkzeug 代码的扩展，加上路由分发功能：

```python
from werkzeug.wrappers import Request, Response

class Flask:
    def __init__(self):
        self.routes = {}

    def route(self, path):
        def decorator(func):
            self.routes[path] = func
            return func
        return decorator

    def wsgi_app(self, environ, start_response):
        request = Request(environ)
        view_func = self.routes.get(request.path)
        response = view_func(request)
        return response(environ, start_response)

    def __call__(self, environ, start_response):
        return self.wsgi_app(environ, start_response)
```

### 结论

> Werkzeug 并没有发明新的协议，它只是 Python WSGI 协议最完美的"面向对象包装器"。它把脏活累活都干了，把干净整洁的 Request 和 Response 留给了 Flask 和开发者。

## Flask 路由与视图

### 添加路由的两种方式

```python
# 方式一：使用装饰器（推荐）
@app.route('/hello')
def hello():
    return 'Hello!'

# 方式二：使用 add_url_rule
def index():
    return 'Index'

app.add_url_rule('/index', 'index', index)
```

### 路由参数

Flask 支持多种路由参数类型：

```python
@app.route('/user/<username>')              # 字符串（默认）
@app.route('/post/<int:post_id>')            # 整数
@app.route('/post/<float:post_id>')          # 浮点数
@app.route('/path/<path:subpath>')           # 路径
@app.route('/login', methods=['GET', 'POST']) # 支持多种 HTTP 方法
```

### 请求与响应

```python
from flask import Flask, request, render_template, redirect, session, make_response

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        # 处理登录逻辑...

    return render_template('login.html')

@app.route('/logout')
def logout():
    session.clear()
    return redirect('/login')
```

## Session 管理

### Session 的意义

在 Web 开发中，Session（会话）的存在是为了解决 HTTP 协议的一个致命缺陷：**无状态**。

> HTTP 协议本身是没有记忆的。当你打开一个网页，请求了一个接口，服务器返回数据后，服务器就立刻把你忘了。

Session 的意义在于：让服务器能够"认出"你，记住你之前做过什么。就像是在这几次请求之间牵了一根隐形的线。

### 1. Session 的典型应用场景

如果没有 Session，以下习以为常的功能都将无法实现：

| 场景 | 没有 Session 会怎样？ |
|------|---------------------|
| 登录状态保持 | 登录后跳转到首页，首页立刻提示"请先登录" |
| 购物车功能 | 添加商品到购物车，结账时购物车是空的 |
| 多步表单/向导 | 第一步填完点"下一步"，第二步拿不到第一步的数据 |
| 个性化设置 | 设置暗黑模式，下一个页面又变回默认的白天模式 |

### 2. Session 的工作原理

Session 的实现通常依赖于 Cookie：

```
首次见面发"通行证"
    ↓
服务器生成 session_id（如 abc123）
    ↓
浏览器存储在 Cookie 中
    ↓
每次请求自动携带 session_id
    ↓
服务器根据 session_id 查找用户数据
```

### 3. Session vs Cookie

| 特性 | Cookie | Session |
|------|--------|---------|
| 存储位置 | 客户端（浏览器） | 服务器端（内存/数据库） |
| 安全性 | 低（用户可篡改） | 高（服务器验证） |
| 适用场景 | 非敏感数据 | 敏感数据 |

> 如果把"当前余额=10000"存在 Cookie 里，黑客改成本"100万"发给服务器，服务器就傻眼了。但存在 Session 里，浏览器只存无意义的 ID，黑客改了 ID 服务器一查发现对不上，直接拒绝。

### 4. Flask 的 Session 特点

Flask 的 session 数据存储在客户端（浏览器）中，通过签名 cookie 实现安全保护：

```python
from flask import Flask, session

app = Flask(__name__)
app.secret_key = 'your-secret-key-here'  # 必须设置密钥

@app.route('/')
def index():
    session['user'] = 'admin'
    return 'Session set!'

@app.route('/get')
def get_session():
    return session.get('user', 'Not logged in')
```

**为什么 Flask 这样做？**

标准 Session 的数据存在服务器（占用内存/数据库），浏览器只存 ID。而 Flask 默认采用"客户端 Session"：把数据用密钥签名后，直接塞进 Cookie 里发回浏览器。

**这样安全吗？** 安全！因为 Werkzeug 加了密钥签名，如果黑客篡改了 Cookie 里的数据，签名就对不上，Flask 会直接识别出这是伪造的，丢弃它。

**优点：**
- 减轻服务器压力（无需维护 Session 存储）
- 无需连接 Redis 等外部存储

**缺点：**
- 数据暴露在客户端（但已加密签名）
- 不适合存储大量或敏感信息

### 5. Session 的终极意义

> **状态管理**

Session 弥补了 HTTP 无状态的先天不足，是现代 Web 应用实现用户身份认证、跨页面数据传递、业务流程串联不可或缺的基石。没有 Session，Web 就只能是一个单纯的"看图看字"工具，无法进行任何复杂的交互。

## 常见错误与解决方案

### 1. 路由方法不支持

**错误提示**：Method Not Allowed

```python
# 错误：只支持 GET，但表单提交需要 POST
@app.route('/login')
def login():
    return 'Login page'

# 解决：明确声明支持的 HTTP 方法
@app.route('/login', methods=['GET', 'POST'])
def login():
    return 'Login page'
```

### 2. Session 报错

**错误提示**：The session is unavailable because no secret key was set

```python
# 错误：没有设置 secret_key
app = Flask(__name__)

# 解决：设置 secret_key
app = Flask(__name__)
app.secret_key = 'your-secret-key-here'
```

## 小结

本文介绍了 Flask 框架的核心概念：

1. **Flask 是微框架**：核心简单，高度灵活
2. **依赖 Werkzeug 和 Jinja2**：Werkzeug 处理请求，Jinja2 渲染模板
3. **Werkzeug 封装 WSGI**：提供优雅的 Request/Response 对象
4. **路由系统**：通过 `@app.route()` 装饰器定义路由
5. **Session 管理**：通过 `secret_key` 签名保护客户端 session
6. **扩展生态**：通过 Flask 扩展添加各种功能

---

> Flask 的设计理念是"keep it simple, make it extensible"，适合快速开发中小型 Web 应用。