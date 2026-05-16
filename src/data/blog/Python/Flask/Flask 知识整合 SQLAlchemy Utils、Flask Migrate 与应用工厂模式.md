---
title: Flask 知识整合 SQLAlchemy Utils、Flask Migrate 与应用工厂模式
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-04-22T00:00:00.000+08:00
slug: flask-11-integration
description: '整合 Flask 核心知识点，包括 SQLAlchemy-Utils 的 ChoiceType 使用、scoped_session 线程安全会话管理、Flask-SQLAlchemy 和 Flask-Migrate 数据库操作，以及 Flask 应用工厂模式的完整示例'
tags:
  - Python
  - Flask
  - SQLAlchemy
  - 数据库
  - 应用工厂
category: Flask
series: flask
draft: false
language: zh-CN
---

## SQLAlchemy-Utils

由于sqlalchemy中没有提供choice方法，所以借助SQLAlchemy-Utils组件提供的choice方法。

```python
import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, UniqueConstraint, Index
from sqlalchemy.orm import relationship
from sqlalchemy_utils import ChoiceType

Base = declarative_base()

class Xuan(Base):
    __tablename__ = 'xuan'
    types_choices = (
        (1, '欧美'),
        (2, '日韩'),
        (3, '老男孩'),
    )
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(64))
    types = Column(ChoiceType(types_choices, Integer()))

    __table_args__ = {
        'mysql_engine': 'Innodb',
        'mysql_charset': 'utf8',
    }

engine = create_engine(
    "mysql+pymysql://root:123@127.0.0.1:3306/ttt2?charset=utf8",
    max_overflow=0,  # 超过连接池大小外最多创建的连接
    pool_size=5,  # 连接池大小
    pool_timeout=30,  # 池中没有线程最多等待的时间，否则报错
    pool_recycle=-1  # 多久之后对线程池中的线程进行一次连接的回收（重置）
)

Base.metadata.create_all(engine)

# 查询
result_list = session.query(Xuan).all()
for item in result_list:
    print(item.types.code, item.types.value)
```

## scoped_session

```python
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
from sqlalchemy.orm import scoped_session

engine = create_engine(
    "mysql+pymysql://root:123@47.93.4.198:3306/ttt?charset=utf8",
    max_overflow=0,  # 超过连接池大小外最多创建的连接
    pool_size=5,  # 连接池大小
    pool_timeout=30,  # 池中没有线程最多等待的时间，否则报错
    pool_recycle=-1  # 多久之后对线程池中的线程进行一次连接的回收（重置）
)

SessionFactory = sessionmaker(bind=engine)

# 方式一：由于无法提供线程共享功能，所有在开发时要注意，在每个线程中自己创建session。
from sqlalchemy.orm.session import Session
session = SessionFactory()
# 操作
session.close()

# 方式二：支持线程安全，为每个线程创建一个session
# threading.Local
# 唯一标识
from greenlet import getcurrent as get_ident
session = scoped_session(SessionFactory, get_ident)
# session.add
# 操作
session.remove()
```

## Flask-SQLAlchemy和Flask-Migrate组件

### Flask-SQLAlchemy

把Flask和SQLAlchemy结合在一起，粘合剂。

在`__init__.py`文件中：

1. 引入Flask-SQLAlchemy中的SQLAlchemy，实例化了一个SQLAlchemy对象
2. 注册Flask-SQLAlchemy：
   - **方式一**：在函数里面`SQLAlchemy(app)`（如果想在其他地方使用这种方式就不好使了）
   - **方式二**：在全局
     - 实例化：`db = SQLAlchemy()`
     - 在函数里面`db.init_app(app)`（调用init_app方法把app放进去）

3. 导入models的类
4. 导入的类中继承了`db.model`，其实本质上还是继承了Base类
5. manage.py创建数据库表，可以通过命令来创建。借助Flask-Migrate组件来完成

### Flask-Migrate

**旧方式**（被毙掉了）：在manage.py里面导入db，以后执行`db.create_all()`创建表，以后执行`drop_all()`删除表。这样不好，可以和Flask-Migrate结合起来用。

**新方式**：Flask-Migrate

1. 安装组件：`pip install Flask-Migrate`
2. 导入：

```python
from flask_migrate import Migrate
from app import db, app
```

3. 创建实例：`migrate = Migrate(app, db)`
4. 使用 Flask-Migrate 自动注册的 `flask db` 命令
5. 执行命令：

```bash
flask --app app db init  # 只执行第一次
flask --app app db migrate
flask --app app db upgrade
```

在执行命令之前，得先连接数据库，他才会知道把表放在哪里。

## 详说注册SQLAlchemy的两种方式

### 方式一

```python
from flask_sqlalchemy import SQLAlchemy
from flask import Flask

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = \
    "mysql://root:12345@localhost/test"
db = SQLAlchemy(app)
```

### 方式二

```python
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

def create_app():
    app = Flask(__name__)
    db.init_app(app)
    return app
```

## 操作数据库

通过上面注册了SQLAlchemy，就直接可以从db.session了。

### 方式一

```python
db.session  # 会自动创建一个session
db.session.add()
db.session.query(models.User.id, models.User.name).all()
db.session.commit()
db.session.remove()
```

### 方式二

```python
from app import models
models.User.query
```

## Flask中所有用到过的组件

### 连接数据库的两种操作

#### 要么DBUtils

用于执行原生SQL的，用自己的util里面的sqlhelper来完成。

#### 要么SQLAlchemy

遵循他自己的语法来链接：

**方式一**：`SQLAlchemy(app)`这种方式有局限性，如果我在其他地方也得用到呢？可以把它写到全局。

**方式二**：

```python
# 实例化一下
db = SQLAlchemy()

# 注册
# 在settings里面配置一下数据库链接方式
SQLALCHEMY_DATABASE_URI = "mysql+pymysql://root:123@47.93.4.198:3306/s6?charset=utf8"
SQLALCHEMY_POOL_SIZE = 2
SQLALCHEMY_POOL_TIMEOUT = 30
SQLALCHEMY_POOL_RECYCLE = -1

# Flask-SQLAlchemy
db.init_app(app)
```

### Flask-Session

用于把session保存在其他地方。

### Flask CLI

Flask 内置命令行系统，用于注册自定义命令和运行 `flask db` 等扩展命令。

### Flask-Migrate

数据库迁移。

### Flask-SQLAlchemy

将Flask和SQLAlchemy很好的结合在一起。

**本质**：每次操作数据库就会自动创建一个session连接，完了自动关闭。

### Blinker

信号。

### Wtforms

Form组件。

### 用到的组件和版本

```bash
pip3 freeze  # 获取环境中所有安装的模块
```

## 完整示例：Flask应用工厂模式

```python
# app/__init__.py
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_session import Session

db = SQLAlchemy()
migrate = Migrate()

def create_app(config_name='development'):
    app = Flask(__name__)

    # 根据配置加载配置
    from config import config
    app.config.from_object(config[config_name])

    # 初始化扩展
    db.init_app(app)
    migrate.init_app(app, db)
    Session(app)

    # 注册蓝图
    from .views import bp
    app.register_blueprint(bp)

    return app

# manage.py
from app import create_app, db

app = create_app()

if __name__ == '__main__':
    app.run()
```

## 命令行操作

```bash
# 初始化数据库迁移
flask --app manage:app db init

# 创建迁移脚本
flask --app manage:app db migrate

# 执行迁移
flask --app manage:app db upgrade

# 回滚
flask --app manage:app db downgrade
```

## 常见问题

### 1. 数据库连接超时

```python
SQLALCHEMY_POOL_TIMEOUT = 30
SQLALCHEMY_POOL_RECYCLE = -1  # 设为-1则不回收连接
```

### 2. 连接池大小

```python
SQLALCHEMY_POOL_SIZE = 5
SQLALCHEMY_MAX_OVERFLOW = 10  # 超过池大小的最大连接数
```

### 3. 调试模式

```python
SQLALCHEMY_ECHO = True  # 打印SQL语句
```
