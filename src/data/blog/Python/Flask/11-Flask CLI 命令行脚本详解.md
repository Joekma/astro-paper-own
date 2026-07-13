---
title: Flask CLI 命令行脚本详解
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-07-11T00:00:00.000+08:00
slug: flask-9-script
description: '详细讲解 Flask 内置 CLI 的使用，包括 app.cli.command、Click 参数、Shell 命令、Server 命令、数据库迁移命令以及用户管理命令的实现'
tags:
  - Python
  - Flask
  - Flask CLI
  - 命令行
category: Flask
series: flask
seriesOrder: 11
draft: false
language: zh-CN
---

## Flask CLI 简介

Flask 现在内置了基于 Click 的命令行系统，可以通过 `app.cli.command()` 注册自定义命令。新项目不再需要 Flask-Script；数据库迁移也推荐配合 Flask-Migrate 提供的 `flask db ...` 命令使用。

![Flask CLI 通过 Click 解析参数、执行 app.cli.command 并进入应用上下文完成迁移和用户管理的流程图](./images/flask-cli-click-command-flow-figure-01.png)

### 安装依赖

<!-- snippet: id=flask-9-script-01 mode=display python=3.12-3.14 deps=stdlib -->
```bash
python -m pip install flask click flask-migrate
```

## 基本用法

### 1. 注册 CLI 命令

<!-- snippet: id=flask-9-script-02 mode=compile python=3.12-3.14 deps=Flask==3.1.3 -->
```python
from flask import Flask

app = Flask(__name__)

@app.cli.command("hello")
def hello():
    print('Hello, World!')
```

### 2. 运行命令

<!-- snippet: id=flask-9-script-03 mode=display python=3.12-3.14 deps=stdlib -->
```bash
flask --app app hello
# 输出: Hello, World!
```

## 命令装饰器

### app.cli.command

最简单的命令定义方式：

<!-- snippet: id=flask-9-script-04 mode=compile python=3.12-3.14 deps=stdlib -->
```python
@app.cli.command("init-db")
def init_db():
    """初始化数据库"""
    db.create_all()
    print('数据库初始化完成')
```

### Click 参数

带参数的命令：

<!-- snippet: id=flask-9-script-05 mode=compile python=3.12-3.14 deps=stdlib -->
```python
import click

@app.cli.command("greet")
@click.option('-n', '--name', default='World')
@click.option('-u', '--uppercase', is_flag=True)
def greet(name, uppercase):
    """问候命令"""
    msg = f'Hello, {name}!'
    if uppercase:
        msg = msg.upper()
    print(msg)
```

运行：

<!-- snippet: id=flask-9-script-06 mode=display python=3.12-3.14 deps=stdlib -->
```bash
flask --app app greet -n John
# 输出: Hello, John!

flask --app app greet -n John -u
# 输出: HELLO, JOHN!
```

### 位置参数

使用 Click 定义位置参数：

<!-- snippet: id=flask-9-script-07 mode=compile python=3.12-3.14 deps=stdlib -->
```python
import click

@app.cli.command("setup")
@click.argument('config', default='config.py')
def setup(config):
    """设置配置"""
    print(f'使用配置文件: {config}')
```

## 常用内置命令

### Shell命令

<!-- snippet: id=flask-9-script-08 mode=compile python=3.12-3.14 deps=stdlib -->
```python
@app.shell_context_processor
def make_shell_context():
    return {
        'db': db,
        'User': User,
        'Post': Post
    }
```

运行交互式Shell：

<!-- snippet: id=flask-9-script-09 mode=display python=3.12-3.14 deps=stdlib -->
```bash
flask --app app shell
# 进入交互式Python环境，可直接访问db, User等对象
```

### Server命令

<!-- snippet: id=flask-9-script-10 mode=compile python=3.12-3.14 deps=stdlib -->
```python
# Flask 已内置开发服务器命令，无需额外包装
```

运行：

<!-- snippet: id=flask-9-script-11 mode=display python=3.12-3.14 deps=stdlib -->
```bash
flask --app app run
flask --app app run --port 8080
flask --app app run --host 0.0.0.0 --port 8000
```

## 数据库迁移命令

<!-- snippet: id=flask-9-script-12 mode=compile python=3.12-3.14 deps=stdlib -->
```python
from flask_migrate import Migrate

migrate = Migrate(app, db)

@app.cli.command("create-all")
def create_all():
    """创建所有数据库表"""
    db.create_all()
    print('数据库表创建完成')

@app.cli.command("drop-all")
def drop_all():
    """删除所有数据库表"""
    db.drop_all()
    print('数据库表已删除')

@app.cli.command("recreate-all")
def recreate_all():
    """重建所有数据库表"""
    db.drop_all()
    db.create_all()
    print('数据库表重建完成')
```

迁移命令：

<!-- snippet: id=flask-9-script-13 mode=display python=3.12-3.14 deps=stdlib -->
```bash
flask --app app db init          # 初始化迁移
flask --app app db migrate       # 创建迁移脚本
flask --app app db upgrade       # 执行迁移
flask --app app db downgrade     # 回滚迁移
```

## 用户管理命令

<!-- snippet: id=flask-9-script-14 mode=compile python=3.12-3.14 deps=stdlib -->
```python
@app.cli.command("create-admin")
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
