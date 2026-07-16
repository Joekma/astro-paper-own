---
title: Django入门指南
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-07-11T00:00:00.000+08:00
slug: django-getting-started
featured: false
draft: false
series: django
seriesOrder: 1
tags:
  - Python
  - Django
  - Web开发
  - MTV
  - 路由
  - 视图
description: "Django入门指南，涵盖虚拟环境配置、项目创建、MTV模型、路由控制、视图函数等核心概念"
---

## 前置知识与学习目标

你需要会运行 Python、编辑文件并理解 HTTP 请求。本文基线为 Python 3.12+ 与 Django 6.0.x；读完后应能创建 `library_site` 与 `catalog` app，解释 project/app/MTV 的职责，并用一次书籍列表请求验证 URL → view → template 的闭环。开发服务器只用于本地开发。

贯穿示例统一使用 `Book`、`Member`、`Loan`，本篇只建立最小页面，不展开 ORM 优化、认证或生产部署。

> Django 是一个高级 Python Web 框架，鼓励快速开发和简洁实用的设计。

## 虚拟环境

### 什么是虚拟环境

- 对真实Python解释器的拷贝版本
- 可以独立存在，运行Python代码
- 可以在计算机上创建多个虚拟环境

### 为什么要使用虚拟环境

- 保证真实环境的纯净性
- 框架的多版本共存
- 方便做框架的版本迭代
- 降低多框架共存的维护成本

### 安装与使用

<!-- snippet: id=django-getting-started-01 mode=display python=3.12-3.14 deps=stdlib -->

```bash
python -m pip install virtualenv
virtualenv myenv
cd myenv\Scripts
activate
deactivate
```

## MTV模型

<!-- figure:s01-f01:start -->

![Django MTV 请求从 URLconf 进入 View，读取 Model，交给 Template 渲染后返回响应](./images/s01-f01-mtv-request-loop.png)

<!-- figure:s01-f01:end -->

- **Model**：模型，和数据库相关
- **Template**：模板，存放html文件，支持模板语法
- **View**：视图函数，处理请求

## 创建项目

### 终端创建

<!-- snippet: id=django-getting-started-02 mode=display python=3.12-3.14 deps=stdlib -->

```bash
django-admin startproject 项目名
cd 项目名
python3 manage.py runserver 127.0.0.1:8000
```

### 项目目录结构

<!-- snippet: id=django-getting-started-03 mode=display python=3.12-3.14 deps=stdlib -->

```text
项目名/
├── __init__.py
├── settings.py      # 配置总文件
├── urls.py          # URL配置
├── wsgi.py          # Web服务器网关接口
└── manage.py        # 项目管理器
```

### settings.py 核心配置

<!-- snippet: id=django-getting-started-04 mode=compile python=3.12-3.14 deps=stdlib -->

```python
import os

# 项目根目录
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# 安全码
SECRET_KEY = '...'

# 调试模式
DEBUG = True
ALLOWED_HOSTS = []

# 已安装应用
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
]

# 中间件
MIDDLEWARE = [...]

# 数据库配置
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': os.path.join(BASE_DIR, 'db.sqlite3'),
    }
}
```

## 路由控制

### URLconf

<!-- snippet: id=django-getting-started-05 mode=compile python=3.12-3.14 deps=Django==6.0.7 -->

```python
from django.urls import path, re_path

urlpatterns = [
    path('articles/', views.articles),
    re_path(r'^articles/(\d{4})/(\d{2})/$', views.year_month),
]
```

### 无名分组

<!-- snippet: id=django-getting-started-06 mode=compile python=3.12-3.14 deps=stdlib -->

```python
# url: /articles/2024/05
re_path(r'^articles/(\d{4})/(\d{2})$', views.year_month)
# 视图函数
def year_month(request, year, month):
    ...
```

### 有名分组

<!-- snippet: id=django-getting-started-07 mode=compile python=3.12-3.14 deps=stdlib -->

```python
re_path(r'^articles/(?P<year>\d{4})/(?P<month>\d{2})$', views.year_month)
# 视图函数
def year_month(request, year, month):
    ...
```

### 路由分发

<!-- snippet: id=django-getting-started-08 mode=compile python=3.12-3.14 deps=stdlib -->

```python
# 主urls.py
path('blog/', include('blog.urls'))

# blog/urls.py
urlpatterns = [
    re_path(r'^test/$', views.test),
]
```

## 视图函数

### 基本结构

<!-- snippet: id=django-getting-started-09 mode=compile python=3.12-3.14 deps=Django==6.0.7 -->

```python
from django.shortcuts import render, HttpResponse, redirect

def index(request):
    return HttpResponse("Hello World")
```

### request对象

| 属性             | 说明         |
| ---------------- | ------------ |
| `request.GET`    | GET请求参数  |
| `request.POST`   | POST请求参数 |
| `request.method` | 请求方法     |
| `request.path`   | 请求路径     |
| `request.FILES`  | 上传文件     |

### 响应方式

<!-- snippet: id=django-getting-started-10 mode=display python=3.12-3.14 deps=stdlib -->

```python
# 直接返回
return HttpResponse("内容")

# 渲染模板
return render(request, 'index.html', {'name': '张三'})

# 重定向
return redirect('/home/')
```

## 小结

- Django 基于 MTV 模型组织代码
- 路由使用 URLconf 配置路径与视图的映射
- 视图函数处理请求并返回响应
- 使用虚拟环境管理项目依赖

## 常见误区与最小验收

- 使用 `python -m venv .venv` 与虚拟环境内的 `python -m pip`，不要依赖系统 Python 中碰巧存在的包。
- project 是站点级配置容器，app 是可复用功能单元；不要把所有代码堆进 project 包。
- 成功标准不只是首页可开：还应运行 `python manage.py check`、迁移、请求已命名 URL，并确认 404 与日志正常。
- `DEBUG=True`、开发密钥和 `runserver` 都不是生产方案。

输入是 `GET /books/`，期望输出 `200` 和书籍列表；中间状态包括 URL 命中、view context 与模板渲染。若出现 `DisallowedHost`、迁移缺失或模板不存在，应保留原异常并逐层定位。

## 自检题

1. project 与 app 的职责有何不同？
2. URL path 中的命名参数最终传到哪里？
3. 为什么不能把 `runserver` 暴露到公网？

<details><summary>答案</summary>

1. project 管站点设置/入口，app 封装领域能力。2. 传给匹配到的 view callable。3. 它只面向开发，没有生产安全、性能和稳定性承诺。

</details>

## 下一篇衔接

目前页面可以返回内容，但布局、转义和复用尚未建立。下一篇让模板只负责展示，并用继承与 include 组合书籍页面。

## 资料来源

- [Django 官方教程：第 1 部分](https://docs.djangoproject.com/en/6.0/intro/tutorial01/)
- [URL dispatcher](https://docs.djangoproject.com/en/6.0/topics/http/urls/)
