---
title: Flask-Script 命令行脚本组件详解
author: 程序员
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-04-22T00:00:00.000+08:00
slug: flask-9-script
description: '详细讲解 Flask-Script 组件的使用，包括 Manager 实例创建、@manager.command 和 @manager.option 装饰器、Shell 命令、Server 命令、数据库迁移命令以及用户管理命令的实现'
tags:
  - Python
  - Flask
  - Flask-Script
  - 命令行
category: Flask
draft: false
language: zh-CN
---

## Flask-Script简介

Flask-Script是Flask的一个扩展，提供了在命令行中添加自定义命令的功能。通过Flask-Script，可以使用Python代码创建命令行脚本，非常适合执行数据库迁移、数据初始化、批量处理等任务。

### 安装Flask-Script

```bash
pip install flask-script
```

## 基本用法

### 1. 创建Manager实例

```python
from flask import Flask
from flask_script import Manager

app = Flask(__name__)
manager = Manager(app)

@manager.command
def hello():
    print('Hello, World!')

if __name__ == '__main__':
    manager.run()
```

### 2. 运行命令

```bash
python app.py hello
# 输出: Hello, World!
```

## 命令装饰器

### @manager.command

最简单的命令定义方式：

```python
@manager.command
def init_db():
    """初始化数据库"""
    db.create_all()
    print('数据库初始化完成')
```

### @manager.option

带参数的命令：

```python
@manager.option('-n', '--name', dest='name', default='World')
@manager.option('-u', '--uppercase', dest='uppercase', action='store_true')
def greet(name, uppercase):
    """问候命令"""
    msg = f'Hello, {name}!'
    if uppercase:
        msg = msg.upper()
    print(msg)
```

运行：

```bash
python app.py greet -n John
# 输出: Hello, John!

python app.py greet -n John -u
# 输出: HELLO, JOHN!
```

### @manager.arguments

使用`arguments`定义参数：

```python
from flask_script import Manager, Shell

manager = Manager(app)

@manager.arguments('-c', '--config', dest='config', default='config.py')
def setup(config):
    """设置配置"""
    print(f'使用配置文件: {config}')
```

## 常用内置命令

### Shell命令

```python
def make_shell_context():
    return {
        'db': db,
        'User': User,
        'Post': Post
    }

manager.add_command('shell', Shell(make_context=make_shell_context))
```

运行交互式Shell：

```bash
python app.py shell
# 进入交互式Python环境，可直接访问db, User等对象
```

### Server命令

```python
@manager.command
def runserver(port=5000, host='127.0.0.1'):
    """启动开发服务器"""
    app.run(host=host, port=port, debug=True)
```

运行：

```bash
python app.py runserver
python app.py runserver -p 8080
python app.py runserver -h 0.0.0.0 -p 8000
```

## 数据库迁移命令

```python
from flask_script import Manager
from flask_migrate import Migrate, MigrateCommand

migrate = Migrate(app, db)
manager.add_command('db', MigrateCommand)

@manager.command
def create_all():
    """创建所有数据库表"""
    db.create_all()
    print('数据库表创建完成')

@manager.command
def drop_all():
    """删除所有数据库表"""
    db.drop_all()
    print('数据库表已删除')

@manager.command
def recreate_all():
    """重建所有数据库表"""
    db.drop_all()
    db.create_all()
    print('数据库表重建完成')
```

迁移命令：

```bash
python app.py db init          # 初始化迁移
python app.py db migrate       # 创建迁移脚本
python app.py db upgrade        # 执行迁移
python app.py db downgrade      # 回滚迁移
```

## 用户管理命令

```python
@manager.command
def create_admin():
    """创建管理员账户"""
    username = input('请输入管理员用户名: ')
    password = input('请输入管理员密码: ')

    admin = User(
        username=username,
        is_admin=True
    )
    admin.set_password(password)

    db.session.add(admin)
    db.session.commit()

    print(f'管理员 {username} 创建成功')
```
