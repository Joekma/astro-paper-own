---
title: Django框架：虚拟环境配置及简单使用
author: 程序员
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-04-22T00:00:00.000+08:00
slug: django-framework-1-virtualenv
description: '深入讲解Django虚拟环境配置及框架的基本使用方法。'
tags:
  - Python
  - Django
  - 虚拟环境
draft: false
language: zh-CN
---

## 虚拟环境

### 什么是虚拟环境

- 对真实的python解释器的一个拷贝版本
- 是实际有效的，可以独立存在运行解释python代码
- 可以在计算机上拷贝多个虚拟环境

### 为什么要使用虚拟环境

- 保证真实环境的纯净性
- 框架的多版本共存
- 方便做框架的版本迭代
- 降低多框架共存的维护成本

### 安装虚拟环境

1. 通过pip3安装虚拟环境：`pip3 install virtualenv`
2. 前往目标文件夹：`cd 目标文件夹 (D:\Virtualenv)`
3. 创建纯净虚拟环境：`virtualenv 虚拟环境名 (py3-env1)`
4. 终端启动虚拟环境：
   - `cd py3-env1\Scripts`
   - `activate`
5. 进入虚拟环境下的python开发环境：`python3`
6. 关闭虚拟环境：`deactivate`
7. PyCharm的开发配置：
   - 添加：创建项目 -> Project Interpreter -> Existing interpreter -> Virtualenv Environment | System Interpreter -> 目标路径下的python.exe
   - 删除：Setting -> Project -> Project Interpreter -> Show All

## Web架构

### Web应用架构

- **C/S 架构**：client server，客户端服务器架构，如C++
- **B/S 架构**：browser server，浏览器服务器架构，如Java、Python

## 原生Socket

完成B/S架构项目的设计：

Browser已经完成，Server需要手动书写socket，以http协议方式完成响应。

```python
import socket

# 设置响应头(包含响应行)
```

## Django环境安装

### 安装步骤

- 安装python3.6版本：官网下载python3.6安装包，安装本地，并配置环境变量
- 安装Django1.11.9版本：官网查看Django各版本特性

### 终端安装Django

- 安装命令：`pip3 install django==1.11.9`
- 查看版本：`django-admin --version`

### PyCharm可视化安装

- 项目设置下Project Interpreter下为python3.6版本安装
- 搜索Django包，并选取对应版本号

## 创建项目

### 终端创建

1. 指定目录下：`cd 目标路径`
2. 创建django项目：`django-admin startproject 项目名`
3. 进入项目目录：`cd 项目名`
4. 启动项目：`python3 manage.py runserver 127.0.0.1:8000`
5. 停止项目：`Ctrl + c`

### PyCharm创建（略）

## 项目目录

```yaml
- __init__.py：模块的配置文件，将blog_proj文件夹变成了模块
- settings.py：配置总文件
- urls.py：url配置文件，django项目中的所有页面都需要对其配置url地址
- wsgi.py：web server gateway interface，服务器网关接口，python应用与web服务器直接通信的接口
- templates：模板文件夹，存放html文件的（页面），支持使用Django模板语言(DTL)，也可以使用第三方(jinja2)
- manage.py：项目管理器，与项目交互的命令行工具集的入口，查看支持的所有命令`python3 manage.py`
```

### 分析settings.py

```python
import os

# 项目根目录
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# 项目安全码
SECRET_KEY = 'guwba1u$18=&*8kf44_u&swqb@xlwgel7n$0rs=(+f10yvz)p0'

# 调试模式，上线项目要关闭debug模式，不然后台出现异常会直接抛给前台展现给用户看了
DEBUG = True

# 在上线项目中，规定只能以什么ip地址来访问django项目
# DEBUG = FALSE
# ALLOWED_HOSTS = ['localhost']
ALLOWED_HOSTS = []

# 项目自带的应用
# 我们创建了自己的应用就要将自定义应用添加到该配置
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
]

# 中间件
# django自带的工具集
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# 配置url配件文件的根文件，执行urls.py
ROOT_URLCONF = '项目目录.urls'

# 模板，一个个html文件
TEMPLATES = [
    {
        # 如果使用第三方，可以在这个地方修改模板引擎
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [os.path.join(BASE_DIR, 'templates')],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

# 服务器网关接口应用
WSGI_APPLICATION = '项目目录.wsgi.application'

# 数据库配置
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': os.path.join(BASE_DIR, 'db.sqlite3'),
    }
}

# 密码认证配置
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# 国际化相关配置
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_L10N = True
USE_TZ = True

# 静态文件地址 (CSS, JavaScript, Images)
STATIC_URL = '/static/'
```

## 创建项目应用

```bash
python manage.py startapp app名称
```

## 小结

本篇文章介绍了Django虚拟环境的配置和使用方法，以及如何创建Django项目和理解项目目录结构。虚拟环境可以帮助我们管理不同项目的依赖，避免版本冲突。创建项目后，需要了解settings.py中各个配置项的作用，以便更好地进行后续开发。

---