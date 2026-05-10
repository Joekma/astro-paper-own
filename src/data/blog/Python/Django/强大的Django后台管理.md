---
title: 强大的Django后台管理
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-04-22T00:00:00.000+08:00
slug: django-admin-powerful
featured: false
draft: false
series: django
tags:
  - Python
  - Django
description: "强大的 Django 后台管理"
---

## Django后台

Django的后台我们只要加少些代码，就可以实现强大的功能。与后台相关文件：每个app中的`admin.py`文件与后台相关。

下面示例是做一个后台添加博客文章的例子。

## 新建项目

### 新建一个名称为zqxt_admin的项目

```bash
django-admin.py startproject zqxt_admin
```

### 新建一个叫做blog的app

```bash
# 进入 zqxt_admin 文件夹
cd zqxt_admin

# 创建 blog 这个 app
python manage.py startapp blog
```

**注意：** 不同版本的Django创建project和app出来的文件会有一些不同。

### 修改blog文件夹中的models.py

```python
# coding:utf-8
from django.db import models

class Article(models.Model):
    title = models.CharField(u'标题', max_length=256)
    content = models.TextField(u'内容')

    pub_date = models.DateTimeField(u'发表时间', auto_now_add=True, editable=True)
    update_time = models.DateTimeField(u'更新时间', auto_now=True, null=True)
```

### 把blog加入到settings.py中的INSTALLED_APPS中

```python
INSTALLED_APPS = (
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    'blog',
)
```

**提示：** INSTALLED_APPS是一个元组，每次加入新的app的时候，**在后面都加一个逗号，这是一个好习惯**。

### 同步所有的数据表

```bash
# 进入包含有 manage.py 的文件夹
python manage.py makemigrations
python manage.py migrate
```

**注意：** Django 1.6.x及以下的版本需要用以下命令：

```bash
python manage.py syncdb
```

可以看到：

```
Creating tables ...

Creating table django_admin_log
Creating table auth_permission
Creating table auth_group_permissions
Creating table auth_group
Creating table auth_user_groups
Creating table auth_user_user_permissions
Creating table auth_user
Creating table django_content_type
Creating table django_session
Creating table blog_article

You just installed Django's auth system, which means you don't have any superusers defined.

Would you like to create one now? (yes/no): yes

Username (leave blank to use 'tu'): tu

Email address:

Password:

Password (again):

Superuser created successfully.

Installing custom SQL ...

Installing indexes ...

Installed 0 object(s) from 0 fixture(s)
```

**如果是Django不主动提示创建管理员（Django 1.9不提示）用下面的命令创建一个帐号：**

```bash
python manage.py createsuperuser
```

### 修改admin.py文件

进入blog文件夹，修改admin.py文件（如果没有新建一个），内容如下：

```python
from django.contrib import admin
from .models import Article

admin.site.register(Article)
```

**提示：** urls.py中关于admin的已经默认开启，如果没有，参考[Django官方文档](https://docs.djangoproject.com/en/dev/ref/contrib/admin/#overview)。

只需要这三行代码，我们就可以拥有一个强大的后台！

### 打开开发服务器

```bash
python manage.py runserver
# 如果提示 8000 端口已经被占用，可以用 python manage.py runserver 8001 以此类推
```

根据已经存在的路由进入登陆页面，并输入用户名和密码就可以使用后台进行管理了。

点击Articles，动手输入添加几篇文章，就可以看到。

## 使用__str__方法

我们会发现所有的文章都是叫`Article object`，这样肯定不好，比如我们要修改，如何知道要修改哪个呢？

我们修改一下blog中的models.py：

```python
# coding:utf-8
from django.db import models

class Article(models.Model):
    title = models.CharField(u'标题', max_length=256)
    content = models.TextField(u'内容')

    pub_date = models.DateTimeField(u'发表时间', auto_now_add=True, editable=True)
    update_time = models.DateTimeField(u'更新时间', auto_now=True, null=True)

    def __str__(self):  # 在Python3中用 __str__ 代替 __unicode__
        return self.title
```

加了一个`__str__`函数，刷新后台网页，会看到文章标题显示正常了。

**推荐定义Model的时候写一个`__str__`函数（或`__unicode__`函数）**

## 兼容Python2.x和Python3.x

示例如下：

```python
# coding:utf-8
from __future__ import unicode_literals

from django.db import models
from django.utils.encoding import python_2_unicode_compatible

@python_2_unicode_compatible
class Article(models.Model):
    title = models.CharField('标题', max_length=256)
    content = models.TextField('内容')

    pub_date = models.DateTimeField('发表时间', auto_now_add=True, editable=True)
    update_time = models.DateTimeField('更新时间', auto_now=True, null=True)

    def __str__(self):
        return self.title
```

## Admin高级配置

### 列表页显示更多字段

```python
from django.contrib import admin
from .models import Article

class ArticleAdmin(admin.ModelAdmin):
    list_display = ('title', 'pub_date', 'update_time')

admin.site.register(Article, ArticleAdmin)
```

### 搜索功能

```python
class ArticleAdmin(admin.ModelAdmin):
    list_display = ('title', 'pub_date', 'update_time')
    search_fields = ('title', 'content')  # 添加搜索功能
```

### 过滤功能

```python
class ArticleAdmin(admin.ModelAdmin):
    list_display = ('title', 'pub_date', 'update_time')
    list_filter = ('pub_date',)  # 添加过滤功能
```

### 分页功能

```python
class ArticleAdmin(admin.ModelAdmin):
    list_per_page = 25  # 每页显示25条记录
```

### 编辑功能

```python
class ArticleAdmin(admin.ModelAdmin):
    # 列表页直接编辑的字段
    list_editable = ('title',)
    # 详细页编辑的字段
    fields = ('title', 'content', 'pub_date')
    # 排除某些字段
    exclude = ('update_time',)
```

### 时间选择器

```python
class ArticleAdmin(admin.ModelAdmin):
    date_hierarchy = 'pub_date'  # 按日期分层导航
```

## 完整Admin配置示例

```python
from django.contrib import admin
from .models import Article, Category, Tag

class ArticleAdmin(admin.ModelAdmin):
    # 列表页显示的字段
    list_display = ('title', 'author', 'pub_date', 'update_time')

    # 可搜索的字段
    search_fields = ('title', 'content')

    # 可过滤的字段
    list_filter = ('is_published', 'category', 'tags', 'pub_date')

    # 时间分层导航
    date_hierarchy = 'pub_date'

    # 分页
    list_per_page = 20

    # 列表页直接编辑
    list_editable = ('is_published',)

    # 详情页字段分组
    fieldsets = (
        ('基本信息', {
            'fields': ('title', 'author', 'category', 'tags')
        }),
        ('内容', {
            'fields': ('content',),
            'classes': ('wide',)
        }),
        ('其他', {
            'fields': ('is_published', 'pub_date')
        }),
    )

    # 自动保存用户
    def save_model(self, request, obj, form, change):
        if not change:
            obj.author = request.user
        obj.save()

    # 自动记录操作日志
    def log_change(self, request, object, message):
        pass

# 注册
admin.site.register(Article, ArticleAdmin)
admin.site.register(Category)
admin.site.register(Tag)
```

## 自定义Admin

### 添加自定义操作

```python
class ArticleAdmin(admin.ModelAdmin):
    actions = ['make_published', 'make_draft']

    def make_published(self, request, queryset):
        queryset.update(is_published=True)
    make_published.short_description = '标记为已发布'

    def make_draft(self, request, queryset):
        queryset.update(is_published=False)
    make_draft.short_description = '标记为草稿'
```

### 内联管理

```python
class ArticleInline(admin.TabularInline):
    model = Tag
    extra = 1

class ArticleAdmin(admin.ModelAdmin):
    inlines = [ArticleInline]
```

### 自定义表单验证

```python
from django import forms

class ArticleForm(forms.ModelForm):
    class Meta:
        model = Article
        fields = '__all__'

    def clean_title(self):
        title = self.cleaned_data['title']
        if 'bad' in title.lower():
            raise forms.ValidationError('标题不能包含bad')
        return title

class ArticleAdmin(admin.ModelAdmin):
    form = ArticleForm
```

## 最佳实践

1. 始终为Model定义`__str__`方法
2. 使用装饰器`@python_2_unicode_compatible`保持兼容性
3. 为Admin配置合理的list_display
4. 使用list_filter进行数据筛选
5. 使用search_fields进行全文搜索
6. 合理设置list_per_page
7. 使用fieldsets组织表单字段
8. 编写自定义actions处理批量操作
9. 使用save_model自动设置相关字段
10. 定期检查admin的访问权限