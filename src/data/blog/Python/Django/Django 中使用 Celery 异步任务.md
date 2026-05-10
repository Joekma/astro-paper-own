---
title: Django 中使用 Celery 异步任务
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-04-22T00:00:00.000+08:00
slug: django-celery
featured: false
draft: false
series: django
tags:
  - Python
  - Django
  - Celery
description: "深入讲解在Django中使用Celery实现异步任务的方法。"
---

## 安装

```bash
pip install django-celery
```

> 推荐使用 `django-celery` 模块以便更好地管理 Celery

## 使用

> 推荐将 Celery 配置单独放在 `celery_config.py` 中

```python
# celery_config.py
import djcelery
import os

os.environ.setdefault('FORED_BY_MULTIPROCESSING', '1')
djcelery.setup_loader()

# Redis 作为消息代理和结果存储
BROKER_URL = 'redis://127.0.0.1:6379/1'
CELERY_RESULT_BACKEND = 'redis://127.0.0.1:6379/2'

# 时区配置
CELERY_ENABLE_UTC = True
CELERY_TIMEZONE = 'Asia/Shanghai'

# 自动导入任务模块
CELERY_IMPORTS = (
    'app.tasks',
)

# 防止死锁
CELERY_FORCE_EXECV = True

# 并发 worker 数量
CELERYD_CONCURRENCY = 4

# 任务完成后确认
CELERY_ACKS_LATE = True

# 防止内存泄露
CELERYD_MAX_TASKS_PER_CHILD = 40

# 任务超时时间（15分钟）
CELERYD_TASK_TIME_LIMIT = 15 * 60

# 默认队列
CELERY_DEFAULT_QUEUE = "default"

# 自定义队列配置
CELERY_QUEUES = {
    "default": {
        "exchange": "default",
        "exchange_type": "direct",
        "routing_key": "default"
    },
    "beat_queue": {
        "exchange": "beat_queue",
        "exchange_type": "direct",
        "routing_key": "beat_queue"
    }
}
```

### 创建任务

```python
# app/tasks.py
from celery.task import Task
import time

class TestTask(Task):
    name = 'test-task'

    def run(self, *args, **kwargs):
        print('start test task')
        time.sleep(4)
        print('args={}, kwargs={}'.format(args, kwargs))
        print('end test task')
```

### 配置 Django

```python
# settings.py
INSTALLED_APPS = [
    # ...
    'djcelery',
]

from learn_django.celery_config import *
```

### 调用任务

```python
# views.py
from django.http import HttpResponse
from app.tasks import TestTask

def test_task(request):
    print('start do request')
    t = TestTask()
    t.delay()  # 异步执行
    print('end do request')
    return HttpResponse('ok')
```

### 启动 Worker

```bash
python manage.py celery worker -l info
```

## 定时任务

> 在 `celery_config.py` 中添加定时任务配置

```python
CELERYBEAT_SCHEDULE = {
    'task1-every-1-min': {
        'task': 'test-task',
        'schedule': datetime.timedelta(seconds=5),
        'args': (2, 15),
        'options': {
            'queue': 'beat_queue',
        }
    },
}
```

> 建议为定时任务使用单独队列，避免任务积压导致延迟执行

### 启动 Beat

```bash
python manage.py celery beat -l info
```

## 监控工具 Flower

> Flower 是基于 Tornado 开发的 Celery 监控 Web 应用

### 安装与启动

```bash
pip install flower
python manage.py celery flower
# 支持 Basic Auth
# python manage.py celery flower --basic_auth=admin:admin
```

> 访问 `http://localhost:5555` 查看监控界面
