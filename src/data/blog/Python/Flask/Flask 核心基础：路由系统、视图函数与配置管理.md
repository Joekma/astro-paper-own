---
title: Flask 核心基础：路由系统、视图函数与配置管理
author: 程序员
pubDatetime: 2024-08-13T00:00:00.000+08:00
updated: 2026-04-22T00:00:00.000+08:00
slug: flask-2-basics
description: 'Flask 核心基础教程，详解路由系统配置、视图函数编写、请求响应处理、Session 会话管理以及 Flask 配置文件的各种加载方式'
tags:
  - Python
  - Flask
  - 路由
  - 视图
category: Flask
draft: false
language: zh-CN
---

## 知识点回顾

>Flask依赖wsgi，实现wsgi的模块：wsgiref, werkzeug, uwsgi

**实例化Flask对象，里面是有参数的：**

>Flask对象的参数有：
- `__name__`：应用的名称，用于生成静态文件的URL
- `template_folder`：模板文件的目录
- `static_url_path`：静态文件的URL路径
- `static_folder`：静态文件的目录

```python
app = Flask(__name__, template_folder='templates', static_url_path='/xxxxxx')
```

### 两种添加路由的方式

```python
# 方式一：
@app.route('/xxxx')  # @decorator
def index():
    return "Index"

# 方式二：
def index():
    return "Index"
app.add_url_rule('/xxx', "n1", index)  # n1是别名
```

### 添加路由关系的本质

>将url和视图函数封装成一个Rule对象，添加到Flask的url_map字段中。

### Flask中装饰器应用

>Flask中装饰器的应用有：
- 路由装饰器：`@app.route()`
- 视图函数装饰器：`@wrapper`
- 其他装饰器：如`@login_required`、`@admin_required`等

```python
from flask import Flask, render_template, request, redirect, session
app = Flask(__name__)
app.secret_key = "sdsfdsgdfgdfgfh"

def wrapper(func):
    def inner(*args, **kwargs):
        if not session.get("user_info"):
            return redirect("/login")
        ret = func(*args, **kwargs)
        return ret
    return inner

@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "GET":
        return render_template("login.html")
    else:
        username = request.form.get("username")
        password = request.form.get("password")
        if username == "mark" and password == "123":
            session["user_info"] = username
            return redirect("/index")
        else:
            return render_template("login.html", msg="用户名或者密码错误")

@app.route("/index", methods=["GET", "POST"])
@wrapper
def index():
    return render_template("index.html")

if __name__ == '__main__':
    app.run(debug=True)
```

### 请求响应相关

**request：**

- `request.form`：POST请求
- `request.args`：GET请求，字典形式的
- `request.querystring`：GET请求，bytes形式的

**response：**

- `return render_template()`
- `return redirect()`
- `return ""`
- `v = make_response(返回值)`：把返回的值包在了这个函数里面

**session：**

- 存在浏览器上，并且是加密的
- 依赖于：`secret_key`

### Flask配置文件

Flask中的配置文件是一个flask.config.Config对象（继承字典），默认配置为：

```python
{
    'DEBUG': get_debug_flag(default=False),  # 是否开启Debug模式
    'TESTING': False,  # 是否开启测试模式
    'PROPAGATE_EXCEPTIONS': None,  # 是否传播异常到WSGI应用
    'PRESERVE_CONTEXT_ON_EXCEPTION': None,  # 异常时是否保留请求上下文
    'SECRET_KEY': None,  # 密钥，用于会话安全签名
    'PERMANENT_SESSION_LIFETIME': timedelta(days=31),  # 永久会话生命周期
    'USE_X_SENDFILE': False,  # 是否使用X-Sendfile提供文件下载
    'LOGGER_NAME': None,  # 日志记录器名称
    'LOGGER_HANDLER_POLICY': 'always',  # 日志处理器策略：always、debug、production
    'SERVER_NAME': None,  # 服务器名称，用于设置完整的域名
    'APPLICATION_ROOT': None,  # 应用根路径，用于子应用部署
    'SESSION_COOKIE_NAME': 'session',  # 会话Cookie的名称
    'SESSION_COOKIE_DOMAIN': None,  # 会话Cookie的域名
    'SESSION_COOKIE_PATH': None,  # 会话Cookie的路径
    'SESSION_COOKIE_HTTPONLY': True,  # 是否启用HttpOnly标志防止XSS
    'SESSION_COOKIE_SECURE': False,  # 是否仅通过HTTPS发送Cookie
    'SESSION_REFRESH_EACH_REQUEST': True,  # 每次请求是否刷新会话过期时间
    'MAX_CONTENT_LENGTH': None,  # 最大请求内容长度（字节）
    'SEND_FILE_MAX_AGE_DEFAULT': timedelta(hours=12),  # 静态文件缓存时间
    'TRAP_BAD_REQUEST_ERRORS': False,  # 是否捕获BadRequest异常
    'TRAP_HTTP_EXCEPTIONS': False,  # 是否捕获所有HTTP异常
    'EXPLAIN_TEMPLATE_LOADING': False,  # 是否显示模板加载信息
    'PREFERRED_URL_SCHEME': 'http',  # URL生成时首选的协议方案
    'JSON_AS_ASCII': True,  # JSON响应是否使用ASCII编码
    'JSON_SORT_KEYS': True,  # JSON响应按键排序
    'JSONIFY_PRETTYPRINT_REGULAR': True,  # JSON是否美化输出
    'JSONIFY_MIMETYPE': 'application/json',  # JSON响应的MIME类型
    'TEMPLATES_AUTO_RELOAD': None,  # 是否自动重新加载模板
}
```

**配置方式：**

**方式一：**

```python
app.config['DEBUG'] = True
# 由于Config对象本质上是字典，所以还可以使用app.config.update(...)
```

**方式二：**

```python
app.config.from_pyfile("python文件名称")
# 如：settings.py中定义DEBUG = True，然后app.config.from_pyfile("settings.py")
```

**方式三：**

```python
app.config.from_envvar("环境变量名称")
# 环境变量的值为python文件名称，内部调用from_pyfile方法
```

**方式四：**

```python
app.config.from_json("json文件名称")
# JSON文件名称，必须是json格式，因为内部会执行json.loads
```

**方式五：**

```python
app.config.from_mapping({'DEBUG': True})
# 字典格式
```

**方式六：**

```python
app.config.from_object("python类或类的路径")
# app.config.from_object('pro_flask.settings.TestingConfig')
```

settings.py示例：

```python
class Config(object):
    DEBUG = False
    TESTING = False
    DATABASE_URI = 'sqlite://:memory:'

class ProductionConfig(Config):
    DATABASE_URI = 'mysql://user@localhost/foo'

class DevelopmentConfig(Config):
    DEBUG = True

class TestingConfig(Config):
    TESTING = True
```

**注意：** settings.py文件默认路径要放在程序root_path目录，如果instance_relative_config为True，则就是instance_path目录。

## 路由系统

### 可传入参数

```python
@app.route('/user/<username>')   # 常用的，不加参数的时候默认是字符串形式的
@app.route('/post/<int:post_id>')  # 常用的，指定int，说明是整型的
@app.route('/post/<float:post_id>')
@app.route('/post/<path:path>')
@app.route('/login', methods=['GET', 'POST'])
```

### 常用路由系统有以上五种，所有的路由系统都是基于以下对应关系来处理

```python
DEFAULT_CONVERTERS = {
    'default': UnicodeConverter,
    'string': UnicodeConverter,
    'any': AnyConverter,
    'path': PathConverter,
    'int': IntegerConverter,
    'float': FloatConverter,
    'uuid': UUIDConverter,
}
```

### 反向生成URL：url_for

**endpoint**（别名，相当于django中的name）

**反向解析**需要导入：

```python
from flask import Flask, url_for

@app.route('/index', endpoint="xxx")
def index():
    v = url_for("xxx")
    print(v)
    return "index"

@app.route('/zzz/<int:nid>', endpoint="aaa")
def zzz(nid):
    v = url_for("aaa", nid=nid)
    print(v)
    return "index2"
```

#### 为什么要用 url_for 而不是硬编码

- **可维护性**：修改路由路径（如从 `/about` 改为 `/about-us`）时，只要改一处 `@app.route` 即可，所有 `url_for` 自动更新
- **防止错误**：避免手写路径时漏掉斜杠或写错拼写
- **自动处理特殊字符**：自动对 URL 中的参数进行编码，避免安全问题
- **统一风格**：让代码更加规范和清晰
- **灵活性**：支持蓝图（Blueprint）等高级功能，在大型项目中尤其重要

### @app.route和app.add_url_rule参数

| 参数 | 说明 |
|------|------|
| rule | URL规则 |
| view_func | 视图函数名称 |
| defaults=None | 默认值，当URL中无参数，函数需要参数时，使用defaults={'k':'v'}为函数提供参数 |
| endpoint=None | 名称，用于反向生成URL，即：url_for('名称') |
| methods=None | 允许的请求方式，如：["GET", "POST"] |
| strict_slashes=None | 对URL最后的/符号是否严格要求 |
| redirect_to=None | 重定向到指定地址 |
