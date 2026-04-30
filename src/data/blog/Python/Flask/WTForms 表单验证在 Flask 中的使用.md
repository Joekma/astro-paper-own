---
title: WTForms 表单验证在 Flask 中的使用
author: 程序员
pubDatetime: 2024-08-13T00:00:00.000+08:00
updated: 2026-04-22T00:00:00.000+08:00
slug: flask-7-wtforms
description: '详细讲解 WTForms 在 Flask 中的使用，包括表单字段类型（StringField、PasswordField、RadioField、SelectField 等）、内置验证器、自定义验证规则以及模板中的表单渲染'
tags:
  - Python
  - Flask
  - WTForms
  - 表单验证
category: Flask
draft: false
language: zh-CN
---

## 简介flask中的wtforms

>WTForms是一个支持多个web框架的form组件，主要用于对用户请求数据进行验证。

**安装：**

```bash
pip3 install wtforms
```

## 简单使用wtforms组件

### 用户登录

```python
from flask import Flask, render_template, request, redirect
from wtforms.fields import core
from wtforms.fields import html5
from wtforms.fields import simple
from wtforms import Form
from wtforms import validators
from wtforms import widgets

app = Flask(__name__, template_folder="templates")

class Myvalidators(object):
    '''自定义验证规则'''
    def __init__(self, message):
        self.message = message

    def __call__(self, form, field):
        print(field.data, "用户输入的信息")
        if field.data == "haiyan":
            return None
        raise validators.ValidationError(self.message)

class LoginForm(Form):
    '''Form'''
    name = simple.StringField(
        label="用户名",
        widget=widgets.TextInput(),
        validators=[
            Myvalidators(message="用户名必须是haiyan"),  # 也可以自定义正则
            validators.DataRequired(message="用户名不能为空"),
            validators.Length(max=8, min=3, message="用户名长度必须大于%(max)d且小于%(min)d")
        ],
        render_kw={"class": "form-control"}  # 设置属性
    )

    pwd = simple.PasswordField(
        label="密码",
        validators=[
            validators.DataRequired(message="密码不能为空"),
            validators.Length(max=8, min=3, message="密码长度必须大于%(max)d且小于%(min)d"),
            validators.Regexp(regex="\d+", message="密码必须是数字"),
        ],
        widget=widgets.PasswordInput(),
        render_kw={"class": "form-control"}
    )

@app.route('/login', methods=["GET", "POST"])
def login():
    if request.method == "GET":
        form = LoginForm()
        return render_template("login.html", form=form)
    else:
        form = LoginForm(formdata=request.form)
        if form.validate():
            print("用户提交的数据用过格式验证，值为：%s" % form.data)
            return "登录成功"
        else:
            print(form.errors, "错误信息")
        return render_template("login.html", form=form)

if __name__ == '__main__':
    app.run(debug=True)
```

login.html：

```html
<body>
    <form action="" method="post" novalidate>
        <p>{{ form.name.label }} {{ form.name }} {{ form.name.errors.0 }}</p>
        <p>{{ form.pwd.label }} {{ form.pwd }} {{ form.pwd.errors.0 }}</p>
        <input type="submit" value="提交">
    </form>
</body>
```

### 用户注册

![image](https://images2017.cnblogs.com/blog/1184802/201801/1184802-20180109234826566-1425045098.png)

```python
from flask import Flask, render_template, redirect, request
from wtforms import Form
from wtforms.fields import core
from wtforms.fields import html5
from wtforms.fields import simple
from wtforms import validators
from wtforms import widgets

app = Flask(__name__, template_folder="templates")
app.debug = True

# =======================simple===========================
class RegisterForm(Form):
    name = simple.StringField(
        label="用户名",
        validators=[
            validators.DataRequired()
        ],
        widget=widgets.TextInput(),
        render_kw={"class": "form-control"},
        default="haiyan"
    )

    pwd = simple.PasswordField(
        label="密码",
        validators=[
            validators.DataRequired(message="密码不能为空")
        ]
    )

    pwd_confim = simple.PasswordField(
        label="重复密码",
        validators=[
            validators.DataRequired(message='重复密码不能为空.'),
            validators.EqualTo('pwd', message="两次密码不一致")
        ],
        widget=widgets.PasswordInput(),
        render_kw={'class': 'form-control'}
    )

    # ========================html5============================
    email = html5.EmailField(  # 注意这里用的是html5.EmailField
        label='邮箱',
        validators=[
            validators.DataRequired(message='邮箱不能为空.'),
            validators.Email(message='邮箱格式错误')
        ],
        widget=widgets.TextInput(input_type='email'),
        render_kw={'class': 'form-control'}
    )

    # =======================以下是用core来调用的=======================
    gender = core.RadioField(
        label="性别",
        choices=(
            (1, "男"),
            (2, "女"),
        ),
        coerce=int  # 限制是int类型的
    )

    city = core.SelectField(
        label="城市",
        choices=(
            ("bj", "北京"),
            ("sh", "上海"),
        )
    )

    hobby = core.SelectMultipleField(
        label='爱好',
        choices=(
            (1, '篮球'),
            (2, '足球'),
        ),
        coerce=int
    )

    favor = core.SelectMultipleField(
        label="喜好",
        choices=(
            (1, '篮球'),
            (2, '足球'),
        ),
        widget=widgets.ListWidget(prefix_label=False),
        option_widget=widgets.CheckboxInput(),
        coerce=int,
        default=[1, 2]
    )
```
