---
title: Avalonia 入门指南
author: Joekma
pubDatetime: 2026-05-06T00:00:00.000+08:00
modDatetime: 2026-05-06T00:00:00.000+08:00
slug: avalonia-getting-started
description: "深入学习 Avalonia UI 开发，从环境安装、项目创建到第一个 Avalonia 应用程序的完整指南。"
tags:
  - Avalonia
  - 入门指南
  - 环境安装
  - 项目创建
  - .NET
  - 跨平台
  - 桌面应用
draft: false
series: Avalonia
seriesOrder: 1
language: zh-CN
---

## 概述

Avalonia UI 是一个跨平台的 .NET UI 框架，支持 Windows、macOS、Linux 以及 Web 和移动端。本文将帮助你快速搭建 Avalonia 开发环境并创建第一个应用程序。

### Avalonia 支持的平台

| 平台               | 支持状态      |
| ------------------ | ------------- |
| Windows            | ✅ 完全支持   |
| macOS              | ✅ 完全支持   |
| Linux              | ✅ 完全支持   |
| Web（WebAssembly） | ✅ 实验性支持 |
| iOS/Android        | 🔜 开发中     |

---

## 环境要求

### 系统要求

| 要求         | 说明                                    |
| ------------ | --------------------------------------- |
| **操作系统** | Windows 10+/macOS 10.14+/Linux (GTK 3+) |
| **.NET SDK** | .NET 6.0 或更高版本（推荐 .NET 8.0）    |
| **IDE**      | Visual Studio 2022 / Rider / VS Code    |

### 检查 .NET SDK 安装

```powershell
dotnet --list-sdks

# 输出示例：
# 8.0.202 [C:\Program Files\dotnet\sdk]
```

如果 `dotnet` 命令不可用，请先安装 .NET SDK。

---

## 安装 Avalonia 模板

### 安装模板

使用以下命令安装 Avalonia 项目模板：

```powershell
dotnet new install Avalonia.Templates
```

### 可用模板

安装后，你可以看到以下模板：

| 模板名称                     | 短名称                    | 说明          |
| ---------------------------- | ------------------------- | ------------- |
| Avalonia App                 | avalonia.app              | 标准应用      |
| Avalonia MVVM App            | avalonia.mvvm             | MVVM 架构应用 |
| Avalonia Cross Platform      | avalonia.xplat            | 跨平台应用    |
| Avalonia Resource Dictionary | avalonia.resource         | 资源字典      |
| Avalonia Styles              | avalonia.styles           | 样式模板      |
| Avalonia TemplatedControl    | avalonia.templatedcontrol | 模板控件      |
| Avalonia UserControl         | avalonia.usercontrol      | 用户控件      |
| Avalonia Window              | avalonia.window           | 窗口          |

### 验证安装

```powershell
dotnet new list

# 应该看到 Avalonia 相关模板
```

---

## 创建新项目

### 创建标准应用

```powershell
dotnet new avalonia.app -o MyApp
```

### 创建 MVVM 应用

```powershell
dotnet new avalonia.mvvm -o MyMvvmApp
```

### 创建跨平台应用

```powershell
dotnet new avalonia.xplat -o MyCrossPlatformApp
```

### 项目结构

创建 MVVM 项目后的结构：

```
MyMvvmApp/
├── MyMvvmApp.sln
├── MyMvvmApp/
│   ├── MyMvvmApp.csproj
│   ├── App.axaml
│   ├── App.axaml.cs
│   ├── Program.cs
│   ├── ViewModels/
│   │   ├── MainWindowViewModel.cs
│   │   └── ViewModelBase.cs
│   └── Views/
│       └── MainWindow.axaml
└── MyMvvmApp.Desktop/
    ├── MyMvvmApp.Desktop.csproj
    └── Program.cs
```

---

## 项目文件结构

### Program.cs

应用程序入口点：

```csharp
using Avalonia;
using Avalonia.Controls.ApplicationLifetimes;
using Avalonia.Themes.Fluent;

class Program
{
    [STAThread]  // STAThread 属性标识线程为单线程单元（STA），某些 COM 组件需要
    public static void Main(string[] args)
    {
        // StartWithClassicDesktopLifetime 会启动桌面应用程序并等待其退出
        BuildAvaloniaApp()
            .StartWithClassicDesktopLifetime(args);
    }

    public static AppBuilder BuildAvaloniaApp()
    {
        return AppBuilder.Configure<App>()
            .UsePlatformDetect()        // 自动检测当前平台（Windows/macOS/Linux）
            .UseFluentTheme()           // 使用 Fluent 设计主题
            .LogToTrace();              // 将日志输出到 Trace（调试窗口）
    }
}
```

### App.axaml

应用程序资源定义：

```xml
<Application xmlns="https://github.com/avaloniaui"
              x:Class="MyMvvmApp.App">
    <Application.Styles>
        <FluentTheme />
    </Application.Styles>
</Application>
```

### App.axaml.cs

应用程序代码：

```csharp
using Avalonia;
using Avalonia.Controls.ApplicationLifetimes;
using Avalonia.Markup.Xaml;

public partial class App : Application
{
    public override void Initialize()
    {
        AvaloniaXamlLoader.Load(this);
    }

    public override void OnFrameworkInitializationCompleted()
    {
        if (ApplicationLifetime is IClassicDesktopStyleApplicationLifetime desktop)
        {
            desktop.MainWindow = new MainWindow();
        }
        base.OnFrameworkInitializationCompleted();
    }
}
```

---

## MainWindow 详解

### MainWindow.axaml

```xml
<Window xmlns="https://github.com/avaloniaui"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        x:Class="MyMvvmApp.Views.MainWindow"
        Title="My First Avalonia App"
        Width="800"
        Height="600">

    <TextBlock Text="Hello, Avalonia!"
               HorizontalAlignment="Center"
               VerticalAlignment="Center"
               FontSize="32" />

</Window>
```

### MainWindow.axaml.cs

```csharp
using Avalonia;
using Avalonia.Controls;
using Avalonia.Markup.Xaml;

public partial class MainWindow : Window
{
    public MainWindow()
    {
        InitializeComponent();
    }
}
```

---

## 运行应用程序

### CLI 运行

```powershell
cd MyApp
dotnet run
```

### IDE 运行

在 Visual Studio 或 Rider 中按 F5 运行。

---

## MVVM 模式示例

### ViewModelBase.cs

```csharp
// ObservableObject 是 CommunityToolkit.Mvvm 提供的基类
// 自动实现 INotifyPropertyChanged 接口，属性变更时会通知 UI 更新
public partial class ViewModelBase : ObservableObject
{
}
```

### MainWindowViewModel.cs

```csharp
// CommunityToolkit.Mvvm 命名空间
// ObservableObject 提供属性通知，Input 提供 [RelayCommand] 特性
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;

public partial class MainWindowViewModel : ViewModelBase
{
    // [ObservableProperty] 特性会在编译时自动生成 Message 属性及其 getter/setter
    // 当 Message 值改变时，自动触发 PropertyChanged 事件通知 UI 更新
    [ObservableProperty]
    private string _message = "Hello, Avalonia!";

    // [RelayCommand] 特性会在编译时自动生成 UpdateMessageCommand 命令
    // 命令绑定到 UI 后，点击按钮会自动调用此方法
    [RelayCommand]
    private void UpdateMessage()
    {
        Message = "Welcome to MVVM!";
    }
}
```

### 绑定到 ViewModel

修改 MainWindow.axaml：

```xml
<Window xmlns="https://github.com/avaloniaui"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        x:Class="MyMvvmApp.Views.MainWindow"
        Title="MVVM 示例"
        Width="800"
        Height="600">

    <StackPanel HorizontalAlignment="Center"
                VerticalAlignment="Center"
                Spacing="20">

        <TextBlock Text="{Binding Message}"
                   FontSize="32"
                   HorizontalAlignment="Center" />

        <Button Content="更新消息"
                Command="{Binding UpdateMessageCommand}"
                HorizontalAlignment="Center" />

    </StackPanel>

</Window>
```

修改 MainWindow.axaml.cs：

```csharp
// MainWindow.axaml.cs - 窗口代码后置文件
public partial class MainWindow : Window
{
    public MainWindow()
    {
        InitializeComponent();  // 加载并初始化 XAML 中定义的 UI
        DataContext = new MainWindowViewModel();  // 设置数据上下文，绑定 ViewModel
    }
}
```

---

## 常用命令

### 项目相关

```powershell
# 恢复依赖
dotnet restore

# 构建
dotnet build

# 发布
dotnet publish

# 运行
dotnet run
```

### 模板相关

```powershell
# 列出模板
dotnet new list

# 更新模板
dotnet new update

# 卸载模板
dotnet new uninstall Avalonia.Templates
```

---

## NuGet 源配置

如果安装模板时遇到问题，检查 NuGet 源：

```powershell
dotnet nuget list source

# 应该包含：
# 1. nuget.org [Enabled]
#    https://api.nuget.org/v3/index.json
```

添加 NuGet 源：

```powershell
dotnet nuget add source https://api.nuget.org/v3/index.json -n nuget.org
```

---

## 常见问题

### 1. dotnet 命令找不到

**解决方式：**

- 安装 .NET SDK
- 检查 PATH 环境变量

### 2. 模板安装失败

**解决方式：**

- 检查网络连接
- 确认 NuGet 源配置正确
- 清理缓存：`dotnet nuget locals all --clear`

### 3. 运行时报错

**解决方式：**

```powershell
# 清理并重新构建
dotnet clean
dotnet restore
dotnet build
```

### 4. 设计器不显示

**解决方式：**

- 安装 Avalonia 插件（Visual Studio 或 Rider）
- 重启 IDE

---

## 推荐的 Avalonia 包

| 包                      | 用途          |
| ----------------------- | ------------- |
| CommunityToolkit.Mvvm   | MVVM 工具包   |
| Avalonia.FluentTheme    | Fluent 主题   |
| Avalonia.MaterialTheme  | Material 主题 |
| Avalonia.Xaml.Behaviors | 行为扩展      |
| Avalonia.ReactiveUI     | 响应式扩展    |

### 安装推荐包

```powershell
cd MyApp
dotnet add package CommunityToolkit.Mvvm
dotnet add package Avalonia.Xaml.Behaviors
```

---

## 下一步

| 主题                                                                                                       | 说明                  |
| ---------------------------------------------------------------------------------------------------------- | --------------------- |
| [XAML 基础](file:///d:\Workspace\blg\astro-paper-own/src/data/blog/Avalonia/Avalonia%20XAML%20基础详解.md) | XAML 语法和绑定表达式 |
| [数据绑定](file:///d:\Workspace\blg\astro-paper-own/src/data/blog/Avalonia/Avalonia%20数据绑定详解.md)     | Binding、DataContext  |
| [布局系统](file:///d:\Workspace\blg\astro-paper-own/src/data/blog/Avalonia/Avalonia%20布局系统详解.md)     | StackPanel、Grid      |
| [MVVM 模式](file:///d:\Workspace\blg\astro-paper-own/src/data/blog/Avalonia/Avalonia%20MVVM%20模式详解.md) | View/ViewModel/Model  |

---

## 总结

| 步骤 | 操作               |
| ---- | ------------------ |
| 1    | 安装 .NET SDK      |
| 2    | 安装 Avalonia 模板 |
| 3    | 创建项目           |
| 4    | 运行验证           |
| 5    | 添加代码           |

---

## 相关资源

- [Avalonia 官方文档](https://docs.avaloniaui.net/docs/)
- [Avalonia 安装指南](https://docs.avaloniaui.net/docs/get-started/install)
- [Avalonia 模板](https://github.com/AvaloniaUI/avalonia-dotnet-templates)
- [社区支持](https://docs.avaloniaui.net/docs/community)
