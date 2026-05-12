---
title: Avalonia 事件系统详解
author: Joekma
pubDatetime: 2026-05-06T00:00:00.000+08:00
modDatetime: 2026-05-06T00:00:00.000+08:00
slug: avalonia-events-overview
description: "深入学习 Avalonia 路由事件系统，掌握事件路由策略、事件处理、事件标记，以及自定义路由事件的创建方法。"
tags:
  - Avalonia
  - 事件系统
  - 路由事件
  - UI 框架
  - 事件处理
draft: false
series: Avalonia
language: zh-CN
---

## 概述

Avalonia 使用与 WPF 类似的路由事件（Routed Event）系统。路由事件可以穿过元素树，允许父元素处理由子元素引发的事件。这是 Avalonia 中输入、交互和控件行为工作的基础。

### 路由事件的核心价值

| 价值         | 说明                               |
| ------------ | ---------------------------------- |
| **事件冒泡** | 子元素的事件可以向上传播到父元素   |
| **事件隧道** | 父元素可以先于子元素拦截事件       |
| **集中处理** | 在父元素中统一处理子元素的事件     |
| **解耦设计** | 子元素触发事件，父元素决定如何响应 |

---

## 事件路由策略

每个路由事件都有一种路由策略，决定事件如何穿过元素树：

| 策略       | 方向   | 说明                                                                          |
| ---------- | ------ | ----------------------------------------------------------------------------- |
| **Bubble** | 子到父 | 事件首先在源元素上触发，然后向上传播到根元素。这是最常见的策略。              |
| **Tunnel** | 父到子 | 事件首先在根元素上触发，然后向下传播到源元素。隧道事件通常用于预览/拦截场景。 |
| **Direct** | 仅源   | 事件仅在源元素上触发，不穿过元素树。                                          |

事件可以组合策略。例如，许多输入事件使用 `Tunnel | Bubble`，这意味着事件首先从根向下隧道传播，然后在源处向上冒泡。

### Bubble（冒泡）示例

当用户在窗口内的 StackPanel 中的 Button 上点击时：

```
Window ← 事件最后到达这里（冒泡）

 └─ StackPanel ← 事件第二到达这里

 └─ Button ← 事件从这里开始（源）
```

### Tunnel（隧道）示例

对于相同的树结构，隧道事件：

```
Window ← 事件首先从这里开始（隧道）

 └─ StackPanel ← 事件第二到达这里

 └─ Button ← 事件最后到达这里（源）
```

---

## 处理路由事件

### 在 XAML 中处理

使用事件名称作为属性附加事件处理器：

```xml
<Button Click="OnButtonClick" Content="点击我" />
```

```csharp
private void OnButtonClick(object? sender, RoutedEventArgs e)
{
    // sender：附加事件处理器的元素（本例中为 Button 本身）
    // e.Source：实际引发事件的原始元素（在事件冒泡/隧道中可能与 sender 不同）
}
```

### 在代码中处理

使用 `AddHandler` 和 `RemoveHandler`：

```csharp
myButton.AddHandler(Button.ClickEvent, OnButtonClick);

// 稍后，取消订阅：
myButton.RemoveHandler(Button.ClickEvent, OnButtonClick);
```

### 在父元素上处理冒泡事件

由于事件会向上冒泡，你可以在父元素上处理子元素的事件：

```xml
<StackPanel Tapped="OnStackPanelTapped">
    <Button Content="按钮 1" />
    <Button Content="按钮 2" />
    <Button Content="按钮 3" />
</StackPanel>
```

```csharp
private void OnStackPanelTapped(object? sender, TappedEventArgs e)
{
    // sender 是 StackPanel（处理器附加的位置）
    // e.Source 是被点击的特定 Button
    if (e.Source is Button button)
    {
        Debug.WriteLine($"点击了: {button.Content}");
    }
}
```

---

## 标记事件为已处理

将 `e.Handled = true` 设置为停止事件继续路由：

```csharp
private void OnButtonClick(object? sender, RoutedEventArgs e)
{
    e.Handled = true; // 阻止父处理器接收此事件
}
```

如果你需要接收已标记为已处理的事件，请使用 `handledEventsToo` 参数：

```csharp
// AddHandler 的 handledEventsToo 参数设为 true 时，即使事件被标记为 Handled=true，仍会收到通知
myPanel.AddHandler(Button.ClickEvent, OnButtonClick, RoutingStrategies.Bubble, handledEventsToo: true);
```

---

## RoutedEventArgs 属性

| 属性            | 类型                | 说明                                             |
| --------------- | ------------------- | ------------------------------------------------ |
| **Source**      | `object?`           | 最初引发事件的元素。                             |
| **Handled**     | `bool`              | 事件是否已被处理。设置为 `true` 可停止路由。     |
| **Route**       | `RoutingStrategies` | 当前路由阶段（`Tunnel`、`Bubble` 或 `Direct`）。 |
| **RoutedEvent** | `RoutedEvent`       | 正在引发的路由事件。                             |

---

## 注册自定义路由事件

在控件中定义自定义路由事件：

```csharp
public class MyControl : Control
{
    public static readonly RoutedEvent<RoutedEventArgs> ValueChangedEvent =
        RoutedEvent.Register<MyControl, RoutedEventArgs>(
            nameof(ValueChanged),
            RoutingStrategies.Bubble);

    public event EventHandler<RoutedEventArgs>? ValueChanged
    {
        add => AddHandler(ValueChangedEvent, value);
        remove => RemoveHandler(ValueChangedEvent, value);
    }

    protected virtual void OnValueChanged()
    {
        RaiseEvent(new RoutedEventArgs(ValueChangedEvent));
    }
}
```

### 自定义事件参数

对于携带额外数据的事件，创建自定义 `RoutedEventArgs` 子类：

```csharp
public class ValueChangedEventArgs : RoutedEventArgs
{
    public ValueChangedEventArgs(RoutedEvent routedEvent, double oldValue, double newValue)
        : base(routedEvent)
    {
        OldValue = oldValue;
        NewValue = newValue;
    }

    public double OldValue { get; }
    public double NewValue { get; }
}
```

---

## 类处理器

类处理器允许你响应类型所有实例的事件，通常在静态构造函数中注册。类处理器在实例处理器之前运行。

```csharp
public class MyControl : Control
{
    static MyControl()
    {
        PointerPressedEvent.AddClassHandler<MyControl>((control, args) =>
        {
            control.OnPointerPressedInternal(args);
        });
    }

    private void OnPointerPressedInternal(PointerPressedEventArgs args)
    {
        // 为 MyControl 的所有实例处理
    }
}
```

类处理器对于需要拦截输入事件的控件实现很有用，这些事件在任何实例级处理器将其标记为已处理之前执行。

---

## 事件使用场景

### 场景 1：按钮点击处理

```xml
<StackPanel>
    <Button x:Name="SubmitButton" Content="提交" />
</StackPanel>
```

```csharp
public partial class MainWindow : Window
{
    public MainWindow()
    {
        InitializeComponent();
    }

    private void OnSubmitButtonClick(object? sender, RoutedEventArgs e)
    {
        Debug.WriteLine("按钮被点击了");
    }
}
```

### 场景 2：全局键盘监听

```csharp
public partial class MainWindow : Window
{
    protected override void OnKeyDown(KeyEventArgs e)
    {
        base.OnKeyDown(e);

        if (e.Key == Key.Escape)
        {
            Close();
            e.Handled = true;
        }
    }
}
```

### 场景 3：拖放检测

```csharp
private Point _startPoint;
private bool _isDragging;

protected override void OnPointerPressed(PointerPressedEventArgs e)
{
    base.OnPointerPressed(e);
    _startPoint = e.GetPosition(this);
    _isDragging = false;
    e.Pointer.Capture(this);
}

protected override void OnPointerMoved(PointerEventArgs e)
{
    base.OnPointerMoved(e);

    if (e.GetCurrentPoint(this).Properties.IsLeftButtonPressed)
    {
        var currentPoint = e.GetPosition(this);
        var delta = currentPoint - _startPoint;

        if (!_isDragging && (Math.Abs(delta.X) > 5 || Math.Abs(delta.Y) > 5))
        {
            _isDragging = true;
        }

        if (_isDragging)
        {
            // 处理拖动逻辑
        }
    }
}

protected override void OnPointerReleased(PointerReleasedEventArgs e)
{
    base.OnPointerReleased(e);
    _isDragging = false;
    e.Pointer.Capture(null);
}
```

---

## 事件命名约定

Avalonia 中的事件遵循统一的命名约定：

| 事件类型     | 命名模式     | 示例                          |
| ------------ | ------------ | ----------------------------- |
| 用户操作事件 | `Xxxed`      | Clicked, Tapped, Pressed      |
| 状态变化事件 | `XxxChanged` | Loaded, Unloaded, GotFocus    |
| 输入相关事件 | `XxxEvent`   | KeyDown, PointerMoved         |
| 手势事件     | `Xxxed`      | Tapped, DoubleTapped, Holding |

---

## 常见问题

### 1. 事件不触发

**检查项：**

- 事件处理器是否正确附加
- 绑定路径是否正确（对于 AttachedProperty）
- 元素是否在可视树中

### 2. 事件被吞没

**检查项：**

- 子元素是否将 `e.Handled = true`
- 使用 `handledEventsToo: true` 参数接收已处理的事件

### 3. 事件顺序混乱

**理解路由策略：**

- Tunnel 事件先于 Bubble 事件
- 类处理器先于实例处理器
- 按从根到源的顺序处理 Tunnel 事件

---

## 总结

| 策略       | 方向    | 用途           |
| ---------- | ------- | -------------- |
| **Bubble** | 子 → 父 | 大多数交互事件 |
| **Tunnel** | 父 → 子 | 预览/拦截场景  |
| **Direct** | 仅源    | 局部事件       |

### 核心要点

1. **事件冒泡**：事件从子元素向上传播到父元素
2. **事件隧道**：父元素可以先于子元素拦截事件
3. **标记处理**：使用 `e.Handled = true` 停止事件传播
4. **接收已处理事件**：使用 `handledEventsToo: true`
5. **自定义事件**：通过 `RoutedEvent.Register` 创建

---

## 相关资源

- [Avalonia 事件文档](https://docs.avaloniaui.net/docs/events/)
- [输入事件](https://docs.avaloniaui.net/docs/events/input-events)
- [生命周期事件](https://docs.avaloniaui.net/docs/events/lifecycle-events)
- [添加交互性](https://docs.avaloniaui.net/docs/input-interaction/adding-interactivity)
