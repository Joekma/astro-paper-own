---
title: Celery技术总结
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
language: zh-CN
---

# Celery技术总结

## Celery架构

Celery的架构由三部分组成：消息中间件（message broker）、任务执行单元（worker）和任务执行结果存储（task result store）组成。

### 消息中间件

Celery本身不提供消息服务，但是可以方便的和第三方提供的消息中间件集成，包括RabbitMQ、Redis等。

### 任务执行单元

Worker是Celery提供的任务执行的单元，worker并发的运行在分布式的系统节点中。

### 任务结果存储

Task result store用来存储Worker执行的任务的结果，Celery支持以不同方式存储任务的结果，包括AMQP、Redis等。

## 版本支持情况

**Celery version 4.0 运行环境：**

- Python 2.7, 3.4, 3.5
- PyPy 5.4, 5.5

这是最后一个支持Python 2.7的版本，从下一个版本（Celery 5.x）开始需要Python 3.5或更新版本。

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

async = AsyncResult(id="e919d97d-2938-4d0f-9265-fd8237dc2aa3", app=cel)

if async.successful():
    result = async.get()
    print(result)
    # result.forget()  # 将结果删除
elif async.failed():
    print('执行失败')
elif async.status == 'PENDING':
    print('任务等待中被执行')
elif async.status == 'RETRY':
    print('任务异常后正在重试')
elif async.status == 'STARTED':
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

async = AsyncResult(id="08eb2778-24e1-44e4-a54b-56990b3519ef", app=cel)

if async.successful():
    result = async.get()
    print(result)
    # result.forget()  # 将结果删除, 执行完成，结果不会自动删除
    # async.revoke(terminate=True)  # 无论现在是什么时候，都要终止
    # async.revoke(terminate=False)  # 如果任务还没有开始执行呢，那么就可以终止。
elif async.failed():
    print('执行失败')
elif async.status == 'PENDING':
    print('任务等待中被执行')
elif async.status == 'RETRY':
    print('任务异常后正在重试')
elif async.status == 'STARTED':
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

### 在项目目录下创建celeryconfig.py

```python
import djcelery
djcelery.setup_loader()
CELERY_IMPORTS=(
    'app01.tasks',
)
# 有些情况可以防止死锁
CELERYD_FORCE_EXECV=True
# 设置并发worker数量
CELERYD_CONCURRENCY=4
# 允许重试
CELERY_ACKS_LATE=True
# 每个worker最多执行100个任务被销毁，可以防止内存泄漏
CELERYD_MAX_TASKS_PER_CHILD=100
# 超时时间
CELERYD_TASK_TIME_LIMIT=12*30
```

### 在app01目录下创建tasks.py

```python
from celery import task

@task
def add(a,b):
    with open('a.text', 'a', encoding='utf-8') as f:
        f.write('a')
    print(a+b)
```

### 视图函数views.py

```python
from django.shortcuts import render, HttpResponse
from app01.tasks import add
from datetime import datetime

def test(request):
    # result=add.delay(2,3)
    ctime = datetime.now()
    # 默认用utc时间
    utc_ctime = datetime.utcfromtimestamp(ctime.timestamp())
    from datetime import timedelta
    time_delay = timedelta(seconds=5)
    task_time = utc_ctime + time_delay
    result = add.apply_async(args=[4, 3], eta=task_time)
    print(result.id)
    return HttpResponse('ok')
```

### settings.py

```python
INSTALLED_APPS = [
    ...
    'djcelery',
    'app01'
]

...

from djcelery import celeryconfig
BROKER_BACKEND='redis'
BROKER_URL='redis://127.0.0.1:6379/1'
CELERY_RESULT_BACKEND='redis://127.0.0.1:6379/2'
```