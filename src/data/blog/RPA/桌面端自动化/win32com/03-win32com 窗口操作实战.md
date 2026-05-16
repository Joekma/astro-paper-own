---
title: pywin32 窗口操作实战
series: pywin32
author: Joekma
pubDatetime: 2026-05-09T00:00:00.000+08:00
modDatetime: 2026-05-09T00:00:00.000+08:00
slug: win32com-window-operations
description: '详细介绍使用 pywin32 进行窗口操作的实战技巧，包括窗口查找、控件操作、消息发送等。'
tags:
  - pywin32
  - Win32 API
  - RPA
  - 窗口操作
  - 桌面自动化
draft: false
language: zh-CN
---

## 概述

窗口操作是 Windows 自动化中最常见的任务。本教程将详细介绍如何使用 pywin32 进行窗口的查找、遍历、操作和控制。

### 窗口操作类型

```text
┌─────────────────────────────────────────────────────────────┐
│                    窗口操作类型                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   查找操作   │  │   控制操作   │  │   通信操作   │      │
│  │              │  │              │  │              │      │
│  │  • FindWindow│  │  • 显示/隐藏│  │  • SendMessage│     │
│  │  • EnumWindows│ │  • 移动/缩放│  │  • PostMessage│     │
│  │  • ChildWindows│ │  • 激活/置顶│  │  • WM_COMMAND│     │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 窗口查找

### 按标题查找

```python
import win32gui
import win32con

# 精确匹配标题
hwnd = win32gui.FindWindow(None, "无标题 - 记事本")
print(f"找到窗口: {hwnd}")

# 模糊匹配（需要枚举）
def find_window_fuzzy(title_part):
    """模糊查找窗口"""
    windows = []
    
    def callback(hwnd, _):
        if win32gui.IsWindowVisible(hwnd):
            title = win32gui.GetWindowText(hwnd)
            if title_part.lower() in title.lower():
                windows.append((hwnd, title))
        return True
    
    win32gui.EnumWindows(callback, None)
    return windows

# 使用
results = find_window_fuzzy("记事本")
for hwnd, title in results:
    print(f"{hwnd}: {title}")
```

### 按类名查找

```python
# 精确匹配类名
hwnd = win32gui.FindWindow("Notepad", None)
print(f"记事本类名: {hwnd}")

# 查找类名中包含特定字符串的窗口
def find_by_class_pattern(pattern):
    """按类名模式查找"""
    windows = []
    
    def callback(hwnd, _):
        if win32gui.IsWindowVisible(hwnd):
            class_name = win32gui.GetClassName(hwnd)
            if pattern.lower() in class_name.lower():
                windows.append({
                    'hwnd': hwnd,
                    'class': class_name,
                    'title': win32gui.GetWindowText(hwnd)
                })
        return True
    
    win32gui.EnumWindows(callback, None)
    return windows

# 使用
results = find_by_class_pattern("Edit")
for r in results:
    print(f"类名包含Edit: {r['class']} - {r['title']}")
```

### 枚举所有窗口

```python
def get_all_windows():
    """获取所有窗口信息"""
    windows = []
    
    def callback(hwnd, _):
        if win32gui.IsWindowVisible(hwnd):
            title = win32gui.GetWindowText(hwnd)
            class_name = win32gui.GetClassName(hwnd)
            rect = win32gui.GetWindowRect(hwnd)
            
            windows.append({
                'hwnd': hwnd,
                'title': title,
                'class': class_name,
                'rect': rect,
                'width': rect[2] - rect[0],
                'height': rect[3] - rect[1]
            })
        return True
    
    win32gui.EnumWindows(callback, None)
    return windows

# 使用
all_windows = get_all_windows()
print(f"共找到 {len(all_windows)} 个可见窗口")

# 按标题排序
all_windows.sort(key=lambda x: x['title'])
for w in all_windows[:10]:
    print(f"{w['hwnd']:08x} | {w['title'][:40]:40s} | {w['class']}")
```

## 子窗口操作

### 查找子窗口

```python
# 查找第一个子窗口
parent_hwnd = win32gui.FindWindow(None, "无标题 - 记事本")
child_hwnd = win32gui.FindWindowEx(parent_hwnd, 0, "Edit", None)
print(f"编辑区: {child_hwnd}")

# 查找所有子窗口
def get_child_windows(parent_hwnd):
    """获取所有子窗口"""
    children = []
    
    def callback(hwnd, _):
        children.append({
            'hwnd': hwnd,
            'class': win32gui.GetClassName(hwnd),
            'title': win32gui.GetWindowText(hwnd)
        })
        return True
    
    win32gui.EnumChildWindows(parent_hwnd, callback, None)
    return children

# 使用
parent = win32gui.FindWindow(None, "无标题 - 记事本")
children = get_child_windows(parent)
for child in children:
    print(f"子窗口: {child['class']} - {child['title']}")
```

### 递归查找子窗口

```python
def get_all_descendants(hwnd, depth=0):
    """递归获取所有后代窗口"""
    results = []
    
    child = win32gui.GetWindow(hwnd, win32con.GW_CHILD)
    while child:
        results.append({
            'hwnd': child,
            'class': win32gui.GetClassName(child),
            'title': win32gui.GetWindowText(child),
            'depth': depth
        })
        
        # 递归获取子窗口
        results.extend(get_all_descendants(child, depth + 1))
        
        # 获取下一个兄弟窗口
        child = win32gui.GetWindow(child, win32con.GW_HWNDNEXT)
    
    return results

# 使用
parent = win32gui.FindWindow(None, "无标题 - 记事本")
descendants = get_all_descendants(parent)
for d in descendants:
    indent = "  " * d['depth']
    print(f"{indent}{d['class']} - {d['title']}")
```

## 窗口控制

### 显示和隐藏

```python
import win32gui
import win32con

hwnd = win32gui.FindWindow(None, "无标题 - 记事本")

# 显示窗口
win32gui.ShowWindow(hwnd, win32con.SW_SHOW)

# 隐藏窗口
win32gui.ShowWindow(hwnd, win32con.SW_HIDE)

# 最小化
win32gui.ShowWindow(hwnd, win32con.SW_MINIMIZE)

# 最大化
win32gui.ShowWindow(hwnd, win32con.SW_MAXIMIZE)

# 还原
win32gui.ShowWindow(hwnd, win32con.SW_RESTORE)

# 激活并显示
win32gui.ShowWindow(hwnd, win32con.SW_SHOW)
win32gui.SetForegroundWindow(hwnd)
```

### 移动和缩放

```python
# 方法1：SetWindowPos
win32gui.SetWindowPos(
    hwnd,           # 窗口句柄
    0,              # 插入句柄（0 表示不变）
    100,            # x 位置
    100,            # y 位置
    800,            # 宽度
    600,            # 高度
    win32con.SWP_NOZORDER  # 标志
)

# 方法2：MoveWindow
win32gui.MoveWindow(hwnd, 100, 100, 800, 600, True)

# 移动到屏幕中心
import win32api
screen_width = win32api.GetSystemMetrics(win32con.SM_CXSCREEN)
screen_height = win32api.GetSystemMetrics(win32con.SM_CYSCREEN)

rect = win32gui.GetWindowRect(hwnd)
win_width = rect[2] - rect[0]
win_height = rect[3] - rect[1]

center_x = (screen_width - win_width) // 2
center_y = (screen_height - win_height) // 2

win32gui.MoveWindow(hwnd, center_x, center_y, win_width, win_height, True)
```

### 窗口置顶

```python
# 置顶窗口
win32gui.SetWindowPos(
    hwnd,
    win32con.HWND_TOPMOST,  # 置顶
    0, 0, 0, 0,
    win32con.SWP_NOMOVE | win32con.SWP_NOSIZE
)

# 取消置顶
win32gui.SetWindowPos(
    hwnd,
    win32con.HWND_NOTOPMOST,  # 取消置顶
    0, 0, 0, 0,
    win32con.SWP_NOMOVE | win32con.SWP_NOSIZE
)

# 激活窗口
win32gui.SetForegroundWindow(hwnd)
win32gui.SetActiveWindow(hwnd)
```

## 消息发送

### 发送关闭消息

```python
import win32gui
import win32con

hwnd = win32gui.FindWindow(None, "无标题 - 记事本")

# 发送 WM_CLOSE 消息关闭窗口
win32gui.PostMessage(hwnd, win32con.WM_CLOSE, 0, 0)

# 发送 WM_QUIT 退出消息
win32gui.PostMessage(hwnd, win32con.WM_QUIT, 0, 0)

# 强制终止（SendMessage 等待处理）
win32gui.SendMessage(hwnd, win32con.WM_CLOSE, 0, 0)
```

### 发送按键消息

```python
# 获取编辑区句柄
hwnd = win32gui.FindWindow(None, "无标题 - 记事本")
edit_hwnd = win32gui.FindWindowEx(hwnd, 0, "Edit", None)

# 激活窗口
win32gui.SetForegroundWindow(hwnd)
win32gui.SetFocus(edit_hwnd)

# 发送字符
for char in "Hello, World!":
    # WM_KEYDOWN
    win32gui.PostMessage(
        edit_hwnd,
        win32con.WM_KEYDOWN,
        ord(char),
        0
    )
    # WM_CHAR
    win32gui.PostMessage(
        edit_hwnd,
        win32con.WM_CHAR,
        ord(char),
        0
    )
    # WM_KEYUP
    win32gui.PostMessage(
        edit_hwnd,
        win32con.WM_KEYUP,
        ord(char),
        0
    )

# 发送特殊键
# Enter
win32gui.PostMessage(edit_hwnd, win32con.WM_KEYDOWN, win32con.VK_RETURN, 0)
win32gui.PostMessage(edit_hwnd, win32con.WM_KEYUP, win32con.VK_RETURN, 0)

# Tab
win32gui.PostMessage(edit_hwnd, win32con.WM_KEYDOWN, win32con.VK_TAB, 0)
win32gui.PostMessage(edit_hwnd, win32con.WM_KEYUP, win32con.VK_TAB, 0)
```

### 发送鼠标消息

```python
import win32api

# 获取按钮位置
button_hwnd = win32gui.FindWindowEx(parent_hwnd, 0, "Button", "确定")
rect = win32gui.GetWindowRect(button_hwnd)

# 按钮中心坐标
center_x = (rect[0] + rect[2]) // 2
center_y = (rect[1] + rect[3]) // 2

# 移动鼠标到按钮位置
win32api.SetCursorPos((center_x, center_y))

# 发送鼠标左键按下
win32api.mouse_event(
    win32con.MOUSEEVENTF_LEFTDOWN,
    0, 0, 0, 0
)

# 发送鼠标左键释放
win32api.mouse_event(
    win32con.MOUSEEVENTF_LEFTUP,
    0, 0, 0, 0
)

# 或者使用 PostMessage
win32api.PostMessage(
    button_hwnd,
    win32con.BM_CLICK,
    0, 0
)
```

## 完整示例

### 自动化记事本

```python
import win32gui
import win32con
import win32process
import win32api
import time

class NotepadAutomation:
    """记事本自动化"""
    
    def __init__(self):
        self.hwnd = None
        self.edit_hwnd = None
        self.process_id = None
    
    def launch(self):
        """启动记事本"""
        process_info = win32process.CreateProcess(
            r"C:\Windows\System32\notepad.exe",
            "",
            None,
            None,
            0,
            win32process.CREATE_NEW_CONSOLE,
            None,
            None,
            win32process.STARTUPINFO()
        )
        
        self.hwnd, _, self.process_id, _ = process_info
        time.sleep(0.3)
        
        # 查找编辑区
        self.edit_hwnd = win32gui.FindWindowEx(
            self.hwnd, 0, "Edit", None
        )
        
        return self
    
    def type_text(self, text):
        """输入文本"""
        if not self.edit_hwnd:
            raise Exception("编辑区未找到")
        
        win32gui.SetFocus(self.edit_hwnd)
        
        for char in text:
            win32gui.PostMessage(
                self.edit_hwnd,
                win32con.WM_CHAR,
                ord(char),
                0
            )
            time.sleep(0.01)
    
    def select_all(self):
        """全选"""
        if not self.edit_hwnd:
            return
        
        win32gui.SetFocus(self.edit_hwnd)
        
        # Ctrl+A
        win32api.keybd_event(win32con.VK_CONTROL, 0, 0, 0)
        win32api.keybd_event(ord('A'), 0, 0, 0)
        win32api.keybd_event(ord('A'), 0, win32con.KEYEVENTF_KEYUP, 0)
        win32api.keybd_event(win32con.VK_CONTROL, 0, win32con.KEYEVENTF_KEYUP, 0)
    
    def copy(self):
        """复制"""
        if not self.edit_hwnd:
            return
        
        win32api.keybd_event(win32con.VK_CONTROL, 0, 0, 0)
        win32api.keybd_event(ord('C'), 0, 0, 0)
        win32api.keybd_event(ord('C'), 0, win32con.KEYEVENTF_KEYUP, 0)
        win32api.keybd_event(win32con.VK_CONTROL, 0, win32con.KEYEVENTF_KEYUP, 0)
    
    def paste(self):
        """粘贴"""
        if not self.edit_hwnd:
            return
        
        win32gui.SetFocus(self.edit_hwnd)
        
        win32api.keybd_event(win32con.VK_CONTROL, 0, 0, 0)
        win32api.keybd_event(ord('V'), 0, 0, 0)
        win32api.keybd_event(ord('V'), 0, win32con.KEYEVENTF_KEYUP, 0)
        win32api.keybd_event(win32con.VK_CONTROL, 0, win32con.KEYEVENTF_KEYUP, 0)
    
    def close(self):
        """关闭窗口"""
        if self.hwnd:
            win32gui.PostMessage(
                self.hwnd,
                win32con.WM_CLOSE,
                0, 0
            )
    
    def maximize(self):
        """最大化窗口"""
        if self.hwnd:
            win32gui.ShowWindow(self.hwnd, win32con.SW_MAXIMIZE)
    
    def minimize(self):
        """最小化窗口"""
        if self.hwnd:
            win32gui.ShowWindow(self.hwnd, win32con.SW_MINIMIZE)
    
    def restore(self):
        """还原窗口"""
        if self.hwnd:
            win32gui.ShowWindow(self.hwnd, win32con.SW_RESTORE)

# 使用
if __name__ == "__main__":
    notepad = NotepadAutomation().launch()
    
    notepad.type_text("Hello from Python!")
    time.sleep(0.5)
    
    notepad.select_all()
    time.sleep(0.2)
    
    notepad.copy()
    
    print("操作完成")
    time.sleep(1)
    
    notepad.close()
```

## 工具类封装

### WindowHelper

```python
import win32gui
import win32con
import win32api

class WindowHelper:
    """窗口操作助手类"""
    
    @staticmethod
    def find_by_title(title):
        """按标题查找窗口"""
        return win32gui.FindWindow(None, title)
    
    @staticmethod
    def find_by_class(class_name):
        """按类名查找窗口"""
        return win32gui.FindWindow(class_name, None)
    
    @staticmethod
    def find_child(parent, class_name=None, title=None):
        """查找子窗口"""
        return win32gui.FindWindowEx(parent, 0, class_name, title)
    
    @staticmethod
    def get_all_windows():
        """获取所有可见窗口"""
        windows = []
        
        def callback(hwnd, _):
            if win32gui.IsWindowVisible(hwnd):
                title = win32gui.GetWindowText(hwnd)
                class_name = win32gui.GetClassName(hwnd)
                if title:
                    windows.append({
                        'hwnd': hwnd,
                        'title': title,
                        'class': class_name
                    })
            return True
        
        win32gui.EnumWindows(callback, None)
        return windows
    
    @staticmethod
    def show(hwnd):
        """显示窗口"""
        win32gui.ShowWindow(hwnd, win32con.SW_SHOW)
    
    @staticmethod
    def hide(hwnd):
        """隐藏窗口"""
        win32gui.ShowWindow(hwnd, win32con.SW_HIDE)
    
    @staticmethod
    def minimize(hwnd):
        """最小化"""
        win32gui.ShowWindow(hwnd, win32con.SW_MINIMIZE)
    
    @staticmethod
    def maximize(hwnd):
        """最大化"""
        win32gui.ShowWindow(hwnd, win32con.SW_MAXIMIZE)
    
    @staticmethod
    def restore(hwnd):
        """还原"""
        win32gui.ShowWindow(hwnd, win32con.SW_RESTORE)
    
    @staticmethod
    def activate(hwnd):
        """激活窗口"""
        win32gui.SetForegroundWindow(hwnd)
    
    @staticmethod
    def close(hwnd):
        """关闭窗口"""
        win32gui.PostMessage(hwnd, win32con.WM_CLOSE, 0, 0)
    
    @staticmethod
    def move(hwnd, x, y):
        """移动窗口"""
        win32gui.SetWindowPos(
            hwnd, 0, x, y, 0, 0,
            win32con.SWP_NOSIZE | win32con.SWP_NOZORDER
        )
    
    @staticmethod
    def resize(hwnd, width, height):
        """调整大小"""
        win32gui.SetWindowPos(
            hwnd, 0, 0, 0, width, height,
            win32con.SWP_NOMOVE | win32con.SWP_NOZORDER
        )
    
    @staticmethod
    def move_resize(hwnd, x, y, width, height):
        """移动并调整大小"""
        win32gui.SetWindowPos(
            hwnd, 0, x, y, width, height,
            win32con.SWP_NOZORDER
        )
    
    @staticmethod
    def center(hwnd):
        """居中显示"""
        rect = win32gui.GetWindowRect(hwnd)
        width = rect[2] - rect[0]
        height = rect[3] - rect[1]
        
        screen_w = win32api.GetSystemMetrics(win32con.SM_CXSCREEN)
        screen_h = win32api.GetSystemMetrics(win32con.SM_CYSCREEN)
        
        x = (screen_w - width) // 2
        y = (screen_h - height) // 2
        
        WindowHelper.move_resize(hwnd, x, y, width, height)
```

## 最佳实践

### 等待窗口出现

```python
import win32gui
import time

def wait_for_window(title, timeout=10):
    """等待窗口出现"""
    start = time.time()
    
    while time.time() - start < timeout:
        hwnd = win32gui.FindWindow(None, title)
        if hwnd != 0:
            return hwnd
        time.sleep(0.1)
    
    return 0

def wait_for_child(parent, class_name=None, timeout=10):
    """等待子窗口出现"""
    start = time.time()
    
    while time.time() - start < timeout:
        hwnd = win32gui.FindWindowEx(parent, 0, class_name, None)
        if hwnd != 0:
            return hwnd
        time.sleep(0.1)
    
    return 0

# 使用
hwnd = wait_for_window("无标题 - 记事本", timeout=5)
if hwnd:
    print(f"窗口已出现: {hwnd}")
else:
    print("超时")
```

### 错误处理

```python
def safe_window_operation(operation):
    """安全的窗口操作包装"""
    try:
        return operation()
    except Exception as e:
        print(f"窗口操作失败: {e}")
        return None

# 使用
hwnd = safe_window_operation(
    lambda: win32gui.FindWindow(None, "无标题 - 记事本")
)

if hwnd:
    safe_window_operation(lambda: win32gui.CloseWindow(hwnd))
```
