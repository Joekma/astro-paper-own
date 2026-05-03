---
title: CSS布局技术
author: 程序员
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-04-22T00:00:00.000+08:00
slug: css-layout-techniques-comprehensive-guide
featured: false
draft: false
tags:
  - CSS
  - 前端开发
  - 布局技术
  - Flexbox
  - Grid
  - Web开发
description: '深入解析CSS布局核心概念，涵盖文档流、浮动、定位、Flexbox布局和Grid网格布局，掌握各种布局技巧与实战应用'
---

> CSS 布局是将网页内容放到合适位置的技术。

## 布局基础

### 布局方式

| 方式 | 说明 |
|------|------|
| **上下结构** | 多个盒子自然上下排列 |
| **左右结构** | 使用浮动或 Flexbox 实现左右布局 |

## 文档流

### 什么是文档流

文档流是 CSS 定位的默认情况，元素自动从左往右、从上往下流式排列。

### 脱离文档流的方式

> 脱离文档流的元素会被其他元素"无视"。

| 方式 | 说明 |
|------|------|
| `float` | 浮动 |
| `position: absolute` | 绝对定位 |
| `position: fixed` | 固定定位 |

## 浮动布局

### 浮动的特性

**浮动的比喻**：元素"浮"到天花板上，不占据地面面积。

```css
.float-left {
    float: left;
}

.float-right {
    float: right;
}
```

### 浮动的问题

**父盒子无法被浮动子元素撑开**，这在布局中是不允许的。

```css
/* 问题代码 */
.parent {
    border: 1px solid #ccc;
}

.child-float {
    float: left;
    width: 100px;
    height: 100px;
}
```

### 清除浮动

#### 方法一：添加空元素

```css
.clear {
    clear: both;
}
```

```html
<div class="parent">
    <div class="child-float">子元素</div>
    <div class="clear"></div>
</div>
```

#### 方法二：使用伪元素（推荐）

```css
.clearfix::after {
    content: '';
    display: block;
    clear: both;
}
```

#### 方法三：overflow

```css
.parent {
    overflow: hidden;
}
```

## 定位布局

### position 属性

| 值 | 说明 |
|------|------|
| `static` | 默认，正常文档流 |
| `relative` | 相对定位，相对于自身 |
| `absolute` | 绝对定位，相对于祖先定位元素 |
| `fixed` | 固定定位，相对于视口 |

### 相对定位

```css
.relative {
    position: relative;
    left: 20px;
    top: 10px;
}
```

### 绝对定位

```css
.parent {
    position: relative;  /* 祖先元素需要是定位元素 */
}

.child {
    position: absolute;
    right: 0;
    bottom: 0;
}
```

### 固定定位

```css
.fixed-header {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 60px;
}
```

## Flexbox 布局

### 启用 Flexbox

```css
.container {
    display: flex;
}
```

### 主轴属性

```css
.container {
    flex-direction: row;           /* 主轴方向 */
    justify-content: space-between;  /* 主轴对齐 */
    flex-wrap: wrap;               /* 换行 */
    gap: 20px;                    /* 间距 */
}
```

### 交叉轴属性

```css
.container {
    align-items: center;          /* 交叉轴对齐 */
    align-content: space-between;  /* 多行对齐 */
}
```

### 伸缩项属性

```css
.item {
    flex: 1;                      /* 分配剩余空间 */
    order: 1;                     /* 排序 */
    flex-grow: 1;                /* 放大 */
    flex-shrink: 0;              /* 缩小 */
    flex-basis: 200px;           /* 初始大小 */
}
```

## Grid 布局

### 启用 Grid

```css
.container {
    display: grid;
}
```

### 定义网格

```css
.container {
    grid-template-columns: repeat(3, 1fr);  /* 3列 */
    grid-template-rows: 100px 200px;       /* 2行 */
    gap: 20px;                            /* 间距 */
}
```

### 网格项定位

```css
.item {
    grid-column: 1 / 3;    /* 占据1-2列 */
    grid-row: 1 / 2;      /* 占据第1行 */
}
```

## 居中布局

### 水平居中

```css
/* 块级元素 */
.block-center {
    margin: 0 auto;
}

/* Flexbox */
.flex-center-h {
    display: flex;
    justify-content: center;
}
```

### 垂直居中

```css
.flex-center-v {
    display: flex;
    align-items: center;
}
```

### 水平垂直居中

```css
/* 方法一：Flexbox */
.flex-center {
    display: flex;
    justify-content: center;
    align-items: center;
}

/* 方法二：绝对定位 */
.abs-center {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
}

/* 方法三：Grid */
.grid-center {
    display: grid;
    place-items: center;
}
```

## 小结

- **浮动**：适合简单布局，需要清除浮动
- **定位**：适合特殊位置需求
- **Flexbox**：适合一维布局（行或列）
- **Grid**：适合二维布局（行和列）
- **居中**：推荐使用 Flexbox 或 Grid
