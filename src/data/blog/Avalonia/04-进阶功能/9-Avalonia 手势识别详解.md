---
title: Avalonia 手势识别详解
author: Joekma
pubDatetime: 2026-05-06T00:00:00.000+08:00
modDatetime: 2026-05-06T00:00:00.000+08:00
slug: avalonia-gestures
description: '深入学习 Avalonia 手势识别系统，掌握内置手势事件、GestureRecognizers，以及 Pinch、Pull、Scroll 等手势识别器的使用方法。'
tags:
  - Avalonia
  - 手势识别
  - PinchGestureRecognizer
  - PullGestureRecognizer
  - ScrollGestureRecognizer
  - 触摸手势
  - 交互
draft: false
language: zh-CN
---

## 概述

Avalonia 使用统一的指针事件系统。鼠标、触摸和手写笔输入都通过相同的 `PointerPressed`、`PointerMoved` 和 `PointerReleased` 事件流动，而不是为每个设备提供单独的事件类型。指针事件告诉你硬件做了什么：按钮按下、手指移动。

手势是基于指针事件构建的高级抽象，代表用户意图：点击、双指缩放、滚动。

### 手势 vs 指针事件

| 层面 | 事件类型 | 说明 |
|------|----------|------|
| **底层** | 指针事件 | 硬件做了什么（按钮按下、手指移动） |
| **高层** | 手势事件 | 用户意图（点击、双指缩放） |

---

## 内置手势事件

Avalonia 提供两种内置手势事件：

| 事件 | 说明 |
|------|------|
| `Tapped` | 指针在控件上按下并释放 |
| `DoubleTapped` | 在平台的双击时间和距离阈值内，在同一位置进行了两次点击 |
| `Holding` | 指针被按下并保持不动。必须通过 `InputElement.IsHoldingEnabled` 为每个控件启用 |

### Tapped 事件

```xml
<Border Tapped="OnTapped" Background="LightGray">
    <TextBlock Text="点击我" />
</Border>
```

```csharp
private void OnTapped(object? sender, TappedEventArgs e)
{
    Debug.WriteLine("单击了!");
}
```

### DoubleTapped 事件

```xml
<Border DoubleTapped="OnDoubleTapped" Background="LightBlue">
    <TextBlock Text="双击我" />
</Border>
```

```csharp
private void OnDoubleTapped(object? sender, TappedEventArgs e)
{
    Debug.WriteLine("双击了!");
    e.Handled = true; // 阻止 Tapped 事件
}
```

### Holding 事件

Holding 手势必须为每个控件启用：

```xml
<Border InputElement.IsHoldingEnabled="True"
        Holding="OnHolding"
        Background="LightGreen">
    <TextBlock Text="长按我" />
</Border>
```

```csharp
private void OnHolding(object? sender, HoldingEventArgs e)
{
    switch (e.HoldingState)
    {
        case HoldingState.Started:
            Debug.WriteLine("长按开始");
            break;
        case HoldingState.Completed:
            Debug.WriteLine("长按完成");
            break;
        case HoldingState.Canceled:
            Debug.WriteLine("长按取消");
            break;
    }
}
```

### 鼠标长按支持

要允许鼠标指针（而不仅仅是触摸）触发长按，设置 `InputElement.IsHoldWithMouseEnabled`：

```xml
<Border InputElement.IsHoldingEnabled="True"
        InputElement.IsHoldWithMouseEnabled="True"
        Holding="OnHolding" />
```

---

## 手势识别器概述

手势识别器检测更复杂的多指针或方向模式。你将它们附加到控件的 `GestureRecognizers` 集合中，它们监视控件的指针事件以检测特定模式。

### 可用手势识别器

| 识别器 | 说明 | 用途 |
|--------|------|------|
| `PinchGestureRecognizer` | 两个指针相互靠近或远离 | 双指缩放 |
| `PullGestureRecognizer` | 从控件边缘沿特定方向拖动指针 | 下拉刷新 |
| `ScrollGestureRecognizer` | 拖动指针水平、垂直或双向滚动内容 | 滚动内容 |

---

## 添加手势识别器

### 在 XAML 中添加

```xml
<Image Stretch="UniformToFill" Name="image" Source="/image.jpg">
    <Image.GestureRecognizers>
        <PinchGestureRecognizer />
    </Image.GestureRecognizers>
</Image>
```

### 在代码中添加

```csharp
image.GestureRecognizers.Add(new PinchGestureRecognizer());
image.GestureRecognizers.Add(new PullGestureRecognizer());
image.GestureRecognizers.Add(new ScrollGestureRecognizer());
```

---

## PinchGestureRecognizer（双指缩放）

### 用途

双指缩放手势用于缩放图像、地图等内容。

### XAML 配置

```xml
<Border Background="DarkGray" ClipToBounds="True">
    <Image x:Name="ZoomImage" 
           Source="/image.jpg"
           Stretch="UniformToFill">
        <Image.GestureRecognizers>
            <PinchGestureRecognizer />
        </Image.GestureRecognizers>
    </Image>
</Border>
```

### 代码实现

```csharp
public partial class ZoomableImage : UserControl
{
    private double _scale = 1.0;
    private double _lastScale = 1.0;

    public ZoomableImage()
    {
        InitializeComponent();
        ZoomImage.GestureRecognizers.Add(new PinchGestureRecognizer());
        AddHandler(InputElement.PinchEvent, OnPinch);
        AddHandler(InputElement.PinchEndedEvent, OnPinchEnded);
    }

    private void OnPinch(object? sender, PinchEventArgs e)
    {
        _scale = _lastScale * e.Scale;
        ZoomImage.RenderTransform = new ScaleTransform(_scale, _scale);
    }

    private void OnPinchEnded(object? sender, PointerEventArgs e)
    {
        _lastScale = _scale;
    }
}
```

### PinchEventArgs 属性

| 属性 | 说明 |
|------|------|
| `Scale` | 当前缩放比例（相对于手势开始） |
| `PivotX` | 缩放支点 X 坐标 |
| `PivotY` | 缩放支点 Y 坐标 |

### 实用示例：带边界的缩放

```csharp
private const double MinScale = 0.5;
private const double MaxScale = 5.0;

private void OnPinch(object? sender, PinchEventArgs e)
{
    var newScale = _lastScale * e.Scale;
    newScale = Math.Max(MinScale, Math.Min(MaxScale, newScale));
    
    // 计算缩放中心
    var transform = ZoomImage.RenderTransform as TransformGroup;
    if (transform != null)
    {
        var scaleTransform = transform.Children.OfType<ScaleTransform>().First();
        scaleTransform.ScaleX = newScale;
        scaleTransform.ScaleY = newScale;
    }
}
```

---

## PullGestureRecognizer（下拉刷新）

### 用途

下拉刷新手势用于触发内容刷新操作。

### XAML 配置

```xml
<ScrollViewer>
    <ScrollViewer.GestureRecognizers>
        <PullGestureRecognizer PullDirection="Top" />
    </ScrollViewer.GestureRecognizers>
    
    <StackPanel Margin="20">
        <!-- 内容 -->
    </StackPanel>
</ScrollViewer>
```

### 代码实现

```csharp
public partial class RefreshableList : UserControl
{
    private bool _isRefreshing;

    public RefreshableList()
    {
        InitializeComponent();
        
        var pullRecognizer = new PullGestureRecognizer
        {
            PullDirection = PullDirection.Top
        };
        
        AddHandler(PullGestureRecognizer.PullStartedEvent, OnPullStarted);
        AddHandler(PullGestureRecognizer.PullDeltaEvent, OnPullDelta);
        AddHandler(PullGestureRecognizer.PullCompletedEvent, OnPullCompleted);
    }

    private void OnPullStarted(object? sender, PullEventArgs e)
    {
        Debug.WriteLine("下拉开始");
    }

    private void OnPullDelta(object? sender, PullEventArgs e)
    {
        // e.PullDistance 包含下拉距离
        // 可以用于显示刷新指示器
    }

    private void OnPullCompleted(object? sender, PullEventArgs e)
    {
        if (!_isRefreshing)
        {
            _isRefreshing = true;
            RefreshDataAsync();
        }
    }
}
```

### PullEventArgs 属性

| 属性 | 说明 |
|------|------|
| `PullDirection` | 下拉方向 |
| `PullDistance` | 当前下拉距离 |

### PullDirection 选项

| 值 | 说明 |
|---|------|
| `Top` | 从顶部下拉 |
| `Bottom` | 从底部上拉 |
| `Left` | 从左侧右拉 |
| `Right` | 从右侧左拉 |

---

## ScrollGestureRecognizer（滚动）

### 用途

滚动手势用于在内容区域内滚动。

### XAML 配置

```xml
<Border ClipToBounds="True" Width="300" Height="200">
    <Canvas Width="600" Height="400" Background="LightGray">
        <Canvas.GestureRecognizers>
            <ScrollGestureRecognizer 
                CanScrollHorizontally="True"
                CanScrollVertically="True" />
        </Canvas.GestureRecognizers>
        
        <!-- 大面积内容 -->
    </Canvas>
</Border>
```

### ScrollGestureRecognizer 属性

| 属性 | 类型 | 说明 |
|------|------|------|
| `CanScrollHorizontally` | `bool` | 是否允许水平滚动 |
| `CanScrollVertically` | `bool` | 是否允许垂直滚动 |
| `IsScrollInertiaEnabled` | `bool` | 是否启用滚动惯性 |

### 滚动事件处理

```csharp
private void OnScroll(object? sender, ScrollEventArgs e)
{
    // e.DeltaX - 水平滚动量
    // e.DeltaY - 垂直滚动量
    
    var offsetX = Canvas.GetLeft(contentElement);
    var offsetY = Canvas.GetTop(contentElement);
    
    Canvas.SetLeft(contentElement, offsetX - e.DeltaX);
    Canvas.SetTop(contentElement, offsetY - e.DeltaY);
}
```

---

## 订阅手势事件

### 使用 AddHandler

手势识别器事件是路由事件。使用 `AddHandler` 订阅：

```csharp
image.AddHandler(InputElement.PinchEvent, (sender, args) =>
{
    var scale = args.Scale;
    Debug.WriteLine($"缩放: {scale}");
});
```

### 标记事件为已处理

如果你的处理程序完全处理了手势，标记它为已处理以防止进一步冒泡：

```csharp
args.Handled = true;
```

### 移除处理程序

```csharp
private void Cleanup()
{
    RemoveHandler(InputElement.PinchEvent, OnPinch);
}
```

---

## 实用示例

### 示例 1：图片查看器

```xml
<UserControl>
    <Border ClipToBounds="True" Background="Black">
        <Panel>
            <Image x:Name="ImageView" Stretch="Uniform">
                <Image.GestureRecognizers>
                    <PinchGestureRecognizer />
                </Image.GestureRecognizers>
            </Image>
            
            <TextBlock Text="双指缩放 / 双击重置"
                       Foreground="White"
                       HorizontalAlignment="Center"
                       VerticalAlignment="Bottom"
                       Margin="10" />
        </Panel>
    </Border>
</UserControl>
```

```csharp
public partial class ImageViewer : UserControl
{
    private double _scale = 1.0;
    private double _offsetX = 0;
    private double _offsetY = 0;

    public ImageViewer()
    {
        InitializeComponent();
        AddHandler(InputElement.PinchEvent, OnPinch);
        AddHandler(InputElement.PinchEndedEvent, OnPinchEnded);
        ImageView.DoubleTapped += OnDoubleTapped;
    }

    private void OnPinch(object? sender, PinchEventArgs e)
    {
        _scale *= e.Scale;
        _scale = Math.Max(0.5, Math.Min(5.0, _scale));
        ApplyTransform();
    }

    private void OnPinchEnded(object? sender, PointerEventArgs e)
    {
        // 可选：保存缩放状态
    }

    private void OnDoubleTapped(object? sender, TappedEventArgs e)
    {
        _scale = 1.0;
        _offsetX = 0;
        _offsetY = 0;
        ApplyTransform();
    }

    private void ApplyTransform()
    {
        ImageView.RenderTransform = new TransformGroup
        {
            Children =
            {
                new ScaleTransform(_scale, _scale),
                new TranslateTransform(_offsetX, _offsetY)
            }
        };
    }
}
```

### 示例 2：下拉刷新列表

```xml
<UserControl>
    <DockPanel>
        <Border x:Name="RefreshIndicator"
                Height="50" 
                DockPanel.Dock="Top"
                Background="LightBlue"
                IsVisible="False">
            <TextBlock Text="正在刷新..." 
                       HorizontalAlignment="Center"
                       VerticalAlignment="Center" />
        </Border>
        
        <ScrollViewer>
            <ScrollViewer.GestureRecognizers>
                <PullGestureRecognizer PullDirection="Top" />
            </ScrollViewer.GestureRecognizers>
            <ItemsControl ItemsSource="{Binding Items}">
                <ItemsControl.ItemTemplate>
                    <DataTemplate>
                        <Border Padding="10" BorderThickness="0,0,0,1">
                            <TextBlock Text="{Binding}" />
                        </Border>
                    </DataTemplate>
                </ItemsControl.ItemTemplate>
            </ItemsControl>
        </ScrollViewer>
    </DockPanel>
</UserControl>
```

```csharp
public partial class PullRefreshList : UserControl
{
    public PullRefreshList()
    {
        InitializeComponent();
        AddHandler(PullGestureRecognizer.PullCompletedEvent, OnPullCompleted);
    }

    private async void OnPullCompleted(object? sender, PullEventArgs e)
    {
        RefreshIndicator.IsVisible = true;
        
        if (DataContext is PullRefreshViewModel vm)
        {
            await vm.RefreshAsync();
        }
        
        RefreshIndicator.IsVisible = false;
    }
}
```

### 示例 3：地图平移和缩放

```xml
<Border ClipToBounds="True">
    <Canvas x:Name="MapCanvas" Background="LightGray">
        <Canvas.GestureRecognizers>
            <PinchGestureRecognizer />
            <ScrollGestureRecognizer CanScrollHorizontally="True" CanScrollVertically="True" />
        </Canvas.GestureRecognizers>
        
        <!-- 地图内容 -->
        <Rectangle Fill="Green" Width="500" Height="500" />
    </Canvas>
</Border>
```

```csharp
public partial class MapView : UserControl
{
    private double _mapScale = 1.0;
    private double _panX = 0;
    private double _panY = 0;

    public MapView()
    {
        InitializeComponent();
        AddHandler(InputElement.PinchEvent, OnPinch);
        AddHandler(InputElement.ScrollEvent, OnScroll);
    }

    private void OnPinch(object? sender, PinchEventArgs e)
    {
        _mapScale *= e.Scale;
        _mapScale = Math.Max(0.5, Math.Min(3.0, _mapScale));
        UpdateMapTransform();
    }

    private void OnScroll(object? sender, ScrollEventArgs e)
    {
        _panX -= e.DeltaX;
        _panY -= e.DeltaY;
        UpdateMapTransform();
    }

    private void UpdateMapTransform()
    {
        MapCanvas.RenderTransform = new TransformGroup
        {
            Children =
            {
                new ScaleTransform(_mapScale, _mapScale),
                new TranslateTransform(_panX, _panY)
            }
        };
    }
}
```

---

## 手势识别器事件总结

### PinchGestureRecognizer

| 事件 | 说明 |
|------|------|
| `PinchEvent` | 双指缩放进行中 |
| `PinchEndedEvent` | 双指缩放结束 |

### PullGestureRecognizer

| 事件 | 说明 |
|------|------|
| `PullStartedEvent` | 开始下拉 |
| `PullDeltaEvent` | 下拉过程中 |
| `PullCompletedEvent` | 下拉完成 |

### ScrollGestureRecognizer

| 事件 | 说明 |
|------|------|
| `ScrollEvent` | 滚动进行中 |
| `ScrollStartedEvent` | 开始滚动 |
| `ScrollEndedEvent` | 滚动结束 |

---

## 常见问题

### 1. 手势不触发

**检查项：**

- 是否正确添加了 `GestureRecognizer`
- 控件是否有正确的事件处理程序
- 是否有 `ClipToBounds` 限制边界

### 2. 手势冲突

**解决方式：**

```csharp
// 在处理程序中标记为已处理
args.Handled = true;
```

### 3. 多手势同时识别

**支持情况：**

- Pinch 和 Scroll 可以同时识别
- Pull 单独识别
- 确保正确处理事件传播

### 4. 手势识别不准确

**调整方式：**

- 检查 `PullDirection` 设置
- 调整 `PullGestureRecognizer.Threshold`
- 确保控件有足够的空间进行手势

---

## 最佳实践

### 手势设计原则

| 原则 | 说明 |
|------|------|
| **直觉性** | 手势应该符合用户直觉 |
| **一致性** | 同类操作使用相同手势 |
| **可发现性** | 提供视觉提示引导用户 |
| **反馈性** | 操作时提供即时反馈 |

### 性能优化

| 技巧 | 说明 |
|------|------|
| **限制区域** | 使用 `ClipToBounds` 限制手势范围 |
| **批量更新** | 使用变换矩阵而非逐属性更新 |
| **节流处理** | 高频事件使用节流 |

### 无障碍考虑

| 考虑 | 说明 |
|------|------|
| **键盘替代** | 提供键盘操作替代手势 |
| **辅助技术** | 确保屏幕阅读器可访问 |
| **设置选项** | 可选地禁用或自定义手势 |

---

## 总结

### 内置手势 vs 手势识别器

| 类型 | 手势 | 用途 |
|------|------|------|
| **内置** | `Tapped` | 点击 |
| **内置** | `DoubleTapped` | 双击 |
| **内置** | `Holding` | 长按 |
| **识别器** | `PinchGestureRecognizer` | 双指缩放 |
| **识别器** | `PullGestureRecognizer` | 下拉刷新 |
| **识别器** | `ScrollGestureRecognizer` | 滚动 |

### 事件订阅模式

```csharp
// 添加识别器
control.GestureRecognizers.Add(new PinchGestureRecognizer());

// 订阅事件
control.AddHandler(InputElement.PinchEvent, OnPinch);

// 处理完成后标记
args.Handled = true;
```

### 使用场景

| 场景 | 推荐手势 |
|------|----------|
| **图片查看** | Pinch（缩放）+ Scroll（平移） |
| **列表刷新** | Pull（下拉） |
| **文档浏览** | Scroll（滚动） |
| **画布操作** | Pinch + Scroll + Drag |

---

## 相关资源

- [Avalonia 手势文档](https://docs.avaloniaui.net/docs/input-interaction/gestures)
- [指针事件](https://docs.avaloniaui.net/docs/input-interaction/pointer)
- [路由事件](https://docs.avaloniaui.net/docs/input-interaction/routed-events)
- [Pinch 手势](https://docs.avaloniaui.net/docs/input-interaction/gestures/pinch-gesture-recognizer)
- [Pull 手势](https://docs.avaloniaui.net/docs/input-interaction/gestures/pull-gesture-recognizer)
- [Scroll 手势](https://docs.avaloniaui.net/docs/input-interaction/gestures/scroll-gesture-recognizer)
