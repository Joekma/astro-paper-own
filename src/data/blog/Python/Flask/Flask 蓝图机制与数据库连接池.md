---
title: Flask 蓝图机制与数据库连接池
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-04-22T00:00:00.000+08:00
slug: flask-3-blueprint-dbutils
description: '深入讲解Flask蓝图（Blueprint）的使用、基于DBUtils实现数据库连接池（两种模式）、本地线程（threading.local）以及Flask上下文管理机制。'
tags:
  - Python
  - Flask
  - 蓝图
  - 数据库连接池
  - DBUtils
series: flask
draft: false
language: zh-CN
---

# Flask 蓝图机制与数据库连接池实战

## 设置配置文件的几种方式

```python
# 方式一：直接赋值
app.config['DEBUG'] = True

# 方式二：从 Python 文件加载
app.config.from_pyfile('settings.py')

# 方式三：从环境变量加载
import os
os.environ['FLASK_SETTINGS'] = 'settings.py'
app.config.from_envvar('FLASK_SETTINGS')

# 方式四（推荐）：使用对象方式
app.config.from_object('settings.DevConfig')
```

> 注：方式四最灵活，只需改变类名即可切换不同环境配置

**获取配置：** 在视图函数中使用 `current_app.config` 获取当前应用的配置

```python
from flask import current_app

@app.route('/index')
def index():
    print(current_app.config.get("DEBUG"))
    return "index"
```

# 蓝图（Flask 多 py 文件拆分）

蓝图是对 Flask 项目进行模块化组织的机制，适用于中小型项目。

## 小中型项目示例

```python
# manage.py
import fcrm

if __name__ == '__main__':
    fcrm.app.run()
```

```python
# __init__.py
from flask import Flask
from fcrm.views import account, order

app = Flask(__name__)
app.register_blueprint(account.account)
app.register_blueprint(order.order)
```

```python
# account.py
from flask import Blueprint, render_template

account = Blueprint("account", __name__)

@account.route('/account')
def index():
    return "account"

@account.route("/login")
def login():
    return render_template("login.html")
```

```python
# order.py
from flask import Blueprint

order = Blueprint("order", __name__)

@order.route('/order')
def register():
    return "order"
```

## 注意事项

- 视图函数名不能与蓝图对象名相同
- 使用 `url_for('蓝图名.函数名')` 生成 URL
- 大型项目建议使用 `url_prefix` 参数为蓝图设置路由前缀

## 大型项目目录结构

```
fcrm/
├── __init__.py           # 创建Flask应用并注册蓝图
├── views/                # 视图模块目录
│   ├── __init__.py
│   ├── account.py        # 账户相关视图
│   └── order.py          # 订单相关视图
├── models/               # 数据模型目录
├── templates/            # 模板目录
│   ├── account/          # 账户模板
│   └── order/            # 订单模板
├── static/               # 静态文件目录
└── manage.py             # 项目启动文件
```

# 数据库连接池

## 为什么需要连接池

| 方式 | 问题 |
|------|------|
| 每次创建新连接 | 频繁创建销毁，资源消耗大 |
| 全局单连接 | 不支持并发访问 |
| **连接池** | ✅ 既减少连接次数，又支持并发 |

## DBUtils 两种模式

### 模式一：PersistentDB（线程独立连接）

每个线程拥有独立的数据库连接，基于 `threading.local` 实现。

```python
from DBUtils.PersistentDB import PersistentDB
import pymysql

POOL = PersistentDB(
    creator=pymysql,
    maxusage=None,          # 连接最大复用次数
    setsession=[],          # 会话前执行的命令
    ping=0,                 # ping MySQL 检查可用性 (0/1/2/4/7)
    closeable=False,        # False=伪关闭，True=真关闭
    threadlocal=None,       # 本线程独享的连接对象
    host='127.0.0.1',
    port=3306,
    user='root',
    password='123',
    database='pooldb',
    charset='utf8'
)

@app.route('/func')
def func():
    conn = POOL.connection()  # 获取连接
    cursor = conn.cursor()
    cursor.execute('select * from tb1')
    result = cursor.fetchall()
    cursor.close()
    conn.close()  # 伪关闭，线程内可复用
    return str(result)
```

### 模式二：PooledDB（连接池共享连接）

所有线程共享连接池中的连接，用完归还，**更常用**。

```python
from DBUtils.PooledDB import PooledDB
import pymysql

POOL = PooledDB(
    creator=pymysql,
    maxconnections=6,   # 最大连接数
    mincached=2,        # 初始化空闲连接数
    maxcached=5,        # 最大空闲连接数
    maxshared=3,        # 共享连接数（pymysql 无效）
    blocking=True,      # 无可用连接时阻塞等待
    maxusage=None,      # 连接最大复用次数
    setsession=[],
    ping=0,
    host='127.0.0.1',
    port=3306,
    user='root',
    password='123',
    database='pooldb',
    charset='utf8'
)

def func():
    conn = POOL.connection()
    cursor = conn.cursor()
    cursor.execute('select * from tb1')
    result = cursor.fetchall()
    conn.close()  # 归还连接到池中
    return str(result)
```

> **建议**：优先使用 `PooledDB` 模式，线程数较多时性能更好

# 本地线程

`threading.local()` 为每个线程提供独立的变量空间，线程间互不干扰。

```python
import threading
import time

local_values = threading.local()

def func(num):
    local_values.name = num
    time.sleep(2)
    print(f"线程 {threading.current_thread().name}: {local_values.name}")

# 未使用本地线程：5个线程共享同一个变量，输出混乱
# 使用本地线程：每个线程只看到自己的值
```

**应用场景**：在数据库连接池模式一中，保证每个线程拥有独立的数据库连接

# 上下文管理

## Flask vs Django

| 框架 | 请求数据传递方式 |
|------|------------------|
| Django | 通过参数传递 `def view(request)` |
| Flask | 基于 LocalStack 自动管理 |

## 工作原理

```text
# Flask 内部使用 LocalStack 管理请求上下文
{
    协程ID: { 'stack': [request, session, g], ... },
    协程ID: { 'stack': [] },
}
```

**流程**：
1. 请求进来 → `push` 数据到栈
2. 视图函数 → `top` 获取数据
3. 请求结束 → `pop` 移除数据

```python
from flask import Flask, request, session, g

app = Flask(__name__)

@app.route('/')
def index():
    # request, session, g 都是从 LocalStack 获取的
    print(request.args)      # 查询参数
    print(session.get('user'))  # 会话数据
    print(g.db)              # 请求级全局变量
    return "OK"
```

> Flask 使用 `greenlet.getcurrent` 获取协程 ID，确保多请求/多协程环境下数据不混淆

## 核心类实现

```python
class Local:
    """基于协程 ID 的线程安全存储"""
    def __init__(self):
        object.__setattr__(self, '__storage__', {})
        object.__setattr__(self, '__ident_func__', get_ident)

    def __setattr__(self, name, value):
        ident = self.__ident_func__()
        if ident not in self.__storage__:
            self.__storage__[ident] = {}
        self.__storage__[ident][name] = value

    def __getattr__(self, name):
        return self.__storage__[self.__ident_func__()][name]

class LocalStack:
    """栈结构，支持 push/pop/top"""
    def __init__(self):
        self._local = Local()

    def push(self, obj):
        rv = getattr(self._local, 'stack', None) or []
        rv.append(obj)
        self._local.stack = rv
        return rv

    def pop(self):
        stack = getattr(self._local, 'stack', None)
        if not stack:
            return None
        return stack.pop()

    @property
    def top(self):
        stack = getattr(self._local, 'stack', None)
        return stack[-1] if stack else None
```

**总结**：Flask 的上下文管理机制通过 LocalStack 实现了请求数据的自动管理，让开发者无需显式传递 `request` 对象，使代码更简洁。
