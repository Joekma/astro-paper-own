---
title: "Design Tokens 与组件库：让 AI 生成页面保持一致"
author: Joekma
pubDatetime: 2026-05-16T00:00:00.000+08:00
modDatetime: 2026-05-16T00:00:00.000+08:00
slug: ai-cross-platform-design-tokens-components
featured: false
draft: false
tags:
  - 设计系统
  - Design Tokens
  - 组件库
  - AI开发
description: "用设计令牌、组件约束和页面模式约束 AI 输出，避免每次生成页面都出现风格漂移。"
series: AI 多端页面设计
language: zh-CN
---

## 核心结论

AI 生成页面最大的问题之一，是每次都重新发明风格：这次圆角 12px，下次 24px；这次蓝色，下次紫色；这次紧凑，下次松散。

解决办法不是反复说“高级一点”，而是给 AI 明确的 Design Tokens、组件库和页面模式。

## Design Tokens

Design Tokens 是设计系统的最小单位。它把颜色、字号、间距、圆角、阴影、动效等抽象成命名变量。

建议分三层：

- 基础令牌：`blue-600`、`space-16`、`radius-8`。
- 语义令牌：`color-bg-page`、`color-text-primary`。
- 组件令牌：`button-primary-bg`、`input-border-focus`。

业务组件应该优先使用语义令牌，而不是直接写具体色值。

## 组件约束

你可以限制 AI 只使用这些组件：

- `AppShell`
- `PageHeader`
- `FilterBar`
- `DataTable`
- `StatusTag`
- `ActionMenu`
- `Drawer`
- `ConfirmDialog`
- `EmptyState`

这样 AI 更像在组装成熟产品，而不是每次生成一个新模板。

## 页面模式

常见页面可以沉淀为模板：列表管理页、详情页、编辑页、审批页、监控页、工作台。AI 先选页面模式，再填业务内容，稳定性会明显提高。

## AI 开发提示词

```text
请基于以下设计令牌和组件库生成页面。
所有颜色、字号、间距、圆角必须来自 token。
只能使用 AppShell、PageHeader、FilterBar、DataTable、StatusTag、Drawer、ConfirmDialog、EmptyState。
不要创建新的视觉风格。
```

## 检查清单

- 是否有语义颜色、间距、字号、圆角令牌？
- 组件状态是否包含 hover、focus、disabled、loading、error？
- AI 是否被限制在现有组件内？
- 暗色模式是否可以通过 token 切换？

## 参考来源

- IBM Carbon Design System：https://carbondesignsystem.com/
- Microsoft Fluent 2：https://fluent2.microsoft.design/
- Figma UI Kits：https://help.figma.com/hc/en-us/articles/24037724065943-Start-designing-with-UI-kits

