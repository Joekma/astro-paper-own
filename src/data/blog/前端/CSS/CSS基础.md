---
title: CSS常用语法与盒模型分析
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-04-22T00:00:00.000+08:00
slug: css-basics-and-box-model
description: 'CSS常用语法与盒模型详解'
tags:
  - CSS
  - 前端
  - 盒模型
  - 布局
category: 前端
draft: false
language: zh-CN
---

> CSS 是前端开发的核心技能之一，盒模型是 CSS 布局的基础。掌握常用语法和盒模型是布局的前提。

## 基础选择器

### 常用选择器

| 选择器 | 语法 | 说明 |
|--------|------|------|
| 元素选择器 | `div` | 选择所有 div 元素 |
| 类选择器 | `.box` | 选择 class="box" 的元素 |
| ID 选择器 | `#header` | 选择 id="header" 的元素 |
| 通配符 | `*` | 选择所有元素 |
| 后代选择器 | `.box p` | 选择 .box 内的所有 p |
| 子选择器 | `.box > p` | 选择 .box 的直接子元素 p |

### 复合选择器

```css
/* 交集 */
div.box { }

/* 并集 */
div, .box { }

/* 属性选择器 */
input[type="text"] { }
a[href^="https"] { }
img[src$=".png"] { }
```

## 常用属性

### 文本属性

```css
.text {
    color: #333;
    font-size: 16px;
    font-family: "Microsoft YaHei", sans-serif;
    font-weight: 400;
    line-height: 1.8;
    text-align: center;
    text-decoration: none;
    text-overflow: ellipsis;
    white-space: nowrap;
}
```

### 背景属性

```css
.bg {
    background-color: #f5f5f5;
    background-image: url("bg.jpg");
    background-repeat: no-repeat;
    background-position: center;
    background-size: cover;
    /* 简写 */
    background: #f5f5f5 url("bg.jpg") no-repeat center;
}
```

### 边框属性

```css
.border {
    border-width: 1px;
    border-style: solid;
    border-color: #ddd;
    border-radius: 4px;
    /* 简写 */
    border: 1px solid #ddd;
    border-radius: 4px;
}
```

## 盒模型

### W3C 标准盒模型

```
┌─────────────────────────────────────┐
│             margin                  │
│  ┌─────────────────────────────────┐│
│  │           border                ││
│  │  ┌───────────────────────────┐  ││
│  │  │        padding            │  ││
│  │  │  ┌─────────────────────┐  │  ││
│  │  │  │       content       │  │  ││
│  │  │  └─────────────────────┘  │  ││
│  │  └───────────────────────────┘  ││
│  └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

### box-sizing

```css
/* 标准盒模型：width = content */
box-sizing: content-box;

/* IE 盒模型：width = content + padding + border */
box-sizing: border-box;
```

### 内边距和外边距

```css
.padding {
    padding: 10px;           /* 上下左右 */
    padding: 10px 20px;      /* 上下 左右 */
    padding: 10px 20px 30px; /* 上 左右 下 */
    padding: 10px 20px 30px 40px; /* 上 右 下 左 */
}

.margin {
    margin: 0 auto;          /* 水平居中 */
    margin-top: 10px;
    margin-bottom: 20px;
}
```

## 小结

- **选择器**：元素、类、ID、后代、属性选择器
- **盒模型**：content、padding、border、margin
- **box-sizing**：content-box vs border-box
- **布局**：浮动、定位、Flex 布局