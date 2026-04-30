---
title: CSS形变与动画
author: 程序员
pubDatetime: 2024-08-13T00:00:00.000+08:00
updated: 2026-04-22T00:00:00.000+08:00
slug: css-transforms-and-animations
description: 'CSS形变与动画教程，包括2D转换、3D转换、过渡动画和关键帧动画'
tags:
  - CSS
  - 前端
  - 动画
  - Web
category: 前端
draft: false
language: zh-CN
---

> CSS 形变和动画可以为网页添加丰富的视觉效果。

## 2D 转换

### 常用转换函数

| 函数 | 说明 | 示例 |
|------|------|------|
| `translate()` | 平移 | `translate(50px, 100px)` |
| `rotate()` | 旋转 | `rotate(45deg)` |
| `scale()` | 缩放 | `scale(2, 0.5)` |
| `skew()` | 斜切 | `skew(20deg, 10deg)` |
| `matrix()` | 矩阵变换 | 组合变换 |

### translate - 平移

```css
.box {
    transform: translate(50px, 100px);  /* X轴50px, Y轴100px */
}

.box-x {
    transform: translateX(50px);  /* 仅X轴 */
}

.box-y {
    transform: translateY(50px);  /* 仅Y轴 */
}
```

### rotate - 旋转

```css
.box {
    transform: rotate(45deg);   /* 顺时针旋转45度 */
    transform: rotate(-45deg);  /* 逆时针旋转45度 */
    transform: rotateZ(45deg);   /* 绕Z轴旋转 */
}
```

### scale - 缩放

```css
.box {
    transform: scale(2);        /* 放大2倍 */
    transform: scale(0.5);       /* 缩小到一半 */
    transform: scale(2, 1);     /* X轴2倍, Y轴1倍 */
}
```

### skew - 斜切

```css
.box {
    transform: skew(20deg);      /* X轴斜切20度 */
    transform: skew(20deg, 10deg);  /* X轴20度, Y轴10度 */
}
```

### transform-origin - 转换原点

```css
.box {
    transform: rotate(45deg);
    transform-origin: center center;    /* 默认：中心 */
    transform-origin: top left;         /* 左上角 */
    transform-origin: 0 0;              /* 坐标(0,0) */
}
```

## 3D 转换

### 3D 转换函数

| 函数 | 说明 |
|------|------|
| `translate3d()` | 3D 平移 |
| `rotate3d()` | 3D 旋转 |
| `scale3d()` | 3D 缩放 |
| `perspective()` | 透视 |

### perspective - 透视

```css
.container {
    perspective: 1000px;  /* 透视距离 */
}
```

### rotateX / rotateY / rotateZ

```css
.box {
    transform: rotateX(45deg);   /* 绕X轴旋转 */
    transform: rotateY(45deg);   /* 绕Y轴旋转 */
    transform: rotate3d(1, 1, 1, 45deg);  /* 3D组合旋转 */
}
```

### transform-style

```css
.parent {
    transform-style: preserve-3d;  /* 保持3D效果 */
}
```

## 过渡动画

### transition 属性

```css
.box {
    transition: property duration timing-function delay;
}
```

### 基本用法

```css
.box {
    width: 100px;
    height: 100px;
    background: red;
    
    transition: width 0.3s ease, background 0.5s ease;
}

.box:hover {
    width: 200px;
    background: blue;
}
```

### 简写形式

```css
/* 完整写法 */
transition: all 0.3s ease-in-out 0.1s;

/* 常用简写 */
transition: all 0.3s ease;
transition: transform 0.5s linear;
transition: opacity 0.3s;
```

### 缓动函数

| 函数 | 说明 |
|------|------|
| `ease` | 慢-快-慢（默认） |
| `linear` | 匀速 |
| `ease-in` | 慢-快 |
| `ease-out` | 快-慢 |
| `ease-in-out` | 慢-快-慢 |

## 关键帧动画

### @keyframes 规则

```css
@keyframes animationName {
    from {
        property: value1;
    }
    to {
        property: value2;
    }
}

/* 或使用百分比 */
@keyframes animationName {
    0% {
        transform: translateX(0);
    }
    50% {
        transform: translateX(100px);
    }
    100% {
        transform: translateX(0);
    }
}
```

### animation 属性

```css
.box {
    animation: animationName duration timing-function delay iteration-count direction fill-mode;
}
```

### 常用属性

```css
.box {
    /* 完整写法 */
    animation-name: moveBox;
    animation-duration: 2s;
    animation-timing-function: ease;
    animation-delay: 0.5s;
    animation-iteration-count: infinite;  /* 循环播放 */
    animation-direction: alternate;       /* 往返播放 */
    animation-fill-mode: forwards;        /* 保持结束状态 */
    animation-play-state: running;        /* 运行/暂停 */
    
    /* 简写 */
    animation: moveBox 2s ease infinite alternate;
}
```

### 动画示例

```css
/* 淡入淡出 */
@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

/* 旋转 */
@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

/* 弹跳 */
@keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-20px); }
}

/* 脉冲 */
@keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
}
```

## 综合示例

### 卡片翻转

```css
.card-container {
    perspective: 1000px;
}

.card {
    width: 200px;
    height: 200px;
    position: relative;
    transform-style: preserve-3d;
    transition: transform 0.8s;
}

.card:hover {
    transform: rotateY(180deg);
}

.card-front,
.card-back {
    position: absolute;
    width: 100%;
    height: 100%;
    backface-visibility: hidden;
}

.card-front {
    background: blue;
}

.card-back {
    background: red;
    transform: rotateY(180deg);
}
```

### 加载动画

```css
.loader {
    width: 50px;
    height: 50px;
    border: 5px solid #f3f3f3;
    border-top: 5px solid #3498db;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
```

## 小结

- **2D 转换**：`translate`、`rotate`、`scale`、`skew`
- **3D 转换**：添加透视和 Z 轴
- **过渡动画**：`transition`，适合简单状态变化
- **关键帧动画**：`@keyframes` + `animation`，适合复杂动画
- **性能优化**：优先使用 `transform` 和 `opacity`
