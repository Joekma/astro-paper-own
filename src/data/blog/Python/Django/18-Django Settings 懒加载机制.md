---
title: Django Settings 懒加载机制
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-04-22T00:00:00.000+08:00
slug: django-settings-lazy-loading
featured: false
draft: false
series: django
seriesOrder: 18
tags:
  - Python
  - Django
description: "深入讲解Django settings懒加载机制的实现原理。"
---

## 关于动态导入模块（importlib）

### 动态导入模块方法1：__import__

> 用于动态导入模块，主要应用于反射或延迟加载场景

- `__import__(module)` 等价于 `import module`

**示例：** 创建 `lib/aa.py`，然后在同级模块中动态导入：

```python
# lib/aa.py
class C(object):
    def __str__(self):
        return 'C language'
```

```python
# 动态导入模块
lib = __import__('lib.aa')  # 等价于 import lib
c = lib.aa.C()
print(c)
```

### 动态导入模块方法2：import importlib

```python
import importlib
aa = importlib.import_module('lib.aa')
c = aa.C()
print(c)
```

## 起步

Django 根据不同的 `subcommand` 加载不同的模块。`settings.py` 中的 `INSTALLED_APPS` 用于加载应用模块。

## settings 的懒加载

> 采用懒加载机制，避免循环引用，只在需要时才加载配置

```python
# django.conf.settings
settings = LazySettings()

class LazySettings(LazyObject):
    def _setup(self, name=None):
        # 从环境变量获取配置文件路径
        settings_module = os.environ.get(ENVIRONMENT_VARIABLE)
        self._wrapped = Settings(settings_module)

    def __getattr__(self, name):
        # 首次访问时触发加载
        if self._wrapped is empty:
            self._setup(name)
        return getattr(self._wrapped, name)
```

> Django 使用 `LazyObject` 代理类实现懒加载，`_setup` 为实际加载函数

`LazySettings` 重写了 `__getattr__` 方法，访问 `settings.INSTALLED_APPS` 时，实际从 `Settings(settings_module)` 实例获取属性。

## 配置文件的加载

> 环境变量 `DJANGO_SETTINGS_MODULE` 在 `manage.py` 中定义

```python
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "webui.settings")
```

`Settings` 类加载配置文件：

```python
class Settings(BaseSettings):
    def __init__(self, settings_module):
        # 加载默认配置
        for setting in dir(global_settings):
            if setting.isupper():
                setattr(self, setting, getattr(global_settings, setting))

        self.SETTINGS_MODULE = settings_module

        # 动态导入用户配置文件
        mod = importlib.import_module(self.SETTINGS_MODULE)

        self._explicit_settings = set()
        # 用户配置覆盖默认配置
        for setting in dir(mod):
            if setting.isupper():
                setattr(self, setting, getattr(mod, setting))
                self._explicit_settings.add(setting)
```

> 加载顺序：先 `global_settings` 默认配置 → 再用用户配置覆盖

## 小结

| 特性        | 说明                        |
| ----------- | --------------------------- |
| 加载机制    | 懒加载（首次访问时加载）       |
| 实现方式    | `LazyObject` 代理类          |
| 配置优先级  | 用户配置 > 默认配置           |
| 优点        | 避免循环引用，提高启动效率     |

---