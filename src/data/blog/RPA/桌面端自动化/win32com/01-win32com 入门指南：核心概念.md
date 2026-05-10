---
title: win32com 入门指南：核心概念
series: win32com
author: Joekma
pubDatetime: 2026-05-09T00:00:00.000+08:00
modDatetime: 2026-05-09T00:00:00.000+08:00
slug: win32com-getting-started
description: '详细介绍Python pywin32库的核心概念，包括COM组件、窗口句柄、进程管理等基础知识。'
tags:
  - win32com
  - RPA
  - 桌面自动化
  - Python
draft: false
language: zh-CN
---

## 概述

pywin32 是 Python 访问 Windows 操作的桥梁，它提供了对 Windows COM 组件和 Win32 API 的访问能力。通过 pywin32，Python 可以操作 Windows 应用程序、访问系统功能、管理进程等。

### 为什么选择 pywin32？

| 特性 | 说明 |
|------|------|
| **Windows 完整访问** | 访问所有 Windows API |
| **简单易用** | Pythonic 的 API 设计 |
| **功能强大** | COM 组件、系统调用全覆盖 |
| **广泛应用** | 大量现有库基于此构建 |
| **免费开源** | MIT 许可证 |

### 安装 pywin32

```bash
# 安装 pywin32
pip install pywin32

# 验证安装
python -c "import win32api; print('win32api installed')"
```

### pywin32 模块组成

| 模块 | 说明 |
|------|------|
| **win32api** | 基础 Windows API |
| **win32gui** | GUI 编程接口 |
| **win32con** | Windows 常量定义 |
| **win32process** | 进程和线程 |
| **win32service** | Windows 服务 |
| **win32com.client** | COM 客户端 |
| **win32evtlog** | 事件日志 |
| **win32file** | 文件操作 |
| **win32reg** | 注册表操作 |

## 核心概念

### 窗口句柄（HWND）

窗口句柄是 Windows 中每个窗口的唯一标识：

```python
import win32gui
import win32con

# 获取桌面窗口句柄
desktop_hwnd = win32gui.GetDesktopWindow()
print(f"桌面句柄: {desktop_hwnd}")

# 获取前台窗口句柄
foreground_hwnd = win32gui.GetForegroundWindow()
print(f"前台窗口: {foreground_hwnd}")

# 获取窗口标题
title = win32gui.GetWindowText(foreground_hwnd)
print(f"窗口标题: {title}")
```

### 窗口查找

```python
# 按标题查找窗口
hwnd = win32gui.FindWindow(None, "无标题 - 记事本")
print(f"找到窗口: {hwnd}")

# 按类名查找
hwnd = win32gui.FindWindow("Notepad", None)
print(f"记事本窗口: {hwnd}")

# 枚举所有窗口
def enum_windows_callback(hwnd, windows):
    if win32gui.IsWindowVisible(hwnd):
        title = win32gui.GetWindowText(hwnd)
        if title:
            windows.append((hwnd, title))
    return True

windows = []
win32gui.EnumWindows(enum_windows_callback, windows)

for hwnd, title in windows[:10]:  # 只显示前10个
    print(f"{hwnd}: {title}")
```

### 窗口信息

```python
# 获取窗口信息
hwnd = win32gui.FindWindow(None, "无标题 - 记事本")

# 获取窗口类名
class_name = win32gui.GetClassName(hwnd)
print(f"类名: {class_name}")

# 获取窗口矩形
left, top, right, bottom = win32gui.GetWindowRect(hwnd)
print(f"位置: ({left}, {top}) - ({right}, {bottom})")
print(f"大小: {right - left} x {bottom - top}")

# 获取客户区矩形
client_left, client_top, client_right, client_bottom = win32gui.GetClientRect(hwnd)
```

## 窗口操作

### 移动和调整大小

```python
import win32gui
import win32con

hwnd = win32gui.FindWindow(None, "无标题 - 记事本")

# 移动窗口
win32gui.SetWindowPos(
    hwnd,
    0,  # 插入句柄
    100, 100,  # x, y
    800, 600,  # 宽, 高
    win32con.SWP_NOZORDER  # 标志
)

# 移动窗口（另一种方式）
win32gui.MoveWindow(hwnd, 100, 100, 800, 600, True)
```

### 显示和隐藏

```python
hwnd = win32gui.FindWindow(None, "无标题 - 记事本")

# 显示窗口
win32gui.ShowWindow(hwnd, win32con.SW_SHOW)

# 隐藏窗口
win32gui.ShowWindow(hwnd, win32con.SW_HIDE)

# 最大化
win32gui.ShowWindow(hwnd, win32con.SW_MAXIMIZE)

# 最小化
win32gui.ShowWindow(hwnd, win32con.SW_MINIMIZE)

# 还原
win32gui.ShowWindow(hwnd, win32con.SW_RESTORE)

# SW_SHOWMAXIMIZED 等常量
win32gui.ShowWindow(hwnd, win32con.SW_SHOWMAXIMIZED)
win32gui.ShowWindow(hwnd, win32con.SW_SHOWMINIMIZED)
```

### 激活窗口

```python
hwnd = win32gui.FindWindow(None, "无标题 - 记事本")

# 将窗口带到前台
win32gui.SetForegroundWindow(hwnd)

# 设置为活动窗口
win32gui.SetActiveWindow(hwnd)

# 强制获取焦点
win32gui.SetFocus(hwnd)
```

## 发送消息

### WM_* 消息

```python
import win32gui
import win32con
import win32api

hwnd = win32gui.FindWindow(None, "无标题 - 记事本")

# 发送关闭消息
win32gui.PostMessage(hwnd, win32con.WM_CLOSE, 0, 0)

# 发送按键消息
# WM_KEYDOWN
win32gui.PostMessage(hwnd, win32con.WM_KEYDOWN, win32con.VK_RETURN, 0)
# WM_KEYUP
win32gui.PostMessage(hwnd, win32con.WM_KEYUP, win32con.VK_RETURN, 0)

# 发送字符消息
win32gui.PostMessage(hwnd, win32con.WM_CHAR, ord('A'), 0)
```

### SendMessage vs PostMessage

| 方法 | 说明 | 用途 |
|------|------|------|
| **SendMessage** | 同步发送，等待处理完成 | 需要确认结果 |
| **PostMessage** | 异步发送，立即返回 | 快速发送 |

```python
# SendMessage - 同步，等待响应
result = win32gui.SendMessage(
    hwnd, 
    win32con.WM_GETTEXT, 
    256,  # 缓冲区大小
    0  # 接收缓冲区
)

# PostMessage - 异步，不等待
win32gui.PostMessage(hwnd, win32con.WM_CLOSE, 0, 0)
```

## 进程操作

### win32process

```python
import win32process
import win32api
import win32con

# 启动进程
process_info = win32process.CreateProcess(
    r"C:\Windows\System32\notepad.exe",  # 程序路径
    "",  # 命令行参数
    None,  # 进程安全属性
    None,  # 线程安全属性
    0,  # 继承句柄
    win32con.CREATE_NEW_CONSOLE,  # 创建标志
    None,  # 环境变量
    None,  # 当前目录
    win32process.STARTUPINFO()  # 启动信息
)

h_process, h_thread, process_id, thread_id = process_info
print(f"进程ID: {process_id}, 线程ID: {thread_id}")

# 打开现有进程
h_process = win32api.OpenProcess(
    win32con.PROCESS_ALL_ACCESS,  # 访问权限
    False,  # 不继承
    process_id  # 进程ID
)
print(f"句柄: {h_process}")

# 关闭句柄
win32api.CloseHandle(h_process)
```

### 进程信息

```python
import win32process
import win32api

# 获取当前进程
h_process = win32api.GetCurrentProcess()
print(f"当前进程ID: {win32api.GetCurrentProcessId()}")

# 获取进程信息
process_id = 1234
h_process = win32api.OpenProcess(
    win32con.PROCESS_QUERY_INFORMATION | win32con.PROCESS_VM_READ,
    False,
    process_id
)

# 获取进程镜像路径
exename = win32process.GetModuleFileNameEx(h_process, 0)
print(f"进程路径: {exename}")

# 获取内存信息
mem_info = win32process.GetProcessMemoryInfo(h_process)
print(f"工作集大小: {mem_info['WorkingSetSize'] / 1024 / 1024:.2f} MB")

win32api.CloseHandle(h_process)
```

## 第一个完整示例

### 操作记事本

```python
import win32gui
import win32con
import win32process
import win32api
import time

def find_window_by_title(title):
    """按标题查找窗口"""
    hwnd = win32gui.FindWindow(None, title)
    return hwnd

def find_child_window(parent_hwnd, class_name=None, title=None):
    """查找子窗口"""
    if class_name and title:
        return win32gui.FindWindowEx(parent_hwnd, 0, class_name, title)
    elif class_name:
        return win32gui.FindWindowEx(parent_hwnd, 0, class_name, None)
    elif title:
        return win32gui.FindWindowEx(parent_hwnd, 0, None, title)
    return None

def main():
    # 1. 启动记事本
    print("启动记事本...")
    process_info = win32process.CreateProcess(
        r"C:\Windows\System32\notepad.exe",
        "",
        None,
        None,
        0,
        win32con.CREATE_NEW_CONSOLE,
        None,
        None,
        win32process.STARTUPINFO()
    )
    
    time.sleep(0.5)  # 等待窗口创建
    
    # 2. 查找窗口
    hwnd = find_window_by_title("无标题 - 记事本")
    if not hwnd:
        print("找不到记事本窗口")
        return
    
    print(f"找到窗口: {hwnd}")
    
    # 3. 查找编辑区
    edit_hwnd = find_child_window(hwnd, "Edit")
    if edit_hwnd:
        print(f"找到编辑区: {edit_hwnd}")
        
        # 4. 发送文本
        # 设置焦点
        win32gui.SetFocus(edit_hwnd)
        
        # 发送字符
        for char in "Hello, win32com!":
            win32gui.PostMessage(
                edit_hwnd,
                win32con.WM_CHAR,
                ord(char),
                0
            )
            time.sleep(0.01)  # 模拟打字
        
        print("文本已输入")
    
    print("按任意键关闭记事本...")
    win32api.GetChar()
    
    # 5. 关闭窗口
    win32gui.PostMessage(hwnd, win32con.WM_CLOSE, 0, 0)
    print("记事本已关闭")

if __name__ == "__main__":
    main()
```

## 事件处理

### 窗口消息钩子

```python
import win32gui
import win32con

# 消息回调
def wnd_proc(hwnd, msg, wparam, lparam):
    if msg == win32con.WM_DESTROY:
        win32gui.PostQuitMessage(0)
        return 0
    elif msg == win32con.WM_COMMAND:
        print(f"WM_COMMAND: wparam={wparam}, lparam={lparam}")
    elif msg == win32con.WM_KEYDOWN:
        print(f"按键: {wparam}")
    
    return win32gui.DefWindowProc(hwnd, msg, wparam, lparam)

# 注册窗口类
wc = win32gui.WNDCLASS()
wc.lpfnWndProc = wnd_proc
wc.hInstance = win32api.GetModuleHandle(None)
wc.lpszClassName = "MyWindowClass"

class_atom = win32gui.RegisterClass(wc)

# 创建窗口
hwnd = win32gui.CreateWindow(
    class_atom,
    "测试窗口",
    win32con.WS_OVERLAPPEDWINDOW,
    win32con.CW_USEDEFAULT,
    win32con.CW_USEDEFAULT,
    400,
    300,
    0,
    0,
    wc.hInstance,
    None
)

# 显示窗口
win32gui.ShowWindow(hwnd, win32con.SW_SHOWNORMAL)
win32gui.UpdateWindow(hwnd)

# 消息循环
msg = win32gui.MSG()
while win32gui.GetMessage(msg, 0, 0, 0):
    win32gui.TranslateMessage(msg)
    win32gui.DispatchMessage(msg)
```

## 最佳实践

### 错误处理

```python
import win32gui
import win32api

try:
    hwnd = win32gui.FindWindow(None, "不存在的窗口")
    if hwnd == 0:
        print("窗口未找到")
    else:
        # 操作窗口
        pass
except win32api.error as e:
    print(f"Windows API 错误: {e}")
except Exception as e:
    print(f"错误: {e}")
```

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

# 使用
hwnd = wait_for_window("无标题 - 记事本", timeout=5)
if hwnd:
    print(f"窗口已出现: {hwnd}")
else:
    print("窗口未在超时时间内出现")
```

### 窗口遍历

```python
def get_all_child_windows(hwnd):
    """获取所有子窗口"""
    windows = []
    
    def callback(child_hwnd, _):
        if win32gui.IsWindowVisible(child_hwnd):
            windows.append({
                'hwnd': child_hwnd,
                'class': win32gui.GetClassName(child_hwnd),
                'title': win32gui.GetWindowText(child_hwnd)
            })
        return True
    
    win32gui.EnumChildWindows(hwnd, callback, None)
    return windows

# 使用
hwnd = win32gui.FindWindow(None, "无标题 - 记事本")
if hwnd:
    children = get_all_child_windows(hwnd)
    for child in children:
        print(f"{child['hwnd']}: [{child['class']}] {child['title']}")
```

## 常见任务

### 截图窗口

```python
import win32gui
import win32ui
import win32con
from PIL import Image

def capture_window(hwnd):
    """截取窗口图像"""
    # 获取窗口设备上下文
    left, top, right, bottom = win32gui.GetWindowRect(hwnd)
    width = right - left
    height = bottom - top
    
    # 获取窗口 DC
    hwndDC = win32gui.GetWindowDC(hwnd)
    mfcDC = win32ui.CreateDCFromHandle(hwndDC)
    saveDC = mfcDC.CreateCompatibleDC()
    
    # 创建位图
    saveBitMap = win32ui.CreateBitmap()
    saveBitMap.CreateCompatibleBitmap(mfcDC, width, height)
    saveDC.SelectObject(saveBitMap)
    
    # 复制窗口内容到位图
    saveDC.BitBlt((0, 0), (width, height), mfcDC, (0, 0), win32con.SRCCOPY)
    
    # 保存为图像
    bmpinfo = saveBitMap.GetInfo()
    bmpstr = saveBitMap.GetBitmapBits(True)
    img = Image.frombuffer(
        'RGB',
        (bmpinfo['bmWidth'], bmpinfo['bmHeight']),
        bmpstr, 'bytes', bmpinfo['bmWidth'] * 3, 0
    )
    
    # 清理
    win32gui.DeleteObject(saveBitMap.GetHandle())
    saveDC.DeleteDC()
    mfcDC.DeleteDC()
    win32gui.ReleaseDC(hwnd, hwndDC)
    
    return img

# 使用
hwnd = win32gui.FindWindow(None, "无标题 - 记事本")
if hwnd:
    img = capture_window(hwnd)
    img.save("screenshot.png")
    print("截图已保存")
```
