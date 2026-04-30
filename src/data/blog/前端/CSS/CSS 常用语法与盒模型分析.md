---
title: CSS常用语法与盒模型分析
author: 程序员
pubDatetime: 2018-12-05T00:00:00.000+08:00
updated: 2026-04-22T00:00:00.000+08:00
slug: css-basics-and-box-model
description: 'CSS常用语法与盒模型分析，包括选择器、盒模型、布局等核心概念'
tags:
  - CSS
  - 前端
  - Web
category: 前端
draft: false
language: zh-CN
---

> CSS（层叠样式表）用于控制网页的外观和布局。

## CSS 基本语法

### CSS 规则

```css
selector {
    property: value;
    property: value;
}

h1 {
    color: red;
    font-size: 14px;
}
```

| 组成部分 | 说明 |
|---------|------|
| **选择器** | 指定要样式化的 HTML 元素 |
| **属性** | 要更改的样式属性 |
| **值** | 属性的具体值 |

## 四种引入方式

### 1. 内联样式（不推荐）

直接在 HTML 标签的 `style` 属性中设置：

```html
<p style="color: red; background-color: blue;">内联样式</p>
```

### 2. 内部样式

在 `<head>` 标签的 `<style>` 中定义：

```html
<head>
    <style>
        p {
            background-color: #2b99ff;
        }
    </style>
</head>
```

### 3. 外部样式（推荐）

将 CSS 代码写入独立文件：

```html
<head>
    <link rel="stylesheet" href="style.css">
</head>
```

### 4. @import 导入

```html
<style>
    @import "style.css";
</style>
```

### 优先级

> 优先级：`内联样式 > 内部/外部样式`（后定义覆盖先定义）

## 选择器

### 基本选择器

| 选择器 | 语法 | 示例 |
|--------|------|------|
| **标签选择器** | `tag {}` | `p {}` |
| **类选择器** | `.class {}` | `.highlight {}` |
| **ID选择器** | `#id {}` | `#header {}` |
| **通配符** | `* {}` | 选中所有元素 |

### 组合选择器

```css
/* 后代选择器 */
div p { }

/* 子元素选择器 */
div > p { }

/* 相邻兄弟选择器 */
h1 + p { }

/* 伪类选择器 */
a:hover { }

/* 多个选择器 */
h1, h2, h3 { }
```

### 属性选择器

```css
/* 包含属性 */
[disabled] { }

/* 属性等于值 */
[type="text"] { }

/* 属性包含值 */
[class*="icon"] { }

/* 属性以值开头 */
[href^="https"] { }

/* 属性以值结尾 */
[href$=".pdf"] { }
```

## 盒模型

### 盒模型组成

```
┌─────────────────────────────────┐
│           margin                │
│  ┌───────────────────────────┐  │
│  │         border             │  │
│  │  ┌─────────────────────┐  │  │
│  │  │     padding          │  │  │
│  │  │  ┌─────────────────┐ │  │  │
│  │  │  │    content      │ │  │  │
│  │  │  └─────────────────┘ │  │  │
│  │  └─────────────────────┘  │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

### 盒模型属性

```css
.box {
    /* 内容区域 */
    width: 200px;
    height: 100px;

    /* 内边距 */
    padding: 10px;
    padding: 10px 20px;  /* 上下 左右 */
    padding: 10px 15px 20px 25px;  /* 上 右 下 左 */

    /* 边框 */
    border: 1px solid #333;
    border-width: 1px;
    border-style: solid;
    border-color: #333;

    /* 外边距 */
    margin: 10px;
    margin: 10px auto;  /* 居中 */
}
```

### box-sizing

```css
/* 默认：content-box */
.content-box {
    box-sizing: content-box;
    width: 200px;  /* 内容宽度为 200px */
}

/* 推荐：border-box */
.border-box {
    box-sizing: border-box;
    width: 200px;  /* 边框+内边距+内容 = 200px */
}
```

## 常用属性

### 背景

```css
.background {
    background-color: #f0f0f0;
    background-image: url('bg.jpg');
    background-repeat: no-repeat;
    background-position: center top;
    background-size: cover;
}
```

### 文本

```css
.text {
    color: #333;
    font-size: 16px;
    font-family: Arial, sans-serif;
    text-align: center;
    line-height: 1.5;
    text-decoration: none;
}
```

### 浮动与清除

```css
.left {
    float: left;
}

.right {
    float: right;
}

.clearfix::after {
    content: '';
    display: block;
    clear: both;
}
```

## Flexbox 布局

```css
.container {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
}

.item {
    flex: 1;
    order: 1;
}
```

## Grid 布局

```css
.grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: auto;
    gap: 20px;
}

.grid-item {
    grid-column: span 2;
}
```

## 小结

- **CSS 规则**：选择器 + 声明块
- **引入方式**：外部样式最推荐
- **选择器**：标签、类、ID、属性、伪类
- **盒模型**：content → padding → border → margin
- **box-sizing**：`border-box` 更符合直觉
- **布局**：Flexbox 和 Grid 是现代布局方案
