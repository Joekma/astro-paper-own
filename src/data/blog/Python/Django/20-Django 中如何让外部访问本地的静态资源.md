---
title: Django 中如何让外部访问本地的静态资源
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-04-22T00:00:00.000+08:00
slug: django-static-resources
featured: false
draft: false
series: django
seriesOrder: 20
tags:
  - Python
  - Django
description: "Django 中如何让外部访问本地的静态资源"
---

## 简单使用

> 在 Django 中开放外部访问 media 文件的入口

![Django 开放本地静态或媒体资源访问，需要在 settings.py 配置路径，并在 urls.py 中把 URL 路由映射到本地文件目录](./images/django-static-media-external-access-figure-01.png)

### 第一步：配置 settings

```python
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')
```

### 第二步：配置路由

```python
from django.views.static import serve

url(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT})
```
