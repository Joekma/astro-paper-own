---
title: Django 中如何让外部访问本地的静态资源
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-04-22T00:00:00.000+08:00
slug: django-static-resources
featured: false
draft: false
series: Django
seriesOrder: 20
tags:
  - Python
  - Django
description: "Django 中如何让外部访问本地的静态资源"
---

## 简单使用

> 在 Django 中开放外部访问 media 文件的入口

### 第一步：配置 settings

```python
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')
```

### 第二步：配置路由

```python
from django.views.static import serve

url(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT})
```
