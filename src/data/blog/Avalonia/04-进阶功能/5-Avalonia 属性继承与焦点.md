---
title: Avalonia 属性继承与焦点
author: Joekma
pubDatetime: 2026-05-06T00:00:00.000+08:00
modDatetime: 2026-05-06T00:00:00.000+08:00
slug: avalonia-property-inheritance-focus
description: '深入学习 Avalonia 属性继承机制和焦点系统，掌握如何在父子元素间共享属性值，以及键盘焦点管理、Tab 导航和方向键导航的实现方法。'
tags:
  - Avalonia
  - 属性继承
  - 焦点系统
  - Focus
  - Tab 导航
  - DataContext
  - UI 框架
draft: false
series: Avalonia
language: zh-CN
---

## 概述

本文介绍 Avalonia 的两个重要概念：属性继承和焦点系统。

### 属性继承

属性继承允许在父元素上设置属性值时，自动传播到可视树中的所有子元素，无需每个子元素显式设置值。这常用于 `FontSize`、`FontFamily`、`Foreground` 等属性。

### 焦点系统

焦点是指预期接收键盘输入的 `InputElement`。理解焦点如何工作，有助于构建可访问的、支持键盘操作的应用程序。

---

## 属性继承详解

### 属性继承的工作原理

当注册 Avalonia 属性时设置 `inherits: true`，属性系统会在当前元素没有本地值、样式值或动画值时，检查可视树中的祖先元素。第一个具有该属性值的祖先提供继承值。

继承值的优先级在属性值优先级系统中是最低的（仅次于 `Unset`）。子元素上的本地值、样式或动画总是覆盖继承值。

### 内置继承属性

Avalonia 中有几个常用属性注册为继承属性：

| 属性 | 定义类 | 作用 |
|------|--------|------|
| `FontFamily` | `TextElement` | 文本控件从父元素继承字体 |
| `FontSize` | `TextElement` | 文本控件从父元素继承字号 |
| `FontStyle` | `TextElement` | 文本控件继承字体样式（斜体、正体） |
| `FontWeight` | `TextElement` | 文本控件继承字重（粗体、常规） |
| `Foreground` | `TextElement` | 文本控件继承前景色 |
| `LetterSpacing` | `TextElement` | 文本控件继承字符间距 |
| `FlowDirection` | `Visual` | 控件继承从左到右或从右到左的布局方向 |
| `DataContext` | `StyledElement` | 控件从父元素继承数据上下文 |
| `RequestedThemeVariant` | `ThemeVariantScope` | 控件继承请求的主题变体（亮/暗） |

### 继承示例

在父元素上设置 `FontSize`，该值会应用到所有未设置自己 `FontSize` 的子文本控件：

```xml
<StackPanel FontSize="18">
    <!-- 继承 FontSize="18" -->
    <TextBlock Text="大号文本" />
    
    <!-- 使用自己的 FontSize -->
    <TextBlock Text="小号文本" FontSize="12" />
    
    <!-- 继承 FontSize="18" -->
    <Button Content="大号按钮文本" />
</StackPanel>
```

### 继承值优先级

在属性值优先级系统中，继承值的优先级最低：

| 优先级 | 值来源 |
|--------|--------|
| 1 | 动画 |
| 2 | 本地值 |
| 3 | 样式（Setter） |
| 4 | 继承的值 |
| 5 | 默认值 |

---

## 创建自定义继承属性

### 注册继承属性

要创建自定义继承属性，在注册时设置 `inherits: true`：

```csharp
public class MyControl : Control
{
    public static readonly StyledProperty<bool> IsCompactProperty =
        AvaloniaProperty.Register<MyControl, bool>(
            nameof(IsCompact),
            defaultValue: false,
            inherits: true);

    public bool IsCompact
    {
        get => GetValue(IsCompactProperty);
        set => SetValue(IsCompactProperty, value);
    }
}
```

现在 `MyControl` 的任何后代都可以读取 `IsCompact` 值。

### 扩展继承属性到其他控件类型

对于不同类型的子控件读取继承属性，需要注册所有权：

```csharp
public class MyChildControl : Control
{
    public static readonly StyledProperty<bool> IsCompactProperty =
        MyControl.IsCompactProperty.AddOwner<MyChildControl>();

    public bool IsCompact
    {
        get => GetValue(IsCompactProperty);
        set => SetValue(IsCompactProperty, value);
    }
}
```

---

## DataContext 继承

`DataContext` 是最重要的继承属性之一。当你在 `Window` 上设置 `DataContext` 时，窗口内的所有控件都会继承它：

```csharp
public partial class MainWindow : Window
{
    public MainWindow()
    {
        InitializeComponent();
        DataContext = new MainWindowViewModel();
    }
}
```

```xml
<!-- 窗口内的所有控件都继承 DataContext -->
<Window>
    <StackPanel>
        <!-- 绑定到 MainWindowViewModel.Name -->
        <TextBlock Text="{Binding Name}" />
        
        <!-- 绑定到 MainWindowViewModel.Email -->
        <TextBox Text="{Binding Email}" />
    </StackPanel>
</Window>
```

### DataContext 继承规则

```
根窗口
├── DataContext = MainWindowViewModel
└── StackPanel
    ├── DataContext 继承自窗口
    └── TextBlock
        └── DataContext 继承自窗口
```

---

## 焦点系统详解

### 什么是焦点

焦点是指预期接收键盘输入的 `InputElement`。带焦点的控件通常有视觉指示器标识。最常见的例子是 `TextBox` 内闪烁的光标，但非文本控件如 `Button` 和 `Slider` 也参与焦点管理。

### 焦点相关属性

| 属性 | 类型 | 说明 |
|------|------|------|
| `IsFocused` | `bool`（只读） | 元素是否持有焦点 |
| `Focusable` | `bool` | 是否可以接收焦点 |
| `IsTabStop` | `bool` | 是否参与 Tab 导航 |
| `TabIndex` | `int` | Tab 导航顺序 |

### IsFocused 和 Focusable

`IsFocused` 是只读属性，跟踪 `InputElement` 当前是否持有焦点。

`Focusable` 属性启用或禁用聚焦 `InputElement` 的能力。不能聚焦的元素仍然可以通过指针交互，所以应该确保提供可访问的键盘替代方案（如快捷键）。

```xml
<!-- 阻止按钮接收键盘焦点 -->
<Button Content="只能点击" Focusable="False" />
```

---

## 显式聚焦

### 使用 Focus() 方法

要显式将焦点分配给任何 `InputElement`，从代码中调用其 `Focus()` 方法：

```csharp
// 视图加载时聚焦控件
myTextBox.Focus(NavigationMethod.Unspecified, KeyModifiers.None);
```

### NavigationMethod 参数

| 值 | 说明 |
|---|------|
| `Tab` | Tab 键按下 |
| `Pointer` | 指针交互 |
| `Directional` | 2D 方向导航 |
| `Unspecified` | 默认 |

### 常用场景

#### 表单自动聚焦

```csharp
public partial class LoginWindow : Window
{
    public LoginWindow()
    {
        InitializeComponent();
        Loaded += OnLoaded;
    }

    private void OnLoaded(object? sender, RoutedEventArgs e)
    {
        // 窗口打开时自动聚焦用户名输入框
        UsernameTextBox.Focus();
    }
}
```

#### Tab 跳转下一个输入框

```csharp
private void OnPasswordKeyDown(KeyEventArgs e)
{
    if (e.Key == Key.Enter)
    {
        // 按 Enter 键跳转到提交按钮
        SubmitButton.Focus(NavigationMethod.Directional, KeyModifiers.None);
        e.Handled = true;
    }
}
```

---

## 焦点事件

### GotFocus 和 LostFocus

`InputElement` 提供 `GotFocus` 和 `LostFocus` 事件。`GotFocusEventArgs` 包含触发焦点变更的 `NavigationMethod` 和 `KeyModifiers`。

```csharp
myTextBox.GotFocus += (sender, e) =>
{
    if (e.NavigationMethod == NavigationMethod.Tab)
    {
        // 用户 Tab 到此字段时全选文本
        myTextBox.SelectAll();
    }
};

myTextBox.LostFocus += (sender, e) =>
{
    Debug.WriteLine("文本框失去焦点");
};
```

### 焦点事件实用示例

#### 自动全选文本

```csharp
public partial class NumericInput : TextBox
{
    public NumericInput()
    {
        GotFocus += OnGotFocus;
    }

    private void OnGotFocus(object? sender, RoutedEventArgs e)
    {
        SelectAll();
    }
}
```

#### 焦点变化时更新状态

```csharp
private void OnGotFocus(object? sender, RoutedEventArgs e)
{
    if (sender is TextBox textBox)
    {
        Debug.WriteLine($"编辑中: {textBox.Name}");
    }
}
```

---

## 焦点伪类

使用这些伪类来样式化可聚焦的控件：

| 伪类 | 说明 |
|------|------|
| `:focus` | 控件有焦点 |
| `:focus-within` | 控件有焦点或其后代有焦点 |
| `:focus-visible` | 控件有焦点且应该显示视觉指示器 |

### 样式示例

```css
/* 默认焦点样式 */
TextBox:focus {
    border: 2px solid Blue;
}

/* 有焦点或其子元素有焦点时的容器样式 */
StackPanel:focus-within {
    background: LightYellow;
}

/* 只在可见焦点时显示指示器 */
Button:focus-visible {
    outline: 2px solid Orange;
}
```

### 设置焦点装饰器

`FocusAdorner` 属性在带有 `:focus-visible` 的控件周围显示默认焦点视觉（通常是 `Border`）。当使用 `:focus-visible` 显示自定义视觉指示器时，将 `FocusAdorner` 设置为 `null` 以避免重复指示器。

---

## FocusManager

`FocusManager` 提供全局访问焦点功能，如获取当前聚焦元素或清除焦点：

```csharp
// 获取当前聚焦的元素
var focused = FocusManager.Instance?.GetFocusedElement();

// 清除当前元素的焦点
FocusManager.Instance?.ClearFocus();
```

### FocusManager 常用操作

| 操作 | 说明 |
|------|------|
| `GetFocusedElement()` | 获取当前聚焦元素 |
| `GetFocusedElement(scope)` | 获取特定范围内的聚焦元素 |
| `ClearFocus()` | 清除焦点 |
| `SetFocusedElement(element)` | 设置焦点到指定元素 |

---

## Tab 焦点导航

### Tab 导航基础

Tab 焦点导航在你按 Tab 键时发生。任何 `IsTabStop` 属性设置为 `true` 的 `InputElement` 都参与 Tab 导航。

`TabIndex` 属性指定优先级，数值越低越先被导航。当多个控件的 `TabIndex` 相同时，优先级基于可视树遍历顺序。

### TabIndex 示例

```xml
<!-- 按 TabIndex 顺序导航 -->
<StackPanel>
    <TextBox TabIndex="2" Watermark="第二个字段" />
    <TextBox TabIndex="0" Watermark="第一个字段" />
    <TextBox TabIndex="1" Watermark="第三个字段" />
    <TextBox TabIndex="1" Watermark="也是第三个" />
</StackPanel>
<!-- Tab 顺序: 第一个 → 第三个 → 也是第三个 → 第二个 -->
```

### KeyboardNavigationMode

`KeyboardNavigation.TabNavigation` 附加属性在作为容器的任何 `InputElement` 上设置 `KeyboardNavigationMode`，修改 Tab 导航如何遍历其子元素。

```xml
<!-- 在 StackPanel 内循环 Tab 焦点 -->
<StackPanel KeyboardNavigation.TabNavigation="Cycle">
    <TextBox TabIndex="0" Watermark="第一个字段" />
    <TextBox TabIndex="1" Watermark="第二个字段" />
    <TextBox TabIndex="2" Watermark="第三个字段" />
</StackPanel>
```

### KeyboardNavigationMode 模式

| 值 | 容器项遍历方式 |
|---|----------------|
| `Continue` | 继续到下一个容器 |
| `Cycle` | 在自身项内循环并回绕 |
| `Contained` | 在开始或结束项处停止 |
| `Once` | 容器和子项作为一组只接收一次焦点 |
| `None` | 项不会被 Tab 导航聚焦 |
| `Local` | 只考虑本地子树的 `TabIndex` |

---

## 方向键焦点导航

### XYFocus 概述

焦点导航通过 `XYFocus` 是一种 2D 方向方案，支持从焦点控件向另一个控件进行空间导航：左、右、上或下。

默认情况下，`XYFocus.NavigationModes` 设置为允许 `Gamepad` 和 `Remote` 导航。

### 导航设备类型

| 值 | 设备 |
|---|------|
| `Disabled` | 任何键设备的 XY 导航都被禁用 |
| `Keyboard` | 键盘方向键可用 |
| `Gamepad` | 游戏手柄 DPad 可用 |
| `Remote` | 遥控器可用 |
| `Enabled` | 所有设备都可用 |

### 导航策略

当启用 2D 方向导航时，使用消歧策略选择导航目标：

| 策略 | 导航目标 |
|------|----------|
| `Auto` | 从祖先继承策略；若无祖先指定则使用 `Projection` |
| `Projection` | 在导航方向投影直线时遇到的第一个元素 |
| `NavigationDirectionDistance` | 导航直线轴上最近的元素 |
| `RectilinearDistance` | 基于最短曼哈顿距离最近的元素 |

### 显式导航

`XYFocus` 允许每个控件在按下方向键时通过 `XYFocus.Up`、`XYFocus.Down`、`XYFocus.Left` 和 `XYFocus.Right` 指定显式导航目标。这优先于任何导航策略。

### 方向导航示例

```xml
<Window
    XYFocus.NavigationModes="Enabled"
    XYFocus.UpNavigationStrategy="Projection"
    XYFocus.DownNavigationStrategy="Projection"
    XYFocus.LeftNavigationStrategy="Projection"
    XYFocus.RightNavigationStrategy="Projection">

    <Grid>
        <WrapPanel>
            <Button x:Name="first"
                Content="第一个"
                XYFocus.Left="{Binding #last}" />
            <Button Content="第二个" />
            <Button Content="第三个" />
            <Slider Width="100" Maximum="100" />
            <Button Content="第四个" />
            <Button x:Name="last"
                Content="最后一个"
                XYFocus.Right="{Binding #first}" />
        </WrapPanel>
    </Grid>
</Window>
```

### 导航边界环绕

```xml
<StackPanel>
    <Button x:Name="topLeft" Content="左上"
            XYFocus.Right="{Binding #topRight}"
            XYFocus.Down="{Binding #bottomLeft}" />
            
    <Button x:Name="topRight" Content="右上"
            XYFocus.Left="{Binding #topLeft}"
            XYFocus.Down="{Binding #bottomRight}" />
            
    <Button x:Name="bottomLeft" Content="左下"
            XYFocus.Up="{Binding #topLeft}"
            XYFocus.Right="{Binding #bottomRight}" />
            
    <Button x:Name="bottomRight" Content="右下"
            XYFocus.Left="{Binding #bottomLeft}"
            XYFocus.Up="{Binding #topRight}" />
</StackPanel>
```

---

## 常见问题

### 1. 焦点样式不显示

**检查项：**

- 是否使用了正确的伪类（`:focus` vs `:focus-visible`）
- 样式选择器优先级是否正确
- `FocusAdorner` 是否被覆盖

**解决方式：**

```css
Button:focus-visible {
    outline: 2px solid Orange;
}

Button:focus-visible:focus-visible {
    /* 确保 FocusAdorner 为 null */
}
```

### 2. Tab 导航顺序错误

**检查项：**

- `IsTabStop` 是否为 `true`
- `TabIndex` 设置是否正确
- 可视树顺序是否符合预期

### 3. 焦点跳转到错误控件

**检查项：**

- 是否有隐藏或不可见的元素
- 是否有焦点被意外设置

### 4. 键盘导航不工作

**检查项：**

- 控件是否设置了 `Focusable="True"`
- 是否有 `XYFocus` 显式导航配置
- `XYFocus.NavigationModes` 是否启用

---

## 最佳实践

### 焦点管理

| 场景 | 建议 |
|------|------|
| **表单加载** | 自动聚焦第一个输入框 |
| **输入完成** | Tab 到下一个输入框 |
| **提交后** | 聚焦提交按钮 |
| **错误恢复** | 聚焦错误输入框 |

### Tab 导航

| 场景 | 设置 |
|------|------|
| **常规表单** | 默认 TabIndex，按可视树顺序 |
| **单选组** | 循环导航 |
| **对话框** | 焦点限制在对话框内 |
| **跳过控件** | `IsTabStop="False"` |

### 样式实践

| 场景 | 伪类 |
|------|------|
| **始终显示** | `:focus` |
| **仅键盘显示** | `:focus-visible` |
| **容器聚焦** | `:focus-within` |

---

## 总结

### 属性继承

| 属性 | 继承来源 |
|------|----------|
| `FontSize/FontFamily` | TextElement 父元素 |
| `Foreground` | TextElement 父元素 |
| `DataContext` | StyledElement 父元素 |
| `FlowDirection` | Visual 父元素 |

### 焦点系统

| 事件/属性 | 用途 |
|-----------|------|
| `GotFocus/LostFocus` | 焦点变化通知 |
| `:focus` | 焦点伪类 |
| `:focus-visible` | 可见焦点伪类 |
| `Focus()` | 显式聚焦 |
| `FocusManager` | 全局焦点管理 |

### 导航模式

| 导航方式 | 触发 |
|---------|------|
| `Tab` | Tab 键 |
| `Pointer` | 鼠标点击 |
| `Directional` | 方向键 |

---

## 相关资源

- [Avalonia 属性继承文档](https://docs.avaloniaui.net/docs/properties/property-value-inheritance)
- [Avalonia 焦点文档](https://docs.avaloniaui.net/docs/input-interaction/focus)
- [FocusManager](https://docs.avaloniaui.net/docs/services/focus-manager)
- [指针设备](https://docs.avaloniaui.net/docs/input-interaction/pointer)
- [键盘和快捷键](https://docs.avaloniaui.net/docs/input-interaction/keyboard-and-hotkeys)
- [路由事件](https://docs.avaloniaui.net/docs/input-interaction/routed-events)
