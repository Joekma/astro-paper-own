---
title: UI Automation 元素定位与查找
author: Joekma
pubDatetime: 2026-05-09T00:00:00.000+08:00
modDatetime: 2026-05-09T00:00:00.000+08:00
slug: ui-automation-element-finding
description: '详细介绍UI Automation中各种元素定位策略，包括属性查找、层级查找、条件组合等高级技巧。'
tags:
  - UI Automation
  - RPA
  - 元素定位
  - 查找元素
draft: false
language: zh-CN
---

## 概述

元素定位是 UI Automation 的核心技能。本教程将详细介绍各种查找策略和技巧，帮助你准确定位 UI 元素。

### 查找方法对比

| 方法 | 说明 | 适用场景 |
|------|------|----------|
| **FindFirst** | 查找第一个匹配元素 | 单个元素 |
| **FindAll** | 查找所有匹配元素 | 列表、表格 |
| **TreeWalker** | 遍历 UI 树 | 复杂层级 |
| **CacheRequest** | 缓存查找 | 性能优化 |

## 基本查找方法

### FindFirst

查找第一个匹配的元素：

```csharp
using System.Windows.Automation;

// 获取桌面
AutomationElement desktop = AutomationElement.RootElement;

// 基本查找
AutomationElement button = desktop.FindFirst(
    TreeScope.Children,
    new PropertyCondition(
        AutomationElement.NameProperty, 
        "确定"
    )
);

// 查找多个属性
AutomationElement searchBox = desktop.FindFirst(
    TreeScope.Descendants,
    new AndCondition(
        new PropertyCondition(
            AutomationElement.ControlTypeProperty, 
            ControlType.Edit
        ),
        new PropertyCondition(
            AutomationElement.AutomationIdProperty, 
            "searchBox"
        )
    )
);
```

### FindAll

查找所有匹配的元素：

```csharp
// 获取所有按钮
AutomationElementCollection allButtons = desktop.FindAll(
    TreeScope.Descendants,
    new PropertyCondition(
        AutomationElement.ControlTypeProperty, 
        ControlType.Button
    )
);

Console.WriteLine($"找到 {allButtons.Count} 个按钮");

// 遍历所有按钮
foreach (AutomationElement button in allButtons)
{
    Console.WriteLine($"按钮名称: {button.Current.Name}");
}
```

## 条件查找

### PropertyCondition

使用属性进行查找：

```csharp
// 按名称查找
var byName = new PropertyCondition(
    AutomationElement.NameProperty, 
    "提交"
);

// 按 AutomationId 查找
var byId = new PropertyCondition(
    AutomationElement.AutomationIdProperty, 
    "btnSubmit"
);

// 按控件类型查找
var byType = new PropertyCondition(
    AutomationElement.ControlTypeProperty, 
    ControlType.Button
);

// 按类名查找
var byClassName = new PropertyCondition(
    AutomationElement.ClassNameProperty, 
    "Button"
);
```

### AndCondition

组合多个条件（AND）：

```csharp
// 必须同时满足所有条件
var andCondition = new AndCondition(
    new PropertyCondition(
        AutomationElement.ControlTypeProperty, 
        ControlType.Button
    ),
    new PropertyCondition(
        AutomationElement.NameProperty, 
        "确定"
    ),
    new PropertyCondition(
        AutomationElement.IsEnabledProperty, 
        true
    )
);

AutomationElement element = desktop.FindFirst(
    TreeScope.Descendants, 
    andCondition
);
```

### OrCondition

组合多个条件（OR）：

```csharp
// 满足任一条件即可
var orCondition = new OrCondition(
    new PropertyCondition(
        AutomationElement.NameProperty, 
        "确定"
    ),
    new PropertyCondition(
        AutomationElement.NameProperty, 
        "OK"
    ),
    new PropertyCondition(
        AutomationElement.AutomationIdProperty, 
        "btnOK"
    )
);
```

### NotCondition

取反条件：

```csharp
// 查找未禁用的元素
var notDisabled = new NotCondition(
    new PropertyCondition(
        AutomationElement.IsEnabledProperty, 
        false
    )
);

// 查找非按钮元素
var notButton = new NotCondition(
    new PropertyCondition(
        AutomationElement.ControlTypeProperty, 
        ControlType.Button
    )
);
```

### 复杂条件组合

```csharp
// 查找启用的按钮（排除特定 ID）
var complexCondition = new AndCondition(
    new PropertyCondition(
        AutomationElement.ControlTypeProperty, 
        ControlType.Button
    ),
    new PropertyCondition(
        AutomationElement.IsEnabledProperty, 
        true
    ),
    new NotCondition(
        new PropertyCondition(
            AutomationElement.AutomationIdProperty, 
            "btnDisabled"
        )
    )
);
```

## TreeScope 查找范围

### 层级说明

```
Root (Desktop)
└── Children (直接子窗口)
    ├── Window1
    │   ├── Children (直接子控件)
    │   │   ├── Button
    │   │   └── Edit
    │   └── Descendants (所有后代)
    │       ├── Panel
    │       │   ├── Button
    │       │   └── Edit
    │       └── Toolbar
    │           └── Button
    └── Window2
```

### 使用示例

```csharp
AutomationElement root = AutomationElement.RootElement;

// 只在直接子元素中查找
var directChildren = root.FindFirst(
    TreeScope.Children,
    new PropertyCondition(
        AutomationElement.ControlTypeProperty, 
        ControlType.Window
    )
);

// 在所有后代中查找
var allDescendants = root.FindAll(
    TreeScope.Descendants,
    new PropertyCondition(
        AutomationElement.ControlTypeProperty, 
        ControlType.Button
    )
);

// 在子树中查找（包括自身）
var subtree = root.FindAll(
    TreeScope.Subtree,
    condition
);
```

## 常用查找模式

### 查找窗口

```csharp
// 通过窗口标题
public AutomationElement FindWindowByTitle(string title)
{
    AutomationElement desktop = AutomationElement.RootElement;
    
    return desktop.FindFirst(
        TreeScope.Children,
        new PropertyCondition(
            AutomationElement.NameProperty, 
            title
        )
    );
}

// 通过进程 ID
public AutomationElement FindWindowByProcess(int processId)
{
    AutomationElement desktop = AutomationElement.RootElement;
    
    return desktop.FindFirst(
        TreeScope.Children,
        new PropertyCondition(
            AutomationElement.ProcessIdProperty, 
            processId
        )
    );
}

// 通过类名
public AutomationElement FindWindowByClassName(string className)
{
    AutomationElement desktop = AutomationElement.RootElement;
    
    return desktop.FindFirst(
        TreeScope.Children,
        new PropertyCondition(
            AutomationElement.ClassNameProperty, 
            className
        )
    );
}
```

### 查找按钮

```csharp
// 查找所有按钮
public AutomationElementCollection FindAllButtons(AutomationElement root)
{
    return root.FindAll(
        TreeScope.Descendants,
        new PropertyCondition(
            AutomationElement.ControlTypeProperty, 
            ControlType.Button
        )
    );
}

// 查找特定按钮
public AutomationElement FindButtonByName(
    AutomationElement root, 
    string name)
{
    return root.FindFirst(
        TreeScope.Descendants,
        new AndCondition(
            new PropertyCondition(
                AutomationElement.ControlTypeProperty, 
                ControlType.Button
            ),
            new PropertyCondition(
                AutomationElement.NameProperty, 
                name
            )
        )
    );
}

// 查找第一个可用按钮
public AutomationElement FindFirstEnabledButton(AutomationElement root)
{
    var condition = new AndCondition(
        new PropertyCondition(
            AutomationElement.ControlTypeProperty, 
            ControlType.Button
        ),
        new PropertyCondition(
            AutomationElement.IsEnabledProperty, 
            true
        )
    );
    
    return root.FindFirst(TreeScope.Descendants, condition);
}
```

### 查找文本框

```csharp
// 查找所有文本框
public AutomationElementCollection FindAllTextBoxes(AutomationElement root)
{
    return root.FindAll(
        TreeScope.Descendants,
        new PropertyCondition(
            AutomationElement.ControlTypeProperty, 
            ControlType.Edit
        )
    );
}

// 通过 AutomationId 查找
public AutomationElement FindTextBoxById(
    AutomationElement root, 
    string automationId)
{
    return root.FindFirst(
        TreeScope.Descendants,
        new AndCondition(
            new PropertyCondition(
                AutomationElement.ControlTypeProperty, 
                ControlType.Edit
            ),
            new PropertyCondition(
                AutomationElement.AutomationIdProperty, 
                automationId
            )
        )
    );
}
```

### 查找列表项

```csharp
// 查找列表中的所有项
public AutomationElementCollection FindListItems(AutomationElement list)
{
    return list.FindAll(
        TreeScope.Children,
        new PropertyCondition(
            AutomationElement.ControlTypeProperty, 
            ControlType.ListItem
        )
    );
}

// 查找特定列表项
public AutomationElement FindListItemByName(
    AutomationElement list, 
    string itemName)
{
    return list.FindFirst(
        TreeScope.Children,
        new AndCondition(
            new PropertyCondition(
                AutomationElement.ControlTypeProperty, 
                ControlType.ListItem
            ),
            new PropertyCondition(
                AutomationElement.NameProperty, 
                itemName
            )
        )
    );
}
```

## TreeWalker 遍历

TreeWalker 用于更灵活的 UI 树遍历：

### 基本用法

```csharp
// 创建 TreeWalker
TreeWalker walker = new TreeWalker(
    new PropertyCondition(
        AutomationElement.ControlTypeProperty, 
        ControlType.Window
    )
);

// 从根开始遍历
AutomationElement node = walker.GetRootElement();
while (node != null)
{
    Console.WriteLine($"窗口: {node.Current.Name}");
    node = walker.GetNextSibling(node);
}
```

### 常用遍历方法

```csharp
// 获取第一个子元素
AutomationElement firstChild = TreeWalker.RawViewWalker.GetFirstChild(root);

// 获取最后一个子元素
AutomationElement lastChild = TreeWalker.RawViewWalker.GetLastChild(root);

// 获取下一个兄弟元素
AutomationElement nextSibling = TreeWalker.RawViewWalker.GetNextSibling(element);

// 获取上一个兄弟元素
AutomationElement prevSibling = TreeWalker.RawViewWalker.GetPreviousSibling(element);

// 获取父元素
AutomationElement parent = TreeWalker.RawViewWalker.GetParent(element);
```

### 遍历控件组

```csharp
// 遍历所有可见按钮
TreeWalker buttonWalker = new TreeWalker(
    new AndCondition(
        new PropertyCondition(
            AutomationElement.ControlTypeProperty, 
            ControlType.Button
        ),
        new PropertyCondition(
            AutomationElement.IsOffscreenProperty, 
            false
        )
    )
);

AutomationElement element = buttonWalker.GetRootElement();
while (element != null)
{
    Console.WriteLine($"按钮: {element.Current.Name}");
    element = buttonWalker.GetNextSibling(element);
}
```

## 缓存查找

### CacheRequest

使用 CacheRequest 缓存属性，提高查找性能：

```csharp
// 创建缓存请求
CacheRequest cacheRequest = new CacheRequest();

// 添加需要缓存的属性
cacheRequest.Add(AutomationElement.NameProperty);
cacheRequest.Add(AutomationElement.AutomationIdProperty);
cacheRequest.Add(AutomationElement.IsEnabledProperty);
cacheRequest.Add(AutomationElement.ControlTypeProperty);

// 设置缓存范围
cacheRequest.TreeScope = TreeScope.Children | TreeScope.Properties;

// 激活并使用
using (cacheRequest.Activate())
{
    AutomationElementCollection buttons = desktop.FindAll(
        TreeScope.Children,
        new PropertyCondition(
            AutomationElement.ControlTypeProperty, 
            ControlType.Button
        )
    );
    
    // 遍历结果（使用缓存）
    foreach (AutomationElement button in buttons)
    {
        // 从缓存获取属性（无需额外请求）
        string name = button.Cached.Name;
        string id = button.Cached.AutomationId;
        
        Console.WriteLine($"{id}: {name}");
    }
}
```

## 实用工具类

### ElementFinder 封装

```csharp
public static class ElementFinder
{
    /// <summary>
    /// 查找单个元素
    /// </summary>
    public static AutomationElement FindElement(
        AutomationElement root,
        TreeScope scope,
        string name,
        ControlType? controlType = null)
    {
        Condition condition = CreateCondition(name, controlType);
        
        return root?.FindFirst(scope, condition);
    }

    /// <summary>
    /// 查找所有匹配元素
    /// </summary>
    public static AutomationElementCollection FindElements(
        AutomationElement root,
        TreeScope scope,
        ControlType controlType)
    {
        var condition = new PropertyCondition(
            AutomationElement.ControlTypeProperty, 
            controlType
        );
        
        return root?.FindAll(scope, condition) 
            ?? new AutomationElementCollection();
    }

    /// <summary>
    /// 查找第一个启用的按钮
    /// </summary>
    public static AutomationElement FindEnabledButton(
        AutomationElement root)
    {
        var condition = new AndCondition(
            new PropertyCondition(
                AutomationElement.ControlTypeProperty, 
                ControlType.Button
            ),
            new PropertyCondition(
                AutomationElement.IsEnabledProperty, 
                true
            )
        );
        
        return root?.FindFirst(TreeScope.Descendants, condition);
    }

    private static Condition CreateCondition(
        string name, 
        ControlType? controlType)
    {
        if (controlType.HasValue)
        {
            return new AndCondition(
                new PropertyCondition(
                    AutomationElement.NameProperty, 
                    name
                ),
                new PropertyCondition(
                    AutomationElement.ControlTypeProperty, 
                    controlType.Value
                )
            );
        }
        
        return new PropertyCondition(
            AutomationElement.NameProperty, 
            name
        );
    }
}
```

### 使用示例

```csharp
// 使用工具类
AutomationElement desktop = AutomationElement.RootElement;

// 查找按钮
var button = ElementFinder.FindElement(
    desktop,
    TreeScope.Descendants,
    "确定",
    ControlType.Button
);

// 查找所有按钮
var allButtons = ElementFinder.FindElements(
    desktop,
    TreeScope.Descendants,
    ControlType.Button
);

// 查找启用的按钮
var enabledButton = ElementFinder.FindEnabledButton(desktop);
```

## 最佳实践

### 查找策略

```csharp
// ✅ 推荐：使用 AutomationId（最稳定）
var byId = new PropertyCondition(
    AutomationElement.AutomationIdProperty, 
    "submitButton"
);

// ✅ 推荐：使用控件类型 + 名称
var byTypeAndName = new AndCondition(
    new PropertyCondition(
        AutomationElement.ControlTypeProperty, 
        ControlType.Button
    ),
    new PropertyCondition(
        AutomationElement.NameProperty, 
        "提交"
    )
);

// ⚠️ 谨慎：仅使用名称（可能不唯一）
var byNameOnly = new PropertyCondition(
    AutomationElement.NameProperty, 
    "确定"
);

// ❌ 避免：使用类名（Win32 内部实现）
var byClassName = new PropertyCondition(
    AutomationElement.ClassNameProperty, 
    "Button"
);
```

### 性能优化

```csharp
// ✅ 推荐：使用缓存
using (cacheRequest.Activate())
{
    var elements = root.FindAll(scope, condition);
}

// ✅ 推荐：限制查找范围
var directChildren = root.FindFirst(
    TreeScope.Children,  // 而不是 Descendants
    condition
);

// ✅ 推荐：先定位容器再查找子元素
var container = FindWindow(root, "MainWindow");
var buttons = container.FindAll(
    TreeScope.Descendants,
    condition
);
```

### 错误处理

```csharp
try
{
    var element = root.FindFirst(
        TreeScope.Descendants,
        condition
    );
    
    if (element == null)
    {
        Console.WriteLine("未找到元素");
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
