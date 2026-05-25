---
title: Django ContentType 组件详解
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-04-22T00:00:00.000+08:00
slug: django-component-5-contenttype
featured: false
draft: false
series: django
seriesOrder: 15
tags:
  - Python
  - Django
  - ContentType
description: "深入讲解Django ContentType组件的快速连表操作功能和实践技巧。"
---

## 基础使用

ContentType组件是Django提供的一个快速连表操作的组件，可以追踪项目中所有的APP和model的对应关系，并记录在ContentType表中。

当我们的项目做数据迁移后，会有很多django自带的表，其中就有`django_content_type`表。

### ContentType组件应用

在model中定义ForeignKey字段，并关联到ContentType表，通常这个字段命名为`content_type`。

在model中定义PositiveIntergerField字段，用来存储关联表中的主键，通常我们用`object_id`。

在model中定义GenericForeignKey字段，传入上面两个字段的名字。

方便反向查询可以定义GenericRelation字段。

**使用，在models.py中：**

```python
class Course(models.Model):
    name = models.CharField(max_length=32)
    # 不会再数据库生成数据，只是用来连表操作
    price_police = GenericRelation(to='PricePolicy')

class PricePolicy(models.Model):
    period = models.IntegerField()
    price = models.CharField(max_length=32)
    # 注意不能用外键关联
    # course_id = models.IntegerField(null=True)
    object_id = models.IntegerField(null=True)
    content_type = models.ForeignKey(to=ContentType, null=True)
    # 该字段不会在数据库生成字段，只是用来做连表操作
    obj = GenericForeignKey()
```

**在view.py中使用：**

1. 为django入门课，添加三个价格策略

```python
ret = models.PricePolicy.objects.create(period=60, price='99.9', obj=course)
```

2. 查询所有价格策略，并且显示对应的课程名称

```python
ret = models.PricePolicy.objects.all()
for i in ret:
    print(i.price)
    print(i.obj.name)  # 课程名称
```

3. 通过课程id，获取课程信息和价格策略

```python
course = models.Course.objects.get(pk=1)
price_polices = course.price_police.all()
for i in price_polices:
    print(i.price)
    print(i.period)
```

## ContentType

在Django中，有一个记录了项目中所有model元数据的表，就是ContentType，表中一条记录对应着一个存在的model，所以可以通过一个ContentType表的id和一个具体表中的id找到任何记录。

即先通过ContentType表的id可以得到某个model，再通过model的id得到具体的对象：

```python
class ContentType(models.Model):
    app_label = models.CharField(max_length=100)
    model = models.CharField(_('python model class name'), max_length=100)
    objects = ContentTypeManager()

    class Meta:
        verbose_name = _('content type')
        verbose_name_plural = _('content types')
        db_table = 'django_content_type'
        unique_together = (('app_label', 'model'),)

    def __str__(self):
        return self.name
```

这个类主要作用是记录每个app中的model。例如，我们在自己的app中创建了如下几个model：post，event。迁移之后，我们来查看一下ContentType这个数据表中生成的数据。

如上图，生成了app与model的对应关系。

**使用示例：**

```python
def demo(request):
    obj = models.ContentType.objects.get(id=10)
    print(obj.model_class())  # <class 'app01.models.Post'>
    return HttpResponse('............')
```

看到，通过`model_class`就可以获取对应的类。也就是说，今后，我们如果自己定义model如果有外键关联到这个ContentType上，我们就能找到对应的model名称。

## Django-ContentType-signals

Django的signal结合contenttypes可以实现好友最新动态、新鲜事、消息通知等功能。总体来说这个功能就是在用户发生某个动作的时候将其记录下来或者附加某些操作，比如通知好友。

要实现这种功能可以在动作发生的代码里实现也可以通过数据库触发器等实现，但在Django中，一个很简单的方法就是使用signals。

当Django保存一个object的时候会发出一系列的signals，可以通过对这些signals注册listener，从而在相应的signals发出时执行一定的代码。

**使用signals来监听用户的动作的好处：**

1. 不管这个动作是发生在什么页面，甚至在很多页面都可以发生这个动作，都只需要写一次代码来监听保存object这个动作就可以了
2. 可以完全不修改原来的代码就可以添加监听signals的功能
3. 你几乎可以在signals监听代码里写任何代码，包括做一些判断是不是第一次发生此动作还是一个修改行为等等

**实现思路：**

1. 首先用信号机制，监听信号，实现对信号的响应函数，在响应函数中记录发生的动作（记录在一张记录表，相当于下文的Event）
2. 其次就是为了能追踪到操作的具体动作，必须从这张表中得到相应操作的model，这就得用到上面说的ContentType

**使用GenericRelation：**

对于新鲜事这个功能来说就是使用GenericRelation来产生一个特殊的外键，它不像`models.ForeignKey`那样，必须指定一个Model来作为它指向的对象。GenericRelation可以指向任何Model对象，有点像C语言中`void*`指针。

这样关于保存用户所产生的这个动作，比如用户写了一片日志，我们就可以使用Generic relations来指向某个Model实例比如Post，而那个Post实例才真正保存着关于用户动作的完整信息，即Post实例本身就是保存动作信息最好的地方。

**使用fields.GenericForeignKey：**

怎么从这张操作记录表中得到相应操作的model呢，这就得用到`fields.GenericForeignKey`，它是一个特殊的外键，可以指向任何Model的实例，在这里就可以通过这个字段来指向类似Post这样保存着用户动作信息的Model实例。

**Model示例：**

```python
from django.db import models
from django.contrib.auth.models import User
from django.contrib.contenttypes import fields
from django.db.models import signals

class Post(models.Model):
    author = models.ForeignKey(User)
    title = models.CharField(max_length=255)
    content = models.TextField()
    created = models.DateTimeField(u'发表时间', auto_now_add=True)
    updated = models.DateTimeField(u'最后修改时间', auto_now=True)

    events = fields.GenericRelation('Event')

    def __str__(self):
        return self.title

    def description(self):
        return u'%s 发表了日志《%s》' % (self.author, self.title)

class Event(models.Model):
    user = models.ForeignKey(User)
    content_type = models.ForeignKey(ContentType)
    object_id = models.PositiveIntegerField()

    content_object = fields.GenericForeignKey('content_type', 'object_id')

    created = models.DateTimeField(u'事件发生时间', auto_now_add=True)

    def __str__(self):
        return "%s的事件: %s" % (self.user, self.description())

    def description(self):
        return self.content_object.description()

def post_post_save(sender, instance, signal, *args, **kwargs):
    """
    :param sender: 监测的类：Post类
    :param instance: 监测的类：Post类
    :param signal: 信号类
    :param args:
    :param kwargs:
    :return:
    """
    post = instance
    event = Event(user=post.author, content_object=post)
    event.save()

signals.post_save.connect(post_post_save, sender=Post)
# signals.post_save.connect(post_post_save, sender=Book)可以监听多个类
```

只要model中有object的保存操作，都将执行`post_post_save`函数，故可以在这个接受函数中实现通知好友等功能。

前面说到Django在保存一个object的时候会发出一系列signals，在这里我们所监听的是`signals.post_save`这个signal，这个signal是在Django保存完一个对象后发出的。

利用`connect`这个函数来注册监听器：

```text
def connect(self, receiver, sender=None, weak=True, dispatch_uid=None):
```

第一个参数是要执行的函数，第二个参数是指定发送信号的Class，这里指定为Post这个Model，对其他Model所发出的signal并不会执行注册的函数。

`instance`这个参数，即刚刚保存完的Model对象实例。创建事件的时候看到可以将post这个instance直接赋给`generic.GenericForeignKey`类型的字段，从而event实例就可以通过它来获取事件的真正信息了。

**最后有一点需要的注意的是：**

Post的Model定义里现在多了一个字段：

```python
content_object = GenericRelation('Event')
```

通过这个字段可以得到与某篇post相关联的所有事件，最重要的一点是如果没有这个字段，那么当删除一篇post的时候，与该post关联的事件是不会自动删除的。反之有这个字段就会进行自动的级联删除。

## ContentType其他案例总结

### 案例一：调查问卷表设计

例如：设计如下类型的调查问卷表：问卷类型包括（打分、建议、选项）。

先来看看一个简单的问答："您最喜欢吃什么水果？A.苹果 B.香蕉 C.梨子 D.橘子"

对于上面一个类型的问答，我们可以知道，一个问卷系统主要包括：问卷、问卷中每个题目、每个题目的答案，以及生成问卷记录。

**常规设计表如下：**

```python
from django.db import models
from django.contrib.contenttypes.fields import GenericForeignKey, GenericRelation
from django.contrib.contenttypes.models import ContentType

class Survey(models.Model):
    """
    问卷
    ID        name            by_class      creator
    1    第一次班级调查      三年级五班     李老师
    """
    name = models.CharField(max_length=100)
    by_class = models.CharField(max_length=100)
    creator = models.CharField(max_length=50)

class Question(models.Model):
    """
    问题
    """
    survey = models.ForeignKey(Survey)
    text = models.TextField()
    question_type = models.CharField(max_length=20)  # score/advice/choice

class Choice(models.Model):
    """
    选项
    """
    question = models.ForeignKey(Question)
    text = models.CharField(max_length=200)

class Answer(models.Model):
    """
    答案 - 使用ContentType实现通用答案表
    """
    user = models.ForeignKey(User)
    content_type = models.ForeignKey(ContentType)
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey('content_type', 'object_id')
    created = models.DateTimeField(auto_now_add=True)
```