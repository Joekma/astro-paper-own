---
title: Electron 主进程与渲染进程详解
author: Joekma
pubDatetime: 2026-05-11T00:00:00.000+08:00
modDatetime: 2026-05-11T00:00:00.000+08:00
slug: electron-processes
description: '深入讲解Electron主进程与渲染进程的职责、生命周期、进程间通信原理及实际应用。'
tags:
  - Electron
  - 主进程
  - 渲染进程
  - 进程通信
draft: false
series: Electron
language: zh-CN
---

## 概述

Electron 的核心架构基于**多进程模型**，主要由**主进程（Main Process）**和**渲染进程（Renderer Process）**组成。理解这两种进程的职责边界和协作方式，是掌握 Electron 开发的关键。🔑

## 主进程详解

### 主进程的角色

主进程是 Electron 应用的"大脑"，负责管理整个应用的生命周期、操作系统交互和窗口管理。在一个应用中，有且只有一个主进程。

```
┌─────────────────────────────────────────────────────────────┐
│                      主进程 (Main Process)                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    app 模块                           │   │
│  │   └── 应用生命周期管理                                │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                 BrowserWindow                        │   │
│  │   └── 窗口创建与管理                                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                 原生模块集成                         │   │
│  │   ├── Menu（菜单）                                    │   │
│  │   ├── Tray（托盘）                                   │   │
│  │   ├── Dialog（对话框）                               │   │
│  │   └── shell（系统交互）                              │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                 系统能力访问                         │   │
│  │   ├── 文件系统 (fs)                                   │   │
│  │   ├── 网络请求 (http/https)                          │   │
│  │   └── 操作系统 API                                    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 主进程职责

| 职责 | 说明 |
|------|------|
| **生命周期管理** | 监听应用启动、退出、激活等事件 |
| **窗口管理** | 创建、销毁、调整窗口 |
| **菜单系统** | 创建应用菜单、右键菜单 |
| **系统托盘** | 托盘图标和菜单 |
| **系统对话框** | 文件选择、消息提示等 |
| **IPC 处理** | 接收并处理渲染进程的请求 |
| **原生能力** | 文件读写、系统通知、剪贴板等 |

### 主进程模块

#### app 模块

app 模块控制应用的生命周期：

```javascript
const { app } = require('electron');

// 应用准备就绪
app.whenReady().then(() => {
  console.log('✅ 应用已启动');
});

// 所有窗口关闭时
app.on('window-all-closed', () => {
  // macOS 除外，其他平台退出应用
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// macOS 应用激活时（ dock 点击）
app.on('activate', (event, hasVisibleWindows) => {
  if (!hasVisibleWindows) {
    createWindow();
  }
});

// 应用即将退出
app.on('will-quit', () => {
  console.log('👋 应用即将退出');
});

// 应用退出时
app.on('quit', (event, exitCode) => {
  console.log(`应用已退出，退出码: ${exitCode}`);
});
```

#### BrowserWindow 模块

BrowserWindow 是核心模块，用于创建和管理窗口：

```javascript
const { BrowserWindow } = require('electron');

let win = null;

function createWindow() {
  win = new BrowserWindow({
    width: 1200,              // 窗口宽度
    height: 800,              // 窗口高度
    minWidth: 800,            // 最小宽度
    minHeight: 600,           // 最小高度
    x: 100,                   // 窗口 x 坐标
    y: 100,                   // 窗口 y 坐标
    title: '我的应用',         // 窗口标题
    backgroundColor: '#ffffff', // 背景色
    show: false,              // 创建后不显示，等加载完成再显示
    frame: true,              // 是否显示窗口边框（false 可自定义标题栏）
    titleBarStyle: 'hidden',  // macOS 隐藏标题栏
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  // 加载内容
  win.loadFile('index.html');
  // 或加载 URL
  // win.loadURL('https://example.com');

  // 窗口准备好后显示（解决白屏问题）
  win.once('ready-to-show', () => {
    win.show();
  });

  // 窗口关闭时
  win.on('closed', () => {
    win = null;
  });
}
```

### 窗口事件

```javascript
win.on('ready-to-show', () => {
  console.log('窗口即将显示');
});

win.on('show', () => {
  console.log('窗口已显示');
});

win.on('hide', () => {
  console.log('窗口已隐藏');
});

win.on('focus', () => {
  console.log('窗口获得焦点');
});

win.on('blur', () => {
  console.log('窗口失去焦点');
});

win.on('maximize', () => {
  console.log('窗口已最大化');
});

win.on('unmaximize', () => {
  console.log('窗口已取消最大化');
});

win.on('minimize', () => {
  console.log('窗口已最小化');
});

win.on('close', (event) => {
  console.log('窗口即将关闭');
  // 可以阻止关闭
  // event.preventDefault();
});
```

### 窗口操作方法

```javascript
// 显示窗口
win.show();
win.showInactive();  // 显示但不带焦点

// 隐藏窗口
win.hide();

// 关闭窗口
win.close();

// 最小化
win.minimize();

// 最大化
win.maximize();

// 取消最大化
win.unmaximize();

// 恢复原始大小
win.unmaximize();

// 设置全屏
win.setFullScreen(true);

// 设置窗口位置
win.setPosition(x, y);

// 设置窗口大小
win.setSize(width, height);

// 获取窗口边界
const bounds = win.getBounds();
// { x: 100, y: 100, width: 1200, height: 800 }

// 聚焦
win.focus();

// 刷新
win.reload();

// 打开开发者工具
win.webContents.openDevTools();
```

## 渲染进程详解

### 渲染进程的角色

渲染进程负责显示网页内容，每个 BrowserWindow 实例都对应一个渲染进程。它运行在 Chromium 环境中，可以执行 HTML、CSS 和 JavaScript。

```
┌─────────────────────────────────────────────────────────────┐
│                    渲染进程 (Renderer Process)                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    HTML/CSS                          │   │
│  │   └── 页面结构和样式                                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    JavaScript                        │   │
│  │   ├── DOM 操作                                       │   │
│  │   ├── 事件处理                                       │   │
│  │   └── Web APIs                                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    Preload API                        │   │
│  │   └── 暴露给渲染进程的受控 API                        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 渲染进程限制

渲染进程中无法直接：
- 访问 Node.js 模块（如 `fs`、`path`、`http`）
- 访问 Electron 主进程 API
- 操作系统级别的操作

### WebContents 模块

webContents 是渲染进程的核心对象，提供网页控制和通信能力：

```javascript
// 在主进程中访问 webContents
win.webContents.on('did-finish-load', () => {
  console.log('页面加载完成');
});

win.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
  console.log(`加载失败: ${errorDescription}`);
});

win.webContents.on('did-frame-finish-load', (event, isMainFrame) => {
  console.log(`帧加载完成, 主帧: ${isMainFrame}`);
});

// 执行渲染进程中的代码
win.webContents.executeJavaScript('console.log("Hello")');

// 获取页面标题
const title = win.webContents.getTitle();

// 获取 URL
const url = win.webContents.getURL();

// 获取加载进度
win.webContents.on('did-change-progress', (event, progress) => {
  console.log(`加载进度: ${progress * 100}%`);
});
```

### 渲染进程中的 window 对象

```javascript
// renderer.js
// 注意：默认情况下 nodeIntegration 为 false
// 无法直接使用 require 或 node 模块

// 只能使用标准 Web APIs
document.querySelector('#btn').addEventListener('click', () => {
  alert('Hello Electron!');
});

// 使用 fetch 进行网络请求
fetch('https://api.example.com/data')
  .then(res => res.json())
  .then(data => console.log(data));

// 使用 localStorage
localStorage.setItem('theme', 'dark');
const theme = localStorage.getItem('theme');

// 使用 IndexedDB
const db = indexedDB.open('myDatabase', 1);
```

## 多窗口管理

### 创建多个窗口

```javascript
const { app, BrowserWindow } = require('electron');

let mainWindow = null;
let settingsWindow = null;

app.whenReady().then(() => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: '主窗口'
  });
  mainWindow.loadFile('index.html');

  mainWindow.on('closed', () => {
    mainWindow = null;
    // 关闭主窗口时也可以关闭设置窗口
    if (settingsWindow) {
      settingsWindow.close();
    }
  });
});

function openSettings() {
  if (settingsWindow) {
    settingsWindow.focus();
    return;
  }

  settingsWindow = new BrowserWindow({
    width: 600,
    height: 400,
    title: '设置',
    parent: mainWindow,  // 设为模态窗口
    modal: true
  });
  settingsWindow.loadFile('settings.html');

  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });
}
```

### 父子窗口关系

```javascript
const childWindow = new BrowserWindow({
  width: 400,
  height: 300,
  parent: mainWindow,  // 指定父窗口
  modal: true          // 模态窗口
});
```

### 获取所有窗口

```javascript
const { BrowserWindow } = require('electron');

const allWindows = BrowserWindow.getAllWindows();
console.log(`当前共有 ${allWindows.length} 个窗口`);

// 获取焦点窗口
const focusedWindow = BrowserWindow.getFocusedWindow();

// 按 ID 获取窗口
const windowById = BrowserWindow.fromId(1);
```

## BrowserView（浏览器视图）

BrowserView 允许在窗口中嵌入网页内容：

```javascript
const { BrowserView, BrowserWindow } = require('electron');

app.whenReady().then(() => {
  const win = new BrowserWindow({ width: 1200, height: 800 });

  const view = new BrowserView({
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  });

  win.setBrowserView(view);
  view.setBounds({ x: 0, y: 0, width: 800, height: 600 });
  view.loadURL('https://example.com');
});
```

## 应用场景示例

### 场景一：多标签应用

```javascript
const { app, BrowserWindow, ipcMain } = require('electron');

let mainWindow = null;
const tabs = [];

app.whenReady().then(() => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  });
  mainWindow.loadFile('index.html');
});

ipcMain.handle('open-tab', async (event, url) => {
  const tabWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  });
  tabWindow.loadURL(url);
  tabs.push(tabWindow);
  return tabs.length;
});

ipcMain.handle('close-tab', async (event, index) => {
  if (tabs[index]) {
    tabs[index].close();
    tabs.splice(index, 1);
  }
});
```

### 场景二：分屏应用

```javascript
const { app, BrowserWindow } = require('electron');

app.whenReady().then(() => {
  const mainWindow = new BrowserWindow({ width: 1200, height: 800 });

  const view1 = new BrowserView({
    webPreferences: { preload: path.join(__dirname, 'preload.js') }
  });
  const view2 = new BrowserView({
    webPreferences: { preload: path.join(__dirname, 'preload.js') }
  });

  mainWindow.setBrowserView(view1);
  mainWindow.setBrowserView(view2);

  // 左半边
  view1.setBounds({ x: 0, y: 0, width: 600, height: 800 });
  view1.loadFile('panel1.html');

  // 右半边
  view2.setBounds({ x: 600, y: 0, width: 600, height: 800 });
  view2.loadFile('panel2.html');
});
```

## 总结

本文深入介绍了 Electron 的进程模型：

| 概念 | 说明 |
|------|------|
| **主进程** | 应用入口，管理窗口、菜单、系统交互 |
| **渲染进程** | 运行在 Chromium 中，显示网页内容 |
| **BrowserWindow** | 窗口管理的核心 API |
| **webContents** | 控制渲染进程网页内容 |
| **多窗口** | 支持父子窗口、模态窗口、分屏等 |
| **BrowserView** | 在窗口中嵌入网页内容 |

下一篇文章我们将学习 **预加载脚本与安全机制**，敬请期待！🚀
