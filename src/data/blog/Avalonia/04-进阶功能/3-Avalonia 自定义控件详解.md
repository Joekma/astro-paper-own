---
title: Avalonia 自定义控件详解
author: Joekma
pubDatetime: 2026-05-06T00:00:00.000+08:00
modDatetime: 2026-05-06T00:00:00.000+08:00
slug: avalonia-custom-controls
description: "深入学习 Avalonia 自定义控件开发，掌握控件模板、样式键、定义属性和附加属性，以及创建可复用控件的方法。"
tags:
  - Avalonia
  - 自定义控件
  - TemplatedControl
  - ControlTemplate
  - 控件模板
  - IStyleable
draft: false
series: Avalonia
seriesOrder: 12
language: zh-CN
---

## 概述

Avalonia 支持创建自定义控件来满足特定的 UI 需求。本文介绍如何创建可样式化、可重用的自定义控件。

### 自定义控件类型

| 类型                 | 基类               | 用途           |
| -------------------- | ------------------ | -------------- |
| **UserControl**      | `UserControl`      | 组合现有控件   |
| **TemplatedControl** | `TemplatedControl` | 可样式化的控件 |
| **Control**          | `Control`          | 完全自定义渲染 |

---

## UserControl（用户控件）

### 适用场景

- 组合多个现有控件
- 简单的 UI 模块
- 快速原型开发

### 创建 UserControl

```xml
<!-- MyUserControl.axaml -->
<UserControl xmlns="https://github.com/avaloniaui"
             xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
             x:Class="MyApp.Controls.MyUserControl">
    <Border Background="LightGray" Padding="10" CornerRadius="5">
        <StackPanel Spacing="5">
            <TextBlock Text="{Binding Title, RelativeSource={RelativeSource AncestorType=UserControl}}"/>
            <ContentPresenter Content="{Binding Content, RelativeSource={RelativeSource AncestorType=UserControl}}"/>
        </StackPanel>
    </Border>
</UserControl>
```

```csharp
// MyUserControl.axaml.cs
public partial class MyUserControl : UserControl
{
    public static readonly StyledProperty<string> TitleProperty =
        AvaloniaProperty.Register<MyUserControl, string>(nameof(Title));

    public string Title
    {
        get => GetValue(TitleProperty);
        set => SetValue(TitleProperty, value);
    }

    public MyUserControl()
    {
        InitializeComponent();
    }
}
```

### 使用 UserControl

```xml
<local:MyUserControl Title="卡片标题">
    <TextBlock Text="卡片内容"/>
</local:MyUserControl>
```

---

## TemplatedControl（模板控件）

### 适用场景

- 需要可自定义外观的控件
- 需要控件模板的主题支持
- 复杂交互控件

### 创建 TemplatedControl

```csharp
// RoundButton.cs
public class RoundButton : TemplatedControl
{
    public static readonly StyledProperty<IBrush?> BackgroundProperty =
        AvaloniaProperty.Register<RoundButton, IBrush?>(nameof(Background));

    public IBrush? Background
    {
        get => GetValue(BackgroundProperty);
        set => SetValue(BackgroundProperty, value);
    }

    public static readonly StyledProperty<string> TextProperty =
        AvaloniaProperty.Register<RoundButton, string>(nameof(Text), defaultValue: "Button");

    public string Text
    {
        get => GetValue(TextProperty);
        set => SetValue(TextProperty, value);
    }

    protected override void OnApplyTemplate(TemplateSize callback)
    {
        base.OnApplyTemplate(callback);
        // 获取模板中的部件
    }
}
```

### 定义控件模板

```xml
<!-- Themes/Default/RoundButton.xaml -->
<Style Selector="TemplatedControl.RoundButton">
    <Setter Property="Template">
        <ControlTemplate>
            <Border x:Name="PART_Border"
                    Background="{TemplateBinding Background}"
                    CornerRadius="20"
                    Padding="15,8">
                <TextBlock Text="{TemplateBinding Text}"
                           HorizontalAlignment="Center"
                           VerticalAlignment="Center"/>
            </Border>
        </ControlTemplate>
    </Setter>
</Style>
```

### 使用 PART\_ 前缀

Avalonia 使用 `PART_` 前缀标记模板部件：

| 前缀    | 说明                           |
| ------- | ------------------------------ |
| `PART_` | 控件模板中必需或可选的命名元素 |

```xml
<ControlTemplate>
    <Border x:Name="PART_Background"><!-- 控件会查找此元素 --></Border>
    <TextBlock x:Name="PART_Content"/><!-- 控件会查找此元素 -->
</ControlTemplate>
```

---

## 定义控件属性

### StyledProperty

```csharp
public class MyControl : TemplatedControl
{
    public static readonly StyledProperty<double> ValueProperty =
        AvaloniaProperty.Register<MyControl, double>(
            nameof(Value),
            defaultValue: 0.0,
            coerce: (control, value) => Math.Max(0, Math.Min(100, value)));

    public double Value
    {
        get => GetValue(ValueProperty);
        set => SetValue(ValueProperty, value);
    }
}
```

### DirectProperty

```csharp
public static readonly DirectProperty<MyControl, bool> IsActiveProperty =
    AvaloniaProperty.RegisterDirect<MyControl, bool>(
        nameof(IsActive),
        o => o._isActive,
        (o, v) => o.SetAndRaise(IsActiveProperty, ref o._isActive, v));

private bool _isActive;
public bool IsActive => _isActive;
```

### AttachedProperty

```csharp
public class MyPanel : Panel
{
    public static readonly AttachedProperty<int> RowProperty =
        AvaloniaProperty.RegisterAttached<MyPanel, Control, int>("Row", defaultValue: 0);

    public static int GetRow(Control element) => element.GetValue(RowProperty);
    public static void SetRow(Control element, int value) => element.SetValue(RowProperty, value);
}
```

---

## 控件模板（ControlTemplate）

### 基本结构

```xml
<ControlTemplate x:Key="{x:Type local:MyControl}">
    <Border x:Name="PART_Root"
            Background="{TemplateBinding Background}"
            BorderBrush="{TemplateBinding BorderBrush}"
            BorderThickness="{TemplateBinding BorderThickness}">
        <ContentPresenter Content="{TemplateBinding Content}"/>
    </Border>
</ControlTemplate>
```

### TemplateBinding

```xml
<ControlTemplate TargetType="local:MyControl">
    <Border Background="{TemplateBinding Background}"
            Padding="{TemplateBinding Padding}">
        <TextBlock Text="{TemplateBinding Text}"/>
    </Border>
</ControlTemplate>
```

### 伪状态

```xml
<Style Selector="TemplatedControl.MyControl:pointerover">
    <Setter Property="Background" Value="LightBlue"/>
</Style>

<Style Selector="TemplatedControl.MyControl:pressed">
    <Setter Property="Background" Value="DarkBlue"/>
</Style>

<Style Selector="TemplatedControl.MyControl:disabled">
    <Setter Property="Opacity" Value="0.5"/>
</Style>
```

---

## IStyleable 接口

### 实现 IStyleable

```csharp
public class MyControl : Control, IStyleable
{
    Type IStyleable.StyleKey => typeof(MyControl);

    // 控件逻辑...
}
```

### StyleKeyOverride

如果希望控件使用基类的样式：

```csharp
public class MyButton : Button
{
    protected override Type StyleKeyOverride => typeof(Button);
}
```

---

## 控件生命周期

### 生命周期方法

| 方法                       | 调用时机       |
| -------------------------- | -------------- |
| `OnApplyTemplate`          | 控件模板应用时 |
| `OnAttachedToVisualTree`   | 附加到可视树时 |
| `OnDetachedFromVisualTree` | 从可视树分离时 |
| `OnPropertyChanged`        | 属性变化时     |

### 示例

```csharp
public class MyControl : TemplatedControl
{
    protected override void OnApplyTemplate(TemplateSize callback)
    {
        // 先调用基类方法，确保模板已正确加载
        base.OnApplyTemplate(callback);
        // callback 包含应用模板后控件的测量大小（Width、Height）
        // 可以通过 this.FindControl<T>("PART_Name") 查找模板中的命名元素
        _border = this.GetControl<Border>("PART_Background");
    }

    protected override void OnAttachedToVisualTree(VisualTreeAttachmentEventArgs e)
    {
        base.OnAttachedToVisualTree(e);
        // 开始动画或订阅事件
    }

    protected override void OnDetachedFromVisualTree(VisualTreeAttachmentEventArgs e)
    {
        base.OnDetachedFromVisualTree(e);
        // 清理资源
    }

    protected override void OnPropertyChanged(AvaloniaPropertyChangedEventArgs change)
    {
        base.OnPropertyChanged(change);
        if (change.Property == ValueProperty)
        {
            UpdateVisual();
        }
    }
}
```

---

## 实用示例

### 示例 1：星级评分控件

```csharp
public class StarRating : TemplatedControl
{
    public static readonly StyledProperty<int> RatingProperty =
        AvaloniaProperty.Register<StarRating, int>(nameof(Rating), defaultValue: 0);

    public int Rating
    {
        get => GetValue(RatingProperty);
        set => SetValue(RatingProperty, value);
    }

    public static readonly StyledProperty<int> MaxRatingProperty =
        AvaloniaProperty.Register<StarRating, int>(nameof(MaxRating), defaultValue: 5);

    public int MaxRating
    {
        get => GetValue(MaxRatingProperty);
        set => SetValue(MaxRatingProperty, value);
    }
}
```

```xml
<ControlTemplate TargetType="local:StarRating">
    <StackPanel Orientation="Horizontal" Spacing="5">
        <Panel>
            <Border Background="Gray" Width="30" Height="30"/>
            <Border Background="{TemplateBinding Background}" Width="30" Height="30"/>
        </Panel>
        <!-- 更多星... -->
    </StackPanel>
</ControlTemplate>
```

### 示例 2：可折叠面板

```csharp
public class ExpanderPanel : TemplatedControl
{
    public static readonly StyledProperty<bool> IsExpandedProperty =
        AvaloniaProperty.Register<ExpanderPanel, bool>(nameof(IsExpanded), defaultValue: true);

    public bool IsExpanded
    {
        get => GetValue(IsExpandedProperty);
        set => SetValue(IsExpandedProperty, value);
    }

    public static readonly StyledProperty<object> HeaderProperty =
        AvaloniaProperty.Register<ExpanderPanel, object>(nameof(Header));

    public object Header
    {
        get => GetValue(HeaderProperty);
        set => SetValue(HeaderProperty, value);
    }
}
```

### 示例 3：圆形头像

```csharp
public class CircleAvatar : TemplatedControl
{
    public static readonly StyledProperty<IBitmap?> SourceProperty =
        AvaloniaProperty.Register<CircleAvatar, IBitmap?>(nameof(Source));

    public IBitmap? Source
    {
        get => GetValue(SourceProperty);
        set => SetValue(SourceProperty, value);
    }
}
```

---

## 常见问题

### 1. 模板不应用

**检查项：**

- 是否正确设置 StyleKey
- 样式是否在正确的位置
- 选择器是否正确

### 2. PART 元素找不到

**检查项：**

- 元素名称是否使用 `x:Name`
- 元素是否在 ControlTemplate 内
- 模板是否正确应用

### 3. 属性变化不更新 UI

**解决方式：**

```csharp
protected override void OnPropertyChanged(AvaloniaPropertyChangedEventArgs change)
{
    // 先调用基类，确保属性变更通知正常传播
    base.OnPropertyChanged(change);
    // change.Property：变化的属性
    // change.GetNewValue<T>()：获取新值
    if (change.Property == ValueProperty)
    {
        UpdateVisual();
    }
}
```

---

## 总结

### 控件类型选择

| 场景         | 推荐类型         |
| ------------ | ---------------- |
| 简单组合     | UserControl      |
| 可样式化控件 | TemplatedControl |
| 自定义渲染   | Control          |

### 关键步骤

| 步骤 | 操作                 |
| ---- | -------------------- |
| 1    | 定义 StyledProperty  |
| 2    | 创建控件模板         |
| 3    | 实现 OnApplyTemplate |
| 4    | 添加样式             |
| 5    | 处理伪状态           |

### 模板部件约定

| 约定                | 说明     |
| ------------------- | -------- |
| `PART_Name`         | 命名元素 |
| `{TemplateBinding}` | 模板绑定 |
| `x:Name`            | 元素命名 |

---

## 相关资源

- [Avalonia 自定义控件文档](https://docs.avaloniaui.net/docs/custom-controls/)
- [控件模板](https://docs.avaloniaui.net/docs/templates/)
- [样式最佳实践](https://docs.avaloniaui.net/docs/styling/style-best-practices)
