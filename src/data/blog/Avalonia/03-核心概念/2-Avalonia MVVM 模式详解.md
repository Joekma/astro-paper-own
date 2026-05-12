---
title: Avalonia MVVM 模式详解
author: Joekma
pubDatetime: 2026-05-06T00:00:00.000+08:00
modDatetime: 2026-05-06T00:00:00.000+08:00
slug: avalonia-mvvm-pattern
description: "深入学习 Avalonia MVVM 模式，掌握 View、ViewModel、Model 的职责分离，数据绑定连接，以及 CommunityToolkit.Mvvm 的使用方法。"
tags:
  - Avalonia
  - MVVM
  - ViewModel
  - ObservableObject
  - RelayCommand
  - 架构
  - 设计模式
draft: false
series: Avalonia
language: zh-CN
---

## 概述

Model-View-ViewModel（MVVM）模式将应用程序的用户界面与其逻辑分离。MVVM 不是将显示代码和行为混合在同一代码文件中，而是将它们分成三个独立的部分，通过数据绑定进行通信。

### MVVM 的核心价值

| 价值              | 说明                                                |
| ----------------- | --------------------------------------------------- |
| **测试性**        | ViewModel 可以像普通类一样进行单元测试，无需启动 UI |
| **分离关注点**    | UI 布局和应用程序逻辑独立演进                       |
| **XAML 天然契合** | Avalonia 的数据绑定系统使 MVVM 成为自然选择         |
| **可替换性**      | 每层都可以独立替换                                  |

---

## MVVM 三层架构

### 架构图

```
┌─────────────────────────────────────────────────────────┐
│                    View（视图层）                         │
│  • XAML 文件 + 代码隐藏                                  │
│  • 最小化代码逻辑                                        │
│  • 通过绑定获取数据                                      │
└───────────────────────┬─────────────────────────────────┘
                        │ 数据绑定
                        ▼
┌─────────────────────────────────────────────────────────┐
│                 ViewModel（视图模型层）                  │
│  • 视图和模型之间的中介                                   │
│  • 暴露数据和命令                                        │
│  • 处理用户交互逻辑                                      │
│  • 引发 PropertyChanged 事件                             │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│                    Model（模型层）                       │
│  • 应用程序的领域层                                     │
│  • 数据访问、业务逻辑、验证                               │
│  • 仓储、服务客户端、DTO                                 │
└─────────────────────────────────────────────────────────┘
```

### 各层职责

| 层            | 职责             | 技术实现           |
| ------------- | ---------------- | ------------------ |
| **View**      | 结构、布局、外观 | XAML + code-behind |
| **ViewModel** | 中介逻辑         | C# POCO + 属性通知 |
| **Model**     | 领域逻辑         | C# 类、服务        |

### 单向依赖链

```
View → ViewModel → Model
```

- View 知道 ViewModel（View 设置 DataContext）
- ViewModel 知道 Model（ViewModel 引用 Model/Service）
- Model 不知道 ViewModel（Model 完全独立）
- ViewModel 不知道 View（ViewModel 通过数据绑定更新 UI，不直接引用 View）

---

## 为什么使用 MVVM

### 与代码后置的对比

当应用程序增长时，将 UI 定义和应用程序逻辑放在相同的代码后置文件中会导致问题：

| 问题         | 代码后置           | MVVM          |
| ------------ | ------------------ | ------------- |
| **控件交互** | 纠缠在一起         | 通过绑定解耦  |
| **单元测试** | 困难，需要 UI 平台 | 简单，无需 UI |
| **代码耦合** | UI 和逻辑混合      | 分离良好      |

### MVVM 解决的问题

1. **可测试性**：ViewModel 可以独立于 UI 进行测试
2. **可维护性**：UI 和逻辑独立演进
3. **团队协作**：设计师和开发者可以并行工作
4. **可扩展性**：易于添加新功能

---

## 何时使用 MVVM

### 代码后置适合的场景

- 小型、简单的应用程序
- 快速原型开发
- 一次性脚本

### MVVM 适合的场景

- 中大型应用程序
- 需要单元测试的项目
- 团队协作项目
- 需要长期维护的项目

### 策略建议

1. 从代码后置开始，如果应用程序变得难以维护再转换为 MVVM
2. 如果预期应用程序会增长，从一开始就使用 MVVM

---

## View 层详解

### View 的组成

View 由 AXAML 文件和代码后置组成：

```xml
<!-- MainWindow.axaml -->
<Window xmlns="https://github.com/avaloniaui"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        x:Class="MyApp.Views.MainWindow"
        Title="MVVM 示例">

    <StackPanel>
        <TextBlock Text="{Binding Message}" />
        <Button Content="点击" Command="{Binding ClickCommand}" />
    </StackPanel>
</Window>
```

```csharp
// MainWindow.axaml.cs
public partial class MainWindow : Window
{
    public MainWindow()
    {
        InitializeComponent();
    }
}
```

### View 最佳实践

- View 应该很少或没有逻辑
- 使用数据绑定连接到 ViewModel
- 避免在 View 中直接操作 Model
- Code-behind 只用于 UI 相关操作

---

## ViewModel 层详解

### 使用 CommunityToolkit.Mvvm

推荐使用 CommunityToolkit.Mvvm 包：

```csharp
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;

public partial class MainViewModel : ObservableObject
{
    [ObservableProperty]
    private string _message = "Hello, MVVM!";

    [RelayCommand]
    private void Click()
    {
        Message = "按钮被点击了!";
    }
}
```

### ObservableObject

所有 ViewModel 应该继承 `ObservableObject`：

```csharp
public partial class MainViewModel : ObservableObject
{
    // [ObservableProperty] 特性：编译时自动生成 Name 和 Count 属性
    // 生成的属性会包含完整的 INotifyPropertyChanged 实现
    [ObservableProperty]
    private string _name = "";

    [ObservableProperty]
    private int _count = 0;

    // 编译后生成的代码相当于：
    // public string Name { get => _name; set => SetProperty(ref _name, value); }
    // public int Count { get => _count; set => SetProperty(ref _count, value); }
}
```

### RelayCommand

使用 `[RelayCommand]` 创建命令：

```csharp
[RelayCommand]
private void Save()
{
    // 保存逻辑
}

[RelayCommand]
private async Task LoadDataAsync()
{
    // 异步加载逻辑
}
```

### 带条件的命令

```csharp
[RelayCommand(CanExecute = nameof(CanSave))]
private void Save()
{
    // 保存逻辑
}

private bool CanSave() => !string.IsNullOrEmpty(Name);
```

### 属性变化通知

使用 `[NotifyCanExecuteChangedFor]`：

```csharp
[ObservableProperty]
[NotifyCanExecuteChangedFor(nameof(SaveCommand))]
private string _name = "";
```

---

## Model 层详解

### Model 的组成

Model 代表 UI 之外的一切：

- 数据存储
- 网络服务
- 业务规则

### Model 示例

```csharp
public class User
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string Email { get; set; } = "";
}

public class UserService
{
    public async Task<List<User>> GetUsersAsync()
    {
        // 从数据库或 API 获取用户
    }
}
```

### 依赖注入

使用依赖注入为 ViewModel 提供 Model 服务：

```csharp
public partial class UserListViewModel : ObservableObject
{
    private readonly IUserService _userService;

    public UserListViewModel(IUserService userService)
    {
        _userService = userService;
    }
}
```

---

## 设置 DataContext

### 在代码中设置

```csharp
public partial class MainWindow : Window
{
    public MainWindow()
    {
        InitializeComponent();
        DataContext = new MainViewModel();
    }
}
```

### 使用 DI 容器

```csharp
// 使用 Microsoft.Extensions.DependencyInjection 进行依赖注入
public partial class App : Application
{
    public override void OnFrameworkInitializationCompleted()
    {
        var services = new ServiceCollection();  // 创建服务集合
        services.AddSingleton<IUserService, UserService>();  // 注册单例服务
        services.AddTransient<MainViewModel>();  // 注册瞬态 ViewModel（每次请求创建新实例）

        var provider = services.BuildServiceProvider();  // 构建服务提供者

        var mainWindow = new MainWindow();
        // 从容器中解析 MainViewModel 并设置到窗口
        mainWindow.DataContext = provider.GetRequiredService<MainViewModel>();
    }
}
```

---

## 实用示例

### 示例 1：用户列表

#### ViewModel

```csharp
public partial class UserListViewModel : ObservableObject
{
    private readonly IUserService _userService;

    public UserListViewModel(IUserService userService)
    {
        _userService = userService;
    }

    [ObservableProperty]
    private ObservableCollection<User> _users = new();

    [ObservableProperty]
    private User? _selectedUser;

    [ObservableProperty]
    private bool _isLoading;

    [RelayCommand]
    private async Task LoadUsersAsync()
    {
        IsLoading = true;
        try
        {
            var users = await _userService.GetUsersAsync();
            Users = new ObservableCollection<User>(users);
        }
        finally
        {
            IsLoading = false;
        }
    }

    [RelayCommand(CanExecute = nameof(CanDeleteUser))]
    private async Task DeleteUserAsync()
    {
        if (SelectedUser == null) return;
        await _userService.DeleteUserAsync(SelectedUser.Id);
        Users.Remove(SelectedUser);
    }

    private bool CanDeleteUser() => SelectedUser != null;
}
```

#### View

```xml
<UserControl xmlns="https://github.com/avaloniaui"
             xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
             x:Class="MyApp.Views.UserListView">

    <DockPanel>
        <!-- 工具栏 -->
        <StackPanel DockPanel.Dock="Top" Orientation="Horizontal" Spacing="10">
            <Button Content="刷新" Command="{Binding LoadUsersCommand}" />
            <Button Content="删除" Command="{Binding DeleteUserCommand}" />
        </StackPanel>

        <!-- 加载指示器 -->
        <ProgressBar DockPanel.Dock="Top"
                     IsIndeterminate="True"
                     IsVisible="{Binding IsLoading}" />

        <!-- 用户列表 -->
        <DataGrid ItemsSource="{Binding Users}"
                  SelectedItem="{Binding SelectedUser}"
                  AutoGenerateColumns="False">
            <DataGrid.Columns>
                <DataGridTextColumn Header="ID" Binding="{Binding Id}" />
                <DataGridTextColumn Header="姓名" Binding="{Binding Name}" />
                <DataGridTextColumn Header="邮箱" Binding="{Binding Email}" />
            </DataGrid.Columns>
        </DataGrid>
    </DockPanel>
</UserControl>
```

### 示例 2：表单验证

```csharp
public partial class UserFormViewModel : ObservableObject
{
    [ObservableProperty]
    [NotifyCanExecuteChangedFor(nameof(SubmitCommand))]
    private string _userName = "";

    [ObservableProperty]
    [NotifyCanExecuteChangedFor(nameof(SubmitCommand))]
    private string _email = "";

    [ObservableProperty]
    [NotifyCanExecuteChangedFor(nameof(SubmitCommand))]
    private string _password = "";

    [ObservableProperty]
    private string _errorMessage = "";

    [RelayCommand(CanExecute = nameof(CanSubmit))]
    private async Task SubmitAsync()
    {
        ErrorMessage = "";

        if (!IsValidEmail(Email))
        {
            ErrorMessage = "邮箱格式不正确";
            return;
        }

        if (Password.Length < 6)
        {
            ErrorMessage = "密码至少6位";
            return;
        }

        await SaveUserAsync();
    }

    private bool CanSubmit() =>
        !string.IsNullOrWhiteSpace(UserName) &&
        !string.IsNullOrWhiteSpace(Email) &&
        !string.IsNullOrWhiteSpace(Password);

    private bool IsValidEmail(string email) =>
        email.Contains("@");

    private async Task SaveUserAsync() { /* 保存逻辑 */ }
}
```

---

## MVVM 项目结构

### 推荐目录结构

```
MyApp/
├── Models/
│   ├── User.cs
│   └── Product.cs
├── ViewModels/
│   ├── ViewModelBase.cs
│   ├── MainViewModel.cs
│   └── UserListViewModel.cs
├── Views/
│   ├── MainWindow.axaml
│   └── UserListView.axaml
├── Services/
│   ├── IUserService.cs
│   └── UserService.cs
├── Converters/
│   └── BoolToVisibilityConverter.cs
└── App.axaml
```

### 命名约定

| 类型      | 约定         | 示例          |
| --------- | ------------ | ------------- |
| ViewModel | XxxViewModel | MainViewModel |
| Model     | Xxx          | User, Product |
| Service   | IXxxService  | IUserService  |
| View      | XxxView      | UserListView  |

---

## 常见问题

### 1. DataContext 为 null

**解决方式：**

```csharp
public MainWindow()
{
    InitializeComponent();
    DataContext ??= new MainViewModel();
}
```

### 2. 属性不更新

**检查项：**

- 是否使用 `[ObservableProperty]`
- 是否在 setter 中触发通知
- 绑定路径是否正确

### 3. 命令不触发

**检查项：**

- `CanExecute` 是否返回 false
- 是否缺少 `[RelayCommand]` 属性
- 绑定是否正确

---

## 最佳实践

### 1. 使用源生成器

```csharp
// 推荐
[ObservableProperty]
private string _name = "";

// 不推荐手动实现
private string _name = "";
public string Name
{
    get => _name;
    set { _name = value; OnPropertyChanged(); }
}
```

### 2. 异步命令

```csharp
// 推荐
[RelayCommand]
private async Task LoadDataAsync()
{
    // 异步逻辑
}

// 不推荐
[RelayCommand]
private async Task LoadDataAsync()
{
    await Task.Run(() => { /* 同步逻辑 */ });
}
```

### 3. 使用接口

```csharp
// 推荐
public class UserListViewModel
{
    private readonly IUserService _userService;

    public UserListViewModel(IUserService userService)
    {
        _userService = userService;
    }
}
```

### 4. 单一职责

```csharp
// 一个 ViewModel 只负责一个 View
public class MainViewModel { /* 主窗口逻辑 */ }
public class SettingsViewModel { /* 设置逻辑 */ }
```

---

## 总结

### MVVM 核心组件

| 组件          | 说明      | 技术             |
| ------------- | --------- | ---------------- |
| **View**      | UI 定义   | XAML             |
| **ViewModel** | 逻辑中介  | ObservableObject |
| **Model**     | 数据/业务 | C# 类            |
| **绑定**      | 连接桥梁  | {Binding}        |

### 数据流

```
用户操作 → View → Binding → ViewModel → Model
              ↑                         ↓
              └──────── Binding ────────┘
```

### 关键点

1. View 和 ViewModel 通过 DataContext 关联
2. 绑定实现单向或双向数据流
3. ObservableObject 提供属性变化通知
4. RelayCommand 提供命令绑定支持

---

## 相关资源

- [Avalonia MVVM 文档](https://docs.avaloniaui.net/docs/fundamentals/the-mvvm-pattern)
- [CommunityToolkit.Mvvm](https://github.com/CommunityToolkit/dotnet-mvvm)
- [数据绑定](https://docs.avaloniaui.net/docs/data-binding/)
- [命令系统](https://docs.avaloniaui.net/docs/input-interaction/commanding)
