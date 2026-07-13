---
title: Django+nginx+uwsgi部署教程（centos7+ubuntu16.4）
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-07-11T00:00:00.000+08:00
slug: django-nginx-uwsgi-deployment
featured: false
draft: false
series: django
seriesOrder: 21
tags:
  - Python
  - Django
  - 部署
description: "Django+nginx+uwsgi 部署教程（centos7+ubuntu16.4）"
---

## Ubuntu 24.04 + Gunicorn + Nginx + systemd

CentOS 7、Ubuntu 16.04 和 Python 2 均已退出本文主线。部署基线为 Ubuntu 24.04、Python 3.12、Django 6.0.7、Gunicorn、Nginx 与 systemd。应用进程只监听本机 Unix socket，TLS 和静态文件由 Nginx 处理。

<!-- snippet: id=django-deploy-install mode=display python=3.12-3.14 deps=stdlib -->
```bash
python3 -m venv /srv/example/.venv
/srv/example/.venv/bin/python -m pip install --require-hashes -r requirements.txt
/srv/example/.venv/bin/python manage.py check --deploy
/srv/example/.venv/bin/python manage.py migrate --noinput
/srv/example/.venv/bin/python manage.py collectstatic --noinput
```

<!-- snippet: id=django-gunicorn-systemd mode=display python=3.12-3.14 deps=stdlib file=/etc/systemd/system/example.service -->
```ini
[Service]
User=example
Group=www-data
WorkingDirectory=/srv/example/app
EnvironmentFile=/etc/example.env
ExecStart=/srv/example/.venv/bin/gunicorn config.wsgi:application --bind unix:/run/example/gunicorn.sock --workers 3 --timeout 30 --access-logfile - --error-logfile -
RuntimeDirectory=example
Restart=on-failure
PrivateTmp=true
NoNewPrivileges=true
```

<!-- snippet: id=django-nginx-proxy mode=display python=3.12-3.14 deps=stdlib file=/etc/nginx/sites-available/example -->
```nginx
server {
    listen 443 ssl http2;
    server_name example.com;
    client_max_body_size 10m;
    location /static/ { alias /srv/example/static/; }
    location / {
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 35s;
        proxy_pass http://unix:/run/example/gunicorn.sock;
    }
}
```

生产设置必须包含 `DEBUG=False`、精确 `ALLOWED_HOSTS`、环境注入的 `SECRET_KEY`、HTTPS Cookie、可信代理配置和日志轮转。发布顺序应支持回滚：备份/兼容迁移 → 静态资源 → 滚动重启 → 健康检查。不要用 root 运行应用，也不要把开发服务器暴露到公网。
