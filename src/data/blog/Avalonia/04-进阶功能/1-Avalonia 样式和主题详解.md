---
title: Avalonia 样式和主题详解
author: Joekma
pubDatetime: 2026-05-06T00:00:00.000+08:00
modDatetime: 2026-05-06T00:00:00.000+08:00
slug: avalonia-styling-themes
description: '深入学习 Avalonia 样式系统，掌握样式定义、样式类、选择器、Setter、资源字典，以及 Fluent 和 Material 等主题的使用。'
tags:
  - Avalonia
  - 样式
  - 主题
  - Style
  - Selector
  - Setter
  - Fluent
  - Material
  - 皮肤
draft: false
language: zh-CN
---

## 概述

Avalonia 样式系统是一种在控件之间共享属性设置的机制。Avalonia 提供三种主要机制进行样式设置：样式、控件主题和容器查询。

### 样式系统概述

```
选择阶段 → 匹配控件 → 应用Setter
    ↑                              ↓
    └──────── 逻辑树向上搜索 ────────┘
```

样式系统通过在选择阶段向上搜索逻辑树来实现级联样式。这意味着在应用程序最高层级（App.axaml 文件）定义的样式可以在任何地方使用，但仍可以在靠近控件的地方覆盖。

---

## 样式（Styles）

### 什么是样式

样式类似于 CSS 样式，通常用于根据控件在应用程序中的内容或用途来设置控件样式。

### 样式结构

```xml
<Style Selector="selector">
    <Setter Property="property" Value="value"/>
    ...
</Style>
```

### 基本示例

```xml
<Window.Styles>
    <Style Selector="TextBlock.h1">
        <Setter Property="FontSize" Value="24"/>
        <Setter Property="FontWeight" Value="Bold"/>
    </Style>
</Window.Styles>

<TextBlock Classes="h1">这是标题</TextBlock>
```

### 嵌套样式

```xml
<Style Selector="TextBlock.h1">
    <Setter Property="FontSize" Value="24"/>
    <Setter Property="FontWeight" Value="Bold"/>
    
    <Style Selector="^:pointerover">
        <Setter Property="Foreground" Value="Red"/>
    </Style>
</Style>
```

嵌套样式使用 `^` 嵌套选择器，前缀自动继承。

---

## 样式选择器（Selectors）

### 选择器类型

| 选择器 | 语法 | 匹配 |
|--------|------|------|
| 类型 | `Button` | Button 及其子类 |
| 类 | `.primary` | Classes="primary" |
| ID | `#saveButton` | x:Name="saveButton" |
| 后代 | `StackPanel Button` | StackPanel 内的 Button |
| 子代 | `StackPanel > Button` | StackPanel 直接子 Button |
| 属性 | `Button.primary` | Button.primary |

### 组合选择器

```xml
<!-- 类型 + 类 -->
<Style Selector="Button.primary">
    <Setter Property="Background" Value="Blue"/>
</Style>

<!-- 类型 + 伪类 -->
<Style Selector="Button:pointerover">
    <Setter Property="Background" Value="LightBlue"/>
</Style>

<!-- ID + 类 -->
<Style Selector="#mainPanel.emphasized">
    <Setter Property="Background" Value="LightGray"/>
</Style>
```

---

## 样式类（Style Classes）

### 基本使用

```xml
<!-- 定义样式 -->
<Style Selector="TextBlock.header">
    <Setter Property="FontSize" Value="24"/>
    <Setter Property="FontWeight" Value="Bold"/>
</Style>

<!-- 应用到控件 -->
<TextBlock Classes="header" Text="标题"/>
```

### 多类选择

```xml
<!-- 选择同时有多个类的控件 -->
<Style Selector="TextBlock.header.large">
    <Setter Property="FontSize" Value="32"/>
</Style>
```

### 全局类

```xml
<!-- App.axaml 中定义全局样式 -->
<Style Selector=".text-danger">
    <Setter Property="Foreground" Value="Red"/>
</Style>
```

---

## Setter（属性设置器）

### 基本语法

```xml
<Setter Property="FontSize" Value="24"/>
<Setter Property="Padding" Value="4 2 0 4"/>
```

### 属性类型转换

Avalonia 自动转换值类型：

```xml
<Setter Property="Width" Value="200"/>  <!-- 字符串到double -->
<Setter Property="Background" Value="Blue"/>  <!-- 字符串到Brush -->
```

### 复杂值

```xml
<Setter Property="Background">
    <Setter.Value>
        <LinearGradientBrush StartPoint="0%,0%" EndPoint="100%,100%">
            <GradientStop Color="Red" Offset="0"/>
            <GradientStop Color="Blue" Offset="1"/>
        </LinearGradientBrush>
    </Setter.Value>
</Setter>
```

---

## 资源字典（ResourceDictionary）

### 定义资源

```xml
<Window.Resources>
    <SolidColorBrush x:Key="PrimaryBrush" Color="Blue"/>
    <x:Double x:Key="FontSizeLarge">24</x:Double>
</Window.Resources>
```

### 引用资源

```xml
<!-- 静态资源 -->
<Button Background="{StaticResource PrimaryBrush}"/>

<!-- 动态资源 -->
<Button Background="{DynamicResource PrimaryBrush}"/>
```

### 全局资源

在 App.axaml 中定义全局资源：

```xml
<Application xmlns="https://github.com/avaloniaui">
    <Application.Resources>
        <SolidColorBrush x:Key="PrimaryBrush" Color="Blue"/>
        <SolidColorBrush x:Key="SecondaryBrush" Color="Gray"/>
    </Application.Resources>
</Application>
```

---

## 伪类（Pseudoclasses）

### 常用伪类

| 伪类 | 说明 |
|------|------|
| `:pointerover` | 鼠标悬停 |
| `:pressed` | 按下状态 |
| `:disabled` | 禁用状态 |
| `:focus` | 获得焦点 |
| `:focus-visible` | 可见焦点 |
| `:checked` | 选中状态 |

### 使用示例

```xml
<Style Selector="Button">
    <Setter Property="Background" Value="Gray"/>
    <Setter Property="Foreground" Value="White"/>
</Style>

<Style Selector="Button:pointerover">
    <Setter Property="Background" Value="LightGray"/>
</Style>

<Style Selector="Button:pressed">
    <Setter Property="Background" Value="DarkGray"/>
</Style>

<Style Selector="Button:disabled">
    <Setter Property="Opacity" Value="0.5"/>
</Style>
```

---

## 主题（Themes）

### Fluent 主题

```xml
<Application xmlns="https://github.com/avaloniaui">
    <Application.Styles>
        <FluentTheme />
    </Application.Styles>
</Application>
```

### Material 主题

安装包：

```powershell
dotnet add package Avalonia.Themes.Material
```

使用：

```xml
<Application xmlns="https://github.com/avaloniaui">
    <Application.Styles>
        <MaterialTheme />
    </Application.Styles>
</Application>
```

### Simple 主题

```xml
<Application xmlns="https://github.com/avaloniaui">
    <Application.Styles>
        <SimpleTheme />
    </Application.Styles>
</Application>
```

---

## 主题变体（Theme Variants）

### 亮色/暗色主题

```xml
<Application xmlns="https://github.com/avaloniaui">
    <Application.RequestedThemeVariant>Dark</Application.RequestedThemeVariant>
</Application>
```

### 在代码中切换

```csharp
// 切换到暗色主题
Avalonia.Application.Current!.RequestedThemeVariant = ThemeVariant.Dark;

// 切换到亮色主题
Avalonia.Application.Current!.RequestedThemeVariant = ThemeVariant.Light;

// 使用系统主题
Avalonia.Application.Current!.RequestedThemeVariant = ThemeVariant.Default;
```

---

## 实用示例

### 示例 1：按钮样式套件

```xml
<Window.Styles>
    <!-- 基础按钮 -->
    <Style Selector="Button">
        <Setter Property="Padding" Value="10,5"/>
        <Setter Property="CornerRadius" Value="4"/>
    </Style>
    
    <!-- 主要按钮 -->
    <Style Selector="Button.primary">
        <Setter Property="Background" Value="{StaticResource PrimaryBrush}"/>
        <Setter Property="Foreground" Value="White"/>
    </Style>
    
    <!-- 悬停效果 -->
    <Style Selector="Button.primary:pointerover">
        <Setter Property="Background" Value="{StaticResource PrimaryHoverBrush}"/>
    </Style>
    
    <!-- 按下效果 -->
    <Style Selector="Button.primary:pressed">
        <Setter Property="Background" Value="{StaticResource PrimaryPressedBrush}"/>
    </Style>
    
    <!-- 禁用状态 -->
    <Style Selector="Button.primary:disabled">
        <Setter Property="Opacity" Value="0.5"/>
    </Style>
</Window.Styles>

<!-- 使用 -->
<Button Classes="primary" Content="提交"/>
```

### 示例 2：文本样式

```xml
<Window.Styles>
    <!-- 标题 -->
    <Style Selector="TextBlock.h1">
        <Setter Property="FontSize" Value="24"/>
        <Setter Property="FontWeight" Value="Bold"/>
    </Style>
    
    <Style Selector="TextBlock.h2">
        <Setter Property="FontSize" Value="20"/>
        <Setter Property="FontWeight" Value="SemiBold"/>
    </Style>
    
    <Style Selector="TextBlock.h3">
        <Setter Property="FontSize" Value="16"/>
        <Setter Property="FontWeight" Value="SemiBold"/>
    </Style>
    
    <!-- 正文 -->
    <Style Selector="TextBlock.body">
        <Setter Property="FontSize" Value="14"/>
        <Setter Property="TextWrapping" Value="Wrap"/>
    </Style>
    
    <!-- 辅助文本 -->
    <Style Selector="TextBlock.caption">
        <Setter Property="FontSize" Value="12"/>
        <Setter Property="Foreground" Value="Gray"/>
    </Style>
</Window.Styles>
```

### 示例 3：卡片样式

```xml
<Style Selector="Border.card">
    <Setter Property="Background" Value="White"/>
    <Setter Property="CornerRadius" Value="8"/>
    <Setter Property="Padding" Value="16"/>
    <Setter Property="BoxShadow" Value="0 2 4 0 rgba(0,0,0,0.1)"/>
</Style>

<Style Selector="Border.card:pointerover">
    <Setter Property="BoxShadow" Value="0 4 8 0 rgba(0,0,0,0.15)"/>
</Style>

<!-- 使用 -->
<Border Classes="card" Margin="10">
    <TextBlock Text="卡片内容"/>
</Border>
```

---

## 样式优先级

### 优先级规则

| 优先级 | 来源 | 说明 |
|--------|------|------|
| 1 | 控件本地值 | 直接设置 |
| 2 | 本地样式 | x:Name 匹配 |
| 3 | 视觉树内最近的样式 | 向上搜索 |
| 4 | 视觉树内更远的样式 | 向上搜索 |
| 5 | 应用级样式 | App.axaml |

### 覆盖规则

```xml
<!-- 更具体的选择器优先 -->
<Style Selector="Button.primary">
    <!-- 后应用 -->
</Style>

<Style Selector="Button">
    <!-- 先应用 -->
</Style>
```

---

## 常见问题

### 1. 样式不生效

**检查项：**

- 选择器是否正确
- 样式是否在正确的位置
- 样式类是否正确设置

### 2. 伪类不工作

**检查项：**

- 选择器语法是否正确（`:pointerover` 而非 `.pointerover`）
- 伪类名称是否正确

### 3. 样式覆盖

**解决方式：**

```xml
<!-- 使用更高优先级的选择器 -->
<Style Selector="StackPanel > Button.primary">
    <!-- 覆盖父级样式 -->
</Style>
```

---

## 总结

### 样式系统组件

| 组件 | 用途 |
|------|------|
| `Style` | 样式定义容器 |
| `Setter` | 属性值设置 |
| `Selector` | 匹配控件 |
| `Resource` | 共享资源 |

### 样式选择器

| 选择器 | 语法 |
|--------|------|
| 类型 | `Button` |
| 类 | `.primary` |
| ID | `#button1` |
| 伪类 | `:pointerover` |
| 后代 | `StackPanel Button` |

### 主题

| 主题 | 特点 |
|------|------|
| Fluent | 现代 Windows 风格 |
| Material | Material Design 风格 |
| Simple | 简单跨平台风格 |

---

## 相关资源

- [Avalonia 样式文档](https://docs.avaloniaui.net/docs/styling/)
- [样式选择器语法](https://docs.avaloniaui.net/docs/styling/style-selector-syntax)
- [伪类](https://docs.avaloniaui.net/docs/styling/pseudoclasses)
- [主题](https://docs.avaloniaui.net/docs/styling/themes)
