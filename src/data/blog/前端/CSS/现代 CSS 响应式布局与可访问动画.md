---
title: 现代 CSS 响应式布局与可访问动画
author: Joekma
pubDatetime: 2026-05-15T00:00:00.000+08:00
modDatetime: 2026-05-15T00:00:00.000+08:00
slug: modern-css-responsive-layout-accessible-animation
description: '介绍现代 CSS 响应式方案、容器查询、CSS 变量、层叠层和可访问动画实践。'
tags:
  - CSS
  - 响应式
  - 可访问性
  - 动画
  - 前端
category: 前端
draft: false
series: CSS
seriesOrder: 1
language: zh-CN
---

现代 CSS 的重点已经不只是“写出布局”，还包括组件在不同容器里的适配、主题变量、层叠管理以及动画对用户偏好的尊重。

## 响应式策略

### 视口断点

```css
.page {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

@media (min-width: 768px) {
  .page {
    /* 宽屏时让主内容和侧边栏并排。 */
    grid-template-columns: minmax(0, 1fr) 18rem;
  }
}
```

### 容器查询

媒体查询关注浏览器视口，容器查询关注组件所在容器，更适合组件库和卡片布局。

```css
.article-card {
  container-type: inline-size;
}

.article-card__body {
  display: grid;
  gap: 0.75rem;
}

@container (min-width: 36rem) {
  .article-card__body {
    /* 卡片容器足够宽时再切换为图文横排。 */
    grid-template-columns: 12rem 1fr;
  }
}
```

## CSS 变量

```css
:root {
  --color-bg: #ffffff;
  --color-text: #111827;
  --space-page: clamp(1rem, 4vw, 3rem);
}

[data-theme="dark"] {
  --color-bg: #111827;
  --color-text: #f9fafb;
}

body {
  background: var(--color-bg);
  color: var(--color-text);
  padding-inline: var(--space-page);
}
```

## 层叠层

`@layer` 可以把 reset、基础样式、组件样式和工具类的优先级顺序写清楚，减少“选择器越写越重”的问题。

```css
@layer reset, base, components, utilities;

@layer reset {
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }
}

@layer components {
  .button {
    border-radius: 0.5rem;
    padding: 0.5rem 0.875rem;
  }
}

@layer utilities {
  .text-muted {
    color: #6b7280;
  }
}
```

## 可访问动画

动画可以增强反馈，但要尊重用户的减少动态偏好。

```css
.toast {
  animation: slide-in 180ms ease-out;
}

@keyframes slide-in {
  from {
    opacity: 0;
    transform: translateY(0.5rem);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    /* 减少动态偏好的用户不应被强制观看位移动画。 */
    animation-duration: 1ms !important;
    transition-duration: 1ms !important;
    scroll-behavior: auto !important;
  }
}
```

## 性能建议

- 优先动画 `opacity` 和 `transform`，谨慎动画 `width`、`height`、`top`、`left`。
- 大面积阴影、滤镜、模糊会增加渲染成本。
- 复杂页面中使用 `content-visibility: auto` 延迟渲染屏幕外内容。

```css
.article-list > article {
  content-visibility: auto;
  contain-intrinsic-size: 320px;
}
```

## 小结

现代 CSS 更强调组件自适应、主题化和用户体验边界。视口查询解决页面级布局，容器查询解决组件级适配，CSS 变量和层叠层让样式系统更稳定，可访问动画让体验更温和。
