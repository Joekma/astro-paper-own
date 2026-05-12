---
title: Avalonia 命令系统详解
author: Joekma
pubDatetime: 2026-05-06T00:00:00.000+08:00
modDatetime: 2026-05-06T00:00:00.000+08:00
slug: avalonia-commanding
description: "深入学习 Avalonia 命令系统，掌握 ICommand 接口、RelayCommand、命令参数，以及如何在 MVVM 模式中分离 UI 和业务逻辑。"
tags:
  - Avalonia
  - 命令系统
  - ICommand
  - RelayCommand
  - MVVM
  - 命令绑定
  - 命令参数
draft: false
series: Avalonia
language: zh-CN
---

## 概述

命令系统将用户操作（按钮点击、菜单选择、键盘快捷键）与视图模型中的逻辑连接起来。Avalonia 使用标准的 .NET `ICommand` 接口，实现了 UI 和业务逻辑的清晰分离。

### 命令系统的优势

| 优势         | 说明                              |
| ------------ | --------------------------------- |
| **解耦**     | UI 控件与业务逻辑分离             |
| **可测试性** | 命令可在没有 UI 的情况下测试      |
| **复用性**   | 同一个命令可绑定到多个控件        |
| **状态管理** | 自动根据 CanExecute 启用/禁用控件 |

---

## ICommand 接口

### 接口定义

`System.Windows.Input.ICommand` 接口定义了三个成员：

```csharp
public interface ICommand
{
    bool CanExecute(object? parameter);
    void Execute(object? parameter);
    event EventHandler? CanExecuteChanged;
}
```

### 成员说明

| 成员                | 用途                                                                                                |
| ------------------- | --------------------------------------------------------------------------------------------------- |
| `CanExecute`        | 返回命令当前是否可以执行，控件用它来确定启用/禁用状态                                               |
| `Execute`           | 执行命令动作，用户点击按钮/触发快捷键时调用                                                         |
| `CanExecuteChanged` | 当 `CanExecute` 返回值可能改变时触发（通常由属性变化通知），控件自动订阅此事件重新查询 `CanExecute` |

---

## 命令执行流程

### 工作原理图

```
┌─────────────┐
│   用户操作   │ (点击按钮/菜单/快捷键)
└──────┬──────┘
       ▼
┌─────────────┐
│   控件检查   │ 询问 CanExecute
└──────┬──────┘
       ▼
┌─────────────────────────────────────────┐
│         CanExecute 返回值               │
├──────────────────┬──────────────────────┤
│     true        │       false           │
▼                ▼                       ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ 调用 Execute │ │ 禁用控件    │ │ 忽略操作    │
│ 执行命令     │ │ 显示灰色    │ │             │
└─────────────┘ └─────────────┘ └─────────────┘
```

### 按钮命令示例

```xml
<Button Content="保存" Command="{Binding SaveCommand}" />
```

当 `SaveCommand.CanExecute()` 返回 `false` 时，按钮显示为禁用状态，无法点击。

---

## RelayCommand（CommunityToolkit.Mvvm）

### 使用方法

创建命令最常见的方式是使用 CommunityToolkit.Mvvm 包中的 `[RelayCommand]` 属性：

```csharp
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;

public partial class MainViewModel : ObservableObject
{
    [ObservableProperty]
    private string _name = "";

    [RelayCommand]
    private void Save()
    {
        // 保存逻辑
    }

    [RelayCommand(CanExecute = nameof(CanDelete))]
    private void Delete()
    {
        // 删除逻辑
    }

    private bool CanDelete() => !string.IsNullOrEmpty(Name);
}
```

源生成器自动创建 `SaveCommand` 和 `DeleteCommand` 属性（命名规则：方法名首字母大写 + Command）。
`DeleteCommand` 在 `CanExecuteChanged` 触发时（即 `Name` 变化时）重新评估 `CanDelete()` 方法，决定按钮是否启用。

### 在 XAML 中使用

```xml
<StackPanel Spacing="8">
    <TextBox Text="{Binding Name}" />
    <Button Content="保存" Command="{Binding SaveCommand}" />
    <Button Content="删除" Command="{Binding DeleteCommand}" />
</StackPanel>
```

---

## 异步命令

### 异步命令支持

`[RelayCommand]` 属性也支持异步方法。生成的命令处理 `Task` 返回类型并提供自动忙碌状态跟踪：

```csharp
[RelayCommand]
private async Task LoadDataAsync()
{
    IsLoading = true;
    try
    {
        var data = await _dataService.GetDataAsync();
        Items = new ObservableCollection<Item>(data);
    }
    finally
    {
        IsLoading = false;
    }
}
```

### 忙碌状态

当 `LoadDataAsync` 运行时，`LoadDataCommand.IsRunning` 为 `true`。你可以通过绑定显示进度指示器：

```xml
<StackPanel>
    <Button Content="加载数据"
            Command="{Binding LoadDataCommand}" />

    <ProgressBar IsIndeterminate="True"
                IsVisible="{Binding LoadDataCommand.IsRunning}" />
</StackPanel>
```

### 带取消的异步命令

```csharp
[RelayCommand]
private async Task DownloadFileAsync(CancellationToken token)
{
    var file = await _fileService.OpenFileAsync(token);
    // 处理文件
}
```

---

## 命令参数

### CommandParameter 用途

`CommandParameter` 属性将数据传递给命令的 `Execute` 和 `CanExecute` 方法：

```xml
<Button Content="打开"
        Command="{Binding OpenCommand}"
        CommandParameter="{Binding SelectedItem}" />
```

### 在命令中获取参数

```csharp
[RelayCommand]
private void Open(object? parameter)
{
    if (parameter is Item item)
    {
        // 打开项目
    }
}
```

### 带类型参数的命令

使用 CommunityToolkit.Mvvm 的类型化参数：

```csharp
[RelayCommand]
private void Open(Item item)
{
    // 源生成器创建 OpenCommand 为 RelayCommand<Item>
}
```

```xml
<Button Content="打开"
        Command="{Binding OpenCommand}"
        CommandParameter="{Binding SelectedItem}" />
```

---

## NotifyCanExecuteChangedFor

### 用途

当影响 `CanExecute` 的属性更改时，使用 `[NotifyCanExecuteChangedFor]`：

```csharp
[ObservableProperty]
[NotifyCanExecuteChangedFor(nameof(DeleteCommand))]
private string _name = "";
```

这告诉源生成器，只要 `Name` 发生变化就触发 `DeleteCommand.NotifyCanExecuteChanged()`，导致绑定的控件重新评估命令是否可以执行。

### 示例

```csharp
public partial class UserViewModel : ObservableObject
{
    [ObservableProperty]
    private string _userName = "";

    [ObservableProperty]
    private string _password = "";

    [ObservableProperty]
    [NotifyCanExecuteChangedFor(nameof(LoginCommand))]
    private bool _isAuthenticated;

    [RelayCommand(CanExecute = nameof(CanLogin))]
    private async Task LoginAsync()
    {
        // 登录逻辑
    }

    private bool CanLogin() =>
        !string.IsNullOrEmpty(UserName) && !string.IsNullOrEmpty(Password);
}
```

---

## 手动实现 ICommand

### 适用场景

在不使用源生成器的场景中，手动创建命令：

```csharp
public class RelayCommand : ICommand
{
    private readonly Action _execute;  // 命令执行逻辑
    private readonly Func<bool>? _canExecute;  // 可选的条件判断逻辑

    public RelayCommand(Action execute, Func<bool>? canExecute = null)
    {
        _execute = execute;
        _canExecute = canExecute;
    }

    // 检查命令是否可以执行（返回 false 时控件自动禁用）
    public bool CanExecute(object? parameter) => _canExecute?.Invoke() ?? true;

    // 执行命令
    public void Execute(object? parameter) => _execute();

    // 通知控件重新评估 CanExecute（当相关属性变化时调用）
    public event EventHandler? CanExecuteChanged;

    public void RaiseCanExecuteChanged()
        => CanExecuteChanged?.Invoke(this, EventArgs.Empty);
}
```

### 带参数的命令

```csharp
public class RelayCommand<T> : ICommand
{
    private readonly Action<T?> _execute;
    private readonly Func<T?, bool>? _canExecute;

    public RelayCommand(Action<T?> execute, Func<T?, bool>? canExecute = null)
    {
        _execute = execute;
        _canExecute = canExecute;
    }

    public bool CanExecute(T? parameter) => _canExecute?.Invoke(parameter) ?? true;

    public void Execute(T? parameter) => _execute(parameter);

    public event EventHandler? CanExecuteChanged;

    public void RaiseCanExecuteChanged()
        => CanExecuteChanged?.Invoke(this, EventArgs.Empty);
}
```

### 在 ViewModel 中使用

```csharp
public class MainViewModel
{
    public ICommand SaveCommand { get; }

    public MainViewModel()
    {
        SaveCommand = new RelayCommand(
            execute: () => { /* 保存逻辑 */ },
            canExecute: () => IsModified);
    }
}
```

---

## 支持命令的控件

### 控件列表

| 控件           | 命令属性                  | 触发时机     |
| -------------- | ------------------------- | ------------ |
| `Button`       | `Command`                 | 点击时       |
| `MenuItem`     | `Command`                 | 点击时       |
| `ListBox`      | `SelectionChangedCommand` | 选择改变时   |
| `KeyBinding`   | `Command`                 | 按下快捷键时 |
| `ToggleButton` | `Command`                 | 切换时       |
| `SplitButton`  | `Command`                 | 主按钮点击时 |

### Button 命令

```xml
<Button Content="提交"
        Command="{Binding SubmitCommand}"
        IsEnabled="{Binding SubmitCommand.CanExecute}" />
```

### MenuItem 命令

```xml
<Menu>
    <MenuItem Header="_文件">
        <MenuItem Header="_新建" Command="{Binding NewCommand}" HotKey="Ctrl+N" />
        <MenuItem Header="_打开" Command="{Binding OpenCommand}" HotKey="Ctrl+O" />
        <Separator />
        <MenuItem Header="_保存" Command="{Binding SaveCommand}" HotKey="Ctrl+S" />
    </MenuItem>
</Menu>
```

### ToggleButton 命令

```xml
<ToggleButton Content="全屏模式"
              Command="{Binding ToggleFullScreenCommand}"
              IsChecked="{Binding IsFullScreen}" />
```

---

## 命令与快捷键

### KeyBinding 绑定

使用 `KeyBinding` 将命令绑定到键盘快捷键：

```xml
<Window.KeyBindings>
    <KeyBinding Gesture="Ctrl+S" Command="{Binding SaveCommand}" />
    <KeyBinding Gesture="Ctrl+Z" Command="{Binding UndoCommand}" />
    <KeyBinding Gesture="Delete" Command="{Binding DeleteCommand}" />
</Window.KeyBindings>
```

`KeyBinding` 评估 `CanExecute`，只在按下快捷键且命令可用时触发命令。

### HotKey 附加属性

对于控件，`HotKey` 附加属性提供更简单的语法：

```xml
<Button Content="_保存"
        Command="{Binding SaveCommand}"
        HotKey="Ctrl+S" />
```

`HotKey` 在按钮没有焦点时也能触发按钮的命令。

### 组合示例

```xml
<Window KeyBindings="{Binding WindowKeyBindings}">
    <StackPanel>
        <Button Content="保存"
                Command="{Binding SaveCommand}"
                HotKey="Ctrl+S" />

        <Menu>
            <MenuItem Header="保存"
                      Command="{Binding SaveCommand}"
                      HotKey="Ctrl+S" />
        </Menu>
    </StackPanel>
</Window>
```

同一个命令可以绑定到按钮、菜单项和快捷键。

---

## 实用示例

### 示例 1：用户管理命令

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

    [ObservableProperty]
    [NotifyCanExecuteChangedFor(nameof(DeleteUserCommand))]
    [NotifyCanExecuteChangedFor(nameof(EditUserCommand))]
    private User? _selectedUser;

    [RelayCommand(CanExecute = nameof(CanAddUser))]
    private async Task AddUserAsync()
    {
        var dialog = new UserEditorDialog();
        if (await dialog.ShowAsync() == DialogResult.Ok)
        {
            await _userService.CreateUserAsync(dialog.User);
            await LoadUsersAsync();
        }
    }

    private bool CanAddUser() => !IsLoading;

    [RelayCommand(CanExecute = nameof(CanEditUser))]
    private async Task EditUserAsync()
    {
        if (SelectedUser == null) return;

        var dialog = new UserEditorDialog(SelectedUser);
        if (await dialog.ShowAsync() == DialogResult.Ok)
        {
            await _userService.UpdateUserAsync(dialog.User);
            await LoadUsersAsync();
        }
    }

    private bool CanEditUser() => SelectedUser != null && !IsLoading;

    [RelayCommand(CanExecute = nameof(CanDeleteUser))]
    private async Task DeleteUserAsync()
    {
        if (SelectedUser == null) return;

        var result = await MessageBox.ShowAsync(
            "确定要删除此用户吗？",
            "确认删除",
            MessageBoxButtons.YesNo);

        if (result == MessageBoxResult.Yes)
        {
            await _userService.DeleteUserAsync(SelectedUser.Id);
            await LoadUsersAsync();
        }
    }

    private bool CanDeleteUser() => SelectedUser != null && !IsLoading;
}
```

### XAML 绑定

```xml
<UserControl>
    <DockPanel>
        <!-- 工具栏 -->
        <StackPanel DockPanel.Dock="Top" Orientation="Horizontal" Spacing="8">
            <Button Content="新增"
                    Command="{Binding AddUserCommand}" />
            <Button Content="编辑"
                    Command="{Binding EditUserCommand}" />
            <Button Content="删除"
                    Command="{Binding DeleteUserCommand}" />
            <Button Content="刷新"
                    Command="{Binding LoadUsersCommand}"
                    HotKey="F5" />
        </StackPanel>

        <!-- 用户列表 -->
        <DataGrid ItemsSource="{Binding Users}"
                  SelectedItem="{Binding SelectedUser}"
                  AutoGenerateColumns="False"
                  IsReadOnly="True">
            <DataGrid.Columns>
                <DataGridTextColumn Header="姓名" Binding="{Binding Name}"/>
                <DataGridTextColumn Header="邮箱" Binding="{Binding Email}"/>
                <DataGridTextColumn Header="状态" Binding="{Binding Status}"/>
            </DataGrid.Columns>
        </DataGrid>
    </DockPanel>
</UserControl>
```

### 示例 2：表单验证命令

```csharp
public partial class FormViewModel : ObservableObject
{
    [ObservableProperty]
    [NotifyCanExecuteChangedFor(nameof(SubmitCommand))]
    private string _email = "";

    [ObservableProperty]
    [NotifyCanExecuteChangedFor(nameof(SubmitCommand))]
    private string _password = "";

    [ObservableProperty]
    [NotifyCanExecuteChangedFor(nameof(SubmitCommand))]
    private string _confirmPassword = "";

    [ObservableProperty]
    private bool _isSubmitting;

    [RelayCommand(CanExecute = nameof(CanSubmit))]
    private async Task SubmitAsync()
    {
        IsSubmitting = true;
        try
        {
            await _authService.RegisterAsync(Email, Password);
            await MessageBox.ShowAsync("注册成功！");
        }
        finally
        {
            IsSubmitting = false;
        }
    }

    private bool CanSubmit()
    {
        return !string.IsNullOrEmpty(Email)
            && !string.IsNullOrEmpty(Password)
            && Password == ConfirmPassword
            && IsValidEmail(Email)
            && !IsSubmitting;
    }

    private static bool IsValidEmail(string email)
    {
        return email.Contains("@") && email.Contains(".");
    }
}
```

### XAML 表单

```xml
<StackPanel Spacing="16" Margin="20">
    <TextBox Text="{Binding Email}"
             Watermark="邮箱"
             HorizontalAlignment="Stretch" />

    <TextBox Text="{Binding Password}"
             Watermark="密码"
             PasswordChar="*"
             HorizontalAlignment="Stretch" />

    <TextBox Text="{Binding ConfirmPassword}"
             Watermark="确认密码"
             PasswordChar="*"
             HorizontalAlignment="Stretch" />

    <Button Content="提交"
            Command="{Binding SubmitCommand}"
            IsEnabled="{Binding !IsSubmitting}"
            HorizontalAlignment="Stretch" />

    <ProgressBar IsIndeterminate="True"
                 IsVisible="{Binding IsSubmitting}" />
</StackPanel>
```

---

## 命令模式最佳实践

### 1. 使用 [RelayCommand]

```csharp
// 推荐
[RelayCommand]
private async Task SaveAsync()
{
    await _service.SaveAsync();
}

// 不推荐手动创建
public ICommand SaveCommand { get; } = new RelayCommand(async () => await SaveAsync());
```

### 2. 异步命令返回 Task

```csharp
// 推荐
[RelayCommand]
private async Task LoadDataAsync()
{
    // 异步加载
}

// 不推荐
[RelayCommand]
private void LoadData()
{
    Task.Run(() => { /* 异步加载 */ });
}
```

### 3. 正确处理 CanExecute

```csharp
// 使用 NotifyCanExecuteChangedFor
[ObservableProperty]
[NotifyCanExecuteChangedFor(nameof(SaveCommand))]
[NotifyCanExecuteChangedFor(nameof(DeleteCommand))]
private string _name = "";
```

### 4. 命令参数类型化

```csharp
// 推荐
[RelayCommand]
private void OpenItem(Item item)
{
    // 处理 Item
}

// 参数类型自动推断
```

---

## 常见问题

### 1. 命令不触发

**检查项：**

- 命令是否正确绑定
- `CanExecute` 是否返回 `true`
- 数据上下文是否正确设置

### 2. 按钮保持禁用

**检查项：**

- 是否缺少 `[NotifyCanExecuteChangedFor]`
- 属性更改是否触发通知
- `CanExecute` 逻辑是否正确

### 3. 命令参数为 null

**检查项：**

- 是否设置了 `CommandParameter`
- 参数类型是否匹配
- 绑定路径是否正确

### 4. 异步命令多次执行

**解决方式：**

```csharp
[RelayCommand]
private async Task LoadDataAsync()
{
    if (LoadDataCommand.IsRunning) return;

    await LoadDataInternalAsync();
}
```

---

## 总结

### 命令系统组件

| 组件               | 用途           |
| ------------------ | -------------- |
| `ICommand`         | 命令接口       |
| `RelayCommand`     | 命令实现       |
| `CommandParameter` | 命令参数传递   |
| `CanExecute`       | 命令可用性检查 |
| `KeyBinding`       | 快捷键绑定     |

### 常用模式

| 模式           | 用法                                              |
| -------------- | ------------------------------------------------- |
| **基础命令**   | `[RelayCommand]`                                  |
| **带条件命令** | `[RelayCommand(CanExecute = nameof(Method))]`     |
| **异步命令**   | `[RelayCommand] private async Task MethodAsync()` |
| **参数命令**   | `[RelayCommand] private void Method(Type param)`  |
| **状态通知**   | `[NotifyCanExecuteChangedFor(nameof(Command))]`   |

### 命令绑定来源

| 来源           | 优先级     |
| -------------- | ---------- |
| `KeyBinding`   | 全局快捷键 |
| `HotKey`       | 控件快捷键 |
| `Command` 属性 | 控件命令   |
| `MenuItem`     | 菜单命令   |

---

## 相关资源

- [Avalonia 命令文档](https://docs.avaloniaui.net/docs/input-interaction/commanding)
- [ICommand 接口](https://docs.microsoft.com/zh-cn/dotnet/api/system.windows.input.icommand)
- [CommunityToolkit.Mvvm](https://github.com/CommunityToolkit/dotnet-mvvm)
- [MVVM 模式](https://docs.avaloniaui.net/docs/fundamentals/the-mvvm-pattern)
- [键盘和快捷键](https://docs.avaloniaui.net/docs/input-interaction/keyboard-and-hotkeys)
