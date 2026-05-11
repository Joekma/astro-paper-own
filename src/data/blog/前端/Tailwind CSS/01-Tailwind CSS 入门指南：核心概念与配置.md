---
title: Tailwind CSS 入门指南：核心概念与配置
author: Joekma
pubDatetime: 2026-05-09T00:00:00.000+08:00
modDatetime: 2026-05-09T00:00:00.000+08:00
slug: tailwindcss-getting-started
description: '详细介绍Tailwind CSS的实用优先理念、配置系统和核心类名。'
tags:
  - Tailwind CSS
  - 前端
  - CSS 框架
  - 实用优先
draft: false
series: Tailwind CSS
language: zh-CN
---

## 概述

Tailwind CSS 是一个**实用优先**（Utility-First）的 CSS 框架，它提供了大量低级工具类，可以直接在 HTML 中组合使用，快速构建自定义设计。

### 为什么选择 Tailwind CSS？

| 特性 | 说明 |
|------|------|
| **实用类** | 细粒度控制 |
| **响应式** | 内置响应式前缀 |
| **深色模式** | 内置暗色模式支持 |
| **组件提取** | @apply 提取样式 |
| **JIT 引擎** | 按需生成 CSS |
| **自定义配置** | 完全可配置 |

### Tailwind vs 其他框架

| 框架 | 理念 | 学习曲线 |
|------|------|----------|
| **Tailwind CSS** | 实用类优先 | 中等 |
| **Bootstrap** | 组件库 | 低 |
| **MUI** | Material Design | 中等 |
| **纯 CSS** | 手写样式 | 高 |

## 核心概念

### 实用类优先

```
┌─────────────────────────────────────────────────────────────┐
│                 Utility-First 理念                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────┐  │
│  │ 单一职责工具类                                    │  │
│  ├─────────────────────────────────────────────┼─────┤ │
│  │                                                    │     │ │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐  │     │ │
│  │  │flex   │ │ items  │ │justify │ │center  │  │     │ │
│  │  │items-│ │center │ │-center │ │        │  │     │ │
│  │  │grid  │ │        │ │        │ │        │  │     │ │
│  │  └────────┘ └────────┘ └────────┘ └────────┘  │     │ │
│  └─────────────────────────────────────────────┘     │ │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 基本语法

```html
<!-- 基础类 -->
<div class="flex items-center justify-between p-4 bg-white rounded-lg shadow-md">
  <h1 class="text-2xl font-bold text-gray-900">标题</h1>
  <button class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
    按钮
  </button>
</div>

<!-- 响应式类 -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <!-- 内容 -->
</div>

<!-- 状态变体 -->
<button class="bg-blue-500 hover:bg-blue-600 focus:ring-2 focus:ring-blue-300">
  按钮
</button>
```

## 空间系统

### 间距

```html
<!-- 间距类 -->
<div class="space-y-4">
  <div class="p-4">第一项</div>
  <div class="p-8">第二项</div>
  <div class="p-12">第三项</div>
</div>

<!-- 常用间距值 -->
<div class="
  m-0    <!-- 外边距 -->
  mx-auto  <!-- 水平居中 -->
  my-4    <!-- 垂直边距 -->
  p-4     <!-- 内边距
  pt-4    <!-- 顶部内边距
  pr-8    <!-- 右边距
  pb-12   <!-- 底部内边距
  pl-2    <!-- 左边距
">
</div>
```

### 间距值表

| 前缀 | 说明 | 示例 |
|------|------|------|
| **m-** | 外边距 | margin |
| **p-** | 内边距 | padding |
| **space-** | 子元素间距 | gap |
| **gap-** | 网格间距 | grid gap |
| **-4** | 1rem (16px) | 间距值 |

## 颜色系统

### 内置颜色

```html
<!-- 文本颜色 -->
<p class="text-red-500">红色文字</p>
<p class="text-gray-900 dark:text-gray-100">暗色模式</p>

<!-- 背景颜色 -->
<div class="bg-blue-500 hover:bg-blue-600">
  蓝色背景
</div>

<!-- 边框颜色 -->
<div class="border border-gray-300">
  边框
</div>

<!-- 渐变背景 -->
<div class="bg-gradient-to-r from-blue-500 to-purple-600">
  渐变背景
</div>
```

### 颜色深度

```html
<!-- 50-900 深度渐变 -->
<div class="text-gray-50">极浅灰</div>
<div class="text-gray-900">深灰</div>
<div class="bg-blue-100">浅蓝背景</div>
<div class="bg-blue-900">深蓝背景</div>
```

## 文本样式

### 字体大小

```html
<!-- 字体大小 -->
<h1 class="text-5xl font-bold">超大标题</h1>
<h2 class="text-4xl">大标题</h2>
<h3 class="text-3xl">中标题</h3>
<p class="text-base">正文</p>
<p class="text-sm">小文本</p>
<p class="text-xs">超小文本</p>
```

### 字体样式

```html
<!-- 字体粗细 -->
<p class="font-thin">细体</p>
<p class="font-normal">常规</p>
<p class="font-bold">粗体</p>

<!-- 字体系列 -->
<p class="font-sans">无衬线字体</p>
<p class="font-serif">衬线字体</p>
<p class="font-mono">等宽字体</p>

<!-- 文字样式 -->
<p class="italic">斜体</p>
<p class="underline">下划线</p>
<p class="line-through">删除线</p>
<p class="uppercase">大写</p>
<p class="tracking-widest">字间距</p>
```

## Flexbox 布局

### 主轴和交叉轴

```html
<!-- Flex 容器 -->
<div class="flex">
  <div>项目1</div>
  <div>项目2</div>
  <div>项目3</div>
</div>

<!-- Flex 方向 -->
<div class="flex flex-row">
  <!-- 水平 -->
</div>

<div class="flex flex-col">
  <!-- 垂直 -->
</div>
```

### 对齐方式

```html
<!-- 主轴对齐 -->
<div class="flex justify-start">左对齐</div>
<div class="flex justify-center">居中</div>
<div class="flex justify-end">右对齐</div>
<div class="flex justify-between">两端对齐</div>
<div class="flex justify-around">环绕对齐</div>
<div class="flex justify-evenly">均匀等间距</div>

<!-- 交叉轴对齐 -->
<div class="flex items-start">顶部对齐</div>
<div class="flex items-center">垂直居中</div>
<div class="flex items-end">底部对齐</div>
<div class="flex items-stretch">拉伸</div>
```

### Flex 项目

```html
<!-- 项目属性 -->
<div class="flex gap-4">
  <div class="flex-1">占满剩余空间</div>
  <div class="flex-auto">自动大小</div>
  <div class="flex-initial">内容大小</div>
  <div class="flex-none">不伸缩</div>
</div>

<!-- 排序 -->
<div class="flex">
  <div class="order-2">第二个</div>
  <div class="order-1">第一个</div>
  <div class="order-3">第三个</div>
</div>
```

## Grid 布局

### 网格容器

```html
<!-- Grid 容器 -->
<div class="grid grid-cols-3 gap-4">
  <div>项目1</div>
  <div>项目2</div>
  <div>项目3</div>
</div>

<!-- 响应式网格 -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
  <!-- 自动响应式布局 -->
</div>
```

### Grid 跨度

```html
<!-- 跨列 -->
<div class="grid grid-cols-4">
  <div class="col-span-2">跨两列</div>
  <div>普通列</div>
  <div>普通列</div>
</div>

<!-- 跨行 -->
<div class="grid grid-rows-3">
  <div class="row-span-2">跨两行</div>
  <div>普通行</div>
  <div>普通行</div>
</div>
```

## 响应式设计

### 断点前缀

```html
<!-- 响应式类 -->
<div class="
  p-4                <!-- 移动端
  md:p-8             <!-- 平板 (768px+)
  lg:p-12            <!-- 笔记本 (1024px+)
  xl:p-16            <!-- 桌面 (1280px+)
  2xl:p-20           <!-- 大屏 (1536px+)
">
</div>

<!-- 响应式显示/隐藏 -->
<div class="hidden md:block">桌面端显示</div>
<div class="block md:hidden">移动端显示</div>
```

### 容器类

```html
<!-- 容器 -->
<div class="container mx-auto px-4">
  <div class="max-w-7xl mx-auto">
    内容
  </div>
</div>
```

## 状态变体

### 悬停、焦点、活动

```html
<!-- 悬停 -->
<button class="bg-blue-500 hover:bg-blue-600">
  悬停变色
</button>

<!-- 焦点 -->
<input class="focus:ring-2 focus:ring-blue-500 focus:outline-none">
  焦点样式
</input>

<!-- 活动 -->
<button class="active:bg-blue-700">
  点击变色
</button>

<!-- 组合状态 -->
<button class="
  bg-blue-500
  hover:bg-blue-600
  focus:ring-2
  focus:ring-blue-300
  active:bg-blue-700
  disabled:opacity-50
  disabled:cursor-not-allowed
">
  多状态组合
</button>
```

### 其他状态

```html
<!-- 组悬停 -->
<div class="group hover:shadow-lg">
  <div class="group-hover:bg-gray-100">
    组合状态
  </div>
</div>

<!-- 兄弟悬停 -->
<div class="peer">
  <input type="text" class="peer-invalid:border-red-500" />
</div>
<div class="peer-hover:text-blue-500">
  兄弟悬停
</div>
```

## 深色模式

### 启用深色模式

```html
<!-- 自动深色模式支持 -->
<html class="dark">
  <body class="bg-white dark:bg-gray-900">
    <div class="text-gray-900 dark:text-gray-100">
      深色文本
    </div>
  </body>
</html>
```

### 深色模式类

```html
<!-- 深色模式 -->
<div class="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
  自动适应
</div>

<!-- 自定义深色模式 -->
<div class="[&:hover>span]:text-blue-500">
  悬停样式
</div>
```

## 自定义配置

### Tailwind.config.js

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          500: '#3b82f6',
          900: '#1e3a8a',
        },
      },
      spacing: {
        '128': '32rem',
        '144': '36rem',
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
      },
    },
  },
  plugins: [],
}
```

### @apply 指令

```css
/* 使用 @apply 提取样式 */
.btn {
  @apply px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600;
}
```

## 最佳实践

### 组织类名

```html
<!-- 推荐顺序 -->
<button class="
  <!-- 1. 定位
  relative
  <!-- 2. 显示
  block
  <!-- 3. Flex/Grid
  flex items-center
  <!-- 4. 间距
  p-4
  <!-- 5. 尺寸
  w-full
  <!-- 6. 排版
  text-lg
  <!-- 7. 颜色
  bg-blue-500
  <!-- 8. 效果
  shadow-md
  <!-- 9. 交互
  hover:bg-blue-600
">
  按钮
</button>
```

### 性能优化

```html
<!-- 使用组和变体减少重复 -->
<div class="group">
  <div class="group-hover:opacity-100">
    组状态
  </div>
</div>

<!-- 使用 CSS 变量 -->
<div style="--color: #3b82f6">
  <button style="background-color: var(--color)">
    样式化
  </button>
</div>
```


