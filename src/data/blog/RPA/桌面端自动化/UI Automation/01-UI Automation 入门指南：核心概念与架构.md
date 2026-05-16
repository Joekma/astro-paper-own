---
title: UI Automation 入门指南：核心概念与架构
series: ui-automation
author: Joekma
pubDatetime: 2026-05-09T00:00:00.000+08:00
modDatetime: 2026-05-09T00:00:00.000+08:00
slug: ui-automation-getting-started
description: '详细介绍Microsoft UI Automation框架的核心概念、架构组件和应用场景。'
tags:
  - UI Automation
  - RPA
  - 桌面自动化
  - Windows
draft: false
language: zh-CN
---

## 概述

UI Automation（用户界面自动化）是 Microsoft 提供的一个辅助功能框架，用于 Windows 应用程序的自动化测试、无障碍访问和自动化工具开发。UI Automation 提供了对 Windows 应用程序用户界面的编程访问，使测试工具和其他自动化工具能够与 UI 元素进行交互。

### 为什么选择 UI Automation？

| 特性 | 说明 |
|------|------|
| **跨语言支持** | C#、VB.NET、C++、Python 等 |
| **原生集成** | Windows 内置，无需额外安装 |
| **无障碍支持** | 专为辅助功能设计 |
| **完整覆盖** | 支持所有标准 Windows 控件 |
| **稳定可靠** | Microsoft 官方维护 |
| **深度访问** | 可访问系统级 UI 元素 |

### UI Automation vs 其他方案

| 方案 | 优点 | 缺点 |
|------|------|------|
| **UI Automation** | 原生支持、功能完整 | 仅 Windows |
| **Win32 API** | 底层控制 | 复杂、学习曲线陡峭 |
| **Selenium** | Web 专用 | 不支持桌面应用 |
| **AutoIt** | 简单易用 | 功能有限、脚本语言 |

## 架构概览

### UI Automation 架构图

```text
┌─────────────────────────────────────────────────────────────┐
│                    UI Automation 架构                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────┐   │
│  │               UI Automation API                    │   │
│  │                                                    │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐      │   │
│  │  │  Client  │  │ Provider │  │  Events │      │   │
│  │  │   API   │  │   API   │  │   API   │      │   │
│  │  └──────────┘  └──────────┘  └──────────┘      │   │
│  └────────────────────────────────────────────────────┘   │
│                            │                               │
│  ┌────────────────────────────────────────────────────┐   │
│  │               COM Interface Layer                  │   │
│  └────────────────────────────────────────────────────┘   │
│                            │                               │
│  ┌────────────────────────────────────────────────────┐   │
│  │            UIAutomationCore.dll                     │   │
│  └────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 核心组件

| 组件 | 说明 |
|------|------|
| **AutomationElement** | 代表 UI 树中的一个节点 |
| **AutomationPattern** | 定义控件支持的行为模式 |
| **AutomationProperty** | 元素的属性（名称、类型等） |
| **CacheRequest** | 缓存元素属性和模式 |
| **TreeWalker** | 遍历 UI 树 |
| **Condition** | 查找元素的条件 |

## 核心概念

### AutomationElement

AutomationElement 是 UI Automation 的核心类，代表 UI 树中的一个元素：

```csharp
using System.Windows.Automation;
using System.Diagnostics;

// 获取桌面
AutomationElement desktop = AutomationElement.RootElement;

// 获取记事本窗口
Process notepad = Process.Start("notepad");
Thread.Sleep(1000);

AutomationElement notepadWindow = desktop.FindFirst(
    TreeScope.Children,
    new PropertyCondition(AutomationElement.NameProperty, "无标题 - 记事本")
);

// 获取窗口中的元素
AutomationElement editArea = notepadWindow.FindFirst(
    TreeScope.Descendants,
    new PropertyCondition(AutomationElement.ControlTypeProperty, ControlType.Edit)
);
```

### AutomationProperty

元素属性用于描述 UI 元素的特征：

```csharp
// 获取元素的基本属性
AutomationElement element = /* 获取的元素 */;

// 获取属性值
string name = element.Current.Name;
string automationId = element.Current.AutomationId;
ControlType controlType = element.Current.ControlType;
bool isEnabled = element.Current.IsEnabled;

// 使用 TryGetPropertyValue（推荐）
if (element.TryGetPropertyValue<string>(AutomationElement.NameProperty, out string elementName))
{
    Console.WriteLine($"元素名称: {elementName}");
}
```

### 常用属性

| 属性 | 说明 | 示例 |
|------|------|------|
| **NameProperty** | 元素名称 | "确定按钮" |
| **AutomationIdProperty** | 自动化 ID | "btnSubmit" |
| **ControlTypeProperty** | 控件类型 | Button, Edit, List |
| **ClassNameProperty** | 类名 | "Button" |
| **IsEnabledProperty** | 是否启用 | true |
| **IsVisibleProperty** | 是否可见 | true |

### ControlType

ControlType 表示 UI 元素的类型：

```csharp
// 常见控件类型
ControlType.Button      // 按钮
ControlType.CheckBox   // 复选框
ControlType.ComboBox   // 组合框
ControlType.Edit       // 文本框
ControlType.List        // 列表
ControlType.Menu        // 菜单
ControlType.RadioButton // 单选按钮
ControlType.Tab         // 标签页
ControlType.Table      // 表格
ControlType.Tree       // 树形控件
ControlType.Window      // 窗口
```

## 查找元素

### 基础查找方法

```csharp
using System.Windows.Automation;

// 获取根元素（桌面）
AutomationElement root = AutomationElement.RootElement;

// FindFirst：查找第一个匹配元素
AutomationElement element = root.FindFirst(
    TreeScope.Children,  // 查找范围
    new PropertyCondition(AutomationElement.NameProperty, "确定")
);

// FindAll：查找所有匹配元素
AutomationElementCollection elements = root.FindAll(
    TreeScope.Descendants,
    new PropertyCondition(AutomationElement.ControlTypeProperty, ControlType.Button)
);

Console.WriteLine($"找到 {elements.Count} 个按钮");
```

### TreeScope 查找范围

```csharp
public enum TreeScope
{
    None      = 0,      // 无
    Parent    = 1,      // 父元素
    Children  = 2,      // 直接子元素
    Ancestors = 4,      // 祖先元素
    Descendants = 8,    // 后代元素
    Subtree  = 15      // 子树（Children + Descendants）
}
```

### Condition 条件

```csharp
// 属性条件
PropertyCondition condition = new PropertyCondition(
    AutomationElement.NameProperty,
    "提交"
);

// 复合条件 - And
AndCondition andCondition = new AndCondition(
    new PropertyCondition(AutomationElement.ControlTypeProperty, ControlType.Button),
    new PropertyCondition(AutomationElement.NameProperty, "确定")
);

// 复合条件 - Or
OrCondition orCondition = new OrCondition(
    new PropertyCondition(AutomationElement.NameProperty, "确定"),
    new PropertyCondition(AutomationElement.NameProperty, "取消")
);

// 非条件
NotCondition notCondition = new NotCondition(
    new PropertyCondition(AutomationElement.IsEnabledProperty, false)
);
```

### 实际应用

```csharp
// 查找记事本窗口中的文本区域
public AutomationElement FindNotepadTextArea()
{
    // 获取桌面
    AutomationElement desktop = AutomationElement.RootElement;
    
    // 查找记事本窗口
    AutomationElement notepadWindow = desktop.FindFirst(
        TreeScope.Children,
        new PropertyCondition(AutomationElement.ProcessIdProperty, 
            Process.GetProcessesByName("notepad")[0].Id)
    );
    
    if (notepadWindow == null)
        return null;
    
    // 查找编辑区域
    AutomationElement textArea = notepadWindow.FindFirst(
        TreeScope.Descendants,
        new PropertyCondition(AutomationElement.ControlTypeProperty, ControlType.Edit)
    );
    
    return textArea;
}
```

## AutomationPattern

AutomationPattern 定义了控件支持的行为：

### 常用模式

| 模式 | 说明 | 适用控件 |
|------|------|----------|
| **InvokePattern** | 点击操作 | Button |
| **SelectionPattern** | 选择操作 | List, ComboBox |
| **ValuePattern** | 值操作 | Edit, Slider |
| **TextPattern** | 文本操作 | Edit, Document |
| **WindowPattern** | 窗口操作 | Window |
| **TransformPattern** | 移动/调整大小 | Window |
| **ScrollPattern** | 滚动操作 | ScrollViewer |

### Pattern 使用示例

```csharp
// InvokePattern - 点击按钮
public void ClickButton(AutomationElement button)
{
    if (button == null) return;
    
    InvokePattern invokePattern = button.GetCurrentPattern(InvokePattern.Pattern) 
        as InvokePattern;
    
    if (invokePattern != null)
    {
        invokePattern.Invoke();
    }
}

// ValuePattern - 设置文本框值
public void SetTextBoxValue(AutomationElement textBox, string value)
{
    if (textBox == null) return;
    
    ValuePattern valuePattern = textBox.GetCurrentPattern(ValuePattern.Pattern) 
        as ValuePattern;
    
    if (valuePattern != null)
    {
        valuePattern.SetValue(value);
    }
}

// SelectionPattern - 选择列表项
public void SelectListItem(AutomationElement list, string itemName)
{
    if (list == null) return;
    
    SelectionPattern selectionPattern = list.GetCurrentPattern(SelectionPattern.Pattern) 
        as SelectionPattern;
    
    // 获取所有选项
    AutomationElementCollection items = list.FindAll(
        TreeScope.Children,
        new PropertyCondition(AutomationElement.ControlTypeProperty, ControlType.ListItem)
    );
    
    foreach (AutomationElement item in items)
    {
        if (item.Current.Name == itemName)
        {
            SelectionItemPattern itemPattern = item.GetCurrentPattern(
                SelectionItemPattern.Pattern) as SelectionItemPattern;
            itemPattern?.Select();
            break;
        }
    }
}
```

## 事件处理

### 订阅事件

```csharp
using System.Windows.Automation;

// 事件处理器
public void OnElementAdded(object sender, AutomationEventArgs e)
{
    AutomationElement element = sender as AutomationElement;
    Console.WriteLine($"元素添加: {element?.Current.Name}");
}

// 订阅事件
AutomationEventHandler addedHandler = new AutomationEventHandler(OnElementAdded);
Automation.AddAutomationEventHandler(
    WindowPattern.WindowOpenedEvent,
    AutomationElement.RootElement,
    TreeScope.Subtree,
    addedHandler
);

// 移除事件处理
Automation.RemoveAutomationEventHandler(
    WindowPattern.WindowOpenedEvent,
    AutomationElement.RootElement,
    addedHandler
);
```

### 常用事件

| 事件 | 说明 |
|------|------|
| **WindowPattern.WindowOpenedEvent** | 窗口打开 |
| **WindowPattern.WindowClosedEvent** | 窗口关闭 |
| **InvokePattern.InvokedEvent** | 按钮点击 |
| **SelectionPattern.SelectionChangedEvent** | 选择变化 |
| **PropertyChangedEvent** | 属性变化 |
| **ToolTipOpenedEvent** | 工具提示打开 |

## 第一个示例程序

### 完整示例：操作记事本

```csharp
using System;
using System.Diagnostics;
using System.Windows.Automation;
using System.Threading;

class NotepadAutomation
{
    static void Main()
    {
        // 启动记事本
        Process notepad = Process.Start("notepad");
        Thread.Sleep(500);
        
        // 获取桌面
        AutomationElement desktop = AutomationElement.RootElement;
        
        // 查找记事本窗口
        AutomationElement notepadWindow = desktop.FindFirst(
            TreeScope.Children,
            new PropertyCondition(
                AutomationElement.ProcessIdProperty, 
                notepad.Id
            )
        );
        
        if (notepadWindow == null)
        {
            Console.WriteLine("找不到记事本窗口");
            return;
        }
        
        Console.WriteLine($"窗口标题: {notepadWindow.Current.Name}");
        
        // 查找文本编辑区
        AutomationElement textArea = notepadWindow.FindFirst(
            TreeScope.Descendants,
            new PropertyCondition(
                AutomationElement.ControlTypeProperty, 
                ControlType.Edit
            )
        );
        
        if (textArea != null)
        {
            // 使用 ValuePattern 输入文本
            ValuePattern valuePattern = textArea.GetCurrentPattern(
                ValuePattern.Pattern) as ValuePattern;
            
            if (valuePattern != null)
            {
                valuePattern.SetValue("Hello, UI Automation!");
                Console.WriteLine("已输入文本");
            }
        }
        
        Console.WriteLine("按任意键关闭记事本...");
        Console.ReadKey();
        
        // 关闭窗口
        notepad.Kill();
    }
}
```

## 最佳实践

### 性能优化

```csharp
// 使用 CacheRequest 缓存属性
CacheRequest cacheRequest = new CacheRequest();
cacheRequest.Add(AutomationElement.NameProperty);
cacheRequest.Add(AutomationElement.AutomationIdProperty);
cacheRequest.Add(AutomationElement.IsEnabledProperty);
cacheRequest.TreeScope = TreeScope.Children;

// 启用缓存并查找
using (cacheRequest.Activate())
{
    AutomationElementCollection buttons = desktop.FindAll(
        TreeScope.Children,
        new PropertyCondition(
            AutomationElement.ControlTypeProperty, 
            ControlType.Button
        )
    );
}
```

### 错误处理

```csharp
try
{
    AutomationElement element = desktop.FindFirst(
        TreeScope.Children,
        new PropertyCondition(
            AutomationElement.NameProperty, 
            "目标窗口"
        )
    );
    
    if (element == null)
    {
        Console.WriteLine("未找到目标元素");
        return;
    }
    
    // 操作元素
}
catch (ElementNotAvailableException)
{
    Console.WriteLine("元素不可用，可能已被关闭");
}
catch (InvalidOperationException)
{
    Console.WriteLine("操作无效");
}
```

### 等待元素出现

```csharp
public AutomationElement WaitForElement(
    AutomationElement root,
    string elementName,
    int timeoutSeconds = 10)
{
    DateTime start = DateTime.Now;
    
    while ((DateTime.Now - start).TotalSeconds < timeoutSeconds)
    {
        AutomationElement element = root.FindFirst(
            TreeScope.Children,
            new PropertyCondition(AutomationElement.NameProperty, elementName)
        );
        
        if (element != null)
            return element;
        
        Thread.Sleep(500);
    }
    
    return null;
}
```
