---
title: UI Automation 控件操作与交互
series: ui-automation
seriesOrder: 4
author: Joekma
pubDatetime: 2026-05-09T00:00:00.000+08:00
modDatetime: 2026-05-09T00:00:00.000+08:00
slug: ui-automation-control-operations
description: '详细介绍UI Automation中各种控件的操作方法，包括按钮点击、文本输入、选择操作等。'
tags:
  - UI Automation
  - RPA
  - 控件操作
  - 用户交互
draft: false
language: zh-CN
---

## 概述

UI Automation 提供了丰富的控件操作能力。本教程将详细介绍如何操作各种 UI 控件，包括按钮点击、文本输入、列表选择等常见操作。

### 控件操作类型

```text
┌─────────────────────────────────────────────────────────────┐
│                    控件操作类型                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   基础操作   │  │   容器操作   │  │   窗口操作   │      │
│  │              │  │              │  │              │      │
│  │  • Invoke    │  │  • Select   │  │  • Move     │      │
│  │  • Click     │  │  • Expand   │  │  • Resize   │      │
│  │  • SetValue  │  │  • Scroll  │  │  • Minimize │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 按钮操作

### InvokePattern 点击

```csharp
using System.Windows.Automation;

// 获取按钮
AutomationElement button = FindButtonByName(root, "提交");

if (button != null)
{
    // 获取 InvokePattern
    InvokePattern invokePattern = button.GetCurrentPattern(
        InvokePattern.Pattern
    ) as InvokePattern;
    
    if (invokePattern != null)
    {
        // 执行点击
        invokePattern.Invoke();
        Console.WriteLine("按钮已点击");
    }
}
```

### 使用 PatternHelper

```csharp
public static class PatternHelper
{
    public static void Invoke(AutomationElement element)
    {
        if (element == null) return;
        
        var pattern = element.GetCurrentPattern(
            InvokePattern.Pattern
        ) as InvokePattern;
        
        pattern?.Invoke();
    }

    public static void ClickButton(AutomationElement root, string name)
    {
        var button = FindElementByNameAndType(
            root, 
            name, 
            ControlType.Button
        );
        
        Invoke(button);
    }
}

// 使用
PatternHelper.ClickButton(desktop, "确定");
PatternHelper.Invoke(buttonElement);
```

## 文本框操作

### ValuePattern 输入

```csharp
// 获取文本框
AutomationElement textBox = root.FindFirst(
    TreeScope.Descendants,
    new PropertyCondition(
        AutomationElement.AutomationIdProperty, 
        "username"
    )
);

if (textBox != null)
{
    // 获取 ValuePattern
    ValuePattern valuePattern = textBox.GetCurrentPattern(
        ValuePattern.Pattern
    ) as ValuePattern;
    
    if (valuePattern != null)
    {
        // 设置文本值
        valuePattern.SetValue("admin");
        Console.WriteLine("已输入文本");
    }
}
```

### TextPattern 读取

```csharp
// 获取文本内容
TextPattern textPattern = textBox.GetCurrentPattern(
    TextPattern.Pattern
) as TextPattern;

if (textPattern != null)
{
    // 获取全文
    string text = textPattern.DocumentRange.GetText(-1);
    Console.WriteLine($"文本内容: {text}");
}
```

### 完整示例

```csharp
public static class TextBoxHelper
{
    /// <summary>
    /// 设置文本框值
    /// </summary>
    public static void SetValue(AutomationElement textBox, string value)
    {
        if (textBox == null) return;
        
        ValuePattern valuePattern = textBox.GetCurrentPattern(
            ValuePattern.Pattern
        ) as ValuePattern;
        
        if (valuePattern != null)
        {
            valuePattern.SetValue(value);
        }
    }

    /// <summary>
    /// 获取文本框值
    /// </summary>
    public static string GetValue(AutomationElement textBox)
    {
        if (textBox == null) return string.Empty;
        
        ValuePattern valuePattern = textBox.GetCurrentPattern(
            ValuePattern.Pattern
        ) as ValuePattern;
        
        return valuePattern?.Current.Value ?? string.Empty;
    }

    /// <summary>
    /// 清空文本框
    /// </summary>
    public static void Clear(AutomationElement textBox)
    {
        SetValue(textBox, string.Empty);
    }

    /// <summary>
    /// 追加文本
    /// </summary>
    public static void AppendText(AutomationElement textBox, string text)
    {
        string current = GetValue(textBox);
        SetValue(textBox, current + text);
    }
}

// 使用
var usernameBox = FindTextBox(desktop, "username");
TextBoxHelper.SetValue(usernameBox, "admin");
TextBoxHelper.Clear(usernameBox);
```

## 列表和下拉框操作

### SelectionPattern 选择

```csharp
// 获取列表/下拉框
AutomationElement comboBox = root.FindFirst(
    TreeScope.Descendants,
    new PropertyCondition(
        AutomationElement.AutomationIdProperty, 
        "countryComboBox"
    )
);

if (comboBox != null)
{
    // 获取 SelectionPattern
    SelectionPattern selectionPattern = comboBox.GetCurrentPattern(
        SelectionPattern.Pattern
    ) as SelectionPattern;
    
    // 获取所有选项
    AutomationElementCollection options = comboBox.FindAll(
        TreeScope.Children,
        new PropertyCondition(
            AutomationElement.ControlTypeProperty, 
            ControlType.ListItem
        )
    );
    
    // 选择特定选项
    foreach (AutomationElement option in options)
    {
        if (option.Current.Name == "China")
        {
            SelectionItemPattern itemPattern = option.GetCurrentPattern(
                SelectionItemPattern.Pattern
            ) as SelectionItemPattern;
            
            itemPattern?.Select();
            break;
        }
    }
}
```

### SelectionItemPattern

```csharp
public static class SelectionHelper
{
    /// <summary>
    /// 按名称选择项
    /// </summary>
    public static void SelectByName(
        AutomationElement container, 
        string itemName)
    {
        var options = container.FindAll(
            TreeScope.Children,
            new PropertyCondition(
                AutomationElement.ControlTypeProperty, 
                ControlType.ListItem
            )
        );
        
        foreach (AutomationElement option in options)
        {
            if (option.Current.Name == itemName)
            {
                var itemPattern = option.GetCurrentPattern(
                    SelectionItemPattern.Pattern
                ) as SelectionItemPattern;
                
                itemPattern?.Select();
                break;
            }
        }
    }

    /// <summary>
    /// 获取当前选中项
    /// </summary>
    public static AutomationElement GetSelectedItem(
        AutomationElement container)
    {
        SelectionPattern selectionPattern = container.GetCurrentPattern(
            SelectionPattern.Pattern
        ) as SelectionPattern;
        
        return selectionPattern?.Current.selection[0];
    }

    /// <summary>
    /// 验证是否选中
    /// </summary>
    public static bool IsSelected(AutomationElement item)
    {
        SelectionItemPattern itemPattern = item.GetCurrentPattern(
            SelectionItemPattern.Pattern
        ) as SelectionItemPattern;
        
        return itemPattern?.Current.IsSelected ?? false;
    }
}
```

## 复选框和单选按钮

### TogglePattern 复选框

```csharp
// 获取复选框
AutomationElement checkBox = root.FindFirst(
    TreeScope.Descendants,
    new PropertyCondition(
        AutomationElement.AutomationIdProperty, 
        "rememberMe"
    )
);

if (checkBox != null)
{
    // 获取 TogglePattern
    TogglePattern togglePattern = checkBox.GetCurrentPattern(
        TogglePattern.Pattern
    ) as TogglePattern;
    
    if (togglePattern != null)
    {
        // 获取当前状态
        ToggleState state = togglePattern.Current.ToggleState;
        
        // 切换状态
        togglePattern.Toggle();
        
        Console.WriteLine($"复选框状态: {state}");
    }
}

public static class CheckBoxHelper
{
    public static void SetCheck(AutomationElement checkBox, bool isChecked)
    {
        if (checkBox == null) return;
        
        TogglePattern togglePattern = checkBox.GetCurrentPattern(
            TogglePattern.Pattern
        ) as TogglePattern;
        
        if (togglePattern != null)
        {
            bool currentState = togglePattern.Current.ToggleState == ToggleState.On;
            
            if (currentState != isChecked)
            {
                togglePattern.Toggle();
            }
        }
    }

    public static bool IsChecked(AutomationElement checkBox)
    {
        TogglePattern togglePattern = checkBox.GetCurrentPattern(
            TogglePattern.Pattern
        ) as TogglePattern;
        
        return togglePattern?.Current.ToggleState == ToggleState.On;
    }
}
```

### 单选按钮

```csharp
// 获取单选按钮组
AutomationElement radioGroup = root.FindFirst(
    TreeScope.Descendants,
    new AndCondition(
        new PropertyCondition(
            AutomationElement.ControlTypeProperty, 
            ControlType.RadioButton
        ),
        new PropertyCondition(
            AutomationElement.NameProperty, 
            "Male"
        )
    )
);

if (radioGroup != null)
{
    SelectionItemPattern itemPattern = radioGroup.GetCurrentPattern(
        SelectionItemPattern.Pattern
    ) as SelectionItemPattern;
    
    itemPattern?.Select();
}
```

## 滚动操作

### ScrollPattern

```csharp
// 获取滚动视图
AutomationElement scrollViewer = root.FindFirst(
    TreeScope.Descendants,
    new PropertyCondition(
        AutomationElement.ControlTypeProperty, 
        ControlType.Scroll
    )
);

if (scrollViewer != null)
{
    ScrollPattern scrollPattern = scrollViewer.GetCurrentPattern(
        ScrollPattern.Pattern
    ) as ScrollPattern;
    
    if (scrollPattern != null)
    {
        // 滚动到百分比位置
        scrollPattern.SetScrollPercent(0, 50);  // 水平0%, 垂直50%
        
        // 垂直滚动
        scrollPattern.Scroll(ScrollAmount.NoAmount, ScrollAmount.LargeIncrement);
        
        // 水平滚动
        scrollPattern.Scroll(ScrollAmount.LargeIncrement, ScrollAmount.NoAmount);
    }
}

public static class ScrollHelper
{
    public static void ScrollToTop(AutomationElement scrollViewer)
    {
        ScrollPattern scrollPattern = scrollViewer.GetCurrentPattern(
            ScrollPattern.Pattern
        ) as ScrollPattern;
        
        scrollPattern?.SetScrollPercent(0, 0);
    }

    public static void ScrollToBottom(AutomationElement scrollViewer)
    {
        ScrollPattern scrollPattern = scrollViewer.GetCurrentPattern(
            ScrollPattern.Pattern
        ) as ScrollPattern;
        
        scrollPattern?.SetScrollPercent(0, 100);
    }

    public static void ScrollDown(AutomationElement scrollViewer)
    {
        ScrollPattern scrollPattern = scrollViewer.GetCurrentPattern(
            ScrollPattern.Pattern
        ) as ScrollPattern;
        
        scrollPattern?.Scroll(ScrollAmount.NoAmount, ScrollAmount.LargeIncrement);
    }

    public static void ScrollUp(AutomationElement scrollViewer)
    {
        ScrollPattern scrollPattern = scrollViewer.GetCurrentPattern(
            ScrollPattern.Pattern
        ) as ScrollPattern;
        
        scrollPattern?.Scroll(ScrollAmount.NoAmount, ScrollAmount.LargeDecrement);
    }
}
```

## 窗口操作

### WindowPattern

```csharp
// 获取窗口
AutomationElement window = root.FindFirst(
    TreeScope.Children,
    new PropertyCondition(
        AutomationElement.ControlTypeProperty, 
        ControlType.Window
    )
);

if (window != null)
{
    WindowPattern windowPattern = window.GetCurrentPattern(
        WindowPattern.Pattern
    ) as WindowPattern;
    
    if (windowPattern != null)
    {
        // 关闭窗口
        windowPattern.Close();
        
        // 最大化
        windowPattern.SetWindowVisualState(WindowVisualState.Maximized);
        
        // 最小化
        windowPattern.SetWindowVisualState(WindowVisualState.Minimized);
        
        // 还原
        windowPattern.SetWindowVisualState(WindowVisualState.Normal);
        
        // 移动窗口
        windowPattern.SetWindowPosition(new System.Windows.Point(100, 100));
        
        // 设置窗口大小
        windowPattern.SetWindowVisualState(WindowVisualState.Maximized);
    }
}

public static class WindowHelper
{
    public static void Maximize(AutomationElement window)
    {
        WindowPattern windowPattern = window.GetCurrentPattern(
            WindowPattern.Pattern
        ) as WindowPattern;
        
        windowPattern?.SetWindowVisualState(WindowVisualState.Maximized);
    }

    public static void Minimize(AutomationElement window)
    {
        WindowPattern windowPattern = window.GetCurrentPattern(
            WindowPattern.Pattern
        ) as WindowPattern;
        
        windowPattern?.SetWindowVisualState(WindowVisualState.Minimized);
    }

    public static void Restore(AutomationElement window)
    {
        WindowPattern windowPattern = window.GetCurrentPattern(
            WindowPattern.Pattern
        ) as WindowPattern;
        
        windowPattern?.SetWindowVisualState(WindowVisualState.Normal);
    }

    public static void Close(AutomationElement window)
    {
        WindowPattern windowPattern = window.GetCurrentPattern(
            WindowPattern.Pattern
        ) as WindowPattern;
        
        windowPattern?.Close();
    }

    public static void MoveTo(AutomationElement window, int x, int y)
    {
        WindowPattern windowPattern = window.GetCurrentPattern(
            WindowPattern.Pattern
        ) as WindowPattern;
        
        windowPattern?.SetWindowPosition(new System.Windows.Point(x, y));
    }
}
```

## 菜单操作

### 菜单选择

```csharp
// 点击菜单项
public static void ClickMenuItem(
    AutomationElement menuBar, 
    params string[] path)
{
    AutomationElement current = menuBar;
    
    for (int i = 0; i < path.Length; i++)
    {
        // 展开菜单
        ExpandCollapsePattern expandPattern = current.GetCurrentPattern(
            ExpandCollapsePattern.Pattern
        ) as ExpandCollapsePattern;
        
        expandPattern?.Expand();
        
        // 查找子菜单项
        AutomationElement next = current.FindFirst(
            TreeScope.Children,
            new AndCondition(
                new PropertyCondition(
                    AutomationElement.ControlTypeProperty, 
                    ControlType.MenuItem
                ),
                new PropertyCondition(
                    AutomationElement.NameProperty, 
                    path[i]
                )
            )
        );
        
        if (next == null) break;
        
        // 如果是最后一项，则点击
        if (i == path.Length - 1)
        {
            InvokePattern invokePattern = next.GetCurrentPattern(
                InvokePattern.Pattern
            ) as InvokePattern;
            
            invokePattern?.Invoke();
        }
        else
        {
            current = next;
        }
    }
}

// 使用
ClickMenuItem(menuBar, "文件", "新建", "项目");
```

## 滑动条操作

### RangeValuePattern

```csharp
// 获取滑动条
AutomationElement slider = root.FindFirst(
    TreeScope.Descendants,
    new PropertyCondition(
        AutomationElement.AutomationIdProperty, 
        "volumeSlider"
    )
);

if (slider != null)
{
    RangeValuePattern rangePattern = slider.GetCurrentPattern(
        RangeValuePattern.Pattern
    ) as RangeValuePattern;
    
    if (rangePattern != null)
    {
        // 获取范围
        double min = rangePattern.Current.Minimum;
        double max = rangePattern.Current.Maximum;
        double current = rangePattern.Current.Value;
        
        Console.WriteLine($"范围: {min} - {max}, 当前值: {current}");
        
        // 设置值
        rangePattern.SetValue(75);  // 设置为 75
    }
}

public static class SliderHelper
{
    public static void SetValue(AutomationElement slider, double value)
    {
        RangeValuePattern rangePattern = slider.GetCurrentPattern(
            RangeValuePattern.Pattern
        ) as RangeValuePattern;
        
        if (rangePattern != null)
        {
            double min = rangePattern.Current.Minimum;
            double max = rangePattern.Current.Maximum;
            double clampedValue = Math.Max(min, Math.Min(max, value));
            
            rangePattern.SetValue(clampedValue);
        }
    }

    public static double GetValue(AutomationElement slider)
    {
        RangeValuePattern rangePattern = slider.GetCurrentPattern(
            RangeValuePattern.Pattern
        ) as RangeValuePattern;
        
        return rangePattern?.Current.Value ?? 0;
    }
}
```

## 完整示例

```csharp
public class UIAutomationDemo
{
    public static void Main()
    {
        // 启动记事本
        Process notepad = Process.Start("notepad.exe");
        Thread.Sleep(500);
        
        // 获取窗口
        AutomationElement notepadWindow = AutomationElement.RootElement.FindFirst(
            TreeScope.Children,
            new PropertyCondition(
                AutomationElement.ProcessIdProperty, 
                notepad.Id
            )
        );
        
        // 查找文本框
        AutomationElement textBox = notepadWindow.FindFirst(
            TreeScope.Descendants,
            new PropertyCondition(
                AutomationElement.ControlTypeProperty, 
                ControlType.Edit
            )
        );
        
        // 输入文本
        TextBoxHelper.SetValue(textBox, "Hello, UI Automation!");
        
        // 查找菜单
        var menuBar = notepadWindow.FindFirst(
            TreeScope.Children,
            new PropertyCondition(
                AutomationElement.ControlTypeProperty, 
                ControlType.MenuBar
            )
        );
        
        // 关闭记事本
        WindowHelper.Close(notepadWindow);
        
        Console.WriteLine("操作完成");
    }
}
```
