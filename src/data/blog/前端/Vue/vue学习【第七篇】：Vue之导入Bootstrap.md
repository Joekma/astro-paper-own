---
title: Vue导入Bootstrap
author: 程序员
pubDatetime: 2024-08-13T00:00:00.000+08:00
updated: 2026-04-22T00:00:00.000+08:00
slug: vue-bootstrap-integration
description: 'Vue项目中使用Bootstrap框架，包括安装配置和组件示例'
tags:
  - Vue
  - Bootstrap
  - 前端
  - CSS
category: 前端
draft: false
language: zh-CN
---

> Bootstrap 是最流行的前端 UI 框架。

## 安装

```bash
npm install bootstrap
```

## 引入

```javascript
// main.js
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
```

## 使用示例

```vue
<template>
    <div class="container">
        <button class="btn btn-primary">按钮</button>
        
        <div class="alert alert-success">
            成功提示
        </div>
        
        <table class="table">
            <thead>
                <tr><th>名称</th><th>年龄</th></tr>
            </thead>
            <tbody>
                <tr><td>张三</td><td>25</td></tr>
            </tbody>
        </table>
    </div>
</template>
```

## 小结

- **npm install bootstrap**
- **import** CSS 和 JS
- 使用 Bootstrap 组件
