---
title: 表单验证
author: 程序员
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-04-22T00:00:00.000+08:00
slug: form-validation
featured: false
draft: false
tags:
  - JavaScript
  - 前端
  - 表单验证
  - Web
description: '前端表单验证的实现思路，包括原生JS、jQuery和HTML5验证'
---

> 表单验证是前端开发的重要部分。

## HTML5 验证

```html
<input type="text" required minlength="2" maxlength="10">
<input type="email" required>
<input type="number" min="1" max="100">
<input type="tel" pattern="^1[3-9]\d{9}$">
```

## 原生 JS 验证

```javascript
const form = document.getElementById('form')

form.addEventListener('submit', (e) => {
    e.preventDefault()
    
    const username = document.getElementById('username')
    
    if (username.value.length < 2) {
        alert('用户名至少2位')
        return
    }
    
    form.submit()
})
```

## jQuery 验证

```javascript
$('#form').on('submit', (e) => {
    e.preventDefault()
    
    if (!$('#username').val()) {
        alert('请输入用户名')
        return
    }
    
    $('#form').submit()
})
```

## 小结

- **HTML5**：required、pattern、min/max
- **JS**：preventDefault + 逻辑判断
- **用户体验**：及时反馈、错误提示
