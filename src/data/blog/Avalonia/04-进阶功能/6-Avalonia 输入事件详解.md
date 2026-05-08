---
title: Avalonia 输入事件详解
author: Joekma
pubDatetime: 2026-05-06T00:00:00.000+08:00
modDatetime: 2026-05-06T00:00:00.000+08:00
slug: avalonia-input-events
description: '深入学习 Avalonia 输入事件系统，掌握指针事件、键盘事件和手势事件的处理，包括鼠标、触摸、笔输入的统一处理方式。'
tags:
  - Avalonia
  - 输入事件
  - 指针事件
  - 键盘事件
  - 手势事件
  - 交互
draft: false
language: zh-CN
---

## 概述

Avalonia 提供了全面的输入事件来处理指针（鼠标/触摸/笔）、键盘和手势交互。大多数输入事件使用组合的 `Tunnel | Bubble` 路由策略，允许父元素在输入到达目标之前进行拦截。

### 输入事件类型

| 类型 | 说明 | 路由策略 |
|------|------|----------|
| **指针事件** | 鼠标、触摸、笔输入的统一抽象 | Bubble |
| **键盘事件** | 按键按下和释放 | Bubble |
| **手势事件** | 点击、滑动等高级手势 | Bubble |

---

## 指针事件

指针事件将鼠标、触摸和笔输入抽象为统一模型。默认情况下，它们会向上冒泡到可视树。

### 指针事件列表

| 事件 | 触发时机 |
|------|----------|
| `PointerEntered` | 指针进入控件边界时 |
| `PointerExited` | 指针离开控件边界时 |
| `PointerMoved` | 指针在控件内移动时 |
| `PointerPressed` | 在控件上按下指针按钮时 |
| `PointerReleased` | 在控件上释放指针按钮时 |
| `PointerCaptureLost` | 控件失去指针捕获时 |
| `PointerWheelChanged` | 鼠标滚轮或触控板滚动时 |

### 处理指针事件

```csharp
protected override void OnPointerPressed(PointerPressedEventArgs e)
{
    base.OnPointerPressed(e);
    
    var point = e.GetPosition(this); // 相对于此控件的位置
    var properties = e.GetCurrentPoint(this).Properties;
    
    if (properties.IsLeftButtonPressed)
    {
        Debug.WriteLine($"在 ({point.X}, {point.Y}) 按下了左键");
    }
}
```

### PointerEventArgs 关键属性

| 属性/方法 | 说明 |
|-----------|------|
| `GetPosition(Visual)` | 返回相对于指定视觉元素的位置 |
| `GetCurrentPoint(Visual)` | 返回包含位置和按钮状态的 PointerPoint |
| `Pointer` | Pointer 实例，用于捕获操作 |
| `KeyModifiers` | 是否按下了 Shift、Control、Alt 或 Meta 键 |

### 指针捕获

当捕获指针时，所有后续指针事件都会定向到捕获的控件，直到释放捕获：

```csharp
protected override void OnPointerPressed(PointerPressedEventArgs e)
{
    base.OnPointerPressed(e);
    e.Pointer.Capture(this); // 开始捕获
}

protected override void OnPointerReleased(PointerReleasedEventArgs e)
{
    base.OnPointerReleased(e);
    e.Pointer.Capture(null); // 释放捕获
}
```

整个应用程序一次只能有一个元素持有指针捕获。这与操作系统行为匹配，其中单个物理鼠标设备只能有一个捕获的元素。当不同控件捕获指针（例如，在弹出窗口中）时，之前的捕获会被释放，原控件会收到 `PointerCaptureLost` 事件。

---

## 指针事件实用示例

### 示例 1：鼠标悬停效果

```xml
<Border x:Name="HoverBorder" 
        Background="Gray" 
        Width="100" 
        Height="100"
        PointerEntered="OnPointerEntered"
        PointerExited="OnPointerExited" />
```

```csharp
private void OnPointerEntered(object? sender, PointerEventArgs e)
{
    if (sender is Border border)
    {
        border.Background = Brushes.LightBlue;
    }
}

private void OnPointerExited(object? sender, PointerEventArgs e)
{
    if (sender is Border border)
    {
        border.Background = Brushes.Gray;
    }
}
```

### 示例 2：拖动检测

```csharp
private Point _pressPoint;
private bool _isDragging;

protected override void OnPointerPressed(PointerPressedEventArgs e)
{
    base.OnPointerPressed(e);
    _pressPoint = e.GetPosition(this);
    _isDragging = false;
    e.Pointer.Capture(this);
}

protected override void OnPointerMoved(PointerEventArgs e)
{
    base.OnPointerMoved(e);
    
    if (e.GetCurrentPoint(this).Properties.IsLeftButtonPressed)
    {
        var currentPoint = e.GetPosition(this);
        var delta = currentPoint - _pressPoint;
        
        // 超过阈值才认为是拖动
        if (!_isDragging && (Math.Abs(delta.X) > 5 || Math.Abs(delta.Y) > 5))
        {
            _isDragging = true;
        }
        
        if (_isDragging)
        {
            // 处理拖动逻辑 - 例如：移动元素
            Debug.WriteLine($"拖动到 ({currentPoint.X}, {currentPoint.Y})");
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

### 示例 3：鼠标滚轮缩放

```csharp
protected override void OnPointerWheelChanged(PointerWheelEventArgs e)
{
    base.OnPointerWheelChanged(e);
    
    // 获取缩放因子
    var delta = e.Delta;
    
    // 应用缩放
    ScaleTransform *= 1 + delta.Y * 0.1;
}
```

---

## 键盘事件

键盘事件在当前焦点元素上触发，并向上冒泡到树。

### 键盘事件列表

| 事件 | 触发时机 |
|------|----------|
| `KeyDown` | 按下按键时 |
| `KeyUp` | 释放按键时 |
| `TextInput` | 接收到字符输入时（在 IME 处理后） |

### 处理键盘事件

```csharp
protected override void OnKeyDown(KeyEventArgs e)
{
    base.OnKeyDown(e);
    
    if (e.Key == Key.Enter)
    {
        // 处理 Enter 键
        e.Handled = true;
    }
    
    if (e.Key == Key.C && e.KeyModifiers.HasFlag(KeyModifiers.Control))
    {
        // 处理 Ctrl+C 快捷键
        e.Handled = true;
    }
}
```

### KeyEventArgs 关键属性

| 属性 | 说明 |
|------|------|
| `Key` | 按下的物理键（来自 `Key` 枚举） |
| `KeyModifiers` | 按住的修饰键（Control、Shift、Alt、Meta） |
| `KeySymbol` | 按键产生的字符（如果有） |

### 键盘事件实用示例

#### 示例 1：快捷键处理

```csharp
public partial class MainWindow : Window
{
    public MainWindow()
    {
        InitializeComponent();
    }

    protected override void OnKeyDown(KeyEventArgs e)
    {
        base.OnKeyDown(e);
        
        // Ctrl+S 保存
        if (e.Key == Key.S && e.KeyModifiers.HasFlag(KeyModifiers.Control))
        {
            SaveDocument();
            e.Handled = true;
        }
        
        // Ctrl+Z 撤销
        if (e.Key == Key.Z && e.KeyModifiers.HasFlag(KeyModifiers.Control))
        {
            Undo();
            e.Handled = true;
        }
        
        // Escape 关闭
        if (e.Key == Key.Escape)
        {
            Close();
            e.Handled = true;
        }
    }
}
```

#### 示例 2：方向键导航

```csharp
private int _selectedIndex;

protected override void OnKeyDown(KeyEventArgs e)
{
    base.OnKeyDown(e);
    
    switch (e.Key)
    {
        case Key.Up:
            _selectedIndex = Math.Max(0, _selectedIndex - 1);
            UpdateSelection();
            e.Handled = true;
            break;
            
        case Key.Down:
            _selectedIndex = Math.Min(Items.Count - 1, _selectedIndex + 1);
            UpdateSelection();
            e.Handled = true;
            break;
    }
}

private void UpdateSelection()
{
    // 更新选中项
}
```

---

## 隧道（预览）事件

对于使用 `Tunnel | Bubble` 路由的输入事件，隧道阶段首先触发。你可以通过使用路由策略参数在隧道阶段拦截事件：

```csharp
myControl.AddHandler(InputElement.PointerPressedEvent, OnPreviewPointerPressed,
    RoutingStrategies.Tunnel);
```

```csharp
private void OnPreviewPointerPressed(object? sender, PointerPressedEventArgs e)
{
    // 这在冒泡阶段之前触发
    // 设置 e.Handled = true 可以阻止事件到达子元素
}
```

这对于在子控件处理之前在父级别拦截输入很有用。

---

## 手势事件

Avalonia 提供了基于原始指针事件构建的高级手势事件：

| 事件 | 触发时机 |
|------|----------|
| `Tapped` | 快速点击手势完成时 |
| `DoubleTapped` | 双击手势完成时 |
| `Holding` | 检测到长按手势时（触摸） |

手势事件会向上冒泡。对于更复杂的手势（捏合、拖动、滚动），请参阅手势文档。

### 手势事件示例

```xml
<Border Tapped="OnBorderTapped" 
        DoubleTapped="OnBorderDoubleTapped"
        Background="LightGray">
    <TextBlock Text="点击我" />
</Border>
```

```csharp
private void OnBorderTapped(object? sender, TappedEventArgs e)
{
    Debug.WriteLine("单次点击");
}

private void OnBorderDoubleTapped(object? sender, TappedEventArgs e)
{
    Debug.WriteLine("双击");
    e.Handled = true; // 阻止 Tapped 事件
}
```

### 手势与指针事件的关系

```
PointerPressed → ... → PointerReleased → Tapped
                  ↓
            DoubleTapped（快速第二次点击）
                  ↓
            Holding（长按检测）
```

---

## 常见输入模式

### 拖放检测模式

```csharp
private Point _startPoint;
private bool _isDragging;
private const double DragThreshold = 5;

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
        
        // 阈值检测
        if (!_isDragging && (Math.Abs(delta.X) > DragThreshold || Math.Abs(delta.Y) > DragThreshold))
        {
            _isDragging = true;
            OnDragStarted(delta);
        }
        
        if (_isDragging)
        {
            OnDragging(delta);
        }
    }
}

protected override void OnPointerReleased(PointerReleasedEventArgs e)
{
    base.OnPointerReleased(e);
    
    if (_isDragging)
    {
        OnDragEnded(e.GetPosition(this) - _startPoint);
    }
    
    _isDragging = false;
    e.Pointer.Capture(null);
}

protected virtual void OnDragStarted(Point delta) { }
protected virtual void OnDragging(Point delta) { }
protected virtual void OnDragEnded(Point totalDelta) { }
```

### 缩放和旋转

```csharp
private float _scale = 1.0f;
private float _rotation;

protected override void OnPointerWheelChanged(PointerWheelEventArgs e)
{
    base.OnPointerWheelChanged(e);
    
    // Ctrl + 滚轮：缩放
    if (e.KeyModifiers.HasFlag(KeyModifiers.Control))
    {
        _scale *= 1 + e.Delta.Y * 0.1;
        _scale = Math.Max(0.1f, Math.Min(10.0f, _scale));
        UpdateTransform();
        e.Handled = true;
    }
}

private void UpdateTransform()
{
    RenderTransform = new TransformGroup
    {
        Children =
        {
            new ScaleTransform(_scale, _scale),
            new RotateTransform(_rotation)
        }
    };
}
```

---

## Key 枚举常用值

| 类别 | 按键 |
|------|------|
| **字母键** | `Key.A` - `Key.Z` |
| **数字键** | `Key.D0` - `Key.D9` |
| **功能键** | `Key.F1` - `Key.F12` |
| **方向键** | `Key.Up`, `Key.Down`, `Key.Left`, `Key.Right` |
| **控制键** | `Key.Enter`, `Key.Escape`, `Key.Space`, `Key.Tab` |
| **修饰键** | `Key.LeftCtrl`, `Key.RightCtrl`, `Key.LeftShift`, `Key.RightAlt` |

---

## 事件优先级

当多个控件叠加时，事件的处理顺序：

```
1. Tunnel 阶段（从根到源）
   └─ Window → Panel → Border → Button

2. Direct 事件（仅在源元素）

3. Bubble 阶段（从源到根）
   └─ Button → Border → Panel → Window
```

---

## 常见问题

### 1. 触摸点击不触发

**检查项：**

- 是否使用了正确的事件（`Tapped` vs `PointerPressed`）
- 元素是否有正确的背景（某些控件需要）
- 是否阻止了事件冒泡

### 2. 快捷键不响应

**检查项：**

- 元素是否有键盘焦点
- 快捷键是否正确检查 `KeyModifiers`
- 事件是否被标记为已处理

### 3. 拖动不流畅

**检查项：**

- 是否正确使用指针捕获
- 是否在 `PointerReleased` 中释放捕获
- 阈值设置是否合理

### 4. 手势冲突

**解决方式：**

- 在 `DoubleTapped` 中设置 `e.Handled = true`
- 合理设置 `Holding` 事件的阈值

---

## 总结

| 事件类型 | 事件 | 用途 |
|---------|------|------|
| **指针** | `PointerEntered/Exited` | 悬停效果 |
| **指针** | `PointerMoved` | 鼠标跟踪 |
| **指针** | `PointerPressed/Released` | 点击检测、拖动 |
| **指针** | `PointerWheelChanged` | 滚轮缩放、滚动 |
| **键盘** | `KeyDown/Up` | 快捷键、导航 |
| **手势** | `Tapped` | 点击反馈 |
| **手势** | `DoubleTapped` | 快速操作 |
| **手势** | `Holding` | 长按操作 |

### 输入处理最佳实践

1. **统一输入处理**：使用指针事件处理鼠标和触摸
2. **正确捕获**：拖动时捕获指针，结束时释放
3. **标记处理**：已处理的事件设置 `e.Handled = true`
4. **键盘无障碍**：确保键盘导航正常工作
5. **手势协调**：处理手势事件之间的冲突

---

## 相关资源

- [Avalonia 输入事件文档](https://docs.avaloniaui.net/docs/events/input-events)
- [Avalonia 事件系统](https://docs.avaloniaui.net/docs/events/)
- [指针输入](https://docs.avaloniaui.net/docs/input-interaction/pointer)
- [键盘快捷键](https://docs.avaloniaui.net/docs/input-interaction/keyboard-and-hotkeys)
- [手势识别](https://docs.avaloniaui.net/docs/input-interaction/gestures)
- [焦点管理](https://docs.avaloniaui.net/docs/input-interaction/focus)
