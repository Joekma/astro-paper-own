---
title: Avalonia 生命周期事件详解
author: Joekma
pubDatetime: 2026-05-06T00:00:00.000+08:00
modDatetime: 2026-05-06T00:00:00.000+08:00
slug: avalonia-lifecycle-events
description: "深入学习 Avalonia 生命周期事件，掌握控件创建、加载、卸载的过程，以及如何正确初始化控件和清理资源。"
tags:
  - Avalonia
  - 生命周期事件
  - 控件初始化
  - 加载事件
  - 卸载事件
  - DataContext
draft: false
series: Avalonia
seriesOrder: 13
language: zh-CN
---

## 概述

Avalonia 控件在创建、附加到可视树和移除的过程中会引发多个事件。理解这些事件的顺序和用途对于初始化控件、加载数据和清理资源至关重要。

### 生命周期事件的作用

| 阶段       | 说明                     |
| ---------- | ------------------------ |
| **初始化** | 设置 XAML 中定义的属性值 |
| **附加**   | 将控件添加到可视树       |
| **加载**   | 控件完全准备好交互       |
| **卸载**   | 从可视树移除控件         |

---

## 生命周期事件顺序

### 控件创建并添加到可视树

当控件被创建并添加到可视树时，事件按以下顺序触发：

| 顺序 | 事件/方法              | 定义类          | 说明                                             |
| ---- | ---------------------- | --------------- | ------------------------------------------------ |
| 1    | `Initialized`          | `StyledElement` | 所有 XAML 属性值已设置，控件尚未附加到可视树     |
| 2    | `AttachedToVisualTree` | `Visual`        | 控件已添加到根可视树，布局尚未发生               |
| 3    | `Loaded`               | `Control`       | 控件完全附加并准备好交互，在可视树附加完成后触发 |

### 控件从可视树移除

当控件被移除时：

| 顺序 | 事件/方法                | 定义类    | 说明                 |
| ---- | ------------------------ | --------- | -------------------- |
| 1    | `Unloaded`               | `Control` | 控件即将从可视树移除 |
| 2    | `DetachedFromVisualTree` | `Visual`  | 控件已从可视树移除   |

### 事件流程图

```
创建阶段
┌─────────────┐
│  构造函数   │
└──────┬──────┘
       ▼
┌─────────────┐
│ Initialized │  ← XAML 属性已设置
└──────┬──────┘
       ▼
┌─────────────────────┐
│ AttachedToVisualTree │  ← 进入可视树
└──────┬──────────────┘
       ▼
┌─────────────┐
│   Loaded    │  ← 完全可用
└─────────────┘

卸载阶段
┌─────────────┐
│  Unloaded   │  ← 即将移除
└──────┬──────┘
       ▼
┌─────────────────────┐
│DetachedFromVisualTree│  ← 已移除
└─────────────────────┘
```

---

## Initialized 事件

### 事件说明

`Initialized` 事件在 XAML 加载器完成设置标记中定义的所有属性后触发。此时，控件的属性值已设置，但控件可能尚未成为可视树的一部分。

### 使用方法

#### 重写方法

```csharp
public class MyControl : Control
{
    protected override void OnInitialized()
    {
        base.OnInitialized();

        // XAML 中的属性已设置
        // 可访问控件的属性值
        // 但可视树可能还不可用
    }
}
```

#### 外部订阅

```csharp
myControl.Initialized += (sender, e) =>
{
    // 控件已初始化
    var control = (Control)sender!;

    // 可以安全地访问属性
    Debug.WriteLine($"控件已初始化: {control.GetHashCode()}");
};
```

### 适用场景

- 设置依赖 XAML 属性值的内部状态
- 不需要可视树的初始化逻辑
- 配置数据验证规则
- 初始化内部数据结构

### 注意事项

- 此时 `DataContext` 可能尚未设置（如果通过绑定设置）
- 无法访问父元素或尺寸信息
- 不要在此处启动需要可视树的动画

---

## AttachedToVisualTree / DetachedFromVisualTree

### 事件说明

这些事件在控件添加到或从根可视树（以 `TopLevel` 为根的树）移除时触发。

### 使用方法

```csharp
public class MyControl : Control
{
    protected override void OnAttachedToVisualTree(VisualTreeAttachmentEventArgs e)
    {
        base.OnAttachedToVisualTree(e);

        // e.RootVisual 是可视树的根
        // 可以订阅外部服务、定时器等
    }

    protected override void OnDetachedFromVisualTree(VisualTreeAttachmentEventArgs e)
    {
        base.OnDetachedFromVisualTree(e);

        // 清理外部订阅、定时器等
    }
}
```

### VisualTreeAttachmentEventArgs 属性

| 属性                 | 类型                  | 说明                             |
| -------------------- | --------------------- | -------------------------------- |
| `RootVisual`         | `Visual`              | 控件附加到的可视树的根           |
| `AttachmentPoint`    | `Visual`              | 控件直接附加到或分离自的视觉元素 |
| `PresentationSource` | `IPresentationSource` | 托管可视树的呈现源               |

### 适用场景

- 订阅或取消订阅外部服务
- 注册平台 API 事件
- 启动/停止需要可视树存在的定时器
- 获取根窗口引用
- 设置全屏模式
- 访问系统级资源

### 实用示例

#### 访问根窗口

```csharp
protected override void OnAttachedToVisualTree(VisualTreeAttachmentEventArgs e)
{
    base.OnAttachedToVisualTree(e);

    // 获取顶级窗口
    var window = e.RootVisual as Window;
    if (window != null)
    {
        Debug.WriteLine($"附加到窗口: {window.Title}");
    }
}
```

#### 订阅系统事件

```csharp
public class ScreenCaptureControl : Control
{
    private IDisposable? _screenSubscription;

    protected override void OnAttachedToVisualTree(VisualTreeAttachmentEventArgs e)
    {
        base.OnAttachedToVisualTree(e);

        // 开始监听屏幕变化
        _screenSubscription = ScreenService.WatchScreenChanges()
            .Subscribe(OnScreenChanged);
    }

    protected override void OnDetachedFromVisualTree(VisualTreeAttachmentEventArgs e)
    {
        _screenSubscription?.Dispose();
        _screenSubscription = null;

        base.OnDetachedFromVisualTree(e);
    }

    private void OnScreenChanged(ScreenChangeInfo info)
    {
        // 处理屏幕变化
    }
}
```

---

## Loaded / Unloaded 事件

### 事件说明

`Loaded` 事件在控件附加到可视树且所有相关初始化完成后触发。`Unloaded` 事件在控件被移除时触发。

### 使用方法

#### 重写方法

```csharp
public class MyControl : Control
{
    protected override void OnLoaded(RoutedEventArgs e)
    {
        base.OnLoaded(e);

        // 控件已完全就绪
        // 布局已完成，绑定生效
    }

    protected override void OnUnloaded(RoutedEventArgs e)
    {
        base.OnUnloaded(e);

        // 清理资源
    }
}
```

#### 外部订阅

```csharp
myControl.Loaded += (sender, e) =>
{
    // 控件已加载并准备好
};

myControl.Unloaded += (sender, e) =>
{
    // 控件已卸载
};
```

### 适用场景

- 执行需要完整可视树的控件操作
- 启动动画
- 测量布局
- 获取数据
- 设置焦点

### Loaded 与 AttachedToVisualTree 的区别

两个事件都表示控件已是可视树的一部分。关键区别：

| 特性     | `AttachedToVisualTree` | `Loaded`           |
| -------- | ---------------------- | ------------------ |
| 触发时机 | 控件进入树时立即触发   | 附加完全完成后触发 |
| 事件类型 | 普通 CLR 事件          | `RoutedEvent`      |
| 适用对象 | `Visual`               | `Control`          |
| 布局状态 | 可能尚未完成           | 已完成             |

**推荐**：大多数场景下使用 `Loaded`。仅在需要 `Root` 引用或处理非 `Control` 视觉元素时使用 `AttachedToVisualTree`。

---

## DataContextChanged 事件

### 事件说明

`DataContextChanged` 事件在 `StyledElement` 的 `DataContext` 属性更改时触发：

```csharp
myControl.DataContextChanged += (sender, e) =>
{
    var newContext = ((Control)sender!).DataContext;

    // 响应新的数据上下文
};
```

### 触发时机

此事件在以下情况下触发：

- 直接在控件上设置 `DataContext`
- 由于父元素的 `DataContext` 更改，导致继承的 `DataContext` 更改
- 控件移动到具有不同继承 `DataContext` 的可视树不同部分

### 实用示例

#### ViewModel 初始化

```csharp
public partial class UserListView : UserControl
{
    public UserListView()
    {
        InitializeComponent();
    }

    protected override void OnDataContextChanged(EventArgs e)
    {
        base.OnDataContextChanged(e);

        if (DataContext is UserListViewModel vm)
        {
            // ViewModel 已设置，可以安全地访问
            Debug.WriteLine($"ViewModel 已加载: {vm.GetType().Name}");
        }
    }
}
```

---

## 典型初始化模式

### 模式 1：在视图中加载数据

```csharp
public partial class CustomerView : UserControl
{
    public CustomerView()
    {
        InitializeComponent();
    }

    protected override void OnLoaded(RoutedEventArgs e)
    {
        base.OnLoaded(e);

        // 确保 ViewModel 已设置
        if (DataContext is CustomerViewModel vm)
        {
            // 加载客户数据
            vm.LoadCustomersCommand.Execute(null);
        }
    }
}
```

### 模式 2：管理订阅

```csharp
public class StatusMonitor : Control
{
    private IDisposable? _subscription;

    protected override void OnAttachedToVisualTree(VisualTreeAttachmentEventArgs e)
    {
        base.OnAttachedToVisualTree(e);

        // 开始订阅状态变化
        _subscription = StatusService.StatusChanged
            .Subscribe(OnStatusChanged);
    }

    protected override void OnDetachedFromVisualTree(VisualTreeAttachmentEventArgs e)
    {
        // 必须清理订阅，防止内存泄漏
        _subscription?.Dispose();
        _subscription = null;

        base.OnDetachedFromVisualTree(e);
    }

    private void OnStatusChanged(string status)
    {
        // 更新控件显示
    }
}
```

### 模式 3：动画控制

```csharp
public class AnimatedPanel : StackPanel
{
    private bool _hasAnimated;

    protected override void OnLoaded(RoutedEventArgs e)
    {
        base.OnLoaded(e);

        if (!_hasAnimated)
        {
            // 启动入场动画
            StartEnterAnimation();
            _hasAnimated = true;
        }
    }

    protected override void OnUnloaded(RoutedEventArgs e)
    {
        // 停止动画
        StopAnimation();

        base.OnUnloaded(e);
    }

    private void StartEnterAnimation() { /* 动画逻辑 */ }
    private void StopAnimation() { /* 停止逻辑 */ }
}
```

### 模式 4：资源获取

```csharp
public class DeviceInfoControl : TextBlock
{
    protected override void OnAttachedToVisualTree(VisualTreeAttachmentEventArgs e)
    {
        base.OnAttachedToVisualTree(e);

        // 获取设备信息
        var screen = this.GetVisualRoot() as Window;
        if (screen != null)
        {
            Text = $"屏幕尺寸: {screen.Bounds.Width}x{screen.Bounds.Height}";
        }
    }
}
```

---

## 事件参数详解

### VisualTreeAttachmentEventArgs

```csharp
public class VisualTreeAttachmentEventArgs : RoutedEventArgs
{
    // 可视树的根元素
    public Visual RootVisual { get; }

    // 控件直接附加到的元素
    public Visual AttachmentPoint { get; }

    // 托管可视树的呈现源
    public IPresentationSource PresentationSource { get; }
}
```

### RoutedEventArgs

```csharp
public class RoutedEventArgs : EventArgs
{
    // 事件的原始源
    public object? Source { get; set; }

    // 事件是否已处理
    public bool Handled { get; set; }

    // 当前路由策略
    public RoutingStrategies Route { get; }

    // 路由事件本身
    public RoutedEvent RoutedEvent { get; }
}
```

---

## 常见问题

### 1. 事件不触发

**检查项：**

- 控件是否正确附加到可视树
- 是否使用了正确的事件类型
- 事件处理器是否正确附加

### 2. 资源清理时机

**最佳实践：**

- 订阅在 `AttachedToVisualTree` 中建立
- 取消订阅在 `DetachedFromVisualTree` 中执行
- 使用 `try-finally` 确保清理

### 3. 循环引用

**避免方式：**

```csharp
// 错误示例
_subscription = observable.Subscribe(obj => UpdateUI(obj));

// 正确示例 - 取消订阅引用
_subscription = observable.Subscribe(this.UpdateUI);
```

### 4. 多次初始化

**解决方式：**

```csharp
private bool _isInitialized;

protected override void OnLoaded(RoutedEventArgs e)
{
    base.OnLoaded(e);

    if (!_isInitialized)
    {
        // 初始化逻辑
        _isInitialized = true;
    }
}
```

---

## 生命周期与 MVVM

### ViewModel 初始化

```
┌─────────────────────────────────────┐
│  UserControl 创建                   │
└─────────────────┬───────────────────┘
                  ▼
┌─────────────────────────────────────┐
│  DataContext 绑定（来自父元素）       │
└─────────────────┬───────────────────┘
                  ▼
┌─────────────────────────────────────┐
│  Initialized 事件                   │
│  （属性已设置，可能没有 DataContext）│
└─────────────────┬───────────────────┘
                  ▼
┌─────────────────────────────────────┐
│  DataContextChanged 事件            │
│  （DataContext 生效）                │
└─────────────────┬───────────────────┘
                  ▼
┌─────────────────────────────────────┐
│  AttachedToVisualTree 事件           │
│  （进入可视树）                     │
└─────────────────┬───────────────────┘
                  ▼
┌─────────────────────────────────────┐
│  Loaded 事件                        │
│  （完全就绪，可以操作 UI）            │
└─────────────────────────────────────┘
```

### 初始化顺序建议

| 阶段                     | 操作                         |
| ------------------------ | ---------------------------- |
| **构造函数**             | 设置默认属性，创建子控件     |
| **Initialized**          | 配置验证规则，初始化数据结构 |
| **OnDataContextChanged** | 订阅 ViewModel 命令          |
| **Loaded**               | 启动数据加载，执行 UI 操作   |

---

## 总结

| 事件                       | 定义类        | 触发时机           | 用途               |
| -------------------------- | ------------- | ------------------ | ------------------ |
| **Initialized**            | StyledElement | XAML 属性设置后    | 配置依赖属性的状态 |
| **DataContextChanged**     | StyledElement | DataContext 更改时 | 响应数据变化       |
| **AttachedToVisualTree**   | Visual        | 进入可视树时       | 订阅外部资源       |
| **Loaded**                 | Control       | 完全加载后         | 执行 UI 操作       |
| **Unloaded**               | Control       | 即将卸载时         | 清理资源           |
| **DetachedFromVisualTree** | Visual        | 离开可视树后       | 最终清理           |

### 生命周期管理最佳实践

1. **资源管理**：在 `AttachedToVisualTree` 中订阅，在 `DetachedFromVisualTree` 中取消订阅
2. **UI 操作**：在 `Loaded` 中执行，不在 `AttachedToVisualTree` 中执行
3. **数据加载**：在 `Loaded` 中触发，ViewModel 准备就绪
4. **清理资源**：使用 `using` 或 `IDisposable` 确保资源释放
5. **避免重复**：使用标志位防止多次初始化

---

## 相关资源

- [Avalonia 事件概览](https://docs.avaloniaui.net/docs/events/)
- [Avalonia 输入事件](https://docs.avaloniaui.net/docs/events/input-events)
- [应用程序生命周期](https://docs.avaloniaui.net/docs/fundamentals/application-lifetimes)
- [UI 组合](https://docs.avaloniaui.net/docs/fundamentals/ui-composition)
