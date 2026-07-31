---
title: Flask 部署与分发：Gunicorn、Nginx、Supervisor、Docker
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-04-22T00:00:00.000+08:00
slug: flask-deployment
description: '深入讲解Flask应用部署方案，包括Gunicorn、Nginx、Supervisor、Docker等多种部署方案，以及生产环境配置和安全优化建议。'
tags:
  - Python
  - Flask
  - 部署
  - Gunicorn
  - Nginx
series: Flask
seriesOrder: 12
draft: false
language: zh-CN
---

## Flask部署概述

>Flask应用开发完成后，需要将应用部署到生产环境。本文介绍多种Flask部署方案，包括开发服务器、生产级WSGI服务器、Docker容器化等。

## 开发环境 vs 生产环境

### 配置差异

```python
# config.py
import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key'
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'sqlite:///app.db'
    DEBUG = False
    TESTING = False

class DevelopmentConfig(Config):
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///dev.db'

class ProductionConfig(Config):
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')
    # 生产环境使用更安全的设置
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
```

### 应用工厂模式

```python
# app/__init__.py
from flask import Flask
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

def create_app(config_name='development'):
    app = Flask(__name__)

    from config import config
    app.config.from_object(config[config_name])

    db.init_app(app)

    # 注册蓝图
    from .views import bp
    app.register_blueprint(bp)

    return app

# run.py
from app import create_app
app = create_app(os.environ.get('FLASK_ENV', 'development'))
```

## 使用Gunicorn

Gunicorn是最常用的Python WSGI服务器。

### 安装Gunicorn

```bash
pip install gunicorn
```

### 基本使用

```bash
# 启动命令
gunicorn -w 4 -b 0.0.0.0:8000 app:app

# 使用配置文件
gunicorn -c gunicorn_config.py app:app
```

### Gunicorn配置文件

```python
# gunicorn_config.py
import multiprocessing

# 绑定地址
bind = '0.0.0.0:8000'

# 工作进程数
workers = multiprocessing.cpu_count() * 2 + 1

# 工作模式
worker_class = 'sync'  # 或 'gevent', 'eventlet'

# 超时设置
timeout = 30
graceful_timeout = 10
keepalive = 2

# 日志
accesslog = '/var/log/gunicorn/access.log'
errorlog = '/var/log/gunicorn/error.log'
loglevel = 'info'

# 进程名称
proc_name = 'myapp'

# 预加载应用
preload_app = True

# 守护进程模式
daemon = False

# 最大请求数后重启worker
max_requests = 1000
max_requests_jitter = 50
```

### 使用Gevent优化

```bash
pip install gevent greenlet

# 配置
worker_class = 'gevent'
worker_connections = 1000
```

## 使用Nginx反向代理

Nginx作为反向代理服务器，处理静态文件和负载均衡。

### Nginx安装

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nginx

# CentOS
sudo yum install nginx
```

### Nginx配置

```nginx
# /etc/nginx/sites-available/myapp
upstream myapp {
    server 127.0.0.1:8000;
    server 127.0.0.1:8001;
    server 127.0.0.1:8002;
}

server {
    listen 80;
    server_name example.com;

    # 静态文件
    location /static/ {
        alias /var/www/myapp/static/;
        expires 30d;
    }

    # 媒体文件
    location /media/ {
        alias /var/www/myapp/media/;
        expires 7d;
    }

    # 代理到Gunicorn
    location / {
        proxy_pass http://myapp;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket支持
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## Supervisor进程管理

Supervisor用于管理Gunicorn进程。

### 安装Supervisor

```bash
# Ubuntu/Debian
sudo apt install supervisor

# CentOS
sudo yum install supervisor
```

### Supervisor配置

```ini
# /etc/supervisor/conf.d/myapp.conf
[program:myapp]
command = /path/to/venv/bin/gunicorn -c /path/to/gunicorn_config.py run:app
directory = /path/to/project
user = www-data
autostart = true
autorestart = true
stdout_logfile = /var/log/supervisor/myapp.log
stderr_logfile = /var/log/supervisor/myapp_error.log
```

### 常用命令

```bash
# 重新加载配置
sudo supervisorctl reread
sudo supervisorctl update

# 启动/停止/重启
sudo supervisorctl start myapp
sudo supervisorctl stop myapp
sudo supervisorctl restart myapp

# 查看状态
sudo supervisorctl status
```

## Docker容器化部署

### Dockerfile

```dockerfile
# 使用官方Python镜像
FROM python:3.12-slim

# 设置工作目录
WORKDIR /app

# 复制依赖文件
COPY requirements.txt .

# 安装依赖
RUN pip install --no-cache-dir -r requirements.txt

# 复制应用代码
COPY . .

# 暴露端口
EXPOSE 8000

# 启动命令
CMD ["gunicorn", "-c", "gunicorn_config.py", "run:app"]
```

### requirements.txt

```
Flask>=2.0.0
gunicorn>=20.0.0
flask-sqlalchemy>=3.0.0
psycopg2-binary>=2.9.0
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  web:
    build: .
    ports:
      - "8000:8000"
    environment:
      - FLASK_ENV=production
      - DATABASE_URL=postgresql://user:pass@db:5432/myapp
    depends_on:
      - db
    restart: always

  db:
    image: postgres:13
    environment:
      - POSTGRES_DB=myapp
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### 构建和运行

```bash
# 构建镜像
docker build -t myapp:latest .

# 运行容器
docker run -d -p 8000:8000 myapp:latest

# 使用docker-compose
docker-compose up -d
```

## 安全注意事项

### 1. 环境变量管理

```bash
# 不要在代码中硬编码密钥
# 使用环境变量
import os
SECRET_KEY = os.environ.get('SECRET_KEY')
```

### 2. HTTPS配置

```nginx
# 强制HTTPS
server {
    listen 80;
    server_name example.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name example.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # SSL配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
}
```

### 3. 防火墙设置

```bash
# 只开放必要的端口
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

## 性能优化建议

1. 使用Gunicorn多worker
2. 启用Gevent异步处理
3. 配置Nginx缓存静态文件
4. 使用CDN加速静态资源
5. 配置数据库连接池
6. 使用缓存（Redis）减少数据库查询
