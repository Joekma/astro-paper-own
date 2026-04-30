---
title: HTML语法分析
author: 程序员
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-04-22T00:00:00.000+08:00
slug: html-syntax-basics
featured: false
draft: false
tags:
  - HTML
  - 前端
  - Web
description: 'HTML基础语法，包括标签、属性、文档结构等核心概念'
---

> HTML（超文本标记语言）是构建网页的基础。

## HTML 简介

**HTML** 是一门标记语言，用于描述网页的结构和内容。

| 术语 | 说明 |
|------|------|
| **超文本** | 页面内可包含图片、链接、音乐等非文字元素 |
| **标记语言** | 由标签构成的计算机语言 |

> **注意**：HTML 负责内容结构，CSS 负责样式，JavaScript 负责交互。

## HTML 文档结构

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>页面标题</title>
</head>
<body>
    <!-- 页面内容 -->
    <h1>Hello World</h1>
    <p>这是段落</p>
</body>
</html>
```

### DOCTYPE 声明

```html
<!DOCTYPE html>
```

- 告诉浏览器这是 HTML5 文档
- 必须写在第一行
- 启用标准渲染模式

## 标签基础

### 标签语法

| 规则 | 说明 |
|------|------|
| **大小写不敏感** | 推荐使用小写 |
| **成对标签** | `<html></html>` |
| **自闭合标签** | `<br/>`, `<img/>`, `<input/>` |
| **标签嵌套** | 可以嵌套但不能交叉 |

### 常用标签

#### 文本标签

```html
<h1>一级标题</h1>
<h2>二级标题</h2>
<p>段落文本</p>
<span>行内文本</span>
<a href="https://example.com">链接</a>
```

#### 列表标签

```html
<!-- 无序列表 -->
<ul>
    <li>项目1</li>
    <li>项目2</li>
</ul>

<!-- 有序列表 -->
<ol>
    <li>第一项</li>
    <li>第二项</li>
</ol>
```

#### 表格标签

```html
<table border="1">
    <thead>
        <tr>
            <th>表头1</th>
            <th>表头2</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>单元格1</td>
            <td>单元格2</td>
        </tr>
    </tbody>
</table>
```

#### 表单标签

```html
<form action="/submit" method="POST">
    <label for="username">用户名：</label>
    <input type="text" id="username" name="username">

    <label for="password">密码：</label>
    <input type="password" id="password" name="password">

    <button type="submit">提交</button>
</form>
```

#### 容器标签

```html
<!-- 块级容器 -->
<div>块级元素，占据整行</div>

<!-- 行内容器 -->
<span>行内元素，与其他元素共享一行</span>
```

### 多媒体标签

```html
<!-- 图片 -->
<img src="image.jpg" alt="描述文字" width="200" height="150">

<!-- 视频 -->
<video src="video.mp4" controls width="400"></video>

<!-- 音频 -->
<audio src="audio.mp3" controls></audio>

<!-- 超链接 -->
<a href="https://example.com" target="_blank">新窗口打开</a>
```

## 标签属性

### 基本语法

```html
<tag attribute="value">内容</tag>

<div id="main" class="container" data-info="custom">内容</div>
```

### 常用属性

| 属性 | 说明 |
|------|------|
| **id** | 元素的唯一标识 |
| **class** | 元素的类名（可多个） |
| **style** | 内联样式 |
| **title** | 鼠标悬停提示 |
| **data-*** | 自定义数据属性 |

### 事件属性

```html
<button onclick="alert('点击')">点击</button>
<input onfocus="console.log('获得焦点')">
```

## 常用 input 类型

```html
<input type="text">           <!-- 文本输入 -->
<input type="password">      <!-- 密码输入 -->
<input type="email">         <!-- 邮箱输入 -->
<input type="number">        <!-- 数字输入 -->
<input type="date">         <!-- 日期选择 -->
<input type="checkbox">      <!-- 复选框 -->
<input type="radio">         <!-- 单选按钮 -->
<input type="file">          <!-- 文件上传 -->
<input type="submit">        <!-- 提交按钮 -->
<input type="reset">          <!-- 重置按钮 -->
```

## 注释

```html
<!-- 这是单行注释 -->

<!--
  这是
  多行注释
-->
```

> **快捷键**：Windows: `Ctrl + /`，Mac: `Cmd + /`

## SEO 基础

### 语义化标签

```html
<header>网站头部</header>
<nav>导航栏</nav>
<main>主要内容</main>
<article>文章内容</article>
<section>章节区块</section>
<aside>侧边栏</aside>
<footer>网站底部</footer>
```

### Meta 标签

```html
<meta charset="UTF-8">
<meta name="description" content="页面描述">
<meta name="keywords" content="关键词1, 关键词2">
<meta name="author" content="作者名">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```

## 小结

- **HTML** 是网页的结构基础
- **DOCTYPE** 声明启用标准模式
- **标签** 分成对标签和自闭合标签
- **属性** 提供额外信息
- **语义化** 标签有助于 SEO
