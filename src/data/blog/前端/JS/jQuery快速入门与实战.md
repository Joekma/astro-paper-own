---
title: jQuery快速入门与实战
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-04-22T00:00:00.000+08:00
slug: jquery-quick-start-tutorial
featured: false
draft: false
tags:
  - jQuery
  - JavaScript
  - 前端开发
  - 选择器
  - DOM操作
  - AJAX
  - Web开发
description: 'jQuery快速入门，通过简洁的示例讲解选择器、DOM操作、事件处理和AJAX等核心功能，适合初学者快速上手jQuery'
---

> jQuery 简化了 DOM 操作和事件处理。

## 选择器

```javascript
$('#id')           // ID
$('.class')        // 类
$('div')           // 标签
$('div p')         // 后代
$('div > p')       // 子元素
$('div + p')       // 相邻兄弟
$('p:first')       // 第一个
$('p:odd')         // 奇数
```

## DOM 操作

```javascript
$('#id').text()          // 获取文本
$('#id').text('新文本')   // 设置文本
$('#id').html()          // 获取 HTML
$('#id').html('<b>新</b>')  // 设置 HTML
$('#id').val()            // 表单值
$('#id').val('新值')      // 设置值
```

## 事件

```javascript
$('#btn').click(fn)
$('#btn').on('click', fn)
$('#btn').hover(fn1, fn2)
```

## AJAX

```javascript
$.ajax({
    url: '/api',
    success: (data) => {}
})

$.get('/api', fn)
$.post('/api', data, fn)
```

## 小结

- **选择器**：类、ID、标签、过滤
- **DOM**：text、html、val
- **事件**：click、on、hover
- **AJAX**：ajax、get、post
