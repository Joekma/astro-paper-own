---
title: Electron 应用菜单与系统集成
author: Joekma
pubDatetime: 2026-05-11T00:00:00.000+08:00
modDatetime: 2026-05-11T00:00:00.000+08:00
slug: electron-menu-system-integration
description: '详细介绍Electron菜单系统、Menu API、托盘图标、快捷键注册及系统交互。'
tags:
  - Electron
  - Menu
  - Tray
  - 快捷键
  - 系统集成
draft: false
series: Electron
seriesOrder: 7
language: zh-CN
---

## 概述

Electron 提供了丰富的系统集成能力，包括应用菜单、上下文菜单、系统托盘、快捷键等。本文将详细介绍这些功能的实现方法。🍎

## 菜单系统

### 应用菜单结构

```
┌─────────────────────────────────────────────────────────────┐
│                      应用菜单系统                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Electron (macOS)    文件    编辑    视图    帮助    │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  文件菜单:                                                   │
│  ├─ 新建窗口          ⌘N                                   │
│  ├─ 打开文件...       ⌘O                                   │
│  ├─ 打开文件夹...     ⌘⇧O                                  │
│  ├─ (分隔线)                                              │
│  ├─ 保存              ⌘S                                   │
│  ├─ 另存为...         ⌘⇧S                                  │
│  ├─ (分隔线)                                              │
│  └─ 退出              ⌘Q                                   │
│                                                              │
│  编辑菜单:                                                   │
│  ├─ 撤销              ⌘Z                                   │
│  ├─ 重做              ⌘⇧Z                                  │
│  ├─ (分隔线)                                              │
│  ├─ 剪切              ⌘X                                   │
│  ├─ 复制              ⌘C                                   │
│  ├─ 粘贴              ⌘V                                   │
│  └─ 全选              ⌘A                                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 创建应用菜单

```javascript
const { app, Menu } = require('electron');

app.whenReady().then(() => {
  const template = [
    {
      label: '文件',
      submenu: [
        {
          label: '新建窗口',
          accelerator: 'CmdOrCtrl+N',
          click: () => createNewWindow()
        },
        {
          label: '打开文件',
          accelerator: 'CmdOrCtrl+O',
          click: () => openFile()
        },
        { type: 'separator' },
        {
          label: '保存',
          accelerator: 'CmdOrCtrl+S',
          click: () => saveFile()
        },
        { type: 'separator' },
        {
          label: '退出',
          accelerator: 'CmdOrCtrl+Q',
          click: () => app.quit()
        }
      ]
    },
    {
      label: '编辑',
      submenu: [
        { label: '撤销', role: 'undo' },
        { label: '重做', role: 'redo' },
        { type: 'separator' },
        { label: '剪切', role: 'cut' },
        { label: '复制', role: 'copy' },
        { label: '粘贴', role: 'paste' },
        { label: '全选', role: 'selectAll' }
      ]
    },
    {
      label: '视图',
      submenu: [
        { label: '重新加载', role: 'reload' },
        { label: '强制重新加载', role: 'forceReload' },
        { label: '开发者工具', role: 'toggleDevTools' },
        { type: 'separator' },
        { label: '实际大小', role: 'resetZoom' },
        { label: '放大', role: 'zoomIn' },
        { label: '缩小', role: 'zoomOut' },
        { type: 'separator' },
        { label: '全屏', role: 'togglefullscreen' }
      ]
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '关于',
          click: () => showAboutDialog()
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
});
```

### 菜单角色（role）

Electron 提供了预定义的角色，可以自动处理常见操作：

| 角色 | 说明 | macOS 表现 |
|------|------|-----------|
| `undo` | 撤销 | ✓ |
| `redo` | 重做 | ✓ |
| `cut` | 剪切 | ✓ |
| `copy` | 复制 | ✓ |
| `paste` | 粘贴 | ✓ |
| `selectAll` | 全选 | ✓ |
| `reload` | 重新加载 | ✓ |
| `forceReload` | 强制重新加载 | ✓ |
| `toggleDevTools` | 切换开发者工具 | ✓ |
| `togglefullscreen` | 切换全屏 | ✓ |
| `resetZoom` | 重置缩放 | ✓ |
| `zoomIn` | 放大 | ✓ |
| `zoomOut` | 缩小 | ✓ |
| `minimize` | 最小化 | ✓ |
| `close` | 关闭 | ✓ |

### submenu 类型

```javascript
const template = [
  // 子菜单
  {
    label: '文件',
    submenu: [
      { label: '新建', click: () => {} },
      { label: '打开', click: () => {} }
    ]
  },

  // 分隔线
  { type: 'separator' },

  // 复选菜单项
  {
    label: '自动保存',
    type: 'checkbox',
    checked: true,
    click: (menuItem) => {
      console.log('自动保存:', menuItem.checked);
    }
  },

  // 单选菜单项
  {
    label: '主题',
    submenu: [
      {
        label: '浅色',
        type: 'radio',
        checked: true,
        click: () => setTheme('light')
      },
      {
        label: '深色',
        type: 'radio',
        click: () => setTheme('dark')
      }
    ]
  }
];
```

### 启用默认菜单角色

```javascript
// Windows/Linux 默认菜单
const template = [
  { role: 'fileMenu' },
  { role: 'editMenu' },
  { role: 'viewMenu' },
  { role: 'windowMenu' }
];

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);

// macOS 不显示默认菜单
app瞪着 = () => {
  // macOS 使用默认菜单
};
```

## 上下文菜单

### 创建上下文菜单

```javascript
const { Menu } = require('electron');

// 在主进程中创建
function showContextMenu(event) {
  const template = [
    {
      label: '剪切',
      role: 'cut',
      accelerator: 'CmdOrCtrl+X'
    },
    {
      label: '复制',
      role: 'copy',
      accelerator: 'CmdOrCtrl+C'
    },
    {
      label: '粘贴',
      role: 'paste',
      accelerator: 'CmdOrCtrl+V'
    },
    { type: 'separator' },
    {
      label: '全选',
      role: 'selectAll'
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  menu.popup();
}

// 从渲染进程触发
ipcMain.on('show-context-menu', (event) => {
  const template = [
    { label: '剪切', role: 'cut' },
    { label: '复制', role: 'copy' },
    { label: '粘贴', role: 'paste' }
  ];

  const menu = Menu.buildFromTemplate(template);
  menu.popup({ window: BrowserWindow.fromWebContents(event.sender) });
});
```

```javascript
// renderer.js
document.addEventListener('contextmenu', (event) => {
  event.preventDefault();
  window.api.showContextMenu();
});
```

### 动态菜单

```javascript
// 根据状态动态生成菜单
function getContextMenu(selectedText) {
  const template = [];

  if (selectedText) {
    template.push({ label: '复制', role: 'copy' });
    template.push({ label: '搜索', click: () => search(selectedText) });
    template.push({ type: 'separator' });
  }

  template.push({ label: '全选', role: 'selectAll' });

  return Menu.buildFromTemplate(template);
}

// 弹出动态菜单
ipcMain.on('show-context-menu', (event, selectedText) => {
  const menu = getContextMenu(selectedText);
  menu.popup({ window: BrowserWindow.fromWebContents(event.sender) });
});
```

## 系统托盘

### 创建托盘图标

```javascript
const { Tray, Menu, app } = require('electron');
const path = require('path');

let tray = null;

function createTray() {
  // 创建托盘图标
  tray = new Tray(path.join(__dirname, 'icon.png'));

  // 设置悬停提示
  tray.setToolTip('我的应用');

  // 创建右键菜单
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示窗口',
      click: () => {
        const win = BrowserWindow.getAllWindows()[0];
        if (win) {
          win.show();
          win.focus();
        }
      }
    },
    { type: 'separator' },
    {
      label: '功能一',
      click: () => console.log('功能一')
    },
    {
      label: '功能二',
      click: () => console.log('功能二')
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => app.quit()
    }
  ]);

  tray.setContextMenu(contextMenu);

  // 点击事件（通常用于显示窗口）
  tray.on('click', () => {
    const win = BrowserWindow.getAllWindows()[0];
    if (win) {
      win.show();
      win.focus();
    }
  });

  // 双击事件
  tray.on('double-click', () => {
    const win = BrowserWindow.getAllWindows()[0];
    if (win) {
      win.show();
      win.focus();
    }
  });
}
```

### 托盘右键菜单

```javascript
// 动态更新托盘菜单
function updateTrayMenu(status) {
  const contextMenu = Menu.buildFromTemplate([
    {
      label: `状态: ${status}`,
      enabled: false
    },
    { type: 'separator' },
    {
      label: '启用功能',
      type: 'checkbox',
      checked: true,
      click: (menuItem) => {
        console.log('启用功能:', menuItem.checked);
      }
    },
    {
      label: '设置',
      submenu: [
        { label: '选项 A', click: () => setOption('A') },
        { label: '选项 B', click: () => setOption('B') }
      ]
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => app.quit()
    }
  ]);

  tray.setContextMenu(contextMenu);
}
```

### 托盘图标提示

```javascript
// 更新提示文本
tray.setToolTip('应用正在运行...');

// 显示气泡通知（Windows）
tray.displayBalloon({
  iconType: 'info',
  title: '通知标题',
  content: '通知内容'
});
```

## 快捷键注册

### 全局快捷键

```javascript
const { globalShortcut } = require('electron');

app.whenReady().then(() => {
  // 注册全局快捷键
  globalShortcut.register('CommandOrControl+Shift+P', () => {
    console.log('快捷键触发');
    showQuickPanel();
  });

  // 注册多个快捷键
  globalShortcut.register('CommandOrControl+Shift+N', () => {
    createNewWindow();
  });
});

// 应用退出时注销快捷键
app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
```

### 检查快捷键注册

```javascript
// 检查快捷键是否已注册
if (globalShortcut.isRegistered('CommandOrControl+P')) {
  console.log('快捷键已注册');
}

// 注销单个快捷键
globalShortcut.unregister('CommandOrControl+P');

// 注销所有快捷键
globalShortcut.unregisterAll();
```

### 窗口级快捷键

```javascript
// 在特定窗口中使用 accelerator
const win = new BrowserWindow({
  webPreferences: {
    accelerator: (event) => {
      // 只在按下 Ctrl+Shift+A 时触发
      return event.ctrlKey && event.shiftKey && event.key === 'A';
    }
  }
});

// 或者使用 Menu 中的 accelerator
const template = [
  {
    label: '文件',
    submenu: [
      {
        label: '新建',
        accelerator: 'CmdOrCtrl+N',
        click: () => createNewWindow()
      }
    ]
  }
];
```

### 快捷键修饰符

| 修饰符 | Windows/Linux | macOS |
|--------|--------------|-------|
| `CommandOrControl` | Ctrl | Cmd |
| `Ctrl` | Ctrl | Ctrl |
| `Command` | - | Cmd |
| `Alt` | Alt | Alt |
| `Shift` | Shift | Shift |
| `Super` | Win | Cmd |

```javascript
// 组合快捷键示例
accelerator: 'CommandOrControl+Shift+P'
accelerator: 'Alt+F'
accelerator: 'CmdOrCtrl+Plus'  // Ctrl 加号
accelerator: 'F5'             // 功能键
accelerator: 'CommandOrControl+A'
```

## 剪贴板操作

```javascript
const { clipboard } = require('electron');

// 写入文本
clipboard.writeText('复制到剪贴板的文本');

// 读取文本
const text = clipboard.readText();

// 写入 HTML
clipboard.writeHTML('<b>粗体文本</b>');

// 读取 HTML
const html = clipboard.readHTML();

// 清空剪贴板
clipboard.clear();

// 读取图片
const image = clipboard.readImage();

// 写入图片
clipboard.writeImage(nativeImage);

// 写入格式化的字符串
clipboard.write({
  text: '文本内容',
  html: '<b>HTML内容</b>',
  image: nativeImage
});
```

## 系统对话框

### 打开文件/文件夹

```javascript
const { dialog } = require('electron');

async function openFile() {
  const result = await dialog.showOpenDialog({
    title: '选择文件',
    defaultPath: '/home',
    buttonLabel: '确认',
    properties: ['openFile'],
    filters: [
      { name: '文本文件', extensions: ['txt', 'md', 'json'] },
      { name: '图片', extensions: ['jpg', 'png', 'gif'] },
      { name: '所有文件', extensions: ['*'] }
    ]
  });

  if (result.canceled) {
    console.log('取消选择');
    return null;
  }

  return result.filePaths[0];
}

async function openFiles() {
  const result = await dialog.showOpenDialog({
    title: '选择多个文件',
    properties: ['openFile', 'multiSelections']
  });

  return result.filePaths;
}

async function openFolder() {
  const result = await dialog.showOpenDialog({
    title: '选择文件夹',
    properties: ['openDirectory']
  });

  return result.filePaths[0];
}
```

### 保存文件

```javascript
async function saveFile() {
  const result = await dialog.showSaveDialog({
    title: '保存文件',
    defaultPath: '/home/document.txt',
    buttonLabel: '保存',
    filters: [
      { name: '文本文件', extensions: ['txt'] },
      { name: '所有文件', extensions: ['*'] }
    ]
  });

  if (result.canceled) {
    return null;
  }

  return result.filePath;
}
```

### 消息对话框

```javascript
async function showMessage() {
  // 消息对话框
  const result = await dialog.showMessageBox({
    type: 'info',
    title: '提示',
    message: '确定要删除吗？',
    buttons: ['取消', '确定'],
    defaultId: 1,
    cancelId: 0
  });

  console.log('选择的按钮:', result.response); // 0 或 1
}

// 错误对话框
dialog.showErrorBox('错误', '文件不存在');

// 确认对话框
const result = await dialog.showMessageBox({
  type: 'question',
  buttons: ['是', '否'],
  title: '确认',
  message: '是否继续？'
});
```

### 托盘气泡通知（Windows）

```javascript
// 使用 Electron 通知
const { Notification } = require('electron');

const notification = new Notification({
  title: '新消息',
  body: '您有 3 条未读消息',
  icon: path.join(__dirname, 'icon.png'),
  silent: false
});

notification.show();

notification.on('click', () => {
  console.log('通知被点击');
});
```

## 系统 shell

```javascript
const { shell } = require('electron');

// 在文件管理器中显示文件
shell.showItemInFolder('/path/to/file.txt');

// 在默认应用中打开文件
shell.openPath('/path/to/file.txt');

// 在默认浏览器中打开 URL
shell.openExternal('https://example.com');

// 打开外部链接（受保护）
// 需要将 URL 加入 safeHosts
shell.openExternal('https://example.com', {
 激活: (protocol) => protocol === 'https'
});

// 移动文件到垃圾桶
shell.trashItem('/path/to/file.txt');

// 播放提示音
shell.beep();
```

## 电源监控

```javascript
const { powerMonitor } = require('electron');

// 获取电源状态
console.log('是否接通电源:', powerMonitor.isOnBatteryPower());

// 电源变化事件
powerMonitor.on('on-ac', () => {
  console.log('接通电源');
});

powerMonitor.on('on-battery', () => {
  console.log('使用电池');
});

// 系统空闲时间
console.log('空闲时间（秒）:', powerMonitor.getSystemIdleTime());

// 空闲状态变化
powerMonitor.on('on-idle', (idleTime) => {
  console.log('系统空闲', idleTime, '秒');
});

powerMonitor.on('on-active', () => {
  console.log('系统活动');
});
```

## 总结

本文介绍了 Electron 的系统集成能力：

| 功能 | API | 说明 |
|------|------|------|
| **应用菜单** | Menu.setApplicationMenu | 创建应用级菜单 |
| **上下文菜单** | Menu.popup | 右键菜单 |
| **系统托盘** | Tray | 托盘图标和菜单 |
| **快捷键** | globalShortcut | 全局快捷键 |
| **对话框** | dialog | 文件、消息对话框 |
| **剪贴板** | clipboard | 剪贴板操作 |
| **shell** | shell | 系统 shell 操作 |
| **电源监控** | powerMonitor | 电源状态 |

合理使用这些 API 可以让你的应用更好地融入操作系统。下一篇文章我们将学习 **文件系统与系统通知**，敬请期待！🖥️
