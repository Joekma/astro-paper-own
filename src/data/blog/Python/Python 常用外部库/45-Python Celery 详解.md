---
title: Python Celery 详解
author: Joekma
pubDatetime: 2024-08-13T00:00:00Z
slug: celery
modDatetime: 2026-04-22T00:00:00Z
featured: false
draft: false
tags:
  - Python
  - Celery
  - docs
description: Celery 分布式任务队列详解，包含异步任务、定时任务和 Django 集成。
series: python
seriesOrder: 45
language: zh-CN
---

# Celery 详解

## Celery架构

Celery的架构由三部分组成：消息中间件（message broker）、任务执行单元（worker）和任务执行结果存储（task result store）组成。

### 消息中间件

Celery本身不提供消息服务，但是可以方便的和第三方提供的消息中间件集成，包括RabbitMQ、Redis等。

### 任务执行单元

Worker是Celery提供的任务执行的单元，worker并发的运行在分布式的系统节点中。

### 任务结果存储

Task result store用来存储Worker执行的任务的结果，Celery支持以不同方式存储任务的结果，包括AMQP、Redis等。

## 版本支持情况

**现代 Celery 运行环境：**

- 建议使用 Python 3.10+ 的受支持版本
- 新项目优先选择 Celery 5.x 及更新版本

Celery 4.x 和 Python 2 相关组合只适合维护历史项目，新项目不建议再选择。

**如果你运行的是较旧的Python版本，需要运行较旧的Celery版本：**

| Python版本 | Celery版本 |
|-----------|------------|
| Python 2.6 | Celery series 3.1 or earlier |
| Python 2.5 | Celery series 3.0 or earlier |
| Python 2.4 | Celery series 2.2 or earlier |

> **注意**：Celery是一个资金最少的项目，所以我们不支持Microsoft Windows。请不要打开与该平台相关的任何问题。

## 使用场景

### 异步任务

将耗时操作任务提交给Celery去异步执行，比如发送短信/邮件、消息推送、音视频处理等等。

### 定时任务

定时执行某件事情，比如每天数据统计。

## Celery的安装配置

```bash
pip install celery
```

消息中间件：RabbitMQ/Redis

```python
app = Celery('任务名', backend='xxx', broker='xxx')
```

## Celery执行异步任务

### 基本使用

#### 创建项目celerytest

#### 创建py文件：celery_app_task.py

```python
import celery
import time

# broker='redis://127.0.0.1:6379/2' 不加密码
backend='redis://:123456@127.0.0.1:6379/1'
broker='redis://:123456@127.0.0.1:6379/2'
cel=celery.Celery('test',backend=backend,broker=broker)

@cel.task
def add(x,y):
    return x+y
```

#### 创建py文件：add_task.py, 添加任务

```python
from celery_app_task import add

result = add.delay(4,5)
print(result.id)
```

#### 创建py文件：run.py，执行任务

或者使用命令执行：`celery worker -A celery_app_task -l info`

> 注：Windows下：`celery worker -A celery_app_task -l info -P eventlet`

```python
from celery_app_task import cel

if __name__ == '__main__':
    cel.worker_main()
    # cel.worker_main(argv=['--loglevel=info'])
```

#### 创建py文件：result.py，查看任务执行结果

```python
from celery.result import AsyncResult
from celery_app_task import cel

task_result = AsyncResult(id="e919d97d-2938-4d0f-9265-fd8237dc2aa3", app=cel)

if task_result.successful():
    result = task_result.get()
    print(result)
    # result.forget()  # 将结果删除
elif task_result.failed():
    print('执行失败')
elif task_result.status == 'PENDING':
    print('任务等待中被执行')
elif task_result.status == 'RETRY':
    print('任务异常后正在重试')
elif task_result.status == 'STARTED':
    print('任务已经开始被执行')
```

#### 执行步骤

1. 执行 add_task.py，添加任务，并获取任务ID
2. 执行 run.py，或者执行命令：`celery worker -A celery_app_task -l info`
3. 执行 result.py, 检查任务状态并获取结果

### 多任务结构

#### 项目结构

```
pro_cel
├── celery_task        # celery相关文件夹
│   ├── celery.py       # celery连接和配置相关文件，必须叫这个名字
│   ├── tasks1.py      # 所有任务函数
│   └── tasks2.py      # 所有任务函数
├── check_result.py    # 检查结果
└── send_task.py       # 触发任务
```

#### celery.py

```python
from celery import Celery

cel = Celery(
    'celery_demo',
    broker='redis://127.0.0.1:6379/1',
    backend='redis://127.0.0.1:6379/2',
    # 包含以下两个任务文件，去相应的py文件中找任务，对多个任务做分类
    include=['celery_task.tasks1',
             'celery_task.tasks2'
    ])

# 时区
cel.conf.timezone = 'Asia/Shanghai'
# 是否使用UTC
cel.conf.enable_utc = False
```

#### tasks1.py

```python
import time
from celery_task.celery import cel

@cel.task
def test_celery(res):
    time.sleep(5)
    return "test_celery任务结果:%s" % res
```

#### tasks2.py

```python
import time
from celery_task.celery import cel

@cel.task
def test_celery2(res):
    time.sleep(5)
    return "test_celery2任务结果:%s" % res
```

#### check_result.py

```python
from celery.result import AsyncResult
from celery_task.celery import cel

task_result = AsyncResult(id="08eb2778-24e1-44e4-a54b-56990b3519ef", app=cel)

if task_result.successful():
    result = task_result.get()
    print(result)
    # result.forget()  # 将结果删除, 执行完成，结果不会自动删除
    # task_result.revoke(terminate=True)  # 无论现在是什么时候，都要终止
    # task_result.revoke(terminate=False)  # 如果任务还没有开始执行呢，那么就可以终止。
elif task_result.failed():
    print('执行失败')
elif task_result.status == 'PENDING':
    print('任务等待中被执行')
elif task_result.status == 'RETRY':
    print('任务异常后正在重试')
elif task_result.status == 'STARTED':
    print('任务已经开始被执行')
```

#### send_task.py

```python
from celery_task.tasks1 import test_celery
from celery_task.tasks2 import test_celery2

# 立即告知celery去执行test_celery任务，并传入一个参数
result = test_celery.delay('第一个的执行')
print(result.id)
result = test_celery2.delay('第二个的执行')
print(result.id)
```

#### 执行步骤

添加任务（执行send_task.py），开启work：`celery worker -A celery_task -l info -P eventlet`，检查任务执行结果（执行check_result.py）

## Celery执行定时任务

### 设定时间让celery执行一个任务

#### add_task.py

```python
from celery_app_task import add
from datetime import datetime

# 方式一
v1 = datetime(2019, 2, 13, 18, 19, 56)
print(v1)
v2 = datetime.utcfromtimestamp(v1.timestamp())
print(v2)
result = add.apply_async(args=[1, 3], eta=v2)
print(result.id)

# 方式二
ctime = datetime.now()
# 默认用utc时间
utc_ctime = datetime.utcfromtimestamp(ctime.timestamp())
from datetime import timedelta
time_delay = timedelta(seconds=10)
task_time = utc_ctime + time_delay

# 使用apply_async并设定时间
result = add.apply_async(args=[4, 3], eta=task_time)
print(result.id)
```

### 类似于crontab的定时任务

#### 多任务结构中celery.py修改如下

```python
from datetime import timedelta
from celery import Celery
from celery.schedules import crontab

cel = Celery('tasks', broker='redis://127.0.0.1:6379/1', backend='redis://127.0.0.1:6379/2', include=[
        'celery_task.tasks1',
        'celery_task.tasks2',
])
cel.conf.timezone = 'Asia/Shanghai'
cel.conf.enable_utc = False

cel.conf.beat_schedule = {
    # 名字随意命名
    'add-every-10-seconds': {
        # 执行tasks1下的test_celery函数
        'task': 'celery_task.tasks1.test_celery',
        # 每隔2秒执行一次
        # 'schedule': 1.0,
        # 'schedule': crontab(minute="*/1"),
        'schedule': timedelta(seconds=2),
        # 传递参数
        'args': ('test',)
    },
    # 'add-every-12-seconds': {
    #     'task': 'celery_task.tasks1.test_celery',
    #     每年4月11号，8点42分执行
    #     'schedule': crontab(minute=42, hour=8, day_of_month=11, month_of_year=4),
    #     'schedule': crontab(minute=42, hour=8, day_of_month=11, month_of_year=4),
    #     'args': (16, 16)
    # },
}
```

#### 启动命令

- 启动一个beat：`celery beat -A celery_task -l info`
- 启动work执行：`celery worker -A celery_task -l info -P eventlet`

## Django中使用Celery

旧的 `django-celery` / `djcelery` 已经不适合新项目。Celery 3.1 之后就内置支持 Django，现代项目通常直接使用 Celery 实例、`CELERY_` 命名空间配置和 `@shared_task`。

参考：[Celery 官方 Django 集成文档](https://docs.celeryq.dev/en/latest/django/first-steps-with-django.html)

### 安装

```bash
pip install celery redis
```

如果需要在 Django Admin 中管理定时任务，再安装：

```bash
pip install django-celery-beat
```

如果需要 Web 监控界面，再安装：

```bash
pip install flower
```

### 项目结构

```text
proj/
  manage.py
  proj/
    __init__.py
    celery.py
    settings.py
  users/
    tasks.py
    views.py
```

### 创建 `proj/celery.py`

```python
import os

from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "proj.settings")

app = Celery("proj")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()

@app.task(bind=True, ignore_result=True)
def debug_task(self):
    print(f"Request: {self.request!r}")
```

### 在 `proj/__init__.py` 中加载 Celery

```python
from .celery import app as celery_app

__all__ = ("celery_app",)
```

这样 Django 启动时会同时加载 Celery app，后续各个应用中的 `@shared_task` 就能绑定到同一个 Celery 实例。

### 在 `settings.py` 中配置

```python
INSTALLED_APPS += [
    "django_celery_beat",
]

CELERY_BROKER_URL = "redis://127.0.0.1:6379/0"
CELERY_RESULT_BACKEND = "redis://127.0.0.1:6379/1"
CELERY_TIMEZONE = "Asia/Shanghai"
CELERY_TASK_TRACK_STARTED = True
CELERY_TASK_TIME_LIMIT = 30 * 60
CELERY_WORKER_MAX_TASKS_PER_CHILD = 100
CELERY_WORKER_PREFETCH_MULTIPLIER = 1
```

如果使用 `django-celery-beat`，需要执行迁移：

```bash
python manage.py migrate django_celery_beat
```

### 创建任务

```python
from celery import shared_task
from django.contrib.auth import get_user_model
from django.core.mail import send_mail

@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=True, max_retries=3)
def send_welcome_email(self, user_id):
    user = get_user_model().objects.get(pk=user_id)
    send_mail(
        subject="Welcome",
        message=f"Hello, {user.username}",
        from_email="noreply@example.com",
        recipient_list=[user.email],
    )
```

### 在视图中调用任务

如果任务依赖刚写入数据库的数据，建议在事务提交后再投递，避免 worker 先执行却查不到数据。

```python
from django.db import transaction
from django.http import JsonResponse

from users.tasks import send_welcome_email

def register_done(request, user):
    transaction.on_commit(lambda: send_welcome_email.delay(user.id))
    return JsonResponse({"status": "queued"})
```

普通异步调用可以直接使用：

```python
result = send_welcome_email.delay(user_id=1)
print(result.id)
```

### 定时任务

简单固定计划可以直接写在配置中：

```python
from celery.schedules import crontab

CELERY_BEAT_SCHEDULE = {
    "send-report-every-morning": {
        "task": "reports.tasks.send_daily_report",
        "schedule": crontab(hour=8, minute=0),
        "args": (),
    },
}
```

如果运营或后台人员需要动态调整任务频率，优先使用 `django-celery-beat`，通过 Django Admin 管理 `PeriodicTask`。

### 启动命令

```bash
celery -A proj worker -l INFO
celery -A proj beat -l INFO
celery -A proj flower --basic_auth=admin:strong-password
```

生产环境通常用 systemd、Supervisor、Docker Compose 或 Kubernetes 托管 worker 和 beat。不要让多个 beat 实例同时调度同一套周期任务，否则可能重复投递。
