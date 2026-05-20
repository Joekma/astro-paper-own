---
title: Flask Session 会话存储组件
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-04-22T00:00:00.000+08:00
slug: flask-8-session
description: '深入讲解Flask-Session组件的多种会话存储方式，包括Redis、Memcached、文件系统、MongoDB等配置与使用方法，以及与内置session的对比。'
tags:
  - Python
  - Flask
  - Session
  - Redis
  - Flask-Session
series: flask
seriesOrder: 11
draft: false
language: zh-CN
---

## 简介

flask-session是flask框架的session组件，由于原来flask内置session使用签名cookie保存，该组件则将支持session保存到多个地方，如：

- redis：保存数据的一种工具，五大类型，非关系型数据库
- memcached
- filesystem
- mongodb
- sqlalchemy：那数据存到数据库表里面

**安装：**

```bash
pip3 install flask-session
```

## 存储方式

### redis

```python
#!/usr/bin/env python
# -*- coding:utf-8 -*-
import redis
from flask import Flask, session
from flask_session import Session

app = Flask(__name__)
app.debug = True
app.secret_key = 'xxxx'

app.config['SESSION_TYPE'] = 'redis'  # session类型为redis
app.config['SESSION_PERMANENT'] = False  # 如果设置为True，则关闭浏览器session就失效
app.config['SESSION_USE_SIGNER'] = False  # 是否对发送到浏览器上session的cookie值进行加密
app.config['SESSION_KEY_PREFIX'] = 'session:'  # 保存到session中的值的前缀
app.config['SESSION_REDIS'] = redis.Redis(host='127.0.0.1', port='6379', password='123123')  # 用于连接redis的配置

Session(app)

@app.route('/index')
def index():
    session['k1'] = 'v1'
    return 'xx'

if __name__ == '__main__':
    app.run()
```

### memcached

```python
#!/usr/bin/env python
# -*- coding:utf-8 -*-
import redis
from flask import Flask, session
from flask_session import Session
import memcache

app = Flask(__name__)
app.debug = True
app.secret_key = 'xxxx'

app.config['SESSION_TYPE'] = 'memcached'  # session类型为memcached
app.config['SESSION_PERMANENT'] = True  # 如果设置为True，则关闭浏览器session就失效
app.config['SESSION_USE_SIGNER'] = False  # 是否对发送到浏览器上session的cookie值进行加密
app.config['SESSION_KEY_PREFIX'] = 'session:'  # 保存到session中的值的前缀
app.config['SESSION_MEMCACHED'] = memcache.Client(['10.211.55.4:12000'])

Session(app)

@app.route('/index')
def index():
    session['k1'] = 'v1'
    return 'xx'

if __name__ == '__main__':
    app.run()
```

### filesystem

```python
#!/usr/bin/env python
# -*- coding:utf-8 -*-
import redis
from flask import Flask, session
from flask_session import Session

app = Flask(__name__)
app.debug = True
app.secret_key = 'xxxx'

app.config['SESSION_TYPE'] = 'filesystem'  # session类型为filesystem
app.config['SESSION_FILE_DIR'] = '/Users/wupeiqi/PycharmProjects/grocery/96.Flask新课程/组件/2.flask-session'  # session文件保存目录
app.config['SESSION_FILE_THRESHOLD'] = 500  # 存储session的个数如果大于这个值时，就要开始进行删除了
app.config['SESSION_FILE_MODE'] = 384  # 文件权限类型

app.config['SESSION_PERMANENT'] = True  # 如果设置为True，则关闭浏览器session就失效
app.config['SESSION_USE_SIGNER'] = False  # 是否对发送到浏览器上session的cookie值进行加密
app.config['SESSION_KEY_PREFIX'] = 'session:'  # 保存到session中的值的前缀

Session(app)

@app.route('/index')
def index():
    session['k1'] = 'v1'
    session['k2'] = 'v1'
    return 'xx'

if __name__ == '__main__':
    app.run()
```

### mongodb

```python
#!/usr/bin/env python
# -*- coding:utf-8 -*-
import redis
from flask import Flask, session
from flask_session import Session
import pymongo

app = Flask(__name__)
app.debug = True
app.secret_key = 'xxxx'

app.config['SESSION_TYPE'] = 'mongodb'  # session类型为mongodb

app.config['SESSION_MONGODB'] = pymongo.MongoClient()
app.config['SESSION_MONGODB_DB'] = 'mongo的db名称（数据库名称）'
app.config['SESSION_MONGODB_COLLECT'] = 'mongo的collect名称（表名称）'

app.config['SESSION_PERMANENT'] = True  # 如果设置为True，则关闭浏览器session就失效
app.config['SESSION_USE_SIGNER'] = False  # 是否对发送到浏览器上session的cookie值进行加密
app.config['SESSION_KEY_PREFIX'] = 'session:'  # 保存到session中的值的前缀

Session(app)

@app.route('/index')
def index():
    session['k1'] = 'v1'
    session['k2'] = 'v1'
    return 'xx'

if __name__ == '__main__':
    app.run()
```

### mongodb操作简单示例

```python
#!/usr/bin/env python
# -*- coding:utf-8 -*-
from pymongo import MongoClient

# 创建链接
conn = MongoClient('47.93.4.198', 27017)

# 选择数据库
db = conn['db1']

# 选择表
posts = db['posts']

post_data = {
    'name': 'alex',
    'age': 18
}

# 表中插入数据
result = posts.insert_one(post_data)

# 获取一条数据
row = posts.find_one()
print(row)

# 获取多条数据
rows = posts.find()
for row in rows:
    print(row)

# 删除数据
posts.delete_one(row)
```
