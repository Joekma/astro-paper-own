---
title: "WCAG 可访问性实战：让页面更可靠、更包容"
author: Joekma
pubDatetime: 2026-05-16T00:00:00.000+08:00
modDatetime: 2026-05-16T00:00:00.000+08:00
slug: ai-cross-platform-design-accessibility
featured: false
draft: false
tags:
  - 可访问性
  - WCAG
  - 前端开发
  - UX设计
description: "面向开发者讲解 WCAG 2.2 的常见落地场景，包括对比度、键盘、焦点、表单错误和触控目标。"
series: AI 多端页面设计
language: zh-CN
---

## 核心结论

可访问性不是额外负担，而是可靠产品的基础。很多可访问性改进同时也会提升普通用户体验，比如更清楚的错误提示、更明显的焦点状态、更大的点击区域。

WCAG 2.2 是当前 Web 可访问性的重要参考，做业务系统时至少应该按 AA 思路检查关键页面。

## 颜色和对比度

文本和背景必须有足够对比度。辅助文字不能浅到看不清。错误、成功、警告不能只靠颜色表达，还要有文字、图标或结构提示。

图表也不要只靠红绿区分数据，色盲用户可能无法识别。

## 键盘和焦点

所有交互元素都应可键盘访问。焦点状态要清楚可见，不能为了视觉简洁把 outline 全部去掉。

弹窗要处理焦点锁定、ESC 关闭、关闭后焦点回到触发按钮。

## 表单错误

错误提示要靠近字段，并被读屏工具识别。不要只在页面顶部显示“有错误”，却不告诉用户哪个字段需要修改。

## AI 开发提示词

```text
请以 WCAG 2.2 AA 思路检查【页面】。
重点检查颜色对比度、键盘可达性、焦点状态、表单错误、图标按钮标签、触控目标和非颜色信息表达。
输出问题、影响和修复建议。
```

## 检查清单

- 文本对比度是否足够？
- 图标按钮是否有 aria-label 或 tooltip？
- 表单错误是否不只靠颜色表达？
- 焦点状态是否清楚？
- 弹窗焦点是否被正确管理？

## 参考来源

- WCAG 2.2：https://www.w3.org/TR/WCAG22/
- W3C WAI WCAG Overview：https://www.w3.org/WAI/standards-guidelines/wcag/
- Material Design Accessibility：https://m3.material.io/

