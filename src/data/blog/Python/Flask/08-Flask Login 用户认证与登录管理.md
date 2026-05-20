---
title: Flask Login 用户认证与登录管理
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-04-22T00:00:00.000+08:00
slug: flask-4-login-extension
description: '深入讲解使用Flask-Login扩展实现用户认证功能，包括用户模型创建、LoginManager配置、登录登出视图编写、路由保护装饰器以及注册功能的完整实现。'
tags:
  - Python
  - Flask
  - Flask-Login
  - 用户认证
series: flask
seriesOrder: 8
draft: false
language: zh-CN
---

## Flask-Login简介

Flask-Login是Flask官方提供的一个扩展，专门用于处理用户会话管理和身份认证。它提供了简单而强大的功能，可以轻松实现用户登录、登出、记住我等功能。

### Flask-Login的主要功能

- 用户登录和登出管理
- 保护路由，限制未登录用户访问
- 记住用户登录状态
- 安全的Session管理
- 与数据库模型集成

## 安装Flask-Login

首先需要安装Flask-Login扩展：

```bash
pip install flask-login
```

## 基本配置

### 1. 创建用户模型

Flask-Login要求用户模型实现以下四个属性和方法：

```python
from flask_login import UserMixin
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
```

### 2. 初始化LoginManager

```python
from flask import Flask
from flask_login import LoginManager

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-here'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///users.db'

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'  # 设置登录页面路由

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))
```

### 3. 创建登录视图

```python
from flask import render_template, request, redirect, url_for, flash
from flask_login import login_user, logout_user, login_required

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        remember = request.form.get('remember', False)

        user = User.query.filter_by(username=username).first()

        if user and user.check_password(password):
            login_user(user, remember=remember)
            flash('登录成功！', 'success')
            return redirect(url_for('index'))
        else:
            flash('用户名或密码错误', 'error')

    return render_template('login.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    flash('已退出登录', 'info')
    return redirect(url_for('login'))
```

### 4. 保护需要登录的路由

使用`@login_required`装饰器保护需要登录才能访问的页面：

```python
@app.route('/profile')
@login_required
def profile():
    return render_template('profile.html')

@app.route('/dashboard')
@login_required
def dashboard():
    return render_template('dashboard.html')
```

## 创建登录表单

使用Flask-WTF创建表单：

```python
from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, BooleanField, SubmitField
from wtforms.validators import DataRequired, Email, Length

class LoginForm(FlaskForm):
    username = StringField('用户名', validators=[DataRequired(), Length(min=3, max=20)])
    password = PasswordField('密码', validators=[DataRequired()])
    remember = BooleanField('记住我')
    submit = SubmitField('登录')
```

## 登录模板

```html
<!-- templates/login.html -->
<!DOCTYPE html>
<html>
<head>
    <title>用户登录</title>
</head>
<body>
    <h2>登录</h2>

    {% with messages = get_flashed_messages(with_categories=true) %}
        {% if messages %}
            {% for category, message in messages %}
                <div class="alert alert-{{ category }}">{{ message }}</div>
            {% endfor %}
        {% endif %}
    {% endwith %}

    <form method="POST">
        <label>用户名:</label>
        <input type="text" name="username" required>

        <label>密码:</label>
        <input type="password" name="password" required>

        <label>
            <input type="checkbox" name="remember"> 记住我
        </label>

        <button type="submit">登录</button>
    </form>
</body>
</html>
```

## 注册功能

完整的用户系统还需要注册功能：

```python
class RegisterForm(FlaskForm):
    username = StringField('用户名', validators=[DataRequired(), Length(min=3, max=20)])
    email = StringField('邮箱', validators=[DataRequired(), Email()])
    password = PasswordField('密码', validators=[DataRequired(), Length(min=6)])
    confirm_password = PasswordField('确认密码', validators=[DataRequired()])
    submit = SubmitField('注册')

@app.route('/register', methods=['GET', 'POST'])
def register():
    form = RegisterForm()

    if form.validate_on_submit():
        if form.password.data != form.confirm_password.data:
            flash('两次密码不一致', 'error')
            return render_template('register.html', form=form)

        # 创建新用户
        user = User(username=form.username.data, email=form.email.data)
        user.set_password(form.password.data)
        db.session.add(user)
        db.session.commit()

        flash('注册成功！请登录', 'success')
        return redirect(url_for('login'))

    return render_template('register.html', form=form)
```
