---
title: UI Automation 开发环境配置与安装
author: Joekma
pubDatetime: 2026-05-09T00:00:00.000+08:00
modDatetime: 2026-05-09T00:00:00.000+08:00
slug: ui-automation-installation
description: '详细介绍UI Automation开发环境配置，包括C#、Python等语言的集成和Visual Studio配置。'
tags:
  - UI Automation
  - RPA
  - 安装配置
  - 开发环境
draft: false
language: zh-CN
---

## 概述

UI Automation 是 Windows 内置的辅助功能框架，提供了统一的编程接口来访问 Windows 应用程序的用户界面。本教程将介绍如何配置开发环境来使用 UI Automation。

### 支持的开发环境

| 环境 | 支持程度 | 说明 |
|------|----------|------|
| **Visual Studio + C#** | 完整支持 | 最佳选择 |
| **Visual Studio + VB.NET** | 完整支持 | 语法略有不同 |
| **Python + UIAutomationCore** | 基础支持 | 功能有限 |
| **C++** | 完整支持 | 复杂度高 |

## C# 开发环境

### .NET Framework 配置

.NET Framework 4.0+ 已内置 UI Automation 支持：

```xml
<!-- 项目文件 (.csproj) -->
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFramework>net6.0-windows</TargetFramework>
    <UseWPF>true</UseWPF>
  </PropertyGroup>
</Project>
```

### NuGet 包

虽然 UI Automation 是内置的，但可以使用额外的 NuGet 包：

```bash
# 安装 UI Automation 相关包
dotnet add package UIAComWrapper    # COM 包装器
dotnet add package FlaUI.Core        # 高级封装库
dotnet add package FlaUI.UIA3       # UIA3 实现
```

### 基本项目结构

```
UIAutomationProject/
├── UIAutomationProject/
│   ├── Program.cs           # 主程序
│   ├── Helpers/
│   │   ├── ElementFinder.cs    # 元素查找工具
│   │   └── PatternHelper.cs    # Pattern 助手
│   ├── UIAutomationProject.csproj
│   └── appsettings.json     # 配置文件
├── Tests/
│   └── AutomationTests.cs  # 测试代码
└── UIAutomationProject.sln
```

### Program.cs 示例

```csharp
using System;
using System.Windows.Automation;
using System.Diagnostics;

namespace UIAutomationProject
{
    class Program
    {
        static void Main(string[] args)
        {
            Console.WriteLine("UI Automation 演示程序");
            
            // 获取桌面
            AutomationElement desktop = AutomationElement.RootElement;
            Console.WriteLine($"桌面名称: {desktop.Current.Name}");
            
            // 获取所有窗口
            AutomationElementCollection windows = desktop.FindAll(
                TreeScope.Children,
                new PropertyCondition(
                    AutomationElement.ControlTypeProperty, 
                    ControlType.Window
                )
            );
            
            Console.WriteLine($"打开的窗口数: {windows.Count}");
        }
    }
}
```

## Visual Studio 配置

### 项目设置

1. **创建新项目**
   - 选择 "Console App (.NET Framework)" 或 "Console App (.NET Core)"
   - 选择目标框架：.NET 6.0+ 或 .NET Framework 4.7.2+

2. **添加引用**
   - 右键项目 → 添加引用
   - 搜索 "UIAutomationClient" 和 "UIAutomationTypes"
   - 添加对应引用

### 项目文件配置

```xml
<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFramework>net6.0-windows</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
    <UseWPF>true</UseWPF>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="FlaUI.Core" Version="3.0.0" />
    <PackageReference Include="FlaUI.UIA3" Version="3.0.0" />
    <PackageReference Include="FlaUI.ChromeDriver" Version="3.0.0" />
  </ItemGroup>

</Project>
```

## FlaUI 库

FlaUI 是一个高级的 UI Automation 封装库，提供了更友好的 API：

### 安装

```bash
dotnet add package FlaUI.Core
dotnet add package FlaUI.UIA3
```

### 基本使用

```csharp
using FlaUI.Core;
using FlaUI.Core.AutomationElements;
using FlaUI.UIA3;
using FlaUI.Core.Input;
using System.Diagnostics;

public class FlaUIDemo
{
    public static void Main()
    {
        // 启动应用程序
        var app = Application.Launch("notepad.exe");
        
        // 创建自动化对象
        using (var automation = new UIA3Automation())
        {
            // 获取主窗口
            var mainWindow = app.GetMainWindow(automation);
            
            // 查找并操作文本框
            var textArea = mainWindow.FindFirstDescendant(
                cf => cf.ByControlType(ControlType.Edit)
            );
            
            if (textArea != null)
            {
                textArea.Enter("Hello from FlaUI!");
            }
            
            // 等待用户输入
            Console.ReadKey();
        }
        
        app.Close();
    }
}
```

### FlaUI 元素查找

```csharp
// 使用自动化 ID
var button = mainWindow.FindFirstDescendant(
    cf => cf.ByAutomationId("btnSubmit")
);

// 使用名称
var label = mainWindow.FindFirstDescendant(
    cf => cf.ByName("用户名")
);

// 使用控件类型
var editBoxes = mainWindow.FindAllDescendants(
    cf => cf.ByControlType(ControlType.Edit)
);

// 组合条件
var searchBox = mainWindow.FindFirstDescendant(
    cf => cf.ByControlType(ControlType.Edit)
        .And(cf.ByAutomationId("searchBox"))
);
```

## Python 环境配置

### pywinauto

pywinauto 是一个 Python 的 Windows 自动化库：

```bash
# 安装 pywinauto
pip install pywinauto

# 安装依赖
pip install comtypes
```

### 基本示例

```python
from pywinauto import Application, timings

# 启动记事本
app = Application(backend="win32").start("notepad.exe")

# 获取主窗口
dlg = app.window(title="无标题 - 记事本")

# 操作窗口
dlg.wait('visible')
edit = dlg.window(class_name="Edit")
edit.type_keys("Hello from Python!")

# 关闭窗口
dlg.close()
```

### UIAutomationClient (基础支持)

```python
from UIAutomationClient import *
import time

# 获取桌面
desktop = CUIAutomation().GetRootElement()

# 查找窗口
condition = CreatePropertyCondition(UIA_PropertyIds.UIA_NamePropertyId, "新建文本文档.txt - 记事本")
window = desktop.FindFirst(UIAutomationClient.TreeScope_UIA_TreeScope_Children, condition)

if window:
    print(f"找到窗口: {window.Current.Name}")
    
    # 查找编辑区
    edit_condition = CreatePropertyCondition(
        UIA_PropertyIds.UIA_ControlTypePropertyId, 
        UIA_ControlTypeIds.UIA_EditControlTypeId
    )
    edit = window.FindFirst(UIAutomationClient.TreeScope_UIA_TreeScope_Descendants, edit_condition)
    
    if edit:
        print(f"找到编辑区")
```

## 测试框架集成

### NUnit 集成

```csharp
using NUnit.Framework;
using System.Windows.Automation;

[TestFixture]
public class UIAutomationTests
{
    private Process _notepadProcess;
    private AutomationElement _notepadWindow;

    [SetUp]
    public void Setup()
    {
        _notepadProcess = Process.Start("notepad.exe");
        Thread.Sleep(500);
        
        _notepadWindow = AutomationElement.RootElement.FindFirst(
            TreeScope.Children,
            new PropertyCondition(
                AutomationElement.ProcessIdProperty, 
                _notepadProcess.Id
            )
        );
    }

    [TearDown]
    public void TearDown()
    {
        if (_notepadProcess != null && !_notepadProcess.HasExited)
        {
            _notepadProcess.Kill();
        }
    }

    [Test]
    public void NotepadWindowExists()
    {
        Assert.IsNotNull(_notepadWindow);
        Assert.AreEqual("无标题 - 记事本", _notepadWindow.Current.Name);
    }

    [Test]
    public void CanFindTextArea()
    {
        var textArea = _notepadWindow.FindFirst(
            TreeScope.Descendants,
            new PropertyCondition(
                AutomationElement.ControlTypeProperty, 
                ControlType.Edit
            )
        );
        
        Assert.IsNotNull(textArea);
    }
}
```

### xUnit 集成

```csharp
using Xunit;
using System.Diagnostics;
using System.Windows.Automation;

public class UIAutomationTests : IDisposable
{
    private Process _process;
    private AutomationElement _window;

    public UIAutomationTests()
    {
        _process = Process.Start("notepad.exe");
        Thread.Sleep(500);
        
        _window = AutomationElement.RootElement.FindFirst(
            TreeScope.Children,
            new PropertyCondition(
                AutomationElement.ProcessIdProperty, 
                _process.Id
            )
        );
    }

    public void Dispose()
    {
        if (_process != null && !_process.HasExited)
        {
            _process.Kill();
        }
    }

    [Fact]
    public void Window_IsVisible()
    {
        Assert.True(_window.Current.IsOffscreen == false);
    }

    [Fact]
    public void Can_GetWindowTitle()
    {
        Assert.Contains("记事本", _window.Current.Name);
    }
}
```

## 调试工具

### Inspect 工具

Microsoft 提供的 UI 探测工具：

1. **下载**: Windows SDK 中包含
2. **位置**: `C:\Program Files (x86)\Windows Kits\10\bin\<version>\x64\inspect.exe`
3. **功能**:
   - 查看 UI 树结构
   - 查看元素属性
   - 查看支持的 Pattern
   - 模拟事件

### UISpy 工具

另一个 UI 探测工具，功能类似 Inspect。

### 使用 Inspect

1. 运行 Inspect.exe
2. 选择 "UI Automation" 模式
3. 鼠标移动到目标元素
4. 查看右侧属性面板
5. 记录 AutomationId 和 Name

### 常见配置

| 配置项 | 说明 | 示例 |
|--------|------|------|
| **AutomationId** | 自动化标识符 | "btnSubmit" |
| **Name** | 显示名称 | "提交按钮" |
| **ControlType** | 控件类型 | Button |
| **ClassName** | Win32 类名 | "Button" |

## 常见问题

### 问题 1：找不到元素

```csharp
// 确保使用正确的 TreeScope
AutomationElement element = root.FindFirst(
    TreeScope.Descendants,  // 使用 Descendants 而不是 Children
    new PropertyCondition(
        AutomationElement.NameProperty, 
        "目标元素"
    )
);
```

### 问题 2：元素不可交互

```csharp
// 检查元素状态
bool isEnabled = element.Current.IsEnabled;
bool isVisible = !element.Current.IsOffscreen;

// 使用 TryGetPropertyValue
element.TryGetPropertyValue<bool>(
    AutomationElement.IsOffscreenProperty, 
    out bool offscreen
);
```

### 问题 3：Pattern 不可用

```csharp
// 检查是否支持 Pattern
bool hasInvoke = element.GetSupportedPatterns()
    .Contains(InvokePattern.Pattern);

// 使用 TryGetCurrentPattern
if (element.TryGetCurrentPattern(
    InvokePattern.Pattern, 
    out object pattern
))
{
    InvokePattern invoke = pattern as InvokePattern;
    invoke.Invoke();
}
```

## 最佳实践

### 项目结构

```
UIAutomation/
├── Core/                    # 核心自动化类
│   ├── ElementFinder.cs
│   ├── PatternHelper.cs
│   └── EventWatcher.cs
├── Helpers/                 # 辅助工具
│   ├── WaitHelper.cs
│   └── ScreenshotHelper.cs
├── Models/                   # 数据模型
│   └── AutomationInfo.cs
├── Tests/                    # 测试
│   └── *.cs
├── appsettings.json
└── Program.cs
```

### NuGet 包管理

```xml
<!-- 推荐的核心包 -->
<PackageReference Include="FlaUI.Core" Version="3.0.0" />
<PackageReference Include="FlaUI.UIA3" Version="3.0.0" />
<PackageReference Include="FlaUI.ChromeDriver" Version="3.0.0" />
<PackageReference Include="Castle.Core" Version="5.1.0" />

<!-- 测试包 -->
<PackageReference Include="NUnit" Version="3.14.0" />
<PackageReference Include="NUnit3TestAdapter" Version="4.5.0" />
<PackageReference Include="Microsoft.NET.Test.Sdk" Version="17.6.0" />
```
