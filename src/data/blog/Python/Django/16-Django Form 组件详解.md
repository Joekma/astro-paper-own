---
title: Django Form 组件详解
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-07-11T00:00:00.000+08:00
slug: django-component-2-form
featured: false
draft: false
series: django
seriesOrder: 16
tags:
  - Python
  - Django
  - Form
description: "深入讲解Django Form组件的数据校验和模板渲染功能。"
---

## Django 6 表单验证实践

表单把不可信请求数据转换为经过验证的 Python 值。只有 `is_valid()` 返回真后才能读取 `cleaned_data`；字段错误和跨字段错误分别放在对应字段与 `__all__` 下。

<!-- snippet: id=django-form-safe-registration mode=project python=3.12-3.14 deps=Django==6.0.7 file=accounts/forms.py -->
```python
from django import forms
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password

class RegistrationForm(forms.Form):
    username = forms.CharField(max_length=150)
    password1 = forms.CharField(widget=forms.PasswordInput)
    password2 = forms.CharField(widget=forms.PasswordInput)

    def clean_password1(self):
        password = self.cleaned_data["password1"]
        validate_password(password)
        return password

    def clean(self):
        cleaned = super().clean()
        if cleaned.get("password1") != cleaned.get("password2"):
            self.add_error("password2", "两次密码不一致")
        return cleaned

    def save(self):
        return get_user_model().objects.create_user(
            username=self.cleaned_data["username"],
            password=self.cleaned_data["password1"],
        )
```

模板中的 POST 表单必须包含 `{% csrf_token %}`。视图用 `form = RegistrationForm(request.POST or None)` 绑定数据，成功后调用 `save()` 并重定向，避免刷新重复提交。不要把 `cleaned_data` 中的密码直接赋给模型字段；`create_user()`/`set_password()` 才会生成密码哈希。

测试应覆盖弱密码、两次密码不一致、重复用户名、CSRF 缺失以及成功后数据库中密码不可读且 `check_password()` 为真。
