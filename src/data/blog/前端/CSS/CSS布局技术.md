---
title: CSS布局技术
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-05-04T00:00:00.000+08:00
slug: css-layout-techniques-comprehensive-guide
featured: false
draft: false
tags:
  - CSS
  - 前端开发
  - 布局技术
  - Flexbox
  - Grid
  - BFC
  - Web开发
description: '深入解析CSS布局核心概念，涵盖文档流、Flexbox布局、Grid网格布局、BFC块级格式化上下文、经典布局技巧与实战应用'
series: CSS
seriesOrder: 2
language: zh-CN
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

### 块级元素 vs 行内元素

| 特性 | 块级元素 | 行内元素 |
|------|----------|----------|
| **排列** | 独占一行 | 并排排列 |
| **宽度** | 自动填满父元素 | 由内容决定 |
| **可设置尺寸** | ✅ | ❌（宽高无效） |
| **margin/padding** | 四周有效 | 仅水平有效 |

### 常见元素

```html
<!-- 块级元素 -->
<div>, <p>, <h1>-<h6>, <ul>, <ol>, <li>, <table>, <form>

<!-- 行内元素 -->
<span>, <a>, <strong>, <em>, <label>, <input>, <img>
```

### 脱离文档流的方式

| 方式 | 说明 |
|------|------|
| `float` | 浮动 |
| `position: absolute` | 绝对定位 |
| `position: fixed` | 固定定位 |

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

## BFC - 块级格式化上下文

### 什么是 BFC

BFC 是一个独立的渲染区域，内部元素布局不受外部影响。

### 创建 BFC 的方式

| 方式 | 示例 |
|------|------|
| `float` | `float: left` |
| `position` | `position: absolute/fixed` |
| `overflow` | `overflow: hidden` |
| `display` | `display: inline-block/flex/grid` |

### BFC 特性

1. 内部的 Box 垂直放置
2. Box 垂直距离由 margin 决定
3. 同 BFC 的相邻 margin 会重叠
4. 计算 BFC 高度时，浮动元素也参与计算

### BFC 应用场景

#### 清除浮动

```css
.clearfix {
    overflow: hidden;  /* 触发 BFC */
}
```

#### 防止 margin 重叠

```css
.box1 {
    margin-bottom: 20px;
}

.box2 {
    margin-top: 20px;
}

/* 解决方案：让它们在不同的 BFC 中 */
.container {
    overflow: hidden;
}
```

#### 自适应布局

```css
.left {
    float: left;
    width: 200px;
}

.right {
    overflow: hidden;  /* 触发 BFC，自适应剩余宽度 */
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

## 经典布局

### 圣杯布局

```css
.container {
    padding: 0 200px;
}

.main {
    float: left;
    width: 100%;
}

.left {
    float: left;
    width: 200px;
    margin-left: -100%;
    position: relative;
    right: 200px;
}

.right {
    float: left;
    width: 200px;
    margin-right: -200px;
}
```

### 双飞翼布局

```css
.main-wrapper {
    float: left;
    width: 100%;
}

.main {
    margin: 0 200px;
}

.left {
    float: left;
    width: 200px;
    margin-left: -100%;
}

.right {
    float: left;
    width: 200px;
    margin-left: -200px;
}
```

### 等高布局

```css
.container {
    overflow: hidden;
}

.left,
.right {
    float: left;
    width: 200px;
    padding-bottom: 9999px;
    margin-bottom: -9999px;
}
```

## 小结

- **Flexbox**：适合一维布局（行或列）
- **Grid**：适合二维布局（行和列）
- **BFC**：独立的渲染区域，解决浮动、margin 重叠等问题
- **居中**：推荐使用 Flexbox 或 Grid
- **经典布局**：圣杯、双飞翼、等高布局