---
title: pywin32 文件系统与注册表
series: pywin32
seriesOrder: 5
author: Joekma
pubDatetime: 2026-05-09T00:00:00.000+08:00
modDatetime: 2026-05-09T00:00:00.000+08:00
slug: win32com-filesystem-registry
description: '详细介绍使用 pywin32 进行文件系统操作和 Windows 注册表管理。'
tags:
  - pywin32
  - Win32 API
  - RPA
  - 文件系统
  - 注册表
draft: false
language: zh-CN
---

## 概述

Windows 文件系统和注册表是 Windows 系统的核心组成部分。本教程将详细介绍如何使用 pywin32 进行文件和注册表的各种操作。

### 模块一览

| 模块 | 功能 |
|------|------|
| **win32file** | 文件操作 |
| **win32api** | 文件 API |
| **win32con** | 文件常量 |
| **win32security** | 安全属性 |
| **win32net** | 网络文件 |
| **win32reg** | 注册表操作 |

## 文件操作

### 基本文件操作

```python
import win32file
import win32api
import win32con

# 创建文件
h_file = win32file.CreateFile(
    r"C:\test.txt",                    # 文件路径
    win32con.GENERIC_WRITE,            # 访问模式
    win32con.FILE_SHARE_READ,           # 共享模式
    None,                              # 安全属性
    win32con.CREATE_ALWAYS,            # 创建方式
    win32con.FILE_ATTRIBUTE_NORMAL,    # 文件属性
    None                               # 模板文件
)

print(f"文件句柄: {h_file}")

# 写入数据
data = "Hello, win32com!".encode('utf-8')
win32file.WriteFile(h_file, data)

# 关闭文件
win32api.CloseHandle(h_file)
```

### 读写文件

```python
import win32file
import win32api
import win32con

# 打开文件
h_file = win32file.CreateFile(
    r"C:\test.txt",
    win32con.GENERIC_READ,
    win32con.FILE_SHARE_READ,
    None,
    win32con.OPEN_EXISTING,
    win32con.FILE_ATTRIBUTE_NORMAL,
    None
)

# 读取数据
buffer = win32file.ReadFile(h_file, 65536)
data = buffer[0].decode('utf-8')
print(f"读取内容: {data}")

win32api.CloseHandle(h_file)

# 使用更高层的 API
import shutil

# 复制文件
shutil.copy(r"C:\source.txt", r"C:\dest.txt")

# 移动文件
shutil.move(r"C:\old.txt", r"C:\new.txt")

# 删除文件
import os
os.remove(r"C:\test.txt")
```

### 文件属性

```python
import win32file
import win32api
import win32con

# 获取文件属性
h_file = win32file.CreateFile(
    r"C:\test.txt",
    win32con.GENERIC_READ,
    win32con.FILE_SHARE_READ,
    None,
    win32con.OPEN_EXISTING,
    win32con.FILE_ATTRIBUTE_NORMAL,
    None
)

# 获取文件大小
file_size = win32file.GetFileSize(h_file)
print(f"文件大小: {file_size} bytes")

# 获取文件时间
creation_time, access_time, write_time = win32file.GetFileTime(h_file)
print(f"创建时间: {creation_time}")
print(f"访问时间: {access_time}")
print(f"修改时间: {write_time}")

win32api.CloseHandle(h_file)

# 使用 os 模块更简单
import os

stat = os.stat(r"C:\test.txt")
print(f"大小: {stat.st_size}")
print(f"创建: {stat.st_ctime}")
print(f"修改: {stat.st_mtime}")
print(f"访问: {stat.st_atime}")
```

### 目录操作

```python
import win32file
import win32api
import win32con

# 创建目录
win32file.CreateDirectory(r"C:\test_dir", None)

# 删除目录
win32file.RemoveDirectory(r"C:\test_dir")

# 重命名/移动
win32file.MoveFile(r"C:\old.txt", r"C:\new.txt")

# 复制文件
win32file.CopyFile(r"C:\source.txt", r"C:\dest.txt", True)

# 设置文件属性
win32file.SetFileAttributes(
    r"C:\test.txt",
    win32con.FILE_ATTRIBUTE_HIDDEN  # 隐藏属性
)

# 获取文件属性
attrs = win32file.GetFileAttributes(r"C:\test.txt")
print(f"属性: {attrs}")

# 使用 os 模块
import os

# 创建目录
os.makedirs(r"C:\test\subdir", exist_ok=True)

# 列出目录
for item in os.listdir(r"C:\test"):
    full_path = os.path.join(r"C:\test", item)
    if os.path.isdir(full_path):
        print(f"[DIR] {item}")
    else:
        print(f"[FILE] {item}")
```

## 注册表操作

### 打开注册表

```python
import win32reg
import win32con

# 打开注册表键
h_key = win32reg.OpenKey(
    win32con.HKEY_CURRENT_USER,    # 根键
    r"Software\TestApp",           # 子键路径
    0,                             # 保留
    win32con.KEY_ALL_ACCESS        # 访问权限
)

print(f"注册表句柄: {h_key}")

# 关闭注册表键
win32reg.CloseKey(h_key)

# 根键常量
ROOT_KEYS = {
    'HKEY_CLASSES_ROOT': win32con.HKEY_CLASSES_ROOT,
    'HKEY_CURRENT_USER': win32con.HKEY_CURRENT_USER,
    'HKEY_LOCAL_MACHINE': win32con.HKEY_LOCAL_MACHINE,
    'HKEY_USERS': win32con.HKEY_USERS,
    'HKEY_CURRENT_CONFIG': win32con.HKEY_CURRENT_CONFIG,
}

# 访问权限
ACCESS_RIGHTS = {
    'read': win32con.KEY_READ,
    'write': win32con.KEY_WRITE,
    'all': win32con.KEY_ALL_ACCESS,
}
```

### 读取注册表

```python
import win32reg
import win32con

# 打开键
h_key = win32reg.OpenKey(
    win32con.HKEY_CURRENT_USER,
    r"Software\Microsoft\Windows\CurrentVersion",
    0,
    win32con.KEY_READ
)

# 枚举子键
i = 0
while True:
    try:
        subkey_name = win32reg.EnumKey(h_key, i)
        print(f"子键 {i}: {subkey_name}")
        i += 1
    except WindowsError:
        break

# 枚举值
i = 0
while True:
    try:
        name, value, value_type = win32reg.EnumValue(h_key, i)
        print(f"值 {i}: {name} = {value} (类型: {value_type})")
        i += 1
    except WindowsError:
        break

win32reg.CloseKey(h_key)
```

### 写入注册表

```python
import win32reg
import win32con

# 打开或创建键
h_key = win32reg.CreateKey(
    win32con.HKEY_CURRENT_USER,
    r"Software\TestApp"
)

# 写入字符串值
win32reg.SetValueEx(
    h_key,
    "StringValue",          # 值名称
    0,                       # 保留
    win32con.REG_SZ,         # 类型
    "Hello, Registry!"       # 数据
)

# 写入整数
win32reg.SetValueEx(
    h_key,
    "IntValue",
    0,
    win32con.REG_DWORD,
    42
)

# 写入二进制
win32reg.SetValueEx(
    h_key,
    "BinaryValue",
    0,
    win32con.REG_BINARY,
    bytes([0x01, 0x02, 0x03])
)

# 写入多字符串
win32reg.SetValueEx(
    h_key,
    "MultiString",
    0,
    win32con.REG_MULTI_SZ,
    ["string1", "string2", "string3"]
)

# 关闭键
win32reg.CloseKey(h_key)

# 删除键（需先删除所有子键和值）
try:
    win32reg.DeleteKey(
        win32con.HKEY_CURRENT_USER,
        r"Software\TestApp"
    )
except WindowsError as e:
    print(f"删除失败: {e}")
```

### 查询注册表值

```python
import win32reg
import win32con

# 打开键
h_key = win32reg.OpenKey(
    win32con.HKEY_CURRENT_USER,
    r"Software\Microsoft\Windows\CurrentVersion",
    0,
    win32con.KEY_READ
)

# 查询值
value, value_type = win32reg.QueryValueEx(h_key, "ProgramFilesDir")
print(f"ProgramFilesDir: {value}")

# 查询键信息
num_subkeys, num_values, last_modified = win32reg.QueryInfoKey(h_key)
print(f"子键数: {num_subkeys}")
print(f"值数量: {num_values}")

win32reg.CloseKey(h_key)

# 读取特定类型的值
def read_registry_value(root, path, name):
    """读取注册表值"""
    try:
        h_key = win32reg.OpenKey(root, path, 0, win32con.KEY_READ)
        try:
            value, _ = win32reg.QueryValueEx(h_key, name)
            return value
        finally:
            win32reg.CloseKey(h_key)
    except WindowsError:
        return None

# 使用
value = read_registry_value(
    win32con.HKEY_LOCAL_MACHINE,
    r"SOFTWARE\Microsoft\Windows\CurrentVersion",
    "ProgramFilesDir"
)
print(f"ProgramFilesDir: {value}")
```

## 文件系统监控

### 使用 ReadDirectoryChangesW

```python
import win32file
import win32con
import threading
import time

class DirectoryWatcher:
    """目录监控器"""
    
    def __init__(self, path):
        self.path = path
        self.h_dir = None
        self.running = False
        self.callbacks = []
    
    def start(self):
        """开始监控"""
        self.h_dir = win32file.CreateFile(
            self.path,
            win32con.GENERIC_READ,
            win32con.FILE_SHARE_READ | win32con.FILE_SHARE_WRITE,
            None,
            win32con.OPEN_EXISTING,
            win32con.FILE_FLAG_BACKUP_SEMANTICS,
            None
        )
        
        self.running = True
        self.thread = threading.Thread(target=self._watch_loop)
        self.thread.start()
    
    def _watch_loop(self):
        """监控循环"""
        buffer = win32file.AllocateReadBuffer(65536)
        
        while self.running:
            try:
                results = win32file.ReadDirectoryChangesW(
                    self.h_dir,
                    buffer,
                    True,  # 子目录
                    win32con.FILE_NOTIFY_CHANGE_FILE_NAME | 
                    win32con.FILE_NOTIFY_CHANGE_DIR_NAME |
                    win32con.FILE_NOTIFY_CHANGE_ATTRIBUTES |
                    win32con.FILE_NOTIFY_CHANGE_SIZE |
                    win32con.FILE_NOTIFY_CHANGE_LAST_WRITE,
                    None,
                    None
                )
                
                for action, filename in results:
                    for callback in self.callbacks:
                        callback(action, filename)
                        
            except Exception:
                pass
    
    def stop(self):
        """停止监控"""
        self.running = False
        if self.h_dir:
            win32file.CloseHandle(self.h_dir)
    
    def on_change(self, callback):
        """注册回调"""
        self.callbacks.append(callback)

# 使用
def handle_change(action, filename):
    ACTIONS = {
        1: "添加",
        2: "删除",
        3: "修改",
        4: "重命名"
    }
    print(f"{ACTIONS.get(action, '未知')}: {filename}")

watcher = DirectoryWatcher(r"C:\test")
watcher.on_change(handle_change)
watcher.start()

print("监控中... 按 Ctrl+C 退出")
try:
    while True:
        time.sleep(1)
except KeyboardInterrupt:
    watcher.stop()
```

## 实用工具类

### RegistryHelper

```python
import win32reg
import win32con

class RegistryHelper:
    """注册表操作助手"""
    
    @staticmethod
    def read(root, path, name):
        """读取注册表值"""
        try:
            h_key = win32reg.OpenKey(root, path, 0, win32con.KEY_READ)
            try:
                value, _ = win32reg.QueryValueEx(h_key, name)
                return value
            finally:
                win32reg.CloseKey(h_key)
        except WindowsError:
            return None
    
    @staticmethod
    def write(root, path, name, value, value_type=win32con.REG_SZ):
        """写入注册表值"""
        try:
            h_key = win32reg.CreateKey(root, path)
            try:
                win32reg.SetValueEx(h_key, name, 0, value_type, value)
            finally:
                win32reg.CloseKey(h_key)
            return True
        except WindowsError:
            return False
    
    @staticmethod
    def delete(root, path, name):
        """删除注册表值"""
        try:
            h_key = win32reg.OpenKey(root, path, 0, win32con.KEY_WRITE)
            try:
                win32reg.DeleteValue(h_key, name)
            finally:
                win32reg.CloseKey(h_key)
            return True
        except WindowsError:
            return False
    
    @staticmethod
    def exists(root, path, name):
        """检查值是否存在"""
        try:
            h_key = win32reg.OpenKey(root, path, 0, win32con.KEY_READ)
            try:
                win32reg.QueryValueEx(h_key, name)
                return True
            finally:
                win32reg.CloseKey(h_key)
        except WindowsError:
            return False
    
    @staticmethod
    def get_subkeys(root, path):
        """获取所有子键"""
        try:
            h_key = win32reg.OpenKey(root, path, 0, win32con.KEY_READ)
            try:
                subkeys = []
                i = 0
                while True:
                    try:
                        subkey_name = win32reg.EnumKey(h_key, i)
                        subkeys.append(subkey_name)
                        i += 1
                    except WindowsError:
                        break
                return subkeys
            finally:
                win32reg.CloseKey(h_key)
        except WindowsError:
            return []
    
    @staticmethod
    def get_values(root, path):
        """获取所有值"""
        try:
            h_key = win32reg.OpenKey(root, path, 0, win32con.KEY_READ)
            try:
                values = {}
                i = 0
                while True:
                    try:
                        name, value, value_type = win32reg.EnumValue(h_key, i)
                        values[name] = {'value': value, 'type': value_type}
                        i += 1
                    except WindowsError:
                        break
                return values
            finally:
                win32reg.CloseKey(h_key)
        except WindowsError:
            return {}
```

### FileSystemHelper

```python
import os
import shutil
import win32file
import win32con

class FileSystemHelper:
    """文件系统操作助手"""
    
    @staticmethod
    def copy_file(src, dst, overwrite=True):
        """复制文件"""
        return shutil.copy2(src, dst)
    
    @staticmethod
    def move_file(src, dst):
        """移动文件"""
        return shutil.move(src, dst)
    
    @staticmethod
    def delete_file(path):
        """删除文件"""
        os.remove(path)
    
    @staticmethod
    def create_directory(path):
        """创建目录"""
        os.makedirs(path, exist_ok=True)
    
    @staticmethod
    def delete_directory(path):
        """删除目录"""
        shutil.rmtree(path)
    
    @staticmethod
    def get_file_info(path):
        """获取文件信息"""
        stat = os.stat(path)
        return {
            'size': stat.st_size,
            'created': stat.st_ctime,
            'modified': stat.st_mtime,
            'accessed': stat.st_atime,
            'is_file': os.path.isfile(path),
            'is_dir': os.path.isdir(path),
            'exists': os.path.exists(path)
        }
    
    @staticmethod
    def list_directory(path):
        """列出目录内容"""
        return os.listdir(path)
    
    @staticmethod
    def set_hidden(path):
        """设置隐藏属性"""
        attrs = win32file.GetFileAttributes(path)
        win32file.SetFileAttributes(
            path,
            attrs | win32con.FILE_ATTRIBUTE_HIDDEN
        )
    
    @staticmethod
    def set_system(path):
        """设置系统属性"""
        attrs = win32file.GetFileAttributes(path)
        win32file.SetFileAttributes(
            path,
            attrs | win32con.FILE_ATTRIBUTE_SYSTEM
        )
```

## 最佳实践

### 错误处理

```python
import win32reg
import win32con
import win32file
import win32api

def safe_registry_operation(operation):
    """安全的注册表操作"""
    try:
        return operation()
    except WindowsError as e:
        print(f"注册表错误: {e}")
        return None

def safe_file_operation(operation):
    """安全的文件操作"""
    try:
        return operation()
    except WindowsError as e:
        print(f"文件错误: {e}")
        return None
    except FileNotFoundError as e:
        print(f"文件不存在: {e}")
        return None
    except PermissionError as e:
        print(f"权限错误: {e}")
        return None
```

### 资源管理

```python
import win32reg
import win32con

class RegistryContext:
    """注册表上下文管理器"""
    
    def __init__(self, root, path, access=win32con.KEY_ALL_ACCESS):
        self.root = root
        self.path = path
        self.access = access
        self.h_key = None
    
    def __enter__(self):
        self.h_key = win32reg.OpenKey(
            self.root, self.path, 0, self.access
        )
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        if self.h_key:
            win32reg.CloseKey(self.h_key)
    
    def read(self, name):
        """读取值"""
        if not self.h_key:
            return None
        try:
            value, _ = win32reg.QueryValueEx(self.h_key, name)
            return value
        except WindowsError:
            return None
    
    def write(self, name, value, value_type=win32con.REG_SZ):
        """写入值"""
        if not self.h_key:
            return False
        try:
            win32reg.SetValueEx(self.h_key, name, 0, value_type, value)
            return True
        except WindowsError:
            return False

# 使用
with RegistryContext(
    win32con.HKEY_CURRENT_USER,
    r"Software\TestApp"
) as reg:
    reg.write("TestValue", "Hello")
    value = reg.read("TestValue")
    print(f"读取的值: {value}")
```

### 路径处理

```python
import os

def normalize_path(path):
    """规范化路径"""
    return os.path.normpath(os.path.abspath(path))

def ensure_directory(path):
    """确保目录存在"""
    os.makedirs(path, exist_ok=True)
    return path

def get_app_data_path(app_name):
    """获取应用数据路径"""
    appdata = os.environ.get('APPDATA', r"C:\Users\Public")
    app_path = os.path.join(appdata, app_name)
    ensure_directory(app_path)
    return app_path
```

## 应用示例

### 保存应用配置

```python
import win32reg
import win32con
import json

class ConfigManager:
    """配置管理器"""
    
    def __init__(self, app_name):
        self.app_name = app_name
        self.reg_path = f"Software\\{app_name}"
    
    def save_config(self, config):
        """保存配置到注册表"""
        h_key = win32reg.CreateKey(
            win32con.HKEY_CURRENT_USER,
            self.reg_path
        )
        
        try:
            # 存储为 JSON 字符串
            config_json = json.dumps(config)
            win32reg.SetValueEx(
                h_key, "Config",
                0,
                win32con.REG_SZ,
                config_json
            )
        finally:
            win32reg.CloseKey(h_key)
    
    def load_config(self):
        """从注册表加载配置"""
        try:
            h_key = win32reg.OpenKey(
                win32con.HKEY_CURRENT_USER,
                self.reg_path,
                0,
                win32con.KEY_READ
            )
            
            try:
                config_json, _ = win32reg.QueryValueEx(h_key, "Config")
                return json.loads(config_json)
            finally:
                win32reg.CloseKey(h_key)
                
        except WindowsError:
            return {}
    
    def clear_config(self):
        """清除配置"""
        try:
            win32reg.DeleteKey(
                win32con.HKEY_CURRENT_USER,
                self.reg_path
            )
        except WindowsError:
            pass

# 使用
config_mgr = ConfigManager("MyApp")

# 保存配置
config_mgr.save_config({
    'theme': 'dark',
    'language': 'zh-CN',
    'auto_save': True,
    'last_opened': '2024-01-01'
})

# 加载配置
config = config_mgr.load_config()
print(f"配置: {config}")
```
